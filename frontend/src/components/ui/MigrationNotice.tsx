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
import { useNavigate } from 'react-router-dom';
import {
  InfoRegular,
  DismissRegular,
  FolderRegular,
  ArrowRightRegular,
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
  const navigate = useNavigate();
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

  const handleCreateProject = () => {
    navigate('/app/projects?action=create');
  };

  const handleLearnMore = () => {
    navigate('/app/guides');
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
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        border: '1px solid var(--notice-border-color)',
        borderRadius: '12px',
        position: 'relative',
        boxShadow: 'var(--notice-shadow)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Info Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <InfoRegular style={{ fontSize: '20px', color: NOTICE_COLORS.primary }} />
        </div>

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
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: 'var(--notice-text-color)',
              lineHeight: 1.6,
              fontFamily: "'Poppins', 'Montserrat', sans-serif",
              opacity: 0.9,
            }}
          >
            Migration Planner and Lifecycle Planner are now integrated into the project timeline workflow.
            Create a new project to access these tools as part of your infrastructure planning activities.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Primary Action */}
            <button
              onClick={handleCreateProject}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: `linear-gradient(135deg, ${NOTICE_COLORS.primary}, ${NOTICE_COLORS.primaryDark})`,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: "'Poppins', 'Montserrat', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: `0 2px 8px rgba(59, 130, 246, 0.3)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <FolderRegular style={{ fontSize: '16px' }} />
              Create Your First Project
              <ArrowRightRegular style={{ fontSize: '14px' }} />
            </button>

            {/* Secondary Action */}
            <button
              onClick={handleLearnMore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                background: 'var(--btn-ghost-bg)',
                color: 'var(--text-primary)',
                border: `1px solid var(--card-border)`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: "'Poppins', 'Montserrat', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)';
                e.currentTarget.style.borderColor = 'var(--card-border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--btn-ghost-bg)';
                e.currentTarget.style.borderColor = 'var(--card-border)';
              }}
            >
              Learn More
            </button>
          </div>
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
