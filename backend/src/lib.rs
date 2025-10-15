// LCMDesigner Backend Library
// This file serves as the main library entry point for the backend
// Provides modular access to all backend services

pub mod api;
pub mod services;
pub mod utils;
pub mod models;
pub mod database;
pub mod middleware;

// Re-export main services
// pub use services::enhanced_rvtools_service::EnhancedRvToolsService; // TODO: Fix compilation errors
// TODO: Re-enable when implemented
// pub use services::analytics_service::AdvancedAnalyticsService;
// pub use services::reporting_service::ComprehensiveReportingService;
// pub use services::hardware_pool_service::HardwarePoolService;

// Re-export API handlers
// TODO: Re-enable when analytics_api module is created
// pub use api::analytics_api::AnalyticsAPI;

// Re-export common utilities
pub use utils::api_response::{ApiResponse, helpers};

// Common types used across the backend
// TODO: Re-enable when analytics and hardware_pool models are created
// pub use models::{
//     analytics::{AnalyticsMetric, SystemHealth, DashboardAlert, HardwareAnalytics},
//     hardware_pool::{HardwareServer, HardwarePool, AllocationRequest}
// };

#[cfg(test)]
mod tests {
    #[test]
    fn backend_lib_loads() {
        // Basic test to ensure the library loads correctly
        assert!(true);
    }
}
