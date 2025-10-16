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

import React, { useEffect } from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { WizardProvider, useWizardContext } from './Context/WizardContext';
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
// Styles - Using wizard.css design system classes
// ============================================================================

const useStyles = makeStyles({
  // Minimal styles - most styling comes from wizard.css
  saveIndicatorIcon: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  
  saveIndicatorSaving: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },
});

// ============================================================================
// Wizard Content Component (uses context)
// ============================================================================

const WizardContent: React.FC = () => {
  const styles = useStyles();
  const {
    currentStep,
    isSaving,
    lastSavedAt,
    expiresAt,
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

  return (
    <div className="wizard-container">
      {/* Main Card with Glassmorphic Effect */}
      <div className="wizard-main-card">
        {/* Header */}
        <div className="wizard-header">
          <h1 className="wizard-title">Create New Activity</h1>
          <p className="wizard-subtitle">
            Step {currentStep} of 7: {currentStepInfo.title}
          </p>

          {/* Save Indicator */}
          {lastSavedAt && (
            <div className="wizard-save-indicator">
              <div className={`${styles.saveIndicatorIcon} ${isSaving ? styles.saveIndicatorSaving : ''}`} />
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
            <div className="wizard-warning-box">
              ⚠️ Draft expires in {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'}. 
              Please complete or it will be automatically deleted.
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <WizardProgress />

        {/* Step Content */}
        <div className="wizard-step-container">
          <h2 className="wizard-step-title">{currentStepInfo.title}</h2>
          <p className="wizard-step-subtitle">{currentStepInfo.description}</p>

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
      </div>
    </div>
  );
};

// ============================================================================
// Main Component (with Provider)
// ============================================================================

interface ActivityWizardProps {
  resumeDraftId?: string;  // Optional: Resume draft by activity ID
  onComplete?: (activityId: string) => void;  // Callback when wizard completes
  onCancel?: () => void;    // Callback when user cancels
}

const ActivityWizard: React.FC<ActivityWizardProps> = ({ 
  resumeDraftId, 
  onComplete,
  onCancel,
}) => {
  return (
    <WizardProvider initialActivityId={resumeDraftId}>
      <WizardContent />
    </WizardProvider>
  );
};

export default ActivityWizard;
