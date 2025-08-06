// Mermaid diagram generators for network topology visualization
import { NetworkTopology } from '../store/useAppStore';

// Consistent theme system for all diagrams
const DIAGRAM_THEME = {
  // Primary colors - Purple theme to match app
  primary: '#8b5cf6',      // Main purple
  primaryLight: '#c4b5fd',  // Light purple
  primaryDark: '#6d28d9',   // Dark purple
  
  // Secondary colors 
  secondary: '#6366f1',     // Indigo accent
  secondaryLight: '#a5b4fc', // Light indigo
  
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

// Generate consistent styling for all diagram types
const generateDiagramStyles = () => `
  classDef virtualNetwork fill:${DIAGRAM_THEME.primary},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:3px,color:${DIAGRAM_THEME.textLight},rx:12,ry:12
  classDef virtualMachine fill:${DIAGRAM_THEME.tertiary},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:2px,color:${DIAGRAM_THEME.textLight},rx:8,ry:8
  classDef cluster fill:${DIAGRAM_THEME.success},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:3px,color:${DIAGRAM_THEME.textLight},rx:10,ry:10
  classDef physicalHost fill:${DIAGRAM_THEME.warning},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:2px,color:${DIAGRAM_THEME.textLight},rx:8,ry:8
  classDef datacenter fill:${DIAGRAM_THEME.neutralDark},stroke:${DIAGRAM_THEME.primary},stroke-width:4px,color:${DIAGRAM_THEME.textLight},rx:15,ry:15
  classDef infrastructure fill:${DIAGRAM_THEME.info},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:2px,color:${DIAGRAM_THEME.textLight},rx:8,ry:8
  classDef managementFunction fill:${DIAGRAM_THEME.secondary},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:2px,color:${DIAGRAM_THEME.textLight},rx:8,ry:8
  classDef moreItems fill:${DIAGRAM_THEME.neutral},stroke:${DIAGRAM_THEME.neutralDark},stroke-width:1px,color:${DIAGRAM_THEME.textLight},rx:6,ry:6
`;

/**
 * Generate a virtual network diagram using Mermaid syntax
 */
export function generateVirtualDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.networks || topology.networks.length === 0) {
    return 'graph TD\n  A[No Virtual Networks Found]';
  }

  let diagram = 'graph TD\n';
  let connections: string[] = [];

  // Add networks
  topology.networks.forEach((network: any, index: number) => {
    const netId = `VN${index}`;
    const networkName = network.name || `Virtual Network ${index + 1}`;
    const networkType = network.type || 'network';
    
    diagram += `  ${netId}["🌐 ${networkName}${network.vlan_id ? ` (VLAN ${network.vlan_id})` : ''}"]`;
    
    // Add network type styling
    if (networkType === 'management') {
      diagram += `\n  ${netId} -.-> MGMT[Management Functions]\n`;
    } else if (networkType === 'vmotion') {
      diagram += `\n  ${netId} -.-> VMOTION[vMotion Traffic]\n`;
    }
    diagram += '\n';
  });

  // Add VMs and connect to networks
  if (topology.vms && topology.vms.length > 0) {
    topology.vms.slice(0, 20).forEach((vm: any, vmIndex: number) => { // Limit to 20 VMs for readability
      const vmId = `VM${vmIndex}`;
      const vmName = vm.name || `VM ${vmIndex + 1}`;
      const powerState = vm.power_state || vm.powerState || 'unknown';
      const vmIcon = powerState === 'poweredOn' ? '🖥️' : '⏸️';
      
      diagram += `  ${vmId}["${vmIcon} ${vmName}${vm.guest_os ? ` (${vm.guest_os})` : ''}"]`;
      diagram += '\n';
      
      // Connect VM to cluster network
      if (vm.cluster_id && topology.networks.length > 0) {
        const clusterNetwork = topology.networks.find((net: any) => net.cluster_id === vm.cluster_id);
        if (clusterNetwork) {
          const netIndex = topology.networks.indexOf(clusterNetwork);
          connections.push(`  VN${netIndex} --> ${vmId}`);
        } else {
          // Connect to first network as fallback
          connections.push(`  VN0 --> ${vmId}`);
        }
      }
    });
    
    if (topology.vms.length > 20) {
      diagram += `  MORE_VMS["... and ${topology.vms.length - 20} more VMs"]\n`;
      connections.push(`  VN0 --> MORE_VMS`);
    }
  }

  // Add connections
  diagram += '\n' + connections.join('\n') + '\n';

  // Add consistent style classes with rounded corners
  diagram += '\n' + generateDiagramStyles();
  
  // Apply classes to elements
  diagram += `
  class ${topology.networks.map((_: any, i: number) => `VN${i}`).join(',')} virtualNetwork
  class ${topology.vms?.slice(0, 20).map((_: any, i: number) => `VM${i}`).join(',') || ''} virtualMachine
  class MGMT,VMOTION managementFunction
  class MORE_VMS moreItems
  `;

  return diagram;
}

/**
 * Generate a Hyper-V topology diagram using Mermaid syntax
 */
export function generateHyperVDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.hosts || topology.hosts.length === 0) {
    return 'graph TD\n  A[No Hyper-V Hosts Found]';
  }

  let diagram = 'graph TD\n';
  let connections: string[] = [];
  
  // Add clusters first
  if (topology.clusters && topology.clusters.length > 0) {
    topology.clusters.forEach((cluster: any, clusterIndex: number) => {
      const clusterId = `CL${clusterIndex}`;
      const clusterName = cluster.name || `Cluster ${clusterIndex + 1}`;
      diagram += `  ${clusterId}["🏢 ${clusterName}${cluster.status ? ` (${cluster.status})` : ''}"]`;
      diagram += '\n';
    });
  }
  
  // Add hosts and connect to clusters
  topology.hosts.forEach((host: any, hostIndex: number) => {
    const hostId = `HV${hostIndex}`;
    const hostName = host.name || `Hyper-V Host ${hostIndex + 1}`;
    const hostStatus = host.status || 'unknown';
    const statusIcon = hostStatus === 'connected' ? '🟢' : hostStatus === 'disconnected' ? '🔴' : '🟡';
    
    diagram += `  ${hostId}["${statusIcon} ${hostName}${host.cpu_cores ? ` (${host.cpu_cores} cores, ${host.memory_gb}GB)` : ''}"]`;
    diagram += '\n';
    
    // Connect host to its cluster
    if (host.cluster_id && topology.clusters) {
      const clusterIndex = topology.clusters.findIndex((c: any) => c.id === host.cluster_id);
      if (clusterIndex >= 0) {
        connections.push(`  CL${clusterIndex} --> ${hostId}`);
      }
    } else if (topology.clusters && topology.clusters.length > 0) {
      // Connect to first cluster as fallback
      connections.push(`  CL0 --> ${hostId}`);
    }
  });
  
  // Add VMs and connect to hosts
  if (topology.vms && topology.vms.length > 0) {
    const maxVMsToShow = 15; // Limit for readability
    topology.vms.slice(0, maxVMsToShow).forEach((vm: any, vmIndex: number) => {
      const vmId = `VM${vmIndex}`;
      const vmName = vm.name || `VM ${vmIndex + 1}`;
      const powerState = vm.power_state || vm.powerState || 'unknown';
      const vmIcon = powerState === 'poweredOn' ? '💻' : '⏸️';
      
      diagram += `  ${vmId}["${vmIcon} ${vmName}${vm.vcpus ? ` (${vm.vcpus}vCPU, ${vm.memory_gb}GB)` : ''}"]`;
      diagram += '\n';
      
      // Connect VM to a host (distribute VMs across hosts)
      const hostIndex = vmIndex % topology.hosts.length;
      connections.push(`  HV${hostIndex} --> ${vmId}`);
    });
    
    if (topology.vms.length > maxVMsToShow) {
      diagram += `  MORE_VMS["⚡ ${topology.vms.length - maxVMsToShow} more VMs..."]\n`;
      connections.push(`  HV0 --> MORE_VMS`);
    }
  }

  // Add connections
  diagram += '\n' + connections.join('\n') + '\n';

  // Add consistent style classes with rounded corners
  diagram += '\n' + generateDiagramStyles();
  
  // Apply classes to elements (add hyperVHost alias for physicalHost)
  diagram += `
  classDef hyperVHost fill:${DIAGRAM_THEME.secondary},stroke:${DIAGRAM_THEME.primaryDark},stroke-width:3px,color:${DIAGRAM_THEME.textLight},rx:8,ry:8
  
  class ${topology.clusters?.map((_: any, i: number) => `CL${i}`).join(',') || ''} cluster
  class ${topology.hosts.map((_: any, i: number) => `HV${i}`).join(',')} hyperVHost
  class ${topology.vms?.slice(0, 15).map((_: any, i: number) => `VM${i}`).join(',') || ''} virtualMachine
  class MORE_VMS moreItems
  `;

  return diagram;
}

/**
 * Generate a physical infrastructure diagram using Mermaid syntax
 */
export function generatePhysicalDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.clusters || topology.clusters.length === 0) {
    return 'graph TD\n  A[No Physical Infrastructure Found]';
  }

  let diagram = 'graph TD\n';
  let connections: string[] = [];
  
  // Add data center representation
  diagram += '  DC["🏢 Data Center"]\n';
  
  // Add clusters
  topology.clusters.forEach((cluster: any, clusterIndex: number) => {
    const clusterId = `CL${clusterIndex}`;
    const clusterName = cluster.name || `Cluster ${clusterIndex + 1}`;
    const utilization = cluster.utilization || 0;
    const status = cluster.status || 'unknown';
    const statusIcon = status === 'healthy' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
    
    diagram += `  ${clusterId}["${statusIcon} ${clusterName}${utilization ? ` (${utilization}% util)` : ''}"]`;
    diagram += '\n';
    connections.push(`  DC --> ${clusterId}`);
  });
  
  // Add hosts and connect to clusters
  if (topology.hosts && topology.hosts.length > 0) {
    const maxHostsToShow = 12; // Limit for readability
    topology.hosts.slice(0, maxHostsToShow).forEach((host: any, hostIndex: number) => {
      const hostId = `PH${hostIndex}`;
      const hostName = host.name || `Physical Host ${hostIndex + 1}`;
      const status = host.status || 'unknown';
      const statusIcon = status === 'connected' ? '🖥️' : status === 'disconnected' ? '❌' : '⚠️';
      
      diagram += `  ${hostId}["${statusIcon} ${hostName}`;
      if (host.cpu_cores && host.memory_gb) {
        diagram += `<br/>${host.cpu_cores} cores, ${host.memory_gb}GB`;
      }
      diagram += '"]';
      diagram += '\n';
      
      // Connect host to its cluster
      if (host.cluster_id) {
        const clusterIndex = topology.clusters.findIndex((c: any) => c.id === host.cluster_id);
        if (clusterIndex >= 0) {
          connections.push(`  CL${clusterIndex} --> ${hostId}`);
        }
      } else {
        // Distribute hosts across clusters
        const clusterIndex = hostIndex % topology.clusters.length;
        connections.push(`  CL${clusterIndex} --> ${hostId}`);
      }
    });
    
    if (topology.hosts.length > maxHostsToShow) {
      diagram += `  MORE_HOSTS["⚡ ${topology.hosts.length - maxHostsToShow} more hosts..."]\n`;
      connections.push(`  CL0 --> MORE_HOSTS`);
    }
  }

  // Add storage representation if we have VMs with storage info
  if (topology.vms && topology.vms.length > 0) {
    const totalStorage = topology.vms.reduce((sum: number, vm: any) => {
      return sum + (vm.storage_gb || 0);
    }, 0);
    
    if (totalStorage > 0) {
      diagram += `  STORAGE["💾 Shared Storage<br/>${Math.round(totalStorage / 1024)} TB total"]`;
      diagram += '\n';
      connections.push('  DC --> STORAGE');
      
      // Connect storage to clusters
      topology.clusters.forEach((_: any, clusterIndex: number) => {
        connections.push(`  STORAGE -.-> CL${clusterIndex}`);
      });
    }
  }

  // Add network infrastructure
  diagram += '  NETWORK["🌐 Network Infrastructure<br/>Switches & Routers"]\n';
  connections.push('  DC --> NETWORK');
  
  // Connect network to clusters
  topology.clusters.forEach((_: any, clusterIndex: number) => {
    connections.push(`  NETWORK -.-> CL${clusterIndex}`);
  });

  // Add connections
  diagram += '\n' + connections.join('\n') + '\n';

  // Add consistent style classes with rounded corners
  diagram += '\n' + generateDiagramStyles();
  
  // Apply classes to elements
  diagram += `
  class DC datacenter
  class ${topology.clusters.map((_: any, i: number) => `CL${i}`).join(',')} cluster
  class ${topology.hosts?.slice(0, 12).map((_: any, i: number) => `PH${i}`).join(',') || ''} physicalHost
  class STORAGE,NETWORK infrastructure
  class MORE_HOSTS moreItems
  `;

  return diagram;
}
