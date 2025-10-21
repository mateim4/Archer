use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use surrealdb::sql::Thing;

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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
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
// ENHANCED RVTOOLS DATA MODELS WITH SOURCE TRACEABILITY
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
// ENHANCED RVTOOLS MODELS WITH EXCEL SUPPORT AND TRACEABILITY
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RvToolsExcelData {
    pub id: Option<Thing>,
    pub upload_id: Thing,
    pub sheet_name: String,
    pub row_number: i32,
    pub column_name: String,
    pub column_index: i32,
    pub raw_value: String,
    pub parsed_value: serde_json::Value,
    pub data_type: RvToolsDataType,
    pub metric_category: MetricCategory,
    pub confidence_score: f32, // 0-100 parsing confidence
    pub validation_status: ValidationStatus,
    pub validation_errors: Vec<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum RvToolsDataType {
    #[serde(rename = "string")]
    String,
    #[serde(rename = "integer")]
    Integer,
    #[serde(rename = "float")]
    Float,
    #[serde(rename = "boolean")]
    Boolean,
    #[serde(rename = "datetime")]
    DateTime,
    #[serde(rename = "capacity")]
    Capacity,
    #[serde(rename = "network_address")]
    NetworkAddress,
    #[serde(rename = "path")]
    Path,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricCategory {
    #[serde(rename = "hardware_config")]
    HardwareConfig,
    #[serde(rename = "network_metrics")]
    NetworkMetrics,
    #[serde(rename = "storage_metrics")]
    StorageMetrics,
    #[serde(rename = "capacity_metrics")]
    CapacityMetrics,
    #[serde(rename = "lifecycle_metrics")]
    LifecycleMetrics,
    #[serde(rename = "migration_metrics")]
    MigrationMetrics,
    #[serde(rename = "cluster_metrics")]
    ClusterMetrics,
    #[serde(rename = "vm_metrics")]
    VmMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ValidationStatus {
    #[serde(rename = "valid")]
    Valid,
    #[serde(rename = "warning")]
    Warning,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "needs_review")]
    NeedsReview,
}

// Storage Architecture Analysis Models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageArchitectureAnalysis {
    pub id: Option<Thing>,
    pub upload_id: Thing,
    pub cluster_name: String,
    pub storage_type: StorageType,
    pub evidence_chain: Vec<StorageEvidence>,
    pub confidence_level: f32,
    pub analysis_method: AnalysisMethod,
    pub recommendations: Vec<String>,
    pub s2d_compliance: Option<S2dComplianceCheck>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub analyzed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageType {
    #[serde(rename = "vsan_provider")]
    VsanProvider,
    #[serde(rename = "vsan_consumer")]
    VsanConsumer,
    #[serde(rename = "iscsi_san")]
    IscsiSan,
    #[serde(rename = "fc_san")]
    FcSan,
    #[serde(rename = "nfs")]
    Nfs,
    #[serde(rename = "local")]
    Local,
    #[serde(rename = "unknown")]
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageEvidence {
    pub evidence_type: EvidenceType,
    pub sheet_name: String,
    pub row_data: HashMap<String, String>,
    pub supports_conclusion: bool,
    pub confidence_weight: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EvidenceType {
    #[serde(rename = "datastore_name")]
    DatastoreName,
    #[serde(rename = "multipath_policy")]
    MultipathPolicy,
    #[serde(rename = "hba_type")]
    HbaType,
    #[serde(rename = "disk_path")]
    DiskPath,
    #[serde(rename = "capacity_pattern")]
    CapacityPattern,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnalysisMethod {
    #[serde(rename = "systematic")]
    Systematic, // vDisk → vDatastore → vMultiPath → vHBA
    #[serde(rename = "pattern_matching")]
    PatternMatching,
    #[serde(rename = "confirmed_data")]
    ConfirmedData, // User-verified clusters
}

// S2D Compliance Check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S2dComplianceCheck {
    pub overall_status: ComplianceStatus,
    pub requirements: S2dRequirements,
    pub risk_level: RiskLevel,
    pub recommendations: Vec<String>,
    pub checked_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S2dRequirements {
    pub min_hosts: RequirementCheck,
    pub memory_capacity: RequirementCheck,
    pub network_adapters: RequirementCheck,
    pub drive_configuration: RequirementCheck,
    pub drive_symmetry: RequirementCheck,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequirementCheck {
    pub status: ComplianceStatus,
    pub current_value: Option<String>,
    pub required_value: String,
    pub confidence: f32,
    pub details: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ComplianceStatus {
    #[serde(rename = "compliant")]
    Compliant,
    #[serde(rename = "non_compliant")]
    NonCompliant,
    #[serde(rename = "needs_verification")]
    NeedsVerification,
    #[serde(rename = "unknown")]
    Unknown,
}

// =============================================================================
// REPORT GENERATION MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedReport {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub upload_id: Thing,
    pub report_type: ReportType,
    pub report_name: String,
    pub template_id: Option<Thing>,
    pub generation_config: ReportConfig,
    pub data_variables: HashMap<String, DataVariable>,
    pub sections: Vec<ReportSection>,
    pub export_formats: Vec<ExportFormat>,
    pub branding: Option<BrandingConfig>,
    pub cache_key: String,
    pub status: ReportStatus,
    pub error_message: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub generated_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    #[serde(rename = "cluster_analysis")]
    ClusterAnalysis,
    #[serde(rename = "migration_timeline")]
    MigrationTimeline,
    #[serde(rename = "storage_architecture")]
    StorageArchitecture,
    #[serde(rename = "hardware_analysis")]
    HardwareAnalysis,
    #[serde(rename = "network_architecture")]
    NetworkArchitecture,
    #[serde(rename = "migration_hld")]
    MigrationHLD,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportConfig {
    pub include_percentages: bool,
    pub show_source_traceability: bool,
    pub confidence_threshold: f32,
    pub timeline_weeks: Option<u8>,
    pub overcommit_ratios: Option<OvercommitRatios>,
    pub filters: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvercommitRatios {
    pub cpu_ratio: f32,    // e.g., 3.0 for 3:1
    pub memory_ratio: f32, // e.g., 1.5 for 1.5:1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataVariable {
    pub id: String,
    pub name: String,
    pub value: serde_json::Value,
    pub category: MetricCategory,
    pub source: SourceTraceability,
    pub validation: ValidationResult,
    pub display_format: DisplayFormat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceTraceability {
    pub sheet: String,
    pub row: i32,
    pub column: String,
    pub raw_value: String,
    pub transformed_value: serde_json::Value,
    pub confidence: f32,
    pub validation_notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
    pub confidence_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DisplayFormat {
    #[serde(rename = "number")]
    Number,
    #[serde(rename = "percentage")]
    Percentage,
    #[serde(rename = "bytes")]
    Bytes,
    #[serde(rename = "currency")]
    Currency,
    #[serde(rename = "date")]
    Date,
    #[serde(rename = "duration")]
    Duration,
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "boolean")]
    Boolean,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSection {
    pub id: String,
    pub title: String,
    pub section_type: SectionType,
    pub order: i32,
    pub variables: Vec<String>, // DataVariable IDs
    pub layout: SectionLayout,
    pub styling: HashMap<String, String>,
    pub is_customizable: bool,
    pub is_removable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SectionType {
    #[serde(rename = "header")]
    Header,
    #[serde(rename = "summary")]
    Summary,
    #[serde(rename = "metrics_grid")]
    MetricsGrid,
    #[serde(rename = "capacity_chart")]
    CapacityChart,
    #[serde(rename = "compliance_table")]
    ComplianceTable,
    #[serde(rename = "timeline")]
    Timeline,
    #[serde(rename = "recommendations")]
    Recommendations,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SectionLayout {
    #[serde(rename = "single_column")]
    SingleColumn,
    #[serde(rename = "two_column")]
    TwoColumn,
    #[serde(rename = "three_column")]
    ThreeColumn,
    #[serde(rename = "grid")]
    Grid,
    #[serde(rename = "chart")]
    Chart,
    #[serde(rename = "table")]
    Table,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    #[serde(rename = "html")]
    Html,
    #[serde(rename = "pdf")]
    Pdf,
    #[serde(rename = "json")]
    Json,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandingConfig {
    pub company_name: String,
    pub logo_url: Option<String>,
    pub primary_color: String,
    pub secondary_color: String,
    pub accent_color: String,
    pub custom_css: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportStatus {
    #[serde(rename = "generating")]
    Generating,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cached")]
    Cached,
}

// Report Templates and Customization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportTemplate {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub report_type: ReportType,
    pub is_standard: bool,
    pub is_public: bool,
    pub sections: Vec<ReportSection>,
    pub default_config: ReportConfig,
    pub required_data_categories: Vec<MetricCategory>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportCustomization {
    pub id: Option<Thing>,
    pub report_id: Thing,
    pub customized_sections: Vec<ReportSection>,
    pub hidden_sections: Vec<String>,
    pub added_sections: Vec<ReportSection>,
    pub layout_changes: HashMap<String, serde_json::Value>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
}

// Metric Templates for Custom Reports
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricTemplate {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub category: MetricCategory,
    pub variables: Vec<TemplateVariable>,
    pub default_layout: SectionLayout,
    pub visualization_type: VisualizationType,
    pub is_standard: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateVariable {
    pub id: String,
    pub name: String,
    pub description: String,
    pub data_type: RvToolsDataType,
    pub is_required: bool,
    pub default_value: Option<serde_json::Value>,
    pub validation_rules: Vec<ValidationRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    pub rule_type: ValidationRuleType,
    pub parameters: HashMap<String, serde_json::Value>,
    pub error_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationRuleType {
    #[serde(rename = "required")]
    Required,
    #[serde(rename = "range")]
    Range,
    #[serde(rename = "pattern")]
    Pattern,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VisualizationType {
    #[serde(rename = "card")]
    Card,
    #[serde(rename = "chart")]
    Chart,
    #[serde(rename = "table")]
    Table,
    #[serde(rename = "gauge")]
    Gauge,
    #[serde(rename = "progress")]
    Progress,
    #[serde(rename = "timeline")]
    Timeline,
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
