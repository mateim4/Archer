/**
 * TypeScript types for Activity Wizard
 * Matches backend Rust models in backend/src/models/workflow.rs
 */

// ============================================================================
// Activity Types
// ============================================================================

export type ActivityType = 'migration' | 'lifecycle' | 'decommission' | 'expansion' | 'maintenance';

export type ActivityStatus = 
  | 'draft' 
  | 'planned' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'blocked' 
  | 'cancelled';

export type InfrastructureType = 'traditional' | 'hci_s2d' | 'azure_local';

// ============================================================================
// Core Activity Model
// ============================================================================

export interface Activity {
  id?: string;
  activity_type: ActivityType;
  status: ActivityStatus;
  name: string;
  description?: string;
  wizard_state?: WizardState;  // Stores step data for resume
  strategy_ids: string[];      // Links to ClusterStrategy records
  migration_metadata?: MigrationMetadata;
  assigned_to?: string;
  start_date?: string;         // ISO 8601 datetime
  end_date?: string;           // ISO 8601 datetime
  expires_at?: string;         // For draft cleanup (ISO 8601)
  created_at: string;          // ISO 8601 datetime
  updated_at: string;          // ISO 8601 datetime
}

// ============================================================================
// Wizard State (Stored in Activity.wizard_state)
// ============================================================================

export interface WizardState {
  current_step: number;        // 1-7
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
  step7?: Step7Data;
}

// Step-specific data interfaces
export interface Step1Data {
  activity_name: string;
  activity_type: ActivityType;
  description?: string;
}

export interface Step2Data {
  source_cluster_id?: string;
  source_cluster_name?: string;
  target_infrastructure_type: InfrastructureType;
  target_cluster_name?: string;
}

export interface Step3Data {
  hardware_specs: HardwareSpec[];
  compatibility_result?: HardwareCompatibilityResult;
}

export interface Step4Data {
  target_hardware: TargetHardware;
  overcommit_ratios: OvercommitRatios;
  capacity_result?: CapacityValidationResult;
}

export interface Step5Data {
  vm_count: number;
  host_count: number;
  timeline_result?: TimelineEstimationResult;
}

export interface Step6Data {
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  milestones?: Milestone[];
}

export interface Step7Data {
  reviewed: boolean;
  final_notes?: string;
}

// ============================================================================
// Migration Metadata
// ============================================================================

export interface MigrationMetadata {
  source_cluster_id?: string;
  target_cluster_name?: string;
  vm_count?: number;
  host_count?: number;
  total_workload_vcpu?: number;
  total_workload_memory_gb?: number;
  total_workload_storage_tb?: number;
}

// ============================================================================
// Hardware Compatibility Types
// ============================================================================

export interface HardwareSpec {
  host_name?: string;
  nics: string[];              // e.g., ["Intel X710 25GbE RoCE", ...]
  hba?: string;                // e.g., "LSI 9400-8i (HBA mode)"
  disks: string[];             // e.g., ["Samsung PM9A3 1.92TB NVMe", ...]
  network_speed_gbps: number;  // e.g., 10, 25, 100
}

export interface HardwareCompatibilityResult {
  status: CompatibilityStatus;
  checks: CompatibilityChecks;
  recommendations: string[];
  checked_at: string;          // ISO 8601 datetime
}

export type CompatibilityStatus = 'passed' | 'warnings' | 'failed';

export interface CompatibilityChecks {
  rdma_nics: CheckResult;
  jbod_hba: CheckResult;
  network_speed: CheckResult;
  jbod_disks: CheckResult;
}

export interface CheckResult {
  status: CheckStatus;
  message: string;
  severity: CheckSeverity;
  details?: string;
}

export type CheckStatus = 'passed' | 'warning' | 'failed' | 'not_applicable';
export type CheckSeverity = 'info' | 'warning' | 'error' | 'critical';

// ============================================================================
// Capacity Validation Types
// ============================================================================

export interface TargetHardware {
  host_count: number;
  cpu_per_host: number;        // Physical cores
  memory_per_host_gb: number;
  storage_per_host_tb: number;
}

export interface OvercommitRatios {
  cpu: number;                 // Default: 4.0 (4:1 ratio)
  memory: number;              // Default: 1.5 (1.5:1 ratio)
  storage: number;             // Default: 1.0 (no overcommit)
}

export interface CapacityValidationResult {
  overall_status: ValidationStatus;
  cpu: ResourceValidation;
  memory: ResourceValidation;
  storage: ResourceValidation;
  recommendations: string[];
  validated_at: string;        // ISO 8601 datetime
}

export type ValidationStatus = 'optimal' | 'acceptable' | 'warning' | 'critical';

export interface ResourceValidation {
  available: number;
  required: number;
  utilization_percent: number;
  status: ResourceStatus;
}

export type ResourceStatus = 'optimal' | 'acceptable' | 'warning' | 'critical';

// ============================================================================
// Timeline Estimation Types
// ============================================================================

export interface TimelineEstimationResult {
  total_days: number;
  prep_days: number;
  migration_days: number;
  validation_days: number;
  confidence: EstimationConfidence;
  tasks: TaskEstimate[];
  critical_path: string[];
  estimated_at: string;        // ISO 8601 datetime
}

export type EstimationConfidence = 'high' | 'medium' | 'low';

export interface TaskEstimate {
  name: string;
  duration_days: number;
  dependencies: string[];
  is_critical_path: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface StartWizardRequest {
  name: string;
  activity_type: ActivityType;
}

export interface StartWizardResponse {
  activity_id: string;
  expires_at: string;          // ISO 8601 datetime
}

export interface SaveProgressRequest {
  wizard_state: WizardState;
}

export interface CompleteWizardRequest {
  wizard_data: WizardState;
}

export interface CompatibilityCheckRequest {
  infrastructure_type: InfrastructureType;
  hardware_specs: HardwareSpec[];
}

export interface CapacityValidationRequest {
  source_cluster_id: string;
  target_hardware: TargetHardware;
  overcommit_ratios: OvercommitRatios;
}

export interface TimelineEstimationRequest {
  vm_count: number;
  host_count: number;
  infrastructure_type: InfrastructureType;
  has_compatibility_issues: boolean;
}

// ============================================================================
// UI-Specific Types
// ============================================================================

export interface Milestone {
  id: string;
  name: string;
  date: string;               // ISO 8601 datetime
  completed: boolean;
}

export interface WizardFormData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
  step7?: Step7Data;
}

export interface ActivityTypeOption {
  type: ActivityType;
  label: string;
  description: string;
  icon: string;               // Icon name from Fluent UI
  color: string;              // Brand color for the card
}

// ============================================================================
// Wizard Navigation Types
// ============================================================================

export interface StepInfo {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

export interface WizardContextValue {
  // State
  activityId?: string;
  currentStep: number;
  formData: WizardFormData;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt?: Date;
  expiresAt?: Date;
  mode?: 'create' | 'edit';
  projectId?: string;
  hasUnsavedChanges?: boolean;
  
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  
  // Data Management
  updateStepData: (step: number, data: any) => void;
  saveProgress: () => Promise<void>;
  completeWizard: () => Promise<Activity | undefined>;
  
  // Draft Management
  resumeDraft: (activityId: string) => Promise<void>;
  
  // Validation
  validateStep: (step: number) => boolean;
  getStepCompletion: () => StepInfo[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DraftInfo {
  activity_id: string;
  expires_at: string;
  days_remaining: number;
  is_expired: boolean;
}
