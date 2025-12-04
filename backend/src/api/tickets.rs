use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post, patch, delete},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::ticket::{Ticket, CreateTicketRequest, UpdateTicketRequest, TicketStatus},
};

/// Create Tickets API router
pub fn create_tickets_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_tickets).post(create_ticket))
        .route("/:id", get(get_ticket).patch(update_ticket).delete(delete_ticket))
        .with_state(db)
}

async fn list_tickets(
    State(db): State<Arc<Database>>,
) -> impl IntoResponse {
    match db.select("ticket").await {
        Ok(tickets) => {
            let tickets: Vec<Ticket> = tickets;
            (StatusCode::OK, Json(tickets)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_ticket(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.select(id_thing).await {
        Ok(ticket) => {
            let ticket: Option<Ticket> = ticket;
            match ticket {
                Some(t) => (StatusCode::OK, Json(t)).into_response(),
                None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn create_ticket(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateTicketRequest>,
) -> impl IntoResponse {
    let ticket = Ticket {
        id: None,
        title: payload.title,
        description: payload.description,
        ticket_type: payload.ticket_type,
        priority: payload.priority,
        status: TicketStatus::New,
        related_asset: payload.related_asset.and_then(|id| thing(&id).ok()),
        related_project: payload.related_project.and_then(|id| thing(&id).ok()),
        assignee: payload.assignee,
        created_by: payload.created_by,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match db.create("ticket").content(ticket).await {
        Ok(created) => {
            let created: Vec<Ticket> = created;
            match created.into_iter().next() {
                Some(t) => (StatusCode::CREATED, Json(t)).into_response(),
                None => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create ticket" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn update_ticket(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateTicketRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    // First fetch the existing ticket to update fields
    let existing: Option<Ticket> = match db.select(id_thing.clone()).await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    if let Some(mut ticket) = existing {
        if let Some(title) = payload.title { ticket.title = title; }
        if let Some(desc) = payload.description { ticket.description = Some(desc); }
        if let Some(status) = payload.status { ticket.status = status; }
        if let Some(priority) = payload.priority { ticket.priority = priority; }
        if let Some(assignee) = payload.assignee { ticket.assignee = Some(assignee); }
        ticket.updated_at = Utc::now();

        match db.update(id_thing).content(ticket).await {
            Ok(updated) => {
                let updated: Option<Ticket> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            },
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
        }
    } else {
        (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response()
    }
}

async fn delete_ticket(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.delete::<Option<Ticket>>(id_thing).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket", id)))
    }
}
