# Stage 4: Form Components Audit & Standardization Plan

**Date:** October 18, 2025  
**Status:** In Progress (Task 4.1)  
**Goal:** Create standardized, reusable form components with design tokens and Fluent UI 2 best practices

---

## Executive Summary

### Findings

**Component Usage Inconsistencies:**
- ❌ Mix of Fluent `<Button>` and native `<button>` elements across views
- ❌ Direct Fluent UI component usage (no standardized wrappers)
- ❌ Inline styles scattered throughout JSX
- ❌ Hardcoded values (colors, spacing, sizes)
- ❌ No centralized component library
- ❌ Inconsistent validation states and error handling

**Components Identified:**
1. **Button** - Most used component (100+ instances)
2. **Input** - Heavily used in wizards and forms (50+ instances)
3. **Dropdown** - Strategy selection, filters (20+ instances)
4. **Radio/RadioGroup** - Option selection in wizards (15+ instances)
5. **Textarea** - Descriptions, notes (10+ instances)
6. **Card** - Content containers (10+ instances)
7. **Checkbox/Switch** - Feature toggles (needs audit)
8. **SearchBox** - Likely present (needs audit)

---

## Detailed Component Analysis

### 1. Button Component

**Current State:**
- **Fluent Button**: Used in ActivityWizard, ClusterStrategy, ProjectDetailView
- **Native button**: Used in ProjectWorkspaceView, GanttChart, ClusterStrategyManagerView
- **Inline styles**: Many buttons have style props with hardcoded values
- **Inconsistent appearances**: `primary`, `secondary`, `subtle` used inconsistently

**Issues:**
```tsx
// ❌ Native button with inline styles
<button style={{ padding: '8px 16px', background: '#8b5cf6' }}>...</button>

// ❌ Fluent button with inline styles
<Button appearance="primary" style={DesignTokens.components.button.primary}>...</Button>

// ❌ Hardcoded colors
<button style={{ color: '#6b7280', transition: 'color 0.2s ease' }}>...</button>
```

**Files Affected:**
- `ProjectWorkspaceView.tsx` - 10+ native buttons
- `GanttChart.tsx` - 5+ native buttons
- `ClusterStrategyManagerView.tsx` - 3+ native buttons
- `ActivityWizard/Steps/*` - Multiple Fluent buttons
- `ProjectDetailView.tsx` - Mix of both

### 2. Input Component

**Current State:**
- **Fluent Input**: Used in wizard steps, ClusterStrategyModal, ProjectDetailView
- **Inline styles**: Some inputs have style props
- **No standard validation**: Validation handled inconsistently
- **No error states**: Error display varies by component

**Issues:**
```tsx
// ❌ Basic Input without standardized styling
<Input value={name} onChange={(e) => setName(e.target.value)} />

// ❌ No validation feedback
<Input type="number" /* no validation state */ />

// ❌ Inconsistent labels
<Field label="Name"><Input /></Field>
// vs
<div><label>Name</label><Input /></div>
```

**Files Affected:**
- `Step1_Basics.tsx` - 2 inputs
- `Step2_SourceDestination.tsx` - 2 inputs
- `Step3_Infrastructure.tsx` - 3 inputs
- `Step4_CapacityValidation.tsx` - 9 inputs
- `Step6_Assignment.tsx` - 4 inputs
- `ClusterStrategyModal.tsx` - 8 inputs
- `ProjectDetailView.tsx` - 2 inputs

### 3. Dropdown Component

**Current State:**
- **Fluent Dropdown**: Used in ClusterStrategyModal, DominoConfigurationSection, ProjectDetailView
- **Inline styles**: Some dropdowns styled inline
- **Inconsistent option handling**: Different patterns for options

**Issues:**
```tsx
// ❌ Basic Dropdown without standardization
<Dropdown
  placeholder="Select..."
  onOptionSelect={(e, data) => setValue(data.optionValue)}
>
  {options.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
</Dropdown>
```

**Files Affected:**
- `ClusterStrategyModal.tsx` - 3 dropdowns
- `DominoConfigurationSection.tsx` - 1 dropdown
- `ProjectDetailView.tsx` - 1 dropdown

### 4. Radio/RadioGroup Component

**Current State:**
- **Fluent Radio**: Used in wizard steps for option selection
- **Custom card wrapping**: Many radios wrapped in styled divs
- **Inline styles**: Radio cards have inline styling

**Issues:**
```tsx
// ❌ Radio with custom card wrapper and inline styles
<div style={{ border: '2px solid #8b5cf6', borderRadius: '8px' }}>
  <Radio value="option1" label="" />
  <div>Option content</div>
</div>
```

**Files Affected:**
- `Step1_Basics.tsx` - 3 radio groups
- `Step2_SourceDestination.tsx` - 2 radio groups
- `ClusterStrategyModal.tsx` - 1 radio group

### 5. Textarea Component

**Current State:**
- **Fluent Textarea**: Used in Step1_Basics, ClusterStrategyModal
- **Basic implementation**: No standardized sizing or validation

**Issues:**
```tsx
// ❌ Basic Textarea without standardization
<Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
```

**Files Affected:**
- `Step1_Basics.tsx` - 1 textarea
- `ClusterStrategyModal.tsx` - 1 textarea

### 6. Card Component

**Current State:**
- **Fluent Card**: Used in ProjectWorkspaceViewNewFixed for workflow/stat cards
- **Custom divs**: Many card-like elements using `<div>` with glassmorphism styles
- **Inconsistent styling**: No standard card pattern

**Files Affected:**
- `ProjectWorkspaceViewNewFixed.tsx` - Card usage
- Multiple views - Custom card divs

---

## Standardization Plan

### Phase 1: Create Component Library (Tasks 4.2-4.5)

#### Directory Structure
```
frontend/src/components/ui/
├── PurpleGlassButton.tsx
├── PurpleGlassInput.tsx
├── PurpleGlassCard.tsx
├── PurpleGlassDropdown.tsx
├── PurpleGlassTextarea.tsx
├── PurpleGlassCheckbox.tsx
├── PurpleGlassRadio.tsx
├── PurpleGlassSwitch.tsx
├── index.ts (barrel export)
└── styles/
    ├── useButtonStyles.ts
    ├── useInputStyles.ts
    ├── useCardStyles.ts
    └── useFormStyles.ts
```

#### Component Requirements

**All Components Must:**
- ✅ Use makeStyles (Griffel) for styling
- ✅ Use design tokens exclusively (no hardcoded values)
- ✅ Support glassmorphism variants
- ✅ Have proper TypeScript interfaces
- ✅ Include validation states (error, warning, success)
- ✅ Support loading states where appropriate
- ✅ Be fully accessible (ARIA, keyboard nav, screen readers)
- ✅ Support all Fluent UI 2 props via prop spreading
- ✅ Include JSDoc documentation

### Phase 2: Refactor Existing Components (Task 4.6-4.7)

#### Priority Order
1. **ActivityWizard Steps** (already refactored with tokens - easiest to convert)
2. **ClusterStrategyModal** (heavily uses forms)
3. **ProjectDetailView** (mixed usage)
4. **ProjectWorkspaceView** (many native buttons)
5. **GanttChart** (native buttons, needs redesign)
6. **Other views** (systematic conversion)

#### Conversion Pattern
```tsx
// BEFORE ❌
<button
  style={{ 
    padding: '8px 16px', 
    background: '#8b5cf6',
    color: 'white',
    borderRadius: '4px'
  }}
  onClick={handleClick}
>
  Click Me
</button>

// AFTER ✅
import { PurpleGlassButton } from '@/components/ui';

<PurpleGlassButton
  variant="primary"
  onClick={handleClick}
>
  Click Me
</PurpleGlassButton>
```

### Phase 3: Documentation (Task 4.8)

#### Deliverables
1. **Component Guide** (`COMPONENT_LIBRARY_GUIDE.md`)
   - Usage examples for each component
   - Variant demonstrations
   - Accessibility notes
   - Best practices

2. **Migration Guide** (`FORM_COMPONENTS_MIGRATION.md`)
   - Before/after examples
   - Common patterns
   - Troubleshooting

3. **Storybook** (future consideration)
   - Interactive component demos
   - Visual regression testing

---

## Implementation Tasks

### Task 4.1: Audit Current Form Component Usage ✅
- [x] Search for all Fluent UI component usage
- [x] Identify native HTML element usage
- [x] Document inline styles and hardcoded values
- [x] Create this audit document
- [x] Define standardization requirements

### Task 4.2: Create PurpleGlassInput Component
- [ ] Create `useInputStyles.ts` hook with design tokens
- [ ] Build `PurpleGlassInput.tsx` component
- [ ] Add validation states (error, warning, success)
- [ ] Add loading state
- [ ] Add glassmorphism variant
- [ ] Add TypeScript interfaces
- [ ] Add JSDoc documentation
- [ ] Test with existing forms

### Task 4.3: Create PurpleGlassButton Component
- [ ] Create `useButtonStyles.ts` hook with design tokens
- [ ] Build `PurpleGlassButton.tsx` component
- [ ] Add variants (primary, secondary, danger, ghost, link)
- [ ] Add sizes (small, medium, large)
- [ ] Add loading state
- [ ] Add icon support (start/end)
- [ ] Add disabled state
- [ ] Add TypeScript interfaces
- [ ] Add JSDoc documentation

### Task 4.4: Create PurpleGlassCard Component
- [ ] Create `useCardStyles.ts` hook with design tokens
- [ ] Build `PurpleGlassCard.tsx` component
- [ ] Add variants (default, interactive, elevated, outlined)
- [ ] Add hover effects
- [ ] Add glassmorphism variants
- [ ] Add loading skeleton state
- [ ] Add TypeScript interfaces
- [ ] Add JSDoc documentation

### Task 4.5: Create Additional Form Components
- [ ] `PurpleGlassDropdown` (with search, multi-select)
- [ ] `PurpleGlassTextarea` (with auto-resize, character count)
- [ ] `PurpleGlassCheckbox` (with indeterminate state)
- [ ] `PurpleGlassRadio` (with card variant for wizard)
- [ ] `PurpleGlassSwitch` (with labels)

### Task 4.6: Refactor Wizard Steps
- [ ] Step1_Basics: Replace Input, Textarea, Radio
- [ ] Step2_SourceDestination: Replace Input, Radio
- [ ] Step3_Infrastructure: Replace Input, Button
- [ ] Step4_CapacityValidation: Replace Input, Button
- [ ] Step5_Timeline: Replace Button
- [ ] Step6_Assignment: Replace Input, Button
- [ ] Step7_Review: Replace Button
- [ ] WizardNavigation: Replace Button

### Task 4.7: Refactor Other Components
- [ ] ClusterStrategyModal: Replace all form components
- [ ] ProjectDetailView: Replace Button, Input, Dropdown
- [ ] ProjectWorkspaceView: Replace native buttons
- [ ] GanttChart: Replace native buttons
- [ ] ClusterStrategyManagerView: Replace native buttons
- [ ] Other views: Systematic replacement

### Task 4.8: Create Documentation
- [ ] Write `COMPONENT_LIBRARY_GUIDE.md`
- [ ] Write `FORM_COMPONENTS_MIGRATION.md`
- [ ] Add inline code examples
- [ ] Document accessibility features
- [ ] Create usage cheat sheet

---

## Success Metrics

**Code Quality:**
- ✅ Zero inline styles in JSX
- ✅ Zero native HTML form elements (button, input, select, textarea)
- ✅ Zero hardcoded colors, spacing, or sizes
- ✅ 100% TypeScript coverage with proper interfaces
- ✅ Zero !important declarations

**Consistency:**
- ✅ All buttons use PurpleGlassButton
- ✅ All inputs use PurpleGlassInput
- ✅ All cards use PurpleGlassCard
- ✅ Consistent validation patterns
- ✅ Consistent loading states

**Accessibility:**
- ✅ All components keyboard navigable
- ✅ Proper ARIA labels and roles
- ✅ Screen reader compatible
- ✅ Focus indicators visible
- ✅ Touch targets ≥44x44px

**Performance:**
- ✅ makeStyles properly memoized
- ✅ No unnecessary re-renders
- ✅ Components properly typed (no `any`)

---

## Estimated Effort

| Task | Lines of Code | Time Estimate |
|------|--------------|---------------|
| 4.1 Audit | N/A (complete) | ✅ Complete |
| 4.2 PurpleGlassInput | ~300 lines | 2-3 hours |
| 4.3 PurpleGlassButton | ~400 lines | 2-3 hours |
| 4.4 PurpleGlassCard | ~250 lines | 1-2 hours |
| 4.5 Additional Components | ~800 lines | 4-5 hours |
| 4.6 Refactor Wizard | ~500 line changes | 2-3 hours |
| 4.7 Refactor Other Views | ~1000 line changes | 4-5 hours |
| 4.8 Documentation | ~500 lines docs | 2-3 hours |
| **Total** | **~3750 lines** | **18-25 hours** |

---

## Next Steps

**Immediate Action (Task 4.2):**
1. Create `frontend/src/components/ui/` directory
2. Create `useInputStyles.ts` with design tokens
3. Build `PurpleGlassInput.tsx` component
4. Test in Step1_Basics as proof of concept
5. Document usage pattern
6. Commit and proceed to Task 4.3

**After Task 4.2:**
- Proceed with PurpleGlassButton (Task 4.3)
- Then PurpleGlassCard (Task 4.4)
- Then remaining components (Task 4.5)
- Begin systematic refactoring (Tasks 4.6-4.7)
- Complete documentation (Task 4.8)

---

**Audit Completed:** October 18, 2025  
**Next Task:** 4.2 - Create PurpleGlassInput Component
