// Archer ITSM - Authentication E2E Tests
// Tests the complete authentication flow including login, token refresh, and logout

use serde_json::json;
use std::sync::Arc;

// Test helper to create a test database connection
async fn setup_test_db() -> Arc<backend::database::Database> {
    // Create in-memory database for testing
    let db = backend::database::new_test()
        .await
        .expect("Failed to create test database");
    
    let db = Arc::new(db);
    
    // Run migrations to set up schema
    backend::database::migrations::AuthMigrations::run_all(&db)
        .await
        .expect("Failed to run auth migrations");
    
    db
}

#[tokio::test]
async fn test_admin_user_login_success() {
    use backend::services::auth_service::AuthService;
    use backend::models::auth::LoginRequest;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed admin user
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Test login with correct credentials
    let login_request = LoginRequest {
        email: "admin@archer.local".to_string(),
        password: "ArcherAdmin123!".to_string(),
        remember_me: Some(false),
    };
    
    let result = auth_service.login(login_request, None, None).await;
    
    // Assertions
    assert!(result.is_ok(), "Login should succeed with correct credentials");
    let response = result.unwrap();
    assert!(!response.access_token.is_empty(), "Should return access token");
    assert!(!response.refresh_token.is_empty(), "Should return refresh token");
    assert_eq!(response.user.email, "admin@archer.local");
    assert_eq!(response.user.username, "admin");
    assert!(response.user.roles.iter().any(|r| r.name == "super_admin"));
}

#[tokio::test]
async fn test_login_with_invalid_credentials() {
    use backend::services::auth_service::AuthService;
    use backend::models::auth::LoginRequest;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed admin user
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Test login with incorrect password
    let login_request = LoginRequest {
        email: "admin@archer.local".to_string(),
        password: "WrongPassword123!".to_string(),
        remember_me: Some(false),
    };
    
    let result = auth_service.login(login_request, None, None).await;
    
    // Assertions
    assert!(result.is_err(), "Login should fail with wrong password");
    match result.unwrap_err() {
        backend::services::auth_service::AuthError::InvalidCredentials => {
            // Expected error
        }
        other => panic!("Expected InvalidCredentials error, got {:?}", other),
    }
}

#[tokio::test]
async fn test_token_validation() {
    use backend::services::auth_service::AuthService;
    use backend::models::auth::LoginRequest;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed admin user
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Login to get a token
    let login_request = LoginRequest {
        email: "admin@archer.local".to_string(),
        password: "ArcherAdmin123!".to_string(),
        remember_me: Some(false),
    };
    
    let login_response = auth_service.login(login_request, None, None)
        .await
        .expect("Login should succeed");
    
    // Validate the access token
    let result = auth_service.verify_token(&login_response.access_token);
    
    // Assertions
    assert!(result.is_ok(), "Token validation should succeed");
    let claims = result.unwrap();
    assert_eq!(claims.email, "admin@archer.local");
    assert_eq!(claims.username, "admin");
    assert!(claims.roles.contains(&"super_admin".to_string()));
}

#[tokio::test]
async fn test_refresh_token_flow() {
    use backend::services::auth_service::AuthService;
    use backend::models::auth::{LoginRequest, RefreshTokenRequest};
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed admin user
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Login to get tokens
    let login_request = LoginRequest {
        email: "admin@archer.local".to_string(),
        password: "ArcherAdmin123!".to_string(),
        remember_me: Some(false),
    };
    
    let login_response = auth_service.login(login_request, None, None)
        .await
        .expect("Login should succeed");
    
    // Use refresh token to get new access token
    let refresh_request = RefreshTokenRequest {
        refresh_token: login_response.refresh_token.clone(),
    };
    
    let result = auth_service.refresh_token(refresh_request).await;
    
    // Assertions
    assert!(result.is_ok(), "Token refresh should succeed");
    let response = result.unwrap();
    assert!(!response.access_token.is_empty(), "Should return new access token");
    assert!(response.access_token != login_response.access_token, "New token should be different");
}

#[tokio::test]
async fn test_user_registration() {
    use backend::services::auth_service::AuthService;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed roles
    backend::database::migrations::AuthMigrations::seed_system_roles(&db)
        .await
        .expect("Failed to seed roles");
    
    // Register new user
    let result = auth_service.register_user(
        "newuser@test.com".to_string(),
        "testuser".to_string(),
        "TestPassword123!".to_string(),
        "Test User".to_string(),
    ).await;
    
    // Assertions
    assert!(result.is_ok(), "User registration should succeed");
    let user = result.unwrap();
    assert_eq!(user.email, "newuser@test.com");
    assert_eq!(user.username, "testuser");
    assert_eq!(user.display_name, "Test User");
}

#[tokio::test]
async fn test_duplicate_email_registration() {
    use backend::services::auth_service::AuthService;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed admin user first
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Try to register with existing email
    let result = auth_service.register_user(
        "admin@archer.local".to_string(),
        "admin2".to_string(),
        "TestPassword123!".to_string(),
        "Another Admin".to_string(),
    ).await;
    
    // Assertions
    assert!(result.is_err(), "Registration should fail with duplicate email");
    match result.unwrap_err() {
        backend::services::auth_service::AuthError::EmailExists => {
            // Expected error
        }
        other => panic!("Expected EmailExists error, got {:?}", other),
    }
}

#[tokio::test]
async fn test_weak_password_rejection() {
    use backend::services::auth_service::AuthService;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Try to register with weak password
    let result = auth_service.register_user(
        "newuser@test.com".to_string(),
        "testuser".to_string(),
        "weak".to_string(),  // Too weak
        "Test User".to_string(),
    ).await;
    
    // Assertions
    assert!(result.is_err(), "Registration should fail with weak password");
    match result.unwrap_err() {
        backend::services::auth_service::AuthError::WeakPassword => {
            // Expected error
        }
        other => panic!("Expected WeakPassword error, got {:?}", other),
    }
}

#[tokio::test]
async fn test_permission_checking() {
    use backend::services::auth_service::AuthService;
    use backend::models::auth::LoginRequest;
    
    // Setup
    let db = setup_test_db().await;
    let auth_service = AuthService::new(db.clone());
    
    // Seed admin user
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Login to get user ID
    let login_request = LoginRequest {
        email: "admin@archer.local".to_string(),
        password: "ArcherAdmin123!".to_string(),
        remember_me: Some(false),
    };
    
    let login_response = auth_service.login(login_request, None, None)
        .await
        .expect("Login should succeed");
    
    // Check if user has permission (super_admin should have all permissions)
    let result = auth_service.has_permission(&login_response.user.id, "tickets:create").await;
    
    // Assertions
    assert!(result.is_ok(), "Permission check should succeed");
    // Note: The actual permission result depends on how permissions are seeded
}
