import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightRegular, HomeRegular } from '@fluentui/react-icons';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

export interface BreadcrumbNavigationProps {
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Glass intensity */
  glass?: 'none' | 'light' | 'medium';
}

const GLASS_STYLES = {
  none: {},
  light: {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--lcm-backdrop-filter, blur(20px))',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)'
  },
  medium: {
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--lcm-backdrop-filter, blur(20px))',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--glass-shadow)'
  }
};

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  className = '',
  style = {},
  glass = 'none'
}) => {
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();
  const glassStyle = GLASS_STYLES[glass];

  if (breadcrumbs.length <= 1) {
    // Don't show breadcrumbs if we're at the root
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{
        fontFamily: '"Poppins", "Montserrat", system-ui, -apple-system, sans-serif',
        ...glassStyle,
        ...style
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          flexWrap: 'wrap'
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = crumb.isCurrentPage;
          const isFirst = index === 0;

          return (
            <li
              key={crumb.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {!isFirst && (
                <ChevronRightRegular
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    flexShrink: 0
                  }}
                />
              )}

              {isLast ? (
                <span
                  aria-current="page"
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    fontFamily: 'inherit'
                  }}
                >
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 8px',
                    margin: '-4px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.color = 'var(--brand-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {isFirst && <HomeRegular style={{ fontSize: '16px' }} />}
                  <span>{crumb.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbNavigation;
