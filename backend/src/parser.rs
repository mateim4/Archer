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

    // Enhanced sheet detection for vendor-specific sheets
    for name in sheet_names {
        let name_lower = name.to_lowercase();
        if vendor.to_lowercase() == "lenovo" && (name_lower.contains("lenovo") && name_lower.contains("lot")) {
            data_worksheet_name = name.to_string();
            break;
        } else if name_lower.contains("pricing") || name_lower.contains("lot") || name_lower.contains("config") || name_lower.contains("server") || name_lower.contains("quote") {
            data_worksheet_name = name.to_string();
            break;
        }
    }

    if data_worksheet_name.is_empty() {
        data_worksheet_name = workbook.sheet_names().get(0).ok_or_else(|| anyhow!("No sheets in workbook"))?.to_string();
    }
    
    let range = workbook.worksheet_range(&data_worksheet_name).ok_or_else(|| anyhow!("Could not find worksheet"))??;
    
    // Use vendor-specific parsing logic
    if vendor.to_lowercase() == "lenovo" {
        parse_lenovo_structure(range, basket_id, quotation_date)
    } else {
        parse_generic_structure(range, basket_id, vendor, quotation_date)
    }
}

fn parse_lenovo_structure(
    range: calamine::Range<calamine::DataType>,
    basket_id: Thing,
    quotation_date: Datetime,
) -> Result<(Vec<HardwareModel>, Vec<HardwareConfiguration>, Vec<HardwarePrice>)> {
    let mut header_row_number = 0;
    let mut header_map: HashMap<String, usize> = HashMap::new();

    // Find header row for Lenovo structure (should be around row 3)
    for (i, row) in range.rows().enumerate().take(10) {
        let mut potential_headers = HashMap::new();
        let mut hardware_terms = 0;
        for (col_idx, cell) in row.iter().enumerate() {
            let val = cell.to_string().to_lowercase().trim().to_string();
            if !val.is_empty() {
                potential_headers.insert(val.clone(), col_idx);
                if val.contains("part number") || val.contains("description") || val.contains("quantity") || val.contains("price") {
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
        return Err(anyhow!("Could not find a valid header row with hardware terms."));
    }

    let mut models = Vec::new();
    let mut configurations = Vec::new();
    let mut prices = Vec::new();
    
    let mut current_lot: Option<(String, String, f64)> = None; // (lot_id, description, price)
    let mut current_model: Option<HardwareModel> = None;
    let mut current_components: Vec<String> = Vec::new();

    for (i, row) in range.rows().enumerate() {
        if i <= header_row_number {
            continue; // Skip header rows
        }

        let part_number = get_string_value(row, &header_map, "part number");
        let description = get_string_value(row, &header_map, "description");
        let quantity = get_i64_value(row, &header_map, "quantity");
        let price_usd = get_f64_value(row, &header_map, "total price in usd");

        // Check if this is a lot row (significant part number and high price)
        if is_lenovo_lot_row(&part_number, &description, price_usd) {
            // Finalize previous model if exists
            if let Some(model) = current_model.take() {
                let enhanced_model = enhance_lenovo_model_with_components(model, &current_components);
                models.push(enhanced_model);
            }

            // Start new lot
            current_lot = Some((part_number.clone(), description.clone(), price_usd));
            current_components.clear();
            
        } else if let Some((lot_id, lot_desc, lot_price)) = &current_lot {
            // Check if this is the server model description row
            if is_lenovo_server_model_row(&description, &lot_id) {
                // Create new model
                current_model = Some(create_lenovo_model(
                    &lot_id, &lot_desc, &description, *lot_price, basket_id.clone(), quotation_date.clone()
                ));
            } else if !description.is_empty() && !description.trim().is_empty() {
                // This is a component, add to current model's components
                current_components.push(description.clone());
                
                // Create configuration for this component
                if let Some(ref model) = current_model {
                    let config_id = Thing { tb: "hardware_configuration".to_string(), id: Uuid::new_v4().to_string().into() };
                    
                    let config = HardwareConfiguration {
                        id: Some(config_id.clone()),
                        model_id: model.id.clone().unwrap(),
                        part_number: part_number.clone(),
                        description: description.clone(),
                        category: classify_lenovo_component(&description),
                        quantity,
                        specifications: json!({
                            "component_type": classify_lenovo_component(&description),
                        }),
                    };

                    configurations.push(config);

                    // Add pricing if available
                    if price_usd > 0.0 {
                        prices.push(HardwarePrice {
                            id: None,
                            record_id: config_id,
                            price_type: "Component".to_string(),
                            price: price_usd,
                            currency: "USD".to_string(),
                            price_date: quotation_date.clone(),
                        });
                    }
                }
            }
        }
    }
    
    // Finalize last model
    if let Some(model) = current_model.take() {
        let enhanced_model = enhance_lenovo_model_with_components(model, &current_components);
        models.push(enhanced_model);
    }

    if models.is_empty() {
        return Err(anyhow!("No Lenovo server models found in the Excel file."));
    }

    Ok((models, configurations, prices))
}

fn parse_generic_structure(
    range: calamine::Range<calamine::DataType>,
    basket_id: Thing,
    vendor: &str,
    quotation_date: Datetime,
) -> Result<(Vec<HardwareModel>, Vec<HardwareConfiguration>, Vec<HardwarePrice>)> {
    // Original generic parsing logic
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

fn is_lenovo_lot_row(part_number: &str, description: &str, price: f64) -> bool {
    // Lot rows have significant part numbers and high pricing
    !part_number.is_empty() && 
    part_number.len() >= 8 && 
    price > 1000.0 && 
    (description.to_lowercase().contains("intel") || description.to_lowercase().contains("amd"))
}

fn is_lenovo_server_model_row(description: &str, lot_id: &str) -> bool {
    // Server model rows contain server names and warranty info
    let desc_lower = description.to_lowercase();
    let lot_prefix = if lot_id.len() >= 4 { &lot_id[0..4] } else { lot_id };
    
    desc_lower.contains("thinksystem") && 
    (desc_lower.contains("sr630") || desc_lower.contains("sr650") || desc_lower.contains("sr645")) &&
    desc_lower.contains("warranty") &&
    description.starts_with(&lot_prefix)
}

fn create_lenovo_model(
    lot_id: &str, 
    lot_desc: &str, 
    server_desc: &str, 
    price: f64, 
    basket_id: Thing, 
    quotation_date: Datetime
) -> HardwareModel {
    let form_factor = extract_lenovo_form_factor(server_desc);
    let server_model = extract_lenovo_server_model(server_desc);
    
    HardwareModel {
        id: Some(Thing { tb: "hardware_model".to_string(), id: Uuid::new_v4().to_string().into() }),
        basket_id,
        lot_description: lot_desc.to_string(),
        model_name: server_desc.to_string(),
        model_number: lot_id.to_string(),
        category: "Server".to_string(),
        form_factor: form_factor,
        vendor: "Lenovo".to_string(),
        server_model: server_model,
        server_size: "".to_string(),
        socket_count: 0,
        cpu_model: "".to_string(),
        cpu_cores: 0,
        cpu_threads: 0,
        cpu_frequency: "".to_string(),
        vsan_ready: false,
        processor_info: String::new(),
        ram_info: String::new(),
        network_info: String::new(),
        source_sheet: "Lenovo X86 Server Lots".to_string(),
        source_section: "Enhanced Parsing".to_string(),
        quotation_date,
    }
}

fn extract_lenovo_form_factor(description: &str) -> String {
    let desc_lower = description.to_lowercase();
    
    // Server model mappings based on Lenovo specifications
    if desc_lower.contains("sr630") { return "1U".to_string(); }
    if desc_lower.contains("sr650") { return "2U".to_string(); }
    if desc_lower.contains("sr645") { return "1U".to_string(); }
    if desc_lower.contains("sr665") { return "2U".to_string(); }
    
    // Direct form factor mentions
    if desc_lower.contains("1u") { return "1U".to_string(); }
    if desc_lower.contains("2u") { return "2U".to_string(); }
    if desc_lower.contains("4u") { return "4U".to_string(); }
    
    "1U".to_string() // Default for most ThinkSystem servers
}

fn extract_lenovo_server_model(description: &str) -> String {
    let desc_lower = description.to_lowercase();
    
    if desc_lower.contains("sr630") { return "ThinkSystem SR630 V3".to_string(); }
    if desc_lower.contains("sr650") { return "ThinkSystem SR650 V3".to_string(); }
    if desc_lower.contains("sr645") { return "ThinkSystem SR645 V3".to_string(); }
    if desc_lower.contains("sr665") { return "ThinkSystem SR665 V3".to_string(); }
    
    // Extract the server model from the description
    if let Some(start) = desc_lower.find("thinksystem") {
        let remaining = &description[start..];
        if let Some(end) = remaining.find(" -") {
            return remaining[..end].to_string();
        }
    }
    
    "ThinkSystem Server".to_string()
}

fn classify_lenovo_component(description: &str) -> String {
    let desc_lower = description.to_lowercase();
    
    if desc_lower.contains("chassis") { return "Chassis".to_string(); }
    if desc_lower.contains("xeon") || desc_lower.contains("processor") { return "CPU".to_string(); }
    if desc_lower.contains("dimm") || desc_lower.contains("ddr5") { return "Memory".to_string(); }
    if desc_lower.contains("ssd") || desc_lower.contains("nvme") || desc_lower.contains("storage") { return "Storage".to_string(); }
    if desc_lower.contains("ethernet") || desc_lower.contains("nic") || desc_lower.contains("gbe") { return "Network".to_string(); }
    if desc_lower.contains("power") || desc_lower.contains("psu") { return "Power".to_string(); }
    if desc_lower.contains("riser") || desc_lower.contains("pcie") { return "Expansion".to_string(); }
    if desc_lower.contains("raid") { return "Storage Controller".to_string(); }
    
    "Component".to_string()
}

fn enhance_lenovo_model_with_components(mut model: HardwareModel, components: &[String]) -> HardwareModel {
    let mut processor_parts = Vec::new();
    let mut memory_parts = Vec::new();
    let mut storage_parts = Vec::new();
    let mut network_parts = Vec::new();
    let mut total_memory_gb = 0;
    let mut cpu_cores_total = 0;
    
    for component in components {
        let comp_lower = component.to_lowercase();
        
        // Processor analysis
        if comp_lower.contains("xeon") || comp_lower.contains("processor") {
            processor_parts.push(component.clone());
            
            // Extract CPU cores (e.g., "10C", "36C")
            if let Some(cores) = extract_cpu_cores(component) {
                cpu_cores_total += cores;
                model.cpu_cores = cores;
            }
            
            // Extract CPU frequency (e.g., "2.7GHz", "2.0GHz")
            if let Some(freq) = extract_cpu_frequency(component) {
                model.cpu_frequency = freq;
            }
            
            // Extract CPU model
            if model.cpu_model.is_empty() {
                if let Some(cpu_model) = extract_cpu_model(component) {
                    model.cpu_model = cpu_model;
                }
            }
        }
        
        // Memory analysis
        if comp_lower.contains("dimm") || comp_lower.contains("ddr5") {
            memory_parts.push(component.clone());
            
            // Extract memory capacity (e.g., "16GB", "32GB")
            if let Some(capacity_gb) = extract_memory_capacity(component) {
                total_memory_gb += capacity_gb;
            }
        }
        
        // Storage analysis
        if comp_lower.contains("ssd") || comp_lower.contains("nvme") || comp_lower.contains("storage") {
            storage_parts.push(component.clone());
        }
        
        // Network analysis
        if comp_lower.contains("ethernet") || comp_lower.contains("nic") || comp_lower.contains("gbe") {
            network_parts.push(component.clone());
        }
        
        // Form factor extraction from chassis
        if comp_lower.contains("chassis") {
            if let Some(form_factor) = extract_chassis_form_factor(component) {
                model.form_factor = form_factor;
            }
        }
    }
    
    // Populate summary fields
    model.processor_info = if processor_parts.is_empty() { 
        "".to_string() 
    } else { 
        processor_parts.join("; ") 
    };
    
    model.ram_info = if memory_parts.is_empty() { 
        "".to_string() 
    } else if total_memory_gb > 0 {
        format!("{}GB DDR5 ({})", total_memory_gb, memory_parts.join("; "))
    } else {
        memory_parts.join("; ")
    };
    
    model.network_info = if network_parts.is_empty() { 
        "".to_string() 
    } else { 
        network_parts.join("; ") 
    };
    
    // Set storage info in the network_info field for now (since there's no storage_info field in the model)
    if !storage_parts.is_empty() {
        if !model.network_info.is_empty() {
            model.network_info.push_str(" | Storage: ");
        } else {
            model.network_info = "Storage: ".to_string();
        }
        model.network_info.push_str(&storage_parts.join("; "));
    }
    
    model
}

fn extract_cpu_cores(description: &str) -> Option<i64> {
    use regex::Regex;
    let re = Regex::new(r"(\d+)C\b").ok()?;
    if let Some(captures) = re.captures(description) {
        captures.get(1)?.as_str().parse().ok()
    } else {
        None
    }
}

fn extract_cpu_frequency(description: &str) -> Option<String> {
    use regex::Regex;
    let re = Regex::new(r"(\d+\.?\d*)GHz").ok()?;
    if let Some(captures) = re.captures(description) {
        Some(format!("{}GHz", captures.get(1)?.as_str()))
    } else {
        None
    }
}

fn extract_cpu_model(description: &str) -> Option<String> {
    use regex::Regex;
    let re = Regex::new(r"Intel Xeon [A-Za-z]+ \d+[A-Za-z]*\+?").ok()?;
    if let Some(captures) = re.find(description) {
        Some(captures.as_str().to_string())
    } else {
        None
    }
}

fn extract_memory_capacity(description: &str) -> Option<i64> {
    use regex::Regex;
    let re = Regex::new(r"(\d+)GB").ok()?;
    if let Some(captures) = re.captures(description) {
        captures.get(1)?.as_str().parse().ok()
    } else {
        None
    }
}

fn extract_chassis_form_factor(description: &str) -> Option<String> {
    let desc_lower = description.to_lowercase();
    if desc_lower.contains("1u") { Some("1U".to_string()) }
    else if desc_lower.contains("2u") { Some("2U".to_string()) }
    else if desc_lower.contains("4u") { Some("4U".to_string()) }
    else { None }
}
}
