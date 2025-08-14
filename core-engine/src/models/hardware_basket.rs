use serde::{Deserialize, Serialize};
use surrealdb::sql::{Thing, Datetime};

// This file creates a unified data model in Rust that mirrors the frontend's
// TypeScript types. This ensures consistency across the entire application stack.
// These models are defined in the core-engine crate so they can be shared
// between the parser and any consumer of the engine (like the backend API).

// --- Core Data Structures ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareVendor {
    pub id: Option<Thing>,
    pub name: String,
    pub contact_info: Option<String>,
    pub support_info: Option<String>,
    #[serde(default = "chrono::Utc::now")]
    pub created_at: Datetime,
    #[serde(default = "chrono::Utc::now")]
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareBasket {
    pub id: Option<Thing>,
    pub name: String,
    pub vendor: String, // Should link to HardwareVendor record in the future
    pub quarter: String,
    pub year: i32,
    #[serde(default = "chrono::Utc::now")]
    pub import_date: Datetime,
    pub file_path: String,
    pub exchange_rate: Option<f64>,
    pub currency_from: String,
    pub currency_to: String,
    pub validity_date: Option<Datetime>,
    pub created_by: String, // User ID
    pub is_global: bool,
    #[serde(default = "chrono::Utc::now")]
    pub created_at: Datetime,
    pub description: Option<String>,
    pub total_models: Option<i64>,
    pub total_configurations: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareModel {
    pub id: Option<Thing>,
    pub basket_id: Thing,
    pub vendor_id: Thing,
    pub lot_description: String,
    pub model_name: String,
    pub model_number: Option<String>,
    pub form_factor: Option<String>,
    pub category: String, // 'server', 'storage', 'network', 'component'
    pub base_specifications: HardwareSpecifications,
    #[serde(default = "chrono::Utc::now")]
    pub created_at: Datetime,
    #[serde(default = "chrono::Utc::now")]
    pub updated_at: Datetime,
    pub source_sheet: String,
    pub source_section: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareConfiguration {
    pub id: Option<Thing>,
    pub model_id: Thing,
    pub part_number: Option<String>,
    pub sku: Option<String>,
    pub description: String,
    pub item_type: String, // 'base_server', 'processor', 'memory', etc.
    pub quantity: i64,
    pub specifications: Option<serde_json::Value>,
    pub compatibility_notes: Option<String>,
    #[serde(default = "chrono::Utc::now")]
    pub created_at: Datetime,
}

// --- Detailed Specifications ---

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct HardwareSpecifications {
    pub processor: Option<ProcessorSpec>,
    pub memory: Option<MemorySpec>,
    pub storage: Option<StorageSpec>,
    pub network: Option<NetworkSpec>,
    pub expansion: Option<ExpansionSpec>,
    pub power: Option<PowerSpec>,
    pub physical: Option<PhysicalSpec>,
    pub security: Option<SecuritySpec>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessorSpec {
    pub count: i32,
    pub model: String,
    pub cores: Option<i32>,
    pub threads: Option<i32>,
    pub base_frequency: Option<String>,
    pub max_frequency: Option<String>,
    pub tdp: Option<i32>,
    pub socket_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemorySpec {
    pub total_capacity: String,
    pub module_count: i32,
    pub module_capacity: String,
    #[serde(rename = "type")]
    pub memory_type: String, // 'DDR4', 'DDR5'
    pub speed: Option<String>,
    pub ecc: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageSpec {
    pub slots: Vec<StorageSlot>,
    pub raid_controller: Option<String>,
    pub total_capacity: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageSlot {
    pub size: String, // '2.5"', '3.5"'
    pub count: i32,
    pub interface: String, // 'SAS', 'SATA', 'NVMe'
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkSpec {
    pub ports: Vec<NetworkPort>,
    pub management_ports: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkPort {
    pub count: i32,
    pub speed: String, // '1Gb', '10Gb'
    #[serde(rename = "type")]
    pub port_type: String, // 'RJ45', 'SFP+'
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExpansionSpec {
    pub pcie_slots: Option<Vec<PCIeSlot>>,
    pub riser_cards: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PCIeSlot {
    pub count: i32,
    pub generation: String, // 'PCIe 4.0'
    pub lanes: i32,
    pub form_factor: String, // 'full-height'
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PowerSpec {
    pub psu_count: i32,
    pub psu_capacity: String,
    pub redundancy: bool,
    pub efficiency_rating: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PhysicalSpec {
    pub height: String, // '1U', '2U'
    pub depth: String,
    pub weight: Option<String>,
    pub mounting: String, // 'rack', 'tower'
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecuritySpec {
    pub tpm: Option<String>,
    pub secure_boot: Option<bool>,
    pub encryption: Option<Vec<String>>,
}


// --- Pricing and Support ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwarePricing {
    pub id: Option<Thing>,
    pub configuration_id: Option<Thing>,
    pub model_id: Option<Thing>,
    pub list_price: f64,
    pub net_price_usd: f64,
    pub net_price_eur: Option<f64>,
    pub currency: String,
    pub valid_from: Datetime,
    pub valid_to: Option<Datetime>,
    pub support_options: Vec<SupportOption>,
    #[serde(default = "chrono::Utc::now")]
    pub created_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SupportOption {
    pub duration_years: i32,
    #[serde(rename = "type")]
    pub support_type: String, // 'pro_support', 'basic'
    pub price_usd: f64,
    pub price_eur: Option<f64>,
    pub description: Option<String>,
}

// --- Helper and API-specific Structures ---

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateHardwareBasketRequest {
    pub name: String,
    pub vendor: String,
    pub quarter: String,
    pub year: i32,
}

// NOTE: API Response objects that transform the core models into frontend-friendly
// formats will be defined in the API handlers file (`hardware_basket_api.rs` or similar)
// to keep the core data models clean.
