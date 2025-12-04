/**
 * PurpleGlassDrawer Component
 * 
 * Sliding drawer panel for detail views and forms.
 * Right-slide animation with focus trapping and glass effect styling.
 * 
 * Part of Phase 2: Core Components - Drawer Component
 * Spec Reference: UI UX Specification Sheet - Section 5.6 Modals & Overlays
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  DismissRegular,
  ChevronLeftRegular,
} from '@fluentui/react-icons';
import { useTheme } from '../../hooks/useTheme';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DrawerPosition = 'left' | 'right';

export interface PurpleGlassDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Drawer title */
  title?: string;
  /** Drawer subtitle */
  subtitle?: string;
  /** Drawer content */
  children: React.ReactNode;
  /** Size of the drawer */
  size?: DrawerSize;
  /** Position of the drawer */
  position?: DrawerPosition;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether to show a back button instead of close */
  showBackButton?: boolean;
  /** Custom header content (replaces title/subtitle) */
  headerContent?: React.ReactNode;
  /** Footer content (action buttons, etc.) */
  footerContent?: React.ReactNode;
  /** Whether clicking backdrop closes the drawer */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the drawer */
  closeOnEscape?: boolean;
  /** Additional className for the drawer panel */
  className?: string;
  /** Additional styles for the drawer panel */
  style?: React.CSSProperties;
  /** z-index for the drawer */
  zIndex?: number;
  /** Callback after drawer opens (for focus management) */
  onAfterOpen?: () => void;
  /** Callback after drawer closes */
  onAfterClose?: () => void;
}

/**
 * Get width based on size
 */
const getDrawerWidth = (size: DrawerSize): string => {
  switch (size) {
    case 'sm': return '320px';
    case 'md': return '480px';
    case 'lg': return '640px';
    case 'xl': return '800px';
    case 'full': return '100%';
    default: return '480px';
  }
};

/**
 * Focus trap utility
 */
const useFocusTrap = (isOpen: boolean, containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, containerRef]);
};

export const PurpleGlassDrawer: React.FC<PurpleGlassDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  position = 'right',
  showCloseButton = true,
  showBackButton = false,
  headerContent,
  footerContent,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  style,
  zIndex = 1000,
  onAfterOpen,
  onAfterClose,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  // Focus trap
  useFocusTrap(isOpen, drawerRef);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Trigger animation after mount
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      onAfterOpen?.();
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
        onAfterClose?.();
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAfterOpen, onAfterClose]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const drawerWidth = getDrawerWidth(size);
  const translateX = position === 'right' 
    ? (isAnimating ? 'translateX(0)' : 'translateX(100%)') 
    : (isAnimating ? 'translateX(0)' : 'translateX(-100%)');

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex,
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        className={className}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [position]: 0,
          width: drawerWidth,
          maxWidth: '100vw',
          background: isDark 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderLeft: position === 'right' 
            ? `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(139, 92, 246, 0.18)'}` 
            : 'none',
          borderRight: position === 'left' 
            ? `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(139, 92, 246, 0.18)'}` 
            : 'none',
          boxShadow: position === 'right'
            ? '-10px 0 40px rgba(0, 0, 0, 0.15)'
            : '10px 0 40px rgba(0, 0, 0, 0.15)',
          zIndex: zIndex + 1,
          display: 'flex',
          flexDirection: 'column',
          transform: translateX,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          ...style,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(139, 92, 246, 0.12)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          {/* Back/Close Button */}
          {(showBackButton || showCloseButton) && (
            <button
              onClick={onClose}
              aria-label={showBackButton ? 'Go back' : 'Close drawer'}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--btn-secondary-bg)',
                cursor: 'pointer',
                color: 'var(--btn-secondary-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--btn-secondary-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--btn-secondary-bg)';
              }}
            >
              {showBackButton ? (
                <ChevronLeftRegular style={{ fontSize: '20px' }} />
              ) : (
                <DismissRegular style={{ fontSize: '18px' }} />
              )}
            </button>
          )}

          {/* Title Area */}
          {headerContent ? (
            <div style={{ flex: 1 }}>{headerContent}</div>
          ) : (
            <div style={{ flex: 1 }}>
              {title && (
                <h2
                  id="drawer-title"
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
        }}>
          {children}
        </div>

        {/* Footer (if provided) */}
        {footerContent && (
          <div style={{
            padding: '16px 24px',
            borderTop: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(139, 92, 246, 0.12)'}`,
            background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(139, 92, 246, 0.02)',
            flexShrink: 0,
          }}>
            {footerContent}
          </div>
        )}
      </div>
    </>
  );

  // Portal to body for proper stacking
  return createPortal(drawerContent, document.body);
};

export default PurpleGlassDrawer;
