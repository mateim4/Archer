import React, { useState, useEffect } from 'react';
import { Plus, Server, Cpu, HardDrive, Monitor, Edit3, Trash2, X, Search, Filter } from 'lucide-react';
import { apiClient, HardwareItem, CreateHardwareRequest } from '../utils/apiClient';

const HardwarePoolView: React.FC = () => {
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HardwareItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [newHardware, setNewHardware] = useState<CreateHardwareRequest>({
    name: '',
    vendor: '',
    model: '',
    specs: {
      cpu: '',
      memory: '',
      storage: '',
      network: ''
    }
  });

  // For demo purposes, we'll use a hardcoded project ID
  // In a real app, this would come from route params or selected project
  const currentProjectId = "project:clkhv02gnqaa5o6nbh8h"; // Use a real project ID from your database

  const loadHardware = async () => {
    if (!selectedProjectId && !currentProjectId) return;
    
    try {
      setLoading(true);
      const hardwareData = await apiClient.getHardware(selectedProjectId || currentProjectId);
      // Ensure hardwareData is an array
      setHardware(Array.isArray(hardwareData) ? hardwareData : []);
      setError(null);
    } catch (err) {
      console.error('Error loading hardware:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hardware');
      // Ensure hardware is reset to empty array on error
      setHardware([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createHardware(selectedProjectId || currentProjectId, newHardware);
      setNewHardware({
        name: '',
        vendor: '',
        model: '',
        specs: { cpu: '', memory: '', storage: '', network: '' }
      });
      setShowCreateForm(false);
      loadHardware();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create hardware');
    }
  };

  const handleEditHardware = async (item: HardwareItem) => {
    try {
      await apiClient.updateHardware(
        selectedProjectId || currentProjectId,
        item.id,
        {
          name: item.name,
          vendor: item.vendor,
          model: item.model,
          specs: item.specs
        }
      );
      setEditingItem(null);
      loadHardware();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update hardware');
    }
  };

  const handleDeleteHardware = async (hardwareId: string) => {
    if (!confirm('Are you sure you want to delete this hardware item?')) return;
    
    try {
      await apiClient.deleteHardware(selectedProjectId || currentProjectId, hardwareId);
      loadHardware();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete hardware');
    }
  };

  const getVendorIcon = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'dell':
      case 'hp':
      case 'hpe':
        return <Server className="w-5 h-5" />;
      case 'cisco':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Cpu className="w-5 h-5" />;
    }
  };

  const filteredHardware = Array.isArray(hardware) ? hardware.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVendor = !selectedVendor || item.vendor === selectedVendor;
    return matchesSearch && matchesVendor;
  }) : [];

  const vendors = Array.from(new Set(hardware.map(item => item.vendor))).sort();

  useEffect(() => {
    loadHardware();
  }, [selectedProjectId]);

  if (loading) {
    return (
      <div className="fluent-page-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fluent-page-container">
      <div className="lcm-card">
        {/* Page Header */}
        <div className="fluent-page-header">
        <button
          onClick={() => setShowCreateForm(true)}
          className="fluent-button fluent-button-primary fluent-button-with-icon"
        >
          <Plus className="w-4 h-4" />
          Add Hardware
        </button>
      </div>

      {error && (
        <div className="fluent-alert fluent-alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-6 p-4 border border-purple-500/20 rounded-lg bg-transparent">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="lcm-input-with-icon">
              <Search className="lcm-input-icon text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search hardware by name, vendor, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="lcm-input"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="lcm-input-with-icon">
              <Filter className="lcm-input-icon text-gray-400 w-4 h-4" />
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="lcm-dropdown"
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              {filteredHardware.length} of {hardware.length} items
            </div>
          </div>
        </div>
      </div>

      {/* Create Hardware Form */}
      {showCreateForm && (
        <div className="fluent-modal-overlay">
          <div className="fluent-modal">
            <div className="fluent-modal-header">
              <h3 className="fluent-modal-title">Add New Hardware</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="fluent-button fluent-button-subtle fluent-button-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateHardware} className="fluent-modal-content">
              <div className="fluent-form-section">
                <div className="fluent-form-group">
                  <label className="fluent-label">Name</label>
                  <input
                    type="text"
                    value={newHardware.name}
                    onChange={(e) => setNewHardware({ ...newHardware, name: e.target.value })}
                    className="lcm-input"
                    placeholder="e.g., Production Server 01"
                    required
                  />
                </div>
                <div className="fluent-form-group">
                  <label className="fluent-label">Vendor</label>
                  <select
                    value={newHardware.vendor}
                    onChange={(e) => setNewHardware({ ...newHardware, vendor: e.target.value })}
                    className="lcm-dropdown"
                    required
                  >
                    <option value="">Select Vendor</option>
                    <option value="Dell">Dell</option>
                    <option value="HP">HP</option>
                    <option value="HPE">HPE</option>
                    <option value="Cisco">Cisco</option>
                    <option value="Lenovo">Lenovo</option>
                  </select>
                </div>
                <div className="fluent-form-group">
                  <label className="fluent-label">Model</label>
                  <input
                    type="text"
                    value={newHardware.model}
                    onChange={(e) => setNewHardware({ ...newHardware, model: e.target.value })}
                    className="lcm-input"
                    placeholder="e.g., PowerEdge R750"
                    required
                  />
                </div>
              </div>
              
              <div className="fluent-form-section">
                <h4 className="fluent-section-title">Hardware Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="fluent-form-group">
                    <label className="fluent-label">CPU</label>
                    <input
                      type="text"
                      value={newHardware.specs.cpu}
                      onChange={(e) => setNewHardware({ 
                        ...newHardware, 
                        specs: { ...newHardware.specs, cpu: e.target.value }
                      })}
                      className="lcm-input"
                      placeholder="e.g., Intel Xeon Silver 4314"
                    />
                  </div>
                  <div className="fluent-form-group">
                    <label className="fluent-label">Memory</label>
                    <input
                      type="text"
                      value={newHardware.specs.memory}
                      onChange={(e) => setNewHardware({ 
                        ...newHardware, 
                        specs: { ...newHardware.specs, memory: e.target.value }
                      })}
                      className="lcm-input"
                      placeholder="e.g., 128GB DDR4"
                    />
                  </div>
                  <div className="fluent-form-group">
                    <label className="fluent-label">Storage</label>
                    <input
                      type="text"
                      value={newHardware.specs.storage}
                      onChange={(e) => setNewHardware({ 
                        ...newHardware, 
                        specs: { ...newHardware.specs, storage: e.target.value }
                      })}
                      className="lcm-input"
                      placeholder="e.g., 2TB NVMe SSD"
                    />
                  </div>
                  <div className="fluent-form-group">
                    <label className="fluent-label">Network</label>
                    <input
                      type="text"
                      value={newHardware.specs.network}
                      onChange={(e) => setNewHardware({ 
                        ...newHardware, 
                        specs: { ...newHardware.specs, network: e.target.value }
                      })}
                      className="lcm-input"
                      placeholder="e.g., 4x 25GbE"
                    />
                  </div>
                </div>
              </div>
              
              <div className="fluent-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="fluent-button fluent-button-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fluent-button fluent-button-primary"
                >
                  Create Hardware
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hardware Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHardware.map((item) => (
          <div key={item.id} className="p-4 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="fluent-icon-container fluent-icon-container-primary mr-3">
                  {getVendorIcon(item.vendor)}
                </div>
                <div>
                  <h3 className="fluent-card-title">{item.name}</h3>
                  <p className="fluent-card-subtitle">{item.vendor} {item.model}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingItem(item)}
                  className="fluent-button fluent-button-subtle fluent-button-icon"
                  title="Edit hardware"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteHardware(item.id)}
                  className="fluent-button fluent-button-subtle fluent-button-icon fluent-button-danger"
                  title="Delete hardware"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {item.specs.cpu && (
                <div className="flex items-center text-sm">
                  <Cpu className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-gray-600">{item.specs.cpu}</span>
                </div>
              )}
              {item.specs.memory && (
                <div className="flex items-center text-sm">
                  <HardDrive className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-gray-600">{item.specs.memory}</span>
                </div>
              )}
              {item.specs.storage && (
                <div className="flex items-center text-sm">
                  <Server className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-gray-600">{item.specs.storage}</span>
                </div>
              )}
              {item.specs.network && (
                <div className="flex items-center text-sm">
                  <Monitor className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-gray-600">{item.specs.network}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {Array.isArray(hardware) && hardware.length === 0 && !loading && (
        <div className="fluent-empty-state">
          <div className="fluent-empty-state-icon">
            <Server className="w-16 h-16" />
          </div>
          <h3 className="fluent-empty-state-title">No hardware items yet</h3>
          <p className="fluent-empty-state-description">
            Get started by adding your first hardware item to the pool.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="fluent-button fluent-button-primary fluent-button-with-icon mt-4"
          >
            <Plus className="w-4 h-4" />
            Add Hardware
          </button>
        </div>
      )}

      {filteredHardware.length === 0 && hardware.length > 0 && (
        <div className="fluent-empty-state">
          <div className="fluent-empty-state-icon">
            <Search className="w-16 h-16" />
          </div>
          <h3 className="fluent-empty-state-title">No matching hardware found</h3>
          <p className="fluent-empty-state-description">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default HardwarePoolView;
