# TASK-009: Component Migration Sprint

**Task ID:** TASK-009  
**Priority:** P2 - Medium  
**Estimate:** 8 hours (can be split across multiple agents)  
**Dependencies:** TASKS 1-8 should be substantially complete  
**Phase:** 1 - Core ITSM (Polish)

---

## Objective

Migrate all Phase 1 views to use `EnhancedPurpleGlassButton` and `EnhancedPurpleGlassSearchBar` components, removing native HTML buttons and legacy components.

---

## Context

The enhanced components were created in a previous session with animated gradients and full accessibility. Currently, only GuidesView and ButtonSearchBarDemoView use them. This task systematically migrates remaining views.

### Components to Use
- `EnhancedPurpleGlassButton` - Replaces `<button>`, `PurpleGlassButton`, `Button`
- `EnhancedPurpleGlassSearchBar` - Replaces `GlassmorphicSearchBar`, `<input type="search">`

### Reference Documentation
- `docs/BUTTON_USAGE_GUIDE.md` - Complete usage guide
- `frontend/src/views/ButtonSearchBarDemoView.tsx` - Visual examples
- `COMPONENT_LIBRARY_GUIDE.md` - Component API reference

---

## Views to Migrate

This task can be split among multiple agents. Each subtask is independent.

### Subtask 9A: High-Traffic Views

| View | File | Native Buttons | Est. Time |
|------|------|----------------|-----------|
| DashboardView | `DashboardView.tsx` | 4 | 45 min |
| ServiceDeskView | `ServiceDeskView.tsx` | Several | 45 min |
| TicketDetailView | `TicketDetailView.tsx` | Many | 60 min |

### Subtask 9B: Detail Views

| View | File | Native Buttons | Est. Time |
|------|------|----------------|-----------|
| AssetDetailView | `AssetDetailView.tsx` | 5 | 30 min |
| CIDetailView | `CIDetailView.tsx` | 2+ | 20 min |
| ProjectDetailView | `ProjectDetailView.tsx` | Several | 30 min |

### Subtask 9C: Admin Views

| View | File | Native Buttons | Est. Time |
|------|------|----------------|-----------|
| ApprovalInbox | `ApprovalInbox.tsx` | 2+ | 30 min |
| AuditLogView | `AuditLogView.tsx` | Few | 20 min |
| UserManagementView | `UserManagementView.tsx` | Several | 30 min |

### Subtask 9D: Utility Views

| View | File | Native Buttons | Est. Time |
|------|------|----------------|-----------|
| DataUploadView | `DataUploadView.tsx` | 3+ | 30 min |
| DesignDocsView | `DesignDocsView.tsx` | 6+ | 45 min |
| CapacityVisualizerView | `CapacityVisualizerView.tsx` | 2 | 20 min |

---

## Migration Pattern

### Step 1: Add Import

```tsx
// Before
import { PurpleGlassCard, PurpleGlassButton } from '../components/ui';

// After
import { 
  PurpleGlassCard, 
  EnhancedPurpleGlassButton,
  EnhancedPurpleGlassSearchBar 
} from '../components/ui';
```

### Step 2: Replace Native Buttons

```tsx
// Before
<button 
  onClick={handleClick}
  style={{ 
    padding: '8px 16px', 
    background: 'purple',
    // ... many inline styles
  }}
>
  Save
</button>

// After
<EnhancedPurpleGlassButton 
  variant="primary" 
  onClick={handleClick}
>
  Save
</EnhancedPurpleGlassButton>
```

### Step 3: Choose Correct Variant

| Action Type | Variant | Example |
|------------|---------|---------|
| Primary action | `primary` | Save, Submit, Create |
| Secondary action | `secondary` | Cancel, Back, View |
| Destructive | `danger` | Delete, Remove |
| Positive confirm | `success` | Approve, Complete |
| Informational | `info` | Help, Learn More |
| Subtle/tertiary | `ghost` | Close, Collapse |
| Text-only | `link` | See more |

### Step 4: Add Icons Where Appropriate

```tsx
import { SaveRegular, DeleteRegular, AddRegular } from '@fluentui/react-icons';

<EnhancedPurpleGlassButton variant="primary" icon={<SaveRegular />}>
  Save Changes
</EnhancedPurpleGlassButton>

<EnhancedPurpleGlassButton variant="danger" icon={<DeleteRegular />}>
  Delete
</EnhancedPurpleGlassButton>
```

### Step 5: Handle Icon-Only Buttons

```tsx
// Must have aria-label for accessibility
<EnhancedPurpleGlassButton 
  variant="ghost" 
  icon={<DismissRegular />}
  aria-label="Close dialog"
/>
```

### Step 6: Replace Search Bars

```tsx
// Before
<GlassmorphicSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search..."
/>

// After
<EnhancedPurpleGlassSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search tickets, assets, or people..."
  showClearButton
  onSubmit={handleSearch}
/>
```

---

## Common Patterns to Remove

### Inline Button Styles
```tsx
// REMOVE patterns like:
style={{ 
  padding: '8px 16px',
  borderRadius: '4px',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
}}
```

### Manual Hover Handlers
```tsx
// REMOVE patterns like:
onMouseOver={(e) => e.target.style.background = 'darker'}
onMouseOut={(e) => e.target.style.background = 'original'}
```

### CSS Classes for Buttons
```tsx
// REMOVE patterns like:
className="btn btn-primary btn-sm"
```

---

## Acceptance Criteria (Per View)

- [ ] No native `<button>` elements remain
- [ ] No legacy `PurpleGlassButton` imports
- [ ] No `GlassmorphicSearchBar` imports
- [ ] All buttons have appropriate variant
- [ ] Icon-only buttons have aria-label
- [ ] No inline button styles
- [ ] No manual hover event handlers
- [ ] TypeScript compiles without errors
- [ ] Visual appearance matches design system

---

## Verification Commands

```bash
# Check for remaining native buttons in a view
grep -n "<button" frontend/src/views/DashboardView.tsx

# Check for legacy components
grep -n "PurpleGlassButton" frontend/src/views/DashboardView.tsx
grep -n "GlassmorphicSearchBar" frontend/src/views/DashboardView.tsx

# Check all views
grep -rn "<button" frontend/src/views/ --include="*.tsx"
```

---

## Notes for Agents

1. **Work on one view at a time** - Complete and test before moving to next
2. **Don't change functionality** - Only replace button components
3. **Preserve all click handlers** - Copy `onClick` exactly
4. **Test in browser** - Verify buttons work after migration
5. **Run TypeScript check** - `npm run type-check` should pass
6. **Single primary rule** - Each section should have at most one primary button

---

## Splitting Strategy

If assigning to multiple agents:

- **Agent A**: Subtask 9A (High-traffic views)
- **Agent B**: Subtask 9B (Detail views)
- **Agent C**: Subtask 9C + 9D (Admin + Utility)

Each agent can work independently as there are no code dependencies between views.
