use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::models::project_models::{MigrationCluster, VMPlacement};

/// VM Placement Strategy
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PlacementStrategy {
    /// First-fit: Place VMs in the first cluster that has enough capacity
    FirstFit,
    /// Best-fit: Place VMs in the cluster with the least remaining capacity that still fits
    BestFit,
    /// Balanced: Distribute VMs evenly across all clusters
    Balanced,
    /// Performance: Prioritize clusters with most available resources
    Performance,
}

/// VM Resource Requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VMResourceRequirements {
    pub vm_id: String,
    pub vm_name: String,
    pub cpu_cores: f64,
    pub memory_gb: f64,
    pub storage_gb: f64,
    pub network_vlan: Option<u32>,
    pub is_critical: bool,
    pub affinity_group: Option<String>,
    pub anti_affinity_group: Option<String>,
}

/// Cluster Capacity Status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterCapacityStatus {
    pub cluster_id: String,
    pub cluster_name: String,
    pub total_cpu: f64,
    pub total_memory_gb: f64,
    pub total_storage_gb: f64,
    pub used_cpu: f64,
    pub used_memory_gb: f64,
    pub used_storage_gb: f64,
    pub available_cpu: f64,
    pub available_memory_gb: f64,
    pub available_storage_gb: f64,
    pub cpu_utilization_percent: f64,
    pub memory_utilization_percent: f64,
    pub storage_utilization_percent: f64,
}

impl ClusterCapacityStatus {
    /// Check if cluster has enough capacity for VM
    pub fn can_fit_vm(&self, vm: &VMResourceRequirements) -> bool {
        self.available_cpu >= vm.cpu_cores
            && self.available_memory_gb >= vm.memory_gb
            && self.available_storage_gb >= vm.storage_gb
    }

    /// Calculate remaining capacity after placing VM
    pub fn remaining_capacity_score(&self) -> f64 {
        // Lower score = less remaining capacity
        self.available_cpu.min(self.available_memory_gb / 8.0).min(self.available_storage_gb / 100.0)
    }

    /// Calculate current utilization score (0-100)
    pub fn utilization_score(&self) -> f64 {
        (self.cpu_utilization_percent + self.memory_utilization_percent + self.storage_utilization_percent) / 3.0
    }

    /// Reserve resources for a VM
    pub fn reserve_resources(&mut self, vm: &VMResourceRequirements) {
        self.used_cpu += vm.cpu_cores;
        self.used_memory_gb += vm.memory_gb;
        self.used_storage_gb += vm.storage_gb;
        
        self.available_cpu -= vm.cpu_cores;
        self.available_memory_gb -= vm.memory_gb;
        self.available_storage_gb -= vm.storage_gb;
        
        // Recalculate utilization percentages
        self.cpu_utilization_percent = (self.used_cpu / self.total_cpu) * 100.0;
        self.memory_utilization_percent = (self.used_memory_gb / self.total_memory_gb) * 100.0;
        self.storage_utilization_percent = (self.used_storage_gb / self.total_storage_gb) * 100.0;
    }
}

/// Placement Result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlacementResult {
    pub vm_placements: Vec<VMPlacement>,
    pub unplaced_vms: Vec<VMResourceRequirements>,
    pub cluster_utilization: HashMap<String, ClusterCapacityStatus>,
    pub placement_warnings: Vec<String>,
    pub placement_summary: PlacementSummary,
}

/// Placement Summary Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlacementSummary {
    pub total_vms: usize,
    pub placed_vms: usize,
    pub unplaced_vms: usize,
    pub clusters_used: usize,
    pub average_cluster_utilization: f64,
    pub placement_strategy_used: PlacementStrategy,
}

/// VM Placement Service
/// 
/// Handles intelligent placement of VMs onto destination clusters
/// based on capacity constraints, affinity rules, and placement strategies.
pub struct VMPlacementService;

impl VMPlacementService {
    /// Create a new VM Placement Service
    pub fn new() -> Self {
        Self
    }

    /// Calculate VM placements based on strategy
    pub fn calculate_placements(
        &self,
        vms: Vec<VMResourceRequirements>,
        mut clusters: Vec<ClusterCapacityStatus>,
        strategy: PlacementStrategy,
        project_id: &str,
    ) -> PlacementResult {
        let total_vms = vms.len();
        let mut placed_vms = Vec::new();
        let mut unplaced_vms = Vec::new();
        let mut warnings = Vec::new();

        // Sort VMs by priority (critical first, then by size)
        let mut sorted_vms = vms.clone();
        sorted_vms.sort_by(|a, b| {
            if a.is_critical != b.is_critical {
                b.is_critical.cmp(&a.is_critical) // Critical first
            } else {
                // Larger VMs first (by total resource score)
                let score_a = a.cpu_cores + (a.memory_gb / 8.0) + (a.storage_gb / 100.0);
                let score_b = b.cpu_cores + (b.memory_gb / 8.0) + (b.storage_gb / 100.0);
                score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
            }
        });

        // Handle affinity groups
        let mut affinity_groups: HashMap<String, Vec<String>> = HashMap::new();
        let mut anti_affinity_groups: HashMap<String, Vec<String>> = HashMap::new();

        // Place VMs according to strategy
        for vm in sorted_vms {
            match self.place_vm(
                &vm,
                &mut clusters,
                &strategy,
                &affinity_groups,
                &anti_affinity_groups,
                project_id,
            ) {
                Some(placement) => {
                    // Update affinity tracking
                    if let Some(affinity) = &vm.affinity_group {
                        affinity_groups
                            .entry(affinity.clone())
                            .or_insert_with(Vec::new)
                            .push(placement.cluster_id.clone());
                    }
                    if let Some(anti_affinity) = &vm.anti_affinity_group {
                        anti_affinity_groups
                            .entry(anti_affinity.clone())
                            .or_insert_with(Vec::new)
                            .push(placement.cluster_id.clone());
                    }

                    placed_vms.push(placement);
                }
                None => {
                    warnings.push(format!(
                        "Unable to place VM '{}' ({}C/{}GB/{}GB) - insufficient cluster capacity",
                        vm.vm_name, vm.cpu_cores, vm.memory_gb, vm.storage_gb
                    ));
                    unplaced_vms.push(vm);
                }
            }
        }

        // Calculate final statistics
        let clusters_used = clusters
            .iter()
            .filter(|c| c.used_cpu > 0.0)
            .count();

        let average_utilization = if clusters_used > 0 {
            clusters
                .iter()
                .filter(|c| c.used_cpu > 0.0)
                .map(|c| c.utilization_score())
                .sum::<f64>()
                / clusters_used as f64
        } else {
            0.0
        };

        // Build cluster utilization map
        let cluster_utilization = clusters
            .into_iter()
            .map(|c| (c.cluster_id.clone(), c))
            .collect();

        // Calculate counts before moving vectors
        let placed_count = placed_vms.len();
        let unplaced_count = unplaced_vms.len();

        PlacementResult {
            vm_placements: placed_vms,
            unplaced_vms,
            cluster_utilization,
            placement_warnings: warnings,
            placement_summary: PlacementSummary {
                total_vms,
                placed_vms: placed_count,
                unplaced_vms: unplaced_count,
                clusters_used,
                average_cluster_utilization: average_utilization,
                placement_strategy_used: strategy,
            },
        }
    }

    /// Place a single VM on the best cluster
    fn place_vm(
        &self,
        vm: &VMResourceRequirements,
        clusters: &mut [ClusterCapacityStatus],
        strategy: &PlacementStrategy,
        affinity_groups: &HashMap<String, Vec<String>>,
        anti_affinity_groups: &HashMap<String, Vec<String>>,
        project_id: &str,
    ) -> Option<VMPlacement> {
        // Filter clusters that can fit the VM
        let mut candidate_indices: Vec<usize> = clusters
            .iter()
            .enumerate()
            .filter(|(_, c)| c.can_fit_vm(vm))
            .map(|(i, _)| i)
            .collect();

        if candidate_indices.is_empty() {
            return None;
        }

        // Apply affinity rules
        if let Some(affinity) = &vm.affinity_group {
            if let Some(preferred_clusters) = affinity_groups.get(affinity) {
                // Try to place on same cluster as affinity group
                let affinity_candidates: Vec<usize> = candidate_indices
                    .iter()
                    .filter(|&&i| preferred_clusters.contains(&clusters[i].cluster_id))
                    .copied()
                    .collect();
                
                if !affinity_candidates.is_empty() {
                    candidate_indices = affinity_candidates;
                }
            }
        }

        // Apply anti-affinity rules
        if let Some(anti_affinity) = &vm.anti_affinity_group {
            if let Some(excluded_clusters) = anti_affinity_groups.get(anti_affinity) {
                candidate_indices.retain(|&i| !excluded_clusters.contains(&clusters[i].cluster_id));
                
                if candidate_indices.is_empty() {
                    // Anti-affinity violated, but no choice
                    return None;
                }
            }
        }

        // Select cluster based on strategy
        let selected_index = match strategy {
            PlacementStrategy::FirstFit => {
                // First cluster that fits
                candidate_indices[0]
            }
            PlacementStrategy::BestFit => {
                // Cluster with least remaining capacity
                *candidate_indices
                    .iter()
                    .min_by(|&&a, &&b| {
                        clusters[a]
                            .remaining_capacity_score()
                            .partial_cmp(&clusters[b].remaining_capacity_score())
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .unwrap()
            }
            PlacementStrategy::Balanced => {
                // Cluster with lowest current utilization
                *candidate_indices
                    .iter()
                    .min_by(|&&a, &&b| {
                        clusters[a]
                            .utilization_score()
                            .partial_cmp(&clusters[b].utilization_score())
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .unwrap()
            }
            PlacementStrategy::Performance => {
                // Cluster with most available resources
                *candidate_indices
                    .iter()
                    .max_by(|&&a, &&b| {
                        clusters[a]
                            .remaining_capacity_score()
                            .partial_cmp(&clusters[b].remaining_capacity_score())
                            .unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .unwrap()
            }
        };

        let selected_cluster = &mut clusters[selected_index];
        
        // Reserve resources
        selected_cluster.reserve_resources(vm);

        // Create placement record
        Some(VMPlacement {
            id: format!("placement:{}:{}", project_id, vm.vm_id),
            project_id: project_id.to_string(),
            vm_id: vm.vm_id.clone(),
            vm_name: vm.vm_name.clone(),
            source_cluster: None,
            cluster_id: selected_cluster.cluster_id.clone(),
            cluster_name: selected_cluster.cluster_name.clone(),
            assigned_cpu: vm.cpu_cores,
            assigned_memory_gb: vm.memory_gb,
            assigned_storage_gb: vm.storage_gb,
            placement_reason: format!("Placed using {} strategy", strategy_name(strategy)),
            placement_score: Some(100.0 - selected_cluster.utilization_score()),
            affinity_group: vm.affinity_group.clone(),
            anti_affinity_group: vm.anti_affinity_group.clone(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        })
    }

    /// Validate placement feasibility
    pub fn validate_placement(
        &self,
        vms: &[VMResourceRequirements],
        clusters: &[ClusterCapacityStatus],
    ) -> (bool, Vec<String>) {
        let total_vm_cpu: f64 = vms.iter().map(|v| v.cpu_cores).sum();
        let total_vm_memory: f64 = vms.iter().map(|v| v.memory_gb).sum();
        let total_vm_storage: f64 = vms.iter().map(|v| v.storage_gb).sum();

        let total_cluster_cpu: f64 = clusters.iter().map(|c| c.available_cpu).sum();
        let total_cluster_memory: f64 = clusters.iter().map(|c| c.available_memory_gb).sum();
        let total_cluster_storage: f64 = clusters.iter().map(|c| c.available_storage_gb).sum();

        let mut warnings = Vec::new();

        if total_vm_cpu > total_cluster_cpu {
            warnings.push(format!(
                "Insufficient total CPU capacity: VMs require {:.1} cores, clusters have {:.1} available",
                total_vm_cpu, total_cluster_cpu
            ));
        }

        if total_vm_memory > total_cluster_memory {
            warnings.push(format!(
                "Insufficient total memory capacity: VMs require {:.1} GB, clusters have {:.1} GB available",
                total_vm_memory, total_cluster_memory
            ));
        }

        if total_vm_storage > total_cluster_storage {
            warnings.push(format!(
                "Insufficient total storage capacity: VMs require {:.1} GB, clusters have {:.1} GB available",
                total_vm_storage, total_cluster_storage
            ));
        }

        let is_feasible = warnings.is_empty();
        (is_feasible, warnings)
    }

    /// Optimize existing placements
    pub fn optimize_placements(
        &self,
        current_placements: Vec<VMPlacement>,
        vms: Vec<VMResourceRequirements>,
        clusters: Vec<ClusterCapacityStatus>,
        project_id: &str,
    ) -> PlacementResult {
        // Re-calculate placements using balanced strategy for optimization
        self.calculate_placements(vms, clusters, PlacementStrategy::Balanced, project_id)
    }
}

/// Helper function to get strategy name
fn strategy_name(strategy: &PlacementStrategy) -> &str {
    match strategy {
        PlacementStrategy::FirstFit => "First-Fit",
        PlacementStrategy::BestFit => "Best-Fit",
        PlacementStrategy::Balanced => "Balanced",
        PlacementStrategy::Performance => "Performance",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_vm(id: &str, name: &str, cpu: f64, mem: f64, storage: f64) -> VMResourceRequirements {
        VMResourceRequirements {
            vm_id: id.to_string(),
            vm_name: name.to_string(),
            cpu_cores: cpu,
            memory_gb: mem,
            storage_gb: storage,
            network_vlan: None,
            is_critical: false,
            affinity_group: None,
            anti_affinity_group: None,
        }
    }

    fn create_test_cluster(id: &str, name: &str, cpu: f64, mem: f64, storage: f64) -> ClusterCapacityStatus {
        ClusterCapacityStatus {
            cluster_id: id.to_string(),
            cluster_name: name.to_string(),
            total_cpu: cpu,
            total_memory_gb: mem,
            total_storage_gb: storage,
            used_cpu: 0.0,
            used_memory_gb: 0.0,
            used_storage_gb: 0.0,
            available_cpu: cpu,
            available_memory_gb: mem,
            available_storage_gb: storage,
            cpu_utilization_percent: 0.0,
            memory_utilization_percent: 0.0,
            storage_utilization_percent: 0.0,
        }
    }

    #[test]
    fn test_first_fit_placement() {
        let service = VMPlacementService::new();
        
        let vms = vec![
            create_test_vm("vm1", "VM1", 4.0, 16.0, 100.0),
            create_test_vm("vm2", "VM2", 2.0, 8.0, 50.0),
        ];

        let clusters = vec![
            create_test_cluster("cluster1", "Cluster 1", 16.0, 64.0, 500.0),
            create_test_cluster("cluster2", "Cluster 2", 16.0, 64.0, 500.0),
        ];

        let result = service.calculate_placements(
            vms,
            clusters,
            PlacementStrategy::FirstFit,
            "test-project",
        );

        assert_eq!(result.placement_summary.placed_vms, 2);
        assert_eq!(result.placement_summary.unplaced_vms, 0);
    }

    #[test]
    fn test_balanced_placement() {
        let service = VMPlacementService::new();
        
        let vms = vec![
            create_test_vm("vm1", "VM1", 4.0, 16.0, 100.0),
            create_test_vm("vm2", "VM2", 4.0, 16.0, 100.0),
        ];

        let clusters = vec![
            create_test_cluster("cluster1", "Cluster 1", 16.0, 64.0, 500.0),
            create_test_cluster("cluster2", "Cluster 2", 16.0, 64.0, 500.0),
        ];

        let result = service.calculate_placements(
            vms,
            clusters,
            PlacementStrategy::Balanced,
            "test-project",
        );

        assert_eq!(result.placement_summary.placed_vms, 2);
        assert_eq!(result.placement_summary.clusters_used, 2);
    }

    #[test]
    fn test_insufficient_capacity() {
        let service = VMPlacementService::new();
        
        let vms = vec![
            create_test_vm("vm1", "VM1", 20.0, 100.0, 1000.0),
        ];

        let clusters = vec![
            create_test_cluster("cluster1", "Cluster 1", 8.0, 32.0, 200.0),
        ];

        let result = service.calculate_placements(
            vms,
            clusters,
            PlacementStrategy::FirstFit,
            "test-project",
        );

        assert_eq!(result.placement_summary.placed_vms, 0);
        assert_eq!(result.placement_summary.unplaced_vms, 1);
        assert!(!result.placement_warnings.is_empty());
    }

    #[test]
    fn test_validation() {
        let service = VMPlacementService::new();
        
        let vms = vec![
            create_test_vm("vm1", "VM1", 10.0, 40.0, 200.0),
        ];

        let clusters = vec![
            create_test_cluster("cluster1", "Cluster 1", 8.0, 32.0, 200.0),
        ];

        let (is_feasible, warnings) = service.validate_placement(&vms, &clusters);

        assert!(!is_feasible);
        assert!(!warnings.is_empty());
    }
}
