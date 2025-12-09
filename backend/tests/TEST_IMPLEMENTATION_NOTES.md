# E2E API Test Implementation Notes

## Overview

This document tracks the implementation status of the E2E API test suite for Archer ITSM. The test files have been created but require some service method implementations or adaptations to match the existing API.

## Test Files Created

| File | Lines | Tests | Status |
|------|-------|-------|--------|
| `auth_tests.rs` | 552 | 28 | ⚠️ Needs method implementations |
| `knowledge_tests.rs` | 677 | 32 | ⚠️ Needs verification |
| `cmdb_tests.rs` | 766 | 34 | ⚠️ Needs verification |
| `permission_tests.rs` | 534 | 19 | ⚠️ Needs method implementations |
| **TOTAL** | **2,529** | **113** | |

## Compilation Issues

### 1. AuthService Missing Methods

The following methods are called in tests but don't exist in `backend/src/services/auth_service.rs`:

#### High Priority (Core Functionality)

```rust
// USER REGISTRATION
pub async fn register_user(
    &self,
    email: &str,
    username: &str,
    password: &str,
    display_name: &str,
    tenant_id: Option<&str>,
) -> Result<User, AuthError>
```
**Workaround:** Use `create_user()` instead, but it requires `role_ids: Vec<String>`

```rust
// TOKEN VERIFICATION
pub async fn verify_token(&self, token: &str) -> Result<JwtClaims, AuthError>
```
**Workaround:** Use `validate_access_token()` instead (already exists, just rename in tests)

```rust
// REFRESH TOKEN
pub async fn refresh_access_token(&self, refresh_token: &str) -> Result<RefreshTokenResponse, AuthError>
```
**Workaround:** Use `refresh_token(RefreshTokenRequest)` instead

```rust
// PERMISSION CHECK
pub async fn check_permission(&self, user_id: &str, permission: &str) -> Result<bool, AuthError>
```
**Workaround:** Use `has_permission()` instead (already exists, just rename in tests)

#### Medium Priority (RBAC Management)

```rust
// INITIALIZE SYSTEM ROLES
pub async fn initialize_system_roles(&self) -> Result<(), AuthError>
```
**Status:** Needs implementation - critical for bootstrapping system

```rust
// ROLE CRUD
pub async fn create_role(
    &self,
    name: &str,
    display_name: &str,
    description: &str,
    permission_ids: Vec<String>,
    is_system: bool,
) -> Result<Role, AuthError>

pub async fn assign_role(&self, user_id: &str, role_id: &str) -> Result<(), AuthError>

pub async fn list_roles(&self) -> Result<Vec<Role>, AuthError>
```
**Status:** Needs implementation - required for RBAC tests

```rust
// PERMISSION CRUD
pub async fn create_permission(
    &self,
    resource_action: &str,
    display_name: &str,
    description: &str,
) -> Result<Permission, AuthError>
```
**Status:** Needs implementation - required for permission tests

#### Low Priority (Additional Features)

```rust
// PASSWORD MANAGEMENT
pub async fn change_password(
    &self,
    user_id: &str,
    current_password: &str,
    new_password: &str,
) -> Result<(), AuthError>
```
**Status:** Needs implementation - useful for security

### 2. LoginRequest Model

**Issue:** Tests create `LoginRequest` without `remember_me` field

**Current Definition:**
```rust
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub remember_me: Option<bool>,  // Missing in tests!
}
```

**Fix:** Add `remember_me: None` to all LoginRequest initializations in tests

### 3. Login Method Signature

**Issue:** Tests call `login(request)` but actual signature is:

```rust
pub async fn login(
    &self,
    request: LoginRequest,
    ip_address: Option<String>,
    user_agent: Option<String>,
) -> Result<LoginResponse, AuthError>
```

**Fix:** Update all test calls to: `login(request, None, None)`

## Implementation Options

### Option A: Implement Missing Methods (Recommended)

**Pros:**
- Tests remain comprehensive and clear
- Service API becomes more complete
- Better separation of concerns

**Cons:**
- Requires ~200-300 lines of new service code
- Needs careful RBAC implementation

**Estimated Effort:** 3-4 hours

### Option B: Adapt Tests to Existing API

**Pros:**
- No service changes required
- Tests can run immediately

**Cons:**
- Tests become more complex
- May miss testing some functionality
- Less intuitive test code

**Estimated Effort:** 1-2 hours

### Option C: Hybrid Approach

1. Implement critical missing methods (register_user, initialize_system_roles)
2. Use workarounds for others (rename verify_token -> validate_access_token)
3. Stub out RBAC management tests for now

**Estimated Effort:** 2-3 hours

## Recommended Action Plan

### Phase 1: Quick Wins (30 min)

1. Update tests to use existing method names:
   - `verify_token()` → `validate_access_token()`
   - `check_permission()` → `has_permission()`
   - `refresh_access_token()` → `refresh_token()`

2. Fix LoginRequest initialization:
   - Add `remember_me: None` to all instances

3. Fix login() calls:
   - Add `None, None` for ip_address and user_agent

### Phase 2: Critical Methods (1-2 hours)

1. Implement `register_user()` wrapper:
```rust
pub async fn register_user(
    &self,
    email: &str,
    username: &str,
    password: &str,
    display_name: &str,
    tenant_id: Option<&str>,
) -> Result<User, AuthError> {
    // Assign default role (e.g., "viewer")
    self.create_user(
        email.to_string(),
        username.to_string(),
        password.to_string(),
        display_name.to_string(),
        vec![], // Or default role ID
        None,
    ).await
}
```

2. Implement `initialize_system_roles()`:
   - Create Admin, Agent, Viewer roles with appropriate permissions
   - Make idempotent (check if roles exist first)

### Phase 3: RBAC Methods (2-3 hours)

1. Implement role management:
   - `create_role()`
   - `assign_role()`
   - `list_roles()`

2. Implement permission management:
   - `create_permission()`

3. Implement password management:
   - `change_password()`

### Phase 4: Knowledge & CMDB Verification (1 hour)

1. Verify KnowledgeService methods exist:
   - Most should already be implemented
   - Check method signatures match tests

2. Verify CMDBService methods exist:
   - Most should already be implemented
   - Check method signatures match tests

## Success Criteria

- [ ] All 113 tests compile without errors
- [ ] All tests pass (or failing tests are documented)
- [ ] Test coverage > 70% for Auth, KB, CMDB modules
- [ ] CI can run tests automatically
- [ ] Documentation updated with test execution instructions

## Notes

- The test suite is comprehensive and well-structured
- Most issues are quick fixes (method renaming)
- Core functionality to implement: register_user, initialize_system_roles
- RBAC management can be deferred if needed
- Tests follow best practices (setup/teardown, isolation, clear assertions)
