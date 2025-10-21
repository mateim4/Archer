/**
 * Migration Planning Wizard
 * 
 * Multi-step wizard for comprehensive migration planning:
 * 1. Source Selection - RVTools upload, VM filtering
 * 2. Destination Config - Cluster builder, hardware pool integration
 * 3. Capacity Visualizer - Real-time capacity charts, bottleneck warnings
 * 4. Network Configuration - Template selector, VLAN mapping
 * 5. Review & HLD Generation - Summary, document generation
 * 
 * Design: Purple Glass components with step progression
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '1200px',
    width: '90vw',
    maxHeight: '90vh',
    ...shorthands.padding('0'),
  },
  
  wizardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
  },
  
  wizardTitle: {
    fontFamily: 'Poppins, sans-serif',
    fontSize: '24px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    margin: '0',
  },
  
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    background: 'rgba(255, 255, 255, 0.5)',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  
  step: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    fontFamily: 'Poppins, sans-serif',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '500',
  },
  
  stepActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  
  stepCompleted: {
    color: '#10b981',
  },
  
  stepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    border: '2px solid',
    ...shorthands.borderColor('currentColor'),
    backgroundColor: 'transparent',
  },
  
  stepNumberActive: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    ...shorthands.borderColor('#8b5cf6'),
  },
  
  stepNumberCompleted: {
    backgroundColor: '#10b981',
    color: 'white',
    ...shorthands.borderColor('#10b981'),
  },
  
  stepConnector: {
    width: '40px',
    height: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
  },
  
  stepConnectorActive: {
    backgroundColor: '#10b981',
  },
  
  wizardContent: {
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    minHeight: '400px',
    maxHeight: 'calc(90vh - 280px)',
    overflowY: 'auto',
  },
  
  wizardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    background: 'rgba(255, 255, 255, 0.5)',
  },
  
  footerActions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
});

export interface MigrationWizardProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  rvtoolsUploads?: Array<{ id: string; filename: string; uploadedAt: string }>;
}

const WIZARD_STEPS = [
  { id: 1, name: 'Source Selection', description: 'Select VMs to migrate' },
  { id: 2, name: 'Destination Config', description: 'Configure target clusters' },
  { id: 3, name: 'Capacity Analysis', description: 'Review capacity requirements' },
  { id: 4, name: 'Network Setup', description: 'Configure network profiles' },
  { id: 5, name: 'Review & Generate', description: 'Review and generate HLD' },
];

export const MigrationPlanningWizard: React.FC<MigrationWizardProps> = ({
  open,
  onClose,
  projectId,
  rvtoolsUploads = [],
}) => {
  const styles = useStyles();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or next step
    if (stepId <= currentStep || completedSteps.has(stepId - 1)) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 1: Source Selection
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Select the RVTools upload and filter VMs to include in this migration.
            </p>
            {/* Content will be implemented in next tasks */}
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📊</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Source selection UI will be implemented here
              </p>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 2: Destination Configuration
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Configure target clusters using hardware from the pool or procurement.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🖥️</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Cluster builder UI will be implemented here
              </p>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 3: Capacity Analysis
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Review capacity requirements and identify potential bottlenecks.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📈</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Capacity visualizer will be implemented here
              </p>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 4: Network Setup
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Configure network profiles and VLAN mappings for the migration.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🌐</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Network configuration UI will be implemented here
              </p>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', marginBottom: '16px' }}>
              Step 5: Review & Generate HLD
            </h3>
            <p style={{ color: tokens.colorNeutralForeground3 }}>
              Review your migration plan and generate the High-Level Design document.
            </p>
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'rgba(236, 72, 153, 0.05)',
              borderRadius: '12px',
              marginTop: '24px'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📄</p>
              <p style={{ color: tokens.colorNeutralForeground2 }}>
                Review and HLD generation UI will be implemented here
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody style={{ padding: '0' }}>
          {/* Header */}
          <div className={styles.wizardHeader}>
            <DialogTitle className={styles.wizardTitle}>
              Migration Planning Wizard
            </DialogTitle>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          </div>

          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            {WIZARD_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`${styles.step} ${
                    step.id === currentStep ? styles.stepActive : ''
                  } ${completedSteps.has(step.id) ? styles.stepCompleted : ''}`}
                  onClick={() => handleStepClick(step.id)}
                  style={{ cursor: step.id <= currentStep || completedSteps.has(step.id - 1) ? 'pointer' : 'default' }}
                >
                  <div
                    className={`${styles.stepNumber} ${
                      step.id === currentStep ? styles.stepNumberActive : ''
                    } ${completedSteps.has(step.id) ? styles.stepNumberCompleted : ''}`}
                  >
                    {completedSteps.has(step.id) ? (
                      <CheckmarkCircleRegular fontSize={16} />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span>{step.name}</span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`${styles.stepConnector} ${
                      completedSteps.has(step.id) ? styles.stepConnectorActive : ''
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <DialogContent className={styles.wizardContent}>
            {renderStepContent()}
          </DialogContent>

          {/* Footer */}
          <div className={styles.wizardFooter}>
            <div className={styles.footerActions}>
              <Button appearance="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
            <div className={styles.footerActions}>
              {currentStep > 1 && (
                <Button
                  appearance="secondary"
                  icon={<ChevronLeftRegular />}
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              {currentStep < WIZARD_STEPS.length ? (
                <Button
                  appearance="primary"
                  iconPosition="after"
                  icon={<ChevronRightRegular />}
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button appearance="primary" onClick={() => {
                  console.log('Generating HLD for project:', projectId);
                  onClose();
                }}>
                  Generate HLD
                </Button>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default MigrationPlanningWizard;
