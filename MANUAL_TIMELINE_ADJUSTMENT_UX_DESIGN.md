# Manual Timeline Adjustment Feature - UX Design Document

**Feature ID:** Timeline-Manual-Edit-001  
**Target:** Step5_Timeline.tsx (Activity Wizard)  
**Priority:** High  
**Status:** Design Phase  
**Created:** 2025-11-11

---

## 1. Executive Summary

### Problem Statement
Users need to override auto-calculated timeline estimates based on domain expertise, team constraints, or project-specific complexities that the formula cannot capture. Currently, Step5 only provides read-only calculated estimates with no ability to adjust them.

### Proposed Solution
Implement **inline editable fields** for timeline estimates (phase totals and individual tasks) with smart recalculation, validation, and visual feedback. Users can click any duration value to edit it, with automatic updates to dependent values.

### Key Benefits
- ✅ Empowers users with domain expertise to refine estimates
- ✅ Accounts for project-specific constraints (team availability, maintenance windows)
- ✅ Maintains data integrity through smart recalculation
- ✅ Non-disruptive inline editing pattern (industry standard)
- ✅ Preserves auto-calculated baseline with reset functionality

---

## 2. Current State Analysis

### Existing Behavior (Step5_Timeline.tsx)

**User Flow:**
1. User clicks "Estimate Timeline" button
2. System calculates timeline using formula:
   - `totalHours = hostCount × hoursPerHost`
   - `totalDays = Math.ceil(totalHours / 8)` (8-hour workday)
   - `prepDays = totalDays × 0.25` (25% for preparation)
   - `executionDays = totalDays × 0.60` (60% for execution)
   - `validationDays = totalDays × 0.15` (15% for validation)
3. Displays summary cards (Total, Prep, Migration, Validation)
4. Shows task breakdown with individual durations
5. Highlights critical path tasks
6. Shows confidence level (high/medium/low based on host count)

**Data Sources:**
- `activityType` (migration/decommission/expansion/maintenance) from Step1
- `hostCount` from Step4
- `hoursPerHost` from global settings API (with fallback defaults)

**Current Limitations:**
- ❌ No ability to override calculated values
- ❌ Cannot adjust for team-specific constraints
- ❌ Cannot account for known risks or buffers
- ❌ Formula may not fit all scenarios (e.g., complex migrations)

---

## 3. UX Design Decision Matrix

### Pattern Comparison

| Pattern | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **Inline Editable** | ✅ Minimal disruption<br>✅ Immediate feedback<br>✅ Industry standard | ⚠️ Complex state management<br>⚠️ Needs validation UI | **✅ RECOMMENDED** |
| **Edit Mode Toggle** | ✅ Clear separation<br>✅ Explicit save action | ❌ Heavyweight<br>❌ Disrupts viewing | ❌ Too disruptive |
| **Separate Section** | ✅ Transparent deltas<br>✅ Clear overrides | ❌ Takes more space<br>❌ Redundant UI | ❌ Too verbose |
| **Modal Dialog** | ✅ Focused editing | ❌ Context loss<br>❌ Extra clicks | ❌ Too heavyweight |

### Selected Pattern: **Inline Editable Fields**

**Justification:**
- Matches industry standards (Google Sheets, Jira, Linear, Asana)
- Minimal cognitive load (edit in context)
- Immediate visual feedback
- No disruption to existing layout
- Supports keyboard-first workflows

---

## 4. Detailed UX Specification

### 4.1 Visual Design

#### Summary Cards (Editable States)

**Default State (Auto-calculated):**
```
┌─────────────────┐
│       12        │ ← Large number (fontSizeBase600)
│   Total Days    │ ← Label (fontSizeBase200)
└─────────────────┘
```

**Hover State:**
```
┌─────────────────┐
│       12    ✏️  │ ← Edit icon appears
│   Total Days    │ ← Subtle background change
└─────────────────┘
     ↑
  Click to edit (tooltip)
```

**Edit State:**
```
┌─────────────────┐
│   [  15   ]  ✓× │ ← Input + Check/Cancel buttons
│   Total Days    │ ← Blue border, focused state
└─────────────────┘
```

**Edited State (After Save):**
```
┌─────────────────┐
│       15    📝  │ ← Blue accent color (#3b82f6)
│   Total Days    │ ← "Manually adjusted" icon
└─────────────────┘
```

**Error State:**
```
┌─────────────────┐
│   [  -5   ]  ✓× │ ← Red border
│ ⚠️ Min 1 day    │ ← Inline error message (red)
└─────────────────┘
```

#### Task List (Editable States)

**Default Task Row:**
```
┌────────────────────────────────────────────┐
│ Infrastructure prep and validation  4 days │
└────────────────────────────────────────────┘
```

**Critical Path Task (Default):**
```
┌────────────────────────────────────────────┐
│ VM migration execution ⚠️ Critical  8 days │ ← Yellow background
└────────────────────────────────────────────┘
```

**Task Row (Hover):**
```
┌────────────────────────────────────────────┐
│ Infrastructure prep and validation  4 days ✏️│ ← Edit icon on hover
└────────────────────────────────────────────┘
```

**Task Row (Edit Mode):**
```
┌────────────────────────────────────────────┐
│ Infrastructure prep and validation [6] ✓× │ ← Inline input
└────────────────────────────────────────────┘
```

**Task Row (Edited):**
```
┌────────────────────────────────────────────┐
│ Infrastructure prep and validation  6 days 📝│ ← Blue text, edited icon
└────────────────────────────────────────────┘
```

### 4.2 Interaction Specifications

#### Phase Total Editing (Summary Cards)

**User Action:** Click "12" in "Total Days" card

**System Response:**
1. Transform text to `<input type="number" value={12} min={1} max={365} />`
2. Auto-focus input, select all text
3. Show checkmark (✓) and cancel (×) buttons
4. Apply blue border to card
5. Show keyboard hint: "Enter to save, Esc to cancel"

**User Inputs:** `15` and presses Enter (or clicks ✓)

**System Response:**
1. Validate: `15 >= 1 && 15 <= 365` ✓
2. Calculate new phase breakdown:
   - `prepDays = Math.ceil(15 × 0.25) = 4`
   - `migrationDays = Math.ceil(15 × 0.60) = 9`
   - `validationDays = Math.ceil(15 × 0.15) = 2`
3. Update all 4 cards (Total, Prep, Migration, Validation)
4. Mark all as "edited" (blue text + 📝 icon)
5. Set `isManuallyEdited = true`
6. Store `originalEstimate` for reset
7. Update `formData.step5.timeline_result`
8. Show success feedback (brief green checkmark animation)

**User Cancels:** Presses Esc or clicks ×

**System Response:**
1. Revert to original value (12)
2. Remove input, restore text display
3. Remove blue border
4. No state changes

#### Individual Task Editing

**User Action:** Click "4 days" in "Infrastructure preparation" task

**System Response:**
1. Transform "4 days" to inline input
2. Auto-focus, select text
3. Show ✓ × buttons inline

**User Inputs:** `6` and presses Enter

**System Response:**
1. Validate: `6 >= 1 && 6 <= 365` ✓
2. Update task duration: `task.duration_days = 6`
3. Recalculate phase total:
   - Find all tasks in "Preparation" phase
   - Sum their durations → new `prepDays`
   - Update "Preparation" summary card
4. If task is critical path:
   - Recalculate `total_days` (sum all critical path tasks)
   - Update "Total Days" card
5. Mark task row with blue text + 📝 icon
6. Mark affected summary cards as edited
7. Set `isManuallyEdited = true`
8. Store changes in formData

#### Reset to Auto-calculated

**User Action:** Click "Reset to Auto-calculated" button

**System Response:**
1. Show confirmation dialog:
   ```
   ┌─────────────────────────────────────────┐
   │ ⚠️  Reset Timeline to Auto-calculated?  │
   │                                         │
   │ This will discard all manual            │
   │ adjustments and restore the original    │
   │ calculated values.                      │
   │                                         │
   │             [Cancel]  [Reset]           │
   └─────────────────────────────────────────┘
   ```

2. If user clicks "Reset":
   - Restore `timelineResult = originalEstimate`
   - Set `isManuallyEdited = false`
   - Clear all edited indicators (blue text, 📝 icons)
   - Update formData
   - Show success message: "Timeline reset to auto-calculated values"

3. If user clicks "Cancel":
   - Close dialog, no changes

#### Re-estimate After Edits

**User Action:** Click "Estimate Timeline" button when edits exist

**System Response:**
1. Show confirmation dialog:
   ```
   ┌─────────────────────────────────────────┐
   │ ⚠️  Recalculate Timeline?               │
   │                                         │
   │ You have manual adjustments. Re-        │
   │ estimating will discard your edits.     │
   │                                         │
   │        [Cancel]  [Recalculate]          │
   └─────────────────────────────────────────┘
   ```

2. If user clicks "Recalculate":
   - Run estimation logic (same as current)
   - Replace `timelineResult` with new calculation
   - Set `isManuallyEdited = false`
   - Clear `originalEstimate`
   - Show new results

3. If user clicks "Cancel":
   - Close dialog, keep existing edits

### 4.3 Smart Recalculation Logic

#### Rule 1: Edit Phase Total → Update Tasks Proportionally

**Example:**
- Original: `prepDays = 4`, tasks: [2 days, 1 day, 1 day]
- User edits: `prepDays = 6`
- System calculates:
  - Scale factor: `6 / 4 = 1.5`
  - New tasks: `[Math.ceil(2 × 1.5), Math.ceil(1 × 1.5), Math.ceil(1 × 1.5)]`
  - Result: [3 days, 2 days, 2 days] → sum = 7 days
  - Adjust to match: Reduce last task by 1 → [3, 2, 2] = 7
  - Or show warning: "Phase total (6) < task sum (7). Adjust tasks manually."

**Decision:** Show warning, don't auto-adjust tasks (prevents data loss)

#### Rule 2: Edit Task → Update Phase Total

**Example:**
- Original: Task "Infrastructure prep" = 2 days, `prepDays = 4`
- User edits: Task = 6 days
- System:
  - Recalculate `prepDays = sum(all prep tasks)` = 6 + 1 + 1 = 8
  - Update "Preparation" card: 4 → 8
  - Mark card as edited

#### Rule 3: Edit Critical Path Task → Update Total Days

**Example:**
- Original: Critical task "VM migration" = 8 days, `total_days = 12`
- User edits: Task = 12 days (+4 days)
- System:
  - Recalculate `total_days = sum(all critical path tasks)`
  - Update "Total Days" card: 12 → 16
  - Mark card as edited

#### Rule 4: Edit Non-Critical Task → Phase Only

**Example:**
- Original: Non-critical task "Performance monitoring" = 2 days
- User edits: Task = 4 days (+2 days)
- System:
  - Update phase total (Validation): 3 → 5
  - DO NOT update `total_days` (non-critical path)
  - Show info: "ℹ️ Total days unchanged (non-critical task)"

### 4.4 Validation Rules

| Validation | Rule | Error Message | Blocking? |
|------------|------|---------------|-----------|
| **Min Value** | `value >= 1` | "Minimum 1 day required" | ✅ Yes (prevent save) |
| **Max Value** | `value <= 365` | "Maximum 365 days allowed" | ✅ Yes (prevent save) |
| **Not a Number** | `!isNaN(value)` | "Please enter a valid number" | ✅ Yes (prevent save) |
| **Phase Sum Warning** | `total >= prep + migration + validation` | "⚠️ Total is less than phase sum" | ❌ No (show warning) |
| **Critical Path Realism** | Critical task >= 1 day | "ℹ️ Very short duration for critical task" | ❌ No (show info) |
| **Overall Realism** | `total <= 180` (6 months) | "⚠️ Very long timeline (>6 months)" | ❌ No (show warning) |

**Validation UI Pattern:**
- **Blocking errors:** Red border + inline error text + disable save button
- **Warnings:** Orange border + warning icon + allow save
- **Info:** Blue border + info icon + allow save

### 4.5 Visual Indicators

#### Edited Field Indicators

**Text Color:**
- Auto-calculated: `tokens.colorNeutralForeground1` (default)
- Manually edited: `#3b82f6` (blue accent)

**Icons:**
- Auto-calculated: No icon
- Manually edited: `📝` (edit icon) or `<EditRegular />` from Fluent Icons
- Hover (editable): `✏️` (pencil) or `<EditRegular />`

**Borders:**
- Default: `tokens.colorNeutralStroke2`
- Hover: `tokens.colorNeutralStroke1`
- Edit mode: `#3b82f6` (blue, 2px)
- Error: `#e53e3e` (red, 2px)
- Warning: `#f59e0b` (orange, 2px)

#### Confidence Badge Update

**Auto-calculated:**
```
┌────────────────────────┐
│ ✓ High Confidence      │ ← Green badge
└────────────────────────┘
```

**Manually Edited:**
```
┌────────────────────────┐
│ ✓ High Confidence 📝   │ ← Green badge + edit icon
└────────────────────────┘
or
┌────────────────────────┐
│ 📝 Manually Adjusted   │ ← Blue badge (if fully custom)
└────────────────────────┘
```

### 4.6 Reset Functionality

**Button Location:** Next to "Estimate Timeline" button

**Button State:**
- Hidden if `!isManuallyEdited`
- Visible as link button if `isManuallyEdited`
- Label: "Reset to Auto-calculated"
- Icon: `<ArrowResetRegular />`

**Confirmation Dialog (PurpleGlassCard Modal):**
```typescript
<Dialog open={showResetDialog}>
  <DialogSurface>
    <DialogTitle>⚠️ Reset Timeline to Auto-calculated?</DialogTitle>
    <DialogBody>
      This will discard all manual adjustments and restore the original 
      calculated values based on your activity parameters.
    </DialogBody>
    <DialogActions>
      <Button appearance="secondary" onClick={onCancel}>Cancel</Button>
      <Button appearance="primary" onClick={onReset}>Reset</Button>
    </DialogActions>
  </DialogSurface>
</Dialog>
```

---

## 5. Data Model Specification

### Extended Types

```typescript
// Current type (existing)
type TimelineEstimationResult = {
  total_days: number;
  prep_days: number;
  migration_days: number;
  validation_days: number;
  confidence: 'high' | 'medium' | 'low';
  tasks: TaskEstimate[];
  critical_path: string[];
  estimated_at: string;
};

// NEW: Extended type with edit tracking
type EditableTimelineResult = TimelineEstimationResult & {
  is_manually_edited: boolean;
  original_estimate: TimelineEstimationResult | null; // For reset
  edited_fields: string[]; // ['total_days', 'prep_days', 'tasks.0.duration_days']
  last_edited_at: string; // ISO timestamp
};

// NEW: Individual field edit state
type EditableField = {
  value: number;
  is_edited: boolean;
  original_value: number;
};

// NEW: Validation result
type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
};
```

### State Management

```typescript
// Component state (Step5_Timeline.tsx)
const [timelineResult, setTimelineResult] = useState<EditableTimelineResult | null>(null);
const [editingField, setEditingField] = useState<string | null>(null); // 'total_days', 'tasks.0'
const [editingValue, setEditingValue] = useState<number | null>(null);
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
const [showResetDialog, setShowResetDialog] = useState(false);
const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
```

### Helper Functions

```typescript
// Validate a single field value
function validateField(
  field: string, 
  value: number, 
  result: EditableTimelineResult
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  // Min/Max validation
  if (value < 1) errors.push("Minimum 1 day required");
  if (value > 365) errors.push("Maximum 365 days allowed");
  if (isNaN(value)) errors.push("Please enter a valid number");

  // Phase sum validation (warning only)
  if (field === 'total_days') {
    const phaseSum = result.prep_days + result.migration_days + result.validation_days;
    if (value < phaseSum) {
      warnings.push(`Total days (${value}) is less than phase sum (${phaseSum})`);
    }
  }

  // Long timeline warning
  if (field === 'total_days' && value > 180) {
    warnings.push("Very long timeline (>6 months). Consider breaking into smaller activities.");
  }

  // Critical path realism check
  if (field.startsWith('tasks.') && value < 2) {
    const taskIndex = parseInt(field.split('.')[1]);
    const task = result.tasks[taskIndex];
    if (task.is_critical_path) {
      infos.push("Very short duration for a critical path task");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    infos,
  };
}

// Recalculate dependent values
function recalculateTimeline(
  field: string,
  newValue: number,
  result: EditableTimelineResult
): EditableTimelineResult {
  const updated = { ...result };

  if (field === 'total_days') {
    // Distribute proportionally to phases (maintain 25/60/15 split)
    updated.prep_days = Math.max(2, Math.ceil(newValue * 0.25));
    updated.migration_days = Math.ceil(newValue * 0.60);
    updated.validation_days = Math.max(1, Math.ceil(newValue * 0.15));
    
    // Mark all as edited
    updated.edited_fields.push('total_days', 'prep_days', 'migration_days', 'validation_days');
  }

  if (field === 'prep_days' || field === 'migration_days' || field === 'validation_days') {
    // Recalculate total
    updated.total_days = updated.prep_days + updated.migration_days + updated.validation_days;
    updated.edited_fields.push(field, 'total_days');
  }

  if (field.startsWith('tasks.')) {
    const taskIndex = parseInt(field.split('.')[1]);
    updated.tasks[taskIndex].duration_days = newValue;
    
    // Recalculate phase total (determine which phase this task belongs to)
    // TODO: Need task-to-phase mapping
    
    // If critical path task, recalculate total
    if (updated.tasks[taskIndex].is_critical_path) {
      const criticalPathSum = updated.tasks
        .filter(t => t.is_critical_path)
        .reduce((sum, t) => sum + t.duration_days, 0);
      updated.total_days = criticalPathSum;
      updated.edited_fields.push(field, 'total_days');
    } else {
      updated.edited_fields.push(field);
    }
  }

  updated.is_manually_edited = true;
  updated.last_edited_at = new Date().toISOString();

  return updated;
}

// Reset to original estimate
function resetToOriginal(result: EditableTimelineResult): TimelineEstimationResult {
  if (!result.original_estimate) {
    throw new Error("No original estimate available");
  }
  return { ...result.original_estimate };
}
```

---

## 6. Component Architecture

### New Components

#### 6.1 EditableNumberField

**Purpose:** Inline editable number input with validation

**Props:**
```typescript
type EditableNumberFieldProps = {
  value: number;
  label?: string;
  unit: string; // "day" | "days"
  min: number;
  max: number;
  isEdited: boolean;
  onSave: (newValue: number) => void;
  onCancel?: () => void;
  validationError?: string;
  validationWarning?: string;
  validationInfo?: string;
  disabled?: boolean;
  className?: string;
};
```

**Usage:**
```tsx
<EditableNumberField
  value={timelineResult.total_days}
  unit={timelineResult.total_days === 1 ? "day" : "days"}
  min={1}
  max={365}
  isEdited={editedFields.includes('total_days')}
  onSave={(newValue) => handleFieldSave('total_days', newValue)}
  validationError={validationErrors['total_days']}
/>
```

**States:**
1. Default: Display value + unit, hover shows edit icon
2. Edit: Input field + ✓ × buttons
3. Edited: Blue text + 📝 icon
4. Error: Red border + error message
5. Warning: Orange border + warning message

#### 6.2 EditableTaskRow

**Purpose:** Task list item with editable duration

**Props:**
```typescript
type EditableTaskRowProps = {
  task: TaskEstimate;
  taskIndex: number;
  isEdited: boolean;
  onSave: (taskIndex: number, newDuration: number) => void;
  validationError?: string;
};
```

**Usage:**
```tsx
{timelineResult.tasks.map((task, index) => (
  <EditableTaskRow
    key={index}
    task={task}
    taskIndex={index}
    isEdited={editedFields.includes(`tasks.${index}.duration_days`)}
    onSave={(idx, duration) => handleTaskSave(idx, duration)}
  />
))}
```

### Modified Components

#### Step5_Timeline.tsx Changes

**New Imports:**
```typescript
import { EditableNumberField } from './components/EditableNumberField';
import { EditableTaskRow } from './components/EditableTaskRow';
import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions } from '@fluentui/react-components';
import { ArrowResetRegular, EditRegular } from '@fluentui/react-icons';
```

**New State:**
```typescript
const [timelineResult, setTimelineResult] = useState<EditableTimelineResult | null>(null);
const [editingField, setEditingField] = useState<string | null>(null);
const [showResetDialog, setShowResetDialog] = useState(false);
const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
```

**New Handlers:**
```typescript
const handleFieldSave = (field: string, newValue: number) => {
  if (!timelineResult) return;

  // Validate
  const validation = validateField(field, newValue, timelineResult);
  if (!validation.valid) {
    setValidationErrors({ ...validationErrors, [field]: validation.errors[0] });
    return;
  }

  // Recalculate
  const updated = recalculateTimeline(field, newValue, timelineResult);
  
  // Save original on first edit
  if (!updated.original_estimate) {
    updated.original_estimate = { ...timelineResult };
  }

  setTimelineResult(updated);
  setValidationErrors({});
  setEditingField(null);

  // Update form data
  updateStepData(5, { ...formData.step5, timeline_result: updated });
};

const handleReset = () => {
  if (!timelineResult || !timelineResult.original_estimate) return;
  
  const restored = resetToOriginal(timelineResult);
  setTimelineResult(restored);
  updateStepData(5, { ...formData.step5, timeline_result: restored });
  setShowResetDialog(false);
};

const handleEstimateWithConfirmation = () => {
  if (timelineResult?.is_manually_edited) {
    setShowRecalculateDialog(true);
  } else {
    handleEstimateTimeline();
  }
};
```

---

## 7. Implementation Phases

### Phase 1: MVP (Core Editing) - 4-6 hours

**Scope:**
- ✅ Editable summary cards (Total, Prep, Migration, Validation)
- ✅ Basic validation (min 1, max 365, not NaN)
- ✅ Visual "edited" indicator (blue text + 📝 icon)
- ✅ Reset button with confirmation
- ✅ Save edits to formData (persist across navigation)

**Components:**
- `EditableNumberField` (new)
- Modified `Step5_Timeline.tsx`

**Testing:**
- Edit total_days → verify phases recalculate
- Edit prep_days → verify total updates
- Enter invalid value → verify error shown
- Click reset → verify values restore
- Navigate away and back → verify edits persist

### Phase 2: Enhanced Editing - 3-4 hours

**Scope:**
- ✅ Editable individual tasks
- ✅ Smart recalculation (critical path → total, non-critical → phase)
- ✅ Validation warnings (non-blocking)
- ✅ Keyboard shortcuts (Enter/Esc)
- ✅ Hover tooltips

**Components:**
- `EditableTaskRow` (new)
- Enhanced `EditableNumberField` with warnings

**Testing:**
- Edit critical path task → verify total updates
- Edit non-critical task → verify phase updates (not total)
- Use keyboard (Enter/Esc) → verify save/cancel
- Hover → verify edit icon appears

### Phase 3: Polish & Advanced Features - 2-3 hours

**Scope:**
- ✅ Confidence badge update ("Manually Adjusted")
- ✅ Recalculate confirmation dialog
- ✅ Accessibility improvements (ARIA labels, screen reader)
- ✅ Animation polish (smooth transitions)
- ✅ Comprehensive validation messages

**Testing:**
- Full accessibility audit (keyboard nav, screen reader)
- Edge cases (very large/small values, rapid edits)
- Visual polish (animations, transitions)

---

## 8. Accessibility Specification

### Keyboard Navigation

| Key | Action | Context |
|-----|--------|---------|
| **Tab** | Move to next editable field | Any editable value |
| **Shift+Tab** | Move to previous field | Any editable value |
| **Enter** | Activate edit mode | Focused editable value |
| **Enter** | Save changes | Edit mode active |
| **Esc** | Cancel edit | Edit mode active |
| **Space** | Activate edit mode | Focused editable value |

### Screen Reader Announcements

**Focus on editable field:**
```
"Total days, 12 days, editable. Press Enter to edit."
```

**Enter edit mode:**
```
"Edit mode active. Total days, current value 12. Enter a new value."
```

**Save changes:**
```
"Total days updated to 15 days. Timeline recalculated."
```

**Validation error:**
```
"Error: Minimum 1 day required. Please enter a valid value."
```

**Manual adjustment indicator:**
```
"Total days, 15 days, manually adjusted."
```

### ARIA Attributes

```tsx
<div
  role="button"
  aria-label="Total days, 12 days, click to edit"
  aria-describedby="total-days-hint"
  tabIndex={0}
  onClick={handleEdit}
  onKeyDown={handleKeyDown}
>
  12
  <span id="total-days-hint" className="sr-only">
    Press Enter or Space to edit this value
  </span>
</div>
```

### Focus Management

1. When entering edit mode → auto-focus input, select all text
2. When saving → focus returns to display value
3. When canceling → focus returns to display value
4. When showing error → focus remains on input (for correction)

---

## 9. Edge Cases & Error Handling

### Edge Case Matrix

| Scenario | System Behavior | User Feedback |
|----------|----------------|---------------|
| User enters 0 | Block save | "Minimum 1 day required" (red) |
| User enters -5 | Block save | "Minimum 1 day required" (red) |
| User enters 500 | Block save | "Maximum 365 days allowed" (red) |
| User enters "abc" | Block save | "Please enter a valid number" (red) |
| Total < phase sum | Allow save | "⚠️ Total is less than phase sum" (orange warning) |
| Critical task < 1 day | Block save | "Minimum 1 day required" (red) |
| Total > 180 days | Allow save | "⚠️ Very long timeline (>6 months)" (orange warning) |
| Edit while estimating | Disabled | "Cannot edit while estimating..." |
| Re-estimate with edits | Show confirmation | "This will discard your edits. Continue?" |
| Navigate away mid-edit | Auto-cancel | Revert to previous value, no save |
| Multiple rapid edits | Debounce recalc | Wait 300ms after last keystroke |

---

## 10. Testing Plan

### Unit Tests

```typescript
describe('EditableNumberField', () => {
  it('should enter edit mode on click', () => {});
  it('should save valid value on Enter', () => {});
  it('should cancel edit on Esc', () => {});
  it('should show error for invalid value', () => {});
  it('should show edited indicator after save', () => {});
});

describe('Timeline Validation', () => {
  it('should reject values < 1', () => {});
  it('should reject values > 365', () => {});
  it('should reject non-numeric values', () => {});
  it('should warn when total < phase sum', () => {});
});

describe('Timeline Recalculation', () => {
  it('should update phases when total changes', () => {});
  it('should update total when phase changes', () => {});
  it('should update total when critical task changes', () => {});
  it('should update phase only when non-critical task changes', () => {});
});
```

### Integration Tests

```typescript
describe('Step5_Timeline Manual Editing', () => {
  it('should persist edits across navigation', () => {});
  it('should reset to original on reset click', () => {});
  it('should confirm before recalculating with edits', () => {});
  it('should show edited indicators correctly', () => {});
});
```

### Manual Testing Checklist

- [ ] Edit total_days → phases recalculate proportionally
- [ ] Edit prep_days → total updates
- [ ] Edit migration_days → total updates
- [ ] Edit validation_days → total updates
- [ ] Edit critical path task → total updates
- [ ] Edit non-critical task → phase updates, total unchanged
- [ ] Enter invalid value (0, -5, abc) → error shown, save blocked
- [ ] Enter warning value (total < sum) → warning shown, save allowed
- [ ] Click reset → confirmation shown, values restore on confirm
- [ ] Navigate to Step4 and back → edits persist
- [ ] Click "Estimate Timeline" with edits → confirmation shown
- [ ] Confirm recalculate → edits discarded, new values shown
- [ ] Cancel recalculate → edits preserved
- [ ] Keyboard nav (Tab, Enter, Esc) → works correctly
- [ ] Screen reader → announcements are clear
- [ ] Visual polish → smooth animations, clear feedback

---

## 11. Success Metrics

### User Adoption
- **Target:** 60%+ of users edit at least one timeline value
- **Measurement:** Analytics event "timeline_field_edited"

### Accuracy Improvement
- **Target:** 30% reduction in timeline estimate variance vs actual
- **Measurement:** Compare auto-calculated vs final (with edits) vs actual completion time

### User Satisfaction
- **Target:** "Timeline editing is intuitive" → 4.5+/5 in user survey
- **Measurement:** Post-wizard survey question

### Error Rate
- **Target:** < 5% of edits result in validation errors
- **Measurement:** `validation_error_shown` / `edit_attempt` ratio

---

## 12. Open Questions & Decisions Needed

### Q1: Should we auto-reduce confidence when user edits?
**Options:**
- A) Keep original confidence (High/Medium/Low)
- B) Change to "Medium" on any edit
- C) Add "Manually Adjusted" badge, keep original confidence
- D) Remove confidence entirely when edited

**Recommendation:** **Option C** - Add "Manually Adjusted" badge, keep original confidence
**Reasoning:** Users may improve accuracy with edits. Confidence reflects auto-calculation quality, not manual accuracy.

### Q2: Should phase totals auto-adjust when tasks change?
**Options:**
- A) Yes, always recalculate phase totals from tasks
- B) No, keep phases independent
- C) Warn user if mismatch, let them choose

**Recommendation:** **Option A** - Auto-recalculate phase totals
**Reasoning:** Maintains data integrity. Phases should reflect sum of tasks.

### Q3: Should we add undo/redo?
**Options:**
- A) Yes, full undo/redo stack
- B) No, only reset button
- C) Add in Phase 3 (future enhancement)

**Recommendation:** **Option B** for MVP, **Option C** for future
**Reasoning:** Undo/redo adds complexity. Reset button covers most needs. Add if user feedback requests it.

### Q4: Should we allow decimal days (e.g., 2.5 days)?
**Options:**
- A) Yes, allow decimals (e.g., 2.5 days)
- B) No, integers only
- C) Allow decimals but convert to hours display

**Recommendation:** **Option A** - Allow decimals
**Reasoning:** More flexibility. Some tasks may realistically be 0.5 days (4 hours). Validate min 0.125 (1 hour).

---

## 13. Future Enhancements (Post-MVP)

### Timeline Visualization
- Gantt chart view of tasks
- Drag tasks to adjust durations visually
- Dependency arrows between tasks

### Advanced Recalculation
- Custom phase percentages (not fixed 25/60/15)
- Task grouping by phase (auto-categorize)
- Buffer time recommendations based on risk

### Collaboration Features
- "Suggest Edit" for non-owners
- Comment on timeline estimates
- Version history of edits

### Export & Reporting
- Export timeline to PDF
- Export to MS Project format
- Share timeline link

---

## 14. Appendix: Code Examples

### Example: EditableNumberField Component (Skeleton)

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, Input, Button } from '@fluentui/react-components';
import { CheckmarkRegular, DismissRegular, EditRegular } from '@fluentui/react-icons';

type EditableNumberFieldProps = {
  value: number;
  unit: string;
  min: number;
  max: number;
  isEdited: boolean;
  onSave: (newValue: number) => void;
  onCancel?: () => void;
  validationError?: string;
};

export const EditableNumberField: React.FC<EditableNumberFieldProps> = ({
  value,
  unit,
  min,
  max,
  isEdited,
  onSave,
  onCancel,
  validationError,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseFloat(editValue.toString());
    if (isNaN(numValue) || numValue < min || numValue > max) {
      // Validation error handled by parent
      return;
    }
    onSave(numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(parseFloat(e.target.value))}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          style={{ width: '80px' }}
        />
        <Button icon={<CheckmarkRegular />} size="small" onClick={handleSave} />
        <Button icon={<DismissRegular />} size="small" onClick={handleCancel} />
        {validationError && <span style={{ color: '#e53e3e' }}>{validationError}</span>}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
      }}
      style={{
        cursor: 'pointer',
        color: isEdited ? '#3b82f6' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span>{value} {unit}</span>
      {isEdited && <EditRegular style={{ fontSize: '14px' }} />}
    </div>
  );
};
```

---

## 15. Approval & Sign-off

**Design Reviewed By:** [Pending]  
**UX Approved By:** [Pending]  
**Technical Feasibility Confirmed By:** [Pending]  
**Ready for Implementation:** [Pending]

**Next Steps:**
1. Review this UX design document
2. Confirm approach (inline editable vs alternatives)
3. Approve implementation phases
4. Begin Phase 1 development
