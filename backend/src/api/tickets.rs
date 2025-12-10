use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::{IntoResponse, Response},
    routing::{get, post, patch, delete},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::ticket::{
        Ticket, CreateTicketRequest, UpdateTicketRequest, TicketStatus,
        TicketComment, CreateCommentRequest, CommentType,
    },
    models::knowledge::{LinkArticleToTicketRequest, KBLinkType},
    services::kb_suggestion_service::KBSuggestionService,
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
        rbac::{check_tickets_create, check_tickets_read, check_tickets_update, check_tickets_delete},
    },
};

/// Create Tickets API router with RBAC protection
pub fn create_tickets_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    // Routes that require read permission
    let read_routes = Router::new()
        .route("/", get(list_tickets))
        .route("/:id", get(get_ticket))
        .route("/:id/comments", get(list_comments))
        .layer(middleware::from_fn(check_tickets_read))
        .with_state(db.clone());

    // Route for creating tickets
    let create_routes = Router::new()
        .route("/", post(create_ticket))
        .layer(middleware::from_fn(check_tickets_create))
        .with_state(db.clone());

    // Routes that require update permission (includes adding comments)
    let update_routes = Router::new()
        .route("/:id", patch(update_ticket))
        .route("/:id/comments", post(add_comment))
        .route("/:id/kb-resolution", post(link_kb_article))
        .layer(middleware::from_fn(check_tickets_update))
        .with_state(db.clone());

    // Routes that require delete permission
    let delete_routes = Router::new()
        .route("/:id", delete(delete_ticket))
        .route("/:id/comments/:comment_id", delete(delete_comment))
        .layer(middleware::from_fn(check_tickets_delete))
        .with_state(db.clone());

    // Merge all routes and apply authentication layer
    Router::new()
        .merge(read_routes)
        .merge(create_routes)
        .merge(update_routes)
        .merge(delete_routes)
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
}

// ============================================================================
// TICKET HANDLERS WITH AUTH CONTEXT
// ============================================================================

async fn list_tickets(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    // Log the query for audit purposes
    log_audit(&db, &user, "tickets", "list", None, true).await;

    match db.select("ticket").await {
        Ok(tickets) => {
            let tickets: Vec<Ticket> = tickets;
            (StatusCode::OK, Json(serde_json::json!({
                "data": tickets,
                "count": tickets.len(),
                "user": user.username
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_ticket(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.select(id_thing).await {
        Ok(ticket) => {
            let ticket: Option<Ticket> = ticket;
            match ticket {
                Some(t) => {
                    log_audit(&db, &user, "tickets", "read", Some(&id), true).await;
                    (StatusCode::OK, Json(t)).into_response()
                },
                None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn create_ticket(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<CreateTicketRequest>,
) -> impl IntoResponse {
    // Use authenticated user as creator (override payload if provided)
    let created_by = if payload.created_by.is_empty() {
        user.user_id.clone()
    } else {
        payload.created_by
    };

    let now = Utc::now();
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
        created_by,
        created_at: now,
        updated_at: now,
        // Phase 1 SLA fields (will be populated by SLA service in full implementation)
        sla_policy_id: None,
        sla_breach_at: None,
        response_due: None,
        resolution_due: None,
        response_sla_met: None,
        resolution_sla_met: None,
        first_response_at: None,
        resolved_at: None,
        closed_at: None,
        // Phase 1 enhanced fields
        watchers: payload.watchers,
        tags: payload.tags,
        custom_fields: payload.custom_fields,
        impact: payload.impact,
        urgency: payload.urgency,
        source: payload.source,
        category: payload.category,
        subcategory: payload.subcategory,
        assigned_group: payload.assigned_group,
        tenant_id: user.tenant_id.as_ref().and_then(|t| thing(t).ok()),
    };

    match db.create("ticket").content(ticket).await {
        Ok(created) => {
            let created: Vec<Ticket> = created;
            match created.into_iter().next() {
                Some(t) => {
                    let ticket_id = t.id.as_ref().map(|id| id.to_string());
                    log_audit(&db, &user, "tickets", "create", ticket_id.as_deref(), true).await;
                    (StatusCode::CREATED, Json(t)).into_response()
                },
                None => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create ticket" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn update_ticket(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
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
                log_audit(&db, &user, "tickets", "update", Some(&id), true).await;
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
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.delete::<Option<Ticket>>(id_thing).await {
        Ok(_) => {
            log_audit(&db, &user, "tickets", "delete", Some(&id), true).await;
            (StatusCode::NO_CONTENT, ()).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

// ============================================================================
// COMMENT HANDLERS
// ============================================================================

/// List all comments for a ticket
async fn list_comments(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let ticket_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    // Query comments for this ticket
    let query = format!(
        "SELECT * FROM ticket_comments WHERE ticket_id = {} ORDER BY created_at ASC",
        ticket_thing
    );

    match db.query(&query).await {
        Ok(mut response) => {
            let comments: Vec<TicketComment> = response.take(0).unwrap_or_default();
            log_audit(&db, &user, "ticket_comments", "list", Some(&id), true).await;
            (StatusCode::OK, Json(serde_json::json!({
                "data": comments,
                "count": comments.len(),
                "ticket_id": id
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Add a comment to a ticket
async fn add_comment(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<CreateCommentRequest>,
) -> impl IntoResponse {
    let ticket_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    // Verify ticket exists
    let ticket_exists: Option<Ticket> = match db.select(ticket_thing.clone()).await {
        Ok(t) => t,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response(),
    };

    if ticket_exists.is_none() {
        return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response();
    }

    let now = Utc::now();
    let comment = TicketComment {
        id: None,
        ticket_id: ticket_thing,
        content: payload.content,
        author_id: user.user_id.clone(),
        author_name: user.username.clone(),
        is_internal: payload.is_internal,
        comment_type: payload.comment_type.unwrap_or(CommentType::Note),
        attachments: vec![],
        created_at: now,
        updated_at: now,
    };

    match db.create("ticket_comments").content(&comment).await {
        Ok(created) => {
            let created: Vec<TicketComment> = created;
            log_audit(&db, &user, "ticket_comments", "create", Some(&id), true).await;
            
            // Update the ticket's updated_at timestamp
            let _ = db.query(&format!(
                "UPDATE {} SET updated_at = time::now()",
                id
            )).await;

            (StatusCode::CREATED, Json(created.into_iter().next())).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Delete a comment from a ticket
async fn delete_comment(
    State(db): State<Arc<Database>>,
    Path((ticket_id, comment_id)): Path<(String, String)>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let comment_thing = match comment_thing(&comment_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid comment ID format" }))).into_response(),
    };

    // Get the comment to verify it belongs to this ticket and check ownership
    let existing: Option<TicketComment> = match db.select(comment_thing.clone()).await {
        Ok(c) => c,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Comment not found" }))).into_response(),
    };

    match existing {
        Some(comment) => {
            // Verify the comment belongs to this ticket
            let expected_ticket = format!("ticket:{}", ticket_id.split(':').last().unwrap_or(&ticket_id));
            let actual_ticket = format!("{}:{}", comment.ticket_id.tb, comment.ticket_id.id);
            
            if actual_ticket != expected_ticket && !ticket_id.contains(&actual_ticket) {
                return (StatusCode::FORBIDDEN, Json(serde_json::json!({ "error": "Comment does not belong to this ticket" }))).into_response();
            }

            // Delete the comment
            match db.delete::<Option<TicketComment>>(comment_thing).await {
                Ok(_) => {
                    log_audit(&db, &user, "ticket_comments", "delete", Some(&comment_id), true).await;
                    (StatusCode::NO_CONTENT, ()).into_response()
                },
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
            }
        },
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Comment not found" }))).into_response(),
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket", id)))
    }
}

fn comment_thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket_comments", id)))
    }
}

/// Log an audit entry for ticket operations
async fn log_audit(
    db: &Database,
    user: &AuthenticatedUser,
    resource_type: &str,
    action: &str,
    resource_id: Option<&str>,
    success: bool,
) {
    let query = format!(
        r#"
        CREATE audit_logs SET
            event_type = 'TICKET_OPERATION',
            user_id = users:{},
            username = '{}',
            resource_type = '{}',
            resource_id = {},
            action = '{}',
            success = {},
            tenant_id = {}
        "#,
        user.user_id.split(':').last().unwrap_or(&user.user_id),
        user.username,
        resource_type,
        resource_id.map(|id| format!("'{}'", id)).unwrap_or_else(|| "NONE".to_string()),
        action,
        success,
        user.tenant_id.as_ref().map(|t| format!("tenants:{}", t)).unwrap_or_else(|| "NONE".to_string()),
    );

    // Fire and forget - don't fail the request if audit logging fails
    let _ = db.query(&query).await;
}

// ============================================================================
// KB INTEGRATION HANDLERS (Phase 1.5)
// ============================================================================

/// Link a KB article to a ticket resolution
async fn link_kb_article(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<LinkArticleToTicketRequest>,
) -> impl IntoResponse {
    // Extract ticket ID from path
    let ticket_id = if id.contains(':') {
        id.split(':').last().unwrap_or(&id)
    } else {
        &id
    };

    // Link the article to the ticket
    match KBSuggestionService::link_article_to_ticket(
        db.clone(),
        ticket_id,
        &payload.article_id,
        KBLinkType::UsedForResolution,
        Some(payload.was_helpful),
        &user.user_id,
    )
    .await
    {
        Ok(link) => {
            log_audit(&db, &user, "ticket_kb_links", "create", Some(ticket_id), true).await;
            (StatusCode::CREATED, Json(link)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}
