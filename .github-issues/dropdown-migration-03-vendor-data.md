# Migrate VendorDataCollectionView Dropdowns to PurpleGlass

**Priority:** 🔴 Critical  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Medium  
**Files:** 1  
**Dropdowns:** 2 total

## Summary
Migrate native select elements in VendorDataCollectionView to PurpleGlassDropdown. Critical for vendor data collection workflow with custom inline styling.

## Files to Migrate

### 1. src/views/VendorDataCollectionView.tsx
**Dropdowns:** 2 Native `<select>` instances
- **Line 1508:** Workload type selector
- **Line 1740:** Hardware basket selector

**Current Implementation:** Native HTML `<select>` with inline styles (no CSS class)

**Special Requirements:**
- Preserve inline styling (custom sizing)
- Maintain workload type selection logic
- Keep hardware basket integration
- No CSS classes currently applied - all inline styles

## Migration Steps

1. [ ] Document current inline styles at line 1508
2. [ ] Document current inline styles at line 1740
3. [ ] Import PurpleGlassDropdown from `@/components/ui`
4. [ ] Replace workload type select with PurpleGlassDropdown
5. [ ] Replace hardware basket select with PurpleGlassDropdown
6. [ ] Replicate sizing with PurpleGlassDropdown props
7. [ ] Test vendor data collection workflow
8. [ ] Run existing test suite

## Investigation Required

Before migration, capture:
- [ ] Exact inline styles applied to both selects
- [ ] Width, padding, and spacing values
- [ ] Workload type options and values
- [ ] Hardware basket data source
- [ ] Event handler implementations

## Testing Checklist

### Functional Testing
- [ ] Workload type selection updates state correctly
- [ ] Hardware basket selection works
- [ ] Vendor data collection saves correctly
- [ ] Default values load properly
- [ ] Empty states handled correctly

### Visual Testing
- [ ] Dropdowns match intended size/spacing
- [ ] Glass effect appropriate for context (recommend `light`)
- [ ] Alignment with other form elements preserved
- [ ] Responsive behavior maintained

### Integration Testing
- [ ] Vendor data workflow completes end-to-end
- [ ] Hardware basket integration works
- [ ] Search requirements functionality preserved
- [ ] No regressions in data collection

## Implementation Notes

**Inline Style Migration Pattern:**
```typescript
// OLD: Native select with inline styles
<select
  value={searchRequirements.workload_type}
  onChange={(e) => setSearchRequirements(prev => ({
    ...prev, 
    workload_type: e.target.value
  }))}
  style={{
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px'
  }}
>
  <option value="general">General</option>
  <option value="database">Database</option>
</select>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Workload Type"
  options={[
    { value: 'general', label: 'General' },
    { value: 'database', label: 'Database' }
  ]}
  value={searchRequirements.workload_type}
  onChange={(value) => setSearchRequirements(prev => ({
    ...prev,
    workload_type: value as string
  }))}
  glass="light"
  style={{ width: '100%' }}  // Only if needed
/>
```

**Important:** PurpleGlassDropdown handles most styling through design tokens. Only apply inline styles if absolutely necessary for layout.

## Acceptance Criteria
- [ ] Both dropdowns migrated to PurpleGlassDropdown
- [ ] No native `<select>` elements remain in VendorDataCollectionView
- [ ] Custom sizing/spacing replicated
- [ ] All functionality preserved
- [ ] No visual regressions
- [ ] Vendor data collection workflow works end-to-end
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` section 33
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
