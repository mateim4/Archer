# Migrate HardwareBasketView Dropdowns to PurpleGlass

**Priority:** 🔴 Critical  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Medium  
**Files:** 1  
**Dropdowns:** 4 total (highest count in views)

## Summary
Migrate all native select elements in HardwareBasketView to PurpleGlassDropdown. This view has the highest dropdown count and is critical for hardware basket management workflow.

## Files to Migrate

### 1. src/views/HardwareBasketView.tsx
**Dropdowns:** 4 Native `<select>` instances
- **Line 365:** Hardware basket filter/selector #1
- **Line 388:** Hardware basket filter/selector #2
- **Line 780:** Hardware basket filter/selector #3
- **Line 812:** Hardware basket filter/selector #4

**Current Implementation:** Native HTML `<select>` elements

**Special Requirements:**
- Identify exact purpose of each dropdown (likely filtering, sorting, categorization)
- Preserve any custom event handlers
- Maintain state management integration
- Keep any inline styling or custom classes

## Migration Steps

1. [ ] Analyze context of dropdown at line 365
2. [ ] Analyze context of dropdown at line 388
3. [ ] Analyze context of dropdown at line 780
4. [ ] Analyze context of dropdown at line 812
5. [ ] Import PurpleGlassDropdown from `@/components/ui`
6. [ ] Replace native select at line 365 with PurpleGlassDropdown
7. [ ] Replace native select at line 388 with PurpleGlassDropdown
8. [ ] Replace native select at line 780 with PurpleGlassDropdown
9. [ ] Replace native select at line 812 with PurpleGlassDropdown
10. [ ] Test hardware basket workflow end-to-end
11. [ ] Run existing test suite

## Investigation Required

Before migration, determine:
- [ ] What each dropdown controls (filter type, sort order, category, etc.)
- [ ] What CSS classes are currently applied
- [ ] Whether dropdowns are interdependent
- [ ] State management pattern used
- [ ] Event handler signatures

## Testing Checklist

### Functional Testing
- [ ] Each dropdown filters/sorts/controls correctly
- [ ] Multiple dropdown combinations work together
- [ ] State updates trigger proper data refresh
- [ ] Empty state handling works
- [ ] Default values preserved

### Visual Testing
- [ ] All dropdowns match PurpleGlass design system
- [ ] Spacing between dropdowns preserved
- [ ] Glass effect level appropriate (recommend `light` for filters)
- [ ] Layout remains responsive

### Integration Testing
- [ ] Hardware basket listing updates correctly
- [ ] Filtering works with sorting
- [ ] Basket selection workflow preserved
- [ ] No regressions in basket management

## Implementation Pattern

**Typical Filter Dropdown:**
```typescript
<PurpleGlassDropdown
  label="Filter By"
  options={filterOptions}
  value={filterValue}
  onChange={(value) => setFilterValue(value)}
  glass="light"
/>
```

**Event Handler Migration:**
```typescript
// OLD: Native select
<select 
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
>
  <option value="all">All</option>
  <option value="dell">Dell</option>
</select>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Vendor Filter"
  options={[
    { value: 'all', label: 'All' },
    { value: 'dell', label: 'Dell' }
  ]}
  value={filter}
  onChange={(value) => setFilter(value as string)}
  glass="light"
/>
```

## Acceptance Criteria
- [ ] All 4 dropdowns migrated to PurpleGlassDropdown
- [ ] No native `<select>` elements remain in HardwareBasketView
- [ ] All filtering/sorting functionality preserved
- [ ] No visual regressions
- [ ] Hardware basket workflow works end-to-end
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` section 22
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
