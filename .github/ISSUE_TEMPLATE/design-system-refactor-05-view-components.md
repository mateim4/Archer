---
name: "DS-05: Migrate View Components to Design Tokens (Workspace & Strategy Views)"
about: Refactor main view components to eliminate hardcoded typography and spacing
title: "[DS-05] Migrate View Components to Design Tokens (Workspace & Strategy Views)"
labels: ["design-system", "refactor", "priority-medium", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective

Migrate main workspace and strategy view components to use centralized design tokens, focusing on typography and spacing consistency.

## 📋 Problem Statement

**Current State:**
- ProjectWorkspaceView has 3 hardcoded font-family declarations
- ClusterStrategyManagerView has 3 hardcoded font-family declarations  
- ProjectMigrationWorkspace has inconsistent Oxanium references
- GuidesView has hardcoded font-family values

**Target Files (4 views):**
1. `frontend/src/views/ProjectWorkspaceView.tsx`
2. `frontend/src/views/ClusterStrategyManagerView.tsx`
3. `frontend/src/views/ProjectMigrationWorkspace.tsx`
4. `frontend/src/views/GuidesView.tsx`

## 📖 Coding Guidelines Reference

Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
- ✅ Use `tokens.typography.*` for all fonts
- ✅ Use `tokens.spacing.*` for all spacing
- ❌ NO hardcoded font families
- ❌ NO hardcoded pixel values

## 🔧 Requirements

### Systematic Replacement Pattern

**Find and replace in each file:**

```tsx
// ❌ WRONG patterns to find
fontFamily: 'Oxanium, system-ui, -apple-system, sans-serif'
fontFamily: "'Oxanium', sans-serif"
fontFamily: 'Oxanium, Oxanium, system-ui, sans-serif'

// ✅ CORRECT replacement
fontFamily: tokens.typography.fontFamilyBody
```

### Add Import Statement

Top of each file:
```tsx
import { tokens } from '@/styles/design-tokens';
```

### Specific File Changes

#### ProjectWorkspaceView.tsx (lines ~674, 693, 713)
```tsx
// Replace all instances
style={{ fontFamily: "'Oxanium', sans-serif", color: '#1a202c' }}
// With
style={{ fontFamily: tokens.typography.fontFamilyBody, color: tokens.purplePalette.gray800 }}
```

#### ClusterStrategyManagerView.tsx (lines ~366, 397, 454)
```tsx
// Replace
style={{ fontFamily: 'Oxanium, system-ui, -apple-system, sans-serif' }}
// With
style={{ fontFamily: tokens.typography.fontFamilyBody }}
```

#### ProjectMigrationWorkspace.tsx (line ~93)
```tsx
// Replace
fontFamily: 'Oxanium, Oxanium, system-ui, -apple-system, sans-serif'
// With
fontFamily: tokens.typography.fontFamilyBody
```

Also replace lines ~148, 154:
```tsx
// Replace
fontFamily: 'Oxanium, sans-serif'
// With
fontFamily: tokens.typography.fontFamilyBody
```

#### GuidesView.tsx (lines ~410, 423)
```tsx
// Replace
fontFamily: 'Oxanium, sans-serif'
// With
fontFamily: tokens.typography.fontFamilyBody
```

## ✅ Acceptance Criteria

- [ ] All 4 view files import design tokens
- [ ] All hardcoded fontFamily values replaced with `tokens.typography.*`
- [ ] All hardcoded colors replaced with token references
- [ ] No ESLint warnings: `npm run lint:tokens`
- [ ] Views render correctly with no visual changes
- [ ] TypeScript compiles successfully
- [ ] No console errors when navigating to these views

## 📁 Files to Modify

- `frontend/src/views/ProjectWorkspaceView.tsx`
- `frontend/src/views/ClusterStrategyManagerView.tsx`
- `frontend/src/views/ProjectMigrationWorkspace.tsx`
- `frontend/src/views/GuidesView.tsx`

## 🔗 Related Issues

- Depends on: DS-01 (tokens exist)
- Related to: DS-03, DS-04 (other migrations)
- Blocks: DS-06 (wizard migrations need these patterns)

## 🧪 Testing

1. Navigate to each view
2. Verify fonts appear correctly
3. Run `npm run lint:tokens`
4. Check for visual regressions

---

**AI Agent Instructions:**
1. Review coding guidelines
2. Open each of 4 target files
3. Add import statement
4. Replace ALL fontFamily hardcoded values
5. Replace hardcoded colors where found
6. Test with linter
7. Do NOT modify component logic
8. Do NOT add features
