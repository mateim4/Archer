use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use std::collections::HashMap;

// =============================================================================
// PROJECT MANAGEMENT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub project_type: ProjectType,
    pub status: ProjectStatus,
    pub priority: ProjectPriority,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub actual_end_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub budget_allocated: Option<f64>,
    pub budget_spent: f64,
    pub risk_level: RiskLevel,
    pub stakeholders: Vec<String>,
    pub tags: Vec<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectType {
    #[serde(rename = "migration")]
    Migration,
    #[serde(rename = "deployment")]
    Deployment,
    #[serde(rename = "upgrade")]
    Upgrade,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectStatus {
    #[serde(rename = "planning")]
    Planning,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "on_hold")]
    OnHold,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskLevel {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectWorkflow {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub description: Option<String>,
    pub workflow_type: WorkflowType,
    pub status: WorkflowStatus,
    pub priority: u8, // 1-10 scale
    pub estimated_duration_hours: Option<f64>,
    pub actual_duration_hours: Option<f64>,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub actual_end_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub dependencies: Vec<Thing>, // References to other workflows
    pub assigned_to: Option<String>,
    pub requires_approval: bool,
    pub approved_by: Option<String>,
    pub approval_date: Option<DateTime<Utc>>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkflowType {
    #[serde(rename = "assessment")]
    Assessment,
    #[serde(rename = "planning")]
    Planning,
    #[serde(rename = "implementation")]
    Implementation,
    #[serde(rename = "validation")]
    Validation,
    #[serde(rename = "documentation")]
    Documentation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkflowStepType {
    #[serde(rename = "discovery")]
    Discovery,
    #[serde(rename = "assessment")]
    Assessment,
    #[serde(rename = "planning")]
    Planning,
    #[serde(rename = "migration")]
    Migration,
    #[serde(rename = "testing")]
    Testing,
    #[serde(rename = "validation")]
    Validation,
    #[serde(rename = "cutover")]
    Cutover,
    #[serde(rename = "rollback")]
    Rollback,
    #[serde(rename = "documentation")]
    Documentation,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkflowStepStatus {
    #[serde(rename = "not_started")]
    NotStarted,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "blocked")]
    Blocked,
    #[serde(rename = "skipped")]
    Skipped,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowActivity {
    pub id: Option<Thing>,
    pub workflow_id: Thing,
    pub name: String,
    pub description: Option<String>,
    pub activity_type: ActivityType,
    pub status: ActivityStatus,
    pub estimated_duration_hours: Option<f64>,
    pub actual_duration_hours: Option<f64>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub prerequisites: Vec<Thing>, // References to other activities
    pub deliverables: Vec<String>,
    pub assigned_to: Option<String>,
    pub configuration: HashMap<String, serde_json::Value>,
    pub results: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActivityType {
    #[serde(rename = "rvtools_upload")]
    RvToolsUpload,
    #[serde(rename = "capacity_analysis")]
    CapacityAnalysis,
    #[serde(rename = "hardware_selection")]
    HardwareSelection,
    #[serde(rename = "document_generation")]
    DocumentGeneration,
    #[serde(rename = "validation")]
    Validation,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActivityStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "skipped")]
    Skipped,
}

// =============================================================================
// RVTOOLS DATA MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RvToolsData {
    pub id: Option<Thing>,
    pub upload_id: String,
    pub line_number: usize,
    pub vm_name: String,
    pub host_name: String,
    pub cpu_cores: i32,
    pub memory_gb: i32,
    pub disk_gb: i32,
    pub operating_system: Option<String>,
    pub power_state: Option<String>,
    pub cluster: Option<String>,
    pub datacenter: Option<String>,
    pub network_adapters: Option<i32>,
    pub processed_to_pool: bool,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// HARDWARE POOL MANAGEMENT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwarePool {
    pub id: Option<Thing>,
    pub asset_tag: String,
    pub serial_number: Option<String>,
    pub hardware_lot_id: Option<Thing>,
    pub vendor: String,
    pub model: String,
    pub form_factor: Option<String>,
    pub cpu_sockets: Option<i32>,
    pub cpu_cores_total: Option<i32>,
    pub memory_gb: Option<i32>,
    pub storage_type: Option<String>,
    pub storage_capacity_gb: Option<i32>,
    pub network_ports: Option<i32>,
    pub power_consumption_watts: Option<i32>,
    pub rack_units: i32,
    
    // Availability and Status
    pub availability_status: AvailabilityStatus,
    pub location: Option<String>,
    pub datacenter: Option<String>,
    pub rack_position: Option<String>,
    pub available_from_date: DateTime<Utc>,
    pub available_until_date: Option<DateTime<Utc>>,
    pub maintenance_schedule: Vec<MaintenanceWindow>,
    
    // Financial Information
    pub acquisition_cost: Option<f64>,
    pub monthly_cost: Option<f64>,
    pub warranty_expires: Option<DateTime<Utc>>,
    pub support_level: Option<String>,
    
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum AvailabilityStatus {
    #[serde(rename = "available")]
    Available,
    #[serde(rename = "allocated")]
    Allocated,
    #[serde(rename = "maintenance")]
    Maintenance,
    #[serde(rename = "retired")]
    Retired,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaintenanceWindow {
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub maintenance_type: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAllocation {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub workflow_id: Option<Thing>,
    pub server_id: Thing,
    pub allocation_type: AllocationType,
    pub allocation_start: DateTime<Utc>,
    pub allocation_end: Option<DateTime<Utc>>,
    pub purpose: String,
    pub configuration_notes: Option<String>,
    pub allocated_by: String,
    pub approved_by: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AllocationType {
    #[serde(rename = "reserved")]
    Reserved,
    #[serde(rename = "allocated")]
    Allocated,
    #[serde(rename = "deployed")]
    Deployed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcurementPipeline {
    pub id: Option<Thing>,
    pub project_id: Option<Thing>,
    pub hardware_lot_id: Thing,
    pub quantity: i32,
    pub procurement_status: ProcurementStatus,
    pub order_date: Option<DateTime<Utc>>,
    pub expected_delivery: Option<DateTime<Utc>>,
    pub actual_delivery: Option<DateTime<Utc>>,
    pub vendor: String,
    pub order_number: Option<String>,
    pub total_cost: Option<f64>,
    pub delivery_location: Option<String>,
    pub notes: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcurementStatus {
    #[serde(rename = "planned")]
    Planned,
    #[serde(rename = "ordered")]
    Ordered,
    #[serde(rename = "shipped")]
    Shipped,
    #[serde(rename = "received")]
    Received,
    #[serde(rename = "configured")]
    Configured,
    #[serde(rename = "available")]
    Available,
}

// =============================================================================
// RVTOOLS INTEGRATION MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RvToolsUpload {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub workflow_id: Option<Thing>,
    pub file_name: String,
    pub file_path: String,
    pub file_size_bytes: i64,
    pub file_hash: String,
    pub upload_status: RvToolsStatus,
    pub processing_results: Option<HashMap<String, serde_json::Value>>,
    pub total_vms: Option<i32>,
    pub total_hosts: Option<i32>,
    pub total_clusters: Option<i32>,
    pub vcenter_version: Option<String>,
    pub environment_name: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub uploaded_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
    pub uploaded_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RvToolsStatus {
    #[serde(rename = "uploaded")]
    Uploaded,
    #[serde(rename = "processing")]
    Processing,
    #[serde(rename = "processed")]
    Processed,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RvToolsAnalysis {
    pub id: Option<Thing>,
    pub upload_id: Thing,
    pub project_id: Thing,
    pub analysis_type: AnalysisType,
    pub selected_clusters: Vec<String>,
    pub total_vcpu: Option<i32>,
    pub total_memory_gb: Option<i32>,
    pub total_storage_gb: Option<i32>,
    pub overcommit_ratios: HashMap<String, f64>,
    pub performance_metrics: HashMap<String, serde_json::Value>,
    pub capacity_recommendations: Vec<CapacityRecommendation>,
    pub migration_complexity_score: Option<i32>,
    pub risk_assessment: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub analyzed_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnalysisType {
    #[serde(rename = "capacity")]
    Capacity,
    #[serde(rename = "performance")]
    Performance,
    #[serde(rename = "migration_readiness")]
    MigrationReadiness,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacityRecommendation {
    pub recommendation_type: String, // conservative, balanced, optimized
    pub required_hosts: i32,
    pub total_cpu_cores: i32,
    pub total_memory_gb: i32,
    pub total_storage_gb: i32,
    pub estimated_cost: Option<f64>,
    pub hardware_suggestions: Vec<Thing>, // References to hardware_lot
    pub confidence_score: f64,
    pub notes: String,
}

// =============================================================================
// REQUEST/RESPONSE MODELS FOR API
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
    pub project_type: ProjectType,
    pub priority: Option<ProjectPriority>,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub budget_allocated: Option<f64>,
    pub stakeholders: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<ProjectStatus>,
    pub priority: Option<ProjectPriority>,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub actual_end_date: Option<DateTime<Utc>>,
    pub progress_percentage: Option<u8>,
    pub budget_allocated: Option<f64>,
    pub risk_level: Option<RiskLevel>,
    pub stakeholders: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub workflow_type: WorkflowType,
    pub priority: Option<u8>,
    pub estimated_duration_hours: Option<f64>,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub dependencies: Option<Vec<String>>, // Workflow IDs as strings
    pub assigned_to: Option<String>,
    pub requires_approval: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct HardwareAllocationRequest {
    pub project_id: String,
    pub workflow_id: Option<String>,
    pub server_ids: Vec<String>,
    pub allocation_start: DateTime<Utc>,
    pub allocation_end: Option<DateTime<Utc>>,
    pub allocation_notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProjectResponse {
    pub id: Thing,
    pub name: String,
    pub description: Option<String>,
    pub project_type: ProjectType,
    pub status: ProjectStatus,
    pub priority: ProjectPriority,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub budget_allocated: Option<f64>,
    pub budget_spent: f64,
    pub risk_level: RiskLevel,
    pub stakeholders: Vec<String>,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
    pub assigned_to: Option<String>,
    pub active_workflows: i32,
    pub total_workflows: i32,
}

#[derive(Debug, Serialize)]
pub struct WorkflowResponse {
    pub id: Thing,
    pub project_id: Thing,
    pub name: String,
    pub description: Option<String>,
    pub workflow_type: WorkflowType,
    pub status: WorkflowStatus,
    pub priority: u8,
    pub estimated_duration_hours: Option<f64>,
    pub actual_duration_hours: Option<f64>,
    pub start_date: Option<DateTime<Utc>>,
    pub target_end_date: Option<DateTime<Utc>>,
    pub progress_percentage: u8,
    pub assigned_to: Option<String>,
    pub total_activities: i32,
    pub completed_activities: i32,
}

#[derive(Debug, Serialize)]
pub struct HardwarePoolResponse {
    pub id: Thing,
    pub asset_tag: String,
    pub vendor: String,
    pub model: String,
    pub cpu_cores_total: Option<i32>,
    pub memory_gb: Option<i32>,
    pub availability_status: AvailabilityStatus,
    pub location: Option<String>,
    pub datacenter: Option<String>,
    pub available_from_date: DateTime<Utc>,
    pub available_until_date: Option<DateTime<Utc>>,
}

// Filter structs for queries
#[derive(Debug, Deserialize)]
pub struct ProjectFilter {
    pub status: Option<ProjectStatus>,
    pub project_type: Option<ProjectType>,
    pub priority: Option<ProjectPriority>,
    pub assigned_to: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HardwareFilter {
    pub availability_status: Option<AvailabilityStatus>,
    pub vendor: Option<String>,
    pub datacenter: Option<String>,
    pub min_cpu_cores: Option<i32>,
    pub min_memory_gb: Option<i32>,
}
