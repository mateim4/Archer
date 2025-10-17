# Stage 5: Normalize Layout & Spacing

**Version:** 1.0.0  
**Date:** October 18, 2025  
**Status:** Framework Document - Implementation Ready  
**Estimated Effort:** 12-18 hours

---

## Overview

Stage 5 focuses on replacing all hardcoded spacing, layout values, and positioning with Fluent UI 2 design tokens. This ensures consistent spacing throughout the application and makes global layout adjustments trivial.

### Goals

✅ Replace all inline layout styles with design tokens  
✅ Standardize spacing patterns (margins, padding, gaps)  
✅ Normalize positioning and flexbox/grid layouts  
✅ Ensure responsive layout behavior  
✅ Create reusable layout utility classes

### Success Criteria

- **Zero hardcoded spacing values** (no `padding: '16px'`)
- **Consistent spacing scale** (using tokens.spacingHorizontal/Vertical)
- **Responsive layouts** (flexbox/grid with token-based gaps)
- **Reusable patterns** (documented layout components)

---

## Design Token Reference

### Spacing Tokens

Fluent UI 2 provides systematic spacing tokens:

```typescript
import { tokens } from '@fluentui/react-components';

// Horizontal Spacing
tokens.spacingHorizontalNone    // 0px
tokens.spacingHorizontalXXS     // 2px
tokens.spacingHorizontalXS      // 4px
tokens.spacingHorizontalSNudge  // 6px
tokens.spacingHorizontalS       // 8px
tokens.spacingHorizontalMNudge  // 10px
tokens.spacingHorizontalM       // 12px
tokens.spacingHorizontalL       // 16px
tokens.spacingHorizontalXL      // 20px
tokens.spacingHorizontalXXL     // 24px
tokens.spacingHorizontalXXXL    // 32px

// Vertical Spacing (same scale)
tokens.spacingVerticalNone
tokens.spacingVerticalXXS
tokens.spacingVerticalXS
tokens.spacingVerticalSNudge
tokens.spacingVerticalS
tokens.spacingVerticalMNudge
tokens.spacingVerticalM
tokens.spacingVerticalL
tokens.spacingVerticalXL
tokens.spacingVerticalXXL
tokens.spacingVerticalXXXL
```

### Layout Tokens

```typescript
// Border Radius
tokens.borderRadiusNone        // 0px
tokens.borderRadiusSmall       // 2px
tokens.borderRadiusMedium      // 4px
tokens.borderRadiusLarge       // 6px
tokens.borderRadiusXLarge      // 8px
tokens.borderRadiusCircular    // 9999px

// Stroke Width
tokens.strokeWidthThin         // 1px
tokens.strokeWidthThick        // 2px
tokens.strokeWidthThicker      // 3px
tokens.strokeWidthThickest     // 4px
```

---

## Common Pattern Replacements

### Pattern 1: Fixed Padding → Token-Based Padding

**Before:**
```typescript
<div style={{ padding: '24px' }}>
  Content
</div>
```

**After:**
```typescript
import { tokens } from '@fluentui/react-components';

<div style={{ padding: tokens.spacingVerticalXXL }}>
  Content
</div>
```

---

### Pattern 2: Fixed Margins → Token-Based Margins

**Before:**
```typescript
<div style={{ marginBottom: '16px', marginTop: '8px' }}>
  Content
</div>
```

**After:**
```typescript
<div style={{ 
  marginBottom: tokens.spacingVerticalL,
  marginTop: tokens.spacingVerticalS
}}>
  Content
</div>
```

---

### Pattern 3: Fixed Gaps (Flexbox/Grid) → Token-Based Gaps

**Before:**
```typescript
<div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
  <p>Item 1</p>
  <p>Item 2</p>
</div>
```

**After:**
```typescript
<div style={{ 
  display: 'flex', 
  gap: tokens.spacingVerticalM, 
  flexDirection: 'column' 
}}>
  <p>Item 1</p>
  <p>Item 2</p>
</div>
```

---

### Pattern 4: Hardcoded Border Radius → Token Radius

**Before:**
```typescript
<div style={{ borderRadius: '8px' }}>
  Content
</div>
```

**After:**
```typescript
<div style={{ borderRadius: tokens.borderRadiusXLarge }}>
  Content
</div>
```

---

### Pattern 5: Fixed Positioning → Token-Based Positioning

**Before:**
```typescript
<div style={{ 
  position: 'absolute',
  top: '16px',
  right: '16px'
}}>
  Badge
</div>
```

**After:**
```typescript
<div style={{ 
  position: 'absolute',
  top: tokens.spacingVerticalL,
  right: tokens.spacingHorizontalL
}}>
  Badge
</div>
```

---

## Layout Utility Classes

Consider creating reusable layout utilities:

### Flex Utilities

```typescript
// frontend/src/styles/layout-utils.ts
import { tokens } from '@fluentui/react-components';

export const flexRowGapS = {
  display: 'flex',
  gap: tokens.spacingHorizontalS
};

export const flexRowGapM = {
  display: 'flex',
  gap: tokens.spacingHorizontalM
};

export const flexRowGapL = {
  display: 'flex',
  gap: tokens.spacingHorizontalL
};

export const flexColumnGapS = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: tokens.spacingVerticalS
};

export const flexColumnGapM = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: tokens.spacingVerticalM
};

export const flexColumnGapL = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: tokens.spacingVerticalL
};
```

**Usage:**
```typescript
import { flexColumnGapM } from '@/styles/layout-utils';

<div style={flexColumnGapM}>
  <p>Item 1</p>
  <p>Item 2</p>
</div>
```

### Padding Utilities

```typescript
export const paddingS = {
  padding: tokens.spacingVerticalS
};

export const paddingM = {
  padding: tokens.spacingVerticalM
};

export const paddingL = {
  padding: tokens.spacingVerticalL
};

export const paddingXL = {
  padding: tokens.spacingVerticalXL
};

export const paddingXXL = {
  padding: tokens.spacingVerticalXXL
};
```

---

## File-by-File Analysis

### High Priority (Extensive Inline Layout Styles)

#### 1. ProjectWorkspaceView.tsx
**Estimated Instances:** 50+ inline layout styles

**Common Patterns:**
- Fixed padding on cards: `padding: '24px'` → `padding: tokens.spacingVerticalXXL`
- Fixed gaps in flex containers: `gap: '16px'` → `gap: tokens.spacingHorizontalL`
- Hardcoded card heights: `height: '300px'` → Consider dynamic or use tokens
- Absolute positioning with fixed values

**Estimated Effort:** 2-3 hours

---

#### 2. GanttChart.tsx
**Estimated Instances:** 40+ inline layout styles

**Common Patterns:**
- Fixed widths/heights for chart elements
- Hardcoded padding/margins in chart containers
- Absolute positioning for timeline elements
- Gap values in flex layouts

**Estimated Effort:** 2-3 hours

---

#### 3. ClusterStrategyModal.tsx
**Estimated Instances:** 30+ inline layout styles

**Common Patterns:**
- Modal dialog padding: `padding: '32px'` → `padding: tokens.spacingVerticalXXXL`
- Button group gaps: `gap: '12px'` → `gap: tokens.spacingHorizontalM`
- Section margins: `marginBottom: '24px'` → `marginBottom: tokens.spacingVerticalXXL`

**Estimated Effort:** 1.5-2 hours

---

#### 4. ProjectMigrationWorkspace.tsx
**Estimated Instances:** 30+ inline layout styles

**Common Patterns:**
- Workspace layout with fixed padding
- Icon containers with fixed sizes
- Flex layouts with hardcoded gaps
- Card padding/margins

**Estimated Effort:** 1.5-2 hours

---

#### 5. HardwareLifecycleView.tsx
**Estimated Instances:** 25+ inline layout styles

**Common Patterns:**
- Table cell padding
- Card spacing
- Icon padding
- Section gaps

**Estimated Effort:** 1-1.5 hours

---

### Medium Priority (Moderate Inline Styles)

| File | Instances | Effort |
|------|-----------|--------|
| ActivityWizard.tsx | ~20 | 1-1.5h |
| ProjectDetailView.tsx | ~20 | 1-1.5h |
| EnhancedGanttChart.tsx | ~15 | 1h |
| ClusterStrategyList.tsx | ~15 | 1h |
| DominoConfigurationSection.tsx | ~15 | 1h |

**Total Medium Priority:** 5-7 hours

---

### Low Priority (Minor Inline Styles)

| File | Instances | Effort |
|------|-----------|--------|
| WizardNavigation.tsx | ~10 | 0.5h |
| NetworkTopologyView.tsx | ~10 | 0.5h |
| WorkloadMappingView.tsx | ~10 | 0.5h |
| SettingsView.tsx | ~10 | 0.5h |
| UserManagementView.tsx | ~8 | 0.5h |
| 10+ other files | ~30 | 2-3h |

**Total Low Priority:** 4-5 hours

---

## Implementation Strategy

### Phase 1: Create Layout Utilities (1 hour)

1. Create `frontend/src/styles/layout-utils.ts`
2. Define common flex/grid patterns
3. Define padding/margin utilities
4. Export all utilities

**Deliverable:** Reusable layout utilities file

---

### Phase 2: High Priority Files (9-11 hours)

1. **ProjectWorkspaceView.tsx** (2-3h)
   - Replace 50+ inline layout styles
   - Test responsive behavior
   - Verify card layouts

2. **GanttChart.tsx** (2-3h)
   - Replace chart layout styles
   - Maintain chart functionality
   - Test timeline positioning

3. **ClusterStrategyModal.tsx** (1.5-2h)
   - Replace modal layout styles
   - Test modal appearance
   - Verify button layouts

4. **ProjectMigrationWorkspace.tsx** (1.5-2h)
   - Replace workspace layout styles
   - Test icon positioning
   - Verify flex layouts

5. **HardwareLifecycleView.tsx** (1-1.5h)
   - Replace table/card layouts
   - Test data display
   - Verify spacing consistency

**Checkpoint:** Test entire app, verify high-traffic views

---

### Phase 3: Medium Priority Files (5-7 hours)

Work through 5 files with moderate layout styles:
- ActivityWizard.tsx
- ProjectDetailView.tsx
- EnhancedGanttChart.tsx
- ClusterStrategyList.tsx
- DominoConfigurationSection.tsx

**Checkpoint:** Verify wizard and detail views

---

### Phase 4: Low Priority Files (4-5 hours)

Work through remaining 15+ files with minor layout styles.

**Checkpoint:** Full application verification

---

## Testing Checklist

After each file migration:

### Visual Verification

- [ ] Layout appears correct (no squished/stretched elements)
- [ ] Spacing is consistent with design system
- [ ] Responsive behavior works (resize browser)
- [ ] No layout shift on load
- [ ] Hover/focus states don't break layout

### Functional Verification

- [ ] All interactive elements still work
- [ ] Scrolling behavior unchanged
- [ ] Modals/dialogs position correctly
- [ ] Charts render properly (if applicable)
- [ ] Forms submit correctly

### Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Common Pitfalls

### 1. Mixing Horizontal and Vertical Tokens

❌ **Wrong:**
```typescript
<div style={{ padding: tokens.spacingHorizontalL }}>
  // Horizontal token used for padding (should be vertical)
</div>
```

✅ **Correct:**
```typescript
<div style={{ padding: tokens.spacingVerticalL }}>
  // Use vertical token for padding
</div>
```

**Rule:** Use `spacingVertical*` for padding/margins, `spacingHorizontal*` for gaps in horizontal flex/grid

---

### 2. Breaking Responsive Layouts

❌ **Wrong:**
```typescript
<div style={{ 
  width: tokens.spacingHorizontalXXXL  // Token not meant for width!
}}>
```

✅ **Correct:**
```typescript
<div style={{ 
  width: '100%',  // Use percentage for responsive
  padding: tokens.spacingHorizontalL  // Token for padding
}}>
```

**Rule:** Tokens are for spacing, not sizing. Use percentages/auto for responsive widths.

---

### 3. Forgetting to Import Tokens

❌ **Wrong:**
```typescript
<div style={{ padding: spacingVerticalL }}>
  // spacingVerticalL is not defined!
</div>
```

✅ **Correct:**
```typescript
import { tokens } from '@fluentui/react-components';

<div style={{ padding: tokens.spacingVerticalL }}>
  // Correct usage
</div>
```

---

### 4. Using Wrong Token Scale

❌ **Wrong:**
```typescript
<div style={{ gap: tokens.spacingHorizontalXXXL }}>
  // Too large for typical button gaps
</div>
```

✅ **Correct:**
```typescript
<div style={{ gap: tokens.spacingHorizontalM }}>
  // Appropriate 12px gap for buttons
</div>
```

**Reference:**
- XXS/XS: 2-4px (tight spacing, icons)
- S/M: 8-12px (standard element spacing)
- L/XL: 16-20px (section spacing)
- XXL/XXXL: 24-32px (large section spacing, card padding)

---

## Quick Reference Guide

### Spacing Equivalents

| Old Value | Token | Use Case |
|-----------|-------|----------|
| `0px` | `spacingVertical/HorizontalNone` | No spacing |
| `4px` | `spacingVertical/HorizontalXS` | Tight spacing |
| `8px` | `spacingVertical/HorizontalS` | Standard spacing |
| `12px` | `spacingVertical/HorizontalM` | Medium spacing |
| `16px` | `spacingVertical/HorizontalL` | Large spacing |
| `20px` | `spacingVertical/HorizontalXL` | Extra large spacing |
| `24px` | `spacingVertical/HorizontalXXL` | Section spacing |
| `32px` | `spacingVertical/HorizontalXXXL` | Large section spacing |

### Border Radius Equivalents

| Old Value | Token | Use Case |
|-----------|-------|----------|
| `0px` | `borderRadiusNone` | Square corners |
| `4px` | `borderRadiusMedium` | Standard rounding |
| `6px` | `borderRadiusLarge` | Large rounding |
| `8px` | `borderRadiusXLarge` | Extra large rounding |
| `50%` / `9999px` | `borderRadiusCircular` | Fully rounded |

---

## Success Metrics

After Stage 5 completion:

- **0 Hardcoded Spacing Values** (grep search finds none)
- **Consistent Spacing Patterns** (visual audit shows uniformity)
- **Maintainable Layouts** (changing tokens updates globally)
- **Responsive Behavior** (works on all screen sizes)

---

## Estimated Timeline

| Phase | Effort | Duration |
|-------|--------|----------|
| **Phase 1:** Layout Utilities | 1 hour | Day 1 |
| **Phase 2:** High Priority Files | 9-11 hours | Days 2-4 |
| **Phase 3:** Medium Priority Files | 5-7 hours | Days 5-6 |
| **Phase 4:** Low Priority Files | 4-5 hours | Days 7-8 |
| **Total** | **19-24 hours** | **1.5-2 weeks** |

Spread across sprints, estimate **2-3 weeks** for complete Stage 5.

---

## Next Steps

1. Review this framework document
2. Create layout-utils.ts with common patterns
3. Start with ProjectWorkspaceView.tsx (highest instance count)
4. Test thoroughly after each file
5. Commit incrementally
6. Update this document with lessons learned

---

**Status:** Ready for implementation  
**Blocked By:** None (Stage 4 complete)  
**Enables:** Stage 6 (Color Audit), Stage 7 (UX Audit)
