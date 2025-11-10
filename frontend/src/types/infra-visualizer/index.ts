/**
 * Infra-Visualizer Types - Public API
 * 
 * This module exports all type definitions for the infrastructure visualization system.
 * Adapted from Infra-Visualizer project with LCMDesigner-specific extensions.
 */

export type {
  // Vendor & Node Types
  Vendor,
  NodeType,
  EdgeType,
  
  // Layout Types
  NodeDimensions,
  NodeLayoutHints,
  
  // Network Configuration
  LinkStatus,
  BondMode,
  VirtualSwitchClass,
  VlanMode,
  VlanConfig,
  SecurityPolicy,
  
  // Infrastructure Node Data
  PhysicalHostNodeData,
  PhysicalNicNodeData,
  NicBondNodeData,
  VirtualSwitchNodeData,
  PortGroupNodeData,
  VmkernelAdapterNodeData,
  ControllerVmNodeData,
  
  // Virtualization Node Data (LCMDesigner Extensions)
  VirtualMachineNodeData,
  ClusterNodeData,
  DatastoreNodeData,
  ResourcePoolNodeData,
  
  // Unified Types
  NodeData,
  EdgeData,
  GraphNode,
  GraphEdge,
  StandardizedGraph,
  
  // Edge Data Types
  ContainsEdgeData,
  MemberOfBondEdgeData,
  UplinkEdgeData,
  ProvidesEdgeData,
  ConnectsToEdgeData,
  VmConnectionEdgeData,
  VmkConnectionEdgeData,
  ClusterMembershipEdgeData,
  InternalLinkEdgeData,
  SpansHostsEdgeData,
  UsesStorageEdgeData,
  InResourcePoolEdgeData,
  
  // Helper Types
  FilterOptions,
  ExportOptions,
  VisualizationMode,
} from './network-graph.types';
