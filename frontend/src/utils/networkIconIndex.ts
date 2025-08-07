/**
 * Network Icon Index and Configuration
 * 
 * Comprehensive mapping of Microsoft Azure stencils for network topology diagrams.
 * Icons are sourced from: https://github.com/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio
 */

export interface NetworkIcon {
  name: string;
  description: string;
  category: string;
  useCases: string[];
  mermaidSymbol: string;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
}

export const NETWORK_ICON_INDEX: Record<string, NetworkIcon> = {
  // Virtual Infrastructure
  'virtual-network': {
    name: 'Virtual Network',
    description: 'Azure Virtual Network (VNet) - isolated network environment',
    category: 'networking',
    useCases: ['VNet isolation', 'Subnet segmentation', 'Network boundaries', 'VLAN representation'],
    mermaidSymbol: '🌐',
    color: '#0078d4',
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    borderColor: '#0078d4'
  },
  
  'virtual-machine': {
    name: 'Virtual Machine',
    description: 'Compute instances - Windows/Linux VMs',
    category: 'compute',
    useCases: ['ESXi hosts', 'Guest VMs', 'Workload instances', 'Application servers'],
    mermaidSymbol: '💻',
    color: '#00bcf2',
    backgroundColor: 'rgba(0, 188, 242, 0.1)',
    borderColor: '#00bcf2'
  },
  
  'windows-vm': {
    name: 'Windows VM',
    description: 'Windows Server virtual machines',
    category: 'compute',
    useCases: ['Windows workloads', 'Domain controllers', 'IIS servers', 'SQL Server instances'],
    mermaidSymbol: '🖥️',
    color: '#00a1f1',
    backgroundColor: 'rgba(0, 161, 241, 0.1)',
    borderColor: '#00a1f1'
  },
  
  'linux-vm': {
    name: 'Linux VM', 
    description: 'Linux virtual machines',
    category: 'compute',
    useCases: ['Linux workloads', 'Web servers', 'Database servers', 'Container hosts'],
    mermaidSymbol: '🐧',
    color: '#f25022',
    backgroundColor: 'rgba(242, 80, 34, 0.1)',
    borderColor: '#f25022'
  },
  
  'sql-vm': {
    name: 'SQL Server VM',
    description: 'SQL Server database virtual machines',
    category: 'database',
    useCases: ['Database servers', 'Data storage', 'OLTP systems', 'Analytics workloads'],
    mermaidSymbol: '🗄️',
    color: '#7fba00',
    backgroundColor: 'rgba(127, 186, 0, 0.1)',
    borderColor: '#7fba00'
  },
  
  // Networking Components
  'virtual-network-gateway': {
    name: 'Virtual Network Gateway',
    description: 'VPN and ExpressRoute gateways',
    category: 'networking',
    useCases: ['Site-to-site VPN', 'Point-to-site VPN', 'ExpressRoute connections', 'Hybrid connectivity'],
    mermaidSymbol: '🌉',
    color: '#804998',
    backgroundColor: 'rgba(128, 73, 152, 0.1)',
    borderColor: '#804998'
  },
  
  'vpn-tunnel': {
    name: 'VPN Tunnel',
    description: 'Encrypted network tunnels',
    category: 'security',
    useCases: ['Site-to-site connectivity', 'Secure communications', 'Branch office connections', 'Remote access'],
    mermaidSymbol: '🔐',
    color: '#ffb900',
    backgroundColor: 'rgba(255, 185, 0, 0.1)',
    borderColor: '#ffb900'
  },
  
  'load-balancer': {
    name: 'Load Balancer',
    description: 'Traffic distribution and high availability',
    category: 'networking',
    useCases: ['Traffic distribution', 'High availability', 'Health probes', 'Backend pools'],
    mermaidSymbol: '⚖️',
    color: '#fe6db6',
    backgroundColor: 'rgba(254, 109, 182, 0.1)',
    borderColor: '#fe6db6'
  },
  
  'application-gateway': {
    name: 'Application Gateway',
    description: 'Layer 7 load balancer and web application firewall',
    category: 'networking',
    useCases: ['Web app load balancing', 'SSL termination', 'URL-based routing', 'WAF protection'],
    mermaidSymbol: '🚪',
    color: '#008575',
    backgroundColor: 'rgba(0, 133, 117, 0.1)',
    borderColor: '#008575'
  },
  
  'network-security-group': {
    name: 'Network Security Group',
    description: 'Network-level security rules and filtering',
    category: 'security',
    useCases: ['Access control', 'Port filtering', 'IP restrictions', 'Security rules'],
    mermaidSymbol: '🛡️',
    color: '#d13438',
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    borderColor: '#d13438'
  },
  
  'firewall': {
    name: 'Firewall',
    description: 'Network security and threat protection',
    category: 'security',
    useCases: ['Perimeter security', 'Threat protection', 'IDPS', 'Network filtering'],
    mermaidSymbol: '🔥',
    color: '#ff4b00',
    backgroundColor: 'rgba(255, 75, 0, 0.1)',
    borderColor: '#ff4b00'
  },
  
  'ddos-protection': {
    name: 'DDoS Protection',
    description: 'Distributed denial of service attack protection',
    category: 'security',
    useCases: ['Attack mitigation', 'Traffic analysis', 'Always-on monitoring', 'Adaptive tuning'],
    mermaidSymbol: '🛡️',
    color: '#881798',
    backgroundColor: 'rgba(136, 23, 152, 0.1)',
    borderColor: '#881798'
  },
  
  'nat-gateway': {
    name: 'NAT Gateway',
    description: 'Network Address Translation for outbound connectivity',
    category: 'networking',
    useCases: ['Outbound internet access', 'SNAT', 'IP masquerading', 'Egress traffic'],
    mermaidSymbol: '🔄',
    color: '#0078d4',
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    borderColor: '#0078d4'
  },
  
  'route-table': {
    name: 'Route Table',
    description: 'Custom routing rules and traffic steering',
    category: 'networking',
    useCases: ['Traffic routing', 'Next-hop definitions', 'Route overrides', 'Network segmentation'],
    mermaidSymbol: '🗺️',
    color: '#5e5e5e',
    backgroundColor: 'rgba(94, 94, 94, 0.1)',
    borderColor: '#5e5e5e'
  },
  
  'expressroute': {
    name: 'ExpressRoute',
    description: 'Private dedicated network connections',
    category: 'networking',
    useCases: ['Private connectivity', 'High bandwidth', 'Predictable performance', 'SLA guarantees'],
    mermaidSymbol: '⚡',
    color: '#ff8c00',
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderColor: '#ff8c00'
  },
  
  // Infrastructure Components
  'virtual-cluster': {
    name: 'Virtual Cluster',
    description: 'Clustered compute resources',
    category: 'compute',
    useCases: ['ESXi clusters', 'Hyper-V clusters', 'High availability', 'Resource pooling'],
    mermaidSymbol: '🏗️',
    color: '#00bcf2',
    backgroundColor: 'rgba(0, 188, 242, 0.1)',
    borderColor: '#00bcf2'
  },
  
  // Network Protocols and Services
  'vlan': {
    name: 'VLAN',
    description: 'Virtual Local Area Network segmentation',
    category: 'networking',
    useCases: ['Network segmentation', 'Broadcast domains', 'Traffic isolation', 'Port groups'],
    mermaidSymbol: '📡',
    color: '#0078d4',
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    borderColor: '#0078d4'
  },
  
  'dvswitch': {
    name: 'Distributed Virtual Switch',
    description: 'VMware vSphere distributed switching',
    category: 'virtualization',
    useCases: ['Centralized switching', 'VLAN management', 'Port group policies', 'Network consistency'],
    mermaidSymbol: '🔀',
    color: '#4b7c9d',
    backgroundColor: 'rgba(75, 124, 157, 0.1)',
    borderColor: '#4b7c9d'
  },
  
  'port-group': {
    name: 'Port Group',
    description: 'Virtual switch port configurations',
    category: 'virtualization',
    useCases: ['VM network assignment', 'VLAN tagging', 'Traffic shaping', 'Security policies'],
    mermaidSymbol: '🔌',
    color: '#7fba00',
    backgroundColor: 'rgba(127, 186, 0, 0.1)',
    borderColor: '#7fba00'
  },
  
  'vmkernel': {
    name: 'VMkernel Port',
    description: 'ESXi management and service interfaces',
    category: 'virtualization',
    useCases: ['vMotion', 'Management traffic', 'IP storage', 'Fault tolerance'],
    mermaidSymbol: '⚙️',
    color: '#005a9b',
    backgroundColor: 'rgba(0, 90, 155, 0.1)',
    borderColor: '#005a9b'
  },
  
  'vmnic': {
    name: 'Physical NIC',
    description: 'Physical network interface cards',
    category: 'hardware',
    useCases: ['Physical connectivity', 'NIC teaming', 'Uplink redundancy', 'Bandwidth aggregation'],
    mermaidSymbol: '🔗',
    color: '#e3008c',
    backgroundColor: 'rgba(227, 0, 140, 0.1)',
    borderColor: '#e3008c'
  }
};

// Category-based icon grouping
export const ICON_CATEGORIES = {
  networking: ['virtual-network', 'virtual-network-gateway', 'load-balancer', 'application-gateway', 'nat-gateway', 'route-table', 'expressroute', 'vlan', 'dvswitch', 'port-group'],
  compute: ['virtual-machine', 'windows-vm', 'linux-vm', 'virtual-cluster'],
  security: ['network-security-group', 'firewall', 'ddos-protection', 'vpn-tunnel'],
  database: ['sql-vm'],
  virtualization: ['dvswitch', 'port-group', 'vmkernel'],
  hardware: ['vmnic']
};

// Technology-specific icon sets
export const TECHNOLOGY_ICON_SETS = {
  vmware: {
    cluster: 'virtual-cluster',
    host: 'virtual-machine',
    vm: 'windows-vm',
    dvswitch: 'dvswitch',
    portgroup: 'port-group',
    vmkernel: 'vmkernel',
    vmnic: 'vmnic',
    vlan: 'vlan'
  },
  hyperv: {
    cluster: 'virtual-cluster',
    host: 'virtual-machine',
    vm: 'windows-vm',
    vswitch: 'virtual-network',
    vlan: 'vlan'
  },
  azure: {
    vnet: 'virtual-network',
    subnet: 'virtual-network',
    vm: 'virtual-machine',
    nsg: 'network-security-group',
    lb: 'load-balancer',
    appgw: 'application-gateway',
    firewall: 'firewall',
    vpngw: 'virtual-network-gateway',
    natgw: 'nat-gateway'
  }
};

/**
 * Get icon configuration by name
 */
export function getNetworkIcon(iconName: string): NetworkIcon | null {
  return NETWORK_ICON_INDEX[iconName] || null;
}

/**
 * Get icons by category
 */
export function getIconsByCategory(category: string): NetworkIcon[] {
  return Object.values(NETWORK_ICON_INDEX).filter(icon => icon.category === category);
}

/**
 * Get technology-specific icon set
 */
export function getTechnologyIcons(technology: 'vmware' | 'hyperv' | 'azure'): Record<string, NetworkIcon> {
  const iconSet = TECHNOLOGY_ICON_SETS[technology];
  const result: Record<string, NetworkIcon> = {};
  
  for (const [key, iconName] of Object.entries(iconSet)) {
    const icon = getNetworkIcon(iconName);
    if (icon) {
      result[key] = icon;
    }
  }
  
  return result;
}

/**
 * Generate CSS styles for network icons in mermaid diagrams
 */
export function generateIconStyles(): string {
  const styles: string[] = [];
  
  Object.entries(NETWORK_ICON_INDEX).forEach(([key, icon]) => {
    styles.push(`
      .${key} {
        fill: ${icon.backgroundColor || 'rgba(255,255,255,0.9)'};
        stroke: ${icon.borderColor || icon.color};
        stroke-width: 2px;
        color: ${icon.color};
      }
      .${key}-text {
        fill: ${icon.color};
        font-weight: 600;
      }
    `);
  });
  
  return styles.join('\n');
}
