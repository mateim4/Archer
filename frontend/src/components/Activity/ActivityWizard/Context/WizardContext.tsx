/**
 * Wizard Context - State management for Activity Wizard
 * 
 * Provides:
 * - Step navigation
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

interface WizardProviderProps {
  children: React.ReactNode;
  initialActivityId?: string;  // For resuming drafts
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children, initialActivityId }) => {
  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  
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
    if (step >= 1 && step <= 7) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const canGoNext = useCallback(() => {
    return validateStep(currentStep) && currentStep < 7;
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

    // Trigger auto-save after update
    triggerAutoSave();
  }, [triggerAutoSave]);

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
    } catch (error) {
      console.error('Save progress failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [activityId, currentStep, formData]);

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

      const result = await apiPost<Activity>(`/wizard/${activityId}/complete`, {
        wizard_data: wizardData,
      } as CompleteWizardRequest);

      // Wizard completed successfully
      console.log('Wizard completed:', result);
      return result;
    } catch (error) {
      console.error('Complete wizard failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activityId, formData]);

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
    const steps: StepInfo[] = [
      { step: 1, title: 'Activity Basics', description: 'Name and type', isComplete: false, isActive: false },
      { step: 2, title: 'Source & Destination', description: 'Clusters and infrastructure', isComplete: false, isActive: false },
      { step: 3, title: 'Hardware Compatibility', description: 'Validate hardware', isComplete: false, isActive: false },
      { step: 4, title: 'Capacity Validation', description: 'Check resource capacity', isComplete: false, isActive: false },
      { step: 5, title: 'Timeline Estimation', description: 'Calculate duration', isComplete: false, isActive: false },
      { step: 6, title: 'Team Assignment', description: 'Assign team and dates', isComplete: false, isActive: false },
      { step: 7, title: 'Review & Submit', description: 'Final review', isComplete: false, isActive: false },
    ];

    return steps.map(stepInfo => ({
      ...stepInfo,
      isComplete: validateStep(stepInfo.step),
      isActive: stepInfo.step === currentStep,
    }));
  }, [currentStep, validateStep]);

  // ============================================================================
  // Initialize Wizard (Start New or Resume Draft)
  // ============================================================================

  useEffect(() => {
    const initializeWizard = async () => {
      if (initialActivityId) {
        // Resume draft mode
        try {
          await resumeDraft(initialActivityId);
        } catch (error) {
          console.error('Failed to resume draft:', error);
        }
      } else if (!activityId && formData.step1?.activity_name) {
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
  }, [initialActivityId]); // Only run on mount with initialActivityId

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
