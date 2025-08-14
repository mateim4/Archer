use axum::{
    extract::{Path, State, Multipart},
    http::StatusCode,
    response::{Json, IntoResponse},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use std::collections::HashMap;
use chrono::Utc;
use tempfile::NamedTempFile;
use std::io::Write;

use crate::database::AppState;
use core_engine::hardware_parser::basket_parser_new::HardwareBasketParser;
use core_engine::models::hardware_basket::{
    HardwareBasket, HardwareModel, HardwareConfiguration, HardwarePricing,
    CreateHardwareBasketRequest, HardwareVendor
};

#[derive(Serialize, Deserialize)]
pub struct CreateBasketResponse {
    pub id: String,
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct UploadResponse {
    pub success: bool,
    pub message: String,
    pub models_count: usize,
    pub configurations_count: usize,
    pub pricing_count: usize,
    pub servers: Vec<serde_json::Value>,
    pub components: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/hardware-baskets", get(get_hardware_baskets).post(create_hardware_basket))
        .route("/hardware-baskets/upload", post(upload_new_hardware_basket))
        .route("/hardware-baskets/:id", get(get_hardware_basket))
        .route("/hardware-baskets/:id/upload", post(upload_hardware_basket))
        .route("/hardware-baskets/:id/models", get(get_hardware_basket_models))
}

async fn get_hardware_baskets(State(db): State<AppState>) -> impl IntoResponse {
    match db.select::<Vec<HardwareBasket>>("hardware_basket").await {
        Ok(baskets) => Json(baskets).into_response(),
        Err(e) => {
            tracing::error!("Failed to fetch hardware baskets: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                error: "Failed to fetch hardware baskets".to_string()
            })).into_response()
        }
    }
}

async fn create_hardware_basket(
    State(db): State<AppState>,
    Json(request): Json<CreateHardwareBasketRequest>
) -> impl IntoResponse {
    let basket_id = Thing {
        tb: "hardware_basket".to_string(),
        id: surrealdb::sql::Id::rand(),
    };

    let basket = HardwareBasket {
        id: Some(basket_id.clone()),
        name: request.name,
        vendor: request.vendor,
        quarter: request.quarter,
        year: request.year,
        import_date: Utc::now().into(),
        file_path: String::new(), // Will be set during upload
        exchange_rate: Some(1.0),
        currency_from: "USD".to_string(),
        currency_to: "USD".to_string(),
        validity_date: None,
        created_by: "system".to_string(), // TODO: Get from auth context
        is_global: false,
        created_at: Utc::now().into(),
        description: None,
        total_models: Some(0),
        total_configurations: Some(0),
    };

    match db.create::<Vec<HardwareBasket>>("hardware_basket").content(basket).await {
        Ok(mut created_baskets) => {
            if let Some(created_basket) = created_baskets.pop() {
                Json(CreateBasketResponse {
                    id: format!("{}", created_basket.id.unwrap()),
                    message: "Hardware basket created successfully".to_string(),
                }).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                    error: "Failed to create hardware basket".to_string()
                })).into_response()
            }
        },
        Err(e) => {
            tracing::error!("Database error creating basket: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                error: "Database error".to_string()
            })).into_response()
        }
    }
}

async fn get_hardware_basket(
    Path(id): Path<String>,
    State(db): State<AppState>
) -> impl IntoResponse {
    tracing::info!("🔍 Fetching basket: {}", id);
    
    // Use direct record selection with the proper format
    let record_id = format!("hardware_basket:{}", id);
    
    match db.select::<Vec<HardwareBasket>>(&record_id).await {
        Ok(baskets) => {
            if let Some(basket) = baskets.first() {
                tracing::info!("✅ Found basket: {}", basket.name);
                Json(basket.clone()).into_response()
            } else {
                tracing::warn!("❌ Basket not found: {}", id);
                (StatusCode::NOT_FOUND, Json(ErrorResponse {
                    error: "Hardware basket not found".to_string()
                })).into_response()
            }
        },
        Err(e) => {
            tracing::error!("❌ Failed to fetch hardware basket {}: {}", id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                error: "Failed to fetch hardware basket".to_string()
            })).into_response()
        }
    }
}

async fn upload_new_hardware_basket(
    State(db): State<AppState>,
    mut multipart: Multipart
) -> impl IntoResponse {
    tracing::info!("Received new hardware basket upload request");

    // Process the multipart form data
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "file" {
            let filename = field.file_name().unwrap_or("unknown").to_string();
            tracing::info!("Processing file: {}", filename);

            // Read file data
            let data = match field.bytes().await {
                Ok(data) => data,
                Err(e) => {
                    tracing::error!("Failed to read file data: {}", e);
                    return (StatusCode::BAD_REQUEST, Json(ErrorResponse {
                        error: "Failed to read file".to_string()
                    })).into_response();
                }
            };

            // Extract vendor and quarter from filename
            let (vendor, quarter) = if filename.to_lowercase().contains("dell") {
                ("Dell".to_string(), "Q3 2025".to_string())
            } else if filename.to_lowercase().contains("lenovo") {
                ("Lenovo".to_string(), "Q3 2025".to_string())
            } else {
                ("Unknown".to_string(), "Q3 2025".to_string())
            };

            // Create new basket
            let basket_id = Thing {
                tb: "hardware_basket".to_string(),
                id: surrealdb::sql::Id::rand(),
            };

            let basket = HardwareBasket {
                id: Some(basket_id.clone()),
                name: format!("{} {} Hardware Basket", vendor, quarter),
                vendor: vendor.clone(),
                quarter: quarter.clone(),
                year: 2025,
                import_date: Utc::now().into(),
                file_path: filename.clone(),
                exchange_rate: Some(1.0),
                currency_from: "USD".to_string(),
                currency_to: "USD".to_string(),
                validity_date: None,
                created_by: "system".to_string(),
                is_global: false,
                created_at: Utc::now().into(),
                description: Some(format!("Auto-imported from {}", filename)),
                total_models: Some(0),
                total_configurations: Some(0),
            };

            // Create the basket in database
            let created_baskets: Vec<HardwareBasket> = match db.create("hardware_basket").content(basket).await {
                Ok(baskets) => baskets,
                Err(e) => {
                    tracing::error!("Failed to create basket: {}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                        error: "Failed to create hardware basket".to_string()
                    })).into_response();
                }
            };

            let created_basket = &created_baskets[0];
            let basket_record_id = format!("{}", created_basket.id.as_ref().unwrap());

            // Get the vendor for this basket
            let vendor_id = Thing {
                tb: "hardware_vendor".to_string(),
                id: surrealdb::sql::Id::String("default".to_string()),
            };

            // Create default vendor if it doesn't exist
            let default_vendor = HardwareVendor {
                id: Some(vendor_id.clone()),
                name: vendor.clone(),
                contact_info: None,
                support_info: None,
                created_at: Utc::now().into(),
                updated_at: Utc::now().into(),
            };

            let _: Result<Vec<HardwareVendor>, _> = db.create("hardware_vendor").content(default_vendor).await;

            // Save to temporary file
            let mut temp_file = match NamedTempFile::new() {
                Ok(file) => file,
                Err(e) => {
                    tracing::error!("Failed to create temp file: {}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                        error: "Failed to create temporary file".to_string()
                    })).into_response();
                }
            };

            if let Err(e) = temp_file.write_all(&data) {
                tracing::error!("Failed to write temp file: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                    error: "Failed to save file".to_string()
                })).into_response();
            }

            let temp_path = temp_file.path().to_string_lossy().to_string();
            tracing::info!("Saved file to temporary path: {}", temp_path);

            // Parse the file using the core engine
            let parser = HardwareBasketParser;
            let (models, configurations, prices) = match parser.parse_file(&temp_path, &basket_id, &vendor_id) {
                Ok(result) => {
                    tracing::info!("Successfully parsed file: {} models, {} configurations, {} prices", 
                        result.0.len(), result.1.len(), result.2.len());
                    result
                },
                Err(e) => {
                    tracing::error!("Failed to parse hardware basket file: {}", e);
                    return (StatusCode::BAD_REQUEST, Json(ErrorResponse {
                        error: format!("Failed to parse file: {}", e),
                    })).into_response();
                }
            };

            // Convert models to JSON for frontend
            let servers_json: Vec<serde_json::Value> = models.iter().map(|model| {
                serde_json::json!({
                    "model": model.model_name,
                    "vendor": vendor.clone(),
                    "lot_description": model.lot_description,
                    "form_factor": model.form_factor,
                    "specifications": model.base_specifications,
                    "unit_price_usd": 0.0
                })
            }).collect();

            let components_json: Vec<serde_json::Value> = configurations.iter().map(|config| {
                serde_json::json!({
                    "description": config.description,
                    "vendor": vendor.clone(),
                    "category": "Component",
                    "specifications": config.specifications,
                    "unit_price_usd": 0.0
                })
            }).collect();

            // Save to database
            let mut models_saved = 0;
            let mut configs_saved = 0;
            let mut prices_saved = 0;

            // Save models
            tracing::info!("Attempting to save {} models to database", models.len());
            for (i, model) in models.iter().enumerate() {
                tracing::debug!("Saving model {}: {}", i, model.model_name);
                match db.create::<Vec<HardwareModel>>("hardware_model").content(model.clone()).await {
                    Ok(_) => {
                        models_saved += 1;
                        tracing::debug!("Successfully saved model: {}", model.model_name);
                    },
                    Err(e) => {
                        tracing::error!("Failed to save model {}: {}", model.model_name, e);
                    }
                }
            }

            // Save configurations
            tracing::info!("Attempting to save {} configurations to database", configurations.len());
            for (i, config) in configurations.iter().enumerate() {
                tracing::debug!("Saving configuration {}: {}", i, config.description);
                match db.create::<Vec<HardwareConfiguration>>("hardware_configuration").content(config.clone()).await {
                    Ok(_) => {
                        configs_saved += 1;
                        tracing::debug!("Successfully saved configuration: {}", config.description);
                    },
                    Err(e) => {
                        tracing::error!("Failed to save configuration {}: {}", config.description, e);
                    }
                }
            }

            // Save pricing
            tracing::info!("Attempting to save {} prices to database", prices.len());
            for (i, price) in prices.iter().enumerate() {
                tracing::debug!("Saving price {}", i);
                match db.create::<Vec<HardwarePricing>>("hardware_pricing").content(price.clone()).await {
                    Ok(_) => {
                        prices_saved += 1;
                        tracing::debug!("Successfully saved price");
                    },
                    Err(e) => {
                        tracing::error!("Failed to save price: {}", e);
                    }
                }
            }

            // Update the basket with file info and counts
            let update_data = serde_json::json!({
                "total_models": models_saved,
                "total_configurations": configs_saved,
                "updated_at": Utc::now()
            });

            let _: Vec<HardwareBasket> = db.update(&basket_record_id)
                .merge(update_data)
                .await
                .unwrap_or_default();

            tracing::info!("Upload completed successfully: {} models, {} configurations, {} prices saved", 
                models_saved, configs_saved, prices_saved);

            return Json(UploadResponse {
                success: true,
                message: "File uploaded and processed successfully".to_string(),
                models_count: models_saved,
                configurations_count: configs_saved,
                pricing_count: prices_saved,
                servers: servers_json,
                components: components_json,
            }).into_response();
        }
    }

    (StatusCode::BAD_REQUEST, Json(ErrorResponse {
        error: "No file found in upload".to_string()
    })).into_response()
}

async fn upload_hardware_basket(
    Path(id): Path<String>,
    State(db): State<AppState>,
    mut multipart: Multipart
) -> impl IntoResponse {
    let basket_id = Thing {
        tb: "hardware_basket".to_string(),
        id: surrealdb::sql::Id::String(id.clone()),
    };

    // First, verify the basket exists
    let basket_record_id = format!("hardware_basket:{}", id);
    let existing_baskets: Vec<HardwareBasket> = match db.select(&basket_record_id).await {
        Ok(baskets) => baskets,
        Err(e) => {
            tracing::error!("Failed to fetch basket {}: {}", id, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                error: "Failed to verify basket existence".to_string()
            })).into_response();
        }
    };

    if existing_baskets.is_empty() {
        return (StatusCode::NOT_FOUND, Json(ErrorResponse {
            error: "Hardware basket not found".to_string()
        })).into_response();
    }

    let existing_basket = &existing_baskets[0];

    // Get the vendor for this basket
    let vendor_id = Thing {
        tb: "hardware_vendor".to_string(),
        id: surrealdb::sql::Id::String("default".to_string()),
    };

    // Create default vendor if it doesn't exist
    let default_vendor = HardwareVendor {
        id: Some(vendor_id.clone()),
        name: existing_basket.vendor.clone(),
        contact_info: None,
        support_info: None,
        created_at: Utc::now().into(),
        updated_at: Utc::now().into(),
    };
    
    let _: Vec<HardwareVendor> = db.create("hardware_vendor")
        .content(default_vendor)
        .await
        .unwrap_or_default();

    // Process the uploaded file
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "file" {
            let filename = field.file_name().unwrap_or("upload.xlsx").to_string();
            let data = match field.bytes().await {
                Ok(bytes) => bytes,
                Err(e) => {
                    tracing::error!("Failed to read file data: {}", e);
                    return (StatusCode::BAD_REQUEST, Json(ErrorResponse {
                        error: "Failed to read file".to_string()
                    })).into_response();
                }
            };

            // Save to temporary file
            let mut temp_file = match NamedTempFile::new() {
                Ok(file) => file,
                Err(e) => {
                    tracing::error!("Failed to create temp file: {}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                        error: "Failed to create temporary file".to_string()
                    })).into_response();
                }
            };

            if let Err(e) = temp_file.write_all(&data) {
                tracing::error!("Failed to write temp file: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                    error: "Failed to save file".to_string()
                })).into_response();
            }

            let temp_path = temp_file.path().to_string_lossy().to_string();

            // Parse the file using the core engine
            let parser = HardwareBasketParser;
            let (models, configurations, prices) = match parser.parse_file(&temp_path, &basket_id, &vendor_id) {
                Ok(result) => result,
                Err(e) => {
                    tracing::error!("Failed to parse hardware basket file: {}", e);
                    return (StatusCode::BAD_REQUEST, Json(ErrorResponse {
                        error: format!("Failed to parse file: {}", e),
                    })).into_response();
                }
            };

            // Save to database
            let mut models_saved = 0;
            let mut configs_saved = 0;
            let mut prices_saved = 0;

            // Save models
            for model in models {
                if let Ok(_) = db.create::<Vec<HardwareModel>>("hardware_model").content(model).await {
                    models_saved += 1;
                }
            }

            // Save configurations
            for config in configurations {
                if let Ok(_) = db.create::<Vec<HardwareConfiguration>>("hardware_configuration").content(config).await {
                    configs_saved += 1;
                }
            }

            // Save pricing
            for price in prices {
                if let Ok(_) = db.create::<Vec<HardwarePricing>>("hardware_pricing").content(price).await {
                    prices_saved += 1;
                }
            }

            // Update the basket with file info and counts
            let update_data = serde_json::json!({
                "file_path": filename,
                "total_models": models_saved,
                "total_configurations": configs_saved,
                "updated_at": Utc::now()
            });

            let _: Vec<HardwareBasket> = db.update(&basket_record_id)
                .merge(update_data)
                .await
                .unwrap_or_default();

            return Json(UploadResponse {
                success: true,
                message: "File uploaded and processed successfully".to_string(),
                models_count: models_saved,
                configurations_count: configs_saved,
                pricing_count: prices_saved,
                servers: Vec::new(), // Empty for now, could be populated from database if needed
                components: Vec::new(), // Empty for now, could be populated from database if needed
            }).into_response();
        }
    }

    (StatusCode::BAD_REQUEST, Json(ErrorResponse {
        error: "No file found in upload".to_string()
    })).into_response()
}

async fn get_hardware_basket_models(
    Path(id): Path<String>,
    State(db): State<AppState>
) -> impl IntoResponse {
    tracing::info!("🔍 Fetching models for basket: {}", id);
    
    // Query for hardware models that belong to this basket
    let query = "SELECT * FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $basket_id)";
    
    match db.query(query).bind(("basket_id", &id)).await {
        Ok(mut result) => {
            let models: Vec<HardwareModel> = result.take(0).unwrap_or_default();
            tracing::info!("✅ Found {} models for basket {}", models.len(), id);
            Json(models).into_response()
        },
        Err(e) => {
            tracing::error!("❌ Failed to fetch hardware models for basket {}: {}", id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse {
                error: "Failed to fetch hardware models".to_string()
            })).into_response()
        }
    }
}
