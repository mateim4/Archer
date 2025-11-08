use crate::models::hld::{VariableValue, VariableConfidence};
use crate::models::project_models::RvToolsData;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Result of mapping RVTools data to an HLD variable
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MappedVariable {
    pub name: String,
    pub value: Option<VariableValue>,
    pub confidence: VariableConfidence,
    pub source: String,
    pub error_message: Option<String>,
}

/// Service for mapping RVTools data to HLD variables
pub struct RVToolsHLDMapper<'a> {
    rvtools_data: &'a [RvToolsData],
}

impl<'a> RVToolsHLDMapper<'a> {
    pub fn new(rvtools_data: &'a [RvToolsData]) -> Self {
        Self { rvtools_data }
    }

    /// Map RVTools data to HLD variables
    /// Returns a HashMap of variable_name -> MappedVariable
    pub fn map_to_hld_variables(&self) -> HashMap<String, MappedVariable> {
        let mut variables = HashMap::new();

        if self.rvtools_data.is_empty() {
            return variables;
        }

        // Extract unique hosts
        let unique_hosts: std::collections::HashSet<String> = self
            .rvtools_data
            .iter()
            .map(|vm| vm.host_name.clone())
            .collect();

        // Extract unique clusters
        let unique_clusters: std::collections::HashSet<String> = self
            .rvtools_data
            .iter()
            .filter_map(|vm| vm.cluster.clone())
            .collect();

        // Node count - HIGH confidence (count of unique hosts)
        variables.insert(
            "node_count".to_string(),
            MappedVariable {
                name: "node_count".to_string(),
                value: Some(VariableValue::Integer(unique_hosts.len() as i64)),
                confidence: VariableConfidence::High,
                source: "rvtools".to_string(),
                error_message: None,
            },
        );

        // Total VM count - HIGH confidence
        variables.insert(
            "total_vm_count_target".to_string(),
            MappedVariable {
                name: "total_vm_count_target".to_string(),
                value: Some(VariableValue::Integer(self.rvtools_data.len() as i64)),
                confidence: VariableConfidence::High,
                source: "rvtools".to_string(),
                error_message: None,
            },
        );

        // Cluster name - MEDIUM confidence (take first non-None cluster)
        if let Some(cluster_name) = unique_clusters.iter().next() {
            variables.insert(
                "cluster_name".to_string(),
                MappedVariable {
                    name: "cluster_name".to_string(),
                    value: Some(VariableValue::String(cluster_name.clone())),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("Verify cluster name for Hyper-V".to_string()),
                },
            );
        }

        // Calculate total resources (sum across all VMs)
        let total_cpu: i32 = self.rvtools_data.iter().map(|vm| vm.cpu_cores).sum();
        let total_memory_gb: i32 = self.rvtools_data.iter().map(|vm| vm.memory_gb).sum();
        let total_disk_gb: i32 = self.rvtools_data.iter().map(|vm| vm.disk_gb).sum();

        // Average RAM per host (rough estimate)
        if !unique_hosts.is_empty() {
            let avg_ram_per_host = total_memory_gb / unique_hosts.len() as i32;
            variables.insert(
                "ram_gb_per_host".to_string(),
                MappedVariable {
                    name: "ram_gb_per_host".to_string(),
                    value: Some(VariableValue::Integer(avg_ram_per_host as i64)),
                    confidence: VariableConfidence::Low,
                    source: "rvtools".to_string(),
                    error_message: Some("Estimated from VM allocations - verify actual host RAM".to_string()),
                },
            );
        }

        // Total storage in TB - MEDIUM confidence
        let total_storage_tb = total_disk_gb as f64 / 1024.0;
        variables.insert(
            "total_storage_tb_usable".to_string(),
            MappedVariable {
                name: "total_storage_tb_usable".to_string(),
                value: Some(VariableValue::Float(total_storage_tb)),
                confidence: VariableConfidence::Medium,
                source: "rvtools".to_string(),
                error_message: Some("Calculated from VM disk allocations".to_string()),
            },
        );

        // VM Template sizing (based on percentiles)
        self.map_vm_templates(&mut variables);

        variables
    }

    // ============================================================================
    // VM TEMPLATE SIZING
    // ============================================================================

    fn map_vm_templates(&self, variables: &mut HashMap<String, MappedVariable>) {
        if hosts.is_empty() {
            return;
        }

        // Get first host as representative (assumes homogeneous hardware)
        let first_host = &hosts[0];

        // Node count - HIGH confidence (exact count)
        variables.insert(
            "node_count".to_string(),
            MappedVariable {
                name: "node_count".to_string(),
                value: Some(VariableValue::Integer(hosts.len() as i64)),
                confidence: VariableConfidence::High,
                source: "rvtools".to_string(),
                error_message: None,
            },
        );

        // CPU Model - MEDIUM confidence (assumes homogeneous)
        if let Some(cpu_model) = &first_host.cpu_model {
            variables.insert(
                "cpu_model".to_string(),
                MappedVariable {
                    name: "cpu_model".to_string(),
                    value: Some(VariableValue::String(cpu_model.clone())),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }

        // CPU Sockets - MEDIUM confidence
        if let Some(cpu_sockets) = first_host.cpus {
            variables.insert(
                "cpu_sockets_per_host".to_string(),
                MappedVariable {
                    name: "cpu_sockets_per_host".to_string(),
                    value: Some(VariableValue::Integer(cpu_sockets as i64)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }

        // Cores per socket - MEDIUM confidence
        if let Some(cores) = first_host.cores {
            if let Some(sockets) = first_host.cpus {
                let cores_per_socket = cores / sockets;
                variables.insert(
                    "cores_per_socket".to_string(),
                    MappedVariable {
                        name: "cores_per_socket".to_string(),
                        value: Some(VariableValue::Integer(cores_per_socket as i64)),
                        confidence: VariableConfidence::Medium,
                        source: "rvtools".to_string(),
                        error_message: None,
                    },
                );
            }
        }

        // CPU Speed (GHz) - MEDIUM confidence
        if let Some(speed_mhz) = first_host.cpu_speed_mhz {
            let speed_ghz = speed_mhz as f64 / 1000.0;
            variables.insert(
                "cpu_ghz_per_core".to_string(),
                MappedVariable {
                    name: "cpu_ghz_per_core".to_string(),
                    value: Some(VariableValue::Float(speed_ghz)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }

        // RAM per host - HIGH confidence
        if let Some(memory_gb) = first_host.memory_gb {
            variables.insert(
                "ram_gb_per_host".to_string(),
                MappedVariable {
                    name: "ram_gb_per_host".to_string(),
                    value: Some(VariableValue::Integer(memory_gb as i64)),
                    confidence: VariableConfidence::High,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }

        // Host server model - LOW confidence (RVTools may not have full model info)
        if let Some(vendor) = &first_host.vendor {
            if let Some(model) = &first_host.model {
                variables.insert(
                    "host_server_model".to_string(),
                    MappedVariable {
                        name: "host_server_model".to_string(),
                        value: Some(VariableValue::String(format!("{} {}", vendor, model))),
                        confidence: VariableConfidence::Low,
                        source: "rvtools".to_string(),
                        error_message: Some("Verify model details manually".to_string()),
                    },
                );
            }
        }

        // Network adapter count - MEDIUM confidence
        if let Some(nics) = first_host.nic_count {
            variables.insert(
                "network_adapter_count".to_string(),
                MappedVariable {
                    name: "network_adapter_count".to_string(),
                    value: Some(VariableValue::Integer(nics as i64)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }
    }

    // ============================================================================
    // CLUSTER CONFIGURATION MAPPING
    // ============================================================================

    fn map_cluster_config(
        &self,
        variables: &mut HashMap<String, MappedVariable>,
        clusters: &[crate::models::rvtools::VClusterData],
    ) {
        if clusters.is_empty() {
            return;
        }

        let first_cluster = &clusters[0];

        // Cluster name - HIGH confidence
        variables.insert(
            "cluster_name".to_string(),
            MappedVariable {
                name: "cluster_name".to_string(),
                value: Some(VariableValue::String(first_cluster.name.clone())),
                confidence: VariableConfidence::High,
                source: "rvtools".to_string(),
                error_message: None,
            },
        );

        // HA enabled - HIGH confidence
        if let Some(ha_enabled) = first_cluster.ha_enabled {
            variables.insert(
                "ha_enabled".to_string(),
                MappedVariable {
                    name: "ha_enabled".to_string(),
                    value: Some(VariableValue::Boolean(ha_enabled)),
                    confidence: VariableConfidence::High,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }

        // DRS (equivalent to Live Migration in Hyper-V) - MEDIUM confidence
        if let Some(drs_enabled) = first_cluster.drs_enabled {
            variables.insert(
                "live_migration_enabled".to_string(),
                MappedVariable {
                    name: "live_migration_enabled".to_string(),
                    value: Some(VariableValue::Boolean(drs_enabled)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("VMware DRS mapped to Hyper-V Live Migration".to_string()),
                },
            );
        }

        // Total host count in cluster
        if let Some(num_hosts) = first_cluster.num_hosts {
            variables.insert(
                "node_count".to_string(),
                MappedVariable {
                    name: "node_count".to_string(),
                    value: Some(VariableValue::Integer(num_hosts as i64)),
                    confidence: VariableConfidence::High,
                    source: "rvtools".to_string(),
                    error_message: None,
                },
            );
        }
    }

    // ============================================================================
    // VM WORKLOAD DESIGN MAPPING
    // ============================================================================

    fn map_vm_workload(
        &self,
        variables: &mut HashMap<String, MappedVariable>,
        vms: &[crate::models::rvtools::VInfoData],
    ) {
        if vms.is_empty() {
            return;
        }

        // Total VM count - HIGH confidence
        variables.insert(
            "total_vm_count_target".to_string(),
            MappedVariable {
                name: "total_vm_count_target".to_string(),
                value: Some(VariableValue::Integer(vms.len() as i64)),
                confidence: VariableConfidence::High,
                source: "rvtools".to_string(),
                error_message: None,
            },
        );

        // Calculate VM templates (small, medium, large) based on statistics
        let vcpu_values: Vec<i32> = vms.iter().filter_map(|vm| vm.cpus).collect();
        let ram_values: Vec<i32> = vms.iter().filter_map(|vm| vm.memory_mb).collect();

        if !vcpu_values.is_empty() {
            // Sort and calculate percentiles
            let mut sorted_vcpus = vcpu_values.clone();
            sorted_vcpus.sort();
            let p33 = sorted_vcpus[sorted_vcpus.len() / 3];
            let p66 = sorted_vcpus[(sorted_vcpus.len() * 2) / 3];

            // Template small (33rd percentile)
            variables.insert(
                "template_small_vcpus".to_string(),
                MappedVariable {
                    name: "template_small_vcpus".to_string(),
                    value: Some(VariableValue::Integer(p33 as i64)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("Based on 33rd percentile of existing VMs".to_string()),
                },
            );

            // Template medium (66th percentile)
            variables.insert(
                "template_medium_vcpus".to_string(),
                MappedVariable {
                    name: "template_medium_vcpus".to_string(),
                    value: Some(VariableValue::Integer(p66 as i64)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("Based on 66th percentile of existing VMs".to_string()),
                },
            );
        }

        if !ram_values.is_empty() {
            let mut sorted_ram = ram_values.clone();
            sorted_ram.sort();
            let p33_mb = sorted_ram[sorted_ram.len() / 3];
            let p66_mb = sorted_ram[(sorted_ram.len() * 2) / 3];

            // Convert MB to GB
            let p33_gb = (p33_mb as f64 / 1024.0).round() as i64;
            let p66_gb = (p66_mb as f64 / 1024.0).round() as i64;

            variables.insert(
                "template_small_ram_gb".to_string(),
                MappedVariable {
                    name: "template_small_ram_gb".to_string(),
                    value: Some(VariableValue::Integer(p33_gb)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("Based on 33rd percentile of existing VMs".to_string()),
                },
            );

            variables.insert(
                "template_medium_ram_gb".to_string(),
                MappedVariable {
                    name: "template_medium_ram_gb".to_string(),
                    value: Some(VariableValue::Integer(p66_gb)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("Based on 66th percentile of existing VMs".to_string()),
                },
            );
        }
    }

    // ============================================================================
    // STORAGE ARCHITECTURE MAPPING
    // ============================================================================

    fn map_storage_architecture(
        &self,
        variables: &mut HashMap<String, MappedVariable>,
        _hosts: &[VHostData],
        datastores: &[crate::models::rvtools::VDatastoreData],
    ) {
        if datastores.is_empty() {
            return;
        }

        // Calculate total usable storage
        let total_capacity_gb: f64 = datastores
            .iter()
            .filter_map(|ds| ds.capacity_gb)
            .sum();

        let total_capacity_tb = total_capacity_gb / 1024.0;

        variables.insert(
            "total_storage_tb_usable".to_string(),
            MappedVariable {
                name: "total_storage_tb_usable".to_string(),
                value: Some(VariableValue::Float(total_capacity_tb)),
                confidence: VariableConfidence::High,
                source: "rvtools".to_string(),
                error_message: None,
            },
        );

        // CSV count (approximate - based on number of datastores)
        variables.insert(
            "csv_volume_count".to_string(),
            MappedVariable {
                name: "csv_volume_count".to_string(),
                value: Some(VariableValue::Integer(datastores.len() as i64)),
                confidence: VariableConfidence::Low,
                source: "rvtools".to_string(),
                error_message: Some("VMware datastores mapped to Hyper-V CSVs - verify count".to_string()),
            },
        );
    }

    // ============================================================================
    // NETWORK ARCHITECTURE MAPPING
    // ============================================================================

    fn map_network_architecture(
        &self,
        variables: &mut HashMap<String, MappedVariable>,
        _hosts: &[VHostData],
        networks: &[crate::models::rvtools::VNetworkData],
    ) {
        if networks.is_empty() {
            return;
        }

        // Collect unique VLAN IDs
        let vlan_ids: Vec<String> = networks
            .iter()
            .filter_map(|net| net.vlan_id)
            .map(|id| id.to_string())
            .collect();

        if !vlan_ids.is_empty() {
            let vm_vlan_ids = vlan_ids.join(",");
            variables.insert(
                "vm_vlan_ids".to_string(),
                MappedVariable {
                    name: "vm_vlan_ids".to_string(),
                    value: Some(VariableValue::String(vm_vlan_ids)),
                    confidence: VariableConfidence::Medium,
                    source: "rvtools".to_string(),
                    error_message: Some("VMware VLANs detected - verify IDs for Hyper-V".to_string()),
                },
            );
        }
    }

    /// Get confidence score for all mapped variables (0.0 - 1.0)
    pub fn calculate_overall_confidence(&self, variables: &HashMap<String, MappedVariable>) -> f64 {
        if variables.is_empty() {
            return 0.0;
        }

        let total_confidence: f64 = variables
            .values()
            .map(|v| match v.confidence {
                VariableConfidence::High => 1.0,
                VariableConfidence::Medium => 0.6,
                VariableConfidence::Low => 0.3,
                VariableConfidence::None => 0.0,
            })
            .sum();

        total_confidence / variables.len() as f64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_mock_rvtools_data() -> RVToolsData {
        RVToolsData {
            vhost: Some(vec![VHostData {
                name: "ESXi-Host-01".to_string(),
                cpu_model: Some("Intel Xeon Gold 6338".to_string()),
                cpus: Some(2),
                cores: Some(64),
                cpu_speed_mhz: Some(2600),
                memory_gb: Some(512),
                vendor: Some("Dell".to_string()),
                model: Some("PowerEdge R750".to_string()),
                nic_count: Some(4),
                ..Default::default()
            }]),
            vcluster: Some(vec![crate::models::rvtools::VClusterData {
                name: "Production-Cluster".to_string(),
                ha_enabled: Some(true),
                drs_enabled: Some(true),
                num_hosts: Some(4),
                ..Default::default()
            }]),
            vinfo: Some(vec![
                crate::models::rvtools::VInfoData {
                    vm_name: "VM-01".to_string(),
                    cpus: Some(4),
                    memory_mb: Some(8192),
                    ..Default::default()
                },
                crate::models::rvtools::VInfoData {
                    vm_name: "VM-02".to_string(),
                    cpus: Some(2),
                    memory_mb: Some(4096),
                    ..Default::default()
                },
            ]),
            vdatastore: Some(vec![crate::models::rvtools::VDatastoreData {
                name: "Datastore-01".to_string(),
                capacity_gb: Some(10240.0),
                ..Default::default()
            }]),
            vnetwork: Some(vec![crate::models::rvtools::VNetworkData {
                name: "VM Network".to_string(),
                vlan_id: Some(100),
                ..Default::default()
            }]),
            ..Default::default()
        }
    }

    #[test]
    fn test_map_physical_infrastructure() {
        let rvtools = create_mock_rvtools_data();
        let mapper = RVToolsHLDMapper::new(&rvtools);
        let variables = mapper.map_to_hld_variables();

        assert!(variables.contains_key("node_count"));
        assert!(variables.contains_key("cpu_model"));
        assert!(variables.contains_key("ram_gb_per_host"));

        // Check node count
        let node_count = variables.get("node_count").unwrap();
        if let Some(VariableValue::Integer(count)) = &node_count.value {
            assert_eq!(*count, 1); // 1 host in mock data
        }
    }

    #[test]
    fn test_map_cluster_config() {
        let rvtools = create_mock_rvtools_data();
        let mapper = RVToolsHLDMapper::new(&rvtools);
        let variables = mapper.map_to_hld_variables();

        assert!(variables.contains_key("cluster_name"));
        assert!(variables.contains_key("ha_enabled"));

        let cluster_name = variables.get("cluster_name").unwrap();
        if let Some(VariableValue::String(name)) = &cluster_name.value {
            assert_eq!(name, "Production-Cluster");
        }
    }

    #[test]
    fn test_calculate_overall_confidence() {
        let rvtools = create_mock_rvtools_data();
        let mapper = RVToolsHLDMapper::new(&rvtools);
        let variables = mapper.map_to_hld_variables();

        let confidence = mapper.calculate_overall_confidence(&variables);
        assert!(confidence > 0.0 && confidence <= 1.0);
    }
}
