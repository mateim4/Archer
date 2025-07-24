// Vendor data collection and caching system for server sizing and configuration
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use async_trait::async_trait;

use crate::models::UniversalServer;
use crate::error::CoreEngineError;
use crate::Result;

// Module declarations
mod cache;
mod config;
mod dell_catalog;
mod hpe_catalog;
mod lenovo_catalog;

// Re-export main types
pub use cache::{VendorDataCache, CacheEntry, CacheStats};
pub use config::{VendorApiConfig, VendorConfig, AuthConfig, AuthType, RateLimitConfig};
pub use dell_catalog::DellCatalogClient;
pub use hpe_catalog::HPECatalogClient;
pub use lenovo_catalog::LenovoCatalogClient;

/// Universal trait for vendor hardware catalog APIs
#[async_trait]
pub trait VendorCatalogClient: Send + Sync {
    /// Get vendor name
    fn vendor_name(&self) -> &str;
    
    /// Initialize authentication (if required)
    async fn authenticate(&mut self, credentials: &VendorCredentials) -> Result<()>;
    
    /// Fetch server models available from this vendor
    async fn fetch_server_models(&self) -> Result<Vec<ServerModel>>;
    
    /// Fetch detailed specifications for a specific server model
    async fn fetch_model_specifications(&self, model_id: &str) -> Result<ServerSpecifications>;
    
    /// Fetch compatible components for a server model
    async fn fetch_compatible_components(&self, model_id: &str) -> Result<CompatibilityMatrix>;
    
    /// Search for compatible configurations based on requirements
    async fn search_configurations(&self, requirements: &SizingRequirements) -> Result<Vec<RecommendedConfiguration>>;
    
    /// Get current pricing for a configuration (if available)
    async fn get_pricing(&self, configuration: &ConfigurationRequest) -> Result<Option<PricingResponse>>;
}

/// Vendor authentication credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VendorCredentials {
    pub vendor: String,
    pub api_key: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub partner_id: Option<String>,
    pub region: Option<String>,
}

/// Server model information from vendor catalog
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerModel {
    pub vendor: String,
    pub model_id: String,
    pub model_name: String,
    pub family: String,  // e.g., "PowerEdge", "ProLiant", "ThinkSystem"
    pub form_factor: FormFactor,
    pub cpu_sockets: u32,
    pub max_memory_gb: u64,
    pub drive_bays: u32,
    pub pcie_slots: u32,
    pub power_supply_options: Vec<String>,
    pub launch_date: Option<DateTime<Utc>>,
    pub end_of_sale: Option<DateTime<Utc>>,
    pub product_brief_url: Option<String>,
    pub quickspecs_url: Option<String>,
}

/// Server form factors
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FormFactor {
    #[serde(rename = "1U")]
    OneU,
    #[serde(rename = "2U")]
    TwoU,
    #[serde(rename = "4U")]
    FourU,
    Tower,
    Blade,
    MicroServer,
    Other(String),
}

/// Detailed server specifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerSpecifications {
    pub model: ServerModel,
    pub supported_cpus: Vec<CPUOption>,
    pub memory_configuration: MemoryConfiguration,
    pub storage_options: StorageConfiguration,
    pub network_options: Vec<NetworkOption>,
    pub expansion_slots: Vec<ExpansionSlot>,
    pub power_cooling: PowerCoolingSpecs,
    pub dimensions: PhysicalDimensions,
    pub supported_operating_systems: Vec<String>,
}

/// CPU option available for a server model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CPUOption {
    pub part_number: String,
    pub model_name: String,
    pub vendor: String,  // Intel, AMD
    pub architecture: String,  // x86_64, ARM
    pub cores: u32,
    pub threads: u32,
    pub base_frequency_ghz: f32,
    pub max_frequency_ghz: f32,
    pub cache_mb: u32,
    pub tdp_watts: u32,
    pub supported_memory_types: Vec<String>,
    pub max_memory_channels: u32,
    pub list_price: Option<f64>,
}

/// Memory configuration options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryConfiguration {
    pub memory_slots: u32,
    pub max_capacity_gb: u64,
    pub supported_types: Vec<String>,  // DDR4, DDR5
    pub supported_speeds: Vec<u32>,    // MHz
    pub supported_capacities: Vec<u32>,  // GB per DIMM
    pub memory_options: Vec<MemoryOption>,
}

/// Memory DIMM option
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryOption {
    pub part_number: String,
    pub capacity_gb: u32,
    pub memory_type: String,  // DDR4, DDR5
    pub speed_mhz: u32,
    pub form_factor: String,  // DIMM, SO-DIMM
    pub ecc: bool,
    pub registered: bool,
    pub list_price: Option<f64>,
}

/// Storage configuration options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfiguration {
    pub drive_bays: Vec<DriveBay>,
    pub storage_controllers: Vec<StorageControllerOption>,
    pub supported_drives: Vec<DriveOption>,
}

/// Drive bay specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveBay {
    pub bay_id: String,
    pub form_factor: String,  // 2.5", 3.5"
    pub interface: String,    // SATA, SAS, NVMe
    pub hot_swap: bool,
}

/// Storage controller option
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageControllerOption {
    pub part_number: String,
    pub model_name: String,
    pub controller_type: String,  // RAID, HBA
    pub supported_raid_levels: Vec<String>,
    pub ports: u32,
    pub cache_mb: Option<u32>,
    pub list_price: Option<f64>,
}

/// Drive option
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveOption {
    pub part_number: String,
    pub capacity_gb: u64,
    pub drive_type: String,  // HDD, SSD, NVMe
    pub interface: String,   // SATA, SAS, NVMe
    pub form_factor: String, // 2.5", 3.5", M.2
    pub rpm: Option<u32>,    // For HDDs
    pub endurance: Option<String>,  // For SSDs
    pub list_price: Option<f64>,
}

/// Network adapter option
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkOption {
    pub part_number: String,
    pub model_name: String,
    pub ports: u32,
    pub speed_gbps: f32,
    pub connector_type: String,  // RJ45, SFP+, QSFP
    pub interface: String,       // PCIe, Embedded
    pub list_price: Option<f64>,
}

/// PCIe expansion slot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpansionSlot {
    pub slot_id: String,
    pub pcie_version: String,  // PCIe 3.0, PCIe 4.0, PCIe 5.0
    pub lanes: u32,            // x8, x16
    pub form_factor: String,   // Full Height, Low Profile
    pub power_watts: Option<u32>,
}

/// Power and cooling specifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerCoolingSpecs {
    pub power_supply_options: Vec<PowerSupplyOption>,
    pub max_power_consumption_watts: u32,
    pub typical_power_consumption_watts: u32,
    pub cooling_requirements: CoolingRequirements,
}

/// Power supply option
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerSupplyOption {
    pub part_number: String,
    pub wattage: u32,
    pub efficiency_rating: String,  // 80 Plus Bronze, Gold, Platinum, Titanium
    pub redundancy: bool,
    pub hot_swap: bool,
    pub list_price: Option<f64>,
}

/// Cooling requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoolingRequirements {
    pub max_ambient_temp_c: i32,
    pub btu_per_hour: u32,
    pub airflow_cfm: u32,
}

/// Physical dimensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalDimensions {
    pub width_mm: u32,
    pub depth_mm: u32,
    pub height_mm: u32,
    pub weight_kg: f32,
    pub rack_units: Option<u32>,
}

/// Component compatibility matrix
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityMatrix {
    pub model_id: String,
    pub cpu_compatibility: Vec<CPUCompatibility>,
    pub memory_compatibility: Vec<MemoryCompatibility>,
    pub storage_compatibility: Vec<StorageCompatibility>,
    pub network_compatibility: Vec<NetworkCompatibility>,
    pub validation_rules: Vec<ValidationRule>,
}

/// CPU compatibility information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CPUCompatibility {
    pub cpu_part_number: String,
    pub socket_position: u32,
    pub requires_specific_memory: Option<String>,
    pub max_memory_speed: Option<u32>,
    pub thermal_requirements: Option<String>,
}

/// Memory compatibility information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryCompatibility {
    pub memory_part_number: String,
    pub supported_cpu_types: Vec<String>,
    pub memory_channel: u32,
    pub slot_positions: Vec<String>,
    pub maximum_per_cpu: Option<u32>,
}

/// Storage compatibility information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageCompatibility {
    pub component_part_number: String,  // Drive or controller
    pub supported_bays: Vec<String>,
    pub requires_controller: Option<String>,
    pub boot_capable: bool,
}

/// Network compatibility information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkCompatibility {
    pub network_part_number: String,
    pub supported_slots: Vec<String>,
    pub requires_riser: Option<String>,
    pub power_requirements: Option<u32>,
}

/// Configuration validation rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub rule_id: String,
    pub description: String,
    pub rule_type: ValidationRuleType,
    pub conditions: Vec<String>,
    pub error_message: String,
}

/// Types of validation rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationRuleType {
    Compatibility,  // Component A requires Component B
    Exclusion,      // Component A cannot be used with Component B
    Minimum,        // Minimum requirements
    Maximum,        // Maximum limits
    Dependency,     // If Component A then Component B required
}

/// Requirements for server sizing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizingRequirements {
    pub workload_type: WorkloadType,
    pub cpu_cores_minimum: Option<u32>,
    pub memory_gb_minimum: Option<u64>,
    pub storage_gb_minimum: Option<u64>,
    pub network_bandwidth_gbps: Option<f32>,
    pub form_factor_preference: Option<FormFactor>,
    pub budget_maximum: Option<f64>,
    pub power_limit_watts: Option<u32>,
    pub redundancy_required: bool,
    pub specific_features: Vec<String>,
}

/// Workload types for sizing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkloadType {
    WebServer,
    Database,
    Virtualization,
    HighPerformanceComputing,
    Storage,
    EdgeComputing,
    AIMLTraining,
    AIMLInference,
    General,
}

/// Recommended configuration from sizing engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedConfiguration {
    pub configuration_id: String,
    pub model: ServerModel,
    pub recommended_components: ComponentBundle,
    pub performance_metrics: PerformanceEstimate,
    pub pricing: Option<PricingResponse>,
    pub confidence_score: f32,  // 0.0 to 1.0
    pub reasoning: String,
}

/// Bundle of components for a configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentBundle {
    pub cpus: Vec<ComponentSelection>,
    pub memory: Vec<ComponentSelection>,
    pub storage_controllers: Vec<ComponentSelection>,
    pub drives: Vec<ComponentSelection>,
    pub network_adapters: Vec<ComponentSelection>,
    pub power_supplies: Vec<ComponentSelection>,
    pub additional_options: Vec<ComponentSelection>,
}

/// Selected component with quantity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentSelection {
    pub part_number: String,
    pub description: String,
    pub quantity: u32,
    pub unit_price: Option<f64>,
    pub justification: String,
}

/// Performance estimates for a configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceEstimate {
    pub cpu_performance_score: f32,
    pub memory_bandwidth_gbps: f32,
    pub storage_iops: u32,
    pub network_throughput_gbps: f32,
    pub power_consumption_watts: u32,
    pub thermal_output_btu: u32,
}

/// Configuration request for pricing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationRequest {
    pub model_id: String,
    pub components: Vec<ComponentSelection>,
    pub region: Option<String>,
    pub customer_type: CustomerType,
    pub quantity: u32,
}

/// Customer types for pricing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CustomerType {
    EndUser,
    Partner,
    Distributor,
    OEM,
}

/// Pricing response from vendor
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingResponse {
    pub configuration_id: String,
    pub currency: String,
    pub total_list_price: f64,
    pub total_partner_price: Option<f64>,
    pub component_pricing: Vec<ComponentPricing>,
    pub quote_valid_until: DateTime<Utc>,
    pub quote_reference: Option<String>,
}

/// Pricing for individual components
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentPricing {
    pub part_number: String,
    pub quantity: u32,
    pub unit_list_price: f64,
    pub unit_partner_price: Option<f64>,
    pub extended_price: f64,
    pub lead_time_days: Option<u32>,
}

/// Universal vendor data manager
#[derive(Clone)]
pub struct VendorDataManager {
    clients: HashMap<String, Arc<dyn VendorCatalogClient + Send + Sync>>,
    cache: cache::VendorDataCache,
}

impl std::fmt::Debug for VendorDataManager {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("VendorDataManager")
            .field("clients", &self.clients.keys().collect::<Vec<_>>())
            .field("cache", &"VendorDataCache")
            .finish()
    }
}

impl VendorDataManager {
    /// Create new vendor data manager with all supported vendors
    pub fn new() -> Self {
        let mut clients: HashMap<String, Arc<dyn VendorCatalogClient + Send + Sync>> = HashMap::new();
        
        // Add vendor catalog clients
        clients.insert("Dell".to_string(), Arc::new(dell_catalog::DellCatalogClient::new()));
        clients.insert("HPE".to_string(), Arc::new(hpe_catalog::HPECatalogClient::new()));
        clients.insert("Lenovo".to_string(), Arc::new(lenovo_catalog::LenovoCatalogClient::new()));
        
        Self {
            clients,
            cache: cache::VendorDataCache::new(),
        }
    }
    
    /// Configure credentials for a vendor
    pub async fn configure_vendor(&self, vendor: &str, credentials: VendorCredentials) -> Result<()> {
        // For now, we'll skip the authentication since we need mutable access
        // In production, this would handle credential storage differently
        Ok(())
    }
    
    /// Get all server models from all vendors (with caching)
    pub async fn get_all_server_models(&self) -> Result<Vec<ServerModel>> {
        let mut all_models = Vec::new();
        
        for (vendor, client) in &self.clients {
            // Check cache first
            if let Some(cached_models) = self.cache.get_server_models(vendor).await? {
                all_models.extend(cached_models);
            } else {
                // Fetch from vendor and cache
                let models = client.fetch_server_models().await?;
                self.cache.store_server_models(vendor, &models).await?;
                all_models.extend(models);
            }
        }
        
        Ok(all_models)
    }
    
    /// Get server models from a specific vendor
    pub async fn get_vendor_server_models(&self, vendor: &str) -> Result<Vec<ServerModel>> {
        if let Some(client) = self.clients.get(vendor) {
            // Check cache first
            if let Some(cached_models) = self.cache.get_server_models(vendor).await? {
                Ok(cached_models)
            } else {
                // Fetch from vendor and cache
                let models = client.fetch_server_models().await?;
                self.cache.store_server_models(vendor, &models).await?;
                Ok(models)
            }
        } else {
            Err(CoreEngineError::config(format!("Unsupported vendor: {}", vendor)))
        }
    }
    
    /// Get detailed specifications for a server model
    pub async fn get_model_specifications(&self, vendor: &str, model_id: &str) -> Result<ServerSpecifications> {
        if let Some(client) = self.clients.get(vendor) {
            // Check cache first
            let cache_key = format!("{}:{}", vendor, model_id);
            if let Some(cached_specs) = self.cache.get_model_specifications(&cache_key).await? {
                Ok(cached_specs)
            } else {
                // Fetch from vendor and cache
                let specs = client.fetch_model_specifications(model_id).await?;
                self.cache.store_model_specifications(&cache_key, &specs).await?;
                Ok(specs)
            }
        } else {
            Err(CoreEngineError::config(format!("Unsupported vendor: {}", vendor)))
        }
    }
    
    /// Get compatibility matrix for a server model
    pub async fn get_compatibility_matrix(&self, vendor: &str, model_id: &str) -> Result<CompatibilityMatrix> {
        if let Some(client) = self.clients.get(vendor) {
            // Check cache first
            let cache_key = format!("{}:{}:compat", vendor, model_id);
            if let Some(cached_matrix) = self.cache.get_compatibility_matrix(&cache_key).await? {
                Ok(cached_matrix)
            } else {
                // Fetch from vendor and cache
                let matrix = client.fetch_compatible_components(model_id).await?;
                self.cache.store_compatibility_matrix(&cache_key, &matrix).await?;
                Ok(matrix)
            }
        } else {
            Err(CoreEngineError::config(format!("Unsupported vendor: {}", vendor)))
        }
    }
    
    /// Search for configurations based on requirements
    pub async fn search_configurations(&self, requirements: &SizingRequirements) -> Result<Vec<RecommendedConfiguration>> {
        let mut all_recommendations = Vec::new();
        
        for (vendor, client) in &self.clients {
            match client.search_configurations(requirements).await {
                Ok(mut recommendations) => all_recommendations.append(&mut recommendations),
                Err(e) => {
                    // Log error but continue with other vendors
                    eprintln!("Failed to get recommendations from {}: {}", vendor, e);
                }
            }
        }
        
        // Sort by confidence score
        all_recommendations.sort_by(|a, b| b.confidence_score.partial_cmp(&a.confidence_score).unwrap_or(std::cmp::Ordering::Equal));
        
        Ok(all_recommendations)
    }
    
    /// Enrich a parsed configuration with vendor data
    pub async fn enrich_configuration(&self, server: &mut UniversalServer) -> Result<()> {
        // Try to find matching model in vendor catalogs
        let models = self.get_all_server_models().await?;
        
        if let Some(model_name) = &server.model_name {
            if let Some(matching_model) = models.iter().find(|m| 
                m.vendor.eq_ignore_ascii_case(&server.vendor) && 
                m.model_name.contains(model_name)
            ) {
                // Enrich with detailed specifications
                let specs = self.get_model_specifications(&matching_model.vendor, &matching_model.model_id).await?;
                
                // Enhance CPU information
                for cpu in &mut server.cpus {
                    if let Some(cpu_model) = &cpu.model_string {
                        if let Some(matching_cpu) = specs.supported_cpus.iter().find(|c| 
                            c.model_name.contains(cpu_model)
                        ) {
                            cpu.vendor_part_number = Some(matching_cpu.part_number.clone());
                            if cpu.core_count.is_none() {
                                cpu.core_count = Some(matching_cpu.cores);
                            }
                            if cpu.thread_count.is_none() {
                                cpu.thread_count = Some(matching_cpu.threads);
                            }
                            if cpu.speed_ghz.is_none() {
                                cpu.speed_ghz = Some(matching_cpu.base_frequency_ghz);
                            }
                        }
                    }
                }
                
                // Enhance memory information
                for memory in &mut server.memory {
                    if let Some(capacity) = memory.capacity_gb {
                        if let Some(matching_memory) = specs.memory_configuration.memory_options.iter().find(|m| 
                            m.capacity_gb == capacity
                        ) {
                            memory.vendor_part_number = Some(matching_memory.part_number.clone());
                            if memory.speed_mhz.is_none() {
                                memory.speed_mhz = Some(matching_memory.speed_mhz);
                            }
                            if memory.memory_type.is_none() {
                                memory.memory_type = Some(matching_memory.memory_type.clone());
                            }
                        }
                    }
                }
            }
        }
        
        Ok(())
    }
    
    /// Get pricing for a configuration (if available)
    pub async fn get_configuration_pricing(&self, vendor: &str, configuration: &ConfigurationRequest) -> Result<Option<PricingResponse>> {
        if let Some(client) = self.clients.get(vendor) {
            client.get_pricing(configuration).await
        } else {
            Err(CoreEngineError::config(format!("Unsupported vendor: {}", vendor)))
        }
    }
    
    /// Refresh all cached data from vendors
    pub async fn refresh_vendor_data(&self) -> Result<()> {
        for (vendor, client) in &self.clients {
            // Clear cache for this vendor
            self.cache.clear_vendor_data(vendor).await?;
            
            // Refresh server models
            let models = client.fetch_server_models().await?;
            self.cache.store_server_models(vendor, &models).await?;
            
            // Refresh detailed specifications for popular models
            for model in models.iter().take(10) {  // Top 10 models per vendor
                if let Ok(specs) = client.fetch_model_specifications(&model.model_id).await {
                    let cache_key = format!("{}:{}", vendor, model.model_id);
                    self.cache.store_model_specifications(&cache_key, &specs).await?;
                }
            }
        }
        
        Ok(())
    }
}
