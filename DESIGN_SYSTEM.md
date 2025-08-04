# InfraAID Design System

## Overview

InfraAID uses a sophisticated design system based on Fluent 2 principles with glassmorphism effects and a purple color scheme. The design emphasizes clarity, accessibility, and modern aesthetics.

## Color Palette

### Primary Colors
- **Primary Purple**: `#8b5cf6` (var(--lcm-primary))
- **Primary Light**: `rgba(139, 92, 246, 0.1)` (var(--lcm-primary-light))
- **Primary Border**: `rgba(139, 92, 246, 0.2)` (var(--lcm-primary-border))
- **Primary Hover**: `rgba(139, 92, 246, 0.4)` (var(--lcm-primary-hover))

### Text Colors
- **Primary Text**: `#1a202c` (var(--lcm-text-primary))
- **Secondary Text**: `#374151` (var(--lcm-text-secondary))
- **Muted Text**: `#64748b` (var(--lcm-text-muted))

### Background Colors
- **Card Background**: `rgba(255, 255, 255, 0.85)` (var(--lcm-bg-card))
- **Card Hover**: `rgba(255, 255, 255, 0.95)` (var(--lcm-bg-card-hover))
- **Input Background**: `rgba(255, 255, 255, 0.8)` (var(--lcm-bg-input))

## Typography

- **Font Family**: Montserrat, system fonts
- **Base Size**: 14px (0.875rem)
- **Line Height**: 1.4-1.5 for readability
- **Font Weights**: 400 (normal), 600 (semibold), 700 (bold)

## Component Library

### 1. Page Layout

#### Page Container
```tsx
<div className="fluent-page-container">
  {/* Content */}
</div>
```

#### Page Header
```tsx
<div className="fluent-page-header">
  <div>
    <h1 className="fluent-page-title">Page Title</h1>
    <p className="fluent-page-subtitle">Page description</p>
  </div>
  <button className="fluent-button fluent-button-primary">
    Action Button
  </button>
</div>
```

### 2. Cards

#### Standard Card
```tsx
<div className="lcm-card">
  {/* Card content */}
</div>
```

#### Interactive Card (for clickable items)
```tsx
<div className="lcm-card lcm-card-interactive">
  {/* Card content */}
</div>
```

#### Compact Card (for toolbars, filters)
```tsx
<div className="lcm-card lcm-card-compact">
  {/* Card content */}
</div>
```

### 3. Buttons

#### Primary Button
```tsx
<button className="fluent-button fluent-button-primary">
  Primary Action
</button>
```

#### Button with Icon
```tsx
<button className="fluent-button fluent-button-primary fluent-button-with-icon">
  <Plus className="w-4 h-4" />
  Add Item
</button>
```

#### Icon-only Button
```tsx
<button className="fluent-button fluent-button-subtle fluent-button-icon">
  <Edit className="w-4 h-4" />
</button>
```

#### Subtle Button
```tsx
<button className="fluent-button fluent-button-subtle">
  Secondary Action
</button>
```

### 4. Forms

#### Form Structure
```tsx
<div className="fluent-form-section">
  <h4 className="fluent-section-title">Section Title</h4>
  
  <div className="fluent-form-group">
    <label className="fluent-label">Field Label</label>
    <input 
      type="text" 
      className="fluent-input" 
      placeholder="Placeholder text"
    />
  </div>
  
  <div className="fluent-form-group">
    <label className="fluent-label">Select Field</label>
    <select className="fluent-select">
      <option value="">Choose option</option>
      <option value="1">Option 1</option>
    </select>
  </div>
</div>
```

### 5. Modals

#### Modal Structure
```tsx
<div className="fluent-modal-overlay">
  <div className="fluent-modal">
    <div className="fluent-modal-header">
      <h3 className="fluent-modal-title">Modal Title</h3>
      <button className="fluent-button fluent-button-subtle fluent-button-icon">
        <X className="w-5 h-5" />
      </button>
    </div>
    
    <div className="fluent-modal-content">
      {/* Modal content */}
    </div>
    
    <div className="fluent-modal-actions">
      <button className="fluent-button fluent-button-subtle">
        Cancel
      </button>
      <button className="fluent-button fluent-button-primary">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### 6. Tables

#### Responsive Table
```tsx
<div className="lcm-card lcm-card-no-padding">
  <div className="lcm-table-header">
    <div>Column 1</div>
    <div>Column 2</div>
    <div>Column 3</div>
  </div>
  
  {items.map(item => (
    <div key={item.id} className="lcm-table-row">
      <div data-label="Column 1">{item.col1}</div>
      <div data-label="Column 2">{item.col2}</div>
      <div data-label="Column 3">{item.col3}</div>
    </div>
  ))}
</div>
```

### 7. Icons

#### Icon Container
```tsx
<div className="fluent-icon-container fluent-icon-container-primary">
  <Server className="w-5 h-5" />
</div>
```

### 8. Alerts

#### Error Alert
```tsx
<div className="fluent-alert fluent-alert-error">
  <p>Error message here</p>
</div>
```

### 9. Empty States

#### Empty State
```tsx
<div className="fluent-empty-state">
  <div className="fluent-empty-state-icon">
    <FolderOpen className="w-16 h-16" />
  </div>
  <h3 className="fluent-empty-state-title">No items found</h3>
  <p className="fluent-empty-state-description">
    Description of the empty state and what users can do.
  </p>
  <button className="fluent-button fluent-button-primary fluent-button-with-icon mt-4">
    <Plus className="w-4 h-4" />
    Add Item
  </button>
</div>
```

### 10. Card Content

#### Card with Title and Subtitle
```tsx
<div className="lcm-card">
  <div className="flex items-center mb-4">
    <div className="fluent-icon-container fluent-icon-container-primary mr-3">
      <Server className="w-5 h-5" />
    </div>
    <div>
      <h3 className="fluent-card-title">Card Title</h3>
      <p className="fluent-card-subtitle">Card subtitle</p>
    </div>
  </div>
  
  {/* Card content */}
</div>
```

## Layout Patterns

### Grid Layouts
- Use CSS Grid for consistent spacing: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Standard gap: `gap-6` (24px)

### Flexbox Patterns
- Header with actions: `flex justify-between items-center`
- Vertical spacing: `space-y-4` or `space-y-6`
- Icon with text: `flex items-center gap-3`

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Stack elements vertically on mobile
- Use responsive grid columns

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Focus states are clearly visible
- Interactive elements have adequate contrast

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- Logical tab order

### Screen Readers
- Proper semantic HTML
- ARIA labels where needed
- Descriptive button text

## Animation & Transitions

### Standard Transitions
- Duration: `0.2s ease` for most interactions
- Hover effects: subtle transform and shadow changes
- Modal overlays: backdrop blur effects

### Micro-interactions
- Button hover: `translateY(-1px)` with shadow increase
- Card hover: `translateY(-2px)` with shadow enhancement
- Loading states: standard spinner with brand colors

## Best Practices

### Do's
- Use consistent spacing (multiples of 4px)
- Apply glassmorphism effects consistently
- Use the design system components
- Maintain proper contrast ratios
- Include hover and focus states

### Don'ts
- Don't use arbitrary colors outside the palette
- Don't mix different border radius values
- Don't skip accessibility considerations
- Don't use inline styles for design system properties
- Don't create custom components without following the patterns

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: Backdrop filter support is required for full visual effects.
