use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::ai::{
        CreateDocumentRequest, Document, DocumentStatus, SensitivityLevel, UpdateDocumentRequest,
    },
};

/// Helper function to create Thing from string ID
fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("document", id)))
    }
}

pub fn create_documents_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_documents).post(create_document))
        .route(
            "/:id",
            get(get_document)
                .patch(update_document)
                .delete(archive_document),
        )
        .with_state(db)
}

async fn list_documents(State(db): State<Arc<Database>>) -> impl IntoResponse {
    match db.select("document").await {
        Ok(documents) => {
            let documents: Vec<Document> = documents;
            (StatusCode::OK, Json(documents)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn get_document(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
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
        Ok(document) => {
            let document: Option<Document> = document;
            match document {
                Some(d) => (StatusCode::OK, Json(d)).into_response(),
                None => (
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({ "error": "Document not found" })),
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

async fn create_document(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateDocumentRequest>,
) -> impl IntoResponse {
    let document = Document {
        id: None,
        title: payload.title,
        filename: payload.filename,
        mime_type: payload.mime_type,
        source_type: payload.source_type,
        source_url: payload.source_url,
        source_id: None,
        content_hash: payload.content_hash,
        version: None,
        size_bytes: payload.size_bytes,
        page_count: None,
        chunk_count: 0,
        status: DocumentStatus::Pending,
        error_message: None,
        sensitivity_level: payload
            .sensitivity_level
            .unwrap_or(SensitivityLevel::Internal),
        tags: payload.tags.unwrap_or_default(),
        source_created_at: None,
        source_modified_at: None,
        last_synced_at: None,
        indexed_at: None,
        created_by: payload.created_by,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match db.create("document").content(document).await {
        Ok(created) => {
            let created: Vec<Document> = created;
            match created.into_iter().next() {
                Some(d) => (StatusCode::CREATED, Json(d)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to create document" })),
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

async fn update_document(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateDocumentRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    // First fetch the existing document
    let existing: Option<Document> = match db.select(id_thing.clone()).await {
        Ok(doc) => doc,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    let mut document = match existing {
        Some(d) => d,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Document not found" })),
            )
                .into_response()
        }
    };

    // Update fields if provided
    if let Some(status) = payload.status {
        document.status = status;
    }
    if let Some(error_message) = payload.error_message {
        document.error_message = Some(error_message);
    }
    if let Some(chunk_count) = payload.chunk_count {
        document.chunk_count = chunk_count;
    }
    if let Some(indexed_at) = payload.indexed_at {
        document.indexed_at = Some(indexed_at);
    }
    if let Some(tags) = payload.tags {
        document.tags = tags;
    }
    document.updated_at = Utc::now();

    match db.update::<Option<Document>>(id_thing).content(document).await {
        Ok(updated) => {
            match updated {
                Some(d) => (StatusCode::OK, Json(d)).into_response(),
                None => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({ "error": "Failed to update document" })),
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

async fn archive_document(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" })),
            )
                .into_response()
        }
    };

    // Soft delete by updating status to Archived
    let existing: Option<Document> = match db.select(id_thing.clone()).await {
        Ok(doc) => doc,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    let mut document = match existing {
        Some(d) => d,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Document not found" })),
            )
                .into_response()
        }
    };

    document.status = DocumentStatus::Archived;
    document.updated_at = Utc::now();

    match db.update::<Option<Document>>(id_thing).content(document).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({ "message": "Document archived successfully" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}
