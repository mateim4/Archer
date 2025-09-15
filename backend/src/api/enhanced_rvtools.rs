use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

use crate::{
    database::Database,
    services::enhanced_rvtools_service::{EnhancedRvToolsService, RvToolsExcelUploadData},
    models::project_models::*,
};
use serde_json::json;

pub fn create_enhanced_rvtools_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/excel/upload", post(upload_rvtools_excel))
        .route("/uploads", get(get_rvtools_uploads))
        .route("/generate-report", post(generate_report_data))
        .route("/export-report", post(export_report_file))
        .route("/reports/generate", post(generate_standard_reports))
        .route("/reports/customize", post(customize_report))
        .route("/reports/templates", get(list_report_templates))
        .route("/reports/export/:report_id", post(export_report))
        .route("/storage/analysis/:upload_id", get(get_storage_analysis))
        .route("/s2d/compliance/:upload_id", get(get_s2d_compliance))
        .route("/validation/rules", get(get_validation_rules))
        .route("/data/traceability/:upload_id", get(get_data_traceability))
        .with_state(db)
}

// =============================================================================
// ENHANCED EXCEL UPLOAD AND PROCESSING
// =============================================================================

async fn upload_rvtools_excel(
    State(db): State<Arc<Database>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, ApiError> {
    let mut filename = None;
    let mut excel_data = None;
    let mut project_id = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::BadRequest(e.to_string()))? {
        let name = field.name().unwrap_or("").to_string();
        
        match name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                let data = field.bytes().await.map_err(|e| ApiError::BadRequest(e.to_string()))?;
                excel_data = Some(data.to_vec());
            }
            "project_id" => {
                let data = field.bytes().await.map_err(|e| ApiError::BadRequest(e.to_string()))?;
                let project_id_str = String::from_utf8_lossy(&data).to_string();
                if !project_id_str.is_empty() {
                    project_id = Some(surrealdb::sql::Thing::from(("project", project_id_str.as_str())));
                }
            }
            _ => {}
        }
    }

    let filename = filename.ok_or_else(|| ApiError::BadRequest("No file uploaded".to_string()))?;
    let excel_data = excel_data.ok_or_else(|| ApiError::BadRequest("No file content".to_string()))?;

    if !filename.to_lowercase().ends_with(".xlsx") && !filename.to_lowercase().ends_with(".xls") {
        return Err(ApiError::BadRequest("Only Excel files (.xlsx, .xls) are supported".to_string()));
    }

    let upload_data = RvToolsExcelUploadData {
        filename,
        excel_data,
        project_id,
    };

    let service = EnhancedRvToolsService::new((*db).clone());
    
    match service.process_rvtools_excel(upload_data).await {
        Ok(result) => Ok((StatusCode::CREATED, Json(EnhancedRvToolsUploadResponse {
            upload_id: result.upload_id,
            sheets_processed: result.sheets_processed,
            total_rows_processed: result.total_rows_processed,
            total_vms: result.total_vms,
            total_hosts: result.total_hosts,
            total_clusters: result.total_clusters,
            processing_errors: result.processing_errors,
            warnings: result.warnings,
            storage_analysis: result.storage_analysis.is_some(),
            s2d_compliance_clusters: result.s2d_compliance.keys().cloned().collect(),
            upload_timestamp: Utc::now(),
        }))),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// UPLOAD MANAGEMENT ENDPOINTS  
// =============================================================================

async fn get_rvtools_uploads(
    State(db): State<Arc<Database>>,
    Query(query): Query<HashMap<String, String>>,
) -> Result<impl IntoResponse, ApiError> {
    let mut query_str = "SELECT * FROM rvtools_upload".to_string();
    let mut conditions = Vec::new();
    
    if let Some(project_id) = query.get("project_id") {
        conditions.push(format!("project_id = project:{}", project_id));
    }
    
    if !conditions.is_empty() {
        query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }
    
    query_str.push_str(" ORDER BY upload_date DESC");
    
    let uploads: Vec<RvToolsUpload> = db
        .query(&query_str)
        .await
        .map_err(|e| ApiError::InternalError(e.to_string()))?
        .take(0)
        .map_err(|e| ApiError::InternalError(e.to_string()))?;
    
    Ok(Json(uploads))
}

async fn generate_report_data(
    State(db): State<Arc<Database>>,
    Json(request): Json<GenerateReportDataRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = EnhancedRvToolsService::new((*db).clone());
    
    match service.generate_report_data(&request.upload_id, &request.report_type).await {
        Ok(report_data) => Ok(Json(GeneratedReportData {
            upload_id: request.upload_id,
            report_type: request.report_type,
            data: report_data,
            generated_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn export_report_file(
    State(db): State<Arc<Database>>,
    Json(request): Json<ExportReportFileRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = ReportGenerationService::new((*db).clone());
    
    match service.export_report_file(&request.report_id, &request.format).await {
        Ok(file_data) => Ok(Json(ExportedFileData {
            report_id: request.report_id,
            format: request.format,
            file_name: file_data.file_name,
            file_size: file_data.file_size,
            download_url: file_data.download_url,
            exported_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// REPORT GENERATION ENDPOINTS
// =============================================================================

async fn generate_standard_reports(
    State(db): State<Arc<Database>>,
    Json(request): Json<GenerateReportsRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = ReportGenerationService::new((*db).clone());
    
    match service.generate_standard_reports(request).await {
        Ok(reports) => Ok(Json(GenerateReportsResponse {
            reports,
            generated_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn customize_report(
    State(db): State<Arc<Database>>,
    Json(customization): Json<ReportCustomizationRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = ReportGenerationService::new((*db).clone());
    
    match service.customize_report(customization).await {
        Ok(customized_report) => Ok(Json(customized_report)),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn list_report_templates(
    State(db): State<Arc<Database>>,
    Query(query): Query<ListTemplatesQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let mut conditions = Vec::new();
    
    if let Some(report_type) = query.report_type {
        conditions.push(format!("report_type = '{}'", report_type));
    }
    
    if let Some(is_standard) = query.is_standard {
        conditions.push(format!("is_standard = {}", is_standard));
    }

    let mut query_str = "SELECT * FROM report_template".to_string();
    
    if !conditions.is_empty() {
        query_str.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }
    
    query_str.push_str(" ORDER BY created_at DESC");

    // Use raw JSON response to avoid struct conversion issues
    let raw_templates: Result<Vec<serde_json::Value>, _> = db
        .query(query_str)
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match raw_templates {
        Ok(templates) => {
            let total = templates.len();
            let response = serde_json::json!({
                "templates": templates,
                "total": total
            });
            Ok(Json(response))
        },
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn export_report(
    State(db): State<Arc<Database>>,
    Path(report_id): Path<String>,
    Json(export_config): Json<ExportReportRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let service = ReportExportService::new((*db).clone());
    
    match service.export_report(report_id, export_config).await {
        Ok(exported_data) => Ok(Json(ExportReportResponse {
            export_url: exported_data.export_url,
            format: exported_data.format,
            file_size: exported_data.file_size,
            expires_at: exported_data.expires_at,
            generated_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// STORAGE ANALYSIS ENDPOINTS
// =============================================================================

async fn get_storage_analysis(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let storage_analyses: Result<Vec<StorageArchitectureAnalysis>, _> = db
        .query("SELECT * FROM storage_architecture_analysis WHERE upload_id = $upload_id")
        .bind(("upload_id", surrealdb::sql::Thing::from(("rvtools_upload", upload_id.as_str()))))
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match storage_analyses {
        Ok(analyses) => Ok(Json(StorageAnalysisResponse {
            upload_id,
            analyses,
            generated_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

async fn get_s2d_compliance(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
    Query(query): Query<S2dComplianceQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let service = EnhancedRvToolsService::new((*db).clone());
    let upload_thing = surrealdb::sql::Thing::from(("rvtools_upload", upload_id.as_str()));
    
    let compliance_results = if let Some(cluster_name) = query.cluster_name {
        // Get compliance for specific cluster
        match service.check_s2d_compliance(&upload_thing, &cluster_name).await {
            Ok(compliance) => HashMap::from([(cluster_name, compliance)]),
            Err(e) => return Err(ApiError::InternalError(e.to_string())),
        }
    } else {
        // Get compliance for all confirmed vSAN clusters
        let mut results = HashMap::new();
        let vsan_clusters = vec!["ASNCLUBA0001", "ASNCLUHRK001", "PLBYDCL03"];
        
        for cluster in vsan_clusters {
            if let Ok(compliance) = service.check_s2d_compliance(&upload_thing, cluster).await {
                results.insert(cluster.to_string(), compliance);
            }
        }
        results
    };

    Ok(Json(S2dComplianceResponse {
        upload_id,
        compliance_results,
        generated_at: Utc::now(),
    }))
}

// =============================================================================
// DATA VALIDATION AND TRACEABILITY
// =============================================================================

async fn get_validation_rules(
    State(_db): State<Arc<Database>>,
) -> Result<impl IntoResponse, ApiError> {
    let rules = ValidationRulesResponse {
        rules: vec![
            ValidationRuleInfo {
                rule_name: "CPU Cores Validation".to_string(),
                description: "Validates CPU core values are numeric and reasonable".to_string(),
                applies_to: vec!["vHost".to_string()],
                parameters: HashMap::from([
                    ("min_value".to_string(), json!(1)),
                    ("max_value".to_string(), json!(256)),
                ]),
            },
            ValidationRuleInfo {
                rule_name: "Memory Capacity Validation".to_string(),
                description: "Validates memory values include proper units (MB/GB/TB)".to_string(),
                applies_to: vec!["vHost".to_string(), "vInfo".to_string()],
                parameters: HashMap::new(),
            },
            ValidationRuleInfo {
                rule_name: "Storage Capacity Validation".to_string(),
                description: "Validates storage capacity values and units".to_string(),
                applies_to: vec!["vDatastore".to_string()],
                parameters: HashMap::new(),
            },
        ],
    };

    Ok(Json(rules))
}

async fn get_data_traceability(
    State(db): State<Arc<Database>>,
    Path(upload_id): Path<String>,
    Query(query): Query<DataTraceabilityQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let mut conditions = vec![format!("upload_id = $upload_id")];
    
    if let Some(sheet_name) = &query.sheet_name {
        conditions.push(format!("sheet_name = '{}'", sheet_name));
    }
    
    if let Some(confidence_threshold) = query.confidence_threshold {
        conditions.push(format!("confidence_score >= {}", confidence_threshold));
    }

    let query_str = format!(
        "SELECT * FROM rvtools_excel_data WHERE {} ORDER BY sheet_name, row_number, column_index",
        conditions.join(" AND ")
    );
    
    let mut query_builder = db.query(query_str);
    query_builder = query_builder.bind(("upload_id", surrealdb::sql::Thing::from(("rvtools_upload", upload_id.as_str()))));
    
    if let Some(limit) = query.limit {
        query_builder = query_builder.bind(("limit", limit));
    }

    let traceability_data: Result<Vec<RvToolsExcelData>, _> = query_builder
        .await
        .map(|mut response| response.take(0))
        .and_then(|result| result);

    match traceability_data {
        Ok(data) => Ok(Json(DataTraceabilityResponse {
            upload_id,
            total_records: data.len(),
            data,
            generated_at: Utc::now(),
        })),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Serialize)]
struct EnhancedRvToolsUploadResponse {
    upload_id: surrealdb::sql::Thing,
    sheets_processed: i32,
    total_rows_processed: i32,
    total_vms: i32,
    total_hosts: i32,
    total_clusters: i32,
    processing_errors: Vec<crate::services::rvtools_service::RvToolsProcessingError>,
    warnings: Vec<crate::services::rvtools_service::RvToolsProcessingError>,
    storage_analysis: bool,
    s2d_compliance_clusters: Vec<String>,
    upload_timestamp: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct GenerateReportsRequest {
    upload_id: String,
    project_id: Option<String>,
    report_types: Vec<ReportType>,
    config: ReportConfig,
    branding: Option<BrandingConfig>,
}

#[derive(Debug, Serialize)]
struct GenerateReportsResponse {
    reports: Vec<GeneratedReport>,
    generated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct ReportCustomizationRequest {
    report_id: String,
    customizations: Vec<ReportSectionCustomization>,
    save_as_template: Option<bool>,
    template_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ReportSectionCustomization {
    section_id: String,
    action: CustomizationAction,
    new_order: Option<i32>,
    layout_changes: Option<HashMap<String, serde_json::Value>>,
    variable_changes: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
enum CustomizationAction {
    #[serde(rename = "modify")]
    Modify,
    #[serde(rename = "hide")]
    Hide,
    #[serde(rename = "remove")]
    Remove,
    #[serde(rename = "add")]
    Add,
    #[serde(rename = "reorder")]
    Reorder,
}

#[derive(Debug, Deserialize)]
struct ListTemplatesQuery {
    report_type: Option<String>,
    is_standard: Option<bool>,
}

#[derive(Debug, Serialize)]
struct ReportTemplatesResponse {
    templates: Vec<ReportTemplate>,
    total: usize,
}

#[derive(Debug, Deserialize)]
struct ExportReportRequest {
    format: ExportFormat,
    include_source_data: Option<bool>,
    branding: Option<BrandingConfig>,
    custom_filename: Option<String>,
}

#[derive(Debug, Serialize)]
struct ExportReportResponse {
    export_url: String,
    format: ExportFormat,
    file_size: i64,
    expires_at: DateTime<Utc>,
    generated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
struct StorageAnalysisResponse {
    upload_id: String,
    analyses: Vec<StorageArchitectureAnalysis>,
    generated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct S2dComplianceQuery {
    cluster_name: Option<String>,
}

#[derive(Debug, Serialize)]
struct S2dComplianceResponse {
    upload_id: String,
    compliance_results: HashMap<String, S2dComplianceCheck>,
    generated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
struct ValidationRulesResponse {
    rules: Vec<ValidationRuleInfo>,
}

#[derive(Debug, Serialize)]
struct ValidationRuleInfo {
    rule_name: String,
    description: String,
    applies_to: Vec<String>,
    parameters: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct DataTraceabilityQuery {
    sheet_name: Option<String>,
    confidence_threshold: Option<f32>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize)]
struct DataTraceabilityResponse {
    upload_id: String,
    total_records: usize,
    data: Vec<RvToolsExcelData>,
    generated_at: DateTime<Utc>,
}

// New request/response types for missing functions
#[derive(Debug, Deserialize)]
struct GenerateReportDataRequest {
    upload_id: String,
    report_type: String,
}

#[derive(Debug, Serialize)]
struct GeneratedReportData {
    upload_id: String,
    report_type: String,
    data: serde_json::Value,
    generated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct ExportReportFileRequest {
    report_id: String,
    format: String,
}

#[derive(Debug, Serialize)]
struct ExportedFileData {
    report_id: String,
    format: String,
    file_name: String,
    file_size: u64,
    download_url: String,
    exported_at: DateTime<Utc>,
}

// =============================================================================
// SERVICE STUBS (TO BE IMPLEMENTED)
// =============================================================================

pub struct ReportGenerationService {
    db: Database,
}

impl ReportGenerationService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn generate_standard_reports(&self, _request: GenerateReportsRequest) -> Result<Vec<GeneratedReport>, anyhow::Error> {
        // TODO: Implement report generation logic
        Ok(Vec::new())
    }

    pub async fn customize_report(&self, _customization: ReportCustomizationRequest) -> Result<GeneratedReport, anyhow::Error> {
        // TODO: Implement report customization logic
        todo!("Report customization not yet implemented")
    }

    pub async fn export_report_file(&self, _report_id: &str, _format: &str) -> Result<ExportedFileData, anyhow::Error> {
        // TODO: Implement report file export logic
        Ok(ExportedFileData {
            report_id: _report_id.to_string(),
            format: _format.to_string(),
            file_name: format!("report_{}.{}", _report_id, _format),
            file_size: 1024,
            download_url: format!("/api/downloads/report_{}.{}", _report_id, _format),
            exported_at: Utc::now(),
        })
    }
}

pub struct ReportExportService {
    db: Database,
}

impl ReportExportService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    pub async fn export_report(&self, _report_id: String, _config: ExportReportRequest) -> Result<ExportedReportData, anyhow::Error> {
        // TODO: Implement report export logic
        todo!("Report export not yet implemented")
    }
}

#[derive(Debug)]
pub struct ExportedReportData {
    pub export_url: String,
    pub format: ExportFormat,
    pub file_size: i64,
    pub expires_at: DateTime<Utc>,
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

#[derive(Debug)]
enum ApiError {
    BadRequest(String),
    NotFound(String),
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (status, Json(serde_json::json!({
            "error": message
        }))).into_response()
    }
}