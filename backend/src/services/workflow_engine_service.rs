// Archer ITSM - Workflow Engine Service
// Core workflow execution engine with step handlers

use chrono::Utc;
use serde_json::json;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::workflow_engine::*,
};

/// Workflow execution service
pub struct WorkflowEngineService {
    db: Arc<Database>,
}

impl WorkflowEngineService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    // ========================================================================
    // WORKFLOW DEFINITION MANAGEMENT
    // ========================================================================

    /// Create a new workflow definition
    pub async fn create_workflow(
        &self,
        req: CreateWorkflowRequest,
        created_by: String,
    ) -> Result<WorkflowDefinition, String> {
        let now = Utc::now();
        
        let workflow = WorkflowDefinition {
            id: None,
            name: req.name,
            description: req.description,
            trigger_type: req.trigger_type,
            trigger_conditions: req.trigger_conditions,
            steps: req.steps,
            is_active: req.is_active,
            created_by,
            created_at: now,
            updated_at: now,
        };

        let created: Vec<WorkflowDefinition> = self.db
            .create("workflow_definition")
            .content(&workflow)
            .await
            .map_err(|e| format!("Failed to create workflow: {}", e))?;

        created.into_iter().next()
            .ok_or_else(|| "Failed to create workflow".to_string())
    }

    /// Get workflow definition by ID
    pub async fn get_workflow(&self, id: Thing) -> Result<Option<WorkflowDefinition>, String> {
        self.db
            .select(id)
            .await
            .map_err(|e| format!("Failed to get workflow: {}", e))
    }

    /// List all workflow definitions
    pub async fn list_workflows(&self) -> Result<Vec<WorkflowDefinition>, String> {
        self.db
            .select("workflow_definition")
            .await
            .map_err(|e| format!("Failed to list workflows: {}", e))
    }

    /// Update workflow definition
    pub async fn update_workflow(
        &self,
        id: Thing,
        req: UpdateWorkflowRequest,
    ) -> Result<WorkflowDefinition, String> {
        let mut workflow: WorkflowDefinition = self.db
            .select(id.clone())
            .await
            .map_err(|e| format!("Failed to fetch workflow: {}", e))?
            .ok_or_else(|| "Workflow not found".to_string())?;

        if let Some(name) = req.name {
            workflow.name = name;
        }
        if let Some(description) = req.description {
            workflow.description = Some(description);
        }
        if let Some(conditions) = req.trigger_conditions {
            workflow.trigger_conditions = conditions;
        }
        if let Some(steps) = req.steps {
            workflow.steps = steps;
        }
        if let Some(is_active) = req.is_active {
            workflow.is_active = is_active;
        }
        workflow.updated_at = Utc::now();

        self.db
            .update(id)
            .content(&workflow)
            .await
            .map_err(|e| format!("Failed to update workflow: {}", e))?
            .ok_or_else(|| "Failed to update workflow".to_string())
    }

    /// Delete workflow definition
    pub async fn delete_workflow(&self, id: Thing) -> Result<(), String> {
        let _: Option<WorkflowDefinition> = self.db
            .delete(id)
            .await
            .map_err(|e| format!("Failed to delete workflow: {}", e))?;
        Ok(())
    }

    // ========================================================================
    // WORKFLOW INSTANCE MANAGEMENT
    // ========================================================================

    /// Trigger a workflow manually
    pub async fn trigger_workflow(
        &self,
        workflow_id: Thing,
        trigger_record_type: String,
        trigger_record_id: Thing,
        context: Option<serde_json::Value>,
    ) -> Result<WorkflowInstance, String> {
        let workflow: WorkflowDefinition = self.db
            .select(workflow_id.clone())
            .await
            .map_err(|e| format!("Failed to fetch workflow: {}", e))?
            .ok_or_else(|| "Workflow not found".to_string())?;

        if !workflow.is_active {
            return Err("Workflow is not active".to_string());
        }

        let now = Utc::now();
        let instance = WorkflowInstance {
            id: None,
            workflow_id,
            trigger_record_type,
            trigger_record_id,
            status: WorkflowInstanceStatus::Running,
            current_step_id: workflow.steps.first().map(|s| s.step_id.clone()),
            step_history: vec![],
            started_at: now,
            completed_at: None,
            context: context.unwrap_or(json!({})),
        };

        let created_instance: Vec<WorkflowInstance> = self.db
            .create("workflow_instance")
            .content(&instance)
            .await
            .map_err(|e| format!("Failed to create workflow instance: {}", e))?;

        let created_instance = created_instance.into_iter().next()
            .ok_or_else(|| "Failed to create workflow instance".to_string())?;

        // Start executing the workflow asynchronously
        // In a real implementation, this would be done in a background task
        Ok(created_instance)
    }

    /// Get workflow instance by ID
    pub async fn get_workflow_instance(&self, id: Thing) -> Result<Option<WorkflowInstance>, String> {
        self.db
            .select(id)
            .await
            .map_err(|e| format!("Failed to get workflow instance: {}", e))
    }

    /// List workflow instances
    pub async fn list_workflow_instances(&self) -> Result<Vec<WorkflowInstance>, String> {
        self.db
            .select("workflow_instance")
            .await
            .map_err(|e| format!("Failed to list workflow instances: {}", e))
    }

    /// Cancel a running workflow instance
    pub async fn cancel_workflow_instance(&self, id: Thing) -> Result<WorkflowInstance, String> {
        let mut instance: WorkflowInstance = self.db
            .select(id.clone())
            .await
            .map_err(|e| format!("Failed to fetch workflow instance: {}", e))?
            .ok_or_else(|| "Workflow instance not found".to_string())?;

        if instance.status == WorkflowInstanceStatus::Completed ||
           instance.status == WorkflowInstanceStatus::Cancelled {
            return Err("Cannot cancel completed or already cancelled workflow".to_string());
        }

        instance.status = WorkflowInstanceStatus::Cancelled;
        instance.completed_at = Some(Utc::now());

        self.db
            .update(id)
            .content(&instance)
            .await
            .map_err(|e| format!("Failed to cancel workflow instance: {}", e))?
            .ok_or_else(|| "Failed to cancel workflow instance".to_string())
    }

    // ========================================================================
    // STEP EXECUTION
    // ========================================================================

    /// Execute a workflow step
    async fn execute_step(
        &self,
        instance_id: Thing,
        step: &WorkflowStep,
        context: &mut serde_json::Value,
    ) -> Result<StepExecution, String> {
        let now = Utc::now();
        let mut execution = StepExecution {
            step_id: step.step_id.clone(),
            step_name: step.name.clone(),
            status: StepExecutionStatus::Running,
            started_at: now,
            completed_at: None,
            result: None,
            error_message: None,
        };

        // Execute based on step type
        let result = match step.step_type {
            WorkflowStepType::Approval => {
                self.handle_approval_step(instance_id.clone(), step, context).await
            }
            WorkflowStepType::Notification => {
                self.handle_notification_step(step, context).await
            }
            WorkflowStepType::FieldUpdate => {
                self.handle_field_update_step(step, context).await
            }
            WorkflowStepType::Assignment => {
                self.handle_assignment_step(step, context).await
            }
            WorkflowStepType::CreateRecord => {
                self.handle_create_record_step(step, context).await
            }
            WorkflowStepType::Condition => {
                self.handle_condition_step(step, context).await
            }
            WorkflowStepType::Delay => {
                self.handle_delay_step(step).await
            }
            WorkflowStepType::HttpCall => {
                Err("HTTP calls not implemented yet".to_string())
            }
        };

        match result {
            Ok(result_data) => {
                execution.status = StepExecutionStatus::Completed;
                execution.completed_at = Some(Utc::now());
                execution.result = Some(result_data);
            }
            Err(e) => {
                execution.status = StepExecutionStatus::Failed;
                execution.completed_at = Some(Utc::now());
                execution.error_message = Some(e);
            }
        }

        Ok(execution)
    }

    // ========================================================================
    // STEP HANDLERS
    // ========================================================================

    /// Handle approval step - creates approval record and waits
    async fn handle_approval_step(
        &self,
        instance_id: Thing,
        step: &WorkflowStep,
        _context: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        // Extract approver configuration
        let approver_id = step.config
            .get("approver_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Approver ID not specified in step config".to_string())?;

        let approver_type_str = step.config
            .get("approver_type")
            .and_then(|v| v.as_str())
            .unwrap_or("USER");

        let approver_type = match approver_type_str {
            "ROLE" => ApproverType::Role,
            "GROUP" => ApproverType::Group,
            _ => ApproverType::User,
        };

        // Parse approver ID as Thing
        let approver_thing: Thing = approver_id.parse()
            .map_err(|_| format!("Invalid approver ID format: {}", approver_id))?;

        // Create approval record
        let approval = Approval {
            id: None,
            workflow_instance_id: instance_id,
            step_id: step.step_id.clone(),
            approver_id: approver_thing,
            approver_type,
            status: ApprovalStatus::Pending,
            requested_at: Utc::now(),
            responded_at: None,
            comments: None,
        };

        let created: Vec<Approval> = self.db
            .create("approval")
            .content(&approval)
            .await
            .map_err(|e| format!("Failed to create approval: {}", e))?;

        let _ = created.into_iter().next()
            .ok_or_else(|| "Failed to create approval".to_string())?;

        Ok(json!({ "status": "approval_requested" }))
    }

    /// Handle notification step - logs to console for now
    async fn handle_notification_step(
        &self,
        step: &WorkflowStep,
        context: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let message = step.config
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("Workflow notification");

        let recipients = step.config
            .get("recipients")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        // Log notification (in production, send email/slack/webhook)
        println!(
            "[WORKFLOW NOTIFICATION] To: {:?}, Message: {}, Context: {}",
            recipients, message, context
        );

        Ok(json!({
            "status": "notification_sent",
            "recipients": recipients,
            "message": message
        }))
    }

    /// Handle field update step - updates record fields
    async fn handle_field_update_step(
        &self,
        step: &WorkflowStep,
        context: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let record_id = context
            .get("trigger_record_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Trigger record ID not found in context".to_string())?;

        let updates = step.config
            .get("updates")
            .ok_or_else(|| "Updates not specified in step config".to_string())?;

        let record_thing: Thing = record_id.parse()
            .map_err(|_| format!("Invalid record ID format: {}", record_id))?;

        // Update the record with specified fields
        let query = format!(
            "UPDATE $record_id MERGE $updates"
        );

        self.db
            .query(query)
            .bind(("record_id", record_thing))
            .bind(("updates", updates))
            .await
            .map_err(|e| format!("Failed to update record: {}", e))?;

        Ok(json!({
            "status": "fields_updated",
            "record_id": record_id,
            "updates": updates
        }))
    }

    /// Handle assignment step - assigns to user/group
    async fn handle_assignment_step(
        &self,
        step: &WorkflowStep,
        context: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let record_id = context
            .get("trigger_record_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Trigger record ID not found in context".to_string())?;

        let assignee = step.config
            .get("assignee")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Assignee not specified in step config".to_string())?;

        let record_thing: Thing = record_id.parse()
            .map_err(|_| format!("Invalid record ID format: {}", record_id))?;

        // Update assignee field
        let query = "UPDATE $record_id SET assignee = $assignee, updated_at = time::now()";

        self.db
            .query(query)
            .bind(("record_id", record_thing))
            .bind(("assignee", assignee))
            .await
            .map_err(|e| format!("Failed to assign record: {}", e))?;

        Ok(json!({
            "status": "assigned",
            "record_id": record_id,
            "assignee": assignee
        }))
    }

    /// Handle create record step - creates child records
    async fn handle_create_record_step(
        &self,
        step: &WorkflowStep,
        _context: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let record_type = step.config
            .get("record_type")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Record type not specified in step config".to_string())?;

        let record_data = step.config
            .get("data")
            .ok_or_else(|| "Record data not specified in step config".to_string())?;

        // Create the new record
        let query = format!("CREATE {} CONTENT $data", record_type);

        let mut result = self.db
            .query(query)
            .bind(("data", record_data))
            .await
            .map_err(|e| format!("Failed to create record: {}", e))?;

        let created: Option<serde_json::Value> = result.take(0)
            .map_err(|e| format!("Failed to parse created record: {}", e))?;

        Ok(json!({
            "status": "record_created",
            "record_type": record_type,
            "record": created
        }))
    }

    /// Handle condition step - evaluates condition and returns next step
    async fn handle_condition_step(
        &self,
        step: &WorkflowStep,
        context: &serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let condition = step.config
            .get("condition")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Condition not specified in step config".to_string())?;

        // Simple condition evaluation (in production, use a proper expression evaluator)
        let result = self.evaluate_condition(condition, context)?;

        Ok(json!({
            "status": "condition_evaluated",
            "result": result,
            "next_step": if result { step.on_success.clone() } else { step.on_failure.clone() }
        }))
    }

    /// Handle delay step - waits for specified duration
    async fn handle_delay_step(
        &self,
        step: &WorkflowStep,
    ) -> Result<serde_json::Value, String> {
        let delay_minutes = step.config
            .get("delay_minutes")
            .and_then(|v| v.as_i64())
            .unwrap_or(0) as u64;

        // In production, this would schedule the workflow to resume after delay
        println!("[WORKFLOW DELAY] Delaying for {} minutes", delay_minutes);

        Ok(json!({
            "status": "delay_started",
            "delay_minutes": delay_minutes
        }))
    }

    /// Simple condition evaluator (placeholder)
    fn evaluate_condition(
        &self,
        _condition: &str,
        _context: &serde_json::Value,
    ) -> Result<bool, String> {
        // TODO: Implement proper condition evaluation
        // For now, just return true
        Ok(true)
    }

    // ========================================================================
    // APPROVAL MANAGEMENT
    // ========================================================================

    /// Get pending approvals for a user
    pub async fn get_pending_approvals(&self, user_id: String) -> Result<Vec<ApprovalWithContext>, String> {
        let user_thing: Thing = user_id.parse()
            .map_err(|_| format!("Invalid user ID format: {}", user_id))?;

        // Query approvals
        let query = r#"
            SELECT * FROM approval 
            WHERE approver_id = $user_id 
            AND status = 'PENDING'
            ORDER BY requested_at DESC
        "#;

        let mut result = self.db
            .query(query)
            .bind(("user_id", user_thing))
            .await
            .map_err(|e| format!("Failed to fetch approvals: {}", e))?;

        let approvals: Vec<Approval> = result.take(0)
            .map_err(|e| format!("Failed to parse approvals: {}", e))?;

        // Enrich approvals with context
        let mut enriched_approvals = Vec::new();
        for approval in approvals {
            if let Ok(Some(instance)) = self.get_workflow_instance(approval.workflow_instance_id.clone()).await {
                if let Ok(Some(workflow)) = self.get_workflow(instance.workflow_id.clone()).await {
                    enriched_approvals.push(ApprovalWithContext {
                        approval: approval.clone(),
                        workflow_name: workflow.name,
                        trigger_record_type: instance.trigger_record_type,
                        trigger_record_id: instance.trigger_record_id,
                    });
                }
            }
        }

        Ok(enriched_approvals)
    }

    /// Approve an approval request
    pub async fn approve_approval(
        &self,
        approval_id: Thing,
        comments: Option<String>,
    ) -> Result<Approval, String> {
        let mut approval: Approval = self.db
            .select(approval_id.clone())
            .await
            .map_err(|e| format!("Failed to fetch approval: {}", e))?
            .ok_or_else(|| "Approval not found".to_string())?;

        if approval.status != ApprovalStatus::Pending {
            return Err("Approval is not in pending state".to_string());
        }

        approval.status = ApprovalStatus::Approved;
        approval.responded_at = Some(Utc::now());
        approval.comments = comments;

        let updated: Approval = self.db
            .update(approval_id)
            .content(&approval)
            .await
            .map_err(|e| format!("Failed to update approval: {}", e))?
            .ok_or_else(|| "Failed to update approval".to_string())?;

        // Resume workflow execution
        self.resume_workflow_after_approval(updated.workflow_instance_id.clone()).await?;

        Ok(updated)
    }

    /// Reject an approval request
    pub async fn reject_approval(
        &self,
        approval_id: Thing,
        comments: Option<String>,
    ) -> Result<Approval, String> {
        let mut approval: Approval = self.db
            .select(approval_id.clone())
            .await
            .map_err(|e| format!("Failed to fetch approval: {}", e))?
            .ok_or_else(|| "Approval not found".to_string())?;

        if approval.status != ApprovalStatus::Pending {
            return Err("Approval is not in pending state".to_string());
        }

        approval.status = ApprovalStatus::Rejected;
        approval.responded_at = Some(Utc::now());
        approval.comments = comments;

        let updated: Approval = self.db
            .update(approval_id)
            .content(&approval)
            .await
            .map_err(|e| format!("Failed to update approval: {}", e))?
            .ok_or_else(|| "Failed to update approval".to_string())?;

        // Mark workflow as failed
        let mut instance: WorkflowInstance = self.db
            .select(updated.workflow_instance_id.clone())
            .await
            .map_err(|e| format!("Failed to fetch workflow instance: {}", e))?
            .ok_or_else(|| "Workflow instance not found".to_string())?;

        instance.status = WorkflowInstanceStatus::Failed;
        instance.completed_at = Some(Utc::now());

        let _: Option<WorkflowInstance> = self.db
            .update(updated.workflow_instance_id.clone())
            .content(&instance)
            .await
            .map_err(|e| format!("Failed to update workflow instance: {}", e))?;

        Ok(updated)
    }

    /// Resume workflow execution after approval
    async fn resume_workflow_after_approval(&self, instance_id: Thing) -> Result<(), String> {
        let mut instance: WorkflowInstance = self.db
            .select(instance_id.clone())
            .await
            .map_err(|e| format!("Failed to fetch workflow instance: {}", e))?
            .ok_or_else(|| "Workflow instance not found".to_string())?;

        if instance.status != WorkflowInstanceStatus::WaitingApproval {
            return Ok(()); // Already processed
        }

        instance.status = WorkflowInstanceStatus::Running;

        let _: Option<WorkflowInstance> = self.db
            .update(instance_id)
            .content(&instance)
            .await
            .map_err(|e| format!("Failed to update workflow instance: {}", e))?;

        // Continue execution (in production, this would be done asynchronously)
        Ok(())
    }
}
