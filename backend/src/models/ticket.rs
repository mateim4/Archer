use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: Option<Thing>,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub ticket_type: TicketType,
    pub priority: TicketPriority,
    pub status: TicketStatus,
    pub related_asset: Option<Thing>,
    pub related_project: Option<Thing>,
    pub assignee: Option<String>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketType {
    #[serde(rename = "INCIDENT")]
    Incident,
    #[serde(rename = "PROBLEM")]
    Problem,
    #[serde(rename = "CHANGE")]
    Change,
    #[serde(rename = "SERVICE_REQUEST")]
    ServiceRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketPriority {
    P1,
    P2,
    P3,
    P4,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketStatus {
    #[serde(rename = "NEW")]
    New,
    #[serde(rename = "IN_PROGRESS")]
    InProgress,
    #[serde(rename = "RESOLVED")]
    Resolved,
    #[serde(rename = "CLOSED")]
    Closed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTicketRequest {
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub ticket_type: TicketType,
    pub priority: TicketPriority,
    pub related_asset: Option<String>, // ID as string
    pub related_project: Option<String>, // ID as string
    pub assignee: Option<String>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTicketRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TicketStatus>,
    pub priority: Option<TicketPriority>,
    pub assignee: Option<String>,
}
