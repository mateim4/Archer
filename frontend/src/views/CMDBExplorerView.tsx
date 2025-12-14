import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassDropdown,
  PurpleGlassSpinner,
  PurpleGlassEmptyState,
  PurpleGlassCheckbox,
  PageHeader,
  EnhancedPurpleGlassSearchBar,
} from '../components/ui';
import {
  SearchRegular,
  AddRegular,
  FilterRegular,
  ServerRegular,
  DatabaseRegular,
  CloudRegular,
  AppsRegular,
  DocumentRegular,
  ArrowSyncRegular,
  DeleteRegular,
  EditRegular,
  EyeRegular,
} from '@fluentui/react-icons';
import * as cmdbClient from '../api/cmdbClient';
import type {
  ConfigurationItem,
  CIClass,
  CIStatus,
  CICriticality,
  CIListResponse,
} from '../api/cmdbClient';
import { FluentTokens } from '../design-system/tokens';

const CMDBExplorerView: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [cis, setCis] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<CIClass | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<CIStatus | ''>('');
  const [selectedCriticality, setSelectedCriticality] = useState<CICriticality | ''>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  
  // Selected items for bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load CIs
  const loadCIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: cmdbClient.CISearchRequest = {
        page: currentPage,
        page_size: pageSize,
      };

      if (searchQuery) params.query = searchQuery;
      if (selectedClass) params.ci_class = selectedClass;
      if (selectedStatus) params.status = [selectedStatus];
      if (selectedCriticality) params.criticality = [selectedCriticality];
      if (selectedEnvironment) params.environment = selectedEnvironment;

      const response = await cmdbClient.listCIs(params);
      setCis(response.items);
      setTotalCount(response.total);
    } catch (err) {
      console.error('Failed to load CIs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration items');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedClass, selectedStatus, selectedCriticality, selectedEnvironment, currentPage, pageSize]);

  useEffect(() => {
    loadCIs();
  }, [loadCIs]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadCIs();
  };

  const handleViewCI = (ci: ConfigurationItem) => {
    navigate(`/app/cmdb/${ci.id}`);
  };

  const handleEditCI = (ci: ConfigurationItem) => {
    navigate(`/app/cmdb/${ci.id}/edit`);
  };

  const handleDeleteCI = async (ci: ConfigurationItem) => {
    if (!confirm(`Are you sure you want to delete ${ci.name}?`)) return;

    try {
      await cmdbClient.deleteCI(ci.id!);
      loadCIs();
    } catch (err) {
      console.error('Failed to delete CI:', err);
      alert('Failed to delete CI');
    }
  };

  const handleCreateNew = () => {
    navigate('/app/cmdb/new');
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cis.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cis.map(ci => ci.id!)));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClass('');
    setSelectedStatus('');
    setSelectedCriticality('');
    setSelectedEnvironment('');
    setCurrentPage(1);
  };

  // Dropdown options
  const classOptions = [
    { value: '', label: 'All Classes' },
    { value: 'HARDWARE', label: 'Hardware' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'NETWORK', label: 'Network' },
    { value: 'DATABASE', label: 'Database' },
    { value: 'CLOUD', label: 'Cloud' },
    { value: 'CONTAINER', label: 'Container' },
    { value: 'VIRTUAL', label: 'Virtual' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PLANNED', label: 'Planned' },
    { value: 'ORDERED', label: 'Ordered' },
    { value: 'DEPLOYED', label: 'Deployed' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OFFLINE', label: 'Offline' },
    { value: 'RETIRED', label: 'Retired' },
  ];

  const criticalityOptions = [
    { value: '', label: 'All Criticalities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
    { value: 'NONE', label: 'None' },
  ];

  const environmentOptions = [
    { value: '', label: 'All Environments' },
    { value: 'Production', label: 'Production' },
    { value: 'Staging', label: 'Staging' },
    { value: 'Development', label: 'Development' },
    { value: 'Test', label: 'Test' },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasFilters = searchQuery || selectedClass || selectedStatus || selectedCriticality || selectedEnvironment;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <PageHeader
        icon={<DatabaseRegular />}
        title="Configuration Management Database"
        subtitle="Manage and track all configuration items and their relationships"
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            <PurpleGlassButton
              onClick={loadCIs}
              icon={<ArrowSyncRegular />}
            >
              Refresh
            </PurpleGlassButton>
            <PurpleGlassButton
              onClick={handleCreateNew}
              icon={<AddRegular />}
              variant="primary"
            >
              Create CI
            </PurpleGlassButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          {/* Search */}
          <div style={{ maxWidth: '600px' }}>
            <EnhancedPurpleGlassSearchBar
              placeholder="Search by name, CI ID, IP, serial number..."
              value={searchQuery}
              onChange={(value) => handleSearch(value)}
              showClearButton
            />
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterRegular style={{ color: 'var(--colorNeutralForeground2)' }} />

            <PurpleGlassDropdown
              placeholder="Class"
              value={selectedClass}
              onChange={(value) => {
                setSelectedClass(value as CIClass | '');
                handleFilterChange();
              }}
              options={classOptions}
              glass="light"
            />

            <PurpleGlassDropdown
              placeholder="Status"
              value={selectedStatus}
              onChange={(value) => {
                setSelectedStatus(value as CIStatus | '');
                handleFilterChange();
              }}
              options={statusOptions}
              glass="light"
            />

            <PurpleGlassDropdown
              placeholder="Criticality"
              value={selectedCriticality}
              onChange={(value) => {
                setSelectedCriticality(value as CICriticality | '');
                handleFilterChange();
              }}
              options={criticalityOptions}
              glass="light"
            />

            <PurpleGlassDropdown
              placeholder="Environment"
              value={selectedEnvironment}
              onChange={(value) => {
                setSelectedEnvironment(typeof value === 'string' ? value : '');
                handleFilterChange();
              }}
              options={environmentOptions}
              glass="light"
            />

            {hasFilters && (
              <PurpleGlassButton onClick={clearFilters} variant="ghost">
                Clear Filters
              </PurpleGlassButton>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Results Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        fontSize: FluentTokens.typography.fontSize[300],
        color: 'var(--colorNeutralForeground2)',
      }}>
        <div>
          Showing {cis.length} of {totalCount} configuration items
        </div>
        {selectedItems.size > 0 && (
          <div>
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* CI List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <PurpleGlassSpinner size="large" />
        </div>
      ) : error ? (
        <PurpleGlassCard style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--colorPaletteRedForeground1)', marginBottom: '16px' }}>
            {error}
          </p>
          <PurpleGlassButton onClick={loadCIs}>Try Again</PurpleGlassButton>
        </PurpleGlassCard>
      ) : cis.length === 0 ? (
        <PurpleGlassEmptyState
          icon={<ServerRegular style={{ fontSize: '48px' }} />}
          title="No configuration items found"
          description={hasFilters ? "Try adjusting your filters" : "Get started by creating your first CI"}
          action={
            hasFilters 
              ? { label: 'Clear Filters', onClick: clearFilters }
              : { label: 'Create First CI', onClick: handleCreateNew }
          }
        />
      ) : (
        <>
          {/* Table Header */}
          <PurpleGlassCard style={{ marginBottom: '8px', padding: '12px 16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 120px 2fr 1fr 1fr 100px 100px 150px',
              gap: '12px',
              fontSize: FluentTokens.typography.fontSize[300],
              fontWeight: FluentTokens.typography.fontWeight.semibold,
              color: 'var(--colorNeutralForeground2)',
            }}>
              <div>
                <PurpleGlassCheckbox
                  checked={selectedItems.size === cis.length && cis.length > 0}
                  onChange={handleSelectAll}
                  indeterminate={selectedItems.size > 0 && selectedItems.size < cis.length}
                />
              </div>
              <div>CI ID</div>
              <div>Name</div>
              <div>Type</div>
              <div>Environment</div>
              <div>Status</div>
              <div>Criticality</div>
              <div>Actions</div>
            </div>
          </PurpleGlassCard>

          {/* Table Rows */}
          {cis.map((ci) => (
            <PurpleGlassCard
              key={ci.id}
              style={{
                marginBottom: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleViewCI(ci)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 120px 2fr 1fr 1fr 100px 100px 150px',
                gap: '12px',
                alignItems: 'center',
              }}>
                <div onClick={(e) => e.stopPropagation()}>
                  <PurpleGlassCheckbox
                    checked={selectedItems.has(ci.id!)}
                    onChange={() => handleSelectItem(ci.id!)}
                  />
                </div>
                
                <div style={{
                  fontWeight: FluentTokens.typography.fontWeight.semibold,
                  color: 'var(--colorBrandForeground1)',
                }}>
                  {ci.ci_id}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {cmdbClient.getCIClassIcon(ci.ci_class)}
                  </span>
                  <div>
                    <div style={{ fontWeight: FluentTokens.typography.fontWeight.medium }}>
                      {ci.name}
                    </div>
                    {ci.description && (
                      <div style={{
                        fontSize: FluentTokens.typography.fontSize[200],
                        color: 'var(--colorNeutralForeground3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {ci.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ fontSize: FluentTokens.typography.fontSize[300] }}>
                  {ci.ci_type}
                </div>
                
                <div style={{ fontSize: FluentTokens.typography.fontSize[300] }}>
                  {ci.environment || '-'}
                </div>
                
                <div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: FluentTokens.borderRadius.medium,
                    fontSize: FluentTokens.typography.fontSize[200],
                    fontWeight: FluentTokens.typography.fontWeight.medium,
                    backgroundColor: `${cmdbClient.getCIStatusColor(ci.status)}20`,
                    color: cmdbClient.getCIStatusColor(ci.status),
                  }}>
                    {ci.status}
                  </span>
                </div>
                
                <div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: FluentTokens.borderRadius.medium,
                    fontSize: FluentTokens.typography.fontSize[200],
                    fontWeight: FluentTokens.typography.fontWeight.medium,
                    backgroundColor: `${cmdbClient.getCICriticalityColor(ci.criticality)}20`,
                    color: cmdbClient.getCICriticalityColor(ci.criticality),
                  }}>
                    {ci.criticality}
                  </span>
                </div>
                
                <div
                  style={{ display: 'flex', gap: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <PurpleGlassButton
                    size="small"
                    icon={<EyeRegular />}
                    onClick={() => handleViewCI(ci)}
                    title="View"
                  />
                  <PurpleGlassButton
                    size="small"
                    icon={<EditRegular />}
                    onClick={() => handleEditCI(ci)}
                    title="Edit"
                  />
                  <PurpleGlassButton
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => handleDeleteCI(ci)}
                    title="Delete"
                  />
                </div>
              </div>
            </PurpleGlassCard>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '24px',
            }}>
              <PurpleGlassButton
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </PurpleGlassButton>
              
              <span style={{
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--colorNeutralForeground1)',
              }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <PurpleGlassButton
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </PurpleGlassButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CMDBExplorerView;
