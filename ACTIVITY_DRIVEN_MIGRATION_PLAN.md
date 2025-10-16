# Migration Integration via Activity-Driven Flow

## ✅ **APPROVED APPROACH**: Activities → Cluster Strategies

Based on user feedback, we're implementing an activity-driven approach where:
1. User creates/selects a project
2. User adds a "Migration" activity
3. Clicking on migration activity opens cluster strategy configuration
4. Multiple clusters can be added as sub-strategies under one migration activity
5. Timeline and dependencies flow naturally from existing activity system

---

## Implementation Design

### Architecture Overview

```
Project
├── Activities (existing)
│   ├── Migration Activity (type='migration')
│   │   └── onClick → Navigate to Cluster Strategy Manager
│   ├── Lifecycle Activity
│   ├── Decommission Activity
│   └── etc...
│
└── Cluster Strategies (new, linked to migration activities)
    ├── Strategy A: VMware-Web → HyperV-Web
    ├── Strategy B: VMware-App → HyperV-App (depends on A)
    └── Strategy C: VMware-DB → HyperV-DB (depends on B)
```

### Data Model Relationship

```typescript
// Existing Activity model
interface Activity {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | ...;
  start_date: Date;
  end_date: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  // NEW: Link to cluster strategies
  cluster_strategies?: string[]; // IDs of associated strategies
  migration_metadata?: {
    total_clusters: number;
    clusters_completed: number;
    hardware_source: 'new' | 'domino' | 'pool' | 'mixed';
  };
}

// New: Cluster Strategy (linked to activity)
interface ClusterStrategy {
  id: string;
  project_id: string;
  activity_id: string;  // Links back to migration activity
  strategy_name: string;
  source_cluster: string;
  target_cluster: string;
  strategy_type: 'NewHardware' | 'DominoSwap' | 'ExistingPool';
  // ... rest of existing fields
}
```

---

## User Flow

### Flow 1: Create New Migration

```
1. User opens project "VMware Migration Q1 2025"
2. Clicks "Add Activity"
3. Modal opens:
   - Name: "Migrate Production Clusters"
   - Type: [Migration] ← User selects this
   - Start: Feb 1, 2025
   - End: May 1, 2025
   - Assignee: John Doe
4. Clicks "Create Activity"
5. Activity appears in timeline
6. User clicks on migration activity card
7. **NEW**: Opens "Cluster Strategy Manager" view
   - Shows: "No clusters configured yet"
   - Button: "Add Cluster Strategy"
8. User configures strategies (existing ClusterStrategyModal)
9. Strategies appear as sub-items under activity
10. Activity progress auto-calculates from cluster completion
```

### Flow 2: View Migration Progress

```
Timeline View:
┌─────────────────────────────────────────────┐
│ 🔄 Migrate Production Clusters              │
│ Feb 1 - May 1, 2025 | John Doe              │
│ ▓▓▓▓▓▓▓░░░░░░░ 45% Complete                 │
│                                              │
│ Clusters: 3 configured, 1 completed         │
│ • VMware-Web → HyperV-Web (✅ Done)         │
│ • VMware-App → HyperV-App (🔄 In Progress) │
│ • VMware-DB  → HyperV-DB  (⏳ Pending)     │
│                                              │
│ [View Details] [Edit] [Delete]              │
└─────────────────────────────────────────────┘
```

### Flow 3: Domino Dependencies

```
User configures:
1. Strategy A: VMware-Web → HyperV-Web (New Hardware)
2. Strategy B: VMware-App → HyperV-App (Domino from HyperV-Web)
3. System detects: B depends on A completing first
4. Activity timeline shows:
   - Activity "Migrate Production" spans Feb-May
   - Sub-milestone: "Web cluster complete" (prerequisite for App)
   - Gantt chart shows dependency arrow: A → B
5. If Strategy A delayed → automatically updates Strategy B dates
6. Project overview shows: "⚠️ Migration blocked: Web cluster pending"
```

---

## Implementation Plan

### Phase 1: Activity Click Handler (1 hour)

**Goal**: Make migration activities clickable → navigate to strategy view

**Changes**:
```typescript
// In ProjectWorkspaceView.tsx
const handleActivityClick = (activity: Activity) => {
  if (activity.type === 'migration') {
    // Navigate to cluster strategy manager for this activity
    navigate(`/app/projects/${projectId}/activities/${activity.id}/cluster-strategies`);
  } else {
    // Existing behavior for other activity types
    setSelectedActivity(activity);
    setIsEditActivityModalOpen(true);
  }
};
```

**Files**:
- `frontend/src/views/ProjectWorkspaceView.tsx` - Add click handler
- `frontend/src/App.tsx` - Add new route

---

### Phase 2: Cluster Strategy Manager View (2 hours)

**Goal**: Create dedicated view for managing strategies within an activity

**New Component**: `ClusterStrategyManagerView.tsx`
```tsx
interface Props {
  projectId: string;
  activityId: string;
}

// Shows:
// - Activity header (name, dates, assignee)
// - Breadcrumb: Project > Activities > [Activity Name]
// - List of cluster strategies
// - Add/Edit/Delete strategy actions
// - Dependency validation
// - Progress rollup
```

**Features**:
- Reuse existing ClusterStrategyModal
- Reuse existing ClusterStrategyList
- Add activity context at top
- Show "Back to Project" button

---

### Phase 3: Link Strategies to Activities (2 hours)

**Goal**: Associate cluster strategies with their parent activity

**Backend Changes**:
```rust
// In cluster_strategy.rs
pub struct ConfigureStrategyRequest {
    pub activity_id: Option<String>, // NEW: Link to activity
    pub source_cluster_name: String,
    pub target_cluster_name: String,
    // ... rest of fields
}

// Modify routes to accept activity context
// POST /api/v1/projects/:project_id/activities/:activity_id/cluster-strategies
// GET  /api/v1/projects/:project_id/activities/:activity_id/cluster-strategies
```

**Frontend Changes**:
- Update API calls to include activity_id
- Filter strategies by activity
- Show activity context in UI

---

### Phase 4: Activity Progress Rollup (1 hour)

**Goal**: Auto-calculate activity progress from cluster strategies

**Logic**:
```typescript
// Calculate migration activity progress
const calculateMigrationProgress = (activityId: string): number => {
  const strategies = getStrategiesForActivity(activityId);
  const completed = strategies.filter(s => s.status === 'Completed').length;
  return (completed / strategies.length) * 100;
};

// Update activity when strategy status changes
const onStrategyStatusChange = (strategyId: string, newStatus: string) => {
  updateStrategy(strategyId, { status: newStatus });
  const activity = getParentActivity(strategyId);
  const newProgress = calculateMigrationProgress(activity.id);
  updateActivity(activity.id, { progress: newProgress });
};
```

---

### Phase 5: Timeline Integration (2 hours)

**Goal**: Show cluster strategies as sub-tasks in Gantt chart

**Gantt Chart Enhancement**:
```typescript
// Expand migration activities to show strategies
interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'activity' | 'cluster-strategy';
  parent?: string; // For hierarchical display
  dependencies: string[];
}

// When rendering migration activity:
// 1. Show parent activity bar
// 2. Show child strategy bars (indented)
// 3. Draw dependency arrows between strategies
// 4. Highlight critical path
```

**Visual Example**:
```
Timeline:
├─ Migrate Production Clusters ▓▓▓▓▓░░░░░░░ 45%
│  ├─ VMware-Web → HyperV-Web   ▓▓▓▓▓▓▓▓▓▓▓ 100% ✅
│  ├─ VMware-App → HyperV-App   ▓▓▓▓▓░░░░░░ 50%  🔄
│  └─ VMware-DB → HyperV-DB     ░░░░░░░░░░░ 0%   ⏳
│                                    ↑
│                                   (depends on App)
```

---

### Phase 6: Activity Summary Enhancement (1 hour)

**Goal**: Show migration metadata in activity cards

**Activity Card Enhancement**:
```tsx
<ActivityCard activity={activity}>
  {activity.type === 'migration' && (
    <div className="migration-summary">
      <div className="flex items-center gap-2">
        <ServerRegular className="w-4 h-4" />
        <span>{activity.cluster_strategies?.length || 0} clusters</span>
      </div>
      
      {activity.migration_metadata && (
        <>
          <div className="text-xs text-gray-600">
            {activity.migration_metadata.clusters_completed} / 
            {activity.migration_metadata.total_clusters} completed
          </div>
          
          <div className="flex gap-1 text-xs">
            {activity.migration_metadata.hardware_source === 'domino' && (
              <Badge>Domino Chain</Badge>
            )}
            {activity.migration_metadata.hardware_source === 'new' && (
              <Badge>New Hardware</Badge>
            )}
          </div>
        </>
      )}
    </div>
  )}
</ActivityCard>
```

---

### Phase 7: Quick Actions (30 minutes)

**Goal**: Provide shortcuts for common migration tasks

**Add to Activity Dropdown Menu**:
```
Migration Activity Actions:
• Configure Clusters       → Opens strategy manager
• Validate Dependencies    → Runs dependency check
• View Hardware Timeline   → Shows domino chain
• Generate Migration Plan  → Creates document
• Mark Activity Complete   → (only if all clusters done)
```

---

## Benefits of This Approach

### ✅ Natural User Flow
- Activities are the atomic unit users already understand
- Migration is just a specialized activity type
- No need to learn a new "hub" concept

### ✅ Timeline Integration
- Migration milestones appear in project Gantt chart
- Dependencies flow through existing system
- Progress tracking is unified

### ✅ Context Preservation
- Always clear which project/activity you're working on
- Breadcrumbs show hierarchy
- No navigation confusion

### ✅ Progressive Disclosure
- Simple projects: Just activities
- Complex migrations: Click activity → see detailed strategies
- Power users: Can still access full cluster configuration

### ✅ Reuse Existing UI
- Activity cards, modals, timeline already work
- Cluster strategy components slot in seamlessly
- Minimal new UI to learn

### ✅ Data Model Clarity
- Activity = high-level work item
- Cluster Strategy = technical implementation detail
- Clean parent-child relationship

---

## Migration Path

### What to Remove
- ❌ Standalone "Migration Hub" route (`/app/projects/:id/migration-workspace`)
- ❌ "Migration Hub" button in project header
- ❌ Standalone ProjectMigrationWorkspace view (or repurpose as ClusterStrategyManagerView)

### What to Keep
- ✅ All backend API endpoints (just adjust routing)
- ✅ ClusterStrategyModal component
- ✅ ClusterStrategyList component
- ✅ DominoConfigurationSection component
- ✅ Dependency validation logic
- ✅ Hardware timeline generation

### What to Add
- ➕ Activity click handler for migration type
- ➕ ClusterStrategyManagerView (wraps existing components)
- ➕ Activity-to-strategy linking in backend
- ➕ Progress rollup calculation
- ➕ Gantt chart sub-task rendering

---

## Estimated Effort

| Phase | Description | Time | Priority |
|-------|-------------|------|----------|
| 1 | Activity click handler | 1h | High |
| 2 | Cluster Strategy Manager view | 2h | High |
| 3 | Link strategies to activities | 2h | High |
| 4 | Activity progress rollup | 1h | Medium |
| 5 | Timeline/Gantt integration | 2h | Medium |
| 6 | Activity summary enhancement | 1h | Low |
| 7 | Quick actions | 0.5h | Low |

**Total**: ~9.5 hours for full implementation
**MVP** (Phases 1-3): ~5 hours

---

## Alternative: Simpler "Details View"

If full integration is too complex initially, we could do a **lightweight version**:

1. **Keep existing flow**: Activity creation/editing works as-is
2. **Add "Configure" button**: On migration activity cards, show "Configure Clusters"
3. **Modal overlay**: Opens ClusterStrategyModal in overlay mode
4. **Associate on save**: Strategy automatically linked to activity
5. **Show count**: Activity card shows "3 clusters configured"

**Pros**: Faster to implement (~3 hours)
**Cons**: Less integrated, strategies still feel separate

---

## Questions for Implementation

1. **Should we implement full integration (9.5h) or lightweight version (3h)?**
2. **Priority order**: Which phases are must-have vs nice-to-have?
3. **Activity model changes**: Can we modify existing Activity interface or need migration?
4. **Gantt chart**: Do we have access to the existing Gantt component to extend it?
5. **Backward compatibility**: Do you have existing migration activities that need migration?

---

## Next Steps

**Awaiting confirmation on:**
1. ✅ Proceed with activity-driven approach
2. ⏳ Full integration vs lightweight version
3. ⏳ Priority phases to implement
4. ⏳ Any specific UX requirements

Once confirmed, I can begin implementation starting with Phase 1 (click handler).

---

*Document created: October 16, 2025*
*Status: Implementation plan ready, awaiting go-ahead*
