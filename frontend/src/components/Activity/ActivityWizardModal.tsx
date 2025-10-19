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
import { Dialog, DialogSurface, DialogBody } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { WizardProvider } from './ActivityWizard/Context/WizardContext';
import ActivityWizard from './ActivityWizard/ActivityWizard';
import { PurpleGlassButton } from '../ui';
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
// Styles (removed - now using inline styles for simplicity)
// ============================================================================

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
        <Dialog
          open={showCloseConfirmation}
          modalType="non-modal"
          onOpenChange={(_, data) => {
            if (!data.open) {
              handleCancelClose();
            }
          }}
        >
          <DialogSurface
            style={{
              maxWidth: '500px',
              padding: tokens.xl,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '16px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
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
                <PurpleGlassButton variant="secondary" glass onClick={handleCancelClose}>
                  Continue Editing
                </PurpleGlassButton>
                <PurpleGlassButton variant="primary" glass onClick={handleConfirmClose}>
                  Close Wizard
                </PurpleGlassButton>
              </div>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  );
};

export default ActivityWizardModal;
