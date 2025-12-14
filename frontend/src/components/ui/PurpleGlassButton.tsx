/**
 * @deprecated Use EnhancedPurpleGlassButton instead.
 * 
 * PurpleGlassButton Component (LEGACY)
 * 
 * This component is deprecated as of December 2025.
 * Use `EnhancedPurpleGlassButton` for all new development.
 * 
 * Migration notes:
 * - Remove `glass` prop (EnhancedPurpleGlassButton is always glass-styled)
 * - Replace `iconPosition="start"` with `icon={<Icon />}`
 * - Replace `iconPosition="end"` with `iconEnd={<Icon />}`
 * - New variants available: `success` and `info`
 * 
 * @example
 * // Old (deprecated):
 * <PurpleGlassButton variant="primary" glass icon={<SaveRegular />}>Save</PurpleGlassButton>
 * 
 * // New (preferred):
 * <EnhancedPurpleGlassButton variant="primary" icon={<SaveRegular />}>Save</EnhancedPurpleGlassButton>
 */

/**
 * PurpleGlassButton Component
 * 
 * A standardized button component with Fluent UI 2 design tokens, multiple variants,
 * sizes, and glassmorphism effects.
 * 
 * Features:
 * - Variants: primary, secondary, danger, ghost, link
 * - Sizes: small, medium, large
 * - Glassmorphism support
 * - Loading state with spinner
 * - Icon support (start/end positions)
 * - Disabled state
 * - Full width option
 * - Elevated shadow variant
 * - Full accessibility (ARIA, keyboard nav)
 * 
 * @example
 * ```tsx
 * <PurpleGlassButton
 *   variant="primary"
 *   size="medium"
 *   glass
 *   loading={isSubmitting}
 *   icon={<SaveRegular />}
 *   onClick={handleSave}
 * >
 *   Save Changes
 * </PurpleGlassButton>
 * ```
 */

import React, { forwardRef } from 'react';
import { mergeClasses, Spinner } from '@fluentui/react-components';
import { useButtonStyles } from './styles/useButtonStyles';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface PurpleGlassButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
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
   * Enable glassmorphism effect
   * @default false
   */
  glass?: boolean;

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
// COMPONENT
// ============================================================================

export const PurpleGlassButton = forwardRef<HTMLButtonElement, PurpleGlassButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      glass = false,
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
    const styles = useButtonStyles();

    // Determine if button has only icon (no text)
    const isIconOnly = (icon || iconEnd) && !children;

    // Build button class names
    const getButtonClasses = () => {
      const classes = [styles.button];

      // Size
      if (size === 'small') classes.push(styles.small);
      if (size === 'medium') classes.push(styles.medium);
      if (size === 'large') classes.push(styles.large);

      // Variant (with glass support)
      if (variant === 'primary') {
        classes.push(glass ? styles.primaryGlass : styles.primary);
      } else if (variant === 'secondary') {
        classes.push(glass ? styles.secondaryGlass : styles.secondary);
      } else if (variant === 'danger') {
        classes.push(styles.danger);
      } else if (variant === 'ghost') {
        classes.push(glass ? styles.ghostGlass : styles.ghost);
      } else if (variant === 'link') {
        classes.push(styles.link);
      }

      // States
      if (disabled || loading) classes.push(styles.disabled);
      if (loading) classes.push(styles.loading);

      // Layout
      if (isIconOnly) classes.push(styles.iconOnly);
      if (fullWidth) classes.push(styles.fullWidth);
      if (elevated && variant !== 'link') classes.push(styles.elevated);

      // Custom class
      if (className) classes.push(className);

      return mergeClasses(...classes);
    };

    // Content wrapper for loading state
    const contentClasses = loading ? styles.loadingContent : undefined;

    // Render icon with proper spacing
    const renderIcon = (iconElement: React.ReactNode, position: 'start' | 'end') => {
      if (!iconElement) return null;
      
      const iconClass = position === 'start' ? styles.iconStart : styles.iconEnd;
      
      return (
        <span className={iconClass} aria-hidden="true">
          {iconElement}
        </span>
      );
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={getButtonClasses()}
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
          {icon && renderIcon(icon, 'start')}
          {children}
          {iconEnd && renderIcon(iconEnd, 'end')}
        </span>
      </button>
    );
  }
);

PurpleGlassButton.displayName = 'PurpleGlassButton';

export default PurpleGlassButton;
