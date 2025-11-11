# Context-Sensitive Validation Audit
**Date**: November 10, 2025  
**Status**: 🔍 Comprehensive Analysis  
**Priority**: P0 (Critical UX Issues)

---

## 🎯 Executive Summary

This document catalogs **invalid field combinations** and **context-sensitive validation issues** throughout the LCMDesigner application. These are scenarios where the UI shows irrelevant fields, uses incorrect labels, or applies validation rules that don't match the user's selected context (e.g., activity type, infrastructure type, hardware source).

### Impact
- **User Confusion**: Fields that don't apply to the selected scenario
- **Data Integrity**: Storing irrelevant data for certain activity types
- **Workflow Inefficiency**: Extra steps that shouldn't exist
- **Validation Errors**: Misleading error messages

---

## 🚨 Critical Issues (P0)

### Issue #1: Activity Wizard - Decommissioning Flow
**Location**: `/frontend/src/components/Activity/ActivityWizard/Steps/Step2_SourceDestination.tsx`

**Problem**:
When user selects **Decommission** activity type:
- ❌ Step 2 shows "**Source Cluster**" label → Should be "**Target Cluster**" (what you're decommissioning)
- ❌ Step 2 shows "**Target Infrastructure Type**" selection → Makes no sense (you're removing infrastructure, not adding)
- ❌ Step shows migration strategy fields → Not applicable to decommission

**Current Code** (lines 270-290):
```tsx
<PurpleGlassDropdown
  label="Source Cluster"  // ❌ WRONG for decommission
  helperText="Select the cluster you're migrating from..."  // ❌ WRONG
  ...
/>

<PurpleGlassRadioGroup
  label="Target Infrastructure Type"  // ❌ IRRELEVANT for decommission
  helperText="Choose the infrastructure type for your new cluster..."  // ❌ WRONG
  ...
/>
```

**Expected Behavior**:
- Decommission should show: "**Cluster to Decommission**"
- Target Infrastructure section should be **hidden completely**
- Migration strategy fields should be **hidden**

**Affected Steps**:
- Step 2: Source/Destination (wrong labels)
- Step 3: Infrastructure (shouldn't show target infra)
- Step 3: Hardware Compatibility (irrelevant checks)

---

### Issue #2: Activity Wizard - Expansion Flow
**Location**: Same file, Step 2

**Problem**:
When user selects **Expansion** activity type:
- ❌ Shows "**Target Infrastructure Type**" → Makes no sense (expanding existing, not creating new)
- ❌ Shows migration strategy → Not applicable (you're adding capacity to existing cluster)

**Current Code**:
```tsx
// Same problematic code as Issue #1
<PurpleGlassRadioGroup
  label="Target Infrastructure Type"  // ❌ IRRELEVANT for expansion
  ...
/>
```

**Expected Behavior**:
- Expansion should show: "**Cluster to Expand**" (not "source")
- Target Infrastructure section should be **hidden**
- Should only ask: "How many hosts to add?" or "Additional capacity needed?"

---

### Issue #3: Activity Wizard - Maintenance Flow
**Location**: Step 2, Step 3

**Problem**:
When user selects **Maintenance** activity type:
- ❌ Shows "**Target Infrastructure Type**" → Irrelevant (in-place maintenance, no migration)
- ❌ Step 3 shows "**Hardware Compatibility**" checks → Not applicable (no new hardware)
- ❌ Shows migration strategy → Not applicable

**Expected Behavior**:
- Should only show: "**Cluster for Maintenance**"
- Should skip infrastructure type selection
- Should skip hardware compatibility step entirely
- Should skip to timeline/scheduling

---

### Issue #4: Activity Wizard - Hardware Compatibility Checks
**Location**: `/frontend/src/components/Activity/ActivityWizard/Steps/Step3_Infrastructure.tsx`

**Problem**:
Hardware compatibility checks run for **ALL** activity types, but only make sense for:
- ✅ Migration (new hardware)
- ✅ Lifecycle (hardware refresh)
- ✅ Expansion (adding new hosts)
- ❌ Decommission (removing hardware - no compatibility needed)
- ❌ Maintenance (in-place updates - no new hardware)

**Current Code**:
```tsx
// Step 3 always runs compatibility checks
const handleValidateCompatibility = async () => {
  // This runs for ALL activity types ❌
  const result = await validateHardwareCompatibility(hardwareSpecs, targetInfraType);
  ...
};
```

**Expected Behavior**:
```tsx
// Should be conditional
const shouldRunCompatibility = ['migration', 'lifecycle', 'expansion'].includes(activityType);

if (!shouldRunCompatibility) {
  // Skip step or show simplified version
}
```

---

### Issue #5: Migration Strategy Selection
**Location**: Step 2, lines 185-215

**Problem**:
Migration strategy dropdown shows for all activity types:
- Domino Hardware Swap
- New Hardware Purchase
- Existing Free Hardware

But these only apply to **Migration** and **Expansion** activities.

**Current Code** (line 192):
```tsx
// Check if current activity is a migration
const isMigrationActivity = formData.step1?.activity_type === 'migration';

// But then still shows fields conditionally ❌
{isMigrationActivity && (
  // Migration strategy fields
)}
```

**Issue**: Logic exists but not comprehensive - should also hide for other types.

**Expected Behavior**:
```tsx
const shouldShowMigrationStrategy = ['migration', 'expansion'].includes(activityType);
```

---

## 🔧 Medium Priority Issues (P1)

### Issue #6: Cluster Strategy Manager - Hardware Source Logic
**Location**: `/frontend/src/views/ClusterStrategyManagerView.tsx`

**Problem**:
When creating cluster migration strategy, user selects hardware source:
- "Domino Reuse" (swap hardware from old cluster)
- "Hardware Pool" (use existing free hardware)
- "New Hardware" (purchase new)

But validation doesn't check:
- ❌ If "Domino Reuse" selected, is there actually a source cluster to take hardware from?
- ❌ If "Hardware Pool" selected, does the pool have enough capacity?
- ❌ If "New Hardware", should force them to create a hardware basket first?

**Expected Behavior**:
```tsx
if (hardwareSource === 'domino_reuse' && !sourcesClusterId) {
  setError('Domino reuse requires a source cluster to be selected');
  return;
}

if (hardwareSource === 'pool') {
  const poolCapacity = await checkPoolCapacity(requirements);
  if (!poolCapacity.sufficient) {
    showWarning('Pool may not have enough capacity for this strategy');
  }
}
```

---

### Issue #7: Hardware Basket - Vendor Compatibility
**Location**: `/frontend/src/views/HardwareBasketView.tsx`

**Problem**:
User can add hardware from **multiple vendors** (Dell, HPE, Lenovo) to a single basket, but some infrastructure types don't support mixed vendors:
- ✅ Traditional VMware: Supports mixed vendors
- ❌ Azure Stack HCI: Requires single vendor (Microsoft HCL restrictions)
- ❌ S2D: Requires single vendor

**Current Code**: No validation exists

**Expected Behavior**:
```tsx
if (targetInfrastructure === 'azure_local' || targetInfrastructure === 'hci_s2d') {
  const vendors = basket.items.map(item => item.vendor);
  const uniqueVendors = new Set(vendors);
  
  if (uniqueVendors.size > 1) {
    setError('Azure Stack HCI requires all hardware from a single vendor');
  }
}
```

---

### Issue #8: Capacity Validation - Overcommit Ratios
**Location**: `/frontend/src/views/SettingsView.tsx`, Step 4 of wizard

**Problem**:
User sets CPU/Memory overcommit ratios (e.g., 4:1 CPU, 1.5:1 Memory), but these don't apply equally to all infrastructure types:
- ✅ Traditional VMware: Supports aggressive overcommit
- ⚠️ Hyper-V: Moderate overcommit (2:1 CPU typical)
- ❌ Azure Stack HCI: Very conservative (Microsoft recommends 1:1 or less)

**Current Code**: No infrastructure-aware validation

**Expected Behavior**:
```tsx
const MAX_OVERCOMMIT_BY_INFRA = {
  traditional: { cpu: 4, memory: 2 },
  hci_s2d: { cpu: 2, memory: 1.5 },
  azure_local: { cpu: 1, memory: 1 },
};

if (cpuOvercommit > MAX_OVERCOMMIT_BY_INFRA[infraType].cpu) {
  showWarning(`${infraType} typically doesn't support CPU overcommit above ${MAX}:1`);
}
```

---

## 📋 Low Priority Issues (P2)

### Issue #9: Hardware Selection - Infrastructure Type Mismatch
**Location**: Hardware Pool selection in wizard

**Problem**:
User selects "Azure Stack HCI" as target infrastructure, but Hardware Pool shows **all** hardware (including non-HCL certified servers).

**Expected Behavior**:
Filter Hardware Pool by:
- Infrastructure type compatibility
- Vendor certification status
- Azure Stack HCI catalog membership

---

### Issue #10: Timeline Estimation - Activity Type Factors
**Location**: Step 5 of wizard

**Problem**:
Timeline estimation uses same formula for all activity types, but:
- Migration: 4-8 hours per host
- Decommission: 2-4 hours per host (faster)
- Expansion: 6-12 hours per host (slower, includes integration)
- Maintenance: Depends on specific task (patch vs firmware)

**Expected Behavior**:
```tsx
const HOURS_PER_HOST_BY_TYPE = {
  migration: 6,
  decommission: 3,
  expansion: 9,
  lifecycle: 8,
  maintenance: 4,
};

const estimatedHours = hostCount * HOURS_PER_HOST_BY_TYPE[activityType];
```

---

## 🎯 Proposed Solution: Conditional Step Rendering

### Core Strategy

Instead of showing all 7 steps for every activity type, implement **context-aware step flow**:

```typescript
// Step configuration by activity type
const STEP_CONFIGS: Record<ActivityType, WizardStepConfig> = {
  migration: {
    steps: [
      { id: 1, component: 'Step1_Basics', label: 'Activity Basics' },
      { id: 2, component: 'Step2_SourceDestination', label: 'Source & Destination', fields: ['sourceCluster', 'targetInfra', 'targetClusterName'] },
      { id: 3, component: 'Step3_Infrastructure', label: 'Hardware Compatibility' },
      { id: 4, component: 'Step4_Capacity', label: 'Capacity Validation' },
      { id: 5, component: 'Step5_Timeline', label: 'Timeline Estimation' },
      { id: 6, component: 'Step6_Assignment', label: 'Team Assignment' },
      { id: 7, component: 'Step7_Review', label: 'Review & Submit' },
    ],
    validations: ['sourceCluster', 'targetInfra', 'hardwareSpecs'],
  },
  
  decommission: {
    steps: [
      { id: 1, component: 'Step1_Basics', label: 'Activity Basics' },
      { id: 2, component: 'Step2_TargetSelection', label: 'Cluster to Decommission', fields: ['targetCluster'] }, // Different component
      { id: 3, component: 'Step3_Hardware', label: 'Hardware Disposition' }, // What to do with hardware
      { id: 4, component: 'Step4_Timeline', label: 'Timeline Estimation' },
      { id: 5, component: 'Step5_Review', label: 'Review & Submit' },
    ],
    validations: ['targetCluster'],
  },
  
  expansion: {
    steps: [
      { id: 1, component: 'Step1_Basics', label: 'Activity Basics' },
      { id: 2, component: 'Step2_ClusterSelection', label: 'Cluster to Expand', fields: ['targetCluster'] },
      { id: 3, component: 'Step3_Capacity', label: 'Additional Capacity Needed' },
      { id: 4, component: 'Step4_HardwareSource', label: 'Hardware Source' },
      { id: 5, component: 'Step5_Timeline', label: 'Timeline Estimation' },
      { id: 6, component: 'Step6_Review', label: 'Review & Submit' },
    ],
    validations: ['targetCluster', 'additionalCapacity'],
  },
  
  maintenance: {
    steps: [
      { id: 1, component: 'Step1_Basics', label: 'Activity Basics' },
      { id: 2, component: 'Step2_ClusterSelection', label: 'Cluster for Maintenance', fields: ['targetCluster'] },
      { id: 3, component: 'Step3_Timeline', label: 'Maintenance Schedule' },
      { id: 4, component: 'Step4_Review', label: 'Review & Submit' },
    ],
    validations: ['targetCluster'],
  },
  
  lifecycle: {
    steps: [
      { id: 1, component: 'Step1_Basics', label: 'Activity Basics' },
      { id: 2, component: 'Step2_SourceDestination', label: 'Source & Target', fields: ['sourceCluster', 'targetInfra'] },
      { id: 3, component: 'Step3_Infrastructure', label: 'Hardware Selection' },
      { id: 4, component: 'Step4_Capacity', label: 'Capacity Validation' },
      { id: 5, component: 'Step5_Timeline', label: 'Timeline Estimation' },
      { id: 6, component: 'Step6_Review', label: 'Review & Submit' },
    ],
    validations: ['sourceCluster', 'targetInfra'],
  },
};
```

### Dynamic Field Labels

```typescript
// Field labels that change based on activity type
const FIELD_LABELS: Record<ActivityType, Record<string, string>> = {
  migration: {
    clusterField: 'Source Cluster',
    clusterHelperText: 'Select the cluster you\'re migrating from',
  },
  decommission: {
    clusterField: 'Cluster to Decommission',
    clusterHelperText: 'Select the cluster you\'re retiring',
  },
  expansion: {
    clusterField: 'Cluster to Expand',
    clusterHelperText: 'Select the cluster you\'re adding capacity to',
  },
  maintenance: {
    clusterField: 'Cluster for Maintenance',
    clusterHelperText: 'Select the cluster requiring maintenance',
  },
  lifecycle: {
    clusterField: 'Source Cluster',
    clusterHelperText: 'Select the cluster you\'re refreshing',
  },
};
```

---

## 🛠️ Implementation Plan

### Phase 1: Activity Wizard Refactor (P0-2)
**Estimated Time**: 4-6 hours

1. **Create Step Configuration System** (1h)
   - Define `STEP_CONFIGS` mapping
   - Create `useWizardSteps()` hook to compute visible steps
   - Update `WizardProgress` to show only relevant steps

2. **Refactor Step 2** (1.5h)
   - Create conditional rendering based on activity type
   - Implement dynamic field labels
   - Hide irrelevant fields (target infra for decommission/expansion/maintenance)

3. **Refactor Step 3** (1h)
   - Skip hardware compatibility for decommission/maintenance
   - Adjust validation logic

4. **Update Validation** (1h)
   - Make `validateStep()` activity-type-aware
   - Remove irrelevant validations

5. **Testing** (1.5h)
   - Test all 5 activity type flows end-to-end
   - Verify correct steps shown, correct labels, correct validations

### Phase 2: Hardware & Capacity Validation (P1)
**Estimated Time**: 3-4 hours

1. **Hardware Basket Vendor Validation** (1h)
   - Add vendor consistency check for Azure/S2D

2. **Hardware Pool Capacity Check** (1h)
   - Query pool capacity before allowing "Hardware Pool" selection

3. **Overcommit Ratio Warnings** (1h)
   - Add infrastructure-aware validation in SettingsView
   - Show warnings for aggressive overcommit on restrictive platforms

4. **Testing** (1h)

### Phase 3: Polish & Edge Cases (P2)
**Estimated Time**: 2-3 hours

1. **Hardware Pool Filtering** (1h)
2. **Timeline Estimation Refinement** (1h)
3. **Documentation Updates** (1h)

---

## 📊 Testing Matrix

| Activity Type | Step Count | Key Fields | Validations | Edge Cases |
|---------------|-----------|------------|-------------|------------|
| **Migration** | 7 | Source, Target Infra, Hardware | All checks | Mixed vendors, capacity |
| **Lifecycle** | 6 | Source, Target Infra | Compatibility | Refresh vs new infra |
| **Decommission** | 5 | Target Cluster | No infra/compat | Hardware disposition |
| **Expansion** | 6 | Target Cluster, Capacity | Capacity only | Pool vs new hardware |
| **Maintenance** | 4 | Target Cluster | None | Scheduling conflicts |

---

## ✅ Success Criteria

1. **No Irrelevant Fields**: Each activity type shows only contextually relevant fields
2. **Correct Labels**: Field labels accurately describe what user is selecting (e.g., "Cluster to Decommission" not "Source Cluster")
3. **Validation Accuracy**: Only validate fields that apply to the activity type
4. **Step Count Reduction**: Non-migration activities have 30-40% fewer steps
5. **Zero Confusing Errors**: No validation errors for fields that shouldn't have been shown
6. **User Testing**: 5/5 users complete each activity type without confusion

---

## 📝 Notes

- This audit was triggered by user feedback on decommissioning flow
- Many issues stem from original wizard design for migration-only
- Wizard was later expanded to support all activity types without refactoring field logic
- Solution requires systematic conditional rendering, not band-aid fixes
- Backend models already support all activity types correctly - this is purely a frontend issue
