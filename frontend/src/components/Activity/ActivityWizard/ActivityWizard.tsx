/**
 * ActivityWizard - Main wizard container
 * 
 * Dynamic multi-step wizard for creating activities (migration, decommission, expansion, etc.)
 * Step count and fields adapt based on selected activity type:
 * - Migration: 7 steps (full wizard)
 * - Decommission: 5 steps (no target infrastructure, no hardware compat)
 * - Expansion: 6 steps (no target infrastructure)
 * - Maintenance: 4 steps (minimal fields)
 * - Lifecycle: 6 steps (hardware refresh focus)
 */

import React from 'react';
import { PurpleGlassCard } from '../../ui';
import { useWizardContext } from './Context/WizardContext';
import { useWizardStyles } from '../../../hooks/useWizardStyles';
import { tokens } from '../../../styles/design-tokens';
import { useWizardSteps } from './hooks/useWizardSteps';
import WizardProgress from './WizardProgress';
import WizardNavigation from './WizardNavigation';

// Step components
import Step1_Basics from './Steps/Step1_Basics';
import Step2_SourceDestination from './Steps/Step2_SourceDestination';
import Step3_Infrastructure from './Steps/Step3_Infrastructure';
import Step4_CapacityValidation from './Steps/Step4_CapacityValidation';
import Step5_Timeline from './Steps/Step5_Timeline';
import Step6_Assignment from './Steps/Step6_Assignment';
import Step7_Review from './Steps/Step7_Review';

// ============================================================================
// Wizard Content Component (uses context)
// ============================================================================

const WizardContent: React.FC = () => {
  const styles = useWizardStyles();
  const {
    currentStep,
    isSaving,
    lastSavedAt,
    expiresAt,
    mode,
    formData,
  } = useWizardContext();

  // Get activity-type-specific step configuration
  const activityType = formData.step1?.activity_type;
  const { visibleSteps, totalSteps } = useWizardSteps(activityType);

  // Calculate days until expiration
  const daysUntilExpiration = expiresAt 
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const showExpirationWarning = daysUntilExpiration !== null && daysUntilExpiration <= 7;

  // Get current step metadata from visible steps
  // Note: visibleSteps array is 0-indexed, but currentStep is 1-indexed
  const currentStepInfo = visibleSteps[currentStep - 1] || {
    title: 'Activity Basics',
    description: 'Define the activity name and type',
  };
  
  // Determine if we're in a modal
  const isInModal = mode === 'create' || mode === 'edit';

  const cardContent = (
    <>
      {/* Header with Title */}
      <div className={isInModal ? styles.headerModal : styles.header}>
        <h1 className={styles.title}>
          {mode === 'create' ? 'Create New Activity' : 'Edit Activity'}
        </h1>

        {/* Save Indicator */}
        {lastSavedAt && (
          <div className={styles.saveIndicator}>
            <div 
              className={styles.saveIndicatorIcon}
              style={{
                backgroundColor: isSaving 
                  ? tokens.colorStatusWarning 
                  : tokens.colorStatusSuccess
              }}
            />
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <span>
                Last saved at {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Expiration Warning */}
        {showExpirationWarning && (
          <div className={styles.warningBox}>
            ⚠️ Draft expires in {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'}. 
            Please complete or it will be automatically deleted.
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <WizardProgress />

      {/* Step Content */}
      <div className={styles.stepContainerWrapper}>
        <h2 className={styles.stepTitle}>{currentStepInfo.title}</h2>
        <p className={styles.stepSubtitle}>{currentStepInfo.description}</p>

        {/* Render step component */}
        {currentStep === 1 && <Step1_Basics />}
        {currentStep === 2 && <Step2_SourceDestination />}
        {currentStep === 3 && <Step3_Infrastructure />}
        {currentStep === 4 && <Step4_CapacityValidation />}
        {currentStep === 5 && <Step5_Timeline />}
        {currentStep === 6 && <Step6_Assignment />}
        {currentStep === 7 && <Step7_Review />}
      </div>

      {/* Navigation */}
      <WizardNavigation />
    </>
  );

  return (
    <div className={isInModal ? styles.containerModal : styles.container}>
      {isInModal ? (
        <PurpleGlassCard
          glass
          variant="elevated"
          padding="none"
          fullWidth
          className={styles.cardModal}
        >
          {cardContent}
        </PurpleGlassCard>
      ) : (
        <div className={styles.mainCard}>{cardContent}</div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component Export
// ============================================================================

/**
 * ActivityWizard - expects WizardProvider to be wrapped by parent
 * (ActivityWizardModal or direct route)
 */
const ActivityWizard: React.FC = () => {
  return <WizardContent />;
};

export default ActivityWizard;
