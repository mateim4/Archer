use crate::models::*;
use crate::Result;
use std::collections::HashMap;

/// Translation engine for VMware to Microsoft platform mapping
pub struct TranslationEngine;

impl TranslationEngine {
    /// Translate a VMware vSphere cluster to Microsoft platform
    pub fn translate_cluster(
        source_cluster: &Cluster,
        target_platform: TargetPlatform,
        sizing_result: &SizingResult,
        translation_rules: &TranslationRules,
    ) -> Result<TranslationResult> {
        // Build target cluster configuration
        let target_cluster_config = Self::build_target_cluster_config(
            source_cluster,
            &target_platform,
            sizing_result,
            translation_rules,
        )?;

        // Translate individual VMs
        let vm_translations = Self::translate_vms(
            &source_cluster.vms,
            &target_cluster_config,
            translation_rules,
        )?;

        // Translate network configuration
        let network_translations = Self::translate_networks(
            source_cluster,
            &target_cluster_config.network_config,
            translation_rules,
        )?;

        // Identify items requiring manual intervention
        let manual_intervention_required = Self::identify_manual_interventions(
            &source_cluster.vms,
            source_cluster,
        )?;

        Ok(TranslationResult {
            source_cluster: source_cluster.name.clone(),
            target_platform,
            target_cluster_config,
            vm_translations,
            network_translations,
            manual_intervention_required,
        })
    }

    /// Build target cluster configuration
    fn build_target_cluster_config(
        source_cluster: &Cluster,
        target_platform: &TargetPlatform,
        sizing_result: &SizingResult,
        translation_rules: &TranslationRules,
    ) -> Result<TargetClusterConfig> {
        let cluster_name = format!("{}-HV", source_cluster.name);

        // Create target hosts
        let hosts = Self::create_target_hosts(sizing_result)?;

        // Configure storage
        let storage_config = Self::configure_target_storage(
            source_cluster,
            target_platform,
            sizing_result,
            translation_rules,
        )?;

        // Configure networking
        let network_config = Self::configure_target_networking(
            source_cluster,
            target_platform,
            translation_rules,
        )?;

        // Configure HA
        let ha_config = Self::configure_target_ha(
            &cluster_name,
            sizing_result,
            translation_rules,
        )?;

        Ok(TargetClusterConfig {
            cluster_name,
            hosts,
            storage_config,
            network_config,
            ha_config,
        })
    }

    /// Create target host configurations
    fn create_target_hosts(sizing_result: &SizingResult) -> Result<Vec<TargetHost>> {
        let mut hosts = Vec::new();

        for i in 0..sizing_result.required_hosts {
            let host_name = format!("HV-Node-{:02}", i + 1);
            let assigned_vms = sizing_result.vm_placement
                .iter()
                .filter(|(_, host)| *host == &format!("Host-{:02}", i + 1))
                .map(|(vm, _)| vm.clone())
                .collect();

            hosts.push(TargetHost {
                name: host_name,
                hardware_profile: sizing_result.hardware_profile.clone(),
                assigned_vms,
            });
        }

        Ok(hosts)
    }

    /// Configure target storage
    fn configure_target_storage(
        source_cluster: &Cluster,
        target_platform: &TargetPlatform,
        sizing_result: &SizingResult,
        _translation_rules: &TranslationRules,
    ) -> Result<StorageConfig> {
        let storage_type = match target_platform {
            TargetPlatform::AzureLocal => StorageType::StorageSpacesDirect,
            TargetPlatform::HyperVCluster => {
                // Could be S2D or external SAN based on source config
                StorageType::StorageSpacesDirect
            }
        };

        // Calculate total storage requirements
        let total_consumed_storage = source_cluster.metrics.consumed_storage_gb;
        let storage_overhead = 1.3; // 30% overhead for resiliency and growth
        let total_capacity = total_consumed_storage * storage_overhead;

        // Determine resiliency type based on host count
        let resiliency_type = if sizing_result.required_hosts >= 4 {
            ResiliencyType::TwoWayMirror // Can use parity with 4+ nodes
        } else {
            ResiliencyType::TwoWayMirror
        };

        // Calculate usable capacity based on resiliency
        let usable_capacity = match resiliency_type {
            ResiliencyType::TwoWayMirror => total_capacity * 0.5,
            ResiliencyType::ThreeWayMirror => total_capacity * 0.33,
            ResiliencyType::DualParity => total_capacity * 0.67,
            ResiliencyType::MirrorAcceleratedParity => total_capacity * 0.6,
        };

        // Create CSV volumes
        let csv_volumes = vec![
            CsvVolume {
                name: "CSV-VMs".to_string(),
                size_gb: usable_capacity * 0.8, // 80% for VMs
                file_system: "ReFS".to_string(),
                purpose: "Virtual Machine Storage".to_string(),
            },
            CsvVolume {
                name: "CSV-Infrastructure".to_string(),
                size_gb: usable_capacity * 0.2, // 20% for infrastructure
                file_system: "ReFS".to_string(),
                purpose: "Infrastructure and Backup".to_string(),
            },
        ];

        Ok(StorageConfig {
            storage_type,
            total_capacity_gb: total_capacity,
            usable_capacity_gb: usable_capacity,
            resiliency_type,
            csv_volumes,
        })
    }

    /// Configure target networking
    fn configure_target_networking(
        source_cluster: &Cluster,
        target_platform: &TargetPlatform,
        translation_rules: &TranslationRules,
    ) -> Result<NetworkConfig> {
        // Create converged virtual switch for Azure Local / modern Hyper-V
        let virtual_switches = vec![
            VirtualSwitch {
                name: "vSwitch-Converged".to_string(),
                switch_type: SwitchType::External,
                physical_adapters: vec!["NIC1".to_string(), "NIC2".to_string()],
                enable_sr_iov: matches!(target_platform, TargetPlatform::AzureLocal),
                enable_rdma: matches!(target_platform, TargetPlatform::AzureLocal),
            }
        ];

        // Create logical networks based on source port groups
        let logical_networks = Self::create_logical_networks(source_cluster, translation_rules)?;

        // Configure NIC teaming
        let teaming_config = TeamingConfig {
            teaming_mode: TeamingMode::SwitchEmbeddedTeaming,
            load_balancing_algorithm: LoadBalancingAlgorithm::Dynamic,
            failover_mode: FailoverMode::Active,
        };

        Ok(NetworkConfig {
            virtual_switches,
            logical_networks,
            teaming_config,
        })
    }

    /// Create logical networks from source port groups
    fn create_logical_networks(
        source_cluster: &Cluster,
        translation_rules: &TranslationRules,
    ) -> Result<Vec<LogicalNetwork>> {
        let mut logical_networks = Vec::new();
        let mut seen_port_groups = std::collections::HashSet::new();

        // Standard infrastructure networks
        logical_networks.extend(vec![
            LogicalNetwork {
                name: "Management".to_string(),
                vlan_id: Some(100),
                subnet: Some("192.168.100.0/24".to_string()),
                purpose: NetworkPurpose::Management,
            },
            LogicalNetwork {
                name: "Live-Migration".to_string(),
                vlan_id: Some(200),
                subnet: Some("192.168.200.0/24".to_string()),
                purpose: NetworkPurpose::LiveMigration,
            },
            LogicalNetwork {
                name: "Storage".to_string(),
                vlan_id: Some(300),
                subnet: Some("192.168.300.0/24".to_string()),
                purpose: NetworkPurpose::Storage,
            },
            LogicalNetwork {
                name: "Heartbeat".to_string(),
                vlan_id: Some(400),
                subnet: Some("192.168.400.0/24".to_string()),
                purpose: NetworkPurpose::Heartbeat,
            },
        ]);

        // Extract unique port groups from VMs
        for vm in &source_cluster.vms {
            for nic in &vm.nics {
                if seen_port_groups.insert(nic.port_group_name.clone()) {
                    // Try to extract VLAN ID from port group name
                    let vlan_id = Self::extract_vlan_from_port_group_name(
                        &nic.port_group_name,
                        translation_rules,
                    );

                    logical_networks.push(LogicalNetwork {
                        name: format!("VM-Network-{}", nic.port_group_name),
                        vlan_id,
                        subnet: None, // Would need additional data to determine
                        purpose: NetworkPurpose::VmTraffic,
                    });
                }
            }
        }

        Ok(logical_networks)
    }

    /// Extract VLAN ID from port group name using patterns
    fn extract_vlan_from_port_group_name(
        port_group_name: &str,
        translation_rules: &TranslationRules,
    ) -> Option<u16> {
        // Check translation rules first
        if let Some(vlan_id) = translation_rules.port_group_vlan_mapping.get(port_group_name) {
            return Some(*vlan_id);
        }

        // Try to extract from common naming patterns
        use regex::Regex;
        
        // Pattern: "VLAN_123" or "VLAN123"
        if let Ok(re) = Regex::new(r"VLAN[_-]?(\d+)") {
            if let Some(captures) = re.captures(port_group_name) {
                if let Some(vlan_match) = captures.get(1) {
                    if let Ok(vlan_id) = vlan_match.as_str().parse::<u16>() {
                        return Some(vlan_id);
                    }
                }
            }
        }

        // Pattern: "Production_101" or "Dev-202"
        if let Ok(re) = Regex::new(r"[A-Za-z]+[_-](\d+)$") {
            if let Some(captures) = re.captures(port_group_name) {
                if let Some(vlan_match) = captures.get(1) {
                    if let Ok(vlan_id) = vlan_match.as_str().parse::<u16>() {
                        if vlan_id <= 4094 { // Valid VLAN range
                            return Some(vlan_id);
                        }
                    }
                }
            }
        }

        None
    }

    /// Configure HA for target cluster
    fn configure_target_ha(
        cluster_name: &str,
        sizing_result: &SizingResult,
        _translation_rules: &TranslationRules,
    ) -> Result<HaConfig> {
        // Map sizing HA policy to cluster HA policy
        let policy = match sizing_result.utilization_metrics.n_plus_x_compliance {
            true => HaPolicy::NPlusOne, // Assume N+1 if compliant
            false => HaPolicy::None,
        };

        let heartbeat_networks = vec![
            "Management".to_string(),
            "Heartbeat".to_string(),
        ];

        // Determine quorum configuration based on node count
        let (quorum_type, witness_config) = if sizing_result.required_hosts % 2 == 0 {
            // Even number of nodes - need a witness
            (
                QuorumType::NodeAndCloudMajority,
                Some(WitnessConfig {
                    witness_type: WitnessType::Cloud,
                    path_or_url: format!("https://{}.blob.core.windows.net/witness", cluster_name.to_lowercase()),
                    credentials: Some("cloud-witness-key".to_string()),
                }),
            )
        } else {
            // Odd number of nodes - node majority
            (QuorumType::NodeMajority, None)
        };

        Ok(HaConfig {
            policy,
            heartbeat_networks,
            quorum_config: QuorumConfig {
                quorum_type,
                witness_config,
            },
        })
    }

    /// Translate individual VMs
    fn translate_vms(
        source_vms: &[VirtualMachine],
        target_config: &TargetClusterConfig,
        translation_rules: &TranslationRules,
    ) -> Result<Vec<VmTranslation>> {
        let mut translations = Vec::new();

        for vm in source_vms {
            // Skip templates and VMs requiring manual intervention
            if vm.is_template || vm.special_flags.has_rdm || vm.special_flags.ft_enabled {
                continue;
            }

            let translation = Self::translate_single_vm(vm, target_config, translation_rules)?;
            translations.push(translation);
        }

        Ok(translations)
    }

    /// Translate a single VM
    fn translate_single_vm(
        source_vm: &VirtualMachine,
        target_config: &TargetClusterConfig,
        translation_rules: &TranslationRules,
    ) -> Result<VmTranslation> {
        // Find target host assignment
        let target_host = target_config.hosts
            .iter()
            .find(|host| host.assigned_vms.contains(&source_vm.name))
            .map(|host| host.name.clone())
            .unwrap_or_else(|| target_config.hosts[0].name.clone());

        // Translate disks
        let disk_translations = Self::translate_vm_disks(&source_vm.disks, target_config)?;

        // Translate network adapters
        let network_translations = Self::translate_vm_networks(&source_vm.nics, target_config, translation_rules)?;

        // Generate migration notes
        let migration_notes = Self::generate_vm_migration_notes(source_vm);

        Ok(VmTranslation {
            source_vm_name: source_vm.name.clone(),
            target_vm_name: source_vm.name.clone(), // Keep same name unless conflict
            target_host,
            target_vcpu: source_vm.num_vcpu,
            target_memory_gb: source_vm.memory_gb,
            disk_translations,
            network_translations,
            migration_notes,
        })
    }

    /// Translate VM disks
    fn translate_vm_disks(
        source_disks: &[VirtualDisk],
        target_config: &TargetClusterConfig,
    ) -> Result<Vec<DiskTranslation>> {
        let mut translations = Vec::new();
        let primary_csv = &target_config.storage_config.csv_volumes[0];

        for disk in source_disks {
            if disk.is_rdm {
                continue; // Skip RDMs - they need manual handling
            }

            let target_provisioning = match disk.provisioning_type {
                ProvisioningType::Thin => TargetProvisioning::Dynamic,
                ProvisioningType::Thick | ProvisioningType::ThickEagerZeroed => TargetProvisioning::Fixed,
                ProvisioningType::Unknown => TargetProvisioning::Dynamic,
            };

            translations.push(DiskTranslation {
                source_disk: disk.disk_label.clone(),
                target_disk_format: DiskFormat::Vhdx,
                target_size_gb: disk.consumed_in_guest_gb, // Use actual consumed space
                target_provisioning,
                csv_volume: primary_csv.name.clone(),
            });
        }

        Ok(translations)
    }

    /// Translate VM network adapters
    fn translate_vm_networks(
        source_nics: &[VirtualNic],
        target_config: &TargetClusterConfig,
        translation_rules: &TranslationRules,
    ) -> Result<Vec<VmNetworkTranslation>> {
        let mut translations = Vec::new();
        let primary_vswitch = &target_config.network_config.virtual_switches[0];

        for nic in source_nics {
            // Find corresponding logical network
            let target_vlan_id = target_config.network_config.logical_networks
                .iter()
                .find(|ln| ln.name.contains(&nic.port_group_name) || 
                           translation_rules.port_group_vlan_mapping.contains_key(&nic.port_group_name))
                .and_then(|ln| ln.vlan_id)
                .or_else(|| Self::extract_vlan_from_port_group_name(&nic.port_group_name, translation_rules));

            translations.push(VmNetworkTranslation {
                source_port_group: nic.port_group_name.clone(),
                target_virtual_switch: primary_vswitch.name.clone(),
                target_vlan_id,
                adapter_name: "Network Adapter".to_string(),
            });
        }

        Ok(translations)
    }

    /// Generate migration notes for a VM
    fn generate_vm_migration_notes(source_vm: &VirtualMachine) -> Vec<String> {
        let mut notes = Vec::new();

        // VMware Tools removal
        notes.push("Remove VMware Tools before conversion".to_string());
        notes.push("Install Hyper-V Integration Services after conversion".to_string());

        // Power state handling
        if source_vm.power_state != PowerState::PoweredOff {
            notes.push("Power off VM before migration".to_string());
        }

        // Special considerations
        if source_vm.special_flags.is_critical_workload {
            notes.push("Critical workload - schedule migration during maintenance window".to_string());
        }

        if source_vm.num_vcpu > 8 {
            notes.push("High vCPU count - verify licensing requirements".to_string());
        }

        if source_vm.memory_gb > 64 {
            notes.push("High memory allocation - verify target host capacity".to_string());
        }

        notes
    }

    /// Translate network configurations
    fn translate_networks(
        source_cluster: &Cluster,
        target_network_config: &NetworkConfig,
        translation_rules: &TranslationRules,
    ) -> Result<Vec<NetworkTranslation>> {
        let mut translations = Vec::new();
        let mut seen_port_groups = std::collections::HashSet::new();

        // Extract unique port groups from VMs
        for vm in &source_cluster.vms {
            for nic in &vm.nics {
                if seen_port_groups.insert(nic.port_group_name.clone()) {
                    let affected_vms: Vec<String> = source_cluster.vms
                        .iter()
                        .filter(|v| v.nics.iter().any(|n| n.port_group_name == nic.port_group_name))
                        .map(|v| v.name.clone())
                        .collect();

                    let source_vlan_id = Self::extract_vlan_from_port_group_name(
                        &nic.port_group_name,
                        translation_rules,
                    );

                    let target_logical_network = target_network_config.logical_networks
                        .iter()
                        .find(|ln| ln.name.contains(&nic.port_group_name))
                        .map(|ln| ln.name.clone())
                        .unwrap_or_else(|| format!("VM-Network-{}", nic.port_group_name));

                    let target_vlan_id = target_network_config.logical_networks
                        .iter()
                        .find(|ln| ln.name == target_logical_network)
                        .and_then(|ln| ln.vlan_id);

                    translations.push(NetworkTranslation {
                        source_port_group: nic.port_group_name.clone(),
                        source_vlan_id,
                        target_logical_network,
                        target_vlan_id,
                        affected_vms,
                    });
                }
            }
        }

        Ok(translations)
    }

    /// Identify items requiring manual intervention
    fn identify_manual_interventions(
        vms: &[VirtualMachine],
        _source_cluster: &Cluster,
    ) -> Result<Vec<ManualInterventionItem>> {
        let mut interventions = Vec::new();

        for vm in vms {
            // RDM VMs
            if vm.special_flags.has_rdm {
                interventions.push(ManualInterventionItem {
                    category: InterventionCategory::RawDeviceMapping,
                    description: format!("VM '{}' uses Raw Device Mappings that cannot be automatically converted", vm.name),
                    affected_vm: Some(vm.name.clone()),
                    recommendation: "Migrate RDM data to VHDX files or reconfigure application to use iSCSI".to_string(),
                    priority: Priority::High,
                });
            }

            // Fault Tolerance VMs
            if vm.special_flags.ft_enabled {
                interventions.push(ManualInterventionItem {
                    category: InterventionCategory::FaultTolerance,
                    description: format!("VM '{}' has Fault Tolerance enabled", vm.name),
                    affected_vm: Some(vm.name.clone()),
                    recommendation: "Disable FT and implement application-level HA if needed".to_string(),
                    priority: Priority::Medium,
                });
            }

            // Legacy OS detection (simplified)
            if let Some(os) = &vm.guest_os {
                if os.contains("2003") || os.contains("XP") || os.contains("Vista") {
                    interventions.push(ManualInterventionItem {
                        category: InterventionCategory::LegacyOs,
                        description: format!("VM '{}' runs legacy OS: {}", vm.name, os),
                        affected_vm: Some(vm.name.clone()),
                        recommendation: "Consider OS upgrade or special migration planning".to_string(),
                        priority: Priority::Medium,
                    });
                }
            }

            // Performance-critical workloads
            if vm.special_flags.is_critical_workload {
                interventions.push(ManualInterventionItem {
                    category: InterventionCategory::PerformanceCritical,
                    description: format!("VM '{}' is marked as performance-critical", vm.name),
                    affected_vm: Some(vm.name.clone()),
                    recommendation: "Plan detailed performance testing and validation".to_string(),
                    priority: Priority::High,
                });
            }
        }

        Ok(interventions)
    }
}

// Translation rules and configuration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TranslationRules {
    pub port_group_vlan_mapping: HashMap<String, u16>,
    pub storage_mapping_rules: StorageMappingRules,
    pub network_naming_patterns: NetworkNamingPatterns,
    pub vm_sizing_rules: VmSizingRules,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StorageMappingRules {
    pub prefer_dynamic_disks: bool,
    pub storage_overhead_percent: f64,
    pub csv_naming_pattern: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NetworkNamingPatterns {
    pub management_network_pattern: String,
    pub vm_network_prefix: String,
    pub vlan_extraction_patterns: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VmSizingRules {
    pub max_vcpu_per_vm: u32,
    pub max_memory_gb_per_vm: u32,
    pub memory_alignment_gb: u32,
}

impl Default for TranslationRules {
    fn default() -> Self {
        Self {
            port_group_vlan_mapping: HashMap::new(),
            storage_mapping_rules: StorageMappingRules {
                prefer_dynamic_disks: true,
                storage_overhead_percent: 30.0,
                csv_naming_pattern: "CSV-{purpose}".to_string(),
            },
            network_naming_patterns: NetworkNamingPatterns {
                management_network_pattern: "Management".to_string(),
                vm_network_prefix: "VM-Network".to_string(),
                vlan_extraction_patterns: vec![
                    r"VLAN[_-]?(\d+)".to_string(),
                    r"[A-Za-z]+[_-](\d+)$".to_string(),
                ],
            },
            vm_sizing_rules: VmSizingRules {
                max_vcpu_per_vm: 64,
                max_memory_gb_per_vm: 512,
                memory_alignment_gb: 4,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vlan_extraction_from_port_group() {
        let translation_rules = TranslationRules::default();
        
        assert_eq!(
            TranslationEngine::extract_vlan_from_port_group_name("VLAN_100", &translation_rules),
            Some(100)
        );
        
        assert_eq!(
            TranslationEngine::extract_vlan_from_port_group_name("Production-200", &translation_rules),
            Some(200)
        );
        
        assert_eq!(
            TranslationEngine::extract_vlan_from_port_group_name("Management", &translation_rules),
            None
        );
    }

    #[test]
    fn test_translation_rules_default() {
        let rules = TranslationRules::default();
        assert!(rules.storage_mapping_rules.prefer_dynamic_disks);
        assert_eq!(rules.storage_mapping_rules.storage_overhead_percent, 30.0);
    }
}
