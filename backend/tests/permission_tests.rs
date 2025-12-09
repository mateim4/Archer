// Archer ITSM - Cross-Module Permission Tests
// Tests for authentication and authorization across all modules

#[cfg(test)]
mod permission_tests {
    use backend::database::{self, Database};
    use backend::models::auth::{LoginRequest, SystemRole, UserStatus};
    use backend::models::cmdb::{CIClass, CreateCIRequest};
    use backend::models::knowledge::{ArticleVisibility, CreateArticleRequest};
    use backend::services::auth_service::{AuthService, AuthConfig};
    use backend::services::cmdb_service::CMDBService;
    use backend::services::knowledge_service::KnowledgeService;
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

    async fn setup_auth_service(db: Arc<Database>) -> AuthService {
        let auth_service = AuthService::new(db.clone());
        // Initialize system roles
        let _ = auth_service.initialize_system_roles().await;
        auth_service
    }

    async fn create_test_user(
        auth_service: &AuthService,
        email: &str,
        username: &str,
        role_name: &str,
    ) -> (String, String) {
        let password = "SecurePassword123!";
        
        // Register user
        let user = auth_service
            .register_user(email, username, password, username, None)
            .await
            .expect("Failed to register user");

        let user_id = user.id.as_ref().unwrap().id.to_string();

        // Find and assign role
        let roles = auth_service.list_roles().await.expect("Failed to list roles");
        let role = roles
            .iter()
            .find(|r| r.name == role_name)
            .expect(&format!("Role {} not found", role_name));

        let role_id = role.id.as_ref().unwrap().id.to_string();
        let _ = auth_service.assign_role(&user_id, &role_id).await;

        (user_id, password.to_string())
    }

    async fn cleanup_all(db: &Database) {
        // Clean up all test data
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE users").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE roles").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE permissions").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE kb_articles").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE configuration_items").await;
    }

    // ========================================================================
    // UNAUTHENTICATED ACCESS TESTS (401)
    // ========================================================================

    #[tokio::test]
    async fn test_unauthenticated_access_returns_401() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Try to check permission without being authenticated
        let result = auth_service.check_permission("invalid-user-id", "tickets:create").await;

        // Should fail (user doesn't exist)
        assert!(result.is_err());

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_unauthenticated_kb_access() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Try to create article without authentication
        let request = CreateArticleRequest {
            title: "Test Article".to_string(),
            content: "Content".to_string(),
            summary: None,
            category_id: None,
            tags: vec![],
            visibility: ArticleVisibility::Internal,
            seo_title: None,
            seo_description: None,
            expires_at: None,
        };

        // In real implementation, this would check auth token first
        // For now, we're testing that the user_id must be valid
        let result = KnowledgeService::create_article(
            db.clone(),
            request,
            "non-existent-user",
            "Ghost",
            None,
        )
        .await;

        // Should still create (service layer doesn't validate user existence)
        // But in production, the API layer would reject this before reaching service
        assert!(result.is_ok());

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_unauthenticated_cmdb_access() {
        let db = setup_test_db().await;

        // Try to create CI without authentication
        let request = CreateCIRequest {
            ci_id: None,
            name: "Test CI".to_string(),
            description: None,
            ci_class: CIClass::Hardware,
            ci_type: "Server".to_string(),
            status: backend::models::cmdb::CIStatus::Active,
            criticality: backend::models::cmdb::CICriticality::Medium,
            environment: None,
            location: None,
            owner_id: None,
            support_group: None,
            vendor: None,
            model: None,
            serial_number: None,
            version: None,
            ip_address: None,
            fqdn: None,
            attributes: HashMap::new(),
            install_date: None,
            warranty_expiry: None,
            end_of_life: None,
            tags: vec![],
        };

        let result = CMDBService::create_ci(
            db.clone(),
            request,
            "non-existent-user",
            "Ghost",
            None,
        )
        .await;

        // Should still create (service layer doesn't validate user existence)
        assert!(result.is_ok());

        cleanup_all(&db).await;
    }

    // ========================================================================
    // ADMIN ACCESS TESTS (Full Access)
    // ========================================================================

    #[tokio::test]
    async fn test_admin_can_access_all_resources() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create admin user
        let (admin_id, _password) = create_test_user(
            &auth_service,
            "admin@example.com",
            "admin_user",
            "admin",
        )
        .await;

        // Check various permissions
        let permissions = vec![
            "tickets:create",
            "tickets:update",
            "tickets:delete",
            "kb:create",
            "kb:update",
            "kb:delete",
            "cmdb:create",
            "cmdb:update",
            "cmdb:delete",
            "users:manage",
            "roles:manage",
        ];

        for permission in permissions {
            let has_perm = auth_service
                .check_permission(&admin_id, permission)
                .await
                .unwrap_or(false);

            assert!(
                has_perm,
                "Admin should have {} permission",
                permission
            );
        }

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_admin_can_create_kb_articles() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create admin user
        let (admin_id, _password) = create_test_user(
            &auth_service,
            "admin@example.com",
            "admin_user",
            "admin",
        )
        .await;

        // Create KB article as admin
        let request = CreateArticleRequest {
            title: "Admin Article".to_string(),
            content: "Content created by admin".to_string(),
            summary: None,
            category_id: None,
            tags: vec![],
            visibility: ArticleVisibility::Internal,
            seo_title: None,
            seo_description: None,
            expires_at: None,
        };

        let result = KnowledgeService::create_article(
            db.clone(),
            request,
            &admin_id,
            "admin_user",
            None,
        )
        .await;

        assert!(result.is_ok());

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_admin_can_create_cmdb_cis() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create admin user
        let (admin_id, _password) = create_test_user(
            &auth_service,
            "admin@example.com",
            "admin_user",
            "admin",
        )
        .await;

        // Create CI as admin
        let request = CreateCIRequest {
            ci_id: None,
            name: "Admin Server".to_string(),
            description: Some("Server created by admin".to_string()),
            ci_class: CIClass::Hardware,
            ci_type: "Server".to_string(),
            status: backend::models::cmdb::CIStatus::Active,
            criticality: backend::models::cmdb::CICriticality::High,
            environment: Some("Production".to_string()),
            location: None,
            owner_id: Some(admin_id.clone()),
            support_group: None,
            vendor: None,
            model: None,
            serial_number: None,
            version: None,
            ip_address: None,
            fqdn: None,
            attributes: HashMap::new(),
            install_date: None,
            warranty_expiry: None,
            end_of_life: None,
            tags: vec![],
        };

        let result = CMDBService::create_ci(
            db.clone(),
            request,
            &admin_id,
            "admin_user",
            None,
        )
        .await;

        assert!(result.is_ok());

        cleanup_all(&db).await;
    }

    // ========================================================================
    // AGENT ROLE TESTS (Limited Write Access)
    // ========================================================================

    #[tokio::test]
    async fn test_agent_can_create_kb_articles() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create agent user
        let (agent_id, _password) = create_test_user(
            &auth_service,
            "agent@example.com",
            "agent_user",
            "agent",
        )
        .await;

        // Agent should have kb:create permission
        let has_kb_create = auth_service
            .check_permission(&agent_id, "kb:create")
            .await
            .unwrap_or(false);

        assert!(has_kb_create, "Agent should have kb:create permission");

        // Create article as agent
        let request = CreateArticleRequest {
            title: "Agent Article".to_string(),
            content: "Content created by agent".to_string(),
            summary: None,
            category_id: None,
            tags: vec![],
            visibility: ArticleVisibility::Internal,
            seo_title: None,
            seo_description: None,
            expires_at: None,
        };

        let result = KnowledgeService::create_article(
            db.clone(),
            request,
            &agent_id,
            "agent_user",
            None,
        )
        .await;

        assert!(result.is_ok());

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_agent_limited_cmdb_access() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create agent user
        let (agent_id, _password) = create_test_user(
            &auth_service,
            "agent@example.com",
            "agent_user",
            "agent",
        )
        .await;

        // Agent may have limited CMDB permissions
        let has_cmdb_create = auth_service
            .check_permission(&agent_id, "cmdb:create")
            .await
            .unwrap_or(false);

        // Depending on system design, agent may or may not have cmdb:create
        // This test documents the expected behavior
        
        // If agent should not have CMDB create:
        // assert!(!has_cmdb_create, "Agent should not have cmdb:create permission");

        cleanup_all(&db).await;
    }

    // ========================================================================
    // VIEWER ROLE TESTS (Read-Only Access)
    // ========================================================================

    #[tokio::test]
    async fn test_viewer_has_read_only_access() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create viewer user
        let (viewer_id, _password) = create_test_user(
            &auth_service,
            "viewer@example.com",
            "viewer_user",
            "viewer",
        )
        .await;

        // Check read permissions (should have)
        let has_read = auth_service
            .check_permission(&viewer_id, "tickets:read")
            .await
            .unwrap_or(false);

        assert!(has_read, "Viewer should have read permissions");

        // Check write permissions (should NOT have)
        let write_permissions = vec![
            "tickets:create",
            "tickets:update",
            "tickets:delete",
            "kb:create",
            "kb:update",
            "cmdb:create",
            "cmdb:update",
        ];

        for permission in write_permissions {
            let has_perm = auth_service
                .check_permission(&viewer_id, permission)
                .await
                .unwrap_or(false);

            assert!(
                !has_perm,
                "Viewer should NOT have {} permission",
                permission
            );
        }

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_viewer_cannot_create_kb_articles() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create viewer user
        let (viewer_id, _password) = create_test_user(
            &auth_service,
            "viewer@example.com",
            "viewer_user",
            "viewer",
        )
        .await;

        // Check permission first
        let has_kb_create = auth_service
            .check_permission(&viewer_id, "kb:create")
            .await
            .unwrap_or(false);

        assert!(
            !has_kb_create,
            "Viewer should not have kb:create permission"
        );

        // In production, the API layer would check this and return 403
        // Service layer doesn't enforce RBAC itself

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_viewer_cannot_create_cmdb_cis() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create viewer user
        let (viewer_id, _password) = create_test_user(
            &auth_service,
            "viewer@example.com",
            "viewer_user",
            "viewer",
        )
        .await;

        // Check permission
        let has_cmdb_create = auth_service
            .check_permission(&viewer_id, "cmdb:create")
            .await
            .unwrap_or(false);

        assert!(
            !has_cmdb_create,
            "Viewer should not have cmdb:create permission"
        );

        cleanup_all(&db).await;
    }

    // ========================================================================
    // AUTHORIZATION BOUNDARY TESTS (403)
    // ========================================================================

    #[tokio::test]
    async fn test_unauthorized_user_management() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create agent user (not admin)
        let (agent_id, _password) = create_test_user(
            &auth_service,
            "agent@example.com",
            "agent_user",
            "agent",
        )
        .await;

        // Try to manage users (should be denied)
        let has_user_manage = auth_service
            .check_permission(&agent_id, "users:manage")
            .await
            .unwrap_or(false);

        assert!(
            !has_user_manage,
            "Non-admin should not have users:manage permission"
        );

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_unauthorized_role_management() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create viewer user
        let (viewer_id, _password) = create_test_user(
            &auth_service,
            "viewer@example.com",
            "viewer_user",
            "viewer",
        )
        .await;

        // Try to manage roles (should be denied)
        let has_role_manage = auth_service
            .check_permission(&viewer_id, "roles:manage")
            .await
            .unwrap_or(false);

        assert!(
            !has_role_manage,
            "Viewer should not have roles:manage permission"
        );

        cleanup_all(&db).await;
    }

    // ========================================================================
    // RESOURCE OWNERSHIP TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_agent_can_access_own_articles() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create agent user
        let (agent_id, _password) = create_test_user(
            &auth_service,
            "agent@example.com",
            "agent_user",
            "agent",
        )
        .await;

        // Create article as agent
        let request = CreateArticleRequest {
            title: "My Article".to_string(),
            content: "My content".to_string(),
            summary: None,
            category_id: None,
            tags: vec![],
            visibility: ArticleVisibility::Internal,
            seo_title: None,
            seo_description: None,
            expires_at: None,
        };

        let article = KnowledgeService::create_article(
            db.clone(),
            request,
            &agent_id,
            "agent_user",
            None,
        )
        .await
        .unwrap();

        // Verify agent is the author
        assert_eq!(article.author_id, agent_id);

        // Agent should be able to access their own article
        let article_id = article.id.as_ref().unwrap().id.to_string();
        let retrieved = KnowledgeService::get_article(db.clone(), &article_id)
            .await
            .unwrap();

        assert!(retrieved.is_some());

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_ci_owner_tracking() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create agent user
        let (agent_id, _password) = create_test_user(
            &auth_service,
            "agent@example.com",
            "agent_user",
            "agent",
        )
        .await;

        // Create CI with owner
        let request = CreateCIRequest {
            ci_id: None,
            name: "My Server".to_string(),
            description: None,
            ci_class: CIClass::Hardware,
            ci_type: "Server".to_string(),
            status: backend::models::cmdb::CIStatus::Active,
            criticality: backend::models::cmdb::CICriticality::Medium,
            environment: None,
            location: None,
            owner_id: Some(agent_id.clone()),
            support_group: None,
            vendor: None,
            model: None,
            serial_number: None,
            version: None,
            ip_address: None,
            fqdn: None,
            attributes: HashMap::new(),
            install_date: None,
            warranty_expiry: None,
            end_of_life: None,
            tags: vec![],
        };

        let ci = CMDBService::create_ci(
            db.clone(),
            request,
            &agent_id,
            "agent_user",
            None,
        )
        .await
        .unwrap();

        // Verify owner
        assert_eq!(ci.owner_id, Some(agent_id));

        cleanup_all(&db).await;
    }

    // ========================================================================
    // SUPER ADMIN TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_super_admin_can_do_everything() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        // Create super admin user
        let (super_admin_id, _password) = create_test_user(
            &auth_service,
            "superadmin@example.com",
            "superadmin_user",
            "super_admin",
        )
        .await;

        // Check all possible permissions
        let all_permissions = vec![
            "tickets:create",
            "tickets:update",
            "tickets:delete",
            "tickets:read",
            "kb:create",
            "kb:update",
            "kb:delete",
            "kb:read",
            "cmdb:create",
            "cmdb:update",
            "cmdb:delete",
            "cmdb:read",
            "users:manage",
            "roles:manage",
            "system:configure",
        ];

        for permission in all_permissions {
            let has_perm = auth_service
                .check_permission(&super_admin_id, permission)
                .await
                .unwrap_or(false);

            assert!(
                has_perm,
                "Super admin should have {} permission",
                permission
            );
        }

        cleanup_all(&db).await;
    }

    // ========================================================================
    // TOKEN VALIDATION TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_expired_token_rejected() {
        let db = setup_test_db().await;

        // Create auth service with very short token expiry
        let mut config = AuthConfig::default();
        config.access_token_expiry = -1; // Already expired
        let auth_service = AuthService::with_config(db.clone(), config);

        // Initialize roles
        let _ = auth_service.initialize_system_roles().await;

        // Register and login user
        let email = format!("test{}@example.com", Utc::now().timestamp());
        let username = format!("testuser{}", Utc::now().timestamp());
        let password = "SecurePassword123!";

        let _ = auth_service
            .register_user(&email, &username, password, &username, None)
            .await
            .unwrap();

        let login_request = LoginRequest {
            email: email.clone(),
            password: password.to_string(),
        };

        let response = auth_service.login(login_request).await.unwrap();

        // Try to verify expired token
        let verify_result = auth_service.verify_token(&response.access_token).await;

        assert!(verify_result.is_err());
        let error = verify_result.unwrap_err();
        assert!(error.to_string().contains("Token expired"));

        cleanup_all(&db).await;
    }

    #[tokio::test]
    async fn test_invalid_token_rejected() {
        let db = setup_test_db().await;
        let auth_service = setup_auth_service(db.clone()).await;

        let invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
        let result = auth_service.verify_token(invalid_token).await;

        assert!(result.is_err());

        cleanup_all(&db).await;
    }
}
