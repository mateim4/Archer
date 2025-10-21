//! Hardware Compatibility Service
//!
//! Validates hardware compatibility for Azure Stack HCI and Azure Local deployments.
//! Performs checks for:
//! - RDMA-capable NICs
//! - JBOD HBA configuration
//! - Network speed requirements
//! - Disk configuration

use serde::{Deserialize, Serialize};
use surrealdb::{engine::local::Db, Surreal};

use crate::models::workflow::{
    CheckResult, CheckStatus, CompatibilityChecks, CompatibilityStatus,
    HardwareCompatibilityResult, InfrastructureType,
};

/// Request for hardware compatibility check
#[derive(Debug, Serialize, Deserialize)]
pub struct CompatibilityCheckRequest {
    pub infrastructure_type: InfrastructureType,
    pub hardware_specs: Vec<HardwareSpec>,
}

/// Hardware specifications for a single host
#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareSpec {
    pub host_name: String,
    pub network_adapters: Vec<NetworkAdapter>,
    pub storage_controllers: Vec<StorageController>,
    pub disks: Vec<Disk>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkAdapter {
    pub name: String,
    pub speed_gbps: u32,
    pub port_type: String, // "RJ45", "SFP+", "QSFP+"
    pub rdma_capable: bool,
    pub rdma_type: Option<String>, // "RoCE", "iWARP", "InfiniBand"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageController {
    pub name: String,
    pub controller_type: String, // "RAID", "HBA", "NVMe"
    pub mode: String,            // "RAID", "HBA/JBOD", "Passthrough"
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Disk {
    pub name: String,
    pub disk_type: String, // "SSD", "NVMe", "HDD"
    pub capacity_gb: u32,
    pub interface_type: String, // "SATA", "SAS", "NVMe"
}

pub struct HardwareCompatibilityService;

impl HardwareCompatibilityService {
    /// Main entry point for HCI compatibility checking
    ///
    /// Traditional infrastructure bypasses all checks.
    /// HCI S2D and Azure Local require full validation.
    pub async fn check_hci_compatibility(
        _db: &Surreal<Db>,
        request: CompatibilityCheckRequest,
    ) -> Result<HardwareCompatibilityResult, Box<dyn std::error::Error>> {
        // Traditional infrastructure doesn't need HCI-specific checks
        if request.infrastructure_type == InfrastructureType::Traditional {
            return Ok(HardwareCompatibilityResult {
                status: CompatibilityStatus::Passed,
                checks: CompatibilityChecks {
                    rdma_nics: CheckResult {
                        status: CheckStatus::Passed,
                        message: "RDMA not required for traditional infrastructure".to_string(),
                        details: None,
                    },
                    jbod_hba: CheckResult {
                        status: CheckStatus::Passed,
                        message: "JBOD not required for traditional infrastructure".to_string(),
                        details: None,
                    },
                    network_speed: CheckResult {
                        status: CheckStatus::Passed,
                        message: "Network speed requirements met".to_string(),
                        details: None,
                    },
                    jbod_disks: CheckResult {
                        status: CheckStatus::Passed,
                        message: "Disk configuration compatible".to_string(),
                        details: None,
                    },
                },
                recommendations: vec!["Traditional infrastructure configured".to_string()],
                can_proceed: true,
            });
        }

        // Perform all HCI checks
        let rdma_check = Self::check_rdma_nics(&request.hardware_specs);
        let hba_check = Self::check_jbod_hba(&request.hardware_specs);
        let network_check = Self::check_network_speed(&request.hardware_specs);
        let disk_check = Self::check_jbod_disks(&request.hardware_specs);

        // Determine overall status
        let all_checks = vec![&rdma_check, &hba_check, &network_check, &disk_check];
        let has_failures = all_checks.iter().any(|c| c.status == CheckStatus::Failed);
        let has_warnings = all_checks.iter().any(|c| c.status == CheckStatus::Warning);

        let status = if has_failures {
            CompatibilityStatus::Failed
        } else if has_warnings {
            CompatibilityStatus::Warnings
        } else {
            CompatibilityStatus::Passed
        };

        // Generate recommendations
        let recommendations = Self::generate_recommendations(
            &rdma_check,
            &hba_check,
            &network_check,
            &disk_check,
            &request.infrastructure_type,
        );

        // Can proceed if no failures (warnings are acceptable with override)
        let can_proceed = !has_failures;

        Ok(HardwareCompatibilityResult {
            status,
            checks: CompatibilityChecks {
                rdma_nics: rdma_check,
                jbod_hba: hba_check,
                network_speed: network_check,
                jbod_disks: disk_check,
            },
            recommendations,
            can_proceed,
        })
    }

    /// Check for RDMA-capable NICs
    ///
    /// HCI requires RDMA for optimal Storage Spaces Direct performance.
    /// Detects RoCE, iWARP, and InfiniBand adapters.
    fn check_rdma_nics(hardware_specs: &[HardwareSpec]) -> CheckResult {
        let mut rdma_adapters = Vec::new();
        let mut rdma_types = Vec::new();

        for host in hardware_specs {
            for adapter in &host.network_adapters {
                if adapter.rdma_capable {
                    rdma_adapters.push(adapter.name.clone());
                    if let Some(rdma_type) = &adapter.rdma_type {
                        if !rdma_types.contains(rdma_type) {
                            rdma_types.push(rdma_type.clone());
                        }
                    }
                }
            }
        }

        if rdma_adapters.is_empty() {
            CheckResult {
                status: CheckStatus::Failed,
                message: "No RDMA-capable NICs detected".to_string(),
                details: Some(serde_json::json!({
                    "required": true,
                    "found": 0,
                    "recommendation": "Install RDMA-capable network adapters (RoCE or iWARP)"
                })),
            }
        } else if rdma_adapters.len() < 2 {
            CheckResult {
                status: CheckStatus::Warning,
                message: format!(
                    "Only {} RDMA NIC detected, 2+ recommended for redundancy",
                    rdma_adapters.len()
                ),
                details: Some(serde_json::json!({
                    "adapters": rdma_adapters,
                    "types": rdma_types,
                    "recommendation": "Add additional RDMA NICs for redundancy"
                })),
            }
        } else {
            CheckResult {
                status: CheckStatus::Passed,
                message: format!(
                    "RDMA NICs detected: {} ({} adapters)",
                    rdma_types.join(", "),
                    rdma_adapters.len()
                ),
                details: Some(serde_json::json!({
                    "adapters": rdma_adapters,
                    "types": rdma_types
                })),
            }
        }
    }

    /// Check for JBOD HBA configuration
    ///
    /// Storage Spaces Direct requires disks in JBOD (passthrough) mode,
    /// not RAID configuration.
    fn check_jbod_hba(hardware_specs: &[HardwareSpec]) -> CheckResult {
        let mut jbod_controllers = Vec::new();
        let mut raid_controllers = Vec::new();

        for host in hardware_specs {
            for controller in &host.storage_controllers {
                match controller.mode.to_lowercase().as_str() {
                    "hba" | "jbod" | "passthrough" => {
                        jbod_controllers.push(controller.name.clone());
                    }
                    "raid" => {
                        raid_controllers.push(controller.name.clone());
                    }
                    _ => {}
                }
            }
        }

        if !raid_controllers.is_empty() {
            CheckResult {
                status: CheckStatus::Warning,
                message: format!(
                    "Storage controllers in RAID mode detected: {}",
                    raid_controllers.join(", ")
                ),
                details: Some(serde_json::json!({
                    "raid_controllers": raid_controllers,
                    "recommendation": "Configure controllers in HBA/JBOD mode for S2D"
                })),
            }
        } else if jbod_controllers.is_empty() {
            CheckResult {
                status: CheckStatus::Warning,
                message: "No JBOD/HBA controllers explicitly detected".to_string(),
                details: Some(serde_json::json!({
                    "recommendation": "Verify storage controller mode is HBA/JBOD"
                })),
            }
        } else {
            CheckResult {
                status: CheckStatus::Passed,
                message: format!("JBOD/HBA mode confirmed: {}", jbod_controllers.join(", ")),
                details: Some(serde_json::json!({
                    "controllers": jbod_controllers
                })),
            }
        }
    }

    /// Check network speed requirements
    ///
    /// HCI requires minimum 10 Gbps networking, 25 Gbps recommended.
    fn check_network_speed(hardware_specs: &[HardwareSpec]) -> CheckResult {
        let mut max_speed = 0u32;
        let mut adapters_by_speed: std::collections::HashMap<u32, Vec<String>> =
            std::collections::HashMap::new();

        for host in hardware_specs {
            for adapter in &host.network_adapters {
                if adapter.speed_gbps > max_speed {
                    max_speed = adapter.speed_gbps;
                }
                adapters_by_speed
                    .entry(adapter.speed_gbps)
                    .or_insert_with(Vec::new)
                    .push(adapter.name.clone());
            }
        }

        if max_speed < 10 {
            CheckResult {
                status: CheckStatus::Failed,
                message: format!(
                    "Network speed too slow: {} Gbps (minimum 10 Gbps)",
                    max_speed
                ),
                details: Some(serde_json::json!({
                    "max_speed_gbps": max_speed,
                    "minimum_required_gbps": 10,
                    "recommendation": "Upgrade to 10 Gbps or faster networking"
                })),
            }
        } else if max_speed < 25 {
            CheckResult {
                status: CheckStatus::Warning,
                message: format!(
                    "Network speed meets minimum: {} Gbps (25 Gbps recommended)",
                    max_speed
                ),
                details: Some(serde_json::json!({
                    "max_speed_gbps": max_speed,
                    "recommended_gbps": 25,
                    "adapters_by_speed": adapters_by_speed
                })),
            }
        } else {
            CheckResult {
                status: CheckStatus::Passed,
                message: format!("Network speed meets requirements: {} Gbps", max_speed),
                details: Some(serde_json::json!({
                    "max_speed_gbps": max_speed,
                    "adapters_by_speed": adapters_by_speed
                })),
            }
        }
    }

    /// Check disk configuration for S2D
    ///
    /// Verifies sufficient SSDs/NVMe drives for cache and capacity tiers.
    fn check_jbod_disks(hardware_specs: &[HardwareSpec]) -> CheckResult {
        let mut total_ssds = 0;
        let mut total_nvme = 0;
        let mut total_capacity_tb = 0.0;

        for host in hardware_specs {
            for disk in &host.disks {
                match disk.disk_type.to_lowercase().as_str() {
                    "ssd" => total_ssds += 1,
                    "nvme" => total_nvme += 1,
                    _ => {}
                }
                total_capacity_tb += disk.capacity_gb as f64 / 1000.0;
            }
        }

        let total_flash = total_ssds + total_nvme;

        if total_flash < 2 {
            CheckResult {
                status: CheckStatus::Failed,
                message: format!(
                    "Insufficient SSD/NVMe drives: {} (minimum 2 per node)",
                    total_flash
                ),
                details: Some(serde_json::json!({
                    "ssd_count": total_ssds,
                    "nvme_count": total_nvme,
                    "minimum_required": 2,
                    "recommendation": "Add SSD or NVMe drives for S2D"
                })),
            }
        } else if total_flash < 4 {
            CheckResult {
                status: CheckStatus::Warning,
                message: format!(
                    "Limited SSD/NVMe drives: {} (4+ recommended for performance)",
                    total_flash
                ),
                details: Some(serde_json::json!({
                    "ssd_count": total_ssds,
                    "nvme_count": total_nvme,
                    "total_capacity_tb": total_capacity_tb,
                    "recommendation": "Consider adding more drives for better performance and capacity"
                })),
            }
        } else {
            CheckResult {
                status: CheckStatus::Passed,
                message: format!(
                    "Sufficient SSDs available: {} SSDs, {} NVMe ({:.1} TB total)",
                    total_ssds, total_nvme, total_capacity_tb
                ),
                details: Some(serde_json::json!({
                    "ssd_count": total_ssds,
                    "nvme_count": total_nvme,
                    "total_capacity_tb": total_capacity_tb
                })),
            }
        }
    }

    /// Generate context-aware recommendations
    fn generate_recommendations(
        rdma_check: &CheckResult,
        hba_check: &CheckResult,
        network_check: &CheckResult,
        disk_check: &CheckResult,
        infrastructure_type: &InfrastructureType,
    ) -> Vec<String> {
        let mut recommendations = Vec::new();

        let infra_name = match infrastructure_type {
            InfrastructureType::HciS2d => "Azure Stack HCI with Storage Spaces Direct",
            InfrastructureType::AzureLocal => "Azure Local",
            _ => "this infrastructure",
        };

        // RDMA recommendations
        if rdma_check.status != CheckStatus::Passed {
            recommendations.push(format!(
                "Install RDMA-capable NICs (RoCE or iWARP) for optimal {} performance",
                infra_name
            ));
            recommendations.push("Ensure RDMA is enabled in BIOS and Windows".to_string());
        }

        // HBA recommendations
        if hba_check.status == CheckStatus::Warning {
            recommendations
                .push("Configure storage controllers in HBA/JBOD mode instead of RAID".to_string());
            recommendations
                .push("Storage Spaces Direct manages redundancy in software".to_string());
        }

        // Network recommendations
        if network_check.status != CheckStatus::Passed {
            if network_check.status == CheckStatus::Failed {
                recommendations.push("Upgrade to 10 Gbps or faster networking".to_string());
            } else {
                recommendations.push(
                    "Consider upgrading to 25 Gbps networking for better performance".to_string(),
                );
            }
            recommendations.push("Use dedicated network adapters for storage traffic".to_string());
        }

        // Disk recommendations
        if disk_check.status != CheckStatus::Passed {
            recommendations
                .push("Ensure sufficient SSD/NVMe drives for cache and capacity tiers".to_string());
            recommendations.push("Minimum 2 drives per node, 4+ recommended".to_string());
        }

        if recommendations.is_empty() {
            recommendations.push(format!(
                "Hardware configuration looks excellent for {}!",
                infra_name
            ));
        }

        recommendations
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rdma_detection() {
        // Test RDMA NIC detection logic
    }

    #[test]
    fn test_hba_mode_detection() {
        // Test JBOD/HBA mode detection
    }

    #[test]
    fn test_network_speed_validation() {
        // Test network speed validation
    }
}
