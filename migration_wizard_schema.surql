-- Migration Planning Wizard Database Schema
-- Complete schema for migration project management

-- =============================================================================
-- MIGRATION WIZARD PROJECT TABLE
-- =============================================================================
DEFINE TABLE migration_wizard_project SCHEMAFULL;

DEFINE FIELD name ON migration_wizard_project TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON migration_wizard_project TYPE option<string>;
DEFINE FIELD status ON migration_wizard_project TYPE string ASSERT $value INSIDE ['draft', 'in_progress', 'completed', 'archived'];
DEFINE FIELD created_at ON migration_wizard_project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON migration_wizard_project TYPE datetime DEFAULT time::now();

-- RVTools data reference
DEFINE FIELD rvtools_filename ON migration_wizard_project TYPE option<string>;
DEFINE FIELD rvtools_upload_date ON migration_wizard_project TYPE option<datetime>;
DEFINE FIELD rvtools_file_path ON migration_wizard_project TYPE option<string>;

-- Project metadata
DEFINE FIELD total_vms ON migration_wizard_project TYPE int DEFAULT 0;
DEFINE FIELD total_clusters ON migration_wizard_project TYPE int DEFAULT 0;
DEFINE FIELD wizard_step ON migration_wizard_project TYPE int DEFAULT 1;

-- Index for fast lookups
DEFINE INDEX idx_mwp_status ON migration_wizard_project COLUMNS status;
DEFINE INDEX idx_mwp_created ON migration_wizard_project COLUMNS created_at;

-- =============================================================================
-- MIGRATION WIZARD VM TABLE
-- =============================================================================
DEFINE TABLE migration_wizard_vm SCHEMAFULL;

DEFINE FIELD project_id ON migration_wizard_vm TYPE record<migration_wizard_project>;
DEFINE FIELD name ON migration_wizard_vm TYPE string;
DEFINE FIELD powerstate ON migration_wizard_vm TYPE option<string>;
DEFINE FIELD template ON migration_wizard_vm TYPE option<bool>;

-- Resource specifications
DEFINE FIELD cpus ON migration_wizard_vm TYPE int;
DEFINE FIELD memory_mb ON migration_wizard_vm TYPE int;
DEFINE FIELD provisioned_mb ON migration_wizard_vm TYPE option<int>;
DEFINE FIELD in_use_mb ON migration_wizard_vm TYPE option<int>;

-- Network information
DEFINE FIELD primary_ip_address ON migration_wizard_vm TYPE option<string>;
DEFINE FIELD dns_name ON migration_wizard_vm TYPE option<string>;

-- Cluster information
DEFINE FIELD cluster ON migration_wizard_vm TYPE option<string>;
DEFINE FIELD host ON migration_wizard_vm TYPE option<string>;
DEFINE FIELD datacenter ON migration_wizard_vm TYPE option<string>;

-- OS information
DEFINE FIELD os ON migration_wizard_vm TYPE option<string>;
DEFINE FIELD version ON migration_wizard_vm TYPE option<string>;

-- Storage information
DEFINE FIELD num_disks ON migration_wizard_vm TYPE int DEFAULT 0;
DEFINE FIELD num_nics ON migration_wizard_vm TYPE int DEFAULT 0;

-- Annotations
DEFINE FIELD annotation ON migration_wizard_vm TYPE option<string>;
DEFINE FIELD folder ON migration_wizard_vm TYPE option<string>;

-- Timestamps
DEFINE FIELD created_at ON migration_wizard_vm TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_mwvm_project ON migration_wizard_vm COLUMNS project_id;
DEFINE INDEX idx_mwvm_name ON migration_wizard_vm COLUMNS name;
DEFINE INDEX idx_mwvm_cluster ON migration_wizard_vm COLUMNS cluster;

-- =============================================================================
-- MIGRATION WIZARD CLUSTER TABLE  
-- =============================================================================
DEFINE TABLE migration_wizard_cluster SCHEMAFULL;

DEFINE FIELD project_id ON migration_wizard_cluster TYPE record<migration_wizard_project>;
DEFINE FIELD name ON migration_wizard_cluster TYPE string;
DEFINE FIELD description ON migration_wizard_cluster TYPE option<string>;

-- Hardware specifications
DEFINE FIELD cpu_ghz ON migration_wizard_cluster TYPE float;
DEFINE FIELD total_cores ON migration_wizard_cluster TYPE int;
DEFINE FIELD memory_gb ON migration_wizard_cluster TYPE int;
DEFINE FIELD storage_tb ON migration_wizard_cluster TYPE float;

-- Network specifications
DEFINE FIELD network_bandwidth_gbps ON migration_wizard_cluster TYPE float;

-- Oversubscription settings
DEFINE FIELD cpu_oversubscription_ratio ON migration_wizard_cluster TYPE float DEFAULT 1.0;
DEFINE FIELD memory_oversubscription_ratio ON migration_wizard_cluster TYPE float DEFAULT 1.0;

-- Strategy
DEFINE FIELD strategy ON migration_wizard_cluster TYPE string DEFAULT 'lift-shift';

-- Timestamps
DEFINE FIELD created_at ON migration_wizard_cluster TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON migration_wizard_cluster TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_mwc_project ON migration_wizard_cluster COLUMNS project_id;
DEFINE INDEX idx_mwc_name ON migration_wizard_cluster COLUMNS name;

-- =============================================================================
-- VM PLACEMENT TABLE
-- =============================================================================
DEFINE TABLE migration_wizard_placement SCHEMAFULL;

DEFINE FIELD project_id ON migration_wizard_placement TYPE record<migration_wizard_project>;
DEFINE FIELD vm_id ON migration_wizard_placement TYPE record<migration_wizard_vm>;
DEFINE FIELD cluster_id ON migration_wizard_placement TYPE record<migration_wizard_cluster>;

-- Placement strategy
DEFINE FIELD strategy ON migration_wizard_placement TYPE string;
DEFINE FIELD confidence_score ON migration_wizard_placement TYPE option<float>;
DEFINE FIELD warnings ON migration_wizard_placement TYPE option<array<string>>;

-- Resource allocation
DEFINE FIELD allocated_cpu ON migration_wizard_placement TYPE int;
DEFINE FIELD allocated_memory_mb ON migration_wizard_placement TYPE int;
DEFINE FIELD allocated_storage_gb ON migration_wizard_placement TYPE float;

-- Timestamps
DEFINE FIELD created_at ON migration_wizard_placement TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_mwp_project ON migration_wizard_placement COLUMNS project_id;
DEFINE INDEX idx_mwp_vm ON migration_wizard_placement COLUMNS vm_id;
DEFINE INDEX idx_mwp_cluster ON migration_wizard_placement COLUMNS cluster_id;

-- Unique constraint: one VM can only be placed on one cluster
DEFINE INDEX idx_mwp_unique_vm ON migration_wizard_placement COLUMNS project_id, vm_id UNIQUE;

-- =============================================================================
-- NETWORK MAPPING TABLE
-- =============================================================================
DEFINE TABLE migration_wizard_network_mapping SCHEMAFULL;

DEFINE FIELD project_id ON migration_wizard_network_mapping TYPE record<migration_wizard_project>;
DEFINE FIELD source_vlan_name ON migration_wizard_network_mapping TYPE string;
DEFINE FIELD source_vlan_id ON migration_wizard_network_mapping TYPE option<int>;
DEFINE FIELD source_subnet ON migration_wizard_network_mapping TYPE option<string>;

DEFINE FIELD destination_vlan_name ON migration_wizard_network_mapping TYPE string;
DEFINE FIELD destination_vlan_id ON migration_wizard_network_mapping TYPE option<int>;
DEFINE FIELD destination_subnet ON migration_wizard_network_mapping TYPE option<string>;

-- Gateway and DNS
DEFINE FIELD destination_gateway ON migration_wizard_network_mapping TYPE option<string>;
DEFINE FIELD destination_dns ON migration_wizard_network_mapping TYPE option<array<string>>;

-- Validation status
DEFINE FIELD is_valid ON migration_wizard_network_mapping TYPE bool DEFAULT true;
DEFINE FIELD validation_errors ON migration_wizard_network_mapping TYPE option<array<string>>;

-- Timestamps
DEFINE FIELD created_at ON migration_wizard_network_mapping TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_mwnm_project ON migration_wizard_network_mapping COLUMNS project_id;
DEFINE INDEX idx_mwnm_source ON migration_wizard_network_mapping COLUMNS source_vlan_name;

-- =============================================================================
-- HLD DOCUMENT TABLE (already exists, extending for migration wizard)
-- =============================================================================
-- Note: Reusing existing HLD infrastructure from backend/src/models/project_models.rs
-- Just need to link to migration_wizard_project

-- =============================================================================
-- PROJECT NOTES
-- =============================================================================
-- This schema integrates with existing tables:
-- 1. network_template (from backend/src/models/project_models.rs)
-- 2. document_generation_job (from backend/src/models/project_models.rs)
-- 
-- Migration Wizard will:
-- - Create migration_wizard_project as main project container
-- - Parse RVTools Excel and populate migration_wizard_vm table
-- - User creates clusters in migration_wizard_cluster table
-- - VM placement algorithm populates migration_wizard_placement table
-- - Network configuration populates migration_wizard_network_mapping table
-- - HLD generation uses existing document_generation_job system
