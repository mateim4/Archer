/**
 * RVTools to Graph Transformer
 * Converts RVTools upload data into network graph nodes and edges
 */

import { 
  GraphNode, 
  GraphEdge, 
  VirtualMachineNodeData, 
  PhysicalHostNodeData, 
  ClusterNodeData, 
  DatacenterNodeData,
  Vendor
} from '@/types/infra-visualizer';

// ============================================================================
// RVTools Data Interfaces
// ============================================================================

export interface RVToolsVM {
  vm_name: string;
  host_name: string;
  cluster_name: string;
  datacenter_name?: string;
  power_state: string;
  cpu_count: number;
  memory_mb: number;
  provisioned_mb: number;
  in_use_mb: number;
  os: string;
  vm_version?: string;
  ip_address?: string;
  dns_name?: string;
}

export interface RVToolsHost {
  host_name: string;
  cluster_name: string;
  datacenter_name?: string;
  cpu_model: string;
  cpu_cores: number;
  cpu_threads: number;
  memory_gb: number;
  vendor: string;
  model: string;
  version?: string;
}

export interface RVToolsCluster {
  cluster_name: string;
  datacenter_name?: string;
  total_hosts: number;
  total_vms: number;
  drs_enabled?: boolean;
  ha_enabled?: boolean;
}

export interface RVToolsDatacenter {
  datacenter_name: string;
  total_clusters: number;
  total_hosts: number;
  total_vms: number;
}

export interface RVToolsData {
  vms: RVToolsVM[];
  hosts: RVToolsHost[];
  clusters: RVToolsCluster[];
  datacenters?: RVToolsDatacenter[];
  uploaded_at?: string;
  vm_count?: number;
  host_count?: number;
  cluster_count?: number;
}

export interface RVToolsUpload {
  id: string;
  project_id?: string;
  filename: string;
  file_type: string;
  uploaded_at: string;
  processed: boolean;
  vm_count: number;
  host_count: number;
  cluster_count: number;
  data?: RVToolsData;
}

// ============================================================================
// Transformation Options
// ============================================================================

export interface RVToolsTransformOptions {
  /**
   * Whether to create datacenter nodes (default: true)
   */
  includeDatacenters?: boolean;
  
  /**
   * Whether to create cluster nodes (default: true)
   */
  includeClusters?: boolean;
  
  /**
   * Layout starting position (default: { x: 0, y: 0 })
   */
  startPosition?: { x: number; y: number };
  
  /**
   * Spacing between nodes (default: 200)
   */
  nodeSpacing?: number;
  
  /**
   * Whether to normalize host names (remove domain suffixes)
   */
  normalizeNames?: boolean;
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform RVTools upload into graph nodes and edges
 */
export function transformRVToolsToGraph(
  upload: RVToolsUpload,
  options: RVToolsTransformOptions = {}
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const {
    includeDatacenters = true,
    includeClusters = true,
    startPosition = { x: 0, y: 0 },
    nodeSpacing = 200,
    normalizeNames = true,
  } = options;

  if (!upload.data) {
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const { vms, hosts, clusters, datacenters } = upload.data;

  // Track created node IDs to avoid duplicates
  const datacenterIds = new Set<string>();
  const clusterIds = new Set<string>();
  const hostIds = new Set<string>();

  let yOffset = startPosition.y;

  // ============================================================================
  // 1. Create Datacenter Nodes
  // ============================================================================
  if (includeDatacenters && datacenters && datacenters.length > 0) {
    datacenters.forEach((dc, index) => {
      const dcId = `datacenter-${sanitizeId(dc.datacenter_name)}`;
      const dcName = normalizeNames ? normalizeName(dc.datacenter_name) : dc.datacenter_name;
      
      if (!datacenterIds.has(dcId)) {
        nodes.push({
          id: dcId,
          type: 'datacenter',
          position: { x: startPosition.x, y: yOffset },
          data: {
            kind: 'datacenter',
            name: dcName,
            ariaLabel: `Datacenter: ${dcName}`,
            totalClusters: dc.total_clusters,
            totalHosts: dc.total_hosts,
            totalVMs: dc.total_vms,
          } as DatacenterNodeData,
        });
        datacenterIds.add(dcId);
        yOffset += nodeSpacing;
      }
    });
  }

  // ============================================================================
  // 2. Create Cluster Nodes
  // ============================================================================
  if (includeClusters && clusters && clusters.length > 0) {
    clusters.forEach((cluster, index) => {
      const clusterId = `cluster-${sanitizeId(cluster.cluster_name)}`;
      const clusterName = normalizeNames ? normalizeName(cluster.cluster_name) : cluster.cluster_name;
      
      if (!clusterIds.has(clusterId)) {
        nodes.push({
          id: clusterId,
          type: 'cluster',
          position: { x: startPosition.x + nodeSpacing, y: yOffset },
          data: {
            kind: 'cluster',
            name: clusterName,
            ariaLabel: `Cluster: ${clusterName}`,
            totalHosts: cluster.total_hosts,
            totalVMs: cluster.total_vms,
            drsEnabled: cluster.drs_enabled,
            haEnabled: cluster.ha_enabled,
          } as ClusterNodeData,
        });
        clusterIds.add(clusterId);

        // Create edge from datacenter to cluster
        if (includeDatacenters && cluster.datacenter_name) {
          const dcId = `datacenter-${sanitizeId(cluster.datacenter_name)}`;
          if (datacenterIds.has(dcId)) {
            edges.push({
              id: `${dcId}-to-${clusterId}`,
              source: dcId,
              target: clusterId,
              type: 'contains',
              data: {
                kind: 'contains',
                ariaLabel: `Datacenter contains cluster ${clusterName}`,
              },
            });
          }
        }
        yOffset += nodeSpacing;
      }
    });
  }

  // ============================================================================
  // 3. Create Host Nodes
  // ============================================================================
  if (hosts && hosts.length > 0) {
    hosts.forEach((host, index) => {
      const hostId = `host-${sanitizeId(host.host_name)}`;
      const hostName = normalizeNames ? normalizeName(host.host_name) : host.host_name;
      
      if (!hostIds.has(hostId)) {
        const vendor = detectVendor(host.vendor, host.model);
        
        nodes.push({
          id: hostId,
          type: 'physical-host',
          position: { x: startPosition.x + nodeSpacing * 2, y: yOffset },
          data: {
            kind: 'physical-host',
            name: hostName,
            ariaLabel: `Physical Host: ${hostName}`,
            vendor,
            model: host.model,
            cpuCores: host.cpu_cores,
            cpuSockets: host.cpu_threads / host.cpu_cores || 1,
            cpuCoresTotal: host.cpu_cores,
            memoryGB: host.memory_gb,
            cluster: host.cluster_name,
          } as PhysicalHostNodeData,
        });
        hostIds.add(hostId);

        // Create edge from cluster to host
        if (includeClusters && host.cluster_name) {
          const clusterId = `cluster-${sanitizeId(host.cluster_name)}`;
          if (clusterIds.has(clusterId)) {
            edges.push({
              id: `${clusterId}-to-${hostId}`,
              source: clusterId,
              target: hostId,
              type: 'contains',
              data: {
                kind: 'contains',
                ariaLabel: `Cluster contains host ${hostName}`,
              },
            });
          }
        }
        yOffset += nodeSpacing / 2;
      }
    });
  }

  // ============================================================================
  // 4. Create VM Nodes
  // ============================================================================
  if (vms && vms.length > 0) {
    vms.forEach((vm, index) => {
      const vmId = `vm-${sanitizeId(vm.vm_name)}`;
      const vmName = normalizeNames ? normalizeName(vm.vm_name) : vm.vm_name;
      const hostId = `host-${sanitizeId(vm.host_name)}`;
      
      // Map power state to the expected format
      let powerState: 'poweredOn' | 'poweredOff' | 'suspended' = 'poweredOff';
      const powerStateLower = vm.power_state.toLowerCase();
      if (powerStateLower.includes('on') || powerStateLower === 'running') {
        powerState = 'poweredOn';
      } else if (powerStateLower.includes('suspend')) {
        powerState = 'suspended';
      }
      
      nodes.push({
        id: vmId,
        type: 'virtual-machine',
        position: { x: startPosition.x + nodeSpacing * 3, y: yOffset },
        data: {
          kind: 'virtual-machine',
          name: vmName,
          ariaLabel: `Virtual Machine: ${vmName}`,
          parentHostId: hostId,
          powerState,
          guestOS: vm.os,
          cpuCount: vm.cpu_count,
          memoryMB: vm.memory_mb,
          provisionedSpaceGB: vm.provisioned_mb / 1024,
          usedSpaceGB: vm.in_use_mb / 1024,
          ipAddress: vm.ip_address,
          hostName: vm.dns_name,
        } as VirtualMachineNodeData,
      });

      // Create edge from host to VM
      if (hostIds.has(hostId)) {
        edges.push({
          id: `${hostId}-to-${vmId}`,
          source: hostId,
          target: vmId,
          type: 'contains',
          data: {
            kind: 'contains',
            ariaLabel: `Host contains VM ${vmName}`,
          },
        });
      }
      yOffset += nodeSpacing / 4;
    });
  }

  return { nodes, edges };
}

/**
 * Transform multiple RVTools uploads into a combined graph
 */
export function transformMultipleRVToolsToGraph(
  uploads: RVToolsUpload[],
  options: RVToolsTransformOptions = {}
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const allNodes: GraphNode[] = [];
  const allEdges: GraphEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  uploads.forEach((upload, index) => {
    const { nodes, edges } = transformRVToolsToGraph(upload, {
      ...options,
      startPosition: {
        x: options.startPosition?.x || 0,
        y: (options.startPosition?.y || 0) + (index * (options.nodeSpacing || 200) * 10),
      },
    });

    // Add nodes (avoid duplicates)
    nodes.forEach(node => {
      if (!nodeIds.has(node.id)) {
        allNodes.push(node);
        nodeIds.add(node.id);
      }
    });

    // Add edges (avoid duplicates)
    edges.forEach(edge => {
      if (!edgeIds.has(edge.id)) {
        allEdges.push(edge);
        edgeIds.add(edge.id);
      }
    });
  });

  return { nodes: allNodes, edges: allEdges };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize a name for use as a node ID
 */
function sanitizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize a display name (remove domain suffixes, etc.)
 */
function normalizeName(name: string): string {
  // Remove common domain suffixes
  return name
    .replace(/\.local$/i, '')
    .replace(/\.corp$/i, '')
    .replace(/\.internal$/i, '')
    .replace(/\.lan$/i, '');
}

/**
 * Detect vendor from vendor string and model
 */
function detectVendor(vendor: string, model: string): Vendor {
  const vendorLower = (vendor || '').toLowerCase();
  const modelLower = (model || '').toLowerCase();
  
  if (vendorLower.includes('dell') || modelLower.includes('poweredge')) {
    return 'Dell';
  }
  if (vendorLower.includes('hp') || vendorLower.includes('hewlett') || vendorLower.includes('hpe') || modelLower.includes('proliant')) {
    return 'HPE';
  }
  if (vendorLower.includes('lenovo') || modelLower.includes('thinkserver') || modelLower.includes('thinksystem')) {
    return 'Lenovo';
  }
  if (vendorLower.includes('cisco') || modelLower.includes('ucs')) {
    return 'Cisco';
  }
  if (vendorLower.includes('vmware') || vendorLower.includes('esxi')) {
    return 'VMware';
  }
  if (vendorLower.includes('microsoft') || vendorLower.includes('hyper-v')) {
    return 'Microsoft';
  }
  if (vendorLower.includes('nutanix')) {
    return 'Nutanix';
  }
  return 'Unknown';
}

/**
 * Extract datacenter name from cluster or host data
 */
function extractDatacenterName(item: { datacenter_name?: string }): string | null {
  return item.datacenter_name || null;
}
