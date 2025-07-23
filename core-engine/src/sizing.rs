use crate::models::*;
use crate::Result;
use std::collections::HashMap;
use crate::CoreEngineError;

/// Multi-dimensional bin packing algorithm for VM placement
pub struct SizingEngine;

impl SizingEngine {
    /// Calculate the required number of hosts for a given workload
    pub fn calculate_sizing(
        vms: &[VirtualMachine],
        hardware_profile: &HardwareProfile,
        parameters: &SizingParameters,
    ) -> Result<SizingResult> {
        // Filter VMs based on power state and template status
        let active_vms: Vec<_> = vms.iter()
            .filter(|vm| vm.power_state == PowerState::PoweredOn && !vm.is_template)
            .collect();

        // Apply growth projections
        let projected_vms = Self::apply_growth_projections(&active_vms, parameters);

        // Calculate usable host capacity considering reservations
        let usable_capacity = Self::calculate_usable_capacity(hardware_profile, parameters)?;

        // Run the bin packing algorithm
        let placement_result = Self::run_bin_packing_algorithm(&projected_vms, &usable_capacity)?;

        // Apply HA policy to determine final host count
        let final_host_count = Self::apply_ha_policy(placement_result.required_hosts, &parameters.ha_policy);

        // Calculate utilization metrics
        let utilization_metrics = Self::calculate_utilization_metrics(
            &projected_vms,
            final_host_count,
            &usable_capacity,
            &parameters.ha_policy,
        );

        // Generate warnings
        let warnings = Self::generate_sizing_warnings(&projected_vms, &utilization_metrics, parameters);

        Ok(SizingResult {
            hardware_profile: hardware_profile.clone(),
            required_hosts: final_host_count,
            total_cost: hardware_profile.estimated_cost.map(|cost| cost * final_host_count as f64),
            utilization_metrics,
            vm_placement: placement_result.vm_placement,
            warnings,
        })
    }

    /// Apply growth projections to VM requirements
    fn apply_growth_projections(
        vms: &[&VirtualMachine],
        parameters: &SizingParameters,
    ) -> Vec<ProjectedVm> {
        let growth_multiplier = 1.0 + (parameters.growth_factor_percent / 100.0);
        
        vms.iter().map(|vm| {
            ProjectedVm {
                name: vm.name.clone(),
                vcpu: (vm.num_vcpu as f32 * growth_multiplier).ceil() as u32,
                memory_gb: (vm.memory_gb as f32 * growth_multiplier).ceil() as u32,
                storage_gb: vm.disks.iter()
                    .map(|d| d.consumed_in_guest_gb * growth_multiplier as f64)
                    .sum::<f64>(),
                _special_flags: vm.special_flags.clone(),
                _original_vm: *vm as *const VirtualMachine,
            }
        }).collect()
    }

    /// Calculate usable host capacity considering reservations
    fn calculate_usable_capacity(
        hardware_profile: &HardwareProfile,
        parameters: &SizingParameters,
    ) -> Result<UsableCapacity> {
        // Calculate usable vCPU capacity based on overcommitment ratio
        let usable_vcpu = (hardware_profile.total_cores as f32 * parameters.target_vcpu_pcpu_ratio).floor() as u32;

        // Calculate usable memory (reserve some for hypervisor)
        let hypervisor_memory_reservation = 32; // GB reserved for hypervisor
        let usable_memory = hardware_profile.max_memory_gb.saturating_sub(hypervisor_memory_reservation);

        // Apply additional reservations
        let reserved_vcpu = (usable_vcpu as f32 * parameters.cpu_reservation_percent / 100.0).ceil() as u32;
        let reserved_memory = (usable_memory as f32 * parameters.memory_reservation_percent / 100.0).ceil() as u32;

        Ok(UsableCapacity {
            vcpu: usable_vcpu.saturating_sub(reserved_vcpu),
            memory_gb: usable_memory.saturating_sub(reserved_memory),
            _storage_gb: 0.0, // Storage is typically shared, not per-host
        })
    }

    /// Run the First-Fit Decreasing bin packing algorithm
    fn run_bin_packing_algorithm(
        vms: &[ProjectedVm],
        usable_capacity: &UsableCapacity,
    ) -> Result<PlacementResult> {
        // Sort VMs by resource requirements (descending order)
        let mut sorted_vms = vms.to_vec();
        sorted_vms.sort_by(|a, b| {
            // Primary sort by vCPU, secondary by memory
            let a_weight = a.vcpu * 1000 + a.memory_gb;
            let b_weight = b.vcpu * 1000 + b.memory_gb;
            b_weight.cmp(&a_weight)
        });

        let mut hosts: Vec<HostBin> = Vec::new();
        let mut vm_placement: HashMap<String, String> = HashMap::new();

        for vm in &sorted_vms {
            let mut placed = false;

            // Try to place VM on existing hosts
            for (host_idx, host) in hosts.iter_mut().enumerate() {
                if Self::can_fit_vm(vm, host, usable_capacity) {
                    Self::place_vm_on_host(vm, host);
                    vm_placement.insert(vm.name.clone(), format!("Host-{:02}", host_idx + 1));
                    placed = true;
                    break;
                }
            }

            // If VM doesn't fit on any existing host, create a new one
            if !placed {
                let mut new_host = HostBin::new(hosts.len() + 1, usable_capacity.clone());
                Self::place_vm_on_host(vm, &mut new_host);
                vm_placement.insert(vm.name.clone(), format!("Host-{:02}", new_host.id));
                hosts.push(new_host);
            }
        }

        Ok(PlacementResult {
            required_hosts: hosts.len() as u32,
            vm_placement,
            _host_details: hosts,
        })
    }

    /// Check if a VM can fit on a host
    fn can_fit_vm(vm: &ProjectedVm, host: &HostBin, capacity: &UsableCapacity) -> bool {
        let remaining_vcpu = capacity.vcpu.saturating_sub(host.allocated_vcpu);
        let remaining_memory = capacity.memory_gb.saturating_sub(host.allocated_memory_gb);

        vm.vcpu <= remaining_vcpu && vm.memory_gb <= remaining_memory
    }

    /// Place a VM on a host
    fn place_vm_on_host(vm: &ProjectedVm, host: &mut HostBin) {
        host.allocated_vcpu += vm.vcpu;
        host.allocated_memory_gb += vm.memory_gb;
        host.allocated_storage_gb += vm.storage_gb;
        host.vm_count += 1;
        host.assigned_vms.push(vm.name.clone());
    }

    /// Apply HA policy to determine final host count
    fn apply_ha_policy(calculated_hosts: u32, ha_policy: &HaPolicy) -> u32 {
        match ha_policy {
            HaPolicy::None => calculated_hosts,
            HaPolicy::NPlusOne => calculated_hosts + 1,
            HaPolicy::NPlusTwo => calculated_hosts + 2,
        }
    }

    /// Calculate utilization metrics for the sized solution
    fn calculate_utilization_metrics(
        vms: &[ProjectedVm],
        host_count: u32,
        usable_capacity: &UsableCapacity,
        ha_policy: &HaPolicy,
    ) -> UtilizationMetrics {
        let total_vm_vcpu: u32 = vms.iter().map(|vm| vm.vcpu).sum();
        let total_vm_memory: u32 = vms.iter().map(|vm| vm.memory_gb).sum();
        let _total_vm_storage: f64 = vms.iter().map(|vm| vm.storage_gb).sum();

        let total_cluster_vcpu = usable_capacity.vcpu * host_count;
        let total_cluster_memory = usable_capacity.memory_gb * host_count;

        let cpu_utilization = if total_cluster_vcpu > 0 {
            (total_vm_vcpu as f32 / total_cluster_vcpu as f32) * 100.0
        } else {
            0.0
        };

        let memory_utilization = if total_cluster_memory > 0 {
            (total_vm_memory as f32 / total_cluster_memory as f32) * 100.0
        } else {
            0.0
        };

        let storage_utilization = 75.0; // Placeholder - would need storage capacity info

        // Check N+x compliance
        let effective_hosts = match ha_policy {
            HaPolicy::None => host_count,
            HaPolicy::NPlusOne => host_count.saturating_sub(1),
            HaPolicy::NPlusTwo => host_count.saturating_sub(2),
        };

        let max_utilization_threshold = if effective_hosts > 0 {
            (effective_hosts as f32 / host_count as f32) * 100.0
        } else {
            0.0
        };

        let n_plus_x_compliance = cpu_utilization <= max_utilization_threshold 
            && memory_utilization <= max_utilization_threshold;

        UtilizationMetrics {
            cpu_utilization_percent: cpu_utilization,
            memory_utilization_percent: memory_utilization,
            storage_utilization_percent: storage_utilization,
            n_plus_x_compliance,
        }
    }

    /// Generate sizing warnings
    fn generate_sizing_warnings(
        vms: &[ProjectedVm],
        utilization: &UtilizationMetrics,
        parameters: &SizingParameters,
    ) -> Vec<String> {
        let mut warnings = Vec::new();

        // High utilization warnings
        if utilization.cpu_utilization_percent > 80.0 {
            warnings.push("High CPU utilization - consider additional capacity".to_string());
        }

        if utilization.memory_utilization_percent > 85.0 {
            warnings.push("High memory utilization - consider additional memory".to_string());
        }

        // HA compliance warning
        if !utilization.n_plus_x_compliance {
            warnings.push("Configuration may not support selected HA policy".to_string());
        }

        // Check for oversized VMs
        let oversized_vms: Vec<_> = vms.iter()
            .filter(|vm| vm.vcpu > 16 || vm.memory_gb > 128)
            .collect();

        if !oversized_vms.is_empty() {
            warnings.push(format!(
                "{} VMs may be oversized for the selected hardware",
                oversized_vms.len()
            ));
        }

        // Growth factor warning
        if parameters.growth_factor_percent > 50.0 {
            warnings.push("High growth factor may result in over-provisioning".to_string());
        }

        warnings
    }

    /// Calculate optimal host configuration for a cluster
    pub fn optimize_cluster_configuration(
        vms: &[VirtualMachine],
        available_hardware: &[HardwareProfile],
        parameters: &SizingParameters,
    ) -> Result<Vec<SizingComparison>> {
        let mut comparisons = Vec::new();

        for hardware in available_hardware {
            match Self::calculate_sizing(vms, hardware, parameters) {
                Ok(sizing_result) => {
                    let efficiency_score = Self::calculate_efficiency_score(&sizing_result, hardware);
                    let cost_per_vm = sizing_result.total_cost
                        .map(|cost| cost / vms.len() as f64);
                    comparisons.push(SizingComparison {
                        hardware_profile: hardware.clone(),
                        sizing_result,
                        efficiency_score,
                        cost_per_vm,
                    });
                }
                Err(_) => {
                    // Skip hardware profiles that can't accommodate the workload
                    continue;
                }
            }
        }

        // Sort by efficiency score (descending)
        comparisons.sort_by(|a, b| b.efficiency_score.partial_cmp(&a.efficiency_score).unwrap());

        Ok(comparisons)
    }

    /// Calculate efficiency score for a sizing result
    fn calculate_efficiency_score(sizing_result: &SizingResult, hardware: &HardwareProfile) -> f32 {
        let mut score = 0.0;

        // Utilization efficiency (higher is better)
        score += sizing_result.utilization_metrics.cpu_utilization_percent * 0.4;
        score += sizing_result.utilization_metrics.memory_utilization_percent * 0.4;

        // HA compliance bonus
        if sizing_result.utilization_metrics.n_plus_x_compliance {
            score += 10.0;
        }

        // Cost efficiency (lower cost per vCPU is better)
        if let Some(total_cost) = sizing_result.total_cost {
            let total_vcpu = hardware.total_cores * sizing_result.required_hosts;
            let cost_per_vcpu = total_cost / total_vcpu as f64;
            score += ((1000.0 / cost_per_vcpu) * 0.2) as f32; // Normalized cost factor
        }

        // Penalty for warnings
        score -= sizing_result.warnings.len() as f32 * 2.0;

        score.max(0.0)
    }
}

// Supporting structures for the sizing algorithm

#[derive(Debug, Clone)]
struct ProjectedVm {
    name: String,
    vcpu: u32,
    memory_gb: u32,
    storage_gb: f64,
    _special_flags: VmSpecialFlags,
    _original_vm: *const VirtualMachine,
}

#[derive(Debug, Clone)]
struct UsableCapacity {
    vcpu: u32,
    memory_gb: u32,
    _storage_gb: f64,
}

#[derive(Debug, Clone)]
struct HostBin {
    id: usize,
    allocated_vcpu: u32,
    allocated_memory_gb: u32,
    allocated_storage_gb: f64,
    vm_count: u32,
    assigned_vms: Vec<String>,
}

impl HostBin {
    fn new(id: usize, _capacity: UsableCapacity) -> Self {
        Self {
            id,
            allocated_vcpu: 0,
            allocated_memory_gb: 0,
            allocated_storage_gb: 0.0,
            vm_count: 0,
            assigned_vms: Vec::new(),
        }
    }
}

#[derive(Debug, Clone)]
struct PlacementResult {
    required_hosts: u32,
    vm_placement: HashMap<String, String>,
    _host_details: Vec<HostBin>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SizingComparison {
    pub hardware_profile: HardwareProfile,
    pub sizing_result: SizingResult,
    pub efficiency_score: f32,
    pub cost_per_vm: Option<f64>,
}

// Hardware basket management
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HardwareBasket {
    profiles: Vec<HardwareProfile>,
}

impl HardwareBasket {
    pub fn new() -> Self {
        Self {
            profiles: Self::load_default_profiles(),
        }
    }

    pub fn add_profile(&mut self, profile: HardwareProfile) {
        self.profiles.push(profile);
    }

    pub fn remove_profile(&mut self, id: &uuid::Uuid) -> bool {
        if let Some(pos) = self.profiles.iter().position(|p| p.id == *id) {
            self.profiles.remove(pos);
            true
        } else {
            false
        }
    }

    pub fn get_profiles(&self) -> &[HardwareProfile] {
        &self.profiles
    }

    pub fn get_profile(&self, id: &uuid::Uuid) -> Option<&HardwareProfile> {
        self.profiles.iter().find(|p| p.id == *id)
    }

    pub fn get_hci_certified_profiles(&self) -> Vec<&HardwareProfile> {
        self.profiles.iter().filter(|p| p.is_hci_certified).collect()
    }

    fn load_default_profiles() -> Vec<HardwareProfile> {
        vec![
            // Dell PowerEdge R760
            HardwareProfile {
                id: uuid::Uuid::new_v4(),
                name: "Dell PowerEdge R760".to_string(),
                manufacturer: "Dell".to_string(),
                model: "PowerEdge R760".to_string(),
                cpu_sockets: 2,
                cores_per_socket: 32,
                total_cores: 64,
                max_memory_gb: 512,
                storage_slots: 8,
                network_ports: 4,
                is_hci_certified: true,
                estimated_cost: Some(25000.0),
                power_consumption_watts: Some(800),
                rack_units: 2,
                notes: Some("Optimized for Azure Stack HCI".to_string()),
            },
            // HPE ProLiant DL380 Gen11
            HardwareProfile {
                id: uuid::Uuid::new_v4(),
                name: "HPE ProLiant DL380 Gen11".to_string(),
                manufacturer: "HPE".to_string(),
                model: "ProLiant DL380 Gen11".to_string(),
                cpu_sockets: 2,
                cores_per_socket: 28,
                total_cores: 56,
                max_memory_gb: 768,
                storage_slots: 12,
                network_ports: 4,
                is_hci_certified: true,
                estimated_cost: Some(28000.0),
                power_consumption_watts: Some(750),
                rack_units: 2,
                notes: Some("High memory capacity option".to_string()),
            },
            // Lenovo ThinkSystem SR650 V3
            HardwareProfile {
                id: uuid::Uuid::new_v4(),
                name: "Lenovo ThinkSystem SR650 V3".to_string(),
                manufacturer: "Lenovo".to_string(),
                model: "ThinkSystem SR650 V3".to_string(),
                cpu_sockets: 2,
                cores_per_socket: 24,
                total_cores: 48,
                max_memory_gb: 512,
                storage_slots: 10,
                network_ports: 4,
                is_hci_certified: true,
                estimated_cost: Some(22000.0),
                power_consumption_watts: Some(700),
                rack_units: 1,
                notes: Some("Compact 1U form factor".to_string()),
            },
        ]
    }

    pub fn save_to_file(&self, file_path: &std::path::Path) -> Result<()> {
        let json = serde_json::to_string_pretty(&self.profiles)?;
        std::fs::write(file_path, json).map_err(|e| CoreEngineError::Io(e.to_string()))?;
        Ok(())
    }

    pub fn load_from_file(file_path: &std::path::Path) -> Result<Self> {
        if file_path.exists() {
            let json = std::fs::read_to_string(file_path).map_err(|e| CoreEngineError::Io(e.to_string()))?;
            let profiles: Vec<HardwareProfile> = serde_json::from_str(&json)?;
            Ok(Self { profiles })
        } else {
            Ok(Self::new())
        }
    }
}

impl Default for HardwareBasket {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_usable_capacity_calculation() {
        let hardware = HardwareProfile {
            id: uuid::Uuid::new_v4(),
            name: "Test Server".to_string(),
            manufacturer: "Test".to_string(),
            model: "Model".to_string(),
            cpu_sockets: 2,
            cores_per_socket: 16,
            total_cores: 32,
            max_memory_gb: 256,
            storage_slots: 8,
            network_ports: 4,
            is_hci_certified: true,
            estimated_cost: Some(20000.0),
            power_consumption_watts: Some(600),
            rack_units: 2,
            notes: None,
        };

        let parameters = SizingParameters::default();
        let capacity = SizingEngine::calculate_usable_capacity(&hardware, &parameters).unwrap();

        assert_eq!(capacity.vcpu, 115); // 32 * 4.0 = 128, 128 * 0.1 = 12.8 -> 13, 128 - 13 = 115
        assert!(capacity.memory_gb > 200); // 256 - 32 - 10% reservation
    }

    #[test]
    fn test_ha_policy_application() {
        assert_eq!(SizingEngine::apply_ha_policy(4, &HaPolicy::None), 4);
        assert_eq!(SizingEngine::apply_ha_policy(4, &HaPolicy::NPlusOne), 5);
        assert_eq!(SizingEngine::apply_ha_policy(4, &HaPolicy::NPlusTwo), 6);
    }
}
