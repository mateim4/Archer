# Activity Wizard Modal Conversion Plan

## Executive Summary

Convert the current full-page Activity Wizard (`/app/activities/wizard`) into a modal dialog that can be:
1. **Opened from "Add Activity" button** on Project Detail pages
2. **Opened in edit mode** when clicking activities in Gantt chart or list view
3. **Merged with ClusterStrategyModal features** to ensure completeness

## Current State Analysis

### Existing Activity Wizard
**Location**: `frontend/src/components/Activity/ActivityWizard/`

**Structure**:
- 7-step guided wizard for creating activities
- Full-page route: `/app/activities/wizard`
- WizardProvider context for state management
- Auto-save functionality with draft support
- Purple glass design system (Fluent UI 2)

**Steps**:
1. **Basics**: Activity name, type (Migration, Lifecycle Management, Decommission, Expansion, Maintenance)
2. **Source/Destination**: Source cluster (optional), target infrastructure type, target cluster name
3. **Infrastructure**: Hardware compatibility validation
4. **Capacity Validation**: Resource capacity checks
5. **Timeline**: Duration estimation
6. **Assignment**: Team members, dates
7. **Review**: Final confirmation

### Existing ClusterStrategyModal
**Location**: `frontend/src/components/ClusterStrategy/ClusterStrategyModal.tsx`

**Features that ActivityWizard may be missing**:
- **Strategy Type Selection**: Domino hardware swap, new hardware purchase, existing free hardware
- **Hardware Basket Integration**: Select from hardware baskets with model details
- **Domino Configuration**: Source cluster for domino swap, hardware available date
- **Procurement Details**: Hardware basket items selection
- **Hardware Pool Allocations**: Existing free hardware assignment
- **Capacity Requirements**: CPU cores, memory GB, storage TB (explicit fields)
- **Capacity Validation API**: Real-time validation with detailed metrics
- **Visual Validation Cards**: Color-coded validation status (optimal, acceptable, warning, critical)
- **Project Clusters API Integration**: Fetch clusters from project

### Current "Add Activity" Button Locations
1. **ProjectDetailView.tsx** (lines 543-573):
   - Timeline tab: "Add Activity" button
   - Activities tab: "Add Activity" button
   - Empty state: "Create First Activity" button
   - Currently opens minimal Dialog (lines 935-978) - just a placeholder

2. **ProjectWorkspaceView.tsx** (line 873):
   - Timeline view: "Add Activity" button
   - Currently opens EnhancedModal with basic form

3. **GanttChart.tsx** (line 381):
   - Empty state: "Add First Activity" button
   - Calls `onActivityCreate` prop

### Gantt Chart Edit Integration
**Location**: `frontend/src/components/GanttChart.tsx`

**Current Edit Capabilities**:
- Click on activity bar to select
- `onActivityClick` prop (line 62) - currently unused
- `onActivityUpdate` prop - updates activity data
- List view has Edit buttons (ProjectDetailView.tsx line 749)

## Architectural Changes Required

### 1. Modal Wrapper Component
**New File**: `frontend/src/components/Activity/ActivityWizardModal.tsx`

**Responsibilities**:
- Wrap ActivityWizard in Fluent UI Dialog/Modal
- Handle open/close state
- Support two modes: CREATE and EDIT
- Pass initial data for edit mode
- Handle success/cancel callbacks
- Manage WizardProvider at modal level

**Props**:
```typescript
interface ActivityWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (activity: Activity) => void;
  mode: 'create' | 'edit';
  projectId: string;
  activityId?: string; // For edit mode
  initialData?: Partial<Activity>; // For pre-filling
}
```

### 2. ActivityWizard Component Updates
**File**: `frontend/src/components/Activity/ActivityWizard/ActivityWizard.tsx`

**Changes**:
- Remove full-page layout assumptions
- Add modal-friendly sizing (max-width, max-height, scrolling)
- Support edit mode initialization
- Update header to show "Edit Activity" when in edit mode
- Maintain current purple glass aesthetic

### 3. WizardContext Enhancements
**File**: `frontend/src/components/Activity/ActivityWizard/Context/WizardContext.tsx`

**New Features**:
- Add `mode: 'create' | 'edit'` to context
- Add `loadExistingActivity(activityId: string)` method
- Support pre-filling form data from existing activity
- Update API endpoints to support UPDATE operations
- Add `onComplete` callback to notify parent of success

### 4. Step 2 Enhancement: Merge ClusterStrategyModal Features
**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step2_SourceDestination.tsx`

**Add Missing Fields**:
- **Migration Strategy Type** (for Migration activities only):
  - Domino hardware swap
  - New hardware purchase
  - Existing free hardware
  
- **Domino Configuration** (if domino selected):
  - Domino source cluster dropdown
  - Hardware available date picker
  
- **Hardware Basket Selection** (if new purchase):
  - Hardware basket dropdown (fetch from API)
  - Model details display
  - Basket items summary
  
- **Hardware Pool Allocations** (if existing hardware):
  - Pool allocation selection
  - Available hardware display

**API Integration**:
```typescript
// Fetch project clusters
GET /api/v1/enhanced-rvtools/projects/{projectId}/clusters

// Fetch hardware baskets
GET /api/hardware-baskets

// Fetch basket models
GET /api/hardware-baskets/{basketId}/models
```

### 5. Step 4 Enhancement: Capacity Validation
**File**: `frontend/src/components/Activity/ActivityWizard/Steps/Step4_CapacityValidation.tsx`

**Add Explicit Capacity Fields**:
- Required CPU cores (input)
- Required memory GB (input)
- Required storage TB (input)

**API Integration**:
```typescript
// Validate capacity
POST /api/v1/cluster-strategies/{strategyId}/validate-capacity
{
  "required_cpu_cores": 128,
  "required_memory_gb": 512,
  "required_storage_tb": 10
}

Response: {
  "is_valid": true,
  "cpu_validation": { ... },
  "memory_validation": { ... },
  "storage_validation": { ... },
  "status": "optimal" | "acceptable" | "warning" | "critical",
  "recommendations": []
}
```

**Visual Validation Cards** (from ClusterStrategyModal):
- Color-coded borders (green/yellow/red)
- Resource utilization metrics
- Progress bars
- Status badges

## Implementation Plan

### Phase 1: Modal Wrapper & Infrastructure (2-3 hours)
**Tasks**:
1. ✅ Create `ActivityWizardModal.tsx` wrapper component
2. ✅ Update WizardContext to support `mode` and `onComplete` callback
3. ✅ Update ActivityWizard.tsx to work in modal (remove full-page assumptions)
4. ✅ Add modal styling (max dimensions, scrolling, purple glass)
5. ✅ Test modal open/close behavior

**Files**:
- NEW: `frontend/src/components/Activity/ActivityWizardModal.tsx`
- UPDATE: `frontend/src/components/Activity/ActivityWizard/Context/WizardContext.tsx`
- UPDATE: `frontend/src/components/Activity/ActivityWizard/ActivityWizard.tsx`
- UPDATE: `frontend/src/styles/wizard.css` (add modal-specific styles)

### Phase 2: Integration with Project Views (1-2 hours)
**Tasks**:
1. ✅ Replace placeholder modal in ProjectDetailView.tsx with ActivityWizardModal
2. ✅ Replace EnhancedModal in ProjectWorkspaceView.tsx with ActivityWizardModal
3. ✅ Add modal state management (isWizardOpen, wizardMode)
4. ✅ Wire up "Add Activity" buttons to open modal
5. ✅ Handle success callback (refresh activities list)
6. ✅ Test create flow from all entry points

**Files**:
- UPDATE: `frontend/src/views/ProjectDetailView.tsx`
- UPDATE: `frontend/src/views/ProjectWorkspaceView.tsx`

### Phase 3: Edit Mode Implementation (2-3 hours)
**Tasks**:
1. ✅ Add `loadExistingActivity` to WizardContext
2. ✅ Implement activity data fetching API call
3. ✅ Pre-fill all wizard steps with existing data
4. ✅ Update API calls to use PUT instead of POST for edit mode
5. ✅ Update wizard header to show "Edit Activity"
6. ✅ Add activity ID to context state
7. ✅ Test edit flow

**Files**:
- UPDATE: `frontend/src/components/Activity/ActivityWizard/Context/WizardContext.tsx`
- UPDATE: `frontend/src/components/Activity/ActivityWizard/ActivityWizard.tsx`
- UPDATE: All step components to display pre-filled data

### Phase 4: Gantt Chart Edit Integration (1-2 hours)
**Tasks**:
1. ✅ Add modal state to ProjectDetailView (for Gantt)
2. ✅ Update GanttChart `onActivityClick` to open modal in edit mode
3. ✅ Update list view Edit buttons to open modal in edit mode
4. ✅ Pass activity ID to modal
5. ✅ Test edit from Gantt chart click
6. ✅ Test edit from list view button

**Files**:
- UPDATE: `frontend/src/views/ProjectDetailView.tsx`
- UPDATE: `frontend/src/components/GanttChart.tsx` (use `onActivityClick` prop)

### Phase 5: Merge ClusterStrategyModal Features - Step 2 (3-4 hours)
**Tasks**:
1. ✅ Add migration strategy type selection (conditional on activity type)
2. ✅ Add domino configuration section (conditional rendering)
3. ✅ Add hardware basket selection section (conditional rendering)
4. ✅ Add hardware pool allocations section (conditional rendering)
5. ✅ Implement API calls for clusters, baskets, models
6. ✅ Add loading states and spinners
7. ✅ Update form validation logic
8. ✅ Test all strategy type flows

**Files**:
- UPDATE: `frontend/src/components/Activity/ActivityWizard/Steps/Step2_SourceDestination.tsx`
- UPDATE: `frontend/src/components/Activity/ActivityWizard/types/WizardTypes.ts` (add new fields)

### Phase 6: Merge ClusterStrategyModal Features - Step 4 (2-3 hours)
**Tasks**:
1. ✅ Add explicit capacity requirement inputs (CPU, Memory, Storage)
2. ✅ Implement capacity validation API call
3. ✅ Create visual validation cards component
4. ✅ Add color-coded validation status
5. ✅ Add resource utilization progress bars
6. ✅ Add recommendations display
7. ✅ Test validation scenarios (optimal, warning, critical)

**Files**:
- UPDATE: `frontend/src/components/Activity/ActivityWizard/Steps/Step4_CapacityValidation.tsx`
- UPDATE: `frontend/src/components/Activity/ActivityWizard/types/WizardTypes.ts`

### Phase 7: Route Cleanup & Testing (1 hour)
**Tasks**:
1. ✅ Remove `/app/activities/wizard` route from App.tsx
2. ✅ Update any navigation links that pointed to old route
3. ✅ Add comprehensive E2E tests
4. ✅ Test all user flows:
   - Create from Timeline tab
   - Create from Activities tab
   - Create from empty state
   - Edit from Gantt chart click
   - Edit from list view button
5. ✅ Test draft resume functionality in modal
6. ✅ Test modal close/cancel behavior

**Files**:
- UPDATE: `frontend/src/App.tsx`
- NEW: E2E test files for modal flows

## Design Considerations

### Modal Dimensions
- **Width**: 90vw, max 1200px (accommodate 7-step progress bar)
- **Height**: 90vh, max 800px
- **Scrolling**: Content area scrollable, header/footer fixed
- **Mobile**: Full screen on small devices (<768px)

### Visual Consistency
- Maintain purple glass aesthetic from current wizard
- Use Fluent UI 2 Dialog/DialogSurface components
- Keep glassmorphic effects for modal backdrop
- Ensure form controls match existing design system

### State Management
- Modal state at parent component level (ProjectDetailView, ProjectWorkspaceView)
- Wizard state managed by WizardContext (unchanged)
- Auto-save continues to work in modal (drafts stored server-side)
- Draft expiration warnings still displayed

### User Experience
- **Escape key** closes modal (with confirmation if unsaved changes)
- **Click outside** closes modal (with confirmation if unsaved changes)
- **Success toast** on activity creation/update
- **Error handling** with clear messages
- **Loading states** during API calls
- **Optimistic updates** for smooth UX

## API Endpoints Summary

### Activity Wizard (Existing)
```
POST /api/v1/activities/wizard/start
PUT /api/v1/activities/{activityId}/wizard/progress
PUT /api/v1/activities/{activityId}/wizard/complete
GET /api/v1/activities/{activityId}/wizard/draft
```

### Activity CRUD (New for Edit Mode)
```
GET /api/v1/projects/{projectId}/activities/{activityId}
PUT /api/v1/projects/{projectId}/activities/{activityId}
```

### Cluster Strategy Features (Existing, to integrate)
```
GET /api/v1/enhanced-rvtools/projects/{projectId}/clusters
GET /api/hardware-baskets
GET /api/hardware-baskets/{basketId}/models
POST /api/v1/cluster-strategies/{strategyId}/validate-capacity
```

## Success Criteria

### Functional Requirements
- ✅ Modal opens from all "Add Activity" buttons
- ✅ Modal opens in edit mode from Gantt chart clicks
- ✅ Modal opens in edit mode from list view edit buttons
- ✅ All 7 wizard steps work correctly in modal
- ✅ Auto-save functionality preserved
- ✅ Draft resume works in modal
- ✅ Create flow completes successfully
- ✅ Edit flow updates existing activity
- ✅ Migration strategy features integrated (domino, procurement, pool)
- ✅ Capacity validation with visual feedback
- ✅ Hardware basket integration working
- ✅ Project clusters API integrated

### UX Requirements
- ✅ Modal is responsive (desktop, tablet, mobile)
- ✅ Close/cancel with confirmation if unsaved changes
- ✅ Success feedback after create/update
- ✅ Error handling with clear messages
- ✅ Loading states during API calls
- ✅ Purple glass aesthetic maintained
- ✅ Smooth animations and transitions

### Code Quality
- ✅ TypeScript types for all new interfaces
- ✅ Proper error handling and logging
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ No console errors or warnings
- ✅ Code follows existing patterns
- ✅ Comments and documentation updated

## Timeline Estimate

**Total Estimated Time**: 12-18 hours (1.5 - 2 days)

- Phase 1: 2-3 hours
- Phase 2: 1-2 hours
- Phase 3: 2-3 hours
- Phase 4: 1-2 hours
- Phase 5: 3-4 hours
- Phase 6: 2-3 hours
- Phase 7: 1 hour

## Risks & Mitigation

### Risk 1: State Management Complexity
**Risk**: Modal state + wizard state + parent component state may conflict  
**Mitigation**: Clear separation of concerns, use existing WizardContext, minimal prop drilling

### Risk 2: API Integration Issues
**Risk**: Backend endpoints may not support all required operations  
**Mitigation**: Test API endpoints early, implement graceful fallbacks, add proper error handling

### Risk 3: Breaking Existing Functionality
**Risk**: Changing wizard structure may break existing features  
**Mitigation**: Incremental changes, extensive testing, maintain backward compatibility where possible

### Risk 4: UX Degradation
**Risk**: Modal may feel cramped or hard to use  
**Mitigation**: Generous dimensions (90vw × 90vh), proper scrolling, mobile-first approach

### Risk 5: Draft Resume Confusion
**Risk**: Users may not understand how drafts work in modal context  
**Mitigation**: Clear messaging, auto-resume on open, expiration warnings

## Future Enhancements (Out of Scope)

1. **Multi-Activity Creation**: Create multiple activities in one session
2. **Templates**: Save/load activity templates for common patterns
3. **Bulk Edit**: Edit multiple activities at once
4. **Activity Duplication**: Clone existing activity as starting point
5. **Collaborative Editing**: Real-time updates when multiple users edit
6. **Version History**: Track changes to activities over time
7. **Advanced Validation**: Cross-activity dependency validation
8. **Smart Suggestions**: AI-powered recommendations for capacity/timeline

## Conclusion

This plan provides a comprehensive roadmap for converting the Activity Wizard to a modal-based implementation while merging critical features from the ClusterStrategyModal. The phased approach ensures incremental progress with testable milestones at each stage.

**Key Benefits**:
- ✅ Improved UX: Create/edit activities without leaving project view
- ✅ Context preservation: Gantt chart and activities remain visible
- ✅ Feature completeness: All cluster strategy options available
- ✅ Consistency: Single source of truth for activity management
- ✅ Maintainability: Consolidate similar functionality

**Next Steps**:
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate through phases with testing at each milestone
5. Deploy and gather user feedback
