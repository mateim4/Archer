use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationConfig {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub base_url: String,
    pub auth_token: String, // In real app, use a secure vault
    pub poll_interval_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProviderType {
    NutanixPrism,
    CiscoACI,
    Splunk,
    GenericRest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredAsset {
    pub external_id: String,
    pub name: String,
    pub asset_type: String, // "VM", "HOST", "CLUSTER"
    pub raw_data: serde_json::Value,
}

#[async_trait]
pub trait IntegrationConnector: Send + Sync {
    /// Initialize the connector with configuration
    fn new(config: IntegrationConfig) -> Self where Self: Sized;
    
    /// Test connectivity to the target API
    async fn test_connection(&self) -> Result<bool, Box<dyn Error>>;
    
    /// Fetch inventory (Assets) from the provider
    async fn fetch_inventory(&self) -> Result<Vec<DiscoveredAsset>, Box<dyn Error>>;
    
    /// Fetch active alerts/incidents
    async fn fetch_alerts(&self) -> Result<Vec<serde_json::Value>, Box<dyn Error>>;
}
