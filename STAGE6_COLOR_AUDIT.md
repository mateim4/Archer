# Stage 6: Audit Color System

**Version:** 1.0.0  
**Date:** October 18, 2025  
**Status:** Framework Document - Implementation Ready  
**Estimated Effort:** 10-15 hours

---

## Overview

Stage 6 focuses on auditing and normalizing all color usage throughout the application. The goal is to ensure 100% compliance with Fluent UI 2 color tokens, verify WCAG AA accessibility standards, and eliminate all hardcoded color values.

### Goals

✅ Replace all hardcoded colors with Fluent 2 tokens  
✅ Verify WCAG AA contrast ratios (4.5:1 minimum)  
✅ Ensure semantic color usage (error=red, success=green)  
✅ Test color system in light/dark themes (if applicable)  
✅ Document color palette and usage guidelines

### Success Criteria

- **Zero hardcoded color values** (no `color: '#8b5cf6'`)
- **WCAG AA compliant** (all text meets 4.5:1 contrast)
- **Semantic token usage** (using tokens.colorStatus*, tokens.colorPalette*)
- **Theme support** (colors work in light/dark modes if implemented)

---

## Design Token Reference

### Brand Colors

```typescript
import { tokens } from '@fluentui/react-components';

// Brand (Purple)
tokens.colorBrandBackground           // Primary brand color background
tokens.colorBrandBackground2          // Secondary brand background
tokens.colorBrandBackgroundHover      // Brand hover state
tokens.colorBrandBackgroundPressed    // Brand pressed state
tokens.colorBrandForeground1          // Primary brand text
tokens.colorBrandForeground2          // Secondary brand text
tokens.colorBrandStroke1              // Brand borders
tokens.colorBrandStroke2              // Secondary brand borders
```

### Neutral Colors (Grays)

```typescript
// Backgrounds
tokens.colorNeutralBackground1        // Primary surface
tokens.colorNeutralBackground2        // Secondary surface
tokens.colorNeutralBackground3        // Tertiary surface
tokens.colorNeutralBackgroundHover    // Hover state
tokens.colorNeutralBackgroundPressed  // Pressed state

// Foregrounds (Text)
tokens.colorNeutralForeground1        // Primary text
tokens.colorNeutralForeground2        // Secondary text
tokens.colorNeutralForeground3        // Tertiary text
tokens.colorNeutralForegroundDisabled // Disabled text

// Borders
tokens.colorNeutralStroke1            // Primary borders
tokens.colorNeutralStroke2            // Secondary borders
tokens.colorNeutralStrokeDisabled     // Disabled borders
```

### Status Colors

```typescript
// Success (Green)
tokens.colorStatusSuccessBackground1  // Success background
tokens.colorStatusSuccessForeground1  // Success text
tokens.colorStatusSuccessBorder1      // Success border

// Warning (Yellow/Orange)
tokens.colorStatusWarningBackground1  // Warning background
tokens.colorStatusWarningForeground1  // Warning text
tokens.colorStatusWarningBorder1      // Warning border

// Error/Danger (Red)
tokens.colorStatusDangerBackground1   // Error background
tokens.colorStatusDangerForeground1   // Error text
tokens.colorStatusDangerBorder1       // Error border
```

### Semantic Palette Colors

```typescript
// Red
tokens.colorPaletteRedBackground1     // Lightest red
tokens.colorPaletteRedBackground2
tokens.colorPaletteRedBackground3
tokens.colorPaletteRedForeground1     // Red text
tokens.colorPaletteRedBorder1         // Red border
tokens.colorPaletteRedBorder2

// Green
tokens.colorPaletteGreenBackground1
tokens.colorPaletteGreenForeground1
tokens.colorPaletteGreenBorder1

// Blue
tokens.colorPaletteBlueBackground1
tokens.colorPaletteBlueForeground1
tokens.colorPaletteBlueBorder1

// Yellow
tokens.colorPaletteYellowBackground1
tokens.colorPaletteYellowForeground1
tokens.colorPaletteYellowBorder1
```

---

## Common Pattern Replacements

### Pattern 1: Hardcoded Brand Purple → Token

**Before:**
```typescript
<div style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
  Brand Element
</div>
```

**After:**
```typescript
<div style={{ 
  backgroundColor: tokens.colorBrandBackground,
  color: tokens.colorNeutralForegroundOnBrand
}}>
  Brand Element
</div>
```

---

### Pattern 2: Hardcoded Text Colors → Semantic Tokens

**Before:**
```typescript
<p style={{ color: '#333' }}>Primary text</p>
<p style={{ color: '#666' }}>Secondary text</p>
<p style={{ color: '#999' }}>Tertiary text</p>
```

**After:**
```typescript
<p style={{ color: tokens.colorNeutralForeground1 }}>Primary text</p>
<p style={{ color: tokens.colorNeutralForeground2 }}>Secondary text</p>
<p style={{ color: tokens.colorNeutralForeground3 }}>Tertiary text</p>
```

---

### Pattern 3: Hardcoded Error/Success Colors → Status Tokens

**Before:**
```typescript
<div style={{ 
  color: isError ? 'red' : 'green',
  borderColor: isError ? 'red' : 'green'
}}>
  {message}
</div>
```

**After:**
```typescript
<div style={{ 
  color: isError 
    ? tokens.colorStatusDangerForeground1 
    : tokens.colorStatusSuccessForeground1,
  borderColor: isError 
    ? tokens.colorStatusDangerBorder1 
    : tokens.colorStatusSuccessBorder1
}}>
  {message}
</div>
```

---

### Pattern 4: Hardcoded Border Colors → Neutral Tokens

**Before:**
```typescript
<div style={{ border: '1px solid #ccc' }}>
  Content
</div>
```

**After:**
```typescript
<div style={{ 
  borderWidth: tokens.strokeWidthThin,
  borderStyle: 'solid',
  borderColor: tokens.colorNeutralStroke1
}}>
  Content
</div>
```

---

### Pattern 5: Hardcoded Background Colors → Surface Tokens

**Before:**
```typescript
<div style={{ backgroundColor: '#f5f5f5' }}>
  Card content
</div>
```

**After:**
```typescript
<div style={{ backgroundColor: tokens.colorNeutralBackground2 }}>
  Card content
</div>
```

---

## Color Audit Checklist

### Phase 1: Identify All Color Usage (2-3 hours)

Use grep to find all color instances:

```bash
# Find hardcoded hex colors
grep -r '#[0-9a-fA-F]\{3,6\}' frontend/src/ --include="*.tsx" --include="*.ts"

# Find CSS color keywords
grep -r "color: 'red\|green\|blue\|white\|black\|gray\|purple\|yellow\|orange'" frontend/src/ --include="*.tsx" --include="*.ts"

# Find RGB/RGBA
grep -r "rgb\|rgba" frontend/src/ --include="*.tsx" --include="*.ts"

# Find backgroundColor, borderColor, color properties
grep -r "backgroundColor:\|borderColor:\|color:" frontend/src/ --include="*.tsx" --include="*.ts"
```

**Deliverable:** Comprehensive list of all color usage instances

---

### Phase 2: Categorize Colors (1-2 hours)

Group found colors into categories:

#### Brand Colors (Purple Shades)
- `#8b5cf6` - Primary brand purple
- `#7c3aed` - Darker purple
- `#a78bfa` - Lighter purple
- Variants with opacity: `rgba(139, 92, 246, 0.1)`

**Token:** Use `tokens.colorBrand*` family

---

#### Neutral Colors (Grays/Black/White)
- `#000`, `#111`, `#222`, `#333` - Very dark grays
- `#666`, `#777`, `#888`, `#999` - Medium grays
- `#ccc`, `#ddd`, `#eee` - Light grays
- `#fff`, `white` - White
- `#f5f5f5`, `#fafafa` - Off-white backgrounds

**Token:** Use `tokens.colorNeutral*` family

---

#### Status Colors
- Red shades: Error states
- Green shades: Success states
- Yellow/Orange: Warning states
- Blue shades: Informational states

**Token:** Use `tokens.colorStatus*` or `tokens.colorPalette*`

---

#### Special Cases
- Transparent: `transparent`, `rgba(0,0,0,0)`
- Semi-transparent overlays: `rgba(0,0,0,0.5)`
- Glassmorphism backgrounds: Already handled in Purple Glass components

---

### Phase 3: Replace Colors (6-10 hours)

Work through files systematically, replacing colors with tokens.

#### High Priority Files (Heavy Color Usage)

| File | Estimated Colors | Effort |
|------|------------------|--------|
| ProjectWorkspaceView.tsx | 30+ | 2h |
| GanttChart.tsx | 25+ | 1.5h |
| ClusterStrategyModal.tsx | 20+ | 1h |
| HardwareLifecycleView.tsx | 20+ | 1h |
| ProjectMigrationWorkspace.tsx | 15+ | 1h |

**Total High Priority:** 6-7 hours

---

#### Medium Priority Files

| File | Estimated Colors | Effort |
|------|------------------|--------|
| ActivityWizard.tsx | 12+ | 0.5h |
| ProjectDetailView.tsx | 12+ | 0.5h |
| ClusterStrategyList.tsx | 10+ | 0.5h |
| EnhancedGanttChart.tsx | 10+ | 0.5h |
| DominoConfigurationSection.tsx | 8+ | 0.5h |

**Total Medium Priority:** 2.5 hours

---

#### Low Priority Files

| File | Estimated Colors | Effort |
|------|------------------|--------|
| 15+ remaining files | 30+ | 2-3h |

---

### Phase 4: WCAG Contrast Verification (2-3 hours)

Verify all text meets WCAG AA standards (4.5:1 contrast ratio).

#### Tools

1. **Browser DevTools Contrast Checker**
   - Chrome/Edge: Inspect element → Accessibility panel
   - Shows contrast ratio and WCAG compliance

2. **Axe DevTools Extension**
   - Install: [Chrome](https://chrome.google.com/webstore/detail/axe/lhdoppojpmngadmnindnejefpokejbdd)
   - Run automated accessibility audit
   - Highlights contrast issues

3. **WebAIM Contrast Checker**
   - Online tool: https://webaim.org/resources/contrastchecker/
   - Manual verification of specific color pairs

#### Common Contrast Issues

❌ **Fails WCAG AA:**
- Light gray text on white background (`#ccc` on `#fff` = 1.8:1) ❌
- Purple text on dark background (`#8b5cf6` on `#333` = 2.9:1) ❌
- Yellow text on white background (`#ffeb3b` on `#fff` = 1.1:1) ❌

✅ **Passes WCAG AA:**
- Dark gray text on white (`#333` on `#fff` = 12.6:1) ✅
- White text on purple (`#fff` on `#8b5cf6` = 5.7:1) ✅
- Black text on yellow (`#000` on `#ffeb3b` = 19.6:1) ✅

#### Verification Checklist

For each view:

- [ ] All body text meets 4.5:1 contrast
- [ ] All button text meets 4.5:1 contrast
- [ ] All input label text meets 4.5:1 contrast
- [ ] All helper text meets 4.5:1 contrast
- [ ] All link text meets 4.5:1 contrast
- [ ] All icon colors have sufficient contrast

If text fails:
1. Try a different token (darker foreground, lighter background)
2. Increase font weight (bold text = 3:1 minimum for WCAG AA Large Text)
3. Add background or border to improve contrast

---

## Implementation Strategy

### Step 1: Create Color Documentation (1 hour)

Create `DESIGN_SYSTEM_COLORS.md` documenting:
- Token → Use case mapping
- Color palette reference
- Semantic color guidelines
- Contrast requirements

---

### Step 2: Run Grep Audit (1 hour)

Run all grep commands, compile results into CSV or markdown table:

| File | Line | Color Value | Type | Priority |
|------|------|-------------|------|----------|
| ProjectWorkspaceView.tsx | 42 | `#8b5cf6` | Brand | High |
| ProjectWorkspaceView.tsx | 58 | `#666` | Neutral | High |
| GanttChart.tsx | 102 | `red` | Status | High |

**Deliverable:** Complete audit spreadsheet

---

### Step 3: Replace High Priority (6-7 hours)

Work through high priority files:
- ProjectWorkspaceView.tsx
- GanttChart.tsx
- ClusterStrategyModal.tsx
- HardwareLifecycleView.tsx
- ProjectMigrationWorkspace.tsx

**Checkpoint:** Visual verification + contrast check

---

### Step 4: Replace Medium/Low Priority (4-6 hours)

Work through remaining files systematically.

**Checkpoint:** Full application contrast audit with Axe DevTools

---

### Step 5: Verify Dark Mode (If Applicable) (1 hour)

If dark mode support exists or is planned:
- Test all views in dark mode
- Verify token usage adapts correctly
- Fix any hardcoded values that break dark mode

---

## Testing Checklist

After each file migration:

### Visual Verification

- [ ] Colors render correctly
- [ ] Brand purple used appropriately
- [ ] Status colors (error/success/warning) clear
- [ ] Text is readable
- [ ] Borders are visible
- [ ] Hover/focus states use appropriate colors

### Contrast Verification

- [ ] Run Axe DevTools scan (0 contrast issues)
- [ ] Manually verify critical text (body, buttons, labels)
- [ ] Check disabled state contrast
- [ ] Verify interactive element colors

### Functional Verification

- [ ] All features work (no broken logic from color changes)
- [ ] Validation states display correctly
- [ ] Status indicators are clear

---

## Color System Documentation

### Semantic Usage Guidelines

#### Brand Colors (Purple)
**When to use:**
- Primary buttons
- Active navigation items
- Selected states
- Key call-to-action elements
- Links (hover state)

**When NOT to use:**
- Body text (insufficient contrast)
- Backgrounds for large text blocks
- Disabled states

---

#### Neutral Colors
**Foreground (Text):**
- Foreground1: Primary body text, headings
- Foreground2: Secondary text, labels
- Foreground3: Tertiary text, placeholders
- ForegroundDisabled: Disabled text

**Background (Surfaces):**
- Background1: Main application background
- Background2: Card backgrounds
- Background3: Nested card backgrounds

**Stroke (Borders):**
- Stroke1: Primary borders (cards, inputs)
- Stroke2: Secondary borders (dividers)

---

#### Status Colors
**Success (Green):**
- Successful operations
- Valid form states
- Completed steps
- Positive metrics

**Warning (Yellow/Orange):**
- Caution messages
- Approaching limits (e.g., 80% capacity)
- Non-critical issues

**Danger/Error (Red):**
- Failed operations
- Invalid form states
- Critical errors
- Destructive actions (delete button)

---

## Common Pitfalls

### 1. Using Brand Color for Body Text

❌ **Wrong:**
```typescript
<p style={{ color: tokens.colorBrandForeground1 }}>
  Long paragraph of body text...
</p>
```

✅ **Correct:**
```typescript
<p style={{ color: tokens.colorNeutralForeground1 }}>
  Long paragraph of body text...
</p>
```

**Reason:** Brand purple may not have sufficient contrast for body text.

---

### 2. Hardcoding White/Black Instead of Tokens

❌ **Wrong:**
```typescript
<button style={{ 
  backgroundColor: '#8b5cf6',
  color: 'white'  // Hardcoded white
}}>
  Click Me
</button>
```

✅ **Correct:**
```typescript
<button style={{ 
  backgroundColor: tokens.colorBrandBackground,
  color: tokens.colorNeutralForegroundOnBrand  // Token for text on brand color
}}>
  Click Me
</button>
```

---

### 3. Using Palette Colors Instead of Status Colors

❌ **Wrong:**
```typescript
// Using palette red for error (semantically less clear)
<span style={{ color: tokens.colorPaletteRedForeground1 }}>
  Error message
</span>
```

✅ **Correct:**
```typescript
// Using status danger (semantically clear)
<span style={{ color: tokens.colorStatusDangerForeground1 }}>
  Error message
</span>
```

**Reason:** Status tokens are semantically clearer and may adjust for themes.

---

### 4. Forgetting to Check Contrast

❌ **Wrong:**
```typescript
<p style={{ 
  color: tokens.colorNeutralForeground3,  // Light gray
  backgroundColor: tokens.colorNeutralBackground1  // White
}}>
  Important text
</p>
```

**Result:** May fail WCAG AA (Foreground3 is intended for less important text)

✅ **Correct:**
```typescript
<p style={{ 
  color: tokens.colorNeutralForeground1,  // Dark gray
  backgroundColor: tokens.colorNeutralBackground1
}}>
  Important text
</p>
```

**Rule:** Use Foreground1 for primary text, Foreground2 for secondary, Foreground3 for tertiary/de-emphasized.

---

## Quick Reference

### Color Selection Decision Tree

```
Is it brand-related (purple)?
├─ Yes → tokens.colorBrand*
└─ No → Is it status-related?
    ├─ Yes → Is it success/warning/error?
    │   ├─ Success → tokens.colorStatusSuccess*
    │   ├─ Warning → tokens.colorStatusWarning*
    │   └─ Error → tokens.colorStatusDanger*
    └─ No → Is it text, background, or border?
        ├─ Text → tokens.colorNeutralForeground*
        ├─ Background → tokens.colorNeutralBackground*
        └─ Border → tokens.colorNeutralStroke*
```

---

## Success Metrics

After Stage 6 completion:

- **0 Hardcoded Colors** (grep finds no hex values or color keywords)
- **100% Token Usage** (all colors use design tokens)
- **WCAG AA Compliant** (Axe DevTools reports 0 contrast issues)
- **Semantic Clarity** (status colors used appropriately)

---

## Estimated Timeline

| Phase | Effort | Duration |
|-------|--------|----------|
| **Phase 1:** Grep Audit + Categorization | 3-4 hours | Day 1 |
| **Phase 2:** High Priority Files | 6-7 hours | Days 2-3 |
| **Phase 3:** Medium/Low Priority Files | 4-6 hours | Days 4-5 |
| **Phase 4:** WCAG Verification | 2-3 hours | Day 6 |
| **Total** | **15-20 hours** | **1-1.5 weeks** |

Spread across sprints, estimate **1.5-2 weeks** for complete Stage 6.

---

## Next Steps

1. Review this framework document
2. Run grep audit to find all color instances
3. Create DESIGN_SYSTEM_COLORS.md documentation
4. Start with ProjectWorkspaceView.tsx (highest color count)
5. Test with Axe DevTools after each file
6. Update this document with findings

---

**Status:** Ready for implementation  
**Blocked By:** None (can run in parallel with Stage 5)  
**Enables:** Stage 7 (UX Audit - colors verified)  
**Tools Required:** Axe DevTools browser extension, WebAIM contrast checker
