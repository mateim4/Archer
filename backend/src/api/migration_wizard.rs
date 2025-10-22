// Migration Planning Wizard API Endpoints
use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{delete, get, post, put},
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
        .route("/projects/:id/strategy-analysis", get(analyze_project_strategy))
        .route("/projects/:id/strategy-stats", get(get_project_strategy_stats))
        .route("/projects/:id/clusters", post(create_cluster))
        .route("/projects/:id/clusters", get(get_project_clusters))
        .route("/projects/:id/auto-place", post(auto_place_vms))
        .route("/projects/:id/placements", post(create_manual_placement))
        .route("/projects/:id/placements", get(get_project_placements))
        .route("/projects/:id/cluster-utilization", get(get_cluster_utilization))
        .route("/clusters/:id", get(get_cluster))
        .route("/clusters/:id", put(update_cluster))
        .route("/clusters/:id", delete(delete_cluster))
        .route("/placements/:id", delete(delete_placement))
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

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.create_project(payload.name, payload.description).await {
        Ok(project) => {
            // Extract project ID from Thing (format: migration_wizard_project:abc123)
            let project_id = project.id.as_ref()
                .map(|thing| {
                    // Convert the Thing ID to string
                    match &thing.id {
                        surrealdb::sql::Id::String(s) => s.clone(),
                        surrealdb::sql::Id::Number(n) => n.to_string(),
                        _ => format!("{:?}", thing.id)
                    }
                })
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

    let service = MigrationWizardService::new(db.as_ref().clone());
    
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

    let service = MigrationWizardService::new(db.as_ref().clone());
    
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
    let service = MigrationWizardService::new(db.as_ref().clone());
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

    let service = MigrationWizardService::new(db.as_ref().clone());
    
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

// =============================================================================
// STRATEGY ANALYSIS
// =============================================================================

/// Analyze all VMs in a project and recommend migration strategies
/// GET /api/v1/migration-wizard/projects/:id/strategy-analysis
async fn analyze_project_strategy(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Analyzing migration strategy for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.analyze_project_strategy(&project_id).await {
        Ok(recommendations) => {
            // Calculate stats
            match service.get_project_strategy_stats(&project_id).await {
                Ok(stats) => {
                    Ok((StatusCode::OK, Json(json!({
                        "success": true,
                        "result": {
                            "recommendations": recommendations,
                            "stats": stats
                        }
                    }))))
                }
                Err(e) => {
                    tracing::error!("Failed to calculate stats: {}", e);
                    // Return recommendations without stats
                    Ok((StatusCode::OK, Json(json!({
                        "success": true,
                        "result": {
                            "recommendations": recommendations,
                        }
                    }))))
                }
            }
        }
        Err(e) => {
            tracing::error!("Failed to analyze strategy: {}", e);
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

/// Get strategy statistics for a project
/// GET /api/v1/migration-wizard/projects/:id/strategy-stats
async fn get_project_strategy_stats(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting strategy statistics for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.get_project_strategy_stats(&project_id).await {
        Ok(stats) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": stats
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get strategy stats: {}", e);
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

// =============================================================================
// CLUSTER MANAGEMENT
// =============================================================================

/// Create a new destination cluster
/// POST /api/v1/migration-wizard/projects/:id/clusters
async fn create_cluster(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Creating cluster for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());

    // Parse cluster data
    let name = payload.get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| (
            StatusCode::BAD_REQUEST,
            Json(json!({ "success": false, "error": "Missing 'name' field" }))
        ))?;

    let cluster = MigrationWizardCluster {
        id: None,
        project_id: surrealdb::sql::Thing::from(("migration_wizard_project", project_id.as_str())),
        name: name.to_string(),
        description: payload.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
        cpu_ghz: payload.get("cpu_ghz").and_then(|v| v.as_f64()).unwrap_or(2.4),
        total_cores: payload.get("total_cores").and_then(|v| v.as_i64()).unwrap_or(128) as i32,
        memory_gb: payload.get("memory_gb").and_then(|v| v.as_i64()).unwrap_or(512) as i32,
        storage_tb: payload.get("storage_tb").and_then(|v| v.as_f64()).unwrap_or(10.0),
        network_bandwidth_gbps: payload.get("network_bandwidth_gbps").and_then(|v| v.as_f64()).unwrap_or(10.0),
        cpu_oversubscription_ratio: payload.get("cpu_oversubscription_ratio").and_then(|v| v.as_f64()).unwrap_or(1.0),
        memory_oversubscription_ratio: payload.get("memory_oversubscription_ratio").and_then(|v| v.as_f64()).unwrap_or(1.0),
        strategy: payload.get("strategy").and_then(|v| v.as_str()).unwrap_or("lift-shift").to_string(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match service.create_cluster(&project_id, cluster).await {
        Ok(created_cluster) => {
            Ok((StatusCode::CREATED, Json(json!({
                "success": true,
                "result": created_cluster
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to create cluster: {}", e);
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

/// Get clusters for a project
/// GET /api/v1/migration-wizard/projects/:id/clusters
async fn get_project_clusters(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting clusters for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());

    match service.get_project_clusters(&project_id).await {
        Ok(clusters) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": {
                    "clusters": clusters,
                    "total": clusters.len()
                }
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get clusters: {}", e);
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

/// Get a single cluster by ID
/// GET /api/v1/migration-wizard/clusters/:id
async fn get_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting cluster: {}", cluster_id);

    let service = MigrationWizardService::new(db.as_ref().clone());

    match service.get_cluster(&cluster_id).await {
        Ok(cluster) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": cluster
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get cluster: {}", e);
            Err((
                StatusCode::NOT_FOUND,
                Json(json!({
                    "success": false,
                    "error": "Cluster not found"
                }))
            ))
        }
    }
}

/// Update a cluster
/// PUT /api/v1/migration-wizard/clusters/:id
async fn update_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
    Json(updates): Json<serde_json::Value>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Updating cluster: {}", cluster_id);

    let service = MigrationWizardService::new(db.as_ref().clone());

    match service.update_cluster(&cluster_id, updates).await {
        Ok(cluster) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": cluster
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to update cluster: {}", e);
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

/// Delete a cluster
/// DELETE /api/v1/migration-wizard/clusters/:id
async fn delete_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Deleting cluster: {}", cluster_id);

    let service = MigrationWizardService::new(db.as_ref().clone());

    match service.delete_cluster(&cluster_id).await {
        Ok(()) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": {
                    "message": "Cluster deleted successfully"
                }
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to delete cluster: {}", e);
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

// =============================================================================
// VM PLACEMENT
// =============================================================================

/// Automatic VM placement using bin-packing algorithm
/// POST /api/v1/migration-wizard/projects/:id/auto-place
async fn auto_place_vms(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Running automatic VM placement for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.auto_place_vms(&project_id).await {
        Ok((placements, warnings)) => {
            // Get cluster utilization stats
            let utilization = service.get_cluster_utilization(&project_id).await
                .unwrap_or_default();
            
            let cluster_util: Vec<serde_json::Value> = utilization.iter().map(|(cluster, cpu, memory, storage, vm_count)| {
                let cluster_id = cluster.id.as_ref()
                    .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                    .unwrap_or_default();
                
                let cpu_total = (cluster.total_cores as f64 * cluster.cpu_oversubscription_ratio) as i32;
                let memory_total = (cluster.memory_gb as f64 * 1024.0 * cluster.memory_oversubscription_ratio) as i32;
                let storage_total = cluster.storage_tb * 1024.0;
                
                json!({
                    "cluster_id": cluster_id,
                    "cluster_name": cluster.name,
                    "cpu_used": cpu,
                    "cpu_total": cpu_total,
                    "cpu_percent": (*cpu as f64 / cpu_total as f64) * 100.0,
                    "memory_used_mb": memory,
                    "memory_total_mb": memory_total,
                    "memory_percent": (*memory as f64 / memory_total as f64) * 100.0,
                    "storage_used_gb": storage,
                    "storage_total_gb": storage_total,
                    "storage_percent": (storage / storage_total) * 100.0,
                    "vm_count": vm_count
                })
            }).collect();

            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": {
                    "placements": placements,
                    "total_placed": placements.len(),
                    "warnings": warnings,
                    "cluster_utilization": cluster_util
                }
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to auto-place VMs: {}", e);
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

/// Manual VM placement - create or update placement for a specific VM
/// POST /api/v1/migration-wizard/projects/:id/placements
async fn create_manual_placement(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Creating manual placement for project: {}", project_id);

    let vm_id = payload.get("vm_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| (
            StatusCode::BAD_REQUEST,
            Json(json!({ "success": false, "error": "Missing 'vm_id' field" }))
        ))?;

    let cluster_id = payload.get("cluster_id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| (
            StatusCode::BAD_REQUEST,
            Json(json!({ "success": false, "error": "Missing 'cluster_id' field" }))
        ))?;

    let strategy = payload.get("strategy")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.create_manual_placement(&project_id, vm_id, cluster_id, strategy).await {
        Ok((placement, warnings)) => {
            Ok((StatusCode::CREATED, Json(json!({
                "success": true,
                "result": {
                    "placement": placement,
                    "warnings": warnings
                }
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to create placement: {}", e);
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

/// Get all placements for a project
/// GET /api/v1/migration-wizard/projects/:id/placements
async fn get_project_placements(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting placements for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.get_project_placements(&project_id).await {
        Ok(placements) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": {
                    "placements": placements,
                    "total": placements.len()
                }
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get placements: {}", e);
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

/// Delete a placement
/// DELETE /api/v1/migration-wizard/placements/:id
async fn delete_placement(
    State(db): State<Arc<Database>>,
    Path(placement_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Deleting placement: {}", placement_id);

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.delete_placement(&placement_id).await {
        Ok(()) => {
            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": {
                    "message": "Placement deleted successfully"
                }
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to delete placement: {}", e);
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

/// Get cluster utilization statistics
/// GET /api/v1/migration-wizard/projects/:id/cluster-utilization
async fn get_cluster_utilization(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!("Getting cluster utilization for project: {}", project_id);

    let service = MigrationWizardService::new(db.as_ref().clone());
    
    match service.get_cluster_utilization(&project_id).await {
        Ok(utilization) => {
            let result: Vec<serde_json::Value> = utilization.iter().map(|(cluster, cpu, memory, storage, vm_count)| {
                let cluster_id = cluster.id.as_ref()
                    .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                    .unwrap_or_default();
                
                let cpu_total = (cluster.total_cores as f64 * cluster.cpu_oversubscription_ratio) as i32;
                let memory_total = (cluster.memory_gb as f64 * 1024.0 * cluster.memory_oversubscription_ratio) as i32;
                let storage_total = cluster.storage_tb * 1024.0;
                
                json!({
                    "cluster_id": cluster_id,
                    "cluster_name": cluster.name,
                    "cpu_used": cpu,
                    "cpu_total": cpu_total,
                    "cpu_percent": (*cpu as f64 / cpu_total as f64) * 100.0,
                    "memory_used_mb": memory,
                    "memory_total_mb": memory_total,
                    "memory_percent": (*memory as f64 / memory_total as f64) * 100.0,
                    "storage_used_gb": storage,
                    "storage_total_gb": storage_total,
                    "storage_percent": (storage / storage_total) * 100.0,
                    "vm_count": vm_count
                })
            }).collect();

            Ok((StatusCode::OK, Json(json!({
                "success": true,
                "result": result
            }))))
        }
        Err(e) => {
            tracing::error!("Failed to get cluster utilization: {}", e);
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
