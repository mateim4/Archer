-- =============================================================================
-- PROJECT WORKFLOW MANAGEMENT SCHEMA EXTENSION
-- This extends the existing hardware basket schema with project management
-- =============================================================================

-- Projects: Main container for infrastructure activities
DEFINE TABLE project_workflow SCHEMAFULL;
DEFINE FIELD name ON project_workflow TYPE string;
DEFINE FIELD description ON project_workflow TYPE string;
DEFINE FIELD project_type ON project_workflow TYPE string; -- "vmware_migration", "lifecycle_planning", "new_solution", "hardware_refresh"
DEFINE FIELD status ON project_workflow TYPE string; -- "planning", "active", "on_hold", "completed", "cancelled"
DEFINE FIELD priority ON project_workflow TYPE string; -- "low", "medium", "high", "critical"
DEFINE FIELD start_date ON project_workflow TYPE datetime;
DEFINE FIELD target_end_date ON project_workflow TYPE datetime;
DEFINE FIELD actual_end_date ON project_workflow TYPE datetime;
DEFINE FIELD progress_percentage ON project_workflow TYPE int DEFAULT 0;
DEFINE FIELD created_by ON project_workflow TYPE string;
DEFINE FIELD assigned_team ON project_workflow TYPE array<string>;
DEFINE FIELD metadata ON project_workflow TYPE object;
DEFINE FIELD created_at ON project_workflow TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_workflow TYPE datetime DEFAULT time::now();

-- Workflows: Individual phases/activities within projects  
DEFINE TABLE workflow SCHEMAFULL;
DEFINE FIELD project_id ON workflow TYPE record<project_workflow>;
DEFINE FIELD name ON workflow TYPE string;
DEFINE FIELD description ON workflow TYPE string;
DEFINE FIELD workflow_type ON workflow TYPE string; -- "migration_wave", "hardware_procurement", "lifecycle_planning", etc.
DEFINE FIELD duration_days ON workflow TYPE int;
DEFINE FIELD start_date ON workflow TYPE datetime;
DEFINE FIELD end_date ON workflow TYPE datetime;
DEFINE FIELD dependencies ON workflow TYPE array<record<workflow>>;
DEFINE FIELD dependency_type ON workflow TYPE string; -- "finish_to_start", "start_to_start", "finish_to_finish"
DEFINE FIELD lag_days ON workflow TYPE int DEFAULT 0;
DEFINE FIELD status ON workflow TYPE string; -- "not_started", "in_progress", "completed", "blocked", "cancelled"
DEFINE FIELD progress_percentage ON workflow TYPE int DEFAULT 0;
DEFINE FIELD assigned_to ON workflow TYPE array<string>;
DEFINE FIELD wizard_state ON workflow TYPE object;
DEFINE FIELD hardware_requirements ON workflow TYPE object;
DEFINE FIELD created_at ON workflow TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON workflow TYPE datetime DEFAULT time::now();

-- Server Inventory: Physical servers and their lifecycle
DEFINE TABLE server_inventory SCHEMAFULL;
DEFINE FIELD server_name ON server_inventory TYPE string;
DEFINE FIELD serial_number ON server_inventory TYPE string;
DEFINE FIELD asset_tag ON server_inventory TYPE string;
DEFINE FIELD hardware_model_id ON server_inventory TYPE record<hardware_lot>;
DEFINE FIELD location ON server_inventory TYPE string;
DEFINE FIELD status ON server_inventory TYPE string; -- "available", "allocated", "maintenance", "decommissioned"
DEFINE FIELD condition ON server_inventory TYPE string; -- "new", "good", "fair", "end_of_life"
DEFINE FIELD allocated_to_project ON server_inventory TYPE record<project_workflow>;
DEFINE FIELD allocated_to_workflow ON server_inventory TYPE record<workflow>;
DEFINE FIELD allocation_start ON server_inventory TYPE datetime;
DEFINE FIELD allocation_end ON server_inventory TYPE datetime;
DEFINE FIELD procurement_date ON server_inventory TYPE datetime;
DEFINE FIELD warranty_start ON server_inventory TYPE datetime;
DEFINE FIELD warranty_end ON server_inventory TYPE datetime;
DEFINE FIELD purchase_price ON server_inventory TYPE decimal;
DEFINE FIELD depreciation_rate ON server_inventory TYPE decimal;
DEFINE FIELD specifications ON server_inventory TYPE object;
DEFINE FIELD maintenance_history ON server_inventory TYPE array<object>;
DEFINE FIELD created_at ON server_inventory TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON server_inventory TYPE datetime DEFAULT time::now();

-- RVTools Imports: Track and store RVTools analysis data
DEFINE TABLE rvtools_import SCHEMAFULL;
DEFINE FIELD project_id ON rvtools_import TYPE record<project_workflow>;
DEFINE FIELD filename ON rvtools_import TYPE string;
DEFINE FIELD file_size ON rvtools_import TYPE int;
DEFINE FIELD import_date ON rvtools_import TYPE datetime;
DEFINE FIELD imported_by ON rvtools_import TYPE string;
DEFINE FIELD processing_status ON rvtools_import TYPE string; -- "processing", "completed", "failed"
DEFINE FIELD error_message ON rvtools_import TYPE string;
DEFINE FIELD total_vms ON rvtools_import TYPE int;
DEFINE FIELD total_hosts ON rvtools_import TYPE int;
DEFINE FIELD total_clusters ON rvtools_import TYPE int;
DEFINE FIELD environment_summary ON rvtools_import TYPE object;
DEFINE FIELD clusters_data ON rvtools_import TYPE array<object>;
DEFINE FIELD selected_clusters ON rvtools_import TYPE array<string>;
DEFINE FIELD capacity_analysis ON rvtools_import TYPE object;
DEFINE FIELD hardware_recommendations ON rvtools_import TYPE array<object>;
DEFINE FIELD raw_data_path ON rvtools_import TYPE string;
DEFINE FIELD created_at ON rvtools_import TYPE datetime DEFAULT time::now();

-- Project Documents: Generated and uploaded documents per project
DEFINE TABLE project_document SCHEMAFULL;
DEFINE FIELD project_id ON project_document TYPE record<project_workflow>;
DEFINE FIELD workflow_id ON project_document TYPE record<workflow>;
DEFINE FIELD document_type ON project_document TYPE string; -- "HLD", "LLD", "migration_plan", "hardware_bom", "network_diagram"
DEFINE FIELD document_name ON project_document TYPE string;
DEFINE FIELD file_path ON project_document TYPE string;
DEFINE FIELD file_size ON project_document TYPE int;
DEFINE FIELD version ON project_document TYPE string;
DEFINE FIELD status ON project_document TYPE string; -- "draft", "review", "approved", "archived"
DEFINE FIELD generated_from_template ON project_document TYPE string;
DEFINE FIELD generation_config ON project_document TYPE object;
DEFINE FIELD generated_at ON project_document TYPE datetime;
DEFINE FIELD generated_by ON project_document TYPE string;
DEFINE FIELD approved_by ON project_document TYPE string;
DEFINE FIELD approval_date ON project_document TYPE datetime;
DEFINE FIELD metadata ON project_document TYPE object;
DEFINE FIELD created_at ON project_document TYPE datetime DEFAULT time::now();

-- Procurement Requests: Track hardware orders
DEFINE TABLE procurement_request SCHEMAFULL;
DEFINE FIELD project_id ON procurement_request TYPE record<project_workflow>;
DEFINE FIELD workflow_id ON procurement_request TYPE record<workflow>;
DEFINE FIELD request_name ON procurement_request TYPE string;
DEFINE FIELD hardware_items ON procurement_request TYPE array<object>;
DEFINE FIELD vendor ON procurement_request TYPE string;
DEFINE FIELD status ON procurement_request TYPE string; -- "requested", "approved", "ordered", "delivered", "cancelled"
DEFINE FIELD request_date ON procurement_request TYPE datetime;
DEFINE FIELD approval_date ON procurement_request TYPE datetime;
DEFINE FIELD order_date ON procurement_request TYPE datetime;
DEFINE FIELD expected_delivery ON procurement_request TYPE datetime;
DEFINE FIELD actual_delivery ON procurement_request TYPE datetime;
DEFINE FIELD total_cost ON procurement_request TYPE decimal;
DEFINE FIELD purchase_order_number ON procurement_request TYPE string;
DEFINE FIELD created_at ON procurement_request TYPE datetime DEFAULT time::now();

-- Document Templates: Store and manage document templates
DEFINE TABLE document_template SCHEMAFULL;
DEFINE FIELD template_name ON document_template TYPE string;
DEFINE FIELD template_type ON document_template TYPE string; -- "HLD", "LLD", "migration_plan", "custom"
DEFINE FIELD description ON document_template TYPE string;
DEFINE FIELD template_file_path ON document_template TYPE string;
DEFINE FIELD version ON document_template TYPE string;
DEFINE FIELD style_config ON document_template TYPE object;
DEFINE FIELD placeholder_map ON document_template TYPE object;
DEFINE FIELD table_structures ON document_template TYPE array<object>;
DEFINE FIELD is_default ON document_template TYPE bool DEFAULT false;
DEFINE FIELD created_at ON document_template TYPE datetime DEFAULT time::now();

-- Workflow Templates: Reusable workflow definitions
DEFINE TABLE workflow_template SCHEMAFULL;
DEFINE FIELD name ON workflow_template TYPE string;
DEFINE FIELD description ON workflow_template TYPE string;
DEFINE FIELD workflow_type ON workflow_template TYPE string;
DEFINE FIELD template_data ON workflow_template TYPE object;
DEFINE FIELD default_duration_days ON workflow_template TYPE int;
DEFINE FIELD required_dependencies ON workflow_template TYPE array<string>;
DEFINE FIELD created_at ON workflow_template TYPE datetime DEFAULT time::now();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Project indexes
DEFINE INDEX idx_project_status ON project_workflow COLUMNS status;
DEFINE INDEX idx_project_type ON project_workflow COLUMNS project_type;
DEFINE INDEX idx_project_dates ON project_workflow COLUMNS start_date, target_end_date;

-- Workflow indexes
DEFINE INDEX idx_workflow_project ON workflow COLUMNS project_id;
DEFINE INDEX idx_workflow_status ON workflow COLUMNS status;
DEFINE INDEX idx_workflow_type ON workflow COLUMNS workflow_type;
DEFINE INDEX idx_workflow_dates ON workflow COLUMNS start_date, end_date;

-- Server inventory indexes
DEFINE INDEX idx_server_status ON server_inventory COLUMNS status;
DEFINE INDEX idx_server_allocation ON server_inventory COLUMNS allocated_to_project;
DEFINE INDEX idx_server_model ON server_inventory COLUMNS hardware_model_id;

-- Document indexes
DEFINE INDEX idx_document_project ON project_document COLUMNS project_id;
DEFINE INDEX idx_document_type ON project_document COLUMNS document_type;
DEFINE INDEX idx_document_status ON project_document COLUMNS status;

-- RVTools indexes
DEFINE INDEX idx_rvtools_project ON rvtools_import COLUMNS project_id;
DEFINE INDEX idx_rvtools_status ON rvtools_import COLUMNS processing_status;

-- Procurement indexes  
DEFINE INDEX idx_procurement_project ON procurement_request COLUMNS project_id;
DEFINE INDEX idx_procurement_status ON procurement_request COLUMNS status;
DEFINE INDEX idx_procurement_vendor ON procurement_request COLUMNS vendor;

-- =============================================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- =============================================================================

-- Sample workflow templates for common project types
INSERT INTO workflow_template (name, description, workflow_type, template_data, default_duration_days, required_dependencies) VALUES 
('VMware Migration Wave', 'Standard VMware to Hyper-V migration workflow', 'migration_wave', {
    'steps': ['assessment', 'planning', 'execution', 'validation'],
    'required_tools': ['rvtools', 'migration_planner'],
    'deliverables': ['HLD', 'LLD', 'migration_plan']
}, 30, []),
('Hardware Procurement', 'Hardware ordering and delivery tracking', 'hardware_procurement', {
    'steps': ['requirements', 'vendor_selection', 'approval', 'ordering', 'delivery'],
    'approvals_required': ['technical', 'financial'],
    'deliverables': ['hardware_bom', 'procurement_plan']
}, 45, []),
('Solution Lifecycle Planning', 'Plan hardware refresh and lifecycle management', 'lifecycle_planning', {
    'steps': ['current_assessment', 'lifecycle_analysis', 'replacement_planning', 'timeline_creation'],
    'required_tools': ['lifecycle_planner'],
    'deliverables': ['lifecycle_plan', 'replacement_schedule']
}, 21, []);

-- Sample document templates
INSERT INTO document_template (template_name, template_type, description, template_file_path, version, is_default) VALUES
('Standard HLD Template', 'HLD', 'Corporate standard High-Level Design template', '/templates/hld_standard.docx', '1.0', true),
('Standard LLD Template', 'LLD', 'Corporate standard Low-Level Design template', '/templates/lld_standard.docx', '1.0', true),
('Migration Plan Template', 'migration_plan', 'VMware migration planning template', '/templates/migration_plan.docx', '1.0', true);

-- =============================================================================
-- PERMISSIONS (Optional - for production environments)
-- =============================================================================

-- Define user roles and permissions
-- DEFINE SCOPE user_scope SESSION 24h
--   SIGNIN (
--     SELECT * FROM user WHERE username = $username AND crypto::argon2::compare(password, $password)
--   )
--   SIGNUP (
--     CREATE user SET username = $username, password = crypto::argon2::generate($password), role = 'viewer'
--   );

-- Additional permissions can be defined here for role-based access control
