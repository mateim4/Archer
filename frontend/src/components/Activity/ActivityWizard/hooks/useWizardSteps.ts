/**
 * useWizardSteps Hook
 * 
 * Computes visible wizard steps dynamically based on selected activity type.
 * This hook is the "engine" that drives conditional step rendering.
 * 
 * USAGE:
 * ```tsx
 * const { visibleSteps, totalSteps, fieldLabels, validationRules } = useWizardSteps(activityType);
 * ```
 * 
 * BENEFITS:
 * - Single source of truth for step visibility logic
 * - Prevents hardcoded step counts across components
 * - Easy to extend for new activity types
 */

import { useMemo } from 'react';
import { ActivityType } from '../types/WizardTypes';
import {
  getStepConfig,
  getFieldLabels,
  getValidationRules,
  getTotalSteps,
  StepMetadata,
  FieldLabels,
  ValidationRules,
} from '../config/WizardStepConfigs';

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseWizardStepsReturn {
  visibleSteps: StepMetadata[];
  totalSteps: number;
  fieldLabels: FieldLabels;
  validationRules: ValidationRules;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook to get activity-type-specific wizard steps and configuration
 * 
 * @param activityType - The selected activity type (migration, decommission, etc.)
 * @returns Visible steps, total step count, field labels, and validation rules
 */
export function useWizardSteps(activityType: ActivityType | undefined): UseWizardStepsReturn {
  // Memoize the step configuration to prevent unnecessary recalculations
  const stepConfig = useMemo(() => {
    // Default to migration if no activity type selected yet (Step 1 incomplete)
    const type = activityType || 'migration';
    return getStepConfig(type);
  }, [activityType]);

  const visibleSteps = useMemo(() => {
    return stepConfig.steps;
  }, [stepConfig]);

  const totalSteps = useMemo(() => {
    return stepConfig.totalSteps;
  }, [stepConfig]);

  const fieldLabels = useMemo(() => {
    return stepConfig.fieldLabels;
  }, [stepConfig]);

  const validationRules = useMemo(() => {
    return stepConfig.validationRules;
  }, [stepConfig]);

  return {
    visibleSteps,
    totalSteps,
    fieldLabels,
    validationRules,
  };
}
