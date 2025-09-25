pub mod hardware_baskets;
pub mod project_workflow;
pub mod project_lifecycle;
pub mod hardware_pool;
pub mod rvtools;
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

pub fn api_router(state: AppState) -> Router {
    
    Router::new()
        .route("/health", get(health_check))
        .merge(hardware_baskets::routes().with_state(state.clone()))
        // .merge(migration::routes().with_state(state.clone())) // TODO: Fix migration_models imports
        .merge(project_workflow::routes().with_state(state.clone()))
        .nest("/api/hardware-pool", hardware_pool::create_hardware_pool_router(state.clone()))
        .nest("/api/rvtools", rvtools::create_rvtools_router(state.clone()))
        .nest("/api/enhanced-rvtools", enhanced_rvtools::create_enhanced_rvtools_router(state.clone())) // TODO: Fix compilation errors
        .nest("/api/project-lifecycle", project_lifecycle::create_project_lifecycle_router(state.clone()))
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0"
    }))
}
