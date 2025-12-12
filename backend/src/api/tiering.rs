// Archer ITSM - Tiering API
// Endpoints for hot/cold data tiering management

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    database::Database,
    middleware::auth::{require_auth, AuthState, AuthenticatedUser},
    services::tiering_service::{TieringService, TieringStats, ArchivalReport},
};

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ReheatRequest {
    pub ticket_id: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchParams {
    pub query: String,
    pub namespace: Option<String>,
    #[serde(default)]
    pub include_archived: bool,
}

#[derive(Debug, Deserialize)]
pub struct ArchivalParams {
    #[serde(default)]
    pub dry_run: bool,
}

#[derive(Debug, Serialize)]
pub struct TieringResponse<T> {
    pub status: String,
    pub data: T,
}

// ============================================================================
// ROUTER CREATION
// ============================================================================

/// Create Tiering API router
pub fn create_tiering_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();
    
    Router::new()
        // Statistics endpoint
        .route("/stats", get(get_tiering_stats))
        // Reheat operations
        .route("/reheat", post(reheat_ticket))
        .route("/reheat/:ticket_id", post(reheat_ticket_by_path))
        // Search across tiers
        .route("/search", get(search_all_tiers))
        // Manual archival trigger (admin)
        .route("/archive/run", post(run_archival))
        // Check if ticket is archived
        .route("/archived/:ticket_id", get(check_archived))
        // Get ticket from archive (without reheat)
        .route("/archive/:ticket_id", get(get_from_archive))
        // Tier transitions
        .route("/transition/hot-to-warm", post(transition_hot_to_warm))
        .with_state(db)
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
}

// ============================================================================
// HANDLERS
// ============================================================================

/// GET /api/v1/tiering/stats
/// Get tiering statistics
async fn get_tiering_stats(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    
    match tiering_service.get_stats(user.tenant_id.as_deref()).await {
        Ok(stats) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: stats,
            }),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "error": e.to_string()
            })),
        ).into_response(),
    }
}

/// POST /api/v1/tiering/reheat
/// Reheat a ticket from cold storage
async fn reheat_ticket(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<ReheatRequest>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    let triggered_by = format!("user:{}", user.user_id);
    
    match tiering_service.reheat_ticket(&request.ticket_id, &triggered_by).await {
        Ok(ticket) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: serde_json::json!({
                    "message": "Ticket reheated successfully",
                    "ticket": ticket,
                    "from_tier": "cold",
                    "to_tier": "hot"
                }),
            }),
        ).into_response(),
        Err(e) => {
            let error_msg = e.to_string();
            let status = if error_msg.contains("not found") {
                StatusCode::NOT_FOUND
            } else if error_msg.contains("cooldown") {
                StatusCode::TOO_MANY_REQUESTS
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
            (
                status,
                Json(serde_json::json!({
                    "status": "error",
                    "error": error_msg
                })),
            ).into_response()
        }
    }
}

/// POST /api/v1/tiering/reheat/:ticket_id
/// Reheat a ticket by path parameter
async fn reheat_ticket_by_path(
    State(db): State<Arc<Database>>,
    Path(ticket_id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    let triggered_by = format!("user:{}", user.user_id);
    
    match tiering_service.reheat_ticket(&ticket_id, &triggered_by).await {
        Ok(ticket) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: serde_json::json!({
                    "message": "Ticket reheated successfully",
                    "ticket": ticket,
                    "from_tier": "cold",
                    "to_tier": "hot"
                }),
            }),
        ).into_response(),
        Err(e) => {
            let error_msg = e.to_string();
            let status = if error_msg.contains("not found") {
                StatusCode::NOT_FOUND
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
            (
                status,
                Json(serde_json::json!({
                    "status": "error",
                    "error": error_msg
                })),
            ).into_response()
        }
    }
}

/// GET /api/v1/tiering/search
/// Search across all tiers
async fn search_all_tiers(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Query(params): Query<SearchParams>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    
    match tiering_service.search_all_tiers(
        &params.query,
        params.namespace.as_deref().or(user.tenant_id.as_deref()),
        params.include_archived,
    ).await {
        Ok(results) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: serde_json::json!({
                    "results": results,
                    "count": results.len(),
                    "include_archived": params.include_archived
                }),
            }),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "error": e.to_string()
            })),
        ).into_response(),
    }
}

/// POST /api/v1/tiering/archive/run
/// Manually trigger archival job (admin only)
async fn run_archival(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Query(params): Query<ArchivalParams>,
) -> impl IntoResponse {
    // TODO: Add admin role check
    
    let tiering_service = TieringService::new(db);
    
    if params.dry_run {
        // Just return stats without actually archiving
        match tiering_service.get_stats(None).await {
            Ok(stats) => (
                StatusCode::OK,
                Json(TieringResponse {
                    status: "success".to_string(),
                    data: serde_json::json!({
                        "dry_run": true,
                        "would_transition_to_warm": stats.hot_count, // Estimate
                        "would_archive": stats.warm_count, // Estimate
                        "current_stats": stats
                    }),
                }),
            ).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "status": "error",
                    "error": e.to_string()
                })),
            ).into_response(),
        }
    } else {
        // Run actual archival
        match tiering_service.run_archival_job().await {
            Ok(report) => (
                StatusCode::OK,
                Json(TieringResponse {
                    status: "success".to_string(),
                    data: report,
                }),
            ).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "status": "error",
                    "error": e.to_string()
                })),
            ).into_response(),
        }
    }
}

/// GET /api/v1/tiering/archived/:ticket_id
/// Check if a ticket is in the archive
async fn check_archived(
    State(db): State<Arc<Database>>,
    Path(ticket_id): Path<String>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    
    match tiering_service.is_archived(&ticket_id).await {
        Ok(is_archived) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: serde_json::json!({
                    "ticket_id": ticket_id,
                    "is_archived": is_archived,
                    "tier": if is_archived { "cold" } else { "hot/warm" }
                }),
            }),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "error": e.to_string()
            })),
        ).into_response(),
    }
}

/// GET /api/v1/tiering/archive/:ticket_id
/// Get ticket from archive without reheating
async fn get_from_archive(
    State(db): State<Arc<Database>>,
    Path(ticket_id): Path<String>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    
    match tiering_service.get_from_archive(&ticket_id).await {
        Ok(Some(archived)) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: serde_json::json!({
                    "ticket": archived,
                    "served_from_tier": "cold",
                    "note": "Use POST /tiering/reheat to restore to hot tier"
                }),
            }),
        ).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "status": "error",
                "error": "Ticket not found in archive"
            })),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "error": e.to_string()
            })),
        ).into_response(),
    }
}

/// POST /api/v1/tiering/transition/hot-to-warm
/// Manually trigger hot-to-warm transition
async fn transition_hot_to_warm(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let tiering_service = TieringService::new(db);
    
    match tiering_service.transition_hot_to_warm().await {
        Ok(count) => (
            StatusCode::OK,
            Json(TieringResponse {
                status: "success".to_string(),
                data: serde_json::json!({
                    "message": format!("Transitioned {} tickets from hot to warm", count),
                    "count": count
                }),
            }),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "status": "error",
                "error": e.to_string()
            })),
        ).into_response(),
    }
}
