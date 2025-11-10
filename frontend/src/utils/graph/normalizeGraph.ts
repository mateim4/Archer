/**
 * Normalize Graph Utility
 * 
 * Normalizes and validates graph data, ensuring all nodes and edges have required properties.
 */

import type { GraphNode, GraphEdge, StandardizedGraph } from '@/types/infra-visualizer';

/**
 * Normalize a graph to ensure consistent structure
 * 
 * @param graph - The raw graph data
 * @returns Normalized and validated graph
 */
export function normalizeGraph(graph: StandardizedGraph): StandardizedGraph {
  const normalizedNodes = graph.nodes.map((node, index) => normalizeNode(node, index));
  const normalizedEdges = graph.edges.map((edge, index) => normalizeEdge(edge, index));
  
  return {
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
}

/**
 * Normalize a single node
 */
function normalizeNode(node: GraphNode, index: number): GraphNode {
  // Ensure node has an ID
  const id = node.id || `node-${index}`;
  
  // Ensure node has a type
  const type = node.type || 'default';
  
  // Ensure node has a position
  const position = node.position || { x: 0, y: 0 };
  
  // Ensure node data has required fields
  const data = {
    ...node.data,
    name: node.data.name || id,
    ariaLabel: node.data.ariaLabel || node.data.name || id,
  };
  
  return {
    ...node,
    id,
    type,
    position,
    data,
  };
}

/**
 * Normalize a single edge
 */
function normalizeEdge(edge: GraphEdge, index: number): GraphEdge {
  // Ensure edge has an ID
  const id = edge.id || `edge-${index}`;
  
  // Ensure edge has source and target
  if (!edge.source || !edge.target) {
    console.warn(`Edge ${id} missing source or target`, edge);
  }
  
  // Ensure edge data exists and has ariaLabel
  const data = edge.data
    ? {
        ...edge.data,
        ariaLabel: edge.data.ariaLabel || `Connection from ${edge.source} to ${edge.target}`,
      }
    : {
        kind: 'contains' as const,
        ariaLabel: `Connection from ${edge.source} to ${edge.target}`,
      };
  
  return {
    ...edge,
    id,
    data,
  };
}

/**
 * Validate that a graph's edges reference existing nodes
 * 
 * @param graph - The graph to validate
 * @returns Validation result with errors
 */
export function validateGraph(graph: StandardizedGraph): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  
  // Check that all edges reference valid nodes
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references missing source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references missing target node: ${edge.target}`);
    }
  }
  
  // Check for duplicate node IDs
  const seenIds = new Set<string>();
  for (const node of graph.nodes) {
    if (seenIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    seenIds.add(node.id);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
