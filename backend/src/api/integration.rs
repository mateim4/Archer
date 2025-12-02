use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Router,
};
use std::sync::Arc;
use serde_json::json;
use crate::database::Database;
use crate::services::integration_hub::{
    IntegrationConfig, ProviderType, NutanixClient, IntegrationConnector
};

pub fn create_integration_router(db: Arc<Database>) -> Router {
    let db_clone = db.clone();
    Router::new()
        .route("/scan", post(move |body| async move {
            trigger_scan(db_clone, body).await
        }))
}


#[derive(serde::Deserialize)]
pub struct ScanRequest {
    pub provider_type: ProviderType,
    pub config: IntegrationConfig,
}

async fn trigger_scan(
    db: Arc<Database>,
    Json(payload_value): Json<serde_json::Value>,
) -> impl IntoResponse {
    // Manual deserialization to avoid Axum extractor issues
    let payload: ScanRequest = match serde_json::from_value(payload_value) {
        Ok(p) => p,
        Err(e) => return (StatusCode::BAD_REQUEST, Json(json!({ "error": format!("Invalid request: {}", e) }))).into_response(),
    };

    // In a real app, we would look up the config from the DB using an ID.
    // For now, we accept the config in the payload for testing.

    let connector: Box<dyn IntegrationConnector> = match payload.provider_type {
        ProviderType::NutanixPrism => Box::new(NutanixClient::new(payload.config)),
        _ => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Unsupported provider type" }))).into_response(),
    };

    let inventory_result = connector.fetch_inventory().await.map_err(|e| e.to_string());

    match inventory_result {
        Ok(assets) => {
            let mut saved_count = 0;
            for asset in &assets {
                // Determine table based on asset type
                let table = match asset.asset_type.as_str() {
                    "CLUSTER" => "nutanix_cluster",
                    "VM" => "virtual_machine",
                    _ => "discovered_asset",
                };

                // Create record
                let record = json!({
                    "name": asset.name,
                    "external_id": asset.external_id,
                    "raw_data": asset.raw_data,
                    "last_sync": chrono::Utc::now(),
                    "source": "nutanix_integration"
                });

                // Upsert logic
                // We use query to perform an UPSERT-like operation using type::thing to handle special chars in IDs
                let sql = "UPDATE type::thing($table, $id) CONTENT $data";
                
                match db.query(sql)
                    .bind(("table", table))
                    .bind(("id", asset.external_id.as_str()))
                    .bind(("data", record))
                    .await {
                    Ok(_) => saved_count += 1,
                    Err(e) => println!("Failed to save asset {}: {}", asset.name, e),
                }
            }

            (StatusCode::OK, Json(json!({ 
                "message": "Scan completed successfully", 
                "assets_found": assets.len(),
                "assets_saved": saved_count,
                "details": assets
            }))).into_response()
        },
        Err(e) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e }))).into_response()
        }
    }
}



