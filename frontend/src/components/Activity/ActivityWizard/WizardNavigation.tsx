/**
 * WizardNavigation - Navigation buttons for wizard
 * 
 * Features:
 * - Back button (disabled on first step)
 * - Next button (disabled if step invalid or last step)
 * - Save Draft button (manual save)
 * - Submit button (only on last step)
 * 
 * Now using wizard.css design system classes
 */

import React, { useState } from 'react';
import { Button } from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  SaveRegular,
  CheckmarkCircleFilled,
} from '@fluentui/react-icons';
import { useWizardContext } from './Context/WizardContext';

// ============================================================================
// Component
// ============================================================================

const WizardNavigation: React.FC = () => {
  const {
    currentStep,
    canGoNext,
    canGoPrevious,
    nextStep,
    previousStep,
    saveProgress,
    completeWizard,
    isSaving,
  } = useWizardContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isLastStep = currentStep === 7;
  const isFirstStep = currentStep === 1;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleBack = () => {
    if (canGoPrevious()) {
      previousStep();
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      nextStep();
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveProgress();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
    } catch (error) {
      console.error('Failed to save draft:', error);
      // TODO: Show error toast
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const activity = await completeWizard();
      console.log('Activity created:', activity);
      
      // TODO: Navigate to activity detail page or show success modal
      // For now, just show success message
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (showSuccess && isLastStep) {
    return (
      <div className="wizard-navigation">
        <div className="wizard-success-box">
          <CheckmarkCircleFilled style={{ fontSize: '20px' }} />
          Activity created successfully! Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-navigation">
      {/* Left Side - Back Button */}
      <div className="wizard-nav-group">
        <Button
          appearance="secondary"
          icon={<ArrowLeftRegular />}
          onClick={handleBack}
          disabled={isFirstStep || isSaving || isSubmitting}
        >
          Back
        </Button>
      </div>

      {/* Right Side - Save Draft, Next/Submit */}
      <div className="wizard-nav-group">
        {/* Save Draft Button */}
        <Button
          appearance="subtle"
          icon={<SaveRegular />}
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>

        {/* Next or Submit Button */}
        {isLastStep ? (
          <Button
            appearance="primary"
            icon={<CheckmarkCircleFilled />}
            onClick={handleSubmit}
            disabled={!canGoNext() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit & Create Activity'}
          </Button>
        ) : (
          <Button
            appearance="primary"
            icon={<ArrowRightRegular />}
            iconPosition="after"
            onClick={handleNext}
            disabled={!canGoNext() || isSaving || isSubmitting}
          >
            Next
          </Button>
        )}
      </div>

      {/* Success Message (for Save Draft) */}
      {showSuccess && !isLastStep && (
        <div className="wizard-save-indicator" style={{ marginLeft: 'auto' }}>
          <CheckmarkCircleFilled style={{ fontSize: '16px' }} />
          Draft saved!
        </div>
      )}
    </div>
  );
};

export default WizardNavigation;
