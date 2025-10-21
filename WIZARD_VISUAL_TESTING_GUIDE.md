# Migration Wizard - Visual Testing Walkthrough 🎨

**Date:** October 21, 2025  
**Server:** http://localhost:1420  
**Status:** 🟢 Ready for Testing  

---

## 🎬 Complete Testing Scenario

### Scenario: Migrate 50 Production VMs from VMware to Hyper-V

**Business Context:**  
Your organization is migrating from VMware ESXi to Microsoft Hyper-V for cost optimization. You have 50 production VMs across 2 source clusters that need to be migrated to a new Hyper-V infrastructure with Storage Spaces Direct.

---

## 📸 Expected Screenshots / Visual Validation

### **Opening the Wizard**

**Action:** Click "Schedule Migration" button in project workspace

**Expected Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│  Migration Planning Wizard                              [X] │
├─────────────────────────────────────────────────────────────┤
│  Step 1 of 5: Source Selection                              │
│  ● ○ ○ ○ ○                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Purple glass modal with gradient background]              │
│                                                              │
│  [Cancel]                              [Next (disabled)] │
└─────────────────────────────────────────────────────────────┘
```

**Visual Checklist:**
- [ ] Modal width: ~900px, centered
- [ ] Title: "Migration Planning Wizard" (large, bold)
- [ ] Step indicator: 5 circles, first filled
- [ ] Background: Semi-transparent with blur
- [ ] Gradient overlay: Purple to blue
- [ ] Cancel button: Bottom-left, ghost variant
- [ ] Next button: Bottom-right, disabled state (greyed)

---

## 🎯 Step-by-Step Visual Validation

### **Step 1: Source Selection** 🔍

#### Visual Layout:
```
┌──────────────────────────────────────────────────────┐
│  Step 1 of 5: Source Selection                       │
│  ● ○ ○ ○ ○                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  📁 RVTools File *                                   │
│  [Demo: Production Datacenter (125 VMs)    ▼]       │
│                                                       │
│  🔍 Filter by Cluster                                │
│  [All Clusters                             ▼]       │
│                                                       │
│  📝 VM Name Pattern                                  │
│  [e.g., web-*, db-*                         ]       │
│                                                       │
│  ☑️ Include Powered Off VMs                          │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Workload Summary                          │      │
│  ├────────────────────────────────────────────┤      │
│  │  Total VMs:      [125] (blue badge)       │      │
│  │  Total vCPUs:    [500] (purple badge)     │      │
│  │  Total Memory:   [2048 GB] (green badge)  │      │
│  │  Total Storage:  [50 TB] (orange badge)   │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  [Cancel]                              [Next →]     │
└──────────────────────────────────────────────────────┘
```

**Visual Validation Points:**
- [ ] **RVTools Dropdown:**
  - Label: "RVTools File" with red asterisk (*)
  - Dropdown shows 3 options when clicked
  - Purple Glass styling with glassmorphism
  - Icon: 📁 (document icon)

- [ ] **Cluster Filter Dropdown:**
  - Label: "Filter by Cluster"
  - Default: "All Clusters"
  - Options: All, Production Cluster 01, Production Cluster 02, Dev/Test
  - Icon: 🔍 (search/filter icon)

- [ ] **VM Name Pattern Input:**
  - Label: "VM Name Pattern"
  - Placeholder: "e.g., web-*, db-*"
  - Helper text visible below
  - Icon: 📝 (edit icon)

- [ ] **Powered Off Toggle:**
  - Checkbox with label on right
  - Purple accent when checked
  - Default: unchecked

- [ ] **Workload Summary Card:**
  - Header: "Workload Summary" (bold)
  - 4 rows with badges:
    - Blue badge (VMs)
    - Purple badge (vCPUs)
    - Green badge (Memory)
    - Orange badge (Storage)
  - Numbers update when filters change
  - Card has subtle shadow and border
  - Glass effect applied

- [ ] **Next Button State:**
  - Disabled (grey) when no RVTools selected
  - Enabled (purple gradient) after selection
  - Hover effect: slight scale and glow

**Action Sequence:**
1. Select "Demo: Production Datacenter (125 VMs)"
2. Watch workload summary populate (instant)
3. Select "Production Cluster 01" filter
4. Watch VM count drop (125 → ~50)
5. Verify Next button enabled
6. Click Next

---

### **Step 2: Destination Cluster Builder** 🏗️

#### Visual Layout:
```
┌──────────────────────────────────────────────────────┐
│  Step 2 of 5: Destination Clusters                   │
│  ○ ● ○ ○ ○                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [+ Add Cluster]                                     │
│                                                       │
│  ┌────────────────────────────────────────────┐      │
│  │  Hyper-V Cluster 01                        │      │
│  │  ┌──────┐  ┌──────────────────┐  [Remove] │      │
│  │  │💻    │  │ Hyper-V          │            │      │
│  │  │      │  │ S2D Storage      │            │      │
│  │  │      │  │ 4 Nodes          │            │      │
│  │  └──────┘  └──────────────────┘            │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  ┌─ Cluster Configuration ──────────────────┐        │
│  │  Cluster Name:                            │        │
│  │  [Hyper-V Cluster 01              ]      │        │
│  │                                            │        │
│  │  Hypervisor Type:                         │        │
│  │  [Hyper-V                          ▼]    │        │
│  │                                            │        │
│  │  Storage Type:                            │        │
│  │  [Storage Spaces Direct (S2D)     ▼]    │        │
│  │                                            │        │
│  │  Hardware Nodes: (coming soon)            │        │
│  └───────────────────────────────────────────┘        │
│                                                       │
│  [← Previous]  [Cancel]              [Next →]       │
└──────────────────────────────────────────────────────┘
```

**Visual Validation Points:**
- [ ] **Add Cluster Button:**
  - Icon: + symbol
  - Primary button style (purple gradient)
  - Positioned at top-left

- [ ] **Cluster Card:**
  - Large heading with cluster name
  - Icon: 💻 (computer/server)
  - Two badges: Hypervisor type (blue), Storage type (green)
  - Node count displayed
  - Remove button (danger red)
  - Card has interactive hover state (slight lift)
  - Glass effect with border

- [ ] **Configuration Panel:**
  - Appears when "Add Cluster" clicked
  - Three inputs: Name, Hypervisor, Storage
  - All using Purple Glass components
  - "Hardware Nodes" section shows placeholder
  - Panel has distinct border/shadow

- [ ] **Multiple Clusters:**
  - Can add 2-3 clusters
  - Each card stacked vertically
  - Scrollable if many clusters added

**Action Sequence:**
1. Click "Add Cluster"
2. Enter name: "Hyper-V Cluster 01"
3. Select Hypervisor: "Hyper-V"
4. Select Storage: "Storage Spaces Direct (S2D)"
5. Verify cluster card appears
6. (Optional) Add second cluster
7. Verify Next button enabled
8. Click Next

---

### **Step 3: Capacity Visualizer** 📊

#### Visual Layout:
```
┌──────────────────────────────────────────────────────┐
│  Step 3 of 5: Capacity Analysis                      │
│  ○ ○ ● ○ ○                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─ Analyzing... ─────────────────────────────┐      │
│  │  [Spinner] Analyzing capacity...           │      │
│  └────────────────────────────────────────────┘      │
│                        ⬇️                             │
│  ┌─ Results ──────────────────────────────────┐      │
│  │  ✅ Sufficient Capacity                     │      │
│  │  Current configuration can handle workload  │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  Resource Utilization:                               │
│                                                       │
│  CPU Utilization: 65%                                │
│  [████████████░░░░░░] 65%   🟢 Healthy              │
│                                                       │
│  Memory Utilization: 72%                             │
│  [██████████████░░░░] 72%   🟡 Moderate             │
│                                                       │
│  Storage Utilization: 45%                            │
│  [█████████░░░░░░░░░] 45%   🟢 Healthy              │
│                                                       │
│  ⚠️ Potential Bottlenecks (1):                       │
│  ┌────────────────────────────────────────────┐      │
│  │  🟡 Memory - Cluster may experience...     │      │
│  │  Recommendation: Add 256GB RAM or...       │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  [🔄 Re-analyze Capacity]                           │
│                                                       │
│  [← Previous]  [Cancel]              [Next →]       │
└──────────────────────────────────────────────────────┘
```

**Visual Validation Points:**
- [ ] **Loading State (first 1.5s):**
  - Large spinner (purple)
  - "Analyzing capacity..." text
  - Entire content area shows loading

- [ ] **Status Banner:**
  - Green background: "✅ Sufficient Capacity"
  - OR Red background: "❌ Insufficient Capacity"
  - Descriptive message below
  - Icon changes based on status

- [ ] **Progress Bars:**
  - Three bars: CPU, Memory, Storage
  - Each shows percentage (left) and label (right)
  - Color coding:
    - Green (<70%): #10b981
    - Yellow (70-80%): #f59e0b
    - Orange (80-90%): #f97316
    - Red (≥90%): #ef4444
  - Smooth gradient fill
  - Height: ~20px, rounded corners

- [ ] **Bottleneck Cards:**
  - Only shown if warnings exist
  - Icon matches severity (🔴 Critical, 🟡 Warning, 🔵 Info)
  - Title shows resource + issue
  - Description explains problem
  - Recommendation provides solution
  - Card color matches severity

- [ ] **Re-analyze Button:**
  - Secondary button style
  - Icon: 🔄 (refresh)
  - Positioned below warnings

**Action Sequence:**
1. Wait for auto-analysis (1.5s spinner)
2. Verify progress bars appear with percentages
3. Check color coding matches thresholds
4. Read bottleneck warnings (if any)
5. (Optional) Click "Re-analyze Capacity"
6. Watch re-analysis occur
7. Click Next

---

### **Step 4: Network Configuration** 🌐

#### Visual Layout:
```
┌──────────────────────────────────────────────────────┐
│  Step 4 of 5: Network Configuration                  │
│  ○ ○ ○ ● ○                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [+ Add Network Mapping]                             │
│                                                       │
│  Network Mappings:                                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Source              →    Destination      │      │
│  │  ┌────────────┐      →    ┌────────────┐  │      │
│  │  │ VLAN 100   │      →    │ VLAN 200   │  │      │
│  │  │ 192.168... │      →    │ 10.0.1...  │  │      │
│  │  └────────────┘      →    └────────────┘  │      │
│  │  IP Strategy: [DHCP] 🔵                   │      │
│  │                                [Remove]    │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  [📊 Show Network Diagram]                          │
│                                                       │
│  ┌─ Network Topology ────────────────────────┐      │
│  │                                            │      │
│  │   ╔══════════════╗    ╔══════════════╗    │      │
│  │   ║  Source      ║    ║ Destination  ║    │      │
│  │   ║   VMware     ║    ║   Hyper-V    ║    │      │
│  │   ╠══════════════╣    ╠══════════════╣    │      │
│  │   ║ VLAN 100     ║ ┄┄>║ VLAN 200     ║    │      │
│  │   ║ 192.168.1... ║    ║ 10.0.1...    ║    │      │
│  │   ║              ║    ║ (DHCP)       ║    │      │
│  │   ╚══════════════╝    ╚══════════════╝    │      │
│  │                                            │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  [← Previous]  [Cancel]              [Next →]       │
└──────────────────────────────────────────────────────┘
```

**Visual Validation Points:**
- [ ] **Add Mapping Button:**
  - Primary button (purple gradient)
  - Icon: + symbol
  - Top-left position

- [ ] **Mapping Cards:**
  - Three-column grid layout:
    - Left: Source network (blue accent)
    - Middle: Arrow (→)
    - Right: Destination network (purple accent)
  - VLAN numbers prominent
  - Subnets below in smaller text
  - IP strategy badge below destination:
    - DHCP: Blue badge
    - Static IP: Purple badge
    - Preserve Source: Green badge
  - Remove button (danger red) in top-right

- [ ] **Show Diagram Button:**
  - Secondary button
  - Icon: 📊 (chart/diagram)
  - Toggles to "Hide Network Diagram" when clicked

- [ ] **Mermaid Diagram:**
  - ⚠️ **CRITICAL TEST:** Diagram must render!
  - Two subgraphs visible:
    - Left: "Source VMware" (blue border #3b82f6)
    - Right: "Destination Hyper-V" (purple border #8b5cf6)
  - Nodes show:
    - VLAN number (large text)
    - Subnet (smaller text)
    - IP strategy on destination (parentheses)
  - Dotted arrows (- - ->) connect source to dest
  - Diagram width: 100% of container
  - Clean, professional appearance
  - No rendering errors

**Action Sequence:**
1. Click "Add Network Mapping"
2. Enter Source VLAN: 100, Subnet: 192.168.1.0/24
3. Enter Dest VLAN: 200, Subnet: 10.0.1.0/24
4. Select IP Strategy: "DHCP"
5. Verify mapping card appears
6. Click "Show Network Diagram"
7. **Wait for Mermaid render (1-2 seconds)**
8. **Verify diagram displays correctly** ⚠️
9. Add 1-2 more mappings
10. Verify diagram updates dynamically
11. Click Next

---

### **Step 5: Review & Generate HLD** 📄

#### Visual Layout (Pre-Generation):
```
┌──────────────────────────────────────────────────────┐
│  Step 5 of 5: Review & Generate HLD                  │
│  ○ ○ ○ ○ ●                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─ Source Selection ──────────────────────┐         │
│  │  RVTools File: Demo - Production DC      │         │
│  │  Total VMs: 50  vCPUs: 200  RAM: 800GB   │         │
│  │  Filters: Production Cluster 01           │         │
│  └───────────────────────────────────────────┘         │
│                                                       │
│  ┌─ Destination Clusters ──────────────────┐         │
│  │  Hyper-V Cluster 01                      │         │
│  │  [Hyper-V] [S2D] 4 nodes                │         │
│  └───────────────────────────────────────────┘         │
│                                                       │
│  ┌─ Capacity Analysis ──────────────────────┐         │
│  │  CPU: 65% 🟢  Memory: 72% 🟡  Storage: 45% 🟢 │         │
│  │  Status: ✅ Sufficient Capacity          │         │
│  │  Warnings: 1 bottleneck detected         │         │
│  └───────────────────────────────────────────┘         │
│                                                       │
│  ┌─ Network Mappings ───────────────────────┐         │
│  │  VLAN 100 → VLAN 200  (DHCP)            │         │
│  │  VLAN 101 → VLAN 201  (Static IP)       │         │
│  └───────────────────────────────────────────┘         │
│                                                       │
│  ┌─ Generate HLD Document ──────────────────┐         │
│  │           📄 (large purple icon)          │         │
│  │                                            │         │
│  │  Document will include:                   │         │
│  │  ✓ Executive Summary                      │         │
│  │  ✓ Source VM Inventory                    │         │
│  │  ✓ Destination Architecture               │         │
│  │  ✓ Capacity Planning                      │         │
│  │  ✓ Network Diagrams                       │         │
│  │  ✓ Migration Runbook                      │         │
│  │                                            │         │
│  │  [📥 Generate HLD Document]               │         │
│  └────────────────────────────────────────────┘         │
│                                                       │
│  [← Previous]  [Cancel]              [Finish]        │
└──────────────────────────────────────────────────────┘
```

#### Visual Layout (Generating):
```
┌──────────────────────────────────────────────────────┐
│  Step 5 of 5: Review & Generate HLD                  │
│  ○ ○ ○ ○ ●                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  (Summary cards above...)                            │
│                                                       │
│  ┌─ Generate HLD Document ──────────────────┐         │
│  │                                            │         │
│  │           [Large Spinner 🌀]              │         │
│  │                                            │         │
│  │    Generating HLD Document...             │         │
│  │    Compiling migration plan details...    │         │
│  │                                            │         │
│  └────────────────────────────────────────────┘         │
│                                                       │
│  [← Previous]  [Cancel]              [Finish]        │
└──────────────────────────────────────────────────────┘
```

#### Visual Layout (Generated):
```
┌──────────────────────────────────────────────────────┐
│  Step 5 of 5: Review & Generate HLD                  │
│  ○ ○ ○ ○ ●                                           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  (Summary cards above...)                            │
│                                                       │
│  ┌─ Generate HLD Document ──────────────────┐         │
│  │           ✅ (large green checkmark)       │         │
│  │                                            │         │
│  │  HLD Document Generated Successfully!     │         │
│  │  Your migration plan is ready.            │         │
│  │                                            │         │
│  │  [💾 Download HLD Document]               │         │
│  │  [🔄 Regenerate]                          │         │
│  │                                            │         │
│  │  ℹ️ Migration plan saved to project       │         │
│  └────────────────────────────────────────────┘         │
│                                                       │
│  [← Previous]  [Cancel]              [✓ Finish]      │
└──────────────────────────────────────────────────────┘
```

**Visual Validation Points:**
- [ ] **Summary Cards (4 total):**
  - Source Selection: Compact metrics, filter descriptions
  - Destination Clusters: List of clusters with badges
  - Capacity Analysis: Utilization %s with color coding, status badge
  - Network Mappings: Table format with arrows, IP strategy badges
  - All cards use Purple Glass design
  - Proper spacing between cards

- [ ] **HLD Section - Ready State:**
  - Large purple document icon (64x64px)
  - Feature list (6 checkmarks)
  - Primary button: "Generate HLD Document"
  - Button enabled if Steps 1-2 complete
  - Button disabled if validation fails

- [ ] **HLD Section - Generating State:**
  - Large purple spinner (animated rotation)
  - Heading: "Generating HLD Document..."
  - Subtext: "Compiling migration plan details..."
  - Duration: 3 seconds

- [ ] **HLD Section - Success State:**
  - Large green checkmark icon (64x64px)
  - Success message: "HLD Document Generated Successfully!"
  - Download button: Primary style, icon 💾
  - Regenerate button: Secondary style, icon 🔄
  - Info banner: Blue background, informational text
  - Finish button: Enabled (green accent)

**Action Sequence:**
1. Review all 4 summary cards
2. Verify data matches previous steps
3. Scroll to "Generate HLD Document" section
4. Click "Generate HLD Document" button
5. Watch spinner for 3 seconds
6. Verify success state appears
7. Verify checkmark icon visible
8. Verify Download button enabled
9. (Optional) Click "Regenerate" to test re-generation
10. Click "Finish" button
11. Verify wizard closes
12. Return to project workspace

---

## 🎨 Design System Validation

### Color Palette Check:
- [ ] **Primary Purple:** #8b5cf6 (buttons, accents)
- [ ] **Secondary Blue:** #3b82f6 (info badges, links)
- [ ] **Success Green:** #10b981 (checkmarks, healthy status)
- [ ] **Warning Yellow:** #f59e0b (moderate utilization)
- [ ] **Error Red:** #ef4444 (critical issues, remove buttons)
- [ ] **Orange:** #f97316 (storage badges, high utilization)

### Typography Check:
- [ ] **Font Family:** Poppins (all text)
- [ ] **Headings:** Bold weight, proper hierarchy (h2 > h3 > h4)
- [ ] **Body Text:** Regular weight, readable size (14-16px)
- [ ] **Labels:** Semi-bold, proper spacing

### Glassmorphism Check:
- [ ] **Modal Background:** `rgba(15, 23, 42, 0.95)` + backdrop-blur-xl
- [ ] **Cards:** `rgba(255, 255, 255, 0.05)` + border + shadow
- [ ] **Inputs:** Glass effect on focus
- [ ] **Buttons:** Subtle transparency + hover glow

### Component Library Check:
- [ ] **All buttons:** PurpleGlassButton (no native `<button>`)
- [ ] **All inputs:** PurpleGlassInput (no native `<input>`)
- [ ] **All dropdowns:** PurpleGlassDropdown (no Fluent `<Dropdown>`)
- [ ] **All cards:** PurpleGlassCard
- [ ] **Checkboxes:** PurpleGlassCheckbox

---

## 🚨 Critical Visual Bugs to Watch For

### High Priority:
1. **Mermaid Diagram Fails to Render**
   - Symptoms: Blank area, error text, or loading forever
   - Location: Step 4, after clicking "Show Network Diagram"
   - Impact: Critical - core feature failure

2. **Progress Bars Show Incorrect Colors**
   - Symptoms: All bars same color, or wrong thresholds
   - Location: Step 3, capacity utilization section
   - Impact: High - misleading data visualization

3. **Next Button Stays Disabled**
   - Symptoms: Button greyed out even when validation passes
   - Location: Any step
   - Impact: High - blocks wizard progression

4. **Summary Cards Missing Data**
   - Symptoms: Empty fields, "undefined", or missing cards
   - Location: Step 5, review section
   - Impact: High - incomplete review

### Medium Priority:
1. **Glassmorphism Not Applied**
   - Symptoms: Solid backgrounds, no blur, harsh borders
   - Impact: Medium - design inconsistency

2. **Animation Jank**
   - Symptoms: Stuttering transitions, delayed spinners
   - Impact: Medium - poor UX

3. **TypeScript Errors in Console**
   - Symptoms: Red error messages in browser console
   - Impact: Medium - code quality issue

---

## ✅ Success Screenshots

### What Success Looks Like:

**Step 1:** Clean input forms, populated summary card, enabled Next button  
**Step 2:** Multiple cluster cards visible, configuration panel functional  
**Step 3:** Color-coded progress bars, clear bottleneck warnings  
**Step 4:** **Mermaid diagram renders perfectly** with blue/purple subgraphs  
**Step 5:** All 4 summary cards populated, HLD generation completes, green checkmark  

---

## 📊 Visual Testing Score Card

| Criteria | Weight | Score | Notes |
|----------|--------|-------|-------|
| Wizard Opens | 10% | __/10 | |
| Step Navigation | 15% | __/10 | |
| Form Components | 15% | __/10 | |
| Data Display | 15% | __/10 | |
| **Mermaid Diagram** | **20%** | __/10 | **Critical** |
| HLD Generation | 15% | __/10 | |
| Design System | 10% | __/10 | |

**Total Score:** ____/100  
**Pass Threshold:** 80/100

---

## 🎬 Recording Recommendations

If recording a demo video:
1. Start from project workspace view
2. Show clicking "Schedule Migration" button
3. Walk through all 5 steps at moderate pace
4. **Highlight Mermaid diagram** (zoom in if needed)
5. Show HLD generation complete workflow
6. End with Finish button click

**Estimated Recording Time:** 3-5 minutes

---

**Visual Testing Complete!** ✅  
**Tester:** _______________  
**Date:** October 21, 2025  
**Overall Visual Quality:** ⭐⭐⭐⭐⭐ __/5
