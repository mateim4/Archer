# Fluent UI 2 Design System with Glassmorphic + Light Acrylic

## Overview

This design system implements Microsoft's Fluent UI 2 design language with custom glassmorphic and light acrylic styling, maintaining a purple gradient theme throughout the LCM Designer application.

## Features

- ✅ **Complete Fluent UI 2 Implementation**: All design tokens, components, and guidelines
- ✅ **Glassmorphic + Light Acrylic Styling**: Advanced blur effects and transparency
- ✅ **Purple Gradient Theme**: Custom brand colors maintaining consistency
- ✅ **Poppins Typography**: Modern font system with proper scaling
- ✅ **Responsive Design**: Mobile-first approach with touch-friendly interactions
- ✅ **Accessibility**: WCAG compliant with proper focus states
- ✅ **Dark Mode Ready**: Adaptable color tokens for theme switching
- ✅ **Playwright Testing**: Comprehensive visual and functional testing

## Design Tokens

### Colors

```css
/* Brand Colors */
--fluent-color-brand-primary: #8b5cf6;
--fluent-color-brand-secondary: #a855f7;
--fluent-color-brand-accent: #6366f1;

/* Neutral Colors */
--fluent-color-neutral-foreground-1: #242424;
--fluent-color-neutral-foreground-2: #424242;
--fluent-color-neutral-foreground-3: #616161;

/* Surface Colors with Acrylic */
--fluent-color-surface-primary: rgba(255, 255, 255, 0.7);
--fluent-color-surface-secondary: rgba(255, 255, 255, 0.5);
--fluent-color-surface-tertiary: rgba(255, 255, 255, 0.3);
```

### Typography

```css
/* Font Family */
--fluent-font-family-base: "Poppins", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;

/* Font Sizes (Fluent Scale) */
--fluent-font-size-100: 10px;   /* Caption 2 */
--fluent-font-size-200: 12px;   /* Caption 1 */
--fluent-font-size-300: 14px;   /* Body 1 */
--fluent-font-size-400: 16px;   /* Body 1 Strong */
--fluent-font-size-500: 18px;   /* Body 2 */
--fluent-font-size-600: 20px;   /* Subtitle 2 */
--fluent-font-size-700: 24px;   /* Subtitle 1 */
--fluent-font-size-800: 28px;   /* Title 3 */
--fluent-font-size-900: 32px;   /* Title 2 */
--fluent-font-size-1000: 40px;  /* Title 1 */
```

### Spacing

```css
/* Fluent Spacing Scale */
--fluent-spacing-xs: 2px;
--fluent-spacing-s: 4px;
--fluent-spacing-m: 8px;
--fluent-spacing-l: 12px;
--fluent-spacing-xl: 16px;
--fluent-spacing-xxl: 20px;
--fluent-spacing-xxxl: 24px;
--fluent-spacing-4xl: 32px;
```

### Glassmorphic Effects

```css
/* Primary Effect - High blur */
--fluent-glassmorphic-primary: backdrop-filter: blur(20px) saturate(180%);

/* Secondary Effect - Medium blur */
--fluent-glassmorphic-secondary: backdrop-filter: blur(16px) saturate(150%);

/* Subtle Effect - Light blur */
--fluent-glassmorphic-subtle: backdrop-filter: blur(12px) saturate(120%);
```

## Components

### Buttons

```tsx
import { FluentButton } from '@/design-system';

// Primary Button
<FluentButton variant="primary" onClick={handleClick}>
  Primary Action
</FluentButton>

// Secondary Button
<FluentButton variant="secondary" icon={<AddIcon />}>
  Secondary Action
</FluentButton>

// Icon Button
<FluentButton variant="icon" icon={<SettingsIcon />} />
```

**CSS Classes:**
- `.fluent2-button` - Base button styles
- `.fluent2-button-primary` - Primary variant with gradient
- `.fluent2-button-secondary` - Secondary with acrylic background
- `.fluent2-button-subtle` - Minimal styling
- `.fluent2-button-small` - Compact size
- `.fluent2-button-large` - Larger touch target

### Cards

```tsx
import { FluentCard } from '@/design-system';

<FluentCard interactive elevation="medium" onClick={handleCardClick}>
  <FluentText variant="title-3">Card Title</FluentText>
  <FluentText variant="body-1">Card content with glassmorphic background</FluentText>
</FluentCard>
```

**CSS Classes:**
- `.fluent2-card` - Base card with glassmorphic effects
- `.fluent2-card-interactive` - Hover and click states
- `.fluent2-card-elevation-low` - Subtle shadow
- `.fluent2-card-elevation-medium` - Standard shadow
- `.fluent2-card-elevation-high` - Prominent shadow

### Input Fields

```tsx
import { FluentInput } from '@/design-system';

<FluentInput
  label="Name"
  placeholder="Enter your name"
  required
  description="This field is required"
  value={value}
  onChange={handleChange}
/>
```

**CSS Classes:**
- `.fluent2-input-wrapper` - Container with label and description
- `.fluent2-input` - Base input with glassmorphic background
- `.fluent2-input-small` - Compact input
- `.fluent2-input-large` - Larger input for mobile
- `.fluent2-input-error` - Error state styling

### Typography

```tsx
import { FluentText } from '@/design-system';

<FluentText variant="title-1" as="h1">Main Title</FluentText>
<FluentText variant="body-1">Regular paragraph text</FluentText>
<FluentText variant="caption-1">Secondary information</FluentText>
```

**CSS Classes:**
- `.fluent2-text-display` - Largest display text
- `.fluent2-text-title-1` through `.fluent2-text-title-3` - Heading levels
- `.fluent2-text-subtitle-1` and `.fluent2-text-subtitle-2` - Subtitle levels
- `.fluent2-text-body-1` and `.fluent2-text-body-2` - Body text
- `.fluent2-text-caption-1` and `.fluent2-text-caption-2` - Small text

### Badges

```tsx
import { FluentBadge } from '@/design-system';

<FluentBadge variant="brand">Featured</FluentBadge>
<FluentBadge variant="success">Active</FluentBadge>
<FluentBadge variant="warning">Pending</FluentBadge>
```

**CSS Classes:**
- `.fluent2-badge` - Base badge styling
- `.fluent2-badge-brand` - Purple brand colors
- `.fluent2-badge-success` - Green success state
- `.fluent2-badge-warning` - Orange warning state
- `.fluent2-badge-danger` - Red error state
- `.fluent2-badge-neutral` - Gray neutral state

### Navigation

```tsx
// Navigation container
<nav className="fluent2-nav">
  <a className="fluent2-nav-item fluent2-nav-item-active" href="/dashboard">
    <HomeIcon /> Dashboard
  </a>
  <a className="fluent2-nav-item" href="/projects">
    <ProjectIcon /> Projects
  </a>
</nav>
```

**CSS Classes:**
- `.fluent2-nav` - Navigation container with glassmorphic background
- `.fluent2-nav-item` - Individual navigation links
- `.fluent2-nav-item-active` - Active/selected state
- `.fluent2-nav-icon` - Icon sizing within navigation

## Icons

Custom SVG icons designed for Fluent UI 2:

```tsx
import { 
  HomeIcon, 
  ProjectIcon, 
  HardwareIcon, 
  SettingsIcon,
  SearchIcon,
  AddIcon,
  ChevronRightIcon,
  CloseIcon 
} from '@/design-system/icons';

<HomeIcon size="medium" color="currentColor" />
<AddIcon size="large" />
```

**Available Icons:**
- `HomeIcon` - Dashboard/home navigation
- `ProjectIcon` - Projects and documents
- `HardwareIcon` - Hardware and infrastructure
- `SettingsIcon` - Configuration and settings
- `SearchIcon` - Search functionality
- `AddIcon` - Create/add actions
- `ChevronRightIcon` - Navigation arrows
- `ChevronDownIcon` - Dropdown indicators
- `UploadIcon` - File upload actions
- `CloseIcon` - Close/dismiss actions

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 768px) {
  /* Mobile optimizations */
  .fluent2-button { min-height: 44px; }
  .fluent2-input { min-height: 44px; }
  .fluent2-nav-item { min-height: 48px; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet optimizations */
}

@media (min-width: 1025px) {
  /* Desktop optimizations */
}
```

### Touch Targets

- **Mobile**: Minimum 44px height for interactive elements
- **Desktop**: Minimum 32px height with hover states
- **Focus**: 2px outline with brand color

## Animations

### Motion Curves

```css
/* Fluent Motion System */
--fluent-curve-accelerate: cubic-bezier(0.9, 0.1, 1, 0.2);
--fluent-curve-decelerate: cubic-bezier(0.1, 0.9, 0.2, 1);
--fluent-curve-ease-max: cubic-bezier(0.8, 0, 0.1, 1);
--fluent-curve-ease: cubic-bezier(0.33, 0, 0.67, 1);
```

### Duration Scale

```css
--fluent-duration-ultra-fast: 50ms;
--fluent-duration-faster: 100ms;
--fluent-duration-fast: 150ms;
--fluent-duration-normal: 200ms;
--fluent-duration-gentle: 250ms;
```

### Animation Classes

- `.fluent2-fade-in` - Fade in animation
- `.fluent2-slide-up` - Slide up from bottom
- `.fluent2-scale-in` - Scale in from center

## Testing

### Playwright Testing

Run comprehensive design system tests:

```bash
# Test design tokens and component functionality
npx playwright test tests/fluent2-design-system.spec.ts

# Visual regression testing
npx playwright test tests/fluent2-visual-regression.spec.ts

# Run all tests
npx playwright test
```

### Test Coverage

- ✅ Design token validation
- ✅ Component rendering and styling
- ✅ Hover and interaction states
- ✅ Responsive behavior
- ✅ Accessibility compliance
- ✅ Visual regression testing
- ✅ Glassmorphic effect validation
- ✅ Dark mode compatibility

## Usage Guidelines

### 1. Import the Design System

```tsx
// Import CSS
import '@/styles/fluent2-design-system.css';

// Import components
import { 
  FluentButton, 
  FluentCard, 
  FluentInput, 
  FluentText 
} from '@/design-system';
```

### 2. Use Design Tokens

```css
/* In your CSS */
.my-component {
  background: var(--fluent-color-surface-primary);
  border-radius: var(--fluent-border-radius-large);
  padding: var(--fluent-spacing-xl);
  backdrop-filter: blur(20px) saturate(180%);
}
```

### 3. Follow Accessibility Guidelines

- Always include proper ARIA labels
- Ensure sufficient color contrast
- Support keyboard navigation
- Use semantic HTML elements

### 4. Maintain Consistency

- Use design tokens instead of hardcoded values
- Follow the spacing scale
- Stick to the typography hierarchy
- Apply glassmorphic effects consistently

## Browser Support

- **Chrome**: Full support including backdrop-filter
- **Firefox**: Full support
- **Safari**: Full support including backdrop-filter
- **Edge**: Full support

### Fallbacks

```css
/* Graceful degradation for older browsers */
.fluent2-card {
  background: rgba(255, 255, 255, 0.9); /* Fallback */
  backdrop-filter: blur(20px); /* Modern browsers */
}
```

## Performance Considerations

- **Blur Effects**: Use moderate blur values (12-20px) for performance
- **Animations**: Prefer transform and opacity for smooth 60fps
- **Images**: Optimize background images for glassmorphic overlays
- **Testing**: Validate performance on lower-end devices

## Version History

- **v2.0.0**: Initial Fluent UI 2 implementation with glassmorphic styling
- **Future**: Dark mode enhancements, additional components

## Contributing

1. Follow Fluent UI 2 design guidelines
2. Maintain glassmorphic consistency
3. Add Playwright tests for new components
4. Update documentation
5. Test across browsers and devices

## Resources

- [Fluent UI 2 Documentation](https://fluent2.microsoft.design/)
- [Glassmorphism Design Principles](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
