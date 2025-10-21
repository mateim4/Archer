//! Destination Clusters API
//!
//! CRUD operations for destination cluster management in migration planning.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::project_models::*,
    services::capacity_planner_service::CapacityPlannerService,
};

pub fn create_destination_clusters_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", post(create_cluster))
        .route("/", get(list_clusters))
        .route("/:cluster_id", get(get_cluster))
        .route("/:cluster_id", patch(update_cluster))
        .route("/:cluster_id", delete(delete_cluster))
        .route("/:cluster_id/validate", post(validate_cluster))
        .route("/:cluster_id/build-status", patch(update_build_status))
        .with_state(db)
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateClusterRequest {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub hypervisor: HypervisorType,
    pub storage_type: DestinationStorageType,
    pub nodes: Vec<String>, // Hardware pool IDs
    pub ha_policy: HaPolicy,
    pub overcommit_ratios: OvercommitRatios,
    pub management_network: NetworkConfig,
    pub workload_network: NetworkConfig,
    pub storage_network: Option<NetworkConfig>,
    pub migration_network: Option<NetworkConfig>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    pub created_by: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateClusterRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub nodes: Option<Vec<String>>,
    pub ha_policy: Option<HaPolicy>,
    pub overcommit_ratios: Option<OvercommitRatios>,
    pub management_network: Option<NetworkConfig>,
    pub workload_network: Option<NetworkConfig>,
    pub storage_network: Option<NetworkConfig>,
    pub migration_network: Option<NetworkConfig>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Deserialize)]
pub struct ListClustersQuery {
    pub project_id: Option<String>,
    pub status: Option<String>,
    pub hypervisor_type: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct ClusterResponse {
    pub cluster: DestinationCluster,
    pub validation_summary: ValidationSummary,
}

#[derive(Debug, Serialize)]
pub struct ValidationSummary {
    pub is_valid: bool,
    pub critical_issues: i32,
    pub warnings: i32,
    pub info_messages: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBuildStatusRequest {
    pub build_status: BuildStatus,
}

// =============================================================================
// CLUSTER CRUD OPERATIONS
// =============================================================================

/// Create a new destination cluster
async fn create_cluster(
    State(db): State<Arc<Database>>,
    Json(request): Json<CreateClusterRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Validate project exists
    let project: Result<Option<Project>, _> = db
        .select(("project", request.project_id.as_str()))
        .await;

    if project.is_err() || project.unwrap().is_none() {
        return Err(ApiError::NotFound("Project not found".to_string()));
    }

    // Convert hardware pool IDs to Things and validate
    let mut node_things = Vec::new();
    let mut total_capacity = ClusterCapacity {
        cpu_cores: 0,
        cpu_ghz: 0.0,
        memory_gb: 0,
        storage_gb: 0,
        storage_iops: Some(0),
    };

    for node_id in &request.nodes {
        let node: Result<Option<HardwarePool>, _> = db
            .select(("hardware_pool", node_id.as_str()))
            .await;

        match node {
            Ok(Some(node)) => {
                // Aggregate capacity
                total_capacity.cpu_cores += node.cpu_cores_total.unwrap_or(0);
                // cpu_ghz not available in HardwarePool, set to 0 or estimate
                total_capacity.cpu_ghz += 0.0; // Will need to calculate from CPU model later
                total_capacity.memory_gb += node.memory_gb.unwrap_or(0);
                total_capacity.storage_gb += node.storage_capacity_gb.unwrap_or(0) as i64;

                node_things.push(Thing::from(("hardware_pool", node_id.as_str())));
            }
            Ok(None) => {
                return Err(ApiError::NotFound(format!("Node {} not found", node_id)))
            }
            Err(e) => return Err(ApiError::InternalError(e.to_string())),
        }
    }

    // Create cluster
    let cluster = DestinationCluster {
        id: None,
        project_id: Thing::from(("project", request.project_id.as_str())),
        activity_id: None,
        name: request.name,
        description: request.description,
        hypervisor: request.hypervisor,
        storage_type: request.storage_type,
        nodes: node_things,
        node_count: request.nodes.len() as i32,
        overcommit_ratios: request.overcommit_ratios,
        ha_policy: request.ha_policy,
        capacity_totals: total_capacity.clone(),
        capacity_available: total_capacity.clone(),
        capacity_reserved: ClusterCapacity {
            cpu_cores: 0,
            cpu_ghz: 0.0,
            memory_gb: 0,
            storage_gb: 0,
            storage_iops: Some(0),
        },
        network_profile_id: None,
        management_network: request.management_network,
        workload_network: request.workload_network,
        storage_network: request.storage_network,
        migration_network: request.migration_network,
        validation_results: Vec::new(),
        status: ClusterStatus::Planning,
        build_status: BuildStatus::NotStarted,
        metadata: request.metadata.unwrap_or_default(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        created_by: request.created_by,
    };

    let created: Result<Vec<DestinationCluster>, _> = db
        .create("destination_cluster")
        .content(cluster)
        .await;

    match created {
        Ok(mut clusters) if !clusters.is_empty() => {
            let cluster = clusters.remove(0);
            let validation_summary = compute_validation_summary(&cluster.validation_results);

            Ok((
                StatusCode::CREATED,
                Json(ClusterResponse {
                    cluster,
                    validation_summary,
                }),
            ))
        }
        Ok(_) => Err(ApiError::InternalError(
            "Failed to create cluster".to_string(),
        )),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// List destination clusters
async fn list_clusters(
    State(db): State<Arc<Database>>,
    Query(query): Query<ListClustersQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let mut conditions = Vec::new();

    if let Some(project_id) = query.project_id {
        conditions.push(format!("project_id = project:{}", project_id));
    }
    if let Some(status) = query.status {
        conditions.push(format!("cluster_status = '{}'", status));
    }
    if let Some(hypervisor) = query.hypervisor_type {
        conditions.push(format!("hypervisor_type = '{}'", hypervisor));
    }

    let mut query_str = "SELECT * FROM destination_cluster".to_string();

    if !conditions.is_empty() {
        query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }

    query_str.push_str(" ORDER BY created_at DESC");

    if let Some(limit) = query.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
    }

    let clusters: Result<Vec<DestinationCluster>, _> = db
        .query(query_str)
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match clusters {
        Ok(clusters) => {
            let responses: Vec<ClusterResponse> = clusters
                .into_iter()
                .map(|cluster| {
                    let validation_summary = compute_validation_summary(&cluster.validation_results);
                    ClusterResponse {
                        cluster,
                        validation_summary,
                    }
                })
                .collect();

            Ok(Json(responses))
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Get a specific cluster
async fn get_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let cluster: Result<Option<DestinationCluster>, _> = db
        .select(("destination_cluster", cluster_id.as_str()))
        .await;

    match cluster {
        Ok(Some(cluster)) => {
            let validation_summary = compute_validation_summary(&cluster.validation_results);
            Ok(Json(ClusterResponse {
                cluster,
                validation_summary,
            }))
        }
        Ok(None) => Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Update a cluster
async fn update_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
    Json(request): Json<UpdateClusterRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Get current cluster
    let current: Result<Option<DestinationCluster>, _> = db
        .select(("destination_cluster", cluster_id.as_str()))
        .await;

    let mut cluster = match current {
        Ok(Some(c)) => c,
        Ok(None) => return Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => return Err(ApiError::InternalError(e.to_string())),
    };

    // Update fields
    if let Some(name) = request.name {
        cluster.name = name;
    }

    if let Some(description) = request.description {
        cluster.description = Some(description);
    }

    if let Some(ha_policy) = request.ha_policy {
        cluster.ha_policy = ha_policy;
    }

    if let Some(overcommit_ratios) = request.overcommit_ratios {
        cluster.overcommit_ratios = overcommit_ratios;
    }

    if let Some(management_network) = request.management_network {
        cluster.management_network = management_network;
    }

    if let Some(workload_network) = request.workload_network {
        cluster.workload_network = workload_network;
    }

    if let Some(storage_network) = request.storage_network {
        cluster.storage_network = Some(storage_network);
    }

    if let Some(migration_network) = request.migration_network {
        cluster.migration_network = Some(migration_network);
    }

    if let Some(metadata) = request.metadata {
        cluster.metadata = metadata;
    }

    // Handle node updates with capacity recalculation
    if let Some(node_ids) = request.nodes {
        let mut node_things = Vec::new();
        let mut total_capacity = ClusterCapacity {
            cpu_cores: 0,
            cpu_ghz: 0.0,
            memory_gb: 0,
            storage_gb: 0,
            storage_iops: Some(0),
        };

        for node_id in &node_ids {
            let node: Result<Option<HardwarePool>, _> = db
                .select(("hardware_pool", node_id.as_str()))
                .await;

            match node {
                Ok(Some(node)) => {
                    total_capacity.cpu_cores += node.cpu_cores_total.unwrap_or(0);
                    total_capacity.cpu_ghz += 0.0; // cpu_ghz not in HardwarePool
                    total_capacity.memory_gb += node.memory_gb.unwrap_or(0);
                    total_capacity.storage_gb += node.storage_capacity_gb.unwrap_or(0) as i64;

                    node_things.push(Thing::from(("hardware_pool", node_id.as_str())));
                }
                Ok(None) => {
                    return Err(ApiError::NotFound(format!("Node {} not found", node_id)))
                }
                Err(e) => return Err(ApiError::InternalError(e.to_string())),
            }
        }

        cluster.nodes = node_things;
        cluster.node_count = node_ids.len() as i32;
        cluster.capacity_totals = total_capacity.clone();
        cluster.capacity_available = total_capacity;
    }

    cluster.updated_at = Utc::now();

    // Save updated cluster
    let updated: Result<Option<DestinationCluster>, _> = db
        .update(("destination_cluster", cluster_id.as_str()))
        .content(cluster)
        .await;

    match updated {
        Ok(Some(cluster)) => {
            let validation_summary = compute_validation_summary(&cluster.validation_results);
            Ok(Json(ClusterResponse {
                cluster,
                validation_summary,
            }))
        }
        Ok(None) => Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Delete a cluster
async fn delete_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    // Check if cluster has any allocations or is in use
    let cluster: Result<Option<DestinationCluster>, _> = db
        .select(("destination_cluster", cluster_id.as_str()))
        .await;

    match cluster {
        Ok(Some(cluster)) => {
            // Don't allow deletion if cluster is in building or active state
            if matches!(
                cluster.status,
                ClusterStatus::Building | ClusterStatus::Active
            ) {
                return Err(ApiError::Conflict(format!(
                    "Cannot delete cluster with status: {:?}",
                    cluster.status
                )));
            }

            // Delete the cluster
            let _: Result<Option<DestinationCluster>, _> = db
                .delete(("destination_cluster", cluster_id.as_str()))
                .await;

            Ok(StatusCode::NO_CONTENT)
        }
        Ok(None) => Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// CLUSTER VALIDATION
// =============================================================================

/// Validate cluster configuration
async fn validate_cluster(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let cluster: Result<Option<DestinationCluster>, _> = db
        .select(("destination_cluster", cluster_id.as_str()))
        .await;

    let mut cluster = match cluster {
        Ok(Some(c)) => c,
        Ok(None) => return Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => return Err(ApiError::InternalError(e.to_string())),
    };

    let mut validation_results = Vec::new();

    // Validate node count
    if cluster.node_count < 2 {
        validation_results.push(ValidationIssue {
            severity: ValidationSeverity::Warning,
            category: "High Availability".to_string(),
            message: "Cluster has fewer than 2 nodes - HA not possible".to_string(),
            recommendation: Some("Add more nodes to enable HA".to_string()),
        });
    }

    // Validate HA policy vs node count
    let required_nodes = match cluster.ha_policy {
        HaPolicy::NPlusTwo => 3,
        HaPolicy::NPlusOne => 2,
        _ => 1,
    };

    if cluster.node_count < required_nodes {
        validation_results.push(ValidationIssue {
            severity: ValidationSeverity::Critical,
            category: "High Availability".to_string(),
            message: format!(
                "HA policy {:?} requires at least {} nodes, but only {} provided",
                cluster.ha_policy, required_nodes, cluster.node_count
            ),
            recommendation: Some(format!("Add {} more nodes", required_nodes - cluster.node_count)),
        });
    }

    // Validate network configs - check if management network is configured
    if cluster.management_network.vlan_id.is_none() {
        validation_results.push(ValidationIssue {
            severity: ValidationSeverity::Critical,
            category: "Network Configuration".to_string(),
            message: "Management network VLAN not configured".to_string(),
            recommendation: Some("Configure management network VLAN".to_string()),
        });
    }

    // Validate storage type compatibility with hypervisor
    match (&cluster.hypervisor, &cluster.storage_type) {
        (HypervisorType::AzureLocal, DestinationStorageType::Traditional) => {
            validation_results.push(ValidationIssue {
                severity: ValidationSeverity::Critical,
                category: "Storage Configuration".to_string(),
                message: "Azure Local requires Azure Local storage, not Traditional".to_string(),
                recommendation: Some("Change storage type to Azure Local".to_string()),
            });
        }
        _ => {}
    }

    // Update cluster status
    cluster.validation_results = validation_results.clone();
    cluster.status = if validation_results
        .iter()
        .any(|v| matches!(v.severity, ValidationSeverity::Critical))
    {
        ClusterStatus::Planning
    } else {
        ClusterStatus::Validated
    };
    cluster.updated_at = Utc::now();

    // Save updated cluster
    let updated: Result<Option<DestinationCluster>, _> = db
        .update(("destination_cluster", cluster_id.as_str()))
        .content(cluster)
        .await;

    match updated {
        Ok(Some(cluster)) => {
            let validation_summary = compute_validation_summary(&cluster.validation_results);
            Ok(Json(ClusterResponse {
                cluster,
                validation_summary,
            }))
        }
        Ok(None) => Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Update cluster build status
async fn update_build_status(
    State(db): State<Arc<Database>>,
    Path(cluster_id): Path<String>,
    Json(request): Json<UpdateBuildStatusRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let cluster: Result<Option<DestinationCluster>, _> = db
        .select(("destination_cluster", cluster_id.as_str()))
        .await;

    let mut cluster = match cluster {
        Ok(Some(c)) => c,
        Ok(None) => return Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => return Err(ApiError::InternalError(e.to_string())),
    };

    cluster.build_status = request.build_status;
    cluster.updated_at = Utc::now();

    // Update cluster status based on build status
    cluster.status = match cluster.build_status {
        BuildStatus::NotStarted => ClusterStatus::Validated,
        BuildStatus::HardwareOrdered | BuildStatus::HardwareReceived | BuildStatus::Racking | 
        BuildStatus::Cabling | BuildStatus::OsInstallation | BuildStatus::ClusterConfiguration | 
        BuildStatus::Validation => ClusterStatus::Building,
        BuildStatus::Completed => ClusterStatus::Ready,
    };

    let updated: Result<Option<DestinationCluster>, _> = db
        .update(("destination_cluster", cluster_id.as_str()))
        .content(cluster)
        .await;

    match updated {
        Ok(Some(cluster)) => {
            let validation_summary = compute_validation_summary(&cluster.validation_results);
            Ok(Json(ClusterResponse {
                cluster,
                validation_summary,
            }))
        }
        Ok(None) => Err(ApiError::NotFound("Cluster not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

fn compute_validation_summary(validation_results: &[ValidationIssue]) -> ValidationSummary {
    let mut critical_issues = 0;
    let mut warnings = 0;
    let mut info_messages = 0;

    for issue in validation_results {
        match issue.severity {
            ValidationSeverity::Critical => critical_issues += 1,
            ValidationSeverity::Error => critical_issues += 1, // Treat errors as critical
            ValidationSeverity::Warning => warnings += 1,
            ValidationSeverity::Info => info_messages += 1,
        }
    }

    ValidationSummary {
        is_valid: critical_issues == 0,
        critical_issues,
        warnings,
        info_messages,
    }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

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
