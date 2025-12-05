import React, { useState, useEffect } from 'react';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput,
  CreateIncidentModal,
  LinkedAssetBadge,
  AlertContext,
  CreateIncidentData
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
  DataAreaRegular
} from '@fluentui/react-icons';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { apiClient, Asset, AssetMetrics, DashboardSummary } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { purplePalette } from '../styles/design-tokens';
import { MonitoringAlert, getMockAlerts } from '../utils/mockMonitoringData';
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
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [activeTab, setActiveTab] = useState<MonitoringTab>('metrics');
  const { withLoading } = useEnhancedUX();
  
  // Infrastructure visualizer store
  const { selectedNodeId, selectNode, clearSelection } = useInfraVisualizerStore();

  useEffect(() => {
    loadData();
    // Load mock alerts from external data source
    setAlerts(getMockAlerts());
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      loadMetrics(selectedAsset.id);
    }
  }, [selectedAsset]);

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

  const loadMetrics = async (assetId: string) => {
    try {
      const data = await apiClient.getAssetMetrics(assetId);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleCreateIncidentFromAlert = (alert: MonitoringAlert) => {
    const alertContext: AlertContext = {
      alertId: alert.id,
      alertType: alert.severity,
      message: alert.message,
      assetId: alert.assetId,
      assetName: alert.assetName,
      assetType: alert.assetType,
      timestamp: alert.timestamp,
      metricName: alert.metricName,
      metricValue: alert.metricValue,
      threshold: alert.threshold,
    };
    setSelectedAlertContext(alertContext);
    setCreateIncidentOpen(true);
  };

  const handleIncidentCreated = async (data: CreateIncidentData) => {
    console.log('Creating incident from alert:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // Mark alert as having incident created
    if (data.triggeredByAlertId) {
      setAlerts(prev => prev.map(a => 
        a.id === data.triggeredByAlertId 
          ? { ...a, incidentCreated: true }
          : a
      ));
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
    <GlassmorphicLayout>
      <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
        {/* Header & Summary */}
        <div className="flex justify-between items-end shrink-0">
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
              <PulseRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
              Monitoring Dashboard
            </h1>
            <p style={{ 
              margin: '8px 0 0 0',
              fontSize: '16px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)'
            }}>Real-time Infrastructure Health & Performance</p>
          </div>
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
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          borderBottom: '1px solid var(--card-border)',
          marginBottom: '-8px'
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
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.cpu_usage}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime} 
                          stroke="var(--text-muted)" 
                          tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                        />
                        <YAxis 
                          stroke="var(--text-muted)" 
                          tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                          labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass header="Memory Usage (%)" className="h-64">
                  <div className="w-full h-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.memory_usage}>
                        <defs>
                          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime} 
                          stroke="var(--text-muted)" 
                          tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                        />
                        <YAxis 
                          stroke="var(--text-muted)" 
                          tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                          labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMem)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </PurpleGlassCard>

                <PurpleGlassCard glass header="Network Throughput (Mbps)" className="h-64">
                  <div className="w-full h-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.network_throughput}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime} 
                          stroke="var(--text-muted)" 
                          tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                        />
                        <YAxis 
                          stroke="var(--text-muted)" 
                          tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                          labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Line type="monotone" dataKey="value" stroke="#ffc658" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
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
    </GlassmorphicLayout>
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
    <div>
      <div style={{ fontWeight: 600, fontSize: '20px', color: 'var(--text-primary)' }}>{value}</div>
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

// Alert Card Component for one-click incident creation
const AlertCard: React.FC<{ alert: MonitoringAlert; onCreateIncident: () => void }> = ({ alert, onCreateIncident }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return purplePalette.error;
      case 'warning': return purplePalette.warning;
      case 'info': return purplePalette.info;
      default: return purplePalette.gray400;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorCircleRegular />;
      case 'warning': return <WarningRegular />;
      case 'info': return <CheckmarkCircleRegular />;
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
          {alert.message}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <LinkedAssetBadge
            assetId={alert.assetId}
            assetName={alert.assetName}
            assetType={alert.assetType}
            status={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'healthy'}
            size="small"
            showChevron={false}
          />
          <span 
            style={{ 
              fontSize: '11px',
              color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))',
            }}
          >
            {formatTimeAgo(alert.timestamp)}
          </span>
        </div>
      </div>

      {!alert.incidentCreated ? (
        <PurpleGlassButton
          variant="secondary"
          size="small"
          icon={<TicketDiagonalRegular />}
          onClick={onCreateIncident}
          title="Create Incident from Alert"
        >
          Create Incident
        </PurpleGlassButton>
      ) : (
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
          Incident Created
        </span>
      )}
    </div>
  );
};

export default MonitoringView;
