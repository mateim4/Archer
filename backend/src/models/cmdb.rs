// Archer ITSM - CMDB Asset Models (Phase 2)
// Configuration Management Database with graph relationships

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use std::collections::HashMap;

// ============================================================================
// CONFIGURATION ITEM (CI) - Base Model
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigurationItem {
    pub id: Option<Thing>,
    /// Unique CI identifier (e.g., "SRV-001", "APP-PAYROLL")
    pub ci_id: String,
    pub name: String,
    pub description: Option<String>,
    pub ci_class: CIClass,
    pub ci_type: String,
    pub status: CIStatus,
    pub criticality: CICriticality,
    /// Environment (Production, Development, Test, etc.)
    pub environment: Option<String>,
    /// Location/Data center
    pub location: Option<String>,
    /// Owner (user ID)
    pub owner_id: Option<String>,
    pub owner_name: Option<String>,
    /// Support group
    pub support_group: Option<String>,
    /// Vendor/Manufacturer
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    /// Version (for software CIs)
    pub version: Option<String>,
    /// IP Address (for network-connected CIs)
    pub ip_address: Option<String>,
    /// FQDN
    pub fqdn: Option<String>,
    /// Custom attributes stored as JSON
    pub attributes: HashMap<String, serde_json::Value>,
    /// Discovery source (manual, discovery tool, import)
    pub discovery_source: DiscoverySource,
    pub discovery_id: Option<String>,
    pub last_discovered: Option<DateTime<Utc>>,
    /// Lifecycle dates
    pub install_date: Option<DateTime<Utc>>,
    pub warranty_expiry: Option<DateTime<Utc>>,
    pub end_of_life: Option<DateTime<Utc>>,
    pub decommission_date: Option<DateTime<Utc>>,
    /// Tags for categorization
    pub tags: Vec<String>,
    /// Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub updated_by: String,
    pub tenant_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CIClass {
    #[serde(rename = "HARDWARE")]
    Hardware,
    #[serde(rename = "SOFTWARE")]
    Software,
    #[serde(rename = "SERVICE")]
    Service,
    #[serde(rename = "DOCUMENT")]
    Document,
    #[serde(rename = "NETWORK")]
    Network,
    #[serde(rename = "CLOUD")]
    Cloud,
    #[serde(rename = "CONTAINER")]
    Container,
    #[serde(rename = "DATABASE")]
    Database,
    #[serde(rename = "VIRTUAL")]
    Virtual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CIStatus {
    #[serde(rename = "PLANNED")]
    Planned,
    #[serde(rename = "ORDERED")]
    Ordered,
    #[serde(rename = "RECEIVED")]
    Received,
    #[serde(rename = "IN_STOCK")]
    InStock,
    #[serde(rename = "DEPLOYED")]
    Deployed,
    #[serde(rename = "ACTIVE")]
    Active,
    #[serde(rename = "MAINTENANCE")]
    Maintenance,
    #[serde(rename = "RETIRED")]
    Retired,
    #[serde(rename = "DISPOSED")]
    Disposed,
    #[serde(rename = "MISSING")]
    Missing,
}

impl Default for CIStatus {
    fn default() -> Self {
        CIStatus::Active
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CICriticality {
    #[serde(rename = "CRITICAL")]
    Critical,     // Business critical, maximum impact
    #[serde(rename = "HIGH")]
    High,         // Important, significant impact
    #[serde(rename = "MEDIUM")]
    Medium,       // Standard importance
    #[serde(rename = "LOW")]
    Low,          // Minimal impact
    #[serde(rename = "NONE")]
    None,         // No business impact
}

impl Default for CICriticality {
    fn default() -> Self {
        CICriticality::Medium
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DiscoverySource {
    #[serde(rename = "MANUAL")]
    Manual,
    #[serde(rename = "DISCOVERY")]
    Discovery,
    #[serde(rename = "IMPORT")]
    Import,
    #[serde(rename = "API")]
    Api,
    #[serde(rename = "MONITORING")]
    Monitoring,
}

impl Default for DiscoverySource {
    fn default() -> Self {
        DiscoverySource::Manual
    }
}

// ============================================================================
// CI RELATIONSHIPS (Graph Edges)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CIRelationship {
    pub id: Option<Thing>,
    /// Source CI
    pub source_id: Thing,
    /// Target CI
    pub target_id: Thing,
    /// Relationship type
    pub relationship_type: RelationshipType,
    /// Direction of dependency
    pub direction: RelationshipDirection,
    /// Additional context
    pub description: Option<String>,
    /// Is this an active/valid relationship
    pub is_active: bool,
    /// Discovery source
    pub discovery_source: DiscoverySource,
    /// Audit
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RelationshipType {
    // Dependency relationships
    #[serde(rename = "DEPENDS_ON")]
    DependsOn,
    #[serde(rename = "REQUIRED_BY")]
    RequiredBy,
    
    // Containment relationships
    #[serde(rename = "CONTAINS")]
    Contains,
    #[serde(rename = "CONTAINED_BY")]
    ContainedBy,
    #[serde(rename = "RUNS_ON")]
    RunsOn,
    #[serde(rename = "HOSTS")]
    Hosts,
    
    // Network relationships
    #[serde(rename = "CONNECTS_TO")]
    ConnectsTo,
    #[serde(rename = "CONNECTED_FROM")]
    ConnectedFrom,
    
    // Logical relationships
    #[serde(rename = "USES")]
    Uses,
    #[serde(rename = "USED_BY")]
    UsedBy,
    #[serde(rename = "PROVIDES")]
    Provides,
    #[serde(rename = "CONSUMES")]
    Consumes,
    
    // Component relationships
    #[serde(rename = "MEMBER_OF")]
    MemberOf,
    #[serde(rename = "HAS_MEMBER")]
    HasMember,
    
    // Backup/DR relationships
    #[serde(rename = "BACKUP_OF")]
    BackupOf,
    #[serde(rename = "REPLICATED_TO")]
    ReplicatedTo,
    
    // Documentation
    #[serde(rename = "DOCUMENTED_BY")]
    DocumentedBy,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RelationshipDirection {
    #[serde(rename = "OUTBOUND")]
    Outbound,  // Source depends on Target
    #[serde(rename = "INBOUND")]
    Inbound,   // Target depends on Source
    #[serde(rename = "BIDIRECTIONAL")]
    Bidirectional,
}

// ============================================================================
// SPECIALIZED CI TYPES
// ============================================================================

/// Server CI with hardware-specific attributes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerCI {
    #[serde(flatten)]
    pub base: ConfigurationItem,
    pub cpu_count: Option<i32>,
    pub cpu_model: Option<String>,
    pub memory_gb: Option<i32>,
    pub storage_gb: Option<i32>,
    pub os_name: Option<String>,
    pub os_version: Option<String>,
    pub is_virtual: bool,
    pub hypervisor: Option<String>,
    pub cluster_name: Option<String>,
}

/// Application/Software CI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationCI {
    #[serde(flatten)]
    pub base: ConfigurationItem,
    pub app_type: ApplicationType,
    pub language: Option<String>,
    pub framework: Option<String>,
    pub port: Option<i32>,
    pub url: Option<String>,
    pub repository_url: Option<String>,
    pub documentation_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ApplicationType {
    #[serde(rename = "WEB")]
    Web,
    #[serde(rename = "API")]
    Api,
    #[serde(rename = "BATCH")]
    Batch,
    #[serde(rename = "DESKTOP")]
    Desktop,
    #[serde(rename = "MOBILE")]
    Mobile,
    #[serde(rename = "SERVICE")]
    Service,
    #[serde(rename = "DATABASE")]
    Database,
    #[serde(rename = "MIDDLEWARE")]
    Middleware,
}

/// Network Device CI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkDeviceCI {
    #[serde(flatten)]
    pub base: ConfigurationItem,
    pub device_type: NetworkDeviceType,
    pub mac_address: Option<String>,
    pub management_ip: Option<String>,
    pub firmware_version: Option<String>,
    pub port_count: Option<i32>,
    pub vlan_ids: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NetworkDeviceType {
    #[serde(rename = "SWITCH")]
    Switch,
    #[serde(rename = "ROUTER")]
    Router,
    #[serde(rename = "FIREWALL")]
    Firewall,
    #[serde(rename = "LOAD_BALANCER")]
    LoadBalancer,
    #[serde(rename = "ACCESS_POINT")]
    AccessPoint,
    #[serde(rename = "VPN")]
    Vpn,
}

/// Cloud Resource CI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudResourceCI {
    #[serde(flatten)]
    pub base: ConfigurationItem,
    pub cloud_provider: CloudProvider,
    pub resource_type: String,
    pub resource_id: String,
    pub region: String,
    pub availability_zone: Option<String>,
    pub account_id: Option<String>,
    pub subscription_id: Option<String>,
    pub resource_group: Option<String>,
    pub monthly_cost: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CloudProvider {
    #[serde(rename = "AWS")]
    Aws,
    #[serde(rename = "AZURE")]
    Azure,
    #[serde(rename = "GCP")]
    Gcp,
    #[serde(rename = "ORACLE")]
    Oracle,
    #[serde(rename = "IBM")]
    Ibm,
    #[serde(rename = "PRIVATE")]
    Private,
}

// ============================================================================
// CI HISTORY/AUDIT
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CIHistory {
    pub id: Option<Thing>,
    pub ci_id: Thing,
    pub change_type: CIChangeType,
    pub field_name: Option<String>,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub change_reason: Option<String>,
    pub changed_by: String,
    pub changed_by_name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CIChangeType {
    #[serde(rename = "CREATE")]
    Create,
    #[serde(rename = "UPDATE")]
    Update,
    #[serde(rename = "DELETE")]
    Delete,
    #[serde(rename = "STATUS_CHANGE")]
    StatusChange,
    #[serde(rename = "RELATIONSHIP_ADD")]
    RelationshipAdd,
    #[serde(rename = "RELATIONSHIP_REMOVE")]
    RelationshipRemove,
    #[serde(rename = "DISCOVERY")]
    Discovery,
}

// ============================================================================
// REQUEST/RESPONSE MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCIRequest {
    pub ci_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub ci_class: CIClass,
    pub ci_type: String,
    #[serde(default)]
    pub status: CIStatus,
    #[serde(default)]
    pub criticality: CICriticality,
    pub environment: Option<String>,
    pub location: Option<String>,
    pub owner_id: Option<String>,
    pub support_group: Option<String>,
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub version: Option<String>,
    pub ip_address: Option<String>,
    pub fqdn: Option<String>,
    #[serde(default)]
    pub attributes: HashMap<String, serde_json::Value>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub install_date: Option<DateTime<Utc>>,
    pub warranty_expiry: Option<DateTime<Utc>>,
    pub end_of_life: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCIRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub ci_type: Option<String>,
    pub status: Option<CIStatus>,
    pub criticality: Option<CICriticality>,
    pub environment: Option<String>,
    pub location: Option<String>,
    pub owner_id: Option<String>,
    pub support_group: Option<String>,
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub serial_number: Option<String>,
    pub version: Option<String>,
    pub ip_address: Option<String>,
    pub fqdn: Option<String>,
    pub attributes: Option<HashMap<String, serde_json::Value>>,
    pub tags: Option<Vec<String>>,
    pub install_date: Option<DateTime<Utc>>,
    pub warranty_expiry: Option<DateTime<Utc>>,
    pub end_of_life: Option<DateTime<Utc>>,
    pub change_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRelationshipRequest {
    pub source_id: String,
    pub target_id: String,
    pub relationship_type: RelationshipType,
    #[serde(default = "default_direction")]
    pub direction: RelationshipDirection,
    pub description: Option<String>,
}

fn default_direction() -> RelationshipDirection {
    RelationshipDirection::Outbound
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CISearchRequest {
    pub query: Option<String>,
    pub ci_class: Option<CIClass>,
    pub ci_type: Option<String>,
    pub status: Option<Vec<CIStatus>>,
    pub criticality: Option<Vec<CICriticality>>,
    pub environment: Option<String>,
    pub location: Option<String>,
    pub owner_id: Option<String>,
    pub support_group: Option<String>,
    pub tags: Option<Vec<String>>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CIListResponse {
    pub items: Vec<ConfigurationItem>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CIDetailResponse {
    pub ci: ConfigurationItem,
    pub relationships: Vec<CIRelationshipExpanded>,
    pub history: Vec<CIHistory>,
    pub linked_tickets: Vec<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CIRelationshipExpanded {
    pub relationship: CIRelationship,
    pub related_ci: ConfigurationItem,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactAnalysisRequest {
    pub ci_id: String,
    pub depth: Option<u32>,
    pub relationship_types: Option<Vec<RelationshipType>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactAnalysisResponse {
    pub source_ci: ConfigurationItem,
    pub impacted_cis: Vec<ImpactedCI>,
    pub total_impact_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactedCI {
    pub ci: ConfigurationItem,
    pub distance: u32,
    pub path: Vec<String>,
    pub relationship_type: RelationshipType,
}
