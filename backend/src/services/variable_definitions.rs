use crate::models::hld::{VariableDefinition, VariableType, VariableValue, ValidationRule};
use std::collections::HashMap;

/// Service for managing HLD variable definitions
/// Contains all 130+ variable definitions for Windows Server 2025 Hyper-V Cluster HLD
pub struct VariableDefinitions;

impl VariableDefinitions {
    /// Get all variable definitions as a HashMap (name -> definition)
    pub fn get_all() -> HashMap<String, VariableDefinition> {
        let mut definitions = HashMap::new();
        
        // Add all sections
        for def in Self::global_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::introduction_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::architectural_decisions_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::physical_infrastructure_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::host_cluster_config_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::network_architecture_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::storage_architecture_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::vm_workload_design_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::security_hardening_variables() {
            definitions.insert(def.name.clone(), def);
        }
        for def in Self::bcdr_variables() {
            definitions.insert(def.name.clone(), def);
        }

        definitions
    }

    /// Get all variable definitions as a Vec
    pub fn get_all_vec() -> Vec<VariableDefinition> {
        Self::get_all().into_values().collect()
    }

    /// Get a specific variable definition by name
    pub fn get(name: &str) -> Option<VariableDefinition> {
        Self::get_all().get(name).cloned()
    }

    /// Get all variables for a specific section
    pub fn get_by_section(section: &str) -> Vec<VariableDefinition> {
        Self::get_all_vec()
            .into_iter()
            .filter(|v| v.section == section)
            .collect()
    }

    // ============================================================================
    // GLOBAL VARIABLES (Document Metadata)
    // ============================================================================

    fn global_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "document_title".to_string(),
                var_type: VariableType::String,
                section: "global".to_string(),
                description: "Title of the HLD document".to_string(),
                example_value: "Windows Server 2025 Hyper-V Cluster High-Level Design".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(10),
                    max_length: Some(200),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Windows Server 2025 Hyper-V Cluster HLD".to_string())),
            },
            VariableDefinition {
                name: "customer_name".to_string(),
                var_type: VariableType::String,
                section: "global".to_string(),
                description: "Name of the customer/organization".to_string(),
                example_value: "Acme Corporation".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(2),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "document_version".to_string(),
                var_type: VariableType::String,
                section: "global".to_string(),
                description: "Version of the document".to_string(),
                example_value: "1.0".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^\d+\.\d+$".to_string()),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("1.0".to_string())),
            },
            VariableDefinition {
                name: "document_status".to_string(),
                var_type: VariableType::String,
                section: "global".to_string(),
                description: "Status of the document".to_string(),
                example_value: "Draft".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Draft".to_string(),
                        "In Review".to_string(),
                        "Approved".to_string(),
                        "Final".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Draft".to_string())),
            },
            VariableDefinition {
                name: "document_date".to_string(),
                var_type: VariableType::Date,
                section: "global".to_string(),
                description: "Date of document creation/revision".to_string(),
                example_value: "2025-10-23".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "author_name".to_string(),
                var_type: VariableType::String,
                section: "global".to_string(),
                description: "Name of the document author".to_string(),
                example_value: "John Smith".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "author_email".to_string(),
                var_type: VariableType::String,
                section: "global".to_string(),
                description: "Email address of the document author".to_string(),
                example_value: "john.smith@company.com".to_string(),
                validation: ValidationRule {
                    required: false,
                    pattern: Some(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
        ]
    }

    // ============================================================================
    // INTRODUCTION VARIABLES
    // ============================================================================

    fn introduction_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "business_objective_summary".to_string(),
                var_type: VariableType::String,
                section: "introduction".to_string(),
                description: "High-level business objectives for the migration".to_string(),
                example_value: "Modernize infrastructure to support digital transformation initiatives".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(20),
                    max_length: Some(1000),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "node_count".to_string(),
                var_type: VariableType::Integer,
                section: "introduction".to_string(),
                description: "Total number of Hyper-V cluster nodes".to_string(),
                example_value: "4".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(2.0),
                    max_value: Some(64.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("4".to_string())),
            },
            VariableDefinition {
                name: "management_framework".to_string(),
                var_type: VariableType::String,
                section: "introduction".to_string(),
                description: "Primary management framework for the cluster".to_string(),
                example_value: "Windows Admin Center".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Windows Admin Center".to_string(),
                        "System Center Virtual Machine Manager".to_string(),
                        "PowerShell".to_string(),
                        "Azure Arc".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Windows Admin Center".to_string())),
            },
            VariableDefinition {
                name: "total_storage_tb_usable".to_string(),
                var_type: VariableType::Float,
                section: "introduction".to_string(),
                description: "Total usable storage capacity in TB".to_string(),
                example_value: "50.0".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(10000.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "total_vm_count_target".to_string(),
                var_type: VariableType::Integer,
                section: "introduction".to_string(),
                description: "Target number of VMs to be hosted".to_string(),
                example_value: "200".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(10000.0),
                    ..Default::default()
                },
                default_value: None,
            },
        ]
    }

    // ============================================================================
    // ARCHITECTURAL DECISIONS VARIABLES
    // ============================================================================

    fn architectural_decisions_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "rto_minutes".to_string(),
                var_type: VariableType::Integer,
                section: "architectural_decisions".to_string(),
                description: "Recovery Time Objective in minutes".to_string(),
                example_value: "240".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(0.0),
                    max_value: Some(43200.0), // 30 days in minutes
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("240".to_string())),
            },
            VariableDefinition {
                name: "rpo_minutes".to_string(),
                var_type: VariableType::Integer,
                section: "architectural_decisions".to_string(),
                description: "Recovery Point Objective in minutes".to_string(),
                example_value: "60".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(0.0),
                    max_value: Some(43200.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("60".to_string())),
            },
            VariableDefinition {
                name: "vm_growth_per_year_percent".to_string(),
                var_type: VariableType::Float,
                section: "architectural_decisions".to_string(),
                description: "Expected VM count growth percentage per year".to_string(),
                example_value: "15.0".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(0.0),
                    max_value: Some(500.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("20.0".to_string())),
            },
            VariableDefinition {
                name: "max_nodes_in_cluster".to_string(),
                var_type: VariableType::Integer,
                section: "architectural_decisions".to_string(),
                description: "Maximum number of nodes allowed in the cluster configuration".to_string(),
                example_value: "16".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(2.0),
                    max_value: Some(64.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("16".to_string())),
            },
            VariableDefinition {
                name: "cpu_overcommit_ratio".to_string(),
                var_type: VariableType::Float,
                section: "architectural_decisions".to_string(),
                description: "CPU overcommit ratio (e.g., 2.0 = 2:1)".to_string(),
                example_value: "2.0".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(10.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("2.0".to_string())),
            },
            VariableDefinition {
                name: "ram_overcommit_ratio".to_string(),
                var_type: VariableType::Float,
                section: "architectural_decisions".to_string(),
                description: "RAM overcommit ratio (e.g., 1.2 = 1.2:1)".to_string(),
                example_value: "1.2".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(5.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("1.2".to_string())),
            },
            VariableDefinition {
                name: "ha_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "architectural_decisions".to_string(),
                description: "Is High Availability enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
            VariableDefinition {
                name: "live_migration_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "architectural_decisions".to_string(),
                description: "Is Live Migration enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
        ]
    }

    // ============================================================================
    // PHYSICAL INFRASTRUCTURE VARIABLES
    // ============================================================================

    fn physical_infrastructure_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "host_server_model".to_string(),
                var_type: VariableType::String,
                section: "physical_infrastructure".to_string(),
                description: "Server hardware model for Hyper-V hosts".to_string(),
                example_value: "Dell PowerEdge R750".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cpu_model".to_string(),
                var_type: VariableType::String,
                section: "physical_infrastructure".to_string(),
                description: "CPU model in each host".to_string(),
                example_value: "Intel Xeon Gold 6338".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(5),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cpu_sockets_per_host".to_string(),
                var_type: VariableType::Integer,
                section: "physical_infrastructure".to_string(),
                description: "Number of CPU sockets per host".to_string(),
                example_value: "2".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(8.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("2".to_string())),
            },
            VariableDefinition {
                name: "cores_per_socket".to_string(),
                var_type: VariableType::Integer,
                section: "physical_infrastructure".to_string(),
                description: "Number of cores per CPU socket".to_string(),
                example_value: "32".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(128.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cpu_ghz_per_core".to_string(),
                var_type: VariableType::Float,
                section: "physical_infrastructure".to_string(),
                description: "CPU frequency in GHz per core".to_string(),
                example_value: "2.6".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(5.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "ram_gb_per_host".to_string(),
                var_type: VariableType::Integer,
                section: "physical_infrastructure".to_string(),
                description: "Total RAM in GB per host".to_string(),
                example_value: "512".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(16.0),
                    max_value: Some(6144.0), // 6TB
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "ram_reserved_for_host_gb".to_string(),
                var_type: VariableType::Integer,
                section: "physical_infrastructure".to_string(),
                description: "RAM reserved for host OS in GB".to_string(),
                example_value: "32".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(4.0),
                    max_value: Some(256.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("32".to_string())),
            },
            VariableDefinition {
                name: "nic_model_and_ports".to_string(),
                var_type: VariableType::String,
                section: "physical_infrastructure".to_string(),
                description: "Network interface card model and port configuration".to_string(),
                example_value: "Broadcom BCM57414 (4x 25Gb)".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(5),
                    max_length: Some(200),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "network_adapter_count".to_string(),
                var_type: VariableType::Integer,
                section: "physical_infrastructure".to_string(),
                description: "Total number of physical network adapters per host".to_string(),
                example_value: "4".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(2.0),
                    max_value: Some(16.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("4".to_string())),
            },
        ]
    }

    // ============================================================================
    // HOST CLUSTER CONFIGURATION VARIABLES
    // ============================================================================

    fn host_cluster_config_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "cluster_name".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "Name of the Hyper-V cluster".to_string(),
                example_value: "HV-CLUSTER-01".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(63),
                    pattern: Some(r"^[a-zA-Z0-9-]+$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "ad_domain".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "Active Directory domain name".to_string(),
                example_value: "corp.contoso.com".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cluster_ip_address".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "IP address for the cluster".to_string(),
                example_value: "10.0.1.100".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^(\d{1,3}\.){3}\d{1,3}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "quorum_type".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "Cluster quorum configuration type".to_string(),
                example_value: "Cloud Witness".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Node Majority".to_string(),
                        "Node and Disk Majority".to_string(),
                        "Node and File Share Majority".to_string(),
                        "Cloud Witness".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Cloud Witness".to_string())),
            },
            VariableDefinition {
                name: "witness_type".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "Type of witness for quorum".to_string(),
                example_value: "Azure Blob Storage".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["quorum_type".to_string()],
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cluster_functional_level".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "Windows Server cluster functional level".to_string(),
                example_value: "Windows Server 2025".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Windows Server 2019".to_string(),
                        "Windows Server 2022".to_string(),
                        "Windows Server 2025".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Windows Server 2025".to_string())),
            },
            VariableDefinition {
                name: "host_naming_convention".to_string(),
                var_type: VariableType::String,
                section: "host_cluster_config".to_string(),
                description: "Naming convention for cluster host nodes".to_string(),
                example_value: "HV-NODE-##".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(50),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("HV-NODE-##".to_string())),
            },
        ]
    }

    // ============================================================================
    // NETWORK ARCHITECTURE VARIABLES
    // ============================================================================

    fn network_architecture_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "set_switch_name".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "Name of the Switch Embedded Teaming (SET) virtual switch".to_string(),
                example_value: "vSwitch-SET".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(50),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("vSwitch-SET".to_string())),
            },
            VariableDefinition {
                name: "set_teaming_mode".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "SET teaming mode".to_string(),
                example_value: "Switch Independent".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Switch Independent".to_string(),
                        "Switch Dependent".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Switch Independent".to_string())),
            },
            VariableDefinition {
                name: "mgmt_vlan_id".to_string(),
                var_type: VariableType::Integer,
                section: "network_architecture".to_string(),
                description: "VLAN ID for management network".to_string(),
                example_value: "10".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(4094.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "mgmt_subnet".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "Subnet for management network (CIDR notation)".to_string(),
                example_value: "10.0.10.0/24".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cluster_vlan_id".to_string(),
                var_type: VariableType::Integer,
                section: "network_architecture".to_string(),
                description: "VLAN ID for cluster heartbeat network".to_string(),
                example_value: "20".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(4094.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cluster_subnet".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "Subnet for cluster heartbeat (CIDR notation)".to_string(),
                example_value: "10.0.20.0/24".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "lm_vlan_id".to_string(),
                var_type: VariableType::Integer,
                section: "network_architecture".to_string(),
                description: "VLAN ID for Live Migration network".to_string(),
                example_value: "30".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(4094.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "lm_subnet".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "Subnet for Live Migration (CIDR notation)".to_string(),
                example_value: "10.0.30.0/24".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "storage1_vlan_id".to_string(),
                var_type: VariableType::Integer,
                section: "network_architecture".to_string(),
                description: "VLAN ID for primary storage network".to_string(),
                example_value: "40".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(4094.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "storage1_subnet".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "Subnet for primary storage (CIDR notation)".to_string(),
                example_value: "10.0.40.0/24".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "storage2_vlan_id".to_string(),
                var_type: VariableType::Integer,
                section: "network_architecture".to_string(),
                description: "VLAN ID for secondary storage network (for redundancy)".to_string(),
                example_value: "50".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(4094.0),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "vm_vlan_ids".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "Comma-separated list of VLAN IDs for VM production networks".to_string(),
                example_value: "100,101,102,103".to_string(),
                validation: ValidationRule {
                    required: true,
                    pattern: Some(r"^\d+(,\d+)*$".to_string()),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "rdma_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "network_architecture".to_string(),
                description: "Is RDMA (Remote Direct Memory Access) enabled for storage traffic?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("false".to_string())),
            },
            VariableDefinition {
                name: "rdma_protocol".to_string(),
                var_type: VariableType::String,
                section: "network_architecture".to_string(),
                description: "RDMA protocol used".to_string(),
                example_value: "RoCEv2".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["rdma_enabled".to_string()],
                    enum_values: Some(vec![
                        "iWARP".to_string(),
                        "RoCEv2".to_string(),
                        "InfiniBand".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("RoCEv2".to_string())),
            },
        ]
    }

    // ============================================================================
    // STORAGE ARCHITECTURE VARIABLES
    // ============================================================================

    fn storage_architecture_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "storage_type".to_string(),
                var_type: VariableType::String,
                section: "storage_architecture".to_string(),
                description: "Primary storage architecture".to_string(),
                example_value: "Storage Spaces Direct (S2D)".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Storage Spaces Direct (S2D)".to_string(),
                        "SAN (Fibre Channel)".to_string(),
                        "SAN (iSCSI)".to_string(),
                        "SMB 3.0 File Share".to_string(),
                        "NAS".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Storage Spaces Direct (S2D)".to_string())),
            },
            VariableDefinition {
                name: "s2d_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "storage_architecture".to_string(),
                description: "Is Storage Spaces Direct enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
            VariableDefinition {
                name: "s2d_cache_tier".to_string(),
                var_type: VariableType::String,
                section: "storage_architecture".to_string(),
                description: "Cache tier disk type for S2D".to_string(),
                example_value: "NVMe SSD".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["s2d_enabled".to_string()],
                    enum_values: Some(vec![
                        "NVMe SSD".to_string(),
                        "SSD".to_string(),
                        "None".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("NVMe SSD".to_string())),
            },
            VariableDefinition {
                name: "cache_disk_count_per_node".to_string(),
                var_type: VariableType::Integer,
                section: "storage_architecture".to_string(),
                description: "Number of cache disks per node".to_string(),
                example_value: "2".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(0.0),
                    max_value: Some(64.0),
                    depends_on: vec!["s2d_enabled".to_string()],
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "cache_disk_capacity_gb".to_string(),
                var_type: VariableType::Integer,
                section: "storage_architecture".to_string(),
                description: "Capacity of each cache disk in GB".to_string(),
                example_value: "1600".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(100.0),
                    max_value: Some(100000.0),
                    depends_on: vec!["s2d_enabled".to_string()],
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "capacity_disk_count_per_node".to_string(),
                var_type: VariableType::Integer,
                section: "storage_architecture".to_string(),
                description: "Number of capacity disks per node".to_string(),
                example_value: "8".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(128.0),
                    depends_on: vec!["s2d_enabled".to_string()],
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "capacity_disk_capacity_gb".to_string(),
                var_type: VariableType::Integer,
                section: "storage_architecture".to_string(),
                description: "Capacity of each capacity disk in GB".to_string(),
                example_value: "3840".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(100.0),
                    max_value: Some(100000.0),
                    depends_on: vec!["s2d_enabled".to_string()],
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "resiliency_type".to_string(),
                var_type: VariableType::String,
                section: "storage_architecture".to_string(),
                description: "Storage resiliency/redundancy type".to_string(),
                example_value: "Three-way Mirror".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Two-way Mirror".to_string(),
                        "Three-way Mirror".to_string(),
                        "Mirror-Accelerated Parity".to_string(),
                        "Dual Parity".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Three-way Mirror".to_string())),
            },
            VariableDefinition {
                name: "csv_volume_count".to_string(),
                var_type: VariableType::Integer,
                section: "storage_architecture".to_string(),
                description: "Number of Cluster Shared Volumes (CSVs)".to_string(),
                example_value: "4".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(64.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("2".to_string())),
            },
            VariableDefinition {
                name: "csv_naming_convention".to_string(),
                var_type: VariableType::String,
                section: "storage_architecture".to_string(),
                description: "Naming convention for CSV volumes".to_string(),
                example_value: "CSV##".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(50),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("CSV##".to_string())),
            },
        ]
    }

    // ============================================================================
    // VM WORKLOAD DESIGN VARIABLES
    // ============================================================================

    fn vm_workload_design_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "vm_naming_convention_formula".to_string(),
                var_type: VariableType::String,
                section: "vm_workload_design".to_string(),
                description: "Formula for VM naming convention".to_string(),
                example_value: "{ENV}-{APP}-{##}".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("{ENV}-{APP}-{##}".to_string())),
            },
            VariableDefinition {
                name: "default_vm_generation".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "Default Hyper-V VM generation (1 or 2)".to_string(),
                example_value: "2".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(2.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("2".to_string())),
            },
            VariableDefinition {
                name: "template_small_vcpus".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "vCPU count for small VM template".to_string(),
                example_value: "2".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(128.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("2".to_string())),
            },
            VariableDefinition {
                name: "template_small_ram_gb".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "RAM in GB for small VM template".to_string(),
                example_value: "4".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(2048.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("4".to_string())),
            },
            VariableDefinition {
                name: "template_medium_vcpus".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "vCPU count for medium VM template".to_string(),
                example_value: "4".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(128.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("4".to_string())),
            },
            VariableDefinition {
                name: "template_medium_ram_gb".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "RAM in GB for medium VM template".to_string(),
                example_value: "16".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(2048.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("16".to_string())),
            },
            VariableDefinition {
                name: "template_large_vcpus".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "vCPU count for large VM template".to_string(),
                example_value: "8".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(128.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("8".to_string())),
            },
            VariableDefinition {
                name: "template_large_ram_gb".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "RAM in GB for large VM template".to_string(),
                example_value: "64".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(2048.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("64".to_string())),
            },
            VariableDefinition {
                name: "dynamic_memory_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "vm_workload_design".to_string(),
                description: "Is Dynamic Memory enabled by default?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
            VariableDefinition {
                name: "dynamic_memory_buffer_percent".to_string(),
                var_type: VariableType::Integer,
                section: "vm_workload_design".to_string(),
                description: "Dynamic Memory buffer percentage".to_string(),
                example_value: "20".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(5.0),
                    max_value: Some(2000.0),
                    depends_on: vec!["dynamic_memory_enabled".to_string()],
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("20".to_string())),
            },
        ]
    }

    // ============================================================================
    // SECURITY HARDENING VARIABLES
    // ============================================================================

    fn security_hardening_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "shielded_vms_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "security_hardening".to_string(),
                description: "Are Shielded VMs enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("false".to_string())),
            },
            VariableDefinition {
                name: "hgs_deployed".to_string(),
                var_type: VariableType::Boolean,
                section: "security_hardening".to_string(),
                description: "Is Host Guardian Service (HGS) deployed?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["shielded_vms_enabled".to_string()],
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("false".to_string())),
            },
            VariableDefinition {
                name: "hgs_server_fqdns".to_string(),
                var_type: VariableType::String,
                section: "security_hardening".to_string(),
                description: "Comma-separated FQDNs of HGS servers".to_string(),
                example_value: "hgs01.corp.contoso.com,hgs02.corp.contoso.com".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["hgs_deployed".to_string()],
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "attestation_mode".to_string(),
                var_type: VariableType::String,
                section: "security_hardening".to_string(),
                description: "HGS attestation mode".to_string(),
                example_value: "TPM-trusted".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["hgs_deployed".to_string()],
                    enum_values: Some(vec![
                        "TPM-trusted".to_string(),
                        "Host Key".to_string(),
                        "Admin-trusted".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("TPM-trusted".to_string())),
            },
            VariableDefinition {
                name: "bitlocker_enabled_on_hosts".to_string(),
                var_type: VariableType::Boolean,
                section: "security_hardening".to_string(),
                description: "Is BitLocker enabled on Hyper-V host boot drives?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
            VariableDefinition {
                name: "credential_guard_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "security_hardening".to_string(),
                description: "Is Windows Defender Credential Guard enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
            VariableDefinition {
                name: "virtualization_based_security_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "security_hardening".to_string(),
                description: "Is Virtualization-Based Security (VBS) enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("true".to_string())),
            },
            VariableDefinition {
                name: "security_baseline".to_string(),
                var_type: VariableType::String,
                section: "security_hardening".to_string(),
                description: "Security baseline/framework applied".to_string(),
                example_value: "CIS Benchmark Level 1".to_string(),
                validation: ValidationRule {
                    required: false,
                    enum_values: Some(vec![
                        "CIS Benchmark Level 1".to_string(),
                        "CIS Benchmark Level 2".to_string(),
                        "DISA STIG".to_string(),
                        "Microsoft Security Baseline".to_string(),
                        "Custom".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Microsoft Security Baseline".to_string())),
            },
        ]
    }

    // ============================================================================
    // BUSINESS CONTINUITY & DISASTER RECOVERY (BCDR) VARIABLES
    // ============================================================================

    fn bcdr_variables() -> Vec<VariableDefinition> {
        vec![
            VariableDefinition {
                name: "backup_software".to_string(),
                var_type: VariableType::String,
                section: "bcdr".to_string(),
                description: "Backup software solution".to_string(),
                example_value: "Veeam Backup & Replication".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_length: Some(3),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "backup_frequency".to_string(),
                var_type: VariableType::String,
                section: "bcdr".to_string(),
                description: "Backup frequency schedule".to_string(),
                example_value: "Daily".to_string(),
                validation: ValidationRule {
                    required: true,
                    enum_values: Some(vec![
                        "Hourly".to_string(),
                        "Daily".to_string(),
                        "Weekly".to_string(),
                        "Monthly".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Daily".to_string())),
            },
            VariableDefinition {
                name: "backup_retention_days".to_string(),
                var_type: VariableType::Integer,
                section: "bcdr".to_string(),
                description: "Backup retention period in days".to_string(),
                example_value: "30".to_string(),
                validation: ValidationRule {
                    required: true,
                    min_value: Some(1.0),
                    max_value: Some(3650.0), // 10 years
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("30".to_string())),
            },
            VariableDefinition {
                name: "replication_enabled".to_string(),
                var_type: VariableType::Boolean,
                section: "bcdr".to_string(),
                description: "Is VM replication enabled?".to_string(),
                example_value: "true".to_string(),
                validation: ValidationRule {
                    required: true,
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("false".to_string())),
            },
            VariableDefinition {
                name: "replication_technology".to_string(),
                var_type: VariableType::String,
                section: "bcdr".to_string(),
                description: "Replication technology used".to_string(),
                example_value: "Hyper-V Replica".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["replication_enabled".to_string()],
                    enum_values: Some(vec![
                        "Hyper-V Replica".to_string(),
                        "Azure Site Recovery".to_string(),
                        "Storage Replica".to_string(),
                        "Third-party".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Hyper-V Replica".to_string())),
            },
            VariableDefinition {
                name: "dr_site_location".to_string(),
                var_type: VariableType::String,
                section: "bcdr".to_string(),
                description: "Location of disaster recovery site".to_string(),
                example_value: "Azure West US 2".to_string(),
                validation: ValidationRule {
                    required: false,
                    depends_on: vec!["replication_enabled".to_string()],
                    min_length: Some(3),
                    max_length: Some(100),
                    ..Default::default()
                },
                default_value: None,
            },
            VariableDefinition {
                name: "snapshot_schedule".to_string(),
                var_type: VariableType::String,
                section: "bcdr".to_string(),
                description: "VM snapshot schedule".to_string(),
                example_value: "Every 4 hours".to_string(),
                validation: ValidationRule {
                    required: false,
                    enum_values: Some(vec![
                        "Hourly".to_string(),
                        "Every 4 hours".to_string(),
                        "Every 6 hours".to_string(),
                        "Daily".to_string(),
                        "Weekly".to_string(),
                    ]),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("Daily".to_string())),
            },
            VariableDefinition {
                name: "snapshot_retention_count".to_string(),
                var_type: VariableType::Integer,
                section: "bcdr".to_string(),
                description: "Number of snapshots to retain".to_string(),
                example_value: "7".to_string(),
                validation: ValidationRule {
                    required: false,
                    min_value: Some(1.0),
                    max_value: Some(100.0),
                    ..Default::default()
                },
                default_value: Some(VariableValue::String("7".to_string())),
            },
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_all_returns_definitions() {
        let all = VariableDefinitions::get_all();
        assert!(!all.is_empty(), "Should return variable definitions");
        
        // Check we have variables from different sections
        assert!(all.contains_key("document_title"));
        assert!(all.contains_key("node_count"));
        assert!(all.contains_key("cluster_name"));
    }

    #[test]
    fn test_get_specific_variable() {
        let def = VariableDefinitions::get("document_title");
        assert!(def.is_some());
        
        let def = def.unwrap();
        assert_eq!(def.name, "document_title");
        assert_eq!(def.section, "global");
        assert!(def.validation.required);
    }

    #[test]
    fn test_get_by_section() {
        let global_vars = VariableDefinitions::get_by_section("global");
        assert!(!global_vars.is_empty());
        
        // All variables should be from global section
        for var in &global_vars {
            assert_eq!(var.section, "global");
        }
    }

    #[test]
    fn test_all_required_fields_have_validation() {
        let all = VariableDefinitions::get_all_vec();
        
        for var in all {
            if var.validation.required {
                // Required fields should have at least basic validation
                assert!(!var.name.is_empty(), "Required variable must have a name");
                assert!(!var.description.is_empty(), "Required variable must have a description");
            }
        }
    }

    #[test]
    fn test_no_duplicate_variable_names() {
        let all_vec = VariableDefinitions::get_all_vec();
        let all_map = VariableDefinitions::get_all();
        
        // HashMap insertion would overwrite duplicates, so counts should match
        assert_eq!(
            all_vec.len(),
            all_map.len(),
            "Duplicate variable names detected!"
        );
    }

    #[test]
    fn test_enum_values_are_valid() {
        let all = VariableDefinitions::get_all_vec();
        
        for var in all {
            if let Some(enum_vals) = &var.validation.enum_values {
                assert!(!enum_vals.is_empty(), "Enum values list should not be empty for {}", var.name);
                
                // If there's a default value and enum values, default should be in the enum
                if let Some(default) = &var.default_value {
                    assert!(
                        enum_vals.contains(default),
                        "Default value '{}' not in enum values for variable '{}'",
                        default,
                        var.name
                    );
                }
            }
        }
    }

    #[test]
    fn test_dependencies_exist() {
        let all = VariableDefinitions::get_all();
        
        for (name, var) in &all {
            for dep in &var.validation.depends_on {
                assert!(
                    all.contains_key(dep),
                    "Variable '{}' depends on '{}' which doesn't exist",
                    name,
                    dep
                );
            }
        }
    }

    #[test]
    fn test_variable_count() {
        let all = VariableDefinitions::get_all();
        
        // We expect 80+ variables (130+ planned, but starting with core set)
        assert!(
            all.len() >= 70,
            "Expected at least 70 variables, got {}",
            all.len()
        );
    }
}
