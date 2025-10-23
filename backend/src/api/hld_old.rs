//! HLD Generation API
//!
//! Endpoints for generating High-Level Design documents.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;

use crate::{
    database::Database,
    models::project_models::GeneratedDocument,
    services::hld_generation_service::{
        HLDGenerationRequest, HLDGenerationResult, HLDGenerationService,
    },
};

pub fn create_hld_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/generate", post(generate_hld))
        .route("/documents/:project_id", get(list_project_documents))
        .route("/documents/:project_id/:document_id", get(get_document))
        .route("/documents/:project_id/:document_id/download", get(download_document))
        .with_state(db)
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Serialize)]
pub struct GenerateHLDResponse {
    pub success: bool,
    pub result: HLDGenerationResult,
}

#[derive(Debug, Serialize)]
pub struct DocumentsListResponse {
    pub success: bool,
    pub documents: Vec<GeneratedDocument>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct DocumentResponse {
    pub success: bool,
    pub document: GeneratedDocument,
}

// =============================================================================
// HLD GENERATION ENDPOINTS
// =============================================================================

/// Generate HLD document for a project
///
/// POST /hld/generate
///
/// Creates a comprehensive High-Level Design document in Word format
/// with all specified sections included.
async fn generate_hld(
    State(db): State<Arc<Database>>,
    Json(request): Json<HLDGenerationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Determine output directory (should be configurable via env var)
    let output_dir = std::env::var("HLD_OUTPUT_DIR")
        .unwrap_or_else(|_| "/tmp/lcm-designer/hld".to_string());
    let output_path = PathBuf::from(output_dir);

    let service = HLDGenerationService::new(db.as_ref().clone(), output_path);

    match service.generate_hld(request).await {
        Ok(result) => Ok((
            StatusCode::OK,
            Json(GenerateHLDResponse {
                success: true,
                result,
            }),
        )),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// List all documents for a project
///
/// GET /hld/documents/:project_id
///
/// Returns all generated documents (HLD, LLD, etc.) for the specified project.
async fn list_project_documents(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let query = "SELECT * FROM generated_document WHERE project_id = $project_id ORDER BY generated_at DESC";

    match db
        .query(query)
        .bind(("project_id", project_id))
        .await
    {
        Ok(mut result) => {
            let documents: Vec<GeneratedDocument> = result.take(0).unwrap_or_default();
            let total = documents.len();

            Ok((
                StatusCode::OK,
                Json(DocumentsListResponse {
                    success: true,
                    documents,
                    total,
                }),
            ))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Get a specific document
///
/// GET /hld/documents/:project_id/:document_id
///
/// Returns metadata for a specific generated document.
async fn get_document(
    State(db): State<Arc<Database>>,
    Path((project_id, document_id)): Path<(String, String)>,
)  -> Result<impl IntoResponse, ApiError> {
    let query = "SELECT * FROM generated_document WHERE id = $document_id AND project_id = $project_id";

    match db
        .query(query)
        .bind(("document_id", document_id))
        .bind(("project_id", project_id))
        .await
    {
        Ok(mut result) => {
            let documents: Vec<GeneratedDocument> = result.take(0).unwrap_or_default();

            if let Some(document) = documents.into_iter().next() {
                Ok((
                    StatusCode::OK,
                    Json(DocumentResponse {
                        success: true,
                        document,
                    }),
                ))
            } else {
                Err(ApiError::NotFound("Document not found".to_string()))
            }
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Download a generated document
///
/// GET /hld/documents/:project_id/:document_id/download
///
/// Returns the actual file content for download.
async fn download_document(
    State(db): State<Arc<Database>>,
    Path((project_id, document_id)): Path<(String, String)>,
) -> Result<impl IntoResponse, ApiError> {
    // First, get the document metadata to retrieve file path
    let query = "SELECT * FROM generated_document WHERE id = $document_id AND project_id = $project_id";

    match db
        .query(query)
        .bind(("document_id", document_id))
        .bind(("project_id", project_id))
        .await
    {
        Ok(mut result) => {
            let documents: Vec<GeneratedDocument> = result.take(0).unwrap_or_default();

            if let Some(document) = documents.into_iter().next() {
                // Read file content
                match std::fs::read(&document.file_path) {
                    Ok(content) => {
                        // Extract filename from path
                        let filename = std::path::Path::new(&document.file_path)
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("document.docx")
                            .to_string();

                        let content_disposition = format!("attachment; filename=\"{}\"", filename);

                        // Return file with appropriate headers
                        Ok((
                            StatusCode::OK,
                            [
                                ("Content-Type".to_string(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_string()),
                                ("Content-Disposition".to_string(), content_disposition),
                            ],
                            content,
                        ))
                    }
                    Err(e) => Err(ApiError::InternalError(format!(
                        "Failed to read file: {}",
                        e
                    ))),
                }
            } else {
                Err(ApiError::NotFound("Document not found".to_string()))
            }
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

#[derive(Debug)]
pub enum ApiError {
    InternalError(String),
    BadRequest(String),
    NotFound(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
        };

        let body = Json(serde_json::json!({
            "error": message,
        }));

        (status, body).into_response()
    }
}
