/**
 * Admin Query Hooks - TanStack Query
 * 
 * Provides queries for Users, Roles, Permissions, and Audit Logs.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type AuditLogFilters } from './queryKeys';
import { staleTimes } from './queryClient';
import { 
  apiClient, 
  type CreateAdminUserRequest,
  type UpdateAdminUserRequest,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from '@/utils/apiClient';

// =============================================================================
// USER QUERIES
// =============================================================================

/**
 * Fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () => apiClient.getAllUsers(),
    staleTime: staleTimes.users,
  });
}

/**
 * Fetch all roles
 */
export function useRoles() {
  return useQuery({
    queryKey: queryKeys.admin.roles(),
    queryFn: () => apiClient.getAllRoles(),
    staleTime: staleTimes.roles,
  });
}

/**
 * Fetch all permissions
 */
export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.admin.permissions(),
    queryFn: () => apiClient.getAllPermissions(),
    staleTime: staleTimes.permissions,
  });
}

/**
 * Fetch audit logs
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(filters),
    queryFn: () => apiClient.getAuditLogs(filters),
    staleTime: staleTimes.tickets, // Audit logs change frequently
  });
}

// =============================================================================
// USER MUTATIONS
// =============================================================================

/**
 * Create a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAdminUserRequest) => apiClient.createAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

/**
 * Update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserRequest }) => 
      apiClient.updateAdminUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

// =============================================================================
// ROLE MUTATIONS
// =============================================================================

/**
 * Create a role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => apiClient.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
    },
  });
}

/**
 * Update a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) => 
      apiClient.updateRole(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.role(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
    },
  });
}

/**
 * Delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
    },
  });
}
