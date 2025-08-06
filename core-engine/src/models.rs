use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::collections::HashMap;

/// Represents the entire vSphere environment parsed from RVTools
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VsphereEnvironment {
    pub id: Uuid,
    pub name: String,
    pub parsed_at: DateTime<Utc>,
    pub clusters: Vec<Cluster>,
    pub standalone_hosts: Vec<Host>,
    pub total_vms: usize,
    pub total_hosts: usize,
    pub summary_metrics: EnvironmentSummary,
}

impl VsphereEnvironment {
    pub fn get_total_vm_count(&self) -> usize {
        self.total_vms
    }
    
    pub fn get_total_host_count(&self) -> usize {
        self.total_hosts
    }
    
    pub fn get_total_cpu_cores(&self) -> u32 {
        self.summary_metrics.total_pcores
    }
    
    pub fn get_total_memory_gb(&self) -> f64 {
        self.summary_metrics.total_consumed_memory_gb
    }
    
    pub fn get_total_storage_gb(&self) -> f64 {
        self.summary_metrics.total_consumed_storage_gb
    }
    
    pub fn get_powered_on_vm_count(&self) -> usize {
        self.clusters.iter()
            .flat_map(|c| &c.vms)
            .chain(self.standalone_hosts.iter().flat_map(|h| &h.vms))
            .filter(|vm| vm.power_state == PowerState::PoweredOn)
            .count()
    }
    
    pub fn get_powered_off_vm_count(&self) -> usize {
        let total = self.get_total_vm_count();
        let powered_on = self.get_powered_on_vm_count();
        total - powered_on
    }
}

// --- Project Management Models ---

/// Represents a single project, the top-level container for all related activities.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub users: Vec<String>, // Simple list of user names for now
    pub workflows: Vec<Workflow>,
    pub artifacts: Vec<ProjectArtifact>,
    pub hardware_allocations: Vec<HardwareAllocation>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// A workflow within a project, such as a migration or a new deployment.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub workflow_type: WorkflowType,
    pub stages: Vec<Stage>,
    pub created_at: DateTime<Utc>,
}

/// The type of a workflow.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowType {
    Migration,
    NewDeployment,
    Decommission,
    Lifecycle,
    Custom,
}

/// A single stage or step within a workflow.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stage {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub due_date: Option<DateTime<Utc>>,
    pub status: StageStatus,
    pub comments: Vec<Comment>,
}

/// The status of a stage.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum StageStatus {
    NotStarted,
    InProgress,
    Completed,
    Blocked,
}

/// A user comment on a stage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: Uuid,
    pub user: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

/// A file or document attached to a project.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectArtifact {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub artifact_type: ArtifactType,
    pub file_path: String, // Path relative to the project's artifact directory
    pub uploaded_at: DateTime<Utc>,
}

/// The type of a project artifact.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArtifactType {
    Design,
    NetworkTopology,
    BillOfMaterials,
    SizingResult,
    Other,
}

/// Represents the shared pool of hardware available for allocation.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HardwarePool {
    pub servers: Vec<Server>,
}

/// Represents a single server in the hardware pool.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
    pub id: Uuid,
    pub name: String,
    pub model: String,
    // Other relevant server specs...
}

/// Records the allocation of a specific server to a project for a period of time.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAllocation {
    pub id: Uuid,
    pub server_id: Uuid,
    pub project_id: Uuid,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>, // When it's expected to be free again
}

impl Project {
    pub fn new(name: String, description: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            start_date: now,
            end_date: now,
            users: vec![],
            workflows: vec![],
            artifacts: vec![],
            hardware_allocations: vec![],
            created_at: now,
            updated_at: now,
        }
    }
}

/// Summary metrics for the entire environment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentSummary {
    pub total_vcpus: u32,
    pub total_pcores: u32,
    pub total_provisioned_memory_gb: f64,
    pub total_consumed_memory_gb: f64,
    pub total_provisioned_storage_gb: f64,
    pub total_consumed_storage_gb: f64,
    pub overall_vcpu_pcpu_ratio: f32,
    pub health_issues: Vec<HealthIssue>,
}

/// Represents a vSphere cluster
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cluster {
    pub name: String,
    pub hosts: Vec<Host>,
    pub vms: Vec<VirtualMachine>,
    pub metrics: ClusterMetrics,
    pub health_status: ClusterHealth,
}

/// Cluster-level metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterMetrics {
    pub total_hosts: usize,
    pub total_vms: usize,
    pub total_pcpu_cores: u32,
    pub total_vcpus: u32,
    pub current_vcpu_pcpu_ratio: f32,
    pub total_memory_gb: u32,
    pub provisioned_memory_gb: f64,
    pub memory_overcommit_ratio: f32,
    pub total_storage_gb: f64,
    pub consumed_storage_gb: f64,
}

/// Health status for a cluster
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterHealth {
    pub zombie_vms: Vec<String>,
    pub outdated_tools: Vec<String>,
    pub rdm_vms: Vec<String>,
    pub ft_enabled_vms: Vec<String>,
    pub warnings: Vec<String>,
}

/// Represents a physical ESXi host
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Host {
    pub name: String,
    pub cluster_name: Option<String>,
    pub cpu_model: String,
    pub num_cpu_sockets: u32,
    pub cores_per_socket: u32,
    pub num_cpu_cores: u32,
    pub total_memory_gb: u32,
    pub esx_version: Option<String>,
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub connection_state: Option<String>,
    pub power_state: Option<String>,
    pub vms: Vec<VirtualMachine>,
    pub virtual_switches: Vec<VirtualSwitch>,
    pub physical_nics: Vec<PhysicalNic>,
}

/// Represents a virtual machine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualMachine {
    pub name: String,
    pub cluster_name: String,
    pub host_name: String,
    pub power_state: PowerState,
    pub num_vcpu: u32,
    pub memory_gb: u32,
    pub guest_os: Option<String>,
    pub vm_version: Option<String>,
    pub tools_status: Option<String>,
    pub tools_version: Option<String>,
    pub is_template: bool,
    pub disks: Vec<VirtualDisk>,
    pub nics: Vec<VirtualNic>,
    pub notes: Option<String>,
    pub annotation: Option<String>,
    pub folder: Option<String>,
    pub resource_pool: Option<String>,
    pub created_date: Option<DateTime<Utc>>,
    pub last_powered_on: Option<DateTime<Utc>>,
    pub special_flags: VmSpecialFlags,
}

/// VM power states
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PowerState {
    PoweredOn,
    PoweredOff,
    Suspended,
    Unknown,
}

/// Special VM flags for migration planning
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VmSpecialFlags {
    pub has_rdm: bool,
    pub ft_enabled: bool,
    pub is_zombie: bool,
    pub needs_manual_attention: bool,
    pub is_critical_workload: bool,
}

/// Represents a virtual disk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualDisk {
    pub vm_name: String,
    pub disk_label: String,
    pub provisioned_gb: f64,
    pub consumed_in_guest_gb: f64,
    pub consumed_on_datastore_gb: f64,
    pub is_rdm: bool,
    pub disk_mode: Option<String>,
    pub provisioning_type: ProvisioningType,
    pub datastore_name: Option<String>,
}

/// Disk provisioning types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProvisioningType {
    Thick,
    ThickEagerZeroed,
    Thin,
    Unknown,
}

/// Represents a virtual network interface
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualNic {
    pub vm_name: String,
    pub port_group_name: String,
    pub vlan_id: Option<u16>,
    pub network_label: Option<String>,
    pub connected: bool,
    pub nic_type: Option<String>,
    pub mac_address: Option<String>,
}


/// Health issues identified during analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthIssue {
    pub severity: Severity,
    pub category: String,
    pub description: String,
    pub affected_vm: Option<String>,
    pub affected_host: Option<String>,
    pub recommendation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Severity {
    Info,
    Warning,
    Critical,
}

/// Hardware configuration for target environment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareProfile {
    pub id: Uuid,
    pub name: String,
    pub manufacturer: String,
    pub model: String,
    pub cpu_sockets: u32,
    pub cores_per_socket: u32,
    pub total_cores: u32,
    pub max_memory_gb: u32,
    pub storage_slots: u32,
    pub network_ports: u32,
    pub is_hci_certified: bool,
    pub estimated_cost: Option<f64>,
    pub power_consumption_watts: Option<u32>,
    pub rack_units: u32,
    pub notes: Option<String>,
}

/// Sizing configuration parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizingParameters {
    pub target_vcpu_pcpu_ratio: f32,
    pub target_memory_overcommit_ratio: f32,
    pub ha_policy: HaPolicy,
    pub growth_factor_percent: f32,
    pub forecast_horizon_months: u32,
    pub cpu_reservation_percent: f32,
    pub memory_reservation_percent: f32,
    pub storage_overhead_percent: f32,
}

/// High availability policies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HaPolicy {
    None,
    NPlusOne,
    NPlusTwo,
}

/// Result of the sizing calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizingResult {
    pub hardware_profile: HardwareProfile,
    pub required_hosts: u32,
    pub total_cost: Option<f64>,
    pub utilization_metrics: UtilizationMetrics,
    pub vm_placement: HashMap<String, String>, // VM name -> Host name
    pub warnings: Vec<String>,
}

/// Utilization metrics for the sized solution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtilizationMetrics {
    pub cpu_utilization_percent: f32,
    pub memory_utilization_percent: f32,
    pub storage_utilization_percent: f32,
    pub n_plus_x_compliance: bool,
}

/// Microsoft target platform types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TargetPlatform {
    HyperVCluster,
    AzureLocal,
}

/// Translation result from VMware to Microsoft
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub source_cluster: String,
    pub target_platform: TargetPlatform,
    pub target_cluster_config: TargetClusterConfig,
    pub vm_translations: Vec<VmTranslation>,
    pub network_translations: Vec<NetworkTranslation>,
    pub manual_intervention_required: Vec<ManualInterventionItem>,
}

/// Target cluster configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetClusterConfig {
    pub cluster_name: String,
    pub hosts: Vec<TargetHost>,
    pub storage_config: StorageConfig,
    pub network_config: NetworkConfig,
    pub ha_config: HaConfig,
}

/// Target host configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetHost {
    pub name: String,
    pub hardware_profile: HardwareProfile,
    pub assigned_vms: Vec<String>,
}

/// Storage configuration for target environment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub storage_type: StorageType,
    pub total_capacity_gb: f64,
    pub usable_capacity_gb: f64,
    pub resiliency_type: ResiliencyType,
    pub csv_volumes: Vec<CsvVolume>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageType {
    StorageSpacesDirect,
    ExternalSan,
    DirectAttached,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResiliencyType {
    TwoWayMirror,
    ThreeWayMirror,
    DualParity,
    MirrorAcceleratedParity,
}

/// CSV volume configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsvVolume {
    pub name: String,
    pub size_gb: f64,
    pub file_system: String,
    pub purpose: String,
}

/// Network configuration for target environment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub virtual_switches: Vec<VirtualSwitch>,
    pub logical_networks: Vec<LogicalNetwork>,
    pub teaming_config: TeamingConfig,
}

/// Virtual switch configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualSwitch {
    pub name: String,
    pub switch_type: SwitchType,
    pub physical_adapters: Vec<String>,
    pub enable_sr_iov: bool,
    pub enable_rdma: bool,
    pub port_groups: Vec<PortGroup>,
}

/// Represents a port group on a virtual switch
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortGroup {
    pub name: String,
    pub vlan_id: u16,
}

/// Represents a physical network interface on a host
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalNic {
    pub name: String,
    pub speed_mbps: u32,
    pub mac_address: String,
    pub uplink_for_vswitch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SwitchType {
    External,
    Internal,
    Private,
}

impl SwitchType {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "external" => SwitchType::External,
            "internal" => SwitchType::Internal,
            "private" => SwitchType::Private,
            _ => SwitchType::External, // Default to external
        }
    }
}

/// Logical network definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogicalNetwork {
    pub name: String,
    pub vlan_id: Option<u16>,
    pub subnet: Option<String>,
    pub purpose: NetworkPurpose,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkPurpose {
    Management,
    VmTraffic,
    Storage,
    LiveMigration,
    Heartbeat,
}

/// NIC teaming configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamingConfig {
    pub teaming_mode: TeamingMode,
    pub load_balancing_algorithm: LoadBalancingAlgorithm,
    pub failover_mode: FailoverMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TeamingMode {
    SwitchEmbeddedTeaming,
    LoadBalancingFailover,
    Static,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoadBalancingAlgorithm {
    Dynamic,
    HyperVPort,
    SourceMac,
    TransportPorts,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FailoverMode {
    Active,
    Standby,
}

/// HA configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HaConfig {
    pub policy: HaPolicy,
    pub heartbeat_networks: Vec<String>,
    pub quorum_config: QuorumConfig,
}

/// Quorum configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuorumConfig {
    pub quorum_type: QuorumType,
    pub witness_config: Option<WitnessConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QuorumType {
    NodeMajority,
    NodeAndDiskMajority,
    NodeAndFileShareMajority,
    NodeAndCloudMajority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WitnessConfig {
    pub witness_type: WitnessType,
    pub path_or_url: String,
    pub credentials: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WitnessType {
    FileShare,
    Cloud,
    Disk,
}

/// VM translation details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmTranslation {
    pub source_vm_name: String,
    pub target_vm_name: String,
    pub target_host: String,
    pub target_vcpu: u32,
    pub target_memory_gb: u32,
    pub disk_translations: Vec<DiskTranslation>,
    pub network_translations: Vec<VmNetworkTranslation>,
    pub migration_notes: Vec<String>,
}

/// Disk translation details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskTranslation {
    pub source_disk: String,
    pub target_disk_format: DiskFormat,
    pub target_size_gb: f64,
    pub target_provisioning: TargetProvisioning,
    pub csv_volume: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiskFormat {
    Vhdx,
    Vhd,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TargetProvisioning {
    Fixed,
    Dynamic,
}

/// VM-specific network translation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmNetworkTranslation {
    pub source_port_group: String,
    pub target_virtual_switch: String,
    pub target_vlan_id: Option<u16>,
    pub adapter_name: String,
}

/// Network translation mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkTranslation {
    pub source_port_group: String,
    pub source_vlan_id: Option<u16>,
    pub target_logical_network: String,
    pub target_vlan_id: Option<u16>,
    pub affected_vms: Vec<String>,
}

/// Items requiring manual intervention
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualInterventionItem {
    pub category: InterventionCategory,
    pub description: String,
    pub affected_vm: Option<String>,
    pub recommendation: String,
    pub priority: Priority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InterventionCategory {
    RawDeviceMapping,
    FaultTolerance,
    ComplexNetworking,
    LegacyOs,
    PerformanceCritical,
    LicensingIssue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

/// TCO analysis data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TcoAnalysis {
    pub current_environment_costs: CurrentCosts,
    pub target_environment_costs: TargetCosts,
    pub savings_analysis: SavingsAnalysis,
    pub payback_period_months: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentCosts {
    pub hardware_annual: f64,
    pub software_licensing_annual: f64,
    pub datacenter_annual: f64,
    pub personnel_annual: f64,
    pub total_annual: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetCosts {
    pub hardware_acquisition: f64,
    pub software_licensing_annual: f64,
    pub implementation_services: f64,
    pub ongoing_operational_annual: f64,
    pub total_annual: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavingsAnalysis {
    pub annual_savings: f64,
    pub three_year_savings: f64,
    pub five_year_savings: f64,
    pub savings_percentage: f32,
}

// --- Universal Server Configuration Models ---

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UniversalServer {
    pub vendor: String,
    pub model_name: Option<String>,
    pub base_chassis_part_number: Option<String>,
    pub serial_number: Option<String>,
    pub cpus: Vec<CPU>,
    pub memory: Vec<MemoryDIMM>,
    pub storage_controllers: Vec<StorageController>,
    pub physical_disks: Vec<PhysicalDisk>,
    pub virtual_disks: Vec<VirtualDiskConfig>,
    pub network_adapters: Vec<NetworkAdapter>,
    pub power_supplies: Vec<PowerSupply>,
    pub management: Option<ManagementController>,
    pub services: Vec<ServiceContract>,
    pub pricing: Option<PricingInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CPU {
    pub vendor_part_number: Option<String>,
    pub model_string: Option<String>,
    pub core_count: Option<u32>,
    pub thread_count: Option<u32>,
    pub speed_ghz: Option<f32>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MemoryDIMM {
    pub vendor_part_number: Option<String>,
    pub capacity_gb: Option<u32>,
    pub speed_mhz: Option<u32>,
    pub memory_type: Option<String>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StorageController {
    pub fqdd: Option<String>,
    pub vendor_part_number: Option<String>,
    pub model: Option<String>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PhysicalDisk {
    pub fqdd: Option<String>,
    pub vendor_part_number: Option<String>,
    pub model: Option<String>,
    pub capacity_gb: Option<u32>,
    pub disk_type: Option<String>, // e.g., "SSD", "HDD"
    pub interface_type: Option<String>, // e.g., "SAS", "SATA", "NVMe"
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VirtualDiskConfig {
    pub fqdd: Option<String>,
    pub name: Option<String>,
    pub raid_level: Option<String>,
    pub member_disks: Vec<String>, // List of PhysicalDisk FQDDs
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkAdapter {
    pub fqdd: Option<String>,
    pub vendor_part_number: Option<String>,
    pub model: Option<String>,
    pub ports: Vec<NetworkPort>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkPort {
    pub fqdd: Option<String>,
    pub port_number: u32,
    pub link_speed_gbps: Option<u32>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PowerSupply {
    pub fqdd: Option<String>,
    pub vendor_part_number: Option<String>,
    pub model: Option<String>,
    pub output_watts: Option<u32>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ManagementController {
    pub fqdd: Option<String>,
    pub model: Option<String>,
    pub firmware_version: Option<String>,
    pub ip_address: Option<String>,
    pub dns_name: Option<String>,
    pub vendor_specific_attributes: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ServiceContract {
    pub part_number: String,
    pub description: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PricingInfo {
    pub list_price: Option<f64>,
    pub discounted_price: Option<f64>,
    pub currency: String,
}

impl Default for SizingParameters {
    fn default() -> Self {
        Self {
            target_vcpu_pcpu_ratio: 4.0,
            target_memory_overcommit_ratio: 1.0,
            ha_policy: HaPolicy::NPlusOne,
            growth_factor_percent: 20.0,
            forecast_horizon_months: 36,
            cpu_reservation_percent: 10.0,
            memory_reservation_percent: 10.0,
            storage_overhead_percent: 20.0,
        }
    }
}

impl PowerState {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "poweredon" | "powered on" => PowerState::PoweredOn,
            "poweredoff" | "powered off" => PowerState::PoweredOff,
            "suspended" => PowerState::Suspended,
            _ => PowerState::Unknown,
        }
    }
}

impl ProvisioningType {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "thick provision lazy zeroed" | "thick" => ProvisioningType::Thick,
            "thick provision eager zeroed" => ProvisioningType::ThickEagerZeroed,
            "thin provision" | "thin" => ProvisioningType::Thin,
            _ => ProvisioningType::Unknown,
        }
    }
}
