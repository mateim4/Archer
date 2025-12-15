/**
 * SLA Query Hooks - TanStack Query
 * 
 * Provides queries and mutations for SLA policy management.
 * 
 * @example
 * ```tsx
 * // In a component
 * const { data: policies, isLoading } = useSlaPolicies();
 * const { data: policy } = useSlaPolicy(policyId);
 * const createPolicy = useCreateSlaPolicy();
 * 
 * // Create a policy
 * createPolicy.mutate({ name: 'Critical', response_target_minutes: 60, ... });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { staleTimes } from './queryClient';
import { apiClient } from '@/utils/apiClient';

// =============================================================================
// TYPES
// =============================================================================

export interface EscalationRule {
  trigger_at_percent: number;
  notify_users: string[];
  notify_groups: string[];
  reassign_to?: string;
}

export interface SlaPolicy {
  id?: string;
  name: string;
  description?: string;
  response_target_minutes: number;
  resolution_target_minutes: number;
  applies_to_priorities: string[];
  applies_to_types: string[];
  business_hours_id?: string;
  is_active: boolean;
  escalation_rules: EscalationRule[];
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}

export interface SlaStatusResponse {
  response_due?: string;
  resolution_due?: string;
  response_breached: boolean;
  resolution_breached: boolean;
  response_time_remaining_minutes?: number;
  resolution_time_remaining_minutes?: number;
  policy_name?: string;
}

// =============================================================================
// SLA POLICY QUERIES
// =============================================================================

/**
 * Fetch all SLA policies
 */
export function useSlaPolicies() {
  return useQuery({
    queryKey: queryKeys.sla.policies(),
    queryFn: async (): Promise<SlaPolicy[]> => {
      const response = await apiClient.get('/api/v1/sla/policies');
      return response.data || [];
    },
    staleTime: staleTimes.settings, // 5 minutes like other settings
    placeholderData: [],
  });
}

/**
 * Fetch a single SLA policy by ID
 */
export function useSlaPolicy(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sla.policy(id ?? ''),
    queryFn: async (): Promise<SlaPolicy> => {
      const response = await apiClient.get(`/api/v1/sla/policies/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: staleTimes.settings,
  });
}

/**
 * Get SLA status for a specific ticket
 */
export function useTicketSlaStatus(ticketId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sla.ticketStatus(ticketId ?? ''),
    queryFn: async (): Promise<SlaStatusResponse> => {
      const response = await apiClient.get(`/api/v1/sla/tickets/${ticketId}/sla-status`);
      return response.data;
    },
    enabled: !!ticketId,
    staleTime: 30 * 1000, // 30 seconds for live data
  });
}

// =============================================================================
// SLA POLICY MUTATIONS
// =============================================================================

/**
 * Create a new SLA policy
 */
export function useCreateSlaPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (policy: Omit<SlaPolicy, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiClient.post('/api/v1/sla/policies', policy);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.all });
    },
  });
}

/**
 * Update an existing SLA policy
 */
export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...policy }: SlaPolicy) => {
      if (!id) throw new Error('Policy ID is required for update');
      const response = await apiClient.put(`/api/v1/sla/policies/${id}`, policy);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.all });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sla.policy(variables.id) });
      }
    },
  });
}

/**
 * Delete an SLA policy
 */
export function useDeleteSlaPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/sla/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.all });
    },
  });
}
