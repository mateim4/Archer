use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Document source type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentSourceType {
    Upload,
    SharepointSync,
    GithubIssue,
    TicketAttachment,
    SlackMessage,
    Email,
    Manual,
    Api,
}

/// Document processing status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Failed,
    Archived,
}

/// Sensitivity level for access control
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SensitivityLevel {
    Public,
    Internal,
    Confidential,
    Secret,
    TopSecret,
}

/// A document in the knowledge base
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Unique identifier
    pub id: Option<Thing>,
    
    /// Document title
    pub title: String,
    
    /// Original filename
    pub filename: Option<String>,
    
    /// MIME type
    pub mime_type: Option<String>,
    
    /// How this document was sourced
    pub source_type: DocumentSourceType,
    
    /// Source URL (if applicable)
    pub source_url: Option<String>,
    
    /// External source ID
    pub source_id: Option<String>,
    
    /// Hash of full content
    pub content_hash: String,
    
    /// Document version
    pub version: Option<String>,
    
    /// Size in bytes
    pub size_bytes: Option<i64>,
    
    /// Number of pages
    pub page_count: Option<i32>,
    
    /// Number of chunks created
    pub chunk_count: i32,
    
    /// Processing status
    pub status: DocumentStatus,
    
    /// Error message if failed
    pub error_message: Option<String>,
    
    /// Sensitivity level for access control
    pub sensitivity_level: SensitivityLevel,
    
    /// Tags for categorization
    pub tags: Vec<String>,
    
    /// When source was created
    pub source_created_at: Option<DateTime<Utc>>,
    
    /// When source was last modified
    pub source_modified_at: Option<DateTime<Utc>>,
    
    /// When last synced from source
    pub last_synced_at: Option<DateTime<Utc>>,
    
    /// When indexed/embedded
    pub indexed_at: Option<DateTime<Utc>>,
    
    /// User who uploaded/created
    pub created_by: String,
    
    /// Record timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
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
    pub sensitivity_level: Option<SensitivityLevel>,
    pub tags: Option<Vec<String>>,
    pub created_by: String,
}

/// Request to update a document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDocumentRequest {
    pub title: Option<String>,
    pub status: Option<DocumentStatus>,
    pub error_message: Option<String>,
    pub chunk_count: Option<i32>,
    pub indexed_at: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
    pub sensitivity_level: Option<SensitivityLevel>,
}

/// Query parameters for listing documents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentQuery {
    pub source_type: Option<DocumentSourceType>,
    pub status: Option<DocumentStatus>,
    pub sensitivity_level: Option<SensitivityLevel>,
    pub tags: Option<Vec<String>>,
    pub created_by: Option<String>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

/// A chunk of a document for RAG
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chunk {
    /// Unique identifier
    pub id: Option<Thing>,
    
    /// Reference to parent document
    pub document_id: Thing,
    
    /// Text content of this chunk
    pub content: String,
    
    /// Vector embedding (dimension depends on model)
    pub embedding: Vec<f32>,
    
    /// Embedding model used
    pub embedding_model: String,
    
    /// Embedding dimension
    pub embedding_dimension: i32,
    
    /// Token count
    pub token_count: i32,
    
    /// Character positions in original document
    pub start_char: i32,
    pub end_char: i32,
    
    /// Page number if applicable
    pub page_number: Option<i32>,
    
    /// Section hierarchy path
    pub section_path: Vec<String>,
    
    /// Hash of chunk content
    pub content_hash: String,
    
    /// Sequential index within document
    pub chunk_index: i32,
    
    /// Link to previous chunk for context
    pub previous_chunk_id: Option<Thing>,
    
    /// Link to next chunk for context
    pub next_chunk_id: Option<Thing>,
    
    /// Record timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a chunk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateChunkRequest {
    pub document_id: String,
    pub content: String,
    pub embedding: Vec<f32>,
    pub embedding_model: String,
    pub embedding_dimension: i32,
    pub token_count: i32,
    pub start_char: i32,
    pub end_char: i32,
    pub page_number: Option<i32>,
    pub section_path: Option<Vec<String>>,
    pub chunk_index: i32,
    pub previous_chunk_id: Option<String>,
}

/// Request to search chunks by embedding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticSearchRequest {
    pub embedding: Vec<f32>,
    pub limit: Option<i32>,
    pub min_similarity: Option<f32>,
    pub document_ids: Option<Vec<String>>,
}

/// Search result with similarity score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkSearchResult {
    pub chunk: Chunk,
    pub similarity_score: f32,
    pub document: Option<Document>,
}
