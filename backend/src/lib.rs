// LCMDesigner Backend Library
// This file serves as the main library entry point for the backend
// Provides modular access to all backend services

pub mod api;
pub mod services;
pub mod utils;
pub mod models;

// Re-export main services
pub use services::analytics_service::AdvancedAnalyticsService;
pub use services::reporting_service::ComprehensiveReportingService;
pub use services::hardware_pool_service::HardwarePoolService;

// Re-export API handlers
pub use api::analytics_api::AnalyticsAPI;

// Common types used across the backend
pub use models::{
    analytics::{AnalyticsMetric, SystemHealth, DashboardAlert, HardwareAnalytics},
    hardware_pool::{HardwareServer, HardwarePool, AllocationRequest}
};

#[cfg(test)]
mod tests {
    #[test]
    fn backend_lib_loads() {
        // Basic test to ensure the library loads correctly
        assert!(true);
    }
}
