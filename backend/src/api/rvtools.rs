use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

use crate::{
    database::Database,
    models::project_models::*,
    services::enhanced_rvtools_service::{
        EnhancedRvToolsProcessingResult, EnhancedRvToolsService, RvToolsExcelUploadData,
    },
    services::rvtools_service::{RvToolsService, RvToolsSyncOptions, RvToolsUploadData},
};

pub fn create_rvtools_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/upload", post(upload_rvtools))
        .route("/uploads", get(list_uploads))
        .route("/uploads/:upload_id", get(get_upload))
        .route("/uploads/:upload_id/data", get(get_upload_data))
        .route("/uploads/:upload_id/sync", post(sync_to_hardware_pool))
        .route("/analytics", get(get_analytics))
        .route("/analytics/project/:project_id", get(get_project_analytics))
        .with_state(db)
}

// =============================================================================
// RVTOOLS UPLOAD AND PROCESSING
// =============================================================================

async fn upload_rvtools(
    State(db): State<Arc<Database>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, ApiError> {
    let mut filename = None;
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut project_id = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| ApiError::BadRequest(e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| ApiError::BadRequest(e.to_string()))?;
                file_bytes = Some(data.to_vec());
            }
            "project_id" => {
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| ApiError::BadRequest(e.to_string()))?;
                let project_id_str = String::from_utf8_lossy(&data).to_string();
                if !project_id_str.is_empty() {
                    project_id = Some(surrealdb::sql::Thing::from((
                        "project",
                        project_id_str.as_str(),
                    )));
                }
            }
            _ => {}
        }
    }

    let filename = filename.ok_or_else(|| ApiError::BadRequest("No file uploaded".to_string()))?;
    let file_bytes =
        file_bytes.ok_or_else(|| ApiError::BadRequest("No file content".to_string()))?;

    let extension = filename
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase();

    match extension.as_str() {
        "csv" => {
            let csv_content = String::from_utf8(file_bytes).map_err(|_| {
                ApiError::BadRequest("RVTools CSV must be UTF-8 encoded".to_string())
            })?;

            let upload_data = RvToolsUploadData {
                filename,
                csv_content,
                project_id,
            };

            let service = RvToolsService::new((*db).clone());

            match service.process_rvtools_upload(upload_data).await {
                Ok(result) => Ok((
                    StatusCode::CREATED,
                    Json(RvToolsUploadResponse {
                        upload_id: result.upload_id,
                        servers_processed: result.servers_processed,
                        servers_added_to_pool: result.servers_added_to_pool,
                        processing_errors: result.processing_errors,
                        summary: result.summary,
                        upload_timestamp: Utc::now(),
                    }),
                )),
                Err(e) => Err(ApiError::InternalError(e.to_string())),
            }
        }
        "xlsx" | "xls" => {
            let upload_data = RvToolsExcelUploadData {
                filename,
                excel_data: file_bytes,
                project_id,
            };

            let service = EnhancedRvToolsService::new((*db).clone());

            match service.process_rvtools_excel(upload_data).await {
                Ok(result) => {
                    let summary = build_summary_from_enhanced(&result);
                    let processing_errors = merge_enhanced_processing_issues(&result);

                    Ok((
                        StatusCode::CREATED,
                        Json(RvToolsUploadResponse {
                            upload_id: result.upload_id,
                            servers_processed: result.total_rows_processed as usize,
                            servers_added_to_pool: 0,
                            processing_errors,
                            summary,
                            upload_timestamp: Utc::now(),
                        }),
                    ))
                }
                Err(e) => Err(ApiError::InternalError(e.to_string())),
            }
        }
        _ => Err(ApiError::BadRequest(
            "Unsupported RVTools file format. Upload CSV or XLSX exports.".to_string(),
        )),
    }
}

async fn list_uploads(
    State(db): State<Arc<Database>>,
    Query(query): Query<ListUploadsQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let mut conditions = Vec::new();

    if let Some(project_id) = query.project_id {
        conditions.push(format!("project_id = project:{}", project_id));
    }
    if let Some(processed) = query.processed {
        conditions.push(format!("processed = {}", processed));
    }

    let mut query_str = "SELECT * FROM rvtools_upload".to_string();

    if !conditions.is_empty() {
        query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }

    query_str.push_str(" ORDER BY uploaded_at DESC");

    if let Some(limit) = query.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
    }

    let uploads: Result<Vec<RvToolsUpload>, _> = db
        .query(query_str)
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match uploads {
        Ok(uploads) => {
            let total = uploads.len();
            Ok(Json(RvToolsUploadsListResponse { uploads, total }))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

fn build_summary_from_enhanced(
    result: &EnhancedRvToolsProcessingResult,
) -> crate::services::rvtools_service::RvToolsProcessingSummary {
    let (total_cpu_cores, total_memory_gb) = result
        .storage_analysis
        .as_ref()
        .map(|analysis| {
            let cpu = analysis
                .metadata
                .get("total_cpu_cores")
                .and_then(|value| value.as_i64())
                .unwrap_or(0) as i32;

            let memory = analysis
                .metadata
                .get("total_memory_gb")
                .and_then(|value| value.as_f64())
                .unwrap_or(0.0)
                .round() as i32;

            (cpu, memory)
        })
        .unwrap_or((0, 0));

    let unique_vendors = result
        .storage_analysis
        .as_ref()
        .and_then(|analysis| analysis.metadata.get("unique_vendors"))
        .and_then(|value| value.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default();

    let mut deployment_recommendations = result
        .storage_analysis
        .as_ref()
        .map(|analysis| analysis.recommendations.clone())
        .unwrap_or_default();

    if deployment_recommendations.is_empty() {
        deployment_recommendations.push(
            "Review the enhanced RVTools analysis for detailed storage and compliance insights."
                .to_string(),
        );
    }

    crate::services::rvtools_service::RvToolsProcessingSummary {
        total_cpu_cores,
        total_memory_gb,
        unique_vendors,
        deployment_recommendations,
    }
}

fn merge_enhanced_processing_issues(
    result: &EnhancedRvToolsProcessingResult,
) -> Vec<crate::services::rvtools_service::RvToolsProcessingError> {
    let mut issues: Vec<crate::services::rvtools_service::RvToolsProcessingError> = result
        .processing_errors
        .iter()
        .map(
            |error| crate::services::rvtools_service::RvToolsProcessingError {
                line_number: error.line_number,
                server_name: error.server_name.clone(),
                error: error.error.clone(),
            },
        )
        .collect();

    issues.extend(result.warnings.iter().map(|warning| {
        crate::services::rvtools_service::RvToolsProcessingError {
            line_number: warning.line_number,
            server_name: warning.server_name.clone(),
            error: format!("Warning: {}", warning.error),
        }
    }));

    issues
}

async fn get_upload(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let upload: Result<Option<RvToolsUpload>, _> =
        db.select(("rvtools_upload", upload_id.as_str())).await;

    match upload {
        Ok(Some(upload)) => Ok(Json(upload)),
        Ok(None) => Err(ApiError::NotFound("Upload not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn get_upload_data(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
    Query(query): Query<UploadDataQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let upload_thing = surrealdb::sql::Thing::from(("rvtools_upload", upload_id.as_str()));

    let mut query_str = "SELECT * FROM rvtools_data WHERE upload_id = $upload_id".to_string();

    if let Some(vm_name) = query.vm_name_filter {
        query_str.push_str(&format!(" AND vm_name CONTAINS '{}'", vm_name));
    }

    query_str.push_str(" ORDER BY line_number");

    if let Some(limit) = query.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
        if let Some(offset) = query.offset {
            query_str.push_str(&format!(" START {}", offset));
        }
    }

    let data: Result<Vec<RvToolsData>, _> = db
        .query(query_str)
        .bind(("upload_id", upload_thing))
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match data {
        Ok(data) => {
            let total = data.len();
            Ok(Json(RvToolsDataResponse {
                upload_id,
                data,
                total,
            }))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// HARDWARE POOL SYNCHRONIZATION
// =============================================================================

async fn sync_to_hardware_pool(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
    Json(sync_options): Json<RvToolsSyncOptions>,
) -> Result<impl IntoResponse, ApiError> {
    let service = RvToolsService::new((*db).clone());

    match service
        .sync_rvtools_to_hardware_pool(upload_id, sync_options)
        .await
    {
        Ok(result) => Ok((
            StatusCode::CREATED,
            Json(RvToolsSyncResponse {
                upload_id: result.upload_id,
                servers_synced: result.servers_synced,
                synced_server_ids: result.synced_server_ids,
                sync_errors: result.sync_errors,
                sync_timestamp: result.sync_timestamp,
            }),
        )),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

async fn get_analytics(State(db): State<Arc<Database>>) -> Result<impl IntoResponse, ApiError> {
    let service = RvToolsService::new((*db).clone());

    match service.get_rvtools_analytics(None).await {
        Ok(analytics) => Ok(Json(analytics)),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn get_project_analytics(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let service = RvToolsService::new((*db).clone());

    match service
        .get_rvtools_analytics(Some(project_id.clone()))
        .await
    {
        Ok(analytics) => Ok(Json(RvToolsProjectAnalyticsResponse {
            project_id,
            analytics,
            generated_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Serialize)]
struct RvToolsUploadResponse {
    upload_id: surrealdb::sql::Thing,
    servers_processed: usize,
    servers_added_to_pool: usize,
    processing_errors: Vec<crate::services::rvtools_service::RvToolsProcessingError>,
    summary: crate::services::rvtools_service::RvToolsProcessingSummary,
    upload_timestamp: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct ListUploadsQuery {
    project_id: Option<String>,
    processed: Option<bool>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize)]
struct RvToolsUploadsListResponse {
    uploads: Vec<RvToolsUpload>,
    total: usize,
}

#[derive(Debug, Deserialize)]
struct UploadDataQuery {
    vm_name_filter: Option<String>,
    limit: Option<usize>,
    offset: Option<usize>,
}

#[derive(Debug, Serialize)]
struct RvToolsDataResponse {
    upload_id: String,
    data: Vec<RvToolsData>,
    total: usize,
}

#[derive(Debug, Serialize)]
struct RvToolsSyncResponse {
    upload_id: surrealdb::sql::Thing,
    servers_synced: usize,
    synced_server_ids: Vec<surrealdb::sql::Thing>,
    sync_errors: Vec<crate::services::rvtools_service::RvToolsSyncError>,
    sync_timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
struct RvToolsProjectAnalyticsResponse {
    project_id: String,
    analytics: crate::services::rvtools_service::RvToolsAnalytics,
    generated_at: DateTime<Utc>,
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

#[derive(Debug)]
enum ApiError {
    BadRequest(String),
    NotFound(String),
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (
            status,
            Json(serde_json::json!({
                "error": message
            })),
        )
            .into_response()
    }
}
