# Stage 3: Activity Wizard Refactoring Plan

**Status**: In Progress  
**Target**: Convert 962 lines of wizard.css to makeStyles  
**Priority**: HIGH

---

## 📊 Analysis

**Current State**:
- wizard.css: 962 lines
- 10 components to refactor
- ~50+ CSS classes
- Mix of layout, typography, colors, spacing

**Goal**:
- Convert to CSS-in-JS (makeStyles)
- Use design tokens throughout
- Remove CSS file dependencies
- Improve maintainability

---

## 🎯 Sub-Tasks (Breakdown)

### Task 3.1: Create useWizardStyles Hook ⏳
**Priority**: Critical (Foundation)  
**Estimated**: 30 minutes

Create centralized wizard styles hook with:
- Container styles
- Card styles
- Header styles
- Progress styles
- Navigation styles
- Section styles
- Info box styles

**File**: `frontend/src/hooks/useWizardStyles.ts`

---

### Task 3.2: Refactor ActivityWizard.tsx ⏳
**Priority**: High  
**Estimated**: 45 minutes

**Changes**:
- Import useWizardStyles
- Replace className with style hooks
- Remove wizard.css import
- Use design tokens for spacing/colors

**File**: `frontend/src/components/Activity/ActivityWizard/ActivityWizard.tsx`

---

### Task 3.3: Refactor WizardProgress.tsx
**Priority**: High  
**Estimated**: 30 minutes

**Changes**:
- Create progress-specific styles
- Step indicators
- Progress line
- Step labels

**File**: `frontend/src/components/Activity/ActivityWizard/WizardProgress.tsx`

---

### Task 3.4: Refactor WizardNavigation.tsx
**Priority**: Medium  
**Estimated**: 20 minutes

**Changes**:
- Navigation container styles
- Button positioning
- Spacing with tokens

**File**: `frontend/src/components/Activity/ActivityWizard/WizardNavigation.tsx`

---

### Task 3.5: Refactor Step1_ActivityBasics.tsx
**Priority**: Medium  
**Estimated**: 30 minutes

**Changes**:
- Form layout styles
- Input container styles
- Label styles
- Validation messages

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step1_ActivityBasics.tsx`

---

### Task 3.6: Refactor Step2_SourceDestination.tsx
**Priority**: Medium  
**Estimated**: 40 minutes

**Changes**:
- Infrastructure card styles (already has some)
- Radio button containers
- Grid layout
- Card hover effects

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step2_SourceDestination.tsx`

---

### Task 3.7: Refactor Step3_Compatibility.tsx
**Priority**: Medium  
**Estimated**: 30 minutes

**Changes**:
- Compatibility section styles
- Checkbox groups
- Warning boxes

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step3_Compatibility.tsx`

---

### Task 3.8: Refactor Step4_Capacity.tsx
**Priority**: Medium  
**Estimated**: 35 minutes

**Changes**:
- Capacity input styles
- Grid layouts for CPU/Memory/Storage
- Validation indicators

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step4_Capacity.tsx`

---

### Task 3.9: Refactor Step5_Schedule.tsx
**Priority**: Low  
**Estimated**: 25 minutes

**Changes**:
- Date picker styles
- Timeline components
- Duration inputs

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step5_Schedule.tsx`

---

### Task 3.10: Refactor Step6_Risks.tsx
**Priority**: Low  
**Estimated**: 25 minutes

**Changes**:
- Risk card styles
- Severity indicators
- Mitigation sections

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step6_Risks.tsx`

---

### Task 3.11: Refactor Step7_Review.tsx
**Priority**: Low  
**Estimated**: 30 minutes

**Changes**:
- Summary card styles
- Review sections
- Submit button area

**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step7_Review.tsx`

---

### Task 3.12: Remove/Minimize wizard.css
**Priority**: Final  
**Estimated**: 15 minutes

**Changes**:
- Remove converted styles
- Keep only global overrides (if any)
- Update imports across codebase

**File**: `frontend/src/styles/wizard.css`

---

## 📈 Execution Order

**Phase 1: Foundation** (1 hour)
1. Task 3.1 - useWizardStyles hook ✅
2. Task 3.2 - ActivityWizard.tsx
3. Task 3.3 - WizardProgress.tsx

**Phase 2: Core Steps** (2 hours)
4. Task 3.4 - WizardNavigation.tsx
5. Task 3.5 - Step1_ActivityBasics.tsx
6. Task 3.6 - Step2_SourceDestination.tsx
7. Task 3.7 - Step3_Compatibility.tsx

**Phase 3: Remaining Steps** (1.5 hours)
8. Task 3.8 - Step4_Capacity.tsx
9. Task 3.9 - Step5_Schedule.tsx
10. Task 3.10 - Step6_Risks.tsx
11. Task 3.11 - Step7_Review.tsx

**Phase 4: Cleanup** (15 minutes)
12. Task 3.12 - Remove wizard.css

**Total Estimated Time**: 4.5-5 hours

---

## 🎨 Design Token Usage

### Colors
- `tokens.colorBrandPrimary` - Purple (#8b5cf6)
- `tokens.colorNeutralForeground1` - Text
- `tokens.colorGlassBackground` - Glass cards
- `tokens.colorGlassPurpleLight` - Subtle purple tint

### Spacing
- `tokens.xl` - 20px
- `tokens.xxl` - 24px
- `tokens.xxxl` - 32px
- `tokens.l` - 16px
- `tokens.m` - 12px

### Typography
- `tokens.fontFamilyPrimary` - Poppins
- `tokens.fontSizeBase600` - 24px
- `tokens.fontWeightSemibold` - 600

### Effects
- `tokens.blurMedium` - backdrop-filter
- `tokens.shadowCardElevation` - box-shadow
- `tokens.borderRadiusXLarge` - border-radius

---

## 🚀 Starting Now

Beginning with **Task 3.1: Create useWizardStyles Hook**...

---

**Progress**: 0/12 tasks (0%)  
**Status**: 🟡 Starting Phase 1
