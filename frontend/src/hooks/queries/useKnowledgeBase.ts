/**
 * Knowledge Base Query Hooks - TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type KBArticleParams } from './queryKeys';
import { staleTimes } from './queryClient';
import { apiClient } from '@/utils/apiClient';

// =============================================================================
// KB QUERIES
// =============================================================================

/**
 * Fetch KB articles with params
 */
export function useKBArticles(params?: KBArticleParams) {
  return useQuery({
    queryKey: queryKeys.kb.articleList(params),
    queryFn: () => apiClient.getKBArticles(params),
    staleTime: staleTimes.articles,
  });
}

/**
 * Fetch a single KB article
 */
export function useKBArticle(articleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kb.article(articleId ?? ''),
    queryFn: () => apiClient.getKBArticle(articleId!),
    enabled: !!articleId,
    staleTime: staleTimes.articles,
  });
}

/**
 * Fetch KB article versions
 */
export function useKBArticleVersions(articleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kb.articleVersions(articleId ?? ''),
    queryFn: () => apiClient.getKBArticleVersions(articleId!),
    enabled: !!articleId,
    staleTime: staleTimes.articles,
  });
}

/**
 * Fetch KB categories
 */
export function useKBCategories() {
  return useQuery({
    queryKey: queryKeys.kb.categories(),
    queryFn: () => apiClient.getKBCategories(),
    staleTime: staleTimes.categories,
  });
}

// =============================================================================
// KB MUTATIONS
// =============================================================================

/**
 * Create a KB article
 */
export function useCreateKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (article: Parameters<typeof apiClient.createKBArticle>[0]) => 
      apiClient.createKBArticle(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.articles() });
    },
  });
}

/**
 * Update a KB article
 */
export function useUpdateKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof apiClient.updateKBArticle>[1] }) => 
      apiClient.updateKBArticle(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.article(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.articles() });
    },
  });
}

/**
 * Publish a KB article
 */
export function usePublishKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (articleId: string) => apiClient.publishKBArticle(articleId),
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.article(articleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.articles() });
    },
  });
}

/**
 * Delete a KB article
 */
export function useDeleteKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (articleId: string) => apiClient.deleteKBArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.articles() });
    },
  });
}

/**
 * Rate a KB article
 */
export function useRateKBArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ articleId, rating }: { articleId: string; rating: { is_helpful: boolean; feedback?: string } }) => 
      apiClient.rateKBArticle(articleId, rating),
    onSuccess: (_, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kb.article(articleId) });
    },
  });
}
