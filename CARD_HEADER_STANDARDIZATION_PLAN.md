# Card Header Standardization Plan

## Status: IN PROGRESS

## Completed ✅
1. Added standardized card header styles to `designSystem.ts`:
   - `standardCardTitle`: 18px, 600 weight, #1f2937 (gray-900), Poppins
   - `standardCardSubtitle`: 14px, 400 weight, #6b7280 (gray-600), Poppins
   - `standardCardIcon`: 20px, #8b5cf6 (purple), flex centered
2. Fixed duplicate property issues in design system
3. Committed design system enhancements (commit: e5ba99b)

## Icon Library: Fluent UI 2 (@fluentui/react-icons)
**CRITICAL**: Only use `@fluentui/react-icons` package. Lucide React icons are FORBIDDEN.

### Common Icon Mappings (Lucide → Fluent UI 2)
- `ArrowLeft` → `ArrowLeftRegular`
- `Plus` → `AddRegular`
- `Edit3` / `Edit` → `EditRegular`
- `Trash2` / `Trash` → `DeleteRegular`
- `X` → `DismissRegular`
- `CheckCircle` → `CheckmarkCircleRegular`
- `AlertCircle` → `ErrorCircleRegular`
- `Clock` → `ClockRegular`
- `Calendar` → `CalendarRegular`
- `Users` → `PeopleRegular`
- `Target` → `TargetRegular`
- `BarChart3` / `BarChart` → `ChartMultipleRegular`
- `Activity` → `TaskListRegular` or `ActivityHistoryRegular`
- `FileText` → `DocumentRegular`
- `MessageCircle` → `ChatRegular`
- `Server` → `ServerRegular`
- `Filter` → `FilterRegular`
- `SortAsc` / `Sort` → `ArrowSortRegular`
- `Info` → `InfoRegular`
- `Folder` → `FolderRegular`
- `Settings` → `SettingsRegular`

## Files Requiring Updates

### 1. ProjectWorkspaceView.tsx (HIGH PRIORITY)
**Location**: `frontend/src/views/ProjectWorkspaceView.tsx`

#### Icon Replacements Needed:
```typescript
// Import section (lines 1-30)
// REMOVE: import { ... } from 'lucide-react';
// ADD:
import {
  ArrowLeftRegular,
  CalendarRegular,
  ClockRegular,
  PeopleRegular,
  TargetRegular,
  ChartMultipleRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  SettingsRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  TaskListRegular,
  DocumentRegular,
  ChatRegular,
  ServerRegular,
  FilterRegular,
  ArrowSortRegular,
  DismissRegular,
  InfoRegular,
  ArrowTrendingRegular
} from '@fluentui/react-icons';
```

#### Component Usage Replacements:
- Line ~526: `<AlertCircle ... />` → `<ErrorCircleRegular ... />`
- Line ~566: `<ArrowLeft ... />` → `<ArrowLeftRegular ... />`
- Line ~722: `<Activity ... />` → `<TaskListRegular ... />`
- Line ~735: `<CheckCircle ... />` → `<CheckmarkCircleRegular ... />`
- Line ~748: `<Clock ... />` → `<ClockRegular ... />`
- Line ~761: `<Calendar ... />` → `<CalendarRegular ... />`
- Line ~786, 841: `<Plus ... />` → `<AddRegular ... />`
- Line ~810, 849: `<BarChart3 ... />` or `<Activity ... />` → `<ChartMultipleRegular ... />`
- Line ~907: `<Edit3 ... />` → `<EditRegular ... />`
- Line ~915: `<Trash2 ... />` → `<DeleteRegular ... />`
- Line ~1172, 1476: `<X ... />` → `<DismissRegular ... />`

#### Overview Section Cards (lines ~960-1015):
```typescript
{activeTab === 'overview' && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Project Information Card */}
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div style={DesignTokens.components.standardCardIcon}>
          <InfoRegular />
        </div>
        <h3 style={DesignTokens.components.standardCardTitle}>
          Project Information
        </h3>
      </div>
      {/* Content stays same */}
    </div>
    
    {/* Activity Breakdown Card */}
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div style={DesignTokens.components.standardCardIcon}>
          <ChartMultipleRegular />
        </div>
        <h3 style={DesignTokens.components.standardCardTitle}>
          Activity Breakdown
        </h3>
      </div>
      {/* Content stays same */}
    </div>
  </div>
)}
```

### 2. ProjectsView.tsx
**Location**: `frontend/src/views/ProjectsView.tsx`

#### Changes Needed:
- Line ~635: Header icon should use `FolderRegular` consistently
- Line ~964+: Project cards should use standardized title/subtitle styles
- Ensure all card titles use `DesignTokens.components.standardCardTitle`
- Ensure all card subtitles/descriptions use `DesignTokens.components.standardCardSubtitle`

### 3. CapacityVisualizerView.tsx
**Location**: `frontend/src/views/CapacityVisualizerView.tsx`

#### Changes Needed:
- Review all section headers
- Apply standard card title/subtitle styles
- Ensure all icons are from Fluent UI 2

### 4. LandingView.tsx
**Location**: `frontend/src/views/LandingView.tsx`

#### Changes Needed:
- Navigation card titles must be `<h2>` tags (for accessibility)
- Apply standard card styles
- Use proper Fluent UI 2 icons for each section

## Design Standards

### Card Header Pattern
```tsx
<div className="flex items-center gap-3 mb-4">
  <div style={DesignTokens.components.standardCardIcon}>
    <IconComponentRegular />
  </div>
  <div>
    <h3 style={DesignTokens.components.standardCardTitle}>
      Card Title
    </h3>
    {subtitle && (
      <p style={DesignTokens.components.standardCardSubtitle}>
        Card subtitle or description
      </p>
    )}
  </div>
</div>
```

### Typography Hierarchy
- **Page Title**: `standardTitle` (24px, 700 weight, purple)
- **Section Title**: `sectionTitle` (24px, 700 weight, gray-900)
- **Card Title**: `standardCardTitle` (18px, 600 weight, gray-900)
- **Card Subtitle**: `standardCardSubtitle` (14px, 400 weight, gray-600)
- **Card Description**: `cardDescription` (14px, 400 weight, black)

### Color Palette
- Primary Purple: `#8b5cf6` (icons, accents)
- Text Primary: `#1f2937` (gray-900)
- Text Secondary: `#6b7280` (gray-600)
- Black: `#000000` (descriptions, high contrast)

## Testing Checklist
- [ ] All Lucide icons replaced with Fluent UI 2 equivalents
- [ ] No import errors for missing icon components
- [ ] All card titles use consistent styling
- [ ] All card subtitles use consistent styling
- [ ] Icon colors match design system (purple #8b5cf6)
- [ ] Font family is Poppins throughout
- [ ] Line heights and spacing are consistent
- [ ] Hot reload works without errors
- [ ] Visual consistency across all views

## Implementation Order
1. ✅ Design system updates (COMPLETED)
2. 🚧 ProjectWorkspaceView icon replacements (IN PROGRESS)
3. ProjectWorkspaceView Overview cards
4. ProjectsView cards
5. CapacityVisualizerView headers
6. LandingView navigation cards
7. Final visual review and consistency check

## Notes
- Always use `style={DesignTokens.components.standardCardTitle}` rather than inline styles or className
- Fluent UI 2 icons end with `Regular` for regular weight (e.g., `InfoRegular`, not `Info`)
- Icons should be 20px by default (set in standardCardIcon)
- Maintain 3px gap between icon and text (`gap-3` or `gap: '12px'`)
