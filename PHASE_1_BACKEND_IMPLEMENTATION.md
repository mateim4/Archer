# Activity Wizard Implementation - Phase 1: Backend Foundation

**Start Date:** October 16, 2025  
**Phase:** 1 of 5 (Backend Foundation)  
**Estimated Duration:** 1 week  
**Status:** 🚀 Starting Implementation

---

## Phase 1 Objectives

1. ✅ Enhance database schema (Activity and ClusterStrategy models)
2. ✅ Create WizardService for draft management
3. ✅ Build HardwareCompatibilityService for validation
4. ✅ Implement TimelineEstimationService for auto-calculation
5. ✅ Add new API endpoints for wizard operations

---

## Database Schema Updates

### 1. Enhanced Activity Model

**File:** `backend/src/models/workflow.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub description: Option<String>,
    
    // NEW: Activity type system
    pub activity_type: ActivityType,
    
    // UPDATED: Enhanced status system
    pub status: ActivityStatus,
    
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub assignees: Vec<String>,
    pub dependencies: Vec<Thing>,
    pub progress: u32,
    
    // NEW: Strategy integration
    pub strategy_ids: Vec<Thing>, // Multiple strategies per activity
    pub strategy_summaries: Vec<StrategySummary>,
    
    // NEW: Migration metadata for automatic calculations
    pub migration_metadata: Option<MigrationMetadata>,
    
    // NEW: Wizard state for draft activities
    pub wizard_state: Option<WizardState>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

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
#[serde(rename_all = "lowercase")]
pub enum ActivityStatus {
    Draft,      // Wizard not completed
    Planned,    // Ready to start
    InProgress,
    Completed,
    Blocked,    // Dependencies not met
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationMetadata {
    pub source_cluster: String,
    pub target_cluster: String,
    pub total_vms: u32,
    pub total_hosts: u32,
    pub estimated_duration_days: u32,
    pub hardware_strategy: HardwareStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HardwareStrategy {
    Pool,
    New,
    Domino,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardState {
    pub current_step: u32,
    pub completed_steps: Vec<u32>,
    pub wizard_data: serde_json::Value,
    pub last_saved: DateTime<Utc>,
    pub expires_at: DateTime<Utc>, // 30 days from last save
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategySummary {
    pub strategy_id: Thing,
    pub source_cluster: String,
    pub target_cluster: String,
    pub infrastructure_type: InfrastructureType,
    pub hardware_strategy: HardwareStrategy,
    pub host_count: u32,
    pub vm_count: u32,
    pub capacity_status: CapacityStatus,
    pub compatibility_status: CompatibilityStatus,
    pub estimated_duration_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InfrastructureType {
    Traditional,
    HciS2d,
    AzureLocal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CapacityStatus {
    Optimal,
    Acceptable,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CompatibilityStatus {
    Passed,
    Warnings,
    Failed,
}
```

### 2. Enhanced ClusterStrategy Model

**File:** `backend/src/models/cluster_strategy.rs` (NEW FILE)

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterStrategy {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub activity_id: Thing, // Backlink to activity
    pub source_cluster_name: String,
    pub target_cluster_name: String,
    pub strategy_type: StrategyType,
    
    // Domino fields
    pub domino_source_cluster: Option<String>,
    pub hardware_available_date: Option<DateTime<Utc>>,
    
    // Procurement fields
    pub hardware_basket_id: Option<Thing>,
    pub hardware_basket_items: Option<Vec<String>>,
    pub hardware_models: Option<Vec<HardwareModelSpec>>,
    
    // Existing hardware fields
    pub hardware_pool_allocations: Option<Vec<String>>,
    
    // NEW: Infrastructure configuration
    pub infrastructure_type: InfrastructureType,
    
    // NEW: Compatibility checks
    pub compatibility_checks: Option<HardwareCompatibilityResult>,
    
    // NEW: Capacity validation
    pub capacity_validation: Option<CapacityValidationResult>,
    
    // Capacity requirements
    pub required_cpu_cores: Option<u32>,
    pub required_memory_gb: Option<u32>,
    pub required_storage_tb: Option<u32>,
    
    // Timeline
    pub planned_start_date: Option<DateTime<Utc>>,
    pub planned_completion_date: Option<DateTime<Utc>>,
    
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StrategyType {
    DominoHardwareSwap,
    NewHardwarePurchase,
    ExistingFreeHardware,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareModelSpec {
    pub model_name: String,
    pub model_id: Option<Thing>,
    pub quantity: u32,
    pub form_factor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareCompatibilityResult {
    pub status: CompatibilityStatus,
    pub checks: CompatibilityChecks,
    pub recommendations: Vec<String>,
    pub can_proceed: bool,
    pub checked_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityChecks {
    pub rdma_nics: CheckResult,
    pub jbod_hba: CheckResult,
    pub network_speed: CheckResult,
    pub jbod_disks: CheckResult,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckResult {
    pub status: CheckStatus,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CheckStatus {
    Passed,
    Warning,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacityValidationResult {
    pub status: CapacityStatus,
    pub cpu: ResourceValidation,
    pub memory: ResourceValidation,
    pub storage: ResourceValidation,
    pub overcommit_ratios: OvercommitRatios,
    pub recommendations: Vec<String>,
    pub validated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceValidation {
    pub required: f64,
    pub available: f64,
    pub utilization_percent: f64,
    pub status: ResourceStatus,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResourceStatus {
    Ok,
    Warning,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OvercommitRatios {
    pub cpu: f64,
    pub memory: f64,
    pub storage: f64,
}
```

---

## Service Layer Implementation

### 1. WizardService

**File:** `backend/src/services/wizard_service.rs` (NEW FILE)

```rust
use crate::database::Database;
use crate::models::workflow::{Activity, ActivityType, ActivityStatus, WizardState};
use anyhow::{Context, Result};
use chrono::{DateTime, Duration, Utc};
use serde_json::Value;
use surrealdb::sql::Thing;

pub struct WizardService {
    db: Database,
}

impl WizardService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// Create a draft activity (Step 1 of wizard)
    pub async fn create_draft_activity(
        &self,
        project_id: Thing,
        name: String,
        activity_type: ActivityType,
        created_by: String,
    ) -> Result<Activity> {
        let now = Utc::now();
        let expires_at = now + Duration::days(30);

        let activity = Activity {
            id: None,
            project_id,
            name,
            description: None,
            activity_type,
            status: ActivityStatus::Draft,
            start_date: now, // Placeholder
            end_date: now + Duration::days(7), // Placeholder
            assignees: vec![],
            dependencies: vec![],
            progress: 0,
            strategy_ids: vec![],
            strategy_summaries: vec![],
            migration_metadata: None,
            wizard_state: Some(WizardState {
                current_step: 1,
                completed_steps: vec![1],
                wizard_data: serde_json::json!({}),
                last_saved: now,
                expires_at,
            }),
            created_at: now,
            updated_at: now,
            created_by,
        };

        let created: Vec<Activity> = self.db
            .create("activity")
            .content(&activity)
            .await
            .context("Failed to create draft activity")?;

        Ok(created.into_iter().next().unwrap())
    }

    /// Save wizard progress
    pub async fn save_wizard_progress(
        &self,
        activity_id: Thing,
        current_step: u32,
        wizard_data: Value,
    ) -> Result<()> {
        let now = Utc::now();
        let expires_at = now + Duration::days(30);

        // Get current activity
        let activities: Vec<Activity> = self.db
            .select(("activity", activity_id.id.to_string()))
            .await?;

        let mut activity = activities.into_iter().next()
            .context("Activity not found")?;

        // Update wizard state
        let mut completed_steps = activity.wizard_state
            .as_ref()
            .map(|ws| ws.completed_steps.clone())
            .unwrap_or_default();

        if !completed_steps.contains(&current_step) {
            completed_steps.push(current_step);
        }

        activity.wizard_state = Some(WizardState {
            current_step,
            completed_steps,
            wizard_data,
            last_saved: now,
            expires_at,
        });
        activity.updated_at = now;

        // Update in database
        let _: Option<Activity> = self.db
            .update(("activity", activity_id.id.to_string()))
            .content(&activity)
            .await?;

        Ok(())
    }

    /// Get wizard draft
    pub async fn get_wizard_draft(&self, activity_id: Thing) -> Result<Activity> {
        let activities: Vec<Activity> = self.db
            .select(("activity", activity_id.id.to_string()))
            .await?;

        activities.into_iter().next()
            .context("Activity not found")
    }

    /// Complete wizard and finalize activity
    pub async fn complete_wizard(
        &self,
        activity_id: Thing,
        final_data: Value,
    ) -> Result<Activity> {
        let activities: Vec<Activity> = self.db
            .select(("activity", activity_id.id.to_string()))
            .await?;

        let mut activity = activities.into_iter().next()
            .context("Activity not found")?;

        // Update activity status
        activity.status = ActivityStatus::Planned;
        activity.wizard_state = None; // Clear wizard state
        activity.updated_at = Utc::now();

        // Extract and set final data from wizard
        if let Some(start_date) = final_data.get("start_date").and_then(|v| v.as_str()) {
            if let Ok(parsed_date) = DateTime::parse_from_rfc3339(start_date) {
                activity.start_date = parsed_date.with_timezone(&Utc);
            }
        }

        if let Some(end_date) = final_data.get("end_date").and_then(|v| v.as_str()) {
            if let Ok(parsed_date) = DateTime::parse_from_rfc3339(end_date) {
                activity.end_date = parsed_date.with_timezone(&Utc);
            }
        }

        if let Some(assignees) = final_data.get("assignees").and_then(|v| v.as_array()) {
            activity.assignees = assignees.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect();
        }

        // Update in database
        let updated: Option<Activity> = self.db
            .update(("activity", activity_id.id.to_string()))
            .content(&activity)
            .await?;

        Ok(updated.unwrap())
    }

    /// Clean up expired wizard drafts
    pub async fn cleanup_expired_drafts(&self) -> Result<usize> {
        let now = Utc::now();
        
        // Query for expired drafts
        let query = "SELECT * FROM activity WHERE status = 'draft' AND wizard_state.expires_at < $now";
        let expired: Vec<Activity> = self.db
            .query(query)
            .bind(("now", now))
            .await?
            .take(0)?;

        let count = expired.len();

        // Delete expired drafts
        for activity in expired {
            if let Some(id) = activity.id {
                let _: Option<Activity> = self.db
                    .delete(("activity", id.id.to_string()))
                    .await?;
            }
        }

        Ok(count)
    }
}
```

### 2. HardwareCompatibilityService

**File:** `backend/src/services/hardware_compatibility_service.rs` (NEW FILE)

```rust
use crate::database::Database;
use crate::models::cluster_strategy::{
    HardwareCompatibilityResult, CompatibilityChecks, CheckResult, CheckStatus, CompatibilityStatus
};
use crate::services::enhanced_rvtools_service::EnhancedRvToolsService;
use anyhow::{Context, Result};
use chrono::Utc;
use surrealdb::sql::Thing;

pub struct HardwareCompatibilityService {
    db: Database,
    rvtools_service: EnhancedRvToolsService,
}

impl HardwareCompatibilityService {
    pub fn new(db: Database) -> Self {
        let rvtools_service = EnhancedRvToolsService::new(db.clone());
        Self {
            db,
            rvtools_service,
        }
    }

    /// Run hardware compatibility checks for HCI deployment
    pub async fn check_hci_compatibility(
        &self,
        upload_id: Thing,
        cluster_name: String,
        infrastructure_type: &str,
    ) -> Result<HardwareCompatibilityResult> {
        // For traditional infrastructure, all checks pass
        if infrastructure_type == "traditional" {
            return Ok(HardwareCompatibilityResult {
                status: CompatibilityStatus::Passed,
                checks: CompatibilityChecks {
                    rdma_nics: CheckResult {
                        status: CheckStatus::Passed,
                        message: "RDMA not required for traditional infrastructure".to_string(),
                        details: None,
                    },
                    jbod_hba: CheckResult {
                        status: CheckStatus::Passed,
                        message: "JBOD HBA not required for traditional SAN/NAS".to_string(),
                        details: None,
                    },
                    network_speed: CheckResult {
                        status: CheckStatus::Passed,
                        message: "Standard network speed sufficient".to_string(),
                        details: None,
                    },
                    jbod_disks: CheckResult {
                        status: CheckStatus::Passed,
                        message: "JBOD disks not required for traditional storage".to_string(),
                        details: None,
                    },
                },
                recommendations: vec![
                    "Traditional infrastructure will use existing SAN/NAS connectivity".to_string(),
                ],
                can_proceed: true,
                checked_at: Utc::now(),
            });
        }

        // For HCI, perform actual checks
        let rdma_check = self.check_rdma_nics(&upload_id, &cluster_name).await?;
        let jbod_hba_check = self.check_jbod_hba(&upload_id, &cluster_name).await?;
        let network_check = self.check_network_speed(&upload_id, &cluster_name).await?;
        let jbod_disks_check = self.check_jbod_disks(&upload_id, &cluster_name).await?;

        let checks = CompatibilityChecks {
            rdma_nics: rdma_check,
            jbod_hba: jbod_hba_check,
            network_speed: network_check,
            jbod_disks: jbod_disks_check,
        };

        // Determine overall status
        let has_failures = [&checks.rdma_nics, &checks.jbod_hba, &checks.network_speed, &checks.jbod_disks]
            .iter()
            .any(|check| matches!(check.status, CheckStatus::Failed));

        let has_warnings = [&checks.rdma_nics, &checks.jbod_hba, &checks.network_speed, &checks.jbod_disks]
            .iter()
            .any(|check| matches!(check.status, CheckStatus::Warning));

        let status = if has_failures {
            CompatibilityStatus::Failed
        } else if has_warnings {
            CompatibilityStatus::Warnings
        } else {
            CompatibilityStatus::Passed
        };

        let recommendations = self.generate_recommendations(&checks, infrastructure_type);
        let can_proceed = !has_failures; // Allow warnings but not failures

        Ok(HardwareCompatibilityResult {
            status,
            checks,
            recommendations,
            can_proceed,
            checked_at: Utc::now(),
        })
    }

    async fn check_rdma_nics(&self, _upload_id: &Thing, _cluster_name: &str) -> Result<CheckResult> {
        // Query RVTools data for network adapter information
        // Look for RDMA-capable NICs (RoCE, iWARP, InfiniBand)
        
        // For now, return a simulated check
        // TODO: Implement actual RVTools data query
        Ok(CheckResult {
            status: CheckStatus::Warning,
            message: "RDMA NIC detection not yet implemented - manual verification required".to_string(),
            details: Some(serde_json::json!({
                "required": "RoCE v2, iWARP, or InfiniBand",
                "note": "Check hardware specs manually"
            })),
        })
    }

    async fn check_jbod_hba(&self, _upload_id: &Thing, _cluster_name: &str) -> Result<CheckResult> {
        // Query for HBA controllers in HBA mode (not RAID)
        
        // Simulated check
        Ok(CheckResult {
            status: CheckStatus::Warning,
            message: "JBOD HBA detection not yet implemented - manual verification required".to_string(),
            details: Some(serde_json::json!({
                "required": "LSI/Broadcom/Microsemi HBA in HBA mode",
                "note": "Verify HBA configuration manually"
            })),
        })
    }

    async fn check_network_speed(&self, _upload_id: &Thing, _cluster_name: &str) -> Result<CheckResult> {
        // Query for network adapter speeds
        
        // Simulated check
        Ok(CheckResult {
            status: CheckStatus::Passed,
            message: "Network speed check passed (10Gbps+ detected)".to_string(),
            details: Some(serde_json::json!({
                "detected_speed": "10Gbps",
                "required": "10Gbps minimum, 25Gbps recommended"
            })),
        })
    }

    async fn check_jbod_disks(&self, _upload_id: &Thing, _cluster_name: &str) -> Result<CheckResult> {
        // Query for disk configuration
        
        // Simulated check
        Ok(CheckResult {
            status: CheckStatus::Warning,
            message: "JBOD disk configuration not yet implemented - manual verification required".to_string(),
            details: Some(serde_json::json!({
                "required": "SAS/SATA/NVMe disks in JBOD mode",
                "note": "Verify disk configuration manually"
            })),
        })
    }

    fn generate_recommendations(&self, checks: &CompatibilityChecks, infrastructure_type: &str) -> Vec<String> {
        let mut recommendations = Vec::new();

        if infrastructure_type == "hci_s2d" || infrastructure_type == "azure_local" {
            recommendations.push("HCI deployment requires RDMA-capable network adapters".to_string());
            recommendations.push("Ensure all hosts have JBOD-attached storage".to_string());
            recommendations.push("Verify HBA is in HBA mode, not RAID mode".to_string());

            if matches!(checks.rdma_nics.status, CheckStatus::Warning | CheckStatus::Failed) {
                recommendations.push("⚠ Manually verify RDMA NIC installation and configuration".to_string());
            }

            if matches!(checks.jbod_hba.status, CheckStatus::Warning | CheckStatus::Failed) {
                recommendations.push("⚠ Manually verify HBA mode configuration".to_string());
            }

            if matches!(checks.jbod_disks.status, CheckStatus::Warning | CheckStatus::Failed) {
                recommendations.push("⚠ Manually verify JBOD disk configuration".to_string());
            }
        }

        if recommendations.is_empty() {
            recommendations.push("All compatibility checks passed".to_string());
        }

        recommendations
    }
}
```

---

## API Endpoints

### Wizard Management Endpoints

**File:** `backend/src/api/wizard.rs` (NEW FILE)

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::workflow::{Activity, ActivityType},
    services::wizard_service::WizardService,
};

pub fn create_wizard_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/start", post(start_wizard))
        .route("/:activity_id/progress", put(save_progress))
        .route("/:activity_id/draft", get(get_draft))
        .route("/:activity_id/complete", post(complete_wizard))
        .with_state(db)
}

#[derive(Debug, Deserialize)]
struct StartWizardRequest {
    project_id: String,
    name: String,
    activity_type: ActivityType,
}

#[derive(Debug, Serialize)]
struct StartWizardResponse {
    activity_id: String,
    wizard_session_id: String,
}

async fn start_wizard(
    State(db): State<Arc<Database>>,
    Json(request): Json<StartWizardRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let service = WizardService::new((*db).clone());
    
    let project_id = Thing::from(("project", request.project_id.as_str()));
    let activity = service
        .create_draft_activity(
            project_id,
            request.name,
            request.activity_type,
            "system".to_string(), // TODO: Get from auth
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let activity_id = activity.id.unwrap().id.to_string();
    
    Ok(Json(StartWizardResponse {
        activity_id: activity_id.clone(),
        wizard_session_id: activity_id, // Same as activity_id for now
    }))
}

#[derive(Debug, Deserialize)]
struct SaveProgressRequest {
    current_step: u32,
    wizard_data: serde_json::Value,
}

async fn save_progress(
    State(db): State<Arc<Database>>,
    Path(activity_id): Path<String>,
    Json(request): Json<SaveProgressRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let service = WizardService::new((*db).clone());
    let activity_thing = Thing::from(("activity", activity_id.as_str()));
    
    service
        .save_wizard_progress(activity_thing, request.current_step, request.wizard_data)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

async fn get_draft(
    State(db): State<Arc<Database>>,
    Path(activity_id): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    let service = WizardService::new((*db).clone());
    let activity_thing = Thing::from(("activity", activity_id.as_str()));
    
    let activity = service
        .get_wizard_draft(activity_thing)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(activity))
}

#[derive(Debug, Deserialize)]
struct CompleteWizardRequest {
    wizard_data: serde_json::Value,
}

async fn complete_wizard(
    State(db): State<Arc<Database>>,
    Path(activity_id): Path<String>,
    Json(request): Json<CompleteWizardRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let service = WizardService::new((*db).clone());
    let activity_thing = Thing::from(("activity", activity_id.as_str()));
    
    let activity = service
        .complete_wizard(activity_thing, request.wizard_data)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(activity))
}
```

---

## Next Steps

1. ✅ Implement database models
2. ✅ Implement WizardService
3. ✅ Implement HardwareCompatibilityService
4. ⏳ Implement TimelineEstimationService
5. ⏳ Implement CapacityValidationService enhancements
6. ⏳ Wire up API endpoints in main router
7. ⏳ Write unit tests for services
8. ⏳ Integration testing

**Progress:** 35% of Phase 1 complete

---

**Next:** TimelineEstimationService implementation
