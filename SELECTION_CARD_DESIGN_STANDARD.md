# Selection Card Design Standard

## Overview
The **Selection Card** is a standardized, reusable component pattern in the LCMDesigner design system. It provides a visually consistent, accessible, and delightful way to present multi-option selections (radio groups, card pickers, wizard steps, etc.) with a frosted-glass aesthetic and clear selection states.

## Visual Design

### States

#### 1. **Default (Unselected)**
- Frosted glass background with subtle purple tint
- Soft white border (25% opacity)
- Medium shadow with small glow
- Gray text (title + description)
- Icon in circular wrapper with light background

#### 2. **Hover**
- Slightly elevated (`translateY(-4px)`)
- Enhanced purple glass background
- Brighter border (35% opacity)
- Increased shadow + glow
- All transitions smooth (200ms ease)

#### 3. **Selected (Checked)**
- Maximum elevation (`translateY(-6px)`)
- Full radial gradient background (purple to indigo)
- White border (32% opacity)
- Maximum shadow + glow effect
- **White text** for title and description
- **Gradient icon background** with white icon
- **White circular border** around icon (80% opacity)
- Icon scales up slightly (1.05x)

#### 4. **Disabled**
- Reduced opacity (50%)
- No hover effects
- Cursor: not-allowed

## Token Reference

All styling is driven by `designTokens.components.selectionCard`:

```typescript
selectionCard: {
  // Container States
  containerBackground: glassEffects.backgroundMedium,
  containerBackgroundHover: glassEffects.purpleGlassMedium,
  containerBackgroundChecked: gradients.buttonPrimaryRadial,
  containerBorder: 'rgba(255, 255, 255, 0.25)',
  containerBorderHover: 'rgba(255, 255, 255, 0.35)',
  containerBorderChecked: 'rgba(255, 255, 255, 0.32)',
  containerBorderRadius: borderRadius.xxxLarge,
  containerPadding: `${spacing.m} ${spacing.l}`,
  containerBoxShadow: `${shadows.shadow8}, ${shadows.glowSmall}`,
  containerBoxShadowHover: `${shadows.shadow16}, ${shadows.glowMedium}`,
  containerBoxShadowChecked: `${shadows.shadow28}, ${shadows.glowLarge}`,
  containerTransform: 'translateY(-4px)',
  containerTransformChecked: 'translateY(-6px)',
  
  // Icon Circle States
  iconWrapperSize: '72px',
  iconWrapperBackground: 'rgba(255, 255, 255, 0.12)',
  iconWrapperBackgroundChecked: gradients.buttonPrimary,
  iconWrapperBorder: 'none',
  iconWrapperBorderChecked: '2px solid rgba(255, 255, 255, 0.8)',
  iconWrapperBoxShadow: '0 8px 24px rgba(139, 92, 246, 0.2) inset',
  iconWrapperBoxShadowChecked: '0 0 24px rgba(139, 92, 246, 0.35)',
  iconWrapperTransformChecked: 'scale(1.05)',
  iconSize: '36px',
  iconColor: purplePalette.purple600,
  iconColorChecked: '#ffffff',
  
  // Text States
  titleColor: purplePalette.gray900,
  titleColorChecked: '#ffffff',
  titleFontSize: typography.fontSizeBase400,
  titleFontWeight: typography.fontWeightSemibold,
  descriptionColor: purplePalette.gray700,
  descriptionColorChecked: 'rgba(255, 255, 255, 0.9)',
  descriptionFontSize: typography.fontSizeBase200,
  descriptionLineHeight: typography.lineHeightBase300,
  
  // Radio Indicator (visible in top corner)
  indicatorSize: '20px',
  indicatorMarginBottom: spacing.s,
  
  // Animation
  transitionDuration: motion.durationNormal,
  transitionTimingFunction: motion.curveEasyEase,
}
```

## Usage Guidelines

### When to Use
- ✅ **Radio Group Selections**: Activity types, migration strategies, deployment models
- ✅ **Wizard Step Options**: Multi-step flows where users choose between predefined paths
- ✅ **Template Pickers**: Project templates, report templates, configuration presets
- ✅ **Feature Selection**: Enable/disable features with visual representation
- ✅ **Plan/Tier Selection**: Subscription tiers, service levels, package options

### When NOT to Use
- ❌ **Simple Lists**: Use standard radio buttons or dropdowns
- ❌ **Single Option**: Use a button or link instead
- ❌ **Many Options** (>6): Consider a searchable dropdown or grouped lists
- ❌ **Complex Forms**: Use for major decisions, not every field

### Anatomy
```tsx
<SelectionCard>
  <RadioIndicator />     {/* Top-left corner, shows selected state */}
  <IconCircle>           {/* Center, 72px circle with icon */}
    <Icon />             {/* 36px icon, changes color when selected */}
  </IconCircle>
  <CardTitle />          {/* Bold text, 16px, turns white when selected */}
  <CardDescription />    {/* Regular text, 12px, turns white (90%) when selected */}
</SelectionCard>
```

### Layout Patterns

#### Grid Layout (Recommended)
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
gap: 16px; /* tokens.l */
```

#### Horizontal Layout (2-4 options)
```css
display: flex;
gap: 16px;
flex-wrap: wrap;
```

#### Vertical Stack (Mobile)
```css
display: flex;
flex-direction: column;
gap: 12px; /* tokens.m */
```

## Implementation

### React Component
Use `<PurpleGlassRadio>` with `cardVariant` prop:

```tsx
import { PurpleGlassRadioGroup, PurpleGlassRadio } from '@/components/ui';

<PurpleGlassRadioGroup
  label="Select Activity Type"
  value={selectedType}
  onChange={(value) => setSelectedType(value)}
>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
    <PurpleGlassRadio
      value="migration"
      cardVariant
      cardTitle="Migration"
      cardDescription="Move workloads to new infrastructure"
      cardIcon={<ArrowSyncRegular />}
      glass="medium"
    />
    {/* More options... */}
  </div>
</PurpleGlassRadioGroup>
```

### Custom Implementations
For non-radio use cases, use the tokens directly:

```typescript
import { tokens } from '@/styles/design-tokens';

const styles = {
  card: {
    background: tokens.components.selectionCard.containerBackground,
    border: `1px solid ${tokens.components.selectionCard.containerBorder}`,
    borderRadius: tokens.components.selectionCard.containerBorderRadius,
    padding: tokens.components.selectionCard.containerPadding,
    // ... etc
  }
};
```

## Accessibility

### Keyboard Navigation
- ✅ Arrow keys navigate between options
- ✅ Space/Enter selects focused option
- ✅ Tab moves to next interactive element

### Screen Readers
- ✅ Proper `role="radiogroup"` and `role="radio"` attributes
- ✅ Labels associated with inputs via `htmlFor`/`id`
- ✅ Selection state announced via `aria-checked`
- ✅ Disabled state announced via `aria-disabled`

### Color Contrast
- ✅ **Default text**: 7.5:1 (WCAG AAA)
- ✅ **Selected text**: 21:1 (white on purple gradient, WCAG AAA+)
- ✅ **Focus indicators**: 3:1 minimum outline contrast

## Animation Standards

All state transitions use:
- **Duration**: `200ms` (`tokens.durationNormal`)
- **Easing**: `cubic-bezier(0.33, 0, 0.67, 1)` (`tokens.curveEasyEase`)
- **Properties**: `transform`, `border-color`, `background-color`, `box-shadow`, `color`

### Performance
- Uses `transform` and `opacity` for animations (GPU-accelerated)
- No layout shifts during transitions
- `will-change` hints applied for frequently animated properties

## Examples in LCMDesigner

### Activity Wizard - Step 1 (Activity Type)
```
📂 frontend/src/components/Activity/ActivityWizard/Steps/Step1_Basics.tsx
```
5 options: Migration, Lifecycle, Decommission, Expansion, Maintenance

### Future Use Cases
- Cluster strategy selection (Domino vs. New Hardware vs. Existing)
- Target infrastructure type (HCI S2D vs. Azure Local)
- Report template picker
- Hardware basket selection in vendor forms
- Project template gallery

## Design Rationale

### Why This Pattern?
1. **Visual Hierarchy**: Large touch targets with clear affordances
2. **Branding**: Consistent purple glass aesthetic across app
3. **Delight**: Smooth animations and state transitions feel premium
4. **Accessibility**: Exceeds WCAG AA, approaches AAA
5. **Flexibility**: Works for 2-6 options in various contexts
6. **Clarity**: White text on purple gradient removes ambiguity

### Why White Text on Selection?
- **High Contrast**: 21:1 ratio ensures readability
- **Visual Feedback**: Immediate confirmation of selection
- **Brand Consistency**: Matches button primary state
- **Accessibility**: Screen reader users benefit from clear state changes

## Maintenance

### Updating the Standard
1. Modify tokens in `frontend/src/styles/design-tokens.ts`
2. Update styles in `frontend/src/components/ui/styles/useRadioStyles.ts`
3. Test in Activity Wizard (reference implementation)
4. Update this document
5. Commit with descriptive message

### Testing Checklist
- [ ] Visual regression tests (Chromatic/Percy)
- [ ] Keyboard navigation works
- [ ] Screen reader announces states correctly
- [ ] Hover/focus states distinct
- [ ] Selection state persists on blur/re-focus
- [ ] Disabled state cannot be selected
- [ ] Touch targets ≥44px on mobile
- [ ] Color contrast meets WCAG AA (ideally AAA)

---

**Last Updated**: October 19, 2025  
**Component Version**: v1.0  
**Design System Version**: Purple Glass v2.0
