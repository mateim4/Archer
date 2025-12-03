/**
 * SLAIndicator Component
 * 
 * Visual timer showing SLA status with traffic light colors.
 * Displays time remaining, warning states, and breach alerts.
 * 
 * Part of Phase 2: Integration Layer (Service Desk Enhancements)
 */

import React from 'react';
import {
  ClockRegular,
  WarningRegular,
  ErrorCircleRegular,
  CheckmarkCircleRegular
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';
import './styles/sla-indicator.css';

export type SLAStatus = 'on_track' | 'at_risk' | 'breached' | 'paused' | 'resolved';

export interface SLAIndicatorProps {
  /** Current SLA status */
  status: SLAStatus;
  /** Time remaining or elapsed (e.g., "2h 15m" or "15m overdue") */
  timeDisplay?: string;
  /** Response SLA or Resolution SLA */
  slaType?: 'response' | 'resolution';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the full label */
  showLabel?: boolean;
  /** Whether to pulse on breach */
  pulseOnBreach?: boolean;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

const getStatusColor = (status: SLAStatus): string => {
  switch (status) {
    case 'on_track': return '#10b981'; // green
    case 'at_risk': return '#f59e0b'; // amber
    case 'breached': return '#ef4444'; // red
    case 'paused': return '#6b7280'; // gray
    case 'resolved': return '#10b981'; // green
    default: return tokens.colorNeutralForeground3;
  }
};

const getStatusBackground = (status: SLAStatus): string => {
  switch (status) {
    case 'on_track': return 'rgba(16, 185, 129, 0.1)';
    case 'at_risk': return 'rgba(245, 158, 11, 0.1)';
    case 'breached': return 'rgba(239, 68, 68, 0.15)';
    case 'paused': return 'rgba(107, 114, 128, 0.1)';
    case 'resolved': return 'rgba(16, 185, 129, 0.1)';
    default: return 'rgba(0, 0, 0, 0.05)';
  }
};

const getStatusIcon = (status: SLAStatus) => {
  switch (status) {
    case 'on_track': return <CheckmarkCircleRegular />;
    case 'at_risk': return <WarningRegular />;
    case 'breached': return <ErrorCircleRegular />;
    case 'paused': return <ClockRegular />;
    case 'resolved': return <CheckmarkCircleRegular />;
    default: return <ClockRegular />;
  }
};

const getStatusLabel = (status: SLAStatus): string => {
  switch (status) {
    case 'on_track': return 'On Track';
    case 'at_risk': return 'At Risk';
    case 'breached': return 'Breached';
    case 'paused': return 'Paused';
    case 'resolved': return 'Resolved';
    default: return 'Unknown';
  }
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        padding: '2px 6px',
        fontSize: '10px',
        iconSize: '12px',
        gap: '3px',
        borderRadius: '4px',
      };
    case 'large':
      return {
        padding: '8px 14px',
        fontSize: '14px',
        iconSize: '18px',
        gap: '8px',
        borderRadius: '8px',
      };
    case 'medium':
    default:
      return {
        padding: '4px 8px',
        fontSize: '11px',
        iconSize: '14px',
        gap: '5px',
        borderRadius: '6px',
      };
  }
};

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({
  status,
  timeDisplay,
  slaType,
  size = 'medium',
  showLabel = true,
  pulseOnBreach = true,
  className,
  style,
}) => {
  const sizeStyles = getSizeStyles(size);
  const color = getStatusColor(status);
  const background = getStatusBackground(status);

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyles.gap,
    padding: sizeStyles.padding,
    borderRadius: sizeStyles.borderRadius,
    fontSize: sizeStyles.fontSize,
    fontWeight: 600,
    background,
    border: `1px solid ${color}30`,
    color,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  };

  // Add pulse class for breached status
  const pulseClass = pulseOnBreach && status === 'breached' ? 'sla-indicator-pulse' : '';

  return (
    <span
      className={`${pulseClass} ${className || ''}`}
      style={{
        ...baseStyles,
        ...style,
      }}
      title={`${slaType === 'response' ? 'Response' : 'Resolution'} SLA: ${getStatusLabel(status)}${timeDisplay ? ` - ${timeDisplay}` : ''}`}
    >
        {/* Status Icon */}
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: sizeStyles.iconSize,
          flexShrink: 0,
        }}>
          {getStatusIcon(status)}
        </span>

        {/* Label and Time */}
        <span style={{ display: 'flex', alignItems: 'center', gap: sizeStyles.gap }}>
          {showLabel && (
            <span>{getStatusLabel(status)}</span>
          )}
          {timeDisplay && (
            <span style={{ 
              opacity: 0.9,
              fontWeight: 500,
              fontFamily: 'monospace',
            }}>
              {timeDisplay}
            </span>
          )}
        </span>
      </span>
  );
};

export default SLAIndicator;
