use crate::database::Database;
use crate::services::analytics_service::{AnalyticsService, AnalyticsTimeRange, TimeGranularity, ResourceType, AnomalySensitivity, AnalyticsMetricType};
use crate::services::reporting_service::{ReportingService, ReportRequest, ReportListFilters};
use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, Duration};
use std::sync::Arc;
use serde_json::json;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/analytics")
            .route("/hardware/utilization", web::get().to(get_hardware_utilization_analytics))
            .route("/hardware/capacity", web::get().to(get_hardware_capacity_analytics))
            .route("/projects/progress", web::get().to(get_project_progress_analytics))
            .route("/projects/performance", web::get().to(get_project_performance_analytics))
            .route("/system/health", web::get().to(get_system_health_metrics))
            .route("/system/trends", web::get().to(get_system_trends))
            .route("/anomalies", web::get().to(get_anomaly_detection))
            .route("/forecasts/capacity", web::post().to(generate_capacity_forecast))
            .route("/custom", web::post().to(execute_custom_analytics))
            .route("/export", web::post().to(export_analytics_data))
            .route("/dashboard", web::get().to(get_dashboard_data))
            .route("/benchmarks", web::get().to(get_benchmark_comparisons))
    )
    .service(
        web::scope("/reports")
            .route("/generate", web::post().to(generate_report))
            .route("/list", web::get().to(list_reports))
            .route("/{report_id}", web::get().to(get_report))
            .route("/{report_id}/download", web::get().to(download_report))
            .route("/schedules", web::post().to(create_report_schedule))
            .route("/schedules", web::get().to(list_report_schedules))
            .route("/schedules/{schedule_id}", web::delete().to(delete_report_schedule))
            .route("/templates", web::get().to(list_report_templates))
    );
}

#[derive(Debug, Deserialize)]
pub struct AnalyticsTimeQuery {
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub granularity: Option<TimeGranularity>,
    pub resource_filter: Option<Vec<String>>,
    pub project_filter: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct AnomalyDetectionQuery {
    pub metric_type: AnalyticsMetricType,
    pub sensitivity: Option<AnomalySensitivity>,
    pub time_window: Option<i64>, // Hours
}

#[derive(Debug, Deserialize)]
pub struct CapacityForecastRequest {
    pub resource_type: ResourceType,
    pub forecast_duration: i64, // Days
    pub confidence_level: Option<f64>,
    pub scenario: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CustomAnalyticsRequest {
    pub query: String,
    pub parameters: serde_json::Value,
    pub time_range: Option<AnalyticsTimeRange>,
    pub output_format: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ExportAnalyticsRequest {
    pub analytics_type: String,
    pub time_range: AnalyticsTimeRange,
    pub format: ExportFormat,
    pub filters: Option<serde_json::Value>,
    pub include_raw_data: Option<bool>,
}

#[derive(Debug, Deserialize, Clone)]
pub enum ExportFormat {
    Json,
    Csv,
    Excel,
    Pdf,
}

#[derive(Debug, Serialize)]
pub struct DashboardData {
    pub overview: DashboardOverview,
    pub charts: Vec<DashboardChart>,
    pub alerts: Vec<DashboardAlert>,
    pub recent_activities: Vec<DashboardActivity>,
    pub system_status: SystemStatusSummary,
    pub key_metrics: Vec<KeyMetricCard>,
}

#[derive(Debug, Serialize)]
pub struct DashboardOverview {
    pub total_servers: u32,
    pub active_projects: u32,
    pub average_utilization: f64,
    pub system_health_score: f64,
    pub capacity_remaining: f64,
    pub cost_trend: f64,
}

#[derive(Debug, Serialize)]
pub struct DashboardChart {
    pub chart_id: String,
    pub title: String,
    pub chart_type: String,
    pub data: serde_json::Value,
    pub config: serde_json::Value,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct DashboardAlert {
    pub alert_id: String,
    pub severity: AlertSeverity,
    pub title: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub source: String,
    pub action_required: bool,
}

#[derive(Debug, Serialize)]
pub enum AlertSeverity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

#[derive(Debug, Serialize)]
pub struct DashboardActivity {
    pub activity_id: String,
    pub activity_type: String,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub user: String,
    pub related_resource: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SystemStatusSummary {
    pub overall_status: SystemStatus,
    pub components: Vec<ComponentStatus>,
    pub uptime: Duration,
    pub last_maintenance: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub enum SystemStatus {
    Healthy,
    Warning,
    Critical,
    Maintenance,
    Unknown,
}

#[derive(Debug, Serialize)]
pub struct ComponentStatus {
    pub component_name: String,
    pub status: SystemStatus,
    pub health_score: f64,
    pub last_check: DateTime<Utc>,
    pub issues: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct KeyMetricCard {
    pub metric_name: String,
    pub current_value: f64,
    pub previous_value: Option<f64>,
    pub unit: String,
    pub trend: TrendDirection,
    pub status: MetricStatus,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub enum TrendDirection {
    Up,
    Down,
    Stable,
    Unknown,
}

#[derive(Debug, Serialize)]
pub enum MetricStatus {
    Excellent,
    Good,
    Warning,
    Critical,
    Unknown,
}

#[derive(Debug, Serialize)]
pub struct BenchmarkComparison {
    pub benchmark_name: String,
    pub current_performance: f64,
    pub benchmark_value: f64,
    pub variance_percentage: f64,
    pub performance_rating: PerformanceRating,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize)]
pub enum PerformanceRating {
    Excellent,
    Good,
    Average,
    BelowAverage,
    Poor,
}

// Analytics API Handlers

pub async fn get_hardware_utilization_analytics(
    db: web::Data<Arc<Database>>,
    query: web::Query<AnalyticsTimeQuery>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    let time_range = create_time_range(&query);
    
    match analytics_service.get_hardware_utilization_analytics(time_range).await {
        Ok(analytics) => Ok(HttpResponse::Ok().json(analytics)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get hardware utilization analytics",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_hardware_capacity_analytics(
    db: web::Data<Arc<Database>>,
    query: web::Query<AnalyticsTimeQuery>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    let time_range = create_time_range(&query);
    
    match analytics_service.get_hardware_capacity_analytics(time_range).await {
        Ok(analytics) => Ok(HttpResponse::Ok().json(analytics)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get hardware capacity analytics",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_project_progress_analytics(
    db: web::Data<Arc<Database>>,
    query: web::Query<AnalyticsTimeQuery>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    // Extract project filter if provided
    let project_ids = query.project_filter.clone();
    
    match analytics_service.get_project_progress_analytics(project_ids).await {
        Ok(analytics) => Ok(HttpResponse::Ok().json(analytics)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get project progress analytics",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_project_performance_analytics(
    db: web::Data<Arc<Database>>,
    query: web::Query<AnalyticsTimeQuery>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    let time_range = create_time_range(&query);
    let project_ids = query.project_filter.clone();
    
    match analytics_service.get_project_performance_analytics(project_ids, time_range).await {
        Ok(analytics) => Ok(HttpResponse::Ok().json(analytics)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get project performance analytics",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_system_health_metrics(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    match analytics_service.get_system_health_metrics().await {
        Ok(metrics) => Ok(HttpResponse::Ok().json(metrics)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get system health metrics",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_system_trends(
    db: web::Data<Arc<Database>>,
    query: web::Query<AnalyticsTimeQuery>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    let time_range = create_time_range(&query);
    
    match analytics_service.get_system_trends(time_range).await {
        Ok(trends) => Ok(HttpResponse::Ok().json(trends)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get system trends",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_anomaly_detection(
    db: web::Data<Arc<Database>>,
    query: web::Query<AnomalyDetectionQuery>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    let sensitivity = query.sensitivity.unwrap_or(AnomalySensitivity::Medium);
    
    match analytics_service.detect_anomalies(query.metric_type.clone(), sensitivity).await {
        Ok(anomalies) => Ok(HttpResponse::Ok().json(anomalies)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to detect anomalies",
            "details": e.to_string()
        }))),
    }
}

pub async fn generate_capacity_forecast(
    db: web::Data<Arc<Database>>,
    request: web::Json<CapacityForecastRequest>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    let forecast_duration = Duration::days(request.forecast_duration);
    
    match analytics_service.generate_capacity_forecast(request.resource_type.clone(), forecast_duration).await {
        Ok(forecast) => Ok(HttpResponse::Ok().json(forecast)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to generate capacity forecast",
            "details": e.to_string()
        }))),
    }
}

pub async fn execute_custom_analytics(
    db: web::Data<Arc<Database>>,
    request: web::Json<CustomAnalyticsRequest>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    match analytics_service.execute_analytics_query(
        request.query.clone(),
        request.parameters.clone(),
        request.time_range.clone(),
    ).await {
        Ok(result) => Ok(HttpResponse::Ok().json(result)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to execute custom analytics",
            "details": e.to_string()
        }))),
    }
}

pub async fn export_analytics_data(
    db: web::Data<Arc<Database>>,
    request: web::Json<ExportAnalyticsRequest>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    match analytics_service.export_analytics_data(
        request.analytics_type.clone(),
        request.time_range.clone(),
        request.filters.clone().unwrap_or_default(),
        request.include_raw_data.unwrap_or(false),
    ).await {
        Ok(export_data) => {
            // In a real implementation, you would format the data according to the requested format
            match request.format {
                ExportFormat::Json => Ok(HttpResponse::Ok().json(export_data)),
                ExportFormat::Csv => {
                    // Convert to CSV format
                    Ok(HttpResponse::Ok()
                        .content_type("text/csv")
                        .body("CSV export not yet implemented"))
                },
                ExportFormat::Excel => {
                    Ok(HttpResponse::Ok()
                        .content_type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        .body("Excel export not yet implemented"))
                },
                ExportFormat::Pdf => {
                    Ok(HttpResponse::Ok()
                        .content_type("application/pdf")
                        .body("PDF export not yet implemented"))
                },
            }
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to export analytics data",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_dashboard_data(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    // Gather data for dashboard
    let system_health = analytics_service.get_system_health_metrics().await.unwrap_or_default();
    let time_range = AnalyticsTimeRange {
        start: Utc::now() - Duration::days(7),
        end: Utc::now(),
        granularity: TimeGranularity::Day,
    };
    let hardware_analytics = analytics_service.get_hardware_utilization_analytics(time_range).await.unwrap_or_default();
    
    let dashboard_data = DashboardData {
        overview: DashboardOverview {
            total_servers: 50, // This would come from actual data
            active_projects: 12,
            average_utilization: 75.5,
            system_health_score: system_health.overall_health_score,
            capacity_remaining: 24.5,
            cost_trend: 5.2,
        },
        charts: vec![
            DashboardChart {
                chart_id: "utilization_trend".to_string(),
                title: "Hardware Utilization Trend".to_string(),
                chart_type: "line".to_string(),
                data: json!({"labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "datasets": [{"data": [65, 68, 72, 75, 73, 76, 78]}]}),
                config: json!({"responsive": true}),
                last_updated: Utc::now(),
            }
        ],
        alerts: vec![
            DashboardAlert {
                alert_id: "alert_001".to_string(),
                severity: AlertSeverity::Warning,
                title: "High CPU Utilization".to_string(),
                description: "Server cluster-01 is experiencing high CPU utilization".to_string(),
                created_at: Utc::now() - Duration::minutes(15),
                source: "monitoring_system".to_string(),
                action_required: true,
            }
        ],
        recent_activities: vec![
            DashboardActivity {
                activity_id: "activity_001".to_string(),
                activity_type: "server_allocation".to_string(),
                description: "Allocated 3 servers to Project Alpha".to_string(),
                timestamp: Utc::now() - Duration::minutes(30),
                user: "system".to_string(),
                related_resource: Some("project_alpha".to_string()),
            }
        ],
        system_status: SystemStatusSummary {
            overall_status: SystemStatus::Healthy,
            components: vec![
                ComponentStatus {
                    component_name: "Database".to_string(),
                    status: SystemStatus::Healthy,
                    health_score: 95.0,
                    last_check: Utc::now() - Duration::minutes(5),
                    issues: vec![],
                },
                ComponentStatus {
                    component_name: "Hardware Pool".to_string(),
                    status: SystemStatus::Warning,
                    health_score: 85.0,
                    last_check: Utc::now() - Duration::minutes(2),
                    issues: vec!["High utilization on cluster-01".to_string()],
                }
            ],
            uptime: Duration::days(30),
            last_maintenance: Some(Utc::now() - Duration::days(7)),
        },
        key_metrics: vec![
            KeyMetricCard {
                metric_name: "Total Servers".to_string(),
                current_value: 50.0,
                previous_value: Some(48.0),
                unit: "count".to_string(),
                trend: TrendDirection::Up,
                status: MetricStatus::Good,
                description: Some("Active servers in the hardware pool".to_string()),
            },
            KeyMetricCard {
                metric_name: "Average Utilization".to_string(),
                current_value: 75.5,
                previous_value: Some(72.3),
                unit: "%".to_string(),
                trend: TrendDirection::Up,
                status: MetricStatus::Warning,
                description: Some("Average CPU utilization across all servers".to_string()),
            }
        ],
    };
    
    Ok(HttpResponse::Ok().json(dashboard_data))
}

pub async fn get_benchmark_comparisons(
    db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    let analytics_service = AnalyticsService::new((**db).clone());
    
    match analytics_service.get_benchmark_comparisons().await {
        Ok(benchmarks) => {
            let benchmark_comparisons: Vec<BenchmarkComparison> = benchmarks.into_iter().map(|b| {
                BenchmarkComparison {
                    benchmark_name: b.benchmark_name,
                    current_performance: b.current_value,
                    benchmark_value: b.benchmark_value,
                    variance_percentage: ((b.current_value - b.benchmark_value) / b.benchmark_value) * 100.0,
                    performance_rating: match b.performance_score {
                        score if score >= 90.0 => PerformanceRating::Excellent,
                        score if score >= 80.0 => PerformanceRating::Good,
                        score if score >= 70.0 => PerformanceRating::Average,
                        score if score >= 60.0 => PerformanceRating::BelowAverage,
                        _ => PerformanceRating::Poor,
                    },
                    recommendations: b.recommendations,
                }
            }).collect();
            
            Ok(HttpResponse::Ok().json(benchmark_comparisons))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to get benchmark comparisons",
            "details": e.to_string()
        }))),
    }
}

// Reporting API Handlers

pub async fn generate_report(
    db: web::Data<Arc<Database>>,
    request: web::Json<ReportRequest>,
) -> Result<HttpResponse> {
    let reporting_service = ReportingService::new((**db).clone());
    
    match reporting_service.generate_report(request.into_inner(), "api_user".to_string()).await {
        Ok(report) => Ok(HttpResponse::Ok().json(json!({
            "report_id": report.report_id,
            "status": "generated",
            "generated_at": report.generated_at,
            "file_info": report.file_info
        }))),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to generate report",
            "details": e.to_string()
        }))),
    }
}

pub async fn list_reports(
    db: web::Data<Arc<Database>>,
    query: web::Query<ReportListQueryParams>,
) -> Result<HttpResponse> {
    let reporting_service = ReportingService::new((**db).clone());
    
    let filters = ReportListFilters {
        report_type: query.report_type.clone(),
        start_date: query.start_date,
        end_date: query.end_date,
        generated_by: query.generated_by.clone(),
        limit: query.limit.map(|l| l as usize),
        offset: query.offset.map(|o| o as usize),
    };
    
    match reporting_service.list_reports(filters).await {
        Ok(reports) => Ok(HttpResponse::Ok().json(reports)),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to list reports",
            "details": e.to_string()
        }))),
    }
}

pub async fn get_report(
    db: web::Data<Arc<Database>>,
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let _report_id = path.into_inner();
    let _reporting_service = ReportingService::new((**db).clone());
    
    // Implementation would fetch the specific report
    Ok(HttpResponse::Ok().json(json!({
        "message": "Report retrieval not yet implemented"
    })))
}

pub async fn download_report(
    path: web::Path<String>,
) -> Result<HttpResponse> {
    let _report_id = path.into_inner();
    
    // Implementation would serve the report file for download
    Ok(HttpResponse::Ok().json(json!({
        "message": "Report download not yet implemented"
    })))
}

pub async fn create_report_schedule(
    db: web::Data<Arc<Database>>,
    request: web::Json<ReportRequest>,
) -> Result<HttpResponse> {
    let reporting_service = ReportingService::new((**db).clone());
    
    match reporting_service.schedule_report(request.into_inner(), "api_user".to_string()).await {
        Ok(schedule_id) => Ok(HttpResponse::Ok().json(json!({
            "schedule_id": schedule_id,
            "status": "scheduled"
        }))),
        Err(e) => Ok(HttpResponse::InternalServerError().json(json!({
            "error": "Failed to schedule report",
            "details": e.to_string()
        }))),
    }
}

pub async fn list_report_schedules(
    _db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    // Implementation would list report schedules
    Ok(HttpResponse::Ok().json(json!({
        "message": "Report schedule listing not yet implemented"
    })))
}

pub async fn delete_report_schedule(
    _db: web::Data<Arc<Database>>,
    _path: web::Path<String>,
) -> Result<HttpResponse> {
    // Implementation would delete a report schedule
    Ok(HttpResponse::Ok().json(json!({
        "message": "Report schedule deletion not yet implemented"
    })))
}

pub async fn list_report_templates(
    _db: web::Data<Arc<Database>>,
) -> Result<HttpResponse> {
    // Implementation would list available report templates
    Ok(HttpResponse::Ok().json(json!({
        "templates": [
            {
                "template_id": "executive_summary",
                "name": "Executive Summary",
                "description": "High-level overview report for executives"
            },
            {
                "template_id": "detailed_analytics",
                "name": "Detailed Analytics",
                "description": "Comprehensive analytical report"
            },
            {
                "template_id": "capacity_planning",
                "name": "Capacity Planning",
                "description": "Infrastructure capacity planning report"
            }
        ]
    })))
}

// Helper functions

fn create_time_range(query: &AnalyticsTimeQuery) -> AnalyticsTimeRange {
    let default_start = Utc::now() - Duration::days(30);
    let default_end = Utc::now();
    
    AnalyticsTimeRange {
        start: query.start_date.unwrap_or(default_start),
        end: query.end_date.unwrap_or(default_end),
        granularity: query.granularity.clone().unwrap_or(TimeGranularity::Day),
    }
}

#[derive(Debug, Deserialize)]
pub struct ReportListQueryParams {
    pub report_type: Option<crate::services::reporting_service::ReportType>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub generated_by: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
