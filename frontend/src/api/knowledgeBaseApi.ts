/**
 * Knowledge Base API Client
 * Handles all API interactions with the backend KB endpoints
 */

import type {
  KnowledgeArticle,
  KnowledgeCategory,
  ArticleVersion,
  CreateArticleRequest,
  UpdateArticleRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ListArticlesParams,
  SearchArticlesParams,
} from '../types/knowledgeBaseTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const KB_API_BASE = `${API_BASE_URL}/api/v1/knowledge`;

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${KB_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ===== Article API =====

export const articlesApi = {
  /**
   * List all articles with optional filters
   */
  list: async (params?: ListArticlesParams): Promise<KnowledgeArticle[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));

    const query = queryParams.toString();
    return fetchAPI<KnowledgeArticle[]>(`/articles${query ? `?${query}` : ''}`);
  },

  /**
   * Get a single article by ID
   */
  get: async (id: string): Promise<KnowledgeArticle> => {
    return fetchAPI<KnowledgeArticle>(`/articles/${id}`);
  },

  /**
   * Create a new article
   */
  create: async (data: CreateArticleRequest): Promise<KnowledgeArticle> => {
    return fetchAPI<KnowledgeArticle>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing article
   */
  update: async (id: string, data: UpdateArticleRequest): Promise<KnowledgeArticle> => {
    return fetchAPI<KnowledgeArticle>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete an article (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/articles/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get version history for an article
   */
  getVersions: async (id: string): Promise<ArticleVersion[]> => {
    return fetchAPI<ArticleVersion[]>(`/articles/${id}/versions`);
  },

  /**
   * Increment view count for an article
   */
  incrementViewCount: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/articles/${id}/view`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * Submit feedback for an article
   */
  submitFeedback: async (
    id: string,
    userId: string,
    isHelpful: boolean,
    comment?: string
  ): Promise<void> => {
    return fetchAPI<void>(`/articles/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        is_helpful: isHelpful,
        comment,
      }),
    });
  },
};

// ===== Category API =====

export const categoriesApi = {
  /**
   * List all visible categories
   */
  list: async (): Promise<KnowledgeCategory[]> => {
    return fetchAPI<KnowledgeCategory[]>('/categories');
  },

  /**
   * Get a single category by ID
   */
  get: async (id: string): Promise<KnowledgeCategory> => {
    return fetchAPI<KnowledgeCategory>(`/categories/${id}`);
  },

  /**
   * Create a new category
   */
  create: async (data: CreateCategoryRequest): Promise<KnowledgeCategory> => {
    return fetchAPI<KnowledgeCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing category
   */
  update: async (id: string, data: UpdateCategoryRequest): Promise<KnowledgeCategory> => {
    return fetchAPI<KnowledgeCategory>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a category
   */
  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all articles in a category
   */
  getArticles: async (id: string): Promise<KnowledgeArticle[]> => {
    return fetchAPI<KnowledgeArticle[]>(`/categories/${id}/articles`);
  },
};

// ===== Search API =====

export const searchApi = {
  /**
   * Search articles by query
   */
  search: async (params: SearchArticlesParams): Promise<KnowledgeArticle[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.q);
    if (params.category_id) queryParams.append('category_id', params.category_id);
    if (params.limit) queryParams.append('limit', String(params.limit));

    return fetchAPI<KnowledgeArticle[]>(`/search?${queryParams.toString()}`);
  },
};

// ===== Combined KB API =====

export const knowledgeBaseApi = {
  articles: articlesApi,
  categories: categoriesApi,
  search: searchApi,
};

export default knowledgeBaseApi;
