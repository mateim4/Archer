// Archer ITSM - Knowledge Base Models (Phase 1.5)
// Articles, categories, versioning, and search

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// ARTICLE MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBArticle {
    pub id: Option<Thing>,
    pub title: String,
    pub slug: String,
    pub summary: Option<String>,
    pub content: String,
    pub category_id: Option<Thing>,
    pub tags: Vec<String>,
    pub status: ArticleStatus,
    pub visibility: ArticleVisibility,
    /// Current version number
    pub version: u32,
    /// View count for popularity
    pub view_count: u64,
    /// Helpfulness counts
    pub helpful_count: u32,
    pub not_helpful_count: u32,
    /// Related articles (manual curation)
    pub related_articles: Vec<Thing>,
    /// SEO metadata
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    /// Author and audit
    pub author_id: String,
    pub author_name: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tenant_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArticleStatus {
    #[serde(rename = "DRAFT")]
    Draft,
    #[serde(rename = "PENDING_REVIEW")]
    PendingReview,
    #[serde(rename = "PUBLISHED")]
    Published,
    #[serde(rename = "ARCHIVED")]
    Archived,
}

impl Default for ArticleStatus {
    fn default() -> Self {
        ArticleStatus::Draft
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArticleVisibility {
    #[serde(rename = "PUBLIC")]
    Public,
    #[serde(rename = "INTERNAL")]
    Internal,
    #[serde(rename = "RESTRICTED")]
    Restricted,
}

impl Default for ArticleVisibility {
    fn default() -> Self {
        ArticleVisibility::Internal
    }
}

// ============================================================================
// CATEGORY MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBCategory {
    pub id: Option<Thing>,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub parent_id: Option<Thing>,
    pub icon: Option<String>,
    pub display_order: i32,
    pub is_active: bool,
    pub article_count: u32,
    pub tenant_id: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// VERSION MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBArticleVersion {
    pub id: Option<Thing>,
    pub article_id: Thing,
    pub version: u32,
    pub title: String,
    pub content: String,
    pub change_summary: Option<String>,
    pub created_by: String,
    pub created_by_name: String,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// RATING MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBArticleRating {
    pub id: Option<Thing>,
    pub article_id: Thing,
    pub user_id: String,
    pub is_helpful: bool,
    pub feedback: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// REQUEST/RESPONSE MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateArticleRequest {
    pub title: String,
    pub summary: Option<String>,
    pub content: String,
    pub category_id: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub visibility: ArticleVisibility,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateArticleRequest {
    pub title: Option<String>,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub visibility: Option<ArticleVisibility>,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub change_summary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub icon: Option<String>,
    pub display_order: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub icon: Option<String>,
    pub display_order: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBSearchRequest {
    pub query: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: Option<Vec<ArticleStatus>>,
    pub visibility: Option<Vec<ArticleVisibility>>,
    pub author_id: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBArticleListResponse {
    pub items: Vec<KBArticle>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KBStatistics {
    pub total_articles: u64,
    pub published_articles: u64,
    pub draft_articles: u64,
    pub total_categories: u64,
    pub total_views: u64,
    pub by_category: Vec<CategoryStat>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryStat {
    pub category_id: String,
    pub category_name: String,
    pub article_count: u64,
}
