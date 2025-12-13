/**
 * useAsyncData - Blazing Fast Data Loading Hook
 * 
 * Implements the "Instant Render + Background Sync" pattern:
 * 1. IMMEDIATELY renders with initial/cached data (no loading state!)
 * 2. Fetches real data in the background
 * 3. Seamlessly updates when data arrives
 * 4. Gracefully handles errors without blocking UI
 * 
 * This eliminates the "waiting for API" anti-pattern where users
 * stare at spinners while network requests complete.
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isStale, error, refresh } = useAsyncData({
 *   key: 'dashboard-tickets',
 *   fetcher: () => apiClient.getTickets(),
 *   initialData: MOCK_TICKETS,
 *   staleTime: 30000, // 30 seconds
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Simple in-memory cache (survives component remounts, cleared on page refresh)
const cache = new Map<string, { data: any; timestamp: number }>();

export interface UseAsyncDataOptions<T> {
  /** Unique cache key for this data */
  key: string;
  /** Async function that fetches the data */
  fetcher: () => Promise<T>;
  /** Initial data to show immediately (no loading state!) */
  initialData: T;
  /** How long cached data is considered fresh (ms). Default: 30000 (30s) */
  staleTime?: number;
  /** How long to wait before giving up on fetch (ms). Default: 3000 */
  timeout?: number;
  /** Whether to fetch on mount. Default: true */
  fetchOnMount?: boolean;
  /** Callback when fetch succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when fetch fails */
  onError?: (error: Error) => void;
}

export interface UseAsyncDataResult<T> {
  /** Current data (always available - never undefined!) */
  data: T;
  /** True only during initial load when no cache exists */
  isLoading: boolean;
  /** True when background refresh is happening */
  isRefreshing: boolean;
  /** True when showing cached/initial data while fetching fresh data */
  isStale: boolean;
  /** True when using mock/fallback data (backend unavailable) */
  isFallback: boolean;
  /** Error from last fetch attempt (null if successful) */
  error: Error | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Clear cache and refetch */
  invalidate: () => Promise<void>;
}

export function useAsyncData<T>({
  key,
  fetcher,
  initialData,
  staleTime = 30000,
  timeout = 3000,
  fetchOnMount = true,
  onSuccess,
  onError,
}: UseAsyncDataOptions<T>): UseAsyncDataResult<T> {
  // Get cached data or use initial
  const getCachedOrInitial = useCallback((): T => {
    const cached = cache.get(key);
    if (cached) {
      return cached.data;
    }
    return initialData;
  }, [key, initialData]);

  const isCacheFresh = useCallback((): boolean => {
    const cached = cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < staleTime;
  }, [key, staleTime]);

  // State - initialized with cached/initial data (NO loading state by default!)
  const [data, setData] = useState<T>(getCachedOrInitial);
  const [isLoading, setIsLoading] = useState(!cache.has(key) && fetchOnMount);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(!isCacheFresh());
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs to prevent stale closures
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Core fetch function with timeout and error handling
  const fetchData = useCallback(async (showLoadingState = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Only show loading on initial fetch with no cache
    if (showLoadingState && !cache.has(key)) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setIsStale(true);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    try {
      // Race between fetch and timeout
      const result = await Promise.race([
        fetcher(),
        timeoutPromise,
      ]);

      if (!mountedRef.current) return;

      // Update cache
      cache.set(key, { data: result, timestamp: Date.now() });
      
      // Update state
      setData(result);
      setError(null);
      setIsStale(false);
      setIsFallback(false);
      onSuccess?.(result);

    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Don't treat aborts as errors
      if (error.name === 'AbortError') return;

      console.warn(`[useAsyncData] ${key} fetch failed:`, error.message);
      setError(error);
      setIsFallback(true);
      onError?.(error);
      
      // Keep showing current data (cached or initial) - don't clear it!
      // This is the key insight: errors don't break the UI
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [key, fetcher, timeout, onSuccess, onError]);

  // Refresh function (exposed to consumers)
  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  // Invalidate cache and refetch
  const invalidate = useCallback(async () => {
    cache.delete(key);
    setData(initialData);
    await fetchData(true);
  }, [key, initialData, fetchData]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (fetchOnMount) {
      // If cache is fresh, just use it (no fetch)
      if (isCacheFresh()) {
        setIsLoading(false);
        setIsStale(false);
        return;
      }
      
      // Otherwise fetch in background (data already showing from cache/initial)
      fetchData(!cache.has(key));
    }

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [fetchOnMount, fetchData, key, isCacheFresh]);

  return {
    data,
    isLoading,
    isRefreshing,
    isStale,
    isFallback,
    error,
    refresh,
    invalidate,
  };
}

/**
 * Utility to prefetch data into cache before navigation
 * Call this on hover or route preload for instant page transitions
 */
export async function prefetchData<T>(
  key: string,
  fetcher: () => Promise<T>,
  timeout = 3000
): Promise<void> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Prefetch timeout')), timeout);
    });
    
    const result = await Promise.race([fetcher(), timeoutPromise]);
    cache.set(key, { data: result, timestamp: Date.now() });
  } catch (err) {
    // Prefetch failures are silent - they're optimistic
    console.debug(`[prefetch] ${key} failed:`, err);
  }
}

/**
 * Clear all cached data
 */
export function clearAsyncDataCache(): void {
  cache.clear();
}

/**
 * Clear specific cache entry
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

export default useAsyncData;
