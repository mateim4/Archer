// Production vendor API configuration
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Configuration for vendor API endpoints and settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VendorApiConfig {
    pub vendors: HashMap<String, VendorConfig>,
    pub global_settings: GlobalApiSettings,
}

/// Configuration for a specific vendor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VendorConfig {
    pub enabled: bool,
    pub production_url: String,
    pub sandbox_url: String,
    pub api_version: String,
    pub authentication: AuthConfig,
    pub rate_limiting: RateLimitConfig,
    pub endpoints: EndpointConfig,
    pub data_mappings: Option<String>, // Path to vendor-specific data mapping file
}

/// Authentication configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub auth_type: AuthType,
    pub client_id_env: Option<String>,
    pub client_secret_env: Option<String>,
    pub api_key_env: Option<String>,
    pub token_url: Option<String>,
    pub scopes: Option<Vec<String>>,
}

/// Authentication type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuthType {
    ApiKey,
    OAuth2,
    BasicAuth,
    BearerToken,
}

/// Rate limiting configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub requests_per_minute: u32,
    pub burst_limit: Option<u32>,
    pub retry_after_seconds: u32,
    pub max_retries: u32,
}

/// Endpoint configuration for different API operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointConfig {
    pub servers: String,
    pub server_details: String,
    pub specifications: String,
    pub compatibility: String,
    pub pricing: String,
    pub configurator: String,
    pub search: String,
}

/// Global API settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalApiSettings {
    pub timeout_seconds: u64,
    pub user_agent: String,
    pub retry_strategy: RetryStrategy,
    pub cache_settings: CacheSettings,
    pub logging: LoggingConfig,
}

/// Retry strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryStrategy {
    pub max_retries: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub exponential_backoff: bool,
    pub jitter: bool,
}

/// Cache settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheSettings {
    pub enable_memory_cache: bool,
    pub enable_disk_cache: bool,
    pub memory_cache_size_mb: u64,
    pub disk_cache_path: String,
    pub default_ttl_hours: u64,
    pub model_cache_ttl_hours: u64,
    pub specs_cache_ttl_hours: u64,
    pub pricing_cache_ttl_hours: u64,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub log_requests: bool,
    pub log_responses: bool,
    pub log_errors: bool,
    pub log_performance: bool,
    pub sensitive_data_masking: bool,
}

impl Default for VendorApiConfig {
    fn default() -> Self {
        let mut vendors = HashMap::new();
        
        // Dell configuration
        vendors.insert("dell".to_string(), VendorConfig {
            enabled: true,
            production_url: "https://api.dell.com/configurator/v3".to_string(),
            sandbox_url: "https://sandbox-api.dell.com/configurator/v3".to_string(),
            api_version: "v3".to_string(),
            authentication: AuthConfig {
                auth_type: AuthType::OAuth2,
                client_id_env: Some("DELL_CLIENT_ID".to_string()),
                client_secret_env: Some("DELL_CLIENT_SECRET".to_string()),
                api_key_env: None,
                token_url: Some("https://api.dell.com/oauth/token".to_string()),
                scopes: Some(vec![
                    "configurator:read".to_string(),
                    "pricing:read".to_string()
                ]),
            },
            rate_limiting: RateLimitConfig {
                requests_per_minute: 100,
                burst_limit: Some(10),
                retry_after_seconds: 60,
                max_retries: 3,
            },
            endpoints: EndpointConfig {
                servers: "servers".to_string(),
                server_details: "servers/{id}".to_string(),
                specifications: "servers/{id}/specifications".to_string(),
                compatibility: "servers/{id}/compatibility".to_string(),
                pricing: "configurations/{id}/pricing".to_string(),
                configurator: "configurator".to_string(),
                search: "servers/search".to_string(),
            },
            data_mappings: Some("vendor_mappings/dell.json".to_string()),
        });
        
        // HPE configuration
        vendors.insert("hpe".to_string(), VendorConfig {
            enabled: true,
            production_url: "https://api.hpe.com/catalog/v2".to_string(),
            sandbox_url: "https://sandbox-api.hpe.com/catalog/v2".to_string(),
            api_version: "v2".to_string(),
            authentication: AuthConfig {
                auth_type: AuthType::ApiKey,
                client_id_env: None,
                client_secret_env: None,
                api_key_env: Some("HPE_API_KEY".to_string()),
                token_url: None,
                scopes: None,
            },
            rate_limiting: RateLimitConfig {
                requests_per_minute: 60,
                burst_limit: Some(5),
                retry_after_seconds: 60,
                max_retries: 3,
            },
            endpoints: EndpointConfig {
                servers: "products/servers".to_string(),
                server_details: "products/servers/{id}".to_string(),
                specifications: "products/servers/{id}/specifications".to_string(),
                compatibility: "products/servers/{id}/compatibility".to_string(),
                pricing: "products/servers/{id}/pricing".to_string(),
                configurator: "configurator".to_string(),
                search: "products/search".to_string(),
            },
            data_mappings: Some("vendor_mappings/hpe.json".to_string()),
        });
        
        // Lenovo configuration
        vendors.insert("lenovo".to_string(), VendorConfig {
            enabled: true,
            production_url: "https://api.lenovo.com/products/v1".to_string(),
            sandbox_url: "https://dev-api.lenovo.com/products/v1".to_string(),
            api_version: "v1".to_string(),
            authentication: AuthConfig {
                auth_type: AuthType::BearerToken,
                client_id_env: Some("LENOVO_CLIENT_ID".to_string()),
                client_secret_env: Some("LENOVO_CLIENT_SECRET".to_string()),
                api_key_env: None,
                token_url: Some("https://auth.lenovo.com/token".to_string()),
                scopes: Some(vec!["products:read".to_string()]),
            },
            rate_limiting: RateLimitConfig {
                requests_per_minute: 80,
                burst_limit: Some(8),
                retry_after_seconds: 60,
                max_retries: 3,
            },
            endpoints: EndpointConfig {
                servers: "servers".to_string(),
                server_details: "servers/{product_id}".to_string(),
                specifications: "servers/{product_id}/specs".to_string(),
                compatibility: "servers/{product_id}/compatibility".to_string(),
                pricing: "servers/{product_id}/pricing".to_string(),
                configurator: "configurator/servers".to_string(),
                search: "search/servers".to_string(),
            },
            data_mappings: Some("vendor_mappings/lenovo.json".to_string()),
        });
        
        Self {
            vendors,
            global_settings: GlobalApiSettings {
                timeout_seconds: 30,
                user_agent: "LCM-Designer/1.0 (Vendor-Data-Collector)".to_string(),
                retry_strategy: RetryStrategy {
                    max_retries: 3,
                    initial_delay_ms: 1000,
                    max_delay_ms: 60000,
                    exponential_backoff: true,
                    jitter: true,
                },
                cache_settings: CacheSettings {
                    enable_memory_cache: true,
                    enable_disk_cache: true,
                    memory_cache_size_mb: 256,
                    disk_cache_path: "vendor_cache".to_string(),
                    default_ttl_hours: 24,
                    model_cache_ttl_hours: 72,
                    specs_cache_ttl_hours: 48,
                    pricing_cache_ttl_hours: 1,
                },
                logging: LoggingConfig {
                    log_requests: true,
                    log_responses: false,
                    log_errors: true,
                    log_performance: true,
                    sensitive_data_masking: true,
                },
            },
        }
    }
}

impl VendorApiConfig {
    /// Load configuration from file
    pub fn load_from_file(path: &str) -> crate::Result<Self> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| crate::error::CoreEngineError::io(format!("Failed to read config file: {}", e)))?;
        
        let config: Self = serde_json::from_str(&content)
            .map_err(|e| crate::error::CoreEngineError::parsing(format!("Failed to parse config: {}", e)))?;
        
        Ok(config)
    }
    
    /// Save configuration to file
    pub fn save_to_file(&self, path: &str) -> crate::Result<()> {
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| crate::error::CoreEngineError::io(format!("Failed to serialize config: {}", e)))?;
        
        std::fs::write(path, content)
            .map_err(|e| crate::error::CoreEngineError::io(format!("Failed to write config file: {}", e)))?;
        
        Ok(())
    }
    
    /// Get configuration for a specific vendor
    pub fn get_vendor_config(&self, vendor: &str) -> Option<&VendorConfig> {
        self.vendors.get(vendor)
    }
    
    /// Check if vendor is enabled
    pub fn is_vendor_enabled(&self, vendor: &str) -> bool {
        self.vendors.get(vendor)
            .map(|config| config.enabled)
            .unwrap_or(false)
    }
    
    /// Get all enabled vendors
    pub fn enabled_vendors(&self) -> Vec<&str> {
        self.vendors
            .iter()
            .filter(|(_, config)| config.enabled)
            .map(|(name, _)| name.as_str())
            .collect()
    }
    
    /// Validate configuration
    pub fn validate(&self) -> Vec<String> {
        let mut errors = Vec::new();
        
        for (vendor_name, config) in &self.vendors {
            if config.enabled {
                // Validate URLs
                if config.production_url.is_empty() {
                    errors.push(format!("{}: Missing production URL", vendor_name));
                }
                
                if config.sandbox_url.is_empty() {
                    errors.push(format!("{}: Missing sandbox URL", vendor_name));
                }
                
                // Validate authentication
                match config.authentication.auth_type {
                    AuthType::ApiKey => {
                        if config.authentication.api_key_env.is_none() {
                            errors.push(format!("{}: API key environment variable not specified", vendor_name));
                        }
                    },
                    AuthType::OAuth2 | AuthType::BearerToken => {
                        if config.authentication.client_id_env.is_none() {
                            errors.push(format!("{}: Client ID environment variable not specified", vendor_name));
                        }
                        if config.authentication.client_secret_env.is_none() {
                            errors.push(format!("{}: Client secret environment variable not specified", vendor_name));
                        }
                        if config.authentication.token_url.is_none() {
                            errors.push(format!("{}: Token URL not specified for OAuth2/Bearer", vendor_name));
                        }
                    },
                    AuthType::BasicAuth => {
                        if config.authentication.client_id_env.is_none() {
                            errors.push(format!("{}: Username environment variable not specified", vendor_name));
                        }
                        if config.authentication.client_secret_env.is_none() {
                            errors.push(format!("{}: Password environment variable not specified", vendor_name));
                        }
                    },
                }
                
                // Validate rate limiting
                if config.rate_limiting.requests_per_minute == 0 {
                    errors.push(format!("{}: Invalid rate limit (0 requests per minute)", vendor_name));
                }
            }
        }
        
        errors
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_default_config() {
        let config = VendorApiConfig::default();
        assert!(config.is_vendor_enabled("dell"));
        assert!(config.is_vendor_enabled("hpe"));
        assert!(config.is_vendor_enabled("lenovo"));
        
        let enabled = config.enabled_vendors();
        assert_eq!(enabled.len(), 3);
        assert!(enabled.contains(&"dell"));
        assert!(enabled.contains(&"hpe"));
        assert!(enabled.contains(&"lenovo"));
    }
    
    #[test]
    fn test_config_validation() {
        let config = VendorApiConfig::default();
        let errors = config.validate();
        assert!(errors.is_empty(), "Default config should be valid: {:?}", errors);
    }
    
    #[test]
    fn test_vendor_config_access() {
        let config = VendorApiConfig::default();
        
        let dell_config = config.get_vendor_config("dell").unwrap();
        assert_eq!(dell_config.api_version, "v3");
        assert!(matches!(dell_config.authentication.auth_type, AuthType::OAuth2));
        
        let hpe_config = config.get_vendor_config("hpe").unwrap();
        assert_eq!(hpe_config.api_version, "v2");
        assert!(matches!(hpe_config.authentication.auth_type, AuthType::ApiKey));
        
        let lenovo_config = config.get_vendor_config("lenovo").unwrap();
        assert_eq!(lenovo_config.api_version, "v1");
        assert!(matches!(lenovo_config.authentication.auth_type, AuthType::BearerToken));
    }
}