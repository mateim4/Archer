// Migration Planning Wizard Data Models
// Complete type definitions for migration project management

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// =============================================================================
// PROJECT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardProject {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub status: ProjectStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    // RVTools data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rvtools_filename: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rvtools_upload_date: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rvtools_file_path: Option<String>,
    
    // Metadata
    pub total_vms: i32,
    pub total_clusters: i32,
    pub wizard_step: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProjectStatus {
    Draft,
    InProgress,
    Completed,
    Archived,
}

// =============================================================================
// VM MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardVM {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub powerstate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template: Option<bool>,
    
    // Resources
    pub cpus: i32,
    pub memory_mb: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provisioned_mb: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub in_use_mb: Option<i32>,
    
    // Network
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primary_ip_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dns_name: Option<String>,
    
    // Cluster info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cluster: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub datacenter: Option<String>,
    
    // OS info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    
    // Storage
    pub num_disks: i32,
    pub num_nics: i32,
    
    // Annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annotation: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// CLUSTER MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardCluster {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    // Hardware specs
    pub cpu_ghz: f64,
    pub total_cores: i32,
    pub memory_gb: i32,
    pub storage_tb: f64,
    
    // Network specs
    pub network_bandwidth_gbps: f64,
    
    // Oversubscription
    pub cpu_oversubscription_ratio: f64,
    pub memory_oversubscription_ratio: f64,
    
    // Strategy
    pub strategy: String,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// =============================================================================
// PLACEMENT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardPlacement {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub vm_id: Thing,
    pub cluster_id: Thing,
    
    // Strategy
    pub strategy: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence_score: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warnings: Option<Vec<String>>,
    
    // Resource allocation
    pub allocated_cpu: i32,
    pub allocated_memory_mb: i32,
    pub allocated_storage_gb: f64,
    
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// NETWORK MAPPING MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardNetworkMapping {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    
    // Source network
    pub source_vlan_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_vlan_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_subnet: Option<String>,
    
    // Destination network
    pub destination_vlan_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_vlan_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_subnet: Option<String>,
    
    // Gateway and DNS
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_gateway: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_dns: Option<Vec<String>>,
    
    // Validation
    pub is_valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub validation_errors: Option<Vec<String>>,
    
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// NETWORK TOPOLOGY MODELS
// =============================================================================

/// Virtual Switch (VMware vSwitch, Hyper-V vSwitch, Nutanix OVS)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualSwitch {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    
    pub name: String,
    pub switch_type: SwitchType,
    pub vendor: NetworkVendor,
    pub mtu: i32,
    pub num_ports: i32,
    
    // Physical uplinks
    pub uplinks: Vec<String>,              // vmnic0, vmnic1, etc.
    
    // Port groups/networks
    pub port_groups: Vec<String>,
    
    // Load balancing and failover
    #[serde(skip_serializing_if = "Option::is_none")]
    pub load_balancing_policy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failover_order: Option<Vec<String>>,
    
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SwitchType {
    VmwareStandard,
    VmwareDistributed,
    HyperVExternal,
    HyperVInternal,
    HyperVPrivate,
    HyperVSet,                            // Switch Embedded Teaming
    NutanixOvs,                           // Open vSwitch
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NetworkVendor {
    Vmware,
    HyperV,
    Nutanix,
    Generic,
}

/// Port Group (VMware) / Virtual Network (Hyper-V) / Network (Nutanix)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortGroup {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    
    pub name: String,
    pub vswitch_name: String,
    pub vlan_id: i32,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vlan_type: Option<String>,        // None, VLAN, PVLAN, Trunk
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subnet: Option<String>,           // 192.168.1.0/24
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gateway: Option<String>,
    
    pub num_vms: i32,
    pub purpose: NetworkPurpose,
    
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NetworkPurpose {
    Management,
    Production,
    Storage,
    Migration,
    Vmotion,
    Replication,
    Backup,
    Other,
}

/// Physical NIC (vmnic for VMware, NIC for Hyper-V)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalNIC {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    
    pub name: String,                     // vmnic0, Ethernet 1, etc.
    pub host_name: String,                // ESXi host or Hyper-V host
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    
    pub speed_mbps: i32,                  // 1000, 10000, 25000, etc.
    pub duplex: String,                   // Full, Half
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub driver: Option<String>,           // ixgbe, vmxnet3, etc.
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vswitch_name: Option<String>,     // Connected vSwitch
    
    pub status: String,                   // Connected, Disconnected
    
    pub created_at: DateTime<Utc>,
}

/// VMkernel Port (VMware) / Management vNIC (Hyper-V)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VMKernelPort {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    
    pub name: String,                     // vmk0, vmk1, Management vNIC
    pub host_name: String,
    pub port_group_name: String,
    
    pub ip_address: String,
    pub subnet_mask: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gateway: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    
    pub mtu: i32,
    
    // Services enabled
    pub vmotion_enabled: bool,
    pub management_enabled: bool,
    pub ft_logging_enabled: bool,
    pub vsan_enabled: bool,
    pub replication_enabled: bool,
    
    pub created_at: DateTime<Utc>,
}

/// VM Network Adapter (vNIC)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VMNetworkAdapter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub vm_id: Thing,
    
    pub adapter_name: String,             // Network adapter 1, eth0
    pub network_name: String,             // Port group or Virtual Network name
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vlan_id: Option<i32>,
    
    pub adapter_type: String,             // vmxnet3, E1000, Synthetic, etc.
    pub connected: bool,
    pub started: bool,
    
    pub created_at: DateTime<Utc>,
}

/// Network Topology (Complete graph structure for visualization)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkTopology {
    pub project_id: String,
    pub vendor: NetworkVendor,
    
    pub vswitches: Vec<VirtualSwitch>,
    pub port_groups: Vec<PortGroup>,
    pub physical_nics: Vec<PhysicalNIC>,
    pub vmkernel_ports: Vec<VMKernelPort>,
    pub vm_adapters: Vec<VMNetworkAdapter>,
    
    pub statistics: NetworkStatistics,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatistics {
    pub total_vswitches: i32,
    pub total_port_groups: i32,
    pub total_vlans: i32,
    pub total_physical_nics: i32,
    pub total_vmkernel_ports: i32,
    pub total_vm_adapters: i32,
    pub total_unique_ips: i32,
}

// =============================================================================
// NETWORK VISUALIZATION MODELS (for visx)
// =============================================================================

/// Network visualization data for frontend (visx-compatible)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkVisualizationData {
    pub nodes: Vec<NetworkNode>,
    pub links: Vec<NetworkLink>,
    pub metadata: VisualizationMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkNode {
    pub id: String,
    pub node_type: NodeType,
    pub label: String,
    pub data: NetworkNodeData,
    pub position: NodePosition,
    pub color: String,
    pub size: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    PhysicalNic,
    VSwitch,
    PortGroup,
    VmKernelPort,
    VmNic,
    Host,
    Vm,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkNodeData {
    pub name: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vlan: Option<i32>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_address: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub purpose: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port_number: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speed: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vendor: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mac_address: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subnet: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodePosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkLink {
    pub source: String,
    pub target: String,
    pub link_type: LinkType,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bandwidth: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LinkType {
    Physical,
    Virtual,
    Mapping,
    Uplink,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualizationMetadata {
    pub source_vendor: String,
    pub dest_vendor: Option<String>,
    pub total_vlans: i32,
    pub total_ips: i32,
    pub total_nodes: i32,
    pub total_links: i32,
}

// =============================================================================
// NETWORK VARIABLE DOCUMENTATION MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkVariableDocumentation {
    pub variables: Vec<NetworkVariable>,
    pub total_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkVariable {
    pub rvtools_column: String,
    pub our_variable: String,
    pub data_type: String,
    pub purpose: String,
    pub used_in: Vec<String>,
    pub example_value: String,
    pub vendor_specific: bool,
    pub required: bool,
}

// =============================================================================
// REQUEST/RESPONSE MODELS
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateProjectResponse {
    pub id: String,
    pub name: String,
    pub status: ProjectStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UploadRVToolsRequest {
    pub filename: String,
    // File data will come from multipart form data
}

#[derive(Debug, Serialize)]
pub struct UploadRVToolsResponse {
    pub project_id: String,
    pub filename: String,
    pub total_vms: i32,
    pub upload_date: DateTime<Utc>,
    pub processing_status: String,
}

#[derive(Debug, Serialize)]
pub struct ListProjectsResponse {
    pub projects: Vec<MigrationWizardProject>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ProjectDetailsResponse {
    pub project: MigrationWizardProject,
    pub vms: Vec<MigrationWizardVM>,
    pub clusters: Vec<MigrationWizardCluster>,
}

#[derive(Debug, Serialize)]
pub struct ListVMsResponse {
    pub vms: Vec<MigrationWizardVM>,
    pub total: usize,
}

// =============================================================================
// FILTER MODELS
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct ProjectFilter {
    pub status: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct VMFilter {
    pub cluster: Option<String>,
    pub powerstate: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

// =============================================================================
// STRATEGY ANALYSIS MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyRecommendation {
    pub vm_name: String,
    pub strategy: String, // "lift_shift", "replatform", "rehost"
    pub confidence_score: f64, // 0-100
    pub warnings: Vec<String>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyStats {
    pub total_vms: usize,
    pub lift_shift_count: usize,
    pub replatform_count: usize,
    pub rehost_count: usize,
    pub average_confidence_score: f64,
    pub total_warnings: usize,
}

#[derive(Debug, Serialize)]
pub struct AnalyzeProjectStrategyResponse {
    pub recommendations: Vec<StrategyRecommendation>,
    pub stats: StrategyStats,
}

// =============================================================================
// PLACEMENT REQUEST/RESPONSE MODELS
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct AutoPlacementRequest {
    pub strategy: Option<String>, // Optional: prefer specific strategy
}

#[derive(Debug, Deserialize)]
pub struct ManualPlacementRequest {
    pub vm_id: String,
    pub cluster_id: String,
    pub strategy: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PlacementResult {
    pub placement: MigrationWizardPlacement,
    pub is_valid: bool,
    pub warnings: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct AutoPlacementResponse {
    pub placements: Vec<PlacementResult>,
    pub total_placed: usize,
    pub total_unplaced: usize,
    pub cluster_utilization: Vec<ClusterUtilization>,
}

#[derive(Debug, Serialize)]
pub struct ClusterUtilization {
    pub cluster_id: String,
    pub cluster_name: String,
    pub cpu_used: i32,
    pub cpu_total: i32,
    pub cpu_percent: f64,
    pub memory_used_mb: i32,
    pub memory_total_mb: i32,
    pub memory_percent: f64,
    pub storage_used_gb: f64,
    pub storage_total_gb: f64,
    pub storage_percent: f64,
    pub vm_count: usize,
}

// =============================================================================
// NETWORK MAPPING REQUEST/RESPONSE MODELS
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateNetworkMappingRequest {
    pub source_vlan_name: String,
    pub source_vlan_id: Option<i32>,
    pub source_subnet: Option<String>,
    pub destination_vlan_name: String,
    pub destination_vlan_id: Option<i32>,
    pub destination_subnet: Option<String>,
    pub destination_gateway: Option<String>,
    pub destination_dns: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct NetworkMappingResponse {
    pub id: String,
    pub project_id: String,
    pub source_vlan_name: String,
    pub source_vlan_id: Option<i32>,
    pub source_subnet: Option<String>,
    pub destination_vlan_name: String,
    pub destination_vlan_id: Option<i32>,
    pub destination_subnet: Option<String>,
    pub destination_gateway: Option<String>,
    pub destination_dns: Option<Vec<String>>,
    pub is_valid: bool,
    pub validation_errors: Option<Vec<String>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct NetworkMappingListResponse {
    pub mappings: Vec<NetworkMappingResponse>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct NetworkValidationResult {
    pub is_valid: bool,
    pub total_mappings: usize,
    pub valid_mappings: usize,
    pub invalid_mappings: usize,
    pub errors: Vec<NetworkValidationError>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct NetworkValidationError {
    pub mapping_id: String,
    pub error_type: NetworkErrorType,
    pub message: String,
    pub affected_field: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum NetworkErrorType {
    VlanConflict,
    SubnetOverlap,
    InvalidIpRange,
    MissingGateway,
    UnreachableDns,
    DuplicateMapping,
}

#[derive(Debug, Serialize)]
pub struct NetworkTopologyResponse {
    pub topology: NetworkTopology,
}

#[derive(Debug, Serialize)]
pub struct MermaidDiagramResponse {
    pub diagram_code: String,
    pub diagram_type: String,
    pub generated_at: DateTime<Utc>,
}


