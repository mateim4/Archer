use calamine::{Reader, Xlsx, open_workbook, Range, DataType};
use crate::error::CoreEngineError;
use crate::Result;
use std::path::Path;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
        let mut workbook: Xlsx<_> = open_workbook(file_path)
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
            
            println!("� Processing Dell Options and Upgrades sheet: {} rows x {} cols", 
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
                Ok(worksheet) => {
                    println!("✅ Successfully loaded 'Dell Lot Pricing' sheet");
                    let mut dell_items = self.parse_dell_lot_pricing(worksheet)?;
                    items.append(&mut dell_items);
                },
                Err(e) => {
                    println!("❌ Error loading 'Dell Lot Pricing' sheet: {}", e);
                }
            }
        } else {
            println!("⚠️  'Dell Lot Pricing' sheet not found");
        }
        
        // Try other common sheet names
        for sheet_name in &["Pricing", "Hardware", "Models", "Products", "Servers"] {
            if let Some(worksheet_result) = workbook.worksheet_range(sheet_name) {
                match worksheet_result {
                    Ok(worksheet) => {
                        println!("✅ Successfully loaded '{}' sheet", sheet_name);
                        let mut parsed_items = self.parse_generic_hardware_sheet(worksheet)?;
                        items.append(&mut parsed_items);
                        break; // Only parse one additional sheet
                    },
                    Err(e) => {
                        println!("❌ Error loading '{}' sheet: {}", sheet_name, e);
                    }
                }
            }
        }
        
        Ok(ParsedHardwareBasket {
            items,
            currency: "USD".to_string(),
            vendor: "Dell".to_string(),
            parsed_at: Utc::now(),
        })
    }
    
    fn parse_dell_lot_pricing(&self, worksheet: Range<DataType>) -> Result<Vec<ParsedHardwareItem>> {
        let mut items = Vec::new();
        
        println!("📊 Parsing Dell Lot Pricing sheet with {} rows", worksheet.get_size().0);
        
        // Look for data starting from row 3 (0-indexed), where actual hardware data begins
        for (row_idx, row) in worksheet.rows().enumerate().skip(2) {
            if row_idx > 50 { break; } // Limit to prevent infinite loops
            
            // Skip empty rows
            if row.iter().all(|cell| cell.is_empty()) { continue; }
            
            // Extract lot description (column 0), item (column 1), spec (column 2)
            let lot_description = row.get(0).and_then(|c| c.get_string()).unwrap_or("").to_string();
            let item = row.get(1).and_then(|c| c.get_string()).unwrap_or("").to_string();
            let specification = row.get(2).and_then(|c| c.get_string()).unwrap_or("").to_string();
            
            // Skip header rows and empty entries
            if lot_description.is_empty() || lot_description.contains("Lot Description") { continue; }
            
            // Extract pricing information (adjust column indices based on actual structure)
            let list_price = row.get(3).and_then(|c| c.get_float()).unwrap_or(0.0);
            let net_price_usd = row.get(4).and_then(|c| c.get_float()).unwrap_or(0.0);
            let net_price_eur = row.get(5).and_then(|c| c.get_float()).unwrap_or(0.0);
            
            println!("🔍 Row {}: lot='{}', item='{}', spec='{}', usd={}, eur={}", 
                     row_idx, lot_description, item, specification, net_price_usd, net_price_eur);
            
            if !lot_description.is_empty() && (net_price_usd > 0.0 || net_price_eur > 0.0) {
                // Create hardware item
                let hardware_item = ParsedHardwareItem {
                    id: Uuid::new_v4().to_string(),
                    name: lot_description.clone(),
                    vendor: "Dell".to_string(),
                    model_family: item.clone(),
                    form_factor: if specification.contains("1U") { "1U".to_string() } 
                               else if specification.contains("2U") { "2U".to_string() }
                               else { "Rack".to_string() },
                    processor_type: if specification.contains("Intel") { "Intel".to_string() }
                                   else if specification.contains("AMD") { "AMD".to_string() }
                                   else { "Intel".to_string() },
                    description: format!("{} - {}", lot_description, specification),
                    list_price: if list_price > 0.0 { Some(list_price) } else { None },
                    net_price_usd: if net_price_usd > 0.0 { Some(net_price_usd) } else { None },
                    net_price_eur: if net_price_eur > 0.0 { Some(net_price_eur) } else { None },
                    specifications: serde_json::json!({
                        "lot_description": lot_description,
                        "item": item,
                        "specification": specification
                    }),
                };
                
                items.push(hardware_item);
            }
        }
        
        println!("✅ Parsed {} items from Dell Lot Pricing", items.len());
        Ok(items)
    }
    
    fn parse_generic_hardware_sheet(&self, worksheet: Range<DataType>) -> Result<Vec<ParsedHardwareItem>> {
        let mut items = Vec::new();
        
        // Simple parser for generic hardware sheets
        for (row_idx, row) in worksheet.rows().enumerate().skip(1) {
            if row_idx > 50 { break; }
            
            if row.iter().all(|cell| cell.is_empty()) { continue; }
            
            // Try to extract any meaningful hardware data
            let name = row.get(0).and_then(|c| c.get_string()).unwrap_or("").to_string();
            let price = row.get(1).and_then(|c| c.get_float())
                        .or_else(|| row.get(2).and_then(|c| c.get_float()))
                        .or_else(|| row.get(3).and_then(|c| c.get_float()))
                        .unwrap_or(0.0);
            
            if !name.is_empty() && name.len() > 3 && price > 0.0 {
                let item = ParsedHardwareItem {
                    id: Uuid::new_v4().to_string(),
                    name: name.clone(),
                    vendor: "Generic".to_string(),
                    model_family: "Unknown".to_string(),
                    form_factor: "Unknown".to_string(),
                    processor_type: "Unknown".to_string(),
                    description: name.clone(),
                    list_price: Some(price),
                    net_price_usd: Some(price),
                    net_price_eur: None,
                    specifications: serde_json::json!({}),
                };
                
                items.push(item);
            }
        }
        
        Ok(items)
    }
}
