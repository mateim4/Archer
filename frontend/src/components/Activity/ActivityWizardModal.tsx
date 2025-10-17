/**
 * ActivityWizardModal - Modal wrapper for the Activity Wizard
 * 
 * Provides a modal dialog interface for creating or editing activities.
 * Supports two modes:
 * - CREATE: Start a new activity from scratch
 * - EDIT: Load and modify an existing activity
 * 
 * Features:
 * - Fluent UI 2 Dialog with purple glass aesthetic
 * - Full wizard state management via WizardProvider
 * - Close confirmation when unsaved changes exist
 * - Success/error callbacks
 * - Loading states
 * - Responsive design (90vw x 90vh, full screen on mobile)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  Button,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { WizardProvider } from './ActivityWizard/Context/WizardContext';
import ActivityWizard from './ActivityWizard/ActivityWizard';

// ============================================================================
// Types
// ============================================================================

export type WizardMode = 'create' | 'edit';

export interface ActivityWizardModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Callback when activity is successfully created or updated */
  onSuccess?: (activityId: string) => void;
  
  /** Mode: create new activity or edit existing */
  mode: WizardMode;
  
  /** Project ID (required for creating activities) */
  projectId: string;
  
  /** Activity ID (required for edit mode) */
  activityId?: string;
  
  /** Initial data for pre-filling (optional) */
  initialData?: Record<string, any>;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  // Backdrop blur effect
  backdrop: {
    backdropFilter: 'blur(12px) saturate(120%)',
    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  
  dialogSurface: {
    maxWidth: '1400px',
    width: '95vw',
    maxHeight: '90vh',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding(0),
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)',
    
    '@media (max-width: 768px)': {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      ...shorthands.borderRadius(0),
    },
  },
  
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ...shorthands.padding(0),
    ...shorthands.overflow('hidden'),
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXXL),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    flexShrink: 0,
  },
  
  headerTitle: {
    fontSize: '24px',
    fontWeight: 600,
    fontFamily: 'Poppins, sans-serif',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  
  closeButton: {
    minWidth: 'auto',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    ...shorthands.transition('all', '0.2s', 'ease'),
    
    ':hover': {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.4)'),
      transform: 'scale(1.05)',
    },
  },
  
  content: {
    flex: 1,
    ...shorthands.overflow('auto'),
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXXL),
    
    // Custom scrollbar
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      ...shorthands.borderRadius('4px'),
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
      ...shorthands.borderRadius('4px'),
      
      ':hover': {
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
      },
    },
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  
  loadingText: {
    fontSize: '16px',
    fontFamily: 'Poppins, sans-serif',
    color: tokens.colorNeutralForeground2,
  },
});

// ============================================================================
// Component
// ============================================================================

export const ActivityWizardModal: React.FC<ActivityWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  projectId,
  activityId,
  initialData,
}) => {
  const styles = useStyles();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasUnsavedChanges(false);
      setShowCloseConfirmation(false);
    }
  }, [isOpen]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleWizardComplete = (activityId: string) => {
    if (onSuccess) {
      onSuccess(activityId);
    }
    onClose();
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Main Wizard Modal */}
      <Dialog 
        open={isOpen}
        modalType="modal"
        onOpenChange={(event, data) => {
          if (!data.open) {
            handleCloseClick();
          }
        }}
      >
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody className={styles.dialogBody}>
            {/* Header */}
            <div className={styles.header}>
              <h2 className={styles.headerTitle}>
                {mode === 'create' ? 'Create New Activity' : 'Edit Activity'}
              </h2>
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={handleCloseClick}
                className={styles.closeButton}
                aria-label="Close modal"
              />
            </div>

            {/* Content */}
            <div className={styles.content}>
              <WizardProvider
                initialActivityId={mode === 'edit' ? activityId : undefined}
                mode={mode}
                projectId={projectId}
                onComplete={handleWizardComplete}
                onUnsavedChanges={setHasUnsavedChanges}
              >
                <ActivityWizard />
              </WizardProvider>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Close Confirmation Dialog */}
      {showCloseConfirmation && (
        <Dialog open={showCloseConfirmation} onOpenChange={(_, data) => !data.open && handleCancelClose()}>
          <DialogSurface
            style={{
              maxWidth: '500px',
              padding: tokens.spacingVerticalXL,
            }}
          >
            <DialogBody>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  fontFamily: 'Poppins, sans-serif',
                  marginBottom: tokens.spacingVerticalM,
                  color: tokens.colorNeutralForeground1,
                }}
              >
                Unsaved Changes
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  fontFamily: 'Poppins, sans-serif',
                  color: tokens.colorNeutralForeground2,
                  marginBottom: tokens.spacingVerticalL,
                  lineHeight: '1.6',
                }}
              >
                You have unsaved changes. Your progress has been auto-saved as a draft, but are you sure you want to close the wizard?
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: tokens.spacingHorizontalM,
                  justifyContent: 'flex-end',
                }}
              >
                <Button appearance="secondary" onClick={handleCancelClose}>
                  Continue Editing
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleConfirmClose}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  Close Wizard
                </Button>
              </div>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  );
};

export default ActivityWizardModal;
