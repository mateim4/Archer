/**
 * WizardProgress - Step progress indicator
 * 
 * Shows 1-7 steps with:
 * - Completed steps (checkmark)
 * - Active step (highlighted)
 * - Upcoming steps (greyed out)
 */

import React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useWizardContext } from './Context/WizardContext';
import { CheckmarkFilled } from '@fluentui/react-icons';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },

  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    cursor: 'pointer',
    ...shorthands.transition('all', '0.2s', 'ease'),
    
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },

  stepCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#e5e7eb',
    ...shorthands.border('2px', 'solid', '#e5e7eb'),
    color: tokens.colorNeutralForeground3,
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Poppins, sans-serif',
    ...shorthands.transition('all', '0.2s', 'ease'),
    marginBottom: tokens.spacingVerticalS,
    zIndex: 2,
  },

  stepCircleCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    ...shorthands.border('2px', 'solid', tokens.colorPaletteGreenBorder2),
    color: '#ffffff',
  },

  stepCircleActive: {
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border('2px', 'solid', tokens.colorBrandForeground1),
    color: '#ffffff',
    boxShadow: `0 0 0 4px ${tokens.colorBrandBackground2}`,
  },

  stepLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    fontFamily: 'Poppins, sans-serif',
    maxWidth: '100px',
  },

  stepLabelCompleted: {
    color: tokens.colorPaletteGreenForeground2,
  },

  stepLabelActive: {
    color: tokens.colorBrandForeground1,
    fontWeight: 600,
  },

  connector: {
    position: 'absolute',
    top: '24px',
    left: 'calc(50% + 32px)',
    right: 'calc(-50% + 32px)',
    height: '2px',
    backgroundColor: '#e5e7eb',
    zIndex: 1,
  },

  connectorCompleted: {
    backgroundColor: tokens.colorPaletteGreenBorder2,
  },

  lastStep: {
    '& $connector': {
      display: 'none',
    },
  },
});

// ============================================================================
// Component
// ============================================================================

const WizardProgress: React.FC = () => {
  const styles = useStyles();
  const { currentStep, goToStep, getStepCompletion } = useWizardContext();

  const steps = getStepCompletion();

  return (
    <div className={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.isComplete;
        const isActive = step.isActive;

        return (
          <div
            key={step.step}
            className={`${styles.stepItem} ${isLast ? styles.lastStep : ''}`}
            onClick={() => goToStep(step.step)}
          >
            {/* Step Circle */}
            <div
              className={`${styles.stepCircle} ${
                isCompleted ? styles.stepCircleCompleted : ''
              } ${isActive ? styles.stepCircleActive : ''}`}
            >
              {isCompleted ? (
                <CheckmarkFilled style={{ fontSize: '20px' }} />
              ) : (
                <span>{step.step}</span>
              )}
            </div>

            {/* Step Label */}
            <div
              className={`${styles.stepLabel} ${
                isCompleted ? styles.stepLabelCompleted : ''
              } ${isActive ? styles.stepLabelActive : ''}`}
            >
              {step.title}
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div
                className={`${styles.connector} ${
                  isCompleted ? styles.connectorCompleted : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WizardProgress;
