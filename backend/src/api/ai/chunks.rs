use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::ai::{
        BatchCreateChunksRequest, ChunkSearchResult, CreateChunkRequest, DocumentChunk,
        SemanticSearchRequest,
    },
};

/// Helper function to create Thing from string ID
fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("document_chunk", id)))
    }
}

pub fn create_chunks_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", post(create_chunk))
        .route("/batch", post(batch_create_chunks))
        .route("/search", post(semantic_search))
        .route("/documents/:doc_id", get(get_document_chunks))
        .with_state(db)
}

async fn create_chunk(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateChunkRequest>,
) -> impl IntoResponse {
    let document_id = match thing(&payload.document_id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid document ID format" })),
            )
                .into_response()
        }
    };

    let embedding_dimension = payload.embedding.len() as i32;

    let chunk = DocumentChunk {
        id: None,
        document_id,
        content: payload.content,
        embedding: payload.embedding,
        embedding_model: payload.embedding_model,
        embedding_dimension,
        token_count: payload.token_count,
        start_char: payload.start_char,
        end_char: payload.end_char,
        page_number: payload.page_number,
        section_path: payload.section_path.unwrap_or_default(),
        content_hash: payload.content_hash,
        chunk_index: payload.chunk_index,
        previous_chunk_id: None,
        next_chunk_id: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match db.create("document_chunk").content(chunk).await {
        Ok(created) => {
            let created: Vec<DocumentChunk> = created;
            match created.into_iter().next() {
                Some(c) => (StatusCode::CREATED, Json(c)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to create chunk" })),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn batch_create_chunks(
    State(db): State<Arc<Database>>,
    Json(payload): Json<BatchCreateChunksRequest>,
) -> impl IntoResponse {
    let mut created_chunks = Vec::new();
    let mut errors = Vec::new();

    for chunk_req in payload.chunks {
        let document_id = match thing(&chunk_req.document_id) {
            Ok(t) => t,
            Err(e) => {
                errors.push(format!("Invalid document ID: {}", e));
                continue;
            }
        };

        let embedding_dimension = chunk_req.embedding.len() as i32;

        let chunk = DocumentChunk {
            id: None,
            document_id,
            content: chunk_req.content,
            embedding: chunk_req.embedding,
            embedding_model: chunk_req.embedding_model,
            embedding_dimension,
            token_count: chunk_req.token_count,
            start_char: chunk_req.start_char,
            end_char: chunk_req.end_char,
            page_number: chunk_req.page_number,
            section_path: chunk_req.section_path.unwrap_or_default(),
            content_hash: chunk_req.content_hash,
            chunk_index: chunk_req.chunk_index,
            previous_chunk_id: None,
            next_chunk_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        match db.create("document_chunk").content(chunk).await {
            Ok(mut created) => {
                let created: Vec<DocumentChunk> = created;
                if let Some(c) = created.into_iter().next() {
                    created_chunks.push(c);
                }
            }
            Err(e) => {
                errors.push(format!("Failed to create chunk: {}", e));
            }
        }
    }

    (
        StatusCode::CREATED,
        Json(serde_json::json!({
            "created": created_chunks,
            "errors": errors,
            "success_count": created_chunks.len(),
            "error_count": errors.len()
        })),
    )
        .into_response()
}

async fn get_document_chunks(
    State(db): State<Arc<Database>>,
    Path(doc_id): Path<String>,
) -> impl IntoResponse {
    let document_id = match thing(&doc_id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid document ID format" })),
            )
                .into_response()
        }
    };

    // Query chunks for the document
    let query = format!(
        "SELECT * FROM document_chunk WHERE document_id = {} ORDER BY chunk_index ASC",
        document_id.to_string()
    );

    match db.query(query).await {
        Ok(mut response) => match response.take::<Vec<DocumentChunk>>(0) {
            Ok(chunks) => (StatusCode::OK, Json(chunks)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn semantic_search(
    State(db): State<Arc<Database>>,
    Json(payload): Json<SemanticSearchRequest>,
) -> impl IntoResponse {
    // Note: This is a placeholder implementation
    // Full semantic search with vector similarity requires SurrealDB vector index support
    // For now, we return a basic query without vector similarity scoring

    let limit = payload.limit.unwrap_or(10);

    // Build a basic query - in production this would use vector similarity search
    let query = format!(
        "SELECT * FROM document_chunk LIMIT {}",
        limit
    );

    match db.query(query).await {
        Ok(mut response) => match response.take::<Vec<DocumentChunk>>(0) {
            Ok(chunks) => {
                // Convert to search results with placeholder scores
                let results: Vec<ChunkSearchResult> = chunks
                    .into_iter()
                    .map(|chunk| ChunkSearchResult {
                        chunk,
                        score: 0.0, // Placeholder - would be cosine similarity in production
                        document_title: None, // Could be joined from document table
                    })
                    .collect();

                (StatusCode::OK, Json(results)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}
