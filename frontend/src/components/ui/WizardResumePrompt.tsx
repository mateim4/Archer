import React from 'react';
import { ArrowClockwiseRegular, DismissRegular, PlayRegular } from '@fluentui/react-icons';
import { PurpleGlassButton } from './PurpleGlassButton';

export interface WizardResumePromptProps {
  /** Timestamp of last save */
  lastSaved: number;
  /** Callback when user chooses to resume */
  onResume: () => void;
  /** Callback when user chooses to start fresh */
  onStartFresh: () => void;
  /** Callback when user dismisses the prompt */
  onDismiss?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

/**
 * Component to prompt users to resume or restart a wizard
 * Displays when saved wizard state is detected
 */
export const WizardResumePrompt: React.FC<WizardResumePromptProps> = ({
  lastSaved,
  onResume,
  onStartFresh,
  onDismiss,
  className = '',
  style = {}
}) => {
  // Format the last saved time
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(147, 51, 234, 0.05))',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        borderRadius: '12px',
        padding: '20px 24px',
        fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
        position: 'relative',
        ...style
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <DismissRegular style={{ fontSize: '20px' }} />
        </button>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(124, 58, 237, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#7c3aed',
            flexShrink: 0
          }}
        >
          <ArrowClockwiseRegular />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937',
              fontFamily: 'inherit'
            }}
          >
            Resume Your Progress
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: '#6b7280',
              fontFamily: 'inherit'
            }}
          >
            Last saved {formatTime(lastSaved)}
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: '#4b5563',
          lineHeight: 1.5,
          fontFamily: 'inherit'
        }}
      >
        We found a saved wizard session. You can continue where you left off or start fresh.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <PurpleGlassButton
          variant="primary"
          icon={<PlayRegular />}
          onClick={onResume}
          glass
        >
          Resume Wizard
        </PurpleGlassButton>
        <PurpleGlassButton
          variant="secondary"
          onClick={onStartFresh}
          glass
        >
          Start Fresh
        </PurpleGlassButton>
      </div>
    </div>
  );
};

export default WizardResumePrompt;
