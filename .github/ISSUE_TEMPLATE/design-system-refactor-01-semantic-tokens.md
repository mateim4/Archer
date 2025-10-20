---
name: "DS-01: Expand Design Tokens with Semantic Color System"
about: Add comprehensive semantic color tokens to eliminate hardcoded color values
title: "[DS-01] Expand Design Tokens with Semantic Color System"
labels: ["design-system", "tokens", "priority-high", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective

Expand the centralized design token system (`frontend/src/styles/design-tokens.ts`) to include comprehensive semantic color tokens for success, warning, error, and info states. This will eliminate the need for hardcoded color values throughout the codebase.

## 📋 Problem Statement

**Current State:**
- 3,130+ hardcoded color values (hex/rgba) scattered across 170 TypeScript files
- Inconsistent color usage for semantic states (success, warning, error, info)
- No centralized source of truth for status colors
- Components using inline styles with hardcoded colors like `#ef4444`, `#10b981`, etc.

**Examples of Current Violations:**
```tsx
// ❌ WRONG - Hardcoded color in ServerCard.tsx
<CheckmarkCircleRegular style={{ color: '#10b981' }} />

// ❌ WRONG - Hardcoded color in HardwareAssetFormNew.tsx
<div style={{ color: '#ef4444', fontSize: '12px' }}>Error message</div>

// ❌ WRONG - Hardcoded color in SimpleFileUpload.tsx
<span style={{ color: '#6b7280' }}>File info</span>
```

## 📖 Coding Guidelines Reference

**CRITICAL:** Follow the guidelines in `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

Key principles:
- ✅ **ALWAYS** use design tokens from `@/styles/design-tokens`
- ✅ **ALWAYS** rely on shared design tokens for spacing, color, typography, and shadows
- ❌ **NEVER** hardcode colors, spacing, or typography
- ❌ **NEVER** use local style overrides unless every shared token has been exhausted

## 🔧 Requirements

### 1. Expand `design-tokens.ts` with Semantic Tokens

Add the following structure to `frontend/src/styles/design-tokens.ts`:

```typescript
// ============================================================================
// SEMANTIC COLOR SYSTEM
// ============================================================================

const semanticColors = {
  // Success (Green) - For positive states, completed actions, healthy status
  success: {
    background: '#ecfdf5',        // Light green bg
    backgroundHover: '#d1fae5',   // Hover state
    foreground: '#065f46',        // Dark green text
    foregroundSubtle: '#10b981',  // Medium green for icons
    border: '#34d399',            // Green border
    borderSubtle: '#6ee7b7',      // Light green border
  },

  // Warning (Yellow/Orange) - For caution, in-progress states
  warning: {
    background: '#fffbeb',        // Light yellow bg
    backgroundHover: '#fef3c7',   // Hover state
    foreground: '#92400e',        // Dark orange text
    foregroundSubtle: '#f59e0b',  // Medium orange for icons
    border: '#fbbf24',            // Orange border
    borderSubtle: '#fcd34d',      // Light orange border
  },

  // Error (Red) - For errors, failures, critical states
  error: {
    background: '#fef2f2',        // Light red bg
    backgroundHover: '#fee2e2',   // Hover state
    foreground: '#991b1b',        // Dark red text
    foregroundSubtle: '#ef4444',  // Medium red for icons
    border: '#f87171',            // Red border
    borderSubtle: '#fca5a5',      // Light red border
  },

  // Info (Blue) - For informational states, pending actions
  info: {
    background: '#eff6ff',        // Light blue bg
    backgroundHover: '#dbeafe',   // Hover state
    foreground: '#1e40af',        // Dark blue text
    foregroundSubtle: '#3b82f6',  // Medium blue for icons
    border: '#60a5fa',            // Blue border
    borderSubtle: '#93c5fd',      // Light blue border
  },

  // Neutral - For inactive, disabled, or neutral states
  neutral: {
    background: '#f9fafb',        // Light gray bg
    backgroundHover: '#f3f4f6',   // Hover state
    foreground: '#374151',        // Dark gray text
    foregroundSubtle: '#6b7280',  // Medium gray for icons
    border: '#d1d5db',            // Gray border
    borderSubtle: '#e5e7eb',      // Light gray border
  },
} as const;
```

### 2. Add Component-Specific Semantic Tokens

Add status badge, icon, and alert tokens:

```typescript
// ============================================================================
// COMPONENT SEMANTIC TOKENS
// ============================================================================

const componentSemantics = {
  // Status Badges
  badge: {
    success: {
      backgroundColor: semanticColors.success.background,
      color: semanticColors.success.foreground,
      borderColor: semanticColors.success.border,
    },
    warning: {
      backgroundColor: semanticColors.warning.background,
      color: semanticColors.warning.foreground,
      borderColor: semanticColors.warning.border,
    },
    error: {
      backgroundColor: semanticColors.error.background,
      color: semanticColors.error.foreground,
      borderColor: semanticColors.error.border,
    },
    info: {
      backgroundColor: semanticColors.info.background,
      color: semanticColors.info.foreground,
      borderColor: semanticColors.info.border,
    },
    neutral: {
      backgroundColor: semanticColors.neutral.background,
      color: semanticColors.neutral.foreground,
      borderColor: semanticColors.neutral.border,
    },
  },

  // Status Icons
  icon: {
    success: semanticColors.success.foregroundSubtle,
    warning: semanticColors.warning.foregroundSubtle,
    error: semanticColors.error.foregroundSubtle,
    info: semanticColors.info.foregroundSubtle,
    neutral: semanticColors.neutral.foregroundSubtle,
  },

  // Alert/Banner components
  alert: {
    success: {
      background: semanticColors.success.background,
      text: semanticColors.success.foreground,
      icon: semanticColors.success.foregroundSubtle,
      border: semanticColors.success.borderSubtle,
    },
    warning: {
      background: semanticColors.warning.background,
      text: semanticColors.warning.foreground,
      icon: semanticColors.warning.foregroundSubtle,
      border: semanticColors.warning.borderSubtle,
    },
    error: {
      background: semanticColors.error.background,
      text: semanticColors.error.foreground,
      icon: semanticColors.error.foregroundSubtle,
      border: semanticColors.error.borderSubtle,
    },
    info: {
      background: semanticColors.info.background,
      text: semanticColors.info.foreground,
      icon: semanticColors.info.foregroundSubtle,
      border: semanticColors.info.borderSubtle,
    },
  },
} as const;
```

### 3. Export New Tokens

Update the main export at the bottom of `design-tokens.ts`:

```typescript
export const tokens = {
  // ... existing exports
  semanticColors,
  componentSemantics,
} as const;

// Type helper for autocomplete
export type DesignTokens = typeof tokens;
```

### 4. Create Usage Documentation

Add a comment block at the top of the semantic tokens section:

```typescript
/**
 * SEMANTIC COLOR SYSTEM
 * 
 * Usage Examples:
 * 
 * // Status icon
 * <CheckmarkCircleRegular style={{ color: tokens.semanticColors.success.foregroundSubtle }} />
 * 
 * // Error message
 * <div style={{ color: tokens.semanticColors.error.foreground }}>Error message</div>
 * 
 * // Success badge
 * <Badge style={{
 *   backgroundColor: tokens.componentSemantics.badge.success.backgroundColor,
 *   color: tokens.componentSemantics.badge.success.color,
 *   border: `1px solid ${tokens.componentSemantics.badge.success.borderColor}`,
 * }}>Success</Badge>
 * 
 * // Info alert background
 * <div style={{ backgroundColor: tokens.componentSemantics.alert.info.background }}>
 *   <Info24Regular style={{ color: tokens.componentSemantics.alert.info.icon }} />
 *   <span style={{ color: tokens.componentSemantics.alert.info.text }}>Info message</span>
 * </div>
 */
```

## ✅ Acceptance Criteria

- [ ] `semanticColors` object added to `design-tokens.ts` with all 5 states (success, warning, error, info, neutral)
- [ ] Each semantic color has 6 variants: background, backgroundHover, foreground, foregroundSubtle, border, borderSubtle
- [ ] `componentSemantics` object added with badge, icon, and alert tokens
- [ ] All new tokens properly exported in the main `tokens` object
- [ ] Usage documentation added with clear examples
- [ ] TypeScript types are correct and provide autocomplete
- [ ] No ESLint errors or TypeScript errors
- [ ] All tokens follow the existing naming convention
- [ ] Colors meet WCAG AA contrast requirements (verify with contrast checker)

## 📁 Files to Modify

- `frontend/src/styles/design-tokens.ts` (primary file)

## 🔗 Related Issues

- Depends on: None (foundational work)
- Blocks: DS-02, DS-03, DS-04, DS-05 (all component migrations need these tokens)

## 🧪 Testing

After implementation, verify:
1. Import tokens in a test component: `import { tokens } from '@/styles/design-tokens'`
2. Check TypeScript autocomplete works: `tokens.semanticColors.success.[autocomplete should work]`
3. Verify colors meet contrast requirements using https://webaim.org/resources/contrastchecker/
4. Run `npm run build` to ensure no compilation errors

## 📚 Additional Context

**Current Token Structure:**
The existing `design-tokens.ts` already has:
- `purplePalette` - Brand colors
- `glassEffects` - Glassmorphism effects
- `spacing` - Fluent UI spacing scale
- `typography` - Font families and sizes
- `shadows` - Elevation shadows
- `borderRadius` - Border radius scale
- `motion` - Animation tokens

This issue adds semantic colors to complement the existing system.

**Why Semantic Tokens Matter:**
- Single source of truth for status colors
- Easy to theme (change green to blue for success across entire app)
- Consistent user experience
- Accessible by design (verified contrast ratios)
- Self-documenting code

---

**AI Agent Instructions:**
1. Read the entire issue carefully
2. Review `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
3. Open `frontend/src/styles/design-tokens.ts`
4. Add the semantic tokens as specified above
5. Ensure proper TypeScript typing
6. Export the new tokens
7. Verify no compilation errors
8. Do NOT modify any other files in this issue
9. Do NOT create mock data or examples outside of comments
10. Follow the exact structure provided - no improvisation
