use axum::{
    extract::{Path, Query, State, Multipart},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use chrono::Utc;
use serde_json::json;
use std::collections::HashMap;
use uuid::Uuid;

use crate::database::Database;
use crate::models::*;

pub fn hardware_basket_routes() -> Router<std::sync::Arc<Database>> {
    Router::new()
        .route("/hardware-baskets", get(list_hardware_baskets).post(create_hardware_basket))
        .route("/hardware-baskets/:id", get(get_hardware_basket).put(update_hardware_basket).delete(delete_hardware_basket))
        .route("/hardware-baskets/:id/upload", post(upload_excel_file))
        .route("/hardware-baskets/:id/process", post(process_excel_file))
        .route("/hardware-baskets/:id/models", get(list_hardware_models))
        .route("/hardware-models/:id", get(get_hardware_model))
        .route("/hardware-models/:id/configurations", get(list_hardware_configurations))
        .route("/vendors", get(list_vendors).post(create_vendor))
        .route("/import-results/:basket_id", get(get_import_result))
}

// Hardware Basket endpoints
async fn list_hardware_baskets(
    State(db): State<std::sync::Arc<Database>>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<HardwareBasketResponse>>, StatusCode> {
    let mut query = "SELECT * FROM hardware_baskets".to_string();
    
    // Add filtering by vendor if specified
    if let Some(vendor) = params.get("vendor") {
        query = format!("{} WHERE vendor_id.name = '{}'", query, vendor);
    }
    
    query = format!("{} ORDER BY created_at DESC", query);
    
    let baskets: Vec<HardwareBasket> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let responses = baskets.into_iter().map(|basket| {
        HardwareBasketResponse {
            id: basket.id.map(|id| id.to_string()).unwrap_or_default(),
            name: basket.name,
            vendor_name: "".to_string(), // Will be populated by join
            quarter: basket.quarter,
            year: basket.year,
            import_date: basket.import_date,
            file_path: basket.file_path,
            exchange_rate: basket.exchange_rate,
            currency_from: basket.currency_from,
            currency_to: basket.currency_to,
            validity_date: basket.validity_date,
            created_at: basket.created_at,
        }
    }).collect();
    
    Ok(Json(responses))
}

async fn create_hardware_basket(
    State(db): State<std::sync::Arc<Database>>,
    Json(request): Json<CreateHardwareBasketRequest>,
) -> Result<Json<HardwareBasketResponse>, StatusCode> {
    // First, find or create the vendor
    let vendor_query = format!("SELECT * FROM hardware_vendors WHERE name = '{}'", request.vendor_name);
    let mut vendors: Vec<HardwareVendor> = db.query(&vendor_query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let vendor = if vendors.is_empty() {
        // Create new vendor
        let new_vendor = HardwareVendor {
            id: None,
            name: request.vendor_name.clone(),
            contact_info: None,
            support_info: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let created_vendors: Vec<HardwareVendor> = db.create("hardware_vendors")
            .content(&new_vendor)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        created_vendors.into_iter().next().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        vendors.remove(0)
    };
    
    // Create the hardware basket
    let basket = HardwareBasket {
        id: None,
        name: request.name,
        vendor_id: vendor.id.unwrap(),
        quarter: request.quarter,
        year: request.year,
        import_date: Utc::now(),
        file_path: "".to_string(), // Will be set when file is uploaded
        exchange_rate: request.exchange_rate,
        currency_from: request.currency_from,
        currency_to: request.currency_to,
        validity_date: request.validity_date,
        created_at: Utc::now(),
    };
    
    let created_baskets: Vec<HardwareBasket> = db.create("hardware_baskets")
        .content(&basket)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let created_basket = created_baskets.into_iter().next().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let response = HardwareBasketResponse {
        id: created_basket.id.map(|id| id.to_string()).unwrap_or_default(),
        name: created_basket.name,
        vendor_name: vendor.name,
        quarter: created_basket.quarter,
        year: created_basket.year,
        import_date: created_basket.import_date,
        file_path: created_basket.file_path,
        exchange_rate: created_basket.exchange_rate,
        currency_from: created_basket.currency_from,
        currency_to: created_basket.currency_to,
        validity_date: created_basket.validity_date,
        created_at: created_basket.created_at,
    };
    
    Ok(Json(response))
}

async fn get_hardware_basket(
    State(db): State<std::sync::Arc<Database>>,
    Path(id): Path<String>,
) -> Result<Json<HardwareBasketResponse>, StatusCode> {
    let query = format!("SELECT * FROM hardware_baskets WHERE id = hardware_baskets:{}", id);
    
    let mut baskets: Vec<HardwareBasket> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let basket = baskets.pop().ok_or(StatusCode::NOT_FOUND)?;
    
    let response = HardwareBasketResponse {
        id: basket.id.map(|id| id.to_string()).unwrap_or_default(),
        name: basket.name,
        vendor_name: "".to_string(), // Will be populated by join
        quarter: basket.quarter,
        year: basket.year,
        import_date: basket.import_date,
        file_path: basket.file_path,
        exchange_rate: basket.exchange_rate,
        currency_from: basket.currency_from,
        currency_to: basket.currency_to,
        validity_date: basket.validity_date,
        created_at: basket.created_at,
    };
    
    Ok(Json(response))
}

async fn update_hardware_basket(
    State(db): State<std::sync::Arc<Database>>,
    Path(id): Path<String>,
    Json(request): Json<CreateHardwareBasketRequest>,
) -> Result<Json<HardwareBasketResponse>, StatusCode> {
    let query = format!("UPDATE hardware_baskets:{} SET name = '{}', quarter = '{}', year = {}, exchange_rate = {:?}, currency_from = '{}', currency_to = '{}', updated_at = time::now()", 
        id, request.name, request.quarter, request.year, request.exchange_rate, request.currency_from, request.currency_to);
    
    let updated_baskets: Vec<HardwareBasket> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let basket = updated_baskets.into_iter().next().ok_or(StatusCode::NOT_FOUND)?;
    
    let response = HardwareBasketResponse {
        id: basket.id.map(|id| id.to_string()).unwrap_or_default(),
        name: basket.name,
        vendor_name: request.vendor_name,
        quarter: basket.quarter,
        year: basket.year,
        import_date: basket.import_date,
        file_path: basket.file_path,
        exchange_rate: basket.exchange_rate,
        currency_from: basket.currency_from,
        currency_to: basket.currency_to,
        validity_date: basket.validity_date,
        created_at: basket.created_at,
    };
    
    Ok(Json(response))
}

async fn delete_hardware_basket(
    State(db): State<std::sync::Arc<Database>>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let query = format!("DELETE hardware_baskets:{}", id);
    
    db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(StatusCode::NO_CONTENT)
}

// File upload endpoint
async fn upload_excel_file(
    State(db): State<std::sync::Arc<Database>>,
    Path(basket_id): Path<String>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, StatusCode> {
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "file" {
            let filename = field.file_name().unwrap_or("unknown.xlsx").to_string();
            let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
            
            // Save file to uploads directory
            let file_path = format!("/tmp/hardware_baskets/{}", filename);
            std::fs::create_dir_all("/tmp/hardware_baskets")
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            std::fs::write(&file_path, data)
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            
            // Update basket with file path
            let query = format!("UPDATE hardware_baskets:{} SET file_path = '{}'", basket_id, file_path);
            db.query(&query)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            
            return Ok(Json(json!({
                "message": "File uploaded successfully",
                "file_path": file_path,
                "filename": filename
            })));
        }
    }
    
    Err(StatusCode::BAD_REQUEST)
}

// Process Excel file endpoint
async fn process_excel_file(
    State(db): State<std::sync::Arc<Database>>,
    Path(basket_id): Path<String>,
) -> Result<Json<ImportResultResponse>, StatusCode> {
    // Get the basket
    let query = format!("SELECT * FROM hardware_baskets WHERE id = hardware_baskets:{}", basket_id);
    let mut baskets: Vec<HardwareBasket> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let basket = baskets.pop().ok_or(StatusCode::NOT_FOUND)?;
    
    if basket.file_path.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    
    // Create import result record
    let import_result = ImportResult {
        id: None,
        basket_id: basket.id.unwrap(),
        status: "processing".to_string(),
        total_models: 0,
        processed_models: 0,
        total_configurations: 0,
        processed_configurations: 0,
        errors: json!([]),
        warnings: json!([]),
        started_at: Utc::now(),
        completed_at: None,
    };
    
    let created_results: Vec<ImportResult> = db.create("import_results")
        .content(&import_result)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let result = created_results.into_iter().next().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // TODO: Here we would call the Excel processing service
    // For now, just return the initial result
    
    let response = ImportResultResponse {
        id: result.id.map(|id| id.to_string()).unwrap_or_default(),
        basket_id: basket_id,
        status: result.status,
        total_models: result.total_models,
        processed_models: result.processed_models,
        total_configurations: result.total_configurations,
        processed_configurations: result.processed_configurations,
        errors: result.errors,
        warnings: result.warnings,
        started_at: result.started_at,
        completed_at: result.completed_at,
    };
    
    Ok(Json(response))
}

// Hardware Models endpoints
async fn list_hardware_models(
    State(db): State<std::sync::Arc<Database>>,
    Path(basket_id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<HardwareModelResponse>>, StatusCode> {
    let mut query = format!("SELECT * FROM hardware_models WHERE basket_id = hardware_baskets:{}", basket_id);
    
    if let Some(category) = params.get("category") {
        query = format!("{} AND category = '{}'", query, category);
    }
    
    query = format!("{} ORDER BY created_at DESC", query);
    
    let models: Vec<HardwareModel> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let mut responses = Vec::new();
    
    for model in models {
        let model_id = model.id.as_ref().map(|id| id.to_string()).unwrap_or_default();
        
        // Get configurations for this model
        let config_query = format!("SELECT * FROM hardware_configurations WHERE model_id = hardware_models:{}", model_id);
        let configurations: Vec<HardwareConfiguration> = db.query(&config_query)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .take(0)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let config_responses: Vec<HardwareConfigurationResponse> = configurations.into_iter().map(|config| {
            HardwareConfigurationResponse {
                id: config.id.map(|id| id.to_string()).unwrap_or_default(),
                model_id: config.model_id.to_string(),
                part_number: config.part_number,
                sku: config.sku,
                description: config.description,
                item_type: config.item_type,
                quantity: config.quantity,
                specifications: config.specifications,
                compatibility_notes: config.compatibility_notes,
                created_at: config.created_at,
            }
        }).collect();
        
        // Get pricing for this model
        let pricing_query = format!("SELECT * FROM hardware_pricing WHERE model_id = hardware_models:{}", model_id);
        let mut pricings: Vec<HardwarePricing> = db.query(&pricing_query)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .take(0)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let pricing_response = pricings.pop().map(|pricing| {
            HardwarePricingResponse {
                id: pricing.id.map(|id| id.to_string()).unwrap_or_default(),
                list_price: pricing.list_price,
                net_price_usd: pricing.net_price_usd,
                net_price_eur: pricing.net_price_eur,
                currency: pricing.currency,
                valid_from: pricing.valid_from,
                valid_to: pricing.valid_to,
                support_options: pricing.support_options,
                created_at: pricing.created_at,
            }
        });
        
        let response = HardwareModelResponse {
            id: model_id,
            basket_id: model.basket_id.to_string(),
            vendor_name: "".to_string(), // Will be populated by join
            lot_description: model.lot_description,
            model_name: model.model_name,
            model_number: model.model_number,
            form_factor: model.form_factor,
            category: model.category,
            base_specifications: model.base_specifications,
            pricing: pricing_response,
            configurations: config_responses,
            created_at: model.created_at,
            updated_at: model.updated_at,
        };
        
        responses.push(response);
    }
    
    Ok(Json(responses))
}

async fn get_hardware_model(
    State(db): State<std::sync::Arc<Database>>,
    Path(id): Path<String>,
) -> Result<Json<HardwareModelResponse>, StatusCode> {
    let query = format!("SELECT * FROM hardware_models WHERE id = hardware_models:{}", id);
    
    let mut models: Vec<HardwareModel> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let model = models.pop().ok_or(StatusCode::NOT_FOUND)?;
    let model_id = model.id.as_ref().map(|id| id.to_string()).unwrap_or_default();
    
    // Get configurations
    let config_query = format!("SELECT * FROM hardware_configurations WHERE model_id = hardware_models:{}", model_id);
    let configurations: Vec<HardwareConfiguration> = db.query(&config_query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let config_responses: Vec<HardwareConfigurationResponse> = configurations.into_iter().map(|config| {
        HardwareConfigurationResponse {
            id: config.id.map(|id| id.to_string()).unwrap_or_default(),
            model_id: config.model_id.to_string(),
            part_number: config.part_number,
            sku: config.sku,
            description: config.description,
            item_type: config.item_type,
            quantity: config.quantity,
            specifications: config.specifications,
            compatibility_notes: config.compatibility_notes,
            created_at: config.created_at,
        }
    }).collect();
    
    // Get pricing
    let pricing_query = format!("SELECT * FROM hardware_pricing WHERE model_id = hardware_models:{}", model_id);
    let mut pricings: Vec<HardwarePricing> = db.query(&pricing_query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let pricing_response = pricings.pop().map(|pricing| {
        HardwarePricingResponse {
            id: pricing.id.map(|id| id.to_string()).unwrap_or_default(),
            list_price: pricing.list_price,
            net_price_usd: pricing.net_price_usd,
            net_price_eur: pricing.net_price_eur,
            currency: pricing.currency,
            valid_from: pricing.valid_from,
            valid_to: pricing.valid_to,
            support_options: pricing.support_options,
            created_at: pricing.created_at,
        }
    });
    
    let response = HardwareModelResponse {
        id: model_id,
        basket_id: model.basket_id.to_string(),
        vendor_name: "".to_string(), // Will be populated by join
        lot_description: model.lot_description,
        model_name: model.model_name,
        model_number: model.model_number,
        form_factor: model.form_factor,
        category: model.category,
        base_specifications: model.base_specifications,
        pricing: pricing_response,
        configurations: config_responses,
        created_at: model.created_at,
        updated_at: model.updated_at,
    };
    
    Ok(Json(response))
}

async fn list_hardware_configurations(
    State(db): State<std::sync::Arc<Database>>,
    Path(model_id): Path<String>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<HardwareConfigurationResponse>>, StatusCode> {
    let mut query = format!("SELECT * FROM hardware_configurations WHERE model_id = hardware_models:{}", model_id);
    
    if let Some(item_type) = params.get("item_type") {
        query = format!("{} AND item_type = '{}'", query, item_type);
    }
    
    query = format!("{} ORDER BY created_at ASC", query);
    
    let configurations: Vec<HardwareConfiguration> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let responses: Vec<HardwareConfigurationResponse> = configurations.into_iter().map(|config| {
        HardwareConfigurationResponse {
            id: config.id.map(|id| id.to_string()).unwrap_or_default(),
            model_id: config.model_id.to_string(),
            part_number: config.part_number,
            sku: config.sku,
            description: config.description,
            item_type: config.item_type,
            quantity: config.quantity,
            specifications: config.specifications,
            compatibility_notes: config.compatibility_notes,
            created_at: config.created_at,
        }
    }).collect();
    
    Ok(Json(responses))
}

// Vendor endpoints
async fn list_vendors(
    State(db): State<std::sync::Arc<Database>>,
) -> Result<Json<Vec<HardwareVendor>>, StatusCode> {
    let vendors: Vec<HardwareVendor> = db.select("hardware_vendors")
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(vendors))
}

async fn create_vendor(
    State(db): State<std::sync::Arc<Database>>,
    Json(vendor): Json<HardwareVendor>,
) -> Result<Json<HardwareVendor>, StatusCode> {
    let mut new_vendor = vendor;
    new_vendor.id = None;
    new_vendor.created_at = Utc::now();
    new_vendor.updated_at = Utc::now();
    
    let created_vendors: Vec<HardwareVendor> = db.create("hardware_vendors")
        .content(&new_vendor)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let created_vendor = created_vendors.into_iter().next().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(created_vendor))
}

// Import Result endpoint
async fn get_import_result(
    State(db): State<std::sync::Arc<Database>>,
    Path(basket_id): Path<String>,
) -> Result<Json<ImportResultResponse>, StatusCode> {
    let query = format!("SELECT * FROM import_results WHERE basket_id = hardware_baskets:{} ORDER BY started_at DESC", basket_id);
    
    let mut results: Vec<ImportResult> = db.query(&query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let result = results.pop().ok_or(StatusCode::NOT_FOUND)?;
    
    let response = ImportResultResponse {
        id: result.id.map(|id| id.to_string()).unwrap_or_default(),
        basket_id: basket_id,
        status: result.status,
        total_models: result.total_models,
        processed_models: result.processed_models,
        total_configurations: result.total_configurations,
        processed_configurations: result.processed_configurations,
        errors: result.errors,
        warnings: result.warnings,
        started_at: result.started_at,
        completed_at: result.completed_at,
    };
    
    Ok(Json(response))
}
