# 🚀 Phase 1 Implementation: Backend Foundation

## Week 1 Task 1: Enhanced SurrealDB Schema

### Objective
Extend the existing SurrealDB schema to support project-workflow management, hardware pool tracking, and document libraries while preserving existing hardware basket data.

### Schema Extensions

```sql
-- =============================================================================
-- PROJECT MANAGEMENT SCHEMA
-- =============================================================================

-- Projects: Main container for infrastructure activities
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string;
DEFINE FIELD description ON project TYPE string;
DEFINE FIELD project_type ON project TYPE string; -- "vmware_migration", "lifecycle_planning", "new_solution", "hardware_refresh"
DEFINE FIELD status ON project TYPE string; -- "planning", "active", "on_hold", "completed", "cancelled"
DEFINE FIELD priority ON project TYPE string; -- "low", "medium", "high", "critical"
DEFINE FIELD start_date ON project TYPE datetime;
DEFINE FIELD target_end_date ON project TYPE datetime;
DEFINE FIELD actual_end_date ON project TYPE datetime;
DEFINE FIELD progress_percentage ON project TYPE int DEFAULT 0;
DEFINE FIELD created_by ON project TYPE string;
DEFINE FIELD assigned_team ON project TYPE array<string>;
DEFINE FIELD metadata ON project TYPE object; -- Flexible metadata storage
DEFINE FIELD created_at ON project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON project TYPE datetime DEFAULT time::now();

-- Workflows: Individual phases/activities within projects  
DEFINE TABLE workflow SCHEMAFULL;
DEFINE FIELD project_id ON workflow TYPE record<project>;
DEFINE FIELD name ON workflow TYPE string;
DEFINE FIELD description ON workflow TYPE string;
DEFINE FIELD workflow_type ON workflow TYPE string; -- "migration_wave", "hardware_procurement", "lifecycle_planning", "commissioning", "decommissioning"
DEFINE FIELD duration_days ON workflow TYPE int;
DEFINE FIELD start_date ON workflow TYPE datetime;
DEFINE FIELD end_date ON workflow TYPE datetime;
DEFINE FIELD dependencies ON workflow TYPE array<record<workflow>>; -- Workflow dependencies
DEFINE FIELD dependency_type ON workflow TYPE string; -- "finish_to_start", "start_to_start", "finish_to_finish"
DEFINE FIELD lag_days ON workflow TYPE int DEFAULT 0; -- Lag/lead time in days
DEFINE FIELD status ON workflow TYPE string; -- "not_started", "in_progress", "completed", "blocked", "cancelled"
DEFINE FIELD progress_percentage ON workflow TYPE int DEFAULT 0;
DEFINE FIELD assigned_to ON workflow TYPE array<string>;
DEFINE FIELD wizard_state ON workflow TYPE object; -- Saved wizard configuration/progress
DEFINE FIELD hardware_requirements ON workflow TYPE object; -- Hardware needs for this workflow
DEFINE FIELD created_at ON workflow TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON workflow TYPE datetime DEFAULT time::now();

-- Workflow Templates: Reusable workflow definitions
DEFINE TABLE workflow_template SCHEMAFULL;
DEFINE FIELD name ON workflow_template TYPE string;
DEFINE FIELD description ON workflow_template TYPE string;
DEFINE FIELD workflow_type ON workflow_template TYPE string;
DEFINE FIELD template_data ON workflow_template TYPE object; -- Template configuration
DEFINE FIELD default_duration_days ON workflow_template TYPE int;
DEFINE FIELD required_dependencies ON workflow_template TYPE array<string>;
DEFINE FIELD created_at ON workflow_template TYPE datetime DEFAULT time::now();

-- =============================================================================
-- HARDWARE POOL MANAGEMENT SCHEMA  
-- =============================================================================

-- Server Inventory: Physical servers and their lifecycle
DEFINE TABLE server_inventory SCHEMAFULL;
DEFINE FIELD server_name ON server_inventory TYPE string;
DEFINE FIELD serial_number ON server_inventory TYPE string;
DEFINE FIELD asset_tag ON server_inventory TYPE string;
DEFINE FIELD hardware_model_id ON server_inventory TYPE record<hardware_lot>; -- Link to hardware basket
DEFINE FIELD location ON server_inventory TYPE string; -- Datacenter/rack location
DEFINE FIELD status ON server_inventory TYPE string; -- "available", "allocated", "maintenance", "decommissioned"
DEFINE FIELD condition ON server_inventory TYPE string; -- "new", "good", "fair", "end_of_life"
DEFINE FIELD allocated_to_project ON server_inventory TYPE record<project>;
DEFINE FIELD allocated_to_workflow ON server_inventory TYPE record<workflow>;
DEFINE FIELD allocation_start ON server_inventory TYPE datetime;
DEFINE FIELD allocation_end ON server_inventory TYPE datetime;
DEFINE FIELD procurement_date ON server_inventory TYPE datetime;
DEFINE FIELD warranty_start ON server_inventory TYPE datetime;
DEFINE FIELD warranty_end ON server_inventory TYPE datetime;
DEFINE FIELD purchase_price ON server_inventory TYPE decimal;
DEFINE FIELD depreciation_rate ON server_inventory TYPE decimal;
DEFINE FIELD specifications ON server_inventory TYPE object; -- Detailed specs
DEFINE FIELD maintenance_history ON server_inventory TYPE array<object>;
DEFINE FIELD created_at ON server_inventory TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON server_inventory TYPE datetime DEFAULT time::now();

-- Hardware Pool: Availability tracking and forecasting
DEFINE TABLE hardware_pool_status SCHEMAFULL;
DEFINE FIELD server_id ON hardware_pool_status TYPE record<server_inventory>;
DEFINE FIELD available_from ON hardware_pool_status TYPE datetime;
DEFINE FIELD available_until ON hardware_pool_status TYPE datetime;
DEFINE FIELD reservation_project ON hardware_pool_status TYPE record<project>;
DEFINE FIELD reservation_notes ON hardware_pool_status TYPE string;
DEFINE FIELD created_at ON hardware_pool_status TYPE datetime DEFAULT time::now();

-- Procurement Pipeline: Track hardware orders and delivery
DEFINE TABLE procurement_request SCHEMAFULL;
DEFINE FIELD project_id ON procurement_request TYPE record<project>;
DEFINE FIELD workflow_id ON procurement_request TYPE record<workflow>;
DEFINE FIELD request_name ON procurement_request TYPE string;
DEFINE FIELD hardware_items ON procurement_request TYPE array<object>; -- Items to procure
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

-- =============================================================================
-- RVTOOLS DATA MANAGEMENT SCHEMA
-- =============================================================================

-- RVTools Imports: Track and store RVTools analysis data
DEFINE TABLE rvtools_import SCHEMAFULL;
DEFINE FIELD project_id ON rvtools_import TYPE record<project>;
DEFINE FIELD filename ON rvtools_import TYPE string;
DEFINE FIELD file_size ON rvtools_import TYPE int;
DEFINE FIELD import_date ON rvtools_import TYPE datetime;
DEFINE FIELD imported_by ON rvtools_import TYPE string;
DEFINE FIELD processing_status ON rvtools_import TYPE string; -- "processing", "completed", "failed"
DEFINE FIELD error_message ON rvtools_import TYPE string;

-- Parsed environment data
DEFINE FIELD total_vms ON rvtools_import TYPE int;
DEFINE FIELD total_hosts ON rvtools_import TYPE int;
DEFINE FIELD total_clusters ON rvtools_import TYPE int;
DEFINE FIELD environment_summary ON rvtools_import TYPE object; -- High-level metrics
DEFINE FIELD clusters_data ON rvtools_import TYPE array<object>; -- Detailed cluster information
DEFINE FIELD selected_clusters ON rvtools_import TYPE array<string>; -- User-selected clusters for processing
DEFINE FIELD capacity_analysis ON rvtools_import TYPE object; -- Capacity requirements analysis
DEFINE FIELD hardware_recommendations ON rvtools_import TYPE array<object>; -- Generated hardware suggestions

DEFINE FIELD raw_data_path ON rvtools_import TYPE string; -- Path to raw imported data file
DEFINE FIELD created_at ON rvtools_import TYPE datetime DEFAULT time::now();

-- =============================================================================
-- DOCUMENT LIBRARY SCHEMA
-- =============================================================================

-- Project Documents: Generated and uploaded documents per project
DEFINE TABLE project_document SCHEMAFULL;
DEFINE FIELD project_id ON project_document TYPE record<project>;
DEFINE FIELD workflow_id ON project_document TYPE record<workflow>; -- Optional workflow association
DEFINE FIELD document_type ON project_document TYPE string; -- "HLD", "LLD", "migration_plan", "hardware_bom", "network_diagram"
DEFINE FIELD document_name ON project_document TYPE string;
DEFINE FIELD file_path ON project_document TYPE string; -- File system path
DEFINE FIELD file_size ON project_document TYPE int;
DEFINE FIELD version ON project_document TYPE string;
DEFINE FIELD status ON project_document TYPE string; -- "draft", "review", "approved", "archived"
DEFINE FIELD generated_from_template ON project_document TYPE string; -- Template used for generation
DEFINE FIELD generation_config ON project_document TYPE object; -- Config used for generation
DEFINE FIELD generated_at ON project_document TYPE datetime;
DEFINE FIELD generated_by ON project_document TYPE string;
DEFINE FIELD approved_by ON project_document TYPE string;
DEFINE FIELD approval_date ON project_document TYPE datetime;
DEFINE FIELD metadata ON project_document TYPE object; -- Document metadata
DEFINE FIELD created_at ON project_document TYPE datetime DEFAULT time::now();

-- Document Templates: Store and manage document templates
DEFINE TABLE document_template SCHEMAFULL;
DEFINE FIELD template_name ON document_template TYPE string;
DEFINE FIELD template_type ON document_template TYPE string; -- "HLD", "LLD", "migration_plan", "custom"
DEFINE FIELD description ON document_template TYPE string;
DEFINE FIELD template_file_path ON document_template TYPE string;
DEFINE FIELD version ON document_template TYPE string;
DEFINE FIELD style_config ON document_template TYPE object; -- Extracted styling information
DEFINE FIELD placeholder_map ON document_template TYPE object; -- Placeholder definitions
DEFINE FIELD table_structures ON document_template TYPE array<object>; -- Table template definitions
DEFINE FIELD is_default ON document_template TYPE bool DEFAULT false;
DEFINE FIELD created_at ON document_template TYPE datetime DEFAULT time::now();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Project indexes
DEFINE INDEX idx_project_status ON project COLUMNS status;
DEFINE INDEX idx_project_type ON project COLUMNS project_type;
DEFINE INDEX idx_project_dates ON project COLUMNS start_date, target_end_date;

-- Workflow indexes
DEFINE INDEX idx_workflow_project ON workflow COLUMNS project_id;
DEFINE INDEX idx_workflow_status ON workflow COLUMNS status;
DEFINE INDEX idx_workflow_type ON workflow COLUMNS workflow_type;

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
```

### Migration Strategy

1. **Preserve Existing Data**: All current hardware basket data remains intact
2. **Additive Schema**: Only adding new tables, not modifying existing ones
3. **Gradual Migration**: Implement new features alongside existing functionality
4. **Data Integrity**: Use foreign keys and constraints to maintain relationships

### API Endpoint Planning

```rust
// Project Management API endpoints
POST   /api/projects                    // Create new project
GET    /api/projects                    // List projects with filtering
GET    /api/projects/{id}               // Get project details
PUT    /api/projects/{id}               // Update project
DELETE /api/projects/{id}               // Delete project

POST   /api/projects/{id}/workflows     // Add workflow to project
GET    /api/projects/{id}/workflows     // Get project workflows
PUT    /api/workflows/{id}              // Update workflow
DELETE /api/workflows/{id}              // Delete workflow

// Hardware Pool API endpoints
GET    /api/hardware-pool               // Get available hardware
POST   /api/hardware-pool/allocate     // Allocate hardware to project
POST   /api/hardware-pool/release      // Release hardware back to pool
GET    /api/hardware-pool/availability // Check hardware availability

// Document Library API endpoints
GET    /api/projects/{id}/documents     // Get project documents
POST   /api/projects/{id}/documents/generate // Generate new document
GET    /api/documents/{id}/download     // Download document
DELETE /api/documents/{id}              // Delete document

// RVTools API endpoints
POST   /api/projects/{id}/rvtools/upload    // Upload RVTools file
GET    /api/projects/{id}/rvtools/analysis  // Get analysis results
POST   /api/projects/{id}/rvtools/recommendations // Get hardware recommendations
```

### Next Steps

1. Apply this schema to your SurrealDB instance
2. Create Rust data models matching these tables
3. Implement basic CRUD API endpoints
4. Test with existing hardware basket data integration

This foundation will support all the workflow-centric features while maintaining your existing hardware basket functionality.
