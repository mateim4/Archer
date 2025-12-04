# Epic: CMO to FMO Migration - Archer ITSM UI/UX Transformation

**Version:** 1.0  
**Date:** December 3, 2025  
**Type:** Epic / Migration Plan  
**Priority:** High  
**Estimated Duration:** 8-10 weeks

---

## Executive Summary

This epic encompasses the complete transformation of Archer ITSM from its **Current Mode of Operation (CMO)** to the **Future Mode of Operation (FMO)** as defined in the UI/UX Specification Sheet v1.0 (December 2, 2025). The FMO is based on extensive research from 327+ sources analyzing ServiceNow, Jira, Freshservice, Datadog, Dynatrace, and other ITSM platforms.

### Primary Objective
Transform Archer into a best-in-class ITSM interface that addresses the #1 market complaint: **complexity** - by delivering speed (<100ms interactions), simplicity (fewer clicks), modern aesthetics (Purple Glass), and keyboard-first navigation (Cmd+K everything).

---

## Gap Analysis: CMO vs FMO

### 1. Design System

| Aspect | CMO (Current) | FMO (Target) | Gap |
|--------|--------------|--------------|-----|
| **Primary Color** | Indigo `#6366f1` | Archer Purple `#6B4CE6` | Minor - Update CSS variables |
| **Typography** | Poppins/Montserrat | Inter (primary), JetBrains Mono (code) | Update font stack |
| **Spacing System** | Custom spacing tokens | 4px-based grid system | Standardize to 4px grid |
| **Border Radius** | Various (`4px-24px`) | Standardized scale (`6px-24px`) | Minor alignment |
| **Glass Effect** | Implemented with custom vars | Spec-defined `backdrop-filter: blur(10px)` | Partial - Align values |
| **Dark Mode** | Class-based `.dark` | `data-theme="dark"` + auto-detect | Update implementation |
| **Shadows** | Custom elevation system | Spec-defined 6-level shadow scale | Update shadow tokens |

### 2. Layout Architecture

| Aspect | CMO (Current) | FMO (Target) | Gap |
|--------|--------------|--------------|-----|
| **Top Bar** | Theme toggle only (fixed position) | 60px fixed with Logo, Global Search, Notifications, Profile | **MAJOR GAP** |
| **Sidebar** | 280px/60px collapsible | 240px/60px with badges, alert indicators | Minor adjustments |
| **Main Content** | 32px padding, transparent bg | 24px padding, fluid width | Minor adjustment |
| **Breadcrumbs** | Implemented (`BreadcrumbNavigation`) | Spec-aligned | Verify styling |
| **Responsive** | Basic responsive | Mobile-first with `640/768/1024/1280/1536px` breakpoints | Needs audit |

### 3. Core Components

| Component | CMO Status | FMO Requirement | Gap |
|-----------|-----------|-----------------|-----|
| **Command Palette (Cmd+K)** | ❌ Not implemented | Full fuzzy search, categories, shortcuts | **MAJOR GAP** |
| **Global Search** | ❌ Basic search bar | Unified search across tickets, assets, docs | **MAJOR GAP** |
| **Notifications Panel** | ❌ Not implemented | Real-time with badge count, dropdown | **MAJOR GAP** |
| **User Profile Menu** | ❌ Not implemented | Avatar, settings, dark mode toggle | **MAJOR GAP** |
| **Data Tables** | ✅ `PurpleGlassVirtualTable` | Virtual scroll, column management, bulk actions | Partial - enhance features |
| **Forms** | ✅ Full Purple Glass set | Matches spec | Minor refinements |
| **Cards** | ✅ `PurpleGlassCard` | Stat cards, interactive cards | Add variants |
| **Modals/Drawers** | ✅ `PurpleGlassModal` | Drawer component missing | Add Drawer component |
| **Toasts** | ✅ `PurpleGlassToast` | Matches spec | Verify timing/positioning |
| **Empty States** | ✅ `PurpleGlassEmptyState` | Matches spec | Minor styling updates |
| **Loading States** | ✅ `PurpleGlassSkeleton`, `PurpleGlassSpinner` | Matches spec | Complete |

### 4. Page Layouts

| Page | CMO Status | FMO Requirement | Gap |
|------|-----------|-----------------|-----|
| **Dashboard** | ❌ `DashboardView.tsx` is data upload focused | Stat cards, widgets, activity timeline, charts | **MAJOR REDESIGN** |
| **Ticket List** | ✅ `ServiceDeskView.tsx` has list/kanban | Tabs, saved views, advanced filters, export | Enhance features |
| **Ticket Detail** | ❌ Basic inline | Split layout, comments, rich text, SLA | **MAJOR GAP** |
| **Asset List (CMDB)** | ✅ `InventoryView.tsx` | Data table with filters | Minor enhancements |
| **Asset Detail** | ❌ Not implemented | Live metrics, dependency map, history | **MAJOR GAP** |
| **Monitoring** | ✅ `MonitoringView.tsx` | Active alerts, charts, time range | Enhance to spec |
| **Settings** | ✅ `SettingsView.tsx` | User preferences, integrations | Needs audit |

### 5. AI-Integrated UX

| Feature | CMO Status | FMO Requirement | Gap |
|---------|-----------|-----------------|-----|
| **Auto-Classification** | ❌ Not implemented | Ticket classification with confidence | **MAJOR GAP** |
| **Similar Ticket Detection** | ❌ Not implemented | ML-based similarity scoring | **MAJOR GAP** |
| **Anomaly Alerts** | ❌ Not implemented | Monitoring → ITSM integration | **MAJOR GAP** |
| **Conversational Search** | ❌ Not implemented | Natural language queries | **MAJOR GAP** |

### 6. Interaction Patterns

| Pattern | CMO Status | FMO Requirement | Gap |
|---------|-----------|-----------------|-----|
| **Keyboard Shortcuts** | ❌ Not implemented | Full shortcut system (G+D, G+T, Cmd+N, etc.) | **MAJOR GAP** |
| **Drag & Drop** | Partial (file upload) | Column reorder, dashboard widgets, kanban | Partial |
| **Context Menus** | ❌ Not implemented | Right-click actions on tables | **MAJOR GAP** |
| **Focus Management** | Partial | Full focus trapping, skip links | Enhancement needed |

### 7. Performance & Accessibility

| Aspect | CMO Status | FMO Target | Gap |
|--------|-----------|------------|-----|
| **LCP** | Unknown | < 2.5s | Need measurement |
| **FID** | Unknown | < 100ms | Need measurement |
| **CLS** | Unknown | < 0.1 | Need measurement |
| **Bundle Size** | ~300KB+ | < 200KB gzipped | Optimization needed |
| **WCAG Level** | Partial | AA Compliance | Full audit needed |
| **Color Contrast** | Recently improved | 4.5:1 minimum | Verify all components |

---

## Migration Plan: Phased Approach

### Phase 1: Foundation (Week 1-2)
**Goal:** Align design system and create missing core infrastructure

#### 1.1 Design System Alignment
- [ ] Update color palette to Archer Purple (`#6B4CE6`) 
- [ ] Switch primary font to Inter with proper fallbacks
- [ ] Standardize spacing to 4px-based grid
- [ ] Update shadow scale to match spec
- [ ] Align dark mode implementation (`data-theme` attribute)
- [ ] Create animation duration/easing tokens

#### 1.2 Layout Architecture  
- [ ] Implement Top Navigation Bar (60px fixed)
  - [ ] Logo component (left)
  - [ ] Global Search placeholder (center)
  - [ ] Quick Actions area (right)
  - [ ] Notification bell placeholder
  - [ ] User profile avatar placeholder
- [ ] Update Sidebar to 240px/60px with spec styling
- [ ] Implement Page Header component (breadcrumbs, title, actions)
- [ ] Create responsive breakpoint utilities

#### 1.3 Core Infrastructure
- [ ] Set up keyboard shortcut system (hotkeys library)
- [ ] Create focus management utilities
- [ ] Implement skip links for accessibility
- [ ] Set up React Query for server state
- [ ] Create notification state management (Zustand)

### Phase 2: Core Components (Week 3-4)
**Goal:** Build missing components and enhance existing ones

#### 2.1 Command Palette
- [ ] Create `CommandPalette` component with overlay
- [ ] Implement fuzzy search across entities
- [ ] Add categorized results (Tickets, Assets, Docs, Commands)
- [ ] Keyboard navigation (arrow keys, Enter)
- [ ] Recent items tracking
- [ ] Bind to Cmd/Ctrl+K

#### 2.2 Global Search
- [ ] Create unified search input in top bar
- [ ] Real-time suggestions dropdown
- [ ] Category filtering
- [ ] Search history

#### 2.3 Notifications System
- [ ] Create `NotificationBell` component with badge
- [ ] Notification dropdown panel
- [ ] Mark as read functionality
- [ ] Toast integration for real-time updates

#### 2.4 User Profile Menu
- [ ] Create `UserProfileMenu` component
- [ ] Profile dropdown with avatar
- [ ] Dark mode toggle integration
- [ ] Settings link
- [ ] Sign out action

#### 2.5 Enhanced Data Tables
- [ ] Add column show/hide functionality
- [ ] Implement column drag reorder
- [ ] Column resize with persistence
- [ ] Multi-column sort
- [ ] Inline editing support
- [ ] Right-click context menus
- [ ] Bulk selection toolbar
- [ ] Export (CSV, Excel, PDF)

#### 2.6 Drawer Component
- [ ] Create `PurpleGlassDrawer` component
- [ ] Right-slide animation
- [ ] Size variants (sm, md, lg)
- [ ] Focus trapping

### Phase 3: Page Redesigns (Week 5-6)
**Goal:** Redesign core pages to match FMO specification

#### 3.1 Dashboard Redesign
- [ ] Create new `DashboardView` layout
- [ ] Stat cards row (Open, In Progress, Resolved, Avg Time)
- [ ] My Open Tickets widget
- [ ] Recent Activity timeline widget
- [ ] Critical Alerts widget (integrate with monitoring)
- [ ] Performance Metrics chart
- [ ] Date range selector
- [ ] Refresh functionality
- [ ] Widget drag-to-reorder (stretch goal)

#### 3.2 Service Desk Enhancement  
- [ ] Tab navigation with live counts (Open, In Progress, Resolved, All)
- [ ] Saved Views functionality
- [ ] Advanced filter builder
- [ ] Group by status/priority/assignee
- [ ] Export functionality

#### 3.3 Ticket Detail View (NEW)
- [ ] Create split layout (content + details panel)
- [ ] Inline title/status/priority editing
- [ ] Comments section with rich text editor
- [ ] @mentions autocomplete
- [ ] File attachments with drag-drop
- [ ] Labels management (tag pills)
- [ ] Related items linking
- [ ] Activity timeline
- [ ] SLA countdown indicator

#### 3.4 Asset Detail View (NEW)
- [ ] Create tabbed layout (Overview, Metrics, Tickets, Dependencies, History)
- [ ] Live metrics widget with progress bars
- [ ] Dependency map visualization (React Flow)
- [ ] Related tickets list
- [ ] Configuration change history

### Phase 4: AI Integration (Week 7)
**Goal:** Implement AI-powered features

#### 4.1 Auto-Classification
- [ ] Backend ML model integration point
- [ ] UI suggestion component with confidence score
- [ ] Accept/Reject/Customize actions
- [ ] Feedback mechanism

#### 4.2 Similar Ticket Detection
- [ ] Similarity scoring algorithm
- [ ] Similar tickets sidebar widget
- [ ] Quick actions (View, Copy Resolution, Link)

#### 4.3 Anomaly Correlation
- [ ] Monitoring integration
- [ ] Anomaly alert component with root cause suggestions
- [ ] One-click ticket creation from alert

### Phase 5: Polish & Performance (Week 8)
**Goal:** Optimize performance and complete accessibility

#### 5.1 Performance Optimization
- [ ] Audit and optimize bundle size (< 200KB target)
- [ ] Implement route-based code splitting
- [ ] Add virtual scrolling to all large lists
- [ ] Optimize images (WebP, lazy loading)
- [ ] Set up performance budgets
- [ ] Lighthouse CI integration

#### 5.2 Accessibility Audit
- [ ] Run axe DevTools on all pages
- [ ] Fix all WCAG AA violations
- [ ] Screen reader testing (NVDA/VoiceOver)
- [ ] Keyboard-only navigation testing
- [ ] Focus indicator verification
- [ ] Color contrast validation

#### 5.3 Animation & Polish
- [ ] Page transitions
- [ ] Modal/drawer animations
- [ ] Hover state consistency
- [ ] Skeleton loader coverage
- [ ] Respect `prefers-reduced-motion`

#### 5.4 Testing
- [ ] Update E2E tests for new flows
- [ ] Add keyboard navigation tests
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

---

## Acceptance Criteria

### Must Have (P0)
- [ ] Top navigation bar with search, notifications, profile
- [ ] Command palette (Cmd+K) functional
- [ ] Dashboard with stat cards and widgets
- [ ] Ticket detail view with comments
- [ ] Keyboard shortcuts for navigation (G+D, G+T, etc.)
- [ ] WCAG AA accessibility compliance
- [ ] Dark mode fully functional
- [ ] Bundle size < 250KB gzipped

### Should Have (P1)
- [ ] Column management in data tables
- [ ] Bulk actions on tickets
- [ ] Export functionality
- [ ] Asset detail with dependency map
- [ ] Saved views for ticket list
- [ ] Similar ticket detection

### Nice to Have (P2)
- [ ] AI auto-classification
- [ ] Conversational search
- [ ] Dashboard widget customization
- [ ] Real-time collaboration indicators
- [ ] Offline support (PWA)

---

## Technical Dependencies

### New Libraries to Add
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",    // Server state management
    "zustand": "^4.x",                   // Client state (existing)
    "hotkeys-js": "^3.x",               // Keyboard shortcuts
    "cmdk": "^0.2.x",                    // Command palette
    "@tiptap/react": "^2.x",            // Rich text editor
    "reactflow": "^11.x",               // Dependency maps
    "recharts": "^2.x",                 // Charts (or existing chart lib)
    "date-fns": "^3.x"                  // Date utilities
  }
}
```

### Backend Requirements
- [ ] Notifications API endpoint
- [ ] Search API endpoint (unified)
- [ ] Ticket comments API
- [ ] Activity log API
- [ ] Similar tickets API (AI)
- [ ] Asset relationships API

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task Completion Rate | > 95% | User testing |
| Time to Create Ticket | < 30s | Stopwatch testing |
| Time to Find Ticket | < 10s | Stopwatch testing |
| Lighthouse Performance | > 90 | Lighthouse CI |
| Lighthouse Accessibility | > 95 | Lighthouse CI |
| Bundle Size | < 200KB | Build analysis |
| User Satisfaction | > 4.5/5 | Survey |

---

## Related Documents

- [UI/UX Specification Sheet v1.0](obsidian://open?vault=Obsidian%20Vault&file=Projects%2FArcher%2FUI%20UX%20Specification%20Sheet)
- [Purple Glass Component Library Guide](./COMPONENT_LIBRARY_GUIDE.md)
- [Design Tokens Documentation](./DESIGN_TOKEN_DOCUMENTATION.md)
- [Developer Onboarding Guide](./docs/development/onboarding.md)

---

## Labels
`epic` `ui-overhaul` `migration` `ux` `accessibility` `performance`

## Assignees
@mateim4

## Milestone
Archer ITSM v2.0

---

*This issue was generated based on comprehensive analysis of the UI/UX Specification Sheet (4,763 lines) compared against the current Archer codebase state.*
