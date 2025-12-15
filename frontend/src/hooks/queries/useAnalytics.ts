/**
 * Analytics Query Hooks - TanStack Query
 * 
 * Provides queries for dashboard analytics and reporting metrics.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { staleTimes } from './queryClient';
import { apiClient, type DashboardAnalytics } from '@/utils/apiClient';

// =============================================================================
// ANALYTICS QUERIES
// =============================================================================

/**
 * Fetch dashboard analytics
 * Returns ticket counts, SLA metrics, and trends for the dashboard
 */
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: () => apiClient.getDashboardAnalytics(),
    staleTime: staleTimes.analytics,
    // Provide placeholder while loading
    placeholderData: {
      total_open_tickets: 0,
      total_in_progress: 0,
      total_resolved_today: 0,
      avg_resolution_time_hours: 0,
      sla_compliance: 0,
      critical_alerts: 0,
      ticket_volume_trend: [],
      category_breakdown: [],
    } as DashboardAnalytics,
  });
}
