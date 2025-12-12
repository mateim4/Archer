import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput,
  PageHeader,
  PageHeaderSkeleton,
  PurpleGlassSkeleton
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
  AddRegular,
  OpenRegular,
  DatabaseRegular
} from '@fluentui/react-icons';
import { apiClient, Asset } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';
import { purplePalette } from '../styles/design-tokens';

const InventoryView: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { withLoading } = useEnhancedUX();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAssets();
      setAssets(data);
      if (data.length > 0) setSelectedAsset(data[0]);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
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

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
        <PageHeaderSkeleton showActions={true} actionCount={1} />
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
          {/* Left sidebar skeleton */}
          <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <PurpleGlassSkeleton variant="card" height="52px" />
            <PurpleGlassSkeleton variant="card" height="80px" count={5} />
          </div>
          {/* Right content skeleton */}
          <div style={{ flex: 1 }}>
            <PurpleGlassSkeleton variant="card" height="200px" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
              <PurpleGlassSkeleton variant="card" height="250px" />
              <PurpleGlassSkeleton variant="card" height="250px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
      {/* Header - Dashboard Style */}
      <PageHeader
        icon={<DatabaseRegular style={{ fontSize: '32px' }} />}
        title="Inventory (CMDB)"
        subtitle="Single Source of Truth for Infrastructure Assets"
        actions={
          <PurpleGlassButton variant="primary" icon={<AddRegular />} glass>
            Add Asset
          </PurpleGlassButton>
        }
      />

      {/* Main Split View */}
      <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
        
        {/* Left Pane: Asset Tree / List */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          <PurpleGlassCard glass style={{ padding: '12px' }}>
            <PurpleGlassInput 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search assets..."
              prefixIcon={<SearchRegular />}
              glass="none"
            />
          </PurpleGlassCard>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
            {filteredAssets.map(asset => (
              <PurpleGlassCard 
                key={asset.id}
                glass
                variant={selectedAsset?.id === asset.id ? 'elevated' : 'interactive'}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderColor: selectedAsset?.id === asset.id ? `${purplePalette.purple500}80` : undefined,
                  background: selectedAsset?.id === asset.id ? `${purplePalette.purple500}20` : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{ 
                      padding: '8px',
                      borderRadius: '6px',
                      background: 'var(--btn-secondary-bg)', 
                      color: getStatusColor(asset.status || 'HEALTHY') 
                    }}
                  >
                    {getAssetIcon(asset.asset_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 
                      style={{ 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-primary)',
                        margin: 0
                      }}
                    >
                      {asset.name}
                    </h3>
                    <p 
                      style={{ 
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: '4px 0 0 0'
                      }}
                    >
                      {asset.asset_type} • {asset.external_id || 'No ID'}
                    </p>
                  </div>
                  <ChevronRightRegular style={{ color: 'var(--text-muted)' }} />
                </div>
              </PurpleGlassCard>
            ))}
          </div>
        </div>

        {/* Right Pane: Asset 360 Dashboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingRight: '8px' }}>
          {selectedAsset ? (
            <>
              {/* Top Stats Card */}
              <PurpleGlassCard glass style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div 
                      style={{ 
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '24px',
                        background: 'var(--btn-secondary-bg)', 
                        color: getStatusColor(selectedAsset.status || 'HEALTHY') 
                      }}
                    >
                      {getAssetIcon(selectedAsset.asset_type)}
                    </div>
                    <div>
                      <h2 
                        style={{ 
                          fontSize: '24px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          margin: 0
                        }}
                      >
                        {selectedAsset.name}
                      </h2>
                      <div 
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          marginTop: '4px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <span 
                          style={{ 
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: 'var(--btn-secondary-bg)', 
                            color: getStatusColor(selectedAsset.status || 'HEALTHY') 
                          }}
                        >
                          {selectedAsset.status || 'UNKNOWN'}
                        </span>
                        <span>•</span>
                        <span>{selectedAsset.asset_type}</span>
                        <span>•</span>
                        <span style={{ fontFamily: 'monospace' }}>{selectedAsset.id}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <PurpleGlassButton 
                      variant="primary" 
                      size="small"
                      onClick={() => navigate(`/app/inventory/asset/${selectedAsset.id}`)}
                    >
                      <OpenRegular style={{ marginRight: '4px' }} /> View Details
                    </PurpleGlassButton>
                    <PurpleGlassButton variant="secondary" size="small">Edit Asset</PurpleGlassButton>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <StatBox label="Uptime" value="99.9%" icon={<ArrowTrendingLinesRegular />} />
                    <StatBox label="Open Tickets" value="0" icon={<TagRegular />} />
                    <StatBox label="Last Scan" value="2m ago" icon={<InfoRegular />} />
                  </div>
                </PurpleGlassCard>

                {/* Details & Relationships Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  {/* Raw Data / Specs */}
                  <PurpleGlassCard glass header="Specifications" style={{ height: '100%' }}>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedAsset.raw_data ? (
                        Object.entries(selectedAsset.raw_data).map(([key, value]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace(/_/g, ' ')}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-primary)' }}>{String(value)}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No specification data available.</div>
                      )}
                    </div>
                  </PurpleGlassCard>

                  {/* Relationships (Mocked for now) */}
                  <PurpleGlassCard glass header="Relationships" style={{ height: '100%' }}>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <RelationshipItem type="Parent" name="Datacenter-01" icon={<CubeRegular />} />
                      <RelationshipItem type="Connected To" name="Switch-Core-A" icon={<RouterRegular />} />
                      <RelationshipItem type="Hosting" name="12 VMs" icon={<DesktopRegular />} />
                    </div>
                  </PurpleGlassCard>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select an asset to view details
              </div>
            )}
          </div>

        </div>
      </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <PurpleGlassCard glass variant="subtle" style={{ padding: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      <div>
        <div 
          style={{ 
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)'
          }}
        >
          {label}
        </div>
        <div 
          style={{ 
            fontWeight: 700,
            fontSize: '18px',
            color: 'var(--text-primary)'
          }}
        >
          {value}
        </div>
      </div>
    </div>
  </PurpleGlassCard>
);

const RelationshipItem: React.FC<{ type: string; name: string; icon: React.ReactNode }> = ({ type, name, icon }) => (
  <div 
    style={{ 
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px',
      borderRadius: '6px',
      cursor: 'pointer',
      background: 'transparent',
      transition: 'background 0.15s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-bg-hover)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div 
        style={{ 
          fontWeight: 500,
          color: 'var(--text-primary)'
        }}
      >
        {name}
      </div>
      <div 
        style={{ 
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        {type}
      </div>
    </div>
    <ChevronRightRegular style={{ color: 'var(--text-muted)' }} />
  </div>
);

export default InventoryView;
