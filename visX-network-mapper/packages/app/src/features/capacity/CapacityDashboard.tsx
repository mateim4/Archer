import React, { useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import ResourceBarChart, { ResourceData } from './charts/ResourceBarChart';
import CapacityPieChart, { PieData } from './charts/CapacityPieChart';
import useGraphStore from '../../store/useGraphStore';

const isHost = (d: any): boolean => d.kind === 'physical-host';
const isVm = (d: any): boolean => d.kind === 'guest-vm' || d.kind === 'controller-vm';

const CapacityDashboard: React.FC = () => {
  const { visibleNodes: nodes } = useGraphStore();

  const aggregatedData = useMemo(() => {
    let totalCores = 0;
    let usedCores = 0;
    let totalMem = 0;
    let usedMem = 0;
    const hostData: ResourceData[] = [];

    nodes.forEach(n => {
       const d = n.data as any;
       if (isHost(d)) {
          const cores = Number(d.cpuCores || d.cpuCount || 0);
          const mem = Number(d.memoryGB || 0);
          totalCores += cores;
          totalMem += mem;
          hostData.push({ name: d.name, total: mem, used: Math.round(mem * 0.4) });
       }
       if (isVm(d)) {
          usedCores += Number(d.cpuCount || 0);
          usedMem += Number(d.memoryGB || 0);
       }
    });
    return { totalCores, usedCores, totalMem, usedMem, hostData };
  }, [nodes]);

  const cpuPieData: PieData[] = [
     { label: 'Allocated', value: aggregatedData.usedCores },
     { label: 'Free', value: Math.max(0, aggregatedData.totalCores - aggregatedData.usedCores) }
  ];
  const memPieData: PieData[] = [
     { label: 'Allocated', value: aggregatedData.usedMem },
     { label: 'Free', value: Math.max(0, aggregatedData.totalMem - aggregatedData.usedMem) }
  ];

  return (
    <div className="w-full h-full p-8 flex flex-col gap-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Capacity Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-6 h-64 backdrop-blur-md flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-purple-200">vCPU Allocation</h3>
          <div className="flex-1 min-h-0">
             <ParentSize>{({ width, height }) => <CapacityPieChart data={cpuPieData} width={width} height={height} />}</ParentSize>
          </div>
          <div className="mt-2 text-center text-xs text-purple-300">{aggregatedData.usedCores} / {aggregatedData.totalCores} Cores</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-6 h-64 backdrop-blur-md flex flex-col">
           <h3 className="text-lg font-semibold mb-2 text-purple-200">Memory Allocation (GB)</h3>
           <div className="flex-1 min-h-0">
             <ParentSize>{({ width, height }) => <CapacityPieChart data={memPieData} width={width} height={height} />}</ParentSize>
           </div>
           <div className="mt-2 text-center text-xs text-purple-300">{aggregatedData.usedMem} / {aggregatedData.totalMem} GB</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-6 h-64 backdrop-blur-md flex flex-col">
           <h3 className="text-lg font-semibold mb-2 text-purple-200">Host Memory Utilization</h3>
           <div className="flex-1 min-h-0">
             <ParentSize>{({ width, height }) => <ResourceBarChart data={aggregatedData.hostData} width={width} height={height} unit="GB" />}</ParentSize>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CapacityDashboard;
