use axum::{
    extract::{Path, State, Multipart},
    http::StatusCode,
    response::Json,
};
use std::sync::Arc;
use serde_json::{self, json};
use uuid::Uuid;
use chrono;

use crate::database::Database;
use core_engine::hardware_parser::basket_parser::{
    HardwareBasketParser, 
    ParsedHardwareBasket,
};

/// Process Excel file with comprehensive parsing and database storage
pub async fn process_comprehensive_excel_file(
    State(db): State<Arc<Database>>,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, StatusCode> {
    println!("🚀 Starting comprehensive Excel file processing...");
    
    // Extract file from multipart form
    let mut file_path: Option<String> = None;
    let mut file_name: Option<String> = None;
    
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let field_name = field.name().unwrap_or("");
        
        if field_name == "file" {
            file_name = field.file_name().map(|s| s.to_string());
            let file_data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
            
            // Save file temporarily
            let temp_file = format!("/tmp/basket_upload_{}.xlsx", Uuid::new_v4());
            tokio::fs::write(&temp_file, &file_data).await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            
            file_path = Some(temp_file);
            break;
        }
    }
    
    let file_path = file_path.ok_or(StatusCode::BAD_REQUEST)?;
    let file_name = file_name.unwrap_or("unknown.xlsx".to_string());
    
    println!("📁 Processing file: {} -> {}", file_name, file_path);
    
    // Parse Excel file with comprehensive parser
    let parser = HardwareBasketParser;
    let parsed_basket = parser.parse_file(&file_path)
        .map_err(|e| {
            println!("❌ Excel parsing failed: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    println!("✅ Excel parsing completed: {} total items processed", parsed_basket.total_items_processed);
    
    // Store parsed data in database
    let import_result = store_comprehensive_hardware_data(&db, parsed_basket, &file_name, &file_path).await
        .map_err(|e| {
            println!("❌ Database storage failed: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    
    // Clean up temporary file
    let _ = tokio::fs::remove_file(&file_path).await;
    
    Ok(Json(json!({
        "success": true,
        "message": "Hardware basket data processed and stored successfully",
        "import_id": import_result.import_id,
        "vendor": import_result.vendor,
        "total_items": import_result.total_items_processed,
        "breakdown": {
            "hardware_lots": import_result.lots_count,
            "hardware_components": import_result.components_count,
            "hardware_options": import_result.options_count
        },
        "processing_errors": import_result.processing_errors
    })))
}

/// Result of storing comprehensive hardware data
#[derive(Debug)]
pub struct ComprehensiveImportResult {
    pub import_id: String,
    pub vendor: String,
    pub total_items_processed: usize,
    pub lots_count: usize,
    pub components_count: usize,
    pub options_count: usize,
    pub processing_errors: Vec<String>,
}

/// Store comprehensive hardware data in the database
pub async fn store_comprehensive_hardware_data(
    db: &Database,
    parsed_basket: ParsedHardwareBasket,
    file_name: &str,
    file_path: &str,
) -> Result<ComprehensiveImportResult, Box<dyn std::error::Error + Send + Sync>> {
    println!("💾 Storing comprehensive hardware data in database...");
    
    let import_id = Uuid::new_v4().to_string();
    let lots_count = parsed_basket.hardware_lots.len();
    let components_count = parsed_basket.hardware_components.len();
    let options_count = parsed_basket.hardware_options.len();
    
    // 1. Store vendor configuration
    let vendor_config_id = store_vendor_config(&*db, &parsed_basket.vendor_config, &import_id).await?;
    println!("✅ Stored vendor config: {}", vendor_config_id);
    
    // 2. Store hardware lots
    let mut stored_lot_ids = Vec::new();
    for lot in &parsed_basket.hardware_lots {
        let lot_id = store_hardware_lot(&*db, lot, &import_id).await?;
        stored_lot_ids.push(lot_id);
    }
    println!("✅ Stored {} hardware lots", stored_lot_ids.len());
    
    // 3. Store hardware components
    let mut stored_component_ids = Vec::new();
    for component in &parsed_basket.hardware_components {
        let component_id = store_hardware_component(&*db, component, &import_id).await?;
        stored_component_ids.push(component_id);
    }
    println!("✅ Stored {} hardware components", stored_component_ids.len());
    
    // 4. Store hardware options
    let mut stored_option_ids = Vec::new();
    for option in &parsed_basket.hardware_options {
        let option_id = store_hardware_option(&*db, option, &import_id).await?;
        stored_option_ids.push(option_id);
    }
    println!("✅ Stored {} hardware options", stored_option_ids.len());
    
    // 5. Store import history record
    store_import_history(&*db, &import_id, file_name, file_path, &parsed_basket).await?;
    println!("✅ Stored import history: {}", import_id);
    
    Ok(ComprehensiveImportResult {
        import_id,
        vendor: parsed_basket.vendor,
        total_items_processed: parsed_basket.total_items_processed,
        lots_count,
        components_count,
        options_count,
        processing_errors: parsed_basket.processing_errors,
    })
}

/// Store vendor configuration
async fn store_vendor_config(
    db: &Database,
    config: &ParsedVendorConfig,
    import_id: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let config_id = format!("vendor_config:{}", Uuid::new_v4());
    
    let exchange_rates_json = serde_json::to_value(&config.exchange_rates)?;
    
    let _response: Vec<serde_json::Value> = db
        .create("vendor_config")
        .content(serde_json::json!({
            "vendor_name": config.vendor_name,
            "file_version": config.file_version,
            "last_updated": config.last_updated,
            "exchange_rates": exchange_rates_json,
            "currency_valid_until": config.currency_valid_until,
            "contact_info": config.contact_info,
            "import_id": import_id,
            "created_at": chrono::Utc::now().to_rfc3339()
        }))
        .await?;
    
    Ok(config_id)
}

/// Store hardware lot
async fn store_hardware_lot(
    db: &Database,
    lot: &ParsedHardwareLot,
    import_id: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let lot_id = format!("hardware_lot:{}_{}", lot.vendor.to_lowercase(), lot.lot_code);
    
    let sql = "
        CREATE $lot_id SET
            vendor = $vendor,
            lot_code = $lot_code,
            lot_description = $lot_description,
            base_part_number = $base_part_number,
            server_type = $server_type,
            form_factor = $form_factor,
            list_price_usd = $list_price_usd,
            net_price_usd = $net_price_usd,
            net_price_eur = $net_price_eur,
            price_1yr_warranty_usd = $price_1yr_warranty_usd,
            price_1yr_warranty_eur = $price_1yr_warranty_eur,
            price_3yr_warranty_usd = $price_3yr_warranty_usd,
            price_3yr_warranty_eur = $price_3yr_warranty_eur,
            price_5yr_warranty_usd = $price_5yr_warranty_usd,
            price_5yr_warranty_eur = $price_5yr_warranty_eur,
            price_3yr_ps_usd = $price_3yr_ps_usd,
            price_5yr_ps_usd = $price_5yr_ps_usd,
            price_3yr_psp_usd = $price_3yr_psp_usd,
            price_5yr_psp_usd = $price_5yr_psp_usd,
            excel_source_file = $excel_source_file,
            excel_sheet_name = $excel_sheet_name,
            excel_row_number = $excel_row_number,
            import_id = $import_id,
            created_at = time::now()
    ";
    
    let _response = db
        .query(sql)
        .bind(("lot_id", &lot_id))
        .bind(("vendor", &lot.vendor))
        .bind(("lot_code", &lot.lot_code))
        .bind(("lot_description", &lot.lot_description))
        .bind(("base_part_number", &lot.base_part_number))
        .bind(("server_type", &lot.server_type))
        .bind(("form_factor", &lot.form_factor))
        .bind(("list_price_usd", lot.list_price_usd))
        .bind(("net_price_usd", lot.net_price_usd))
        .bind(("net_price_eur", lot.net_price_eur))
        .bind(("price_1yr_warranty_usd", lot.price_1yr_warranty_usd))
        .bind(("price_1yr_warranty_eur", lot.price_1yr_warranty_eur))
        .bind(("price_3yr_warranty_usd", lot.price_3yr_warranty_usd))
        .bind(("price_3yr_warranty_eur", lot.price_3yr_warranty_eur))
        .bind(("price_5yr_warranty_usd", lot.price_5yr_warranty_usd))
        .bind(("price_5yr_warranty_eur", lot.price_5yr_warranty_eur))
        .bind(("price_3yr_ps_usd", lot.price_3yr_ps_usd))
        .bind(("price_5yr_ps_usd", lot.price_5yr_ps_usd))
        .bind(("price_3yr_psp_usd", lot.price_3yr_psp_usd))
        .bind(("price_5yr_psp_usd", lot.price_5yr_psp_usd))
        .bind(("excel_source_file", &lot.excel_source_file))
        .bind(("excel_sheet_name", &lot.excel_sheet_name))
        .bind(("excel_row_number", lot.excel_row_number))
        .bind(("import_id", import_id))
        .await?;
    
    Ok(lot_id)
}

/// Store hardware component
async fn store_hardware_component(
    db: &Database,
    component: &ParsedHardwareComponent,
    import_id: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let component_id = format!("hardware_component:{}", Uuid::new_v4());
    
    let sql = "
        CREATE $component_id SET
            vendor = $vendor,
            lot_code = $lot_code,
            part_number = $part_number,
            component_type = $component_type,
            component_category = $component_category,
            description = $description,
            specification = $specification,
            quantity = $quantity,
            unit_price_usd = $unit_price_usd,
            unit_price_eur = $unit_price_eur,
            total_price_usd = $total_price_usd,
            total_price_eur = $total_price_eur,
            technical_specs = $technical_specs,
            excel_source_file = $excel_source_file,
            excel_sheet_name = $excel_sheet_name,
            excel_row_number = $excel_row_number,
            import_id = $import_id,
            created_at = time::now()
    ";
    
    let _response = db
        .query(sql)
        .bind(("component_id", &component_id))
        .bind(("vendor", &component.vendor))
        .bind(("lot_code", &component.lot_code))
        .bind(("part_number", &component.part_number))
        .bind(("component_type", &component.component_type))
        .bind(("component_category", &component.component_category))
        .bind(("description", &component.description))
        .bind(("specification", &component.specification))
        .bind(("quantity", component.quantity))
        .bind(("unit_price_usd", component.unit_price_usd))
        .bind(("unit_price_eur", component.unit_price_eur))
        .bind(("total_price_usd", component.total_price_usd))
        .bind(("total_price_eur", component.total_price_eur))
        .bind(("technical_specs", &component.technical_specs))
        .bind(("excel_source_file", &component.excel_source_file))
        .bind(("excel_sheet_name", &component.excel_sheet_name))
        .bind(("excel_row_number", component.excel_row_number))
        .bind(("import_id", import_id))
        .await?;
    
    Ok(component_id)
}

/// Store hardware option
async fn store_hardware_option(
    db: &Database,
    option: &ParsedHardwareOption,
    import_id: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let option_id = format!("hardware_option:{}_{}", option.vendor.to_lowercase(), option.part_number.replace("/", "_"));
    
    let sql = "
        CREATE $option_id SET
            vendor = $vendor,
            part_number = $part_number,
            option_type = $option_type,
            category = $category,
            description = $description,
            compatibility = $compatibility,
            unit_price_usd = $unit_price_usd,
            unit_price_eur = $unit_price_eur,
            currency = $currency,
            specifications = $specifications,
            excel_source_file = $excel_source_file,
            excel_sheet_name = $excel_sheet_name,
            excel_row_number = $excel_row_number,
            import_id = $import_id,
            created_at = time::now()
    ";
    
    let compatibility_json = serde_json::to_value(&option.compatibility)?;
    
    let _response = db
        .query(sql)
        .bind(("option_id", &option_id))
        .bind(("vendor", &option.vendor))
        .bind(("part_number", &option.part_number))
        .bind(("option_type", &option.option_type))
        .bind(("category", &option.category))
        .bind(("description", &option.description))
        .bind(("compatibility", compatibility_json))
        .bind(("unit_price_usd", option.unit_price_usd))
        .bind(("unit_price_eur", option.unit_price_eur))
        .bind(("currency", &option.currency))
        .bind(("specifications", &option.specifications))
        .bind(("excel_source_file", &option.excel_source_file))
        .bind(("excel_sheet_name", &option.excel_sheet_name))
        .bind(("excel_row_number", option.excel_row_number))
        .bind(("import_id", import_id))
        .await?;
    
    Ok(option_id)
}

/// Store import history
async fn store_import_history(
    db: &Database,
    import_id: &str,
    file_name: &str,
    file_path: &str,
    parsed_basket: &ParsedHardwareBasket,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let history_id = format!("import_history:{}", import_id);
    
    let sql = "
        CREATE $history_id SET
            import_id = $import_id,
            file_name = $file_name,
            file_path = $file_path,
            vendor = $vendor,
            import_status = $import_status,
            items_processed = $items_processed,
            items_failed = $items_failed,
            error_log = $error_log,
            imported_at = time::now()
    ";
    
    let error_log_json = serde_json::to_value(&parsed_basket.processing_errors)?;
    
    let _response = db
        .query(sql)
        .bind(("history_id", &history_id))
        .bind(("import_id", import_id))
        .bind(("file_name", file_name))
        .bind(("file_path", file_path))
        .bind(("vendor", &parsed_basket.vendor))
        .bind(("import_status", if parsed_basket.processing_errors.is_empty() { "SUCCESS" } else { "PARTIAL" }))
        .bind(("items_processed", parsed_basket.total_items_processed as i64))
        .bind(("items_failed", parsed_basket.processing_errors.len() as i64))
        .bind(("error_log", error_log_json))
        .await?;
    
    Ok(history_id)
}

/// Get comprehensive hardware data by vendor
pub async fn get_comprehensive_hardware_data(
    State(db): State<Arc<Database>>,
    Path(vendor): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    println!("📊 Retrieving comprehensive hardware data for vendor: {}", vendor);
    
    // Get hardware lots
    let lots_sql = "SELECT * FROM hardware_lot WHERE vendor = $vendor ORDER BY lot_code";
    let lots: Vec<serde_json::Value> = db
        .query(lots_sql)
        .bind(("vendor", &vendor))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Get hardware components
    let components_sql = "SELECT * FROM hardware_component WHERE vendor = $vendor ORDER BY lot_code, component_type";
    let components: Vec<serde_json::Value> = db
        .query(components_sql)
        .bind(("vendor", &vendor))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Get hardware options
    let options_sql = "SELECT * FROM hardware_option WHERE vendor = $vendor ORDER BY category, part_number";
    let options: Vec<serde_json::Value> = db
        .query(options_sql)
        .bind(("vendor", &vendor))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(json!({
        "vendor": vendor,
        "hardware_lots": lots,
        "hardware_components": components,
        "hardware_options": options,
        "summary": {
            "total_lots": lots.len(),
            "total_components": components.len(),
            "total_options": options.len()
        }
    })))
}

/// Get import history
pub async fn get_import_history(
    State(db): State<Arc<Database>>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let sql = "SELECT * FROM import_history ORDER BY imported_at DESC LIMIT 50";
    let history: Vec<serde_json::Value> = db
        .query(sql)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .take(0)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(json!({
        "import_history": history
    })))
}
