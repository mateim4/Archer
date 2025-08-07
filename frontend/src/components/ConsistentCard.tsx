import React from 'react';

interface ConsistentCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const ConsistentCard: React.FC<ConsistentCardProps> = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  className = '',
  padding = 'medium',
  hover = false,
  onClick,
  style = {}
}) => {
  const paddingMap = {
    none: '0',
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  const baseStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  const hoverStyle: React.CSSProperties = hover ? {
    transform: 'translateY(-2px)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.4)'
  } : {};

  return (
    <div
      className={className}
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          Object.assign(e.currentTarget.style, baseStyle);
        }
      }}
    >
      {(title || subtitle || icon || actions) && (
        <div style={{
          padding: `${paddingMap[padding]} ${paddingMap[padding]} 0 ${paddingMap[padding]}`,
          borderBottom: title || subtitle ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
          marginBottom: title || subtitle ? paddingMap[padding] : '0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {icon && (
                <div style={{
                  color: '#6366f1',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {icon}
                </div>
              )}
              <div style={{ flex: 1 }}>
                {title && (
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1a202c',
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    lineHeight: '1.4'
                  }}>
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p style={{
                    margin: title ? '4px 0 0 0' : 0,
                    fontSize: '14px',
                    color: '#6b7280',
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    lineHeight: '1.5'
                  }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{
        padding: (title || subtitle || icon || actions) ? `0 ${paddingMap[padding]} ${paddingMap[padding]} ${paddingMap[padding]}` : paddingMap[padding]
      }}>
        {children}
      </div>
    </div>
  );
};

export default ConsistentCard;
