# Activity Creation Wizard - Integration Plan

**Date:** October 16, 2025  
**Status:** 📋 Planning Phase  
**Product Manager & UX Designer Analysis**

---

## Executive Summary

Transform activity creation from a simple form into an intelligent, wizard-based multi-step flow that guides users through complex infrastructure planning decisions. The wizard adapts based on activity type, validates technical requirements in real-time, and produces actionable execution strategies.

---

## 🎯 Business Goals

1. **Reduce Planning Errors** - Guide users through complex decisions with validation
2. **Accelerate Project Setup** - Structured workflow vs. scattered information gathering
3. **Ensure Technical Feasibility** - Automated compatibility and capacity checks
4. **Enable Better Tracking** - Link strategies to activities for end-to-end visibility
5. **Improve User Confidence** - Clear feedback on hardware compatibility and capacity

---

## 📊 User Request Analysis

### What the User Wants:
1. **Wizard-based activity creation** with type-specific flows
2. **Migration workflow** with:
   - Source cluster selection (from RVTools)
   - Destination hardware strategy (pool/new/domino)
   - Cluster type selection (Traditional/HCI/Azure Local)
   - Automated hardware compatibility checks
   - Hardware selection
   - Capacity validation
   - Timeline calculation
   - User assignment
3. **Data persistence** at each step
4. **Visual representation** via strategy swimlane under Gantt chart

### Key Observations:
- ✅ **Good:** Structured approach prevents missed requirements
- ✅ **Good:** Validation catches issues early
- ⚠️ **Concern:** 9 steps may be too many (user fatigue)
- ⚠️ **Concern:** Mixing planning (activity) with execution (strategy)
- ⚠️ **Concern:** No clear handling of draft/incomplete wizards

---

## 🎨 UX Design Recommendations

### 1. Wizard Flow Optimization

**Original Proposal:** 9 steps for migration
**Recommendation:** Consolidate to 7 steps

#### Optimized Migration Wizard:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Activity Basics                                     │
│ ├─ Activity Name                                            │
│ └─ Activity Type Selection (Migration)                      │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Source & Destination                                │
│ ├─ Source Cluster (from RVTools)                           │
│ ├─ Target Cluster Name                                      │
│ └─ Destination Hardware Strategy                            │
│    • From Hardware Pool                                     │
│    • New Hardware Purchase                                  │
│    • Domino Swap from Another Cluster                       │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Infrastructure Configuration                        │
│ ├─ Cluster Type Selection                                   │
│ │  • Traditional (SAN/NAS)                                  │
│ │  • HCI with Storage Spaces Direct                         │
│ │  • Azure Stack HCI / Azure Local                          │
│ └─ Automated Compatibility Check (real-time)                │
│    ✓ RDMA NICs detected                                    │
│    ✓ JBOD-capable HBA found                                │
│    ✓ 10Gbit+ ports available                               │
│    ⚠ Warning: JBOD disks not detected                      │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Hardware Selection                                  │
│ ├─ [If New Purchase] Select from Hardware Basket          │
│ ├─ [If Domino] Select Source Cluster to Free              │
│ ├─ [If Pool] Select from Available Hardware               │
│ └─ Specify Quantity & Configuration                        │
├─────────────────────────────────────────────────────────────┤
│ Step 5: Capacity Validation                                 │
│ ├─ Workload Analysis (from RVTools)                        │
│ ├─ Resource Requirements                                    │
│ │  • CPU: 240 vCPUs required → 280 available ✓            │
│ │  • Memory: 1.2TB required → 1.5TB available ✓           │
│ │  • Storage: 15TB required → 20TB available ✓            │
│ └─ Overcommit Ratios & Recommendations                     │
├─────────────────────────────────────────────────────────────┤
│ Step 6: Timeline & Resources                                │
│ ├─ Start Date                                               │
│ ├─ Estimated Duration (auto-calculated)                     │
│ ├─ Task Breakdown                                           │
│ │  • Pre-migration prep: 2 days                            │
│ │  • Hardware installation: 3 days                         │
│ │  • VM migration: 5 days                                  │
│ │  • Validation & cutover: 2 days                          │
│ └─ Assign Team Members to Tasks                            │
├─────────────────────────────────────────────────────────────┤
│ Step 7: Review & Confirm                                    │
│ ├─ Strategy Summary                                         │
│ ├─ Validation Results                                       │
│ ├─ Timeline Preview                                         │
│ ├─ Team Assignments                                         │
│ └─ [Create Activity & Strategy] Button                      │
└─────────────────────────────────────────────────────────────┘
```

**Key Improvements:**
- Combined source/destination into one step
- Infrastructure type and compatibility check together
- Clear hardware selection based on strategy choice
- Capacity validation focused on results, not process
- Timeline shows auto-calculated breakdown
- Final review before commit

### 2. Activity Type-Specific Flows

#### 🔄 MIGRATION (7 steps)
*As detailed above*

#### 📊 LIFECYCLE REFRESH (6 steps)
```
1. Activity Basics (name)
2. Scope Selection
   • Select clusters to analyze
   • EOL/Refresh criteria
3. Current State Analysis
   • Hardware age & EOL dates
   • Performance metrics
   • Cost analysis
4. Refresh Strategy
   • Target infrastructure type
   • Hardware recommendations (automated)
5. Budget & Timeline
   • Cost estimates per cluster
   • Phased rollout plan
6. Review & Confirm
```

#### 🗑️ DECOMMISSION (5 steps)
```
1. Activity Basics (name)
2. Target Selection
   • Clusters/hosts to decommission
   • Workload inventory
3. Workload Migration Plan
   • Destination for each VM/workload
   • Migration strategy
4. Hardware Disposition
   • Add to pool
   • Use in domino swap
   • Dispose/recycle
5. Review & Confirm
```

#### 📈 EXPANSION (5 steps)
```
1. Activity Basics (name)
2. Target Cluster & Requirements
   • Which cluster to expand
   • Additional capacity needed
3. Hardware Selection
   • New hardware purchase
   • From pool
4. Integration Planning
   • Installation timeline
   • Validation steps
5. Review & Confirm
```

#### 🔧 MAINTENANCE (4 steps)
```
1. Activity Basics (name)
2. Scope & Type
   • Target clusters/hosts
   • Maintenance type (patching/firmware/hardware)
3. Downtime Planning
   • Maintenance windows
   • Rollback strategy
4. Review & Confirm
```

### 3. Progressive Disclosure Pattern

**Principle:** Show information when needed, not all at once

```typescript
// Example: Hardware Compatibility Check
interface CompatibilityCheckUI {
  // Initial state: Loading
  status: 'loading' | 'passed' | 'passed_with_warnings' | 'failed';
  
  // Collapsed view (default)
  summary: {
    icon: '✓' | '⚠' | '✗';
    message: 'All checks passed' | '2 warnings' | '3 issues found';
    color: 'green' | 'yellow' | 'red';
  };
  
  // Expanded view (on click)
  details: {
    rdma_nics: CheckResult;
    jbod_hba: CheckResult;
    network_speed: CheckResult;
    jbod_disks: CheckResult;
  };
  
  // Recommendations (if warnings/failures)
  recommendations?: string[];
  
  // Override option (if user wants to proceed anyway)
  canOverride: boolean;
}
```

### 4. Draft State Management

**Critical Feature:** Users must be able to save and continue later

```typescript
interface WizardDraft {
  id: string;
  activity_id: string; // Created immediately after Step 1
  current_step: number;
  completed_steps: number[];
  wizard_data: WizardFormData;
  last_saved: Date;
  auto_delete_after: Date; // 30 days from last edit
}
```

**UX Flow:**
1. User completes Step 1 → Activity created with status="draft"
2. Each subsequent step → Auto-save wizard progress
3. User closes wizard → "Save Draft" confirmation
4. User returns → "Continue where you left off" prompt
5. After 30 days → Auto-delete draft with notification

---

## 🏗️ Technical Architecture

### Data Model Changes

#### Enhanced Activity Model
```typescript
interface Activity {
  // Existing fields
  id: string;
  project_id: string;
  name: string;
  description?: string;
  type: ActivityType; // NEW: migration | lifecycle | decommission | expansion | maintenance
  status: ActivityStatus; // NEW: draft | planned | in_progress | completed | blocked
  start_date: Date;
  end_date: Date;
  assignees: string[];
  dependencies: string[];
  progress: number;
  
  // NEW: Strategy integration
  strategy_id?: string;
  strategy_summary?: StrategySummary;
  
  // NEW: Migration metadata (for automatic calculations)
  migration_metadata?: {
    source_cluster: string;
    target_cluster: string;
    total_vms: number;
    total_hosts: number;
    estimated_duration_days: number;
    hardware_strategy: 'pool' | 'new' | 'domino';
  };
  
  // NEW: Wizard state
  wizard_draft?: {
    current_step: number;
    wizard_data: Record<string, any>;
    last_saved: Date;
  };
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

type ActivityType = 
  | 'migration' 
  | 'lifecycle' 
  | 'decommission' 
  | 'expansion' 
  | 'maintenance';

type ActivityStatus = 
  | 'draft'       // Wizard not completed
  | 'planned'     // Ready to start
  | 'in_progress' 
  | 'completed' 
  | 'blocked'     // Dependencies not met
  | 'cancelled';
```

#### Enhanced ClusterStrategy Model
```typescript
interface ClusterStrategy {
  // Existing fields
  id: string;
  project_id: string;
  activity_id: string; // NEW: Backlink to activity
  source_cluster_name: string;
  target_cluster_name: string;
  strategy_type: 'domino_hardware_swap' | 'new_hardware_purchase' | 'existing_free_hardware';
  
  // Domino fields
  domino_source_cluster?: string;
  hardware_available_date?: string;
  
  // Procurement fields
  hardware_basket_id?: string; // NEW
  hardware_basket_items?: string[];
  hardware_models?: HardwareModel[]; // NEW
  
  // Existing hardware fields
  hardware_pool_allocations?: string[];
  
  // NEW: Infrastructure configuration
  infrastructure_type: 'traditional' | 'hci_s2d' | 'azure_local';
  
  // NEW: Compatibility checks
  compatibility_checks: HardwareCompatibilityResult;
  
  // NEW: Capacity validation
  capacity_validation: CapacityValidationResult;
  
  // Capacity requirements
  required_cpu_cores?: number;
  required_memory_gb?: number;
  required_storage_tb?: number;
  
  // Timeline
  planned_start_date?: string;
  planned_completion_date?: string;
  
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface HardwareCompatibilityResult {
  status: 'passed' | 'passed_with_warnings' | 'failed';
  checks: {
    rdma_nics: CheckResult;
    jbod_hba: CheckResult;
    network_speed: CheckResult;
    jbod_disks: CheckResult;
  };
  recommendations: string[];
  can_proceed: boolean;
}

interface CheckResult {
  status: 'passed' | 'warning' | 'failed';
  message: string;
  details?: any;
}

interface CapacityValidationResult {
  status: 'optimal' | 'acceptable' | 'warning' | 'critical';
  cpu: ResourceValidation;
  memory: ResourceValidation;
  storage: ResourceValidation;
  overcommit_ratios: {
    cpu: number;
    memory: number;
    storage: number;
  };
  recommendations: string[];
}

interface ResourceValidation {
  required: number;
  available: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'critical';
  message: string;
}
```

#### NEW: StrategySummary Model (for quick display)
```typescript
interface StrategySummary {
  strategy_id: string;
  source_cluster: string;
  target_cluster: string;
  infrastructure_type: 'traditional' | 'hci_s2d' | 'azure_local';
  hardware_strategy: 'pool' | 'new' | 'domino';
  host_count: number;
  vm_count: number;
  capacity_status: 'optimal' | 'acceptable' | 'warning' | 'critical';
  compatibility_status: 'passed' | 'warnings' | 'failed';
  estimated_duration_days: number;
}
```

---

## 🔌 Backend Implementation

### New API Endpoints

#### 1. Wizard Management
```rust
// Create draft activity (Step 1)
POST /api/v1/projects/:project_id/activities/wizard/start
Request: {
  name: string;
  type: ActivityType;
}
Response: {
  activity_id: string;
  wizard_session_id: string;
}

// Save wizard progress
PUT /api/v1/activities/:activity_id/wizard/progress
Request: {
  current_step: number;
  wizard_data: Record<string, any>;
}
Response: {
  saved: boolean;
  last_saved: Date;
}

// Get wizard draft
GET /api/v1/activities/:activity_id/wizard/draft
Response: {
  activity_id: string;
  current_step: number;
  wizard_data: Record<string, any>;
  last_saved: Date;
}

// Complete wizard (Step 7)
POST /api/v1/activities/:activity_id/wizard/complete
Request: {
  wizard_data: CompleteWizardData;
}
Response: {
  activity: Activity;
  strategy: ClusterStrategy;
}
```

#### 2. Hardware Compatibility Validation
```rust
// Run compatibility checks for HCI
POST /api/v1/rvtools/:upload_id/compatibility/check
Request: {
  source_cluster: string;
  target_infrastructure_type: 'traditional' | 'hci_s2d' | 'azure_local';
}
Response: {
  status: 'passed' | 'passed_with_warnings' | 'failed';
  checks: {
    rdma_nics: CheckResult;
    jbod_hba: CheckResult;
    network_speed: CheckResult;
    jbod_disks: CheckResult;
  };
  recommendations: string[];
  can_proceed: boolean;
}
```

#### 3. Capacity Validation
```rust
// Validate capacity for hardware selection
POST /api/v1/strategies/capacity/validate
Request: {
  source_cluster: string;
  target_hardware: HardwareSpec[];
  overcommit_ratios: {
    cpu: number;
    memory: number;
    storage: number;
  };
}
Response: {
  status: 'optimal' | 'acceptable' | 'warning' | 'critical';
  cpu: ResourceValidation;
  memory: ResourceValidation;
  storage: ResourceValidation;
  recommendations: string[];
}
```

#### 4. Timeline Estimation
```rust
// Calculate estimated timeline
POST /api/v1/activities/timeline/estimate
Request: {
  activity_type: ActivityType;
  source_cluster: string;
  vm_count: number;
  host_count: number;
  hardware_strategy: 'pool' | 'new' | 'domino';
  start_date: Date;
}
Response: {
  estimated_duration_days: number;
  task_breakdown: TaskEstimate[];
  critical_path: string[];
  suggested_end_date: Date;
}

interface TaskEstimate {
  task_name: string;
  duration_days: number;
  dependencies: string[];
  assignable: boolean;
}
```

### Backend Service Layer

```rust
// New service: WizardService
pub struct WizardService {
    db: Database,
    rvtools_service: EnhancedRvToolsService,
    strategy_service: ClusterStrategyService,
}

impl WizardService {
    pub async fn create_draft_activity(
        &self,
        project_id: Thing,
        name: String,
        activity_type: ActivityType,
    ) -> Result<Activity>;

    pub async fn save_wizard_progress(
        &self,
        activity_id: Thing,
        step: u32,
        data: Value,
    ) -> Result<()>;

    pub async fn complete_wizard(
        &self,
        activity_id: Thing,
        wizard_data: CompleteWizardData,
    ) -> Result<(Activity, ClusterStrategy)>;
}

// New service: HardwareCompatibilityService
pub struct HardwareCompatibilityService {
    db: Database,
    rvtools_service: EnhancedRvToolsService,
}

impl HardwareCompatibilityService {
    pub async fn check_hci_compatibility(
        &self,
        upload_id: Thing,
        cluster_name: String,
    ) -> Result<HardwareCompatibilityResult>;

    async fn check_rdma_nics(&self, cluster: &Cluster) -> CheckResult;
    async fn check_jbod_hba(&self, cluster: &Cluster) -> CheckResult;
    async fn check_network_speed(&self, cluster: &Cluster) -> CheckResult;
    async fn check_jbod_disks(&self, cluster: &Cluster) -> CheckResult;
}

// New service: TimelineEstimationService
pub struct TimelineEstimationService {
    db: Database,
}

impl TimelineEstimationService {
    pub async fn estimate_migration_timeline(
        &self,
        vm_count: u32,
        host_count: u32,
        hardware_strategy: HardwareStrategy,
    ) -> Result<TimelineEstimate>;

    fn calculate_task_breakdown(&self, /* params */) -> Vec<TaskEstimate>;
    fn identify_critical_path(&self, tasks: &[TaskEstimate]) -> Vec<String>;
}
```

---

## 🎨 Frontend Implementation

### Component Structure

```
src/components/Activity/
├── ActivityWizard/
│   ├── ActivityWizard.tsx                 # Main wizard container
│   ├── WizardProgress.tsx                 # Progress indicator
│   ├── WizardNavigation.tsx               # Back/Next/Save Draft buttons
│   │
│   ├── Steps/
│   │   ├── Step1_Basics.tsx               # Name + Type
│   │   ├── Step2_SourceDestination.tsx    # Source cluster + hardware strategy
│   │   ├── Step3_Infrastructure.tsx       # Cluster type + compatibility
│   │   ├── Step4_HardwareSelection.tsx    # Select hardware
│   │   ├── Step5_CapacityValidation.tsx   # Capacity check
│   │   ├── Step6_Timeline.tsx             # Timeline + assignments
│   │   └── Step7_Review.tsx               # Final review
│   │
│   ├── Shared/
│   │   ├── CompatibilityChecker.tsx       # Real-time compatibility UI
│   │   ├── CapacityValidator.tsx          # Capacity validation UI
│   │   ├── HardwareSelector.tsx           # Hardware selection widget
│   │   └── TimelineCalculator.tsx         # Timeline estimation UI
│   │
│   └── types/
│       ├── WizardTypes.ts                 # TypeScript interfaces
│       └── WizardContext.ts               # React Context for wizard state
│
├── StrategySwimlane/
│   ├── StrategySwimlane.tsx               # Swimlane container
│   ├── StrategyCard.tsx                   # Individual strategy display
│   └── StrategyCardModal.tsx              # View/edit strategy details
│
└── ActivityTimeline/
    └── EnhancedTimelineView.tsx           # Timeline with swimlane
```

### Wizard State Management

```typescript
// WizardContext.tsx
interface WizardContextValue {
  // State
  activityId: string | null;
  currentStep: number;
  wizardData: WizardFormData;
  isDirty: boolean;
  isSaving: boolean;
  validationErrors: Record<string, string>;
  
  // Navigation
  goToStep: (step: number) => void;
  goNext: () => Promise<boolean>;
  goBack: () => void;
  
  // Data management
  updateStepData: (step: number, data: any) => void;
  saveDraft: () => Promise<void>;
  completeWizard: () => Promise<void>;
  
  // Validation
  validateCurrentStep: () => Promise<boolean>;
  
  // Data fetching
  projectClusters: string[];
  hardwareBaskets: HardwareBasket[];
  compatibilityResult: HardwareCompatibilityResult | null;
  capacityValidation: CapacityValidationResult | null;
}

interface WizardFormData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
  step7?: Step7Data;
}

interface Step1Data {
  activityName: string;
  activityType: ActivityType;
}

interface Step2Data {
  sourceCluster: string;
  targetClusterName: string;
  hardwareStrategy: 'pool' | 'new' | 'domino';
  dominoSourceCluster?: string;
}

interface Step3Data {
  infrastructureType: 'traditional' | 'hci_s2d' | 'azure_local';
  compatibilityOverride?: boolean; // If user wants to proceed despite warnings
}

interface Step4Data {
  hardwareBasketId?: string;
  selectedModels?: string[];
  hardwareQuantity?: number;
  poolHardware?: string[];
  dominoSourceCluster?: string;
}

interface Step5Data {
  capacityConfirmed: boolean;
  overcommitRatios?: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

interface Step6Data {
  startDate: Date;
  estimatedDuration: number;
  taskAssignments: TaskAssignment[];
}

interface Step7Data {
  reviewConfirmed: boolean;
  notes?: string;
}
```

### Main Wizard Component

```typescript
// ActivityWizard.tsx
export const ActivityWizard: React.FC<ActivityWizardProps> = ({
  projectId,
  existingActivityId,
  onComplete,
  onCancel,
}) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    activityId: existingActivityId || null,
    wizardData: {},
    isDirty: false,
  });
  
  // Auto-save on step completion
  useEffect(() => {
    if (wizardState.isDirty && wizardState.activityId) {
      const timer = setTimeout(() => {
        saveWizardProgress();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [wizardState]);
  
  const saveWizardProgress = async () => {
    if (!wizardState.activityId) return;
    
    await fetch(`/api/v1/activities/${wizardState.activityId}/wizard/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_step: wizardState.currentStep,
        wizard_data: wizardState.wizardData,
      }),
    });
    
    setWizardState(prev => ({ ...prev, isDirty: false }));
  };
  
  const handleStepComplete = async (stepData: any) => {
    // Update wizard data
    const updatedData = {
      ...wizardState.wizardData,
      [`step${wizardState.currentStep}`]: stepData,
    };
    
    setWizardState(prev => ({
      ...prev,
      wizardData: updatedData,
      isDirty: true,
    }));
    
    // If Step 1 and no activity ID, create draft activity
    if (wizardState.currentStep === 1 && !wizardState.activityId) {
      const response = await fetch(
        `/api/v1/projects/${projectId}/activities/wizard/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stepData),
        }
      );
      const { activity_id } = await response.json();
      setWizardState(prev => ({ ...prev, activityId: activity_id }));
    }
    
    // Move to next step
    setWizardState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };
  
  const renderStep = () => {
    switch (wizardState.currentStep) {
      case 1:
        return <Step1_Basics onComplete={handleStepComplete} />;
      case 2:
        return <Step2_SourceDestination onComplete={handleStepComplete} projectId={projectId} />;
      case 3:
        return <Step3_Infrastructure onComplete={handleStepComplete} />;
      case 4:
        return <Step4_HardwareSelection onComplete={handleStepComplete} />;
      case 5:
        return <Step5_CapacityValidation onComplete={handleStepComplete} />;
      case 6:
        return <Step6_Timeline onComplete={handleStepComplete} />;
      case 7:
        return <Step7_Review onComplete={handleCompleteWizard} wizardData={wizardState.wizardData} />;
      default:
        return null;
    }
  };
  
  return (
    <WizardContext.Provider value={wizardContextValue}>
      <Dialog open onOpenChange={onCancel}>
        <DialogSurface style={{ maxWidth: '900px', height: '80vh' }}>
          <DialogBody>
            <DialogTitle>Create New Activity</DialogTitle>
            
            <WizardProgress 
              currentStep={wizardState.currentStep} 
              totalSteps={7}
              activityType={wizardState.wizardData.step1?.activityType}
            />
            
            <DialogContent>
              {renderStep()}
            </DialogContent>
            
            <DialogActions>
              <WizardNavigation
                currentStep={wizardState.currentStep}
                onBack={() => setWizardState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))}
                onNext={handleStepComplete}
                onSaveDraft={saveWizardProgress}
                onCancel={onCancel}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </WizardContext.Provider>
  );
};
```

---

## 📊 Strategy Swimlane Implementation

### Visual Design

```typescript
// StrategySwimlane.tsx
export const StrategySwimlane: React.FC<StrategySwimlaneProps> = ({
  activities,
  strategies,
  timelineStart,
  timelineEnd,
}) => {
  return (
    <div className="strategy-swimlane">
      <div className="swimlane-header">
        <h3>Migration Strategies</h3>
        <Badge>
          {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
        </Badge>
      </div>
      
      <div className="swimlane-content">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            activity={activities.find(a => a.strategy_id === strategy.id)}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
          />
        ))}
      </div>
    </div>
  );
};

// StrategyCard.tsx
export const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  activity,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStrategyIcon = () => {
    switch (strategy.strategy_type) {
      case 'domino_hardware_swap': return '⚡';
      case 'new_hardware_purchase': return '🛒';
      case 'existing_free_hardware': return '📦';
    }
  };
  
  const getInfrastructureLabel = () => {
    switch (strategy.infrastructure_type) {
      case 'traditional': return 'Traditional SAN/NAS';
      case 'hci_s2d': return 'HCI with S2D';
      case 'azure_local': return 'Azure Stack HCI';
    }
  };
  
  const getStatusBadge = () => {
    const compatibility = strategy.compatibility_checks?.status;
    const capacity = strategy.capacity_validation?.status;
    
    if (compatibility === 'failed' || capacity === 'critical') {
      return <Badge color="danger">Issues</Badge>;
    }
    if (compatibility === 'passed_with_warnings' || capacity === 'warning') {
      return <Badge color="warning">Warnings</Badge>;
    }
    return <Badge color="success">Validated</Badge>;
  };
  
  return (
    <Card className="strategy-card" onClick={() => setIsExpanded(!isExpanded)}>
      <CardHeader>
        <div className="strategy-header">
          <span className="strategy-icon">{getStrategyIcon()}</span>
          <div className="strategy-title">
            <Text weight="semibold">
              {strategy.source_cluster_name} → {strategy.target_cluster_name}
            </Text>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        <div className="strategy-summary">
          <div className="metric">
            <ServerRegular />
            <Text>{strategy.migration_metadata?.total_hosts || 0} hosts</Text>
          </div>
          <div className="metric">
            <VirtualMachineRegular />
            <Text>{strategy.migration_metadata?.total_vms || 0} VMs</Text>
          </div>
          <div className="metric">
            <ClockRegular />
            <Text>{strategy.migration_metadata?.estimated_duration_days || 0} days</Text>
          </div>
        </div>
        
        <div className="infrastructure-type">
          <Text size={200}>{getInfrastructureLabel()}</Text>
        </div>
        
        {isExpanded && (
          <div className="strategy-details">
            <Divider />
            
            {/* Compatibility Checks */}
            {strategy.compatibility_checks && (
              <div className="compatibility-section">
                <Text weight="semibold">Hardware Compatibility</Text>
                <div className="check-results">
                  <CheckItem check={strategy.compatibility_checks.checks.rdma_nics} label="RDMA NICs" />
                  <CheckItem check={strategy.compatibility_checks.checks.jbod_hba} label="JBOD HBA" />
                  <CheckItem check={strategy.compatibility_checks.checks.network_speed} label="Network Speed" />
                  <CheckItem check={strategy.compatibility_checks.checks.jbod_disks} label="JBOD Disks" />
                </div>
              </div>
            )}
            
            {/* Capacity Validation */}
            {strategy.capacity_validation && (
              <div className="capacity-section">
                <Text weight="semibold">Capacity</Text>
                <ProgressBar value={strategy.capacity_validation.cpu.utilization_percent} label="CPU" />
                <ProgressBar value={strategy.capacity_validation.memory.utilization_percent} label="Memory" />
                <ProgressBar value={strategy.capacity_validation.storage.utilization_percent} label="Storage" />
              </div>
            )}
            
            <Button appearance="primary" onClick={() => openStrategyDetails(strategy.id)}>
              View Full Strategy
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
```

### CSS Styling

```css
/* StrategySwimlane.css */
.strategy-swimlane {
  margin-top: 24px;
  padding: 16px;
  background: var(--lcm-bg-secondary, #f5f5f5);
  border-radius: 8px;
  border-top: 3px solid var(--lcm-primary, #0078d4);
}

.swimlane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.swimlane-content {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.strategy-card {
  min-width: 320px;
  max-width: 400px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e5e7eb;
}

.strategy-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--lcm-primary, #0078d4);
}

.strategy-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.strategy-icon {
  font-size: 24px;
}

.strategy-summary {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.strategy-summary .metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #6b7280;
}

.infrastructure-type {
  margin-top: 8px;
  padding: 4px 8px;
  background: #e0f2fe;
  border-radius: 4px;
  display: inline-block;
}

.strategy-details {
  margin-top: 16px;
}

.check-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
```

---

## 🔄 Integration Workflow

### Phase 1: Backend Foundation (Week 1)
1. ✅ Create database schema updates
2. ✅ Implement Wizard API endpoints
3. ✅ Build HardwareCompatibilityService
4. ✅ Build TimelineEstimationService
5. ✅ Add capacity validation enhancements

### Phase 2: Frontend Wizard (Week 2-3)
1. ✅ Create wizard component structure
2. ✅ Implement Step 1-2 (Basics + Source/Destination)
3. ✅ Implement Step 3 (Infrastructure + Compatibility)
4. ✅ Implement Step 4 (Hardware Selection)
5. ✅ Implement Step 5 (Capacity Validation)
6. ✅ Implement Step 6 (Timeline)
7. ✅ Implement Step 7 (Review)
8. ✅ Add wizard state management
9. ✅ Add draft save/resume functionality

### Phase 3: Strategy Swimlane (Week 4)
1. ✅ Design swimlane component
2. ✅ Implement strategy cards
3. ✅ Add expand/collapse functionality
4. ✅ Integrate with timeline view
5. ✅ Add click-to-edit functionality

### Phase 4: Integration & Testing (Week 5)
1. ✅ Connect wizard to existing activity system
2. ✅ Test all activity type flows
3. ✅ Test draft save/resume
4. ✅ Test validation and error handling
5. ✅ Performance testing
6. ✅ User acceptance testing

### Phase 5: Polish & Documentation (Week 6)
1. ✅ UI/UX refinements
2. ✅ Add help text and tooltips
3. ✅ Update documentation
4. ✅ Create training materials
5. ✅ Final QA

---

## ❓ Questions & Decisions Needed

### Critical Decisions:

1. **Activity-Strategy Relationship**
   - **Question:** Can one activity have multiple strategies (e.g., migrate 3 clusters)?
   - **Recommendation:** Yes, 1-to-many. One migration project may involve multiple cluster migrations.
   - **Impact:** Need to handle multiple strategy cards per activity

2. **Wizard Complexity**
   - **Question:** Is 7 steps acceptable or should we aim for fewer?
   - **Current:** Migration = 7 steps, others = 4-6 steps
   - **Alternative:** Consolidate to 5 steps max with collapsible sections
   - **Recommendation:** Start with 7, get user feedback, optimize later

3. **Validation Blocking**
   - **Question:** Should failed compatibility checks block wizard completion?
   - **Recommendation:** No - show warnings, allow override with acknowledgment
   - **Reason:** Users may have additional context we don't

4. **Draft Persistence**
   - **Question:** How long should drafts be kept?
   - **Recommendation:** 30 days with auto-delete notification
   - **Reason:** Balance storage vs. user convenience

5. **Express Mode**
   - **Question:** Should we offer a "Quick Create" option for power users?
   - **Recommendation:** Phase 2 feature - focus on wizard first
   - **Reason:** Need to validate wizard flow before adding shortcuts

6. **Timeline Granularity**
   - **Question:** How detailed should auto-generated timelines be?
   - **Recommendation:** 
     - High-level phases (prep, execution, validation)
     - Task breakdown optional
     - Editable by user
   - **Reason:** Balance automation with flexibility

7. **Existing Data Migration**
   - **Question:** What happens to activities created before wizard?
   - **Recommendation:** 
     - Mark as "legacy" status
     - Show upgrade prompt to re-create with wizard
     - Don't force migration
   - **Reason:** Don't break existing workflows

8. **Strategy Editing**
   - **Question:** Can strategies be edited after activity creation?
   - **Recommendation:** Yes, with version history
   - **Impact:** Need to track strategy changes and their effects

---

## 🎯 Success Metrics

### User Experience Metrics:
- **Wizard Completion Rate:** Target >80%
- **Draft Resume Rate:** Target >60% of saved drafts
- **Validation Override Rate:** <20% (most checks should pass)
- **Time to Create Activity:** <10 minutes (vs. current ~20 minutes)

### Technical Metrics:
- **Wizard Load Time:** <2 seconds
- **Auto-save Latency:** <500ms
- **Compatibility Check Time:** <3 seconds
- **Capacity Validation Time:** <5 seconds

### Business Metrics:
- **Planning Errors Reduced:** Target -50%
- **Failed Migrations:** Target -30%
- **User Satisfaction:** Target >4.5/5
- **Feature Adoption:** Target >70% of users within 3 months

---

## 🚀 Next Steps

1. **Review this plan** with stakeholders
2. **Answer critical questions** (see section above)
3. **Approve or adjust** activity type flows
4. **Finalize data model** changes
5. **Begin Phase 1** implementation

---

## 📚 Appendix

### A. Activity Type Comparison Matrix

| Feature | Migration | Lifecycle | Decommission | Expansion | Maintenance |
|---------|-----------|-----------|--------------|-----------|-------------|
| Steps | 7 | 6 | 5 | 5 | 4 |
| RVTools Required | ✓ | ✓ | ✓ | ✓ | ✗ |
| Hardware Selection | ✓ | ✓ | ✗ | ✓ | ✗ |
| Compatibility Check | ✓ | ✓ | ✗ | ✓ | ✗ |
| Capacity Validation | ✓ | ✓ | ✗ | ✓ | ✗ |
| Timeline Auto-calc | ✓ | ✓ | ✓ | ✓ | ✓ |
| Workload Analysis | ✓ | ✓ | ✓ | ✗ | ✗ |

### B. Compatibility Check Criteria

#### HCI S2D Requirements:
- **RDMA NICs:** RoCE v2, iWARP, or InfiniBand
- **Network Speed:** 10 Gbps minimum, 25 Gbps recommended
- **JBOD HBA:** LSI/Broadcom/Microsemi HBA in HBA mode
- **Storage:** JBOD-attached disks (SAS/SATA/NVMe)

#### Azure Stack HCI Requirements (additional):
- **Firmware:** UEFI (not legacy BIOS)
- **CPU:** 2nd gen Intel Xeon Scalable or AMD EPYC or newer
- **TPM:** TPM 2.0 for security
- **Network:** RDMA mandatory

### C. Capacity Validation Rules

```typescript
const CAPACITY_THRESHOLDS = {
  optimal: {
    cpu: 0.7,    // 70% utilization
    memory: 0.8,  // 80% utilization
    storage: 0.7, // 70% utilization
  },
  acceptable: {
    cpu: 0.85,
    memory: 0.90,
    storage: 0.85,
  },
  warning: {
    cpu: 0.95,
    memory: 0.95,
    storage: 0.95,
  },
  // Above warning = critical
};

const RECOMMENDED_OVERCOMMIT = {
  cpu: 4.0,      // 4:1 for VDI/general workloads
  memory: 1.2,   // 1.2:1 conservative
  storage: 1.5,  // 1.5:1 with dedup/compression
};
```

---

**Document Status:** ✅ Ready for Review  
**Next Review Date:** TBD  
**Owner:** Product Team  
**Last Updated:** October 16, 2025
