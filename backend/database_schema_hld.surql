-- ============================================================================
-- LCMDesigner - HLD (High-Level Design) Generation System Database Schema
-- ============================================================================
-- Purpose: Store HLD templates, sections, project configurations, and variables
-- Version: 1.0
-- Date: October 23, 2025
-- ============================================================================

-- Remove existing tables if they exist (for development)
REMOVE TABLE IF EXISTS hld_variables;
REMOVE TABLE IF EXISTS hld_projects;
REMOVE TABLE IF EXISTS hld_sections;
REMOVE TABLE IF EXISTS hld_templates;

-- ============================================================================
-- TABLE: hld_templates
-- Purpose: Store HLD document templates (e.g., "Windows Server 2025 Hyper-V Cluster HLD")
-- ============================================================================
DEFINE TABLE hld_templates SCHEMAFULL;

DEFINE FIELD name ON hld_templates TYPE string
    ASSERT $value != NONE AND string::len($value) > 0;

DEFINE FIELD description ON hld_templates TYPE string;

DEFINE FIELD version ON hld_templates TYPE string
    ASSERT $value != NONE;

DEFINE FIELD is_active ON hld_templates TYPE bool
    VALUE $value OR true;

DEFINE FIELD metadata ON hld_templates TYPE option<object>;

DEFINE FIELD created_at ON hld_templates TYPE datetime
    VALUE $value OR time::now();

DEFINE FIELD updated_at ON hld_templates TYPE datetime
    VALUE time::now();

-- Index for active templates
DEFINE INDEX idx_hld_templates_active ON hld_templates FIELDS is_active;

-- ============================================================================
-- TABLE: hld_sections
-- Purpose: Define reusable sections for HLD documents
-- ============================================================================
DEFINE TABLE hld_sections SCHEMAFULL;

DEFINE FIELD template_id ON hld_sections TYPE record<hld_templates>
    ASSERT $value != NONE;

DEFINE FIELD section_id ON hld_sections TYPE string
    ASSERT $value != NONE AND string::len($value) > 0;

DEFINE FIELD name ON hld_sections TYPE string
    ASSERT $value != NONE;

DEFINE FIELD description ON hld_sections TYPE string;

DEFINE FIELD order ON hld_sections TYPE int
    ASSERT $value >= 0;

DEFINE FIELD content_template ON hld_sections TYPE string
    ASSERT $value != NONE;

DEFINE FIELD required ON hld_sections TYPE bool
    VALUE $value OR false;

DEFINE FIELD depends_on ON hld_sections TYPE array
    VALUE $value OR [];

DEFINE FIELD repeatable ON hld_sections TYPE bool
    VALUE $value OR false;

DEFINE FIELD metadata ON hld_sections TYPE option<object>;

DEFINE FIELD created_at ON hld_sections TYPE datetime
    VALUE $value OR time::now();

-- Index for template sections
DEFINE INDEX idx_hld_sections_template ON hld_sections FIELDS template_id;

-- Unique constraint on section_id within a template
DEFINE INDEX idx_hld_sections_unique ON hld_sections FIELDS template_id, section_id UNIQUE;

-- ============================================================================
-- TABLE: hld_projects
-- Purpose: Link projects to HLD templates and track enabled sections
-- ============================================================================
DEFINE TABLE hld_projects SCHEMAFULL;

DEFINE FIELD project_id ON hld_projects TYPE record<projects>
    ASSERT $value != NONE;

DEFINE FIELD template_id ON hld_projects TYPE record<hld_templates>
    ASSERT $value != NONE;

DEFINE FIELD template_version ON hld_projects TYPE string
    ASSERT $value != NONE;

DEFINE FIELD enabled_sections ON hld_projects TYPE array
    VALUE $value OR [];

DEFINE FIELD section_order ON hld_projects TYPE array
    VALUE $value OR [];

DEFINE FIELD metadata ON hld_projects TYPE option<object>;

DEFINE FIELD created_at ON hld_projects TYPE datetime
    VALUE $value OR time::now();

DEFINE FIELD updated_at ON hld_projects TYPE datetime
    VALUE time::now();

-- Unique constraint: one HLD per project
DEFINE INDEX idx_hld_projects_project ON hld_projects FIELDS project_id UNIQUE;

-- Index for template lookup
DEFINE INDEX idx_hld_projects_template ON hld_projects FIELDS template_id;

-- ============================================================================
-- TABLE: hld_variables
-- Purpose: Store variable values for each HLD project
-- ============================================================================
DEFINE TABLE hld_variables SCHEMAFULL;

DEFINE FIELD hld_project_id ON hld_variables TYPE record<hld_projects>
    ASSERT $value != NONE;

DEFINE FIELD variable_name ON hld_variables TYPE string
    ASSERT $value != NONE AND string::len($value) > 0;

DEFINE FIELD variable_value ON hld_variables TYPE option<string | int | float | bool | datetime | array | object>;

DEFINE FIELD variable_type ON hld_variables TYPE string
    ASSERT $value INSIDE ["string", "integer", "float", "boolean", "date", "array", "object"];

DEFINE FIELD section ON hld_variables TYPE string
    ASSERT $value != NONE;

DEFINE FIELD source ON hld_variables TYPE string
    ASSERT $value INSIDE ["manual", "rvtools", "wizard", "default"]
    VALUE $value OR "manual";

DEFINE FIELD confidence ON hld_variables TYPE option<string>
    ASSERT $value == NONE OR $value INSIDE ["none", "low", "medium", "high"];

DEFINE FIELD error_message ON hld_variables TYPE option<string>;

DEFINE FIELD updated_at ON hld_variables TYPE datetime
    VALUE time::now();

-- Unique constraint: one value per variable per project
DEFINE INDEX idx_hld_variables_unique ON hld_variables FIELDS hld_project_id, variable_name UNIQUE;

-- Index for section-based queries
DEFINE INDEX idx_hld_variables_section ON hld_variables FIELDS hld_project_id, section;

-- Index for source-based queries (find all RVTools-populated variables)
DEFINE INDEX idx_hld_variables_source ON hld_variables FIELDS hld_project_id, source;

-- ============================================================================
-- INITIAL DATA: Default HLD Template
-- ============================================================================

-- Create the Windows Server 2025 Hyper-V Cluster HLD Template
LET $template_id = CREATE hld_templates CONTENT {
    name: "Windows Server 2025 Hyper-V Cluster HLD",
    description: "Comprehensive High-Level Design template for Microsoft Windows Server 2025 Hyper-V failover clusters",
    version: "1.0",
    is_active: true,
    metadata: {
        source: "Gemini AI Research",
        total_variables: 130,
        target_platform: "Microsoft Hyper-V 2025"
    }
};

-- Create HLD Sections
CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "global",
    name: "Global Document Variables",
    description: "Document-level metadata and control information",
    order: 0,
    content_template: "# Document Control\n\n**Title**: {{document_title}}\n**Customer**: {{customer_name}}\n**Version**: {{document_version}}\n**Status**: {{document_status}}\n**Author**: {{document_author}}\n**Approval Date**: {{document_approval_date}}",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "introduction",
    name: "Introduction and Executive Summary",
    description: "High-level overview of the project, business drivers, and proposed solution",
    order: 1,
    content_template: "# 1.0 Introduction and Executive Summary\n\n## 1.1 Document Purpose\nThis High-Level Design (HLD) document describes the conceptual and technical architecture for a new Microsoft Windows Server 2025 Hyper-V failover cluster for {{customer_name}}.\n\n## 1.2 Business Requirements\n{{business_objective_summary}}\n\n## 1.3 Solution Overview\nThe proposed solution is a {{node_count}}-node Microsoft Windows Server 2025 Hyper-V failover cluster managed via {{management_framework}}.",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "architectural_decisions",
    name: "Core Architectural Decisions",
    description: "Foundational design decisions including availability, scalability, and management framework",
    order: 2,
    content_template: "# 2.0 Core Architectural Decisions\n\n## 2.1 High-Availability and Resiliency Targets\n- **RTO**: {{rto_minutes}} minutes\n- **RPO**: {{rpo_minutes}} minutes\n\n## 2.2 Scalability Projections\n- **VM Growth**: {{vm_growth_per_year_percent}}% annually\n- **Storage Growth**: {{storage_growth_per_year_percent}}% annually\n- **Max Nodes**: {{max_nodes_in_cluster}}\n\n## 2.3 Management Framework\n{{management_framework}}",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "physical_infrastructure",
    name: "Physical Infrastructure Design",
    description: "Server specifications, BIOS configuration, and network topology",
    order: 3,
    content_template: "# 3.0 Physical Infrastructure Design\n\n## 3.1 Host Server Specification\n- **Model**: {{host_server_model}}\n- **CPU**: {{cpu_socket_count}}x {{cpu_model}} ({{cpu_cores}} cores, {{cpu_base_clock_ghz}} GHz)\n- **RAM**: {{ram_gb}} GB ({{ram_module_count}}x {{ram_model}}, {{ram_speed_mhz}} MHz)\n- **Network**: {{nic_model_and_ports}}\n- **Boot Device**: 2x {{boot_device_model}} ({{boot_device_capacity_gb}} GB, RAID-1)\n\n## 3.2 Physical Network Topology\n- **Switches**: {{top_of_rack_switch_model}}\n- **Redundancy**: {{switch_redundancy_model}}\n- **Uplinks**: {{uplink_speed_gbps}} Gbps",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "host_cluster_config",
    name: "Host OS and Failover Cluster Configuration",
    description: "Operating system installation and cluster foundation",
    order: 4,
    content_template: "# 4.0 Host OS and Failover Cluster Configuration\n\n## 4.1 Host Operating System\n- **OS**: {{host_os_version}}\n- **Installation Type**: {{os_installation_type}}\n\n## 4.2 Cluster Foundation\n- **Cluster Name**: {{cluster_name}}\n- **Domain**: {{ad_domain}}\n- **Cluster IP**: {{cluster_ip_address}}\n- **Quorum**: {{quorum_type}}\n- **Witness**: {{witness_type}} ({{witness_path_or_azure_account}})",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "network_architecture",
    name: "Network Architecture",
    description: "Converged networking, virtual switch configuration, and VLAN scheme",
    order: 5,
    content_template: "# 5.0 Network Architecture\n\n## 5.1 Network Configuration Model\n{{network_config_model}}\n\n## 5.2 Converged Network Design\n- **vSwitch**: {{set_switch_name}}\n- **Physical NICs**: {{physical_nics_in_team}}\n\n### Network Configuration\n| Purpose | VLAN | Subnet | QoS Weight | RDMA |\n|---------|------|--------|------------|------|\n| Management | {{mgmt_vlan_id}} | {{mgmt_ip_subnet}} | {{mgmt_qos_weight}} | No |\n| Cluster | {{cluster_vlan_id}} | {{cluster_ip_subnet}} | {{cluster_qos_weight}} | Yes |\n| Live Migration | {{lm_vlan_id}} | {{lm_ip_subnet}} | {{lm_qos_weight}} | Yes |\n| Storage 1 | {{storage1_vlan_id}} | {{storage1_ip_subnet}} | {{storage1_qos_weight}} | Yes |\n| Storage 2 | {{storage2_vlan_id}} | {{storage2_ip_subnet}} | {{storage2_qos_weight}} | Yes |",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "storage_architecture",
    name: "Storage Architecture",
    description: "SAN or Storage Spaces Direct configuration",
    order: 6,
    content_template: "# 6.0 Storage Architecture\n\n**Storage Type**: {{storage_type_friendly_name}}\n\n## Storage Configuration\n{{#if storage_type == 'S2D'}}\n### Storage Spaces Direct\n- **Model**: {{s2d_model}}\n- **Cache Tier**: {{cache_disk_count}}x {{cache_disk_capacity_tb}} TB NVMe\n- **Capacity Tier**: {{capacity_disk_count}}x {{capacity_disk_capacity_tb}} TB SSD/HDD\n- **Total Usable**: {{total_storage_tb_usable}} TB\n{{else}}\n### SAN Configuration\n- **Protocol**: {{san_protocol}}\n- **HBA Ports**: {{hba_port_count}}\n- **MPIO Policy**: {{mpio_policy}}\n{{/if}}",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "vm_workload_design",
    name: "Virtual Machine and Workload Design",
    description: "VM templates, naming conventions, and default generation",
    order: 7,
    content_template: "# 7.0 Virtual Machine and Workload Design\n\n## 7.1 Standard VM Templates\n| Size | vCPUs | RAM (GB) | OS Disk (GB) |\n|------|-------|----------|---------------|\n| Small | {{template_small_vcpus}} | {{template_small_ram_gb}} | {{template_small_os_disk_gb}} |\n| Medium | {{template_medium_vcpus}} | {{template_medium_ram_gb}} | {{template_medium_os_disk_gb}} |\n| Large | {{template_large_vcpus}} | {{template_large_ram_gb}} | {{template_large_os_disk_gb}} |\n\n## 7.2 VM Naming Convention\n{{vm_naming_convention_formula}}\n\n## 7.3 Default VM Generation\nGeneration {{default_vm_generation}}",
    required: true,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "security_hardening",
    name: "Security and Hardening",
    description: "Host security measures and Shielded VM configuration",
    order: 8,
    content_template: "# 8.0 Security and Hardening\n\n## 8.1 Host Security\n- Server Core Installation\n- BitLocker Drive Encryption\n- Secure Boot Enabled\n- Antivirus Exclusions\n- Least Privilege Access\n\n## 8.2 Shielded VM Configuration\n{{#if shielded_vms_enabled}}\n- **HGS Servers**: {{hgs_server_fqdns}}\n- **Attestation Mode**: {{attestation_mode}}\n{{else}}\nShielded VMs not configured for this environment.\n{{/if}}",
    required: false,
    depends_on: [],
    repeatable: false
};

CREATE hld_sections CONTENT {
    template_id: $template_id,
    section_id: "bcdr",
    name: "Business Continuity and Disaster Recovery",
    description: "Backup and replication strategies",
    order: 9,
    content_template: "# 9.0 Business Continuity and Disaster Recovery\n\n## 9.1 Backup Strategy\n- **Software**: {{backup_software}}\n- **Frequency**: {{backup_frequency}}\n- **Retention**: {{backup_retention_days}} days\n\n## 9.2 Replication Strategy\n- **Technology**: {{replication_technology}}\n{{#if replication_technology == 'Hyper-V Replica'}}\n- **Target**: {{replica_target_server_or_cluster}}\n- **Frequency**: Every {{replication_frequency_seconds}} seconds\n- **Authentication**: {{authentication_method}}\n{{else if replication_technology == 'Azure Site Recovery'}}\n- **Vault**: {{azure_recovery_services_vault}}\n- **Policy**: {{azure_replication_policy_name}}\n{{/if}}",
    required: true,
    depends_on: [],
    repeatable: false
};

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- Get all templates
-- SELECT * FROM hld_templates WHERE is_active = true;

-- Get all sections for a template (ordered)
-- SELECT * FROM hld_sections WHERE template_id = $template_id ORDER BY order ASC;

-- Get HLD project for a specific project
-- SELECT * FROM hld_projects WHERE project_id = projects:test-project-123;

-- Get all variables for an HLD project
-- SELECT * FROM hld_variables WHERE hld_project_id = $hld_project_id;

-- Get variables by section
-- SELECT * FROM hld_variables WHERE hld_project_id = $hld_project_id AND section = "physical_infrastructure";

-- Get all RVTools-populated variables
-- SELECT * FROM hld_variables WHERE hld_project_id = $hld_project_id AND source = "rvtools";

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
