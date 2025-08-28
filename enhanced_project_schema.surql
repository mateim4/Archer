-- =============================================================================
-- ENHANCED PROJECT MANAGEMENT & WORKFLOW SCHEMA
-- Comprehensive project-centric database design for LCMDesigner
-- =============================================================================

-- =============================================================================
-- PROJECT MANAGEMENT CORE TABLES
-- =============================================================================

-- Projects: Main container for all work
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project TYPE string;
DEFINE FIELD project_type ON project TYPE string; -- migration, deployment, upgrade, custom
DEFINE FIELD status ON project TYPE string DEFAULT 'planning'; -- planning, active, completed, cancelled, on_hold
DEFINE FIELD priority ON project TYPE string DEFAULT 'medium'; -- low, medium, high, critical
DEFINE FIELD start_date ON project TYPE datetime;
DEFINE FIELD target_end_date ON project TYPE datetime;
DEFINE FIELD actual_end_date ON project TYPE datetime;
DEFINE FIELD progress_percentage ON project TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD budget_allocated ON project TYPE decimal;
DEFINE FIELD budget_spent ON project TYPE decimal DEFAULT 0;
DEFINE FIELD risk_level ON project TYPE string DEFAULT 'medium'; -- low, medium, high, critical
DEFINE FIELD stakeholders ON project TYPE array<string>;
DEFINE FIELD tags ON project TYPE array<string>;
DEFINE FIELD metadata ON project TYPE object; -- flexible additional data
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD created_by ON project TYPE string;
DEFINE FIELD assigned_to ON project TYPE string;

-- Project Workflows: Define phases and activities within projects
DEFINE TABLE project_workflow SCHEMAFULL;
DEFINE FIELD project_id ON project_workflow TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD name ON project_workflow TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project_workflow TYPE string;
DEFINE FIELD workflow_type ON project_workflow TYPE string; -- assessment, planning, implementation, validation, documentation
DEFINE FIELD status ON project_workflow TYPE string DEFAULT 'not_started'; -- not_started, in_progress, completed, blocked, cancelled
DEFINE FIELD priority ON project_workflow TYPE int DEFAULT 5 ASSERT $value >= 1 AND $value <= 10;
DEFINE FIELD estimated_duration_hours ON project_workflow TYPE decimal;
DEFINE FIELD actual_duration_hours ON project_workflow TYPE decimal;
DEFINE FIELD start_date ON project_workflow TYPE datetime;
DEFINE FIELD target_end_date ON project_workflow TYPE datetime;
DEFINE FIELD actual_end_date ON project_workflow TYPE datetime;
DEFINE FIELD progress_percentage ON project_workflow TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD dependencies ON project_workflow TYPE array<record(project_workflow)>;
DEFINE FIELD assigned_to ON project_workflow TYPE string;
DEFINE FIELD requires_approval ON project_workflow TYPE bool DEFAULT false;
DEFINE FIELD approved_by ON project_workflow TYPE string;
DEFINE FIELD approval_date ON project_workflow TYPE datetime;
DEFINE FIELD metadata ON project_workflow TYPE object;
DEFINE FIELD created_at ON project_workflow TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_workflow TYPE datetime DEFAULT time::now();

-- Workflow Activities: Granular tasks within workflows
DEFINE TABLE workflow_activity SCHEMAFULL;
DEFINE FIELD workflow_id ON workflow_activity TYPE record(project_workflow) ASSERT $value != NONE;
DEFINE FIELD name ON workflow_activity TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON workflow_activity TYPE string;
DEFINE FIELD activity_type ON workflow_activity TYPE string; -- rvtools_upload, capacity_analysis, hardware_selection, document_generation, validation
DEFINE FIELD status ON workflow_activity TYPE string DEFAULT 'pending'; -- pending, in_progress, completed, failed, skipped
DEFINE FIELD estimated_duration_hours ON workflow_activity TYPE decimal;
DEFINE FIELD actual_duration_hours ON workflow_activity TYPE decimal;
DEFINE FIELD start_date ON workflow_activity TYPE datetime;
DEFINE FIELD end_date ON workflow_activity TYPE datetime;
DEFINE FIELD progress_percentage ON workflow_activity TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD prerequisites ON workflow_activity TYPE array<record(workflow_activity)>;
DEFINE FIELD deliverables ON workflow_activity TYPE array<string>;
DEFINE FIELD assigned_to ON workflow_activity TYPE string;
DEFINE FIELD configuration ON workflow_activity TYPE object; -- activity-specific config
DEFINE FIELD results ON workflow_activity TYPE object; -- activity outcomes
DEFINE FIELD metadata ON workflow_activity TYPE object;
DEFINE FIELD created_at ON workflow_activity TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON workflow_activity TYPE datetime DEFAULT time::now();

-- Project Documents: Document library per project
DEFINE TABLE project_document SCHEMAFULL;
DEFINE FIELD project_id ON project_document TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD workflow_id ON project_document TYPE record(project_workflow);
DEFINE FIELD activity_id ON project_document TYPE record(workflow_activity);
DEFINE FIELD document_name ON project_document TYPE string ASSERT $value != NONE;
DEFINE FIELD document_type ON project_document TYPE string; -- HLD, LLD, migration_plan, hardware_bom, network_diagram, deployment_plan, custom
DEFINE FIELD file_path ON project_document TYPE string ASSERT $value != NONE;
DEFINE FIELD file_size_bytes ON project_document TYPE int;
DEFINE FIELD file_hash ON project_document TYPE string;
DEFINE FIELD mime_type ON project_document TYPE string;
DEFINE FIELD version ON project_document TYPE string DEFAULT '1.0';
DEFINE FIELD status ON project_document TYPE string DEFAULT 'draft'; -- draft, review, approved, archived
DEFINE FIELD template_name ON project_document TYPE string;
DEFINE FIELD generation_config ON project_document TYPE object;
DEFINE FIELD tags ON project_document TYPE array<string>;
DEFINE FIELD created_at ON project_document TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_document TYPE datetime DEFAULT time::now();
DEFINE FIELD created_by ON project_document TYPE string;

-- =============================================================================
-- HARDWARE POOL MANAGEMENT TABLES
-- =============================================================================

-- Hardware Pool: Available server inventory
DEFINE TABLE hardware_pool SCHEMAFULL;
DEFINE FIELD asset_tag ON hardware_pool TYPE string ASSERT $value != NONE;
DEFINE FIELD serial_number ON hardware_pool TYPE string;
DEFINE FIELD hardware_lot_id ON hardware_pool TYPE record(hardware_lot);
DEFINE FIELD vendor ON hardware_pool TYPE string ASSERT $value != NONE;
DEFINE FIELD model ON hardware_pool TYPE string ASSERT $value != NONE;
DEFINE FIELD form_factor ON hardware_pool TYPE string;
DEFINE FIELD cpu_sockets ON hardware_pool TYPE int;
DEFINE FIELD cpu_cores_total ON hardware_pool TYPE int;
DEFINE FIELD memory_gb ON hardware_pool TYPE int;
DEFINE FIELD storage_type ON hardware_pool TYPE string;
DEFINE FIELD storage_capacity_gb ON hardware_pool TYPE int;
DEFINE FIELD network_ports ON hardware_pool TYPE int;
DEFINE FIELD power_consumption_watts ON hardware_pool TYPE int;
DEFINE FIELD rack_units ON hardware_pool TYPE int DEFAULT 1;

-- Availability and Status
DEFINE FIELD availability_status ON hardware_pool TYPE string DEFAULT 'available'; -- available, allocated, maintenance, retired, failed
DEFINE FIELD location ON hardware_pool TYPE string;
DEFINE FIELD datacenter ON hardware_pool TYPE string;
DEFINE FIELD rack_position ON hardware_pool TYPE string;
DEFINE FIELD available_from_date ON hardware_pool TYPE datetime DEFAULT time::now();
DEFINE FIELD available_until_date ON hardware_pool TYPE datetime;
DEFINE FIELD maintenance_schedule ON hardware_pool TYPE array<object>;

-- Financial Information
DEFINE FIELD acquisition_cost ON hardware_pool TYPE decimal;
DEFINE FIELD monthly_cost ON hardware_pool TYPE decimal;
DEFINE FIELD warranty_expires ON hardware_pool TYPE datetime;
DEFINE FIELD support_level ON hardware_pool TYPE string;

-- Metadata
DEFINE FIELD metadata ON hardware_pool TYPE object;
DEFINE FIELD created_at ON hardware_pool TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON hardware_pool TYPE datetime DEFAULT time::now();

-- Hardware Allocations: Track which servers are assigned to which projects
DEFINE TABLE hardware_allocation SCHEMAFULL;
DEFINE FIELD project_id ON hardware_allocation TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD workflow_id ON hardware_allocation TYPE record(project_workflow);
DEFINE FIELD server_id ON hardware_allocation TYPE record(hardware_pool) ASSERT $value != NONE;
DEFINE FIELD allocation_type ON hardware_allocation TYPE string; -- reserved, allocated, deployed
DEFINE FIELD allocation_start ON hardware_allocation TYPE datetime ASSERT $value != NONE;
DEFINE FIELD allocation_end ON hardware_allocation TYPE datetime;
DEFINE FIELD purpose ON hardware_allocation TYPE string; -- compute, storage, management, test
DEFINE FIELD configuration_notes ON hardware_allocation TYPE string;
DEFINE FIELD allocated_by ON hardware_allocation TYPE string;
DEFINE FIELD approved_by ON hardware_allocation TYPE string;
DEFINE FIELD metadata ON hardware_allocation TYPE object;
DEFINE FIELD created_at ON hardware_allocation TYPE datetime DEFAULT time::now();

-- Procurement Pipeline: Track hardware from basket to pool
DEFINE TABLE procurement_pipeline SCHEMAFULL;
DEFINE FIELD project_id ON procurement_pipeline TYPE record(project);
DEFINE FIELD hardware_lot_id ON procurement_pipeline TYPE record(hardware_lot) ASSERT $value != NONE;
DEFINE FIELD quantity ON procurement_pipeline TYPE int ASSERT $value > 0;
DEFINE FIELD procurement_status ON procurement_pipeline TYPE string DEFAULT 'planned'; -- planned, ordered, shipped, received, configured, available
DEFINE FIELD order_date ON procurement_pipeline TYPE datetime;
DEFINE FIELD expected_delivery ON procurement_pipeline TYPE datetime;
DEFINE FIELD actual_delivery ON procurement_pipeline TYPE datetime;
DEFINE FIELD vendor ON procurement_pipeline TYPE string ASSERT $value != NONE;
DEFINE FIELD order_number ON procurement_pipeline TYPE string;
DEFINE FIELD total_cost ON procurement_pipeline TYPE decimal;
DEFINE FIELD delivery_location ON procurement_pipeline TYPE string;
DEFINE FIELD notes ON procurement_pipeline TYPE string;
DEFINE FIELD metadata ON procurement_pipeline TYPE object;
DEFINE FIELD created_at ON procurement_pipeline TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON procurement_pipeline TYPE datetime DEFAULT time::now();

-- =============================================================================
-- RVTOOLS INTEGRATION TABLES
-- =============================================================================

-- RVTools Uploads: Track RVTools files per project
DEFINE TABLE rvtools_upload SCHEMAFULL;
DEFINE FIELD project_id ON rvtools_upload TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD workflow_id ON rvtools_upload TYPE record(project_workflow);
DEFINE FIELD file_name ON rvtools_upload TYPE string ASSERT $value != NONE;
DEFINE FIELD file_path ON rvtools_upload TYPE string ASSERT $value != NONE;
DEFINE FIELD file_size_bytes ON rvtools_upload TYPE int;
DEFINE FIELD file_hash ON rvtools_upload TYPE string;
DEFINE FIELD upload_status ON rvtools_upload TYPE string DEFAULT 'uploaded'; -- uploaded, processing, processed, failed
DEFINE FIELD processing_results ON rvtools_upload TYPE object;
DEFINE FIELD total_vms ON rvtools_upload TYPE int;
DEFINE FIELD total_hosts ON rvtools_upload TYPE int;
DEFINE FIELD total_clusters ON rvtools_upload TYPE int;
DEFINE FIELD vcenter_version ON rvtools_upload TYPE string;
DEFINE FIELD environment_name ON rvtools_upload TYPE string;
DEFINE FIELD metadata ON rvtools_upload TYPE object;
DEFINE FIELD uploaded_at ON rvtools_upload TYPE datetime DEFAULT time::now();
DEFINE FIELD processed_at ON rvtools_upload TYPE datetime;
DEFINE FIELD uploaded_by ON rvtools_upload TYPE string;

-- RVTools Analysis: Store capacity analysis results
DEFINE TABLE rvtools_analysis SCHEMAFULL;
DEFINE FIELD upload_id ON rvtools_analysis TYPE record(rvtools_upload) ASSERT $value != NONE;
DEFINE FIELD project_id ON rvtools_analysis TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD analysis_type ON rvtools_analysis TYPE string; -- capacity, performance, migration_readiness
DEFINE FIELD selected_clusters ON rvtools_analysis TYPE array<string>;
DEFINE FIELD total_vcpu ON rvtools_analysis TYPE int;
DEFINE FIELD total_memory_gb ON rvtools_analysis TYPE int;
DEFINE FIELD total_storage_gb ON rvtools_analysis TYPE int;
DEFINE FIELD overcommit_ratios ON rvtools_analysis TYPE object;
DEFINE FIELD performance_metrics ON rvtools_analysis TYPE object;
DEFINE FIELD capacity_recommendations ON rvtools_analysis TYPE array<object>;
DEFINE FIELD migration_complexity_score ON rvtools_analysis TYPE int;
DEFINE FIELD risk_assessment ON rvtools_analysis TYPE object;
DEFINE FIELD metadata ON rvtools_analysis TYPE object;
DEFINE FIELD created_at ON rvtools_analysis TYPE datetime DEFAULT time::now();
DEFINE FIELD analyzed_by ON rvtools_analysis TYPE string;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Project indexes
DEFINE INDEX idx_project_status ON project COLUMNS status;
DEFINE INDEX idx_project_type ON project COLUMNS project_type;
DEFINE INDEX idx_project_priority ON project COLUMNS priority;
DEFINE INDEX idx_project_dates ON project COLUMNS start_date, target_end_date;

-- Workflow indexes
DEFINE INDEX idx_workflow_project ON project_workflow COLUMNS project_id;
DEFINE INDEX idx_workflow_status ON project_workflow COLUMNS status;
DEFINE INDEX idx_workflow_type ON project_workflow COLUMNS workflow_type;

-- Activity indexes
DEFINE INDEX idx_activity_workflow ON workflow_activity COLUMNS workflow_id;
DEFINE INDEX idx_activity_status ON workflow_activity COLUMNS status;
DEFINE INDEX idx_activity_type ON workflow_activity COLUMNS activity_type;

-- Document indexes
DEFINE INDEX idx_document_project ON project_document COLUMNS project_id;
DEFINE INDEX idx_document_workflow ON project_document COLUMNS workflow_id;
DEFINE INDEX idx_document_type ON project_document COLUMNS document_type;
DEFINE INDEX idx_document_status ON project_document COLUMNS status;

-- Hardware pool indexes
DEFINE INDEX idx_hardware_availability ON hardware_pool COLUMNS availability_status;
DEFINE INDEX idx_hardware_vendor_model ON hardware_pool COLUMNS vendor, model;
DEFINE INDEX idx_hardware_location ON hardware_pool COLUMNS datacenter, location;
DEFINE INDEX idx_hardware_dates ON hardware_pool COLUMNS available_from_date, available_until_date;

-- Allocation indexes
DEFINE INDEX idx_allocation_project ON hardware_allocation COLUMNS project_id;
DEFINE INDEX idx_allocation_server ON hardware_allocation COLUMNS server_id;
DEFINE INDEX idx_allocation_dates ON hardware_allocation COLUMNS allocation_start, allocation_end;

-- Procurement indexes
DEFINE INDEX idx_procurement_project ON procurement_pipeline COLUMNS project_id;
DEFINE INDEX idx_procurement_status ON procurement_pipeline COLUMNS procurement_status;
DEFINE INDEX idx_procurement_vendor ON procurement_pipeline COLUMNS vendor;

-- RVTools indexes
DEFINE INDEX idx_rvtools_project ON rvtools_upload COLUMNS project_id;
DEFINE INDEX idx_rvtools_status ON rvtools_upload COLUMNS upload_status;
DEFINE INDEX idx_analysis_upload ON rvtools_analysis COLUMNS upload_id;
DEFINE INDEX idx_analysis_project ON rvtools_analysis COLUMNS project_id;
