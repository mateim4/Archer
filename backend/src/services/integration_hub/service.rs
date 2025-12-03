use std::sync::Arc;
use surrealdb::engine::remote::ws::Client;
use surrealdb::Surreal;
use crate::database::Database;
use super::connector::{IntegrationConfig, ProviderType, IntegrationConnector};
use super::nutanix::NutanixClient;

pub struct IntegrationService {
    db: Arc<Database>,
}

impl IntegrationService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn run_scan(&self, config: IntegrationConfig) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        // 1. Select Connector
        let connector: Box<dyn IntegrationConnector> = match config.provider_type {
            ProviderType::NutanixPrism => Box::new(NutanixClient::new(config.clone())),
            _ => return Err("Provider not supported yet".into()),
        };

        // 2. Fetch Inventory
        let assets = connector.fetch_inventory().await?;
        let mut saved_ids = Vec::new();

        // 3. Persist to DB
        for asset in assets {
            // Determine table based on asset type
            let table = match asset.asset_type.as_str() {
                "CLUSTER" => "nutanix_cluster",
                "HOST" => "hardware_lot", // Mapping hosts to hardware lots for now
                "VM" => "virtual_machine", // We might need to add this table
                _ => "discovered_asset",
            };

            // Create record
            let record_id = format!("{}:{}", table, asset.external_id);
            
            // We use a generic query to upsert
            // In a real app, we would map fields strictly. 
            // Here we dump raw_data + metadata.
            let content = serde_json::json!({
                "name": asset.name,
                "external_id": asset.external_id,
                "source": config.name,
                "raw_data": asset.raw_data,
                "last_seen": chrono::Utc::now(),
            });

            let _: Option<serde_json::Value> = self.db
                .update((table, asset.external_id.as_str()))
                .content(content)
                .await?;

            saved_ids.push(record_id);
        }

        Ok(saved_ids)
    }
}
