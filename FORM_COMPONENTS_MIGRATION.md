# Form Components Migration Guide

**Version:** 1.0.0  
**Date:** October 18, 2025  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Benefits](#benefits)
3. [Migration Strategy](#migration-strategy)
4. [Before/After Examples](#beforeafter-examples)
   - [Buttons](#buttons)
   - [Text Inputs](#text-inputs)
   - [Dropdowns](#dropdowns)
   - [Checkboxes & Switches](#checkboxes--switches)
   - [Radio Groups](#radio-groups)
   - [Cards](#cards)
5. [File-by-File Checklist](#file-by-file-checklist)
6. [Testing Checklist](#testing-checklist)
7. [Common Pitfalls](#common-pitfalls)

---

## Migration Overview

This guide documents the migration from Fluent UI components and native HTML elements to the Purple Glass Component Library. The library provides consistent styling, glassmorphism effects, validation states, and accessibility out of the box.

### Scope Analysis

Based on comprehensive codebase analysis:

- **100+ Button Instances**: Mix of Fluent `<Button>` and native `<button>` across 20+ files
- **50+ Input Instances**: Fluent `<Field>` + `<Input>` combinations
- **20+ Dropdown Instances**: Fluent `<Dropdown>` components
- **15+ Checkbox/Switch Instances**: Various form controls
- **10+ Radio Group Instances**: Strategy and option selections
- **200+ Inline Style Props**: Hardcoded colors, spacing, and typography

### Migration Effort Estimate

| Priority | Files | Instances | Estimated Hours |
|----------|-------|-----------|-----------------|
| **High** | 7 files | ~30 instances | 4-6 hours |
| **Medium** | 5 files | ~25 instances | 3-4 hours |
| **Low** | 10+ files | ~60 instances | 8-12 hours |
| **Total** | 20+ files | 115+ instances | **15-22 hours** |

### Phased Approach

**Phase 1: Activity Wizard** (High Priority)
- Most visible user-facing feature
- Clean component boundaries
- ~30 component replacements
- Estimated: 4-6 hours

**Phase 2: Cluster Strategy & Project Views** (Medium Priority)
- Core application workflows
- ~25 component replacements
- Estimated: 3-4 hours

**Phase 3: Remaining Views** (Low Priority)
- Settings, hardware views, charts
- ~60 component replacements
- Estimated: 8-12 hours

---

## Benefits

### 1. Design Consistency

✅ All components use Fluent 2 design tokens  
✅ Glassmorphism effects applied uniformly  
✅ Consistent spacing, sizing, and typography  
✅ No hardcoded values

### 2. Improved Accessibility

✅ ARIA labels and descriptions  
✅ Keyboard navigation (Tab, Enter, Space, Arrow keys, Escape)  
✅ Screen reader support  
✅ Focus management  
✅ WCAG AA compliant contrast ratios

### 3. Validation States

✅ Built-in error, warning, success states  
✅ Helper text for context  
✅ Visual indicators (colors, icons, borders)  
✅ Consistent validation UX

### 4. Reduced Boilerplate

Before (Fluent UI):
```typescript
<Field label="Project Name" validationMessage={error}>
  <Input 
    value={name}
    onChange={(e) => setName(e.target.value)}
    appearance="filled-darker"
  />
</Field>
```

After (Purple Glass):
```typescript
<PurpleGlassInput 
  label="Project Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  validationState={error ? 'error' : 'default'}
  helperText={error}
/>
```

### 5. Maintainability

✅ Single source of truth for component styling  
✅ Easy to update globally (change style hooks)  
✅ TypeScript strict mode compliance  
✅ Documented props and usage patterns

---

## Before/After Examples

### Buttons

#### Pattern 1: Fluent Button → PurpleGlassButton

**Before (Fluent UI):**
```typescript
import { Button } from '@fluentui/react-components';

<Button 
  appearance="primary"
  onClick={handleClick}
>
  Save Changes
</Button>

<Button 
  appearance="secondary"
  icon={<DeleteRegular />}
  onClick={handleDelete}
>
  Delete
</Button>
```

**After (Purple Glass):**
```typescript
import { PurpleGlassButton } from '@/components/ui';

<PurpleGlassButton 
  variant="primary"
  onClick={handleClick}
>
  Save Changes
</PurpleGlassButton>

<PurpleGlassButton 
  variant="danger"
  icon={<DeleteRegular />}
  onClick={handleDelete}
>
  Delete
</PurpleGlassButton>
```

**Changes:**
- `appearance` → `variant`
- Additional variants: `danger`, `ghost`, `link`
- Built-in `glass` prop for glassmorphism
- `loading` state with built-in spinner

---

#### Pattern 2: Native Button with Inline Styles → PurpleGlassButton

**Before (Native HTML):**
```typescript
<button 
  onClick={handleClick}
  style={{
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'Poppins, sans-serif'
  }}
>
  Click Me
</button>
```

**After (Purple Glass):**
```typescript
import { PurpleGlassButton } from '@/components/ui';

<PurpleGlassButton 
  variant="primary"
  onClick={handleClick}
>
  Click Me
</PurpleGlassButton>
```

**Changes:**
- Remove all inline styles
- Use `variant="primary"` for purple background
- Typography, spacing, border radius automatically applied
- Hover, focus, active states built-in

---

#### Pattern 3: Icon-Only Buttons

**Before:**
```typescript
<Button 
  appearance="subtle"
  icon={<EditRegular />}
  onClick={handleEdit}
  aria-label="Edit"
/>
```

**After:**
```typescript
<PurpleGlassButton 
  variant="ghost"
  icon={<EditRegular />}
  onClick={handleEdit}
  aria-label="Edit"
/>
```

**Changes:**
- `appearance="subtle"` → `variant="ghost"`
- Same icon-only behavior (children omitted)
- ARIA label still required for accessibility

---

### Text Inputs

#### Pattern 4: Fluent Field + Input → PurpleGlassInput

**Before (Fluent UI):**
```typescript
import { Field, Input } from '@fluentui/react-components';

<Field 
  label="Project Name"
  validationState={error ? 'error' : 'none'}
  validationMessage={error}
  required
>
  <Input 
    value={name}
    onChange={(e, data) => setName(data.value)}
    placeholder="Enter project name"
    appearance="filled-darker"
  />
</Field>
```

**After (Purple Glass):**
```typescript
import { PurpleGlassInput } from '@/components/ui';

<PurpleGlassInput 
  label="Project Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Enter project name"
  validationState={error ? 'error' : 'default'}
  helperText={error}
  required
  glass="light"
/>
```

**Changes:**
- Combines Field + Input into single component
- `validationMessage` → `helperText` (shown always, not just errors)
- Standard React `onChange` (no Fluent-specific `data` param)
- `validationState` has 4 levels: `default`, `error`, `warning`, `success`
- Added `glass` prop for glassmorphism effect
- `appearance` prop removed (styling via design tokens)

---

#### Pattern 5: Input with Icons

**Before:**
```typescript
<Field label="Search">
  <Input 
    value={search}
    onChange={(e, data) => setSearch(data.value)}
    contentBefore={<SearchRegular />}
    placeholder="Search projects..."
  />
</Field>
```

**After:**
```typescript
<PurpleGlassInput 
  label="Search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  prefixIcon={<SearchRegular />}
  placeholder="Search projects..."
  glass="medium"
/>
```

**Changes:**
- `contentBefore` → `prefixIcon`
- `contentAfter` → `suffixIcon`
- Icons styled consistently

---

#### Pattern 6: Native Input → PurpleGlassInput

**Before:**
```typescript
<div>
  <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
    Email Address *
  </label>
  <input 
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={{
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      fontFamily: 'Poppins, sans-serif'
    }}
  />
  {error && <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
</div>
```

**After:**
```typescript
<PurpleGlassInput 
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validationState={error ? 'error' : 'default'}
  helperText={error}
  required
/>
```

**Changes:**
- Remove wrapper divs and manual label
- Remove all inline styles
- Validation styling built-in
- Required indicator (*) automatic

---

### Dropdowns

#### Pattern 7: Fluent Dropdown → PurpleGlassDropdown

**Before (Fluent UI):**
```typescript
import { Dropdown, Option } from '@fluentui/react-components';

<Field label="Cluster Strategy" required>
  <Dropdown 
    value={strategy}
    onOptionSelect={(e, data) => setStrategy(data.optionValue as string)}
    placeholder="Select a strategy..."
  >
    <Option value="lift-shift">Lift & Shift</Option>
    <Option value="replatform">Replatform</Option>
    <Option value="refactor">Refactor</Option>
  </Dropdown>
</Field>
```

**After (Purple Glass):**
```typescript
import { PurpleGlassDropdown } from '@/components/ui';

const strategyOptions = [
  { value: 'lift-shift', label: 'Lift & Shift' },
  { value: 'replatform', label: 'Replatform' },
  { value: 'refactor', label: 'Refactor' }
];

<PurpleGlassDropdown 
  label="Cluster Strategy"
  options={strategyOptions}
  value={strategy}
  onChange={(value) => setStrategy(value as string)}
  placeholder="Select a strategy..."
  required
  glass="light"
/>
```

**Changes:**
- No need for Field wrapper
- Children (Option components) → `options` prop array
- Simpler onChange handler (just value, not event)
- Built-in search with `searchable` prop
- Multi-select with `multiSelect` prop

---

#### Pattern 8: Multi-Select Dropdown

**Before:**
```typescript
<Dropdown 
  multiselect
  value={selectedItems}
  onOptionSelect={(e, data) => setSelectedItems(data.selectedOptions)}
>
  {items.map(item => (
    <Option key={item.id} value={item.id}>{item.name}</Option>
  ))}
</Dropdown>
```

**After:**
```typescript
<PurpleGlassDropdown 
  label="Select Items"
  options={items.map(item => ({ value: item.id, label: item.name }))}
  value={selectedItems}
  onChange={(value) => setSelectedItems(value as string[])}
  multiSelect
  searchable
  searchPlaceholder="Search items..."
/>
```

**Changes:**
- `multiselect` → `multiSelect` (camelCase)
- Value is string[] for multi-select
- Built-in tags for selected items (removable)
- Optional search functionality

---

### Checkboxes & Switches

#### Pattern 9: Fluent Checkbox → PurpleGlassCheckbox

**Before:**
```typescript
import { Checkbox } from '@fluentui/react-components';

<Checkbox 
  label="I accept the terms and conditions"
  checked={accepted}
  onChange={(e, data) => setAccepted(data.checked === true)}
/>
```

**After:**
```typescript
import { PurpleGlassCheckbox } from '@/components/ui';

<PurpleGlassCheckbox 
  label="I accept the terms and conditions"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>
```

**Changes:**
- Standard React onChange (no Fluent-specific `data`)
- `e.target.checked` instead of `data.checked`
- Built-in indeterminate state support
- Validation states available

---

#### Pattern 10: Fluent Switch → PurpleGlassSwitch

**Before:**
```typescript
import { Switch } from '@fluentui/react-components';

<Field label="Enable Notifications">
  <Switch 
    checked={enabled}
    onChange={(e, data) => setEnabled(data.checked)}
  />
</Field>
```

**After:**
```typescript
import { PurpleGlassSwitch } from '@/components/ui';

<PurpleGlassSwitch 
  label="Enable Notifications"
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
  glass="medium"
/>
```

**Changes:**
- Label built into component (no Field wrapper)
- Standard onChange
- `labelPosition` prop for label placement (`before` | `after`)
- Helper text support

---

### Radio Groups

#### Pattern 11: Fluent RadioGroup → PurpleGlassRadioGroup

**Before:**
```typescript
import { RadioGroup, Radio } from '@fluentui/react-components';

<Field label="Deployment Environment" required>
  <RadioGroup 
    value={environment}
    onChange={(e, data) => setEnvironment(data.value)}
  >
    <Radio value="dev" label="Development" />
    <Radio value="staging" label="Staging" />
    <Radio value="production" label="Production" />
  </RadioGroup>
</Field>
```

**After:**
```typescript
import { PurpleGlassRadioGroup, PurpleGlassRadio } from '@/components/ui';

<PurpleGlassRadioGroup 
  label="Deployment Environment"
  value={environment}
  onChange={(value) => setEnvironment(value)}
  required
  glass="light"
>
  <PurpleGlassRadio value="dev" label="Development" />
  <PurpleGlassRadio value="staging" label="Staging" />
  <PurpleGlassRadio value="production" label="Production" />
</PurpleGlassRadioGroup>
```

**Changes:**
- Label on RadioGroup, not Field
- Simpler onChange (just value string)
- Group-level `glass` prop (applies to all radios)
- Group-level `disabled` prop
- Validation states on group level

---

#### Pattern 12: Radio Card Variant (Wizard Steps)

**Before:**
```typescript
<RadioGroup value={strategy} onChange={(e, data) => setStrategy(data.value)}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <Card 
      style={{ 
        cursor: 'pointer',
        border: strategy === 'lift-shift' ? '2px solid #8b5cf6' : '1px solid #ccc'
      }}
      onClick={() => setStrategy('lift-shift')}
    >
      <Radio value="lift-shift" label="Lift & Shift" />
      <p>Move applications as-is with minimal changes</p>
    </Card>
    {/* More cards... */}
  </div>
</RadioGroup>
```

**After:**
```typescript
<PurpleGlassRadioGroup 
  label="Select Migration Strategy"
  value={strategy}
  onChange={(value) => setStrategy(value)}
  required
>
  <PurpleGlassRadio 
    value="lift-shift"
    cardVariant
    cardTitle="Lift & Shift"
    cardDescription="Move applications as-is with minimal changes"
  />
  <PurpleGlassRadio 
    value="replatform"
    cardVariant
    cardTitle="Replatform"
    cardDescription="Make optimizations to leverage cloud capabilities"
  />
  <PurpleGlassRadio 
    value="refactor"
    cardVariant
    cardTitle="Refactor"
    cardDescription="Redesign for cloud-native benefits"
  />
</PurpleGlassRadioGroup>
```

**Changes:**
- `cardVariant` prop creates large clickable card
- `cardTitle` and `cardDescription` props for content
- Automatic selection styling (purple border)
- No manual Card or layout styling needed

---

### Cards

#### Pattern 13: Fluent Card → PurpleGlassCard

**Before:**
```typescript
import { Card, CardHeader } from '@fluentui/react-components';

<Card 
  style={{ 
    padding: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)'
  }}
>
  <CardHeader>
    <div style={{ fontWeight: 600, fontSize: '18px' }}>
      Project Details
    </div>
  </CardHeader>
  <div>
    <p>Content goes here...</p>
  </div>
</Card>
```

**After:**
```typescript
import { PurpleGlassCard } from '@/components/ui';

<PurpleGlassCard 
  header="Project Details"
  glass="medium"
  padding="large"
>
  <p>Content goes here...</p>
</PurpleGlassCard>
```

**Changes:**
- Remove inline styles for glassmorphism
- `header` prop for title (string or ReactNode)
- `glass` prop for built-in glassmorphism
- `padding` prop with predefined levels
- No CardHeader component needed

---

#### Pattern 14: Interactive Cards

**Before:**
```typescript
<Card 
  onClick={handleClick}
  style={{ 
    cursor: 'pointer',
    border: selected ? '2px solid #8b5cf6' : '1px solid #ccc',
    transition: 'all 0.2s'
  }}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
  <p>Clickable card content</p>
</Card>
```

**After:**
```typescript
<PurpleGlassCard 
  variant="interactive"
  onClick={handleClick}
  selected={selected}
  glass="light"
>
  <p>Clickable card content</p>
</PurpleGlassCard>
```

**Changes:**
- `variant="interactive"` adds hover/focus/click effects
- `selected` prop for selection styling
- Keyboard navigation built-in (Enter/Space)
- ARIA attributes automatic
- No manual state management for hover

---

### Textareas

#### Pattern 15: Native Textarea → PurpleGlassTextarea

**Before:**
```typescript
<div>
  <label>Description</label>
  <textarea 
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    maxLength={500}
    style={{
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'Poppins, sans-serif',
      minHeight: '120px'
    }}
  />
  <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
    {description.length}/500
  </div>
</div>
```

**After:**
```typescript
<PurpleGlassTextarea 
  label="Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  maxLength={500}
  showCharacterCount
  autoResize
  glass="light"
/>
```

**Changes:**
- Remove manual character counter
- `showCharacterCount` prop adds built-in counter
- `autoResize` dynamically adjusts height
- Automatic warning/error colors at 80%/100% of maxLength
- All styling via design tokens

---

## File-by-File Checklist

### High Priority (4-6 hours)

| File | Components | Instances | Complexity | Status |
|------|-----------|-----------|------------|--------|
| `ActivityWizard.tsx` | Button, Input, Dropdown, Radio | ~8 | Medium | 🔴 Not Started |
| `ActivityTypeStep.tsx` | Button, Radio (card variant) | ~5 | Medium | 🔴 Not Started |
| `ActivityDetailsStep.tsx` | Button, Input, Textarea, Checkbox | ~6 | High | 🔴 Not Started |
| `ActivitySummaryStep.tsx` | Button, Card | ~4 | Low | 🔴 Not Started |
| `WizardNavigation.tsx` | Button (4 instances) | ~4 | Low | 🔴 Not Started |
| `ClusterStrategyModal.tsx` | Button (3), Input, Dropdown | ~8 | Medium | 🔴 Not Started |
| `ProjectWorkspaceView.tsx` | Button (9), Input, Card | ~12 | High | 🔴 Not Started |

**Total High Priority:** ~47 instances, 4-6 hours

---

### Medium Priority (3-4 hours)

| File | Components | Instances | Complexity | Status |
|------|-----------|-----------|------------|--------|
| `ClusterStrategyList.tsx` | Button (3), Card | ~5 | Low | 🔴 Not Started |
| `ProjectDetailView.tsx` | Button (10), Card | ~12 | Medium | 🔴 Not Started |
| `ProjectMigrationWorkspace.tsx` | Button (7), Input, Dropdown | ~10 | Medium | 🔴 Not Started |
| `EnhancedGanttChart.tsx` | Button (2) | ~2 | Low | 🔴 Not Started |
| `GanttChart.tsx` | Button (5) | ~5 | Low | 🔴 Not Started |

**Total Medium Priority:** ~34 instances, 3-4 hours

---

### Low Priority (8-12 hours)

| File | Components | Instances | Complexity | Status |
|------|-----------|-----------|------------|--------|
| `HardwareLifecycleView.tsx` | Button, Input, Card | ~10 | Medium | 🔴 Not Started |
| `DominoConfigurationSection.tsx` | Button, Input | ~6 | Low | 🔴 Not Started |
| `SettingsView.tsx` | Button, Input, Switch | ~8 | Medium | 🔴 Not Started |
| `NetworkTopologyView.tsx` | Button, Input | ~5 | Low | 🔴 Not Started |
| `WorkloadMappingView.tsx` | Button, Dropdown | ~5 | Low | 🔴 Not Started |
| `UserManagementView.tsx` | Button, Input, Card | ~8 | Medium | 🔴 Not Started |
| **10+ more files** | Various | ~30+ | Various | 🔴 Not Started |

**Total Low Priority:** ~72 instances, 8-12 hours

---

## Testing Checklist

After migrating each file, verify:

### Visual Testing

- [ ] Component renders correctly
- [ ] Glass effect (if enabled) displays properly
- [ ] Spacing and typography match design system
- [ ] Hover states work
- [ ] Focus states are visible
- [ ] Disabled states render correctly
- [ ] Loading states work (buttons)

### Functional Testing

- [ ] onClick handlers fire correctly
- [ ] onChange handlers update state
- [ ] Form validation works
- [ ] Error messages display
- [ ] Required fields enforced
- [ ] Multi-select dropdowns select multiple items
- [ ] Radio groups select single item
- [ ] Checkboxes toggle correctly
- [ ] Switches toggle correctly

### Accessibility Testing

- [ ] Tab navigation works
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate dropdowns/radios
- [ ] Escape closes dropdowns
- [ ] Screen reader announces labels
- [ ] Screen reader announces validation states
- [ ] Focus visible on all interactive elements
- [ ] ARIA labels present

### Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Common Pitfalls

### 1. onChange Parameter Differences

❌ **Wrong:**
```typescript
// Fluent UI onChange
<PurpleGlassInput 
  onChange={(e, data) => setName(data.value)}  // data doesn't exist!
/>
```

✅ **Correct:**
```typescript
// Standard React onChange
<PurpleGlassInput 
  onChange={(e) => setName(e.target.value)}
/>
```

---

### 2. Validation State Values

❌ **Wrong:**
```typescript
<PurpleGlassInput 
  validationState={error ? 'error' : 'none'}  // 'none' is not valid!
/>
```

✅ **Correct:**
```typescript
<PurpleGlassInput 
  validationState={error ? 'error' : 'default'}  // Use 'default'
/>
```

Valid values: `'default'`, `'error'`, `'warning'`, `'success'`

---

### 3. Dropdown Value Type (Single vs Multi)

❌ **Wrong:**
```typescript
// Multi-select but value is string
<PurpleGlassDropdown 
  multiSelect
  value={selected}  // Should be string[], not string!
  onChange={(value) => setSelected(value as string)}
/>
```

✅ **Correct:**
```typescript
// Single-select: string
<PurpleGlassDropdown 
  value={selected}  // string
  onChange={(value) => setSelected(value as string)}
/>

// Multi-select: string[]
<PurpleGlassDropdown 
  multiSelect
  value={selectedItems}  // string[]
  onChange={(value) => setSelectedItems(value as string[])}
/>
```

---

### 4. Forgetting Required Dropdown Props

❌ **Wrong:**
```typescript
<PurpleGlassDropdown 
  label="Select Option"
  // Missing: options, value, onChange!
/>
```

✅ **Correct:**
```typescript
<PurpleGlassDropdown 
  label="Select Option"
  options={options}  // Required
  value={selected}   // Required
  onChange={(value) => setSelected(value as string)}  // Required
/>
```

---

### 5. Radio Group Context

❌ **Wrong:**
```typescript
// Radios without RadioGroup
<PurpleGlassRadio value="option1" label="Option 1" />
<PurpleGlassRadio value="option2" label="Option 2" />
```

✅ **Correct:**
```typescript
// Radios inside RadioGroup
<PurpleGlassRadioGroup 
  label="Choose Option"
  value={selected}
  onChange={(value) => setSelected(value)}
>
  <PurpleGlassRadio value="option1" label="Option 1" />
  <PurpleGlassRadio value="option2" label="Option 2" />
</PurpleGlassRadioGroup>
```

---

### 6. Glass Variant Inconsistency

❌ **Wrong:**
```typescript
// Different glass levels within same context
<PurpleGlassCard glass="light">
  <PurpleGlassInput glass="heavy" />  // Inconsistent!
  <PurpleGlassButton glass="medium" />  // Also inconsistent!
</PurpleGlassCard>
```

✅ **Correct:**
```typescript
// Consistent glass level
const GLASS: GlassVariant = 'medium';

<PurpleGlassCard glass={GLASS}>
  <PurpleGlassInput glass={GLASS} />
  <PurpleGlassButton glass={GLASS} />
</PurpleGlassCard>
```

---

### 7. Missing Import Paths

❌ **Wrong:**
```typescript
import { PurpleGlassButton } from './components/ui/PurpleGlassButton';
// Absolute path, can break!
```

✅ **Correct:**
```typescript
import { PurpleGlassButton } from '@/components/ui';
// Use barrel export from index.ts
```

---

### 8. Helper Text vs Validation Message

❌ **Wrong:**
```typescript
<PurpleGlassInput 
  label="Email"
  validationMessage={error}  // Wrong prop name!
/>
```

✅ **Correct:**
```typescript
<PurpleGlassInput 
  label="Email"
  helperText={error || 'Enter your email'}  // Always shown, not just errors
  validationState={error ? 'error' : 'default'}
/>
```

---

### 9. Character Count Threshold

❌ **Wrong:**
```typescript
<PurpleGlassTextarea 
  maxLength={500}
  showCharacterCount
  warningThreshold={400}  // Should be 0-1, not absolute number!
/>
```

✅ **Correct:**
```typescript
<PurpleGlassTextarea 
  maxLength={500}
  showCharacterCount
  warningThreshold={0.8}  // 80% of maxLength = 400 chars
/>
```

---

### 10. Button Loading State Without Disabled

❌ **Wrong:**
```typescript
<PurpleGlassButton 
  loading={isSubmitting}
  onClick={handleSubmit}  // Can still be clicked while loading!
>
  Submit
</PurpleGlassButton>
```

✅ **Correct:**
```typescript
<PurpleGlassButton 
  loading={isSubmitting}
  disabled={isSubmitting || !formValid}  // Disable during loading
  onClick={handleSubmit}
>
  Submit
</PurpleGlassButton>
```

---

## Migration Workflow

### Step-by-Step Process

1. **Choose a File** from the checklist (start with High Priority)

2. **Create a Feature Branch**
   ```bash
   git checkout -b migrate/[file-name]
   # e.g., git checkout -b migrate/activity-wizard
   ```

3. **Update Imports**
   ```typescript
   // Remove Fluent imports
   - import { Button, Input, Field } from '@fluentui/react-components';
   
   // Add Purple Glass imports
   + import { PurpleGlassButton, PurpleGlassInput } from '@/components/ui';
   ```

4. **Replace Components** one at a time using patterns from this guide

5. **Test Visually** in browser
   - Verify appearance
   - Check hover/focus states
   - Test glassmorphism if enabled

6. **Test Functionality**
   - Click all buttons
   - Type in all inputs
   - Select dropdown options
   - Check validation states

7. **Test Accessibility**
   - Tab through all elements
   - Use Enter/Space to activate
   - Test with screen reader if possible

8. **Commit Changes**
   ```bash
   git add .
   git commit -m "refactor([file]): Migrate to Purple Glass components"
   git push origin migrate/[file-name]
   ```

9. **Update Checklist** - Mark file as complete

10. **Repeat** for next file

---

## Quick Reference

### Component Mapping

| Before (Fluent/Native) | After (Purple Glass) | Notes |
|------------------------|----------------------|-------|
| `<Button>` | `<PurpleGlassButton>` | `appearance` → `variant` |
| `<button>` | `<PurpleGlassButton>` | Remove inline styles |
| `<Field> + <Input>` | `<PurpleGlassInput>` | Combined component |
| `<input>` | `<PurpleGlassInput>` | Remove inline styles |
| `<Field> + <Textarea>` | `<PurpleGlassTextarea>` | Add `autoResize`, `showCharacterCount` |
| `<textarea>` | `<PurpleGlassTextarea>` | Remove inline styles |
| `<Dropdown> + <Option>` | `<PurpleGlassDropdown>` | `options` prop array |
| `<select> + <option>` | `<PurpleGlassDropdown>` | Much better UX |
| `<Checkbox>` | `<PurpleGlassCheckbox>` | Standard onChange |
| `<input type="checkbox">` | `<PurpleGlassCheckbox>` | Remove inline styles |
| `<RadioGroup> + <Radio>` | `<PurpleGlassRadioGroup>` + `<PurpleGlassRadio>` | Context-based |
| `<Switch>` | `<PurpleGlassSwitch>` | Standard onChange |
| `<Card>` | `<PurpleGlassCard>` | `header`, `glass`, `variant` props |
| `<div>` with styles | `<PurpleGlassCard>` | Consider using Card |

---

## Support

### Questions?

Refer to:
- [COMPONENT_LIBRARY_GUIDE.md](./COMPONENT_LIBRARY_GUIDE.md) - Full component documentation
- [TASK_4_6_REFACTORING_PROGRESS.md](./TASK_4_6_REFACTORING_PROGRESS.md) - Refactoring strategy
- Component source code in `frontend/src/components/ui/`

### Found an Issue?

If you discover a bug or limitation in a Purple Glass component:
1. Document the issue
2. Check if it's a TypeScript error or runtime error
3. Consider if it can be solved with props, or needs component update
4. Create a task to fix the component

---

## Summary

### Migration Priorities

1. **Start with Activity Wizard** (most visible, highest impact)
2. **Move to Cluster Strategy & Project Views** (core workflows)
3. **Gradually refactor remaining views** (as time permits)

### Key Takeaways

✅ Use Purple Glass components for consistency  
✅ Remove all inline styles  
✅ Apply glassmorphism thoughtfully (don't overuse `heavy`)  
✅ Test accessibility after each migration  
✅ Commit frequently with descriptive messages  
✅ Update this checklist as you progress

### Estimated Timeline

- **Phase 1 (High Priority):** 4-6 hours → Week 1
- **Phase 2 (Medium Priority):** 3-4 hours → Week 2
- **Phase 3 (Low Priority):** 8-12 hours → Weeks 3-4

**Total:** 15-22 hours over 3-4 weeks

---

**Good luck with the migration! 🚀**

Remember: Quality over speed. Take time to test each file thoroughly before moving to the next.
