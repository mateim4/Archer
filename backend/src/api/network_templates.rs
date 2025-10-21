//! Network Templates API
//!
//! Endpoints for managing reusable network mapping configurations.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    database::Database,
    models::project_models::NetworkTemplate,
    services::network_template_service::{
        CreateNetworkTemplateRequest, NetworkTemplateFilters, NetworkTemplateService,
        UpdateNetworkTemplateRequest,
    },
};

pub fn create_network_templates_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_templates))
        .route("/", post(create_template))
        .route("/:id", get(get_template))
        .route("/:id", put(update_template))
        .route("/:id", delete(delete_template))
        .route("/:id/clone", post(clone_template))
        .route("/search", get(search_templates))
        .route("/global", get(list_global_templates))
        .route("/:id/apply/:project_id", post(apply_template))
        .with_state(db)
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct ListTemplatesQuery {
    pub is_global: Option<bool>,
    pub search: Option<String>,
    pub tags: Option<String>, // Comma-separated
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct TemplateResponse {
    pub success: bool,
    pub template: NetworkTemplate,
}

#[derive(Debug, Serialize)]
pub struct TemplatesListResponse {
    pub success: bool,
    pub templates: Vec<NetworkTemplate>,
    pub total: usize,
}

#[derive(Debug, Deserialize)]
pub struct CloneTemplateRequest {
    pub new_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApplyTemplateResponse {
    pub success: bool,
    pub network_config: serde_json::Value,
}

// =============================================================================
// NETWORK TEMPLATE ENDPOINTS
// =============================================================================

/// List network templates with optional filters
///
/// GET /network-templates?is_global=true&search=production&limit=20
///
/// Returns filtered list of templates accessible to the user.
async fn list_templates(
    State(db): State<Arc<Database>>,
    Query(query): Query<ListTemplatesQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = "system"; // TODO: Get from auth context

    let filters = NetworkTemplateFilters {
        is_global: query.is_global,
        search_query: query.search,
        tags: query.tags.map(|t| t.split(',').map(|s| s.trim().to_string()).collect()),
        limit: query.limit,
        offset: query.offset,
    };

    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.list_templates(user_id, filters).await {
        Ok(templates) => {
            let total = templates.len();
            Ok((
                StatusCode::OK,
                Json(TemplatesListResponse {
                    success: true,
                    templates,
                    total,
                }),
            ))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Create a new network template
///
/// POST /network-templates
///
/// Creates a new network mapping template for reuse across projects.
async fn create_template(
    State(db): State<Arc<Database>>,
    Json(request): Json<CreateNetworkTemplateRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = "system"; // TODO: Get from auth context

    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.create_template(user_id, request).await {
        Ok(template) => Ok((
            StatusCode::CREATED,
            Json(TemplateResponse {
                success: true,
                template,
            }),
        )),
        Err(e) => Err(ApiError::BadRequest(e.to_string())),
    }
}

/// Get a specific network template by ID
///
/// GET /network-templates/:id
///
/// Returns the template details if it exists and user has access.
async fn get_template(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.get_template(&id).await {
        Ok(Some(template)) => Ok((
            StatusCode::OK,
            Json(TemplateResponse {
                success: true,
                template,
            }),
        )),
        Ok(None) => Err(ApiError::NotFound("Template not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Update an existing network template
///
/// PUT /network-templates/:id
///
/// Updates template fields. Only creator or admin can update.
async fn update_template(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(request): Json<UpdateNetworkTemplateRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = "system"; // TODO: Get from auth context

    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.update_template(&id, user_id, request).await {
        Ok(template) => Ok((
            StatusCode::OK,
            Json(TemplateResponse {
                success: true,
                template,
            }),
        )),
        Err(e) => Err(ApiError::BadRequest(e.to_string())),
    }
}

/// Delete a network template
///
/// DELETE /network-templates/:id
///
/// Permanently deletes the template. Only creator or admin can delete.
async fn delete_template(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = "system"; // TODO: Get from auth context

    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.delete_template(&id, user_id).await {
        Ok(_) => Ok((
            StatusCode::NO_CONTENT,
            Json(serde_json::json!({ "success": true })),
        )),
        Err(e) => Err(ApiError::BadRequest(e.to_string())),
    }
}

/// Clone an existing template
///
/// POST /network-templates/:id/clone
///
/// Creates a user-specific copy of a template with optional new name.
async fn clone_template(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(request): Json<CloneTemplateRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = "system"; // TODO: Get from auth context

    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.clone_template(&id, user_id, request.new_name).await {
        Ok(template) => Ok((
            StatusCode::CREATED,
            Json(TemplateResponse {
                success: true,
                template,
            }),
        )),
        Err(e) => Err(ApiError::BadRequest(e.to_string())),
    }
}

/// Search templates by network query
///
/// GET /network-templates/search?q=192.168
///
/// Searches templates by source or destination network.
async fn search_templates(
    State(db): State<Arc<Database>>,
    Query(query): Query<serde_json::Value>,
) -> Result<impl IntoResponse, ApiError> {
    let user_id = "system"; // TODO: Get from auth context
    let search_query = query
        .get("q")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.search_by_network(user_id, search_query).await {
        Ok(templates) => {
            let total = templates.len();
            Ok((
                StatusCode::OK,
                Json(TemplatesListResponse {
                    success: true,
                    templates,
                    total,
                }),
            ))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// List all global templates
///
/// GET /network-templates/global
///
/// Returns templates marked as global (available to all users).
async fn list_global_templates(
    State(db): State<Arc<Database>>,
) -> Result<impl IntoResponse, ApiError> {
    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service.list_global_templates().await {
        Ok(templates) => {
            let total = templates.len();
            Ok((
                StatusCode::OK,
                Json(TemplatesListResponse {
                    success: true,
                    templates,
                    total,
                }),
            ))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Apply template to a project
///
/// POST /network-templates/:id/apply/:project_id
///
/// Applies the network template configuration to a specific project.
async fn apply_template(
    State(db): State<Arc<Database>>,
    Path((template_id, project_id)): Path<(String, String)>,
) -> Result<impl IntoResponse, ApiError> {
    let service = NetworkTemplateService::new(db.as_ref().clone());

    match service
        .apply_template_to_project(&template_id, &project_id)
        .await
    {
        Ok(network_config) => Ok((
            StatusCode::OK,
            Json(ApplyTemplateResponse {
                success: true,
                network_config,
            }),
        )),
        Err(e) => Err(ApiError::BadRequest(e.to_string())),
    }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

#[derive(Debug)]
pub enum ApiError {
    InternalError(String),
    BadRequest(String),
    NotFound(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
        };

        let body = Json(serde_json::json!({
            "error": message,
        }));

        (status, body).into_response()
    }
}
