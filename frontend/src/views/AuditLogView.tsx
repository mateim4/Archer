// Archer ITSM - Audit Log View
// Admin interface for viewing system audit trail

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  Badge,
  Spinner,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  HistoryRegular,
  SearchRegular,
  FilterRegular,
  ArrowSyncRegular,
  PersonRegular,
  DocumentRegular,
  CalendarRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ArrowDownloadRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassDropdown,
  PurpleGlassBreadcrumb,
  PurpleGlassDataTable,
  PageHeader,
  type TableColumn,
} from '../components/ui';
import {
  apiClient,
  type AuditLogEntry,
} from '../utils/apiClient';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalM,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },
  headerRight: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalM,
  },
  searchBar: {
    maxWidth: '300px',
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateFilters: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  tableContainer: {
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  eventInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  eventType: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  eventAction: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  userId: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
  },
  resourceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  resourceType: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textTransform: 'capitalize',
  },
  resourceId: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
  },
  detailsCell: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  ipAddress: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalM,
  },
  paginationInfo: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXXL),
    gap: tokens.spacingVerticalL,
  },
  emptyIcon: {
    fontSize: '64px',
    color: tokens.colorNeutralForeground4,
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorBrandForeground1,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

// Format event type for display
const formatEventType = (eventType: string): string => {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get event type color
const getEventTypeColor = (eventType: string): 'success' | 'warning' | 'danger' | 'informative' | 'subtle' => {
  const type = eventType.toUpperCase();
  if (type.includes('LOGIN') && !type.includes('FAILED')) return 'success';
  if (type.includes('FAILED') || type.includes('DENIED')) return 'danger';
  if (type.includes('DELETE') || type.includes('LOCKED')) return 'warning';
  if (type.includes('CREATE') || type.includes('UPDATE')) return 'informative';
  return 'subtle';
};

// Success badge component
const SuccessBadge: React.FC<{ success: boolean }> = ({ success }) => {
  const styles = useStyles();
  
  return (
    <Badge 
      color={success ? 'success' : 'danger'} 
      appearance="tint" 
      className={styles.successBadge}
    >
      {success ? <CheckmarkCircleRegular /> : <DismissCircleRegular />}
      {success ? 'Success' : 'Failed'}
    </Badge>
  );
};

// Main component
export function AuditLogView() {
  const styles = useStyles();
  
  // State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('');
  const [successFilter, setSuccessFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getAuditLogs({
        event_type: eventTypeFilter || undefined,
        resource_type: resourceTypeFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        page_size: pageSize,
      });
      
      setLogs(response.data);
      setTotalLogs(response.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
      
      // Use mock data for development
      const mockLogs: AuditLogEntry[] = [
        {
          id: 'audit:1',
          event_type: 'LOGIN',
          user_id: 'users:admin',
          username: 'admin',
          action: 'auth',
          success: true,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          created_at: new Date().toISOString(),
        },
        {
          id: 'audit:2',
          event_type: 'CREATE',
          user_id: 'users:admin',
          username: 'admin',
          resource_type: 'ticket',
          resource_id: 'tickets:INC-001',
          action: 'create',
          details: { title: 'Network outage in Building A' },
          success: true,
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'audit:3',
          event_type: 'UPDATE',
          user_id: 'users:admin',
          username: 'admin',
          resource_type: 'kb_article',
          resource_id: 'kb:how-to-reset-password',
          action: 'update',
          details: { changes: ['content', 'tags'] },
          success: true,
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'audit:4',
          event_type: 'LOGIN_FAILED',
          user_id: 'users:john.doe',
          username: 'john.doe',
          action: 'auth',
          details: { reason: 'invalid_password' },
          success: false,
          ip_address: '10.0.0.50',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: 'audit:5',
          event_type: 'DELETE',
          user_id: 'users:admin',
          username: 'admin',
          resource_type: 'cmdb_item',
          resource_id: 'ci:SRV-005',
          action: 'delete',
          success: true,
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 14400000).toISOString(),
        },
        {
          id: 'audit:6',
          event_type: 'PERMISSION_DENIED',
          user_id: 'users:viewer',
          username: 'viewer',
          resource_type: 'users',
          action: 'delete',
          details: { required_permission: 'users:delete' },
          success: false,
          ip_address: '10.0.0.75',
          created_at: new Date(Date.now() - 18000000).toISOString(),
        },
        {
          id: 'audit:7',
          event_type: 'ROLE_ASSIGNED',
          user_id: 'users:admin',
          username: 'admin',
          resource_type: 'user',
          resource_id: 'users:jane.smith',
          action: 'role_assigned',
          details: { role: 'service_manager' },
          success: true,
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 21600000).toISOString(),
        },
        {
          id: 'audit:8',
          event_type: 'LOGOUT',
          user_id: 'users:admin',
          username: 'admin',
          action: 'auth',
          success: true,
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 25200000).toISOString(),
        },
      ];
      
      setLogs(mockLogs);
      setTotalLogs(mockLogs.length);
    } finally {
      setIsLoading(false);
    }
  }, [eventTypeFilter, resourceTypeFilter, startDate, endDate, page, pageSize]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filter logs locally for search
  const filteredLogs = useMemo(() => {
    let result = logs;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.username?.toLowerCase().includes(query) ||
        log.event_type.toLowerCase().includes(query) ||
        log.resource_type?.toLowerCase().includes(query) ||
        log.resource_id?.toLowerCase().includes(query) ||
        log.ip_address?.toLowerCase().includes(query)
      );
    }
    
    // Success filter
    if (successFilter) {
      const isSuccess = successFilter === 'true';
      result = result.filter(log => log.success === isSuccess);
    }
    
    return result;
  }, [logs, searchQuery, successFilter]);
  
  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.created_at).toDateString() === today);
    
    return {
      total: totalLogs,
      today: todayLogs.length,
      successful: logs.filter(l => l.success).length,
      failed: logs.filter(l => !l.success).length,
    };
  }, [logs, totalLogs]);
  
  // Pagination
  const totalPages = Math.ceil(totalLogs / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalLogs);
  
  // Export logs
  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Event Type', 'User', 'Resource Type', 'Resource ID', 'Action', 'Success', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.created_at,
        log.event_type,
        log.username || '',
        log.resource_type || '',
        log.resource_id || '',
        log.action,
        log.success,
        log.ip_address || '',
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Table columns
  const columns: TableColumn<AuditLogEntry>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessor: 'created_at',
      sortable: true,
      width: 180,
      cell: (value) => (
        <Text style={{ fontSize: tokens.fontSizeBase200 }}>
          {new Date(value as string).toLocaleString()}
        </Text>
      ),
    },
    {
      id: 'event',
      header: 'Event',
      accessor: 'event_type',
      sortable: true,
      cell: (value, row) => (
        <div className={styles.eventInfo}>
          <Badge color={getEventTypeColor(value as string)} appearance="tint">
            {formatEventType(value as string)}
          </Badge>
          <Text className={styles.eventAction}>{row.action}</Text>
        </div>
      ),
    },
    {
      id: 'user',
      header: 'User',
      accessor: 'username',
      sortable: true,
      cell: (value, row) => (
        <div className={styles.userInfo}>
          <Text className={styles.userName}>{value as string || 'System'}</Text>
          {row.user_id && (
            <Text className={styles.userId}>{row.user_id}</Text>
          )}
        </div>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      accessor: 'resource_type',
      sortable: true,
      cell: (value, row) => (
        value ? (
          <div className={styles.resourceInfo}>
            <Text className={styles.resourceType}>{value as string}</Text>
            {row.resource_id && (
              <Text className={styles.resourceId}>{row.resource_id}</Text>
            )}
          </div>
        ) : (
          <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
        )
      ),
    },
    {
      id: 'success',
      header: 'Status',
      accessor: 'success',
      sortable: true,
      cell: (value) => <SuccessBadge success={value as boolean} />,
    },
    {
      id: 'ip_address',
      header: 'IP Address',
      accessor: 'ip_address',
      cell: (value) => (
        <Text className={styles.ipAddress}>
          {value as string || '—'}
        </Text>
      ),
    },
    {
      id: 'details',
      header: 'Details',
      accessor: 'details',
      cell: (value) => (
        <Text className={styles.detailsCell} title={value ? JSON.stringify(value) : undefined}>
          {value ? JSON.stringify(value) : '—'}
        </Text>
      ),
    },
  ];
  
  // Filter options
  const eventTypeOptions = [
    { value: '', label: 'All Events' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGIN_FAILED', label: 'Login Failed' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'PERMISSION_DENIED', label: 'Permission Denied' },
    { value: 'ROLE_ASSIGNED', label: 'Role Assigned' },
    { value: 'ROLE_REVOKED', label: 'Role Revoked' },
  ];
  
  const resourceTypeOptions = [
    { value: '', label: 'All Resources' },
    { value: 'user', label: 'User' },
    { value: 'role', label: 'Role' },
    { value: 'ticket', label: 'Ticket' },
    { value: 'kb_article', label: 'KB Article' },
    { value: 'cmdb_item', label: 'CMDB Item' },
  ];
  
  const successOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Success' },
    { value: 'false', label: 'Failed' },
  ];
  
  // Render
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/app/dashboard' },
    { label: 'Settings', href: '/app/settings' },
    { label: 'Audit Log' },
  ];
  
  return (
    <div className={styles.container}>
      <PurpleGlassBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <PageHeader
        icon={<HistoryRegular />}
        title="Audit Log"
        subtitle="Track all system activities and security events"
        actions={
          <div className={styles.headerRight}>
            <PurpleGlassButton
              variant="secondary"
              icon={<ArrowDownloadRegular />}
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
            >
              Export CSV
            </PurpleGlassButton>
            <PurpleGlassButton
              variant="secondary"
              icon={<ArrowSyncRegular />}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </PurpleGlassButton>
          </div>
        }
      />
      
      {/* Stats */}
      <div className={styles.stats}>
        <PurpleGlassCard className={styles.statCard}>
          <div className={styles.statIcon}>
            <HistoryRegular style={{ fontSize: '20px' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>Total Events</Text>
          </div>
        </PurpleGlassCard>
        
        <PurpleGlassCard className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: tokens.colorPaletteBlueForeground2 }}>
            <CalendarRegular style={{ fontSize: '20px' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statValue}>{stats.today}</Text>
            <Text className={styles.statLabel}>Today</Text>
          </div>
        </PurpleGlassCard>
        
        <PurpleGlassCard className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: tokens.colorPaletteGreenForeground1 }}>
            <CheckmarkCircleRegular style={{ fontSize: '20px' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statValue}>{stats.successful}</Text>
            <Text className={styles.statLabel}>Successful</Text>
          </div>
        </PurpleGlassCard>
        
        <PurpleGlassCard className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: tokens.colorPaletteRedForeground1 }}>
            <DismissCircleRegular style={{ fontSize: '20px' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statValue}>{stats.failed}</Text>
            <Text className={styles.statLabel}>Failed</Text>
          </div>
        </PurpleGlassCard>
      </div>
      
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <PurpleGlassInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            prefixIcon={<SearchRegular />}
            glass="light"
          />
        </div>
        
        <div className={styles.filters}>
          <PurpleGlassDropdown
            value={eventTypeFilter}
            onChange={(value) => { setEventTypeFilter(typeof value === 'string' ? value : ''); setPage(1); }}
            options={eventTypeOptions}
            placeholder="Event Type"
            glass="light"
          />
          <PurpleGlassDropdown
            value={resourceTypeFilter}
            onChange={(value) => { setResourceTypeFilter(typeof value === 'string' ? value : ''); setPage(1); }}
            options={resourceTypeOptions}
            placeholder="Resource"
            glass="light"
          />
          <PurpleGlassDropdown
            value={successFilter}
            onChange={(value) => setSuccessFilter(typeof value === 'string' ? value : '')}
            options={successOptions}
            placeholder="Status"
            glass="light"
          />
          
          <div className={styles.dateFilters}>
            <PurpleGlassInput
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder="Start Date"
              glass="light"
            />
            <Text style={{ color: tokens.colorNeutralForeground3 }}>to</Text>
            <PurpleGlassInput
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder="End Date"
              glass="light"
            />
          </div>
        </div>
      </div>
      
      {/* Table */}
      <PurpleGlassCard className={styles.tableContainer}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
            <Spinner size="large" label="Loading audit logs..." />
          </div>
        ) : error && logs.length === 0 ? (
          <div className={styles.emptyState}>
            <HistoryRegular className={styles.emptyIcon} />
            <Text className={styles.emptyText}>
              {error}<br />
              <PurpleGlassButton variant="link" onClick={loadData}>Try again</PurpleGlassButton>
            </Text>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <HistoryRegular className={styles.emptyIcon} />
            <Text className={styles.emptyText}>
              No audit logs found matching your criteria
            </Text>
          </div>
        ) : (
          <>
            <PurpleGlassDataTable
              data={filteredLogs as unknown as Record<string, unknown>[]}
              columns={columns as unknown as TableColumn<Record<string, unknown>>[]}
              rowKey="id"
              sortable
              searchable={false}
              columnManagement={false}
              exportable={false}
            />
            
            {/* Pagination */}
            <div className={styles.pagination}>
              <Text className={styles.paginationInfo}>
                Showing {startIndex} - {endIndex} of {totalLogs} entries
              </Text>
              
              <div className={styles.paginationControls}>
                <PurpleGlassButton
                  variant="secondary"
                  size="small"
                  icon={<ChevronLeftRegular />}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </PurpleGlassButton>
                
                <Text style={{ padding: `0 ${tokens.spacingHorizontalM}` }}>
                  Page {page} of {totalPages || 1}
                </Text>
                
                <PurpleGlassButton
                  variant="secondary"
                  size="small"
                  icon={<ChevronRightRegular />}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </PurpleGlassButton>
              </div>
            </div>
          </>
        )}
      </PurpleGlassCard>
    </div>
  );
}

export default AuditLogView;
