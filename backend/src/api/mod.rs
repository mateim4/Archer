pub mod hardware_baskets;
pub mod project_workflow;
pub mod project_lifecycle;
pub mod hardware_pool;
pub mod rvtools;
pub mod cluster_strategy;
pub mod wizard; // Activity wizard API
// pub mod analytics; // TODO: Convert from actix_web to axum
pub mod enhanced_rvtools; // TODO: Fix compilation errors
// pub mod migration; // TODO: Fix migration_models imports

use axum::{
    routing::get,
    Router, Json,
};
use std::sync::Arc;
use crate::database::Database;
use crate::database::AppState;
use crate::utils::api_response::{ApiResponse, helpers};

pub fn api_router(state: AppState) -> Router {
    // API v1 routes with proper versioning
    let v1_routes = Router::new()
        .merge(hardware_baskets::routes().with_state(state.clone()))
        .merge(project_workflow::routes().with_state(state.clone()))
        .merge(cluster_strategy::routes().with_state(state.clone()))
        .merge(wizard::wizard_routes().with_state(state.clone())) // Activity wizard routes
        .nest("/hardware-pool", hardware_pool::create_hardware_pool_router(state.clone()))
        .nest("/rvtools", rvtools::create_rvtools_router(state.clone()))
        .nest("/enhanced-rvtools", enhanced_rvtools::create_enhanced_rvtools_router(state.clone()))
        .nest("/project-lifecycle", project_lifecycle::create_project_lifecycle_router(state.clone()));
    
    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1", v1_routes)
        // Legacy API routes for backward compatibility
        .merge(hardware_baskets::routes().with_state(state.clone()))
        .nest("/api/hardware-pool", hardware_pool::create_hardware_pool_router(state.clone()))
        .nest("/api/rvtools", rvtools::create_rvtools_router(state.clone()))
        .nest("/api/enhanced-rvtools", enhanced_rvtools::create_enhanced_rvtools_router(state.clone()))
        .nest("/api/project-lifecycle", project_lifecycle::create_project_lifecycle_router(state.clone()))
}

async fn health_check() -> ApiResponse<serde_json::Value> {
    helpers::ok(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0",
        "api_version": "v1"
    }))
}
