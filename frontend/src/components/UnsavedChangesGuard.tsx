/**
 * UnsavedChangesGuard - Component to display a confirmation dialog when navigation is blocked
 * 
 * This component works with the useUnsavedChanges hook to show a glassmorphic
 * confirmation dialog when the user attempts to navigate away with unsaved changes.
 * 
 * Features:
 * - Purple glass design consistent with the application's design system
 * - Accessible dialog with proper ARIA attributes
 * - Keyboard navigation support (Escape to cancel)
 * - Customizable title, message, and button labels
 * 
 * Usage:
 * ```tsx
 * const unsavedChanges = useUnsavedChanges({ when: hasFormChanges });
 * 
 * return (
 *   <>
 *     <MyForm />
 *     <UnsavedChangesGuard
 *       isBlocking={unsavedChanges.isBlocking}
 *       onProceed={unsavedChanges.proceed}
 *       onCancel={unsavedChanges.reset}
 *     />
 *   </>
 * );
 * ```
 */

import React, { useEffect } from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';
import { PurpleGlassButton, PurpleGlassCard } from '../components/ui';
import { tokens } from '../styles/design-tokens';

export interface UnsavedChangesGuardProps {
  /**
   * Whether navigation is currently being blocked.
   */
  isBlocking: boolean;

  /**
   * Callback when user confirms they want to proceed with navigation.
   */
  onProceed: () => void;

  /**
   * Callback when user cancels and wants to stay on the current page.
   */
  onCancel: () => void;

  /**
   * Title of the dialog.
   * @default 'Unsaved Changes'
   */
  title?: string;

  /**
   * Main message in the dialog body.
   * @default 'You have unsaved changes that will be lost if you navigate away.'
   */
  message?: string;

  /**
   * Additional information displayed as a list.
   */
  additionalInfo?: string[];

  /**
   * Label for the stay button.
   * @default 'Stay on Page'
   */
  stayButtonLabel?: string;

  /**
   * Label for the leave button.
   * @default 'Leave Page'
   */
  leaveButtonLabel?: string;
}

const useStyles = makeStyles({
  overlay: {
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

  wrapper: {
    width: '100%',
    maxWidth: '520px',
  },

  card: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.l),
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.m),
  },

  icon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(234, 88, 12, 0.24) 100%)',
    color: '#f59e0b',
    boxShadow: '0 12px 24px rgba(245, 158, 11, 0.2)',
  },

  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },

  title: {
    margin: 0,
    fontFamily: tokens.fontFamilyHeading,
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '0.01em',
  },

  subtitle: {
    margin: 0,
    marginTop: tokens.xs,
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },

  body: {
    fontFamily: tokens.fontFamilyBody,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase400,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.m),
  },

  list: {
    margin: 0,
    paddingLeft: tokens.l,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.xs),
    color: tokens.colorNeutralForeground2,
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.m),
  },
});

export const UnsavedChangesGuard: React.FC<UnsavedChangesGuardProps> = ({
  isBlocking,
  onProceed,
  onCancel,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes that will be lost if you navigate away.',
  additionalInfo = [
    'Any form data you entered will not be saved.',
    'Consider saving your work before leaving.',
  ],
  stayButtonLabel = 'Stay on Page',
  leaveButtonLabel = 'Leave Page',
}) => {
  const styles = useStyles();

  // Handle Escape key to cancel
  useEffect(() => {
    if (!isBlocking) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBlocking, onCancel]);

  if (!isBlocking) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-guard-title"
      aria-describedby="unsaved-changes-guard-description"
      onClick={onCancel}
    >
      <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
        <PurpleGlassCard
          variant="elevated"
          glass
          padding="large"
          className={styles.card}
          header={
            <div className={styles.header}>
              <div className={styles.icon}>
                <Warning24Regular />
              </div>
              <div className={styles.titleGroup}>
                <h2 id="unsaved-changes-guard-title" className={styles.title}>
                  {title}
                </h2>
                <p className={styles.subtitle}>Your changes have not been saved yet.</p>
              </div>
            </div>
          }
          footer={
            <div className={styles.footer}>
              <PurpleGlassButton variant="secondary" glass onClick={onCancel}>
                {stayButtonLabel}
              </PurpleGlassButton>
              <PurpleGlassButton variant="primary" glass onClick={onProceed}>
                {leaveButtonLabel}
              </PurpleGlassButton>
            </div>
          }
        >
          <div id="unsaved-changes-guard-description" className={styles.body}>
            <p>{message}</p>
            {additionalInfo.length > 0 && (
              <ul className={styles.list}>
                {additionalInfo.map((info, index) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
            )}
          </div>
        </PurpleGlassCard>
      </div>
    </div>
  );
};

export default UnsavedChangesGuard;
