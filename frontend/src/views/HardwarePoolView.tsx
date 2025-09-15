import React, { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { HardwareAsset, AssetStatus } from '../store/useAppStore';
import HardwareAssetForm from '../components/HardwareAssetForm';
import GlassmorphicLayout from '../components/GlassmorphicLayout';

const HardwarePoolView: React.FC = () => {
  const {
    hardwarePoolAssets,
    listHardwareAssets,
    createHardwareAsset,
    updateHardwareAsset,
    deleteHardwareAsset,
    loading,
    error
  } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<HardwareAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'All'>('All');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('All');

  useEffect(() => {
    listHardwareAssets();
  }, [listHardwareAssets]);

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
      case 'Decommissioned': return '#6b7280';
      default: return '#6366f1';
    }
  };

  if (loading && hardwarePoolAssets.length === 0) {
    return (
      <div style={{ 
        padding: '40px',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        margin: '20px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          fontSize: '18px',
          color: '#6366f1',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          🔄 Loading hardware assets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        margin: '20px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          color: '#ef4444',
          fontSize: '16px',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          ❌ Error: {error}
        </div>
      </div>
    );
  }

  return (
    <GlassmorphicLayout>
      {/* Header */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '2px solid rgba(99, 102, 241, 0.1)',
        paddingBottom: '16px'
      }}>
        <h1 style={{ 
          fontSize: '28px',
          fontWeight: '600',
          color: '#6366f1',
          margin: 0,
          fontFamily: 'Montserrat, sans-serif'
        }}>
          🔧 Hardware Pool
        </h1>
        
        <button
          onClick={handleCreate}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Montserrat, sans-serif'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ color: 'white' }}>+</span> Add Hardware Asset
        </button>
      </div>

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
          <input
            type="text"
            placeholder="🔍 Search assets by name, manufacturer, model, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              background: 'rgba(255, 255, 255, 0.8)',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'All')}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              background: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
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
              width: '100%',
              padding: '12px',
              border: '2px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Montserrat, sans-serif',
              background: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer'
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
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All');
              setManufacturerFilter('All');
            }}
            style={{
              padding: '12px 16px',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              background: 'transparent',
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: 'Montserrat, sans-serif'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🧹 Clear Filters
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: '8px',
        border: '2px solid rgba(99, 102, 241, 0.1)'
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
            color: '#6366f1',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            📊 Showing {filteredAssets.length} of {hardwarePoolAssets.length} assets
            {(searchTerm || statusFilter !== 'All' || manufacturerFilter !== 'All') && (
              <span style={{ color: '#8b5cf6', marginLeft: '8px' }}>
                (filtered)
              </span>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            <span style={{ color: '#10b981' }}>
              🟢 Available: {filteredAssets.filter(a => a.status === 'Available').length}
            </span>
            <span style={{ color: '#f59e0b' }}>
              🟡 In Use: {filteredAssets.filter(a => a.status === 'InUse').length}
            </span>
            <span style={{ color: '#ef4444' }}>
              🔴 Locked: {filteredAssets.filter(a => a.status === 'Locked').length}
            </span>
            <span style={{ color: '#8b5cf6' }}>
              🔧 Maintenance: {filteredAssets.filter(a => a.status === 'Maintenance').length}
            </span>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      {hardwarePoolAssets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '16px',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>�</div>
          No hardware assets found. Add your first asset to get started!
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))'
              }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Manufacturer</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Model</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>CPU Cores</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Memory (GB)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Storage (GB)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Location</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6366f1' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr key={asset.id} style={{ 
                  borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                  background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(99, 102, 241, 0.02)'
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
                      <button
                        onClick={() => handleEdit(asset)}
                        style={{
                          background: '#6366f1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#5046e5'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                      >
                        Delete
                      </button>
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>
            {hardwarePoolAssets.filter(a => a.status === 'Available').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Available Assets</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>
            {hardwarePoolAssets.filter(a => a.status === 'InUse').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>In Use</div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#6366f1' }}>
            {hardwarePoolAssets.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Assets</div>
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
