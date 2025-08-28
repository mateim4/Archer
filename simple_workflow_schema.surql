-- Create namespace and database if not exists
USE NS lcmdesigner DB main;

-- Define the project_workflow table
DEFINE TABLE project_workflow SCHEMAFULL;
DEFINE FIELD id ON TABLE project_workflow TYPE record<project_workflow>;
DEFINE FIELD name ON TABLE project_workflow TYPE string;
DEFINE FIELD description ON TABLE project_workflow TYPE string;
DEFINE FIELD project_type ON TABLE project_workflow TYPE string;
DEFINE FIELD status ON TABLE project_workflow TYPE string;
DEFINE FIELD priority ON TABLE project_workflow TYPE string;
DEFINE FIELD start_date ON TABLE project_workflow TYPE datetime;
DEFINE FIELD target_end_date ON TABLE project_workflow TYPE datetime;
DEFINE FIELD actual_end_date ON TABLE project_workflow TYPE option<datetime>;
DEFINE FIELD progress_percentage ON TABLE project_workflow TYPE number;
DEFINE FIELD created_by ON TABLE project_workflow TYPE string;
DEFINE FIELD assigned_team ON TABLE project_workflow TYPE array<string>;
DEFINE FIELD metadata ON TABLE project_workflow TYPE object;
DEFINE FIELD workflows ON TABLE project_workflow TYPE array<record<workflow>>;
DEFINE FIELD documents ON TABLE project_workflow TYPE array<record<project_document>>;
DEFINE FIELD rvtools_import ON TABLE project_workflow TYPE option<record<rvtools_import>>;
DEFINE FIELD created_at ON TABLE project_workflow TYPE datetime;
DEFINE FIELD updated_at ON TABLE project_workflow TYPE datetime;

-- Define the workflow table
DEFINE TABLE workflow SCHEMAFULL;
DEFINE FIELD id ON TABLE workflow TYPE record<workflow>;
DEFINE FIELD project_id ON TABLE workflow TYPE record<project_workflow>;
DEFINE FIELD name ON TABLE workflow TYPE string;
DEFINE FIELD description ON TABLE workflow TYPE string;
DEFINE FIELD workflow_type ON TABLE workflow TYPE string;
DEFINE FIELD duration_days ON TABLE workflow TYPE number;
DEFINE FIELD start_date ON TABLE workflow TYPE datetime;
DEFINE FIELD end_date ON TABLE workflow TYPE datetime;
DEFINE FIELD dependencies ON TABLE workflow TYPE array<record<workflow>>;
DEFINE FIELD dependency_type ON TABLE workflow TYPE string;
DEFINE FIELD lag_days ON TABLE workflow TYPE number;
DEFINE FIELD status ON TABLE workflow TYPE string;
DEFINE FIELD progress_percentage ON TABLE workflow TYPE number;
DEFINE FIELD assigned_to ON TABLE workflow TYPE array<string>;
DEFINE FIELD wizard_state ON TABLE workflow TYPE option<object>;
DEFINE FIELD hardware_requirements ON TABLE workflow TYPE option<object>;
DEFINE FIELD documents ON TABLE workflow TYPE array<record<project_document>>;
DEFINE FIELD created_at ON TABLE workflow TYPE datetime;
DEFINE FIELD updated_at ON TABLE workflow TYPE datetime;

-- Define the server_inventory table
DEFINE TABLE server_inventory SCHEMAFULL;
DEFINE FIELD id ON TABLE server_inventory TYPE record<server_inventory>;
DEFINE FIELD project_id ON TABLE server_inventory TYPE record<project_workflow>;
DEFINE FIELD server_name ON TABLE server_inventory TYPE string;
DEFINE FIELD hardware_model ON TABLE server_inventory TYPE string;
DEFINE FIELD specifications ON TABLE server_inventory TYPE object;
DEFINE FIELD status ON TABLE server_inventory TYPE string;
DEFINE FIELD allocation_history ON TABLE server_inventory TYPE array<object>;
DEFINE FIELD location ON TABLE server_inventory TYPE string;
DEFINE FIELD notes ON TABLE server_inventory TYPE option<string>;
DEFINE FIELD created_at ON TABLE server_inventory TYPE datetime;
DEFINE FIELD updated_at ON TABLE server_inventory TYPE datetime;

-- Define the rvtools_import table
DEFINE TABLE rvtools_import SCHEMAFULL;
DEFINE FIELD id ON TABLE rvtools_import TYPE record<rvtools_import>;
DEFINE FIELD project_id ON TABLE rvtools_import TYPE record<project_workflow>;
DEFINE FIELD file_name ON TABLE rvtools_import TYPE string;
DEFINE FIELD file_size ON TABLE rvtools_import TYPE number;
DEFINE FIELD import_date ON TABLE rvtools_import TYPE datetime;
DEFINE FIELD vm_count ON TABLE rvtools_import TYPE number;
DEFINE FIELD host_count ON TABLE rvtools_import TYPE number;
DEFINE FIELD cluster_count ON TABLE rvtools_import TYPE number;
DEFINE FIELD total_cpu_cores ON TABLE rvtools_import TYPE number;
DEFINE FIELD total_memory_gb ON TABLE rvtools_import TYPE number;
DEFINE FIELD total_storage_gb ON TABLE rvtools_import TYPE number;
DEFINE FIELD parsed_data ON TABLE rvtools_import TYPE object;
DEFINE FIELD analysis_results ON TABLE rvtools_import TYPE option<object>;
DEFINE FIELD created_at ON TABLE rvtools_import TYPE datetime;

-- Define the project_document table
DEFINE TABLE project_document SCHEMAFULL;
DEFINE FIELD id ON TABLE project_document TYPE record<project_document>;
DEFINE FIELD project_id ON TABLE project_document TYPE record<project_workflow>;
DEFINE FIELD workflow_id ON TABLE project_document TYPE option<record<workflow>>;
DEFINE FIELD document_name ON TABLE project_document TYPE string;
DEFINE FIELD document_type ON TABLE project_document TYPE string;
DEFINE FIELD template_name ON TABLE project_document TYPE option<string>;
DEFINE FIELD file_path ON TABLE project_document TYPE string;
DEFINE FIELD file_size ON TABLE project_document TYPE number;
DEFINE FIELD generation_config ON TABLE project_document TYPE option<object>;
DEFINE FIELD status ON TABLE project_document TYPE string;
DEFINE FIELD created_at ON TABLE project_document TYPE datetime;
DEFINE FIELD generated_at ON TABLE project_document TYPE option<datetime>;

-- Define the procurement_request table
DEFINE TABLE procurement_request SCHEMAFULL;
DEFINE FIELD id ON TABLE procurement_request TYPE record<procurement_request>;
DEFINE FIELD project_id ON TABLE procurement_request TYPE record<project_workflow>;
DEFINE FIELD request_type ON TABLE procurement_request TYPE string;
DEFINE FIELD items ON TABLE procurement_request TYPE array<object>;
DEFINE FIELD total_cost ON TABLE procurement_request TYPE option<number>;
DEFINE FIELD vendor ON TABLE procurement_request TYPE option<string>;
DEFINE FIELD status ON TABLE procurement_request TYPE string;
DEFINE FIELD requested_by ON TABLE procurement_request TYPE string;
DEFINE FIELD approved_by ON TABLE procurement_request TYPE option<string>;
DEFINE FIELD approval_date ON TABLE procurement_request TYPE option<datetime>;
DEFINE FIELD delivery_date ON TABLE procurement_request TYPE option<datetime>;
DEFINE FIELD created_at ON TABLE procurement_request TYPE datetime;
DEFINE FIELD updated_at ON TABLE procurement_request TYPE datetime;

-- Create indexes for better query performance
DEFINE INDEX project_status_idx ON TABLE project_workflow COLUMNS status;
DEFINE INDEX project_type_idx ON TABLE project_workflow COLUMNS project_type;
DEFINE INDEX project_created_idx ON TABLE project_workflow COLUMNS created_at;
DEFINE INDEX workflow_project_idx ON TABLE workflow COLUMNS project_id;
DEFINE INDEX workflow_status_idx ON TABLE workflow COLUMNS status;
DEFINE INDEX workflow_type_idx ON TABLE workflow COLUMNS workflow_type;
DEFINE INDEX server_project_idx ON TABLE server_inventory COLUMNS project_id;
DEFINE INDEX server_status_idx ON TABLE server_inventory COLUMNS status;

-- Insert some sample data for testing
INSERT INTO project_workflow (
    name, 
    description, 
    project_type, 
    status, 
    priority, 
    start_date, 
    target_end_date, 
    progress_percentage, 
    created_by, 
    assigned_team, 
    metadata,
    workflows,
    documents,
    created_at,
    updated_at
) VALUES (
    'VMware to Hyper-V Migration - Phase 1', 
    'Migration of critical workloads from VMware vSphere to Microsoft Hyper-V', 
    'migration', 
    'planning', 
    'high', 
    d'2025-09-01T00:00:00Z', 
    d'2025-12-31T23:59:59Z', 
    15, 
    'migration_team', 
    ['john.doe', 'jane.smith', 'mike.wilson'], 
    {
        'budget': 250000,
        'environment': 'production',
        'compliance_required': true,
        'stakeholders': ['IT Director', 'CTO', 'Operations Manager']
    },
    [],
    [],
    d'2025-08-27T15:00:00Z',
    d'2025-08-27T15:00:00Z'
);

-- Success message
SELECT "Schema created successfully! Database is ready for the new project workflow system." AS message;
