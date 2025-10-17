/**
 * PurpleGlassSwitch Component
 * 
 * A standardized toggle switch component with Fluent UI 2 design tokens and glassmorphism variants.
 * 
 * Features:
 * - Glassmorphism variants (none, light, medium, heavy)
 * - Validation states (error, warning, success)
 * - Label positioning (before/after switch)
 * - Helper text
 * - Full accessibility
 * 
 * @example
 * ```tsx
 * <PurpleGlassSwitch
 *   label="Enable notifications"
 *   checked={isEnabled}
 *   onChange={(e) => setIsEnabled(e.target.checked)}
 *   glass="medium"
 * />
 * ```
 */

import React, { forwardRef } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useSwitchStyles } from './styles/useSwitchStyles';
import type { GlassVariant, ValidationState } from './PurpleGlassInput';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PurpleGlassSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text displayed next to the switch
   */
  label?: string;

  /**
   * Helper text displayed below the switch
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
   * Label position relative to switch
   * @default 'after'
   */
  labelPosition?: 'before' | 'after';

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

export const PurpleGlassSwitch = forwardRef<HTMLInputElement, PurpleGlassSwitchProps>(
  (
    {
      label,
      helperText,
      validationState = 'default',
      glass = 'none',
      labelPosition = 'after',
      disabled = false,
      checked = false,
      className,
      labelClassName,
      onChange,
      ...inputProps
    },
    ref
  ) => {
    const styles = useSwitchStyles();

    // Generate unique ID for label association
    const switchId = inputProps.id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const helperId = helperText ? `${switchId}-helper` : undefined;

    // Get switch track classes
    const getTrackClasses = () => {
      const classes = [styles.switchTrack];

      // Glass variant
      if (glass === 'light') classes.push(styles.switchGlassLight);
      if (glass === 'medium') classes.push(styles.switchGlassMedium);
      if (glass === 'heavy') classes.push(styles.switchGlassHeavy);

      // Checked state
      if (checked) {
        classes.push(styles.switchChecked);
      }

      // Validation state (only when not checked)
      if (!checked) {
        if (validationState === 'error') classes.push(styles.switchError);
        if (validationState === 'warning') classes.push(styles.switchWarning);
        if (validationState === 'success') classes.push(styles.switchSuccess);
      }

      // Disabled
      if (disabled) classes.push(styles.switchDisabled);

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
      <div className={mergeClasses(styles.switchWrapper, className)}>
        <label
          className={mergeClasses(
            styles.container,
            disabled && styles.containerDisabled,
            labelPosition === 'before' && styles.containerReversed
          )}
          htmlFor={switchId}
        >
          {/* Hidden Native Input (for accessibility) */}
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={switchId}
            className={styles.hiddenInput}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            aria-checked={checked}
            aria-invalid={validationState === 'error'}
            aria-describedby={helperId}
            {...inputProps}
          />

          {/* Visual Switch Track */}
          <div className={getTrackClasses()}>
            {/* Switch Thumb (moving circle) */}
            <span className={mergeClasses(styles.switchThumb, checked && styles.switchThumbChecked)} />
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

PurpleGlassSwitch.displayName = 'PurpleGlassSwitch';

export default PurpleGlassSwitch;
