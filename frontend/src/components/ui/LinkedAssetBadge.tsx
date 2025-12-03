/**
 * LinkedAssetBadge Component
 * 
 * Displays linked CMDB asset information on tickets and other contexts.
 * Shows asset name, type, and health status with click-through navigation.
 * 
 * Part of Phase 2: Integration Layer (Asset-Ticket Linking)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ServerRegular,
  DesktopRegular,
  CubeRegular,
  RouterRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ErrorCircleRegular
} from '@fluentui/react-icons';
import { tokens } from '@fluentui/react-components';

export type AssetStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type AssetType = 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH' | 'NETWORK';

export interface LinkedAssetBadgeProps {
  /** Asset ID for navigation */
  assetId: string;
  /** Display name of the asset */
  assetName: string;
  /** Type of asset */
  assetType?: AssetType;
  /** Current health status */
  status?: AssetStatus;
  /** Whether to show the chevron icon */
  showChevron?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional click handler (overrides navigation) */
  onClick?: () => void;
  /** Whether the badge is interactive */
  interactive?: boolean;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

const getAssetIcon = (type?: AssetType) => {
  switch (type) {
    case 'CLUSTER': return <CubeRegular />;
    case 'HOST': return <ServerRegular />;
    case 'VM': return <DesktopRegular />;
    case 'SWITCH': 
    case 'NETWORK': return <RouterRegular />;
    default: return <ServerRegular />;
  }
};

const getStatusIcon = (status?: AssetStatus) => {
  switch (status) {
    case 'healthy': return <CheckmarkCircleRegular />;
    case 'warning': return <WarningRegular />;
    case 'critical': return <ErrorCircleRegular />;
    default: return null;
  }
};

const getStatusColor = (status?: AssetStatus): string => {
  switch (status) {
    case 'healthy': return '#10b981'; // green
    case 'warning': return '#f59e0b'; // amber
    case 'critical': return '#ef4444'; // red
    default: return tokens.colorNeutralForeground3;
  }
};

const getStatusBackground = (status?: AssetStatus): string => {
  switch (status) {
    case 'healthy': return 'rgba(16, 185, 129, 0.1)';
    case 'warning': return 'rgba(245, 158, 11, 0.1)';
    case 'critical': return 'rgba(239, 68, 68, 0.1)';
    default: return 'rgba(0, 0, 0, 0.05)';
  }
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        padding: '2px 6px',
        fontSize: '11px',
        iconSize: '12px',
        gap: '4px',
        borderRadius: '4px',
      };
    case 'large':
      return {
        padding: '8px 12px',
        fontSize: '14px',
        iconSize: '18px',
        gap: '8px',
        borderRadius: '8px',
      };
    case 'medium':
    default:
      return {
        padding: '4px 8px',
        fontSize: '12px',
        iconSize: '14px',
        gap: '6px',
        borderRadius: '6px',
      };
  }
};

export const LinkedAssetBadge: React.FC<LinkedAssetBadgeProps> = ({
  assetId,
  assetName,
  assetType,
  status,
  showChevron = true,
  size = 'medium',
  onClick,
  interactive = true,
  className,
  style,
}) => {
  const navigate = useNavigate();
  const sizeStyles = getSizeStyles(size);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (interactive) {
      navigate(`/app/inventory?asset=${assetId}`);
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyles.gap,
    padding: sizeStyles.padding,
    borderRadius: sizeStyles.borderRadius,
    fontSize: sizeStyles.fontSize,
    fontWeight: 500,
    background: getStatusBackground(status),
    border: `1px solid ${status === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
    color: status === 'critical' ? '#ef4444' : tokens.colorNeutralForeground2,
    cursor: interactive ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    maxWidth: '100%',
  };

  const hoverStyles: React.CSSProperties = interactive ? {
    ...baseStyles,
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    background: status === 'critical' 
      ? 'rgba(239, 68, 68, 0.15)' 
      : 'rgba(139, 92, 246, 0.1)',
    borderColor: status === 'critical'
      ? 'rgba(239, 68, 68, 0.3)'
      : 'rgba(139, 92, 246, 0.2)',
  } : baseStyles;

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <span
      className={className}
      style={{
        ...(isHovered ? hoverStyles : baseStyles),
        ...style,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${assetType || 'Asset'}: ${assetName}${status ? ` (${status})` : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Asset Type Icon */}
      <span style={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: sizeStyles.iconSize,
        color: getStatusColor(status),
        flexShrink: 0,
      }}>
        {getAssetIcon(assetType)}
      </span>

      {/* Asset Name */}
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {assetName}
      </span>

      {/* Status Icon (optional) */}
      {status && status !== 'unknown' && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: sizeStyles.iconSize,
          color: getStatusColor(status),
          flexShrink: 0,
        }}>
          {getStatusIcon(status)}
        </span>
      )}

      {/* Chevron (optional) */}
      {showChevron && interactive && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          fontSize: sizeStyles.iconSize,
          opacity: 0.5,
          flexShrink: 0,
        }}>
          <ChevronRightRegular />
        </span>
      )}
    </span>
  );
};

export default LinkedAssetBadge;
