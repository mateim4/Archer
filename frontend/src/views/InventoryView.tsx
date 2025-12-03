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
  InfoRegular,
  TagRegular,
  ArrowTrendingLinesRegular,
  AddRegular
} from '@fluentui/react-icons';
import { apiClient, Asset } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { purplePalette } from '../styles/design-tokens';

const InventoryView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filter, setFilter] = useState('');
  const { withLoading } = useEnhancedUX();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    await withLoading(async () => {
      try {
        const data = await apiClient.getAssets();
        setAssets(data);
        if (data.length > 0) setSelectedAsset(data[0]);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    });
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

  return (
    <GlassmorphicLayout>
      <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Inventory (CMDB)</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Single Source of Truth for Infrastructure Assets</p>
          </div>
          <PurpleGlassButton variant="primary" icon={<AddRegular />} glass>Add Asset</PurpleGlassButton>
        </div>

        {/* Main Split View */}
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Left Pane: Asset Tree / List */}
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
                      <h3 
                        className="font-medium truncate"
                        style={{ color: 'var(--colorNeutralForeground1, #ffffff)' }}
                      >
                        {asset.name}
                      </h3>
                      <p 
                        className="text-xs"
                        style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))' }}
                      >
                        {asset.asset_type} • {asset.external_id || 'No ID'}
                      </p>
                    </div>
                    <ChevronRightRegular style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.3))' }} />
                  </div>
                </PurpleGlassCard>
              ))}
            </div>
          </div>

          {/* Right Pane: Asset 360 Dashboard */}
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
            {selectedAsset ? (
              <>
                {/* Top Stats Card */}
                <PurpleGlassCard glass className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl text-2xl"
                        style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          color: getStatusColor(selectedAsset.status || 'HEALTHY') 
                        }}
                      >
                        {getAssetIcon(selectedAsset.asset_type)}
                      </div>
                      <div>
                        <h2 
                          className="text-2xl font-bold"
                          style={{ color: 'var(--colorNeutralForeground1, #ffffff)' }}
                        >
                          {selectedAsset.name}
                        </h2>
                        <div 
                          className="flex items-center gap-2 text-sm mt-1"
                          style={{ color: 'var(--colorNeutralForeground2, rgba(255,255,255,0.6))' }}
                        >
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              background: 'rgba(255,255,255,0.1)', 
                              color: getStatusColor(selectedAsset.status || 'HEALTHY') 
                            }}
                          >
                            {selectedAsset.status || 'UNKNOWN'}
                          </span>
                          <span>•</span>
                          <span>{selectedAsset.asset_type}</span>
                          <span>•</span>
                          <span className="font-mono">{selectedAsset.id}</span>
                        </div>
                      </div>
                    </div>
                    <PurpleGlassButton variant="secondary" size="small">Edit Asset</PurpleGlassButton>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <StatBox label="Uptime" value="99.9%" icon={<ArrowTrendingLinesRegular />} />
                    <StatBox label="Open Tickets" value="0" icon={<TagRegular />} />
                    <StatBox label="Last Scan" value="2m ago" icon={<InfoRegular />} />
                  </div>
                </PurpleGlassCard>

                {/* Details & Relationships Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Raw Data / Specs */}
                  <PurpleGlassCard glass header="Specifications" className="h-full">
                    <div className="p-4 space-y-3">
                      {selectedAsset.raw_data ? (
                        Object.entries(selectedAsset.raw_data).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{key.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{String(value)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="italic" style={{ color: 'var(--text-muted)' }}>No specification data available.</div>
                      )}
                    </div>
                  </PurpleGlassCard>

                  {/* Relationships (Mocked for now) */}
                  <PurpleGlassCard glass header="Relationships" className="h-full">
                    <div className="p-4 space-y-4">
                      <RelationshipItem type="Parent" name="Datacenter-01" icon={<CubeRegular />} />
                      <RelationshipItem type="Connected To" name="Switch-Core-A" icon={<RouterRegular />} />
                      <RelationshipItem type="Hosting" name="12 VMs" icon={<DesktopRegular />} />
                    </div>
                  </PurpleGlassCard>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                Select an asset to view details
              </div>
            )}
          </div>

        </div>
      </div>
    </GlassmorphicLayout>
  );
};

const StatBox: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <PurpleGlassCard glass variant="subtle" className="p-3">
    <div className="flex items-center gap-3">
      <div style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))' }}>{icon}</div>
      <div>
        <div 
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))' }}
        >
          {label}
        </div>
        <div 
          className="font-bold text-lg"
          style={{ color: 'var(--colorNeutralForeground1, #ffffff)' }}
        >
          {value}
        </div>
      </div>
    </div>
  </PurpleGlassCard>
);

const RelationshipItem: React.FC<{ type: string; name: string; icon: React.ReactNode }> = ({ type, name, icon }) => (
  <div 
    className="flex items-center gap-3 p-2 rounded transition-colors cursor-pointer"
    style={{ background: 'transparent' }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ color: 'var(--colorNeutralForeground2, rgba(255,255,255,0.6))' }}>{icon}</div>
    <div className="flex-1">
      <div 
        className="font-medium"
        style={{ color: 'var(--colorNeutralForeground1, #ffffff)' }}
      >
        {name}
      </div>
      <div 
        className="text-xs"
        style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.4))' }}
      >
        {type}
      </div>
    </div>
    <ChevronRightRegular style={{ color: 'var(--colorNeutralForeground3, rgba(255,255,255,0.2))' }} />
  </div>
);

export default InventoryView;
