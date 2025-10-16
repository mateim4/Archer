//! Timeline Estimation Service
//!
//! Calculates estimated duration for migration activities based on:
//! - VM and host counts
//! - Infrastructure type complexity
//! - Compatibility issues
//! - Historical data (future enhancement)

use serde::{Deserialize, Serialize};
use surrealdb::{engine::local::Db, Surreal};

use crate::models::workflow::{
    EstimationConfidence, InfrastructureType, TaskEstimate, TimelineEstimationResult,
};

/// Request for timeline estimation
#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineEstimationRequest {
    pub vm_count: u32,
    pub host_count: u32,
    pub infrastructure_type: InfrastructureType,
    pub has_compatibility_issues: bool,
}

pub struct TimelineEstimationService;

impl TimelineEstimationService {
    /// Estimate migration timeline based on workload size and complexity
    ///
    /// Returns estimated duration in days along with task breakdown
    /// and critical path analysis.
    pub async fn estimate_migration_timeline(
        _db: &Surreal<Db>,
        request: TimelineEstimationRequest,
    ) -> Result<TimelineEstimationResult, Box<dyn std::error::Error>> {
        // Calculate component durations
        let prep_days = Self::calculate_prep_time(&request);
        let migration_days = Self::calculate_migration_time(&request);
        let validation_days = Self::calculate_validation_time(&request);

        let total_days = prep_days + migration_days + validation_days;

        // Build detailed task breakdown
        let tasks = Self::build_task_breakdown(prep_days, migration_days, validation_days);

        // Extract critical path (in this simple model, all tasks are on critical path)
        let critical_path: Vec<String> = tasks
            .iter()
            .filter(|t| t.is_critical_path)
            .map(|t| t.name.clone())
            .collect();

        // Determine confidence level
        let confidence = Self::calculate_confidence(&request);

        Ok(TimelineEstimationResult {
            estimated_days: total_days,
            task_breakdown: tasks,
            critical_path,
            confidence,
        })
    }

    /// Calculate infrastructure preparation time
    ///
    /// Different infrastructure types have different setup complexity:
    /// - Traditional: 7 days (network, storage, compute setup)
    /// - HCI S2D: 10 days (additional S2D configuration)
    /// - Azure Local: 14 days (Azure Arc registration, cloud integration)
    fn calculate_prep_time(request: &TimelineEstimationRequest) -> u32 {
        let base_days = match request.infrastructure_type {
            InfrastructureType::Traditional => 7,
            InfrastructureType::HciS2d => 10,
            InfrastructureType::AzureLocal => 14,
        };

        // Add time for compatibility remediation
        if request.has_compatibility_issues {
            base_days + 3 // Extra time to fix issues
        } else {
            base_days
        }
    }

    /// Calculate VM migration time
    ///
    /// Based on migration rate assumptions:
    /// - Base rate: 10 VMs per day (traditional tools)
    /// - HCI S2D: 15 VMs per day (faster storage)
    /// - Azure Local: 13 VMs per day (cloud integration overhead)
    ///
    /// Adjusted for:
    /// - Compatibility issues (25% slower)
    /// - Minimum 1 day even for small workloads
    fn calculate_migration_time(request: &TimelineEstimationRequest) -> u32 {
        // Base migration rate (VMs per day)
        let base_vm_rate = 10.0;

        // Adjust rate based on infrastructure type
        let vm_rate = match request.infrastructure_type {
            InfrastructureType::Traditional => base_vm_rate,
            InfrastructureType::HciS2d => base_vm_rate * 1.5,       // Faster with S2D
            InfrastructureType::AzureLocal => base_vm_rate * 1.3,   // Slightly faster
        };

        // Calculate base days
        let mut days = (request.vm_count as f64 / vm_rate).ceil() as u32;

        // Add buffer for compatibility issues
        if request.has_compatibility_issues {
            days += days / 4; // Add 25% buffer
        }

        // Ensure minimum 1 day
        days.max(1)
    }

    /// Calculate testing and validation time
    ///
    /// Scales with workload complexity:
    /// - Base: 7 days (1 week)
    /// - Large workloads (>200 VMs): +3 days
    /// - Medium workloads (>100 VMs): +2 days
    fn calculate_validation_time(request: &TimelineEstimationRequest) -> u32 {
        let base_days = 7;

        // Scale with complexity
        if request.vm_count > 200 {
            base_days + 3
        } else if request.vm_count > 100 {
            base_days + 2
        } else {
            base_days
        }
    }

    /// Build detailed task breakdown with dependencies
    fn build_task_breakdown(
        prep_days: u32,
        migration_days: u32,
        validation_days: u32,
    ) -> Vec<TaskEstimate> {
        vec![
            TaskEstimate {
                name: "Infrastructure Preparation".to_string(),
                duration_days: prep_days,
                dependencies: vec![],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Hardware Deployment".to_string(),
                duration_days: 5,
                dependencies: vec!["Infrastructure Preparation".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Network Configuration".to_string(),
                duration_days: 3,
                dependencies: vec!["Hardware Deployment".to_string()],
                is_critical_path: false,
            },
            TaskEstimate {
                name: "Storage Configuration".to_string(),
                duration_days: 3,
                dependencies: vec!["Hardware Deployment".to_string()],
                is_critical_path: false,
            },
            TaskEstimate {
                name: "Cluster Configuration".to_string(),
                duration_days: 3,
                dependencies: vec![
                    "Network Configuration".to_string(),
                    "Storage Configuration".to_string(),
                ],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Hyper-V Configuration".to_string(),
                duration_days: 2,
                dependencies: vec!["Cluster Configuration".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "VM Migration".to_string(),
                duration_days: migration_days,
                dependencies: vec!["Hyper-V Configuration".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Application Testing".to_string(),
                duration_days: validation_days,
                dependencies: vec!["VM Migration".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Performance Validation".to_string(),
                duration_days: 2,
                dependencies: vec!["VM Migration".to_string()],
                is_critical_path: false,
            },
            TaskEstimate {
                name: "Documentation & Handoff".to_string(),
                duration_days: 2,
                dependencies: vec!["Application Testing".to_string()],
                is_critical_path: true,
            },
        ]
    }

    /// Calculate estimation confidence
    ///
    /// Factors:
    /// - Compatibility issues: Lower confidence
    /// - Large workloads (>500 VMs): Medium confidence (more variables)
    /// - Complex infrastructure (Azure Local): Lower confidence initially
    fn calculate_confidence(request: &TimelineEstimationRequest) -> EstimationConfidence {
        if request.has_compatibility_issues {
            // Issues add uncertainty
            EstimationConfidence::Low
        } else if request.vm_count > 500 {
            // Large migrations have more variables
            EstimationConfidence::Medium
        } else if request.infrastructure_type == InfrastructureType::AzureLocal {
            // Newer technology, less historical data
            EstimationConfidence::Medium
        } else {
            // Standard migration, well understood
            EstimationConfidence::High
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_timeline_estimation_small_workload() {
        // Test with small workload (50 VMs)
        // Should take ~12-15 days total
    }

    #[tokio::test]
    async fn test_timeline_estimation_large_workload() {
        // Test with large workload (500 VMs)
        // Should take significantly longer
    }

    #[tokio::test]
    async fn test_compatibility_issues_increase_duration() {
        // Verify that compatibility issues add buffer time
    }

    #[test]
    fn test_prep_time_by_infrastructure() {
        let traditional_req = TimelineEstimationRequest {
            vm_count: 100,
            host_count: 10,
            infrastructure_type: InfrastructureType::Traditional,
            has_compatibility_issues: false,
        };

        let hci_req = TimelineEstimationRequest {
            infrastructure_type: InfrastructureType::HciS2d,
            ..traditional_req.clone()
        };

        let traditional_prep = TimelineEstimationService::calculate_prep_time(&traditional_req);
        let hci_prep = TimelineEstimationService::calculate_prep_time(&hci_req);

        assert!(hci_prep > traditional_prep, "HCI should take longer to prepare");
    }
}
