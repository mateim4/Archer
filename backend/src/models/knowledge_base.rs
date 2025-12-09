use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Knowledge Base Article
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeArticle {
    pub id: Option<Thing>,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub category_id: Option<Thing>,
    pub status: ArticleStatus,
    pub author_id: String,
    pub tags: Vec<String>,
    pub view_count: i32,
    pub helpful_count: i32,
    pub not_helpful_count: i32,
    pub version_number: i32,
    pub is_featured: bool,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub published_at: Option<DateTime<Utc>>,
}

/// Article Status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArticleStatus {
    #[serde(rename = "DRAFT")]
    Draft,
    #[serde(rename = "REVIEW")]
    Review,
    #[serde(rename = "PUBLISHED")]
    Published,
    #[serde(rename = "ARCHIVED")]
    Archived,
}

/// Knowledge Base Category
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeCategory {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<Thing>,
    pub icon: Option<String>,
    pub order: i32,
    pub article_count: i32,
    pub is_visible: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Article Version (for version history)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleVersion {
    pub id: Option<Thing>,
    pub article_id: Thing,
    pub version_number: i32,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub changed_by: String,
    pub change_note: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Article Feedback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleFeedback {
    pub id: Option<Thing>,
    pub article_id: Thing,
    pub user_id: String,
    pub is_helpful: bool,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Article Attachment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleAttachment {
    pub id: Option<Thing>,
    pub article_id: Thing,
    pub filename: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: String,
    pub uploaded_by: String,
    pub created_at: DateTime<Utc>,
}

/// Related Article Link
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedArticle {
    pub id: Option<Thing>,
    pub article_id: Thing,
    pub related_article_id: Thing,
    pub relation_type: RelationType,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RelationType {
    #[serde(rename = "RELATED")]
    Related,
    #[serde(rename = "PREREQUISITE")]
    Prerequisite,
    #[serde(rename = "SEE_ALSO")]
    SeeAlso,
    #[serde(rename = "SUPERSEDES")]
    Supersedes,
}

// ===== Request/Response DTOs =====

/// Create Article Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateArticleRequest {
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub category_id: Option<String>,
    pub tags: Vec<String>,
    pub status: ArticleStatus,
    pub author_id: String,
}

/// Update Article Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateArticleRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: Option<ArticleStatus>,
    pub is_featured: Option<bool>,
}

/// Create Category Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub icon: Option<String>,
    pub order: Option<i32>,
}

/// Update Category Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub icon: Option<String>,
    pub order: Option<i32>,
    pub is_visible: Option<bool>,
}

/// Search Articles Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchArticlesRequest {
    pub query: String,
    pub category_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: Option<ArticleStatus>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Article with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleWithMetadata {
    #[serde(flatten)]
    pub article: KnowledgeArticle,
    pub category_name: Option<String>,
    pub author_name: String,
    pub related_count: i32,
}
