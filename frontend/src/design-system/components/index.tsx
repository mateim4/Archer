import React from 'react';
import { FluentTokens } from '../tokens';

// Fluent UI 2 Provider Component
interface FluentProviderProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  className?: string;
}

export const FluentProvider: React.FC<FluentProviderProps> = ({
  children,
  theme = 'light',
  className = ''
}) => {
  return (
    <div className={`fluent-provider fluent-theme-${theme} ${className}`}>
      {children}
    </div>
  );
};

export interface FluentButtonProps {
  variant?: 'primary' | 'secondary' | 'subtle' | 'icon';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'before' | 'after';
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'data-testid'?: string;
}

export const FluentButton: React.FC<FluentButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  iconPosition = 'before',
  children,
  onClick,
  type = 'button',
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = 'fluent2-button';
  const variantClasses = `fluent2-button-${variant}`;
  const sizeClasses = size === 'small' ? 'fluent2-button-small' : 
                     size === 'large' ? 'fluent2-button-large' : '';
  const iconOnlyClasses = !children && icon ? 'fluent2-button-icon' : '';
  
  const allClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    iconOnlyClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={allClasses}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
    >
      {icon && iconPosition === 'before' && (
        <span className="fluent2-button-icon-before">{icon}</span>
      )}
      {children && <span className="fluent2-button-text">{children}</span>}
      {icon && iconPosition === 'after' && (
        <span className="fluent2-button-icon-after">{icon}</span>
      )}
    </button>
  );
};

export interface FluentCardProps {
  children: React.ReactNode;
  interactive?: boolean;
  elevation?: 'low' | 'medium' | 'high';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  'data-testid'?: string;
}

export const FluentCard: React.FC<FluentCardProps> = ({
  children,
  interactive = false,
  elevation = 'medium',
  className = '',
  onClick,
  'data-testid': testId,
}) => {
  const baseClasses = 'fluent2-card';
  const interactiveClasses = interactive ? 'fluent2-card-interactive' : '';
  const elevationClasses = `fluent2-card-elevation-${elevation}`;
  
  const allClasses = [
    baseClasses,
    interactiveClasses,
    elevationClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={allClasses}
      onClick={onClick}
      data-testid={testId}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export interface FluentInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel';
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  description?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  'data-testid'?: string;
}

export const FluentInput: React.FC<FluentInputProps> = ({
  value,
  defaultValue,
  placeholder,
  disabled = false,
  required = false,
  type = 'text',
  size = 'medium',
  error = false,
  errorMessage,
  label,
  description,
  onChange,
  onFocus,
  onBlur,
  className = '',
  'data-testid': testId,
}) => {
  const inputId = React.useId();
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;

  const baseClasses = 'fluent2-input';
  const sizeClasses = size === 'small' ? 'fluent2-input-small' : 
                     size === 'large' ? 'fluent2-input-large' : '';
  const errorClasses = error ? 'fluent2-input-error' : '';
  
  const allClasses = [
    baseClasses,
    sizeClasses,
    errorClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="fluent2-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="fluent2-text fluent2-text-body-1-strong">
          {label}
          {required && <span className="fluent2-input-required"> *</span>}
        </label>
      )}
      {description && (
        <div id={descriptionId} className="fluent2-text fluent2-text-caption-1">
          {description}
        </div>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={allClasses}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error}
        data-testid={testId}
      />
      {errorMessage && (
        <div id={errorId} className="fluent2-text fluent2-text-caption-1 fluent2-input-error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export interface FluentTextProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'display' | 'title-1' | 'title-2' | 'title-3' | 'subtitle-1' | 'subtitle-2' | 
           'body-1' | 'body-1-strong' | 'body-2' | 'caption-1' | 'caption-2';
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const FluentText: React.FC<FluentTextProps> = ({
  as: Component = 'p',
  variant = 'body-1',
  children,
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = 'fluent2-text';
  const variantClasses = `fluent2-text-${variant}`;
  
  const allClasses = [
    baseClasses,
    variantClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={allClasses} data-testid={testId}>
      {children}
    </Component>
  );
};

export interface FluentBadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export const FluentBadge: React.FC<FluentBadgeProps> = ({
  variant = 'brand',
  size = 'medium',
  children,
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = 'fluent2-badge';
  const variantClasses = `fluent2-badge-${variant}`;
  const sizeClasses = size === 'small' ? 'fluent2-badge-small' : 
                     size === 'large' ? 'fluent2-badge-large' : '';
  
  const allClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={allClasses} data-testid={testId}>
      {children}
    </span>
  );
};

export interface FluentDividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  'data-testid'?: string;
}

export const FluentDivider: React.FC<FluentDividerProps> = ({
  orientation = 'horizontal',
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = 'fluent2-divider';
  const orientationClasses = orientation === 'vertical' ? 'fluent2-divider-vertical' : '';
  
  const allClasses = [
    baseClasses,
    orientationClasses,
    className
  ].filter(Boolean).join(' ');

  return <hr className={allClasses} data-testid={testId} />;
};
