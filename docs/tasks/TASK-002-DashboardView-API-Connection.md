# TASK-002: DashboardView API Connection

**Task ID:** TASK-002  
**Priority:** P0 - Critical  
**Estimate:** 4 hours  
**Dependencies:** None (Layer 0 - Can start immediately)  
**Phase:** 1 - Core ITSM

---

## Objective

Remove the `MOCK_STATS` array from `DashboardView.tsx` and connect to the real backend analytics API for displaying accurate dashboard statistics.

---

## Context

The DashboardView is the first screen users see after login. It displays key metrics like open tickets, SLA compliance, and recent activity. Currently, it uses hardcoded mock statistics that need to be replaced with real data from the backend.

### Files to Modify
- `frontend/src/views/DashboardView.tsx` (main changes)
- `frontend/src/hooks/queries/index.ts` (add new hook export if needed)

### Reference Files (Read-Only)
- `backend/src/api/analytics.rs` - Backend analytics endpoints
- `backend/src/services/analytics_service.rs` - Analytics service
- `frontend/src/hooks/queries/useTickets.ts` - Pattern for query hooks

---

## Current Implementation

```tsx
// frontend/src/views/DashboardView.tsx

// Line 109 - Mock statistics (REMOVE)
const MOCK_STATS: StatCardData[] = [
  {
    id: 'open-tickets',
    title: 'Open Tickets',
    value: 47,
    trend: { value: 12, direction: 'up' },
    // ...
  },
  // ... more mock stats
];

// Line 830 - Fallback returns mock data (MODIFY)
const getStats = useCallback((): StatCardData[] => {
  // This currently returns MOCK_STATS
  return MOCK_STATS;
}, []);
```

---

## Required Changes

### Step 1: Create Analytics Query Hook

Create or update `frontend/src/hooks/queries/useDashboard.ts`:

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../utils/apiClient';
import { queryKeys } from './queryKeys';

export interface DashboardStats {
  totalOpenTickets: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  slaCompliance: number;
  averageResolutionHours: number;
  ticketsTrend: {
    period: string;
    current: number;
    previous: number;
  };
  recentTickets: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
  activeAlerts: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.get('/api/v1/analytics/dashboard');
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds - dashboard should be relatively fresh
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/analytics/activity');
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
```

### Step 2: Update Query Keys

Add dashboard keys to `frontend/src/hooks/queries/queryKeys.ts`:

```tsx
export const queryKeys = {
  // ... existing keys
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
};
```

### Step 3: Remove Mock Data

Delete the `MOCK_STATS` constant from DashboardView.tsx (approximately lines 109-200).

### Step 4: Update DashboardView Component

Replace the `getStats` function with real data mapping:

```tsx
import { useDashboardStats } from '../hooks/queries/useDashboard';

// In component:
const { data: dashboardStats, isLoading, isError } = useDashboardStats();

// Map API response to StatCardData format
const stats: StatCardData[] = useMemo(() => {
  if (!dashboardStats) return [];
  
  const openCount = dashboardStats.totalOpenTickets;
  const trend = dashboardStats.ticketsTrend;
  const trendPercent = trend.previous > 0 
    ? Math.round(((trend.current - trend.previous) / trend.previous) * 100)
    : 0;

  return [
    {
      id: 'open-tickets',
      title: 'Open Tickets',
      value: openCount,
      trend: {
        value: Math.abs(trendPercent),
        direction: trendPercent >= 0 ? 'up' : 'down',
      },
      icon: <TicketDiagonalRegular />,
      color: 'primary',
    },
    {
      id: 'sla-compliance',
      title: 'SLA Compliance',
      value: `${dashboardStats.slaCompliance}%`,
      trend: {
        value: 2, // Would need historical comparison
        direction: dashboardStats.slaCompliance >= 95 ? 'up' : 'down',
      },
      icon: <ClockRegular />,
      color: dashboardStats.slaCompliance >= 95 ? 'success' : 'warning',
    },
    {
      id: 'avg-resolution',
      title: 'Avg Resolution',
      value: `${dashboardStats.averageResolutionHours}h`,
      icon: <CheckmarkCircleRegular />,
      color: 'info',
    },
    {
      id: 'active-alerts',
      title: 'Active Alerts',
      value: dashboardStats.activeAlerts,
      icon: <AlertRegular />,
      color: dashboardStats.activeAlerts > 5 ? 'danger' : 'warning',
    },
  ];
}, [dashboardStats]);
```

### Step 5: Handle Loading State

```tsx
if (isLoading) {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader title="Dashboard" icon={<BoardRegular />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <PurpleGlassCard key={i}>
            <PurpleGlassSkeleton width="60%" height="24px" />
            <PurpleGlassSkeleton width="40%" height="48px" style={{ marginTop: '8px' }} />
          </PurpleGlassCard>
        ))}
      </div>
    </div>
  );
}
```

### Step 6: Update Recent Tickets Section

Replace mock recent tickets with real data:

```tsx
const recentTickets = dashboardStats?.recentTickets || [];

// In JSX:
<PurpleGlassCard title="Recent Tickets">
  {recentTickets.length === 0 ? (
    <p>No recent tickets</p>
  ) : (
    <ul>
      {recentTickets.map(ticket => (
        <li key={ticket.id}>
          <Link to={`/app/tickets/${ticket.id}`}>
            {ticket.title}
          </Link>
          <span className={`priority-${ticket.priority.toLowerCase()}`}>
            {ticket.priority}
          </span>
        </li>
      ))}
    </ul>
  )}
</PurpleGlassCard>
```

---

## Backend API Requirements

The backend needs to provide these endpoints. Check if they exist, if not, they may need to be created/enabled:

### GET /api/v1/analytics/dashboard

Expected Response:
```json
{
  "totalOpenTickets": 47,
  "ticketsByStatus": {
    "NEW": 12,
    "IN_PROGRESS": 25,
    "ON_HOLD": 5,
    "PENDING_CUSTOMER": 5
  },
  "ticketsByPriority": {
    "P1": 3,
    "P2": 15,
    "P3": 20,
    "P4": 9
  },
  "slaCompliance": 94.5,
  "averageResolutionHours": 4.2,
  "ticketsTrend": {
    "period": "week",
    "current": 47,
    "previous": 42
  },
  "recentTickets": [
    {
      "id": "ticket:abc123",
      "title": "Email service down",
      "priority": "P1",
      "status": "IN_PROGRESS",
      "created_at": "2025-12-15T10:30:00Z"
    }
  ],
  "activeAlerts": 3
}
```

If the backend analytics API is not available, this task may be blocked until **TASK-004** (Enable Analytics API) is complete.

---

## Acceptance Criteria

- [ ] `MOCK_STATS` constant is completely removed
- [ ] Dashboard fetches real statistics from `/api/v1/analytics/dashboard`
- [ ] All 4 stat cards display real data
- [ ] Trend indicators reflect real historical comparison
- [ ] Recent tickets section shows actual recent tickets
- [ ] Loading skeletons shown during fetch
- [ ] Auto-refresh every 60 seconds (configurable)
- [ ] Error state handled gracefully
- [ ] No TypeScript errors
- [ ] No console errors

---

## Testing Instructions

1. Ensure backend is running with SurrealDB
2. Create a few test tickets via the API or ServiceDesk
3. Navigate to Dashboard
4. Verify:
   - Open ticket count matches database
   - Creating a new ticket updates the count (after refresh)
   - Recent tickets section shows actual tickets
   - SLA compliance reflects real calculations

---

## Notes for Agent

- If `/api/v1/analytics/dashboard` returns 404, check if routes are registered in `backend/src/api/mod.rs`
- The analytics service may need to aggregate data from multiple tables (tickets, alerts)
- Consider caching the dashboard stats in Redis if available
- The `staleTime` and `refetchInterval` can be adjusted based on requirements
- If backend is not ready, you can create a stub endpoint that returns hardcoded data temporarily
