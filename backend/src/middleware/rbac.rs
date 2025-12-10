// Archer ITSM - RBAC Middleware (Phase 0)
// Role-Based Access Control for protecting routes by permission

use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};

use super::auth::AuthenticatedUser;

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/// Middleware factory that requires a specific permission
/// 
/// Usage:
/// ```rust
/// Router::new()
///     .route("/tickets", post(create_ticket))
///     .layer(middleware::from_fn(|req, next| {
///         require_permission("tickets:create", req, next)
///     }));
/// ```
pub async fn require_permission<B>(
    permission: &'static str,
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    // Get authenticated user from extensions
    let user = match request.extensions().get::<AuthenticatedUser>() {
        Some(u) => u,
        None => {
            return unauthorized_response("Authentication required");
        }
    };

    // Check permission
    if !user.has_permission(permission) {
        return forbidden_response(&format!(
            "Permission '{}' required",
            permission
        ));
    }

    next.run(request).await
}

/// Middleware factory that requires any of the specified permissions
pub async fn require_any_permission<B>(
    permissions: &'static [&'static str],
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    let user = match request.extensions().get::<AuthenticatedUser>() {
        Some(u) => u,
        None => {
            return unauthorized_response("Authentication required");
        }
    };

    // Check if user has any of the permissions
    let has_any = permissions.iter().any(|p| user.has_permission(p));

    if !has_any {
        return forbidden_response(&format!(
            "One of these permissions required: {}",
            permissions.join(", ")
        ));
    }

    next.run(request).await
}

/// Middleware factory that requires all of the specified permissions
pub async fn require_all_permissions<B>(
    permissions: &'static [&'static str],
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    let user = match request.extensions().get::<AuthenticatedUser>() {
        Some(u) => u,
        None => {
            return unauthorized_response("Authentication required");
        }
    };

    // Check if user has all permissions
    let has_all = permissions.iter().all(|p| user.has_permission(p));

    if !has_all {
        let missing: Vec<&str> = permissions
            .iter()
            .filter(|p| !user.has_permission(p))
            .copied()
            .collect();
        return forbidden_response(&format!(
            "Missing required permissions: {}",
            missing.join(", ")
        ));
    }

    next.run(request).await
}

// ============================================================================
// ROLE CHECKS
// ============================================================================

/// Middleware factory that requires a specific role
pub async fn require_role<B>(
    role: &'static str,
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    let user = match request.extensions().get::<AuthenticatedUser>() {
        Some(u) => u,
        None => {
            return unauthorized_response("Authentication required");
        }
    };

    if !user.has_role(role) {
        return forbidden_response(&format!("Role '{}' required", role));
    }

    next.run(request).await
}

/// Middleware factory that requires any of the specified roles
pub async fn require_any_role<B>(
    roles: &'static [&'static str],
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    let user = match request.extensions().get::<AuthenticatedUser>() {
        Some(u) => u,
        None => {
            return unauthorized_response("Authentication required");
        }
    };

    if !user.has_any_role(roles) {
        return forbidden_response(&format!(
            "One of these roles required: {}",
            roles.join(", ")
        ));
    }

    next.run(request).await
}

/// Middleware that only allows super_admin or admin roles
pub async fn require_admin<B>(
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    require_any_role(&["super_admin", "admin"], request, next).await
}

/// Middleware that only allows super_admin role
pub async fn require_super_admin<B>(
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    require_role("super_admin", request, next).await
}

// ============================================================================
// HELPER MACROS FOR COMMON PERMISSION PATTERNS
// ============================================================================

/// Create a middleware layer that checks for a permission
/// 
/// Usage:
/// ```rust
/// use axum::middleware::from_fn;
/// 
/// let router = Router::new()
///     .route("/tickets", post(create_ticket))
///     .layer(from_fn(check_tickets_create));
/// ```
#[macro_export]
macro_rules! define_permission_check {
    ($name:ident, $permission:expr) => {
        pub async fn $name<B>(
            request: axum::http::Request<B>,
            next: axum::middleware::Next<B>,
        ) -> axum::response::Response
        where
            B: Send,
        {
            $crate::middleware::rbac::require_permission($permission, request, next).await
        }
    };
}

// Pre-defined permission check functions for common operations
// These can be used directly with `middleware::from_fn`

// Ticket permissions
pub async fn check_tickets_create<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("tickets:create", request, next).await
}

pub async fn check_tickets_read<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("tickets:read", request, next).await
}

pub async fn check_tickets_update<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("tickets:update", request, next).await
}

pub async fn check_tickets_delete<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("tickets:delete", request, next).await
}

pub async fn check_tickets_manage<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("tickets:manage", request, next).await
}

// Asset permissions
pub async fn check_assets_create<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("assets:create", request, next).await
}

pub async fn check_assets_read<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("assets:read", request, next).await
}

pub async fn check_assets_update<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("assets:update", request, next).await
}

pub async fn check_assets_delete<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("assets:delete", request, next).await
}

pub async fn check_assets_manage<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("assets:manage", request, next).await
}

// User permissions
pub async fn check_users_create<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("users:create", request, next).await
}

pub async fn check_users_read<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("users:read", request, next).await
}

pub async fn check_users_update<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("users:update", request, next).await
}

pub async fn check_users_delete<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("users:delete", request, next).await
}

pub async fn check_users_manage<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("users:manage", request, next).await
}

// System permissions
pub async fn check_system_admin<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("system:admin", request, next).await
}

pub async fn check_settings_manage<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("settings:manage", request, next).await
}

pub async fn check_audit_read<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("audit:read", request, next).await
}

// ============================================================================
// HELPER RESPONSES
// ============================================================================

fn unauthorized_response(message: &str) -> Response {
    let body = serde_json::json!({
        "error": "Unauthorized",
        "message": message,
        "code": 401
    });
    (StatusCode::UNAUTHORIZED, Json(body)).into_response()
}

fn forbidden_response(message: &str) -> Response {
    let body = serde_json::json!({
        "error": "Forbidden",
        "message": message,
        "code": 403
    });
    (StatusCode::FORBIDDEN, Json(body)).into_response()
}

// ============================================================================
// TENANT ISOLATION
// ============================================================================

/// Middleware that ensures user can only access resources in their tenant
/// This should be applied after authentication middleware
pub async fn enforce_tenant_isolation<B>(
    request: Request<B>,
    next: Next<B>,
) -> Response
where
    B: Send,
{
    let user = match request.extensions().get::<AuthenticatedUser>() {
        Some(u) => u,
        None => {
            return unauthorized_response("Authentication required");
        }
    };

    // Super admins can access all tenants
    if user.has_role("super_admin") {
        return next.run(request).await;
    }

    // For tenant-specific users, we'd extract tenant from URL or body
    // and compare with user's tenant_id
    // This is a placeholder - actual implementation depends on URL structure

    next.run(request).await
}

// Service Catalog permissions
pub async fn check_service_catalog_read<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("service_catalog:read", request, next).await
}

pub async fn check_catalog_admin<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_permission("catalog:admin", request, next).await
}

pub async fn check_admin<B>(request: Request<B>, next: Next<B>) -> Response
where
    B: Send,
{
    require_any_role(&["super_admin", "admin"], request, next).await
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Full middleware tests require setting up Axum test infrastructure
    // These are unit tests for the helper functions

    #[test]
    fn test_permission_names() {
        // Basic sanity test - these functions should compile
        let _ = check_tickets_create::<axum::body::Body>;
        let _ = check_tickets_read::<axum::body::Body>;
    }
}
