use calamine::{Reader, Xlsx, open_workbook, Range, DataType};
use crate::error::CoreEngineError;
use crate::Result;
use std::path::Path;
use chrono::Utc;
use std::collections::HashMap;
use surrealdb::sql::Thing;

use crate::models::hardware_basket::{HardwareModel, HardwareConfiguration, HardwareSpecifications, HardwarePricing, SupportOption};
use super::spec_parser::SpecParser;

// This is the refactored Hardware Basket parser.
// It no longer uses intermediate models and instead directly constructs the
// unified data models defined in `core-engine/src/models/hardware_basket.rs`.
// It integrates the SpecParser to perform deep parsing of component descriptions.

pub type ParseResult = (Vec<HardwareModel>, Vec<HardwareConfiguration>, Vec<HardwarePricing>);

/// Hardware Basket Excel Parser for vendor pricing files.
pub struct HardwareBasketParser;

impl HardwareBasketParser {
    pub fn parse_file(&self, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut workbook: Xlsx<_> = open_workbook(file_path)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to open Excel file: {}", e)))?;
        
        let sheet_names = workbook.sheet_names().to_vec();
        
        let vendor = if sheet_names.iter().any(|s| s.contains("Dell")) {
            "Dell"
        } else if sheet_names.iter().any(|s| s.contains("Lenovo")) {
            "Lenovo"
        } else {
            "Unknown"
        };
        
        match vendor {
            "Dell" => self.parse_dell_file(&mut workbook, file_path, basket_id, vendor_id),
            "Lenovo" => self.parse_lenovo_file(&mut workbook, file_path, basket_id, vendor_id),
            _ => Err(CoreEngineError::parsing("Unknown vendor format".to_string())),
        }
    }
    
    fn parse_dell_file(&self, workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        
        if let Some(Ok(worksheet)) = workbook.worksheet_range("Dell Lot Pricing") {
            println!("📊 Processing Dell Lot Pricing sheet...");
            let (parsed_models, parsed_configs, parsed_prices) = self.parse_dell_lot_pricing(&worksheet, file_path, basket_id, vendor_id)?;
            models.extend(parsed_models);
            configurations.extend(parsed_configs);
            prices.extend(parsed_prices);
        }
        
        // Parsing for "Dell Options and Upgrades" can be added here later.
        
        Ok((models, configurations, prices))
    }
    
    fn parse_lenovo_file(&self, workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        // This will be implemented in a future step.
        println!("Lenovo parser not yet implemented.");
        Ok((Vec::new(), Vec::new(), Vec::new()))
    }
    
    fn parse_dell_lot_pricing(&self, worksheet: &Range<DataType>, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        let spec_parser = SpecParser::new();

        let mut current_model: Option<HardwareModel> = None;

        for (row_idx, row) in worksheet.rows().enumerate() {
            // Header is at row index 3, data starts at 4
            if row_idx <= 3 { continue; }

            let lot_desc = row.get(0).and_then(|c| c.as_string());
            let item_type = row.get(1).and_then(|c| c.as_string());
            let specification = row.get(2).and_then(|c| c.as_string());

            if let Some(desc) = lot_desc {
                if desc.contains("SMI") || desc.contains("SMA") {
                    // This is a new Lot, so finalize the previous model and start a new one.
                    if let Some(model) = current_model.take() {
                        models.push(model);
                    }

                    let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };

                    current_model = Some(HardwareModel {
                        id: Some(model_id.clone()),
                        basket_id: basket_id.clone(),
                        vendor_id: vendor_id.clone(),
                        lot_description: desc.clone(),
                        model_name: desc, // Simple name for now
                        model_number: None,
                        form_factor: None,
                        category: "server".to_string(),
                        base_specifications: HardwareSpecifications::default(),
                        created_at: Utc::now().into(),
                        updated_at: Utc::now().into(),
                        source_sheet: "Dell Lot Pricing".to_string(),
                        source_section: "Lots".to_string(),
                    });
                }
            }

            if let (Some(model), Some(spec_str)) = (current_model.as_mut(), specification) {
                // This row is a component of the current lot/model.
                if let Some(item_type_str) = item_type {
                    match item_type_str.to_lowercase().as_str() {
                        "processor" => {
                            if let Some(spec) = spec_parser.parse_processor(&spec_str) {
                                model.base_specifications.processor = Some(spec);
                            }
                        },
                        "memory" => {
                            if let Some(spec) = spec_parser.parse_memory(&spec_str) {
                                model.base_specifications.memory = Some(spec);
                            }
                        },
                        "boot device" | "storage" => {
                             if let Some(spec) = spec_parser.parse_storage(&spec_str) {
                                model.base_specifications.storage = Some(spec);
                            }
                        },
                         "network" => {
                             if let Some(spec) = spec_parser.parse_network(&spec_str) {
                                model.base_specifications.network = Some(spec);
                            }
                        },
                        _ => {} // Other types can be added here
                    }
                }
            }
        }

        // Add the last processed model
        if let Some(model) = current_model.take() {
            models.push(model);
        }

        println!("✅ Dell Lot Pricing parsed: {} models", models.len());
        Ok((models, configurations, prices))
    }
}
