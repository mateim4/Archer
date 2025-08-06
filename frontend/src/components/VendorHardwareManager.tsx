import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import LoadingSpinner from './LoadingSpinner';

// Helper function to check if we're running in Tauri
const isTauriAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.__TAURI_IPC__ !== undefined && 
         typeof window.__TAURI_IPC__ === 'function';
};

// TypeScript interfaces for Jules' UniversalServer structure (reusing existing)
interface UniversalServer {
  basic_info: ServerBasicInfo;
  cpus: CPUInfo[];
  memory: MemoryInfo;
  storage_controllers: StorageController[];
  virtual_disks: VirtualDisk[];
  physical_disks: PhysicalDisk[];
  network_adapters: NetworkAdapter[];
  power_supplies: PowerSupply[];
  management_controller?: ManagementController;
  service_contracts: ServiceContract[];
  pricing_info?: PricingInfo;
}

interface ServerBasicInfo {
  vendor: string;
  model: string;
  serial_number: string;
  service_tag?: string;
  firmware_version?: string;
}

interface CPUInfo {
  model: string;
  cores: number;
  threads: number;
  speed_ghz: number;
  socket: number;
}

interface MemoryInfo {
  total_gb: number;
  speed_mhz: number;
  memory_type: string;
  dimms: MemoryDIMM[];
}

interface MemoryDIMM {
  capacity_gb: number;
  speed_mhz: number;
  memory_type: string;
  slot: string;
}

interface StorageController {
  model: string;
  controller_type: string;
  firmware_version?: string;
  physical_disks: string[];
}

interface VirtualDisk {
  name: string;
  size_gb: number;
  raid_level: string;
  physical_disks: string[];
  status: string;
}

interface PhysicalDisk {
  id: string;
  model: string;
  size_gb: number;
  disk_type: string;
  status: string;
}

interface NetworkAdapter {
  model: string;
  port_count: number;
  speed_gbps: number;
  mac_addresses: string[];
}

interface PowerSupply {
  model: string;
  max_power_watts: number;
  efficiency_rating?: string;
}

interface ManagementController {
  controller_type: string;
  ip_address?: string;
  firmware_version?: string;
  features: string[];
}

interface ServiceContract {
  contract_type: string;
  start_date: string;
  end_date: string;
  coverage_level: string;
}

interface PricingInfo {
  base_price?: number;
  total_price?: number;
  currency?: string;
  pricing_date?: string;
}

// New vendor-specific interfaces
interface VendorCredentials {
  vendor: string;
  endpoint: string;
  username?: string;
  password?: string;
  api_key?: string;
}

interface ServerConfigSummary {
  id: string;
  name: string;
  model: string;
  vendor: string;
  last_updated: string;
  config_type: string;
}

interface CacheStatus {
  total_configs: number;
  by_vendor: { [key: string]: number };
  last_sync?: string;
  next_refresh?: string;
  cache_hit_rate: number;
}

const VendorHardwareManager: React.FC = () => {
  // File upload state (existing functionality)
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [parsedServer, setParsedServer] = useState<UniversalServer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Vendor API state (new functionality)
  const [activeTab, setActiveTab] = useState<'upload' | 'vendor'>('upload');
  const [selectedVendor, setSelectedVendor] = useState<string>('Dell');
  const [credentials, setCredentials] = useState<VendorCredentials>({
    vendor: 'Dell',
    endpoint: '',
    username: '',
    password: '',
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<ServerConfigSummary[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);

  // Load cache status on component mount
  useEffect(() => {
    loadCacheStatus();
  }, []);

  const loadCacheStatus = async () => {
    try {
      if (!isTauriAvailable()) {
        // Running in web mode - provide mock data
        setCacheStatus({
          total_configs: 0,
          by_vendor: { dell: 0, hpe: 0, lenovo: 0 },
          last_sync: 'N/A (Web Mode)',
          cache_hit_rate: 0
        });
        return;
      }
      
      const status = await invoke<CacheStatus>('get_cache_status');
      setCacheStatus(status);
    } catch (err) {
      console.error('Failed to load cache status:', err);
    }
  };

  // File upload functionality (existing)
  const handleFileSelect = useCallback(async () => {
    if (!isTauriAvailable()) {
      setError('File selection requires Tauri environment');
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Hardware Configuration Files',
          extensions: ['xml', 'xlsx', 'xls']
        }]
      });

      if (selected && typeof selected === 'string') {
        setSelectedFile(selected);
        setError(null);
      }
    } catch (err) {
      setError('Failed to select file');
    }
  }, []);

  const handleFileParse = useCallback(async () => {
    if (!selectedFile) return;

    if (!isTauriAvailable()) {
      setError('File parsing requires Tauri environment');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<UniversalServer>('parse_hardware_file', {
        filePath: selectedFile
      });
      setParsedServer(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  // Vendor API functionality (new)
  const handleCredentialsSave = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await invoke('configure_vendor_credentials', {
        vendor: credentials.vendor,
        endpoint: credentials.endpoint,
        username: credentials.username || null,
        password: credentials.password || null,
        apiKey: credentials.api_key || null,
      });
      
      // Test connection immediately after saving credentials
      const connected = await invoke<boolean>('test_vendor_connection', {
        vendor: credentials.vendor
      });
      setIsConnected(connected);
      
      if (connected) {
        // Fetch available configurations
        await fetchVendorConfigurations();
      }
    } catch (err) {
      setError(err as string);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  const fetchVendorConfigurations = useCallback(async () => {
    setIsLoading(true);
    try {
      const configs = await invoke<ServerConfigSummary[]>('fetch_vendor_configurations', {
        vendor: selectedVendor
      });
      setAvailableConfigs(configs);
      await loadCacheStatus(); // Refresh cache status
    } catch (err) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendor]);

  const fetchServerDetails = useCallback(async (serverId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const server = await invoke<UniversalServer>('fetch_server_details', {
        vendor: selectedVendor,
        serverId: serverId
      });
      setParsedServer(server);
      await loadCacheStatus(); // Refresh cache status
    } catch (err) {
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendor]);

  const testConnection = useCallback(async () => {
    if (!credentials.endpoint) {
      setError('Please enter endpoint URL');
      return;
    }

    setIsLoading(true);
    try {
      const connected = await invoke<boolean>('test_vendor_connection', {
        vendor: selectedVendor
      });
      setIsConnected(connected);
      if (!connected) {
        setError('Failed to connect to vendor API');
      }
    } catch (err) {
      setError(err as string);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [credentials.endpoint, selectedVendor]);

  return (
    <div className="vendor-hardware-manager">
      <h3>Hardware Configuration Manager</h3>
      
      {/* Tab Selection */}
      <div className="tab-container" style={{ marginBottom: '20px' }}>
        <button 
          className={`fluent-button ${activeTab === 'upload' ? 'fluent-button-primary' : 'fluent-button-secondary'}`}
          onClick={() => setActiveTab('upload')}
          style={{ marginRight: '8px' }}
        >
          📁 Upload File
        </button>
        <button 
          className={`fluent-button ${activeTab === 'vendor' ? 'fluent-button-primary' : 'fluent-button-secondary'}`}
          onClick={() => setActiveTab('vendor')}
        >
          🌐 Fetch from Vendor
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'upload' && (
        <div className="upload-section">
          <h4>Upload Configuration File</h4>
          <p>Select a vendor configuration file (Dell SCP XML, Lenovo DCSC XML, HPE iQuote):</p>
          
          <div className="file-selection">
            <button onClick={handleFileSelect} className="select-file-btn">
              📂 Select Hardware Configuration File
            </button>
            {selectedFile && (
              <div className="file-info">
                <p><strong>Selected:</strong> {selectedFile.split('/').pop()}</p>
                <button onClick={handleFileParse} disabled={isLoading}>
                  {isLoading ? 'Parsing...' : '🔍 Parse Configuration'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendor API Tab */}
      {activeTab === 'vendor' && (
        <div className="vendor-section">
          <h4>Vendor API Configuration</h4>
          
          {/* Vendor Selection */}
          <div className="vendor-selection" style={{ marginBottom: '20px' }}>
            <label>
              <strong>Vendor:</strong>
              <select 
                value={selectedVendor} 
                onChange={(e) => {
                  setSelectedVendor(e.target.value);
                  setCredentials(prev => ({ ...prev, vendor: e.target.value }));
                }}
              >
                <option value="Dell">Dell (iDRAC)</option>
                <option value="Lenovo" disabled>Lenovo (Coming Soon)</option>
                <option value="HPE" disabled>HPE (Coming Soon)</option>
              </select>
            </label>
          </div>

          {/* Credentials Form */}
          <div className="credentials-form">
            <div className="form-group">
              <label>
                <strong>iDRAC IP/Hostname:</strong>
                <input
                  type="text"
                  placeholder="https://192.168.1.100"
                  value={credentials.endpoint}
                  onChange={(e) => setCredentials(prev => ({ ...prev, endpoint: e.target.value }))}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>
                <strong>Username:</strong>
                <input
                  type="text"
                  placeholder="root"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>
                <strong>Password:</strong>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
              </label>
            </div>

            <div className="button-group">
              <button onClick={testConnection} disabled={isLoading}>
                🔌 Test Connection
              </button>
              <button onClick={handleCredentialsSave} disabled={isLoading}>
                💾 Save & Connect
              </button>
            </div>

            {/* Connection Status */}
            {isConnected !== null && (
              <div className={`connection-status ${isConnected ? 'success' : 'error'}`}>
                {isConnected ? '✅ Connected successfully' : '❌ Connection failed'}
              </div>
            )}
          </div>

          {/* Available Configurations */}
          {isConnected && (
            <div className="available-configs" style={{ marginTop: '20px' }}>
              <div className="section-header">
                <h5>Available Server Configurations</h5>
                <button onClick={fetchVendorConfigurations} disabled={isLoading}>
                  🔄 Refresh
                </button>
              </div>
              
              {availableConfigs.length > 0 ? (
                <div className="config-list">
                  {availableConfigs.map((config) => (
                    <div key={config.id} className="config-item">
                      <div className="config-info">
                        <strong>{config.name}</strong>
                        <span className="config-model">{config.model}</span>
                        <span className="config-date">Updated: {new Date(config.last_updated).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => fetchServerDetails(config.id)}
                        disabled={isLoading}
                      >
                        📥 Fetch Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No configurations found. Click "Refresh" to fetch from vendor.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cache Status */}
      {cacheStatus && (
        <div className="cache-status" style={{ marginTop: '20px' }}>
          <h5>Configuration Cache</h5>
          <div className="cache-stats">
            <span>Total Configs: {cacheStatus.total_configs}</span>
            <span>Hit Rate: {(cacheStatus.cache_hit_rate * 100).toFixed(1)}%</span>
            {Object.entries(cacheStatus.by_vendor).map(([vendor, count]) => (
              <span key={vendor}>{vendor}: {count}</span>
            ))}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Parsed Server Display (shared between both tabs) */}
      {parsedServer && (
        <div className="parsed-server">
          <h4>Server Configuration</h4>
          <div className="server-summary">
            <div className="server-basic">
              <h5>Basic Information</h5>
              <p><strong>Vendor:</strong> {parsedServer.basic_info.vendor}</p>
              <p><strong>Model:</strong> {parsedServer.basic_info.model}</p>
              <p><strong>Serial:</strong> {parsedServer.basic_info.serial_number}</p>
              {parsedServer.basic_info.service_tag && (
                <p><strong>Service Tag:</strong> {parsedServer.basic_info.service_tag}</p>
              )}
            </div>

            <div className="server-specs">
              <h5>Hardware Specifications</h5>
              <p><strong>CPUs:</strong> {parsedServer.cpus.length}x {parsedServer.cpus[0]?.model || 'Unknown'}</p>
              <p><strong>Total Cores:</strong> {parsedServer.cpus.reduce((sum, cpu) => sum + cpu.cores, 0)}</p>
              <p><strong>Memory:</strong> {parsedServer.memory.total_gb}GB {parsedServer.memory.memory_type}</p>
              <p><strong>Storage Controllers:</strong> {parsedServer.storage_controllers.length}</p>
              <p><strong>Virtual Disks:</strong> {parsedServer.virtual_disks.length}</p>
              <p><strong>Physical Disks:</strong> {parsedServer.physical_disks.length}</p>
              <p><strong>Network Adapters:</strong> {parsedServer.network_adapters.length}</p>
              <p><strong>Power Supplies:</strong> {parsedServer.power_supplies.length}</p>
            </div>

            {parsedServer.management_controller && (
              <div className="management-info">
                <h5>Management Controller</h5>
                <p><strong>Type:</strong> {parsedServer.management_controller.controller_type}</p>
                {parsedServer.management_controller.ip_address && (
                  <p><strong>IP:</strong> {parsedServer.management_controller.ip_address}</p>
                )}
              </div>
            )}
          </div>

          <details className="raw-data">
            <summary>View Raw Configuration Data</summary>
            <pre>{JSON.stringify(parsedServer, null, 2)}</pre>
          </details>
        </div>
      )}

      <style>{`
        .vendor-hardware-manager {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .tab-container {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .tab-button {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        
        .tab-button.active {
          border-bottom-color: #8b5cf6;
          color: #8b5cf6;
        }
        
        .tab-button:hover {
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }
        
        .credentials-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .connection-status {
          margin-top: 10px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .connection-status.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .connection-status.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .config-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
        }
        
        .config-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .config-model {
          color: #666;
          font-size: 0.9em;
        }
        
        .config-date {
          color: #888;
          font-size: 0.8em;
        }
        
        .cache-stats {
          display: flex;
          gap: 20px;
          font-size: 0.9em;
          color: #666;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .server-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .server-basic, .server-specs, .management-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
        }
        
        .raw-data {
          margin-top: 20px;
        }
        
        .raw-data pre {
          background: #f4f4f4;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.85em;
          max-height: 400px;
          overflow-y: auto;
        }
        
        button {
          background: #8b5cf6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        button:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }
        
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .select-file-btn {
          background: #28a745;
          margin-bottom: 15px;
        }
        
        .select-file-btn:hover {
          background: #218838;
        }
      `}</style>
    </div>
  );
};

export default VendorHardwareManager;
