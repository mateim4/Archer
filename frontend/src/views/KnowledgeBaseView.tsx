import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassDropdown,
  PurpleGlassPagination,
  PurpleGlassEmptyState,
  PurpleGlassSkeleton
} from '../components/ui';
import { KBSearchBar } from '../components/kb/KBSearchBar';
import {
  AddRegular,
  BookRegular,
  GridRegular,
  ListRegular,
  FilterRegular,
  ArrowSortRegular,
  EyeRegular,
  PersonRegular,
  CalendarRegular,
  TagRegular
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { apiClient, KBArticle, KBCategory, KBArticleStatus } from '../utils/apiClient';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'popular' | 'title' | 'updated';

/**
 * KnowledgeBaseView - Main knowledge base article browser
 * 
 * Features:
 * - Grid/List view toggle
 * - Category filtering
 * - Search integration
 * - Sort options (recent, popular, title, updated)
 * - Pagination
 * - Article creation
 */
export const KnowledgeBaseView: React.FC = () => {
  const navigate = useNavigate();
  
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<KBArticleStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const pageSize = 12;

  // Load articles
  useEffect(() => {
    loadArticles();
  }, [selectedCategory, selectedStatus, sortBy, currentPage, searchQuery]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
        query: searchQuery || undefined,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined,
      };

      const fetchedArticles = await apiClient.getKBArticles(params);
      
      // Apply client-side sorting
      const sorted = sortArticles(fetchedArticles, sortBy);
      setArticles(sorted);
      
      // Calculate total pages (this should come from backend pagination)
      setTotalPages(Math.ceil(sorted.length / pageSize));
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const fetchedCategories = await apiClient.getKBCategories();
      setCategories(fetchedCategories.filter(c => c.is_active));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const sortArticles = (articles: KBArticle[], sortBy: SortOption): KBArticle[] => {
    const sorted = [...articles];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'popular':
        return sorted.sort((a, b) => b.view_count - a.view_count);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'updated':
        return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      default:
        return sorted;
    }
  };

  const handleCreateArticle = () => {
    navigate('/knowledge-base/new');
  };

  const handleArticleClick = (article: KBArticle) => {
    navigate(`/knowledge-base/${article.id}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getStatusBadgeColor = (status: KBArticleStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return tokens.colorPaletteGreenBackground3;
      case 'DRAFT':
        return tokens.colorPaletteYellowBackground3;
      case 'PENDING_REVIEW':
        return tokens.colorPaletteBlueBackground3;
      case 'ARCHIVED':
        return tokens.colorNeutralBackground4;
      default:
        return tokens.colorNeutralBackground3;
    }
  };

  const renderArticleCard = (article: KBArticle) => (
    <PurpleGlassCard
      key={article.id}
      glassVariant="light"
      hoverable
      onClick={() => handleArticleClick(article)}
      style={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status Badge */}
      <div style={{ marginBottom: tokens.spacingVerticalS }}>
        <span style={{
          display: 'inline-block',
          padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
          borderRadius: tokens.borderRadiusSmall,
          backgroundColor: getStatusBadgeColor(article.status),
          color: tokens.colorNeutralForeground1,
          fontSize: tokens.fontSizeBase200,
          fontWeight: tokens.fontWeightSemibold,
        }}>
          {article.status}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: tokens.fontSizeBase400,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        marginBottom: tokens.spacingVerticalS,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p style={{
          fontSize: tokens.fontSizeBase300,
          color: tokens.colorNeutralForeground3,
          marginBottom: tokens.spacingVerticalM,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          flexGrow: 1,
        }}>
          {article.summary}
        </p>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: tokens.spacingHorizontalXS,
          marginBottom: tokens.spacingVerticalM,
        }}>
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: tokens.spacingHorizontalXXS,
              padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
              borderRadius: tokens.borderRadiusSmall,
              backgroundColor: tokens.colorNeutralBackground3,
              color: tokens.colorNeutralForeground2,
              fontSize: tokens.fontSizeBase100,
            }}>
              <TagRegular style={{ fontSize: '12px' }} />
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span style={{
              fontSize: tokens.fontSizeBase100,
              color: tokens.colorNeutralForeground3,
            }}>
              +{article.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalL,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        marginTop: 'auto',
        paddingTop: tokens.spacingVerticalS,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
          <EyeRegular style={{ fontSize: '14px' }} />
          {article.view_count} views
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
          <PersonRegular style={{ fontSize: '14px' }} />
          {article.author_name}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
          <CalendarRegular style={{ fontSize: '14px' }} />
          {new Date(article.created_at).toLocaleDateString()}
        </span>
      </div>
    </PurpleGlassCard>
  );

  const renderArticleList = (article: KBArticle) => (
    <PurpleGlassCard
      key={article.id}
      glassVariant="light"
      hoverable
      onClick={() => handleArticleClick(article)}
      style={{
        cursor: 'pointer',
        marginBottom: tokens.spacingVerticalM,
      }}
    >
      <div style={{ display: 'flex', gap: tokens.spacingHorizontalL, alignItems: 'flex-start' }}>
        {/* Left: Status and Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, marginBottom: tokens.spacingVerticalS }}>
            <span style={{
              display: 'inline-block',
              padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
              borderRadius: tokens.borderRadiusSmall,
              backgroundColor: getStatusBadgeColor(article.status),
              color: tokens.colorNeutralForeground1,
              fontSize: tokens.fontSizeBase200,
              fontWeight: tokens.fontWeightSemibold,
            }}>
              {article.status}
            </span>
            <span style={{
              fontSize: tokens.fontSizeBase200,
              color: tokens.colorNeutralForeground3,
            }}>
              {getCategoryName(article.category_id)}
            </span>
          </div>

          <h3 style={{
            fontSize: tokens.fontSizeBase500,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground1,
            marginBottom: tokens.spacingVerticalS,
          }}>
            {article.title}
          </h3>

          {article.summary && (
            <p style={{
              fontSize: tokens.fontSizeBase300,
              color: tokens.colorNeutralForeground3,
              marginBottom: tokens.spacingVerticalS,
            }}>
              {article.summary}
            </p>
          )}

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokens.spacingHorizontalL,
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground3,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
              <EyeRegular style={{ fontSize: '14px' }} />
              {article.view_count} views
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
              <PersonRegular style={{ fontSize: '14px' }} />
              {article.author_name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
              <CalendarRegular style={{ fontSize: '14px' }} />
              {new Date(article.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Right: Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: tokens.spacingVerticalS,
        }}>
          <div style={{
            fontSize: tokens.fontSizeBase300,
            color: tokens.colorBrandForeground1,
            fontWeight: tokens.fontWeightSemibold,
          }}>
            {article.helpful_count + article.not_helpful_count > 0 && (
              <>
                {Math.round((article.helpful_count / (article.helpful_count + article.not_helpful_count)) * 100)}% helpful
              </>
            )}
          </div>
          {article.tags.length > 0 && (
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
              {article.tags.slice(0, 2).map((tag) => (
                <span key={tag} style={{
                  padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
                  borderRadius: tokens.borderRadiusSmall,
                  backgroundColor: tokens.colorNeutralBackground3,
                  color: tokens.colorNeutralForeground2,
                  fontSize: tokens.fontSizeBase100,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </PurpleGlassCard>
  );

  return (
    <div style={{ padding: tokens.spacingVerticalXXL }}>
      {/* Header */}
      <div style={{ marginBottom: tokens.spacingVerticalXL }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalL }}>
          <div>
            <h1 style={{
              fontSize: tokens.fontSizeHero900,
              fontWeight: tokens.fontWeightSemibold,
              color: tokens.colorNeutralForeground1,
              marginBottom: tokens.spacingVerticalXS,
            }}>
              Knowledge Base
            </h1>
            <p style={{
              fontSize: tokens.fontSizeBase300,
              color: tokens.colorNeutralForeground3,
            }}>
              Search and browse technical documentation and guides
            </p>
          </div>
          <PurpleGlassButton
            variant="primary"
            icon={<AddRegular />}
            onClick={handleCreateArticle}
          >
            Create Article
          </PurpleGlassButton>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: tokens.spacingVerticalL }}>
          <KBSearchBar
            onSearch={handleSearch}
            onSelectArticle={handleArticleClick}
          />
        </div>

        {/* Filters and Controls */}
        <div style={{
          display: 'flex',
          gap: tokens.spacingHorizontalM,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Category Filter */}
          <PurpleGlassDropdown
            placeholder="All Categories"
            value={selectedCategory || ''}
            onChange={(_, data) => {
              setSelectedCategory(data.value || null);
              setCurrentPage(1);
            }}
            options={[
              { key: '', text: 'All Categories' },
              ...categories.map(cat => ({ key: cat.id, text: `${cat.name} (${cat.article_count})` }))
            ]}
            glassVariant="light"
          />

          {/* Status Filter */}
          <PurpleGlassDropdown
            placeholder="All Status"
            value={selectedStatus || ''}
            onChange={(_, data) => {
              setSelectedStatus((data.value as KBArticleStatus) || null);
              setCurrentPage(1);
            }}
            options={[
              { key: '', text: 'All Status' },
              { key: 'PUBLISHED', text: 'Published' },
              { key: 'DRAFT', text: 'Draft' },
              { key: 'PENDING_REVIEW', text: 'Pending Review' },
              { key: 'ARCHIVED', text: 'Archived' },
            ]}
            glassVariant="light"
          />

          {/* Sort */}
          <PurpleGlassDropdown
            placeholder="Sort by"
            value={sortBy}
            onChange={(_, data) => setSortBy(data.value as SortOption)}
            options={[
              { key: 'recent', text: 'Most Recent' },
              { key: 'popular', text: 'Most Popular' },
              { key: 'title', text: 'Title (A-Z)' },
              { key: 'updated', text: 'Recently Updated' },
            ]}
            glassVariant="light"
            contentBefore={<ArrowSortRegular />}
          />

          {/* View Toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: tokens.spacingHorizontalXS }}>
            <PurpleGlassButton
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              icon={<GridRegular />}
              onClick={() => setViewMode('grid')}
            />
            <PurpleGlassButton
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              icon={<ListRegular />}
              onClick={() => setViewMode('list')}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
          gap: tokens.spacingHorizontalL,
        }}>
          {[...Array(6)].map((_, i) => (
            <PurpleGlassSkeleton key={i} height="200px" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <PurpleGlassEmptyState
          icon={<BookRegular />}
          title="No articles found"
          description={searchQuery ? `No results for "${searchQuery}"` : "Create your first article to get started"}
          action={
            !searchQuery && (
              <PurpleGlassButton
                variant="primary"
                icon={<AddRegular />}
                onClick={handleCreateArticle}
              >
                Create Article
              </PurpleGlassButton>
            )
          }
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: tokens.spacingHorizontalL,
            }}>
              {articles.map(renderArticleCard)}
            </div>
          ) : (
            <div>{articles.map(renderArticleList)}</div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: tokens.spacingVerticalXXL,
            }}>
              <PurpleGlassPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
