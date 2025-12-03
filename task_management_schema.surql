// Task Management Database Schema for Archer
// Aligned with ITIL/ITSM practices for infrastructure lifecycle management
// Phase 1: Core Task Schema

// =============================================================================
// 1. TASK TABLE
// =============================================================================
// Core task management table supporting ITIL-aligned task categories
DEFINE TABLE task SCHEMAFULL;

// Core identification
DEFINE FIELD title ON task TYPE string ASSERT $value != NONE AND $value != '';
DEFINE FIELD description ON task TYPE option<string>;

// ITIL-aligned categorization
DEFINE FIELD category ON task TYPE string ASSERT $value INSIDE ['incident', 'service_request', 'change', 'problem', 'maintenance', 'migration', 'deployment', 'decommission', 'other'];
DEFINE FIELD status ON task TYPE string DEFAULT 'draft' ASSERT $value INSIDE ['draft', 'pending', 'in_progress', 'on_hold', 'blocked', 'completed', 'cancelled'];
DEFINE FIELD priority ON task TYPE string DEFAULT 'medium' ASSERT $value INSIDE ['low', 'medium', 'high', 'critical'];

// Assignment and ownership
DEFINE FIELD assignee_id ON task TYPE option<string>;
DEFINE FIELD assignee_name ON task TYPE option<string>;
DEFINE FIELD reporter_id ON task TYPE string ASSERT $value != NONE;
DEFINE FIELD reporter_name ON task TYPE option<string>;

// Project association (optional - tasks can exist independently)
DEFINE FIELD project_id ON task TYPE option<record<project>>;
DEFINE FIELD project_name ON task TYPE option<string>;

// Timing
DEFINE FIELD due_date ON task TYPE option<datetime>;
DEFINE FIELD started_at ON task TYPE option<datetime>;
DEFINE FIELD completed_at ON task TYPE option<datetime>;
DEFINE FIELD created_at ON task TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON task TYPE datetime DEFAULT time::now();

// Effort tracking
DEFINE FIELD estimated_hours ON task TYPE option<float>;
DEFINE FIELD actual_hours ON task TYPE option<float>;

// Flexible tagging
DEFINE FIELD tags ON task TYPE array DEFAULT [];

// Task hierarchy and relationships
DEFINE FIELD parent_task_id ON task TYPE option<record<task>>;
DEFINE FIELD related_task_ids ON task TYPE array DEFAULT [];

// Additional notes/comments
DEFINE FIELD notes ON task TYPE option<string>;

// Indexes for fast lookups
DEFINE INDEX idx_task_status ON task COLUMNS status;
DEFINE INDEX idx_task_priority ON task COLUMNS priority;
DEFINE INDEX idx_task_category ON task COLUMNS category;
DEFINE INDEX idx_task_assignee ON task COLUMNS assignee_id;
DEFINE INDEX idx_task_project ON task COLUMNS project_id;
DEFINE INDEX idx_task_due_date ON task COLUMNS due_date;
DEFINE INDEX idx_task_created ON task COLUMNS created_at;

// =============================================================================
// 2. TASK COMMENT TABLE
// =============================================================================
// Comments/updates on tasks
DEFINE TABLE task_comment SCHEMAFULL;

DEFINE FIELD task_id ON task_comment TYPE record<task>;
DEFINE FIELD user_id ON task_comment TYPE string ASSERT $value != NONE;
DEFINE FIELD user_name ON task_comment TYPE option<string>;
DEFINE FIELD content ON task_comment TYPE string ASSERT $value != NONE AND $value != '';
DEFINE FIELD created_at ON task_comment TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON task_comment TYPE datetime DEFAULT time::now();

// Index for fast task comment lookups
DEFINE INDEX idx_task_comment_task ON task_comment COLUMNS task_id;
DEFINE INDEX idx_task_comment_user ON task_comment COLUMNS user_id;

// =============================================================================
// 3. TASK ATTACHMENT TABLE
// =============================================================================
// File attachments for tasks
DEFINE TABLE task_attachment SCHEMAFULL;

DEFINE FIELD task_id ON task_attachment TYPE record<task>;
DEFINE FIELD filename ON task_attachment TYPE string ASSERT $value != NONE;
DEFINE FIELD file_path ON task_attachment TYPE string ASSERT $value != NONE;
DEFINE FIELD file_size ON task_attachment TYPE int;
DEFINE FIELD file_type ON task_attachment TYPE option<string>;
DEFINE FIELD uploaded_by ON task_attachment TYPE string ASSERT $value != NONE;
DEFINE FIELD created_at ON task_attachment TYPE datetime DEFAULT time::now();

// Index for fast attachment lookups
DEFINE INDEX idx_task_attachment_task ON task_attachment COLUMNS task_id;

// =============================================================================
// 4. TASK HISTORY TABLE
// =============================================================================
// Audit trail for task changes
DEFINE TABLE task_history SCHEMAFULL;

DEFINE FIELD task_id ON task_history TYPE record<task>;
DEFINE FIELD user_id ON task_history TYPE string ASSERT $value != NONE;
DEFINE FIELD user_name ON task_history TYPE option<string>;
DEFINE FIELD action ON task_history TYPE string ASSERT $value INSIDE ['created', 'updated', 'status_changed', 'assigned', 'commented', 'attachment_added', 'deleted'];
DEFINE FIELD field_name ON task_history TYPE option<string>;
DEFINE FIELD old_value ON task_history TYPE option<string>;
DEFINE FIELD new_value ON task_history TYPE option<string>;
DEFINE FIELD details ON task_history TYPE option<string>;
DEFINE FIELD created_at ON task_history TYPE datetime DEFAULT time::now();

// Index for fast history lookups
DEFINE INDEX idx_task_history_task ON task_history COLUMNS task_id;
DEFINE INDEX idx_task_history_created ON task_history COLUMNS created_at;

// =============================================================================
// 5. TASK TEMPLATE TABLE
// =============================================================================
// Reusable task templates for common operations
DEFINE TABLE task_template SCHEMAFULL;

DEFINE FIELD name ON task_template TYPE string ASSERT $value != NONE AND $value != '';
DEFINE FIELD description ON task_template TYPE option<string>;
DEFINE FIELD category ON task_template TYPE string ASSERT $value INSIDE ['incident', 'service_request', 'change', 'problem', 'maintenance', 'migration', 'deployment', 'decommission', 'other'];
DEFINE FIELD default_priority ON task_template TYPE string DEFAULT 'medium' ASSERT $value INSIDE ['low', 'medium', 'high', 'critical'];
DEFINE FIELD estimated_hours ON task_template TYPE option<float>;
DEFINE FIELD tags ON task_template TYPE array DEFAULT [];
DEFINE FIELD checklist ON task_template TYPE array DEFAULT []; // Array of checklist items
DEFINE FIELD is_active ON task_template TYPE bool DEFAULT true;
DEFINE FIELD created_by ON task_template TYPE string ASSERT $value != NONE;
DEFINE FIELD created_at ON task_template TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON task_template TYPE datetime DEFAULT time::now();

// Index for template lookups
DEFINE INDEX idx_task_template_category ON task_template COLUMNS category;
DEFINE INDEX idx_task_template_active ON task_template COLUMNS is_active;

// =============================================================================
// SAMPLE DATA (Optional - for development/testing)
// =============================================================================
// Uncomment to populate with sample tasks

/*
CREATE task SET
  title = 'Network Switch Maintenance',
  description = 'Scheduled maintenance for core network switches in DC1',
  category = 'maintenance',
  status = 'pending',
  priority = 'high',
  reporter_id = 'user:admin',
  reporter_name = 'System Administrator',
  due_date = time::now() + 7d,
  estimated_hours = 4,
  tags = ['network', 'scheduled'];

CREATE task SET
  title = 'Server Migration - Web Tier',
  description = 'Migrate web application servers from VMware to Hyper-V cluster',
  category = 'migration',
  status = 'in_progress',
  priority = 'critical',
  reporter_id = 'user:admin',
  reporter_name = 'System Administrator',
  assignee_id = 'user:john.doe',
  assignee_name = 'John Doe',
  started_at = time::now(),
  due_date = time::now() + 14d,
  estimated_hours = 40,
  tags = ['vmware', 'hyperv', 'migration'];

CREATE task SET
  title = 'Firewall Rule Change Request',
  description = 'Add new firewall rule to allow traffic from partner network',
  category = 'change',
  status = 'draft',
  priority = 'medium',
  reporter_id = 'user:jane.smith',
  reporter_name = 'Jane Smith',
  tags = ['firewall', 'security', 'network'];
*/
