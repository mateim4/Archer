//! Capacity Validation Service
//!
//! Validates that target hardware has sufficient capacity for the workload.
//! Considers:
//! - CPU cores (with overcommit ratio)
//! - Memory (with overcommit ratio)
//! - Storage (no overcommit)
//! - HA requirements
//! - Growth headroom

use serde::{Deserialize, Serialize};
use surrealdb::{engine::local::Db, Surreal};

use crate::models::workflow::{
    CapacityValidationResult, ResourceStatus, ResourceValidation, ValidationStatus,
};

/// Request for capacity validation
#[derive(Debug, Serialize, Deserialize)]
pub struct CapacityValidationRequest {
    pub source_cluster_id: String,
    pub target_hardware: TargetHardware,
    pub overcommit_ratios: OvercommitRatios,
}

/// Target hardware configuration
#[derive(Debug, Serialize, Deserialize)]
pub struct TargetHardware {
    pub host_count: u32,
    pub cpu_per_host: u32, // Physical cores
    pub memory_per_host_gb: u32,
    pub storage_per_host_tb: f64,
}

/// Overcommit ratios for virtualization
#[derive(Debug, Serialize, Deserialize)]
pub struct OvercommitRatios {
    pub cpu: f64,    // Default: 4.0 (4:1 overcommit)
    pub memory: f64, // Default: 1.5 (1.5:1 overcommit)
}

impl Default for OvercommitRatios {
    fn default() -> Self {
        Self {
            cpu: 4.0,
            memory: 1.5,
        }
    }
}

/// Workload summary from source cluster
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkloadSummary {
    pub total_cpu_cores: u32,
    pub total_memory_gb: u32,
    pub total_storage_tb: f64,
    pub vm_count: u32,
    pub peak_cpu_utilization: Option<f32>,
    pub peak_memory_utilization: Option<f32>,
}

pub struct CapacityValidationService;

impl CapacityValidationService {
    /// Validate capacity for migration
    ///
    /// Compares source workload requirements against target hardware capacity,
    /// considering overcommit ratios and HA requirements.
    pub async fn validate_capacity(
        db: &Surreal<Db>,
        request: CapacityValidationRequest,
    ) -> Result<CapacityValidationResult, Box<dyn std::error::Error>> {
        // Fetch workload summary from source cluster
        let workload = Self::fetch_workload_summary(db, &request.source_cluster_id).await?;

        // Calculate available capacity with overcommit
        let available_cpu = request.target_hardware.cpu_per_host as f64
            * request.target_hardware.host_count as f64
            * request.overcommit_ratios.cpu;

        let available_memory = request.target_hardware.memory_per_host_gb as f64
            * request.target_hardware.host_count as f64
            * request.overcommit_ratios.memory;

        // Storage: No overcommit, but account for HA (N+1)
        let available_storage = request.target_hardware.storage_per_host_tb
            * (request.target_hardware.host_count - 1) as f64; // Reserve 1 host for HA

        // Validate each resource
        let cpu = Self::validate_resource(
            workload.total_cpu_cores as f64,
            available_cpu,
            "CPU",
            &workload,
        );

        let memory = Self::validate_resource(
            workload.total_memory_gb as f64,
            available_memory,
            "Memory",
            &workload,
        );

        let storage = Self::validate_resource(
            workload.total_storage_tb,
            available_storage,
            "Storage",
            &workload,
        );

        // Determine overall status
        let status = Self::determine_overall_status(&cpu, &memory, &storage);

        // Generate recommendations
        let recommendations =
            Self::generate_recommendations(&cpu, &memory, &storage, &request, &workload);

        Ok(CapacityValidationResult {
            status,
            cpu,
            memory,
            storage,
            recommendations,
        })
    }

    /// Validate a single resource
    fn validate_resource(
        required: f64,
        available: f64,
        resource_name: &str,
        workload: &WorkloadSummary,
    ) -> ResourceValidation {
        let utilization = (required / available) * 100.0;

        let (status, message) = if utilization < 60.0 {
            (
                ResourceStatus::Ok,
                format!(
                    "{} capacity is excellent with {:.0}% headroom for growth",
                    resource_name,
                    100.0 - utilization
                ),
            )
        } else if utilization < 80.0 {
            (
                ResourceStatus::Ok,
                format!(
                    "{} capacity is good with {:.0}% headroom",
                    resource_name,
                    100.0 - utilization
                ),
            )
        } else if utilization < 95.0 {
            (
                ResourceStatus::Warning,
                format!(
                    "{} capacity is approaching limits at {:.1}% utilization",
                    resource_name, utilization
                ),
            )
        } else if utilization < 100.0 {
            (
                ResourceStatus::Warning,
                format!(
                    "{} capacity is critically high at {:.1}% utilization",
                    resource_name, utilization
                ),
            )
        } else {
            (
                ResourceStatus::Critical,
                format!(
                    "{} capacity is insufficient - requires {:.1}% of available",
                    resource_name, utilization
                ),
            )
        };

        ResourceValidation {
            required,
            available,
            utilization_percent: utilization,
            status,
            message,
        }
    }

    /// Determine overall validation status
    fn determine_overall_status(
        cpu: &ResourceValidation,
        memory: &ResourceValidation,
        storage: &ResourceValidation,
    ) -> ValidationStatus {
        // Find the worst status
        let max_utilization = cpu
            .utilization_percent
            .max(memory.utilization_percent)
            .max(storage.utilization_percent);

        if max_utilization >= 100.0 {
            ValidationStatus::Critical
        } else if max_utilization >= 95.0 {
            ValidationStatus::Critical
        } else if max_utilization >= 80.0 {
            ValidationStatus::Warning
        } else if max_utilization >= 60.0 {
            ValidationStatus::Acceptable
        } else {
            ValidationStatus::Optimal
        }
    }

    /// Generate context-aware recommendations
    fn generate_recommendations(
        cpu: &ResourceValidation,
        memory: &ResourceValidation,
        storage: &ResourceValidation,
        request: &CapacityValidationRequest,
        workload: &WorkloadSummary,
    ) -> Vec<String> {
        let mut recommendations = Vec::new();

        // CPU recommendations
        if cpu.utilization_percent > 80.0 {
            let additional_cores_needed = (cpu.required - (cpu.available * 0.70)).ceil() as u32;
            let additional_hosts =
                (additional_cores_needed / request.target_hardware.cpu_per_host).max(1);

            recommendations.push(format!(
                "💡 CPU: Consider adding {} more host(s) for better CPU headroom ({} more cores needed)",
                additional_hosts, additional_cores_needed
            ));

            // If overcommit is high, suggest adjustment
            if request.overcommit_ratios.cpu > 6.0 {
                recommendations.push(format!(
                    "⚠️  CPU overcommit ratio is high ({}:1). Consider reducing to 4:1 for better performance",
                    request.overcommit_ratios.cpu
                ));
            }
        } else if cpu.utilization_percent < 40.0 {
            recommendations
                .push("✅ CPU: Excellent headroom for growth and burst workloads".to_string());
        }

        // Memory recommendations
        if memory.utilization_percent > 80.0 {
            let additional_gb_needed = (memory.required - (memory.available * 0.70)).ceil() as u32;

            recommendations.push(format!(
                "💡 Memory: Consider adding {} GB more memory across hosts",
                additional_gb_needed
            ));

            if request.overcommit_ratios.memory > 1.5 {
                recommendations.push(format!(
                    "⚠️  Memory overcommit ratio ({:.1}:1) is aggressive. Standard is 1.5:1",
                    request.overcommit_ratios.memory
                ));
            }
        } else if memory.utilization_percent < 40.0 {
            recommendations.push("✅ Memory: Excellent capacity with room for growth".to_string());
        }

        // Storage recommendations
        if storage.utilization_percent > 80.0 {
            let additional_tb_needed = (storage.required - (storage.available * 0.70)).ceil();

            recommendations.push(format!(
                "💡 Storage: Consider adding {:.1} TB more storage capacity",
                additional_tb_needed
            ));

            if request.target_hardware.host_count < 4 {
                recommendations.push(
                    "💡 Storage: With 4+ hosts, you'll have better capacity and resilience"
                        .to_string(),
                );
            }
        } else if storage.utilization_percent < 40.0 {
            recommendations
                .push("✅ Storage: Excellent capacity with headroom for growth".to_string());
        }

        // Overall workload assessment
        if workload.vm_count > 200 {
            recommendations.push(format!(
                "📊 Large workload detected ({} VMs). Consider phased migration approach",
                workload.vm_count
            ));
        }

        // HA recommendations
        if request.target_hardware.host_count < 3 {
            recommendations.push(
                "⚠️  HA: Minimum 3 hosts recommended for proper high availability".to_string(),
            );
        }

        // Performance recommendations
        if let Some(peak_cpu) = workload.peak_cpu_utilization {
            if peak_cpu > 0.8 {
                recommendations.push(format!(
                    "⚠️  Source cluster shows high CPU peaks ({:.0}%). Ensure target has adequate capacity",
                    peak_cpu * 100.0
                ));
            }
        }

        // If everything looks good
        if recommendations.is_empty() {
            recommendations.push(
                "✅ Capacity planning looks excellent! Hardware is well-sized for this workload"
                    .to_string(),
            );
        }

        recommendations
    }

    /// Fetch workload summary from source cluster
    ///
    /// This would integrate with RVTools service to get actual workload data.
    /// For now, returns a placeholder.
    async fn fetch_workload_summary(
        db: &Surreal<Db>,
        cluster_id: &str,
    ) -> Result<WorkloadSummary, Box<dyn std::error::Error>> {
        // TODO: Integrate with RVTools service to fetch real data
        // This is a placeholder implementation

        // Query for cluster data
        let query = format!("SELECT * FROM cluster WHERE id = 'cluster:{}'", cluster_id);
        let mut response = db.query(&query).await?;
        let _clusters: Vec<serde_json::Value> = response.take(0)?;

        // For now, return mock data
        // In production, this would aggregate VM data from RVTools
        Ok(WorkloadSummary {
            total_cpu_cores: 0,
            total_memory_gb: 0,
            total_storage_tb: 0.0,
            vm_count: 0,
            peak_cpu_utilization: None,
            peak_memory_utilization: None,
        })
    }

    /// Calculate recommended host count
    ///
    /// Helper method to determine optimal host count for a workload
    pub fn calculate_recommended_hosts(
        workload: &WorkloadSummary,
        cpu_per_host: u32,
        memory_per_host_gb: u32,
        storage_per_host_tb: f64,
        overcommit: &OvercommitRatios,
    ) -> u32 {
        // Calculate hosts needed for each resource
        let hosts_for_cpu = (workload.total_cpu_cores as f64
            / (cpu_per_host as f64 * overcommit.cpu))
            .ceil() as u32;

        let hosts_for_memory = (workload.total_memory_gb as f64
            / (memory_per_host_gb as f64 * overcommit.memory))
            .ceil() as u32;

        let hosts_for_storage = (workload.total_storage_tb / storage_per_host_tb).ceil() as u32;

        // Take the maximum
        let base_hosts = hosts_for_cpu.max(hosts_for_memory).max(hosts_for_storage);

        // Add 1 for HA (N+1)
        let recommended = base_hosts + 1;

        // Ensure minimum of 3 for proper HA
        recommended.max(3)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resource_validation_optimal() {
        let workload = WorkloadSummary {
            total_cpu_cores: 100,
            total_memory_gb: 500,
            total_storage_tb: 10.0,
            vm_count: 50,
            peak_cpu_utilization: Some(0.6),
            peak_memory_utilization: Some(0.7),
        };

        let validation = CapacityValidationService::validate_resource(
            100.0, // required
            200.0, // available (50% utilization)
            "CPU", &workload,
        );

        assert_eq!(validation.status, ResourceStatus::Ok);
        assert!(validation.utilization_percent < 60.0);
    }

    #[test]
    fn test_resource_validation_warning() {
        let workload = WorkloadSummary {
            total_cpu_cores: 100,
            total_memory_gb: 500,
            total_storage_tb: 10.0,
            vm_count: 50,
            peak_cpu_utilization: None,
            peak_memory_utilization: None,
        };

        let validation = CapacityValidationService::validate_resource(
            180.0, // required
            200.0, // available (90% utilization)
            "CPU", &workload,
        );

        assert_eq!(validation.status, ResourceStatus::Warning);
        assert!(validation.utilization_percent >= 80.0);
    }

    #[test]
    fn test_resource_validation_critical() {
        let workload = WorkloadSummary {
            total_cpu_cores: 100,
            total_memory_gb: 500,
            total_storage_tb: 10.0,
            vm_count: 50,
            peak_cpu_utilization: None,
            peak_memory_utilization: None,
        };

        let validation = CapacityValidationService::validate_resource(
            250.0, // required
            200.0, // available (125% utilization - insufficient!)
            "CPU", &workload,
        );

        assert_eq!(validation.status, ResourceStatus::Critical);
        assert!(validation.utilization_percent > 100.0);
    }

    #[test]
    fn test_recommended_hosts_calculation() {
        let workload = WorkloadSummary {
            total_cpu_cores: 200,
            total_memory_gb: 1024,
            total_storage_tb: 50.0,
            vm_count: 100,
            peak_cpu_utilization: None,
            peak_memory_utilization: None,
        };

        let overcommit = OvercommitRatios {
            cpu: 4.0,
            memory: 1.5,
        };

        let recommended = CapacityValidationService::calculate_recommended_hosts(
            &workload,
            32,   // CPU per host
            256,  // Memory GB per host
            12.0, // Storage TB per host
            &overcommit,
        );

        // Should recommend at least 3 hosts for HA
        assert!(recommended >= 3);
    }
}
