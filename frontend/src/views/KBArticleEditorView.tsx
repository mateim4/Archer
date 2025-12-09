import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  PurpleGlassSkeleton,
} from '../components/ui';
import { MarkdownEditor } from '../components/kb/MarkdownEditor';
import {
  ArrowLeftRegular,
  SaveRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import { apiClient, KBArticle, KBCategory, CreateKBArticleRequest, KBArticleVisibility } from '../utils/apiClient';

/**
 * KBArticleEditorView - Create and edit KB articles
 * 
 * Features:
 * - Markdown editor with live preview
 * - Category selector
 * - Tags input
 * - Draft/Publish workflow
 * - Auto-save (every 30 seconds)
 * - Validation
 */
export const KBArticleEditorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<KBArticleVisibility>('INTERNAL');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load article if editing
  useEffect(() => {
    if (isEditMode && id) {
      loadArticle(id);
    }
    loadCategories();
  }, [id, isEditMode]);

  // Auto-save
  useEffect(() => {
    if (!isDirty) return;

    const autoSaveInterval = setInterval(() => {
      if (isDirty && title && content) {
        handleSaveDraft(true); // Silent auto-save
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isDirty, title, content]);

  // Mark as dirty when any field changes
  useEffect(() => {
    setIsDirty(true);
  }, [title, summary, content, categoryId, tags, visibility, seoTitle, seoDescription]);

  const loadArticle = async (articleId: string) => {
    setIsLoading(true);
    try {
      const article = await apiClient.getKBArticle(articleId);
      setTitle(article.title);
      setSummary(article.summary || '');
      setContent(article.content);
      setCategoryId(article.category_id || '');
      setTags(article.tags);
      setTagsInput(article.tags.join(', '));
      setVisibility(article.visibility);
      setSeoTitle(article.seo_title || '');
      setSeoDescription(article.seo_description || '');
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to load article:', error);
      alert('Failed to load article');
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

  const handleTagsInputChange = (value: string) => {
    setTagsInput(value);
    // Parse tags from comma-separated input
    const parsedTags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setTags(parsedTags);
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (!content.trim()) return 'Content is required';
    if (title.length < 10) return 'Title must be at least 10 characters';
    if (content.length < 50) return 'Content must be at least 50 characters';
    return null;
  };

  const handleSaveDraft = async (silent = false) => {
    const error = validateForm();
    if (error) {
      if (!silent) alert(error);
      return;
    }

    setIsSaving(true);
    try {
      const articleData: CreateKBArticleRequest = {
        title,
        summary: summary || undefined,
        content,
        category_id: categoryId || undefined,
        tags,
        visibility,
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
      };

      if (isEditMode && id) {
        await apiClient.updateKBArticle(id, articleData);
      } else {
        const newArticle = await apiClient.createKBArticle(articleData);
        if (!silent) {
          navigate(`/knowledge-base/${newArticle.id}`);
        }
      }

      setLastSaved(new Date());
      setIsDirty(false);
      if (!silent) {
        alert('Draft saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      if (!silent) {
        alert('Failed to save draft');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    if (!confirm('Are you sure you want to publish this article? It will be visible to users based on its visibility setting.')) {
      return;
    }

    setIsSaving(true);
    try {
      // First save as draft
      const articleData: CreateKBArticleRequest = {
        title,
        summary: summary || undefined,
        content,
        category_id: categoryId || undefined,
        tags,
        visibility,
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
      };

      let articleId = id;
      if (isEditMode && id) {
        await apiClient.updateKBArticle(id, articleData);
      } else {
        const newArticle = await apiClient.createKBArticle(articleData);
        articleId = newArticle.id;
      }

      // Then publish
      if (articleId) {
        await apiClient.publishKBArticle(articleId);
        alert('Article published successfully!');
        navigate(`/knowledge-base/${articleId}`);
      }
    } catch (error) {
      console.error('Failed to publish article:', error);
      alert('Failed to publish article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    if (isEditMode && id) {
      navigate(`/knowledge-base/${id}`);
    } else {
      navigate('/knowledge-base');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: tokens.spacingVerticalXXL }}>
        <PurpleGlassSkeleton height="40px" style={{ marginBottom: tokens.spacingVerticalL, maxWidth: '200px' }} />
        <PurpleGlassSkeleton height="60px" style={{ marginBottom: tokens.spacingVerticalM }} />
        <PurpleGlassSkeleton height="400px" />
      </div>
    );
  }

  return (
    <div style={{ padding: tokens.spacingVerticalXXL, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacingVerticalXL }}>
        <div>
          <h1 style={{
            fontSize: tokens.fontSizeHero900,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground1,
            marginBottom: tokens.spacingVerticalXS,
          }}>
            {isEditMode ? 'Edit Article' : 'Create New Article'}
          </h1>
          {lastSaved && (
            <p style={{
              fontSize: tokens.fontSizeBase200,
              color: tokens.colorNeutralForeground3,
            }}>
              Last saved: {lastSaved.toLocaleTimeString()}
              {isDirty && ' (unsaved changes)'}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <PurpleGlassButton
            variant="subtle"
            icon={<DismissCircleRegular />}
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </PurpleGlassButton>
          <PurpleGlassButton
            variant="outline"
            icon={<SaveRegular />}
            onClick={() => handleSaveDraft(false)}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </PurpleGlassButton>
          <PurpleGlassButton
            variant="primary"
            icon={<CheckmarkCircleRegular />}
            onClick={handlePublish}
            disabled={isSaving}
          >
            Publish
          </PurpleGlassButton>
        </div>
      </div>

      {/* Form */}
      <PurpleGlassCard glassVariant="light" style={{ marginBottom: tokens.spacingVerticalXL }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
          {/* Title */}
          <div>
            <label style={{
              display: 'block',
              fontSize: tokens.fontSizeBase300,
              fontWeight: tokens.fontWeightSemibold,
              color: tokens.colorNeutralForeground1,
              marginBottom: tokens.spacingVerticalS,
            }}>
              Title *
            </label>
            <PurpleGlassInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              glassVariant="light"
              validationState={title.length > 0 && title.length < 10 ? 'error' : 'default'}
            />
            <div style={{
              fontSize: tokens.fontSizeBase100,
              color: tokens.colorNeutralForeground4,
              marginTop: tokens.spacingVerticalXXS,
            }}>
              {title.length}/255 characters (minimum 10)
            </div>
          </div>

          {/* Summary */}
          <div>
            <label style={{
              display: 'block',
              fontSize: tokens.fontSizeBase300,
              fontWeight: tokens.fontWeightSemibold,
              color: tokens.colorNeutralForeground1,
              marginBottom: tokens.spacingVerticalS,
            }}>
              Summary
            </label>
            <PurpleGlassTextarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of the article (shown in search results)..."
              rows={3}
              glassVariant="light"
            />
          </div>

          {/* Category and Visibility */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalL }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: tokens.fontSizeBase300,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorNeutralForeground1,
                marginBottom: tokens.spacingVerticalS,
              }}>
                Category
              </label>
              <PurpleGlassDropdown
                placeholder="Select category"
                value={categoryId}
                onChange={(_, data) => setCategoryId(data.value)}
                options={[
                  { key: '', text: 'No Category' },
                  ...categories.map(cat => ({ key: cat.id, text: cat.name }))
                ]}
                glassVariant="light"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: tokens.fontSizeBase300,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorNeutralForeground1,
                marginBottom: tokens.spacingVerticalS,
              }}>
                Visibility
              </label>
              <PurpleGlassDropdown
                value={visibility}
                onChange={(_, data) => setVisibility(data.value as KBArticleVisibility)}
                options={[
                  { key: 'PUBLIC', text: 'Public (Everyone)' },
                  { key: 'INTERNAL', text: 'Internal (Authenticated Users)' },
                  { key: 'RESTRICTED', text: 'Restricted (Specific Roles)' },
                ]}
                glassVariant="light"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{
              display: 'block',
              fontSize: tokens.fontSizeBase300,
              fontWeight: tokens.fontWeightSemibold,
              color: tokens.colorNeutralForeground1,
              marginBottom: tokens.spacingVerticalS,
            }}>
              Tags
            </label>
            <PurpleGlassInput
              value={tagsInput}
              onChange={(e) => handleTagsInputChange(e.target.value)}
              placeholder="Enter tags separated by commas (e.g., server, troubleshooting, vmware)"
              glassVariant="light"
            />
            {tags.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: tokens.spacingHorizontalS,
                marginTop: tokens.spacingVerticalS,
              }}>
                {tags.map((tag, index) => (
                  <span key={index} style={{
                    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
                    borderRadius: tokens.borderRadiusSmall,
                    backgroundColor: tokens.colorBrandBackground2,
                    color: tokens.colorBrandForeground1,
                    fontSize: tokens.fontSizeBase200,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div>
            <label style={{
              display: 'block',
              fontSize: tokens.fontSizeBase300,
              fontWeight: tokens.fontWeightSemibold,
              color: tokens.colorNeutralForeground1,
              marginBottom: tokens.spacingVerticalS,
            }}>
              Content * (Markdown)
            </label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              height="600px"
            />
            <div style={{
              fontSize: tokens.fontSizeBase100,
              color: tokens.colorNeutralForeground4,
              marginTop: tokens.spacingVerticalXXS,
            }}>
              {content.length} characters (minimum 50). Use Markdown syntax for formatting.
            </div>
          </div>

          {/* SEO Section (Optional) */}
          <details style={{ marginTop: tokens.spacingVerticalL }}>
            <summary style={{
              fontSize: tokens.fontSizeBase300,
              fontWeight: tokens.fontWeightSemibold,
              color: tokens.colorNeutralForeground2,
              cursor: 'pointer',
              marginBottom: tokens.spacingVerticalM,
            }}>
              SEO Settings (Optional)
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, paddingLeft: tokens.spacingHorizontalL }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground2,
                  marginBottom: tokens.spacingVerticalS,
                }}>
                  SEO Title
                </label>
                <PurpleGlassInput
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Custom SEO title (defaults to article title)"
                  glassVariant="light"
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: tokens.fontSizeBase200,
                  color: tokens.colorNeutralForeground2,
                  marginBottom: tokens.spacingVerticalS,
                }}>
                  SEO Description
                </label>
                <PurpleGlassTextarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Custom SEO description (defaults to summary)"
                  rows={2}
                  glassVariant="light"
                />
              </div>
            </div>
          </details>
        </div>
      </PurpleGlassCard>

      {/* Help Card */}
      <PurpleGlassCard glassVariant="light">
        <h3 style={{
          fontSize: tokens.fontSizeBase400,
          fontWeight: tokens.fontWeightSemibold,
          color: tokens.colorNeutralForeground1,
          marginBottom: tokens.spacingVerticalM,
        }}>
          Markdown Quick Reference
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: tokens.spacingVerticalS,
          fontSize: tokens.fontSizeBase200,
          color: tokens.colorNeutralForeground2,
          fontFamily: tokens.fontFamilyMonospace,
        }}>
          <div># Heading 1</div>
          <div>## Heading 2</div>
          <div>**bold text**</div>
          <div>*italic text*</div>
          <div>`code`</div>
          <div>[link](url)</div>
          <div>- bullet list</div>
          <div>1. numbered list</div>
        </div>
      </PurpleGlassCard>
    </div>
  );
};
