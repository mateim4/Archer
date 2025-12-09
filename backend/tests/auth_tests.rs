// Archer ITSM - Authentication Module Tests
// Tests for registration, login, token management, and RBAC

#[cfg(test)]
mod auth_tests {
    use backend::database::{self, Database};
    use backend::models::auth::{
        LoginRequest, Permission, Role, SystemRole, User, UserStatus,
    };
    use backend::services::auth_service::{AuthConfig, AuthService};
    use chrono::Utc;
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

    async fn setup_auth_service() -> (Arc<Database>, AuthService) {
        let db = setup_test_db().await;
        let auth_service = AuthService::new(db.clone());
        (db, auth_service)
    }

    async fn cleanup_users(db: &Database) {
        let _: Result<Vec<User>, _> = db.query("DELETE users").await;
    }

    fn create_test_user_data() -> (String, String, String, String) {
        let email = format!("test.user{}@example.com", Utc::now().timestamp());
        let username = format!("testuser{}", Utc::now().timestamp());
        let password = "SecurePassword123!".to_string();
        let display_name = "Test User".to_string();
        (email, username, password, display_name)
    }

    // ========================================================================
    // REGISTRATION TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_register_user_success() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        let result = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await;

        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.email, email);
        assert_eq!(user.username, username);
        assert_eq!(user.status, UserStatus::Active);
        assert!(!user.password_hash.is_empty());

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_register_duplicate_email() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username1, password, display_name) = create_test_user_data();
        let username2 = format!("{}_different", username1);

        // Register first user
        let result1 = auth_service
            .register_user(&email, &username1, &password, &display_name, None)
            .await;
        assert!(result1.is_ok());

        // Try to register with same email
        let result2 = auth_service
            .register_user(&email, &username2, &password, &display_name, None)
            .await;

        assert!(result2.is_err());
        let error = result2.unwrap_err();
        assert!(error.to_string().contains("Email already exists"));

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_register_duplicate_username() {
        let (db, auth_service) = setup_auth_service().await;
        let (email1, username, password, display_name) = create_test_user_data();
        let email2 = format!("different_{}", email1);

        // Register first user
        let result1 = auth_service
            .register_user(&email1, &username, &password, &display_name, None)
            .await;
        assert!(result1.is_ok());

        // Try to register with same username
        let result2 = auth_service
            .register_user(&email2, &username, &password, &display_name, None)
            .await;

        assert!(result2.is_err());
        let error = result2.unwrap_err();
        assert!(error.to_string().contains("Username already exists"));

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_register_weak_password() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, _, display_name) = create_test_user_data();
        let weak_password = "123"; // Too short

        let result = auth_service
            .register_user(&email, &username, &weak_password, &display_name, None)
            .await;

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.to_string().contains("Password too weak"));

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_register_invalid_email() {
        let (db, auth_service) = setup_auth_service().await;
        let (_, username, password, display_name) = create_test_user_data();
        let invalid_email = "not-an-email";

        let result = auth_service
            .register_user(&invalid_email, &username, &password, &display_name, None)
            .await;

        // Service should validate email format
        assert!(result.is_err());

        cleanup_users(&db).await;
    }

    // ========================================================================
    // LOGIN TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_login_valid_credentials() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user first
        let _user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        // Login with valid credentials
        let login_request = LoginRequest {
            email: email.clone(),
            password: password.clone(),
        };

        let result = auth_service.login(login_request).await;
        assert!(result.is_ok());

        let response = result.unwrap();
        assert!(!response.access_token.is_empty());
        assert!(!response.refresh_token.is_empty());
        assert_eq!(response.user.email, email);

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_login_invalid_password() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user
        let _user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        // Login with wrong password
        let login_request = LoginRequest {
            email: email.clone(),
            password: "WrongPassword123!".to_string(),
        };

        let result = auth_service.login(login_request).await;
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.to_string().contains("Invalid credentials"));

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_login_nonexistent_user() {
        let (_db, auth_service) = setup_auth_service().await;

        let login_request = LoginRequest {
            email: "nonexistent@example.com".to_string(),
            password: "SomePassword123!".to_string(),
        };

        let result = auth_service.login(login_request).await;
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.to_string().contains("Invalid credentials"));
    }

    #[tokio::test]
    async fn test_login_returns_valid_jwt() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user
        let _user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        // Login
        let login_request = LoginRequest {
            email: email.clone(),
            password: password.clone(),
        };

        let response = auth_service.login(login_request).await.unwrap();

        // Verify token structure (should have 3 parts separated by dots)
        let token_parts: Vec<&str> = response.access_token.split('.').collect();
        assert_eq!(token_parts.len(), 3, "JWT should have 3 parts");

        cleanup_users(&db).await;
    }

    // ========================================================================
    // TOKEN TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_verify_valid_token() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register and login
        let user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        let login_request = LoginRequest {
            email: email.clone(),
            password: password.clone(),
        };
        let response = auth_service.login(login_request).await.unwrap();

        // Verify token
        let claims_result = auth_service.verify_token(&response.access_token).await;
        assert!(claims_result.is_ok());

        let claims = claims_result.unwrap();
        assert_eq!(claims.sub, user.id.as_ref().unwrap().id.to_string());
        assert_eq!(claims.email, email);

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_verify_invalid_token() {
        let (_db, auth_service) = setup_auth_service().await;

        let invalid_token = "invalid.token.here";
        let result = auth_service.verify_token(invalid_token).await;

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.to_string().contains("Invalid token"));
    }

    #[tokio::test]
    async fn test_refresh_token_flow() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register and login
        let _user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        let login_request = LoginRequest {
            email: email.clone(),
            password: password.clone(),
        };
        let login_response = auth_service.login(login_request).await.unwrap();

        // Use refresh token to get new access token
        let refresh_result = auth_service
            .refresh_access_token(&login_response.refresh_token)
            .await;

        assert!(refresh_result.is_ok());
        let new_response = refresh_result.unwrap();
        assert!(!new_response.access_token.is_empty());
        assert_ne!(
            new_response.access_token, login_response.access_token,
            "New token should be different"
        );

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_token_expiration() {
        let (db, _auth_service) = setup_auth_service().await;

        // Create auth service with very short token expiry
        let mut config = AuthConfig::default();
        config.access_token_expiry = -1; // Negative = already expired
        let auth_service = AuthService::with_config(db.clone(), config);

        let (email, username, password, display_name) = create_test_user_data();

        // Register and login
        let _user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        let login_request = LoginRequest {
            email: email.clone(),
            password: password.clone(),
        };
        let response = auth_service.login(login_request).await.unwrap();

        // Token should be immediately expired
        let verify_result = auth_service.verify_token(&response.access_token).await;
        assert!(verify_result.is_err());
        let error = verify_result.unwrap_err();
        assert!(error.to_string().contains("Token expired"));

        cleanup_users(&db).await;
    }

    // ========================================================================
    // PASSWORD OPERATIONS
    // ========================================================================

    #[tokio::test]
    async fn test_password_hashing() {
        let (_db, auth_service) = setup_auth_service().await;

        let password = "MySecurePassword123!";
        let hash_result = auth_service.hash_password(password);

        assert!(hash_result.is_ok());
        let hash = hash_result.unwrap();
        assert!(!hash.is_empty());
        assert_ne!(hash, password, "Hash should not equal plaintext");
    }

    #[tokio::test]
    async fn test_password_verification() {
        let (_db, auth_service) = setup_auth_service().await;

        let password = "MySecurePassword123!";
        let hash = auth_service.hash_password(password).unwrap();

        let verify_result = auth_service.verify_password(password, &hash);
        assert!(verify_result.is_ok());
        assert!(verify_result.unwrap(), "Password should match hash");

        let wrong_verify = auth_service.verify_password("WrongPassword", &hash);
        assert!(wrong_verify.is_ok());
        assert!(
            !wrong_verify.unwrap(),
            "Wrong password should not match hash"
        );
    }

    #[tokio::test]
    async fn test_change_password() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user
        let user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        let user_id = user.id.as_ref().unwrap().id.to_string();
        let new_password = "NewSecurePassword456!";

        // Change password
        let change_result = auth_service
            .change_password(&user_id, &password, new_password)
            .await;
        assert!(change_result.is_ok());

        // Try logging in with old password (should fail)
        let old_login = LoginRequest {
            email: email.clone(),
            password: password.clone(),
        };
        let old_result = auth_service.login(old_login).await;
        assert!(old_result.is_err());

        // Login with new password (should succeed)
        let new_login = LoginRequest {
            email: email.clone(),
            password: new_password.to_string(),
        };
        let new_result = auth_service.login(new_login).await;
        assert!(new_result.is_ok());

        cleanup_users(&db).await;
    }

    // ========================================================================
    // ACCOUNT LOCKOUT TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_account_lockout_after_failed_attempts() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user
        let _user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        // Attempt multiple failed logins
        let max_attempts = auth_service.config.max_login_attempts;
        for _i in 0..max_attempts {
            let login_request = LoginRequest {
                email: email.clone(),
                password: "WrongPassword".to_string(),
            };
            let _ = auth_service.login(login_request).await;
        }

        // Next attempt should be blocked due to lockout
        let login_request = LoginRequest {
            email: email.clone(),
            password: password.clone(), // Even with correct password
        };
        let result = auth_service.login(login_request).await;

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.to_string().contains("Account locked"));

        cleanup_users(&db).await;
    }

    // ========================================================================
    // RBAC TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_role_assignment() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user
        let user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        let user_id = user.id.as_ref().unwrap().id.to_string();

        // Create a test role
        let role_name = "test_agent";
        let role_result = auth_service
            .create_role(role_name, "Test Agent", "Test role for agents", vec![], false)
            .await;
        assert!(role_result.is_ok());

        let role = role_result.unwrap();
        let role_id = role.id.as_ref().unwrap().id.to_string();

        // Assign role to user
        let assign_result = auth_service.assign_role(&user_id, &role_id).await;
        assert!(assign_result.is_ok());

        // Verify role was assigned
        let user_profile = auth_service.get_user_profile(&user_id).await.unwrap();
        assert!(user_profile.roles.iter().any(|r| r.name == role_name));

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_permission_check() {
        let (db, auth_service) = setup_auth_service().await;
        let (email, username, password, display_name) = create_test_user_data();

        // Register user
        let user = auth_service
            .register_user(&email, &username, &password, &display_name, None)
            .await
            .unwrap();

        let user_id = user.id.as_ref().unwrap().id.to_string();

        // Create permission
        let permission_result = auth_service
            .create_permission("tickets:create", "Create tickets", "Allows creating tickets")
            .await;
        assert!(permission_result.is_ok());

        let permission = permission_result.unwrap();
        let permission_id = permission.id.as_ref().unwrap().id.to_string();

        // Create role with permission
        let role_result = auth_service
            .create_role(
                "test_agent_with_perm",
                "Test Agent",
                "Test role",
                vec![permission_id.clone()],
                false,
            )
            .await;
        assert!(role_result.is_ok());

        let role = role_result.unwrap();
        let role_id = role.id.as_ref().unwrap().id.to_string();

        // Assign role to user
        let _assign = auth_service.assign_role(&user_id, &role_id).await;

        // Check permission
        let has_permission = auth_service
            .check_permission(&user_id, "tickets:create")
            .await
            .unwrap();
        assert!(has_permission, "User should have tickets:create permission");

        let no_permission = auth_service
            .check_permission(&user_id, "tickets:delete")
            .await
            .unwrap();
        assert!(
            !no_permission,
            "User should not have tickets:delete permission"
        );

        cleanup_users(&db).await;
    }

    #[tokio::test]
    async fn test_system_roles_initialization() {
        let (db, auth_service) = setup_auth_service().await;

        // Initialize system roles
        let result = auth_service.initialize_system_roles().await;
        assert!(result.is_ok());

        // Verify all system roles exist
        let roles: Vec<Role> = db.select("roles").await.unwrap();

        let role_names: Vec<String> = roles.iter().map(|r| r.name.clone()).collect();

        assert!(role_names.contains(&"super_admin".to_string()));
        assert!(role_names.contains(&"admin".to_string()));
        assert!(role_names.contains(&"agent".to_string()));
        assert!(role_names.contains(&"viewer".to_string()));
    }
}
