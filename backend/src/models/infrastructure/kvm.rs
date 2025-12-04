//! KVM & Power Infrastructure Models
//!
//! Type definitions for Avocent KVM switches, PDUs, and console servers.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// Avocent - KVM Switch
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvocentKvm {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub firmware_version: String,
    pub total_ports: i32,
    pub used_ports: i32,
    pub management_vlan: Option<i32>,
    pub secondary_ip: Option<String>,
    pub is_digital: bool,
    pub supports_virtual_media: bool,
    pub supports_power_control: bool,
    pub max_users: i32,
    pub location: Option<String>,
    pub rack: Option<String>,
    pub rack_position: Option<i32>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Avocent - KVM Target
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvocentKvmTarget {
    pub id: Option<Thing>,
    pub kvm: Thing,
    pub name: String,
    pub port: i32,
    pub target_type: String,
    pub connection_path: Option<String>,
    pub is_cascaded: bool,
    pub cascade_switch: Option<Thing>,
    pub virtual_media_enabled: bool,
    pub iso_mounted: Option<String>,
    pub power_control_enabled: bool,
    pub pdu: Option<Thing>,
    pub pdu_outlet: Option<i32>,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub last_accessed: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Avocent - PDU
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvocentPdu {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub firmware_version: String,
    pub phase_type: String,
    pub voltage: i32,
    pub max_amperage: f64,
    pub current_load_amps: f64,
    pub power_consumption_kw: f64,
    pub total_outlets: i32,
    pub switched_outlets: i32,
    pub metered_outlets: i32,
    pub location: Option<String>,
    pub rack: Option<String>,
    pub rack_position: Option<String>,
    pub managed_by_kvm: Option<Thing>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Avocent - PDU Outlet
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvocentPduOutlet {
    pub id: Option<Thing>,
    pub pdu: Thing,
    pub outlet_number: i32,
    pub name: Option<String>,
    pub outlet_type: String,
    pub connector_type: String,
    pub power_state: String,
    pub current_amps: f64,
    pub power_watts: f64,
    pub energy_kwh: f64,
    pub default_state: String,
    pub power_on_delay: i32,
    pub connected_device: Option<String>,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Avocent - Console Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvocentConsoleServer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub firmware_version: String,
    pub total_ports: i32,
    pub used_ports: i32,
    pub location: Option<String>,
    pub rack: Option<String>,
    pub rack_position: Option<i32>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Avocent - Console Port
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvocentConsolePort {
    pub id: Option<Thing>,
    pub console_server: Thing,
    pub port_number: i32,
    pub name: Option<String>,
    pub baud_rate: i32,
    pub data_bits: i32,
    pub parity: String,
    pub stop_bits: i32,
    pub flow_control: String,
    pub ssh_port: Option<i32>,
    pub telnet_port: Option<i32>,
    pub connected_device: Option<String>,
    pub device_type: Option<String>,
    pub cmdb_asset: Option<Thing>,
    pub logging_enabled: bool,
    pub log_path: Option<String>,
    pub status: String,
    pub last_accessed: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
