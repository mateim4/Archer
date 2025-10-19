# Migrate Document & Project Views Dropdowns to PurpleGlass

**Priority:** 🟡 Medium  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Medium  
**Files:** 4  
**Dropdowns:** 7 total

## Summary
Migrate dropdowns in document management and project views to PurpleGlassDropdown. Mix of Fluent UI and native selects.

## Files to Migrate

### 1. src/components/ProjectDocumentsView.tsx
**Dropdowns:** 3 Fluent UI `<Dropdown>` instances
- **Line 713:** Document type or category filter
- **Line 838:** Document selector (nested context)
- **Line 854:** Document selector (nested context)

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- Multiple dropdowns for document filtering/categorization
- Nested context requires careful state management
- May be interdependent filters

### 2. src/views/MigrationProjects.tsx
**Dropdowns:** 2 Fluent UI `<Dropdown>` instances
- **Line 218:** Project filter dropdown
- **Line 234:** Project sort/category dropdown

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- Dual dropdown system for project management
- Part of main migration projects interface
- Filter + sort pattern

### 3. src/views/ProjectDetailView.tsx
**Dropdowns:** 1 Fluent UI `<Dropdown>` instance
- **Line 702:** Project detail configuration dropdown

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- Single dropdown in project detail interface
- Context-specific configuration

### 4. src/views/ProjectDetailView_Fluent2.tsx
**Dropdowns:** 1 Fluent UI `<Dropdown>` instance
- **Line 492:** Activity status filter with `aria-label`

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- **IMPORTANT:** Has `aria-label` for accessibility
- Fluent UI 2 implementation
- Must preserve accessibility attributes

## Migration Steps

### ProjectDocumentsView.tsx
1. [ ] Analyze dropdown context at line 713
2. [ ] Analyze dropdown context at line 838
3. [ ] Analyze dropdown context at line 854
4. [ ] Import PurpleGlassDropdown from `@/components/ui`
5. [ ] Replace dropdown at line 713
6. [ ] Replace dropdown at line 838
7. [ ] Replace dropdown at line 854
8. [ ] Test document management workflow

### MigrationProjects.tsx
9. [ ] Analyze dropdown context at line 218
10. [ ] Analyze dropdown context at line 234
11. [ ] Import PurpleGlassDropdown from `@/components/ui`
12. [ ] Replace dropdown at line 218
13. [ ] Replace dropdown at line 234
14. [ ] Test project filtering and sorting

### ProjectDetailView.tsx
15. [ ] Analyze dropdown context at line 702
16. [ ] Import PurpleGlassDropdown from `@/components/ui`
17. [ ] Replace dropdown at line 702
18. [ ] Test project detail configuration

### ProjectDetailView_Fluent2.tsx
19. [ ] Analyze dropdown context at line 492
20. [ ] Import PurpleGlassDropdown from `@/components/ui`
21. [ ] Replace dropdown preserving `aria-label`
22. [ ] Test accessibility with screen reader
23. [ ] Run existing test suite

## Testing Checklist

### Functional Testing - ProjectDocumentsView
- [ ] Document filtering works correctly
- [ ] All 3 dropdowns update independently
- [ ] Document selection/categorization preserved
- [ ] State management correct

### Functional Testing - MigrationProjects
- [ ] Project filter dropdown updates project list
- [ ] Project sort dropdown changes ordering
- [ ] Both dropdowns work together correctly

### Functional Testing - ProjectDetailView
- [ ] Configuration dropdown updates project detail
- [ ] Settings persist correctly

### Functional Testing - ProjectDetailView_Fluent2
- [ ] Activity status filter works
- [ ] **CRITICAL:** Accessibility preserved (aria-label)
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

### Visual Testing
- [ ] All dropdowns match PurpleGlass design system
- [ ] Glass effect appropriate (recommend `light` for filters, `medium` for forms)
- [ ] Spacing consistent
- [ ] Layout responsive

### Integration Testing
- [ ] Document management workflow complete
- [ ] Project list view works end-to-end
- [ ] Project detail view works end-to-end
- [ ] No regressions

## Implementation Pattern

**Accessibility Migration (ProjectDetailView_Fluent2):**
```typescript
// OLD: Fluent UI Dropdown with aria-label
<Dropdown
  placeholder="Filter by status"
  value={filterStatus}
  onOptionSelect={(_, data) => setFilterStatus(data.optionValue as string)}
  aria-label="Filter activities by status"
>
  {/* options */}
</Dropdown>

// NEW: PurpleGlassDropdown with aria-label
<PurpleGlassDropdown
  label="Status Filter"
  options={statusOptions}
  value={filterStatus}
  onChange={(value) => setFilterStatus(value as string)}
  placeholder="Filter by status"
  aria-label="Filter activities by status"
  glass="light"
/>
```

**Filter + Sort Pattern (MigrationProjects):**
```typescript
// Two dropdowns working together
<div style={{ display: 'flex', gap: '1rem' }}>
  <PurpleGlassDropdown
    label="Filter"
    options={filterOptions}
    value={filter}
    onChange={(value) => setFilter(value as string)}
    glass="light"
  />
  <PurpleGlassDropdown
    label="Sort By"
    options={sortOptions}
    value={sortBy}
    onChange={(value) => setSortBy(value as string)}
    glass="light"
  />
</div>
```

## Important Notes

- **ProjectDetailView_Fluent2**: Must test accessibility thoroughly
- **ProjectDocumentsView**: 3 dropdowns may have complex interdependencies
- All files use Fluent UI imports - straightforward migration path
- No custom styling classes identified

## Acceptance Criteria
- [ ] All 7 dropdowns migrated to PurpleGlassDropdown
- [ ] No Fluent UI Dropdown imports remain in these files
- [ ] Accessibility preserved (especially aria-label)
- [ ] All filtering/sorting functionality works
- [ ] Document management works end-to-end
- [ ] Project views work end-to-end
- [ ] No visual regressions
- [ ] Accessibility tested with screen reader
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` sections 11, 27, 28, 29
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
- Accessibility Guide: Check PurpleGlassDropdown ARIA support
