# TASK-006: Dashboard Real Statistics Integration

**Task ID:** TASK-006  
**Priority:** P1 - High  
**Estimate:** 3 hours  
**Dependencies:** TASK-002 + TASK-004 (Dashboard API must exist)  
**Phase:** 1 - Core ITSM

---

## Objective

Complete the Dashboard data integration by mapping backend analytics response to the StatCardData format and implementing real-time updates.

---

## Prerequisites

- TASK-002 must be complete (DashboardView API structure)
- TASK-004 must be complete (Analytics API enabled)

---

## Context

This task is a follow-up to TASK-002. Once the analytics API is available, this task ensures:
1. All stat cards show accurate data
2. Trend calculations are correct
3. Real-time refresh is configured
4. Edge cases are handled

### Files to Modify
- `frontend/src/views/DashboardView.tsx`
- `frontend/src/hooks/queries/useDashboard.ts`

---

## Required Implementation

### Step 1: Verify API Response Structure

Test the analytics endpoint and document the actual response:

```bash
curl http://localhost:3001/api/v1/analytics/dashboard \
  -H "Authorization: Bearer <token>"
```

### Step 2: Update Type Definitions

Ensure the frontend types match backend response:

```typescript
// frontend/src/hooks/queries/useDashboard.ts

export interface DashboardStats {
  total_open_tickets: number;
  tickets_by_status: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  sla_compliance: number;
  average_resolution_hours: number;
  tickets_trend: {
    period: string;
    current: number;
    previous: number;
  };
  recent_tickets: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
  active_alerts: number;
}
```

### Step 3: Implement Trend Calculation

```typescript
const calculateTrend = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } => {
  if (previous === 0) return { value: 0, direction: 'flat' };
  
  const percentChange = ((current - previous) / previous) * 100;
  
  return {
    value: Math.abs(Math.round(percentChange)),
    direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'flat',
  };
};
```

### Step 4: Map to StatCardData

```typescript
const mapStatsToCards = (stats: DashboardStats): StatCardData[] => {
  const trend = calculateTrend(
    stats.tickets_trend.current, 
    stats.tickets_trend.previous
  );

  return [
    {
      id: 'open-tickets',
      title: 'Open Tickets',
      value: stats.total_open_tickets,
      trend: {
        value: trend.value,
        direction: trend.direction === 'up' ? 'up' : 'down',
        label: `${trend.value}% from last ${stats.tickets_trend.period}`,
      },
      icon: <TicketDiagonalRegular />,
      color: 'primary',
      onClick: () => navigate('/app/service-desk?status=open'),
    },
    {
      id: 'p1-incidents',
      title: 'P1 Incidents',
      value: stats.tickets_by_priority['P1'] || 0,
      icon: <AlertUrgentRegular />,
      color: stats.tickets_by_priority['P1'] > 0 ? 'danger' : 'success',
      onClick: () => navigate('/app/service-desk?priority=P1'),
    },
    {
      id: 'sla-compliance',
      title: 'SLA Compliance',
      value: `${stats.sla_compliance.toFixed(1)}%`,
      icon: <ClockRegular />,
      color: stats.sla_compliance >= 95 ? 'success' : stats.sla_compliance >= 80 ? 'warning' : 'danger',
    },
    {
      id: 'avg-resolution',
      title: 'Avg Resolution',
      value: formatDuration(stats.average_resolution_hours),
      icon: <CheckmarkCircleRegular />,
      color: 'info',
    },
  ];
};

const formatDuration = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};
```

### Step 5: Add Auto-Refresh

```typescript
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000,        // Consider data stale after 30s
    refetchInterval: 60 * 1000,  // Auto-refresh every minute
    refetchOnWindowFocus: true,  // Refresh when user returns to tab
  });
}
```

### Step 6: Handle Edge Cases

```typescript
// Empty state when no data
if (!stats) {
  return (
    <PurpleGlassCard>
      <p>No ticket data available. Create your first ticket to see statistics.</p>
    </PurpleGlassCard>
  );
}

// Handle zero division
const slaCompliance = stats.resolved_count > 0 
  ? (stats.sla_met_count / stats.resolved_count) * 100 
  : 100;

// Handle missing fields
const p1Count = stats.tickets_by_priority?.['P1'] ?? 0;
```

---

## Acceptance Criteria

- [ ] All 4 stat cards display real numbers from API
- [ ] Trend percentages calculated correctly
- [ ] P1 Incidents card links to filtered ServiceDesk view
- [ ] SLA compliance color reflects actual percentage
- [ ] Auto-refresh every 60 seconds
- [ ] Refreshes when user focuses window
- [ ] Loading skeletons shown during fetch
- [ ] Error state handled gracefully
- [ ] Zero-data state handled

---

## Testing Instructions

1. Clear all tickets from database
2. View Dashboard - should show zeros or empty state
3. Create 5 tickets (mix of priorities)
4. View Dashboard - should show 5 open
5. Resolve 2 tickets
6. View Dashboard - should show 3 open, 40% trend if applicable
7. Wait 60 seconds - should auto-refresh

---

## Notes for Agent

- This task depends on TASK-002 and TASK-004 being complete
- The backend response field names may use snake_case
- Consider adding a manual refresh button for immediate updates
- Test with different data scenarios (no tickets, all resolved, all breached)
