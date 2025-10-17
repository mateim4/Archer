/**
 * PurpleGlassCheckbox Component
 * 
 * A standardized checkbox component with Fluent UI 2 design tokens, glassmorphism variants,
 * and support for indeterminate state.
 * 
 * Features:
 * - Glassmorphism variants (none, light, medium, heavy)
 * - Validation states (error, warning, success)
 * - Indeterminate state
 * - Helper text
 * - Full accessibility
 * 
 * @example
 * ```tsx
 * <PurpleGlassCheckbox
 *   label="Accept terms and conditions"
 *   checked={isAccepted}
 *   onChange={(e) => setIsAccepted(e.target.checked)}
 *   glass="medium"
 * />
 * ```
 */

import React, { forwardRef, useRef, useEffect } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { CheckmarkRegular, SubtractRegular } from '@fluentui/react-icons';
import { useCheckboxStyles } from './styles/useCheckboxStyles';
import type { GlassVariant, ValidationState } from './PurpleGlassInput';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PurpleGlassCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text displayed next to the checkbox
   */
  label?: string;

  /**
   * Helper text displayed below the checkbox
   */
  helperText?: string;

  /**
   * Validation state
   * @default 'default'
   */
  validationState?: ValidationState;

  /**
   * Glassmorphism variant
   * @default 'none'
   */
  glass?: GlassVariant;

  /**
   * Whether the checkbox is in indeterminate state
   * (for "select all" checkboxes where some items are selected)
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Additional CSS class name for the wrapper
   */
  className?: string;

  /**
   * Additional CSS class name for the label
   */
  labelClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PurpleGlassCheckbox = forwardRef<HTMLInputElement, PurpleGlassCheckboxProps>(
  (
    {
      label,
      helperText,
      validationState = 'default',
      glass = 'none',
      indeterminate = false,
      disabled = false,
      checked = false,
      className,
      labelClassName,
      onChange,
      ...inputProps
    },
    ref
  ) => {
    const styles = useCheckboxStyles();
    const internalRef = useRef<HTMLInputElement>(null);
    const checkboxRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    // Set indeterminate property (can't be set via HTML attribute)
    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, checkboxRef]);

    // Generate unique ID for label association
    const checkboxId = inputProps.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const helperId = helperText ? `${checkboxId}-helper` : undefined;

    // Get checkbox classes
    const getCheckboxClasses = () => {
      const classes = [styles.checkboxInput];

      // Glass variant
      if (glass === 'light') classes.push(styles.checkboxGlassLight);
      if (glass === 'medium') classes.push(styles.checkboxGlassMedium);
      if (glass === 'heavy') classes.push(styles.checkboxGlassHeavy);

      // Checked or indeterminate state
      if (indeterminate) {
        classes.push(styles.checkboxIndeterminate);
      } else if (checked) {
        classes.push(styles.checkboxChecked);
      }

      // Validation state (only when not checked/indeterminate)
      if (!checked && !indeterminate) {
        if (validationState === 'error') classes.push(styles.checkboxError);
        if (validationState === 'warning') classes.push(styles.checkboxWarning);
        if (validationState === 'success') classes.push(styles.checkboxSuccess);
      }

      // Disabled
      if (disabled) classes.push(styles.checkboxDisabled);

      return mergeClasses(...classes);
    };

    // Get helper text classes
    const getHelperTextClasses = () => {
      const classes = [styles.helperText];

      if (validationState === 'error') classes.push(styles.helperTextError);
      else if (validationState === 'warning') classes.push(styles.helperTextWarning);
      else if (validationState === 'success') classes.push(styles.helperTextSuccess);
      else classes.push(styles.helperTextDefault);

      return mergeClasses(...classes);
    };

    return (
      <div className={mergeClasses(styles.checkboxWrapper, className)}>
        <label
          className={mergeClasses(
            styles.container,
            disabled && styles.containerDisabled
          )}
          htmlFor={checkboxId}
        >
          {/* Hidden Native Input (for accessibility) */}
          <input
            ref={checkboxRef}
            type="checkbox"
            id={checkboxId}
            className={styles.hiddenInput}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            aria-invalid={validationState === 'error'}
            aria-describedby={helperId}
            {...inputProps}
          />

          {/* Visual Checkbox */}
          <div className={getCheckboxClasses()}>
            {/* Checkmark Icon */}
            {!indeterminate && (
              <span className={mergeClasses(styles.checkmark, checked && styles.checkmarkVisible)}>
                <CheckmarkRegular />
              </span>
            )}

            {/* Indeterminate Icon */}
            {indeterminate && (
              <span className={mergeClasses(styles.indeterminateIcon, styles.indeterminateIconVisible)}>
                <SubtractRegular />
              </span>
            )}
          </div>

          {/* Label Text */}
          {label && (
            <span
              className={mergeClasses(
                styles.label,
                disabled && styles.labelDisabled,
                labelClassName
              )}
            >
              {label}
            </span>
          )}
        </label>

        {/* Helper Text */}
        {helperText && (
          <span id={helperId} className={getHelperTextClasses()} role="alert">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

PurpleGlassCheckbox.displayName = 'PurpleGlassCheckbox';

export default PurpleGlassCheckbox;
