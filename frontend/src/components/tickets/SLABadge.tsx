// Archer ITSM - SLA Badge Component
// Display SLA status with visual indicators

import React from 'react';
import { Badge, makeStyles, tokens, shorthands, Tooltip } from '@fluentui/react-components';
import {
  ClockRegular,
  WarningRegular,
  ErrorCircleRegular,
  PauseRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';

export type SLAStatus = 'on_track' | 'at_risk' | 'breached' | 'paused' | 'met';

export interface SLABadgeProps {
  status: SLAStatus;
  dueDate?: string; // ISO timestamp
  type?: 'response' | 'resolution';
  showCountdown?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const useStyles = makeStyles({
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  countdown: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginLeft: tokens.spacingHorizontalXS,
  },
  countdownWarning: {
    color: tokens.colorPaletteYellowForeground1,
  },
  countdownDanger: {
    color: tokens.colorPaletteRedForeground1,
  },
});

const statusConfig: Record<SLAStatus, { 
  label: string; 
  color: 'success' | 'danger' | 'warning' | 'informative';
  icon: React.ReactElement;
}> = {
  on_track: {
    label: 'On Track',
    color: 'success',
    icon: <ClockRegular />,
  },
  at_risk: {
    label: 'At Risk',
    color: 'warning',
    icon: <WarningRegular />,
  },
  breached: {
    label: 'Breached',
    color: 'danger',
    icon: <ErrorCircleRegular />,
  },
  paused: {
    label: 'Paused',
    color: 'informative',
    icon: <PauseRegular />,
  },
  met: {
    label: 'Met',
    color: 'success',
    icon: <CheckmarkCircleRegular />,
  },
};

/**
 * Format time remaining in human-readable format
 */
function getTimeRemaining(dueDate: string): { text: string; isOverdue: boolean } {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);
  
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (isOverdue) {
    if (hours > 0) {
      return { text: `${hours}h ${minutes}m overdue`, isOverdue: true };
    }
    return { text: `${minutes}m overdue`, isOverdue: true };
  }
  
  if (hours > 0) {
    return { text: `${hours}h ${minutes}m left`, isOverdue: false };
  }
  return { text: `${minutes}m left`, isOverdue: false };
}

/**
 * SLA Badge - Display ticket SLA status with visual indicators
 * 
 * @example
 * ```tsx
 * <SLABadge status="on_track" dueDate={ticket.response_due} type="response" />
 * <SLABadge status="breached" type="resolution" />
 * ```
 */
export function SLABadge({
  status,
  dueDate,
  type = 'resolution',
  showCountdown = true,
  size = 'medium',
}: SLABadgeProps) {
  const styles = useStyles();
  const config = statusConfig[status];
  const timeRemaining = dueDate && showCountdown ? getTimeRemaining(dueDate) : null;

  const badge = (
    <div className={styles.container}>
      <Badge
        appearance="filled"
        color={config.color}
        size={size}
        icon={config.icon}
      >
        {config.label}
      </Badge>
      {timeRemaining && (
        <span 
          className={`${styles.countdown} ${
            timeRemaining.isOverdue 
              ? styles.countdownDanger 
              : status === 'at_risk' 
                ? styles.countdownWarning 
                : ''
          }`}
        >
          {timeRemaining.text}
        </span>
      )}
    </div>
  );

  // Wrap with tooltip if we have a due date
  if (dueDate) {
    const formattedDate = new Date(dueDate).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    
    return (
      <Tooltip
        content={`${type === 'response' ? 'Response' : 'Resolution'} SLA: ${formattedDate}`}
        relationship="label"
      >
        {badge}
      </Tooltip>
    );
  }

  return badge;
}

export default SLABadge;
