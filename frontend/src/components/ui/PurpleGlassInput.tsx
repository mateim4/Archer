/**
 * PurpleGlassInput Component
 * 
 * A standardized input component with Fluent UI 2 design tokens, glassmorphism variants,
 * and comprehensive validation states.
 * 
 * Features:
 * - Glassmorphism variants (none, light, medium, heavy)
 * - Validation states (error, warning, success)
 * - Prefix/suffix icons
 * - Required field indicator
 * - Helper text
 * - Disabled state
 * - Full accessibility (ARIA, keyboard nav)
 * - TypeScript strict mode
 * 
 * @example
 * ```tsx
 * <PurpleGlassInput
 *   label="Email Address"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   required
 *   glass="medium"
 *   validationState="error"
 *   helperText="Please enter a valid email"
 * />
 * ```
 */

import React, { forwardRef } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useInputStyles } from './styles/useInputStyles';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type GlassVariant = 'none' | 'light' | 'medium' | 'heavy';
export type ValidationState = 'default' | 'error' | 'warning' | 'success';

export interface PurpleGlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /**
   * Label text displayed above the input
   */
  label?: string;

  /**
   * Helper text displayed below the input (description or validation message)
   */
  helperText?: string;

  /**
   * Validation state of the input
   * @default 'default'
   */
  validationState?: ValidationState;

  /**
   * Glassmorphism variant
   * @default 'none'
   */
  glass?: GlassVariant;

  /**
   * Icon element to display before the input
   */
  prefixIcon?: React.ReactNode;

  /**
   * Icon element to display after the input
   */
  suffixIcon?: React.ReactNode;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Additional CSS class name for the wrapper
   */
  className?: string;

  /**
   * Additional CSS class name for the input element
   */
  inputClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PurpleGlassInput = forwardRef<HTMLInputElement, PurpleGlassInputProps>(
  (
    {
      label,
      helperText,
      validationState = 'default',
      glass = 'none',
      prefixIcon,
      suffixIcon,
      required = false,
      className,
      inputClassName,
      disabled,
      ...inputProps
    },
    ref
  ) => {
    const styles = useInputStyles();

    // Generate unique ID for aria-describedby
    const helperId = helperText ? `${inputProps.id || 'input'}-helper` : undefined;

    // Determine input class based on validation state and glass variant
    const getInputClasses = () => {
      const classes = [styles.input];

      // Glass variant
      if (glass === 'light') classes.push(styles.glassLight);
      if (glass === 'medium') classes.push(styles.glassMedium);
      if (glass === 'heavy') classes.push(styles.glassHeavy);

      // Validation state
      if (validationState === 'error') classes.push(styles.inputError);
      if (validationState === 'warning') classes.push(styles.inputWarning);
      if (validationState === 'success') classes.push(styles.inputSuccess);

      // Disabled
      if (disabled) classes.push(styles.inputDisabled);

      // Icon spacing
      if (prefixIcon) classes.push(styles.inputWithPrefix);
      if (suffixIcon) classes.push(styles.inputWithSuffix);

      // Custom class
      if (inputClassName) classes.push(inputClassName);

      return mergeClasses(...classes);
    };

    // Determine helper text class based on validation state
    const getHelperTextClasses = () => {
      const classes = [styles.helperText];

      if (validationState === 'error') classes.push(styles.helperTextError);
      else if (validationState === 'warning') classes.push(styles.helperTextWarning);
      else if (validationState === 'success') classes.push(styles.helperTextSuccess);
      else classes.push(styles.helperTextDefault);

      return mergeClasses(...classes);
    };

    return (
      <div className={mergeClasses(styles.inputWrapper, className)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputProps.id} className={styles.label}>
            {label}
            {required && <span className={styles.labelRequired}> *</span>}
          </label>
        )}

        {/* Input Container */}
        <div className={styles.inputContainer}>
          {/* Prefix Icon */}
          {prefixIcon && (
            <span className={mergeClasses(styles.iconContainer, styles.iconPrefix)}>
              {prefixIcon}
            </span>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            className={getInputClasses()}
            disabled={disabled}
            required={required}
            aria-invalid={validationState === 'error'}
            aria-describedby={helperId}
            {...inputProps}
          />

          {/* Suffix Icon */}
          {suffixIcon && (
            <span className={mergeClasses(styles.iconContainer, styles.iconSuffix)}>
              {suffixIcon}
            </span>
          )}
        </div>

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

PurpleGlassInput.displayName = 'PurpleGlassInput';

export default PurpleGlassInput;
