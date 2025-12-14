# TanStack Query Integration Plan for Archer ITSM

## Overview

This document outlines the integration of TanStack Query (React Query v5) into the Archer ITSM platform to provide:
- **Instant UI rendering** with cached data
- **Background data synchronization**  
- **Automatic cache invalidation**
- **Optimistic updates** for mutations
- **DevTools** for debugging

## Architecture Design

### Query Key Structure

We'll use a hierarchical key structure for cache organization:

```typescript
// Query Keys Factory
export const queryKeys = {
  // Tickets
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters: TicketFilters) => [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    comments: (id: string) => [...queryKeys.tickets.detail(id), 'comments'] as const,
    attachments: (id: string) => [...queryKeys.tickets.detail(id), 'attachments'] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: ProjectFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    activities: (id: string) => [...queryKeys.projects.detail(id), 'activities'] as const,
    hardware: (id: string) => [...queryKeys.projects.detail(id), 'hardware'] as const,
    designDocs: (id: string) => [...queryKeys.projects.detail(id), 'design-docs'] as const,
  },
  
  // Knowledge Base
  kb: {
    all: ['kb'] as const,
    articles: () => [...queryKeys.kb.all, 'articles'] as const,
    articleList: (params: KBArticleParams) => [...queryKeys.kb.articles(), params] as const,
    article: (id: string) => [...queryKeys.kb.articles(), id] as const,
    articleVersions: (id: string) => [...queryKeys.kb.article(id), 'versions'] as const,
    categories: () => [...queryKeys.kb.all, 'categories'] as const,
  },
  
  // CMDB / Assets
  cmdb: {
    all: ['cmdb'] as const,
    assets: () => [...queryKeys.cmdb.all, 'assets'] as const,
    assetList: (filters?: AssetFilters) => [...queryKeys.cmdb.assets(), filters] as const,
    asset: (id: string) => [...queryKeys.cmdb.assets(), id] as const,
    relationships: (id: string) => [...queryKeys.cmdb.asset(id), 'relationships'] as const,
  },
  
  // Monitoring
  monitoring: {
    all: ['monitoring'] as const,
    alerts: () => [...queryKeys.monitoring.all, 'alerts'] as const,
    alertList: (filters: AlertFilters) => [...queryKeys.monitoring.alerts(), filters] as const,
    metrics: (assetId: string) => [...queryKeys.monitoring.all, 'metrics', assetId] as const,
    dashboard: () => [...queryKeys.monitoring.all, 'dashboard'] as const,
  },
  
  // Workflows
  workflows: {
    all: ['workflows'] as const,
    list: () => [...queryKeys.workflows.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workflows.all, id] as const,
    instances: () => [...queryKeys.workflows.all, 'instances'] as const,
    approvals: () => [...queryKeys.workflows.all, 'approvals'] as const,
  },
  
  // Users & Roles (Admin)
  admin: {
    users: () => ['admin', 'users'] as const,
    user: (id: string) => ['admin', 'users', id] as const,
    roles: () => ['admin', 'roles'] as const,
    role: (id: string) => ['admin', 'roles', id] as const,
    permissions: () => ['admin', 'permissions'] as const,
    auditLogs: (filters: AuditLogFilters) => ['admin', 'audit-logs', filters] as const,
  },
  
  // Service Catalog
  catalog: {
    all: ['catalog'] as const,
    categories: () => [...queryKeys.catalog.all, 'categories'] as const,
    items: (filters?: CatalogFilters) => [...queryKeys.catalog.all, 'items', filters] as const,
    requests: (filters?: RequestFilters) => [...queryKeys.catalog.all, 'requests', filters] as const,
  },
  
  // Hardware Baskets
  hardware: {
    baskets: () => ['hardware', 'baskets'] as const,
    basket: (id: string) => ['hardware', 'baskets', id] as const,
    models: (basketId: string) => ['hardware', 'baskets', basketId, 'models'] as const,
  },
};
```

### Cache Configuration

```typescript
// Default stale times by data type
export const staleTimes = {
  // Fast-changing data (30 seconds)
  tickets: 30 * 1000,
  alerts: 30 * 1000,
  
  // Moderately changing (2 minutes)
  projects: 2 * 60 * 1000,
  activities: 2 * 60 * 1000,
  
  // Slow-changing (5 minutes)  
  kbArticles: 5 * 60 * 1000,
  users: 5 * 60 * 1000,
  roles: 5 * 60 * 1000,
  
  // Rarely changing (10 minutes)
  categories: 10 * 60 * 1000,
  permissions: 10 * 60 * 1000,
  workflows: 10 * 60 * 1000,
};

// Cache times (how long to keep in memory after inactive)
export const gcTimes = {
  default: 5 * 60 * 1000,  // 5 minutes
  heavy: 10 * 60 * 1000,   // 10 minutes for large datasets
};
```

### Hooks Structure

```
frontend/src/hooks/
├── queries/
│   ├── index.ts           # Re-exports all query hooks
│   ├── queryClient.ts     # QueryClient config
│   ├── queryKeys.ts       # Query key factory
│   ├── useTickets.ts      # Ticket queries & mutations
│   ├── useProjects.ts     # Project queries & mutations
│   ├── useKnowledgeBase.ts# KB queries & mutations
│   ├── useCMDB.ts         # CMDB/Asset queries & mutations
│   ├── useMonitoring.ts   # Monitoring queries & mutations
│   ├── useWorkflows.ts    # Workflow queries & mutations
│   ├── useAdmin.ts        # User/Role admin queries
│   ├── useCatalog.ts      # Service catalog queries
│   └── useHardware.ts     # Hardware basket queries
```

### Migration Priority

| Priority | View | Complexity | API Calls |
|----------|------|------------|-----------|
| 1 | DashboardView | Medium | tickets, alerts |
| 2 | ServiceDeskView | High | tickets, create |
| 3 | TicketDetailView | High | ticket, comments, attachments |
| 4 | ProjectsView | Medium | projects, create |
| 5 | MonitoringView | High | assets, alerts, metrics |
| 6 | KnowledgeBaseView | Medium | articles, categories |
| 7 | CMDBExplorerView | Medium | assets |
| 8 | UserManagementView | Medium | users, roles |
| 9 | WorkflowListView | Low | workflows |
| 10 | ServiceCatalogView | Medium | catalog items |

## Implementation Plan

### Phase 1: Setup (This session)
1. Install TanStack Query v5
2. Create QueryClient with global defaults
3. Wrap App with QueryClientProvider
4. Create query keys factory
5. Create base query hooks

### Phase 2: Core Views (This session)
1. Migrate DashboardView
2. Migrate ServiceDeskView
3. Migrate TicketDetailView

### Phase 3: Secondary Views (Future)
1. Projects, Monitoring, KB
2. CMDB, Admin, Workflows
3. Service Catalog, Hardware

## Benefits

1. **Instant Loading**: Data appears immediately from cache
2. **Background Sync**: Fresh data fetched silently
3. **Automatic Refetching**: On window focus, network reconnect
4. **Optimistic Updates**: UI updates before server confirms
5. **DevTools**: Visual debugging of cache state
6. **Reduced Boilerplate**: Less useState/useEffect code
7. **Type Safety**: Full TypeScript inference
