import React from 'react';

interface GlassmorphicLayoutProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: string;
  margin?: string;
  blur?: string;
  opacity?: string;
  borderRadius?: string;
  role?: string;
  'aria-label'?: string;
}

const GlassmorphicLayout: React.FC<GlassmorphicLayoutProps> = ({
  children,
  className,
  style,
  padding = '32px',
  margin = '24px',
  blur = '24px',
  opacity = '0.12',
  borderRadius = '24px',
  ...props
}) => {
  const defaultStyle: React.CSSProperties = {
    padding,
    margin,
    borderRadius,
    background: 'var(--glass-bg)',
    backdropFilter: `blur(${blur}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}) saturate(180%)`,
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)',
    minHeight: 'calc(100vh - 120px)',
    fontFamily: "'Oxanium', system-ui, sans-serif",
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
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
