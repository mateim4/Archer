---
name: "DS-09: Systematic Inline Style Elimination (Batch Refactor)"
about: Eliminate remaining inline style objects using design tokens
title: "[DS-09] Systematic Inline Style Elimination (Batch Refactor)"
labels: ["design-system", "refactor", "priority-low", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective
Systematically eliminate remaining inline `style={{}}` declarations across the codebase, replacing with token-based approaches.

## 📋 Problem Statement
**Current State:**
- 2,494 inline style declarations across 170 files
- After DS-03 through DS-08: ~1,500 remain
- Most are simple color/spacing overrides

## 📖 Coding Guidelines
Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
- ✅ Extract to styled components or hooks
- ✅ Use design tokens exclusively
- ❌ NO inline styles unless absolutely necessary

## 🔧 Requirements

### Strategy: Create Reusable Style Hooks

#### 1. Create useCommonStyles hook
frontend/src/hooks/useCommonStyles.ts:
```tsx
import { makeStyles, tokens } from '@fluentui/react-components';

export const useCommonStyles = makeStyles({
  // Text variants
  captionPrimary: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
  },
  captionSecondary: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  
  // Status text
  successText: {
    color: tokens.semanticColors.success.foreground,
  },
  errorText: {
    color: tokens.semanticColors.error.foreground,
  },
  
  // Layout
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
});
```

#### 2. Replace Common Patterns

**Pattern 1: Caption text**
```tsx
// Before
<div style={{ fontSize: '12px', color: '#6b7280' }}>Caption</div>

// After
const styles = useCommonStyles();
<div className={styles.captionPrimary}>Caption</div>
```

**Pattern 2: Error text**
```tsx
// Before
<div style={{ color: '#ef4444', fontSize: '12px' }}>Error</div>

// After
const styles = useCommonStyles();
<div className={styles.errorText}>Error</div>
```

### Target Patterns to Eliminate

1. **Color-only styles** (~500 instances)
   - `style={{ color: '#...' }}`
   - Replace with utility classes

2. **Spacing-only styles** (~400 instances)
   - `style={{ padding: '12px' }}`
   - Replace with tokens

3. **Font-only styles** (~300 instances)
   - `style={{ fontSize: '14px' }}`
   - Replace with typography tokens

4. **Combined styles** (~300 instances)
   - Extract to makeStyles

## 📁 Files to Create
- frontend/src/hooks/useCommonStyles.ts
- frontend/src/hooks/useLayoutStyles.ts
- frontend/src/hooks/useTextStyles.ts

## 📁 Files to Modify
- ~50-100 component files with high inline style usage

## ✅ Acceptance Criteria
- [ ] Common style hooks created
- [ ] Inline style count reduced by 50% minimum
- [ ] All new styles use design tokens
- [ ] No visual regressions
- [ ] Bundle size maintained or reduced
