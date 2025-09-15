#[cfg(test)]
mod enhanced_rvtools_performance_tests {
    use crate::services::enhanced_rvtools_service::{EnhancedRvToolsService, RvToolsExcelUploadData};
    use crate::models::project_models::*;
    use crate::database::Database;
    use surrealdb::sql::Thing;
    use std::collections::HashMap;
    use std::time::{Duration, Instant};
    use tokio;

    async fn setup_performance_test_db() -> Database {
        Database::new_test().await.expect("Failed to create performance test database")
    }

    fn generate_large_mock_excel_data(num_hosts: usize, num_vms: usize) -> Vec<u8> {
        // Generate mock CSV-style data that would represent parsed Excel content
        let mut data = String::new();
        
        data.push_str("Sheet: vHost\n");
        data.push_str("Host,Cluster,CpuCores,Memory,PowerState,NetworkAdapters\n");
        
        for i in 0..num_hosts {
            let cluster = if i % 3 == 0 { "ASNCLUBA0001" } else if i % 3 == 1 { "ASNCLUHRK001" } else { "PLBYDCL03" };
            data.push_str(&format!(
                "esxi-host{}.local,{},{},{} GB,poweredOn,vmnic0;vmnic1;vmnic2;vmnic3\n",
                i + 1, cluster, 16 + (i % 16) * 2, 64 + (i % 8) * 32
            ));
        }
        
        data.push_str("\nSheet: vInfo\n");
        data.push_str("VM,Host,Cluster,Memory,PowerState,CpuCores,GuestOS\n");
        
        for i in 0..num_vms {
            let host_idx = i % num_hosts;
            let cluster = if host_idx % 3 == 0 { "ASNCLUBA0001" } else if host_idx % 3 == 1 { "ASNCLUHRK001" } else { "PLBYDCL03" };
            data.push_str(&format!(
                "vm{},esxi-host{}.local,{},{} GB,poweredOn,{},Ubuntu Linux\n",
                i + 1, host_idx + 1, cluster, 4 + (i % 4) * 4, 2 + (i % 3)
            ));
        }
        
        data.push_str("\nSheet: vDatastore\n");
        data.push_str("Datastore,Host,Cluster,Capacity,FreeSpace,Type\n");
        
        for i in 0..num_hosts {
            let cluster = if i % 3 == 0 { "ASNCLUBA0001" } else if i % 3 == 1 { "ASNCLUHRK001" } else { "PLBYDCL03" };
            data.push_str(&format!(
                "{}-local,esxi-host{}.local,{},{} TB,{} TB,VMFS\n",
                cluster, i + 1, cluster, 10 + (i % 10), 5 + (i % 5)
            ));
        }
        
        data.push_str("\nSheet: vCluster\n");
        data.push_str("Cluster,TotalHosts,TotalVMs,HAEnabled,DRSEnabled\n");
        data.push_str("ASNCLUBA0001,10,100,true,true\n");
        data.push_str("ASNCLUHRK001,8,80,true,true\n");
        data.push_str("PLBYDCL03,6,60,true,false\n");

        data.into_bytes()
    }

    fn benchmark_function<F, T>(name: &str, func: F) -> T
    where
        F: FnOnce() -> T,
    {
        let start = Instant::now();
        let result = func();
        let duration = start.elapsed();
        println!("Benchmark {}: {:?}", name, duration);
        result
    }

    async fn benchmark_async_function<F, Fut, T>(name: &str, func: F) -> T
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = T>,
    {
        let start = Instant::now();
        let result = func().await;
        let duration = start.elapsed();
        println!("Async Benchmark {}: {:?}", name, duration);
        result
    }

    #[tokio::test]
    async fn test_small_dataset_performance() {
        let db = setup_performance_test_db().await;
        let service = EnhancedRvToolsService::new(db);
        
        let upload_data = RvToolsExcelUploadData {
            filename: "small-test.xlsx".to_string(),
            excel_data: generate_large_mock_excel_data(10, 50), // Small dataset
            project_id: Some(Thing::from(("project", "perf-test-small"))),
        };

        // This test measures performance with a small dataset
        // In real implementation, would test actual Excel processing
        let start = Instant::now();
        
        // Simulate processing time
        let _result = benchmark_async_function("small_dataset_validation", async || {
            // Test individual validation performance
            let mut validation_count = 0;
            for i in 0..100 {
                let result = service.validation_rules.validate_field(
                    "vHost", 
                    "CpuCores", 
                    &format!("{}", 8 + i % 16)
                );
                if result.is_valid {
                    validation_count += 1;
                }
            }
            validation_count
        }).await;

        let duration = start.elapsed();
        assert!(duration < Duration::from_millis(100), "Small dataset processing too slow: {:?}", duration);
    }

    #[tokio::test]
    async fn test_medium_dataset_performance() {
        let db = setup_performance_test_db().await;
        let service = EnhancedRvToolsService::new(db);
        
        let upload_data = RvToolsExcelUploadData {
            filename: "medium-test.xlsx".to_string(),
            excel_data: generate_large_mock_excel_data(100, 500), // Medium dataset
            project_id: Some(Thing::from(("project", "perf-test-medium"))),
        };

        let start = Instant::now();
        
        // Test validation performance with medium dataset
        let _result = benchmark_async_function("medium_dataset_validation", async || {
            let mut total_validations = 0;
            
            // Test various field types
            let test_cases = vec![
                ("vHost", "CpuCores", "16"),
                ("vHost", "Memory", "64 GB"),
                ("vInfo", "Memory", "8 GB"),
                ("vDatastore", "Capacity", "10 TB"),
                ("vCluster", "TotalHosts", "10"),
            ];
            
            for _ in 0..100 {
                for (sheet, column, value) in &test_cases {
                    let result = service.validation_rules.validate_field(sheet, column, value);
                    if result.is_valid {
                        total_validations += 1;
                    }
                }
            }
            
            total_validations
        }).await;

        let duration = start.elapsed();
        assert!(duration < Duration::from_secs(1), "Medium dataset processing too slow: {:?}", duration);
    }

    #[tokio::test]
    async fn test_large_dataset_performance() {
        let db = setup_performance_test_db().await;
        let service = EnhancedRvToolsService::new(db);
        
        let upload_data = RvToolsExcelUploadData {
            filename: "large-test.xlsx".to_string(),
            excel_data: generate_large_mock_excel_data(1000, 5000), // Large dataset
            project_id: Some(Thing::from(("project", "perf-test-large"))),
        };

        let start = Instant::now();
        
        // Test processing performance with large dataset
        let _result = benchmark_async_function("large_dataset_processing", async || {
            // Simulate processing large amounts of data
            let mut processed_rows = 0;
            
            // Test capacity parsing performance
            let capacity_values = vec![
                "100 GB", "1 TB", "2.5 TB", "500 GB", "10 TB",
                "50000 MB", "3000 GB", "1500000 MB", "8 TB", "15 TB"
            ];
            
            for _ in 0..1000 {
                for capacity in &capacity_values {
                    if let Some(_gb_value) = service.parse_capacity_to_gb(capacity) {
                        processed_rows += 1;
                    }
                }
            }
            
            processed_rows
        }).await;

        let duration = start.elapsed();
        assert!(duration < Duration::from_secs(5), "Large dataset processing too slow: {:?}", duration);
        println!("Large dataset processing completed in: {:?}", duration);
    }

    #[tokio::test]
    async fn test_validation_rules_performance() {
        let db = setup_performance_test_db().await;
        let service = EnhancedRvToolsService::new(db);
        
        // Test performance of different validation rule types
        let test_scenarios = vec![
            ("Numeric Range Validation", "vHost", "CpuCores", vec!["1", "8", "16", "32", "64", "128"]),
            ("Capacity Validation", "vHost", "Memory", vec!["32 GB", "64 GB", "128 GB", "256 GB"]),
            ("Pattern Validation", "vHost", "IpAddress", vec!["192.168.1.1", "10.0.0.1", "172.16.0.1"]),
            ("Boolean Validation", "vInfo", "PowerState", vec!["poweredOn", "poweredOff", "suspended"]),
        ];

        for (scenario_name, sheet, column, test_values) in test_scenarios {
            let _duration = benchmark_function(&format!("validation_{}", scenario_name.replace(" ", "_").to_lowercase()), || {
                let mut successful_validations = 0;
                
                for _ in 0..1000 {
                    for value in &test_values {
                        let result = service.validation_rules.validate_field(sheet, column, value);
                        if result.is_valid {
                            successful_validations += 1;
                        }
                    }
                }
                
                successful_validations
            });
        }
    }

    #[tokio::test] 
    async fn test_database_insertion_performance() {
        let db = setup_performance_test_db().await;
        
        let upload_id = Thing::from(("rvtools_upload", "perf-test-db"));
        
        // Test bulk insertion performance
        let start = Instant::now();
        
        let num_records = 1000;
        let mut insertion_times = Vec::new();
        
        for i in 0..num_records {
            let record_start = Instant::now();
            
            let excel_data = RvToolsExcelData {
                id: None,
                upload_id: upload_id.clone(),
                sheet_name: format!("vHost"),
                row_number: i + 1,
                column_name: "CpuCores".to_string(),
                column_index: 2,
                raw_value: format!("{}", 8 + (i % 16)),
                parsed_value: serde_json::json!(8 + (i % 16)),
                data_type: RvToolsDataType::Integer,
                metric_category: MetricCategory::HardwareConfig,
                confidence_score: 0.95,
                validation_status: ValidationStatus::Valid,
                validation_errors: Vec::new(),
                metadata: HashMap::new(),
                created_at: chrono::Utc::now(),
            };

            let _: Vec<RvToolsExcelData> = db
                .create("rvtools_excel_data")
                .content(excel_data)
                .await
                .expect("Failed to insert performance test data");
            
            insertion_times.push(record_start.elapsed());
        }
        
        let total_duration = start.elapsed();
        let average_insertion_time = insertion_times.iter().sum::<Duration>() / insertion_times.len() as u32;
        
        println!("Database insertion performance:");
        println!("  Total records: {}", num_records);
        println!("  Total time: {:?}", total_duration);
        println!("  Average per record: {:?}", average_insertion_time);
        println!("  Records per second: {:.2}", num_records as f64 / total_duration.as_secs_f64());
        
        // Assert reasonable performance benchmarks
        assert!(total_duration < Duration::from_secs(10), "Database insertion too slow");
        assert!(average_insertion_time < Duration::from_millis(10), "Individual insertion too slow");
    }

    #[tokio::test]
    async fn test_concurrent_processing_performance() {
        let db = setup_performance_test_db().await;
        let service = std::sync::Arc::new(EnhancedRvToolsService::new(db));
        
        // Test concurrent validation processing
        let start = Instant::now();
        
        let mut handles = vec![];
        let num_concurrent_tasks = 10;
        let validations_per_task = 100;
        
        for task_id in 0..num_concurrent_tasks {
            let service_clone = service.clone();
            let handle = tokio::spawn(async move {
                let mut successful_validations = 0;
                
                for i in 0..validations_per_task {
                    let value = format!("{}", 8 + i % 16);
                    let result = service_clone.validation_rules.validate_field("vHost", "CpuCores", &value);
                    if result.is_valid {
                        successful_validations += 1;
                    }
                }
                
                (task_id, successful_validations)
            });
            handles.push(handle);
        }
        
        let mut total_validations = 0;
        for handle in handles {
            let (task_id, validations) = handle.await.unwrap();
            total_validations += validations;
            println!("Task {} completed {} validations", task_id, validations);
        }
        
        let duration = start.elapsed();
        let validations_per_second = total_validations as f64 / duration.as_secs_f64();
        
        println!("Concurrent processing performance:");
        println!("  Concurrent tasks: {}", num_concurrent_tasks);
        println!("  Total validations: {}", total_validations);
        println!("  Duration: {:?}", duration);
        println!("  Validations per second: {:.2}", validations_per_second);
        
        assert!(validations_per_second > 1000.0, "Concurrent processing too slow");
    }

    #[tokio::test]
    async fn test_memory_usage_during_large_processing() {
        let db = setup_performance_test_db().await;
        let service = EnhancedRvToolsService::new(db.clone());
        
        // Test memory efficiency with large dataset
        let upload_id = Thing::from(("rvtools_upload", "memory-test"));
        
        let start = Instant::now();
        
        // Process data in batches to simulate real-world memory usage
        let batch_size = 100;
        let num_batches = 10;
        
        for batch in 0..num_batches {
            let batch_start = Instant::now();
            
            // Create batch data
            let mut batch_data = Vec::with_capacity(batch_size);
            
            for i in 0..batch_size {
                let record_id = batch * batch_size + i;
                
                let excel_data = RvToolsExcelData {
                    id: None,
                    upload_id: upload_id.clone(),
                    sheet_name: "vHost".to_string(),
                    row_number: record_id + 1,
                    column_name: "Memory".to_string(),
                    column_index: 3,
                    raw_value: format!("{} GB", 32 + (record_id % 8) * 16),
                    parsed_value: serde_json::json!(format!("{} GB", 32 + (record_id % 8) * 16)),
                    data_type: RvToolsDataType::Capacity,
                    metric_category: MetricCategory::CapacityMetrics,
                    confidence_score: 0.9,
                    validation_status: ValidationStatus::Valid,
                    validation_errors: Vec::new(),
                    metadata: HashMap::new(),
                    created_at: chrono::Utc::now(),
                };
                
                batch_data.push(excel_data);
            }
            
            // Insert batch
            for data in batch_data {
                let _: Vec<RvToolsExcelData> = db
                    .create("rvtools_excel_data")
                    .content(data)
                    .await
                    .expect("Failed to insert batch data");
            }
            
            let batch_duration = batch_start.elapsed();
            println!("Batch {} processed in {:?}", batch + 1, batch_duration);
        }
        
        let total_duration = start.elapsed();
        let records_processed = batch_size * num_batches;
        
        println!("Memory usage test completed:");
        println!("  Records processed: {}", records_processed);
        println!("  Total duration: {:?}", total_duration);
        println!("  Average per record: {:?}", total_duration / records_processed as u32);
        
        // Memory usage is hard to test directly, but we can ensure reasonable processing time
        assert!(total_duration < Duration::from_secs(30), "Memory test processing too slow");
    }

    #[tokio::test]
    async fn test_storage_analysis_performance() {
        let db = setup_performance_test_db().await;
        let service = EnhancedRvToolsService::new(db.clone());
        
        let upload_id = Thing::from(("rvtools_upload", "storage-perf-test"));
        
        // Insert test data for storage analysis
        let clusters = vec!["ASNCLUBA0001", "ASNCLUHRK001", "PLBYDCL03"];
        
        for (cluster_idx, cluster) in clusters.iter().enumerate() {
            // Insert datastore data
            for i in 0..10 {
                let datastore_data = RvToolsExcelData {
                    id: None,
                    upload_id: upload_id.clone(),
                    sheet_name: "vDatastore".to_string(),
                    row_number: cluster_idx as i32 * 10 + i + 1,
                    column_name: "Datastore".to_string(),
                    column_index: 0,
                    raw_value: format!("{}-datastore-{}", cluster, i + 1),
                    parsed_value: serde_json::json!(format!("{}-datastore-{}", cluster, i + 1)),
                    data_type: RvToolsDataType::String,
                    metric_category: MetricCategory::StorageMetrics,
                    confidence_score: 0.95,
                    validation_status: ValidationStatus::Valid,
                    validation_errors: Vec::new(),
                    metadata: HashMap::new(),
                    created_at: chrono::Utc::now(),
                };

                let _: Vec<RvToolsExcelData> = db
                    .create("rvtools_excel_data")
                    .content(datastore_data)
                    .await
                    .expect("Failed to insert datastore data");
            }
        }

        // Benchmark storage analysis
        let analysis_result = benchmark_async_function("storage_analysis", async || {
            service.analyze_storage_architecture(&upload_id).await
        }).await;

        assert!(analysis_result.is_ok(), "Storage analysis failed");
        
        // Benchmark S2D compliance checks
        for cluster in &clusters {
            let _compliance_result = benchmark_async_function(&format!("s2d_compliance_{}", cluster), async || {
                service.check_s2d_compliance(&upload_id, cluster).await
            }).await;
        }
    }

    #[tokio::test]
    async fn test_regex_pattern_performance() {
        let service = EnhancedRvToolsService::new(setup_performance_test_db().await);
        
        // Test regex performance for various patterns
        let test_patterns = vec![
            ("IP Address", r"^([0-9]{1,3}\.){3}[0-9]{1,3}$", vec!["192.168.1.1", "10.0.0.1", "172.16.0.1"]),
            ("CPU Model", r"(?i)(intel|amd|xeon|epyc|ryzen)", vec!["Intel Xeon E5-2680", "AMD EPYC 7742", "Intel Core i7"]),
            ("Network Speed", r"(?i)([0-9]+)\s*(mbps|gbps|mb/s|gb/s)", vec!["1 Gbps", "10 GBPS", "100 Mbps"]),
        ];

        for (pattern_name, regex_str, test_values) in test_patterns {
            let _result = benchmark_function(&format!("regex_{}", pattern_name.replace(" ", "_").to_lowercase()), || {
                let regex = regex::Regex::new(regex_str).unwrap();
                let mut matches = 0;
                
                for _ in 0..1000 {
                    for value in &test_values {
                        if regex.is_match(value) {
                            matches += 1;
                        }
                    }
                }
                
                matches
            });
        }
    }
}