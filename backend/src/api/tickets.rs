use axum::{
    body::Bytes,
    extract::{Multipart, Path, State},
    http::{header, StatusCode},
    middleware,
    response::{IntoResponse, Response},
    routing::{get, post, patch, delete},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;
use uuid::Uuid;

use crate::{
    database::Database,
    models::ticket::{
        Ticket, CreateTicketRequest, UpdateTicketRequest, TicketStatus,
        TicketComment, CreateCommentRequest, CommentType, TicketAttachment,
    },
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
        rbac::{check_tickets_create, check_tickets_read, check_tickets_update, check_tickets_delete},
    },
};
use std::path::PathBuf;
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// Create Tickets API router with RBAC protection
pub fn create_tickets_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    // Routes that require read permission
    let read_routes = Router::new()
        .route("/", get(list_tickets))
        .route("/:id", get(get_ticket))
        .route("/:id/comments", get(list_comments))
        .route("/:id/attachments", get(list_attachments))
        .route("/:id/attachments/:attachment_id", get(download_attachment))
        .layer(middleware::from_fn(check_tickets_read))
        .with_state(db.clone());

    // Route for creating tickets
    let create_routes = Router::new()
        .route("/", post(create_ticket))
        .layer(middleware::from_fn(check_tickets_create))
        .with_state(db.clone());

    // Routes that require update permission (includes adding comments and attachments)
    let update_routes = Router::new()
        .route("/:id", patch(update_ticket))
        .route("/:id/comments", post(add_comment))
        .route("/:id/attachments", post(upload_attachment))
        .layer(middleware::from_fn(check_tickets_update))
        .with_state(db.clone());

    // Routes that require delete permission
    let delete_routes = Router::new()
        .route("/:id", delete(delete_ticket))
        .route("/:id/comments/:comment_id", delete(delete_comment))
        .route("/:id/attachments/:attachment_id", delete(delete_attachment))
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
// ATTACHMENT HANDLERS
// ============================================================================

// File size limit: 10MB
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;

// Allowed MIME types for attachments
const ALLOWED_MIME_TYPES: &[&str] = &[
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
];

/// Upload a file attachment to a ticket
async fn upload_attachment(
    State(db): State<Arc<Database>>,
    Path(ticket_id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    // Verify ticket exists
    let ticket_thing = match thing(&ticket_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    let ticket_exists: Option<Ticket> = match db.select(ticket_thing.clone()).await {
        Ok(t) => t,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response(),
    };

    if ticket_exists.is_none() {
        return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response();
    }

    // Parse multipart form data
    let mut filename = None;
    let mut file_data = None;
    let mut mime_type = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();

        if name == "file" {
            filename = field.file_name().map(|s| s.to_string());
            mime_type = field.content_type().map(|s| s.to_string());
            
            match field.bytes().await {
                Ok(bytes) => {
                    // Check file size
                    if bytes.len() as u64 > MAX_FILE_SIZE {
                        return (StatusCode::PAYLOAD_TOO_LARGE, Json(serde_json::json!({ 
                            "error": format!("File size exceeds maximum of {} bytes", MAX_FILE_SIZE)
                        }))).into_response();
                    }
                    file_data = Some(bytes);
                },
                Err(e) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
            }
        }
    }

    let original_filename = match filename {
        Some(f) => f,
        None => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "No file uploaded" }))).into_response(),
    };

    let file_bytes = match file_data {
        Some(d) => d,
        None => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "No file data" }))).into_response(),
    };

    let detected_mime = mime_type.unwrap_or_else(|| "application/octet-stream".to_string());

    // Validate MIME type
    if !ALLOWED_MIME_TYPES.contains(&detected_mime.as_str()) {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ 
            "error": format!("File type '{}' is not allowed", detected_mime)
        }))).into_response();
    }

    // Create uploads directory structure
    let upload_dir = PathBuf::from("./uploads/tickets").join(&ticket_id);
    if let Err(e) = fs::create_dir_all(&upload_dir).await {
        eprintln!("Failed to create upload directory: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create storage directory" }))).into_response();
    }

    // Generate unique filename
    let timestamp = Utc::now().timestamp_millis();
    let extension = std::path::Path::new(&original_filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin");
    let stored_filename = format!("{}_{}.{}", timestamp, uuid::Uuid::new_v4(), extension);
    let file_path = upload_dir.join(&stored_filename);

    // Write file to disk
    match fs::File::create(&file_path).await {
        Ok(mut file) => {
            if let Err(e) = file.write_all(&file_bytes).await {
                eprintln!("Failed to write file: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to save file" }))).into_response();
            }
        },
        Err(e) => {
            eprintln!("Failed to create file: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create file" }))).into_response();
        }
    }

    // Store attachment metadata in database
    let now = Utc::now();
    let attachment = TicketAttachment {
        id: None,
        ticket_id: ticket_thing,
        filename: stored_filename.clone(),
        original_filename: original_filename.clone(),
        mime_type: detected_mime,
        size_bytes: file_bytes.len() as u64,
        storage_path: file_path.to_string_lossy().to_string(),
        uploaded_by: user.user_id.clone(),
        uploaded_at: now,
    };

    match db.create("ticket_attachments").content(&attachment).await {
        Ok(created) => {
            let created: Vec<TicketAttachment> = created;
            match created.into_iter().next() {
                Some(att) => {
                    log_audit(&db, &user, "ticket_attachments", "create", Some(&ticket_id), true).await;
                    (StatusCode::CREATED, Json(att)).into_response()
                },
                None => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create attachment record" }))).into_response(),
            }
        },
        Err(e) => {
            // Clean up file if database insert fails
            let _ = fs::remove_file(&file_path).await;
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response()
        }
    }
}

/// List all attachments for a ticket
async fn list_attachments(
    State(db): State<Arc<Database>>,
    Path(ticket_id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let ticket_thing = match thing(&ticket_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    // Query attachments for this ticket
    let query = format!(
        "SELECT * FROM ticket_attachments WHERE ticket_id = {} ORDER BY uploaded_at DESC",
        ticket_thing
    );

    match db.query(&query).await {
        Ok(mut response) => {
            let attachments: Vec<TicketAttachment> = response.take(0).unwrap_or_default();
            log_audit(&db, &user, "ticket_attachments", "list", Some(&ticket_id), true).await;
            (StatusCode::OK, Json(serde_json::json!({
                "data": attachments,
                "count": attachments.len(),
                "ticket_id": ticket_id
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Download a specific attachment
async fn download_attachment(
    State(db): State<Arc<Database>>,
    Path((ticket_id, attachment_id)): Path<(String, String)>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let attachment_thing = match attachment_thing(&attachment_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid attachment ID format" }))).into_response(),
    };

    // Get attachment metadata
    let attachment: Option<TicketAttachment> = match db.select(attachment_thing).await {
        Ok(a) => a,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Attachment not found" }))).into_response(),
    };

    match attachment {
        Some(att) => {
            // Verify attachment belongs to this ticket
            let expected_ticket = format!("ticket:{}", ticket_id.split(':').last().unwrap_or(&ticket_id));
            let actual_ticket = format!("{}:{}", att.ticket_id.tb, att.ticket_id.id);
            
            if actual_ticket != expected_ticket && !ticket_id.contains(&actual_ticket) {
                return (StatusCode::FORBIDDEN, Json(serde_json::json!({ "error": "Attachment does not belong to this ticket" }))).into_response();
            }

            // Read file from disk
            match fs::read(&att.storage_path).await {
                Ok(file_data) => {
                    log_audit(&db, &user, "ticket_attachments", "download", Some(&attachment_id), true).await;
                    
                    // Return file with appropriate headers
                    (
                        StatusCode::OK,
                        [
                            (header::CONTENT_TYPE, att.mime_type.as_str()),
                            (header::CONTENT_DISPOSITION, &format!("attachment; filename=\"{}\"", att.original_filename)),
                        ],
                        file_data
                    ).into_response()
                },
                Err(e) => {
                    eprintln!("Failed to read file: {}", e);
                    (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "File not found on disk" }))).into_response()
                }
            }
        },
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Attachment not found" }))).into_response(),
    }
}

/// Delete an attachment
async fn delete_attachment(
    State(db): State<Arc<Database>>,
    Path((ticket_id, attachment_id)): Path<(String, String)>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let attachment_thing = match attachment_thing(&attachment_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid attachment ID format" }))).into_response(),
    };

    // Get the attachment to verify it belongs to this ticket and check ownership
    let existing: Option<TicketAttachment> = match db.select(attachment_thing.clone()).await {
        Ok(a) => a,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Attachment not found" }))).into_response(),
    };

    match existing {
        Some(attachment) => {
            // Verify the attachment belongs to this ticket
            let expected_ticket = format!("ticket:{}", ticket_id.split(':').last().unwrap_or(&ticket_id));
            let actual_ticket = format!("{}:{}", attachment.ticket_id.tb, attachment.ticket_id.id);
            
            if actual_ticket != expected_ticket && !ticket_id.contains(&actual_ticket) {
                return (StatusCode::FORBIDDEN, Json(serde_json::json!({ "error": "Attachment does not belong to this ticket" }))).into_response();
            }

            // Delete file from disk
            if let Err(e) = fs::remove_file(&attachment.storage_path).await {
                eprintln!("Warning: Failed to delete file from disk: {}", e);
                // Continue with database deletion even if file deletion fails
            }

            // Delete from database
            match db.delete::<Option<TicketAttachment>>(attachment_thing).await {
                Ok(_) => {
                    log_audit(&db, &user, "ticket_attachments", "delete", Some(&attachment_id), true).await;
                    (StatusCode::NO_CONTENT, ()).into_response()
                },
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
            }
        },
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Attachment not found" }))).into_response(),
    }
}

fn attachment_thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket_attachments", id)))
    }
}
