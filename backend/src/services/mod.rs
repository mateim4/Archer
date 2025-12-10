// Authentication & Authorization (Phase 0)
pub mod auth_service;

// Core ITSM Services (Phase 1)
pub mod sla_service;
pub mod ticket_service;

// Knowledge Base (Phase 1.5)
pub mod knowledge_service;

// CMDB/Assets (Phase 2)
pub mod cmdb_service;

// Workflow Engine (Phase 3)
pub mod workflow_engine_service;

// Monitoring & Alerting (Phase 4)
pub mod monitoring_service;

pub mod dependency_validator;
pub mod document_service;
pub mod enhanced_rvtools_service; // TODO: Fix compilation errors
pub mod hardware_pool_service;
pub mod integration_hub;
pub mod migration_wizard_service;
pub mod project_management_service;
pub mod rvtools_service;
// pub mod analytics_service; // TODO: Fix compilation errors
// pub mod reporting_service; // TODO: Fix compilation errors

// Activity Wizard Services
pub mod capacity_validation_service;
pub mod capacity_planner_service;
pub mod hardware_compatibility_service;
pub mod timeline_estimation_service;
pub mod wizard_service;
pub mod vm_placement_service;
pub mod network_template_service;
pub mod hld_generation_service;

// HLD Generation Services (Week 1)
pub mod variable_validator;
pub mod variable_definitions;

// HLD Generation Services (Week 2)
pub mod rvtools_hld_mapper;

// HLD Generation Services (Week 3)
pub mod word_generator;
