import { useState, useEffect, useCallback } from 'react';

export interface WizardState<T> {
  /** Current step index (0-based) */
  currentStep: number;
  /** Form data for all steps */
  data: T;
  /** Timestamp of last save */
  lastSaved?: number;
  /** Version identifier */
  version: string;
}

export interface UseWizardPersistenceOptions<T> {
  /** Unique key for localStorage */
  storageKey: string;
  /** Initial data */
  initialData: T;
  /** Version identifier for data migration */
  version?: string;
  /** Auto-save interval in milliseconds (0 = disabled) */
  autoSaveInterval?: number;
  /** Data validator function */
  validator?: (data: T) => boolean;
  /** Migration function for old data versions */
  migrator?: (oldData: any, oldVersion: string) => T;
}

/**
 * Hook for persisting wizard state to localStorage
 * Provides auto-save, data validation, and resume functionality
 */
export function useWizardPersistence<T extends Record<string, any>>({
  storageKey,
  initialData,
  version = '1.0.0',
  autoSaveInterval = 5000,
  validator,
  migrator
}: UseWizardPersistenceOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasSavedState, setHasSavedState] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: WizardState<T> = JSON.parse(saved);
        
        // Check version and migrate if needed
        if (parsed.version !== version && migrator) {
          const migrated = migrator(parsed.data, parsed.version);
          if (validator ? validator(migrated) : true) {
            setData(migrated);
            setCurrentStep(parsed.currentStep);
            setHasSavedState(true);
          }
        } else if (validator ? validator(parsed.data) : true) {
          setData(parsed.data);
          setCurrentStep(parsed.currentStep);
          setHasSavedState(true);
        }
      }
    } catch (error) {
      console.error('Failed to load wizard state from localStorage:', error);
    }
  }, [storageKey, version, validator, migrator]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveInterval || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveState();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [data, currentStep, hasUnsavedChanges, autoSaveInterval]);

  /** Save current state to localStorage */
  const saveState = useCallback(() => {
    try {
      const state: WizardState<T> = {
        currentStep,
        data,
        lastSaved: Date.now(),
        version
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
      setHasUnsavedChanges(false);
      setHasSavedState(true);
    } catch (error) {
      console.error('Failed to save wizard state to localStorage:', error);
    }
  }, [storageKey, currentStep, data, version]);

  /** Clear saved state from localStorage */
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSavedState(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to clear wizard state from localStorage:', error);
    }
  }, [storageKey]);

  /** Update wizard data */
  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  /** Go to next step */
  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
    setHasUnsavedChanges(true);
  }, []);

  /** Go to previous step */
  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    setHasUnsavedChanges(true);
  }, []);

  /** Go to specific step */
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    setHasUnsavedChanges(true);
  }, []);

  /** Reset wizard to initial state */
  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
    setHasUnsavedChanges(false);
  }, [initialData]);

  return {
    // State
    currentStep,
    data,
    hasUnsavedChanges,
    hasSavedState,
    
    // Actions
    updateData,
    nextStep,
    previousStep,
    goToStep,
    saveState,
    clearState,
    reset
  };
}

export default useWizardPersistence;
