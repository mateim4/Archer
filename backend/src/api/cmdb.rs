// Archer ITSM - CMDB API Endpoints
// Configuration Management Database REST API

use crate::database::Database;
use crate::middleware::auth::AuthenticatedUser;
use crate::models::cmdb::*;
use crate::services::cmdb_service::{CMDBService, CMDBStatistics};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// ============================================================================
// ROUTER
// ============================================================================

pub fn cmdb_routes() -> Router<Arc<Database>> {
    Router::new()
        // CI endpoints
        .route("/cis", get(list_cis).post(create_ci))
        .route("/cis/search", post(search_cis))
        .route("/cis/statistics", get(get_statistics))
        .route("/cis/:id", get(get_ci).put(update_ci).delete(delete_ci))
        .route("/cis/:id/history", get(get_ci_history))
        .route("/cis/:id/impact", get(analyze_impact))
        // Lookup by CI ID (e.g., SRV-00001)
        .route("/cis/by-ci-id/:ci_id", get(get_ci_by_ci_id))
        // Relationship endpoints
        .route("/relationships", get(list_relationships).post(create_relationship))
        .route("/relationships/:id", delete(delete_relationship))
}

// ============================================================================
// CI HANDLERS
// ============================================================================

/// Create a new Configuration Item
async fn create_ci(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<CreateCIRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:create") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:create' required".to_string(),
        })));
    }

    let tenant_id = user.tenant_id.as_ref();

    match CMDBService::create_ci(
        db,
        request,
        &user.user_id,
        &user.username,
        tenant_id.map(|t| t.as_str()),
    )
    .await
    {
        Ok(ci) => Ok((StatusCode::CREATED, Json(ci))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// List CIs with optional filtering
async fn list_cis(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(params): Query<ListCIsParams>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    let request = CISearchRequest {
        query: params.query,
        ci_class: params.ci_class,
        ci_type: params.ci_type,
        status: None,
        criticality: None,
        environment: params.environment,
        location: params.location,
        owner_id: params.owner_id,
        support_group: params.support_group,
        tags: None,
        page: params.page,
        page_size: params.page_size,
    };

    match CMDBService::search_cis(db, request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Search CIs with advanced filters
async fn search_cis(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<CISearchRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    match CMDBService::search_cis(db, request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get CI by database ID
async fn get_ci(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    match CMDBService::get_ci_detail(db, &id).await {
        Ok(Some(detail)) => Ok(Json(detail)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "CI not found".to_string() }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get CI by CI ID (e.g., "SRV-00001")
async fn get_ci_by_ci_id(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(ci_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    match CMDBService::get_ci_by_ci_id(db, &ci_id).await {
        Ok(Some(ci)) => Ok(Json(ci)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: format!("CI '{}' not found", ci_id) }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Update a CI
async fn update_ci(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(request): Json<UpdateCIRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:update") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:update' required".to_string(),
        })));
    }

    match CMDBService::update_ci(
        db,
        &id,
        request,
        &user.user_id,
        &user.username,
    )
    .await
    {
        Ok(ci) => Ok(Json(ci)),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Delete (decommission) a CI
async fn delete_ci(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:delete") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:delete' required".to_string(),
        })));
    }

    match CMDBService::delete_ci(
        db,
        &id,
        &user.user_id,
        &user.username,
    )
    .await
    {
        Ok(()) => Ok(StatusCode::NO_CONTENT),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get CI change history
async fn get_ci_history(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Query(params): Query<HistoryParams>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    match CMDBService::get_ci_history(db, &id, params.limit).await {
        Ok(history) => Ok(Json(history)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Analyze impact of a CI
async fn analyze_impact(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Query(params): Query<ImpactParams>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    // First get the CI to get its ci_id
    let ci = match CMDBService::get_ci(db.clone(), &id).await {
        Ok(Some(c)) => c,
        Ok(None) => return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "CI not found".to_string() }),
        )),
        Err(e) => return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    };

    let request = ImpactAnalysisRequest {
        ci_id: ci.ci_id,
        depth: params.depth,
        relationship_types: None,
    };

    match CMDBService::analyze_impact(db, request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get CMDB statistics
async fn get_statistics(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    match CMDBService::get_statistics(db).await {
        Ok(stats) => Ok(Json(stats)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

// ============================================================================
// RELATIONSHIP HANDLERS
// ============================================================================

/// List relationships (with optional filter by CI)
async fn list_relationships(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(params): Query<RelationshipListParams>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:read' required".to_string(),
        })));
    }

    if let Some(ci_id) = params.ci_id {
        let ci_thing = surrealdb::sql::Thing::from(("configuration_items", ci_id.as_str()));
        match CMDBService::get_ci_relationships(db, &ci_thing).await {
            Ok(rels) => Ok(Json(rels)),
            Err(e) => Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse { error: e }),
            )),
        }
    } else {
        // Return empty list if no CI specified
        Ok(Json(Vec::<CIRelationship>::new()))
    }
}

/// Create a relationship between two CIs
async fn create_relationship(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<CreateRelationshipRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:update") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:update' required".to_string(),
        })));
    }

    match CMDBService::create_relationship(
        db,
        request,
        &user.user_id,
        &user.username,
    )
    .await
    {
        Ok(rel) => Ok((StatusCode::CREATED, Json(rel))),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) if e.contains("already exists") => Err((
            StatusCode::CONFLICT,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Delete a relationship
async fn delete_relationship(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("cmdb:update") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'cmdb:update' required".to_string(),
        })));
    }

    match CMDBService::delete_relationship(
        db,
        &id,
        &user.user_id,
        &user.username,
    )
    .await
    {
        Ok(()) => Ok(StatusCode::NO_CONTENT),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

// ============================================================================
// QUERY PARAMS
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListCIsParams {
    pub query: Option<String>,
    pub ci_class: Option<CIClass>,
    pub ci_type: Option<String>,
    pub environment: Option<String>,
    pub location: Option<String>,
    pub owner_id: Option<String>,
    pub support_group: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct HistoryParams {
    pub limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct ImpactParams {
    pub depth: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct RelationshipListParams {
    pub ci_id: Option<String>,
}

// ============================================================================
// ERROR RESPONSE
// ============================================================================

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}
