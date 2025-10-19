# Dropdown Migration Issue Index

**Parent Issue:** #audit-non-purpleglass-dropdowns  
**Total Migration Issues:** 9  
**Total Dropdowns to Migrate:** 54

## Overview

This index links all dropdown migration issues created from the comprehensive dropdown audit. Each issue represents a logical batch of dropdown migrations organized by priority and complexity.

## Migration Issues

### 🔴 Critical Priority (Issues 1-5)
These issues cover high-traffic workflows and complex features that must be migrated first.

#### Issue 1: Cluster Strategy Dropdowns
**File:** `dropdown-migration-01-cluster-strategy.md`  
**Files Affected:** 2  
**Dropdowns:** 4 total  
**Complexity:** High  
**Key Features:** Loading states, API integration, dynamic data

**Summary:** Migrate ClusterStrategyModal and DominoConfigurationSection dropdowns with special attention to loading state preservation.

---

#### Issue 2: Hardware Basket View Dropdowns
**File:** `dropdown-migration-02-hardware-basket.md`  
**Files Affected:** 1  
**Dropdowns:** 4 total (highest count in single view)  
**Complexity:** Medium  
**Key Features:** Multiple filters, interdependent dropdowns

**Summary:** Migrate HardwareBasketView - the view with the most dropdowns in the entire codebase.

---

#### Issue 3: Vendor Data Collection Dropdowns
**File:** `dropdown-migration-03-vendor-data.md`  
**Files Affected:** 1  
**Dropdowns:** 2 total  
**Complexity:** Medium  
**Key Features:** Inline styles, workload type selection, basket integration

**Summary:** Migrate VendorDataCollectionView dropdowns critical for vendor workflow.

---

#### Issue 4: Workspace Filter Dropdowns
**File:** `dropdown-migration-04-workspace-filters.md`  
**Files Affected:** 1  
**Dropdowns:** 3 total  
**Complexity:** High  
**Key Features:** **Glassmorphic styling**, triple filter system, custom CSS class

**Summary:** Migrate ProjectWorkspaceView with special attention to preserving `.glassmorphic-filter-select` aesthetic.

---

#### Issue 5: Planner Views Dropdowns
**File:** `dropdown-migration-05-planner-views.md`  
**Files Affected:** 2  
**Dropdowns:** 6 total (3 per file)  
**Complexity:** Medium  
**Key Features:** Planning parameters, lifecycle logic, migration logic

**Summary:** Migrate LifecyclePlannerView and MigrationPlannerView - core planning interfaces.

---

### 🟡 Medium Priority (Issues 6-7)
Standard form dropdowns in secondary workflows.

#### Issue 6: Activity Form Dropdowns
**File:** `dropdown-migration-06-activity-forms.md`  
**Files Affected:** 2  
**Dropdowns:** 4 total (2 per file)  
**Complexity:** Low  
**Key Features:** Activity type selection, dynamic assignee list

**Summary:** Migrate ActivityCreationWizard and CreateActivityFormFixed - straightforward form dropdowns.

---

#### Issue 7: Document & Project Views Dropdowns
**File:** `dropdown-migration-07-document-views.md`  
**Files Affected:** 4  
**Dropdowns:** 7 total  
**Complexity:** Medium  
**Key Features:** Document filtering, accessibility (aria-label), Fluent UI 2

**Summary:** Migrate document management and project view dropdowns with accessibility focus.

---

### 🟢 Low Priority (Issues 8-9)
Single dropdowns in secondary views and component deprecation.

#### Issue 8: Secondary View Dropdowns
**File:** `dropdown-migration-08-secondary-views.md`  
**Files Affected:** 11  
**Dropdowns:** 14 total (mostly single dropdowns)  
**Complexity:** Low  
**Key Features:** Standard patterns, batch migration opportunity

**Summary:** Migrate remaining native select dropdowns in secondary views - can be done efficiently in batches.

---

#### Issue 9: StandardDropdown Deprecation
**File:** `dropdown-migration-09-standard-dropdown-deprecation.md`  
**Files Affected:** 3 (1 definition + 2 usages)  
**Dropdowns:** 4 total (3 usages + 1 component definition)  
**Complexity:** Low  
**Key Features:** Component deprecation, breaking change management

**Summary:** Migrate StandardDropdown usages and deprecate the custom wrapper component from DesignSystem.tsx.

---

## Migration Statistics

### By Priority
| Priority | Issues | Files | Dropdowns | Avg Dropdowns/File |
|----------|--------|-------|-----------|-------------------|
| 🔴 Critical | 5 | 7 | 19 | 2.7 |
| 🟡 Medium | 2 | 6 | 11 | 1.8 |
| 🟢 Low | 2 | 14 | 24 | 1.7 |
| **Total** | **9** | **27** | **54** | **2.0** |

### By Type
| Dropdown Type | Count | Percentage |
|--------------|-------|------------|
| Fluent UI `<Dropdown>` | 19 | 35% |
| Native `<select>` | 31 | 57% |
| `StandardDropdown` | 4 | 7% |

### By Complexity
| Complexity | Issues | Notes |
|-----------|--------|-------|
| High | 2 | Loading states, glassmorphic styling |
| Medium | 4 | Standard migrations with some complexity |
| Low | 3 | Single dropdowns, batch migrations |

## Migration Workflow

### Recommended Order
1. ✅ **Issue 1** - Cluster Strategy (complex, high visibility)
2. ✅ **Issue 2** - Hardware Basket (highest count)
3. ✅ **Issue 3** - Vendor Data (critical workflow)
4. ✅ **Issue 4** - Workspace Filters (glassmorphic preservation)
5. ✅ **Issue 5** - Planner Views (dual view migration)
6. ⬜ **Issue 6** - Activity Forms (straightforward)
7. ⬜ **Issue 7** - Document Views (accessibility focus)
8. ⬜ **Issue 8** - Secondary Views (batch efficiency)
9. ⬜ **Issue 9** - StandardDropdown Deprecation (cleanup)

### Estimated Timeline
- **Critical Issues (1-5):** 2-3 weeks
- **Medium Issues (6-7):** 1 week
- **Low Issues (8-9):** 1 week
- **Total Estimate:** 4-5 weeks

### Parallel Work Opportunities
Files with no dependencies can be migrated in parallel:
- Issues 6 & 7 can be done simultaneously
- Issue 8 can be split across multiple developers
- Issue 9 must wait until all others complete

## Testing Strategy

### Per-Issue Testing
Each issue includes:
- Functional testing checklist
- Visual regression testing
- Integration testing requirements
- Accessibility testing (where applicable)

### Overall Testing Approach
1. Unit test each migrated dropdown
2. Integration test workflows after batch migrations
3. Visual regression test after each priority tier
4. Full regression test before final release

### Testing Tools
- Playwright for E2E testing
- Visual regression testing tool (if available)
- Screen reader for accessibility testing (Issue 7)
- Manual testing for glassmorphic effect (Issue 4)

## Success Metrics

### Completion Criteria
- [ ] All 54 dropdowns migrated to PurpleGlassDropdown
- [ ] Zero Fluent UI Dropdown imports remain
- [ ] Zero native `<select>` elements remain
- [ ] StandardDropdown component deprecated and removed
- [ ] All functionality preserved
- [ ] Zero visual regressions
- [ ] All tests passing
- [ ] Design system fully adopted

### Quality Metrics
- [ ] 100% test coverage for migrated dropdowns
- [ ] 100% accessibility compliance (WCAG AA)
- [ ] Zero performance regressions
- [ ] Consistent glass effect levels across application

## Documentation

### Updated Documentation
After migration complete:
- [ ] Update COMPONENT_LIBRARY_GUIDE.md with migration examples
- [ ] Update FORM_COMPONENTS_MIGRATION.md with lessons learned
- [ ] Archive DROPDOWN_AUDIT_REPORT.md as reference
- [ ] Update DESIGN_SYSTEM_ALIGNMENT_FIXES.md
- [ ] Create migration success summary document

### Knowledge Transfer
- [ ] Document migration patterns encountered
- [ ] Share glassmorphic preservation techniques (Issue 4)
- [ ] Document loading state pattern (Issue 1)
- [ ] Share accessibility best practices (Issue 7)

## Issue Dependencies

```
audit-non-purpleglass-dropdowns (parent)
│
├── Issue 1: Cluster Strategy
├── Issue 2: Hardware Basket
├── Issue 3: Vendor Data
├── Issue 4: Workspace Filters
├── Issue 5: Planner Views
├── Issue 6: Activity Forms
├── Issue 7: Document Views
├── Issue 8: Secondary Views
└── Issue 9: StandardDropdown Deprecation
```

**Note:** Issue 9 depends on completion of all other issues (1-8).

## Risk Mitigation

### High-Risk Areas
1. **Glassmorphic styling** (Issue 4) - Preserve exact visual appearance
2. **Loading states** (Issue 1) - Must work with API delays
3. **Accessibility** (Issue 7) - Screen reader compatibility critical
4. **State management** - Complex interdependencies in some views

### Mitigation Strategies
- Extra testing time for high-risk areas
- Incremental deployment with feature flags
- Rollback plan for each issue
- Pair programming for complex migrations

## Communication Plan

### Stakeholder Updates
- Weekly progress reports during critical phase
- Demo after each priority tier completion
- Final migration summary presentation

### Team Communication
- Daily standup updates during active migration
- Slack/Teams channel for migration questions
- Knowledge sharing sessions for complex patterns

## Reference Links

- **Audit Report:** `/DROPDOWN_AUDIT_REPORT.md`
- **Component Library Guide:** `/COMPONENT_LIBRARY_GUIDE.md`
- **Migration Guide:** `/FORM_COMPONENTS_MIGRATION.md`
- **Design System:** `/frontend/src/components/DesignSystem.tsx`
- **PurpleGlass Components:** `/frontend/src/components/ui/`

---

**Created:** 2025-10-19  
**Last Updated:** 2025-10-19  
**Status:** Ready for migration work to begin
