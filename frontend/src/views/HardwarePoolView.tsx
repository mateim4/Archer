import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { HardwareAsset, AssetStatus } from '../store/useAppStore';
import HardwareAssetForm from '../components/HardwareAssetForm';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import { DESIGN_TOKENS } from '../components/DesignSystem';
import { DesignTokens } from '../styles/designSystem';
import {
  ArrowClockwiseRegular,
  ErrorCircleRegular,
  WrenchRegular,
  ServerRegular,
  SearchRegular,
  BroomRegular,
  DataBarHorizontalRegular,
  CircleRegular,
  AddRegular,
  ArrowUploadRegular,
  DiagramRegular
} from '@fluentui/react-icons';
import { PurpleGlassButton, PurpleGlassCard, PrimaryButton } from '../components/ui';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { useNavigate } from 'react-router-dom';

const HardwarePoolView: React.FC = () => {
  const navigate = useNavigate();
  const {
    hardwarePoolAssets,
    listHardwareAssets,
    createHardwareAsset,
    updateHardwareAsset,
    deleteHardwareAsset,
    uploadRvToolsReport,
    fetchRvToolsUploads,
    rvToolsLoading,
    latestRvToolsUpload,
    rvToolsUploads,
    loading,
    error
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<HardwareAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'All'>('All');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listHardwareAssets();
  }, [listHardwareAssets]);

  useEffect(() => {
    void fetchRvToolsUploads();
  }, [fetchRvToolsUploads]);

  const handleRvToolsImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleRvToolsFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      await uploadRvToolsReport(file);
      await listHardwareAssets();
    } finally {
      event.target.value = '';
    }
  };

  const handleVisualizeInfrastructure = () => {
    navigate('/app/tools/infra-visualizer');
  };

  // Filter and search logic
  const filteredAssets = useMemo(() => {
    let filtered = hardwarePoolAssets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        (asset.name && asset.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.manufacturer && asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    // Manufacturer filter
    if (manufacturerFilter !== 'All') {
      filtered = filtered.filter(asset => asset.manufacturer === manufacturerFilter);
    }

    return filtered;
  }, [hardwarePoolAssets, searchTerm, statusFilter, manufacturerFilter]);

  // Get unique manufacturers for filter
  const uniqueManufacturers = useMemo(() => {
    const manufacturers = Array.from(new Set(hardwarePoolAssets.map(asset => asset.manufacturer)));
    return manufacturers.sort();
  }, [hardwarePoolAssets]);

  const handleCreate = () => {
    setEditingAsset(null);
    setShowForm(true);
  };

  const handleEdit = (asset: HardwareAsset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteHardwareAsset(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return '#10b981';
      case 'InUse': return '#f59e0b';
      case 'Locked': return '#ef4444';
      case 'Maintenance': return '#8b5cf6';
      case 'Decommissioned': return 'var(--text-secondary)';
      default: return '#6366f1';
    }
  };

  if (loading && hardwarePoolAssets.length === 0) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{ 
          fontSize: DesignTokens.typography.lg,
          color: DesignTokens.colors.primary,
          fontFamily: DesignTokens.typography.fontFamily,
          textAlign: 'center'
        }}>
          <ArrowClockwiseRegular style={{ marginRight: '8px' }} />Loading hardware assets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{ 
          color: DesignTokens.colors.error,
          fontSize: DesignTokens.typography.base,
          fontFamily: DesignTokens.typography.fontFamily
        }}>
          <ErrorCircleRegular style={{ marginRight: '8px' }} />Error: {error}
        </div>
      </div>
    );
  }

  return (
    <GlassmorphicLayout style={{
      ...DesignTokens.components.pageContainer,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      backdropFilter: 'none'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px',
        borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
        paddingBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <ServerRegular style={{ fontSize: '32px', color: 'var(--text-primary)' }} />
          <h1 style={{ 
            fontSize: DesignTokens.typography.xxxl,
            fontWeight: DesignTokens.typography.semibold,
            color: DesignTokens.colors.primary,
            margin: '0',
            fontFamily: DesignTokens.typography.fontFamily
          }}>
            Inventory
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: DesignTokens.colors.gray600,
          margin: 0,
          fontFamily: DesignTokens.typography.fontFamily,
          paddingLeft: '44px'
        }}>
          Track and allocate hardware assets
        </p>
      </div>
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xl,
        gap: DesignTokens.spacing.md
      }}>
        <div style={{ display: 'flex', gap: DesignTokens.spacing.sm }}>
          <PurpleGlassButton
            variant="primary"
            glass
            icon={<AddRegular />}
            onClick={handleCreate}
          >
            Add Hardware Asset
          </PurpleGlassButton>
          <PurpleGlassButton
            variant="secondary"
            glass
            icon={<ArrowUploadRegular />}
            loading={rvToolsLoading}
            onClick={handleRvToolsImportClick}
          >
            Import from RVTools
          </PurpleGlassButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleRvToolsFileChange}
            style={{ display: 'none' }}
          />
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: DesignTokens.typography.fontFamily }}>
          {rvToolsUploads.length > 0 ? `${rvToolsUploads.length} RVTools uploads processed` : 'Upload RVTools CSV or XLSX exports to populate the inventory.'}
        </div>
      </div>

      {latestRvToolsUpload && (
        <PurpleGlassCard
          variant="elevated"
          glass
          padding="large"
          header="Latest RVTools Import"
          style={{ marginBottom: DesignTokens.spacing.lg }}
        >
          <div style={{ display: 'grid', gap: DesignTokens.spacing.sm }}>
            <div style={{ fontSize: DesignTokens.typography.lg, fontWeight: DesignTokens.typography.semibold, color: 'var(--text-primary)' }}>
              Added {latestRvToolsUpload.serversAddedToPool} of {latestRvToolsUpload.serversProcessed} servers
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: DesignTokens.typography.sm }}>
              Upload ID: {latestRvToolsUpload.uploadId} · Processed at {new Date(latestRvToolsUpload.uploadTimestamp).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: DesignTokens.spacing.lg, flexWrap: 'wrap' }}>
              <div>
                <strong>Total CPU:</strong> {latestRvToolsUpload.summary.totalCpuCores} cores
              </div>
              <div>
                <strong>Total Memory:</strong> {latestRvToolsUpload.summary.totalMemoryGb} GB
              </div>
              <div>
                <strong>Vendors:</strong> {latestRvToolsUpload.summary.uniqueVendors.join(', ') || 'n/a'}
              </div>
            </div>
            {latestRvToolsUpload.processingErrors.length > 0 && (
              <div>
                <div style={{ fontWeight: DesignTokens.typography.medium, color: DesignTokens.colors.error, marginBottom: DesignTokens.spacing.xs }}>
                  Processing Issues ({latestRvToolsUpload.processingErrors.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: DesignTokens.spacing.lg, color: DesignTokens.colors.gray600, fontSize: DesignTokens.typography.sm }}>
                  {latestRvToolsUpload.processingErrors.slice(0, 3).map((issue, index) => (
                    <li key={`${issue.serverName}-${issue.lineNumber}-${index}`}>
                      Line {issue.lineNumber}: {issue.serverName} – {issue.error}
                    </li>
                  ))}
                  {latestRvToolsUpload.processingErrors.length > 3 && (
                    <li>…and {latestRvToolsUpload.processingErrors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            <div style={{ color: 'var(--text-secondary)', fontSize: DesignTokens.typography.sm }}>
              Recommendations: {latestRvToolsUpload.summary.deploymentRecommendations.join('; ') || 'No recommendations generated'}
            </div>
            <div style={{ marginTop: DesignTokens.spacing.md }}>
              <PurpleGlassButton
                variant="primary"
                size="medium"
                icon={<DiagramRegular />}
                onClick={handleVisualizeInfrastructure}
              >
                Visualize Infrastructure
              </PurpleGlassButton>
            </div>
          </div>
        </PurpleGlassCard>
      )}

      {rvToolsUploads.length > 0 && (
        <PurpleGlassCard
          variant="default"
          glass
          padding="medium"
          header="RVTools Import History"
          style={{ marginBottom: DesignTokens.spacing.xl }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontFamily: DesignTokens.typography.fontFamily,
                fontSize: DesignTokens.typography.sm,
                color: 'var(--text-primary)'
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: DesignTokens.spacing.sm }}>File</th>
                  <th style={{ padding: DesignTokens.spacing.sm }}>Status</th>
                  <th style={{ padding: DesignTokens.spacing.sm }}>Processed</th>
                  <th style={{ padding: DesignTokens.spacing.sm }}>Uploaded</th>
                  <th style={{ padding: DesignTokens.spacing.sm }}>Processed</th>
                </tr>
              </thead>
              <tbody>
                {rvToolsUploads.slice(0, 5).map(upload => (
                  <tr key={upload.id} style={{ borderTop: `1px solid ${DesignTokens.colors.gray200}` }}>
                    <td style={{ padding: DesignTokens.spacing.sm, fontWeight: DesignTokens.typography.medium }}>
                      {upload.fileName}
                    </td>
                    <td style={{ padding: DesignTokens.spacing.sm, textTransform: 'capitalize' }}>
                      {upload.status}
                    </td>
                    <td style={{ padding: DesignTokens.spacing.sm }}>
                      {upload.totalHosts ?? 0} hosts · {upload.totalVms ?? 0} VMs
                    </td>
                    <td style={{ padding: DesignTokens.spacing.sm }}>
                      {new Date(upload.uploadedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: DesignTokens.spacing.sm }}>
                      {upload.processedAt ? new Date(upload.processedAt).toLocaleString() : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PurpleGlassCard>
      )}

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search Input */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          <GlassmorphicSearchBar
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search assets by name, manufacturer, model, or location..."
            width="100%"
          />
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'All')}
            style={{
              ...DesignTokens.components.standardCard,
              padding: '14px 20px',
              fontSize: '14px',
              fontFamily: 'Oxanium, sans-serif',
              cursor: 'pointer',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="InUse">In Use</option>
            <option value="Locked">Locked</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Decommissioned">Decommissioned</option>
          </select>
        </div>

        {/* Manufacturer Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
            style={{
              ...DesignTokens.components.standardCard,
              padding: '14px 20px',
              fontSize: '14px',
              fontFamily: 'Oxanium, sans-serif',
              cursor: 'pointer',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          >
            <option value="All">All Manufacturers</option>
            {uniqueManufacturers.map(manufacturer => (
              <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || statusFilter !== 'All' || manufacturerFilter !== 'All') && (
          <PurpleGlassButton
            variant="secondary"
            size="medium"
            icon={<BroomRegular />}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setManufacturerFilter('All');
            }}
            glass
          >
            Clear Filters
          </PurpleGlassButton>
        )}
      </div>

      {/* Results Summary */}
      <div style={{
        ...DesignTokens.components.standardCard,
        marginBottom: '20px',
        cursor: 'default'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: DesignTokens.colorVariants.indigo.base,
            fontFamily: 'Oxanium, sans-serif'
          }}>
            <DataBarHorizontalRegular style={{ marginRight: '8px' }} />Showing {filteredAssets.length} of {hardwarePoolAssets.length} assets
            {(searchTerm || statusFilter !== 'All' || manufacturerFilter !== 'All') && (
              <span style={{ color: DesignTokens.colors.primary, marginLeft: '8px' }}>
                (filtered)
              </span>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            fontFamily: 'Oxanium, sans-serif'
          }}>
            <span style={{ color: DesignTokens.colors.success }}>
              <CircleRegular style={{ marginRight: '4px', color: DesignTokens.colors.success }} />Available: {filteredAssets.filter(a => a.status === 'Available').length}
            </span>
            <span style={{ color: DesignTokens.colors.warning }}>
              <CircleRegular style={{ marginRight: '4px', color: DesignTokens.colors.warning }} />In Use: {filteredAssets.filter(a => a.status === 'InUse').length}
            </span>
            <span style={{ color: DesignTokens.colors.error }}>
              <CircleRegular style={{ marginRight: '4px', color: DesignTokens.colors.error }} />Locked: {filteredAssets.filter(a => a.status === 'Locked').length}
            </span>
            <span style={{ color: DesignTokens.colors.primary }}>
              <WrenchRegular style={{ marginRight: '4px', color: DesignTokens.colors.primary }} />Maintenance: {filteredAssets.filter(a => a.status === 'Maintenance').length}
            </span>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      {hardwarePoolAssets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-secondary)',
          fontSize: '16px',
          fontFamily: 'Oxanium, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>�</div>
          No hardware assets found. Add your first asset to get started!
        </div>
      ) : (
        <div style={{ 
          ...DesignTokens.components.standardCard,
          overflowX: 'auto',
          cursor: 'default',
          padding: 0
        }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Oxanium, sans-serif'
          }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
              }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Manufacturer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Model</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>CPU Cores</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Memory (GB)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Storage (GB)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Location</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr key={asset.id} style={{ 
                  borderBottom: '1px solid rgba(99, 102, 241, 0.1)'
                }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{asset.name}</td>
                  <td style={{ padding: '12px' }}>{asset.manufacturer}</td>
                  <td style={{ padding: '12px' }}>{asset.model}</td>
                  <td style={{ padding: '12px' }}>{asset.cpu_cores}</td>
                  <td style={{ padding: '12px' }}>{asset.memory_gb}</td>
                  <td style={{ padding: '12px' }}>{asset.storage_capacity_gb}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: getStatusColor(asset.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {asset.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{asset.location}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <PurpleGlassButton
                        variant="primary"
                        size="small"
                        onClick={() => handleEdit(asset)}
                        glass
                      >
                        Edit
                      </PurpleGlassButton>
                      <PurpleGlassButton
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(asset.id)}
                        glass
                      >
                        Delete
                      </PurpleGlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ 
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          ...DesignTokens.components.standardCard,
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: DesignTokens.colors.success }}>
            {hardwarePoolAssets.filter(a => a.status === 'Available').length}
          </div>
          <div style={{ fontSize: '14px', color: DesignTokens.colors.gray600 }}>Available Assets</div>
        </div>
        
        <div style={{
          ...DesignTokens.components.standardCard,
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: DesignTokens.colors.warning }}>
            {hardwarePoolAssets.filter(a => a.status === 'InUse').length}
          </div>
          <div style={{ fontSize: '14px', color: DesignTokens.colors.gray600 }}>In Use</div>
        </div>
        
        <div style={{
          ...DesignTokens.components.standardCard,
          textAlign: 'center',
          cursor: 'default'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: DesignTokens.colorVariants.indigo.base }}>
            {hardwarePoolAssets.length}
          </div>
          <div style={{ fontSize: '14px', color: DesignTokens.colors.gray600 }}>Total Assets</div>
        </div>
      </div>

      {/* Hardware Asset Form Modal */}
      <HardwareAssetForm
        asset={editingAsset}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAsset(null);
        }}
        onSubmit={(assetData) => {
          if (editingAsset) {
            // For update, we need the full asset object
            updateHardwareAsset({
              ...editingAsset,
              ...assetData,
              updated_at: new Date().toISOString()
            });
          } else {
            // For create, we need all required fields
            createHardwareAsset({
              name: assetData.name || '',
              manufacturer: assetData.manufacturer || '',
              model: assetData.model || '',
              cpu_cores: assetData.cpu_cores || 0,
              memory_gb: assetData.memory_gb || 0,
              storage_capacity_gb: assetData.storage_capacity_gb || 0,
              status: assetData.status || 'Available' as AssetStatus,
              location: assetData.location || ''
            });
          }
        }}
      />
    </GlassmorphicLayout>
  );
};

export default HardwarePoolView;
