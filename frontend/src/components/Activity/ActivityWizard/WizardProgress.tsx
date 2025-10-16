/**
 * WizardProgress - Step progress indicator
 * 
 * Shows 1-7 steps with:
 * - Completed steps (checkmark)
 * - Active step (highlighted)
 * - Upcoming steps (greyed out)
 * 
 * Now using wizard.css design system classes
 */

import React from 'react';
import { useWizardContext } from './Context/WizardContext';
import { CheckmarkFilled } from '@fluentui/react-icons';

// ============================================================================
// Component
// ============================================================================

const WizardProgress: React.FC = () => {
  const { currentStep, goToStep, getStepCompletion } = useWizardContext();
  const steps = getStepCompletion();

  return (
    <div className="wizard-progress-container">
      <div className="wizard-progress-steps">
        {/* Progress Line Background */}
        <div className="wizard-progress-line" />
        
        {/* Progress Line Filled */}
        <div 
          className="wizard-progress-line-filled" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {/* Step Items */}
        {steps.map((step) => {
          const isCompleted = step.isComplete;
          const isActive = step.isActive;

          return (
            <div
              key={step.step}
              className={`wizard-progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'current' : ''}`}
              onClick={() => goToStep(step.step)}
            >
              {/* Step Circle */}
              <div className="wizard-progress-step-circle">
                {isCompleted ? (
                  <CheckmarkFilled style={{ fontSize: '20px' }} />
                ) : (
                  <span>{step.step}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="wizard-progress-step-label">
                {step.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
