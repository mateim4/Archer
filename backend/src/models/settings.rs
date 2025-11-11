//! Global Settings Models
//!
//! Application-wide configuration and default values.
//! These settings are shared across all projects and activities.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

use super::project_models::OvercommitRatios;

/// Global Application Settings
/// 
/// Stores organization-wide defaults and configurations.
/// These values are used as defaults when creating new activities/projects.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalSettings {
    pub id: Option<Thing>,
    
    /// Default overcommit ratios for capacity planning
    /// These can be overridden per-activity
    pub default_overcommit_ratios: OvercommitRatios,
    
    /// Timeline estimation factors (hours per host/VM)
    pub timeline_factors: TimelineFactors,
    
    /// Organization information
    pub organization_name: Option<String>,
    pub organization_id: Option<String>,
    
    /// Feature flags
    pub features: FeatureFlags,
    
    /// Last updated metadata
    pub updated_by: String,
    pub updated_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

/// Timeline estimation factors for different activity types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFactors {
    /// Hours per host for migration activities
    pub migration_hours_per_host: f32,
    
    /// Hours per host for decommission activities
    pub decommission_hours_per_host: f32,
    
    /// Hours per host for expansion activities
    pub expansion_hours_per_host: f32,
    
    /// Hours per host for maintenance activities
    pub maintenance_hours_per_host: f32,
}

impl Default for TimelineFactors {
    fn default() -> Self {
        Self {
            migration_hours_per_host: 6.0,
            decommission_hours_per_host: 3.0,
            expansion_hours_per_host: 9.0,
            maintenance_hours_per_host: 4.0,
        }
    }
}

/// Feature flags for experimental or optional features
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlags {
    pub enable_hardware_pool: bool,
    pub enable_rvtools_import: bool,
    pub enable_capacity_analytics: bool,
    pub enable_timeline_gantt: bool,
}

impl Default for FeatureFlags {
    fn default() -> Self {
        Self {
            enable_hardware_pool: true,
            enable_rvtools_import: true,
            enable_capacity_analytics: true,
            enable_timeline_gantt: true,
        }
    }
}

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            id: None,
            default_overcommit_ratios: OvercommitRatios {
                cpu_ratio: 4.0,
                memory_ratio: 1.5,
            },
            timeline_factors: TimelineFactors::default(),
            organization_name: None,
            organization_id: None,
            features: FeatureFlags::default(),
            updated_by: "system".to_string(),
            updated_at: Utc::now(),
            created_at: Utc::now(),
        }
    }
}

/// Request to update global settings
#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub default_overcommit_ratios: Option<OvercommitRatios>,
    pub timeline_factors: Option<TimelineFactors>,
    pub organization_name: Option<String>,
    pub organization_id: Option<String>,
    pub features: Option<FeatureFlags>,
    pub updated_by: String,
}
