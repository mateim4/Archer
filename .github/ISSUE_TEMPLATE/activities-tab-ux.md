# Issue 4: Activities Tab UX & Information Architecture

## 🎯 Overview
Redesign the Activities tab to improve information hierarchy, add inline editing capabilities, and optimize the layout for better readability and usability.

## 📍 Context
**URL Example**: `http://localhost:1420/app/projects/proj-2` → Activities tab
**File**: `frontend/src/views/ProjectWorkspaceView.tsx`

## 🔍 Current State vs. Desired State

### Current Issues:
1. ❌ Edit and delete buttons are not left-aligned in header row
2. ❌ No spacing between activity title and status chip
3. ❌ "Assignee" text and email address use different font sizes
4. ❌ Other metainformation has inconsistent font sizes
5. ❌ Assignee cannot be changed inline (requires modal)
6. ❌ Divider exists between activity title and information section
7. ❌ Progress bar is too large/stretched
8. ❌ Metainformation is spread across multiple columns (hard to read)

### Desired State:
1. ✅ Edit and delete buttons left-aligned in activity header row
2. ✅ 16px horizontal spacer between activity title and status chip
3. ✅ Unified font size for "Assignee" label and email address
4. ✅ Consistent font sizes for all metainformation labels and values
5. ✅ Inline assignee editing with Jira-style interaction (click to edit dropdown)
6. ✅ No divider between activity title and information section
7. ✅ Progress bar reduced to 50% of current width
8. ✅ Metainformation organized in single column for easy scanning

## 📋 Acceptance Criteria

### Header Layout:
- [ ] Activity title, status chip, edit button, and delete button in single row
- [ ] Edit button positioned immediately after status chip (left side)
- [ ] Delete button positioned immediately after edit button (left side)
- [ ] 16px gap between activity title and status chip
- [ ] 8px gap between status chip and edit button
- [ ] 8px gap between edit and delete buttons
- [ ] All buttons use icon-only style with tooltips

### Typography Consistency:
- [ ] **Metainformation Labels**: 
  - Font size: 14px
  - Font weight: 500
  - Color: `var(--lcm-text-muted, rgba(0,0,0,0.6))`
  - Examples: "Assignee:", "Start Date:", "End Date:", "Status:"
  
- [ ] **Metainformation Values**: 
  - Font size: 14px (same as labels)
  - Font weight: 400
  - Color: `var(--lcm-text-primary, rgba(0,0,0,0.87))`
  - Examples: Email addresses, dates, status text

### Inline Assignee Editing (Jira-style):
- [ ] Default state: Display assignee email as plain text
- [ ] Hover state: Show edit icon (pencil) to the right of email
- [ ] Click state: Replace text with `.lcm-dropdown` for selecting assignee
- [ ] Dropdown options: List all team members (fetch from backend or existing activities)
- [ ] On selection: 
  - Update assignee immediately (optimistic UI update)
  - Send PATCH request to backend
  - Show success toast
  - On error: Revert change and show error toast
- [ ] Click outside or press Escape: Cancel edit and revert to text
- [ ] Smooth transition animation between states

### Layout & Structure:
- [ ] **Remove**: Divider between activity title section and information section
- [ ] **Progress Bar**: 
  - Width: 50% of current size (or max-width: 300px)
  - Maintain purple gradient styling
  - Keep percentage text visible
  - Add `margin-bottom: 16px` for spacing
  
- [ ] **Single Column Layout** for metainformation:
  ```
  Assignee: john.doe@example.com [edit icon]
  Start Date: Jan 15, 2025
  End Date: Feb 28, 2025
  Status: In Progress
  Progress: [=========>        ] 65%
  ```
  - Each metainformation row has consistent spacing (12px margin-bottom)
  - Label and value on same line with 8px gap
  - Left-aligned throughout

## 🎨 Design System Constraints

### MUST USE:
```tsx
// Activity Header with Buttons
<div className="activity-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
  <h3 className="activity-title">{activity.name}</h3>
  <Badge className="status-chip" appearance="filled">{activity.status}</Badge>
  <IconButton 
    icon={<EditRegular />} 
    title="Edit Activity"
    className="edit-btn"
    onClick={handleEdit}
  />
  <IconButton 
    icon={<DeleteRegular />} 
    title="Delete Activity"
    className="delete-btn"
    onClick={handleDelete}
  />
</div>

// Inline Assignee Editing
{isEditingAssignee ? (
  <select 
    className="lcm-dropdown assignee-dropdown"
    value={activity.assignee}
    onChange={handleAssigneeChange}
    onBlur={() => setIsEditingAssignee(false)}
    autoFocus
  >
    {teamMembers.map(member => (
      <option key={member.id} value={member.email}>{member.name}</option>
    ))}
  </select>
) : (
  <div 
    className="assignee-display"
    onMouseEnter={() => setShowEditIcon(true)}
    onMouseLeave={() => setShowEditIcon(false)}
    onClick={() => setIsEditingAssignee(true)}
    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
  >
    <span>{activity.assignee}</span>
    {showEditIcon && <EditRegular fontSize={16} />}
  </div>
)}

// Single Column Metainformation
<div className="activity-meta" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
  <div className="meta-row">
    <span className="meta-label">Assignee:</span>
    <span className="meta-value">{/* Assignee component here */}</span>
  </div>
  <div className="meta-row">
    <span className="meta-label">Start Date:</span>
    <span className="meta-value">{formatDate(activity.startDate)}</span>
  </div>
  {/* ... */}
</div>
```

### CSS Classes:
```css
.activity-header {
  border-bottom: none !important; /* Remove divider */
}

.meta-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--lcm-text-muted);
  margin-right: 8px;
}

.meta-value {
  font-size: 14px;
  font-weight: 400;
  color: var(--lcm-text-primary);
}

.activity-progress-bar {
  max-width: 300px; /* 50% of typical width */
  margin-bottom: 16px;
}

.assignee-display:hover {
  background: rgba(139, 92, 246, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  margin: -4px -8px;
}

.assignee-dropdown {
  min-width: 200px;
}
```

### DO NOT:
- ❌ Keep divider between title and information
- ❌ Use different font sizes for labels vs values
- ❌ Open modal for assignee editing (use inline editing)
- ❌ Stretch progress bar to full width

## 🔧 Implementation Guidance

### Files to Modify:
1. `frontend/src/views/ProjectWorkspaceView.tsx`:
   - Restructure activity header layout
   - Add inline assignee editing state and handlers
   - Reorganize metainformation into single column
   - Remove divider between sections
   - Reduce progress bar width

2. `frontend/src/fluent-enhancements.css`:
   - Add `.meta-label` and `.meta-value` classes
   - Add `.assignee-display` hover styles
   - Update `.activity-progress-bar` max-width

3. Backend API (if needed):
   - Endpoint: `PATCH /api/projects/:projectId/activities/:activityId`
   - Payload: `{ assignee: string }`

### State Management:
```tsx
// Per-activity editing state
const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(null);
const [assigneeHoverId, setAssigneeHoverId] = useState<string | null>(null);

// Team members for dropdown
const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);

// Load team members on mount
useEffect(() => {
  fetchTeamMembers().then(setTeamMembers);
}, []);

// Handle assignee change
const handleAssigneeChange = async (activityId: string, newAssignee: string) => {
  const previousAssignee = activities.find(a => a.id === activityId)?.assignee;
  
  // Optimistic update
  setActivities(prev => prev.map(a => 
    a.id === activityId ? { ...a, assignee: newAssignee } : a
  ));
  
  try {
    await updateActivityAssignee(projectId, activityId, newAssignee);
    showToast('Assignee updated successfully', 'success');
  } catch (error) {
    // Revert on error
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, assignee: previousAssignee } : a
    ));
    showToast('Failed to update assignee', 'error');
  } finally {
    setEditingAssigneeId(null);
  }
};
```

### Jira-Style Interaction Pattern:
1. **View Mode**: Email displayed as text, subtle hover effect
2. **Hover**: Edit icon (pencil) fades in to the right
3. **Click**: Dropdown replaces text instantly, auto-focused
4. **Change**: Dropdown value updates, sends API request, shows loading state
5. **Success**: Dropdown closes, new value displayed, success toast
6. **Error**: Dropdown closes, old value restored, error toast
7. **Cancel**: Click outside or Escape key closes dropdown without saving

## ✅ Testing Requirements

### Layout Testing:
1. Open Activities tab
2. Verify edit and delete buttons are left-aligned after status chip
3. Measure gaps: 16px between title and status, 8px between buttons
4. Verify no divider exists between title and information section
5. Check progress bar is approximately 300px wide (50% reduction)
6. Confirm metainformation is in single column

### Typography Testing:
1. Inspect metainformation labels and values
2. Verify both use 14px font size
3. Check labels have font-weight: 500
4. Check values have font-weight: 400
5. Verify color contrast meets WCAG AA (≥4.5:1)

### Inline Editing Testing:
1. Hover over assignee email → Edit icon appears
2. Click assignee email → Dropdown opens
3. Select new assignee → API request fires
4. Verify optimistic update (instant UI change)
5. Test error handling (disconnect network, make change)
6. Test cancel behavior (click outside dropdown)
7. Test keyboard navigation (Tab, Escape, Enter)

### Responsive Testing:
- [ ] Test on mobile (< 768px)
- [ ] Verify buttons don't overflow on small screens
- [ ] Check single column layout remains intact
- [ ] Test dropdown width on mobile

## 📚 References
- Jira assignee editing UX: https://support.atlassian.com/jira-software-cloud/docs/assign-issues/
- Fluent UI IconButton: https://react.fluentui.dev/?path=/docs/components-button-iconbutton--default
- Fluent UI Badge: https://react.fluentui.dev/?path=/docs/components-badge--default
- Design system: `frontend/src/fluent-enhancements.css`
- API endpoints: Check `server/routes/` for existing activity update routes

---

**Assignee**: @copilot-async
**Priority**: High
**Labels**: `activities-tab`, `ux-improvement`, `inline-editing`, `design-system`
