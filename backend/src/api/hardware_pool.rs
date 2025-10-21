use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

use crate::{
    database::Database,
    models::project_models::*,
    services::hardware_pool_service::{
        AllocationRequest, AllocationResult, CreateHardwarePoolRequest, HardwarePoolService,
        HardwareRequirements, UpdateHardwareRequest,
    },
};

pub fn create_hardware_pool_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/servers", post(add_server))
        .route("/servers", get(list_servers))
        .route("/servers/:server_id", get(get_server))
        .route("/servers/:server_id", patch(update_server))
        .route("/servers/:server_id", delete(remove_server))
        .route("/servers/:server_id/availability", get(check_availability))
        .route(
            "/servers/:server_id/maintenance",
            post(schedule_maintenance),
        )
        .route("/search", post(search_servers))
        .route("/allocate", post(allocate_servers))
        .route("/allocations", post(create_allocation))
        .route("/allocations", get(list_allocations))
        .route("/allocations/:allocation_id", get(get_allocation))
        .route("/allocations/:allocation_id", patch(update_allocation_status))
        .route("/allocations/:allocation_id", delete(release_allocation))
        .route("/analytics", get(get_analytics))
        .route("/procurement/:procurement_id/track", get(track_procurement))
        .with_state(db)
}

// =============================================================================
// SERVER INVENTORY MANAGEMENT
// =============================================================================

async fn add_server(
    State(db): State<Arc<Database>>,
    Json(server_request): Json<CreateHardwarePoolRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service.add_server_to_pool(server_request).await {
        Ok(server) => Ok((StatusCode::CREATED, Json(server))),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

#[derive(Debug, Deserialize)]
struct ListServersQuery {
    status: Option<String>,
    vendor: Option<String>,
    datacenter: Option<String>,
    limit: Option<usize>,
    offset: Option<usize>,
}

async fn list_servers(
    State(db): State<Arc<Database>>,
    Query(query): Query<ListServersQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let mut conditions = Vec::new();

    if let Some(status) = query.status {
        conditions.push(format!("availability_status = '{}'", status));
    }
    if let Some(vendor) = query.vendor {
        conditions.push(format!("vendor = '{}'", vendor));
    }
    if let Some(datacenter) = query.datacenter {
        conditions.push(format!("datacenter = '{}'", datacenter));
    }

    let mut query_str = "SELECT * FROM hardware_pool".to_string();

    if !conditions.is_empty() {
        query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }

    query_str.push_str(" ORDER BY created_at DESC");

    if let Some(limit) = query.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
        if let Some(offset) = query.offset {
            query_str.push_str(&format!(" START {}", offset));
        }
    }

    let servers: Result<Vec<HardwarePool>, _> = db
        .query(query_str)
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match servers {
        Ok(servers) => {
            let total = servers.len();
            Ok(Json(ServersListResponse { servers, total }))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn get_server(
    State(db): State<Arc<Database>>,
    Path(server_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let server: Result<Option<HardwarePool>, _> =
        db.select(("hardware_pool", server_id.as_str())).await;

    match server {
        Ok(Some(server)) => Ok(Json(server)),
        Ok(None) => Err(ApiError::NotFound("Server not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn update_server(
    State(db): State<Arc<Database>>,
    Path(server_id): Path<String>,
    Json(updates): Json<UpdateHardwareRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service
        .update_server_specifications(&server_id, updates)
        .await
    {
        Ok(server) => Ok(Json(server)),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn remove_server(
    State(db): State<Arc<Database>>,
    Path(server_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Check if server has active allocations
    let active_allocations: Result<Vec<HardwareAllocation>, _> = db
        .query("SELECT * FROM hardware_allocation WHERE server_id = $server_id AND (allocation_end IS NONE OR allocation_end > time::now())")
        .bind(("server_id", surrealdb::sql::Thing::from(("hardware_pool", server_id.as_str()))))
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match active_allocations {
        Ok(allocations) if !allocations.is_empty() => Err(ApiError::Conflict(
            "Server has active allocations and cannot be removed".to_string(),
        )),
        Ok(_) => {
            // Safe to remove
            let deleted: Result<Option<HardwarePool>, _> =
                db.delete(("hardware_pool", server_id.as_str())).await;

            match deleted {
                Ok(Some(_)) => Ok((StatusCode::NO_CONTENT, ())),
                Ok(None) => Err(ApiError::NotFound("Server not found".to_string())),
                Err(e) => Err(ApiError::InternalError(e.to_string())),
            }
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// AVAILABILITY AND SCHEDULING
// =============================================================================

#[derive(Debug, Deserialize)]
struct AvailabilityQuery {
    start_date: DateTime<Utc>,
    end_date: DateTime<Utc>,
}

async fn check_availability(
    State(db): State<Arc<Database>>,
    Path(server_id): Path<String>,
    Query(query): Query<AvailabilityQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service
        .get_server_availability(&server_id, query.start_date, query.end_date)
        .await
    {
        Ok(availability) => Ok(Json(availability)),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn schedule_maintenance(
    State(db): State<Arc<Database>>,
    Path(server_id): Path<String>,
    Json(maintenance): Json<MaintenanceWindow>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service.schedule_maintenance(&server_id, maintenance).await {
        Ok(_) => Ok((
            StatusCode::CREATED,
            Json(serde_json::json!({"message": "Maintenance scheduled"})),
        )),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// INTELLIGENT SERVER SEARCH AND ALLOCATION
// =============================================================================

async fn search_servers(
    State(db): State<Arc<Database>>,
    Json(requirements): Json<HardwareRequirements>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service.find_optimal_servers(requirements).await {
        Ok(recommendations) => Ok(Json(ServerSearchResponse {
            recommendations,
            search_metadata: SearchMetadata {
                searched_at: Utc::now(),
                total_pool_servers: get_total_servers(&db).await.unwrap_or(0),
            },
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn allocate_servers(
    State(db): State<Arc<Database>>,
    Json(request): Json<AllocationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    // Extract user from request context (in a real app, this would come from auth)
    let requested_by = "system".to_string(); // TODO: Get from authentication context

    match service
        .create_allocation_with_approval(request, requested_by)
        .await
    {
        Ok(AllocationResult::Success(allocations)) => Ok((
            StatusCode::CREATED,
            Json(AllocationResponse::Success {
                allocations,
                message: "Servers successfully allocated".to_string(),
            }),
        )),
        Ok(AllocationResult::PendingApproval(pending)) => Ok((
            StatusCode::ACCEPTED,
            Json(AllocationResponse::PendingApproval {
                pending_request_id: pending.id.unwrap(),
                message: "Allocation requires approval".to_string(),
            }),
        )),
        Ok(AllocationResult::Conflicts(conflicts)) => Ok((
            StatusCode::CONFLICT,
            Json(AllocationResponse::Conflicts {
                conflicts,
                message: "Server conflicts detected".to_string(),
            }),
        )),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn list_allocations(
    State(db): State<Arc<Database>>,
    Query(query): Query<ListAllocationsQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let mut conditions = Vec::new();

    if let Some(project_id) = query.project_id {
        conditions.push(format!("project_id = project:{}", project_id));
    }
    if let Some(server_id) = query.server_id {
        conditions.push(format!("server_id = hardware_pool:{}", server_id));
    }
    if query.active_only.unwrap_or(false) {
        conditions.push("(allocation_end IS NONE OR allocation_end > time::now())".to_string());
    }

    let mut query_str = "SELECT * FROM hardware_allocation".to_string();

    if !conditions.is_empty() {
        query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }

    query_str.push_str(" ORDER BY allocation_start DESC");

    if let Some(limit) = query.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
    }

    let allocations: Result<Vec<HardwareAllocation>, _> = db
        .query(query_str)
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match allocations {
        Ok(allocations) => {
            let total = allocations.len();
            Ok(Json(AllocationsListResponse { allocations, total }))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn release_allocation(
    State(db): State<Arc<Database>>,
    Path(allocation_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Get allocation details
    let allocation: Result<Option<HardwareAllocation>, _> = db
        .select(("hardware_allocation", allocation_id.as_str()))
        .await;

    match allocation {
        Ok(Some(allocation)) => {
            // End the allocation
            let _: Result<Option<HardwareAllocation>, _> = db
                .update(("hardware_allocation", allocation_id.as_str()))
                .merge(serde_json::json!({
                    "allocation_end": Utc::now()
                }))
                .await;

            // Update server status back to available
            if let surrealdb::sql::Thing { id, .. } = &allocation.server_id {
                let _: Result<Option<HardwarePool>, _> = db
                    .update(("hardware_pool", id.to_raw().as_str()))
                    .merge(serde_json::json!({
                        "availability_status": "available",
                        "updated_at": Utc::now()
                    }))
                    .await;
            }

            Ok((StatusCode::NO_CONTENT, ()))
        }
        Ok(None) => Err(ApiError::NotFound("Allocation not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Create a new hardware allocation (direct reservation)
async fn create_allocation(
    State(db): State<Arc<Database>>,
    Json(request): Json<CreateAllocationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Validate server exists and is available
    let server: Result<Option<HardwarePool>, _> = db
        .select(("hardware_pool", request.server_id.as_str()))
        .await;

    let server = match server {
        Ok(Some(s)) => s,
        Ok(None) => return Err(ApiError::NotFound("Server not found".to_string())),
        Err(e) => return Err(ApiError::InternalError(e.to_string())),
    };

    if !matches!(server.availability_status, AvailabilityStatus::Available) {
        return Err(ApiError::Conflict(format!(
            "Server is not available (status: {:?})",
            server.availability_status
        )));
    }

    // Create allocation record
    let allocation = HardwareAllocation {
        id: None,
        server_id: surrealdb::sql::Thing::from(("hardware_pool", request.server_id.as_str())),
        project_id: surrealdb::sql::Thing::from(("project", request.project_id.as_str())),
        workflow_id: request.workflow_id.map(|id| surrealdb::sql::Thing::from(("workflow", id.as_str()))),
        allocated_by: request.allocated_by,
        allocation_start: request.allocation_start.unwrap_or_else(Utc::now),
        allocation_end: request.allocation_end,
        allocation_type: AllocationType::Reserved,
        purpose: request.purpose,
        configuration_notes: request.configuration_notes,
        approved_by: None,
        metadata: request.metadata.unwrap_or_default(),
        created_at: Utc::now(),
    };

    let created: Result<Vec<HardwareAllocation>, _> = db
        .create("hardware_allocation")
        .content(allocation)
        .await;

    match created {
        Ok(mut allocations) if !allocations.is_empty() => {
            let allocation = allocations.remove(0);

            // Update server status
            let _: Result<Option<HardwarePool>, _> = db
                .update(("hardware_pool", request.server_id.as_str()))
                .merge(serde_json::json!({
                    "availability_status": "reserved"
                }))
                .await;

            Ok((StatusCode::CREATED, Json(allocation)))
        }
        Ok(_) => Err(ApiError::InternalError(
            "Failed to create allocation".to_string(),
        )),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Get a specific allocation by ID
async fn get_allocation(
    State(db): State<Arc<Database>>,
    Path(allocation_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let allocation: Result<Option<HardwareAllocation>, _> = db
        .select(("hardware_allocation", allocation_id.as_str()))
        .await;

    match allocation {
        Ok(Some(allocation)) => Ok(Json(allocation)),
        Ok(None) => Err(ApiError::NotFound("Allocation not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Update allocation status (for tracking migration progress)
async fn update_allocation_status(
    State(db): State<Arc<Database>>,
    Path(allocation_id): Path<String>,
    Json(update): Json<UpdateAllocationStatusRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Get current allocation
    let allocation: Result<Option<HardwareAllocation>, _> = db
        .select(("hardware_allocation", allocation_id.as_str()))
        .await;

    let allocation = match allocation {
        Ok(Some(a)) => a,
        Ok(None) => return Err(ApiError::NotFound("Allocation not found".to_string())),
        Err(e) => return Err(ApiError::InternalError(e.to_string())),
    };

    // Update allocation
    let updated: Result<Option<HardwareAllocation>, _> = db
        .update(("hardware_allocation", allocation_id.as_str()))
        .merge(serde_json::json!({
            "allocation_type": update.allocation_type,
            "configuration_notes": update.configuration_notes,
            "metadata": update.metadata
        }))
        .await;

    match updated {
        Ok(Some(allocation)) => {
            // If allocation type is "deployed", update server status to allocated
            if matches!(update.allocation_type, AllocationType::Deployed) {
                if let surrealdb::sql::Thing { id, .. } = &allocation.server_id {
                    let _: Result<Option<HardwarePool>, _> = db
                        .update(("hardware_pool", id.to_raw().as_str()))
                        .merge(serde_json::json!({
                            "availability_status": "allocated"
                        }))
                        .await;
                }
            }

            Ok(Json(allocation))
        }
        Ok(None) => Err(ApiError::NotFound("Allocation not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

async fn get_analytics(State(db): State<Arc<Database>>) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service.get_pool_analytics().await {
        Ok(analytics) => Ok(Json(analytics)),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// PROCUREMENT INTEGRATION
// =============================================================================

async fn track_procurement(
    State(db): State<Arc<Database>>,
    Path(procurement_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let service = HardwarePoolService::new((*db).clone());

    match service.track_procurement_to_pool(&procurement_id).await {
        Ok(status) => Ok(Json(ProcurementTrackingResponse {
            procurement_id,
            status,
            last_updated: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// HELPER FUNCTIONS AND TYPES
// =============================================================================

async fn get_total_servers(db: &Database) -> Result<usize, Box<dyn std::error::Error>> {
    let count: Vec<serde_json::Value> = db
        .query("SELECT COUNT() as total FROM hardware_pool")
        .await?
        .take(0)?;

    Ok(count
        .first()
        .and_then(|v| v.get("total"))
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize)
}

// Response types
#[derive(Debug, Serialize)]
struct ServersListResponse {
    servers: Vec<HardwarePool>,
    total: usize,
}

#[derive(Debug, Serialize)]
struct ServerSearchResponse {
    recommendations: Vec<crate::services::hardware_pool_service::ServerRecommendation>,
    search_metadata: SearchMetadata,
}

#[derive(Debug, Serialize)]
struct SearchMetadata {
    searched_at: DateTime<Utc>,
    total_pool_servers: usize,
}

/// Request to create a direct hardware allocation
#[derive(Debug, Deserialize)]
struct CreateAllocationRequest {
    server_id: String,
    project_id: String,
    workflow_id: Option<String>,
    allocated_by: String,
    allocation_start: Option<DateTime<Utc>>,
    allocation_end: Option<DateTime<Utc>>,
    purpose: String,
    configuration_notes: Option<String>,
    metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Request to update allocation status
#[derive(Debug, Deserialize)]
struct UpdateAllocationStatusRequest {
    allocation_type: AllocationType,
    configuration_notes: Option<String>,
    metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum AllocationResponse {
    Success {
        allocations: Vec<HardwareAllocation>,
        message: String,
    },
    PendingApproval {
        pending_request_id: surrealdb::sql::Thing,
        message: String,
    },
    Conflicts {
        conflicts: Vec<crate::services::hardware_pool_service::AllocationConflict>,
        message: String,
    },
}

#[derive(Debug, Deserialize)]
struct ListAllocationsQuery {
    project_id: Option<String>,
    server_id: Option<String>,
    active_only: Option<bool>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize)]
struct AllocationsListResponse {
    allocations: Vec<HardwareAllocation>,
    total: usize,
}

#[derive(Debug, Serialize)]
struct ProcurementTrackingResponse {
    procurement_id: String,
    status: ProcurementStatus,
    last_updated: DateTime<Utc>,
}

// Error handling
#[derive(Debug)]
enum ApiError {
    NotFound(String),
    Conflict(String),
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ApiError::Conflict(msg) => (StatusCode::CONFLICT, msg),
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
