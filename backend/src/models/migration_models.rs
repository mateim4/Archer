use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use chrono::{DateTime, Utc};

/// Enhanced migration project extending the base Project model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationProject {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub project_type: MigrationProjectType,
    pub owner_id: Thing,
    pub team_members: Vec<Thing>, // User IDs
    pub status: ProjectStatus,
    pub start_date: DateTime<Utc>,
    pub target_end_date: DateTime<Utc>,
    pub actual_end_date: Option<DateTime<Utc>>,
    pub budget: Option<f64>,
    pub priority: TaskPriority,
    
    // Migration-specific fields
    pub source_environment: SourceEnvironment,
    pub target_environment: TargetEnvironment,
    pub rvtools_data_id: Option<Thing>, // Reference to parsed RVTools data
    
    // Project metadata
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    // Analytics
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub overdue_tasks: u32,
    pub risk_level: RiskLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationProjectType {
    VmwareToHyperV,
    VmwareToAzureLocal,
    GeneralMigration,
    HardwareRefresh,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectStatus {
    Planning,
    Active,
    Paused,
    Completed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceEnvironment {
    pub environment_type: EnvironmentType,
    pub version: Option<String>,
    pub cluster_count: Option<u32>,
    pub vm_count: Option<u32>,
    pub host_count: Option<u32>,
    pub storage_type: StorageType,
    pub network_complexity: NetworkComplexity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetEnvironment {
    pub environment_type: EnvironmentType,
    pub version: Option<String>,
    pub deployment_model: DeploymentModel,
    pub storage_configuration: Option<StorageConfiguration>,
    pub network_design: Option<NetworkDesign>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EnvironmentType {
    Vmware,
    HyperV,
    AzureLocal,
    Physical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageType {
    FibreChannel,
    Nfs,
    Vsan,
    HyperConverged,
    Direct,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkComplexity {
    Simple,      // Single network, minimal VLANs
    Moderate,    // Multiple networks, some VLANs
    Complex,     // Many VLANs, multiple switches, advanced features
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeploymentModel {
    NewHardware,
    ExistingHardware,
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfiguration {
    pub storage_type: StorageType,
    pub s2d_configuration: Option<S2DConfiguration>,
    pub performance_requirements: PerformanceRequirements,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S2DConfiguration {
    pub node_count: u32,
    pub drive_configuration: DriveConfiguration,
    pub resilience_type: ResilienceType,
    pub cache_drives: Vec<DriveSpec>,
    pub capacity_drives: Vec<DriveSpec>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveConfiguration {
    pub cache_tier: Vec<DriveSpec>,
    pub capacity_tier: Vec<DriveSpec>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResilienceType {
    TwoWayMirror,
    ThreeWayMirror,
    DualParity,
    Simple,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DriveSpec {
    pub drive_type: DriveType,
    pub capacity_gb: u64,
    pub interface: DriveInterface,
    pub rpm: Option<u32>,
    pub endurance: Option<f64>, // TBW for SSDs
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DriveType {
    Nvme,
    Ssd,
    Hdd,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DriveInterface {
    Nvme,
    Sata,
    Sas,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkDesign {
    pub vlan_plan: Vec<VlanConfiguration>,
    pub switch_configuration: Vec<SwitchConfiguration>,
    pub bandwidth_requirements: BandwidthRequirements,
    pub rdma_configuration: Option<RdmaConfiguration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VlanConfiguration {
    pub vlan_id: u16,
    pub name: String,
    pub purpose: VlanPurpose,
    pub ip_range: Option<String>,
    pub gateway: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VlanPurpose {
    Management,
    Vmotion,
    Storage,
    VmNetwork,
    Heartbeat,
    Backup,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwitchConfiguration {
    pub switch_id: String,
    pub switch_type: SwitchType,
    pub port_configuration: Vec<PortConfiguration>,
    pub lag_configuration: Vec<LagConfiguration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SwitchType {
    Physical,
    Virtual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortConfiguration {
    pub port_id: String,
    pub port_type: PortType,
    pub speed_gbps: u32,
    pub vlans: Vec<u16>,
    pub connected_device: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PortType {
    Access,
    Trunk,
    Uplink,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LagConfiguration {
    pub lag_id: String,
    pub member_ports: Vec<String>,
    pub lag_type: LagType,
    pub load_balancing: LoadBalancingMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LagType {
    Lacp,
    Static,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoadBalancingMethod {
    SrcDstMac,
    SrcDstIp,
    SrcDstPort,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthRequirements {
    pub management_network_gbps: u32,
    pub storage_network_gbps: u32,
    pub vm_network_gbps: u32,
    pub backup_network_gbps: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RdmaConfiguration {
    pub rdma_type: RdmaType,
    pub roce_version: Option<RoceVersion>,
    pub priority_flow_control: bool,
    pub dcb_configuration: Option<DcbConfiguration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RdmaType {
    Roce,
    InfiniBand,
    IWarp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RoceVersion {
    V1,
    V2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DcbConfiguration {
    pub priority_groups: Vec<PriorityGroup>,
    pub flow_control_settings: FlowControlSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriorityGroup {
    pub priority: u8,
    pub bandwidth_percentage: u8,
    pub strict_priority: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowControlSettings {
    pub enabled_priorities: Vec<u8>,
    pub pause_time: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceRequirements {
    pub iops_requirement: u64,
    pub throughput_mbps: u64,
    pub latency_ms: f64,
    pub queue_depth: u32,
}

/// Enhanced migration task extending the base Stage model  
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationTask {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub workflow_id: Thing,
    pub name: String,
    pub description: String,
    pub task_type: MigrationTaskType,
    pub status: MigrationTaskStatus,
    pub priority: TaskPriority,
    pub assigned_to: Vec<Thing>, // User IDs
    pub estimated_hours: f32,
    pub actual_hours: Option<f32>,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub dependencies: Vec<TaskDependency>,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    pub resources: Vec<String>,
    pub completion_percentage: u8,
    
    // Migration-specific fields
    pub hardware_requirements: Vec<HardwareRequirement>,
    pub network_requirements: Vec<NetworkRequirement>,
    pub validation_criteria: Vec<ValidationCriteria>,
    pub risk_level: RiskLevel,
    pub rollback_plan: Option<String>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationTaskType {
    Assessment,
    Planning,
    HardwareProcurement,
    HardwarePreparation,
    MigrationExecution,
    TestingValidation,
    Decommission,
    Documentation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationTaskStatus {
    NotStarted,
    InProgress,
    Blocked,
    Completed,
    Cancelled,
    WaitingApproval,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDependency {
    pub id: Thing,
    pub depends_on: Thing,
    pub dependency_type: DependencyType,
    pub lag_days: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DependencyType {
    FinishToStart,
    StartToStart,
    FinishToFinish,
    StartToFinish,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareRequirement {
    pub id: Thing,
    pub requirement_type: HardwareRequirementType,
    pub specification: String,
    pub is_compatible: bool,
    pub current_hardware_id: Option<Thing>,
    pub recommended_hardware: Vec<Thing>, // Vendor hardware IDs
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HardwareRequirementType {
    Server,
    NetworkCard,
    StorageController,
    Jbod,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRequirement {
    pub id: Thing,
    pub requirement_type: NetworkRequirementType,
    pub specification: String,
    pub current_config: Option<String>,
    pub target_config: String,
    pub is_compliant: bool,
    pub remediation_steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkRequirementType {
    Rdma,
    Roce,
    Vlan,
    Bandwidth,
    Latency,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationCriteria {
    pub id: Thing,
    pub category: ValidationCategory,
    pub description: String,
    pub test_procedure: String,
    pub acceptance_criteria: String,
    pub status: ValidationStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationCategory {
    Performance,
    Functionality,
    Security,
    Compliance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationStatus {
    Pending,
    Passed,
    Failed,
    Skipped,
}

// DTOs for API requests
#[derive(Debug, Deserialize)]
pub struct CreateMigrationProjectRequest {
    pub name: String,
    pub description: String,
    pub project_type: MigrationProjectType,
    pub source_environment: SourceEnvironment,
    pub target_environment: TargetEnvironment,
    pub start_date: DateTime<Utc>,
    pub target_end_date: DateTime<Utc>,
    pub budget: Option<f64>,
    pub priority: TaskPriority,
    pub team_members: Vec<Thing>,
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMigrationTaskRequest {
    pub project_id: Thing,
    pub workflow_id: Thing,
    pub name: String,
    pub description: String,
    pub task_type: MigrationTaskType,
    pub priority: TaskPriority,
    pub assigned_to: Vec<Thing>,
    pub estimated_hours: f32,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub dependencies: Vec<TaskDependency>,
    pub tags: Vec<String>,
    pub hardware_requirements: Vec<HardwareRequirement>,
    pub network_requirements: Vec<NetworkRequirement>,
    pub validation_criteria: Vec<ValidationCriteria>,
    pub risk_level: RiskLevel,
}

#[derive(Debug, Serialize)]
pub struct MigrationProjectResponse {
    pub id: String,
    pub name: String,
    pub description: String,
    pub project_type: MigrationProjectType,
    pub status: ProjectStatus,
    pub progress_percentage: f32,
    pub source_environment: SourceEnvironment,
    pub target_environment: TargetEnvironment,
    pub start_date: DateTime<Utc>,
    pub target_end_date: DateTime<Utc>,
    pub risk_level: RiskLevel,
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub overdue_tasks: u32,
    pub team_members: Vec<String>,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// CLUSTER MIGRATION STRATEGY MODELS
// ============================================================================

/// Cluster migration strategy - determines how a cluster will be migrated
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationStrategyType {
    /// Hardware will be reused from another cluster (domino swap)
    DominoHardwareSwap,
    /// New hardware will be purchased
    NewHardwarePurchase,
    /// Use existing free hardware from the pool
    ExistingFreeHardware,
}

/// Complete cluster migration plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterMigrationPlan {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub target_cluster_name: String,
    pub strategy_type: MigrationStrategyType,
    
    // VM Migration Details
    pub source_vms: Vec<VMMigrationMapping>,
    pub total_vms: u32,
    pub total_vcpu: u32,
    pub total_memory_gb: f64,
    pub total_storage_tb: f64,
    
    // Hardware Strategy Details
    pub hardware_basket_id: Option<Thing>, // For NewHardwarePurchase or ExistingFreeHardware
    pub source_cluster_id: Option<Thing>, // For DominoHardwareSwap
    pub procurement_order_id: Option<Thing>, // For NewHardwarePurchase
    
    // Domino-specific fields
    pub depends_on_cluster_ids: Vec<Thing>, // Other clusters this depends on (domino chain)
    pub frees_hardware_for_cluster_ids: Vec<Thing>, // Clusters that will use this hardware
    
    // Target Environment Configuration
    pub target_config: TargetClusterConfiguration,
    
    // Capacity Validation
    pub capacity_validation: Option<CapacityValidationResult>,
    pub overcommit_ratios: OvercommitRatios,
    
    // Timeline
    pub planned_migration_date: DateTime<Utc>,
    pub hardware_available_date: Option<DateTime<Utc>>, // When hardware becomes available
    pub estimated_duration_hours: u32,
    
    // Status
    pub status: MigrationPlanStatus,
    pub validation_status: ClusterValidationStatus,
    pub notes: String,
    
    // Metadata
    pub created_by: Thing,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Individual VM migration mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VMMigrationMapping {
    pub source_vm_name: String,
    pub source_cluster: String,
    pub source_host: String,
    pub target_vm_name: String,
    pub vcpu: u32,
    pub memory_gb: f64,
    pub storage_gb: f64,
    pub os_type: String,
    pub priority: TaskPriority,
    pub migration_order: u32, // Order within the cluster migration
}

/// Target cluster hardware and configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetClusterConfiguration {
    pub cluster_name: String,
    pub num_nodes: u32,
    pub node_specs: NodeSpecification,
    pub storage_design: StorageDesign,
    pub network_design: NetworkDesign,
}

/// Individual node specifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeSpecification {
    pub model: String,
    pub cpu_sockets: u32,
    pub cpu_cores_per_socket: u32,
    pub cpu_threads_per_core: u32,
    pub total_cpu_cores: u32,
    pub total_cpu_threads: u32,
    pub ram_gb: u32,
    pub network_adapters: u32,
    pub adapter_speed_gbps: u32,
}

/// Storage design for the target cluster
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageDesign {
    pub storage_type: StorageType,
    pub s2d_config: Option<S2DConfiguration>,
    pub external_storage_config: Option<ExternalStorageConfig>,
}

/// External storage configuration (SAN/NAS)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalStorageConfig {
    pub storage_system_name: String,
    pub total_capacity_tb: f64,
    pub raid_level: String,
    pub connection_type: String, // iSCSI, FC, NFS, SMB
}

/// Overcommit ratios for capacity planning
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvercommitRatios {
    pub cpu_overcommit: f64, // e.g., 2.0 = 2:1 overcommit
    pub memory_overcommit: f64, // e.g., 1.0 = no overcommit
}

/// Result of capacity validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacityValidationResult {
    pub is_valid: bool,
    pub cpu_validation: ResourceValidation,
    pub memory_validation: ResourceValidation,
    pub storage_validation: ResourceValidation,
    pub status: CapacityValidationStatus,
    pub recommendations: Vec<String>,
    pub validated_at: DateTime<Utc>,
}

/// Individual resource validation details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceValidation {
    pub resource_type: String,
    pub required: f64,
    pub available: f64,
    pub utilization_percent: f64,
    pub meets_requirement: bool,
    pub message: String,
    pub severity: ValidationSeverity,
}

/// Validation severity levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationSeverity {
    Info,
    Warning,
    Error,
}

/// Capacity validation status levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CapacityValidationStatus {
    Optimal,     // < 80% utilization
    Acceptable,  // 80-90% utilization
    Warning,     // 90-100% utilization
    Critical,    // Over 100% utilization
}

/// Migration plan status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationPlanStatus {
    Draft,
    PendingHardware,
    ReadyToMigrate,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

/// Cluster migration validation status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClusterValidationStatus {
    NotValidated,
    Valid,
    Invalid,
    Warning,
}

/// Procurement order for new hardware
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcurementOrder {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub cluster_migration_plan_id: Thing,
    pub hardware_basket_id: Thing,
    
    // Order Details
    pub order_number: Option<String>,
    pub vendor: String,
    pub total_cost: f64,
    pub currency: String,
    
    // Items
    pub line_items: Vec<ProcurementLineItem>,
    
    // Timeline
    pub order_date: Option<DateTime<Utc>>,
    pub expected_delivery_date: DateTime<Utc>,
    pub actual_delivery_date: Option<DateTime<Utc>>,
    
    // Status
    pub status: ProcurementStatus,
    pub notes: String,
    
    // Metadata
    pub created_by: Thing,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Individual line item in a procurement order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcurementLineItem {
    pub part_number: String,
    pub description: String,
    pub quantity: u32,
    pub unit_price: f64,
    pub total_price: f64,
}

/// Procurement order status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcurementStatus {
    Draft,
    Submitted,
    Approved,
    Ordered,
    Shipped,
    Delivered,
    Installed,
    Cancelled,
}

/// Dependency validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyValidationResult {
    pub is_valid: bool,
    pub has_circular_dependencies: bool,
    pub circular_dependencies: Vec<CircularDependency>,
    pub topological_order: Vec<Thing>, // Cluster IDs in valid execution order
    pub critical_path: Vec<Thing>, // Longest dependency chain
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

/// Circular dependency detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircularDependency {
    pub cycle: Vec<String>, // Cluster names in the cycle
    pub cluster_ids: Vec<Thing>,
}

/// Hardware availability timeline entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareTimelineEntry {
    pub cluster_id: Thing,
    pub cluster_name: String,
    pub hardware_available_date: DateTime<Utc>,
    pub freed_by_cluster_id: Option<Thing>,
    pub freed_by_cluster_name: Option<String>,
}

/// Hardware availability timeline response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAvailabilityTimeline {
    pub project_id: Thing,
    pub timeline: Vec<HardwareTimelineEntry>,
    pub total_domino_chains: u32,
    pub longest_chain_length: u32,
}
