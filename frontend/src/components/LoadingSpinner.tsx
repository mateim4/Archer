import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Processing...',
  overlay = true
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <RefreshCw 
        className={`${sizeClasses[size]} animate-spin text-orange-600 mb-3`}
      />
      {message && (
        <div 
          className="text-center"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-neutral-foreground-secondary)',
            fontFamily: 'var(--font-family)'
          }}
        >
          {message}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: 'transparent',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <div 
          className="p-8 rounded-xl border shadow-lg"
          style={{
            backgroundColor: 'var(--color-neutral-card-surface)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderColor: 'var(--color-neutral-stroke)',
            borderRadius: 'var(--border-radius-xl)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 16px 48px rgba(0, 0, 0, 0.15)'
          }}
        >
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
