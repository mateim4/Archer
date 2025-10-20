---
name: "DS-06: Migrate Activity Wizard Steps to Design Tokens"
about: Refactor all Activity Wizard step components to use design tokens
title: "[DS-06] Migrate Activity Wizard Steps to Design Tokens"
labels: ["design-system", "refactor", "priority-medium", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective
Migrate all Activity Wizard step components (Steps 1-7) to use centralized design tokens, eliminating hardcoded typography values.

## 📋 Problem Statement
**Current State:**
- Step3_Infrastructure.tsx: 10+ hardcoded fontFamily declarations
- Step6_Assignment.tsx: 3+ hardcoded fontFamily declarations
- Step4, Step5, Step7: Multiple font overrides

**Target Components:** 7 wizard step files

## 📖 Coding Guidelines
Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
- ✅ Use tokens.typography.fontFamilyBody
- ❌ NO hardcoded fonts

## 🔧 Requirements
Replace all instances of:
```tsx
fontFamily: 'Oxanium, system-ui, sans-serif'
// With
fontFamily: tokens.typography.fontFamilyBody
```

## 📁 Files to Modify
- frontend/src/components/Activity/ActivityWizard/Steps/Step1_Basics.tsx
- frontend/src/components/Activity/ActivityWizard/Steps/Step2_SourceDestination.tsx
- frontend/src/components/Activity/ActivityWizard/Steps/Step3_Infrastructure.tsx
- frontend/src/components/Activity/ActivityWizard/Steps/Step4_CapacityValidation.tsx
- frontend/src/components/Activity/ActivityWizard/Steps/Step5_Timeline.tsx
- frontend/src/components/Activity/ActivityWizard/Steps/Step6_Assignment.tsx
- frontend/src/components/Activity/ActivityWizard/Steps/Step7_Review.tsx

## ✅ Acceptance Criteria
- [ ] All 7 files import design tokens
- [ ] All hardcoded fontFamily replaced
- [ ] No ESLint warnings
- [ ] Wizard renders correctly
