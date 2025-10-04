# LCM Designer Frontend - Design System Guide

## Overview

The LCM Designer frontend uses a comprehensive design system based on **Fluent UI 2** principles with a custom **purple glassmorphic** aesthetic. All UI components use consistent design tokens defined in `fluent-enhancements.css`.

## Design System Classes

### Page Layout

#### Container Classes
```tsx
// Main page container - full viewport height with padding
<div className="lcm-page-container">
  {/* Your content */}
</div>

// Constrained width variant (max 1400px)
<div className="lcm-page-container-constrained">
  {/* Your content */}
</div>
```

#### Header Structure
```tsx
<div className="lcm-page-header">
  <div>
    <h1 className="lcm-page-title">Page Title</h1>
    <p className="lcm-page-subtitle">Optional subtitle or description</p>
  </div>
  <div>
    {/* Actions like buttons */}
  </div>
</div>
```

### Cards

```tsx
// Standard card with padding and glassmorphic effect
<div className="lcm-card">
  {/* Card content */}
</div>

// Interactive card (hover effects)
<div className="lcm-card lcm-card-interactive" onClick={handleClick}>
  {/* Card content */}
</div>

// Compact card with less padding
<div className="lcm-card lcm-card-compact">
  {/* Card content */}
</div>

// Card without padding
<div className="lcm-card lcm-card-no-padding">
  {/* Card content */}
</div>
```

#### Card Content
```tsx
<h3 className="lcm-card-title">Card Title</h3>
<p className="lcm-card-subtitle">Card subtitle or description</p>
```

### Buttons

```tsx
// Primary button (gradient purple)
<button className="lcm-button lcm-button-primary">
  Primary Action
</button>

// Subtle button (transparent with border)
<button className="lcm-button lcm-button-subtle">
  Secondary Action
</button>

// Button with icon
<button className="lcm-button lcm-button-primary lcm-button-with-icon">
  <PlusIcon />
  Add Item
</button>

// Icon-only button
<button className="lcm-button lcm-button-subtle lcm-button-icon">
  <CloseIcon />
</button>

// Disabled state
<button className="lcm-button lcm-button-primary" disabled>
  Disabled
</button>
```

### Forms

```tsx
<div className="lcm-form-section">
  <div className="lcm-form-group">
    <label className="lcm-label" htmlFor="field-id">
      Field Label
    </label>
    <input
      id="field-id"
      type="text"
      className="lcm-input"
      placeholder="Enter value..."
    />
  </div>
  
  <div className="lcm-form-group">
    <label className="lcm-label" htmlFor="select-id">
      Select Label
    </label>
    <select id="select-id" className="lcm-select">
      <option>Option 1</option>
      <option>Option 2</option>
    </select>
  </div>
</div>
```

### Modals

```tsx
{showModal && (
  <div className="lcm-modal-overlay">
    <div className="lcm-modal">
      <div className="lcm-modal-header">
        <h2 className="lcm-modal-title">Modal Title</h2>
        <button 
          className="lcm-button lcm-button-subtle lcm-button-icon"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      
      <div className="lcm-modal-content">
        {/* Modal content */}
      </div>
      
      <div className="lcm-modal-actions">
        <button className="lcm-button lcm-button-subtle" onClick={onClose}>
          Cancel
        </button>
        <button className="lcm-button lcm-button-primary" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

### Alerts

```tsx
// Error alert
<div className="lcm-alert lcm-alert-error">
  <ErrorIcon />
  <p>An error occurred. Please try again.</p>
</div>

// Success alert
<div className="lcm-alert lcm-alert-success">
  <CheckIcon />
  <p>Operation completed successfully!</p>
</div>

// Info alert
<div className="lcm-alert lcm-alert-info">
  <InfoIcon />
  <p>Helpful information for the user.</p>
</div>

// Warning alert
<div className="lcm-alert lcm-alert-warning">
  <WarningIcon />
  <p>Please review this important notice.</p>
</div>
```

### Empty States

```tsx
<div className="lcm-empty-state">
  <div className="lcm-empty-state-icon">
    <EmptyIcon />
  </div>
  <h3 className="lcm-empty-state-title">No Items Found</h3>
  <p className="lcm-empty-state-description">
    Get started by creating your first item.
  </p>
  <button className="lcm-button lcm-button-primary">
    Create New Item
  </button>
</div>
```

### Icons

```tsx
// Icon container with background
<div className="lcm-icon-container lcm-icon-container-primary">
  <Icon />
</div>
```

### Tables

```tsx
<div className="lcm-table-container">
  <div className="lcm-table-header">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
  </div>
  
  <div className="lcm-table-row">
    <div>Value 1</div>
    <div>Value 2</div>
    <div>Value 3</div>
  </div>
  
  {/* More rows... */}
</div>
```

## Design Tokens (CSS Variables)

### Colors

```css
--lcm-primary: #8b5cf6;              /* Primary purple */
--lcm-primary-light: rgba(139, 92, 246, 0.1);
--lcm-primary-border: rgba(139, 92, 246, 0.2);
--lcm-primary-hover: rgba(139, 92, 246, 0.4);

--lcm-text-primary: #1a202c;        /* Main text color */
--lcm-text-secondary: #374151;      /* Secondary text */
--lcm-text-muted: #64748b;          /* Muted/disabled text */

--lcm-bg-card: rgba(255, 255, 255, 0.85);
--lcm-bg-card-hover: rgba(255, 255, 255, 0.95);
--lcm-bg-input: transparent;
--lcm-bg-input-focus: transparent;
--lcm-bg-dropdown: transparent;
```

### Typography

```css
--fluent-font-family-base: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', 'Segoe UI', system-ui;
```

### Spacing

```css
--lcm-spacing-xs: 4px;
--lcm-spacing-sm: 8px;
--lcm-spacing-md: 12px;
--lcm-spacing-lg: 16px;
--lcm-spacing-xl: 20px;
--lcm-spacing-xxl: 24px;
--lcm-spacing-xxxl: 32px;
```

### Border Radius

```css
--lcm-radius-sm: 4px;
--lcm-radius-md: 6px;
--lcm-radius-lg: 8px;
--lcm-radius-xl: 12px;
```

### Icon Sizes

```css
--lcm-icon-size-sm: 16px;
--lcm-icon-size-md: 20px;
--lcm-icon-size-lg: 24px;
--lcm-icon-size-xl: 32px;
```

### Shadows

```css
--lcm-shadow-card: 0 4px 24px 0 rgba(168,85,247,0.07), 0 1.5px 4px 0 rgba(0,0,0,0.04);
--lcm-shadow-card-hover: 0 8px 32px 0 rgba(168,85,247,0.12), 0 2px 8px 0 rgba(0,0,0,0.08);
```

### Backdrop Filter

```css
--lcm-backdrop-filter: blur(18px) saturate(180%);
--lcm-backdrop-filter-intense: blur(30px) saturate(225%);
```

## Enhanced UX Components

For complex interactions, use the enhanced UX components from `components/EnhancedUXComponents.tsx`:

```tsx
import {
  EnhancedButton,
  EnhancedCard,
  LoadingSpinner,
  ToastContainer,
  EnhancedProgressBar,
  EnhancedModal,
  EnhancedFormField,
  EnhancedSearch
} from '../components/EnhancedUXComponents';

// Use enhanced hooks
import { useEnhancedUX, useFormValidation, useResponsive } from '../hooks/useEnhancedUX';
```

### Loading States

```tsx
const { isLoading, showToast, withLoading } = useEnhancedUX();

// Show loading spinner
{isLoading && <LoadingSpinner message="Loading data..." />}

// Display toasts
<ToastContainer />

// Wrap async operations
await withLoading(async () => {
  await fetchData();
});
```

## Best Practices

### 1. Always Use Design System Classes
❌ Don't use inline styles or custom classes:
```tsx
<div style={{ padding: '24px', background: '#fff' }}>
```

✅ Do use design system classes:
```tsx
<div className="lcm-card">
```

### 2. Use CSS Variables for Colors
❌ Don't hardcode colors:
```tsx
<div style={{ color: '#8b5cf6' }}>
```

✅ Do use CSS variables:
```tsx
<div style={{ color: 'var(--lcm-primary)' }}>
```

### 3. Consistent Spacing
Use spacing variables for margins and padding:
```tsx
<div style={{ marginBottom: 'var(--lcm-spacing-lg)' }}>
```

### 4. Accessibility
- Always include proper ARIA labels
- Use semantic HTML elements
- Ensure keyboard navigation works
- Maintain sufficient color contrast

### 5. Responsive Design
The design system includes responsive breakpoints. Test your components on mobile, tablet, and desktop viewports.

## Migration from Legacy Classes

If you encounter old `fluent-*` classes, replace them with `.lcm-*` equivalents:

- `fluent-page-container` → `lcm-page-container`
- `fluent-button` → `lcm-button`
- `fluent-card` → Use `lcm-card` (already exists)
- `fluent-modal` → `lcm-modal`
- `fluent-alert` → `lcm-alert`

## Component Patterns

### Hero Header Pattern
```tsx
<div className="lcm-page-header">
  <div>
    <h1 className="lcm-page-title">Dashboard</h1>
    <p className="lcm-page-subtitle">
      Monitor your infrastructure health and performance
    </p>
  </div>
  <div className="flex gap-4">
    <button className="lcm-button lcm-button-subtle">
      <SettingsIcon />
      Settings
    </button>
    <button className="lcm-button lcm-button-primary">
      <PlusIcon />
      New Project
    </button>
  </div>
</div>
```

### Stats Row Pattern
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {stats.map(stat => (
    <div className="lcm-card" key={stat.id}>
      <div className="lcm-icon-container lcm-icon-container-primary">
        <stat.icon />
      </div>
      <h3 className="lcm-card-title">{stat.value}</h3>
      <p className="lcm-card-subtitle">{stat.label}</p>
    </div>
  ))}
</div>
```

### List with Actions Pattern
```tsx
<div className="space-y-4">
  {items.map(item => (
    <div className="lcm-card lcm-card-interactive" key={item.id}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="lcm-card-title">{item.name}</h3>
          <p className="lcm-card-subtitle">{item.description}</p>
        </div>
        <div className="flex gap-2">
          <button className="lcm-button lcm-button-subtle lcm-button-icon">
            <EditIcon />
          </button>
          <button className="lcm-button lcm-button-subtle lcm-button-icon">
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
```

## Resources

- **CSS File**: `frontend/src/fluent-enhancements.css`
- **Enhanced Components**: `frontend/src/components/EnhancedUXComponents.tsx`
- **Design System Index**: `frontend/src/design-system/index.ts`
- **Hooks**: `frontend/src/hooks/useEnhancedUX.tsx`

## Questions?

For design system questions or to propose new patterns, please consult the design system documentation or reach out to the frontend team.

