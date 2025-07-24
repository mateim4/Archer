//! Core Engine Library for InfraPlanner
//! 
//! This library contains all the pure business logic for the InfraPlanner application,
//! including RVTools parsing, capacity planning algorithms, and document generation.

pub mod models;
pub mod parser;
pub mod analysis;
pub mod forecasting;
pub mod sizing;
pub mod translation;
pub mod document_generation;
pub mod error;
pub mod hardware_parser;
pub mod vendor_client;
pub mod vendor_data;

pub use error::CoreEngineError;
pub type Result<T> = std::result::Result<T, CoreEngineError>;

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
