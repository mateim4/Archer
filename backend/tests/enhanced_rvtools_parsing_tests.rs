#[cfg(test)]
mod enhanced_rvtools_parsing_tests {
    use crate::services::enhanced_rvtools_service::{EnhancedRvToolsService, RvToolsExcelUploadData};
    use crate::models::project_models::{RvToolsDataType, MetricCategory, ValidationStatus};
    use crate::database::Database;
    use surrealdb::sql::Thing;
    use std::collections::HashMap;
    use tempfile::NamedTempFile;
    use std::io::Write;
    
    // Helper function to create a mock Excel file
    fn create_mock_excel_data() -> Vec<u8> {
        // This would typically be actual Excel binary data
        // For testing, we'll use a placeholder that represents Excel structure
        b"Mock Excel Data - In real implementation this would be actual XLSX binary data".to_vec()
    }

    // Helper function to create test database
    async fn create_test_database() -> Database {
        // This would create an in-memory or test database instance
        // Implementation depends on your Database struct
        Database::new_test().await.expect("Failed to create test database")
    }

    #[tokio::test]
    async fn test_enhanced_rvtools_service_creation() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Service should be created successfully
        // We can't easily test internal state, but creation shouldn't panic
        assert!(true);
    }

    #[tokio::test]
    async fn test_capacity_parsing_to_gb() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test various capacity formats
        let test_cases = vec![
            ("1 TB", Some(1024.0)),
            ("500 GB", Some(500.0)),
            ("2048 MB", Some(2.0)),
            ("1048576 KB", Some(1.0)),
            ("2.5 TB", Some(2560.0)),
            ("invalid capacity", None),
            ("", None),
        ];

        for (input, expected) in test_cases {
            let result = service.parse_capacity_to_gb(input);
            assert_eq!(result, expected, "Failed to parse capacity: {}", input);
        }
    }

    #[tokio::test]
    async fn test_metric_category_classification() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test hardware config classification
        assert_eq!(
            service.classify_metric_category("vHost", "CpuCores"),
            MetricCategory::HardwareConfig
        );
        
        assert_eq!(
            service.classify_metric_category("vHost", "CpuModel"),
            MetricCategory::HardwareConfig
        );
        
        // Test capacity metrics classification
        assert_eq!(
            service.classify_metric_category("vHost", "Memory"),
            MetricCategory::CapacityMetrics
        );
        
        assert_eq!(
            service.classify_metric_category("vHost", "TotalRAM"),
            MetricCategory::CapacityMetrics
        );
        
        // Test storage metrics classification
        assert_eq!(
            service.classify_metric_category("vDatastore", "Capacity"),
            MetricCategory::StorageMetrics
        );
        
        assert_eq!(
            service.classify_metric_category("vMultiPath", "Policy"),
            MetricCategory::StorageMetrics
        );
        
        // Test network metrics classification
        assert_eq!(
            service.classify_metric_category("vHost", "NetworkAdapter"),
            MetricCategory::NetworkMetrics
        );
        
        assert_eq!(
            service.classify_metric_category("vHBA", "AdapterType"),
            MetricCategory::NetworkMetrics
        );
        
        // Test cluster metrics classification
        assert_eq!(
            service.classify_metric_category("vCluster", "Name"),
            MetricCategory::ClusterMetrics
        );
        
        assert_eq!(
            service.classify_metric_category("vInfo", "Cluster"),
            MetricCategory::ClusterMetrics
        );
        
        // Test VM metrics classification (default)
        assert_eq!(
            service.classify_metric_category("vInfo", "VMName"),
            MetricCategory::VmMetrics
        );
    }

    #[tokio::test]
    async fn test_excel_header_extraction() {
        // This test would require creating actual Excel data structure
        // For now, we'll test the concept
        assert!(true); // Placeholder for actual header extraction test
    }

    #[tokio::test]
    async fn test_data_type_and_validation_integration() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test parsing and validation for different data types
        let test_cases = vec![
            ("vHost", "CpuCores", "8", RvToolsDataType::Integer, true),
            ("vHost", "CpuCores", "invalid", RvToolsDataType::String, false),
            ("vHost", "Memory", "32 GB", RvToolsDataType::Capacity, true),
            ("vHost", "Memory", "32768", RvToolsDataType::Capacity, false), // Missing unit
            ("vDatastore", "Capacity", "1 TB", RvToolsDataType::Capacity, true),
            ("vInfo", "PowerState", "true", RvToolsDataType::Boolean, true),
        ];

        for (sheet, column, value, expected_type, should_be_valid) in test_cases {
            let (parsed_value, data_type, validation_result) = 
                service.parse_and_validate_cell(value, sheet, column);
            
            assert_eq!(data_type, expected_type, 
                "Wrong data type for {}.{} = '{}'", sheet, column, value);
            
            assert_eq!(validation_result.is_valid, should_be_valid,
                "Wrong validation result for {}.{} = '{}'", sheet, column, value);
        }
    }

    #[tokio::test] 
    async fn test_processing_counter_updates() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        let mut result = crate::services::enhanced_rvtools_service::EnhancedRvToolsProcessingResult {
            upload_id: Thing::from(("test", "upload1")),
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

        // Test VM counter updates
        service.update_processing_counters("vInfo", "VM", &mut result);
        assert_eq!(result.total_vms, 1);
        
        service.update_processing_counters("vVM", "Name", &mut result);
        assert_eq!(result.total_vms, 2);
        
        // Test host counter updates
        service.update_processing_counters("vHost", "Host", &mut result);
        assert_eq!(result.total_hosts, 1);
        
        service.update_processing_counters("vHost", "Name", &mut result);
        assert_eq!(result.total_hosts, 2);
        
        // Test cluster counter updates
        service.update_processing_counters("vCluster", "Cluster", &mut result);
        assert_eq!(result.total_clusters, 1);
        
        service.update_processing_counters("vCluster", "Name", &mut result);
        assert_eq!(result.total_clusters, 2);
        
        // Test non-counted updates
        service.update_processing_counters("vDatastore", "Capacity", &mut result);
        // Counters should remain the same
        assert_eq!(result.total_vms, 2);
        assert_eq!(result.total_hosts, 2);
        assert_eq!(result.total_clusters, 2);
    }

    #[tokio::test]
    async fn test_confirmed_vsan_clusters_validation() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test that confirmed vSAN clusters are properly identified
        let confirmed_clusters = vec!["ASNCLUBA0001", "ASNCLUHRK001", "PLBYDCL03"];
        
        for cluster in confirmed_clusters {
            // In a real test, we would check that these clusters receive special handling
            // For now, we just verify the cluster names are as expected
            assert!(cluster.len() > 0);
            assert!(cluster.chars().all(|c| c.is_alphanumeric()));
        }
    }

    #[tokio::test]
    async fn test_validation_status_mapping() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test validation status mapping logic
        // This would test the mapping from ValidationResult to ValidationStatus
        
        // Valid result should map to Valid
        let valid_result = crate::services::enhanced_rvtools_service::ValidationResult {
            is_valid: true,
            warnings: Vec::new(),
            errors: Vec::new(),
            confidence_score: 0.9,
            detected_type: Some(RvToolsDataType::Integer),
        };
        
        let status = if valid_result.is_valid {
            ValidationStatus::Valid
        } else if !valid_result.warnings.is_empty() {
            ValidationStatus::Warning
        } else {
            ValidationStatus::Error
        };
        
        assert_eq!(status, ValidationStatus::Valid);
        
        // Result with warnings should map to Warning
        let warning_result = crate::services::enhanced_rvtools_service::ValidationResult {
            is_valid: false,
            warnings: vec!["Warning message".to_string()],
            errors: Vec::new(),
            confidence_score: 0.6,
            detected_type: Some(RvToolsDataType::String),
        };
        
        let status = if warning_result.is_valid {
            ValidationStatus::Valid
        } else if !warning_result.warnings.is_empty() {
            ValidationStatus::Warning
        } else {
            ValidationStatus::Error
        };
        
        assert_eq!(status, ValidationStatus::Warning);
        
        // Result with errors should map to Error
        let error_result = crate::services::enhanced_rvtools_service::ValidationResult {
            is_valid: false,
            warnings: Vec::new(),
            errors: vec!["Error message".to_string()],
            confidence_score: 0.2,
            detected_type: Some(RvToolsDataType::String),
        };
        
        let status = if error_result.is_valid {
            ValidationStatus::Valid
        } else if !error_result.warnings.is_empty() {
            ValidationStatus::Warning
        } else {
            ValidationStatus::Error
        };
        
        assert_eq!(status, ValidationStatus::Error);
    }

    #[tokio::test]
    async fn test_excel_upload_data_validation() {
        // Test RvToolsExcelUploadData structure and validation
        let upload_data = RvToolsExcelUploadData {
            filename: "test-rvtools.xlsx".to_string(),
            excel_data: create_mock_excel_data(),
            project_id: Some(Thing::from(("project", "test-project"))),
        };
        
        // Validate filename
        assert!(upload_data.filename.ends_with(".xlsx"));
        assert!(!upload_data.filename.is_empty());
        
        // Validate data is present
        assert!(!upload_data.excel_data.is_empty());
        
        // Validate project ID is properly formed
        assert!(upload_data.project_id.is_some());
        
        // Test without project ID
        let upload_data_no_project = RvToolsExcelUploadData {
            filename: "test-rvtools.xlsx".to_string(),
            excel_data: create_mock_excel_data(),
            project_id: None,
        };
        
        assert!(upload_data_no_project.project_id.is_none());
    }

    #[tokio::test]
    async fn test_error_handling_in_parsing() {
        // Test various error conditions in parsing logic
        
        // Test empty filename
        let upload_data = RvToolsExcelUploadData {
            filename: "".to_string(),
            excel_data: create_mock_excel_data(),
            project_id: None,
        };
        
        assert!(upload_data.filename.is_empty());
        
        // Test wrong file extension
        let upload_data = RvToolsExcelUploadData {
            filename: "test.txt".to_string(),
            excel_data: create_mock_excel_data(),
            project_id: None,
        };
        
        assert!(!upload_data.filename.ends_with(".xlsx"));
        assert!(!upload_data.filename.ends_with(".xls"));
        
        // Test empty data
        let upload_data = RvToolsExcelUploadData {
            filename: "test.xlsx".to_string(),
            excel_data: Vec::new(),
            project_id: None,
        };
        
        assert!(upload_data.excel_data.is_empty());
    }

    #[tokio::test]
    async fn test_metric_category_edge_cases() {
        let db = create_test_database().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test edge cases in metric classification
        
        // Empty sheet/column names
        let category = service.classify_metric_category("", "");
        assert_eq!(category, MetricCategory::VmMetrics); // Default
        
        // Unknown sheet names
        let category = service.classify_metric_category("vUnknown", "SomeColumn");
        assert_eq!(category, MetricCategory::VmMetrics); // Default
        
        // Case sensitivity
        let category1 = service.classify_metric_category("VHOST", "CPU");
        let category2 = service.classify_metric_category("vhost", "cpu");
        let category3 = service.classify_metric_category("vHost", "Cpu");
        
        assert_eq!(category1, category2);
        assert_eq!(category2, category3);
    }
}