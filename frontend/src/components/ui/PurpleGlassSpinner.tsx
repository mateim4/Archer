import React from 'react';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullPage?: boolean;
}

export const PurpleGlassSpinner: React.FC<PurpleGlassSpinnerProps> = ({
  size = 'medium',
  message,
  fullPage = false
}) => {
  const dimensions = {
    small: '24px',
    medium: '40px',
    large: '64px'
  };

  const spinnerSize = dimensions[size];

  const spinner = (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTop: `3px solid ${DesignTokens.colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: message ? '0 auto 12px' : '0 auto'
        }}
        role="status"
        aria-label={message || 'Loading'}
      />
      {message && (
        <div style={{
          fontSize: DesignTokens.typography.sm,
          color: DesignTokens.colors.textSecondary,
          fontFamily: DesignTokens.typography.fontFamily
        }}>
          {message}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 9998
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};
