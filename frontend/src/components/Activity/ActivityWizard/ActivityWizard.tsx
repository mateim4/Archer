/**
 * ActivityWizard - Main wizard container
 * 
 * 7-step guided wizard for creating migration activities:
 * 1. Activity Basics (name, type)
 * 2. Source/Destination (clusters, infrastructure)
 * 3. Hardware Compatibility (validation)
 * 4. Capacity Validation (resource check)
 * 5. Timeline Estimation (duration)
 * 6. Team Assignment (people, dates)
 * 7. Review & Submit (final confirmation)
 */

import React from 'react';
import { PurpleGlassCard } from '../../ui';
import { useWizardContext } from './Context/WizardContext';
import { useWizardStyles } from '../../../hooks/useWizardStyles';
import { tokens } from '../../../styles/design-tokens';
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
  } = useWizardContext();

  // Calculate days until expiration
  const daysUntilExpiration = expiresAt 
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const showExpirationWarning = daysUntilExpiration !== null && daysUntilExpiration <= 7;

  // Step metadata
  const stepInfo = [
    { step: 1, title: 'Activity Basics', description: 'Define the activity name and type' },
    { step: 2, title: 'Source & Destination', description: 'Select source cluster and target infrastructure' },
    { step: 3, title: 'Hardware Compatibility', description: 'Validate hardware meets requirements' },
    { step: 4, title: 'Capacity Validation', description: 'Ensure sufficient resource capacity' },
    { step: 5, title: 'Timeline Estimation', description: 'Calculate migration duration' },
    { step: 6, title: 'Team Assignment', description: 'Assign team members and schedule' },
    { step: 7, title: 'Review & Submit', description: 'Review all details and create activity' },
  ];

  const currentStepInfo = stepInfo[currentStep - 1];
  
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
