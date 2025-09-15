-- =============================================================================
-- PROJECT MANAGEMENT SCHEMA FOR LCMDESIGNER
-- Complete project database schema with SurrealDB
-- =============================================================================

-- =============================================================================
-- CORE PROJECT TABLE
-- =============================================================================

-- Projects: Main container for infrastructure projects
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string ASSERT $value != NONE AND string::len($value) >= 3;
DEFINE FIELD description ON project TYPE string;
DEFINE FIELD project_type ON project TYPE string DEFAULT 'infrastructure'; -- infrastructure, migration, deployment, upgrade
DEFINE FIELD status ON project TYPE string DEFAULT 'planning'; -- planning, active, completed, cancelled, on_hold
DEFINE FIELD priority ON project TYPE string DEFAULT 'medium'; -- low, medium, high, critical
DEFINE FIELD owner_id ON project TYPE string ASSERT $value != NONE;
DEFINE FIELD assigned_team ON project TYPE array<string>;
DEFINE FIELD start_date ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD target_end_date ON project TYPE datetime;
DEFINE FIELD actual_end_date ON project TYPE datetime;
DEFINE FIELD progress_percentage ON project TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD budget_allocated ON project TYPE decimal;
DEFINE FIELD budget_spent ON project TYPE decimal DEFAULT 0.0;
DEFINE FIELD estimated_hours ON project TYPE decimal;
DEFINE FIELD actual_hours ON project TYPE decimal DEFAULT 0.0;
DEFINE FIELD risk_level ON project TYPE string DEFAULT 'medium'; -- low, medium, high, critical
DEFINE FIELD stakeholders ON project TYPE array<string>;
DEFINE FIELD tags ON project TYPE array<string>;
DEFINE FIELD metadata ON project TYPE object DEFAULT {}; -- flexible additional data
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now() VALUE time::now();

-- Project index for better performance
DEFINE INDEX idx_project_name ON project COLUMNS name;
DEFINE INDEX idx_project_status ON project COLUMNS status;
DEFINE INDEX idx_project_owner ON project COLUMNS owner_id;
DEFINE INDEX idx_project_created ON project COLUMNS created_at;

-- =============================================================================
-- PROJECT WORKFLOWS TABLE
-- =============================================================================

-- Project Workflows: Define phases and activities within projects
DEFINE TABLE project_workflow SCHEMAFULL;
DEFINE FIELD project_id ON project_workflow TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD name ON project_workflow TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project_workflow TYPE string;
DEFINE FIELD workflow_type ON project_workflow TYPE string DEFAULT 'assessment'; -- assessment, planning, implementation, validation, documentation
DEFINE FIELD status ON project_workflow TYPE string DEFAULT 'not_started'; -- not_started, in_progress, completed, blocked, cancelled
DEFINE FIELD priority ON project_workflow TYPE int DEFAULT 5 ASSERT $value >= 1 AND $value <= 10;
DEFINE FIELD estimated_duration_hours ON project_workflow TYPE decimal;
DEFINE FIELD actual_duration_hours ON project_workflow TYPE decimal DEFAULT 0.0;
DEFINE FIELD start_date ON project_workflow TYPE datetime;
DEFINE FIELD target_end_date ON project_workflow TYPE datetime;
DEFINE FIELD actual_end_date ON project_workflow TYPE datetime;
DEFINE FIELD progress_percentage ON project_workflow TYPE int DEFAULT 0 ASSERT $value >= 0 AND $value <= 100;
DEFINE FIELD dependencies ON project_workflow TYPE array<record(project_workflow)>;
DEFINE FIELD assigned_to ON project_workflow TYPE string;
DEFINE FIELD requires_approval ON project_workflow TYPE bool DEFAULT false;
DEFINE FIELD approved_by ON project_workflow TYPE string;
DEFINE FIELD approval_date ON project_workflow TYPE datetime;
DEFINE FIELD deliverables ON project_workflow TYPE array<string>;
DEFINE FIELD notes ON project_workflow TYPE string;
DEFINE FIELD created_at ON project_workflow TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_workflow TYPE datetime DEFAULT time::now() VALUE time::now();

-- Workflow indexes
DEFINE INDEX idx_workflow_project ON project_workflow COLUMNS project_id;
DEFINE INDEX idx_workflow_status ON project_workflow COLUMNS status;
DEFINE INDEX idx_workflow_type ON project_workflow COLUMNS workflow_type;

-- =============================================================================
-- PROJECT TASKS TABLE
-- =============================================================================

-- Project Tasks: Specific actionable items within workflows
DEFINE TABLE project_task SCHEMAFULL;
DEFINE FIELD workflow_id ON project_task TYPE record(project_workflow) ASSERT $value != NONE;
DEFINE FIELD project_id ON project_task TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD name ON project_task TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project_task TYPE string;
DEFINE FIELD task_type ON project_task TYPE string DEFAULT 'general'; -- general, technical, documentation, approval, review
DEFINE FIELD status ON project_task TYPE string DEFAULT 'not_started'; -- not_started, in_progress, completed, blocked, cancelled
DEFINE FIELD priority ON project_task TYPE string DEFAULT 'medium'; -- low, medium, high, critical
DEFINE FIELD assigned_to ON project_task TYPE string;
DEFINE FIELD estimated_hours ON project_task TYPE decimal;
DEFINE FIELD actual_hours ON project_task TYPE decimal DEFAULT 0.0;
DEFINE FIELD due_date ON project_task TYPE datetime;
DEFINE FIELD completed_date ON project_task TYPE datetime;
DEFINE FIELD dependencies ON project_task TYPE array<record(project_task)>;
DEFINE FIELD checklist ON project_task TYPE array<object>; -- [{item: string, completed: bool}]
DEFINE FIELD attachments ON project_task TYPE array<string>; -- file paths or URLs
DEFINE FIELD comments ON project_task TYPE array<object>; -- [{user: string, comment: string, timestamp: datetime}]
DEFINE FIELD created_at ON project_task TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_task TYPE datetime DEFAULT time::now() VALUE time::now();

-- Task indexes
DEFINE INDEX idx_task_project ON project_task COLUMNS project_id;
DEFINE INDEX idx_task_workflow ON project_task COLUMNS workflow_id;
DEFINE INDEX idx_task_status ON project_task COLUMNS status;
DEFINE INDEX idx_task_assigned ON project_task COLUMNS assigned_to;

-- =============================================================================
-- PROJECT RESOURCES TABLE
-- =============================================================================

-- Project Resources: Hardware, software, and human resources assigned to projects
DEFINE TABLE project_resource SCHEMAFULL;
DEFINE FIELD project_id ON project_resource TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD resource_type ON project_resource TYPE string ASSERT $value != NONE; -- hardware, software, human, budget, external
DEFINE FIELD resource_name ON project_resource TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project_resource TYPE string;
DEFINE FIELD quantity ON project_resource TYPE decimal DEFAULT 1.0;
DEFINE FIELD unit ON project_resource TYPE string; -- servers, licenses, hours, days, USD, etc.
DEFINE FIELD cost_per_unit ON project_resource TYPE decimal;
DEFINE FIELD total_cost ON project_resource TYPE decimal;
DEFINE FIELD allocated_date ON project_resource TYPE datetime DEFAULT time::now();
DEFINE FIELD required_date ON project_resource TYPE datetime;
DEFINE FIELD availability_status ON project_resource TYPE string DEFAULT 'available'; -- available, allocated, in_use, unavailable
DEFINE FIELD vendor ON project_resource TYPE string;
DEFINE FIELD specifications ON project_resource TYPE object DEFAULT {}; -- flexible specs data
DEFINE FIELD contact_info ON project_resource TYPE object DEFAULT {}; -- vendor contacts, etc.
DEFINE FIELD notes ON project_resource TYPE string;
DEFINE FIELD created_at ON project_resource TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_resource TYPE datetime DEFAULT time::now() VALUE time::now();

-- Resource indexes
DEFINE INDEX idx_resource_project ON project_resource COLUMNS project_id;
DEFINE INDEX idx_resource_type ON project_resource COLUMNS resource_type;
DEFINE INDEX idx_resource_status ON project_resource COLUMNS availability_status;

-- =============================================================================
-- PROJECT DOCUMENTS TABLE
-- =============================================================================

-- Project Documents: Plans, specifications, reports, etc.
DEFINE TABLE project_document SCHEMAFULL;
DEFINE FIELD project_id ON project_document TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD name ON project_document TYPE string ASSERT $value != NONE;
DEFINE FIELD document_type ON project_document TYPE string DEFAULT 'general'; -- plan, spec, report, diagram, contract, compliance
DEFINE FIELD description ON project_document TYPE string;
DEFINE FIELD content ON project_document TYPE string; -- actual document content or file path
DEFINE FIELD file_path ON project_document TYPE string; -- external file storage path
DEFINE FIELD file_type ON project_document TYPE string; -- pdf, docx, xlsx, png, etc.
DEFINE FIELD file_size ON project_document TYPE int; -- in bytes
DEFINE FIELD version ON project_document TYPE string DEFAULT '1.0';
DEFINE FIELD status ON project_document TYPE string DEFAULT 'draft'; -- draft, review, approved, archived
DEFINE FIELD author ON project_document TYPE string;
DEFINE FIELD reviewer ON project_document TYPE string;
DEFINE FIELD approval_date ON project_document TYPE datetime;
DEFINE FIELD tags ON project_document TYPE array<string>;
DEFINE FIELD is_public ON project_document TYPE bool DEFAULT false;
DEFINE FIELD created_at ON project_document TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_document TYPE datetime DEFAULT time::now() VALUE time::now();

-- Document indexes
DEFINE INDEX idx_document_project ON project_document COLUMNS project_id;
DEFINE INDEX idx_document_type ON project_document COLUMNS document_type;
DEFINE INDEX idx_document_status ON project_document COLUMNS status;

-- =============================================================================
-- PROJECT TIMELINE TABLE
-- =============================================================================

-- Project Timeline: Track milestones and key events
DEFINE TABLE project_milestone SCHEMAFULL;
DEFINE FIELD project_id ON project_milestone TYPE record(project) ASSERT $value != NONE;
DEFINE FIELD name ON project_milestone TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON project_milestone TYPE string;
DEFINE FIELD milestone_type ON project_milestone TYPE string DEFAULT 'general'; -- kickoff, checkpoint, delivery, approval, completion
DEFINE FIELD target_date ON project_milestone TYPE datetime ASSERT $value != NONE;
DEFINE FIELD actual_date ON project_milestone TYPE datetime;
DEFINE FIELD status ON project_milestone TYPE string DEFAULT 'pending'; -- pending, achieved, missed, cancelled
DEFINE FIELD importance ON project_milestone TYPE string DEFAULT 'medium'; -- low, medium, high, critical
DEFINE FIELD dependencies ON project_milestone TYPE array<record(project_milestone)>;
DEFINE FIELD deliverables ON project_milestone TYPE array<string>;
DEFINE FIELD responsible_person ON project_milestone TYPE string;
DEFINE FIELD notes ON project_milestone TYPE string;
DEFINE FIELD created_at ON project_milestone TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project_milestone TYPE datetime DEFAULT time::now() VALUE time::now();

-- Milestone indexes
DEFINE INDEX idx_milestone_project ON project_milestone COLUMNS project_id;
DEFINE INDEX idx_milestone_date ON project_milestone COLUMNS target_date;
DEFINE INDEX idx_milestone_status ON project_milestone COLUMNS status;

-- =============================================================================
-- SAMPLE DATA INSERTION
-- =============================================================================

-- Insert sample project
INSERT INTO project {
    id: project:sample_infrastructure,
    name: "Data Center Migration Project",
    description: "Migration of legacy infrastructure to modern cloud-hybrid environment with enhanced security and scalability",
    project_type: "migration",
    status: "planning",
    priority: "high",
    owner_id: "user:architect01",
    assigned_team: ["user:sysadmin01", "user:netadmin01", "user:secadmin01"],
    start_date: time::now(),
    target_end_date: <datetime>"2025-12-31T23:59:59Z",
    budget_allocated: 250000.00,
    estimated_hours: 2000,
    risk_level: "medium",
    stakeholders: ["CTO", "IT Director", "Security Manager"],
    tags: ["migration", "cloud", "security", "datacenter"],
    metadata: {
        budget_currency: "USD",
        compliance_requirements: ["SOC2", "ISO27001"],
        geographical_scope: ["US-East", "EU-West"]
    }
};

-- Insert sample workflows
INSERT INTO project_workflow {
    id: workflow:assessment_phase,
    project_id: project:sample_infrastructure,
    name: "Infrastructure Assessment",
    description: "Comprehensive analysis of current infrastructure components and dependencies",
    workflow_type: "assessment",
    status: "in_progress",
    priority: 9,
    estimated_duration_hours: 160,
    start_date: time::now(),
    target_end_date: <datetime>"2025-09-30T23:59:59Z",
    progress_percentage: 25,
    assigned_to: "user:architect01",
    deliverables: ["Infrastructure Inventory", "Dependency Map", "Risk Assessment Report"],
    notes: "Focus on legacy system identification and security vulnerabilities"
};

INSERT INTO project_workflow {
    id: workflow:migration_planning,
    project_id: project:sample_infrastructure,
    name: "Migration Planning",
    description: "Strategic planning for seamless application and data migration",
    workflow_type: "planning",
    status: "not_started",
    priority: 8,
    estimated_duration_hours: 120,
    dependencies: [workflow:assessment_phase],
    assigned_to: "user:architect01",
    deliverables: ["Migration Strategy", "Timeline", "Resource Requirements"],
    requires_approval: true
};
