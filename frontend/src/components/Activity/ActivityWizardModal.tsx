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
 * - Centered modal shell with glassmorphic surface
 * - Full wizard state management via WizardProvider
 * - Close confirmation when unsaved changes exist
 * - Success/error callbacks
 * - Loading states
 * - Responsive design (constrained width, full screen on mobile)
 */

import React, { useState, useEffect } from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { Dismiss24Regular, Warning24Regular } from '@fluentui/react-icons';
import { WizardProvider } from './ActivityWizard/Context/WizardContext';
import ActivityWizard from './ActivityWizard/ActivityWizard';
import { PurpleGlassButton, PurpleGlassCard } from '../ui';
import { tokens } from '../../styles/design-tokens';

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

const useUnsavedModalStyles = makeStyles({
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(12px) saturate(140%)',
    WebkitBackdropFilter: 'blur(12px) saturate(140%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.xxxl,
    zIndex: 1100,

    '@media (max-width: 768px)': {
      padding: tokens.l,
    },
  },

  confirmWrapper: {
    width: '100%',
    maxWidth: '520px',
  },

  confirmCard: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },

  confirmHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.m),
  },

  confirmIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(99, 102, 241, 0.24) 100%)',
    color: '#ffffff',
    boxShadow: '0 12px 24px rgba(99, 102, 241, 0.2)',
  },

  confirmTitle: {
    margin: 0,
    fontFamily: tokens.fontFamilyHeading,
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '0.01em',
  },

  confirmSubtitle: {
    margin: 0,
    marginTop: tokens.xs,
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },

  confirmBody: {
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase400,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
  },

  confirmList: {
    margin: 0,
    paddingLeft: tokens.l,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xs),
    color: tokens.colorNeutralForeground2,
  },

  confirmFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.m),
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const confirmStyles = useUnsavedModalStyles();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasUnsavedChanges(false);
      setShowCloseConfirmation(false);
    }
  }, [isOpen]);

  // Close unsaved dialog with Escape key
  useEffect(() => {
    if (!showCloseConfirmation) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowCloseConfirmation(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCloseConfirmation]);

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

  // Simple overlay instead of Dialog
  if (!isOpen) return null;

  return (
    <>
      {/* Custom Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: `${tokens.xxxl}`,
          overflow: 'auto',
        }}
        onClick={handleCloseClick}
      >
        {/* Card Container */}
        <div
          style={{
            width: '100%',
            maxWidth: '1040px',
            maxHeight: '90vh',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleCloseClick}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: tokens.m,
              right: tokens.m,
              zIndex: 10,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: tokens.medium,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              transition: `all ${tokens.durationFast} ${tokens.curveEasyEase}`,
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Dismiss24Regular style={{ fontSize: '20px', color: tokens.colorNeutralForeground1 }} />
          </button>

          {/* Wizard Content */}
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
      </div>

      {/* Close Confirmation Dialog */}
      {showCloseConfirmation && (
        <div
          className={confirmStyles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-changes-title"
          aria-describedby="unsaved-changes-description"
          onClick={handleCancelClose}
        >
          <div className={confirmStyles.confirmWrapper} onClick={(event) => event.stopPropagation()}>
            <PurpleGlassCard
              variant="elevated"
              glass
              padding="large"
              className={confirmStyles.confirmCard}
              header={(
                <div className={confirmStyles.confirmHeader}>
                  <div className={confirmStyles.confirmIcon}>
                    <Warning24Regular />
                  </div>
                  <div>
                    <h2 id="unsaved-changes-title" className={confirmStyles.confirmTitle}>
                      Unsaved Changes
                    </h2>
                    <p className={confirmStyles.confirmSubtitle}>
                      Your latest edits are already saved as a draft.
                    </p>
                  </div>
                </div>
              )}
              footer={(
                <div className={confirmStyles.confirmFooter}>
                  <PurpleGlassButton variant="secondary" glass onClick={handleCancelClose}>
                    Continue Editing
                  </PurpleGlassButton>
                  <PurpleGlassButton variant="primary" glass onClick={handleConfirmClose}>
                    Close Wizard
                  </PurpleGlassButton>
                </div>
              )}
            >
              <div id="unsaved-changes-description" className={confirmStyles.confirmBody}>
                <p>
                  Closing the wizard now will exit your editing session, but your draft remains safely stored so you can resume later without losing any field values.
                </p>
                <ul className={confirmStyles.confirmList}>
                  <li>Find the draft under Projects → Drafts whenever you are ready.</li>
                  <li>Share the draft with teammates to review before finalizing.</li>
                </ul>
              </div>
            </PurpleGlassCard>
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityWizardModal;
