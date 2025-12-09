/**
 * Knowledge Base Type Definitions
 * Matching backend models in backend/src/models/knowledge_base.rs
 */

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum RelationType {
  RELATED = 'RELATED',
  PREREQUISITE = 'PREREQUISITE',
  SEE_ALSO = 'SEE_ALSO',
  SUPERSEDES = 'SUPERSEDES',
}

export interface KnowledgeArticle {
  id?: string;
  title: string;
  content: string;
  summary?: string;
  category_id?: string;
  status: ArticleStatus;
  author_id: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  version_number: number;
  is_featured: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface KnowledgeCategory {
  id?: string;
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  order: number;
  article_count: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleVersion {
  id?: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string;
  summary?: string;
  changed_by: string;
  change_note?: string;
  created_at: string;
}

export interface ArticleFeedback {
  id?: string;
  article_id: string;
  user_id: string;
  is_helpful: boolean;
  comment?: string;
  created_at: string;
}

export interface ArticleAttachment {
  id?: string;
  article_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface RelatedArticle {
  id?: string;
  article_id: string;
  related_article_id: string;
  relation_type: RelationType;
  created_at: string;
}

// Request/Response DTOs

export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  category_id?: string;
  tags: string[];
  status: ArticleStatus;
  author_id: string;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  summary?: string;
  category_id?: string;
  tags?: string[];
  status?: ArticleStatus;
  is_featured?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  order?: number;
  is_visible?: boolean;
}

export interface SearchArticlesRequest {
  query: string;
  category_id?: string;
  tags?: string[];
  status?: ArticleStatus;
  limit?: number;
  offset?: number;
}

export interface SearchArticlesParams {
  q: string;
  category_id?: string;
  limit?: number;
}

export interface ListArticlesParams {
  category_id?: string;
  status?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface ArticleWithMetadata extends KnowledgeArticle {
  category_name?: string;
  author_name: string;
  related_count: number;
}

// UI State types

export interface KBViewState {
  selectedCategory?: string;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  sortBy: 'recent' | 'popular' | 'helpful';
  filterStatus?: ArticleStatus;
}

export interface ArticleEditorState {
  article?: KnowledgeArticle;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  validationErrors: Record<string, string>;
}
