import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassDrawer,
  PurpleGlassSkeleton,
  PurpleGlassEmptyState
} from '../components/ui';
import { MarkdownRenderer } from '../components/kb/MarkdownRenderer';
import { RatingWidget } from '../components/kb/RatingWidget';
import {
  ArrowLeftRegular,
  EditRegular,
  DeleteRegular,
  HistoryRegular,
  EyeRegular,
  PersonRegular,
  CalendarRegular,
  TagRegular,
  BookmarkRegular,
  ShareRegular,
  PrintRegular
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { apiClient, KBArticle, KBArticleVersion } from '../utils/apiClient';

/**
 * KBArticleDetailView - Article reader with full metadata and actions
 * 
 * Features:
 * - Markdown content rendering
 * - Article metadata (author, date, views, rating)
 * - Version history sidebar
 * - Rating/feedback widget
 * - Related articles section
 * - Edit/Delete actions (for authorized users)
 */
export const KBArticleDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [versions, setVersions] = useState<KBArticleVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedArticle = await apiClient.getKBArticle(articleId);
      setArticle(fetchedArticle);

      // Load version history
      const fetchedVersions = await apiClient.getKBArticleVersions(articleId);
      setVersions(fetchedVersions);
    } catch (error: any) {
      console.error('Failed to load article:', error);
      setError(error.message || 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (is_helpful: boolean, feedback?: string) => {
    if (!article) return;
    try {
      await apiClient.rateKBArticle(article.id, { is_helpful, feedback });
      // Reload article to get updated counts
      await loadArticle(article.id);
    } catch (error) {
      console.error('Failed to rate article:', error);
      throw error;
    }
  };

  const handleEdit = () => {
    if (article) {
      navigate(`/knowledge-base/${article.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await apiClient.deleteKBArticle(article.id);
      navigate('/knowledge-base');
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Failed to delete article');
    }
  };

  const handleBack = () => {
    navigate('/knowledge-base');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Copy URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div style={{ padding: tokens.spacingVerticalXXL }}>
        <div style={{ marginBottom: tokens.spacingVerticalL, maxWidth: '200px' }}>
          <PurpleGlassSkeleton variant="text" height="40px" />
        </div>
        <div style={{ marginBottom: tokens.spacingVerticalM }}>
          <PurpleGlassSkeleton variant="text" height="60px" />
        </div>
        <PurpleGlassSkeleton variant="card" height="400px" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div style={{ padding: tokens.spacingVerticalXXL }}>
        <PurpleGlassEmptyState
          title="Article not found"
          description={error || "The article you're looking for doesn't exist or has been deleted."}
          action={{
            label: "Back to Knowledge Base",
            onClick: handleBack,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacingVerticalXXL, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalL }}>
        <PurpleGlassButton
          variant="ghost"
          icon={<ArrowLeftRegular />}
          onClick={handleBack}
        >
          Back to Articles
        </PurpleGlassButton>

        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <PurpleGlassButton
            variant="ghost"
            icon={<ShareRegular />}
            onClick={handleShare}
          />
          <PurpleGlassButton
            variant="ghost"
            icon={<PrintRegular />}
            onClick={handlePrint}
          />
          <PurpleGlassButton
            variant="ghost"
            icon={<HistoryRegular />}
            onClick={() => setShowVersionHistory(true)}
          >
            Version History
          </PurpleGlassButton>
          <PurpleGlassButton
            variant="primary"
            icon={<EditRegular />}
            onClick={handleEdit}
          >
            Edit
          </PurpleGlassButton>
          <PurpleGlassButton
            variant="danger"
            icon={<DeleteRegular />}
            onClick={handleDelete}
          >
            Delete
          </PurpleGlassButton>
        </div>
      </div>

      {/* Main Content */}
      <PurpleGlassCard style={{ marginBottom: tokens.spacingVerticalXL }}>
        {/* Article Header */}
        <div style={{ marginBottom: tokens.spacingVerticalXL }}>
          {/* Status Badge */}
          <div style={{ marginBottom: tokens.spacingVerticalM }}>
            <span style={{
              display: 'inline-block',
              padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
              borderRadius: tokens.borderRadiusMedium,
              backgroundColor: article.status === 'PUBLISHED' 
                ? tokens.colorPaletteGreenBackground3 
                : tokens.colorPaletteYellowBackground3,
              color: tokens.colorNeutralForeground1,
              fontSize: tokens.fontSizeBase300,
              fontWeight: tokens.fontWeightSemibold,
            }}>
              {article.status}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: tokens.fontSizeHero1000,
            fontWeight: tokens.fontWeightBold,
            color: tokens.colorNeutralForeground1,
            marginBottom: tokens.spacingVerticalM,
            lineHeight: 1.2,
          }}>
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p style={{
              fontSize: tokens.fontSizeBase400,
              color: tokens.colorNeutralForeground2,
              marginBottom: tokens.spacingVerticalL,
              lineHeight: 1.6,
            }}>
              {article.summary}
            </p>
          )}

          {/* Metadata Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: tokens.spacingHorizontalXL,
            paddingTop: tokens.spacingVerticalM,
            paddingBottom: tokens.spacingVerticalM,
            borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
            fontSize: tokens.fontSizeBase300,
            color: tokens.colorNeutralForeground2,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
              <PersonRegular style={{ fontSize: '16px' }} />
              {article.author_name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
              <CalendarRegular style={{ fontSize: '16px' }} />
              Created {new Date(article.created_at).toLocaleDateString()}
            </span>
            {article.updated_at !== article.created_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                <CalendarRegular style={{ fontSize: '16px' }} />
                Updated {new Date(article.updated_at).toLocaleDateString()}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
              <EyeRegular style={{ fontSize: '16px' }} />
              {article.view_count} views
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
              <BookmarkRegular style={{ fontSize: '16px' }} />
              Version {article.version}
            </span>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: tokens.spacingHorizontalS,
              marginTop: tokens.spacingVerticalM,
            }}>
              {article.tags.map((tag) => (
                <span key={tag} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: tokens.spacingHorizontalXXS,
                  padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
                  borderRadius: tokens.borderRadiusMedium,
                  backgroundColor: tokens.colorNeutralBackground3,
                  color: tokens.colorNeutralForeground2,
                  fontSize: tokens.fontSizeBase200,
                }}>
                  <TagRegular style={{ fontSize: '14px' }} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article Content */}
        <div style={{
          paddingTop: tokens.spacingVerticalXL,
          paddingBottom: tokens.spacingVerticalXL,
        }}>
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Article Footer */}
        {article.approved_by && (
          <div style={{
            marginTop: tokens.spacingVerticalXL,
            paddingTop: tokens.spacingVerticalL,
            borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorNeutralForeground3,
          }}>
            Approved by {article.approved_by} on {article.approved_at && new Date(article.approved_at).toLocaleDateString()}
          </div>
        )}
      </PurpleGlassCard>

      {/* Rating Widget */}
      <div style={{ marginBottom: tokens.spacingVerticalXL }}>
        <RatingWidget
          articleId={article.id}
          helpfulCount={article.helpful_count}
          notHelpfulCount={article.not_helpful_count}
          onSubmitRating={handleRate}
        />
      </div>

      {/* Related Articles */}
      {article.related_articles.length > 0 && (
        <PurpleGlassCard style={{ marginBottom: tokens.spacingVerticalXL }}>
          <h2 style={{
            fontSize: tokens.fontSizeBase500,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground1,
            marginBottom: tokens.spacingVerticalL,
          }}>
            Related Articles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
            {article.related_articles.map((relatedId) => (
              <div key={relatedId} style={{
                padding: tokens.spacingVerticalM,
                borderRadius: tokens.borderRadiusMedium,
                backgroundColor: tokens.colorNeutralBackground2,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/knowledge-base/${relatedId}`)}>
                <span style={{ color: tokens.colorBrandForeground1 }}>
                  Article {relatedId}
                </span>
              </div>
            ))}
          </div>
        </PurpleGlassCard>
      )}

      {/* Version History Drawer */}
      <PurpleGlassDrawer
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        title="Version History"
        size="lg"
      >
        <div style={{ padding: tokens.spacingVerticalL }}>
          {versions.length === 0 ? (
            <p style={{ color: tokens.colorNeutralForeground3 }}>No version history available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              {versions.map((version) => (
                <PurpleGlassCard key={version.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.spacingVerticalS }}>
                    <div>
                      <div style={{
                        fontSize: tokens.fontSizeBase400,
                        fontWeight: tokens.fontWeightSemibold,
                        color: tokens.colorNeutralForeground1,
                      }}>
                        Version {version.version}
                      </div>
                      <div style={{
                        fontSize: tokens.fontSizeBase200,
                        color: tokens.colorNeutralForeground3,
                      }}>
                        {version.created_by_name} • {new Date(version.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {version.version === article.version && (
                      <span style={{
                        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
                        borderRadius: tokens.borderRadiusSmall,
                        backgroundColor: tokens.colorBrandBackground,
                        color: tokens.colorNeutralBackground1,
                        fontSize: tokens.fontSizeBase100,
                        fontWeight: tokens.fontWeightSemibold,
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  {version.change_summary && (
                    <div style={{
                      marginTop: tokens.spacingVerticalS,
                      fontSize: tokens.fontSizeBase300,
                      color: tokens.colorNeutralForeground2,
                    }}>
                      {version.change_summary}
                    </div>
                  )}
                </PurpleGlassCard>
              ))}
            </div>
          )}
        </div>
      </PurpleGlassDrawer>
    </div>
  );
};
