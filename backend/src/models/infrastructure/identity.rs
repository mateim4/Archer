//! Active Directory Identity Infrastructure Models
//!
//! Type definitions for Active Directory forests, domains, domain controllers,
//! organizational units, users, groups, computers, and Group Policy Objects.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use surrealdb::sql::Thing;

// ============================================================================
// AD Forest
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdForest {
    pub id: Option<Thing>,
    pub name: String,
    pub forest_root_domain: String,
    pub forest_functional_level: String,
    pub schema_master: Option<String>,
    pub domain_naming_master: Option<String>,
    pub global_catalog_servers: Vec<String>,
    pub sites: Vec<String>,
    pub trusts: Vec<JsonValue>,
    pub cmdb_service: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD Domain
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdDomain {
    pub id: Option<Thing>,
    pub forest: Thing,
    pub name: String,
    pub dns_name: String,
    pub netbios_name: String,
    pub domain_functional_level: String,
    pub parent_domain: Option<Thing>,
    pub is_forest_root: bool,
    pub pdc_emulator: Option<String>,
    pub rid_master: Option<String>,
    pub infrastructure_master: Option<String>,
    pub user_count: i32,
    pub computer_count: i32,
    pub group_count: i32,
    pub ou_count: i32,
    pub gpo_count: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD Domain Controller
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdDomainController {
    pub id: Option<Thing>,
    pub domain: Thing,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub os_version: String,
    pub site: String,
    pub is_global_catalog: bool,
    pub is_read_only: bool,
    pub holds_schema_master: bool,
    pub holds_domain_naming_master: bool,
    pub holds_pdc_emulator: bool,
    pub holds_rid_master: bool,
    pub holds_infrastructure_master: bool,
    pub replication_partners: Vec<String>,
    pub last_replication: Option<DateTime<Utc>>,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD Organizational Unit
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdOu {
    pub id: Option<Thing>,
    pub domain: Thing,
    pub name: String,
    pub distinguished_name: String,
    pub parent_ou: Option<Thing>,
    pub description: Option<String>,
    pub protected_from_deletion: bool,
    pub linked_gpos: Vec<String>,
    pub user_count: i32,
    pub computer_count: i32,
    pub group_count: i32,
    pub child_ou_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD User
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdUser {
    pub id: Option<Thing>,
    pub domain: Thing,
    pub ou: Option<Thing>,
    pub sam_account_name: String,
    pub user_principal_name: String,
    pub distinguished_name: String,
    pub display_name: Option<String>,
    pub given_name: Option<String>,
    pub surname: Option<String>,
    pub email: Option<String>,
    pub title: Option<String>,
    pub department: Option<String>,
    pub manager: Option<Thing>,
    pub member_of: Vec<String>,
    pub enabled: bool,
    pub locked_out: bool,
    pub password_never_expires: bool,
    pub password_last_set: Option<DateTime<Utc>>,
    pub last_logon: Option<DateTime<Utc>>,
    pub account_expires: Option<DateTime<Utc>>,
    pub when_created: Option<DateTime<Utc>>,
    pub when_changed: Option<DateTime<Utc>>,
    pub is_service_account: bool,
    pub service_principal_names: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD Group
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdGroup {
    pub id: Option<Thing>,
    pub domain: Thing,
    pub ou: Option<Thing>,
    pub name: String,
    pub sam_account_name: String,
    pub distinguished_name: String,
    pub description: Option<String>,
    pub group_scope: String,
    pub group_category: String,
    pub member_count: i32,
    pub members: Vec<String>,
    pub member_of: Vec<String>,
    pub managed_by: Option<String>,
    pub when_created: Option<DateTime<Utc>>,
    pub when_changed: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD Computer
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdComputer {
    pub id: Option<Thing>,
    pub domain: Thing,
    pub ou: Option<Thing>,
    pub name: String,
    pub sam_account_name: String,
    pub dns_hostname: Option<String>,
    pub distinguished_name: String,
    pub operating_system: Option<String>,
    pub operating_system_version: Option<String>,
    pub operating_system_service_pack: Option<String>,
    pub member_of: Vec<String>,
    pub enabled: bool,
    pub last_logon: Option<DateTime<Utc>>,
    pub when_created: Option<DateTime<Utc>>,
    pub when_changed: Option<DateTime<Utc>>,
    pub cmdb_server: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// AD Group Policy Object
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdGpo {
    pub id: Option<Thing>,
    pub domain: Thing,
    pub name: String,
    pub display_name: String,
    pub guid: String,
    pub description: Option<String>,
    pub gpo_status: String,
    pub wmi_filter: Option<String>,
    pub linked_ous: Vec<String>,
    pub link_enabled: bool,
    pub enforced: bool,
    pub user_version: i32,
    pub computer_version: i32,
    pub when_created: Option<DateTime<Utc>>,
    pub when_changed: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
