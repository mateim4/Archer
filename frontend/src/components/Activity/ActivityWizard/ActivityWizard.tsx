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
// import Step4_HardwareSelection from './Steps/Step4_HardwareSelection';
// import Step5_Timeline from './Steps/Step5_Timeline';
// import Step6_Assignment from './Steps/Step6_Assignment';
// import Step7_Review from './Steps/Step7_Review';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'Poppins, Montserrat, system-ui, -apple-system, sans-serif',
  },
  
  header: {
    backgroundColor: '#ffffff',
    ...shorthands.borderBottom('1px', 'solid', '#e5e7eb'),
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXXL),
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  
  headerTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginTop: 0,
    marginBottom: tokens.spacingVerticalS,
    fontFamily: 'Poppins, sans-serif',
  },
  
  headerSubtitle: {
    fontSize: '14px',
    fontWeight: 400,
    color: tokens.colorNeutralForeground2,
    marginTop: 0,
    marginBottom: 0,
    fontFamily: 'Poppins, sans-serif',
  },
  
  saveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS,
  },
  
  saveIndicatorIcon: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  
  saveIndicatorSaving: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },
  
  expirationWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorPaletteYellowBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorPaletteYellowBorder1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    marginTop: tokens.spacingVerticalM,
  },
  
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    overflowY: 'auto',
  },
  
  progressSection: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  
  stepContent: {
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minHeight: '400px',
  },
  
  stepTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginTop: 0,
    marginBottom: tokens.spacingVerticalS,
    fontFamily: 'Poppins, sans-serif',
  },
  
  stepDescription: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    marginTop: 0,
    marginBottom: tokens.spacingVerticalXXL,
    fontFamily: 'Poppins, sans-serif',
  },
  
  navigationSection: {
    marginTop: tokens.spacingVerticalXXL,
  },
  
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    fontSize: '16px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Create New Activity</h1>
        <p className={styles.headerSubtitle}>
          Step {currentStep} of 7: {currentStepInfo.title}
        </p>

        {/* Save Indicator */}
        {lastSavedAt && (
          <div className={styles.saveIndicator}>
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
          <div className={styles.expirationWarning}>
            ⚠️ Draft expires in {daysUntilExpiration} {daysUntilExpiration === 1 ? 'day' : 'days'}. 
            Please complete or it will be automatically deleted.
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Progress Indicator */}
        <div className={styles.progressSection}>
          <WizardProgress />
        </div>

        {/* Step Content */}
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>{currentStepInfo.title}</h2>
          <p className={styles.stepDescription}>{currentStepInfo.description}</p>

          {/* Render step component */}
          {currentStep === 1 && <Step1_Basics />}
          {currentStep === 2 && <Step2_SourceDestination />}
          {currentStep === 3 && <Step3_Infrastructure />}
          {currentStep === 4 && (
            <div className={styles.placeholder}>
              Step 4: Capacity Validation (Coming Soon)
            </div>
          )}
          {currentStep === 5 && (
            <div className={styles.placeholder}>
              Step 5: Timeline Estimation (Coming Soon)
            </div>
          )}
          {currentStep === 6 && (
            <div className={styles.placeholder}>
              Step 6: Team Assignment (Coming Soon)
            </div>
          )}
          {currentStep === 7 && (
            <div className={styles.placeholder}>
              Step 7: Review & Submit (Coming Soon)
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={styles.navigationSection}>
          <WizardNavigation />
        </div>
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
