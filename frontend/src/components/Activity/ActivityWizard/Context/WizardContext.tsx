/**
 * Wizard Context - State management for Activity Wizard
 * 
 * Provides:
 * - Step navigation (now activity-type-aware)
 * - Form data management
 * - Auto-save functionality
 * - Draft resume
 * - API integration
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  WizardContextValue,
  WizardFormData,
  WizardState,
  StepInfo,
  StartWizardRequest,
  StartWizardResponse,
  SaveProgressRequest,
  CompleteWizardRequest,
  Activity,
} from '../types/WizardTypes';
import { getStepConfig, getTotalSteps } from '../config/WizardStepConfigs';

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

// ============================================================================
// API Helper Functions
// ============================================================================

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    if (response.status === 410) {
      throw new Error('DRAFT_EXPIRED');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================================
// Wizard Provider Component
// ============================================================================

export type WizardMode = 'create' | 'edit';

interface WizardProviderProps {
  children: React.ReactNode;
  initialActivityId?: string;  // For resuming drafts or editing
  mode?: WizardMode;  // Create or edit mode
  projectId?: string;  // Project ID for context
  onComplete?: (activityId: string) => void;  // Success callback
  onUnsavedChanges?: (hasChanges: boolean) => void;  // Unsaved changes callback
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ 
  children, 
  initialActivityId,
  mode = 'create',
  projectId,
  onComplete,
  onUnsavedChanges,
}) => {
  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [wizardMode] = useState<WizardMode>(mode);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formDataRef = useRef(formData); // For auto-save debounce

  // Keep ref in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // ============================================================================
  // Auto-Save Logic (30-second debounce)
  // ============================================================================

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (activityId && formDataRef.current) {
        try {
          setIsSaving(true);
          const wizardState: WizardState = {
            current_step: currentStep,
            ...formDataRef.current,
          };

          await apiPut(`/wizard/${activityId}/progress`, {
            wizard_state: wizardState,
          } as SaveProgressRequest);

          setLastSavedAt(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 30000); // 30 seconds
  }, [activityId, currentStep]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Step Navigation
  // ============================================================================

  const goToStep = useCallback((step: number) => {
    // Get total steps for current activity type (default to 7 if not selected yet)
    const activityType = formDataRef.current.step1?.activity_type;
    const maxSteps = activityType ? getTotalSteps(activityType) : 7;
    
    if (step >= 1 && step <= maxSteps) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    const activityType = formDataRef.current.step1?.activity_type;
    const maxSteps = activityType ? getTotalSteps(activityType) : 7;
    
    if (currentStep < maxSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const canGoNext = useCallback(() => {
    const activityType = formDataRef.current.step1?.activity_type;
    const maxSteps = activityType ? getTotalSteps(activityType) : 7;
    
    return validateStep(currentStep) && currentStep < maxSteps;
  }, [currentStep, formData]);

  const canGoPrevious = useCallback(() => {
    return currentStep > 1;
  }, [currentStep]);

  // ============================================================================
  // Data Management
  // ============================================================================

  const updateStepData = useCallback((step: number, data: any) => {
    setFormData(prev => ({
      ...prev,
      [`step${step}`]: data,
    }));

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    if (onUnsavedChanges) {
      onUnsavedChanges(true);
    }

    // Trigger auto-save after update
    triggerAutoSave();
  }, [triggerAutoSave, onUnsavedChanges]);

  const saveProgress = useCallback(async () => {
    if (!activityId) {
      console.error('Cannot save progress: No activity ID');
      return;
    }

    try {
      setIsSaving(true);
      const wizardState: WizardState = {
        current_step: currentStep,
        ...formData,
      };

      await apiPut(`/wizard/${activityId}/progress`, {
        wizard_state: wizardState,
      } as SaveProgressRequest);

      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Save progress failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [activityId, currentStep, formData, onUnsavedChanges]);

  const completeWizard = useCallback(async () => {
    if (!activityId) {
      throw new Error('Cannot complete wizard: No activity ID');
    }

    try {
      setIsLoading(true);
      const wizardData: WizardState = {
        current_step: 7,
        ...formData,
      };

      let result: Activity;
      
      if (wizardMode === 'edit') {
        // Edit mode: Update existing activity
        result = await apiPut<Activity>(`/activities/${activityId}`, {
          wizard_state: wizardData,
          // Include other activity properties as needed
          name: formData.step1?.activity_name,
          activity_type: formData.step1?.activity_type,
          description: formData.step1?.description,
        });
      } else {
        // Create mode: Complete wizard
        result = await apiPost<Activity>(`/wizard/${activityId}/complete`, {
          wizard_data: wizardData,
        } as CompleteWizardRequest);
      }

      // Wizard completed successfully
      console.log(`Wizard ${wizardMode === 'edit' ? 'updated' : 'completed'}:`, result);
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      if (onUnsavedChanges) {
        onUnsavedChanges(false);
      }
      
      // Call success callback
      if (onComplete) {
        onComplete(activityId);
      }
      
      return result;
    } catch (error) {
      console.error(`${wizardMode === 'edit' ? 'Update' : 'Complete'} wizard failed:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activityId, formData, wizardMode, onComplete, onUnsavedChanges]);

  // ============================================================================
  // Draft Management
  // ============================================================================

  const resumeDraft = useCallback(async (draftActivityId: string) => {
    try {
      setIsLoading(true);
      const activity = await apiGet<Activity>(`/wizard/${draftActivityId}/draft`);

      if (activity.wizard_state) {
        const { current_step, ...stepData } = activity.wizard_state;
        setCurrentStep(current_step || 1);
        setFormData(stepData);
      }

      setActivityId(draftActivityId);
      
      if (activity.expires_at) {
        setExpiresAt(new Date(activity.expires_at));
      }
    } catch (error: any) {
      if (error.message === 'DRAFT_EXPIRED') {
        throw new Error('This draft has expired. Please start a new activity.');
      }
      console.error('Resume draft failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExistingActivity = useCallback(async (existingActivityId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch the existing activity from the backend
      // Note: This assumes a GET endpoint exists for fetching activity details
      const activity = await apiGet<Activity>(`/activities/${existingActivityId}`);

      // Pre-fill wizard state from activity data
      if (activity.wizard_state) {
        const { current_step, ...stepData } = activity.wizard_state;
        // Start from step 1 in edit mode (user can navigate through all steps)
        setCurrentStep(1);
        setFormData(stepData);
      } else {
        // If no wizard_state, construct from activity properties
        setFormData({
          step1: {
            activity_name: activity.name || '',
            activity_type: activity.activity_type || 'migration',
            description: activity.description || '',
          },
          // Additional steps can be pre-filled based on available data
        });
        setCurrentStep(1);
      }

      setActivityId(existingActivityId);
      
      // No expiration for editing existing activities
      setExpiresAt(undefined);
      
      console.log('Loaded existing activity for editing:', existingActivityId);
    } catch (error) {
      console.error('Load existing activity failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.step1?.activity_name && formData.step1?.activity_type);
      case 2:
        return !!(formData.step2?.target_infrastructure_type);
      case 3:
        return !!(formData.step3?.hardware_specs && formData.step3.hardware_specs.length > 0);
      case 4:
        return !!(formData.step4?.target_hardware);
      case 5:
        return !!(formData.step5?.vm_count && formData.step5?.host_count);
      case 6:
        return true; // Optional step
      case 7:
        return !!(formData.step7?.reviewed);
      default:
        return false;
    }
  }, [formData]);

  const getStepCompletion = useCallback((): StepInfo[] => {
    // Get activity-type-specific step configuration
    const activityType = formDataRef.current.step1?.activity_type;
    const stepConfig = activityType ? getStepConfig(activityType) : getStepConfig('migration');
    
    // Build step info array from configuration
    return stepConfig.steps.map((step, index) => ({
      step: index + 1,  // 1-indexed for display
      title: step.title,
      description: step.description,
      isComplete: validateStep(index + 1),
      isActive: (index + 1) === currentStep,
    }));
  }, [currentStep, validateStep]);

  // ============================================================================
  // Initialize Wizard (Start New or Resume Draft)
  // ============================================================================

  useEffect(() => {
    const initializeWizard = async () => {
      if (initialActivityId && wizardMode === 'edit') {
        // Edit mode: Load existing activity
        try {
          await loadExistingActivity(initialActivityId);
        } catch (error) {
          console.error('Failed to load existing activity:', error);
        }
      } else if (initialActivityId && wizardMode === 'create') {
        // Resume draft mode
        try {
          await resumeDraft(initialActivityId);
        } catch (error) {
          console.error('Failed to resume draft:', error);
        }
      } else if (!activityId && formData.step1?.activity_name && wizardMode === 'create') {
        // Start new wizard (if step 1 data exists but no activity ID)
        try {
          setIsLoading(true);
          const request: StartWizardRequest = {
            name: formData.step1.activity_name,
            activity_type: formData.step1.activity_type,
          };

          const response = await apiPost<StartWizardResponse>('/wizard/start', request);
          setActivityId(response.activity_id);
          setExpiresAt(new Date(response.expires_at));
        } catch (error) {
          console.error('Failed to start wizard:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeWizard();
  }, [initialActivityId, wizardMode, loadExistingActivity, resumeDraft]); // Run when initialActivityId or mode changes

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: WizardContextValue = {
    // State
    activityId,
    currentStep,
    formData,
    isLoading,
    isSaving,
    lastSavedAt,
    expiresAt,
    mode: wizardMode,
    projectId,
    hasUnsavedChanges,

    // Navigation
    goToStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,

    // Data Management
    updateStepData,
    saveProgress,
    completeWizard,

    // Draft Management
    resumeDraft,
    loadExistingActivity,

    // Validation
    validateStep,
    getStepCompletion,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
};

// ============================================================================
// Custom Hook
// ============================================================================

export const useWizardContext = (): WizardContextValue => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizardContext must be used within a WizardProvider');
  }
  return context;
};
