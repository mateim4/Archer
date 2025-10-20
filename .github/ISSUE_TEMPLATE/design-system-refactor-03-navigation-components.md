---
name: "DS-03: Migrate Core Navigation & Layout Components to Design Tokens"
about: Refactor NavigationSidebar, ViewToggleSlider, and core layout components to use design tokens
title: "[DS-03] Migrate Core Navigation & Layout Components to Design Tokens"
labels: ["design-system", "refactor", "priority-high", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective

Migrate core navigation and layout components to use centralized design tokens, eliminating hardcoded colors, spacing, and typography values.

## 📋 Problem Statement

**Current State:**
- `NavigationSidebar.tsx` has 3+ hardcoded font-family declarations
- `ViewToggleSlider.tsx` uses inline styles with hardcoded values
- Multiple layout components have inconsistent spacing

**Target Components:**
1. **NavigationSidebar** (`frontend/src/components/NavigationSidebar.tsx`)
2. **ViewToggleSlider** (`frontend/src/components/ViewToggleSlider.tsx`)
3. **EnhancedUXComponents** (`frontend/src/components/EnhancedUXComponents.tsx`)

## 📖 Coding Guidelines Reference

**CRITICAL:** Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

- ✅ Use `tokens` from `@/styles/design-tokens`
- ❌ NO hardcoded colors, spacing, or fonts
- ❌ NO local style overrides

## 🔧 Requirements

### 1. Migrate NavigationSidebar

**Current violations:**
```tsx
// ❌ WRONG
style={{ fontFamily: "'Oxanium', system-ui, sans-serif" }}
```

**Correct implementation:**
```tsx
import { tokens } from '@/styles/design-tokens';

// ✅ CORRECT
style={{ fontFamily: tokens.typography.fontFamilyBody }}
```

**All changes needed:**
- Replace hardcoded `fontFamily` with `tokens.typography.fontFamilyBody`
- Replace hardcoded colors with `tokens.semanticColors.*` or `tokens.purplePalette.*`
- Replace hardcoded spacing with `tokens.spacing.*`

### 2. Migrate ViewToggleSlider

**Current violations:**
```tsx
// ❌ WRONG
fontFamily: "'Oxanium', sans-serif"
```

**Correct implementation:**
```tsx
// ✅ CORRECT
fontFamily: tokens.typography.fontFamilyBody
```

### 3. Migrate EnhancedUXComponents

**Current violations:**
```tsx
// ❌ WRONG
<h2 style={{ fontFamily: "'Oxanium', sans-serif" }}>
```

**Correct implementation:**
```tsx
// ✅ CORRECT - Use heading font
<h2 style={{ fontFamily: tokens.typography.fontFamilyHeading }}>
```

## ✅ Acceptance Criteria

- [ ] All hardcoded `fontFamily` values replaced with `tokens.typography.*`
- [ ] All hardcoded colors replaced with semantic or palette tokens
- [ ] All hardcoded spacing replaced with `tokens.spacing.*`
- [ ] Components import tokens: `import { tokens } from '@/styles/design-tokens'`
- [ ] No ESLint warnings from `npm run lint:tokens`
- [ ] Components render correctly with no visual regressions
- [ ] TypeScript compilation succeeds with no errors
- [ ] All existing functionality preserved

## 📁 Files to Modify

- `frontend/src/components/NavigationSidebar.tsx`
- `frontend/src/components/ViewToggleSlider.tsx`
- `frontend/src/components/EnhancedUXComponents.tsx`

## 🔗 Related Issues

- Depends on: DS-01 (semantic tokens), DS-02 (linting)
- Related to: DS-04, DS-05 (other component migrations)

## 🧪 Testing

1. **Visual Test:**
   - Open the app
   - Verify navigation sidebar renders correctly
   - Verify view toggle slider works
   - Check for any visual regressions

2. **Linting:**
   ```bash
   npm run lint:tokens
   # Should show ZERO warnings for these files
   ```

3. **Type Check:**
   ```bash
   npm run type-check
   # Should pass with no errors
   ```

## 📚 Migration Pattern

For each component:
1. Add import: `import { tokens } from '@/styles/design-tokens'`
2. Find all `style={{}}` props
3. Replace hardcoded values with token references
4. Test visually
5. Run linter
6. Commit with message: `refactor: migrate [ComponentName] to design tokens`

---

**AI Agent Instructions:**
1. Review `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
2. Open each target file
3. Find all hardcoded values (colors, fonts, spacing)
4. Replace with appropriate design tokens
5. Ensure imports are added
6. Test with `npm run lint:tokens`
7. Do NOT modify unrelated files
8. Do NOT add new features
9. Do NOT create mock data
10. Focus ONLY on token migration
