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
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}) saturate(180%)`,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 16px 64px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(99, 102, 241, 0.05)',
    minHeight: 'calc(100vh - 120px)',
    fontFamily: "'Poppins', system-ui, sans-serif",
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
