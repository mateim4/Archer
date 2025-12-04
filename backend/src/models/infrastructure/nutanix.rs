//! Nutanix HCI Infrastructure Models
//!
//! Complete type definitions for Nutanix AHV/AOS infrastructure objects
//! including Prism Central, clusters, hosts, CVMs, storage, and VMs.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// Prism Central - Central Management
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixPrismCentral {
    pub id: Option<Thing>,
    pub name: String,
    pub version: String,
    pub ip_address: String,
    pub vip: Option<String>,
    pub cluster_count: i32,
    pub vm_count: i32,
    pub host_count: i32,
    pub is_scale_out: bool,
    pub pc_vm_count: i32,
    pub license_type: String,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Cluster
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixCluster {
    pub id: Option<Thing>,
    pub prism_central: Option<Thing>,
    pub name: String,
    pub uuid: String,
    pub cluster_ip: String,
    pub data_services_ip: Option<String>,
    pub version: String,
    pub hypervisor: String,
    pub timezone: String,
    pub ncc_version: Option<String>,
    pub host_count: i32,
    pub vm_count: i32,
    pub storage_pool_count: i32,
    pub total_cpu_ghz: Option<f64>,
    pub total_memory_gb: Option<f64>,
    pub total_storage_tb: Option<f64>,
    pub used_storage_tb: Option<f64>,
    pub rf_factor: i32,
    pub erasure_coding_enabled: bool,
    pub dedup_enabled: bool,
    pub compression_enabled: bool,
    pub encryption_enabled: bool,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Host
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixHost {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub uuid: String,
    pub serial_number: Option<String>,
    pub block_serial: Option<String>,
    pub block_model: Option<String>,
    pub node_position: Option<String>,
    pub hypervisor_ip: String,
    pub ipmi_ip: Option<String>,
    pub cvm_ip: String,
    pub hypervisor_version: Option<String>,
    pub bios_version: Option<String>,
    pub bmc_version: Option<String>,
    pub cpu_model: Option<String>,
    pub cpu_cores: i32,
    pub cpu_sockets: i32,
    pub memory_gb: i32,
    pub num_vms: i32,
    pub ssd_count: Option<i32>,
    pub hdd_count: Option<i32>,
    pub nvme_count: Option<i32>,
    pub is_degraded: bool,
    pub maintenance_mode: bool,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Controller VM (CVM)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixCvm {
    pub id: Option<Thing>,
    pub host: Thing,
    pub name: String,
    pub uuid: String,
    pub ip_address: String,
    pub cpu_cores: i32,
    pub memory_gb: i32,
    pub nos_version: String,
    pub disk_count: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Storage Pool
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixStoragePool {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub uuid: String,
    pub capacity_bytes: i64,
    pub used_bytes: i64,
    pub free_bytes: i64,
    pub disk_count: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Storage Container
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixStorageContainer {
    pub id: Option<Thing>,
    pub storage_pool: Thing,
    pub name: String,
    pub uuid: String,
    pub max_capacity_bytes: Option<i64>,
    pub reserved_capacity_bytes: i64,
    pub used_bytes: i64,
    pub rf_factor: i32,
    pub oplog_replication_factor: i32,
    pub compression_enabled: bool,
    pub compression_delay_secs: i32,
    pub dedup_enabled: bool,
    pub erasure_coding_enabled: bool,
    pub encryption_enabled: bool,
    pub on_disk_dedup: bool,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Virtual Machine
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixVm {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub host: Option<Thing>,
    pub name: String,
    pub uuid: String,
    pub description: Option<String>,
    pub power_state: String,
    pub num_vcpus: i32,
    pub num_cores_per_vcpu: i32,
    pub memory_mb: i32,
    pub memory_reserved: bool,
    pub cpu_reserved: bool,
    pub is_agent_vm: bool,
    pub timezone: String,
    pub boot_type: String,
    pub machine_type: String,
    pub guest_os: Option<String>,
    pub ngt_installed: bool,
    pub ngt_version: Option<String>,
    pub ngt_vss_enabled: bool,
    pub protection_domain: Option<String>,
    pub protection_type: String,
    pub categories: Vec<String>,
    pub disk_count: i32,
    pub total_disk_size_gb: f64,
    pub nic_count: i32,
    pub gpu_count: i32,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Virtual Disk
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixVdisk {
    pub id: Option<Thing>,
    pub vm: Thing,
    pub storage_container: Option<Thing>,
    pub uuid: String,
    pub disk_address: String,
    pub device_bus: String,
    pub device_index: i32,
    pub size_bytes: i64,
    pub is_cdrom: bool,
    pub is_empty: bool,
    pub is_scsi_passthrough: bool,
    pub flash_mode_enabled: bool,
    pub source_image: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Network (Subnet)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixNetwork {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub uuid: String,
    pub network_type: String,
    pub vlan_id: Option<i32>,
    pub vswitch_name: Option<String>,
    pub subnet: Option<String>,
    pub gateway: Option<String>,
    pub dns_servers: Vec<String>,
    pub dhcp_enabled: bool,
    pub dhcp_start: Option<String>,
    pub dhcp_end: Option<String>,
    pub ip_pool_enabled: bool,
    pub is_external: bool,
    pub vm_count: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Image (VM Templates/ISOs)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixImage {
    pub id: Option<Thing>,
    pub cluster: Option<Thing>,
    pub name: String,
    pub uuid: String,
    pub description: Option<String>,
    pub image_type: String,
    pub source_uri: Option<String>,
    pub size_bytes: i64,
    pub checksum: Option<String>,
    pub checksum_type: Option<String>,
    pub architecture: Option<String>,
    pub os_type: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Protection Domain
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NutanixProtectionDomain {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub protection_type: String,
    pub active: bool,
    pub replication_links: Vec<String>,
    pub metro_availability_enabled: bool,
    pub vm_count: i32,
    pub cg_count: i32,
    pub pending_replication_count: i32,
    pub total_user_data_bytes: i64,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
