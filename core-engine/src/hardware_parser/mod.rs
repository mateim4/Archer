pub mod adapters;
pub mod basket_parser;
pub mod basket_parser_new;
pub mod spec_parser;
pub mod component_classifier;
pub mod server_assembly;

pub use basket_parser::{
    HardwareBasketParser,
    ParsedHardwareBasket,
    ParsedHardwareLot,
    ParsedHardwareComponent,
    ParsedHardwareOption,
    ParsedVendorConfig,
};

use crate::models::UniversalServer;
use crate::error::CoreEngineError;
// ... existing code ...
use crate::Result;
use std::fs;

use self::adapters::dell_parser::DellScpParser;
use self::adapters::hpe_parser::HpeIquoteParser;
use self::adapters::lenovo_parser::LenovoDcscParser;


// Define a trait for vendor-specific parsers
pub trait HardwareParser {
    fn parse(&self, content: &str) -> Result<UniversalServer>;
}

// Enum to represent the supported vendors
#[derive(Debug, PartialEq)]
enum Vendor {
    Dell,
    Lenovo,
    Hpe,
    Unknown,
}

// The main universal parser
pub struct UniversalParser;

impl UniversalParser {
    // Detect the vendor based on file content
    fn detect_vendor(content: &str) -> Vendor {
        // Dell SCP XML files have a very specific root element
        if content.contains("<SystemConfiguration Model=") {
            Vendor::Dell
        }
        // Lenovo DCSC XML seems to have this as a root element.
        // This is an assumption based on the report and may need refinement.
        else if content.contains("<Configuration cf_ver=") {
            Vendor::Lenovo
        }
        // A placeholder for HPE detection, which might be based on file extension (.xls, .xlsx)
        // or content sniffing for specific headers.
        else if content.contains("iQuote") { // A guess
            Vendor::Hpe
        } else {
            Vendor::Unknown
        }
    }

    // Parse a file from a given path
    pub fn parse_file(&self, file_path: &str) -> Result<UniversalServer> {
        let content = fs::read_to_string(file_path)
            .map_err(|e| CoreEngineError::io(format!("Failed to read file: {}", e)))?;

        let vendor = Self::detect_vendor(&content);

        let parser: Box<dyn HardwareParser> = match vendor {
            Vendor::Dell => Box::new(DellScpParser),
            Vendor::Lenovo => Box::new(LenovoDcscParser),
            Vendor::Hpe => Box::new(HpeIquoteParser),
            Vendor::Unknown => return Err(CoreEngineError::parsing("Unknown or unsupported file format".to_string())),
        };

        parser.parse(&content)
    }
}

#[cfg(test)]
mod tests;
