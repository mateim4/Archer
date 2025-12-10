use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// ALERT MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: Option<Thing>,
    pub title: String,
    pub description: String,
    pub severity: AlertSeverity,
    pub status: AlertStatus,
    pub source: String,           // "prometheus", "zabbix", "manual", etc.
    pub source_alert_id: Option<String>,
    pub affected_ci_id: Option<Thing>,  // Link to CMDB CI
    pub metric_name: Option<String>,
    pub metric_value: Option<f64>,
    pub threshold: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub acknowledged_by: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolved_by: Option<String>,
    pub auto_ticket_id: Option<Thing>,  // Auto-created ticket
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertSeverity {
    Critical,   // P1
    High,       // P2
    Medium,     // P3
    Low,        // P4
    Info,
}

impl AlertSeverity {
    /// Map AlertSeverity to TicketPriority
    pub fn to_ticket_priority(&self) -> crate::models::ticket::TicketPriority {
        match self {
            AlertSeverity::Critical => crate::models::ticket::TicketPriority::P1,
            AlertSeverity::High => crate::models::ticket::TicketPriority::P2,
            AlertSeverity::Medium => crate::models::ticket::TicketPriority::P3,
            AlertSeverity::Low => crate::models::ticket::TicketPriority::P4,
            AlertSeverity::Info => crate::models::ticket::TicketPriority::P4,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertStatus {
    Active,
    Acknowledged,
    Resolved,
    Suppressed,
}

impl AlertStatus {
    /// Check if this is a terminal status
    pub fn is_terminal(&self) -> bool {
        matches!(self, AlertStatus::Resolved)
    }
}

// ============================================================================
// ALERT RULE MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub metric_query: String,
    pub condition: AlertCondition,
    pub threshold: f64,
    pub severity: AlertSeverity,
    pub auto_create_ticket: bool,
    pub ticket_template: Option<serde_json::Value>,
    pub is_active: bool,
    pub cooldown_minutes: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertCondition {
    GreaterThan,
    LessThan,
    Equals,
    NotEquals,
}

impl AlertCondition {
    /// Evaluate if the condition is met
    pub fn evaluate(&self, value: f64, threshold: f64) -> bool {
        match self {
            AlertCondition::GreaterThan => value > threshold,
            AlertCondition::LessThan => value < threshold,
            AlertCondition::Equals => (value - threshold).abs() < f64::EPSILON,
            AlertCondition::NotEquals => (value - threshold).abs() >= f64::EPSILON,
        }
    }
}

// ============================================================================
// REQUEST/RESPONSE MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAlertRequest {
    pub title: String,
    pub description: String,
    pub severity: AlertSeverity,
    pub source: String,
    pub source_alert_id: Option<String>,
    pub affected_ci_id: Option<String>,  // Will be converted to Thing
    pub metric_name: Option<String>,
    pub metric_value: Option<f64>,
    pub threshold: Option<f64>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAlertRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub severity: Option<AlertSeverity>,
    pub status: Option<AlertStatus>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcknowledgeAlertRequest {
    pub acknowledged_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveAlertRequest {
    pub resolved_by: String,
    pub resolution_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTicketFromAlertRequest {
    pub assignee: Option<String>,
    pub assigned_group: Option<String>,
    pub additional_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAlertRuleRequest {
    pub name: String,
    pub description: Option<String>,
    pub metric_query: String,
    pub condition: AlertCondition,
    pub threshold: f64,
    pub severity: AlertSeverity,
    pub auto_create_ticket: bool,
    pub ticket_template: Option<serde_json::Value>,
    pub cooldown_minutes: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAlertRuleRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub metric_query: Option<String>,
    pub condition: Option<AlertCondition>,
    pub threshold: Option<f64>,
    pub severity: Option<AlertSeverity>,
    pub auto_create_ticket: Option<bool>,
    pub ticket_template: Option<serde_json::Value>,
    pub is_active: Option<bool>,
    pub cooldown_minutes: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertListResponse {
    pub alerts: Vec<Alert>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRuleListResponse {
    pub rules: Vec<AlertRule>,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertFilterParams {
    pub severity: Option<Vec<AlertSeverity>>,
    pub status: Option<Vec<AlertStatus>>,
    pub source: Option<String>,
    pub affected_ci_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}
