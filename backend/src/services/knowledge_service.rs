// Archer ITSM - Knowledge Base Service (Phase 1.5)
// Article management, search, versioning, and ratings

use crate::models::knowledge::*;
use chrono::Utc;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use std::sync::Arc;
use surrealdb::engine::local::Db;
use surrealdb::sql::Thing;
use surrealdb::Surreal;

pub struct KnowledgeService;

impl KnowledgeService {
    // ========================================================================
    // ARTICLE OPERATIONS
    // ========================================================================

    /// Create a new article (starts as draft)
    pub async fn create_article(
        db: Arc<Surreal<Db>>,
        request: CreateArticleRequest,
        user_id: &str,
        user_name: &str,
        tenant_id: Option<&str>,
    ) -> Result<KBArticle, String> {
        let now = Utc::now();
        let slug = Self::generate_slug(&request.title);

        // Check for duplicate slug
        let existing: Option<KBArticle> = db
            .query("SELECT * FROM kb_articles WHERE slug = $slug LIMIT 1")
            .bind(("slug", &slug))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        if existing.is_some() {
            return Err(format!("Article with slug '{}' already exists", slug));
        }

        let tenant_thing = tenant_id.map(|t| Thing::from(("tenants", t)));
        let category_thing = request.category_id.as_ref()
            .map(|id| Thing::from(("kb_categories", id.as_str())));

        let article = KBArticle {
            id: None,
            title: request.title,
            slug,
            summary: request.summary,
            content: request.content,
            category_id: category_thing,
            tags: request.tags,
            status: ArticleStatus::Draft,
            visibility: request.visibility,
            version: 1,
            view_count: 0,
            helpful_count: 0,
            not_helpful_count: 0,
            resolution_count: 0,
            helpfulness_score: 0.0,
            related_articles: vec![],
            seo_title: request.seo_title,
            seo_description: request.seo_description,
            author_id: user_id.to_string(),
            author_name: user_name.to_string(),
            approved_by: None,
            approved_at: None,
            published_at: None,
            expires_at: request.expires_at,
            created_at: now,
            updated_at: now,
            tenant_id: tenant_thing,
        };

        let created: Vec<KBArticle> = db
            .create("kb_articles")
            .content(&article)
            .await
            .map_err(|e| e.to_string())?;

        let created_article = created.into_iter().next()
            .ok_or_else(|| "Failed to create article".to_string())?;

        // Create initial version
        Self::create_version(
            db,
            created_article.id.as_ref().unwrap().clone(),
            1,
            &created_article.title,
            &created_article.content,
            Some("Initial version"),
            user_id,
            user_name,
        ).await?;

        Ok(created_article)
    }

    /// Generate URL-safe slug from title
    fn generate_slug(title: &str) -> String {
        title
            .to_lowercase()
            .chars()
            .map(|c| {
                if c.is_alphanumeric() {
                    c
                } else if c.is_whitespace() || c == '-' || c == '_' {
                    '-'
                } else {
                    '-'
                }
            })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("-")
    }

    /// Get article by ID
    pub async fn get_article(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<Option<KBArticle>, String> {
        let article: Option<KBArticle> = db
            .select(("kb_articles", id))
            .await
            .map_err(|e| e.to_string())?;
        Ok(article)
    }

    /// Get article by slug
    pub async fn get_article_by_slug(
        db: Arc<Surreal<Db>>,
        slug: &str,
    ) -> Result<Option<KBArticle>, String> {
        let article: Option<KBArticle> = db
            .query("SELECT * FROM kb_articles WHERE slug = $slug LIMIT 1")
            .bind(("slug", slug))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;
        Ok(article)
    }

    /// Increment view count
    pub async fn increment_view_count(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<(), String> {
        let _: Option<KBArticle> = db
            .query("UPDATE kb_articles SET view_count += 1 WHERE id = $id")
            .bind(("id", Thing::from(("kb_articles", id))))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Update an article
    pub async fn update_article(
        db: Arc<Surreal<Db>>,
        id: &str,
        request: UpdateArticleRequest,
        user_id: &str,
        user_name: &str,
    ) -> Result<KBArticle, String> {
        let existing = Self::get_article(db.clone(), id).await?
            .ok_or_else(|| "Article not found".to_string())?;

        let now = Utc::now();
        let new_version = existing.version + 1;

        // Build update
        let updated: Option<KBArticle> = db
            .query(r#"
                UPDATE kb_articles SET
                    title = $title,
                    summary = $summary,
                    content = $content,
                    category_id = $category_id,
                    tags = $tags,
                    visibility = $visibility,
                    seo_title = $seo_title,
                    seo_description = $seo_description,
                    expires_at = $expires_at,
                    version = $version,
                    updated_at = $updated_at
                WHERE id = $id
                RETURN AFTER
            "#)
            .bind(("id", Thing::from(("kb_articles", id))))
            .bind(("title", request.title.unwrap_or(existing.title.clone())))
            .bind(("summary", request.summary.or(existing.summary.clone())))
            .bind(("content", request.content.clone().unwrap_or(existing.content.clone())))
            .bind(("category_id", request.category_id.map(|c| Thing::from(("kb_categories", c.as_str()))).or(existing.category_id.clone())))
            .bind(("tags", request.tags.unwrap_or(existing.tags.clone())))
            .bind(("visibility", request.visibility.unwrap_or(existing.visibility.clone())))
            .bind(("seo_title", request.seo_title.or(existing.seo_title.clone())))
            .bind(("seo_description", request.seo_description.or(existing.seo_description.clone())))
            .bind(("expires_at", request.expires_at.or(existing.expires_at)))
            .bind(("version", new_version))
            .bind(("updated_at", now))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let updated_article = updated.ok_or_else(|| "Failed to update article".to_string())?;

        // Create new version if content changed
        if request.content.is_some() {
            Self::create_version(
                db,
                updated_article.id.as_ref().unwrap().clone(),
                new_version,
                &updated_article.title,
                &updated_article.content,
                request.change_summary.as_deref(),
                user_id,
                user_name,
            ).await?;
        }

        Ok(updated_article)
    }

    /// Delete an article
    pub async fn delete_article(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<(), String> {
        let _: Option<KBArticle> = db
            .delete(("kb_articles", id))
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Publish an article
    pub async fn publish_article(
        db: Arc<Surreal<Db>>,
        id: &str,
        approver_id: &str,
    ) -> Result<KBArticle, String> {
        let now = Utc::now();

        let updated: Option<KBArticle> = db
            .query(r#"
                UPDATE kb_articles SET
                    status = 'PUBLISHED',
                    approved_by = $approver,
                    approved_at = $now,
                    published_at = $now,
                    updated_at = $now
                WHERE id = $id
                RETURN AFTER
            "#)
            .bind(("id", Thing::from(("kb_articles", id))))
            .bind(("approver", approver_id))
            .bind(("now", now))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        updated.ok_or_else(|| "Article not found".to_string())
    }

    /// Search articles
    pub async fn search_articles(
        db: Arc<Surreal<Db>>,
        request: KBSearchRequest,
    ) -> Result<KBArticleListResponse, String> {
        let page = request.page.unwrap_or(1).max(1);
        let page_size = request.page_size.unwrap_or(20).min(100);
        let offset = (page - 1) * page_size;

        let mut conditions = vec!["status != 'ARCHIVED'".to_string()];

        if let Some(ref query) = request.query {
            conditions.push(format!("(title CONTAINS '{}' OR content CONTAINS '{}')", query, query));
        }

        if let Some(ref cat_id) = request.category_id {
            conditions.push(format!("category_id = kb_categories:{}", cat_id));
        }

        if let Some(ref statuses) = request.status {
            let status_list: Vec<String> = statuses.iter()
                .map(|s| format!("'{}'", serde_json::to_string(s).unwrap().trim_matches('"')))
                .collect();
            conditions.push(format!("status IN [{}]", status_list.join(",")));
        }

        if let Some(ref vis) = request.visibility {
            let vis_list: Vec<String> = vis.iter()
                .map(|v| format!("'{}'", serde_json::to_string(v).unwrap().trim_matches('"')))
                .collect();
            conditions.push(format!("visibility IN [{}]", vis_list.join(",")));
        }

        if let Some(ref author) = request.author_id {
            conditions.push(format!("author_id = '{}'", author));
        }

        let where_clause = conditions.join(" AND ");

        // Get count
        let count_query = format!(
            "SELECT count() FROM kb_articles WHERE {} GROUP ALL",
            where_clause
        );

        let count_result: Vec<JsonValue> = db
            .query(&count_query)
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let total = count_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        // Get items
        let items_query = format!(
            "SELECT * FROM kb_articles WHERE {} ORDER BY updated_at DESC LIMIT {} START {}",
            where_clause, page_size, offset
        );

        let items: Vec<KBArticle> = db
            .query(&items_query)
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(KBArticleListResponse {
            items,
            total,
            page,
            page_size,
        })
    }

    // ========================================================================
    // VERSION OPERATIONS
    // ========================================================================

    /// Create a version record
    async fn create_version(
        db: Arc<Surreal<Db>>,
        article_id: Thing,
        version: u32,
        title: &str,
        content: &str,
        change_summary: Option<&str>,
        user_id: &str,
        user_name: &str,
    ) -> Result<KBArticleVersion, String> {
        let version_record = KBArticleVersion {
            id: None,
            article_id,
            version,
            title: title.to_string(),
            content: content.to_string(),
            change_summary: change_summary.map(|s| s.to_string()),
            created_by: user_id.to_string(),
            created_by_name: user_name.to_string(),
            created_at: Utc::now(),
        };

        let created: Vec<KBArticleVersion> = db
            .create("kb_article_versions")
            .content(&version_record)
            .await
            .map_err(|e| e.to_string())?;

        created.into_iter().next()
            .ok_or_else(|| "Failed to create version".to_string())
    }

    /// Get article versions
    pub async fn get_article_versions(
        db: Arc<Surreal<Db>>,
        article_id: &str,
    ) -> Result<Vec<KBArticleVersion>, String> {
        let article_thing = Thing::from(("kb_articles", article_id));

        let versions: Vec<KBArticleVersion> = db
            .query("SELECT * FROM kb_article_versions WHERE article_id = $id ORDER BY version DESC")
            .bind(("id", &article_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(versions)
    }

    // ========================================================================
    // RATING OPERATIONS
    // ========================================================================

    /// Rate an article
    pub async fn rate_article(
        db: Arc<Surreal<Db>>,
        article_id: &str,
        user_id: &str,
        is_helpful: bool,
        feedback: Option<String>,
    ) -> Result<KBArticleRating, String> {
        let article_thing = Thing::from(("kb_articles", article_id));

        // Check for existing rating
        let existing: Option<KBArticleRating> = db
            .query("SELECT * FROM kb_article_ratings WHERE article_id = $article AND user_id = $user LIMIT 1")
            .bind(("article", &article_thing))
            .bind(("user", user_id))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        if existing.is_some() {
            return Err("You have already rated this article".to_string());
        }

        let rating = KBArticleRating {
            id: None,
            article_id: article_thing.clone(),
            user_id: user_id.to_string(),
            is_helpful,
            feedback,
            created_at: Utc::now(),
        };

        let created: Vec<KBArticleRating> = db
            .create("kb_article_ratings")
            .content(&rating)
            .await
            .map_err(|e| e.to_string())?;

        // Update article counts
        let field = if is_helpful { "helpful_count" } else { "not_helpful_count" };
        let _: Option<KBArticle> = db
            .query(&format!("UPDATE kb_articles SET {} += 1 WHERE id = $id", field))
            .bind(("id", &article_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        created.into_iter().next()
            .ok_or_else(|| "Failed to create rating".to_string())
    }

    // ========================================================================
    // CATEGORY OPERATIONS
    // ========================================================================

    /// Create a category
    pub async fn create_category(
        db: Arc<Surreal<Db>>,
        request: CreateCategoryRequest,
    ) -> Result<KBCategory, String> {
        let now = Utc::now();
        let slug = Self::generate_slug(&request.name);

        let parent_thing = request.parent_id.as_ref()
            .map(|id| Thing::from(("kb_categories", id.as_str())));

        let category = KBCategory {
            id: None,
            name: request.name,
            slug,
            description: request.description,
            parent_id: parent_thing,
            icon: request.icon,
            display_order: request.display_order.unwrap_or(0),
            is_active: true,
            article_count: 0,
            tenant_id: None,
            created_at: now,
            updated_at: now,
        };

        let created: Vec<KBCategory> = db
            .create("kb_categories")
            .content(&category)
            .await
            .map_err(|e| e.to_string())?;

        created.into_iter().next()
            .ok_or_else(|| "Failed to create category".to_string())
    }

    /// Get category by ID
    pub async fn get_category(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<Option<KBCategory>, String> {
        let category: Option<KBCategory> = db
            .select(("kb_categories", id))
            .await
            .map_err(|e| e.to_string())?;
        Ok(category)
    }

    /// List all categories
    pub async fn list_categories(
        db: Arc<Surreal<Db>>,
        active_only: Option<bool>,
    ) -> Result<Vec<KBCategory>, String> {
        let query = if active_only.unwrap_or(true) {
            "SELECT * FROM kb_categories WHERE is_active = true ORDER BY display_order ASC"
        } else {
            "SELECT * FROM kb_categories ORDER BY display_order ASC"
        };

        let categories: Vec<KBCategory> = db
            .query(query)
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(categories)
    }

    /// Update a category
    pub async fn update_category(
        db: Arc<Surreal<Db>>,
        id: &str,
        request: UpdateCategoryRequest,
    ) -> Result<KBCategory, String> {
        let existing = Self::get_category(db.clone(), id).await?
            .ok_or_else(|| "Category not found".to_string())?;

        let now = Utc::now();

        let updated: Option<KBCategory> = db
            .query(r#"
                UPDATE kb_categories SET
                    name = $name,
                    description = $description,
                    parent_id = $parent_id,
                    icon = $icon,
                    display_order = $display_order,
                    is_active = $is_active,
                    updated_at = $updated_at
                WHERE id = $id
                RETURN AFTER
            "#)
            .bind(("id", Thing::from(("kb_categories", id))))
            .bind(("name", request.name.unwrap_or(existing.name)))
            .bind(("description", request.description.or(existing.description)))
            .bind(("parent_id", request.parent_id.map(|p| Thing::from(("kb_categories", p.as_str()))).or(existing.parent_id)))
            .bind(("icon", request.icon.or(existing.icon)))
            .bind(("display_order", request.display_order.unwrap_or(existing.display_order)))
            .bind(("is_active", request.is_active.unwrap_or(existing.is_active)))
            .bind(("updated_at", now))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        updated.ok_or_else(|| "Failed to update category".to_string())
    }

    /// Delete a category
    pub async fn delete_category(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<(), String> {
        // Check if category has articles
        let cat_thing = Thing::from(("kb_categories", id));
        let count_result: Vec<JsonValue> = db
            .query("SELECT count() FROM kb_articles WHERE category_id = $cat GROUP ALL")
            .bind(("cat", &cat_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let count = count_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        if count > 0 {
            return Err(format!("Cannot delete category with {} articles", count));
        }

        let _: Option<KBCategory> = db
            .delete(("kb_categories", id))
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /// Get KB statistics
    pub async fn get_statistics(
        db: Arc<Surreal<Db>>,
    ) -> Result<KBStatistics, String> {
        // Total articles
        let total_result: Vec<JsonValue> = db
            .query("SELECT count() FROM kb_articles GROUP ALL")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let total_articles = total_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        // Published articles
        let published_result: Vec<JsonValue> = db
            .query("SELECT count() FROM kb_articles WHERE status = 'PUBLISHED' GROUP ALL")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let published_articles = published_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        // Draft articles
        let draft_result: Vec<JsonValue> = db
            .query("SELECT count() FROM kb_articles WHERE status = 'DRAFT' GROUP ALL")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let draft_articles = draft_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        // Total categories
        let cat_result: Vec<JsonValue> = db
            .query("SELECT count() FROM kb_categories WHERE is_active = true GROUP ALL")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let total_categories = cat_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        // Total views
        let views_result: Vec<JsonValue> = db
            .query("SELECT math::sum(view_count) as total_views FROM kb_articles GROUP ALL")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let total_views = views_result
            .first()
            .and_then(|v| v.get("total_views"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        Ok(KBStatistics {
            total_articles,
            published_articles,
            draft_articles,
            total_categories,
            total_views,
            by_category: vec![], // TODO: implement
        })
    }
}
