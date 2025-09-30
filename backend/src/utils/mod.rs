pub mod error_handling;
pub mod api_response;

// Re-export commonly used error types and utilities
pub use error_handling::{
    EnhancedRvToolsError, 
    EnhancedRvToolsResult, 
    EnhancedRvToolsLogger
};