# Frontend: Server Inventory and Hardware Pool Management

## Issue Description
Create comprehensive server inventory management and free hardware pool interfaces that allow users to track physical servers, manage their lifecycle status, and maintain a pool of available hardware for future projects.

## Background
The application needs to track actual server hardware separately from vendor pricing catalogs. This includes servers discovered via RVTools, manually added servers, and servers purchased from hardware baskets. The free hardware pool shows servers that become available after project completion.

## Technical Specifications

### Component Architecture
```
HardwarePoolView.tsx (main view)
├── ServerInventoryTab.tsx (all servers)
├── FreePoolTab.tsx (available servers)
├── ServerCard.tsx (individual server display)
├── AddServerModal.tsx (manual server addition)
├── EditServerModal.tsx (server editing)
├── ServerDetailsPanel.tsx (detailed specs)
└── CapacityAnalyzer.tsx (capacity calculations)
```

### Data Models

```typescript
// frontend/src/types/serverTypes.ts
interface ServerInventory {
  id: string;
  model_name: string;
  vendor: string;
  specifications: {
    processor: ProcessorSpec;
    memory: MemorySpec;
    storage: StorageSpec;
    network: NetworkSpec;
    form_factor: string;
  };
  status: 'available' | 'in_use' | 'maintenance' | 'decommissioned';
  location: string;
  assigned_project?: string;
  assigned_activity?: string;
  source: 'rvtools' | 'manual' | 'hardware_basket';
  purchase_date?: Date;
  warranty_end?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface FreeHardwareEntry {
  id: string;
  server: ServerInventory;
  available_from: Date;
  released_from_activity?: string;
  reserved_until?: Date;
  reserved_by?: string;
  notes?: string;
}

interface CapacitySummary {
  total_servers: number;
  available_servers: number;
  total_cpu_cores: number;
  available_cpu_cores: number;
  total_memory_gb: number;
  available_memory_gb: number;
  by_vendor: Record<string, number>;
  by_form_factor: Record<string, number>;
}
```

### Main Hardware Pool View

```typescript
// frontend/src/views/HardwarePoolView.tsx
import React, { useState, useEffect } from 'react';
import { 
  ServerRegular,
  AddRegular,
  FilterRegular,
  SearchRegular,
  DatabaseRegular,
  CloudRegular,
  SettingsRegular,
  InfoRegular
} from '@fluentui/react-icons';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import ConsistentCard from '../components/ConsistentCard';
import ConsistentButton from '../components/ConsistentButton';

const HardwarePoolView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'free_pool' | 'capacity'>('inventory');
  const [servers, setServers] = useState<ServerInventory[]>([]);
  const [freePool, setFreePool] = useState<FreeHardwareEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    vendor: '',
    status: '',
    form_factor: '',
    source: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    fetchServers();
    fetchFreePool();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/servers');
      if (response.ok) {
        const data = await response.json();
        setServers(data);
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreePool = async () => {
    try {
      const response = await fetch('/api/hardware-pool');
      if (response.ok) {
        const data = await response.json();
        setFreePool(data);
      }
    } catch (error) {
      console.error('Failed to fetch free pool:', error);
    }
  };

  // Filter servers based on search and filters
  const filteredServers = servers.filter(server => {
    const matchesSearch = !searchQuery || 
      server.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVendor = !filters.vendor || server.vendor === filters.vendor;
    const matchesStatus = !filters.status || server.status === filters.status;
    const matchesFormFactor = !filters.form_factor || server.specifications.form_factor === filters.form_factor;
    const matchesSource = !filters.source || server.source === filters.source;

    return matchesSearch && matchesVendor && matchesStatus && matchesFormFactor && matchesSource;
  });

  // Calculate capacity summary
  const capacitySummary: CapacitySummary = {
    total_servers: servers.length,
    available_servers: servers.filter(s => s.status === 'available').length,
    total_cpu_cores: servers.reduce((sum, s) => sum + (s.specifications.processor.cores || 0), 0),
    available_cpu_cores: servers.filter(s => s.status === 'available').reduce((sum, s) => sum + (s.specifications.processor.cores || 0), 0),
    total_memory_gb: servers.reduce((sum, s) => sum + (s.specifications.memory.total_gb || 0), 0),
    available_memory_gb: servers.filter(s => s.status === 'available').reduce((sum, s) => sum + (s.specifications.memory.total_gb || 0), 0),
    by_vendor: servers.reduce((acc, s) => {
      acc[s.vendor] = (acc[s.vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    by_form_factor: servers.reduce((acc, s) => {
      const ff = s.specifications.form_factor || 'Unknown';
      acc[ff] = (acc[ff] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      available: '✅',
      in_use: '🔄',
      maintenance: '🔧',
      decommissioned: '❌'
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: '#10b981',
      in_use: '#3b82f6',
      maintenance: '#f59e0b',
      decommissioned: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const renderInventoryTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search and Filters */}
      <ConsistentCard title="Search & Filter" icon={<FilterRegular />}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginTop: '16px'
        }}>
          <div style={{ position: 'relative' }}>
            <SearchRegular style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: '16px'
            }} />
            <input
              type="text"
              className="lcm-input"
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          
          <select
            className="lcm-dropdown"
            value={filters.vendor}
            onChange={(e) => setFilters({...filters, vendor: e.target.value})}
          >
            <option value="">All Vendors</option>
            <option value="Dell">Dell</option>
            <option value="HPE">HPE</option>
            <option value="Lenovo">Lenovo</option>
          </select>

          <select
            className="lcm-dropdown"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="decommissioned">Decommissioned</option>
          </select>

          <select
            className="lcm-dropdown"
            value={filters.form_factor}
            onChange={(e) => setFilters({...filters, form_factor: e.target.value})}
          >
            <option value="">All Form Factors</option>
            <option value="1U">1U Rack</option>
            <option value="2U">2U Rack</option>
            <option value="4U">4U Rack</option>
            <option value="Tower">Tower</option>
            <option value="Blade">Blade</option>
          </select>

          <ConsistentButton variant="primary" onClick={() => setShowAddModal(true)}>
            <AddRegular style={{ marginRight: '8px' }} />
            Add Server
          </ConsistentButton>
        </div>
      </ConsistentCard>

      {/* Server Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredServers.map(server => (
          <ServerCard
            key={server.id}
            server={server}
            onClick={() => setSelectedServer(server.id)}
            onEdit={() => {/* Open edit modal */}}
            onDelete={() => {/* Handle delete */}}
          />
        ))}
      </div>

      {filteredServers.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px', 
          color: '#6b7280' 
        }}>
          {searchQuery || Object.values(filters).some(f => f) 
            ? 'No servers match your search criteria'
            : 'No servers in inventory. Add servers manually or import from RVTools.'
          }
        </div>
      )}
    </div>
  );

  const renderFreePoolTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ConsistentCard 
        title={`Free Hardware Pool (${freePool.length} servers)`}
        subtitle="Servers available for new projects"
        icon={<CloudRegular />}
      >
        <div style={{ marginTop: '16px' }}>
          {freePool.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px', 
              color: '#6b7280' 
            }}>
              No servers in free pool. Complete project activities to add servers.
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '20px' 
            }}>
              {freePool.map(entry => (
                <FreePoolCard
                  key={entry.id}
                  entry={entry}
                  onReserve={() => {/* Handle reservation */}}
                  onRemove={() => {/* Remove from pool */}}
                />
              ))}
            </div>
          )}
        </div>
      </ConsistentCard>
    </div>
  );

  const renderCapacityTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overall Capacity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <ConsistentCard title={capacitySummary.total_servers.toString()} subtitle="Total Servers" icon={<ServerRegular />}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            {capacitySummary.available_servers} available
          </div>
        </ConsistentCard>
        
        <ConsistentCard title={capacitySummary.total_cpu_cores.toString()} subtitle="Total CPU Cores" icon={<DatabaseRegular />}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            {capacitySummary.available_cpu_cores} available
          </div>
        </ConsistentCard>
        
        <ConsistentCard title={`${capacitySummary.total_memory_gb} GB`} subtitle="Total Memory" icon={<DatabaseRegular />}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            {capacitySummary.available_memory_gb} GB available
          </div>
        </ConsistentCard>
      </div>

      {/* Capacity Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <ConsistentCard title="By Vendor" icon={<InfoRegular />}>
          <div style={{ marginTop: '16px' }}>
            {Object.entries(capacitySummary.by_vendor).map(([vendor, count]) => (
              <div key={vendor} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}>
                <span style={{ color: '#374151' }}>{vendor}</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>{count}</span>
              </div>
            ))}
          </div>
        </ConsistentCard>

        <ConsistentCard title="By Form Factor" icon={<InfoRegular />}>
          <div style={{ marginTop: '16px' }}>
            {Object.entries(capacitySummary.by_form_factor).map(([ff, count]) => (
              <div key={ff} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}>
                <span style={{ color: '#374151' }}>{ff}</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>{count}</span>
              </div>
            ))}
          </div>
        </ConsistentCard>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventory': return renderInventoryTab();
      case 'free_pool': return renderFreePoolTab();
      case 'capacity': return renderCapacityTab();
      default: return null;
    }
  };

  return (
    <GlassmorphicLayout>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ServerRegular style={{ fontSize: '24px', color: '#8b5cf6' }} />
          <div>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              Hardware Pool
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Manage server inventory and free hardware pool
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <ConsistentButton variant="outline">
            Import RVTools
          </ConsistentButton>
          <ConsistentButton variant="secondary">
            Export Inventory
          </ConsistentButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        {[
          { id: 'inventory', label: 'Server Inventory', icon: <ServerRegular /> },
          { id: 'free_pool', label: 'Free Pool', icon: <CloudRegular /> },
          { id: 'capacity', label: 'Capacity Analysis', icon: <DatabaseRegular /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
              color: activeTab === tab.id ? '#111827' : '#6b7280',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <div style={{ fontSize: '16px' }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </GlassmorphicLayout>
  );
};

export default HardwarePoolView;
```

### Server Card Component

```typescript
// frontend/src/components/ServerCard.tsx
interface ServerCardProps {
  server: ServerInventory;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onClick, onEdit, onDelete }) => {
  const getStatusBadge = (status: string) => (
    <span style={{
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      background: `${getStatusColor(status)}22`,
      color: getStatusColor(status),
      textTransform: 'capitalize'
    }}>
      {getStatusIcon(status)} {status.replace('_', ' ')}
    </span>
  );

  const formatSpecs = (specs: any) => {
    const cpu = specs.processor ? `${specs.processor.model} (${specs.processor.cores}C)` : 'N/A';
    const memory = specs.memory ? `${specs.memory.total_gb}GB` : 'N/A';
    const storage = specs.storage ? `${specs.storage.total_capacity}` : 'N/A';
    return { cpu, memory, storage };
  };

  const specs = formatSpecs(server.specifications);

  return (
    <div
      className="lcm-card server-card"
      style={{
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {server.model_name}
          </h3>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {server.vendor} • {server.specifications.form_factor}
          </div>
        </div>
        {getStatusBadge(server.status)}
      </div>

      {/* Specifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>CPU</div>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{specs.cpu}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Memory</div>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{specs.memory}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Storage</div>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{specs.storage}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Location</div>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>{server.location || 'Unknown'}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
        <span>Added: {new Date(server.created_at).toLocaleDateString()}</span>
        <span style={{ textTransform: 'capitalize' }}>{server.source}</span>
      </div>
    </div>
  );
};
```

## Implementation Tasks

### Phase 1: Basic Inventory
- [ ] Create HardwarePoolView main component
- [ ] Implement server inventory listing with cards
- [ ] Add search and filtering functionality
- [ ] Create add server modal with form validation

### Phase 2: Free Pool Management
- [ ] Implement free hardware pool tab
- [ ] Add server reservation functionality
- [ ] Create availability timeline visualization
- [ ] Implement pool entry management (add/remove)

### Phase 3: Capacity Analysis
- [ ] Create capacity summary calculations
- [ ] Add vendor and form factor breakdowns
- [ ] Implement capacity charts/visualizations
- [ ] Add utilization metrics

### Phase 4: Integration
- [ ] Connect to backend server APIs
- [ ] Implement RVTools import functionality
- [ ] Add real-time updates for server status
- [ ] Create export functionality for inventory

## Files to Create
- `frontend/src/views/HardwarePoolView.tsx`
- `frontend/src/components/ServerCard.tsx`
- `frontend/src/components/FreePoolCard.tsx`
- `frontend/src/components/AddServerModal.tsx`
- `frontend/src/components/EditServerModal.tsx`
- `frontend/src/types/serverTypes.ts`

## Files to Modify
- `frontend/src/App.tsx` (add route)
- `frontend/src/components/NavigationSidebar.tsx` (update navigation)

## Acceptance Criteria
- [ ] Server inventory displays all servers with filtering
- [ ] Free hardware pool shows available servers with dates
- [ ] Capacity analysis provides utilization metrics
- [ ] Manual server addition works with validation
- [ ] Server editing allows inline updates
- [ ] Search and filters work across all fields
- [ ] Responsive design supports desktop and tablet
- [ ] Design system compliance maintained
- [ ] Real-time status updates reflect changes
- [ ] Export functionality generates useful reports

## Related Components
- Reference: `frontend/src/views/VendorDataCollectionView.tsx` for data management patterns
- Reference: `frontend/src/components/ConsistentCard.tsx` for card styling