import React, { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { makeStyles } from '@fluentui/react-components';
import { useInfraVisualizerStore } from '@/stores/useInfraVisualizerStore';
import {
  useCanvasStyles,
  useToolbarStyles,
  useControlsStyles,
  useMinimapStyles,
  useFilterPanelStyles,
  useLegendStyles,
} from '@/styles/infra-visualizer';

// Import node components (to be created in next steps)
import { DatacenterNode } from './nodes/DatacenterNode';
import { ClusterNode } from './nodes/ClusterNode';
import { HostNode } from './nodes/HostNode';
import { VmNode } from './nodes/VmNode';
import { DatastoreNode } from './nodes/DatastoreNode';
import { ResourcePoolNode } from './nodes/ResourcePoolNode';
import { NetworkNode } from './nodes/NetworkNode';

// Import edge components (to be created)
import { ContainsEdge } from './edges/ContainsEdge';
import { NetworkEdge } from './edges/NetworkEdge';
import { StorageEdge } from './edges/StorageEdge';

/**
 * Node type registry for ReactFlow
 * Maps our custom node types to their React components
 */
const nodeTypes: NodeTypes = {
  datacenter: DatacenterNode,
  cluster: ClusterNode,
  'physical-host': HostNode,
  'virtual-machine': VmNode,
  datastore: DatastoreNode,
  'resource-pool': ResourcePoolNode,
  'distributed-switch': NetworkNode,
  'virtual-switch': NetworkNode,
  'port-group': NetworkNode,
};

/**
 * Edge type registry for ReactFlow
 * Maps our custom edge types to their React components
 */
const edgeTypes: EdgeTypes = {
  contains: ContainsEdge,
  'network-uplink': NetworkEdge,
  'vm-connection': NetworkEdge,
  'uses-storage': StorageEdge,
};

type InfraVisualizerCanvasProps = {
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Background pattern: 'dots' | 'grid' | 'none' */
  backgroundPattern?: 'dots' | 'grid' | 'none';
  /** Show toolbar controls */
  showToolbar?: boolean;
  /** Show zoom/pan controls */
  showControls?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
  /** Show filter panel */
  showFilterPanel?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Read-only mode (no interactions) */
  readOnly?: boolean;
};

/**
 * Internal canvas component (must be wrapped by ReactFlowProvider)
 */
function InfraVisualizerCanvasInternal({
  width,
  height,
  backgroundPattern = 'dots',
  showToolbar = true,
  showControls = true,
  showMinimap = true,
  showFilterPanel = false,
  showLegend = true,
  readOnly = false,
}: InfraVisualizerCanvasProps) {
  const canvasStyles = useCanvasStyles();
  const toolbarStyles = useToolbarStyles();
  const controlsStyles = useControlsStyles();
  const minimapStyles = useMinimapStyles();
  const legendStyles = useLegendStyles();

  // Zustand store
  const {
    visibleNodes,
    visibleEdges,
    selectedNodeId,
    selectNode,
    clearSelection,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isLoading,
  } = useInfraVisualizerStore();

  // ReactFlow instance
  const reactFlowInstance = useReactFlow();

  /**
   * Handle node click for selection
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.stopPropagation();
      selectNode(node.id);
    },
    [selectNode]
  );

  /**
   * Handle canvas click to clear selection
   */
  const handlePaneClick = useCallback(() => {
    if (!readOnly) {
      clearSelection();
    }
  }, [clearSelection, readOnly]);

  /**
   * Fit view to all nodes
   */
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  /**
   * Center view on selected node
   */
  const handleCenterView = useCallback(() => {
    if (selectedNodeId) {
      const node = visibleNodes.find((n) => n.id === selectedNodeId);
      if (node && node.position) {
        reactFlowInstance.setCenter(
          node.position.x + 100, // offset for node width
          node.position.y + 40,  // offset for node height
          { zoom: 1, duration: 300 }
        );
      }
    }
  }, [selectedNodeId, visibleNodes, reactFlowInstance]);

  /**
   * Zoom in/out handlers
   */
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 300 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 300 });
  }, [reactFlowInstance]);

  /**
   * Background pattern configuration
   */
  const backgroundConfig = useMemo(() => {
    if (backgroundPattern === 'dots') {
      return { variant: 'dots' as const, gap: 16, size: 1 };
    }
    if (backgroundPattern === 'grid') {
      return { variant: 'lines' as const, gap: 16, size: 1 };
    }
    return null;
  }, [backgroundPattern]);

  /**
   * MiniMap node color function
   */
  const getMinimapNodeColor = useCallback((node: any) => {
    if (node.id === selectedNodeId) return '#8b5cf6'; // purple for selected
    switch (node.type) {
      case 'datacenter':
        return '#a855f7'; // purple-500
      case 'cluster':
        return '#6366f1'; // indigo-500
      case 'physical-host':
        return '#3b82f6'; // blue-500
      case 'virtual-machine':
        return '#10b981'; // green-500
      case 'datastore':
        return '#06b6d4'; // cyan-500
      default:
        return '#94a3b8'; // slate-400
    }
  }, [selectedNodeId]);

  return (
    <div
      className={canvasStyles.root}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
    >
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        preventScrolling
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        {/* Background pattern */}
        {backgroundConfig && (
          <Background
            {...backgroundConfig}
            className={
              backgroundPattern === 'dots'
                ? canvasStyles.backgroundDots
                : canvasStyles.backgroundPattern
            }
          />
        )}

        {/* Zoom controls */}
        {showControls && (
          <Controls
            className={controlsStyles.panel}
            showZoom
            showFitView
            showInteractive={!readOnly}
          />
        )}

        {/* Minimap */}
        {showMinimap && (
          <MiniMap
            className={minimapStyles.container}
            nodeColor={getMinimapNodeColor}
            pannable
            zoomable
          />
        )}

        {/* Toolbar panel */}
        {showToolbar && (
          <Panel position="top-left" className={toolbarStyles.container}>
            <div className={toolbarStyles.buttonGroup}>
              <button
                className={toolbarStyles.button}
                onClick={handleFitView}
                aria-label="Fit view to content"
                title="Fit view (F)"
              >
                Fit View
              </button>
              <button
                className={toolbarStyles.button}
                onClick={handleCenterView}
                disabled={!selectedNodeId}
                aria-label="Center on selection"
                title="Center (C)"
              >
                Center
              </button>
              <button
                className={toolbarStyles.button}
                onClick={handleZoomIn}
                aria-label="Zoom in"
                title="Zoom in (+)"
              >
                +
              </button>
              <button
                className={toolbarStyles.button}
                onClick={handleZoomOut}
                aria-label="Zoom out"
                title="Zoom out (-)"
              >
                −
              </button>
            </div>
          </Panel>
        )}

        {/* Legend panel */}
        {showLegend && (
          <Panel position="bottom-left" className={legendStyles.container}>
            <div className={legendStyles.title}>Node Types</div>
            <div className={legendStyles.items}>
              <div className={legendStyles.item}>
                <div
                  className={legendStyles.colorBox}
                  style={{ backgroundColor: '#a855f7' }}
                />
                <span>Datacenter</span>
              </div>
              <div className={legendStyles.item}>
                <div
                  className={legendStyles.colorBox}
                  style={{ backgroundColor: '#6366f1' }}
                />
                <span>Cluster</span>
              </div>
              <div className={legendStyles.item}>
                <div
                  className={legendStyles.colorBox}
                  style={{ backgroundColor: '#3b82f6' }}
                />
                <span>Host</span>
              </div>
              <div className={legendStyles.item}>
                <div
                  className={legendStyles.colorBox}
                  style={{ backgroundColor: '#10b981' }}
                />
                <span>VM</span>
              </div>
              <div className={legendStyles.item}>
                <div
                  className={legendStyles.colorBox}
                  style={{ backgroundColor: '#06b6d4' }}
                />
                <span>Storage</span>
              </div>
            </div>
          </Panel>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <Panel position="top-center">
            <div className={canvasStyles.loading}>Loading graph...</div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

/**
 * Main canvas component with ReactFlowProvider wrapper
 * 
 * This is the primary component for rendering infrastructure visualizations.
 * It integrates with the Zustand store for state management and uses
 * ReactFlow for the underlying graph rendering.
 * 
 * @example
 * ```tsx
 * <InfraVisualizerCanvas
 *   width={1600}
 *   height={900}
 *   backgroundPattern="dots"
 *   showToolbar
 *   showControls
 *   showMinimap
 *   showLegend
 * />
 * ```
 */
export function InfraVisualizerCanvas(props: InfraVisualizerCanvasProps) {
  return (
    <ReactFlowProvider>
      <InfraVisualizerCanvasInternal {...props} />
    </ReactFlowProvider>
  );
}
