# Issue 1: Project Header & Layout Consistency

## 🎯 Overview
Improve the visual consistency and alignment of the project detail view header and layout to match our design system standards.

## 📍 Context
**URL Example**: `http://localhost:1420/app/projects/proj-2`
**File**: `frontend/src/views/ProjectWorkspaceView.tsx`

## 🔍 Current State vs. Desired State

### Current Issues:
1. ❌ Project icon and header are not center-aligned
2. ❌ Inconsistent padding within the card container
3. ❌ Overall progress % indicator not aligned with universal left-hand padding
4. ❌ Progress bar styling doesn't match app's glassmorphic aesthetic
5. ❌ Right-hand side padding is inconsistent with left-hand side
6. ❌ Icons for stats (Total Activities, Completed, In Progress, Days Remaining) are on the right side of text

### Desired State:
1. ✅ Center-aligned project icon and header
2. ✅ Consistent padding (16px) maintained throughout card
3. ✅ Overall progress % indicator aligned with left-hand padding
4. ✅ Progress bar styled with our purple gradient theme and glassmorphic effects
5. ✅ Symmetrical left and right padding
6. ✅ Icons positioned on the LEFT side of stat text labels

## 📋 Acceptance Criteria

### Layout Alignment:
- [ ] Project icon and header text are vertically and horizontally centered
- [ ] Left padding: 16px consistent across all elements
- [ ] Right padding: 16px consistent across all elements
- [ ] Overall progress % indicator respects the 16px left padding

### Progress Bar Styling:
- [ ] Use `.lcm-progress-bar` class or create one following design system
- [ ] Apply purple gradient (`--lcm-primary: #8b5cf6`)
- [ ] Add glassmorphic backdrop filter effect
- [ ] Match the visual style of `EnhancedProgressBar` component if available
- [ ] Ensure percentage text is readable (sufficient contrast ratio ≥ 4.5:1)

### Stat Icons Layout:
- [ ] Move icons to LEFT of text for:
  - Total Activities
  - Completed
  - In Progress
  - Days Remaining
- [ ] Maintain 8px spacing between icon and text
- [ ] Ensure vertical alignment of icon with text baseline

## 🎨 Design System Constraints

### MUST USE:
```css
/* Card container */
.lcm-card {
  padding: 16px;
  background: var(--lcm-bg-card);
  backdrop-filter: var(--lcm-backdrop-filter);
}

/* Progress bar */
.lcm-progress-bar {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-radius: 8px;
}

/* Typography */
font-family: 'Poppins', 'Montserrat', system-ui, sans-serif;
```

### DO NOT:
- ❌ Use inline styles
- ❌ Hardcode colors (use CSS custom properties)
- ❌ Break glassmorphic aesthetic
- ❌ Use `any` type in TypeScript
- ❌ Create new slider components (use `CustomSlider` if needed)

## 🔧 Implementation Guidance

### Files to Modify:
1. `frontend/src/views/ProjectWorkspaceView.tsx` - Main component logic
2. `frontend/src/fluent-enhancements.css` - Add `.lcm-progress-bar` if missing
3. Potentially: `frontend/src/components/EnhancedUXComponents.tsx` - If reusing EnhancedProgressBar

### Code Pattern Example:
```tsx
// Icon on LEFT of text
<div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <ActivityIcon className="stat-icon" />
  <span className="stat-label">Total Activities</span>
  <span className="stat-value">{totalActivities}</span>
</div>

// Center-aligned header
<div className="project-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
  <ProjectIcon size={32} />
  <h1>{projectName}</h1>
</div>
```

## ✅ Testing Requirements

### Visual Testing:
1. Open project detail view: `http://localhost:1420/app/projects/proj-2`
2. Verify center alignment of icon + header
3. Measure padding with browser DevTools:
   - Left: 16px
   - Right: 16px
   - Top/Bottom: Consistent
4. Check progress bar matches app's purple gradient theme
5. Verify icons are on LEFT of stat labels
6. Test on different screen sizes (responsive)

### Code Quality:
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings
- [ ] All classes use `.lcm-*` naming convention
- [ ] No hardcoded colors or magic numbers

## 📚 References
- Design System: `frontend/src/fluent-enhancements.css`
- EnhancedProgressBar: `frontend/src/components/EnhancedUXComponents.tsx`
- Project Instructions: `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

---

**Assignee**: @copilot-async
**Priority**: High
**Labels**: `ui-polish`, `design-system`, `project-view`
