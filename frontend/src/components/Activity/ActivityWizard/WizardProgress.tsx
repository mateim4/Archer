/**
 * WizardProgress - Step progress indicator
 * 
 * Shows 1-7 steps with:
 * - Completed steps (checkmark)
 * - Active step (highlighted)
 * - Upcoming steps (greyed out)
 * 
 * Now using Fluent UI 2 makeStyles with design tokens
 */

import React from 'react';
import { useWizardContext } from './Context/WizardContext';
import { CheckmarkFilled } from '@fluentui/react-icons';
import { useWizardProgressStyles } from '../../../hooks/useWizardStyles';
import { mergeClasses } from '@fluentui/react-components';

// ============================================================================
// Component
// ============================================================================

const WizardProgress: React.FC = () => {
  const { currentStep, goToStep, getStepCompletion } = useWizardContext();
  const steps = getStepCompletion();
  const styles = useWizardProgressStyles();

  return (
    <div className={styles.progressWrapper}>
      {/* Progress Line Background */}
      <div className={styles.progressLine}>
        {/* Progress Line Filled */}
        <div 
          className={styles.progressFill} 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Step Items */}
      {steps.map((step) => {
        const isCompleted = step.isComplete;
        const isActive = step.isActive;

        return (
          <div
            key={step.step}
            className={styles.step}
            onClick={() => goToStep(step.step)}
          >
            {/* Step Circle */}
            <div 
              className={mergeClasses(
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted
              )}
            >
              {isCompleted ? (
                <CheckmarkFilled style={{ fontSize: '20px' }} />
              ) : (
                <span>{step.step}</span>
              )}
            </div>

            {/* Step Label */}
            <div 
              className={mergeClasses(
                styles.stepLabel,
                isActive && styles.stepLabelActive
              )}
            >
              {step.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WizardProgress;
