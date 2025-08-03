import { useState, useEffect } from 'react';
import { Upload, Network, HardDrive, Server, AlertTriangle } from 'lucide-react';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { useAppStore } from '../store/useAppStore';
import { openFileDialog, getFileName, isFileTypeSupported, isTauriEnvironment } from '../utils/fileUpload';
import ServerFileProcessor from '../utils/serverFileProcessor';

mermaid.initialize({ 
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    background: '#ffffff',
    primaryColor: '#f8fafc',
    primaryTextColor: '#1a202c',
    primaryBorderColor: '#8b5cf6',
    lineColor: '#8b5cf6',
    sectionBkgColor: '#f1f5f9',
    altSectionBkgColor: '#e2e8f0',
    gridColor: '#e2e8f0',
    secondaryColor: '#ec4899',
    tertiaryColor: '#a855f7',
    primaryColorLight: '#f3e8ff',
    fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
    fontSize: '14px'
  }
});

const NetworkVisualizerView = () => {
  const [activeTab, setActiveTab] = useState<'virtual' | 'hyper-v' | 'physical'>('virtual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState(false);
  
  // Initialize server processor
  const serverProcessor = new ServerFileProcessor();
  
  // Use the shared store
  const { 
    networkTopology, 
    uploadedFile, 
    processNetworkTopology,
    currentEnvironment,
    environmentSummary,
    setNetworkTopology,
    setCurrentEnvironment
  } = useAppStore();

  // Check server availability
  useEffect(() => {
    const checkServer = async () => {
      const available = await serverProcessor.isServerAvailable();
      setServerAvailable(available);
    };
    checkServer();
    // Check every 30 seconds
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Create sample network topology for demonstration
  const createSampleNetworkTopology = () => {
    return {
      clusters: [
        {
          id: 'cluster-1',
          name: 'Production Cluster',
          status: 'healthy',
          utilization: 65
        },
        {
          id: 'cluster-2', 
          name: 'Development Cluster',
          status: 'warning',
          utilization: 45
        }
      ],
      hosts: [
        {
          id: 'host-1',
          name: 'esxi-prod-01.company.com',
          cluster_id: 'cluster-1',
          cpu_cores: 32,
          memory_gb: 256,
          status: 'connected'
        },
        {
          id: 'host-2',
          name: 'esxi-prod-02.company.com', 
          cluster_id: 'cluster-1',
          cpu_cores: 32,
          memory_gb: 256,
          status: 'connected'
        },
        {
          id: 'host-3',
          name: 'esxi-dev-01.company.com',
          cluster_id: 'cluster-2', 
          cpu_cores: 16,
          memory_gb: 128,
          status: 'connected'
        }
      ],
      vms: [
        {
          id: 'vm-1',
          name: 'web-server-01',
          cluster_id: 'cluster-1',
          vcpus: 4,
          memory_gb: 16,
          storage_gb: 100,
          power_state: 'poweredOn',
          guest_os: 'Windows Server 2019'
        },
        {
          id: 'vm-2',
          name: 'database-01',
          cluster_id: 'cluster-1',
          vcpus: 8,
          memory_gb: 32,
          storage_gb: 500,
          power_state: 'poweredOn',
          guest_os: 'Ubuntu 20.04'
        },
        {
          id: 'vm-3',
          name: 'test-server-01',
          cluster_id: 'cluster-2',
          vcpus: 2,
          memory_gb: 8,
          storage_gb: 50,
          power_state: 'poweredOn',
          guest_os: 'CentOS 8'
        }
      ],
      networks: [
        {
          id: 'net_cluster-1',
          name: 'Production Network',
          type: 'cluster_network',
          cluster_id: 'cluster-1',
          vlan_id: 150
        },
        {
          id: 'net_cluster-2',
          name: 'Development Network',
          type: 'cluster_network', 
          cluster_id: 'cluster-2',
          vlan_id: 250
        },
        {
          id: 'mgmt_network',
          name: 'Management Network',
          type: 'management',
          vlan_id: 100
        },
        {
          id: 'vmotion_network',
          name: 'vMotion Network',
          type: 'vmotion',
          vlan_id: 200
        }
      ],
      platform: 'vmware' as const
    };
  };

  // Initialize with sample data if no data exists
  useEffect(() => {
    if (!networkTopology && !currentEnvironment) {
      const sampleTopology = createSampleNetworkTopology();
      setNetworkTopology(sampleTopology);
    }
  }, []);

  // Create network topology from environment data
  const createNetworkTopologyFromEnvironment = (environmentData?: any) => {
    const envData = environmentData || currentEnvironment;
    if (!envData || !envData.clusters) {
      return null;
    }

    const clusters = envData.clusters || [];
    const hosts: any[] = [];
    const vms: any[] = [];
    const networks: any[] = [];

    // Extract hosts and VMs from clusters
    clusters.forEach((cluster: any) => {
      if (cluster.hosts) {
        hosts.push(...cluster.hosts.map((host: any) => ({
          ...host,
          cluster_name: cluster.name,
          cluster_id: cluster.id
        })));
      }
      if (cluster.vms) {
        vms.push(...cluster.vms.map((vm: any) => ({
          ...vm,
          cluster_name: cluster.name,
          cluster_id: cluster.id
        })));
      }
    });

    // Create network segments based on clusters (simplified)
    clusters.forEach((cluster: any) => {
      networks.push({
        id: `net_${cluster.id}`,
        name: `${cluster.name} Network`,
        type: 'cluster_network',
        cluster_id: cluster.id,
        vlan_id: Math.floor(Math.random() * 1000) + 100 // Simulated VLAN ID
      });
    });

    // Add management networks
    if (clusters.length > 0) {
      networks.push({
        id: 'mgmt_network',
        name: 'Management Network',
        type: 'management',
        vlan_id: 100
      });
      
      networks.push({
        id: 'vmotion_network',
        name: 'vMotion Network',
        type: 'vmotion',
        vlan_id: 200
      });
    }

    return {
      clusters,
      hosts,
      vms,
      networks,
      platform: 'vmware' as const
    };
  };  // Update network topology when environment changes
  useEffect(() => {
    if (currentEnvironment && !networkTopology) {
      const topology = createNetworkTopologyFromEnvironment();
      if (topology) {
        // Update the store with the created topology
        setNetworkTopology(topology);
      }
    }
  }, [currentEnvironment, networkTopology, setNetworkTopology]);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'base',
      themeVariables: {
        primaryColor: '#8b5cf6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#6d28d9',
        lineColor: '#a855f7',
        sectionBkgColor: '#1f2937',
        altSectionBkgColor: '#374151',
        gridColor: '#4b5563',
        secondaryColor: '#ec4899',
        tertiaryColor: '#3b82f6',
        background: '#111827',
        mainBkg: '#1f2937',
        secondBkg: '#374151',
        tertiaryBkg: '#4b5563'
      }
    });
  }, []);

  const handleFileUpload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selected = await openFileDialog({
        multiple: false,
        accept: ['csv', 'json', 'xml', 'txt', 'xlsx']
      });

      if (!selected) {
        return;
      }

      // Validate file type
      if (!isFileTypeSupported(selected, ['csv', 'json', 'xml', 'txt', 'xlsx'])) {
        throw new Error('Unsupported file format. Please upload a CSV, JSON, XML, TXT, or XLSX file.');
      }
      
      if (isTauriEnvironment() && typeof selected === 'string') {
        // Tauri environment - process with backend
        await processNetworkTopology(selected);
      } else if (selected instanceof File) {
        // Web environment - check if it's an Excel file and server is available
        const fileName = selected.name.toLowerCase();
        
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          if (serverAvailable) {
            // Use server processing for Excel files
            const result = await serverProcessor.processVMwareFile(selected);
            
            // If we received environment data, update the store
            if (result && typeof result === 'object' && result.clusters) {
              setCurrentEnvironment(result);
              
              // Create network topology from the environment data
              const topology = createNetworkTopologyFromEnvironment(result);
              if (topology) {
                setNetworkTopology(topology);
              }
              
              setError(null);
            } else {
              console.log("File processed, but no environment data received.", result);
              throw new Error('No valid environment data received from server processing.');
            }
          } else {
            throw new Error('Excel file processing requires the backend server. Please start the server or use a CSV file.');
          }
        } else {
          // For CSV and other text files, show a message for now
          // In the future, you could implement client-side CSV parsing here
          throw new Error('CSV and text file network topology analysis is not yet implemented in the web version. Please use an Excel/XLSX RVTools export or the desktop application.');
        }
      } else {
        throw new Error('Invalid file selection.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mermaid diagram based on active tab and topology data
  const generateDiagram = () => {
    if (!networkTopology) return '';
    
    switch (activeTab) {
      case 'virtual':
        return generateVirtualDiagram(networkTopology);
      case 'hyper-v':
        return generateHyperVDiagram(networkTopology);
      case 'physical':
        return generatePhysicalDiagram(networkTopology);
      default:
        return '';
    }
  };

  // Render diagram when topology or active tab changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (networkTopology) {
        const diagramDefinition = generateDiagram();
        if (diagramDefinition) {
          try {
            const element = document.getElementById('mermaid-diagram');
            if (element) {
              element.innerHTML = diagramDefinition;
              await mermaid.run();
            }
          } catch (error) {
            console.error('Error rendering diagram:', error);
          }
        }
      }
    };

    renderDiagram();
  }, [networkTopology, activeTab]);

  // Custom Tab Button Component
  const TabButton = ({ 
    tab, 
    isActive, 
    onClick, 
    icon: Icon, 
    label 
  }: {
    tab: 'virtual' | 'hyper-v' | 'physical';
    isActive: boolean;
    onClick: (tab: 'virtual' | 'hyper-v' | 'physical') => void;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => onClick(tab)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isActive 
          ? 'fluent-button-accent' 
          : 'fluent-button-secondary'
        }
      `}
      style={{
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size-body)',
        fontWeight: 'var(--font-weight-medium)'
      }}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div style={{ 
      width: '100%',
      height: '100vh',
      padding: '0',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="lcm-card" style={{ width: '100%', flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px' }}>
          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ 
              fontFamily: 'var(--font-family)',
              color: 'var(--color-neutral-foreground)',
              fontSize: 'var(--font-size-title3)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Upload Network Data
            </h2>
          {!isTauriEnvironment() && (
            <div className="mb-4 space-y-2">
              {/* Server Status Indicator */}
              <div className={`p-3 border rounded-lg ${
                serverAvailable 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    serverAvailable ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm">
                    {serverAvailable 
                      ? 'Backend server available - Excel files supported' 
                      : 'Backend server offline - Only desktop application supports full functionality'
                    }
                  </span>
                </div>
              </div>
              
              {/* Feature Information */}
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span className="text-sm">
                    Network topology visualization from RVTools Excel exports {serverAvailable ? 'is supported' : 'requires the backend server'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={handleFileUpload}
              disabled={isLoading}
              className="fluent-button fluent-button-primary flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {isLoading ? 'Processing...' : 'Upload Network File'}
            </button>
            
            {uploadedFile && (
              <div style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
                <span className="text-sm">Uploaded: </span>
                <span style={{ 
                  color: 'var(--color-brand-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {uploadedFile.split('/').pop() || uploadedFile.split('\\').pop() || 'Unknown file'}
                </span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-3">
              <TabButton
                tab="virtual"
                isActive={activeTab === 'virtual'}
                onClick={setActiveTab}
                icon={Network}
                label="Virtual Networks"
              />
              <TabButton
                tab="hyper-v"
                isActive={activeTab === 'hyper-v'}
                onClick={setActiveTab}
                icon={HardDrive}
                label="Hyper-V Topology"
              />
              <TabButton
                tab="physical"
                isActive={activeTab === 'physical'}
                onClick={setActiveTab}
                icon={Server}
                label="Physical Infrastructure"
              />
            </div>
          </div>

          {/* Data Source Indicator */}
          {!currentEnvironment && !uploadedFile && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span className="text-sm">
                  Currently showing sample data. Upload an RVTools file to visualize your actual infrastructure.
                </span>
              </div>
            </div>
          )}

          {/* Diagram Container */}
          {networkTopology && (
            <div 
              id="mermaid-diagram" 
              className="w-full h-auto min-h-[400px] rounded-lg p-4 overflow-auto"
              style={{ 
                fontFamily: 'var(--font-family)',
                fontSize: '14px',
                backgroundColor: 'var(--color-neutral-background-secondary)',
                border: '1px solid var(--color-neutral-stroke-tertiary)'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizerView;