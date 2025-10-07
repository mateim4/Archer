# Issue 2: Gantt Chart Visual & Interaction Improvements

## 🎯 Overview
Enhance the Gantt chart component with better styling, improved interactions, and cleaner information architecture following our design system.

## 📍 Context
**URL Example**: `http://localhost:1420/app/projects/proj-2` → Timeline tab
**Files**: 
- `frontend/src/views/ProjectWorkspaceView.tsx`
- `frontend/src/components/GanttChart.tsx` (if exists)
- Related chart components

## 🔍 Current State vs. Desired State

### Current Issues:
1. ❌ Redundant text "Project Timeline - 3 Activities" appears above chart
2. ❌ Activity count not integrated with "Activities" label in left summary
3. ❌ Gantt chart colors and styling don't match our design system
4. ❌ Activities column appears on the left side (redundant)
5. ❌ Individual activity bars are not clickable
6. ❌ Tab divider is basic and doesn't show active state
7. ❌ Tabs (Timeline, Activities, Overview, etc.) have no right padding
8. ❌ "Project timeline" font size is too large
9. ❌ "Project timeline" color doesn't match hint text below it

### Desired State:
1. ✅ Remove "Project Timeline - 3 Activities" text completely
2. ✅ Show activity count as "Activities (3)" in left summary
3. ✅ Gantt chart uses our purple gradient theme with proper contrast (≥4.5:1)
4. ✅ Activities column removed from left side of chart
5. ✅ Clicking an activity bar opens that activity in the Activities tab
6. ✅ Unified tab divider with thicker line showing selected/hover/focus states
7. ✅ 16px right padding added to all tabs
8. ✅ "Project timeline" font size reduced by 16px (from current size)
9. ✅ "Project timeline" color matches hint text shade

## 📋 Acceptance Criteria

### Information Architecture:
- [ ] Remove standalone "Project Timeline - 3 Activities" text
- [ ] Display activity count as: `Activities (${activityCount})` in left summary
- [ ] No Activities column in the gantt chart itself

### Gantt Chart Styling:
- [ ] Activity bars use purple gradient: `linear-gradient(135deg, #8b5cf6, #ec4899)`
- [ ] Completed activities: Green gradient `linear-gradient(135deg, #10b981, #34d399)`
- [ ] In Progress activities: Orange gradient `linear-gradient(135deg, #f59e0b, #fbbf24)`
- [ ] Background grid lines: `rgba(139, 92, 246, 0.1)`
- [ ] Text color: Sufficient contrast ratio (≥4.5:1)
- [ ] Glassmorphic card background for chart container

### Interactive Functionality:
- [ ] Clicking any activity bar switches to Activities tab
- [ ] Clicked activity is auto-selected/highlighted in Activities tab
- [ ] Cursor changes to pointer on hover over activity bars
- [ ] Hover effect on activity bars (slight opacity increase or glow)

### Tab Navigation:
- [ ] Unified divider under tabs (single consistent line)
- [ ] Active tab: Thicker divider line (4px) in purple (#8b5cf6)
- [ ] Hover state: Medium divider line (3px) with purple tint
- [ ] Focus state: Same as hover with additional outline
- [ ] 16px padding-right added to each tab button
- [ ] "Project timeline" text font-size reduced by 16px (e.g., if 24px → 8px, if 32px → 16px)
- [ ] "Project timeline" color matches hint text: `var(--lcm-text-muted, rgba(0,0,0,0.6))`

## 🎨 Design System Constraints

### MUST USE:
```css
/* Gantt Chart Container */
.gantt-chart-container {
  background: var(--lcm-bg-card);
  backdrop-filter: var(--lcm-backdrop-filter);
  border-radius: 12px;
  padding: 16px;
}

/* Activity Bars */
.gantt-bar {
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gantt-bar:hover {
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Tab Divider */
.tab-divider {
  height: 2px;
  background: rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;
}

.tab-divider.active {
  height: 4px;
  background: #8b5cf6;
}

/* Typography */
.project-timeline-text {
  font-size: calc(var(--base-font-size) - 16px);
  color: var(--lcm-text-muted);
}
```

### DO NOT:
- ❌ Use basic HTML colors (red, blue, green)
- ❌ Hardcode activity count in text strings
- ❌ Use inline event handlers (use proper React patterns)
- ❌ Break responsive layout on small screens

## 🔧 Implementation Guidance

### Files to Modify:
1. `frontend/src/views/ProjectWorkspaceView.tsx`:
   - Remove "Project Timeline - X Activities" text
   - Update "Activities" label to include count: `Activities (${filteredAndSortedActivities.length})`
   - Add tab right padding and divider styling
   - Reduce "Project timeline" font size

2. `frontend/src/components/GanttChart.tsx` (or similar):
   - Remove Activities column from left side
   - Apply purple gradient styling to bars
   - Add onClick handler to activity bars
   - Add hover effects

3. `frontend/src/fluent-enhancements.css`:
   - Add `.gantt-bar` and `.tab-divider` classes if missing

### Code Pattern Example:
```tsx
// Activity count in label
<TabList>
  <Tab value="timeline">Timeline</Tab>
  <Tab value="activities">Activities ({filteredAndSortedActivities.length})</Tab>
  <Tab value="overview">Overview</Tab>
</TabList>

// Clickable activity bar
<GanttChart
  activities={filteredAndSortedActivities}
  onActivityClick={(activityId) => {
    setActiveTab('activities');
    setSelectedActivity(activityId);
  }}
/>

// Tab with right padding
.tab-button {
  padding-right: 16px;
}
```

### Activity Click Flow:
1. User clicks activity bar in gantt chart
2. `onActivityClick(activityId)` callback fires
3. Switch to Activities tab: `setActiveTab('activities')`
4. Scroll to and highlight clicked activity
5. Optional: Expand activity details automatically

## ✅ Testing Requirements

### Visual Testing:
1. Open Timeline tab: `http://localhost:1420/app/projects/proj-2`
2. Verify "Project Timeline - X Activities" text is removed
3. Check "Activities" label shows count: "Activities (3)"
4. Verify gantt chart colors match purple/green/orange gradients
5. Confirm Activities column is removed from left side
6. Test tab divider appearance:
   - Default: Thin line (2px)
   - Active: Thick line (4px, purple)
   - Hover: Medium line (3px)
7. Measure tab right padding: 16px
8. Verify "Project timeline" text is 16px smaller and matches hint text color

### Interaction Testing:
1. Click an activity bar in gantt chart
2. Verify navigation to Activities tab
3. Confirm clicked activity is highlighted/selected
4. Test hover effect on activity bars (pointer cursor, glow)
5. Test tab navigation with keyboard (accessibility)

### Contrast Testing:
1. Use browser DevTools or Lighthouse
2. Verify all text has ≥4.5:1 contrast ratio
3. Test with different zoom levels (100%, 150%, 200%)

## 📚 References
- GanttChart component: Search for gantt-related files in `frontend/src/components/`
- Tab styling: Check existing tab implementations in other views
- Color gradients: `frontend/src/fluent-enhancements.css`
- Design instructions: `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

---

**Assignee**: @copilot-async
**Priority**: High
**Labels**: `gantt-chart`, `ui-enhancement`, `interactions`, `design-system`
