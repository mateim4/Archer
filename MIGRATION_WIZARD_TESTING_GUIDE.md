# Migration Planning Wizard - End-to-End Testing Guide

**Date:** October 21, 2025  
**Status:** Ready for Testing  
**Testing Phase:** UI/UX Validation with Mock Data  

---

## 🎯 Testing Objectives

Validate the complete 5-step migration planning wizard workflow:
1. ✅ All UI components render correctly
2. ✅ Step navigation works (Next/Previous/Cancel)
3. ✅ Validation logic enforces requirements
4. ✅ Mock data displays properly in all steps
5. ✅ Mermaid diagrams render successfully
6. ✅ State persistence across steps
7. ✅ HLD generation workflow completes

---

## 🚀 Testing Prerequisites

### Environment Setup
- ✅ Frontend server running on `http://localhost:1420`
- ✅ Browser: Chrome/Firefox/Edge (latest version)
- ✅ No backend server required (using mock data)

### Access Point
1. Navigate to `http://localhost:1420`
2. Select or create a project
3. Click **"Schedule Migration"** button in project workspace
4. Wizard modal should open

---

## 📋 Test Cases

### **Test Case 1: Wizard Launch**

**Objective:** Verify wizard opens and displays Step 1

**Steps:**
1. Open project workspace view
2. Click "Schedule Migration" button
3. Verify wizard modal appears
4. Verify title: "Migration Planning Wizard"
5. Verify step indicator shows "Step 1 of 5: Source Selection"

**Expected Results:**
- ✅ Modal opens with proper dimensions
- ✅ Purple glass aesthetic applied
- ✅ Step indicator visible at top
- ✅ Cancel button in bottom-left
- ✅ Next button in bottom-right (should be disabled initially)

**Pass/Fail:** ________

---

### **Test Case 2: Step 1 - Source Selection**

**Objective:** Validate source VM selection and filtering

#### 2.1 RVTools Upload Dropdown
**Steps:**
1. Locate "RVTools File" dropdown
2. Click dropdown
3. Select "Demo: Production Datacenter (125 VMs)"

**Expected Results:**
- ✅ Dropdown displays 3 demo options
- ✅ Selection updates state
- ✅ Workload summary card updates automatically

#### 2.2 Cluster Filter
**Steps:**
1. Locate "Filter by Cluster" dropdown
2. Select "Production Cluster 01"

**Expected Results:**
- ✅ Dropdown shows 4 cluster options (All, Prod 01, Prod 02, Dev/Test)
- ✅ VM count in summary card decreases (125 → ~50)

#### 2.3 VM Name Pattern Filter
**Steps:**
1. Enter "web-*" in "VM Name Pattern" input
2. Verify summary card updates

**Expected Results:**
- ✅ Input accepts wildcard patterns
- ✅ VM count further filters
- ✅ Helper text shows example

#### 2.4 Powered-Off VMs Toggle
**Steps:**
1. Toggle "Include Powered Off VMs" checkbox
2. Verify summary card updates

**Expected Results:**
- ✅ Checkbox toggles state
- ✅ VM count changes based on toggle

#### 2.5 Workload Summary Card
**Steps:**
1. Verify summary card displays:
   - Total VMs count (blue badge)
   - Total vCPUs (purple badge)
   - Total Memory (green badge)
   - Total Storage (orange badge)

**Expected Results:**
- ✅ All 4 metrics visible
- ✅ Color-coded badges
- ✅ Proper units (GB for RAM, TB for storage)
- ✅ Values update when filters change

#### 2.6 Next Button Validation
**Steps:**
1. Without selecting RVTools file, click Next
2. Select RVTools file
3. Click Next

**Expected Results:**
- ✅ Next button disabled when no file selected
- ✅ Next button enabled after selection
- ✅ Advances to Step 2

**Pass/Fail:** ________

---

### **Test Case 3: Step 2 - Destination Cluster Builder**

**Objective:** Validate cluster configuration and management

#### 3.1 Add First Cluster
**Steps:**
1. Click "Add Cluster" button
2. Enter cluster name: "Hyper-V Cluster 01"
3. Select Hypervisor Type: "Hyper-V"
4. Select Storage Type: "Storage Spaces Direct (S2D)"
5. Verify cluster card appears

**Expected Results:**
- ✅ "Add Cluster" button visible
- ✅ Configuration panel appears after click
- ✅ Name input accepts text
- ✅ Hypervisor dropdown shows 3 options (Hyper-V, VMware ESXi, KVM)
- ✅ Storage dropdown shows 5 options (Local, SAN, NAS, S2D, vSAN)
- ✅ Cluster card displays with correct details

#### 3.2 Add Second Cluster
**Steps:**
1. Click "Add Cluster" again
2. Configure second cluster:
   - Name: "VMware Cluster 01"
   - Hypervisor: "VMware ESXi"
   - Storage: "vSAN"

**Expected Results:**
- ✅ Second cluster card appears
- ✅ Both clusters visible simultaneously
- ✅ Each card shows unique configuration

#### 3.3 Remove Cluster
**Steps:**
1. Click "Remove" button on second cluster card
2. Verify cluster removed

**Expected Results:**
- ✅ Remove button visible on each card
- ✅ Cluster card disappears immediately
- ✅ Remaining cluster still visible

#### 3.4 Hardware Node Selection (Placeholder)
**Steps:**
1. Verify "Hardware Nodes" section exists
2. Note placeholder text

**Expected Results:**
- ✅ Section visible in cluster config
- ✅ Placeholder indicates future integration

#### 3.5 Next Button Validation
**Steps:**
1. Remove all clusters and click Next
2. Add at least one cluster and click Next

**Expected Results:**
- ✅ Next button disabled with 0 clusters
- ✅ Next button enabled with ≥1 cluster
- ✅ Advances to Step 3

**Pass/Fail:** ________

---

### **Test Case 4: Step 3 - Capacity Visualizer**

**Objective:** Validate capacity analysis display and calculations

#### 4.1 Initial Analysis Trigger
**Steps:**
1. Wait for automatic capacity analysis (1.5s)
2. Observe loading state

**Expected Results:**
- ✅ Spinner displays during analysis
- ✅ "Analyzing capacity..." message visible
- ✅ Results appear after delay

#### 4.2 Utilization Progress Bars
**Steps:**
1. Verify three progress bars:
   - CPU Utilization
   - Memory Utilization
   - Storage Utilization
2. Check color coding

**Expected Results:**
- ✅ All 3 progress bars visible
- ✅ Percentage values displayed
- ✅ Color coding correct:
  - Green: <70%
  - Yellow: 70-80%
  - Orange: 80-90%
  - Red: ≥90%

#### 4.3 Bottleneck Warnings
**Steps:**
1. Verify "Potential Bottlenecks" section
2. Check warning cards

**Expected Results:**
- ✅ Warning cards display if utilization high
- ✅ Each warning shows:
  - Severity icon (Error/Warning/Info)
  - Resource type
  - Description
  - Recommendation
- ✅ Color coding matches severity

#### 4.4 Overall Status Banner
**Steps:**
1. Locate status banner at top
2. Verify capacity assessment

**Expected Results:**
- ✅ Banner shows "Sufficient Capacity" (green) or "Insufficient Capacity" (red)
- ✅ Descriptive text explains status

#### 4.5 Re-analyze Capacity
**Steps:**
1. Click "Re-analyze Capacity" button
2. Verify re-analysis occurs

**Expected Results:**
- ✅ Button visible
- ✅ Loading state appears
- ✅ Results may update (randomized mock data)

#### 4.6 Next Button
**Steps:**
1. Click Next

**Expected Results:**
- ✅ Next button always enabled (no validation on this step)
- ✅ Advances to Step 4

**Pass/Fail:** ________

---

### **Test Case 5: Step 4 - Network Configuration**

**Objective:** Validate network mapping and Mermaid diagram visualization

#### 5.1 Add Network Mapping
**Steps:**
1. Click "Add Network Mapping" button
2. Configure first mapping:
   - Source VLAN: 100
   - Source Subnet: 192.168.1.0/24
   - Destination VLAN: 200
   - Destination Subnet: 10.0.1.0/24
   - IP Strategy: "DHCP"
3. Verify mapping card appears

**Expected Results:**
- ✅ "Add Network Mapping" button visible
- ✅ 4 input fields for VLAN/subnets
- ✅ IP strategy dropdown shows 3 options (DHCP, Static IP, Preserve Source)
- ✅ Mapping card displays with arrow visualization

#### 5.2 Add Multiple Mappings
**Steps:**
1. Add second mapping:
   - Source VLAN: 101, Subnet: 192.168.2.0/24
   - Dest VLAN: 201, Subnet: 10.0.2.0/24
   - IP Strategy: "Static IP"
2. Add third mapping with "Preserve Source" strategy

**Expected Results:**
- ✅ All 3 mappings visible
- ✅ Each card shows unique configuration
- ✅ IP strategy badges color-coded

#### 5.3 Mermaid Diagram Toggle
**Steps:**
1. Locate "Show Network Diagram" button
2. Click to show diagram
3. Wait for Mermaid rendering

**Expected Results:**
- ✅ Button toggles to "Hide Network Diagram"
- ✅ Diagram container appears
- ✅ Mermaid syntax generates correctly
- ✅ Diagram renders within 1-2 seconds

#### 5.4 Diagram Content Validation
**Steps:**
1. Verify diagram shows:
   - Source networks subgraph (blue)
   - Destination networks subgraph (purple)
   - Dotted arrows between mapped networks
   - IP strategy labels on destination nodes

**Expected Results:**
- ✅ Two subgraphs visible
- ✅ Source networks labeled correctly (VLAN 100, 101, etc.)
- ✅ Destination networks labeled correctly
- ✅ Arrows connect matching mappings
- ✅ IP strategy text visible on dest nodes

#### 5.5 Remove Network Mapping
**Steps:**
1. Click "Remove" on a mapping card
2. Verify diagram updates

**Expected Results:**
- ✅ Mapping card disappears
- ✅ Diagram regenerates without removed mapping
- ✅ Remaining mappings still visible

#### 5.6 Next Button Validation
**Steps:**
1. Remove all mappings and click Next
2. Add at least one mapping and click Next

**Expected Results:**
- ✅ Next button disabled with 0 mappings
- ✅ Next button enabled with ≥1 mapping
- ✅ Advances to Step 5

**Pass/Fail:** ________

---

### **Test Case 6: Step 5 - Review & Generate HLD**

**Objective:** Validate comprehensive review and HLD generation workflow

#### 6.1 Source Selection Summary
**Steps:**
1. Locate "Source Selection" summary card
2. Verify displays:
   - Selected RVTools file name
   - VM count
   - Total vCPUs/Memory/Storage
   - Active filters (cluster, name pattern, powered-off toggle)

**Expected Results:**
- ✅ Card visible with header "Source Selection"
- ✅ All metrics from Step 1 displayed
- ✅ Filter descriptions show what was configured
- ✅ Values match Step 1 selections

#### 6.2 Destination Clusters Summary
**Steps:**
1. Locate "Destination Clusters" summary card
2. Verify shows all configured clusters
3. Check each cluster card shows:
   - Cluster name
   - Hypervisor type badge
   - Storage type badge
   - Node count

**Expected Results:**
- ✅ Card visible with header "Destination Clusters"
- ✅ All clusters from Step 2 listed
- ✅ Color-coded badges for hypervisor/storage
- ✅ Accurate configuration details

#### 6.3 Capacity Analysis Summary
**Steps:**
1. Locate "Capacity Analysis" summary card
2. Verify shows:
   - CPU utilization % (color-coded)
   - Memory utilization % (color-coded)
   - Storage utilization % (color-coded)
   - Overall status (Sufficient/Insufficient)
   - Bottleneck count

**Expected Results:**
- ✅ Card visible with header "Capacity Analysis"
- ✅ All 3 utilization percentages displayed
- ✅ Color coding matches Step 3 thresholds
- ✅ Status badge shows correct assessment
- ✅ Warning count accurate

#### 6.4 Network Mappings Summary
**Steps:**
1. Locate "Network Mappings" summary card
2. Verify shows all mappings in table format:
   - Source VLAN column
   - Destination VLAN column
   - IP Strategy badge column

**Expected Results:**
- ✅ Card visible with header "Network Mappings"
- ✅ Table displays all mappings from Step 4
- ✅ Format: "VLAN X (subnet) → VLAN Y (subnet)"
- ✅ IP strategy badges color-coded

#### 6.5 HLD Generation - Ready State
**Steps:**
1. Locate "Generate HLD Document" section
2. Verify displays:
   - Large DocumentPdf icon (purple)
   - Feature list (6 items)
   - "Generate HLD Document" button

**Expected Results:**
- ✅ Icon visible and properly sized
- ✅ Feature list shows:
  - Executive Summary
  - Source Inventory
  - Destination Architecture
  - Capacity Planning
  - Network Diagrams
  - Migration Runbook
- ✅ Button enabled (if Steps 1-2 complete)

#### 6.6 HLD Generation - Loading State
**Steps:**
1. Click "Generate HLD Document" button
2. Observe loading state (3 seconds)

**Expected Results:**
- ✅ Button becomes disabled
- ✅ Large spinner appears
- ✅ "Generating HLD Document..." message displays
- ✅ Descriptive subtext visible

#### 6.7 HLD Generation - Success State
**Steps:**
1. Wait for generation to complete
2. Verify success state appears

**Expected Results:**
- ✅ Large green checkmark icon appears
- ✅ "HLD Document Generated Successfully!" message
- ✅ "Download HLD Document" button visible (enabled)
- ✅ "Regenerate" button visible
- ✅ Informational banner about saved plan

#### 6.8 Download Button (Mock)
**Steps:**
1. Click "Download HLD Document" button
2. Check browser console for mock URL

**Expected Results:**
- ✅ Button triggers download action
- ✅ Console shows mock document URL: `/api/documents/hld-{projectId}-{timestamp}.docx`
- ✅ (No actual file downloads - mock implementation)

#### 6.9 Regenerate Button
**Steps:**
1. Click "Regenerate" button
2. Verify re-generation occurs

**Expected Results:**
- ✅ Returns to generating state
- ✅ Spinner appears again
- ✅ New success state after 3 seconds
- ✅ New mock document URL generated

#### 6.10 Finish Button
**Steps:**
1. Click "Finish" button (bottom-right)
2. Verify wizard closes

**Expected Results:**
- ✅ Wizard modal closes
- ✅ Returns to project workspace view
- ✅ (Mock: Plan would be saved to backend)

**Pass/Fail:** ________

---

### **Test Case 7: Navigation & State Persistence**

**Objective:** Validate wizard navigation and state management

#### 7.1 Previous Button Navigation
**Steps:**
1. Navigate to Step 5
2. Click "Previous" button repeatedly
3. Verify returns to Step 4 → 3 → 2 → 1

**Expected Results:**
- ✅ Previous button visible on Steps 2-5
- ✅ Each step displays correct content
- ✅ All configured data persists (no data loss)

#### 7.2 Next Button Navigation
**Steps:**
1. From Step 1, configure source selection
2. Click Next through all steps
3. Verify can reach Step 5

**Expected Results:**
- ✅ Next button enabled when validation passes
- ✅ Advances through steps sequentially
- ✅ Cannot skip steps

#### 7.3 State Persistence Across Steps
**Steps:**
1. Configure data in Step 1
2. Navigate to Step 3
3. Return to Step 1
4. Verify data still present

**Expected Results:**
- ✅ All input values preserved
- ✅ Dropdown selections maintained
- ✅ Checkbox states unchanged
- ✅ No data reset when navigating back

#### 7.4 Cancel Button
**Steps:**
1. Configure data in multiple steps
2. Click "Cancel" button
3. Confirm cancellation (if prompt exists)

**Expected Results:**
- ✅ Cancel button visible on all steps
- ✅ Wizard closes immediately
- ✅ Returns to project workspace
- ✅ No data saved (mock implementation)

**Pass/Fail:** ________

---

### **Test Case 8: Validation Logic**

**Objective:** Validate all form validation rules

#### 8.1 Step 1 Validation
**Test:**
- Try clicking Next without selecting RVTools file

**Expected:**
- ✅ Next button disabled
- ✅ Cannot advance to Step 2

#### 8.2 Step 2 Validation
**Test:**
- Try clicking Next with 0 clusters configured

**Expected:**
- ✅ Next button disabled
- ✅ Cannot advance to Step 3

#### 8.3 Step 4 Validation
**Test:**
- Try clicking Next with 0 network mappings

**Expected:**
- ✅ Next button disabled
- ✅ Cannot advance to Step 5

#### 8.4 Step 5 Validation
**Test:**
- Try clicking "Generate HLD Document" without completing Steps 1-2

**Expected:**
- ✅ Button disabled
- ✅ Validation message displayed

**Pass/Fail:** ________

---

### **Test Case 9: Visual & Design System**

**Objective:** Validate Purple Glass design system compliance

#### 9.1 Component Library Usage
**Steps:**
1. Inspect all form components
2. Verify using Purple Glass library

**Expected Results:**
- ✅ PurpleGlassButton for all buttons
- ✅ PurpleGlassInput for text inputs
- ✅ PurpleGlassDropdown for all dropdowns
- ✅ PurpleGlassCheckbox for checkboxes
- ✅ PurpleGlassCard for summary cards
- ✅ No native HTML elements used

#### 9.2 Glassmorphism Aesthetic
**Steps:**
1. Verify modal background
2. Check card styles

**Expected Results:**
- ✅ Semi-transparent backgrounds
- ✅ Backdrop blur applied
- ✅ Subtle borders and shadows
- ✅ Purple/blue gradient accents

#### 9.3 Typography
**Steps:**
1. Inspect font usage throughout wizard

**Expected Results:**
- ✅ Poppins font family consistent
- ✅ Proper heading hierarchy (h2, h3, h4)
- ✅ Readable font sizes

#### 9.4 Color Coding
**Steps:**
1. Verify color usage across all steps

**Expected Results:**
- ✅ Status colors: Green (success), Red (error), Yellow (warning), Blue (info)
- ✅ Utilization colors: Green (<70%), Yellow (70-80%), Orange (80-90%), Red (≥90%)
- ✅ Badge colors consistent with resource types

**Pass/Fail:** ________

---

### **Test Case 10: Responsive Design (Optional)**

**Objective:** Validate wizard adapts to different screen sizes

#### 10.1 Desktop (1920x1080)
**Expected:**
- ✅ Full wizard width utilized
- ✅ Cards display in grid layouts
- ✅ No horizontal scrolling

#### 10.2 Laptop (1366x768)
**Expected:**
- ✅ Wizard scales appropriately
- ✅ Content remains readable
- ✅ No overlapping elements

#### 10.3 Tablet (768px width)
**Expected:**
- ✅ Single-column card layouts
- ✅ Buttons stack vertically if needed
- ✅ Diagram remains visible

**Pass/Fail:** ________

---

## 🐛 Issues & Bugs Found

### Issue Template
**Issue #:** ___  
**Step:** ___  
**Component:** ___  
**Description:** ___  
**Steps to Reproduce:** ___  
**Expected Behavior:** ___  
**Actual Behavior:** ___  
**Severity:** Critical / High / Medium / Low  
**Screenshot:** (if applicable)  

---

## ✅ Testing Summary

**Total Test Cases:** 10  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  
**Pass Rate:** ___%  

### Critical Issues Found:
1. ___
2. ___
3. ___

### Minor Issues Found:
1. ___
2. ___
3. ___

### Recommendations:
1. ___
2. ___
3. ___

---

## 📝 Testing Notes

### Positive Observations:
- ___
- ___

### Areas for Improvement:
- ___
- ___

### UX Feedback:
- ___
- ___

---

## 🚦 Go/No-Go Decision

**Wizard UI Quality:** ⬜ Pass / ⬜ Fail  
**Navigation Flow:** ⬜ Pass / ⬜ Fail  
**Validation Logic:** ⬜ Pass / ⬜ Fail  
**Visual Design:** ⬜ Pass / ⬜ Fail  
**Mermaid Integration:** ⬜ Pass / ⬜ Fail  

**Overall Decision:** ⬜ **PROCEED** to Backend Integration / ⬜ **FIX ISSUES** before proceeding

**Tested By:** _______________  
**Date:** October 21, 2025  
**Signature:** _______________

---

## 🔄 Next Steps After Testing

### If PASS:
1. Commit test results
2. Create backend integration plan
3. Begin Task 15-17 implementation

### If FAIL:
1. Document all issues in GitHub
2. Prioritize critical bugs
3. Fix issues and retest
4. Repeat testing cycle

---

**END OF TESTING GUIDE**
