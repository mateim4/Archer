import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Server, 
  RefreshCw, 
  Settings,
  Database,
  Cloud,
  Monitor,
  Info,
  Download,
  Upload,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';

// Helper function to check if we're running in Tauri
const isTauriAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.__TAURI_IPC__ && 
         typeof window.__TAURI_IPC__ === 'function';
};

interface ServerModel {
  vendor: string;
  model_id: string;
  model_name: string;
  family: string;
  form_factor: string;
  cpu_sockets: number;
  max_memory_gb: number;
  drive_bays: number;
  generation: string;
  release_date?: string;
  end_of_life?: string;
}

interface SizingRequirements {
  workload_type: string;
  cpu_cores_minimum?: number;
  memory_gb_minimum?: number;
  storage_gb_minimum?: number;
  network_bandwidth_gbps?: number;
  form_factor_preference?: string;
  budget_maximum?: number;
  power_limit_watts?: number;
  redundancy_required: boolean;
  specific_features: string[];
}

export const VendorDataCollectionView: React.FC = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [serverModels, setServerModels] = useState<ServerModel[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchRequirements, setSearchRequirements] = useState<SizingRequirements>({
    workload_type: 'General',
    redundancy_required: false,
    specific_features: [],
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; title: string; body: string } | null>(null);

  // Mock data for web mode
  const mockServerModels: ServerModel[] = [
    {
      vendor: 'Dell',
      model_id: 'r740',
      model_name: 'PowerEdge R740',
      family: 'PowerEdge',
      form_factor: 'TwoU',
      cpu_sockets: 2,
      max_memory_gb: 3072,
      drive_bays: 16,
      generation: '14th Gen',
      release_date: '2018-03-01'
    },
    {
      vendor: 'Dell',
      model_id: 'r750',
      model_name: 'PowerEdge R750',
      family: 'PowerEdge',
      form_factor: 'TwoU',
      cpu_sockets: 2,
      max_memory_gb: 4096,
      drive_bays: 16,
      generation: '15th Gen',
      release_date: '2021-04-01'
    },
    {
      vendor: 'HPE',
      model_id: 'dl380',
      model_name: 'ProLiant DL380 Gen10',
      family: 'ProLiant DL',
      form_factor: 'TwoU',
      cpu_sockets: 2,
      max_memory_gb: 3072,
      drive_bays: 12,
      generation: 'Gen10',
      release_date: '2017-06-01'
    },
    {
      vendor: 'Lenovo',
      model_id: 'sr650',
      model_name: 'ThinkSystem SR650',
      family: 'ThinkSystem',
      form_factor: 'TwoU',
      cpu_sockets: 2,
      max_memory_gb: 4096,
      drive_bays: 16,
      generation: 'V2',
      release_date: '2019-08-01'
    }
  ];

  // Load server models on component mount
  useEffect(() => {
    if (!isTauriAvailable()) {
      // Use mock data in web mode
      setServerModels(mockServerModels);
      setMessage({
        type: 'info',
        title: 'Web Mode Active',
        body: `Showing ${mockServerModels.length} sample server models (Tauri backend not available)`,
      });
    } else {
      loadAllServerModels();
    }
  }, []);

  const loadAllServerModels = async () => {
    if (!isTauriAvailable()) {
      setServerModels(mockServerModels);
      return;
    }

    setLoading(true);
    try {
      // In real Tauri mode, this would work
      // const models: ServerModel[] = await invoke('get_all_server_models');
      const models = mockServerModels; // Fallback for now
      setServerModels(models);
      setMessage({
        type: 'success',
        title: 'Server Models Loaded',
        body: `Found ${models.length} server models from ${new Set(models.map(m => m.vendor)).size} vendors`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        title: 'Failed to Load Server Models',
        body: `Error: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendorModels = async (vendor: string) => {
    const filteredModels = vendor ? 
      mockServerModels.filter(m => m.vendor === vendor) : 
      mockServerModels;
    
    setServerModels(filteredModels);
    setMessage({
      type: 'success',
      title: vendor ? `${vendor} Models Loaded` : 'All Models Loaded',
      body: `Found ${filteredModels.length} server models`,
    });
  };

  const getFormFactorIcon = (formFactor: string) => {
    switch (formFactor) {
      case 'OneU':
      case 'TwoU':
      case 'FourU':
        return <Server size={20} />;
      case 'Tower':
        return <Monitor size={20} />;
      case 'Blade':
        return <Database size={20} />;
      default:
        return <Cloud size={20} />;
    }
  };

  const formatFormFactor = (formFactor: string) => {
    switch (formFactor) {
      case 'OneU': return '1U Rack';
      case 'TwoU': return '2U Rack';
      case 'FourU': return '4U Rack';
      case 'Tower': return 'Tower';
      case 'Blade': return 'Blade';
      case 'MicroServer': return 'Micro Server';
      default: return formFactor;
    }
  };

  const getStatusBadge = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-lg" style={{ 
            background: 'rgba(34, 197, 94, 0.1)', 
            color: '#059669',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <CheckCircle size={16} className="mr-2" />
            Success
          </div>
        );
      case 'error':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#dc2626',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={16} className="mr-2" />
            Error
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-lg" style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            color: '#2563eb',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <Info size={16} className="mr-2" />
            Info
          </div>
        );
    }
  };

  const renderDropdown = (value: string, onChange: (value: string) => void, options: { value: string; label: string }[], placeholder = "Select option") => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="fluent-input w-full appearance-none pr-10"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          padding: '12px 40px 12px 16px',
          fontSize: '14px',
          fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
          color: '#1a202c',
          cursor: 'pointer'
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown 
        size={16} 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
        style={{ color: '#64748b' }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h3 
            className="font-medium"
            style={{ 
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a202c',
              fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
              letterSpacing: '-0.01em'
            }}
          >
            Vendor Data Collection & Server Sizing
          </h3>
          <div className="ml-2">
            <InfoTooltip 
              content={
                <div>
                  <div className="font-medium mb-2" style={{ color: 'white' }}>
                    Vendor Hardware Management
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Comprehensive vendor data collection system:
                    <ul className="mt-2 space-y-1">
                      <li>• Dell, HPE, and Lenovo server catalogs</li>
                      <li>• Real-time API integration for specs and pricing</li>
                      <li>• Advanced configuration search and recommendations</li>
                      <li>• Automated compatibility validation</li>
                    </ul>
                  </div>
                </div>
              }
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="fluent-button fluent-button-secondary flex items-center">
            <Upload size={16} className="mr-2" />
            Import Catalog
          </button>
          <button className="fluent-button fluent-button-secondary flex items-center">
            <Download size={16} className="mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div 
          className="fluent-card p-4 flex items-center justify-between"
          style={{
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 
                       message.type === 'success' ? 'rgba(34, 197, 94, 0.05)' : 
                       'rgba(59, 130, 246, 0.05)',
            border: message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.1)' : 
                   message.type === 'success' ? '1px solid rgba(34, 197, 94, 0.1)' : 
                   '1px solid rgba(59, 130, 246, 0.1)'
          }}
        >
          <div className="flex items-center">
            {getStatusBadge(message.type)}
            <div className="ml-4">
              <div 
                className="font-medium"
                style={{ color: '#1a202c', fontSize: '14px' }}
              >
                {message.title}
              </div>
              <div 
                style={{ color: '#64748b', fontSize: '13px' }}
              >
                {message.body}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600 ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Vendor Configuration */}
      <div 
        className="fluent-card p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Settings size={20} className="mr-2" style={{ color: '#8b5cf6' }} />
            <h4 
              className="font-medium"
              style={{ 
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a202c',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Vendor Configuration
            </h4>
          </div>
          <div className="flex space-x-2">
            <button className="fluent-button fluent-button-secondary flex items-center">
              <Settings size={16} className="mr-2" />
              Configure Credentials
            </button>
            <button className="fluent-button fluent-button-secondary flex items-center">
              <RefreshCw size={16} className="mr-2" />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Filter by Vendor
            </label>
            {renderDropdown(
              selectedVendor,
              (value) => {
                setSelectedVendor(value);
                loadVendorModels(value);
              },
              [
                { value: 'Dell', label: 'Dell' },
                { value: 'HPE', label: 'HPE' },
                { value: 'Lenovo', label: 'Lenovo' }
              ],
              'All Vendors'
            )}
          </div>
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Form Factor
            </label>
            {renderDropdown(
              '',
              () => {},
              [
                { value: 'OneU', label: '1U Rack' },
                { value: 'TwoU', label: '2U Rack' },
                { value: 'FourU', label: '4U Rack' },
                { value: 'Tower', label: 'Tower' },
                { value: 'Blade', label: 'Blade' }
              ],
              'All Form Factors'
            )}
          </div>
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Generation
            </label>
            {renderDropdown(
              '',
              () => {},
              [
                { value: '14th Gen', label: '14th Gen' },
                { value: '15th Gen', label: '15th Gen' },
                { value: 'Gen10', label: 'Gen10' },
                { value: 'V2', label: 'V2' }
              ],
              'All Generations'
            )}
          </div>
        </div>
      </div>

      {/* Server Models Catalog */}
      <div 
        className="overflow-hidden border rounded-xl"
        style={{
          borderColor: 'rgba(139, 92, 246, 0.2)',
          background: 'transparent'
        }}
      >
        <div 
          className="fluent-table-header" 
          style={{ 
            display: 'grid',
            gridTemplateColumns: '100px 1fr 120px 100px 120px 100px 120px',
            gap: 'var(--fluent-spacing-horizontal-l)',
            padding: 'var(--fluent-spacing-horizontal-l)',
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a202c',
            fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            background: 'rgba(255, 255, 255, 0.85)'
          }}
        >
          <div>Vendor</div>
          <div>Model</div>
          <div>Form Factor</div>
          <div>CPU Sockets</div>
          <div>Max Memory</div>
          <div>Drive Bays</div>
          <div>Actions</div>
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <Clock size={20} className="mr-2 animate-spin" style={{ color: '#8b5cf6' }} />
                <span style={{ color: '#64748b', fontSize: '14px' }}>Loading server models...</span>
              </div>
            </div>
          ) : (
            serverModels.map((model) => (
              <div 
                key={`${model.vendor}-${model.model_id}`}
                className="fluent-table-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 120px 100px 120px 100px 120px',
                  gap: 'var(--fluent-spacing-horizontal-l)',
                  padding: 'var(--fluent-spacing-horizontal-l)',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
                  background: 'rgba(255, 255, 255, 0.75)',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.75)';
                }}
              >
                <div>
                  <span 
                    className="px-2 py-1 rounded-md text-xs font-medium"
                    style={{
                      background: model.vendor === 'Dell' ? 'rgba(59, 130, 246, 0.1)' :
                                 model.vendor === 'HPE' ? 'rgba(16, 185, 129, 0.1)' :
                                 'rgba(245, 158, 11, 0.1)',
                      color: model.vendor === 'Dell' ? '#2563eb' :
                             model.vendor === 'HPE' ? '#059669' :
                             '#d97706',
                      border: model.vendor === 'Dell' ? '1px solid rgba(59, 130, 246, 0.2)' :
                              model.vendor === 'HPE' ? '1px solid rgba(16, 185, 129, 0.2)' :
                              '1px solid rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    {model.vendor}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="mr-3">
                    {getFormFactorIcon(model.form_factor)}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: '#1a202c' }}>
                      {model.model_name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      {model.family} • {model.generation}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#64748b' }}>
                  {formatFormFactor(model.form_factor)}
                </div>
                <div style={{ color: '#1a202c', fontWeight: '500' }}>
                  {model.cpu_sockets}
                </div>
                <div style={{ color: '#1a202c', fontWeight: '500' }}>
                  {model.max_memory_gb} GB
                </div>
                <div style={{ color: '#1a202c', fontWeight: '500' }}>
                  {model.drive_bays}
                </div>
                <div>
                  <button 
                    className="fluent-button fluent-button-subtle flex items-center text-xs"
                    onClick={() => {
                      setMessage({
                        type: 'info',
                        title: 'Specifications Preview',
                        body: `Detailed specs for ${model.model_name} would be loaded from vendor API`
                      });
                    }}
                  >
                    <Eye size={14} className="mr-1" />
                    View Specs
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Configuration Search */}
      <div 
        className="fluent-card p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Search size={20} className="mr-2" style={{ color: '#8b5cf6' }} />
            <h4 
              className="font-medium"
              style={{ 
                fontSize: '16px',
                fontWeight: '600',
                color: '#1a202c',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Server Configuration Search
            </h4>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Workload Type
            </label>
            {renderDropdown(
              searchRequirements.workload_type,
              (value) => setSearchRequirements(prev => ({...prev, workload_type: value})),
              [
                { value: 'General', label: 'General Purpose' },
                { value: 'WebServer', label: 'Web Server' },
                { value: 'Database', label: 'Database' },
                { value: 'Virtualization', label: 'Virtualization' },
                { value: 'HighPerformanceComputing', label: 'HPC' },
                { value: 'Storage', label: 'Storage' },
                { value: 'AIMLTraining', label: 'AI/ML Training' },
                { value: 'AIMLInference', label: 'AI/ML Inference' }
              ]
            )}
          </div>
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Minimum CPU Cores
            </label>
            <input
              type="number"
              className="fluent-input w-full"
              placeholder="e.g. 16"
              value={searchRequirements.cpu_cores_minimum || ''}
              onChange={(e) => setSearchRequirements(prev => ({
                ...prev, 
                cpu_cores_minimum: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
                color: '#1a202c'
              }}
            />
          </div>
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: '14px',
                color: '#374151',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Minimum Memory (GB)
            </label>
            <input
              type="number"
              className="fluent-input w-full"
              placeholder="e.g. 128"
              value={searchRequirements.memory_gb_minimum || ''}
              onChange={(e) => setSearchRequirements(prev => ({
                ...prev, 
                memory_gb_minimum: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
                color: '#1a202c'
              }}
            />
          </div>
          <div className="flex items-end">
            <button 
              className="fluent-button fluent-button-primary flex items-center w-full justify-center"
              onClick={() => {
                setMessage({
                  type: 'info',
                  title: 'Configuration Search',
                  body: `Searching for ${searchRequirements.workload_type} configurations...`
                });
              }}
            >
              <Search size={16} className="mr-2" />
              Search Configurations
            </button>
          </div>
        </div>

        {/* Mock recommendations */}
        {searchRequirements.workload_type !== 'General' && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
            <h5 
              className="font-medium mb-3"
              style={{ 
                fontSize: '15px',
                color: '#1a202c',
                fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif'
              }}
            >
              Recommended Configurations (3)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {['PowerEdge R750', 'ProLiant DL380 Gen10', 'ThinkSystem SR650'].map((model, index) => (
                <div 
                  key={model}
                  className="fluent-card p-4 hover:shadow-lg transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    borderRadius: '8px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Server size={18} className="mr-3" style={{ color: '#8b5cf6' }} />
                      <div>
                        <div className="font-medium" style={{ color: '#1a202c', fontSize: '14px' }}>
                          {model}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>
                          Optimized for {searchRequirements.workload_type} workloads
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span 
                        className="px-2 py-1 rounded-md text-xs font-medium"
                        style={{
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: '#059669',
                          border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}
                      >
                        {85 + index * 5}% Match
                      </span>
                      <button className="fluent-button fluent-button-subtle text-xs">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDataCollectionView;