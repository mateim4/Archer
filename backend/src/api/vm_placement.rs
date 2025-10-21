//! VM Placement API
//!
//! Endpoints for intelligent VM-to-cluster placement with multiple strategies.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    database::Database,
    services::vm_placement_service::{
        ClusterCapacityStatus, PlacementResult, PlacementStrategy, VMPlacementService,
        VMResourceRequirements,
    },
};

pub fn create_vm_placement_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/calculate", post(calculate_placements))
        .route("/validate", post(validate_placement))
        .route("/optimize/:project_id", post(optimize_placements))
        .with_state(db)
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CalculatePlacementsRequest {
    pub project_id: String,
    pub vms: Vec<VMResourceRequirements>,
    pub clusters: Vec<ClusterCapacityStatus>,
    pub strategy: PlacementStrategy,
}

#[derive(Debug, Serialize)]
pub struct CalculatePlacementsResponse {
    pub success: bool,
    pub result: PlacementResult,
}

#[derive(Debug, Deserialize)]
pub struct ValidatePlacementRequest {
    pub vms: Vec<VMResourceRequirements>,
    pub clusters: Vec<ClusterCapacityStatus>,
}

#[derive(Debug, Serialize)]
pub struct ValidatePlacementResponse {
    pub is_feasible: bool,
    pub warnings: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct OptimizePlacementsRequest {
    pub vms: Vec<VMResourceRequirements>,
    pub clusters: Vec<ClusterCapacityStatus>,
}

// =============================================================================
// VM PLACEMENT ENDPOINTS
// =============================================================================

/// Calculate VM placements using specified strategy
///
/// POST /vm-placement/calculate
///
/// Takes a list of VMs and destination clusters, applies the selected
/// placement strategy, and returns placement assignments with utilization metrics.
async fn calculate_placements(
    State(db): State<Arc<Database>>,
    Json(request): Json<CalculatePlacementsRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = VMPlacementService::new();

    let result = service.calculate_placements(
        request.vms,
        request.clusters,
        request.strategy,
        &request.project_id,
    );

    Ok((
        StatusCode::OK,
        Json(CalculatePlacementsResponse {
            success: true,
            result,
        }),
    ))
}

/// Validate placement feasibility
///
/// POST /vm-placement/validate
///
/// Checks if the provided VMs can fit within the available cluster capacity.
/// Returns feasibility status and any capacity warnings.
async fn validate_placement(
    State(_db): State<Arc<Database>>,
    Json(request): Json<ValidatePlacementRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = VMPlacementService::new();

    let (is_feasible, warnings) = service.validate_placement(&request.vms, &request.clusters);

    Ok((
        StatusCode::OK,
        Json(ValidatePlacementResponse {
            is_feasible,
            warnings,
        }),
    ))
}

/// Optimize existing placements
///
/// POST /vm-placement/optimize/:project_id
///
/// Re-calculates placements using the Balanced strategy to optimize
/// resource distribution across clusters.
async fn optimize_placements(
    State(db): State<Arc<Database>>,
    Path(project_id): Path<String>,
    Json(request): Json<OptimizePlacementsRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = VMPlacementService::new();

    // Fetch current placements from database (placeholder - would query SurrealDB)
    let current_placements = Vec::new();

    let result = service.optimize_placements(
        current_placements,
        request.vms,
        request.clusters,
        &project_id,
    );

    Ok((
        StatusCode::OK,
        Json(CalculatePlacementsResponse {
            success: true,
            result,
        }),
    ))
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
