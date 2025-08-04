use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub owner_id: Thing,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Option<Thing>,
    pub username: String,
    pub email: String,
    pub ad_guid: String,
    pub role: String, // "admin", "editor", "viewer"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareItem {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value, // Using JSON for flexibility
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignDocument {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(rename = "type")]
    pub doc_type: String, // "hld" or "lld"
    pub content: String, // Markdown or JSON
}

// DTOs for API requests/responses
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateHardwareRequest {
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateHardwareRequest {
    pub name: Option<String>,
    pub vendor: Option<String>,
    pub model: Option<String>,
    pub specs: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDesignDocRequest {
    pub name: String,
    pub doc_type: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDesignDocRequest {
    pub name: Option<String>,
    pub doc_type: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ProjectResponse {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Project> for ProjectResponse {
    fn from(project: Project) -> Self {
        Self {
            id: project.id.map(|id| id.to_string()).unwrap_or_default(),
            name: project.name,
            description: project.description,
            owner_id: project.owner_id.to_string(),
            created_at: project.created_at,
            updated_at: project.updated_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct HardwareResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub vendor: String,
    pub model: String,
    pub specs: serde_json::Value,
}

impl From<HardwareItem> for HardwareResponse {
    fn from(hardware: HardwareItem) -> Self {
        Self {
            id: hardware.id.map(|id| id.to_string()).unwrap_or_default(),
            project_id: hardware.project_id.to_string(),
            name: hardware.name,
            vendor: hardware.vendor,
            model: hardware.model,
            specs: hardware.specs,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct DesignDocResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub doc_type: String,
    pub content: String,
}

impl From<DesignDocument> for DesignDocResponse {
    fn from(doc: DesignDocument) -> Self {
        Self {
            id: doc.id.map(|id| id.to_string()).unwrap_or_default(),
            project_id: doc.project_id.to_string(),
            name: doc.name,
            doc_type: doc.doc_type,
            content: doc.content,
        }
    }
}
