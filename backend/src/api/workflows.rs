// Archer ITSM - Workflow Engine API
// REST endpoints for workflow definitions, instances, and approvals

use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{get, post, put, delete},
    Json, Router,
};
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::workflow_engine::*,
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
    },
    services::workflow_engine_service::WorkflowEngineService,
};

/// Create Workflows API router with authentication
pub fn create_workflows_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    Router::new()
        // Workflow definition endpoints
        .route("/", get(list_workflows))
        .route("/", post(create_workflow))
        .route("/:id", get(get_workflow))
        .route("/:id", put(update_workflow))
        .route("/:id", delete(delete_workflow))
        .route("/:id/trigger", post(trigger_workflow))
        // Workflow instance endpoints
        .route("/instances", get(list_workflow_instances))
        .route("/instances/:id", get(get_workflow_instance))
        .route("/instances/:id/cancel", post(cancel_workflow_instance))
        // Approval endpoints
        .route("/approvals/pending", get(get_pending_approvals))
        .route("/approvals/:id/approve", post(approve_approval))
        .route("/approvals/:id/reject", post(reject_approval))
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
        .with_state(db)
}

// ============================================================================
// WORKFLOW DEFINITION HANDLERS
// ============================================================================

/// List all workflow definitions
async fn list_workflows(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let service = WorkflowEngineService::new(db);

    match service.list_workflows().await {
        Ok(workflows) => {
            let response = WorkflowListResponse {
                workflows: workflows.clone(),
                total: workflows.len() as u64,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Get a specific workflow definition
async fn get_workflow(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.get_workflow(id_thing).await {
        Ok(Some(workflow)) => (StatusCode::OK, Json(workflow)).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Workflow not found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Create a new workflow definition
async fn create_workflow(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<CreateWorkflowRequest>,
) -> impl IntoResponse {
    let service = WorkflowEngineService::new(db);

    match service.create_workflow(req, user.username).await {
        Ok(workflow) => (StatusCode::CREATED, Json(workflow)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Update a workflow definition
async fn update_workflow(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<UpdateWorkflowRequest>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.update_workflow(id_thing, req).await {
        Ok(workflow) => (StatusCode::OK, Json(workflow)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Delete a workflow definition
async fn delete_workflow(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.delete_workflow(id_thing).await {
        Ok(_) => (StatusCode::NO_CONTENT, Json(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Manually trigger a workflow
async fn trigger_workflow(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<TriggerWorkflowRequest>,
) -> impl IntoResponse {
    let workflow_id = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid workflow ID format" })),
            )
                .into_response()
        }
    };

    let trigger_record_id = match req.trigger_record_id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid trigger record ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service
        .trigger_workflow(
            workflow_id,
            req.trigger_record_type,
            trigger_record_id,
            req.context,
        )
        .await
    {
        Ok(instance) => (StatusCode::CREATED, Json(instance)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

// ============================================================================
// WORKFLOW INSTANCE HANDLERS
// ============================================================================

/// List workflow instances
async fn list_workflow_instances(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let service = WorkflowEngineService::new(db);

    match service.list_workflow_instances().await {
        Ok(instances) => {
            let response = WorkflowInstanceListResponse {
                instances: instances.clone(),
                total: instances.len() as u64,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Get a specific workflow instance
async fn get_workflow_instance(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.get_workflow_instance(id_thing).await {
        Ok(Some(instance)) => (StatusCode::OK, Json(instance)).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Workflow instance not found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Cancel a running workflow instance
async fn cancel_workflow_instance(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.cancel_workflow_instance(id_thing).await {
        Ok(instance) => (StatusCode::OK, Json(instance)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

// ============================================================================
// APPROVAL HANDLERS
// ============================================================================

/// Get pending approvals for the current user
async fn get_pending_approvals(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let service = WorkflowEngineService::new(db);

    match service.get_pending_approvals(user.user_id.clone()).await {
        Ok(approvals) => {
            let response = ApprovalListResponse {
                approvals: approvals.clone(),
                total: approvals.len() as u64,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Approve an approval request
async fn approve_approval(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<ApprovalResponseRequest>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.approve_approval(id_thing, req.comments).await {
        Ok(approval) => (StatusCode::OK, Json(approval)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

/// Reject an approval request
async fn reject_approval(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<ApprovalResponseRequest>,
) -> impl IntoResponse {
    let id_thing = match id.parse::<Thing>() {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    let service = WorkflowEngineService::new(db);

    match service.reject_approval(id_thing, req.comments).await {
        Ok(approval) => (StatusCode::OK, Json(approval)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}
