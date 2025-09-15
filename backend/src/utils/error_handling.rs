use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use std::fmt;
use tracing::{error, warn, info};

/// Enhanced error types for RVTools processing
#[derive(Debug)]
pub enum EnhancedRvToolsError {
    // File processing errors
    InvalidFileFormat { filename: String, expected: String },
    FileTooLarge { filename: String, size_bytes: u64, max_size: u64 },
    CorruptedFile { filename: String, details: String },
    
    // Excel parsing errors
    ExcelParsingError { sheet: String, row: i32, column: String, error: String },
    MissingRequiredSheet { sheet: String, filename: String },
    InvalidDataStructure { sheet: String, expected_columns: Vec<String>, found_columns: Vec<String> },
    
    // Validation errors
    ValidationRuleFailed { rule_name: String, field: String, value: String, reason: String },
    ConfidenceThresholdNotMet { field: String, confidence: f32, threshold: f32 },
    DataIntegrityError { details: String },
    
    // Storage analysis errors
    StorageAnalysisError { cluster: String, error: String },
    S2dComplianceCheckFailed { cluster: String, requirement: String, details: String },
    InsufficientDataForAnalysis { cluster: String, missing_data: Vec<String> },
    
    // Report generation errors
    ReportGenerationFailed { template_id: String, error: String },
    TemplateNotFound { template_id: String },
    MissingReportData { upload_id: String, missing_variables: Vec<String> },
    ReportExportError { format: String, error: String },
    
    // Database errors
    DatabaseError { operation: String, table: String, error: String },
    RecordNotFound { table: String, id: String },
    RelationshipViolation { from_table: String, to_table: String, details: String },
    
    // System errors
    ServiceUnavailable { service: String, reason: String },
    ConfigurationError { setting: String, issue: String },
    ResourceExhausted { resource: String, limit: String },
}

impl fmt::Display for EnhancedRvToolsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EnhancedRvToolsError::InvalidFileFormat { filename, expected } =>
                write!(f, "Invalid file format for '{}'. Expected: {}", filename, expected),
            
            EnhancedRvToolsError::FileTooLarge { filename, size_bytes, max_size } =>
                write!(f, "File '{}' is too large ({} bytes). Maximum allowed: {} bytes", 
                       filename, size_bytes, max_size),
            
            EnhancedRvToolsError::CorruptedFile { filename, details } =>
                write!(f, "Corrupted file '{}': {}", filename, details),
            
            EnhancedRvToolsError::ExcelParsingError { sheet, row, column, error } =>
                write!(f, "Excel parsing error in sheet '{}' at row {}, column '{}': {}", 
                       sheet, row, column, error),
            
            EnhancedRvToolsError::MissingRequiredSheet { sheet, filename } =>
                write!(f, "Missing required sheet '{}' in file '{}'", sheet, filename),
            
            EnhancedRvToolsError::InvalidDataStructure { sheet, expected_columns, found_columns } =>
                write!(f, "Invalid data structure in sheet '{}'. Expected columns: {:?}, Found: {:?}", 
                       sheet, expected_columns, found_columns),
            
            EnhancedRvToolsError::ValidationRuleFailed { rule_name, field, value, reason } =>
                write!(f, "Validation rule '{}' failed for field '{}' with value '{}': {}", 
                       rule_name, field, value, reason),
            
            EnhancedRvToolsError::ConfidenceThresholdNotMet { field, confidence, threshold } =>
                write!(f, "Confidence threshold not met for field '{}': {:.2} < {:.2}", 
                       field, confidence, threshold),
            
            EnhancedRvToolsError::DataIntegrityError { details } =>
                write!(f, "Data integrity error: {}", details),
            
            EnhancedRvToolsError::StorageAnalysisError { cluster, error } =>
                write!(f, "Storage analysis error for cluster '{}': {}", cluster, error),
            
            EnhancedRvToolsError::S2dComplianceCheckFailed { cluster, requirement, details } =>
                write!(f, "S2D compliance check failed for cluster '{}', requirement '{}': {}", 
                       cluster, requirement, details),
            
            EnhancedRvToolsError::InsufficientDataForAnalysis { cluster, missing_data } =>
                write!(f, "Insufficient data for analyzing cluster '{}'. Missing: {:?}", 
                       cluster, missing_data),
            
            EnhancedRvToolsError::ReportGenerationFailed { template_id, error } =>
                write!(f, "Report generation failed for template '{}': {}", template_id, error),
            
            EnhancedRvToolsError::TemplateNotFound { template_id } =>
                write!(f, "Report template not found: '{}'", template_id),
            
            EnhancedRvToolsError::MissingReportData { upload_id, missing_variables } =>
                write!(f, "Missing report data for upload '{}'. Missing variables: {:?}", 
                       upload_id, missing_variables),
            
            EnhancedRvToolsError::ReportExportError { format, error } =>
                write!(f, "Report export error for format '{}': {}", format, error),
            
            EnhancedRvToolsError::DatabaseError { operation, table, error } =>
                write!(f, "Database error during '{}' on table '{}': {}", operation, table, error),
            
            EnhancedRvToolsError::RecordNotFound { table, id } =>
                write!(f, "Record not found in table '{}' with ID '{}'", table, id),
            
            EnhancedRvToolsError::RelationshipViolation { from_table, to_table, details } =>
                write!(f, "Relationship violation from '{}' to '{}': {}", from_table, to_table, details),
            
            EnhancedRvToolsError::ServiceUnavailable { service, reason } =>
                write!(f, "Service '{}' unavailable: {}", service, reason),
            
            EnhancedRvToolsError::ConfigurationError { setting, issue } =>
                write!(f, "Configuration error for setting '{}': {}", setting, issue),
            
            EnhancedRvToolsError::ResourceExhausted { resource, limit } =>
                write!(f, "Resource '{}' exhausted. Limit: {}", resource, limit),
        }
    }
}

impl std::error::Error for EnhancedRvToolsError {}

impl IntoResponse for EnhancedRvToolsError {
    fn into_response(self) -> Response {
        let (status, error_code, message, details) = match &self {
            EnhancedRvToolsError::InvalidFileFormat { .. } =>
                (StatusCode::BAD_REQUEST, "INVALID_FILE_FORMAT", self.to_string(), None),
            
            EnhancedRvToolsError::FileTooLarge { .. } =>
                (StatusCode::PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", self.to_string(), None),
            
            EnhancedRvToolsError::CorruptedFile { .. } =>
                (StatusCode::BAD_REQUEST, "CORRUPTED_FILE", self.to_string(), None),
            
            EnhancedRvToolsError::ExcelParsingError { sheet, row, column, .. } =>
                (StatusCode::BAD_REQUEST, "EXCEL_PARSING_ERROR", self.to_string(), 
                 Some(json!({"sheet": sheet, "row": row, "column": column}))),
            
            EnhancedRvToolsError::MissingRequiredSheet { sheet, .. } =>
                (StatusCode::BAD_REQUEST, "MISSING_REQUIRED_SHEET", self.to_string(), 
                 Some(json!({"missing_sheet": sheet}))),
            
            EnhancedRvToolsError::InvalidDataStructure { .. } =>
                (StatusCode::BAD_REQUEST, "INVALID_DATA_STRUCTURE", self.to_string(), None),
            
            EnhancedRvToolsError::ValidationRuleFailed { rule_name, field, .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "VALIDATION_FAILED", self.to_string(),
                 Some(json!({"rule": rule_name, "field": field}))),
            
            EnhancedRvToolsError::ConfidenceThresholdNotMet { .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "CONFIDENCE_THRESHOLD_NOT_MET", self.to_string(), None),
            
            EnhancedRvToolsError::DataIntegrityError { .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "DATA_INTEGRITY_ERROR", self.to_string(), None),
            
            EnhancedRvToolsError::StorageAnalysisError { cluster, .. } =>
                (StatusCode::INTERNAL_SERVER_ERROR, "STORAGE_ANALYSIS_ERROR", self.to_string(),
                 Some(json!({"cluster": cluster}))),
            
            EnhancedRvToolsError::S2dComplianceCheckFailed { cluster, requirement, .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "S2D_COMPLIANCE_FAILED", self.to_string(),
                 Some(json!({"cluster": cluster, "requirement": requirement}))),
            
            EnhancedRvToolsError::InsufficientDataForAnalysis { .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "INSUFFICIENT_DATA", self.to_string(), None),
            
            EnhancedRvToolsError::ReportGenerationFailed { template_id, .. } =>
                (StatusCode::INTERNAL_SERVER_ERROR, "REPORT_GENERATION_FAILED", self.to_string(),
                 Some(json!({"template_id": template_id}))),
            
            EnhancedRvToolsError::TemplateNotFound { template_id } =>
                (StatusCode::NOT_FOUND, "TEMPLATE_NOT_FOUND", self.to_string(),
                 Some(json!({"template_id": template_id}))),
            
            EnhancedRvToolsError::MissingReportData { upload_id, .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "MISSING_REPORT_DATA", self.to_string(),
                 Some(json!({"upload_id": upload_id}))),
            
            EnhancedRvToolsError::ReportExportError { format, .. } =>
                (StatusCode::INTERNAL_SERVER_ERROR, "REPORT_EXPORT_ERROR", self.to_string(),
                 Some(json!({"format": format}))),
            
            EnhancedRvToolsError::DatabaseError { .. } =>
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", self.to_string(), None),
            
            EnhancedRvToolsError::RecordNotFound { table, id } =>
                (StatusCode::NOT_FOUND, "RECORD_NOT_FOUND", self.to_string(),
                 Some(json!({"table": table, "id": id}))),
            
            EnhancedRvToolsError::RelationshipViolation { .. } =>
                (StatusCode::UNPROCESSABLE_ENTITY, "RELATIONSHIP_VIOLATION", self.to_string(), None),
            
            EnhancedRvToolsError::ServiceUnavailable { service, .. } =>
                (StatusCode::SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", self.to_string(),
                 Some(json!({"service": service}))),
            
            EnhancedRvToolsError::ConfigurationError { setting, .. } =>
                (StatusCode::INTERNAL_SERVER_ERROR, "CONFIGURATION_ERROR", self.to_string(),
                 Some(json!({"setting": setting}))),
            
            EnhancedRvToolsError::ResourceExhausted { resource, .. } =>
                (StatusCode::TOO_MANY_REQUESTS, "RESOURCE_EXHAUSTED", self.to_string(),
                 Some(json!({"resource": resource}))),
        };

        // Log the error with appropriate level
        match status {
            StatusCode::INTERNAL_SERVER_ERROR | StatusCode::SERVICE_UNAVAILABLE => {
                error!("Enhanced RVTools Error: {} - {}", error_code, message);
            }
            StatusCode::BAD_REQUEST | StatusCode::NOT_FOUND => {
                warn!("Enhanced RVTools Warning: {} - {}", error_code, message);
            }
            _ => {
                info!("Enhanced RVTools Info: {} - {}", error_code, message);
            }
        }

        let mut response_body = json!({
            "error": {
                "code": error_code,
                "message": message,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }
        });

        if let Some(details) = details {
            response_body["error"]["details"] = details;
        }

        (status, Json(response_body)).into_response()
    }
}

/// Logging utilities for enhanced RVTools operations
pub struct EnhancedRvToolsLogger;

impl EnhancedRvToolsLogger {
    /// Log successful Excel upload
    pub fn log_upload_success(filename: &str, size_bytes: u64, sheets_processed: i32, rows_processed: i32) {
        info!(
            filename = filename,
            size_bytes = size_bytes,
            sheets_processed = sheets_processed,
            rows_processed = rows_processed,
            "✅ RVTools Excel file processed successfully"
        );
    }

    /// Log validation results
    pub fn log_validation_results(total_fields: usize, valid_fields: usize, warnings: usize, errors: usize) {
        let success_rate = (valid_fields as f32 / total_fields as f32) * 100.0;
        
        info!(
            total_fields = total_fields,
            valid_fields = valid_fields,
            warnings = warnings,
            errors = errors,
            success_rate = format!("{:.1}%", success_rate),
            "📊 RVTools validation completed"
        );

        if errors > 0 {
            warn!("⚠️ {} validation errors found", errors);
        }
    }

    /// Log storage analysis results
    pub fn log_storage_analysis(cluster: &str, storage_type: &str, confidence: f32) {
        info!(
            cluster = cluster,
            storage_type = storage_type,
            confidence = format!("{:.2}", confidence),
            "🔍 Storage architecture analysis completed"
        );
    }

    /// Log S2D compliance check results
    pub fn log_s2d_compliance(cluster: &str, compliant: bool, risk_level: &str) {
        if compliant {
            info!(
                cluster = cluster,
                status = "compliant",
                risk_level = risk_level,
                "✅ S2D compliance check passed"
            );
        } else {
            warn!(
                cluster = cluster,
                status = "non_compliant",
                risk_level = risk_level,
                "⚠️ S2D compliance check failed"
            );
        }
    }

    /// Log report generation
    pub fn log_report_generation(template_id: &str, upload_id: &str, generation_time_ms: u64) {
        info!(
            template_id = template_id,
            upload_id = upload_id,
            generation_time_ms = generation_time_ms,
            "📄 Report generated successfully"
        );
    }

    /// Log report export
    pub fn log_report_export(format: &str, file_size_bytes: u64, export_time_ms: u64) {
        info!(
            format = format,
            file_size_bytes = file_size_bytes,
            export_time_ms = export_time_ms,
            "📤 Report exported successfully"
        );
    }

    /// Log performance metrics
    pub fn log_performance_metrics(
        operation: &str,
        duration_ms: u64,
        records_processed: usize,
        memory_usage_mb: Option<f64>
    ) {
        let throughput = if duration_ms > 0 {
            (records_processed as f64 / (duration_ms as f64 / 1000.0)).round()
        } else {
            0.0
        };

        if let Some(memory_mb) = memory_usage_mb {
            info!(
                operation = operation,
                duration_ms = duration_ms,
                records_processed = records_processed,
                throughput = format!("{} records/sec", throughput),
                memory_usage_mb = memory_mb,
                "🚀 Performance metrics"
            );
        } else {
            info!(
                operation = operation,
                duration_ms = duration_ms,
                records_processed = records_processed,
                throughput = format!("{} records/sec", throughput),
                "🚀 Performance metrics"
            );
        }
    }
}

/// Result type alias for enhanced RVTools operations
pub type EnhancedRvToolsResult<T> = Result<T, EnhancedRvToolsError>;

/// Convenience macros for error creation
#[macro_export]
macro_rules! excel_parsing_error {
    ($sheet:expr, $row:expr, $column:expr, $error:expr) => {
        crate::utils::error_handling::EnhancedRvToolsError::ExcelParsingError {
            sheet: $sheet.to_string(),
            row: $row,
            column: $column.to_string(),
            error: $error.to_string(),
        }
    };
}

#[macro_export]
macro_rules! validation_error {
    ($rule:expr, $field:expr, $value:expr, $reason:expr) => {
        crate::utils::error_handling::EnhancedRvToolsError::ValidationRuleFailed {
            rule_name: $rule.to_string(),
            field: $field.to_string(),
            value: $value.to_string(),
            reason: $reason.to_string(),
        }
    };
}

#[macro_export]
macro_rules! storage_analysis_error {
    ($cluster:expr, $error:expr) => {
        crate::utils::error_handling::EnhancedRvToolsError::StorageAnalysisError {
            cluster: $cluster.to_string(),
            error: $error.to_string(),
        }
    };
}