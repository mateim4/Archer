use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::SystemTime;

pub mod traits;
pub mod dell_client;

pub use traits::{ConfigurationFileParser, ParsedConfiguration, ConfigurationSource};
pub use dell_client::DellApiClient;

/// Configuration for vendor API credentials and settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VendorCredentials {
    pub vendor: String,
    pub api_key: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub endpoint: String,
    pub enabled: bool,
}

/// Cached configuration entry with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedConfig {
    pub id: String,
    pub vendor: String,
    pub server_model: String,
    pub configuration: crate::models::UniversalServer,
    pub cached_at: SystemTime,
    pub expires_at: SystemTime,
    pub source: ConfigSource,
}

/// Source of configuration data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigSource {
    VendorApi { endpoint: String },
    ManualUpload { filename: String },
    SystemGenerated,
}

/// Cache statistics and status
#[derive(Debug, Serialize, Deserialize)]
pub struct CacheStatus {
    pub total_configs: usize,
    pub by_vendor: HashMap<String, usize>,
    pub last_sync: Option<SystemTime>,
    pub next_refresh: Option<SystemTime>,
    pub cache_hit_rate: f64,
}

/// Vendor API response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct VendorApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub rate_limit_remaining: Option<u32>,
    pub rate_limit_reset: Option<SystemTime>,
}
