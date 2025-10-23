pub mod dependency_validator;
pub mod document_service;
pub mod enhanced_rvtools_service; // TODO: Fix compilation errors
pub mod hardware_pool_service;
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
