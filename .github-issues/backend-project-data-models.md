# Backend: Project and Activity Data Models

## Issue Description
Implement SurrealDB data models and backend APIs for project management system, including projects, activities, server inventory, and free hardware pool management.

## Background
Currently the system has hardware basket parsing but lacks project orchestration. We need to add project management capabilities that coordinate migration, lifecycle, and custom activities with timeline management and resource allocation.

## Technical Specifications

### Database Schema (SurrealDB)

```rust
// core-engine/src/models/project_management.rs
use serde::{Deserialize, Serialize};
use surrealdb::sql::{Thing, Datetime};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub status: ProjectStatus,
    pub created_by: String,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProjectStatus {
    Planning,
    InProgress,
    Completed,
    OnHold,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Activity {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_type: ActivityType,
    pub name: String,
    pub description: Option<String>,
    pub assignee: String,
    pub status: ActivityStatus,
    pub start_date: Datetime,
    pub end_date: Datetime,
    pub dependencies: Vec<Thing>, // other activity IDs
    pub wizard_config: Option<serde_json::Value>,
    pub servers_involved: Vec<Thing>,
    pub add_to_free_pool: bool,
    pub overcommit_config: Option<OvercommitConfig>,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActivityType {
    Migration,
    Lifecycle,
    Decommission,
    HardwareCustomization,
    Commissioning,
    Custom(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ActivityStatus {
    Pending,
    InProgress,
    Completed,
    Blocked,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerInventory {
    pub id: Option<Thing>,
    pub model_name: String,
    pub vendor: String,
    pub specifications: HardwareSpecifications, // reuse existing
    pub status: ServerStatus,
    pub location: Option<String>,
    pub assigned_project: Option<Thing>,
    pub assigned_activity: Option<Thing>,
    pub source: ServerSource,
    pub purchase_date: Option<Datetime>,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServerStatus {
    Available,
    InUse,
    Maintenance,
    Decommissioned,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ServerSource {
    RVTools,
    Manual,
    HardwareBasket,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FreeHardwarePool {
    pub id: Option<Thing>,
    pub server_id: Thing,
    pub available_from: Datetime,
    pub released_from_activity: Option<Thing>,
    pub notes: Option<String>,
    pub created_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OvercommitConfig {
    pub cpu_ratio: String, // "3:1"
    pub memory_ratio: String, // "1.5:1"
    pub ha_policy: String, // "n+1"
}
```

### API Endpoints

```rust
// backend/src/api/project_management.rs
use axum::{routing::{get, post, put, delete}, Router};

pub fn routes() -> Router<AppState> {
    Router::new()
        // Projects
        .route("/projects", get(get_projects).post(create_project))
        .route("/projects/:id", get(get_project).put(update_project).delete(delete_project))
        
        // Activities
        .route("/projects/:project_id/activities", get(get_activities).post(create_activity))
        .route("/activities/:id", get(get_activity).put(update_activity).delete(delete_activity))
        .route("/activities/:id/dependencies", get(get_dependencies).put(update_dependencies))
        
        // Server Inventory
        .route("/servers", get(get_servers).post(create_server))
        .route("/servers/:id", get(get_server).put(update_server).delete(delete_server))
        .route("/servers/import-rvtools", post(import_rvtools))
        
        // Free Hardware Pool
        .route("/hardware-pool", get(get_free_hardware))
        .route("/hardware-pool/:server_id", post(add_to_pool).delete(remove_from_pool))
        
        // Capacity Calculations
        .route("/activities/:id/sizing", get(calculate_capacity_sizing))
        .route("/activities/:id/recommendations", get(get_hardware_recommendations))
}
```

### Key Functions to Implement

```rust
// Capacity sizing calculations
pub async fn calculate_capacity_sizing(
    Path(activity_id): Path<String>,
    State(db): State<AppState>
) -> impl IntoResponse {
    // 1. Get activity and its wizard config
    // 2. Calculate current capacity from assigned servers
    // 3. Apply overcommit ratios from config
    // 4. Calculate required additional capacity
    // 5. Recommend hardware from basket or existing pool
}

// Dependency validation
pub async fn validate_dependencies(
    activities: &[Activity]
) -> Result<Vec<DependencyConflict>> {
    // 1. Check for circular dependencies
    // 2. Validate timeline consistency
    // 3. Return conflicts that need resolution
}

// Timeline recalculation
pub fn recalculate_timeline(
    activities: &mut [Activity]
) -> Result<()> {
    // 1. Sort activities by start date
    // 2. Validate dependencies are met
    // 3. Calculate proportional sizing data
}
```

## Implementation Tasks

### Phase 1: Core Models
- [ ] Create project_management.rs models file
- [ ] Implement SurrealDB schema initialization
- [ ] Add model validation and constraints
- [ ] Create database migration scripts

### Phase 2: CRUD APIs
- [ ] Implement project CRUD operations
- [ ] Implement activity CRUD operations  
- [ ] Implement server inventory CRUD operations
- [ ] Add free hardware pool management

### Phase 3: Business Logic
- [ ] Implement capacity sizing calculations
- [ ] Add dependency validation logic
- [ ] Create timeline recalculation algorithms
- [ ] Add hardware recommendation engine

### Phase 4: Integration
- [ ] Integrate with existing hardware basket models
- [ ] Add wizard config serialization/deserialization
- [ ] Implement RVTools import functionality
- [ ] Add server allocation/deallocation logic

## Testing Requirements
- Unit tests for all model validation
- Integration tests for API endpoints
- Capacity calculation algorithm tests
- Dependency validation tests
- Timeline recalculation tests

## Files to Create/Modify
- `core-engine/src/models/project_management.rs` (new)
- `backend/src/api/project_management.rs` (new)
- `backend/src/main.rs` (modify to add routes)
- `core-engine/src/models/mod.rs` (modify exports)

## Dependencies
- Existing: `surrealdb`, `serde`, `chrono`, `uuid`
- Required: `axum`, `anyhow`, `thiserror`

## Acceptance Criteria
- [ ] All data models compile and validate correctly
- [ ] CRUD operations work for all entities
- [ ] Capacity sizing calculates correct recommendations
- [ ] Dependency validation prevents circular references
- [ ] Timeline recalculation maintains proper ordering
- [ ] RVTools import populates server inventory
- [ ] Free hardware pool tracks availability correctly

## Architecture Notes
Follow existing patterns from hardware_basket.rs models. Reuse HardwareSpecifications from existing models. Ensure Thing ID handling matches existing SurrealDB patterns. Use existing error handling patterns from hardware_baskets.rs API.

## Related Files
- Reference: `core-engine/src/models/hardware_basket.rs`
- Reference: `backend/src/api/hardware_baskets.rs`  
- Integration: `frontend/src/types/hardwareBasketTypes.ts`