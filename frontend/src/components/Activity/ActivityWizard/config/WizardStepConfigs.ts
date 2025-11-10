/**
 * Wizard Step Configurations
 * 
 * Defines activity-type-specific step flows, field labels, and validation rules.
 * This is the "single source of truth" for conditional wizard behavior.
 * 
 * PROBLEM SOLVED:
 * - Before: All activity types showed all 7 steps with migration-centric labels
 * - After: Each activity type shows only relevant steps with context-appropriate labels
 * 
 * DESIGN PRINCIPLES:
 * - DRY: Shared config structure prevents duplicate conditional logic across components
 * - YAGNI: Only steps actually needed for each activity type are defined
 * - KISS: Simple mapping object, easy to understand and maintain
 */

import { ActivityType } from '../types/WizardTypes';

// ============================================================================
// Step Metadata Interface
// ============================================================================

export interface StepMetadata {
  step: number;
  title: string;
  description: string;
  component: string;  // Component name for reference
  isRequired: boolean;
}

// ============================================================================
// Field Label Configuration
// ============================================================================

export interface FieldLabels {
  // Step 2: Source/Destination fields
  clusterField?: string;
  clusterHelperText?: string;
  targetInfraLabel?: string;
  targetInfraHelperText?: string;
  targetClusterLabel?: string;
  targetClusterHelperText?: string;
  
  // Step 3: Hardware Compatibility
  hardwareValidationTitle?: string;
  hardwareValidationDescription?: string;
  
  // Step 5: Timeline
  timelineTitle?: string;
  timelineDescription?: string;
}

// ============================================================================
// Validation Rules Configuration
// ============================================================================

export interface ValidationRules {
  step2: {
    requireSourceCluster: boolean;
    requireTargetInfrastructure: boolean;
    requireTargetClusterName: boolean;
    requireMigrationStrategy: boolean;
  };
  step3: {
    runHardwareCompatibility: boolean;
    requireCompatibilityPass: boolean;
  };
  step4: {
    requireCapacityValidation: boolean;
  };
}

// ============================================================================
// Activity-Type-Specific Configuration
// ============================================================================

export interface WizardStepConfig {
  activityType: ActivityType;
  totalSteps: number;
  steps: StepMetadata[];
  fieldLabels: FieldLabels;
  validationRules: ValidationRules;
}

// ============================================================================
// STEP CONFIGURATIONS BY ACTIVITY TYPE
// ============================================================================

/**
 * MIGRATION: Full 7-step wizard
 * - Migrating workloads from source cluster to new target cluster
 * - Requires all steps: source, target infra, hardware compat, capacity, timeline, team, review
 */
const MIGRATION_CONFIG: WizardStepConfig = {
  activityType: 'migration',
  totalSteps: 7,
  steps: [
    {
      step: 1,
      title: 'Activity Basics',
      description: 'Define the migration activity name and type',
      component: 'Step1_Basics',
      isRequired: true,
    },
    {
      step: 2,
      title: 'Source & Destination',
      description: 'Select source cluster and target infrastructure',
      component: 'Step2_SourceDestination',
      isRequired: true,
    },
    {
      step: 3,
      title: 'Hardware Compatibility',
      description: 'Validate hardware meets target infrastructure requirements',
      component: 'Step3_Infrastructure',
      isRequired: true,
    },
    {
      step: 4,
      title: 'Capacity Validation',
      description: 'Ensure sufficient resource capacity for workloads',
      component: 'Step4_CapacityValidation',
      isRequired: true,
    },
    {
      step: 5,
      title: 'Timeline Estimation',
      description: 'Calculate migration duration and critical path',
      component: 'Step5_Timeline',
      isRequired: true,
    },
    {
      step: 6,
      title: 'Team Assignment',
      description: 'Assign team members and schedule migration window',
      component: 'Step6_Assignment',
      isRequired: true,
    },
    {
      step: 7,
      title: 'Review & Submit',
      description: 'Review all details and create migration activity',
      component: 'Step7_Review',
      isRequired: true,
    },
  ],
  fieldLabels: {
    clusterField: 'Source Cluster',
    clusterHelperText: 'Select the cluster you\'re migrating from. This helps us analyze workload requirements.',
    targetInfraLabel: 'Target Infrastructure Type',
    targetInfraHelperText: 'Choose the infrastructure type for your new cluster. This determines hardware requirements and validation checks.',
    targetClusterLabel: 'Target Cluster Name',
    targetClusterHelperText: 'Provide a name for the new target cluster.',
    hardwareValidationTitle: 'Hardware Compatibility Check',
    hardwareValidationDescription: 'Validating that selected hardware meets target infrastructure requirements...',
    timelineTitle: 'Migration Timeline',
    timelineDescription: 'Estimated migration duration based on workload count and complexity.',
  },
  validationRules: {
    step2: {
      requireSourceCluster: true,
      requireTargetInfrastructure: true,
      requireTargetClusterName: true,
      requireMigrationStrategy: true,
    },
    step3: {
      runHardwareCompatibility: true,
      requireCompatibilityPass: true,
    },
    step4: {
      requireCapacityValidation: true,
    },
  },
};

/**
 * DECOMMISSION: Simplified 5-step wizard
 * - Retiring an existing cluster, no new infrastructure
 * - REMOVED: Target infrastructure (not applicable)
 * - REMOVED: Hardware compatibility (no new hardware)
 * - CHANGED: "Source Cluster" → "Cluster to Decommission"
 */
const DECOMMISSION_CONFIG: WizardStepConfig = {
  activityType: 'decommission',
  totalSteps: 5,
  steps: [
    {
      step: 1,
      title: 'Activity Basics',
      description: 'Define the decommission activity name',
      component: 'Step1_Basics',
      isRequired: true,
    },
    {
      step: 2,
      title: 'Cluster Selection',
      description: 'Select the cluster to decommission',
      component: 'Step2_SourceDestination',
      isRequired: true,
    },
    // SKIP Step 3: Hardware Compatibility (not applicable)
    {
      step: 3,
      title: 'Resource Inventory',
      description: 'Review current resource usage and dependencies',
      component: 'Step4_CapacityValidation',
      isRequired: true,
    },
    {
      step: 4,
      title: 'Decommission Timeline',
      description: 'Plan decommission timeline and downtime window',
      component: 'Step5_Timeline',
      isRequired: true,
    },
    {
      step: 5,
      title: 'Team Assignment',
      description: 'Assign team and schedule decommission',
      component: 'Step6_Assignment',
      isRequired: true,
    },
    {
      step: 6,
      title: 'Review & Submit',
      description: 'Review decommission plan and create activity',
      component: 'Step7_Review',
      isRequired: true,
    },
  ],
  fieldLabels: {
    clusterField: 'Cluster to Decommission',
    clusterHelperText: 'Select the cluster you\'re retiring. We\'ll analyze workloads and dependencies.',
    // NO target infrastructure fields (not applicable for decommission)
    hardwareValidationTitle: 'Resource Inventory',
    hardwareValidationDescription: 'Analyzing current workloads and resource usage...',
    timelineTitle: 'Decommission Timeline',
    timelineDescription: 'Estimated time to gracefully shut down and decommission the cluster.',
  },
  validationRules: {
    step2: {
      requireSourceCluster: true,  // This is the "target" cluster being decommissioned
      requireTargetInfrastructure: false,  // ❌ NOT APPLICABLE
      requireTargetClusterName: false,
      requireMigrationStrategy: false,
    },
    step3: {
      runHardwareCompatibility: false,  // ❌ NOT APPLICABLE (no new hardware)
      requireCompatibilityPass: false,
    },
    step4: {
      requireCapacityValidation: false,  // Changed to inventory check
    },
  },
};

/**
 * EXPANSION: 6-step wizard
 * - Adding capacity to an existing cluster
 * - REMOVED: Target infrastructure (expanding existing cluster)
 * - REMOVED: Source cluster (no migration source)
 * - CHANGED: Hardware selection for new nodes
 */
const EXPANSION_CONFIG: WizardStepConfig = {
  activityType: 'expansion',
  totalSteps: 6,
  steps: [
    {
      step: 1,
      title: 'Activity Basics',
      description: 'Define the expansion activity name',
      component: 'Step1_Basics',
      isRequired: true,
    },
    {
      step: 2,
      title: 'Cluster Selection',
      description: 'Select the cluster to expand',
      component: 'Step2_SourceDestination',
      isRequired: true,
    },
    {
      step: 3,
      title: 'Hardware Selection',
      description: 'Select additional hardware for expansion',
      component: 'Step3_Infrastructure',
      isRequired: true,
    },
    {
      step: 4,
      title: 'Capacity Planning',
      description: 'Calculate new total capacity after expansion',
      component: 'Step4_CapacityValidation',
      isRequired: true,
    },
    {
      step: 5,
      title: 'Expansion Timeline',
      description: 'Plan expansion timeline and maintenance window',
      component: 'Step5_Timeline',
      isRequired: true,
    },
    {
      step: 6,
      title: 'Team Assignment',
      description: 'Assign team and schedule expansion',
      component: 'Step6_Assignment',
      isRequired: true,
    },
    {
      step: 7,
      title: 'Review & Submit',
      description: 'Review expansion plan and create activity',
      component: 'Step7_Review',
      isRequired: true,
    },
  ],
  fieldLabels: {
    clusterField: 'Cluster to Expand',
    clusterHelperText: 'Select the existing cluster you\'re adding capacity to.',
    // NO target infrastructure (expanding existing cluster)
    hardwareValidationTitle: 'Hardware Compatibility',
    hardwareValidationDescription: 'Validating new hardware is compatible with existing cluster infrastructure...',
    timelineTitle: 'Expansion Timeline',
    timelineDescription: 'Estimated time to integrate new nodes into the cluster.',
  },
  validationRules: {
    step2: {
      requireSourceCluster: true,  // This is the existing cluster being expanded
      requireTargetInfrastructure: false,  // ❌ NOT APPLICABLE (using existing infra)
      requireTargetClusterName: false,
      requireMigrationStrategy: false,
    },
    step3: {
      runHardwareCompatibility: true,  // Need to validate compatibility with existing cluster
      requireCompatibilityPass: true,
    },
    step4: {
      requireCapacityValidation: true,
    },
  },
};

/**
 * MAINTENANCE: Simplified 4-step wizard
 * - Scheduled maintenance on existing cluster
 * - REMOVED: Target infrastructure, source cluster, hardware compatibility
 * - Focus: Timeline and team assignment
 */
const MAINTENANCE_CONFIG: WizardStepConfig = {
  activityType: 'maintenance',
  totalSteps: 4,
  steps: [
    {
      step: 1,
      title: 'Activity Basics',
      description: 'Define the maintenance activity name',
      component: 'Step1_Basics',
      isRequired: true,
    },
    {
      step: 2,
      title: 'Cluster Selection',
      description: 'Select the cluster for maintenance',
      component: 'Step2_SourceDestination',
      isRequired: true,
    },
    // SKIP Step 3: Hardware Compatibility (not applicable)
    // SKIP Step 4: Capacity Validation (not applicable)
    {
      step: 3,
      title: 'Maintenance Timeline',
      description: 'Plan maintenance window and downtime',
      component: 'Step5_Timeline',
      isRequired: true,
    },
    {
      step: 4,
      title: 'Team Assignment',
      description: 'Assign team and schedule maintenance window',
      component: 'Step6_Assignment',
      isRequired: true,
    },
    {
      step: 5,
      title: 'Review & Submit',
      description: 'Review maintenance plan and create activity',
      component: 'Step7_Review',
      isRequired: true,
    },
  ],
  fieldLabels: {
    clusterField: 'Cluster for Maintenance',
    clusterHelperText: 'Select the cluster requiring scheduled maintenance.',
    timelineTitle: 'Maintenance Window',
    timelineDescription: 'Planned maintenance duration and downtime estimate.',
  },
  validationRules: {
    step2: {
      requireSourceCluster: true,  // This is the cluster being maintained
      requireTargetInfrastructure: false,  // ❌ NOT APPLICABLE
      requireTargetClusterName: false,
      requireMigrationStrategy: false,
    },
    step3: {
      runHardwareCompatibility: false,  // ❌ NOT APPLICABLE
      requireCompatibilityPass: false,
    },
    step4: {
      requireCapacityValidation: false,
    },
  },
};

/**
 * LIFECYCLE: 6-step wizard
 * - Hardware refresh or infrastructure upgrade
 * - Similar to migration but focused on hardware lifecycle
 * - REMOVED: Migration strategy (using lifecycle-specific hardware selection)
 */
const LIFECYCLE_CONFIG: WizardStepConfig = {
  activityType: 'lifecycle',
  totalSteps: 6,
  steps: [
    {
      step: 1,
      title: 'Activity Basics',
      description: 'Define the lifecycle activity name',
      component: 'Step1_Basics',
      isRequired: true,
    },
    {
      step: 2,
      title: 'Cluster Selection',
      description: 'Select cluster for hardware lifecycle refresh',
      component: 'Step2_SourceDestination',
      isRequired: true,
    },
    {
      step: 3,
      title: 'Hardware Selection',
      description: 'Select replacement hardware for lifecycle refresh',
      component: 'Step3_Infrastructure',
      isRequired: true,
    },
    {
      step: 4,
      title: 'Capacity Validation',
      description: 'Validate replacement hardware meets requirements',
      component: 'Step4_CapacityValidation',
      isRequired: true,
    },
    {
      step: 5,
      title: 'Lifecycle Timeline',
      description: 'Plan hardware refresh timeline',
      component: 'Step5_Timeline',
      isRequired: true,
    },
    {
      step: 6,
      title: 'Team Assignment',
      description: 'Assign team and schedule lifecycle refresh',
      component: 'Step6_Assignment',
      isRequired: true,
    },
    {
      step: 7,
      title: 'Review & Submit',
      description: 'Review lifecycle plan and create activity',
      component: 'Step7_Review',
      isRequired: true,
    },
  ],
  fieldLabels: {
    clusterField: 'Cluster for Lifecycle Refresh',
    clusterHelperText: 'Select the cluster requiring hardware lifecycle refresh or upgrade.',
    targetInfraLabel: 'Target Infrastructure Type',
    targetInfraHelperText: 'Select the infrastructure type for the refreshed cluster.',
    hardwareValidationTitle: 'Hardware Compatibility',
    hardwareValidationDescription: 'Validating replacement hardware meets requirements...',
    timelineTitle: 'Lifecycle Timeline',
    timelineDescription: 'Estimated time to complete hardware lifecycle refresh.',
  },
  validationRules: {
    step2: {
      requireSourceCluster: true,
      requireTargetInfrastructure: true,
      requireTargetClusterName: false,
      requireMigrationStrategy: false,  // ❌ Use lifecycle-specific hardware selection instead
    },
    step3: {
      runHardwareCompatibility: true,
      requireCompatibilityPass: true,
    },
    step4: {
      requireCapacityValidation: true,
    },
  },
};

// ============================================================================
// Configuration Lookup Map
// ============================================================================

export const WIZARD_STEP_CONFIGS: Record<ActivityType, WizardStepConfig> = {
  migration: MIGRATION_CONFIG,
  decommission: DECOMMISSION_CONFIG,
  expansion: EXPANSION_CONFIG,
  maintenance: MAINTENANCE_CONFIG,
  lifecycle: LIFECYCLE_CONFIG,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get step configuration for a specific activity type
 */
export function getStepConfig(activityType: ActivityType): WizardStepConfig {
  return WIZARD_STEP_CONFIGS[activityType];
}

/**
 * Get field labels for a specific activity type
 */
export function getFieldLabels(activityType: ActivityType): FieldLabels {
  return WIZARD_STEP_CONFIGS[activityType].fieldLabels;
}

/**
 * Get validation rules for a specific activity type
 */
export function getValidationRules(activityType: ActivityType): ValidationRules {
  return WIZARD_STEP_CONFIGS[activityType].validationRules;
}

/**
 * Check if a specific step should be shown for the given activity type
 */
export function shouldShowStep(activityType: ActivityType, stepNumber: number): boolean {
  const config = WIZARD_STEP_CONFIGS[activityType];
  return stepNumber <= config.totalSteps;
}

/**
 * Get the total number of steps for a given activity type
 */
export function getTotalSteps(activityType: ActivityType): number {
  return WIZARD_STEP_CONFIGS[activityType].totalSteps;
}
