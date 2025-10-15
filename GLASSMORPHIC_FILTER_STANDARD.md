# Glassmorphic Filter Standard - Fluent UI v2 Design System

## Overview
This document defines the **absolute standard** for filter controls throughout the LCMDesigner application. All filter implementations must follow this glassmorphic design pattern to maintain consistency with the Fluent UI v2 aesthetic.

## Core Principles

### 1. **Glassmorphic Aesthetic**
- Transparent backgrounds with backdrop filters
- Multi-layered blur and saturation effects
- Soft borders with white overlay
- Smooth transitions and transforms
- Inset shadows for depth

### 2. **Consistent with Search Bar**
- Matches the `GlassmorphicSearchBar` component design language
- Same backdrop-filter intensity progression (60px → 70px → 80px blur)
- Same brightness and saturation curves
- Same transform animations

### 3. **Accessibility First**
- Clear visual states (default, hover, focus, active)
- Sufficient color contrast
- Semantic HTML elements
- Keyboard navigation support

---

## Standard Components

### Filter Select Dropdown (`glassmorphic-filter-select`)

**Usage:**
```tsx
<select
  value={filterValue}
  onChange={(e) => setFilterValue(e.target.value)}
  className="glassmorphic-filter-select"
  style={{ minWidth: '140px' }}
>
  <option value="all">All Items</option>
  <option value="option1">Option 1</option>
</select>
```

**Visual Characteristics:**
- Border radius: 20px (rounded-full appearance)
- Padding: 8px 32px 8px 14px (accommodates dropdown arrow)
- Font: Poppins, 14px, weight 500
- Backdrop filter: blur(60px) saturate(220%) brightness(115%)
- Custom dropdown arrow using SVG data URI
- Soft white border with transparency

**States:**
- **Default**: Transparent with 60px blur
- **Hover**: Increased to 70px blur, subtle lift (translateY(-1px))
- **Focus**: 80px blur, purple accent ring, more pronounced lift

**Where to Use:**
- Status filters
- Assignee/user selection
- Category/type filters
- Date range selectors
- Any dropdown filter control

---

### Filter Toggle Button (`glassmorphic-filter-button`)

**Usage:**
```tsx
<button
  onClick={() => handleToggle()}
  className={`glassmorphic-filter-button ${isActive ? 'glassmorphic-filter-button-active' : ''}`}
  title="Button Description"
>
  Icon/Text
</button>
```

**Visual Characteristics:**
- Border radius: 20px
- Padding: 8px 16px
- Font: Poppins, 12px, weight 600
- Backdrop filter: blur(60px) saturate(220%) brightness(115%)
- Soft white border with transparency

**States:**
- **Default**: Transparent glassmorphic with dark text
- **Hover**: 70px blur, scale(1.05), subtle lift
- **Active**: Purple gradient background, white text, purple accent ring
- **Active + Hover**: Intensified gradient, scale(1.08), enhanced shadow

**Where to Use:**
- Sort order toggles (Asc/Desc)
- View mode switches (List/Grid/Card)
- Binary filter options (Active/Inactive)
- Quick action buttons in filter bars

---

### Label Styling

**Standard Label Pattern:**
```tsx
<label 
  className="text-xs font-semibold whitespace-nowrap" 
  style={{ fontFamily: "'Poppins', sans-serif", color: '#1a202c' }}
>
  Label Text:
</label>
```

**Visual Characteristics:**
- Font: Poppins, 12px (text-xs), weight 600 (font-semibold)
- Color: #1a202c (dark slate)
- Always includes colon (:) suffix
- No-wrap to prevent awkward breaks

---

## Layout Patterns

### Compact Horizontal Filter Bar

**Recommended Structure:**
```tsx
<div className="flex flex-wrap items-center gap-3">
  {/* Filter 1 */}
  <div className="flex items-center gap-2">
    <label>Filter 1:</label>
    <select className="glassmorphic-filter-select">...</select>
  </div>
  
  {/* Filter 2 */}
  <div className="flex items-center gap-2">
    <label>Filter 2:</label>
    <select className="glassmorphic-filter-select">...</select>
  </div>
  
  {/* Toggle Buttons - Right Aligned */}
  <div className="flex items-center gap-1.5 ml-auto">
    <button className="glassmorphic-filter-button">Option A</button>
    <button className="glassmorphic-filter-button glassmorphic-filter-button-active">Option B</button>
  </div>
</div>
```

**Key Layout Principles:**
- Flexbox with wrap for responsive behavior
- 12px gap between filter groups (gap-3)
- 8px gap between label and control (gap-2)
- 6px gap between toggle buttons (gap-1.5)
- Use `ml-auto` to push toggle buttons to the right
- Vertical alignment with `items-center`

---

## CSS Classes Reference

### Core Classes

| Class | Purpose | Key Properties |
|-------|---------|----------------|
| `.glassmorphic-filter-select` | Dropdown filters | backdrop-filter, rounded-full, custom arrow |
| `.glassmorphic-filter-button` | Toggle/action buttons | backdrop-filter, hover lift, focus ring |
| `.glassmorphic-filter-button-active` | Active state for buttons | Purple gradient, white text, enhanced shadow |

### Animation Properties

All glassmorphic filter components use:
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Transform Progression

| State | Transform | Shadow Intensity |
|-------|-----------|------------------|
| Default | none | 0.08 opacity |
| Hover | `translateY(-1px) scale(1.02)` | 0.12 opacity |
| Focus | `translateY(-2px) scale(1.03)` | 0.16 opacity |
| Active | `translateY(-2px) scale(1.05)` | 0.30 opacity |
| Active Hover | `translateY(-2px) scale(1.08)` | 0.35 opacity |

---

## Responsive Behavior

### Mobile Breakpoint (< 640px)

```css
@media (max-width: 640px) {
  .glassmorphic-filter-select {
    padding: 6px 28px 6px 12px;
    font-size: 13px;
    border-radius: 16px;
  }
  
  .glassmorphic-filter-button {
    padding: 6px 12px;
    font-size: 11px;
    border-radius: 16px;
  }
}
```

**Mobile Adjustments:**
- Reduced padding for better touch targets
- Slightly smaller font sizes
- Less aggressive border radius
- Maintains same blur/saturation effects

---

## Implementation Checklist

When implementing filters in a new view, verify:

- [ ] Uses `glassmorphic-filter-select` class for all dropdowns
- [ ] Uses `glassmorphic-filter-button` for toggle/action buttons
- [ ] Labels follow standard styling (Poppins, semibold, dark color)
- [ ] Layout uses flexbox with proper gap spacing
- [ ] Toggle buttons pushed to right with `ml-auto`
- [ ] Active states properly applied with `glassmorphic-filter-button-active`
- [ ] No custom colors or borders that break the glassmorphic aesthetic
- [ ] Transitions and transforms match the standard
- [ ] Responsive breakpoints implemented for mobile
- [ ] Keyboard navigation works correctly
- [ ] ARIA labels added for accessibility

---

## Examples in Codebase

### Reference Implementation
**File:** `/frontend/src/views/ProjectWorkspaceView.tsx`  
**Location:** Timeline tab filter section (lines ~670-750)

This implementation demonstrates:
- ✅ Three glassmorphic select dropdowns (Status, Assignee, Sort)
- ✅ Two glassmorphic toggle buttons (Asc/Desc)
- ✅ Proper label styling and layout
- ✅ Responsive gap spacing
- ✅ Right-aligned toggle group

### Related Components
- `GlassmorphicSearchBar` - Search input matching this aesthetic
- `EnhancedCard` - Card component with same glassmorphic treatment

---

## Migration Guide

### From Old Style to Glassmorphic Standard

**Before (Old Style):**
```tsx
<select
  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
>
  <option>Option</option>
</select>

<button
  className="px-3 py-1.5 rounded-lg text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
>
  Button
</button>
```

**After (Glassmorphic Standard):**
```tsx
<select className="glassmorphic-filter-select">
  <option>Option</option>
</select>

<button className="glassmorphic-filter-button glassmorphic-filter-button-active">
  Button
</button>
```

**What to Remove:**
- ❌ Inline Tailwind classes for borders, backgrounds, colors
- ❌ Custom rounded corners (`rounded-lg`, `rounded-md`)
- ❌ Solid white backgrounds (`bg-white`)
- ❌ Manual focus ring styles
- ❌ Hard-coded gradient classes

**What to Keep:**
- ✅ Structural classes (`flex`, `items-center`, `gap-*`)
- ✅ Sizing hints (`minWidth` inline styles)
- ✅ Semantic HTML structure
- ✅ Event handlers and state management

---

## Design Tokens Integration

This standard uses the following design system tokens from `fluent-enhancements.css`:

```css
--fluent-font-family-base: 'Poppins', sans-serif
--lcm-primary: #8b5cf6 (purple)
--lcm-backdrop-filter: blur(18px) saturate(180%)
```

Backdrop filter progression:
- Base: `blur(60px) saturate(220%) brightness(115%)`
- Hover: `blur(70px) saturate(240%) brightness(120%)`
- Focus: `blur(80px) saturate(260%) brightness(125%)`

---

## Browser Compatibility

**Fully Supported:**
- Chrome 76+
- Edge 79+
- Safari 9+
- Firefox 103+

**Fallback Strategy:**
- Backdrop-filter has `-webkit-` prefix for older Safari
- Graceful degradation: filters still usable without blur effects

---

## Performance Considerations

- Backdrop filters are GPU-accelerated
- Transforms use `will-change: transform` implicitly
- Transitions use hardware-accelerated properties only
- No layout thrashing or reflow triggers
- Suitable for complex pages with multiple filter controls

---

## Future Enhancements

Planned additions to the standard:
- [ ] Multi-select glassmorphic dropdown variant
- [ ] Date range picker with glassmorphic styling
- [ ] Slider control for numeric range filters
- [ ] Chip-based tag filter component
- [ ] Filter preset/save functionality

---

## Questions or Issues?

If you encounter edge cases or need clarification on the standard, refer to:
1. The reference implementation in `ProjectWorkspaceView.tsx`
2. The CSS definitions in `fluent-enhancements.css` (lines 723-871)
3. The `GlassmorphicSearchBar` component for aesthetic alignment

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Status:** ✅ Approved as Absolute Standard
