/**
 * Query Keys Factory - TanStack Query
 * 
 * Centralized query key management for cache organization.
 * Keys are hierarchical for efficient invalidation.
 * 
 * @example
 * // Invalidate all tickets
 * queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
 * 
 * // Invalidate specific ticket
 * queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
 */

import type { AlertSeverity, AlertStatus } from '@/utils/apiClient';

// Filter types for query keys
export interface TicketFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
}

export interface ProjectFilters {
  status?: string;
  owner?: string;
}

export interface AssetFilters {
  type?: string;
  status?: string;
  search?: string;
}

export interface KBArticleParams {
  query?: string;
  category_id?: string;
  tags?: string[];
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  page?: number;
  page_size?: number;
}

export interface CatalogFilters {
  category_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface RequestFilters {
  requester_id?: string;
  status?: string;
}

// Monitoring/Alert filter types
export interface AlertFilters {
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  source?: string;
  affected_ci_id?: string;
  tags?: string[];
  search?: string;
  page?: number;
  page_size?: number;
}

// Admin audit log filters
export interface AuditLogFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

export const queryKeys = {
  // ==========================================================================
  // TICKETS (Service Desk)
  // ==========================================================================
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters?: TicketFilters) => [...queryKeys.tickets.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    comments: (id: string) => [...queryKeys.tickets.detail(id), 'comments'] as const,
    attachments: (id: string) => [...queryKeys.tickets.detail(id), 'attachments'] as const,
    relationships: (id: string) => [...queryKeys.tickets.detail(id), 'relationships'] as const,
  },

  // ==========================================================================
  // PROJECTS
  // ==========================================================================
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: ProjectFilters) => [...queryKeys.projects.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    activities: (id: string) => [...queryKeys.projects.detail(id), 'activities'] as const,
    hardware: (id: string) => [...queryKeys.projects.detail(id), 'hardware'] as const,
    designDocs: (id: string) => [...queryKeys.projects.detail(id), 'design-docs'] as const,
  },

  // ==========================================================================
  // KNOWLEDGE BASE
  // ==========================================================================
  kb: {
    all: ['kb'] as const,
    articles: () => [...queryKeys.kb.all, 'articles'] as const,
    articleList: (params?: KBArticleParams) => [...queryKeys.kb.articles(), 'list', params ?? {}] as const,
    article: (id: string) => [...queryKeys.kb.articles(), id] as const,
    articleVersions: (id: string) => [...queryKeys.kb.article(id), 'versions'] as const,
    categories: () => [...queryKeys.kb.all, 'categories'] as const,
  },

  // ==========================================================================
  // CMDB / ASSETS
  // ==========================================================================
  cmdb: {
    all: ['cmdb'] as const,
    assets: () => [...queryKeys.cmdb.all, 'assets'] as const,
    assetList: (filters?: AssetFilters) => [...queryKeys.cmdb.assets(), 'list', filters ?? {}] as const,
    asset: (id: string) => [...queryKeys.cmdb.assets(), id] as const,
    relationships: (id: string) => [...queryKeys.cmdb.asset(id), 'relationships'] as const,
    ciTypes: () => [...queryKeys.cmdb.all, 'ci-types'] as const,
  },

  // ==========================================================================
  // MONITORING
  // ==========================================================================
  monitoring: {
    all: ['monitoring'] as const,
    alerts: () => [...queryKeys.monitoring.all, 'alerts'] as const,
    alertList: (filters?: AlertFilters) => [...queryKeys.monitoring.alerts(), filters ?? {}] as const,
    metrics: (assetId: string) => [...queryKeys.monitoring.all, 'metrics', assetId] as const,
    dashboard: () => [...queryKeys.monitoring.all, 'dashboard'] as const,
  },

  // ==========================================================================
  // WORKFLOWS
  // ==========================================================================
  workflows: {
    all: ['workflows'] as const,
    list: () => [...queryKeys.workflows.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workflows.all, 'detail', id] as const,
    instances: () => [...queryKeys.workflows.all, 'instances'] as const,
    instance: (id: string) => [...queryKeys.workflows.instances(), id] as const,
    approvals: () => [...queryKeys.workflows.all, 'approvals'] as const,
  },

  // ==========================================================================
  // ADMIN (Users, Roles, Permissions)
  // ==========================================================================
  admin: {
    all: ['admin'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    user: (id: string) => [...queryKeys.admin.users(), id] as const,
    roles: () => [...queryKeys.admin.all, 'roles'] as const,
    role: (id: string) => [...queryKeys.admin.roles(), id] as const,
    permissions: () => [...queryKeys.admin.all, 'permissions'] as const,
    auditLogs: (filters?: AuditLogFilters) => [...queryKeys.admin.all, 'audit-logs', filters ?? {}] as const,
  },

  // ==========================================================================
  // SERVICE CATALOG
  // ==========================================================================
  catalog: {
    all: ['catalog'] as const,
    categories: () => [...queryKeys.catalog.all, 'categories'] as const,
    items: (filters?: CatalogFilters) => [...queryKeys.catalog.all, 'items', filters ?? {}] as const,
    item: (id: string) => [...queryKeys.catalog.items(), id] as const,
    requests: (filters?: RequestFilters) => [...queryKeys.catalog.all, 'requests', filters ?? {}] as const,
  },

  // ==========================================================================
  // HARDWARE BASKETS
  // ==========================================================================
  hardware: {
    all: ['hardware'] as const,
    baskets: () => [...queryKeys.hardware.all, 'baskets'] as const,
    basket: (id: string) => [...queryKeys.hardware.baskets(), id] as const,
    models: (basketId: string) => [...queryKeys.hardware.basket(basketId), 'models'] as const,
    configurations: (modelId: string) => [...queryKeys.hardware.all, 'configurations', modelId] as const,
  },

  // ==========================================================================
  // DASHBOARD (aggregated data)
  // ==========================================================================
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    stats: (timeRange: string) => [...queryKeys.dashboard.all, 'stats', timeRange] as const,
  },

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
  },
} as const;

// Type helpers for query keys
export type QueryKeys = typeof queryKeys;
