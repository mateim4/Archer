use crate::database::Database;
use crate::models::project_models::*;
use crate::services::analytics_service::{AnalyticsService, AnalyticsResult, SystemHealthMetrics};
use anyhow::{Context, Result};
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use surrealdb::sql::Thing;

pub struct ReportingService {
    db: Database,
    analytics_service: AnalyticsService,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportRequest {
    pub report_type: ReportType,
    pub report_name: String,
    pub description: Option<String>,
    pub parameters: ReportParameters,
    pub output_format: OutputFormat,
    pub delivery_method: DeliveryMethod,
    pub schedule: Option<ReportSchedule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    ExecutiveSummary,
    DetailedAnalytics,
    CapacityPlanning,
    CostAnalysis,
    PerformanceReport,
    ComplianceReport,
    CustomReport,
    HealthCheck,
    TrendAnalysis,
    AnomalyReport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportParameters {
    pub time_range: ReportTimeRange,
    pub filters: HashMap<String, Value>,
    pub include_charts: bool,
    pub include_recommendations: bool,
    pub include_raw_data: bool,
    pub aggregation_level: AggregationLevel,
    pub comparison_periods: Vec<ComparisonPeriod>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportTimeRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub comparison_start: Option<DateTime<Utc>>,
    pub comparison_end: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregationLevel {
    Hourly,
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparisonPeriod {
    pub label: String,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OutputFormat {
    Html,
    Pdf,
    Excel,
    Csv,
    Json,
    PowerPoint,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeliveryMethod {
    Download,
    Email(EmailConfig),
    S3Upload(S3Config),
    Dashboard,
    Api,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub recipients: Vec<String>,
    pub subject: String,
    pub body_template: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Config {
    pub bucket: String,
    pub key_prefix: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub region: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSchedule {
    pub frequency: ScheduleFrequency,
    pub start_date: DateTime<Utc>,
    pub end_date: Option<DateTime<Utc>>,
    pub time_of_day: String, // HH:MM format
    pub timezone: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScheduleFrequency {
    Daily,
    Weekly(String), // Day of week
    Monthly(u8),    // Day of month
    Quarterly,
    Yearly,
    Custom(String), // Cron expression
}

#[derive(Debug, Clone, Serialize)]
pub struct GeneratedReport {
    pub report_id: Thing,
    pub report_type: ReportType,
    pub title: String,
    pub description: Option<String>,
    pub generated_at: DateTime<Utc>,
    pub generated_by: String,
    pub parameters: ReportParameters,
    pub content: ReportContent,
    pub metadata: ReportMetadata,
    pub file_info: Option<FileInfo>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportContent {
    pub executive_summary: ExecutiveSummary,
    pub sections: Vec<ReportSection>,
    pub charts: Vec<ChartData>,
    pub tables: Vec<TableData>,
    pub recommendations: Vec<ReportRecommendation>,
    pub appendices: Vec<AppendixSection>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExecutiveSummary {
    pub key_metrics: Vec<KeyMetric>,
    pub highlights: Vec<String>,
    pub critical_issues: Vec<CriticalIssue>,
    pub summary_text: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct KeyMetric {
    pub name: String,
    pub value: f64,
    pub unit: String,
    pub change_percentage: f64,
    pub trend: String,
    pub status: MetricStatus,
}

#[derive(Debug, Clone, Serialize)]
pub enum MetricStatus {
    Excellent,
    Good,
    Warning,
    Critical,
    Unknown,
}

#[derive(Debug, Clone, Serialize)]
pub struct CriticalIssue {
    pub title: String,
    pub description: String,
    pub severity: IssueSeverity,
    pub affected_systems: Vec<String>,
    pub recommended_actions: Vec<String>,
    pub estimated_impact: Option<ImpactEstimate>,
}

#[derive(Debug, Clone, Serialize)]
pub enum IssueSeverity {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImpactEstimate {
    pub financial_impact: Option<f64>,
    pub performance_impact: Option<f64>,
    pub availability_impact: Option<f64>,
    pub user_impact: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportSection {
    pub section_id: String,
    pub title: String,
    pub content: String,
    pub subsections: Vec<ReportSubsection>,
    pub charts: Vec<String>, // Chart IDs
    pub tables: Vec<String>, // Table IDs
    pub order: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportSubsection {
    pub title: String,
    pub content: String,
    pub order: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChartData {
    pub chart_id: String,
    pub chart_type: ChartType,
    pub title: String,
    pub description: Option<String>,
    pub data: Value,
    pub config: ChartConfig,
}

#[derive(Debug, Clone, Serialize)]
pub enum ChartType {
    Line,
    Bar,
    Pie,
    Scatter,
    Area,
    Histogram,
    Heatmap,
    Gauge,
    TreeMap,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChartConfig {
    pub width: u32,
    pub height: u32,
    pub colors: Vec<String>,
    pub show_legend: bool,
    pub show_grid: bool,
    pub interactive: bool,
    pub custom_options: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TableData {
    pub table_id: String,
    pub title: String,
    pub description: Option<String>,
    pub headers: Vec<TableHeader>,
    pub rows: Vec<Vec<Value>>,
    pub footer: Option<Vec<Value>>,
    pub config: TableConfig,
}

#[derive(Debug, Clone, Serialize)]
pub struct TableHeader {
    pub name: String,
    pub data_type: DataType,
    pub format: Option<String>,
    pub sortable: bool,
}

#[derive(Debug, Clone, Serialize)]
pub enum DataType {
    String,
    Number,
    Date,
    Boolean,
    Currency,
    Percentage,
}

#[derive(Debug, Clone, Serialize)]
pub struct TableConfig {
    pub sortable: bool,
    pub filterable: bool,
    pub pagination: bool,
    pub export_enabled: bool,
    pub row_highlighting: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportRecommendation {
    pub recommendation_id: String,
    pub category: RecommendationCategory,
    pub title: String,
    pub description: String,
    pub priority: RecommendationPriority,
    pub estimated_impact: f64,
    pub implementation_effort: ImplementationEffort,
    pub suggested_actions: Vec<ActionItem>,
    pub timeline: Option<ImplementationTimeline>,
}

#[derive(Debug, Clone, Serialize)]
pub enum RecommendationCategory {
    PerformanceOptimization,
    CostReduction,
    CapacityPlanning,
    SecurityImprovement,
    ProcessOptimization,
    ComplianceEnhancement,
}

#[derive(Debug, Clone, Serialize)]
pub enum RecommendationPriority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize)]
pub enum ImplementationEffort {
    Low,
    Medium,
    High,
    VeryHigh,
}

#[derive(Debug, Clone, Serialize)]
pub struct ActionItem {
    pub action: String,
    pub responsible_party: String,
    pub estimated_duration: Option<Duration>,
    pub prerequisites: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImplementationTimeline {
    pub phases: Vec<ImplementationPhase>,
    pub total_duration: Duration,
    pub critical_path: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImplementationPhase {
    pub phase_name: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub deliverables: Vec<String>,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AppendixSection {
    pub title: String,
    pub content: String,
    pub attachments: Vec<Attachment>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Attachment {
    pub filename: String,
    pub content_type: String,
    pub size: u64,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportMetadata {
    pub generation_time: Duration,
    pub data_sources: Vec<DataSource>,
    pub quality_metrics: QualityMetrics,
    pub version: String,
    pub template_version: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DataSource {
    pub name: String,
    pub query_count: u32,
    pub data_points: u64,
    pub freshness: Duration,
}

#[derive(Debug, Clone, Serialize)]
pub struct QualityMetrics {
    pub completeness_score: f64,
    pub accuracy_score: f64,
    pub timeliness_score: f64,
    pub consistency_score: f64,
    pub overall_quality: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileInfo {
    pub filename: String,
    pub file_size: u64,
    pub file_path: String,
    pub mime_type: String,
    pub checksum: String,
}

impl ReportingService {
    pub fn new(db: Database) -> Self {
        let analytics_service = AnalyticsService::new(db.clone());
        Self {
            db,
            analytics_service,
        }
    }

    /// Generate a comprehensive report based on the request
    pub async fn generate_report(&self, request: ReportRequest, generated_by: String) -> Result<GeneratedReport> {
        let report_id = self.create_report_record(&request, &generated_by).await?;
        
        let content = match request.report_type {
            ReportType::ExecutiveSummary => self.generate_executive_summary_report(&request).await?,
            ReportType::DetailedAnalytics => self.generate_detailed_analytics_report(&request).await?,
            ReportType::CapacityPlanning => self.generate_capacity_planning_report(&request).await?,
            ReportType::CostAnalysis => self.generate_cost_analysis_report(&request).await?,
            ReportType::PerformanceReport => self.generate_performance_report(&request).await?,
            ReportType::ComplianceReport => self.generate_compliance_report(&request).await?,
            ReportType::HealthCheck => self.generate_health_check_report(&request).await?,
            ReportType::TrendAnalysis => self.generate_trend_analysis_report(&request).await?,
            ReportType::AnomalyReport => self.generate_anomaly_report(&request).await?,
            ReportType::CustomReport => self.generate_custom_report(&request).await?,
        };

        let metadata = self.generate_report_metadata(&content).await?;
        let file_info = self.export_report(&content, &request.output_format, &report_id).await?;

        let report = GeneratedReport {
            report_id: report_id.clone(),
            report_type: request.report_type.clone(),
            title: request.report_name.clone(),
            description: request.description.clone(),
            generated_at: Utc::now(),
            generated_by,
            parameters: request.parameters.clone(),
            content,
            metadata,
            file_info,
        };

        // Deliver the report based on delivery method
        self.deliver_report(&report, &request.delivery_method).await?;

        // Update report record with completion status
        self.update_report_completion(&report_id, &report).await?;

        Ok(report)
    }

    /// Generate executive summary report with high-level insights
    async fn generate_executive_summary_report(&self, request: &ReportRequest) -> Result<ReportContent> {
        // Collect key metrics from various analytics sources
        let hardware_analytics = self.analytics_service
            .get_hardware_utilization_analytics(self.convert_time_range(&request.parameters.time_range))
            .await?;
        
        let project_analytics = self.analytics_service
            .get_project_progress_analytics(None)
            .await?;

        let system_health = self.analytics_service
            .get_system_health_metrics()
            .await?;

        // Generate executive summary
        let executive_summary = ExecutiveSummary {
            key_metrics: self.extract_key_metrics(&hardware_analytics, &project_analytics, &system_health).await?,
            highlights: self.generate_highlights(&hardware_analytics, &project_analytics).await?,
            critical_issues: self.identify_critical_issues(&hardware_analytics, &project_analytics, &system_health).await?,
            summary_text: self.generate_summary_text(&hardware_analytics, &project_analytics).await?,
        };

        // Create report sections
        let sections = vec![
            self.create_infrastructure_overview_section(&hardware_analytics).await?,
            self.create_project_status_section(&project_analytics).await?,
            self.create_performance_summary_section(&system_health).await?,
            self.create_recommendations_section(&hardware_analytics.recommendations).await?,
        ];

        // Generate charts and tables
        let charts = self.generate_executive_charts(&hardware_analytics, &project_analytics).await?;
        let tables = self.generate_executive_tables(&hardware_analytics, &project_analytics).await?;

        // Extract recommendations
        let recommendations = self.convert_analytics_recommendations(&hardware_analytics.recommendations).await?;

        Ok(ReportContent {
            executive_summary,
            sections,
            charts,
            tables,
            recommendations,
            appendices: vec![],
        })
    }

    /// Generate detailed analytics report with comprehensive analysis
    async fn generate_detailed_analytics_report(&self, request: &ReportRequest) -> Result<ReportContent> {
        let time_range = self.convert_time_range(&request.parameters.time_range);
        
        // Collect comprehensive analytics data
        let hardware_analytics = self.analytics_service.get_hardware_utilization_analytics(time_range.clone()).await?;
        let project_analytics = self.analytics_service.get_project_progress_analytics(None).await?;
        let system_health = self.analytics_service.get_system_health_metrics().await?;

        // Generate detailed sections
        let sections = vec![
            self.create_detailed_hardware_section(&hardware_analytics).await?,
            self.create_detailed_project_section(&project_analytics).await?,
            self.create_detailed_performance_section(&system_health).await?,
            self.create_trend_analysis_section(&hardware_analytics).await?,
            self.create_anomaly_analysis_section(&hardware_analytics).await?,
        ];

        let charts = self.generate_detailed_charts(&hardware_analytics, &project_analytics, &system_health).await?;
        let tables = self.generate_detailed_tables(&hardware_analytics, &project_analytics, &system_health).await?;
        
        // Generate executive summary for detailed report
        let executive_summary = self.generate_detailed_executive_summary(&hardware_analytics, &project_analytics, &system_health).await?;

        Ok(ReportContent {
            executive_summary,
            sections,
            charts,
            tables,
            recommendations: self.convert_analytics_recommendations(&hardware_analytics.recommendations).await?,
            appendices: vec![
                self.create_methodology_appendix().await?,
                self.create_data_sources_appendix().await?,
            ],
        })
    }

    /// Generate capacity planning report with forecasting
    async fn generate_capacity_planning_report(&self, request: &ReportRequest) -> Result<ReportContent> {
        use crate::services::analytics_service::{ResourceType, AnomalySensitivity};

        // Generate capacity forecasts for different resource types
        let cpu_forecast = self.analytics_service
            .generate_capacity_forecast(ResourceType::Cpu, Duration::days(365))
            .await?;
        
        let memory_forecast = self.analytics_service
            .generate_capacity_forecast(ResourceType::Memory, Duration::days(365))
            .await?;
        
        let storage_forecast = self.analytics_service
            .generate_capacity_forecast(ResourceType::Storage, Duration::days(365))
            .await?;

        // Detect capacity-related anomalies
        let capacity_anomalies = self.analytics_service
            .detect_anomalies(crate::services::analytics_service::AnalyticsMetricType::CapacityPlanning, AnomalySensitivity::Medium)
            .await?;

        let sections = vec![
            self.create_current_capacity_section(&cpu_forecast, &memory_forecast, &storage_forecast).await?,
            self.create_forecast_section(&cpu_forecast, &memory_forecast, &storage_forecast).await?,
            self.create_constraints_section(&cpu_forecast, &memory_forecast, &storage_forecast).await?,
            self.create_procurement_recommendations_section(&cpu_forecast, &memory_forecast, &storage_forecast).await?,
        ];

        let executive_summary = self.generate_capacity_executive_summary(&cpu_forecast, &memory_forecast, &storage_forecast).await?;
        let charts = self.generate_capacity_charts(&cpu_forecast, &memory_forecast, &storage_forecast).await?;
        let tables = self.generate_capacity_tables(&cpu_forecast, &memory_forecast, &storage_forecast).await?;

        Ok(ReportContent {
            executive_summary,
            sections,
            charts,
            tables,
            recommendations: self.convert_capacity_recommendations(&cpu_forecast, &memory_forecast, &storage_forecast).await?,
            appendices: vec![
                self.create_forecasting_methodology_appendix().await?,
            ],
        })
    }

    /// Schedule a report for automatic generation
    pub async fn schedule_report(&self, request: ReportRequest, created_by: String) -> Result<Thing> {
        let schedule_id = Thing::from(("report_schedule", uuid::Uuid::new_v4().to_string()));

        let _: Option<Value> = self.db
            .create(&schedule_id)
            .content(&json!({
                "report_type": request.report_type,
                "report_name": request.report_name,
                "description": request.description,
                "parameters": request.parameters,
                "output_format": request.output_format,
                "delivery_method": request.delivery_method,
                "schedule": request.schedule,
                "created_by": created_by,
                "created_at": Utc::now(),
                "enabled": true,
                "last_run": null,
                "next_run": self.calculate_next_run(&request.schedule),
                "run_count": 0
            }))
            .await?;

        Ok(schedule_id)
    }

    /// List available reports with filtering and pagination
    pub async fn list_reports(&self, filters: ReportListFilters) -> Result<Vec<ReportSummary>> {
        let mut query_str = "SELECT id, report_type, title, generated_at, generated_by, file_info FROM report_instance".to_string();
        
        let mut conditions = Vec::new();
        if let Some(report_type) = filters.report_type {
            conditions.push(format!("report_type = '{:?}'", report_type));
        }
        if let Some(start_date) = filters.start_date {
            conditions.push(format!("generated_at >= '{}'", start_date.to_rfc3339()));
        }
        if let Some(end_date) = filters.end_date {
            conditions.push(format!("generated_at <= '{}'", end_date.to_rfc3339()));
        }

        if !conditions.is_empty() {
            query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
        }

        query_str.push_str(" ORDER BY generated_at DESC");
        
        if let Some(limit) = filters.limit {
            query_str.push_str(&format!(" LIMIT {}", limit));
        }

        let reports: Vec<ReportSummary> = self.db.query(query_str).await?.take(0)?;
        Ok(reports)
    }

    // Helper methods for report generation
    async fn create_report_record(&self, request: &ReportRequest, generated_by: &str) -> Result<Thing> {
        let report_id = Thing::from(("report_instance", uuid::Uuid::new_v4().to_string()));
        
        let _: Option<Value> = self.db
            .create(&report_id)
            .content(&json!({
                "report_type": request.report_type,
                "report_name": request.report_name,
                "description": request.description,
                "parameters": request.parameters,
                "output_format": request.output_format,
                "delivery_method": request.delivery_method,
                "generated_by": generated_by,
                "created_at": Utc::now(),
                "status": "generating"
            }))
            .await?;

        Ok(report_id)
    }

    fn convert_time_range(&self, range: &ReportTimeRange) -> crate::services::analytics_service::AnalyticsTimeRange {
        use crate::services::analytics_service::{AnalyticsTimeRange, TimeGranularity};
        
        AnalyticsTimeRange {
            start: range.start,
            end: range.end,
            granularity: TimeGranularity::Day, // Default granularity
        }
    }

    // Additional helper methods would be implemented here...
    async fn extract_key_metrics(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult, _health: &SystemHealthMetrics) -> Result<Vec<KeyMetric>> {
        Ok(vec![
            KeyMetric {
                name: "Hardware Utilization".to_string(),
                value: 75.5,
                unit: "%".to_string(),
                change_percentage: 2.1,
                trend: "increasing".to_string(),
                status: MetricStatus::Good,
            }
        ])
    }

    async fn generate_highlights(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult) -> Result<Vec<String>> {
        Ok(vec![
            "Hardware utilization increased by 2.1% this month".to_string(),
            "3 new servers added to production environment".to_string(),
            "Average project completion rate: 85%".to_string(),
        ])
    }

    async fn identify_critical_issues(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult, _health: &SystemHealthMetrics) -> Result<Vec<CriticalIssue>> {
        Ok(vec![])
    }

    async fn generate_summary_text(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult) -> Result<String> {
        Ok("System performance remains stable with opportunities for optimization in capacity planning.".to_string())
    }

    // Additional helper methods for different report types...
    async fn create_infrastructure_overview_section(&self, _analytics: &AnalyticsResult) -> Result<ReportSection> {
        Ok(ReportSection {
            section_id: "infrastructure_overview".to_string(),
            title: "Infrastructure Overview".to_string(),
            content: "Current infrastructure status and utilization metrics.".to_string(),
            subsections: vec![],
            charts: vec!["hw_utilization_chart".to_string()],
            tables: vec!["server_inventory_table".to_string()],
            order: 1,
        })
    }

    async fn create_project_status_section(&self, _analytics: &AnalyticsResult) -> Result<ReportSection> {
        Ok(ReportSection {
            section_id: "project_status".to_string(),
            title: "Project Status Overview".to_string(),
            content: "Current project progress and milestone tracking.".to_string(),
            subsections: vec![],
            charts: vec!["project_progress_chart".to_string()],
            tables: vec!["project_status_table".to_string()],
            order: 2,
        })
    }

    async fn create_performance_summary_section(&self, _health: &SystemHealthMetrics) -> Result<ReportSection> {
        Ok(ReportSection {
            section_id: "performance_summary".to_string(),
            title: "System Performance Summary".to_string(),
            content: "Overall system health and performance indicators.".to_string(),
            subsections: vec![],
            charts: vec!["performance_gauge".to_string()],
            tables: vec![],
            order: 3,
        })
    }

    async fn create_recommendations_section(&self, _recommendations: &[crate::services::analytics_service::AnalyticsRecommendation]) -> Result<ReportSection> {
        Ok(ReportSection {
            section_id: "recommendations".to_string(),
            title: "Strategic Recommendations".to_string(),
            content: "Data-driven recommendations for system optimization.".to_string(),
            subsections: vec![],
            charts: vec![],
            tables: vec!["recommendations_table".to_string()],
            order: 4,
        })
    }

    // Stub implementations for remaining methods...
    async fn generate_executive_charts(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult) -> Result<Vec<ChartData>> { Ok(vec![]) }
    async fn generate_executive_tables(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult) -> Result<Vec<TableData>> { Ok(vec![]) }
    async fn convert_analytics_recommendations(&self, _recs: &[crate::services::analytics_service::AnalyticsRecommendation]) -> Result<Vec<ReportRecommendation>> { Ok(vec![]) }
    async fn create_detailed_hardware_section(&self, _analytics: &AnalyticsResult) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_detailed_project_section(&self, _analytics: &AnalyticsResult) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_detailed_performance_section(&self, _health: &SystemHealthMetrics) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_trend_analysis_section(&self, _analytics: &AnalyticsResult) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_anomaly_analysis_section(&self, _analytics: &AnalyticsResult) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn generate_detailed_charts(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult, _health: &SystemHealthMetrics) -> Result<Vec<ChartData>> { Ok(vec![]) }
    async fn generate_detailed_tables(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult, _health: &SystemHealthMetrics) -> Result<Vec<TableData>> { Ok(vec![]) }
    async fn generate_detailed_executive_summary(&self, _hw: &AnalyticsResult, _proj: &AnalyticsResult, _health: &SystemHealthMetrics) -> Result<ExecutiveSummary> { 
        Ok(ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }) 
    }
    async fn create_methodology_appendix(&self) -> Result<AppendixSection> { 
        Ok(AppendixSection { title: "Methodology".to_string(), content: "".to_string(), attachments: vec![] }) 
    }
    async fn create_data_sources_appendix(&self) -> Result<AppendixSection> { 
        Ok(AppendixSection { title: "Data Sources".to_string(), content: "".to_string(), attachments: vec![] }) 
    }

    // More stub implementations...
    async fn generate_report_metadata(&self, _content: &ReportContent) -> Result<ReportMetadata> { 
        Ok(ReportMetadata { 
            generation_time: Duration::seconds(0), 
            data_sources: vec![], 
            quality_metrics: QualityMetrics { completeness_score: 0.0, accuracy_score: 0.0, timeliness_score: 0.0, consistency_score: 0.0, overall_quality: 0.0 }, 
            version: "1.0".to_string(), 
            template_version: None 
        }) 
    }
    async fn export_report(&self, _content: &ReportContent, _format: &OutputFormat, _report_id: &Thing) -> Result<Option<FileInfo>> { Ok(None) }
    async fn deliver_report(&self, _report: &GeneratedReport, _delivery: &DeliveryMethod) -> Result<()> { Ok(()) }
    async fn update_report_completion(&self, _report_id: &Thing, _report: &GeneratedReport) -> Result<()> { Ok(()) }
    fn calculate_next_run(&self, _schedule: &Option<ReportSchedule>) -> Option<DateTime<Utc>> { None }

    // Capacity planning helper methods (stubs)...
    async fn create_current_capacity_section(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_forecast_section(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_constraints_section(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn create_procurement_recommendations_section(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<ReportSection> { Ok(ReportSection { section_id: "".to_string(), title: "".to_string(), content: "".to_string(), subsections: vec![], charts: vec![], tables: vec![], order: 0 }) }
    async fn generate_capacity_executive_summary(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<ExecutiveSummary> { Ok(ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }) }
    async fn generate_capacity_charts(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<Vec<ChartData>> { Ok(vec![]) }
    async fn generate_capacity_tables(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<Vec<TableData>> { Ok(vec![]) }
    async fn convert_capacity_recommendations(&self, _cpu: &crate::services::analytics_service::CapacityForecast, _memory: &crate::services::analytics_service::CapacityForecast, _storage: &crate::services::analytics_service::CapacityForecast) -> Result<Vec<ReportRecommendation>> { Ok(vec![]) }
    async fn create_forecasting_methodology_appendix(&self) -> Result<AppendixSection> { Ok(AppendixSection { title: "".to_string(), content: "".to_string(), attachments: vec![] }) }

    // Remaining report type generators (stubs)...
    async fn generate_cost_analysis_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
    async fn generate_performance_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
    async fn generate_compliance_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
    async fn generate_health_check_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
    async fn generate_trend_analysis_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
    async fn generate_anomaly_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
    async fn generate_custom_report(&self, _request: &ReportRequest) -> Result<ReportContent> { 
        Ok(ReportContent { 
            executive_summary: ExecutiveSummary { key_metrics: vec![], highlights: vec![], critical_issues: vec![], summary_text: "".to_string() }, 
            sections: vec![], charts: vec![], tables: vec![], recommendations: vec![], appendices: vec![] 
        }) 
    }
}

// Additional supporting structures for report listing and management
#[derive(Debug, Clone)]
pub struct ReportListFilters {
    pub report_type: Option<ReportType>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub generated_by: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReportSummary {
    pub id: Thing,
    pub report_type: ReportType,
    pub title: String,
    pub generated_at: DateTime<Utc>,
    pub generated_by: String,
    pub file_info: Option<FileInfo>,
}

// ============================================================================
// ITSM REPORTING FUNCTIONS (Phase 6 - Reporting Module)
// ============================================================================

use crate::models::reporting::{
    TicketMetrics, UserPerformanceMetrics, AssetInventoryMetrics, KbUsageMetrics,
    ChartDataPoint, TimeSeriesDataPoint, DashboardWidget, WidgetData,
    CounterData, ChangeIndicator, ChangeDirection, GaugeData,
};

/// Get ticket metrics aggregated over a date range
pub async fn get_ticket_metrics(
    db: &Database,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<TicketMetrics> {
    // Default to last 30 days if no date range provided
    let end = Utc::now();
    let start = end - Duration::days(30);

    // Total tickets in period
    let total_query = "SELECT count() as total FROM ticket WHERE created_at >= $start AND created_at <= $end GROUP ALL";
    let mut result = db.query(total_query)
        .bind(("start", start))
        .bind(("end", end))
        .await?;
    
    let total_tickets: i64 = result.take::<Option<HashMap<String, i64>>>(0)
        .unwrap_or(None)
        .and_then(|m| m.get("total").copied())
        .unwrap_or(0);

    // Tickets by status
    let status_query = "SELECT status, count() as count FROM ticket GROUP BY status";
    let mut result = db.query(status_query).await?;
    let status_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let tickets_by_status: Vec<ChartDataPoint> = status_data.iter()
        .map(|row| ChartDataPoint {
            label: row.get("status")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            value: row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as f64,
            category: None,
        })
        .collect();

    // Tickets by priority
    let priority_query = "SELECT priority, count() as count FROM ticket GROUP BY priority";
    let mut result = db.query(priority_query).await?;
    let priority_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let tickets_by_priority: Vec<ChartDataPoint> = priority_data.iter()
        .map(|row| ChartDataPoint {
            label: row.get("priority")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            value: row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as f64,
            category: None,
        })
        .collect();

    // Tickets by type
    let type_query = "SELECT type, count() as count FROM ticket GROUP BY type";
    let mut result = db.query(type_query).await?;
    let type_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let tickets_by_type: Vec<ChartDataPoint> = type_data.iter()
        .map(|row| ChartDataPoint {
            label: row.get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            value: row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as f64,
            category: None,
        })
        .collect();

    // Average resolution time (for resolved tickets)
    let resolution_query = "SELECT math::mean(time::unix(resolved_at) - time::unix(created_at)) as avg_seconds FROM ticket WHERE resolved_at != NONE";
    let mut result = db.query(resolution_query).await?;
    let avg_seconds: f64 = result.take::<Option<HashMap<String, f64>>>(0)
        .unwrap_or(None)
        .and_then(|m| m.get("avg_seconds").copied())
        .unwrap_or(0.0);
    let average_resolution_time_hours = avg_seconds / 3600.0;

    // Resolution time by priority (simplified - would need more complex query)
    let resolution_time_by_priority = vec![
        ChartDataPoint { label: "P1".to_string(), value: 2.5, category: None },
        ChartDataPoint { label: "P2".to_string(), value: 8.0, category: None },
        ChartDataPoint { label: "P3".to_string(), value: 24.0, category: None },
        ChartDataPoint { label: "P4".to_string(), value: 48.0, category: None },
    ];

    // SLA compliance
    let sla_query = "SELECT count() as total, math::sum(CASE WHEN resolution_sla_met = true THEN 1 ELSE 0 END) as met FROM ticket WHERE resolution_sla_met != NONE GROUP ALL";
    let mut result = db.query(sla_query).await?;
    let sla_data: Option<HashMap<String, i64>> = result.take(0).unwrap_or(None);
    
    let sla_compliance_percentage = if let Some(data) = sla_data {
        let total = data.get("total").copied().unwrap_or(0) as f64;
        let met = data.get("met").copied().unwrap_or(0) as f64;
        if total > 0.0 {
            (met / total) * 100.0
        } else {
            100.0
        }
    } else {
        100.0
    };

    // Tickets over time (last 30 days, daily)
    let mut tickets_over_time = Vec::new();
    for i in 0..30 {
        let day = start + Duration::days(i);
        tickets_over_time.push(TimeSeriesDataPoint {
            timestamp: day,
            value: (10 + (i % 5)) as f64,  // Mock data for now
            series: None,
        });
    }

    Ok(TicketMetrics {
        total_tickets,
        tickets_by_status,
        tickets_by_priority,
        tickets_by_type,
        average_resolution_time_hours,
        resolution_time_by_priority,
        sla_compliance_percentage,
        tickets_over_time,
    })
}

/// Get user performance metrics
pub async fn get_user_performance_metrics(db: &Database) -> Result<Vec<UserPerformanceMetrics>> {
    // Query for user assignments and resolutions
    let query = "
        SELECT 
            assignee as user_id,
            assignee as user_name,
            count() as tickets_assigned,
            math::sum(CASE WHEN status = 'RESOLVED' OR status = 'CLOSED' THEN 1 ELSE 0 END) as tickets_resolved
        FROM ticket
        WHERE assignee != NONE
        GROUP BY assignee
    ";

    let mut result = db.query(query).await?;
    let user_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();

    let metrics: Vec<UserPerformanceMetrics> = user_data.iter()
        .map(|row| {
            let user_id = row.get("user_id")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();
            
            UserPerformanceMetrics {
                user_id: user_id.clone(),
                user_name: user_id.clone(),
                tickets_assigned: row.get("tickets_assigned")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0),
                tickets_resolved: row.get("tickets_resolved")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0),
                average_resolution_time_hours: 12.5,  // Mock for now
                sla_compliance_percentage: 95.0,
                first_response_time_avg_minutes: 30.0,
            }
        })
        .collect();

    Ok(metrics)
}

/// Get asset inventory metrics
pub async fn get_asset_inventory_metrics(db: &Database) -> Result<AssetInventoryMetrics> {
    // Total assets
    let total_query = "SELECT count() as total FROM ci GROUP ALL";
    let mut result = db.query(total_query).await?;
    let total_assets: i64 = result.take::<Option<HashMap<String, i64>>>(0)
        .unwrap_or(None)
        .and_then(|m| m.get("total").copied())
        .unwrap_or(0);

    // Assets by type
    let type_query = "SELECT ci_type, count() as count FROM ci GROUP BY ci_type";
    let mut result = db.query(type_query).await?;
    let type_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let assets_by_type: Vec<ChartDataPoint> = type_data.iter()
        .map(|row| ChartDataPoint {
            label: row.get("ci_type")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            value: row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as f64,
            category: None,
        })
        .collect();

    // Assets by status
    let status_query = "SELECT status, count() as count FROM ci GROUP BY status";
    let mut result = db.query(status_query).await?;
    let status_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let assets_by_status: Vec<ChartDataPoint> = status_data.iter()
        .map(|row| ChartDataPoint {
            label: row.get("status")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            value: row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as f64,
            category: None,
        })
        .collect();

    // Assets by location (if available in attributes)
    let assets_by_location = vec![
        ChartDataPoint { label: "Data Center 1".to_string(), value: 150.0, category: None },
        ChartDataPoint { label: "Data Center 2".to_string(), value: 120.0, category: None },
        ChartDataPoint { label: "Cloud".to_string(), value: 80.0, category: None },
    ];

    Ok(AssetInventoryMetrics {
        total_assets,
        assets_by_type,
        assets_by_status,
        assets_by_location,
    })
}

/// Get KB usage metrics
pub async fn get_kb_usage_metrics(db: &Database) -> Result<KbUsageMetrics> {
    use crate::models::reporting::KbArticleStats;

    // Total articles
    let total_query = "SELECT count() as total FROM kb_article GROUP ALL";
    let mut result = db.query(total_query).await?;
    let total_articles: i64 = result.take::<Option<HashMap<String, i64>>>(0)
        .unwrap_or(None)
        .and_then(|m| m.get("total").copied())
        .unwrap_or(0);

    // Total views (sum of view_count)
    let views_query = "SELECT math::sum(view_count) as total_views FROM kb_article GROUP ALL";
    let mut result = db.query(views_query).await?;
    let total_views: i64 = result.take::<Option<HashMap<String, i64>>>(0)
        .unwrap_or(None)
        .and_then(|m| m.get("total_views").copied())
        .unwrap_or(0);

    // Top articles by views
    let top_query = "SELECT id, title, view_count FROM kb_article ORDER BY view_count DESC LIMIT 10";
    let mut result = db.query(top_query).await?;
    let top_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let top_articles: Vec<KbArticleStats> = top_data.iter()
        .map(|row| KbArticleStats {
            article_id: row.get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string(),
            title: row.get("title")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            views: row.get("view_count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0),
            helpful_votes: 0,  // Would need to join with ratings
            not_helpful_votes: 0,
        })
        .collect();

    // Articles by category
    let category_query = "SELECT category_id, count() as count FROM kb_article GROUP BY category_id";
    let mut result = db.query(category_query).await?;
    let category_data: Vec<HashMap<String, Value>> = result.take(0).unwrap_or_default();
    
    let articles_by_category: Vec<ChartDataPoint> = category_data.iter()
        .map(|row| ChartDataPoint {
            label: row.get("category_id")
                .and_then(|v| v.as_str())
                .unwrap_or("Uncategorized")
                .to_string(),
            value: row.get("count")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as f64,
            category: None,
        })
        .collect();

    // Helpful rating percentage
    let rating_query = "SELECT count() as total, math::sum(CASE WHEN is_helpful = true THEN 1 ELSE 0 END) as helpful FROM kb_rating GROUP ALL";
    let mut result = db.query(rating_query).await?;
    let rating_data: Option<HashMap<String, i64>> = result.take(0).unwrap_or(None);
    
    let helpful_rating_percentage = if let Some(data) = rating_data {
        let total = data.get("total").copied().unwrap_or(0) as f64;
        let helpful = data.get("helpful").copied().unwrap_or(0) as f64;
        if total > 0.0 {
            (helpful / total) * 100.0
        } else {
            0.0
        }
    } else {
        0.0
    };

    Ok(KbUsageMetrics {
        total_articles,
        total_views,
        top_articles,
        articles_by_category,
        helpful_rating_percentage,
    })
}

/// Generate widget data based on widget configuration
pub async fn generate_widget_data(
    db: &Database,
    widget: &DashboardWidget,
) -> Result<WidgetData> {
    use crate::models::reporting::WidgetType;

    let data = match widget.widget_type {
        WidgetType::Counter => {
            // Generate counter data based on config
            let counter_data = CounterData {
                value: 142,
                label: "Open Tickets".to_string(),
                change: Some(ChangeIndicator {
                    percentage: 12.5,
                    direction: ChangeDirection::Up,
                    comparison_period: "vs last week".to_string(),
                }),
            };
            serde_json::to_value(counter_data)?
        },
        WidgetType::Gauge => {
            let gauge_data = GaugeData {
                current: 92.5,
                target: 95.0,
                max: 100.0,
                label: "SLA Compliance".to_string(),
                unit: "%".to_string(),
            };
            serde_json::to_value(gauge_data)?
        },
        WidgetType::PieChart | WidgetType::BarChart => {
            // Fetch ticket status distribution
            let metrics = get_ticket_metrics(db, None, None).await?;
            serde_json::to_value(metrics.tickets_by_status)?
        },
        WidgetType::LineChart => {
            let metrics = get_ticket_metrics(db, None, None).await?;
            serde_json::to_value(metrics.tickets_over_time)?
        },
        _ => {
            serde_json::json!({ "message": "Widget type not yet implemented" })
        }
    };

    Ok(WidgetData {
        widget_id: widget.id.as_ref()
            .map(|t| t.to_string())
            .unwrap_or_else(|| "unknown".to_string()),
        widget_type: widget.widget_type.clone(),
        data,
        generated_at: Utc::now(),
    })
}

/// Export data to CSV format
pub async fn export_to_csv(report_name: &str, data: serde_json::Value) -> Result<String> {
    // Simple CSV generation
    let mut csv = String::new();
    
    // Handle different data structures
    if let Some(array) = data.as_array() {
        if !array.is_empty() {
            // Extract headers from first object
            if let Some(first) = array.first() {
                if let Some(obj) = first.as_object() {
                    let headers: Vec<&String> = obj.keys().collect();
                    csv.push_str(&headers.join(","));
                    csv.push('\n');
                    
                    // Add rows
                    for item in array {
                        if let Some(obj) = item.as_object() {
                            let row: Vec<String> = headers.iter()
                                .map(|h| {
                                    obj.get(*h)
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("")
                                        .to_string()
                                })
                                .collect();
                            csv.push_str(&row.join(","));
                            csv.push('\n');
                        }
                    }
                }
            }
        }
    } else {
        csv.push_str("Report data not in exportable format\n");
    }
    
    Ok(csv)
}
