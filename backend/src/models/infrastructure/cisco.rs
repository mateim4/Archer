//! Cisco Network Infrastructure Models
//!
//! Type definitions for Cisco networking infrastructure including:
//! - Catalyst Center (DNA Center) for network management
//! - Switches and interfaces
//! - Firepower Management Center (FMC) and FTD firewalls
//! - Identity Services Engine (ISE)

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// Catalyst Center (DNA Center)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoCatalystCenter {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub cluster_mode: bool,
    pub cluster_nodes: Vec<String>,
    pub device_count: i32,
    pub site_count: i32,
    pub license_level: String,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Switch
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoSwitch {
    pub id: Option<Thing>,
    pub catalyst_center: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub management_ip: String,
    pub model: String,
    pub serial_number: String,
    pub platform_id: Option<String>,
    pub ios_version: String,
    pub ios_type: String,
    pub uptime_seconds: Option<i64>,
    pub role: String,
    pub is_stack: bool,
    pub stack_member_count: i32,
    pub total_ports: i32,
    pub used_ports: i32,
    pub poe_capable: bool,
    pub poe_budget_watts: Option<i32>,
    pub poe_used_watts: Option<i32>,
    pub vtp_domain: Option<String>,
    pub vtp_mode: Option<String>,
    pub spanning_tree_mode: Option<String>,
    pub location: Option<String>,
    pub site: Option<String>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Switch Interface
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoSwitchInterface {
    pub id: Option<Thing>,
    pub switch: Thing,
    pub name: String,
    pub description: Option<String>,
    pub interface_type: String,
    pub speed: Option<String>,
    pub duplex: Option<String>,
    pub mtu: i32,
    pub mac_address: Option<String>,
    pub admin_status: String,
    pub oper_status: String,
    pub switchport_mode: String,
    pub access_vlan: Option<i32>,
    pub voice_vlan: Option<i32>,
    pub native_vlan: Option<i32>,
    pub allowed_vlans: Vec<i32>,
    pub port_channel: Option<String>,
    pub spanning_tree_portfast: bool,
    pub spanning_tree_guard: Option<String>,
    pub poe_enabled: bool,
    pub poe_power_watts: Option<f64>,
    pub connected_device: Option<String>,
    pub connected_port: Option<String>,
    pub input_rate_bps: Option<i64>,
    pub output_rate_bps: Option<i64>,
    pub input_errors: i64,
    pub output_errors: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// VLAN
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoVlan {
    pub id: Option<Thing>,
    pub switch: Thing,
    pub vlan_id: i32,
    pub name: String,
    pub status: String,
    pub vlan_type: String,
    pub mtu: i32,
    pub svi_ip: Option<String>,
    pub svi_mask: Option<String>,
    pub svi_status: Option<String>,
    pub hsrp_group: Option<i32>,
    pub hsrp_vip: Option<String>,
    pub dhcp_snooping: bool,
    pub private_vlan_type: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Port Channel
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoPortChannel {
    pub id: Option<Thing>,
    pub switch: Thing,
    pub name: String,
    pub channel_number: i32,
    pub protocol: String,
    pub mode: String,
    pub member_interfaces: Vec<String>,
    pub admin_status: String,
    pub oper_status: String,
    pub load_balance_method: String,
    pub min_links: i32,
    pub max_links: i32,
    pub switchport_mode: Option<String>,
    pub allowed_vlans: Vec<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Firepower Management Center (FMC)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoFmc {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub ha_mode: String,
    pub ha_peer: Option<Thing>,
    pub managed_device_count: i32,
    pub policy_count: i32,
    pub license_type: String,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Firepower Threat Defense (FTD)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoFtd {
    pub id: Option<Thing>,
    pub fmc: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub management_ip: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub version: String,
    pub mode: String,
    pub ha_mode: String,
    pub ha_state: Option<String>,
    pub ha_peer: Option<Thing>,
    pub interface_count: i32,
    pub throughput_mbps: Option<i32>,
    pub ips_enabled: bool,
    pub malware_enabled: bool,
    pub url_filtering_enabled: bool,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_policy_deploy: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Access Control Policy
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoAccessPolicy {
    pub id: Option<Thing>,
    pub fmc: Thing,
    pub name: String,
    pub description: Option<String>,
    pub default_action: String,
    pub rule_count: i32,
    pub prefilter_policy: Option<String>,
    pub intrusion_policy: Option<String>,
    pub file_policy: Option<String>,
    pub ssl_policy: Option<String>,
    pub identity_policy: Option<String>,
    pub assigned_devices: Vec<Thing>,
    pub status: String,
    pub last_modified: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Identity Services Engine (ISE)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoIse {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub version: String,
    pub patch_version: Option<String>,
    pub node_type: String,
    pub personas: Vec<String>,
    pub deployment_id: Option<String>,
    pub is_primary_pan: bool,
    pub is_primary_mnt: bool,
    pub endpoint_count: i32,
    pub nad_count: i32,
    pub active_sessions: i32,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// ISE Network Access Device (NAD)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoIseNad {
    pub id: Option<Thing>,
    pub ise: Thing,
    pub name: String,
    pub ip_address: String,
    pub device_type: String,
    pub location: Option<String>,
    pub network_device_group: Vec<String>,
    pub authentication_protocol: String,
    pub coa_port: i32,
    pub snmp_version: Option<String>,
    pub profiling_enabled: bool,
    pub tacacs_enabled: bool,
    pub radius_enabled: bool,
    pub cmdb_network_device: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// ISE Endpoint
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoIseEndpoint {
    pub id: Option<Thing>,
    pub ise: Thing,
    pub mac_address: String,
    pub ip_address: Option<String>,
    pub endpoint_profile: Option<String>,
    pub identity_group: Option<String>,
    pub portal_user: Option<String>,
    pub device_type: Option<String>,
    pub hostname: Option<String>,
    pub os_type: Option<String>,
    pub static_assignment: bool,
    pub static_group_assignment: bool,
    pub nad: Option<Thing>,
    pub nas_port: Option<String>,
    pub authorization_profile: Option<String>,
    pub sgt: Option<Thing>,
    pub posture_status: Option<String>,
    pub last_seen: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Security Group Tag (SGT)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CiscoSgt {
    pub id: Option<Thing>,
    pub ise: Thing,
    pub name: String,
    pub tag_value: i32,
    pub description: Option<String>,
    pub is_propagate_to_apic: bool,
    pub generation_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
