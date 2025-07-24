// Pre-sales configuration file parsers for vendor configurator tools
use std::path::Path;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::models::UniversalServer;
use crate::error::CoreEngineError;

/// Result type for configuration parsing operations
pub type ParseResult<T> = Result<T, CoreEngineError>;

/// Universal trait for parsing pre-sales configuration files from vendor tools
#[async_trait]
pub trait ConfigurationFileParser: Send + Sync {
    /// Get vendor name
    fn vendor_name(&self) -> &str;
    
    /// Get supported file extensions for this parser
    fn supported_extensions(&self) -> Vec<&str>;
    
    /// Check if this parser can handle the given file
    async fn can_parse(&self, file_path: &Path) -> ParseResult<bool>;
    
    /// Parse a pre-sales configuration file into a UniversalServer
    async fn parse_configuration(&self, file_path: &Path) -> ParseResult<ParsedConfiguration>;
}

/// Result of parsing a pre-sales configuration file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedConfiguration {
    /// The parsed server configuration
    pub server: UniversalServer,
    /// Source information about the parsed file
    pub source_info: ConfigurationSource,
    /// Any warnings encountered during parsing
    pub warnings: Vec<String>,
    /// Pricing information if available
    pub pricing: Option<PricingInfo>,
}

/// Information about the source of a configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationSource {
    /// Original filename
    pub filename: String,
    /// Vendor tool that generated the file
    pub source_tool: String,
    /// File format (e.g., "SCP XML", "iQuote Excel", "DCSC XML")
    pub file_format: String,
    /// Date when file was parsed
    pub parsed_at: chrono::DateTime<chrono::Utc>,
    /// File size in bytes
    pub file_size: u64,
}

/// Pricing information extracted from configuration files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingInfo {
    /// Currency code (e.g., "USD", "EUR")
    pub currency: String,
    /// Total configuration price
    pub total_price: Option<f64>,
    /// Individual line item prices
    pub line_items: Vec<LineItemPrice>,
    /// Price type (e.g., "List", "Partner", "Registered")
    pub price_type: String,
    /// Quote validity date
    pub valid_until: Option<chrono::DateTime<chrono::Utc>>,
}

/// Individual component pricing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineItemPrice {
    /// Component part number/SKU
    pub part_number: String,
    /// Component description
    pub description: String,
    /// Quantity ordered
    pub quantity: u32,
    /// Unit price
    pub unit_price: Option<f64>,
    /// Extended price (unit_price * quantity)
    pub extended_price: Option<f64>,
    /// Component category (Hardware, Software, Services)
    pub category: ItemCategory,
}

/// Category of configuration items
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ItemCategory {
    Hardware,
    Software,
    Services,
    Unknown,
}

/// Universal configuration file parser that delegates to vendor-specific parsers
pub struct UniversalConfigurationParser {
    parsers: Vec<Box<dyn ConfigurationFileParser>>,
}

impl UniversalConfigurationParser {
    /// Create a new universal parser with all supported vendor parsers
    pub fn new() -> Self {
        let mut parsers: Vec<Box<dyn ConfigurationFileParser>> = Vec::new();
        
        // Add vendor-specific parsers
        // Note: Jules already implemented comprehensive hardware parsers in hardware_parser module
        // These would reference those parsers or be separate configuration file parsers
        // parsers.push(Box::new(crate::vendor_client::dell_parser::DellSCPParser::new()));
        // parsers.push(Box::new(crate::vendor_client::hpe_parser::HPEiQuoteParser::new()));
        // parsers.push(Box::new(crate::vendor_client::lenovo_parser::LenovoDCSCParser::new()));
        
        Self { parsers }
    }
    
    /// Detect the appropriate parser for a file and parse it
    pub async fn parse_file(&self, file_path: &Path) -> ParseResult<ParsedConfiguration> {
        // Try each parser to see which can handle this file
        for parser in &self.parsers {
            if parser.can_parse(file_path).await? {
                return parser.parse_configuration(file_path).await;
            }
        }
        
        Err(CoreEngineError::parsing(format!(
            "No parser found for file: {}. Supported formats: Dell SCP XML, HPE iQuote Excel, Lenovo DCSC XML",
            file_path.display()
        )))
    }
    
    /// Get information about all supported file types
    pub fn get_supported_formats(&self) -> Vec<SupportedFormat> {
        self.parsers.iter().map(|parser| {
            SupportedFormat {
                vendor: parser.vendor_name().to_string(),
                extensions: parser.supported_extensions().iter().map(|s| s.to_string()).collect(),
                description: match parser.vendor_name() {
                    "Dell" => "Dell Online Solutions Configurator (OSC) - Server Configuration Profile XML".to_string(),
                    "HPE" => "HPE iQuote Excel export files".to_string(),
                    "Lenovo" => "Lenovo Data Center Solution Configurator (DCSC) XML".to_string(),
                    vendor => format!("{} configuration files", vendor),
                }
            }
        }).collect()
    }
}

/// Information about a supported file format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportedFormat {
    pub vendor: String,
    pub extensions: Vec<String>,
    pub description: String,
}