import React from 'react';
import { PurpleGlassButton } from './PurpleGlassButton';

export interface PurpleGlassEmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Visual variant */
  variant?: 'default' | 'search' | 'error' | 'maintenance';
  /** Glass intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /** Whether to center vertically in parent */
  centerVertically?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

const VARIANT_STYLES = {
  default: {
    iconColor: '#7c3aed',
    iconBackground: 'rgba(124, 58, 237, 0.1)',
    titleColor: '#1f2937',
    descriptionColor: '#6b7280'
  },
  search: {
    iconColor: '#3b82f6',
    iconBackground: 'rgba(59, 130, 246, 0.1)',
    titleColor: '#1f2937',
    descriptionColor: '#6b7280'
  },
  error: {
    iconColor: '#ef4444',
    iconBackground: 'rgba(239, 68, 68, 0.1)',
    titleColor: '#1f2937',
    descriptionColor: '#6b7280'
  },
  maintenance: {
    iconColor: '#f59e0b',
    iconBackground: 'rgba(245, 158, 11, 0.1)',
    titleColor: '#1f2937',
    descriptionColor: '#6b7280'
  }
};

const GLASS_STYLES = {
  none: {},
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(147, 51, 234, 0.1)',
    borderRadius: '16px',
    padding: '32px'
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(147, 51, 234, 0.15)',
    borderRadius: '16px',
    padding: '32px'
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(147, 51, 234, 0.2)',
    borderRadius: '16px',
    padding: '32px'
  }
};

export const PurpleGlassEmptyState: React.FC<PurpleGlassEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  glass = 'none',
  centerVertically = false,
  className = '',
  style = {}
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const glassStyle = GLASS_STYLES[glass];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: centerVertically ? 'center' : 'flex-start',
        textAlign: 'center',
        padding: glass === 'none' ? '48px 24px' : '0',
        minHeight: centerVertically ? '400px' : 'auto',
        fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
        ...glassStyle,
        ...style
      }}
    >
      {/* Icon */}
      {icon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: variantStyle.iconBackground,
            color: variantStyle.iconColor,
            fontSize: '40px',
            marginBottom: '24px',
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '24px',
          fontWeight: 600,
          color: variantStyle.titleColor,
          fontFamily: 'inherit'
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '16px',
            fontWeight: 400,
            color: variantStyle.descriptionColor,
            maxWidth: '500px',
            lineHeight: 1.6,
            fontFamily: 'inherit'
          }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {action && (
            <PurpleGlassButton
              variant="primary"
              size="large"
              icon={action.icon}
              onClick={action.onClick}
              glass
            >
              {action.label}
            </PurpleGlassButton>
          )}
          {secondaryAction && (
            <PurpleGlassButton
              variant="secondary"
              size="large"
              icon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
              glass
            >
              {secondaryAction.label}
            </PurpleGlassButton>
          )}
        </div>
      )}
    </div>
  );
};

export default PurpleGlassEmptyState;
