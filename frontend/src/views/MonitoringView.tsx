import React, { useState, useEffect } from 'react';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput,
  CreateIncidentModal,
  LinkedAssetBadge,
  AlertContext,
  CreateIncidentData,
  PageHeader
} from '../components/ui';
import { 
  SearchRegular,
  ServerRegular,
  DesktopRegular,
  RouterRegular,
  CubeRegular,
  ChevronRightRegular,
  ErrorCircleRegular,
  WarningRegular,
  CheckmarkCircleRegular,
  ArrowClockwiseRegular,
  TicketDiagonalRegular,
  AddRegular,
  DataPieRegular,
  OrganizationRegular,
  InfoRegular,
  PulseRegular,
  DataAreaRegular,
  CheckmarkRegular
} from '@fluentui/react-icons';
import { VisxAreaChart, VisxLineChart } from '../components/charts';
import { ParentSize } from '@visx/responsive';
import { apiClient, Asset, AssetMetrics, DashboardSummary, Alert } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { purplePalette } from '../styles/design-tokens';
import { InfraVisualizerCanvas } from '@/components/infra-visualizer';
import { useInfraVisualizerStore } from '@/stores/useInfraVisualizerStore';
import { DesignTokens } from '../styles/designSystem';
import CapacityVisualizerView from './CapacityVisualizerView';

type MonitoringTab = 'metrics' | 'topology' | 'capacity';

const MonitoringView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [metrics, setMetrics] = useState<AssetMetrics | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [filter, setFilter] = useState('');
  const [isCreateIncidentOpen, setCreateIncidentOpen] = useState(false);
  const [selectedAlertContext, setSelectedAlertContext] = useState<AlertContext | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<MonitoringTab>('metrics');
  const { withLoading } = useEnhancedUX();
  
  // Infrastructure visualizer store
  const { selectedNodeId, selectNode, clearSelection } = useInfraVisualizerStore();

  useEffect(() => {
    loadData();
    loadAlerts();
    const interval = setInterval(() => {
      loadData();
      loadAlerts();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      loadMetrics(selectedAsset.id);
    }
  }, []);

  const loadData = async () => {
    try {
      const [assetsData, summaryData] = await Promise.all([
        apiClient.getAssets(),
        apiClient.getDashboardSummary()
      ]);
      setAssets(assetsData);
      setSummary(summaryData);
      if (!selectedAsset && assetsData.length > 0) {
        setSelectedAsset(assetsData[0]);
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await apiClient.getAlerts({ 
        status: ['Active', 'Acknowledged'],
        page: 0,
        page_size: 50
      });
      setAlerts(response.alerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadMetrics = async (assetId: string) => {
    try {
      const data = await apiClient.getAssetMetrics(assetId);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleCreateIncidentFromAlert = (alert: Alert) => {
    const alertContext: AlertContext = {
      alertId: alert.id || '',
      alertType: alert.severity.toLowerCase() as 'critical' | 'warning' | 'info',
      message: alert.title,
      assetId: alert.affected_ci_id,
      assetName: alert.affected_ci_id, // TODO: Look up asset name
      assetType: 'CLUSTER', // TODO: Look up from affected CI
      timestamp: alert.created_at,
      metricName: alert.metric_name,
      metricValue: alert.metric_value?.toString(),
      threshold: alert.threshold?.toString(),
    };
    setSelectedAlertContext(alertContext);
    setCreateIncidentOpen(true);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient.acknowledgeAlert(alertId);
      await loadAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await apiClient.resolveAlert(alertId);
      await loadAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleIncidentCreated = async (data: CreateIncidentData) => {
    console.log('Creating incident from alert:', data);
    if (data.triggeredByAlertId) {
      try {
        await apiClient.createTicketFromAlert(data.triggeredByAlertId, {
          assignee: data.assignee,
          additional_notes: data.description
        });
        await loadAlerts(); // Refresh to show ticket link
      } catch (error) {
        console.error('Failed to create ticket from alert:', error);
      }
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'CLUSTER': return <CubeRegular />;
      case 'HOST': return <ServerRegular />;
      case 'VM': return <DesktopRegular />;
      case 'SWITCH': return <RouterRegular />;
      default: return <CubeRegular />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'CRITICAL': return purplePalette.error;
      case 'WARNING': return purplePalette.warning;
      case 'HEALTHY': return purplePalette.success;
      default: return purplePalette.gray400;
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(filter.toLowerCase()) || 
    a.asset_type.toLowerCase().includes(filter.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', overflow: 'visible' }}>
      <div className="h-full flex flex-col space-y-6 overflow-hidden">
        {/* Header & Summary */}
        <PageHeader
          icon={<PulseRegular />}
          title="Monitoring Dashboard"
          subtitle="Real-time Infrastructure Health & Performance"
          actions={
            <div className="flex gap-4">
              <SummaryCard 
                label="Critical Alerts" 
                value={summary?.critical_alerts || 0} 
                color={purplePalette.error} 
                icon={<ErrorCircleRegular />} 
              />
              <SummaryCard 
                label="Warnings" 
                value={summary?.warning_alerts || 0} 
                color={purplePalette.warning} 
                icon={<WarningRegular />} 
              />
              <SummaryCard 
                label="Avg Health" 
                value={`${summary?.avg_cluster_health || 0}%`} 
                color={purplePalette.success} 
                icon={<CheckmarkCircleRegular />} 
              />
            </div>
          }
        >
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid var(--card-border)',
            marginTop: '24px'
          }}>
            <TabButton
              isActive={activeTab === 'metrics'}
              onClick={() => setActiveTab('metrics')}
              icon={<DataPieRegular />}
              label="Metrics & Alerts"
            />
            <TabButton
              isActive={activeTab === 'topology'}
              onClick={() => setActiveTab('topology')}
              icon={<OrganizationRegular />}
              label="Infrastructure Topology"
            />
            <TabButton
              isActive={activeTab === 'capacity'}
              onClick={() => setActiveTab('capacity')}
              icon={<DataAreaRegular />}
              label="Capacity Visualizer"
            />
          </div>
        </PageHeader>

        {/* Tab Content */}
        {activeTab === 'metrics' ? (
          <>
            {/* Main Split View */}
            <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Left Pane: Asset List */}
          <div className="w-1/3 flex flex-col gap-4">
            <PurpleGlassCard glass className="p-3 shrink-0">
              <PurpleGlassInput 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search assets..."
                prefixIcon={<SearchRegular />}
                glass="none"
              />
            </PurpleGlassCard>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredAssets.map(asset => (
                <PurpleGlassCard 
                  key={asset.id}
                  glass
                  variant={selectedAsset?.id === asset.id ? 'elevated' : 'interactive'}
                  onClick={() => setSelectedAsset(asset)}
                  className="p-3 cursor-pointer"
                  style={{
                    borderColor: selectedAsset?.id === asset.id ? `${purplePalette.purple500}80` : undefined,
                    background: selectedAsset?.id === asset.id ? `${purplePalette.purple500}20` : undefined
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-md"
                      style={{ 
                        background: 'var(--btn-secondary-bg)', 
                        color: getStatusColor(asset.status || 'HEALTHY') 
                      }}
                    >
                      {getAssetIcon(asset.asset_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 
                          className="font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {asset.name}
                        </h3>
                        <span 
                          className="text-xs font-bold"
                          style={{ color: getStatusColor(asset.status || 'HEALTHY') }}
                        >
                          {asset.status}
                        </span>
                      </div>
                      <p 
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {asset.asset_type}
                      </p>
                    </div>
                    <ChevronRightRegular style={{ color: 'var(--text-muted)' }} />
                  </div>
                </PurpleGlassCard>
              ))}
            </div>
          </div>

          {/* Right Pane: Charts */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
            {selectedAsset && metrics ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {getAssetIcon(selectedAsset.asset_type)}
                    {selectedAsset.name} Metrics
                  </h2>
                  <PurpleGlassButton 
                    size="small" 
                    variant="secondary" 
                    icon={<ArrowClockwiseRegular />}
                    onClick={() => loadMetrics(selectedAsset.id)}
                  >
                    Refresh
                  </PurpleGlassButton>
                </div>

                <PurpleGlassCard glass header="CPU Usage (%)" className="h-64">
                  <div className="w-full h-full p-4">
                    <ParentSize>
                      {({ width, height }) => (
                        <VisxAreaChart
                          data={metrics.cpu_usage}
                          width={width}
                          height={Math.max(height - 20, 150)}
                          showGrid
                          showLine
                          colorScheme={['#8b5cf6']}
                        />
                      )}
                    </ParentSize>
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass header="Memory Usage (%)" className="h-64">
                  <div className="w-full h-full p-4">
                    <ParentSize>
                      {({ width, height }) => (
                        <VisxAreaChart
                          data={metrics.memory_usage}
                          width={width}
                          height={Math.max(height - 20, 150)}
                          showGrid
                          showLine
                          colorScheme={['#10b981']}
                        />
                      )}
                    </ParentSize>
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass header="Network Throughput (Mbps)" className="h-64">
                  <div className="w-full h-full p-4">
                    <ParentSize>
                      {({ width, height }) => (
                        <VisxLineChart
                          data={metrics.network_throughput}
                          width={width}
                          height={Math.max(height - 20, 150)}
                          showGrid
                          showDots={false}
                          colorScheme={['#f59e0b']}
                        />
                      )}
                    </ParentSize>
                  </div>
                </PurpleGlassCard>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                {assets.length === 0 ? 'No assets found' : 'Select an asset to view metrics'}
              </div>
            )}
          </div>

          </div>

            {/* Alert Feed Section */}
            <PurpleGlassCard glass header="Active Alerts" className="shrink-0">
              <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No active alerts
                  </div>
                ) : (
                  alerts.map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onCreateIncident={() => handleCreateIncidentFromAlert(alert)}
                      onAcknowledge={() => handleAcknowledgeAlert(alert.id!)}
                      onResolve={() => handleResolveAlert(alert.id!)}
                    />
                  ))
                )}
              </div>
            </PurpleGlassCard>
          </>
        ) : activeTab === 'topology' ? (
          /* Topology Tab Content */
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Topology View with Infrastructure Visualizer */}
            <div className="purple-glass-card static flex-1 relative rounded-lg overflow-hidden" style={{ 
              minHeight: '500px'
            }}>
              <InfraVisualizerCanvas
                showToolbar={true}
                showControls={true}
                showMinimap={true}
                showFilterPanel={false}
                showLegend={true}
                readOnly={false}
              />
              
              {/* Selected Node Details Panel */}
              {selectedNodeId && (
                <NodeDetailsPanel 
                  nodeId={selectedNodeId} 
                  assets={assets}
                  onClose={clearSelection}
                />
              )}
            </div>

            {/* Quick Stats for Topology */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
              <TopologyStatCard 
                label="Clusters" 
                value={assets.filter(a => a.asset_type === 'CLUSTER').length}
                icon={<CubeRegular />}
                color={purplePalette.purple500}
              />
              <TopologyStatCard 
                label="Hosts" 
                value={assets.filter(a => a.asset_type === 'HOST').length}
                icon={<ServerRegular />}
                color={purplePalette.info}
              />
              <TopologyStatCard 
                label="VMs" 
                value={assets.filter(a => a.asset_type === 'VM').length}
                icon={<DesktopRegular />}
                color={purplePalette.success}
              />
              <TopologyStatCard 
                label="Switches" 
                value={assets.filter(a => a.asset_type === 'SWITCH').length}
                icon={<RouterRegular />}
                color={purplePalette.warning}
              />
            </div>
          </div>
        ) : (
          /* Capacity Visualizer Tab Content */
          <div className="flex-1 min-h-0 -mx-6 -mb-6">
            <CapacityVisualizerView embedded />
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={() => {
          setCreateIncidentOpen(false);
          setSelectedAlertContext(null);
        }}
        onSubmit={handleIncidentCreated}
        alertContext={selectedAlertContext || undefined}
      />
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  isActive, onClick, icon, label 
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: isActive 
        ? `linear-gradient(135deg, ${DesignTokens.colors.primary}15 0%, ${DesignTokens.colors.primary}08 100%)`
        : 'transparent',
      border: 'none',
      borderBottom: isActive 
        ? `2px solid ${DesignTokens.colors.primary}`
        : '2px solid transparent',
      borderRadius: '8px 8px 0 0',
      cursor: 'pointer',
      color: isActive 
        ? DesignTokens.colors.primary 
        : 'var(--text-secondary)',
      fontWeight: isActive 
        ? DesignTokens.typography.semibold 
        : DesignTokens.typography.medium,
      fontSize: DesignTokens.typography.sm,
      fontFamily: DesignTokens.typography.fontFamily,
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Topology Stat Card
const TopologyStatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ 
  label, value, icon, color 
}) => (
  <div style={{ 
    padding: DesignTokens.spacing.md, 
    border: '1px solid var(--card-border)',
    borderRadius: DesignTokens.borderRadius.lg,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    <div style={{ color, fontSize: '24px' }}>{icon}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  </div>
);

// Node Details Panel - shows on node selection in topology view
const NodeDetailsPanel: React.FC<{ nodeId: string; assets: Asset[]; onClose: () => void }> = ({ 
  nodeId, assets, onClose 
}) => {
  const asset = assets.find(a => a.id === nodeId || a.name === nodeId);
  
  if (!asset) return null;
  
  return (
    <div 
      className="purple-glass-card static"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '320px',
        zIndex: 100,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--card-border)',
        background: 'var(--card-bg-hover)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <InfoRegular style={{ color: DesignTokens.colors.primary }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Asset Details</span>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '18px',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>
      
      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px', 
          fontWeight: 600,
          color: 'var(--text-primary)' 
        }}>
          {asset.name}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <DetailRow label="Type" value={asset.asset_type} />
          <DetailRow label="Status" value={asset.status || 'Unknown'} />
          {asset.external_id && <DetailRow label="External ID" value={asset.external_id} />}
          {asset.created_at && <DetailRow label="Created" value={new Date(asset.created_at).toLocaleDateString()} />}
        </div>
        
        {/* Action Button */}
        <div style={{ marginTop: '16px' }}>
          <PurpleGlassButton 
            variant="secondary" 
            size="small"
            style={{ width: '100%' }}
            onClick={() => window.location.href = `/app/inventory/asset/${asset.id}`}
          >
            View Full Details
          </PurpleGlassButton>
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
  </div>
);

const SummaryCard: React.FC<{ label: string; value: string | number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <PurpleGlassCard glass variant="subtle" className="p-4 min-w-[160px]">
    <div className="flex items-center gap-4">
      <div className="text-2xl" style={{ color }}>{icon}</div>
      <div>
        <div 
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </div>
        <div 
          className="font-bold text-xl"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </div>
      </div>
    </div>
  </PurpleGlassCard>
);

// Alert Card Component with actions
const AlertCard: React.FC<{ 
  alert: Alert; 
  onCreateIncident: () => void;
  onAcknowledge: () => void;
  onResolve: () => void;
}> = ({ alert, onCreateIncident, onAcknowledge, onResolve }) => {
  const getSeverityColor = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical': return purplePalette.error;
      case 'high': return purplePalette.warning;
      case 'medium': return purplePalette.info;
      case 'low': return purplePalette.success;
      case 'info': return purplePalette.gray400;
      default: return purplePalette.gray400;
    }
  };

  const getSeverityIcon = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical': return <ErrorCircleRegular />;
      case 'high': return <WarningRegular />;
      case 'medium': return <InfoRegular />;
      case 'low': return <CheckmarkCircleRegular />;
      case 'info': return <InfoRegular />;
      default: return <WarningRegular />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isActive = alert.status === 'Active';
  const isAcknowledged = alert.status === 'Acknowledged';

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '8px',
        background: `${getSeverityColor(alert.severity)}10`,
        border: `1px solid ${getSeverityColor(alert.severity)}20`,
      }}
    >
      <div 
        style={{ 
          color: getSeverityColor(alert.severity),
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {getSeverityIcon(alert.severity)}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div 
          style={{ 
            fontWeight: 500,
            color: 'var(--colorNeutralForeground1, #ffffff)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {alert.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          {alert.affected_ci_id && (
            <LinkedAssetBadge
              assetId={alert.affected_ci_id}
              assetName={alert.affected_ci_id}
              assetType="CLUSTER"
              status={alert.severity === 'Critical' ? 'critical' : alert.severity === 'High' ? 'warning' : 'healthy'}
              size="small"
              showChevron={false}
            />
          )}
          <span 
            style={{ 
              fontSize: '11px',
              color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))',
            }}
          >
            {formatTimeAgo(alert.created_at)}
          </span>
          {isAcknowledged && (
            <span 
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: `${purplePalette.info}20`,
                color: purplePalette.info,
                fontWeight: 500,
              }}
            >
              Acknowledged
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {isActive && (
          <PurpleGlassButton
            variant="secondary"
            size="small"
            icon={<CheckmarkRegular />}
            onClick={onAcknowledge}
            title="Acknowledge Alert"
          >
            Ack
          </PurpleGlassButton>
        )}
        {(isActive || isAcknowledged) && !alert.auto_ticket_id && (
          <PurpleGlassButton
            variant="secondary"
            size="small"
            icon={<TicketDiagonalRegular />}
            onClick={onCreateIncident}
            title="Create Incident from Alert"
          >
            Ticket
          </PurpleGlassButton>
        )}
        {(isActive || isAcknowledged) && (
          <PurpleGlassButton
            variant="secondary"
            size="small"
            icon={<CheckmarkCircleRegular />}
            onClick={onResolve}
            title="Resolve Alert"
          >
            Resolve
          </PurpleGlassButton>
        )}
        {alert.auto_ticket_id && (
          <span 
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: `${purplePalette.success}20`,
              color: purplePalette.success,
              fontWeight: 500,
            }}
          >
            Ticket Created
          </span>
        )}
      </div>
    </div>
  );
};

export default MonitoringView;
