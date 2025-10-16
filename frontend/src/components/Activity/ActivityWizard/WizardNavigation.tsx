/**
 * WizardNavigation - Navigation buttons for wizard
 * 
 * Features:
 * - Back button (disabled on first step)
 * - Next button (disabled if step invalid or last step)
 * - Save Draft button (manual save)
 * - Submit button (only on last step)
 */

import React, { useState } from 'react';
import { 
  Button, 
  makeStyles, 
  shorthands, 
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  SaveRegular,
  CheckmarkCircleFilled,
} from '@fluentui/react-icons';
import { useWizardContext } from './Context/WizardContext';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },

  leftButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },

  rightButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },

  button: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 500,
  },

  buttonPrimary: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 600,
  },

  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorPaletteGreenBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorPaletteGreenBorder1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorPaletteGreenForeground2,
    fontSize: '14px',
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 500,
  },
});

// ============================================================================
// Component
// ============================================================================

const WizardNavigation: React.FC = () => {
  const styles = useStyles();
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
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <CheckmarkCircleFilled style={{ fontSize: '20px' }} />
          Activity created successfully! Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Left Side - Back Button */}
      <div className={styles.leftButtons}>
        <Button
          appearance="secondary"
          icon={<ArrowLeftRegular />}
          onClick={handleBack}
          disabled={isFirstStep || isSaving || isSubmitting}
          className={styles.button}
        >
          Back
        </Button>
      </div>

      {/* Right Side - Save Draft, Next/Submit */}
      <div className={styles.rightButtons}>
        {/* Save Draft Button */}
        <Button
          appearance="subtle"
          icon={<SaveRegular />}
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting}
          className={styles.button}
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
            className={styles.buttonPrimary}
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
            className={styles.buttonPrimary}
          >
            Next
          </Button>
        )}
      </div>

      {/* Success Message (for Save Draft) */}
      {showSuccess && !isLastStep && (
        <div className={styles.successMessage} style={{ marginLeft: 'auto' }}>
          <CheckmarkCircleFilled style={{ fontSize: '16px' }} />
          Draft saved!
        </div>
      )}
    </div>
  );
};

export default WizardNavigation;
