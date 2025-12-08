use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use chrono::Utc;
use sha2::{Sha256, Digest};
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::document::{Chunk, ChunkSearchResult, CreateChunkRequest, SemanticSearchRequest},
};

/// Create Chunks API router
pub fn create_chunks_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", post(create_chunk))
        .route("/batch", post(batch_create_chunks))
        .route("/:id", get(get_chunk))
        .route("/search", post(semantic_search))
        .with_state(db)
}

/// Nested router for document-specific chunk operations
pub fn document_chunks_routes() -> Router<Arc<Database>> {
    Router::new()
        .route("/:doc_id/chunks", get(list_document_chunks).delete(delete_document_chunks))
}

async fn create_chunk(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateChunkRequest>,
) -> impl IntoResponse {
    let document_id = match thing(&payload.document_id, "document") {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid document ID format" })),
            )
                .into_response()
        }
    };

    let previous_chunk_id = payload
        .previous_chunk_id
        .and_then(|id| thing(&id, "chunk").ok());

    let mut hasher = Sha256::new();
    hasher.update(payload.content.as_bytes());
    let content_hash = format!("{:x}", hasher.finalize());

    let chunk = Chunk {
        id: None,
        document_id,
        content: payload.content,
        embedding: payload.embedding,
        embedding_model: payload.embedding_model,
        embedding_dimension: payload.embedding_dimension,
        token_count: payload.token_count,
        start_char: payload.start_char,
        end_char: payload.end_char,
        page_number: payload.page_number,
        section_path: payload.section_path.unwrap_or_default(),
        content_hash,
        chunk_index: payload.chunk_index,
        previous_chunk_id,
        next_chunk_id: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match db.create("chunk").content(chunk).await {
        Ok(created) => {
            let created: Vec<Chunk> = created;
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
    Json(payload): Json<Vec<CreateChunkRequest>>,
) -> impl IntoResponse {
    let mut created_chunks = Vec::new();
    let mut errors = Vec::new();

    for (idx, chunk_req) in payload.into_iter().enumerate() {
        let document_id = match thing(&chunk_req.document_id, "document") {
            Ok(t) => t,
            Err(_) => {
                errors.push(format!("Chunk {}: Invalid document ID", idx));
                continue;
            }
        };

        let previous_chunk_id = chunk_req
            .previous_chunk_id
            .and_then(|id| thing(&id, "chunk").ok());

        let mut hasher = Sha256::new();
        hasher.update(chunk_req.content.as_bytes());
        let content_hash = format!("{:x}", hasher.finalize());

        let chunk = Chunk {
            id: None,
            document_id,
            content: chunk_req.content.clone(),
            embedding: chunk_req.embedding,
            embedding_model: chunk_req.embedding_model,
            embedding_dimension: chunk_req.embedding_dimension,
            token_count: chunk_req.token_count,
            start_char: chunk_req.start_char,
            end_char: chunk_req.end_char,
            page_number: chunk_req.page_number,
            section_path: chunk_req.section_path.unwrap_or_default(),
            content_hash,
            chunk_index: chunk_req.chunk_index,
            previous_chunk_id,
            next_chunk_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        match db.create("chunk").content(chunk).await {
            Ok(result) => {
                let result: Vec<Chunk> = result;
                if let Some(c) = result.into_iter().next() {
                    created_chunks.push(c);
                }
            }
            Err(e) => errors.push(format!("Chunk {}: {}", idx, e)),
        }
    }

    (
        StatusCode::CREATED,
        Json(serde_json::json!({
            "created": created_chunks,
            "errors": errors,
            "total": created_chunks.len(),
            "failed": errors.len()
        })),
    )
        .into_response()
}

async fn get_chunk(State(db): State<Arc<Database>>, Path(id): Path<String>) -> impl IntoResponse {
    let id_thing = match thing(&id, "chunk") {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    match db.select(id_thing).await {
        Ok(chunk) => {
            let chunk: Option<Chunk> = chunk;
            match chunk {
                Some(c) => (StatusCode::OK, Json(c)).into_response(),
                None => (
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({ "error": "Chunk not found" })),
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

async fn list_document_chunks(
    State(db): State<Arc<Database>>,
    Path(doc_id): Path<String>,
) -> impl IntoResponse {
    let query = format!(
        "SELECT * FROM chunk WHERE document_id = document:{} ORDER BY chunk_index ASC",
        doc_id
    );

    match db.query(&query).await {
        Ok(mut result) => {
            let chunks: Vec<Chunk> = result.take(0).unwrap_or_default();
            (StatusCode::OK, Json(chunks)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn delete_document_chunks(
    State(db): State<Arc<Database>>,
    Path(doc_id): Path<String>,
) -> impl IntoResponse {
    let query = format!("DELETE FROM chunk WHERE document_id = document:{}", doc_id);

    match db.query(&query).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
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
    let limit = payload.limit.unwrap_or(10);
    let min_similarity = payload.min_similarity.unwrap_or(0.7);

    // Vector search query using SurrealDB's vector search capabilities
    // Note: This is a simplified version. In production, you'd use the vector index
    let query = format!(
        r#"
        SELECT *, 
               vector::similarity::cosine(embedding, $embedding) AS similarity
        FROM chunk
        WHERE vector::similarity::cosine(embedding, $embedding) > {}
        ORDER BY similarity DESC
        LIMIT {}
        "#,
        min_similarity, limit
    );

    match db
        .query(&query)
        .bind(("embedding", payload.embedding))
        .await
    {
        Ok(mut result) => {
            let chunks: Vec<Chunk> = result.take(0).unwrap_or_default();
            let results: Vec<ChunkSearchResult> = chunks
                .into_iter()
                .map(|chunk| ChunkSearchResult {
                    chunk,
                    similarity_score: 0.0, // Would be computed by the query
                    document: None,        // Could be joined in production
                })
                .collect();

            (StatusCode::OK, Json(results)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

fn thing(id: &str, table: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from((table, id)))
    }
}
