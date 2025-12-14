/**
 * CMDB Query Hooks - TanStack Query
 * 
 * Provides queries for Assets and Configuration Items.
 * Note: CMDB is still in development - only basic asset queries available.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AssetFilters } from './queryKeys';
import { staleTimes } from './queryClient';
import { apiClient } from '@/utils/apiClient';

// =============================================================================
// CMDB QUERIES
// =============================================================================

/**
 * Fetch all assets
 */
export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: queryKeys.cmdb.assetList(filters),
    queryFn: () => apiClient.getAssets(filters ? {
      asset_type: filters.type,
      status: filters.status,
    } : undefined),
    staleTime: staleTimes.projects,
    placeholderData: [],
  });
}

/**
 * Fetch a single asset
 */
export function useAsset(assetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cmdb.asset(assetId ?? ''),
    queryFn: () => apiClient.getAsset(assetId!),
    enabled: !!assetId,
    staleTime: staleTimes.projects,
  });
}

// Note: CI mutations (create/update/delete) and CI types 
// will be implemented when the backend CMDB API is complete.
