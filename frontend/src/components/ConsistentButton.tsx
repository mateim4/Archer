import React from 'react';

interface ConsistentButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

const ConsistentButton: React.FC<ConsistentButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  style = {},
  type = 'button'
}) => {
  const sizeMap = {
    small: { padding: '8px 16px', fontSize: '14px', gap: '6px' },
    medium: { padding: '12px 20px', fontSize: '15px', gap: '8px' },
    large: { padding: '16px 24px', fontSize: '16px', gap: '10px' }
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
        background: 'linear-gradient(135deg, #5b5ff0, #8653f5)'
      }
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.8)',
      color: '#6366f1',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      hover: {
        transform: 'translateY(-1px)',
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }
    },
    outline: {
      background: 'transparent',
      color: '#6366f1',
      border: '2px solid rgba(99, 102, 241, 0.3)',
      boxShadow: 'none',
      hover: {
        background: 'rgba(99, 102, 241, 0.05)',
        border: '2px solid rgba(99, 102, 241, 0.5)'
      }
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
      boxShadow: 'none',
      hover: {
        background: 'rgba(0, 0, 0, 0.05)',
        color: '#374151'
      }
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)'
      }
    }
  };

  const currentSize = sizeMap[size];
  const currentVariant = variantStyles[variant];

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentSize.gap,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: '500',
    fontFamily: "'Oxanium', system-ui, sans-serif",
    borderRadius: '12px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    textDecoration: 'none',
    userSelect: 'none',
    opacity: disabled || loading ? 0.6 : 1,
    ...currentVariant,
    ...style
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && currentVariant.hover) {
      Object.assign(e.currentTarget.style, currentVariant.hover);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, baseStyle);
    }
  };

  const LoadingSpinner = () => (
    <div style={{
      width: '16px',
      height: '16px',
      border: '2px solid currentColor',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );

  return (
    <button
      type={type}
      className={className}
      style={baseStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
    >
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      {!loading && children}
      {!loading && icon && iconPosition === 'right' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
    </button>
  );
};

export default ConsistentButton;
