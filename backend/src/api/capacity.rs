//! Capacity Planning API
//!
//! Endpoints for capacity calculation and VM placement planning.

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::post,
    Json, Router,
};
use std::sync::Arc;

use crate::{
    database::Database,
    services::capacity_planner_service::{
        CapacityPlannerService, CapacityPlanRequest, CapacityPlanResponse, PlacementRequest,
        PlacementResponse,
    },
};

pub fn create_capacity_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/plan", post(plan_capacity))
        .route("/placement", post(plan_placement))
        .with_state(db)
}

// =============================================================================
// CAPACITY PLANNING ENDPOINTS
// =============================================================================

/// Calculate capacity for a migration plan
///
/// POST /capacity/plan
///
/// Computes aggregate capacity across target clusters, identifies bottlenecks,
/// calculates utilization percentages, and provides recommendations.
async fn plan_capacity(
    State(db): State<Arc<Database>>,
    Json(request): Json<CapacityPlanRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = CapacityPlannerService::new((*db).clone());

    match service.compute_capacity(request).await {
        Ok(response) => Ok((StatusCode::OK, Json(response))),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Plan VM placement across clusters
///
/// POST /capacity/placement
///
/// Uses placement algorithms to distribute VMs across target clusters,
/// handles spillover to additional clusters, and identifies unplaceable VMs.
async fn plan_placement(
    State(db): State<Arc<Database>>,
    Json(request): Json<PlacementRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = CapacityPlannerService::new((*db).clone());

    match service.plan_placement(request).await {
        Ok(response) => Ok((StatusCode::OK, Json(response))),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

#[derive(Debug)]
enum ApiError {
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (
            status,
            Json(serde_json::json!({
                "error": message
            })),
        )
            .into_response()
    }
}
