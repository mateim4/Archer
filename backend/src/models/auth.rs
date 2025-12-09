// Archer ITSM - Authentication & RBAC Models (Phase 0)
// Implements User, Role, Permission models for JWT-based auth

use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize};
use surrealdb::sql::Thing;
use std::collections::HashSet;

// ============================================================================
// USER MODELS
// ============================================================================

/// Custom deserializer for roles field that accepts both Vec<String> and Vec<Thing>
fn deserialize_roles<'de, D>(deserializer: D) -> Result<Vec<Thing>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;
    
    // Try to deserialize as Vec<serde_json::Value> first to inspect the data
    let value: serde_json::Value = serde_json::Value::deserialize(deserializer)?;
    
    match value {
        serde_json::Value::Array(arr) => {
            let mut roles = Vec::new();
            for item in arr {
                match item {
                    // If it's a string, convert it to a Thing reference (roles:role_name)
                    serde_json::Value::String(s) => {
                        let thing_str = if s.contains(':') {
                            s.clone()
                        } else {
                            format!("roles:{}", s)
                        };
                        roles.push(thing_str.parse().map_err(|_| {
                            Error::custom(format!("Failed to parse role string '{}' as Thing", thing_str))
                        })?);
                    }
                    // If it's already an object (Thing), try to deserialize it
                    _ => {
                        let thing: Thing = serde_json::from_value(item).map_err(|e| {
                            Error::custom(format!("Failed to deserialize role as Thing: {}", e))
                        })?;
                        roles.push(thing);
                    }
                }
            }
            Ok(roles)
        }
        _ => Err(Error::custom("Expected array for roles field")),
    }
}

/// Core user entity for authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Option<Thing>,
    pub email: String,
    pub username: String,
    pub password_hash: String,
    pub display_name: String,
    pub status: UserStatus,
    #[serde(deserialize_with = "deserialize_roles")]
    pub roles: Vec<Thing>,        // References to Role records (accepts strings or Things)
    pub tenant_id: Option<Thing>, // Multi-tenant isolation
    pub last_login: Option<DateTime<Utc>>,
    pub failed_login_attempts: i32,
    pub locked_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
}

/// User account status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserStatus {
    Active,
    Inactive,
    Locked,
    PendingVerification,
}

/// User profile information (safe to expose via API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub username: String,
    pub display_name: String,
    pub status: UserStatus,
    pub roles: Vec<RoleInfo>,
    pub permissions: HashSet<String>,
    pub last_login: Option<DateTime<Utc>>,
}

/// Minimal role info for profile responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
}

// ============================================================================
// ROLE MODELS
// ============================================================================

/// Role entity for RBAC
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: Option<Thing>,
    pub name: String,              // e.g., "admin", "agent", "viewer"
    pub display_name: String,      // e.g., "Administrator", "Service Desk Agent"
    pub description: Option<String>,
    pub permissions: Vec<Thing>,   // References to Permission records
    pub is_system: bool,           // System roles cannot be deleted
    pub tenant_id: Option<Thing>,  // null = global role, Some = tenant-specific
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Predefined system roles
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SystemRole {
    SuperAdmin,      // Full system access
    Admin,           // Tenant admin
    ServiceManager,  // Service desk manager
    Agent,           // Service desk agent
    Viewer,          // Read-only access
}

impl SystemRole {
    pub fn name(&self) -> &'static str {
        match self {
            SystemRole::SuperAdmin => "super_admin",
            SystemRole::Admin => "admin",
            SystemRole::ServiceManager => "service_manager",
            SystemRole::Agent => "agent",
            SystemRole::Viewer => "viewer",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            SystemRole::SuperAdmin => "Super Administrator",
            SystemRole::Admin => "Administrator",
            SystemRole::ServiceManager => "Service Manager",
            SystemRole::Agent => "Service Desk Agent",
            SystemRole::Viewer => "Viewer",
        }
    }
}

// ============================================================================
// PERMISSION MODELS
// ============================================================================

/// Permission entity for fine-grained access control
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: Option<Thing>,
    pub name: String,              // e.g., "tickets:create", "assets:delete"
    pub display_name: String,      // e.g., "Create Tickets"
    pub description: Option<String>,
    pub resource: String,          // e.g., "tickets", "assets", "users"
    pub action: PermissionAction,  // CRUD actions
    pub is_system: bool,           // System permissions cannot be deleted
    pub created_at: DateTime<Utc>,
}

/// Standard permission actions following CRUD pattern
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PermissionAction {
    Create,
    Read,
    Update,
    Delete,
    Manage,  // Full access to resource
    Execute, // For workflow/action permissions
}

/// Permission check request (used by RBAC middleware)
#[derive(Debug, Clone)]
pub struct PermissionCheck {
    pub resource: String,
    pub action: PermissionAction,
}

impl PermissionCheck {
    pub fn new(resource: &str, action: PermissionAction) -> Self {
        Self {
            resource: resource.to_string(),
            action,
        }
    }

    /// Create permission string like "tickets:create"
    pub fn to_permission_string(&self) -> String {
        let action_str = match self.action {
            PermissionAction::Create => "create",
            PermissionAction::Read => "read",
            PermissionAction::Update => "update",
            PermissionAction::Delete => "delete",
            PermissionAction::Manage => "manage",
            PermissionAction::Execute => "execute",
        };
        format!("{}:{}", self.resource, action_str)
    }
}

// ============================================================================
// JWT MODELS
// ============================================================================

/// JWT claims structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,           // User ID
    pub email: String,
    pub username: String,
    pub roles: Vec<String>,    // Role names for quick access
    pub permissions: Vec<String>, // Permission strings
    pub tenant_id: Option<String>,
    pub exp: i64,              // Expiration timestamp
    pub iat: i64,              // Issued at timestamp
    pub jti: String,           // JWT ID (for revocation)
}

/// Refresh token stored in database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshToken {
    pub id: Option<Thing>,
    pub token_hash: String,    // Hashed refresh token
    pub user_id: Thing,
    pub expires_at: DateTime<Utc>,
    pub revoked: bool,
    pub revoked_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub user_agent: Option<String>,
    pub ip_address: Option<String>,
}

// ============================================================================
// AUDIT LOG MODELS
// ============================================================================

/// Audit log entry for security events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: Option<Thing>,
    pub event_type: AuditEventType,
    pub user_id: Option<Thing>,
    pub username: Option<String>,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub action: String,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
    pub error_message: Option<String>,
    pub tenant_id: Option<Thing>,
    pub created_at: DateTime<Utc>,
}

/// Types of audit events
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuditEventType {
    // Auth events
    Login,
    LoginFailed,
    Logout,
    TokenRefresh,
    PasswordChange,
    PasswordReset,
    AccountLocked,
    AccountUnlocked,
    // CRUD events
    Create,
    Read,
    Update,
    Delete,
    // Permission events
    PermissionDenied,
    RoleAssigned,
    RoleRevoked,
    // System events
    SystemConfig,
    DataExport,
    DataImport,
}

// ============================================================================
// API REQUEST/RESPONSE MODELS
// ============================================================================

/// Login request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub remember_me: Option<bool>,
}

/// Login response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub user: UserProfile,
}

/// Refresh token request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

/// Refresh token response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub expires_in: i64,
}

/// Create user request (admin only)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
    pub display_name: String,
    pub roles: Vec<String>,  // Role IDs
}

/// Update user request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub display_name: Option<String>,
    pub status: Option<UserStatus>,
    pub roles: Option<Vec<String>>,
}

/// Change password request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Create role request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleRequest {
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub permissions: Vec<String>,  // Permission IDs
}

/// Update role request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRoleRequest {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub permissions: Option<Vec<String>>,
}

// ============================================================================
// HELPER IMPLEMENTATIONS
// ============================================================================

impl User {
    /// Create a new user with hashed password (hash should be generated by service)
    pub fn new(
        email: String,
        username: String,
        password_hash: String,
        display_name: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            email,
            username,
            password_hash,
            display_name,
            status: UserStatus::Active,
            roles: Vec::new(),
            tenant_id: None,
            last_login: None,
            failed_login_attempts: 0,
            locked_until: None,
            created_at: now,
            updated_at: now,
            created_by: None,
        }
    }

    /// Check if user account is locked
    pub fn is_locked(&self) -> bool {
        if self.status == UserStatus::Locked {
            return true;
        }
        if let Some(locked_until) = self.locked_until {
            return Utc::now() < locked_until;
        }
        false
    }

    /// Convert to UserProfile (safe for API responses)
    pub fn to_profile(&self, roles: Vec<RoleInfo>, permissions: HashSet<String>) -> UserProfile {
        UserProfile {
            id: self.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
            email: self.email.clone(),
            username: self.username.clone(),
            display_name: self.display_name.clone(),
            status: self.status.clone(),
            roles,
            permissions,
            last_login: self.last_login,
        }
    }
}

impl Role {
    pub fn new(name: String, display_name: String, is_system: bool) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            name,
            display_name,
            description: None,
            permissions: Vec::new(),
            is_system,
            tenant_id: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn to_role_info(&self) -> RoleInfo {
        RoleInfo {
            id: self.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
            name: self.name.clone(),
            display_name: self.display_name.clone(),
        }
    }
}

impl Permission {
    pub fn new(resource: String, action: PermissionAction) -> Self {
        let name = format!("{}:{:?}", resource, action).to_lowercase();
        let display_name = format!(
            "{} {}",
            match action {
                PermissionAction::Create => "Create",
                PermissionAction::Read => "Read",
                PermissionAction::Update => "Update",
                PermissionAction::Delete => "Delete",
                PermissionAction::Manage => "Manage",
                PermissionAction::Execute => "Execute",
            },
            resource
        );
        Self {
            id: None,
            name,
            display_name,
            description: None,
            resource,
            action,
            is_system: true,
            created_at: Utc::now(),
        }
    }
}

impl AuditLog {
    pub fn auth_event(
        event_type: AuditEventType,
        user_id: Option<Thing>,
        username: Option<String>,
        success: bool,
        details: Option<serde_json::Value>,
    ) -> Self {
        Self {
            id: None,
            event_type,
            user_id,
            username,
            resource_type: None,
            resource_id: None,
            action: "auth".to_string(),
            details,
            ip_address: None,
            user_agent: None,
            success,
            error_message: None,
            tenant_id: None,
            created_at: Utc::now(),
        }
    }

    pub fn resource_event(
        event_type: AuditEventType,
        user_id: Thing,
        username: String,
        resource_type: &str,
        resource_id: &str,
        action: &str,
        details: Option<serde_json::Value>,
    ) -> Self {
        Self {
            id: None,
            event_type,
            user_id: Some(user_id),
            username: Some(username),
            resource_type: Some(resource_type.to_string()),
            resource_id: Some(resource_id.to_string()),
            action: action.to_string(),
            details,
            ip_address: None,
            user_agent: None,
            success: true,
            error_message: None,
            tenant_id: None,
            created_at: Utc::now(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_string() {
        let check = PermissionCheck::new("tickets", PermissionAction::Create);
        assert_eq!(check.to_permission_string(), "tickets:create");
    }

    #[test]
    fn test_user_is_locked() {
        let mut user = User::new(
            "test@example.com".to_string(),
            "testuser".to_string(),
            "hash".to_string(),
            "Test User".to_string(),
        );
        assert!(!user.is_locked());

        user.status = UserStatus::Locked;
        assert!(user.is_locked());
    }

    #[test]
    fn test_system_role_names() {
        assert_eq!(SystemRole::SuperAdmin.name(), "super_admin");
        assert_eq!(SystemRole::Agent.display_name(), "Service Desk Agent");
    }
}
