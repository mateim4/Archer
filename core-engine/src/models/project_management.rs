use serde::{Deserialize, Serialize};
use surrealdb::sql::{Thing, Datetime};
use crate::models::hardware_basket::HardwareSpecifications;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub status: ProjectStatus,
    pub created_by: String,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProjectStatus {
    Planning,
    InProgress,
    Completed,
    OnHold,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Activity {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_type: ActivityType,
    pub name: String,
    pub description: Option<String>,
    pub assignee: String,
    pub status: ActivityStatus,
    pub start_date: Datetime,
    pub end_date: Datetime,
    pub dependencies: Vec<Thing>, // other activity IDs
    pub wizard_config: Option<serde_json::Value>,
    pub servers_involved: Vec<Thing>,
    pub add_to_free_pool: bool,
    pub overcommit_config: Option<OvercommitConfig>,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActivityType {
    Migration,
    Lifecycle,
    Decommission,
    HardwareCustomization,
    Commissioning,
    Custom(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActivityStatus {
    Pending,
    InProgress,
    Completed,
    Blocked,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerInventory {
    pub id: Option<Thing>,
    pub model_name: String,
    pub vendor: String,
    pub specifications: HardwareSpecifications, // reuse existing
    pub status: ServerStatus,
    pub location: Option<String>,
    pub assigned_project: Option<Thing>,
    pub assigned_activity: Option<Thing>,
    pub source: ServerSource,
    pub purchase_date: Option<Datetime>,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServerStatus {
    Available,
    InUse,
    Maintenance,
    Decommissioned,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServerSource {
    RVTools,
    Manual,
    HardwareBasket,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FreeHardwarePool {
    pub id: Option<Thing>,
    pub server_id: Thing,
    pub available_from: Datetime,
    pub released_from_activity: Option<Thing>,
    pub notes: Option<String>,
    pub created_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OvercommitConfig {
    pub cpu_ratio: String, // "3:1"
    pub memory_ratio: String, // "1.5:1"
    pub ha_policy: String, // "n+1"
}
