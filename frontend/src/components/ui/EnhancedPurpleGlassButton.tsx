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

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'ghost' | 'link';
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
    fontWeight: tokens.fontWeightMedium, // Lighter than semibold (500 vs 600)
    cursor: 'pointer',
    userSelect: 'none',
    textDecoration: 'none',
    ...shorthands.border('1px', 'solid', 'transparent'),
    ...shorthands.outline('none'),
    // Slower, more elegant transitions (0.4s instead of 0.3s)
    ...shorthands.transition('all', '0.4s', 'cubic-bezier(0.25, 0.1, 0.25, 1)'),
    
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

  // Animated gradient overlay - Yoga Perdana style hue-shift shimmer
  // Instead of brightness changes, we animate a subtle hue rotation
  animatedGradient: {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...shorthands.borderRadius('inherit'),
      // Subtle hue-shifting gradient that sweeps across
      // Uses semi-transparent colors that blend with the button's own gradient
      backgroundImage: `linear-gradient(
        110deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.06) 20%,
        rgba(200, 220, 255, 0.08) 40%,
        rgba(220, 200, 255, 0.08) 60%,
        rgba(255, 255, 255, 0.06) 80%,
        rgba(255, 255, 255, 0) 100%
      )`,
      backgroundSize: '300% 100%',
      opacity: 0.8,
      pointerEvents: 'none',
      animationName: {
        '0%': { backgroundPosition: '150% 0' },
        '100%': { backgroundPosition: '-150% 0' },
      },
      animationDuration: '12s', // Slower, more elegant
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
      willChange: 'background-position',
    },
    
    '&:hover::before': {
      opacity: 1,
      animationDuration: '6s', // Speed up slightly on hover
    },
  },

  // Size variants - subtle rounded corners (not pill-shaped)
  small: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    ...shorthands.padding('6px', '14px'),
    ...shorthands.gap(tokens.xs),
    ...shorthands.borderRadius('6px'),
    minHeight: '28px',
  },

  medium: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.padding('8px', '18px'),
    ...shorthands.gap(tokens.s),
    ...shorthands.borderRadius('8px'),
    minHeight: '36px',
  },

  large: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.padding('12px', '24px'),
    ...shorthands.gap(tokens.m),
    ...shorthands.borderRadius('10px'),
    minHeight: '44px',
  },

  // Variant: Primary - Yoga Perdana hue-shift gradient (purple 260° → blue-purple 250°)
  // Constant brightness ~58%, just shifting hue for visual interest
  primary: {
    background: 'linear-gradient(135deg, rgba(111, 91, 235, 0.82) 0%, rgba(99, 102, 241, 0.82) 100%)',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...shorthands.border('none'),
    boxShadow: `
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',

    '&:hover:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(111, 91, 235, 0.9) 0%, rgba(99, 102, 241, 0.9) 100%)',
      boxShadow: `
        0 2px 8px rgba(111, 91, 235, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2)
      `,
      transform: 'translateY(-1px)',
    },

    '&:active:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(99, 91, 220, 0.88) 0%, rgba(88, 91, 230, 0.88) 100%)',
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,
      transform: 'translateY(0px) scale(0.98)',
    },
  },

  // Variant: Secondary - Clean frosted white glass, minimal edges
  secondary: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(250, 251, 255, 0.75) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    color: '#4338ca', // cool indigo text
    ...shorthands.border('none'),
    boxShadow: `
      0 1px 3px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.5)
    `,

    '&:hover:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(250, 251, 255, 0.85) 100%)',
      boxShadow: `
        0 2px 8px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6)
      `,
      transform: 'translateY(-1px)',
    },

    '&:active:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(248, 250, 255, 0.8) 0%, rgba(245, 248, 255, 0.8) 100%)',
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.4)
      `,
      transform: 'translateY(0px) scale(0.98)',
    },
  },

  // Variant: Danger - Yoga Perdana hue-shift gradient (red 0° → coral 15°)
  // Constant brightness, shifting hue for depth
  danger: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.82) 0%, rgba(248, 88, 78, 0.82) 100%)',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...shorthands.border('none'),
    boxShadow: `
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',

    '&:hover:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(248, 88, 78, 0.9) 100%)',
      boxShadow: `
        0 2px 8px rgba(239, 68, 68, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2)
      `,
      transform: 'translateY(-1px)',
    },

    '&:active:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(230, 65, 65, 0.88) 0%, rgba(240, 80, 72, 0.88) 100%)',
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,
      transform: 'translateY(0px) scale(0.98)',
    },
  },

  // Variant: Ghost - Subtle frosted glass with dynamic inverted text
  ghost: {
    background: 'rgba(128, 128, 128, 0.12)',
    color: 'white', // Base color for mix-blend-mode
    ...shorthands.border('none'),
    ...shorthands.borderRadius('8px'),
    backdropFilter: 'blur(12px) saturate(120%)',
    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    // Slower transition to match other buttons
    ...shorthands.transition('all', '0.4s', 'cubic-bezier(0.25, 0.1, 0.25, 1)'),
    // Mix-blend-mode on the button makes text invert relative to background
    mixBlendMode: 'difference' as const,

    '&:hover:not(:disabled)': {
      background: 'rgba(128, 128, 128, 0.2)',
      backdropFilter: 'blur(16px) saturate(140%)',
      WebkitBackdropFilter: 'blur(16px) saturate(140%)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
      transform: 'translateY(-1px)',
    },

    '&:active:not(:disabled)': {
      background: 'rgba(128, 128, 128, 0.28)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      transform: 'translateY(0px) scale(0.98)',
    },
  },

  // Variant: Link (cool purple)
  link: {
    backgroundColor: 'transparent',
    color: '#5B4FC7', // cool indigo
    ...shorthands.borderColor('transparent'),
    ...shorthands.padding(0),
    minHeight: 'auto',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    textDecorationColor: 'rgba(91, 79, 199, 0.4)',

    '&:hover:not(:disabled)': {
      color: '#4338ca',
      textDecorationColor: 'rgba(67, 56, 202, 0.6)',
    },

    '&:active:not(:disabled)': {
      color: '#3730a3',
    },
  },

  // Variant: Success - Yoga Perdana hue-shift gradient (sea green 177° → cyan 185°)
  // Constant brightness ~60%, shifting hue towards cyan for depth
  success: {
    background: 'linear-gradient(135deg, rgba(32, 178, 170, 0.82) 0%, rgba(45, 180, 190, 0.82) 100%)',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...shorthands.border('none'),
    boxShadow: `
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',

    '&:hover:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(32, 178, 170, 0.9) 0%, rgba(45, 180, 190, 0.9) 100%)',
      boxShadow: `
        0 2px 8px rgba(32, 178, 170, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2)
      `,
      transform: 'translateY(-1px)',
    },

    '&:active:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(30, 170, 165, 0.88) 0%, rgba(40, 172, 182, 0.88) 100%)',
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,
      transform: 'translateY(0px) scale(0.98)',
    },
  },

  // Variant: Info - Yoga Perdana hue-shift gradient (blue 217° → indigo 230°)
  // Constant brightness ~58%, shifting towards purple for depth
  info: {
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.82) 0%, rgba(79, 120, 255, 0.82) 100%)',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...shorthands.border('none'),
    boxShadow: `
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.15)
    `,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',

    '&:hover:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(79, 120, 255, 0.9) 100%)',
      boxShadow: `
        0 2px 8px rgba(59, 130, 246, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2)
      `,
      transform: 'translateY(-1px)',
    },

    '&:active:not(:disabled)': {
      background: 'linear-gradient(135deg, rgba(55, 122, 240, 0.88) 0%, rgba(72, 112, 248, 0.88) 100%)',
      boxShadow: `
        0 1px 2px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      `,
      transform: 'translateY(0px) scale(0.98)',
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

  // Content wrapper - ensures icon+text stay inline
  content: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
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
    ...shorthands.padding('8px'),
    aspectRatio: '1',
    ...shorthands.borderRadius('6px'), // Subtle rounding for square buttons
  },

  iconStart: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '16px',
    lineHeight: 1,
    '& > svg': {
      width: '16px',
      height: '16px',
    },
  },

  iconEnd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '16px',
    lineHeight: 1,
    '& > svg': {
      width: '16px',
      height: '16px',
    },
  },

  // Full width
  fullWidth: {
    width: '100%',
  },

  // Elevated - updated with cool purple
  elevated: {
    boxShadow: '0 8px 32px rgba(111, 91, 235, 0.25)',

    '&:hover:not(:disabled)': {
      boxShadow: '0 12px 40px rgba(111, 91, 235, 0.35)',
    },
  },

  // Dark mode overrides - clean minimal edges
  '@media (prefers-color-scheme: dark)': {
    secondary: {
      // Hue-shift: dark gray-blue → slightly more purple-gray
      background: 'linear-gradient(135deg, rgba(45, 48, 58, 0.85) 0%, rgba(50, 48, 62, 0.85) 100%)',
      color: '#a5b4fc', // cool indigo light
      ...shorthands.border('none'),
      boxShadow: `
        0 1px 3px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.06)
      `,

      '&:hover:not(:disabled)': {
        background: 'linear-gradient(135deg, rgba(55, 58, 68, 0.9) 0%, rgba(58, 56, 72, 0.9) 100%)',
        boxShadow: `
          0 2px 8px rgba(0, 0, 0, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.08)
        `,
      },
    },

    ghost: {
      // Ghost uses mix-blend-mode: difference, so it auto-inverts
      // No color override needed - it's dynamic
      '&:hover:not(:disabled)': {
        background: 'rgba(128, 128, 128, 0.15)',
      },
    },

    link: {
      color: '#a5b4fc', // cool indigo light

      '&:hover:not(:disabled)': {
        color: '#c7d2fe',
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
    const isIconOnly = Boolean((icon || iconEnd) && !children);

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
      variant === 'success' && styles.success,
      variant === 'info' && styles.info,
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
    const contentClasses = mergeClasses(
      styles.content,
      loading && styles.loadingContent
    );

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
