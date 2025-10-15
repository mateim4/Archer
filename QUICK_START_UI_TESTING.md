# 🚀 Quick Start: Testing Migration Hub UI

## Direct Access URLs

### Option 1: Test with Existing Project
```
http://localhost:1420/app/projects/test-project-001/migration-workspace
```

### Option 2: Navigate Manually
1. Open: http://localhost:1420
2. Click on "Projects" in the sidebar
3. Select or create a project
4. Look for "Migration Workspace" tab or button

---

## What You Should See

### 1. **Landing Page** (http://localhost:1420)
- Modern glassmorphic design
- Application title: "LCMDesigner" or "InfraAID"
- Navigation menu/sidebar
- "Projects" menu item

### 2. **Migration Workspace** (/app/projects/test-project-001/migration-workspace)

**Overview Cards (Top Section):**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Clusters   │     VMs     │  Capacity   │  Timeline   │
│      0      │      0      │   0% Used   │  0 Days     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Main Section:**
- "Configure Strategy" button (prominent, Fluent UI style)
- Strategy list (empty initially or showing test strategies from API)
- Glassmorphic cards with blur effect
- Poppins font throughout

### 3. **When You Click "Configure Strategy"**

**Modal Should Open with These Sections:**

```
┌─────────────────────────────────────────────────────┐
│  Configure Cluster Migration Strategy         [×]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Strategy Name: [___________________________]        │
│                                                      │
│  Source Cluster: [___________________________]       │
│                                                      │
│  Target Cluster: [___________________________]       │
│                                                      │
│  Strategy Type: [▼ Select Strategy Type]            │
│    ◆ NewHardwarePurchase                            │
│    ◆ DominoHardwareSwap                             │
│    ◆ ExistingFreeHardware                           │
│                                                      │
│  ─────── Conditional Fields ───────                 │
│  (Changes based on Strategy Type selected)          │
│                                                      │
│  ─────── Resource Requirements ───────              │
│  CPU Cores: [_____] Memory (GB): [_____]            │
│  Storage (TB): [_____]                              │
│                                                      │
│  ─────── Timeline ───────                           │
│  Planned Start: [📅 Date Picker]                    │
│  Planned Completion: [📅 Date Picker]               │
│                                                      │
│  ─────── Notes ───────                              │
│  [_________________________________________]         │
│  [_________________________________________]         │
│                                                      │
│  [Cancel]                         [Save Strategy]   │
└─────────────────────────────────────────────────────┘
```

---

## Quick Test Scenarios

### Test 1: Create Strategy via UI (2 minutes)

**Steps:**
1. Navigate to Migration Workspace
2. Click "Configure Strategy"
3. Fill in:
   - Strategy Name: "UI Test Strategy"
   - Source Cluster: "VMware-Test"
   - Target Cluster: "HyperV-Test"
   - Strategy Type: Select "NewHardwarePurchase"
   - Hardware Basket Items: Type "basket-test"
   - CPU: 64
   - Memory: 256
   - Storage: 5.0
   - Notes: "Testing UI"
4. Click "Save Strategy"

**Expected Result:**
- ✅ Modal closes
- ✅ New strategy card appears in list
- ✅ Card shows correct data
- ✅ No console errors

### Test 2: Verify API Integration (1 minute)

**Steps:**
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Create a strategy (see Test 1)
4. Look for API call

**Expected in Network Tab:**
```
POST /api/v1/projects/test-project-001/cluster-strategies
Status: 200 OK
Response: {"success": true, "data": {...}}
```

### Test 3: Strategy List Display (1 minute)

**Steps:**
1. Refresh the page
2. Strategies should load automatically

**Expected:**
- ✅ Existing strategies display
- ✅ Each card shows:
  - Strategy name
  - Target cluster
  - Strategy type badge
  - Status badge
  - Resource summary
- ✅ Cards use glassmorphic style
- ✅ Poppins font applied

### Test 4: Error Handling (1 minute)

**Steps:**
1. Click "Configure Strategy"
2. Leave all fields empty
3. Click "Save Strategy"

**Expected:**
- ✅ Validation errors appear
- ✅ Required fields highlighted
- ✅ No API call made
- ✅ Modal stays open

---

## Troubleshooting

### Issue: "Cannot GET /app/projects/..."
**Solution:** Navigate from home page instead of direct URL

### Issue: Modal doesn't open
**Check:**
- Console for errors (F12)
- Button click event registered
- Modal component imported correctly

### Issue: API calls fail (404)
**Check:**
- Backend running on port 3001
- Network tab shows correct endpoint
- CORS enabled (should be with CorsLayer::permissive)

### Issue: Blank page
**Check:**
- Console errors
- React router paths
- Component imports

---

## What to Document

While testing, note:

### ✅ Working Features
- [ ] Navigation works
- [ ] Modal opens/closes
- [ ] Forms validate
- [ ] API integration successful
- [ ] List displays correctly
- [ ] Styling looks good

### ❌ Bugs Found
- [ ] Console errors (copy error message)
- [ ] UI glitches (describe or screenshot)
- [ ] API failures (check Network tab)
- [ ] Validation issues
- [ ] Performance problems

### 💡 Improvements Needed
- [ ] UX enhancements
- [ ] Missing features
- [ ] Design tweaks
- [ ] Error message clarity

---

## Console Commands for Testing

**Check if frontend is running:**
```bash
curl -s http://localhost:1420 | head -20
```

**Check API from browser console:**
```javascript
// Test API connectivity
fetch('http://127.0.0.1:3001/api/v1/projects/test-project-001/cluster-strategies')
  .then(r => r.json())
  .then(d => console.log(d));
```

**Check for errors:**
```javascript
// In browser console
console.log(window.performance.getEntries());
```

---

## Next Steps After UI Testing

1. **Document Results** → Create FRONTEND_TESTING_RESULTS.md
2. **Fix Critical Bugs** → UI blockers
3. **Test All Components** → Complete the checklist
4. **Integration Test** → Full user workflow
5. **Polish** → UX improvements

---

**🎯 Start here:** http://localhost:1420/app/projects/test-project-001/migration-workspace

**Happy Testing!** 🧪✨
