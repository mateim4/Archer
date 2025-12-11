import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput, 
  PurpleGlassDropdown,
  PurpleGlassCheckbox,
  LinkedAssetBadge,
  SLAIndicator,
  CreateIncidentModal,
  AlertContext,
  CreateIncidentData,
  PageHeader
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
  DesktopRegular,
  PersonSupportRegular,
  BugRegular,
  ArrowSyncRegular,
  PersonQuestionMarkRegular,
  ArrowCircleUpRegular,
  ClockAlarmRegular,
  CalendarTodayRegular,
  BookmarkRegular,
  ChevronDownRegular,
  DismissRegular,
  ArrowExportRegular,
  TicketDiagonalRegular
} from '@fluentui/react-icons';
import { apiClient, Ticket } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { DesignTokens } from '../styles/designSystem';

// Extended Ticket Interface for UI - adds UI-specific fields
interface ExtendedTicket {
  id: string;
  title: string;
  description?: string;
  type: 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'SERVICE_REQUEST';
  ticket_type: string; // User-friendly display name
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignee?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
  slaTimeRemaining?: string;
  linkedCi?: { id: string; name: string; type?: 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH'; status: 'healthy' | 'warning' | 'critical' };
}

// Ticket type tabs configuration
const TICKET_TYPE_TABS = [
  { id: 'all', label: 'All Tickets', icon: <ListRegular />, filter: null },
  { id: 'incident', label: 'Incidents', icon: <WarningRegular />, filter: 'Incident' },
  { id: 'service_request', label: 'Service Requests', icon: <PersonSupportRegular />, filter: 'Service Request' },
  { id: 'problem', label: 'Problems', icon: <BugRegular />, filter: 'Problem' },
  { id: 'change', label: 'Changes', icon: <ArrowSyncRegular />, filter: 'Change' },
];

// Saved views configuration
const SAVED_VIEWS = [
  { id: 'all', label: 'All Tickets', icon: <ListRegular />, filters: {} },
  { id: 'my_tickets', label: 'My Tickets', icon: <PersonRegular />, filters: { assignee: 'current_user' } },
  { id: 'unassigned', label: 'Unassigned', icon: <PersonQuestionMarkRegular />, filters: { assignee: null } },
  { id: 'high_priority', label: 'High Priority', icon: <ArrowCircleUpRegular />, filters: { priority: ['Critical', 'High'] } },
  { id: 'sla_at_risk', label: 'SLA At Risk', icon: <ClockAlarmRegular />, filters: { slaStatus: ['at_risk', 'breached'] } },
  { id: 'created_today', label: 'Created Today', icon: <CalendarTodayRegular />, filters: { createdDate: 'today' } },
];

// Comprehensive mock ticket data for development and demo
const MOCK_TICKETS: ExtendedTicket[] = [
  {
    id: 'INC-001',
    title: 'Production cluster NX-01 experiencing high CPU utilization',
    description: 'Multiple nodes in the NX-01 cluster are showing CPU utilization above 90%. User-facing services may be impacted.',
    type: 'INCIDENT',
    priority: 'P1',
    status: 'IN_PROGRESS',
    ticket_type: 'Incident',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_by: 'system',
    assignee: 'John Smith',
    slaStatus: 'at_risk',
    slaTimeRemaining: '45m left',
    linkedCi: { id: 'nx-01', name: 'NX-Cluster-01', type: 'CLUSTER', status: 'critical' }
  },
  {
    id: 'INC-002',
    title: 'Email service intermittent connectivity issues',
    description: 'Users reporting intermittent failures when sending emails. Exchange server showing connection timeouts.',
    type: 'INCIDENT',
    priority: 'P2',
    status: 'NEW',
    ticket_type: 'Incident',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_by: 'jane.doe@company.com',
    assignee: undefined,
    slaStatus: 'on_track',
    slaTimeRemaining: '3h 30m left',
    linkedCi: { id: 'exch-01', name: 'EXCH-SERVER-01', type: 'HOST', status: 'warning' }
  },
  {
    id: 'INC-003',
    title: 'VPN connection drops for remote users',
    description: 'Multiple remote users experiencing VPN disconnections every 15-20 minutes.',
    type: 'INCIDENT',
    priority: 'P2',
    status: 'IN_PROGRESS',
    ticket_type: 'Incident',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    created_by: 'help.desk@company.com',
    assignee: 'Sarah Johnson',
    slaStatus: 'breached',
    slaTimeRemaining: '2h overdue',
    linkedCi: { id: 'vpn-gw-01', name: 'VPN-GATEWAY-01', type: 'HOST', status: 'critical' }
  },
  {
    id: 'SR-001',
    title: 'New laptop setup request for Marketing team',
    description: 'Request for 5 new Dell laptops for Marketing department new hires starting next month.',
    type: 'SERVICE_REQUEST',
    priority: 'P3',
    status: 'NEW',
    ticket_type: 'Service Request',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'marketing.manager@company.com',
    assignee: 'Tech Support',
    slaStatus: 'on_track',
    slaTimeRemaining: '2d 4h left'
  },
  {
    id: 'SR-002',
    title: 'Software installation - Adobe Creative Suite',
    description: 'Install Adobe Creative Suite on workstation DESK-MKT-003 for design team member.',
    type: 'SERVICE_REQUEST',
    priority: 'P4',
    status: 'IN_PROGRESS',
    ticket_type: 'Service Request',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_by: 'design.lead@company.com',
    assignee: 'Mike Wilson',
    slaStatus: 'on_track',
    slaTimeRemaining: '5h left'
  },
  {
    id: 'PRB-001',
    title: 'Recurring memory leaks in application server',
    description: 'App server APP-PROD-01 requires weekly restarts due to memory consumption. Root cause investigation needed.',
    type: 'PROBLEM',
    priority: 'P2',
    status: 'IN_PROGRESS',
    ticket_type: 'Problem',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'devops.team@company.com',
    assignee: 'DevOps Team',
    slaStatus: 'on_track',
    slaTimeRemaining: '5d left',
    linkedCi: { id: 'app-prod-01', name: 'APP-PROD-01', type: 'HOST', status: 'warning' }
  },
  {
    id: 'PRB-002',
    title: 'Network latency spikes during peak hours',
    description: 'Investigating cause of network latency increases (>200ms) during 9AM-11AM business hours.',
    type: 'PROBLEM',
    priority: 'P3',
    status: 'NEW',
    ticket_type: 'Problem',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'network.admin@company.com',
    assignee: undefined,
    slaStatus: 'on_track',
    slaTimeRemaining: '8d left',
    linkedCi: { id: 'core-sw-01', name: 'CORE-SWITCH-01', type: 'SWITCH', status: 'healthy' }
  },
  {
    id: 'CHG-001',
    title: 'Scheduled maintenance - Database cluster upgrade',
    description: 'Upgrade PostgreSQL cluster from 14.x to 16.x. Planned downtime: 2 hours.',
    type: 'CHANGE',
    priority: 'P2',
    status: 'NEW',
    ticket_type: 'Change',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'dba.team@company.com',
    assignee: 'DBA Team',
    slaStatus: 'on_track',
    slaTimeRemaining: 'Scheduled for Sunday'
  },
  {
    id: 'CHG-002',
    title: 'Firewall rule update for new SaaS integration',
    description: 'Add outbound rules for Salesforce API integration on production firewall.',
    type: 'CHANGE',
    priority: 'P3',
    status: 'RESOLVED',
    ticket_type: 'Change',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'network.team@company.com',
    assignee: 'Network Team',
    slaStatus: 'on_track',
    slaTimeRemaining: 'Completed'
  },
  {
    id: 'INC-004',
    title: 'Printer offline in Building B - Floor 3',
    description: 'Network printer HP-PRN-B3-01 showing offline status. Users cannot print documents.',
    type: 'INCIDENT',
    priority: 'P3',
    status: 'NEW',
    ticket_type: 'Incident',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    created_by: 'office.admin@company.com',
    assignee: undefined,
    slaStatus: 'on_track',
    slaTimeRemaining: '7h left'
  },
  {
    id: 'SR-003',
    title: 'Password reset for executive account',
    description: 'CFO forgot password and needs immediate reset for board meeting presentation access.',
    type: 'SERVICE_REQUEST',
    priority: 'P1',
    status: 'RESOLVED',
    ticket_type: 'Service Request',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_by: 'executive.assistant@company.com',
    assignee: 'Help Desk',
    slaStatus: 'on_track',
    slaTimeRemaining: 'Completed in 15m'
  },
  {
    id: 'INC-005',
    title: 'Storage array warning - low disk space',
    description: 'SAN array SAN-PROD-01 showing 85% capacity. Threshold alert triggered.',
    type: 'INCIDENT',
    priority: 'P2',
    status: 'IN_PROGRESS',
    ticket_type: 'Incident',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_by: 'monitoring.system@company.com',
    assignee: 'Storage Admin',
    slaStatus: 'at_risk',
    slaTimeRemaining: '1h 15m left',
    linkedCi: { id: 'san-prod-01', name: 'SAN-PROD-01', type: 'HOST', status: 'warning' }
  },
];

const ServiceDeskView: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tickets, setTickets] = useState<ExtendedTicket[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { isLoading, withLoading } = useEnhancedUX();
  
  // New state for tabs and views
  const [activeTab, setActiveTab] = useState('all');
  const [activeView, setActiveView] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState({
    priority: [] as string[],
    assignee: '',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
    slaStatus: [] as string[],
  });

  const handleTicketClick = (ticketId: string) => {
    navigate(`/app/service-desk/ticket/${ticketId}`);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    await withLoading(async () => {
      try {
        // Attempt to fetch real tickets from API
        const response = await apiClient.getTickets();
        
        // The API returns { data: Ticket[], count: number }
        const rawTickets = Array.isArray(response) ? response : (response as any)?.data || [];
        
        // Transform API data to ExtendedTicket format with UI-specific fields
        const extendedData = rawTickets.map((t: any) => {
          // Calculate SLA status based on ticket data
          let slaStatus: 'on_track' | 'at_risk' | 'breached' = 'on_track';
          let slaTimeRemaining = 'No SLA';
          
          if (t.sla_breach_at) {
            const breachTime = new Date(t.sla_breach_at);
            const now = new Date();
            const timeLeft = breachTime.getTime() - now.getTime();
            
            if (timeLeft < 0) {
              slaStatus = 'breached';
              const overdue = Math.abs(timeLeft);
              const hours = Math.floor(overdue / (1000 * 60 * 60));
              const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
              slaTimeRemaining = hours > 0 ? `${hours}h ${minutes}m overdue` : `${minutes}m overdue`;
            } else if (timeLeft < 60 * 60 * 1000) { // Less than 1 hour
              slaStatus = 'at_risk';
              const minutes = Math.floor(timeLeft / (1000 * 60));
              slaTimeRemaining = `${minutes}m left`;
            } else {
              slaStatus = 'on_track';
              const hours = Math.floor(timeLeft / (1000 * 60 * 60));
              const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
              slaTimeRemaining = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
            }
          }
          
          // Map ticket_type enum to display name
          const typeDisplayNames: Record<string, string> = {
            'INCIDENT': 'Incident',
            'PROBLEM': 'Problem', 
            'CHANGE': 'Change',
            'SERVICE_REQUEST': 'Service Request',
          };
          
          return {
            ...t,
            // Ensure ID is a string
            id: typeof t.id === 'object' ? `${t.id.tb}:${t.id.id?.String || t.id.id}` : t.id?.toString() || '',
            // Map to display-friendly ticket type
            ticket_type: typeDisplayNames[t.ticket_type] || t.ticket_type,
            // Preserve original type for filtering
            type: t.ticket_type,
            // Add SLA information
            slaStatus,
            slaTimeRemaining,
            // Add linked CI if related_asset exists
            linkedCi: t.related_asset ? {
              id: t.related_asset,
              name: t.related_asset,
              status: 'healthy' as const
            } : undefined,
          };
        }) as ExtendedTicket[];
        
        // If API returns data, use it; otherwise fall back to mock data
        if (extendedData.length > 0) {
          console.log(`Loaded ${extendedData.length} tickets from API`);
          setTickets(extendedData);
        } else {
          console.log('No tickets from API, using mock data for demo');
          setTickets(MOCK_TICKETS);
        }
      } catch (error) {
        console.error('Failed to load tickets from API, using mock data:', error);
        // Use mock data when API fails - this ensures the UI is always usable
        setTickets(MOCK_TICKETS);
      }
    });
  };

  const handleCreateIncident = async (data: CreateIncidentData) => {
    try {
      // Map CreateIncidentData to CreateTicketRequest
      const ticketRequest = {
        title: data.title,
        description: data.description,
        ticket_type: data.ticketType,
        priority: data.priority,
        assignee: data.assignee,
        related_asset: data.relatedAssetId,
        created_by: 'current_user', // TODO: Get from auth context
      };
      
      console.log('Creating ticket:', ticketRequest);
      await apiClient.createTicket(ticketRequest);
      
      // Reload tickets after creation to show the new ticket
      await loadTickets();
    } catch (error) {
      console.error('Failed to create ticket:', error);
      // Still reload to show mock data fallback if API fails
      await loadTickets();
      throw error; // Re-throw so the modal can show error state
    }
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

  // Calculate ticket counts per type
  const ticketCounts = useMemo(() => {
    return {
      all: tickets.length,
      incident: tickets.filter(t => t.ticket_type === 'Incident').length,
      service_request: tickets.filter(t => t.ticket_type === 'Service Request').length,
      problem: tickets.filter(t => t.ticket_type === 'Problem').length,
      change: tickets.filter(t => t.ticket_type === 'Change').length,
    };
  }, [tickets]);

  // Enhanced filtering with tabs and saved views
  const filteredTickets = useMemo(() => {
    let result = tickets;
    
    // Apply tab filter (ticket type)
    const activeTabConfig = TICKET_TYPE_TABS.find(tab => tab.id === activeTab);
    if (activeTabConfig?.filter) {
      result = result.filter(t => t.ticket_type === activeTabConfig.filter);
    }
    
    // Apply saved view filters
    const activeViewConfig = SAVED_VIEWS.find(v => v.id === activeView);
    if (activeViewConfig?.filters) {
      const viewFilters = activeViewConfig.filters;
      if (viewFilters.assignee === 'current_user') {
        result = result.filter(t => t.assignee); // Simplified - would check actual user
      } else if (viewFilters.assignee === null) {
        result = result.filter(t => !t.assignee);
      }
      if (viewFilters.priority) {
        result = result.filter(t => (viewFilters.priority as string[]).includes(t.priority.toString()));
      }
      if (viewFilters.slaStatus) {
        result = result.filter(t => t.slaStatus && (viewFilters.slaStatus as string[]).includes(t.slaStatus));
      }
      if (viewFilters.createdDate === 'today') {
        const today = new Date().toDateString();
        result = result.filter(t => new Date(t.created_at).toDateString() === today);
      }
    }
    
    // Apply advanced filters
    if (advancedFilters.priority.length > 0) {
      result = result.filter(t => advancedFilters.priority.includes(t.priority.toString()));
    }
    if (advancedFilters.slaStatus.length > 0) {
      result = result.filter(t => t.slaStatus && advancedFilters.slaStatus.includes(t.slaStatus));
    }
    if (advancedFilters.dateRange !== 'all') {
      const now = new Date();
      const ranges: Record<string, number> = { today: 1, week: 7, month: 30 };
      const daysAgo = ranges[advancedFilters.dateRange];
      result = result.filter(t => {
        const created = new Date(t.created_at);
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= daysAgo;
      });
    }
    
    // Apply search filter
    if (filter) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(filter.toLowerCase()) || 
        t.id?.toString().toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(t => 
        statusFilter === 'Resolved' 
          ? ['RESOLVED', 'CLOSED'].includes(t.status) 
          : t.status === statusFilter.toUpperCase().replace(' ', '_')
      );
    }
    
    return result;
  }, [tickets, activeTab, activeView, advancedFilters, filter, statusFilter]);

  // Kanban Columns
  const columns = [
    { id: 'NEW', title: 'New / Triage', color: 'border-l-4 border-blue-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-l-4 border-purple-500' },
    { id: 'WAITING', title: 'Waiting', color: 'border-l-4 border-yellow-500' },
    { id: 'RESOLVED', title: 'Resolved', color: 'border-l-4 border-green-500' }
  ];

  return (
    <div data-testid="service-desk-view" style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.xl }}>
        {/* Header Section */}
        <PageHeader
          icon={<TicketDiagonalRegular />}
          title="Service Desk"
          subtitle="Manage Incidents, Problems, and Change Requests"
          badge="ITIL v4 Aligned"
          badgeVariant="primary"
          actions={
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
          }
        />

        {/* KPI Cards (ServiceNow Killer Feature) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <KPICard 
            title="Open Incidents" 
            value={tickets.filter(t => t.status !== 'RESOLVED').length} 
            trend="+2 vs last period" 
            trendType="negative" 
            icon={<TicketDiagonalRegular />}
            color="#6B4CE6"
          />
          <KPICard 
            title="SLA Breaches" 
            value={tickets.filter(t => t.slaStatus === 'breached').length} 
            trend="-1 vs last period" 
            trendType="positive" 
            icon={<AlertRegular />}
            color="#ef4444"
          />
          <KPICard 
            title="Critical Assets" 
            value={3} 
            trend="0 unchanged" 
            trendType="neutral" 
            icon={<DesktopRegular />}
            color="#f59e0b"
          />
          <KPICard 
            title="Avg Resolution" 
            value="4.2h" 
            trend="-15m improved" 
            trendType="positive" 
            icon={<ClockRegular />}
            color="#10b981"
          />
        </div>

        {/* Ticket Type Tabs */}
        <div 
          className="purple-glass-card static"
          style={{ 
            display: 'flex', 
            gap: '4px',
            padding: '8px',
            marginBottom: '-8px'
          }}
        >
          {TICKET_TYPE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-tab ${activeTab === tab.id ? 'btn-tab-active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                background: activeTab === tab.id 
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'var(--tab-bg)',
                fontSize: '12px',
                color: activeTab === tab.id 
                  ? 'var(--primary)' 
                  : 'var(--text-primary)',
                fontWeight: 500,
              }}>
                {ticketCounts[tab.id as keyof typeof ticketCounts]}
              </span>
            </button>
          ))}
        </div>

        {/* Filters Toolbar with Saved Views */}
        <PurpleGlassCard glass style={{ padding: DesignTokens.spacing.md }}>
          <div style={{ display: 'flex', gap: DesignTokens.spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Saved Views Dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookmarkRegular style={{ color: 'var(--text-secondary)' }} />
              <PurpleGlassDropdown
                options={SAVED_VIEWS.map(v => ({ value: v.id, label: v.label }))}
                value={activeView}
                onChange={(val) => setActiveView(val as string)}
                glass="none"
              />
            </div>
            
            <div style={{ width: '1px', height: '24px', background: DesignTokens.colors.gray200 }} />
            
            <div style={{ flex: '1 1 300px', maxWidth: '400px', minWidth: '200px' }}>
              <PurpleGlassInput 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search tickets, assets, or people..."
                prefixIcon={<SearchRegular />}
                glass="none"
              />
            </div>
            <div style={{ width: '180px', flexShrink: 0 }}>
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
            
            {/* Active Filters Badge */}
            {(advancedFilters.priority.length > 0 || advancedFilters.slaStatus.length > 0 || advancedFilters.dateRange !== 'all') && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: DesignTokens.borderRadius.full,
                background: 'var(--status-info-bg)',
                color: 'var(--text-primary)',
                fontSize: DesignTokens.typography.xs,
                fontWeight: DesignTokens.typography.medium,
              }}>
                {advancedFilters.priority.length + advancedFilters.slaStatus.length + (advancedFilters.dateRange !== 'all' ? 1 : 0)} filters active
                <button
                  onClick={() => setAdvancedFilters({ priority: [], assignee: '', dateRange: 'all', slaStatus: [] })}
                  className="btn-clear"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <DismissRegular style={{ fontSize: '12px' }} />
                </button>
              </span>
            )}
            
            {/* Spacer pushes buttons to the right */}
            <div style={{ flex: 1 }} />
            
            <PurpleGlassButton 
              variant={showAdvancedFilters ? 'primary' : 'ghost'} 
              size="small" 
              icon={<FilterRegular />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              glass={showAdvancedFilters}
            >
              Filters
            </PurpleGlassButton>
            <PurpleGlassButton variant="ghost" size="small" icon={<ArrowExportRegular />}>Export</PurpleGlassButton>
          </div>
          
          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div style={{
              marginTop: DesignTokens.spacing.lg,
              paddingTop: DesignTokens.spacing.lg,
              borderTop: `1px solid ${DesignTokens.colors.gray200}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: DesignTokens.spacing.lg,
            }}>
              {/* Priority Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: DesignTokens.typography.xs, 
                  fontWeight: DesignTokens.typography.medium,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Priority
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {['P1', 'P2', 'P3', 'P4'].map(p => (
                    <PurpleGlassCheckbox
                      key={p}
                      checked={advancedFilters.priority.includes(p)}
                      onChange={(e) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          priority: e.target.checked 
                            ? [...prev.priority, p]
                            : prev.priority.filter(x => x !== p)
                        }));
                      }}
                      label={p === 'P1' ? 'P1 - Critical' : p === 'P2' ? 'P2 - High' : p === 'P3' ? 'P3 - Medium' : 'P4 - Low'}
                    />
                  ))}
                </div>
              </div>
              
              {/* SLA Status Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: DesignTokens.typography.xs, 
                  fontWeight: DesignTokens.typography.medium,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  SLA Status
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { value: 'on_track', label: 'On Track' },
                    { value: 'at_risk', label: 'At Risk' },
                    { value: 'breached', label: 'Breached' }
                  ].map(sla => (
                    <PurpleGlassCheckbox
                      key={sla.value}
                      checked={advancedFilters.slaStatus.includes(sla.value)}
                      onChange={(e) => {
                        setAdvancedFilters(prev => ({
                          ...prev,
                          slaStatus: e.target.checked 
                            ? [...prev.slaStatus, sla.value]
                            : prev.slaStatus.filter(x => x !== sla.value)
                        }));
                      }}
                      label={sla.label}
                    />
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: DesignTokens.typography.xs, 
                  fontWeight: DesignTokens.typography.medium,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Created
                </label>
                <PurpleGlassDropdown
                  options={[
                    { value: 'all', label: 'Any time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'Last 7 days' },
                    { value: 'month', label: 'Last 30 days' }
                  ]}
                  value={advancedFilters.dateRange}
                  onChange={(val) => setAdvancedFilters(prev => ({ ...prev, dateRange: val as 'all' | 'today' | 'week' | 'month' }))}
                  glass="none"
                />
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end' }}>
                <PurpleGlassButton 
                  variant="ghost" 
                  size="small"
                  onClick={() => setAdvancedFilters({ priority: [], assignee: '', dateRange: 'all', slaStatus: [] })}
                >
                  Clear All
                </PurpleGlassButton>
              </div>
            </div>
          )}
        </PurpleGlassCard>

        {/* Results Count */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: DesignTokens.typography.sm,
          color: 'var(--text-secondary)'
        }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredTickets.length}</strong> of {tickets.length} tickets
          </span>
        </div>

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
                <div key={col.id} className="purple-glass-card static" style={{
                  width: '320px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: DesignTokens.spacing.md,
                    fontWeight: DesignTokens.typography.semibold,
                    color: 'var(--text-primary)',
                    background: 'var(--card-bg-hover)',
                    borderBottom: '1px solid var(--card-border)',
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
                      color: 'var(--text-secondary)'
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

const KPICard: React.FC<{ 
  title: string; 
  value: string | number; 
  trend: string; 
  trendType: 'positive' | 'negative' | 'neutral'; 
  icon?: React.ReactNode;
  color?: string;
}> = ({ title, value, trend, trendType, icon, color = 'var(--brand-primary)' }) => (
  <div 
    className="purple-glass-card"
    style={{ 
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Icon */}
    {icon && (
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        fontSize: '20px',
      }}>
        {icon}
      </div>
    )}

    {/* Title */}
    <p style={{
      margin: 0,
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {title}
    </p>

    {/* Value */}
    <p style={{
      margin: '8px 0 0 0',
      fontSize: '32px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      fontFamily: 'var(--lcm-font-family-heading, Poppins, sans-serif)',
    }}>
      {value}
    </p>

    {/* Trend */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '8px',
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: 500,
        color: trendType === 'positive' ? 'var(--status-success)' : 
               trendType === 'negative' ? 'var(--status-critical)' : 
               'var(--text-muted)',
      }}>
        {trend}
      </span>
    </div>
  </div>
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
        <h3 style={{ fontWeight: DesignTokens.typography.medium, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
          {ticket.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: DesignTokens.typography.xs, marginTop: '2px', color: 'var(--text-secondary)' }}>
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
        color: 'var(--text-primary)',
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
          background: 'var(--btn-secondary-bg)',
          color: 'var(--text-secondary)'
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
        borderTop: '1px solid var(--card-border)'
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
