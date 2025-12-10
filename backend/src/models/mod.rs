// Models are now defined in core-engine crate for consistency
pub mod auth;  // Authentication & RBAC models (Phase 0)
pub mod cmdb;  // CMDB/Asset models (Phase 2)
pub mod hld;
pub mod knowledge;  // Knowledge Base models (Phase 1.5)
pub mod migration_models;
pub mod migration_wizard_models;
pub mod monitoring;  // Monitoring & Alerting models (Phase 4)
pub mod project_models;
pub mod service_catalog;  // Service Catalog models (Phase 5)
pub mod settings;
pub mod settings_models;
pub mod team;  // Team Management models (Phase 1+)
pub mod workflow;
pub mod ticket;
pub mod workflow_engine;  // Workflow Engine models (Phase 3)
