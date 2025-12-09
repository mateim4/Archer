// Archer ITSM - Authentication Service (Phase 0)
// Handles login, logout, token refresh, password management

use crate::database::Database;
use crate::models::auth::{
    AuditEventType, AuditLog, JwtClaims, LoginRequest, LoginResponse, Permission,
    RefreshToken, RefreshTokenRequest, RefreshTokenResponse, Role, RoleInfo, User,
    UserProfile, UserStatus,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde_json::json;
use std::collections::HashSet;
use std::sync::Arc;
use surrealdb::sql::Thing;
use thiserror::Error;
use uuid::Uuid;

// ============================================================================
// ERROR TYPES
// ============================================================================

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Account locked until {0}")]
    AccountLocked(String),

    #[error("Account is inactive")]
    AccountInactive,

    #[error("Account pending verification")]
    AccountPendingVerification,

    #[error("Invalid token")]
    InvalidToken,

    #[error("Token expired")]
    TokenExpired,

    #[error("Token revoked")]
    TokenRevoked,

    #[error("User not found")]
    UserNotFound,

    #[error("Email already exists")]
    EmailExists,

    #[error("Username already exists")]
    UsernameExists,

    #[error("Password too weak")]
    WeakPassword,

    #[error("Current password incorrect")]
    CurrentPasswordIncorrect,

    #[error("Permission denied")]
    PermissionDenied,

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Internal error: {0}")]
    InternalError(String),
}

// ============================================================================
// AUTH CONFIGURATION
// ============================================================================

/// Authentication configuration (should come from environment in production)
#[derive(Debug, Clone)]
pub struct AuthConfig {
    /// JWT secret key (should be from env in production!)
    pub jwt_secret: String,
    /// Access token expiration in seconds (default: 15 minutes)
    pub access_token_expiry: i64,
    /// Refresh token expiration in seconds (default: 7 days)
    pub refresh_token_expiry: i64,
    /// Maximum failed login attempts before lockout
    pub max_login_attempts: i32,
    /// Account lockout duration in seconds (default: 15 minutes)
    pub lockout_duration: i64,
    /// Minimum password length
    pub min_password_length: usize,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            // In production, this MUST come from environment variable!
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "archer-dev-secret-change-in-production-32chars!".to_string()),
            access_token_expiry: 900,       // 15 minutes
            refresh_token_expiry: 604800,   // 7 days
            max_login_attempts: 5,
            lockout_duration: 900,          // 15 minutes
            min_password_length: 8,
        }
    }
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

/// Authentication service handles all auth operations
pub struct AuthService {
    db: Arc<Database>,
    config: AuthConfig,
}

impl AuthService {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            config: AuthConfig::default(),
        }
    }

    pub fn with_config(db: Arc<Database>, config: AuthConfig) -> Self {
        Self { db, config }
    }

    // ========================================================================
    // PASSWORD OPERATIONS
    // ========================================================================

    /// Hash a password using Argon2
    pub fn hash_password(&self, password: &str) -> Result<String, AuthError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|e| AuthError::InternalError(format!("Password hashing failed: {}", e)))
    }

    /// Verify a password against a hash
    pub fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AuthError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AuthError::InternalError(format!("Invalid hash format: {}", e)))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// Validate password strength
    pub fn validate_password(&self, password: &str) -> Result<(), AuthError> {
        if password.len() < self.config.min_password_length {
            return Err(AuthError::WeakPassword);
        }

        // Check for at least one uppercase, lowercase, number
        let has_upper = password.chars().any(|c| c.is_uppercase());
        let has_lower = password.chars().any(|c| c.is_lowercase());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());

        if !has_upper || !has_lower || !has_digit {
            return Err(AuthError::WeakPassword);
        }

        Ok(())
    }

    // ========================================================================
    // JWT OPERATIONS
    // ========================================================================

    /// Generate access token
    pub fn generate_access_token(&self, user: &User, roles: &[Role]) -> Result<String, AuthError> {
        let now = Utc::now();
        let exp = now + Duration::seconds(self.config.access_token_expiry);

        // Collect all permission names from roles
        let mut permissions: HashSet<String> = HashSet::new();
        for role in roles {
            // In real implementation, we'd fetch permissions from DB
            // For now, we'll store permission IDs and resolve them
            for perm_thing in &role.permissions {
                permissions.insert(perm_thing.to_string());
            }
        }

        let claims = JwtClaims {
            sub: user.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
            email: user.email.clone(),
            username: user.username.clone(),
            roles: roles.iter().map(|r| r.name.clone()).collect(),
            permissions: permissions.into_iter().collect(),
            tenant_id: user.tenant_id.as_ref().map(|t| t.to_string()),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            jti: Uuid::new_v4().to_string(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.config.jwt_secret.as_bytes()),
        )
        .map_err(|e| AuthError::InternalError(format!("Token generation failed: {}", e)))
    }

    /// Validate and decode access token
    pub fn validate_access_token(&self, token: &str) -> Result<JwtClaims, AuthError> {
        let validation = Validation::default();

        let token_data: TokenData<JwtClaims> = decode(
            token,
            &DecodingKey::from_secret(self.config.jwt_secret.as_bytes()),
            &validation,
        )
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AuthError::TokenExpired,
            _ => AuthError::InvalidToken,
        })?;

        Ok(token_data.claims)
    }

    /// Generate refresh token (random string, stored hashed in DB)
    pub fn generate_refresh_token(&self) -> String {
        Uuid::new_v4().to_string()
    }

    // ========================================================================
    // LOGIN / LOGOUT
    // ========================================================================

    /// Authenticate user and return tokens
    pub async fn login(
        &self,
        request: LoginRequest,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> Result<LoginResponse, AuthError> {
        // Find user by email
        let user = self.find_user_by_email(&request.email).await?;

        // Check if account is locked
        if user.is_locked() {
            let locked_msg = user
                .locked_until
                .map(|t| t.to_rfc3339())
                .unwrap_or_else(|| "indefinitely".to_string());

            self.log_auth_event(
                AuditEventType::LoginFailed,
                user.id.clone(),
                Some(&user.username),
                false,
                Some(json!({"reason": "account_locked"})),
                ip_address.as_deref(),
                user_agent.as_deref(),
            )
            .await;

            return Err(AuthError::AccountLocked(locked_msg));
        }

        // Check account status
        match user.status {
            UserStatus::Inactive => {
                self.log_auth_event(
                    AuditEventType::LoginFailed,
                    user.id.clone(),
                    Some(&user.username),
                    false,
                    Some(json!({"reason": "account_inactive"})),
                    ip_address.as_deref(),
                    user_agent.as_deref(),
                )
                .await;
                return Err(AuthError::AccountInactive);
            }
            UserStatus::PendingVerification => {
                return Err(AuthError::AccountPendingVerification);
            }
            _ => {}
        }

        // Verify password
        let password_valid = self.verify_password(&request.password, &user.password_hash)?;

        if !password_valid {
            // Increment failed attempts
            self.increment_failed_login_attempts(&user).await;

            self.log_auth_event(
                AuditEventType::LoginFailed,
                user.id.clone(),
                Some(&user.username),
                false,
                Some(json!({"reason": "invalid_password"})),
                ip_address.as_deref(),
                user_agent.as_deref(),
            )
            .await;

            return Err(AuthError::InvalidCredentials);
        }

        // Fetch user's roles
        let roles = self.fetch_user_roles(&user).await?;

        // Generate tokens
        let access_token = self.generate_access_token(&user, &roles)?;
        let refresh_token = self.generate_refresh_token();

        // Store refresh token
        self.store_refresh_token(&user, &refresh_token, ip_address.as_deref(), user_agent.as_deref())
            .await?;

        // Reset failed attempts and update last login
        self.reset_login_tracking(&user).await;

        // Log successful login
        self.log_auth_event(
            AuditEventType::Login,
            user.id.clone(),
            Some(&user.username),
            true,
            None,
            ip_address.as_deref(),
            user_agent.as_deref(),
        )
        .await;

        // Build user profile
        let permissions = self.get_user_permissions(&roles).await;
        let role_infos: Vec<RoleInfo> = roles.iter().map(|r| r.to_role_info()).collect();
        let profile = user.to_profile(role_infos, permissions);

        Ok(LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: self.config.access_token_expiry,
            user: profile,
        })
    }

    /// Refresh access token using refresh token
    pub async fn refresh_token(
        &self,
        request: RefreshTokenRequest,
    ) -> Result<RefreshTokenResponse, AuthError> {
        // Find and validate refresh token
        let stored_token = self.find_refresh_token(&request.refresh_token).await?;

        if stored_token.revoked {
            return Err(AuthError::TokenRevoked);
        }

        if stored_token.expires_at < Utc::now() {
            return Err(AuthError::TokenExpired);
        }

        // Fetch user
        let user_id = stored_token.user_id.to_string();
        let user = self.find_user_by_id(&user_id).await?;

        // Fetch roles and generate new access token
        let roles = self.fetch_user_roles(&user).await?;
        let access_token = self.generate_access_token(&user, &roles)?;

        // Log token refresh
        self.log_auth_event(
            AuditEventType::TokenRefresh,
            user.id.clone(),
            Some(&user.username),
            true,
            None,
            None,
            None,
        )
        .await;

        Ok(RefreshTokenResponse {
            access_token,
            expires_in: self.config.access_token_expiry,
        })
    }

    /// Logout - revoke refresh token
    pub async fn logout(
        &self,
        refresh_token: &str,
        user_id: Option<Thing>,
        username: Option<&str>,
    ) -> Result<(), AuthError> {
        self.revoke_refresh_token(refresh_token).await?;

        self.log_auth_event(
            AuditEventType::Logout,
            user_id,
            username,
            true,
            None,
            None,
            None,
        )
        .await;

        Ok(())
    }

    // ========================================================================
    // USER OPERATIONS
    // ========================================================================

    /// Find user by email
    async fn find_user_by_email(&self, email: &str) -> Result<User, AuthError> {
        let query = format!(
            r#"SELECT * FROM users WHERE email = '{}' LIMIT 1"#,
            email.replace('\'', "''")  // Basic SQL injection prevention
        );

        let mut result = self
            .db
            .query(&query)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let users: Vec<User> = result
            .take(0)
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        users.into_iter().next().ok_or(AuthError::InvalidCredentials)
    }

    /// Find user by ID
    async fn find_user_by_id(&self, id: &str) -> Result<User, AuthError> {
        let thing: Thing = id
            .parse()
            .map_err(|_| AuthError::DatabaseError("Invalid user ID format".to_string()))?;

        let user: Option<User> = self
            .db
            .select(thing)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        user.ok_or(AuthError::UserNotFound)
    }

    /// Fetch user's roles
    async fn fetch_user_roles(&self, user: &User) -> Result<Vec<Role>, AuthError> {
        let mut roles = Vec::new();

        for role_thing in &user.roles {
            let role: Option<Role> = self
                .db
                .select(role_thing.clone())
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

            if let Some(r) = role {
                roles.push(r);
            }
        }

        Ok(roles)
    }

    /// Get all permissions for a set of roles
    async fn get_user_permissions(&self, roles: &[Role]) -> HashSet<String> {
        let mut permissions = HashSet::new();

        for role in roles {
            for perm_thing in &role.permissions {
                // Fetch permission and add its name
                if let Ok(Some(perm)) = self.db.select::<Option<Permission>>(perm_thing.clone()).await {
                    permissions.insert(perm.name);
                }
            }
        }

        permissions
    }

    /// Increment failed login attempts
    async fn increment_failed_login_attempts(&self, user: &User) {
        let new_attempts = user.failed_login_attempts + 1;
        let locked_until = if new_attempts >= self.config.max_login_attempts {
            Some(Utc::now() + Duration::seconds(self.config.lockout_duration))
        } else {
            None
        };

        let user_id = user.id.as_ref().map(|t| t.to_string()).unwrap_or_default();

        let query = if let Some(lock_time) = locked_until {
            format!(
                r#"UPDATE {} SET 
                    failed_login_attempts = {},
                    locked_until = '{}',
                    status = 'LOCKED',
                    updated_at = time::now()"#,
                user_id,
                new_attempts,
                lock_time.to_rfc3339()
            )
        } else {
            format!(
                r#"UPDATE {} SET 
                    failed_login_attempts = {},
                    updated_at = time::now()"#,
                user_id, new_attempts
            )
        };

        let _ = self.db.query(&query).await;
    }

    /// Reset login tracking after successful login
    async fn reset_login_tracking(&self, user: &User) {
        let user_id = user.id.as_ref().map(|t| t.to_string()).unwrap_or_default();

        let query = format!(
            r#"UPDATE {} SET 
                failed_login_attempts = 0,
                locked_until = NONE,
                last_login = time::now(),
                updated_at = time::now()"#,
            user_id
        );

        let _ = self.db.query(&query).await;
    }

    // ========================================================================
    // REFRESH TOKEN OPERATIONS
    // ========================================================================

    /// Store refresh token (hashed)
    async fn store_refresh_token(
        &self,
        user: &User,
        token: &str,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> Result<(), AuthError> {
        let token_hash = self.hash_token(token);
        let expires_at = Utc::now() + Duration::seconds(self.config.refresh_token_expiry);

        let refresh_token = RefreshToken {
            id: None,
            token_hash,
            user_id: user.id.clone().ok_or(AuthError::InternalError("User has no ID".to_string()))?,
            expires_at,
            revoked: false,
            revoked_at: None,
            created_at: Utc::now(),
            user_agent: user_agent.map(|s| s.to_string()),
            ip_address: ip_address.map(|s| s.to_string()),
        };

        let _: Vec<RefreshToken> = self
            .db
            .create("refresh_tokens")
            .content(refresh_token)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    /// Find refresh token by value
    async fn find_refresh_token(&self, token: &str) -> Result<RefreshToken, AuthError> {
        let token_hash = self.hash_token(token);

        let query = format!(
            r#"SELECT * FROM refresh_tokens WHERE token_hash = '{}' LIMIT 1"#,
            token_hash
        );

        let mut result = self
            .db
            .query(&query)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        let tokens: Vec<RefreshToken> = result
            .take(0)
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        tokens.into_iter().next().ok_or(AuthError::InvalidToken)
    }

    /// Revoke refresh token
    async fn revoke_refresh_token(&self, token: &str) -> Result<(), AuthError> {
        let token_hash = self.hash_token(token);

        let query = format!(
            r#"UPDATE refresh_tokens SET 
                revoked = true,
                revoked_at = time::now()
            WHERE token_hash = '{}'"#,
            token_hash
        );

        self.db
            .query(&query)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        Ok(())
    }

    /// Hash a token for storage
    fn hash_token(&self, token: &str) -> String {
        // Use simple hashing for refresh token storage
        // In production, consider using a proper cryptographic hash
        format!("{:x}", md5::compute(token.as_bytes()))
    }

    // ========================================================================
    // AUDIT LOGGING
    // ========================================================================

    /// Log an authentication event
    async fn log_auth_event(
        &self,
        event_type: AuditEventType,
        user_id: Option<Thing>,
        username: Option<&str>,
        success: bool,
        details: Option<serde_json::Value>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) {
        let log = AuditLog {
            id: None,
            event_type,
            user_id,
            username: username.map(|s| s.to_string()),
            resource_type: None,
            resource_id: None,
            action: "auth".to_string(),
            details,
            ip_address: ip_address.map(|s| s.to_string()),
            user_agent: user_agent.map(|s| s.to_string()),
            success,
            error_message: None,
            tenant_id: None,
            created_at: Utc::now(),
        };

        let _: Result<Vec<AuditLog>, _> = self.db.create("audit_logs").content(log).await;
    }

    // ========================================================================
    // USER MANAGEMENT (Admin Operations)
    // ========================================================================

    /// Create a new user (admin only)
    pub async fn create_user(
        &self,
        email: String,
        username: String,
        password: String,
        display_name: String,
        role_ids: Vec<String>,
        created_by: Option<String>,
    ) -> Result<User, AuthError> {
        // Validate password
        self.validate_password(&password)?;

        // Check if email already exists
        if self.find_user_by_email(&email).await.is_ok() {
            return Err(AuthError::EmailExists);
        }

        // Hash password
        let password_hash = self.hash_password(&password)?;

        // Parse role IDs to Things
        let roles: Vec<Thing> = role_ids
            .iter()
            .filter_map(|id| {
                if id.contains(':') {
                    id.parse().ok()
                } else {
                    format!("roles:{}", id).parse().ok()
                }
            })
            .collect();

        let mut user = User::new(email, username, password_hash, display_name);
        user.roles = roles;
        user.created_by = created_by;

        let created: Vec<User> = self
            .db
            .create("users")
            .content(user)
            .await
            .map_err(|e| AuthError::DatabaseError(e.to_string()))?;

        created
            .into_iter()
            .next()
            .ok_or(AuthError::InternalError("User creation returned no result".to_string()))
    }

    /// Get user profile by ID
    pub async fn get_user_profile(&self, user_id: &str) -> Result<UserProfile, AuthError> {
        let user = self.find_user_by_id(user_id).await?;
        let roles = self.fetch_user_roles(&user).await?;
        let permissions = self.get_user_permissions(&roles).await;
        let role_infos: Vec<RoleInfo> = roles.iter().map(|r| r.to_role_info()).collect();

        Ok(user.to_profile(role_infos, permissions))
    }

    /// Check if user has a specific permission
    pub async fn has_permission(&self, user_id: &str, permission: &str) -> Result<bool, AuthError> {
        let user = self.find_user_by_id(user_id).await?;
        let roles = self.fetch_user_roles(&user).await?;
        let permissions = self.get_user_permissions(&roles).await;

        // Check for exact match or manage permission
        Ok(permissions.contains(permission) || permissions.contains(&format!("{}:manage", permission.split(':').next().unwrap_or(""))))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_validation() {
        let config = AuthConfig::default();
        let service = AuthService {
            db: Arc::new(unsafe { std::mem::zeroed() }), // Don't actually use this!
            config,
        };

        // Too short
        assert!(service.validate_password("Ab1").is_err());

        // No uppercase
        assert!(service.validate_password("password123").is_err());

        // No lowercase
        assert!(service.validate_password("PASSWORD123").is_err());

        // No number
        assert!(service.validate_password("Passworddd").is_err());

        // Valid password
        assert!(service.validate_password("Password123").is_ok());
    }
}
