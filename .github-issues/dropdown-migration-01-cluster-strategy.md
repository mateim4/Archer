# Migrate ClusterStrategy Dropdowns to PurpleGlass

**Priority:** 🔴 Critical  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** High  
**Files:** 2  
**Dropdowns:** 4 total

## Summary
Migrate all dropdown components in cluster strategy configuration to PurpleGlassDropdown, preserving loading states and dynamic data features.

## Files to Migrate

### 1. src/components/ClusterStrategy/ClusterStrategyModal.tsx
**Dropdowns:** 3 Fluent UI `<Dropdown>` instances
- **Line 474:** Source cluster selector with loading state ("Loading clusters...")
- **Line 588:** Hardware basket selector with loading state ("Loading baskets...")
- **Line 617:** Server model selector with loading state ("Loading models...")

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- Preserve loading state indicators
- Maintain `selectedOptions` prop functionality
- Keep dynamic data population from API calls
- Preserve `onOptionSelect` event handling

### 2. src/components/ClusterStrategy/DominoConfigurationSection.tsx
**Dropdowns:** 1 Fluent UI `<Dropdown>` instance
- **Line 128:** Domino source cluster selector

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- Preserve `selectedOptions` prop
- Maintain empty string default value handling
- Keep `onFieldChange` callback with field name parameter

## Migration Steps

1. [ ] Import PurpleGlassDropdown from `@/components/ui`
2. [ ] Replace Fluent UI Dropdown in ClusterStrategyModal.tsx line 474
3. [ ] Replace Fluent UI Dropdown in ClusterStrategyModal.tsx line 588
4. [ ] Replace Fluent UI Dropdown in ClusterStrategyModal.tsx line 617
5. [ ] Replace Fluent UI Dropdown in DominoConfigurationSection.tsx line 128
6. [ ] Remove unused Fluent UI Dropdown imports
7. [ ] Test loading states behavior
8. [ ] Test API data population
9. [ ] Verify keyboard navigation
10. [ ] Run existing test suite

## Testing Checklist

### Functional Testing
- [ ] Source cluster dropdown loads data correctly
- [ ] Hardware basket dropdown loads data correctly
- [ ] Server model dropdown loads data correctly
- [ ] Loading states display properly
- [ ] Empty state handling works correctly
- [ ] Selection updates form state correctly
- [ ] Domino configuration dropdown works independently

### Visual Testing
- [ ] Dropdowns match PurpleGlass design system
- [ ] Loading states are visually clear
- [ ] Glass effect level is appropriate (recommend `medium`)
- [ ] Spacing and layout preserved

### Integration Testing
- [ ] Cluster strategy creation flow works end-to-end
- [ ] Domino configuration saves correctly
- [ ] Error handling preserved

## Implementation Notes

**Loading State Pattern:**
```typescript
<PurpleGlassDropdown
  label="Source Cluster"
  options={clusters.map(c => ({ value: c.id, label: c.name }))}
  value={selectedCluster}
  onChange={(value) => handleClusterChange(value)}
  disabled={loadingClusters}
  helperText={loadingClusters ? "Loading clusters..." : undefined}
  glass="medium"
/>
```

**Important:** The PurpleGlassDropdown doesn't have a native loading state, so use `disabled` + `helperText` to show loading status.

## Acceptance Criteria
- [ ] All 4 dropdowns migrated to PurpleGlassDropdown
- [ ] No Fluent UI Dropdown imports remain in these files
- [ ] Loading states preserved and functional
- [ ] API data integration works correctly
- [ ] No visual regressions
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` sections 4 & 5
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
