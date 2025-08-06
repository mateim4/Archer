import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
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
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';
import EnhancedFileUpload from '../components/EnhancedFileUpload';

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

  // Load server models on component mount
  useEffect(() => {
    if (!isTauriAvailable()) {
      // In web mode, show a message that backend is not available
      setServerModels([]);
      setMessage({
        type: 'info',
        title: 'Web Mode Active',
        body: 'Server model data requires Tauri backend. Please run in desktop mode.',
      });
    } else {
      loadAllServerModels();
    }
  }, []);

  const loadAllServerModels = async () => {
    if (!isTauriAvailable()) {
      setServerModels([]);
      setMessage({
        type: 'info',
        title: 'Backend Not Available',
        body: 'Server model data requires Tauri backend. Please run in desktop mode.',
      });
      return;
    }

    setLoading(true);
    try {
      const models: ServerModel[] = await invoke('get_all_server_models');
      setServerModels(models);
      setMessage({
        type: 'success',
        title: 'Server Models Loaded',
        body: `Found ${models.length} server models from ${new Set(models.map((m: ServerModel) => m.vendor)).size} vendors`,
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
    if (!isTauriAvailable()) {
      setServerModels([]);
      setMessage({
        type: 'info',
        title: 'Backend Not Available',
        body: 'Server model data requires Tauri backend. Please run in desktop mode.',
      });
      return;
    }

    setLoading(true);
    try {
      const models: ServerModel[] = vendor ? 
        await invoke('get_vendor_server_models', { vendor }) :
        await invoke('get_all_server_models');
      
      setServerModels(models);
      setMessage({
        type: 'success',
        title: vendor ? `${vendor} Models Loaded` : 'All Models Loaded',
        body: `Found ${models.length} server models`,
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
        className="lcm-dropdown"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <h3 className="text-xl font-semibold text-gray-900">
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="lcm-button-secondary flex items-center justify-center">
            <Upload size={16} className="mr-2" />
            <span className="hidden sm:inline">Import Catalog</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button className="lcm-button-secondary flex items-center justify-center">
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div 
          className="lcm-card flex items-center justify-between"
          style={{
            padding: '16px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 
                       message.type === 'success' ? 'rgba(34, 197, 94, 0.05)' : 
                       'rgba(59, 130, 246, 0.05)',
            borderColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                   message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 
                   'rgba(59, 130, 246, 0.2)'
          }}
        >
          <div className="flex items-center">
            {getStatusBadge(message.type)}
            <div className="ml-4">
              <div className="font-medium text-gray-900 text-sm">
                {message.title}
              </div>
              <div className="text-gray-600 text-sm">
                {message.body}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-gray-600 ml-4 text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Hardware Configuration Upload */}
      <div className="lcm-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Hardware Configuration Upload</h4>
            <p className="text-sm text-gray-600 mt-1">
              Upload vendor-specific configuration files to populate server data
            </p>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            {isTauriAvailable() ? (
              <span className="flex items-center text-green-600">
                <CheckCircle size={14} className="mr-1" />
                Desktop mode: Full processing available
              </span>
            ) : (
              <span className="flex items-center text-blue-600">
                <Info size={14} className="mr-1" />
                Web mode: Client-side processing
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dell SCP Files */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)' }}
              >
                D
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Dell SCP Files</h5>
                <p className="text-xs text-gray-500">System Configuration Profile (XML)</p>
              </div>
            </div>
            <EnhancedFileUpload
              uploadType="hardware"
              acceptedTypes={['.xml']}
              onFileProcessed={(result) => {
                setMessage({
                  type: 'success',
                  title: 'Dell SCP File Processed',
                  body: `Successfully parsed ${result.name} - ${result.model}`
                });
              }}
              onError={(error) => {
                setMessage({
                  type: 'error',
                  title: 'Dell SCP Processing Failed',
                  body: error
                });
              }}
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload size={16} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Upload Dell SCP File</p>
                <p className="text-xs text-gray-400">XML format</p>
              </div>
            </EnhancedFileUpload>
          </div>

          {/* Lenovo DCSC Files */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #dc382d 0%, #b71c1c 100%)' }}
              >
                L
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Lenovo DCSC Files</h5>
                <p className="text-xs text-gray-500">Data Center System Configuration (XML)</p>
              </div>
            </div>
            <EnhancedFileUpload
              uploadType="hardware"
              acceptedTypes={['.xml']}
              onFileProcessed={(result) => {
                setMessage({
                  type: 'success',
                  title: 'Lenovo DCSC File Processed',
                  body: `Successfully parsed ${result.name} - ${result.model}`
                });
              }}
              onError={(error) => {
                setMessage({
                  type: 'error',
                  title: 'Lenovo DCSC Processing Failed',
                  body: error
                });
              }}
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors cursor-pointer">
                <Upload size={16} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Upload Lenovo DCSC File</p>
                <p className="text-xs text-gray-400">XML format</p>
              </div>
            </EnhancedFileUpload>
          </div>

          {/* HPE iQuote Files */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #00b388 0%, #008766 100%)' }}
              >
                H
              </div>
              <div>
                <h5 className="font-medium text-gray-900">HPE iQuote Files</h5>
                <p className="text-xs text-gray-500">Quote files (CSV, TXT, XLS)</p>
              </div>
            </div>
            <EnhancedFileUpload
              uploadType="hardware"
              acceptedTypes={['.csv', '.txt', '.xls', '.xlsx']}
              onFileProcessed={(result) => {
                setMessage({
                  type: 'success',
                  title: 'HPE iQuote File Processed',
                  body: `Successfully parsed ${result.name} - ${result.model}`
                });
              }}
              onError={(error) => {
                setMessage({
                  type: 'error',
                  title: 'HPE iQuote Processing Failed',
                  body: error
                });
              }}
            >
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors cursor-pointer">
                <Upload size={16} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Upload HPE iQuote File</p>
                <p className="text-xs text-gray-400">CSV, TXT, XLS format</p>
              </div>
            </EnhancedFileUpload>
          </div>
        </div>
      </div>

      {/* Vendor Configuration */}
      <div className="lcm-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Vendor Configuration</h4>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button className="lcm-button-secondary flex items-center justify-center">
              <Settings size={16} className="mr-2" />
              <span className="hidden sm:inline">Configure Credentials</span>
              <span className="sm:hidden">Config</span>
            </button>
            <button className="lcm-button-secondary flex items-center justify-center">
              <RefreshCw size={16} className="mr-2" />
              <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh Data'}</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="fluent-label">
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
            <label className="fluent-label">
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
            <label className="fluent-label">
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
      <div className="lcm-table-container">
        <div className="overflow-x-auto">
          <div className="lcm-table-header">
            <div>Vendor</div>
            <div>Model</div>
            <div>Form Factor</div>
            <div>CPU Sockets</div>
            <div>Max Memory</div>
            <div>Drive Bays</div>
            <div>Actions</div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center">
                  <Clock size={20} className="mr-2 animate-spin" style={{ color: '#8b5cf6' }} />
                  <span className="text-gray-600 text-sm">Loading server models...</span>
                </div>
              </div>
            ) : (
              serverModels.map((model) => (
                <div 
                  key={`${model.vendor}-${model.model_id}`}
                  className="lcm-table-row"
                >
                <div data-label="Vendor">
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
                <div className="flex items-center" data-label="Model">
                  <div className="mr-3">
                    {getFormFactorIcon(model.form_factor)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {model.model_name}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {model.family} • {model.generation}
                    </div>
                  </div>
                </div>
                <div className="text-gray-600" data-label="Form Factor">
                  {formatFormFactor(model.form_factor)}
                </div>
                <div className="text-gray-900 font-medium" data-label="CPU Sockets">
                  {model.cpu_sockets}
                </div>
                <div className="text-gray-900 font-medium" data-label="Max Memory">
                  {model.max_memory_gb} GB
                </div>
                <div className="text-gray-900 font-medium" data-label="Drive Bays">
                  {model.drive_bays}
                </div>
                <div data-label="Actions">
                  <button 
                    className="lcm-button-secondary text-xs px-3 py-1"
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
      </div>

      {/* Configuration Search */}
      <div className="p-6 border border-purple-500/20 rounded-lg bg-transparent backdrop-blur-sm">
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Configuration Search</h4>
          <p className="text-sm text-gray-600">Find server configurations based on your workload requirements</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div>
            <label className="fluent-label">
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
            <label className="fluent-label">
              Minimum CPU Cores
            </label>
            <input
              type="number"
              className="lcm-input"
              placeholder="e.g. 16"
              value={searchRequirements.cpu_cores_minimum || ''}
              onChange={(e) => setSearchRequirements(prev => ({
                ...prev, 
                cpu_cores_minimum: e.target.value ? parseInt(e.target.value) : undefined
              }))}
            />
          </div>
          <div>
            <label className="fluent-label">
              Minimum Memory (GB)
            </label>
            <input
              type="number"
              className="lcm-input"
              placeholder="e.g. 128"
              value={searchRequirements.memory_gb_minimum || ''}
              onChange={(e) => setSearchRequirements(prev => ({
                ...prev, 
                memory_gb_minimum: e.target.value ? parseInt(e.target.value) : undefined
              }))}
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            className="lcm-button flex items-center justify-center px-8 w-full sm:w-auto"
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

        {/* Server recommendations would be displayed here when backend is available */}
        {searchRequirements.workload_type !== 'General' && serverModels.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h5 className="font-semibold mb-4 text-lg text-gray-900">
              Recommended Configurations ({Math.min(3, serverModels.length)})
            </h5>
            <div className="grid grid-cols-1 gap-4">
              {serverModels.slice(0, 3).map((model, index) => (
                <div 
                  key={model.model_id}
                  className="p-4 border border-purple-500/20 rounded-lg bg-transparent hover:border border-purple-500/200/10 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                      <Server size={18} className="mr-3 text-purple-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900 text-sm sm:text-base">
                          {model.model_name}
                        </div>
                        <div className="text-gray-600 text-xs sm:text-sm">
                          Optimized for {searchRequirements.workload_type} workloads
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span 
                        className="px-3 py-1 rounded-lg text-xs font-medium border border-green-500/20 text-green-700 border border-green-200 text-center"
                      >
                        {85 + index * 5}% Match
                      </span>
                      <button className="lcm-button-secondary text-xs px-4 py-2">
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