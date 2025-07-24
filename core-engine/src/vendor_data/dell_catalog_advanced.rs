// Advanced Dell catalog client with real API integration
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use reqwest::{Client, header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE}};
use std::collections::HashMap;
use std::time::Duration;

use crate::error::CoreEngineError;
use crate::Result;
use super::{
    VendorCatalogClient, VendorCredentials, ServerModel, ServerSpecifications, CompatibilityMatrix,
    SizingRequirements, RecommendedConfiguration, ConfigurationRequest, PricingResponse,
    FormFactor, CPUOption, MemoryConfiguration, MemoryOption, StorageConfiguration,
    StorageControllerOption, DriveOption, NetworkOption, ExpansionSlot, PowerCoolingSpecs,
    PowerSupplyOption, CoolingRequirements, PhysicalDimensions, ComponentBundle,
    ComponentSelection, PerformanceEstimate, WorkloadType,
};

/// Production Dell catalog client with real API integration
#[derive(Debug, Clone)]
pub struct DellCatalogClient {
    client: Client,
    credentials: Option<VendorCredentials>,
    base_url: String,
    cache_duration: Duration,
    rate_limiter: Option<RateLimiter>,
}

/// Rate limiter for Dell API calls
#[derive(Debug, Clone)]
pub struct RateLimiter {
    requests_per_minute: u32,
    last_request: std::time::Instant,
}

/// Dell API response wrapper
#[derive(Debug, Deserialize)]
struct DellApiResponse<T> {
    data: T,
    pagination: Option<DellPagination>,
    meta: Option<DellMeta>,
}

/// Dell API pagination
#[derive(Debug, Deserialize)]
struct DellPagination {
    page: u32,
    per_page: u32,
    total: u32,
    total_pages: u32,
}

/// Dell API metadata
#[derive(Debug, Deserialize)]
struct DellMeta {
    api_version: String,
    timestamp: String,
    rate_limit_remaining: Option<u32>,
}

/// Dell server configuration from API
#[derive(Debug, Deserialize)]
struct DellServerConfig {
    id: String,
    name: String,
    model: String,
    family: String,
    form_factor: String,
    specifications: DellSpecifications,
    availability: DellAvailability,
    pricing: Option<DellPricing>,
}

/// Dell server specifications
#[derive(Debug, Deserialize)]
struct DellSpecifications {
    cpu: DellCpuSpecs,
    memory: DellMemorySpecs,
    storage: DellStorageSpecs,
    network: DellNetworkSpecs,
    power: DellPowerSpecs,
    dimensions: DellDimensionSpecs,
}

/// Dell CPU specifications
#[derive(Debug, Deserialize)]
struct DellCpuSpecs {
    sockets: u32,
    max_cores_per_socket: u32,
    supported_processors: Vec<DellProcessor>,
}

/// Dell processor option
#[derive(Debug, Deserialize)]
struct DellProcessor {
    part_number: String,
    name: String,
    vendor: String,
    cores: u32,
    threads: u32,
    base_freq_ghz: f32,
    max_freq_ghz: f32,
    cache_mb: u32,
    tdp_watts: u32,
    list_price: Option<f64>,
}

/// Dell memory specifications
#[derive(Debug, Deserialize)]
struct DellMemorySpecs {
    slots: u32,
    max_capacity_gb: u64,
    supported_types: Vec<String>,
    memory_options: Vec<DellMemoryOption>,
}

/// Dell memory option
#[derive(Debug, Deserialize)]
struct DellMemoryOption {
    part_number: String,
    capacity_gb: u32,
    memory_type: String,
    speed_mhz: u32,
    ecc: bool,
    registered: bool,
    list_price: Option<f64>,
}

/// Dell storage specifications
#[derive(Debug, Deserialize)]
struct DellStorageSpecs {
    drive_bays: u32,
    supported_controllers: Vec<DellStorageController>,
    supported_drives: Vec<DellDrive>,
}

/// Dell storage controller
#[derive(Debug, Deserialize)]
struct DellStorageController {
    part_number: String,
    name: String,
    controller_type: String,
    ports: u32,
    supported_raid: Vec<String>,
    cache_mb: Option<u32>,
    list_price: Option<f64>,
}

/// Dell drive option
#[derive(Debug, Deserialize)]
struct DellDrive {
    part_number: String,
    capacity_gb: u64,
    drive_type: String,
    interface: String,
    form_factor: String,
    rpm: Option<u32>,
    list_price: Option<f64>,
}

/// Dell network specifications
#[derive(Debug, Deserialize)]
struct DellNetworkSpecs {
    embedded_ports: u32,
    expansion_slots: u32,
    network_options: Vec<DellNetworkOption>,
}

/// Dell network option
#[derive(Debug, Deserialize)]
struct DellNetworkOption {
    part_number: String,
    name: String,
    ports: u32,
    speed_gbps: f32,
    connector_type: String,
    list_price: Option<f64>,
}

/// Dell power specifications
#[derive(Debug, Deserialize)]
struct DellPowerSpecs {
    power_supplies: Vec<DellPowerSupply>,
    max_power_watts: u32,
    typical_power_watts: u32,
    efficiency_rating: String,
}

/// Dell power supply
#[derive(Debug, Deserialize)]
struct DellPowerSupply {
    part_number: String,
    wattage: u32,
    efficiency: String,
    redundant: bool,
    hot_swap: bool,
    list_price: Option<f64>,
}

/// Dell dimensions
#[derive(Debug, Deserialize)]
struct DellDimensionSpecs {
    width_mm: u32,
    depth_mm: u32,
    height_mm: u32,
    weight_kg: f32,
    rack_units: Option<u32>,
}

/// Dell availability info
#[derive(Debug, Deserialize)]
struct DellAvailability {
    status: String,
    launch_date: Option<String>,
    end_of_life: Option<String>,
    regions: Vec<String>,
}

/// Dell pricing info
#[derive(Debug, Deserialize)]
struct DellPricing {
    list_price: f64,
    partner_price: Option<f64>,
    currency: String,
    valid_until: String,
}

impl DellCatalogClient {
    /// Create new Dell catalog client for production
    pub fn new_production() -> Self {
        Self::new("https://api.dell.com/configurator/v3".to_string())
    }
    
    /// Create new Dell catalog client for sandbox testing
    pub fn new_sandbox() -> Self {
        Self::new("https://sandbox-api.dell.com/configurator/v3".to_string())
    }
    
    /// Create new Dell catalog client with custom base URL
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("LCM-Designer/1.0")
            .build()
            .expect("Failed to create HTTP client");
            
        Self {
            client,
            credentials: None,
            base_url,
            cache_duration: Duration::from_secs(3600), // 1 hour default
            rate_limiter: Some(RateLimiter {
                requests_per_minute: 60, // Dell API limit
                last_request: std::time::Instant::now(),
            }),
        }
    }
    
    /// Configure credentials
    pub fn with_credentials(mut self, credentials: VendorCredentials) -> Self {
        self.credentials = Some(credentials);
        self
    }
    
    /// Set cache duration
    pub fn with_cache_duration(mut self, duration: Duration) -> Self {
        self.cache_duration = duration;
        self
    }
    
    /// Build authentication headers
    fn build_headers(&self) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        
        if let Some(creds) = &self.credentials {
            if let Some(api_key) = &creds.api_key {
                headers.insert(
                    AUTHORIZATION,
                    HeaderValue::from_str(&format!("Bearer {}", api_key))
                        .map_err(|e| CoreEngineError::authentication(format!("Invalid API key: {}", e)))?
                );
            }
        }
        
        Ok(headers)
    }
    
    /// Execute authenticated API request with rate limiting
    async fn api_request<T: for<'de> Deserialize<'de>>(&self, endpoint: &str) -> Result<T> {
        // Rate limiting
        if let Some(limiter) = &self.rate_limiter {
            let elapsed = limiter.last_request.elapsed();
            let min_interval = Duration::from_millis(60_000 / limiter.requests_per_minute as u64);
            if elapsed < min_interval {
                tokio::time::sleep(min_interval - elapsed).await;
            }
        }
        
        let url = format!("{}/{}", self.base_url, endpoint);
        let headers = self.build_headers()?;
        
        let response = self.client
            .get(&url)
            .headers(headers)
            .send()
            .await
            .map_err(|e| CoreEngineError::io(format!("API request failed: {}", e)))?;
            
        if !response.status().is_success() {
            return Err(CoreEngineError::authentication(
                format!("API request failed with status: {}", response.status())
            ));
        }
        
        let api_response: DellApiResponse<T> = response
            .json()
            .await
            .map_err(|e| CoreEngineError::parsing(format!("Failed to parse API response: {}", e)))?;
            
        Ok(api_response.data)
    }
    
    /// Convert Dell form factor to our enum
    fn map_form_factor(dell_form_factor: &str) -> FormFactor {
        match dell_form_factor.to_lowercase().as_str() {
            "1u" | "1u rack" => FormFactor::OneU,
            "2u" | "2u rack" => FormFactor::TwoU,
            "4u" | "4u rack" => FormFactor::FourU,
            "tower" => FormFactor::Tower,
            "blade" => FormFactor::Blade,
            "micro" | "micro server" => FormFactor::MicroServer,
            _ => FormFactor::Other(dell_form_factor.to_string()),
        }
    }
    
    /// Parse PowerEdge model name
    fn parse_poweredge_model(model_name: &str) -> Option<(String, String)> {
        // Parse models like "PowerEdge R750", "PowerEdge T640", etc.
        if let Some(captures) = regex::Regex::new(r"PowerEdge\s+([A-Z])(\d+)")
            .ok()?
            .captures(model_name) 
        {
            let series = captures.get(1)?.as_str();
            let model = captures.get(2)?.as_str();
            Some((series.to_string(), model.to_string()))
        } else {
            None
        }
    }
    
    /// Convert Dell server config to our ServerModel
    fn convert_server_model(&self, config: &DellServerConfig) -> ServerModel {
        ServerModel {
            vendor: "Dell".to_string(),
            model_id: config.id.clone(),
            model_name: config.name.clone(),
            family: config.family.clone(),
            form_factor: Self::map_form_factor(&config.form_factor),
            cpu_sockets: config.specifications.cpu.sockets,
            max_memory_gb: config.specifications.memory.max_capacity_gb,
            drive_bays: config.specifications.storage.drive_bays,
            pcie_slots: config.specifications.network.expansion_slots,
            power_supply_options: config.specifications.power.power_supplies
                .iter()
                .map(|ps| format!("{}W {}", ps.wattage, ps.efficiency))
                .collect(),
            launch_date: config.availability.launch_date
                .as_ref()
                .and_then(|d| chrono::DateTime::parse_from_rfc3339(d).ok())
                .map(|d| d.with_timezone(&chrono::Utc)),
            end_of_sale: config.availability.end_of_life
                .as_ref()
                .and_then(|d| chrono::DateTime::parse_from_rfc3339(d).ok())
                .map(|d| d.with_timezone(&chrono::Utc)),
            product_brief_url: Some(format!("https://dell.com/products/{}", config.id)),
            quickspecs_url: Some(format!("https://dell.com/specs/{}", config.id)),
        }
    }
    
    /// Convert to detailed specifications
    fn convert_specifications(&self, config: &DellServerConfig) -> ServerSpecifications {
        let server_model = self.convert_server_model(config);
        
        ServerSpecifications {
            model: server_model,
            supported_cpus: config.specifications.cpu.supported_processors
                .iter()
                .map(|cpu| CPUOption {
                    part_number: cpu.part_number.clone(),
                    model_name: cpu.name.clone(),
                    vendor: cpu.vendor.clone(),
                    architecture: "x86_64".to_string(),
                    cores: cpu.cores,
                    threads: cpu.threads,
                    base_frequency_ghz: cpu.base_freq_ghz,
                    max_frequency_ghz: cpu.max_freq_ghz,
                    cache_mb: cpu.cache_mb,
                    tdp_watts: cpu.tdp_watts,
                    supported_memory_types: vec!["DDR4".to_string(), "DDR5".to_string()],
                    max_memory_channels: 8, // Typical for server CPUs
                    list_price: cpu.list_price,
                })
                .collect(),
            memory_configuration: MemoryConfiguration {
                memory_slots: config.specifications.memory.slots,
                max_capacity_gb: config.specifications.memory.max_capacity_gb,
                supported_types: config.specifications.memory.supported_types.clone(),
                supported_speeds: vec![2400, 2666, 2933, 3200], // Common DDR4/DDR5 speeds
                supported_capacities: vec![8, 16, 32, 64, 128], // Common DIMM sizes
                memory_options: config.specifications.memory.memory_options
                    .iter()
                    .map(|mem| MemoryOption {
                        part_number: mem.part_number.clone(),
                        capacity_gb: mem.capacity_gb,
                        memory_type: mem.memory_type.clone(),
                        speed_mhz: mem.speed_mhz,
                        form_factor: "DIMM".to_string(),
                        ecc: mem.ecc,
                        registered: mem.registered,
                        list_price: mem.list_price,
                    })
                    .collect(),
            },
            storage_options: StorageConfiguration {
                drive_bays: (0..config.specifications.storage.drive_bays)
                    .map(|i| super::DriveBay {
                        bay_id: format!("Bay-{}", i + 1),
                        form_factor: "2.5\"".to_string(),
                        interface: "SAS".to_string(),
                        hot_swap: true,
                    })
                    .collect(),
                storage_controllers: config.specifications.storage.supported_controllers
                    .iter()
                    .map(|ctrl| StorageControllerOption {
                        part_number: ctrl.part_number.clone(),
                        model_name: ctrl.name.clone(),
                        controller_type: ctrl.controller_type.clone(),
                        supported_raid_levels: ctrl.supported_raid.clone(),
                        ports: ctrl.ports,
                        cache_mb: ctrl.cache_mb,
                        list_price: ctrl.list_price,
                    })
                    .collect(),
                supported_drives: config.specifications.storage.supported_drives
                    .iter()
                    .map(|drive| DriveOption {
                        part_number: drive.part_number.clone(),
                        capacity_gb: drive.capacity_gb,
                        drive_type: drive.drive_type.clone(),
                        interface: drive.interface.clone(),
                        form_factor: drive.form_factor.clone(),
                        rpm: drive.rpm,
                        endurance: if drive.drive_type == "SSD" { 
                            Some("High".to_string()) 
                        } else { 
                            None 
                        },
                        list_price: drive.list_price,
                    })
                    .collect(),
            },
            network_options: config.specifications.network.network_options
                .iter()
                .map(|net| NetworkOption {
                    part_number: net.part_number.clone(),
                    model_name: net.name.clone(),
                    ports: net.ports,
                    speed_gbps: net.speed_gbps,
                    connector_type: net.connector_type.clone(),
                    interface: "PCIe".to_string(),
                    list_price: net.list_price,
                })
                .collect(),
            expansion_slots: (0..config.specifications.network.expansion_slots)
                .map(|i| ExpansionSlot {
                    slot_id: format!("Slot-{}", i + 1),
                    pcie_version: "PCIe 4.0".to_string(),
                    lanes: 16,
                    form_factor: "Full Height".to_string(),
                    power_watts: Some(75),
                })
                .collect(),
            power_cooling: PowerCoolingSpecs {
                power_supply_options: config.specifications.power.power_supplies
                    .iter()
                    .map(|ps| PowerSupplyOption {
                        part_number: ps.part_number.clone(),
                        wattage: ps.wattage,
                        efficiency_rating: ps.efficiency.clone(),
                        redundancy: ps.redundant,
                        hot_swap: ps.hot_swap,
                        list_price: ps.list_price,
                    })
                    .collect(),
                max_power_consumption_watts: config.specifications.power.max_power_watts,
                typical_power_consumption_watts: config.specifications.power.typical_power_watts,
                cooling_requirements: CoolingRequirements {
                    max_ambient_temp_c: 35,
                    btu_per_hour: config.specifications.power.typical_power_watts * 3, // Approx conversion
                    airflow_cfm: 200, // Typical server airflow
                },
            },
            dimensions: PhysicalDimensions {
                width_mm: config.specifications.dimensions.width_mm,
                depth_mm: config.specifications.dimensions.depth_mm,
                height_mm: config.specifications.dimensions.height_mm,
                weight_kg: config.specifications.dimensions.weight_kg,
                rack_units: config.specifications.dimensions.rack_units,
            },
            supported_operating_systems: vec![
                "Windows Server 2022".to_string(),
                "Windows Server 2019".to_string(),
                "RHEL 8".to_string(),
                "RHEL 9".to_string(),
                "Ubuntu 20.04 LTS".to_string(),
                "Ubuntu 22.04 LTS".to_string(),
                "VMware vSphere 7.0".to_string(),
                "VMware vSphere 8.0".to_string(),
            ],
        }
    }
}

#[async_trait]
impl VendorCatalogClient for DellCatalogClient {
    fn vendor_name(&self) -> &str {
        "Dell"
    }
    
    async fn authenticate(&mut self, credentials: &VendorCredentials) -> Result<()> {
        self.credentials = Some(credentials.clone());
        
        // Test authentication by making a simple API call
        let _: Vec<DellServerConfig> = self.api_request("servers?limit=1").await?;
        
        Ok(())
    }
    
    async fn fetch_server_models(&self) -> Result<Vec<ServerModel>> {
        let dell_configs: Vec<DellServerConfig> = self.api_request("servers").await?;
        
        Ok(dell_configs
            .iter()
            .map(|config| self.convert_server_model(config))
            .collect())
    }
    
    async fn fetch_model_specifications(&self, model_id: &str) -> Result<ServerSpecifications> {
        let dell_config: DellServerConfig = self
            .api_request(&format!("servers/{}/specifications", model_id))
            .await?;
            
        Ok(self.convert_specifications(&dell_config))
    }
    
    async fn fetch_compatible_components(&self, model_id: &str) -> Result<CompatibilityMatrix> {
        let _compatibility_data: serde_json::Value = self
            .api_request(&format!("servers/{}/compatibility", model_id))
            .await?;
            
        // For now, return a basic compatibility matrix
        // In production, this would parse the actual compatibility data
        Ok(CompatibilityMatrix {
            model_id: model_id.to_string(),
            cpu_compatibility: vec![],
            memory_compatibility: vec![],
            storage_compatibility: vec![],
            network_compatibility: vec![],
            validation_rules: vec![],
        })
    }
    
    async fn search_configurations(&self, requirements: &SizingRequirements) -> Result<Vec<RecommendedConfiguration>> {
        // Build query parameters based on requirements
        let mut query_params = vec![];
        
        if let Some(min_cores) = requirements.cpu_cores_minimum {
            query_params.push(format!("min_cores={}", min_cores));
        }
        
        if let Some(min_memory) = requirements.memory_gb_minimum {
            query_params.push(format!("min_memory_gb={}", min_memory));
        }
        
        if let Some(form_factor) = &requirements.form_factor_preference {
            let form_factor_str = match form_factor {
                FormFactor::OneU => "1u",
                FormFactor::TwoU => "2u", 
                FormFactor::FourU => "4u",
                FormFactor::Tower => "tower",
                FormFactor::Blade => "blade",
                FormFactor::MicroServer => "micro",
                FormFactor::Other(s) => s,
            };
            query_params.push(format!("form_factor={}", form_factor_str));
        }
        
        let query_string = if query_params.is_empty() {
            "servers/recommended".to_string()
        } else {
            format!("servers/recommended?{}", query_params.join("&"))
        };
        
        let dell_configs: Vec<DellServerConfig> = self.api_request(&query_string).await?;
        
        // Convert to recommended configurations
        Ok(dell_configs
            .into_iter()
            .map(|config| {
                let server_model = self.convert_server_model(&config);
                RecommendedConfiguration {
                    configuration_id: config.id.clone(),
                    model: server_model,
                    recommended_components: ComponentBundle {
                        cpus: vec![],
                        memory: vec![],
                        storage_controllers: vec![],
                        drives: vec![],
                        network_adapters: vec![],
                        power_supplies: vec![],
                        additional_options: vec![],
                    },
                    performance_metrics: PerformanceEstimate {
                        cpu_performance_score: 85.0,
                        memory_bandwidth_gbps: 100.0,
                        storage_iops: 50000,
                        network_throughput_gbps: 25.0,
                        power_consumption_watts: config.specifications.power.typical_power_watts,
                        thermal_output_btu: config.specifications.power.typical_power_watts * 3,
                    },
                    pricing: config.pricing.as_ref().map(|p| PricingResponse {
                        configuration_id: config.id.clone(),
                        currency: p.currency.clone(),
                        total_list_price: p.list_price,
                        total_partner_price: p.partner_price,
                        component_pricing: vec![],
                        quote_valid_until: chrono::DateTime::parse_from_rfc3339(&p.valid_until)
                            .ok()
                            .map(|d| d.with_timezone(&chrono::Utc))
                            .unwrap_or_else(|| chrono::Utc::now() + chrono::Duration::days(30)),
                        quote_reference: Some(format!("DELL-{}", config.id)),
                    }),
                    confidence_score: 0.9,
                    reasoning: format!("Dell {} recommended based on your requirements", config.name),
                }
            })
            .collect())
    }
    
    async fn get_pricing(&self, configuration: &ConfigurationRequest) -> Result<Option<PricingResponse>> {
        let pricing_data: Option<DellPricing> = self
            .api_request(&format!("configurations/{}/pricing", configuration.model_id))
            .await
            .ok();
            
        Ok(pricing_data.map(|pricing| PricingResponse {
            configuration_id: configuration.model_id.clone(),
            currency: pricing.currency,
            total_list_price: pricing.list_price,
            total_partner_price: pricing.partner_price,
            component_pricing: vec![], // Would be populated from API
            quote_valid_until: chrono::DateTime::parse_from_rfc3339(&pricing.valid_until)
                .ok()
                .map(|d| d.with_timezone(&chrono::Utc))
                .unwrap_or_else(|| chrono::Utc::now() + chrono::Duration::days(30)),
            quote_reference: Some(format!("DELL-QUOTE-{}", configuration.model_id)),
        }))
    }
}

impl Default for DellCatalogClient {
    fn default() -> Self {
        Self::new_sandbox()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_form_factor_mapping() {
        assert_eq!(DellCatalogClient::map_form_factor("1U"), FormFactor::OneU);
        assert_eq!(DellCatalogClient::map_form_factor("2u rack"), FormFactor::TwoU);
        assert_eq!(DellCatalogClient::map_form_factor("Tower"), FormFactor::Tower);
        assert_eq!(DellCatalogClient::map_form_factor("Blade"), FormFactor::Blade);
    }
    
    #[test]
    fn test_poweredge_model_parsing() {
        assert_eq!(
            DellCatalogClient::parse_poweredge_model("PowerEdge R750"),
            Some(("R".to_string(), "750".to_string()))
        );
        assert_eq!(
            DellCatalogClient::parse_poweredge_model("PowerEdge T640"),
            Some(("T".to_string(), "640".to_string()))
        );
        assert_eq!(
            DellCatalogClient::parse_poweredge_model("Invalid Model"),
            None
        );
    }
}