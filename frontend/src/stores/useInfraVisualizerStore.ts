/**
 * Infrastructure Visualizer Store
 * 
 * Zustand store for managing the infrastructure visualization graph state.
 * Adapted from Infra-Visualizer project with Archer-specific extensions.
 * 
 * Features:
 * - Node and edge state management
 * - Visibility filtering and expansion
 * - Selection management
 * - Edit operations (add/remove/update nodes and edges)
 * - ReactFlow integration
 */

import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type { GraphNode, GraphEdge, FilterOptions } from '@/types/infra-visualizer';

// ============================================================================
// STORE STATE TYPE
// ============================================================================

type InfraVisualizerState = {
  // Graph Data
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  expandedNodes: Set<string>;
  
  // Filter State
  activeFilters: FilterOptions;
  
  // Selection State
  selectedNodeId: string | null;
  
  // Loading State
  isLoading: boolean;
  error: string | null;
  
  // Actions - Selection
  selectNode: (nodeId: string) => void;
  clearSelection: () => void;
  
  // Actions - ReactFlow Integration
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  
  // Actions - Graph Management
  setGraph: (graph: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  clearGraph: () => void;
  
  // Actions - Expansion/Collapse
  toggleNodeExpansion: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // Actions - Filtering
  setFilters: (filters: Partial<FilterOptions>) => void;
  clearFilters: () => void;
  
  // Actions - Editing
  updateNodeData: (nodeId: string, patch: Partial<GraphNode['data']>) => void;
  addNode: (node: GraphNode) => void;
  removeNode: (nodeId: string) => void;
  addEdgeToGraph: (edge: GraphEdge) => void;
  removeEdge: (edgeId: string) => void;
  
  // Actions - Loading State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate visible nodes and edges based on expansion state and filters
 */
const getVisibleGraph = (
  allNodes: GraphNode[],
  allEdges: GraphEdge[],
  expandedNodes: Set<string>,
  filters: FilterOptions
) => {
  const visibleNodeIds = new Set<string>();
  
  // Filter nodes based on active filters
  let filteredNodes = allNodes;
  
  // Filter by node types
  if (filters.nodeTypes && filters.nodeTypes.length > 0) {
    filteredNodes = filteredNodes.filter(node => {
      const kind = node.data.kind;
      return filters.nodeTypes!.includes(kind);
    });
  }
  
  // Filter by vendors
  if (filters.vendors && filters.vendors.length > 0) {
    filteredNodes = filteredNodes.filter(node => {
      const vendor = node.data.vendor;
      return vendor && filters.vendors!.includes(vendor);
    });
  }
  
  // Filter by clusters
  if (filters.clusters && filters.clusters.length > 0) {
    filteredNodes = filteredNodes.filter(node => {
      const cluster = (node.data as any).cluster || (node.data as any).clusterId;
      return cluster && filters.clusters!.includes(cluster);
    });
  }
  
  // Filter by search text
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filteredNodes = filteredNodes.filter(node => {
      const name = node.data.name?.toLowerCase() || '';
      const description = node.data.description?.toLowerCase() || '';
      const tags = node.data.tags?.join(' ').toLowerCase() || '';
      return name.includes(searchLower) || 
             description.includes(searchLower) || 
             tags.includes(searchLower);
    });
  }
  
  // Filter by power state (VMs only)
  if (filters.showPoweredOff === false) {
    filteredNodes = filteredNodes.filter(node => {
      if (node.data.kind === 'virtual-machine') {
        const vm = node.data as any;
        return vm.powerState !== 'poweredOff';
      }
      return true; // Keep non-VM nodes
    });
  }
  
  // Apply expansion logic
  if (expandedNodes.size === 0) {
    // No expansion state - show all filtered nodes
    filteredNodes.forEach(node => {
      visibleNodeIds.add(node.id);
    });
  } else {
    // Show anchor nodes (clusters, hosts) always
    filteredNodes.forEach(node => {
      const kind = node.data.kind;
      if (
        node.type === 'cluster' ||
        node.type === 'host' ||
        kind === 'physical-host' ||
        kind === 'cluster'
      ) {
        visibleNodeIds.add(node.id);
      }
    });
    
    // Find all descendants of expanded nodes
    const toExplore = [...expandedNodes];
    const visited = new Set<string>();
    
    while (toExplore.length > 0) {
      const currentId = toExplore.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const outgoingEdges = allEdges.filter(edge => edge.source === currentId);
      for (const edge of outgoingEdges) {
        visibleNodeIds.add(edge.target);
        if (expandedNodes.has(edge.target)) {
          toExplore.push(edge.target);
        }
      }
    }
  }
  
  const visibleNodes = filteredNodes.filter(node => visibleNodeIds.has(node.id));
  const visibleEdges = allEdges.filter(
    edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );
  
  return { visibleNodes, visibleEdges };
};

/**
 * Map node data.kind to ReactFlow renderer type
 */
const mapNodeToRendererType = (node: GraphNode): string => {
  const kind = node.data.kind;
  
  switch (kind) {
    case 'physical-host':
      return 'host';
    case 'virtual-machine':
      return 'vm';
    case 'cluster':
      return 'cluster';
    case 'controller-vm':
      return 'vm';
    case 'virtual-switch':
    case 'distributed-switch':
      return 'vswitch';
    case 'port-group':
    case 'dvport-group':
    case 'vlan-network':
      return 'portgroup';
    case 'datastore':
      return 'datastore';
    default:
      return node.type || 'default';
  }
};

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useInfraVisualizerStore = create<InfraVisualizerState>((set, get) => ({
  // Initial State
  allNodes: [],
  allEdges: [],
  visibleNodes: [],
  visibleEdges: [],
  expandedNodes: new Set(),
  activeFilters: {},
  selectedNodeId: null,
  isLoading: false,
  error: null,
  
  // Selection Actions
  selectNode: (nodeId: string) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const mappedAll = allNodes.map(n => ({ ...n, selected: n.id === nodeId } as GraphNode));
    const { visibleNodes, visibleEdges } = getVisibleGraph(mappedAll, allEdges, expandedNodes, activeFilters);
    const mappedVisible = visibleNodes.map(n => ({ ...n, selected: n.id === nodeId } as GraphNode));
    set({ 
      allNodes: mappedAll, 
      visibleNodes: mappedVisible, 
      visibleEdges,
      selectedNodeId: nodeId 
    });
  },
  
  clearSelection: () => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const mappedAll = allNodes.map(n => ({ ...n, selected: false } as GraphNode));
    const { visibleNodes, visibleEdges } = getVisibleGraph(mappedAll, allEdges, expandedNodes, activeFilters);
    const mappedVisible = visibleNodes.map(n => ({ ...n, selected: false } as GraphNode));
    set({ 
      allNodes: mappedAll, 
      visibleNodes: mappedVisible, 
      visibleEdges,
      selectedNodeId: null 
    });
  },
  
  // ReactFlow Integration
  onNodesChange: (changes: NodeChange[]) => {
    set({
      visibleNodes: applyNodeChanges(changes, get().visibleNodes) as GraphNode[],
    });
  },
  
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      visibleEdges: applyEdgeChanges(changes, get().visibleEdges) as GraphEdge[],
    });
  },
  
  onConnect: (connection: Connection) => {
    set({
      visibleEdges: addEdge(connection, get().visibleEdges) as GraphEdge[],
    });
  },
  
  // Graph Management
  setGraph: (graph: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
    // Normalize renderer type from data.kind and ensure positions
    const mappedNodes = graph.nodes.map((n, idx) => {
      const renderer = mapNodeToRendererType(n);
      
      // Ensure React Flow always has a position
      const hasPosition = (n as any).position && 
                         typeof (n as any).position.x === 'number' && 
                         typeof (n as any).position.y === 'number';
      const layer = n.layout?.layer ?? 0;
      const order = n.layout?.order ?? idx;
      const defaultX = order * 320;
      const defaultY = layer * 200;
      const position = hasPosition ? (n as any).position : { x: defaultX, y: defaultY };
      
      return { ...(n as any), type: renderer, position } as GraphNode;
    });
    
    const { expandedNodes, activeFilters } = get();
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      mappedNodes,
      graph.edges,
      expandedNodes,
      activeFilters
    );
    
    set({ 
      allNodes: mappedNodes, 
      allEdges: graph.edges, 
      visibleNodes, 
      visibleEdges,
      error: null 
    });
  },
  
  clearGraph: () => {
    set({
      allNodes: [],
      allEdges: [],
      visibleNodes: [],
      visibleEdges: [],
      expandedNodes: new Set(),
      selectedNodeId: null,
      error: null,
    });
  },
  
  // Expansion/Collapse
  toggleNodeExpansion: (nodeId: string) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const newExpandedNodes = new Set(expandedNodes);
    
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      allEdges,
      newExpandedNodes,
      activeFilters
    );
    
    set({ expandedNodes: newExpandedNodes, visibleNodes, visibleEdges });
  },
  
  expandAll: () => {
    const { allNodes, allEdges, activeFilters } = get();
    const allNodeIds = new Set(allNodes.map(n => n.id));
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      allEdges,
      allNodeIds,
      activeFilters
    );
    set({ expandedNodes: allNodeIds, visibleNodes, visibleEdges });
  },
  
  collapseAll: () => {
    const { allNodes, allEdges, activeFilters } = get();
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      allEdges,
      new Set(),
      activeFilters
    );
    set({ expandedNodes: new Set(), visibleNodes, visibleEdges });
  },
  
  // Filtering
  setFilters: (filters: Partial<FilterOptions>) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const newFilters = { ...activeFilters, ...filters };
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      allEdges,
      expandedNodes,
      newFilters
    );
    set({ activeFilters: newFilters, visibleNodes, visibleEdges });
  },
  
  clearFilters: () => {
    const { allNodes, allEdges, expandedNodes } = get();
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      allEdges,
      expandedNodes,
      {}
    );
    set({ activeFilters: {}, visibleNodes, visibleEdges });
  },
  
  // Editing
  updateNodeData: (nodeId, patch) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const mapped = allNodes.map(n =>
      n.id === nodeId
        ? ({ ...n, data: { ...(n.data as any), ...(patch as any) } } as GraphNode)
        : n
    );
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      mapped,
      allEdges,
      expandedNodes,
      activeFilters
    );
    set({ allNodes: mapped, visibleNodes, visibleEdges });
  },
  
  addNode: (node) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const mapped = [...allNodes, node];
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      mapped,
      allEdges,
      expandedNodes,
      activeFilters
    );
    set({ allNodes: mapped, visibleNodes, visibleEdges });
  },
  
  removeNode: (nodeId) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const mapped = allNodes.filter(n => n.id !== nodeId);
    const edges = allEdges.filter(e => e.source !== nodeId && e.target !== nodeId);
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      mapped,
      edges,
      expandedNodes,
      activeFilters
    );
    set({ allNodes: mapped, allEdges: edges, visibleNodes, visibleEdges });
  },
  
  addEdgeToGraph: (edge) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const edges = [...allEdges, edge];
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      edges,
      expandedNodes,
      activeFilters
    );
    set({ allEdges: edges, visibleNodes, visibleEdges });
  },
  
  removeEdge: (edgeId) => {
    const { allNodes, allEdges, expandedNodes, activeFilters } = get();
    const edges = allEdges.filter(e => e.id !== edgeId);
    const { visibleNodes, visibleEdges } = getVisibleGraph(
      allNodes,
      edges,
      expandedNodes,
      activeFilters
    );
    set({ allEdges: edges, visibleNodes, visibleEdges });
  },
  
  // Loading State
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },
}));
