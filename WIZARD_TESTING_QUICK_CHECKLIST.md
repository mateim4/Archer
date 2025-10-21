# Migration Wizard - Quick Testing Checklist ✅

**Server:** http://localhost:1420  
**Status:** 🟢 Running

---

## 🚀 Quick Start

1. Open: http://localhost:1420
2. Navigate to any project
3. Click **"Schedule Migration"** button
4. Wizard opens → Start testing!

---

## ⚡ 5-Minute Quick Test

### Step 1: Source Selection (30s)
- [ ] Select RVTools dropdown → "Demo: Production Datacenter"
- [ ] Verify workload summary shows: VMs, vCPUs, Memory, Storage
- [ ] Click **Next**

### Step 2: Destination Clusters (45s)
- [ ] Click **"Add Cluster"**
- [ ] Name: "Test Cluster 01"
- [ ] Hypervisor: "Hyper-V"
- [ ] Storage: "Storage Spaces Direct"
- [ ] Verify cluster card appears
- [ ] Click **Next**

### Step 3: Capacity Visualizer (30s)
- [ ] Wait for auto-analysis (1.5s spinner)
- [ ] Verify 3 progress bars: CPU, Memory, Storage
- [ ] Check color coding (green/yellow/orange/red)
- [ ] Verify overall status banner
- [ ] Click **Next**

### Step 4: Network Configuration (60s)
- [ ] Click **"Add Network Mapping"**
- [ ] Source VLAN: 100, Subnet: 192.168.1.0/24
- [ ] Dest VLAN: 200, Subnet: 10.0.1.0/24
- [ ] IP Strategy: "DHCP"
- [ ] Click **"Show Network Diagram"**
- [ ] **⚠️ CRITICAL:** Verify Mermaid diagram renders
- [ ] Check blue source subgraph + purple dest subgraph
- [ ] Verify dotted arrow connects networks
- [ ] Click **Next**

### Step 5: Review & Generate HLD (60s)
- [ ] Verify 4 summary cards display all previous steps
- [ ] Click **"Generate HLD Document"**
- [ ] Watch spinner (3s)
- [ ] Verify green checkmark appears
- [ ] Verify **"Download HLD Document"** button enabled
- [ ] Click **"Finish"**
- [ ] Wizard closes ✅

---

## 🎯 Critical Features to Test

### Must-Pass Features:
1. ✅ **Wizard Opens:** Modal appears on button click
2. ✅ **Step Navigation:** Can advance through all 5 steps
3. ✅ **Validation:** Cannot skip required fields (RVTools, Clusters, Networks)
4. ✅ **Mermaid Diagram:** Network topology renders in Step 4
5. ✅ **HLD Generation:** 3-state workflow completes (ready→generating→success)
6. ✅ **State Persistence:** Data retained when navigating back/forward
7. ✅ **Purple Glass Design:** All components use design system

### Nice-to-Have Features:
- [ ] Previous button navigation works
- [ ] Cancel button closes wizard
- [ ] Remove cluster/network buttons work
- [ ] Re-analyze capacity button triggers new calculation
- [ ] Regenerate HLD button re-runs generation

---

## 🐛 Known Limitations (Mock Data)

- No actual file upload (uses demo data)
- No real API calls (setTimeout simulations)
- No actual HLD document download (mock URL)
- Capacity calculations are randomized mock values
- No backend persistence

**These are EXPECTED in this testing phase!**

---

## 📊 Quick Pass/Fail

**Core Functionality:**
- [ ] ✅ PASS: All 5 steps navigable
- [ ] ✅ PASS: Validation blocks invalid advances
- [ ] ✅ PASS: Mermaid diagram renders
- [ ] ✅ PASS: HLD generation completes
- [ ] ❌ FAIL: ________________

**Visual/UX:**
- [ ] ✅ PASS: Purple Glass design consistent
- [ ] ✅ PASS: No TypeScript errors in console
- [ ] ✅ PASS: Responsive layout works
- [ ] ❌ FAIL: ________________

**Overall:** ⬜ PASS / ⬜ FAIL

---

## 🔍 What to Look For

### Good Signs ✅
- Smooth step transitions
- All components render immediately
- Mermaid diagram appears within 2 seconds
- Color-coded metrics easy to read
- Buttons enable/disable appropriately
- No console errors

### Red Flags 🚩
- TypeScript errors in browser console
- Mermaid diagram fails to render
- Step navigation breaks
- Components not using Purple Glass design
- Validation allows skipping required fields
- Wizard freezes or crashes

---

## 🚦 Decision Tree

```
Start Testing
     |
     v
Wizard Opens? ──NO──> CRITICAL BUG - Stop testing
     |
    YES
     |
     v
Navigate to Step 5? ──NO──> HIGH BUG - Document & continue
     |
    YES
     |
     v
Mermaid Renders? ──NO──> MEDIUM BUG - Document & continue
     |
    YES
     |
     v
HLD Generation Works? ──NO──> MEDIUM BUG - Document & continue
     |
    YES
     |
     v
✅ ALL TESTS PASS → Proceed to Backend Integration
```

---

## 📝 Quick Bug Report Template

**Bug #:** ___  
**Severity:** Critical / High / Medium / Low  
**Step:** 1 / 2 / 3 / 4 / 5  
**Issue:** ___  
**Expected:** ___  
**Actual:** ___  

---

## 🎉 Success Criteria

**Minimum to Pass:**
1. Wizard opens and displays Step 1
2. Can navigate through all 5 steps
3. Validation prevents invalid advances
4. Step 5 shows comprehensive review
5. HLD generation completes

**Bonus Points:**
- Mermaid diagram renders perfectly
- All animations smooth
- No console warnings/errors
- Design system 100% compliant

---

**Time Budget:** 5-10 minutes  
**Tested By:** _____________  
**Date:** October 21, 2025  
**Result:** ⬜ PASS / ⬜ FAIL
