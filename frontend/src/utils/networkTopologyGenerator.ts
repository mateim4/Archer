import { NetworkNode, NetworkConnection } from '../components/VisualNetworkDiagram';

interface NetworkTopology {
  clusters?: any[];
  hosts?: any[];
  vms?: any[];
  networks?: any[];
  platform?: string;
}

export const generateVMwareNetworkTopology = (topology?: NetworkTopology): { nodes: NetworkNode[], connections: NetworkConnection[] } => {
  const nodes: NetworkNode[] = [];
  const connections: NetworkConnection[] = [];

  // VMware-specific infrastructure
  
  // vCenter Server
  nodes.push({
    id: 'vcenter',
    name: 'vCenter Server',
    type: 'Management',
    x: 600,
    y: 100,
    icon: 'virtual-machine',
    status: 'healthy',
    properties: {
      version: '8.0',
      role: 'Management Server',
      ip: '192.168.1.10'
    }
  });

  // ESXi Hosts
  const hostPositions = [
    { x: 200, y: 250 },
    { x: 400, y: 250 },
    { x: 800, y: 250 },
    { x: 1000, y: 250 }
  ];

  topology?.hosts?.slice(0, 4).forEach((host, index) => {
    const pos = hostPositions[index] || { x: 200 + (index * 200), y: 250 };
    
    nodes.push({
      id: host.id || `host-${index}`,
      name: host.name || `ESXi-Host-${index + 1}`,
      type: 'ESXi Host',
      x: pos.x,
      y: pos.y,
      icon: 'virtual-machine',
      status: host.status === 'connected' ? 'healthy' : 'warning',
      properties: {
        cpu: `${host.cpu_cores || 32} cores`,
        memory: `${host.memory_gb || 256} GB`,
        version: 'vSphere 8.0'
      }
    });

    // Connect hosts to vCenter
    connections.push({
      from: 'vcenter',
      to: host.id || `host-${index}`,
      type: 'virtual',
      label: 'Management'
    });
  });

  // Distributed Virtual Switch (DVS)
  nodes.push({
    id: 'dvs-main',
    name: 'Production DVS',
    type: 'DVS',
    x: 600,
    y: 350,
    icon: 'virtual-network',
    status: 'healthy',
    properties: {
      version: 'DVS 8.0',
      portgroups: 12,
      uplinks: 4
    }
  });

  // Connect hosts to DVS
  topology?.hosts?.slice(0, 4).forEach((host, index) => {
    connections.push({
      from: host.id || `host-${index}`,
      to: 'dvs-main',
      type: 'virtual',
      label: 'Uplink'
    });
  });

  // Port Groups
  const portGroups = [
    { id: 'pg-mgmt', name: 'Management PG', x: 400, y: 450, vlan: 100 },
    { id: 'pg-vmotion', name: 'vMotion PG', x: 600, y: 450, vlan: 200 },
    { id: 'pg-storage', name: 'Storage PG', x: 800, y: 450, vlan: 300 },
    { id: 'pg-vm', name: 'VM Network PG', x: 600, y: 550, vlan: 400 }
  ];

  portGroups.forEach(pg => {
    nodes.push({
      id: pg.id,
      name: pg.name,
      type: 'Port Group',
      x: pg.x,
      y: pg.y,
      icon: 'virtual-network',
      status: 'healthy',
      properties: {
        vlan: `VLAN ${pg.vlan}`,
        type: 'VLAN Backed',
        ports: 128
      }
    });

    connections.push({
      from: 'dvs-main',
      to: pg.id,
      type: 'virtual',
      label: `VLAN ${pg.vlan}`
    });
  });

  // Virtual Machines
  const vmPositions = [
    { x: 300, y: 650 },
    { x: 500, y: 650 },
    { x: 700, y: 650 },
    { x: 900, y: 650 }
  ];

  topology?.vms?.slice(0, 4).forEach((vm, index) => {
    const pos = vmPositions[index] || { x: 300 + (index * 200), y: 650 };
    
    nodes.push({
      id: vm.id || `vm-${index}`,
      name: vm.name || `VM-${index + 1}`,
      type: 'Virtual Machine',
      x: pos.x,
      y: pos.y,
      icon: vm.guest_os?.includes('Windows') ? 'windows-vm' : 'linux-vm',
      status: vm.power_state === 'poweredOn' ? 'healthy' : 'warning',
      properties: {
        os: vm.guest_os || 'Unknown OS',
        cpu: `${vm.vcpus || 2} vCPUs`,
        memory: `${vm.memory_gb || 8} GB`,
        storage: `${vm.storage_gb || 100} GB`
      }
    });

    // Connect VMs to VM Network Port Group
    connections.push({
      from: 'pg-vm',
      to: vm.id || `vm-${index}`,
      type: 'virtual',
      label: 'VM Network'
    });
  });

  // Physical Network Infrastructure
  nodes.push({
    id: 'physical-switch',
    name: 'Core Switch',
    type: 'Physical Switch',
    x: 600,
    y: 200,
    icon: 'virtual-network',
    status: 'healthy',
    properties: {
      model: 'Cisco Nexus 9000',
      ports: '48x10GbE',
      uplinks: '4x100GbE'
    }
  });

  // Connect DVS to physical switch
  connections.push({
    from: 'physical-switch',
    to: 'dvs-main',
    type: 'fiber',
    label: '10GbE'
  });

  return { nodes, connections };
};

export const generateHyperVNetworkTopology = (topology?: NetworkTopology): { nodes: NetworkNode[], connections: NetworkConnection[] } => {
  const nodes: NetworkNode[] = [];
  const connections: NetworkConnection[] = [];

  // Microsoft Hyper-V specific infrastructure

  // System Center Virtual Machine Manager (SCVMM)
  nodes.push({
    id: 'scvmm',
    name: 'SCVMM Server',
    type: 'Management',
    x: 600,
    y: 100,
    icon: 'virtual-machine',
    status: 'healthy',
    properties: {
      version: 'SCVMM 2022',
      role: 'Fabric Management',
      ip: '192.168.1.20'
    }
  });

  // Failover Cluster Manager
  nodes.push({
    id: 'cluster-mgr',
    name: 'Failover Cluster',
    type: 'Cluster Manager',
    x: 400,
    y: 150,
    icon: 'virtual-machine',
    status: 'healthy',
    properties: {
      nodes: topology?.hosts?.length || 3,
      quorum: 'File Share Witness',
      version: 'Windows Server 2022'
    }
  });

  // Hyper-V Hosts
  const hostPositions = [
    { x: 200, y: 300 },
    { x: 400, y: 300 },
    { x: 600, y: 300 },
    { x: 800, y: 300 }
  ];

  topology?.hosts?.slice(0, 4).forEach((host, index) => {
    const pos = hostPositions[index] || { x: 200 + (index * 200), y: 300 };
    
    nodes.push({
      id: host.id || `hyperv-host-${index}`,
      name: host.name?.replace('esxi', 'hyperv') || `HyperV-Host-${index + 1}`,
      type: 'Hyper-V Host',
      x: pos.x,
      y: pos.y,
      icon: 'virtual-machine',
      status: host.status === 'connected' ? 'healthy' : 'warning',
      properties: {
        cpu: `${host.cpu_cores || 32} cores`,
        memory: `${host.memory_gb || 256} GB`,
        version: 'Hyper-V 2022',
        generation: 'Gen 2'
      }
    });

    // Connect hosts to SCVMM
    connections.push({
      from: 'scvmm',
      to: host.id || `hyperv-host-${index}`,
      type: 'virtual',
      label: 'WinRM/WMI'
    });

    // Connect hosts to cluster
    connections.push({
      from: 'cluster-mgr',
      to: host.id || `hyperv-host-${index}`,
      type: 'virtual',
      label: 'Cluster'
    });
  });

  // Virtual Switches
  const vSwitches = [
    { id: 'vswitch-external', name: 'External vSwitch', x: 300, y: 450, type: 'External' },
    { id: 'vswitch-internal', name: 'Internal vSwitch', x: 600, y: 450, type: 'Internal' },
    { id: 'vswitch-private', name: 'Private vSwitch', x: 900, y: 450, type: 'Private' }
  ];

  vSwitches.forEach(vs => {
    nodes.push({
      id: vs.id,
      name: vs.name,
      type: 'Virtual Switch',
      x: vs.x,
      y: vs.y,
      icon: 'virtual-network',
      status: 'healthy',
      properties: {
        type: vs.type,
        teaming: 'Switch Independent',
        loadBalancing: 'Dynamic'
      }
    });

    // Connect vSwitches to hosts
    topology?.hosts?.slice(0, 4).forEach((host, index) => {
      connections.push({
        from: host.id || `hyperv-host-${index}`,
        to: vs.id,
        type: 'virtual',
        label: 'vNIC'
      });
    });
  });

  // Virtual Machines
  const vmPositions = [
    { x: 200, y: 600 },
    { x: 400, y: 600 },
    { x: 600, y: 600 },
    { x: 800, y: 600 },
    { x: 1000, y: 600 }
  ];

  topology?.vms?.slice(0, 5).forEach((vm, index) => {
    const pos = vmPositions[index] || { x: 200 + (index * 200), y: 600 };
    
    nodes.push({
      id: vm.id || `hyperv-vm-${index}`,
      name: vm.name || `HyperV-VM-${index + 1}`,
      type: 'Hyper-V VM',
      x: pos.x,
      y: pos.y,
      icon: vm.guest_os?.includes('Windows') ? 'windows-vm' : 'linux-vm',
      status: vm.power_state === 'poweredOn' ? 'healthy' : 'warning',
      properties: {
        os: vm.guest_os || 'Windows Server 2022',
        cpu: `${vm.vcpus || 2} vCPUs`,
        memory: `${vm.memory_gb || 8} GB`,
        storage: `${vm.storage_gb || 100} GB`,
        generation: 'Generation 2',
        dynamicMemory: 'Enabled'
      }
    });

    // Connect VMs to appropriate vSwitch
    const targetSwitch = index < 2 ? 'vswitch-external' : 
                        index < 4 ? 'vswitch-internal' : 'vswitch-private';
    
    connections.push({
      from: targetSwitch,
      to: vm.id || `hyperv-vm-${index}`,
      type: 'virtual',
      label: 'vNIC'
    });
  });

  // Cluster Shared Volume (CSV)
  nodes.push({
    id: 'csv-storage',
    name: 'Cluster Shared Volumes',
    type: 'Shared Storage',
    x: 600,
    y: 200,
    icon: 'virtual-machine',
    status: 'healthy',
    properties: {
      capacity: '10TB',
      filesystem: 'CSVFS',
      deduplication: 'Enabled',
      backup: 'DPM'
    }
  });

  // Connect CSV to cluster manager
  connections.push({
    from: 'cluster-mgr',
    to: 'csv-storage',
    type: 'fiber',
    label: 'iSCSI/FC'
  });

  // Physical NIC Teaming
  nodes.push({
    id: 'nic-team',
    name: 'NIC Team',
    type: 'Network Team',
    x: 200,
    y: 150,
    icon: 'virtual-network',
    status: 'healthy',
    properties: {
      mode: 'Switch Independent',
      loadBalancing: 'Dynamic',
      nics: '4x10GbE',
      failover: 'Active/Standby'
    }
  });

  // Connect NIC team to external vSwitch
  connections.push({
    from: 'nic-team',
    to: 'vswitch-external',
    type: 'ethernet',
    label: 'Team Interface'
  });

  return { nodes, connections };
};

export const generatePhysicalNetworkTopology = (): { nodes: NetworkNode[], connections: NetworkConnection[] } => {
  const nodes: NetworkNode[] = [];
  const connections: NetworkConnection[] = [];

  // Physical Infrastructure

  // Core Network Infrastructure
  nodes.push({
    id: 'core-switch-1',
    name: 'Core Switch 1',
    type: 'Core Switch',
    x: 400,
    y: 100,
    icon: 'virtual-network',
    status: 'healthy',
    properties: {
      model: 'Cisco Nexus 9500',
      ports: '64x100GbE',
      redundancy: 'Dual Supervisor',
      protocols: 'BGP, OSPF, VRRP'
    }
  });

  nodes.push({
    id: 'core-switch-2',
    name: 'Core Switch 2',
    type: 'Core Switch',
    x: 800,
    y: 100,
    icon: 'virtual-network',
    status: 'healthy',
    properties: {
      model: 'Cisco Nexus 9500',
      ports: '64x100GbE',
      redundancy: 'Dual Supervisor',
      protocols: 'BGP, OSPF, VRRP'
    }
  });

  // Core redundancy
  connections.push({
    from: 'core-switch-1',
    to: 'core-switch-2',
    type: 'fiber',
    label: '100GbE Trunk'
  });

  // Distribution Switches
  const distSwitches = [
    { id: 'dist-sw-1', name: 'Dist Switch 1', x: 200, y: 250 },
    { id: 'dist-sw-2', name: 'Dist Switch 2', x: 400, y: 250 },
    { id: 'dist-sw-3', name: 'Dist Switch 3', x: 800, y: 250 },
    { id: 'dist-sw-4', name: 'Dist Switch 4', x: 1000, y: 250 }
  ];

  distSwitches.forEach(sw => {
    nodes.push({
      id: sw.id,
      name: sw.name,
      type: 'Distribution Switch',
      x: sw.x,
      y: sw.y,
      icon: 'virtual-network',
      status: 'healthy',
      properties: {
        model: 'Cisco Nexus 9300',
        ports: '48x10GbE + 6x100GbE',
        vlans: '50+ VLANs',
        stp: 'Rapid PVST+'
      }
    });

    // Connect to both core switches for redundancy
    connections.push({
      from: 'core-switch-1',
      to: sw.id,
      type: 'fiber',
      label: '10GbE'
    });
    
    connections.push({
      from: 'core-switch-2',
      to: sw.id,
      type: 'fiber',
      label: '10GbE'
    });
  });

  // Firewalls
  nodes.push({
    id: 'firewall-1',
    name: 'Primary Firewall',
    type: 'Firewall',
    x: 300,
    y: 400,
    icon: 'firewall',
    status: 'healthy',
    properties: {
      model: 'Palo Alto PA-5220',
      throughput: '52 Gbps',
      sessions: '67M',
      ha: 'Active/Passive'
    }
  });

  nodes.push({
    id: 'firewall-2',
    name: 'Secondary Firewall',
    type: 'Firewall',
    x: 900,
    y: 400,
    icon: 'firewall',
    status: 'healthy',
    properties: {
      model: 'Palo Alto PA-5220',
      throughput: '52 Gbps',
      sessions: '67M',
      ha: 'Active/Passive'
    }
  });

  // Connect firewalls to distribution switches
  connections.push({
    from: 'dist-sw-1',
    to: 'firewall-1',
    type: 'ethernet',
    label: 'DMZ'
  });

  connections.push({
    from: 'dist-sw-4',
    to: 'firewall-2',
    type: 'ethernet',
    label: 'DMZ'
  });

  // Load Balancers
  nodes.push({
    id: 'load-balancer',
    name: 'Load Balancer Farm',
    type: 'Load Balancer',
    x: 600,
    y: 500,
    icon: 'load-balancer',
    status: 'healthy',
    properties: {
      model: 'F5 BIG-IP i4800',
      throughput: '40 Gbps',
      ssl: 'Hardware offload',
      nodes: '2x Active/Standby'
    }
  });

  // Storage Arrays
  nodes.push({
    id: 'storage-array-1',
    name: 'Primary Storage',
    type: 'Storage Array',
    x: 150, 
    y: 600,
    icon: 'virtual-machine',
    status: 'healthy',
    properties: {
      model: 'NetApp FAS9000',
      capacity: '500TB',
      protocol: 'NFS/iSCSI/FC',
      deduplication: '3:1 ratio'
    }
  });

  nodes.push({
    id: 'storage-array-2',
    name: 'Backup Storage',
    type: 'Storage Array',
    x: 1050,
    y: 600,
    icon: 'virtual-machine',
    status: 'healthy',
    properties: {
      model: 'Dell EMC Unity 680F',
      capacity: '1PB',
      protocol: 'NFS/iSCSI',
      replication: 'Cross-site'
    }
  });

  // Connect storage to distribution switches
  connections.push({
    from: 'dist-sw-1',
    to: 'storage-array-1',
    type: 'fiber',
    label: '10GbE'
  });

  connections.push({
    from: 'dist-sw-4',
    to: 'storage-array-2',
    type: 'fiber',
    label: '10GbE'
  });

  return { nodes, connections };
};
