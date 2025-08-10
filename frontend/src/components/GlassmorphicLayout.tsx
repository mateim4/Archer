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
  padding = '24px',
  margin = '20px',
  blur = '20px',
  opacity = '0.15',
  borderRadius = '20px',
  ...props
}) => {
  const defaultStyle: React.CSSProperties = {
    padding,
    margin,
    borderRadius,
    background: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}) saturate(180%)`,
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    minHeight: 'calc(100vh - 120px)',
    fontFamily: "'Poppins', system-ui, sans-serif",
    overflowY: 'auto', // Allow vertical scrolling
    overflowX: 'hidden', // Prevent horizontal scrolling
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
