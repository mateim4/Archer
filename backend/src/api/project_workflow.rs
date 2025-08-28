use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::database::Database;
use crate::models::project_models::*;
use crate::services::project_management_service::ProjectManagementService;
use crate::services::document_service::{DocumentService, DocumentGenerationRequest};

// Simple request type for workflow step updates
#[derive(Debug, Deserialize)]
pub struct UpdateWorkflowStepRequest {
    pub status: Option<WorkflowStepStatus>,
    pub actual_start_date: Option<chrono::DateTime<chrono::Utc>>,
    pub actual_end_date: Option<chrono::DateTime<chrono::Utc>>,
    pub actual_duration_hours: Option<f64>,
    pub notes: Option<String>,
    pub assignee: Option<String>,
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

pub async fn create_project(
    State(state): State<Arc<Database>>,
    Json(request): Json<CreateProjectRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let project_service = ProjectManagementService::new((*state).clone());
    
    // For demo purposes, using a dummy user ID
    let created_by = "system".to_string();
    
    match project_service.create_project(request, created_by).await {
        Ok(project) => Ok(Json(json!({
            "status": "success",
            "data": project
        }))),
        Err(e) => {
            println!("Error creating project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn list_projects(
    State(state): State<Arc<Database>>,
    Query(query): Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let project_service = ProjectManagementService::new((*state).clone());
    
    // For now, pass None filter - can be enhanced later
    match project_service.list_projects(None).await {
        Ok(projects) => Ok(Json(json!({
            "status": "success",
            "data": projects
        }))),
        Err(e) => {
            println!("Error listing projects: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_project(
    State(state): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let project_service = ProjectManagementService::new((*state).clone());
    
    match project_service.get_project(&project_id).await {
        Ok(Some(project)) => Ok(Json(json!({
            "status": "success",
            "data": project
        }))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            println!("Error getting project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn update_project(
    State(state): State<Arc<Database>>,
    Path(project_id): Path<String>,
    Json(request): Json<UpdateProjectRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let project_service = ProjectManagementService::new((*state).clone());
    
    match project_service.update_project(&project_id, request).await {
        Ok(project) => Ok(Json(json!({
            "status": "success",
            "data": project
        }))),
        Err(e) => {
            println!("Error updating project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn delete_project(
    State(state): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let project_service = ProjectManagementService::new((*state).clone());
    
    match project_service.delete_project(&project_id).await {
        Ok(_) => Ok(Json(json!({
            "status": "success",
            "message": "Project deleted successfully"
        }))),
        Err(e) => {
            println!("Error deleting project: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn create_workflow(
    State(state): State<Arc<Database>>,
    Path(project_id): Path<String>,
    Json(request): Json<CreateWorkflowRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let project_service = ProjectManagementService::new((*state).clone());
    
    match project_service.create_workflow(&project_id, request).await {
        Ok(workflow) => Ok(Json(json!({
            "status": "success",
            "data": workflow
        }))),
        Err(e) => {
            println!("Error creating workflow: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_project_workflows(
    State(state): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Stub implementation - return empty array for now
    Ok(Json(json!({
        "status": "success",
        "data": []
    })))
}

pub async fn update_workflow_step(
    State(state): State<Arc<Database>>,
    Path((workflow_id, step_index)): Path<(String, usize)>,
    Json(request): Json<UpdateWorkflowStepRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Stub implementation
    Ok(Json(json!({
        "status": "success",
        "message": "Workflow step updated (stub)"
    })))
}

pub async fn get_workflow_analytics(
    State(state): State<Arc<Database>>,
    Path(project_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Stub implementation
    Ok(Json(json!({
        "status": "success", 
        "data": {
            "total_workflows": 0,
            "workflows_by_status": {},
            "workflows_by_type": {},
            "average_completion_time_hours": null,
            "bottleneck_steps": [],
            "efficiency_metrics": {}
        }
    })))
}

pub async fn generate_document(
    State(_state): State<Arc<Database>>,
    Path(_project_id): Path<String>,
    Json(_request): Json<DocumentGenerationRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    // Stub implementation
    Ok(Json(json!({
        "status": "success",
        "message": "Document generation not yet implemented",
        "data": {
            "document_id": "stub-document-1",
            "document_name": "Generated Document",
            "status": "generated"
        }
    })))
}

// =============================================================================
// ROUTER CONFIGURATION
// =============================================================================

pub fn routes() -> Router<Arc<Database>> {
    Router::new()
        // Project management routes
        .route("/projects", post(create_project))
        .route("/projects", get(list_projects))
        .route("/projects/:project_id", get(get_project))
        .route("/projects/:project_id", put(update_project))
        .route("/projects/:project_id", delete(delete_project))
        
        // Workflow management routes
        .route("/projects/:project_id/workflows", post(create_workflow))
        .route("/projects/:project_id/workflows", get(get_project_workflows))
        .route("/workflows/:workflow_id/steps/:step_index", put(update_workflow_step))
        .route("/projects/:project_id/analytics", get(get_workflow_analytics))
        
        // Document generation routes
        .route("/projects/:project_id/generate-document", post(generate_document))
}
