use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::{IntoResponse, Response},
    routing::{get, post, delete},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::ticket::{
        Ticket, TicketStatus, TicketRelationship, TicketRelationType,
        CreateRelationshipRequest, TicketRelationshipResponse, TicketSummary,
        TicketHierarchyNode, MarkDuplicateRequest, CommentType,
    },
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
        rbac::{check_tickets_read, check_tickets_update},
    },
};

/// Create Ticket Relationships API router with RBAC protection
pub fn create_ticket_relationships_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    // Routes that require read permission
    let read_routes = Router::new()
        .route("/:id/relationships", get(list_relationships))
        .route("/:id/children", get(list_children))
        .route("/:id/tree", get(get_hierarchy_tree))
        .layer(middleware::from_fn(check_tickets_read))
        .with_state(db.clone());

    // Routes that require update permission
    let update_routes = Router::new()
        .route("/:id/relationships", post(create_relationship))
        .route("/:id/relationships/:rel_id", delete(delete_relationship))
        .route("/:id/mark-duplicate/:target_id", post(mark_as_duplicate))
        .layer(middleware::from_fn(check_tickets_update))
        .with_state(db.clone());

    // Merge all routes and apply authentication layer
    Router::new()
        .merge(read_routes)
        .merge(update_routes)
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
}

// ============================================================================
// RELATIONSHIP HANDLERS
// ============================================================================

/// List all relationships for a ticket
async fn list_relationships(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let ticket_thing = match parse_ticket_id(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    // Verify ticket exists
    let ticket_exists: Option<Ticket> = match db.select(ticket_thing.clone()).await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    if ticket_exists.is_none() {
        return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response();
    }

    // Query relationships where this ticket is the source
    let query = format!(
        "SELECT * FROM ticket_relationships WHERE source_ticket_id = {}",
        ticket_thing
    );

    match db.query(&query).await {
        Ok(mut response) => {
            let relationships: Vec<TicketRelationship> = response.take(0).unwrap_or_default();
            
            // Enrich with target ticket details
            let mut enriched: Vec<TicketRelationshipResponse> = Vec::new();
            for rel in relationships {
                let target_ticket: Option<Ticket> = db.select(rel.target_ticket_id.clone()).await.ok().flatten();
                let target_summary = target_ticket.map(|t| TicketSummary {
                    id: t.id.as_ref().map(|id| format!("{}:{}", id.tb, id.id)).unwrap_or_default(),
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    ticket_type: t.ticket_type,
                });

                enriched.push(TicketRelationshipResponse {
                    id: rel.id.as_ref().map(|id| format!("{}:{}", id.tb, id.id)).unwrap_or_default(),
                    source_ticket_id: format!("{}:{}", rel.source_ticket_id.tb, rel.source_ticket_id.id),
                    target_ticket_id: format!("{}:{}", rel.target_ticket_id.tb, rel.target_ticket_id.id),
                    relationship_type: rel.relationship_type,
                    created_by: rel.created_by,
                    created_at: rel.created_at,
                    notes: rel.notes,
                    target_ticket: target_summary,
                });
            }

            (StatusCode::OK, Json(serde_json::json!({
                "data": enriched,
                "count": enriched.len()
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Create a new relationship between tickets
async fn create_relationship(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<CreateRelationshipRequest>,
) -> impl IntoResponse {
    let source_ticket_thing = match parse_ticket_id(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid source ticket ID format" }))).into_response(),
    };

    let target_ticket_thing = match parse_ticket_id(&payload.target_ticket_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid target ticket ID format" }))).into_response(),
    };

    // Prevent self-referencing
    if format!("{}:{}", source_ticket_thing.tb, source_ticket_thing.id) == 
       format!("{}:{}", target_ticket_thing.tb, target_ticket_thing.id) {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Cannot create relationship to self" }))).into_response();
    }

    // Verify both tickets exist
    let source_exists: Option<Ticket> = match db.select(source_ticket_thing.clone()).await {
        Ok(t) => t,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Source ticket not found" }))).into_response(),
    };
    let target_exists: Option<Ticket> = match db.select(target_ticket_thing.clone()).await {
        Ok(t) => t,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Target ticket not found" }))).into_response(),
    };

    if source_exists.is_none() || target_exists.is_none() {
        return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "One or both tickets not found" }))).into_response();
    }

    // Check for circular relationships (parent/child only)
    if matches!(payload.relationship_type, TicketRelationType::ParentOf | TicketRelationType::ChildOf) {
        if would_create_cycle(&db, &source_ticket_thing, &target_ticket_thing, &payload.relationship_type).await {
            return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ 
                "error": "This relationship would create a circular dependency" 
            }))).into_response();
        }
    }

    // Check if relationship already exists
    let check_query = format!(
        "SELECT * FROM ticket_relationships WHERE source_ticket_id = {} AND target_ticket_id = {} AND relationship_type = '{:?}'",
        source_ticket_thing, target_ticket_thing, payload.relationship_type
    );
    
    match db.query(&check_query).await {
        Ok(mut response) => {
            let existing: Vec<TicketRelationship> = response.take(0).unwrap_or_default();
            if !existing.is_empty() {
                return (StatusCode::CONFLICT, Json(serde_json::json!({ "error": "Relationship already exists" }))).into_response();
            }
        },
        Err(_) => {}
    }

    // Create the relationship
    let now = Utc::now();
    let relationship = TicketRelationship {
        id: None,
        source_ticket_id: source_ticket_thing.clone(),
        target_ticket_id: target_ticket_thing.clone(),
        relationship_type: payload.relationship_type.clone(),
        created_by: user.user_id.clone(),
        created_at: now,
        notes: payload.notes.clone(),
    };

    match db.create("ticket_relationships").content(&relationship).await {
        Ok(created) => {
            let created: Vec<TicketRelationship> = created;
            let created_rel = created.into_iter().next();

            // If parent/child, update parent_ticket_id field
            if matches!(payload.relationship_type, TicketRelationType::ChildOf) {
                let _ = db.query(&format!(
                    "UPDATE {} SET parent_ticket_id = {}",
                    source_ticket_thing, target_ticket_thing
                )).await;
            } else if matches!(payload.relationship_type, TicketRelationType::ParentOf) {
                let _ = db.query(&format!(
                    "UPDATE {} SET parent_ticket_id = {}",
                    target_ticket_thing, source_ticket_thing
                )).await;
            }

            // Create inverse relationship if symmetric or has inverse
            if let Some(inverse_type) = payload.relationship_type.inverse() {
                let inverse_rel = TicketRelationship {
                    id: None,
                    source_ticket_id: target_ticket_thing,
                    target_ticket_id: source_ticket_thing,
                    relationship_type: inverse_type,
                    created_by: user.user_id.clone(),
                    created_at: now,
                    notes: payload.notes,
                };
                let _: Result<Vec<TicketRelationship>, _> = db.create("ticket_relationships").content(&inverse_rel).await;
            }

            if let Some(rel) = created_rel {
                (StatusCode::CREATED, Json(serde_json::json!({
                    "id": rel.id.as_ref().map(|id| format!("{}:{}", id.tb, id.id)).unwrap_or_default(),
                    "source_ticket_id": format!("{}:{}", rel.source_ticket_id.tb, rel.source_ticket_id.id),
                    "target_ticket_id": format!("{}:{}", rel.target_ticket_id.tb, rel.target_ticket_id.id),
                    "relationship_type": rel.relationship_type,
                    "created_by": rel.created_by,
                    "created_at": rel.created_at,
                    "notes": rel.notes,
                }))).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create relationship" }))).into_response()
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Delete a relationship
async fn delete_relationship(
    State(db): State<Arc<Database>>,
    Path((ticket_id, rel_id)): Path<(String, String)>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let rel_thing = match parse_relationship_id(&rel_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid relationship ID format" }))).into_response(),
    };

    // Get the relationship to check if it belongs to this ticket and to get the inverse
    let existing: Option<TicketRelationship> = match db.select(rel_thing.clone()).await {
        Ok(r) => r,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Relationship not found" }))).into_response(),
    };

    match existing {
        Some(rel) => {
            // Verify the relationship belongs to this ticket
            let expected_ticket = format!("ticket:{}", ticket_id.split(':').last().unwrap_or(&ticket_id));
            let actual_ticket = format!("{}:{}", rel.source_ticket_id.tb, rel.source_ticket_id.id);
            
            if actual_ticket != expected_ticket && !ticket_id.contains(&actual_ticket) {
                return (StatusCode::FORBIDDEN, Json(serde_json::json!({ "error": "Relationship does not belong to this ticket" }))).into_response();
            }

            // Delete the relationship
            match db.delete::<Option<TicketRelationship>>(rel_thing).await {
                Ok(_) => {
                    // If parent/child, clear parent_ticket_id field
                    if matches!(rel.relationship_type, TicketRelationType::ChildOf) {
                        let _ = db.query(&format!(
                            "UPDATE {} SET parent_ticket_id = NONE",
                            rel.source_ticket_id
                        )).await;
                    } else if matches!(rel.relationship_type, TicketRelationType::ParentOf) {
                        let _ = db.query(&format!(
                            "UPDATE {} SET parent_ticket_id = NONE",
                            rel.target_ticket_id
                        )).await;
                    }

                    // Delete inverse relationship if it exists
                    if let Some(inverse_type) = rel.relationship_type.inverse() {
                        let inverse_query = format!(
                            "DELETE FROM ticket_relationships WHERE source_ticket_id = {} AND target_ticket_id = {} AND relationship_type = '{:?}'",
                            rel.target_ticket_id, rel.source_ticket_id, inverse_type
                        );
                        let _ = db.query(&inverse_query).await;
                    }

                    (StatusCode::NO_CONTENT, ()).into_response()
                },
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
            }
        },
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Relationship not found" }))).into_response(),
    }
}

/// Get all child tickets
async fn list_children(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let ticket_thing = match parse_ticket_id(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    // Query for child relationships
    let query = format!(
        "SELECT * FROM ticket_relationships WHERE source_ticket_id = {} AND relationship_type = 'PARENT_OF'",
        ticket_thing
    );

    match db.query(&query).await {
        Ok(mut response) => {
            let relationships: Vec<TicketRelationship> = response.take(0).unwrap_or_default();
            
            // Get child ticket details
            let mut children: Vec<TicketSummary> = Vec::new();
            for rel in relationships {
                if let Ok(Some(child_ticket)) = db.select::<Option<Ticket>>(rel.target_ticket_id.clone()).await {
                    children.push(TicketSummary {
                        id: child_ticket.id.as_ref().map(|id| format!("{}:{}", id.tb, id.id)).unwrap_or_default(),
                        title: child_ticket.title,
                        status: child_ticket.status,
                        priority: child_ticket.priority,
                        ticket_type: child_ticket.ticket_type,
                    });
                }
            }

            (StatusCode::OK, Json(serde_json::json!({
                "data": children,
                "count": children.len()
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

/// Get full hierarchy tree
async fn get_hierarchy_tree(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let ticket_thing = match parse_ticket_id(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ticket ID format" }))).into_response(),
    };

    // Get the root ticket
    let root_ticket: Option<Ticket> = match db.select(ticket_thing.clone()).await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    match root_ticket {
        Some(ticket) => {
            let tree = build_hierarchy_tree(&db, ticket).await;
            (StatusCode::OK, Json(tree)).into_response()
        },
        None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Ticket not found" }))).into_response(),
    }
}

/// Mark ticket as duplicate
async fn mark_as_duplicate(
    State(db): State<Arc<Database>>,
    Path((source_id, target_id)): Path<(String, String)>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<MarkDuplicateRequest>,
) -> impl IntoResponse {
    let source_ticket_thing = match parse_ticket_id(&source_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid source ticket ID format" }))).into_response(),
    };

    let target_ticket_thing = match parse_ticket_id(&target_id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid target ticket ID format" }))).into_response(),
    };

    // Get both tickets
    let source_ticket: Option<Ticket> = match db.select(source_ticket_thing.clone()).await {
        Ok(t) => t,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Source ticket not found" }))).into_response(),
    };
    let target_ticket: Option<Ticket> = match db.select(target_ticket_thing.clone()).await {
        Ok(t) => t,
        Err(_) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Target ticket not found" }))).into_response(),
    };

    if source_ticket.is_none() || target_ticket.is_none() {
        return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "One or both tickets not found" }))).into_response();
    }

    let mut source = source_ticket.unwrap();
    let mut target = target_ticket.unwrap();

    // Create duplicate relationship
    let now = Utc::now();
    let relationship = TicketRelationship {
        id: None,
        source_ticket_id: source_ticket_thing.clone(),
        target_ticket_id: target_ticket_thing.clone(),
        relationship_type: TicketRelationType::DuplicateOf,
        created_by: user.user_id.clone(),
        created_at: now,
        notes: payload.notes.clone(),
    };

    let _: Result<Vec<TicketRelationship>, _> = db.create("ticket_relationships").content(&relationship).await;

    // Close source ticket
    source.status = TicketStatus::Closed;
    source.closed_at = Some(now);
    source.updated_at = now;
    let _: Result<Option<Ticket>, _> = db.update(source_ticket_thing.clone()).content(&source).await;

    // Add comment to source ticket
    let comment_query = format!(
        r#"CREATE ticket_comments SET
            ticket_id = {},
            content = 'This ticket has been marked as a duplicate of {}',
            author_id = '{}',
            author_name = '{}',
            is_internal = false,
            comment_type = 'STATUS_UPDATE',
            attachments = [],
            created_at = time::now(),
            updated_at = time::now()
        "#,
        source_ticket_thing,
        target_id,
        user.user_id,
        user.username
    );
    let _ = db.query(&comment_query).await;

    // Transfer watchers if requested
    if payload.transfer_watchers {
        let mut target_watchers = target.watchers.clone();
        for watcher in &source.watchers {
            if !target_watchers.contains(watcher) {
                target_watchers.push(watcher.clone());
            }
        }
        target.watchers = target_watchers;
        target.updated_at = now;
        let _: Result<Option<Ticket>, _> = db.update(target_ticket_thing).content(&target).await;
    }

    (StatusCode::OK, Json(serde_json::json!({
        "message": "Ticket marked as duplicate",
        "source_ticket_id": source_id,
        "target_ticket_id": target_id,
        "watchers_transferred": payload.transfer_watchers
    }))).into_response()
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn parse_ticket_id(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket", id)))
    }
}

fn parse_relationship_id(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket_relationships", id)))
    }
}

/// Check if creating a relationship would create a circular dependency
async fn would_create_cycle(
    db: &Database,
    source: &Thing,
    target: &Thing,
    rel_type: &TicketRelationType,
) -> bool {
    // For parent/child relationships, check if target is already an ancestor of source
    if matches!(rel_type, TicketRelationType::ParentOf) {
        // Check if target is a descendant of source (would create cycle)
        is_descendant(db, source, target).await
    } else if matches!(rel_type, TicketRelationType::ChildOf) {
        // Check if target is an ancestor of source (would create cycle)
        is_ancestor(db, source, target).await
    } else {
        false
    }
}

/// Check if 'descendant' is a descendant of 'ancestor'
fn is_descendant<'a>(
    db: &'a Database,
    ancestor: &'a Thing,
    descendant: &'a Thing,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = bool> + Send + 'a>> {
    Box::pin(async move {
        let query = format!(
            "SELECT * FROM ticket_relationships WHERE source_ticket_id = {} AND relationship_type = 'PARENT_OF'",
            ancestor
        );

        match db.query(&query).await {
            Ok(mut response) => {
                let children: Vec<TicketRelationship> = response.take(0).unwrap_or_default();
                for child in children {
                    if format!("{}:{}", child.target_ticket_id.tb, child.target_ticket_id.id) == 
                       format!("{}:{}", descendant.tb, descendant.id) {
                        return true;
                    }
                    // Recursive check
                    if is_descendant(db, &child.target_ticket_id, descendant).await {
                        return true;
                    }
                }
            },
            Err(_) => {}
        }
        false
    })
}

/// Check if 'ancestor' is an ancestor of 'descendant'
fn is_ancestor<'a>(
    db: &'a Database,
    descendant: &'a Thing,
    ancestor: &'a Thing,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = bool> + Send + 'a>> {
    Box::pin(async move {
        let query = format!(
            "SELECT * FROM ticket_relationships WHERE target_ticket_id = {} AND relationship_type = 'PARENT_OF'",
            descendant
        );

        match db.query(&query).await {
            Ok(mut response) => {
                let parents: Vec<TicketRelationship> = response.take(0).unwrap_or_default();
                for parent in parents {
                    if format!("{}:{}", parent.source_ticket_id.tb, parent.source_ticket_id.id) == 
                       format!("{}:{}", ancestor.tb, ancestor.id) {
                        return true;
                    }
                    // Recursive check
                    if is_ancestor(db, &parent.source_ticket_id, ancestor).await {
                        return true;
                    }
                }
            },
            Err(_) => {}
        }
        false
    })
}

/// Build hierarchy tree recursively
fn build_hierarchy_tree<'a>(
    db: &'a Database,
    ticket: Ticket,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = TicketHierarchyNode> + Send + 'a>> {
    Box::pin(async move {
        let ticket_id = ticket.id.clone();
        let ticket_summary = TicketSummary {
            id: ticket_id.as_ref().map(|id| format!("{}:{}", id.tb, id.id)).unwrap_or_default(),
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            ticket_type: ticket.ticket_type,
        };

        // Get children
        let mut children = Vec::new();
        if let Some(tid) = ticket_id {
            let query = format!(
                "SELECT * FROM ticket_relationships WHERE source_ticket_id = {} AND relationship_type = 'PARENT_OF'",
                tid
            );

            if let Ok(mut response) = db.query(&query).await {
                let child_rels: Vec<TicketRelationship> = response.take(0).unwrap_or_default();
                for rel in child_rels {
                    if let Ok(Some(child_ticket)) = db.select::<Option<Ticket>>(rel.target_ticket_id.clone()).await {
                        let child_node = build_hierarchy_tree(db, child_ticket).await;
                        children.push(child_node);
                    }
                }
            }
        }

        TicketHierarchyNode {
            ticket: ticket_summary,
            children,
            relationship_type: None,
        }
    })
}
