import { useState, useEffect } from 'react';
import { Network, HardDrive, Server, AlertTriangle } from 'lucide-react';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { useAppStore } from '../store/useAppStore';

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
  
  // Use the shared store
  const { 
    networkTopology, 
    currentEnvironment,
    environmentSummary,
    setNetworkTopology,
    setCurrentEnvironment
  } = useAppStore();

  // Initialize mermaid on component mount
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#111827',
        primaryColor: '#8b5cf6',
        primaryTextColor: '#f9fafb',
        primaryBorderColor: '#8b5cf6',
        lineColor: '#8b5cf6',
        sectionBkgColor: '#374151',
        altSectionBkgColor: '#4b5563',
        gridColor: '#6b7280',
        secondaryColor: '#ec4899',
        tertiaryColor: '#a855f7',
        primaryColorLight: '#c4b5fd',
        mainBkg: '#1f2937',
        secondBkg: '#374151',
        tertiaryBkg: '#4b5563'
      }
    });
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
              // Clear the element first
              element.innerHTML = '';
              
              // Use a unique ID for each render
              const uniqueId = `mermaid-${Date.now()}`;
              
              // Create a temporary div to hold the mermaid syntax
              const tempDiv = document.createElement('div');
              tempDiv.className = 'mermaid';
              tempDiv.textContent = diagramDefinition;
              tempDiv.id = uniqueId;
              
              // Add to element
              element.appendChild(tempDiv);
              
              // Initialize and render
              await mermaid.run({
                nodes: [tempDiv]
              });
            }
          } catch (error) {
            console.error('Error rendering diagram:', error);
            const element = document.getElementById('mermaid-diagram');
            if (element) {
              element.innerHTML = `
                <div class="text-red-500 p-4 text-center">
                  <p class="font-medium">Error rendering diagram</p>
                  <p class="text-sm mt-2">${error}</p>
                  <p class="text-sm mt-2 opacity-75">Please check the diagram syntax</p>
                </div>
              `;
            }
          }
        }
      }
    };

    renderDiagram();
  }, [networkTopology, activeTab]);

  // Custom Tab Button Component with consistent theming
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
    <div 
      className="relative flex flex-col items-center justify-center transition-all duration-300 flex-1 cursor-pointer hover:scale-105"
      style={{ padding: '12px 16px 20px' }}
      onClick={() => onClick(tab)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} style={{ 
          color: isActive ? '#8b5cf6' : '#6b7280',
          transition: 'color 0.2s ease'
        }} />
        <span 
          className="font-medium transition-colors duration-200"
          style={{
            fontFamily: 'var(--fluent-font-family-base)',
            fontSize: '14px',
            fontWeight: isActive ? '600' : '400',
            color: isActive ? '#8b5cf6' : '#6b7280',
            lineHeight: '1.4'
          }}
        >
          {label}
        </span>
      </div>
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '16px',
          right: '16px',
          height: '3px',
          background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
          borderRadius: '2px',
          boxShadow: '0 2px 8px rgba(168, 85, 247, 0.6)'
        }} />
      )}
    </div>
  );

  return (
    <div className="fluent-page-container">
      <div className="lcm-card flex-1 overflow-auto">
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div 
              className="flex border-b border-gray-200"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px 12px 0 0',
                border: '1px solid rgba(139, 92, 246, 0.1)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
            >
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
          {!currentEnvironment && (
            <div className="fluent-alert fluent-alert-info mb-4">
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
              className="lcm-card w-full h-auto min-h-96 overflow-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizerView;