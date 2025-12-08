use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Type of AI agent
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Orchestrator,
    Librarian,
    TicketAssistant,
    MonitoringAnalyst,
    OperationsAgent,
    Custom,
}

/// User feedback on AI response
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UserFeedback {
    Positive,
    Negative,
    NeedsImprovement,
    Inaccurate,
}

/// AI thought log entry for transparency and auditing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiThoughtLog {
    /// Unique identifier
    pub id: Option<Thing>,
    
    /// Trace ID for grouping related thoughts
    pub trace_id: String,
    
    /// Session ID for multi-turn conversations
    pub session_id: Option<String>,
    
    /// Which agent produced this thought
    pub agent_type: AgentType,
    
    /// User who triggered this
    pub user_id: Option<String>,
    
    /// User's input/question
    pub input_text: String,
    
    /// Additional context provided
    pub input_context: Option<String>,
    
    /// System prompt used
    pub system_prompt: Option<String>,
    
    /// Raw LLM response
    pub raw_response: String,
    
    /// Chain of thought reasoning
    pub chain_of_thought: Option<String>,
    
    /// Final output to user
    pub final_output: String,
    
    /// Risk score if action proposed (0-100)
    pub risk_score: Option<f32>,
    
    /// Confidence score (0-1)
    pub confidence_score: Option<f32>,
    
    /// LLM model used
    pub model: String,
    
    /// LLM provider
    pub provider: String,
    
    /// Token usage
    pub prompt_tokens: Option<i32>,
    pub completion_tokens: Option<i32>,
    
    /// Response time in milliseconds
    pub latency_ms: Option<i64>,
    
    /// User feedback (added later)
    pub user_feedback: Option<UserFeedback>,
    pub feedback_comment: Option<String>,
    pub feedback_at: Option<DateTime<Utc>>,
    
    /// Related entities
    pub related_ticket_id: Option<Thing>,
    pub related_asset_id: Option<Thing>,
    pub related_document_ids: Vec<Thing>,
    
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
}

/// Request to create a thought log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAiThoughtLogRequest {
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
    pub related_ticket_id: Option<String>,
    pub related_asset_id: Option<String>,
    pub related_document_ids: Option<Vec<String>>,
}

/// Request to add user feedback (only feedback fields are mutable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddFeedbackRequest {
    pub user_feedback: UserFeedback,
    pub feedback_comment: Option<String>,
}

/// Query parameters for listing thought logs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiThoughtLogQuery {
    pub trace_id: Option<String>,
    pub session_id: Option<String>,
    pub agent_type: Option<AgentType>,
    pub user_id: Option<String>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub has_feedback: Option<bool>,
    pub feedback_type: Option<UserFeedback>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}
