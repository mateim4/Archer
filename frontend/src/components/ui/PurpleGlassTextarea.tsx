/**
 * PurpleGlassTextarea Component
 * 
 * A standardized textarea component with Fluent UI 2 design tokens, glassmorphism variants,
 * auto-resize capability, and character counting.
 * 
 * Features:
 * - Glassmorphism variants (none, light, medium, heavy)
 * - Validation states (error, warning, success)
 * - Auto-resize option
 * - Character count with max length
 * - Required field indicator
 * - Helper text
 * - Full accessibility
 * 
 * @example
 * ```tsx
 * <PurpleGlassTextarea
 *   label="Description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   maxLength={500}
 *   showCharacterCount
 *   autoResize
 *   glass="medium"
 * />
 * ```
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useTextareaStyles } from './styles/useTextareaStyles';
import type { GlassVariant, ValidationState } from './PurpleGlassInput';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PurpleGlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label text displayed above the textarea
   */
  label?: string;

  /**
   * Helper text displayed below the textarea
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
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Enable auto-resize based on content
   * @default false
   */
  autoResize?: boolean;

  /**
   * Show character count
   * @default false
   */
  showCharacterCount?: boolean;

  /**
   * Warning threshold for character count (percentage)
   * @default 0.8
   */
  warningThreshold?: number;

  /**
   * Additional CSS class name for the wrapper
   */
  className?: string;

  /**
   * Additional CSS class name for the textarea element
   */
  textareaClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PurpleGlassTextarea = forwardRef<HTMLTextAreaElement, PurpleGlassTextareaProps>(
  (
    {
      label,
      helperText,
      validationState = 'default',
      glass = 'none',
      required = false,
      autoResize = false,
      showCharacterCount = false,
      warningThreshold = 0.8,
      className,
      textareaClassName,
      disabled,
      maxLength,
      value,
      onChange,
      ...textareaProps
    },
    ref
  ) => {
    const styles = useTextareaStyles();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize, textareaRef]);

    // Generate unique ID for aria-describedby
    const helperId = helperText ? `${textareaProps.id || 'textarea'}-helper` : undefined;

    // Calculate character count
    const currentLength = typeof value === 'string' ? value.length : 0;
    const isNearLimit = maxLength && currentLength >= maxLength * warningThreshold;
    const isAtLimit = maxLength && currentLength >= maxLength;

    // Determine textarea class based on validation state and glass variant
    const getTextareaClasses = () => {
      const classes = [styles.textarea];

      // Auto-resize
      if (autoResize) classes.push(styles.autoResize);

      // Glass variant
      if (glass === 'light') classes.push(styles.glassLight);
      if (glass === 'medium') classes.push(styles.glassMedium);
      if (glass === 'heavy') classes.push(styles.glassHeavy);

      // Validation state
      if (validationState === 'error') classes.push(styles.textareaError);
      if (validationState === 'warning') classes.push(styles.textareaWarning);
      if (validationState === 'success') classes.push(styles.textareaSuccess);

      // Disabled
      if (disabled) classes.push(styles.textareaDisabled);

      // Custom class
      if (textareaClassName) classes.push(textareaClassName);

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

    // Determine character count class
    const getCharacterCountClasses = () => {
      const classes = [styles.characterCount];

      if (isAtLimit) classes.push(styles.characterCountError);
      else if (isNearLimit) classes.push(styles.characterCountWarning);

      return mergeClasses(...classes);
    };

    return (
      <div className={mergeClasses(styles.textareaWrapper, className)}>
        {/* Label */}
        {label && (
          <label htmlFor={textareaProps.id} className={styles.label}>
            {label}
            {required && <span className={styles.labelRequired}> *</span>}
          </label>
        )}

        {/* Textarea Container */}
        <div className={styles.textareaContainer}>
          <textarea
            ref={textareaRef}
            className={getTextareaClasses()}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            aria-invalid={validationState === 'error'}
            aria-describedby={helperId}
            {...textareaProps}
          />
        </div>

        {/* Footer: Helper Text + Character Count */}
        {(helperText || showCharacterCount) && (
          <div className={styles.footer}>
            {/* Helper Text */}
            {helperText && (
              <span id={helperId} className={getHelperTextClasses()} role="alert">
                {helperText}
              </span>
            )}

            {/* Character Count */}
            {showCharacterCount && maxLength && (
              <span className={getCharacterCountClasses()}>
                {currentLength} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

PurpleGlassTextarea.displayName = 'PurpleGlassTextarea';

export default PurpleGlassTextarea;
