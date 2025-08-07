import React from 'react';
import { useEnhancedUX, useFormValidation, useEnhancedSearch, useModal, useA11y, useResponsive } from '../hooks/useEnhancedUX';
import '../ux-enhancements.css';

// Enhanced Toast Component
export const ToastContainer: React.FC = () => {
  const { toasts } = useEnhancedUX();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-notification ${toast.type} show`}
          role="alert"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

// Enhanced Loading Component
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  const { announceMessage, announce } = useA11y();

  React.useEffect(() => {
    announce(message);
  }, [message, announce]);

  return (
    <div className="loading-overlay show" role="status" aria-label={message}>
      <div className="flex flex-col items-center space-y-4">
        <div className="loading-spinner" />
        <span className="text-purple-600 font-medium">{message}</span>
      </div>
      <span className="visually-hidden">{announceMessage}</span>
    </div>
  );
};

// Enhanced Button Component
interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  children: React.ReactNode;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { isMobile } = useResponsive();
  
  const baseClasses = `
    enhanced-button focus-enhanced
    ${isMobile ? 'touch-target' : ''}
    relative inline-flex items-center justify-center
    px-6 py-3 rounded-lg font-medium
    transition-all duration-300 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700',
    secondary: 'bg-white/20 backdrop-blur-sm text-purple-700 border border-purple-300 hover:bg-white/30',
    ghost: 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// Enhanced Card Component
interface EnhancedCardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  hoverable = true,
  className = '',
  onClick
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={`
        ${hoverable ? 'interactive-card' : ''}
        ${isMobile ? 'mobile-card' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        bg-white/80 backdrop-blur-sm rounded-xl p-6
        border border-white/20 shadow-lg
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

// Enhanced Form Field Component
interface EnhancedFormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  error,
  touched,
  onChange,
  onBlur,
  placeholder,
  required = false
}) => {
  const { generateId } = useA11y();
  const fieldId = React.useMemo(() => generateId(name), [name, generateId]);
  const errorId = React.useMemo(() => generateId(`${name}-error`), [name, generateId]);

  return (
    <div className="form-field">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-white/50 backdrop-blur-sm
          border-2 transition-all duration-300
          focus:outline-none focus:ring-0
          ${error && touched ? 'error' : ''}
          ${!error && touched && value ? 'success' : ''}
        `}
      />
      {error && touched && (
        <div
          id={errorId}
          className={`form-error-message ${error ? 'show' : ''}`}
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
};

// Enhanced Search Component
interface EnhancedSearchProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  onResults: (results: T[]) => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedSearch<T>({
  items,
  searchFields,
  onResults,
  placeholder = 'Search...',
  className = ''
}: EnhancedSearchProps<T>) {
  const {
    query,
    filteredItems,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSearch,
    setQuery
  } = useEnhancedSearch(items, searchFields);

  React.useEffect(() => {
    onResults(filteredItems);
  }, [filteredItems, onResults]);

  return (
    <div className={`search-container ${className}`}>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="
            w-full px-4 py-3 pl-10 rounded-lg
            bg-white/50 backdrop-blur-sm
            border-2 border-purple-200
            focus:border-purple-500 focus:outline-none
            transition-all duration-300
          "
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className={`search-suggestions ${showSuggestions ? 'show' : ''}`}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="search-suggestion-item"
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced Modal Component
interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const EnhancedModal: React.FC<EnhancedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const { generateId } = useA11y();
  const modalId = React.useMemo(() => generateId('modal'), [generateId]);
  const titleId = React.useMemo(() => generateId('modal-title'), [generateId]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'show' : ''}`}>
      <div
        className={`modal-content ${isOpen ? 'show' : ''} ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        id={modalId}
      >
        <div className="flex items-center justify-between mb-6">
          {title && (
            <h2 id={titleId} className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg transition-colors duration-200
              hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500
            "
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Enhanced Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'purple' | 'green' | 'blue' | 'red';
}

export const EnhancedProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'purple'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const { generateId } = useA11y();
  const progressId = React.useMemo(() => generateId('progress'), [generateId]);

  const colorClasses = {
    purple: 'from-purple-500 to-indigo-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    red: 'from-red-500 to-pink-500'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label htmlFor={progressId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          id={progressId}
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
};
