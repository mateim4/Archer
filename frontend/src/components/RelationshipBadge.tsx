/**
 * RelationshipBadge Component
 * 
 * Displays a visual badge for ticket relationships with color coding.
 * Used in ticket lists and detail views to show relationship types.
 */

import React from 'react';
import type { TicketRelationType } from '../utils/apiClient';
import {
  ArrowUpRegular,
  ArrowDownRegular,
  LinkRegular,
  DismissCircleRegular,
  WarningRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';

interface RelationshipBadgeProps {
  type: TicketRelationType;
  count?: number;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  onClick?: () => void;
}

const getRelationshipConfig = (type: TicketRelationType) => {
  switch (type) {
    case 'PARENT_OF':
      return {
        label: 'Parent',
        color: '#3b82f6', // Blue
        icon: ArrowUpRegular,
        description: 'Has child tickets',
      };
    case 'CHILD_OF':
      return {
        label: 'Child',
        color: '#8b5cf6', // Purple
        icon: ArrowDownRegular,
        description: 'Child of another ticket',
      };
    case 'DUPLICATE_OF':
      return {
        label: 'Duplicate',
        color: '#6b7280', // Gray
        icon: DismissCircleRegular,
        description: 'Marked as duplicate',
      };
    case 'RELATED_TO':
      return {
        label: 'Related',
        color: '#10b981', // Green
        icon: LinkRegular,
        description: 'Related ticket',
      };
    case 'BLOCKED_BY':
      return {
        label: 'Blocked',
        color: '#ef4444', // Red
        icon: ErrorCircleRegular,
        description: 'Blocked by another ticket',
      };
    case 'BLOCKS':
      return {
        label: 'Blocks',
        color: '#f59e0b', // Orange
        icon: WarningRegular,
        description: 'Blocking another ticket',
      };
    case 'CAUSED_BY':
      return {
        label: 'Caused By',
        color: '#ec4899', // Pink
        icon: LinkRegular,
        description: 'Caused by another ticket',
      };
    default:
      return {
        label: 'Related',
        color: '#6b7280',
        icon: LinkRegular,
        description: 'Related ticket',
      };
  }
};

export const RelationshipBadge: React.FC<RelationshipBadgeProps> = ({
  type,
  count,
  size = 'medium',
  showIcon = true,
  onClick,
}) => {
  const config = getRelationshipConfig(type);
  const Icon = config.icon;

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'small' ? '4px' : '6px',
    padding: size === 'small' ? '2px 8px' : '4px 10px',
    background: `${config.color}15`,
    border: `1px solid ${config.color}40`,
    borderRadius: '6px',
    fontSize: size === 'small' ? '11px' : '12px',
    fontWeight: 600,
    color: config.color,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 150ms ease',
  };

  const hoverStyle: React.CSSProperties = onClick ? {
    transform: 'translateY(-1px)',
    boxShadow: `0 2px 8px ${config.color}40`,
  } : {};

  return (
    <span
      style={badgeStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      title={config.description}
    >
      {showIcon && <Icon style={{ fontSize: size === 'small' ? '12px' : '14px' }} />}
      <span>{config.label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          padding: '0 4px',
          background: config.color,
          color: 'white',
          borderRadius: '4px',
          fontSize: size === 'small' ? '10px' : '11px',
          fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </span>
  );
};

export default RelationshipBadge;
