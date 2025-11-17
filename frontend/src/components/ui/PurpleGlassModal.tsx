import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DismissRegular } from '@fluentui/react-icons';
import { PurpleGlassButton } from './PurpleGlassButton';

export interface PurpleGlassModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (usually buttons) */
  footer?: React.ReactNode;
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'fullscreen';
  /** Glass intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Custom width (overrides size) */
  width?: string;
  /** Custom max-width */
  maxWidth?: string;
  /** Additional CSS class */
  className?: string;
  /** Additional styles for modal content */
  style?: React.CSSProperties;
  /** Whether to prevent body scroll when open */
  preventScroll?: boolean;
}

const SIZE_WIDTHS = {
  small: '400px',
  medium: '600px',
  large: '800px',
  xlarge: '1200px',
  fullscreen: '100vw'
};

const GLASS_STYLES = {
  none: {},
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(147, 51, 234, 0.1)'
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(147, 51, 234, 0.15)'
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(147, 51, 234, 0.2)'
  }
};

export const PurpleGlassModal: React.FC<PurpleGlassModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  glass = 'medium',
  closeOnBackdropClick = true,
  showCloseButton = true,
  width,
  maxWidth,
  className = '',
  style = {},
  preventScroll = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle focus trap and body scroll
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus modal
      if (modalRef.current) {
        const focusableElement = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusableElement?.focus();
      }

      // Prevent body scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Restore focus
      previousFocusRef.current?.focus();

      // Restore body scroll
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, preventScroll]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalWidth = width || SIZE_WIDTHS[size];
  const glassStyle = GLASS_STYLES[glass];
  const isFullscreen = size === 'fullscreen';

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: isFullscreen ? 'stretch' : 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        animation: 'modalFadeIn 0.2s ease-out'
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={className}
        style={{
          width: isFullscreen ? '100%' : modalWidth,
          maxWidth: maxWidth || (isFullscreen ? '100%' : '95vw'),
          height: isFullscreen ? '100vh' : 'auto',
          maxHeight: isFullscreen ? '100vh' : '90vh',
          borderRadius: isFullscreen ? 0 : '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'modalSlideIn 0.3s ease-out',
          fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
          ...glassStyle,
          ...style
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid rgba(147, 51, 234, 0.1)',
              flexShrink: 0
            }}
          >
            {title && (
              <h2
                id="modal-title"
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#7c3aed',
                  fontFamily: 'inherit'
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <PurpleGlassButton
                variant="ghost"
                size="small"
                icon={<DismissRegular />}
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  marginLeft: 'auto'
                }}
              />
            )}
          </div>
        )}

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid rgba(147, 51, 234, 0.1)',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PurpleGlassModal;
