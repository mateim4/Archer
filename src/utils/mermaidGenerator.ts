// Mermaid diagram generators for network topology visualization
import { NetworkTopology } from '../store/useAppStore';

/**
 * Generate a virtual network diagram using Mermaid syntax
 */
export function generateVirtualDiagram(topology: NetworkTopology): string {
  if (!topology || !topology.networks || topology.networks.length === 0) {
    return 'graph TD\n  A[No Virtual Networks Found]';
  }

  let diagram = 'graph TD\n';

  // Add networks
  topology.networks.forEach((network: any, index: number) => {
    const netId = `VN${index}`;
    diagram += `  ${netId}[\"${network.name || `Virtual Network ${index + 1}`}\"]\n`;
  });

  // Add VMs and connect to networks
  if (topology.vms && topology.vms.length > 0) {
    topology.vms.forEach((vm: any, vmIndex: number) => {
      const vmId = `VM${vmIndex}`;
      diagram += `  ${vmId}[\"${vm.name || `VM ${vmIndex + 1}`}\"]\n`;
      
      // Connect VM to first network (simplified)
      if (topology.networks.length > 0) {
        diagram += `  VN0 --> ${vmId}\n`;
      }
    });
  }

  // Add style classes
  diagram += `
  classDef virtualNetwork fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:white
  classDef virtualMachine fill:#a855f7,stroke:#7c3aed,stroke-width:2px,color:white
  
  class ${topology.networks.map((_: any, i: number) => `VN${i}`).join(',')} virtualNetwork
  class ${topology.vms?.map((_: any, i: number) => `VM${i}`).join(',') || ''} virtualMachine
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
  
  // Add hosts
  topology.hosts.forEach((host: any, index: number) => {
    const hostId = `HV${index}`;
    diagram += `  ${hostId}[\"${host.name || `Hyper-V Host ${index + 1}`}\"]\n`;
  });
  
  // Add VMs and connect to hosts
  if (topology.vms && topology.vms.length > 0) {
    topology.vms.forEach((vm: any, vmIndex: number) => {
      const vmId = `VM${vmIndex}`;
      diagram += `  ${vmId}[\"${vm.name || `VM ${vmIndex + 1}`}\"]\n`;
      
      // Connect VM to first host (simplified)
      if (topology.hosts.length > 0) {
        diagram += `  HV0 --> ${vmId}\n`;
      }
    });
  }

  // Add style classes
  diagram += `
  classDef hyperVHost fill:#ec4899,stroke:#db2777,stroke-width:3px,color:white
  classDef virtualMachine fill:#a855f7,stroke:#7c3aed,stroke-width:2px,color:white
  
  class ${topology.hosts.map((_: any, i: number) => `HV${i}`).join(',')} hyperVHost
  class ${topology.vms?.map((_: any, i: number) => `VM${i}`).join(',') || ''} virtualMachine
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
  
  // Add clusters
  topology.clusters.forEach((cluster: any, index: number) => {
    const clusterId = `CL${index}`;
    diagram += `  ${clusterId}[\"${cluster.name || `Cluster ${index + 1}`}\"]\n`;
  });
  
  // Add hosts and connect to clusters
  if (topology.hosts && topology.hosts.length > 0) {
    topology.hosts.forEach((host: any, hostIndex: number) => {
      const hostId = `PH${hostIndex}`;
      diagram += `  ${hostId}[\"${host.name || `Physical Host ${hostIndex + 1}`}\"]\n`;
      
      // Connect host to first cluster (simplified)
      if (topology.clusters.length > 0) {
        diagram += `  CL0 --> ${hostId}\n`;
      }
    });
  }

  // Add style classes
  diagram += `
  classDef cluster fill:#10b981,stroke:#059669,stroke-width:3px,color:white
  classDef physicalHost fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:white
  
  class ${topology.clusters.map((_: any, i: number) => `CL${i}`).join(',')} cluster
  class ${topology.hosts?.map((_: any, i: number) => `PH${i}`).join(',') || ''} physicalHost
  `;

  return diagram;
}
