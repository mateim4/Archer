import React from 'react';
import { createPortal } from 'react-dom';
import { Text, Caption1, makeStyles } from '@fluentui/react-components';
import { DesignTokens } from '../../styles/designSystem';
import { TooltipData } from '../../types/capacityVisualizer';

interface CapacityTooltipProps {
  data: TooltipData | null;
}

const useStyles = makeStyles({
  tooltip: {
    position: 'fixed !important',
    zIndex: '9999 !important',
    maxWidth: '280px !important',
    padding: '12px !important',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)) !important',
    backdropFilter: 'blur(20px) saturate(180%) !important',
    WebkitBackdropFilter: 'blur(20px) saturate(180%) !important',
    border: `1px solid ${DesignTokens.colors.gray300} !important`,
    borderRadius: DesignTokens.borderRadius.lg + ' !important',
    boxShadow: DesignTokens.shadows.lg + ' !important',
    pointerEvents: 'none !important',
    fontFamily: DesignTokens.typography.fontFamily + ' !important',
    display: 'block !important',
    visibility: 'visible !important'
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: DesignTokens.colors.primary,
    marginBottom: '8px',
    borderBottom: `1px solid ${DesignTokens.colors.gray200}`,
    paddingBottom: '4px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '6px 12px',
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: '12px',
    color: DesignTokens.colors.textSecondary,
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '12px',
    color: DesignTokens.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right' as const
  }
});

export const CapacityTooltip: React.FC<CapacityTooltipProps> = ({ data }) => {
  const styles = useStyles();

  if (!data || !data.content) return null;

  // Debug logging
  console.log('Tooltip rendering with data:', {
    x: data.x,
    y: data.y,
    calculatedLeft: data.x + 10,
    calculatedTop: data.y - 10
  });

  const tooltipElement = (
    <div
      data-testid="capacity-tooltip"
      style={{
        position: 'fixed',
        zIndex: 9999,
        maxWidth: '280px',
        padding: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${DesignTokens.colors.gray300}`,
        borderRadius: DesignTokens.borderRadius.lg,
        boxShadow: DesignTokens.shadows.lg,
        pointerEvents: 'none',
        fontFamily: DesignTokens.typography.fontFamily,
        left: `${data.x + 10}px`,
        top: `${data.y - 10}px`
      }}
    >
      <div className={styles.title}>
        {data.content.title}
      </div>
      <div className={styles.metricsGrid}>
        {data.content.metrics.map((metric, index) => (
          <React.Fragment key={index}>
            <div className={styles.metricLabel}>
              {metric.label}:
            </div>
            <div 
              className={styles.metricValue}
              style={{ color: metric.color || DesignTokens.colors.textPrimary }}
            >
              {metric.value}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Render tooltip as a portal to document body to avoid CSS stacking context issues
  return createPortal(tooltipElement, document.body);
};

export default CapacityTooltip;