/**
 * Network Graph Type Definitions for LCMDesigner Infra-Visualizer
 * Adapted from Infra-Visualizer project with LCMDesigner-specific extensions
 */

import type { HTMLAttributes } from 'react';
import type { Edge, Node } from '@xyflow/react';

// ============================================================================
// VENDOR & NODE TYPES
// ============================================================================

export type Vendor = 'VMware' | 'Nutanix' | 'Hyper-V' | 'Microsoft' | 'Dell' | 'HPE' | 'Lenovo' | 'Cisco' | 'Unknown';

export type NodeType =
  | 'physical-host'
  | 'physical-nic'
  | 'nic-bond'
  | 'virtual-switch'
  | 'distributed-switch'
  | 'port-group'
  | 'dvport-group'
  | 'vlan-network'
  | 'vmkernel-adapter'
  | 'management-vnic'
  | 'controller-vm'
  | 'virtual-machine'  // LCMDesigner extension
  | 'cluster'          // LCMDesigner extension
  | 'datastore'        // LCMDesigner extension
  | 'resource-pool'    // LCMDesigner extension
  | 'datacenter';      // LCMDesigner extension

export type EdgeType =
  | 'contains'
  | 'member-of-bond'
  | 'uplink'
  | 'provides'
  | 'connects-to'
  | 'vm-connection'
  | 'vmk-connection'
  | 'cluster-membership'
  | 'internal-link'
  | 'spans-hosts'
  | 'uses-storage'     // LCMDesigner extension
  | 'in-resource-pool'; // LCMDesigner extension

// ============================================================================
// LAYOUT & DIMENSIONS
// ============================================================================

export interface NodeDimensions {
  width: number;
  height: number;
}

export interface NodeLayoutHints {
  layer?: number;
  order?: number;
  groupId?: string;
  dimensions?: NodeDimensions;
}

// ============================================================================
// NETWORK CONFIGURATION TYPES
// ============================================================================

export type LinkStatus = 'Up' | 'Down' | 'Unknown';
export type BondMode = 'active-standby' | 'lacp' | 'balance-tcp' | 'balance-slb' | 'unknown';
export type VirtualSwitchClass =
  | 'standard'
  | 'distributed'
  | 'external'
  | 'internal'
  | 'private'
  | 'bridge';
export type VlanMode = 'access' | 'trunk' | 'untagged';

export interface VlanConfig {
  mode: VlanMode;
  vlanId?: number;
  vlanRange?: string;
}

export interface SecurityPolicy {
  promiscuousMode?: boolean;
  macAddressChanges?: boolean;
  forgedTransmits?: boolean;
}

// ============================================================================
// BASE NODE DATA
// ============================================================================

interface BaseNodeData {
  kind: NodeType;
  name: string;
  ariaLabel: string;
  vendor?: Vendor;
  description?: string;
  tags?: string[];
  metadata?: Record<string, string>;
  domAttributes?: HTMLAttributes<HTMLDivElement>;
  [key: string]: unknown;
}

// ============================================================================
// INFRASTRUCTURE NODE DATA
// ============================================================================

export interface PhysicalHostNodeData extends BaseNodeData {
  kind: 'physical-host';
  vendor: Vendor;
  model?: string;
  cpuCores?: number;
  cpuSockets?: number;
  cpuCoresTotal?: number;
  memoryGB?: number;
  ipAddress?: string;
  cluster?: string;
  role?: string;
  storageTypes?: Array<'Fibre' | 'iSCSI' | 'NAS' | 'vSAN'>;
  isVSANNode?: boolean;
  nicModels?: string[];
  hbaModels?: string[];
}

export interface PhysicalNicNodeData extends BaseNodeData {
  kind: 'physical-nic';
  parentHostId: string;
  device?: string;
  macAddress?: string;
  speedMbps?: number;
  linkStatus: LinkStatus;
  driver?: string;
  pciSlot?: string;
  bondingGroup?: string;
  connectedSwitchIds?: string[];
}

export interface NicBondNodeData extends BaseNodeData {
  kind: 'nic-bond';
  parentHostId: string;
  mode: BondMode;
  memberNics?: string[];
  lacpEnabled?: boolean;
}

export interface VirtualSwitchNodeData extends BaseNodeData {
  kind: 'virtual-switch' | 'distributed-switch';
  switchClass: VirtualSwitchClass;
  parentHostId?: string;
  ports?: number;
  mtu?: number;
  uplinks?: string[];
  features?: string[];
  failurePolicy?: string;
}

export interface PortGroupNodeData extends BaseNodeData {
  kind: 'port-group' | 'dvport-group' | 'vlan-network';
  parentSwitchId: string;
  vlan: VlanConfig;
  ports?: number;
  securityPolicy?: SecurityPolicy;
  services?: string[];
}

export interface VmkernelAdapterNodeData extends BaseNodeData {
  kind: 'vmkernel-adapter' | 'management-vnic';
  parentHostId: string;
  portGroupId?: string;
  ipAddress?: string;
  subnetMask?: string;
  macAddress?: string;
  mtu?: number;
  services?: string[];
}

export interface ControllerVmNodeData extends BaseNodeData {
  kind: 'controller-vm';
  parentHostId: string;
  ipAddress?: string;
  role?: string;
  networks?: string[];
}

// ============================================================================
// LCMDESIGNER EXTENSIONS - VIRTUALIZATION LAYER
// ============================================================================

export interface VirtualMachineNodeData extends BaseNodeData {
  kind: 'virtual-machine';
  parentHostId?: string;
  clusterId?: string;
  powerState?: 'poweredOn' | 'poweredOff' | 'suspended';
  guestOS?: string;
  cpuCount?: number;
  memoryMB?: number;
  provisionedSpaceGB?: number;
  usedSpaceGB?: number;
  ipAddress?: string;
  hostName?: string;
  networks?: string[];
  datastores?: string[];
  resourcePool?: string;
}

export interface ClusterNodeData extends BaseNodeData {
  kind: 'cluster';
  totalHosts?: number;
  totalVMs?: number;
  totalCpuCores?: number;
  totalMemoryGB?: number;
  haEnabled?: boolean;
  drsEnabled?: boolean;
  vsanEnabled?: boolean;
}

export interface DatastoreNodeData extends BaseNodeData {
  kind: 'datastore';
  type?: 'VMFS' | 'NFS' | 'vSAN' | 'vVOL';
  capacityGB?: number;
  freeSpaceGB?: number;
  hosts?: string[];
  vms?: string[];
}

export interface ResourcePoolNodeData extends BaseNodeData {
  kind: 'resource-pool';
  parentId?: string;
  cpuReservation?: number;
  cpuLimit?: number;
  memoryReservation?: number;
  memoryLimit?: number;
  vms?: string[];
}

// ============================================================================
// UNIFIED NODE DATA TYPE
// ============================================================================

export type NodeData =
  | PhysicalHostNodeData
  | PhysicalNicNodeData
  | NicBondNodeData
  | VirtualSwitchNodeData
  | PortGroupNodeData
  | VmkernelAdapterNodeData
  | ControllerVmNodeData
  | VirtualMachineNodeData
  | ClusterNodeData
  | DatastoreNodeData
  | ResourcePoolNodeData;

// ============================================================================
// EDGE DATA TYPES
// ============================================================================

interface BaseEdgeData {
  kind: EdgeType;
  ariaLabel: string;
  description?: string;
  metadata?: Record<string, string>;
  domAttributes?: HTMLAttributes<SVGElement>;
  [key: string]: unknown;
}

export interface ContainsEdgeData extends BaseEdgeData {
  kind: 'contains';
}

export interface MemberOfBondEdgeData extends BaseEdgeData {
  kind: 'member-of-bond';
  bondId?: string;
}

export interface UplinkEdgeData extends BaseEdgeData {
  kind: 'uplink';
  uplinkName?: string;
  capacityMbps?: number;
  active?: boolean;
}

export interface ProvidesEdgeData extends BaseEdgeData {
  kind: 'provides';
  vlan?: VlanConfig;
}

export interface ConnectsToEdgeData extends BaseEdgeData {
  kind: 'connects-to';
  service?: string;
}

export interface VmConnectionEdgeData extends BaseEdgeData {
  kind: 'vm-connection';
  vnicId?: string;
}

export interface VmkConnectionEdgeData extends BaseEdgeData {
  kind: 'vmk-connection';
  service?: string;
}

export interface ClusterMembershipEdgeData extends BaseEdgeData {
  kind: 'cluster-membership';
  clusterId?: string;
}

export interface InternalLinkEdgeData extends BaseEdgeData {
  kind: 'internal-link';
  context?: string;
}

export interface SpansHostsEdgeData extends BaseEdgeData {
  kind: 'spans-hosts';
  hosts?: string[];
}

// LCMDesigner Extensions
export interface UsesStorageEdgeData extends BaseEdgeData {
  kind: 'uses-storage';
  datastoreId?: string;
  sizeGB?: number;
}

export interface InResourcePoolEdgeData extends BaseEdgeData {
  kind: 'in-resource-pool';
  resourcePoolId?: string;
}

export type EdgeData =
  | ContainsEdgeData
  | MemberOfBondEdgeData
  | UplinkEdgeData
  | ProvidesEdgeData
  | ConnectsToEdgeData
  | VmConnectionEdgeData
  | VmkConnectionEdgeData
  | ClusterMembershipEdgeData
  | InternalLinkEdgeData
  | SpansHostsEdgeData
  | UsesStorageEdgeData
  | InResourcePoolEdgeData;

// ============================================================================
// GRAPH TYPES
// ============================================================================

export type GraphNode = Node<NodeData> & {
  type: string; // ReactFlow renderer type
  parentId?: string;
  layout?: NodeLayoutHints;
};

export type GraphEdge = Edge<EdgeData> & {
  type: EdgeType;
};

export interface StandardizedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface FilterOptions {
  nodeTypes?: NodeType[];
  vendors?: Vendor[];
  clusters?: string[];
  searchText?: string;
  showPoweredOff?: boolean;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'jpg';
  filename?: string;
  quality?: number; // For JPG/PNG (0-1)
  backgroundColor?: string;
}

export interface VisualizationMode {
  mode: 'view' | 'edit';
  allowNodeDrag?: boolean;
  allowEdgeEdit?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
}
