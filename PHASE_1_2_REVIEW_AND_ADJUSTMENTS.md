# Activity Wizard - Phase 1 & 2 Review and Adjustments

**Date:** January 2025  
**Reviewers:** AI Agent + User  
**Status:** 🔍 Under Review

---

## Executive Summary

Both Phase 1 (Backend) and Phase 2 (Frontend) specifications are comprehensive and well-structured. However, this review has identified **12 critical gaps** and **3 major integration issues** that must be addressed before implementation begins.

**Key Findings:**
- ✅ **Strengths**: Clear component architecture, solid state management design, comprehensive wizard flow
- ⚠️ **Critical Gaps**: Missing backend services (Timeline, Capacity), undefined strategy creation flow, type mismatches
- 🔧 **Recommendations**: Enhance Phase 1 with missing services, align type definitions, clarify RVTools integration

---

## 1. Type System Alignment Issues

### Issue: Enum Naming Conventions Mismatch

**Backend (Rust):**
```rust
pub enum ActivityType {
    Migration,
    Lifecycle,
    Decommission,
    Expansion,
    Maintenance,
}

pub enum InfrastructureType {
    Traditional,
    HciS2d,
    AzureLocal,
}
```

**Frontend (TypeScript):**
```typescript
type ActivityType = 'migration' | 'lifecycle' | 'decommission' | 'expansion' | 'maintenance';
type InfrastructureType = 'traditional' | 'hci_s2d' | 'azure_local';
```

### Problem
- Rust uses PascalCase enum variants
- TypeScript uses lowercase strings
- JSON serialization/deserialization will require explicit mapping
- Prone to runtime errors if not handled correctly

### Solution: Use Serde Rename Attributes

**Updated Backend (Phase 1):**
```rust
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ActivityType {
    Migration,
    Lifecycle,
    Decommission,
    Expansion,
    Maintenance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InfrastructureType {
    Traditional,
    HciS2d,
    AzureLocal,
}
```

**Action Items:**
- [ ] Add `#[serde(rename_all = "lowercase")]` to ActivityType
- [ ] Add `#[serde(rename_all = "snake_case")]` to InfrastructureType
- [ ] Update all enum definitions in Phase 1 spec
- [ ] Verify frontend types match serialized output

---

## 2. Missing Backend Services

### Issue: Two Critical Services Not Implemented

Phase 1 specification mentions but does not implement:
1. **TimelineEstimationService** (required by Step 6)
2. **CapacityValidationService** (required by Step 5)

### Impact
- Frontend Step 5 (Capacity Validation) cannot function
- Frontend Step 6 (Timeline & Resources) cannot function
- Wizard cannot complete successfully

### Solution: Add Services to Phase 1

#### A. TimelineEstimationService

**File:** `backend/src/services/timeline_estimation_service.rs`

```rust
use serde::{Deserialize, Serialize};
use chrono::{Duration, NaiveDate};

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineEstimationRequest {
    pub vm_count: u32,
    pub host_count: u32,
    pub infrastructure_type: InfrastructureType,
    pub has_compatibility_issues: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineEstimationResult {
    pub estimated_days: u32,
    pub task_breakdown: Vec<TaskEstimate>,
    pub critical_path: Vec<String>,
    pub confidence: EstimationConfidence,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskEstimate {
    pub name: String,
    pub duration_days: u32,
    pub dependencies: Vec<String>,
    pub is_critical_path: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EstimationConfidence {
    High,    // 90%+ confidence
    Medium,  // 70-89% confidence
    Low,     // <70% confidence
}

pub struct TimelineEstimationService;

impl TimelineEstimationService {
    pub async fn estimate_migration_timeline(
        request: TimelineEstimationRequest,
    ) -> Result<TimelineEstimationResult, Box<dyn std::error::Error>> {
        // Base time calculations
        let prep_days = Self::calculate_prep_time(&request);
        let migration_days = Self::calculate_migration_time(&request);
        let validation_days = Self::calculate_validation_time(&request);
        
        let total_days = prep_days + migration_days + validation_days;
        
        // Task breakdown
        let tasks = vec![
            TaskEstimate {
                name: "Infrastructure Preparation".to_string(),
                duration_days: prep_days,
                dependencies: vec![],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Hardware Deployment".to_string(),
                duration_days: 5,
                dependencies: vec!["Infrastructure Preparation".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Cluster Configuration".to_string(),
                duration_days: 3,
                dependencies: vec!["Hardware Deployment".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "VM Migration".to_string(),
                duration_days: migration_days,
                dependencies: vec!["Cluster Configuration".to_string()],
                is_critical_path: true,
            },
            TaskEstimate {
                name: "Testing & Validation".to_string(),
                duration_days: validation_days,
                dependencies: vec!["VM Migration".to_string()],
                is_critical_path: true,
            },
        ];
        
        // Critical path (all tasks in this simplified model)
        let critical_path: Vec<String> = tasks
            .iter()
            .filter(|t| t.is_critical_path)
            .map(|t| t.name.clone())
            .collect();
        
        // Confidence calculation
        let confidence = if request.has_compatibility_issues {
            EstimationConfidence::Low
        } else if request.vm_count > 500 {
            EstimationConfidence::Medium
        } else {
            EstimationConfidence::High
        };
        
        Ok(TimelineEstimationResult {
            estimated_days: total_days,
            task_breakdown: tasks,
            critical_path,
            confidence,
        })
    }
    
    fn calculate_prep_time(request: &TimelineEstimationRequest) -> u32 {
        match request.infrastructure_type {
            InfrastructureType::Traditional => 7,
            InfrastructureType::HciS2d => 10,
            InfrastructureType::AzureLocal => 14,
        }
    }
    
    fn calculate_migration_time(request: &TimelineEstimationRequest) -> u32 {
        // Base: 10 VMs per day with traditional tools
        let base_vm_rate = 10.0;
        
        // Adjust rate based on infrastructure type
        let vm_rate = match request.infrastructure_type {
            InfrastructureType::Traditional => base_vm_rate,
            InfrastructureType::HciS2d => base_vm_rate * 1.5,      // Faster with S2D
            InfrastructureType::AzureLocal => base_vm_rate * 1.3,  // Slightly faster
        };
        
        let days = (request.vm_count as f64 / vm_rate).ceil() as u32;
        
        // Add buffer for compatibility issues
        if request.has_compatibility_issues {
            days + (days / 4) // Add 25% buffer
        } else {
            days
        }
    }
    
    fn calculate_validation_time(request: &TimelineEstimationRequest) -> u32 {
        // Base validation: 1 week
        let base_days = 7;
        
        // Scale with complexity
        if request.vm_count > 200 {
            base_days + 3
        } else if request.vm_count > 100 {
            base_days + 2
        } else {
            base_days
        }
    }
}
```

#### B. CapacityValidationService

**File:** `backend/src/services/capacity_validation_service.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CapacityValidationRequest {
    pub source_cluster_id: String,
    pub target_hardware: TargetHardware,
    pub overcommit_ratios: OvercommitRatios,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TargetHardware {
    pub host_count: u32,
    pub cpu_per_host: u32,      // Physical cores
    pub memory_per_host_gb: u32,
    pub storage_per_host_tb: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OvercommitRatios {
    pub cpu: f64,     // Default: 4.0 (4:1)
    pub memory: f64,  // Default: 1.5 (1.5:1)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CapacityValidationResult {
    pub status: ValidationStatus,
    pub cpu: ResourceValidation,
    pub memory: ResourceValidation,
    pub storage: ResourceValidation,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ValidationStatus {
    Optimal,     // <60% utilization
    Acceptable,  // 60-80% utilization
    Warning,     // 80-95% utilization
    Critical,    // >95% utilization
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResourceValidation {
    pub required: f64,
    pub available: f64,
    pub utilization_percent: f64,
    pub status: ResourceStatus,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResourceStatus {
    Ok,
    Warning,
    Critical,
}

pub struct CapacityValidationService;

impl CapacityValidationService {
    pub async fn validate_capacity(
        request: CapacityValidationRequest,
    ) -> Result<CapacityValidationResult, Box<dyn std::error::Error>> {
        // Fetch source cluster workload data
        let workload = Self::fetch_workload_summary(&request.source_cluster_id).await?;
        
        // Calculate available capacity with overcommit
        let available_cpu = request.target_hardware.cpu_per_host as f64
            * request.target_hardware.host_count as f64
            * request.overcommit_ratios.cpu;
        
        let available_memory = request.target_hardware.memory_per_host_gb as f64
            * request.target_hardware.host_count as f64
            * request.overcommit_ratios.memory;
        
        let available_storage = request.target_hardware.storage_per_host_tb
            * request.target_hardware.host_count as f64;
        
        // CPU validation
        let cpu = Self::validate_resource(
            workload.total_cpu_cores as f64,
            available_cpu,
            "CPU",
        );
        
        // Memory validation
        let memory = Self::validate_resource(
            workload.total_memory_gb as f64,
            available_memory,
            "Memory",
        );
        
        // Storage validation (no overcommit)
        let storage = Self::validate_resource(
            workload.total_storage_tb,
            available_storage,
            "Storage",
        );
        
        // Overall status
        let status = Self::determine_overall_status(&cpu, &memory, &storage);
        
        // Generate recommendations
        let recommendations = Self::generate_recommendations(&cpu, &memory, &storage, &request);
        
        Ok(CapacityValidationResult {
            status,
            cpu,
            memory,
            storage,
            recommendations,
        })
    }
    
    fn validate_resource(required: f64, available: f64, resource_name: &str) -> ResourceValidation {
        let utilization = (required / available) * 100.0;
        
        let (status, message) = if utilization < 60.0 {
            (ResourceStatus::Ok, format!("{} capacity is excellent with room for growth", resource_name))
        } else if utilization < 80.0 {
            (ResourceStatus::Ok, format!("{} capacity is good", resource_name))
        } else if utilization < 95.0 {
            (ResourceStatus::Warning, format!("{} capacity is approaching limits", resource_name))
        } else {
            (ResourceStatus::Critical, format!("{} capacity is insufficient", resource_name))
        };
        
        ResourceValidation {
            required,
            available,
            utilization_percent: utilization,
            status,
            message,
        }
    }
    
    fn determine_overall_status(
        cpu: &ResourceValidation,
        memory: &ResourceValidation,
        storage: &ResourceValidation,
    ) -> ValidationStatus {
        let max_utilization = cpu.utilization_percent
            .max(memory.utilization_percent)
            .max(storage.utilization_percent);
        
        if max_utilization >= 95.0 {
            ValidationStatus::Critical
        } else if max_utilization >= 80.0 {
            ValidationStatus::Warning
        } else if max_utilization >= 60.0 {
            ValidationStatus::Acceptable
        } else {
            ValidationStatus::Optimal
        }
    }
    
    fn generate_recommendations(
        cpu: &ResourceValidation,
        memory: &ResourceValidation,
        storage: &ResourceValidation,
        request: &CapacityValidationRequest,
    ) -> Vec<String> {
        let mut recommendations = Vec::new();
        
        if cpu.utilization_percent > 80.0 {
            recommendations.push(format!(
                "Consider adding {} more hosts for better CPU headroom",
                ((cpu.utilization_percent - 70.0) / 10.0).ceil() as u32
            ));
        }
        
        if memory.utilization_percent > 80.0 {
            let additional_gb = (memory.required - (memory.available * 0.7)).ceil() as u32;
            recommendations.push(format!(
                "Consider adding {} GB more memory across hosts",
                additional_gb
            ));
        }
        
        if storage.utilization_percent > 80.0 {
            let additional_tb = (storage.required - (storage.available * 0.7)).ceil();
            recommendations.push(format!(
                "Consider adding {:.1} TB more storage capacity",
                additional_tb
            ));
        }
        
        if recommendations.is_empty() {
            recommendations.push("Capacity planning looks excellent! No immediate concerns.".to_string());
        }
        
        recommendations
    }
    
    async fn fetch_workload_summary(
        cluster_id: &str,
    ) -> Result<WorkloadSummary, Box<dyn std::error::Error>> {
        // TODO: Integrate with RVTools service
        // This is a placeholder
        Ok(WorkloadSummary {
            total_cpu_cores: 0,
            total_memory_gb: 0,
            total_storage_tb: 0.0,
        })
    }
}

#[derive(Debug)]
struct WorkloadSummary {
    total_cpu_cores: u32,
    total_memory_gb: u32,
    total_storage_tb: f64,
}
```

**Action Items:**
- [ ] Add TimelineEstimationService to Phase 1 spec
- [ ] Add CapacityValidationService to Phase 1 spec
- [ ] Create API endpoints for both services
- [ ] Add service initialization in main.rs

---

## 3. Missing API Endpoints

### Issue: Frontend Needs Additional Endpoints

Phase 2 frontend requires endpoints not defined in Phase 1:

1. **GET /api/v1/wizard/:id/compatibility** - Real-time compatibility check
2. **GET /api/v1/wizard/:id/capacity** - Real-time capacity validation
3. **GET /api/v1/wizard/:id/timeline** - Timeline estimation
4. **GET /api/v1/hardware/baskets** - List hardware baskets (may exist)
5. **GET /api/v1/hardware/baskets/:id/models** - List models in basket (may exist)
6. **GET /api/v1/rvtools/clusters** - List available clusters from RVTools
7. **GET /api/v1/rvtools/clusters/:id/summary** - Cluster workload summary

### Solution: Add Endpoints to Phase 1

**File:** `backend/src/api/wizard.rs` (additions)

```rust
// Real-time compatibility check
async fn check_compatibility(
    Path(activity_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<HardwareCompatibilityResult>, StatusCode> {
    let activity = state.db.get_activity(&activity_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    
    let wizard_data = activity.wizard_state
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let step3 = wizard_data.step_data.get("step3")
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let infra_type = step3.get("infrastructure_type")
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let result = HardwareCompatibilityService::check_hci_compatibility(
        infra_type.clone(),
        vec![], // TODO: Get actual hardware specs
    ).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(result))
}

// Real-time capacity validation
async fn check_capacity(
    Path(activity_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<CapacityValidationResult>, StatusCode> {
    let activity = state.db.get_activity(&activity_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    
    // Extract wizard data and validate capacity
    // TODO: Implement full logic
    
    Ok(Json(CapacityValidationResult {
        status: ValidationStatus::Optimal,
        cpu: ResourceValidation { /* ... */ },
        memory: ResourceValidation { /* ... */ },
        storage: ResourceValidation { /* ... */ },
        recommendations: vec![],
    }))
}

// Timeline estimation
async fn estimate_timeline(
    Path(activity_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<TimelineEstimationResult>, StatusCode> {
    let activity = state.db.get_activity(&activity_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    
    // Extract wizard data and estimate timeline
    // TODO: Implement full logic
    
    Ok(Json(TimelineEstimationResult {
        estimated_days: 30,
        task_breakdown: vec![],
        critical_path: vec![],
        confidence: EstimationConfidence::Medium,
    }))
}

// Register routes
pub fn wizard_routes() -> Router<AppState> {
    Router::new()
        .route("/wizard/start", post(start_wizard))
        .route("/wizard/:id/progress", put(save_progress))
        .route("/wizard/:id/draft", get(get_draft))
        .route("/wizard/:id/complete", post(complete_wizard))
        // NEW ENDPOINTS
        .route("/wizard/:id/compatibility", get(check_compatibility))
        .route("/wizard/:id/capacity", get(check_capacity))
        .route("/wizard/:id/timeline", get(estimate_timeline))
}
```

**Action Items:**
- [ ] Add 3 new wizard endpoints to Phase 1 spec
- [ ] Check if hardware basket endpoints exist (likely yes)
- [ ] Add RVTools integration endpoints (may need separate service)
- [ ] Document all response formats with JSON examples

---

## 4. Strategy Creation Flow (CRITICAL)

### Issue: Undefined When/How Strategies Are Created

**Current Ambiguity:**
- Integration plan says "1 activity → multiple strategies"
- Wizard collects data for ONE cluster migration
- No specification of when/how ClusterStrategy records are created

**Questions:**
1. Does the wizard create strategies automatically on completion?
2. Does the user create strategies separately after wizard?
3. Can the wizard be run multiple times for the same activity?
4. How does "multiple strategies" work in practice?

### Solution: Define Strategy Creation Flow

**Recommended Approach:**

#### Option A: Wizard Creates ONE Strategy (Recommended)
```
User Flow:
1. Complete 7-step wizard → Creates Activity + ONE ClusterStrategy
2. To add more strategies: Click "Add Strategy" button on activity → Launches simplified wizard
3. Simplified wizard: Steps 2-6 only (reuses activity name/type from Step 1)
4. Multiple strategies link to same activity_id
```

**Benefits:**
- Clear, predictable flow
- Reuses wizard infrastructure
- Aligns with "1 activity → many strategies" model

#### Option B: Wizard Creates Multiple Strategies in One Session
```
User Flow:
1. Steps 1-7 as defined
2. At Step 7: "Add Another Strategy?" button
3. If clicked: Loop back to Step 2, keep Step 1 data
4. Complete creates activity + all strategies at once
```

**Benefits:**
- Single session for complex migrations
- No need to "re-enter" wizard

**Drawbacks:**
- More complex state management
- Harder to implement draft/resume
- Confusing UX for review step

### Recommendation: Option A

**Implementation:**

1. **Phase 1 Backend Change:**
```rust
// In complete_wizard endpoint
async fn complete_wizard(
    Path(activity_id): Path<String>,
    Json(request): Json<CompleteWizardRequest>,
    State(state): State<AppState>,
) -> Result<Json<CompleteWizardResponse>, StatusCode> {
    // ... existing validation ...
    
    // Create the ClusterStrategy from wizard data
    let strategy = ClusterStrategy {
        id: None,
        activity_id: activity.id.clone(),
        name: format!("{} - Strategy 1", activity.name),
        source_cluster_id: wizard_data.step2.source_cluster,
        target_cluster_name: wizard_data.step2.target_cluster_name,
        hardware_strategy: wizard_data.step2.hardware_strategy,
        infrastructure_type: wizard_data.step3.infrastructure_type,
        hardware_basket_id: wizard_data.step4.hardware_basket_id,
        compatibility_checks: Some(/* fetched from compatibility service */),
        capacity_validation: Some(/* fetched from capacity service */),
        status: StrategyStatus::Planned,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    // Save strategy to database
    let strategy_id = state.db.create_cluster_strategy(&strategy).await?;
    
    // Update activity with strategy reference
    activity.strategy_ids.push(strategy_id.clone());
    state.db.update_activity(&activity).await?;
    
    Ok(Json(CompleteWizardResponse {
        activity_id: activity.id.unwrap().to_string(),
        strategy_id: strategy_id.to_string(),
    }))
}
```

2. **Phase 2 Frontend Change:**
```typescript
// After wizard completion
const handleWizardComplete = async (response: CompleteWizardResponse) => {
  // Show success message
  toast.success('Activity created successfully!');
  
  // Navigate to activity detail view
  navigate(`/projects/${projectId}/activities/${response.activity_id}`);
};

// In activity detail view, add:
<Button
  appearance="primary"
  icon={<Add20Regular />}
  onClick={() => setShowStrategyWizard(true)}
>
  Add Another Strategy
</Button>

// Simplified strategy wizard (Steps 2-6 only)
{showStrategyWizard && (
  <StrategyWizard
    activityId={activityId}
    activityName={activity.name}
    activityType={activity.activity_type}
    onComplete={handleStrategyAdded}
  />
)}
```

**Action Items:**
- [ ] Update Phase 1: Add strategy creation to complete_wizard
- [ ] Update Phase 2: Document simplified strategy wizard
- [ ] Add "Add Strategy" UI to activity detail view
- [ ] Update integration plan with chosen approach

---

## 5. RVTools Integration Specification

### Issue: Assumed but Not Specified

Both phases reference RVTools data but don't specify:
- How clusters are fetched
- How workload data is retrieved
- How compatibility checks access hardware specs
- API contracts

### Solution: Define RVTools Integration Layer

**Existing RVTools Service:**
Need to verify what already exists. Based on earlier sessions, there likely is:
- POST /api/v1/rvtools/upload (upload Excel)
- GET /api/v1/projects/:id/clusters (list clusters)

**Required New Endpoints:**

```rust
// GET /api/v1/rvtools/clusters
#[derive(Debug, Serialize)]
pub struct ClusterSummary {
    pub id: String,
    pub name: String,
    pub vcenter: String,
    pub host_count: u32,
    pub vm_count: u32,
    pub total_cpu_cores: u32,
    pub total_memory_gb: u32,
    pub total_storage_tb: f64,
}

async fn list_clusters(
    State(state): State<AppState>,
) -> Result<Json<Vec<ClusterSummary>>, StatusCode> {
    // Query SurrealDB for all clusters
    let clusters = state.db.list_clusters().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(clusters))
}

// GET /api/v1/rvtools/clusters/:id/details
#[derive(Debug, Serialize)]
pub struct ClusterDetails {
    pub summary: ClusterSummary,
    pub hosts: Vec<HostDetails>,
    pub vms: Vec<VmDetails>,
    pub hardware_specs: HardwareSpecs,
}

#[derive(Debug, Serialize)]
pub struct HardwareSpecs {
    pub has_rdma_nics: bool,
    pub has_jbod_hba: bool,
    pub network_speed_gbps: u32,
    pub disk_configuration: DiskConfiguration,
}

async fn get_cluster_details(
    Path(cluster_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ClusterDetails>, StatusCode> {
    // Fetch detailed cluster information
    let details = state.db.get_cluster_details(&cluster_id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    
    Ok(Json(details))
}
```

**Frontend Integration:**

```typescript
// In WizardContext
useEffect(() => {
  const fetchClusters = async () => {
    setLoadingClusters(true);
    try {
      const response = await fetch('/api/v1/rvtools/clusters');
      const clusters = await response.json();
      setProjectClusters(clusters);
    } catch (error) {
      console.error('Failed to fetch clusters:', error);
    } finally {
      setLoadingClusters(false);
    }
  };
  
  fetchClusters();
}, []);

// When source cluster selected
const handleSourceClusterChange = async (clusterId: string) => {
  updateStepData(2, { sourceCluster: clusterId });
  
  // Fetch detailed cluster info for compatibility checks
  setLoadingCompatibility(true);
  try {
    const response = await fetch(`/api/v1/rvtools/clusters/${clusterId}/details`);
    const details = await response.json();
    setClusterDetails(details);
  } catch (error) {
    console.error('Failed to fetch cluster details:', error);
  } finally {
    setLoadingCompatibility(false);
  }
};
```

**Action Items:**
- [ ] Verify existing RVTools endpoints
- [ ] Add missing endpoints to Phase 1 spec
- [ ] Update frontend WizardContext with RVTools integration
- [ ] Document RVTools data flow diagram

---

## 6. API Response Format Specification

### Issue: Response Formats Not Documented

Phase 1 shows request types but not response formats. Frontend needs to know exact JSON structure.

### Solution: Document All Response Formats

**Example: Start Wizard Response**

```json
{
  "success": true,
  "data": {
    "activity_id": "activity:abc123",
    "wizard_state": {
      "current_step": 1,
      "step_data": {},
      "last_saved": "2025-01-15T10:30:00Z",
      "expires_at": "2025-02-14T10:30:00Z"
    }
  }
}
```

**Example: Compatibility Check Response**

```json
{
  "success": true,
  "data": {
    "status": "warnings",
    "checks": {
      "rdma_nics": {
        "status": "passed",
        "message": "RDMA NICs detected: Mellanox ConnectX-5",
        "details": {
          "nic_count": 2,
          "nic_model": "Mellanox ConnectX-5",
          "rdma_type": "RoCE"
        }
      },
      "jbod_hba": {
        "status": "warning",
        "message": "JBOD mode not confirmed",
        "details": {
          "controller": "Dell PERC H740P",
          "mode": "RAID"
        }
      },
      "network_speed": {
        "status": "passed",
        "message": "Network speed meets requirements: 25 Gbps",
        "details": {
          "speed_gbps": 25
        }
      },
      "jbod_disks": {
        "status": "passed",
        "message": "Sufficient SSDs available",
        "details": {
          "ssd_count": 8,
          "total_capacity_tb": 12.8
        }
      }
    },
    "recommendations": [
      "Consider configuring PERC H740P in HBA mode for optimal S2D performance",
      "Ensure RDMA is enabled in BIOS and Windows"
    ],
    "can_proceed": true
  }
}
```

**Action Items:**
- [ ] Add response format examples for ALL Phase 1 endpoints
- [ ] Update TypeScript types to match exact response structure
- [ ] Add error response formats
- [ ] Document HTTP status codes

---

## 7. Error Handling Specification

### Issue: Frontend Error Handling Not Specified

Phase 2 doesn't specify how to handle:
- Draft expired (410 Gone)
- Validation failed (422 Unprocessable Entity)
- Server errors (500)
- Network failures

### Solution: Add Error Handling to Phase 2

**Backend Error Responses:**

```rust
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub success: false,
    pub error: {
        pub code: String,
        pub message: String,
        pub details: Option<serde_json::Value>,
    }
}

// Example: Draft expired
StatusCode::GONE => ErrorResponse {
    success: false,
    error: {
        code: "DRAFT_EXPIRED",
        message: "This draft activity expired after 30 days of inactivity",
        details: Some(json!({
            "expired_at": "2025-01-15T10:30:00Z",
        })),
    }
}
```

**Frontend Error Handling:**

```typescript
// In WizardContext
const loadDraft = useCallback(async (activityId: string) => {
  try {
    const response = await fetch(`/api/v1/wizard/${activityId}/draft`);
    
    if (response.status === 410) {
      // Draft expired
      toast.error('This draft has expired. Starting a new activity...', {
        duration: 5000,
      });
      setActivityId(null);
      setCurrentStep(1);
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to load draft');
    }
    
    const data = await response.json();
    setWizardData(data.wizard_state.step_data);
    setCurrentStep(data.wizard_state.current_step);
  } catch (error) {
    console.error('Error loading draft:', error);
    toast.error('Failed to load draft activity');
  }
}, []);
```

**Action Items:**
- [ ] Define error response format in Phase 1
- [ ] Add error handling to all Phase 2 async operations
- [ ] Add toast notification library (react-hot-toast or similar)
- [ ] Document error recovery strategies

---

## 8. Missing Activity Model Fields

### Issue: User Assignment Not in Backend Model

Frontend Step 6 has team member assignment, but backend Activity model doesn't support it.

### Solution: Enhance Activity Model

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    // ... existing fields ...
    
    // NEW FIELDS
    pub assigned_users: Vec<String>,  // User IDs
    pub team_lead: Option<String>,    // User ID of team lead
    pub estimated_start_date: Option<NaiveDate>,
    pub estimated_end_date: Option<NaiveDate>,
    pub actual_start_date: Option<NaiveDate>,
    pub actual_end_date: Option<NaiveDate>,
}
```

**Action Items:**
- [ ] Add user-related fields to Activity model in Phase 1
- [ ] Update database schema
- [ ] Add user selection to Step 6 in Phase 2
- [ ] Fetch available users from backend

---

## 9. Implementation Timeline Adjustments

### Current Timeline (from Integration Plan)
- **Phase 1 (Backend):** 2 weeks
- **Phase 2 (Frontend):** 2 weeks
- **Phase 3 (Swimlane):** 1 week
- **Phase 4 (Integration):** 1 week
- **Phase 5 (Testing & Polish):** 2 weeks
- **Total:** 8 weeks

### Recommended Adjustments

Given the additional work identified:

#### Phase 1 (Backend): 2 weeks → **3 weeks**
- Add TimelineEstimationService
- Add CapacityValidationService
- Add missing API endpoints
- Add RVTools integration endpoints
- Enhance Activity model
- Write comprehensive tests

#### Phase 2 (Frontend): 2 weeks → **2.5 weeks**
- Implement all 7 steps
- Add error handling
- Add real-time validation
- Integration testing with Phase 1

#### Total: 8 weeks → **9.5 weeks**

**Action Items:**
- [ ] Update project timeline
- [ ] Communicate adjusted schedule to stakeholders

---

## 10. Phase 1 Implementation Priorities

### Must Have (P0) - Cannot proceed without
- [x] Activity model with ActivityType, ActivityStatus, WizardState
- [x] ClusterStrategy model with InfrastructureType
- [x] WizardService (draft, save, resume, complete)
- [x] HardwareCompatibilityService
- [ ] **TimelineEstimationService** (NEW)
- [ ] **CapacityValidationService** (NEW)
- [ ] Wizard API endpoints (start, progress, draft, complete)
- [ ] **Real-time check endpoints** (compatibility, capacity, timeline)
- [ ] Serde rename attributes for enum consistency

### Should Have (P1) - Important for UX
- [ ] RVTools integration endpoints
- [ ] Error response formatting
- [ ] Strategy creation in complete_wizard
- [ ] User assignment fields in Activity model
- [ ] Draft expiration cleanup task

### Nice to Have (P2) - Can be added later
- [ ] Advanced timeline confidence calculation
- [ ] Capacity recommendation AI
- [ ] Historical data for estimation improvements

---

## 11. Phase 2 Implementation Priorities

### Must Have (P0)
- [ ] WizardContext with state management
- [ ] All 7 step components (basic functionality)
- [ ] WizardProgress indicator
- [ ] WizardNavigation (back/next/save)
- [ ] Auto-save functionality
- [ ] Basic error handling

### Should Have (P1)
- [ ] CompatibilityChecker component
- [ ] CapacityValidator component
- [ ] HardwareSelector component
- [ ] TimelineCalculator component
- [ ] Toast notifications
- [ ] Loading states
- [ ] Validation error display

### Nice to Have (P2)
- [ ] Animations and transitions
- [ ] Drag-and-drop for hardware selection
- [ ] Advanced timeline visualization
- [ ] Mobile responsive design
- [ ] Accessibility enhancements

---

## 12. Testing Strategy

### Phase 1 Backend Testing
```bash
# Unit tests for services
cargo test services::wizard_service
cargo test services::hardware_compatibility_service
cargo test services::timeline_estimation_service
cargo test services::capacity_validation_service

# Integration tests for API endpoints
cargo test api::wizard --features integration_tests

# Load testing
cargo bench wizard_endpoints
```

### Phase 2 Frontend Testing
```bash
# Component tests
npm test -- WizardContext
npm test -- ActivityWizard
npm test -- Steps

# E2E tests
npm run test:e2e -- wizard-flow

# Visual regression testing
npm run test:visual -- wizard
```

---

## Summary of Required Changes

### Phase 1 Backend Additions
1. ✅ Already Complete: Activity model, ClusterStrategy model, WizardService, HardwareCompatibilityService
2. ❌ **Add TimelineEstimationService** (NEW - 200 lines)
3. ❌ **Add CapacityValidationService** (NEW - 250 lines)
4. ❌ **Add 3 real-time check endpoints** (NEW - 150 lines)
5. ❌ **Add serde rename attributes** (MODIFY - 10 lines)
6. ❌ **Enhance Activity model with user fields** (MODIFY - 20 lines)
7. ❌ **Add strategy creation to complete_wizard** (MODIFY - 50 lines)
8. ❌ **Document response formats** (DOCUMENTATION)

**Total New Code:** ~700 lines  
**Total Modifications:** ~80 lines  
**Adjusted Timeline:** 3 weeks (from 2 weeks)

### Phase 2 Frontend Additions
1. ✅ Already Complete: All component specifications, type definitions
2. ❌ **Align TypeScript types with backend** (MODIFY - 20 lines)
3. ❌ **Add error handling** (MODIFY - 100 lines)
4. ❌ **Add real-time API integration** (MODIFY - 150 lines)
5. ❌ **Add toast notifications** (NEW - 50 lines)
6. ❌ **Complete all 7 step implementations** (NEW - implementations not fully detailed)

**Total Modifications:** ~320 lines  
**Adjusted Timeline:** 2.5 weeks (from 2 weeks)

---

## Recommendations

### 🔴 Critical (Must Address Before Implementation)
1. Add TimelineEstimationService to Phase 1
2. Add CapacityValidationService to Phase 1
3. Define strategy creation flow (Option A recommended)
4. Align type definitions between Rust and TypeScript
5. Add real-time check endpoints

### 🟡 Important (Address During Implementation)
6. Document all API response formats
7. Add comprehensive error handling
8. Enhance Activity model with user fields
9. Add RVTools integration endpoints

### 🟢 Nice to Have (Can Be Deferred)
10. Advanced timeline confidence calculation
11. Mobile responsive design
12. Advanced accessibility features

---

## Next Steps

**For Review Session:**
1. Review this document with user
2. Confirm strategy creation approach (Option A vs B)
3. Confirm adjusted timeline (9.5 weeks vs 8 weeks)
4. Prioritize P0/P1/P2 items
5. Decide: Start Phase 1 implementation or make more adjustments?

**If Approved:**
1. Update Phase 1 spec with missing services and endpoints
2. Update Phase 2 spec with type alignments and error handling
3. Create implementation task breakdown
4. Begin Phase 1 coding

---

**Review Status:** 🔍 Awaiting User Feedback  
**Recommended Action:** Approve with adjustments, then proceed to Phase 1 implementation
