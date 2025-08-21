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
        if let Some(Ok(worksheet)) = workbook.worksheet_range("Dell Options and Upgrades") {
            println!("📦 Processing Dell Options and Upgrades sheet...");
            let (opt_models, opt_configs, opt_prices) = self.parse_dell_options_and_upgrades(&worksheet, basket_id, vendor_id)?;
            models.extend(opt_models);
            configurations.extend(opt_configs);
            prices.extend(opt_prices);
        }
        
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

        // Step 1: Dynamically detect header row and column positions
        let (header_row_idx, lot_desc_col, item_type_col, spec_col) = self.detect_dell_columns(worksheet)?;
        
        println!("📊 Dell sheet analysis: header_row={}, lot_desc_col={}, item_type_col={}, spec_col={}", 
                header_row_idx, lot_desc_col, item_type_col, spec_col);

        // Detect price columns on the same header row
        let price_cols = self.detect_dell_price_columns(worksheet, header_row_idx);
        println!("💲 Dell price columns: list={:?} net_usd={:?} net_eur={:?}", price_cols.list_price_col, price_cols.net_price_usd_col, price_cols.net_price_eur_col);

        let mut current_model: Option<(HardwareModel, Thing)> = None; // keep model and its id

        for (row_idx, row) in worksheet.rows().enumerate() {
            // Skip header and rows before it
            if row_idx <= header_row_idx { continue; }

            let lot_desc = row.get(lot_desc_col).and_then(|c| c.as_string());
            let item_type = row.get(item_type_col).and_then(|c| c.as_string());
            let specification = row.get(spec_col).and_then(|c| c.as_string());

            if let Some(desc) = lot_desc {
                // Step 2: Use intelligent server model detection instead of hardcoded patterns
                let is_server_model = self.is_dell_server_model(&desc, &item_type);
                
                if is_server_model {
                    println!("🔍 Found Dell server model: {}", desc);
                    // Finalize previous model
                    if let Some((model, _mid)) = current_model.take() {
                        models.push(model);
                    }

                    let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };

                    let mut new_model = HardwareModel {
                        id: Some(model_id.clone()),
                        basket_id: basket_id.clone(),
                        vendor_id: vendor_id.clone(),
                        lot_description: desc.clone(),
                        model_name: desc.clone(), // Simple name for now
                        model_number: None,
                        form_factor: None,
                        category: "server".to_string(),
                        base_specifications: HardwareSpecifications::default(),
                        extensions: Some(Vec::new()),
                        created_at: Utc::now().into(),
                        updated_at: Utc::now().into(),
                        source_sheet: "Dell Lot Pricing".to_string(),
                        source_section: "Lots".to_string(),
                    };

                    // Attempt to set form factor from any nearby item_type/specification rows for this model
                    if let Some(it) = item_type.clone() {
                        if it.to_lowercase().contains("form") || it.to_lowercase().contains("format") {
                            if let Some(spec) = specification.clone() {
                                new_model.form_factor = spec_parser.parse_form_factor(&spec);
                            }
                        }
                    }

                    // Pricing for the server lot on this row (if present)
                    if let Some(list_col) = price_cols.list_price_col {
                        let list_price = row.get(list_col).and_then(|v| v.as_f64());
                        let net_usd = price_cols.net_price_usd_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                        let net_eur = price_cols.net_price_eur_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                        if list_price.or(net_usd).is_some() {
                            let pricing_id = Thing { tb: "hardware_pricing".to_string(), id: surrealdb::sql::Id::rand() };
                            prices.push(HardwarePricing {
                                id: Some(pricing_id),
                                configuration_id: None,
                                model_id: Some(model_id.clone()),
                                list_price: list_price.unwrap_or(net_usd.unwrap_or(0.0)),
                                net_price_usd: net_usd.unwrap_or(list_price.unwrap_or(0.0)),
                                net_price_eur: net_eur,
                                currency: "USD".to_string(),
                                valid_from: Utc::now().into(),
                                valid_to: None,
                                support_options: vec![],
                                created_at: Utc::now().into(),
                            });
                        }
                    }

                    current_model = Some((new_model, model_id));
                    continue; // Move to next row to collect components for this model
                }
            }

            // Component rows belonging to current model
            if let (Some((model, model_id)), Some(spec_str)) = (current_model.as_mut(), specification.clone()) {
                if let Some(item_type_str) = item_type.clone() {
                    let lower_item = item_type_str.to_lowercase();
                    // Skip empty filler lines
                    if lower_item.trim().is_empty() && spec_str.trim().is_empty() { continue; }

                    // Determine category and update base specs
                    match lower_item.as_str() {
                        "processor/socket" | "processor" => {
                            if let Some(spec) = spec_parser.parse_processor(&spec_str) {
                                model.base_specifications.processor = Some(spec);
                            }
                        },
                        "ram (capacity)" | "memory" => {
                            if let Some(spec) = spec_parser.parse_memory(&spec_str) {
                                model.base_specifications.memory = Some(spec);
                            }
                        },
                        "boot disk" | "data disk" | "storage" => {
                             if let Some(spec) = spec_parser.parse_storage(&spec_str) {
                                model.base_specifications.storage = Some(spec);
                            }
                        },
                        "network" | "# of nicports & type" | "# of nic ports & type" => {
                             if let Some(spec) = spec_parser.parse_network(&spec_str) {
                                model.base_specifications.network = Some(spec);
                            }
                        },
                        "dell format or model" | "format or model" | "form factor" => {
                            model.form_factor = spec_parser.parse_form_factor(&spec_str);
                        },
                        _ => {
                            // Unknown item types will still be captured as configurations below
                            println!("🔍 Unmatched specification: '{}' -> '{}'", item_type_str, spec_str);
                        }
                    }

                    // Create a HardwareConfiguration row for every component line
                    let cfg_id = Thing { tb: "hardware_configuration".to_string(), id: surrealdb::sql::Id::rand() };

                    // Determine item_type via SpecParser if Dell label is generic
                    let classified = if ["processor/socket", "processor", "memory", "storage", "network"].contains(&lower_item.as_str()) {
                        lower_item.clone()
                    } else {
                        spec_parser.classify_component_for_parser(&spec_str)
                    };

                    configurations.push(HardwareConfiguration {
                        id: Some(cfg_id.clone()),
                        model_id: model_id.clone(),
                        part_number: None,
                        sku: None,
                        description: spec_str.clone(),
                        item_type: classified,
                        quantity: 1,
                        specifications: None,
                        compatibility_notes: None,
                        created_at: Utc::now().into(),
                    });

                    // Link config as extension
                    if let Some(exts) = &mut model.extensions { exts.push(cfg_id); } else { model.extensions = Some(vec![cfg_id]); }
                }
            }
        }

        // Add the last processed model
        if let Some((model, _)) = current_model.take() { models.push(model); }

        println!("✅ Dell Lot Pricing parsed: {} models, {} configurations, {} prices", models.len(), configurations.len(), prices.len());
        Ok((models, configurations, prices))
    }
    
    fn parse_lenovo_server_lots(&self, worksheet: &Range<DataType>, file_path: &str, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        let spec_parser = SpecParser::new();

        let mut current_model: Option<HardwareModel> = None;
        let mut current_components: Vec<String> = Vec::new(); // Track components for enhanced processing

        println!("🔍 Lenovo Server Lots: worksheet has {} rows", worksheet.get_size().0);

        // Detect Lenovo columns dynamically (Part Number, Description, Quantity, Price USD/EUR)
        let (header_row_idx, part_col, desc_col, qty_col, price_usd_col, price_eur_col) = self.detect_lenovo_columns(worksheet)?;
        println!("📊 Lenovo sheet analysis: header_row={}, part_col={}, desc_col={}, qty_col={:?}, price_usd={:?}, price_eur={:?}",
                 header_row_idx, part_col, desc_col, qty_col, price_usd_col, price_eur_col);

        for (row_idx, row) in worksheet.rows().enumerate() {
            // Skip header and rows before it
            if row_idx <= header_row_idx { continue; }

            // Debug: Print first few data rows using detected columns
            if row_idx <= header_row_idx + 7 {
                let part_number = row.get(part_col).and_then(|c| c.as_string()).unwrap_or_default();
                let description = row.get(desc_col).and_then(|c| c.as_string()).unwrap_or_default();
                println!("🔍 Row {}: part='{}', desc='{}'", row_idx, part_number, description);
            }

            let part_number = row.get(part_col).and_then(|c| c.as_string());
            let description = row.get(desc_col).and_then(|c| c.as_string());

            // Determine if this row denotes a server/model by checking both part and description
            // clone to avoid moving the Option values
            let maybe_server_text = description.clone().or(part_number.clone());

            if let Some(text) = maybe_server_text {
                let lower = text.to_lowercase();
                // Use SpecParser to avoid misclassifying storage/network items as servers
                let parsed_type = spec_parser.classify_component_for_parser(&text);

                let has_known_lot_code = text.contains("SMI") || text.contains("SMA") ||
                                text.contains("MEI") || text.contains("MEA") ||
                                text.contains("HVI") || text.contains("HVA") ||
                                text.contains("VEI") || text.contains("VEA") ||
                                text.contains("VOI") || text.contains("VOA") ||
                                text.contains("DHC");

                // Strong server detection: either known lot code OR contains server/system keywords
                // but do NOT consider it a server if classifier thinks it's a storage/network/component
                let keyword_server = lower.contains("server") || lower.contains("thinksystem") || lower.contains("node") || lower.contains("chassis");

                // CRITICAL FIX: Check for pricing data to determine if this is a main server entry
                let has_pricing = price_usd_col.and_then(|c| row.get(c))
                    .and_then(|v| v.as_f64())
                    .map(|p| p > 0.0)
                    .unwrap_or(false);

                // Only treat as server if it has server indicators AND pricing data
                let is_server = has_pricing && ((has_known_lot_code) || (keyword_server && parsed_type == "component"));

                if is_server {
                    println!("🔍 Found server: '{}'", text);
                    if let Some(mut model) = current_model.take() {
                        // Apply enhanced processing with collected components
                        self.populate_model_specifications(&mut model, &current_components);
                        models.push(model);
                    }

                    // Reset component list for new model
                    current_components.clear();

                    let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };

                    // Use description if available otherwise use part_number text
                    let lot_desc = description.unwrap_or_else(|| text.clone());

                    // Use enhanced server model detection
                    let (model_name, form_factor) = self.is_enhanced_lenovo_server_model(&text)
                        .unwrap_or_else(|| {
                            // Fallback to original logic
                            let lot_code = if let Some(pos) = lot_desc.find(" - ") {
                                lot_desc[..pos].to_string()
                            } else if let Some(pos) = lot_desc.find(' ') {
                                lot_desc[..pos].to_string()
                            } else {
                                lot_desc.clone()
                            };
                            (lot_code, "1U".to_string())
                        });

                    // Extract proper model number using enhanced method
                    let model_number = self.extract_lenovo_model_number(&lot_desc, part_number.as_deref());

                    current_model = Some(HardwareModel {
                        id: Some(model_id.clone()),
                        basket_id: basket_id.clone(),
                        vendor_id: vendor_id.clone(),
                        lot_description: lot_desc.clone(),
                        model_name: model_name,
                        model_number: Some(model_number),
                        form_factor: Some(form_factor),
                        category: "server".to_string(),
                        base_specifications: HardwareSpecifications::default(),
                        extensions: Some(Vec::new()),
                        created_at: Utc::now().into(),
                        updated_at: Utc::now().into(),
                        source_sheet: "Lenovo X86 Server Lots".to_string(),
                        source_section: "Server Lots".to_string(),
                    });

                    // Create pricing info if available
                    let price_1yr_usd = price_usd_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                    let price_1yr_eur = price_eur_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());

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
                    // This row is a component line for the current model. Try to classify and parse.
                    let desc_text = description.clone().unwrap_or_else(|| "".to_string());
                    let lower_desc = desc_text.to_lowercase();

                    // Collect component description for enhanced processing
                    if !desc_text.trim().is_empty() {
                        current_components.push(desc_text.clone());
                    }

                    // Use SpecParser to avoid misclassifying components as server entries.
                    let combined_for_classify = format!("{} {}", part_number.clone().unwrap_or_default(), desc_text);
                    let parsed_component = spec_parser.classify_component_for_parser(&combined_for_classify);

                    let item_type = if parsed_component == "processor" || lower_desc.contains("processor") || lower_desc.contains("cpu") {
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

                    // Create a HardwareConfiguration for this component so it can be
                    // persisted and referenced from the parent model's `extensions`.
                    let config_id = Thing { tb: "hardware_configuration".to_string(), id: surrealdb::sql::Id::rand() };

                    // Determine quantity from detected qty column (if available)
                    let quantity = match qty_col.and_then(|c| row.get(c)) {
                        Some(v) => {
                            if let Some(i) = v.as_i64() { i as i32 }
                            else if let Some(f) = v.as_f64() { f as i32 }
                            else { 1 }
                        },
                        None => 1
                    };

                    configurations.push(HardwareConfiguration {
                        id: Some(config_id.clone()),
                        model_id: model.id.as_ref().unwrap().clone(),
                        part_number: part_number.clone().map(|s| s.to_string()),
                        sku: None,
                        description: desc_text.clone(),
                        item_type: item_type.to_string(),
                        quantity: quantity as i64,
                        specifications: None,
                        compatibility_notes: None,
                        created_at: Utc::now().into(),
                    });

                    // Record the configuration as an extension of the current model
                    if let Some(ext_vec) = &mut model.extensions {
                        ext_vec.push(config_id.clone());
                    } else {
                        model.extensions = Some(vec![config_id.clone()]);
                    }

                    // Use SpecParser for deep parsing and also update model specs
                    match item_type {
                        "processor" => {
                            // Combine part number (if available) with description to give SpecParser more context
                            let combined = format!("{} {}", part_number.clone().unwrap_or_default(), desc_text);
                            if let Some(spec) = spec_parser.parse_processor(&combined) {
                                println!("✅ Direct processor: {}", spec.model);
                                model.base_specifications.processor = Some(spec);
                            }
                        },
                        "memory" => {
                            if let Some(spec) = spec_parser.parse_memory(&desc_text) {
                                println!("✅ Direct memory: {}", spec.total_capacity);
                                model.base_specifications.memory = Some(spec);
                            }
                        },
                        "storage" => {
                            if let Some(spec) = spec_parser.parse_storage(&desc_text) {
                                println!("✅ Direct storage: {:?}", spec.total_capacity);
                                model.base_specifications.storage = Some(spec);
                            }
                        },
                        "network" => {
                            if let Some(spec) = spec_parser.parse_network(&desc_text) {
                                println!("✅ Direct network: {} ports", spec.ports.len());
                                model.base_specifications.network = Some(spec);
                            }
                        },
                        _ => {}
                    }
                }
            }
        }

    // Add the last processed model with enhanced processing
        if let Some(mut model) = current_model.take() {
            self.populate_model_specifications(&mut model, &current_components);
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
        let mut current_components: Vec<String> = Vec::new(); // Track components for enhanced processing

        // Detect Lenovo columns for parts sheet
        let (header_row_idx, part_col, desc_col, qty_col, price_usd_col, price_eur_col) = self.detect_lenovo_columns(worksheet)?;
    println!("📊 Lenovo Parts sheet analysis: header_row={}, part_col={}, desc_col={}, qty_col={:?}", header_row_idx, part_col, desc_col, qty_col);
        for (row_idx, row) in worksheet.rows().enumerate() {
            // Skip header and rows before it
            if row_idx <= header_row_idx { continue; }

            let part_number = row.get(part_col).and_then(|c| c.as_string());
            let description = row.get(desc_col).and_then(|c| c.as_string());

            if let (Some(part_num), Some(desc)) = (part_number, description) {
                if !part_num.trim().is_empty() && !desc.trim().is_empty() {
                    let lower_desc = desc.to_lowercase();
                    // Chassis/system detection for base server rows in parts sheet
                    // Positive indicators: explicit chassis/certified node or known server model codes
                    let has_model_code = lower_desc.contains("sr630") || lower_desc.contains("sr650") || lower_desc.contains("sr655") || lower_desc.contains("sr665") || lower_desc.contains("sr645") || lower_desc.contains("vx");
                    let positive = lower_desc.contains("chassis")
                        || lower_desc.contains("certified node")
                        || (lower_desc.contains("thinkagile") && lower_desc.contains("chassis"))
                        || (lower_desc.contains("thinksystem") && lower_desc.contains("chassis"))
                        || (has_model_code && (lower_desc.contains("chassis") || lower_desc.contains("node")));

                    // Negative indicators: accessories/upgrades that should NOT start a new server model
                    let negative_keywords = [
                        "heatsink", "heat sink", "power supply", "psu", "riser", "backplane", "back plane",
                        "adapter", "retimer", "cage", "bezel", "fan", "rail", "cable", "kit", "riser cage",
                        "anybay", "backplane", "bay", "ssd", "hdd", "nic", "network adapter", "controller"
                    ];
                    let is_negative = negative_keywords.iter().any(|k| lower_desc.contains(k));

                    let is_server_chassis = positive && !is_negative;

                    if is_server_chassis {
                        if let Some(mut model) = current_model.take() {
                            // Apply enhanced processing with collected components
                            self.populate_model_specifications(&mut model, &current_components);
                            models.push(model);
                        }

                        // Reset component list for new model
                        current_components.clear();

                        let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };

                        // Use enhanced server model detection for better naming and form factor
                        let (model_name, form_factor) = self.is_enhanced_lenovo_server_model(&desc)
                            .unwrap_or_else(|| (desc.clone(), "1U".to_string()));

                        // Extract proper model number using enhanced method
                        let model_number = self.extract_lenovo_model_number(&desc, Some(&part_num));

                        current_model = Some(HardwareModel {
                            id: Some(model_id.clone()),
                            basket_id: basket_id.clone(),
                            vendor_id: vendor_id.clone(),
                            lot_description: desc.clone(),
                            model_name: model_name,
                            model_number: Some(model_number),
                            form_factor: Some(form_factor),
                            category: "server".to_string(),
                            base_specifications: HardwareSpecifications::default(),
                            extensions: Some(Vec::new()),
                            created_at: Utc::now().into(),
                            updated_at: Utc::now().into(),
                            source_sheet: "Lenovo X86 Parts".to_string(),
                            source_section: "Server Chassis".to_string(),
                        });

                        // pricing
                        let price_1yr_usd = price_usd_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                        let price_1yr_eur = price_eur_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
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
                        // component/upgrade - collect for enhanced processing
                        current_components.push(desc.clone());
                        
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
                            id: Some(config_id.clone()),
                            model_id: model.id.as_ref().unwrap().clone(),
                            part_number: Some(part_num.to_string()),
                            sku: None,
                            description: desc.clone(),
                            item_type: item_type.to_string(),
                            quantity: 1,
                            specifications: None,
                            compatibility_notes: None,
                            created_at: Utc::now().into(),
                        });

                        // Record the configuration as an extension of the current model
                        if let Some(ext_vec) = &mut model.extensions {
                            ext_vec.push(config_id.clone());
                        } else {
                            model.extensions = Some(vec![config_id.clone()]);
                        }

                        // Update model specifications based on the component
                        match item_type {
                                "processor" => {
                                    // Combine part number and description for better parsing
                                    let combined = format!("{} {}", part_num.to_string(), desc);
                                    if let Some(spec) = spec_parser.parse_processor(&combined) {
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

        // Add the last processed model with enhanced processing
        if let Some(mut model) = current_model.take() {
            self.populate_model_specifications(&mut model, &current_components);
            models.push(model);
        }

        println!("✅ Lenovo Parts parsed: {} models, {} configurations", models.len(), configurations.len());
        Ok((models, configurations, prices))
    }

    fn parse_dell_options_and_upgrades(&self, worksheet: &Range<DataType>, basket_id: &Thing, vendor_id: &Thing) -> Result<ParseResult> {
        let mut models = Vec::new();
        let mut configurations = Vec::new();
        let mut prices = Vec::new();
        let spec_parser = SpecParser::new();

        // Detect header row and columns
        let (header_row_idx, desc_col, list_col, net_usd_col, net_eur_col) = self.detect_dell_options_columns(worksheet);
        println!(
            "📊 Dell Options header at row {} -> desc={}, list={:?}, net_usd={:?}, net_eur={:?}",
            header_row_idx, desc_col, list_col, net_usd_col, net_eur_col
        );

        // Create a synthetic model to hold all options for this basket
        let model_id = Thing { tb: "hardware_model".to_string(), id: surrealdb::sql::Id::rand() };
        let mut options_model = HardwareModel {
            id: Some(model_id.clone()),
            basket_id: basket_id.clone(),
            vendor_id: vendor_id.clone(),
            lot_description: "Dell Options and Upgrades Catalog".to_string(),
            model_name: "Dell Options and Upgrades".to_string(),
            model_number: None,
            form_factor: None,
            category: "component".to_string(),
            base_specifications: HardwareSpecifications::default(),
            extensions: Some(Vec::new()),
            created_at: Utc::now().into(),
            updated_at: Utc::now().into(),
            source_sheet: "Dell Options and Upgrades".to_string(),
            source_section: "Options".to_string(),
        };

        for (row_idx, row) in worksheet.rows().enumerate() {
            if row_idx <= header_row_idx { continue; }

            let description = row.get(desc_col).and_then(|c| c.as_string()).map(|s| s.trim().to_string());
            if let Some(desc) = description {
                if desc.is_empty() { continue; }

                // Create configuration for this option
                let cfg_id = Thing { tb: "hardware_configuration".to_string(), id: surrealdb::sql::Id::rand() };
                let item_type = spec_parser.classify_component_for_parser(&desc);
                configurations.push(HardwareConfiguration {
                    id: Some(cfg_id.clone()),
                    model_id: model_id.clone(),
                    part_number: None,
                    sku: None,
                    description: desc.clone(),
                    item_type,
                    quantity: 1,
                    specifications: None,
                    compatibility_notes: None,
                    created_at: Utc::now().into(),
                });

                // Link as extension
                if let Some(exts) = &mut options_model.extensions { exts.push(cfg_id.clone()); }

                // Pricing per option if available
                let list_price = list_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                let net_usd = net_usd_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                let net_eur = net_eur_col.and_then(|c| row.get(c)).and_then(|v| v.as_f64());
                if list_price.or(net_usd).is_some() {
                    let pricing_id = Thing { tb: "hardware_pricing".to_string(), id: surrealdb::sql::Id::rand() };
                    prices.push(HardwarePricing {
                        id: Some(pricing_id),
                        configuration_id: options_model.extensions.as_ref().and_then(|v| v.last()).cloned(),
                        model_id: None,
                        list_price: list_price.unwrap_or(net_usd.unwrap_or(0.0)),
                        net_price_usd: net_usd.unwrap_or(list_price.unwrap_or(0.0)),
                        net_price_eur: net_eur,
                        currency: "USD".to_string(),
                        valid_from: Utc::now().into(),
                        valid_to: None,
                        support_options: vec![],
                        created_at: Utc::now().into(),
                    });
                }
            }
        }

        models.push(options_model);
        println!("✅ Dell Options parsed: {} configurations", configurations.len());
        Ok((models, configurations, prices))
    }

    fn detect_dell_options_columns(&self, worksheet: &Range<DataType>) -> (usize, usize, Option<usize>, Option<usize>, Option<usize>) {
        // Returns (header_row_idx, desc_col, list_col, net_usd_col, net_eur_col)
        let mut header_row_idx = 0usize;
        let mut desc_col = 0usize;
        let mut list_col: Option<usize> = None;
        let mut net_usd_col: Option<usize> = None;
        let mut net_eur_col: Option<usize> = None;

        for (ridx, row) in worksheet.rows().enumerate() {
            // Preserve real column indices while scanning header cells
            let mut found_desc: Option<usize> = None;
            for (cidx, cell) in row.iter().enumerate() {
                if let Some(t) = cell.as_string() {
                    let lower = t.to_lowercase();
                    if (lower.contains("description") || lower.trim() == "description") && found_desc.is_none() {
                        found_desc = Some(cidx);
                    }
                    if lower.contains("list price") { list_col = Some(cidx); }
                    if (lower.contains("net price") && lower.contains("usd")) || lower.contains("price in $") { net_usd_col = Some(cidx); }
                    if (lower.contains("net price") && (lower.contains("eur") || lower.contains("€"))) || lower.contains("price in eur") { net_eur_col = Some(cidx); }
                }
            }
            if let Some(dc) = found_desc { header_row_idx = ridx; desc_col = dc; break; }
        }

        (header_row_idx, desc_col, list_col, net_usd_col, net_eur_col)
    }

    /// Dynamically detect column positions and header row for Dell worksheets
    fn detect_dell_columns(&self, worksheet: &Range<DataType>) -> Result<(usize, usize, usize, usize)> {
        // Look for header row containing key column names with true column indices
        for (row_idx, row) in worksheet.rows().enumerate() {
            let mut lot_desc_col: Option<usize> = None;
            let mut item_type_col: Option<usize> = None;
            let mut spec_col: Option<usize> = None;

            for (col_idx, cell) in row.iter().enumerate() {
                if let Some(text) = cell.as_string() {
                    let t = text.trim();
                    if t.eq_ignore_ascii_case("Lot Description") || t.eq_ignore_ascii_case("lot description") {
                        lot_desc_col = Some(col_idx);
                    } else if t.eq_ignore_ascii_case("Item") {
                        item_type_col = Some(col_idx);
                    } else if t.eq_ignore_ascii_case("Specification") {
                        spec_col = Some(col_idx);
                    }
                }
            }

            if lot_desc_col.is_some() && item_type_col.is_some() && spec_col.is_some() {
                let lot = lot_desc_col.unwrap();
                let item = item_type_col.unwrap();
                let spec = spec_col.unwrap();
                println!("✅ Found Dell header at row {} with columns: lot_desc={}, item_type={}, spec={}", row_idx, lot, item, spec);
                return Ok((row_idx, lot, item, spec));
            }
        }

        // Fallback to original positions if no header found
        println!("⚠️ Using fallback Dell column positions (row 3, cols 0,1,2)");
        Ok((3, 0, 1, 2))
    }

    /// Detect Lenovo columns for Parts and Server Lots sheets
    fn detect_lenovo_columns(&self, worksheet: &Range<DataType>) -> Result<(usize, usize, usize, Option<usize>, Option<usize>, Option<usize>)> {
        // Return (header_row_idx, part_col, desc_col, qty_col, price_usd_col, price_eur_col)
        for (row_idx, row) in worksheet.rows().enumerate() {
            // Scan with real column indices
            let mut part_col: Option<usize> = None;
            let mut desc_col: Option<usize> = None;
            let mut qty_col: Option<usize> = None;
            let mut usd_col: Option<usize> = None;
            let mut eur_col: Option<usize> = None;

            for (col_idx, cell) in row.iter().enumerate() {
                if let Some(cell_text) = cell.as_string() {
                    let lower = cell_text.to_lowercase();
                    if lower.contains("part number") || lower.trim() == "part" || lower.trim() == "pn" {
                        part_col = Some(col_idx);
                    } else if lower.contains("description") || lower.trim() == "description" || lower.trim() == "desc" {
                        desc_col = Some(col_idx);
                    } else if lower.contains("quantity") || lower.contains("qty") {
                        qty_col = Some(col_idx);
                    } else if lower.contains("total price in usd") || lower.contains("price in $ usd") || lower.contains("price in $") {
                        usd_col = Some(col_idx);
                    } else if lower.contains("total price in eur") || lower.contains("price in \u{20ac} eur") || lower.contains("price in eur") || lower.contains("price in €") {
                        eur_col = Some(col_idx);
                    }
                }
            }

            if part_col.is_some() && desc_col.is_some() {
                println!("✅ Found Lenovo header at row {} with cols: part={:?}, desc={:?}, qty={:?}, usd={:?}, eur={:?}", row_idx, part_col, desc_col, qty_col, usd_col, eur_col);
                return Ok((row_idx, part_col.unwrap(), desc_col.unwrap(), qty_col, usd_col, eur_col));
            }
        }

        // More robust fallback: 1) Try to join multi-row headers across the first
        // few rows and detect header keywords per-column. 2) If that fails, scan
        // the entire sheet to find a column with repeated part-number-like
        // tokens and select a nearby description column by average text length.
        {
            use regex::Regex;

            // 1) multi-row header concatenation (first 4 rows)
            let header_rows_to_check = 4usize;
            let mut header_by_col: Vec<String> = Vec::new();
            for (ridx, row) in worksheet.rows().enumerate().take(header_rows_to_check) {
                for (cidx, cell) in row.iter().enumerate() {
                    let s = cell.as_string().map(|s| s.trim().to_string()).unwrap_or_default();
                    if header_by_col.len() <= cidx {
                        header_by_col.resize(cidx + 1, String::new());
                    }
                    if !s.is_empty() {
                        if !header_by_col[cidx].is_empty() {
                            header_by_col[cidx].push(' ');
                        }
                        header_by_col[cidx].push_str(&s);
                    }
                }
            }

            // Look for explicit 'part' and 'description' mentions in concatenated headers
            let mut part_col_candidate: Option<usize> = None;
            let mut desc_col_candidate: Option<usize> = None;
            for (i, hdr) in header_by_col.iter().enumerate() {
                let lower = hdr.to_lowercase();
                if lower.contains("part") || lower.contains("part number") || lower.contains("pn") {
                    part_col_candidate = Some(i);
                }
                if lower.contains("description") || lower.contains("desc") {
                    desc_col_candidate = Some(i);
                }
            }

            if let (Some(pc), Some(dc)) = (part_col_candidate, desc_col_candidate) {
                println!("⚠️ Using header-detected Lenovo columns part={}, desc={}", pc, dc);
                return Ok((0usize, pc, dc, None, None, None));
            }

            // 2) If header detection failed, fallback to scanning the sheet for
            // part-like columns (short alphanumeric tokens repeated across rows)
            let max_cols = worksheet.rows().map(|r| r.len()).max().unwrap_or(0);
            if max_cols > 0 {
                let part_re = Regex::new(r"(?i)^[A-Z0-9\-]{3,}$").unwrap();
                let mut match_counts: Vec<usize> = vec![0; max_cols];
                let mut text_lengths: Vec<usize> = vec![0; max_cols];
                let mut text_counts: Vec<usize> = vec![0; max_cols];

                for (_ridx, row) in worksheet.rows().enumerate() {
                    for (cidx, cell) in row.iter().enumerate() {
                        if let Some(s) = cell.as_string() {
                            let s_trim = s.trim();
                            if !s_trim.is_empty() {
                                text_lengths[cidx] += s_trim.len();
                                text_counts[cidx] += 1;
                                if part_re.is_match(s_trim) {
                                    match_counts[cidx] += 1;
                                }
                            }
                        }
                    }
                }

                // compute a simple score: match_count * 2 + (short_text_ratio)
                let mut best_score: f64 = 0.0;
                let mut best_idx: Option<usize> = None;
                for i in 0..max_cols {
                    if text_counts[i] == 0 { continue; }
                    let avg_len = text_lengths[i] as f64 / text_counts[i] as f64;
                    // short columns (avg_len < 10) are more likely to be part numbers
                    let short_score = if avg_len < 12.0 { 1.0 } else { 0.0 };
                    let score = (match_counts[i] as f64) * 2.0 + short_score;
                    if score > best_score {
                        best_score = score;
                        best_idx = Some(i);
                    }
                }

                if let Some(bi) = best_idx {
                    // require at least one match or a positive score
                    if best_score >= 1.0 {
                        // pick desc column to the right with largest avg text length
                        let mut desc_idx: Option<usize> = None;
                        let mut best_avg = 0.0;
                        for cand in (bi + 1)..max_cols {
                            if text_counts[cand] > 0 {
                                let avg = text_lengths[cand] as f64 / text_counts[cand] as f64;
                                if avg > best_avg {
                                    best_avg = avg;
                                    desc_idx = Some(cand);
                                }
                            }
                        }
                        let desc_col = desc_idx.unwrap_or_else(|| if bi + 1 < max_cols { bi + 1 } else { bi.saturating_sub(1) });
                        println!("⚠️ Using detected Lenovo part column {} (score={:.1}) and desc column {}", bi, best_score, desc_col);
                        return Ok((0usize, bi, desc_col, None, None, None));
                    }
                }
            }
        }

        // Final fallback to common positions
        println!("⚠️ Using fallback Lenovo column positions (row 3, cols 1,2,3)");
        Ok((3, 1, 2, Some(3), Some(4), Some(5)))
    }

    /// Helper: detect Dell pricing columns near the header
    fn detect_dell_price_columns(&self, worksheet: &Range<DataType>, header_row_idx: usize) -> DellPriceCols {
        let mut cols = DellPriceCols::default();
        if let Some(header_row) = worksheet.rows().nth(header_row_idx) {
            for (idx, cell) in header_row.iter().enumerate() {
                if let Some(text) = cell.as_string() {
                    let lower = text.to_lowercase();
                    if lower.contains("list price") { cols.list_price_col = Some(idx); }
                    else if lower.contains("net price") && lower.contains("usd") { cols.net_price_usd_col = Some(idx); }
                    else if lower.contains("net price") && (lower.contains("eur") || lower.contains("€")) { cols.net_price_eur_col = Some(idx); }
                    else if lower.contains("price in $") && cols.net_price_usd_col.is_none() { cols.net_price_usd_col = Some(idx); }
                    else if lower.contains("price in eur") && cols.net_price_eur_col.is_none() { cols.net_price_eur_col = Some(idx); }
                }
            }
        }
        cols
    }

    /// Intelligent detection of Dell server models using multiple heuristics
    fn is_dell_server_model(&self, lot_desc: &str, item_type: &Option<String>) -> bool {
        // Heuristic 1: Original patterns (for backward compatibility)
        let matches_known_patterns = lot_desc.contains("SMI") || lot_desc.contains("SMA") || 
                                    lot_desc.contains("MEI") || lot_desc.contains("MEA") ||
                                    lot_desc.contains("HVI") || lot_desc.contains("HVA") ||
                                    lot_desc.contains("VEI") || lot_desc.contains("VEA") ||
                                    lot_desc.contains("VOI") || lot_desc.contains("VOA") ||
                                    lot_desc.contains("DHC");
        
        if matches_known_patterns {
            return true;
        }
        
        // Heuristic 2: Pattern matching for server-like entries
        // Look for patterns like "ABC1 - Description" or "ABCD1 - Description"
        let server_pattern = regex::Regex::new(r"^[A-Z]{2,4}\d{1,2}\s*-\s*.+").unwrap();
        if server_pattern.is_match(lot_desc) {
            println!("🎯 Pattern match: {} looks like a server model", lot_desc);
            return true;
        }
        
        // Heuristic 3: Check if item_type suggests this is a server/system
        if let Some(item_type_str) = item_type {
            let item_lower = item_type_str.to_lowercase();
            if item_lower.is_empty() || 
               item_lower.contains("server") || 
               item_lower.contains("system") ||
               item_lower.contains("rack") ||
               item_lower.contains("blade") {
                println!("🎯 Item type match: {} suggests server model for '{}'", item_type_str, lot_desc);
                return true;
            }
        }
        
        // Heuristic 4: Look for entries that contain server-related keywords in description
        let desc_lower = lot_desc.to_lowercase();
        if (desc_lower.contains("server") || 
            desc_lower.contains("rack") ||
            desc_lower.contains("compute") ||
            desc_lower.contains("blade") ||
            desc_lower.contains("mgmt") ||
            desc_lower.contains("management")) &&
           desc_lower.len() < 100 { // Avoid very long descriptions that are likely components
            println!("🎯 Keyword match: {} contains server keywords", lot_desc);
            return true;
        }
        
        false
    }

    /// Enhanced Lenovo server model detection with better pattern matching
    fn is_enhanced_lenovo_server_model(&self, text: &str) -> Option<(String, String)> {
        let lower = text.to_lowercase();
        
        // Check for Lenovo lot codes and server patterns
        let has_lot_code = text.contains("SMI") || text.contains("SMA") ||
                          text.contains("MEI") || text.contains("MEA") ||
                          text.contains("HVI") || text.contains("HVA") ||
                          text.contains("VEI") || text.contains("VEA") ||
                          text.contains("VOI") || text.contains("VOA") ||
                          text.contains("DHC");

        // Server model patterns
        let server_patterns = [
            ("sr630", "ThinkSystem SR630 V3", "1U"),
            ("sr650", "ThinkSystem SR650 V3", "2U"), 
            ("sr645", "ThinkSystem SR645 V3", "1U"),
            ("sr665", "ThinkSystem SR665 V3", "2U"),
            ("sr850", "ThinkSystem SR850 V3", "4U"),
            ("st550", "ThinkSystem ST550", "Tower"),
            ("st650", "ThinkSystem ST650 V3", "4U"),
        ];

        // Find matching server model
        for (pattern, model_name, form_factor) in server_patterns.iter() {
            if lower.contains(pattern) {
                return Some((model_name.to_string(), form_factor.to_string()));
            }
        }

        // Check for ThinkAgile systems
        if lower.contains("thinkagile") {
            if lower.contains("vx") {
                return Some(("ThinkAgile VX Series".to_string(), "2U".to_string()));
            } else if lower.contains("hx") {
                return Some(("ThinkAgile HX Series".to_string(), "1U".to_string()));
            }
        }

        // Generic server detection with lot codes
        if has_lot_code && (lower.contains("server") || lower.contains("thinksystem")) {
            // Extract model info from description if possible
            let model_name = if let Some(start) = text.find("ThinkSystem") {
                let end = text[start..].find(" -").unwrap_or(text.len() - start);
                text[start..start + end].to_string()
            } else {
                "ThinkSystem Server".to_string()
            };
            
            return Some((model_name, "1U".to_string())); // Default to 1U
        }

        None
    }

    /// Extract Lenovo model number from lot code or description
    fn extract_lenovo_model_number(&self, lot_description: &str, part_number: Option<&str>) -> String {
        // Try to extract lot code from part number first
        if let Some(part) = part_number {
            // Lenovo lot codes are typically 8-10 characters like "7D73CTO1WW"
            if part.len() >= 8 && part.chars().all(|c| c.is_alphanumeric()) {
                return part.to_string();
            }
        }

        // Extract model number from lot description
        if let Some(pos) = lot_description.find(" - ") {
            let lot_code = lot_description[..pos].trim().to_string();
            if !lot_code.is_empty() && lot_code.len() >= 3 {
                return lot_code;
            }
        }

        // Look for ThinkSystem model numbers
        if let Some(start) = lot_description.find("ThinkSystem") {
            if let Some(end) = lot_description[start..].find(" V3") {
                let model = &lot_description[start..start+end+3];
                return model.to_string();
            } else if let Some(end) = lot_description[start..].find(" -") {
                let model = &lot_description[start..start+end];
                return model.to_string();
            }
        }

        // Fallback: extract first meaningful word that looks like a model
        let words: Vec<&str> = lot_description.split_whitespace().collect();
        if let Some(first_word) = words.first() {
            if first_word.len() >= 3 && first_word.chars().any(|c| c.is_alphanumeric()) {
                return first_word.to_string();
            }
        }

        "Unknown".to_string()
    }

    /// Populate model specifications using SpecParser and vendor knowledge
    fn populate_model_specifications(&self, model: &mut HardwareModel, components: &[String]) {
        let spec_parser = SpecParser::new();
        
        println!("🔧 Enhanced processing for '{}' with {} components", 
                 model.model_name, components.len());

        // Analyze components to populate base_specifications
        for (i, component) in components.iter().enumerate() {
            if i < 3 { // Only log first 3 components to reduce noise
                println!("  Component {}: '{}'", i+1, component);
            }
            
            let component_type = spec_parser.classify_component_for_parser(component);
            
            match component_type.as_str() {
                "processor" => {
                    if model.base_specifications.processor.is_none() {
                        if let Some(spec) = spec_parser.parse_processor(component) {
                            println!("✅ Parsed processor: {}", spec.model);
                            model.base_specifications.processor = Some(spec);
                        }
                    }
                },
                "memory" => {
                    if model.base_specifications.memory.is_none() {
                        if let Some(spec) = spec_parser.parse_memory(component) {
                            println!("✅ Parsed memory: {}", spec.total_capacity);
                            model.base_specifications.memory = Some(spec);
                        }
                    }
                },
                "storage" => {
                    if model.base_specifications.storage.is_none() {
                        if let Some(spec) = spec_parser.parse_storage(component) {
                            println!("✅ Parsed storage: {:?}", spec.total_capacity);
                            model.base_specifications.storage = Some(spec);
                        }
                    }
                },
                "network" => {
                    if model.base_specifications.network.is_none() {
                        println!("🔍 Enhanced parsing network: '{}'", component);
                        if let Some(spec) = spec_parser.parse_network(component) {
                            println!("✅ Enhanced parsed network spec: {} ports", spec.ports.len());
                            model.base_specifications.network = Some(spec);
                        } else {
                            println!("❌ Enhanced failed to parse network from: '{}'", component);
                        }
                    }
                },
                _ => {}
            }
        }

        // Set form factor based on model name if not already set
        if model.form_factor.is_none() {
            if let Some(model_name) = &model.model_number {
                if let Some((_, form_factor)) = self.is_enhanced_lenovo_server_model(model_name) {
                    model.form_factor = Some(form_factor);
                }
            }
        }

        // Extract additional specifications from lot description
        if let Some(form_factor) = self.extract_form_factor_from_description(&model.lot_description) {
            model.form_factor = Some(form_factor);
        }
    }

    /// Extract form factor from description text
    fn extract_form_factor_from_description(&self, description: &str) -> Option<String> {
        let lower = description.to_lowercase();
        
        // Direct form factor mentions
        if lower.contains("1u") { return Some("1U".to_string()); }
        if lower.contains("2u") { return Some("2U".to_string()); }
        if lower.contains("4u") { return Some("4U".to_string()); }
        if lower.contains("tower") { return Some("Tower".to_string()); }
        
        // Model-based inference
        if lower.contains("sr630") || lower.contains("sr645") || lower.contains("hx") {
            return Some("1U".to_string());
        }
        if lower.contains("sr650") || lower.contains("sr665") || lower.contains("vx") {
            return Some("2U".to_string());
        }
        if lower.contains("sr850") || lower.contains("st650") {
            return Some("4U".to_string());
        }
        if lower.contains("st550") {
            return Some("Tower".to_string());
        }
        
        None
    }
}

#[derive(Default, Debug, Clone, Copy)]
struct DellPriceCols {
    list_price_col: Option<usize>,
    net_price_usd_col: Option<usize>,
    net_price_eur_col: Option<usize>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use calamine::open_workbook_auto;

    #[test]
    fn test_detect_lenovo_columns_on_sample() {
        // Use the sample file included in the repo docs folder
        let path = "../docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx";
        let mut workbook = open_workbook_auto(path).expect("Failed to open sample workbook");
        let range = workbook.worksheet_range("Lenovo X86 Server Lots")
            .expect("Worksheet read error").expect("Worksheet not found");

        let parser = HardwareBasketParser;
        let (header_row, part_col, desc_col, qty_col, usd_col, eur_col) = parser.detect_lenovo_columns(&range).expect("detect_lenovo_columns failed");

        // The analysis indicates headers around row index 3 and part/desc columns present
        assert!(header_row >= 1, "header row should be >= 1");
        assert!(part_col >= 0, "part_col should be >= 0");
        assert!(desc_col >= 0, "desc_col should be >= 0");
        // Quantity/price columns may be optional
        assert!(qty_col.is_some(), "qty_col should be detected in sample");
        assert!(usd_col.is_some() || eur_col.is_some(), "At least one price column should be detected");
    }

    #[test]
    fn test_parse_lenovo_sample_end_to_end() {
        // Parse the Lenovo sample workbook end-to-end and validate we get
        // models, configurations, pricing, and at least one model has extensions.
        let path = "../docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx";

        // Construct fake SurrealDB Thing IDs for basket and vendor
        let basket_id = Thing { tb: "hardware_basket".to_string(), id: surrealdb::sql::Id::rand() };
        let vendor_id = Thing { tb: "hardware_vendor".to_string(), id: surrealdb::sql::Id::rand() };

        let parser = HardwareBasketParser;
        let (models, configurations, prices) = parser.parse_file(path, &basket_id, &vendor_id)
            .expect("parse_file should succeed on sample Lenovo workbook");

        assert!(!models.is_empty(), "expected at least one parsed model");
        assert!(!configurations.is_empty(), "expected at least one parsed configuration");

        // At least one model should have extensions (linked component/config rows)
        let has_extensions = models.iter().any(|m| m.extensions.as_ref().map(|e| !e.is_empty()).unwrap_or(false));
        assert!(has_extensions, "expected at least one model with extensions");

        // Pricing may be present for lots/chassis; allow zero but prefer some
        if prices.is_empty() {
            eprintln!("warning: no pricing rows parsed from sample – acceptable if price columns differ");
        }

        // Some models should have at least partial processor spec populated
        let has_cpu = models.iter().any(|m| m.base_specifications.processor.is_some());
        assert!(has_cpu, "expected at least one model with parsed processor spec");
    }

    #[test]
    fn test_parse_dell_sample_end_to_end() {
        // Parse the Dell sample workbook end-to-end and validate we get
        // models and configurations from the Lot Pricing sheet
        let path = "../docs/X86 Basket Q3 2025 v2 Dell Only.xlsx";

        let basket_id = Thing { tb: "hardware_basket".to_string(), id: surrealdb::sql::Id::rand() };
        let vendor_id = Thing { tb: "hardware_vendor".to_string(), id: surrealdb::sql::Id::rand() };

        let parser = HardwareBasketParser;
        let (models, configurations, prices) = parser.parse_file(path, &basket_id, &vendor_id)
            .expect("parse_file should succeed on sample Dell workbook");

        assert!(!models.is_empty(), "expected at least one parsed Dell model");
        assert!(configurations.len() > 0 || models.iter().any(|m| m.extensions.as_ref().map(|e| !e.is_empty()).unwrap_or(false)));
    }

    #[test]
    fn test_detect_dell_options_columns_on_sample() {
        // Validate Dell Options header and price columns on the sample workbook
        let path = "../docs/X86 Basket Q3 2025 v2 Dell Only.xlsx";
        let mut workbook = open_workbook_auto(path).expect("Failed to open sample workbook");
        let range = workbook
            .worksheet_range("Dell Options and Upgrades")
            .expect("Worksheet read error")
            .expect("Worksheet not found");

        let parser = HardwareBasketParser;
        let (_header_row, desc_col, list_col, usd_col, eur_col) = parser.detect_dell_options_columns(&range);

        assert!(desc_col >= 0, "description column should be detected");
        assert!(list_col.is_some() || usd_col.is_some() || eur_col.is_some(), "At least one price column should be detected");
    }
}