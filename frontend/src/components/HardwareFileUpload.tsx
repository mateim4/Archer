import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import LoadingSpinner from './LoadingSpinner';

// TypeScript interface for Jules' UniversalServer structure
interface UniversalServer {
  vendor: string;
  model_name?: string;
  base_chassis_part_number?: string;
  serial_number?: string;
  cpus: CPU[];
  memory: MemoryDIMM[];
  storage_controllers: StorageController[];
  physical_disks: PhysicalDisk[];
  virtual_disks: VirtualDiskConfig[];
  network_adapters: NetworkAdapter[];
  power_supplies: PowerSupply[];
  management?: ManagementController;
  services: ServiceContract[];
  pricing?: PricingInfo;
}

interface CPU {
  vendor_part_number?: string;
  model_string?: string;
  core_count?: number;
  thread_count?: number;
  speed_ghz?: number;
  vendor_specific_attributes: { [key: string]: string };
}

interface MemoryDIMM {
  vendor_part_number?: string;
  capacity_gb?: number;
  speed_mhz?: number;
  memory_type?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface StorageController {
  fqdd?: string;
  vendor_part_number?: string;
  model?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface PhysicalDisk {
  fqdd?: string;
  vendor_part_number?: string;
  model?: string;
  capacity_gb?: number;
  disk_type?: string;
  interface_type?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface VirtualDiskConfig {
  fqdd?: string;
  name?: string;
  raid_level?: string;
  member_disks: string[];
  vendor_specific_attributes: { [key: string]: string };
}

interface NetworkAdapter {
  fqdd?: string;
  vendor_part_number?: string;
  model?: string;
  ports: NetworkPort[];
  vendor_specific_attributes: { [key: string]: string };
}

interface NetworkPort {
  speed_gbps?: number;
  port_type?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface PowerSupply {
  fqdd?: string;
  vendor_part_number?: string;
  wattage?: number;
  efficiency_rating?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface ManagementController {
  fqdd?: string;
  vendor_part_number?: string;
  firmware_version?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface ServiceContract {
  contract_type?: string;
  duration_years?: number;
  support_level?: string;
  vendor_specific_attributes: { [key: string]: string };
}

interface PricingInfo {
  base_price?: number;
  currency?: string;
  discount_percentage?: number;
  final_price?: number;
  vendor_specific_attributes: { [key: string]: string };
}

export const HardwareFileUpload: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<UniversalServer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Open file dialog for hardware configuration files
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: 'Hardware Configuration Files',
            extensions: ['xml', 'xls', 'xlsx', 'json']
          },
          {
            name: 'Dell SCP Files',
            extensions: ['xml']
          },
          {
            name: 'Lenovo DCSC Files',
            extensions: ['xml']
          },
          {
            name: 'HPE iQuote Files',
            extensions: ['xls', 'xlsx']
          }
        ]
      });

      if (!filePath || Array.isArray(filePath)) {
        setIsLoading(false);
        return;
      }

      // Call Jules' universal hardware parser
      const result = await invoke<UniversalServer>('parse_hardware_file', {
        filePath: filePath
      });

      setParsedData(result);
      console.log('Successfully parsed hardware configuration:', result);
      
    } catch (err) {
      console.error('Error parsing hardware file:', err);
      setError(err as string);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renderServerInfo = (server: UniversalServer) => {
    return (
      <div className="fluent-card">
        <h3 style={{ marginBottom: 'var(--fluent-spacing-horizontal-m)' }}>
          Hardware Configuration Summary
        </h3>
        
        <div style={{ marginBottom: 'var(--fluent-spacing-horizontal-l)' }}>
          <h4>Basic Information</h4>
          <p><strong>Vendor:</strong> {server.vendor}</p>
          {server.model_name && <p><strong>Model:</strong> {server.model_name}</p>}
          {server.serial_number && <p><strong>Serial Number:</strong> {server.serial_number}</p>}
        </div>

        {server.cpus.length > 0 && (
          <div style={{ marginBottom: 'var(--fluent-spacing-horizontal-l)' }}>
            <h4>CPUs ({server.cpus.length})</h4>
            {server.cpus.map((cpu, index) => (
              <div key={index} style={{ marginLeft: 'var(--fluent-spacing-horizontal-m)' }}>
                {cpu.model_string && <p>Model: {cpu.model_string}</p>}
                {cpu.core_count && <p>Cores: {cpu.core_count}</p>}
                {cpu.speed_ghz && <p>Speed: {cpu.speed_ghz} GHz</p>}
              </div>
            ))}
          </div>
        )}

        {server.memory.length > 0 && (
          <div style={{ marginBottom: 'var(--fluent-spacing-horizontal-l)' }}>
            <h4>Memory ({server.memory.length} DIMMs)</h4>
            <p>Total Capacity: {server.memory.reduce((sum, dimm) => sum + (dimm.capacity_gb || 0), 0)} GB</p>
          </div>
        )}

        {server.physical_disks.length > 0 && (
          <div style={{ marginBottom: 'var(--fluent-spacing-horizontal-l)' }}>
            <h4>Storage ({server.physical_disks.length} disks)</h4>
            <p>Total Capacity: {server.physical_disks.reduce((sum, disk) => sum + (disk.capacity_gb || 0), 0)} GB</p>
          </div>
        )}

        {server.network_adapters.length > 0 && (
          <div style={{ marginBottom: 'var(--fluent-spacing-horizontal-l)' }}>
            <h4>Network Adapters ({server.network_adapters.length})</h4>
            {server.network_adapters.map((adapter, index) => (
              <div key={index} style={{ marginLeft: 'var(--fluent-spacing-horizontal-m)' }}>
                {adapter.model && <p>Model: {adapter.model}</p>}
                <p>Ports: {adapter.ports.length}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--fluent-spacing-horizontal-l)' }}>
        <h2>Universal Hardware Parser</h2>
        <p style={{ color: 'var(--fluent-color-neutral-foreground-2)', marginBottom: 'var(--fluent-spacing-horizontal-m)' }}>
          Upload hardware configuration files from Dell (SCP), Lenovo (DCSC), or HPE (iQuote) to parse server specifications.
        </p>
        
        <button
          onClick={handleFileUpload}
          disabled={isLoading}
          style={{
            padding: 'var(--fluent-spacing-horizontal-s) var(--fluent-spacing-horizontal-l)',
            backgroundColor: 'var(--fluent-color-brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--fluent-border-radius-medium)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--fluent-spacing-horizontal-s)'
          }}
        >
          {isLoading && <LoadingSpinner />}
          {isLoading ? 'Parsing...' : 'Select Hardware Configuration File'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: 'var(--fluent-spacing-horizontal-m)',
          backgroundColor: 'transparent',
          border: '1px solid rgba(196, 43, 28, 0.3)',
          borderRadius: 'var(--fluent-border-radius-medium)',
          color: '#C42B1C',
          marginBottom: 'var(--fluent-spacing-horizontal-l)'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {parsedData && (
        <div>
          {renderServerInfo(parsedData)}
          
          <details style={{ marginTop: 'var(--fluent-spacing-horizontal-m)' }}>
            <summary style={{ cursor: 'pointer', padding: 'var(--fluent-spacing-horizontal-s)' }}>
              View Raw JSON Data
            </summary>
            <pre style={{
              backgroundColor: 'var(--fluent-color-surface-secondary)',
              padding: 'var(--fluent-spacing-horizontal-m)',
              borderRadius: 'var(--fluent-border-radius-medium)',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: 'var(--fluent-spacing-horizontal-s)'
            }}>
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};
