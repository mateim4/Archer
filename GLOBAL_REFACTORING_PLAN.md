# Global CSS Refactoring & Fluent UI 2 Compliance Plan

**Date**: October 17, 2025  
**Objective**: Replace CSS overrides with proper component-based styling following Fluent UI 2 best practices

---

## 🎯 Goals

1. **Eliminate `!important` overrides** - Replace with proper specificity
2. **Component-based styling** - Each component controls its own appearance
3. **Fluent UI 2 compliance** - Follow Microsoft's design system guidelines
4. **Preserve purple glass aesthetic** - Maintain brand identity
5. **Improve maintainability** - Make code easier to understand and modify

---

## 📊 Current State Analysis

### Issues Found:
- ❌ 50+ `!important` declarations in CSS
- ❌ Global CSS overrides fighting component styles
- ❌ Wizard using class-based CSS instead of Fluent UI makeStyles
- ❌ Inconsistent spacing (mix of px and tokens)
- ❌ Hard-coded colors instead of design tokens
- ❌ Modal backgrounds not properly isolated

### What's Working:
- ✅ Purple glass aesthetic established
- ✅ Glassmorphic effects implemented
- ✅ Poppins typography
- ✅ Some Fluent UI 2 components used

---

## 🗺️ Refactoring Stages

### **Stage 1: Foundation - Design Token System** (2-3 hours)
**Priority**: Critical  
**Impact**: Enables all other stages

**Tasks**:
1. Create centralized design token file
2. Define purple theme tokens
3. Map Fluent UI tokens to custom values
4. Create reusable style hooks
5. Document token usage

**Files**:
- `frontend/src/styles/design-tokens.ts` (NEW)
- `frontend/src/hooks/useTheme.ts` (NEW)
- `frontend/src/styles/theme.ts` (NEW)

**Deliverable**: Complete token system with documentation

---

### **Stage 2: Modal System Refactoring** (3-4 hours)
**Priority**: High (Currently broken)  
**Impact**: Fixes immediate visual bugs

**Tasks**:
1. Refactor ActivityWizardModal to use makeStyles properly
2. Remove all `!important` from modal CSS
3. Implement proper backdrop system
4. Create reusable modal wrapper component
5. Fix background issues

**Files**:
- `ActivityWizardModal.tsx` - Refactor with makeStyles
- `wizard.css` - Remove modal overrides
- `BaseModal.tsx` (NEW) - Reusable modal component

**Deliverable**: Modal with proper transparent backgrounds, no CSS hacks

---

### **Stage 3: Activity Wizard Component Refactoring** (4-6 hours)
**Priority**: High  
**Impact**: Largest codebase improvement

**Tasks**:
1. Convert wizard.css to makeStyles hooks
2. Create variant-aware wizard components
3. Remove global CSS dependencies
4. Implement proper theming
5. Add dark mode support foundation

**Files**:
- `ActivityWizard.tsx` - Add makeStyles
- `WizardProgress.tsx` - Convert to makeStyles
- `WizardNavigation.tsx` - Convert to makeStyles
- All 7 step components - Convert to makeStyles
- `useWizardStyles.ts` (NEW) - Centralized styles

**Deliverable**: Wizard completely using Fluent UI styling system

---

### **Stage 4: Form Components Standardization** (3-4 hours)
**Priority**: Medium  
**Impact**: Consistency across app

**Tasks**:
1. Audit all Fluent UI component usage
2. Standardize Input/Combobox styling
3. Standardize Button variants
4. Create purple glass form components
5. Document component usage patterns

**Files**:
- `PurpleGlassInput.tsx` (NEW)
- `PurpleGlassButton.tsx` (NEW)
- `PurpleGlassCard.tsx` (NEW)
- `form-components.stories.tsx` (NEW) - Storybook docs

**Deliverable**: Reusable purple-themed Fluent components

---

### **Stage 5: Layout & Spacing Normalization** (2-3 hours)
**Priority**: Medium  
**Impact**: Visual consistency

**Tasks**:
1. Replace all `px` values with Fluent tokens
2. Standardize spacing scale
3. Fix responsive breakpoints
4. Normalize container widths
5. Create layout utilities

**Files**:
- All component files - Replace hardcoded spacing
- `layout-utils.ts` (NEW)
- `responsive.ts` (NEW)

**Deliverable**: Consistent spacing throughout app

---

### **Stage 6: Color System Audit** (2-3 hours)
**Priority**: Medium  
**Impact**: Accessibility & consistency

**Tasks**:
1. Replace hardcoded hex colors with tokens
2. Ensure WCAG AA contrast ratios
3. Create semantic color mappings
4. Document color usage
5. Add color utilities

**Files**:
- All components - Replace hex colors
- `color-system.ts` (NEW)
- `accessibility-check.ts` (NEW)

**Deliverable**: Accessible, token-based color system

---

### **Stage 7: Fluent UI 2 UX Audit** (4-5 hours)
**Priority**: Medium-High  
**Impact**: Professional polish

**Tasks**:
1. Review Microsoft Fluent 2 Design Guidelines
2. Audit focus indicators
3. Audit keyboard navigation
4. Audit screen reader support
5. Audit touch targets (min 44x44px)
6. Audit motion/animation consistency
7. Fix identified issues

**Files**:
- All interactive components
- `FLUENT_UI_COMPLIANCE.md` (NEW) - Audit report

**Deliverable**: Fluent 2 compliant UX

---

### **Stage 8: Global CSS Cleanup** (3-4 hours)
**Priority**: Low-Medium  
**Impact**: Code maintainability

**Tasks**:
1. Remove unused CSS rules
2. Consolidate duplicate styles
3. Organize CSS files logically
4. Document global styles purpose
5. Create CSS architecture guide

**Files**:
- `fluent2-design-system.css` - Clean up
- `wizard.css` - Minimize/remove
- `CSS_ARCHITECTURE.md` (NEW)

**Deliverable**: Clean, minimal global CSS

---

### **Stage 9: Performance Optimization** (2-3 hours)
**Priority**: Low  
**Impact**: Speed & efficiency

**Tasks**:
1. Audit bundle size impact
2. Lazy load makeStyles where appropriate
3. Minimize CSS-in-JS runtime cost
4. Optimize re-renders
5. Profile and fix bottlenecks

**Files**:
- All components - Optimize
- `performance-report.md` (NEW)

**Deliverable**: Optimized styling system

---

### **Stage 10: Documentation & Testing** (3-4 hours)
**Priority**: Low-Medium  
**Impact**: Long-term maintainability

**Tasks**:
1. Document design system usage
2. Create component usage guide
3. Add visual regression tests
4. Create E2E tests for key flows
5. Write contribution guidelines

**Files**:
- `DESIGN_SYSTEM_GUIDE.md` (NEW)
- `COMPONENT_LIBRARY.md` (NEW)
- Visual regression tests
- E2E test updates

**Deliverable**: Complete documentation

---

## 📋 Fluent UI 2 Compliance Checklist

Based on [Microsoft Fluent 2 Design System](https://fluent2.microsoft.design/):

### **Layout & Structure**
- [ ] Use Fluent spacing tokens (not px)
- [ ] Implement proper grid system
- [ ] Maintain consistent padding/margins
- [ ] Use semantic HTML elements
- [ ] Responsive design follows Fluent breakpoints

### **Typography**
- [ ] Use Fluent type ramp (not custom font sizes)
- [ ] Maintain proper line heights
- [ ] Use semantic heading levels (h1-h6)
- [ ] Ensure readable text contrast
- [ ] Support dynamic text scaling

### **Color**
- [ ] Use Fluent color tokens
- [ ] Ensure 4.5:1 contrast for text (WCAG AA)
- [ ] Use semantic color meanings
- [ ] Support light/dark themes
- [ ] Use elevation appropriately

### **Components**
- [ ] Use Fluent UI components (not custom recreations)
- [ ] Follow Fluent component patterns
- [ ] Use appropriate component variants
- [ ] Maintain component state consistency
- [ ] Follow Fluent animation guidelines

### **Interaction**
- [ ] Focus indicators visible (3px outline)
- [ ] Keyboard navigation works everywhere
- [ ] Touch targets minimum 44x44px
- [ ] Hover states consistent
- [ ] Disabled states clear

### **Accessibility**
- [ ] ARIA labels on all interactive elements
- [ ] Semantic HTML structure
- [ ] Screen reader tested
- [ ] Keyboard only navigation works
- [ ] Color not sole indicator of state

### **Motion**
- [ ] Use Fluent motion durations
- [ ] Use Fluent easing curves
- [ ] Respect prefers-reduced-motion
- [ ] Purposeful, not decorative
- [ ] Consistent across app

---

## 🎨 Purple Glass Aesthetic - Approved Deviations

These intentional deviations from Fluent UI 2 should be **preserved**:

### **✅ Keep These**:
1. **Purple color palette** (#8b5cf6 → #6366f1)
2. **Glassmorphic effects** (backdrop-filter)
3. **Poppins typography** (brand font)
4. **Purple shadows** (instead of gray)
5. **Gradient accents** (purple gradients)
6. **Card styling** (glass cards vs flat cards)

### **❌ Still Follow Fluent For**:
1. **Spacing scale** (use tokens, not custom px)
2. **Component structure** (use Fluent components)
3. **Accessibility** (WCAG compliance)
4. **Interaction patterns** (keyboard, focus, etc.)
5. **Semantic meaning** (success=green, error=red)
6. **Motion timing** (use Fluent durations)

---

## 🚀 Execution Plan

### **Week 1** (Priority 1 - Critical)
- Monday: Stage 1 (Design Tokens)
- Tuesday: Stage 2 (Modal Refactoring)
- Wednesday: Stage 3 Part 1 (Wizard foundation)
- Thursday: Stage 3 Part 2 (Wizard steps)
- Friday: Stage 3 Part 3 (Wizard completion)

### **Week 2** (Priority 2 - High Impact)
- Monday: Stage 4 (Form Components)
- Tuesday: Stage 5 (Layout & Spacing)
- Wednesday: Stage 6 (Color System)
- Thursday: Stage 7 Part 1 (UX Audit)
- Friday: Stage 7 Part 2 (UX Fixes)

### **Week 3** (Priority 3 - Polish)
- Monday: Stage 8 (CSS Cleanup)
- Tuesday: Stage 9 (Performance)
- Wednesday: Stage 10 (Documentation)
- Thursday: Testing & Bug Fixes
- Friday: Final review & deployment

---

## 📊 Success Metrics

### **Code Quality**
- Zero `!important` declarations
- 100% Fluent UI component usage
- <5% global CSS (only resets/utilities)
- TypeScript strict mode passing

### **Performance**
- <100ms style calculation time
- <50KB CSS bundle size
- No layout shifts (CLS = 0)
- 60fps animations

### **Accessibility**
- WCAG AA compliance
- 100% keyboard navigable
- Screen reader friendly
- Touch target compliance

### **UX**
- Consistent spacing
- Fluent motion patterns
- Proper focus indicators
- Professional polish

---

## 📝 Next Steps

1. **Review this plan** - Approve approach
2. **Start Stage 1** - Create design token system
3. **Fix modal immediately** - Stage 2 (high priority bug)
4. **Iterate through stages** - One week sprints
5. **Test continuously** - Don't wait until end

---

## 🛠️ Tools & Resources

### **Development**
- Fluent UI React v9 docs
- TypeScript 5.0+
- Vite for bundling
- Playwright for E2E tests

### **Design**
- Fluent 2 Design System docs
- WCAG 2.1 Guidelines
- Purple glass design tokens
- Figma design files (if available)

### **Testing**
- Playwright visual regression
- Axe accessibility testing
- Lighthouse performance
- Manual UX review

---

**Status**: 📋 Plan Created - Awaiting Approval  
**Next**: Start Stage 1 or fix modal immediately?
