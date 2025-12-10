// Archer ITSM - Service Catalog Module Tests
// Tests for categories, catalog items, service requests, and approvals

#[cfg(test)]
mod service_catalog_tests {
    use backend::database::{self, Database};
    use backend::models::service_catalog::{
        ApprovalStatus, CatalogCategory, CatalogItem, CreateCatalogItemRequest,
        CreateCategoryRequest, CreateServiceRequestRequest, ServiceRequest,
        ServiceRequestStatus,
    };
    use chrono::Utc;
    use serde_json::json;
    use std::sync::Arc;
    use surrealdb::sql::Thing;

    // ========================================================================
    // TEST SETUP HELPERS
    // ========================================================================

    async fn setup_test_db() -> Arc<Database> {
        let db = database::new_test()
            .await
            .expect("Failed to create test database");
        
        // Run migrations
        if let Err(e) = backend::database::migrations::ServiceCatalogMigrations::run_all(&db).await {
            eprintln!("Migration warning: {}", e);
        }
        
        Arc::new(db)
    }

    async fn cleanup_catalog(db: &Database) {
        let _: Result<Vec<ServiceRequest>, _> = db.query("DELETE service_request").await;
        let _: Result<Vec<CatalogItem>, _> = db.query("DELETE catalog_item").await;
        let _: Result<Vec<CatalogCategory>, _> = db.query("DELETE catalog_category").await;
    }

    fn create_test_category_request() -> CreateCategoryRequest {
        CreateCategoryRequest {
            name: format!("Test Category {}", Utc::now().timestamp_millis()),
            description: Some("Test category description".to_string()),
            icon: Some("Laptop".to_string()),
            parent_id: None,
            sort_order: 1,
            is_active: true,
        }
    }

    fn create_test_item_request(category_id: Thing) -> CreateCatalogItemRequest {
        CreateCatalogItemRequest {
            name: format!("Test Item {}", Utc::now().timestamp_millis()),
            description: "This is a test catalog item".to_string(),
            category_id,
            icon: Some("Laptop".to_string()),
            short_description: "Test item".to_string(),
            delivery_time_days: Some(5),
            cost: Some(1200.00),
            is_active: true,
            form_schema: json!({
                "$schema": "http://json-schema.org/draft-07/schema#",
                "type": "object",
                "properties": {
                    "justification": {
                        "type": "string",
                        "title": "Business Justification"
                    }
                },
                "required": ["justification"]
            }),
            approval_required: true,
            approval_group: Some("IT_MANAGERS".to_string()),
            fulfillment_group: Some("IT_SUPPORT".to_string()),
        }
    }

    // ========================================================================
    // CATEGORY CRUD TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_category_success() {
        let db = setup_test_db().await;
        let request = create_test_category_request();

        let category = CatalogCategory::new(
            request.name.clone(),
            request.description.clone(),
            request.icon.clone(),
            request.parent_id,
            request.sort_order,
            request.is_active,
        );

        let result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;

        assert!(result.is_ok());
        let categories = result.unwrap();
        assert_eq!(categories.len(), 1);
        let created = &categories[0];
        assert_eq!(created.name, request.name);
        assert!(created.id.is_some());

        cleanup_catalog(&db).await;
    }

    #[tokio::test]
    async fn test_list_categories() {
        let db = setup_test_db().await;

        // Create multiple categories
        for i in 1..=3 {
            let mut request = create_test_category_request();
            request.name = format!("Category {}", i);
            request.sort_order = i;

            let category = CatalogCategory::new(
                request.name,
                request.description,
                request.icon,
                request.parent_id,
                request.sort_order,
                request.is_active,
            );

            let _: Result<Vec<CatalogCategory>, _> =
                db.create("catalog_category").content(category).await;
        }

        // List all categories
        let result: Result<Vec<CatalogCategory>, _> = db.select("catalog_category").await;

        assert!(result.is_ok());
        let categories = result.unwrap();
        assert_eq!(categories.len(), 3);

        cleanup_catalog(&db).await;
    }

    #[tokio::test]
    async fn test_update_category() {
        let db = setup_test_db().await;
        let request = create_test_category_request();

        let category = CatalogCategory::new(
            request.name.clone(),
            request.description.clone(),
            request.icon.clone(),
            request.parent_id,
            request.sort_order,
            request.is_active,
        );

        let created: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        assert!(created.is_ok());
        let cat_id = created.unwrap()[0].id.clone().unwrap();

        // Update the category
        let updated_name = "Updated Category Name".to_string();
        let mut updated_category = CatalogCategory::new(
            updated_name.clone(),
            Some("Updated description".to_string()),
            request.icon,
            request.parent_id,
            request.sort_order,
            request.is_active,
        );
        updated_category.id = Some(cat_id.clone());

        let update_result: Result<Option<CatalogCategory>, _> =
            db.update(cat_id).content(updated_category).await;

        assert!(update_result.is_ok());
        let updated = update_result.unwrap();
        assert!(updated.is_some());
        assert_eq!(updated.unwrap().name, updated_name);

        cleanup_catalog(&db).await;
    }

    // ========================================================================
    // CATALOG ITEM TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_catalog_item_success() {
        let db = setup_test_db().await;

        // First create a category
        let cat_request = create_test_category_request();
        let category = CatalogCategory::new(
            cat_request.name,
            cat_request.description,
            cat_request.icon,
            cat_request.parent_id,
            cat_request.sort_order,
            cat_request.is_active,
        );

        let cat_result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        assert!(cat_result.is_ok());
        let category_id = cat_result.unwrap()[0].id.clone().unwrap();

        // Now create an item
        let item_request = create_test_item_request(category_id.clone());

        let item = CatalogItem::new(
            item_request.name.clone(),
            item_request.description.clone(),
            item_request.category_id,
            item_request.icon,
            item_request.short_description,
            item_request.delivery_time_days,
            item_request.cost,
            item_request.is_active,
            item_request.form_schema,
            item_request.approval_required,
            item_request.approval_group,
            item_request.fulfillment_group,
        );

        let result: Result<Vec<CatalogItem>, _> = db.create("catalog_item").content(item).await;

        assert!(result.is_ok());
        let items = result.unwrap();
        assert_eq!(items.len(), 1);
        let created_item = &items[0];
        assert_eq!(created_item.name, item_request.name);
        assert_eq!(created_item.category_id, category_id);
        assert!(created_item.approval_required);

        cleanup_catalog(&db).await;
    }

    #[tokio::test]
    async fn test_catalog_item_with_json_schema() {
        let db = setup_test_db().await;

        // Create category first
        let cat_request = create_test_category_request();
        let category = CatalogCategory::new(
            cat_request.name,
            cat_request.description,
            cat_request.icon,
            cat_request.parent_id,
            cat_request.sort_order,
            cat_request.is_active,
        );

        let cat_result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        let category_id = cat_result.unwrap()[0].id.clone().unwrap();

        // Create item with complex form schema
        let form_schema = json!({
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "laptop_type": {
                    "type": "string",
                    "enum": ["Standard", "Developer", "Designer"]
                },
                "operating_system": {
                    "type": "string",
                    "enum": ["Windows 11", "macOS", "Ubuntu Linux"]
                },
                "ram_gb": {
                    "type": "integer",
                    "minimum": 8,
                    "maximum": 128
                }
            },
            "required": ["laptop_type", "operating_system"]
        });

        let item = CatalogItem::new(
            "Laptop Request".to_string(),
            "Request a new laptop".to_string(),
            category_id,
            Some("Laptop".to_string()),
            "New laptop".to_string(),
            Some(5),
            Some(1500.00),
            true,
            form_schema.clone(),
            true,
            Some("IT_MANAGERS".to_string()),
            Some("IT_SUPPORT".to_string()),
        );

        let result: Result<Vec<CatalogItem>, _> = db.create("catalog_item").content(item).await;

        assert!(result.is_ok());
        let created_item = &result.unwrap()[0];
        assert_eq!(created_item.form_schema, form_schema);

        cleanup_catalog(&db).await;
    }

    // ========================================================================
    // SERVICE REQUEST TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_service_request_with_approval() {
        let db = setup_test_db().await;

        // Setup: create category and item
        let cat_request = create_test_category_request();
        let category = CatalogCategory::new(
            cat_request.name,
            cat_request.description,
            cat_request.icon,
            cat_request.parent_id,
            cat_request.sort_order,
            cat_request.is_active,
        );

        let cat_result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        let category_id = cat_result.unwrap()[0].id.clone().unwrap();

        let item_request = create_test_item_request(category_id);
        let item = CatalogItem::new(
            item_request.name,
            item_request.description,
            item_request.category_id.clone(),
            item_request.icon,
            item_request.short_description,
            item_request.delivery_time_days,
            item_request.cost,
            item_request.is_active,
            item_request.form_schema,
            true, // Requires approval
            item_request.approval_group,
            item_request.fulfillment_group,
        );

        let item_result: Result<Vec<CatalogItem>, _> =
            db.create("catalog_item").content(item).await;
        let catalog_item_id = item_result.unwrap()[0].id.clone().unwrap();

        // Create service request
        let form_data = json!({
            "justification": "Need new laptop for development work"
        });

        let request = ServiceRequest::new(
            catalog_item_id,
            "user-123".to_string(),
            form_data.clone(),
            true, // Requires approval
        );

        let result: Result<Vec<ServiceRequest>, _> =
            db.create("service_request").content(request).await;

        assert!(result.is_ok());
        let service_requests = result.unwrap();
        assert_eq!(service_requests.len(), 1);
        let created = &service_requests[0];
        assert_eq!(created.status, ServiceRequestStatus::PendingApproval);
        assert_eq!(created.approval_status, Some(ApprovalStatus::Pending));
        assert_eq!(created.requester_id, "user-123");
        assert_eq!(created.form_data, form_data);

        cleanup_catalog(&db).await;
    }

    #[tokio::test]
    async fn test_approve_service_request() {
        let db = setup_test_db().await;

        // Setup: create category, item, and request
        let cat_request = create_test_category_request();
        let category = CatalogCategory::new(
            cat_request.name,
            cat_request.description,
            cat_request.icon,
            cat_request.parent_id,
            cat_request.sort_order,
            cat_request.is_active,
        );

        let cat_result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        let category_id = cat_result.unwrap()[0].id.clone().unwrap();

        let item_request = create_test_item_request(category_id);
        let item = CatalogItem::new(
            item_request.name,
            item_request.description,
            item_request.category_id,
            item_request.icon,
            item_request.short_description,
            item_request.delivery_time_days,
            item_request.cost,
            item_request.is_active,
            item_request.form_schema,
            true,
            item_request.approval_group,
            item_request.fulfillment_group,
        );

        let item_result: Result<Vec<CatalogItem>, _> =
            db.create("catalog_item").content(item).await;
        let catalog_item_id = item_result.unwrap()[0].id.clone().unwrap();

        let mut request = ServiceRequest::new(
            catalog_item_id,
            "user-123".to_string(),
            json!({"justification": "Test"}),
            true,
        );

        let req_result: Result<Vec<ServiceRequest>, _> =
            db.create("service_request").content(request.clone()).await;
        let request_id = req_result.unwrap()[0].id.clone().unwrap();

        // Approve the request
        request.approve("approver-456".to_string());

        let update_result: Result<Option<ServiceRequest>, _> =
            db.update(request_id).content(request).await;

        assert!(update_result.is_ok());
        let approved = update_result.unwrap().unwrap();
        assert_eq!(approved.status, ServiceRequestStatus::Approved);
        assert_eq!(approved.approval_status, Some(ApprovalStatus::Approved));
        assert_eq!(approved.approved_by, Some("approver-456".to_string()));
        assert!(approved.approved_at.is_some());

        cleanup_catalog(&db).await;
    }

    #[tokio::test]
    async fn test_reject_service_request() {
        let db = setup_test_db().await;

        // Setup: create category, item, and request
        let cat_request = create_test_category_request();
        let category = CatalogCategory::new(
            cat_request.name,
            cat_request.description,
            cat_request.icon,
            cat_request.parent_id,
            cat_request.sort_order,
            cat_request.is_active,
        );

        let cat_result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        let category_id = cat_result.unwrap()[0].id.clone().unwrap();

        let item_request = create_test_item_request(category_id);
        let item = CatalogItem::new(
            item_request.name,
            item_request.description,
            item_request.category_id,
            item_request.icon,
            item_request.short_description,
            item_request.delivery_time_days,
            item_request.cost,
            item_request.is_active,
            item_request.form_schema,
            true,
            item_request.approval_group,
            item_request.fulfillment_group,
        );

        let item_result: Result<Vec<CatalogItem>, _> =
            db.create("catalog_item").content(item).await;
        let catalog_item_id = item_result.unwrap()[0].id.clone().unwrap();

        let mut request = ServiceRequest::new(
            catalog_item_id,
            "user-123".to_string(),
            json!({"justification": "Test"}),
            true,
        );

        let req_result: Result<Vec<ServiceRequest>, _> =
            db.create("service_request").content(request.clone()).await;
        let request_id = req_result.unwrap()[0].id.clone().unwrap();

        // Reject the request
        let rejection_reason = "Insufficient justification".to_string();
        request.reject("approver-456".to_string(), Some(rejection_reason.clone()));

        let update_result: Result<Option<ServiceRequest>, _> =
            db.update(request_id).content(request).await;

        assert!(update_result.is_ok());
        let rejected = update_result.unwrap().unwrap();
        assert_eq!(rejected.status, ServiceRequestStatus::Rejected);
        assert_eq!(rejected.approval_status, Some(ApprovalStatus::Rejected));
        assert_eq!(rejected.approved_by, Some("approver-456".to_string()));
        assert_eq!(rejected.rejection_reason, Some(rejection_reason));
        assert!(rejected.approved_at.is_some());

        cleanup_catalog(&db).await;
    }

    #[tokio::test]
    async fn test_service_request_without_approval() {
        let db = setup_test_db().await;

        // Setup: create category and item that doesn't require approval
        let cat_request = create_test_category_request();
        let category = CatalogCategory::new(
            cat_request.name,
            cat_request.description,
            cat_request.icon,
            cat_request.parent_id,
            cat_request.sort_order,
            cat_request.is_active,
        );

        let cat_result: Result<Vec<CatalogCategory>, _> =
            db.create("catalog_category").content(category).await;
        let category_id = cat_result.unwrap()[0].id.clone().unwrap();

        let item_request = create_test_item_request(category_id);
        let item = CatalogItem::new(
            item_request.name,
            item_request.description,
            item_request.category_id.clone(),
            item_request.icon,
            item_request.short_description,
            item_request.delivery_time_days,
            item_request.cost,
            item_request.is_active,
            item_request.form_schema,
            false, // Does NOT require approval
            None,
            item_request.fulfillment_group,
        );

        let item_result: Result<Vec<CatalogItem>, _> =
            db.create("catalog_item").content(item).await;
        let catalog_item_id = item_result.unwrap()[0].id.clone().unwrap();

        // Create service request
        let request = ServiceRequest::new(
            catalog_item_id,
            "user-123".to_string(),
            json!({"justification": "Test"}),
            false, // No approval needed
        );

        let result: Result<Vec<ServiceRequest>, _> =
            db.create("service_request").content(request).await;

        assert!(result.is_ok());
        let created = &result.unwrap()[0];
        assert_eq!(created.status, ServiceRequestStatus::Approved); // Auto-approved
        assert_eq!(created.approval_status, None); // No approval tracking

        cleanup_catalog(&db).await;
    }
}
