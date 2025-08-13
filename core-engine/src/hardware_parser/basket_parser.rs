use calamine::{Reader, Xlsx, open_workbook, Range, DataType};
use crate::error::CoreEngineError;
use crate::Result;
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
        
        // Parse Lenovo X86 Parts sheet
        if let Some(worksheet_result) = workbook.worksheet_range("Lenovo X86 Parts") {
            let worksheet = worksheet_result
                .map_err(|e| CoreEngineError::parsing(format!("Failed to read Lenovo Parts sheet: {}", e)))?;
            
            println!("📊 Processing Lenovo X86 Parts sheet: {} rows x {} cols", 
                     worksheet.get_size().0, worksheet.get_size().1);
            
            let (options, errors) = self.parse_lenovo_parts(&worksheet, file_path);
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
            // Check if this is a lot description row (contains SMI1, SMI2, SMA1, SMA2)
            if let Some(cell_0) = row.get(0) {
                if let Some(lot_desc) = cell_0.as_string() {
                    if lot_desc.contains("SMI") || lot_desc.contains("SMA") {
                        // Extract lot code (SMI1, SMI2, etc.)
                        let lot_code = if lot_desc.starts_with("SMI1") { "SMI1" }
                        else if lot_desc.starts_with("SMI2") { "SMI2" }
                        else if lot_desc.starts_with("SMA1") { "SMA1" }
                        else if lot_desc.starts_with("SMA2") { "SMA2" }
                        else { continue; };
                        
                        current_lot_code = Some(lot_code.to_string());
                        
                        // Parse the lot itself
                        let server_type = if row.get(1).and_then(|c| c.as_string()).unwrap_or_default() == "Server" {
                            lot_desc.clone()
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
                            lot_code: lot_code.to_string(),
                            lot_description: lot_desc,
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
            // Check if this is a lot description row (part number + SMI description)
            if let Some(part_cell) = row.get(1) {
                if let Some(part_number) = part_cell.as_string() {
                    if !part_number.trim().is_empty() {
                        // Check if description contains SMI
                        if let Some(desc_cell) = row.get(2) {
                            if let Some(description) = desc_cell.as_string() {
                                if description.contains("SMI") {
                                    // Extract lot code from description
                                    let lot_code = if description.contains("SMI1") { "SMI1" }
                                    else if description.contains("SMI2") { "SMI2" }
                                    else if description.contains("SMA1") { "SMA1" }
                                    else if description.contains("SMA2") { "SMA2" }
                                    else { continue; };
                                    
                                    current_lot_code = Some(lot_code.to_string());
                                    
                                    let price_1yr_usd = get_f64(row.get(4));
                                    let price_1yr_eur = get_f64(row.get(5));
                                    let price_3yr_usd = get_f64(row.get(6));
                                    let price_3yr_eur = get_f64(row.get(7));
                                    
                                    let lot = ParsedHardwareLot {
                                        vendor: "Lenovo".to_string(),
                                        lot_code: lot_code.to_string(),
                                        lot_description: description.clone(),
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
}
