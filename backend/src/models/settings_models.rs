//! Settings Models
//!
//! Application-wide settings and defaults for Archer

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use surrealdb::sql::Thing;

// =============================================================================
// SETTINGS MODEL
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub setting_key: String,
    pub setting_category: SettingCategory,
    
    // Capacity defaults (overcommit ratios)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overcommit_cpu_default: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overcommit_memory_default: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overcommit_storage_default: Option<f64>,
    
    // Timeline estimation defaults (hours per host)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub migration_hours_per_host: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub decommission_hours_per_host: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expansion_hours_per_host: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maintenance_hours_per_host: Option<f64>,
    
    // Flexible value storage for any setting
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<serde_json::Value>,
    
    // Metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SettingCategory {
    Capacity,
    Timeline,
    Notifications,
    General,
}

// =============================================================================
// OVERCOMMIT RATIOS RESPONSE
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvercommitDefaults {
    pub cpu: f64,
    pub memory: f64,
    pub storage: f64,
}

impl Default for OvercommitDefaults {
    fn default() -> Self {
        Self {
            cpu: 4.0,
            memory: 1.5,
            storage: 1.0,
        }
    }
}

// =============================================================================
// TIMELINE ESTIMATION DEFAULTS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineDefaults {
    pub migration_hours_per_host: f64,
    pub decommission_hours_per_host: f64,
    pub expansion_hours_per_host: f64,
    pub maintenance_hours_per_host: f64,
}

impl Default for TimelineDefaults {
    fn default() -> Self {
        Self {
            migration_hours_per_host: 6.0,
            decommission_hours_per_host: 3.0,
            expansion_hours_per_host: 9.0,
            maintenance_hours_per_host: 4.0,
        }
    }
}

// =============================================================================
// ALL DEFAULTS RESPONSE
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalDefaults {
    pub overcommit_ratios: OvercommitDefaults,
    pub timeline_estimates: TimelineDefaults,
}

impl Default for GlobalDefaults {
    fn default() -> Self {
        Self {
            overcommit_ratios: OvercommitDefaults::default(),
            timeline_estimates: TimelineDefaults::default(),
        }
    }
}
