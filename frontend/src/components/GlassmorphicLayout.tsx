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
  blur = '20px',
  opacity = '0.82',
  borderRadius = '24px',
  ...props
}) => {
  const defaultStyle: React.CSSProperties = {
    padding,
    margin,
    borderRadius,
    background: 'var(--lcm-bg-card, rgba(255, 255, 255, 0.82))',
    backdropFilter: 'var(--lcm-backdrop-filter, blur(20px) saturate(150%))',
    WebkitBackdropFilter: 'var(--lcm-backdrop-filter, blur(20px) saturate(150%))',
    border: '1px solid var(--lcm-primary-border, rgba(139, 92, 246, 0.18))',
    boxShadow: 'var(--lcm-shadow-card, 0 2px 8px 0 rgba(0, 0, 0, 0.04), 0 4px 16px 0 rgba(139, 92, 246, 0.06))',
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
