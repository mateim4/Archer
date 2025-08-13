pub mod hardware_baskets;

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
        .nest("/api",
            Router::new()
                .merge(crate::hardware_basket_api::hardware_basket_routes())
        )
        .with_state(state)
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0"
    }))
}
