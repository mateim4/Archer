use super::core::{AuthConfig, DiscoveredAsset, IntegrationConfig, IntegrationConnector};
use async_trait::async_trait;
use chrono::Utc;
use reqwest::Client;
use serde_json::Value;
use std::error::Error;
use std::time::Duration;

pub struct NutanixClient {
    config: IntegrationConfig,
    client: Client,
}

#[async_trait]
impl IntegrationConnector for NutanixClient {
    fn new(config: IntegrationConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .danger_accept_invalid_certs(true) // Common for internal Prism instances
            .build()
            .unwrap_or_default();

        Self { config, client }
    }

    async fn health_check(&self) -> Result<bool, Box<dyn Error + Send + Sync>> {
        if self.config.base_url.starts_with("mock://") {
            return Ok(true);
        }

        let url = format!("{}/PrismGateway/services/rest/v2.0/cluster", self.config.base_url);
        let response = self.request_builder(&url).send().await?;

        Ok(response.status().is_success())
    }

    async fn fetch_inventory(&self) -> Result<Vec<DiscoveredAsset>, Box<dyn Error + Send + Sync>> {
        if self.config.base_url.starts_with("mock://") {
            return Ok(self.mock_inventory());
        }

        // 1. Fetch Hosts
        let hosts_url = format!("{}/PrismGateway/services/rest/v2.0/hosts", self.config.base_url);
        let hosts_resp = self.request_builder(&hosts_url).send().await?;
        let hosts_json: Value = hosts_resp.json().await?;
        
        // 2. Fetch VMs
        let vms_url = format!("{}/PrismGateway/services/rest/v2.0/vms", self.config.base_url);
        let vms_resp = self.request_builder(&vms_url).send().await?;
        let vms_json: Value = vms_resp.json().await?;

        let mut assets = Vec::new();

        // Process Hosts
        if let Some(entities) = hosts_json.get("entities").and_then(|e| e.as_array()) {
            for entity in entities {
                assets.push(DiscoveredAsset {
                    external_id: entity["uuid"].as_str().unwrap_or_default().to_string(),
                    name: entity["name"].as_str().unwrap_or_default().to_string(),
                    asset_type: "HOST".to_string(),
                    raw_data: entity.clone(),
                    last_seen: Utc::now(),
                });
            }
        }

        // Process VMs
        if let Some(entities) = vms_json.get("entities").and_then(|e| e.as_array()) {
            for entity in entities {
                assets.push(DiscoveredAsset {
                    external_id: entity["uuid"].as_str().unwrap_or_default().to_string(),
                    name: entity["name"].as_str().unwrap_or_default().to_string(),
                    asset_type: "VM".to_string(),
                    raw_data: entity.clone(),
                    last_seen: Utc::now(),
                });
            }
        }

        Ok(assets)
    }

    async fn fetch_alerts(&self) -> Result<Vec<Value>, Box<dyn Error + Send + Sync>> {
        if self.config.base_url.starts_with("mock://") {
            return Ok(vec![]);
        }
        
        let url = format!("{}/PrismGateway/services/rest/v2.0/alerts", self.config.base_url);
        let response = self.request_builder(&url).send().await?;
        let json: Value = response.json().await?;
        
        Ok(json.get("entities")
            .and_then(|e| e.as_array())
            .cloned()
            .unwrap_or_default())
    }
}

impl NutanixClient {
    fn request_builder(&self, url: &str) -> reqwest::RequestBuilder {
        let mut builder = self.client.get(url);
        
        if let Some(ref user) = self.config.auth_config.username {
            if let Some(ref pass) = self.config.auth_config.password {
                builder = builder.basic_auth(user, Some(pass));
            }
        }
        
        builder
    }

    fn mock_inventory(&self) -> Vec<DiscoveredAsset> {
        vec![
            DiscoveredAsset {
                external_id: "host-uuid-1".to_string(),
                name: "NX-3060-G7-Node-A".to_string(),
                asset_type: "HOST".to_string(),
                raw_data: serde_json::json!({"model": "NX-3060-G7", "cpu": "Intel Xeon Gold"}),
                last_seen: Utc::now(),
            },
            DiscoveredAsset {
                external_id: "vm-uuid-1".to_string(),
                name: "SQL-Prod-01".to_string(),
                asset_type: "VM".to_string(),
                raw_data: serde_json::json!({"vcpus": 8, "memory_gb": 64}),
                last_seen: Utc::now(),
            }
        ]
    }
}
