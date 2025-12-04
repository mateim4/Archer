//! Core CMDB Abstraction Types and Graph Relationships
//!
//! This module provides the generic abstraction layer for all infrastructure objects.
//! Every vendor-specific object can link back to these generic types for unified
//! CMDB queries and relationship traversal.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// CMDB Asset - Base class for all infrastructure
// ============================================================================

/// Generic CMDB asset - the base abstraction for all infrastructure objects.
/// Every physical or virtual asset should have a corresponding cmdb_asset record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CmdbAsset {
    pub id: Option<Thing>,
    pub name: String,
    pub asset_type: String, // server, network_device, storage, appliance, vm
    pub asset_subtype: Option<String>,
    pub serial_number: Option<String>,
    pub asset_tag: Option<String>,
    pub manufacturer: Option<String>,
    pub model: Option<String>,

    // Location
    pub location: Option<String>,
    pub datacenter: Option<String>,
    pub rack: Option<String>,
    pub rack_position: Option<i32>,

    // Network
    pub primary_ip: Option<String>,
    pub hostname: Option<String>,
    pub fqdn: Option<String>,
    pub mac_address: Option<String>,

    // Ownership
    pub owner: Option<String>,
    pub department: Option<String>,
    pub cost_center: Option<String>,
    pub environment: String, // production, staging, development, test
    pub criticality: String, // critical, high, medium, low

    // Lifecycle
    pub status: String, // active, maintenance, decommissioned, disposed
    pub purchase_date: Option<DateTime<Utc>>,
    pub warranty_expiry: Option<DateTime<Utc>>,
    pub eol_date: Option<DateTime<Utc>>,
    pub eos_date: Option<DateTime<Utc>>,

    // Compliance
    pub compliance_tags: Vec<String>,
    pub notes: Option<String>,

    // Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// CMDB Server - Physical/Virtual Compute
// ============================================================================

/// Generic server representation - maps to cmdb_server table.
/// Can be physical, virtual (VM), or container-based.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CmdbServer {
    pub id: Option<Thing>,
    pub cmdb_asset: Option<Thing>, // -> cmdb_asset
    pub name: String,
    pub hostname: String,
    pub server_type: String, // physical, virtual, container

    // Hardware/Resources
    pub cpu_cores: Option<i32>,
    pub cpu_sockets: Option<i32>,
    pub memory_gb: Option<i32>,
    pub storage_gb: Option<i32>,

    // Operating System
    pub os_family: Option<String>, // windows, linux, unix
    pub os_name: Option<String>,
    pub os_version: Option<String>,
    pub kernel_version: Option<String>,

    // Network
    pub primary_ip: Option<String>,
    pub secondary_ips: Vec<String>,
    pub dns_servers: Vec<String>,
    pub domain: Option<String>,

    // Virtualization
    pub hypervisor_type: Option<String>, // nutanix, vmware, hyper-v
    pub hypervisor_host: Option<String>,
    pub cluster: Option<String>,

    // Role
    pub server_role: Vec<String>, // database, web, application, file, etc.
    pub applications: Vec<String>,

    // Status
    pub power_state: String, // on, off, suspended
    pub status: String,

    // Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// CMDB Network Device - Switches, Routers, Firewalls
// ============================================================================

/// Generic network device representation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CmdbNetworkDevice {
    pub id: Option<Thing>,
    pub cmdb_asset: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub device_type: String, // switch, router, firewall, load_balancer, wireless_controller

    // Hardware
    pub manufacturer: String,
    pub model: String,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,

    // Network
    pub management_ip: Option<String>,
    pub loopback_ip: Option<String>,
    pub total_ports: Option<i32>,
    pub used_ports: Option<i32>,

    // Switching/Routing
    pub vlans: Vec<i32>,
    pub routing_protocols: Vec<String>,
    pub is_layer3: bool,

    // High Availability
    pub ha_mode: String, // standalone, active-passive, active-active
    pub ha_peer: Option<Thing>,

    // Management
    pub managed_by: Option<String>,
    pub snmp_community: Option<String>,

    // Status
    pub status: String,
    pub last_config_backup: Option<DateTime<Utc>>,

    // Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// CMDB Application
// ============================================================================

/// Generic application representation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CmdbApplication {
    pub id: Option<Thing>,
    pub name: String,
    pub display_name: Option<String>,
    pub version: Option<String>,
    pub vendor: Option<String>,
    pub application_type: String, // web, desktop, service, batch

    // Ownership
    pub owner: Option<String>,
    pub department: Option<String>,
    pub business_criticality: String,

    // Technical
    pub technology_stack: Vec<String>,
    pub programming_languages: Vec<String>,
    pub databases: Vec<String>,
    pub ports: Vec<i32>,
    pub url: Option<String>,

    // Documentation
    pub documentation_url: Option<String>,
    pub repository_url: Option<String>,

    // Status
    pub status: String,

    // Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// CMDB Service - Business/IT Services
// ============================================================================

/// Generic IT service representation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CmdbService {
    pub id: Option<Thing>,
    pub name: String,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub service_type: String, // business, technical, infrastructure

    // Ownership
    pub service_owner: Option<String>,
    pub technical_owner: Option<String>,
    pub department: Option<String>,

    // SLA
    pub sla_tier: Option<String>,
    pub availability_target: Option<f64>,
    pub rto_hours: Option<i32>,
    pub rpo_hours: Option<i32>,

    // Status
    pub status: String,

    // Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Graph Relationship Types (Edges)
// ============================================================================

/// Manages relationship - one object manages/controls another.
/// Example: FortiManager manages FortiGate devices.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagesRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // managed object
    #[serde(rename = "out")]
    pub out_node: Thing, // manager object
    pub relationship_type: String,
    pub management_type: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Contains relationship - hierarchical containment.
/// Example: Cluster contains Hosts.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainsRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // contained object
    #[serde(rename = "out")]
    pub out_node: Thing, // container object
    pub relationship_type: String,
    pub created_at: DateTime<Utc>,
}

/// Runs on relationship - workloads running on infrastructure.
/// Example: VM runs on Host.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunsOnRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // infrastructure (host)
    #[serde(rename = "out")]
    pub out_node: Thing, // workload (vm, container)
    pub relationship_type: String,
    pub created_at: DateTime<Utc>,
}

/// Connects to relationship - network connectivity.
/// Example: Server connects to Switch.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectsToRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing,
    #[serde(rename = "out")]
    pub out_node: Thing,
    pub connection_type: String, // network, fiber, serial, kvm
    pub port_local: Option<String>,
    pub port_remote: Option<String>,
    pub bandwidth: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Member of relationship - group membership.
/// Example: User member of Group.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemberOfRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // group/cluster
    #[serde(rename = "out")]
    pub out_node: Thing, // member
    pub membership_type: String,
    pub role: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Monitors relationship - monitoring tools watching objects.
/// Example: Nagios monitors Server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorsRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // monitored object
    #[serde(rename = "out")]
    pub out_node: Thing, // monitoring system
    pub monitor_type: String, // icmp, snmp, agent, api
    pub check_interval: Option<i32>,
    pub created_at: DateTime<Utc>,
}

/// Backs up relationship - backup relationships.
/// Example: Veeam backs up VM.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacksUpRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // backed up object
    #[serde(rename = "out")]
    pub out_node: Thing, // backup system/job
    pub backup_type: String, // full, incremental, differential
    pub schedule: Option<String>,
    pub retention_days: Option<i32>,
    pub created_at: DateTime<Utc>,
}

/// Depends on relationship - service dependencies.
/// Example: Application depends on Database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependsOnRelation {
    pub id: Option<Thing>,
    #[serde(rename = "in")]
    pub in_node: Thing, // dependency (what is depended upon)
    #[serde(rename = "out")]
    pub out_node: Thing, // dependent (what depends)
    pub dependency_type: String, // hard, soft
    pub criticality: String,
    pub created_at: DateTime<Utc>,
}
