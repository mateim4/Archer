use thiserror::Error;

#[derive(Error, Debug)]
pub enum CoreEngineError {
    #[error("Failed to parse RVTools file: {0}")]
    ParsingError(String),

    #[error("Data validation error: {0}")]
    ValidationError(String),

    #[error("Calculation error: {0}")]
    CalculationError(String),

    #[error("Document generation error: {0}")]
    DocumentError(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Feature not implemented: {0}")]
    NotImplemented(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Excel parsing error: {0}")]
    ExcelError(#[from] calamine::Error),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Hardware basket error: {0}")]
    HardwareError(String),

    #[error("Migration planning error: {0}")]
    MigrationError(String),
}

impl CoreEngineError {
    pub fn parsing(msg: impl Into<String>) -> Self {
        Self::ParsingError(msg.into())
    }

    pub fn validation(msg: impl Into<String>) -> Self {
        Self::ValidationError(msg.into())
    }

    pub fn calculation(msg: impl Into<String>) -> Self {
        Self::CalculationError(msg.into())
    }

    pub fn document(msg: impl Into<String>) -> Self {
        Self::DocumentError(msg.into())
    }

    pub fn config(msg: impl Into<String>) -> Self {
        Self::ConfigError(msg.into())
    }

    pub fn hardware(msg: impl Into<String>) -> Self {
        Self::HardwareError(msg.into())
    }

    pub fn migration(msg: impl Into<String>) -> Self {
        Self::MigrationError(msg.into())
    }

    pub fn not_implemented(msg: impl Into<String>) -> Self {
        Self::NotImplemented(msg.into())
    }

    pub fn io(msg: impl Into<String>) -> Self {
        Self::Io(msg.into())
    }
}
