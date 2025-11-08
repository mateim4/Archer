use crate::models::hld::{VariableValue, VariableConfidence};
use crate::models::project_models::RvToolsData;
use std::collections::{HashMap, HashSet};

/// Represents a single variable that has been mapped from RVTools data
#[derive(Debug, Clone)]
pub struct MappedVariable {
    pub name: String,
    pub value: Option<VariableValue>,
    pub confidence: VariableConfidence,
    pub source: String,
    pub error_message: Option<String>,
}

/// Maps RVTools data to HLD variables with confidence scoring
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
        let mut mapped = HashMap::new();

        // If no data, return empty map
        if self.rvtools_data.is_empty() {
            return mapped;
        }

        // Extract unique hosts
        let unique_hosts: HashSet<String> = self.rvtools_data
            .iter()
            .map(|d| d.host_name.clone())
            .collect();

        // Extract unique clusters
        let clusters: HashSet<String> = self.rvtools_data
            .iter()
            .filter_map(|d| d.cluster.clone())
            .collect();

        // Calculate totals
        let total_cpu: i32 = self.rvtools_data.iter().map(|d| d.cpu_cores).sum();
        let total_memory_gb: i32 = self.rvtools_data.iter().map(|d| d.memory_gb).sum();
        let total_disk_gb: i32 = self.rvtools_data.iter().map(|d| d.disk_gb).sum();

        // Map: node_count (HIGH confidence - exact count from data)
        mapped.insert(
            "node_count".to_string(),
            MappedVariable {
                name: "node_count".to_string(),
                value: Some(VariableValue::Integer(unique_hosts.len() as i64)),
                confidence: VariableConfidence::High,
                source: format!("Extracted {} unique hosts from RVTools data", unique_hosts.len()),
                error_message: None,
            },
        );

        // Map: total_vm_count_target (HIGH confidence - exact count)
        mapped.insert(
            "total_vm_count_target".to_string(),
            MappedVariable {
                name: "total_vm_count_target".to_string(),
                value: Some(VariableValue::Integer(self.rvtools_data.len() as i64)),
                confidence: VariableConfidence::High,
                source: format!("Counted {} VMs from RVTools data", self.rvtools_data.len()),
                error_message: None,
            },
        );

        // Map: cluster_name (MEDIUM confidence - first cluster found)
        if let Some(cluster_name) = clusters.iter().next() {
            mapped.insert(
                "cluster_name".to_string(),
                MappedVariable {
                    name: "cluster_name".to_string(),
                    value: Some(VariableValue::String(cluster_name.clone())),
                    confidence: VariableConfidence::Medium,
                    source: format!("Extracted from RVTools data ({} clusters found)", clusters.len()),
                    error_message: None,
                },
            );
        }

        // Map: ram_gb_per_host (LOW confidence - estimated from VM allocations)
        let estimated_ram_per_host = if !unique_hosts.is_empty() {
            total_memory_gb / unique_hosts.len() as i32
        } else {
            0
        };
        mapped.insert(
            "ram_gb_per_host".to_string(),
            MappedVariable {
                name: "ram_gb_per_host".to_string(),
                value: Some(VariableValue::Integer(estimated_ram_per_host as i64)),
                confidence: VariableConfidence::Low,
                source: format!("Estimated from VM memory allocations ({}GB total / {} hosts)", total_memory_gb, unique_hosts.len()),
                error_message: Some("This is an estimate based on VM allocations, not actual host capacity".to_string()),
            },
        );

        // Map: total_storage_tb_usable (MEDIUM confidence - calculated from VM disks)
        let storage_tb = total_disk_gb as f64 / 1024.0;
        mapped.insert(
            "total_storage_tb_usable".to_string(),
            MappedVariable {
                name: "total_storage_tb_usable".to_string(),
                value: Some(VariableValue::Float(storage_tb)),
                confidence: VariableConfidence::Medium,
                source: format!("Calculated from VM disk allocations ({}GB total)", total_disk_gb),
                error_message: Some("Does not account for storage overhead or RAID configuration".to_string()),
            },
        );

        // Map: VM templates (MEDIUM confidence - calculated from percentiles)
        let templates = self.map_vm_templates();
        for (name, var) in templates {
            mapped.insert(name, var);
        }

        mapped
    }

    /// Calculate VM templates (small, medium, large) based on percentiles
    /// Small = 33rd percentile, Medium = 66th percentile, Large = 95th percentile
    fn map_vm_templates(&self) -> HashMap<String, MappedVariable> {
        let mut templates = HashMap::new();

        // Collect CPU and RAM values
        let mut cpu_values: Vec<i32> = self.rvtools_data.iter().map(|d| d.cpu_cores).collect();
        let mut ram_values: Vec<i32> = self.rvtools_data.iter().map(|d| d.memory_gb).collect();

        // Sort for percentile calculation
        cpu_values.sort_unstable();
        ram_values.sort_unstable();

        if cpu_values.is_empty() || ram_values.is_empty() {
            return templates;
        }

        // Calculate percentiles
        let len = cpu_values.len();
        let p33 = (len as f64 * 0.33) as usize;
        let p66 = (len as f64 * 0.66) as usize;
        let p95 = (len as f64 * 0.95) as usize;

        // Small template (33rd percentile)
        templates.insert(
            "template_small_vcpus".to_string(),
            MappedVariable {
                name: "template_small_vcpus".to_string(),
                value: Some(VariableValue::Integer(cpu_values[p33.min(len - 1)] as i64)),
                confidence: VariableConfidence::Medium,
                source: format!("33rd percentile of VM CPU allocations ({} VMs analyzed)", len),
                error_message: None,
            },
        );
        templates.insert(
            "template_small_ram_gb".to_string(),
            MappedVariable {
                name: "template_small_ram_gb".to_string(),
                value: Some(VariableValue::Integer(ram_values[p33.min(len - 1)] as i64)),
                confidence: VariableConfidence::Medium,
                source: format!("33rd percentile of VM RAM allocations ({} VMs analyzed)", len),
                error_message: None,
            },
        );

        // Medium template (66th percentile)
        templates.insert(
            "template_medium_vcpus".to_string(),
            MappedVariable {
                name: "template_medium_vcpus".to_string(),
                value: Some(VariableValue::Integer(cpu_values[p66.min(len - 1)] as i64)),
                confidence: VariableConfidence::Medium,
                source: format!("66th percentile of VM CPU allocations ({} VMs analyzed)", len),
                error_message: None,
            },
        );
        templates.insert(
            "template_medium_ram_gb".to_string(),
            MappedVariable {
                name: "template_medium_ram_gb".to_string(),
                value: Some(VariableValue::Integer(ram_values[p66.min(len - 1)] as i64)),
                confidence: VariableConfidence::Medium,
                source: format!("66th percentile of VM RAM allocations ({} VMs analyzed)", len),
                error_message: None,
            },
        );

        // Large template (95th percentile)
        templates.insert(
            "template_large_vcpus".to_string(),
            MappedVariable {
                name: "template_large_vcpus".to_string(),
                value: Some(VariableValue::Integer(cpu_values[p95.min(len - 1)] as i64)),
                confidence: VariableConfidence::Medium,
                source: format!("95th percentile of VM CPU allocations ({} VMs analyzed)", len),
                error_message: None,
            },
        );
        templates.insert(
            "template_large_ram_gb".to_string(),
            MappedVariable {
                name: "template_large_ram_gb".to_string(),
                value: Some(VariableValue::Integer(ram_values[p95.min(len - 1)] as i64)),
                confidence: VariableConfidence::Medium,
                source: format!("95th percentile of VM RAM allocations ({} VMs analyzed)", len),
                error_message: None,
            },
        );

        templates
    }

    /// Calculate overall confidence score (0.0 to 1.0)
    /// Average of all mapped variable confidences
    pub fn calculate_overall_confidence(&self, mapped: &HashMap<String, MappedVariable>) -> f64 {
        if mapped.is_empty() {
            return 0.0;
        }

        let total: f64 = mapped
            .values()
            .map(|v| match v.confidence {
                VariableConfidence::High => 1.0,
                VariableConfidence::Medium => 0.6,
                VariableConfidence::Low => 0.3,
                VariableConfidence::None => 0.0,
            })
            .sum();

        total / mapped.len() as f64
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_data() -> Vec<RvToolsData> {
        vec![
            RvToolsData {
                id: None,
                upload_id: "test-upload".to_string(),
                line_number: 1,
                vm_name: "vm1".to_string(),
                host_name: "host1".to_string(),
                cpu_cores: 2,
                memory_gb: 4,
                disk_gb: 100,
                operating_system: Some("Windows".to_string()),
                power_state: Some("On".to_string()),
                cluster: Some("cluster1".to_string()),
                datacenter: Some("dc1".to_string()),
                network_adapters: Some(1),
                processed_to_pool: false,
                metadata: HashMap::new(),
                created_at: Utc::now(),
            },
            RvToolsData {
                id: None,
                upload_id: "test-upload".to_string(),
                line_number: 2,
                vm_name: "vm2".to_string(),
                host_name: "host1".to_string(),
                cpu_cores: 4,
                memory_gb: 8,
                disk_gb: 200,
                operating_system: Some("Linux".to_string()),
                power_state: Some("On".to_string()),
                cluster: Some("cluster1".to_string()),
                datacenter: Some("dc1".to_string()),
                network_adapters: Some(2),
                processed_to_pool: false,
                metadata: HashMap::new(),
                created_at: Utc::now(),
            },
            RvToolsData {
                id: None,
                upload_id: "test-upload".to_string(),
                line_number: 3,
                vm_name: "vm3".to_string(),
                host_name: "host2".to_string(),
                cpu_cores: 8,
                memory_gb: 16,
                disk_gb: 500,
                operating_system: Some("Linux".to_string()),
                power_state: Some("On".to_string()),
                cluster: Some("cluster1".to_string()),
                datacenter: Some("dc1".to_string()),
                network_adapters: Some(2),
                processed_to_pool: false,
                metadata: HashMap::new(),
                created_at: Utc::now(),
            },
        ]
    }

    #[test]
    fn test_map_to_hld_variables() {
        let data = create_test_data();
        let mapper = RVToolsHLDMapper::new(&data);
        let mapped = mapper.map_to_hld_variables();

        assert!(!mapped.is_empty());
        assert!(mapped.contains_key("node_count"));
        assert!(mapped.contains_key("total_vm_count_target"));
        assert!(mapped.contains_key("cluster_name"));
    }

    #[test]
    fn test_node_count() {
        let data = create_test_data();
        let mapper = RVToolsHLDMapper::new(&data);
        let mapped = mapper.map_to_hld_variables();

        let node_count = mapped.get("node_count").unwrap();
        assert_eq!(node_count.value, Some(VariableValue::Integer(2))); // host1, host2
        assert_eq!(node_count.confidence, VariableConfidence::High);
    }

    #[test]
    fn test_total_vm_count() {
        let data = create_test_data();
        let mapper = RVToolsHLDMapper::new(&data);
        let mapped = mapper.map_to_hld_variables();

        let vm_count = mapped.get("total_vm_count_target").unwrap();
        assert_eq!(vm_count.value, Some(VariableValue::Integer(3)));
        assert_eq!(vm_count.confidence, VariableConfidence::High);
    }

    #[test]
    fn test_calculate_overall_confidence() {
        let data = create_test_data();
        let mapper = RVToolsHLDMapper::new(&data);
        let mapped = mapper.map_to_hld_variables();
        let confidence = mapper.calculate_overall_confidence(&mapped);

        assert!(confidence > 0.0 && confidence <= 1.0);
    }

    #[test]
    fn test_vm_templates() {
        let data = create_test_data();
        let mapper = RVToolsHLDMapper::new(&data);
        let mapped = mapper.map_to_hld_variables();

        assert!(mapped.contains_key("template_small_vcpus"));
        assert!(mapped.contains_key("template_medium_vcpus"));
        assert!(mapped.contains_key("template_large_vcpus"));
    }

    #[test]
    fn test_empty_data() {
        let data: Vec<RvToolsData> = vec![];
        let mapper = RVToolsHLDMapper::new(&data);
        let mapped = mapper.map_to_hld_variables();

        assert!(mapped.is_empty());
        let confidence = mapper.calculate_overall_confidence(&mapped);
        assert_eq!(confidence, 0.0);
    }
}
