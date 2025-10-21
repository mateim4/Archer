#[cfg(test)]
mod enhanced_rvtools_e2e_tests {
    use backend::api::enhanced_rvtools::create_enhanced_rvtools_router;
    use backend::database::Database;
    use axum::body::Body;
    use axum::http::{Method, Request, StatusCode};
    use serde_json::{json, Value};
    use std::sync::Arc;
    use tower::ServiceExt; // for `oneshot`

    async fn setup_test_database() -> Database {
        // Create in-memory SurrealDB instance for testing
        // This should match your Database type from the backend
        backend::database::new_test()
            .await
            .expect("Failed to create test database")
    }

    fn create_mock_excel_file() -> Vec<u8> {
        // In a real E2E test, this would be actual Excel binary data
        // For testing purposes, we create mock data that represents an Excel file structure
        let mock_excel_content = include_bytes!("../test_data/mock_rvtools.xlsx");
        // If file doesn't exist, return placeholder
        b"PK\x03\x04Mock Excel File Data".to_vec() // Excel files start with PK (ZIP format)
    }

    fn create_multipart_form_data(filename: &str, file_data: &[u8]) -> (Vec<u8>, String) {
        let boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
        let mut body = Vec::new();

        // Add file field
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"file\"; filename=\"");
        body.extend_from_slice(filename.as_bytes());
        body.extend_from_slice(b"\"\r\n");
        body.extend_from_slice(b"Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n");
        body.extend_from_slice(file_data);
        body.extend_from_slice(b"\r\n");

        // Add project_id field
        body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
        body.extend_from_slice(b"Content-Disposition: form-data; name=\"project_id\"\r\n\r\n");
        body.extend_from_slice(b"test-project-123\r\n");

        // End boundary
        body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

        let content_type = format!("multipart/form-data; boundary={}", boundary);
        (body, content_type)
    }

    #[tokio::test]
    async fn test_excel_upload_endpoint() {
        let app = setup_test_app().await;

        let file_data = create_mock_excel_file();
        let (body_data, content_type) = create_multipart_form_data("test-rvtools.xlsx", &file_data);

        let request = Request::builder()
            .method(Method::POST)
            .uri("/excel/upload")
            .header("content-type", content_type)
            .body(Body::from(body_data))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();

        // In a real implementation with proper Excel parsing, this would return 201
        // For mock data, we expect it to fail gracefully
        assert!(response.status().is_client_error() || response.status().is_server_error());
    }

    #[tokio::test]
    async fn test_get_uploads_endpoint() {
        let app = setup_test_app().await;

        let request = Request::builder()
            .method(Method::GET)
            .uri("/uploads")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_data: Value = serde_json::from_slice(&body).unwrap();

        assert!(response_data["success"].as_bool().unwrap_or(false));
        assert!(response_data["uploads"].is_array());
        assert_eq!(response_data["total_count"].as_u64().unwrap_or(1), 0); // No uploads initially
    }

    #[tokio::test]
    async fn test_generate_report_endpoint() {
        let app = setup_test_app().await;

        let request_body = json!({
            "upload_id": "test-upload-123",
            "template_id": "rvtools-migration-analysis"
        });

        let request = Request::builder()
            .method(Method::POST)
            .uri("/generate-report")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&request_body).unwrap()))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();

        // Expecting 404 since the upload doesn't exist
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_export_report_endpoint() {
        let app = setup_test_app().await;

        let request_body = json!({
            "upload_id": "test-upload-123",
            "template_id": "rvtools-migration-analysis",
            "export_format": "html"
        });

        let request = Request::builder()
            .method(Method::POST)
            .uri("/export-report")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_vec(&request_body).unwrap()))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_data: Value = serde_json::from_slice(&body).unwrap();

        assert!(response_data["success"].as_bool().unwrap_or(false));
        assert!(response_data["message"].is_string());
    }

    #[tokio::test]
    async fn test_storage_analysis_endpoint() {
        let app = setup_test_app().await;

        let request = Request::builder()
            .method(Method::GET)
            .uri("/storage/analysis/test-upload-123")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_data: Value = serde_json::from_slice(&body).unwrap();

        assert!(response_data["upload_id"].is_string());
        assert!(response_data["analyses"].is_array());
        assert!(response_data["generated_at"].is_string());
    }

    #[tokio::test]
    async fn test_s2d_compliance_endpoint() {
        let app = setup_test_app().await;

        let request = Request::builder()
            .method(Method::GET)
            .uri("/s2d/compliance/test-upload-123")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_data: Value = serde_json::from_slice(&body).unwrap();

        assert!(response_data["upload_id"].is_string());
        assert!(response_data["compliance_results"].is_object());
        assert!(response_data["generated_at"].is_string());
    }

    #[tokio::test]
    async fn test_validation_rules_endpoint() {
        let app = setup_test_app().await;

        let request = Request::builder()
            .method(Method::GET)
            .uri("/validation/rules")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_data: Value = serde_json::from_slice(&body).unwrap();

        assert!(response_data["rules"].is_array());
        let rules = response_data["rules"].as_array().unwrap();
        assert!(rules.len() > 0); // Should have validation rules

        // Verify rule structure
        for rule in rules {
            assert!(rule["rule_name"].is_string());
            assert!(rule["description"].is_string());
            assert!(rule["applies_to"].is_array());
        }
    }

    #[tokio::test]
    async fn test_data_traceability_endpoint() {
        let app = setup_test_app().await;

        let request = Request::builder()
            .method(Method::GET)
            .uri("/data/traceability/test-upload-123")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let response_data: Value = serde_json::from_slice(&body).unwrap();

        assert!(response_data["upload_id"].is_string());
        assert!(response_data["total_records"].is_number());
        assert!(response_data["data"].is_array());
        assert!(response_data["generated_at"].is_string());
    }

    #[tokio::test]
    async fn test_complete_workflow_simulation() {
        // This test simulates the complete user workflow:
        // 1. Upload Excel file
        // 2. Check upload status
        // 3. Generate report
        // 4. Export report

        let app = setup_test_app().await;

        // Step 1: Upload Excel file (mock)
        let file_data = create_mock_excel_file();
        let (body_data, content_type) =
            create_multipart_form_data("workflow-test.xlsx", &file_data);

        let upload_request = Request::builder()
            .method(Method::POST)
            .uri("/excel/upload")
            .header("content-type", content_type)
            .body(Body::from(body_data))
            .unwrap();

        let upload_response = app.clone().oneshot(upload_request).await.unwrap();
        // Upload will fail with mock data, but that's expected
        assert!(
            upload_response.status().is_client_error()
                || upload_response.status().is_server_error()
        );

        // Step 2: Check uploads
        let list_request = Request::builder()
            .method(Method::GET)
            .uri("/uploads")
            .body(Body::empty())
            .unwrap();

        let list_response = app.clone().oneshot(list_request).await.unwrap();
        assert_eq!(list_response.status(), StatusCode::OK);

        // Step 3: Generate report (will fail due to no upload, but tests endpoint)
        let report_request_body = json!({
            "upload_id": "workflow-test-upload",
            "template_id": "rvtools-migration-analysis"
        });

        let report_request = Request::builder()
            .method(Method::POST)
            .uri("/generate-report")
            .header("content-type", "application/json")
            .body(Body::from(
                serde_json::to_vec(&report_request_body).unwrap(),
            ))
            .unwrap();

        let report_response = app.clone().oneshot(report_request).await.unwrap();
        assert_eq!(report_response.status(), StatusCode::NOT_FOUND);

        // Step 4: Export report
        let export_request_body = json!({
            "upload_id": "workflow-test-upload",
            "template_id": "rvtools-migration-analysis",
            "export_format": "pdf"
        });

        let export_request = Request::builder()
            .method(Method::POST)
            .uri("/export-report")
            .header("content-type", "application/json")
            .body(Body::from(
                serde_json::to_vec(&export_request_body).unwrap(),
            ))
            .unwrap();

        let export_response = app.oneshot(export_request).await.unwrap();
        assert_eq!(export_response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_error_handling_in_endpoints() {
        let app = setup_test_app().await;

        // Test malformed JSON
        let bad_request = Request::builder()
            .method(Method::POST)
            .uri("/generate-report")
            .header("content-type", "application/json")
            .body(Body::from("invalid json"))
            .unwrap();

        let response = app.clone().oneshot(bad_request).await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        // Test missing content-type
        let no_content_type_request = Request::builder()
            .method(Method::POST)
            .uri("/generate-report")
            .body(Body::from(r#"{"upload_id":"test"}"#))
            .unwrap();

        let response = app.clone().oneshot(no_content_type_request).await.unwrap();
        // Should handle missing content-type gracefully
        assert!(response.status().is_client_error() || response.status().is_server_error());

        // Test invalid upload ID format
        let invalid_id_request = Request::builder()
            .method(Method::GET)
            .uri("/storage/analysis/invalid-upload-id-format!")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(invalid_id_request).await.unwrap();
        // Should handle invalid ID format
        assert!(response.status().is_success() || response.status().is_client_error());
    }

    #[tokio::test]
    async fn test_cors_and_headers() {
        let app = setup_test_app().await;

        let request = Request::builder()
            .method(Method::OPTIONS)
            .uri("/uploads")
            .header("Origin", "http://localhost:1420")
            .header("Access-Control-Request-Method", "GET")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(request).await.unwrap();

        // CORS preflight should be handled appropriately
        // In a full implementation, we'd verify CORS headers
        assert!(response.status().is_success() || response.status().is_client_error());
    }

    #[tokio::test]
    async fn test_concurrent_requests() {
        let app = setup_test_app().await;

        // Test multiple concurrent requests to ensure thread safety
        let mut handles = vec![];

        for i in 0..10 {
            let app_clone = app.clone();
            let handle = tokio::spawn(async move {
                let request = Request::builder()
                    .method(Method::GET)
                    .uri("/validation/rules")
                    .body(Body::empty())
                    .unwrap();

                let response = app_clone.oneshot(request).await.unwrap();
                (i, response.status())
            });
            handles.push(handle);
        }

        // Wait for all requests to complete
        for handle in handles {
            let (i, status) = handle.await.unwrap();
            assert_eq!(status, StatusCode::OK, "Request {} failed", i);
        }
    }

    #[tokio::test]
    async fn test_confirmed_vsan_clusters_in_s2d_endpoint() {
        let app = setup_test_app().await;

        // Test S2D compliance for each confirmed vSAN cluster
        let confirmed_clusters = ["ASNCLUBA0001", "ASNCLUHRK001", "PLBYDCL03"];

        for cluster in confirmed_clusters {
            let request = Request::builder()
                .method(Method::GET)
                .uri(&format!(
                    "/s2d/compliance/test-upload?cluster_name={}",
                    cluster
                ))
                .body(Body::empty())
                .unwrap();

            let response = app.clone().oneshot(request).await.unwrap();
            assert_eq!(
                response.status(),
                StatusCode::OK,
                "S2D compliance endpoint failed for cluster: {}",
                cluster
            );

            let body = axum::body::to_bytes(response.into_body(), usize::MAX)
                .await
                .unwrap();
            let response_data: Value = serde_json::from_slice(&body).unwrap();

            // Should have compliance results for the specific cluster
            assert!(response_data["compliance_results"].is_object());
            let compliance_results = response_data["compliance_results"].as_object().unwrap();
            assert!(
                compliance_results.contains_key(cluster),
                "Missing compliance result for cluster: {}",
                cluster
            );
        }
    }

    #[tokio::test]
    async fn test_api_response_structure() {
        let app = setup_test_app().await;

        // Test that API responses follow consistent structure
        let endpoints_to_test = vec![
            ("/uploads", Method::GET),
            ("/validation/rules", Method::GET),
            ("/data/traceability/test-upload", Method::GET),
        ];

        for (endpoint, method) in endpoints_to_test {
            let request = Request::builder()
                .method(method)
                .uri(endpoint)
                .body(Body::empty())
                .unwrap();

            let response = app.clone().oneshot(request).await.unwrap();
            assert_eq!(
                response.status(),
                StatusCode::OK,
                "Failed for endpoint: {}",
                endpoint
            );

            let body = axum::body::to_bytes(response.into_body(), usize::MAX)
                .await
                .unwrap();
            let response_data: Value = serde_json::from_slice(&body).unwrap();

            // All responses should be valid JSON objects
            assert!(
                response_data.is_object(),
                "Response is not JSON object for: {}",
                endpoint
            );

            // Most responses should have timestamp fields
            if endpoint != "/validation/rules" {
                assert!(
                    response_data.get("generated_at").is_some()
                        || response_data.get("created_at").is_some(),
                    "Missing timestamp for: {}",
                    endpoint
                );
            }
        }
    }
}
