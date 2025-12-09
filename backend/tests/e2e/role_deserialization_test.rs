// Archer ITSM - Role Deserialization Test
// Simple test to verify that User model can deserialize roles from string array

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
async fn test_user_roles_deserialize_from_strings() {
    use backend::models::auth::User;
    
    // Setup
    let db = setup_test_db().await;
    
    // Seed admin user with roles as string array (this is how it's stored now)
    backend::database::migrations::AuthMigrations::seed_admin_user(&db)
        .await
        .expect("Failed to seed admin user");
    
    // Query the user from database
    let query = "SELECT * FROM users WHERE email = 'admin@archer.local' LIMIT 1";
    let mut result = db.query(query).await.expect("Query should succeed");
    let users: Vec<User> = result.take(0).expect("Should deserialize users");
    
    // Assertions
    assert!(!users.is_empty(), "Should find the admin user");
    let user = &users[0];
    assert_eq!(user.email, "admin@archer.local");
    assert_eq!(user.username, "admin");
    assert!(!user.roles.is_empty(), "User should have roles");
    
    // Check that roles were deserialized correctly
    println!("✅ User roles deserialized successfully: {:?}", user.roles);
    println!("✅ Number of roles: {}", user.roles.len());
    
    // Verify the role is in the correct format
    for role in &user.roles {
        assert!(role.to_string().starts_with("roles:"), "Role should be a Thing reference");
        println!("  Role: {}", role);
    }
}

#[tokio::test]
async fn test_user_creation_with_role_references() {
    use backend::models::auth::User;
    use surrealdb::sql::Thing;
    use chrono::Utc;
    
    // Setup
    let db = setup_test_db().await;
    
    // Seed roles first
    backend::database::migrations::AuthMigrations::seed_system_roles_and_permissions(&db)
        .await
        .expect("Failed to seed roles");
    
    // Create a user with proper Thing role references
    let viewer_role: Thing = "roles:viewer".parse().expect("Should parse role Thing");
    let agent_role: Thing = "roles:agent".parse().expect("Should parse agent role Thing");
    
    let mut user = User {
        id: None,
        email: "testuser@test.com".to_string(),
        username: "testuser".to_string(),
        password_hash: "test_hash".to_string(),
        display_name: "Test User".to_string(),
        status: backend::models::auth::UserStatus::Active,
        roles: vec![viewer_role, agent_role],
        tenant_id: None,
        last_login: None,
        failed_login_attempts: 0,
        locked_until: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        created_by: None,
    };
    
    // Store the user
    let created: Vec<User> = db.create("users")
        .content(user)
        .await
        .expect("Should create user");
    
    assert!(!created.is_empty(), "User should be created");
    let created_user = &created[0];
    
    // Query it back
    let user_id = created_user.id.as_ref().unwrap().to_string();
    let query = format!("SELECT * FROM {} LIMIT 1", user_id);
    let mut result = db.query(&query).await.expect("Query should succeed");
    let queried_users: Vec<User> = result.take(0).expect("Should deserialize user");
    
    assert!(!queried_users.is_empty(), "Should find the user");
    let queried_user = &queried_users[0];
    
    // Verify roles are preserved
    assert_eq!(queried_user.roles.len(), 2, "Should have 2 roles");
    println!("✅ User created and queried with proper role references");
    for role in &queried_user.roles {
        println!("  Role: {}", role);
    }
}

#[tokio::test]
async fn test_mixed_role_formats() {
    use backend::models::auth::User;
    
    // Setup
    let db = setup_test_db().await;
    
    // Seed roles
    backend::database::migrations::AuthMigrations::seed_system_roles_and_permissions(&db)
        .await
        .expect("Failed to seed roles");
    
    // Create a user directly in database with string role array (old format)
    let query = r#"
        CREATE users:test_mixed SET
            email = 'mixed@test.com',
            username = 'mixed',
            password_hash = 'test',
            display_name = 'Mixed Format',
            status = 'ACTIVE',
            roles = ['super_admin', 'admin'],
            failed_login_attempts = 0,
            created_at = time::now(),
            updated_at = time::now()
    "#;
    
    db.query(query).await.expect("Should create user");
    
    // Query it back and verify deserialization works
    let query = "SELECT * FROM users:test_mixed";
    let mut result = db.query(query).await.expect("Query should succeed");
    let users: Vec<User> = result.take(0).expect("Should deserialize user");
    
    assert!(!users.is_empty(), "Should find the user");
    let user = &users[0];
    
    assert_eq!(user.roles.len(), 2, "Should have 2 roles");
    println!("✅ Roles deserialized from string array:");
    for role in &user.roles {
        println!("  Role: {}", role);
        // Should be converted to proper Thing references
        assert!(role.to_string().contains("roles:"));
    }
}
