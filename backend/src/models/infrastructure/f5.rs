//! F5 BIG-IP Load Balancer Infrastructure Models
//!
//! Type definitions for F5 BIG-IP load balancers including:
//! - BIG-IP devices (LTM, GTM, ASM, APM)
//! - VLANs, Self IPs, Nodes, Pools, Virtual Servers
//! - Monitors, Certificates, iRules

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// F5 BIG-IP Device
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5BigIp {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub mgmt_ip: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub version: String,
    pub build: Option<String>,
    pub edition: String,
    pub license_type: String,
    pub modules: Vec<String>,
    pub licensed_throughput: Option<String>,
    pub license_expiry: Option<DateTime<Utc>>,
    pub platform: String,
    pub cpu_cores: Option<i32>,
    pub memory_gb: Option<i32>,
    pub is_vcmp: bool,
    pub vcmp_host: Option<Thing>,
    pub ha_mode: String,
    pub failover_state: String,
    pub device_group: Option<String>,
    pub sync_group: Option<String>,
    pub ha_peer: Option<Thing>,
    pub config_sync_ip: Option<String>,
    pub mirroring_ip: Option<String>,
    pub partitions: Vec<String>,
    pub cmdb_asset: Option<Thing>,
    pub status: String,
    pub last_config_sync: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 VLAN
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5Vlan {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub tag: i32,
    pub interfaces: Vec<String>,
    pub failsafe: bool,
    pub failsafe_timeout: i32,
    pub mtu: i32,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 Self IP
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5SelfIp {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub address: String,
    pub netmask: String,
    pub vlan: Thing,
    pub traffic_group: String,
    pub floating: bool,
    pub allow_service: Vec<String>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 Node
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5Node {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub address: String,
    pub fqdn: Option<String>,
    pub connection_limit: i32,
    pub rate_limit: i32,
    pub ratio: i32,
    pub state: String,
    pub session: String,
    pub monitor: Option<String>,
    pub description: Option<String>,
    pub cmdb_server: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 Pool
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5Pool {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub description: Option<String>,
    pub lb_method: String,
    pub slow_ramp_time: i32,
    pub reselect_tries: i32,
    pub service_down_action: String,
    pub allow_nat: bool,
    pub allow_snat: bool,
    pub monitors: Vec<String>,
    pub min_active_members: i32,
    pub queue_on_connection_limit: bool,
    pub queue_depth_limit: i32,
    pub queue_time_limit: i32,
    pub availability_state: String,
    pub enabled_state: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 Pool Member
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5PoolMember {
    pub id: Option<Thing>,
    pub pool: Thing,
    pub node: Thing,
    pub port: i32,
    pub priority_group: i32,
    pub ratio: i32,
    pub connection_limit: i32,
    pub rate_limit: i32,
    pub state: String,
    pub session: String,
    pub monitor: Option<String>,
    pub availability_state: String,
    pub enabled_state: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 Virtual Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5VirtualServer {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub description: Option<String>,
    pub destination_address: String,
    pub destination_port: i32,
    pub destination_mask: String,
    pub default_pool: Option<Thing>,
    pub fallback_persistence: Option<String>,
    pub ip_protocol: String,
    pub vs_type: String,
    pub connection_limit: i32,
    pub rate_limit: i32,
    pub source_address_translation: String,
    pub profiles: Vec<String>,
    pub http_profile: Option<String>,
    pub ssl_client_profile: Option<String>,
    pub ssl_server_profile: Option<String>,
    pub persistence_profile: Option<String>,
    pub oneconnect_profile: Option<String>,
    pub compression_profile: Option<String>,
    pub asm_policy: Option<String>,
    pub apm_policy: Option<String>,
    pub irules: Vec<String>,
    pub traffic_group: String,
    pub vlans: Vec<String>,
    pub vlans_enabled: bool,
    pub state: String,
    pub availability_state: String,
    pub cmdb_service: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 Monitor
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5Monitor {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    #[serde(rename = "type")]
    pub monitor_type: String,
    pub description: Option<String>,
    pub interval: i32,
    pub timeout: i32,
    pub time_until_up: i32,
    pub up_interval: i32,
    pub send_string: Option<String>,
    pub receive_string: Option<String>,
    pub receive_disable_string: Option<String>,
    pub reverse: bool,
    pub transparent: bool,
    pub adaptive: bool,
    pub destination: String,
    pub is_builtin: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 SSL Certificate
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5Certificate {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub common_name: String,
    pub subject: String,
    pub issuer: String,
    pub key_type: String,
    pub key_size: i32,
    pub serial_number: String,
    pub valid_from: DateTime<Utc>,
    pub valid_to: DateTime<Utc>,
    pub subject_alternative_names: Vec<String>,
    pub is_self_signed: bool,
    pub fingerprint_sha256: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// F5 iRule
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct F5Irule {
    pub id: Option<Thing>,
    pub bigip: Thing,
    pub name: String,
    pub partition: String,
    pub api_anonymous: String,
    pub description: Option<String>,
    pub is_builtin: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
