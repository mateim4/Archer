import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { renderToString } from 'react-dom/server';
import { PremiumColor, EyeRegular, EyeOffRegular, AddRegular } from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';
import { tokens } from '@/styles/design-tokens';
import SearchWithDropdown from '../SearchWithDropdown';
import SimpleVisualizer from './SimpleVisualizer';
import { ClusterData, HostData, VMData } from '../../types/capacityVisualizer';

interface CapacityCanvasProps {
  state: any; // Simplified for now
  onVMMove?: (vmIds: string[], targetHostId: string) => void;
  onVMSelect?: (vmIds: string[], isMultiSelect: boolean) => void;
  onTooltipUpdate?: (data: any) => void;
  onStateUpdate?: (newState: any) => void; // Callback to update parent state
  onClusterToggle?: (clusterId: string) => void;
  onAddCluster?: () => void;
}

export const CapacityCanvas: React.FC<CapacityCanvasProps> = ({
  state,
  onVMMove = () => {},
  onVMSelect = () => {},
  onTooltipUpdate = () => {},
  onStateUpdate = () => {},
  onClusterToggle = () => {},
  onAddCluster = () => {}
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTransformRef = useRef<any>(null); // Store current zoom transform
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [selectedVMs, setSelectedVMs] = useState<Set<string>>(new Set());
  const [migrationHistory, setMigrationHistory] = useState<Array<{
    id: string;
    vmId: string;
    vmName: string;
    sourceCluster: string;
    targetCluster: string;
    timestamp: Date;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [advancedVisualizer, setAdvancedVisualizer] = useState<boolean>(false);
  const [showFreeSpace, setShowFreeSpace] = useState<boolean>(true);
  const [visualizationMode, setVisualizationMode] = useState<'cpu' | 'memory' | 'storage'>('cpu');
  const [ocRatios, setOcRatios] = useState({
    cpu: 3,
    memory: 1.5,
    storage: 2
  });

  // Transform state data for SimpleVisualizer with improved error handling
  const prepareSimpleVisualizerData = () => {
    const clusters: any[] = [];
    
    // Enhanced debug logging
    console.log('State data for SimpleVisualizer:', state);
    console.log('Clusters available:', state?.clusters?.length || 0);
    console.log('Raw clusters structure:', JSON.stringify(state?.clusters, null, 2));
    
    
    // Enhanced data validation and error handling
    if (!state) {
      console.warn('No state data available for SimpleVisualizer');
      return [];
    }

    if (!state.clusters || !Array.isArray(state.clusters)) {
      console.warn('No clusters array found in state, creating sample data');
      // Return sample data if no real data is available
      console.log('Creating enhanced sample data with multiple clusters');
      return [
        {
          id: 'production-cluster',
          name: 'Production Cluster',
          overcommitRatio: ocRatios,
          hosts: [
            {
              id: 'prod-host-1',
              name: 'ESX-PROD-01',
              totalCores: 32,
              totalMemory: 131072, // 128GB in MB
              totalStorage: 2048, // 2TB in GB
              vms: [
                {
                  id: 'prod-vm-1',
                  name: 'WEB-SERVER-01',
                  cores: 2,
                  cpus: 2,
                  allocatedVCPUs: 4,
                  memory: 8192, // 8GB in MB
                  storage: 100,
                  host: 'ESX-PROD-01',
                  cluster: 'Production Cluster'
                },
                {
                  id: 'prod-vm-2', 
                  name: 'DB-SERVER-01',
                  cores: 4,
                  cpus: 2,
                  allocatedVCPUs: 8,
                  memory: 16384, // 16GB in MB
                  storage: 200,
                  host: 'ESX-PROD-01',
                  cluster: 'Production Cluster'
                },
                {
                  id: 'prod-vm-3', 
                  name: 'API-SERVER-01',
                  cores: 2,
                  cpus: 1,
                  allocatedVCPUs: 2,
                  memory: 4096, // 4GB in MB
                  storage: 50,
                  host: 'ESX-PROD-01',
                  cluster: 'Production Cluster'
                }
              ]
            },
            {
              id: 'prod-host-2',
              name: 'ESX-PROD-02',
              totalCores: 32,
              totalMemory: 131072, // 128GB in MB
              totalStorage: 2048, // 2TB in GB
              vms: [
                {
                  id: 'prod-vm-4',
                  name: 'MAIL-SERVER-01',
                  cores: 4,
                  cpus: 1,
                  allocatedVCPUs: 4,
                  memory: 12288, // 12GB in MB
                  storage: 150,
                  host: 'ESX-PROD-02',
                  cluster: 'Production Cluster'
                },
                {
                  id: 'prod-vm-5', 
                  name: 'FILE-SERVER-01',
                  cores: 2,
                  cpus: 2,
                  allocatedVCPUs: 4,
                  memory: 8192, // 8GB in MB
                  storage: 500,
                  host: 'ESX-PROD-02',
                  cluster: 'Production Cluster'
                }
              ]
            }
          ]
        },
        {
          id: 'development-cluster',
          name: 'Development Cluster',
          overcommitRatio: ocRatios,
          hosts: [
            {
              id: 'dev-host-1',
              name: 'ESX-DEV-01',
              totalCores: 16,
              totalMemory: 65536, // 64GB in MB
              totalStorage: 1024, // 1TB in GB
              vms: [
                {
                  id: 'dev-vm-1',
                  name: 'DEV-WEB-01',
                  cores: 1,
                  cpus: 2,
                  allocatedVCPUs: 2,
                  memory: 4096, // 4GB in MB
                  storage: 50,
                  host: 'ESX-DEV-01',
                  cluster: 'Development Cluster'
                },
                {
                  id: 'dev-vm-2', 
                  name: 'DEV-DB-01',
                  cores: 2,
                  cpus: 1,
                  allocatedVCPUs: 2,
                  memory: 8192, // 8GB in MB
                  storage: 100,
                  host: 'ESX-DEV-01',
                  cluster: 'Development Cluster'
                },
                {
                  id: 'dev-vm-3', 
                  name: 'TEST-ENV-01',
                  cores: 1,
                  cpus: 1,
                  allocatedVCPUs: 1,
                  memory: 2048, // 2GB in MB
                  storage: 25,
                  host: 'ESX-DEV-01',
                  cluster: 'Development Cluster'
                }
              ]
            }
          ]
        }
      ];
    }

    if (state.clusters.length > 0) {
      state.clusters.forEach((cluster: any) => {
        const transformedCluster: {
          id: string;
          name: string;
          overcommitRatio: any;
          hosts: HostData[];
        } = {
          id: cluster.id || cluster.name,
          name: cluster.name,
          overcommitRatio: ocRatios,
          hosts: []
        };
        
        // Handle direct hosts array (new structure)
        if (cluster.hosts && Array.isArray(cluster.hosts)) {
          cluster.hosts.forEach((host: any) => {
            const transformedHost: HostData = {
              id: host.id || host.name || `host-${Math.random()}`,
              name: host.name || 'Unknown Host',
              clusterId: cluster.id || cluster.name,
              totalCores: host.totalCores || 32,
              totalRAMGB: host.totalRAMGB || (host.totalMemory || 128),
              totalStorageGB: host.totalStorageGB || host.totalStorage || 2048,
              vms: (host.vms || []).map((vm: any): VMData => ({
                id: vm.id || `vm-${Math.random()}`,
                name: vm.name || 'Unknown VM',
                allocatedVCPUs: vm.allocatedVCPUs || ((vm.cores || 1) * (vm.cpus || 1)),
                allocatedRAMGB: vm.allocatedRAMGB || (vm.memory || 16),
                provisonedStorageGB: vm.provisonedStorageGB || vm.storage || 100,
                hostId: host.id || host.name || '',
                clusterId: cluster.id || cluster.name,
                isLocked: vm.isLocked || false,
                groupId: vm.groupId
              })),
              hardwareDetails: {
                cpuModel: host.cpuModel || 'Unknown CPU',
                socketCount: host.socketCount || 2,
                coresPerSocket: host.coresPerSocket || 16,
                ramType: host.ramType || 'DDR4',
                storageType: host.storageType || 'SSD'
              }
            };
            transformedCluster.hosts.push(transformedHost);
          });
        } else {
          // Fallback for legacy structure with leftSide/rightSide
          ['leftSide', 'rightSide'].forEach(side => {
            const hosts = cluster[side]?.hosts || [];
            hosts.forEach((host: any) => {
              const transformedHost: HostData = {
                id: host.host?.id || host.host?.name || `host-${Math.random()}`,
                name: host.host?.name || 'Unknown Host',
                clusterId: cluster.id || cluster.name,
                totalCores: host.host?.totalCores || 32,
                totalRAMGB: host.host?.totalMemory || 128,
                totalStorageGB: host.host?.totalStorage || 2048,
                vms: (host.vms || []).map((vm: any): VMData => ({
                  id: vm.id || `vm-${Math.random()}`,
                  name: vm.name || 'Unknown VM',
                  allocatedVCPUs: vm.allocatedVCPUs || ((vm.cores || 1) * (vm.cpus || 1)),
                  allocatedRAMGB: vm.memory || 16,
                  provisonedStorageGB: vm.storage || 100,
                  hostId: host.host?.id || host.host?.name || '',
                  clusterId: cluster.id || cluster.name,
                  isLocked: vm.isLocked || false,
                  groupId: vm.groupId
                })),
                hardwareDetails: {
                  cpuModel: host.host?.cpuModel || 'Unknown CPU',
                  socketCount: host.host?.socketCount || 2,
                  coresPerSocket: host.host?.coresPerSocket || 16,
                  ramType: host.host?.ramType || 'DDR4',
                  storageType: host.host?.storageType || 'SSD'
                }
              };
              transformedCluster.hosts.push(transformedHost);
            });
          });
        }
        
        clusters.push(transformedCluster);
      });
      
      console.log('Transformed clusters from real data:', clusters);
    } else {
      // Fallback sample data for testing when no clusters exist
      console.log('No clusters found in state, creating sample data');
      clusters.push(
        {
          id: 'sample-source',
          name: 'Source Cluster A',
          overcommitRatio: { cpu: 3, memory: 1.5, storage: 2 },
          hosts: [
            {
              id: 'host-1',
              name: 'ESX-HOST-01',
              totalCores: 32,
              totalMemory: 128 * 1024,
              totalStorage: 2 * 1024,
              vms: [
                {
                  id: 'vm-1',
                  name: 'WEB-SERVER-01',
                  cores: 2,
                  cpus: 2,
                  allocatedVCPUs: 4,
                  memory: 8 * 1024,
                  storage: 100,
                  host: 'ESX-HOST-01',
                  cluster: 'Source Cluster A'
                },
                {
                  id: 'vm-2',
                  name: 'DB-SERVER-01',
                  cores: 4,
                  cpus: 2,
                  allocatedVCPUs: 8,
                  memory: 16 * 1024,
                  storage: 500,
                  host: 'ESX-HOST-01',
                  cluster: 'Source Cluster A'
                }
              ]
            },
            {
              id: 'host-2',
              name: 'ESX-HOST-02',
              totalCores: 24,
              totalMemory: 96 * 1024,
              totalStorage: 1.5 * 1024,
              vms: [
                {
                  id: 'vm-3',
                  name: 'APP-SERVER-01',
                  cores: 2,
                  cpus: 1,
                  allocatedVCPUs: 2,
                  memory: 4 * 1024,
                  storage: 80,
                  host: 'ESX-HOST-02',
                  cluster: 'Source Cluster A'
                }
              ]
            }
          ]
        },
        {
          id: 'sample-dest',
          name: 'Destination Cluster B',
          overcommitRatio: { cpu: 2.5, memory: 1.2, storage: 1.8 },
          hosts: [
            {
              id: 'host-3',
              name: 'NEW-HOST-01',
              totalCores: 48,
              totalMemory: 192 * 1024,
              totalStorage: 4 * 1024,
              vms: []
            },
            {
              id: 'host-4',
              name: 'NEW-HOST-02',
              totalCores: 48,
              totalMemory: 192 * 1024,
              totalStorage: 4 * 1024,
              vms: []
            }
          ]
        }
      );
    }
    
    // Final debug logging before return
    console.log('=== FINAL CLUSTER DATA DEBUG ===');
    console.log('Final cluster data count:', clusters.length);
    clusters.forEach((cluster, i) => {
      console.log(`Final Cluster ${i}:`, {
        id: cluster.id,
        name: cluster.name,
        hostsCount: cluster.hosts?.length || 0,
        totalVMs: cluster.hosts?.reduce((total: number, host: any) => total + (host.vms?.length || 0), 0) || 0,
        hosts: cluster.hosts?.map((h: any) => ({ 
          id: h.id, 
          name: h.name, 
          vmCount: h.vms?.length || 0
        })) || []
      });
    });
    
    return clusters;
  };

  // Memoized cluster data to ensure consistency
  const clusterData = useMemo(() => {
    return prepareSimpleVisualizerData();
  }, [state, ocRatios]);

  // Unified VM selection handler for syncing between visualizers
  const handleVMSelection = (vmId: string, isSelected: boolean) => {
    setSelectedVMs(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(vmId);
      } else {
        newSet.delete(vmId);
      }
      return newSet;
    });
    
    // Also update the D3 visualization if it's rendered
    if (!advancedVisualizer) {
      const vmElement = d3.select(`#vm-${vmId}`);
      if (!vmElement.empty()) {
        vmElement.attr('fill', isSelected ? '#50e6ff' : '#d0f4ff');
      }
    }
  };

  // Simple resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, width),
          height: Math.max(400, height)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Core scaling algorithm: Each vCore gets a fixed height unit
  // With overcommitment ratio, host height = physical cores × overcommitment ratio × unit height
  const VCORE_HEIGHT_UNIT = 15; // Pixels per vCore slot (increased for better visibility)
  const OVERCOMMITMENT_RATIO = 3; // 3:1 overcommitment ratio
  
  const calculateHostCapacity = (physicalCores: number): number => {
    return physicalCores * OVERCOMMITMENT_RATIO; // Total vCore capacity
  };
  
  const calculateHostHeight = (physicalCores: number, host?: any): number => {
    if (!showFreeSpace && host) {
      // When free space is hidden, calculate height based only on allocated VMs
      const minVMHeight = 22; // Must match the minimum VM height
      const vmCount = host.vms?.length || 0;
      const allocatedVCores = host.vms?.reduce((sum: number, vm: any) => {
        return sum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
      }, 0) || 0;
      
      // Ensure host is tall enough for all VMs with minimum heights
      const minHeightForVMs = vmCount * minVMHeight;
      const proportionalHeight = allocatedVCores * VCORE_HEIGHT_UNIT;
      
      return Math.max(proportionalHeight, minHeightForVMs, 50); // Use the larger of proportional or minimum heights
    } else {
      // When free space is shown, use full capacity
      const totalVCores = calculateHostCapacity(physicalCores);
      return totalVCores * VCORE_HEIGHT_UNIT; // Height based on total vCore slots
    }
  };

  // Azure service icons with fixed gradient IDs
  const createVMIcon = (size: number = 18): string => {
    const id = `vm-canvas-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vm-grad1-${id}" x1="8.88" y1="12.21" x2="8.88" y2="0.21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0078d4" />
          <stop offset="0.82" stop-color="#5ea0ef" />
        </linearGradient>
        <linearGradient id="vm-grad2-${id}" x1="8.88" y1="16.84" x2="8.88" y2="12.21" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stop-color="#ccc" />
          <stop offset="1" stop-color="#707070" />
        </linearGradient>
      </defs>
      <rect x="0" y="0.21" width="18" height="12" rx="0.6" fill="url(#vm-grad1-${id})" />
      <polygon points="11.88 4.46 11.88 7.95 8.88 9.71 8.88 6.21 11.88 4.46" fill="#50e6ff" />
      <polygon points="11.88 4.46 8.88 6.22 5.88 4.46 8.88 2.71 11.88 4.46" fill="#c3f1ff" />
      <polygon points="8.88 6.22 8.88 9.71 5.88 7.95 5.88 4.46 8.88 6.22" fill="#9cebff" />
      <polygon points="5.88 7.95 8.88 6.21 8.88 9.71 5.88 7.95" fill="#c3f1ff" />
      <polygon points="11.88 7.95 8.88 6.21 8.88 9.71 11.88 7.95" fill="#9cebff" />
      <path d="M12.49,15.84c-1.78-.28-1.85-1.56-1.85-3.63H7.11c0,2.07-.06,3.35-1.84,3.63a1,1,0,0,0-.89,1h9A1,1,0,0,0,12.49,15.84Z" fill="url(#vm-grad2-${id})" />
    </svg>`;
  };

  const createHostIcon = (size: number = 18): string => {
    const id = `host-canvas-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="host-grad-${id}" x1="9.23" x2="9.23" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#a67af4" />
          <stop offset="0.999" stop-color="#773adc" />
        </linearGradient>
      </defs>
      <path d="M15.074,17.39A.645.645,0,0,1,14.4,18H4.062a.645.645,0,0,1-.675-.61V.61A.645.645,0,0,1,4.062,0H14.4a.645.645,0,0,1,.675.61Z" fill="url(#host-grad-${id})" />
      <path d="M13.461,7.7a1.34,1.34,0,0,0-1.27-1.4H6.375a1.34,1.34,0,0,0-1.27,1.4h0a1.34,1.34,0,0,0,1.27,1.4h5.816a1.34,1.34,0,0,0,1.27-1.4Z" fill="#552f99" />
      <path d="M13.461,3.537a1.34,1.34,0,0,0-1.27-1.4H6.375a1.34,1.34,0,0,0-1.27,1.4h0a1.34,1.34,0,0,0,1.27,1.4h5.816a1.34,1.34,0,0,0,1.27-1.4Z" fill="#552f99" />
      <circle cx="11.826" cy="3.537" r="0.939" fill="#50e6ff" />
      <circle cx="11.826" cy="7.695" r="0.939" fill="#50e6ff" />
    </svg>`;
  };

  const createClusterIcon = (size: number = 18): string => {
    return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,3.213v11.574c0,.852.339,1.67.941,2.272.603.603,1.42.941,2.272.941h11.574c.852,0,1.669-.338,2.272-.941s.941-1.42.941-2.272V3.213c0-.852-.339-1.669-.941-2.272C16.456.339,15.639,0,14.787,0H3.213C2.361,0,1.544.339.941.941c-.603.603-.941,1.42-.941,2.272Z" fill="#1072dd" fill-rule="evenodd" />
      <path d="M1.152,14.787V3.213c0-.547.217-1.071.604-1.457.387-.387.911-.604,1.457-.604h11.574c.547,0,1.071.217,1.457.604.386.387.604.911.604,1.457v11.574c0,.547-.217,1.071-.604,1.458-.386.386-.911.604-1.457.604H3.213c-.547,0-1.071-.217-1.457-.604-.387-.387-.604-.911-.604-1.458Z" fill="#d0f1fd" />
      <rect x="3.669" y="5.123" width="10.661" height="7.754" fill="#1072dd" />
      <path d="M2.7,12.586c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
      <path d="M2.7,8.225c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
      <path d="M2.7,3.863c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
    </svg>`;
  };

  // Dynamic color generation for clusters (Purple to Teal gradient)
  const generateClusterColors = (totalClusters: number, maxClusters = 32) => {
    const colors: {
      primary: string;
      light: string;
      border: string;
      text: string;
    }[] = [];
    
    // Purple to Teal HSL transition
    const startHue = 260; // Purple
    const endHue = 180;   // Teal
    const saturation = 70; // Consistent saturation
    const lightness = 55;  // Consistent lightness
    
    const actualClusters = Math.min(totalClusters, maxClusters);
    
    for (let i = 0; i < actualClusters; i++) {
      // Calculate hue progression with crescendo (gentler steps for fewer clusters)
      let progress;
      if (actualClusters === 1) {
        progress = 0; // Single cluster stays purple
      } else {
        // Much more aggressive progression with dramatic color jumps
        // Use almost the full gradient range for maximum visual impact
        const maxProgress = Math.min(1.0, actualClusters / maxClusters); // Use full gradient range
        progress = (i / (actualClusters - 1)) * maxProgress;
        
        // Much more aggressive exponential curve for dramatic color separation
        progress = Math.pow(progress, 0.4); // More aggressive curve creates bigger jumps
      }
      const hue = startHue + (endHue - startHue) * progress;
      
      // Generate colors with consistent contrast
      const primary = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      const light = `hsl(${hue}, ${saturation - 20}%, ${lightness + 25}%)`;
      const border = `hsl(${hue}, ${saturation + 10}%, ${lightness - 15}%)`;
      
      // Determine text color based on lightness for accessibility
      const textLightness = lightness < 50 ? 90 : 20;
      const text = `hsl(${hue}, 30%, ${textLightness}%)`;
      
      colors.push({ primary, light, border, text });
    }
    
    return colors;
  };


  // Calculate layout dimensions that both headers and visualizer will use
  // New mirrored layout: VMs-Left | Hosts-Left | Clusters | Hosts-Right | VMs-Right
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const clusterWidth = 240;
  const hostWidth = 150;  
  const vmWidth = Math.min(200, (dimensions.width - clusterWidth - (hostWidth * 2) - (margin.left + margin.right) - 40) / 2);
  
  
  // Force re-render of headers when dimensions change by adding key
  const layoutKey = `${dimensions.width}-${dimensions.height}`;
  
  // State to force header re-render
  const [headerKey, setHeaderKey] = useState(0);
  
  // Update header key when dimensions change
  useEffect(() => {
    setHeaderKey(prev => prev + 1);
  }, [dimensions.width, dimensions.height]);

  // Main visualization effect
  useEffect(() => {
    if (!svgRef.current || !state || !state.clusters) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main group for zoom transforms
    const mainGroup = svg.append('g').attr('class', 'visualization-group');
    
    // Add fixed header row using same coordinate system as visualizer
    // Position headers safely below search bar area
    const headerGroup = svg.append('g')
      .attr('class', 'header-group')
      .attr('transform', `translate(0, 30)`); // Position headers well below search bar
    
    // VMs Left header with LCM card styling - connected to search bar
    headerGroup.append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('width', vmWidth)
      .attr('height', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.95)') // Clean white background
      .attr('stroke', 'rgba(139, 92, 246, 0.3)') // Subtle purple border
      .attr('stroke-width', 1)
      .attr('rx', 4); // Slight radius
    
    headerGroup.append('text')
      .attr('x', margin.left + vmWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#1a202c') // Dark text for readability
      .text('VMs (Left)');
    
    // Hosts Left header with LCM card styling - connected to search bar
    headerGroup.append('rect')
      .attr('x', margin.left + vmWidth)
      .attr('y', 0)
      .attr('width', hostWidth)
      .attr('height', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.95)') // Clean white background
      .attr('stroke', 'rgba(139, 92, 246, 0.3)') // Subtle purple border
      .attr('stroke-width', 1)
      .attr('rx', 4); // Slight radius
    
    headerGroup.append('text')
      .attr('x', margin.left + vmWidth + hostWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#1a202c') // Dark text for readability
      .text('Hosts (Left)');
    
    // Cluster header - center position with LCM card styling - connected to search bar
    headerGroup.append('rect')
      .attr('x', margin.left + vmWidth + hostWidth)
      .attr('y', 0)
      .attr('width', clusterWidth)
      .attr('height', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.95)') // Clean white background
      .attr('stroke', 'rgba(139, 92, 246, 0.3)') // Subtle purple border
      .attr('stroke-width', 1)
      .attr('rx', 4); // Slight radius
    
    headerGroup.append('text')
      .attr('x', margin.left + vmWidth + hostWidth + clusterWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('fill', '#1a202c') // Dark text for readability
      .text('Clusters');
    
    // Hosts Right header with LCM card styling - connected to search bar
    headerGroup.append('rect')
      .attr('x', margin.left + vmWidth + hostWidth + clusterWidth)
      .attr('y', 0)
      .attr('width', hostWidth)
      .attr('height', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.95)') // Clean white background
      .attr('stroke', 'rgba(139, 92, 246, 0.3)') // Subtle purple border
      .attr('stroke-width', 1)
      .attr('rx', 4); // Slight radius
    
    headerGroup.append('text')
      .attr('x', margin.left + vmWidth + hostWidth + clusterWidth + hostWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#1a202c') // Dark text for readability
      .text('Hosts (Right)');
    
    // VMs Right header with LCM card styling - connected to search bar
    headerGroup.append('rect')
      .attr('x', margin.left + vmWidth + hostWidth + clusterWidth + hostWidth)
      .attr('y', 0)
      .attr('width', vmWidth)
      .attr('height', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.95)') // Clean white background
      .attr('stroke', 'rgba(139, 92, 246, 0.3)') // Subtle purple border
      .attr('stroke-width', 1)
      .attr('rx', 4); // Slight radius
    
    headerGroup.append('text')
      .attr('x', margin.left + vmWidth + hostWidth + clusterWidth + hostWidth + vmWidth/2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#1a202c') // Dark text for readability
      .text('VMs (Right)');
    
    // Track current focus for click-to-zoom
    let currentFocus: any = null;
    
    // Variables for drag and drop
    let draggedVMs: any[] = [];
    let dragStartX = 0;
    let dragStartY = 0;
    let dragGroup: any = null;

    // Search is now handled via dropdown selection, not filtering
    let visibleClusters = state.clusters.filter((cluster: any) => cluster.isVisible);
    
    // Disabled filtering - search now uses dropdown for direct selection
    /* if (searchQuery.trim()) {
      // Filtering code removed - search is now selection-based
    } */
    
    if (visibleClusters.length === 0) {
      const message = 'No clusters visible. Use the control panel to add clusters.';
      
      mainGroup.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Segoe UI, system-ui, sans-serif')
        .attr('font-size', '18px')
        .attr('fill', '#666')
        .text(message);
      return;
    }

    const { width, height } = dimensions;
    // Using shared layout dimensions defined above the useEffect
    
    // Global scaling factor - adjust based on free space visibility for more compact display
    // When free space is hidden, use smaller scale for more compact visualization
    let globalScaleFactor = showFreeSpace ? 1 : 0.7;


    let totalHeight = 0;
    const clusterData = visibleClusters.map((cluster: any, clusterIndex: number) => {
      const hosts = cluster.hosts || [];
      
      // Calculate cluster height = sum of scaled host heights with minimum 200px
      const hostHeights = hosts.map((host: any) => {
        const cores = host.totalCores || 32;
        return calculateHostHeight(cores, host) * globalScaleFactor; // Apply 3x scaling for readability
      });
      
      const calculatedClusterHeight = hostHeights.reduce((sum: number, h: number) => sum + h, 0);
      const clusterHeight = Math.max(200, calculatedClusterHeight); // Use actual sum of host heights, minimum 200px
      
      // Use the original scaled host heights directly - no additional scaling needed
      const scaledHostHeights = hostHeights;
      
      const result = {
        cluster,
        clusterIndex,
        clusterHeight,
        hosts: hosts.map((host: any, hostIndex: number) => ({
          host,
          hostIndex,
          height: scaledHostHeights[hostIndex],
          vms: host.vms || []
        }))
      };
      
      totalHeight += clusterHeight + 20; // Accumulate total height for all clusters
      return result;
    });

    // Set SVG dimensions to fit vertical columns plus space for checkboxes
    const checkboxSpace = 40; // Extra space for checkboxes (24px + 12px gap + margin)
    const headerHeight = 40; // Height of header rectangles
    const totalWidth = vmWidth + hostWidth + clusterWidth + hostWidth + vmWidth + (margin.left + margin.right) + checkboxSpace;
    // Use a more reasonable height calculation to prevent excessive scrolling
    const totalViewHeight = Math.max(400, totalHeight + margin.top + margin.bottom + headerHeight + 20); // Include header height
    
    // Set proper SVG dimensions for zoom
    svg
      .attr('viewBox', `0 0 ${totalWidth} ${totalViewHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('overflow', 'visible');

    // Proper D3 icicle zoom with uniform scaling to prevent text distortion
    let focus: any = null; // Root element (null = show all)
    
    const clicked = (event: any, targetData: any) => {
      event.stopPropagation();
      
      // Toggle focus exactly like D3 icicle
      const isSameFocus = focus && 
        focus.type === targetData?.type && 
        focus.clusterIndex === targetData?.clusterIndex &&
        (targetData?.type === 'cluster' || focus.hostIndex === targetData?.hostIndex);
      
      focus = isSameFocus ? null : targetData;
      currentFocus = focus;
      
      if (!focus) {
        // Zoom out to root - show all elements
        mainGroup
          .transition()
          .duration(750)
          .attr('transform', 'translate(0, 0) scale(1)');
        
        // Reset text scaling, position, and font size
        mainGroup.selectAll('.host-text, .vm-text, .free-space-text')
          .transition()
          .duration(750)
          .attr('transform', null) // Clear all transforms
          .attr('font-size', function() {
            const element = d3.select(this);
            return element.classed('host-text') ? '12px' : 
                   element.classed('free-space-text') ? '10px' : '9px'; // VM text
          });
        
        // Reset inline VM checkboxes
        mainGroup.selectAll('.vm-checkbox-inline')
          .transition()
          .duration(750)
          .attr('transform', function() {
            // Restore original positioning without any scaling
            const element = d3.select(this);
            const node = element.node() as Element;
            const vmGroup = d3.select(node?.parentElement);
            const vmRect = vmGroup.select('rect');
            const vmRectWidth = parseFloat(vmRect.attr('width'));
            const vmRectHeight = parseFloat(vmRect.attr('height'));
            
            // Fixed checkbox positioning
            const checkboxSize = 14; // Fixed size for consistency
            const checkboxPadding = 6; // Right padding from edge
            
            return `translate(${vmRectWidth - checkboxSize - checkboxPadding}, ${(vmRectHeight - checkboxSize) / 2})`;
          });

        // Reset cluster text
        mainGroup.selectAll('.cluster-text-group')
          .transition()
          .duration(750)
          .attr('transform', function() {
            const element = d3.select(this);
            const node = element.node() as Element;
            const parentG = d3.select(node?.parentElement);
            const clusterWidth = parseFloat(parentG.select('rect').attr('width'));
            const textCount = element.selectAll('text').size();
            return `translate(${clusterWidth / 2}, ${20 + textCount * 8})`;
          });

        
        // Note: VM checkboxes are now inline and don't need removal
        
        mainGroup.selectAll('.cluster-text-group')
          .transition()
          .duration(750)
          .attr('transform', function() {
            const element = d3.select(this);
            const node = element.node() as Element;
            const parentG = d3.select(node?.parentElement);
            const clusterWidth = parseFloat(parentG.select('rect').attr('width'));
            const textCount = element.selectAll('text').size();
            return `translate(${clusterWidth / 2}, ${20 + textCount * 8})`;
          });
        
        // Reset cluster text font size
        mainGroup.selectAll('.cluster-text-group text')
          .transition()
          .duration(750)
          .attr('font-size', '14px');
        
        // Reset cluster percentage
        mainGroup.selectAll('.cluster-percentage')
          .transition()
          .duration(750)
          .attr('transform', null)
          .attr('font-size', '16px');
      } else {
        // Zoom into focused element with UNIFORM scaling
        const containerHeight = dimensions.height;
        const containerWidth = dimensions.width;
        let focusTop: number | undefined, focusHeight: number | undefined, focusLeft: number | undefined, focusWidth: number | undefined;
        
        if (focus.type === 'cluster') {
          // Focus on entire cluster row
          focusTop = focus.clusterY;
          focusHeight = focus.clusterHeight;
          focusLeft = margin.left;
          focusWidth = totalWidth - margin.left - margin.right;
        } else if (focus.type === 'host') {
          // Focus on host - expand to fill full canvas height
          focusTop = focus.hostY;
          focusHeight = focus.height;
          focusLeft = margin.left + clusterWidth;
          focusWidth = hostWidth + vmWidth;
        }
        
        // Calculate scale - for hosts, make them span full height
        let scale;
        let translateX, translateY;
        
        if (focus.type === 'host') {
          // Calculate global minimum height scaling factor ONLY when zoomed into a host
          const minVMHeight = 32; // Minimum height to accommodate 14px text + padding
          let zoomGlobalScaleFactor = 1;
          
          // Find the smallest VM across all clusters to determine if scaling is needed
          visibleClusters.forEach((cluster: any) => {
            cluster.hosts?.forEach((host: any) => {
              const hostHeight = calculateHostHeight(host.totalCores || 32, host);
              host.vms?.forEach((vm: any) => {
                const vmCores = vm.allocatedVCPUs || 1;
                const calculatedVMHeight = (vmCores / (host.totalCores || 32)) * hostHeight;
                if (calculatedVMHeight < minVMHeight) {
                  const requiredScale = minVMHeight / calculatedVMHeight;
                  zoomGlobalScaleFactor = Math.max(zoomGlobalScaleFactor, requiredScale);
                }
              });
            });
          });
          
          // Apply global scaling to the focus height for proper zoom calculation
          const adjustedFocusHeight = (focusHeight || 1) * zoomGlobalScaleFactor;
          
          // Limit zoom to 2x maximum for better usability with large hosts
          const desiredScaleY = containerHeight / adjustedFocusHeight;
          const scaleY = Math.min(2, desiredScaleY); // Cap at 2x zoom
          // To keep the focused host's top edge at the same screen position,
          // we need to compensate for the scaling effect on its position
          // When scaling, the top of the focused area would move to focusTop * scaleY
          // We want it to stay at focusTop, so we translate by the difference
          const translateY = (focusTop || 0) - ((focusTop || 0) * scaleY); // Compensate for scaling displacement
          const translateX = 0; // Keep horizontal position unchanged
          
          
          const transform = `translate(${translateX}, ${translateY}) scale(1, ${scaleY})`;
          currentTransformRef.current = { transform, focus }; // Save transform and focus
          mainGroup
            .transition()
            .duration(750)
            .attr('transform', transform);
          
          // Apply counter-scaling to text immediately to prevent stretching animation
          mainGroup.selectAll('.host-text, .vm-text, .free-space-text')
            .attr('transform', function() {
              // Get the current element to determine its center offset
              const element = d3.select(this);
              const x = parseFloat(element.attr('x') || '0');
              const y = parseFloat(element.attr('y') || '0');
              
              // Apply counter-scaling while maintaining center position
              const offsetY = y * (1 - 1/scaleY); // Compensate for scaling effect on position
              return `translate(0, ${offsetY}) scale(1, ${1/scaleY})`;
            })
            .transition()
            .duration(750)
            .attr('font-size', function() {
              const element = d3.select(this);
              const baseSize = element.classed('host-text') ? 12 : 
                              element.classed('free-space-text') ? 10 : 9; // VM text base size
              // Scale font size up but cap at reasonable maximum
              return `${Math.min(14, baseSize * Math.sqrt(scaleY))}px`;
            });

          // Counter-scale inline VM checkboxes to prevent stretching during host zoom
          mainGroup.selectAll('.vm-checkbox-inline')
            .attr('transform', function() {
              const element = d3.select(this);
              // Get current transform to preserve positioning
              const currentTransform = element.attr('transform');
              const translateMatch = currentTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              
              // Apply counter-scaling to maintain aspect ratio during zoom
              return `translate(${translateX}, ${translateY}) scale(1, ${1/scaleY})`;
            })
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const currentTransform = element.attr('transform');
              const translateMatch = currentTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              return `translate(${translateX}, ${translateY}) scale(1, ${1/scaleY})`;
            });
          
          
          // Adjust cluster text to prevent stretching and center relative to visible canvas height
          mainGroup.selectAll('.cluster-text-group')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const node = element.node() as Element;
            const parentG = d3.select(node?.parentElement);
              const clusterRect = parentG.select('rect');
              const clusterWidth = parseFloat(clusterRect.attr('width'));
              
              // Keep the text at the top of the cluster, not centered
              const topY = 20; // Fixed position at top with small padding
              
              // Apply counter-scaling to prevent text stretching
              return `translate(${clusterWidth / 2}, ${topY}) scale(1, ${1/scaleY})`;
            });
          
          // Increase cluster text font size when zoomed
          mainGroup.selectAll('.cluster-text-group text')
            .transition()
            .duration(750)
            .attr('font-size', `${Math.min(18, 14 * Math.sqrt(scaleY))}px`);
          
          
          // Counter-scale stroke-width to keep borders at 2px during zoom
          mainGroup.selectAll('rect')
            .transition()
            .duration(750)
            .attr('stroke-width', 2 / scaleY); // Keep border width constant at 2px
          
          // Counter-scale cluster percentage to prevent stretching
          mainGroup.selectAll('.cluster-percentage')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const y = parseFloat(element.attr('y') || '0');
              const offsetY = y * (1 - 1/scaleY);
              return `translate(0, ${offsetY}) scale(1, ${1/scaleY})`;
            })
            .attr('font-size', `${Math.min(20, 16 * Math.sqrt(scaleY))}px`);
        } else {
          // For clusters, use uniform scale to fit both dimensions
          const scaleX = containerWidth / (focusWidth || 1);
          const scaleY = containerHeight / (focusHeight || 1);
          let scale = Math.min(scaleX, scaleY);
          
          // Center the focused element
          let translateX = (containerWidth - (focusWidth || 0) * scale) / 2 - (focusLeft || 0) * scale;
          let translateY = (containerHeight - (focusHeight || 0) * scale) / 2 - (focusTop || 0) * scale;
          
          mainGroup
            .transition()
            .duration(750)
            .attr('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
          
          
          // Counter-scale inline VM checkboxes during cluster zoom
          mainGroup.selectAll('.vm-checkbox-inline')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const currentTransform = element.attr('transform');
              const translateMatch = currentTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              
              // Apply counter-scaling for cluster zoom (uniform scaling)
              const offsetX = translateX * (1 - 1/scale);
              const offsetY = translateY * (1 - 1/scale);
              return `translate(${translateX + offsetX}, ${translateY + offsetY}) scale(${1/scale})`;
            });
          
          // Keep cluster text centered and unstretched during cluster zoom
          mainGroup.selectAll('.cluster-text-group')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const node = element.node() as Element;
            const parentG = d3.select(node?.parentElement);
              const clusterRect = parentG.select('rect');
              const clusterWidth = parseFloat(clusterRect.attr('width'));
              const clusterHeight = parseFloat(clusterRect.attr('height'));
              
              // Keep text at top during cluster zoom, apply uniform counter-scaling
              const topY = 20; // Fixed position at top with small padding
              return `translate(${clusterWidth / 2}, ${topY}) scale(${1/scale})`;
            });
          
          // Increase cluster text font size for cluster zoom
          mainGroup.selectAll('.cluster-text-group text')
            .transition()
            .duration(750)
            .attr('font-size', `${Math.min(18, 14 * Math.sqrt(scale))}px`);
          
          // Counter-scale cluster percentage for cluster zoom
          mainGroup.selectAll('.cluster-percentage')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const x = parseFloat(element.attr('x') || '0');
              const y = parseFloat(element.attr('y') || '0');
              const offsetX = x * (1 - 1/scale);
              const offsetY = y * (1 - 1/scale);
              return `translate(${offsetX}, ${offsetY}) scale(${1/scale})`;
            })
            .attr('font-size', `${Math.min(20, 16 * Math.sqrt(scale))}px`);
          
          // Counter-scale stroke-width for cluster zoom to keep borders at 2px
          mainGroup.selectAll('rect')
            .transition()
            .duration(750)
            .attr('stroke-width', 2 / scale);
        }
      }
    };

    // Add background click to zoom out
    svg.on('click', () => {
      if (focus) {
        clicked({ stopPropagation: () => {} }, null);
      }
    });

    // Create drag behavior for VMs
    const dragBehavior = d3.drag()
      .on('start', function(event: any, d: any) {
        event.sourceEvent.stopPropagation();
        
        const vmElement = d3.select((this as any).parentNode);
        const vmId = d.vmId;
        
        // If the dragged VM is not selected, select it
        if (!selectedVMs.has(vmId)) {
          const newSelected = new Set(selectedVMs);
          newSelected.clear();
          newSelected.add(vmId);
          setSelectedVMs(newSelected);
        }
        
        // Collect all selected VMs to drag together
        draggedVMs = [];
        selectedVMs.forEach(id => {
          const vmEl = mainGroup.select(`[data-vm-id="${id}"]`);
          if (!vmEl.empty()) {
            const transform = vmEl.attr('transform');
            const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
            if (match) {
              draggedVMs.push({
                id,
                element: vmEl,
                originalX: parseFloat(match[1]),
                originalY: parseFloat(match[2])
              });
            }
          }
        });
        
        dragStartX = event.x;
        dragStartY = event.y;
        
        // Create temporary drag group for visual feedback
        dragGroup = mainGroup.append('g')
          .attr('class', 'drag-group')
          .style('opacity', 0.7);
          
        // Clone selected VMs into drag group
        draggedVMs.forEach(vm => {
          const clone = vm.element.node().cloneNode(true);
          dragGroup.node().appendChild(clone);
        });
      })
      .on('drag', function(event: any) {
        if (!dragGroup) return;
        
        const dx = event.x - dragStartX;
        const dy = event.y - dragStartY;
        
        // Move the drag group
        dragGroup.attr('transform', `translate(${dx}, ${dy})`);
        
        // Highlight potential drop zones
        mainGroup.selectAll('.host-rect, .cluster-rect')
          .style('stroke-width', function() {
            const rect = d3.select(this);
            const rectNode = rect.node() as SVGRectElement;
            const bbox = rectNode.getBBox();
            const transform = rectNode.getCTM();
            
            if (transform) {
              const x = bbox.x + transform.e;
              const y = bbox.y + transform.f;
              const width = bbox.width;
              const height = bbox.height;
              
              // Check if cursor is over this rectangle
              if (event.x >= x && event.x <= x + width &&
                  event.y >= y && event.y <= y + height) {
                return 4; // Highlight as drop zone
              }
            }
            return rect.attr('stroke-width');
          })
          .style('stroke', function() {
            const rect = d3.select(this);
            const rectNode = rect.node() as SVGRectElement;
            const bbox = rectNode.getBBox();
            const transform = rectNode.getCTM();
            
            if (transform) {
              const x = bbox.x + transform.e;
              const y = bbox.y + transform.f;
              const width = bbox.width;
              const height = bbox.height;
              
              if (event.x >= x && event.x <= x + width &&
                  event.y >= y && event.y <= y + height) {
                return '#00ff00'; // Green for valid drop zone
              }
            }
            return rect.attr('stroke');
          });
      })
      .on('end', function(event: any) {
        if (!dragGroup) return;
        
        // Find drop target
        let dropTarget: any = null;
        let dropTargetType: string | null = null;
        
        mainGroup.selectAll('.host-rect, .cluster-rect').each(function(d: any) {
          const rect = d3.select(this);
          const rectNode = rect.node() as SVGRectElement;
          const bbox = rectNode.getBBox();
          const transform = rectNode.getCTM();
          
          if (transform) {
            const x = bbox.x + transform.e;
            const y = bbox.y + transform.f;
            const width = bbox.width;
            const height = bbox.height;
            
            if (event.x >= x && event.x <= x + width &&
                event.y >= y && event.y <= y + height) {
              dropTarget = d;
              dropTargetType = rect.classed('host-rect') ? 'host' : 'cluster';
            }
          }
        });
        
        // Handle the drop
        if (dropTarget) {
          // Perform migration
          const targetClusterName = dropTargetType === 'cluster' ? 
            dropTarget.cluster.name : dropTarget.clusterName;
            
          if (targetClusterName) {
            performMigration(targetClusterName);
          }
        }
        
        // Clean up
        dragGroup.remove();
        dragGroup = null;
        draggedVMs = [];
        
        // Reset highlighting
        mainGroup.selectAll('.host-rect, .cluster-rect')
          .style('stroke-width', function() {
            return d3.select(this).classed('cluster-rect') ? 2 : 1;
          })
          .style('stroke', '#fff');
      });

    // Generate dynamic colors for all clusters
    const clusterColors = generateClusterColors(clusterData.length);
    
    // Center Column: Clusters (vertical rectangles stacked)
    let clusterY = 30 + headerHeight + 10; // Start below headers (headers now at Y=30)
    clusterData.forEach(({ cluster, clusterIndex, clusterHeight, hosts }: {
      cluster: any;
      clusterIndex: number;
      clusterHeight: number;
      hosts: any[];
    }) => {
      // Calculate actual cluster height for mirrored layout
      // Since hosts are split left/right, we need the height of the taller side
      const leftSideHosts = hosts.filter((_: any, index: number) => index % 2 === 0);
      const rightSideHosts = hosts.filter((_: any, index: number) => index % 2 === 1);
      
      // When free space is enabled, we need to ensure cluster height accounts for full host capacity
      let leftSideHeight, rightSideHeight;
      
      if (showFreeSpace) {
        // Use full host capacity heights (includes VMs + free space)
        leftSideHeight = leftSideHosts.reduce((sum: number, host: any) => {
          const hostCores = host.host.totalCores || 32;
          const fullHostHeight = calculateHostCapacity(hostCores) * VCORE_HEIGHT_UNIT * globalScaleFactor;
          return sum + fullHostHeight;
        }, 0);
        rightSideHeight = rightSideHosts.reduce((sum: number, host: any) => {
          const hostCores = host.host.totalCores || 32;
          const fullHostHeight = calculateHostCapacity(hostCores) * VCORE_HEIGHT_UNIT * globalScaleFactor;
          return sum + fullHostHeight;
        }, 0);
      } else {
        // Use the calculated host heights (VMs only)
        leftSideHeight = leftSideHosts.reduce((sum: number, host: any) => sum + host.height, 0);
        rightSideHeight = rightSideHosts.reduce((sum: number, host: any) => sum + host.height, 0);
      }
      
      // Use the height of the taller side (handles odd/even host counts properly)
      const actualClusterHeight = Math.max(leftSideHeight, rightSideHeight);
      
      // Get colors for this cluster
      const colors = clusterColors[clusterIndex] || clusterColors[0]; // Fallback to first color
      const clusterGroup = mainGroup.append('g')
        .attr('class', `cluster-${clusterIndex}`)
        .attr('transform', `translate(${margin.left + vmWidth + hostWidth}, ${clusterY})`);

      // Cluster vertical rectangle with dynamic color and height
      clusterGroup.append('rect')
        .attr('class', 'cluster-rect')
        .attr('id', `cluster-${cluster.id}`)
        .datum({ cluster, clusterIndex, clusterHeight: actualClusterHeight, clusterY })
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', clusterWidth)
        .attr('height', actualClusterHeight)
        .attr('fill', colors.light) // Dynamic light color
        .attr('stroke', '#fff') // Keep original white border
        .attr('stroke-width', 2)
        .style('cursor', 'context-menu') // Show context menu cursor
        .on('contextmenu', (event) => {
          event.preventDefault(); // Prevent default context menu
          
          // Get all VM IDs in this cluster
          const vmIds: string[] = [];
          // Use the hosts array from the current cluster processing context
          hosts.forEach((hostData: any) => {
            const host = hostData.host;
            if (host.vms) {
              host.vms.forEach((vm: any) => {
                vmIds.push(vm.id);
              });
            }
          });
          
          // Check if all VMs are selected
          const allSelected = vmIds.every(id => selectedVMs.has(id));
          
          // Toggle selection for all VMs in this cluster
          vmIds.forEach(vmId => {
            const vmElement = d3.select(`#vm-${vmId}`);
            const checkboxElement = d3.select(`#checkbox-group-${vmId}`);
            
            if (allSelected) {
              // Deselect all
              vmElement.attr('fill', '#d0f4ff');
              checkboxElement.select('rect').attr('fill', '#ffffff');
              checkboxElement.select('path').remove();
              selectedVMs.delete(vmId);
            } else {
              // Select all
              vmElement.attr('fill', '#50e6ff');
              checkboxElement.select('rect').attr('fill', '#10b981');
              if (checkboxElement.select('path').empty()) {
                const checkboxSize = 14; // Fixed size for consistency
                checkboxElement.append('path')
                  .attr('d', `M${checkboxSize * 0.25},${checkboxSize * 0.5} L${checkboxSize * 0.45},${checkboxSize * 0.7} L${checkboxSize * 0.75},${checkboxSize * 0.3}`)
                  .attr('stroke', '#ffffff')
                  .attr('stroke-width', 2) // Fixed stroke width
                  .attr('stroke-linecap', 'round')
                  .attr('stroke-linejoin', 'round')
                  .attr('fill', 'none')
                  .style('pointer-events', 'none');
              }
              selectedVMs.add(vmId);
            }
            
            // Visual feedback animation
            vmElement
              .style('stroke', allSelected ? '#ff6b6b' : '#8b5cf6')
              .style('stroke-width', '3px')
              .transition()
              .duration(500)
              .style('stroke', '#fff')
              .style('stroke-width', '2px');
          });
          
          // Show feedback on the cluster
          d3.select(event.currentTarget)
            .style('stroke', allSelected ? '#ff6b6b' : '#8b5cf6')
            .style('stroke-width', '4px')
            .transition()
            .duration(500)
            .style('stroke', '#fff')
            .style('stroke-width', '2px');
        })
        .on('mouseenter', function(event) {
          // Create tooltip with cluster information
          const totalHosts = hosts.length;
          const totalVMs = hosts.reduce((sum: any, h: any) => sum + (h.host.vms?.length || 0), 0);
          const totalPhysicalCores = hosts.reduce((sum: any, h: any) => sum + (h.host.totalCores || 32), 0);
          const totalVCoreCapacity = totalPhysicalCores * OVERCOMMITMENT_RATIO;
          const totalAllocatedVCores = hosts.reduce((sum: any, h: any) => {
            return sum + (h.host.vms?.reduce((vmSum: number, vm: any) => {
              return vmSum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
            }, 0) || 0);
          }, 0);
          const clusterUtilization = ((totalAllocatedVCores / totalVCoreCapacity) * 100).toFixed(1);
          
          const tooltipContent = {
            title: cluster.name || 'Unknown Cluster',
            metrics: [
              { label: 'Hosts', value: `${totalHosts}` },
              { label: 'Total VMs', value: `${totalVMs}` },
              { label: 'Physical Cores', value: `${totalPhysicalCores}` },
              { label: 'vCore Capacity', value: `${totalVCoreCapacity} (3:1 overcommit)` },
              { label: 'Allocated vCores', value: `${totalAllocatedVCores}` },
              { label: 'Utilization', value: `${clusterUtilization}%` },
              { label: 'Cluster Type', value: cluster.type || 'Production' },
              { label: 'Status', value: cluster.status || 'Active' }
            ]
          };
          
          onTooltipUpdate({
            x: event.pageX + 10,
            y: event.pageY - 10,
            content: tooltipContent
          });
        })
        .on('mouseleave', function() {
          onTooltipUpdate(null);
        });


      // Cluster name (horizontal text, centered)
      const words = cluster.name.split(' ');
      const maxLineWidth = clusterWidth - 20; // Max width minus padding
      
      // Create text lines by grouping words to fit width
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        // Rough character width estimation (8px per character)
        if (testLine.length * 8 <= maxLineWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Limit to 2 lines maximum
      const displayLines = lines.slice(0, 2);
      
      // Create text group for horizontal multi-line text (top-aligned)
      const textGroup = clusterGroup.append('g')
        .attr('class', 'cluster-text-group')
        .attr('transform', `translate(${clusterWidth / 2}, ${8 + displayLines.length * 8})`) // Top alignment with minimal padding
        .style('pointer-events', 'none'); // Make text non-interactive
      
      // Add each line of text horizontally
      displayLines.forEach((line, index) => {
        const yOffset = index * 16; // 16px line spacing
        textGroup.append('text')
          .attr('x', 0)
          .attr('y', yOffset)
          .attr('font-family', 'Segoe UI, system-ui, sans-serif')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', colors.text) // Dynamic text color for contrast
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .style('pointer-events', 'none') // Make text non-interactive
          .text(line);
      });

      // Calculate utilization percentage
      const totalCapacity = hosts.reduce((sum: any, h: any) => sum + (h.host.totalCores || 32), 0);
      const totalAllocated = hosts.reduce((sum: any, h: any) => 
        sum + h.vms.reduce((vmSum: any, vm: any) => vmSum + (vm.allocatedVCPUs || 0), 0), 0);
      const utilizationPercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

      // Cluster utilization percentage (bottom of rectangle)
      clusterGroup.append('text')
        .attr('class', 'cluster-percentage')
        .attr('x', clusterWidth / 2)
        .attr('y', actualClusterHeight - 20)
        .attr('font-family', 'Segoe UI, system-ui, sans-serif')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', colors.text) // Dynamic text color for contrast
        .attr('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .text(`${utilizationPercent.toFixed(1)}%`);

      // Split hosts between left and right sides with proper Y tracking
      let leftHostY = clusterY; // Track Y position for left side hosts
      let rightHostY = clusterY; // Track Y position for right side hosts
      
      hosts.forEach(({ host, hostIndex, height, vms }: {
        host: any;
        hostIndex: number;
        height: number;
        vms: any[];
      }) => {
        // Use the already-scaled height from cluster data calculation
        // But when free space is enabled, ensure host height matches full capacity
        let scaledHostHeight;
        if (showFreeSpace) {
          const hostCores = host.totalCores || 32;
          scaledHostHeight = calculateHostCapacity(hostCores) * VCORE_HEIGHT_UNIT * globalScaleFactor;
        } else {
          scaledHostHeight = height;
        }
        
        // Determine if this host goes on left or right side
        const isLeftSide = hostIndex % 2 === 0; // Even indices go left, odd go right
        const hostXPosition = isLeftSide 
          ? margin.left + vmWidth  // Left side: after VMs-Left
          : margin.left + vmWidth + hostWidth + clusterWidth; // Right side: after clusters
        
        // Use the appropriate Y position for this side
        const currentHostY = isLeftSide ? leftHostY : rightHostY;
        
        const hostGroup = mainGroup.append('g')
          .attr('class', `host-${clusterIndex}-${hostIndex}`)
          .attr('transform', `translate(${hostXPosition}, ${currentHostY})`);

        // Host vertical rectangle (proportional height based on cores)
        hostGroup.append('rect')
          .attr('class', 'host-rect')
          .attr('id', `host-${host.id}`)
          .datum({ host, hostIndex, clusterIndex, clusterName: cluster.name })
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', hostWidth)
          .attr('height', scaledHostHeight)
          .attr('fill', '#F7AEF8')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            clicked(event, { 
              cluster, 
              clusterIndex, 
              hostIndex, 
              clusterY, 
              hostY: currentHostY, // Use the captured position for this specific host
              height, 
              type: 'host' 
            });
          })
          .on('contextmenu', (event) => {
            event.preventDefault(); // Prevent default context menu
            
            // Toggle selection of all VMs on this host
            const vmIds = vms.map((vm: any) => vm.id);
            const allSelected = vmIds.every(id => selectedVMs.has(id));
            
            vmIds.forEach(vmId => {
              const vmElement = d3.select(`#vm-${vmId}`);
              const checkboxElement = d3.select(`#checkbox-group-${vmId}`);
              
              if (allSelected) {
                // Deselect all
                vmElement.attr('fill', '#d0f4ff');
                checkboxElement.select('rect').attr('fill', '#ffffff');
                checkboxElement.select('path').remove();
                selectedVMs.delete(vmId);
              } else {
                // Select all
                vmElement.attr('fill', '#50e6ff');
                checkboxElement.select('rect').attr('fill', '#10b981');
                if (checkboxElement.select('path').empty()) {
                  const checkboxSize = 14; // Fixed size for consistency
                  checkboxElement.append('path')
                    .attr('d', `M${checkboxSize * 0.25},${checkboxSize * 0.5} L${checkboxSize * 0.45},${checkboxSize * 0.7} L${checkboxSize * 0.75},${checkboxSize * 0.3}`)
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 2) // Fixed stroke width
                    .attr('stroke-linecap', 'round')
                    .attr('stroke-linejoin', 'round')
                    .attr('fill', 'none')
                    .style('pointer-events', 'none');
                }
                selectedVMs.add(vmId);
              }
              
              // Visual feedback animation
              vmElement
                .style('stroke', allSelected ? '#ff6b6b' : '#8b5cf6')
                .style('stroke-width', '3px')
                .transition()
                .duration(500)
                .style('stroke', '#fff')
                .style('stroke-width', '2px');
            });
            
            // Show feedback on the host
            d3.select(event.currentTarget)
              .style('stroke', allSelected ? '#ff6b6b' : '#8b5cf6')
              .style('stroke-width', '3px')
              .transition()
              .duration(500)
              .style('stroke', '#fff')
              .style('stroke-width', '1px');
          })
          .on('mouseenter', function(event) {
            // Create tooltip with host information
            const allocatedVCores = vms.reduce((sum: number, vm: any) => {
              return sum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
            }, 0);
            const hostVCoreCapacity = calculateHostCapacity(host.totalCores || 32);
            const utilizationPercent = ((allocatedVCores / hostVCoreCapacity) * 100).toFixed(1);
            
            const tooltipContent = {
              title: host.name || 'Unknown Host',
              metrics: [
                { label: 'Physical Cores', value: `${host.totalCores || 32}` },
                { label: 'vCore Capacity', value: `${hostVCoreCapacity} (3:1 overcommit)` },
                { label: 'Allocated vCores', value: `${allocatedVCores}` },
                { label: 'Utilization', value: `${utilizationPercent}%` },
                { label: 'Total RAM', value: `${host.totalRAMGB || 'N/A'} GB` },
                { label: 'CPU Model', value: host.hardwareDetails?.cpuModel || 'N/A' },
                { label: 'Sockets', value: `${host.hardwareDetails?.socketCount || 'N/A'}` },
                { label: 'VMs Count', value: `${vms.length}` }
              ]
            };
            
            onTooltipUpdate({
              x: event.pageX + 10,
              y: event.pageY - 10,
              content: tooltipContent
            });
          })
          .on('mouseleave', function() {
            onTooltipUpdate(null);
          });


        // Host name (centered at top, black text)
        hostGroup.append('text')
          .attr('class', 'host-text')
          .attr('x', hostWidth / 2) // Centered horizontally
          .attr('y', 25) // Top positioning with padding
          .attr('font-family', 'Segoe UI, system-ui, sans-serif')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('fill', '#000') // Black text
          .attr('text-anchor', 'middle') // Centered horizontally
          .attr('dominant-baseline', 'hanging')
          .style('pointer-events', 'none')
          .text(host.name);

        // VMs split between left and right sides (matching their host)
        const totalVMCores = vms.reduce((sum: number, vm: any) => sum + (vm.allocatedVCPUs || 1), 0);
        const vmRectWidth = vmWidth; // VMs use full column width
        
        let vmYOffset = 0;
        
        // Pre-calculate VM heights to ensure they fit within host bounds
        const vmHeights: number[] = [];
        const minVMHeight = 22; // Minimum height to accommodate 14px checkbox with padding
        
        if (!showFreeSpace) {
          // When free space is disabled, ensure all VMs fit exactly within host height
          const totalAllocatedVCores = vms.reduce((sum: number, vm: any) => {
            return sum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
          }, 0);
          
          // Calculate proportional heights first
          const proportionalHeights = vms.map((vm: any) => {
            const vmVCores = vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1;
            return (vmVCores / totalAllocatedVCores) * scaledHostHeight;
          });
          
          // Check if any VM would be too small
          const minRequiredHeight = vms.length * minVMHeight;
          
          if (minRequiredHeight > scaledHostHeight) {
            // If minimum heights exceed host height, scale down minimum height
            const adjustedMinHeight = scaledHostHeight / vms.length;
            vmHeights.push(...vms.map(() => adjustedMinHeight));
          } else {
            // Apply minimum height constraints and redistribute if needed
            let totalProportionalHeight = 0;
            const finalHeights = proportionalHeights.map(h => {
              const height = Math.max(minVMHeight, h);
              totalProportionalHeight += height;
              return height;
            });
            
            // If total exceeds host height, scale down proportionally
            if (totalProportionalHeight > scaledHostHeight) {
              const scaleFactor = scaledHostHeight / totalProportionalHeight;
              vmHeights.push(...finalHeights.map(h => h * scaleFactor));
            } else {
              vmHeights.push(...finalHeights);
            }
          }
        }
        
        vms.forEach((vm: any, vmIndex: number) => {
          // VMs follow the same side as their host
          const vmXPosition = isLeftSide 
            ? margin.left  // Left side: VMs-Left column
            : margin.left + vmWidth + hostWidth + clusterWidth + hostWidth; // Right side: VMs-Right column
          
          // VM position should be at host Y plus the offset for stacking
          const vmYPosition = currentHostY + vmYOffset;
            
          const vmGroup = mainGroup.append('g')
            .attr('class', `vm-${clusterIndex}-${hostIndex}-${vmIndex}`)
            .attr('data-vm-id', vm.id)
            .attr('transform', `translate(${vmXPosition}, ${vmYPosition})`);

          // VM rectangle height based on vCores relative to host's total vCore capacity
          // VM can have cores and cpus that multiply, or just allocatedVCPUs
          const vmVCores = vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1;
          const hostVCoreCapacity = calculateHostCapacity(host.totalCores || 32);
          
          let vmRectHeight;
          
          if (!showFreeSpace) {
            // Use pre-calculated height that ensures all VMs fit within host bounds
            vmRectHeight = vmHeights[vmIndex];
          } else {
            // Normal calculation when free space is shown
            const minVMHeight = 22; // Minimum height to accommodate 14px checkbox with padding
            vmRectHeight = Math.max(minVMHeight, (vmVCores / hostVCoreCapacity) * scaledHostHeight);
          }

          // Check if VM is selected or migrated
          const isSelected = selectedVMs.has(vm.id);
          const isMigrated = migrationHistory.some(m => m.vmId === vm.id);
          
          let fillColor = '#d0f4ff'; // Light cyan (light shade of #50e6ff)
          let textColor = '#000'; // Black text for better readability
          if (isMigrated) {
            fillColor = '#52D1DC'; // Teal for migrated VMs
          } else if (isSelected) {
            fillColor = '#52D1DC'; // Teal for selected
            textColor = '#000'; // Black text for selected
          }

          // Shared VM selection handler
          const handleVMSelection = (event: any) => {
            console.log('🖱️ VM selection handler called for VM:', vm.id);
            // Prevent event bubbling to avoid triggering zoom out
            event.stopPropagation();
            event.preventDefault();
            
            // Handle VM selection with direct DOM manipulation to avoid re-render
            const vmElement = d3.select(event.currentTarget);
            const checkboxElement = d3.select(`#checkbox-group-${vm.id}`);
            const isCurrentlySelected = selectedVMs.has(vm.id);
            
            if (isCurrentlySelected) {
              console.log('📤 Deselecting VM:', vm.id);
              // Direct DOM update for deselection
              vmElement.attr('fill', '#d0f4ff');
              checkboxElement.select('rect').attr('fill', '#ffffff');
              checkboxElement.select('path').remove();
              selectedVMs.delete(vm.id);
            } else {
              console.log('📥 Selecting VM:', vm.id);
              // Direct DOM update for selection
              vmElement.attr('fill', '#50e6ff');
              checkboxElement.select('rect').attr('fill', '#10b981');
              if (!checkboxElement.select('path').empty()) {
                checkboxElement.select('path').remove();
              }
              const checkboxSize = 14; // Fixed size for consistency
              checkboxElement.append('path')
                .attr('d', `M${checkboxSize * 0.25},${checkboxSize * 0.5} L${checkboxSize * 0.45},${checkboxSize * 0.7} L${checkboxSize * 0.75},${checkboxSize * 0.3}`)
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 2) // Fixed stroke width
                .attr('stroke-linecap', 'round')
                .attr('stroke-linejoin', 'round')
                .attr('fill', 'none')
                .style('pointer-events', 'none');
              selectedVMs.add(vm.id);
            }
            
            console.log('✅ Updated selection without re-render:', Array.from(selectedVMs));
            // Don't call setSelectedVMs to avoid re-render and zoom reset
          };

          const vmRect = vmGroup.append('rect')
            .attr('id', `vm-${vm.id}`)
            .datum({ vmId: vm.id, vm, cluster, host, clusterIndex, hostIndex })
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', vmRectWidth)
            .attr('height', vmRectHeight)
            .attr('fill', fillColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'move')
            .on('click', handleVMSelection);
          
          console.log('✨ VM rectangle created for:', vm.id, 'with click handler');
          
          vmRect.on('mouseenter', function(event) {
              // Create tooltip with VM information in the expected format
              const tooltipContent = {
                title: vm.name || 'Unknown VM',
                metrics: [
                  { label: 'IP Address', value: vm.ipAddress || 'N/A' },
                  { label: 'Allocated CPUs', value: vm.allocatedVCPUs || 'N/A' },
                  { label: 'vCores', value: vm.vCores || vm.allocatedVCPUs || 'N/A' },
                  { label: 'Memory', value: vm.memory || 'N/A' },
                  { label: 'Storage', value: vm.storage || 'N/A' },
                  { label: 'Port Group', value: vm.portGroup || vm.networkName || 'N/A' }
                ]
              };
              
              onTooltipUpdate({
                x: event.pageX + 10,
                y: event.pageY - 10,
                content: tooltipContent
              });
            })
            .on('mouseleave', function() {
              onTooltipUpdate(null); // Set to null to hide tooltip
            });
            // Removed dragBehavior to fix single-click selection


          // VM name (horizontal text, left-aligned)
          vmGroup.append('text')
            .attr('class', 'vm-text')
            .attr('x', 8) // Left padding
            .attr('y', vmRectHeight / 2)
            .attr('font-family', 'Segoe UI, system-ui, sans-serif')
            .attr('font-size', '9px')
            .attr('fill', textColor)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .style('pointer-events', 'none')
            .text(vm.name);

          // VM selection checkbox (fixed size, center-right aligned)
          const checkboxSize = 14; // Fixed size for consistency
          const checkboxPadding = 6; // Right padding from edge
          
          const checkboxGroup = vmGroup.append('g')
            .attr('id', `checkbox-group-${vm.id}`)
            .attr('class', 'vm-checkbox-inline')
            .attr('data-vm-id', vm.id)
            .style('cursor', 'pointer')
            .attr('transform', `translate(${vmRectWidth - checkboxSize - checkboxPadding}, ${(vmRectHeight - checkboxSize) / 2})`);

          // Checkbox background with click handling
          checkboxGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', checkboxSize)
            .attr('height', checkboxSize)
            .attr('rx', 3)
            .attr('fill', isSelected ? '#10b981' : '#ffffff')
            .attr('stroke', isSelected ? '#10b981' : 'var(--text-secondary)')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.95) // Slightly transparent for better visibility on various backgrounds
            .style('cursor', 'pointer')
            .style('filter', 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))') // Subtle shadow for depth
            .on('click', handleVMSelection);
          
          console.log('☑️ Checkbox created for VM:', vm.id, 'selected:', isSelected);

          // Checkmark (only when selected)
          if (isSelected) {
            checkboxGroup.append('path')
              .attr('d', `M${checkboxSize * 0.25},${checkboxSize * 0.5} L${checkboxSize * 0.45},${checkboxSize * 0.7} L${checkboxSize * 0.75},${checkboxSize * 0.3}`)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 2) // Fixed stroke width
              .attr('stroke-linecap', 'round')
              .attr('stroke-linejoin', 'round')
              .attr('fill', 'none')
              .style('pointer-events', 'none'); // Prevent interfering with click
          }

          vmYOffset += vmRectHeight; // Move to next VM position
        });

        // Add free space rectangle if there's remaining capacity and toggle is enabled
        if (showFreeSpace) {
          const allocatedVCores = vms.reduce((sum: number, vm: any) => {
            return sum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
          }, 0);
          const hostVCoreCapacity = calculateHostCapacity(host.totalCores || 32);
          const freeVCores = hostVCoreCapacity - allocatedVCores;
          if (freeVCores > 0) {
          const freeSpaceHeight = (freeVCores / hostVCoreCapacity) * scaledHostHeight;
          
          // Free space follows the same side as the host's VMs
          const freeSpaceXPosition = isLeftSide 
            ? margin.left  // Left side: VMs-Left column
            : margin.left + vmWidth + hostWidth + clusterWidth + hostWidth; // Right side: VMs-Right column
            
          const freeSpaceYPosition = currentHostY + vmYOffset;
          
          const freeSpaceGroup = mainGroup.append('g')
            .attr('class', `free-space-${clusterIndex}-${hostIndex}`)
            .attr('transform', `translate(${freeSpaceXPosition}, ${freeSpaceYPosition})`);

          freeSpaceGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', vmRectWidth)
            .attr('height', freeSpaceHeight)
            .attr('fill', '#CDF4E4') // Light green for free space
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5'); // Dashed border for free space

          // Free space label
          freeSpaceGroup.append('text')
            .attr('class', 'free-space-text')
            .attr('x', vmRectWidth / 2)
            .attr('y', freeSpaceHeight / 2)
            .attr('font-family', 'Segoe UI, system-ui, sans-serif')
            .attr('font-size', '9px')
            .attr('fill', '#16a34a')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('pointer-events', 'none')
            .text(`Free (${freeVCores} vCores)`);
          }
        }

        // Update Y position for the appropriate side
        if (isLeftSide) {
          leftHostY += scaledHostHeight; // Move to next left host position
        } else {
          rightHostY += scaledHostHeight; // Move to next right host position
        }
      });

      clusterY += actualClusterHeight + 20; // Move to next cluster position using dynamic height
    });


    console.log('🎯 NEW SIMPLIFIED ICICLE VISUALIZATION RENDERED');
    console.log('Clusters:', visibleClusters.length);
    console.log('Total height:', totalHeight);

  }, [dimensions, state, onVMSelect, migrationHistory, searchQuery, showFreeSpace, advancedVisualizer]); // Added toggles to trigger re-render

  // Migration helper functions
  const migrateSelectedVMs = (targetClusterName: string) => {
    if (selectedVMs.size === 0) return;

    // Get details of selected VMs
    const selectedVMDetails: Array<{vm: any, cluster: any, host: any}> = [];
    
    state.clusters.forEach((cluster: any) => {
      cluster.hosts?.forEach((host: any) => {
        host.vms?.forEach((vm: any) => {
          if (selectedVMs.has(vm.id)) {
            selectedVMDetails.push({ vm, cluster, host });
          }
        });
      });
    });

    if (selectedVMDetails.length === 0) return;

    // Create a deep copy of the state to modify
    const newState = JSON.parse(JSON.stringify(state));
    
    // Find target cluster
    const targetCluster = newState.clusters.find((c: any) => c.name === targetClusterName);
    if (!targetCluster) {
      alert('Target cluster not found');
      return;
    }

    // Ensure target cluster has at least one host
    if (!targetCluster.hosts || targetCluster.hosts.length === 0) {
      alert('Target cluster has no hosts available');
      return;
    }

    // Remove VMs from their current locations and add to migration history
    selectedVMDetails.forEach(({ vm, cluster, host }) => {
      // Find the VM in the new state and remove it
      const sourceCluster = newState.clusters.find((c: any) => c.name === cluster.name);
      const sourceHost = sourceCluster?.hosts?.find((h: any) => h.name === host.name);
      if (sourceHost?.vms) {
        sourceHost.vms = sourceHost.vms.filter((v: any) => v.id !== vm.id);
      }

      // Add VM to the first available host in target cluster (for simplicity)
      // In a real scenario, you'd use load balancing logic
      const targetHost = targetCluster.hosts[0];
      if (!targetHost.vms) {
        targetHost.vms = [];
      }
      targetHost.vms.push(vm);

      // Add to migration history
      setMigrationHistory(prev => [...prev, {
        id: `migration-${Date.now()}-${vm.id}`,
        vmId: vm.id,
        vmName: vm.name,
        sourceCluster: cluster.name,
        targetCluster: targetClusterName,
        timestamp: new Date()
      }]);
    });

    // Update the parent component's state with the modified clusters
    if (onStateUpdate) {
      onStateUpdate(newState);
    }
    
    // Clear selection after migration
    setSelectedVMs(new Set());
    
    console.log('✅ Migration completed for', selectedVMDetails.length, 'VMs to', targetClusterName);
  };

  const getSelectedVMDetails = () => {
    const selectedDetails: Array<{vm: any, cluster: any, host: any}> = [];
    
    state?.clusters?.forEach((cluster: any) => {
      cluster.hosts?.forEach((hostData: any) => {
        hostData.vms?.forEach((vm: any) => {
          if (selectedVMs.has(vm.id)) {
            selectedDetails.push({
              vm,
              cluster,
              host: hostData.host
            });
          }
        });
      });
    });
    
    return selectedDetails;
  };

  const getAvailableClusters = () => {
    return state?.clusters?.filter((cluster: any) => cluster.isVisible) || [];
  };

  const performMigration = (targetClusterName: string) => {
    const selectedDetails = getSelectedVMDetails();
    const newMigrations = selectedDetails.map((detail) => ({
      id: `migration_${Date.now()}_${detail.vm.id}`,
      vmId: detail.vm.id,
      vmName: detail.vm.name,
      sourceCluster: detail.cluster.name,
      targetCluster: targetClusterName,
      timestamp: new Date()
    }));

    setMigrationHistory(prev => [...prev, ...newMigrations]);
    setSelectedVMs(new Set());
    
    // Here you would update the actual state to move VMs between clusters
    // For now, we'll just track the migration visually
  };

  const generateMigrationReport = () => {
    if (migrationHistory.length === 0) {
      alert('No migrations to report');
      return;
    }

    const report = migrationHistory.map(migration => 
      `${migration.timestamp.toLocaleString()}: ${migration.vmName} migrated from ${migration.sourceCluster} to ${migration.targetCluster}`
    ).join('\n');

    // Create downloadable report
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vm-migration-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative'
    }}>

      {/* Main content area with clipped backgrounds */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        gap: '16px',
        paddingTop: '0px' // Search bar now in normal flow
      }}>
      {/* Main Visualizer */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)'
        }}
      >
      {/* Search Bar - Fixed at top */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Stronger background
        backdropFilter: 'blur(20px) brightness(110%)', // Enhanced blur
        WebkitBackdropFilter: 'blur(20px) brightness(110%)',
        zIndex: 1000,
        padding: '12px 20px',
        gap: '12px',
        height: 'auto',
        borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
        boxShadow: '0 2px 20px rgba(139, 92, 246, 0.1)' // Add subtle shadow
      }}>
        <div style={{
          flex: '0 1 400px',
          minWidth: '250px',
          maxWidth: '100%'
        }}>
          <SearchWithDropdown
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search VMs, hosts, or clusters..."
            width="100%"
            data={state}
          onSelect={(result) => {
            // Clear search after selection
            setSearchQuery('');
            
            // Handle selection based on type
            if (result.type === 'vm') {
              // Find and click the VM element to trigger proper selection
              const vmElement = d3.select(`#vm-${result.id}`);
              if (!vmElement.empty()) {
                // Toggle selection state
                setSelectedVMs(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(result.id)) {
                    // VM is already selected - unselect it
                    newSet.delete(result.id);
                    // Restore original color
                    vmElement.attr('fill', '#d0f4ff');
                    // Visual feedback for deselection
                    vmElement
                      .style('stroke', '#ff6b6b')
                      .style('stroke-width', '3px')
                      .transition()
                      .duration(500)
                      .style('stroke', '#fff')
                      .style('stroke-width', '2px');
                  } else {
                    // VM is not selected - select it
                    newSet.add(result.id);
                    // Change to selected color
                    vmElement.attr('fill', '#50e6ff');
                    // Visual feedback for selection
                    vmElement
                      .style('stroke', '#8b5cf6')
                      .style('stroke-width', '3px')
                      .transition()
                      .duration(500)
                      .style('stroke', '#fff')
                      .style('stroke-width', '2px');
                  }
                  return newSet;
                });
              }
            } else if (result.type === 'host') {
              // Highlight the host
              d3.select(`#host-${result.id}`)
                .style('stroke', '#8b5cf6')
                .style('stroke-width', '3px')
                .transition()
                .duration(2000)
                .style('stroke', null)
                .style('stroke-width', null);
            } else if (result.type === 'cluster') {
              // Highlight the cluster
              d3.select(`#cluster-${result.id}`)
                .style('stroke', '#8b5cf6')
                .style('stroke-width', '3px')
                .transition()
                .duration(2000)
                .style('stroke', null)
                .style('stroke-width', null);
            }
            }}
          />
        </div>

        {/* Cluster Summary Information */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          flex: '0 1 auto'
        }}>
          {clusterData.map((cluster, index) => {
            console.log(`Cluster summary ${index}:`, {
              name: cluster.name,
              hosts: cluster.hosts?.length || 0,
              vms: cluster.hosts?.reduce((total: number, host: any) => total + (host.vms?.length || 0), 0) || 0,
              hostDetails: cluster.hosts?.map((h: any) => ({ name: h.name, vmCount: h.vms?.length || 0 }))
            });
            return (
              <div key={cluster.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: cluster.isVisible !== false ? 1 : 0.5
            }}
            onClick={() => onClusterToggle(cluster.id)}
            >
              {cluster.isVisible !== false ? 
                <EyeRegular style={{ width: '16px', height: '16px', color: '#8b5cf6' }} /> : 
                <EyeOffRegular style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              }
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index % 2 === 0 ? '#8b5cf6' : '#06b6d4'
              }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                {cluster.name}
              </span>
              <span>
                ({cluster.hosts?.length || 0} Host{(cluster.hosts?.length || 0) !== 1 ? 's' : ''})
              </span>
              <span style={{ 
                color: '#8b5cf6', 
                fontWeight: '600',
                fontSize: '11px'
              }}>
                {cluster.hosts?.reduce((total: number, host: any) => total + (host.vms?.length || 0), 0) || 0} VMs
              </span>
              </div>
            )
          })}
          
          {/* Add Cluster Button */}
          <div 
            onClick={onAddCluster}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 45%, #38bdf8 100%)',
              padding: '8px 14px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.25)';
            }}
          >
            <AddRegular style={{ width: '14px', height: '14px' }} />
            <span>Add Cluster</span>
          </div>
        </div>
        
        {/* Free Space Toggle with Settings */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          flex: '1 1 auto',
          minWidth: '0',
          justifyContent: 'flex-end'
        }}>
          {/* Advanced Visualizer Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#1a202c',
              fontFamily: tokens.fontFamilyBody
            }}>
              Advanced Visualizer
            </span>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={advancedVisualizer}
                onChange={(e) => {
                  setAdvancedVisualizer(e.target.checked);
                  // No need to reset Free Space when toggling
                }}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: advancedVisualizer ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: advancedVisualizer 
                  ? '0 2px 8px rgba(139, 92, 246, 0.3)' 
                  : '0 1px 4px rgba(139, 92, 246, 0.1)'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: advancedVisualizer ? '23px' : '3px',
                  bottom: '2px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }} />
              </span>
            </label>
          </div>

          {/* Free Space Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            opacity: advancedVisualizer ? 1 : 0.5,
            pointerEvents: advancedVisualizer ? 'auto' : 'none'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: advancedVisualizer ? '#1a202c' : 'var(--text-muted)',
              fontFamily: tokens.fontFamilyBody
            }}>
              Free Space
            </span>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '24px',
              cursor: advancedVisualizer ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                checked={showFreeSpace}
                onChange={(e) => advancedVisualizer && setShowFreeSpace(e.target.checked)}
                disabled={!advancedVisualizer}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: advancedVisualizer 
                  ? (showFreeSpace ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)')
                  : 'rgba(139, 92, 246, 0.1)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: `1px solid rgba(139, 92, 246, ${advancedVisualizer ? '0.2' : '0.1'})`,
                boxShadow: advancedVisualizer 
                  ? (showFreeSpace 
                      ? '0 2px 8px rgba(139, 92, 246, 0.3)' 
                      : '0 1px 4px rgba(139, 92, 246, 0.1)')
                  : '0 1px 2px rgba(139, 92, 246, 0.05)'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: (advancedVisualizer && showFreeSpace) ? '23px' : '3px',
                  bottom: '2px',
                  backgroundColor: advancedVisualizer ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: advancedVisualizer 
                    ? '0 2px 4px rgba(0, 0, 0, 0.2)'
                    : '0 1px 2px rgba(0, 0, 0, 0.1)'
                }} />
              </span>
            </label>
          </div>

          {/* Visualization Mode */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#1a202c',
              fontFamily: tokens.fontFamilyBody
            }}>
              Visualization Mode
            </span>
            <select 
              value={visualizationMode}
              onChange={(e) => setVisualizationMode(e.target.value as 'cpu' | 'memory' | 'storage')}
              className="lcm-dropdown"
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#1a202c',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            >
              <option value="cpu">CPU Cores</option>
              <option value="memory">Memory</option>
              <option value="storage">Storage</option>
            </select>
          </div>
          

          {/* OC Ratios */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#1a202c',
              fontFamily: tokens.fontFamilyBody
            }}>
              OC Ratios
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontFamily: tokens.fontFamilyBody
                }}>
                  CPU
                </span>
                <input
                  type="number"
                  value={ocRatios.cpu}
                  onChange={(e) => setOcRatios(prev => ({ ...prev, cpu: parseFloat(e.target.value) || 1 }))}
                  step="0.1"
                  min="1"
                  max="10"
                  style={{
                    width: '58px',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    fontFamily: tokens.fontFamilyBody
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>x</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontFamily: tokens.fontFamilyBody
                }}>
                  Memory
                </span>
                <input
                  type="number"
                  value={ocRatios.memory}
                  onChange={(e) => setOcRatios(prev => ({ ...prev, memory: parseFloat(e.target.value) || 1 }))}
                  step="0.1"
                  min="1"
                  max="10"
                  style={{
                    width: '58px',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    fontFamily: tokens.fontFamilyBody
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>x</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontFamily: tokens.fontFamilyBody
                }}>
                  Storage
                </span>
                <input
                  type="number"
                  value={ocRatios.storage}
                  onChange={(e) => setOcRatios(prev => ({ ...prev, storage: parseFloat(e.target.value) || 1 }))}
                  step="0.1"
                  min="1"
                  max="10"
                  style={{
                    width: '58px',
                    height: '32px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    fontFamily: tokens.fontFamilyBody
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>x</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#8b5cf6',
                fontFamily: tokens.fontFamilyBody
              }}>
                {state.clusters.reduce((total: number, cluster: any) => 
                  total + cluster.hosts.reduce((hostTotal: number, host: any) => 
                    hostTotal + (host.vms ? host.vms.length : 0), 0), 0)}
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: tokens.fontFamilyBody
              }}>
                VMs
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#8b5cf6',
                fontFamily: tokens.fontFamilyBody
              }}>
                {state.clusters.reduce((total: number, cluster: any) => total + cluster.hosts.length, 0)}
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: tokens.fontFamilyBody
              }}>
                Hosts
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#8b5cf6',
                fontFamily: tokens.fontFamilyBody
              }}>
                {state.clusters.length}
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: tokens.fontFamilyBody
              }}>
                Clusters
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#8b5cf6',
                fontFamily: tokens.fontFamilyBody
              }}>
                13%
              </span>
              <span style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: tokens.fontFamilyBody
              }}>
                Avg Util
              </span>
            </div>
          </div>


        </div>
      </div>

      {/* Headers are now rendered inside SVG for perfect alignment */}

      {/* Conditional rendering: D3 (Advanced) or Simple Visualizer */}
      {advancedVisualizer ? (
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{
            display: 'block',
            marginTop: '0px', // Container already has paddingTop
            fontFamily: tokens.fontFamilyBody
          }}
        />
      ) : (
        <SimpleVisualizer
          clusters={clusterData}
          selectedVMs={selectedVMs}
          onVMSelect={handleVMSelection}
          searchTerm={searchQuery}
          visualizationMode={visualizationMode}
          isMigrationView={true}
        />
      )}
      
      </div> {/* Close main visualizer */}
      
      </div> {/* Close main content wrapper */}
    </div>
  );
};

export default CapacityCanvas;