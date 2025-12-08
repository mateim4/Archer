use axum::{
    extract::{Path, Query, State},
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
    models::document::{
        CreateDocumentRequest, Document, DocumentQuery, DocumentStatus, SensitivityLevel,
        UpdateDocumentRequest,
    },
};

/// Create Documents API router
pub fn create_documents_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(list_documents).post(create_document))
        .route("/:id", get(get_document).patch(update_document).delete(delete_document))
        .route("/:id/reindex", post(reindex_document))
        .with_state(db)
}

async fn list_documents(
    State(db): State<Arc<Database>>,
    Query(query): Query<DocumentQuery>,
) -> impl IntoResponse {
    // Build query based on filters
    let mut surql_query = String::from("SELECT * FROM document WHERE 1=1");
    
    if let Some(source_type) = query.source_type {
        surql_query.push_str(&format!(" AND source_type = '{:?}'", source_type));
    }
    if let Some(status) = query.status {
        surql_query.push_str(&format!(" AND status = '{:?}'", status));
    }
    if let Some(created_by) = query.created_by {
        surql_query.push_str(&format!(" AND created_by = '{}'", created_by));
    }
    
    surql_query.push_str(" ORDER BY created_at DESC");
    
    if let Some(limit) = query.limit {
        surql_query.push_str(&format!(" LIMIT {}", limit));
    }
    
    match db.query(&surql_query).await {
        Ok(mut result) => {
            let documents: Vec<Document> = result.take(0).unwrap_or_default();
            (StatusCode::OK, Json(documents)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

async fn get_document(State(db): State<Arc<Database>>, Path(id): Path<String>) -> impl IntoResponse {
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
        source_id: payload.source_id,
        content_hash: payload.content_hash,
        version: payload.version,
        size_bytes: payload.size_bytes,
        page_count: payload.page_count,
        chunk_count: 0,
        status: DocumentStatus::Pending,
        error_message: None,
        sensitivity_level: payload.sensitivity_level.unwrap_or(SensitivityLevel::Internal),
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

    // Fetch existing document
    let existing: Option<Document> = match db.select(id_thing.clone()).await {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut document) = existing {
        if let Some(title) = payload.title {
            document.title = title;
        }
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
        if let Some(sensitivity_level) = payload.sensitivity_level {
            document.sensitivity_level = sensitivity_level;
        }
        document.updated_at = Utc::now();

        match db.update(id_thing).content(document).await {
            Ok(updated) => {
                let updated: Option<Document> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Document not found" })),
        )
            .into_response()
    }
}

async fn delete_document(
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

    // Soft delete: update status to Archived
    let existing: Option<Document> = match db.select(id_thing.clone()).await {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut document) = existing {
        document.status = DocumentStatus::Archived;
        document.updated_at = Utc::now();

        match db.update::<Option<Document>>(id_thing).content(document).await {
            Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Document not found" })),
        )
            .into_response()
    }
}

async fn reindex_document(
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

    let existing: Option<Document> = match db.select(id_thing.clone()).await {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response()
        }
    };

    if let Some(mut document) = existing {
        document.status = DocumentStatus::Pending;
        document.updated_at = Utc::now();
        document.indexed_at = None;

        match db.update(id_thing).content(document).await {
            Ok(updated) => {
                let updated: Option<Document> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Document not found" })),
        )
            .into_response()
    }
}

fn thing(id: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("document", id)))
    }
}
