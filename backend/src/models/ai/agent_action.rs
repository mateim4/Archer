use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    SshCommand,
    PowershellCommand,
    KubernetesExec,
    CloudApiCall,
    ScriptExecution,
    ServiceRestart,
    ConfigChange,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    Low,      // Auto-execute
    Medium,   // Execute with notification
    High,     // Requires approval
    Critical, // Multi-person approval
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActionStatus {
    PendingApproval,
    Approved,
    Rejected,
    Executing,
    Completed,
    Failed,
    RolledBack,
    Cancelled,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentAction {
    pub id: Option<Thing>,
    pub thought_log_id: Option<Thing>,
    pub agent_type: String,
    pub intent: String,
    pub action_type: ActionType,
    pub target_asset_id: Option<Thing>,
    pub target_host: Option<String>,
    pub command: String,
    pub command_args: Vec<String>,
    pub working_directory: Option<String>,
    pub risk_score: i32,
    pub risk_level: RiskLevel,
    pub risk_explanation: Option<String>,
    pub status: ActionStatus,
    pub rollback_possible: bool,
    pub rollback_command: Option<String>,
    pub requested_by: Option<String>,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub execution_started_at: Option<DateTime<Utc>>,
    pub execution_completed_at: Option<DateTime<Utc>>,
    pub exit_code: Option<i32>,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub error_message: Option<String>,
    pub related_ticket_id: Option<Thing>,
    pub approval_deadline: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAgentActionRequest {
    pub agent_type: String,
    pub intent: String,
    pub action_type: ActionType,
    pub target_host: Option<String>,
    pub command: String,
    pub command_args: Option<Vec<String>>,
    pub risk_score: i32,
    pub rollback_possible: bool,
    pub rollback_command: Option<String>,
    pub requested_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveActionRequest {
    pub approved_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RejectActionRequest {
    pub rejected_by: String,
    pub rejection_reason: String,
}
