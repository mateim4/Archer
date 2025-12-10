use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// REPORT DEFINITION MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportDefinition {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub report_type: ReportType,
    /// Configuration for filters, grouping, columns stored as JSON
    pub config: serde_json::Value,
    /// Whether this report is shared (public) vs personal
    pub is_public: bool,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default)]
    pub schedule: Option<ReportSchedule>,
    #[serde(default)]
    pub tenant_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReportType {
    #[serde(rename = "TICKET_METRICS")]
    TicketMetrics,      // Volume, resolution time, SLA
    #[serde(rename = "USER_PERFORMANCE")]
    UserPerformance,    // Agent metrics
    #[serde(rename = "ASSET_INVENTORY")]
    AssetInventory,     // CMDB reports
    #[serde(rename = "SLA_COMPLIANCE")]
    SlaCompliance,      // SLA breach analysis
    #[serde(rename = "KB_USAGE")]
    KbUsage,            // Article views, helpfulness
    #[serde(rename = "AUDIT_TRAIL")]
    AuditTrail,         // Security/compliance
    #[serde(rename = "CUSTOM")]
    Custom,             // Ad-hoc queries
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSchedule {
    pub frequency: ScheduleFrequency,
    pub recipients: Vec<String>,    // Email addresses
    pub format: ExportFormat,
    pub last_run: Option<DateTime<Utc>>,
    pub next_run: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScheduleFrequency {
    #[serde(rename = "DAILY")]
    Daily,
    #[serde(rename = "WEEKLY")]
    Weekly,
    #[serde(rename = "MONTHLY")]
    Monthly,
    #[serde(rename = "QUARTERLY")]
    Quarterly,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExportFormat {
    #[serde(rename = "PDF")]
    PDF,
    #[serde(rename = "CSV")]
    CSV,
    #[serde(rename = "EXCEL")]
    Excel,
    #[serde(rename = "JSON")]
    JSON,
}

// ============================================================================
// DASHBOARD MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dashboard {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub widgets: Vec<Thing>,  // References to DashboardWidget IDs
    pub layout: serde_json::Value,  // Grid layout configuration
    pub is_default: bool,
    pub is_public: bool,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default)]
    pub tenant_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardWidget {
    pub id: Option<Thing>,
    pub dashboard_id: Option<Thing>,
    pub name: String,
    pub widget_type: WidgetType,
    /// Configuration for data source, filters, display options
    pub config: serde_json::Value,
    pub position: WidgetPosition,
    pub size: WidgetSize,
    pub refresh_interval_seconds: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WidgetType {
    #[serde(rename = "COUNTER")]
    Counter,        // Single number
    #[serde(rename = "PIE_CHART")]
    PieChart,       // Distribution
    #[serde(rename = "BAR_CHART")]
    BarChart,       // Comparison
    #[serde(rename = "LINE_CHART")]
    LineChart,      // Trend over time
    #[serde(rename = "TABLE")]
    Table,          // Data grid
    #[serde(rename = "GAUGE")]
    Gauge,          // Progress/SLA
    #[serde(rename = "HEATMAP")]
    Heatmap,        // Activity patterns
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WidgetPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WidgetSize {
    pub width: i32,   // Grid units
    pub height: i32,
}

// ============================================================================
// WIDGET DATA MODELS (Runtime data returned to frontend)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WidgetData {
    pub widget_id: String,
    pub widget_type: WidgetType,
    pub data: serde_json::Value,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CounterData {
    pub value: i64,
    pub label: String,
    pub change: Option<ChangeIndicator>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeIndicator {
    pub percentage: f64,
    pub direction: ChangeDirection,
    pub comparison_period: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChangeDirection {
    #[serde(rename = "UP")]
    Up,
    #[serde(rename = "DOWN")]
    Down,
    #[serde(rename = "NEUTRAL")]
    Neutral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartDataPoint {
    pub label: String,
    pub value: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesDataPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub series: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub headers: Vec<TableHeader>,
    pub rows: Vec<serde_json::Value>,
    pub total_rows: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableHeader {
    pub key: String,
    pub label: String,
    pub sortable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GaugeData {
    pub current: f64,
    pub target: f64,
    pub max: f64,
    pub label: String,
    pub unit: String,
}

// ============================================================================
// REQUEST/RESPONSE MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReportRequest {
    pub name: String,
    pub description: Option<String>,
    pub report_type: ReportType,
    pub config: serde_json::Value,
    #[serde(default)]
    pub is_public: bool,
    pub schedule: Option<ReportSchedule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateReportRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub config: Option<serde_json::Value>,
    pub is_public: Option<bool>,
    pub schedule: Option<ReportSchedule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunReportRequest {
    #[serde(default)]
    pub start_date: Option<DateTime<Utc>>,
    #[serde(default)]
    pub end_date: Option<DateTime<Utc>>,
    #[serde(default)]
    pub filters: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportListResponse {
    pub reports: Vec<ReportDefinition>,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDashboardRequest {
    pub name: String,
    pub description: Option<String>,
    #[serde(default)]
    pub is_default: bool,
    #[serde(default)]
    pub is_public: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDashboardRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub layout: Option<serde_json::Value>,
    pub is_default: Option<bool>,
    pub is_public: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWidgetRequest {
    pub dashboard_id: String,
    pub name: String,
    pub widget_type: WidgetType,
    pub config: serde_json::Value,
    pub position: WidgetPosition,
    pub size: WidgetSize,
    pub refresh_interval_seconds: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWidgetRequest {
    pub name: Option<String>,
    pub config: Option<serde_json::Value>,
    pub position: Option<WidgetPosition>,
    pub size: Option<WidgetSize>,
    pub refresh_interval_seconds: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardListResponse {
    pub dashboards: Vec<Dashboard>,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardDetailResponse {
    #[serde(flatten)]
    pub dashboard: Dashboard,
    pub widget_details: Vec<DashboardWidget>,
}

// ============================================================================
// METRICS AGGREGATION MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketMetrics {
    pub total_tickets: i64,
    pub tickets_by_status: Vec<ChartDataPoint>,
    pub tickets_by_priority: Vec<ChartDataPoint>,
    pub tickets_by_type: Vec<ChartDataPoint>,
    pub average_resolution_time_hours: f64,
    pub resolution_time_by_priority: Vec<ChartDataPoint>,
    pub sla_compliance_percentage: f64,
    pub tickets_over_time: Vec<TimeSeriesDataPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPerformanceMetrics {
    pub user_id: String,
    pub user_name: String,
    pub tickets_assigned: i64,
    pub tickets_resolved: i64,
    pub average_resolution_time_hours: f64,
    pub sla_compliance_percentage: f64,
    pub first_response_time_avg_minutes: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetInventoryMetrics {
    pub total_assets: i64,
    pub assets_by_type: Vec<ChartDataPoint>,
    pub assets_by_status: Vec<ChartDataPoint>,
    pub assets_by_location: Vec<ChartDataPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KbUsageMetrics {
    pub total_articles: i64,
    pub total_views: i64,
    pub top_articles: Vec<KbArticleStats>,
    pub articles_by_category: Vec<ChartDataPoint>,
    pub helpful_rating_percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KbArticleStats {
    pub article_id: String,
    pub title: String,
    pub views: i64,
    pub helpful_votes: i64,
    pub not_helpful_votes: i64,
}
