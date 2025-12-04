//! Monitoring Infrastructure Models
//!
//! Type definitions for Splunk and Nagios monitoring systems.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use surrealdb::sql::Thing;

// ============================================================================
// Splunk - Deployment Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkDeploymentServer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub license_type: String,
    pub role: String,
    pub mgmt_port: i32,
    pub web_port: i32,
    pub client_count: i32,
    pub server_classes: Vec<String>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Search Head
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkSearchHead {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub cluster: Option<Thing>,
    pub is_captain: bool,
    pub mgmt_port: i32,
    pub web_port: i32,
    pub indexer_cluster: Option<Thing>,
    pub connected_indexers: Vec<Thing>,
    pub cpu_cores: Option<i32>,
    pub memory_gb: Option<i32>,
    pub concurrent_searches_limit: i32,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Search Head Cluster
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkShc {
    pub id: Option<Thing>,
    pub name: String,
    pub label: String,
    pub replication_factor: i32,
    pub conf_deploy_fetch_url: Option<String>,
    pub captain: Option<Thing>,
    pub member_count: i32,
    pub deployer: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Indexer
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkIndexer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub cluster: Option<Thing>,
    pub site: String,
    pub receiving_port: i32,
    pub mgmt_port: i32,
    pub hot_path: Option<String>,
    pub cold_path: Option<String>,
    pub frozen_path: Option<String>,
    pub storage_used_gb: Option<f64>,
    pub storage_total_gb: Option<f64>,
    pub daily_ingest_gb: Option<f64>,
    pub cpu_cores: Option<i32>,
    pub memory_gb: Option<i32>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Indexer Cluster
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkIndexerCluster {
    pub id: Option<Thing>,
    pub name: String,
    pub label: String,
    pub cluster_master: Option<Thing>,
    pub replication_factor: i32,
    pub search_factor: i32,
    pub multisite: bool,
    pub sites: Vec<String>,
    pub site_replication_factor: Option<String>,
    pub site_search_factor: Option<String>,
    pub indexer_count: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Cluster Master (Manager)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkClusterMaster {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub mgmt_port: i32,
    pub web_port: i32,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Forwarder
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkForwarder {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub forwarder_type: String,
    pub deployment_server: Option<Thing>,
    pub server_classes: Vec<String>,
    pub inputs: Vec<JsonValue>,
    pub outputs: Vec<String>,
    pub installed_on: Option<Thing>,
    pub status: String,
    pub last_phone_home: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Splunk - Index
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplunkIndex {
    pub id: Option<Thing>,
    pub name: String,
    pub datatype: String,
    pub indexer_cluster: Option<Thing>,
    pub max_data_size: String,
    pub retention_days: i32,
    pub frozen_time_period_in_secs: i32,
    pub current_size_gb: Option<f64>,
    pub event_count: Option<i32>,
    pub description: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Nagios - Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NagiosServer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub edition: String,
    pub web_url: Option<String>,
    pub config_dir: String,
    pub plugin_dir: String,
    pub host_count: i32,
    pub service_count: i32,
    pub host_groups_count: i32,
    pub contact_count: i32,
    pub check_result_reaper_frequency: i32,
    pub max_concurrent_checks: i32,
    pub check_interval: i32,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_config_check: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Nagios - Host
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NagiosHost {
    pub id: Option<Thing>,
    pub nagios_server: Thing,
    pub name: String,
    pub alias: Option<String>,
    pub address: String,
    pub display_name: Option<String>,
    pub use_template: Option<String>,
    pub hostgroups: Vec<String>,
    pub contacts: Vec<String>,
    pub contact_groups: Vec<String>,
    pub check_command: String,
    pub check_interval: i32,
    pub retry_interval: i32,
    pub max_check_attempts: i32,
    pub check_period: String,
    pub notification_interval: i32,
    pub notification_period: String,
    pub notification_options: Vec<String>,
    pub parents: Vec<String>,
    pub current_state: String,
    pub last_check: Option<DateTime<Utc>>,
    pub last_state_change: Option<DateTime<Utc>>,
    pub output: Option<String>,
    pub cmdb_asset: Option<Thing>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Nagios - Service
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NagiosService {
    pub id: Option<Thing>,
    pub nagios_server: Thing,
    pub host: Thing,
    pub service_description: String,
    pub display_name: Option<String>,
    pub check_command: String,
    pub check_interval: i32,
    pub retry_interval: i32,
    pub max_check_attempts: i32,
    pub check_period: String,
    pub contacts: Vec<String>,
    pub contact_groups: Vec<String>,
    pub notification_interval: i32,
    pub notification_period: String,
    pub notification_options: Vec<String>,
    pub warning_threshold: Option<String>,
    pub critical_threshold: Option<String>,
    pub current_state: String,
    pub last_check: Option<DateTime<Utc>>,
    pub last_state_change: Option<DateTime<Utc>>,
    pub output: Option<String>,
    pub performance_data: Option<String>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Nagios - Host Group
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NagiosHostGroup {
    pub id: Option<Thing>,
    pub nagios_server: Thing,
    pub hostgroup_name: String,
    pub alias: Option<String>,
    pub members: Vec<String>,
    pub hostgroup_members: Vec<String>,
    pub notes: Option<String>,
    pub notes_url: Option<String>,
    pub action_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Nagios - Contact
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NagiosContact {
    pub id: Option<Thing>,
    pub nagios_server: Thing,
    pub contact_name: String,
    pub alias: Option<String>,
    pub email: Option<String>,
    pub pager: Option<String>,
    pub host_notification_period: String,
    pub service_notification_period: String,
    pub host_notification_options: Vec<String>,
    pub service_notification_options: Vec<String>,
    pub host_notification_commands: Vec<String>,
    pub service_notification_commands: Vec<String>,
    pub contact_groups: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Nagios - Command
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NagiosCommand {
    pub id: Option<Thing>,
    pub nagios_server: Thing,
    pub command_name: String,
    pub command_line: String,
    pub command_type: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
