---
name: "DS-04: Migrate Status Components to Semantic Tokens (ServerCard, Badges, Alerts)"
about: Refactor status-displaying components to use semantic color tokens
title: "[DS-04] Migrate Status Components to Semantic Tokens (ServerCard, Badges, Alerts)"
labels: ["design-system", "refactor", "priority-high", "ai-agent-ready"]
assignees: ""
---

## 🎯 Objective

Migrate all status-displaying components (ServerCard, status badges, alerts) to use semantic color tokens (`tokens.semanticColors` and `tokens.componentSemantics`).

## 📋 Problem Statement

**Current State:**
- Status colors hardcoded in multiple places
- Inconsistent success/warning/error colors across components
- ServerCard uses hardcoded hex colors for status icons
- No centralized status color system

**Examples of Current Violations:**
```tsx
// ❌ WRONG - ServerCard.tsx
<CheckmarkCircleRegular style={{ color: '#10b981' }} />  // Success
<ErrorCircleRegular style={{ color: '#ef4444' }} />      // Error
<SettingsRegular style={{ color: '#f59e0b' }} />         // Warning

// ❌ WRONG - HardwareRefreshWizard.tsx
<div style={{ backgroundColor: tokens.colorPaletteGreenForeground1 }}>
// Should use semantic tokens instead
```

## 📖 Coding Guidelines Reference

**CRITICAL:** Follow `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

- ✅ Use semantic tokens for status colors
- ❌ NO hardcoded colors
- ❌ NO direct Fluent palette tokens for semantic states

## 🔧 Requirements

### Target Components (5 files)

1. **ServerCard.tsx** - Server status indicators
2. **HardwareRefreshWizard.tsx** - Status badges and progress
3. **ActivityCreationWizard.tsx** - Alert boxes and status
4. **ClusterStrategy/DominoConfigurationSection.tsx** - Info/warning alerts
5. **SimpleFileUpload.tsx** - Upload status indicators

### Migration Pattern

**Before:**
```tsx
// ❌ WRONG
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckmarkCircleRegular style={{ color: '#10b981' }} />;
    case 'pending':
      return <ClockRegular style={{ color: '#3b82f6' }} />;
    case 'in-progress':
      return <SettingsRegular style={{ color: '#f59e0b' }} />;
    case 'failed':
      return <ErrorCircleRegular style={{ color: '#ef4444' }} />;
  }
};
```

**After:**
```tsx
// ✅ CORRECT
import { tokens } from '@/styles/design-tokens';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckmarkCircleRegular style={{ color: tokens.componentSemantics.icon.success }} />;
    case 'pending':
      return <ClockRegular style={{ color: tokens.componentSemantics.icon.info }} />;
    case 'in-progress':
      return <SettingsRegular style={{ color: tokens.componentSemantics.icon.warning }} />;
    case 'failed':
      return <ErrorCircleRegular style={{ color: tokens.componentSemantics.icon.error }} />;
    default:
      return <InfoRegular style={{ color: tokens.componentSemantics.icon.neutral }} />;
  }
};
```

### Specific Changes Required

#### 1. ServerCard.tsx

Replace:
```tsx
// Lines 82-90 approximately
case 'completed':
  return <CheckmarkCircleRegular style={{ color: '#10b981', fontSize: '16px' }} />;
case 'pending':
  return <ClockRegular style={{ color: '#3b82f6', fontSize: '16px' }} />;
case 'in-progress':
  return <SettingsRegular style={{ color: '#f59e0b', fontSize: '16px' }} />;
case 'failed':
  return <ErrorCircleRegular style={{ color: '#ef4444', fontSize: '16px' }} />;
default:
  return <InfoRegular style={{ color: '#6b7280', fontSize: '16px' }} />;
```

With:
```tsx
case 'completed':
  return <CheckmarkCircleRegular style={{ color: tokens.componentSemantics.icon.success, fontSize: '16px' }} />;
case 'pending':
  return <ClockRegular style={{ color: tokens.componentSemantics.icon.info, fontSize: '16px' }} />;
case 'in-progress':
  return <SettingsRegular style={{ color: tokens.componentSemantics.icon.warning, fontSize: '16px' }} />;
case 'failed':
  return <ErrorCircleRegular style={{ color: tokens.componentSemantics.icon.error, fontSize: '16px' }} />;
default:
  return <InfoRegular style={{ color: tokens.componentSemantics.icon.neutral, fontSize: '16px' }} />;
```

Also replace the hardcoded blue color on line ~478:
```tsx
// Before
<div style={{ fontSize: '12px', color: '#1e40af' }}>

// After
<div style={{ fontSize: '12px', color: tokens.semanticColors.info.foreground }}>
```

#### 2. HardwareRefreshWizard.tsx

Replace legend colors (lines ~642-650):
```tsx
// Before
<div style={{ width: '12px', height: '12px', backgroundColor: tokens.colorPaletteGreenForeground1, borderRadius: '2px' }} />
<div style={{ width: '12px', height: '12px', backgroundColor: tokens.colorPaletteYellowForeground2, borderRadius: '2px' }} />
<div style={{ width: '12px', height: '12px', backgroundColor: tokens.colorPaletteRedForeground1, borderRadius: '2px' }} />

// After
<div style={{ width: '12px', height: '12px', backgroundColor: tokens.semanticColors.success.foregroundSubtle, borderRadius: '2px' }} />
<div style={{ width: '12px', height: '12px', backgroundColor: tokens.semanticColors.warning.foregroundSubtle, borderRadius: '2px' }} />
<div style={{ width: '12px', height: '12px', backgroundColor: tokens.semanticColors.error.foregroundSubtle, borderRadius: '2px' }} />
```

Replace status icon colors (lines ~676, 686):
```tsx
// Before
<CheckmarkCircle24Regular style={{ fontSize: '64px', color: tokens.colorPaletteGreenForeground1 }} />
<Play24Regular style={{ fontSize: '64px', color: tokens.colorBrandForeground1 }} />

// After
<CheckmarkCircle24Regular style={{ fontSize: '64px', color: tokens.semanticColors.success.foregroundSubtle }} />
<Play24Regular style={{ fontSize: '64px', color: tokens.purplePalette.purple600 }} />
```

Replace error/warning text colors (lines ~715, 721):
```tsx
// Before
<Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
<Text weight="semibold" style={{ color: tokens.colorPaletteYellowForeground2 }}>

// After
<Text weight="semibold" style={{ color: tokens.semanticColors.error.foreground }}>
<Text weight="semibold" style={{ color: tokens.semanticColors.warning.foreground }}>
```

#### 3. ClusterStrategy/DominoConfigurationSection.tsx

Replace info/warning icons (lines ~113, 177):
```tsx
// Before
<Info24Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0 }} />
<Warning24Regular style={{ color: tokens.colorPaletteYellowForeground1, flexShrink: 0 }} />

// After
<Info24Regular style={{ color: tokens.componentSemantics.icon.info, flexShrink: 0 }} />
<Warning24Regular style={{ color: tokens.componentSemantics.icon.warning, flexShrink: 0 }} />
```

#### 4. SimpleFileUpload.tsx

Replace gray text colors with semantic neutral:
```tsx
// Before (lines ~158, 187, 190)
style={{ color: '#6b7280' }}
style={{ color: '#9ca3af' }}

// After
style={{ color: tokens.semanticColors.neutral.foregroundSubtle }}
style={{ color: tokens.semanticColors.neutral.border }}
```

#### 5. HardwareAssetFormNew.tsx

Replace error colors (lines ~181, 205, 232):
```tsx
// Before
<div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>

// After
<div style={{ 
  color: tokens.semanticColors.error.foreground, 
  fontSize: tokens.typography.fontSizeBase200, 
  marginTop: tokens.spacing.xs 
}}>
```

## ✅ Acceptance Criteria

- [ ] All 5 target files modified
- [ ] All hardcoded status colors replaced with `tokens.semanticColors.*` or `tokens.componentSemantics.*`
- [ ] Import statement added to each file: `import { tokens } from '@/styles/design-tokens'`
- [ ] No hardcoded hex colors remain (`#10b981`, `#ef4444`, etc.)
- [ ] No direct Fluent palette tokens used for semantic states
- [ ] Visual appearance unchanged (colors should match previous values)
- [ ] No ESLint warnings: `npm run lint:tokens`
- [ ] TypeScript compiles successfully
- [ ] All components render correctly

## 📁 Files to Modify

- `frontend/src/components/ServerCard.tsx`
- `frontend/src/components/HardwareRefreshWizard.tsx`
- `frontend/src/components/ClusterStrategy/DominoConfigurationSection.tsx`
- `frontend/src/components/SimpleFileUpload.tsx`
- `frontend/src/components/HardwareAssetFormNew.tsx`

## 🔗 Related Issues

- Depends on: DS-01 (semantic tokens must exist)
- Related to: DS-03, DS-05 (other component migrations)

## 🧪 Testing

1. **Visual Regression Test:**
   - Open server list → verify status icons show correct colors
   - Open hardware refresh wizard → verify legend colors match
   - Check file upload → verify text colors are readable

2. **Linting:**
   ```bash
   npm run lint:tokens
   # Should show ZERO warnings for these 5 files
   ```

3. **Build:**
   ```bash
   npm run build
   # Should succeed with no errors
   ```

## 📚 Color Mapping Reference

| Old Hardcoded | New Token |
|--------------|-----------|
| `#10b981` (green) | `tokens.semanticColors.success.foregroundSubtle` |
| `#065f46` (dark green) | `tokens.semanticColors.success.foreground` |
| `#f59e0b` (orange) | `tokens.semanticColors.warning.foregroundSubtle` |
| `#92400e` (dark orange) | `tokens.semanticColors.warning.foreground` |
| `#ef4444` (red) | `tokens.semanticColors.error.foregroundSubtle` |
| `#991b1b` (dark red) | `tokens.semanticColors.error.foreground` |
| `#3b82f6` (blue) | `tokens.semanticColors.info.foregroundSubtle` |
| `#1e40af` (dark blue) | `tokens.semanticColors.info.foreground` |
| `#6b7280` (gray) | `tokens.semanticColors.neutral.foregroundSubtle` |

---

**AI Agent Instructions:**
1. Review `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`
2. Review DS-01 to understand semantic token structure
3. Open each of the 5 target files
4. Find all hardcoded status colors
5. Replace with semantic tokens per the mapping table
6. Add imports where missing
7. Test each file with linter
8. Do NOT modify other files
9. Do NOT change component logic
10. Focus ONLY on color token migration
