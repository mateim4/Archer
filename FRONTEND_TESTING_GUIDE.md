# Migration Hub Frontend UI Testing Guide

**Date**: October 16, 2025  
**Frontend URL**: http://localhost:1420  
**Backend API**: http://127.0.0.1:3001  

---

## Frontend Testing Checklist

### 1. Application Access ✓
- [x] Frontend accessible at http://localhost:1420
- [x] Backend API running on port 3001
- [ ] No console errors on initial load
- [ ] Application renders correctly

### 2. Navigation
- [ ] Main navigation visible (Sidebar with menu items)
- [ ] Projects menu item visible
- [ ] Can navigate to Projects view

### 3. Projects View
- [ ] Projects list/cards displayed
- [ ] Can create new project (if applicable)
- [ ] Can select existing project
- [ ] Project details visible

### 4. Migration Hub Access
**How to access:**
1. Navigate to Projects view
2. Select a project (or create test project)
3. Look for "Migration Hub" or "Cluster Strategies" section/tab

**What to check:**
- [ ] Migration Hub view loads
- [ ] ProjectMigrationWorkspace component renders
- [ ] Overview cards visible (Clusters, VMs, Capacity, Timeline)
- [ ] "Configure Strategy" button visible

### 5. Cluster Strategy Modal
**How to test:**
1. Click "Configure Strategy" button
2. Modal should open (ClusterStrategyModal component)

**Fields to verify:**
- [ ] Strategy Name input
- [ ] Source Cluster Name input
- [ ] Target Cluster Name input
- [ ] Strategy Type dropdown with 3 options:
  - NewHardwarePurchase
  - DominoHardwareSwap
  - ExistingFreeHardware
- [ ] Conditional fields based on strategy type:
  - **NewHardwarePurchase**: Hardware Basket Items
  - **DominoHardwareSwap**: Domino Source Cluster
  - **ExistingFreeHardware**: Hardware Pool Allocations
- [ ] Resource Requirements section:
  - CPU Cores input
  - Memory GB input
  - Storage TB input
- [ ] Timeline section:
  - Planned Start Date picker
  - Planned Completion Date picker
- [ ] Notes textarea
- [ ] Save/Submit button
- [ ] Cancel button

### 6. Create Strategy via UI
**Test Case 1: NewHardwarePurchase**
```
Strategy Name: "Production Web Cluster"
Source Cluster: "VMware-Web-01"
Target Cluster: "HyperV-Web-01"
Strategy Type: NewHardwarePurchase
Hardware Basket Items: ["basket-dell-r740", "basket-networking"]
CPU Cores: 256
Memory GB: 1024
Storage TB: 20.0
Notes: "New hardware for web tier migration"
```

**Expected Results:**
- [ ] Modal accepts input without errors
- [ ] Validation works (required fields)
- [ ] API call successful (check Network tab)
- [ ] Modal closes after save
- [ ] New strategy appears in list

**Test Case 2: DominoHardwareSwap**
```
Strategy Name: "App Cluster Domino"
Source Cluster: "VMware-App-01"
Target Cluster: "HyperV-App-01"
Strategy Type: DominoHardwareSwap
Domino Source Cluster: "HyperV-Web-01"
CPU Cores: 192
Memory GB: 768
Storage TB: 15.0
Notes: "Reuse hardware from web cluster"
```

**Expected Results:**
- [ ] Domino fields appear when type selected
- [ ] Can specify domino source cluster
- [ ] Save successful
- [ ] Appears in list with domino indicator

### 7. Strategy List Display (ClusterStrategyList)
**What to verify:**
- [ ] List component renders
- [ ] Strategy cards displayed
- [ ] Each card shows:
  - Strategy name
  - Target cluster
  - Strategy type badge
  - Status badge (PendingHardware, etc.)
  - Resource requirements
  - Timeline dates
- [ ] Cards are clickable
- [ ] Edit/Delete actions visible
- [ ] Proper styling (Fluent UI 2 glassmorphic)

### 8. Domino Configuration Section
**When visible:**
- Strategy type is DominoHardwareSwap
- Domino source cluster specified

**What to check:**
- [ ] DominoConfigurationSection component renders
- [ ] Visual diagram showing hardware transfer
- [ ] Source cluster → Target cluster flow
- [ ] Hardware items listed
- [ ] Transfer date displayed
- [ ] Dependencies highlighted

### 9. Strategy Details View
**How to access:**
- Click on a strategy card in the list

**What to verify:**
- [ ] Full strategy details displayed
- [ ] All fields visible
- [ ] Edit button functional
- [ ] Delete button functional
- [ ] Validation status shown
- [ ] Capacity validation results (if available)

### 10. Update Strategy
**Test:**
1. Select existing strategy
2. Click Edit
3. Modify notes field
4. Save changes

**Expected:**
- [ ] Modal pre-populated with existing data
- [ ] Can modify fields
- [ ] Save successful
- [ ] Changes reflected in list

### 11. Delete Strategy
**Test:**
1. Select strategy
2. Click Delete
3. Confirm deletion

**Expected:**
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Deletion successful when confirmed
- [ ] Strategy removed from list
- [ ] Success notification

### 12. Dependency Validation UI
**If available:**
- [ ] "Validate Dependencies" button visible
- [ ] Click triggers validation
- [ ] Results displayed in UI
- [ ] Circular dependencies highlighted (if any)
- [ ] Execution order shown
- [ ] Warning messages for issues

### 13. Hardware Timeline Visualization
**If available:**
- [ ] Timeline component renders
- [ ] Shows hardware availability dates
- [ ] Domino chains visualized
- [ ] Color coding for different sources:
  - New hardware (green)
  - Domino hardware (orange)
  - Existing pool (blue)
- [ ] Interactive elements (hover, click)

### 14. Capacity Validation UI
**Test:**
1. Open strategy details
2. Look for "Validate Capacity" action
3. Trigger validation

**Expected:**
- [ ] Validation runs
- [ ] Results displayed:
  - Sufficient/Insufficient indicators
  - Overcommit ratios
  - Resource warnings
- [ ] Visual indicators (✓ or ⚠)

### 15. Error Handling
**Test scenarios:**
- [ ] Create strategy with missing required fields
- [ ] Create strategy with invalid data
- [ ] Network error simulation (stop backend)

**Expected:**
- [ ] Validation errors displayed in UI
- [ ] Field-level error messages
- [ ] Network errors shown gracefully
- [ ] No application crashes

### 16. Styling & UX
**Design System Compliance:**
- [ ] Fluent UI 2 components used
- [ ] Glassmorphic aesthetic consistent
- [ ] Poppins font family applied
- [ ] Color scheme matches design system
- [ ] Responsive layout
- [ ] Smooth animations/transitions
- [ ] Loading states shown
- [ ] Proper spacing and alignment

### 17. Performance
**Check:**
- [ ] Initial load time < 2 seconds
- [ ] Modal opens instantly
- [ ] List renders without lag
- [ ] API calls complete quickly
- [ ] No console warnings/errors
- [ ] No memory leaks (long session test)

### 18. Browser Console Check
**Open DevTools (F12) and check:**
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No failed network requests (404, 500)
- [ ] API responses successful (200, 201)
- [ ] Proper CORS headers

---

## Known Frontend Routes

Based on the codebase, these routes should exist:

```
/                           → Home/Dashboard
/projects                   → Projects list view
/projects/:id               → Project details
/projects/:id/migration     → ProjectMigrationWorkspace (if implemented)
/capacity                   → Capacity Visualizer
/hardware-pool              → Hardware Pool view
```

**Note**: Migration Hub might be integrated within project details view rather than a separate route.

---

## API Endpoints Being Called

The frontend should make these API calls:

```javascript
// List strategies
GET /api/v1/projects/{projectId}/cluster-strategies

// Create strategy
POST /api/v1/projects/{projectId}/cluster-strategies

// Get single strategy
GET /api/v1/projects/{projectId}/cluster-strategies/{strategyId}

// Update strategy
PUT /api/v1/projects/{projectId}/cluster-strategies/{strategyId}

// Delete strategy
DELETE /api/v1/projects/{projectId}/cluster-strategies/{strategyId}

// Validate dependencies
POST /api/v1/projects/{projectId}/validate-dependencies

// Get hardware timeline
GET /api/v1/projects/{projectId}/hardware-timeline

// Validate capacity
POST /api/v1/projects/{projectId}/cluster-strategies/{strategyId}/validate-capacity
```

---

## Component Structure

```
ProjectMigrationWorkspace
├── Overview Cards (Metrics)
├── ClusterStrategyList
│   └── Strategy Cards
│       ├── Strategy Info
│       ├── Status Badges
│       └── Actions (Edit/Delete)
├── ClusterStrategyModal
│   ├── Basic Info Section
│   ├── Strategy Type Selector
│   ├── Conditional Fields
│   │   ├── NewHardwarePurchase → Basket Items
│   │   ├── DominoHardwareSwap → Domino Source
│   │   └── ExistingFreeHardware → Pool Allocations
│   ├── Resource Requirements
│   ├── Timeline Pickers
│   └── Notes
└── DominoConfigurationSection (conditional)
    ├── Visual Diagram
    ├── Hardware Items List
    └── Dependencies
```

---

## Testing Report Template

After testing, document results like this:

```markdown
### Test Results: [Component Name]

**Status**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

**What Worked:**
- [List successful features]

**Issues Found:**
- [List bugs/problems]
- [Include screenshots if possible]

**Recommendations:**
- [Suggested fixes]
```

---

## Next Steps After UI Testing

1. Document all UI bugs found
2. Fix critical issues
3. Test frontend-backend integration thoroughly
4. Verify all API endpoints work from UI
5. Test user workflows end-to-end
6. Performance optimization if needed

---

**Happy Testing! 🧪**

*Open http://localhost:1420 and start exploring!*
