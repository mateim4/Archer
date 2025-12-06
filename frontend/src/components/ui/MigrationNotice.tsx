/**
 * MigrationNotice Component
 * 
 * Educational component that informs users about the navigation restructure
 * from standalone Migration/Lifecycle Planners to integrated project workflows.
 * 
 * Part of Phase 2: User Experience - CMO to FMO Migration
 * Spec Reference: navigation-restructure.md - User Education Strategy
 */

import React, { useState, useEffect } from 'react';
import {
  DismissRegular,
} from '@fluentui/react-icons';

/**
 * Migration Notice color palette - using blue tones for informational notices
 * These are intentionally different from the main purple brand colors
 * to distinguish informational banners from the core UI.
 * Uses CSS variables for theme awareness in light/dark modes.
 */
const NOTICE_COLORS = {
  primary: 'var(--notice-primary, #3b82f6)',           // Blue primary
  primaryDark: 'var(--notice-primary-dark, #2563eb)',  // Darker blue for gradients
  text: 'var(--notice-text, #1e40af)',                 // Blue text - light mode
  textDark: 'var(--notice-text-dark, #93c5fd)',        // Light blue text - dark mode
  background: 'var(--notice-bg, rgba(59, 130, 246, 0.08))',
  backgroundDark: 'var(--notice-bg-dark, rgba(59, 130, 246, 0.15))',
  border: 'var(--notice-border, rgba(59, 130, 246, 0.15))',
  borderDark: 'var(--notice-border-dark, rgba(59, 130, 246, 0.3))',
  neutral: 'var(--text-secondary)',
  neutralHover: 'var(--text-primary)',
} as const;

export interface MigrationNoticeProps {
  /** Whether to show the notice (controlled) */
  isVisible?: boolean;
  /** Callback when notice is dismissed */
  onDismiss?: () => void;
  /** Storage key for persistence (defaults to 'migration-notice-dismissed') */
  storageKey?: string;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

export const MigrationNotice: React.FC<MigrationNoticeProps> = ({
  isVisible: controlledVisible,
  onDismiss,
  storageKey = 'migration-notice-dismissed',
  className = '',
  style,
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check localStorage on initial render
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  // Sync with controlled visibility prop
  useEffect(() => {
    if (controlledVisible !== undefined) {
      setIsDismissed(!controlledVisible);
    }
  }, [controlledVisible]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore localStorage errors
    }
    onDismiss?.();
  };

  // Don't render if dismissed
  if (isDismissed) return null;

  return (
    <div
      className={`migration-notice ${className}`}
      role="alert"
      aria-live="polite"
      style={{
        margin: '0 0 24px 0',
        padding: '20px 24px',
        background: 'var(--notice-gradient-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--notice-border-color)',
        borderRadius: '12px',
        position: 'relative',
        boxShadow: 'var(--notice-shadow)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Content */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--notice-heading-color)',
              fontFamily: "'Poppins', 'Montserrat', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📈</span>
            New Project Management System
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--notice-text-color)',
              lineHeight: 1.6,
              fontFamily: "'Poppins', 'Montserrat', sans-serif",
              opacity: 0.9,
            }}
          >
            Migration Planner and Lifecycle Planner are now integrated into the project timeline workflow.
            Click "Add new Project" above to access these tools as part of your infrastructure planning activities.
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notice"
          style={{
            background: 'none',
            border: 'none',
            color: NOTICE_COLORS.neutral,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.color = NOTICE_COLORS.neutralHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = NOTICE_COLORS.neutral;
          }}
        >
          <DismissRegular style={{ fontSize: '18px' }} />
        </button>
      </div>
    </div>
  );
};

export default MigrationNotice;
