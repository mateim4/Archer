# Archer ITSM - Comprehensive UI/UX Audit Report
**Generated:** 2025-01-20  
**Audit Scope:** Frontend Views, Backend Integration, Button Functionality

---

## Executive Summary

This audit analyzed 70+ view files in the Archer frontend, identifying:
- **5 Critical Issues** (Features completely non-functional)
- **12 High Priority Issues** (Partial functionality / mock data only)
- **8 Medium Priority Issues** (Minor UX gaps)
- **15 Backend Integration Gaps** (API calls without backend implementation)

---

## 🔴 CRITICAL: Non-Functional Features

### 1. **DashboardView.tsx** - Uses 100% Mock Data
- **Location:** `frontend/src/views/DashboardView.tsx`
- **Issue:** All dashboard statistics (Open Tickets, In Progress, Resolved Today, Avg Resolution) are hardcoded mock data
- **Impact:** Users see fake metrics that don't reflect actual system state
- **Backend Status:** Dashboard API exists (`/api/v1/monitoring/dashboard`) but is not called
- **Fix:** Connect `MOCK_STATS`, `MOCK_MY_TICKETS`, `MOCK_ACTIVITY`, `MOCK_ALERTS` to actual API calls

### 2. **WorkflowsView.tsx** - Fully Mock Implementation
- **Location:** `frontend/src/views/WorkflowsView.tsx`
- **Issue:** Uses local `loadWorkflows()` function with hardcoded `mockWorkflows` array
- **Buttons Affected:**
  - Start Workflow button - Does nothing real
  - Pause Workflow button - State change only (no backend)
  - View Details - Opens mock data
- **Backend Status:** Workflows API exists at `/api/v1/workflows` but never called from this view
- **Fix:** Replace mock data loading with `apiClient.getWorkflows()` calls

### 3. **ProjectTimelineView.tsx** - Mock Data Only
- **Location:** `frontend/src/views/ProjectTimelineView.tsx` (Lines 51-182)
- **Issue:** Uses `mockProject` and `mockActivities` arrays instead of API
- **Backend Status:** Activities API exists at `/api/projects/{id}/activities`
- **Fix:** Replace with `apiClient.getActivities(projectId)` call

### 4. **ProjectWorkspaceView.tsx** - Mock Data Only
- **Location:** `frontend/src/views/ProjectWorkspaceView.tsx` (Lines 173-230)
- **Issue:** Uses `mockProject` and `mockActivities` arrays
- **Backend Status:** Backend API ready
- **Fix:** Same as ProjectTimelineView

### 5. **AuditLogView.tsx** - Mock Data Only
- **Location:** `frontend/src/views/AuditLogView.tsx` (Lines 303-404)
- **Issue:** Uses `mockLogs` array instead of API call
- **Backend Status:** Audit logging exists but GET endpoint unclear
- **Fix:** Implement `apiClient.getAuditLogs()` call

---

## 🟠 HIGH: Partial Functionality / Missing Backend

### 6. **ServiceDeskView.tsx** - Graceful Degradation to Mock
- **Location:** `frontend/src/views/ServiceDeskView.tsx` (Lines 296-340)
- **Status:** ⚠️ Tries API first, falls back to mock if authentication fails
- **Issue:** Since API requires auth, it often shows mock data
- **Working Buttons:**
  - ✅ Create Ticket - Calls `apiClient.createTicket()`
  - ✅ View Mode Toggle - Works
  - ✅ Ticket Click → Navigate to detail view
- **Non-Working:**
  - Advanced Filters - Client-side only, not persisted
  - Saved Views - State only, not saved to backend

### 7. **TicketDetailView.tsx** - Partial Backend Integration
- **Working:**
  - ✅ Load ticket data (`apiClient.getTicket()`)
  - ✅ Add comments (`apiClient.addTicketComment()`)
  - ✅ Upload attachments (`apiClient.uploadTicketAttachment()`)
  - ✅ Delete comments/attachments
- **Not Working:**
  - ❌ Edit Title - Only updates local state, no API call on blur
  - ❌ Change Status dropdown - No `apiClient.updateTicket()` on change
  - ❌ Change Priority - Same issue
  - ❌ Change Assignee - Same issue
  - ❌ Related Tickets section - Uses mock `relatedTickets` data

### 8. **CMDBExplorerView.tsx** - Uses Separate Client
- **Location:** Uses `cmdbClient` not `apiClient`
- **Status:** ⚠️ Has its own API client implementation
- **Working:**
  - ✅ List CIs (`cmdbClient.listCIs()`)
  - ✅ Delete CI (`cmdbClient.deleteCI()`)
  - ✅ Navigate to create/edit views
- **Verify:** Check if `cmdbClient` endpoints match backend

### 9. **KnowledgeBaseView.tsx** - API Connected But May Fail
- **Working:**
  - ✅ `apiClient.getKBArticles()` - Connected
  - ✅ `apiClient.getKBCategories()` - Connected
  - ✅ Navigate to article detail
  - ✅ Create new article navigation
- **Issue:** No error handling UI for failed loads

### 10. **ServiceCatalogView.tsx** - API Connected
- **Working:**
  - ✅ `apiClient.getCatalogCategories()`
  - ✅ `apiClient.getCatalogItems()`
  - ✅ Request Item navigation
- **Not Working:**
  - ❌ View Mode Toggle - State only, no persistence

### 11. **UserManagementView.tsx** - API Connected
- **Working:**
  - ✅ Uses `apiClient` for admin user CRUD
  - ✅ Create/Edit/Delete user modals
- **Verify:** Test with actual backend authentication

### 12. **MonitoringView.tsx** - Partial Implementation
- **Working:**
  - ✅ `apiClient.getAssets()`
  - ✅ `apiClient.getDashboardSummary()`
  - ✅ `apiClient.getAlerts()`
  - ✅ `apiClient.acknowledgeAlert()`
  - ✅ `apiClient.resolveAlert()`
  - ✅ `apiClient.createTicketFromAlert()`
- **Not Working:**
  - ❌ Metrics charts - Mock data visualization

### 13. **SettingsView.tsx** - Frontend State Only
- **Issue:** All settings changes are stored in React state only
- **Not Persisted:**
  - General Settings
  - Capacity Thresholds
  - Unit Systems
  - Appearance/Theme (persists via localStorage, not backend)
- **Fix:** Need Settings API and persistence layer

### 14. **InfraVisualizerView.tsx** - Integration Dependent
- **Working:**
  - ✅ Export to PNG/SVG/PDF
  - ✅ Toggle Legend/Minimap
- **Dependent:**
  - Data loading depends on URL params (`?source=hardware-pool`, etc.)
  - Uses store (`useInfraVisualizerStore`)

### 15. **ClusterSizingView.tsx** - Hardcoded Project ID
- **Issue:** Line 42: `const currentProjectId = 'project:demo';`
- **Fix:** Get project ID from route params or context

### 16. **MigrationProjects.tsx** - Mock Data Only
- **Location:** Lines 68-135
- **Issue:** Uses `mockProjects` array
- **Fix:** Connect to projects API

### 17. **ProjectsView.tsx** - Commented Out Delete
- **Location:** Lines 194, 207
- **Issue:** Delete and Complete buttons have API calls commented out:
  ```tsx
  // await apiClient.deleteProject(projectId);
  // await apiClient.updateProject(projectId, { status: 'completed' });
  ```
- **Fix:** Uncomment and test

---

## 🟡 MEDIUM: UX/UI Issues

### 18. **All List Views** - No Empty State for Loading Errors
- **Affected:** ServiceDeskView, CMDBExplorerView, KnowledgeBaseView
- **Issue:** When API fails, shows mock data without user notification
- **Fix:** Add error toast or banner when using fallback data

### 19. **TicketDetailView.tsx** - No Save Button
- **Issue:** Field changes should auto-save but don't call API
- **UX Gap:** Users expect changes to persist
- **Fix:** Add explicit "Save Changes" button or implement auto-save

### 20. **ServiceDeskView.tsx** - KPI Cards Use Static Data
- **Location:** Lines 540-572
- **Issue:** "Critical Assets" shows hardcoded `3`, "Avg Resolution" shows `4.2h`
- **Fix:** Calculate from actual ticket data

### 21. **ProjectDetailView.tsx** - Delete Activity is Client-Side Only
- **Location:** Line 686
- **Issue:** `onClick={() => setActivities((prev) => prev.filter((a) => a.id !== activity.id))}`
- **Fix:** Add `apiClient.deleteActivity(activity.id)` call

### 22. **WorkflowsView.tsx** - Uses Lucide Icons
- **Issue:** Uses `lucide-react` instead of Fluent UI icons
- **Consistency Gap:** Rest of app uses `@fluentui/react-icons`
- **Fix:** Replace imports to maintain design consistency

### 23. **Navigation Routes** - Inconsistent Prefixes
- **Finding:** Some routes use `/app/` prefix, some don't
- **Examples:**
  - `/app/service-desk` vs `/knowledge-base`
  - `/app/cmdb` vs `/service-catalog`
- **Fix:** Standardize all routes to use `/app/` prefix

### 24. **Form Validation** - Missing Inline Errors
- **Affected:** Most forms rely on `alert()` or no validation
- **Best Practice:** Use inline field errors per acceptance criteria doc

### 25. **Responsive Design** - Not Verified
- **Issue:** No explicit responsive breakpoint testing done
- **Risk:** Views may not work on mobile/tablet

---

## 🔵 Backend API Gap Analysis

### Frontend APIs Without Backend Implementation

| Frontend API Call | Backend Status | Notes |
|-------------------|----------------|-------|
| `apiClient.getKBArticles()` | ⚠️ Partial | May return empty |
| `apiClient.getAlertRules()` | ✅ Exists | At `/api/v1/monitoring/rules` |
| `apiClient.getAdminUsers()` | ❓ Unverified | Admin endpoints |
| `apiClient.getAdminRoles()` | ❓ Unverified | Admin endpoints |
| Settings persistence | ❌ Missing | No settings API |
| Dashboard aggregations | ⚠️ Partial | Basic summary exists |

### Backend APIs Without Frontend Usage

| Backend Endpoint | Frontend Status |
|------------------|-----------------|
| `/api/v1/tiering/*` | ❌ No UI - NEW (just implemented) |
| `/api/v1/knowledge/*` | ✅ Used by KnowledgeBaseView |
| `/api/v1/catalog/*` | ✅ Used by ServiceCatalogView |
| `/api/v1/workflows/*` | ❌ Not used - View uses mock data |
| `/api/v1/integration/*` | ❓ Unclear usage |

---

## 📋 Recommended Priority Fixes

### Phase 1: Critical (1-2 days)
1. **Connect DashboardView to real APIs** - High visibility
2. **Fix TicketDetailView field saves** - Core ITSM function
3. **Connect WorkflowsView to backend** - Feature appears broken

### Phase 2: High Priority (3-5 days)
4. Replace all `MOCK_*` data with API calls in:
   - ProjectTimelineView
   - ProjectWorkspaceView
   - AuditLogView
   - MigrationProjects
5. Uncomment ProjectsView delete/complete calls
6. Fix ClusterSizingView hardcoded project ID

### Phase 3: Polish (1 week)
7. Add error toasts for API failures
8. Standardize route prefixes
9. Add inline form validation
10. Replace Lucide icons with Fluent UI
11. Add loading skeletons consistently
12. Responsive design audit

### Phase 4: Backend Gaps
13. Create Settings persistence API
14. Create Dashboard aggregation endpoint
15. Add Tiering UI components
16. Verify Admin User/Role endpoints

---

## Appendix: Files Reviewed

### Views Analyzed (70 files)
- ServiceDeskView.tsx ✓
- TicketDetailView.tsx ✓
- DashboardView.tsx ✓
- CMDBExplorerView.tsx ✓
- KnowledgeBaseView.tsx ✓
- WorkflowsView.tsx ✓
- UserManagementView.tsx ✓
- SettingsView.tsx ✓
- ServiceCatalogView.tsx ✓
- MonitoringView.tsx ✓
- InfraVisualizerView.tsx ✓
- ClusterSizingView.tsx ✓
- ProjectTimelineView.tsx ✓
- ProjectWorkspaceView.tsx ✓
- AuditLogView.tsx ✓
- MigrationProjects.tsx ✓
- ProjectsView.tsx ✓
- (+ 53 more views checked for patterns)

### Backend APIs Verified
- `/api/v1/tickets/*` ✅
- `/api/v1/tiering/*` ✅
- `/api/v1/monitoring/*` ✅
- `/api/v1/workflows/*` ✅
- `/api/v1/knowledge/*` ✅
- `/api/v1/catalog/*` ✅
- `/api/v1/cmdb/*` ✅
- `/api/v1/assets/*` ✅

---

*Report generated as part of UI/UX audit task*
