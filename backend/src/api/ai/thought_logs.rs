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
    models::ai::{AddFeedbackRequest, AiThoughtLog, CreateAiThoughtLogRequest},
};

/// Helper function to create Thing from string ID
fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ai_thought_log", id)))
    }
}

pub fn create_thought_logs_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_thought_logs).post(create_thought_log))
        .route("/:id", get(get_thought_log))
        .route("/:id/feedback", post(add_feedback))
        .with_state(db)
}

async fn list_thought_logs(State(db): State<Arc<Database>>) -> impl IntoResponse {
    match db.select("ai_thought_log").await {
        Ok(logs) => {
            let logs: Vec<AiThoughtLog> = logs;
            (StatusCode::OK, Json(logs)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn get_thought_log(
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
        Ok(log) => {
            let log: Option<AiThoughtLog> = log;
            match log {
                Some(l) => (StatusCode::OK, Json(l)).into_response(),
                None => (
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({ "error": "Thought log not found" })),
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

async fn create_thought_log(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateAiThoughtLogRequest>,
) -> impl IntoResponse {
    let log = AiThoughtLog {
        id: None,
        trace_id: payload.trace_id,
        session_id: payload.session_id,
        agent_type: payload.agent_type,
        user_id: payload.user_id,
        input_text: payload.input_text,
        input_context: payload.input_context,
        system_prompt: None,
        raw_response: payload.raw_response,
        chain_of_thought: payload.chain_of_thought,
        final_output: payload.final_output,
        risk_score: None,
        confidence_score: None,
        model: payload.model,
        provider: payload.provider,
        prompt_tokens: payload.prompt_tokens,
        completion_tokens: payload.completion_tokens,
        latency_ms: payload.latency_ms,
        user_feedback: None,
        feedback_comment: None,
        feedback_at: None,
        related_ticket_id: None,
        related_asset_id: None,
        related_document_ids: Vec::new(),
        created_at: Utc::now(),
    };

    match db.create("ai_thought_log").content(log).await {
        Ok(created) => {
            let created: Vec<AiThoughtLog> = created;
            match created.into_iter().next() {
                Some(l) => (StatusCode::CREATED, Json(l)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to create thought log" })),
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

async fn add_feedback(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<AddFeedbackRequest>,
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

    // Fetch existing log
    let existing: Option<AiThoughtLog> = match db.select(id_thing.clone()).await {
        Ok(log) => log,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    let mut log = match existing {
        Some(l) => l,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Thought log not found" })),
            )
                .into_response()
        }
    };

    // Update feedback fields
    log.user_feedback = Some(payload.user_feedback);
    log.feedback_comment = payload.feedback_comment;
    log.feedback_at = Some(Utc::now());

    match db.update(id_thing).content(log).await {
        Ok(updated) => {
            let updated: Option<AiThoughtLog> = updated;
            match updated {
                Some(l) => (StatusCode::OK, Json(l)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to update thought log" })),
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
