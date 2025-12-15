# TASK-001: ServiceDeskView API Connection

**Task ID:** TASK-001  
**Priority:** P0 - Critical  
**Estimate:** 3 hours  
**Dependencies:** None (Layer 0 - Can start immediately)  
**Phase:** 1 - Core ITSM

---

## Objective

Remove the `MOCK_TICKETS` array from `ServiceDeskView.tsx` and connect to the real backend API using existing TanStack Query hooks.

---

## Context

The ServiceDeskView is the primary ticket management interface. Currently, it defines a large mock data array that is used when the API returns empty or fails. This mock data needs to be removed and replaced with proper API integration.

### Files to Modify
- `frontend/src/views/ServiceDeskView.tsx` (main changes)

### Reference Files (Read-Only)
- `frontend/src/hooks/queries/useTickets.ts` - TanStack Query hooks for tickets
- `frontend/src/utils/apiClient.ts` - API client with Ticket interface
- `backend/src/api/tickets.rs` - Backend API endpoints for reference

---

## Current Implementation

```tsx
// frontend/src/views/ServiceDeskView.tsx

// Line 86 - Large mock data array (REMOVE)
const MOCK_TICKETS: ExtendedTicket[] = [
  {
    id: 'INC-001',
    title: 'Production cluster NX-01 experiencing high CPU utilization',
    // ... ~200 lines of mock data
  },
  // ... more mock tickets
];

// Line 365 - Fallback logic (MODIFY)
const displayTickets = useMemo(() => {
  // Currently falls back to MOCK_TICKETS
  if (tickets.length === 0) {
    return MOCK_TICKETS;  // <-- REMOVE THIS FALLBACK
  }
  // ...filtering logic...
}, [tickets, ...]);
```

---

## Required Changes

### Step 1: Remove Mock Data
Delete the entire `MOCK_TICKETS` constant (approximately lines 86-290).

### Step 2: Update Data Fetching
The view already imports `useTickets` from TanStack Query hooks. Ensure it's being used correctly:

```tsx
import { useTickets, useCreateTicket } from '../hooks/queries';

// In component:
const { 
  data: ticketsData, 
  isLoading, 
  isError, 
  error 
} = useTickets({
  page: currentPage,
  page_size: pageSize,
  status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
  priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
  ticket_type: activeTab !== 'all' ? [mapTabToType(activeTab)] : undefined,
  search: searchTerm || undefined,
});
```

### Step 3: Map API Response to ExtendedTicket
Create a mapping function to transform backend `Ticket` to `ExtendedTicket`:

```tsx
const mapTicketToExtended = (ticket: Ticket): ExtendedTicket => ({
  id: ticket.id,
  title: ticket.title,
  description: ticket.description,
  type: ticket.type as ExtendedTicket['type'],
  ticket_type: getTicketTypeLabel(ticket.type),
  priority: ticket.priority as ExtendedTicket['priority'],
  status: ticket.status as ExtendedTicket['status'],
  assignee: ticket.assignee,
  created_by: ticket.created_by,
  created_at: ticket.created_at,
  updated_at: ticket.updated_at,
  slaStatus: calculateSlaStatus(ticket),
  slaTimeRemaining: formatSlaTime(ticket.resolution_due),
  linkedCi: ticket.related_asset ? {
    id: ticket.related_asset,
    name: 'Asset', // Would need to fetch asset name
    status: 'healthy'
  } : undefined,
});

const getTicketTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'INCIDENT': 'Incident',
    'PROBLEM': 'Problem',
    'CHANGE': 'Change',
    'SERVICE_REQUEST': 'Service Request',
  };
  return labels[type] || type;
};
```

### Step 4: Handle Loading State
Show skeleton/loading UI while fetching:

```tsx
if (isLoading) {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader title="Service Desk" icon={<TicketDiagonalRegular />} />
      <PurpleGlassSkeleton lines={10} />
    </div>
  );
}
```

### Step 5: Handle Empty State
Show proper empty state when no tickets exist:

```tsx
if (!isLoading && displayTickets.length === 0) {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader title="Service Desk" icon={<TicketDiagonalRegular />} />
      {/* Filters and tabs */}
      <PurpleGlassEmptyState
        icon={<TicketDiagonalRegular />}
        title="No tickets found"
        description={hasFilters 
          ? "No tickets match your current filters. Try adjusting your search criteria."
          : "No tickets have been created yet. Create your first ticket to get started."}
        action={
          <EnhancedPurpleGlassButton 
            variant="primary" 
            icon={<AddRegular />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Ticket
          </EnhancedPurpleGlassButton>
        }
      />
    </div>
  );
}
```

### Step 6: Handle Error State
Show error message if API fails:

```tsx
if (isError) {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader title="Service Desk" icon={<TicketDiagonalRegular />} />
      <PurpleGlassCard>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ErrorCircleRegular style={{ fontSize: 48, color: 'var(--error)' }} />
          <h3>Failed to load tickets</h3>
          <p>{error?.message || 'An unexpected error occurred'}</p>
          <EnhancedPurpleGlassButton onClick={() => refetch()}>
            Retry
          </EnhancedPurpleGlassButton>
        </div>
      </PurpleGlassCard>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] `MOCK_TICKETS` constant is completely removed from the file
- [ ] Tickets are loaded from `GET /api/v1/tickets` via TanStack Query
- [ ] Loading skeleton is shown during initial fetch
- [ ] Empty state is shown when no tickets exist (with create CTA)
- [ ] Error state is shown if API fails (with retry button)
- [ ] Status filter works with real API (`?status=NEW,IN_PROGRESS`)
- [ ] Priority filter works with real API (`?priority=P1,P2`)
- [ ] Ticket type tabs filter via API (`?ticket_type=INCIDENT`)
- [ ] Search works with real API (`?search=query`)
- [ ] Pagination works with real total count from API
- [ ] No TypeScript compilation errors
- [ ] No console errors in browser
- [ ] No ESLint warnings

---

## Testing Instructions

1. Start backend: `cd backend && cargo run`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `/app/service-desk`
4. Verify:
   - With no tickets in DB: Empty state appears
   - After creating ticket: Appears in list immediately
   - Filters work correctly
   - Search returns matching tickets
   - Pagination shows correct page count

---

## Notes for Agent

- The TanStack Query hooks already exist - you're just wiring them up correctly
- The `ExtendedTicket` interface has more fields than the API returns - map what's available, leave others optional
- SLA calculations should use the `sla_breach_at` and `resolution_due` fields from API
- Consider using `react-query-devtools` to debug query state
- If backend returns 500, check if SurrealDB is running on port 8001
