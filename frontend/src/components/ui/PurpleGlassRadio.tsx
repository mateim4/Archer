/**
 * PurpleGlassRadio Component
 * 
 * A standardized radio button component with Fluent UI 2 design tokens, glassmorphism variants,
 * and card-style options for wizard-like interfaces.
 * 
 * Features:
 * - Standard and card variants
 * - Glassmorphism variants (none, light, medium, heavy)
 * - Validation states (error, warning, success)
 * - Radio group wrapper
 * - Helper text
 * - Full accessibility
 * 
 * @example
 * ```tsx
 * <PurpleGlassRadioGroup
 *   label="Select an option"
 *   value={selectedValue}
 *   onChange={(value) => setSelectedValue(value)}
 * >
 *   <PurpleGlassRadio value="1" label="Option 1" />
 *   <PurpleGlassRadio value="2" label="Option 2" />
 * </PurpleGlassRadioGroup>
 * ```
 */

import React, { forwardRef, createContext, useContext } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useRadioStyles } from './styles/useRadioStyles';
import type { GlassVariant, ValidationState } from './PurpleGlassInput';

// ============================================================================
// RADIO GROUP CONTEXT
// ============================================================================

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  glass?: GlassVariant;
  validationState?: ValidationState;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PurpleGlassRadioGroupProps {
  /**
   * Group label text
   */
  label?: string;

  /**
   * Helper text displayed below the group
   */
  helperText?: string;

  /**
   * Whether the group is required
   * @default false
   */
  required?: boolean;

  /**
   * Name attribute for all radio buttons in the group
   */
  name?: string;

  /**
   * Currently selected value
   */
  value?: string;

  /**
   * Change handler
   */
  onChange?: (value: string) => void;

  /**
   * Whether all radio buttons are disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Glassmorphism variant for all radio buttons
   * @default 'none'
   */
  glass?: GlassVariant;

  /**
   * Validation state for the group
   * @default 'default'
   */
  validationState?: ValidationState;

  /**
   * Layout direction
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Radio button children
   */
  children: React.ReactNode;
}

export interface PurpleGlassRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /**
   * Radio button value
   */
  value: string;

  /**
   * Label text displayed next to the radio button
   */
  label?: string;

  /**
   * Helper text displayed below the radio button
   */
  helperText?: string;

  /**
   * Glassmorphism variant (overrides group setting)
   */
  glass?: GlassVariant;

  /**
   * Use card variant (for wizard-style selections)
   * @default false
   */
  cardVariant?: boolean;

  /**
   * Card title (only for card variant)
   */
  cardTitle?: string;

  /**
   * Card description (only for card variant)
   */
  cardDescription?: string;

  /**
   * Visual icon displayed inside the card (only for card variant)
   */
  cardIcon?: React.ReactNode;

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
// RADIO GROUP COMPONENT
// ============================================================================

export const PurpleGlassRadioGroup = forwardRef<HTMLDivElement, PurpleGlassRadioGroupProps>(
  (
    {
      label,
      helperText,
      required = false,
      name,
      value,
      onChange,
      disabled = false,
      glass = 'none',
      validationState = 'default',
      orientation = 'vertical',
      className,
      children,
    },
    ref
  ) => {
    const styles = useRadioStyles();

    const contextValue: RadioGroupContextValue = {
      name,
      value,
      onChange,
      disabled,
      glass,
      validationState,
    };

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={mergeClasses(
            styles.radioGroup,
            orientation === 'horizontal' && styles.radioGroupHorizontal,
            className
          )}
          role="radiogroup"
          aria-required={required}
          aria-invalid={validationState === 'error'}
        >
          {/* Group Label */}
          {label && (
            <span className={styles.groupLabel}>
              {label}
              {required && <span className={styles.groupLabelRequired}> *</span>}
            </span>
          )}

          {/* Radio Buttons */}
          {children}

          {/* Group Helper Text */}
          {helperText && (
            <span className={styles.groupHelperText} role="alert">
              {helperText}
            </span>
          )}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

PurpleGlassRadioGroup.displayName = 'PurpleGlassRadioGroup';

// ============================================================================
// RADIO COMPONENT
// ============================================================================

export const PurpleGlassRadio = forwardRef<HTMLInputElement, PurpleGlassRadioProps>(
  (
    {
      value,
      label,
      helperText,
      glass,
      cardVariant = false,
      cardTitle,
      cardDescription,
  cardIcon,
      disabled,
      className,
      labelClassName,
      ...inputProps
    },
    ref
  ) => {
    const styles = useRadioStyles();
    const groupContext = useContext(RadioGroupContext);

    // Determine values from context or props
    const isChecked = groupContext?.value === value;
    const isDisabled = disabled ?? groupContext?.disabled ?? false;
    const glassVariant = glass ?? groupContext?.glass ?? 'none';
    const validationState = groupContext?.validationState ?? 'default';
    const name = groupContext?.name;

    // Generate unique ID
    const radioId = inputProps.id || `radio-${value}-${Math.random().toString(36).substr(2, 9)}`;
    const helperId = helperText ? `${radioId}-helper` : undefined;

    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        groupContext?.onChange?.(value);
      }
    };

    // Get radio classes
    const getRadioClasses = () => {
      const classes = [styles.radioInput];

      // Glass variant
      if (glassVariant === 'light') classes.push(styles.radioGlassLight);
      if (glassVariant === 'medium') classes.push(styles.radioGlassMedium);
      if (glassVariant === 'heavy') classes.push(styles.radioGlassHeavy);

      // Checked state
      if (isChecked) {
        classes.push(styles.radioChecked);
      }

      // Validation state (only when not checked)
      if (!isChecked) {
        if (validationState === 'error') classes.push(styles.radioError);
        if (validationState === 'warning') classes.push(styles.radioWarning);
        if (validationState === 'success') classes.push(styles.radioSuccess);
      }

      // Disabled
      if (isDisabled) classes.push(styles.radioDisabled);

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

    // Card variant
    if (cardVariant) {
      const cardClasses = mergeClasses(
        styles.cardContainer,
        glassVariant !== 'none' && styles.cardContainerGlass,
        isChecked && styles.cardContainerChecked,
        isDisabled && styles.cardContainerDisabled,
        className
      );

      const iconClasses = mergeClasses(
        styles.cardIconWrapper,
        isChecked && styles.cardIconChecked
      );

      return (
        <label className={cardClasses} htmlFor={radioId}>
          <input
            ref={ref}
            type="radio"
            id={radioId}
            value={value}
            name={name}
            className={styles.hiddenInput}
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleChange}
            aria-describedby={helperId}
            {...inputProps}
          />

          <div className={styles.cardIndicator}>
            <div className={getRadioClasses()}>
              <span className={mergeClasses(styles.innerDot, isChecked && styles.innerDotVisible)} />
            </div>
          </div>

          {cardIcon && <div className={iconClasses}>{cardIcon}</div>}

          {cardTitle && <div className={styles.cardTitle}>{cardTitle}</div>}

          {cardDescription && <div className={styles.cardDescription}>{cardDescription}</div>}
        </label>
      );
    }

    // Standard variant
    return (
      <div className={mergeClasses(styles.radioWrapper, className)}>
        <label
          className={mergeClasses(
            styles.container,
            isDisabled && styles.containerDisabled
          )}
          htmlFor={radioId}
        >
          {/* Hidden Native Input */}
          <input
            ref={ref}
            type="radio"
            id={radioId}
            value={value}
            name={name}
            className={styles.hiddenInput}
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleChange}
            aria-describedby={helperId}
            {...inputProps}
          />

          {/* Visual Radio */}
          <div className={getRadioClasses()}>
            <span className={mergeClasses(styles.innerDot, isChecked && styles.innerDotVisible)} />
          </div>

          {/* Label Text */}
          {label && (
            <span
              className={mergeClasses(
                styles.label,
                isDisabled && styles.labelDisabled,
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

PurpleGlassRadio.displayName = 'PurpleGlassRadio';

export default PurpleGlassRadio;
