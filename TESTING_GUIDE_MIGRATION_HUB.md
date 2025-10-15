# Migration Hub Testing Guide

## Current Implementation Status

✅ **Backend Complete** (Phase 1)
- Cluster strategy API endpoints (8 routes)
- Dependency validation service
- Database schema updates
- Capacity validation logic

✅ **Frontend Complete** (Phase 2)
- ProjectMigrationWorkspace dashboard
- ClusterStrategyModal (full CRUD)
- DominoConfigurationSection
- ClusterStrategyList

---

## Prerequisites

### 1. Backend Setup
```bash
cd backend
cargo build --release
```

### 2. Database Setup
Ensure SurrealDB is running:
```bash
surreal start --log trace --user root --pass root memory
```

Or if using file-based:
```bash
surreal start --log trace --user root --pass root file://lcmdesigner.db
```

### 3. Frontend Setup
```bash
cd frontend
npm install  # if not already done
```

---

## Test Plan

### Test 1: Backend API Endpoints ✅

**Start Backend:**
```bash
cd backend
cargo run
```

Expected output: Server starts on `http://localhost:3003`

**Test Health Check:**
```bash
curl http://localhost:3003/health
```

Expected: `{"status":"healthy","timestamp":"..."}`

**Test Create Cluster Strategy:**
```bash
curl -X POST http://localhost:3003/api/projects/test-project-001/cluster-strategies \
  -H "Content-Type: application/json" \
  -d '{
    "source_cluster_name": "ASN-PROD-01",
    "target_cluster_name": "HYPERV-PROD-01",
    "strategy_type": "domino_hardware_swap",
    "domino_source_cluster": "ASN-DEV-01",
    "required_cpu_cores": 128,
    "required_memory_gb": 512,
    "required_storage_tb": 50.0,
    "notes": "Test domino hardware swap strategy"
  }'
```

Expected: `{"success":true,"data":{...},"message":"Cluster migration strategy configured successfully"}`

**Test List Strategies:**
```bash
curl http://localhost:3003/api/projects/test-project-001/cluster-strategies
```

Expected: `{"success":true,"data":[{...}]}`

**Test Validate Dependencies:**
```bash
curl -X POST http://localhost:3003/api/projects/test-project-001/validate-dependencies
```

Expected: `{"success":true,"data":{"is_valid":true,"errors":[],"warnings":[],...}}`

---

### Test 2: Frontend UI Components ✅

**Start Frontend:**
```bash
cd frontend
npm run dev
```

Expected output: Dev server starts on `http://localhost:1420`

**Navigate to Migration Workspace:**
```
http://localhost:1420/app/projects/test-project-001/migration-workspace
```

**Visual Checks:**
- [ ] Overview cards display (Clusters, CPU, Hardware Allocated %, Progress)
- [ ] Glassmorphic aesthetic with blur effects
- [ ] Poppins font rendering correctly
- [ ] "Configure New Strategy" button visible
- [ ] Empty state message if no strategies

---

### Test 3: Create Strategy Workflow ✅

**Steps:**
1. Click "Configure New Strategy" button
   - [ ] Modal opens with glassmorphic backdrop
   - [ ] Form fields are empty

2. Fill Basic Information:
   - Source Cluster: `ASN-PROD-01`
   - Target Cluster: `HYPERV-PROD-01`
   - [ ] No validation errors

3. Select Strategy Type:
   - Click "⚡ Domino Hardware Swap" card
   - [ ] Card highlights with blue border
   - [ ] DominoConfigurationSection appears

4. Configure Domino Details:
   - Select source cluster: `ASN-DEV-01`
   - Set availability date: `2025-12-31`
   - [ ] Visual transfer diagram appears
   - [ ] Warning box shows dependency message

5. Enter Capacity Requirements:
   - CPU Cores: `128`
   - Memory: `512`
   - Storage: `50.0`
   - [ ] Number inputs accept values

6. Click "Validate Capacity":
   - [ ] Spinner appears
   - [ ] Validation results card displays
   - [ ] CPU/Memory/Storage utilization shown
   - [ ] Recommendations listed (if any)

7. Set Timeline (Optional):
   - Planned Start: `2025-11-01`
   - Planned Completion: `2026-01-31`

8. Add Notes:
   - "Primary production cluster migration with domino hardware transfer"

9. Click "Save Strategy":
   - [ ] Spinner appears on button
   - [ ] Modal closes on success
   - [ ] Strategy appears in list

---

### Test 4: Strategy List Display ✅

**Verify:**
- [ ] Strategy card appears in list
- [ ] Status badge shows correct status
- [ ] Strategy type label: "⚡ Domino Hardware Swap"
- [ ] Cluster names: `ASN-PROD-01 → HYPERV-PROD-01`
- [ ] Capacity info: `128 Cores, 512GB RAM, 50.0TB Storage`
- [ ] Domino source: "Hardware from: ASN-DEV-01 (Available: 12/31/2025)"
- [ ] Edit and Delete buttons visible

---

### Test 5: Edit Strategy Workflow ✅

**Steps:**
1. Click "Edit" button on existing strategy
   - [ ] Modal opens
   - [ ] All fields pre-populated with existing data
   - [ ] Strategy type card shows selected state

2. Modify values:
   - Change CPU to `256`
   - Change Memory to `1024`

3. Click "Save Strategy":
   - [ ] API PUT request sent
   - [ ] Modal closes
   - [ ] List updates with new values

---

### Test 6: Delete Strategy Workflow ✅

**Steps:**
1. Click "Delete" button on strategy
   - [ ] Browser confirmation dialog appears
   
2. Click "OK" in confirmation:
   - [ ] API DELETE request sent
   - [ ] Strategy removed from list
   - [ ] Empty state appears if last strategy deleted

---

### Test 7: Dependency Validation ✅

**Setup:**
Create 3 strategies with dependencies:
1. ASN-DEV-01 → HYPERV-DEV-01 (no dependencies)
2. ASN-PROD-01 → HYPERV-PROD-01 (domino source: ASN-DEV-01)
3. ASN-TEST-01 → HYPERV-TEST-01 (domino source: ASN-PROD-01)

**Test:**
1. Click "Validate Dependencies" button
   - [ ] Alert shows validation results
   - [ ] `is_valid: true`
   - [ ] `errors: 0`
   - [ ] `warnings: 0`

**Test Circular Dependency:**
1. Edit HYPERV-DEV-01 to depend on HYPERV-TEST-01
2. Click "Validate Dependencies"
   - [ ] `is_valid: false`
   - [ ] Circular dependency detected
   - [ ] Error message lists the cycle

---

### Test 8: Capacity Validation ✅

**Steps:**
1. In modal, enter capacity requirements:
   - CPU: `1000` (very high)
   - Memory: `2000`
   - Storage: `100`

2. Click "Validate Capacity":
   - [ ] Validation card appears
   - [ ] Status badge shows "WARNING" or "CRITICAL"
   - [ ] CPU utilization > 100% shown
   - [ ] Recommendations suggest adding more cores
   - [ ] Red/yellow border on validation card

---

### Test 9: UI/UX Quality ✅

**Visual Checks:**
- [ ] Glassmorphic cards have backdrop blur
- [ ] Hover effects work (transform + shadow)
- [ ] Colors from design tokens (no hardcoded hex)
- [ ] Poppins font throughout
- [ ] Smooth transitions (0.2s-0.3s)
- [ ] Responsive grid layout
- [ ] Icons render correctly (Fluent UI icons)
- [ ] Badge colors appropriate for status

**Accessibility:**
- [ ] Tab navigation works through form
- [ ] Labels properly associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Buttons have accessible names

---

### Test 10: Error Handling ✅

**Backend Down Scenario:**
1. Stop backend server
2. Try to save strategy
   - [ ] Error message shown to user
   - [ ] Modal doesn't close
   - [ ] No crash or console errors

**Invalid Data:**
1. Try to save without required fields
   - [ ] Validation errors shown under fields
   - [ ] Red border on invalid inputs
   - [ ] Save button remains enabled (should try validation)

**API Error Response:**
1. Send invalid data that backend rejects
   - [ ] User-friendly error message
   - [ ] No technical stack traces shown

---

## Known Issues / Limitations

### To Be Implemented:
1. **Hardware Basket Dropdown** - Currently shows disabled placeholder
2. **Hardware Pool Dropdown** - Currently shows disabled placeholder
3. **Strategy Details View** - "View Details" button is placeholder
4. **Timeline Visualization** - MigrationGanttChart not yet implemented
5. **CapacityVisualizer Integration** - ProjectId prop not yet added

### Expected Behavior:
- Domino source cluster dropdown only shows clusters from current project
- Capacity validation API might return errors if strategy doesn't exist yet (use POST first)
- Empty state when no strategies configured

---

## Debugging Tips

### Backend Logs:
```bash
# Enable debug logs
RUST_LOG=debug cargo run
```

### Frontend Console:
Open browser DevTools (F12) and check:
- Network tab for API calls
- Console tab for errors/warnings
- React DevTools for component state

### Common Issues:

**CORS Errors:**
- Check backend CORS configuration
- Ensure frontend is on `localhost:1420`
- Backend should allow requests from frontend origin

**API Not Found (404):**
- Verify route registration in `backend/src/api/mod.rs`
- Check URL spelling in frontend fetch calls
- Ensure backend is running on correct port

**Modal Doesn't Open:**
- Check `isModalOpen` state in React DevTools
- Verify `setIsModalOpen(true)` is called
- Check for console errors in button handler

**Data Not Loading:**
- Check Network tab for failed requests
- Verify API response format matches TypeScript interfaces
- Check `loadProjectData()` function execution

---

## Success Criteria

✅ All backend API endpoints respond correctly
✅ Frontend loads without errors
✅ Modal opens and closes smoothly
✅ Strategies can be created with all three types
✅ Strategies can be edited and updated
✅ Strategies can be deleted with confirmation
✅ Capacity validation works and shows results
✅ Dependency validation detects circular dependencies
✅ UI matches glassmorphic design system
✅ No TypeScript errors in console
✅ No React warnings in console

---

## Next Steps After Testing

Once testing is complete and issues are resolved:

1. **Add MigrationGanttChart component** - Visual timeline
2. **Integrate hardware dropdowns** - Basket and pool selection
3. **Enhance CapacityVisualizer** - Add project context
4. **Update ProjectsView** - Add migration project template
5. **Extend document generation** - Include cluster strategies in HLD/LLD

---

## Quick Start Commands

**Full Stack Start:**
```bash
# Terminal 1 - Database
surreal start --log trace --user root --pass root memory

# Terminal 2 - Backend
cd backend && cargo run

# Terminal 3 - Frontend
cd frontend && npm run dev
```

**Access URLs:**
- Frontend: http://localhost:1420
- Backend API: http://localhost:3003
- Migration Workspace: http://localhost:1420/app/projects/test-project-001/migration-workspace

---

## Test Results

Date: ___________
Tester: ___________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Backend API Endpoints | ⬜ Pass ⬜ Fail | |
| 2 | Frontend UI Components | ⬜ Pass ⬜ Fail | |
| 3 | Create Strategy Workflow | ⬜ Pass ⬜ Fail | |
| 4 | Strategy List Display | ⬜ Pass ⬜ Fail | |
| 5 | Edit Strategy Workflow | ⬜ Pass ⬜ Fail | |
| 6 | Delete Strategy Workflow | ⬜ Pass ⬜ Fail | |
| 7 | Dependency Validation | ⬜ Pass ⬜ Fail | |
| 8 | Capacity Validation | ⬜ Pass ⬜ Fail | |
| 9 | UI/UX Quality | ⬜ Pass ⬜ Fail | |
| 10 | Error Handling | ⬜ Pass ⬜ Fail | |

**Overall Result:** ⬜ PASS ⬜ FAIL (with issues) ⬜ BLOCKED

**Critical Issues Found:**
1. ________________________________
2. ________________________________
3. ________________________________

**Non-Critical Issues:**
1. ________________________________
2. ________________________________

**Recommendations:**
________________________________________________________________
________________________________________________________________
________________________________________________________________
