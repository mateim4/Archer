pub mod auth; // Authentication API (Phase 0)
pub mod capacity;
pub mod cluster_strategy;
pub mod cmdb; // CMDB API (Phase 2)
pub mod destination_clusters;
pub mod hardware_pool;
pub mod knowledge; // Knowledge Base API (Phase 1.5)
pub mod migration_wizard; // Migration Planning Wizard API
pub mod project_lifecycle;
pub mod project_workflow;
pub mod rvtools;
pub mod service_catalog; // Service Catalog API (Phase 5)
pub mod settings; // Global settings API
pub mod tickets; // Tickets API
pub mod assets; // CMDB Assets API
pub mod monitoring; // Monitoring API
pub mod integration; // Integration Hub API
pub mod wizard; // Activity wizard API
pub mod vm_placement; // VM placement API
pub mod network_templates; // Network templates API
pub mod hld; // HLD generation API
pub mod workflows; // Workflow Engine API (Phase 3)
                // pub mod analytics; // TODO: Convert from actix_web to axum
pub mod enhanced_rvtools; // TODO: Fix compilation errors
                          // pub mod migration; // TODO: Fix migration_models imports

use crate::database::AppState;
use crate::database::Database;
use crate::utils::api_response::{helpers, ApiResponse};
use axum::{routing::get, Json, Router};
use std::sync::Arc;

pub fn api_router(state: AppState) -> Router {
    // API v1 routes with proper versioning
    let v1_routes = Router::new()
        // Authentication routes (public + protected)
        .nest("/auth", auth::create_auth_router(state.clone()))
        .merge(project_workflow::routes().with_state(state.clone()))
        .merge(cluster_strategy::routes().with_state(state.clone()))
        .merge(wizard::wizard_routes().with_state(state.clone())) // Activity wizard routes
        .nest(
            "/hardware-pool",
            hardware_pool::create_hardware_pool_router(state.clone()),
        )
        .nest(
            "/destination-clusters",
            destination_clusters::create_destination_clusters_router(state.clone()),
        )
        .nest("/capacity", capacity::create_capacity_router(state.clone()))
        .nest("/rvtools", rvtools::create_rvtools_router(state.clone()))
        .nest(
            "/enhanced-rvtools",
            enhanced_rvtools::create_enhanced_rvtools_router(state.clone()),
        )
        .nest(
            "/project-lifecycle",
            project_lifecycle::create_project_lifecycle_router(state.clone()),
        )
        .nest("/vm-placement", vm_placement::create_vm_placement_router(state.clone()))
        .nest("/network-templates", network_templates::create_network_templates_router(state.clone()))
        .nest("/hld", hld::create_hld_router(state.clone()))
        .nest("/migration-wizard", migration_wizard::create_migration_wizard_router(state.clone()))
        .nest("/tickets", tickets::create_tickets_router(state.clone()))
        .nest("/knowledge", knowledge::knowledge_routes().with_state(state.clone()))
        .nest("/cmdb", cmdb::cmdb_routes().with_state(state.clone()))
        .nest("/assets", assets::create_assets_router(state.clone()))
        .nest("/monitoring", monitoring::routes(state.clone()))
        .nest("/integration", integration::create_integration_router(state.clone()))
        .nest("/settings", settings::create_settings_router(state.clone()))
        .nest("/workflows", workflows::create_workflows_router(state.clone()))
        .nest("/catalog", service_catalog::create_service_catalog_router(state.clone()));

    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1", v1_routes)
        // Legacy API routes for backward compatibility
        .nest(
            "/api/hardware-pool",
            hardware_pool::create_hardware_pool_router(state.clone()),
        )
        .nest(
            "/api/rvtools",
            rvtools::create_rvtools_router(state.clone()),
        )
        .nest(
            "/api/enhanced-rvtools",
            enhanced_rvtools::create_enhanced_rvtools_router(state.clone()),
        )
        .nest(
            "/api/project-lifecycle",
            project_lifecycle::create_project_lifecycle_router(state.clone()),
        )
}

async fn health_check() -> ApiResponse<serde_json::Value> {
    helpers::ok(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0",
        "api_version": "v1"
    }))
}
