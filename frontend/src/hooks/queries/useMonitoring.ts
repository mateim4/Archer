/**
 * Monitoring Query Hooks - TanStack Query
 * 
 * Provides queries and mutations for Monitoring, Alerts, and Metrics.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AlertFilters } from './queryKeys';
import { staleTimes } from './queryClient';
import { apiClient, type Alert, type CreateTicketFromAlertRequest } from '@/utils/apiClient';

// =============================================================================
// MONITORING QUERIES
// =============================================================================

/**
 * Fetch alerts with filters
 */
export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: queryKeys.monitoring.alertList(filters),
    queryFn: async () => {
      const response = await apiClient.getAlerts(filters);
      return response?.alerts ?? [];
    },
    staleTime: staleTimes.alerts,
    placeholderData: [],
  });
}

/**
 * Fetch dashboard summary (assets + summary data)
 */
export function useMonitoringDashboard() {
  return useQuery({
    queryKey: queryKeys.monitoring.dashboard(),
    queryFn: async () => {
      const [assets, summary] = await Promise.all([
        apiClient.getAssets(),
        apiClient.getDashboardSummary(),
      ]);
      return { assets, summary };
    },
    staleTime: staleTimes.alerts,
  });
}

/**
 * Fetch asset metrics
 */
export function useAssetMetrics(assetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.monitoring.metrics(assetId ?? ''),
    queryFn: () => apiClient.getAssetMetrics(assetId!),
    enabled: !!assetId,
    staleTime: staleTimes.realtime, // Metrics should always be fresh
  });
}

// =============================================================================
// MONITORING MUTATIONS
// =============================================================================

/**
 * Acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => apiClient.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.alerts() });
    },
  });
}

/**
 * Resolve an alert
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => apiClient.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.alerts() });
    },
  });
}

/**
 * Create ticket from alert
 */
export function useCreateTicketFromAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ alertId, data }: { alertId: string; data: CreateTicketFromAlertRequest }) => 
      apiClient.createTicketFromAlert(alertId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.alerts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}
