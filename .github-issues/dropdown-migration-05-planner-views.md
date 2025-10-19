# Migrate Lifecycle & Migration Planner Dropdowns to PurpleGlass

**Priority:** 🔴 Critical  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Medium  
**Files:** 2  
**Dropdowns:** 6 total (3 per file)

## Summary
Migrate planning view dropdowns to PurpleGlassDropdown. These are core planning interfaces with 3 parameter selectors each.

## Files to Migrate

### 1. src/views/LifecyclePlannerView.tsx
**Dropdowns:** 3 Native `<select>` instances
- **Line 1078:** Lifecycle parameter selector #1
- **Line 1112:** Lifecycle parameter selector #2
- **Line 1146:** Lifecycle parameter selector #3

**Note:** Lines 512 (SelectionCircle) and 886 (SelectionSquare) are NOT dropdowns - ignore these.

**Current Implementation:** Native HTML `<select>` elements

**Special Requirements:**
- Identify exact purpose of each parameter selector
- Preserve lifecycle planning logic
- Maintain state synchronization
- Keep any validation rules

### 2. src/views/MigrationPlannerView.tsx
**Dropdowns:** 3 Native `<select>` instances
- **Line 1095:** Migration parameter selector #1
- **Line 1129:** Migration parameter selector #2
- **Line 1160:** Migration parameter selector #3

**Note:** Lines 524 (SelectionCircle) and 915 (SelectionSquare) are NOT dropdowns - ignore these.

**Current Implementation:** Native HTML `<select>` elements

**Special Requirements:**
- Identify exact purpose of each parameter selector
- Preserve migration planning logic
- Maintain state synchronization
- Keep any validation rules

## Migration Steps

### LifecyclePlannerView.tsx
1. [ ] Analyze context of dropdown at line 1078
2. [ ] Analyze context of dropdown at line 1112
3. [ ] Analyze context of dropdown at line 1146
4. [ ] Import PurpleGlassDropdown from `@/components/ui`
5. [ ] Replace select at line 1078 with PurpleGlassDropdown
6. [ ] Replace select at line 1112 with PurpleGlassDropdown
7. [ ] Replace select at line 1146 with PurpleGlassDropdown
8. [ ] Test lifecycle planning workflow

### MigrationPlannerView.tsx
9. [ ] Analyze context of dropdown at line 1095
10. [ ] Analyze context of dropdown at line 1129
11. [ ] Analyze context of dropdown at line 1160
12. [ ] Import PurpleGlassDropdown from `@/components/ui`
13. [ ] Replace select at line 1095 with PurpleGlassDropdown
14. [ ] Replace select at line 1129 with PurpleGlassDropdown
15. [ ] Replace select at line 1160 with PurpleGlassDropdown
16. [ ] Test migration planning workflow
17. [ ] Run existing test suite for both files

## Investigation Required

Before migration, determine:
- [ ] What each dropdown controls (timeframe, phase, resource type, etc.)
- [ ] Whether dropdowns in each view are interdependent
- [ ] State management patterns used
- [ ] Validation rules applied to selections
- [ ] Default values and empty states

## Testing Checklist

### Functional Testing - LifecyclePlannerView
- [ ] All 3 parameter selectors update correctly
- [ ] Lifecycle planning calculations work
- [ ] Cluster selection integration preserved
- [ ] State updates trigger proper planning refresh

### Functional Testing - MigrationPlannerView
- [ ] All 3 parameter selectors update correctly
- [ ] Migration planning calculations work
- [ ] Cluster selection integration preserved
- [ ] State updates trigger proper planning refresh

### Visual Testing (Both Views)
- [ ] All dropdowns match PurpleGlass design system
- [ ] Spacing and alignment consistent
- [ ] Glass effect level appropriate (recommend `light`)
- [ ] Layout remains responsive

### Integration Testing
- [ ] Lifecycle planning workflow complete end-to-end
- [ ] Migration planning workflow complete end-to-end
- [ ] Both views work independently without conflicts
- [ ] No regressions in planning logic

## Implementation Pattern

**Typical Planner Dropdown:**
```typescript
// OLD: Native select
<select 
  value={planParam}
  onChange={(e) => setPlanParam(e.target.value)}
  className="lcm-dropdown"
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Planning Parameter"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={planParam}
  onChange={(value) => setPlanParam(value as string)}
  glass="light"
/>
```

## Acceptance Criteria
- [ ] All 6 dropdowns migrated (3 per file)
- [ ] No native `<select>` elements remain in either planner view
- [ ] All planning functionality preserved
- [ ] No visual regressions
- [ ] Lifecycle planning workflow works end-to-end
- [ ] Migration planning workflow works end-to-end
- [ ] Both views tested independently
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` sections 25 & 26
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
