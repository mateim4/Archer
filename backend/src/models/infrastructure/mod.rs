//! LCMDesigner - Infrastructure Data Models
//! 
//! This module contains type-safe Rust struct definitions for all infrastructure objects
//! tracked in the SurrealDB schema. These models map directly to the database tables
//! and are used for serialization/deserialization via serde.
//!
//! # Organization
//! - `core`: Generic CMDB abstraction types and graph relationships
//! - `nutanix`: Nutanix HCI infrastructure (Prism Central, clusters, VMs, storage)
//! - `cisco`: Cisco network infrastructure (Catalyst Center, switches, ISE, FMC)
//! - `security`: Fortinet and Broadcom SWG security appliances
//! - `f5`: F5 BIG-IP load balancers
//! - `monitoring`: Splunk and Nagios monitoring infrastructure
//! - `identity`: Active Directory forest, domains, users, GPOs
//! - `apps`: IBM WebSphere and Red Hat OpenShift
//! - `backup`: Veeam backup infrastructure
//! - `kvm`: Avocent KVM, PDU, and console servers

pub mod core;
pub mod nutanix;
pub mod cisco;
pub mod security;
pub mod f5;
pub mod monitoring;
pub mod identity;
pub mod apps;
pub mod backup;
pub mod kvm;

// Re-export common types
pub use core::*;
