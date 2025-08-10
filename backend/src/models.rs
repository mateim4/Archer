use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub owner_id: Thing,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Option<Thing>,
    pub username: String,
    pub email: String,
    pub ad_guid: String,
    pub role: String, // "admin", "editor", "viewer"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareItem {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value, // Using JSON for flexibility
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignDocument {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(rename = "type")]
    pub doc_type: String, // "hld" or "lld"
    pub content: String, // Markdown or JSON
}

// DTOs for API requests/responses
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateHardwareRequest {
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateHardwareRequest {
    pub name: Option<String>,
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub specs: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDesignDocRequest {
    pub name: String,
    pub doc_type: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDesignDocRequest {
    pub name: Option<String>,
    pub doc_type: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProjectResponse {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Project> for ProjectResponse {
    fn from(project: Project) -> Self {
        Self {
            id: project.id.map(|id| id.to_string()).unwrap_or_default(),
            name: project.name,
            description: project.description,
            owner_id: project.owner_id.to_string(),
            created_at: project.created_at,
            updated_at: project.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct HardwareResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value,
}

impl From<HardwareItem> for HardwareResponse {
    fn from(hardware: HardwareItem) -> Self {
        Self {
            id: hardware.id.map(|id| id.to_string()).unwrap_or_default(),
            project_id: hardware.project_id.to_string(),
            name: hardware.name,
            vendor: hardware.vendor,
            model: hardware.model,
            specs: hardware.specs,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct DesignDocResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub doc_type: String,
    pub content: String,
}

impl From<DesignDocument> for DesignDocResponse {
    fn from(doc: DesignDocument) -> Self {
        Self {
            id: doc.id.map(|id| id.to_string()).unwrap_or_default(),
            project_id: doc.project_id.to_string(),
            name: doc.name,
            doc_type: doc.doc_type,
            content: doc.content,
        }
    }
}

// Hardware Basket Models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareVendor {
    pub id: Option<Thing>,
    pub name: String,
    pub contact_info: Option<String>,
    pub support_info: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareBasket {
    pub id: Option<Thing>,
    pub name: String,
    pub vendor_id: Thing,
    pub quarter: String,
    pub year: i32,
    pub import_date: DateTime<Utc>,
    pub file_path: String,
    pub exchange_rate: Option<f64>,
    pub currency_from: String,
    pub currency_to: String,
    pub validity_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareModel {
    pub id: Option<Thing>,
    pub basket_id: Thing,
    pub vendor_id: Thing,
    pub lot_description: String,
    pub model_name: String,
    pub model_number: Option<String>,
    pub form_factor: Option<String>,
    pub category: String,
    pub base_specifications: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareConfiguration {
    pub id: Option<Thing>,
    pub model_id: Thing,
    pub part_number: Option<String>,
    pub sku: Option<String>,
    pub description: String,
    pub item_type: String,
    pub quantity: i32,
    pub specifications: Option<serde_json::Value>,
    pub compatibility_notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwarePricing {
    pub id: Option<Thing>,
    pub configuration_id: Option<Thing>,
    pub model_id: Option<Thing>,
    pub list_price: f64,
    pub net_price_usd: f64,
    pub net_price_eur: Option<f64>,
    pub currency: String,
    pub valid_from: DateTime<Utc>,
    pub valid_to: Option<DateTime<Utc>>,
    pub support_options: serde_json::Value, // Array of support options
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountrySupport {
    pub id: Option<Thing>,
    pub vendor_id: Thing,
    pub country: String,
    pub region: Option<String>,
    pub fulfillment_capability: String,
    pub web_ordering: bool,
    pub delivery_terms: String,
    pub delivery_time_days: Option<i32>,
    pub import_duties: Option<String>,
    pub vat_rates: Option<String>,
    pub freight_costs: Option<String>,
    pub affiliate_info: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRate {
    pub id: Option<Thing>,
    pub from_currency: String,
    pub to_currency: String,
    pub rate: f64,
    pub effective_date: DateTime<Utc>,
    pub expiry_date: Option<DateTime<Utc>>,
    pub source: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub id: Option<Thing>,
    pub basket_id: Thing,
    pub status: String, // processing, completed, failed, partial
    pub total_models: i32,
    pub processed_models: i32,
    pub total_configurations: i32,
    pub processed_configurations: i32,
    pub errors: serde_json::Value, // Array of errors
    pub warnings: serde_json::Value, // Array of warnings
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

// Hardware Basket DTOs
#[derive(Debug, Deserialize)]
pub struct CreateHardwareBasketRequest {
    pub name: String,
    pub vendor_name: String,
    pub quarter: String,
    pub year: i32,
    pub exchange_rate: Option<f64>,
    pub currency_from: String,
    pub currency_to: String,
    pub validity_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct ProcessExcelRequest {
    pub basket_id: String,
}

#[derive(Debug, Serialize)]
pub struct HardwareBasketResponse {
    pub id: String,
    pub name: String,
    pub vendor_name: String,
    pub quarter: String,
    pub year: i32,
    pub import_date: DateTime<Utc>,
    pub file_path: String,
    pub exchange_rate: Option<f64>,
    pub currency_from: String,
    pub currency_to: String,
    pub validity_date: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct HardwareModelResponse {
    pub id: String,
    pub basket_id: String,
    pub vendor_name: String,
    pub lot_description: String,
    pub model_name: String,
    pub model_number: Option<String>,
    pub form_factor: Option<String>,
    pub category: String,
    pub base_specifications: serde_json::Value,
    pub pricing: Option<HardwarePricingResponse>,
    pub configurations: Vec<HardwareConfigurationResponse>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct HardwareConfigurationResponse {
    pub id: String,
    pub model_id: String,
    pub part_number: Option<String>,
    pub sku: Option<String>,
    pub description: String,
    pub item_type: String,
    pub quantity: i32,
    pub specifications: Option<serde_json::Value>,
    pub compatibility_notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct HardwarePricingResponse {
    pub id: String,
    pub list_price: f64,
    pub net_price_usd: f64,
    pub net_price_eur: Option<f64>,
    pub currency: String,
    pub valid_from: DateTime<Utc>,
    pub valid_to: Option<DateTime<Utc>>,
    pub support_options: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ImportResultResponse {
    pub id: String,
    pub basket_id: String,
    pub status: String,
    pub total_models: i32,
    pub processed_models: i32,
    pub total_configurations: i32,
    pub processed_configurations: i32,
    pub errors: serde_json::Value,
    pub warnings: serde_json::Value,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}
