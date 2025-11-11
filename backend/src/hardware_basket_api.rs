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
use core_engine::hardware_parser::basket_parser_new::HardwareBasketParser as NewHardwareBasketParser;
use core_engine::models::hardware_basket::{
    HardwareBasket, CreateHardwareBasketRequest,
    HardwareModel, HardwareConfiguration, HardwarePricing,
};
use surrealdb::sql::Thing;
use crate::database::Database;
use std::io::Write;
use std::sync::Arc;

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

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        eprintln!("Failed to get next multipart field: {}", e);
        StatusCode::BAD_REQUEST
    })? {
        let name = field.name().ok_or_else(|| {
            eprintln!("Multipart field missing name");
            StatusCode::BAD_REQUEST
        })?.to_string();
        
        if name == "file" {
            let file_name = field.file_name().ok_or_else(|| {
                eprintln!("File field missing filename");
                StatusCode::BAD_REQUEST
            })?.to_string();
            
            let data = field.bytes().await.map_err(|e| {
                eprintln!("Failed to read file bytes: {}", e);
                StatusCode::BAD_REQUEST
            })?.to_vec();
            
            file_data = Some((file_name, data));
            break;
        }
    }

    let (file_name, data) = file_data.ok_or_else(|| {
        eprintln!("No file uploaded in multipart request");
        StatusCode::BAD_REQUEST
    })?;

    let temp_file = NamedTempFile::new().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let temp_path = temp_file.path().to_str().ok_or_else(|| {
        eprintln!("Invalid temp file path");
        StatusCode::INTERNAL_SERVER_ERROR
    })?.to_string();
    
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
    
    let file_bytes = file_data.ok_or_else(|| {
        eprintln!("No file uploaded in multipart request");
        StatusCode::BAD_REQUEST
    })?;

    // Save file to temporary location
    let mut temp_file = NamedTempFile::new().map_err(|e| {
        eprintln!("Error creating temp file: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    temp_file.write_all(&file_bytes).map_err(|e| {
        eprintln!("Error writing to temp file: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    println!("🔍 Parsing {} file: {} using vendor: {}",
             temp_file.path().extension().and_then(|e| e.to_str()).unwrap_or("unknown"),
             file_name, 
             vendor);

    // Create mock basket and vendor IDs for parsing
    let basket_id = Thing::from(("hardware_basket", format!("basket_{}", chrono::Utc::now().timestamp_millis())));
    let vendor_id = Thing::from(("vendor", vendor.to_lowercase()));

    // Use the new parser that returns actual HardwareModel structs
    let new_parser = NewHardwareBasketParser;
    let temp_path = temp_file.path().to_str().ok_or_else(|| {
        eprintln!("Invalid temp file path encoding");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    
    match new_parser.parse_file(temp_path, &basket_id, &vendor_id) {
        Ok((models, configurations, prices)) => {
            println!("✅ Successfully parsed hardware basket:");
            println!("   📊 Hardware models: {}", models.len());
            println!("   🔧 Hardware configurations: {}", configurations.len());
            println!("   💰 Hardware prices: {}", prices.len());
            
            // Convert models to JSON response format  
            let servers: Vec<serde_json::Value> = models.iter().map(|model| {
                let mut specs = serde_json::Map::new();
                
                // Extract specifications from model
                if let Some(processor) = &model.base_specifications.processor {
                    specs.insert("processor".to_string(), 
                        serde_json::Value::String(format!("{} cores", processor.cores)));
                }
                if let Some(memory) = &model.base_specifications.memory {
                    specs.insert("memory_gb".to_string(), 
                        serde_json::Value::Number(serde_json::Number::from(memory.total_capacity_gb)));
                }
                if let Some(storage) = &model.base_specifications.storage {
                    specs.insert("storage_type".to_string(), 
                        serde_json::Value::String(storage.drive_type.clone()));
                    specs.insert("storage_capacity_gb".to_string(), 
                        serde_json::Value::Number(serde_json::Number::from(storage.total_capacity_gb)));
                }
                if let Some(network) = &model.base_specifications.network {
                    specs.insert("network_ports".to_string(), 
                        serde_json::Value::Number(serde_json::Number::from(network.port_count)));
                }
                
                serde_json::json!({
                    "id": model.id,
                    "vendor": vendor,
                    "lot_description": model.lot_description,
                    "model_name": model.model_name,
                    "model_number": model.model_number,
                    "form_factor": model.form_factor,
                    "category": model.category,
                    "description": format!("{} - {}", model.model_name, model.lot_description),
                    "specifications": serde_json::Value::Object(specs),
                    "source_sheet": model.source_sheet,
                    "source_section": model.source_section
                })
            }).collect();
            
            // Extract extension components from models
            let mut components: Vec<serde_json::Value> = Vec::new();
            for model in &models {
                if let Some(extensions) = &model.extensions {
                    for extension in extensions {
                        components.push(serde_json::json!({
                            "vendor": vendor,
                            "description": extension.description,
                            "category": extension.component_type,
                            "subcategory": extension.component_type,
                            "specifications": {
                                "part_number": extension.part_number,
                                "type": extension.component_type
                            },
                            "unit_price_usd": 0.0 // TODO: Extract from pricing data
                        }));
                    }
                }
            }
            
            println!("✅ Created structured response:");
            println!("   🖥️  Server configurations: {}", servers.len());
            println!("   🔧 Component options: {}", components.len());

            Ok(Json(serde_json::json!({
                "message": "File parsed successfully",
                "vendor": vendor,
                "filename": file_name,
                "basket_id": basket_id.id.to_string(),
                "hardware_lots": servers.len(),
                "hardware_options": components.len(),
                "processing_errors": [],
                "success": true,
                "servers": servers,
                "components": components,
                "parsing_details": {
                    "models_parsed": models.len(),
                    "configurations_parsed": configurations.len(),
                    "prices_parsed": prices.len(),
                    "server_models_found": servers.len(),
                    "extension_components_found": components.len()
                }
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
