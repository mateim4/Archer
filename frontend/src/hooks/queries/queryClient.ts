/**
 * QueryClient Configuration - TanStack Query
 * 
 * Global configuration for React Query with optimized defaults for Archer ITSM.
 * 
 * Features:
 * - Instant UI with stale-while-revalidate pattern
 * - Automatic background refetching
 * - Intelligent retry logic
 * - Error boundaries integration
 */

import { QueryClient } from '@tanstack/react-query';

// =============================================================================
// CACHE TIMING CONSTANTS
// =============================================================================

/** How long data is considered fresh (won't refetch) */
export const staleTimes = {
  // Fast-changing data - always refetch on focus
  realtime: 0,
  
  // Tickets, alerts - 30 seconds
  tickets: 30 * 1000,
  alerts: 30 * 1000,
  
  // Analytics, dashboard stats - 1 minute
  analytics: 60 * 1000,
  
  // Projects, activities - 2 minutes  
  projects: 2 * 60 * 1000,
  activities: 2 * 60 * 1000,
  
  // KB articles, users - 5 minutes
  articles: 5 * 60 * 1000,
  users: 5 * 60 * 1000,
  roles: 5 * 60 * 1000,
  
  // Categories, permissions, workflows - 10 minutes (rarely change)
  categories: 10 * 60 * 1000,
  permissions: 10 * 60 * 1000,
  workflows: 10 * 60 * 1000,
  
  // Default fallback
  default: 60 * 1000, // 1 minute
} as const;

/** How long to keep inactive data in cache (garbage collection) */
export const gcTimes = {
  short: 5 * 60 * 1000,    // 5 minutes
  default: 10 * 60 * 1000, // 10 minutes
  long: 30 * 60 * 1000,    // 30 minutes
} as const;

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

/**
 * Intelligent retry logic:
 * - Don't retry 4xx errors (client errors)
 * - Retry network errors and 5xx up to 3 times
 * - Exponential backoff
 */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // Max 3 retries
  if (failureCount >= 3) return false;
  
  // Don't retry client errors (400-499)
  if (error instanceof Error && 'status' in error) {
    const status = (error as any).status;
    if (status >= 400 && status < 500) return false;
  }
  
  // Retry network errors and server errors
  return true;
};

/**
 * Exponential backoff: 1s, 2s, 4s
 */
const retryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 8000);
};

// =============================================================================
// QUERY CLIENT INSTANCE
// =============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long until data is considered stale
      staleTime: staleTimes.default,
      
      // GC time - how long to keep unused data in cache  
      gcTime: gcTimes.default,
      
      // Retry configuration
      retry: shouldRetry,
      retryDelay,
      
      // Refetch behavior
      refetchOnWindowFocus: true,      // Refetch when tab gets focus
      refetchOnReconnect: true,        // Refetch when network reconnects
      refetchOnMount: true,            // Refetch when component mounts (if stale)
      
      // Network mode - always fetch, use cached data while loading
      networkMode: 'always',
      
      // Structural sharing for performance
      structuralSharing: true,
      
      // Don't throw errors in render (we'll handle them gracefully)
      throwOnError: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      
      // Network mode
      networkMode: 'always',
      
      // Don't throw errors (handle in onError)
      throwOnError: false,
    },
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Invalidate all queries matching a key prefix
 */
export const invalidateQueries = async (keyPrefix: readonly unknown[]) => {
  await queryClient.invalidateQueries({ queryKey: keyPrefix });
};

/**
 * Prefetch data into cache (for route preloading)
 */
export const prefetchQuery = async <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime = staleTimes.default
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
};

/**
 * Set data directly in cache (for optimistic updates)
 */
export const setQueryData = <T>(
  queryKey: readonly unknown[],
  updater: T | ((old: T | undefined) => T)
) => {
  queryClient.setQueryData(queryKey, updater);
};

/**
 * Get data from cache without fetching
 */
export const getQueryData = <T>(queryKey: readonly unknown[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};

/**
 * Cancel any outgoing queries (useful before mutations)
 */
export const cancelQueries = async (queryKey: readonly unknown[]) => {
  await queryClient.cancelQueries({ queryKey });
};

export default queryClient;
