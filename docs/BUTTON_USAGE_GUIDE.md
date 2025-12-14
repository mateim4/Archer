# Button and Search Bar Standardization Guide

## Overview

This document defines the standardized approach to buttons and search bars in the Archer ITSM application. All developers must follow these guidelines to ensure consistency, accessibility, and maintainability.

**Last Updated:** 2025-12-14  
**Status:** Active

---

## Table of Contents

1. [Button Component](#button-component)
2. [Search Bar Component](#search-bar-component)
3. [Usage Guidelines](#usage-guidelines)
4. [Accessibility Requirements](#accessibility-requirements)
5. [Migration Guide](#migration-guide)
6. [Design Tokens](#design-tokens)

---

## Button Component

### EnhancedPurpleGlassButton

The `EnhancedPurpleGlassButton` is the standard button component for all interactive actions in Archer.

#### Import

```tsx
import { EnhancedPurpleGlassButton } from '@/components/ui';
```

#### Basic Usage

```tsx
<EnhancedPurpleGlassButton onClick={handleClick}>
  Click Me
</EnhancedPurpleGlassButton>
```

#### Variants

##### Primary (Default)
Used for primary actions (save, submit, confirm)

```tsx
<EnhancedPurpleGlassButton variant="primary">
  Save Changes
</EnhancedPurpleGlassButton>
```

##### Secondary
Used for secondary actions (cancel, view details)

```tsx
<EnhancedPurpleGlassButton variant="secondary">
  Cancel
</EnhancedPurpleGlassButton>
```

##### Danger
Used for destructive actions (delete, remove, archive)

```tsx
<EnhancedPurpleGlassButton variant="danger">
  Delete Item
</EnhancedPurpleGlassButton>
```

##### Ghost
Used for subtle actions (minimize, collapse)

```tsx
<EnhancedPurpleGlassButton variant="ghost">
  Show More
</EnhancedPurpleGlassButton>
```

##### Link
Used for text-only navigation

```tsx
<EnhancedPurpleGlassButton variant="link">
  Learn More
</EnhancedPurpleGlassButton>
```

#### Sizes

```tsx
{/* Small - for compact spaces */}
<EnhancedPurpleGlassButton size="small">
  Small
</EnhancedPurpleGlassButton>

{/* Medium (default) - for most use cases */}
<EnhancedPurpleGlassButton size="medium">
  Medium
</EnhancedPurpleGlassButton>

{/* Large - for prominent actions */}
<EnhancedPurpleGlassButton size="large">
  Large
</EnhancedPurpleGlassButton>
```

#### With Icons

```tsx
import { SaveRegular, DeleteRegular, ChevronRightRegular } from '@fluentui/react-icons';

{/* Icon at start */}
<EnhancedPurpleGlassButton icon={<SaveRegular />}>
  Save
</EnhancedPurpleGlassButton>

{/* Icon at end */}
<EnhancedPurpleGlassButton iconEnd={<ChevronRightRegular />}>
  Next
</EnhancedPurpleGlassButton>

{/* Icon only */}
<EnhancedPurpleGlassButton icon={<DeleteRegular />} aria-label="Delete" />
```

#### States

##### Loading

```tsx
<EnhancedPurpleGlassButton loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</EnhancedPurpleGlassButton>
```

##### Disabled

```tsx
<EnhancedPurpleGlassButton disabled={!isValid}>
  Submit
</EnhancedPurpleGlassButton>
```

#### Special Features

##### Animated Gradient (Default)

```tsx
{/* Animated gradient enabled by default */}
<EnhancedPurpleGlassButton>
  Animated Button
</EnhancedPurpleGlassButton>

{/* Disable animation if needed */}
<EnhancedPurpleGlassButton animated={false}>
  Static Button
</EnhancedPurpleGlassButton>
```

##### Full Width

```tsx
<EnhancedPurpleGlassButton fullWidth>
  Full Width Button
</EnhancedPurpleGlassButton>
```

##### Elevated Shadow

```tsx
<EnhancedPurpleGlassButton elevated>
  Elevated Button
</EnhancedPurpleGlassButton>
```

#### Complete Example

```tsx
import { EnhancedPurpleGlassButton } from '@/components/ui';
import { SaveRegular } from '@fluentui/react-icons';

const MyForm = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EnhancedPurpleGlassButton
      variant="primary"
      size="medium"
      icon={<SaveRegular />}
      loading={isSubmitting}
      onClick={handleSubmit}
      type="submit"
    >
      {isSubmitting ? 'Saving...' : 'Save Changes'}
    </EnhancedPurpleGlassButton>
  );
};
```

---

## Search Bar Component

### EnhancedPurpleGlassSearchBar

The `EnhancedPurpleGlassSearchBar` is the standard search input component with animated glassmorphic styling.

#### Import

```tsx
import { EnhancedPurpleGlassSearchBar } from '@/components/ui';
```

#### Basic Usage

```tsx
const [searchTerm, setSearchTerm] = React.useState('');

<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search..."
/>
```

#### Features

##### Clear Button

```tsx
{/* Clear button enabled by default */}
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  showClearButton={true}
/>
```

##### Auto-focus

```tsx
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  autoFocus={true}
/>
```

##### Submit on Enter

```tsx
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onSubmit={() => performSearch(searchTerm)}
/>
```

##### Custom Width

```tsx
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  width="600px"
/>
```

##### Accessibility Label

```tsx
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search tickets..."
  ariaLabel="Search through all tickets"
/>
```

#### Complete Example

```tsx
import { EnhancedPurpleGlassSearchBar } from '@/components/ui';

const SearchView = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults] = React.useState([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const data = await searchAPI(searchTerm);
    setResults(data);
  };

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <EnhancedPurpleGlassSearchBar
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search tickets, assets, or people..."
      showClearButton
      onSubmit={handleSearch}
      ariaLabel="Global search"
    />
  );
};
```

---

## Usage Guidelines

### When to Use Each Button Variant

| Variant | Use Case | Examples |
|---------|----------|----------|
| **Primary** | Main action on a page/form | Save, Submit, Create, Confirm, Sign In |
| **Secondary** | Supporting actions | Cancel, Back, View Details, Download |
| **Danger** | Destructive actions | Delete, Remove, Archive, Revoke |
| **Ghost** | Subtle tertiary actions | Show More, Collapse, Minimize |
| **Link** | Navigation without button styling | Learn More, View Documentation |

### Button Hierarchy Rules

1. **One Primary per Screen Section**
   - Only one primary button visible per logical screen section
   - If multiple primaries are needed, separate them into distinct sections

2. **Action Priority**
   ```tsx
   {/* ❌ BAD: Multiple primaries side-by-side */}
   <div>
     <EnhancedPurpleGlassButton variant="primary">Save</EnhancedPurpleGlassButton>
     <EnhancedPurpleGlassButton variant="primary">Publish</EnhancedPurpleGlassButton>
   </div>

   {/* ✅ GOOD: Primary + Secondary */}
   <div>
     <EnhancedPurpleGlassButton variant="primary">Save</EnhancedPurpleGlassButton>
     <EnhancedPurpleGlassButton variant="secondary">Cancel</EnhancedPurpleGlassButton>
   </div>
   ```

3. **Destructive Actions**
   - Always use `danger` variant for destructive actions
   - Add confirmation dialog for irreversible actions

4. **Loading States**
   - Always show loading state for async operations
   - Update button text to reflect current action state

### Search Bar Placement

1. **Global Search**
   - Use in top navigation bar
   - Enable keyboard shortcut (Ctrl/Cmd + K)
   - Include placeholder describing scope

2. **Filtered Search**
   - Use within specific views (tickets, assets, etc.)
   - Place above data tables or card grids
   - Clear placeholder indicating what's searchable

3. **Width Guidelines**
   - Desktop: 400-600px for global search
   - Desktop: 100% width for filtered search
   - Mobile: Always 100% width

---

## Accessibility Requirements

### Buttons

#### ARIA Labels

```tsx
{/* Icon-only buttons MUST have aria-label */}
<EnhancedPurpleGlassButton 
  icon={<DeleteRegular />} 
  aria-label="Delete item"
/>

{/* For dynamic content */}
<EnhancedPurpleGlassButton 
  loading={isDeleting}
  aria-label={isDeleting ? 'Deleting item...' : 'Delete item'}
>
  Delete
</EnhancedPurpleGlassButton>
```

#### Keyboard Navigation

- All buttons are keyboard accessible via Tab
- Enter or Space activates the button
- Focus visible indicator is automatically shown
- Focus order follows visual layout

#### Screen Readers

```tsx
{/* Loading state is announced */}
<EnhancedPurpleGlassButton loading={true} aria-busy="true">
  Saving...
</EnhancedPurpleGlassButton>

{/* Disabled state is announced */}
<EnhancedPurpleGlassButton disabled aria-disabled="true">
  Cannot Edit
</EnhancedPurpleGlassButton>
```

### Search Bars

#### ARIA Labels

```tsx
{/* Use ariaLabel for screen readers */}
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search tickets..."
  ariaLabel="Search through all support tickets"
/>
```

#### Keyboard Navigation

- Tab to focus search input
- Escape to clear search (when clear button shown)
- Enter to submit search (when onSubmit provided)

---

## Migration Guide

### Replacing Native Buttons

#### Before

```tsx
<button onClick={handleClick}>
  Click Me
</button>
```

#### After

```tsx
<EnhancedPurpleGlassButton onClick={handleClick}>
  Click Me
</EnhancedPurpleGlassButton>
```

### Replacing Old Button Components

#### From PrimaryButton

```tsx
// Before
<PrimaryButton onClick={handleSave}>
  Save
</PrimaryButton>

// After
<EnhancedPurpleGlassButton variant="primary" onClick={handleSave}>
  Save
</EnhancedPurpleGlassButton>
```

#### From Fluent UI Button

```tsx
// Before
import { Button } from '@fluentui/react-components';

<Button appearance="primary" onClick={handleClick}>
  Click
</Button>

// After
import { EnhancedPurpleGlassButton } from '@/components/ui';

<EnhancedPurpleGlassButton variant="primary" onClick={handleClick}>
  Click
</EnhancedPurpleGlassButton>
```

### Replacing GlassmorphicSearchBar

```tsx
// Before
import GlassmorphicSearchBar from '@/components/GlassmorphicSearchBar';

<GlassmorphicSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search..."
  width="100%"
/>

// After
import { EnhancedPurpleGlassSearchBar } from '@/components/ui';

<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search..."
  width="100%"
/>
```

---

## Design Tokens

### Button Gradients

The animated gradients use the following design tokens:

```typescript
// Primary gradient
gradients.buttonPrimary = 'linear-gradient(225deg, rgba(139, 92, 246, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)'

// Hover gradient
gradients.buttonPrimaryHover = 'linear-gradient(225deg, rgba(139, 92, 246, 0.96) 0%, rgba(99, 102, 241, 0.96) 100%)'

// Active gradient
gradients.buttonPrimaryActive = 'linear-gradient(225deg, rgba(139, 92, 246, 1) 0%, rgba(99, 102, 241, 1) 100%)'
```

### Animation Parameters

```css
/* Gradient animation timing */
animation-duration: 8s; /* Normal state */
animation-duration: 4s; /* Hover state - faster */

/* Easing function */
animation-timing-function: ease-in-out;

/* Respects user preferences */
@media (prefers-reduced-motion: reduce) {
  animation: none;
}
```

### Color Tokens

```typescript
// Purple palette
purplePalette.purple600 = '#8b5cf6'  // Primary brand
purplePalette.purple800 = '#6366f1'  // Secondary brand

// Status colors
purplePalette.success = '#10b981'
purplePalette.warning = '#f59e0b'
purplePalette.error = '#ef4444'
```

---

## ESLint Rules (Coming Soon)

To enforce these standards, the following ESLint rules will be added:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "JSXOpeningElement[name.name='button']:not([name.object.name='EnhancedPurpleGlassButton'])",
        "message": "Use EnhancedPurpleGlassButton instead of native <button> elements"
      }
    ]
  }
}
```

---

## Testing Checklist

Before deploying button/search bar changes:

- [ ] Visual: Test all variants in light and dark mode
- [ ] Responsive: Test on mobile, tablet, and desktop
- [ ] Accessibility: Tab navigation works correctly
- [ ] Accessibility: Screen reader announces states correctly
- [ ] Accessibility: Focus indicators are visible
- [ ] Animation: Gradient animates smoothly at 60fps
- [ ] Animation: Animation respects prefers-reduced-motion
- [ ] States: Loading state shows spinner
- [ ] States: Disabled state prevents interaction
- [ ] Icons: Icon alignment is correct
- [ ] Icons: Icon-only buttons have aria-label

---

## Support and Questions

For questions about button/search bar usage, contact:
- Design System Team: #design-system Slack channel
- Documentation: COMPONENT_LIBRARY_GUIDE.md
- Examples: Storybook (coming soon)

**Remember:** Consistent UI = Better UX = Happier Users!
