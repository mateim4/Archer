/**
 * TicketHierarchyView Component
 * 
 * Visual tree representation of parent/child ticket hierarchies.
 * Shows expandable/collapsible tree with status indicators.
 */

import React, { useState, useCallback } from 'react';
import {
  ChevronRightRegular,
  ChevronDownRegular,
  ReceiptRegular,
} from '@fluentui/react-icons';
import { RelationshipBadge } from './RelationshipBadge';
import type { TicketHierarchyNode } from '../utils/apiClient';

interface TicketHierarchyViewProps {
  tree: TicketHierarchyNode;
  onTicketClick?: (ticketId: string) => void;
}

interface TreeNodeProps {
  node: TicketHierarchyNode;
  level: number;
  onTicketClick?: (ticketId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onTicketClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return '#ef4444';
      case 'P2': return '#f59e0b';
      case 'P3': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return '#3b82f6';
      case 'IN_PROGRESS': return '#8b5cf6';
      case 'WAITING': return '#f59e0b';
      case 'RESOLVED': return '#10b981';
      case 'CLOSED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const nodeStyle: React.CSSProperties = {
    marginLeft: `${level * 24}px`,
    marginBottom: '8px',
  };

  const cardStyle: React.CSSProperties = {
    padding: '12px 16px',
    background: 'var(--card-bg)',
    backdropFilter: 'var(--backdrop-filter)',
    borderRadius: '10px',
    cursor: onTicketClick ? 'pointer' : 'default',
    transition: 'all 150ms ease',
    border: '1px solid var(--divider-color)',
  };

  const handleClick = useCallback(() => {
    if (onTicketClick) {
      onTicketClick(node.ticket.id);
    }
  }, [node.ticket.id, onTicketClick]);

  return (
    <div style={nodeStyle}>
      <div
        style={cardStyle}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (onTicketClick) {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (onTicketClick) {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDownRegular style={{ fontSize: '16px' }} />
              ) : (
                <ChevronRightRegular style={{ fontSize: '16px' }} />
              )}
            </button>
          )}
          {!hasChildren && (
            <div style={{ width: '24px' }} />
          )}

          {/* Ticket Icon */}
          <ReceiptRegular style={{ 
            fontSize: '20px', 
            color: 'var(--brand-primary)',
            flexShrink: 0,
          }} />

          {/* Ticket Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              {node.ticket.id}
            </div>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontSize: '14px', 
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {node.ticket.title}
            </div>
          </div>

          {/* Status & Priority Badges */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {node.relationship_type && (
              <RelationshipBadge type={node.relationship_type} size="small" />
            )}
            <span style={{
              padding: '3px 8px',
              background: `${getPriorityColor(node.ticket.priority)}20`,
              color: getPriorityColor(node.ticket.priority),
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {node.ticket.priority}
            </span>
            <span style={{
              padding: '3px 8px',
              background: `${getStatusColor(node.ticket.status)}20`,
              color: getStatusColor(node.ticket.status),
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {node.ticket.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Children Count Badge */}
        {hasChildren && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '11px', 
            color: 'var(--text-muted)',
            paddingLeft: '36px',
          }}>
            {node.children.length} child {node.children.length === 1 ? 'ticket' : 'tickets'}
          </div>
        )}
      </div>

      {/* Render Children */}
      {isExpanded && hasChildren && (
        <div style={{ marginTop: '8px' }}>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.ticket.id || index}
              node={child}
              level={level + 1}
              onTicketClick={onTicketClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TicketHierarchyView: React.FC<TicketHierarchyViewProps> = ({
  tree,
  onTicketClick,
}) => {
  const containerStyle: React.CSSProperties = {
    padding: '16px',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--divider-color)',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: 600, 
          color: 'var(--text-primary)',
        }}>
          Ticket Hierarchy
        </h3>
        <p style={{ 
          margin: '4px 0 0', 
          fontSize: '13px', 
          color: 'var(--text-muted)',
        }}>
          Parent and child ticket relationships
        </p>
      </div>
      <TreeNode node={tree} level={0} onTicketClick={onTicketClick} />
    </div>
  );
};

export default TicketHierarchyView;
