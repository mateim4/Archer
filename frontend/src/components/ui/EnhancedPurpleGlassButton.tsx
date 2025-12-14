/**
 * Enhanced Purple Glass Button Component
 * 
 * A premium button component with animated gradients, glassmorphism effects,
 * and full accessibility support.
 * 
 * Features:
 * - Animated gradient backgrounds (subtle, continuous movement)
 * - Multiple variants: primary, secondary, danger, ghost, link
 * - Size options: small, medium, large
 * - Loading states with spinner
 * - Icon support (start/end positions)
 * - Full accessibility (WCAG 2.2 compliant)
 * - Light/dark mode support
 * - Respects prefers-reduced-motion
 * - GPU-accelerated animations
 * 
 * @example
 * ```tsx
 * <EnhancedPurpleGlassButton
 *   variant="primary"
 *   size="medium"
 *   animated
 *   icon={<SaveRegular />}
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </EnhancedPurpleGlassButton>
 * ```
 */

import React, { forwardRef } from 'react';
import { mergeClasses, Spinner } from '@fluentui/react-components';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { tokens, gradients, purplePalette } from '../../styles/design-tokens';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface EnhancedPurpleGlassButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Size of the button
   * @default 'medium'
   */
  size?: ButtonSize;

  /**
   * Enable animated gradient background
   * @default true
   */
  animated?: boolean;

  /**
   * Show loading spinner and disable interaction
   * @default false
   */
  loading?: boolean;

  /**
   * Disable the button
   * @default false
   */
  disabled?: boolean;

  /**
   * Icon element to display before the text
   */
  icon?: React.ReactNode;

  /**
   * Icon element to display after the text
   */
  iconEnd?: React.ReactNode;

  /**
   * Button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Make button full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Add elevated shadow effect
   * @default false
   */
  elevated?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Button content
   */
  children?: React.ReactNode;
}

// ============================================================================
// STYLES
// ============================================================================

const useStyles = makeStyles({
  // Base button styles
  button: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
    fontWeight: tokens.fontWeightSemibold,
    cursor: 'pointer',
    userSelect: 'none',
    textDecoration: 'none',
    ...shorthands.border('1px', 'solid', 'transparent'),
    ...shorthands.outline('none'),
    ...shorthands.transition('all', '0.3s', 'cubic-bezier(0.4, 0, 0.2, 1)'),
    
    '&:focus-visible': {
      ...shorthands.outline('2px', 'solid', purplePalette.purple500),
      outlineOffset: '2px',
    },

    '&:active:not(:disabled)': {
      transform: 'translateY(-1px) scale(0.98)',
    },

    // Respect prefers-reduced-motion
    '@media (prefers-reduced-motion: reduce)': {
      '&::before': {
        animationName: 'none !important',
      },
    },
  },

  // Animated gradient overlay
  animatedGradient: {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...shorthands.borderRadius('inherit'),
      backgroundImage: `linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.05) 75%,
        rgba(255, 255, 255, 0.1) 100%
      )`,
      backgroundSize: '400% 400%',
      opacity: 0.3,
      pointerEvents: 'none',
      animationName: {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      animationDuration: '8s',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
      willChange: 'background-position',
    },
    
    '&:hover::before': {
      opacity: 0.5,
      animationDuration: '4s',
    },
  },

  // Size variants
  small: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    ...shorthands.padding(tokens.xs, tokens.m),
    ...shorthands.gap(tokens.xs),
    ...shorthands.borderRadius(tokens.medium),
    minHeight: '28px',
  },

  medium: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.padding(tokens.s, tokens.l),
    ...shorthands.gap(tokens.s),
    ...shorthands.borderRadius(tokens.large),
    minHeight: '36px',
  },

  large: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.padding(tokens.m, tokens.xl),
    ...shorthands.gap(tokens.m),
    ...shorthands.borderRadius(tokens.xLarge),
    minHeight: '44px',
  },

  // Variant: Primary
  primary: {
    backgroundImage: gradients.buttonPrimary,
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.28)'),
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',

    '&:hover:not(:disabled)': {
      backgroundImage: gradients.buttonPrimaryHover,
      boxShadow: '0 8px 25px rgba(139, 92, 246, 0.45)',
      transform: 'translateY(-3px) scale(1.02)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.4)'),
    },

    '&:active:not(:disabled)': {
      backgroundImage: gradients.buttonPrimaryActive,
      boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // Variant: Secondary
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: purplePalette.purple600,
    ...shorthands.border('1px', 'solid', 'rgba(139, 92, 246, 0.3)'),
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',

    '&:hover:not(:disabled)': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      ...shorthands.borderColor('rgba(139, 92, 246, 0.5)'),
      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15)',
      transform: 'translateY(-2px) scale(1.01)',
    },

    '&:active:not(:disabled)': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // Variant: Danger
  danger: {
    backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.28)'),
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',

    '&:hover:not(:disabled)': {
      backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      boxShadow: '0 8px 25px rgba(239, 68, 68, 0.45)',
      transform: 'translateY(-2px) scale(1.01)',
    },

    '&:active:not(:disabled)': {
      backgroundImage: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // Variant: Ghost
  ghost: {
    backgroundColor: 'transparent',
    color: purplePalette.purple600,
    ...shorthands.borderColor('transparent'),

    '&:hover:not(:disabled)': {
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      transform: 'translateY(-2px)',
    },

    '&:active:not(:disabled)': {
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      transform: 'translateY(-1px) scale(0.98)',
    },
  },

  // Variant: Link
  link: {
    backgroundColor: 'transparent',
    color: purplePalette.purple600,
    ...shorthands.borderColor('transparent'),
    ...shorthands.padding(0),
    minHeight: 'auto',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',

    '&:hover:not(:disabled)': {
      color: purplePalette.purple700,
      textDecorationThickness: '2px',
    },

    '&:active:not(:disabled)': {
      color: purplePalette.purple800,
    },
  },

  // State: Disabled
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
    boxShadow: 'none',
  },

  // State: Loading
  loading: {
    position: 'relative',
    pointerEvents: 'none',
  },

  loadingContent: {
    opacity: 0,
  },

  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Icon support
  iconOnly: {
    ...shorthands.padding(tokens.s),
    aspectRatio: '1',
  },

  iconStart: {
    display: 'flex',
    alignItems: 'center',
    marginRight: `-${tokens.xxs}`,
  },

  iconEnd: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: `-${tokens.xxs}`,
  },

  // Full width
  fullWidth: {
    width: '100%',
  },

  // Elevated
  elevated: {
    boxShadow: '0 12px 40px rgba(139, 92, 246, 0.25)',

    '&:hover:not(:disabled)': {
      boxShadow: '0 16px 50px rgba(139, 92, 246, 0.35)',
    },
  },

  // Dark mode overrides
  '@media (prefers-color-scheme: dark)': {
    secondary: {
      backgroundColor: 'rgba(50, 50, 50, 0.8)',
      color: purplePalette.purple300,
      ...shorthands.borderColor('rgba(139, 92, 246, 0.4)'),

      '&:hover:not(:disabled)': {
        backgroundColor: 'rgba(60, 60, 60, 0.9)',
        ...shorthands.borderColor('rgba(139, 92, 246, 0.6)'),
      },
    },

    ghost: {
      color: purplePalette.purple300,

      '&:hover:not(:disabled)': {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
      },
    },

    link: {
      color: purplePalette.purple300,

      '&:hover:not(:disabled)': {
        color: purplePalette.purple200,
      },
    },
  },
});

// ============================================================================
// COMPONENT
// ============================================================================

export const EnhancedPurpleGlassButton = forwardRef<HTMLButtonElement, EnhancedPurpleGlassButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      animated = true,
      loading = false,
      disabled = false,
      icon,
      iconEnd,
      type = 'button',
      fullWidth = false,
      elevated = false,
      className,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const styles = useStyles();

    // Determine if button has only icon (no text)
    const isIconOnly = (icon || iconEnd) && !children;

    // Build button class names
    const buttonClasses = mergeClasses(
      styles.button,
      // Size
      size === 'small' && styles.small,
      size === 'medium' && styles.medium,
      size === 'large' && styles.large,
      // Variant
      variant === 'primary' && styles.primary,
      variant === 'secondary' && styles.secondary,
      variant === 'danger' && styles.danger,
      variant === 'ghost' && styles.ghost,
      variant === 'link' && styles.link,
      // States
      (disabled || loading) && styles.disabled,
      loading && styles.loading,
      // Features
      animated && variant !== 'link' && styles.animatedGradient,
      isIconOnly && styles.iconOnly,
      fullWidth && styles.fullWidth,
      elevated && variant !== 'link' && styles.elevated,
      // Custom class
      className
    );

    // Content wrapper for loading state
    const contentClasses = loading ? styles.loadingContent : undefined;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={buttonClasses}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...buttonProps}
      >
        {/* Loading Spinner */}
        {loading && (
          <span className={styles.spinner} aria-label="Loading">
            <Spinner size="tiny" />
          </span>
        )}

        {/* Button Content */}
        <span className={contentClasses}>
          {icon && (
            <span className={styles.iconStart} aria-hidden="true">
              {icon}
            </span>
          )}
          {children}
          {iconEnd && (
            <span className={styles.iconEnd} aria-hidden="true">
              {iconEnd}
            </span>
          )}
        </span>
      </button>
    );
  }
);

EnhancedPurpleGlassButton.displayName = 'EnhancedPurpleGlassButton';

export default EnhancedPurpleGlassButton;
