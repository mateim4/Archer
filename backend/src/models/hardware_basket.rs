use serde::{Deserialize, Serialize};
use surrealdb::sql::{Thing, Datetime};

// Represents a single hardware basket import session
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareBasket {
    pub id: Option<Thing>,
    pub name: String,
    pub vendor: String,
    pub quarter: String,
    pub year: i32,
    pub filename: String,
    pub quotation_date: Datetime,
    #[serde(default = "default_datetime")]
    pub created_at: Datetime,
    pub total_models: i64,
    pub total_configurations: i64,
}

// Represents a single server model within a basket (e.g., a "Lot")
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareModel {
    pub id: Option<Thing>,
    pub basket_id: Thing,
    pub lot_description: String,
    pub model_name: String,
    pub model_number: String,
    pub category: String,
    pub form_factor: String,
    pub vendor: String,
    
    // Key specifications for UI display
    pub processor_info: String,
    pub ram_info: String,
    pub network_info: String,
    
    pub quotation_date: Datetime,
}

// Represents a single line item in the configuration of a HardwareModel
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwareConfiguration {
    pub id: Option<Thing>,
    pub model_id: Thing,
    pub part_number: String,
    pub description: String,
    pub category: String,
    pub quantity: i64,
    // Storing the raw row data can be useful for debugging and future-proofing
    pub specifications: serde_json::Value,
}

// Represents a pricing entry for a HardwareModel or HardwareConfiguration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HardwarePrice {
    pub id: Option<Thing>,
    pub record_id: Thing, // Can be a model_id or configuration_id
    // e.g., "List Price", "Net Price US$", "Price with 5yr PSP"
    pub price_type: String, 
    pub price: f64, 
    pub currency: String,
    pub price_date: Datetime,
}

// --- API Request & Response Structures ---

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateHardwareBasketRequest {
    pub name: String,
    pub vendor: String,
    pub quarter: String,
    pub year: i32,
}


#[derive(Debug, Serialize)]
pub struct HardwareBasketResponse {
    pub id: String,
    pub name: String,
    pub vendor: String,
    pub quarter: String,
    pub year: i32,
    pub filename: String,
    pub quotation_date: String,
    pub created_at: String,
    pub total_models: i64,
    pub total_configurations: i64,
}

impl From<HardwareBasket> for HardwareBasketResponse {
    fn from(basket: HardwareBasket) -> Self {
        Self {
            id: basket.id.map(|t| t.id.to_string()).unwrap_or_default(),
            name: basket.name,
            vendor: basket.vendor,
            quarter: basket.quarter,
            year: basket.year,
            filename: basket.filename,
            quotation_date: basket.quotation_date.to_string(),
            created_at: basket.created_at.to_string(),
            total_models: basket.total_models,
            total_configurations: basket.total_configurations,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct HardwareModelResponse {
     pub id: String,
    pub basket_id: String,
    pub lot_description: String,
    pub model_name: String,
    pub model_number: String,
    pub category: String,
    pub form_factor: String,
    pub vendor: String,
    pub processor_info: String,
    pub ram_info: String,
    pub network_info: String,
    pub quotation_date: String,
    pub prices: serde_json::Value,
}

impl From<HardwareModel> for HardwareModelResponse {
    fn from(model: HardwareModel) -> Self {
        Self {
            id: model.id.map(|t| t.id.to_string()).unwrap_or_default(),
            basket_id: model.basket_id.id.to_string(),
            lot_description: model.lot_description,
            model_name: model.model_name,
            model_number: model.model_number,
            category: model.category,
            form_factor: model.form_factor,
            vendor: model.vendor,
            processor_info: model.processor_info,
            ram_info: model.ram_info,
            network_info: model.network_info,
            quotation_date: model.quotation_date.to_string(),
            prices: serde_json::Value::Null, // Placeholder, to be populated later
        }
    }
}

// Default function for creating a new Datetime instance
fn default_datetime() -> Datetime {
    Datetime(chrono::Utc::now())
}
