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
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        
        // Parse Lenovo X86 Server Lots sheet
        if let Some(Ok(worksheet)) = workbook.worksheet_range("Lenovo X86 Server Lots") {
            println!("📊 Processing Lenovo X86 Server Lots sheet...");
            let (parsed_models, parsed_configs, parsed_prices) = self.parse_lenovo_server_lots(&worksheet, file_path, basket_id, vendor_id)?;
            models.extend(parsed_models);
            configurations.extend(parsed_configs);
            prices.extend(parsed_prices);
        }
        
        // Parse Lenovo X86 Parts sheet
        if let Some(Ok(worksheet)) = workbook.worksheet_range("Lenovo X86 Parts") {
            println!("📊 Processing Lenovo X86 Parts sheet...");
            let (parsed_models, parsed_configs, parsed_prices) = self.parse_lenovo_parts(&worksheet, file_path, basket_id, vendor_id)?;
            models.extend(parsed_models);
            configurations.extend(parsed_configs);
            prices.extend(parsed_prices);
        }
        
        Ok((models, configurations, prices))
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
                // Check for Dell server model patterns: SMI, SMA, MEI, MEA, HVI, HVA, VEI, VEA, VOI, VOA, DHC
                let is_server_model = desc.contains("SMI") || desc.contains("SMA") || 
                                     desc.contains("MEI") || desc.contains("MEA") ||
                                     desc.contains("HVI") || desc.contains("HVA") ||
                                     desc.contains("VEI") || desc.contains("VEA") ||
                                     desc.contains("VOI") || desc.contains("VOA") ||
                                     desc.contains("DHC");
                
                if is_server_model {
                    println!("🔍 Found Dell server model: {}", desc);
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
    
    fn parse_lenovo_server_lots(&self, worksheet: &Range<DataType>, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        let spec_parser = SpecParser::new();

        let mut current_model: Option<HardwareModel> = None;
        
        println!("🔍 Lenovo Server Lots: worksheet has {} rows", worksheet.get_size().0);

        for (row_idx, row) in worksheet.rows().enumerate() {
            // Header is at row index 3, data starts at row 5 (skip empty row 4)
            if row_idx <= 4 { continue; }
            
            // Debug: Print first few data rows
            if row_idx <= 10 {
                let part_number = row.get(1).and_then(|c| c.as_string()).unwrap_or_default();
                let description = row.get(2).and_then(|c| c.as_string()).unwrap_or_default();
                println!("🔍 Row {}: part='{}', desc='{}'", row_idx, part_number, description);
            }

            // Check if this is a server model row
            let part_number = row.get(1).and_then(|c| c.as_string());
            let description = row.get(2).and_then(|c| c.as_string());

            if let Some(part_or_desc) = part_number {
                if !part_or_desc.trim().is_empty() {
                    // Check if this looks like a server description (column 1 can contain descriptions for Lenovo)
                    let lower_desc = part_or_desc.to_lowercase();
                    let is_server = lower_desc.contains("server") ||
                                   part_or_desc.contains("SMI") || part_or_desc.contains("SMA") ||
                                   part_or_desc.contains("MEI") || part_or_desc.contains("MEA") ||
                                   part_or_desc.contains("HVI") || part_or_desc.contains("HVA") ||
                                   part_or_desc.contains("VEI") || part_or_desc.contains("VEA") ||
                                   part_or_desc.contains("VOI") || part_or_desc.contains("VOA") ||
                                   part_or_desc.contains("DHC");

                    if is_server {
                        // Debug: Found a server
                        println!("🔍 Found server: '{}'", part_or_desc);
                        
                        // Finalize previous model if exists
                        if let Some(model) = current_model.take() {
                            models.push(model);
                        }

                        let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };

                        // Extract lot code from description (part_or_desc contains the server description)
                        let lot_code = if let Some(space_pos) = part_or_desc.find(" - ") {
                            part_or_desc[..space_pos].to_string()
                        } else if let Some(space_pos) = part_or_desc.find(" ") {
                            part_or_desc[..space_pos].to_string()
                        } else {
                            part_or_desc.clone()
                        };

                        current_model = Some(HardwareModel {
                            id: Some(model_id.clone()),
                            basket_id: basket_id.clone(),
                            vendor_id: vendor_id.clone(),
                            lot_description: part_or_desc.clone(),
                            model_name: lot_code,
                            model_number: None, // No part number in this column for server descriptions
                            form_factor: None,
                            category: "server".to_string(),
                            base_specifications: HardwareSpecifications::default(),
                            created_at: Utc::now().into(),
                            updated_at: Utc::now().into(),
                            source_sheet: "Lenovo X86 Server Lots".to_string(),
                            source_section: "Server Lots".to_string(),
                        });

                        // Create pricing info if available
                        let price_1yr_usd = row.get(4).and_then(|c| c.as_f64());
                        let price_1yr_eur = row.get(5).and_then(|c| c.as_f64());
                        
                        if let Some(price) = price_1yr_usd {
                            let pricing_id = Thing { tb: "hardware_pricing".to_string(), id: surrealdb::sql::Id::rand() };
                            prices.push(HardwarePricing {
                                id: Some(pricing_id),
                                configuration_id: None,
                                model_id: Some(model_id.clone()),
                                list_price: price,
                                net_price_usd: price,
                                net_price_eur: price_1yr_eur,
                                currency: "USD".to_string(),
                                valid_from: Utc::now().into(),
                                valid_to: None,
                                support_options: vec![SupportOption {
                                    duration_years: 1,
                                    support_type: "basic".to_string(),
                                    price_usd: price,
                                    price_eur: price_1yr_eur,
                                    description: Some("1 Year Support".to_string()),
                                }],
                                created_at: Utc::now().into(),
                            });
                        }
                    }
                }
            }
        }

        // Add the last processed model
        if let Some(model) = current_model.take() {
            models.push(model);
        }

        println!("✅ Lenovo Server Lots parsed: {} models", models.len());
        Ok((models, configurations, prices))
    }

    fn parse_lenovo_parts(&self, worksheet: &Range<DataType>, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        let spec_parser = SpecParser::new();

        let mut current_model: Option<HardwareModel> = None;

        for (row_idx, row) in worksheet.rows().enumerate() {
            // Header is at row index 3, data starts at row 4
            if row_idx <= 3 { continue; }

            let part_number = row.get(1).and_then(|c| c.as_string());
            let description = row.get(2).and_then(|c| c.as_string());

            if let (Some(part_num), Some(desc)) = (part_number, description) {
                if !part_num.trim().is_empty() && !desc.trim().is_empty() {
                    // Check if this is a server chassis
                    let lower_desc = desc.to_lowercase();
                    let is_server_chassis = lower_desc.contains("chassis") && lower_desc.contains("server");

                    if is_server_chassis {
                        // Finalize previous model if exists
                        if let Some(model) = current_model.take() {
                            models.push(model);
                        }

                        let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };

                        current_model = Some(HardwareModel {
                            id: Some(model_id.clone()),
                            basket_id: basket_id.clone(),
                            vendor_id: vendor_id.clone(),
                            lot_description: desc.clone(),
                            model_name: desc.clone(),
                            model_number: Some(part_num),
                            form_factor: None,
                            category: "server".to_string(),
                            base_specifications: HardwareSpecifications::default(),
                            created_at: Utc::now().into(),
                            updated_at: Utc::now().into(),
                            source_sheet: "Lenovo X86 Parts".to_string(),
                            source_section: "Server Chassis".to_string(),
                        });

                        // Create pricing info if available
                        let price_1yr_usd = row.get(4).and_then(|c| c.as_f64());
                        let price_1yr_eur = row.get(5).and_then(|c| c.as_f64());
                        
                        if let Some(price) = price_1yr_usd {
                            let pricing_id = Thing { tb: "hardware_pricing".to_string(), id: surrealdb::sql::Id::rand() };
                            prices.push(HardwarePricing {
                                id: Some(pricing_id),
                                configuration_id: None,
                                model_id: Some(model_id.clone()),
                                list_price: price,
                                net_price_usd: price,
                                net_price_eur: price_1yr_eur,
                                currency: "USD".to_string(),
                                valid_from: Utc::now().into(),
                                valid_to: None,
                                support_options: vec![SupportOption {
                                    duration_years: 1,
                                    support_type: "basic".to_string(),
                                    price_usd: price,
                                    price_eur: price_1yr_eur,
                                    description: Some("1 Year Support".to_string()),
                                }],
                                created_at: Utc::now().into(),
                            });
                        }
                    } else if let Some(model) = current_model.as_mut() {
                        // This might be a component/upgrade for the current server model
                        let config_id = Thing { tb: "hardware_configuration".to_string(), id: surrealdb::sql::Id::rand() };
                        
                        let item_type = if lower_desc.contains("processor") || lower_desc.contains("cpu") {
                            "processor"
                        } else if lower_desc.contains("memory") || lower_desc.contains("ram") {
                            "memory"
                        } else if lower_desc.contains("storage") || lower_desc.contains("disk") || lower_desc.contains("ssd") {
                            "storage"
                        } else if lower_desc.contains("network") || lower_desc.contains("ethernet") {
                            "network"
                        } else {
                            "component"
                        };

                        configurations.push(HardwareConfiguration {
                            id: Some(config_id),
                            model_id: model.id.as_ref().unwrap().clone(),
                            part_number: Some(part_num),
                            sku: None,
                            description: desc.clone(),
                            item_type: item_type.to_string(),
                            quantity: 1,
                            specifications: None,
                            compatibility_notes: None,
                            created_at: Utc::now().into(),
                        });
                        
                        // Update model specifications based on the component
                        match item_type {
                            "processor" => {
                                if let Some(spec) = spec_parser.parse_processor(&desc) {
                                    model.base_specifications.processor = Some(spec);
                                }
                            },
                            "memory" => {
                                if let Some(spec) = spec_parser.parse_memory(&desc) {
                                    model.base_specifications.memory = Some(spec);
                                }
                            },
                            "storage" => {
                                if let Some(spec) = spec_parser.parse_storage(&desc) {
                                    model.base_specifications.storage = Some(spec);
                                }
                            },
                            "network" => {
                                if let Some(spec) = spec_parser.parse_network(&desc) {
                                    model.base_specifications.network = Some(spec);
                                }
                            },
                            _ => {}
                        }
                    }
                }
            }
        }

        // Add the last processed model
        if let Some(model) = current_model.take() {
            models.push(model);
        }

        println!("✅ Lenovo Parts parsed: {} models, {} configurations", models.len(), configurations.len());
        Ok((models, configurations, prices))
    }
}
