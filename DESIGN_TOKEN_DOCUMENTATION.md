# Design Token System Documentation

**Version**: 1.0.0  
**Date**: October 17, 2025  
**Status**: ✅ Complete

---

## Overview

The LCMDesigner design token system provides a centralized, type-safe way to manage design values across the application. Built on top of Fluent UI 2, it incorporates our purple glass aesthetic while maintaining framework compliance.

---

## File Structure

```
frontend/src/
├── styles/
│   ├── design-tokens.ts      # Core token definitions
│   └── theme.ts               # Fluent UI theme configuration
└── hooks/
    ├── useTheme.tsx           # Theme switching hook
    └── usePurpleGlassStyles.ts # Reusable style utilities
```

---

## Usage Guide

### 1. Import Tokens

```typescript
import { tokens } from '@/styles/design-tokens';
```

### 2. Use in makeStyles

```typescript
import { makeStyles } from '@fluentui/react-components';
import { tokens } from '@/styles/design-tokens';

const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorBrandBackground,
    padding: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadowCardElevation,
  },
});
```

### 3. Use Reusable Hooks

```typescript
import { usePurpleGlassCard } from '@/hooks/usePurpleGlassStyles';

function MyComponent() {
  const styles = usePurpleGlassCard();
  
  return (
    <div className={styles.card}>
      Purple glass card!
    </div>
  );
}
```

---

## Token Categories

### Colors

#### Brand Colors (Purple)
- `colorBrandPrimary` - #8b5cf6 (Primary purple)
- `colorBrandSecondary` - #6366f1 (Secondary indigo)
- `colorBrandBackground` - Light purple background
- `colorBrandForeground` - Purple text

#### Neutral Colors
- `colorNeutralBackground1` - White
- `colorNeutralBackground2` - Light gray
- `colorNeutralForeground1` - Dark gray (text)
- `colorNeutralStroke1` - Border color

#### Semantic Colors
- `colorStatusSuccess` - #10b981 (Green)
- `colorStatusWarning` - #f59e0b (Amber)
- `colorStatusDanger` - #ef4444 (Red)
- `colorStatusInfo` - #3b82f6 (Blue)

#### Glass Effects
- `colorGlassBackground` - rgba(255, 255, 255, 0.85)
- `colorGlassPurpleLight` - rgba(139, 92, 246, 0.05)
- `colorGlassPurpleMedium` - rgba(139, 92, 246, 0.1)
- `colorGlassPurpleHeavy` - rgba(139, 92, 246, 0.15)

### Spacing

Based on Fluent UI 2 spacing scale:

- `xxs` - 2px
- `xs` - 4px
- `s` - 8px
- `m` - 12px
- `l` - 16px
- `xl` - 20px
- `xxl` - 24px
- `xxxl` - 32px
- `xxxxl` - 40px (custom)
- `xxxxxl` - 48px (custom)
- `xxxxxxl` - 64px (custom)

**Example**:
```typescript
const useStyles = makeStyles({
  container: {
    padding: tokens.xl,        // 20px
    gap: tokens.l,             // 16px
    margin: tokens.xxxl,       // 32px
  },
});
```

### Typography

#### Font Families
- `fontFamilyPrimary` - "Poppins" (brand font)
- `fontFamilyMonospace` - "Fira Code" (code)

#### Font Sizes (Fluent Type Ramp)
- `fontSizeBase100` - 10px
- `fontSizeBase200` - 12px
- `fontSizeBase300` - 14px (body)
- `fontSizeBase400` - 16px (large body)
- `fontSizeBase500` - 20px
- `fontSizeBase600` - 24px
- `fontSizeHero700` - 28px
- `fontSizeHero800` - 32px
- `fontSizeHero900` - 40px
- `fontSizeHero1000` - 68px

#### Font Weights
- `fontWeightRegular` - 400
- `fontWeightMedium` - 500
- `fontWeightSemibold` - 600
- `fontWeightBold` - 700

**Example**:
```typescript
const useStyles = makeStyles({
  heading: {
    fontFamily: tokens.fontFamilyPrimary,
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero800,
  },
});
```

### Shadows

Purple-tinted shadows for brand consistency:

- `shadow2` - Subtle (2px)
- `shadow4` - Light (4px)
- `shadow8` - Medium (8px)
- `shadow16` - Heavy (16px)
- `shadow28` - Extra heavy (28px)
- `shadow64` - Maximum (64px)

#### Special Effects
- `glowSmall` - Small purple glow
- `glowMedium` - Medium purple glow
- `glowLarge` - Large purple glow

#### Combined Shadows
- `cardElevation` - Standard card shadow
- `cardHover` - Card hover shadow
- `modalShadow` - Modal/dialog shadow

**Example**:
```typescript
const useStyles = makeStyles({
  card: {
    boxShadow: tokens.shadowCardElevation,
    
    ':hover': {
      boxShadow: tokens.shadowCardHover,
    },
  },
});
```

### Glass Effects

Backdrop filter values:

- `blurLight` - blur(10px) saturate(120%)
- `blurMedium` - blur(20px) saturate(150%)
- `blurHeavy` - blur(40px) saturate(180%)
- `blurExtreme` - blur(60px) saturate(200%)

#### Modal Effects
- `modalBackdrop` - blur(12px) saturate(120%)
- `modalSurface` - blur(40px) saturate(180%)

**Example**:
```typescript
const useStyles = makeStyles({
  glassCard: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
  },
});
```

### Border Radius

- `none` - 0
- `small` - 2px
- `medium` - 4px
- `large` - 6px
- `xLarge` - 8px
- `circular` - 9999px
- `xxLarge` - 12px (custom)
- `xxxLarge` - 16px (custom)
- `xxxxLarge` - 24px (custom)

### Motion/Animation

#### Durations (Fluent UI 2)
- `durationUltraFast` - 50ms
- `durationFaster` - 100ms
- `durationFast` - 150ms
- `durationNormal` - 200ms
- `durationGentle` - 250ms
- `durationSlow` - 300ms
- `durationSlower` - 400ms
- `durationUltraSlow` - 500ms

#### Easing Curves
- `curveLinear` - linear
- `curveEasyEase` - cubic-bezier(0.33,0,0.67,1)
- `curveEasyEaseMax` - cubic-bezier(0.8,0,0.1,1)
- `curveAccelerateMin` - cubic-bezier(0.8,0,1,1)
- `curveDecelerateMin` - cubic-bezier(0,0,0.2,1)

**Example**:
```typescript
const useStyles = makeStyles({
  animated: {
    transitionProperty: 'all',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
});
```

### Gradients

- `purplePrimary` - Main purple gradient
- `purpleLight` - Light purple gradient
- `purpleSubtle` - Very subtle purple tint
- `glassOverlay` - White glass overlay
- `glassPurple` - Purple glass overlay

**Example**:
```typescript
import { gradients } from '@/styles/design-tokens';

const useStyles = makeStyles({
  header: {
    background: gradients.purplePrimary,
  },
});
```

### Z-Index Scale

Predefined z-index values:

- `background` - -1
- `default` - 0
- `dropdown` - 1000
- `sticky` - 1020
- `fixed` - 1030
- `modalBackdrop` - 1040
- `modal` - 1050
- `popover` - 1060
- `tooltip` - 1070
- `notification` - 1080
- `max` - 9999

### Breakpoints

Media query breakpoints:

- `mobile` - 0px
- `tablet` - 768px
- `desktop` - 1024px
- `wide` - 1440px
- `ultrawide` - 1920px

#### Media Query Helpers
- `onMobile` - @media (max-width: 767px)
- `onTablet` - @media (min-width: 768px) and (max-width: 1023px)
- `onDesktop` - @media (min-width: 1024px)
- `onWide` - @media (min-width: 1440px)

**Example**:
```typescript
import { breakpoints } from '@/styles/design-tokens';

const useStyles = makeStyles({
  container: {
    padding: tokens.xl,
    
    [breakpoints.onMobile]: {
      padding: tokens.m,
    },
  },
});
```

---

## Reusable Style Hooks

### usePurpleGlassCard

Standard purple glass card styling.

```typescript
import { usePurpleGlassCard } from '@/hooks/usePurpleGlassStyles';

const styles = usePurpleGlassCard();

<div className={styles.card}>Card content</div>
<div className={styles.cardCompact}>Compact card</div>
<div className={styles.cardNoPadding}>No padding</div>
```

### useModalStyles

Modal/dialog styling with proper backdrop.

```typescript
import { useModalStyles } from '@/hooks/usePurpleGlassStyles';

const styles = useModalStyles();

<Dialog>
  <DialogSurface className={styles.surface}>
    <DialogBody className={styles.body}>
      Content
    </DialogBody>
  </DialogSurface>
</Dialog>
```

### usePurpleButton

Purple-themed button variants.

```typescript
import { usePurpleButton } from '@/hooks/usePurpleGlassStyles';

const styles = usePurpleButton();

<Button className={styles.primary}>Primary</Button>
<Button className={styles.secondary}>Secondary</Button>
<Button className={styles.ghost}>Ghost</Button>
```

### usePurpleInput

Purple glass input styling.

```typescript
import { usePurpleInput } from '@/hooks/usePurpleGlassStyles';

const styles = usePurpleInput();

<Input className={styles.input} />
<Input className={`${styles.input} ${hasError ? styles.inputError : ''}`} />
```

### useLayoutStyles

Common layout patterns.

```typescript
import { useLayoutStyles } from '@/hooks/usePurpleGlassStyles';

const styles = useLayoutStyles();

<div className={styles.stack}>Vertical stack</div>
<div className={styles.row}>Horizontal row</div>
<div className={styles.grid}>Responsive grid</div>
<div className={styles.centerContent}>Centered</div>
```

### useTypographyStyles

Typography with Poppins font.

```typescript
import { useTypographyStyles } from '@/hooks/usePurpleGlassStyles';

const styles = useTypographyStyles();

<h1 className={styles.heading1}>Title</h1>
<h2 className={styles.heading2}>Subtitle</h2>
<p className={styles.body}>Body text</p>
<span className={styles.caption}>Caption</span>
```

### useAnimationStyles

Animation utilities.

```typescript
import { useAnimationStyles } from '@/hooks/usePurpleGlassStyles';

const styles = useAnimationStyles();

<div className={styles.fadeIn}>Fades in</div>
<div className={styles.slideInUp}>Slides up</div>
<div className={styles.scaleIn}>Scales in</div>
```

### useA11yStyles

Accessibility helpers.

```typescript
import { useA11yStyles } from '@/hooks/usePurpleGlassStyles';

const styles = useA11yStyles();

<button className={styles.focusVisible}>Accessible button</button>
<span className={styles.srOnly}>Screen reader only</span>
<a href="#main" className={styles.skipToContent}>Skip to content</a>
```

---

## Theme Switching

### Setup ThemeProvider

Wrap your app in `ThemeProvider`:

```typescript
import { ThemeProvider } from '@/hooks/useTheme';

function App() {
  return (
    <ThemeProvider defaultMode="light">
      <YourApp />
    </ThemeProvider>
  );
}
```

### Use Theme Hook

```typescript
import { useTheme } from '@/hooks/useTheme';

function ThemeSwitcher() {
  const { mode, setMode, toggleMode } = useTheme();
  
  return (
    <div>
      <p>Current mode: {mode}</p>
      <button onClick={toggleMode}>Toggle Theme</button>
      <button onClick={() => setMode('dark')}>Dark Mode</button>
      <button onClick={() => setMode('light')}>Light Mode</button>
    </div>
  );
}
```

---

## Best Practices

### DO ✅

1. **Always use tokens instead of hardcoded values**
   ```typescript
   // ✅ Good
   padding: tokens.xl,
   color: tokens.colorBrandPrimary,
   
   // ❌ Bad
   padding: '20px',
   color: '#8b5cf6',
   ```

2. **Use reusable hooks for common patterns**
   ```typescript
   // ✅ Good
   const styles = usePurpleGlassCard();
   
   // ❌ Bad - Recreating card styles everywhere
   const styles = makeStyles({ card: { ... } });
   ```

3. **Use Fluent motion for animations**
   ```typescript
   // ✅ Good
   transitionDuration: tokens.durationNormal,
   transitionTimingFunction: tokens.curveEasyEase,
   ```

4. **Use semantic color names**
   ```typescript
   // ✅ Good
   color: tokens.colorStatusSuccess,
   
   // ❌ Bad
   color: '#10b981',
   ```

### DON'T ❌

1. **Don't use `!important`**
   - Use proper specificity instead
   - Use component-based styling

2. **Don't hardcode pixel values**
   - Use spacing tokens
   - Makes responsive design easier

3. **Don't create one-off colors**
   - Use design tokens
   - Ensures brand consistency

4. **Don't skip accessibility**
   - Use `useA11yStyles` helpers
   - Always include focus states

---

## Migration Guide

### Converting Existing Styles

**Before** (Old CSS approach):
```css
.my-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
}
```

**After** (New token approach):
```typescript
import { usePurpleGlassCard } from '@/hooks/usePurpleGlassStyles';

// Use the pre-built hook
const styles = usePurpleGlassCard();
return <div className={styles.card}>Content</div>;

// Or build custom with tokens
import { makeStyles } from '@fluentui/react-components';
import { tokens } from '@/styles/design-tokens';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorGlassBackground,
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    borderRadius: tokens.xxLarge,
    padding: tokens.xl,
    boxShadow: tokens.shadowCardElevation,
  },
});
```

---

## Testing

### Visual Verification

1. Check token values in browser DevTools
2. Verify glassmorphic effects render correctly
3. Test responsiveness at all breakpoints
4. Verify animations respect `prefers-reduced-motion`

### Accessibility Testing

1. Ensure focus indicators visible (3px minimum)
2. Test keyboard navigation
3. Verify screen reader announcements
4. Check color contrast ratios (WCAG AA)

---

## Future Enhancements

- [ ] Dark mode full implementation
- [ ] High contrast mode support
- [ ] Additional color themes
- [ ] Animation customization
- [ ] Token visualizer/documentation site

---

## Support

For questions or issues with the design token system:
1. Check this documentation
2. Review `/styles/design-tokens.ts` source code
3. See examples in `/hooks/usePurpleGlassStyles.ts`

---

**Last Updated**: October 17, 2025  
**Maintained By**: LCMDesigner Team
