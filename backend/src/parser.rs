use calamine::{Reader, Xlsx, open_workbook};
use serde_json::json;
use surrealdb::sql::{Thing, Datetime};
use core_engine::models::hardware_basket::{HardwareModel, HardwareConfiguration, HardwarePricing as HardwarePrice};
use anyhow::{Result, anyhow};
use std::collections::HashMap;
use uuid::Uuid;

fn get_string_value(row: &[calamine::DataType], col_map: &HashMap<String, usize>, key: &str) -> String {
    col_map.get(key)
        .and_then(|&index| row.get(index))
        .map(|v| v.to_string().trim().to_string())
        .unwrap_or_default()
}

fn get_f64_value(row: &[calamine::DataType], col_map: &HashMap<String, usize>, key: &str) -> f64 {
    col_map.get(key)
        .and_then(|&index| row.get(index))
        .and_then(|v| v.get_float())
        .unwrap_or(0.0)
}

fn get_i64_value(row: &[calamine::DataType], col_map: &HashMap<String, usize>, key: &str) -> i64 {
     col_map.get(key)
        .and_then(|&index| row.get(index))
        .and_then(|v| v.get_int())
        .unwrap_or(1) // Default quantity to 1
}

pub fn parse_excel_data(
    file_path: &str,
    basket_id: Thing,
    vendor: &str,
    quotation_date: Datetime,
) -> Result<(Vec<HardwareModel>, Vec<HardwareConfiguration>, Vec<HardwarePrice>)> {
    let mut workbook: Xlsx<_> = open_workbook(file_path)?;

    let sheet_names = workbook.sheet_names().to_owned();
    let mut data_worksheet_name = String::new();

    for name in sheet_names {
        let name_lower = name.to_lowercase();
        if name_lower.contains("pricing") || name_lower.contains("lot") || name_lower.contains("config") || name_lower.contains("server") || name_lower.contains("quote") {
            data_worksheet_name = name.to_string();
            break;
        }
    }

    if data_worksheet_name.is_empty() {
        data_worksheet_name = workbook.sheet_names().get(0).ok_or_else(|| anyhow!("No sheets in workbook"))?.to_string();
    }
    
    let range = workbook.worksheet_range(&data_worksheet_name).ok_or_else(|| anyhow!("Could not find worksheet"))??;
    
    let mut header_row_number = 0;
    let mut header_map: HashMap<String, usize> = HashMap::new();

    for (i, row) in range.rows().enumerate().take(20) { // Scan more rows for header
        let mut potential_headers = HashMap::new();
        let mut hardware_terms = 0;
        for (col_idx, cell) in row.iter().enumerate() {
            let val = cell.to_string().to_lowercase().trim().to_string();
            if !val.is_empty() {
                potential_headers.insert(val.clone(), col_idx);
                if val.contains("lot") || val.contains("description") || val.contains("item") || val.contains("specification") || val.contains("price") || val.contains("model") || val.contains("sku") || val.contains("part") || val.contains("quantity") {
                    hardware_terms += 1;
                }
            }
        }
        if hardware_terms >= 3 {
            header_row_number = i;
            header_map = potential_headers;
            break;
        }
    }

    if header_map.is_empty() {
        return Err(anyhow!("Could not find a valid header row with at least 3 hardware-related terms."));
    }

    let mut models = Vec::new();
    let mut configurations = Vec::new();
    let mut prices = Vec::new();
    
    let mut current_model: Option<HardwareModel> = None;

    for (i, row) in range.rows().enumerate() {
        if i <= header_row_number {
            continue; // Skip header rows
        }

        let lot_desc = get_string_value(row, &header_map, "lot description");
        let item_desc = get_string_value(row, &header_map, "item description");
        let spec_desc = get_string_value(row, &header_map, "specification description");
        let full_desc = if !item_desc.is_empty() { item_desc.clone() } else { spec_desc.clone() };

        // Heuristic to detect a new lot/model
        // A new lot starts if "Lot Description" is present, or if the row seems to be a main component (e.g., a server chassis)
        let is_new_lot = !lot_desc.is_empty() || (full_desc.to_lowercase().contains("server") || full_desc.to_lowercase().contains("chassis")) && !full_desc.to_lowercase().contains("kit");

        if is_new_lot {
            // If there's a current model being built, finalize it and push to the vector.
            if let Some(model) = current_model.take() {
                models.push(model);
            }
            
            // Start a new model
            let model_name = if !lot_desc.is_empty() { lot_desc.clone() } else { full_desc.clone() };
            let model_number = get_string_value(row, &header_map, "model");
            
            current_model = Some(HardwareModel {
                id: Some(Thing { tb: "hardware_model".to_string(), id: Uuid::new_v4().to_string().into() }),
                basket_id: basket_id.clone(),
                lot_description: lot_desc,
                model_name,
                model_number: if !model_number.is_empty() { model_number } else { get_string_value(row, &header_map, "part number") },
                category: "Server".to_string(), // Placeholder
                form_factor: "Unknown".to_string(), // Placeholder
                vendor: vendor.to_string(),
                
                // Default values for new fields
                server_model: "".to_string(),
                server_size: "".to_string(),
                socket_count: 0,
                cpu_model: "".to_string(),
                cpu_cores: 0,
                cpu_threads: 0,
                cpu_frequency: "".to_string(),
                vsan_ready: false,
                
                processor_info: String::new(), // Will be populated by configurations
                ram_info: String::new(), // Will be populated by configurations
                network_info: String::new(), // Will be populated by configurations
                
                // Source information for categorization
                source_sheet: "Generic".to_string(),
                source_section: "Parsed Data".to_string(),
                
                quotation_date: quotation_date.clone(),
            });
        }

        // If we are inside a lot, parse the row as a configuration
        if let Some(model) = &mut current_model {
            if !full_desc.is_empty() {
                let config_id = Thing { tb: "hardware_configuration".to_string(), id: Uuid::new_v4().to_string().into() };
                let quantity = get_i64_value(row, &header_map, "qty");
                
                let config = HardwareConfiguration {
                    id: Some(config_id.clone()),
                    model_id: model.id.clone().unwrap(),
                    part_number: get_string_value(row, &header_map, "part number"),
                    description: full_desc.clone(),
                    category: "Component".to_string(), // Placeholder
                    quantity,
                    specifications: json!({
                        "sku": get_string_value(row, &header_map, "sku"),
                    }),
                };

                // Simple logic to populate model summary fields
                let desc_lower = full_desc.to_lowercase();
                if desc_lower.contains("cpu") || desc_lower.contains("processor") {
                    model.processor_info = full_desc.clone();
                }
                if desc_lower.contains("dimm") || desc_lower.contains("memory") || desc_lower.contains("gb") {
                    model.ram_info = full_desc.clone();
                }
                 if desc_lower.contains("nic") || desc_lower.contains("ethernet") || desc_lower.contains("adapter") {
                    model.network_info = full_desc.clone();
                }

                configurations.push(config);

                // Parse pricing for this configuration
                let unit_price = get_f64_value(row, &header_map, "unit price");
                let extended_price = get_f64_value(row, &header_map, "extended price");

                if unit_price > 0.0 || extended_price > 0.0 {
                    prices.push(HardwarePrice {
                        id: None,
                        record_id: config_id, // Link price to the configuration
                        price_type: "Component".to_string(),
                        price: if extended_price > 0.0 { extended_price } else { unit_price * quantity as f64 },
                        currency: "USD".to_string(), // Placeholder
                        price_date: quotation_date.clone(),
                    });
                }
            }
        }
    }
    
    // Add the last model if it exists
    if let Some(model) = current_model.take() {
        models.push(model);
    }

    if models.is_empty() && !configurations.is_empty() {
        return Err(anyhow!("Parsed configurations but could not identify any main hardware models/lots. Check the Excel file for 'Lot Description' or server/chassis entries."));
    }

    Ok((models, configurations, prices))
}
