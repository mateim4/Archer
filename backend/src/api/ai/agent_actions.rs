use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::ai::{
        ActionStatus, AgentAction, ApproveActionRequest, CreateAgentActionRequest, RejectActionRequest, RiskLevel,
    },
};

/// Helper function to create Thing from string ID
fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("agent_action", id)))
    }
}

pub fn create_agent_actions_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_actions).post(create_action))
        .route("/:id", get(get_action))
        .route("/:id/approve", post(approve_action))
        .route("/:id/reject", post(reject_action))
        .route("/pending", get(list_pending_actions))
        .with_state(db)
}

async fn list_actions(State(db): State<Arc<Database>>) -> impl IntoResponse {
    match db.select("agent_action").await {
        Ok(actions) => {
            let actions: Vec<AgentAction> = actions;
            (StatusCode::OK, Json(actions)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn get_action(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    match db.select(id_thing).await {
        Ok(action) => {
            let action: Option<AgentAction> = action;
            match action {
                Some(a) => (StatusCode::OK, Json(a)).into_response(),
                None => (
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({ "error": "Action not found" })),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn create_action(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateAgentActionRequest>,
) -> impl IntoResponse {
    // Determine risk level based on risk score
    let risk_level = match payload.risk_score {
        0..=30 => RiskLevel::Low,
        31..=60 => RiskLevel::Medium,
        61..=85 => RiskLevel::High,
        _ => RiskLevel::Critical,
    };

    let action = AgentAction {
        id: None,
        thought_log_id: None,
        agent_type: payload.agent_type,
        intent: payload.intent,
        action_type: payload.action_type,
        target_asset_id: None,
        target_host: payload.target_host,
        command: payload.command,
        command_args: payload.command_args.unwrap_or_default(),
        working_directory: None,
        risk_score: payload.risk_score,
        risk_level,
        risk_explanation: None,
        status: ActionStatus::PendingApproval,
        rollback_possible: payload.rollback_possible,
        rollback_command: payload.rollback_command,
        requested_by: payload.requested_by,
        approved_by: None,
        approved_at: None,
        rejection_reason: None,
        execution_started_at: None,
        execution_completed_at: None,
        exit_code: None,
        stdout: None,
        stderr: None,
        error_message: None,
        related_ticket_id: None,
        approval_deadline: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match db.create("agent_action").content(action).await {
        Ok(created) => {
            let created: Vec<AgentAction> = created;
            match created.into_iter().next() {
                Some(a) => (StatusCode::CREATED, Json(a)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to create action" })),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn approve_action(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<ApproveActionRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    // Fetch existing action
    let existing: Option<AgentAction> = match db.select(id_thing.clone()).await {
        Ok(action) => action,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    let mut action = match existing {
        Some(a) => a,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Action not found" })),
            )
                .into_response()
        }
    };

    // Update approval fields
    action.status = ActionStatus::Approved;
    action.approved_by = Some(payload.approved_by);
    action.approved_at = Some(Utc::now());
    action.updated_at = Utc::now();

    match db.update(id_thing).content(action).await {
        Ok(updated) => {
            let updated: Option<AgentAction> = updated;
            match updated {
                Some(a) => (StatusCode::OK, Json(a)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to approve action" })),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn reject_action(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<RejectActionRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    // Fetch existing action
    let existing: Option<AgentAction> = match db.select(id_thing.clone()).await {
        Ok(action) => action,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    let mut action = match existing {
        Some(a) => a,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Action not found" })),
            )
                .into_response()
        }
    };

    // Update rejection fields
    action.status = ActionStatus::Rejected;
    action.approved_by = Some(payload.rejected_by);
    action.rejection_reason = Some(payload.rejection_reason);
    action.updated_at = Utc::now();

    match db.update(id_thing).content(action).await {
        Ok(updated) => {
            let updated: Option<AgentAction> = updated;
            match updated {
                Some(a) => (StatusCode::OK, Json(a)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to reject action" })),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn list_pending_actions(State(db): State<Arc<Database>>) -> impl IntoResponse {
    let query = "SELECT * FROM agent_action WHERE status = 'pending_approval' ORDER BY created_at DESC";

    match db.query(query).await {
        Ok(mut response) => match response.take::<Vec<AgentAction>>(0) {
            Ok(actions) => (StatusCode::OK, Json(actions)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}
