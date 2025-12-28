/**
 * TanStack Query Hooks - Central Export
 * 
 * Import all query hooks from this file:
 * 
 * @example
 * ```tsx
 * import { useTickets, useProjects, queryClient } from '@/hooks/queries';
 * ```
 */

// Query Client & Configuration
export { queryClient, staleTimes, gcTimes, invalidateQueries, prefetchQuery, setQueryData, getQueryData, cancelQueries } from './queryClient';

// Query Keys Factory
export { queryKeys } from './queryKeys';
export type { TicketFilters, ProjectFilters, AssetFilters, KBArticleParams, CatalogFilters, RequestFilters } from './queryKeys';

// Ticket Hooks
export { 
  useTickets, 
  useTicket, 
  useTicketComments, 
  useTicketAttachments, 
  useTicketRelationships,
  useCreateTicket,
  useUpdateTicket,
  useAddTicketComment,
  useDeleteTicketComment,
  useUploadTicketAttachment,
  useDeleteTicketAttachment,
  useDeleteTicketRelationship,
} from './useTickets';

// Project Hooks
export {
  useProjects,
  useProject,
  useProjectActivities,
  useProjectHardware,
  useProjectDesignDocs,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from './useProjects';

// Monitoring Hooks
export {
  useAlerts,
  useMonitoringDashboard,
  useAssetMetrics,
  useAcknowledgeAlert,
  useResolveAlert,
  useCreateTicketFromAlert,
} from './useMonitoring';

// Knowledge Base Hooks
export {
  useKBArticles,
  useKBArticle,
  useKBArticleVersions,
  useKBCategories,
  useCreateKBArticle,
  useUpdateKBArticle,
  usePublishKBArticle,
  useDeleteKBArticle,
  useRateKBArticle,
} from './useKnowledgeBase';

// CMDB Hooks
export {
  useAssets,
  useAsset,
} from './useCMDB';

// Admin Hooks
export {
  useUsers,
  useRoles,
  usePermissions,
  useAuditLogs,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from './useAdmin';
