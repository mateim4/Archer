/**
 * Article Detail View
 * Displays a single knowledge base article with full content, version history, and feedback
 */

import React, { useState, useEffect } from 'react';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassSpinner,
} from '../components/ui';
import { knowledgeBaseApi } from '../api/knowledgeBaseApi';
import type {
  KnowledgeArticle,
  ArticleVersion,
  KnowledgeCategory,
} from '../types/knowledgeBaseTypes';
import './ArticleDetailView.css';

interface ArticleDetailViewProps {
  articleId: string;
}

const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ articleId }) => {
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [category, setCategory] = useState<KnowledgeCategory | null>(null);
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const articleData = await knowledgeBaseApi.articles.get(articleId);
      setArticle(articleData);

      // Track view
      await knowledgeBaseApi.articles.incrementViewCount(articleId);

      // Load category if exists
      if (articleData.category_id) {
        try {
          const categoryData = await knowledgeBaseApi.categories.get(articleData.category_id);
          setCategory(categoryData);
        } catch (err) {
          console.error('Failed to load category:', err);
        }
      }

      // Load version history
      try {
        const versionsData = await knowledgeBaseApi.articles.getVersions(articleId);
        setVersions(versionsData);
      } catch (err) {
        console.error('Failed to load versions:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
      console.error('Error loading article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (isHelpful: boolean) => {
    if (!article || feedbackSubmitted) return;

    try {
      await knowledgeBaseApi.articles.submitFeedback(
        articleId,
        'current-user', // In production, get from auth context
        isHelpful,
        undefined
      );
      
      setFeedbackSubmitted(true);
      
      // Update local state
      setArticle({
        ...article,
        helpful_count: isHelpful ? article.helpful_count + 1 : article.helpful_count,
        not_helpful_count: !isHelpful ? article.not_helpful_count + 1 : article.not_helpful_count,
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleBackToList = () => {
    window.location.hash = '#/knowledge';
  };

  const handleEdit = () => {
    window.location.hash = `#/knowledge/articles/${articleId}/edit`;
  };

  if (isLoading) {
    return (
      <div className="article-detail-view">
        <div className="article-loading">
          <PurpleGlassSpinner size="large" />
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-view">
        <PurpleGlassCard className="article-error">
          <p className="article-error-message">
            ❌ {error || 'Article not found'}
          </p>
          <PurpleGlassButton onClick={handleBackToList}>
            Back to Knowledge Base
          </PurpleGlassButton>
        </PurpleGlassCard>
      </div>
    );
  }

  return (
    <div className="article-detail-view">
      {/* Header Navigation */}
      <div className="article-nav">
        <PurpleGlassButton
          appearance="subtle"
          onClick={handleBackToList}
        >
          ← Back to Articles
        </PurpleGlassButton>
        
        <div className="article-nav-actions">
          <PurpleGlassButton
            appearance="secondary"
            onClick={handleEdit}
          >
            ✏️ Edit
          </PurpleGlassButton>
        </div>
      </div>

      {/* Article Content */}
      <PurpleGlassCard className="article-content-card">
        {/* Header */}
        <div className="article-header">
          <div className="article-metadata">
            {category && (
              <div className="article-category-badge">
                <span className="article-category-icon">{category.icon || '📁'}</span>
                <span className="article-category-name">{category.name}</span>
              </div>
            )}
            <span className="article-status-badge" data-status={article.status}>
              {article.status}
            </span>
          </div>
          
          <h1 className="article-title">{article.title}</h1>
          
          {article.summary && (
            <p className="article-summary">{article.summary}</p>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="article-tags-container">
              {article.tags.map((tag, index) => (
                <span key={index} className="article-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats Bar */}
          <div className="article-stats-bar">
            <div className="article-stats-left">
              <span className="article-stat">
                <span className="article-stat-icon">👁️</span>
                <span className="article-stat-value">{article.view_count}</span>
                <span className="article-stat-label">views</span>
              </span>
              <span className="article-stat">
                <span className="article-stat-icon">👍</span>
                <span className="article-stat-value">{article.helpful_count}</span>
                <span className="article-stat-label">helpful</span>
              </span>
              <span className="article-stat">
                <span className="article-stat-icon">📝</span>
                <span className="article-stat-value">v{article.version_number}</span>
                <span className="article-stat-label">version</span>
              </span>
            </div>
            
            <div className="article-stats-right">
              <span className="article-date">
                Updated {new Date(article.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Feedback Section */}
        <div className="article-feedback-section">
          <div className="article-feedback-prompt">
            <h3>Was this article helpful?</h3>
            {!feedbackSubmitted ? (
              <div className="article-feedback-buttons">
                <PurpleGlassButton
                  appearance="secondary"
                  onClick={() => handleFeedback(true)}
                >
                  👍 Yes
                </PurpleGlassButton>
                <PurpleGlassButton
                  appearance="secondary"
                  onClick={() => handleFeedback(false)}
                >
                  👎 No
                </PurpleGlassButton>
              </div>
            ) : (
              <p className="article-feedback-thanks">
                ✅ Thank you for your feedback!
              </p>
            )}
          </div>
        </div>
      </PurpleGlassCard>

      {/* Version History Sidebar */}
      {versions.length > 0 && (
        <div className="article-sidebar">
          <PurpleGlassCard className="article-versions-card">
            <div className="article-versions-header">
              <h3>Version History</h3>
              <button
                className="article-versions-toggle"
                onClick={() => setShowVersions(!showVersions)}
              >
                {showVersions ? '▼' : '▶'}
              </button>
            </div>
            
            {showVersions && (
              <div className="article-versions-list">
                {versions.map((version) => (
                  <div key={version.id} className="article-version-item">
                    <div className="article-version-header">
                      <span className="article-version-number">
                        v{version.version_number}
                      </span>
                      <span className="article-version-date">
                        {new Date(version.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {version.change_note && (
                      <p className="article-version-note">{version.change_note}</p>
                    )}
                    <p className="article-version-author">
                      By {version.changed_by}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PurpleGlassCard>
        </div>
      )}
    </div>
  );
};

export default ArticleDetailView;
