// Archer ITSM - Workflow Engine Models
// Implements generic workflow automation with approvals, notifications, and actions

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/// Workflow definition template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub trigger_type: WorkflowTrigger,
    pub trigger_conditions: serde_json::Value, // JSON conditions
    pub steps: Vec<WorkflowStep>,
    pub is_active: bool,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Event triggers for workflows
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkflowTrigger {
    OnTicketCreate,
    OnTicketUpdate,
    OnTicketStatusChange,
    OnApprovalRequired,
    OnAlertCreated,
    OnCiChange,
    Scheduled,
    Manual,
}

/// Individual step in a workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub step_id: String,
    pub name: String,
    pub step_type: WorkflowStepType,
    pub config: serde_json::Value,
    pub on_success: Option<String>, // Next step_id
    pub on_failure: Option<String>,
    pub timeout_minutes: Option<i32>,
}

/// Types of workflow steps
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkflowStepType {
    Approval,      // Require user approval
    Notification,  // Send email/slack/webhook
    FieldUpdate,   // Update record fields
    Assignment,    // Assign to user/group
    CreateRecord,  // Create child ticket, etc.
    HttpCall,      // External API call
    Condition,     // Branch based on condition
    Delay,         // Wait for time period
}

// ============================================================================
// WORKFLOW INSTANCE (RUNTIME)
// ============================================================================

/// Running or completed workflow instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowInstance {
    pub id: Option<Thing>,
    pub workflow_id: Thing,
    pub trigger_record_type: String, // "ticket", "alert", etc.
    pub trigger_record_id: Thing,
    pub status: WorkflowInstanceStatus,
    pub current_step_id: Option<String>,
    pub step_history: Vec<StepExecution>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub context: serde_json::Value, // Runtime data
}

/// Status of a workflow instance
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkflowInstanceStatus {
    Running,
    WaitingApproval,
    Completed,
    Failed,
    Cancelled,
}

/// Record of step execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepExecution {
    pub step_id: String,
    pub step_name: String,
    pub status: StepExecutionStatus,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub result: Option<serde_json::Value>,
    pub error_message: Option<String>,
}

/// Status of individual step execution
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum StepExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
}

// ============================================================================
// APPROVAL SYSTEM
// ============================================================================

/// Approval request within a workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Approval {
    pub id: Option<Thing>,
    pub workflow_instance_id: Thing,
    pub step_id: String,
    pub approver_id: Thing,
    pub approver_type: ApproverType,
    pub status: ApprovalStatus,
    pub requested_at: DateTime<Utc>,
    pub responded_at: Option<DateTime<Utc>>,
    pub comments: Option<String>,
}

/// Type of approver
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ApproverType {
    User,
    Role,
    Group,
}

/// Approval status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    Delegated,
}

// ============================================================================
// REQUEST/RESPONSE MODELS
// ============================================================================

/// Request to create a workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWorkflowRequest {
    pub name: String,
    pub description: Option<String>,
    pub trigger_type: WorkflowTrigger,
    pub trigger_conditions: serde_json::Value,
    pub steps: Vec<WorkflowStep>,
    pub is_active: bool,
}

/// Request to update a workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWorkflowRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub trigger_conditions: Option<serde_json::Value>,
    pub steps: Option<Vec<WorkflowStep>>,
    pub is_active: Option<bool>,
}

/// Request to manually trigger a workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerWorkflowRequest {
    pub trigger_record_type: String,
    pub trigger_record_id: String,
    pub context: Option<serde_json::Value>,
}

/// Request to respond to an approval
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalResponseRequest {
    pub decision: ApprovalDecision,
    pub comments: Option<String>,
}

/// Approval decision
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ApprovalDecision {
    Approve,
    Reject,
}

/// Response containing workflow instance details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowInstanceResponse {
    #[serde(flatten)]
    pub instance: WorkflowInstance,
    pub workflow_definition: WorkflowDefinition,
    pub pending_approvals: Vec<Approval>,
}

/// Response for list of workflows
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowListResponse {
    pub workflows: Vec<WorkflowDefinition>,
    pub total: u64,
}

/// Response for list of workflow instances
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowInstanceListResponse {
    pub instances: Vec<WorkflowInstance>,
    pub total: u64,
}

/// Response for approval list
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalListResponse {
    pub approvals: Vec<ApprovalWithContext>,
    pub total: u64,
}

/// Approval with context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalWithContext {
    #[serde(flatten)]
    pub approval: Approval,
    pub workflow_name: String,
    pub trigger_record_type: String,
    pub trigger_record_id: Thing,
}
