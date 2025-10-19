# Deprecate StandardDropdown Component

**Priority:** 🟢 Low  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Low  
**Files:** 3 (1 definition + 2 usages)  
**Dropdowns:** 4 total (3 usages + 1 definition)

## Summary
Migrate remaining `StandardDropdown` usages to PurpleGlassDropdown, then deprecate the `StandardDropdown` component from the design system. This custom wrapper is no longer needed.

## Background

`StandardDropdown` is a custom component defined in `DesignSystem.tsx` that wraps native `<select>` with standardized styling. With PurpleGlassDropdown now available, this wrapper is redundant.

## Files Affected

### Definition
- **src/components/DesignSystem.tsx**
  - Line 172: `StandardDropdownProps` interface
  - Line 181: `StandardDropdown` component export
  - Line 190: Native `<select>` implementation

### Usages
1. **src/components/reporting/ReportCustomizer.tsx**
   - Line 24: Import statement
   - Line 582: Usage in report customization

2. **src/views/EnhancedRVToolsReportView_Old.tsx**
   - Line 20: Import statement
   - Line 341: Usage in RVTools report #1
   - Line 371: Usage in RVTools report #2

**IMPORTANT:** `EnhancedRVToolsReportView_Old.tsx` is a legacy file - verify if still in use before migrating.

## Migration Steps

### Phase 1: Verify Legacy File Status
1. [ ] Check if `EnhancedRVToolsReportView_Old.tsx` is still referenced
2. [ ] Check git history to see when it was deprecated
3. [ ] Search for imports/usage of `EnhancedRVToolsReportView_Old`
4. [ ] **Decision:** Migrate or delete this file?

### Phase 2: Migrate ReportCustomizer.tsx
5. [ ] Import PurpleGlassDropdown from `@/components/ui`
6. [ ] Replace StandardDropdown usage (line 582)
7. [ ] Remove StandardDropdown from import (line 24)
8. [ ] Test report customization workflow
9. [ ] Verify report generation works

### Phase 3: Handle EnhancedRVToolsReportView_Old.tsx
**If file is still in use:**
10. [ ] Import PurpleGlassDropdown
11. [ ] Replace StandardDropdown at line 341
12. [ ] Replace StandardDropdown at line 371
13. [ ] Remove StandardDropdown import
14. [ ] Test RVTools report workflow

**If file is deprecated:**
10. [ ] Document deprecation status
11. [ ] Delete file from repository
12. [ ] Remove from any navigation/routing

### Phase 4: Deprecate StandardDropdown Component
13. [ ] Search entire codebase for remaining StandardDropdown usages
14. [ ] Confirm zero usages remain
15. [ ] Add deprecation comment to component in DesignSystem.tsx
16. [ ] **After 1 sprint without issues:** Delete component definition
17. [ ] Update DesignSystem.tsx documentation

### Phase 5: Cleanup
18. [ ] Update design system documentation
19. [ ] Remove StandardDropdown from exports
20. [ ] Run full test suite
21. [ ] Commit and push changes

## Investigation Required

Before starting migration:
- [ ] What does the dropdown in ReportCustomizer control?
- [ ] What options does it have?
- [ ] Is EnhancedRVToolsReportView_Old still routed/accessible?
- [ ] Are there any other files importing from DesignSystem that depend on StandardDropdown?

## StandardDropdown Current Implementation

```typescript
interface StandardDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export const StandardDropdown: React.FC<StandardDropdownProps> = ({
  label,
  value,
  onChange,
  options,
}) => {
  return (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="lcm-dropdown"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Migration Pattern

**StandardDropdown to PurpleGlassDropdown:**
```typescript
// OLD: StandardDropdown
<StandardDropdown
  label="Report Type"
  value={reportType}
  onChange={(value) => setReportType(value)}
  options={[
    { value: 'summary', label: 'Summary Report' },
    { value: 'detailed', label: 'Detailed Report' }
  ]}
/>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Report Type"
  options={[
    { value: 'summary', label: 'Summary Report' },
    { value: 'detailed', label: 'Detailed Report' }
  ]}
  value={reportType}
  onChange={(value) => setReportType(value as string)}
  glass="light"
/>
```

**Key Differences:**
- PurpleGlassDropdown has `glass` prop for styling control
- onChange receives value directly (already extracted from event)
- Type casting may be needed: `value as string`
- More props available: `required`, `helperText`, `validationState`, etc.

## Testing Checklist

### ReportCustomizer.tsx
- [ ] Report customization dropdown works
- [ ] Options populate correctly
- [ ] Selection updates report configuration
- [ ] Report generation succeeds
- [ ] No visual regressions

### EnhancedRVToolsReportView_Old.tsx (if migrated)
- [ ] Both dropdowns work independently
- [ ] RVTools report filters correctly
- [ ] Report display updates
- [ ] No visual regressions

### Regression Testing
- [ ] No other files broken by StandardDropdown changes
- [ ] Design system documentation accurate
- [ ] All tests passing

## Deprecation Process

### Step 1: Add Deprecation Warning (after migration)
```typescript
/**
 * @deprecated Use PurpleGlassDropdown from @/components/ui instead.
 * This component will be removed in a future release.
 * Migration guide: See FORM_COMPONENTS_MIGRATION.md
 */
export const StandardDropdown: React.FC<StandardDropdownProps> = ({
  // ... implementation
});
```

### Step 2: Monitor for 1 Sprint
- Watch for any issues reported
- Check if any new code uses StandardDropdown
- Verify all migrations stable

### Step 3: Delete Component (after sprint)
```typescript
// Remove from DesignSystem.tsx:
// - StandardDropdownProps interface (lines ~172)
// - StandardDropdown component (lines ~181-190)
// - Update exports if needed
```

## Documentation Updates

After deprecation:
- [ ] Update DesignSystem.tsx header comments
- [ ] Update COMPONENT_LIBRARY_GUIDE.md (remove StandardDropdown)
- [ ] Update FORM_COMPONENTS_MIGRATION.md (add StandardDropdown migration example)
- [ ] Update any architecture/design docs mentioning StandardDropdown

## Acceptance Criteria
- [ ] ReportCustomizer.tsx migrated to PurpleGlassDropdown
- [ ] EnhancedRVToolsReportView_Old.tsx handled (migrated or deleted)
- [ ] Zero StandardDropdown usages remain in codebase
- [ ] StandardDropdown component marked as deprecated
- [ ] All functionality preserved
- [ ] No visual regressions
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Code committed and pushed

## Breaking Change Notice

**Deprecating StandardDropdown is a breaking change** if any external code or future branches depend on it.

**Mitigation:**
1. Keep deprecated component for 1 sprint
2. Add clear deprecation warnings
3. Provide migration guide
4. Announce in team communication
5. Document in CHANGELOG

## Timeline

- **Week 1:** Migrate usages, add deprecation warning
- **Week 2-3:** Monitor for issues
- **Week 4:** Delete component definition (if stable)

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` sections 7, 13, 20
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
- Design System: `src/components/DesignSystem.tsx`
