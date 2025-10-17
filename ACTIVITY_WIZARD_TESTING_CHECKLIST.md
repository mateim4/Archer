# Activity Wizard Modal - Testing Checklist

**Phase 7 Complete** - Activity Wizard fully converted to modal pattern

## Testing Overview
This document provides a comprehensive checklist for testing the Activity Wizard modal in both create and edit modes.

---

## 1. Modal Entry Points Testing ✅

### 1.1 ProjectDetailView - Add Activity Button
- [ ] Navigate to `/app/projects/{projectId}` (detail view)
- [ ] Click "Add Activity" button in activity cards section
- [ ] Verify: Modal opens with "Create Activity" title
- [ ] Verify: Modal shows Step 1 (Activity Basics)
- [ ] Verify: Purple glass design with glassmorphic effects
- [ ] Verify: Progress bar shows 1/7 steps

### 1.2 ProjectWorkspaceView - Add Activity Button (Gantt View)
- [ ] Navigate to `/app/projects/{projectId}` (workspace view)
- [ ] Ensure Timeline tab is active
- [ ] Click "Add Activity" button above Gantt chart
- [ ] Verify: Modal opens in create mode
- [ ] Verify: All 7 steps accessible via Next/Previous buttons

### 1.3 ProjectWorkspaceView - Add Activity Button (List View)
- [ ] Navigate to `/app/projects/{projectId}` (workspace view)
- [ ] Switch to List view using view toggle
- [ ] Click "Add Activity" button
- [ ] Verify: Modal opens in create mode

### 1.4 Gantt Chart - Edit Button (Non-Migration Activity)
- [ ] Create a custom/lifecycle/decommission activity first
- [ ] Find the activity in Gantt chart
- [ ] Click on activity card in Gantt
- [ ] Click "Edit" button in activity actions
- [ ] Verify: Modal opens with "Edit Activity" title
- [ ] Verify: All fields pre-populated with existing data
- [ ] Verify: Can navigate through all 7 steps with data intact

### 1.5 Activity List - Edit Button
- [ ] Switch to List view
- [ ] Find any non-migration activity
- [ ] Click "Edit" button on activity row
- [ ] Verify: Modal opens in edit mode with pre-filled data

---

## 2. Create Mode - Full Workflow Testing

### Step 1: Activity Basics
- [ ] Modal opens on Step 1
- [ ] Enter Activity Name: "Test Migration Activity"
- [ ] Select Activity Type: Migration
- [ ] Enter Description: "Test description"
- [ ] Click "Next" button
- [ ] Verify: Progresses to Step 2

### Step 2: Source & Destination
- [ ] **Infrastructure Type Selection**:
  - [ ] See 3 infrastructure cards (On-Premises, Cloud, Hybrid)
  - [ ] Cards have purple glass styling with glassmorphic effects
  - [ ] Radio buttons centered at top of cards
  - [ ] Select "On-Premises"
  - [ ] Verify: Card shows purple gradient background and glow

- [ ] **Migration Strategy (for Migration activities only)**:
  - [ ] See "Hardware Sourcing Strategy" section
  - [ ] See 3 strategy cards:
    - [ ] ⚡ Domino Hardware Swap
    - [ ] 🛒 New Hardware Purchase
    - [ ] 📦 Use Existing Free Hardware
  - [ ] Select "Domino Hardware Swap"
  - [ ] Verify: Sub-section appears with source cluster dropdown
  - [ ] Verify: Hardware available date picker appears
  - [ ] Select source cluster
  - [ ] Pick availability date

- [ ] Click "Next"
- [ ] Verify: Progresses to Step 3

### Step 3: Hardware Compatibility
- [ ] RDMA Requirements checkbox
- [ ] JBOD Requirements checkbox
- [ ] Click "Next"
- [ ] Verify: Progresses to Step 4

### Step 4: Capacity Validation
- [ ] **Required Capacity Section**:
  - [ ] See "Required Capacity" section at top
  - [ ] Enter Required CPU Cores: 100
  - [ ] Enter Required Memory (GB): 512
  - [ ] Enter Required Storage (TB): 10
  - [ ] See info box explaining requirement usage

- [ ] **Target Hardware Specifications**:
  - [ ] Enter Number of Nodes: 5
  - [ ] Enter CPU Cores per Node: 32
  - [ ] Enter RAM (GB) per Node: 256
  - [ ] Enter Storage (TB) per Node: 4

- [ ] **Overcommit Ratios**:
  - [ ] Adjust CPU Overcommit: 2.0
  - [ ] Adjust Memory Overcommit: 1.5
  - [ ] Adjust Storage Overcommit: 1.2

- [ ] Click "Validate Capacity"
- [ ] Verify: Validation results appear (mock data)
- [ ] Verify: Shows available vs required resources
- [ ] Verify: Shows resource utilization percentages
- [ ] Click "Next"

### Step 5: Timeline Estimation
- [ ] Enter number of VMs
- [ ] Enter number of hosts
- [ ] See estimated duration calculation
- [ ] Click "Next"

### Step 6: Team Assignment
- [ ] Enter assignee name
- [ ] Select start date
- [ ] Select end date
- [ ] Add milestones (optional)
- [ ] Click "Next"

### Step 7: Review & Submit
- [ ] See summary of all entered data
- [ ] Verify: All 6 previous steps' data displayed
- [ ] Click "Submit Activity"
- [ ] Verify: Success toast appears
- [ ] Verify: Modal closes
- [ ] Verify: Activity appears in Gantt chart/list
- [ ] Verify: Activity list refreshes automatically

---

## 3. Edit Mode - Full Workflow Testing

### 3.1 Load Existing Activity
- [ ] Click Edit on existing activity
- [ ] Verify: Modal opens with "Edit Activity" title
- [ ] Verify: Step 1 shows existing name, type, description

### 3.2 Navigate Through Steps
- [ ] Click "Next" to Step 2
- [ ] Verify: Infrastructure type pre-selected
- [ ] Verify: Migration strategy pre-selected (if migration)
- [ ] Verify: All sub-fields populated
- [ ] Continue through Steps 3-7
- [ ] Verify: All existing data preserved

### 3.3 Modify and Save
- [ ] Go back to Step 1
- [ ] Change activity name: "Updated Activity Name"
- [ ] Navigate to Step 4
- [ ] Change required CPU: 150
- [ ] Navigate to Step 7
- [ ] Click "Submit Activity"
- [ ] Verify: Success toast: "Activity updated successfully!"
- [ ] Verify: Modal closes
- [ ] Verify: Changes reflected in Gantt/list

---

## 4. Unsaved Changes Warning Testing

### 4.1 Close Modal with Unsaved Changes
- [ ] Open wizard in create mode
- [ ] Enter activity name in Step 1
- [ ] Click modal close button (X)
- [ ] Verify: Confirmation dialog appears
- [ ] Verify: Dialog text: "You have unsaved changes..."
- [ ] Click "Cancel" in dialog
- [ ] Verify: Modal stays open
- [ ] Verify: Data still present

### 4.2 Discard Changes
- [ ] Click close button again
- [ ] Click "Discard Changes" in dialog
- [ ] Verify: Modal closes
- [ ] Verify: No activity created

### 4.3 Navigate Away with Unsaved Changes
- [ ] Open wizard, make changes
- [ ] Click "Previous" or "Next" to navigate steps
- [ ] Verify: Navigation works (no warning within wizard)
- [ ] Click modal backdrop to close
- [ ] Verify: Confirmation dialog appears

---

## 5. Validation & Error Handling

### 5.1 Required Fields Validation
- [ ] Open wizard
- [ ] Leave Activity Name empty
- [ ] Try to click "Next"
- [ ] Verify: Validation error appears
- [ ] Verify: Cannot proceed to Step 2

### 5.2 Date Validation
- [ ] Go to Step 6
- [ ] Set end date before start date
- [ ] Try to proceed
- [ ] Verify: Validation error appears

### 5.3 Capacity Validation
- [ ] Go to Step 4
- [ ] Enter target hardware with insufficient capacity
- [ ] Click "Validate Capacity"
- [ ] Verify: Warning/critical status appears
- [ ] Verify: Can still proceed (warning, not blocker)

---

## 6. Design System Consistency

### 6.1 Purple Glass Aesthetic
- [ ] Verify: Modal has glassmorphic background
- [ ] Verify: backdrop-filter: blur(20px)
- [ ] Verify: Purple gradient accents (#8b5cf6 → #6366f1)
- [ ] Verify: Consistent with rest of application

### 6.2 Infrastructure Cards
- [ ] Verify: 3-column grid on desktop
- [ ] Verify: Equal width and height
- [ ] Verify: Radio buttons centered at top
- [ ] Verify: Hover effects with purple borders
- [ ] Verify: Selected state has purple glow

### 6.3 Migration Strategy Cards
- [ ] Verify: 3-column grid layout
- [ ] Verify: Purple glass styling
- [ ] Verify: Icons colored purple
- [ ] Verify: Conditional sub-sections appear

### 6.4 Progress Indicator
- [ ] Verify: Progress bar at top of modal
- [ ] Verify: Shows current step (e.g., "3/7")
- [ ] Verify: Line crosses through center of step circles
- [ ] Verify: Purple color for completed/active steps

---

## 7. Responsive Design Testing

### 7.1 Desktop (1920px+)
- [ ] Modal width: 95vw max 1400px
- [ ] Infrastructure cards: 3 columns
- [ ] Migration strategy cards: 3 columns
- [ ] All content readable and accessible

### 7.2 Tablet (768px - 1199px)
- [ ] Modal adapts to screen width
- [ ] Cards adjust to 2 columns
- [ ] Navigation buttons still accessible

### 7.3 Mobile (< 768px)
- [ ] Modal: 100% width with padding
- [ ] Cards: Single column
- [ ] Progress circles: Smaller (32px)
- [ ] Touch-friendly button sizes

---

## 8. API Integration Testing

### 8.1 Create Activity API Calls
- [ ] Open browser DevTools Network tab
- [ ] Create new activity
- [ ] Verify: POST /api/wizard/start called
- [ ] Verify: POST /api/wizard/{id}/complete called
- [ ] Verify: Response returns activity ID
- [ ] Verify: Activity appears in GET /api/projects/{id}/activities

### 8.2 Edit Activity API Calls
- [ ] Edit existing activity
- [ ] Verify: GET /api/activities/{id} called to load data
- [ ] Verify: PUT /api/activities/{id} called on submit
- [ ] Verify: Updated data returned in response

### 8.3 Draft Saving (if implemented)
- [ ] Make changes in wizard
- [ ] Wait for auto-save
- [ ] Verify: PUT /api/wizard/{id}/progress called
- [ ] Close and reopen wizard
- [ ] Verify: Changes persisted

---

## 9. Edge Cases & Error Scenarios

### 9.1 Network Errors
- [ ] Simulate network offline
- [ ] Try to submit activity
- [ ] Verify: Error message appears
- [ ] Verify: Modal stays open
- [ ] Verify: Data not lost

### 9.2 Invalid Activity ID (Edit Mode)
- [ ] Try to edit non-existent activity
- [ ] Verify: Error message or redirect
- [ ] Verify: Graceful handling

### 9.3 Concurrent Edits
- [ ] Open same activity in two tabs
- [ ] Edit in both tabs
- [ ] Submit in first tab
- [ ] Try to submit in second tab
- [ ] Verify: Appropriate conflict handling

---

## 10. Browser Compatibility

### 10.1 Chrome/Edge
- [ ] All features work
- [ ] Glassmorphic effects render correctly
- [ ] No console errors

### 10.2 Firefox
- [ ] All features work
- [ ] backdrop-filter supported
- [ ] Purple gradients render correctly

### 10.3 Safari
- [ ] All features work
- [ ] Webkit-specific CSS works
- [ ] Date pickers functional

---

## Phase 7 Completion Checklist

### Route Cleanup
- ✅ Removed `/activities/wizard` route from App.tsx
- ✅ Removed unused `ActivityWizard` and `WizardProvider` imports
- ✅ Verified no other references to old route
- ✅ Committed route cleanup changes (dd28472)
- ✅ Pushed to remote

### Modal Entry Points
- ✅ ProjectDetailView: "Add Activity" button → Modal
- ✅ ProjectWorkspaceView: "Add Activity" button (Gantt) → Modal
- ✅ ProjectWorkspaceView: "Add Activity" button (List) → Modal
- ✅ Gantt Chart: Edit button → Modal (edit mode)
- ✅ Activity List: Edit button → Modal (edit mode)

### Integration Verification
- ✅ Create mode: `mode="create"`, `projectId` prop passed
- ✅ Edit mode: `mode="edit"`, `activityId` prop passed
- ✅ Success callbacks refresh activity lists
- ✅ Toast notifications on success
- ✅ Modal close handlers clean up state

### Code Quality
- ✅ No TypeScript compilation errors in wizard code
- ✅ No console warnings related to wizard
- ✅ Design system consistency maintained
- ✅ All commits have descriptive messages

---

## Final Sign-Off

**Date**: 2025-10-17
**Phase**: 7 of 7 (COMPLETE)
**Status**: All 7 phases of Activity Wizard modal conversion complete

**Commits**:
- Phase 1: 927e010 - Modal Wrapper Component
- Phase 2: 2045bdd - Project Views Integration  
- Phase 3: 57a5112 - Implement Edit Mode
- Phase 4: 821b1a9 - Gantt Chart Edit Integration
- Phase 5: 283cf7b - Merge ClusterStrategy - Step 2
- Phase 6: c08de62 - Merge ClusterStrategy - Step 4
- Phase 7: dd28472 - Remove Old Route & Cleanup

**Next Steps**:
1. Manual testing using this checklist
2. Fix any issues discovered during testing
3. Consider adding automated tests for critical paths
4. Monitor production usage for edge cases

---

## Notes
- Migration activities navigate to Cluster Strategy Manager (separate view)
- Non-migration activities open in edit modal
- Wizard uses WizardContext for state management
- All styling follows Fluent UI 2 + purple glass design system
- Poppins font family used throughout
