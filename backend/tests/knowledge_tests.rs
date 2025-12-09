// Archer ITSM - Knowledge Base Module Tests
// Tests for articles, categories, versioning, and ratings

#[cfg(test)]
mod knowledge_tests {
    use backend::database::{self, Database};
    use backend::models::knowledge::{
        ArticleStatus, ArticleVisibility, CreateArticleRequest, CreateCategoryRequest,
        KBArticle, KBCategory, RateArticleRequest, UpdateArticleRequest,
    };
    use backend::services::knowledge_service::KnowledgeService;
    use chrono::Utc;
    use std::sync::Arc;

    // ========================================================================
    // TEST SETUP HELPERS
    // ========================================================================

    async fn setup_test_db() -> Arc<Database> {
        let db = database::new_test()
            .await
            .expect("Failed to create test database");
        Arc::new(db)
    }

    async fn cleanup_kb(db: &Database) {
        let _: Result<Vec<KBArticle>, _> = db.query("DELETE kb_articles").await;
        let _: Result<Vec<KBCategory>, _> = db.query("DELETE kb_categories").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE kb_article_versions").await;
        let _: Result<Vec<serde_json::Value>, _> = db.query("DELETE kb_ratings").await;
    }

    fn create_test_article_request() -> CreateArticleRequest {
        CreateArticleRequest {
            title: format!("Test Article {}", Utc::now().timestamp()),
            summary: Some("This is a test article summary".to_string()),
            content: "# Test Article\n\nThis is the content of the test article.".to_string(),
            category_id: None,
            tags: vec!["test".to_string(), "example".to_string()],
            visibility: ArticleVisibility::Internal,
            seo_title: None,
            seo_description: None,
            expires_at: None,
        }
    }

    fn create_test_category_request() -> CreateCategoryRequest {
        CreateCategoryRequest {
            name: format!("Test Category {}", Utc::now().timestamp()),
            description: Some("Test category description".to_string()),
            parent_id: None,
            icon: Some("folder".to_string()),
        }
    }

    // ========================================================================
    // ARTICLE CRUD TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_article_success() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        let result = KnowledgeService::create_article(
            db.clone(),
            request.clone(),
            "user-1",
            "Test User",
            None,
        )
        .await;

        assert!(result.is_ok());
        let article = result.unwrap();
        assert_eq!(article.title, request.title);
        assert_eq!(article.content, request.content);
        assert_eq!(article.status, ArticleStatus::Draft);
        assert_eq!(article.version, 1);
        assert_eq!(article.view_count, 0);
        assert!(!article.slug.is_empty());

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_create_article_generates_slug() {
        let db = setup_test_db().await;
        let mut request = create_test_article_request();
        request.title = "Hello World: A Test Article!".to_string();

        let result =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await;

        assert!(result.is_ok());
        let article = result.unwrap();
        assert_eq!(article.slug, "hello-world-a-test-article");

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_create_article_duplicate_slug() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create first article
        let result1 =
            KnowledgeService::create_article(db.clone(), request.clone(), "user-1", "Test User", None)
                .await;
        assert!(result1.is_ok());

        // Try to create article with same title (same slug)
        let result2 =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await;

        assert!(result2.is_err());
        let error = result2.unwrap_err();
        assert!(error.contains("already exists"));

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_get_article_by_id() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let created =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = created.id.as_ref().unwrap().id.to_string();

        // Get article by ID
        let result = KnowledgeService::get_article(db.clone(), &article_id).await;

        assert!(result.is_ok());
        let article = result.unwrap();
        assert!(article.is_some());
        let article = article.unwrap();
        assert_eq!(article.title, created.title);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_get_article_by_slug() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let created =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        // Get article by slug
        let result = KnowledgeService::get_article_by_slug(db.clone(), &created.slug).await;

        assert!(result.is_ok());
        let article = result.unwrap();
        assert!(article.is_some());
        let article = article.unwrap();
        assert_eq!(article.title, created.title);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_update_article() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let created =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = created.id.as_ref().unwrap().id.to_string();

        // Update article
        let update_request = UpdateArticleRequest {
            title: Some("Updated Title".to_string()),
            summary: Some("Updated summary".to_string()),
            content: Some("Updated content".to_string()),
            category_id: None,
            tags: None,
            status: None,
            visibility: None,
            seo_title: None,
            seo_description: None,
            expires_at: None,
        };

        let result = KnowledgeService::update_article(
            db.clone(),
            &article_id,
            update_request,
            "user-1",
            "Test User",
        )
        .await;

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.title, "Updated Title");
        assert_eq!(updated.content, "Updated content");
        assert_eq!(updated.version, 2); // Version should increment

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_soft_delete_article() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let created =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = created.id.as_ref().unwrap().id.to_string();

        // Soft delete (archive) article
        let delete_result = KnowledgeService::delete_article(db.clone(), &article_id).await;
        assert!(delete_result.is_ok());

        // Article should still exist but be archived
        let article = KnowledgeService::get_article(db.clone(), &article_id)
            .await
            .unwrap();
        assert!(article.is_some());
        let article = article.unwrap();
        assert_eq!(article.status, ArticleStatus::Archived);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_list_articles_with_pagination() {
        let db = setup_test_db().await;

        // Create multiple articles
        for i in 0..5 {
            let mut request = create_test_article_request();
            request.title = format!("Test Article {}", i);
            let _ = KnowledgeService::create_article(
                db.clone(),
                request,
                "user-1",
                "Test User",
                None,
            )
            .await;
        }

        // List articles with pagination
        let result = KnowledgeService::list_articles(
            db.clone(),
            None,    // category_id
            None,    // status
            None,    // visibility
            None,    // search
            Some(1), // page
            Some(3), // per_page
        )
        .await;

        assert!(result.is_ok());
        let articles = result.unwrap();
        assert_eq!(articles.len(), 3); // Should return only 3 per page

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_search_articles() {
        let db = setup_test_db().await;

        // Create articles with specific content
        let mut request1 = create_test_article_request();
        request1.title = "Article about Kubernetes".to_string();
        request1.content = "This article discusses Kubernetes deployments".to_string();
        let _ = KnowledgeService::create_article(
            db.clone(),
            request1,
            "user-1",
            "Test User",
            None,
        )
        .await;

        let mut request2 = create_test_article_request();
        request2.title = "Article about Docker".to_string();
        request2.content = "This article discusses Docker containers".to_string();
        let _ = KnowledgeService::create_article(
            db.clone(),
            request2,
            "user-1",
            "Test User",
            None,
        )
        .await;

        // Search for "Kubernetes"
        let result = KnowledgeService::list_articles(
            db.clone(),
            None,
            None,
            None,
            Some("Kubernetes"), // search term
            None,
            None,
        )
        .await;

        assert!(result.is_ok());
        let articles = result.unwrap();
        assert!(articles.len() >= 1);
        assert!(articles.iter().any(|a| a.title.contains("Kubernetes")));

        cleanup_kb(&db).await;
    }

    // ========================================================================
    // CATEGORY TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_create_category() {
        let db = setup_test_db().await;
        let request = create_test_category_request();

        let result =
            KnowledgeService::create_category(db.clone(), request.clone(), None).await;

        assert!(result.is_ok());
        let category = result.unwrap();
        assert_eq!(category.name, request.name);
        assert!(category.slug.len() > 0);
        assert_eq!(category.is_active, true);
        assert_eq!(category.article_count, 0);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_create_nested_category() {
        let db = setup_test_db().await;

        // Create parent category
        let parent_request = create_test_category_request();
        let parent = KnowledgeService::create_category(db.clone(), parent_request, None)
            .await
            .unwrap();

        let parent_id = parent.id.as_ref().unwrap().id.to_string();

        // Create child category
        let mut child_request = create_test_category_request();
        child_request.name = "Child Category".to_string();
        child_request.parent_id = Some(parent_id.clone());

        let result = KnowledgeService::create_category(db.clone(), child_request, None).await;

        assert!(result.is_ok());
        let child = result.unwrap();
        assert!(child.parent_id.is_some());

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_list_categories() {
        let db = setup_test_db().await;

        // Create multiple categories
        for i in 0..3 {
            let mut request = create_test_category_request();
            request.name = format!("Category {}", i);
            let _ = KnowledgeService::create_category(db.clone(), request, None).await;
        }

        // List categories
        let result = KnowledgeService::list_categories(db.clone(), None).await;

        assert!(result.is_ok());
        let categories = result.unwrap();
        assert!(categories.len() >= 3);

        cleanup_kb(&db).await;
    }

    // ========================================================================
    // VERSIONING TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_article_creates_initial_version() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        assert_eq!(article.version, 1);

        // Check version history
        let article_id = article.id.as_ref().unwrap().id.to_string();
        let versions =
            KnowledgeService::get_article_versions(db.clone(), &article_id).await;

        assert!(versions.is_ok());
        let versions = versions.unwrap();
        assert_eq!(versions.len(), 1);
        assert_eq!(versions[0].version, 1);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_update_creates_new_version() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();

        // Update article
        let update_request = UpdateArticleRequest {
            content: Some("Updated content for version 2".to_string()),
            ..Default::default()
        };

        let updated = KnowledgeService::update_article(
            db.clone(),
            &article_id,
            update_request,
            "user-1",
            "Test User",
        )
        .await
        .unwrap();

        assert_eq!(updated.version, 2);

        // Check version history
        let versions =
            KnowledgeService::get_article_versions(db.clone(), &article_id)
                .await
                .unwrap();

        assert_eq!(versions.len(), 2);
        assert_eq!(versions[1].version, 2);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_get_version_history() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();

        // Make multiple updates
        for i in 2..=5 {
            let update_request = UpdateArticleRequest {
                content: Some(format!("Content version {}", i)),
                ..Default::default()
            };

            let _ = KnowledgeService::update_article(
                db.clone(),
                &article_id,
                update_request,
                "user-1",
                "Test User",
            )
            .await;
        }

        // Get version history
        let versions =
            KnowledgeService::get_article_versions(db.clone(), &article_id)
                .await
                .unwrap();

        assert_eq!(versions.len(), 5);
        // Versions should be in order
        for (idx, version) in versions.iter().enumerate() {
            assert_eq!(version.version, (idx + 1) as u32);
        }

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_revert_to_previous_version() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();
        let original_content = article.content.clone();

        // Update article
        let update_request = UpdateArticleRequest {
            content: Some("Modified content".to_string()),
            ..Default::default()
        };

        let _ = KnowledgeService::update_article(
            db.clone(),
            &article_id,
            update_request,
            "user-1",
            "Test User",
        )
        .await;

        // Revert to version 1
        let revert_result = KnowledgeService::revert_article(
            db.clone(),
            &article_id,
            1,
            "user-1",
            "Test User",
        )
        .await;

        assert!(revert_result.is_ok());
        let reverted = revert_result.unwrap();
        assert_eq!(reverted.content, original_content);
        assert_eq!(reverted.version, 3); // New version after revert

        cleanup_kb(&db).await;
    }

    // ========================================================================
    // RATING TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_add_article_rating() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();

        // Rate article
        let rating_request = RateArticleRequest {
            is_helpful: true,
            feedback: Some("Very helpful article!".to_string()),
        };

        let result = KnowledgeService::rate_article(
            db.clone(),
            &article_id,
            rating_request,
            "user-2",
            "Another User",
        )
        .await;

        assert!(result.is_ok());

        // Check article helpful count increased
        let updated_article = KnowledgeService::get_article(db.clone(), &article_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(updated_article.helpful_count, 1);
        assert_eq!(updated_article.not_helpful_count, 0);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_update_existing_rating() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();

        // First rating (helpful)
        let rating1 = RateArticleRequest {
            is_helpful: true,
            feedback: None,
        };
        let _ = KnowledgeService::rate_article(
            db.clone(),
            &article_id,
            rating1,
            "user-2",
            "Another User",
        )
        .await;

        // Change rating (not helpful)
        let rating2 = RateArticleRequest {
            is_helpful: false,
            feedback: Some("Not what I was looking for".to_string()),
        };
        let _ = KnowledgeService::rate_article(
            db.clone(),
            &article_id,
            rating2,
            "user-2",
            "Another User",
        )
        .await;

        // Check counts updated correctly
        let updated_article = KnowledgeService::get_article(db.clone(), &article_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(updated_article.helpful_count, 0);
        assert_eq!(updated_article.not_helpful_count, 1);

        cleanup_kb(&db).await;
    }

    #[tokio::test]
    async fn test_calculate_average_rating() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();

        // Add multiple ratings
        for i in 0..3 {
            let rating = RateArticleRequest {
                is_helpful: true,
                feedback: None,
            };
            let _ = KnowledgeService::rate_article(
                db.clone(),
                &article_id,
                rating,
                &format!("user-{}", i),
                &format!("User {}", i),
            )
            .await;
        }

        for i in 3..4 {
            let rating = RateArticleRequest {
                is_helpful: false,
                feedback: None,
            };
            let _ = KnowledgeService::rate_article(
                db.clone(),
                &article_id,
                rating,
                &format!("user-{}", i),
                &format!("User {}", i),
            )
            .await;
        }

        // Check average (3 helpful, 1 not helpful = 75%)
        let updated_article = KnowledgeService::get_article(db.clone(), &article_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(updated_article.helpful_count, 3);
        assert_eq!(updated_article.not_helpful_count, 1);

        cleanup_kb(&db).await;
    }

    // ========================================================================
    // VIEW COUNT TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_increment_view_count() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();
        assert_eq!(article.view_count, 0);

        // Increment view count multiple times
        for _ in 0..5 {
            let _ = KnowledgeService::increment_view_count(db.clone(), &article_id).await;
        }

        // Check view count
        let updated_article = KnowledgeService::get_article(db.clone(), &article_id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(updated_article.view_count, 5);

        cleanup_kb(&db).await;
    }

    // ========================================================================
    // ARTICLE STATUS TESTS
    // ========================================================================

    #[tokio::test]
    async fn test_publish_article() {
        let db = setup_test_db().await;
        let request = create_test_article_request();

        // Create article (starts as Draft)
        let article =
            KnowledgeService::create_article(db.clone(), request, "user-1", "Test User", None)
                .await
                .unwrap();

        let article_id = article.id.as_ref().unwrap().id.to_string();
        assert_eq!(article.status, ArticleStatus::Draft);

        // Publish article
        let publish_result = KnowledgeService::publish_article(
            db.clone(),
            &article_id,
            "admin-1",
            "Admin User",
        )
        .await;

        assert!(publish_result.is_ok());
        let published = publish_result.unwrap();
        assert_eq!(published.status, ArticleStatus::Published);
        assert!(published.published_at.is_some());
        assert!(published.approved_by.is_some());

        cleanup_kb(&db).await;
    }
}
