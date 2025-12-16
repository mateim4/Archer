import React from 'react';

interface EnhancedPurpleGlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
}

const EnhancedPurpleGlassButton: React.FC<EnhancedPurpleGlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    border: 'none',
    fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { padding: '6px 12px', fontSize: '0.75rem' },
    medium: { padding: '8px 16px', fontSize: '0.875rem' },
    large: { padding: '12px 24px', fontSize: '1rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      color: '#ffffff',
    },
    secondary: {
      background: 'rgba(139, 92, 246, 0.15)',
      color: '#a78bfa',
      border: '1px solid rgba(139, 92, 246, 0.3)',
    },
    ghost: {
      background: 'transparent',
      color: '#a78bfa',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </button>
  );
};

export default EnhancedPurpleGlassButton;
