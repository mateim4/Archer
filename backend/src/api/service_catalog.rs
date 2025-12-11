use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::{IntoResponse, Response},
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::service_catalog::{
        CatalogCategory, CatalogItem, ServiceRequest,
        CreateCategoryRequest, UpdateCategoryRequest,
        CreateCatalogItemRequest, UpdateCatalogItemRequest,
        CreateServiceRequestRequest, ApprovalDecisionRequest,
        ServiceRequestStatus, ApprovalStatus,
    },
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
        rbac::{check_admin, check_catalog_admin, check_service_catalog_read},
    },
};

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

#[derive(Debug, Deserialize)]
struct CategoryFilter {
    parent_id: Option<String>,
    is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct ItemFilter {
    category_id: Option<String>,
    is_active: Option<bool>,
    search: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RequestFilter {
    status: Option<String>,
    requester_id: Option<String>,
    catalog_item_id: Option<String>,
}

// ============================================================================
// ROUTER SETUP
// ============================================================================

/// Create Service Catalog API router with RBAC protection
pub fn create_service_catalog_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    // Public/user routes (read catalog, submit requests, view own requests)
    let user_routes = Router::new()
        .route("/categories", get(list_categories))
        .route("/items", get(list_catalog_items))
        .route("/items/:id", get(get_catalog_item))
        .route("/requests", post(create_service_request))
        .route("/requests", get(list_my_requests))
        .route("/requests/:id", get(get_service_request))
        .layer(middleware::from_fn(check_service_catalog_read))
        .with_state(db.clone());

    // Admin routes (manage categories and items)
    let admin_routes = Router::new()
        .route("/categories", post(create_category))
        .route("/categories/:id", put(update_category))
        .route("/categories/:id", delete(delete_category))
        .route("/items", post(create_catalog_item))
        .route("/items/:id", put(update_catalog_item))
        .route("/items/:id", delete(delete_catalog_item))
        .layer(middleware::from_fn(check_catalog_admin))
        .with_state(db.clone());

    // Approval routes (for approvers)
    let approval_routes = Router::new()
        .route("/requests/:id/approve", post(approve_request))
        .route("/requests/:id/reject", post(reject_request))
        .route("/requests/pending", get(list_pending_requests))
        .layer(middleware::from_fn(check_admin)) // Can be customized to check approval permissions
        .with_state(db.clone());

    // Merge all routes and apply authentication
    Router::new()
        .merge(user_routes)
        .merge(admin_routes)
        .merge(approval_routes)
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
}

// ============================================================================
// CATEGORY HANDLERS
// ============================================================================

async fn list_categories(
    State(db): State<Arc<Database>>,
    Query(filter): Query<CategoryFilter>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    log_audit(&db, &user, "catalog_category", "list", None, true).await;

    // Build query based on filters
    let query = if let Some(parent_id) = filter.parent_id {
        format!("SELECT * FROM catalog_category WHERE parent_id = type::thing('catalog_category', '{}') ORDER BY sort_order", parent_id)
    } else if let Some(is_active) = filter.is_active {
        format!("SELECT * FROM catalog_category WHERE is_active = {} ORDER BY sort_order", is_active)
    } else {
        "SELECT * FROM catalog_category ORDER BY sort_order".to_string()
    };

    match db.query(query).await {
        Ok(mut response) => {
            let categories: Vec<CatalogCategory> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(serde_json::json!({
                "data": categories,
                "count": categories.len()
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn create_category(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<CreateCategoryRequest>,
) -> impl IntoResponse {
    log_audit(&db, &user, "catalog_category", "create", None, true).await;

    let category = CatalogCategory::new(
        payload.name,
        payload.description,
        payload.icon,
        payload.parent_id,
        payload.sort_order,
        payload.is_active,
    );

    match db.create("catalog_category").content(category).await {
        Ok(created) => {
            let created: Vec<CatalogCategory> = created;
            (StatusCode::CREATED, Json(serde_json::json!({
                "data": created.first(),
                "message": "Category created successfully"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn update_category(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "catalog_category", "update", Some(&id), true).await;

    // Fetch existing category
    let existing: Result<Option<CatalogCategory>, _> = db.select(id_thing.clone()).await;
    let mut category = match existing {
        Ok(Some(cat)) => cat,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Category not found" }))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    // Update fields
    if let Some(name) = payload.name { category.name = name; }
    if let Some(description) = payload.description { category.description = Some(description); }
    if let Some(icon) = payload.icon { category.icon = Some(icon); }
    if let Some(parent_id) = payload.parent_id { category.parent_id = Some(parent_id); }
    if let Some(sort_order) = payload.sort_order { category.sort_order = sort_order; }
    if let Some(is_active) = payload.is_active { category.is_active = is_active; }
    category.updated_at = Some(Utc::now());

    match db.update(id_thing).content(category).await {
        Ok(updated) => {
            let updated: Option<CatalogCategory> = updated;
            (StatusCode::OK, Json(serde_json::json!({
                "data": updated,
                "message": "Category updated successfully"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn delete_category(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "catalog_category", "delete", Some(&id), true).await;

    match db.delete::<Option<CatalogCategory>>(id_thing).await {
        Ok(Some(_)) => (StatusCode::OK, Json(serde_json::json!({ "message": "Category deleted successfully" }))).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Category not found" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

// ============================================================================
// CATALOG ITEM HANDLERS
// ============================================================================

async fn list_catalog_items(
    State(db): State<Arc<Database>>,
    Query(filter): Query<ItemFilter>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    log_audit(&db, &user, "catalog_item", "list", None, true).await;

    let query = if let Some(category_id) = filter.category_id {
        format!("SELECT * FROM catalog_item WHERE category_id = type::thing('catalog_category', '{}')", category_id)
    } else if let Some(is_active) = filter.is_active {
        format!("SELECT * FROM catalog_item WHERE is_active = {}", is_active)
    } else {
        "SELECT * FROM catalog_item".to_string()
    };

    match db.query(query).await {
        Ok(mut response) => {
            let mut items: Vec<CatalogItem> = response.take(0).unwrap_or_default();
            
            // Filter by search term if provided
            if let Some(search_term) = filter.search {
                let search_lower = search_term.to_lowercase();
                items.retain(|item| {
                    item.name.to_lowercase().contains(&search_lower) ||
                    item.description.to_lowercase().contains(&search_lower) ||
                    item.short_description.to_lowercase().contains(&search_lower)
                });
            }

            (StatusCode::OK, Json(serde_json::json!({
                "data": items,
                "count": items.len()
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_catalog_item(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "catalog_item", "get", Some(&id), true).await;

    match db.select(id_thing).await {
        Ok(Some(item)) => {
            let item: CatalogItem = item;
            (StatusCode::OK, Json(serde_json::json!({ "data": item }))).into_response()
        },
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Catalog item not found" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn create_catalog_item(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<CreateCatalogItemRequest>,
) -> impl IntoResponse {
    log_audit(&db, &user, "catalog_item", "create", None, true).await;

    let item = CatalogItem::new(
        payload.name,
        payload.description,
        payload.category_id,
        payload.icon,
        payload.short_description,
        payload.delivery_time_days,
        payload.cost,
        payload.is_active,
        payload.form_schema,
        payload.approval_required,
        payload.approval_group,
        payload.fulfillment_group,
    );

    match db.create("catalog_item").content(item).await {
        Ok(created) => {
            let created: Vec<CatalogItem> = created;
            (StatusCode::CREATED, Json(serde_json::json!({
                "data": created.first(),
                "message": "Catalog item created successfully"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn update_catalog_item(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateCatalogItemRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "catalog_item", "update", Some(&id), true).await;

    let existing: Result<Option<CatalogItem>, _> = db.select(id_thing.clone()).await;
    let mut item = match existing {
        Ok(Some(it)) => it,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Catalog item not found" }))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    if let Some(name) = payload.name { item.name = name; }
    if let Some(description) = payload.description { item.description = description; }
    if let Some(category_id) = payload.category_id { item.category_id = category_id; }
    if let Some(icon) = payload.icon { item.icon = Some(icon); }
    if let Some(short_description) = payload.short_description { item.short_description = short_description; }
    if let Some(delivery_time_days) = payload.delivery_time_days { item.delivery_time_days = Some(delivery_time_days); }
    if let Some(cost) = payload.cost { item.cost = Some(cost); }
    if let Some(is_active) = payload.is_active { item.is_active = is_active; }
    if let Some(form_schema) = payload.form_schema { item.form_schema = form_schema; }
    if let Some(approval_required) = payload.approval_required { item.approval_required = approval_required; }
    if let Some(approval_group) = payload.approval_group { item.approval_group = Some(approval_group); }
    if let Some(fulfillment_group) = payload.fulfillment_group { item.fulfillment_group = Some(fulfillment_group); }
    item.updated_at = Utc::now();

    match db.update(id_thing).content(item).await {
        Ok(updated) => {
            let updated: Option<CatalogItem> = updated;
            (StatusCode::OK, Json(serde_json::json!({
                "data": updated,
                "message": "Catalog item updated successfully"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn delete_catalog_item(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "catalog_item", "delete", Some(&id), true).await;

    match db.delete::<Option<CatalogItem>>(id_thing).await {
        Ok(Some(_)) => (StatusCode::OK, Json(serde_json::json!({ "message": "Catalog item deleted successfully" }))).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Catalog item not found" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

// ============================================================================
// SERVICE REQUEST HANDLERS
// ============================================================================

async fn create_service_request(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<CreateServiceRequestRequest>,
) -> impl IntoResponse {
    log_audit(&db, &user, "service_request", "create", None, true).await;

    // Fetch catalog item to determine if approval is required
    let item: Result<Option<CatalogItem>, _> = db.select(payload.catalog_item_id.clone()).await;
    let catalog_item = match item {
        Ok(Some(it)) => it,
        Ok(None) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Catalog item not found" }))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    let request = ServiceRequest::new(
        payload.catalog_item_id,
        user.username.clone(),
        payload.form_data,
        catalog_item.approval_required,
    );

    match db.create("service_request").content(request).await {
        Ok(created) => {
            let created: Vec<ServiceRequest> = created;
            (StatusCode::CREATED, Json(serde_json::json!({
                "data": created.first(),
                "message": "Service request created successfully"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn list_my_requests(
    State(db): State<Arc<Database>>,
    Query(filter): Query<RequestFilter>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    log_audit(&db, &user, "service_request", "list", None, true).await;

    // Only show user's own requests unless they're an admin
    let status_filter = filter.status.clone();
    let query = if user.has_permission("catalog:admin") {
        if let Some(ref _requester_id) = filter.requester_id {
            format!("SELECT * FROM service_request WHERE requester_id = $requester_id ORDER BY created_at DESC")
        } else if let Some(ref _status) = filter.status {
            format!("SELECT * FROM service_request WHERE status = $status ORDER BY created_at DESC")
        } else {
            "SELECT * FROM service_request ORDER BY created_at DESC".to_string()
        }
    } else {
        "SELECT * FROM service_request WHERE requester_id = $requester_id ORDER BY created_at DESC".to_string()
    };

    match db.query(query)
        .bind(("requester_id", &user.username))
        .bind(("status", status_filter.unwrap_or_default()))
        .await
    {
        Ok(mut response) => {
            let requests: Vec<ServiceRequest> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(serde_json::json!({
                "data": requests,
                "count": requests.len()
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_service_request(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "service_request", "get", Some(&id), true).await;

    match db.select(id_thing).await {
        Ok(Some(request)) => {
            let request: ServiceRequest = request;
            
            // Verify user can access this request (owner or admin)
            if request.requester_id != user.username && !user.has_permission("catalog:admin") {
                return (StatusCode::FORBIDDEN, Json(serde_json::json!({ "error": "Access denied" }))).into_response();
            }

            (StatusCode::OK, Json(serde_json::json!({ "data": request }))).into_response()
        },
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Service request not found" }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn list_pending_requests(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    log_audit(&db, &user, "service_request", "list_pending", None, true).await;

    let query = "SELECT * FROM service_request WHERE status = 'PENDING_APPROVAL' ORDER BY created_at ASC";

    match db.query(query).await {
        Ok(mut response) => {
            let requests: Vec<ServiceRequest> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(serde_json::json!({
                "data": requests,
                "count": requests.len()
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn approve_request(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(_payload): Json<ApprovalDecisionRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "service_request", "approve", Some(&id), true).await;

    let existing: Result<Option<ServiceRequest>, _> = db.select(id_thing.clone()).await;
    let mut request = match existing {
        Ok(Some(req)) => req,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Service request not found" }))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    request.approve(user.username.clone());

    match db.update(id_thing).content(request).await {
        Ok(updated) => {
            let updated: Option<ServiceRequest> = updated;
            (StatusCode::OK, Json(serde_json::json!({
                "data": updated,
                "message": "Service request approved successfully"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn reject_request(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(payload): Json<ApprovalDecisionRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    log_audit(&db, &user, "service_request", "reject", Some(&id), true).await;

    let existing: Result<Option<ServiceRequest>, _> = db.select(id_thing.clone()).await;
    let mut request = match existing {
        Ok(Some(req)) => req,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Service request not found" }))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    request.reject(user.username.clone(), payload.reason);

    match db.update(id_thing).content(request).await {
        Ok(updated) => {
            let updated: Option<ServiceRequest> = updated;
            (StatusCode::OK, Json(serde_json::json!({
                "data": updated,
                "message": "Service request rejected"
            }))).into_response()
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn thing(id: &str) -> Result<Thing, String> {
    // Parse "catalog_category:xyz" or just "xyz"
    if id.contains(':') {
        let parts: Vec<&str> = id.split(':').collect();
        if parts.len() == 2 {
            Ok(Thing::from((parts[0].to_string(), parts[1].to_string())))
        } else {
            Err("Invalid Thing format".to_string())
        }
    } else {
        // Assume it's just the ID part, need to determine table from context
        Err("Ambiguous ID - please specify table:id format".to_string())
    }
}

async fn log_audit(
    db: &Database,
    user: &AuthenticatedUser,
    resource_type: &str,
    action: &str,
    resource_id: Option<&str>,
    success: bool,
) {
    let log_entry = serde_json::json!({
        "user_id": user.username,
        "action": format!("{}:{}", resource_type, action),
        "resource_type": resource_type,
        "resource_id": resource_id,
        "success": success,
        "timestamp": Utc::now(),
        "ip_address": "unknown", // TODO: Extract from request
    });

    let _: Result<Vec<serde_json::Value>, _> = db
        .create("audit_log")
        .content(log_entry)
        .await;
}
