//! Security Infrastructure Models
//!
//! Type definitions for Fortinet (FortiManager, FortiGate, FortiAnalyzer)
//! and Broadcom Secure Web Gateway (formerly Symantec/Blue Coat).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use surrealdb::sql::Thing;

// ============================================================================
// Fortinet - FortiManager
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetFortiManager {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub serial_number: Option<String>,
    pub firmware_version: String,
    pub adoms: Vec<String>,
    pub managed_device_count: i32,
    pub ha_mode: String,
    pub ha_peer: Option<Thing>,
    pub license_type: String,
    pub license_expiry: Option<DateTime<Utc>>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - FortiGate
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetFortiGate {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub model: String,
    pub serial_number: String,
    pub firmware_version: String,
    pub vdom_mode: String,
    pub vdoms: Vec<String>,
    pub ha_mode: String,
    pub ha_group_name: Option<String>,
    pub ha_priority: i32,
    pub ha_peer: Option<Thing>,
    pub mgmt_ip: String,
    pub mgmt_interface: String,
    pub fortimanager: Option<Thing>,
    pub fortianalyzer: Option<Thing>,
    pub adom: Option<String>,
    pub license_type: String,
    pub fortiguard_license: bool,
    pub utm_bundle: Option<String>,
    pub cpu_count: Option<i32>,
    pub memory_gb: Option<i32>,
    pub session_capacity: Option<i32>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub config_revision: i32,
    pub last_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - FortiGate Interface
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetFortiGateInterface {
    pub id: Option<Thing>,
    pub fortigate: Thing,
    pub name: String,
    pub alias: Option<String>,
    pub vdom: String,
    #[serde(rename = "type")]
    pub interface_type: String,
    pub mode: String,
    pub ip_address: Option<String>,
    pub subnet_mask: Option<String>,
    pub vlanid: Option<i32>,
    pub parent_interface: Option<String>,
    pub zone: Option<String>,
    pub role: String,
    pub speed: String,
    pub status: String,
    pub allowaccess: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - Address Object
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetAddressObject {
    pub id: Option<Thing>,
    pub fortigate: Option<Thing>,
    pub fortimanager: Option<Thing>,
    pub adom: Option<String>,
    pub name: String,
    #[serde(rename = "type")]
    pub address_type: String,
    pub subnet: Option<String>,
    pub start_ip: Option<String>,
    pub end_ip: Option<String>,
    pub fqdn: Option<String>,
    pub country: Option<String>,
    pub interface: Option<String>,
    pub comment: Option<String>,
    pub color: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - Address Group
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetAddressGroup {
    pub id: Option<Thing>,
    pub fortigate: Option<Thing>,
    pub fortimanager: Option<Thing>,
    pub adom: Option<String>,
    pub name: String,
    pub members: Vec<String>,
    pub comment: Option<String>,
    pub color: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - Service Object
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetServiceObject {
    pub id: Option<Thing>,
    pub fortigate: Option<Thing>,
    pub fortimanager: Option<Thing>,
    pub name: String,
    pub category: String,
    pub protocol: String,
    pub tcp_portrange: Option<String>,
    pub udp_portrange: Option<String>,
    pub protocol_number: Option<i32>,
    pub comment: Option<String>,
    pub color: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - Firewall Policy
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetFirewallPolicy {
    pub id: Option<Thing>,
    pub fortigate: Option<Thing>,
    pub fortimanager: Option<Thing>,
    pub adom: Option<String>,
    pub policy_package: Option<String>,
    pub policyid: i32,
    pub name: String,
    pub uuid: Option<String>,
    pub vdom: String,
    pub srcintf: Vec<String>,
    pub dstintf: Vec<String>,
    pub srcaddr: Vec<String>,
    pub dstaddr: Vec<String>,
    pub service: Vec<String>,
    pub action: String,
    pub nat: bool,
    pub schedule: String,
    pub av_profile: Option<String>,
    pub webfilter_profile: Option<String>,
    pub ips_sensor: Option<String>,
    pub application_list: Option<String>,
    pub ssl_ssh_profile: Option<String>,
    pub logtraffic: String,
    pub logtraffic_start: bool,
    pub status: String,
    pub comments: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - IPsec VPN
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetVpnIpsec {
    pub id: Option<Thing>,
    pub fortigate: Thing,
    pub name: String,
    #[serde(rename = "type")]
    pub vpn_type: String,
    pub interface: String,
    pub remote_gw: Option<String>,
    pub remote_gw_type: String,
    pub ike_version: i32,
    pub proposal: Vec<String>,
    pub dhgrp: Vec<i32>,
    pub authmethod: String,
    pub keylife: i32,
    pub phase2_name: Option<String>,
    pub phase2_proposal: Vec<String>,
    pub pfs: bool,
    pub src_subnet: Option<String>,
    pub dst_subnet: Option<String>,
    pub status: String,
    pub tunnel_status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - SSL VPN
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetVpnSsl {
    pub id: Option<Thing>,
    pub fortigate: Thing,
    pub name: String,
    pub interface: String,
    pub port: i32,
    pub tunnel_ip_pools: Vec<String>,
    pub source_interface: Vec<String>,
    pub source_address: Vec<String>,
    pub authentication: String,
    pub auth_portal: Option<String>,
    pub user_groups: Vec<String>,
    pub split_tunneling: bool,
    pub split_tunneling_networks: Vec<String>,
    pub status: String,
    pub max_sessions: Option<i32>,
    pub active_sessions: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Fortinet - FortiAnalyzer
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FortinetFortiAnalyzer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub serial_number: Option<String>,
    pub firmware_version: String,
    pub adoms: Vec<String>,
    pub device_count: i32,
    pub log_rate_per_sec: Option<i32>,
    pub storage_used_gb: Option<f64>,
    pub storage_total_gb: Option<f64>,
    pub retention_days: i32,
    pub ha_mode: String,
    pub ha_peer: Option<Thing>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Broadcom - Secure Web Gateway
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcomSwg {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub firmware_version: String,
    pub mode: String,
    pub deployment: String,
    pub max_users: Option<i32>,
    pub active_users: i32,
    pub throughput_mbps: Option<i32>,
    pub management_ip: Option<String>,
    pub director: Option<Thing>,
    pub cluster: Option<String>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Broadcom - SWG Director
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcomSwgDirector {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub firmware_version: String,
    pub managed_appliance_count: i32,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Broadcom - SWG Policy
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcomSwgPolicy {
    pub id: Option<Thing>,
    pub swg: Option<Thing>,
    pub director: Option<Thing>,
    pub name: String,
    pub layer: String,
    pub order: i32,
    pub source: JsonValue,
    pub destination: JsonValue,
    pub action: String,
    pub ssl_inspection: bool,
    pub threat_protection: bool,
    pub dlp_enabled: bool,
    pub logging: bool,
    pub status: String,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Broadcom - URL Category
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcomUrlCategory {
    pub id: Option<Thing>,
    pub name: String,
    pub category_type: String,
    pub parent_category: Option<String>,
    pub risk_level: String,
    pub urls: Vec<String>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
