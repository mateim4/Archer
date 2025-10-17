# Activity Wizard Modal - Bug Hunting Report
**Date**: October 17, 2025  
**Commit**: d567b60

## Test Execution Plan

### Phase 1: Visual Inspection & Modal Behavior
- [ ] **Modal Opening**
  - Test from ProjectDetailView "Add Activity" button
  - Test from ProjectWorkspaceView Gantt "Add Activity" button
  - Test from Edit button on existing activity
  - Verify: Modal backdrop has blur effect
  - Verify: Modal doesn't force white backgrounds
  - Verify: Purple glass aesthetic applied
  - Verify: Smooth fade-in animation

- [ ] **Modal Backdrop**
  - Check: backdrop-filter: blur(12px) applied
  - Check: rgba(0, 0, 0, 0.4) background
  - Check: Content behind modal is blurred
  - Check: No white or forced backgrounds
  - Check: Clicking backdrop shows unsaved changes warning (if changes exist)

- [ ] **Modal Size & Responsiveness**
  - Desktop (1920px): 95vw max 1400px
  - Tablet (1024px): Should adapt
  - Mobile (375px): Full screen
  - Check: Content not cut off at any size
  - Check: Scrolling works if content overflows

### Phase 2: Step 1 - Activity Basics
- [ ] **Fields Present**
  - Activity Name input
  - Activity Type dropdown/combobox
  - Description textarea

- [ ] **Validation**
  - Empty name blocks Next button or shows error
  - Valid name allows proceeding
  - Type selection works
  - Description accepts text

- [ ] **UI/UX**
  - Fields have proper labels
  - Placeholder text visible
  - Purple glass styling on focus
  - Tab order logical

### Phase 3: Step 2 - Source & Destination
- [ ] **Infrastructure Type Cards**
  - 3 cards visible: On-Premises, Cloud, Hybrid
  - Cards in 3-column grid (desktop)
  - Radio buttons centered at top
  - Purple glass styling
  - Hover effect: purple border + shadow
  - Selected state: purple gradient + glow
  - Icons colored purple (#8b5cf6)

- [ ] **Migration Strategy Section** (for migration activities)
  - Section appears only for migration type
  - 3 strategy cards:
    - ⚡ Domino Hardware Swap
    - 🛒 New Hardware Purchase
    - 📦 Use Existing Free Hardware
  - Cards have purple glass styling
  - Selection triggers sub-sections

- [ ] **Domino Swap Sub-Section**
  - Source cluster dropdown appears
  - Hardware available date picker appears
  - Fields functional

- [ ] **New Purchase Sub-Section**
  - Hardware basket combobox appears
  - Can select basket
  - Fields functional

- [ ] **Existing Hardware Sub-Section**
  - Info message displays
  - Mentions Step 4 configuration

### Phase 4: Step 3 - Hardware Compatibility
- [ ] **RDMA Requirements**
  - Checkbox present
  - Can toggle
  - State persists on navigation

- [ ] **JBOD Requirements**
  - Checkbox present
  - Can toggle
  - State persists

- [ ] **Navigation**
  - Can proceed to Step 4
  - Can go back to Step 2

### Phase 5: Step 4 - Capacity Validation
- [ ] **Required Capacity Section**
  - Section labeled "Required Capacity"
  - Required CPU Cores input
  - Required Memory (GB) input
  - Required Storage (TB) input
  - Info box explaining usage
  - Fields accept numbers
  - Purple glass input styling

- [ ] **Target Hardware Specifications**
  - Number of Nodes input
  - CPU Cores per Node input
  - RAM (GB) per Node input
  - Storage (TB) per Node input
  - All fields functional

- [ ] **Overcommit Ratios**
  - CPU Overcommit slider/input
  - Memory Overcommit slider/input
  - Storage Overcommit slider/input
  - Values adjustable

- [ ] **Validation Button**
  - "Validate Capacity" button present
  - Clicking shows loading state (1.5s)
  - Results section appears
  - Shows available vs required
  - Shows utilization percentages
  - Color-coded status (green/yellow/red)

- [ ] **Validation Logic**
  - Uses explicit requirements when provided
  - Falls back to defaults (80 CPU, 256GB, 8TB)
  - Calculations correct

### Phase 6: Step 5 - Timeline Estimation
- [ ] **VM/Host Inputs**
  - Number of VMs input
  - Number of hosts input
  - Fields accept numbers

- [ ] **Duration Calculation**
  - Estimated duration displays
  - Updates based on inputs
  - Shows reasonable estimates

### Phase 7: Step 6 - Team Assignment
- [ ] **Assignee Field**
  - Input/dropdown for assignee
  - Can enter name or select

- [ ] **Date Pickers**
  - Start date picker
  - End date picker
  - Dates can be selected
  - Date validation (end after start)

- [ ] **Milestones**
  - Can add milestones (if feature exists)
  - Milestone fields functional

### Phase 8: Step 7 - Review & Submit
- [ ] **Summary Display**
  - Shows all data from previous steps
  - Step 1 data: name, type, description
  - Step 2 data: infrastructure, strategy
  - Step 3 data: RDMA, JBOD
  - Step 4 data: capacity requirements
  - Step 5 data: timeline
  - Step 6 data: assignee, dates

- [ ] **Submit Button**
  - "Submit Activity" or "Create Activity" button present
  - Clicking shows loading state
  - Success: Toast notification
  - Success: Modal closes
  - Success: Activity appears in list
  - Error: Error message displays
  - Error: Modal stays open

### Phase 9: Navigation Testing
- [ ] **Forward Navigation**
  - Next button on steps 1-6
  - Button enabled when step valid
  - Button disabled when invalid
  - Progress indicator updates (1/7 → 2/7 etc.)
  - Smooth transitions

- [ ] **Backward Navigation**
  - Previous button on steps 2-7
  - Always enabled
  - Returns to previous step
  - Data preserved
  - Progress indicator updates

- [ ] **Step Indicator**
  - Shows current step (e.g., "3/7")
  - Visual progress bar
  - Purple line crosses circle centers
  - Completed steps: purple
  - Current step: highlighted
  - Future steps: gray

### Phase 10: Unsaved Changes Warning
- [ ] **Trigger Conditions**
  - Make any change in wizard
  - Click close button (X)
  - Confirmation dialog appears

- [ ] **Confirmation Dialog**
  - Title: "Unsaved Changes"
  - Message about auto-save and draft
  - "Continue Editing" button
  - "Close Wizard" button

- [ ] **Continue Editing**
  - Click "Continue Editing"
  - Dialog closes
  - Modal stays open
  - Data preserved

- [ ] **Close Wizard**
  - Click "Close Wizard"
  - Modal closes
  - Draft potentially saved

- [ ] **No Changes**
  - Open modal
  - Don't make changes
  - Click close
  - No confirmation
  - Modal closes immediately

### Phase 11: Edit Mode Testing
- [ ] **Opening Edit Mode**
  - Click Edit on existing activity
  - Modal opens with "Edit Activity" title
  - All fields pre-filled

- [ ] **Data Loading**
  - Step 1: Name, type, description filled
  - Step 2: Infrastructure pre-selected
  - Step 3: Checkboxes reflect state
  - Step 4: Capacity values filled
  - Step 5: Timeline data filled
  - Step 6: Assignee and dates filled

- [ ] **Editing**
  - Can modify any field
  - Changes tracked
  - Unsaved changes warning works
  - Can navigate between steps

- [ ] **Saving Edits**
  - Submit button says "Update" or similar
  - Clicking saves changes
  - PUT request to /activities/{id}
  - Success toast
  - Modal closes
  - Changes reflected in list

### Phase 12: Form Validation
- [ ] **Required Fields**
  - Activity name required
  - Type required (if applicable)
  - Validation messages clear
  - Can't proceed without required fields

- [ ] **Field Format Validation**
  - Numbers: Only accept digits
  - Dates: Valid date format
  - Email (if used): Valid email
  - URLs (if used): Valid URL

- [ ] **Cross-Field Validation**
  - End date after start date
  - Required capacity < available capacity (warning, not blocker)

### Phase 13: Design System Consistency
- [ ] **Colors**
  - Purple (#8b5cf6 → #6366f1 gradients)
  - Consistent throughout wizard
  - Hover states use purple
  - Selected states use purple

- [ ] **Typography**
  - Font family: Poppins
  - Weights: 300-700 used appropriately
  - Sizes: 12px-32px scale
  - Line heights comfortable

- [ ] **Glassmorphic Effects**
  - backdrop-filter on cards
  - Transparent backgrounds
  - White overlays (rgba)
  - Blur effects visible

- [ ] **Spacing**
  - Consistent padding/margins
  - Fluent design tokens used
  - Comfortable whitespace

- [ ] **Shadows**
  - Purple shadows on cards
  - Multi-layer depth
  - Hover effects enhance depth

### Phase 14: Accessibility
- [ ] **Keyboard Navigation**
  - Tab through all fields
  - Focus visible
  - Tab order logical
  - ESC closes modal (with confirmation)
  - Enter submits forms

- [ ] **ARIA Labels**
  - Inputs have labels
  - Buttons have aria-labels
  - Dialog has role="dialog"
  - Live regions for status updates

- [ ] **Screen Reader**
  - Form structure makes sense
  - Error messages announced
  - Step progress announced

- [ ] **Color Contrast**
  - Text readable on backgrounds
  - Meets WCAG AA (4.5:1 minimum)
  - Purple not sole indicator

### Phase 15: Performance
- [ ] **Modal Open Speed**
  - Opens in < 300ms
  - Animation smooth (60fps)
  - No jank

- [ ] **Step Navigation Speed**
  - Transitions < 200ms
  - No lag
  - Smooth animations

- [ ] **Form Responsiveness**
  - Inputs respond immediately
  - No typing lag
  - Dropdowns open quickly

- [ ] **Memory**
  - No memory leaks
  - Modal closes cleanly
  - Console: No errors

### Phase 16: Browser Compatibility
- [ ] **Chrome/Edge**
  - All features work
  - Glassmorphic effects render
  - No console errors

- [ ] **Firefox**
  - All features work
  - backdrop-filter supported
  - Purple gradients render

- [ ] **Safari**
  - All features work
  - -webkit-backdrop-filter works
  - Date pickers functional

### Phase 17: Error Scenarios
- [ ] **Network Errors**
  - Offline: Error message
  - Timeout: Retry option
  - 500 error: Friendly message

- [ ] **Invalid Data**
  - Server rejects: Error shown
  - Modal stays open
  - User can fix and retry

- [ ] **Concurrent Edits**
  - Edit in two tabs
  - Save in first
  - Save in second
  - Conflict handling

## Bug Tracking

### Critical Bugs (P0)
_None found yet_

### High Priority Bugs (P1)
_None found yet_

### Medium Priority Bugs (P2)
_None found yet_

### Low Priority Bugs (P3)
_None found yet_

### UI/UX Issues
_None found yet_

### Performance Issues
_None found yet_

## Testing Notes

### Environment
- Browser: 
- Screen Size: 
- OS: Linux
- Date:

### General Observations
_Add notes here_

### Recommendations
_Add recommendations here_

## Sign-Off

- [ ] All critical bugs fixed
- [ ] All high priority bugs fixed or documented
- [ ] Medium bugs acceptable for release
- [ ] UI/UX polished
- [ ] Performance acceptable
- [ ] Ready for deployment

**Tester**: 
**Date**: 
**Status**: ⏳ In Progress
