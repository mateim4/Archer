use crate::database::Database;
use crate::models::project_models::*;
use crate::services::rvtools_service::{RvToolsProcessingResult, RvToolsProcessingError};
use anyhow::{Context, Result};
use calamine::{open_workbook, Error as CalamineError, RangeDeserializerBuilder, Reader, Xlsx};
use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io;
use surrealdb::sql::Thing;
use regex::Regex;

pub struct EnhancedRvToolsService {
    db: Database,
    // Known vSAN clusters from user confirmation
    confirmed_vsan_clusters: Vec<String>,
    // Validation rules for different data types
    validation_rules: ValidationRules,
}

impl EnhancedRvToolsService {
    pub fn new(db: Database) -> Self {
        let confirmed_vsan_clusters = vec![
            "ASNCLUBA0001".to_string(),
            "ASNCLUHRK001".to_string(), 
            "PLBYDCL03".to_string(),
        ];
        
        Self {
            db,
            confirmed_vsan_clusters,
            validation_rules: ValidationRules::new(),
        }
    }

    // =============================================================================
    // ENHANCED EXCEL RVTOOLS PROCESSING
    // =============================================================================

    pub async fn process_rvtools_excel(&self, upload_data: RvToolsExcelUploadData) -> Result<EnhancedRvToolsProcessingResult> {
        // Create upload record
        let upload = RvToolsUpload {
            id: None,
            project_id: upload_data.project_id.clone().unwrap_or_else(|| Thing::from(("project", "default"))),
            workflow_id: None,
            file_name: upload_data.filename.clone(),
            file_path: format!("/tmp/{}", upload_data.filename),
            file_size_bytes: upload_data.excel_data.len() as i64,
            file_hash: format!("{:x}", md5::compute(&upload_data.excel_data)),
            upload_status: RvToolsStatus::Processing,
            processing_results: None,
            total_vms: None,
            total_hosts: None,
            total_clusters: None,
            vcenter_version: None,
            environment_name: None,
            metadata: HashMap::new(),
            uploaded_at: Utc::now(),
            processed_at: None,
            uploaded_by: "system".to_string(),
        };

        let created_upload: Vec<RvToolsUpload> = self.db
            .create("rvtools_upload")
            .content(&upload)
            .await
            .context("Failed to create RVTools upload record")?;

        let upload_id = created_upload[0].id.as_ref().unwrap().clone();

        // Process Excel file
        match self.parse_excel_with_traceability(&upload_data, &upload_id).await {
            Ok(result) => {
                // Update upload record as completed
                let _: Option<RvToolsUpload> = self.db
                    .update(&upload_id)
                    .merge(json!({
                        "upload_status": "processed",
                        "total_vms": result.total_vms,
                        "total_hosts": result.total_hosts, 
                        "total_clusters": result.total_clusters,
                        "processed_at": Utc::now(),
                        "processing_results": json!({
                            "sheets_processed": result.sheets_processed,
                            "total_rows_processed": result.total_rows_processed,
                            "errors": result.processing_errors.len(),
                            "warnings": result.warnings.len()
                        })
                    }))
                    .await?;

                Ok(result)
            }
            Err(e) => {
                // Update upload record with error
                let _: Option<RvToolsUpload> = self.db
                    .update(&upload_id)
                    .merge(json!({
                        "upload_status": "failed",
                        "processed_at": Utc::now(),
                        "processing_results": json!({
                            "error": e.to_string()
                        })
                    }))
                    .await?;

                Err(e)
            }
        }
    }

    async fn parse_excel_with_traceability(&self, upload_data: &RvToolsExcelUploadData, upload_id: &Thing) -> Result<EnhancedRvToolsProcessingResult> {
        // Write Excel data to temporary file
        let temp_file = tempfile::NamedTempFile::new()?;
        std::fs::write(temp_file.path(), &upload_data.excel_data)?;

        // Open Excel workbook
        let mut workbook: Xlsx<_> = open_workbook(temp_file.path())?;
        let sheet_names = workbook.sheet_names().to_owned();

        let mut processing_result = EnhancedRvToolsProcessingResult {
            upload_id: upload_id.clone(),
            sheets_processed: 0,
            total_rows_processed: 0,
            total_vms: 0,
            total_hosts: 0,
            total_clusters: 0,
            processing_errors: Vec::new(),
            warnings: Vec::new(),
            storage_analysis: None,
            s2d_compliance: HashMap::new(),
        };

        // Process each sheet with full traceability
        for sheet_name in &sheet_names {
            match self.process_excel_sheet(&mut workbook, sheet_name, upload_id, &mut processing_result).await {
                Ok(_) => {
                    processing_result.sheets_processed += 1;
                }
                Err(e) => {
                    processing_result.processing_errors.push(RvToolsProcessingError {
                        line_number: 0,
                        server_name: format!("Sheet: {}", sheet_name),
                        error: e.to_string(),
                    });
                }
            }
        }

        // Perform storage architecture analysis
        processing_result.storage_analysis = Some(self.analyze_storage_architecture(upload_id).await?);

        // Perform S2D compliance checks for vSAN clusters
        for cluster_name in &self.confirmed_vsan_clusters {
            if let Ok(compliance) = self.check_s2d_compliance(upload_id, cluster_name).await {
                processing_result.s2d_compliance.insert(cluster_name.clone(), compliance);
            }
        }

        Ok(processing_result)
    }

    async fn process_excel_sheet<R: std::io::Read + std::io::Seek>(&self, workbook: &mut Xlsx<R>, sheet_name: &str, upload_id: &Thing, result: &mut EnhancedRvToolsProcessingResult) -> Result<()> {
        let range = workbook
            .worksheet_range(sheet_name)
            .ok_or_else(|| anyhow::anyhow!("Cannot find range for sheet {}", sheet_name))??;

        let (rows, cols) = range.get_size();
        if rows == 0 {
            return Ok(());
        }

        // Get headers from first row
        let headers = self.extract_headers(&range, cols)?;
        
        // Process each data row
        for row_idx in 1..rows {
            result.total_rows_processed += 1;
            
            for col_idx in 0..cols {
                let cell_value = range.get_value((row_idx.try_into().unwrap(), col_idx.try_into().unwrap()))
                    .map(|v| v.to_string())
                    .unwrap_or_default();

                if cell_value.is_empty() {
                    continue;
                }

                let column_name = headers.get(col_idx).unwrap_or(&format!("Column{}", col_idx)).clone();
                
                // Determine metric category based on sheet and column
                let metric_category = self.classify_metric_category(sheet_name, &column_name);
                
                // Parse and validate the cell value
                let (parsed_value, data_type, validation_result) = self.parse_and_validate_cell(&cell_value, sheet_name, &column_name);

                // Store with full traceability
                let excel_data = RvToolsExcelData {
                    id: None,
                    upload_id: upload_id.clone(),
                    sheet_name: sheet_name.to_string(),
                    row_number: row_idx as i32 + 1, // 1-based for user reference
                    column_name: column_name.clone(),
                    column_index: col_idx as i32,
                    raw_value: cell_value,
                    parsed_value,
                    data_type,
                    metric_category,
                    confidence_score: validation_result.confidence_score,
                    validation_status: if validation_result.is_valid {
                        ValidationStatus::Valid
                    } else if !validation_result.warnings.is_empty() {
                        ValidationStatus::Warning
                    } else {
                        ValidationStatus::Error
                    },
                    validation_errors: validation_result.errors.clone(),
                    metadata: HashMap::new(),
                    created_at: Utc::now(),
                };

                // Save to database
                let _: Vec<RvToolsExcelData> = self.db
                    .create("rvtools_excel_data")
                    .content(excel_data)
                    .await?;

                // Update counters based on sheet type
                self.update_processing_counters(sheet_name, &column_name, result);
            }
        }

        Ok(())
    }

    fn extract_headers(&self, range: &calamine::Range<calamine::DataType>, cols: usize) -> Result<Vec<String>> {
        let mut headers = Vec::new();
        
        for col_idx in 0..cols {
            let header = range.get_value((0, col_idx.try_into().unwrap()))
                .map(|v| v.to_string())
                .unwrap_or_else(|| format!("Column{}", col_idx));
            headers.push(header);
        }
        
        Ok(headers)
    }

    fn classify_metric_category(&self, sheet_name: &str, column_name: &str) -> MetricCategory {
        match sheet_name.to_lowercase().as_str() {
            "vhost" | "vhostconfig" => {
                if column_name.to_lowercase().contains("cpu") || column_name.to_lowercase().contains("core") {
                    MetricCategory::HardwareConfig
                } else if column_name.to_lowercase().contains("memory") || column_name.to_lowercase().contains("ram") {
                    MetricCategory::CapacityMetrics
                } else if column_name.to_lowercase().contains("network") || column_name.to_lowercase().contains("nic") {
                    MetricCategory::NetworkMetrics
                } else {
                    MetricCategory::HardwareConfig
                }
            }
            "vdatastore" => MetricCategory::StorageMetrics,
            "vmultipath" => MetricCategory::StorageMetrics,
            "vhba" => MetricCategory::NetworkMetrics,
            "vinfo" | "vvm" => {
                if column_name.to_lowercase().contains("cluster") {
                    MetricCategory::ClusterMetrics
                } else {
                    MetricCategory::VmMetrics
                }
            }
            "vcluster" => MetricCategory::ClusterMetrics,
            _ => MetricCategory::VmMetrics,
        }
    }

    fn parse_and_validate_cell(&self, value: &str, sheet_name: &str, column_name: &str) -> (Value, RvToolsDataType, ValidationResult) {
        let validation_result = self.validation_rules.validate_field(sheet_name, column_name, value);
        
        // Attempt to parse based on column patterns and validation
        let (parsed_value, data_type) = if validation_result.detected_type.is_some() {
            match validation_result.detected_type.as_ref().unwrap() {
                RvToolsDataType::Integer => {
                    if let Ok(num) = value.parse::<i64>() {
                        (json!(num), RvToolsDataType::Integer)
                    } else {
                        (json!(value), RvToolsDataType::String)
                    }
                }
                RvToolsDataType::Float => {
                    if let Ok(num) = value.parse::<f64>() {
                        (json!(num), RvToolsDataType::Float)
                    } else {
                        (json!(value), RvToolsDataType::String)
                    }
                }
                RvToolsDataType::Boolean => {
                    let bool_val = matches!(value.to_lowercase().as_str(), "true" | "yes" | "1" | "enabled");
                    (json!(bool_val), RvToolsDataType::Boolean)
                }
                RvToolsDataType::Capacity => {
                    // Parse capacity values (MB, GB, TB, etc.)
                    if let Some(capacity_gb) = self.parse_capacity_to_gb(value) {
                        (json!(capacity_gb), RvToolsDataType::Capacity)
                    } else {
                        (json!(value), RvToolsDataType::String)
                    }
                }
                _ => (json!(value), RvToolsDataType::String),
            }
        } else {
            (json!(value), RvToolsDataType::String)
        };

        (parsed_value, data_type, validation_result)
    }

    fn parse_capacity_to_gb(&self, value: &str) -> Option<f64> {
        let capacity_regex = Regex::new(r"([0-9,]+\.?[0-9]*)\s*(TB|GB|MB|KB)").ok()?;
        
        if let Some(caps) = capacity_regex.captures(value) {
            let number: f64 = caps[1].replace(',', "").parse().ok()?;
            let unit = &caps[2];
            
            let gb_value = match unit {
                "TB" => number * 1024.0,
                "GB" => number,
                "MB" => number / 1024.0,
                "KB" => number / (1024.0 * 1024.0),
                _ => return None,
            };
            
            Some(gb_value)
        } else {
            None
        }
    }

    fn update_processing_counters(&self, sheet_name: &str, column_name: &str, result: &mut EnhancedRvToolsProcessingResult) {
        match sheet_name.to_lowercase().as_str() {
            "vinfo" | "vvm" => {
                if column_name.to_lowercase().contains("vm") || column_name.to_lowercase() == "name" {
                    result.total_vms += 1;
                }
            }
            "vhost" => {
                if column_name.to_lowercase().contains("host") || column_name.to_lowercase() == "name" {
                    result.total_hosts += 1;
                }
            }
            "vcluster" => {
                if column_name.to_lowercase().contains("cluster") || column_name.to_lowercase() == "name" {
                    result.total_clusters += 1;
                }
            }
            _ => {}
        }
    }

    // =============================================================================
    // STORAGE ARCHITECTURE ANALYSIS
    // =============================================================================

    pub async fn analyze_storage_architecture(&self, upload_id: &Thing) -> Result<StorageArchitectureAnalysis> {
        // Get all clusters from the data
        let clusters = self.extract_cluster_list(upload_id).await?;
        let mut storage_analyses = Vec::new();

        for cluster_name in clusters {
            let analysis = self.analyze_cluster_storage(upload_id, &cluster_name).await?;
            storage_analyses.push(analysis);
        }

        // Create comprehensive storage architecture analysis
        let overall_analysis = StorageArchitectureAnalysis {
            id: None,
            upload_id: upload_id.clone(),
            cluster_name: "OVERALL_ANALYSIS".to_string(),
            storage_type: StorageType::Unknown, // Will be set based on majority
            evidence_chain: Vec::new(), // Aggregate evidence
            confidence_level: 0.0, // Will be calculated
            analysis_method: AnalysisMethod::Systematic,
            recommendations: self.generate_storage_recommendations(&storage_analyses),
            s2d_compliance: None,
            metadata: {
                let mut map = HashMap::new();
                map.insert("cluster_analyses".to_string(), json!(storage_analyses.len()));
                map.insert("confirmed_vsan_clusters".to_string(), json!(self.confirmed_vsan_clusters.len()));
                map
            },
            analyzed_at: Utc::now(),
        };

        // Store analysis results
        let _: Vec<StorageArchitectureAnalysis> = self.db
            .create("storage_architecture_analysis")
            .content(&overall_analysis)
            .await?;

        Ok(overall_analysis)
    }

    async fn analyze_cluster_storage(&self, upload_id: &Thing, cluster_name: &str) -> Result<StorageArchitectureAnalysis> {
        let mut evidence_chain = Vec::new();
        
        // Check if this is a confirmed vSAN cluster
        let is_confirmed_vsan = self.confirmed_vsan_clusters.contains(&cluster_name.to_string());
        
        if is_confirmed_vsan {
            evidence_chain.push(StorageEvidence {
                evidence_type: EvidenceType::DatastoreName,
                sheet_name: "CONFIRMED_DATA".to_string(),
                row_data: HashMap::from([("cluster".to_string(), cluster_name.to_string())]),
                supports_conclusion: true,
                confidence_weight: 1.0,
            });
        }

        // Analyze datastore evidence
        let datastore_evidence = self.analyze_datastore_evidence(upload_id, cluster_name).await?;
        evidence_chain.extend(datastore_evidence);

        // Analyze multipath evidence
        let multipath_evidence = self.analyze_multipath_evidence(upload_id, cluster_name).await?;
        evidence_chain.extend(multipath_evidence);

        // Analyze HBA evidence
        let hba_evidence = self.analyze_hba_evidence(upload_id, cluster_name).await?;
        evidence_chain.extend(hba_evidence);

        // Determine storage type based on evidence
        let (storage_type, confidence_level) = self.determine_storage_type(&evidence_chain, is_confirmed_vsan);

        let analysis = StorageArchitectureAnalysis {
            id: None,
            upload_id: upload_id.clone(),
            cluster_name: cluster_name.to_string(),
            storage_type: storage_type.clone(),
            evidence_chain,
            confidence_level,
            analysis_method: if is_confirmed_vsan {
                AnalysisMethod::ConfirmedData
            } else {
                AnalysisMethod::Systematic
            },
            recommendations: self.generate_cluster_storage_recommendations(&storage_type, cluster_name),
            s2d_compliance: None, // Will be filled separately
            metadata: HashMap::new(),
            analyzed_at: Utc::now(),
        };

        // Store individual cluster analysis
        let _: Vec<StorageArchitectureAnalysis> = self.db
            .create("storage_architecture_analysis")
            .content(&analysis)
            .await?;

        Ok(analysis)
    }

    async fn analyze_datastore_evidence(&self, upload_id: &Thing, cluster_name: &str) -> Result<Vec<StorageEvidence>> {
        // Query datastore information for this cluster
        let datastore_query = format!(
            "SELECT * FROM rvtools_excel_data WHERE upload_id = $upload_id 
             AND sheet_name = 'vDatastore' AND parsed_value CONTAINS '{}'",
            cluster_name
        );

        let datastore_data: Vec<RvToolsExcelData> = self.db
            .query(datastore_query)
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        let mut evidence = Vec::new();
        
        for data in datastore_data {
            let supports_vsan = data.raw_value.to_lowercase().contains("vsan") || 
                               data.raw_value.to_lowercase().contains(&format!("{}-vsan", cluster_name.to_lowercase()));
            
            evidence.push(StorageEvidence {
                evidence_type: EvidenceType::DatastoreName,
                sheet_name: data.sheet_name.clone(),
                row_data: HashMap::from([
                    ("cluster".to_string(), cluster_name.to_string()),
                    ("datastore_name".to_string(), data.raw_value.clone()),
                    ("column".to_string(), data.column_name.clone()),
                ]),
                supports_conclusion: supports_vsan,
                confidence_weight: if supports_vsan { 0.8 } else { 0.3 },
            });
        }

        Ok(evidence)
    }

    async fn analyze_multipath_evidence(&self, upload_id: &Thing, cluster_name: &str) -> Result<Vec<StorageEvidence>> {
        let multipath_query = format!(
            "SELECT * FROM rvtools_excel_data WHERE upload_id = $upload_id 
             AND sheet_name = 'vMultiPath' AND parsed_value CONTAINS '{}'",
            cluster_name
        );

        let multipath_data: Vec<RvToolsExcelData> = self.db
            .query(multipath_query)
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        let mut evidence = Vec::new();
        
        for data in multipath_data {
            let is_local_storage = data.raw_value.to_lowercase().contains("local") ||
                                 data.raw_value.to_lowercase().contains("vmfs") ||
                                 data.raw_value.to_lowercase().contains("vsan");
            
            evidence.push(StorageEvidence {
                evidence_type: EvidenceType::MultipathPolicy,
                sheet_name: data.sheet_name.clone(),
                row_data: HashMap::from([
                    ("cluster".to_string(), cluster_name.to_string()),
                    ("multipath_info".to_string(), data.raw_value.clone()),
                ]),
                supports_conclusion: is_local_storage,
                confidence_weight: 0.6,
            });
        }

        Ok(evidence)
    }

    async fn analyze_hba_evidence(&self, upload_id: &Thing, cluster_name: &str) -> Result<Vec<StorageEvidence>> {
        let hba_query = format!(
            "SELECT * FROM rvtools_excel_data WHERE upload_id = $upload_id 
             AND sheet_name = 'vHBA' AND parsed_value CONTAINS '{}'",
            cluster_name
        );

        let hba_data: Vec<RvToolsExcelData> = self.db
            .query(hba_query)
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        let mut evidence = Vec::new();
        
        for data in hba_data {
            let has_fc_adapters = data.raw_value.to_lowercase().contains("fibre") ||
                                data.raw_value.to_lowercase().contains("fc");
            let has_iscsi_adapters = data.raw_value.to_lowercase().contains("iscsi");
            
            // FC or iSCSI adapters suggest SAN connectivity
            let supports_san = has_fc_adapters || has_iscsi_adapters;
            
            evidence.push(StorageEvidence {
                evidence_type: EvidenceType::HbaType,
                sheet_name: data.sheet_name.clone(),
                row_data: HashMap::from([
                    ("cluster".to_string(), cluster_name.to_string()),
                    ("hba_info".to_string(), data.raw_value.clone()),
                    ("adapter_type".to_string(), if has_fc_adapters { "FC".to_string() } else if has_iscsi_adapters { "iSCSI".to_string() } else { "Other".to_string() }),
                ]),
                supports_conclusion: !supports_san, // vSAN clusters typically don't have SAN adapters
                confidence_weight: if supports_san { 0.9 } else { 0.4 },
            });
        }

        Ok(evidence)
    }

    fn determine_storage_type(&self, evidence_chain: &[StorageEvidence], is_confirmed_vsan: bool) -> (StorageType, f32) {
        if is_confirmed_vsan {
            return (StorageType::VsanProvider, 1.0);
        }

        let mut vsan_score = 0.0;
        let mut san_score = 0.0;
        let mut total_weight = 0.0;

        for evidence in evidence_chain {
            total_weight += evidence.confidence_weight;
            
            if evidence.supports_conclusion {
                match evidence.evidence_type {
                    EvidenceType::DatastoreName => {
                        vsan_score += evidence.confidence_weight;
                    }
                    EvidenceType::HbaType => {
                        // HBA evidence supporting SAN
                        san_score += evidence.confidence_weight;
                    }
                    EvidenceType::MultipathPolicy => {
                        if evidence.row_data.get("multipath_info").map_or(false, |info| info.contains("local")) {
                            vsan_score += evidence.confidence_weight;
                        } else {
                            san_score += evidence.confidence_weight;
                        }
                    }
                    _ => {}
                }
            }
        }

        if total_weight == 0.0 {
            return (StorageType::Unknown, 0.0);
        }

        let vsan_confidence = vsan_score / total_weight;
        let san_confidence = san_score / total_weight;

        if vsan_confidence > san_confidence && vsan_confidence > 0.6 {
            (StorageType::VsanProvider, vsan_confidence)
        } else if san_confidence > 0.6 {
            if evidence_chain.iter().any(|e| e.row_data.get("adapter_type").map_or(false, |t| t == "FC")) {
                (StorageType::FcSan, san_confidence)
            } else if evidence_chain.iter().any(|e| e.row_data.get("adapter_type").map_or(false, |t| t == "iSCSI")) {
                (StorageType::IscsiSan, san_confidence)
            } else {
                (StorageType::VsanConsumer, san_confidence)
            }
        } else {
            (StorageType::Unknown, 0.0)
        }
    }

    // =============================================================================
    // S2D COMPLIANCE CHECKING
    // =============================================================================

    pub async fn check_s2d_compliance(&self, upload_id: &Thing, cluster_name: &str) -> Result<S2dComplianceCheck> {
        let mut requirements = S2dRequirements {
            min_hosts: self.check_min_hosts_requirement(upload_id, cluster_name).await?,
            memory_capacity: self.check_memory_requirement(upload_id, cluster_name).await?,
            network_adapters: self.check_network_requirement(upload_id, cluster_name).await?,
            drive_configuration: self.check_drive_requirement(upload_id, cluster_name).await?,
            drive_symmetry: self.check_drive_symmetry_requirement(upload_id, cluster_name).await?,
        };

        // Determine overall compliance status
        let overall_status = self.determine_overall_compliance_status(&requirements);
        let risk_level = self.assess_compliance_risk(&requirements);
        let recommendations = self.generate_s2d_recommendations(&requirements, cluster_name);

        let compliance_check = S2dComplianceCheck {
            overall_status,
            requirements,
            risk_level,
            recommendations,
            checked_at: Utc::now(),
        };

        Ok(compliance_check)
    }

    async fn check_min_hosts_requirement(&self, upload_id: &Thing, cluster_name: &str) -> Result<RequirementCheck> {
        // Query host count for cluster
        let host_query = format!(
            "SELECT COUNT() as host_count FROM rvtools_excel_data 
             WHERE upload_id = $upload_id AND sheet_name = 'vHost' 
             AND parsed_value CONTAINS '{}'",
            cluster_name
        );

        let host_data: Vec<serde_json::Value> = self.db
            .query(host_query)
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        let host_count = host_data.first()
            .and_then(|v| v.get("host_count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        let status = if host_count >= 2 {
            ComplianceStatus::Compliant
        } else {
            ComplianceStatus::NonCompliant
        };

        Ok(RequirementCheck {
            status,
            current_value: Some(host_count.to_string()),
            required_value: "2 or more hosts".to_string(),
            confidence: 0.9, // High confidence in host count data
            details: format!("Cluster {} has {} hosts. S2D requires minimum 2 hosts.", cluster_name, host_count),
        })
    }

    async fn check_memory_requirement(&self, upload_id: &Thing, cluster_name: &str) -> Result<RequirementCheck> {
        // This would require detailed analysis of cache drive capacity
        // For now, return needs verification
        Ok(RequirementCheck {
            status: ComplianceStatus::NeedsVerification,
            current_value: None,
            required_value: "4GB RAM per TB of cache drive capacity".to_string(),
            confidence: 0.0,
            details: "Physical drive inventory required to verify cache capacity and memory requirements".to_string(),
        })
    }

    async fn check_network_requirement(&self, upload_id: &Thing, cluster_name: &str) -> Result<RequirementCheck> {
        // Query network adapter information
        let network_query = format!(
            "SELECT * FROM rvtools_excel_data 
             WHERE upload_id = $upload_id AND column_name LIKE '%nic%' 
             AND parsed_value CONTAINS '{}'",
            cluster_name
        );

        let network_data: Vec<RvToolsExcelData> = self.db
            .query(network_query)
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        let has_rdma_capable = network_data.iter().any(|d| {
            d.raw_value.to_lowercase().contains("mellanox") || 
            d.raw_value.to_lowercase().contains("connectx") ||
            d.raw_value.to_lowercase().contains("10g") ||
            d.raw_value.to_lowercase().contains("25g")
        });

        let status = if has_rdma_capable {
            ComplianceStatus::Compliant
        } else {
            ComplianceStatus::NeedsVerification
        };

        Ok(RequirementCheck {
            status,
            current_value: Some(format!("{} network adapters found", network_data.len())),
            required_value: "10GbE+ with RDMA capability".to_string(),
            confidence: 0.6, // Medium confidence without physical verification
            details: if has_rdma_capable {
                "RDMA-capable network adapters detected".to_string()
            } else {
                "Network adapter RDMA capability needs physical verification".to_string()
            },
        })
    }

    async fn check_drive_requirement(&self, _upload_id: &Thing, _cluster_name: &str) -> Result<RequirementCheck> {
        // Drive configuration requires physical inventory not available in RVTools
        Ok(RequirementCheck {
            status: ComplianceStatus::NeedsVerification,
            current_value: None,
            required_value: "4+ capacity drives (NVMe/SSD) + 2+ cache drives (32GB+)".to_string(),
            confidence: 0.0,
            details: "Physical drive inventory not visible in RVTools - hardware audit required".to_string(),
        })
    }

    async fn check_drive_symmetry_requirement(&self, _upload_id: &Thing, _cluster_name: &str) -> Result<RequirementCheck> {
        // Drive symmetry requires physical inventory not available in RVTools
        Ok(RequirementCheck {
            status: ComplianceStatus::NeedsVerification,
            current_value: None,
            required_value: "Identical drive configuration across all hosts".to_string(),
            confidence: 0.0,
            details: "Drive symmetry verification requires physical hardware inspection".to_string(),
        })
    }

    fn determine_overall_compliance_status(&self, requirements: &S2dRequirements) -> ComplianceStatus {
        let checks = [
            &requirements.min_hosts,
            &requirements.memory_capacity,
            &requirements.network_adapters,
            &requirements.drive_configuration,
            &requirements.drive_symmetry,
        ];

        let compliant_count = checks.iter().filter(|c| c.status == ComplianceStatus::Compliant).count();
        let non_compliant_count = checks.iter().filter(|c| c.status == ComplianceStatus::NonCompliant).count();

        if non_compliant_count > 0 {
            ComplianceStatus::NonCompliant
        } else if compliant_count == checks.len() {
            ComplianceStatus::Compliant
        } else {
            ComplianceStatus::NeedsVerification
        }
    }

    fn assess_compliance_risk(&self, requirements: &S2dRequirements) -> RiskLevel {
        let non_compliant_critical = requirements.min_hosts.status == ComplianceStatus::NonCompliant ||
                                   requirements.drive_configuration.status == ComplianceStatus::NonCompliant;

        if non_compliant_critical {
            RiskLevel::High
        } else {
            let needs_verification_count = [
                &requirements.memory_capacity,
                &requirements.network_adapters,
                &requirements.drive_configuration,
                &requirements.drive_symmetry,
            ].iter().filter(|r| r.status == ComplianceStatus::NeedsVerification).count();

            if needs_verification_count >= 3 {
                RiskLevel::Medium
            } else {
                RiskLevel::Low
            }
        }
    }

    // =============================================================================
    // HELPER METHODS
    // =============================================================================

    async fn extract_cluster_list(&self, upload_id: &Thing) -> Result<Vec<String>> {
        let cluster_query = "SELECT DISTINCT parsed_value as cluster_name FROM rvtools_excel_data 
                           WHERE upload_id = $upload_id AND column_name CONTAINS 'cluster'";

        let cluster_data: Vec<serde_json::Value> = self.db
            .query(cluster_query)
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        let clusters: Vec<String> = cluster_data
            .into_iter()
            .filter_map(|v| v.get("cluster_name").and_then(|val| val.as_str().map(|s| s.to_string())))
            .collect();

        Ok(clusters)
    }

    fn generate_storage_recommendations(&self, _analyses: &[StorageArchitectureAnalysis]) -> Vec<String> {
        vec![
            "Consider S2D deployment only for confirmed vSAN provider clusters".to_string(),
            "Traditional SAN clusters should maintain existing connectivity".to_string(),
            "Physical hardware audit required before S2D deployment decisions".to_string(),
        ]
    }

    fn generate_cluster_storage_recommendations(&self, storage_type: &StorageType, cluster_name: &str) -> Vec<String> {
        match storage_type {
            StorageType::VsanProvider => vec![
                format!("Cluster {} is suitable for S2D deployment", cluster_name),
                "Verify physical drive configuration before S2D implementation".to_string(),
                "Ensure RDMA network adapters are available".to_string(),
            ],
            StorageType::VsanConsumer | StorageType::FcSan | StorageType::IscsiSan => vec![
                format!("Cluster {} should maintain existing SAN connectivity", cluster_name),
                "No RDMA adapters required for traditional storage".to_string(),
                "Verify SAN connectivity during migration".to_string(),
            ],
            StorageType::Unknown => vec![
                format!("Storage architecture for cluster {} requires further investigation", cluster_name),
                "Consider manual verification of storage configuration".to_string(),
            ],
            _ => vec!["Standard storage recommendations apply".to_string()],
        }
    }

    fn generate_s2d_recommendations(&self, requirements: &S2dRequirements, cluster_name: &str) -> Vec<String> {
        let mut recommendations = Vec::new();

        if requirements.min_hosts.status != ComplianceStatus::Compliant {
            recommendations.push(format!("Add additional hosts to cluster {} to meet minimum requirements", cluster_name));
        }

        if requirements.network_adapters.status == ComplianceStatus::NeedsVerification {
            recommendations.push("Verify RDMA network adapter capability through hardware inspection".to_string());
        }

        if requirements.drive_configuration.status == ComplianceStatus::NeedsVerification {
            recommendations.push("Conduct physical drive inventory to verify S2D storage requirements".to_string());
        }

        if requirements.drive_symmetry.status == ComplianceStatus::NeedsVerification {
            recommendations.push("Ensure identical drive configurations across all cluster hosts".to_string());
        }

        if recommendations.is_empty() {
            recommendations.push("Cluster appears suitable for S2D deployment pending hardware verification".to_string());
        }

        recommendations
    }

    /// Generate report data for a specific upload and report type
    pub async fn generate_report_data(&self, upload_id: &str, report_type: &str) -> Result<serde_json::Value> {
        // TODO: Implement comprehensive report data generation based on upload_id and report_type
        let report_data = match report_type {
            "infrastructure_summary" => {
                serde_json::json!({
                    "upload_id": upload_id,
                    "report_type": report_type,
                    "summary": {
                        "total_vms": 0,
                        "total_hosts": 0,
                        "total_clusters": 0,
                        "storage_analysis": {},
                        "s2d_compliance": {}
                    }
                })
            }
            "storage_architecture" => {
                serde_json::json!({
                    "upload_id": upload_id,
                    "report_type": report_type,
                    "storage_data": {
                        "storage_types": {},
                        "capacity_analysis": {},
                        "s2d_readiness": {}
                    }
                })
            }
            _ => {
                serde_json::json!({
                    "upload_id": upload_id,
                    "report_type": report_type,
                    "error": "Unknown report type"
                })
            }
        };

        Ok(report_data)
    }
}

// =============================================================================
// SUPPORTING TYPES AND STRUCTS
// =============================================================================

#[derive(Debug)]
pub struct RvToolsExcelUploadData {
    pub filename: String,
    pub excel_data: Vec<u8>,
    pub project_id: Option<Thing>,
}

#[derive(Debug)]
pub struct EnhancedRvToolsProcessingResult {
    pub upload_id: Thing,
    pub sheets_processed: i32,
    pub total_rows_processed: i32,
    pub total_vms: i32,
    pub total_hosts: i32,
    pub total_clusters: i32,
    pub processing_errors: Vec<RvToolsProcessingError>,
    pub warnings: Vec<RvToolsProcessingError>,
    pub storage_analysis: Option<StorageArchitectureAnalysis>,
    pub s2d_compliance: HashMap<String, S2dComplianceCheck>,
}

pub struct ValidationRules {
    // Rule sets organized by data category
    hardware_rules: Vec<ValidationRule>,
    capacity_rules: Vec<ValidationRule>,
    network_rules: Vec<ValidationRule>,
    cluster_rules: Vec<ValidationRule>,
}

#[derive(Debug, Clone)]
pub struct ValidationRule {
    pub rule_name: String,
    pub applies_to_sheets: Vec<String>,
    pub applies_to_columns: Vec<String>,
    pub rule_type: ValidationRuleType,
    pub parameters: HashMap<String, serde_json::Value>,
    pub confidence_impact: f32,
}

#[derive(Debug, Clone)]
pub enum ValidationRuleType {
    NumericRange { min: Option<f64>, max: Option<f64> },
    Pattern { regex: String },
    RequiredFormat { format: String },
    CapacityUnit { allowed_units: Vec<String> },
    ClusterConsistency,
    DataPresence,
    CrossReference { reference_sheet: String, reference_column: String },
}

impl ValidationRules {
    pub fn new() -> Self {
        Self {
            hardware_rules: Self::create_hardware_rules(),
            capacity_rules: Self::create_capacity_rules(),
            network_rules: Self::create_network_rules(),
            cluster_rules: Self::create_cluster_rules(),
        }
    }

    fn create_hardware_rules() -> Vec<ValidationRule> {
        vec![
            ValidationRule {
                rule_name: "CPU Core Count Validation".to_string(),
                applies_to_sheets: vec!["vHost".to_string()],
                applies_to_columns: vec!["Cpu".to_string(), "CpuCores".to_string(), "TotalCpu".to_string()],
                rule_type: ValidationRuleType::NumericRange { min: Some(1.0), max: Some(512.0) },
                parameters: HashMap::from([
                    ("warning_threshold".to_string(), json!(256)),
                    ("typical_range_min".to_string(), json!(2)),
                    ("typical_range_max".to_string(), json!(64)),
                ]),
                confidence_impact: 0.2,
            },
            ValidationRule {
                rule_name: "CPU Model Consistency".to_string(),
                applies_to_sheets: vec!["vHost".to_string()],
                applies_to_columns: vec!["CpuModel".to_string()],
                rule_type: ValidationRuleType::Pattern { 
                    regex: r"(?i)(intel|amd|xeon|epyc|ryzen)".to_string() 
                },
                parameters: HashMap::new(),
                confidence_impact: 0.1,
            },
            ValidationRule {
                rule_name: "Host Hardware Version".to_string(),
                applies_to_sheets: vec!["vHost".to_string()],
                applies_to_columns: vec!["HWVersion".to_string()],
                rule_type: ValidationRuleType::NumericRange { min: Some(7.0), max: Some(21.0) },
                parameters: HashMap::from([
                    ("recommended_min".to_string(), json!(13)),
                    ("deprecated_threshold".to_string(), json!(10)),
                ]),
                confidence_impact: 0.15,
            },
        ]
    }

    fn create_capacity_rules() -> Vec<ValidationRule> {
        vec![
            ValidationRule {
                rule_name: "Memory Capacity Format".to_string(),
                applies_to_sheets: vec!["vHost".to_string(), "vInfo".to_string()],
                applies_to_columns: vec!["Memory".to_string(), "TotalMemory".to_string(), "MemTotal".to_string()],
                rule_type: ValidationRuleType::CapacityUnit { 
                    allowed_units: vec!["MB".to_string(), "GB".to_string(), "TB".to_string()] 
                },
                parameters: HashMap::from([
                    ("require_unit".to_string(), json!(true)),
                    ("default_unit".to_string(), json!("MB")),
                ]),
                confidence_impact: 0.25,
            },
            ValidationRule {
                rule_name: "Storage Capacity Validation".to_string(),
                applies_to_sheets: vec!["vDatastore".to_string()],
                applies_to_columns: vec!["Capacity".to_string(), "TotalCapacity".to_string(), "Size".to_string()],
                rule_type: ValidationRuleType::CapacityUnit { 
                    allowed_units: vec!["MB".to_string(), "GB".to_string(), "TB".to_string(), "PB".to_string()] 
                },
                parameters: HashMap::from([
                    ("min_reasonable_size_gb".to_string(), json!(1)),
                    ("max_reasonable_size_tb".to_string(), json!(1000)),
                ]),
                confidence_impact: 0.3,
            },
            ValidationRule {
                rule_name: "VM Memory Allocation".to_string(),
                applies_to_sheets: vec!["vInfo".to_string()],
                applies_to_columns: vec!["Memory".to_string()],
                rule_type: ValidationRuleType::NumericRange { min: Some(0.5), max: Some(1024.0) },
                parameters: HashMap::from([
                    ("unit".to_string(), json!("GB")),
                    ("typical_max".to_string(), json!(128)),
                ]),
                confidence_impact: 0.2,
            },
        ]
    }

    fn create_network_rules() -> Vec<ValidationRule> {
        vec![
            ValidationRule {
                rule_name: "Network Adapter Speed".to_string(),
                applies_to_sheets: vec!["vHost".to_string()],
                applies_to_columns: vec!["NicSpeed".to_string(), "NetworkSpeed".to_string()],
                rule_type: ValidationRuleType::Pattern { 
                    regex: r"(?i)([0-9]+)\s*(mbps|gbps|mb/s|gb/s)".to_string() 
                },
                parameters: HashMap::from([
                    ("min_recommended_gbps".to_string(), json!(1)),
                    ("s2d_recommended_gbps".to_string(), json!(10)),
                ]),
                confidence_impact: 0.2,
            },
            ValidationRule {
                rule_name: "IP Address Format".to_string(),
                applies_to_sheets: vec!["vHost".to_string(), "vInfo".to_string()],
                applies_to_columns: vec!["IpAddress".to_string(), "GuestIpAddress".to_string()],
                rule_type: ValidationRuleType::Pattern { 
                    regex: r"^([0-9]{1,3}\.){3}[0-9]{1,3}$".to_string() 
                },
                parameters: HashMap::new(),
                confidence_impact: 0.15,
            },
            ValidationRule {
                rule_name: "VLAN ID Validation".to_string(),
                applies_to_sheets: vec!["vHost".to_string()],
                applies_to_columns: vec!["VlanId".to_string(), "VLAN".to_string()],
                rule_type: ValidationRuleType::NumericRange { min: Some(1.0), max: Some(4094.0) },
                parameters: HashMap::new(),
                confidence_impact: 0.1,
            },
        ]
    }

    fn create_cluster_rules() -> Vec<ValidationRule> {
        vec![
            ValidationRule {
                rule_name: "Cluster Name Consistency".to_string(),
                applies_to_sheets: vec!["vCluster".to_string(), "vHost".to_string(), "vInfo".to_string()],
                applies_to_columns: vec!["Cluster".to_string(), "ClusterName".to_string()],
                rule_type: ValidationRuleType::DataPresence,
                parameters: HashMap::new(),
                confidence_impact: 0.3,
            },
            ValidationRule {
                rule_name: "vSAN Cluster Identification".to_string(),
                applies_to_sheets: vec!["vCluster".to_string()],
                applies_to_columns: vec!["Cluster".to_string()],
                rule_type: ValidationRuleType::Pattern { 
                    regex: r"(?i)(vsan|s2d|hci)".to_string() 
                },
                parameters: HashMap::from([
                    ("confirmed_vsan_clusters".to_string(), json!(["ASNCLUBA0001", "ASNCLUHRK001", "PLBYDCL03"])),
                ]),
                confidence_impact: 0.4,
            },
            ValidationRule {
                rule_name: "Host Count per Cluster".to_string(),
                applies_to_sheets: vec!["vCluster".to_string()],
                applies_to_columns: vec!["TotalHosts".to_string(), "Hosts".to_string()],
                rule_type: ValidationRuleType::NumericRange { min: Some(1.0), max: Some(64.0) },
                parameters: HashMap::from([
                    ("s2d_minimum".to_string(), json!(2)),
                    ("recommended_max".to_string(), json!(16)),
                ]),
                confidence_impact: 0.25,
            },
        ]
    }

    pub fn validate_field(&self, sheet_name: &str, column_name: &str, value: &str) -> ValidationResult {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut confidence_score = 1.0;
        let mut detected_type = None;

        // Early return for empty values
        if value.is_empty() {
            return ValidationResult {
                is_valid: false,
                warnings: vec!["Empty value detected".to_string()],
                errors: Vec::new(),
                confidence_score: 0.3,
                detected_type: Some(RvToolsDataType::String),
            };
        }

        // Get all applicable rules for this sheet/column combination
        let applicable_rules = self.get_applicable_rules(sheet_name, column_name);
        
        for rule in &applicable_rules {
            let rule_result = self.apply_validation_rule(rule, value);
            
            if !rule_result.is_valid {
                if rule_result.is_error {
                    errors.extend(rule_result.messages);
                } else {
                    warnings.extend(rule_result.messages);
                }
                confidence_score -= rule.confidence_impact;
            }
            
            // Set detected type from rule if not already set
            if detected_type.is_none() {
                detected_type = rule_result.detected_type;
            }
        }

        // Apply default type detection if no rules specified it
        if detected_type.is_none() {
            detected_type = Some(self.detect_data_type_heuristic(value));
        }

        // Ensure confidence score doesn't go below 0
        confidence_score = confidence_score.max(0.0);

        ValidationResult {
            is_valid: errors.is_empty(),
            warnings,
            errors,
            confidence_score,
            detected_type,
        }
    }

    fn get_applicable_rules(&self, sheet_name: &str, column_name: &str) -> Vec<&ValidationRule> {
        let all_rules: Vec<&ValidationRule> = [
            &self.hardware_rules,
            &self.capacity_rules,
            &self.network_rules,
            &self.cluster_rules,
        ]
        .iter()
        .flat_map(|rules| rules.iter())
        .collect();

        all_rules
            .into_iter()
            .filter(|rule| {
                rule.applies_to_sheets.iter().any(|sheet| 
                    sheet.to_lowercase() == sheet_name.to_lowercase()) &&
                rule.applies_to_columns.iter().any(|col| 
                    column_name.to_lowercase().contains(&col.to_lowercase()))
            })
            .collect()
    }

    fn apply_validation_rule(&self, rule: &ValidationRule, value: &str) -> RuleValidationResult {
        match &rule.rule_type {
            ValidationRuleType::NumericRange { min, max } => {
                self.validate_numeric_range(value, *min, *max)
            }
            ValidationRuleType::Pattern { regex } => {
                self.validate_pattern(value, regex)
            }
            ValidationRuleType::CapacityUnit { allowed_units } => {
                self.validate_capacity_unit(value, allowed_units)
            }
            ValidationRuleType::DataPresence => {
                self.validate_data_presence(value)
            }
            ValidationRuleType::RequiredFormat { format } => {
                self.validate_required_format(value, format)
            }
            _ => RuleValidationResult {
                is_valid: true,
                is_error: false,
                messages: Vec::new(),
                detected_type: None,
            }
        }
    }

    fn validate_numeric_range(&self, value: &str, min: Option<f64>, max: Option<f64>) -> RuleValidationResult {
        let parsed_value = value.parse::<f64>();
        
        match parsed_value {
            Ok(num) => {
                let mut messages = Vec::new();
                let mut is_valid = true;

                if let Some(min_val) = min {
                    if num < min_val {
                        messages.push(format!("Value {} is below minimum {}", num, min_val));
                        is_valid = false;
                    }
                }

                if let Some(max_val) = max {
                    if num > max_val {
                        messages.push(format!("Value {} exceeds maximum {}", num, max_val));
                        is_valid = false;
                    }
                }

                RuleValidationResult {
                    is_valid,
                    is_error: !is_valid,
                    messages,
                    detected_type: Some(if num.fract() == 0.0 { 
                        RvToolsDataType::Integer 
                    } else { 
                        RvToolsDataType::Float 
                    }),
                }
            }
            Err(_) => RuleValidationResult {
                is_valid: false,
                is_error: true,
                messages: vec![format!("Expected numeric value, got: {}", value)],
                detected_type: Some(RvToolsDataType::String),
            }
        }
    }

    fn validate_pattern(&self, value: &str, regex_pattern: &str) -> RuleValidationResult {
        match Regex::new(regex_pattern) {
            Ok(regex) => {
                let is_match = regex.is_match(value);
                RuleValidationResult {
                    is_valid: is_match,
                    is_error: !is_match,
                    messages: if is_match { 
                        Vec::new() 
                    } else { 
                        vec![format!("Value '{}' does not match expected pattern", value)]
                    },
                    detected_type: Some(RvToolsDataType::String),
                }
            }
            Err(_) => RuleValidationResult {
                is_valid: true, // Don't fail validation due to regex errors
                is_error: false,
                messages: vec!["Invalid regex pattern in validation rule".to_string()],
                detected_type: Some(RvToolsDataType::String),
            }
        }
    }

    fn validate_capacity_unit(&self, value: &str, allowed_units: &[String]) -> RuleValidationResult {
        let has_unit = allowed_units.iter().any(|unit| 
            value.to_uppercase().contains(&unit.to_uppercase()));

        if has_unit {
            RuleValidationResult {
                is_valid: true,
                is_error: false,
                messages: Vec::new(),
                detected_type: Some(RvToolsDataType::Capacity),
            }
        } else {
            RuleValidationResult {
                is_valid: false,
                is_error: false, // Warning, not error
                messages: vec![format!("Capacity value should include unit ({})", allowed_units.join(", "))],
                detected_type: Some(RvToolsDataType::Capacity),
            }
        }
    }

    fn validate_data_presence(&self, value: &str) -> RuleValidationResult {
        let is_present = !value.trim().is_empty();
        RuleValidationResult {
            is_valid: is_present,
            is_error: !is_present,
            messages: if is_present { 
                Vec::new() 
            } else { 
                vec!["Required field is empty".to_string()]
            },
            detected_type: Some(RvToolsDataType::String),
        }
    }

    fn validate_required_format(&self, value: &str, format: &str) -> RuleValidationResult {
        // This is a placeholder - would implement specific format validation
        RuleValidationResult {
            is_valid: true,
            is_error: false,
            messages: Vec::new(),
            detected_type: Some(RvToolsDataType::String),
        }
    }

    fn detect_data_type_heuristic(&self, value: &str) -> RvToolsDataType {
        // Try integer first
        if value.parse::<i64>().is_ok() {
            return RvToolsDataType::Integer;
        }
        
        // Try float
        if value.parse::<f64>().is_ok() {
            return RvToolsDataType::Float;
        }
        
        // Check for capacity units
        if value.to_uppercase().contains("MB") || 
           value.to_uppercase().contains("GB") || 
           value.to_uppercase().contains("TB") {
            return RvToolsDataType::Capacity;
        }
        
        // Check for boolean-like values
        if matches!(value.to_lowercase().as_str(), "true" | "false" | "yes" | "no" | "1" | "0" | "enabled" | "disabled") {
            return RvToolsDataType::Boolean;
        }
        
        // Check for date patterns
        if value.contains("/") || value.contains("-") && value.len() > 8 {
            if chrono::DateTime::parse_from_str(value, "%Y-%m-%d %H:%M:%S").is_ok() ||
               chrono::DateTime::parse_from_str(value, "%m/%d/%Y").is_ok() {
                return RvToolsDataType::DateTime;
            }
        }
        
        // Default to string
        RvToolsDataType::String
    }
}

#[derive(Debug)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
    pub confidence_score: f32,
    pub detected_type: Option<RvToolsDataType>,
}

#[derive(Debug)]
struct RuleValidationResult {
    pub is_valid: bool,
    pub is_error: bool, // true for errors, false for warnings
    pub messages: Vec<String>,
    pub detected_type: Option<RvToolsDataType>,
}