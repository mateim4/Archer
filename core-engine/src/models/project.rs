use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Represents a single project, the top-level container for all related activities.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Uuid,
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
    pub id: Uuid,
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
    pub id: Uuid,
    pub user: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

/// A file or document attached to a project.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectArtifact {
    pub id: Uuid,
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
    pub id: Uuid,
    pub name: String,
    pub model: String,
    // Other relevant server specs...
}

/// Records the allocation of a specific server to a project for a period of time.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareAllocation {
    pub id: Uuid,
    pub server_id: Uuid,
    pub project_id: Uuid,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>, // When it's expected to be free again
}

impl Project {
    pub fn new(name: String, description: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
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
