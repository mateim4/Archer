import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput, 
  PurpleGlassDropdown,
  LinkedAssetBadge,
  SLAIndicator,
  CreateIncidentModal,
  AlertContext,
  CreateIncidentData
} from '../components/ui';
import { 
  AddRegular, 
  FilterRegular, 
  SearchRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ErrorCircleRegular,
  ClockRegular,
  BoardRegular,
  ListRegular,
  PersonRegular,
  TagRegular,
  ArrowSortRegular,
  AlertRegular,
  DesktopRegular
} from '@fluentui/react-icons';
import { apiClient, Ticket } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { DesignTokens } from '../styles/designSystem';

// Extended Ticket Interface for UI
interface ExtendedTicket extends Omit<Ticket, 'ticket_type'> {
  ticket_type: string;
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
  slaTimeRemaining?: string;
  linkedCi?: { id: string; name: string; type?: 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH'; status: 'healthy' | 'warning' | 'critical' };
}

const ServiceDeskView: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tickets, setTickets] = useState<ExtendedTicket[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { isLoading, withLoading } = useEnhancedUX();

  const handleTicketClick = (ticketId: string) => {
    navigate(`/app/service-desk/ticket/${ticketId}`);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    await withLoading(async () => {
      try {
        const data = await apiClient.getTickets();
        // Mocking some extended data for the "ServiceNow Killer" feel
        const extendedData = data.map((t, i) => ({
          ...t,
          ticket_type: t.ticket_type.toString(),
          slaStatus: i % 5 === 0 ? 'breached' : i % 3 === 0 ? 'at_risk' : 'on_track',
          slaTimeRemaining: i % 5 === 0 ? '2h overdue' : i % 3 === 0 ? '45m left' : '3h 30m left',
          linkedCi: i % 2 === 0 ? { id: 'nx-cluster-01', name: 'NX-Cluster-01', type: 'CLUSTER' as const, status: 'critical' as const } : undefined
        })) as ExtendedTicket[];
        setTickets(extendedData);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      }
    });
  };

  const handleCreateIncident = async (data: CreateIncidentData) => {
    // In a real implementation, this would call the API
    console.log('Creating incident:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // Reload tickets after creation
    await loadTickets();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return '#ef4444'; // Red
      case 'P2': return '#f59e0b'; // Orange
      case 'P3': return '#3b82f6'; // Blue
      default: return '#10b981';   // Green
    }
  };

  const getPriorityIcon = (priority: string) => {
    const color = getPriorityColor(priority);
    switch (priority) {
      case 'P1': return <ErrorCircleRegular style={{ color }} />;
      case 'P2': return <WarningRegular style={{ color }} />;
      case 'P3': return <ClockRegular style={{ color }} />;
      default: return <CheckmarkCircleRegular style={{ color }} />;
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(filter.toLowerCase()) || 
                          t.id?.toString().toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Resolved' ? ['RESOLVED', 'CLOSED'].includes(t.status) : t.status === statusFilter.toUpperCase().replace(' ', '_'));
    return matchesSearch && matchesStatus;
  });

  // Kanban Columns
  const columns = [
    { id: 'NEW', title: 'New / Triage', color: 'border-l-4 border-blue-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-l-4 border-purple-500' },
    { id: 'WAITING', title: 'Waiting', color: 'border-l-4 border-yellow-500' },
    { id: 'RESOLVED', title: 'Resolved', color: 'border-l-4 border-green-500' }
  ];

  return (
    <div style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.xl }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `2px solid ${DesignTokens.colors.primary}20`, paddingBottom: DesignTokens.spacing.lg }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: DesignTokens.typography.xxxl, fontWeight: DesignTokens.typography.bold, color: 'var(--brand-primary)', margin: 0, fontFamily: DesignTokens.typography.fontFamily }}>Service Desk</h1>
              <span style={{
                padding: '2px 8px',
                borderRadius: DesignTokens.borderRadius.full,
                background: `${DesignTokens.colors.primary}20`,
                color: 'var(--brand-primary)',
                fontSize: DesignTokens.typography.xs,
                fontWeight: DesignTokens.typography.medium,
                border: `1px solid ${DesignTokens.colors.primary}30`
              }}>
                ITIL v4 Aligned
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: DesignTokens.typography.sm, margin: 0 }}>Manage Incidents, Problems, and Change Requests</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', borderRadius: DesignTokens.borderRadius.md, overflow: 'hidden', border: `1px solid ${DesignTokens.colors.gray200}` }}>
              <PurpleGlassButton 
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setViewMode('list')}
                icon={<ListRegular />}
                glass={viewMode === 'list'}
                style={{ borderRadius: '8px 0 0 8px' }}
              />
              <PurpleGlassButton 
                variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setViewMode('kanban')}
                icon={<BoardRegular />}
                glass={viewMode === 'kanban'}
                style={{ borderRadius: '0 8px 8px 0' }}
              />
            </div>
            
            <PurpleGlassButton 
              variant="primary" 
              icon={<AddRegular />}
              glass
              onClick={() => setCreateModalOpen(true)}
            >
              Create Ticket
            </PurpleGlassButton>
          </div>
        </div>

        {/* KPI Cards (ServiceNow Killer Feature) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: DesignTokens.spacing.lg }}>
          <KPICard title="Open Incidents" value={tickets.filter(t => t.status !== 'RESOLVED').length} trend="+2" trendType="negative" />
          <KPICard title="SLA Breaches" value={tickets.filter(t => t.slaStatus === 'breached').length} trend="-1" trendType="positive" />
          <KPICard title="Critical Assets" value={3} trend="0" trendType="neutral" icon={<DesktopRegular />} />
          <KPICard title="Avg Resolution" value="4.2h" trend="-15m" trendType="positive" icon={<ClockRegular />} />
        </div>

        {/* Filters Toolbar */}
        <PurpleGlassCard glass style={{ padding: DesignTokens.spacing.md }}>
          <div style={{ display: 'flex', gap: DesignTokens.spacing.lg, alignItems: 'center' }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <PurpleGlassInput 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search tickets, assets, or people..."
                prefixIcon={<SearchRegular />}
                glass="none"
              />
            </div>
            <div style={{ width: '200px' }}>
              <PurpleGlassDropdown
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'New', label: 'New' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Resolved', label: 'Resolved' }
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as string)}
                glass="none"
              />
            </div>
            <div style={{ flex: 1 }} />
            <PurpleGlassButton variant="ghost" size="small" icon={<FilterRegular />}>Advanced Filters</PurpleGlassButton>
            <PurpleGlassButton variant="ghost" size="small" icon={<ArrowSortRegular />}>Sort</PurpleGlassButton>
          </div>
        </PurpleGlassCard>

        {/* Main Content Area */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {viewMode === 'list' ? (
            <div style={{ height: '100%', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTickets.map(ticket => (
                <TicketListItem 
                  key={ticket.id?.toString()} 
                  ticket={ticket} 
                  getPriorityIcon={getPriorityIcon}
                  onClick={() => handleTicketClick(ticket.id?.toString() || '')}
                />
              ))}
            </div>
          ) : (
            <div style={{ height: '100%', overflowX: 'auto', display: 'flex', gap: DesignTokens.spacing.lg, paddingBottom: '8px' }}>
              {columns.map(col => (
                <div key={col.id} style={{
                  width: '320px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  background: `${DesignTokens.colors.primary}05`,
                  borderRadius: DesignTokens.borderRadius.xl,
                  border: `1px solid ${DesignTokens.colors.gray200}`,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: DesignTokens.spacing.md,
                    fontWeight: DesignTokens.typography.semibold,
                    color: DesignTokens.colors.textPrimary,
                    background: `${DesignTokens.colors.primary}05`,
                    borderBottom: `1px solid ${DesignTokens.colors.gray200}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: col.id === 'NEW' ? `4px solid ${DesignTokens.colors.info}` :
                               col.id === 'IN_PROGRESS' ? `4px solid ${DesignTokens.colors.primary}` :
                               col.id === 'WAITING' ? `4px solid ${DesignTokens.colors.warning}` :
                               `4px solid ${DesignTokens.colors.success}`
                  }}>
                    {col.title}
                    <span style={{
                      background: `${DesignTokens.colors.primary}10`,
                      padding: '2px 8px',
                      borderRadius: DesignTokens.borderRadius.sm,
                      fontSize: DesignTokens.typography.xs,
                      color: DesignTokens.colors.textSecondary
                    }}>
                      {filteredTickets.filter(t => t.status === col.id || (col.id === 'RESOLVED' && ['RESOLVED', 'CLOSED'].includes(t.status))).length}
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: DesignTokens.spacing.md, display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.md }}>
                    {filteredTickets
                      .filter(t => t.status === col.id || (col.id === 'RESOLVED' && ['RESOLVED', 'CLOSED'].includes(t.status)))
                      .map(ticket => (
                        <TicketKanbanCard 
                          key={ticket.id?.toString()} 
                          ticket={ticket} 
                          getPriorityIcon={getPriorityIcon}
                          onClick={() => handleTicketClick(ticket.id?.toString() || '')}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateIncident}
      />
    </div>
  );
};

// --- Sub-Components ---

const KPICard: React.FC<{ title: string; value: string | number; trend: string; trendType: 'positive' | 'negative' | 'neutral'; icon?: React.ReactNode }> = ({ title, value, trend, trendType, icon }) => (
  <PurpleGlassCard glass variant="subtle" style={{ padding: DesignTokens.spacing.lg, transition: 'transform 0.2s ease' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <span style={{ color: DesignTokens.colors.textSecondary, fontSize: DesignTokens.typography.sm, fontWeight: DesignTokens.typography.medium }}>{title}</span>
      {icon && <span style={{ color: DesignTokens.colors.textMuted }}>{icon}</span>}
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
      <span style={{ color: DesignTokens.colors.textPrimary, fontSize: DesignTokens.typography.xxl, fontWeight: DesignTokens.typography.bold }}>{value}</span>
      <span 
        style={{ 
          fontSize: DesignTokens.typography.xs,
          marginBottom: '4px',
          color: trendType === 'positive' ? DesignTokens.colors.success : 
                 trendType === 'negative' ? DesignTokens.colors.error : 
                 DesignTokens.colors.textMuted
        }}
      >
        {trend}
      </span>
    </div>
  </PurpleGlassCard>
);

const TicketListItem: React.FC<{ ticket: ExtendedTicket; getPriorityIcon: (p: string) => React.ReactNode; onClick?: () => void }> = ({ ticket, getPriorityIcon, onClick }) => (
  <PurpleGlassCard glass variant="interactive" style={{ padding: DesignTokens.spacing.md, cursor: 'pointer' }} onClick={onClick}>
    <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.lg }}>
      <div style={{ flexShrink: 0 }} title={`Priority: ${ticket.priority}`}>
        {getPriorityIcon(ticket.priority.toString())}
      </div>
      <div style={{ width: '96px', flexShrink: 0 }}>
        <span style={{ fontSize: DesignTokens.typography.xs, fontFamily: 'monospace', color: DesignTokens.colors.textMuted }}>
          {ticket.id?.toString() || 'NEW'}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
          {ticket.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: DesignTokens.typography.xs, marginTop: '2px', color: DesignTokens.colors.textSecondary }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><PersonRegular style={{ fontSize: '12px' }} /> {ticket.assignee || 'Unassigned'}</span>
          {ticket.linkedCi && (
            <LinkedAssetBadge
              assetId={ticket.linkedCi.id}
              assetName={ticket.linkedCi.name}
              assetType={ticket.linkedCi.type}
              status={ticket.linkedCi.status}
              size="small"
              showChevron={false}
            />
          )}
          <span>• {new Date(ticket.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        {ticket.slaStatus && (
          <SLAIndicator
            status={ticket.slaStatus}
            timeDisplay={ticket.slaTimeRemaining}
            size="small"
            showLabel={ticket.slaStatus === 'breached'}
          />
        )}
        <span 
          style={{
            padding: '4px 8px',
            borderRadius: DesignTokens.borderRadius.xs,
            fontSize: DesignTokens.typography.xs,
            fontWeight: DesignTokens.typography.medium,
            background: ticket.status === 'NEW' ? `${DesignTokens.colors.info}20` :
                       ticket.status === 'IN_PROGRESS' ? `${DesignTokens.colors.primary}20` :
                       `${DesignTokens.colors.success}20`,
            color: ticket.status === 'NEW' ? DesignTokens.colors.info :
                   ticket.status === 'IN_PROGRESS' ? DesignTokens.colors.primary :
                   DesignTokens.colors.success
          }}
        >
          {ticket.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  </PurpleGlassCard>
);

const TicketKanbanCard: React.FC<{ ticket: ExtendedTicket; getPriorityIcon: (p: string) => React.ReactNode; onClick?: () => void }> = ({ ticket, getPriorityIcon, onClick }) => (
  <PurpleGlassCard glass variant="interactive" style={{ padding: DesignTokens.spacing.md, cursor: 'pointer' }} onClick={onClick}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <span style={{ fontSize: DesignTokens.typography.xs, fontFamily: 'monospace', color: DesignTokens.colors.textMuted }}>
        {ticket.id?.toString() || 'NEW'}
      </span>
      {getPriorityIcon(ticket.priority.toString())}
    </div>
    <h4 
      style={{ 
        fontSize: DesignTokens.typography.sm, 
        fontWeight: DesignTokens.typography.medium, 
        marginBottom: DesignTokens.spacing.md, 
        color: DesignTokens.colors.textPrimary,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {ticket.title}
    </h4>
    
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: DesignTokens.spacing.md }}>
      {ticket.linkedCi && (
        <LinkedAssetBadge
          assetId={ticket.linkedCi.id}
          assetName={ticket.linkedCi.name}
          assetType={ticket.linkedCi.type}
          status={ticket.linkedCi.status}
          size="small"
          showChevron={false}
        />
      )}
      <span 
        style={{ 
          fontSize: DesignTokens.typography.xs,
          padding: '2px 6px',
          borderRadius: DesignTokens.borderRadius.xs,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: DesignTokens.colors.gray100,
          color: DesignTokens.colors.textSecondary
        }}
      >
        <TagRegular style={{ fontSize: '12px' }} /> {ticket.ticket_type}
      </span>
    </div>

    <div 
      style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: `1px solid ${DesignTokens.colors.gray200}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div 
          style={{ 
            width: '20px',
            height: '20px',
            borderRadius: DesignTokens.borderRadius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            background: `${DesignTokens.colors.primary}30`,
            color: DesignTokens.colors.primary
          }}
        >
          {ticket.assignee ? ticket.assignee.charAt(0) : '?'}
        </div>
        <span 
          style={{ 
            fontSize: DesignTokens.typography.xs,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '80px',
            color: DesignTokens.colors.textMuted
          }}
        >
          {ticket.assignee || 'Unassigned'}
        </span>
      </div>
      {ticket.slaStatus && (
        <SLAIndicator
          status={ticket.slaStatus}
          size="small"
          showLabel={false}
        />
      )}
    </div>
  </PurpleGlassCard>
);

export default ServiceDeskView;
