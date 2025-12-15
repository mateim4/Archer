# TASK-010: Remove All Mock Data

**Task ID:** TASK-010  
**Priority:** P1 - High  
**Estimate:** 4 hours  
**Dependencies:** ALL TASKS 1-8 must be complete  
**Phase:** 1 - Core ITSM (Finalization)

---

## Objective

Remove all mock data, fallback arrays, and test fixtures from the production codebase. This is the final cleanup task to ensure Phase 1 views operate entirely on real backend data.

---

## Context

Throughout development, mock data was added to enable frontend work before backend APIs were ready. Now that APIs exist, this mock data creates:

1. **False positives** - Views appear to work but show fake data
2. **Confusion** - Developers unsure which data is real
3. **Technical debt** - Dead code that should be removed
4. **Security risk** - Mock credentials or test data in production

---

## Locations to Clean

### Priority 1: View Files

| File | Mock Data | Line Reference |
|------|-----------|----------------|
| `ServiceDeskView.tsx` | `MOCK_TICKETS` array | ~Line 86 |
| `DashboardView.tsx` | `MOCK_STATS` object | ~Line 109 |
| `TicketDetailView.tsx` | `mockTicketDetail` | Throughout |
| `ProjectDetailView.tsx` | Mock project data | Check imports |

### Priority 2: Hook Files

| File | Issue | Action |
|------|-------|--------|
| `useTickets.ts` | May have fallback | Remove fallback to mock |
| `useAnalytics.ts` | May have fallback | Remove fallback to mock |
| `useDashboard.ts` | May have fallback | Remove fallback to mock |

### Priority 3: API Client Files

| File | Issue | Action |
|------|-------|--------|
| `apiClient.ts` | Mock response interceptor? | Remove if present |
| `ticketApi.ts` | Hardcoded responses? | Verify all use real endpoints |

### Priority 4: Test/Demo Files (KEEP)

These files intentionally contain mock data for testing:

| File | Status |
|------|--------|
| `ButtonSearchBarDemoView.tsx` | KEEP - Demo component |
| `*.test.tsx` | KEEP - Unit tests need mocks |
| `*.spec.ts` | KEEP - Test specs |
| `src/__mocks__/` | KEEP - Jest mocks |

---

## Removal Process

### Step 1: Identify All Mock Data

```bash
# Search for common mock patterns
grep -rn "MOCK_" frontend/src/views/ --include="*.tsx"
grep -rn "mockTicket" frontend/src/views/ --include="*.tsx"
grep -rn "mockData" frontend/src/views/ --include="*.tsx"
grep -rn "dummyData" frontend/src/ --include="*.tsx"
grep -rn "testData" frontend/src/ --include="*.tsx"

# Search for fallback patterns
grep -rn "|| \[\]" frontend/src/hooks/ --include="*.ts"
grep -rn "?? \[\]" frontend/src/hooks/ --include="*.ts"
```

### Step 2: Remove Mock Constants

```typescript
// BEFORE - ServiceDeskView.tsx
const MOCK_TICKETS = [
  { id: 'TKT-001', title: 'Mock Ticket 1', ... },
  { id: 'TKT-002', title: 'Mock Ticket 2', ... },
  // ... 200 lines of mock data
];

// AFTER - ServiceDeskView.tsx
// (Delete the entire MOCK_TICKETS constant)
```

### Step 3: Remove Fallback Logic

```typescript
// BEFORE
const tickets = data?.tickets || MOCK_TICKETS;

// AFTER
const tickets = data?.tickets || [];
// Or better yet:
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorDisplay error={error} />;
const tickets = data?.tickets;
```

### Step 4: Handle Empty States Properly

When mock data is removed, empty states become visible. Ensure proper UI:

```typescript
// BEFORE (hidden by mock data)
{tickets.map(ticket => <TicketRow key={ticket.id} {...ticket} />)}

// AFTER (proper empty state)
{tickets.length === 0 ? (
  <EmptyState
    icon={<TicketRegular />}
    title="No tickets found"
    description="Create your first ticket to get started"
    action={
      <EnhancedPurpleGlassButton variant="primary" onClick={openCreateModal}>
        Create Ticket
      </EnhancedPurpleGlassButton>
    }
  />
) : (
  tickets.map(ticket => <TicketRow key={ticket.id} {...ticket} />)
)}
```

### Step 5: Verify API Connections

For each view, confirm the data flow:

```
Component → Hook → API Client → Backend Endpoint
    ↓
  Renders actual data from SurrealDB
```

---

## Checklist by View

### ServiceDeskView
- [ ] Delete `MOCK_TICKETS` constant
- [ ] Remove fallback `|| MOCK_TICKETS`
- [ ] Verify `useTickets()` hook fetches real data
- [ ] Add proper empty state UI
- [ ] Test with empty database
- [ ] Test with populated database

### DashboardView
- [ ] Delete `MOCK_STATS` constant
- [ ] Remove fallback `|| MOCK_STATS`
- [ ] Verify `useAnalytics()` hook fetches real data
- [ ] Add proper empty/zero state UI
- [ ] Test dashboard displays zeros correctly

### TicketDetailView
- [ ] Delete `mockTicketDetail` constant
- [ ] Remove any hardcoded ticket fields
- [ ] Verify `useTicket(id)` fetches real data
- [ ] Handle "ticket not found" case
- [ ] Test with real ticket ID

### Other Views (check each)
- [ ] AssetDetailView - No mock data
- [ ] KnowledgeBaseView - Already clean (verified)
- [ ] CMDBExplorerView - Already clean (verified)
- [ ] ProjectDetailView - Check and clean

---

## Verification Commands

```bash
# After cleanup, these should return no results (except test files)
grep -rn "MOCK_" frontend/src/views/ --include="*.tsx" | grep -v ".test."
grep -rn "mockTicket" frontend/src/views/ --include="*.tsx" | grep -v ".test."

# Build should succeed
npm run build

# Type check should pass
npm run type-check

# All views should load without console errors
npm run dev
```

---

## Acceptance Criteria

- [ ] No `MOCK_*` constants in view files (except demos/tests)
- [ ] No `mock*` variables in view files (except demos/tests)
- [ ] No fallbacks to mock data in hooks
- [ ] All views show real backend data
- [ ] Empty states display properly when no data
- [ ] No console errors about undefined data
- [ ] TypeScript compiles without errors
- [ ] Build completes successfully
- [ ] Application loads and navigates without crashes

---

## Rollback Plan

If issues are discovered after mock removal:

1. Check backend is running: `curl http://localhost:3001/health`
2. Check database has data: SurrealDB query `SELECT * FROM tickets LIMIT 5`
3. If backend issue, fix backend first
4. Do NOT revert to mock data - fix the real issue

---

## Notes for Agent

1. **Backup first** - Git commit before starting this task
2. **One view at a time** - Don't remove all mocks at once
3. **Test after each removal** - Verify view still renders
4. **Empty states are expected** - If database is empty, that's correct
5. **Don't touch test files** - Mock data in tests is intentional
6. **Watch for TypeScript errors** - Removing mock data may reveal type issues where real API returns different shapes
7. **This is the "truth test"** - If something breaks, the earlier tasks weren't complete
