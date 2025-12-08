use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::{Duration, Utc};
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::agent_action::{
        ActionStatus, AgentAction, AgentActionQuery, ApproveActionRequest,
        CreateAgentActionRequest, RecordExecutionResultRequest, RejectActionRequest, RiskLevel,
    },
};

/// Create Agent Actions API router
pub fn create_agent_actions_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_actions).post(create_action))
        .route("/:id", get(get_action))
        .route("/:id/approve", post(approve_action))
        .route("/:id/reject", post(reject_action))
        .route("/:id/execute", post(record_execution))
        .route("/:id/rollback", post(rollback_action))
        .route("/pending", get(get_pending_actions))
        .with_state(db)
}

async fn list_actions(
    State(db): State<Arc<Database>>,
    Query(query): Query<AgentActionQuery>,
) -> impl IntoResponse {
    let mut surql_query = String::from("SELECT * FROM agent_action WHERE 1=1");

    if let Some(status) = query.status {
        surql_query.push_str(&format!(" AND status = '{:?}'", status));
    }
    if let Some(risk_level) = query.risk_level {
        surql_query.push_str(&format!(" AND risk_level = '{:?}'", risk_level));
    }
    if let Some(agent_type) = query.agent_type {
        surql_query.push_str(&format!(" AND agent_type = '{}'", agent_type));
    }
    if let Some(requested_by) = query.requested_by {
        surql_query.push_str(&format!(" AND requested_by = '{}'", requested_by));
    }
    if let Some(pending_only) = query.pending_approval_only {
        if pending_only {
            surql_query.push_str(" AND status = 'pending_approval'");
        }
    }

    surql_query.push_str(" ORDER BY created_at DESC");

    if let Some(limit) = query.limit {
        surql_query.push_str(&format!(" LIMIT {}", limit));
    }

    match db.query(&surql_query).await {
        Ok(mut result) => {
            let actions: Vec<AgentAction> = result.take(0).unwrap_or_default();
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
    let thought_log_id = payload.thought_log_id.and_then(|id| thing(&id).ok());
    let target_asset_id = payload.target_asset_id.and_then(|id| thing(&id).ok());
    let related_ticket_id = payload.related_ticket_id.and_then(|id| thing(&id).ok());

    // Calculate risk level from score
    let risk_level = match payload.risk_score {
        0..=25 => RiskLevel::Low,
        26..=50 => RiskLevel::Medium,
        51..=75 => RiskLevel::High,
        _ => RiskLevel::Critical,
    };

    // Calculate approval deadline
    let timeout_hours = payload.approval_timeout_hours.unwrap_or(24);
    let approval_deadline = Utc::now() + Duration::hours(timeout_hours as i64);

    let action = AgentAction {
        id: None,
        thought_log_id,
        agent_type: payload.agent_type,
        intent: payload.intent,
        action_type: payload.action_type,
        target_asset_id,
        target_host: payload.target_host,
        command: payload.command,
        command_args: payload.command_args.unwrap_or_default(),
        working_directory: payload.working_directory,
        risk_score: payload.risk_score,
        risk_level,
        risk_explanation: payload.risk_explanation,
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
        related_ticket_id,
        approval_deadline: Some(approval_deadline),
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

    let existing: Option<AgentAction> = match db.select(id_thing.clone()).await {
        Ok(a) => a,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut action) = existing {
        if action.status != ActionStatus::PendingApproval {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Action is not pending approval" })),
            )
                .into_response();
        }

        action.status = ActionStatus::Approved;
        action.approved_by = Some(payload.approved_by);
        action.approved_at = Some(Utc::now());
        action.updated_at = Utc::now();

        match db.update(id_thing).content(action).await {
            Ok(updated) => {
                let updated: Option<AgentAction> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Action not found" })),
        )
            .into_response()
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

    let existing: Option<AgentAction> = match db.select(id_thing.clone()).await {
        Ok(a) => a,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut action) = existing {
        if action.status != ActionStatus::PendingApproval {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Action is not pending approval" })),
            )
                .into_response();
        }

        action.status = ActionStatus::Rejected;
        action.approved_by = Some(payload.rejected_by);
        action.rejection_reason = Some(payload.rejection_reason);
        action.updated_at = Utc::now();

        match db.update(id_thing).content(action).await {
            Ok(updated) => {
                let updated: Option<AgentAction> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Action not found" })),
        )
            .into_response()
    }
}

async fn record_execution(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<RecordExecutionResultRequest>,
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

    let existing: Option<AgentAction> = match db.select(id_thing.clone()).await {
        Ok(a) => a,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut action) = existing {
        if action.status != ActionStatus::Approved && action.status != ActionStatus::Executing {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Action is not in executable state" })),
            )
                .into_response();
        }

        if action.execution_started_at.is_none() {
            action.execution_started_at = Some(Utc::now());
        }

        action.status = payload.status;
        action.exit_code = payload.exit_code;
        action.stdout = payload.stdout;
        action.stderr = payload.stderr;
        action.error_message = payload.error_message;
        action.execution_completed_at = Some(Utc::now());
        action.updated_at = Utc::now();

        match db.update(id_thing).content(action).await {
            Ok(updated) => {
                let updated: Option<AgentAction> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Action not found" })),
        )
            .into_response()
    }
}

async fn rollback_action(
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

    let existing: Option<AgentAction> = match db.select(id_thing.clone()).await {
        Ok(a) => a,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut action) = existing {
        if !action.rollback_possible {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Rollback not possible for this action" })),
            )
                .into_response();
        }

        if action.rollback_command.is_none() {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "No rollback command defined" })),
            )
                .into_response();
        }

        action.status = ActionStatus::RolledBack;
        action.updated_at = Utc::now();

        match db.update(id_thing).content(action).await {
            Ok(updated) => {
                let updated: Option<AgentAction> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Action not found" })),
        )
            .into_response()
    }
}

async fn get_pending_actions(State(db): State<Arc<Database>>) -> impl IntoResponse {
    let query = r#"
        SELECT * FROM agent_action 
        WHERE status = 'pending_approval' 
        AND (approval_deadline IS NONE OR approval_deadline > time::now())
        ORDER BY created_at ASC
    "#;

    match db.query(query).await {
        Ok(mut result) => {
            let actions: Vec<AgentAction> = result.take(0).unwrap_or_default();
            (StatusCode::OK, Json(actions)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("agent_action", id)))
    }
}
