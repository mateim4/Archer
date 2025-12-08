# Archer ITSM - Base Platform Full-Stack Development Plan

**Document Version:** 1.1  
**Last Updated:** December 9, 2025  
**Status:** Detailed Implementation Specification  
**Classification:** Technical Development Guide

---

> ⚠️ **IMPORTANT: SurrealDB Syntax Note**
> 
> This document uses **pseudo-code notation** for database schemas to improve readability.
> The curly-brace object syntax shown (e.g., `DEFINE TABLE users SCHEMAFULL { id: string }`) 
> is **NOT valid SurrealDB syntax**.
> 
> **When implementing, translate to proper SurrealDB syntax:**
> ```sql
> -- Instead of: DEFINE TABLE users SCHEMAFULL { id: string, email: string }
> -- Use:
> DEFINE TABLE users SCHEMAFULL;
> DEFINE FIELD id ON users TYPE string;
> DEFINE FIELD email ON users TYPE string;
> ```
> 
> See `docs/planning/DELTA_TRACKING.md` for complete syntax reference.

---

## Executive Summary

This document provides detailed, sprint-ready specifications for implementing the Archer Core ITSM Platform. It builds on the Target Architecture and is organized into 6 implementation phases over 28 weeks.

**Key Sections:**
1. **Complete SurrealDB Schema** - All entities, relationships, constraints
2. **API Endpoint Specifications** - Every endpoint with request/response examples
3. **Frontend Implementation Details** - Component specs, hooks, state management
4. **Backend Implementation Details** - Rust/Axum patterns, middleware, handlers
5. **Security Implementation** - Auth, RBAC, encryption, audit logging
6. **Sprint Breakdown** - Week-by-week assignments and deliverables

---

## Phase 0: Foundation (Weeks 1-2)

### Objective
Establish secure authentication, RBAC framework, audit logging, and multi-tenant isolation.

### 0.1 SurrealDB Schema (Phase 0)

```sql
-- Enable SCHEMAFULL mode for type safety
DEFINE DATABASE archer CHANGEFEED 5s;

-- ============================================================================
-- NAMESPACES (Multi-tenancy)
-- ============================================================================
-- Each tenant has its own namespace to prevent cross-tenant data leakage
-- Example: namespace:tenant-abc, namespace:tenant-xyz

-- ============================================================================
-- USERS & RBAC FOUNDATION
-- ============================================================================

DEFINE TABLE users SCHEMAFULL
  PERMISSIONS 
    FOR select ALLOW $auth.namespace == meta(id).namespace
    FOR create ALLOW $auth.admin == true
    FOR update ALLOW $auth.id == id OR $auth.admin == true
    FOR delete ALLOW $auth.admin == true
{
  id: string,                        // UUID
  namespace: string,                 // Tenant isolation
  email: string,                     // Unique per namespace
  password_hash: string,             // bcrypt(12) output
  display_name: string,
  is_active: bool = true,
  last_login: datetime,
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
  deleted_at: datetime = NONE,       // Soft delete
  mfa_enabled: bool = false,
  
  // Computed field: What permissions does this user have?
  // (Set via trigger after role assignment)
}

CREATE INDEX idx_users_email ON TABLE users COLUMNS (namespace, email) UNIQUE;
CREATE INDEX idx_users_active ON TABLE users COLUMNS (is_active);

-- ============================================================================

DEFINE TABLE roles SCHEMAFULL
  PERMISSIONS 
    FOR select ALLOW true  // All users can see available roles
    FOR create, update, delete ALLOW $auth.admin == true
{
  id: string,                        // UUID
  namespace: string,
  name: string,                      // "incident_manager", "support_agent"
  description: string,
  is_system: bool = false,           // True = built-in, immutable
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

CREATE INDEX idx_roles_namespace_name ON TABLE roles COLUMNS (namespace, name) UNIQUE;

-- ============================================================================

DEFINE TABLE permissions SCHEMAFULL
  PERMISSIONS 
    FOR select ALLOW true
    FOR create, update, delete ALLOW $auth.admin == true
{
  id: string,                        // UUID
  namespace: string,
  action: string,                    // "create", "read", "update", "delete"
  resource: string,                  // "ticket", "asset", "user", "*"
  conditions: object = NONE,         // { "status": ["open"], "assigned_to": "$auth.id" }
  description: string,
  is_system: bool = false,           // Built-in permissions
  created_at: datetime = time::now(),
}

CREATE INDEX idx_permissions_action_resource ON TABLE permissions COLUMNS (action, resource);

-- ============================================================================

DEFINE TABLE teams SCHEMAFULL
  PERMISSIONS 
    FOR select ALLOW $auth.namespace == meta(id).namespace
    FOR create, update, delete ALLOW $auth.admin == true OR $auth.id IN members
{
  id: string,
  namespace: string,
  name: string,                      // "L1 Support", "Infrastructure"
  description: string,
  members: array<User>,              // User IDs (filled via relationship)
  parent_team: Team = NONE,
  queue_assignment: string = NONE,   // Default ticket routing
  escalation_group: bool = false,    // Can receive escalations
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

-- Relationships
DEFINE TABLE user_has_role
  SCHEMAFULL AS {
    in: User,
    out: Role,
    assigned_at: datetime = time::now(),
    assigned_by: User,
  }
  PERMISSIONS
    FOR select ALLOW $auth.namespace == meta(in).namespace
    FOR create, delete ALLOW $auth.admin == true;

DEFINE TABLE role_has_permission
  SCHEMAFULL AS {
    in: Role,
    out: Permission,
    granted_at: datetime = time::now(),
  }
  PERMISSIONS
    FOR select ALLOW true
    FOR create, delete ALLOW $auth.admin == true;

DEFINE TABLE user_in_team
  SCHEMAFULL AS {
    in: User,
    out: Team,
    joined_at: datetime = time::now(),
    role_in_team: string = "member",  // "member", "manager"
  }
  PERMISSIONS
    FOR select ALLOW $auth.namespace == meta(in).namespace
    FOR create, delete ALLOW $auth.admin == true OR $auth.id == in;

-- ============================================================================
-- AUDIT LOGGING (Immutable)
-- ============================================================================

DEFINE TABLE audit_log SCHEMAFULL
  PERMISSIONS
    FOR select ALLOW $auth.namespace == meta(id).namespace OR $auth.admin == true
    FOR create ALLOW true  // All users can create audit entries (backend enforced)
    FOR update, delete NEVER  // Immutable
{
  id: string,
  namespace: string,
  user_id: User,
  user_email: string,                // Snapshot (user may be deleted later)
  action: string,                    // "ticket:create", "role:update", etc.
  entity_type: string,               // "Ticket", "User", "Role"
  entity_id: string,
  operation_type: string,            // "CREATE", "UPDATE", "DELETE"
  old_values: object = NONE,         // NULL for CREATE
  new_values: object = NONE,         // NULL for DELETE
  ip_address: string,
  user_agent: string,
  request_id: string,                // Tracing
  timestamp: datetime = time::now(),
  is_sensitive: bool = false,        // Redact in reports
  data_classification: string = "internal",  // "public", "internal", "confidential"
}

CREATE INDEX idx_audit_user ON TABLE audit_log COLUMNS (user_id, timestamp) DESC;
CREATE INDEX idx_audit_action ON TABLE audit_log COLUMNS (action, timestamp) DESC;
CREATE INDEX idx_audit_entity ON TABLE audit_log COLUMNS (entity_type, entity_id);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

DEFINE TABLE settings SCHEMAFULL
{
  id: string,
  namespace: string,
  category: string,                  // "auth", "sla", "notification"
  key: string,                       // "jwt_expiry_hours", "max_login_attempts"
  value: any,                        // Type varies by setting
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

CREATE INDEX idx_settings_key ON TABLE settings COLUMNS (namespace, category, key) UNIQUE;
```

### 0.2 Phase 0 API Endpoints

**POST /api/v1/auth/login**
```json
Request:
{
  "email": "alice@company.com",
  "password": "secure-password"
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh-token-xyz",
    "expires_in": 86400,
    "user": {
      "id": "user-123",
      "email": "alice@company.com",
      "display_name": "Alice Smith",
      "roles": [
        { "id": "role-456", "name": "incident_manager" }
      ],
      "permissions": [
        "create:ticket", "approve:change", "view:knowledge"
      ],
      "namespace": "tenant-abc"
    }
  }
}

Errors:
- 401 Unauthorized: Invalid credentials
- 429 Too Many Requests: Too many failed login attempts
- 403 Forbidden: User account disabled
```

**POST /api/v1/auth/logout**
```json
Request:
{
  "refresh_token": "refresh-token-xyz"  // Optional, for complete cleanup
}

Response (204 No Content):
(No body)

Backend action:
- Blacklist refresh token (Redis: add to revoked list)
- Frontend deletes tokens from localStorage
```

**POST /api/v1/auth/refresh**
```json
Request:
{
  "refresh_token": "refresh-token-xyz"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token-rotated",  // Token rotation
    "expires_in": 86400
  }
}

Errors:
- 401 Unauthorized: Refresh token expired or invalid
- 403 Forbidden: Token revoked
```

**GET /api/v1/users** (Admin only)
```json
Request:
?page=1&limit=25&sort=-created_at&filter=is_active:true

Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "user-123",
      "email": "alice@company.com",
      "display_name": "Alice Smith",
      "is_active": true,
      "last_login": "2025-12-08T22:15:00Z",
      "roles": [ { "id": "role-456", "name": "incident_manager" } ],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 47,
    "total_pages": 2
  }
}
```

**POST /api/v1/users** (Admin only)
```json
Request:
{
  "email": "bob@company.com",
  "display_name": "Bob Johnson",
  "roles": ["support_agent"],
  "teams": ["team-l1"]
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "id": "user-789",
    "email": "bob@company.com",
    "display_name": "Bob Johnson",
    "is_active": true,
    "roles": [ { "id": "role-789", "name": "support_agent" } ],
    "created_at": "2025-12-08T22:30:00Z"
  }
}

Note: Password set via separate POST /api/v1/users/{id}/set-password or sent via email
```

**POST /api/v1/users/{id}/assign-role** (Admin only)
```json
Request:
{
  "role_id": "role-456"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "message": "Role assigned",
    "user_id": "user-123",
    "role_id": "role-456"
  }
}

Backend flow:
1. Validate user exists and is in same namespace
2. Validate role exists and is in same namespace
3. Create edge: user → role (via user_has_role)
4. Update user.permissions (compute from all role permissions)
5. Log to audit_log: { action: "user:assign-role", ... }
```

**GET /api/v1/roles** (All users)
```json
Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "role-456",
      "name": "incident_manager",
      "description": "Can create, update, approve incidents",
      "is_system": true,
      "permissions": [
        { "id": "perm-1", "action": "create", "resource": "ticket" },
        { "id": "perm-2", "action": "approve", "resource": "change" }
      ]
    }
  ]
}
```

**POST /api/v1/roles** (Admin only)
```json
Request:
{
  "name": "custom_approver",
  "description": "Custom approver role",
  "permissions": ["perm-123", "perm-456"]  // Permission IDs
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "id": "role-999",
    "name": "custom_approver",
    "permissions": [ { "id": "perm-123", "action": "approve", "resource": "change" } ]
  }
}
```

### 0.3 Phase 0 Backend Implementation (Rust/Axum)

**Middleware: Auth JWT Validation**
```rust
// middleware/auth.rs
use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey};

#[derive(Clone)]
pub struct JwtClaims {
    pub sub: String,                  // User ID
    pub email: String,
    pub namespace: String,            // Tenant
    pub roles: Vec<String>,
    pub permissions: Vec<String>,
    pub iat: i64,
    pub exp: i64,
}

pub async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, AuthError> {
    // Extract Authorization header
    let auth_header = req.headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or(AuthError::MissingToken)?;
    
    // Extract token from "Bearer <token>"
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AuthError::InvalidToken)?;
    
    // Decode and validate JWT
    let decoding_key = DecodingKey::from_rsa_pem(PUBLIC_KEY.as_bytes())?;
    let claims = decode::<JwtClaims>(
        token,
        &decoding_key,
        &jsonwebtoken::Validation::default(),
    )
    .map_err(|_| AuthError::InvalidToken)?
    .claims;
    
    // Check expiration (though jsonwebtoken does this automatically)
    let now = chrono::Utc::now().timestamp();
    if claims.exp < now {
        return Err(AuthError::TokenExpired);
    }
    
    // Inject claims into request extensions for handlers to access
    req.extensions_mut().insert(claims);
    
    Ok(next.run(req).await)
}
```

**Middleware: RBAC Permission Check**
```rust
// middleware/rbac.rs
use axum::{
    extract::{Request, Extension},
    middleware::Next,
    response::Response,
};

pub async fn require_permission(required_perm: &str) -> impl Fn(Request, Next) -> BoxFuture<'static, Result<Response, RbacError>> {
    move |req: Request, next: Next| {
        let claims = req.extensions()
            .get::<JwtClaims>()
            .ok_or(RbacError::Unauthorized)?
            .clone();
        
        // Check if user has permission
        if !claims.permissions.contains(&required_perm.to_string()) {
            return Err(RbacError::PermissionDenied);
        }
        
        // Check namespace (prevent cross-tenant access)
        if let Some(namespace_from_req) = extract_namespace_from_request(&req) {
            if claims.namespace != namespace_from_req {
                return Err(RbacError::CrossTenantAccess);
            }
        }
        
        Ok(next.run(req).await)
    }
}
```

**Handler: Login**
```rust
// handlers/auth.rs
use axum::{
    extract::Extension,
    response::IntoResponse,
    Json,
};
use jsonwebtoken::{encode, EncodingKey, Header};

#[derive(serde::Deserialize)]
pub struct LoginRequest {
    email: String,
    password: String,
}

#[derive(serde::Serialize)]
pub struct LoginResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
    user: UserDto,
}

pub async fn login(
    db: Extension<Arc<Surreal<Db>>>,
    Json(req): Json<LoginRequest>,
) -> Result<(StatusCode, Json<ApiResponse<LoginResponse>>), AuthError> {
    // Normalize email to lowercase
    let email = req.email.to_lowercase();
    
    // Query user from database (unscoped, login is before namespace isolation)
    let user: Option<User> = db
        .query("SELECT * FROM users WHERE email = $email AND is_active = true LIMIT 1")
        .bind(("email", email.clone()))
        .await?
        .take(0)?;
    
    let user = user.ok_or(AuthError::InvalidCredentials)?;
    
    // Verify password
    if !verify_password(&req.password, &user.password_hash)? {
        return Err(AuthError::InvalidCredentials);
    }
    
    // Update last_login
    db.update(user.id.clone())
        .merge(User {
            last_login: Some(Utc::now()),
            ..Default::default()
        })
        .await?;
    
    // Fetch user roles and compute permissions
    let roles: Vec<Role> = db
        .query("SELECT ->user_has_role.out as roles FROM $user_id")
        .bind(("user_id", user.id.clone()))
        .await?
        .take(0)?;
    
    let mut permissions = Vec::new();
    for role in &roles {
        // Fetch permissions for this role
        let role_perms: Vec<Permission> = db
            .query("SELECT ->role_has_permission.out as permissions FROM $role_id")
            .bind(("role_id", role.id.clone()))
            .await?
            .take(0)?;
        
        for perm in role_perms {
            let perm_str = format!("{}:{}", perm.action, perm.resource);
            permissions.push(perm_str);
        }
    }
    
    // Create JWT claims
    let claims = JwtClaims {
        sub: user.id.clone(),
        email: user.email.clone(),
        namespace: user.namespace.clone(),
        roles: roles.iter().map(|r| r.name.clone()).collect(),
        permissions,
        iat: Utc::now().timestamp(),
        exp: (Utc::now() + Duration::hours(24)).timestamp(),
    };
    
    // Encode JWT
    let encoding_key = EncodingKey::from_rsa_pem(PRIVATE_KEY.as_bytes())?;
    let access_token = encode(&Header::default(), &claims, &encoding_key)?;
    
    // Generate refresh token (store in DB with expiry)
    let refresh_token = generate_secure_token();
    db.create("refresh_tokens")
        .content(RefreshToken {
            token: refresh_token.clone(),
            user_id: user.id.clone(),
            expires_at: Utc::now() + Duration::days(30),
            created_at: Utc::now(),
        })
        .await?;
    
    // Log to audit
    db.create("audit_log")
        .content(AuditLog {
            action: "auth:login".to_string(),
            user_id: user.id.clone(),
            user_email: user.email.clone(),
            entity_type: "User".to_string(),
            entity_id: user.id.clone(),
            operation_type: "LOGIN".to_string(),
            timestamp: Utc::now(),
            // ... other fields
        })
        .await?;
    
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse {
            status: "success".to_string(),
            data: LoginResponse {
                access_token,
                refresh_token,
                expires_in: 86400,
                user: user.into(),
            },
        }),
    ))
}
```

**Handler: Assign Role**
```rust
pub async fn assign_role(
    db: Extension<Arc<Surreal<Db>>>,
    Extension(claims): Extension<JwtClaims>,
    Path(user_id): Path<String>,
    Json(req): Json<AssignRoleRequest>,
) -> Result<Json<ApiResponse<()>>, ApiError> {
    // Auth check: User must be admin
    if !claims.permissions.contains(&"admin:*".to_string()) {
        return Err(ApiError::Forbidden);
    }
    
    // Validate user exists
    let user: User = db.select(user_id.clone()).await?
        .ok_or(ApiError::NotFound)?;
    
    // Ensure same namespace
    if user.namespace != claims.namespace {
        return Err(ApiError::CrossTenantAccess);
    }
    
    // Validate role exists
    let role: Role = db.select(req.role_id.clone()).await?
        .ok_or(ApiError::NotFound)?;
    
    // Create relationship
    db.relate(&user_id, "user_has_role", &role.id)
        .content(UserHasRoleEdge {
            assigned_at: Utc::now(),
            assigned_by: claims.sub.clone(),
        })
        .await?;
    
    // Recompute user permissions
    let all_roles: Vec<Role> = db.query(
        "SELECT <-user_has_role.in as user, ->user_has_role.out as role FROM $user_id",
    )
    // ... fetch and compute permissions
    
    // Log to audit
    db.create("audit_log")
        .content(AuditLog {
            action: "user:assign_role".to_string(),
            entity_type: "User".to_string(),
            entity_id: user_id.clone(),
            operation_type: "UPDATE".to_string(),
            new_values: serde_json::json!({ "roles": /* updated roles */ }),
            user_id: claims.sub.clone(),
            user_email: claims.email.clone(),
            timestamp: Utc::now(),
            // ... other fields
        })
        .await?;
    
    Ok(Json(ApiResponse {
        status: "success".to_string(),
        data: (),
    }))
}
```

### 0.4 Frontend Phase 0 Implementation (React)

**Login Component:**
```typescript
// Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { apiClient } from '../api/client';
import { PurpleGlassCard, TextInput, Button } from '../components/shared';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setIsLoading(true);
    
    try {
      // Validate
      const newErrors: Record<string, string> = {};
      if (!email) newErrors.email = 'Email required';
      if (!password) newErrors.password = 'Password required';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsLoading(false);
        return;
      }
      
      // Call API
      await login(email, password);
      
      // On success, navigate to dashboard
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <PurpleGlassCard className="login-card">
        <h1>Archer ITSM</h1>
        <p className="subtitle">The Modern ServiceNow Alternative</p>
        
        {generalError && (
          <InlineAlert type="error" message={generalError} />
        )}
        
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
            placeholder="alice@company.com"
          />
          
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={isLoading}
            placeholder="••••••••"
          />
          
          <Button
            type="submit"
            label="Sign In"
            isLoading={isLoading}
            style="primary"
            fullWidth
          />
        </form>
        
        <p className="help-text">
          <a href="/forgot-password">Forgot password?</a>
        </p>
      </PurpleGlassCard>
    </div>
  );
}
```

**Auth Store (Zustand):**
```typescript
// state/auth.store.ts
import { create } from 'zustand';
import { apiPost } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  permissions: string[];
  namespace: string;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  initializeFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  permissions: [],
  namespace: localStorage.getItem('namespace') || '',
  isLoading: true,
  
  login: async (email: string, password: string) => {
    const response = await apiPost<LoginResponse>('/auth/login', {
      email,
      password,
    });
    
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('namespace', response.user.namespace);
    
    set({
      isAuthenticated: true,
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token,
      permissions: response.user.permissions,
      namespace: response.user.namespace,
    });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('namespace');
    
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      permissions: [],
    });
  },
  
  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await apiPost<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    set({
      token: response.access_token,
      refreshToken: response.refresh_token,
    });
  },
  
  hasPermission: (permission: string) => {
    return get().permissions.includes(permission);
  },
  
  initializeFromStorage: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      set({ isLoading: true });
      try {
        // Validate token with backend
        const response = await apiGet<ValidateTokenResponse>('/auth/validate');
        set({
          isAuthenticated: true,
          user: response.user,
          permissions: response.user.permissions,
          namespace: response.user.namespace,
        });
      } catch (error) {
        localStorage.removeItem('access_token');
        set({ isAuthenticated: false });
      } finally {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
```

---

## Phase 1: Incident Management (Weeks 3-6)

### 1.1 Ticket Schema Additions

```sql
DEFINE TABLE tickets SCHEMAFULL
  PERMISSIONS 
    FOR select ALLOW $auth.namespace == meta(id).namespace
    FOR create ALLOW "create:ticket" IN $auth.permissions
    FOR update ALLOW "update:ticket" IN $auth.permissions
    FOR delete ALLOW "delete:ticket" IN $auth.permissions
{
  id: string,
  namespace: string,
  number: int,                    // Auto-increment display number
  
  // Content
  title: string,
  description: string,           // Rich Markdown
  type: string,                  // "incident", "request", "problem", "change"
  status: string,                // State machine enforced
  priority: int,                 // 1-5
  urgency: int,                  // 1-5
  impact: int,                   // 1-5
  
  // Assignment
  assigned_to: User = NONE,
  assigned_team: Team = NONE,
  created_by: User,
  updated_by: User,
  
  // Timing
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
  closed_at: datetime = NONE,
  
  // SLA
  sla_policy_id: SLAPolicy = NONE,
  sla_timer_id: SLATimer = NONE,
  escalation_count: int = 0,
  
  // Relationships (set via edges)
  affected_assets: [Asset] = [],
  related_tickets: [Ticket] = [],
  related_kb_articles: [KnowledgeArticle] = [],
}

CREATE INDEX idx_tickets_status ON TABLE tickets COLUMNS (status);
CREATE INDEX idx_tickets_priority ON TABLE tickets COLUMNS (priority);
CREATE INDEX idx_tickets_assigned ON TABLE tickets COLUMNS (assigned_to, status);
CREATE INDEX idx_tickets_number ON TABLE tickets COLUMNS (namespace, number) UNIQUE;

-- Auto-increment for ticket numbers
DEFINE SEQUENCE seq_ticket_numbers START 1000;

-- ============================================================================

DEFINE TABLE ticket_comments SCHEMAFULL
{
  id: string,
  namespace: string,
  ticket_id: Ticket,
  author: User,
  body: string,                  // Markdown
  is_internal: bool = false,     // Internal notes only
  mentions: [User] = [],
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
  deleted_at: datetime = NONE,
}

CREATE INDEX idx_comments_ticket ON TABLE ticket_comments COLUMNS (ticket_id, created_at);

-- ============================================================================

DEFINE TABLE ticket_attachments SCHEMAFULL
{
  id: string,
  namespace: string,
  ticket_id: Ticket,
  filename: string,
  mime_type: string,
  file_size_bytes: int,
  storage_path: string,          // S3/local path
  uploaded_by: User,
  created_at: datetime = time::now(),
  scanned_for_malware: bool = false,
}

-- ============================================================================

DEFINE TABLE sla_policies SCHEMAFULL
{
  id: string,
  namespace: string,
  name: string,
  description: string,
  is_active: bool = true,
  
  applies_to_types: [string],    // ["incident", "problem"]
  
  // Matrix: impact,urgency → response_mins, resolution_mins
  sla_matrix: object,
  
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

-- ============================================================================

DEFINE TABLE sla_timers SCHEMAFULL
{
  id: string,
  namespace: string,
  ticket_id: Ticket,
  sla_policy_id: SLAPolicy,
  
  timer_type: string,            // "response" or "resolution"
  start_time: datetime,
  target_time: datetime,         // deadline
  pause_time: datetime = NONE,
  paused_duration_minutes: int = 0,
  
  status: string,                // "active", "paused", "completed", "breached"
  breached_at: datetime = NONE,
  escalated_at: datetime = NONE,
  escalation_rule_id: EscalationRule = NONE,
  
  updated_at: datetime = time::now(),
}

CREATE INDEX idx_sla_timers_status ON TABLE sla_timers COLUMNS (status, target_time);

-- ============================================================================

DEFINE TABLE escalation_rules SCHEMAFULL
{
  id: string,
  namespace: string,
  name: string,
  description: string,
  
  // Conditions
  trigger_priority_gte: int = 1,
  trigger_urgency_gte: int = 1,
  trigger_sla_breach: bool = true,
  trigger_minutes_open: int = NONE,
  
  // Actions
  escalate_to_team: Team = NONE,
  escalate_to_role: Role = NONE,
  notify_teams: [Team] = [],
  notify_users: [User] = [],
  add_priority: int = 0,
  add_urgency: int = 0,
  change_status: string = NONE,
  
  // Control
  is_active: bool = true,
  max_escalations: int = 3,
  cooldown_minutes: int = 30,
  
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

-- ============================================================================
-- EDGES
-- ============================================================================

DEFINE TABLE ticket_has_comment
  SCHEMAFULL AS {
    in: Ticket,
    out: TicketComment,
  };

DEFINE TABLE ticket_has_attachment
  SCHEMAFULL AS {
    in: Ticket,
    out: TicketAttachment,
  };

DEFINE TABLE ticket_affects_asset
  SCHEMAFULL AS {
    in: Ticket,
    to: Asset,
    confidence: float = 1.0,
    manual_link: bool = true,
  };

DEFINE TABLE ticket_related_to
  SCHEMAFULL AS {
    in: Ticket,
    out: Ticket,
    relationship_type: string,  // "blocks", "duplicates", "parent_of"
  };
```

### 1.2 Phase 1 Ticket API Endpoints

**POST /api/v1/tickets**
```json
Request:
{
  "title": "Database connection timeout",
  "description": "Production DB unreachable from app servers. Started at 22:30",
  "type": "incident",
  "priority": 2,
  "urgency": 3,
  "impact": 5,
  "assigned_to": "user-456",
  "assigned_team": "team-l1"
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "id": "TICK-1000",
    "number": 1000,
    "title": "Database connection timeout",
    "status": "open",
    "priority": 2,
    "created_by": {
      "id": "user-123",
      "email": "alice@company.com"
    },
    "created_at": "2025-12-08T22:45:00Z",
    "sla_deadline": "2025-12-08T23:45:00Z"  // 1 hour for priority 2
  }
}

Backend flow:
1. Validate auth: require "create:ticket" permission
2. Assign auto-incrementing number (SEQUENCE)
3. Evaluate SLA policy: priority 2 + impact 5 → 1 hour response time
4. Create SLATimer: start_time=now, target_time=now+1h
5. Create Notification for assigned_to user
6. Log to audit_log
```

**GET /api/v1/tickets/{id}**
```json
Response (200 OK):
{
  "status": "success",
  "data": {
    "id": "TICK-1000",
    "number": 1000,
    "title": "Database connection timeout",
    "description": "...",
    "type": "incident",
    "status": "open",
    "priority": 2,
    "urgency": 3,
    "impact": 5,
    
    "assigned_to": {
      "id": "user-456",
      "display_name": "Bob Johnson"
    },
    "assigned_team": {
      "id": "team-l1",
      "name": "L1 Support"
    },
    
    "created_by": { ... },
    "created_at": "2025-12-08T22:45:00Z",
    "updated_at": "2025-12-08T22:50:00Z",
    "closed_at": null,
    
    "sla_timer": {
      "status": "active",
      "target_time": "2025-12-08T23:45:00Z",
      "time_remaining_minutes": 55,
      "is_breached": false
    },
    
    "comments": [
      {
        "id": "COMM-1",
        "author": { "id": "user-456", "display_name": "Bob Johnson" },
        "body": "Investigating database connectivity issues",
        "is_internal": false,
        "created_at": "2025-12-08T22:48:00Z"
      }
    ],
    
    "affected_assets": [
      { "id": "ASSET-1", "name": "prod-db-01" }
    ],
    
    "related_kb_articles": [
      {
        "id": "KB-123",
        "title": "Database Connection Troubleshooting",
        "relevance": 0.95
      }
    ]
  }
}
```

**PATCH /api/v1/tickets/{id}**
```json
Request (Update status + assign):
{
  "status": "in_progress",
  "assigned_to": "user-789",
  "priority": 1
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "id": "TICK-1000",
    "status": "in_progress",  // Updated
    "assigned_to": { "id": "user-789", ... },
    "priority": 1,
    "updated_at": "2025-12-08T22:52:00Z"
  }
}

Backend flow:
1. Validate auth: require "update:ticket" permission
2. Fetch current ticket
3. Compare old vs new values
4. If status changed: validate state transition (incident: open→in_progress allowed)
5. If SLA affected: recalculate (priority change affects deadline)
6. Update record
7. Log to audit_log with old_values and new_values
8. Send notifications to relevant users
9. Trigger workflow if state change has on_exit/on_enter actions
```

**POST /api/v1/tickets/{id}/comments**
```json
Request:
{
  "body": "DB service restarted, checking connectivity",
  "is_internal": false,
  "mentions": ["user-123", "user-456"]  // @mention these users
}

Response (201 Created):
{
  "status": "success",
  "data": {
    "id": "COMM-2",
    "ticket_id": "TICK-1000",
    "author": { "id": "user-789", "display_name": "Bob Johnson" },
    "body": "DB service restarted, checking connectivity",
    "is_internal": false,
    "mentions": [
      { "id": "user-123", "display_name": "Alice Smith" },
      { "id": "user-456", "display_name": "Charlie Brown" }
    ],
    "created_at": "2025-12-08T22:55:00Z"
  }
}

Backend flow:
1. Validate auth: require "comment:create" OR assigned to ticket
2. Parse @mentions (extract user IDs from body text)
3. Validate mentioned users exist
4. Create TicketComment
5. Create Notifications for mentioned users
6. Update ticket.updated_at
7. Broadcast via WebSocket to users viewing ticket
8. Log to audit_log
```

### 1.3 Background Job: SLA Timer Service

**Pseudo-code (Rust):**
```rust
// Background job running every 5 minutes
pub async fn sla_timer_service(db: Arc<Surreal<Db>>) {
    loop {
        tokio::time::sleep(Duration::from_secs(300)).await;  // 5 minutes
        
        if let Err(e) = process_sla_timers(&db).await {
            eprintln!("SLA timer service error: {:?}", e);
        }
    }
}

async fn process_sla_timers(db: &Surreal<Db>) -> Result<()> {
    // Get all active SLA timers
    let active_timers: Vec<(SLATimer, Ticket, EscalationRule)> = db
        .query(
            r#"
            SELECT 
                timer,
                timer.ticket_id as ticket,
                timer.escalation_rule_id as escalation_rule
            FROM sla_timers as timer
            WHERE timer.status = 'active'
            "#
        )
        .await?
        .take(0)?;
    
    let now = Utc::now();
    
    for (mut timer, ticket, escalation_rule) in active_timers {
        // Calculate remaining time
        let remaining = timer.target_time - now;
        
        if remaining < Duration::zero() && timer.status != "breached" {
            // SLA has been breached
            println!("SLA BREACHED: ticket {}, timer {}", ticket.id, timer.id);
            
            // Update timer status
            timer.status = "breached".to_string();
            timer.breached_at = Some(now);
            db.update(timer.id.clone())
                .merge(timer.clone())
                .await?;
            
            // Update ticket priority/urgency if configured
            if let Some(rule) = escalation_rule {
                if rule.is_active && rule.trigger_sla_breach {
                    let escalation_count = ticket.escalation_count;
                    
                    if escalation_count < rule.max_escalations {
                        // Increment escalation count
                        let mut updated_ticket = ticket.clone();
                        updated_ticket.escalation_count = escalation_count + 1;
                        updated_ticket.priority = (ticket.priority - rule.add_priority).max(1);
                        updated_ticket.updated_at = now;
                        
                        db.update(ticket.id.clone())
                            .merge(updated_ticket.clone())
                            .await?;
                        
                        // Create notifications
                        if let Some(team) = rule.escalate_to_team {
                            send_escalation_notification(
                                &db,
                                &ticket,
                                &team,
                                "SLA breach escalation"
                            ).await?;
                        }
                        
                        // Log to audit
                        db.create("audit_log")
                            .content(AuditLog {
                                action: "ticket:escalated".to_string(),
                                entity_type: "Ticket".to_string(),
                                entity_id: ticket.id.clone(),
                                user_id: "system".to_string(),  // Automated action
                                timestamp: now,
                                // ... other fields
                            })
                            .await?;
                    }
                }
            }
        }
    }
    
    Ok(())
}
```

---

## Phase 1.5: Knowledge Base (Weeks 7-8)

### 1.5.1 Knowledge Base Schema

```sql
DEFINE TABLE knowledge_articles SCHEMAFULL
{
  id: string,
  namespace: string,
  
  title: string,
  slug: string,                      // URL-friendly
  description: string,
  body: string,                      // Markdown
  status: string,                    // "draft", "published", "archived"
  
  category: KnowledgeCategory,
  tags: [string],                    // ["networking", "incident"]
  
  is_internal: bool = false,         // Staff-only articles
  visible_to_roles: [Role] = [],     // Additional access control
  
  current_version: int = 1,
  version_history: [object] = [],    // Version snapshots
  
  author: User,
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
  published_at: datetime = NONE,
  view_count: int = 0,
  helpful_count: int = 0,            // User feedback
  
  // Relationships
  related_articles: [KnowledgeArticle] = [],
}

CREATE INDEX idx_knowledge_slug ON TABLE knowledge_articles COLUMNS (namespace, slug) UNIQUE;
CREATE INDEX idx_knowledge_search ON TABLE knowledge_articles COLUMNS (title, body);

-- ============================================================================

DEFINE TABLE knowledge_categories SCHEMAFULL
{
  id: string,
  namespace: string,
  name: string,
  slug: string,
  description: string,
  parent_category: KnowledgeCategory = NONE,
  icon: string,
  display_order: int = 0,
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

CREATE INDEX idx_knowledge_categories_slug ON TABLE knowledge_categories COLUMNS (namespace, slug) UNIQUE;

-- ============================================================================

DEFINE TABLE article_in_category
  SCHEMAFULL AS {
    in: KnowledgeArticle,
    out: KnowledgeCategory,
  };

DEFINE TABLE article_related_to
  SCHEMAFULL AS {
    in: KnowledgeArticle,
    out: KnowledgeArticle,
  };

DEFINE TABLE article_solves_ticket
  SCHEMAFULL AS {
    in: KnowledgeArticle,
    out: Ticket,
    ranking: int,  // Relevance ranking
  };
```

### 1.5.2 Knowledge Base Search Endpoint

**GET /api/v1/knowledge/search?q=database+timeout**
```json
Response (200 OK):
{
  "status": "success",
  "data": [
    {
      "id": "KB-123",
      "title": "Database Connection Troubleshooting",
      "slug": "database-troubleshooting",
      "excerpt": "Common causes of database connectivity issues include firewall rules, connection pool exhaustion, and network timeouts...",
      "relevance_score": 0.98,
      "view_count": 450,
      "helpful_count": 38,
      "category": { "id": "CAT-1", "name": "Databases" },
      "published_at": "2025-09-01T08:00:00Z"
    },
    {
      "id": "KB-124",
      "title": "Network Timeouts: Diagnosis and Resolution",
      "slug": "network-timeouts",
      "excerpt": "Network timeouts occur when connections exceed their timeout threshold. This guide covers diagnosis steps...",
      "relevance_score": 0.82,
      // ... other fields
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10
  }
}

Backend implementation (Rust):
db.query(
    "SELECT * FROM knowledge_articles 
     WHERE status = 'published' 
     AND (title CONTAINSALL $query OR body CONTAINSALL $query)
     AND (is_internal = false OR author = $user_id)
     ORDER BY SCORE(title CONTAINS $query) DESC
     LIMIT 10"
)
.bind(("query", search_query))
.bind(("user_id", user_id))
.await
```

---

## Phase 2: CMDB & Assets (Weeks 9-12)

### 2.1 Asset & Relationship Schema

```sql
DEFINE TABLE assets SCHEMAFULL
{
  id: string,
  namespace: string,
  name: string,
  display_label: string,
  asset_type: string,               // "server", "database", "vm", "app"
  serial_number: string = NONE,
  
  category: string,                 // "compute", "storage", "network", "software"
  status: string = "active",        // "active", "inactive", "retired"
  owner_team: Team = NONE,
  owner_user: User = NONE,
  
  acquired_date: datetime = NONE,
  warranty_expires: datetime = NONE,
  depreciation_months: int = NONE,
  lifecycle_stage: string = "stable",
  
  location: string = NONE,
  environment: string,              // "production", "staging", "dev"
  
  specs: object = {},               // {"cpu": "64 cores", "ram_gb": 128}
  
  monitoring_enabled: bool = false,
  monitoring_agent_id: string = NONE,
  health_status: string = "unknown", // "healthy", "degraded", "critical"
  last_health_check: datetime = NONE,
  
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
  created_by: User,
  updated_by: User,
}

CREATE INDEX idx_assets_type ON TABLE assets COLUMNS (asset_type, environment);
CREATE INDEX idx_assets_status ON TABLE assets COLUMNS (status);

-- ============================================================================

DEFINE TABLE asset_contained_in
  SCHEMAFULL AS {
    in: Asset,   // Child
    out: Asset,  // Parent (e.g., VM in Host)
  };

DEFINE TABLE asset_depends_on
  SCHEMAFULL AS {
    in: Asset,   // Dependent
    out: Asset,  // Dependency (e.g., App depends on DB)
  };

DEFINE TABLE asset_hosts
  SCHEMAFULL AS {
    in: Asset,   // Hypervisor/Host
    out: Asset,  // VM/Service running on this
  };

DEFINE TABLE asset_relationships_custom
  SCHEMAFULL AS {
    in: Asset,
    out: Asset,
    relationship_name: string,
    metadata: object = {},
  };
```

### 2.2 Asset Dependency Graph Endpoint

**GET /api/v1/cmdb/graph/{asset_id}**
```json
Response (200 OK):
{
  "status": "success",
  "data": {
    "root_asset": {
      "id": "ASSET-1",
      "name": "prod-app-01",
      "asset_type": "application",
      "status": "active"
    },
    "graph": {
      "nodes": [
        { "id": "ASSET-1", "type": "application", "label": "prod-app-01" },
        { "id": "ASSET-2", "type": "server", "label": "prod-web-01" },
        { "id": "ASSET-3", "type": "database", "label": "prod-db-01" },
        { "id": "ASSET-4", "type": "network", "label": "prod-vlan-10" }
      ],
      "edges": [
        { "from": "ASSET-1", "to": "ASSET-2", "type": "runs_on" },
        { "from": "ASSET-2", "to": "ASSET-4", "type": "connected_via" },
        { "from": "ASSET-1", "to": "ASSET-3", "type": "depends_on" }
      ]
    },
    "impact_summary": {
      "critical_dependencies": 2,
      "potentially_affected": 15,
      "msg": "If this asset goes down, 15 downstream assets are affected"
    }
  }
}

Backend implementation (Rust):
// Traverse graph to depth 3
async fn get_asset_graph(
    db: &Surreal<Db>,
    asset_id: &str,
    max_depth: usize,
) -> Result<AssetGraph> {
    // BFS to find all related assets
    let query = "
        SELECT 
            * FETCH <-asset_depends_on, <-asset_contained_in, <-asset_hosts
        FROM $asset_id
        LIMIT $max_depth
    ";
    
    db.query(query)
        .bind(("asset_id", asset_id))
        .bind(("max_depth", max_depth))
        .await?
        .take(0)
}
```

---

## Phase 3: Workflows & Approvals (Weeks 13-16)

### 3.1 Workflow Schema & Execution

```sql
DEFINE TABLE workflow_definitions SCHEMAFULL
{
  id: string,
  namespace: string,
  name: string,
  description: string,
  version: int = 1,
  
  applies_to_types: [string],       // ["change", "request"]
  
  // Serialized workflow definition (JSON)
  definition: object,               // See workflow DSL below
  
  is_active: bool = true,
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

/*
Workflow Definition Structure:

{
  "id": "wf-change-request",
  "name": "Standard Change Request",
  "states": [
    {
      "id": "draft",
      "name": "Draft",
      "type": "start",
      "terminal": false
    },
    {
      "id": "submitted",
      "name": "Submitted for Review",
      "type": "normal",
      "on_enter": [
        { "type": "notify", "users": ["change_manager"] }
      ]
    },
    {
      "id": "approved",
      "name": "Approved",
      "type": "normal",
      "on_enter": [
        { "type": "notify_all_stakeholders" }
      ]
    },
    {
      "id": "rejected",
      "name": "Rejected",
      "type": "end",
      "terminal": true
    },
    {
      "id": "implemented",
      "name": "Implemented",
      "type": "end",
      "terminal": true
    }
  ],
  "transitions": [
    {
      "from": "draft",
      "to": "submitted",
      "action": "submit",
      "guards": [
        { "type": "permission", "action": "submit:change" },
        { "type": "field_required", "fields": ["title", "description"] }
      ]
    },
    {
      "from": "submitted",
      "to": "approved",
      "action": "approve",
      "guards": [
        { "type": "approval_required", "chain_id": "change_cab" }
      ],
      "on_exit": [
        { "type": "schedule_execution", "delay_hours": 4 }
      ]
    },
    {
      "from": "submitted",
      "to": "rejected",
      "action": "reject",
      "guards": [
        { "type": "permission", "action": "reject:change" }
      ],
      "on_exit": [
        { "type": "notify", "template": "change_rejected" }
      ]
    },
    {
      "from": "approved",
      "to": "implemented",
      "action": "mark_implemented",
      "guards": []
    }
  ]
}
*/

-- ============================================================================

DEFINE TABLE workflow_instances SCHEMAFULL
{
  id: string,
  namespace: string,
  definition_id: WorkflowDefinition,
  definition_version: int,          // Snapshot
  
  entity_type: string,              // "ticket", "request"
  entity_id: string,                // ID of entity
  
  current_state: string,            // State ID
  current_state_entered_at: datetime,
  
  state_history: [object] = [],     // History snapshots
  
  status: string = "running",       // "running", "completed", "failed", "paused"
  completed_at: datetime = NONE,
  failed_reason: string = NONE,
  
  created_at: datetime = time::now(),
  updated_at: datetime = time::now(),
}

-- ============================================================================

DEFINE TABLE approval_requests SCHEMAFULL
{
  id: string,
  namespace: string,
  
  ticket_id: Ticket,
  workflow_instance_id: WorkflowInstance,
  reason: string,                   // Why approval needed
  
  approval_chain_id: ApprovalChain,
  current_step: int,
  approvers: [User],
  
  status: string = "pending",       // "pending", "approved", "rejected"
  approved_by: User = NONE,
  approval_comment: string = NONE,
  approved_at: datetime = NONE,
  
  created_at: datetime = time::now(),
  expires_at: datetime,             // SLA for approval
  completed_at: datetime = NONE,
}

-- ============================================================================

DEFINE TABLE approval_chains SCHEMAFULL
{
  id: string,
  namespace: string,
  name: string,
  
  chain_type: string,               // "sequential", "parallel"
  
  // Array of approval steps
  steps: [object] = [],
  
  /*
  steps: [
    {
      step: 1,
      approvers: ["change_manager"],  // Roles or user IDs
      required_approvals: 1,
      timeout_hours: 24
    },
    {
      step: 2,
      approvers: ["cto", "director"],
      required_approvals: 2,
      timeout_hours: 48
    }
  ]
  */
  
  is_active: bool = true,
  created_at: datetime = time::now(),
}
```

### 3.2 Workflow Transition Endpoint

**POST /api/v1/tickets/{id}/transition**
```json
Request:
{
  "action": "submit_for_approval",
  "comment": "Ready for review"
}

Response (200 OK):
{
  "status": "success",
  "data": {
    "ticket_id": "TICK-1000",
    "old_state": "draft",
    "new_state": "approval_pending",
    "workflow_state": "approval_pending",
    "approval_required": true,
    "approval_chain": {
      "id": "chain-123",
      "steps": [
        {
          "step": 1,
          "approvers": [
            { "id": "user-456", "display_name": "Change Manager" }
          ],
          "status": "pending"
        }
      ]
    },
    "created_approval_request": {
      "id": "appr-123",
      "status": "pending",
      "expires_at": "2025-12-10T22:45:00Z"
    }
  }
}

Backend flow:
1. Fetch ticket
2. Determine if ticket type has workflow
3. Get current workflow state
4. Check if transition is valid (exists in definition)
5. Validate guards (permissions, field validation, etc.)
6. If transition requires approval:
   - Create ApprovalRequest
   - Create ApprovalChain with steps
   - Send notifications to first-step approvers
7. Execute on_exit actions from old state
8. Update workflow_instance to new state
9. Execute on_enter actions for new state
10. If new state is terminal, mark workflow as completed
11. Log to audit_log
```

---

## Phase 4-6 Summary

Due to length constraints, Phase 4 (Monitoring), Phase 5 (Service Catalog), and Phase 6 (Reporting) follow the same patterns as Phases 0-3:

1. **Define SurrealDB schema** for new entities
2. **Create API endpoints** for CRUD operations
3. **Implement React components** for UI
4. **Add Zustand state** for complex features
5. **Write Rust handlers** with auth/RBAC middleware
6. **Create background jobs** if needed (e.g., alert correlation)

---

## Implementation Checklist by Phase

### Phase 0: Foundation
- [ ] Design & validate JWT token structure
- [ ] Implement password hashing (bcrypt)
- [ ] Create auth endpoints (login, logout, refresh)
- [ ] Implement RBAC permission checking middleware
- [ ] Set up audit logging for all mutations
- [ ] Create user/role/permission CRUD endpoints
- [ ] Build login UI component
- [ ] Set up Zustand auth store
- [ ] Test RBAC enforcement on all endpoints
- [ ] Security review (OWASP guidelines)

### Phase 1: Incident Management
- [ ] Implement ticket state machine
- [ ] Create SLA policy engine
- [ ] Build SLA timer background job
- [ ] Implement escalation rules
- [ ] Add comment + attachment subsystem
- [ ] Create Service Desk UI (list, detail, create views)
- [ ] Implement notification system (basic)
- [ ] Add ticket search/filtering
- [ ] Performance testing (<100ms ticket list with 10K records)
- [ ] UAT with sample data

### Phase 1.5: Knowledge Base
- [ ] Full-text search implementation
- [ ] Article versioning system
- [ ] Category hierarchy
- [ ] KB search integration with tickets (suggestions)
- [ ] KB editor UI
- [ ] Article management (CRUD)

### Phase 2: CMDB
- [ ] Asset relationship graph implementation
- [ ] Asset CRUD endpoints
- [ ] Dependency graph queries
- [ ] Asset health integration (from monitoring)
- [ ] Asset list/detail UI
- [ ] Asset dependency visualization

### Phase 3: Workflows
- [ ] Workflow definition schema + DSL
- [ ] Workflow execution engine
- [ ] Approval chain system
- [ ] Workflow UI builder (simplified)
- [ ] Approval UI

### Phase 4: Monitoring
- [ ] Alert ingestion API (webhook)
- [ ] Alert correlation algorithm
- [ ] Alert rule engine
- [ ] Alert → Ticket auto-creation
- [ ] Alert dashboard UI

### Phase 5: Service Catalog
- [ ] Catalog item CRUD
- [ ] Dynamic request forms
- [ ] Request fulfillment workflow
- [ ] Catalog browser UI
- [ ] Request form renderer

### Phase 6: Reporting
- [ ] Dashboard widget system
- [ ] Standard reports (SLA compliance, MTTR, ticket volume)
- [ ] Custom report builder
- [ ] Export functionality (CSV, PDF)
- [ ] Analytics dashboard UI

---

## Testing Strategy

### Unit Tests
```
- RBAC permission checks
- SLA timer calculation
- Workflow state transitions
- Approval chain logic
- Ticket state machine
```

### Integration Tests
```
- End-to-end ticket creation → SLA timer → escalation
- Workflow transitions with approvals
- Alert → ticket auto-creation
- KB search accuracy
```

### Performance Tests
```
- Ticket list load: <100ms for 10K records
- Auth middleware overhead: <50ms per request
- Full-text search: <200ms for 10K articles
- Asset dependency graph: <500ms for deep graphs
```

### Security Tests
```
- JWT token validation
- RBAC permission enforcement
- Cross-tenant data isolation
- SQL injection prevention
- XSS prevention in comments
```

---

## Deployment & Rollout

### Pre-Production
1. Deploy to staging environment
2. Load testing (simulate 1,000 concurrent users)
3. Security audit (OWASP, JWT, RBAC)
4. Performance profiling
5. Data migration testing (if migrating from ServiceNow)

### Production Rollout
1. **Canary:** 5% of users → monitor for 1 week
2. **Gradual:** 25% → 50% → 100% over 2 weeks
3. **Rollback plan:** If >1% error rate, rollback to previous version
4. **Monitoring:** Real-time dashboards for errors, latency, SLA breaches

---

## Success Metrics & Acceptance Criteria

| Phase | Metric | Target | Success Criteria |
|-------|--------|--------|------------------|
| 0 | Auth bypass vulnerabilities | 0 | Security audit passes |
| 0 | RBAC permission check latency | <50ms | 99th percentile <100ms |
| 1 | MTTR improvement | -50% | From 120 min to 60 min |
| 1 | SLA compliance | 95% | Tickets resolved on-time |
| 1.5 | KB article search latency | <200ms | 95th percentile |
| 2 | Asset graph query speed | <500ms | Even for 100+ relationships |
| 3 | Approval cycle time | <4 hours | Reduce from 48 hours |
| 4 | Alert precision | 80% | Not false positives |
| 5 | Self-service adoption | 40% | Of total requests via catalog |
| 6 | Dashboard load time | <1s | All widgets ready |

---

## Documentation & Training

**Developer Documentation:**
- API documentation (OpenAPI/Swagger spec)
- Database schema guide
- Component library documentation
- Deployment runbook

**User Documentation:**
- Service Desk user guide
- KB article editing guide
- Admin guide (user/role management)
- Troubleshooting FAQ

**Training:**
- 2-day developer onboarding
- 4-hour admin training
- 2-hour end-user training

---

## Next Steps

1. **Week 1:** Complete Phase 0 technical spike
2. **Week 2:** Stakeholder review and approval
3. **Week 3:** Begin Phase 0 implementation
4. **Week 5:** Begin Phase 1 (parallel with Phase 0 completion)
5. **Ongoing:** Weekly team sync, sprint reviews, risk assessment

---

**End of Full-Stack Development Plan**

This document provides the implementation blueprint. See **PRODUCT_ROADMAP.md** for phasing strategy and **TARGET_ARCHITECTURE.md** for system design overview.

