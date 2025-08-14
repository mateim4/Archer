pub mod hardware_baskets;

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
        .nest("/api", hardware_baskets::routes())
        .nest("/api", migration_api::routes())
        .with_state(state)
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0"
    }))
}
