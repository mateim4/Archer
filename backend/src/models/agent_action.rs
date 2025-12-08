use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Type of infrastructure action
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    /// Execute a command via SSH
    SshCommand,
    /// Execute PowerShell/WinRM command
    PowershellCommand,
    /// Kubernetes operation
    KubernetesExec,
    /// Cloud API call (AWS/Azure/GCP)
    CloudApiCall,
    /// Run pre-approved script
    ScriptExecution,
    /// Service restart
    ServiceRestart,
    /// Configuration change
    ConfigChange,
    /// Other/custom action
    Custom,
}

/// Risk level calculated by risk assessment
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    /// Safe to auto-execute
    Low,
    /// Execute with notification
    Medium,
    /// Requires single approval
    High,
    /// Requires multi-person approval
    Critical,
}

/// Current status of the action
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActionStatus {
    /// Awaiting approval
    PendingApproval,
    /// Approved, ready to execute
    Approved,
    /// Rejected by approver
    Rejected,
    /// Currently executing
    Executing,
    /// Successfully completed
    Completed,
    /// Execution failed
    Failed,
    /// Rolled back after failure
    RolledBack,
    /// Cancelled before execution
    Cancelled,
    /// Expired (approval timeout)
    Expired,
}

/// Record of an autonomous agent action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentAction {
    /// Unique identifier
    pub id: Option<Thing>,
    
    /// Link to the AI thought that proposed this action
    pub thought_log_id: Option<Thing>,
    
    /// Which agent proposed this action
    pub agent_type: String,
    
    /// Human-readable intent/description
    pub intent: String,
    
    /// Type of action being performed
    pub action_type: ActionType,
    
    /// Target asset/system
    pub target_asset_id: Option<Thing>,
    
    /// Target hostname/IP
    pub target_host: Option<String>,
    
    /// The actual command/script to execute
    pub command: String,
    
    /// Command arguments
    pub command_args: Vec<String>,
    
    /// Working directory for command
    pub working_directory: Option<String>,
    
    /// Calculated risk score (0-100)
    pub risk_score: i32,
    
    /// Risk level based on score
    pub risk_level: RiskLevel,
    
    /// Explanation of risk factors
    pub risk_explanation: Option<String>,
    
    /// Current status
    pub status: ActionStatus,
    
    /// Can this action be undone?
    pub rollback_possible: bool,
    
    /// Rollback command if applicable
    pub rollback_command: Option<String>,
    
    /// User who initiated the action request
    pub requested_by: Option<String>,
    
    /// User who approved (if approval required)
    pub approved_by: Option<String>,
    
    /// Approval timestamp
    pub approved_at: Option<DateTime<Utc>>,
    
    /// Rejection reason if rejected
    pub rejection_reason: Option<String>,
    
    /// Execution start time
    pub execution_started_at: Option<DateTime<Utc>>,
    
    /// Execution end time
    pub execution_completed_at: Option<DateTime<Utc>>,
    
    /// Command exit code
    pub exit_code: Option<i32>,
    
    /// Stdout from command execution
    pub stdout: Option<String>,
    
    /// Stderr from command execution
    pub stderr: Option<String>,
    
    /// Error message if failed
    pub error_message: Option<String>,
    
    /// Related change ticket
    pub related_ticket_id: Option<Thing>,
    
    /// Approval deadline
    pub approval_deadline: Option<DateTime<Utc>>,
    
    /// Record creation
    pub created_at: DateTime<Utc>,
    
    /// Record update
    pub updated_at: DateTime<Utc>,
}

/// Request to create an action proposal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAgentActionRequest {
    pub thought_log_id: Option<String>,
    pub agent_type: String,
    pub intent: String,
    pub action_type: ActionType,
    pub target_asset_id: Option<String>,
    pub target_host: Option<String>,
    pub command: String,
    pub command_args: Option<Vec<String>>,
    pub working_directory: Option<String>,
    pub risk_score: i32,
    pub risk_explanation: Option<String>,
    pub rollback_possible: bool,
    pub rollback_command: Option<String>,
    pub requested_by: Option<String>,
    pub related_ticket_id: Option<String>,
    /// Hours until approval expires (default 24)
    pub approval_timeout_hours: Option<i32>,
}

/// Request to approve an action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveActionRequest {
    pub approved_by: String,
    pub approval_comment: Option<String>,
}

/// Request to reject an action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RejectActionRequest {
    pub rejected_by: String,
    pub rejection_reason: String,
}

/// Request to record execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordExecutionResultRequest {
    pub status: ActionStatus,
    pub exit_code: Option<i32>,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub error_message: Option<String>,
}

/// Query parameters for listing actions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentActionQuery {
    pub status: Option<ActionStatus>,
    pub risk_level: Option<RiskLevel>,
    pub agent_type: Option<String>,
    pub target_asset_id: Option<String>,
    pub requested_by: Option<String>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub pending_approval_only: Option<bool>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
