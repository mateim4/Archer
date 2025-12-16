import React from 'react';
import { ReactFlow, Background, Controls, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useGraphStore from '../../store/useGraphStore';
import useAutoLayout from '../../hooks/useAutoLayout';
import EnhancedPurpleGlassButton from '../../components/ui/EnhancedPurpleGlassButton';
import BaseNode from './nodes/BaseNode';

const nodeTypes: NodeTypes = {
  'cluster': BaseNode,
  'physical-host': BaseNode,
  'guest-vm': BaseNode,
  'controller-vm': BaseNode,
  'virtual-switch': BaseNode,
  'port-group': BaseNode,
};

const TopologyView: React.FC = () => {
  const { visibleNodes: nodes, visibleEdges: edges, onNodesChange, onEdgesChange, onConnect } = useGraphStore();
  useAutoLayout();

  return (
    <div className="w-full h-full relative">
       <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          onlyRenderVisibleElements
          className="bg-transparent"
       >
          <Controls className="!bg-purple-900/50 !border-purple-500/30 !fill-purple-200" />
          <Background color="#a855f7" gap={24} size={1} className="opacity-10" />
       </ReactFlow>
       <div className="absolute top-4 left-4 z-10 flex gap-2">
          <EnhancedPurpleGlassButton variant="secondary" size="small">Refresh Layout</EnhancedPurpleGlassButton>
       </div>
    </div>
  );
};
export default TopologyView;
