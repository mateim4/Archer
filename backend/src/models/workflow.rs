use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Enhanced Project model with workflow management capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectWorkflow {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub project_type: ProjectType,
    pub status: ProjectStatus,
    pub priority: ProjectPriority,
    pub start_date: DateTime<Utc>,
    pub target_end_date: DateTime<Utc>,
    pub actual_end_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub created_by: String,
    pub assigned_team: Vec<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub workflows: Vec<Thing>, // References to workflow records
    pub documents: Vec<Thing>, // References to document records
    pub rvtools_import: Option<Thing>, // Reference to RVTools import
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProjectType {
    #[serde(rename = "vmware_migration")]
    VmwareMigration,
    #[serde(rename = "lifecycle_planning")]
    LifecyclePlanning,
    #[serde(rename = "new_solution")]
    NewSolution,
    #[serde(rename = "hardware_refresh")]
    HardwareRefresh,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProjectStatus {
    #[serde(rename = "planning")]
    Planning,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "on_hold")]
    OnHold,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProjectPriority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}

/// Individual workflow/activity within a project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub description: String,
    pub workflow_type: WorkflowType,
    pub duration_days: u32,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub dependencies: Vec<Thing>, // References to other workflows
    pub dependency_type: DependencyType,
    pub lag_days: i32, // Can be negative for lead time
    pub status: WorkflowStatus,
    pub progress_percentage: u8,
    pub assigned_to: Vec<String>,
    pub wizard_state: Option<WizardState>,
    pub hardware_requirements: Option<HardwareRequirement>,
    pub documents: Vec<Thing>, // Generated documents for this workflow
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowType {
    #[serde(rename = "migration_wave")]
    MigrationWave,
    #[serde(rename = "hardware_procurement")]
    HardwareProcurement,
    #[serde(rename = "lifecycle_planning")]
    LifecyclePlanning,
    #[serde(rename = "commissioning")]
    Commissioning,
    #[serde(rename = "decommissioning")]
    Decommissioning,
    #[serde(rename = "solution_design")]
    SolutionDesign,
    #[serde(rename = "network_configuration")]
    NetworkConfiguration,
    #[serde(rename = "testing_validation")]
    TestingValidation,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowStatus {
    #[serde(rename = "not_started")]
    NotStarted,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "blocked")]
    Blocked,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DependencyType {
    #[serde(rename = "finish_to_start")]
    FinishToStart,
    #[serde(rename = "start_to_start")]
    StartToStart,
    #[serde(rename = "finish_to_finish")]
    FinishToFinish,
}

/// Saved wizard state for workflows
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardState {
    pub wizard_type: String, // "migration", "lifecycle", "solution_design"
    pub current_step: u32,
    pub total_steps: u32,
    pub step_data: HashMap<String, serde_json::Value>,
    pub is_completed: bool,
    pub completion_data: Option<serde_json::Value>,
    pub last_saved: DateTime<Utc>,
}

/// Hardware requirements for a workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareRequirement {
    pub cpu_cores_required: u32,
    pub memory_gb_required: u32,
    pub storage_gb_required: u32,
    pub network_ports_required: u32,
    pub server_count_required: u32,
    pub form_factor_preference: Option<String>, // "1U", "2U", "Blade"
    pub vendor_preference: Option<String>, // "Dell", "Lenovo", "HPE"
    pub special_requirements: Vec<String>, // "RDMA", "GPU", "High Memory"
    pub estimated_cost: Option<f64>,
}

/// Server inventory tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInventory {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub server_name: String,
    pub serial_number: String,
    pub asset_tag: Option<String>,
    pub hardware_model_id: Thing, // Reference to hardware_lot
    pub location: String,
    pub status: ServerStatus,
    pub condition: ServerCondition,
    pub allocated_to_project: Option<Thing>,
    pub allocated_to_workflow: Option<Thing>,
    pub allocation_start: Option<DateTime<Utc>>,
    pub allocation_end: Option<DateTime<Utc>>,
    pub procurement_date: DateTime<Utc>,
    pub warranty_start: DateTime<Utc>,
    pub warranty_end: DateTime<Utc>,
    pub purchase_price: Option<f64>,
    pub depreciation_rate: Option<f64>,
    pub specifications: ServerSpecifications,
    pub maintenance_history: Vec<MaintenanceRecord>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ServerStatus {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "allocated")]
    Allocated,
    #[serde(rename = "maintenance")]
    Maintenance,
    #[serde(rename = "decommissioned")]
    Decommissioned,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ServerCondition {
    #[serde(rename = "new")]
    New,
    #[serde(rename = "good")]
    Good,
    #[serde(rename = "fair")]
    Fair,
    #[serde(rename = "end_of_life")]
    EndOfLife,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerSpecifications {
    pub cpu_model: String,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub memory_gb: u32,
    pub storage_bays: u32,
    pub network_ports: u32,
    pub form_factor: String,
    pub power_supplies: u32,
    pub additional_features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaintenanceRecord {
    pub date: DateTime<Utc>,
    pub maintenance_type: String,
    pub description: String,
    pub performed_by: String,
    pub cost: Option<f64>,
    pub next_maintenance_due: Option<DateTime<Utc>>,
}

/// RVTools import and analysis data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RVToolsImport {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub filename: String,
    pub file_size: u64,
    pub import_date: DateTime<Utc>,
    pub imported_by: String,
    pub processing_status: ProcessingStatus,
    pub error_message: Option<String>,
    
    // Parsed data summary
    pub total_vms: u32,
    pub total_hosts: u32,
    pub total_clusters: u32,
    pub environment_summary: EnvironmentSummary,
    pub clusters_data: Vec<ClusterData>,
    pub selected_clusters: Vec<String>,
    pub capacity_analysis: Option<CapacityAnalysis>,
    pub hardware_recommendations: Vec<HardwareRecommendation>,
    
    pub raw_data_path: String, // File system path to raw data
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProcessingStatus {
    #[serde(rename = "processing")]
    Processing,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentSummary {
    pub total_vcpus: u32,
    pub total_memory_gb: f64,
    pub total_storage_gb: f64,
    pub average_cpu_utilization: f32,
    pub average_memory_utilization: f32,
    pub vm_count_by_os: HashMap<String, u32>,
    pub largest_vm_memory_gb: f64,
    pub largest_vm_storage_gb: f64,
    pub oldest_vm_age_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterData {
    pub name: String,
    pub host_count: u32,
    pub vm_count: u32,
    pub total_cpu_cores: u32,
    pub total_memory_gb: f64,
    pub total_storage_gb: f64,
    pub current_cpu_ratio: f32,
    pub current_memory_ratio: f32,
    pub storage_type: String, // "vSAN", "Traditional", "Mixed"
    pub network_cards: Vec<NetworkCardInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkCardInfo {
    pub port_count: u32,
    pub speed_gbps: u32,
    pub port_type: String, // "RJ45", "SFP+", "QSFP+"
    pub rdma_capable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacityAnalysis {
    pub recommended_cpu_cores: u32,
    pub recommended_memory_gb: f64,
    pub recommended_storage_gb: f64,
    pub overcommit_ratios: OvercommitRatios,
    pub ha_requirements: HaRequirements,
    pub growth_projection: GrowthProjection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvercommitRatios {
    pub cpu_ratio: f32, // Default 3:1
    pub memory_ratio: f32, // Default 1.5:1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HaRequirements {
    pub ha_type: String, // "N+1", "N+2", "2N"
    pub additional_capacity_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrowthProjection {
    pub time_horizon_months: u32,
    pub expected_growth_percent: f32,
    pub additional_capacity_needed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareRecommendation {
    pub recommendation_type: String, // "Basic", "Standard", "Premium"
    pub server_model: String,
    pub server_count: u32,
    pub total_cpu_cores: u32,
    pub total_memory_gb: f64,
    pub total_storage_gb: f64,
    pub estimated_cost: f64,
    pub hardware_items: Vec<RecommendedItem>,
    pub meets_requirements: bool,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedItem {
    pub hardware_model_id: Thing, // Reference to hardware basket item
    pub quantity: u32,
    pub unit_price: f64,
    pub total_price: f64,
    pub specifications: String,
}

/// Project document management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDocument {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub workflow_id: Option<Thing>,
    pub document_type: DocumentType,
    pub document_name: String,
    pub file_path: String,
    pub file_size: u64,
    pub version: String,
    pub status: DocumentStatus,
    pub generated_from_template: Option<String>,
    pub generation_config: Option<DocumentGenerationConfig>,
    pub generated_at: Option<DateTime<Utc>>,
    pub generated_by: Option<String>,
    pub approved_by: Option<String>,
    pub approval_date: Option<DateTime<Utc>>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DocumentType {
    #[serde(rename = "HLD")]
    Hld,
    #[serde(rename = "LLD")]
    Lld,
    #[serde(rename = "migration_plan")]
    MigrationPlan,
    #[serde(rename = "hardware_bom")]
    HardwareBoM,
    #[serde(rename = "network_diagram")]
    NetworkDiagram,
    #[serde(rename = "deployment_plan")]
    DeploymentPlan,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DocumentStatus {
    #[serde(rename = "draft")]
    Draft,
    #[serde(rename = "review")]
    Review,
    #[serde(rename = "approved")]
    Approved,
    #[serde(rename = "archived")]
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentGenerationConfig {
    pub template_name: String,
    pub include_bom: bool,
    pub include_network_diagrams: bool,
    pub include_capacity_analysis: bool,
    pub custom_sections: Vec<String>,
    pub styling_options: HashMap<String, serde_json::Value>,
}

/// Hardware procurement tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcurementRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub workflow_id: Option<Thing>,
    pub request_name: String,
    pub hardware_items: Vec<ProcurementItem>,
    pub vendor: String,
    pub status: ProcurementStatus,
    pub request_date: DateTime<Utc>,
    pub approval_date: Option<DateTime<Utc>>,
    pub order_date: Option<DateTime<Utc>>,
    pub expected_delivery: Option<DateTime<Utc>>,
    pub actual_delivery: Option<DateTime<Utc>>,
    pub total_cost: f64,
    pub purchase_order_number: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcurementItem {
    pub hardware_model_id: Thing,
    pub quantity: u32,
    pub unit_price: f64,
    pub total_price: f64,
    pub specifications: String,
    pub delivery_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProcurementStatus {
    #[serde(rename = "requested")]
    Requested,
    #[serde(rename = "approved")]
    Approved,
    #[serde(rename = "ordered")]
    Ordered,
    #[serde(rename = "delivered")]
    Delivered,
    #[serde(rename = "cancelled")]
    Cancelled,
}
