/**
 * PageHeader Component
 * 
 * Standardized page header component for consistent styling across all views.
 * Follows Dashboard design pattern: Icon + Title + Subtitle in a card.
 * 
 * @module components/ui/PageHeader
 */

import React from 'react';
import { PurpleGlassCard } from './PurpleGlassCard';

export interface PageHeaderProps {
  /** Main title text */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Icon component to display before title */
  icon?: React.ReactNode;
  /** Optional badge next to title (e.g., "ITIL v4 Aligned") */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Right-side actions (buttons, controls) */
  actions?: React.ReactNode;
  /** Whether to wrap in a card (default: true for Dashboard style) */
  withCard?: boolean;
  /** Children rendered below header (e.g., stats, tabs) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Data test ID */
  testId?: string;
}

const badgeColors = {
  primary: {
    bg: 'var(--brand-primary)',
    border: 'var(--brand-primary)',
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
  },
};

/**
 * PageHeader - Standardized page header with icon, title, subtitle, and optional actions.
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   icon={<DashboardRegular style={{ fontSize: '32px' }} />}
 *   title="Dashboard"
 *   subtitle="Welcome back! Here's your ITSM overview."
 *   badge="ITIL v4"
 *   actions={<PurpleGlassButton>New Ticket</PurpleGlassButton>}
 * >
 *   <StatCards />
 * </PageHeader>
 * ```
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'primary',
  actions,
  withCard = true,
  children,
  className = '',
  testId,
}) => {
  const headerContent = (
    <>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: children ? '24px' : 0,
        paddingBottom: children ? '20px' : 0,
        borderBottom: children ? '1px solid var(--divider-color-subtle)' : 'none',
      }}>
        {/* Left: Icon + Title + Subtitle */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: subtitle ? '8px' : 0,
          }}>
            <h1 style={{
              margin: 0,
              fontSize: 'var(--lcm-font-size-xxxl, 32px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              {icon && (
                <span style={{ 
                  fontSize: '32px', 
                  color: 'var(--icon-default)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {icon}
                </span>
              )}
              {title}
            </h1>
            
            {badge && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                background: `${badgeColors[badgeVariant].bg}20`,
                color: 'var(--brand-primary)',
                fontSize: 'var(--lcm-font-size-xs, 12px)',
                fontWeight: 500,
                border: `1px solid ${badgeColors[badgeVariant].border}`,
                whiteSpace: 'nowrap',
              }}>
                {badge}
              </span>
            )}
          </div>
          
          {subtitle && (
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        {actions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            {actions}
          </div>
        )}
      </div>

      {/* Children (stats, tabs, etc.) */}
      {children}
    </>
  );

  if (withCard) {
    return (
      <PurpleGlassCard
        glass
        padding="large"
        className={className}
        style={{ marginBottom: '24px' }}
        data-testid={testId}
      >
        {headerContent}
      </PurpleGlassCard>
    );
  }

  return (
    <div 
      className={className}
      style={{
        marginBottom: '24px',
        paddingBottom: children ? '24px' : '20px',
        borderBottom: '2px solid var(--brand-primary-transparent, rgba(139, 92, 246, 0.2))',
      }}
      data-testid={testId}
    >
      {headerContent}
    </div>
  );
};

export default PageHeader;
