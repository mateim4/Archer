import React, { useEffect, useState } from 'react';
import { DismissRegular, CheckmarkCircleRegular, ErrorCircleRegular, WarningRegular, InfoRegular } from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassToastProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  onDismiss: () => void;
}

export const PurpleGlassToast: React.FC<PurpleGlassToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onDismiss
}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (duration > 0 && !isHovered) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, isHovered, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckmarkCircleRegular />;
      case 'error': return <ErrorCircleRegular />;
      case 'warning': return <WarningRegular />;
      case 'info': return <InfoRegular />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: DesignTokens.colors.success,
        icon: DesignTokens.colors.success
      };
      case 'error': return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: DesignTokens.colors.error,
        icon: DesignTokens.colors.error
      };
      case 'warning': return {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: DesignTokens.colors.warning,
        icon: DesignTokens.colors.warning
      };
      case 'info': return {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: DesignTokens.colors.primary,
        icon: DesignTokens.colors.primary
      };
    }
  };

  const colors = getColors();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: '320px',
        maxWidth: '400px',
        padding: DesignTokens.spacing.lg,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.90))',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${colors.border}`,
        borderRadius: DesignTokens.borderRadius.lg,
        boxShadow: DesignTokens.shadows.xl,
        display: 'flex',
        alignItems: 'flex-start',
        gap: DesignTokens.spacing.md,
        fontFamily: DesignTokens.typography.fontFamily,
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div style={{ fontSize: '20px', color: colors.icon, marginTop: '2px' }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: DesignTokens.typography.base,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: message ? '4px' : 0
        }}>
          {title}
        </div>
        {message && (
          <div style={{
            fontSize: DesignTokens.typography.sm,
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            {message}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: DesignTokens.colors.textMuted,
          fontSize: '16px',
          lineHeight: 1
        }}
      >
        <DismissRegular />
      </button>
    </div>
  );
};

// Toast Container Component
export interface ToastItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  duration?: number;
}

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss
}) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: DesignTokens.spacing.xl,
      right: DesignTokens.spacing.xl,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: DesignTokens.spacing.md
    }}>
      {toasts.map(toast => (
        <PurpleGlassToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
};
