// Archer ITSM - KB Suggestion Service
// Provides intelligent article suggestions based on ticket context

use crate::models::knowledge::*;
use std::collections::HashMap;
use std::sync::Arc;
use surrealdb::engine::local::Db;
use surrealdb::sql::Thing;
use surrealdb::Surreal;
use chrono::Utc;

pub struct KBSuggestionService;

impl KBSuggestionService {
    /// Suggest KB articles based on ticket title and description
    /// Uses keyword-based text similarity for MVP (semantic search in AI module)
    pub async fn suggest_articles(
        db: Arc<Surreal<Db>>,
        request: KBSuggestionRequest,
    ) -> Result<Vec<ArticleSuggestion>, String> {
        let limit = request.limit.unwrap_or(5).min(10);

        // Extract keywords from title and description
        let mut keywords = Vec::new();
        if let Some(ref title) = request.title {
            keywords.extend(Self::extract_keywords(title));
        }
        if let Some(ref description) = request.description {
            keywords.extend(Self::extract_keywords(description));
        }

        if keywords.is_empty() {
            return Ok(vec![]);
        }

        // Build search query for published articles only
        let mut conditions = vec!["status = 'PUBLISHED'".to_string()];
        
        // Add category filter if provided
        if let Some(ref category) = request.category {
            conditions.push(format!("category_id.id = '{}'", category));
        }

        // Build keyword search conditions (title OR content contains keywords)
        let keyword_conditions: Vec<String> = keywords
            .iter()
            .map(|kw| format!("(title CONTAINS '{}' OR content CONTAINS '{}')", kw, kw))
            .collect();
        
        if !keyword_conditions.is_empty() {
            conditions.push(format!("({})", keyword_conditions.join(" OR ")));
        }

        let where_clause = conditions.join(" AND ");

        // Query articles
        let query = format!(
            "SELECT * FROM kb_articles WHERE {} ORDER BY view_count DESC, resolution_count DESC LIMIT {}",
            where_clause, limit * 2 // Fetch more to rank and filter
        );

        let articles: Vec<KBArticle> = db
            .query(&query)
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        // Calculate relevance scores and convert to suggestions
        let mut suggestions: Vec<ArticleSuggestion> = articles
            .into_iter()
            .filter_map(|article| {
                let relevance = Self::calculate_relevance(&article, &keywords, request.title.as_deref(), request.description.as_deref());
                
                if relevance < 0.1 {
                    return None; // Filter out very low relevance
                }

                let excerpt = Self::generate_excerpt(&article.content, &keywords, 200);
                
                Some(ArticleSuggestion {
                    article_id: article.id.as_ref()?.id.to_string(),
                    title: article.title.clone(),
                    summary: article.summary.clone(),
                    excerpt,
                    relevance_score: relevance,
                    resolution_count: article.resolution_count,
                    helpful_count: article.helpful_count,
                    view_count: article.view_count,
                    category: article.category_id.as_ref().map(|c| c.id.to_string()),
                })
            })
            .collect();

        // Sort by relevance score descending
        suggestions.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        suggestions.truncate(limit as usize);

        Ok(suggestions)
    }

    /// Get KB articles that resolved similar tickets
    pub async fn get_articles_for_ticket(
        db: Arc<Surreal<Db>>,
        ticket_id: &str,
    ) -> Result<Vec<ArticleSuggestion>, String> {
        let ticket_thing = Thing::from(("ticket", ticket_id));

        // Get articles linked to this ticket
        let query = r#"
            SELECT article_id, link_type, was_helpful 
            FROM ticket_kb_links 
            WHERE ticket_id = $ticket 
            ORDER BY created_at DESC
        "#;

        let links: Vec<TicketKBLink> = db
            .query(query)
            .bind(("ticket", &ticket_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let mut suggestions = Vec::new();

        for link in links {
            let article_id_str = link.article_id.id.to_string();
            
            // Fetch the full article
            let article: Option<KBArticle> = db
                .select(link.article_id.clone())
                .await
                .map_err(|e| e.to_string())?;

            if let Some(article) = article {
                let excerpt = Self::generate_excerpt(&article.content, &[], 200);
                
                suggestions.push(ArticleSuggestion {
                    article_id: article_id_str,
                    title: article.title.clone(),
                    summary: article.summary.clone(),
                    excerpt,
                    relevance_score: if link.was_helpful == Some(true) { 1.0 } else { 0.5 },
                    resolution_count: article.resolution_count,
                    helpful_count: article.helpful_count,
                    view_count: article.view_count,
                    category: article.category_id.as_ref().map(|c| c.id.to_string()),
                });
            }
        }

        Ok(suggestions)
    }

    /// Get top articles used for ticket resolutions
    pub async fn get_top_resolution_articles(
        db: Arc<Surreal<Db>>,
        limit: u32,
    ) -> Result<Vec<ArticleSuggestion>, String> {
        let limit = limit.min(20);

        let query = format!(
            "SELECT * FROM kb_articles WHERE status = 'PUBLISHED' AND resolution_count > 0 ORDER BY resolution_count DESC, helpfulness_score DESC LIMIT {}",
            limit
        );

        let articles: Vec<KBArticle> = db
            .query(&query)
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let suggestions: Vec<ArticleSuggestion> = articles
            .into_iter()
            .filter_map(|article| {
                let excerpt = Self::generate_excerpt(&article.content, &[], 200);
                
                Some(ArticleSuggestion {
                    article_id: article.id.as_ref()?.id.to_string(),
                    title: article.title.clone(),
                    summary: article.summary.clone(),
                    excerpt,
                    relevance_score: article.helpfulness_score,
                    resolution_count: article.resolution_count,
                    helpful_count: article.helpful_count,
                    view_count: article.view_count,
                    category: article.category_id.as_ref().map(|c| c.id.to_string()),
                })
            })
            .collect();

        Ok(suggestions)
    }

    /// Link an article to a ticket resolution
    pub async fn link_article_to_ticket(
        db: Arc<Surreal<Db>>,
        ticket_id: &str,
        article_id: &str,
        link_type: KBLinkType,
        was_helpful: Option<bool>,
        user_id: &str,
    ) -> Result<TicketKBLink, String> {
        let ticket_thing = Thing::from(("ticket", ticket_id));
        let article_thing = Thing::from(("kb_articles", article_id));

        let link = TicketKBLink {
            id: None,
            ticket_id: ticket_thing,
            article_id: article_thing.clone(),
            link_type: link_type.clone(),
            was_helpful,
            created_by: user_id.to_string(),
            created_at: Utc::now(),
        };

        let created: Vec<TicketKBLink> = db
            .create("ticket_kb_links")
            .content(&link)
            .await
            .map_err(|e| e.to_string())?;

        // Update article resolution count if this is a resolution link
        if link_type == KBLinkType::UsedForResolution {
            let _: Option<KBArticle> = db
                .query("UPDATE kb_articles SET resolution_count += 1 WHERE id = $id")
                .bind(("id", &article_thing))
                .await
                .map_err(|e| e.to_string())?
                .take(0)
                .map_err(|e| e.to_string())?;

            // Update helpfulness score if feedback provided
            if let Some(helpful) = was_helpful {
                Self::update_helpfulness_score(db.clone(), article_id, helpful).await?;
            }
        }

        created
            .into_iter()
            .next()
            .ok_or_else(|| "Failed to create ticket-KB link".to_string())
    }

    /// Update article helpfulness score based on new feedback
    async fn update_helpfulness_score(
        db: Arc<Surreal<Db>>,
        article_id: &str,
        was_helpful: bool,
    ) -> Result<(), String> {
        // Get current article stats
        let article: Option<KBArticle> = db
            .select(("kb_articles", article_id))
            .await
            .map_err(|e| e.to_string())?;

        if let Some(article) = article {
            let total_ratings = article.helpful_count + article.not_helpful_count;
            let new_total = total_ratings + 1;
            
            // Calculate new helpfulness score (percentage helpful)
            let new_helpful_count = if was_helpful {
                article.helpful_count + 1
            } else {
                article.helpful_count
            };
            
            let new_score = (new_helpful_count as f32 / new_total as f32) * 100.0;

            let _: Option<KBArticle> = db
                .query("UPDATE kb_articles SET helpfulness_score = $score WHERE id = $id")
                .bind(("id", Thing::from(("kb_articles", article_id))))
                .bind(("score", new_score))
                .await
                .map_err(|e| e.to_string())?
                .take(0)
                .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    /// Extract keywords from text (simple tokenization)
    fn extract_keywords(text: &str) -> Vec<String> {
        text.to_lowercase()
            .split_whitespace()
            .filter(|word| word.len() > 3) // Ignore short words
            .filter(|word| !Self::is_stop_word(word))
            .map(|word| {
                // Remove punctuation
                word.chars()
                    .filter(|c| c.is_alphanumeric())
                    .collect::<String>()
            })
            .filter(|word| !word.is_empty())
            .take(10) // Limit to top 10 keywords per field
            .collect()
    }

    /// Check if word is a common stop word
    fn is_stop_word(word: &str) -> bool {
        const STOP_WORDS: &[&str] = &[
            "the", "and", "for", "with", "from", "this", "that", "have", "been",
            "not", "are", "was", "but", "can", "will", "has", "had", "more",
        ];
        STOP_WORDS.contains(&word)
    }

    /// Calculate relevance score for an article
    fn calculate_relevance(
        article: &KBArticle,
        keywords: &[String],
        title: Option<&str>,
        description: Option<&str>,
    ) -> f32 {
        let mut score = 0.0;

        let article_text = format!("{} {}", article.title.to_lowercase(), article.content.to_lowercase());
        let query_text = format!(
            "{} {}",
            title.unwrap_or("").to_lowercase(),
            description.unwrap_or("").to_lowercase()
        );

        // Keyword match score (0-50 points)
        let matched_keywords: usize = keywords
            .iter()
            .filter(|kw| article_text.contains(kw.as_str()))
            .count();
        score += (matched_keywords as f32 / keywords.len().max(1) as f32) * 50.0;

        // Title match bonus (0-20 points)
        if let Some(title) = title {
            let title_lower = title.to_lowercase();
            if article.title.to_lowercase().contains(&title_lower) {
                score += 20.0;
            }
        }

        // Resolution count bonus (0-15 points)
        score += (article.resolution_count.min(10) as f32 / 10.0) * 15.0;

        // Helpfulness score bonus (0-15 points)
        score += (article.helpfulness_score / 100.0) * 15.0;

        // Normalize to 0-1 range
        score / 100.0
    }

    /// Generate excerpt from content highlighting keywords
    fn generate_excerpt(content: &str, keywords: &[String], max_length: usize) -> String {
        if content.len() <= max_length {
            return content.to_string();
        }

        // Try to find a sentence containing keywords
        let sentences: Vec<&str> = content.split('.').collect();
        
        for sentence in &sentences {
            let sentence_lower = sentence.to_lowercase();
            if keywords.iter().any(|kw| sentence_lower.contains(kw)) {
                let excerpt = sentence.trim();
                if excerpt.len() <= max_length {
                    return format!("{}...", excerpt);
                } else {
                    return format!("{}...", &excerpt[..max_length]);
                }
            }
        }

        // Fallback: just take first max_length characters
        format!("{}...", &content[..max_length.min(content.len())])
    }
}
