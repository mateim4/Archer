use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;
use chrono::{DateTime, Utc};

// Note: Uuid is still needed for local generation before DB insertion.
use uuid::Uuid;

/// Represents a single project, the top-level container for all related activities.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub users: Vec<String>, // Simple list of user names for now
    pub timeline: Vec<TimelineItem>,
    pub artifacts: Vec<ProjectArtifact>,
    pub hardware_allocations: Vec<HardwareAllocation>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// An event or milestone on the project's timeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineItem {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub date: DateTime<Utc>,
    pub item_type: TimelineItemType,
    pub is_complete: bool,
    pub comments: Vec<Comment>,
}

/// The type of a timeline item.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TimelineItemType {
    Migration,
    Lifecycle,
    NewOrder,
    CustomStep,
}

/// A user comment on a timeline item.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    // This can remain a Uuid as it's embedded and not a record itself.
    pub id: Uuid,
    pub user: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

/// A file or document attached to a project.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectArtifact {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub artifact_type: ArtifactType,
    pub file_path: String, // Path relative to the project's artifact directory
    pub uploaded_at: DateTime<Utc>,
}

/// The type of a project artifact.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArtifactType {
    Design,
    NetworkTopology,
    BillOfMaterials,
    SizingResult,
    Other,
}

/// Represents the shared pool of hardware available for allocation.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HardwarePool {
    pub servers: Vec<Server>,
}

/// Represents a single server in the hardware pool.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    pub model: String,
    // Other relevant server specs...
}

/// Records the allocation of a specific server to a project for a period of time.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAllocation {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub server_id: Thing,
    pub project_id: Thing,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>, // When it's expected to be free again
}

impl Project {
    pub fn new(name: String, description: String) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            name,
            description,
            start_date: now,
            end_date: now,
            users: vec![],
            timeline: vec![],
            artifacts: vec![],
            hardware_allocations: vec![],
            created_at: now,
            updated_at: now,
        }
    }
}
