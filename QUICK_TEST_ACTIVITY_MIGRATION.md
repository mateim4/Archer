# Quick Test: Activity-Driven Migration Integration

**Date**: October 16, 2025  
**Status**: ✅ Services Running - Ready to Test  
**Phases Complete**: 1-3 of 7

---

## ✅ Pre-Test Verification

All services are confirmed running:
```
✓ Frontend:  http://localhost:1420
✓ Backend:   http://localhost:3003  
✓ Database:  ws://localhost:8000
```

---

## 🧪 Test Scenario 1: Navigation Flow

### Goal
Verify that clicking a migration activity navigates to the cluster strategy manager.

### Steps
1. Open browser: http://localhost:1420
2. Navigate to Projects view
3. Open an existing project OR create a new one:
   - Click "Create Project"
   - Name: "Test Migration Project"
   - Type: VMware to Hyper-V Migration
   - Click "Create"

4. In the project workspace, add a migration activity:
   - Click "Add Activity" button
   - Name: "Migrate Production Clusters"
   - Type: **Migration** (important!)
   - Start Date: Today
   - End Date: 30 days from now
   - Assignee: Your name
   - Click "Create Activity"

5. **Click the migration activity** in the timeline/Gantt chart

### Expected Result
✅ You should navigate to: `/app/projects/{projectId}/activities/{activityId}/cluster-strategies`

✅ You should see:
- Breadcrumbs: Projects > Project Workspace > Migrate Production Clusters
- Activity header with status badge
- Activity dates and assignees
- Progress bar showing 0%
- Empty state: "No Cluster Strategies Yet"
- Button: "Create First Strategy"

### If It Fails
- Check browser console for errors (F12 → Console tab)
- Verify the activity type is set to 'migration'
- Check network tab for failed API calls

---

## 🧪 Test Scenario 2: Add Cluster Strategy

### Goal
Test that cluster strategies can be created within an activity context.

### Steps
1. From the Cluster Strategy Manager view (from Test 1)
2. Click "Create First Strategy" or "Add Cluster Strategy"
3. Configure the strategy:
   - Source Cluster: VMware-Web-01
   - Target Cluster: HyperV-Web-01
   - Strategy Type: New Hardware Purchase
   - CPU Cores: 64
   - Memory: 512 GB
   - Storage: 10 TB
   - Start Date: Select a date
   - Duration: 14 days
4. Click "Save" or "Create"

### Expected Result
✅ Strategy should appear in the list
✅ No errors in console
✅ Strategy card shows:
   - Source → Target cluster names
   - Strategy type badge
   - Status badge (likely "Not Configured")
   - Resource requirements

### Backend Verification
Open a new terminal and run:
```bash
curl -s http://localhost:3003/api/v1/projects/test-project-001/activities/test-activity-001/cluster-strategies | jq '.'
```

Expected: JSON array with your strategy, including `activity_id` field

---

## 🧪 Test Scenario 3: Navigation Back

### Goal
Verify breadcrumb and back button navigation works correctly.

### Steps
1. From the Cluster Strategy Manager view
2. Click the back button (arrow icon) in the activity header

### Expected Result
✅ Should navigate back to: `/app/projects/{projectId}`
✅ Should see the project workspace with your migration activity visible

### Alternative Test
1. Click "Projects" in the breadcrumbs
2. Should navigate to: `/app/projects`
3. Should see your projects list

---

## 🧪 Test Scenario 4: Activity Context Preservation

### Goal
Ensure activity information is correctly displayed throughout.

### Steps
1. Navigate back to the Cluster Strategy Manager
2. Verify the header shows:
   - Correct activity name
   - Correct status badge (Pending/In Progress/etc.)
   - Correct dates (start and end)
   - Correct assignees
   - Cluster count (should match number of strategies)

### Expected Result
✅ All activity metadata displays correctly
✅ Progress bar reflects reality (0% if no strategies completed)
✅ If you added strategies, cluster count should be > 0

---

## 🧪 Test Scenario 5: Non-Migration Activities

### Goal
Verify non-migration activities still open the edit modal (unchanged behavior).

### Steps
1. Navigate back to project workspace
2. Add a different activity type:
   - Name: "Hardware Lifecycle Review"
   - Type: **Lifecycle** (NOT migration)
   - Click "Create"
3. Click this new activity in the timeline

### Expected Result
✅ Should open the edit activity modal (old behavior)
✅ Should NOT navigate to cluster strategy manager
✅ Modal should show activity details with edit form

---

## 🧪 Test Scenario 6: Multiple Strategies

### Goal
Test adding multiple cluster strategies to one activity.

### Steps
1. Navigate to your migration activity's cluster strategy manager
2. Add 3 different strategies:
   - Strategy 1: VMware-Web → HyperV-Web (New Hardware)
   - Strategy 2: VMware-App → HyperV-App (Domino from HyperV-Web)
   - Strategy 3: VMware-DB → HyperV-DB (Existing Free Hardware)

### Expected Result
✅ All 3 strategies appear in the list
✅ Each shows different strategy type badge
✅ Activity header shows "3 clusters"
✅ No duplicate strategies
✅ Edit/Delete buttons work on each

---

## 🧪 Test Scenario 7: Edit Strategy

### Goal
Verify editing strategies preserves activity linkage.

### Steps
1. From the strategy list, click "Edit" on any strategy
2. Modify some fields (e.g., increase CPU cores)
3. Save changes

### Expected Result
✅ Modal opens with existing strategy data
✅ Changes save successfully
✅ Strategy card updates with new values
✅ Still appears in the same activity's strategy list

---

## 🧪 Test Scenario 8: Delete Strategy

### Goal
Test strategy deletion within activity context.

### Steps
1. Click "Delete" on one strategy
2. Confirm deletion

### Expected Result
✅ Confirmation dialog appears
✅ Strategy removes from list
✅ Activity cluster count decreases
✅ If last strategy deleted, empty state returns

---

## 🧪 Test Scenario 9: Browser Refresh

### Goal
Verify state persists across page reloads.

### Steps
1. From the Cluster Strategy Manager view (with strategies)
2. Press F5 or Ctrl+R to refresh the page

### Expected Result
✅ Page reloads successfully
✅ Activity information still displays
✅ All strategies still visible in list
✅ No errors in console
✅ URL remains correct

---

## 🧪 Test Scenario 10: Design System Compliance

### Goal
Verify visual design matches the app's established aesthetic.

### Steps
1. Visually inspect the Cluster Strategy Manager view
2. Check:
   - Glassmorphic cards (semi-transparent with blur)
   - Fluent UI 2 components (buttons, badges, cards)
   - Poppins font family throughout
   - Proper spacing and padding
   - Status colors (success green, warning amber, error red)
   - Smooth animations and transitions

### Expected Result
✅ Visual style matches rest of the app
✅ No raw/unstyled elements
✅ Responsive layout (try resizing browser)
✅ Hover states work on buttons
✅ Icons render correctly

---

## 🐛 Known Issues & Workarounds

### Issue: Activity data is mocked
**Status**: Expected - Phase 4 will integrate real API

**What you'll see**: Activity data (name, status, dates) is hardcoded in ClusterStrategyManagerView

**Workaround**: None needed, this is temporary for MVP testing

### Issue: Progress doesn't auto-calculate
**Status**: Expected - Phase 4 feature

**What you'll see**: Progress bar always shows mock value (45%)

**Workaround**: Phase 4 will implement auto-calculation from strategy completion

### Issue: Strategies don't appear in timeline
**Status**: Expected - Phase 5 feature

**What you'll see**: Gantt chart doesn't show cluster strategies as sub-tasks

**Workaround**: Phase 5 will add timeline integration

---

## 🔍 Debugging Tips

### Console Errors
Open browser console (F12) and check for:
```
✗ 404 errors → API endpoint not found (backend routing issue)
✗ CORS errors → Backend not allowing frontend requests
✗ TypeScript errors → Component props mismatch
```

### Network Inspection
1. Open Network tab (F12 → Network)
2. Navigate to cluster strategy manager
3. Look for API calls to:
   - `GET /api/v1/projects/{id}/activities/{activityId}/cluster-strategies`
4. Check response:
   - Status 200 → Success
   - Status 404 → Route not registered
   - Status 500 → Backend error

### Backend Logs
Check backend terminal output for:
```bash
# Backend should show:
[INFO] GET /api/v1/projects/.../activities/.../cluster-strategies
[INFO] Response: 200 OK
```

### Database Verification
```bash
# Check if strategies have activity_id
curl -s http://localhost:3003/api/v1/projects/test-project-001/cluster-strategies | jq '.[].activity_id'
```

---

## ✅ Success Criteria

Consider the integration successful if:

- [x] ✅ All 3 services running (SurrealDB, Backend, Frontend)
- [ ] ✅ Clicking migration activity navigates to cluster strategy manager
- [ ] ✅ Activity context displays correctly (header, breadcrumbs, progress)
- [ ] ✅ Can create cluster strategies within activity context
- [ ] ✅ Strategies save with `activity_id` linkage
- [ ] ✅ Can edit and delete strategies
- [ ] ✅ Navigation back to project workspace works
- [ ] ✅ Non-migration activities still open edit modal
- [ ] ✅ Design system compliance verified
- [ ] ✅ No console errors during normal usage

---

## 🚀 What's Next

After successful testing of Phases 1-3:

**Phase 4 - Progress Rollup** (~2 hours):
- Implement auto-calculation of activity progress
- Update migration metadata when strategies change

**Phase 5 - Timeline Integration** (~3 hours):
- Show cluster strategies in Gantt chart
- Display domino dependencies

**Phase 6 - Activity Summary** (~2 hours):
- Add migration metadata to activity cards
- Show cluster count badges

**Phase 7 - Cleanup** (~2 hours):
- Remove standalone migration hub
- Add quick actions
- Final testing

---

## 📊 Testing Results Template

Copy this template to report results:

```markdown
## Test Results - [Your Name] - [Date]

### Environment
- OS: Linux
- Browser: [Chrome/Firefox/etc.]
- Backend Version: Latest (Oct 16, 2025)
- Frontend Version: Latest (Oct 16, 2025)

### Test Scenario Results

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1. Navigation Flow | ✅ / ❌ | |
| 2. Add Strategy | ✅ / ❌ | |
| 3. Navigation Back | ✅ / ❌ | |
| 4. Context Preservation | ✅ / ❌ | |
| 5. Non-Migration Activities | ✅ / ❌ | |
| 6. Multiple Strategies | ✅ / ❌ | |
| 7. Edit Strategy | ✅ / ❌ | |
| 8. Delete Strategy | ✅ / ❌ | |
| 9. Browser Refresh | ✅ / ❌ | |
| 10. Design System | ✅ / ❌ | |

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Assessment
[Pass / Fail / Partial]

### Recommendations
[Your feedback and suggestions]
```

---

**Happy Testing! 🎉**

For questions or issues, check:
- `ACTIVITY_DRIVEN_INTEGRATION_PROGRESS.md` - Full implementation details
- `ACTIVITY_DRIVEN_MIGRATION_PLAN.md` - Original design plan
- Browser console (F12) for runtime errors
- Backend logs for API errors
