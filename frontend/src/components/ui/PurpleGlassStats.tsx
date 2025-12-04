import React from 'react';

export interface PurpleGlassStatsProps {
  /** The main value to display */
  value: string | number;
  /** The label/description for this stat */
  label: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Trend indicator */
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  /** Color theme for the stat */
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Glass intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /** Size of the stat card */
  size?: 'small' | 'medium' | 'large';
  /** Whether the card is clickable */
  onClick?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

const VARIANT_COLORS = {
  primary: {
    value: '#7c3aed',
    background: 'rgba(124, 58, 237, 0.1)',
    icon: '#7c3aed'
  },
  success: {
    value: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    icon: '#10b981'
  },
  warning: {
    value: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.1)',
    icon: '#f59e0b'
  },
  error: {
    value: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
    icon: '#ef4444'
  },
  info: {
    value: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.1)',
    icon: '#3b82f6'
  },
  neutral: {
    value: 'var(--text-secondary)',
    background: 'rgba(107, 114, 128, 0.1)',
    icon: 'var(--text-secondary)'
  }
};

const GLASS_STYLES = {
  none: {
    background: '#ffffff',
    border: '1px solid rgba(147, 51, 234, 0.1)'
  },
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(147, 51, 234, 0.1)'
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(147, 51, 234, 0.15)'
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(147, 51, 234, 0.2)'
  }
};

const SIZE_STYLES = {
  small: {
    padding: '16px',
    valueFontSize: '24px',
    labelFontSize: '12px',
    iconSize: '20px'
  },
  medium: {
    padding: '20px',
    valueFontSize: '32px',
    labelFontSize: '14px',
    iconSize: '24px'
  },
  large: {
    padding: '24px',
    valueFontSize: '40px',
    labelFontSize: '16px',
    iconSize: '28px'
  }
};

export const PurpleGlassStats: React.FC<PurpleGlassStatsProps> = ({
  value,
  label,
  icon,
  trend,
  variant = 'primary',
  glass = 'light',
  size = 'medium',
  onClick,
  className = '',
  style = {}
}) => {
  const colors = VARIANT_COLORS[variant];
  const glassStyle = GLASS_STYLES[glass];
  const sizeStyle = SIZE_STYLES[size];
  const isClickable = !!onClick;

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    if (!trend) return colors.value;
    
    switch (trend.direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div
      className={className}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      style={{
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        cursor: isClickable ? 'pointer' : 'default',
        fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
        ...glassStyle,
        padding: sizeStyle.padding,
        ...(isClickable && {
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
          },
          ':active': {
            transform: 'translateY(0)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }
        }),
        ...style
      }}
      onMouseEnter={isClickable ? (e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.2)';
      } : undefined}
      onMouseLeave={isClickable ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      } : undefined}
    >
      {/* Icon and Value Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            fontSize: sizeStyle.valueFontSize,
            fontWeight: 700,
            color: colors.value,
            lineHeight: 1,
            fontFamily: 'inherit'
          }}
        >
          {value}
        </div>
        {icon && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: sizeStyle.iconSize,
              height: sizeStyle.iconSize,
              borderRadius: '8px',
              background: colors.background,
              color: colors.icon,
              fontSize: sizeStyle.iconSize,
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: sizeStyle.labelFontSize,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: trend ? '8px' : 0,
          fontFamily: 'inherit'
        }}
      >
        {label}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: sizeStyle.labelFontSize,
            fontWeight: 600,
            color: getTrendColor(),
            fontFamily: 'inherit'
          }}
        >
          <span>{getTrendIcon()}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default PurpleGlassStats;
