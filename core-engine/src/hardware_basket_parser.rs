use crate::error::CoreEngineError;
use crate::Result;
use calamine::{Reader, Xlsx, open_workbook, DataType};
use std::path::Path;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareBasketItem {
    pub model: String,
    pub description: String,
    pub quantity: u32,
    pub unit_price: f64,
    pub total_price: f64,
    pub vendor: String,
    pub configuration: Option<String>,
    pub specifications: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareBasketData {
    pub items: Vec<HardwareBasketItem>,
    pub total_value: f64,
    pub currency: String,
    pub vendor: String,
    pub period: String,
}

pub struct HardwareBasketParser;

impl HardwareBasketParser {
    pub fn parse_file<P: AsRef<Path>>(file_path: P) -> Result<HardwareBasketData> {
        let mut workbook: Xlsx<_> = open_workbook(file_path)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to open Excel file: {}", e)))?;

        // Try to find the main data sheet
        let sheet_names = workbook.sheet_names().to_owned();
        println!("Available sheets: {:?}", sheet_names);

        // Look for common sheet names
        let data_sheet_name = sheet_names.iter()
            .find(|name| {
                let name_lower = name.to_lowercase();
                name_lower.contains("hardware") || 
                name_lower.contains("basket") || 
                name_lower.contains("items") ||
                name_lower.contains("data") ||
                name_lower == "sheet1"
            })
            .unwrap_or(&sheet_names[0]);

        println!("Using sheet: {}", data_sheet_name);

        let range = workbook.worksheet_range(data_sheet_name)
            .ok_or_else(|| CoreEngineError::parsing(format!("Worksheet '{}' not found", data_sheet_name)))?
            .map_err(|e| CoreEngineError::parsing(format!("Failed to read worksheet '{}': {}", data_sheet_name, e)))?;

        Self::parse_range(range)
    }

    fn parse_range(range: calamine::Range<DataType>) -> Result<HardwareBasketData> {
        let mut items = Vec::new();
        let mut headers = HashMap::new();
        let mut header_row_found = false;
        let mut total_value = 0.0;

        // Find header row and parse data
        for (row_idx, row) in range.rows().enumerate() {
            if !header_row_found {
                // Look for header row (contains common column names)
                let row_text: Vec<String> = row.iter()
                    .map(|cell| cell.to_string().to_lowercase())
                    .collect();

                if row_text.iter().any(|text| 
                    text.contains("model") || 
                    text.contains("part") || 
                    text.contains("description") ||
                    text.contains("qty") ||
                    text.contains("quantity") ||
                    text.contains("price")
                ) {
                    // Found header row
                    for (col_idx, cell) in row.iter().enumerate() {
                        let header = cell.to_string().to_lowercase();
                        headers.insert(col_idx, header);
                    }
                    header_row_found = true;
                    println!("Found headers: {:?}", headers);
                    continue;
                }
            } else {
                // Parse data row
                if let Some(item) = Self::parse_data_row(row, &headers) {
                    total_value += item.total_price;
                    items.push(item);
                }
            }
        }

        if items.is_empty() {
            return Err(CoreEngineError::parsing("No hardware items found in Excel file".to_string()));
        }

        Ok(HardwareBasketData {
            items,
            total_value,
            currency: "USD".to_string(), // Default, could be parsed from file
            vendor: "Unknown".to_string(), // Could be detected from data
            period: "Q3 2025".to_string(), // Could be parsed from filename or data
        })
    }

    fn parse_data_row(row: &[DataType], headers: &HashMap<usize, String>) -> Option<HardwareBasketItem> {
        let mut model = String::new();
        let mut description = String::new();
        let mut quantity = 1u32;
        let mut unit_price = 0.0f64;
        let mut total_price = 0.0f64;
        let mut vendor = "Unknown".to_string();
        let mut configuration = None;
        let mut specifications = HashMap::new();

        // Skip empty rows
        if row.iter().all(|cell| matches!(cell, DataType::Empty)) {
            return None;
        }

        for (col_idx, cell) in row.iter().enumerate() {
            if let Some(header) = headers.get(&col_idx) {
                let value = cell.to_string();
                
                match header.as_str() {
                    h if h.contains("model") || h.contains("part") => {
                        if !value.is_empty() {
                            model = value;
                        }
                    },
                    h if h.contains("description") => {
                        description = value;
                    },
                    h if h.contains("qty") || h.contains("quantity") => {
                        if let Ok(qty) = value.parse::<u32>() {
                            quantity = qty;
                        }
                    },
                    h if h.contains("unit") && h.contains("price") => {
                        if let Ok(price) = value.parse::<f64>() {
                            unit_price = price;
                        }
                    },
                    h if h.contains("total") && h.contains("price") => {
                        if let Ok(price) = value.parse::<f64>() {
                            total_price = price;
                        }
                    },
                    h if h.contains("vendor") || h.contains("manufacturer") => {
                        if !value.is_empty() {
                            vendor = value;
                        }
                    },
                    h if h.contains("config") => {
                        if !value.is_empty() {
                            configuration = Some(value);
                        }
                    },
                    _ => {
                        // Store as specification
                        if !value.is_empty() && value != "0" {
                            specifications.insert(header.clone(), value);
                        }
                    }
                }
            }
        }

        // Calculate total price if not provided
        if total_price == 0.0 && unit_price > 0.0 {
            total_price = unit_price * quantity as f64;
        }

        // Must have at least a model or description
        if model.is_empty() && description.is_empty() {
            return None;
        }

        Some(HardwareBasketItem {
            model,
            description,
            quantity,
            unit_price,
            total_price,
            vendor,
            configuration,
            specifications,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_sample_file() {
        // This test would require a sample file
        // let result = HardwareBasketParser::parse_file("test-basket.xlsx");
        // assert!(result.is_ok());
    }
}
