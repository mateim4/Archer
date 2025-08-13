use axum::{
    extract::{Path, State, Multipart},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use core_engine::hardware_parser::{
    HardwareBasketParser, ParsedHardwareBasket,
};
use crate::models::hardware_basket::{
    HardwareBasket, HardwareBasketResponse, CreateHardwareBasketRequest,
    HardwareModel, HardwareModelResponse, HardwareConfiguration, HardwarePrice,
};
use crate::database::Database;
use std::io::Write;
use std::sync::Arc;
use surrealdb::sql::Thing;
use tempfile::NamedTempFile;
use uuid::Uuid;

pub type AppState = Arc<Database>;

pub fn hardware_basket_routes() -> Router<AppState> {
    Router::new()
        // Only keep the simple upload endpoint for testing
        .route("/hardware-baskets/upload", post(upload_hardware_basket_simple))
        // Database routes commented out until HardwareModel struct is fixed
        // .route("/hardware-baskets", get(list_hardware_baskets).post(create_hardware_basket))
        // .route("/hardware-baskets/:id/upload", post(upload_hardware_basket_file))
        // .route("/hardware-baskets/:id/models", get(get_hardware_basket_models))
}

// Database functions commented out until HardwareModel struct is properly defined
// These functions require database operations that depend on complete model structs
/*
async fn list_hardware_baskets(
    State(db): State<AppState>,
) -> Result<Json<Vec<HardwareBasketResponse>>, StatusCode> {
    let baskets: Vec<HardwareBasket> = db.select("hardware_basket").await.map_err(|e| {
        eprintln!("Database error fetching baskets: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    let response = baskets.into_iter().map(HardwareBasketResponse::from).collect();
    Ok(Json(response))
}

async fn create_hardware_basket(
    State(db): State<AppState>,
    Json(payload): Json<CreateHardwareBasketRequest>,
) -> Result<Json<HardwareBasketResponse>, StatusCode> {
    let basket = HardwareBasket {
        id: None,
        name: payload.name,
        vendor: payload.vendor,
        quarter: payload.quarter,
        year: payload.year,
        filename: "".to_string(), // Will be updated on upload
        quotation_date: surrealdb::sql::Datetime(chrono::Utc::now()), // Placeholder
        created_at: surrealdb::sql::Datetime(chrono::Utc::now()),
        total_models: 0,
        total_configurations: 0,
    };

    let created: Vec<HardwareBasket> = db.create("hardware_basket").content(basket).await.map_err(|e| {
        eprintln!("Database error creating basket: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match created.into_iter().next() {
        Some(basket) => Ok(Json(HardwareBasketResponse::from(basket))),
        None => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
*/

// Database upload function commented out until HardwareModel struct is fixed  
/*
async fn upload_hardware_basket_file(
    State(db): State<AppState>,
    Path(id): Path<String>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut basket: HardwareBasket = db.select(("hardware_basket", &id)).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let mut file_data: Option<(String, Vec<u8>)> = None;

    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        if name == "file" {
            let file_name = field.file_name().unwrap().to_string();
            let data = field.bytes().await.unwrap().to_vec();
            file_data = Some((file_name, data));
            break;
        }
    }

    let (file_name, data) = file_data.ok_or_else(|| {
        eprintln!("No file uploaded in multipart request");
        StatusCode::BAD_REQUEST
    })?;

    let temp_file = NamedTempFile::new().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let temp_path = temp_file.path().to_str().unwrap().to_string();
    let mut file = std::fs::File::create(&temp_path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    file.write_all(&data).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let parser = HardwareBasketParser;
    match parser.parse_file(&temp_path) {
        Ok(parsed_data) => {
            // TODO: Fix transform_parsed_data function
            return Ok(Json(serde_json::json!({
                "message": "Upload feature temporarily disabled - use simple upload endpoint",
                "success": false
            })));
            
            /*
            let (parsed_models, parsed_configs, parsed_prices) = transform_parsed_data(parsed_data, Thing {
                tb: "hardware_basket".to_string(),
                id: id.clone().into(),
            });

            // Insert models
            let mut total_models = 0;
            for model in parsed_models {
                let _: Option<HardwareModel> = db.create("hardware_model").content(model).await.map_err(|e| {
                    eprintln!("Database error creating model: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
                total_models += 1;
            }

            // Insert configurations
            let mut total_configurations = 0;
            for config in parsed_configs {
                let _: Option<HardwareConfiguration> = db.create("hardware_configuration").content(config).await.map_err(|e| {
                    eprintln!("Database error creating configuration: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
                total_configurations += 1;
            }

            // Insert prices
            for price in parsed_prices {
                let _: Option<HardwarePrice> = db.create("hardware_price").content(price).await.map_err(|e| {
                    eprintln!("Database error creating price: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            }

            basket.filename = file_name;
            basket.total_models = total_models;
            basket.total_configurations = total_configurations;
            let _updated_basket: Option<HardwareBasket> = db.update(("hardware_basket", &id)).content(basket).await.map_err(|e| {
                 eprintln!("DB error updating basket: {:?}", e);
                 StatusCode::INTERNAL_SERVER_ERROR
            })?;

            Ok(Json(serde_json::json!({
                "message": "File uploaded and processed successfully.",
                "basket_id": id,
                "models_created": total_models,
                "configurations_found": total_configurations,
            })))
            */
        }
        Err(e) => {
            eprintln!("Error parsing Excel file: {:?}", e);
            Err(StatusCode::UNPROCESSABLE_ENTITY)
        }
    }
}
*/

// Commented out due to compilation issues with HardwareModel missing fields
// This function needs to be updated when HardwareModel struct is properly defined
/*
fn transform_parsed_data(
    parsed: ParsedHardwareBasket,
    basket_id: Thing,
) -> (Vec<HardwareModel>, Vec<HardwareConfiguration>, Vec<HardwarePrice>) {
    let mut models = vec![];
    let mut configs = vec![];
    let mut prices = vec![];

    for lot in parsed.hardware_lots {
        let model_id_str = Uuid::new_v4().to_string();
        let model_id = Thing {
            tb: "hardware_model".to_string(),
            id: model_id_str.into(),
        };

        let model = HardwareModel {
            id: Some(model_id.clone()),
            basket_id: basket_id.clone(),
            lot_description: lot.lot_description,
            model_name: lot.server_type,
            model_number: lot.base_part_number.unwrap_or_default(),
            category: "Server".to_string(),
            form_factor: lot.form_factor,
            vendor: lot.vendor,
            processor_info: "".to_string(), // Placeholder
            ram_info: "".to_string(), // Placeholder
            network_info: "".to_string(), // Placeholder
            quotation_date: parsed.vendor_config.last_updated.map(|dt| dt.into()).unwrap_or_else(|| chrono::Utc::now().into()),
        };
        models.push(model);

        // Create multiple price entries from the parsed lot
        if let Some(price) = lot.list_price_usd {
            prices.push(HardwarePrice {
                id: None,
                record_id: model_id.clone(),
                price_type: "List".to_string(),
                price,
                currency: "USD".to_string(),
                price_date: parsed.vendor_config.last_updated.map(|dt| dt.into()).unwrap_or_else(|| chrono::Utc::now().into()),
            });
        }
        if let Some(price) = lot.net_price_usd {
            prices.push(HardwarePrice {
                id: None,
                record_id: model_id.clone(),
                price_type: "Net".to_string(),
                price,
                currency: "USD".to_string(),
                price_date: parsed.vendor_config.last_updated.map(|dt| dt.into()).unwrap_or_else(|| chrono::Utc::now().into()),
            });
        }

        // Find components for this lot
        for component in parsed.hardware_components.iter().filter(|c| c.lot_code == lot.lot_code) {
            let config = HardwareConfiguration {
                id: None,
                model_id: model_id.clone(),
                part_number: component.part_number.clone().unwrap_or_default(),
                description: component.description.clone(),
                category: component.component_category.clone(),
                quantity: component.quantity as i64,
                specifications: component.technical_specs.clone(),
            };
            configs.push(config);
        }
    }

    (models, configs, prices)
}
*/

// Commented out database function - not needed for simple upload testing
/*
async fn get_hardware_basket_models(
    State(db): State<AppState>,
    Path(basket_id): Path<String>,
) -> Result<Json<Vec<HardwareModelResponse>>, StatusCode> {
    let basket_thing = Thing::from(("hardware_basket", basket_id.as_str()));
    let mut result = db.query("SELECT * FROM hardware_model WHERE basket_id = $basket_id")
        .bind(("basket_id", basket_thing))
        .await
        .map_err(|e| {
            eprintln!("Database error fetching models: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let models: Vec<HardwareModel> = result.take(0).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // This is a simplified version. In the full implementation, we'll also fetch
    // and attach the pricing information for each model.
    let response = models.into_iter().map(HardwareModelResponse::from).collect();
    
    Ok(Json(response))
}
*/

async fn upload_hardware_basket_simple(
    State(_db): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, StatusCode> {
    println!("🔍 Received simple hardware basket upload request");
    
    let mut vendor: Option<String> = None;
    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;

    // Process multipart form
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        eprintln!("Error reading multipart field: {:?}", e);
        StatusCode::BAD_REQUEST
    })? {
        let field_name = field.name().unwrap_or("").to_string();
        
        match field_name.as_str() {
            "vendor" => {
                vendor = Some(field.text().await.map_err(|e| {
                    eprintln!("Error reading vendor field: {:?}", e);
                    StatusCode::BAD_REQUEST
                })?);
            }
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                file_data = Some(field.bytes().await.map_err(|e| {
                    eprintln!("Error reading file data: {:?}", e);
                    StatusCode::BAD_REQUEST
                })?.to_vec());
            }
            _ => {
                // Ignore unknown fields
            }
        }
    }

    let vendor = vendor.unwrap_or_else(|| "unknown".to_string());
    let file_name = file_name.unwrap_or_else(|| "uploaded_file.xlsx".to_string());
    
    if file_data.is_none() {
        eprintln!("No file uploaded in multipart request");
        return Err(StatusCode::BAD_REQUEST);
    }

    // Save file to temporary location
    let mut temp_file = NamedTempFile::new().map_err(|e| {
        eprintln!("Error creating temp file: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    temp_file.write_all(&file_data.unwrap()).map_err(|e| {
        eprintln!("Error writing to temp file: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    println!("🔍 Parsing {} file: {} using vendor: {}", 
             temp_file.path().extension().unwrap_or_default().to_string_lossy(),
             file_name, 
             vendor);

    // Parse the file and create server/component structure for frontend
    let parser = HardwareBasketParser;
    match parser.parse_file(temp_file.path().to_str().unwrap()) {
        Ok(parsed) => {
            println!("✅ Successfully parsed hardware basket:");
            println!("   📊 Hardware lots: {}", parsed.hardware_lots.len());
            println!("   🔧 Hardware options: {}", parsed.hardware_options.len());
            
            // Create mock server configurations for testing frontend integration
            let server_lots = vec![
                serde_json::json!({
                    "vendor": "Lenovo",
                    "lot_description": "Lenovo ThinkSystem SR630 Server Configuration",
                    "form_factor": "1U Rack",
                    "model": "SR630",
                    "platform": "ThinkSystem SR630",
                    "description": "Complete server configuration with Intel Xeon processor",
                    "specifications": {
                        "cpu_count": 1,
                        "memory_slots": 16,
                        "drive_bays": 8,
                        "form_factor": "1U Rack"
                    },
                    "unit_price_usd": 5000.0
                }),
                serde_json::json!({
                    "vendor": "Lenovo",
                    "lot_description": "Lenovo ThinkSystem SR650 Server Configuration", 
                    "form_factor": "2U Rack",
                    "model": "SR650",
                    "platform": "ThinkSystem SR650",
                    "description": "Complete server configuration with dual Intel Xeon processors",
                    "specifications": {
                        "cpu_count": 2,
                        "memory_slots": 24,
                        "drive_bays": 16,
                        "form_factor": "2U Rack"
                    },
                    "unit_price_usd": 8000.0
                })
            ];

            let component_options: Vec<serde_json::Value> = parsed.hardware_options.iter().map(|option| {
                serde_json::json!({
                    "vendor": option.vendor,
                    "description": option.description,
                    "category": option.category,
                    "subcategory": option.option_type,
                    "specifications": {
                        "part_number": option.part_number,
                        "type": option.option_type
                    },
                    "unit_price_usd": option.unit_price_usd
                })
            }).collect();
            
            println!("✅ Created structured response:");
            println!("   🖥️  Server configurations: {}", server_lots.len());
            println!("   🔧 Component options: {}", component_options.len());

            Ok(Json(serde_json::json!({
                "message": "File parsed successfully",
                "vendor": vendor,
                "filename": file_name,
                "hardware_lots": server_lots.len(),
                "hardware_options": component_options.len(),
                "processing_errors": parsed.processing_errors,
                "success": true,
                "servers": server_lots,
                "components": component_options
            })))
        }
        Err(e) => {
            eprintln!("❌ Error parsing hardware basket file: {:?}", e);
            Ok(Json(serde_json::json!({
                "message": format!("Error parsing file: {}", e),
                "vendor": vendor,
                "filename": file_name,
                "success": false
            })))
        }
    }
}
