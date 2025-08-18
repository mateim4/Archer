use calamine::{Reader, Xlsx, open_workbook};
use serde_json::json;
use surrealdb::sql::{Thing, Datetime};
use core_engine::models::hardware_basket::{HardwareModel, HardwareConfiguration, HardwarePricing as HardwarePrice};
use core_engine::hardware_parser::basket_parser_new::HardwareBasketParser;
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
    println!("🚀 Using Enhanced Hardware Basket Parser for {}", vendor);
    
    // Create enhanced parser instance
    let parser = HardwareBasketParser;
    let vendor_id = Thing { tb: "hardware_vendor".to_string(), id: uuid::Uuid::new_v4().to_string().into() };
    
    // Parse using the enhanced parser
    let (models, configurations, prices) = parser.parse_file(file_path, &basket_id, &vendor_id)
        .map_err(|e| anyhow!("Enhanced parser failed: {}", e))?;

    println!("✅ Enhanced parser completed: {} models, {} configurations, {} prices", 
             models.len(), configurations.len(), prices.len());

    // Map base_specifications to legacy fields for backward compatibility
    let enhanced_models = models.into_iter().map(|mut model| {
        // Debug: Check if base_specifications are populated
        println!("🔍 Model: {} - Processor: {:?}, Memory: {:?}, Network: {:?}", 
                 model.model_name, 
                 model.base_specifications.processor.is_some(),
                 model.base_specifications.memory.is_some(),
                 model.base_specifications.network.is_some());
        
        // Map base_specifications to legacy fields if needed
        populate_legacy_fields_from_base_specs(&mut model);
        model
    }).collect();

    Ok((enhanced_models, configurations, prices))
}

fn populate_legacy_fields_from_base_specs(model: &mut HardwareModel) {
    // Map processor specifications to legacy processor_info field
    if let Some(processor_spec) = &model.base_specifications.processor {
        let mut processor_parts = Vec::new();
        
        if processor_spec.count > 1 {
            processor_parts.push(format!("{}x", processor_spec.count));
        }
        processor_parts.push(processor_spec.model.clone());
        
        if let Some(cores) = processor_spec.core_count {
            processor_parts.push(format!("{}C", cores));
        }
        if let Some(threads) = processor_spec.thread_count {
            processor_parts.push(format!("{}T", threads));
        }
        if let Some(freq) = processor_spec.frequency_ghz {
            processor_parts.push(format!("{}GHz", freq));
        }
        if let Some(tdp) = processor_spec.tdp {
            processor_parts.push(format!("{}W", tdp));
        }
        
        // Note: The HardwareModel doesn't have processor_info field
        // This is handled by the legacy backend structure
    }
    
    // Map memory specifications to legacy ram_info field  
    if let Some(memory_spec) = &model.base_specifications.memory {
        let mut memory_parts = Vec::new();
        
        memory_parts.push(memory_spec.total_capacity.clone());
        memory_parts.push(memory_spec.memory_type.clone());
        
        if let Some(speed) = &memory_spec.speed {
            memory_parts.push(speed.clone());
        }
        if memory_spec.module_count > 1 {
            memory_parts.push(format!("({}x modules)", memory_spec.module_count));
        }
        
        // Note: The HardwareModel doesn't have ram_info field  
        // This is handled by the legacy backend structure
    }
    
    // Map network specifications to legacy network_info field
    if let Some(network_spec) = &model.base_specifications.network {
        let mut network_parts = Vec::new();
        
        for port in &network_spec.ports {
            network_parts.push(format!("{}x {} {}", port.count, port.speed, port.port_type));
        }
        
        if let Some(mgmt_ports) = &network_spec.management_ports {
            for mgmt_port in mgmt_ports {
                network_parts.push(format!("Management: {}x {} {}", mgmt_port.count, mgmt_port.speed, mgmt_port.port_type));
            }
        }
        
        // Note: The HardwareModel doesn't have network_info field
        // This is handled by the legacy backend structure  
    }
}
}
