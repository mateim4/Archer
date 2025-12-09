// Archer ITSM - JWT Authentication Middleware (Phase 0)
// Validates JWT tokens and extracts user claims for protected routes

use axum::{
    body::BoxBody,
    http::{header, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::sync::Arc;

use crate::models::auth::JwtClaims;

// ============================================================================
// AUTH STATE
// ============================================================================

/// Authentication configuration for middleware
#[derive(Clone)]
pub struct AuthState {
    pub jwt_secret: String,
}

impl AuthState {
    pub fn new() -> Self {
        Self {
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "archer-dev-secret-change-in-production-32chars!".to_string()),
        }
    }

    pub fn with_secret(jwt_secret: String) -> Self {
        Self { jwt_secret }
    }
}

impl Default for AuthState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// REQUEST EXTENSION
// ============================================================================

/// Extension type to attach authenticated user claims to request
#[derive(Clone, Debug)]
pub struct AuthenticatedUser {
    pub user_id: String,
    pub email: String,
    pub username: String,
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
    pub tenant_id: Option<String>,
}

impl From<JwtClaims> for AuthenticatedUser {
    fn from(claims: JwtClaims) -> Self {
        Self {
            user_id: claims.sub,
            email: claims.email,
            username: claims.username,
            roles: claims.roles,
            permissions: claims.permissions,
            tenant_id: claims.tenant_id,
        }
    }
}

impl AuthenticatedUser {
    /// Check if user has a specific permission
    pub fn has_permission(&self, permission: &str) -> bool {
        // Check exact permission
        if self.permissions.contains(&permission.to_string()) {
            return true;
        }

        // Check manage permission for the resource
        if let Some(resource) = permission.split(':').next() {
            let manage_perm = format!("{}:manage", resource);
            if self.permissions.contains(&manage_perm) {
                return true;
            }
        }

        // Super admin has all permissions
        if self.roles.contains(&"super_admin".to_string()) {
            return true;
        }

        false
    }

    /// Check if user has any of the specified roles
    pub fn has_role(&self, role: &str) -> bool {
        self.roles.contains(&role.to_string())
    }

    /// Check if user has any of the specified roles
    pub fn has_any_role(&self, roles: &[&str]) -> bool {
        roles.iter().any(|r| self.roles.contains(&r.to_string()))
    }
}

// ============================================================================
// JWT VALIDATION MIDDLEWARE
// ============================================================================

/// Middleware that validates JWT and attaches user claims to request
/// 
/// Usage in routes:
/// ```rust
/// let protected_routes = Router::new()
///     .route("/protected", get(handler))
///     .layer(middleware::from_fn_with_state(auth_state, require_auth));
/// ```
pub async fn require_auth<B>(
    axum::extract::State(auth_state): axum::extract::State<AuthState>,
    mut request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(t) => t,
        None => {
            return unauthorized_response("Missing or invalid Authorization header");
        }
    };

    // Validate JWT
    let validation = Validation::default();
    let token_data = match decode::<JwtClaims>(
        token,
        &DecodingKey::from_secret(auth_state.jwt_secret.as_bytes()),
        &validation,
    ) {
        Ok(data) => data,
        Err(e) => {
            let message = match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => "Token has expired",
                jsonwebtoken::errors::ErrorKind::InvalidToken => "Invalid token format",
                jsonwebtoken::errors::ErrorKind::InvalidSignature => "Invalid token signature",
                _ => "Token validation failed",
            };
            return unauthorized_response(message);
        }
    };

    // Attach authenticated user to request extensions
    let authenticated_user = AuthenticatedUser::from(token_data.claims);
    request.extensions_mut().insert(authenticated_user);

    next.run(request).await
}

/// Optional auth middleware - doesn't fail if no token, but attaches user if present
pub async fn optional_auth<B>(
    axum::extract::State(auth_state): axum::extract::State<AuthState>,
    mut request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    // Extract Authorization header
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    if let Some(token) = auth_header {
        // Validate JWT
        let validation = Validation::default();
        if let Ok(token_data) = decode::<JwtClaims>(
            token,
            &DecodingKey::from_secret(auth_state.jwt_secret.as_bytes()),
            &validation,
        ) {
            // Attach authenticated user to request extensions
            let authenticated_user = AuthenticatedUser::from(token_data.claims);
            request.extensions_mut().insert(authenticated_user);
        }
    }

    next.run(request).await
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn unauthorized_response(message: &str) -> Response {
    let body = serde_json::json!({
        "error": "Unauthorized",
        "message": message,
        "code": 401
    });

    (StatusCode::UNAUTHORIZED, Json(body)).into_response()
}

// ============================================================================
// EXTRACTOR FOR AUTHENTICATED USER
// ============================================================================

use axum::extract::FromRequestParts;
use axum::http::request::Parts;

/// Extractor to get authenticated user from request
/// 
/// Usage in handlers:
/// ```rust
/// async fn handler(user: AuthUser) -> impl IntoResponse {
///     format!("Hello, {}!", user.username)
/// }
/// ```
#[derive(Clone, Debug)]
pub struct AuthUser(pub AuthenticatedUser);

impl std::ops::Deref for AuthUser {
    type Target = AuthenticatedUser;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<serde_json::Value>);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthenticatedUser>()
            .cloned()
            .map(AuthUser)
            .ok_or_else(|| {
                let body = serde_json::json!({
                    "error": "Unauthorized",
                    "message": "Authentication required",
                    "code": 401
                });
                (StatusCode::UNAUTHORIZED, Json(body))
            })
    }
}

/// Optional user extractor - returns None if not authenticated
#[derive(Clone, Debug)]
pub struct OptionalAuthUser(pub Option<AuthenticatedUser>);

impl std::ops::Deref for OptionalAuthUser {
    type Target = Option<AuthenticatedUser>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for OptionalAuthUser
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        Ok(OptionalAuthUser(
            parts.extensions.get::<AuthenticatedUser>().cloned(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_has_permission() {
        let user = AuthenticatedUser {
            user_id: "user:123".to_string(),
            email: "test@example.com".to_string(),
            username: "testuser".to_string(),
            roles: vec!["agent".to_string()],
            permissions: vec![
                "tickets:create".to_string(),
                "tickets:read".to_string(),
                "assets:read".to_string(),
            ],
            tenant_id: None,
        };

        assert!(user.has_permission("tickets:create"));
        assert!(user.has_permission("tickets:read"));
        assert!(!user.has_permission("tickets:delete"));
        assert!(!user.has_permission("users:create"));
    }

    #[test]
    fn test_has_manage_permission() {
        let user = AuthenticatedUser {
            user_id: "user:123".to_string(),
            email: "admin@example.com".to_string(),
            username: "admin".to_string(),
            roles: vec!["admin".to_string()],
            permissions: vec!["tickets:manage".to_string()],
            tenant_id: None,
        };

        // Manage permission should grant all sub-permissions
        assert!(user.has_permission("tickets:create"));
        assert!(user.has_permission("tickets:read"));
        assert!(user.has_permission("tickets:update"));
        assert!(user.has_permission("tickets:delete"));
    }

    #[test]
    fn test_super_admin_has_all() {
        let user = AuthenticatedUser {
            user_id: "user:1".to_string(),
            email: "superadmin@example.com".to_string(),
            username: "superadmin".to_string(),
            roles: vec!["super_admin".to_string()],
            permissions: vec![], // Empty, but should still have all
            tenant_id: None,
        };

        assert!(user.has_permission("anything:anything"));
        assert!(user.has_permission("system:admin"));
    }
}
