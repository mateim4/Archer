import { Node, Edge } from '@xyflow/react';

export interface NodeData {
  label: string;
  kind?: string;
  [key: string]: unknown;
}

export interface GraphNode extends Node {
  data: NodeData;
  layout?: {
    layer?: number;
    order?: number;
  };
}

export interface GraphEdge extends Edge {
  label?: string;
}
