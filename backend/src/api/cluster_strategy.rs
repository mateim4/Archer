//! Cluster Migration Strategy API
//!
//! This module provides endpoints for managing cluster migration strategies within a project,
//! including domino hardware swaps, new hardware procurement, and dependency validation.
//!
//! ## Endpoints
//!
//! - `POST /api/projects/{id}/cluster-strategies` - Configure a new cluster migration strategy
//! - `GET /api/projects/{id}/cluster-strategies` - List all cluster strategies for a project
//! - `GET /api/projects/{id}/cluster-strategies/{strategy_id}` - Get a specific strategy
//! - `PUT /api/projects/{id}/cluster-strategies/{strategy_id}` - Update an existing strategy
//! - `DELETE /api/projects/{id}/cluster-strategies/{strategy_id}` - Delete a strategy
//! - `POST /api/projects/{id}/validate-dependencies` - Validate domino dependency chains
//! - `GET /api/projects/{id}/hardware-timeline` - Get hardware availability timeline
//! - `POST /api/projects/{id}/cluster-strategies/{strategy_id}/validate-capacity` - Validate capacity

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

use crate::{
    models::migration_models::*,
    services::dependency_validator::DependencyValidator,
    database::AppState,
};

/// API response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: None,
        }
    }

    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
            message: None,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: Some(message),
        }
    }
}

/// Request payload for configuring a cluster migration strategy
#[derive(Debug, Serialize, Deserialize)]
pub struct ConfigureStrategyRequest {
    pub source_cluster_name: String,
    pub target_cluster_name: String,
    pub strategy_type: MigrationStrategyType,
    
    // Optional fields based on strategy type
    pub domino_source_cluster: Option<String>,
    pub hardware_basket_items: Option<Vec<String>>,
    pub hardware_pool_allocations: Option<Vec<String>>,
    
    // Capacity requirements
    pub required_cpu_cores: Option<u32>,
    pub required_memory_gb: Option<u32>,
    pub required_storage_tb: Option<f64>,
    
    // Timeline
    pub planned_start_date: Option<String>,
    pub planned_completion_date: Option<String>,
    
    pub notes: Option<String>,
}

/// Request payload for capacity validation
#[derive(Debug, Serialize, Deserialize)]
pub struct ValidateCapacityRequest {
    pub target_hardware_specs: Vec<HardwareSpec>,
    pub overcommit_ratios: Option<OvercommitRatios>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareSpec {
    pub model_name: String,
    pub cpu_cores: u32,
    pub memory_gb: u32,
    pub storage_tb: f64,
    pub quantity: u32,
}

/// Register cluster strategy routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/api/projects/:project_id/cluster-strategies",
            post(configure_cluster_strategy).get(list_cluster_strategies),
        )
        .route(
            "/api/projects/:project_id/cluster-strategies/:strategy_id",
            get(get_cluster_strategy)
                .put(update_cluster_strategy)
                .delete(delete_cluster_strategy),
        )
        .route(
            "/api/projects/:project_id/validate-dependencies",
            post(validate_dependencies),
        )
        .route(
            "/api/projects/:project_id/hardware-timeline",
            get(get_hardware_timeline),
        )
        .route(
            "/api/projects/:project_id/cluster-strategies/:strategy_id/validate-capacity",
            post(validate_capacity),
        )
}

/// Configure a new cluster migration strategy
///
/// # Arguments
/// * `project_id` - Project identifier
/// * `request` - Strategy configuration details
///
/// # Returns
/// * `201 Created` - Strategy created successfully
/// * `400 Bad Request` - Invalid strategy configuration
/// * `500 Internal Server Error` - Database error
pub async fn configure_cluster_strategy(
    Path(project_id): Path<String>,
    State(state): State<AppState>,
    Json(request): Json<ConfigureStrategyRequest>,
) -> Result<Json<ApiResponse<ClusterMigrationPlan>>, StatusCode> {
    // Validate strategy type requirements
    let validation_result = validate_strategy_request(&request);
    if let Err(err) = validation_result {
        return Ok(Json(ApiResponse::error(err)));
    }

    // Parse project ID
    let project_thing = Thing::from(("projects", project_id.as_str()));

    // Create cluster migration plan
    let mut plan = ClusterMigrationPlan::new(
        project_thing.clone(),
        request.source_cluster_name,
        request.target_cluster_name,
        "system".to_string(), // TODO: Get from auth context
    );

    // Set strategy type and related fields
    plan.strategy_type = request.strategy_type.clone();
    
    match request.strategy_type {
        MigrationStrategyType::DominoHardwareSwap => {
            plan.domino_source_cluster = request.domino_source_cluster;
            // Hardware available date will be set when source cluster completes
            plan.status = MigrationPlanStatus::PendingHardware;
        }
        MigrationStrategyType::NewHardwarePurchase => {
            plan.hardware_basket_items = request.hardware_basket_items.unwrap_or_default();
            plan.status = MigrationPlanStatus::PendingHardware;
        }
        MigrationStrategyType::ExistingFreeHardware => {
            plan.hardware_pool_allocations = request.hardware_pool_allocations.unwrap_or_default();
            plan.status = MigrationPlanStatus::ReadyToMigrate;
        }
    }

    // Set capacity requirements
    if let Some(cpu) = request.required_cpu_cores {
        plan.required_cpu_cores = cpu;
    }
    if let Some(memory) = request.required_memory_gb {
        plan.required_memory_gb = memory;
    }
    if let Some(storage) = request.required_storage_tb {
        plan.required_storage_tb = storage;
    }

    // Set timeline
    if let Some(start_date) = request.planned_start_date {
        plan.planned_start_date = chrono::DateTime::parse_from_rfc3339(&start_date)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
    }
    if let Some(completion_date) = request.planned_completion_date {
        plan.planned_completion_date = chrono::DateTime::parse_from_rfc3339(&completion_date)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
    }

    plan.notes = request.notes;

    // Save to database
    let created: Result<Option<ClusterMigrationPlan>, surrealdb::Error> = state
        .db
        .create("cluster_migration_plans")
        .content(&plan)
        .await;

    match created {
        Ok(Some(created_plan)) => Ok(Json(ApiResponse::success_with_message(
            created_plan,
            "Cluster migration strategy configured successfully".to_string(),
        ))),
        Ok(None) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(e) => {
            eprintln!("Database error creating cluster strategy: {:?}", e);
            Ok(Json(ApiResponse::error(format!(
                "Failed to create cluster strategy: {}",
                e
            ))))
        }
    }
}

/// List all cluster strategies for a project
pub async fn list_cluster_strategies(
    Path(project_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<ClusterMigrationPlan>>>, StatusCode> {
    let project_thing = Thing::from(("projects", project_id.as_str()));

    let query = "SELECT * FROM cluster_migration_plans WHERE project_id = $project_id ORDER BY created_at DESC";
    
    let mut result = state.query(query)
        .bind(("project_id", project_thing))
        .await
        .map_err(|e| {
            eprintln!("Database error listing cluster strategies: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let strategies: Vec<ClusterMigrationPlan> = result.take(0).map_err(|e| {
        eprintln!("Error parsing cluster strategies: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(ApiResponse::success(strategies)))
}

/// Get a specific cluster strategy
pub async fn get_cluster_strategy(
    Path((project_id, strategy_id)): Path<(String, String)>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ClusterMigrationPlan>>, StatusCode> {
    let strategy_thing = Thing::from(("cluster_migration_plans", strategy_id.as_str()));

    let strategy: Option<ClusterMigrationPlan> = state
        .db
        .select(strategy_thing)
        .await
        .map_err(|e| {
            eprintln!("Database error fetching cluster strategy: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match strategy {
        Some(s) => Ok(Json(ApiResponse::success(s))),
        None => Ok(Json(ApiResponse::error(
            "Cluster strategy not found".to_string(),
        ))),
    }
}

/// Update an existing cluster strategy
pub async fn update_cluster_strategy(
    Path((project_id, strategy_id)): Path<(String, String)>,
    State(state): State<AppState>,
    Json(request): Json<ConfigureStrategyRequest>,
) -> Result<Json<ApiResponse<ClusterMigrationPlan>>, StatusCode> {
    // Validate strategy request
    let validation_result = validate_strategy_request(&request);
    if let Err(err) = validation_result {
        return Ok(Json(ApiResponse::error(err)));
    }

    let strategy_thing = Thing::from(("cluster_migration_plans", strategy_id.as_str()));

    // Fetch existing strategy
    let existing: Option<ClusterMigrationPlan> = state
        .db
        .select(strategy_thing.clone())
        .await
        .map_err(|e| {
            eprintln!("Database error fetching strategy: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let mut plan = match existing {
        Some(p) => p,
        None => {
            return Ok(Json(ApiResponse::error(
                "Cluster strategy not found".to_string(),
            )))
        }
    };

    // Update fields
    plan.source_cluster_name = request.source_cluster_name;
    plan.target_cluster_name = request.target_cluster_name;
    plan.strategy_type = request.strategy_type.clone();
    plan.updated_at = Utc::now();

    match request.strategy_type {
        MigrationStrategyType::DominoHardwareSwap => {
            plan.domino_source_cluster = request.domino_source_cluster;
        }
        MigrationStrategyType::NewHardwarePurchase => {
            plan.hardware_basket_items = request.hardware_basket_items.unwrap_or_default();
        }
        MigrationStrategyType::ExistingFreeHardware => {
            plan.hardware_pool_allocations = request.hardware_pool_allocations.unwrap_or_default();
        }
    }

    if let Some(cpu) = request.required_cpu_cores {
        plan.required_cpu_cores = cpu;
    }
    if let Some(memory) = request.required_memory_gb {
        plan.required_memory_gb = memory;
    }
    if let Some(storage) = request.required_storage_tb {
        plan.required_storage_tb = storage;
    }

    if let Some(start_date) = request.planned_start_date {
        plan.planned_start_date = chrono::DateTime::parse_from_rfc3339(&start_date)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
    }
    if let Some(completion_date) = request.planned_completion_date {
        plan.planned_completion_date = chrono::DateTime::parse_from_rfc3339(&completion_date)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
    }

    plan.notes = request.notes;

    // Update in database
    let updated: Result<Option<ClusterMigrationPlan>, surrealdb::Error> = state
        .db
        .update(strategy_thing)
        .content(&plan)
        .await;

    match updated {
        Ok(Some(updated_plan)) => Ok(Json(ApiResponse::success_with_message(
            updated_plan,
            "Cluster migration strategy updated successfully".to_string(),
        ))),
        Ok(None) => Err(StatusCode::INTERNAL_SERVER_ERROR),
        Err(e) => {
            eprintln!("Database error updating cluster strategy: {:?}", e);
            Ok(Json(ApiResponse::error(format!(
                "Failed to update cluster strategy: {}",
                e
            ))))
        }
    }
}

/// Delete a cluster strategy
pub async fn delete_cluster_strategy(
    Path((project_id, strategy_id)): Path<(String, String)>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let strategy_thing = Thing::from(("cluster_migration_plans", strategy_id.as_str()));

    let _deleted: Option<ClusterMigrationPlan> = state
        .db
        .delete(strategy_thing)
        .await
        .map_err(|e| {
            eprintln!("Database error deleting cluster strategy: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::success_with_message(
        "deleted".to_string(),
        "Cluster migration strategy deleted successfully".to_string(),
    )))
}

/// Validate domino dependency chains for all cluster strategies in a project
///
/// This endpoint detects:
/// - Circular dependencies (A depends on B, B depends on A)
/// - Missing dependencies (cluster references non-existent source)
/// - Generates optimal execution order
pub async fn validate_dependencies(
    Path(project_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<DependencyValidationResult>>, StatusCode> {
    let project_thing = Thing::from(("projects", project_id.as_str()));

    // Fetch all cluster strategies for this project
    let query = "SELECT * FROM cluster_migration_plans WHERE project_id = $project_id";
    
    let mut result = state.query(query)
        .bind(("project_id", project_thing))
        .await
        .map_err(|e| {
            eprintln!("Database error fetching strategies for validation: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let strategies: Vec<ClusterMigrationPlan> = result.take(0).map_err(|e| {
        eprintln!("Error parsing strategies: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Use dependency validator service
    let validator = DependencyValidator::new(strategies);
    let validation_result = validator.validate();

    Ok(Json(ApiResponse::success(validation_result)))
}

/// Get hardware availability timeline for a project
///
/// Returns a timeline showing when hardware becomes available from:
/// - Domino swaps (hardware from decommissioned clusters)
/// - Procurement orders (expected delivery dates)
/// - Existing pool (already available)
pub async fn get_hardware_timeline(
    Path(project_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<HardwareAvailabilityTimeline>>, StatusCode> {
    let project_thing = Thing::from(("projects", project_id.as_str()));

    // Fetch all cluster strategies
    let strategies_query = "SELECT * FROM cluster_migration_plans WHERE project_id = $project_id";
    let mut strategies_result = state.query(strategies_query)
        .bind(("project_id", project_thing.clone()))
        .await
        .map_err(|e| {
            eprintln!("Database error fetching strategies: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let strategies: Vec<ClusterMigrationPlan> = strategies_result.take(0).map_err(|e| {
        eprintln!("Error parsing strategies: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Fetch procurement orders
    let procurement_query = "SELECT * FROM procurement_orders WHERE project_id = $project_id";
    let mut procurement_result = state.query(procurement_query)
        .bind(("project_id", project_thing.clone()))
        .await
        .map_err(|e| {
            eprintln!("Database error fetching procurement orders: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let procurement_orders: Vec<ProcurementOrder> = procurement_result.take(0).unwrap_or_default();

    // Build timeline entries
    let mut timeline_entries: Vec<HardwareTimelineEntry> = Vec::new();

    // Add domino swap entries
    for strategy in &strategies {
        if strategy.strategy_type == MigrationStrategyType::DominoHardwareSwap {
            if let Some(ref source_cluster) = strategy.domino_source_cluster {
                if let Some(available_date) = strategy.hardware_available_date {
                    timeline_entries.push(HardwareTimelineEntry {
                        available_date,
                        source: HardwareSource::DominoSwap {
                            source_cluster: source_cluster.clone(),
                        },
                        hardware_items: strategy.domino_hardware_items.clone().unwrap_or_default(),
                        allocated_to_clusters: vec![strategy.target_cluster_name.clone()],
                        description: format!(
                            "Hardware from {} decommission available for {}",
                            source_cluster, strategy.target_cluster_name
                        ),
                    });
                }
            }
        }
    }

    // Add procurement entries
    for order in &procurement_orders {
        if let Some(expected_delivery) = order.expected_delivery_date {
            let hardware_items: Vec<String> = order
                .hardware_items
                .iter()
                .map(|item| format!("{}x {}", item.quantity, item.model_name))
                .collect();

            timeline_entries.push(HardwareTimelineEntry {
                available_date: expected_delivery,
                source: HardwareSource::Procurement {
                    order_number: order.order_number.clone(),
                },
                hardware_items,
                allocated_to_clusters: order.allocated_to_clusters.clone(),
                description: format!(
                    "Procurement order {} delivery expected",
                    order.order_number
                ),
            });
        }
    }

    // Add existing pool entries
    for strategy in &strategies {
        if strategy.strategy_type == MigrationStrategyType::ExistingFreeHardware {
            timeline_entries.push(HardwareTimelineEntry {
                available_date: Utc::now(),
                source: HardwareSource::ExistingPool,
                hardware_items: strategy.hardware_pool_allocations.clone(),
                allocated_to_clusters: vec![strategy.target_cluster_name.clone()],
                description: format!(
                    "Hardware from existing pool allocated to {}",
                    strategy.target_cluster_name
                ),
            });
        }
    }

    // Sort timeline by date
    timeline_entries.sort_by(|a, b| a.available_date.cmp(&b.available_date));

    let timeline = HardwareAvailabilityTimeline {
        project_id: project_thing,
        timeline: timeline_entries.clone(),
        timeline_entries,
        total_domino_chains: 0, // TODO: Calculate actual domino chains
        longest_chain_length: 0, // TODO: Calculate actual chain length
        generated_at: Utc::now(),
    };

    Ok(Json(ApiResponse::success(timeline)))
}

/// Validate capacity for a cluster strategy
///
/// Checks if the target hardware configuration can accommodate the source cluster's workload
pub async fn validate_capacity(
    Path((project_id, strategy_id)): Path<(String, String)>,
    State(state): State<AppState>,
    Json(request): Json<ValidateCapacityRequest>,
) -> Result<Json<ApiResponse<CapacityValidationResult>>, StatusCode> {
    let strategy_thing = Thing::from(("cluster_migration_plans", strategy_id.as_str()));

    // Fetch strategy
    let strategy: Option<ClusterMigrationPlan> = state
        .db
        .select(strategy_thing)
        .await
        .map_err(|e| {
            eprintln!("Database error fetching strategy: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let strategy = match strategy {
        Some(s) => s,
        None => {
            return Ok(Json(ApiResponse::error(
                "Cluster strategy not found".to_string(),
            )))
        }
    };

    // Calculate total target hardware capacity
    let mut total_cpu: u32 = 0;
    let mut total_memory: u32 = 0;
    let mut total_storage: f64 = 0.0;

    for spec in &request.target_hardware_specs {
        total_cpu += spec.cpu_cores * spec.quantity;
        total_memory += spec.memory_gb * spec.quantity;
        total_storage += spec.storage_tb * (spec.quantity as f64);
    }

    let overcommit = request.overcommit_ratios.unwrap_or_default();

    // Calculate effective capacity with overcommit
    let effective_cpu = (total_cpu as f64) * overcommit.cpu;
    let effective_memory = (total_memory as f64) * overcommit.memory;
    let effective_storage = total_storage * overcommit.storage;

    // CPU validation
    let cpu_utilization = (strategy.required_cpu_cores as f64 / effective_cpu) * 100.0;
    let cpu_meets_requirement = strategy.required_cpu_cores as f64 <= effective_cpu;
    
    let cpu_validation = ResourceValidation {
        resource_type: "CPU".to_string(),
        required: strategy.required_cpu_cores as f64,
        available: effective_cpu,
        utilization_percent: cpu_utilization,
        meets_requirement: cpu_meets_requirement,
        message: if cpu_meets_requirement {
            format!("CPU capacity sufficient ({:.1}% utilization)", cpu_utilization)
        } else {
            format!(
                "CPU capacity insufficient: need {} vCPU, have {:.0} effective vCPU",
                strategy.required_cpu_cores, effective_cpu
            )
        },
        severity: if cpu_utilization > 90.0 {
            ValidationSeverity::Warning
        } else if cpu_meets_requirement {
            ValidationSeverity::Info
        } else {
            ValidationSeverity::Error
        },
    };

    // Memory validation
    let memory_utilization = (strategy.required_memory_gb as f64 / effective_memory) * 100.0;
    let memory_meets_requirement = strategy.required_memory_gb as f64 <= effective_memory;
    
    let memory_validation = ResourceValidation {
        resource_type: "Memory".to_string(),
        required: strategy.required_memory_gb as f64,
        available: effective_memory,
        utilization_percent: memory_utilization,
        meets_requirement: memory_meets_requirement,
        message: if memory_meets_requirement {
            format!("Memory capacity sufficient ({:.1}% utilization)", memory_utilization)
        } else {
            format!(
                "Memory capacity insufficient: need {}GB, have {:.0}GB effective",
                strategy.required_memory_gb, effective_memory
            )
        },
        severity: if memory_utilization > 90.0 {
            ValidationSeverity::Warning
        } else if memory_meets_requirement {
            ValidationSeverity::Info
        } else {
            ValidationSeverity::Error
        },
    };

    // Storage validation
    let storage_utilization = (strategy.required_storage_tb / effective_storage) * 100.0;
    let storage_meets_requirement = strategy.required_storage_tb <= effective_storage;
    
    let storage_validation = ResourceValidation {
        resource_type: "Storage".to_string(),
        required: strategy.required_storage_tb,
        available: effective_storage,
        utilization_percent: storage_utilization,
        meets_requirement: storage_meets_requirement,
        message: if storage_meets_requirement {
            format!("Storage capacity sufficient ({:.1}% utilization)", storage_utilization)
        } else {
            format!(
                "Storage capacity insufficient: need {:.1}TB, have {:.1}TB",
                strategy.required_storage_tb, effective_storage
            )
        },
        severity: if storage_utilization > 90.0 {
            ValidationSeverity::Warning
        } else if storage_meets_requirement {
            ValidationSeverity::Info
        } else {
            ValidationSeverity::Error
        },
    };

    // Determine overall status
    let is_valid = cpu_meets_requirement && memory_meets_requirement && storage_meets_requirement;
    
    let status = if !is_valid {
        CapacityValidationStatus::Critical
    } else if cpu_utilization > 90.0 || memory_utilization > 90.0 || storage_utilization > 90.0 {
        CapacityValidationStatus::Warning
    } else if cpu_utilization > 80.0 || memory_utilization > 80.0 || storage_utilization > 80.0 {
        CapacityValidationStatus::Acceptable
    } else {
        CapacityValidationStatus::Optimal
    };

    // Generate recommendations
    let mut recommendations = Vec::new();
    if !cpu_meets_requirement {
        recommendations.push(format!(
            "Add {} more CPU cores to meet requirements",
            strategy.required_cpu_cores - (effective_cpu as u32)
        ));
    }
    if !memory_meets_requirement {
        recommendations.push(format!(
            "Add {:.0}GB more memory to meet requirements",
            strategy.required_memory_gb as f64 - effective_memory
        ));
    }
    if !storage_meets_requirement {
        recommendations.push(format!(
            "Add {:.1}TB more storage to meet requirements",
            strategy.required_storage_tb - effective_storage
        ));
    }
    if cpu_utilization > 90.0 && cpu_meets_requirement {
        recommendations.push("Consider adding more CPU cores for headroom".to_string());
    }
    if memory_utilization > 90.0 && memory_meets_requirement {
        recommendations.push("Consider adding more memory for headroom".to_string());
    }

    let result = CapacityValidationResult {
        is_valid,
        cpu_validation,
        memory_validation,
        storage_validation,
        status,
        recommendations,
        validated_at: Utc::now(),
    };

    Ok(Json(ApiResponse::success(result)))
}

/// Validate strategy request requirements based on strategy type
fn validate_strategy_request(request: &ConfigureStrategyRequest) -> Result<(), String> {
    match request.strategy_type {
        MigrationStrategyType::DominoHardwareSwap => {
            if request.domino_source_cluster.is_none() {
                return Err("Domino source cluster must be specified for domino hardware swap strategy".to_string());
            }
        }
        MigrationStrategyType::NewHardwarePurchase => {
            if request.hardware_basket_items.is_none() || request.hardware_basket_items.as_ref().unwrap().is_empty() {
                return Err("Hardware basket items must be specified for new hardware purchase strategy".to_string());
            }
        }
        MigrationStrategyType::ExistingFreeHardware => {
            if request.hardware_pool_allocations.is_none() || request.hardware_pool_allocations.as_ref().unwrap().is_empty() {
                return Err("Hardware pool allocations must be specified for existing free hardware strategy".to_string());
            }
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_strategy_request_domino() {
        let request = ConfigureStrategyRequest {
            source_cluster_name: "TEST-01".to_string(),
            target_cluster_name: "HYPERV-01".to_string(),
            strategy_type: MigrationStrategyType::DominoHardwareSwap,
            domino_source_cluster: Some("DEV-01".to_string()),
            hardware_basket_items: None,
            hardware_pool_allocations: None,
            required_cpu_cores: None,
            required_memory_gb: None,
            required_storage_tb: None,
            planned_start_date: None,
            planned_completion_date: None,
            notes: None,
        };

        assert!(validate_strategy_request(&request).is_ok());
    }

    #[test]
    fn test_validate_strategy_request_domino_missing_source() {
        let request = ConfigureStrategyRequest {
            source_cluster_name: "TEST-01".to_string(),
            target_cluster_name: "HYPERV-01".to_string(),
            strategy_type: MigrationStrategyType::DominoHardwareSwap,
            domino_source_cluster: None,
            hardware_basket_items: None,
            hardware_pool_allocations: None,
            required_cpu_cores: None,
            required_memory_gb: None,
            required_storage_tb: None,
            planned_start_date: None,
            planned_completion_date: None,
            notes: None,
        };

        assert!(validate_strategy_request(&request).is_err());
    }
}
