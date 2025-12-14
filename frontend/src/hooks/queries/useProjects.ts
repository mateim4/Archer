/**
 * Project Query Hooks - TanStack Query
 * 
 * Provides queries and mutations for Projects, Activities, and Hardware.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type ProjectFilters } from './queryKeys';
import { staleTimes } from './queryClient';
import { 
  apiClient, 
  type Project,
  type CreateProjectRequest,
} from '@/utils/apiClient';

// =============================================================================
// PROJECT QUERIES
// =============================================================================

/**
 * Fetch all projects
 */
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: async () => {
      const response = await apiClient.getProjects();
      return Array.isArray(response) ? response : [];
    },
    staleTime: staleTimes.projects,
    placeholderData: [],
  });
}

/**
 * Fetch a single project
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ''),
    queryFn: () => apiClient.getProject(projectId!),
    enabled: !!projectId,
    staleTime: staleTimes.projects,
  });
}

/**
 * Fetch project activities
 */
export function useProjectActivities(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.activities(projectId ?? ''),
    queryFn: () => apiClient.getActivities(projectId!),
    enabled: !!projectId,
    staleTime: staleTimes.activities,
    placeholderData: [],
  });
}

/**
 * Fetch project hardware
 */
export function useProjectHardware(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.hardware(projectId ?? ''),
    queryFn: () => apiClient.getHardware(projectId!),
    enabled: !!projectId,
    staleTime: staleTimes.projects,
    placeholderData: [],
  });
}

/**
 * Fetch project design documents
 */
export function useProjectDesignDocs(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.designDocs(projectId ?? ''),
    queryFn: () => apiClient.getDesignDocs(projectId!),
    enabled: !!projectId,
    staleTime: staleTimes.projects,
    placeholderData: [],
  });
}

// =============================================================================
// PROJECT MUTATIONS
// =============================================================================

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (project: CreateProjectRequest) => apiClient.createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

/**
 * Update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProjectRequest> }) => 
      apiClient.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}
