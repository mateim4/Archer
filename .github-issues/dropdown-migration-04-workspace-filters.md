# Migrate ProjectWorkspaceView Filter Dropdowns to PurpleGlass

**Priority:** 🔴 Critical  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** High  
**Files:** 1  
**Dropdowns:** 3 total

## Summary
Migrate ProjectWorkspaceView filter dropdowns to PurpleGlassDropdown. Critical because these use custom glassmorphic styling (`.glassmorphic-filter-select`) that must be preserved.

## Files to Migrate

### 1. src/views/ProjectWorkspaceView.tsx
**Dropdowns:** 3 Native `<select>` instances with custom glassmorphic styling
- **Line 677:** Status filter
- **Line 696:** Assignee filter
- **Line 716:** Sort by selector

**Current Class:** `.glassmorphic-filter-select`

**Special Requirements:**
- **CRITICAL:** Preserve glassmorphic aesthetic
- Maintain triple filter system coordination
- Keep custom styling class behavior
- Preserve min-width constraints

## Migration Steps

1. [ ] Document `.glassmorphic-filter-select` CSS rules
2. [ ] Import PurpleGlassDropdown from `@/components/ui`
3. [ ] Replace status filter select (line 677)
4. [ ] Replace assignee filter select (line 696)
5. [ ] Replace sort by select (line 716)
6. [ ] Test filter combinations
7. [ ] Verify glassmorphic aesthetic preserved
8. [ ] Run existing test suite

## Investigation Required

Before migration:
- [ ] Review `.glassmorphic-filter-select` CSS definition
- [ ] Document backdrop-filter, blur, opacity values
- [ ] Verify min-width requirements (140px, 140px, 130px)
- [ ] Test filter interdependencies
- [ ] Check state management pattern

## Testing Checklist

### Functional Testing
- [ ] Status filter updates workspace view correctly
- [ ] Assignee filter works independently
- [ ] Sort by changes ordering correctly
- [ ] Multiple filter combinations work together
- [ ] Filter reset/clear functionality preserved

### Visual Testing
- [ ] **CRITICAL:** Glassmorphic effect matches original
- [ ] Backdrop blur preserved
- [ ] Glass transparency appropriate
- [ ] Min-width constraints maintained
- [ ] Alignment with other UI elements correct

### Integration Testing
- [ ] Workspace filtering updates in real-time
- [ ] All three filters work together correctly
- [ ] Performance with large datasets acceptable
- [ ] State persists across navigation

## Implementation Pattern

**Glassmorphic Filter Migration:**
```typescript
// OLD: Native select with glassmorphic class
<select
  value={filterStatus}
  onChange={(e) => setFilterStatus(e.target.value)}
  className="glassmorphic-filter-select"
  style={{ minWidth: '140px' }}
>
  <option value="">All Status</option>
  <option value="active">Active</option>
  <option value="completed">Completed</option>
</select>

// NEW: PurpleGlassDropdown with glass prop
<PurpleGlassDropdown
  label="Status"
  options={[
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' }
  ]}
  value={filterStatus}
  onChange={(value) => setFilterStatus(value as string)}
  glass="medium"  // Or "heavy" to match glassmorphic aesthetic
  style={{ minWidth: '140px' }}
/>
```

**Glass Level Selection:**
- Test with `glass="light"`, `glass="medium"`, and `glass="heavy"`
- Compare with original `.glassmorphic-filter-select` appearance
- Choose level that best matches existing aesthetic

## CSS Verification

Before removing `.glassmorphic-filter-select` usage, verify:
- [ ] No other components use this class
- [ ] Safe to deprecate class after migration
- [ ] PurpleGlassDropdown glass prop provides equivalent styling

## Acceptance Criteria
- [ ] All 3 dropdowns migrated to PurpleGlassDropdown
- [ ] No native `<select>` elements remain in ProjectWorkspaceView
- [ ] `.glassmorphic-filter-select` class no longer used
- [ ] Glassmorphic aesthetic preserved perfectly
- [ ] All filtering functionality works
- [ ] No visual regressions
- [ ] Triple filter system coordinated correctly
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` section 31
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
- Design System: Check `fluent-enhancements.css` for `.glassmorphic-filter-select` definition
