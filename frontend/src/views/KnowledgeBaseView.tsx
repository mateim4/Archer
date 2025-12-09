/**
 * Knowledge Base View
 * Main view for browsing and searching knowledge articles
 */

import React, { useState, useEffect } from 'react';
import {
  PurpleGlassCard,
  PurpleGlassInput,
  PurpleGlassButton,
  PurpleGlassDropdown,
  PurpleGlassSpinner,
  PurpleGlassEmptyState,
} from '../components/ui';
import { knowledgeBaseApi } from '../api/knowledgeBaseApi';
import type {
  KnowledgeArticle,
  KnowledgeCategory,
  ArticleStatus,
} from '../types/knowledgeBaseTypes';
import './KnowledgeBaseView.css';

// Status badge colors
const STATUS_COLORS: Record<ArticleStatus, string> = {
  DRAFT: '#6B7280',
  REVIEW: '#F59E0B',
  PUBLISHED: '#10B981',
  ARCHIVED: '#9CA3AF',
};

const KnowledgeBaseView: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load categories and articles
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [categoriesData, articlesData] = await Promise.all([
        knowledgeBaseApi.categories.list(),
        knowledgeBaseApi.articles.list({ status: 'PUBLISHED', limit: 50 }),
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
      console.error('Error loading KB data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter articles by category
  const handleCategoryChange = async (categoryId: string) => {
    if (categoryId === 'all') {
      setSelectedCategory(undefined);
      loadData();
      return;
    }

    setSelectedCategory(categoryId);
    setIsLoading(true);
    try {
      const filteredArticles = await knowledgeBaseApi.articles.list({
        category_id: categoryId,
        status: 'PUBLISHED',
        limit: 50,
      });
      setArticles(filteredArticles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter articles');
    } finally {
      setIsLoading(false);
    }
  };

  // Search articles
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadData();
      return;
    }

    setIsLoading(true);
    try {
      const results = await knowledgeBaseApi.search.search({
        q: query,
        category_id: selectedCategory,
        limit: 50,
      });
      setArticles(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle article click
  const handleArticleClick = (articleId: string) => {
    // Track view
    knowledgeBaseApi.articles.incrementViewCount(articleId).catch(console.error);
    // Navigate to article detail (would use React Router in production)
    window.location.hash = `#/knowledge/articles/${articleId}`;
  };

  // Render category sidebar
  const renderCategorySidebar = () => (
    <div className="kb-sidebar">
      <PurpleGlassCard className="kb-categories-card">
        <h3 className="kb-sidebar-title">Categories</h3>
        <div className="kb-category-list">
          <button
            className={`kb-category-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            <span className="kb-category-icon">📚</span>
            <span className="kb-category-name">All Articles</span>
            <span className="kb-category-count">{articles.length}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`kb-category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id!)}
            >
              <span className="kb-category-icon">{category.icon || '📁'}</span>
              <span className="kb-category-name">{category.name}</span>
              <span className="kb-category-count">{category.article_count}</span>
            </button>
          ))}
        </div>
      </PurpleGlassCard>
    </div>
  );

  // Render article card
  const renderArticleCard = (article: KnowledgeArticle) => (
    <PurpleGlassCard
      key={article.id}
      className="kb-article-card"
      onClick={() => handleArticleClick(article.id!)}
      style={{ cursor: 'pointer' }}
    >
      <div className="kb-article-header">
        <h3 className="kb-article-title">{article.title}</h3>
        <span
          className="kb-article-status"
          style={{ backgroundColor: STATUS_COLORS[article.status] }}
        >
          {article.status}
        </span>
      </div>
      
      {article.summary && (
        <p className="kb-article-summary">{article.summary}</p>
      )}

      <div className="kb-article-meta">
        <div className="kb-article-stats">
          <span className="kb-article-stat">
            👁️ {article.view_count} views
          </span>
          <span className="kb-article-stat">
            👍 {article.helpful_count} helpful
          </span>
        </div>
        {article.tags.length > 0 && (
          <div className="kb-article-tags">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="kb-article-tag">
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="kb-article-tag-more">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="kb-article-footer">
        <span className="kb-article-date">
          Updated {new Date(article.updated_at).toLocaleDateString()}
        </span>
        {article.is_featured && (
          <span className="kb-article-featured">⭐ Featured</span>
        )}
      </div>
    </PurpleGlassCard>
  );

  // Render article list
  const renderArticleList = () => (
    <div className={`kb-article-grid ${viewMode}`}>
      {articles.map((article) => renderArticleCard(article))}
    </div>
  );

  return (
    <div className="knowledge-base-view">
      <div className="kb-header">
        <div className="kb-header-content">
          <h1 className="kb-title">Knowledge Base</h1>
          <p className="kb-subtitle">
            Browse articles, guides, and documentation
          </p>
        </div>
        
        <div className="kb-header-actions">
          <PurpleGlassButton
            appearance="secondary"
            onClick={() => window.location.hash = '#/knowledge/new'}
          >
            ➕ New Article
          </PurpleGlassButton>
        </div>
      </div>

      <div className="kb-search-bar">
        <PurpleGlassInput
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '600px' }}
        />
        
        <div className="kb-view-toggle">
          <button
            className={`kb-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            ▦
          </button>
          <button
            className={`kb-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>

      <div className="kb-content">
        {renderCategorySidebar()}
        
        <div className="kb-main">
          {isLoading ? (
            <div className="kb-loading">
              <PurpleGlassSpinner size="large" />
              <p>Loading articles...</p>
            </div>
          ) : error ? (
            <PurpleGlassCard className="kb-error">
              <p className="kb-error-message">❌ {error}</p>
              <PurpleGlassButton onClick={loadData}>
                Try Again
              </PurpleGlassButton>
            </PurpleGlassCard>
          ) : articles.length === 0 ? (
            <PurpleGlassEmptyState
              title="No articles found"
              description={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'No articles in this category yet'
              }
              actionLabel="Create First Article"
              onAction={() => window.location.hash = '#/knowledge/new'}
            />
          ) : (
            renderArticleList()
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseView;
