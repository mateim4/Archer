/**
 * AI Action Buttons Component
 * 
 * Contextual action suggestions for the Monitoring view.
 * These buttons suggest further investigation paths when analyzing alerts.
 */

import React from 'react';
import { 
  ClockRegular, 
  LinkRegular, 
  DataHistogramRegular,
  ServerRegular,
  ArrowExpandRegular,
} from '@fluentui/react-icons';
import { Button } from '@fluentui/react-components';
import { AIBadge } from './AIBadge';

interface AIActionButtonsProps {
  /** Alert ID for context */
  alertId: string;
  /** Alert timestamp for time-based actions */
  timestamp?: Date;
  /** Handler for "investigate before" action */
  onInvestigateBefore?: (alertId: string, minutesBefore: number) => void;
  /** Handler for "show correlated" action */
  onShowCorrelated?: (alertId: string) => void;
  /** Handler for "compare baseline" action */
  onCompareBaseline?: (alertId: string, days: number) => void;
  /** Handler for "check dependencies" action */
  onCheckDependencies?: (alertId: string) => void;
  /** Whether actions are currently loading */
  isLoading?: boolean;
  /** Orientation of button group */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * AI Action Buttons - suggests investigation actions for alerts
 * 
 * @example
 * <AIActionButtons
 *   alertId={alert.id}
 *   timestamp={alert.timestamp}
 *   onInvestigateBefore={(id, mins) => handleInvestigate(id, mins)}
 *   onShowCorrelated={(id) => handleCorrelate(id)}
 * />
 */
export const AIActionButtons: React.FC<AIActionButtonsProps> = ({
  alertId,
  timestamp,
  onInvestigateBefore,
  onShowCorrelated,
  onCompareBaseline,
  onCheckDependencies,
  isLoading = false,
  orientation = 'horizontal',
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
  };

  const buttonStyle: React.CSSProperties = {
    minWidth: orientation === 'horizontal' ? 'auto' : '100%',
  };

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Header with AI badge */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '8px' 
      }}>
        <AIBadge label="Suggested Actions" size="small" />
      </div>

      {/* Action buttons */}
      <div style={containerStyle}>
        {onInvestigateBefore && (
          <Button
            appearance="subtle"
            icon={<ClockRegular />}
            onClick={() => onInvestigateBefore(alertId, 15)}
            disabled={isLoading}
            style={buttonStyle}
            size="small"
          >
            Investigate 15 min before
          </Button>
        )}

        {onShowCorrelated && (
          <Button
            appearance="subtle"
            icon={<LinkRegular />}
            onClick={() => onShowCorrelated(alertId)}
            disabled={isLoading}
            style={buttonStyle}
            size="small"
          >
            Show correlated alerts
          </Button>
        )}

        {onCompareBaseline && (
          <Button
            appearance="subtle"
            icon={<DataHistogramRegular />}
            onClick={() => onCompareBaseline(alertId, 7)}
            disabled={isLoading}
            style={buttonStyle}
            size="small"
          >
            Compare with last week
          </Button>
        )}

        {onCheckDependencies && (
          <Button
            appearance="subtle"
            icon={<ServerRegular />}
            onClick={() => onCheckDependencies(alertId)}
            disabled={isLoading}
            style={buttonStyle}
            size="small"
          >
            Check dependent services
          </Button>
        )}

        {/* Expand for more options */}
        <Button
          appearance="subtle"
          icon={<ArrowExpandRegular />}
          disabled={isLoading}
          style={buttonStyle}
          size="small"
        >
          More actions...
        </Button>
      </div>
    </div>
  );
};

export default AIActionButtons;
