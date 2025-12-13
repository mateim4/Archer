/**
 * DemoModeIndicator Component
 * 
 * A visual indicator that shows when a view is using mock/demo data
 * instead of real backend data. This helps users and developers 
 * understand when they're seeing sample data vs live data.
 */

import React from 'react';
import { InfoRegular, Warning16Regular, BeakerRegular } from '@fluentui/react-icons';

export interface DemoModeIndicatorProps {
  /** Whether demo mode is active */
  isActive: boolean;
  /** Custom message to display */
  message?: string;
  /** Position of the indicator */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  /** Severity/style of the indicator */
  variant?: 'info' | 'warning' | 'subtle';
  /** Whether to show a tooltip on hover */
  showTooltip?: boolean;
  /** Callback when user clicks the indicator */
  onClick?: () => void;
}

export const DemoModeIndicator: React.FC<DemoModeIndicatorProps> = ({
  isActive,
  message = 'Demo Mode - Showing sample data',
  position = 'inline',
  variant = 'info',
  showTooltip = true,
  onClick,
}) => {
  if (!isActive) return null;

  const variantStyles = {
    info: {
      background: 'var(--status-info-subtle)',
      border: '1px solid color-mix(in srgb, var(--status-info) 30%, transparent)',
      color: 'var(--status-info)',
      iconColor: 'var(--status-info)',
    },
    warning: {
      background: 'var(--status-warning-subtle)',
      border: '1px solid color-mix(in srgb, var(--status-warning) 30%, transparent)',
      color: 'var(--status-warning)',
      iconColor: 'var(--status-warning)',
    },
    subtle: {
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      color: 'var(--text-muted)',
      iconColor: 'var(--text-muted)',
    },
  };

  const positionStyles = {
    'top-right': {
      position: 'fixed' as const,
      top: '16px',
      right: '16px',
      zIndex: 1000,
    },
    'top-left': {
      position: 'fixed' as const,
      top: '16px',
      left: '16px',
      zIndex: 1000,
    },
    'bottom-right': {
      position: 'fixed' as const,
      bottom: '16px',
      right: '16px',
      zIndex: 1000,
    },
    'bottom-left': {
      position: 'fixed' as const,
      bottom: '16px',
      left: '16px',
      zIndex: 1000,
    },
    inline: {
      position: 'relative' as const,
    },
  };

  const style = variantStyles[variant];
  const posStyle = positionStyles[position];

  const Icon = variant === 'warning' ? Warning16Regular : variant === 'info' ? BeakerRegular : InfoRegular;

  return (
    <div
      onClick={onClick}
      title={showTooltip ? 'This view is displaying sample/mock data instead of live data from the backend.' : undefined}
      style={{
        ...posStyle,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      <Icon style={{ fontSize: '14px', color: style.iconColor }} />
      <span>{message}</span>
    </div>
  );
};

/**
 * DemoModeBanner Component
 * 
 * A more prominent banner that spans the full width, useful for
 * dashboard-level demo mode indicators.
 */
export interface DemoModeBannerProps {
  /** Whether demo mode is active */
  isActive: boolean;
  /** Custom message to display */
  message?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({
  isActive,
  message = 'You are viewing demo data. Connect to the backend to see real data.',
  dismissible = true,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (!isActive || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      style={{
        width: '100%',
        padding: '10px 16px',
        background: 'linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 15%, transparent), color-mix(in srgb, var(--brand-primary) 5%, transparent))',
        border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <BeakerRegular style={{
          fontSize: '18px',
          color: 'var(--brand-primary)',
        }} />
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-primary)',
        }}>
          {message}
        </span>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '16px',
            lineHeight: 1,
          }}
          title="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default DemoModeIndicator;
