use serde::{Deserialize, Serialize};
use surrealdb::sql::{Thing, Datetime};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub owner_id: Thing,
    pub created_at: Datetime,
    pub updated_at: Datetime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Option<Thing>,
    pub username: String,
    pub email: String,
    pub ad_guid: String,
    pub role: String, // "admin", "editor", "viewer"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareItem {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value, // Using JSON for flexibility
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DesignDocument {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(rename = "type")]
    pub doc_type: String, // "hld" or "lld"
    pub content: String, // Markdown or JSON
}
