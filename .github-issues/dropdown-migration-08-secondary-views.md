# Migrate Secondary View Dropdowns to PurpleGlass

**Priority:** 🟢 Low  
**Depends On:** #audit-non-purpleglass-dropdowns  
**Complexity:** Low  
**Files:** 11  
**Dropdowns:** 14 total (mostly single dropdowns)

## Summary
Migrate remaining native select dropdowns in secondary views. Low complexity single dropdowns with standard patterns.

## Files to Migrate

### Views with Native `<select>` Elements

#### 1. src/views/AdvancedAnalyticsDashboard.tsx
- **Line 446:** Analytics metric or chart type selector
- **Type:** Native `<select>`

#### 2. src/views/ClusterSizingView.tsx
- **Line 160:** Cluster sizing parameter selector
- **Type:** Native `<select>`

#### 3. src/views/DesignDocsView.tsx
- **Line 196:** Document category or filter selector
- **Type:** Native `<select>`

#### 4. src/views/EnhancedRVToolsReportView.tsx
- **Line 316:** RVTools report filter #1
- **Line 452:** RVTools report filter #2
- **Type:** Native `<select>` (2 instances)

#### 5. src/views/HardwareLifecycleView.tsx
- **Line 647:** Lifecycle phase or status selector
- **Type:** Fluent UI `<Dropdown>` (1 instance)

#### 6. src/views/HardwarePoolView.tsx
- **Line 218:** Hardware pool filter #1
- **Line 243:** Hardware pool filter #2
- **Type:** Native `<select>` (2 instances)

#### 7. src/views/ProjectTimelineView.tsx
- **Line 363:** Timeline scale selector (day, week, month, year)
- **Type:** Native `<select>` with Tailwind CSS classes

#### 8. src/views/SettingsView.tsx
- **Line 100:** Calculation optimization settings
- **Type:** Native `<select>` with `.lcm-dropdown w-full`

#### 9. src/views/WorkflowsView.tsx
- **Line 266:** Workflow category filter
- **Type:** Native `<select>` with `.lcm-dropdown`

### Components

#### 10. src/components/CapacityVisualizer/CapacityCanvas.tsx
- **Line 2475:** Visualization mode selector (CPU, Memory, Storage)
- **Type:** Native `<select>` with `.lcm-dropdown`

#### 11. src/components/CapacityVisualizer/CapacityControlPanel.tsx
- **Line 156:** Capacity view selector
- **Type:** Fluent UI `<Dropdown>`

## Migration Strategy

**Batch Processing Approach:**
Since these are all single or double dropdowns with standard patterns:

1. Group by type (Fluent UI vs native select)
2. Migrate all native selects first (simpler)
3. Then migrate remaining Fluent UI dropdowns
4. Test each file independently

## Migration Steps

### Phase 1: Native Selects (9 files, 11 dropdowns)
1. [ ] AdvancedAnalyticsDashboard.tsx - 1 dropdown
2. [ ] ClusterSizingView.tsx - 1 dropdown
3. [ ] DesignDocsView.tsx - 1 dropdown
4. [ ] EnhancedRVToolsReportView.tsx - 2 dropdowns
5. [ ] HardwarePoolView.tsx - 2 dropdowns
6. [ ] ProjectTimelineView.tsx - 1 dropdown (Tailwind classes)
7. [ ] SettingsView.tsx - 1 dropdown (`.lcm-dropdown w-full`)
8. [ ] WorkflowsView.tsx - 1 dropdown (`.lcm-dropdown`)
9. [ ] CapacityCanvas.tsx - 1 dropdown (`.lcm-dropdown`)

### Phase 2: Fluent UI Dropdowns (2 files, 2 dropdowns)
10. [ ] HardwareLifecycleView.tsx - 1 dropdown
11. [ ] CapacityControlPanel.tsx - 1 dropdown

### Phase 3: Testing
12. [ ] Test each view individually
13. [ ] Run full test suite
14. [ ] Visual regression testing

## Testing Checklist

### Per-File Verification
For each migrated file:
- [ ] Dropdown renders correctly
- [ ] Selection updates state
- [ ] Functionality preserved
- [ ] No visual regressions
- [ ] Keyboard navigation works

### High-Value Testing Focus
- [ ] **SettingsView**: Calculation settings persist correctly
- [ ] **ProjectTimelineView**: Timeline scale changes view correctly
- [ ] **EnhancedRVToolsReportView**: Both filters work together
- [ ] **CapacityVisualizer**: Both dropdowns coordinate properly

## Implementation Pattern

**Standard Native Select Migration:**
```typescript
// OLD: Native select
<select 
  value={setting}
  onChange={(e) => setSetting(e.target.value)}
  className="lcm-dropdown"
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Setting"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={setting}
  onChange={(value) => setSetting(value as string)}
  glass="light"
/>
```

**Timeline Scale Migration (Tailwind to PurpleGlass):**
```typescript
// OLD: Native select with Tailwind
<select
  value={viewOptions.timeScale}
  onChange={(e) => setViewOptions(prev => ({ 
    ...prev, 
    timeScale: e.target.value as any 
  }))}
  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
>
  <option value="day">Day</option>
  <option value="week">Week</option>
  <option value="month">Month</option>
</select>

// NEW: PurpleGlassDropdown
<PurpleGlassDropdown
  label="Time Scale"
  options={[
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ]}
  value={viewOptions.timeScale}
  onChange={(value) => setViewOptions(prev => ({ 
    ...prev, 
    timeScale: value as any 
  }))}
  glass="light"
  size="small"
/>
```

## Special Notes

### ProjectTimelineView
- Currently uses Tailwind classes instead of design system
- Migration will align it with design system
- Consider this a design system upgrade

### SettingsView
- Uses `.lcm-dropdown w-full` class
- Full-width styling must be preserved
- Settings persistence critical to test

### CapacityVisualizer Files
- Two files with different dropdown types
- May need coordination testing
- Part of visualization system

## Low Priority Justification

These files are:
- Secondary workflows (not critical path)
- Single or double dropdowns (low complexity)
- Standard patterns (no special features)
- Can be migrated in batches efficiently

## Acceptance Criteria
- [ ] All 14 dropdowns migrated to PurpleGlassDropdown
- [ ] No native `<select>` elements remain in these files
- [ ] No Fluent UI Dropdown imports remain in these files
- [ ] All functionality preserved
- [ ] Settings persistence works (SettingsView)
- [ ] Timeline scaling works (ProjectTimelineView)
- [ ] Visualization modes work (CapacityVisualizer)
- [ ] No visual regressions
- [ ] All tests passing
- [ ] Code committed and pushed

## Efficiency Tips

**Batch Migration Pattern:**
1. Open all files in editor
2. Import PurpleGlassDropdown in all files at once
3. Migrate dropdowns file-by-file
4. Test each file immediately after migration
5. Commit after each successful file migration

**Testing Optimization:**
- Group similar views for testing (e.g., all single-dropdown views)
- Use visual regression tool if available
- Focus manual testing on high-value features (settings, timeline)

## Reference
- Audit Report: `DROPDOWN_AUDIT_REPORT.md` sections 2, 3, 14-20, 23, 30, 32, 34
- Component Library Guide: `COMPONENT_LIBRARY_GUIDE.md`
- Migration Guide: `FORM_COMPONENTS_MIGRATION.md`
