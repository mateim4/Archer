//! Activity Wizard Service
//!
//! Manages the lifecycle of wizard-based activity creation, including:
//! - Draft creation and management
//! - Progress auto-save
//! - Draft resumption
//! - Wizard completion
//! - Expired draft cleanup

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use surrealdb::{engine::local::Db, Surreal};
use surrealdb::sql::Thing;

use crate::models::workflow::{
    Activity, ActivityStatus, ActivityType, MigrationMetadata, WizardState,
};
use crate::database::AppState;

/// Request to start a new wizard session
#[derive(Debug, Serialize, Deserialize)]
pub struct StartWizardRequest {
    pub project_id: String,
    pub name: String,
    pub activity_type: ActivityType,
    pub created_by: String,
}

/// Response when starting a wizard
#[derive(Debug, Serialize, Deserialize)]
pub struct StartWizardResponse {
    pub activity_id: String,
    pub expires_at: DateTime<Utc>,
}

/// Request to save wizard progress
#[derive(Debug, Serialize, Deserialize)]
pub struct SaveProgressRequest {
    pub current_step: u32,
    pub wizard_data: HashMap<String, serde_json::Value>,
}

/// Request to complete the wizard
#[derive(Debug, Serialize, Deserialize)]
pub struct CompleteWizardRequest {
    pub wizard_data: HashMap<String, serde_json::Value>,
}

/// Response when completing the wizard
#[derive(Debug, Serialize, Deserialize)]
pub struct CompleteWizardResponse {
    pub activity_id: String,
    pub strategy_id: Option<String>,
}

pub struct WizardService;

impl WizardService {
    /// Create a new draft activity and start wizard session
    ///
    /// Creates an Activity with status=Draft and sets expiration to 30 days from now.
    /// Returns the activity ID and expiration timestamp.
    pub async fn create_draft_activity(
        state: &AppState,
        request: StartWizardRequest,
    ) -> Result<StartWizardResponse, Box<dyn std::error::Error>> {
        let db = state.as_ref();
        let now = Utc::now();
        let expires_at = now + Duration::days(30);

        let activity = Activity {
            id: None,
            project_id: Thing::from(("project", request.project_id.as_str())),
            name: request.name,
            description: None,
            activity_type: request.activity_type,
            status: ActivityStatus::Draft,
            strategy_ids: Vec::new(),
            wizard_state: Some(WizardState {
                wizard_type: "migration".to_string(),
                current_step: 1,
                total_steps: 7,
                step_data: HashMap::new(),
                is_completed: false,
                completion_data: None,
                last_saved: now,
            }),
            migration_metadata: None,
            estimated_start_date: None,
            estimated_end_date: None,
            actual_start_date: None,
            actual_end_date: None,
            estimated_duration_days: None,
            assigned_users: Vec::new(),
            team_lead: None,
            progress_percentage: 0,
            expires_at: Some(expires_at),
            created_by: request.created_by,
            created_at: now,
            updated_at: now,
        };

        // Insert into database
        let created: Vec<Activity> = db
            .create("activity")
            .content(activity)
            .await?;

        let activity_id = created
            .first()
            .and_then(|a| a.id.as_ref())
            .ok_or("Failed to create activity")?
            .id
            .to_string();

        Ok(StartWizardResponse {
            activity_id,
            expires_at,
        })
    }

    /// Save wizard progress (auto-save)
    ///
    /// Updates the wizard_state field with current step data.
    /// Extends expiration by another 30 days from now.
    pub async fn save_wizard_progress(
        state: &AppState,
        activity_id: &str,
        request: SaveProgressRequest,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let db = state.as_ref();
        let now = Utc::now();
        let new_expiration = now + Duration::days(30);

        // Fetch existing activity
        let activity: Option<Activity> = db.select(("activity", activity_id)).await?;
        let mut activity = activity.ok_or("Activity not found")?;

        // Check if draft expired
        if let Some(expires_at) = activity.expires_at {
            if expires_at < now {
                return Err("Draft has expired".into());
            }
        }

        // Update wizard state
        if let Some(mut wizard_state) = activity.wizard_state {
            wizard_state.current_step = request.current_step;
            wizard_state.step_data = request.wizard_data;
            wizard_state.last_saved = now;
            activity.wizard_state = Some(wizard_state);
        }

        // Extend expiration
        activity.expires_at = Some(new_expiration);
        activity.updated_at = now;

        // Update in database
        let _: Option<Activity> = db.update(("activity", activity_id)).content(activity).await?;

        Ok(())
    }

    /// Get wizard draft to resume incomplete session
    ///
    /// Returns the Activity if:
    /// - Activity exists and status is "Draft"
    /// - Not expired (expiration_date > now)
    ///
    /// Returns None if draft doesn't exist or has expired.
    pub async fn get_wizard_draft(
        state: &AppState,
        activity_id: &str,
    ) -> Result<Activity, Box<dyn std::error::Error>> {
        let db = state.as_ref();
        let activity: Option<Activity> = db.select(("activity", activity_id)).await?;
        let activity = activity.ok_or("Activity not found")?;

        // Check if draft expired
        let now = Utc::now();
        if let Some(expires_at) = activity.expires_at {
            if expires_at < now {
                return Err("Draft has expired".into());
            }
        }

        // Only return draft activities
        if activity.status != ActivityStatus::Draft {
            return Err("Activity is not in draft status".into());
        }

        Ok(activity)
    }

    /// Complete wizard and finalize activity
    ///
    /// Changes status from Draft → Planned, removes expiration_date,
    /// and updates wizard_state with final data.
    pub async fn complete_wizard(
        state: &AppState,
        activity_id: &str,
        request: CompleteWizardRequest,
    ) -> Result<CompleteWizardResponse, Box<dyn std::error::Error>> {
        let db = state.as_ref();
        let now = Utc::now();

        // Fetch existing activity
        let activity: Option<Activity> = db.select(("activity", activity_id)).await?;
        let mut activity = activity.ok_or("Activity not found")?;

        // Verify it's still in draft
        if activity.status != ActivityStatus::Draft {
            return Err("Activity is not in draft status".into());
        }

        // Mark wizard as completed
        if let Some(mut wizard_state) = activity.wizard_state {
            wizard_state.is_completed = true;
            wizard_state.completion_data = Some(serde_json::to_value(&request.wizard_data)?);
            activity.wizard_state = Some(wizard_state);
        }

        // Extract data from wizard_data for activity fields
        if let Some(step6) = request.wizard_data.get("step6") {
            if let Some(start_date) = step6.get("startDate").and_then(|v| v.as_str()) {
                activity.estimated_start_date = DateTime::parse_from_rfc3339(start_date)
                    .ok()
                    .map(|dt| dt.with_timezone(&Utc));
            }
            if let Some(duration) = step6.get("estimatedDuration").and_then(|v| v.as_u64()) {
                activity.estimated_duration_days = Some(duration as u32);
                if let Some(start) = activity.estimated_start_date {
                    activity.estimated_end_date =
                        Some(start + Duration::days(duration as i64));
                }
            }
        }

        // Extract migration metadata from step 2
        if let Some(step2) = request.wizard_data.get("step2") {
            activity.migration_metadata = Some(MigrationMetadata {
                source_cluster_id: step2
                    .get("sourceCluster")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                target_cluster_name: step2
                    .get("targetClusterName")
                    .and_then(|v| v.as_str())
                    .map(String::from),
                vm_count: None, // TODO: Fetch from RVTools
                host_count: None,
                total_workload_vcpu: None,
                total_workload_memory_gb: None,
                total_workload_storage_tb: None,
            });
        }

        // Change status to Planned
        activity.status = ActivityStatus::Planned;
        activity.expires_at = None; // Remove expiration
        activity.updated_at = now;

        // Update in database
        let _: Option<Activity> = db
            .update(("activity", activity_id))
            .content(activity.clone())
            .await?;

        // TODO: Create ClusterStrategy record here
        // This will be implemented once cluster_strategy model is enhanced

        Ok(CompleteWizardResponse {
            activity_id: activity_id.to_string(),
            strategy_id: None, // TODO: Return actual strategy ID
        })
    }

    /// Cleanup expired draft activities
    ///
    /// This should be run as a scheduled task to remove drafts that have
    /// been inactive for more than 30 days.
    pub async fn cleanup_expired_drafts(
        state: &AppState,
    ) -> Result<u32, Box<dyn std::error::Error>> {
        let db = state.as_ref();
        let now = Utc::now();

        // Query for expired drafts
        let query = format!(
            "SELECT * FROM activity WHERE status = 'draft' AND expires_at < {}",
            now.timestamp()
        );

        let mut response = db.query(&query).await?;
        let expired: Vec<Activity> = response.take(0)?;

        let mut deleted_count = 0;

        for activity in expired {
            if let Some(id) = activity.id {
                let _: Option<Activity> = db.delete(id).await?;
                deleted_count += 1;
            }
        }

        Ok(deleted_count)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_wizard_lifecycle() {
        // This is a placeholder for proper unit tests
        // In a real implementation, you would:
        // 1. Set up a test database
        // 2. Create a draft activity
        // 3. Save progress
        // 4. Retrieve draft
        // 5. Complete wizard
        // 6. Verify final state
    }

    #[tokio::test]
    async fn test_draft_expiration() {
        // Test that expired drafts are properly handled
    }
}
