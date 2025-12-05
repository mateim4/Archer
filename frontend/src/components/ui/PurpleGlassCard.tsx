/**
 * PurpleGlassCard Component
 * 
 * A standardized card component with Fluent UI 2 design tokens, multiple variants,
 * and glassmorphism effects. Supports header, body, and footer sections.
 * 
 * Features:
 * - Variants: default, interactive, elevated, outlined, subtle
 * - Glassmorphism support
 * - Header with title and actions
 * - Body content area
 * - Footer with action buttons
 * - Padding variants (none, small, medium, large)
 * - Selected state
 * - Loading skeleton
 * - Horizontal orientation
 * - Full accessibility
 * 
 * @example
 * ```tsx
 * <PurpleGlassCard
 *   variant="elevated"
 *   glass
 *   header="Project Overview"
 *   headerActions={<Button icon={<MoreHorizontalRegular />} />}
 * >
 *   <p>Card content goes here</p>
 * </PurpleGlassCard>
 * ```
 */

import React, { forwardRef } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useCardStyles } from './styles/useCardStyles';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CardVariant = 'default' | 'interactive' | 'elevated' | 'outlined' | 'subtle';
export type CardPadding = 'none' | 'small' | 'medium' | 'large';

export interface PurpleGlassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Visual variant of the card
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Enable glassmorphism effect
   * @default true
   */
  glass?: boolean;

  /**
   * Padding size
   * @default 'medium'
   */
  padding?: CardPadding;

  /**
   * Card header content (title or custom element)
   */
  header?: React.ReactNode;

  /**
   * Action elements in the header (buttons, menus, etc.)
   */
  headerActions?: React.ReactNode;

  /**
   * Footer content (typically action buttons)
   */
  footer?: React.ReactNode;

  /**
   * Show selected state
   * @default false
   */
  selected?: boolean;

  /**
   * Show loading skeleton
   * @default false
   */
  loading?: boolean;

  /**
   * Disable the card (for interactive variant)
   * @default false
   */
  disabled?: boolean;

  /**
   * Make card full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Horizontal layout (for media cards)
   * @default false
   */
  horizontal?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Card body content
   */
  children?: React.ReactNode;

  /**
   * Click handler (automatically makes card interactive)
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /**
   * Role attribute for accessibility
   */
  role?: string;

  /**
   * ARIA label
   */
  'aria-label'?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PurpleGlassCard = forwardRef<HTMLDivElement, PurpleGlassCardProps>(
  (
    {
      variant = 'default',
      glass = true,
      padding = 'medium',
      header,
      headerActions,
      footer,
      selected = false,
      loading = false,
      disabled = false,
      fullWidth = false,
      horizontal = false,
      className,
      children,
      onClick,
      role,
      ...divProps
    },
    ref
  ) => {
    const styles = useCardStyles();

    // If onClick is provided, make card interactive
    const effectiveVariant = onClick && variant === 'default' ? 'interactive' : variant;
    const isClickable = onClick && !disabled && !loading;

    // Build card class names
    const getCardClasses = () => {
      const classes = [styles.card];

      // Variant (with glass support)
      if (effectiveVariant === 'default') {
        classes.push(glass ? styles.defaultGlass : styles.default);
      } else if (effectiveVariant === 'interactive') {
        classes.push(glass ? styles.interactiveGlass : styles.interactive);
      } else if (effectiveVariant === 'elevated') {
        classes.push(glass ? styles.elevatedGlass : styles.elevated);
      } else if (effectiveVariant === 'outlined') {
        classes.push(glass ? styles.outlinedGlass : styles.outlined);
      } else if (effectiveVariant === 'subtle') {
        classes.push(styles.subtle);
      }

      // Padding
      if (padding === 'none') classes.push(styles.paddingNone);
      else if (padding === 'small') classes.push(styles.paddingSmall);
      else if (padding === 'medium') classes.push(styles.paddingMedium);
      else if (padding === 'large') classes.push(styles.paddingLarge);

      // States
      if (selected) classes.push(styles.selected);
      if (loading) classes.push(styles.loading);
      if (disabled) classes.push(styles.disabled);

      // Layout
      if (fullWidth) classes.push(styles.fullWidth);
      if (horizontal) classes.push(styles.horizontal);

      // Custom class
      if (className) classes.push(className);

      return mergeClasses(...classes);
    };

    // Determine role
    const cardRole = role || (isClickable ? 'button' : undefined);
    const tabIndex = isClickable ? 0 : undefined;

    // Handle keyboard interaction for clickable cards
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick?.(event as any);
      }
    };

    // Render header if provided
    const renderHeader = () => {
      if (!header && !headerActions) return null;

      return (
        <div className={styles.header}>
          {typeof header === 'string' ? (
            <h3 className={styles.headerTitle}>{header}</h3>
          ) : (
            header
          )}
          {headerActions && <div className={styles.headerActions}>{headerActions}</div>}
        </div>
      );
    };

    // Render footer if provided
    const renderFooter = () => {
      if (!footer) return null;

      return <div className={styles.footer}>{footer}</div>;
    };

    return (
      <div
        ref={ref}
        className={getCardClasses()}
        onClick={isClickable ? onClick : undefined}
        onKeyDown={handleKeyDown}
        role={cardRole}
        tabIndex={tabIndex}
        aria-disabled={disabled || loading}
        {...divProps}
      >
        {renderHeader()}
        {children && <div className={styles.body}>{children}</div>}
        {renderFooter()}
      </div>
    );
  }
);

PurpleGlassCard.displayName = 'PurpleGlassCard';

export default PurpleGlassCard;
