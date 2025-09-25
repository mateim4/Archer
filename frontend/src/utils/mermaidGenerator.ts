// Enhanced Mermaid diagram generators for network topology visualization with professional network icons
import { NetworkTopology } from '../store/useAppStore';
import { NETWORK_ICON_INDEX, getTechnologyIcons, getNetworkIcon, generateIconStyles } from './networkIconIndex';

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

// Enhanced diagram styling with professional network component colors
const generateEnhancedDiagramStyles = () => `
  classDef vCenter fill:#0078d4,stroke:#005a9b,stroke-width:3px,color:white,rx:12,ry:12
  classDef dvswitch fill:#4b7c9d,stroke:#2c5f84,stroke-width:3px,color:white,rx:10,ry:10
  classDef virtualNetwork fill:#0078d4,stroke:#005a9b,stroke-width:2px,color:white,rx:10,ry:10
  classDef portGroup fill:#7fba00,stroke:#5c8a00,stroke-width:2px,color:white,rx:8,ry:8
  classDef esxiHost fill:#00bcf2,stroke:#0099cc,stroke-width:3px,color:white,rx:10,ry:10
  classDef vmkernel fill:#005a9b,stroke:#003f73,stroke-width:2px,color:white,rx:6,ry:6
  classDef physicalNic fill:#e3008c,stroke:#b8006f,stroke-width:2px,color:white,rx:6,ry:6
  classDef virtualMachine fill:#00a1f1,stroke:#0078cc,stroke-width:2px,color:white,rx:8,ry:8
  classDef cluster fill:#10b981,stroke:#059669,stroke-width:3px,color:white,rx:12,ry:12
  classDef hyperVHost fill:#5e5e5e,stroke:#404040,stroke-width:3px,color:white,rx:10,ry:10
  classDef physicalHost fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:white,rx:10,ry:10
  classDef datacenter fill:#374151,stroke:#1f2937,stroke-width:4px,color:white,rx:15,ry:15
  classDef infrastructure fill:#06b6d4,stroke:#0891b2,stroke-width:3px,color:white,rx:10,ry:10
  classDef security fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:white,rx:8,ry:8
  classDef storage fill:#8b5cf6,stroke:#7c3aed,stroke-width:3px,color:white,rx:10,ry:10
  classDef network fill:#06b6d4,stroke:#0891b2,stroke-width:3px,color:white,rx:10,ry:10
  classDef moreItems fill:#6b7280,stroke:#4b5563,stroke-width:1px,color:white,rx:6,ry:6
`;

// Generate class assignments for virtual network diagrams
const generateVirtualNetworkClasses = (topology: NetworkTopology): string => {
  const classes: string[] = [];
  
  classes.push('class VCENTER vCenter');
  
  // DVS classes
  const dvsCount = Math.ceil((topology.networks?.length || 0) / 4);
  if (dvsCount > 0) {
    classes.push(`class ${Array.from({length: dvsCount}, (_, i) => `DVS${i}`).join(',')} dvswitch`);
  }
  
  // Network classes
  if (topology.networks && topology.networks.length > 0) {
    classes.push(`class ${topology.networks.map((_: any, i: number) => `VN${i}`).join(',')} virtualNetwork`);
    classes.push(`class ${topology.networks.map((_: any, i: number) => `PG${i}`).join(',')} portGroup`);
  }
  
  // Host classes
  if (topology.hosts && topology.hosts.length > 0) {
    const hostCount = Math.min(topology.hosts.length, 8);
    classes.push(`class ${Array.from({length: hostCount}, (_, i) => `ESX${i}`).join(',')} esxiHost`);
    classes.push(`class ${Array.from({length: hostCount}, (_, i) => `VMK_MGMT_${i},VMK_VMOTION_${i}`).join(',')} vmkernel`);
    classes.push(`class ${Array.from({length: hostCount}, (_, i) => `VMNIC1_${i},VMNIC2_${i}`).join(',')} physicalNic`);
  }
  
  // VM classes
  if (topology.vms && topology.vms.length > 0) {
    const vmCount = Math.min(topology.vms.length, 12);
    classes.push(`class ${Array.from({length: vmCount}, (_, i) => `VM${i}`).join(',')} virtualMachine`);
    if (topology.vms.length > 12) {
      classes.push('class MORE_VMS moreItems');
    }
  }
  
  return '\n' + classes.join('\n') + '\n';
};

// Generate class assignments for Hyper-V diagrams
const generateHyperVClasses = (topology: NetworkTopology): string => {
  const classes: string[] = [];
  
  if (topology.clusters && topology.clusters.length > 0) {
    classes.push(`class ${topology.clusters.map((_: any, i: number) => `CL${i}`).join(',')} cluster`);
  }
  
  if (topology.hosts && topology.hosts.length > 0) {
    const hostCount = Math.min(topology.hosts.length, 10);
    classes.push(`class ${Array.from({length: hostCount}, (_, i) => `HV${i}`).join(',')} hyperVHost`);
  }
  
  if (topology.vms && topology.vms.length > 0) {
    const vmCount = Math.min(topology.vms.length, 15);
    classes.push(`class ${Array.from({length: vmCount}, (_, i) => `VM${i}`).join(',')} virtualMachine`);
    if (topology.vms.length > 15) {
      classes.push('class MORE_VMS moreItems');
    }
  }
  
  return '\n' + classes.join('\n') + '\n';
};

// Generate class assignments for physical infrastructure diagrams
const generatePhysicalClasses = (topology: NetworkTopology): string => {
  const classes: string[] = [];
  
  classes.push('class DC datacenter');
  
  if (topology.clusters && topology.clusters.length > 0) {
    classes.push(`class ${topology.clusters.map((_: any, i: number) => `CL${i}`).join(',')} cluster`);
  }
  
  if (topology.hosts && topology.hosts.length > 0) {
    const hostCount = Math.min(topology.hosts.length, 12);
    classes.push(`class ${Array.from({length: hostCount}, (_, i) => `PH${i}`).join(',')} physicalHost`);
    if (topology.hosts.length > 12) {
      classes.push('class MORE_HOSTS moreItems');
    }
  }
  
  classes.push('class STORAGE storage');
  classes.push('class NETWORK,FIREWALL,LOADBALANCER network');
  classes.push('class SECURITY_ZONE security');
  
  return '\n' + classes.join('\n') + '\n';
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
 * Generate an enhanced virtual network diagram with professional icons and detailed network components
 */
export function generateVirtualDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.networks || topology.networks.length === 0) {
    return 'graph TD\n  A[No Virtual Networks Found]';
  }

  const vmwareIcons = getTechnologyIcons('vmware');
  let diagram = 'graph LR\n';
  let connections: string[] = [];
  let styleClasses: string[] = [];

  // Add vCenter as the central management point
  diagram += '  VCENTER["[MGMT] vCenter Server<br/>Management & Orchestration"]\n';

  // Add Distributed Virtual Switches (DVS)
  const dvsCount = Math.ceil(topology.networks.length / 4); // Group networks into DVS
  for (let i = 0; i < dvsCount; i++) {
    const dvsId = `DVS${i}`;
    diagram += `  ${dvsId}["🔀 Distributed vSwitch ${i + 1}<br/>Centralized Network Management"]\n`;
    connections.push(`  VCENTER --> ${dvsId}`);
  }

  // Add network segments with detailed VLAN information
  topology.networks.forEach((network: any, index: number) => {
    const netId = `VN${index}`;
    const dvsIndex = Math.floor(index / 4);
    const networkName = network.name || `Virtual Network ${index + 1}`;
    const networkType = network.type || 'network';
    const vlanInfo = network.vlan_id ? `VLAN ${network.vlan_id}` : 'No VLAN';
    
    let networkIcon = '📡';
    let networkLabel = networkName;
    
    if (networkType === 'management') {
      networkIcon = '[MGMT]';
      networkLabel += '<br/>Management Network';
    } else if (networkType === 'vmotion') {
      networkIcon = '🔄';
      networkLabel += '<br/>vMotion Network';
    } else if (networkType === 'cluster_network') {
      networkIcon = '[NET]';
      networkLabel += '<br/>VM Production Network';
    }
    
    diagram += `  ${netId}["${networkIcon} ${networkLabel}<br/>${vlanInfo}"]\n`;
    connections.push(`  DVS${dvsIndex} --> ${netId}`);

    // Add Port Groups for each network
    const pgId = `PG${index}`;
    diagram += `  ${pgId}["[PG] Port Group: ${networkName}<br/>Traffic Policies & Security"]\n`;
    connections.push(`  ${netId} --> ${pgId}`);
  });

  // Add ESXi hosts with VMkernel interfaces
  if (topology.hosts && topology.hosts.length > 0) {
    topology.hosts.slice(0, 8).forEach((host: any, hostIndex: number) => {
      const hostId = `ESX${hostIndex}`;
      const hostName = host.name || `ESXi Host ${hostIndex + 1}`;
      const status = host.status || 'unknown';
      const statusIcon = status === 'connected' ? '�' : '🔴';
      
      diagram += `  ${hostId}["${statusIcon} ${hostName}<br/>${host.cpu_cores || 0} cores, ${host.memory_gb || 0}GB"]\n`;
      
      // Add VMkernel interfaces for each host
      const vmkMgmt = `VMK_MGMT_${hostIndex}`;
      const vmkVMotion = `VMK_VMOTION_${hostIndex}`;
      
      diagram += `  ${vmkMgmt}["[MGMT] vmk0: Management<br/>IP: 192.168.100.${10 + hostIndex}"]\n`;
      diagram += `  ${vmkVMotion}["🔄 vmk1: vMotion<br/>IP: 192.168.200.${10 + hostIndex}"]\n`;
      
      connections.push(`  ${hostId} --> ${vmkMgmt}`);
      connections.push(`  ${hostId} --> ${vmkVMotion}`);
      
      // Connect VMkernel to appropriate networks
      const mgmtNetwork = topology.networks.find((net: any) => net.type === 'management');
      const vmotionNetwork = topology.networks.find((net: any) => net.type === 'vmotion');
      
      if (mgmtNetwork) {
        const mgmtIndex = topology.networks.indexOf(mgmtNetwork);
        connections.push(`  PG${mgmtIndex} -.-> ${vmkMgmt}`);
      }
      if (vmotionNetwork) {
        const vmotionIndex = topology.networks.indexOf(vmotionNetwork);
        connections.push(`  PG${vmotionIndex} -.-> ${vmkVMotion}`);
      }

      // Add physical NICs (vmnic)
      const vmnic1 = `VMNIC1_${hostIndex}`;
      const vmnic2 = `VMNIC2_${hostIndex}`;
      diagram += `  ${vmnic1}["[NIC] vmnic0: 10GbE<br/>Primary Uplink"]\n`;
      diagram += `  ${vmnic2}["[NIC] vmnic1: 10GbE<br/>Redundant Uplink"]\n`;
      
      connections.push(`  ${hostId} --> ${vmnic1}`);
      connections.push(`  ${hostId} --> ${vmnic2}`);
      
      // Connect physical NICs to DVS
      connections.push(`  ${vmnic1} -.-> DVS0`);
      connections.push(`  ${vmnic2} -.-> DVS0`);
    });
  }

  // Add VMs with network assignments
  if (topology.vms && topology.vms.length > 0) {
    topology.vms.slice(0, 12).forEach((vm: any, vmIndex: number) => {
      const vmId = `VM${vmIndex}`;
      const vmName = vm.name || `VM ${vmIndex + 1}`;
      const powerState = vm.power_state || vm.powerState || 'unknown';
      const vmIcon = powerState === 'poweredOn' ? '[ON]' : '[OFF]';
      const guestOS = vm.guest_os ? vm.guest_os.split(' ')[0] : 'OS';
      
      diagram += `  ${vmId}["${vmIcon} ${vmName}<br/>${guestOS} | ${vm.vcpus || 2}vCPU, ${vm.memory_gb || 4}GB"]\n`;
      
      // Connect VM to host
      const hostIndex = vmIndex % (topology.hosts?.length || 1);
      if (topology.hosts && topology.hosts.length > 0) {
        connections.push(`  ESX${hostIndex} --> ${vmId}`);
      }
      
      // Connect VM to production network port group
      const prodNetwork = topology.networks.find((net: any) => net.type === 'cluster_network') || topology.networks[0];
      if (prodNetwork) {
        const netIndex = topology.networks.indexOf(prodNetwork);
        connections.push(`  PG${netIndex} -.-> ${vmId}`);
      }
    });
    
    if (topology.vms.length > 12) {
      diagram += `  MORE_VMS["[+] ${topology.vms.length - 12} more VMs..."]\n`;
      connections.push(`  ESX0 --> MORE_VMS`);
    }
  }

  // Add connections
  diagram += '\n' + connections.join('\n') + '\n';

  // Enhanced styling with professional network colors
  diagram += '\n' + generateEnhancedDiagramStyles();
  
  // Apply enhanced classes
  diagram += generateVirtualNetworkClasses(topology);

  return diagram;
}

/**
 * Generate an enhanced Hyper-V topology diagram with detailed virtualization components
 */
export function generateHyperVDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.hosts || topology.hosts.length === 0) {
    return 'graph TD\n  A[No Hyper-V Hosts Found]';
  }

  const hypervIcons = getTechnologyIcons('hyperv');
  let diagram = 'graph TD\n';
  let connections: string[] = [];
  
  // Add System Center Virtual Machine Manager (SCVMM) as management
  diagram += '  SCVMM["[MGMT] System Center VMM<br/>Hyper-V Management & Orchestration"]\n';
  
  // Add Failover Cluster Manager
  diagram += '  FAILOVER["🔄 Failover Cluster Manager<br/>High Availability & Live Migration"]\n';
  connections.push('  SCVMM --> FAILOVER');
  
  // Add clusters first with enhanced details
  if (topology.clusters && topology.clusters.length > 0) {
    topology.clusters.forEach((cluster: any, clusterIndex: number) => {
      const clusterId = `CL${clusterIndex}`;
      const clusterName = cluster.name || `Hyper-V Cluster ${clusterIndex + 1}`;
      const status = cluster.status || 'unknown';
      const statusIcon = status === 'healthy' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
      const utilization = cluster.utilization || 0;
      
      diagram += `  ${clusterId}["${statusIcon} ${clusterName}<br/>Cluster Shared Volumes<br/>Utilization: ${utilization}%"]\n`;
      connections.push(`  FAILOVER --> ${clusterId}`);
    });
  }
  
  // Add Hyper-V hosts with detailed network configuration
  topology.hosts.slice(0, 10).forEach((host: any, hostIndex: number) => {
    const hostId = `HV${hostIndex}`;
    const hostName = host.name || `Hyper-V Host ${hostIndex + 1}`;
    const status = host.status || 'unknown';
    const statusIcon = status === 'connected' ? '🟢' : status === 'disconnected' ? '🔴' : '🟡';
    
    diagram += `  ${hostId}["${statusIcon} ${hostName}<br/>${host.cpu_cores || 0} cores, ${host.memory_gb || 0}GB<br/>Windows Server Hyper-V"]\n`;
    
    // Connect host to its cluster
    if (host.cluster_id && topology.clusters) {
      const clusterIndex = topology.clusters.findIndex((c: any) => c.id === host.cluster_id);
      if (clusterIndex >= 0) {
        connections.push(`  CL${clusterIndex} --> ${hostId}`);
      }
    } else if (topology.clusters && topology.clusters.length > 0) {
      connections.push(`  CL0 --> ${hostId}`);
    }
    
    // Add Hyper-V Virtual Switches
    const vSwitchExt = `VSWITCH_EXT_${hostIndex}`;
    const vSwitchInt = `VSWITCH_INT_${hostIndex}`;
    const vSwitchPriv = `VSWITCH_PRIV_${hostIndex}`;
    
    diagram += `  ${vSwitchExt}["[EXT] External vSwitch<br/>Production Network<br/>NAT & Internet Access"]\n`;
    diagram += `  ${vSwitchInt}["[INT] Internal vSwitch<br/>Host-VM Communication<br/>Internal Routing"]\n`;
    diagram += `  ${vSwitchPriv}["[PRIV] Private vSwitch<br/>VM-to-VM Only<br/>Isolated Network"]\n`;
    
    connections.push(`  ${hostId} --> ${vSwitchExt}`);
    connections.push(`  ${hostId} --> ${vSwitchInt}`);
    connections.push(`  ${hostId} --> ${vSwitchPriv}`);
    
    // Add physical network adapters
    const pnic1 = `PNIC1_${hostIndex}`;
    const pnic2 = `PNIC2_${hostIndex}`;
    diagram += `  ${pnic1}["[NIC1] Physical NIC 1<br/>1GbE/10GbE<br/>Primary Connection"]\n`;
    diagram += `  ${pnic2}["[NIC2] Physical NIC 2<br/>1GbE/10GbE<br/>NIC Teaming/Redundancy"]\n`;
    
    connections.push(`  ${hostId} --> ${pnic1}`);
    connections.push(`  ${hostId} --> ${pnic2}`);
    connections.push(`  ${pnic1} -.-> ${vSwitchExt}`);
    connections.push(`  ${pnic2} -.-> ${vSwitchExt}`);
  });
  
  if (topology.hosts.length > 10) {
    diagram += `  MORE_HOSTS["[+] ${topology.hosts.length - 10} more Hyper-V hosts..."]\n`;
    connections.push(`  CL0 --> MORE_HOSTS`);
  }
  
  // Add VMs with detailed Hyper-V configuration
  if (topology.vms && topology.vms.length > 0) {
    const maxVMsToShow = 15;
    topology.vms.slice(0, maxVMsToShow).forEach((vm: any, vmIndex: number) => {
      const vmId = `VM${vmIndex}`;
      const vmName = vm.name || `VM ${vmIndex + 1}`;
      const powerState = vm.power_state || vm.powerState || 'unknown';
      const vmIcon = powerState === 'poweredOn' ? '[ON]' : '[OFF]';
      const generation = vmIndex % 2 === 0 ? 'Gen 2' : 'Gen 1'; // Simulate Hyper-V generations
      const guestOS = vm.guest_os ? vm.guest_os.split(' ')[0] : 'Windows';
      
      diagram += `  ${vmId}["${vmIcon} ${vmName}<br/>${guestOS} | ${generation}<br/>${vm.vcpus || 2}vCPU, ${vm.memory_gb || 4}GB<br/>Dynamic Memory: Enabled"]\n`;
      
      // Connect VM to host (distribute VMs across hosts)
      const hostIndex = vmIndex % Math.min(topology.hosts.length, 10);
      connections.push(`  HV${hostIndex} --> ${vmId}`);
      
      // Connect VM to appropriate virtual switch based on VM type
      if (vm.name && vm.name.toLowerCase().includes('web')) {
        connections.push(`  VSWITCH_EXT_${hostIndex} -.-> ${vmId}`);
      } else if (vm.name && vm.name.toLowerCase().includes('internal')) {
        connections.push(`  VSWITCH_INT_${hostIndex} -.-> ${vmId}`);
      } else {
        connections.push(`  VSWITCH_EXT_${hostIndex} -.-> ${vmId}`);
      }
    });
    
    if (topology.vms.length > maxVMsToShow) {
      diagram += `  MORE_VMS["[+] ${topology.vms.length - maxVMsToShow} more VMs..."]\n`;
      connections.push(`  HV0 --> MORE_VMS`);
    }
  }

  // Add shared storage components
  diagram += '  CSV["[STORAGE] Cluster Shared Volumes<br/>Shared VHDX Storage<br/>Live Migration Support"]\n';
  if (topology.clusters && topology.clusters.length > 0) {
    topology.clusters.forEach((_, clusterIndex) => {
      connections.push(`  CL${clusterIndex} -.-> CSV`);
    });
  }

  // Add connections
  diagram += '\n' + connections.join('\n') + '\n';

  // Add enhanced style classes
  diagram += '\n' + generateEnhancedDiagramStyles();
  
  // Apply enhanced classes for Hyper-V
  diagram += generateHyperVClasses(topology);
  
  // Additional Hyper-V specific styling
  diagram += `
  class SCVMM,FAILOVER vCenter
  class CSV storage
  class VSWITCH_EXT_0,VSWITCH_EXT_1,VSWITCH_EXT_2,VSWITCH_EXT_3,VSWITCH_EXT_4,VSWITCH_EXT_5,VSWITCH_EXT_6,VSWITCH_EXT_7,VSWITCH_EXT_8,VSWITCH_EXT_9 virtualNetwork
  class VSWITCH_INT_0,VSWITCH_INT_1,VSWITCH_INT_2,VSWITCH_INT_3,VSWITCH_INT_4,VSWITCH_INT_5,VSWITCH_INT_6,VSWITCH_INT_7,VSWITCH_INT_8,VSWITCH_INT_9 portGroup
  class VSWITCH_PRIV_0,VSWITCH_PRIV_1,VSWITCH_PRIV_2,VSWITCH_PRIV_3,VSWITCH_PRIV_4,VSWITCH_PRIV_5,VSWITCH_PRIV_6,VSWITCH_PRIV_7,VSWITCH_PRIV_8,VSWITCH_PRIV_9 security
  class PNIC1_0,PNIC1_1,PNIC1_2,PNIC1_3,PNIC1_4,PNIC1_5,PNIC1_6,PNIC1_7,PNIC1_8,PNIC1_9 physicalNic
  class PNIC2_0,PNIC2_1,PNIC2_2,PNIC2_3,PNIC2_4,PNIC2_5,PNIC2_6,PNIC2_7,PNIC2_8,PNIC2_9 physicalNic
  `;

  return diagram;
}

/**
 * Generate an enhanced physical infrastructure diagram with comprehensive datacenter components
 */
export function generatePhysicalDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.clusters || topology.clusters.length === 0) {
    return 'graph TD\n  A[No Physical Infrastructure Found]';
  }

  const azureIcons = getTechnologyIcons('azure');
  let diagram = 'graph TD\n';
  let connections: string[] = [];
  
  // Add data center representation with multiple zones
  diagram += '  DC["🏢 Enterprise Data Center<br/>Primary Site<br/>Tier III Certified"]\n';
  
  // Add network infrastructure layer
  diagram += '  CORE_NETWORK["[NET] Core Network Infrastructure<br/>Cisco Nexus 9000 Series<br/>100GbE Backbone"]\n';
  diagram += '  FIREWALL["[FIREWALL] Perimeter Firewall<br/>Next-Gen Security<br/>Intrusion Prevention"]\n';
  diagram += '  LOADBALANCER["[LB] Load Balancer Farm<br/>F5 BIG-IP<br/>SSL Offloading & Health Checks"]\n';
  
  connections.push('  DC --> CORE_NETWORK');
  connections.push('  DC --> FIREWALL');
  connections.push('  CORE_NETWORK --> LOADBALANCER');
  connections.push('  FIREWALL --> CORE_NETWORK');
  
  // Add security zones
  diagram += '  DMZ["[DMZ] DMZ Network<br/>Demilitarized Zone<br/>Public-Facing Services"]\n';
  diagram += '  INTERNAL_ZONE["[SEC] Internal Security Zone<br/>Private Network Segment<br/>Corporate Applications"]\n';
  diagram += '  MGMT_ZONE["[MGMT] Management Zone<br/>Out-of-Band Management<br/>Infrastructure Control"]\n';
  
  connections.push('  FIREWALL --> DMZ');
  connections.push('  CORE_NETWORK --> INTERNAL_ZONE');
  connections.push('  CORE_NETWORK --> MGMT_ZONE');
  
  // Add storage infrastructure
  diagram += '  PRIMARY_STORAGE["[STORAGE] Primary Storage Array<br/>NetApp FAS Series<br/>100TB+ Capacity<br/>Deduplication & Compression"]\n';
  diagram += '  BACKUP_STORAGE["[BACKUP] Backup Storage<br/>Tape Library & Disk<br/>Long-term Retention<br/>Disaster Recovery"]\n';
  
  connections.push('  DC --> PRIMARY_STORAGE');
  connections.push('  DC --> BACKUP_STORAGE');
  
  // Add clusters with enhanced details
  topology.clusters.forEach((cluster: any, clusterIndex: number) => {
    const clusterId = `CL${clusterIndex}`;
    const clusterName = cluster.name || `Compute Cluster ${clusterIndex + 1}`;
    const utilization = cluster.utilization || 0;
    const status = cluster.status || 'unknown';
    const statusIcon = status === 'healthy' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
    
    diagram += `  ${clusterId}["${statusIcon} ${clusterName}<br/>vSphere HA/DRS Enabled<br/>Resource Pool: ${utilization}% utilized<br/>N+1 Redundancy"]`;
    diagram += '\n';
    connections.push(`  INTERNAL_ZONE --> ${clusterId}`);
    connections.push(`  PRIMARY_STORAGE -.-> ${clusterId}`);
  });
  
  // Add physical hosts with detailed specifications
  if (topology.hosts && topology.hosts.length > 0) {
    const maxHostsToShow = 12;
    topology.hosts.slice(0, maxHostsToShow).forEach((host: any, hostIndex: number) => {
      const hostId = `PH${hostIndex}`;
      const hostName = host.name || `Physical Server ${hostIndex + 1}`;
      const status = host.status || 'unknown';
      const statusIcon = status === 'connected' ? '[ONLINE]' : status === 'disconnected' ? '[OFFLINE]' : '[WARNING]';
      
      // Enhanced server specifications
      const cpuCores = host.cpu_cores || (24 + (hostIndex % 12) * 4); // Simulate varied configs
      const memoryGB = host.memory_gb || (256 + (hostIndex % 8) * 128);
      const serverModel = hostIndex % 3 === 0 ? 'Dell R750' : hostIndex % 3 === 1 ? 'HP DL380' : 'Cisco UCS';
      
      diagram += `  ${hostId}["${statusIcon} ${hostName}<br/>${serverModel}<br/>${cpuCores} cores (Intel Xeon), ${memoryGB}GB DDR4<br/>Dual 10GbE + IPMI"]`;
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
      
      // Connect to management zone
      connections.push(`  MGMT_ZONE -.-> ${hostId}`);
    });
    
    if (topology.hosts.length > maxHostsToShow) {
      diagram += `  MORE_HOSTS["[+] ${topology.hosts.length - maxHostsToShow} more physical servers<br/>Rack-mounted & Blade servers<br/>Various configurations..."]\n`;
      connections.push(`  CL0 --> MORE_HOSTS`);
    }
  }

  // Add network switching infrastructure
  diagram += '  TOP_OF_RACK["🔀 Top-of-Rack Switches<br/>48-port 10GbE<br/>Per-Rack Switching"]\n';
  diagram += '  AGGREGATION["🌟 Aggregation Switches<br/>100GbE Uplinks<br/>VLAN & QoS Management"]\n';
  
  connections.push('  CORE_NETWORK --> AGGREGATION');
  connections.push('  AGGREGATION --> TOP_OF_RACK');
  
  // Connect ToR switches to hosts
  if (topology.hosts && topology.hosts.length > 0) {
    const hostCount = Math.min(topology.hosts.length, 12);
    for (let i = 0; i < hostCount; i += 4) { // Group hosts per rack
      connections.push(`  TOP_OF_RACK -.-> PH${i}`);
      if (i + 1 < hostCount) connections.push(`  TOP_OF_RACK -.-> PH${i + 1}`);
      if (i + 2 < hostCount) connections.push(`  TOP_OF_RACK -.-> PH${i + 2}`);
      if (i + 3 < hostCount) connections.push(`  TOP_OF_RACK -.-> PH${i + 3}`);
    }
  }

  // Add power and cooling infrastructure
  diagram += '  UPS["[PWR] UPS Systems<br/>Uninterruptible Power<br/>Battery Backup<br/>Generator Integration"]\n';
  diagram += '  COOLING["[COOLING] Cooling Systems<br/>Precision Air Conditioning<br/>Hot Aisle Containment<br/>Environmental Monitoring"]\n';
  
  connections.push('  DC --> UPS');
  connections.push('  DC --> COOLING');
  
  // Add total capacity metrics if available
  if (topology.vms && topology.vms.length > 0) {
    const totalVMs = topology.vms.length;
    const totalStorage = topology.vms.reduce((sum: number, vm: any) => sum + (vm.storage_gb || 0), 0);
    const totalCPU = topology.vms.reduce((sum: number, vm: any) => sum + (vm.vcpus || 0), 0);
    const totalMemory = topology.vms.reduce((sum: number, vm: any) => sum + (vm.memory_gb || 0), 0);
    
    diagram += `  CAPACITY["[STATS] Infrastructure Capacity<br/>${totalVMs} Virtual Machines<br/>${totalCPU} vCPUs allocated<br/>${Math.round(totalMemory / 1024)} TB RAM<br/>${Math.round(totalStorage / 1024)} TB Storage"]`;
    diagram += '\n';
    connections.push('  DC --> CAPACITY');
  }

  // Add external connectivity
  diagram += '  WAN["🌍 WAN Connectivity<br/>Multiple ISP Links<br/>MPLS & Internet<br/>Redundant Paths"]\n';
  connections.push('  WAN --> FIREWALL');

  // Add connections
  diagram += '\n' + connections.join('\n') + '\n';

  // Add enhanced style classes
  diagram += '\n' + generateEnhancedDiagramStyles();
  
  // Apply enhanced classes for physical infrastructure
  diagram += generatePhysicalClasses(topology);

  return diagram;
}
