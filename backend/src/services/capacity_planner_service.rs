//! Capacity Planner Service
//!
//! Enhanced capacity planning service for migration activities.
//! Provides capacity computation, VM placement planning, and multi-cluster spillover support.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use surrealdb::sql::Thing;

use crate::database::Database;
use crate::models::project_models::*;

pub struct CapacityPlannerService {
    db: Database,
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct CapacityPlanRequest {
    pub source_upload_id: Thing,
    pub source_filters: Option<VmFilter>,
    pub target_clusters: Vec<Thing>,
    pub overcommit_ratios: OvercommitRatios,
    pub ha_policy: HaPolicy,
    pub headroom_percentage: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CapacityPlanResponse {
    pub source_summary: SourceCapacitySummary,
    pub cluster_capacities: Vec<ClusterCapacityDetail>,
    pub aggregate_capacity: ClusterCapacity,
    pub aggregate_available: ClusterCapacity,
    pub utilization_percentages: UtilizationPercentages,
    pub bottlenecks: Vec<CapacityBottleneck>,
    pub recommendations: Vec<String>,
    pub is_sufficient: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterCapacityDetail {
    pub cluster_id: Thing,
    pub cluster_name: String,
    pub total_capacity: ClusterCapacity,
    pub available_capacity: ClusterCapacity,
    pub reserved_capacity: ClusterCapacity,
    pub node_count: i32,
    pub ha_reserved: ClusterCapacity,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UtilizationPercentages {
    pub cpu_percent: f32,
    pub memory_percent: f32,
    pub storage_percent: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlacementRequest {
    pub source_upload_id: Thing,
    pub source_filters: Option<VmFilter>,
    pub target_clusters: Vec<Thing>,
    pub overcommit_ratios: OvercommitRatios,
    pub ha_policy: HaPolicy,
    pub strategy: PlacementStrategy,
    pub constraints: PlacementConstraints,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlacementResponse {
    pub placements: Vec<VmPlacement>,
    pub spillover_vms: Vec<SpilloverVm>,
    pub unplaced_vms: Vec<UnplacedVm>,
    pub summary: PlacementSummary,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlacementSummary {
    pub total_vms: i32,
    pub placed_vms: i32,
    pub spillover_vms: i32,
    pub unplaced_vms: i32,
    pub clusters_used: i32,
}

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

impl CapacityPlannerService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    // =========================================================================
    // CAPACITY COMPUTATION
    // =========================================================================

    /// Compute capacity for migration planning
    pub async fn compute_capacity(
        &self,
        request: CapacityPlanRequest,
    ) -> Result<CapacityPlanResponse> {
        // 1. Fetch source workload data
        let source_summary = self
            .fetch_source_summary(&request.source_upload_id, &request.source_filters)
            .await?;

        // 2. Fetch target cluster capacities
        let mut cluster_capacities = Vec::new();
        for cluster_id in &request.target_clusters {
            let detail = self
                .fetch_cluster_capacity(cluster_id, &request.ha_policy, &request.overcommit_ratios)
                .await?;
            cluster_capacities.push(detail);
        }

        // 3. Aggregate total capacity
        let aggregate_capacity = self.aggregate_cluster_capacity(&cluster_capacities);

        // 4. Calculate available capacity considering headroom
        let aggregate_available = self.calculate_available_capacity(
            &aggregate_capacity,
            &request.headroom_percentage,
            &cluster_capacities,
        );

        // 5. Calculate utilization percentages
        let utilization_percentages = self.calculate_utilization(
            &source_summary,
            &aggregate_available,
            &request.overcommit_ratios,
        );

        // 6. Identify bottlenecks
        let bottlenecks =
            self.identify_bottlenecks(&utilization_percentages, &source_summary, &aggregate_available);

        // 7. Generate recommendations
        let recommendations =
            self.generate_capacity_recommendations(&bottlenecks, &cluster_capacities);

        // 8. Determine if capacity is sufficient
        let is_sufficient = bottlenecks
            .iter()
            .all(|b| matches!(b.severity, ValidationSeverity::Info | ValidationSeverity::Warning));

        Ok(CapacityPlanResponse {
            source_summary,
            cluster_capacities,
            aggregate_capacity,
            aggregate_available,
            utilization_percentages,
            bottlenecks,
            recommendations,
            is_sufficient,
        })
    }

    /// Fetch source workload summary from RVTools data
    async fn fetch_source_summary(
        &self,
        upload_id: &Thing,
        filters: &Option<VmFilter>,
    ) -> Result<SourceCapacitySummary> {
        // Query RVTools data for source workload
        let query = if let Some(filter) = filters {
            self.build_filtered_query(upload_id, filter)
        } else {
            format!(
                "SELECT * FROM rvtools_excel_data WHERE upload_id = $upload_id AND sheet_name = 'vInfo'"
            )
        };

        let mut response = self
            .db
            .query(&query)
            .bind(("upload_id", upload_id))
            .await
            .context("Failed to query RVTools data")?;

        let data: Vec<RvToolsExcelData> = response.take(0)?;

        // Aggregate VM resources
        let mut total_cpu_cores = 0;
        let mut total_cpu_ghz = 0.0;
        let mut total_memory_gb = 0;
        let mut total_storage_gb: i64 = 0;
        let mut vm_count = 0;

        for record in data {
            match record.column_name.as_str() {
                "CPUs" | "NumCPU" => {
                    if let Ok(cpu) = record.raw_value.parse::<i32>() {
                        total_cpu_cores += cpu;
                        vm_count += 1;
                    }
                }
                "Memory" | "Memory MB" => {
                    if let Ok(mem_mb) = record.raw_value.parse::<i32>() {
                        total_memory_gb += mem_mb / 1024;
                    }
                }
                "Provisioned MB" | "Provisioned MiB" => {
                    if let Ok(storage_mb) = record.raw_value.parse::<i64>() {
                        total_storage_gb += storage_mb / 1024;
                    }
                }
                _ => {}
            }
        }

        Ok(SourceCapacitySummary {
            total_vms: vm_count,
            total_cpu_cores,
            total_cpu_ghz,
            total_memory_gb,
            total_storage_gb,
            avg_cpu_utilization: None,
            avg_memory_utilization: None,
        })
    }

    fn build_filtered_query(&self, upload_id: &Thing, filter: &VmFilter) -> String {
        let mut conditions = vec![format!("upload_id = $upload_id")];

        if let Some(clusters) = &filter.cluster_names {
            let cluster_list = clusters
                .iter()
                .map(|c| format!("'{}'", c))
                .collect::<Vec<_>>()
                .join(", ");
            conditions.push(format!("cluster_name IN [{}]", cluster_list));
        }

        if let Some(pattern) = &filter.vm_name_pattern {
            conditions.push(format!("vm_name ~= '{}'", pattern));
        }

        format!(
            "SELECT * FROM rvtools_excel_data WHERE {} AND sheet_name = 'vInfo'",
            conditions.join(" AND ")
        )
    }

    /// Fetch target cluster capacity
    async fn fetch_cluster_capacity(
        &self,
        cluster_id: &Thing,
        ha_policy: &HaPolicy,
        overcommit: &OvercommitRatios,
    ) -> Result<ClusterCapacityDetail> {
        let cluster: Option<DestinationCluster> = self
            .db
            .select(cluster_id.clone())
            .await
            .context("Failed to fetch cluster")?;

        let cluster = cluster.ok_or_else(|| anyhow::anyhow!("Cluster not found"))?;

        // Calculate HA reserved capacity
        let ha_reserved = self.calculate_ha_reserve(&cluster.capacity_totals, ha_policy, cluster.node_count);

        // Calculate available capacity with overcommit
        let mut available_capacity = cluster.capacity_totals.clone();
        available_capacity.cpu_cores = ((available_capacity.cpu_cores - ha_reserved.cpu_cores) as f64 * overcommit.cpu_ratio) as i32;
        available_capacity.memory_gb = ((available_capacity.memory_gb - ha_reserved.memory_gb) as f64 * overcommit.memory_ratio) as i32;
        available_capacity.storage_gb -= ha_reserved.storage_gb;

        Ok(ClusterCapacityDetail {
            cluster_id: cluster.id.clone().unwrap(),
            cluster_name: cluster.name,
            total_capacity: cluster.capacity_totals,
            available_capacity,
            reserved_capacity: cluster.capacity_reserved.clone(),
            node_count: cluster.node_count,
            ha_reserved,
        })
    }

    fn calculate_ha_reserve(&self, total: &ClusterCapacity, policy: &HaPolicy, node_count: i32) -> ClusterCapacity {
        let reserve_nodes = match policy {
            HaPolicy::NPlusZero => 0,
            HaPolicy::NPlusOne => 1,
            HaPolicy::NPlusTwo => 2,
            HaPolicy::None => 0,
        };

        if node_count <= reserve_nodes {
            return ClusterCapacity {
                cpu_cores: 0,
                cpu_ghz: 0.0,
                memory_gb: 0,
                storage_gb: 0,
                storage_iops: None,
            };
        }

        ClusterCapacity {
            cpu_cores: (total.cpu_cores * reserve_nodes) / node_count,
            cpu_ghz: (total.cpu_ghz * reserve_nodes as f64) / node_count as f64,
            memory_gb: (total.memory_gb * reserve_nodes) / node_count,
            storage_gb: (total.storage_gb * reserve_nodes as i64) / node_count as i64,
            storage_iops: total.storage_iops.map(|iops| (iops * reserve_nodes) / node_count),
        }
    }

    fn aggregate_cluster_capacity(&self, clusters: &[ClusterCapacityDetail]) -> ClusterCapacity {
        let mut aggregate = ClusterCapacity {
            cpu_cores: 0,
            cpu_ghz: 0.0,
            memory_gb: 0,
            storage_gb: 0,
            storage_iops: Some(0),
        };

        for cluster in clusters {
            aggregate.cpu_cores += cluster.total_capacity.cpu_cores;
            aggregate.cpu_ghz += cluster.total_capacity.cpu_ghz;
            aggregate.memory_gb += cluster.total_capacity.memory_gb;
            aggregate.storage_gb += cluster.total_capacity.storage_gb;
            if let (Some(agg_iops), Some(cluster_iops)) =
                (aggregate.storage_iops, cluster.total_capacity.storage_iops)
            {
                aggregate.storage_iops = Some(agg_iops + cluster_iops);
            }
        }

        aggregate
    }

    fn calculate_available_capacity(
        &self,
        total: &ClusterCapacity,
        headroom_pct: &f32,
        clusters: &[ClusterCapacityDetail],
    ) -> ClusterCapacity {
        let mut available = ClusterCapacity {
            cpu_cores: 0,
            cpu_ghz: 0.0,
            memory_gb: 0,
            storage_gb: 0,
            storage_iops: Some(0),
        };

        for cluster in clusters {
            available.cpu_cores += cluster.available_capacity.cpu_cores;
            available.cpu_ghz += cluster.available_capacity.cpu_ghz;
            available.memory_gb += cluster.available_capacity.memory_gb;
            available.storage_gb += cluster.available_capacity.storage_gb;
        }

        // Apply headroom
        let headroom_factor = 1.0 - (headroom_pct / 100.0);
        available.cpu_cores = (available.cpu_cores as f32 * headroom_factor) as i32;
        available.memory_gb = (available.memory_gb as f32 * headroom_factor) as i32;
        available.storage_gb = (available.storage_gb as f32 * headroom_factor) as i64;

        available
    }

    fn calculate_utilization(
        &self,
        source: &SourceCapacitySummary,
        available: &ClusterCapacity,
        overcommit: &OvercommitRatios,
    ) -> UtilizationPercentages {
        let cpu_percent = if available.cpu_cores > 0 {
            ((source.total_cpu_cores as f32 / overcommit.cpu_ratio) / available.cpu_cores as f32) * 100.0
        } else {
            100.0
        };

        let memory_percent = if available.memory_gb > 0 {
            ((source.total_memory_gb as f32 / overcommit.memory_ratio) / available.memory_gb as f32) * 100.0
        } else {
            100.0
        };

        let storage_percent = if available.storage_gb > 0 {
            (source.total_storage_gb as f32 / available.storage_gb as f32) * 100.0
        } else {
            100.0
        };

        UtilizationPercentages {
            cpu_percent,
            memory_percent,
            storage_percent,
        }
    }

    fn identify_bottlenecks(
        &self,
        utilization: &UtilizationPercentages,
        source: &SourceCapacitySummary,
        available: &ClusterCapacity,
    ) -> Vec<CapacityBottleneck> {
        let mut bottlenecks = Vec::new();

        // CPU bottleneck
        if utilization.cpu_percent > 90.0 {
            bottlenecks.push(CapacityBottleneck {
                resource_type: ResourceType::Cpu,
                severity: ValidationSeverity::Critical,
                current_usage_percent: 0.0,
                projected_usage_percent: utilization.cpu_percent,
                message: format!(
                    "CPU capacity insufficient: {}% utilization (requires {} cores, available {})",
                    utilization.cpu_percent, source.total_cpu_cores, available.cpu_cores
                ),
                recommendation: "Add more CPU cores or reduce CPU overcommit ratio".to_string(),
            });
        } else if utilization.cpu_percent > 80.0 {
            bottlenecks.push(CapacityBottleneck {
                resource_type: ResourceType::Cpu,
                severity: ValidationSeverity::Warning,
                current_usage_percent: 0.0,
                projected_usage_percent: utilization.cpu_percent,
                message: format!("CPU capacity approaching limit: {}%", utilization.cpu_percent),
                recommendation: "Consider adding CPU headroom for growth".to_string(),
            });
        }

        // Memory bottleneck
        if utilization.memory_percent > 90.0 {
            bottlenecks.push(CapacityBottleneck {
                resource_type: ResourceType::Memory,
                severity: ValidationSeverity::Critical,
                current_usage_percent: 0.0,
                projected_usage_percent: utilization.memory_percent,
                message: format!(
                    "Memory capacity insufficient: {}% utilization (requires {} GB, available {} GB)",
                    utilization.memory_percent, source.total_memory_gb, available.memory_gb
                ),
                recommendation: "Add more memory or reduce memory overcommit ratio".to_string(),
            });
        } else if utilization.memory_percent > 80.0 {
            bottlenecks.push(CapacityBottleneck {
                resource_type: ResourceType::Memory,
                severity: ValidationSeverity::Warning,
                current_usage_percent: 0.0,
                projected_usage_percent: utilization.memory_percent,
                message: format!("Memory capacity approaching limit: {}%", utilization.memory_percent),
                recommendation: "Consider adding memory headroom".to_string(),
            });
        }

        // Storage bottleneck
        if utilization.storage_percent > 85.0 {
            bottlenecks.push(CapacityBottleneck {
                resource_type: ResourceType::Storage,
                severity: ValidationSeverity::Critical,
                current_usage_percent: 0.0,
                projected_usage_percent: utilization.storage_percent,
                message: format!(
                    "Storage capacity insufficient: {}% utilization (requires {} GB, available {} GB)",
                    utilization.storage_percent, source.total_storage_gb, available.storage_gb
                ),
                recommendation: "Add more storage capacity".to_string(),
            });
        } else if utilization.storage_percent > 70.0 {
            bottlenecks.push(CapacityBottleneck {
                resource_type: ResourceType::Storage,
                severity: ValidationSeverity::Warning,
                current_usage_percent: 0.0,
                projected_usage_percent: utilization.storage_percent,
                message: format!("Storage capacity approaching limit: {}%", utilization.storage_percent),
                recommendation: "Plan for storage expansion".to_string(),
            });
        }

        bottlenecks
    }

    fn generate_capacity_recommendations(
        &self,
        bottlenecks: &[CapacityBottleneck],
        clusters: &[ClusterCapacityDetail],
    ) -> Vec<String> {
        let mut recommendations = Vec::new();

        if bottlenecks.is_empty() {
            recommendations.push("Capacity is sufficient for the planned migration".to_string());
        } else {
            for bottleneck in bottlenecks {
                recommendations.push(bottleneck.recommendation.clone());
            }
        }

        // Add cluster-specific recommendations
        if clusters.len() > 1 {
            recommendations.push(format!(
                "Consider distributing workload across {} clusters for better resilience",
                clusters.len()
            ));
        }

        recommendations
    }

    // =========================================================================
    // VM PLACEMENT PLANNING
    // =========================================================================

    /// Plan VM placement across clusters
    ///
    /// This is a simplified implementation. The full version would be in
    /// vm_placement_service.rs with sophisticated algorithms.
    pub async fn plan_placement(
        &self,
        request: PlacementRequest,
    ) -> Result<PlacementResponse> {
        // This will be implemented fully in Phase 3
        // For now, return a placeholder
        Ok(PlacementResponse {
            placements: Vec::new(),
            spillover_vms: Vec::new(),
            unplaced_vms: Vec::new(),
            summary: PlacementSummary {
                total_vms: 0,
                placed_vms: 0,
                spillover_vms: 0,
                unplaced_vms: 0,
                clusters_used: 0,
            },
        })
    }
}
