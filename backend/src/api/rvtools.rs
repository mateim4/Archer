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
    services::rvtools_service::{RvToolsService, RvToolsUploadData, RvToolsSyncOptions},
    models::project_models::*,
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
    let mut csv_content = None;
    let mut project_id = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::BadRequest(e.to_string()))? {
        let name = field.name().unwrap_or("").to_string();
        
        match name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                let data = field.bytes().await.map_err(|e| ApiError::BadRequest(e.to_string()))?;
                csv_content = Some(String::from_utf8_lossy(&data).to_string());
            }
            "project_id" => {
                let data = field.bytes().await.map_err(|e| ApiError::BadRequest(e.to_string()))?;
                let project_id_str = String::from_utf8_lossy(&data).to_string();
                if !project_id_str.is_empty() {
                    project_id = Some(surrealdb::sql::Thing::from(("project", project_id_str.as_str())));
                }
            }
            _ => {}
        }
    }

    let filename = filename.ok_or_else(|| ApiError::BadRequest("No file uploaded".to_string()))?;
    let csv_content = csv_content.ok_or_else(|| ApiError::BadRequest("No file content".to_string()))?;

    if !filename.to_lowercase().ends_with(".csv") {
        return Err(ApiError::BadRequest("Only CSV files are supported".to_string()));
    }

    let upload_data = RvToolsUploadData {
        filename,
        csv_content,
        project_id,
    };

    let service = RvToolsService::new((*db).clone());
    
    match service.process_rvtools_upload(upload_data).await {
        Ok(result) => Ok((StatusCode::CREATED, Json(RvToolsUploadResponse {
            upload_id: result.upload_id,
            servers_processed: result.servers_processed,
            servers_added_to_pool: result.servers_added_to_pool,
            processing_errors: result.processing_errors,
            summary: result.summary,
            upload_timestamp: Utc::now(),
        }))),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
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
    
    query_str.push_str(" ORDER BY upload_timestamp DESC");
    
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
            Ok(Json(RvToolsUploadsListResponse {
                uploads,
                total,
            }))
        },
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn get_upload(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let upload: Result<Option<RvToolsUpload>, _> = db
        .select(("rvtools_upload", upload_id.as_str()))
        .await;

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
        },
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
    
    match service.sync_rvtools_to_hardware_pool(upload_id, sync_options).await {
        Ok(result) => Ok((StatusCode::CREATED, Json(RvToolsSyncResponse {
            upload_id: result.upload_id,
            servers_synced: result.servers_synced,
            synced_server_ids: result.synced_server_ids,
            sync_errors: result.sync_errors,
            sync_timestamp: result.sync_timestamp,
        }))),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

async fn get_analytics(
    State(db): State<Arc<Database>>,
) -> Result<impl IntoResponse, ApiError> {
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
    
    match service.get_rvtools_analytics(Some(project_id.clone())).await {
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

        (status, Json(serde_json::json!({
            "error": message
        }))).into_response()
    }
}
