// Archer ITSM - Knowledge Base API Endpoints
// Knowledge Base REST API with article management, search, and ratings

use crate::database::Database;
use crate::middleware::auth::AuthenticatedUser;
use crate::models::knowledge::*;
use crate::services::knowledge_service::KnowledgeService;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// ============================================================================
// ROUTER
// ============================================================================

pub fn knowledge_routes() -> Router<Arc<Database>> {
    Router::new()
        // Article endpoints
        .route("/articles", get(list_articles).post(create_article))
        .route("/articles/search", post(search_articles))
        .route("/articles/:id", get(get_article).put(update_article).delete(delete_article))
        .route("/articles/:id/publish", post(publish_article))
        .route("/articles/:id/rate", post(rate_article))
        .route("/articles/:id/versions", get(get_article_versions))
        .route("/articles/by-slug/:slug", get(get_article_by_slug))
        // Category endpoints
        .route("/categories", get(list_categories).post(create_category))
        .route("/categories/:id", get(get_category).put(update_category).delete(delete_category))
        // Statistics
        .route("/statistics", get(get_statistics))
}

// ============================================================================
// ARTICLE HANDLERS
// ============================================================================

/// Create a new article
async fn create_article(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<CreateArticleRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:create") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:create' required".to_string(),
        })));
    }

    let tenant_id = user.tenant_id.as_ref();

    match KnowledgeService::create_article(
        db,
        request,
        &user.user_id,
        &user.username,
        tenant_id.map(|t| t.as_str()),
    )
    .await
    {
        Ok(article) => Ok((StatusCode::CREATED, Json(article))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// List articles with optional filtering
async fn list_articles(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(params): Query<ListArticlesParams>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    // Determine visibility based on user
    let include_internal = user.has_permission("kb:read_internal");

    let request = KBSearchRequest {
        query: params.query,
        category_id: params.category_id,
        tags: params.tags,
        status: params.status,
        visibility: if include_internal { None } else { Some(vec![ArticleVisibility::Public]) },
        author_id: params.author_id,
        page: params.page,
        page_size: params.page_size,
    };

    match KnowledgeService::search_articles(db, request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Search articles
async fn search_articles(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(mut request): Json<KBSearchRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    // Filter visibility based on user permissions
    if !user.has_permission("kb:read_internal") {
        request.visibility = Some(vec![ArticleVisibility::Public]);
    }

    match KnowledgeService::search_articles(db, request).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get article by ID
async fn get_article(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::get_article(db.clone(), &id).await {
        Ok(Some(article)) => {
            // Check visibility
            if article.visibility == ArticleVisibility::Internal
                && !user.has_permission("kb:read_internal")
            {
                return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
                    error: "Access to internal articles denied".to_string(),
                })));
            }
            // Increment view count (fire and forget)
            let _ = KnowledgeService::increment_view_count(db, &id).await;
            Ok(Json(article))
        }
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "Article not found".to_string() }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get article by slug
async fn get_article_by_slug(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::get_article_by_slug(db.clone(), &slug).await {
        Ok(Some(article)) => {
            if article.visibility == ArticleVisibility::Internal
                && !user.has_permission("kb:read_internal")
            {
                return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
                    error: "Access to internal articles denied".to_string(),
                })));
            }
            // Increment view count
            if let Some(ref id) = article.id {
                let id_str = id.id.to_string();
                let _ = KnowledgeService::increment_view_count(db, &id_str).await;
            }
            Ok(Json(article))
        }
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: format!("Article '{}' not found", slug) }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Update an article
async fn update_article(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(request): Json<UpdateArticleRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:update") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:update' required".to_string(),
        })));
    }

    match KnowledgeService::update_article(
        db,
        &id,
        request,
        &user.user_id,
        &user.username,
    )
    .await
    {
        Ok(article) => Ok(Json(article)),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Delete an article
async fn delete_article(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:delete") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:delete' required".to_string(),
        })));
    }

    match KnowledgeService::delete_article(db, &id).await {
        Ok(()) => Ok(StatusCode::NO_CONTENT),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Publish an article
async fn publish_article(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:publish") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:publish' required".to_string(),
        })));
    }

    match KnowledgeService::publish_article(
        db,
        &id,
        &user.user_id,
    )
    .await
    {
        Ok(article) => Ok(Json(article)),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Rate an article
async fn rate_article(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(request): Json<RateArticleRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::rate_article(
        db,
        &id,
        &user.user_id,
        request.is_helpful,
        request.feedback,
    )
    .await
    {
        Ok(rating) => Ok(Json(rating)),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get article version history
async fn get_article_versions(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::get_article_versions(db, &id).await {
        Ok(versions) => Ok(Json(versions)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

// ============================================================================
// CATEGORY HANDLERS
// ============================================================================

/// Create a new category
async fn create_category(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<CreateCategoryRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:manage") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:manage' required".to_string(),
        })));
    }

    match KnowledgeService::create_category(db, request).await {
        Ok(category) => Ok((StatusCode::CREATED, Json(category))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// List all categories
async fn list_categories(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::list_categories(db, None).await {
        Ok(categories) => Ok(Json(categories)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get category by ID
async fn get_category(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::get_category(db, &id).await {
        Ok(Some(category)) => Ok(Json(category)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: "Category not found".to_string() }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Update a category
async fn update_category(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(request): Json<UpdateCategoryRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:manage") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:manage' required".to_string(),
        })));
    }

    match KnowledgeService::update_category(db, &id, request).await {
        Ok(category) => Ok(Json(category)),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Delete a category
async fn delete_category(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:manage") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:manage' required".to_string(),
        })));
    }

    match KnowledgeService::delete_category(db, &id).await {
        Ok(()) => Ok(StatusCode::NO_CONTENT),
        Err(e) if e.contains("not found") => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) if e.contains("articles") => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e }),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

/// Get KB statistics
async fn get_statistics(
    State(db): State<Arc<Database>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if !user.has_permission("kb:read") {
        return Err((StatusCode::FORBIDDEN, Json(ErrorResponse {
            error: "Permission 'kb:read' required".to_string(),
        })));
    }

    match KnowledgeService::get_statistics(db).await {
        Ok(stats) => Ok(Json(stats)),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e }),
        )),
    }
}

// ============================================================================
// QUERY PARAMS & DTOs
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ListArticlesParams {
    pub query: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: Option<Vec<ArticleStatus>>,
    pub author_id: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct RateArticleRequest {
    pub is_helpful: bool,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}
