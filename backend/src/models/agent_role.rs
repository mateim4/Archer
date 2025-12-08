use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Permission level for document access
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PermissionLevel {
    /// No access
    None,
    /// Can read/search
    Read,
    /// Can read and cite in responses
    ReadCite,
    /// Full access including metadata
    Full,
}

/// An AI agent role with its permissions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRole {
    /// Unique identifier
    pub id: Option<Thing>,
    
    /// Role name (e.g., "librarian", "ops_agent", "support_agent")
    pub name: String,
    
    /// Human-readable description
    pub description: String,
    
    /// Maximum sensitivity level this role can access (1-5)
    pub max_sensitivity_level: i32,
    
    /// Can this role perform autonomous actions?
    pub can_execute_actions: bool,
    
    /// Maximum risk level for auto-approved actions
    pub max_auto_approve_risk: Option<String>,
    
    /// Allowed action types
    pub allowed_action_types: Vec<String>,
    
    /// Blocked action types (overrides allowed)
    pub blocked_action_types: Vec<String>,
    
    /// Specific document IDs this role can access (whitelist)
    pub allowed_document_ids: Vec<Thing>,
    
    /// Specific document IDs this role cannot access (blacklist)
    pub blocked_document_ids: Vec<Thing>,
    
    /// Is this role active?
    pub is_active: bool,
    
    /// Who created this role
    pub created_by: String,
    
    /// Record timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create an agent role
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAgentRoleRequest {
    pub name: String,
    pub description: String,
    pub max_sensitivity_level: i32,
    pub can_execute_actions: bool,
    pub max_auto_approve_risk: Option<String>,
    pub allowed_action_types: Option<Vec<String>>,
    pub blocked_action_types: Option<Vec<String>>,
    pub created_by: String,
}

/// Request to update an agent role
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAgentRoleRequest {
    pub description: Option<String>,
    pub max_sensitivity_level: Option<i32>,
    pub can_execute_actions: Option<bool>,
    pub max_auto_approve_risk: Option<String>,
    pub allowed_action_types: Option<Vec<String>>,
    pub blocked_action_types: Option<Vec<String>>,
    pub is_active: Option<bool>,
}

/// Permission grant linking role to document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentPermission {
    pub id: Option<Thing>,
    pub agent_role_id: Thing,
    pub document_id: Thing,
    pub permission_level: PermissionLevel,
    pub granted_by: String,
    pub granted_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}
