// Placeholder workflow models for core-engine
// The actual implementation is in backend/src/models/workflow.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowPlaceholder {
    pub id: String,
    pub name: String,
}

// Add other placeholder structs as needed