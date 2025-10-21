// Migration Planning Wizard API Endpoints
use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use chrono::Utc;
use serde_json::json;
use std::sync::Arc;
use tokio::fs;
use tokio::io::AsyncWriteExt;

use crate::database::Database;
use crate::models::migration_wizard_models::*;
use crate::services::migration_wizard_service::MigrationWizardService;
use crate::utils::api_response::{ApiResponse, helpers};

pub fn create_migration_wizard_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/projects", post(create_project))
        .route("/projects", get(list_projects))
        .route("/projects/:id", get(get_project))
        .route("/projects/:id/rvtools", post(upload_rvtools))
        .route("/projects/:id/vms", get(get_project_vms))
        .with_state(db)
}

// =============================================================================
// PROJECT MANAGEMENT
// =============================================================================

/// Create a new migration wizard project
/// POST /api/v1/migration-wizard/projects
async fn create_project(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateProjectRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Creating migration wizard project: {}", payload.name);

    let service = MigrationWizardService::new((**db).clone());
    
    match service.create_project(payload.name, payload.description).await {
        Ok(project) => {
            let project_id = project.id.as_ref()
                .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                .unwrap_or_else(|| "unknown".to_string());

            let response = CreateProjectResponse {
                id: project_id,
                name: project.name,
                status: project.status,
                created_at: project.created_at,
            };

            Ok((StatusCode::CREATED, Json(json!({
                "success": true,
                "result": response
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to create project: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": e.to_string()
                }))
            ))
        }
    }
}

/// List all migration wizard projects
/// GET /api/v1/migration-wizard/projects?status=draft&limit=10
async fn list_projects(
    State(db): State<Arc<Database>>,
    Query(filter): Query<ProjectFilter>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Listing migration wizard projects");

    let service = MigrationWizardService::new((**db).clone());
    
    match service.list_projects(Some(filter)).await {
        Ok(projects) => {
            let total = projects.len();
            let response = ListProjectsResponse { projects, total };

            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": response
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to list projects: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": e.to_string()
                }))
            ))
        }
    }
}

/// Get a single project with details
/// GET /api/v1/migration-wizard/projects/:id
async fn get_project(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting migration wizard project: {}", project_id);

    let service = MigrationWizardService::new((**db).clone());
    
    match service.get_project(&project_id).await {
        Ok(project) => {
            // Get associated VMs and clusters
            let vms = service.get_project_vms(&project_id, None).await.unwrap_or_default();
            
            // TODO: Get clusters when cluster API is implemented
            let clusters = Vec::new();

            let response = ProjectDetailsResponse {
                project,
                vms,
                clusters,
            };

            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": response
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get project: {}", e);
            Err((
                StatusCode::NOT_FOUND,
                Json(json!({
                    "success": false,
                    "error": "Project not found"
                }))
            ))
        }
    }
}

// =============================================================================
// RVTOOLS UPLOAD
// =============================================================================

/// Upload RVTools Excel file
/// POST /api/v1/migration-wizard/projects/:id/rvtools
async fn upload_rvtools(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Uploading RVTools file for project: {}", project_id);

    // Verify project exists
    let service = MigrationWizardService::new((**db).clone());
    if service.get_project(&project_id).await.is_err() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({
                "success": false,
                "error": "Project not found"
            }))
        ));
    }

    // Create uploads directory if it doesn't exist
    let upload_dir = std::path::Path::new("uploads/rvtools");
    if !upload_dir.exists() {
        fs::create_dir_all(upload_dir)
            .await
            .map_err(|e| {
                tracing::error!("Failed to create upload directory: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "success": false,
                        "error": "Failed to create upload directory"
                    }))
                )
            })?;
    }

    // Process multipart form data
    let mut filename = String::new();
    let mut file_path = std::path::PathBuf::new();

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "file" {
            filename = field.file_name().unwrap_or("rvtools.xlsx").to_string();
            let data = field.bytes().await.map_err(|e| {
                tracing::error!("Failed to read file data: {}", e);
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "success": false,
                        "error": "Failed to read file"
                    }))
                )
            })?;

            // Save file
            file_path = upload_dir.join(format!("{}_{}", project_id, filename));
            let mut file = fs::File::create(&file_path).await.map_err(|e| {
                tracing::error!("Failed to create file: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "success": false,
                        "error": "Failed to save file"
                    }))
                )
            })?;

            file.write_all(&data).await.map_err(|e| {
                tracing::error!("Failed to write file: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "success": false,
                        "error": "Failed to write file"
                    }))
                )
            })?;

            tracing::info!("Saved RVTools file to: {}", file_path.display());
        }
    }

    if filename.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "error": "No file provided"
            }))
        ));
    }

    // Delete existing VMs if any (allow re-upload)
    service.delete_project_vms(&project_id).await.ok();

    // Process RVTools file
    match service.process_rvtools_file(&project_id, &file_path, filename.clone()).await {
        Ok(vm_count) => {
            let response = UploadRVToolsResponse {
                project_id: project_id.clone(),
                filename,
                total_vms: vm_count as i32,
                upload_date: Utc::now(),
                processing_status: "completed".to_string(),
            };

            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": response
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to process RVTools file: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": format!("Failed to process RVTools file: {}", e)
                }))
            ))
        }
    }
}

// =============================================================================
// VM MANAGEMENT
// =============================================================================

/// Get VMs for a project
/// GET /api/v1/migration-wizard/projects/:id/vms?cluster=Production&limit=100
async fn get_project_vms(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
    Query(filter): Query<VMFilter>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting VMs for project: {}", project_id);

    let service = MigrationWizardService::new((**db).clone());
    
    match service.get_project_vms(&project_id, Some(filter)).await {
        Ok(vms) => {
            let total = vms.len();
            let response = ListVMsResponse { vms, total };

            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": response
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get VMs: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": e.to_string()
                }))
            ))
        }
    }
}
