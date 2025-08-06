import { useState, useEffect } from 'react';
import { Network, HardDrive, Server, AlertTriangle } from 'lucide-react';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { useAppStore } from '../store/useAppStore';

// Define consistent color palette for diagrams
const DIAGRAM_THEME = {
  // Primary colors - Purple theme to match app
  primary: '#8b5cf6',      // Main purple
  primaryLight: '#c4b5fd',  // Light purple
  primaryDark: '#6d28d9',   // Dark purple
  
  // Secondary colors 
  secondary: '#ec4899',     // Pink accent
  secondaryLight: '#f9a8d4', // Light pink
  
  // Tertiary colors
  tertiary: '#3b82f6',      // Blue
  tertiaryLight: '#93c5fd', // Light blue
  
  // Status colors
  success: '#10b981',       // Green
  warning: '#f59e0b',       // Orange  
  error: '#ef4444',         // Red
  info: '#06b6d4',          // Cyan
  
  // Neutral colors
  neutral: '#6b7280',       // Gray
  neutralLight: '#d1d5db',  // Light gray
  neutralDark: '#374151',   // Dark gray
  
  // Background colors
  bgPrimary: '#ffffff',     // White
  bgSecondary: '#f8fafc',   // Very light gray
  bgTertiary: '#f1f5f9',    // Light gray
  
  // Text colors
  textPrimary: '#1a202c',   // Dark gray/black
  textSecondary: '#4b5563', // Medium gray
  textLight: '#ffffff',     // White
};

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

  // Initialize mermaid on component mount with consistent theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        background: DIAGRAM_THEME.bgPrimary,
        primaryColor: DIAGRAM_THEME.bgSecondary,
        primaryTextColor: DIAGRAM_THEME.textPrimary,
        primaryBorderColor: DIAGRAM_THEME.primary,
        lineColor: DIAGRAM_THEME.primary,
        sectionBkgColor: DIAGRAM_THEME.bgTertiary,
        altSectionBkgColor: DIAGRAM_THEME.neutralLight,
        gridColor: DIAGRAM_THEME.neutralLight,
        secondaryColor: DIAGRAM_THEME.secondary,
        tertiaryColor: DIAGRAM_THEME.tertiary,
        primaryColorLight: DIAGRAM_THEME.primaryLight,
        fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '500'
      },
      flowchart: {
        nodeSpacing: 50,
        rankSpacing: 60,
        curve: 'basis',
        padding: 15
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

  // Generate mermaid diagram based on active tab and topology data
  const generateDiagram = () => {
    if (!networkTopology) {
      console.warn('No network topology available');
      return '';
    }
    
    try {
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
    } catch (error) {
      console.error('Error generating diagram definition:', error);
      return `graph TD\n  ERROR["⚠️ Error generating diagram"]`;
    }
  };

  // Render diagram when topology or active tab changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (networkTopology) {
        const diagramDefinition = generateDiagram();
        
        if (!diagramDefinition || diagramDefinition.trim() === '') {
          const element = document.getElementById('mermaid-diagram');
          if (element) {
            element.innerHTML = `
              <div class="border border-gray-200 rounded-lg p-6 text-center">
                <div class="text-gray-400 mb-2">
                  <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <p class="font-medium text-gray-600 mb-1">No diagram data available</p>
                <p class="text-sm text-gray-500">Upload an RVTools file or configure your infrastructure to generate network diagrams</p>
              </div>
            `;
          }
          return;
        }
        
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
              let errorMessage = 'Unknown error occurred';
              
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              } else if (error && typeof error === 'object') {
                // Handle cases where error is an object
                errorMessage = JSON.stringify(error, null, 2);
              }
              
              // Log the diagram definition for debugging
              console.error('Failed diagram definition:', diagramDefinition);
              
              element.innerHTML = `
                <div class="border border-red-200 rounded-lg p-6 text-center">
                  <div class="text-red-600 mb-2">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <p class="font-semibold text-red-800 mb-2">Error rendering diagram</p>
                  <p class="text-sm text-red-600 mb-2">${errorMessage}</p>
                  <p class="text-xs text-red-500 opacity-75">Check browser console for more details</p>
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
          boxShadow: 'none'
        }} />
      )}
    </div>
  );

  return (
    <div className="fluent-page-container">
      <div className="lcm-card">
        {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 border border-red-500/30 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div 
          className="flex"
          style={{
            background: 'transparent'
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
        <div className="mb-4 p-3 rounded-lg bg-transparent">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-purple-400" />
            <span className="text-sm text-gray-600">
              Currently showing sample data. Upload an RVTools file to visualize your actual infrastructure.
            </span>
          </div>
        </div>
      )}

      {/* Diagram Container - Direct rendering without card wrapper */}
      {networkTopology && (
        <div 
          id="mermaid-diagram" 
          className="w-full h-auto min-h-96 overflow-auto rounded-lg bg-transparent p-4"
        />
      )}
      </div>
    </div>
  );
};

export default NetworkVisualizerView;