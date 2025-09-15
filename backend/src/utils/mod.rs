pub mod error_handling;

// Re-export commonly used error types and utilities
pub use error_handling::{
    EnhancedRvToolsError, 
    EnhancedRvToolsResult, 
    EnhancedRvToolsLogger
};