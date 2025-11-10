/**
 * Build Hierarchy Utility
 * 
 * Constructs a hierarchical tree structure from a flat graph of nodes and edges.
 * This is used for tree-based visualizations and organizing infrastructure components.
 */

import type { GraphNode, GraphEdge, StandardizedGraph, Vendor } from '@/types/infra-visualizer';

export type HierNode = {
  id: string;
  label: string;
  kind?: string;
  vendor?: Vendor;
  children: HierNode[];
};

export interface BuildHierarchyOptions {
  includeSwitchDeps?: boolean;
  maxHostsPerColumn?: number;
}

/**
 * Build a hierarchical tree from a standardized graph
 * 
 * @param graph - The standardized graph with nodes and edges
 * @param options - Build options
 * @returns Root hierarchy node
 */
export function buildHierarchy(
  graph: StandardizedGraph,
  options?: BuildHierarchyOptions
): HierNode {
  const MAX_HOSTS_PER_COLUMN = options?.maxHostsPerColumn ?? 10;
  
  const nodesById = new Map<string, GraphNode>(graph.nodes.map(n => [n.id, n]));
  
  // Helper: Get nodes by kind
  const byKind = (kind: string) => graph.nodes.filter(n => n.data.kind === kind);
  
  // Find root nodes
  const datacenterNode = graph.nodes.find(n => n.data.kind === 'datacenter');
  const clusters = byKind('cluster');
  const hosts = byKind('physical-host');
  const vms = byKind('virtual-machine');
  
  // Build cluster -> host mappings
  const clusterMap = new Map<string, string[]>(); // clusterId -> hostIds
  
  for (const host of hosts) {
    const hostData: any = host.data;
    const clusterName = hostData.cluster || 'Unclustered';
    
    if (!clusterMap.has(clusterName)) {
      clusterMap.set(clusterName, []);
    }
    clusterMap.get(clusterName)!.push(host.id);
  }
  
  // Build host -> VM mappings
  const hostVmMap = new Map<string, string[]>(); // hostId -> vmIds
  
  for (const vm of vms) {
    const vmData: any = vm.data;
    const parentHostId = vmData.parentHostId;
    
    if (parentHostId) {
      if (!hostVmMap.has(parentHostId)) {
        hostVmMap.set(parentHostId, []);
      }
      hostVmMap.get(parentHostId)!.push(vm.id);
    }
  }
  
  // Create hierarchy nodes
  const makeVmNode = (vmId: string): HierNode => {
    const vm = nodesById.get(vmId)!;
    const vmData: any = vm.data;
    return {
      id: vmId,
      label: vmData.name || vmId,
      kind: vmData.kind,
      children: [],
    };
  };
  
  const makeHostNode = (hostId: string): HierNode => {
    const host = nodesById.get(hostId)!;
    const hostData: any = host.data;
    const vmIds = hostVmMap.get(hostId) || [];
    const vmChildren = vmIds.map(makeVmNode);
    vmChildren.sort((a, b) => a.label.localeCompare(b.label));
    
    return {
      id: hostId,
      label: hostData.name || hostId,
      kind: hostData.kind,
      vendor: hostData.vendor,
      children: vmChildren,
    };
  };
  
  const makeClusterNode = (clusterName: string, hostIds: string[]): HierNode => {
    const hostNodes = hostIds.map(makeHostNode);
    hostNodes.sort((a, b) => a.label.localeCompare(b.label));
    
    let children: HierNode[] = [];
    
    // If many hosts, organize into columns
    if (hostNodes.length > MAX_HOSTS_PER_COLUMN) {
      const numColumns = Math.ceil(hostNodes.length / MAX_HOSTS_PER_COLUMN);
      
      for (let col = 0; col < numColumns; col++) {
        const startIdx = col * MAX_HOSTS_PER_COLUMN;
        const endIdx = Math.min(startIdx + MAX_HOSTS_PER_COLUMN, hostNodes.length);
        const columnHosts = hostNodes.slice(startIdx, endIdx);
        
        children.push({
          id: `${clusterName}:host-column-${col}`,
          label: `Hosts (${startIdx + 1}-${endIdx})`,
          kind: 'host-column',
          children: columnHosts,
        });
      }
    } else {
      children = hostNodes;
    }
    
    // Find real cluster node from graph
    const clusterNode = clusters.find(c => {
      const cData: any = c.data;
      return cData.name === clusterName;
    });
    
    const clusterId = clusterNode ? clusterNode.id : `cluster:${clusterName}`;
    
    return {
      id: clusterId,
      label: clusterName,
      kind: 'cluster',
      children,
    };
  };
  
  // Build cluster hierarchy
  const clusterNodes: HierNode[] = [];
  
  for (const [clusterName, hostIds] of clusterMap.entries()) {
    clusterNodes.push(makeClusterNode(clusterName, hostIds));
  }
  
  // Sort clusters alphabetically
  clusterNodes.sort((a, b) => a.label.localeCompare(b.label));
  
  // Build root (datacenter or default)
  if (datacenterNode) {
    const dcData: any = datacenterNode.data;
    return {
      id: datacenterNode.id,
      label: dcData.name || 'Datacenter',
      kind: 'datacenter',
      children: clusterNodes,
    };
  }
  
  return {
    id: 'datacenter:default',
    label: 'Infrastructure',
    kind: 'datacenter',
    children: clusterNodes,
  };
}
