use calamine::{Reader, Xlsx, open_workbook, Range, DataType};
use crate::error::CoreEngineError;
use crate::Result;
use crate::hardware_parser::server_assembly::{ServerAssemblyEngine, ProcessingResult};
use crate::hardware_parser::component_classifier::{ClassifiedComponent, ServerConfiguration};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

fn get_f64(cell: Option<&DataType>) -> Option<f64> {
    match cell {
        Some(DataType::Float(f)) => Some(*f),
        Some(DataType::Int(i)) => Some(*i as f64),
        _ => None,
    }
}

/// Hardware Lot (main server configuration)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedHardwareLot {
    pub vendor: String,
    pub lot_code: String, // SMI1, SMI2, etc.
    pub lot_description: String,
    pub base_part_number: Option<String>,
    pub server_type: String,
    pub form_factor: String,
    
    // Pricing information
    pub list_price_usd: Option<f64>,
    pub net_price_usd: Option<f64>,
    pub net_price_eur: Option<f64>,
    
    // Warranty pricing
    pub price_1yr_warranty_usd: Option<f64>,
    pub price_1yr_warranty_eur: Option<f64>,
    pub price_3yr_warranty_usd: Option<f64>,
    pub price_3yr_warranty_eur: Option<f64>,
    pub price_5yr_warranty_usd: Option<f64>,
    pub price_5yr_warranty_eur: Option<f64>,
    
    // Support pricing (Dell specific)
    pub price_3yr_ps_usd: Option<f64>,
    pub price_5yr_ps_usd: Option<f64>,
    pub price_3yr_psp_usd: Option<f64>,
    pub price_5yr_psp_usd: Option<f64>,
    
    // Source tracking
    pub excel_source_file: String,
    pub excel_sheet_name: String,
    pub excel_row_number: u32,
}

/// Hardware Component (individual components within a lot)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedHardwareComponent {
    pub vendor: String,
    pub lot_code: String, // Links to parent lot
    pub part_number: Option<String>,
    pub component_type: String, // Server, RAM, Boot Disk, etc.
    pub component_category: String, // Hardware, Service, Option
    pub description: String,
    pub specification: Option<String>,
    
    // Quantity and pricing
    pub quantity: i32,
    pub unit_price_usd: Option<f64>,
    pub unit_price_eur: Option<f64>,
    pub total_price_usd: Option<f64>,
    pub total_price_eur: Option<f64>,
    
    // Technical specifications as JSON
    pub technical_specs: serde_json::Value,
    
    // Source tracking
    pub excel_source_file: String,
    pub excel_sheet_name: String,
    pub excel_row_number: u32,
}

/// Hardware Option/Upgrade (standalone options)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedHardwareOption {
    pub vendor: String,
    pub part_number: String,
    pub option_type: String,
    pub category: String,
    pub description: String,
    pub compatibility: Vec<String>, // Which lots this works with
    
    // Pricing
    pub unit_price_usd: Option<f64>,
    pub unit_price_eur: Option<f64>,
    pub currency: String,
    
    // Technical details
    pub specifications: serde_json::Value,
    
    // Source tracking
    pub excel_source_file: String,
    pub excel_sheet_name: String,
    pub excel_row_number: u32,
}

/// Vendor configuration and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedVendorConfig {
    pub vendor_name: String,
    pub file_version: String,
    pub last_updated: Option<DateTime<Utc>>,
    pub exchange_rates: HashMap<String, f64>,
    pub currency_valid_until: Option<DateTime<Utc>>,
    pub contact_info: serde_json::Value,
}

/// Result of parsing a hardware basket Excel file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedHardwareBasket {
    pub vendor_config: ParsedVendorConfig,
    pub hardware_lots: Vec<ParsedHardwareLot>,
    pub hardware_components: Vec<ParsedHardwareComponent>,
    pub hardware_options: Vec<ParsedHardwareOption>,
    pub currency: String,
    pub vendor: String,
    pub parsed_at: DateTime<Utc>,
    pub total_items_processed: usize,
    pub processing_errors: Vec<String>,
}

/// Hardware Basket Excel Parser for vendor pricing files
pub struct HardwareBasketParser;

impl HardwareBasketParser {
    pub fn parse_file(&self, file_path: &str) -> Result<ParsedHardwareBasket> {
        let workbook: Xlsx<_> = open_workbook(file_path)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to open Excel file: {}", e)))?;
        
        let sheet_names = workbook.sheet_names().to_vec();
        println!("📋 Available sheets: {:?}", sheet_names);
        
        // Determine vendor based on sheet names
        let vendor = if sheet_names.iter().any(|s| s.contains("Dell")) {
            "Dell".to_string()
        } else if sheet_names.iter().any(|s| s.contains("Lenovo")) {
            "Lenovo".to_string()
        } else {
            "Unknown".to_string()
        };
        
        println!("🏭 Detected vendor: {}", vendor);
        
        match vendor.as_str() {
            "Dell" => self.parse_dell_file(workbook, file_path),
            "Lenovo" => self.parse_lenovo_file(workbook, file_path),
            _ => Err(CoreEngineError::parsing("Unknown vendor format".to_string())),
        }
    }
    
    fn parse_dell_file(&self, mut workbook: Xlsx<std::io::BufReader<std::fs::File>>, file_path: &str) -> Result<ParsedHardwareBasket> {
        let mut hardware_lots = Vec::new();
        let mut hardware_components = Vec::new();
        let mut hardware_options = Vec::new();
        let mut processing_errors = Vec::new();
        
        // Parse vendor configuration from Cover sheet
        let vendor_config = self.parse_dell_vendor_config(&mut workbook)?;
        
        // Parse Dell Lot Pricing sheet
        if let Some(worksheet_result) = workbook.worksheet_range("Dell Lot Pricing") {
            let worksheet = worksheet_result
                .map_err(|e| CoreEngineError::parsing(format!("Failed to read Dell Lot Pricing sheet: {}", e)))?;
            
            println!("📊 Processing Dell Lot Pricing sheet: {} rows x {} cols", 
                     worksheet.get_size().0, worksheet.get_size().1);
            
            let (lots, components, errors) = self.parse_dell_lot_pricing(&worksheet, file_path);
            hardware_lots.extend(lots);
            hardware_components.extend(components);
            processing_errors.extend(errors);
        }
        
        // Parse Dell Options and Upgrades sheet
        if let Some(worksheet_result) = workbook.worksheet_range("Dell Options and Upgrades") {
            let worksheet = worksheet_result
                .map_err(|e| CoreEngineError::parsing(format!("Failed to read Dell Options sheet: {}", e)))?;
            
            println!("📊 Processing Dell Options and Upgrades sheet: {} rows x {} cols", 
                     worksheet.get_size().0, worksheet.get_size().1);
            
            let (options, errors) = self.parse_dell_options(&worksheet, file_path);
            hardware_options.extend(options);
            processing_errors.extend(errors);
        }
        
        let total_items = hardware_lots.len() + hardware_components.len() + hardware_options.len();
        
        Ok(ParsedHardwareBasket {
            vendor_config,
            hardware_lots,
            hardware_components,
            hardware_options,
            currency: "USD".to_string(),
            vendor: "Dell".to_string(),
            parsed_at: Utc::now(),
            total_items_processed: total_items,
            processing_errors,
        })
    }
    
    fn parse_lenovo_file(&self, mut workbook: Xlsx<std::io::BufReader<std::fs::File>>, file_path: &str) -> Result<ParsedHardwareBasket> {
        let mut hardware_lots = Vec::new();
        let mut hardware_components = Vec::new();
        let mut hardware_options = Vec::new();
        let mut processing_errors = Vec::new();
        
        // Parse vendor configuration from Cover sheet
        let vendor_config = self.parse_lenovo_vendor_config(&mut workbook)?;
        
        // Parse Lenovo X86 Server Lots sheet
        if let Some(worksheet_result) = workbook.worksheet_range("Lenovo X86 Server Lots") {
            let worksheet = worksheet_result
                .map_err(|e| CoreEngineError::parsing(format!("Failed to read Lenovo Server Lots sheet: {}", e)))?;
            
            println!("📊 Processing Lenovo X86 Server Lots sheet: {} rows x {} cols", 
                     worksheet.get_size().0, worksheet.get_size().1);
            
            let (lots, components, errors) = self.parse_lenovo_server_lots(&worksheet, file_path);
            hardware_lots.extend(lots);
            hardware_components.extend(components);
            processing_errors.extend(errors);
        }
        
        // Parse Lenovo X86 Parts sheet - This is where the actual servers are!
        if let Some(worksheet_result) = workbook.worksheet_range("Lenovo X86 Parts") {
            let worksheet = worksheet_result
                .map_err(|e| CoreEngineError::parsing(format!("Failed to read Lenovo Parts sheet: {}", e)))?;
            
            println!("📊 Processing Lenovo X86 Parts sheet: {} rows x {} cols", 
                     worksheet.get_size().0, worksheet.get_size().1);
            
            // Parse both servers (from server chassis parts) and options (from upgrade parts)
            let (server_lots, options, errors) = self.parse_lenovo_parts_as_servers(&worksheet, file_path);
            hardware_lots.extend(server_lots);
            hardware_options.extend(options);
            processing_errors.extend(errors);
        }
        
        let total_items = hardware_lots.len() + hardware_components.len() + hardware_options.len();
        
        Ok(ParsedHardwareBasket {
            vendor_config,
            hardware_lots,
            hardware_components,
            hardware_options,
            currency: "USD".to_string(),
            vendor: "Lenovo".to_string(),
            parsed_at: Utc::now(),
            total_items_processed: total_items,
            processing_errors,
        })
    }
    
    fn parse_dell_vendor_config(&self, _workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>) -> Result<ParsedVendorConfig> {
        // Parse basic vendor config - can be enhanced later
        let mut exchange_rates = HashMap::new();
        exchange_rates.insert("EUR_USD".to_string(), 1.1);
        
        Ok(ParsedVendorConfig {
            vendor_name: "Dell".to_string(),
            file_version: "Q3 2025 v2".to_string(),
            last_updated: None,
            exchange_rates,
            currency_valid_until: None,
            contact_info: serde_json::json!({}),
        })
    }
    
    fn parse_lenovo_vendor_config(&self, _workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>) -> Result<ParsedVendorConfig> {
        // Parse basic vendor config - can be enhanced later
        let mut exchange_rates = HashMap::new();
        exchange_rates.insert("EUR_USD".to_string(), 0.8607);
        
        Ok(ParsedVendorConfig {
            vendor_name: "Lenovo".to_string(),
            file_version: "Q3 2025 v2".to_string(),
            last_updated: None,
            exchange_rates,
            currency_valid_until: None,
            contact_info: serde_json::json!({}),
        })
    }
    
    fn parse_dell_lot_pricing(&self, worksheet: &Range<DataType>, file_path: &str) -> (Vec<ParsedHardwareLot>, Vec<ParsedHardwareComponent>, Vec<String>) {
        let mut lots = Vec::new();
        let mut components = Vec::new();
        let mut errors = Vec::new();
        
        let (rows, cols) = worksheet.get_size();
        println!("🔍 Dell Lot Pricing analysis: {} rows x {} cols", rows, cols);
        
        // Headers are at row 3 (0-indexed)
        let header_row = 3;
        if rows <= header_row {
            errors.push("Dell Lot Pricing sheet too small".to_string());
            return (lots, components, errors);
        }
        
        // Process data starting from row 4
        let mut current_lot_code: Option<String> = None;
        
        for (row_idx, row) in worksheet.rows().enumerate().skip(header_row + 1) {
            // Check if this is a lot description row (any non-empty entry in Column A)
            if let Some(cell_0) = row.get(0) {
                if let Some(lot_desc) = cell_0.as_string() {
                    // Skip empty cells and whitespace-only cells
                    let lot_desc = lot_desc.trim();
                    if !lot_desc.is_empty() {
                        // Filter out non-server entries
                        let lower_desc = lot_desc.to_lowercase();
                        if lower_desc.contains("upgrade option") || 
                           lower_desc.contains("configuration") ||
                           lower_desc.contains("option") ||
                           lower_desc.starts_with("add") ||
                           lower_desc.starts_with("additional") ||
                           lower_desc.starts_with("warranty") ||
                           lower_desc.starts_with("support") ||
                           lower_desc.starts_with("service") {
                            continue; // Skip non-server entries
                        }
                        
                        // Only parse entries that look like server model codes
                        // Expected patterns: SMI1, SMA1, MEI1, VEI1, DHC1, etc.
                        let is_server_model = lot_desc.chars().take(3).collect::<String>().chars().all(|c| c.is_ascii_alphabetic()) &&
                                             lot_desc.chars().nth(3).map_or(false, |c| c.is_ascii_digit());
                        
                        println!("🔍 Checking '{}' - first 3 chars: '{}', 4th char: '{:?}', is_server_model: {}", 
                                lot_desc, 
                                lot_desc.chars().take(3).collect::<String>(),
                                lot_desc.chars().nth(3),
                                is_server_model);
                        
                        if !is_server_model {
                            println!("❌ Skipping '{}' - doesn't match server model pattern", lot_desc);
                            continue; // Skip entries that don't match server model pattern
                        }
                        
                        // Extract lot code from the beginning of the description
                        let lot_code = if let Some(space_pos) = lot_desc.find(" - ") {
                            lot_desc[..space_pos].to_string()
                        } else if let Some(space_pos) = lot_desc.find(" ") {
                            lot_desc[..space_pos].to_string()
                        } else {
                            lot_desc.to_string()
                        };
                        current_lot_code = Some(lot_code.clone());
                        
                        println!("🔍 Parsing server entry: '{}' -> lot_code: '{}'", lot_desc, lot_code);
                        
                        // Parse the lot itself
                        let server_type = if row.get(1).and_then(|c| c.as_string()).unwrap_or_default() == "Server" {
                            lot_desc.to_string()
                        } else {
                            "Unknown".to_string()
                        };
                        
                        let list_price = get_f64(row.get(3));
                        let net_price_usd = get_f64(row.get(4));
                        let net_price_eur = get_f64(row.get(5));
                        let price_3yr_ps = get_f64(row.get(6));
                        let price_5yr_ps = get_f64(row.get(7));
                        let price_3yr_psp = get_f64(row.get(8));
                        let price_5yr_psp = get_f64(row.get(9));
                        
                        let lot = ParsedHardwareLot {
                            vendor: "Dell".to_string(),
                            lot_code: lot_code.clone(),
                            lot_description: lot_desc.to_string(),
                            base_part_number: None,
                            server_type,
                            form_factor: "Small Rack".to_string(), // From analysis
                            list_price_usd: list_price,
                            net_price_usd,
                            net_price_eur,
                            price_1yr_warranty_usd: None,
                            price_1yr_warranty_eur: None,
                            price_3yr_warranty_usd: None,
                            price_3yr_warranty_eur: None,
                            price_5yr_warranty_usd: None,
                            price_5yr_warranty_eur: None,
                            price_3yr_ps_usd: price_3yr_ps,
                            price_5yr_ps_usd: price_5yr_ps,
                            price_3yr_psp_usd: price_3yr_psp,
                            price_5yr_psp_usd: price_5yr_psp,
                            excel_source_file: file_path.to_string(),
                            excel_sheet_name: "Dell Lot Pricing".to_string(),
                            excel_row_number: row_idx as u32,
                        };
                        
                        lots.push(lot);
                        println!("✅ Parsed Dell lot: {} at row {}", lot_code, row_idx);
                        continue;
                    }
                }
            }
            
            // Check if this is a component row for the current lot
            if let Some(ref lot_code) = current_lot_code {
                if let Some(item_type_cell) = row.get(1) {
                    if let Some(item_type) = item_type_cell.as_string() {
                        if !item_type.trim().is_empty() && item_type != "Server" {
                            let specification = row.get(2).and_then(|c| c.as_string()).unwrap_or_default();
                            
                            let component = ParsedHardwareComponent {
                                vendor: "Dell".to_string(),
                                lot_code: lot_code.clone(),
                                part_number: None,
                                component_type: item_type,
                                component_category: "Hardware".to_string(),
                                description: specification.clone(),
                                specification: Some(specification),
                                quantity: 1,
                                unit_price_usd: get_f64(row.get(4)),
                                unit_price_eur: get_f64(row.get(5)),
                                total_price_usd: get_f64(row.get(4)),
                                total_price_eur: get_f64(row.get(5)),
                                technical_specs: serde_json::json!({}),
                                excel_source_file: file_path.to_string(),
                                excel_sheet_name: "Dell Lot Pricing".to_string(),
                                excel_row_number: row_idx as u32,
                            };
                            
                            components.push(component);
                        }
                    }
                }
            }
        }
        
        println!("✅ Dell Lot Pricing parsed: {} lots, {} components", lots.len(), components.len());
        (lots, components, errors)
    }
    
    fn parse_dell_options(&self, worksheet: &Range<DataType>, file_path: &str) -> (Vec<ParsedHardwareOption>, Vec<String>) {
        let mut options = Vec::new();
        let errors = Vec::new();
        
        let (rows, _cols) = worksheet.get_size();
        println!("🔍 Dell Options analysis: {} rows", rows);
        
        // Find header row and process options
        for (row_idx, row) in worksheet.rows().enumerate().skip(1) {
            // Basic option parsing - can be enhanced
            if let Some(desc_cell) = row.get(0) {
                if let Some(description) = desc_cell.as_string() {
                    if !description.trim().is_empty() {
                        let option = ParsedHardwareOption {
                            vendor: "Dell".to_string(),
                            part_number: format!("DELL_OPT_{}", row_idx),
                            option_type: "Upgrade".to_string(),
                            category: "General".to_string(),
                            description,
                            compatibility: vec!["SMI1".to_string(), "SMI2".to_string(), "SMA1".to_string(), "SMA2".to_string()],
                            unit_price_usd: get_f64(row.get(4)),
                            unit_price_eur: get_f64(row.get(5)),
                            currency: "USD".to_string(),
                            specifications: serde_json::json!({}),
                            excel_source_file: file_path.to_string(),
                            excel_sheet_name: "Dell Options and Upgrades".to_string(),
                            excel_row_number: row_idx as u32,
                        };
                        
                        options.push(option);
                    }
                }
            }
        }
        
        println!("✅ Dell Options parsed: {} options", options.len());
        (options, errors)
    }
    
    fn parse_lenovo_server_lots(&self, worksheet: &Range<DataType>, file_path: &str) -> (Vec<ParsedHardwareLot>, Vec<ParsedHardwareComponent>, Vec<String>) {
        let mut lots = Vec::new();
        let mut components = Vec::new();
        let mut errors = Vec::new();
        
        let (rows, cols) = worksheet.get_size();
        println!("🔍 Lenovo Server Lots analysis: {} rows x {} cols", rows, cols);
        
        // Headers are at row 3 (0-indexed)
        let header_row = 3;
        if rows <= header_row {
            errors.push("Lenovo Server Lots sheet too small".to_string());
            return (lots, components, errors);
        }
        
        // Process data starting from row 4, skipping empty row 4
        let mut current_lot_code: Option<String> = None;
        
        for (row_idx, row) in worksheet.rows().enumerate().skip(header_row + 2) { // Start from row 5 (skip empty row 4)
            // Check if this is a lot description row (part number + Server description)
            if let Some(part_cell) = row.get(1) {
                if let Some(part_number) = part_cell.as_string() {
                    if !part_number.trim().is_empty() {
                        // Check if description contains server info
                        if let Some(desc_cell) = row.get(2) {
                            if let Some(description) = desc_cell.as_string() {
                                let description = description.trim();
                                
                                // Filter out non-server entries (same logic as Dell)
                                let lower_desc = description.to_lowercase();
                                if lower_desc.contains("upgrade option") || 
                                   lower_desc.contains("configuration") ||
                                   lower_desc.contains("option") ||
                                   lower_desc.starts_with("add") ||
                                   lower_desc.starts_with("additional") ||
                                   lower_desc.starts_with("warranty") ||
                                   lower_desc.starts_with("support") ||
                                   lower_desc.starts_with("service") {
                                    continue; // Skip non-server entries
                                }
                                
                                // Check if this looks like a server description
                                // For Lenovo, look for server patterns in description
                                let is_server = description.to_lowercase().contains("server") ||
                                               description.contains("SMI") ||
                                               description.contains("SMA") ||
                                               description.contains("MEI") ||
                                               description.contains("MEA") ||
                                               description.contains("HVI") ||
                                               description.contains("HVA") ||
                                               description.contains("VEI") ||
                                               description.contains("VEA") ||
                                               description.contains("VOI") ||
                                               description.contains("VOA") ||
                                               description.contains("DHC");
                                
                                if is_server {
                                    // Extract lot code from description
                                    let lot_code = if let Some(space_pos) = description.find(" - ") {
                                        description[..space_pos].to_string()
                                    } else if let Some(space_pos) = description.find(" ") {
                                        description[..space_pos].to_string()
                                    } else {
                                        description.to_string()
                                    };
                                    
                                    current_lot_code = Some(lot_code.clone());
                                    
                                    println!("🔍 Parsing Lenovo server entry: '{}' -> lot_code: '{}'", description, lot_code);
                                    
                                    let price_1yr_usd = get_f64(row.get(4));
                                    let price_1yr_eur = get_f64(row.get(5));
                                    let price_3yr_usd = get_f64(row.get(6));
                                    let price_3yr_eur = get_f64(row.get(7));
                                    
                                    let lot = ParsedHardwareLot {
                                        vendor: "Lenovo".to_string(),
                                        lot_code: lot_code.clone(),
                                        lot_description: description.to_string(),
                                        base_part_number: Some(part_number.clone()),
                                        server_type: if description.contains("Intel") { "Intel".to_string() } else { "AMD".to_string() },
                                        form_factor: "Small Rack".to_string(),
                                        list_price_usd: None,
                                        net_price_usd: None,
                                        net_price_eur: None,
                                        price_1yr_warranty_usd: price_1yr_usd,
                                        price_1yr_warranty_eur: price_1yr_eur,
                                        price_3yr_warranty_usd: price_3yr_usd,
                                        price_3yr_warranty_eur: price_3yr_eur,
                                        price_5yr_warranty_usd: None,
                                        price_5yr_warranty_eur: None,
                                        price_3yr_ps_usd: None,
                                        price_5yr_ps_usd: None,
                                        price_3yr_psp_usd: None,
                                        price_5yr_psp_usd: None,
                                        excel_source_file: file_path.to_string(),
                                        excel_sheet_name: "Lenovo X86 Server Lots".to_string(),
                                        excel_row_number: row_idx as u32,
                                    };
                                    
                                    lots.push(lot);
                                    println!("✅ Parsed Lenovo lot: {} ({}) at row {}", lot_code, part_number, row_idx);
                                    continue;
                                }
                            }
                        }
                    }
                }
            }
            
            // Check if this is a component row for the current lot
            if let Some(ref lot_code) = current_lot_code {
                if let Some(part_cell) = row.get(1) {
                    if let Some(part_number) = part_cell.as_string() {
                        if !part_number.trim().is_empty() {
                            if let Some(desc_cell) = row.get(2) {
                                if let Some(description) = desc_cell.as_string() {
                                    let quantity = get_f64(row.get(3)).unwrap_or(1.0) as i32;
                                    
                                    let component = ParsedHardwareComponent {
                                        vendor: "Lenovo".to_string(),
                                        lot_code: lot_code.clone(),
                                        part_number: Some(part_number),
                                        component_type: "Component".to_string(),
                                        component_category: "Hardware".to_string(),
                                        description,
                                        specification: None,
                                        quantity,
                                        unit_price_usd: None,
                                        unit_price_eur: None,
                                        total_price_usd: None,
                                        total_price_eur: None,
                                        technical_specs: serde_json::json!({}),
                                        excel_source_file: file_path.to_string(),
                                        excel_sheet_name: "Lenovo X86 Server Lots".to_string(),
                                        excel_row_number: row_idx as u32,
                                    };
                                    
                                    components.push(component);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        println!("✅ Lenovo Server Lots parsed: {} lots, {} components", lots.len(), components.len());
        (lots, components, errors)
    }
    
    fn parse_lenovo_parts(&self, worksheet: &Range<DataType>, file_path: &str) -> (Vec<ParsedHardwareOption>, Vec<String>) {
        let mut options = Vec::new();
        let errors = Vec::new();
        
        let (rows, _cols) = worksheet.get_size();
        println!("🔍 Lenovo Parts analysis: {} rows", rows);
        
        // Process all rows looking for parts
        for (row_idx, row) in worksheet.rows().enumerate().skip(1) {
            // Basic parts parsing
            if let Some(part_cell) = row.get(0) {
                if let Some(part_number) = part_cell.as_string() {
                    if !part_number.trim().is_empty() {
                        let description = row.get(1).and_then(|c| c.as_string()).unwrap_or_default();
                        
                        println!("🔍 Lenovo part analysis: '{}' -> '{}'", part_number, description);
                        
                        let option = ParsedHardwareOption {
                            vendor: "Lenovo".to_string(),
                            part_number,
                            option_type: "Part".to_string(),
                            category: "Hardware".to_string(),
                            description,
                            compatibility: vec!["SMI1".to_string(), "SMI2".to_string()],
                            unit_price_usd: get_f64(row.get(2)),
                            unit_price_eur: get_f64(row.get(3)),
                            currency: "USD".to_string(),
                            specifications: serde_json::json!({}),
                            excel_source_file: file_path.to_string(),
                            excel_sheet_name: "Lenovo X86 Parts".to_string(),
                            excel_row_number: row_idx as u32,
                        };
                        
                        options.push(option);
                    }
                }
            }
        }
        
        println!("✅ Lenovo Parts parsed: {} parts", options.len());
        (options, errors)
    }
    
    fn parse_lenovo_parts_as_servers(&self, worksheet: &Range<DataType>, file_path: &str) -> (Vec<ParsedHardwareLot>, Vec<ParsedHardwareOption>, Vec<String>) {
        let mut server_lots = Vec::new();
        let mut options = Vec::new();
        let errors = Vec::new();
        
        let (rows, _cols) = worksheet.get_size();
        println!("🔍 Lenovo Parts Smart Analysis: {} rows", rows);
        
        // Step 1: Identify unique server chassis platforms from the compatibility data
        let mut server_platforms = std::collections::HashSet::new();
        let mut cpu_models = Vec::new();
        let mut component_catalog = Vec::new();
        
        // First pass: categorize all parts and identify server platforms
        for (row_idx, row) in worksheet.rows().enumerate().skip(1) {
            if let Some(part_cell) = row.get(0) {
                if let Some(part_number) = part_cell.as_string() {
                    if !part_number.trim().is_empty() {
                        let description = row.get(1).and_then(|c| c.as_string()).unwrap_or_default();
                        let compatibility = row.get(1).and_then(|c| c.as_string()).unwrap_or_default();
                        
                        // Extract server platform compatibility info
                        if compatibility.contains("ThinkSystem") {
                            if compatibility.contains("SR630") { server_platforms.insert("SR630"); }
                            if compatibility.contains("SR650") { server_platforms.insert("SR650"); }
                            if compatibility.contains("SR645") { server_platforms.insert("SR645"); }
                            if compatibility.contains("SR665") { server_platforms.insert("SR665"); }
                            if compatibility.contains("VX650") { server_platforms.insert("VX650"); }
                            if compatibility.contains("VX655") { server_platforms.insert("VX655"); }
                        }
                        
                        // Categorize components
                        let description_lower = description.to_lowercase();
                        if description_lower.contains("upgrade option") {
                            // Skip upgrade options
                            continue;
                        } else if description.contains("Intel® Xeon®") || description.contains("AMD EPYC") {
                            // This is a CPU
                            cpu_models.push((part_number.clone(), description.clone(), compatibility.clone(), row_idx));
                        } else {
                            // This is a component (memory, storage, network, etc.)
                            component_catalog.push((part_number.clone(), description.clone(), compatibility.clone(), row_idx));
                        }
                    }
                }
            }
        }
        
        println!("🔍 Found {} unique server platforms: {:?}", server_platforms.len(), server_platforms);
        println!("🔍 Found {} CPU models and {} other components", cpu_models.len(), component_catalog.len());
        
        // Step 2: Create meaningful server configurations by combining platforms with representative CPUs
        let mut config_id = 1;
        
        for platform in &server_platforms {
            // Determine platform characteristics
            let (form_factor, socket_count) = match platform.as_ref() {
                "SR630" => ("1U Rack".to_string(), "1S".to_string()),
                "SR650" => ("2U Rack".to_string(), "2S".to_string()),
                "SR645" => ("1U Rack".to_string(), "1S".to_string()),
                "SR665" => ("2U Rack".to_string(), "2S".to_string()),
                "VX650" => ("1U Rack".to_string(), "1S".to_string()),
                "VX655" => ("2U Rack".to_string(), "2S".to_string()),
                _ => ("Rack Server".to_string(), "1S".to_string()),
            };
            
            // Find compatible CPUs for this platform
            let compatible_cpus: Vec<_> = cpu_models.iter()
                .filter(|(_, _, compatibility, _)| compatibility.contains(platform))
                .collect();
            
            // Create a few representative server configurations per platform
            let cpu_samples = if compatible_cpus.len() > 6 {
                // Take a sample of CPUs: entry-level, mid-range, high-end
                vec![
                    compatible_cpus.get(0),  // Entry-level
                    compatible_cpus.get(compatible_cpus.len() / 3),  // Mid-range
                    compatible_cpus.get(compatible_cpus.len() / 2),  // Mid-high
                    compatible_cpus.get(compatible_cpus.len() * 2 / 3),  // High-end
                    compatible_cpus.get(compatible_cpus.len() - 1),  // Top-tier
                ].into_iter().filter_map(|x| x.cloned()).collect()
            } else {
                compatible_cpus
            };
            
            for (part_number, cpu_description, _, row_idx) in cpu_samples {
                // Extract CPU details for meaningful naming
                let (cpu_brand, cpu_cores, cpu_freq) = self.extract_cpu_details(cpu_description);
                
                // Create server model name
                let server_name = format!("ThinkSystem {} - {} {}", 
                    platform, 
                    cpu_brand,
                    if cpu_cores.is_empty() { "".to_string() } else { format!(" {}C", cpu_cores) }
                );
                
                // Extract pricing
                let price_usd = get_f64(worksheet.get((*row_idx, 2)));
                let price_eur = get_f64(worksheet.get((*row_idx, 3)));
                
                let server_lot = ParsedHardwareLot {
                    vendor: "Lenovo".to_string(),
                    lot_code: format!("{}-CFG{:03}", platform, config_id),
                    lot_description: server_name.clone(),
                    base_part_number: Some(part_number.clone()),
                    server_type: if cpu_description.contains("Intel") { "Intel".to_string() } else { "AMD".to_string() },
                    form_factor: form_factor.clone(),
                    list_price_usd: price_usd,
                    net_price_usd: price_usd,
                    net_price_eur: price_eur,
                    price_1yr_warranty_usd: price_usd,
                    price_1yr_warranty_eur: price_eur,
                    price_3yr_warranty_usd: None,
                    price_3yr_warranty_eur: None,
                    price_5yr_warranty_usd: None,
                    price_5yr_warranty_eur: None,
                    price_3yr_ps_usd: None,
                    price_5yr_ps_usd: None,
                    price_3yr_psp_usd: None,
                    price_5yr_psp_usd: None,
                    excel_source_file: file_path.to_string(),
                    excel_sheet_name: "Lenovo X86 Parts".to_string(),
                    excel_row_number: *row_idx as u32,
                };
                
                server_lots.push(server_lot);
                println!("✅ Created Lenovo server: {} ({}) with {}", server_name, form_factor, cpu_brand);
                config_id += 1;
            }
        }
        
        // Step 3: Add remaining components as options
        for (part_number, description, _, row_idx) in component_catalog {
            if !description.to_lowercase().contains("upgrade option") {
                let price_usd = get_f64(worksheet.get((row_idx, 2)));
                let price_eur = get_f64(worksheet.get((row_idx, 3)));
                
                let option = ParsedHardwareOption {
                    vendor: "Lenovo".to_string(),
                    part_number,
                    option_type: "Component".to_string(),
                    category: self.categorize_lenovo_component(&description),
                    description,
                    compatibility: vec!["Universal".to_string()],
                    unit_price_usd: price_usd,
                    unit_price_eur: price_eur,
                    currency: "USD".to_string(),
                    specifications: serde_json::json!({}),
                    excel_source_file: file_path.to_string(),
                    excel_sheet_name: "Lenovo X86 Parts".to_string(),
                    excel_row_number: row_idx as u32,
                };
                
                options.push(option);
            }
        }
        
        println!("✅ Smart Lenovo parsing: {} server configurations, {} components", server_lots.len(), options.len());
        (server_lots, options, errors)
    }
    
    fn extract_cpu_details(&self, cpu_description: &str) -> (String, String, String) {
        let description = cpu_description;
        
        // Extract CPU brand
        let cpu_brand = if description.contains("Intel® Xeon® Platinum") {
            "Intel Xeon Platinum".to_string()
        } else if description.contains("Intel® Xeon® Gold") {
            "Intel Xeon Gold".to_string()
        } else if description.contains("Intel® Xeon® Silver") {
            "Intel Xeon Silver".to_string()
        } else if description.contains("AMD EPYC") {
            "AMD EPYC".to_string()
        } else if description.contains("Intel®") {
            "Intel".to_string()
        } else if description.contains("AMD") {
            "AMD".to_string()
        } else {
            "CPU".to_string()
        };
        
        // Extract core count
        let cpu_cores = if let Some(cores_match) = regex::Regex::new(r"(\d+)C/").unwrap().captures(description) {
            cores_match.get(1).map_or("".to_string(), |m| m.as_str().to_string())
        } else {
            "".to_string()
        };
        
        // Extract frequency
        let cpu_freq = if let Some(freq_match) = regex::Regex::new(r"(\d+\.?\d*)\s?G").unwrap().captures(description) {
            freq_match.get(1).map_or("".to_string(), |m| format!("{}GHz", m.as_str()))
        } else {
            "".to_string()
        };
        
        (cpu_brand, cpu_cores, cpu_freq)
    }
    
    fn categorize_lenovo_component(&self, description: &str) -> String {
        let desc_lower = description.to_lowercase();
        
        if desc_lower.contains("rdimm") || desc_lower.contains("memory") {
            "Memory".to_string()
        } else if desc_lower.contains("ssd") || desc_lower.contains("hard drive") || desc_lower.contains("nvme") {
            "Storage".to_string()
        } else if desc_lower.contains("network") || desc_lower.contains("ethernet") || desc_lower.contains("fibre") || desc_lower.contains("adapter") {
            "Network".to_string()
        } else if desc_lower.contains("power supply") {
            "Power".to_string()
        } else if desc_lower.contains("perc") || desc_lower.contains("raid") {
            "Storage Controller".to_string()
        } else if desc_lower.contains("boss") {
            "Boot Controller".to_string()
        } else if desc_lower.contains("cable") || desc_lower.contains("optic") || desc_lower.contains("transceiver") {
            "Connectivity".to_string()
        } else {
            "General".to_string()
        }
    }
    
    fn extract_lenovo_server_info(&self, description: &str) -> (String, String) {
        let description_lower = description.to_lowercase();
        
        // Determine server type (Intel vs AMD)
        let server_type = if description_lower.contains("intel") || description.contains("SMI") || description.contains("MEI") || description.contains("HVI") || description.contains("VEI") || description.contains("VOI") {
            "Intel".to_string()
        } else if description_lower.contains("amd") || description.contains("SMA") || description.contains("MEA") || description.contains("HVA") || description.contains("VEA") || description.contains("VOA") {
            "AMD".to_string()
        } else {
            "Unknown".to_string()
        };
        
        // Determine form factor from description patterns
        let form_factor = if description_lower.contains("1u") {
            "1U Rack".to_string()
        } else if description_lower.contains("2u") {
            "2U Rack".to_string()
        } else if description_lower.contains("4u") {
            "4U Rack".to_string()
        } else if description_lower.contains("tower") {
            "Tower".to_string()
        } else if description_lower.contains("blade") {
            "Blade".to_string()
        } else if description.contains("SMI") || description.contains("SMA") {
            "Small Rack".to_string()
        } else if description.contains("MEI") || description.contains("MEA") {
            "Medium Rack".to_string()
        } else if description.contains("HVI") || description.contains("HVA") {
            "Heavy Rack".to_string()
        } else if description_lower.contains("1-socket") || description_lower.contains("1 socket") {
            "1U Rack".to_string()
        } else if description_lower.contains("2-socket") || description_lower.contains("2 socket") {
            "2U Rack".to_string()
        } else {
            "Rack Server".to_string()
        };
        
        (server_type, form_factor)
    }

    /// Schema-based parsing method that uses the new component classification system
    pub fn parse_with_schema(&self, file_path: &str) -> Result<SchemaBasedResult> {
        println!("🔍 Starting schema-based hardware basket parsing");
        
        let mut workbook: Xlsx<_> = open_workbook(file_path)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to open Excel file: {}", e)))?;
        
        let sheet_names = workbook.sheet_names().to_vec();
        println!("📋 Available sheets: {:?}", sheet_names);
        
        // Extract raw component data from all sheets
        let mut raw_components = Vec::new();
        
        for sheet_name in &sheet_names {
            if let Some(Ok(worksheet)) = workbook.worksheet_range(sheet_name) {
                println!("📊 Processing {} sheet: {} rows x {} cols", 
                    sheet_name, worksheet.height(), worksheet.width());
                
                let sheet_components = self.extract_raw_components(&worksheet, sheet_name)?;
                raw_components.extend(sheet_components);
            }
        }
        
        println!("🔍 Extracted {} raw components for classification", raw_components.len());
        
        // Use the server assembly engine to process components
        let assembly_engine = ServerAssemblyEngine::new();
        let processing_result = assembly_engine.process_hardware_basket(raw_components);
        
        println!("✅ Schema-based parsing complete:");
        println!("   📊 Server configurations: {}", processing_result.server_configurations.len());
        println!("   🔧 Upgrade components: {}", processing_result.upgrade_components.len());
        
        Ok(SchemaBasedResult {
            server_configurations: processing_result.server_configurations,
            upgrade_components: processing_result.upgrade_components,
            classification_summary: processing_result.classification_summary,
        })
    }
    
    fn extract_raw_components(&self, worksheet: &Range<DataType>, sheet_name: &str) -> Result<Vec<(String, String, String)>> {
        let mut components = Vec::new();
        
        // Try to identify column structure
        let headers = self.extract_headers(worksheet)?;
        
        for row_idx in 1..worksheet.height() {
            let row: Vec<&DataType> = (0..worksheet.width())
                .map(|col| worksheet.get((row_idx, col)).unwrap_or(&DataType::Empty))
                .collect();
            
            let part_number = self.extract_cell_value(&row, &headers, &["part number", "part_number", "sku", "part no"]);
            let description = self.extract_cell_value(&row, &headers, &["description", "desc", "product", "name"]);
            let price = self.extract_cell_value(&row, &headers, &["price", "unit price", "cost", "usd", "eur"]);
            
            if !part_number.is_empty() && !description.is_empty() {
                components.push((part_number, description, price));
            }
        }
        
        Ok(components)
    }
    
    fn extract_headers(&self, worksheet: &Range<DataType>) -> Result<HashMap<String, usize>> {
        let mut headers = HashMap::new();
        
        for col_idx in 0..worksheet.width() {
            if let Some(cell) = worksheet.get((0, col_idx)) {
                if let Some(header_text) = self.get_string_value_from_cell(cell) {
                    let normalized_header = header_text.to_lowercase().trim().to_string();
                    headers.insert(normalized_header, col_idx);
                }
            }
        }
        
        Ok(headers)
    }
    
    fn extract_cell_value(&self, row: &[&DataType], headers: &HashMap<String, usize>, possible_names: &[&str]) -> String {
        for name in possible_names {
            if let Some(&col_idx) = headers.get(*name) {
                if let Some(cell) = row.get(col_idx) {
                    if let Some(value) = self.get_string_value_from_cell(cell) {
                        return value;
                    }
                }
            }
        }
        String::new()
    }
    
    fn get_string_value_from_cell(&self, cell: &DataType) -> Option<String> {
        match cell {
            DataType::String(s) => Some(s.clone()),
            DataType::Int(i) => Some(i.to_string()),
            DataType::Float(f) => Some(f.to_string()),
            DataType::Bool(b) => Some(b.to_string()),
            DataType::DateTime(dt) => Some(dt.to_string()),
            DataType::Duration(d) => Some(d.to_string()),
            DataType::DateTimeIso(dt) => Some(dt.clone()),
            DataType::DurationIso(d) => Some(d.clone()),
            DataType::Empty => None,
            DataType::Error(_) => None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SchemaBasedResult {
    pub server_configurations: Vec<ServerConfiguration>,
    pub upgrade_components: Vec<ClassifiedComponent>,
    pub classification_summary: crate::hardware_parser::server_assembly::ClassificationSummary,
}
