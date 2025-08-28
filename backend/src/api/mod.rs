pub mod hardware_baskets;
pub mod project_workflow;
pub mod hardware_pool;
pub mod rvtools;
pub mod analytics;

use axum::{
    routing::get,
    Router, Json,
};
use std::sync::Arc;
use crate::database::Database;
use crate::migration_api;

use crate::database::AppState;

pub fn api_router(state: AppState) -> Router {
    
    Router::new()
        .route("/health", get(health_check))
        .merge(hardware_baskets::routes().with_state(state.clone()))
        .merge(migration_api::routes().with_state(state.clone()))
        .merge(project_workflow::routes().with_state(state.clone()))
        .nest("/api/hardware-pool", hardware_pool::create_hardware_pool_router(state.clone()))
        .nest("/api/rvtools", rvtools::create_rvtools_router(state.clone()))
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0"
    }))
}
