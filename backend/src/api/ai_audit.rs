use axum::{
    extract::{Path, Query, State},
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
    models::ai_thought_log::{
        AddFeedbackRequest, AiThoughtLog, AiThoughtLogQuery, CreateAiThoughtLogRequest,
    },
};

/// Create AI Audit API router
pub fn create_ai_audit_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/thoughts", get(list_thoughts).post(create_thought))
        .route("/thoughts/:id", get(get_thought))
        .route("/thoughts/:id/feedback", post(add_feedback))
        .route("/thoughts/trace/:trace_id", get(get_trace_thoughts))
        .route("/thoughts/stats", get(get_stats))
        .with_state(db)
}

async fn list_thoughts(
    State(db): State<Arc<Database>>,
    Query(query): Query<AiThoughtLogQuery>,
) -> impl IntoResponse {
    let mut surql_query = String::from("SELECT * FROM ai_thought_log WHERE 1=1");

    if let Some(trace_id) = query.trace_id {
        surql_query.push_str(&format!(" AND trace_id = '{}'", trace_id));
    }
    if let Some(session_id) = query.session_id {
        surql_query.push_str(&format!(" AND session_id = '{}'", session_id));
    }
    if let Some(agent_type) = query.agent_type {
        surql_query.push_str(&format!(" AND agent_type = '{:?}'", agent_type));
    }
    if let Some(user_id) = query.user_id {
        surql_query.push_str(&format!(" AND user_id = '{}'", user_id));
    }
    if let Some(has_feedback) = query.has_feedback {
        if has_feedback {
            surql_query.push_str(" AND user_feedback IS NOT NONE");
        } else {
            surql_query.push_str(" AND user_feedback IS NONE");
        }
    }

    surql_query.push_str(" ORDER BY created_at DESC");

    if let Some(limit) = query.limit {
        surql_query.push_str(&format!(" LIMIT {}", limit));
    }

    match db.query(&surql_query).await {
        Ok(mut result) => {
            let thoughts: Vec<AiThoughtLog> = result.take(0).unwrap_or_default();
            (StatusCode::OK, Json(thoughts)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn get_thought(
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
        Ok(thought) => {
            let thought: Option<AiThoughtLog> = thought;
            match thought {
                Some(t) => (StatusCode::OK, Json(t)).into_response(),
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

async fn create_thought(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateAiThoughtLogRequest>,
) -> impl IntoResponse {
    let related_ticket_id = payload
        .related_ticket_id
        .and_then(|id| thing(&id).ok());

    let related_asset_id = payload
        .related_asset_id
        .and_then(|id| thing(&id).ok());

    let related_document_ids: Vec<Thing> = payload
        .related_document_ids
        .unwrap_or_default()
        .into_iter()
        .filter_map(|id| thing(&id).ok())
        .collect();

    let thought = AiThoughtLog {
        id: None,
        trace_id: payload.trace_id,
        session_id: payload.session_id,
        agent_type: payload.agent_type,
        user_id: payload.user_id,
        input_text: payload.input_text,
        input_context: payload.input_context,
        system_prompt: payload.system_prompt,
        raw_response: payload.raw_response,
        chain_of_thought: payload.chain_of_thought,
        final_output: payload.final_output,
        risk_score: payload.risk_score,
        confidence_score: payload.confidence_score,
        model: payload.model,
        provider: payload.provider,
        prompt_tokens: payload.prompt_tokens,
        completion_tokens: payload.completion_tokens,
        latency_ms: payload.latency_ms,
        user_feedback: None,
        feedback_comment: None,
        feedback_at: None,
        related_ticket_id,
        related_asset_id,
        related_document_ids,
        created_at: Utc::now(),
    };

    match db.create("ai_thought_log").content(thought).await {
        Ok(created) => {
            let created: Vec<AiThoughtLog> = created;
            match created.into_iter().next() {
                Some(t) => (StatusCode::CREATED, Json(t)).into_response(),
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

    let existing: Option<AiThoughtLog> = match db.select(id_thing.clone()).await {
        Ok(t) => t,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut thought) = existing {
        thought.user_feedback = Some(payload.user_feedback);
        thought.feedback_comment = payload.feedback_comment;
        thought.feedback_at = Some(Utc::now());

        match db.update(id_thing).content(thought).await {
            Ok(updated) => {
                let updated: Option<AiThoughtLog> = updated;
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
            Json(serde_json::json!({ "error": "Thought log not found" })),
        )
            .into_response()
    }
}

async fn get_trace_thoughts(
    State(db): State<Arc<Database>>,
    Path(trace_id): Path<String>,
) -> impl IntoResponse {
    let query = format!(
        "SELECT * FROM ai_thought_log WHERE trace_id = '{}' ORDER BY created_at ASC",
        trace_id
    );

    match db.query(&query).await {
        Ok(mut result) => {
            let thoughts: Vec<AiThoughtLog> = result.take(0).unwrap_or_default();
            (StatusCode::OK, Json(thoughts)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn get_stats(State(db): State<Arc<Database>>) -> impl IntoResponse {
    let query = r#"
        SELECT 
            count() AS total_thoughts,
            count(user_feedback) AS thoughts_with_feedback,
            math::mean(confidence_score) AS avg_confidence,
            math::mean(latency_ms) AS avg_latency_ms,
            count() GROUP BY agent_type AS by_agent
        FROM ai_thought_log
    "#;

    match db.query(query).await {
        Ok(mut result) => {
            let stats: Vec<serde_json::Value> = result.take(0).unwrap_or_default();
            (StatusCode::OK, Json(stats)).into_response()
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
        Ok(Thing::from(("ai_thought_log", id)))
    }
}
