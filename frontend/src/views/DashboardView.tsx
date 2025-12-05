/**
 * DashboardView - ITSM Dashboard
 * 
 * Primary dashboard view with stat cards, widgets, and activity timeline.
 * Provides at-a-glance overview of ITSM metrics and actionable items.
 * 
 * Part of Phase 3: Page Redesigns - Dashboard
 * Spec Reference: UI UX Specification Sheet - Section 7.1 Dashboard
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TicketDiagonalRegular,
  ClockRegular,
  CheckmarkCircleRegular,
  TimerRegular,
  AlertRegular,
  ArrowTrendingRegular,
  ArrowTrendingDownRegular,
  CalendarRegular,
  ArrowSyncRegular,
  ChevronRightRegular,
  PersonRegular,
  TagRegular,
  FilterRegular,
  MoreHorizontalRegular,
} from '@fluentui/react-icons';
import { useTheme } from '../hooks/useTheme';
import { useNotificationState } from '../hooks/useNotifications';
import { PurpleGlassCard, PurpleGlassButton, SLAIndicator, AIInsightsPanel, AIInsight } from '../components/ui';

/**
 * Dashboard time range options
 */
type TimeRange = '24h' | '7d' | '30d' | '90d';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

const TIME_RANGES: TimeRangeOption[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

/**
 * Stat card data interface
 */
interface StatCardData {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

/**
 * Ticket interface for widgets
 */
interface DashboardTicket {
  id: string;
  title: string;
  status: 'open' | 'in-progress' | 'pending' | 'resolved';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  createdAt: string;
  slaDeadline?: string;
  slaStatus?: 'on_track' | 'at_risk' | 'breached' | 'paused' | 'resolved';
}

/**
 * Activity item interface
 */
interface ActivityItem {
  id: string;
  type: 'ticket_created' | 'ticket_resolved' | 'ticket_assigned' | 'comment_added' | 'status_changed' | 'alert_triggered';
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  link?: string;
}

/**
 * Alert interface
 */
interface CriticalAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

// =============================================================================
// MOCK DATA - Replace with actual API calls
// =============================================================================

const MOCK_STATS: StatCardData[] = [
  {
    id: 'open',
    title: 'Open Tickets',
    value: 24,
    change: 12,
    changeLabel: 'vs last period',
    icon: <TicketDiagonalRegular />,
    color: '#6B4CE6',
    link: '/app/service-desk?status=open',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    value: 18,
    change: -5,
    changeLabel: 'vs last period',
    icon: <ClockRegular />,
    color: '#f59e0b',
    link: '/app/service-desk?status=in-progress',
  },
  {
    id: 'resolved',
    title: 'Resolved Today',
    value: 12,
    change: 25,
    changeLabel: 'vs yesterday',
    icon: <CheckmarkCircleRegular />,
    color: '#10b981',
    link: '/app/service-desk?status=resolved',
  },
  {
    id: 'avg-time',
    title: 'Avg Resolution',
    value: '4.2h',
    change: -15,
    changeLabel: 'improved',
    icon: <TimerRegular />,
    color: 'var(--brand-primary)',
  },
];

const MOCK_MY_TICKETS: DashboardTicket[] = [
  {
    id: 'TKT-001',
    title: 'Server performance degradation in prod cluster',
    status: 'in-progress',
    priority: 'critical',
    assignee: 'You',
    createdAt: '2025-12-03T10:30:00Z',
    slaDeadline: '2025-12-03T14:30:00Z',
    slaStatus: 'at_risk',
  },
  {
    id: 'TKT-002',
    title: 'User unable to access email after password reset',
    status: 'open',
    priority: 'high',
    assignee: 'You',
    createdAt: '2025-12-03T09:15:00Z',
    slaDeadline: '2025-12-03T17:15:00Z',
    slaStatus: 'on_track',
  },
  {
    id: 'TKT-003',
    title: 'Request for new software license - Adobe CC',
    status: 'pending',
    priority: 'medium',
    assignee: 'You',
    createdAt: '2025-12-02T14:00:00Z',
    slaDeadline: '2025-12-05T14:00:00Z',
    slaStatus: 'on_track',
  },
  {
    id: 'TKT-004',
    title: 'VPN connection dropping intermittently',
    status: 'open',
    priority: 'high',
    assignee: 'You',
    createdAt: '2025-12-03T08:45:00Z',
    slaDeadline: '2025-12-03T16:45:00Z',
    slaStatus: 'on_track',
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'ticket_resolved',
    title: 'Ticket Resolved',
    description: 'TKT-099 "Printer not working in Building A" marked as resolved',
    timestamp: '2025-12-03T11:30:00Z',
    actor: 'Sarah Chen',
  },
  {
    id: 'act-2',
    type: 'alert_triggered',
    title: 'Alert Triggered',
    description: 'High CPU usage detected on prod-web-03',
    timestamp: '2025-12-03T11:15:00Z',
  },
  {
    id: 'act-3',
    type: 'ticket_assigned',
    title: 'Ticket Assigned',
    description: 'TKT-102 assigned to you by Team Lead',
    timestamp: '2025-12-03T10:45:00Z',
    actor: 'Mike Johnson',
  },
  {
    id: 'act-4',
    type: 'comment_added',
    title: 'Comment Added',
    description: 'New comment on TKT-001 from customer',
    timestamp: '2025-12-03T10:30:00Z',
    actor: 'Customer',
  },
  {
    id: 'act-5',
    type: 'status_changed',
    title: 'Status Changed',
    description: 'TKT-098 moved to "In Progress"',
    timestamp: '2025-12-03T10:00:00Z',
    actor: 'You',
  },
];

const MOCK_ALERTS: CriticalAlert[] = [
  {
    id: 'alert-1',
    title: 'High CPU usage on prod-web-03',
    severity: 'critical',
    source: 'Monitoring',
    timestamp: '2025-12-03T11:15:00Z',
    acknowledged: false,
  },
  {
    id: 'alert-2',
    title: 'Database connection pool exhausted',
    severity: 'high',
    source: 'Monitoring',
    timestamp: '2025-12-03T10:50:00Z',
    acknowledged: true,
  },
  {
    id: 'alert-3',
    title: 'SSL certificate expiring in 7 days',
    severity: 'medium',
    source: 'Certificate Monitor',
    timestamp: '2025-12-03T09:00:00Z',
    acknowledged: false,
  },
];

// AI-powered insights (would come from ML backend in production)
const MOCK_AI_INSIGHTS: AIInsight[] = [
  {
    id: 'ai-1',
    type: 'prediction',
    severity: 'warning',
    title: 'Predicted SLA Breach Risk',
    description: 'Based on current workload patterns, TKT-001 has a 78% chance of breaching SLA in the next 2 hours. Similar tickets have historically required 4+ hours to resolve.',
    confidence: 85,
    actionLabel: 'View Ticket',
    actionPath: '/app/service-desk/ticket/TKT-001',
    metadata: {
      source: 'Predictive Analytics',
      relatedItems: ['TKT-001', 'TKT-045', 'TKT-089'],
      timeframe: 'Next 2 hours',
      impact: 'high',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ai-2',
    type: 'anomaly',
    severity: 'critical',
    title: 'Unusual Ticket Volume Detected',
    description: 'Email-related incidents have increased 340% in the last hour compared to the same time last week. This may indicate a service outage.',
    confidence: 92,
    actionLabel: 'Investigate',
    actionPath: '/app/service-desk?category=email',
    metadata: {
      source: 'Anomaly Detection',
      timeframe: 'Last hour',
      impact: 'high',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ai-3',
    type: 'suggestion',
    severity: 'info',
    title: 'Knowledge Base Recommendation',
    description: 'TKT-002 matches 94% with known issue KB-1234 "Password Reset Email Delays". Consider linking this article to speed up resolution.',
    confidence: 94,
    actionLabel: 'View KB Article',
    actionPath: '/app/knowledge/KB-1234',
    metadata: {
      source: 'Knowledge Matching',
      relatedItems: ['KB-1234', 'TKT-002'],
      impact: 'medium',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ai-4',
    type: 'optimization',
    severity: 'success',
    title: 'Team Performance Improving',
    description: 'Your team\'s average resolution time has decreased 23% this week. Top contributors: Sarah Chen (15 tickets), Mike Johnson (12 tickets).',
    confidence: 100,
    metadata: {
      source: 'Performance Analytics',
      timeframe: 'This week vs last week',
      impact: 'low',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ai-5',
    type: 'trend',
    severity: 'warning',
    title: 'Recurring Issue Pattern',
    description: 'VPN connectivity issues have occurred 5 times in the past month, always on Monday mornings. Consider proactive maintenance or capacity review.',
    confidence: 78,
    actionLabel: 'View Pattern Report',
    actionPath: '/app/analytics/patterns',
    metadata: {
      source: 'Trend Analysis',
      timeframe: 'Last 30 days',
      impact: 'medium',
    },
    createdAt: new Date().toISOString(),
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  data: StatCardData;
  isDark: boolean;
  onClick?: () => void;
}> = ({ data, onClick }) => {
  const isPositiveChange = (data.change ?? 0) > 0;
  const isNegativeGood = data.id === 'avg-time'; // Lower avg time is better
  const showGreen = isNegativeGood ? !isPositiveChange : isPositiveChange;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
          e.currentTarget.style.borderColor = 'var(--card-border-hover)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--card-border)';
      }}
    >
      {/* Icon */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${data.color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: data.color,
        fontSize: '20px',
      }}>
        {data.icon}
      </div>

      {/* Title */}
      <p style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {data.title}
      </p>

      {/* Value */}
      <p style={{
        margin: '8px 0 0 0',
        fontSize: '32px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
      }}>
        {data.value}
      </p>

      {/* Change */}
      {data.change !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '8px',
        }}>
          {showGreen ? (
            <ArrowTrendingRegular style={{ color: 'var(--status-success)', fontSize: '16px' }} />
          ) : (
            <ArrowTrendingDownRegular style={{ color: 'var(--status-critical)', fontSize: '16px' }} />
          )}
          <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: showGreen ? 'var(--status-success)' : 'var(--status-critical)',
          }}>
            {Math.abs(data.change)}%
          </span>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}>
            {data.changeLabel}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Ticket Row Component
 */
const TicketRow: React.FC<{
  ticket: DashboardTicket;
  isDark: boolean;
  onClick?: () => void;
}> = ({ ticket, onClick }) => {
  const priorityColors = {
    critical: 'var(--status-critical)',
    high: 'var(--status-warning)',
    medium: 'var(--status-info)',
    low: 'var(--status-neutral)',
  };

  const statusColors = {
    open: 'var(--brand-primary)',
    'in-progress': 'var(--status-warning)',
    pending: 'var(--status-neutral)',
    resolved: 'var(--status-success)',
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--btn-ghost-bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Priority Indicator */}
      <div style={{
        width: '4px',
        height: '40px',
        borderRadius: '2px',
        background: priorityColors[ticket.priority],
        flexShrink: 0,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--brand-primary)',
            fontFamily: 'var(--lcm-font-family-mono, monospace)',
          }}>
            {ticket.id}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: '4px',
            background: `color-mix(in srgb, ${statusColors[ticket.status]} 15%, transparent)`,
            color: statusColors[ticket.status],
            textTransform: 'capitalize',
          }}>
            {ticket.status.replace('-', ' ')}
          </span>
        </div>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {ticket.title}
        </p>
      </div>

      {/* SLA Indicator */}
      {ticket.slaStatus && (
        <SLAIndicator
          status={ticket.slaStatus}
          size="small"
          showLabel={false}
        />
      )}

      {/* Arrow */}
      <ChevronRightRegular style={{
        color: 'var(--text-muted)',
        fontSize: '16px',
        flexShrink: 0,
      }} />
    </div>
  );
};

/**
 * Activity Item Component
 */
const ActivityItemRow: React.FC<{
  item: ActivityItem;
  isDark: boolean;
}> = ({ item }) => {
  const typeColors: Record<ActivityItem['type'], string> = {
    ticket_created: 'var(--brand-primary)',
    ticket_resolved: 'var(--status-success)',
    ticket_assigned: 'var(--status-info)',
    comment_added: 'var(--status-warning)',
    status_changed: 'var(--brand-primary-light)',
    alert_triggered: 'var(--status-critical)',
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid var(--divider-color-subtle)',
    }}>
      {/* Timeline Dot */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: typeColors[item.type],
        marginTop: '6px',
        flexShrink: 0,
      }} />

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {item.title}
          </span>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}>
            {formatTime(item.timestamp)}
          </span>
        </div>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}>
          {item.description}
        </p>
      </div>
    </div>
  );
};

/**
 * Alert Card Component
 */
const AlertCard: React.FC<{
  alert: CriticalAlert;
  isDark: boolean;
  onAcknowledge?: () => void;
  onCreateTicket?: () => void;
}> = ({ alert, onAcknowledge, onCreateTicket }) => {
  const severityColors = {
    critical: 'var(--status-critical)',
    high: 'var(--status-warning)',
    medium: 'var(--status-info)',
  };

  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      border: alert.acknowledged ? '1px solid transparent' : `1px solid color-mix(in srgb, ${severityColors[alert.severity]} 30%, transparent)`,
      background: alert.acknowledged 
        ? 'var(--btn-ghost-bg-hover)'
        : `color-mix(in srgb, ${severityColors[alert.severity]} 8%, transparent)`,
      opacity: alert.acknowledged ? 0.7 : 1,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <AlertRegular style={{
          color: severityColors[alert.severity],
          fontSize: '20px',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background: severityColors[alert.severity],
              color: 'white',
              textTransform: 'uppercase',
            }}>
              {alert.severity}
            </span>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              {alert.source}
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}>
            {alert.title}
          </p>
          {!alert.acknowledged && (
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
            }}>
              <button
                onClick={onAcknowledge}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--btn-secondary-bg)',
                  color: 'var(--btn-secondary-text)',
                  cursor: 'pointer',
                }}
              >
                Acknowledge
              </button>
              <button
                onClick={onCreateTicket}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--brand-primary)',
                  color: 'var(--text-on-primary)',
                  cursor: 'pointer',
                }}
              >
                Create Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { criticalUnread } = useNotificationState();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulated refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Navigate to ticket detail
  const handleTicketClick = useCallback((ticketId: string) => {
    navigate(`/app/service-desk/${ticketId}`);
  }, [navigate]);

  // Navigate to stat detail
  const handleStatClick = useCallback((link?: string) => {
    if (link) navigate(link);
  }, [navigate]);

  return (
    <div data-testid="dashboard-view" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header - wrapped in card */}
      <div style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
          <h1 style={{
            margin: 0,
            fontSize: 'var(--lcm-font-size-xxxl, 32px)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ArrowTrendingRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
            Dashboard
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '16px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
          }}>
            Welcome back! Here's your ITSM overview.
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              background: '#6B4CE6',
              color: 'white',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isRefreshing ? 0.7 : 1,
            }}
          >
            <ArrowSyncRegular style={{
              fontSize: '16px',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            }} />
            Refresh
          </button>
        </div>
        </div>
      </div>

      {/* Stat Cards Row - wrapped in card */}
      <div style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '20px',
        }}>
          {MOCK_STATS.map((stat) => (
            <StatCard
              key={stat.id}
              data={stat}
              isDark={isDark}
              onClick={stat.link ? () => handleStatClick(stat.link) : undefined}
            />
          ))}
        </div>
      </div>

      {/* AI Insights Section */}
      <div style={{
        marginBottom: '32px',
        padding: '24px',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
      }}>
        <AIInsightsPanel
          insights={MOCK_AI_INSIGHTS}
          maxVisible={3}
          onDismiss={(id) => console.log('Dismissed insight:', id)}
          onFeedback={(id, helpful) => console.log('Feedback:', id, helpful)}
        />
      </div>

      {/* Widgets Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
        gap: '20px',
      }}>
        {/* My Open Tickets Widget */}
        <div style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          overflow: 'hidden',
        }}>
          {/* Widget Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--divider-color-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <TicketDiagonalRegular style={{ color: 'var(--brand-primary)', fontSize: '20px' }} />
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                My Open Tickets
              </h3>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(107, 76, 230, 0.15)',
                color: '#6B4CE6',
              }}>
                {MOCK_MY_TICKETS.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/app/service-desk?assignee=me')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All
              <ChevronRightRegular style={{ fontSize: '14px' }} />
            </button>
          </div>

          {/* Ticket List */}
          <div style={{ padding: '8px 12px' }}>
            {MOCK_MY_TICKETS.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                isDark={isDark}
                onClick={() => handleTicketClick(ticket.id)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity Widget */}
        <div style={{
          background: 'var(--card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid var(--card-border)',
          overflow: 'hidden',
        }}>
          {/* Widget Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--divider-color-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <ClockRegular style={{ color: 'var(--brand-primary)', fontSize: '20px' }} />
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                Recent Activity
              </h3>
            </div>
          </div>

          {/* Activity List */}
          <div style={{ padding: '8px 20px', maxHeight: '400px', overflowY: 'auto' }}>
            {MOCK_ACTIVITY.map((item) => (
              <ActivityItemRow
                key={item.id}
                item={item}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* Critical Alerts Widget */}
        <div 
          className="critical-alerts-widget"
          style={{
            background: 'var(--card-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid var(--card-border)',
            overflow: 'hidden',
            gridColumn: 'span 2',
          }}>
          {/* Widget Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--divider-color-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <AlertRegular style={{ color: 'var(--status-critical)', fontSize: '20px' }} />
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                Critical Alerts
              </h3>
              {MOCK_ALERTS.filter(a => !a.acknowledged).length > 0 && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                }}>
                  {MOCK_ALERTS.filter(a => !a.acknowledged).length} active
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/app/monitoring')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#6B4CE6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View Monitoring
              <ChevronRightRegular style={{ fontSize: '14px' }} />
            </button>
          </div>

          {/* Alerts Grid */}
          <div style={{
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '12px',
          }}>
            {MOCK_ALERTS.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isDark={isDark}
                onAcknowledge={() => console.log('Acknowledge:', alert.id)}
                onCreateTicket={() => navigate('/app/service-desk?action=create&source=alert')}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CSS for spin animation and responsive grid */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Make critical alerts span full width on mobile */
        @media (max-width: 900px) {
          .critical-alerts-widget {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardView;
