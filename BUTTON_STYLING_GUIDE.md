# Button Styling Guide

This guide documents the centralized button styling system implemented in LCMDesigner.

## Overview

All buttons in the application should use the standardized CSS utility classes defined in `frontend/src/index.css`. This ensures visual consistency, maintainability, and proper accessibility.

## Available Classes

### Base Class
All buttons must start with the `.btn` base class:

```html
<button className="btn">Button Text</button>
```

### Variant Classes

| Class | Use Case | Description |
|-------|----------|-------------|
| `.btn-primary` | Primary actions (Save, Submit, Create) | Purple gradient with glow effect |
| `.btn-secondary` | Secondary actions | Subtle purple tint background |
| `.btn-ghost` | Tertiary actions | Transparent with hover fill |
| `.btn-outline` | Alternative secondary | Border only, transparent bg |
| `.btn-danger` | Destructive actions (Delete) | Red background |
| `.btn-success` | Confirmations | Green background |
| `.btn-link` | Text-only buttons | Underlined text, no background |

### Size Classes

| Class | Height | Use Case |
|-------|--------|----------|
| `.btn-sm` | 28px | Compact UIs, table actions |
| `.btn-md` (default) | 36px | Standard buttons |
| `.btn-lg` | 44px | Prominent CTAs, heroes |

### Special Classes

| Class | Description |
|-------|-------------|
| `.btn-icon` | Square icon-only button (36x36) |
| `.btn-icon.btn-sm` | Small icon button (28x28) |
| `.btn-icon.btn-lg` | Large icon button (44x44) |
| `.btn-block` | Full width button |
| `.btn-glass` | Adds glassmorphic blur effect |
| `.btn-tab` | Tab-style button with bottom border |

## Usage Examples

### Primary Action Button
```tsx
<button className="btn btn-primary">
  <SaveIcon /> Save Changes
</button>
```

### Secondary Action with Icon
```tsx
<button className="btn btn-secondary btn-sm">
  <EditIcon /> Edit
</button>
```

### Icon-Only Button
```tsx
<button className="btn btn-icon btn-ghost" aria-label="Settings">
  <SettingsIcon />
</button>
```

### Full Width Submit
```tsx
<button className="btn btn-primary btn-block btn-lg">
  Submit Form
</button>
```

### Tab Buttons
```tsx
<button 
  className="btn-tab" 
  data-active={isActive || undefined}
  onClick={() => setTab('overview')}
>
  Overview
</button>
```

## PurpleGlassButton Component

For complex interactive buttons that need loading states, the `PurpleGlassButton` component is available:

```tsx
import { PurpleGlassButton } from '@/components/ui';

<PurpleGlassButton 
  variant="primary" 
  size="md"
  loading={isLoading}
  onClick={handleClick}
>
  Submit
</PurpleGlassButton>
```

### PurpleGlassButton Props
- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost' | 'link'`
- `size`: `'sm' | 'md' | 'lg'`
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean

## When to Use What

| Scenario | Recommended Approach |
|----------|---------------------|
| Simple action button | `.btn` CSS classes |
| Button with loading state | `PurpleGlassButton` component |
| Form submit | `.btn btn-primary` or Fluent UI `Button` |
| Modal actions | Fluent UI `Button` with `appearance` prop |
| Icon-only toolbar | `.btn btn-icon btn-ghost` |
| Tab navigation | `.btn-tab` with `data-active` |

## CSS Custom Properties Used

The button classes utilize these design tokens:
- `--btn-primary-bg`, `--btn-primary-bg-hover`
- `--btn-primary-text`
- `--btn-primary-border`
- `--btn-primary-shadow`, `--btn-primary-shadow-hover`
- `--btn-secondary-*`
- `--btn-ghost-*`
- `--btn-outline-*`
- `--status-critical` (for danger)
- `--status-success` (for success)
- `--tab-text`, `--tab-text-active`, `--tab-bg`

## Migration Checklist

When migrating inline button styles:

1. ✅ Remove inline `style={{ }}` objects
2. ✅ Remove `onMouseEnter/onMouseLeave` hover handlers (CSS handles this)
3. ✅ Add `className="btn btn-{variant}"` 
4. ✅ Add size class if not default (`.btn-sm` or `.btn-lg`)
5. ✅ Keep `onClick`, `disabled`, `aria-*` attributes
6. ✅ Test hover, focus, active, and disabled states

## Accessibility Notes

- All button variants include proper `:focus-visible` styles
- Disabled buttons have reduced opacity and `cursor: not-allowed`
- Icon-only buttons must have `aria-label` or `title`
- Color contrast ratios meet WCAG 2.1 AA standards
