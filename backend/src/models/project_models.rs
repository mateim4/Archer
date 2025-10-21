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

// =============================================================================
// DESTINATION CLUSTER MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DestinationCluster {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    
    // Cluster Configuration
    pub hypervisor: HypervisorType,
    pub storage_type: DestinationStorageType,
    pub nodes: Vec<Thing>, // References to hardware_pool servers
    pub node_count: i32,
    
    // Capacity Configuration
    pub overcommit_ratios: OvercommitRatios,
    pub ha_policy: HaPolicy,
    pub capacity_totals: ClusterCapacity,
    pub capacity_available: ClusterCapacity,
    pub capacity_reserved: ClusterCapacity,
    
    // Network Configuration
    pub network_profile_id: Option<Thing>,
    pub management_network: NetworkConfig,
    pub workload_network: NetworkConfig,
    pub storage_network: Option<NetworkConfig>,
    pub migration_network: Option<NetworkConfig>,
    
    // Status and Lifecycle
    pub status: ClusterStatus,
    pub build_status: BuildStatus,
    pub validation_results: Vec<ValidationIssue>,
    
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HypervisorType {
    #[serde(rename = "hyper-v")]
    HyperV,
    #[serde(rename = "vmware")]
    VMware,
    #[serde(rename = "azure-local")]
    AzureLocal,
    #[serde(rename = "kvm")]
    Kvm,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DestinationStorageType {
    #[serde(rename = "s2d")]
    S2D,
    #[serde(rename = "traditional")]
    Traditional,
    #[serde(rename = "azure_local")]
    AzureLocal,
    #[serde(rename = "vsan")]
    VSan,
    #[serde(rename = "san")]
    San,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HaPolicy {
    #[serde(rename = "n+0")]
    NPlusZero,
    #[serde(rename = "n+1")]
    NPlusOne,
    #[serde(rename = "n+2")]
    NPlusTwo,
    #[serde(rename = "none")]
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterCapacity {
    pub cpu_cores: i32,
    pub cpu_ghz: f64,
    pub memory_gb: i32,
    pub storage_gb: i64,
    pub storage_iops: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub vlan_id: Option<i32>,
    pub subnet: Option<String>,
    pub gateway: Option<String>,
    pub dns_servers: Vec<String>,
    pub mtu: Option<i32>,
    pub nic_teaming: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClusterStatus {
    #[serde(rename = "planning")]
    Planning,
    #[serde(rename = "validated")]
    Validated,
    #[serde(rename = "building")]
    Building,
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "decommissioned")]
    Decommissioned,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BuildStatus {
    #[serde(rename = "not_started")]
    NotStarted,
    #[serde(rename = "hardware_ordered")]
    HardwareOrdered,
    #[serde(rename = "hardware_received")]
    HardwareReceived,
    #[serde(rename = "racking")]
    Racking,
    #[serde(rename = "cabling")]
    Cabling,
    #[serde(rename = "os_installation")]
    OsInstallation,
    #[serde(rename = "cluster_configuration")]
    ClusterConfiguration,
    #[serde(rename = "validation")]
    Validation,
    #[serde(rename = "completed")]
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub severity: ValidationSeverity,
    pub category: String,
    pub message: String,
    pub recommendation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationSeverity {
    #[serde(rename = "info")]
    Info,
    #[serde(rename = "warning")]
    Warning,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "critical")]
    Critical,
}

// =============================================================================
// VM PLACEMENT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmPlacementPlan {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_id: Thing,
    pub rvtools_upload_id: Thing,
    
    // Source Selection
    pub source_cluster_names: Vec<String>,
    pub source_vm_filter: Option<VmFilter>,
    pub total_vms_selected: i32,
    
    // Placement Results
    pub placements: Vec<VmPlacement>,
    pub spillover_vms: Vec<SpilloverVm>,
    pub unplaced_vms: Vec<UnplacedVm>,
    
    // Placement Strategy
    pub strategy: PlacementStrategy,
    pub constraints: PlacementConstraints,
    
    // Status and Metadata
    pub status: PlacementStatus,
    pub warnings: Vec<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmPlacement {
    pub vm_name: String,
    pub vm_id: Option<Thing>,
    pub source_cluster: String,
    pub destination_cluster_id: Thing,
    pub destination_host_id: Option<Thing>,
    pub placement_reason: String,
    pub confidence_score: f32,
    pub resources_allocated: VmResources,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmResources {
    pub vcpu: i32,
    pub cpu_ghz: f64,
    pub memory_gb: i32,
    pub storage_gb: i64,
    pub network_mbps: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpilloverVm {
    pub vm_name: String,
    pub source_cluster: String,
    pub reason: String,
    pub required_resources: VmResources,
    pub suggested_cluster_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnplacedVm {
    pub vm_name: String,
    pub source_cluster: String,
    pub reason: String,
    pub required_resources: VmResources,
    pub blocking_constraints: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VmFilter {
    pub cluster_names: Option<Vec<String>>,
    pub vm_name_pattern: Option<String>,
    pub min_cpu: Option<i32>,
    pub min_memory_gb: Option<i32>,
    pub power_state: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PlacementStrategy {
    #[serde(rename = "balanced")]
    Balanced,
    #[serde(rename = "fill_first")]
    FillFirst,
    #[serde(rename = "performance")]
    Performance,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlacementConstraints {
    pub enforce_anti_affinity: bool,
    pub max_vms_per_host: Option<i32>,
    pub require_same_storage_tier: bool,
    pub network_requirements: Vec<NetworkRequirement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRequirement {
    pub vlan_id: i32,
    pub bandwidth_mbps: Option<i32>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PlacementStatus {
    #[serde(rename = "draft")]
    Draft,
    #[serde(rename = "validated")]
    Validated,
    #[serde(rename = "approved")]
    Approved,
    #[serde(rename = "executing")]
    Executing,
    #[serde(rename = "completed")]
    Completed,
}

// =============================================================================
// CAPACITY SNAPSHOT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacitySnapshot {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_id: Thing,
    pub name: String,
    pub description: Option<String>,
    
    // Input Parameters
    pub source_upload_id: Thing,
    pub source_summary: SourceCapacitySummary,
    pub target_clusters: Vec<Thing>,
    pub overcommit_ratios: OvercommitRatios,
    pub ha_policy: HaPolicy,
    pub headroom_percentage: f32,
    
    // Computed Results
    pub total_capacity: ClusterCapacity,
    pub used_capacity: ClusterCapacity,
    pub available_capacity: ClusterCapacity,
    pub reserved_capacity: ClusterCapacity,
    
    // Analysis Results
    pub bottlenecks: Vec<CapacityBottleneck>,
    pub recommendations: Vec<String>,
    pub risk_assessment: RiskAssessment,
    
    // Status
    pub is_valid: bool,
    pub validation_errors: Vec<String>,
    
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceCapacitySummary {
    pub total_vms: i32,
    pub total_cpu_cores: i32,
    pub total_cpu_ghz: f64,
    pub total_memory_gb: i32,
    pub total_storage_gb: i64,
    pub avg_cpu_utilization: Option<f32>,
    pub avg_memory_utilization: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacityBottleneck {
    pub resource_type: ResourceType,
    pub severity: ValidationSeverity,
    pub current_usage_percent: f32,
    pub projected_usage_percent: f32,
    pub message: String,
    pub recommendation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResourceType {
    #[serde(rename = "cpu")]
    Cpu,
    #[serde(rename = "memory")]
    Memory,
    #[serde(rename = "storage")]
    Storage,
    #[serde(rename = "network")]
    Network,
    #[serde(rename = "iops")]
    Iops,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAssessment {
    pub overall_risk: RiskLevel,
    pub risk_factors: Vec<RiskFactor>,
    pub mitigation_strategies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskFactor {
    pub category: String,
    pub severity: ValidationSeverity,
    pub description: String,
    pub impact: String,
}

// =============================================================================
// NETWORK PROFILE MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkProfileTemplate {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub hypervisor: HypervisorType,
    pub storage_type: DestinationStorageType,
    
    // Requirements
    pub required_nics: i32,
    pub recommended_nics: i32,
    pub requires_rdma: bool,
    pub requires_teaming: bool,
    pub min_bandwidth_gbps: f64,
    
    // Network Topology
    pub network_topology: NetworkTopology,
    pub vlan_requirements: Vec<VlanRequirement>,
    
    // Validation Rules
    pub validation_rules: Vec<NetworkValidationRule>,
    
    // Examples and Documentation
    pub example_configuration: Option<String>,
    pub documentation_url: Option<String>,
    
    pub is_standard: bool,
    pub is_active: bool,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkTopology {
    #[serde(rename = "converged")]
    Converged,
    #[serde(rename = "separated")]
    Separated,
    #[serde(rename = "fully_converged")]
    FullyConverged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VlanRequirement {
    pub purpose: NetworkPurpose,
    pub vlan_id_range: Option<VlanRange>,
    pub is_required: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VlanRange {
    pub min: i32,
    pub max: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum NetworkPurpose {
    #[serde(rename = "management")]
    Management,
    #[serde(rename = "workload")]
    Workload,
    #[serde(rename = "storage")]
    Storage,
    #[serde(rename = "migration")]
    Migration,
    #[serde(rename = "backup")]
    Backup,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkValidationRule {
    pub rule_type: NetworkRuleType,
    pub parameters: HashMap<String, serde_json::Value>,
    pub error_message: String,
    pub severity: ValidationSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkRuleType {
    #[serde(rename = "min_bandwidth")]
    MinBandwidth,
    #[serde(rename = "rdma_support")]
    RdmaSupport,
    #[serde(rename = "vlan_separation")]
    VlanSeparation,
    #[serde(rename = "nic_count")]
    NicCount,
    #[serde(rename = "teaming_config")]
    TeamingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkProfileInstance {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_id: Thing,
    pub template_id: Thing,
    
    // User Configuration
    pub vlan_mappings: HashMap<NetworkPurpose, i32>,
    pub nic_assignments: HashMap<NetworkPurpose, Vec<String>>,
    pub custom_settings: HashMap<String, serde_json::Value>,
    
    // Validation Results
    pub is_valid: bool,
    pub validation_results: Vec<NetworkValidationResult>,
    pub warnings: Vec<String>,
    
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkValidationResult {
    pub rule_name: String,
    pub passed: bool,
    pub message: String,
    pub severity: ValidationSeverity,
    pub recommendation: Option<String>,
}

// =============================================================================
// DOCUMENT TEMPLATE MODELS (for HLD Generation)
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentTemplate {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub document_type: DocumentType,
    pub hypervisor: Option<HypervisorType>,
    pub storage_type: Option<DestinationStorageType>,
    
    // Template File
    pub file_path: String,
    pub file_size_bytes: i64,
    pub file_hash: String,
    
    // Template Structure
    pub variables_schema: Vec<TemplateVariable>,
    pub sections: Vec<TemplateSection>,
    pub version: String,
    
    // Metadata
    pub is_standard: bool,
    pub is_active: bool,
    pub author: String,
    pub tags: Vec<String>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentType {
    #[serde(rename = "hld")]
    Hld,
    #[serde(rename = "lld")]
    Lld,
    #[serde(rename = "migration_plan")]
    MigrationPlan,
    #[serde(rename = "runbook")]
    Runbook,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateSection {
    pub id: String,
    pub title: String,
    pub order: i32,
    pub is_required: bool,
    pub variables: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedDocument {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_id: Thing,
    pub template_id: Thing,
    
    // Document Information
    pub document_name: String,
    pub document_type: DocumentType,
    pub file_path: String,
    pub file_size_bytes: i64,
    pub file_format: DocumentFormat,
    
    // Generation Context
    pub variables_snapshot: HashMap<String, serde_json::Value>,
    pub data_sources: Vec<Thing>, // RVTools uploads, capacity snapshots, etc.
    
    // Status
    pub generation_status: DocumentGenerationStatus,
    pub error_message: Option<String>,
    
    pub metadata: HashMap<String, serde_json::Value>,
    pub generated_at: DateTime<Utc>,
    pub generated_by: String,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentFormat {
    #[serde(rename = "docx")]
    Docx,
    #[serde(rename = "pdf")]
    Pdf,
    #[serde(rename = "html")]
    Html,
    #[serde(rename = "markdown")]
    Markdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DocumentGenerationStatus {
    #[serde(rename = "queued")]
    Queued,
    #[serde(rename = "generating")]
    Generating,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
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
