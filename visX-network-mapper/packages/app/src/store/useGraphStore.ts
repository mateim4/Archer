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
import { GraphNode, GraphEdge } from '../types/network-graph';

type GraphState = {
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  expandedNodes: Set<string>;
  // Selection
  selectNode: (nodeId: string) => void;
  clearSelection: () => void;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;

  setGraph: (graph: { nodes: GraphNode[]; edges: GraphEdge[] }) => void;
  toggleNodeExpansion: (nodeId: string) => void;
  // Editing actions
  updateNodeData: (nodeId: string, patch: Partial<GraphNode['data']>) => void;
  addNode: (node: GraphNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: GraphEdge) => void;
  removeEdge: (edgeId: string) => void;
};

const getVisibleGraph = (allNodes: GraphNode[], allEdges: GraphEdge[], expandedNodes: Set<string>) => {
  const visibleNodeIds = new Set<string>();

  // Initial policy: show all nodes until user collapses via filters/expansion
  if (expandedNodes.size === 0) {
    for (const n of allNodes) {
      visibleNodeIds.add(n.id);
    }
  } else {
    // Always include clusters and hosts as anchors
    allNodes.forEach(node => {
      const kind = (node.data as any)?.kind as string | undefined;
      if (node.type === 'cluster' || node.type === 'host' || kind === 'physical-host') {
        visibleNodeIds.add(node.id);
      }
    });
  }

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

  const visibleNodes = allNodes.filter(node => visibleNodeIds.has(node.id));
  const visibleEdges = allEdges.filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

  return { visibleNodes, visibleEdges };
};


const useGraphStore = create<GraphState>((set, get) => ({
  allNodes: [],
  allEdges: [],
  visibleNodes: [],
  visibleEdges: [],
  expandedNodes: new Set<string>(),
  selectNode: (nodeId: string) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const mappedAll = allNodes.map(n => ({ ...n, selected: n.id === nodeId } as GraphNode));
    const { visibleNodes, visibleEdges } = getVisibleGraph(mappedAll, allEdges, expandedNodes);
    const mappedVisible = visibleNodes.map(n => ({ ...n, selected: n.id === nodeId } as GraphNode));
    set({ allNodes: mappedAll, visibleNodes: mappedVisible, visibleEdges });
  },
  clearSelection: () => {
    const { allNodes, allEdges, expandedNodes } = get();
    const mappedAll = allNodes.map(n => ({ ...n, selected: false } as GraphNode));
    const { visibleNodes, visibleEdges } = getVisibleGraph(mappedAll, allEdges, expandedNodes);
    const mappedVisible = visibleNodes.map(n => ({ ...n, selected: false } as GraphNode));
    set({ allNodes: mappedAll, visibleNodes: mappedVisible, visibleEdges });
  },

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

  setGraph: (graph: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
    // Normalize renderer type from data.kind
    const mappedNodes = graph.nodes.map((n, idx) => {
      const kind = (n.data as any)?.kind as string | undefined;
      let renderer = n.type;
      switch (kind) {
        case 'physical-host':
          renderer = 'host';
          break;
        case 'controller-vm':
          renderer = 'vm';
          break;
        case 'virtual-switch':
        case 'distributed-switch':
          renderer = 'vswitch';
          break;
        case 'port-group':
        case 'dvport-group':
        case 'vlan-network':
          renderer = 'portgroup';
          break;
        default:
          // keep existing
          break;
      }
      // Ensure React Flow always has a position; derive a simple grid from layout hints if missing
      const hasPosition = (n as any).position && typeof (n as any).position.x === 'number' && typeof (n as any).position.y === 'number';
      const layer = n.layout?.layer ?? 0;
      const order = n.layout?.order ?? idx;
      const defaultX = order * 320;
      const defaultY = layer * 200;
      const position = hasPosition ? (n as any).position : { x: defaultX, y: defaultY };

      return { ...(n as any), type: renderer, position } as GraphNode;
    });
    const mappedEdges = graph.edges;

    const { expandedNodes } = get();
    const { visibleNodes, visibleEdges } = getVisibleGraph(mappedNodes, mappedEdges, expandedNodes);
    set({ allNodes: mappedNodes, allEdges: mappedEdges, visibleNodes, visibleEdges });
  },

  toggleNodeExpansion: (nodeId: string) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    const { visibleNodes, visibleEdges } = getVisibleGraph(allNodes, allEdges, newExpandedNodes);
    set({ expandedNodes: newExpandedNodes, visibleNodes, visibleEdges });
  },

  updateNodeData: (nodeId, patch) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const mapped = allNodes.map(n => (n.id === nodeId ? ({ ...n, data: { ...(n.data as any), ...(patch as any) } } as GraphNode) : n));
    const { visibleNodes, visibleEdges } = getVisibleGraph(mapped, allEdges, expandedNodes);
    set({ allNodes: mapped, visibleNodes, visibleEdges });
  },

  addNode: (node) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const mapped = [...allNodes, node];
    const { visibleNodes, visibleEdges } = getVisibleGraph(mapped, allEdges, expandedNodes);
    set({ allNodes: mapped, visibleNodes, visibleEdges });
  },

  removeNode: (nodeId) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const mapped = allNodes.filter(n => n.id !== nodeId);
    const edges = allEdges.filter(e => e.source !== nodeId && e.target !== nodeId);
    const { visibleNodes, visibleEdges } = getVisibleGraph(mapped, edges, expandedNodes);
    set({ allNodes: mapped, allEdges: edges, visibleNodes, visibleEdges });
  },

  addEdge: (edge) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const edges = [...allEdges, edge];
    const { visibleNodes, visibleEdges } = getVisibleGraph(allNodes, edges, expandedNodes);
    set({ allEdges: edges, visibleNodes, visibleEdges });
  },

  removeEdge: (edgeId) => {
    const { allNodes, allEdges, expandedNodes } = get();
    const edges = allEdges.filter(e => e.id !== edgeId);
    const { visibleNodes, visibleEdges } = getVisibleGraph(allNodes, edges, expandedNodes);
    set({ allEdges: edges, visibleNodes, visibleEdges });
  },
}));

export default useGraphStore;
