import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { NodeData } from '../../../types/network-graph';
import {
  ServerRegular,
  DesktopRegular,
  CubeRegular,
  GlobeRegular,
  ChevronRightRegular
} from '@fluentui/react-icons';

const IconMap: Record<string, any> = {
  'cluster': GlobeRegular,
  'physical-host': ServerRegular,
  'guest-vm': DesktopRegular,
  'controller-vm': CubeRegular,
};

const BaseNode = ({ data, selected }: NodeProps<Node>) => {
  const nodeData = data as unknown as NodeData;
  const kind = String(nodeData.kind || 'unknown');
  const Icon = IconMap[kind] || CubeRegular;

  return (
    <div className={`relative min-w-[200px] rounded-xl backdrop-blur-md transition-all duration-300 border border-purple-glass-border bg-purple-glass-bg ${selected ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'hover:bg-purple-900/40'}`}>
       <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3 !border-none" />
       <div className="flex items-center p-3 gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
             <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
             <span className="text-sm font-bold text-white truncate">{nodeData.name || 'Unknown'}</span>
             <span className="text-xs text-purple-300 truncate capitalize">{kind.replace('-', ' ')}</span>
          </div>
          {(kind === 'cluster' || kind === 'physical-host') && (
             <button className="ml-auto p-1 text-purple-400 hover:text-white rounded hover:bg-white/10">
                <ChevronRightRegular />
             </button>
          )}
       </div>
       <div className="px-3 pb-3 flex gap-2 text-[10px] text-purple-300/80 uppercase font-bold tracking-wider">
          {nodeData.vendor ? <span>{String(nodeData.vendor)}</span> : null}
          {nodeData.ipAddress ? <span>• {String(nodeData.ipAddress)}</span> : null}
       </div>
       <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3 !border-none" />
    </div>
  );
};
export default memo(BaseNode);
