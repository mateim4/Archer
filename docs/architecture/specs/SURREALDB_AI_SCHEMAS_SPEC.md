# SurrealDB AI Schemas Specification

**Task:** Add AI-specific database schemas to the Rust backend  
**Target Directory:** `backend/src/` (extend existing)

---

## 1. Architecture Context

```
┌─────────────────────────────────────────────────────────────┐
│                    RUST BACKEND (Port 3001)                  │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Existing Models  │  │   NEW AI Models   │                │
│  │ - Ticket         │  │ - Document        │                │
│  │ - Project        │  │ - Chunk           │                │
│  │ - Activity       │  │ - AiThoughtLog    │                │
│  │ - HardwareBasket │  │ - AgentAction     │                │
│  │ - Asset          │  │ - AgentRole       │                │
│  └──────────────────┘  └──────────────────┘                 │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                     SurrealDB                         │   │
│  │  Core Tables + Vector Index + AI Audit Tables         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Files to Create

```
backend/src/
├── models/
│   ├── document.rs          # RAG document model
│   ├── chunk.rs             # Vector chunk model
│   ├── ai_thought_log.rs    # Chain of Thought model
│   ├── agent_action.rs      # Autonomous action model
│   └── agent_role.rs        # Agent RBAC model
│
├── api/
│   ├── documents.rs         # Document CRUD endpoints
│   ├── chunks.rs            # Chunk/vector endpoints
│   ├── ai_audit.rs          # AI audit log endpoints
│   └── agent_actions.rs     # Action management endpoints
│
└── database/
    └── migrations/
        └── ai_tables.rs     # AI schema migrations
```

---

## 3. Data Models

### 3.1 Document Model (`models/document.rs`)

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentSourceType {
    Upload,
    Confluence,
    Sharepoint,
    Github,
    GoogleDrive,
    Onedrive,
    FileServer,
    ObjectStorage,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Error,
    Deprecated,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SensitivityLevel {
    Public = 1,
    Internal = 2,
    Confidential = 3,
    Restricted = 4,
    TopSecret = 5,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: Option<Thing>,
    pub title: String,
    pub filename: Option<String>,
    pub mime_type: Option<String>,
    pub source_type: DocumentSourceType,
    pub source_url: Option<String>,
    pub source_id: Option<String>,
    pub content_hash: String,
    pub version: Option<String>,
    pub size_bytes: Option<i64>,
    pub page_count: Option<i32>,
    pub chunk_count: i32,
    pub status: DocumentStatus,
    pub error_message: Option<String>,
    pub sensitivity_level: SensitivityLevel,
    pub tags: Vec<String>,
    pub source_created_at: Option<DateTime<Utc>>,
    pub source_modified_at: Option<DateTime<Utc>>,
    pub last_synced_at: Option<DateTime<Utc>>,
    pub indexed_at: Option<DateTime<Utc>>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub filename: Option<String>,
    pub mime_type: Option<String>,
    pub source_type: DocumentSourceType,
    pub source_url: Option<String>,
    pub content_hash: String,
    pub size_bytes: Option<i64>,
    pub sensitivity_level: Option<SensitivityLevel>,
    pub tags: Option<Vec<String>>,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDocumentRequest {
    pub status: Option<DocumentStatus>,
    pub error_message: Option<String>,
    pub chunk_count: Option<i32>,
    pub indexed_at: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
}
```

---

### 3.2 Chunk Model (`models/chunk.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chunk {
    pub id: Option<Thing>,
    pub document_id: Thing,
    pub content: String,
    pub embedding: Vec<f32>,  // Vector for semantic search
    pub embedding_model: String,
    pub embedding_dimension: i32,
    pub token_count: i32,
    pub start_char: i32,
    pub end_char: i32,
    pub page_number: Option<i32>,
    pub section_path: Vec<String>,
    pub content_hash: String,  // For delta updates
    pub chunk_index: i32,
    pub previous_chunk_id: Option<Thing>,
    pub next_chunk_id: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateChunkRequest {
    pub document_id: String,
    pub content: String,
    pub embedding: Vec<f32>,
    pub embedding_model: String,
    pub token_count: i32,
    pub start_char: i32,
    pub end_char: i32,
    pub page_number: Option<i32>,
    pub section_path: Option<Vec<String>>,
    pub content_hash: String,
    pub chunk_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSearchRequest {
    pub query_embedding: Vec<f32>,
    pub limit: Option<i32>,
    pub min_score: Option<f32>,
    pub document_ids: Option<Vec<String>>,
    pub max_sensitivity: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkSearchResult {
    pub chunk: Chunk,
    pub score: f32,
    pub document_title: Option<String>,
}
```

---

### 3.3 AI Thought Log Model (`models/ai_thought_log.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Orchestrator,
    Librarian,
    TicketAssistant,
    MonitoringAnalyst,
    OperationsAgent,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UserFeedback {
    ThumbsUp,
    ThumbsDown,
    Neutral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiThoughtLog {
    pub id: Option<Thing>,
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
    pub user_feedback: Option<UserFeedback>,
    pub feedback_comment: Option<String>,
    pub feedback_at: Option<DateTime<Utc>>,
    pub related_ticket_id: Option<Thing>,
    pub related_asset_id: Option<Thing>,
    pub related_document_ids: Vec<Thing>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAiThoughtLogRequest {
    pub trace_id: String,
    pub session_id: Option<String>,
    pub agent_type: AgentType,
    pub user_id: Option<String>,
    pub input_text: String,
    pub input_context: Option<String>,
    pub raw_response: String,
    pub chain_of_thought: Option<String>,
    pub final_output: String,
    pub model: String,
    pub provider: String,
    pub prompt_tokens: Option<i32>,
    pub completion_tokens: Option<i32>,
    pub latency_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddFeedbackRequest {
    pub user_feedback: UserFeedback,
    pub feedback_comment: Option<String>,
}
```

---

### 3.4 Agent Action Model (`models/agent_action.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    SshCommand,
    PowershellCommand,
    KubernetesExec,
    CloudApiCall,
    ScriptExecution,
    ServiceRestart,
    ConfigChange,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    Low,      // Auto-execute
    Medium,   // Execute with notification
    High,     // Requires approval
    Critical, // Multi-person approval
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ActionStatus {
    PendingApproval,
    Approved,
    Rejected,
    Executing,
    Completed,
    Failed,
    RolledBack,
    Cancelled,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentAction {
    pub id: Option<Thing>,
    pub thought_log_id: Option<Thing>,
    pub agent_type: String,
    pub intent: String,
    pub action_type: ActionType,
    pub target_asset_id: Option<Thing>,
    pub target_host: Option<String>,
    pub command: String,
    pub command_args: Vec<String>,
    pub working_directory: Option<String>,
    pub risk_score: i32,
    pub risk_level: RiskLevel,
    pub risk_explanation: Option<String>,
    pub status: ActionStatus,
    pub rollback_possible: bool,
    pub rollback_command: Option<String>,
    pub requested_by: Option<String>,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub execution_started_at: Option<DateTime<Utc>>,
    pub execution_completed_at: Option<DateTime<Utc>>,
    pub exit_code: Option<i32>,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub error_message: Option<String>,
    pub related_ticket_id: Option<Thing>,
    pub approval_deadline: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAgentActionRequest {
    pub agent_type: String,
    pub intent: String,
    pub action_type: ActionType,
    pub target_host: Option<String>,
    pub command: String,
    pub command_args: Option<Vec<String>>,
    pub risk_score: i32,
    pub rollback_possible: bool,
    pub rollback_command: Option<String>,
    pub requested_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveActionRequest {
    pub approved_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RejectActionRequest {
    pub rejected_by: String,
    pub rejection_reason: String,
}
```

---

### 3.5 Agent Role Model (`models/agent_role.rs`)

```rust
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
```

---

## 4. Database Migration

Create `database/migrations/ai_tables.rs`:

### Tables to Create

1. **document** - RAG document metadata
2. **chunk** - Text chunks with vector embeddings
3. **ai_thought_log** - Chain of Thought audit
4. **agent_action** - Autonomous action tracking
5. **agent_role** - Agent RBAC
6. **document_permission** - Role-document access

### Vector Index

```sql
DEFINE INDEX idx_chunk_embedding ON TABLE chunk 
COLUMNS embedding MTREE DIMENSION 384 DIST COSINE;
```

### Default Roles to Seed

```sql
-- Librarian: read docs, no execution
INSERT INTO agent_role {
    name: 'librarian',
    description: 'Knowledge management agent',
    max_sensitivity_level: 3,
    can_execute_actions: false,
    created_by: 'system'
};

-- Ticket Assistant: read docs, no execution
INSERT INTO agent_role {
    name: 'ticket_assistant',
    description: 'Ticket workflow assistant',
    max_sensitivity_level: 2,
    can_execute_actions: false,
    created_by: 'system'
};

-- Monitoring Analyst: read all, no execution
INSERT INTO agent_role {
    name: 'monitoring_analyst',
    description: 'Monitoring and alerting analyst',
    max_sensitivity_level: 4,
    can_execute_actions: false,
    created_by: 'system'
};

-- Operations Agent: full access with approval
INSERT INTO agent_role {
    name: 'operations_agent',
    description: 'Infrastructure operations agent',
    max_sensitivity_level: 5,
    can_execute_actions: true,
    max_auto_approve_risk: 'low',
    created_by: 'system'
};
```

---

## 5. API Endpoints

### Documents API
```
POST   /api/documents              # Create document
GET    /api/documents              # List documents
GET    /api/documents/:id          # Get document
PATCH  /api/documents/:id          # Update document
DELETE /api/documents/:id          # Archive document
```

### Chunks API
```
POST   /api/chunks                 # Create chunk
POST   /api/chunks/batch           # Batch create
GET    /api/documents/:id/chunks   # Get chunks for document
POST   /api/chunks/search          # Semantic search
```

### AI Audit API
```
POST   /api/ai/thoughts            # Create thought log
GET    /api/ai/thoughts            # List thought logs
GET    /api/ai/thoughts/:id        # Get thought log
POST   /api/ai/thoughts/:id/feedback  # Add feedback
```

### Agent Actions API
```
POST   /api/ai/actions             # Propose action
GET    /api/ai/actions             # List actions
GET    /api/ai/actions/:id         # Get action
POST   /api/ai/actions/:id/approve # Approve
POST   /api/ai/actions/:id/reject  # Reject
GET    /api/ai/actions/pending     # Pending approvals
```

---

## 6. Acceptance Criteria

- [ ] All 5 model files created with Rust structs
- [ ] Enums use `#[serde(rename_all = "snake_case")]`
- [ ] Migration creates all tables with SCHEMAFULL
- [ ] Vector index defined for chunk embeddings
- [ ] Default agent roles seeded
- [ ] All API endpoints implemented
- [ ] Models exported from `mod.rs`
- [ ] Routes registered in `lib.rs`
- [ ] Migrations run on startup
- [ ] `cargo build` succeeds
