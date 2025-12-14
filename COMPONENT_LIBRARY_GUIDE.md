# Purple Glass Component Library Guide

**Version:** 2.0.0  
**Date:** December 15, 2025  
**Status:** Production Ready ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Design Principles](#design-principles)
4. [**NEW: Enhanced Components (Standard)**](#enhanced-components-standard)
   - [EnhancedPurpleGlassButton](#enhancedpurpleglassbutton) ⭐
   - [EnhancedPurpleGlassSearchBar](#enhancedpurpleglasssearchbar) ⭐
5. [Legacy Components](#legacy-components)
   - [PurpleGlassButton](#purpleglassbutton-legacy)
   - [PurpleGlassInput](#purpleglassinput)
   - [PurpleGlassTextarea](#purpleglasstext area)
   - [PurpleGlassDropdown](#purpleglassdropdown)
   - [PurpleGlassCheckbox](#purpleglasscheckbox)
   - [PurpleGlassRadio](#purpleglassradio)
   - [PurpleGlassSwitch](#purpleglassswitch)
   - [PurpleGlassCard](#purpleglasscard)
6. [Common Patterns](#common-patterns)
7. [Accessibility](#accessibility)
8. [TypeScript Support](#typescript-support)
9. [Migration Guide](#migration-guide)

---

## Overview

The Purple Glass Component Library is a comprehensive collection of reusable UI components built with:

- **Fluent UI 2 Design Tokens** - 100% token-based styling, zero hardcoded values
- **Glassmorphism Aesthetic** - Translucent backgrounds with blur effects
- **Yoga Perdana Design** - Hue-shift gradients with constant brightness for accessibility
- **TypeScript Strict Mode** - Full type safety with exported interfaces
- **Accessibility First** - ARIA labels, keyboard navigation, screen reader support
- **Consistent API** - All components follow the same prop patterns

### ⚠️ IMPORTANT: New Standard Components

**As of December 2025, all new development MUST use:**

| Component | Purpose | Replaces |
|-----------|---------|----------|
| `EnhancedPurpleGlassButton` | All interactive buttons | `PurpleGlassButton`, native `<button>` |
| `EnhancedPurpleGlassSearchBar` | All search inputs | `GlassmorphicSearchBar`, custom inputs |

Legacy components remain available for backward compatibility but should be migrated.

### Component Statistics

- **10 Core Components**: Enhanced Button, Enhanced Search, Input, Textarea, Dropdown, Checkbox, Radio, Switch, Card, + legacy
- **7 Button Variants**: Primary, Secondary, Danger, Success, Info, Ghost, Link
- **Zero TypeScript Errors**: Strict mode compliance
- **100+ Visual Variants**: Comprehensive styling options

### Design Token Integration

All components use the design token system from `frontend/src/styles/design-tokens.ts`:

```typescript
import { tokens } from '@fluentui/react-components';

// Color tokens
tokens.colorBrandBackground
tokens.colorNeutralForeground1
tokens.colorPaletteRedBorder1

// Spacing tokens
tokens.spacingHorizontalS
tokens.spacingVerticalM

// Typography tokens
tokens.fontFamilyBase
tokens.fontSizeBase300

// Animation tokens
tokens.durationNormal
tokens.curveEasyEase

// Shadow tokens
tokens.shadow16
tokens.borderRadiusMedium
```

---

## Installation & Setup

### Import Components

All components are exported from a central barrel file:

```typescript
// ✅ PREFERRED: Enhanced Components (use these for all new code)
import { 
  EnhancedPurpleGlassButton,
  EnhancedPurpleGlassSearchBar,
} from '@/components/ui';

// Other Components
import { 
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  PurpleGlassCheckbox,
  PurpleGlassRadio,
  PurpleGlassRadioGroup,
  PurpleGlassSwitch,
  PurpleGlassCard
} from '@/components/ui';

// ⚠️ DEPRECATED: Legacy components (migrate away from these)
import { 
  PurpleGlassButton,  // Use EnhancedPurpleGlassButton instead
} from '@/components/ui';
```

### Type Imports

```typescript
import type {
  EnhancedPurpleGlassButtonProps,
  EnhancedPurpleGlassSearchBarProps,
  ButtonVariant,
  ButtonSize,
  GlassVariant,
  ValidationState
} from '@/components/ui';
```

---

## Design Principles

### 1. Yoga Perdana Hue-Shift Gradients (NEW)

The Enhanced components use Yoga Perdana's design philosophy:

- **Constant Brightness**: Gradients shift HUE, not brightness (accessibility-compliant)
- **Subtle Movement**: 12-second idle animation, 6-second on hover
- **Frosted Glass**: `backdrop-filter: blur(20px) saturate(180%)`
- **Apple-style Edges**: No border artifacts, clean transitions
- **Respects Motion Preferences**: Disables animation when `prefers-reduced-motion` is set

### 2. Glass Variants

All form components support 4 glassmorphism levels:

```typescript
type GlassVariant = 'none' | 'light' | 'medium' | 'heavy';
```

- **none** (default): Solid background, standard Fluent UI appearance
- **light**: Subtle translucency with light blur
- **medium**: Moderate glassmorphism, recommended for most use cases
- **heavy**: Strong glass effect with heavy blur

### 3. Validation States

All form components support 4 validation states:

```typescript
type ValidationState = 'default' | 'error' | 'warning' | 'success';
```

- **default**: Normal state
- **error**: Red border, error color scheme
- **warning**: Yellow/orange border, warning color scheme
- **success**: Green border, success color scheme

### 4. Consistent Props

All components follow these patterns:

- `label?: string` - Descriptive label above component
- `helperText?: string` - Helper/error text below component
- `disabled?: boolean` - Disabled state
- `required?: boolean` - Adds asterisk to label
- `glass?: GlassVariant` - Glassmorphism level
- `validationState?: ValidationState` - Validation appearance

---

## Enhanced Components (Standard) ⭐

These are the **required** components for all new development.

### EnhancedPurpleGlassButton

Premium button with animated hue-shift gradients, 7 variants, and full accessibility.

#### Import

```typescript
import { EnhancedPurpleGlassButton } from '@/components/ui';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'success' \| 'info' \| 'ghost' \| 'link'` | `'primary'` | Visual style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size (6/8/10px radius) |
| `animated` | `boolean` | `true` | Enable gradient shimmer animation |
| `loading` | `boolean` | `false` | Show spinner, disable interaction |
| `disabled` | `boolean` | `false` | Disable button |
| `icon` | `ReactNode` | - | Icon before text |
| `iconEnd` | `ReactNode` | - | Icon after text |
| `fullWidth` | `boolean` | `false` | Stretch to container width |
| `elevated` | `boolean` | `false` | Add shadow elevation |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |

#### Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| `primary` | Purple → Indigo gradient | Primary CTAs (Save, Submit, Confirm) |
| `secondary` | White frosted glass | Secondary actions (Cancel, Back) |
| `danger` | Red → Coral gradient | Destructive actions (Delete, Remove) |
| `success` | Sea Green → Cyan gradient | Positive confirmations (Complete, Approve) |
| `info` | Blue → Indigo gradient | Informational actions (Learn More, Help) |
| `ghost` | Transparent + `mix-blend-mode: difference` | Subtle/tertiary actions |
| `link` | Text-only underline | Navigation, inline links |

#### Examples

```tsx
// Primary action with icon
<EnhancedPurpleGlassButton 
  variant="primary" 
  icon={<SaveRegular />}
  onClick={handleSave}
>
  Save Changes
</EnhancedPurpleGlassButton>

// Danger button for delete
<EnhancedPurpleGlassButton 
  variant="danger" 
  icon={<DeleteRegular />}
  onClick={handleDelete}
>
  Delete Project
</EnhancedPurpleGlassButton>

// Loading state
<EnhancedPurpleGlassButton loading disabled>
  Saving...
</EnhancedPurpleGlassButton>

// Ghost button (auto-inverts text based on background)
<EnhancedPurpleGlassButton variant="ghost">
  Learn More
</EnhancedPurpleGlassButton>

// Success confirmation
<EnhancedPurpleGlassButton variant="success" icon={<CheckmarkRegular />}>
  Approve Request
</EnhancedPurpleGlassButton>

// Full-width submit
<EnhancedPurpleGlassButton 
  variant="primary" 
  fullWidth 
  type="submit"
>
  Create Account
</EnhancedPurpleGlassButton>
```

#### Interaction States

All buttons have 5 states with smooth 0.4s transitions:

1. **Default**: Base appearance with 12s subtle shimmer animation
2. **Hover**: Slight lift (`translateY(-1px)`), increased opacity, 6s shimmer
3. **Active**: Press down (`scale(0.98)`), slightly darker
4. **Focus**: 2px purple outline with 2px offset (keyboard navigation)
5. **Disabled**: 50% opacity, no pointer events

#### Accessibility

- Full keyboard navigation (Tab, Enter, Space)
- Focus visible outline (WCAG 2.2 compliant)
- Respects `prefers-reduced-motion`
- Screen reader friendly

---

### EnhancedPurpleGlassSearchBar

Premium search input with frosted glass and purple focus glow.

#### Import

```typescript
import { EnhancedPurpleGlassSearchBar } from '@/components/ui';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Controlled input value |
| `onChange` | `(value: string) => void` | - | Value change handler |
| `onSubmit` | `() => void` | - | Enter key handler |
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `showClearButton` | `boolean` | `true` | Show X button to clear |
| `ariaLabel` | `string` | - | Accessibility label |

#### States

| State | Visual | Description |
|-------|--------|-------------|
| **Idle** | Subtle white border (12% opacity) | Neutral frosted glass |
| **Hover** | Brighter border (20% opacity) | Slight glow on approach |
| **Focus** | Purple border + glow | `border-color: rgba(111, 91, 235, 0.6)` with outer glow |

#### Example

```tsx
const [searchTerm, setSearchTerm] = useState('');

<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onSubmit={() => performSearch(searchTerm)}
  placeholder="Search tickets, assets, or users..."
  showClearButton
  ariaLabel="Search the knowledge base"
/>
```

#### Design Details

- **Frosted Glass**: `backdrop-filter: blur(20px) saturate(150%)`
- **Idle Border**: `rgba(255, 255, 255, 0.12)` (nearly invisible)
- **Focus Border**: `rgba(111, 91, 235, 0.6)` with outer glow
- **Text**: Pure white `#ffffff` 
- **Placeholder**: 70% white opacity
- **Clear Button**: Subtle white, brightens on hover

---

## Legacy Components

> ⚠️ **Deprecation Notice**: These components are maintained for backward compatibility.
> New development should use `EnhancedPurpleGlassButton` and `EnhancedPurpleGlassSearchBar`.

### PurpleGlassButton (Legacy)

Standardized button component with 5 variants, 3 sizes, and glassmorphism support.

#### Basic Usage

```typescript
import { PurpleGlassButton } from '@/components/ui';

<PurpleGlassButton onClick={handleClick}>
  Click Me
</PurpleGlassButton>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'link'` | `'primary'` | Button style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `loading` | `boolean` | `false` | Shows spinner |
| `icon` | `ReactNode` | - | Icon element |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Icon placement |
| `fullWidth` | `boolean` | `false` | Full container width |
| `elevated` | `boolean` | `false` | Adds shadow elevation |

#### Examples

```typescript
// Primary button with glass effect
<PurpleGlassButton variant="primary" glass="medium">
  Save Changes
</PurpleGlassButton>

// Large danger button with icon
<PurpleGlassButton 
  variant="danger" 
  size="large"
  icon={<DeleteRegular />}
>
  Delete Project
</PurpleGlassButton>

// Loading state
<PurpleGlassButton loading disabled>
  Saving...
</PurpleGlassButton>

// Ghost button with elevated shadow
<PurpleGlassButton variant="ghost" elevated>
  Learn More
</PurpleGlassButton>

// Full width link button
<PurpleGlassButton variant="link" fullWidth>
  View All Projects →
</PurpleGlassButton>
```

#### Visual Variants

- **30 Total Combinations**: 5 variants × 3 sizes × 2 (glass/normal)
- **Primary**: Bold purple background, white text
- **Secondary**: Gray background, dark text
- **Danger**: Red background for destructive actions
- **Ghost**: Transparent background, border only
- **Link**: Text-only, no background

#### Button Type Reference

| Button Type | Recommended Usage | `useButtonStyles` Classes | Token Highlights |
|-------------|-------------------|---------------------------|------------------|
| Primary     | High-emphasis actions (save, confirm) | `button`, `primary` / `primaryGlass` | `components.button.primary` gradient, brand focus outline |
| Secondary   | Medium-emphasis actions, secondary choices | `button`, `secondary` / `secondaryGlass` | Neutral base with `colorBrandPrimary` text accents |
| Danger      | Destructive or irreversible actions | `button`, `danger` | `colorStatusDanger` ramp + stronger shadow |
| Ghost       | Low-emphasis inline actions | `button`, `ghost` / `ghostGlass` | Transparent backdrop with subtle hover tint |
| Link        | Textual navigation or tertiary actions | `button`, `link` | Underline-only, no background |

- **Sizing Classes**: stack `small`, `medium`, or `large` with the variant class.
- **State Helpers**: append `loading`, `disabled`, or `elevated` to reflect async or high-visibility states.
- **Icon Utilities**: add `iconOnly`, `iconStart`, or `iconEnd` when rendering glyphs beside button copy.

---

### PurpleGlassInput

Text input component with validation states, icons, and glassmorphism.

#### Basic Usage

```typescript
import { PurpleGlassInput } from '@/components/ui';

<PurpleGlassInput 
  label="Project Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `helperText` | `string` | - | Helper/error text |
| `placeholder` | `string` | - | Placeholder text |
| `validationState` | `ValidationState` | `'default'` | Validation appearance |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `required` | `boolean` | `false` | Adds asterisk to label |
| `disabled` | `boolean` | `false` | Disabled state |
| `prefixIcon` | `ReactNode` | - | Icon before input |
| `suffixIcon` | `ReactNode` | - | Icon after input |
| `type` | `string` | `'text'` | HTML input type |

#### Examples

```typescript
// Basic input with validation
<PurpleGlassInput 
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validationState={emailError ? 'error' : 'default'}
  helperText={emailError || 'Enter your email'}
  required
/>

// Input with glass effect and icons
<PurpleGlassInput 
  label="Search"
  placeholder="Search projects..."
  prefixIcon={<SearchRegular />}
  glass="medium"
/>

// Number input with suffix
<PurpleGlassInput 
  label="CPU Cores"
  type="number"
  value={cores}
  onChange={(e) => setCores(e.target.value)}
  suffixIcon={<span>cores</span>}
  helperText="Number of CPU cores to allocate"
/>

// Success state
<PurpleGlassInput 
  label="Username"
  value={username}
  validationState="success"
  helperText="Username is available!"
/>
```

#### Visual Variants

- **16 Total Combinations**: 4 glass levels × 4 validation states
- Prefix/suffix icon support
- Required indicator (asterisk)
- Hover and focus states with Fluent motion

---

### PurpleGlassTextarea

Multi-line text input with auto-resize and character counting.

#### Basic Usage

```typescript
import { PurpleGlassTextarea } from '@/components/ui';

<PurpleGlassTextarea 
  label="Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  maxLength={500}
  showCharacterCount
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `helperText` | `string` | - | Helper/error text |
| `validationState` | `ValidationState` | `'default'` | Validation appearance |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `required` | `boolean` | `false` | Adds asterisk |
| `autoResize` | `boolean` | `false` | Auto-resize height |
| `maxLength` | `number` | - | Character limit |
| `showCharacterCount` | `boolean` | `false` | Show count display |
| `warningThreshold` | `number` | `0.8` | Warning at % of max |
| `rows` | `number` | - | Initial row count |

#### Examples

```typescript
// Auto-resizing textarea with character count
<PurpleGlassTextarea 
  label="Project Description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  autoResize
  maxLength={1000}
  showCharacterCount
  glass="light"
  helperText="Describe your migration project"
/>

// Error state with validation
<PurpleGlassTextarea 
  label="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  validationState="error"
  helperText="Notes cannot be empty"
  required
/>

// Large textarea with fixed height
<PurpleGlassTextarea 
  label="Comments"
  value={comments}
  onChange={(e) => setComments(e.target.value)}
  rows={10}
  placeholder="Enter your comments..."
/>
```

#### Features

- **Auto-resize**: Dynamically adjusts height based on content
- **Character Count**: Shows current/max with warning/error states
- **Warning States**: Yellow at 80%, red at 100% of maxLength

---

### PurpleGlassDropdown

Comprehensive dropdown/select component with single/multi-select, search, and portal rendering.

#### Basic Usage

```typescript
import { PurpleGlassDropdown, DropdownOption } from '@/components/ui';

const options: DropdownOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' }
];

<PurpleGlassDropdown 
  label="Select Option"
  options={options}
  value={selected}
  onChange={(value) => setSelected(value as string)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `helperText` | `string` | - | Helper/error text |
| `placeholder` | `string` | `'Select an option...'` | Placeholder |
| `validationState` | `ValidationState` | `'default'` | Validation appearance |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `required` | `boolean` | `false` | Adds asterisk |
| `disabled` | `boolean` | `false` | Disabled state |
| `multiSelect` | `boolean` | `false` | Enable multi-select |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `options` | `DropdownOption[]` | `[]` | Array of options |
| `value` | `string \| string[]` | - | Selected value(s) |
| `onChange` | `(value) => void` | - | Change handler |
| `renderOption` | `(option, isSelected) => ReactNode` | - | Custom option renderer |
| `renderValue` | `(value) => ReactNode` | - | Custom value renderer |
| `emptyText` | `string` | `'No options found'` | Empty state text |

#### Examples

```typescript
// Basic single-select
<PurpleGlassDropdown 
  label="Cluster Strategy"
  options={[
    { value: 'lift-shift', label: 'Lift & Shift' },
    { value: 'replatform', label: 'Replatform' },
    { value: 'refactor', label: 'Refactor' }
  ]}
  value={strategy}
  onChange={(value) => setStrategy(value as string)}
  glass="medium"
/>

// Multi-select with search
<PurpleGlassDropdown 
  label="Select Tags"
  options={tagOptions}
  value={selectedTags}
  onChange={(value) => setSelectedTags(value as string[])}
  multiSelect
  searchable
  searchPlaceholder="Search tags..."
  helperText="Select one or more tags"
/>

// With icons
<PurpleGlassDropdown 
  label="Hardware Type"
  options={[
    { 
      value: 'compute', 
      label: 'Compute Server',
      icon: <ServerRegular />
    },
    { 
      value: 'storage', 
      label: 'Storage Server',
      icon: <DatabaseRegular />
    }
  ]}
  value={hardwareType}
  onChange={(value) => setHardwareType(value as string)}
/>

// Disabled options
<PurpleGlassDropdown 
  label="Availability Zone"
  options={[
    { value: 'us-east-1a', label: 'US East 1A' },
    { value: 'us-east-1b', label: 'US East 1B', disabled: true },
    { value: 'us-west-2a', label: 'US West 2A' }
  ]}
  value={zone}
  onChange={(value) => setZone(value as string)}
/>
```

#### Features

- **Portal Rendering**: Menu rendered with fixed positioning, doesn't overflow
- **Click-Outside Detection**: Automatically closes when clicking outside
- **Multi-Select Tags**: Removable tags for selected items in multi-select mode
- **Search/Filter**: Real-time filtering of options
- **Keyboard Navigation**: Full keyboard support (Arrow keys, Enter, Escape)

---

### PurpleGlassCheckbox

Checkbox component with indeterminate state support.

#### Basic Usage

```typescript
import { PurpleGlassCheckbox } from '@/components/ui';

<PurpleGlassCheckbox 
  label="I accept the terms and conditions"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `helperText` | `string` | - | Helper/error text |
| `validationState` | `ValidationState` | `'default'` | Validation appearance |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `checked` | `boolean` | `false` | Checked state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `disabled` | `boolean` | `false` | Disabled state |
| `onChange` | `(e) => void` | - | Change handler |

#### Examples

```typescript
// Basic checkbox
<PurpleGlassCheckbox 
  label="Enable notifications"
  checked={notificationsEnabled}
  onChange={(e) => setNotificationsEnabled(e.target.checked)}
/>

// Select all checkbox (indeterminate)
<PurpleGlassCheckbox 
  label="Select All"
  checked={allSelected}
  indeterminate={someSelected}
  onChange={handleSelectAll}
  glass="light"
/>

// Validation states
<PurpleGlassCheckbox 
  label="I agree to the terms"
  checked={agreedToTerms}
  onChange={(e) => setAgreedToTerms(e.target.checked)}
  validationState={!agreedToTerms ? 'error' : 'success'}
  helperText={!agreedToTerms ? 'You must agree to continue' : 'Thank you!'}
  required
/>

// Disabled checkbox
<PurpleGlassCheckbox 
  label="Premium features (coming soon)"
  checked={false}
  disabled
  helperText="Available in the next release"
/>
```

#### Features

- **Indeterminate State**: For "select all" scenarios where some items are selected
- **Smooth Animations**: Checkmark scales in/out with Fluent motion curves
- **Accessibility**: Hidden native input for keyboard/screen reader support

---

### PurpleGlassRadio

Radio button component with RadioGroup context and card variant.

#### Basic Usage

```typescript
import { 
  PurpleGlassRadio, 
  PurpleGlassRadioGroup 
} from '@/components/ui';

<PurpleGlassRadioGroup 
  label="Select Migration Type"
  value={migrationType}
  onChange={(value) => setMigrationType(value)}
>
  <PurpleGlassRadio value="lift-shift" label="Lift & Shift" />
  <PurpleGlassRadio value="replatform" label="Replatform" />
  <PurpleGlassRadio value="refactor" label="Refactor" />
</PurpleGlassRadioGroup>
```

#### RadioGroup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Group label |
| `helperText` | `string` | - | Group helper text |
| `required` | `boolean` | `false` | Group required |
| `name` | `string` | - | Radio name attribute |
| `value` | `string` | - | Selected value |
| `onChange` | `(value) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disable all radios |
| `glass` | `GlassVariant` | `'none'` | Glass for all radios |
| `validationState` | `ValidationState` | `'default'` | Validation for group |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction |

#### Radio Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Radio value (required) |
| `label` | `string` | - | Label text |
| `helperText` | `string` | - | Helper text |
| `glass` | `GlassVariant` | - | Override group glass |
| `cardVariant` | `boolean` | `false` | Use card style |
| `cardTitle` | `string` | - | Card title |
| `cardDescription` | `string` | - | Card description |
| `disabled` | `boolean` | - | Override group disabled |

#### Examples

```typescript
// Horizontal radio group
<PurpleGlassRadioGroup 
  label="Hardware Type"
  value={hardwareType}
  onChange={(value) => setHardwareType(value)}
  orientation="horizontal"
  glass="light"
>
  <PurpleGlassRadio value="compute" label="Compute" />
  <PurpleGlassRadio value="storage" label="Storage" />
  <PurpleGlassRadio value="network" label="Network" />
</PurpleGlassRadioGroup>

// Card variant for wizards
<PurpleGlassRadioGroup 
  label="Select a Strategy"
  value={strategy}
  onChange={(value) => setStrategy(value)}
  required
>
  <PurpleGlassRadio 
    value="lift-shift"
    cardVariant
    cardTitle="Lift & Shift"
    cardDescription="Move applications as-is to the cloud with minimal changes"
  />
  <PurpleGlassRadio 
    value="replatform"
    cardVariant
    cardTitle="Replatform"
    cardDescription="Make minor optimizations to leverage cloud capabilities"
  />
  <PurpleGlassRadio 
    value="refactor"
    cardVariant
    cardTitle="Refactor"
    cardDescription="Redesign application architecture for cloud-native benefits"
  />
</PurpleGlassRadioGroup>

// With validation
<PurpleGlassRadioGroup 
  label="Deployment Environment"
  value={environment}
  onChange={(value) => setEnvironment(value)}
  validationState={!environment ? 'error' : 'success'}
  helperText={!environment ? 'Please select an environment' : 'Environment selected'}
  required
>
  <PurpleGlassRadio value="dev" label="Development" />
  <PurpleGlassRadio value="staging" label="Staging" />
  <PurpleGlassRadio value="production" label="Production" />
</PurpleGlassRadioGroup>
```

#### Features

- **Context-Based**: RadioGroup provides context to all child Radio components
- **Card Variant**: Large clickable cards perfect for wizard steps
- **Inner Dot Animation**: Smooth scale animation for selected indicator
- **Full Group Control**: Disable all radios, set glass/validation for entire group

---

### PurpleGlassSwitch

Toggle switch component with label positioning.

#### Basic Usage

```typescript
import { PurpleGlassSwitch } from '@/components/ui';

<PurpleGlassSwitch 
  label="Enable dark mode"
  checked={darkMode}
  onChange={(e) => setDarkMode(e.target.checked)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `helperText` | `string` | - | Helper/error text |
| `validationState` | `ValidationState` | `'default'` | Validation appearance |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `labelPosition` | `'before' \| 'after'` | `'after'` | Label placement |
| `checked` | `boolean` | `false` | Checked state |
| `disabled` | `boolean` | `false` | Disabled state |
| `onChange` | `(e) => void` | - | Change handler |

#### Examples

```typescript
// Basic switch
<PurpleGlassSwitch 
  label="Enable notifications"
  checked={notificationsEnabled}
  onChange={(e) => setNotificationsEnabled(e.target.checked)}
/>

// Label before switch
<PurpleGlassSwitch 
  label="Auto-save"
  labelPosition="before"
  checked={autoSave}
  onChange={(e) => setAutoSave(e.target.checked)}
  glass="medium"
/>

// With helper text
<PurpleGlassSwitch 
  label="Two-factor authentication"
  checked={twoFactorEnabled}
  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
  helperText="Adds an extra layer of security to your account"
/>

// Disabled switch
<PurpleGlassSwitch 
  label="Advanced features"
  checked={false}
  disabled
  helperText="Upgrade to Pro to unlock advanced features"
/>
```

#### Features

- **Sliding Thumb**: Smooth translateX animation for thumb
- **role="switch"**: Proper ARIA role for accessibility
- **Label Positioning**: Flexible label placement (before/after)

---

### PurpleGlassCard

Versatile card container with header, body, footer sections and interactive states.

#### Basic Usage

```typescript
import { PurpleGlassCard } from '@/components/ui';

<PurpleGlassCard>
  <p>Card content goes here</p>
</PurpleGlassCard>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'interactive' \| 'elevated' \| 'outlined' \| 'subtle'` | `'default'` | Card style variant |
| `glass` | `GlassVariant` | `'none'` | Glassmorphism effect |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Internal padding |
| `header` | `ReactNode \| string` | - | Header content/title |
| `headerActions` | `ReactNode` | - | Header action buttons |
| `body` | `ReactNode` | - | Body content (or use children) |
| `footer` | `ReactNode` | - | Footer content |
| `children` | `ReactNode` | - | Card content (body) |
| `onClick` | `() => void` | - | Click handler (auto-enables interactive) |
| `selected` | `boolean` | `false` | Selected state |
| `loading` | `boolean` | `false` | Loading skeleton |
| `disabled` | `boolean` | `false` | Disabled state |

#### Examples

```typescript
// Simple card
<PurpleGlassCard header="Project Information">
  <p>This project migrates 500 VMs to the cloud.</p>
</PurpleGlassCard>

// Interactive card with glass effect
<PurpleGlassCard 
  variant="interactive"
  glass="medium"
  header="Click Me"
  onClick={() => console.log('Card clicked')}
>
  <p>This card is clickable</p>
</PurpleGlassCard>

// Card with header actions
<PurpleGlassCard 
  header="Server Details"
  headerActions={
    <>
      <PurpleGlassButton variant="ghost" size="small" icon={<EditRegular />} />
      <PurpleGlassButton variant="ghost" size="small" icon={<DeleteRegular />} />
    </>
  }
>
  <p>Server: prod-web-01</p>
  <p>Status: Running</p>
</PurpleGlassCard>

// Card with footer
<PurpleGlassCard 
  header="Migration Plan"
  body={<p>Plan details go here...</p>}
  footer={
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <PurpleGlassButton variant="secondary">Cancel</PurpleGlassButton>
      <PurpleGlassButton variant="primary">Approve</PurpleGlassButton>
    </div>
  }
  glass="light"
/>

// Loading skeleton
<PurpleGlassCard loading padding="large">
  <p>This content is hidden while loading</p>
</PurpleGlassCard>

// Selected state (for lists)
<PurpleGlassCard 
  header="Option A"
  selected={selectedOption === 'a'}
  onClick={() => setSelectedOption('a')}
  variant="interactive"
>
  <p>Choose this option</p>
</PurpleGlassCard>
```

#### Visual Variants

- **40 Total Combinations**: 5 variants × 2 (glass/normal) × 4 padding levels
- **default**: Standard card with border
- **interactive**: Hover/focus effects, clickable
- **elevated**: Raised shadow, premium feel
- **outlined**: Prominent border
- **subtle**: Minimal styling

#### Features

- **Auto-Interactive**: Automatically becomes interactive when `onClick` is provided
- **Keyboard Navigation**: Enter/Space triggers click when interactive
- **Structured Sections**: Header (title + actions), body, footer
- **Loading Skeleton**: Shimmer animation while loading
- **ARIA Support**: Proper role, tabIndex, aria-disabled when interactive

---

## Common Patterns

### Form Validation

```typescript
// Validation state based on form errors
<PurpleGlassInput 
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validationState={
    emailError ? 'error' : 
    email && isValidEmail(email) ? 'success' : 
    'default'
  }
  helperText={emailError || 'Enter your email address'}
  required
/>
```

### Controlled Components

```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  strategy: '',
  enableNotifications: false
});

<PurpleGlassInput 
  label="Name"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
/>

<PurpleGlassTextarea 
  label="Description"
  value={formData.description}
  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
/>

<PurpleGlassDropdown 
  label="Strategy"
  options={strategyOptions}
  value={formData.strategy}
  onChange={(value) => setFormData({ ...formData, strategy: value as string })}
/>

<PurpleGlassSwitch 
  label="Enable Notifications"
  checked={formData.enableNotifications}
  onChange={(e) => setFormData({ ...formData, enableNotifications: e.target.checked })}
/>
```

### Wizard Steps with Radio Cards

```typescript
<PurpleGlassRadioGroup 
  label="Choose Your Migration Strategy"
  value={selectedStrategy}
  onChange={(value) => setSelectedStrategy(value)}
  required
>
  {strategies.map(strategy => (
    <PurpleGlassRadio 
      key={strategy.id}
      value={strategy.id}
      cardVariant
      cardTitle={strategy.title}
      cardDescription={strategy.description}
    />
  ))}
</PurpleGlassRadioGroup>
```

### Glass Effect Consistency

```typescript
// Apply same glass level across related components
const GLASS_LEVEL: GlassVariant = 'medium';

<PurpleGlassCard glass={GLASS_LEVEL}>
  <PurpleGlassInput glass={GLASS_LEVEL} label="Name" />
  <PurpleGlassDropdown glass={GLASS_LEVEL} label="Type" options={options} />
  <PurpleGlassButton glass={GLASS_LEVEL} variant="primary">Submit</PurpleGlassButton>
</PurpleGlassCard>
```

### Multi-Step Form Navigation

```typescript
<div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
  <PurpleGlassButton 
    variant="secondary"
    onClick={handleBack}
    disabled={currentStep === 0}
  >
    Back
  </PurpleGlassButton>
  
  <PurpleGlassButton 
    variant="primary"
    onClick={handleNext}
    loading={isSubmitting}
  >
    {currentStep === totalSteps - 1 ? 'Submit' : 'Next'}
  </PurpleGlassButton>
</div>
```

---

## Accessibility

All components are built with accessibility as a priority:

### Keyboard Navigation

- **Tab**: Navigate between focusable elements
- **Enter/Space**: Activate buttons, checkboxes, radios, switches
- **Arrow Keys**: Navigate dropdown options, radio groups
- **Escape**: Close dropdowns

### Screen Reader Support

- **ARIA Labels**: `aria-label`, `aria-labelledby` on all interactive elements
- **ARIA States**: `aria-checked`, `aria-selected`, `aria-expanded`, `aria-invalid`
- **ARIA Descriptions**: `aria-describedby` links to helper text
- **Role Attributes**: `role="switch"`, `role="listbox"`, `role="option"`, etc.

### Focus Management

- **Focus Visible**: Prominent outline with `tokens.colorBrandStroke1`
- **Focus Trap**: Dropdowns manage focus within menu
- **Skip to Content**: Keyboard users can navigate efficiently

### Color Contrast

- **WCAG AA Compliant**: All text meets minimum 4.5:1 contrast ratio
- **Non-Color Indicators**: Validation not solely reliant on color (icons, borders)
- **High Contrast Mode**: Components work in Windows high contrast mode

---

## TypeScript Support

All components are fully typed with exported interfaces:

```typescript
import type {
  // Button
  PurpleGlassButtonProps,
  ButtonVariant,
  ButtonSize,
  
  // Input/Textarea
  PurpleGlassInputProps,
  PurpleGlassTextareaProps,
  
  // Dropdown
  PurpleGlassDropdownProps,
  DropdownOption,
  
  // Checkbox/Radio/Switch
  PurpleGlassCheckboxProps,
  PurpleGlassRadioProps,
  PurpleGlassRadioGroupProps,
  PurpleGlassSwitchProps,
  
  // Card
  PurpleGlassCardProps,
  CardVariant,
  CardPadding,
  
  // Shared
  GlassVariant,
  ValidationState
} from '@/components/ui';
```

### Generic Type Definitions

```typescript
// Shared across multiple components
export type GlassVariant = 'none' | 'light' | 'medium' | 'heavy';
export type ValidationState = 'default' | 'error' | 'warning' | 'success';

// Button-specific
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

// Card-specific
export type CardVariant = 'default' | 'interactive' | 'elevated' | 'outlined' | 'subtle';
export type CardPadding = 'none' | 'small' | 'medium' | 'large';
```

### Component Prop Inheritance

All components properly extend native HTML props:

```typescript
// Button extends native button
export interface PurpleGlassButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // ...custom props
}

// Input extends native input
export interface PurpleGlassInputProps 
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  // ...custom props
}
```

### Ref Forwarding

All components support React ref forwarding:

```typescript
const inputRef = useRef<HTMLInputElement>(null);

<PurpleGlassInput 
  ref={inputRef}
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Access native element
inputRef.current?.focus();
```

---

## Best Practices

### 1. Always Use Design Tokens

❌ **Don't:**
```typescript
<div style={{ color: '#8b5cf6', padding: '16px' }}>
  Content
</div>
```

✅ **Do:**
```typescript
import { tokens } from '@fluentui/react-components';

<div style={{ 
  color: tokens.colorBrandForeground1, 
  padding: tokens.spacingHorizontalL 
}}>
  Content
</div>
```

### 2. Prefer Component Library Over Native Elements

❌ **Don't:**
```typescript
<button style={{ background: '#8b5cf6', color: 'white' }}>
  Click Me
</button>
```

✅ **Do:**
```typescript
<PurpleGlassButton variant="primary">
  Click Me
</PurpleGlassButton>
```

### 3. Use Consistent Glass Levels

❌ **Don't:**
```typescript
<PurpleGlassCard glass="light">
  <PurpleGlassInput glass="heavy" />
  <PurpleGlassButton glass="medium" />
</PurpleGlassCard>
```

✅ **Do:**
```typescript
const GLASS: GlassVariant = 'medium';

<PurpleGlassCard glass={GLASS}>
  <PurpleGlassInput glass={GLASS} />
  <PurpleGlassButton glass={GLASS} />
</PurpleGlassCard>
```

### 4. Provide Descriptive Labels and Helper Text

❌ **Don't:**
```typescript
<PurpleGlassInput 
  placeholder="Enter value"
  value={value}
  onChange={onChange}
/>
```

✅ **Do:**
```typescript
<PurpleGlassInput 
  label="Project Name"
  placeholder="e.g., Production Migration 2024"
  value={value}
  onChange={onChange}
  helperText="A descriptive name for your migration project"
  required
/>
```

### 5. Handle Loading and Disabled States

❌ **Don't:**
```typescript
<PurpleGlassButton onClick={handleSubmit}>
  Submit
</PurpleGlassButton>
```

✅ **Do:**
```typescript
<PurpleGlassButton 
  onClick={handleSubmit}
  loading={isSubmitting}
  disabled={!formValid || isSubmitting}
>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</PurpleGlassButton>
```

### 6. Use Validation States Appropriately

❌ **Don't:**
```typescript
<PurpleGlassInput 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
{emailError && <span style={{ color: 'red' }}>{emailError}</span>}
```

✅ **Do:**
```typescript
<PurpleGlassInput 
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  validationState={emailError ? 'error' : 'default'}
  helperText={emailError || 'Enter your email address'}
  required
/>
```

---

## Migration Guide

See [FORM_COMPONENTS_MIGRATION.md](./FORM_COMPONENTS_MIGRATION.md) for detailed before/after examples and step-by-step migration instructions.

---

## Support & Maintenance

### Component Library Metrics

- **Zero TypeScript Errors**: All components compile without errors in strict mode
- **100% Token Compliance**: No hardcoded values (colors, spacing, sizes)
- **Full Test Coverage**: All components validated through manual testing
- **Production Ready**: Used in activity wizard, cluster strategy, and project views

### Future Enhancements

Potential additions for v2.0:

- **PurpleGlassDatePicker**: Calendar-based date selection
- **PurpleGlassSlider**: Range input for numeric values
- **PurpleGlassTooltip**: Contextual information popover
- **PurpleGlassToast**: Notification system
- **PurpleGlassModal**: Already exists, integrate with library
- **PurpleGlassTabs**: Tabbed content navigation
- **PurpleGlassAccordion**: Collapsible content sections

---

## Migration Guide: PurpleGlassDropdown

### Overview

This section provides comprehensive guidance for migrating from native `<select>`, Fluent UI `<Dropdown>`, and custom dropdown components to `PurpleGlassDropdown`.

**Reference:** See `DROPDOWN_AUDIT_REPORT.md` for complete list of 54 dropdown instances across the codebase.

### Migration Patterns

#### Pattern 1: Native HTML `<select>` → PurpleGlassDropdown

**Before (Native Select):**
```tsx
<select 
  className="lcm-dropdown"
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
>
  <option value="">Select an option</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>
```

**After (PurpleGlassDropdown):**
```tsx
<PurpleGlassDropdown
  placeholder="Select an option"
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' }
  ]}
  value={selected}
  onChange={(value) => setSelected(value as string)}
  glass="medium"
/>
```

**Key Changes:**
- ✅ Convert `<option>` elements to `DropdownOption[]` array
- ✅ Change `onChange` handler signature: `(e) => ...` → `(value) => ...`
- ✅ Replace placeholder `<option>` with `placeholder` prop
- ✅ Add glassmorphism with `glass` prop
- ✅ Remove CSS class (styling handled internally)

---

#### Pattern 2: Fluent UI `<Dropdown>` → PurpleGlassDropdown

**Before (Fluent Dropdown):**
```tsx
import { Dropdown } from '@fluentui/react-components';

<Dropdown
  placeholder="Select strategy"
  selectedOptions={[strategy]}
  onOptionSelect={(e, data) => setStrategy(data.optionValue as string)}
>
  <Option value="lift-shift">Lift & Shift</Option>
  <Option value="replatform">Replatform</Option>
  <Option value="refactor">Refactor</Option>
</Dropdown>
```

**After (PurpleGlassDropdown):**
```tsx
import { PurpleGlassDropdown } from '@/components/ui';

<PurpleGlassDropdown
  placeholder="Select strategy"
  options={[
    { value: 'lift-shift', label: 'Lift & Shift' },
    { value: 'replatform', label: 'Replatform' },
    { value: 'refactor', label: 'Refactor' }
  ]}
  value={strategy}
  onChange={(value) => setStrategy(value as string)}
  glass="medium"
/>
```

**Key Changes:**
- ✅ Import from `@/components/ui` instead of `@fluentui/react-components`
- ✅ Convert `<Option>` children to `options` array
- ✅ Change `selectedOptions={[value]}` to `value={value}`
- ✅ Simplify `onOptionSelect` to `onChange`
- ✅ Remove Fluent-specific props (they're incompatible)

---

#### Pattern 3: Dropdowns with Loading States

**Before:**
```tsx
<Dropdown
  placeholder={isLoading ? "Loading clusters..." : "Select cluster"}
  selectedOptions={[cluster]}
  disabled={isLoading}
  onOptionSelect={(e, data) => setCluster(data.optionValue as string)}
>
  {clusters.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
</Dropdown>
```

**After:**
```tsx
<PurpleGlassDropdown
  placeholder={isLoading ? "Loading clusters..." : "Select cluster"}
  options={clusters.map(c => ({ value: c.id, label: c.name }))}
  value={cluster}
  onChange={(value) => setCluster(value as string)}
  disabled={isLoading}
  glass="medium"
/>
```

**Preserved Features:**
- ✅ Loading state indicators via `placeholder`
- ✅ Disabled state during loading
- ✅ Dynamic options from API data

---

#### Pattern 4: Multi-Select Dropdowns

**Before:**
```tsx
<Dropdown
  placeholder="Select tags"
  selectedOptions={selectedTags}
  multiselect
  onOptionSelect={(e, data) => {
    const newTags = data.selectedOptions;
    setSelectedTags(newTags);
  }}
>
  {tags.map(tag => <Option key={tag} value={tag}>{tag}</Option>)}
</Dropdown>
```

**After:**
```tsx
<PurpleGlassDropdown
  placeholder="Select tags"
  options={tags.map(tag => ({ value: tag, label: tag }))}
  value={selectedTags}
  onChange={(value) => setSelectedTags(value as string[])}
  multiSelect
  searchable
  glass="medium"
/>
```

**Key Changes:**
- ✅ Use `multiSelect` prop (camelCase, not lowercase)
- ✅ Value is `string[]` instead of `string`
- ✅ Built-in tag display with remove buttons
- ✅ Add `searchable` for better UX with many options

---

#### Pattern 5: Searchable/Filterable Dropdowns

**After (PurpleGlassDropdown with Search):**
```tsx
<PurpleGlassDropdown
  label="Select Server Model"
  placeholder="Search models..."
  options={serverModels.map(m => ({ 
    value: m.id, 
    label: `${m.vendor} ${m.model}` 
  }))}
  value={selectedModel}
  onChange={(value) => setSelectedModel(value as string)}
  searchable
  searchPlaceholder="Type to filter..."
  glass="medium"
/>
```

**Features:**
- ✅ Real-time client-side filtering
- ✅ Custom search placeholder
- ✅ Automatically focuses search input when opened
- ✅ Clears search when menu closes

---

### Common Pitfalls & Solutions

#### ❌ DON'T: Use array notation for single-select value

```tsx
// ❌ WRONG - This breaks single-select
<PurpleGlassDropdown
  value={[selected]}  // Array for single-select
  onChange={(value) => setSelected(value)}
/>
```

```tsx
// ✅ CORRECT - Use string for single-select
<PurpleGlassDropdown
  value={selected}  // String for single-select
  onChange={(value) => setSelected(value as string)}
/>
```

---

#### ❌ DON'T: Forget to type-cast onChange value

```tsx
// ❌ WRONG - TypeScript error: value could be string | string[] | undefined
<PurpleGlassDropdown
  value={selected}
  onChange={(value) => setSelected(value)}  // Type error
/>
```

```tsx
// ✅ CORRECT - Type-cast based on multiSelect
<PurpleGlassDropdown
  value={selected}
  onChange={(value) => setSelected(value as string)}  // Single-select
/>

<PurpleGlassDropdown
  multiSelect
  value={selectedTags}
  onChange={(value) => setSelectedTags(value as string[])}  // Multi-select
/>
```

---

#### ❌ DON'T: Mix Fluent and Purple Glass dropdowns

```tsx
// ❌ WRONG - Inconsistent UI
import { Dropdown } from '@fluentui/react-components';
import { PurpleGlassDropdown } from '@/components/ui';

<Dropdown />  // Different styling
<PurpleGlassDropdown />  // Glassmorphic purple theme
```

```tsx
// ✅ CORRECT - Consistent Purple Glass components
import { PurpleGlassDropdown } from '@/components/ui';

<PurpleGlassDropdown />
<PurpleGlassDropdown />
```

---

#### ❌ DON'T: Hardcode empty options

```tsx
// ❌ WRONG - Empty state handled poorly
<PurpleGlassDropdown
  options={data.length === 0 ? [{ value: '', label: 'No data' }] : data}
/>
```

```tsx
// ✅ CORRECT - Use emptyText prop
<PurpleGlassDropdown
  options={data}
  emptyText="No data available"
  searchable
/>
```

---

### Accessibility Best Practices

#### ✅ DO: Always provide labels

```tsx
<PurpleGlassDropdown
  label="Cluster Strategy"  // Screen readers announce this
  options={strategies}
  required  // Adds asterisk and aria-required
/>
```

#### ✅ DO: Use validation states with helper text

```tsx
<PurpleGlassDropdown
  label="Required Field"
  options={options}
  validationState={error ? 'error' : 'default'}
  helperText={error || 'Please select an option'}
  required
/>
```

#### ✅ DO: Support keyboard navigation

PurpleGlassDropdown automatically supports:
- **Enter/Space** - Open dropdown
- **Escape** - Close dropdown
- **Arrow keys** - Navigate options (in roadmap)
- **Tab** - Focus management

---

### Testing Recommendations

#### Unit Tests (Vitest)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PurpleGlassDropdown } from '@/components/ui';

test('selects option and calls onChange', async () => {
  const handleChange = vi.fn();
  render(
    <PurpleGlassDropdown
      options={[{ value: '1', label: 'Option 1' }]}
      onChange={handleChange}
    />
  );

  const trigger = screen.getByRole('button');
  await userEvent.click(trigger);
  
  const option = screen.getByRole('option', { name: 'Option 1' });
  await userEvent.click(option);
  
  expect(handleChange).toHaveBeenCalledWith('1');
});
```

**See:** `frontend/tests/unit/components/PurpleGlassDropdown.test.tsx` for 44 comprehensive tests.

#### E2E Tests (Playwright)

```tsx
test('dropdown interaction flow', async ({ page }) => {
  const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]').first();
  
  await dropdown.click();
  await expect(page.locator('[role="listbox"]')).toBeVisible();
  
  await page.locator('[role="option"]', { hasText: 'Option 1' }).click();
  await expect(dropdown).toContainText('Option 1');
});
```

**See:** `frontend/tests/e2e/purple-glass-dropdown.spec.ts` for E2E test templates.

---

### Troubleshooting

#### Issue: Dropdown menu appears behind other elements

**Solution:** The dropdown uses fixed positioning with a high z-index. If it still appears behind, check parent element stacking contexts:

```tsx
// Ensure parent doesn't create stacking context
// Remove: transform, filter, perspective, etc.
```

#### Issue: Click-outside doesn't close dropdown

**Solution:** This is handled automatically via `mousedown` events. Ensure your page doesn't stop event propagation:

```tsx
// ❌ DON'T stop propagation
<div onClick={(e) => e.stopPropagation()}>
  <PurpleGlassDropdown />
</div>

// ✅ DO allow events to bubble
<div>
  <PurpleGlassDropdown />
</div>
```

#### Issue: Search doesn't filter options

**Solution:** Ensure `searchable` prop is set and options have `label` property:

```tsx
<PurpleGlassDropdown
  searchable  // Required for search
  options={[
    { value: '1', label: 'Option 1' },  // 'label' is required
  ]}
/>
```

#### Issue: TypeScript errors with onChange

**Solution:** Type-cast the value based on single/multi-select mode:

```tsx
// Single-select
onChange={(value) => setSelected(value as string)}

// Multi-select
onChange={(value) => setTags(value as string[])}
```

---

### Performance Considerations

#### Large Option Lists (>100 items)

For dropdowns with many options, always enable search:

```tsx
<PurpleGlassDropdown
  options={largeDataset}  // 500+ items
  searchable  // Essential for usability
  searchPlaceholder="Type to filter..."
  glass="medium"
/>
```

#### Dynamic Options

When options change frequently, ensure proper React keys:

```tsx
const options = data.map(item => ({
  value: item.id,  // Stable key
  label: item.name
}));

<PurpleGlassDropdown options={options} />
```

---

### Glass Variant Guidelines

Choose the appropriate glass level for your context:

| Glass Level | Use Case | Visual Effect |
|-------------|----------|---------------|
| `none` | Dense forms, high information density | No glassmorphism |
| `light` | Subtle elevation, minimal distraction | Light blur + transparency |
| `medium` | Standard dropdowns, balanced aesthetics | ⭐ **Recommended default** |
| `heavy` | Hero sections, emphasized selections | Strong blur + depth |

**Example:**
```tsx
// Standard form dropdown
<PurpleGlassDropdown glass="medium" />

// Dense data grid filter
<PurpleGlassDropdown glass="none" />

// Hero section dropdown
<PurpleGlassDropdown glass="heavy" />
```

---

### Migration Checklist

When migrating each dropdown instance:

- [ ] ✅ Import `PurpleGlassDropdown` and `DropdownOption` from `@/components/ui`
- [ ] ✅ Convert options to `DropdownOption[]` array format
- [ ] ✅ Update `onChange` handler signature
- [ ] ✅ Set appropriate `glass` variant (default: `medium`)
- [ ] ✅ Add `label` for accessibility
- [ ] ✅ Preserve loading states (via `placeholder` + `disabled`)
- [ ] ✅ Preserve validation states (use `validationState` + `helperText`)
- [ ] ✅ Add `searchable` for lists with >10 items
- [ ] ✅ Update unit tests to use new component API
- [ ] ✅ Verify keyboard navigation works
- [ ] ✅ Test with screen reader (NVDA/JAWS)

---

## Version History

### v1.0.0 (October 18, 2025)

**Initial Release** - Complete component library

- ✅ PurpleGlassButton (493 lines)
- ✅ PurpleGlassInput (464 lines)
- ✅ PurpleGlassTextarea (440 lines)
- ✅ PurpleGlassDropdown (747 lines)
- ✅ PurpleGlassCheckbox (416 lines)
- ✅ PurpleGlassRadio (626 lines)
- ✅ PurpleGlassSwitch (383 lines)
- ✅ PurpleGlassCard (485 lines)

**Total:** 4,054 lines of component code + 486 lines of styles = 4,540 lines

---

## License

Internal use only - LCMDesigner project
© 2025 All rights reserved
