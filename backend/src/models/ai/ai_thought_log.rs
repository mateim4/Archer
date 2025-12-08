use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Orchestrator,
    Librarian,
    TicketAssistant,
    MonitoringAnalyst,
    OperationsAgent,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UserFeedback {
    ThumbsUp,
    ThumbsDown,
    Neutral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiThoughtLog {
    pub id: Option<Thing>,
    pub trace_id: String,
    pub session_id: Option<String>,
    pub agent_type: AgentType,
    pub user_id: Option<String>,
    pub input_text: String,
    pub input_context: Option<String>,
    pub system_prompt: Option<String>,
    pub raw_response: String,
    pub chain_of_thought: Option<String>,
    pub final_output: String,
    pub risk_score: Option<f32>,
    pub confidence_score: Option<f32>,
    pub model: String,
    pub provider: String,
    pub prompt_tokens: Option<i32>,
    pub completion_tokens: Option<i32>,
    pub latency_ms: Option<i64>,
    pub user_feedback: Option<UserFeedback>,
    pub feedback_comment: Option<String>,
    pub feedback_at: Option<DateTime<Utc>>,
    pub related_ticket_id: Option<Thing>,
    pub related_asset_id: Option<Thing>,
    pub related_document_ids: Vec<Thing>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAiThoughtLogRequest {
    pub trace_id: String,
    pub session_id: Option<String>,
    pub agent_type: AgentType,
    pub user_id: Option<String>,
    pub input_text: String,
    pub input_context: Option<String>,
    pub raw_response: String,
    pub chain_of_thought: Option<String>,
    pub final_output: String,
    pub model: String,
    pub provider: String,
    pub prompt_tokens: Option<i32>,
    pub completion_tokens: Option<i32>,
    pub latency_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddFeedbackRequest {
    pub user_feedback: UserFeedback,
    pub feedback_comment: Option<String>,
}
