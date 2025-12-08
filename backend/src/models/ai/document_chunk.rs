use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentChunk {
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
pub struct BatchCreateChunksRequest {
    pub chunks: Vec<CreateChunkRequest>,
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
    pub chunk: DocumentChunk,
    pub score: f32,
    pub document_title: Option<String>,
}
