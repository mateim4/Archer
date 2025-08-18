use axum::{
    extract::{Path, State, Multipart},
    http::StatusCode,
    response::{Json, IntoResponse},
    routing::{get, post, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use std::collections::HashMap;
use chrono::Utc;
use tempfile::NamedTempFile;
use std::io::Write;

use crate::database::AppState;
use surrealdb::sql::Id as SurrealId;
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
    .route("/hardware-baskets/:id", delete(delete_hardware_basket))
        .route("/hardware-baskets/:id/upload", post(upload_hardware_basket))
        .route("/hardware-baskets/:id/models", get(get_hardware_basket_models))
    .route("/hardware-baskets/:id/extensions", get(get_hardware_basket_extensions))
    .route("/hardware-configurations/:id", get(get_hardware_configuration))
    .route("/hardware-models/:id/specifications", axum::routing::put(update_hardware_model_specifications))
    .route("/admin/cleanup", post(admin_cleanup))
            .route("/hardware-baskets/:id/recount", post(recount_hardware_basket_totals))
}

    #[derive(Serialize, Deserialize)]
    struct RecountResponse {
        success: bool,
        basket_id: String,
        total_models: i64,
        total_configurations: i64,
    }

    // POST /api/hardware-baskets/:id/recount — recompute and persist totals
    async fn recount_hardware_basket_totals(
        Path(id): Path<String>,
        State(db): State<AppState>
    ) -> impl IntoResponse {
        // Verify basket exists
        let basket_query = "SELECT * FROM hardware_basket WHERE id = type::thing('hardware_basket', $bid)";
        match db.query(basket_query).bind(("bid", &id)).await {
            Ok(mut res) => {
                let baskets: Vec<HardwareBasket> = res.take(0).unwrap_or_default();
                if baskets.is_empty() {
                    return (StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Basket not found".to_string() })).into_response();
                }
            },
            Err(e) => {
                tracing::error!("Failed to verify basket {}: {}", id, e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Failed to verify basket".to_string() })).into_response();
            }
        }

        // Count models using typed deserialization (avoids array-wrapping gotchas)
        let mut total_models: i64 = 0;
        if let Ok(mut res) = db
            .query("SELECT * FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $bid)")
            .bind(("bid", &id))
            .await
        {
            let rows: Vec<HardwareModel> = res.take(0).unwrap_or_default();
            total_models = rows.len() as i64;
        }

        // Count configurations linked to those models
        let mut total_configurations: i64 = 0;
        if let Ok(mut res) = db
            .query(r#"
                SELECT * FROM hardware_configuration
                WHERE model_id IN (
                    SELECT id FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $bid)
                )
            "#)
            .bind(("bid", &id))
            .await
        {
            let rows: Vec<HardwareConfiguration> = res.take(0).unwrap_or_default();
            total_configurations = rows.len() as i64;
        }

        // Persist totals
        let _ = db
            .query("UPDATE hardware_basket SET total_models = $tm, total_configurations = $tc WHERE id = type::thing('hardware_basket', $bid)")
            .bind(("tm", total_models))
            .bind(("tc", total_configurations))
            .bind(("bid", &id))
            .await;

        Json(RecountResponse { success: true, basket_id: id, total_models, total_configurations }).into_response()
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

#[derive(Serialize, Deserialize)]
struct CleanupResponse {
    success: bool,
    message: String,
}

// Admin: delete all baskets, models, configurations, pricing (in-memory DB)
async fn admin_cleanup(State(db): State<AppState>) -> impl IntoResponse {
    tracing::warn!("⚠️ Admin cleanup requested: deleting hardware_* tables");
    let query = r#"
        DELETE hardware_pricing;
        DELETE hardware_configuration;
        DELETE hardware_model;
        DELETE hardware_basket;
    "#;
    match db.query(query).await {
        Ok(_) => Json(CleanupResponse { success: true, message: "All hardware_* records deleted".to_string() }).into_response(),
        Err(e) => {
            tracing::error!("Admin cleanup failed: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Cleanup failed: {}", e) })).into_response()
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
                    "extensions": match &model.extensions {
                        Some(exts) => serde_json::Value::Array(exts.iter().map(|t| serde_json::Value::String(format!("{}", t))).collect()),
                        None => serde_json::Value::Array(vec![]),
                    },
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
                // Log the exact payload being sent to the DB for debugging
                tracing::info!("Model payload: {}", serde_json::to_string(&model).unwrap_or_default());
                match db.create::<Vec<HardwareModel>>("hardware_model").content(model.clone()).await {
                    Ok(created) => {
                        models_saved += 1;
                        // Log the created record returned by the DB
                        let created_json = created.first().map(|r| serde_json::to_string(r).unwrap_or_default()).unwrap_or_default();
                        tracing::debug!("Successfully saved model: {}, created_record: {}", model.model_name, created_json);
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
                // Log payload
                tracing::info!("Configuration payload: {}", serde_json::to_string(&config).unwrap_or_default());

                match db.create::<Vec<HardwareConfiguration>>("hardware_configuration").content(config.clone()).await {
                    Ok(created) => {
                        configs_saved += 1;
                        let created_json = created.first().map(|r| serde_json::to_string(r).unwrap_or_default()).unwrap_or_default();
                        tracing::debug!("Successfully saved configuration: {}, created_record: {}", config.description, created_json);

                        if let Some(created_rec) = created.first() {
                            // model_id is a Thing in the created record
                            let model_id = created_rec.model_id.clone();
                            if let Some(ext_id) = created_rec.id.clone() {
                                let model_record_str = format!("{}", model_id);

                                // Read existing model to preserve prior extensions
                                let existing_models: Option<HardwareModel> = match db.select(&model_id).await {
                                    Ok(m) => m,
                                    Err(e) => {
                                        tracing::error!("Failed to select model {}: {}", model_record_str, e);
                                        None
                                    }
                                };

                                let mut merged_exts: Vec<serde_json::Value> = Vec::new();
                                if let Some(existing) = existing_models.as_ref() {
                                    if let Some(exts) = &existing.extensions {
                                        for e in exts {
                                            merged_exts.push(serde_json::json!({"tb": e.tb, "id": e.id}));
                                        }
                                    }
                                }
                                merged_exts.push(serde_json::json!({"tb": ext_id.tb, "id": ext_id.id}));

                                let update_ext = serde_json::json!({"extensions": merged_exts});
                                tracing::info!("Updating model {} with extension {} (merged total={})", model_record_str, serde_json::to_string(&ext_id).unwrap_or_default(), merged_exts.len());
                                tracing::info!("Update payload: {}", serde_json::to_string(&update_ext).unwrap_or_default());

                                let res: Result<Option<HardwareModel>, _> = db.update(&model_id).merge(update_ext).await;
                                match res {
                                    Ok(updated_opt) => {
                                        let updated_count = if updated_opt.is_some() { 1 } else { 0 };
                                        tracing::info!("Model update succeeded, updated count: {}", updated_count);
                                        let updated_json = serde_json::to_string(&updated_opt).unwrap_or_default();
                                        tracing::info!("Model update returned JSON: {}", updated_json);

                                        match db.select::<Option<serde_json::Value>>(&model_id).await {
                                            Ok(raw) => tracing::info!("Post-merge DB select for {}: {}", model_record_str, serde_json::to_string(&raw).unwrap_or_default()),
                                            Err(e) => tracing::error!("Failed to re-select model {} after update: {}", model_record_str, e),
                                        }
                                    },
                                    Err(e) => tracing::error!("Model update failed: {}", e),
                                }
                            }
                        }
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

            // Recompute counts from DB to ensure persisted totals are accurate
            // Use inner basket id string for type::thing binding
            let basket_inner_id: String = match created_basket.id.as_ref().map(|t| &t.id) {
                Some(SurrealId::String(s)) => s.clone(),
                Some(SurrealId::Number(n)) => n.to_string(),
                _ => {
                    // Fallback: try to strip table prefix from record id string
                    let full = basket_record_id.clone(); // e.g., "hardware_basket:xyz"
                    full.split(':').nth(1).unwrap_or(&full).to_string()
                }
            };
            let mut total_models: i64 = 0;
            if let Ok(mut res) = db
                .query("SELECT * FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $bid)")
                .bind(("bid", &basket_inner_id))
                .await
            {
                let rows: Vec<HardwareModel> = res.take(0).unwrap_or_default();
                total_models = rows.len() as i64;
            }
            let mut total_configurations: i64 = 0;
            if let Ok(mut res) = db
                .query(r#"
                    SELECT * FROM hardware_configuration
                    WHERE model_id IN (
                        SELECT id FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $bid)
                    )
                "#)
                .bind(("bid", &basket_inner_id))
                .await
            {
                let rows: Vec<HardwareConfiguration> = res.take(0).unwrap_or_default();
                total_configurations = rows.len() as i64;
            }

            // Update the basket with file info and recomputed counts
            let update_data = serde_json::json!({
                "total_models": total_models,
                "total_configurations": total_configurations,
                "updated_at": Utc::now()
            });

            let _: Vec<HardwareBasket> = db.update(&basket_record_id)
                .merge(update_data)
                .await
                .unwrap_or_default();

            tracing::info!("Upload completed successfully: {} models, {} configurations, {} prices saved", 
                models_saved, configs_saved, prices_saved);

            // Debug: fetch one of the saved models from DB to inspect stored fields
            if models_saved > 0 {
                if let Ok(mut res) = db.query("SELECT * FROM hardware_model LIMIT 1").await {
                    let fetched: Vec<HardwareModel> = res.take(0).unwrap_or_default();
                    if let Some(mf) = fetched.get(0) {
                        tracing::info!("Debug fetched model from DB: {}", serde_json::to_string(&mf).unwrap_or_default());
                    }
                }
            }

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

            // Save configurations and attach each saved configuration id to its parent model's
            // `extensions` field so models persist references to their component/config records.
            for config in configurations {
                match db.create::<Vec<HardwareConfiguration>>("hardware_configuration").content(config.clone()).await {
                    Ok(mut created_configs) => {
                        if let Some(created) = created_configs.pop() {
                            configs_saved += 1;
                            // If the created configuration contains a model_id, update that model's
                            // `extensions` array by merging the new configuration id into it.
                            if let Some(ext_id) = created.id.clone() {
                                // Extract inner id from Thing for parameterized query
                                let model_inner_id: Option<String> = match &created.model_id.id {
                                    SurrealId::String(s) => Some(s.clone()),
                                    SurrealId::Number(n) => Some(n.to_string()),
                                    _ => None,
                                };

                                if let Some(mid) = model_inner_id {
                                    // Read existing extensions
                                    let existing_query = r#"
                                        SELECT extensions FROM hardware_model
                                        WHERE id = type::thing('hardware_model', $mid)
                                    "#;
                                    let mut merged_exts: Vec<serde_json::Value> = Vec::new();
                                    match db.query(existing_query).bind(("mid", &mid)).await {
                                        Ok(mut res) => {
                                            let rows: Vec<serde_json::Value> = res.take(0).unwrap_or_default();
                                            if let Some(obj) = rows.get(0) {
                                                if let Some(exts) = obj.get("extensions").and_then(|v| v.as_array()) {
                                                    for e in exts { merged_exts.push(e.clone()); }
                                                }
                                            }
                                        },
                                        Err(e) => tracing::error!("Failed to fetch existing extensions for model {}: {}", mid, e),
                                    }

                                    // Append the new extension id as Thing-shaped JSON
                                    merged_exts.push(serde_json::json!({"tb": ext_id.tb, "id": ext_id.id}));

                                    let update_query = r#"
                                        UPDATE type::thing('hardware_model', $mid)
                                        MERGE { extensions: $exts }
                                    "#;
                                    tracing::info!(
                                        "Updating model (hardware_model, {}) with extension merge (total={})",
                                        mid,
                                        merged_exts.len()
                                    );
                                    if let Err(e) = db
                                        .query(update_query)
                                        .bind(("mid", &mid))
                                        .bind(("exts", &merged_exts))
                                        .await
                                    {
                                        tracing::error!("Model update failed for {}: {}", mid, e);
                                    }
                                }
                            }
                        }
                    },
                    Err(e) => {
                        tracing::error!("Failed to save configuration {}: {}", config.description, e);
                    }
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
    
    // First, let's verify the basket exists
    let basket_query = "SELECT * FROM hardware_basket WHERE id = type::thing('hardware_basket', $basket_id)";
    match db.query(basket_query).bind(("basket_id", &id)).await {
        Ok(mut result) => {
            let baskets: Vec<HardwareBasket> = result.take(0).unwrap_or_default();
            if baskets.is_empty() {
                tracing::warn!("❌ Basket {} not found", id);
                return (StatusCode::NOT_FOUND, Json(ErrorResponse {
                    error: format!("Basket {} not found", id)
                })).into_response();
            }
            tracing::info!("✅ Found basket: {} (vendor: {})", baskets[0].name, baskets[0].vendor);
        },
        Err(e) => {
            tracing::error!("❌ Failed to verify basket {}: {}", id, e);
        }
    }
    
    // Query for hardware models that belong to this basket
    let models_query = "SELECT * FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $basket_id)";
    match db.query(models_query).bind(("basket_id", &id)).await {
        Ok(mut result) => {
            let models: Vec<HardwareModel> = result.take(0).unwrap_or_default();
            tracing::info!("✅ Found {} models for basket {}", models.len(), id);

            // Collect model ids to fetch pricing in bulk
            let model_ids: Vec<Thing> = models.iter().filter_map(|m| m.id.clone()).collect();
            let mut price_map: std::collections::HashMap<String, (f64, String)> = std::collections::HashMap::new();

            if !model_ids.is_empty() {
                let pricing_query = "SELECT id, model_id, net_price_usd, currency FROM hardware_pricing WHERE model_id IN $model_ids";
                match db.query(pricing_query).bind(("model_ids", &model_ids)).await {
                    Ok(mut pres) => {
                        let rows: Vec<HardwarePricing> = pres.take(0).unwrap_or_default();
                        for p in rows {
                            // Ensure we have a model_id and use the net_price_usd (f64) directly
                            if let Some(mid) = p.model_id {
                                price_map.insert(format!("{}", mid), (p.net_price_usd, p.currency.clone()));
                            }
                        }
                    },
                    Err(e) => tracing::warn!("Failed to fetch pricing for models: {}", e),
                }
            }

            // Also fetch configurations for these models to derive specs if missing
            use core_engine::hardware_parser::spec_parser::SpecParser;
            let mut cfg_map: std::collections::HashMap<String, Vec<HardwareConfiguration>> = std::collections::HashMap::new();
            if !model_ids.is_empty() {
                let cfg_query = "SELECT * FROM hardware_configuration WHERE model_id IN $model_ids";
                match db.query(cfg_query).bind(("model_ids", &model_ids)).await {
                    Ok(mut cres) => {
                        let cfgs: Vec<HardwareConfiguration> = cres.take(0).unwrap_or_default();
                        for c in cfgs.into_iter() {
                            let key = format!("{}", c.model_id);
                            cfg_map.entry(key).or_default().push(c);
                        }
                    },
                    Err(e) => tracing::warn!("Failed to fetch configurations for models: {}", e),
                }
            }

            // Helper closures to derive specs from configurations when the model lacks them
            let sp = SpecParser::new();

            // Enrich models with price and part_number in the JSON response
            let enriched: Vec<serde_json::Value> = models.into_iter().map(|m| {
                let mut v = serde_json::to_value(&m).unwrap_or(serde_json::json!({}));
                // Expose part_number at model level from model_number if present
                if let Some(model_num) = m.model_number.clone() {
                    v["part_number"] = serde_json::Value::String(model_num);
                }
                // Attach price if available
                if let Some(mid) = m.id.clone() {
                    if let Some((amt, cur)) = price_map.get(&format!("{}", mid)) {
                        v["price"] = serde_json::json!({ "amount": amt, "currency": cur });
                    }
                }

                // Backfill missing base_specifications fields using configurations
                let mut specs = m.base_specifications.clone();
                let key = format!("{}", m.id.clone().unwrap_or(Thing{ tb: "hardware_model".into(), id: surrealdb::sql::Id::String(String::new()) }));
                if let Some(cfgs) = cfg_map.get(&key) {
                    // Processor
                    if specs.processor.is_none() {
                        if let Some(cpu_cfg) = cfgs.iter().find(|c| c.item_type.eq_ignore_ascii_case("processor") || c.description.to_lowercase().contains("cpu") || c.description.to_lowercase().contains("processor")) {
                            let text = format!("{} {}", cpu_cfg.part_number.clone().unwrap_or_default(), cpu_cfg.description);
                            if let Some(p) = sp.parse_processor(&text) {
                                specs.processor = Some(p);
                            }
                        }
                    }
                    // Memory
                    if specs.memory.is_none() {
                        if let Some(mem_cfg) = cfgs.iter().find(|c| c.item_type.eq_ignore_ascii_case("memory") || c.description.to_lowercase().contains("memory") || c.description.to_lowercase().contains("rdimm") || c.description.to_lowercase().contains("dimm")) {
                            if let Some(mem) = sp.parse_memory(&mem_cfg.description) {
                                specs.memory = Some(mem);
                            }
                        }
                    }
                    // Storage
                    if specs.storage.is_none() {
                        if let Some(st_cfg) = cfgs.iter().find(|c| c.item_type.eq_ignore_ascii_case("storage") || c.description.to_lowercase().contains("ssd") || c.description.to_lowercase().contains("hdd") || c.description.to_lowercase().contains("nvme")) {
                            if let Some(st) = sp.parse_storage(&st_cfg.description) {
                                specs.storage = Some(st);
                            }
                        }
                    }
                    // Network
                    if specs.network.is_none() {
                        if let Some(nc_cfg) = cfgs.iter().find(|c| c.item_type.eq_ignore_ascii_case("network") || c.description.to_lowercase().contains("nic") || c.description.to_lowercase().contains("ethernet") || c.description.to_lowercase().contains("gbe")) {
                            if let Some(ns) = sp.parse_network(&nc_cfg.description) {
                                specs.network = Some(ns);
                            }
                        }
                    }
                }
                v["base_specifications"] = serde_json::to_value(&specs).unwrap_or(serde_json::json!({}));
                v
            }).collect();

            Json(enriched).into_response()
        },
        Err(e) => {
            tracing::error!("❌ Failed to fetch hardware models for basket {}: {}", id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Failed to fetch hardware models".to_string() })).into_response()
        }
    }
}

async fn get_hardware_configuration(
    Path(id): Path<String>,
    State(db): State<AppState>
) -> impl IntoResponse {
    tracing::info!("🔍 Fetching hardware configuration: {}", id);

    // Use a parameterized query to select by Thing id in SurrealDB
    let query = "SELECT * FROM hardware_configuration WHERE id = type::thing('hardware_configuration', $cfg_id)";
    match db.query(query).bind(("cfg_id", &id)).await {
        Ok(mut result) => {
            let configs: Vec<HardwareConfiguration> = result.take(0).unwrap_or_default();
            if let Some(conf) = configs.get(0) {
                Json(conf.clone()).into_response()
            } else {
                (StatusCode::NOT_FOUND, Json(ErrorResponse { error: "Configuration not found".to_string() })).into_response()
            }
        },
        Err(e) => {
            tracing::error!("Failed to query configuration {}: {}", id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Failed to fetch configuration".to_string() })).into_response()
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct ExtensionRow {
    id: Option<Thing>,
    model_id: Option<Thing>,
    part_number: Option<String>,
    name: String,
    category: String,
    r#type: String,
    size: Option<String>,
    speed: Option<String>,
    price: Option<serde_json::Value>,
}

fn derive_component_type(desc: &str, item_type: &str) -> String {
    let d = desc.to_lowercase();
    if d.contains("retimer") { return "NVMe Retimer".to_string(); }
    if d.contains("anybay") || d.contains("backplane") { return "JBOD".to_string(); }
    if d.contains("riser") { return "Riser".to_string(); }
    if d.contains("heatsink") { return "Heatsink".to_string(); }
    if d.contains("power supply") || d.contains("psu") { return "PSU".to_string(); }
    if d.contains("chassis") { return "Chassis".to_string(); }
    if d.contains("nic") || d.contains("ethernet") || d.contains("lan") { return "NIC".to_string(); }
    if d.contains("ssd") || d.contains("hdd") { return "Drive".to_string(); }
    if d.contains("dimm") || d.contains("memory") || d.contains("rdimm") { return "DIMM".to_string(); }
    if d.contains("processor") || d.contains("cpu") { return "CPU".to_string(); }
    match item_type {
        "memory" => "DIMM".to_string(),
        "storage" => "Drive".to_string(),
        "network" => "NIC".to_string(),
        _ => "Component".to_string(),
    }
}

fn derive_size(desc: &str) -> Option<String> {
    // Examples: "10x2.5\"", "8x 3.5\"", "4-Port", "2x25Gb"
    let d = desc;
    // Use raw string with `#` so embedded quotes are handled correctly
    let re_bays = regex::Regex::new(r#"(?i)(\d+)\s*x\s*([23](?:\.5)?\")"#).ok();
    if let Some(re) = &re_bays { if let Some(cap) = re.captures(d) {
        return Some(format!("{} x {}", &cap[1], &cap[2]));
    }}
    // Match either "<n>-port" or "<n>x <speed gb>"
    let re_ports = regex::Regex::new(r#"(?i)(\d+)\s*[- ]?port|(?:(\d+)x)\s*(\d+\s*gb)"#).ok();
    if let Some(re) = &re_ports { if let Some(cap) = re.captures(d) {
        if let Some(m) = cap.get(1) { return Some(format!("{}-Port", m.as_str())); }
        if let Some(m) = cap.get(2) { return Some(format!("{}-Port", m.as_str())); }
    }}
    // Memory/module capacity like "64GB", "32 GB", "1TB"
    let re_capacity = regex::Regex::new(r#"(?i)\b(\d{1,4})\s*(gb|tb)\b"#).ok();
    if let Some(re) = &re_capacity { if let Some(cap) = re.captures(d) {
        let num = &cap[1];
        let unit = &cap[2].to_uppercase();
        return Some(format!("{}{}", num, unit));
    }}
    None
}

fn derive_speed(desc: &str) -> Option<String> {
    let d = desc.to_lowercase();
    for sp in ["100gb", "50gb", "40gb", "25gb", "10gb", "1gb", "4800mt/s", "5600mt/s", "ddr5-4800", "ddr4-3200", "12gbps", "24gbps"] {
        if d.contains(sp) { return Some(sp.to_uppercase()); }
    }
    // Also match MHz-based speeds like "4800MHz", "3200 MHz"
    if let Ok(re) = regex::Regex::new(r#"(?i)\b(\d{3,5})\s*mhz\b"#) {
        if let Some(cap) = re.captures(&d) {
            return Some(format!("{}MHz", &cap[1]));
        }
    }
    None
}

// GET /api/hardware-baskets/:id/extensions
async fn get_hardware_basket_extensions(
    Path(id): Path<String>,
    State(db): State<AppState>
) -> impl IntoResponse {
    tracing::info!("🔍 Fetching extensions for basket: {}", id);

    // Gather model ids for this basket
    let mut model_ids: Vec<Thing> = Vec::new();
    let models_query = r#"SELECT id FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $basket_id)"#;
    if let Ok(mut res) = db.query(models_query).bind(("basket_id", &id)).await {
        let rows: Vec<serde_json::Value> = res.take(0).unwrap_or_default();
        for v in rows {
            if let Some(s) = v.get("id") { if let Ok(t) = serde_json::from_value::<Thing>(s.clone()) { model_ids.push(t); } }
        }
    }

    if model_ids.is_empty() {
        return Json(Vec::<ExtensionRow>::new()).into_response();
    }

    // Fetch configurations for those models
    let cfg_query = "SELECT * FROM hardware_configuration WHERE model_id IN $model_ids";
    let mut configs: Vec<HardwareConfiguration> = Vec::new();
    match db.query(cfg_query).bind(("model_ids", &model_ids)).await {
        Ok(mut res) => { configs = res.take(0).unwrap_or_default(); },
        Err(e) => {
            tracing::error!("Failed to fetch configurations: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Failed to fetch extensions".to_string() })).into_response();
        }
    }

    // Pricing lookup map by configuration_id
    let mut price_map: HashMap<String, (f64, String)> = HashMap::new();
    let cfg_ids: Vec<Thing> = configs.iter().filter_map(|c| c.id.clone()).collect();
    if !cfg_ids.is_empty() {
        let p_query = "SELECT configuration_id, net_price_usd, currency FROM hardware_pricing WHERE configuration_id IN $cfg_ids";
        if let Ok(mut res) = db.query(p_query).bind(("cfg_ids", &cfg_ids)).await {
            let rows: Vec<serde_json::Value> = res.take(0).unwrap_or_default();
            for v in rows {
                let cid = v.get("configuration_id").and_then(|x| serde_json::from_value::<Thing>(x.clone()).ok());
                let amt = v.get("net_price_usd").and_then(|x| x.as_f64());
                let cur = v.get("currency").and_then(|x| x.as_str()).unwrap_or("USD").to_string();
                if let (Some(cid), Some(amt)) = (cid, amt) {
                    price_map.insert(format!("{}", cid), (amt, cur));
                }
            }
        }
    }

    // Build enriched rows
    let rows: Vec<ExtensionRow> = configs.into_iter().map(|c| {
        let name = c.description.clone();
        let category = c.item_type.clone();
        let r#type = derive_component_type(&c.description, &c.item_type);
        let size = derive_size(&c.description);
        let speed = derive_speed(&c.description);
        let price = c.id.as_ref().and_then(|cid| price_map.get(&format!("{}", cid)).map(|(a, cur)| serde_json::json!({"amount": a, "currency": cur})));
        ExtensionRow {
            id: c.id.clone(),
            model_id: Some(c.model_id.clone()),
            part_number: c.part_number.clone(),
            name,
            category,
            r#type,
            size,
            speed,
            price,
        }
    }).collect();

    Json(rows).into_response()
}

// Delete a hardware basket and cascade delete related models/configs/pricing
async fn delete_hardware_basket(
    Path(id): Path<String>,
    State(db): State<AppState>,
) -> impl IntoResponse {
    tracing::warn!("🗑️ Deleting hardware basket {} and related records", id);

    // Gather model ids for this basket
    let models_query = r#"SELECT id FROM hardware_model WHERE basket_id = type::thing('hardware_basket', $basket_id)"#;
    let mut model_ids: Vec<Thing> = Vec::new();
    if let Ok(mut res) = db.query(models_query).bind(("basket_id", &id)).await {
        let models: Vec<HashMap<String, Thing>> = res.take(0).unwrap_or_default();
        for row in models {
            if let Some(mid) = row.get("id") { model_ids.push(mid.clone()); }
        }
    }

    // Gather configuration ids for those models
    let mut config_ids: Vec<Thing> = Vec::new();
    if !model_ids.is_empty() {
        let cfg_query = "SELECT id FROM hardware_configuration WHERE model_id IN $model_ids";
        if let Ok(mut res) = db.query(cfg_query).bind(("model_ids", &model_ids)).await {
            let cfgs: Vec<HashMap<String, Thing>> = res.take(0).unwrap_or_default();
            for row in cfgs {
                if let Some(cid) = row.get("id") { config_ids.push(cid.clone()); }
            }
        }
    }

    // Delete pricing linked to models/configs
    let _ = db
        .query("DELETE hardware_pricing WHERE model_id IN $model_ids OR configuration_id IN $config_ids")
        .bind(("model_ids", &model_ids))
        .bind(("config_ids", &config_ids))
        .await;

    // Delete configurations
    let _ = db
        .query("DELETE hardware_configuration WHERE model_id IN $model_ids")
        .bind(("model_ids", &model_ids))
        .await;

    // Delete models
    let _ = db
    .query(r#"DELETE hardware_model WHERE basket_id = type::thing('hardware_basket', $basket_id)"#)
        .bind(("basket_id", &id))
        .await;

    // Delete the basket itself
    match db
    .query(r#"DELETE hardware_basket WHERE id = type::thing('hardware_basket', $basket_id)"#)
        .bind(("basket_id", &id))
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => {
            tracing::error!("Failed to delete basket {}: {}", id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: format!("Failed to delete basket: {}", e) })).into_response()
        }
    }
}

// PUT /api/hardware-models/:id/specifications
async fn update_hardware_model_specifications(
    Path(id): Path<String>,
    State(db): State<AppState>,
    Json(specifications): Json<serde_json::Value>
) -> impl IntoResponse {
    tracing::info!("Updating specifications for hardware model: {}", id);
    
    // Update the base_specifications field of the hardware model
    let update_query = r#"
        UPDATE type::thing('hardware_model', $model_id)
        SET base_specifications = $specifications,
            updated_at = time::now()
    "#;
    
    match db
        .query(update_query)
        .bind(("model_id", &id))
        .bind(("specifications", &specifications))
        .await
    {
        Ok(_) => {
            tracing::info!("Successfully updated specifications for model: {}", id);
            Json(serde_json::json!({
                "success": true,
                "message": "Specifications updated successfully",
                "model_id": id
            })).into_response()
        },
        Err(e) => {
            tracing::error!("Failed to update specifications for model {}: {}", id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { 
                error: format!("Failed to update specifications: {}", e) 
            })).into_response()
        }
    }
}
