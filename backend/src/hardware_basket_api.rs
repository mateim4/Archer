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
        .route("/hardware-baskets", get(list_hardware_baskets).post(create_hardware_basket))
        .route("/hardware-baskets/:id/upload", post(upload_hardware_basket_file))
        .route("/hardware-baskets/:id/models", get(get_hardware_basket_models))
}

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
            let (parsed_models, parsed_configs, parsed_prices) = transform_parsed_data(parsed_data, Thing {
                tb: "hardware_basket".to_string(),
                id: id.clone().into(),
            });

            let total_models = parsed_models.len() as i64;
            let total_configurations = parsed_configs.len() as i64;

            if !parsed_models.is_empty() {
                let _created_models: Vec<HardwareModel> = db.create("hardware_model").content(parsed_models).await.map_err(|e| {
                    eprintln!("DB error creating models: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            }
            
            if !parsed_configs.is_empty() {
                let _created_configs: Vec<HardwareConfiguration> = db.create("hardware_configuration").content(parsed_configs).await.map_err(|e| {
                    eprintln!("DB error creating configurations: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            }

            if !parsed_prices.is_empty() {
                let _created_prices: Vec<HardwarePrice> = db.create("hardware_price").content(parsed_prices).await.map_err(|e| {
                    eprintln!("DB error creating prices: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            }

            // Update the basket with file info and counts
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
        }
        Err(e) => {
            eprintln!("Error parsing Excel file: {:?}", e);
            Err(StatusCode::UNPROCESSABLE_ENTITY)
        }
    }
}

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
