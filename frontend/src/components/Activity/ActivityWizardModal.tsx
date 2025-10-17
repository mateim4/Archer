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
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { WizardProvider } from './ActivityWizard/Context/WizardContext';
import ActivityWizard from './ActivityWizard/ActivityWizard';
import { tokens } from '../../styles/design-tokens';
import { useModalStyles } from '../../hooks/usePurpleGlassStyles';

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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding(tokens.xl, tokens.xxl),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(139, 92, 246, 0.15)'),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: tokens.blurMedium,
    WebkitBackdropFilter: tokens.blurMedium,
    flexShrink: 0,
  },
  
  headerTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyPrimary,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  
  closeButton: {
    minWidth: 'auto',
    ...shorthands.padding(tokens.s, tokens.s),
    ...shorthands.borderRadius(tokens.medium),
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.2)'),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: tokens.blurLight,
    WebkitBackdropFilter: tokens.blurLight,
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: tokens.durationFast,
    transitionTimingFunction: tokens.curveEasyEase,
    
    ':hover': {
      backgroundColor: tokens.colorGlassPurpleLight,
      ...shorthands.borderColor('rgba(139, 92, 246, 0.4)'),
      transform: 'scale(1.05)',
    },
  },
  
  content: {
    flex: 1,
    ...shorthands.overflow('auto'),
    ...shorthands.padding(tokens.xl, tokens.xxl),
    
    // Custom scrollbar
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: tokens.colorGlassPurpleLight,
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
    ...shorthands.gap(tokens.l),
  },
  
  loadingText: {
    fontSize: tokens.fontSizeBase400,
    fontFamily: tokens.fontFamilyPrimary,
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
  const modalStyles = useModalStyles(); // Use our reusable modal styles
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
        <DialogSurface className={modalStyles.surface}>
          <DialogBody className={modalStyles.body}>
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
              padding: tokens.xl,
            }}
          >
            <DialogBody>
              <h3
                style={{
                  fontSize: tokens.fontSizeBase500,
                  fontWeight: tokens.fontWeightSemibold,
                  fontFamily: tokens.fontFamilyPrimary,
                  marginBottom: tokens.m,
                  color: tokens.colorNeutralForeground1,
                }}
              >
                Unsaved Changes
              </h3>
              <p
                style={{
                  fontSize: tokens.fontSizeBase300,
                  fontFamily: tokens.fontFamilyPrimary,
                  color: tokens.colorNeutralForeground2,
                  marginBottom: tokens.l,
                  lineHeight: '1.6',
                }}
              >
                You have unsaved changes. Your progress has been auto-saved as a draft, but are you sure you want to close the wizard?
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: tokens.m,
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
                    background: tokens.colorBrandPrimary,
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
