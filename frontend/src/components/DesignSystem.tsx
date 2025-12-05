// LCMDesigner Design System Standards
// This file defines the standard UI components used throughout the application

import React from 'react';

// ===================
// DESIGN SYSTEM CONSTANTS
// ===================

export const DESIGN_TOKENS = {
  // Colors
  colors: {
    primary: '#8b5cf6', // Purple primary
    primaryLight: 'rgba(139, 92, 246, 0.1)',
    primaryBorder: 'rgba(139, 92, 246, 0.2)',
    primaryHover: 'rgba(139, 92, 246, 0.4)',
    
    background: {
      card: 'rgba(255, 255, 255, 0.85)',
      cardHover: 'rgba(255, 255, 255, 0.95)',
      input: 'rgba(255, 255, 255, 0.8)',
      inputFocus: 'rgba(255, 255, 255, 0.95)',
      dropdown: 'rgba(255, 255, 255, 0.65)',
    },
    
    text: {
      primary: '#1a202c',
      secondary: 'var(--text-primary)',
      muted: '#64748b',
    }
  },

  // Typography
  typography: {
    fontFamily: 'Oxanium, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
    }
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },

  // Border Radius
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  // Shadows
  shadows: {
    card: '0 4px 24px 0 rgba(168,85,247,0.07), 0 1.5px 4px 0 rgba(0,0,0,0.04)',
    cardHover: '0 8px 32px 0 rgba(168,85,247,0.12), 0 2px 8px 0 rgba(0,0,0,0.08)',
    dropdown: '0 4px 24px 0 rgba(168,85,247,0.07), 0 1.5px 4px 0 rgba(0,0,0,0.04)',
  },

  // Backdrop Filter
  backdropFilter: {
    standard: 'blur(18px)',
    intense: 'blur(30px)',
  },

  // Glass-Edge Components
  components: {
    standardCard: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))',
      backdropFilter: 'blur(60px) brightness(135%) contrast(105%)',
      WebkitBackdropFilter: 'blur(60px) brightness(135%) contrast(105%)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      borderRadius: '20px',
      padding: '24px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      cursor: 'pointer',
      boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.15), 0 0 30px rgba(255, 255, 255, 0.08)',
    },

    standardCardHover: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
      backdropFilter: 'blur(70px) brightness(140%) contrast(110%)',
      WebkitBackdropFilter: 'blur(70px) brightness(140%) contrast(110%)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: 'inset 0 0 25px rgba(255, 255, 255, 0.2), 0 0 50px rgba(255, 255, 255, 0.12), 0 20px 40px rgba(0, 0, 0, 0.1)',
    },

    standardContentCard: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.40), rgba(255, 255, 255, 0.40))',
      backdropFilter: 'blur(30px) brightness(145%) contrast(85%)',
      WebkitBackdropFilter: 'blur(30px) brightness(145%) contrast(85%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      padding: '32px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      cursor: 'default',
      boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)',
    },
  }
};

// ===================
// STANDARD COMPONENT STYLES
// ===================

// Standard Card Style
export const standardCardStyle = {
  background: DESIGN_TOKENS.colors.background.card,
  border: `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
  borderRadius: DESIGN_TOKENS.borderRadius.lg,
  backdropFilter: DESIGN_TOKENS.backdropFilter.standard,
  WebkitBackdropFilter: DESIGN_TOKENS.backdropFilter.standard,
  boxShadow: DESIGN_TOKENS.shadows.card,
  transition: 'all 0.2s ease',
};

// Standard Input/Dropdown Style
export const standardInputStyle = {
  background: 'transparent',
  border: `2px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
  borderRadius: '16px',
  padding: '16px 20px',
  fontSize: DESIGN_TOKENS.typography.fontSize.sm,
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  color: DESIGN_TOKENS.colors.text.primary,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  minHeight: '56px',
  width: '100%',
  boxSizing: 'border-box' as const,
};

// Standard Button Style
export const standardButtonStyle = {
  background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary}, #6366f1)`,
  border: 'none',
  borderRadius: DESIGN_TOKENS.borderRadius.md,
  padding: '12px 24px',
  fontSize: DESIGN_TOKENS.typography.fontSize.sm,
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
};

// ===================
// STANDARD DROPDOWN COMPONENT
// ===================

/**
 * StandardDropdown - Legacy wrapper component
 * 
 * **DEPRECATED:** This component is a legacy wrapper around PurpleGlassDropdown.
 * For new code, use PurpleGlassDropdown directly from '@/components/ui'.
 * 
 * This wrapper maintains backward compatibility for existing consumers
 * while internally using the standardized PurpleGlassDropdown component.
 * 
 * @deprecated Use PurpleGlassDropdown from '@/components/ui' instead
 */

interface StandardDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Glassmorphism variant
   * @default 'light'
   */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /**
   * Enable search/filter functionality
   * @default false
   */
  searchable?: boolean;
}

export const StandardDropdown: React.FC<StandardDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className = "",
  style = {},
  glass = 'light',
  searchable = false
}) => {
  // Import PurpleGlassDropdown dynamically to avoid circular dependencies
  const { PurpleGlassDropdown } = require('./ui');
  
  return (
    <div className={className} style={style}>
      <PurpleGlassDropdown
        value={value}
        onChange={(newValue: string | string[] | undefined) => {
          // StandardDropdown only supports single select
          if (typeof newValue === 'string') {
            onChange(newValue);
          }
        }}
        options={options}
        placeholder={placeholder}
        glass={glass}
        searchable={searchable}
      />
    </div>
  );
};

// ===================
// STANDARD CARD COMPONENT
// ===================

interface StandardCardProps {
  children: React.ReactNode;
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  children,
  padding = '24px',
  className = "",
  style = {},
  hover = false
}) => (
  <div
    className={`${className}`}
    style={{
      ...standardCardStyle,
      padding,
      ...(hover && {
        cursor: 'pointer',
        ':hover': {
          background: DESIGN_TOKENS.colors.background.cardHover,
          boxShadow: DESIGN_TOKENS.shadows.cardHover,
          transform: 'translateY(-2px)',
        }
      }),
      ...style
    }}
    onMouseEnter={hover ? (e) => {
      e.currentTarget.style.background = DESIGN_TOKENS.colors.background.cardHover;
      e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadows.cardHover;
      e.currentTarget.style.transform = 'translateY(-2px)';
    } : undefined}
    onMouseLeave={hover ? (e) => {
      e.currentTarget.style.background = DESIGN_TOKENS.colors.background.card;
      e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadows.card;
      e.currentTarget.style.transform = 'translateY(0)';
    } : undefined}
  >
    {children}
  </div>
);

// ===================
// STANDARD BUTTON COMPONENT
// ===================

interface StandardButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StandardButton: React.FC<StandardButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = "",
  style = {}
}) => {
  const baseStyle = variant === 'primary' ? standardButtonStyle : {
    ...standardButtonStyle,
    background: 'transparent',
    border: `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
    color: DESIGN_TOKENS.colors.text.primary,
  };

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: DESIGN_TOKENS.typography.fontSize.xs },
    md: { padding: '12px 24px', fontSize: DESIGN_TOKENS.typography.fontSize.sm },
    lg: { padding: '16px 32px', fontSize: DESIGN_TOKENS.typography.fontSize.base },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...(disabled && {
          opacity: 0.5,
          cursor: 'not-allowed',
        }),
        ...style
      }}
      onMouseEnter={!disabled ? (e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadows.cardHover;
      } : undefined}
      onMouseLeave={!disabled ? (e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      } : undefined}
    >
      {children}
    </button>
  );
};

// ===================
// STANDARD STAGE MARKER COMPONENT
// ===================

interface StandardStageMarkerProps {
  steps: { num: number; title: string; description?: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const StandardStageMarker: React.FC<StandardStageMarkerProps> = ({
  steps,
  currentStep,
  onStepClick
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '32px',
    flexWrap: 'wrap'
  }}>
    {steps.map((step, index) => (
      <React.Fragment key={step.num}>
        <div
          onClick={() => onStepClick?.(step.num)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: DESIGN_TOKENS.borderRadius.lg,
            background: currentStep === step.num 
              ? `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary}, #6366f1)`
              : 'rgba(255, 255, 255, 0.6)',
            color: currentStep === step.num ? 'white' : DESIGN_TOKENS.colors.text.secondary,
            cursor: onStepClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            fontFamily: DESIGN_TOKENS.typography.fontFamily,
            fontSize: DESIGN_TOKENS.typography.fontSize.sm,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: currentStep === step.num ? 'transparent' : DESIGN_TOKENS.colors.primary,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            {step.num}
          </div>
          <span>{step.title}</span>
        </div>
        {index < steps.length - 1 && (
          <div style={{
            width: '32px',
            height: '2px',
            background: currentStep > step.num 
              ? DESIGN_TOKENS.colors.primary 
              : 'rgba(139, 92, 246, 0.2)',
            transition: 'all 0.2s ease',
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ===================
// GRADIENT UTILITIES
// ===================

export const STANDARD_GRADIENTS = {
  primary: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.primary}, #6366f1)`,
  card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
  rainbow: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcf7f, #4d9de0, #9b59b6)',
};

// ===================
// LAYOUT UTILITIES
// ===================

export const STANDARD_LAYOUTS = {
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: DESIGN_TOKENS.spacing.lg,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: DESIGN_TOKENS.spacing['2xl'],
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: DESIGN_TOKENS.spacing['2xl'],
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
