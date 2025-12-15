# Archer ITSM - Phase 1 Completion Plan

**Document Purpose:** Complete task breakdown for cloud coding agents  
**Created:** December 15, 2025  
**Target:** Complete Phase 1 (Core ITSM)

---

## Executive Summary

Phase 1 backend is **~90% complete**. The remaining work is primarily **frontend integration** to connect existing UIs to real backend data and **UI polish** for consistency.

### Current State

| Component | Backend | Frontend | Gap |
|-----------|---------|----------|-----|
| **Tickets** | ✅ Full CRUD + Comments + Attachments | 🟡 Uses MOCK_TICKETS | Connect to API |
| **SLA Engine** | ✅ SLA Service complete | ❌ No SLAManagementView | Build UI |
| **Knowledge Base** | ✅ Complete | ✅ Connected to API | Minor polish |
| **CMDB** | ✅ Complete | ✅ Connected to API | Minor polish |
| **Dashboard** | N/A | 🟡 Uses MOCK_STATS | Connect to API |

---

## Task Dependency Graph

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1 TASK DEPENDENCIES                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 0 (Independent - Can run in parallel)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   TASK 1    │ │   TASK 2    │ │   TASK 3    │ │   TASK 4    │            │
│  │ ServiceDesk │ │  Dashboard  │ │ SLA Mgmt    │ │ Analytics   │            │
│  │ API Connect │ │ API Connect │ │ View (NEW)  │ │ API Enable  │            │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │
│         │               │               │               │                    │
│         ▼               ▼               │               │                    │
│  LAYER 1 (Depends on Layer 0)           │               │                    │
│  ┌─────────────┐ ┌─────────────┐        │               │                    │
│  │   TASK 5    │ │   TASK 6    │        │               │                    │
│  │ TicketDetail│ │ Dashboard   │        │               │                    │
│  │ Comments UI │ │ Real Stats  │        │               │                    │
│  └──────┬──────┘ └─────────────┘        │               │                    │
│         │                               │               │                    │
│         ▼                               ▼               │                    │
│  LAYER 2 (Depends on Layer 1)                           │                    │
│  ┌─────────────┐ ┌─────────────┐                        │                    │
│  │   TASK 7    │ │   TASK 8    │                        │                    │
│  │ Ticket-KB   │ │ SLA Badges  │◄───────────────────────┘                    │
│  │ Integration │ │ Live Data   │                                             │
│  └─────────────┘ └─────────────┘                                             │
│                                                                              │
│  LAYER 3 (Final Polish - After all above)                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                             │
│  │   TASK 9    │ │   TASK 10   │ │   TASK 11   │                             │
│  │ Component   │ │ Remove All  │ │ E2E Tests   │                             │
│  │ Migration   │ │ Mock Data   │ │ Phase 1     │                             │
│  └─────────────┘ └─────────────┘ └─────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Task Specifications

### LAYER 0: Independent Tasks (Can Run in Parallel)

---

### TASK 1: ServiceDeskView API Connection
**Priority:** P0 - Critical  
**Estimate:** 3 hours  
**Dependencies:** None  
**Assignable To:** Any frontend agent

#### Objective
Remove `MOCK_TICKETS` array from ServiceDeskView and connect to real backend API using existing TanStack Query hooks.

#### Current State
- File: `frontend/src/views/ServiceDeskView.tsx`
- Line 86: `const MOCK_TICKETS: ExtendedTicket[] = [...]` (large mock array)
- Line 365: Falls back to `MOCK_TICKETS` when API returns empty

#### Required Changes
1. Remove the `MOCK_TICKETS` constant entirely
2. Use existing `useTickets` hook from `frontend/src/hooks/queries/useTickets.ts`
3. Map API response to `ExtendedTicket` interface
4. Handle loading/error states properly
5. Ensure empty state shows when no real tickets exist

#### Acceptance Criteria
- [ ] No mock data in ServiceDeskView.tsx
- [ ] Tickets loaded from `GET /api/v1/tickets`
- [ ] Loading skeleton shown during fetch
- [ ] Empty state shown when no tickets
- [ ] Filters work with real API parameters
- [ ] Pagination works with real total count
- [ ] Search works with real API
- [ ] No TypeScript errors
- [ ] No console errors

#### Reference Files
- `frontend/src/hooks/queries/useTickets.ts` - Query hooks to use
- `frontend/src/utils/apiClient.ts` - API client with Ticket type
- `backend/src/api/tickets.rs` - Backend API endpoints

---

### TASK 2: DashboardView API Connection
**Priority:** P0 - Critical  
**Estimate:** 4 hours  
**Dependencies:** None  
**Assignable To:** Any frontend agent

#### Objective
Remove `MOCK_STATS` from DashboardView and fetch real statistics from backend analytics API.

#### Current State
- File: `frontend/src/views/DashboardView.tsx`
- Line 109: `const MOCK_STATS: StatCardData[] = [...]`
- Line 830: Returns `MOCK_STATS` as fallback
- Uses TanStack Query but falls back to mock data

#### Required Changes
1. Enable analytics API in backend (currently commented out in `backend/src/api/mod.rs`)
2. Create analytics endpoint: `GET /api/v1/analytics/dashboard`
3. Return real stats: ticket counts by status, SLA metrics, recent activity
4. Update DashboardView to use real API response
5. Remove MOCK_STATS constant

#### Backend Implementation
File: `backend/src/api/analytics.rs`
```rust
// Create endpoint that returns:
// - Total tickets by status
// - SLA compliance percentage
// - Recent tickets (last 24h)
// - Open incidents count
// - Average resolution time
```

#### Acceptance Criteria
- [ ] Backend analytics endpoint active
- [ ] Real ticket statistics displayed
- [ ] SLA metrics reflect actual data
- [ ] Recent activity shows real tickets
- [ ] Graceful degradation if no data
- [ ] No mock data remaining

#### Reference Files
- `backend/src/api/analytics.rs` - Uncomment and fix
- `backend/src/services/analytics_service.rs` - Service layer
- `frontend/src/hooks/queries/useAdmin.ts` - May need analytics query

---

### TASK 3: SLA Management View (NEW)
**Priority:** P1 - High  
**Estimate:** 6 hours  
**Dependencies:** None  
**Assignable To:** Any frontend agent

#### Objective
Create new `SLAManagementView.tsx` to allow admins to create and manage SLA policies.

#### Backend Already Exists
- Model: `backend/src/models/ticket.rs` → `SlaPolicy`, `BusinessHours`, `EscalationRule`
- Service: `backend/src/services/sla_service.rs` → Full CRUD operations
- API: Need to expose via routes (may need to add)

#### Required Implementation

1. **Create View File:** `frontend/src/views/SLAManagementView.tsx`

2. **Features:**
   - List all SLA policies in table/card format
   - Create new SLA policy form:
     - Name, description
     - Response time target (minutes)
     - Resolution time target (minutes)
     - Applies to priorities (checkboxes: P1, P2, P3, P4)
     - Applies to ticket types (checkboxes: Incident, Problem, etc.)
     - Active/inactive toggle
   - Edit existing policy
   - Delete policy with confirmation
   - Escalation rules section:
     - Trigger at % of SLA time
     - Notify users/groups
     - Optional reassignment

3. **API Integration:**
   - `GET /api/v1/sla/policies` - List policies
   - `POST /api/v1/sla/policies` - Create policy
   - `PUT /api/v1/sla/policies/:id` - Update policy
   - `DELETE /api/v1/sla/policies/:id` - Delete policy

4. **Use Purple Glass components:**
   - `PurpleGlassCard` for policy cards
   - `EnhancedPurpleGlassButton` for all buttons
   - `PurpleGlassInput` for form fields
   - `PurpleGlassDropdown` for selects
   - `PageHeader` with icon

#### Acceptance Criteria
- [ ] View accessible at `/app/sla-management`
- [ ] Can list all SLA policies
- [ ] Can create new SLA policy
- [ ] Can edit existing policy
- [ ] Can delete policy with confirmation
- [ ] Escalation rules configurable
- [ ] Uses design system components
- [ ] Responsive layout (1400px max-width)

#### Reference Files
- `frontend/src/views/UserManagementView.tsx` - Similar admin view pattern
- `frontend/src/views/RoleManagementView.tsx` - Similar admin view pattern
- `backend/src/services/sla_service.rs` - Backend service to call

---

### TASK 4: Enable Analytics API
**Priority:** P1 - High  
**Estimate:** 2 hours  
**Dependencies:** None  
**Assignable To:** Any backend agent

#### Objective
Uncomment and fix the analytics API routes in the backend to enable dashboard statistics.

#### Current State
- File: `backend/src/api/analytics.rs` exists but may be commented out
- File: `backend/src/services/analytics_service.rs` exists
- Routes may not be registered in `backend/src/api/mod.rs`

#### Required Changes
1. Review `analytics.rs` for compilation errors
2. Fix any type mismatches or missing imports
3. Register routes in `mod.rs`
4. Test endpoints return valid JSON

#### Acceptance Criteria
- [ ] `GET /api/v1/analytics/dashboard` returns stats
- [ ] No compilation errors
- [ ] Response includes ticket counts
- [ ] Response includes SLA metrics

---

### LAYER 1: Dependent Tasks

---

### TASK 5: TicketDetailView Comments Integration
**Priority:** P1 - High  
**Estimate:** 4 hours  
**Dependencies:** TASK 1 (ServiceDeskView must use real tickets)  
**Assignable To:** Any frontend agent

#### Objective
Connect TicketDetailView comments section to real backend API.

#### Current State
- File: `frontend/src/views/TicketDetailView.tsx`
- Uses mock `mockTicketDetail` object
- Backend API exists: `GET/POST/DELETE /api/v1/tickets/:id/comments`

#### Required Changes
1. Fetch ticket with comments from API
2. Post new comments to API
3. Delete comments via API
4. Handle internal vs public comments
5. Show loading states
6. Update apiClient.ts if needed for comment types

#### Acceptance Criteria
- [ ] Comments loaded from API on ticket view
- [ ] Can add new comment
- [ ] Can delete own comments
- [ ] Internal/public toggle works
- [ ] Real-time feel (optimistic updates or invalidation)

#### Reference Files
- `backend/src/api/tickets.rs` - Comment endpoints
- `frontend/src/utils/apiClient.ts` - TicketComment type

---

### TASK 6: Dashboard Real Statistics
**Priority:** P1 - High  
**Estimate:** 3 hours  
**Dependencies:** TASK 2 + TASK 4 (Analytics API must be enabled)  
**Assignable To:** Any frontend agent

#### Objective
Replace the `getStats()` function in DashboardView with real API data.

#### Required Changes
1. Create `useDashboardStats` query hook
2. Map API response to `StatCardData[]`
3. Calculate trends from historical data
4. Show real recent tickets
5. Show real alerts from monitoring

#### Acceptance Criteria
- [ ] All stat cards show real numbers
- [ ] Trend indicators accurate
- [ ] Recent tickets list is real
- [ ] Alerts section populated

---

### LAYER 2: Integration Tasks

---

### TASK 7: Ticket-KB Integration
**Priority:** P2 - Medium  
**Estimate:** 5 hours  
**Dependencies:** TASK 5 (TicketDetailView must be connected)  
**Assignable To:** Any frontend agent

#### Objective
Add KB article suggestions to TicketDetailView based on ticket content.

#### Required Changes
1. Add "Suggested Articles" panel to TicketDetailView
2. Call KB search API with ticket title/description
3. Display matching articles
4. Allow linking article to ticket
5. Show linked articles on ticket

#### Acceptance Criteria
- [ ] KB suggestions appear on ticket view
- [ ] Can link article to ticket
- [ ] Linked articles display on ticket
- [ ] Helpful for agents resolving tickets

---

### TASK 8: SLA Badges Live Data
**Priority:** P2 - Medium  
**Estimate:** 3 hours  
**Dependencies:** TASK 3 (SLA Management exists)  
**Assignable To:** Any frontend agent

#### Objective
Make SLA indicators in ServiceDeskView and TicketDetailView show real calculated times.

#### Required Changes
1. Backend: Add SLA status to ticket list response
2. Frontend: Display real `slaTimeRemaining` from API
3. Calculate breach status dynamically
4. Color-code based on real SLA policy

#### Acceptance Criteria
- [ ] SLA badge shows real time remaining
- [ ] Breached tickets show red indicator
- [ ] At-risk tickets show yellow indicator
- [ ] Clicking SLA shows policy details

---

### LAYER 3: Final Polish

---

### TASK 9: Component Migration Sprint
**Priority:** P2 - Medium  
**Estimate:** 8 hours (split across multiple views)  
**Dependencies:** TASKS 1-8 complete  
**Assignable To:** Multiple frontend agents (can split)

#### Objective
Migrate all Phase 1 views to use `EnhancedPurpleGlassButton` and `EnhancedPurpleGlassSearchBar`.

#### Views to Migrate
| View | Native Buttons | Status |
|------|----------------|--------|
| DashboardView | 4 | Pending |
| ServiceDeskView | Several | Pending |
| TicketDetailView | Multiple | Pending |
| AssetDetailView | 5 | Pending |
| CIDetailView | 2+ | Pending |
| ApprovalInbox | 2+ | Pending |
| DataUploadView | 3+ | Pending |
| DesignDocsView | 6+ | Pending |

#### Per-View Changes
1. Import `EnhancedPurpleGlassButton` from `@/components/ui`
2. Replace `<button>` with `<EnhancedPurpleGlassButton>`
3. Set appropriate `variant` (primary, secondary, danger, ghost)
4. Add `aria-label` for icon-only buttons
5. Remove inline style overrides

#### Acceptance Criteria
- [ ] No native `<button>` elements in migrated views
- [ ] All buttons have correct variants
- [ ] Accessibility labels present
- [ ] Consistent look across views

---

### TASK 10: Remove All Mock Data
**Priority:** P3 - Low  
**Estimate:** 2 hours  
**Dependencies:** TASKS 1-8 complete  
**Assignable To:** Any agent

#### Objective
Final sweep to remove any remaining mock data constants.

#### Files to Check
- All views in `frontend/src/views/`
- Search for: `MOCK_`, `getMock`, `mockData`, `demoData`

#### Acceptance Criteria
- [ ] `grep "MOCK_" frontend/src/` returns 0 results
- [ ] All views fetch from real APIs

---

### TASK 11: Phase 1 E2E Tests
**Priority:** P3 - Low  
**Estimate:** 6 hours  
**Dependencies:** All Phase 1 tasks complete  
**Assignable To:** QA-focused agent

#### Objective
Create Playwright E2E tests for Phase 1 features.

#### Test Scenarios
1. **Ticket Lifecycle:**
   - Create ticket → Assign → Add comment → Resolve → Close
2. **SLA Management:**
   - Create SLA policy → Assign to ticket → Verify SLA calculation
3. **KB Integration:**
   - Create KB article → Search → Link to ticket
4. **Dashboard:**
   - Verify stats match database counts

#### Acceptance Criteria
- [ ] All core flows have E2E tests
- [ ] Tests pass in CI
- [ ] Coverage report generated

---

## Task Assignment Guide for Cloud Agents

### Agent Capability Requirements

| Task | Skills Required | Estimated Complexity |
|------|-----------------|---------------------|
| TASK 1 | React, TanStack Query | Medium |
| TASK 2 | React, API integration | Medium |
| TASK 3 | React, Form handling | High |
| TASK 4 | Rust, Axum | Low-Medium |
| TASK 5 | React, API integration | Medium |
| TASK 6 | React, Data transformation | Medium |
| TASK 7 | React, API integration | Medium |
| TASK 8 | React, UI polish | Low |
| TASK 9 | React, Component migration | Low (repetitive) |
| TASK 10 | Code cleanup | Low |
| TASK 11 | Playwright, E2E testing | High |

### Optimal Parallelization

**Wave 1 (Start immediately):**
- TASK 1 + TASK 2 + TASK 3 + TASK 4 (all independent)

**Wave 2 (After Wave 1):**
- TASK 5 + TASK 6 (depend on Wave 1)

**Wave 3 (After Wave 2):**
- TASK 7 + TASK 8 (depend on Wave 2)

**Wave 4 (Final):**
- TASK 9 + TASK 10 + TASK 11 (polish and testing)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mock data eliminated | 100% | No MOCK_ constants |
| API coverage | 100% | All CRUD operations work |
| Component consistency | 100% | All buttons use EnhancedPurpleGlassButton |
| Test coverage | >70% | Jest + Playwright |
| Build success | Pass | No TypeScript/ESLint errors |

---

## Appendix: API Endpoints Required

### Tickets
```
GET    /api/v1/tickets              ✅ Exists
POST   /api/v1/tickets              ✅ Exists
GET    /api/v1/tickets/:id          ✅ Exists
PUT    /api/v1/tickets/:id          ✅ Exists
DELETE /api/v1/tickets/:id          ✅ Exists
GET    /api/v1/tickets/:id/comments ✅ Exists
POST   /api/v1/tickets/:id/comments ✅ Exists
DELETE /api/v1/tickets/:id/comments/:cid ✅ Exists
```

### SLA
```
GET    /api/v1/sla/policies         🔜 Need to verify
POST   /api/v1/sla/policies         🔜 Need to verify
PUT    /api/v1/sla/policies/:id     🔜 Need to verify
DELETE /api/v1/sla/policies/:id     🔜 Need to verify
```

### Analytics
```
GET    /api/v1/analytics/dashboard  🔜 Need to enable
GET    /api/v1/analytics/tickets    🔜 Need to enable
```

---

*Document created December 15, 2025 for Phase 1 completion sprint.*
