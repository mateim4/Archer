import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Network, HardDrive, Server, AlertTriangle } from 'lucide-react';
import { 
  GlobeRegular,
  ServerRegular,
  CloudRegular,
  DiagramRegular,
  BookRegular
} from '@fluentui/react-icons';
import mermaid from 'mermaid';
import { generateVirtualDiagram, generateHyperVDiagram, generatePhysicalDiagram } from '../utils/mermaidGenerator';
import { generateVMwareNetworkTopology, generateHyperVNetworkTopology, generatePhysicalNetworkTopology } from '../utils/networkTopologyGenerator';
import { useAppStore } from '../store/useAppStore';
import NetworkComponentGuide from '../components/NetworkComponentGuide';
import VisualNetworkDiagram from '../components/VisualNetworkDiagram';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'virtual' | 'hyper-v' | 'physical' | 'guide'>('overview');
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
        fontFamily: 'Oxanium, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, ui-sans-serif, Helvetica, Arial, sans-serif',
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
      return `graph TD\n  ERROR["[ERROR] Error generating diagram"]`;
    }
  };

  // Render diagram when topology or active tab changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (activeTab !== 'overview' && networkTopology) {
        const diagramDefinition = generateDiagram();
        
        if (!diagramDefinition || diagramDefinition.trim() === '') {
          const element = document.getElementById('mermaid-diagram');
          if (element) {
            const safeHTML = DOMPurify.sanitize(`
              <div class="border border-gray-200 rounded-lg p-6 text-center">
                <div class="text-gray-400 mb-2">
                  <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <p class="font-medium text-gray-600 mb-1">No diagram data available</p>
                <p class="text-sm text-gray-500">Upload an RVTools file or configure your infrastructure to generate network diagrams</p>
              </div>
            `);
            element.innerHTML = safeHTML;
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

  const getNetworkOverview = () => [
    { 
      title: 'Total Networks', 
      value: networkTopology?.networks?.length || 0, 
      icon: <GlobeRegular />, 
      change: 'Management, vMotion, VM networks',
      color: '#0066cc'
    },
    { 
      title: 'Clusters Mapped', 
      value: networkTopology?.clusters?.length || 0, 
      icon: <ServerRegular />, 
      change: 'Active infrastructure clusters',
      color: '#16a34a'
    },
    { 
      title: 'Network Segments', 
      value: networkTopology?.networks?.filter(n => n.type === 'cluster_network')?.length || 0, 
      icon: <DiagramRegular />, 
      change: 'Isolated network zones',
      color: '#dc2626'
    },
    { 
      title: 'Platform Type', 
      value: networkTopology?.platform === 'vmware' ? 'VMware' : 'Unknown', 
      icon: <CloudRegular />, 
      change: 'Current virtualization',
      color: '#7c3aed'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {getNetworkOverview().map((stat, index) => (
              <div
                key={index}
                style={{
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center' as const,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ color: stat.color, fontSize: '24px', marginBottom: '12px' }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '12px' }}>
                  {stat.title}
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  border: '1px solid rgba(59, 130, 246, 0.3)', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#374151'
                }}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        );

      case 'guide':
        return <NetworkComponentGuide />;

      case 'virtual':
      case 'hyper-v':
      case 'physical':
        const renderVisualDiagram = () => {
          let topologyData;
          let technology: 'vmware' | 'hyperv' | 'physical';
          
          switch (activeTab) {
            case 'virtual':
              topologyData = generateVMwareNetworkTopology(networkTopology || undefined);
              technology = 'vmware';
              break;
            case 'hyper-v':
              topologyData = generateHyperVNetworkTopology(networkTopology || undefined);
              technology = 'hyperv';
              break;
            case 'physical':
              topologyData = generatePhysicalNetworkTopology();
              technology = 'physical';
              break;
            default:
              return null;
          }

          return (
            <VisualNetworkDiagram
              technology={technology}
              nodes={topologyData.nodes}
              connections={topologyData.connections}
              width={1400}
              height={900}
            />
          );
        };

        return (
          <div>
            {/* Data Source Indicator */}
            {!currentEnvironment && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: '#a855f7' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    Currently showing sample data. Upload an RVTools file to visualize your actual infrastructure.
                  </span>
                </div>
              </div>
            )}

            {/* Technology-specific information panel */}
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {activeTab === 'virtual' ? (
                  <>
                    <CloudRegular style={{ color: '#16a34a' }} />
                    VMware vSphere Environment
                  </>
                ) : activeTab === 'hyper-v' ? (
                  <>
                    <ServerRegular style={{ color: '#0066cc' }} />
                    Microsoft Hyper-V Environment
                  </>
                ) : (
                  <>
                    <GlobeRegular style={{ color: '#f59e0b' }} />
                    Physical Infrastructure
                  </>
                )}
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {activeTab === 'virtual' && (
                  <>
                    <div><strong>Management:</strong> vCenter Server, DVS, Port Groups</div>
                    <div><strong>Virtualization:</strong> ESXi Hosts, VMkernel Adapters</div>
                    <div><strong>Networking:</strong> VLAN Segmentation, vMotion, Storage</div>
                    <div><strong>Features:</strong> DRS, HA, vMotion, Storage vMotion</div>
                  </>
                )}
                {activeTab === 'hyper-v' && (
                  <>
                    <div><strong>Management:</strong> SCVMM, Failover Clustering</div>
                    <div><strong>Virtualization:</strong> Hyper-V Hosts, Generation 2 VMs</div>
                    <div><strong>Networking:</strong> Virtual Switches, NIC Teaming</div>
                    <div><strong>Features:</strong> Live Migration, CSV, Dynamic Memory</div>
                  </>
                )}
                {activeTab === 'physical' && (
                  <>
                    <div><strong>Core:</strong> Redundant Core Switches, 100GbE</div>
                    <div><strong>Distribution:</strong> L3 Switching, VLAN Routing</div>
                    <div><strong>Security:</strong> Next-Gen Firewalls, DMZ</div>
                    <div><strong>Services:</strong> Load Balancing, Storage Arrays</div>
                  </>
                )}
              </div>
            </div>

            {/* Visual Network Diagram */}
            <div style={{
              borderRadius: '12px',
              WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              border: '1px solid rgba(139, 92, 246, 0.1)',
              overflow: 'hidden'
            }}>
              {renderVisualDiagram()}
            </div>
            
            {!networkTopology && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
                <Server size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No network topology data available.</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Upload infrastructure data to generate network diagrams.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="lcm-page-container">
        {/* Error Display */}
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

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
            { id: 'overview', label: 'Overview', icon: <DiagramRegular /> },
            { id: 'virtual', label: 'Virtual Networks', icon: <GlobeRegular /> },
            { id: 'hyper-v', label: 'Hyper-V Topology', icon: <ServerRegular /> },
            { id: 'physical', label: 'Physical Infrastructure', icon: <CloudRegular /> },
            { id: 'guide', label: 'Component Guide', icon: <BookRegular /> }
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
      </div>
    </div>
  );
};

export default NetworkVisualizerView;