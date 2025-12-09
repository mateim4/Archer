// Archer ITSM - CMDB Module Tests
// Tests for Configuration Items, relationships, and impact analysis

#[cfg(test)]
mod cmdb_tests {
    use backend::database::{self, Database};
    use backend::models::cmdb::{
        CIChangeType, CIClass, CICriticality, CIRelationshipType, CIStatus, ConfigurationItem,
        CreateCIRelationshipRequest, CreateCIRequest, UpdateCIRequest,
    };
    use backend::services::cmdb_service::CMDBService;
    use chrono::Utc;
    use std::collections::HashMap;
    use std::sync::Arc;

    // ========================================================================
    // TEST SETUP HELPERS
    // ========================================================================

    async fn setup_test_db() -> Arc<Database> {
        let db = database::new_test()
            .await
            .expect("Failed to create test database");
        Arc::new(db)
    }

    async fn cleanup_cmdb(db: &Database) {
        let _: Result<Vec<ConfigurationItem>, _> = db.query("DELETE configuration_items").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE ci_relationships").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE ci_types").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE ci_history").await;
    }

    fn create_test_ci_request(name: &str, ci_class: CIClass) -> CreateCIRequest {
        CreateCIRequest {
            ci_id: None, // Auto-generate
            name: name.to_string(),
            description: Some(format!("Test CI: {}", name)),
            ci_class,
            ci_type: "Server".to_string(),
            status: CIStatus::Active,
            criticality: CICriticality::Medium,
            environment: Some("Production".to_string()),
            location: Some("Data Center A".to_string()),
            owner_id: Some("user-1".to_string()),
            support_group: Some("Infrastructure Team".to_string()),
            vendor: Some("Dell".to_string()),
            model: Some("PowerEdge R650".to_string()),
            serial_number: Some("SN123456".to_string()),
            version: None,
            ip_address: Some("192.168.1.10".to_string()),
            fqdn: Some(format!("{}.example.com", name.to_lowercase())),
            attributes: HashMap::new(),
            install_date: None,
            warranty_expiry: None,
            end_of_life: None,
            tags: vec!["test".to_string()],
        }
    }

    // ========================================================================
    // CONFIGURATION ITEM CRUD TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_ci_success() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-server-01", CIClass::Hardware);

        let result = CMDBService::create_ci(
            db.clone(),
            request.clone(),
            "user-1",
            "Test User",
            None,
        )
        .await;

        assert!(result.is_ok());
        let ci = result.unwrap();
        assert_eq!(ci.name, request.name);
        assert_eq!(ci.ci_class, CIClass::Hardware);
        assert_eq!(ci.status, CIStatus::Active);
        assert!(!ci.ci_id.is_empty());
        assert!(ci.ci_id.starts_with("HW-")); // Hardware prefix

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_create_ci_auto_generates_id() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-server", CIClass::Hardware);

        let ci1 = CMDBService::create_ci(db.clone(), request.clone(), "user-1", "Test User", None)
            .await
            .unwrap();

        let ci2 = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        assert_ne!(ci1.ci_id, ci2.ci_id);
        assert!(ci1.ci_id.starts_with("HW-"));
        assert!(ci2.ci_id.starts_with("HW-"));

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_create_ci_with_custom_id() {
        let db = setup_test_db().await;
        let mut request = create_test_ci_request("test-server", CIClass::Hardware);
        request.ci_id = Some("CUSTOM-SERVER-001".to_string());

        let result = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await;

        assert!(result.is_ok());
        let ci = result.unwrap();
        assert_eq!(ci.ci_id, "CUSTOM-SERVER-001");

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_create_ci_duplicate_id() {
        let db = setup_test_db().await;
        let mut request = create_test_ci_request("test-server", CIClass::Hardware);
        request.ci_id = Some("DUPLICATE-ID".to_string());

        // Create first CI
        let result1 = CMDBService::create_ci(db.clone(), request.clone(), "user-1", "Test User", None)
            .await;
        assert!(result1.is_ok());

        // Try to create with same ID
        let result2 = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await;

        assert!(result2.is_err());
        let error = result2.unwrap_err();
        assert!(error.contains("already exists"));

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_get_ci_by_id() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-server", CIClass::Hardware);

        // Create CI
        let created = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        let ci_db_id = created.id.as_ref().unwrap().id.to_string();

        // Get CI by database ID
        let result = CMDBService::get_ci(db.clone(), &ci_db_id).await;

        assert!(result.is_ok());
        let ci = result.unwrap();
        assert!(ci.is_some());
        let ci = ci.unwrap();
        assert_eq!(ci.name, created.name);

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_get_ci_by_ci_id() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-server", CIClass::Hardware);

        // Create CI
        let created = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        // Get CI by CI ID
        let result = CMDBService::get_ci_by_ci_id(db.clone(), &created.ci_id).await;

        assert!(result.is_ok());
        let ci = result.unwrap();
        assert!(ci.is_some());
        let ci = ci.unwrap();
        assert_eq!(ci.ci_id, created.ci_id);

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_update_ci() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-server", CIClass::Hardware);

        // Create CI
        let created = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        let ci_db_id = created.id.as_ref().unwrap().id.to_string();

        // Update CI
        let mut attributes = HashMap::new();
        attributes.insert("cpu_count".to_string(), serde_json::json!(16));
        attributes.insert("memory_gb".to_string(), serde_json::json!(64));

        let update_request = UpdateCIRequest {
            name: Some("updated-server".to_string()),
            description: Some("Updated description".to_string()),
            status: Some(CIStatus::Maintenance),
            criticality: Some(CICriticality::High),
            attributes: Some(attributes.clone()),
            ..Default::default()
        };

        let result = CMDBService::update_ci(
            db.clone(),
            &ci_db_id,
            update_request,
            "user-1",
            "Test User",
        )
        .await;

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.name, "updated-server");
        assert_eq!(updated.status, CIStatus::Maintenance);
        assert_eq!(updated.criticality, CICriticality::High);
        assert_eq!(updated.attributes.get("cpu_count").unwrap(), &serde_json::json!(16));

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_delete_ci() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-server", CIClass::Hardware);

        // Create CI
        let created = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        let ci_db_id = created.id.as_ref().unwrap().id.to_string();

        // Delete CI
        let delete_result = CMDBService::delete_ci(db.clone(), &ci_db_id, "user-1").await;
        assert!(delete_result.is_ok());

        // Verify CI no longer exists
        let get_result = CMDBService::get_ci(db.clone(), &ci_db_id).await.unwrap();
        assert!(get_result.is_none());

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_search_cis() {
        let db = setup_test_db().await;

        // Create multiple CIs
        for i in 0..5 {
            let request = create_test_ci_request(&format!("server-{}", i), CIClass::Hardware);
            let _ = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None).await;
        }

        // Search for CIs
        let result = CMDBService::search_cis(
            db.clone(),
            Some("server"), // query
            None,           // ci_class
            None,           // status
            None,           // criticality
            Some(1),        // page
            Some(3),        // per_page
        )
        .await;

        assert!(result.is_ok());
        let cis = result.unwrap();
        assert_eq!(cis.len(), 3); // Should respect pagination

        cleanup_cmdb(&db).await;
    }

    // ========================================================================
    // CI TYPE TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_ci_type() {
        let db = setup_test_db().await;

        let mut schema = HashMap::new();
        schema.insert("hostname".to_string(), serde_json::json!({
            "type": "string",
            "required": true
        }));
        schema.insert("cpu_count".to_string(), serde_json::json!({
            "type": "number",
            "required": true
        }));

        let result = CMDBService::create_ci_type(
            db.clone(),
            "Physical Server",
            Some("Physical hardware server"),
            CIClass::Hardware,
            Some(schema.clone()),
            None,
        )
        .await;

        assert!(result.is_ok());
        let ci_type = result.unwrap();
        assert_eq!(ci_type.name, "Physical Server");
        assert_eq!(ci_type.ci_class, CIClass::Hardware);
        assert!(ci_type.schema.is_some());

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_list_ci_types() {
        let db = setup_test_db().await;

        // Create multiple CI types
        for class in &[CIClass::Hardware, CIClass::Software, CIClass::Service] {
            let _ = CMDBService::create_ci_type(
                db.clone(),
                &format!("{:?} Type", class),
                None,
                class.clone(),
                None,
                None,
            )
            .await;
        }

        // List CI types
        let result = CMDBService::list_ci_types(db.clone(), None).await;

        assert!(result.is_ok());
        let types = result.unwrap();
        assert!(types.len() >= 3);

        cleanup_cmdb(&db).await;
    }

    // ========================================================================
    // RELATIONSHIP TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_relationship() {
        let db = setup_test_db().await;

        // Create two CIs
        let ci1 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("app-server", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci2 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("database-server", CIClass::Database),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci1_id = ci1.id.as_ref().unwrap().id.to_string();
        let ci2_id = ci2.id.as_ref().unwrap().id.to_string();

        // Create relationship
        let rel_request = CreateCIRelationshipRequest {
            source_ci_id: ci1_id.clone(),
            target_ci_id: ci2_id.clone(),
            relationship_type: CIRelationshipType::DependsOn,
            description: Some("App depends on database".to_string()),
        };

        let result = CMDBService::create_relationship(
            db.clone(),
            rel_request,
            "user-1",
            "Test User",
        )
        .await;

        assert!(result.is_ok());
        let relationship = result.unwrap();
        assert_eq!(relationship.relationship_type, CIRelationshipType::DependsOn);

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_get_ci_relationships() {
        let db = setup_test_db().await;

        // Create three CIs
        let ci1 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("app-server", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci2 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("database-server", CIClass::Database),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci3 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("cache-server", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci1_id = ci1.id.as_ref().unwrap().id.to_string();
        let ci2_id = ci2.id.as_ref().unwrap().id.to_string();
        let ci3_id = ci3.id.as_ref().unwrap().id.to_string();

        // Create relationships
        let rel1 = CreateCIRelationshipRequest {
            source_ci_id: ci1_id.clone(),
            target_ci_id: ci2_id.clone(),
            relationship_type: CIRelationshipType::DependsOn,
            description: None,
        };
        let _ = CMDBService::create_relationship(db.clone(), rel1, "user-1", "Test User").await;

        let rel2 = CreateCIRelationshipRequest {
            source_ci_id: ci1_id.clone(),
            target_ci_id: ci3_id.clone(),
            relationship_type: CIRelationshipType::DependsOn,
            description: None,
        };
        let _ = CMDBService::create_relationship(db.clone(), rel2, "user-1", "Test User").await;

        // Get relationships
        let result = CMDBService::get_ci_relationships(db.clone(), &ci1_id).await;

        assert!(result.is_ok());
        let relationships = result.unwrap();
        assert_eq!(relationships.len(), 2);

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_prevent_duplicate_relationships() {
        let db = setup_test_db().await;

        // Create two CIs
        let ci1 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-1", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci2 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-2", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci1_id = ci1.id.as_ref().unwrap().id.to_string();
        let ci2_id = ci2.id.as_ref().unwrap().id.to_string();

        // Create relationship
        let rel_request = CreateCIRelationshipRequest {
            source_ci_id: ci1_id.clone(),
            target_ci_id: ci2_id.clone(),
            relationship_type: CIRelationshipType::DependsOn,
            description: None,
        };

        let result1 = CMDBService::create_relationship(
            db.clone(),
            rel_request.clone(),
            "user-1",
            "Test User",
        )
        .await;
        assert!(result1.is_ok());

        // Try to create duplicate
        let result2 = CMDBService::create_relationship(
            db.clone(),
            rel_request,
            "user-1",
            "Test User",
        )
        .await;

        assert!(result2.is_err());
        let error = result2.unwrap_err();
        assert!(error.contains("already exists"));

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_delete_relationship() {
        let db = setup_test_db().await;

        // Create two CIs
        let ci1 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-1", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci2 = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-2", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci1_id = ci1.id.as_ref().unwrap().id.to_string();
        let ci2_id = ci2.id.as_ref().unwrap().id.to_string();

        // Create relationship
        let rel_request = CreateCIRelationshipRequest {
            source_ci_id: ci1_id.clone(),
            target_ci_id: ci2_id.clone(),
            relationship_type: CIRelationshipType::DependsOn,
            description: None,
        };

        let relationship = CMDBService::create_relationship(
            db.clone(),
            rel_request,
            "user-1",
            "Test User",
        )
        .await
        .unwrap();

        let rel_db_id = relationship.id.as_ref().unwrap().id.to_string();

        // Delete relationship
        let delete_result = CMDBService::delete_relationship(db.clone(), &rel_db_id).await;
        assert!(delete_result.is_ok());

        // Verify relationship no longer exists
        let relationships = CMDBService::get_ci_relationships(db.clone(), &ci1_id)
            .await
            .unwrap();
        assert_eq!(relationships.len(), 0);

        cleanup_cmdb(&db).await;
    }

    // ========================================================================
    // IMPACT ANALYSIS TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_get_upstream_dependencies() {
        let db = setup_test_db().await;

        // Create dependency chain: ui -> api -> database
        let database = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("database", CIClass::Database),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let api = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("api-server", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ui = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ui-server", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let db_id = database.id.as_ref().unwrap().id.to_string();
        let api_id = api.id.as_ref().unwrap().id.to_string();
        let ui_id = ui.id.as_ref().unwrap().id.to_string();

        // Create relationships
        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: api_id.clone(),
                target_ci_id: db_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: ui_id.clone(),
                target_ci_id: api_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        // Get upstream dependencies of database (who depends on it?)
        let result = CMDBService::get_upstream_dependencies(db.clone(), &db_id, None).await;

        assert!(result.is_ok());
        let upstream = result.unwrap();
        assert!(upstream.len() >= 1); // At least API depends on database

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_get_downstream_impact() {
        let db = setup_test_db().await;

        // Create dependency chain
        let load_balancer = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("load-balancer", CIClass::Network),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let web_server = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("web-server", CIClass::Hardware),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let lb_id = load_balancer.id.as_ref().unwrap().id.to_string();
        let ws_id = web_server.id.as_ref().unwrap().id.to_string();

        // Web server depends on load balancer
        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: ws_id.clone(),
                target_ci_id: lb_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        // Get downstream impact of load balancer (what depends on it?)
        let result = CMDBService::get_downstream_impact(db.clone(), &lb_id, None).await;

        assert!(result.is_ok());
        let downstream = result.unwrap();
        assert!(downstream.len() >= 1); // Web server is impacted

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_multi_hop_traversal() {
        let db = setup_test_db().await;

        // Create a longer chain: A -> B -> C
        let ci_a = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-a", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci_b = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-b", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci_c = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-c", CIClass::Database),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let a_id = ci_a.id.as_ref().unwrap().id.to_string();
        let b_id = ci_b.id.as_ref().unwrap().id.to_string();
        let c_id = ci_c.id.as_ref().unwrap().id.to_string();

        // Create relationships
        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: a_id.clone(),
                target_ci_id: b_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: b_id.clone(),
                target_ci_id: c_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        // Get upstream of C with max depth 2 (should reach A)
        let result = CMDBService::get_upstream_dependencies(db.clone(), &c_id, Some(2)).await;

        assert!(result.is_ok());
        let upstream = result.unwrap();
        // Should find both B and A
        assert!(upstream.len() >= 2);

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_handle_cycles_gracefully() {
        let db = setup_test_db().await;

        // Create cycle: A -> B -> C -> A
        let ci_a = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-a", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci_b = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-b", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let ci_c = CMDBService::create_ci(
            db.clone(),
            create_test_ci_request("ci-c", CIClass::Service),
            "user-1",
            "Test User",
            None,
        )
        .await
        .unwrap();

        let a_id = ci_a.id.as_ref().unwrap().id.to_string();
        let b_id = ci_b.id.as_ref().unwrap().id.to_string();
        let c_id = ci_c.id.as_ref().unwrap().id.to_string();

        // Create cycle
        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: a_id.clone(),
                target_ci_id: b_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: b_id.clone(),
                target_ci_id: c_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        let _ = CMDBService::create_relationship(
            db.clone(),
            CreateCIRelationshipRequest {
                source_ci_id: c_id.clone(),
                target_ci_id: a_id.clone(),
                relationship_type: CIRelationshipType::DependsOn,
                description: None,
            },
            "user-1",
            "Test User",
        )
        .await;

        // Traversal should not hang or error
        let result = CMDBService::get_upstream_dependencies(db.clone(), &a_id, Some(5)).await;

        assert!(result.is_ok());
        // Should handle cycle without infinite loop

        cleanup_cmdb(&db).await;
    }

    // ========================================================================
    // HISTORY TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_changes_logged_automatically() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-ci", CIClass::Hardware);

        // Create CI
        let ci = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        let ci_db_id = ci.id.as_ref().unwrap().id.to_string();

        // Get history
        let history = CMDBService::get_ci_history(db.clone(), &ci_db_id, None).await;

        assert!(history.is_ok());
        let history = history.unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].change_type, CIChangeType::Create);
        assert_eq!(history[0].changed_by, "user-1");

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_history_shows_who_what_when() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-ci", CIClass::Hardware);

        // Create CI
        let ci = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        let ci_db_id = ci.id.as_ref().unwrap().id.to_string();

        // Update CI
        let update = UpdateCIRequest {
            name: Some("updated-name".to_string()),
            ..Default::default()
        };
        let _ = CMDBService::update_ci(db.clone(), &ci_db_id, update, "user-2", "Another User")
            .await;

        // Get history
        let history = CMDBService::get_ci_history(db.clone(), &ci_db_id, None)
            .await
            .unwrap();

        assert_eq!(history.len(), 2);

        // Check create event
        assert_eq!(history[0].change_type, CIChangeType::Create);
        assert_eq!(history[0].changed_by, "user-1");
        assert!(history[0].changed_at <= Utc::now());

        // Check update event
        assert_eq!(history[1].change_type, CIChangeType::Update);
        assert_eq!(history[1].changed_by, "user-2");
        assert_eq!(history[1].field_name, Some("name".to_string()));

        cleanup_cmdb(&db).await;
    }

    #[tokio::test]
    async fn test_filter_history_by_field() {
        let db = setup_test_db().await;
        let request = create_test_ci_request("test-ci", CIClass::Hardware);

        // Create CI
        let ci = CMDBService::create_ci(db.clone(), request, "user-1", "Test User", None)
            .await
            .unwrap();

        let ci_db_id = ci.id.as_ref().unwrap().id.to_string();

        // Make multiple updates to different fields
        let _ = CMDBService::update_ci(
            db.clone(),
            &ci_db_id,
            UpdateCIRequest {
                name: Some("new-name".to_string()),
                ..Default::default()
            },
            "user-1",
            "Test User",
        )
        .await;

        let _ = CMDBService::update_ci(
            db.clone(),
            &ci_db_id,
            UpdateCIRequest {
                status: Some(CIStatus::Maintenance),
                ..Default::default()
            },
            "user-1",
            "Test User",
        )
        .await;

        // Get history filtered by field
        let history = CMDBService::get_ci_history(
            db.clone(),
            &ci_db_id,
            Some("status"), // Filter by status field
        )
        .await
        .unwrap();

        // Should only show status change
        let status_changes: Vec<_> = history
            .iter()
            .filter(|h| h.field_name.as_deref() == Some("status"))
            .collect();

        assert!(status_changes.len() >= 1);

        cleanup_cmdb(&db).await;
    }
}
