import React from 'react';

interface GlassmorphicLayoutProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** @deprecated Use CSS token --page-container-padding instead */
  padding?: string;
  /** @deprecated Use CSS token --page-container-margin instead */
  margin?: string;
  /** @deprecated Use CSS token --page-container-backdrop instead */
  blur?: string;
  /** @deprecated No longer used - background uses CSS token */
  opacity?: string;
  /** @deprecated Use CSS token --page-container-border-radius instead */
  borderRadius?: string;
  role?: string;
  'aria-label'?: string;
}

/**
 * GlassmorphicLayout - Main page container with consistent glassmorphic styling
 * 
 * Uses CSS custom properties for theming:
 * - --page-container-bg: Background gradient
 * - --page-container-backdrop: Backdrop filter
 * - --page-container-border: Border style
 * - --page-container-border-radius: Border radius
 * - --page-container-padding: Inner padding
 * - --page-container-margin: Outer margin
 * - --page-container-min-height: Minimum height
 * - --page-container-shadow: Box shadow
 * 
 * These tokens are defined in index.css for both light and dark modes.
 */
const GlassmorphicLayout: React.FC<GlassmorphicLayoutProps> = ({
  children,
  className,
  style,
  // Legacy props (deprecated but still supported for backwards compatibility)
  padding,
  margin,
  blur,
  borderRadius,
  ...props
}) => {
  const defaultStyle: React.CSSProperties = {
    // Use CSS tokens for consistent styling across all pages
    background: 'var(--page-container-bg)',
    backdropFilter: 'var(--page-container-backdrop)',
    WebkitBackdropFilter: 'var(--page-container-backdrop)',
    border: 'var(--page-container-border)',
    borderRadius: borderRadius || 'var(--page-container-border-radius)',
    padding: padding || 'var(--page-container-padding)',
    margin: margin || 'var(--page-container-margin)',
    minHeight: 'var(--page-container-min-height)',
    boxShadow: 'var(--page-container-shadow)',
    fontFamily: "'Oxanium', system-ui, sans-serif",
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...style
  };

  return (
    <div 
      className={className}
      style={defaultStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassmorphicLayout;
