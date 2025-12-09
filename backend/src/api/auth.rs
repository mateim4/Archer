// Archer ITSM - Authentication API (Phase 0)
// REST endpoints for login, logout, token refresh, and user profile

use axum::{
    extract::{ConnectInfo, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use std::sync::Arc;

use crate::database::Database;
use crate::models::auth::{
    ChangePasswordRequest, CreateUserRequest, LoginRequest, LoginResponse,
    RefreshTokenRequest, RefreshTokenResponse, UpdateUserRequest, UserProfile,
};
use crate::services::auth_service::{AuthError, AuthService};

/// Create Auth API router
pub fn create_auth_router(db: Arc<Database>) -> Router {
    let auth_service = Arc::new(AuthService::new(db.clone()));

    Router::new()
        // Public routes (no auth required)
        .route("/login", post(login))
        .route("/refresh", post(refresh_token))
        .route("/logout", post(logout))
        // Protected routes will use middleware (added in next step)
        .route("/me", get(get_current_user))
        .route("/users", post(create_user))
        .route("/users/:id", get(get_user))
        .with_state(auth_service)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Extract IP address from request
fn get_ip_address(headers: &HeaderMap, addr: Option<&SocketAddr>) -> Option<String> {
    // Check X-Forwarded-For header first (for proxied requests)
    if let Some(forwarded) = headers.get("x-forwarded-for") {
        if let Ok(s) = forwarded.to_str() {
            return Some(s.split(',').next().unwrap_or(s).trim().to_string());
        }
    }

    // Check X-Real-IP header
    if let Some(real_ip) = headers.get("x-real-ip") {
        if let Ok(s) = real_ip.to_str() {
            return Some(s.to_string());
        }
    }

    // Fall back to connection address
    addr.map(|a| a.ip().to_string())
}

/// Extract user agent from request
fn get_user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::USER_AGENT)
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
}

/// Convert AuthError to HTTP response
fn auth_error_response(error: AuthError) -> impl IntoResponse {
    let (status, message) = match &error {
        AuthError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid email or password"),
        AuthError::AccountLocked(_) => (StatusCode::FORBIDDEN, "Account is locked"),
        AuthError::AccountInactive => (StatusCode::FORBIDDEN, "Account is inactive"),
        AuthError::AccountPendingVerification => (StatusCode::FORBIDDEN, "Account pending verification"),
        AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
        AuthError::TokenExpired => (StatusCode::UNAUTHORIZED, "Token expired"),
        AuthError::TokenRevoked => (StatusCode::UNAUTHORIZED, "Token has been revoked"),
        AuthError::UserNotFound => (StatusCode::NOT_FOUND, "User not found"),
        AuthError::EmailExists => (StatusCode::CONFLICT, "Email already exists"),
        AuthError::UsernameExists => (StatusCode::CONFLICT, "Username already exists"),
        AuthError::WeakPassword => (StatusCode::BAD_REQUEST, "Password does not meet requirements"),
        AuthError::CurrentPasswordIncorrect => (StatusCode::BAD_REQUEST, "Current password is incorrect"),
        AuthError::PermissionDenied => (StatusCode::FORBIDDEN, "Permission denied"),
        AuthError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
        AuthError::InternalError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
    };

    let body = serde_json::json!({
        "error": message,
        "code": status.as_u16(),
        "details": error.to_string()
    });

    (status, Json(body))
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/// POST /api/v1/auth/login
/// 
/// Authenticate user with email/password and return JWT tokens
async fn login(
    State(auth_service): State<Arc<AuthService>>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let ip_address = get_ip_address(&headers, Some(&addr));
    let user_agent = get_user_agent(&headers);

    match auth_service.login(payload, ip_address, user_agent).await {
        Ok(response) => {
            let body = serde_json::json!({
                "success": true,
                "data": response
            });
            (StatusCode::OK, Json(body)).into_response()
        }
        Err(e) => auth_error_response(e).into_response(),
    }
}

/// POST /api/v1/auth/refresh
/// 
/// Refresh access token using refresh token
async fn refresh_token(
    State(auth_service): State<Arc<AuthService>>,
    Json(payload): Json<RefreshTokenRequest>,
) -> impl IntoResponse {
    match auth_service.refresh_token(payload).await {
        Ok(response) => {
            let body = serde_json::json!({
                "success": true,
                "data": response
            });
            (StatusCode::OK, Json(body)).into_response()
        }
        Err(e) => auth_error_response(e).into_response(),
    }
}

/// POST /api/v1/auth/logout
/// 
/// Logout user and revoke refresh token
async fn logout(
    State(auth_service): State<Arc<AuthService>>,
    Json(payload): Json<RefreshTokenRequest>,
) -> impl IntoResponse {
    // Note: In production, we'd extract user info from the access token
    match auth_service.logout(&payload.refresh_token, None, None).await {
        Ok(_) => {
            let body = serde_json::json!({
                "success": true,
                "message": "Logged out successfully"
            });
            (StatusCode::OK, Json(body)).into_response()
        }
        Err(e) => auth_error_response(e).into_response(),
    }
}

/// GET /api/v1/auth/me
/// 
/// Get current user's profile (requires authentication)
/// Note: This endpoint will be protected by JWT middleware
async fn get_current_user(
    State(auth_service): State<Arc<AuthService>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    // Extract user ID from Authorization header (JWT)
    // In production, the JWT middleware will do this and attach user to request extensions
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(t) => t,
        None => {
            return auth_error_response(AuthError::InvalidToken).into_response();
        }
    };

    // Validate token and extract claims
    let claims = match auth_service.validate_access_token(token) {
        Ok(c) => c,
        Err(e) => return auth_error_response(e).into_response(),
    };

    // Get user profile
    match auth_service.get_user_profile(&claims.sub).await {
        Ok(profile) => {
            let body = serde_json::json!({
                "success": true,
                "data": profile
            });
            (StatusCode::OK, Json(body)).into_response()
        }
        Err(e) => auth_error_response(e).into_response(),
    }
}

/// POST /api/v1/auth/users
/// 
/// Create a new user (admin only)
async fn create_user(
    State(auth_service): State<Arc<AuthService>>,
    headers: HeaderMap,
    Json(payload): Json<CreateUserRequest>,
) -> impl IntoResponse {
    // Extract and validate token (simplified - should use middleware)
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(t) => t,
        None => {
            return auth_error_response(AuthError::InvalidToken).into_response();
        }
    };

    let claims = match auth_service.validate_access_token(token) {
        Ok(c) => c,
        Err(e) => return auth_error_response(e).into_response(),
    };

    // Check admin permission
    match auth_service.has_permission(&claims.sub, "users:create").await {
        Ok(true) => {}
        Ok(false) => return auth_error_response(AuthError::PermissionDenied).into_response(),
        Err(e) => return auth_error_response(e).into_response(),
    }

    // Create user
    match auth_service
        .create_user(
            payload.email,
            payload.username,
            payload.password,
            payload.display_name,
            payload.roles,
            Some(claims.username),
        )
        .await
    {
        Ok(user) => {
            let body = serde_json::json!({
                "success": true,
                "data": {
                    "id": user.id.map(|t| t.to_string()),
                    "email": user.email,
                    "username": user.username,
                    "display_name": user.display_name,
                    "status": user.status,
                    "created_at": user.created_at
                }
            });
            (StatusCode::CREATED, Json(body)).into_response()
        }
        Err(e) => auth_error_response(e).into_response(),
    }
}

/// GET /api/v1/auth/users/:id
/// 
/// Get user by ID (requires users:read permission)
async fn get_user(
    State(auth_service): State<Arc<AuthService>>,
    headers: HeaderMap,
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    // Extract and validate token
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(t) => t,
        None => {
            return auth_error_response(AuthError::InvalidToken).into_response();
        }
    };

    let claims = match auth_service.validate_access_token(token) {
        Ok(c) => c,
        Err(e) => return auth_error_response(e).into_response(),
    };

    // Check permission (allow reading own profile)
    if claims.sub != user_id {
        match auth_service.has_permission(&claims.sub, "users:read").await {
            Ok(true) => {}
            Ok(false) => return auth_error_response(AuthError::PermissionDenied).into_response(),
            Err(e) => return auth_error_response(e).into_response(),
        }
    }

    // Get user profile
    let full_id = if user_id.contains(':') {
        user_id
    } else {
        format!("users:{}", user_id)
    };

    match auth_service.get_user_profile(&full_id).await {
        Ok(profile) => {
            let body = serde_json::json!({
                "success": true,
                "data": profile
            });
            (StatusCode::OK, Json(body)).into_response()
        }
        Err(e) => auth_error_response(e).into_response(),
    }
}
