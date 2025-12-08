use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRole {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub max_sensitivity_level: i32,
    pub can_execute_actions: bool,
    pub max_auto_approve_risk: Option<String>,
    pub allowed_action_types: Vec<String>,
    pub blocked_action_types: Vec<String>,
    pub allowed_document_ids: Vec<Thing>,
    pub blocked_document_ids: Vec<Thing>,
    pub is_active: bool,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAgentRoleRequest {
    pub name: String,
    pub description: String,
    pub max_sensitivity_level: i32,
    pub can_execute_actions: bool,
    pub created_by: String,
}
