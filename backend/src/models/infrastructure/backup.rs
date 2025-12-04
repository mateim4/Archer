//! Backup Infrastructure Models
//!
//! Type definitions for Veeam Backup & Replication including:
//! - Backup server, proxies, repositories
//! - Jobs, sessions, restore points
//! - Protected VMs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// Veeam - Backup Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamServer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub build: Option<String>,
    pub edition: String,
    pub database_server: Option<String>,
    pub database_name: String,
    pub license_type: String,
    pub license_expiry: Option<DateTime<Utc>>,
    pub licensed_sockets: Option<i32>,
    pub licensed_instances: Option<i32>,
    pub used_sockets: i32,
    pub used_instances: i32,
    pub managed_server_count: i32,
    pub repository_count: i32,
    pub job_count: i32,
    pub protected_vm_count: i32,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Proxy
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamProxy {
    pub id: Option<Thing>,
    pub veeam_server: Thing,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub proxy_type: String,
    pub transport_mode: String,
    pub max_concurrent_tasks: i32,
    pub connected_datastore: Option<String>,
    pub cpu_cores: Option<i32>,
    pub memory_gb: Option<i32>,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Repository
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamRepository {
    pub id: Option<Thing>,
    pub veeam_server: Thing,
    pub name: String,
    pub description: Option<String>,
    pub repository_type: String,
    pub path: String,
    pub host: Option<String>,
    pub capacity_gb: f64,
    pub free_space_gb: f64,
    pub used_space_gb: f64,
    pub max_concurrent_tasks: i32,
    pub decompress_before_storing: bool,
    pub align_data_blocks: bool,
    pub use_per_vm_backup_files: bool,
    pub immutability_enabled: bool,
    pub immutability_days: Option<i32>,
    pub encryption_enabled: bool,
    pub is_sobr: bool,
    pub sobr_performance_tier: Vec<Thing>,
    pub sobr_capacity_tier: Option<Thing>,
    pub sobr_archive_tier: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Managed Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamManagedServer {
    pub id: Option<Thing>,
    pub veeam_server: Thing,
    pub name: String,
    pub hostname: String,
    pub server_type: String,
    pub api_version: Option<String>,
    pub protected_vm_count: i32,
    pub port: i32,
    pub credential: Option<String>,
    pub nutanix_prism: Option<Thing>,
    pub status: String,
    pub last_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Backup Job
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamJob {
    pub id: Option<Thing>,
    pub veeam_server: Thing,
    pub name: String,
    pub description: Option<String>,
    pub job_type: String,
    pub target_repository: Option<Thing>,
    pub schedule_enabled: bool,
    pub schedule_type: String,
    pub schedule_time: Option<String>,
    pub schedule_days: Vec<String>,
    pub retry_enabled: bool,
    pub retry_count: i32,
    pub retry_wait_minutes: i32,
    pub backup_mode: String,
    pub synthetic_full_enabled: bool,
    pub active_full_enabled: bool,
    pub active_full_schedule: Option<String>,
    pub retention_type: String,
    pub retention_value: i32,
    pub gfs_enabled: bool,
    pub gfs_weekly: Option<i32>,
    pub gfs_monthly: Option<i32>,
    pub gfs_yearly: Option<i32>,
    pub vm_objects: Vec<String>,
    pub exclusions: Vec<String>,
    pub last_run: Option<DateTime<Utc>>,
    pub last_result: Option<String>,
    pub next_run: Option<DateTime<Utc>>,
    pub is_running: bool,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Backup Session
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamSession {
    pub id: Option<Thing>,
    pub job: Thing,
    pub session_id: String,
    pub session_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub progress: i32,
    pub result: String,
    pub reason: Option<String>,
    pub processed_objects: i32,
    pub total_objects: i32,
    pub read_gb: f64,
    pub transferred_gb: f64,
    pub bottleneck: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Restore Point
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamRestorePoint {
    pub id: Option<Thing>,
    pub job: Thing,
    pub repository: Thing,
    pub vm_name: String,
    pub restore_point_id: String,
    pub creation_time: DateTime<Utc>,
    pub backup_type: String,
    pub is_consistent: bool,
    pub is_corrupted: bool,
    pub backup_size_gb: f64,
    pub data_size_gb: f64,
    pub dedup_ratio: Option<f64>,
    pub compression_ratio: Option<f64>,
    pub is_gfs_full: bool,
    pub gfs_period: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// Veeam - Protected VM
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VeeamProtectedVm {
    pub id: Option<Thing>,
    pub veeam_server: Thing,
    pub vm_name: String,
    pub vm_id: Option<String>,
    pub platform: String,
    pub managed_server: Option<Thing>,
    pub protection_jobs: Vec<Thing>,
    pub last_backup: Option<DateTime<Utc>>,
    pub last_backup_result: Option<String>,
    pub restore_points_count: i32,
    pub oldest_restore_point: Option<DateTime<Utc>>,
    pub newest_restore_point: Option<DateTime<Utc>>,
    pub total_backup_size_gb: f64,
    pub nutanix_vm: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
