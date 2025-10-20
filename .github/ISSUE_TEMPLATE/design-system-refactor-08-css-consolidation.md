---
name: "DS-08: Consolidate and Clean Up CSS Files"
about: Merge overlapping CSS files and convert to token-based system
title: "[DS-08] Consolidate and Clean Up CSS Files"
labels: ["design-system", "refactor", "priority-high", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective
Consolidate 14 CSS files into a clean, token-based CSS architecture. Remove duplicate styles and hardcoded values.

## 📋 Problem Statement
**Current State:**
- 14 separate CSS files with overlapping styles
- Multiple font imports (Oxanium loaded 3+ times)
- Conflicting style rules
- No centralized CSS token system

## 📖 Coding Guidelines
Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
- ✅ Use CSS variables from tokens
- ❌ NO duplicate styles
- ❌ NO hardcoded values in CSS

## 🔧 Requirements

### Target Architecture
```
frontend/src/styles/
├── fonts.css              (Font @font-face declarations)
├── design-tokens.ts       (JS tokens - already exists)
├── tokens.css             (CSS variables from tokens)
├── fluent2-design-system.css (Fluent overrides)
└── index.css              (Global reset + imports)
```

### 1. Create tokens.css
Generate CSS variables from design-tokens.ts:
```css
:root {
  /* Typography */
  --font-family-body: "Oxanium", system-ui, sans-serif;
  --font-family-heading: "Nasalization", system-ui, sans-serif;
  
  /* Semantic Colors */
  --color-success-fg: #065f46;
  --color-success-bg: #ecfdf5;
  --color-warning-fg: #92400e;
  --color-error-fg: #991b1b;
  /* ... etc */
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-s: 8px;
  /* ... etc */
}
```

### 2. Consolidate Font Loading
Merge all font imports into fonts.css:
- Remove from index.css
- Remove from index-old.css  
- Remove from fluent2-design-system.css
- Single source in fonts.css

### 3. Delete Redundant Files
**Files to delete:**
- index-old.css
- index-clean.css
- App.css (if empty)
- design-system.css (merge into tokens.css)
- custom-slider.css (move to components)
- responsive-tables.css (move to components)

**Files to keep & refactor:**
- fonts.css (NEW - font declarations)
- tokens.css (NEW - CSS variables)
- index.css (global reset + imports)
- fluent2-design-system.css (Fluent overrides)
- ux-enhancements.css (legacy - to be deprecated later)

### 4. Update Import Order in main.tsx
```tsx
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/index.css';
import './styles/fluent2-design-system.css';
```

## 📁 Files to Create
- frontend/src/styles/tokens.css

## 📁 Files to Delete
- frontend/src/index-old.css
- frontend/src/index-clean.css
- frontend/src/design-system.css
- frontend/src/custom-slider.css
- frontend/src/responsive-tables.css

## 📁 Files to Modify
- frontend/src/main.tsx (update import order)
- frontend/src/index.css (remove duplicates)
- frontend/src/styles/fluent2-design-system.css (remove font imports)

## ✅ Acceptance Criteria
- [ ] tokens.css created with all CSS variables
- [ ] Redundant CSS files deleted
- [ ] Font loading consolidated to fonts.css
- [ ] Import order correct in main.tsx
- [ ] No duplicate styles
- [ ] App renders correctly
- [ ] No console errors
- [ ] Bundle size reduced by ~15-20%
