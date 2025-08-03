import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
  type?: 'error' | 'warning' | 'info';
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onClose,
  type = 'error'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: 'var(--color-semantic-warning-background)',
          borderColor: 'rgba(247, 99, 12, 0.3)',
          iconColor: 'var(--color-semantic-warning)'
        };
      case 'info':
        return {
          backgroundColor: 'var(--color-semantic-info-background)',
          borderColor: 'rgba(15, 108, 189, 0.3)',
          iconColor: 'var(--color-semantic-info)'
        };
      default:
        return {
          backgroundColor: 'var(--color-semantic-danger-background)',
          borderColor: 'rgba(197, 14, 32, 0.3)',
          iconColor: 'var(--color-semantic-danger)'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full mx-4"
      style={{
        fontFamily: 'var(--font-family)'
      }}
    >
      <div 
        className="flex items-center p-4 rounded-lg border shadow-lg"
        style={{
          backgroundColor: typeStyles.backgroundColor,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          borderColor: typeStyles.borderColor,
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div 
          className="mr-3 p-2 rounded-md"
          style={{ 
            borderRadius: 'var(--border-radius-md)',
            background: `${typeStyles.iconColor}20`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${typeStyles.iconColor}30`
          }}
        >
          <AlertTriangle 
            size={20} 
            color={typeStyles.iconColor}
          />
        </div>
        
        <div className="flex-1">
          <div 
            className="font-medium"
            style={{ 
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-neutral-foreground)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information'}
          </div>
          <div 
            style={{ 
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-neutral-foreground-secondary)'
            }}
          >
            {message}
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="ml-3 p-1 rounded-md transition-all duration-200 hover:bg-black/10"
          style={{
            borderRadius: 'var(--border-radius-md)'
          }}
        >
          <X size={16} color="var(--color-neutral-foreground-secondary)" />
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
