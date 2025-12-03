use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::sql::Thing;
use crate::database::Database;

#[derive(Debug, Serialize, Deserialize)]
pub struct Asset {
    pub id: Option<Thing>,
    pub name: String,
    pub asset_type: String, // CLUSTER, HOST, VM, SWITCH
    pub status: Option<String>, // HEALTHY, WARNING, CRITICAL
    pub external_id: Option<String>,
    pub raw_data: Option<serde_json::Value>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AssetFilter {
    pub asset_type: Option<String>,
    pub status: Option<String>,
}

pub fn create_assets_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_assets))
        .route("/:id", get(get_asset))
        .with_state(db)
}

async fn list_assets(
    State(db): State<Arc<Database>>,
    Query(filter): Query<AssetFilter>,
) -> impl IntoResponse {
    // For now, we primarily query the 'nutanix_cluster' table as our main asset source
    // In a real CMDB, this would query a unified 'asset' table or union multiple tables
    
    let mut query = "SELECT * FROM nutanix_cluster".to_string();
    
    // Simple filtering (in a real app, use parameterized queries for WHERE clauses)
    // This is a simplified implementation for the prototype
    
    match db.query(&query).await {
        Ok(mut response) => {
            // SurrealDB returns a list of results. We take the first one.
            let assets: Vec<Asset> = match response.take(0) {
                Ok(a) => a,
                Err(_) => vec![],
            };
            
            // Manual filtering since we didn't do it in SQL for this quick prototype
            let filtered: Vec<Asset> = assets.into_iter().filter(|a| {
                if let Some(t) = &filter.asset_type {
                    if &a.asset_type != t { return false; }
                }
                true
            }).collect();

            (StatusCode::OK, Json(filtered)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_asset(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    // Try to fetch from nutanix_cluster first
    // ID format might be "nutanix_cluster:uuid" or just "uuid"
    
    let sql = "SELECT * FROM nutanix_cluster WHERE id = $id OR external_id = $id";
    
    match db.query(sql).bind(("id", id)).await {
        Ok(mut response) => {
            let asset: Option<Asset> = response.take(0).ok().and_then(|v: Vec<Asset>| v.into_iter().next());
            match asset {
                Some(a) => (StatusCode::OK, Json(a)).into_response(),
                None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Asset not found" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}
