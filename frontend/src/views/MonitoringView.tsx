import React, { useState, useEffect } from 'react';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput
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
  ArrowClockwiseRegular
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

const MonitoringView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [metrics, setMetrics] = useState<AssetMetrics | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [filter, setFilter] = useState('');
  const { withLoading } = useEnhancedUX();

  useEffect(() => {
    loadData();
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
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Monitoring Dashboard</h1>
            <p className="text-white/60 text-sm">Real-time Infrastructure Health & Performance</p>
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
                        background: 'rgba(255,255,255,0.05)', 
                        color: getStatusColor(asset.status || 'HEALTHY') 
                      }}
                    >
                      {getAssetIcon(asset.asset_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 
                          className="font-medium truncate"
                          style={{ color: 'var(--colorNeutralForeground1, #ffffff)' }}
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
                        style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))' }}
                      >
                        {asset.asset_type}
                      </p>
                    </div>
                    <ChevronRightRegular style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.3))' }} />
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
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
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
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime} 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime} 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={formatTime} 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
                          labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Line type="monotone" dataKey="value" stroke="#ffc658" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </PurpleGlassCard>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/40">
                {assets.length === 0 ? 'No assets found' : 'Select an asset to view metrics'}
              </div>
            )}
          </div>

        </div>
      </div>
    </GlassmorphicLayout>
  );
};

const SummaryCard: React.FC<{ label: string; value: string | number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <PurpleGlassCard glass variant="subtle" className="p-4 min-w-[160px]">
    <div className="flex items-center gap-4">
      <div className="text-2xl" style={{ color }}>{icon}</div>
      <div>
        <div 
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))' }}
        >
          {label}
        </div>
        <div 
          className="font-bold text-xl"
          style={{ color: 'var(--colorNeutralForeground1, #ffffff)' }}
        >
          {value}
        </div>
      </div>
    </div>
  </PurpleGlassCard>
);

export default MonitoringView;
