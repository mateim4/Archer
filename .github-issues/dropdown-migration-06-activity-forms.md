# Migrate Activity Form Dropdowns to PurpleGlass

**Priority:** 🟡 Medium  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Low  
**Files:** 2  
**Dropdowns:** 4 total (2 per file)

## Summary
Migrate activity creation form dropdowns to PurpleGlassDropdown. Standard form dropdowns with straightforward migration path.

## Files to Migrate

### 1. src/components/ActivityCreationWizard.tsx
**Dropdowns:** 2 Fluent UI `<Dropdown>` instances
- **Line 775:** Activity type selector (migration, lifecycle, decommission, hardware_customization, hardware_refresh, commissioning, custom)
- **Line 791:** Assignee selector with dynamic options from `availableAssignees` array

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- Activity type has 7 predefined options
- Assignee dropdown uses dynamic array (`availableAssignees`)
- Placeholder text: "Select assignee..."
- Uses `onOptionSelect` event handler with `data.optionValue`

### 2. src/components/CreateActivityFormFixed.tsx
**Dropdowns:** 2 Fluent UI `<Dropdown>` instances
- **Line 230:** Activity type selector (type casting to `Activity['type']`)
- **Line 253:** Assignee selector with placeholder

**Current Import:** `@fluentui/react-components`

**Special Requirements:**
- TypeScript type casting for Activity type
- Similar pattern to ActivityCreationWizard
- Uses `onOptionSelect` with state updates

## Migration Steps

### ActivityCreationWizard.tsx
1. [ ] Import PurpleGlassDropdown from `@/components/ui`
2. [ ] Replace activity type Dropdown (line 775)
3. [ ] Replace assignee Dropdown (line 791)
4. [ ] Remove unused Fluent UI Dropdown import
5. [ ] Test activity creation flow

### CreateActivityFormFixed.tsx
6. [ ] Import PurpleGlassDropdown from `@/components/ui`
7. [ ] Replace activity type Dropdown (line 230)
8. [ ] Replace assignee Dropdown (line 253)
9. [ ] Remove unused Fluent UI Dropdown import
10. [ ] Test activity creation flow
11. [ ] Run existing test suite

## Testing Checklist

### Functional Testing
- [ ] Activity type selection works in ActivityCreationWizard
- [ ] Assignee selection works in ActivityCreationWizard
- [ ] Activity type selection works in CreateActivityFormFixed
- [ ] Assignee selection works in CreateActivityFormFixed
- [ ] Dynamic assignee list populates correctly
- [ ] Type casting preserved for TypeScript
- [ ] Form validation still works
- [ ] Form submission includes correct dropdown values

### Visual Testing
- [ ] Dropdowns match PurpleGlass design system
- [ ] Glass effect appropriate (recommend `medium`)
- [ ] Spacing within forms preserved
- [ ] Placeholder text displays correctly

### Integration Testing
- [ ] Activity creation wizard completes end-to-end
- [ ] Fixed form completes end-to-end
- [ ] Created activities have correct type and assignee
- [ ] No regressions in activity management

## Implementation Pattern

**Activity Type Migration:**
```typescript
// OLD: Fluent UI Dropdown
<Field label="Activity Type" required>
  <Dropdown
    value={formData.type}
    onOptionSelect={(_, data) => setFormData(prev => ({ 
      ...prev, 
      type: data.optionValue as any 
    }))}
  >
    <Option text="Migration" value="migration">Migration</Option>
    <Option text="Lifecycle Planning" value="lifecycle">Lifecycle Planning</Option>
    {/* ... more options */}
  </Dropdown>
</Field>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Activity Type"
  required
  options={[
    { value: 'migration', label: 'Migration' },
    { value: 'lifecycle', label: 'Lifecycle Planning' },
    { value: 'decommission', label: 'Decommissioning' },
    { value: 'hardware_customization', label: 'Hardware Customization' },
    { value: 'hardware_refresh', label: 'Hardware Refresh' },
    { value: 'commissioning', label: 'Commissioning' },
    { value: 'custom', label: 'Custom' }
  ]}
  value={formData.type}
  onChange={(value) => setFormData(prev => ({ 
    ...prev, 
    type: value as any 
  }))}
  glass="medium"
/>
```

**Assignee Migration:**
```typescript
// OLD: Fluent UI Dropdown
<Field label="Assignee" required>
  <Dropdown
    value={formData.assignee}
    onOptionSelect={(_, data) => setFormData(prev => ({ 
      ...prev, 
      assignee: data.optionValue as string 
    }))}
    placeholder="Select assignee..."
  >
    {availableAssignees.map(assignee => (
      <Option key={assignee} text={assignee} value={assignee}>
        {assignee}
      </Option>
    ))}
  </Dropdown>
</Field>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Assignee"
  required
  options={availableAssignees.map(assignee => ({
    value: assignee,
    label: assignee
  }))}
  value={formData.assignee}
  onChange={(value) => setFormData(prev => ({ 
    ...prev, 
    assignee: value as string 
  }))}
  placeholder="Select assignee..."
  glass="medium"
/>
```

## Notes

- Both files have similar patterns - can use same migration approach
- Dynamic options (assigneeAssignees) work seamlessly with PurpleGlassDropdown
- Type casting preserved in onChange handlers
- Required prop supported by PurpleGlassDropdown

## Acceptance Criteria
- [ ] All 4 dropdowns migrated to PurpleGlassDropdown
- [ ] No Fluent UI Dropdown imports remain in these files
- [ ] All functionality preserved
- [ ] Type safety maintained
- [ ] No visual regressions
- [ ] Activity creation workflows work end-to-end
- [ ] All tests passing
- [ ] Code committed and pushed

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` sections 1 & 6
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
