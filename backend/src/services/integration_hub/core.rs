use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::error::Error;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationConfig {
    pub id: String,
    pub name: String,
    pub provider: ProviderType,
    pub base_url: String,
    pub auth_config: AuthConfig,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProviderType {
    NutanixPrism,
    CiscoACI,
    Splunk,
    GenericRest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub username: Option<String>,
    pub password: Option<String>, // Should be encrypted in real DB
    pub api_key: Option<String>,
    pub token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredAsset {
    pub external_id: String,
    pub name: String,
    pub asset_type: String, // "VM", "HOST", "CLUSTER"
    pub raw_data: serde_json::Value,
    pub last_seen: DateTime<Utc>,
}

#[async_trait]
pub trait IntegrationConnector: Send + Sync {
    /// Initialize the connector with configuration
    fn new(config: IntegrationConfig) -> Self where Self: Sized;
    
    /// Check connectivity to the target system
    async fn health_check(&self) -> Result<bool, Box<dyn Error + Send + Sync>>;
    
    /// Fetch inventory (Assets)
    async fn fetch_inventory(&self) -> Result<Vec<DiscoveredAsset>, Box<dyn Error + Send + Sync>>;
    
    /// Fetch active alerts/incidents
    async fn fetch_alerts(&self) -> Result<Vec<serde_json::Value>, Box<dyn Error + Send + Sync>>;
}
