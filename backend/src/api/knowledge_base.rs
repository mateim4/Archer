use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post, patch, delete},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::knowledge_base::{
        KnowledgeArticle, KnowledgeCategory, ArticleVersion,
        CreateArticleRequest, UpdateArticleRequest,
        CreateCategoryRequest, UpdateCategoryRequest,
        SearchArticlesRequest, ArticleStatus,
    },
};

/// Create Knowledge Base API router
pub fn create_knowledge_base_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/articles", get(list_articles).post(create_article))
        .route("/articles/:id", get(get_article).patch(update_article).delete(delete_article))
        .route("/articles/:id/versions", get(list_article_versions))
        .route("/articles/:id/view", post(increment_view_count))
        .route("/articles/:id/feedback", post(submit_feedback))
        .route("/search", get(search_articles))
        .route("/categories", get(list_categories).post(create_category))
        .route("/categories/:id", get(get_category).patch(update_category).delete(delete_category))
        .route("/categories/:id/articles", get(get_category_articles))
        .with_state(db)
}

// ===== Article Endpoints =====

#[derive(Debug, Deserialize)]
struct ListArticlesQuery {
    category_id: Option<String>,
    status: Option<String>,
    tag: Option<String>,
    featured: Option<bool>,
    limit: Option<i64>,
    offset: Option<i64>,
}

async fn list_articles(
    State(db): State<Arc<Database>>,
    Query(params): Query<ListArticlesQuery>,
) -> impl IntoResponse {
    // Build query based on filters
    let mut query_str = "SELECT * FROM knowledge_article WHERE is_archived = false".to_string();
    
    if let Some(category_id) = params.category_id {
        if let Ok(thing) = thing(&category_id, "knowledge_category") {
            query_str.push_str(&format!(" AND category_id = {}", thing));
        }
    }
    
    if let Some(status) = params.status {
        query_str.push_str(&format!(" AND status = '{}'", status));
    }
    
    if params.featured.unwrap_or(false) {
        query_str.push_str(" AND is_featured = true");
    }
    
    query_str.push_str(" ORDER BY updated_at DESC");
    
    if let Some(limit) = params.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
    }
    
    if let Some(offset) = params.offset {
        query_str.push_str(&format!(" START {}", offset));
    }
    
    match db.query(&query_str).await {
        Ok(mut response) => {
            let articles: Vec<KnowledgeArticle> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(articles)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_article(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_article") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.select(id_thing).await {
        Ok(article) => {
            let article: Option<KnowledgeArticle> = article;
            match article {
                Some(a) => (StatusCode::OK, Json(a)).into_response(),
                None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Article not found" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn create_article(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateArticleRequest>,
) -> impl IntoResponse {
    let category_thing = payload.category_id.and_then(|id| thing(&id, "knowledge_category").ok());
    
    let article = KnowledgeArticle {
        id: None,
        title: payload.title.clone(),
        content: payload.content.clone(),
        summary: payload.summary.clone(),
        category_id: category_thing.clone(),
        status: payload.status,
        author_id: payload.author_id,
        tags: payload.tags,
        view_count: 0,
        helpful_count: 0,
        not_helpful_count: 0,
        version_number: 1,
        is_featured: false,
        is_archived: false,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        published_at: None,
    };

    match db.create("knowledge_article").content(&article).await {
        Ok(created) => {
            let created: Vec<KnowledgeArticle> = created;
            if let Some(article) = created.into_iter().next() {
                // Create initial version
                if let Some(article_id) = &article.id {
                    let version = ArticleVersion {
                        id: None,
                        article_id: article_id.clone(),
                        version_number: 1,
                        title: payload.title,
                        content: payload.content,
                        summary: payload.summary,
                        changed_by: article.author_id.clone(),
                        change_note: Some("Initial version".to_string()),
                        created_at: Utc::now(),
                    };
                    let _: Result<Vec<ArticleVersion>, _> = db.create("article_version").content(version).await;
                }
                
                // Update category article count
                if let Some(cat_id) = category_thing {
                    let _: Result<surrealdb::Response, _> = db.query(
                        "UPDATE $category SET article_count += 1"
                    ).bind(("category", cat_id)).await;
                }
                
                (StatusCode::CREATED, Json(article)).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create article" }))).into_response()
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn update_article(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateArticleRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_article") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    let existing: Option<KnowledgeArticle> = match db.select(id_thing.clone()).await {
        Ok(a) => a,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    if let Some(mut article) = existing {
        let mut version_changed = false;
        
        // Update fields
        if let Some(title) = payload.title.clone() { 
            article.title = title; 
            version_changed = true;
        }
        if let Some(content) = payload.content.clone() { 
            article.content = content; 
            version_changed = true;
        }
        if let Some(summary) = payload.summary { article.summary = Some(summary); }
        if let Some(category_id) = payload.category_id {
            article.category_id = thing(&category_id, "knowledge_category").ok();
        }
        if let Some(tags) = payload.tags { article.tags = tags; }
        if let Some(status) = payload.status { article.status = status; }
        if let Some(is_featured) = payload.is_featured { article.is_featured = is_featured; }
        
        article.updated_at = Utc::now();
        
        // Create new version if content changed
        if version_changed {
            article.version_number += 1;
            let version = ArticleVersion {
                id: None,
                article_id: id_thing.clone(),
                version_number: article.version_number,
                title: article.title.clone(),
                content: article.content.clone(),
                summary: article.summary.clone(),
                changed_by: article.author_id.clone(),
                change_note: Some("Updated article".to_string()),
                created_at: Utc::now(),
            };
            let _: Result<Vec<ArticleVersion>, _> = db.create("article_version").content(version).await;
        }

        match db.update(id_thing).content(article).await {
            Ok(updated) => {
                let updated: Option<KnowledgeArticle> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            },
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
        }
    } else {
        (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Article not found" }))).into_response()
    }
}

async fn delete_article(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_article") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    // Soft delete: mark as archived
    match db.query("UPDATE $article SET is_archived = true, updated_at = time::now()")
        .bind(("article", id_thing))
        .await
    {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn list_article_versions(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_article") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    let query = "SELECT * FROM article_version WHERE article_id = $article_id ORDER BY version_number DESC";
    
    match db.query(query).bind(("article_id", id_thing)).await {
        Ok(mut response) => {
            let versions: Vec<ArticleVersion> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(versions)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn increment_view_count(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_article") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.query("UPDATE $article SET view_count += 1")
        .bind(("article", id_thing))
        .await
    {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "success": true }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

#[derive(Debug, Deserialize)]
struct FeedbackRequest {
    user_id: String,
    is_helpful: bool,
    comment: Option<String>,
}

async fn submit_feedback(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<FeedbackRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_article") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    // Update article feedback counters
    let counter_field = if payload.is_helpful { "helpful_count" } else { "not_helpful_count" };
    let query = format!("UPDATE $article SET {} += 1", counter_field);
    
    let _: Result<surrealdb::Response, _> = db.query(&query)
        .bind(("article", id_thing.clone()))
        .await;

    // Store feedback record
    let feedback_query = r#"
        CREATE article_feedback SET 
            article_id = $article_id,
            user_id = $user_id,
            is_helpful = $is_helpful,
            comment = $comment
    "#;
    
    match db.query(feedback_query)
        .bind(("article_id", id_thing))
        .bind(("user_id", payload.user_id))
        .bind(("is_helpful", payload.is_helpful))
        .bind(("comment", payload.comment))
        .await
    {
        Ok(_) => (StatusCode::CREATED, Json(serde_json::json!({ "success": true }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

#[derive(Debug, Deserialize)]
struct SearchQuery {
    q: String,
    category_id: Option<String>,
    limit: Option<i64>,
}

async fn search_articles(
    State(db): State<Arc<Database>>,
    Query(params): Query<SearchQuery>,
) -> impl IntoResponse {
    // Full-text search using SurrealDB's search indexes
    let mut query_str = format!(
        "SELECT * FROM knowledge_article WHERE (title @@ '{}' OR content @@ '{}') AND status = 'PUBLISHED' AND is_archived = false",
        params.q, params.q
    );
    
    if let Some(category_id) = params.category_id {
        if let Ok(thing) = thing(&category_id, "knowledge_category") {
            query_str.push_str(&format!(" AND category_id = {}", thing));
        }
    }
    
    query_str.push_str(" ORDER BY view_count DESC, helpful_count DESC");
    
    if let Some(limit) = params.limit {
        query_str.push_str(&format!(" LIMIT {}", limit));
    } else {
        query_str.push_str(" LIMIT 20");
    }
    
    match db.query(&query_str).await {
        Ok(mut response) => {
            let articles: Vec<KnowledgeArticle> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(articles)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

// ===== Category Endpoints =====

async fn list_categories(
    State(db): State<Arc<Database>>,
) -> impl IntoResponse {
    match db.query("SELECT * FROM knowledge_category WHERE is_visible = true ORDER BY order ASC").await {
        Ok(mut response) => {
            let categories: Vec<KnowledgeCategory> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(categories)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_category(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_category") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    match db.select(id_thing).await {
        Ok(category) => {
            let category: Option<KnowledgeCategory> = category;
            match category {
                Some(c) => (StatusCode::OK, Json(c)).into_response(),
                None => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Category not found" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn create_category(
    State(db): State<Arc<Database>>,
    Json(payload): Json<CreateCategoryRequest>,
) -> impl IntoResponse {
    let parent_thing = payload.parent_id.and_then(|id| thing(&id, "knowledge_category").ok());
    
    let category = KnowledgeCategory {
        id: None,
        name: payload.name,
        description: payload.description,
        parent_id: parent_thing,
        icon: payload.icon,
        order: payload.order.unwrap_or(0),
        article_count: 0,
        is_visible: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    match db.create("knowledge_category").content(category).await {
        Ok(created) => {
            let created: Vec<KnowledgeCategory> = created;
            match created.into_iter().next() {
                Some(c) => (StatusCode::CREATED, Json(c)).into_response(),
                None => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "Failed to create category" }))).into_response(),
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn update_category(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_category") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    let existing: Option<KnowledgeCategory> = match db.select(id_thing.clone()).await {
        Ok(c) => c,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    };

    if let Some(mut category) = existing {
        if let Some(name) = payload.name { category.name = name; }
        if let Some(description) = payload.description { category.description = Some(description); }
        if let Some(parent_id) = payload.parent_id {
            category.parent_id = thing(&parent_id, "knowledge_category").ok();
        }
        if let Some(icon) = payload.icon { category.icon = Some(icon); }
        if let Some(order) = payload.order { category.order = order; }
        if let Some(is_visible) = payload.is_visible { category.is_visible = is_visible; }
        category.updated_at = Utc::now();

        match db.update(id_thing).content(category).await {
            Ok(updated) => {
                let updated: Option<KnowledgeCategory> = updated;
                (StatusCode::OK, Json(updated)).into_response()
            },
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
        }
    } else {
        (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Category not found" }))).into_response()
    }
}

async fn delete_category(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_category") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    // Check if category has articles
    let query = "SELECT VALUE article_count FROM $category";
    match db.query(query).bind(("category", id_thing.clone())).await {
        Ok(mut response) => {
            let counts: Vec<i32> = response.take(0).unwrap_or_default();
            if let Some(count) = counts.first() {
                if *count > 0 {
                    return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ 
                        "error": "Cannot delete category with articles. Move or delete articles first." 
                    }))).into_response();
                }
            }
        },
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }

    match db.delete::<Option<KnowledgeCategory>>(id_thing).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

async fn get_category_articles(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let id_thing = match thing(&id, "knowledge_category") {
        Ok(t) => t,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "Invalid ID format" }))).into_response(),
    };

    let query = "SELECT * FROM knowledge_article WHERE category_id = $category_id AND is_archived = false ORDER BY updated_at DESC";
    
    match db.query(query).bind(("category_id", id_thing)).await {
        Ok(mut response) => {
            let articles: Vec<KnowledgeArticle> = response.take(0).unwrap_or_default();
            (StatusCode::OK, Json(articles)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response(),
    }
}

// Helper function to create Thing from ID string
fn thing(id: &str, table: &str) -> Result<Thing, surrealdb::Error> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from((table, id)))
    }
}
