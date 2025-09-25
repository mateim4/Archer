import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { DesignTokens } from '../../styles/designSystem';
import { 
  TreeMapNode, 
  VisualizerState, 
  CapacityView, 
  VMData, 
  HostData, 
  FitFeedback,
  TooltipData 
} from '../../types/capacityVisualizer';

interface CapacityCanvasProps {
  state: VisualizerState;
  onVMMove: (vmIds: string[], targetHostId: string) => void;
  onVMSelect: (vmIds: string[], isMultiSelect: boolean) => void;
  onTooltipUpdate: (data: TooltipData | null) => void;
}

export const CapacityCanvas: React.FC<CapacityCanvasProps> = ({
  state,
  onVMMove,
  onVMSelect,
  onTooltipUpdate
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  // Canvas setup and resize handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(800, width), height: Math.max(400, height) });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // D3 Zoomable Icicle Layout (Rotated 90° Clockwise)
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const visibleClusters = state.clusters.filter(cluster => cluster.isVisible);
    if (visibleClusters.length === 0) {
      // Show empty state message
      svg.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', '18px')
        .attr('fill', DesignTokens.colors.textPrimary)
        .text('No clusters visible. Use the control panel to add clusters.');
      return;
    }

    // Layout constants
    const margin = 20;
    const clusterHeight = 300; // Increased height per cluster for better visibility
    const spacing = 40;
    
    let currentY = margin;

    // Process each cluster with icicle layout
    visibleClusters.forEach((cluster, clusterIndex) => {
      // Calculate total cluster capacity based on active view and OC ratios
      let totalClusterCapacity = 0;
      let totalAllocated = 0;
      
      cluster.hosts.forEach(host => {
        let hostCapacity = 0;
        let hostAllocated = 0;
        
        switch (state.activeView) {
          case 'cpu':
            hostCapacity = host.totalCores * state.overcommitmentRatios.cpu;
            hostAllocated = host.vms.reduce((sum, vm) => sum + vm.allocatedVCPUs, 0);
            break;
          case 'memory':
            hostCapacity = host.totalRAMGB * state.overcommitmentRatios.memory;
            hostAllocated = host.vms.reduce((sum, vm) => sum + vm.allocatedRAMGB, 0);
            break;
          case 'storage':
            hostCapacity = host.totalStorageGB; // No OC for storage
            hostAllocated = host.vms.reduce((sum, vm) => sum + vm.provisonedStorageGB, 0);
            break;
        }
        totalClusterCapacity += hostCapacity;
        totalAllocated += hostAllocated;
      });

      const utilizationPercent = Math.min(100, (totalAllocated / totalClusterCapacity) * 100);

      // Create hierarchical data structure for D3
      const hierarchyData = {
        name: cluster.name,
        value: totalClusterCapacity,
        children: cluster.hosts.map(host => {
          let hostCapacity = 0;
          let hostAllocated = 0;
          
          switch (state.activeView) {
            case 'cpu':
              hostCapacity = host.totalCores * state.overcommitmentRatios.cpu;
              hostAllocated = host.vms.reduce((sum, vm) => sum + vm.allocatedVCPUs, 0);
              break;
            case 'memory':
              hostCapacity = host.totalRAMGB * state.overcommitmentRatios.memory;
              hostAllocated = host.vms.reduce((sum, vm) => sum + vm.allocatedRAMGB, 0);
              break;
            case 'storage':
              hostCapacity = host.totalStorageGB;
              hostAllocated = host.vms.reduce((sum, vm) => sum + vm.provisonedStorageGB, 0);
              break;
          }

          return {
            name: host.name,
            value: hostCapacity,
            hostData: host,
            children: [
              // Allocated VMs
              ...host.vms.map(vm => {
                let vmValue = 0;
                switch (state.activeView) {
                  case 'cpu': vmValue = vm.allocatedVCPUs; break;
                  case 'memory': vmValue = vm.allocatedRAMGB; break;
                  case 'storage': vmValue = vm.provisonedStorageGB; break;
                }
                return {
                  name: vm.name,
                  value: vmValue,
                  vmData: vm,
                  type: 'vm'
                };
              }),
              // Free space
              ...(hostCapacity > hostAllocated ? [{
                name: 'Free Space',
                value: hostCapacity - hostAllocated,
                type: 'free'
              }] : [])
            ]
          };
        })
      };

      // Create D3 hierarchy
      const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

      // Create partition layout (rotated 90° - width becomes height)
      const partition = d3.partition()
        .size([dimensions.width - 2 * margin, clusterHeight])
        .padding(4); // Increased padding for better separation

      partition(root);

      // Create cluster group
      const clusterGroup = svg.append('g')
        .attr('transform', `translate(${margin}, ${currentY})`);

      // Cluster header
      clusterGroup.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', '16px')
        .attr('font-weight', '600')
        .attr('fill', DesignTokens.colors.primary)
        .text(`${cluster.name} - ${utilizationPercent.toFixed(1)}% Used`);

      // Render icicle rectangles (rotated 90°)
      const cells = clusterGroup.selectAll('g')
        .data(root.descendants().filter(d => d.depth > 0))
        .enter()
        .append('g')
        .attr('class', d => `level-${d.depth}`);

      // Add rectangles (x/y swapped for 90° rotation)
      cells.append('rect')
        .attr('y', d => d.x0) // Swapped: x becomes y
        .attr('x', d => d.y0) // Swapped: y becomes x  
        .attr('height', d => d.x1 - d.x0) // Swapped: width becomes height
        .attr('width', d => d.y1 - d.y0) // Swapped: height becomes width
        .attr('fill', d => {
          if (d.data.type === 'free') return 'rgba(200, 200, 200, 0.2)';
          if (d.data.type === 'vm') {
            const isSelected = state.selectedVMs.includes(d.data.vmData?.id);
            return isSelected ? 'rgba(139, 92, 246, 0.8)' : 'rgba(99, 102, 241, 0.6)';
          }
          return d.depth === 1 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(99, 102, 241, 0.3)';
        })
        .attr('stroke', d => {
          if (d.data.type === 'free') return 'rgba(150, 150, 150, 0.5)';
          return DesignTokens.colors.primary;
        })
        .attr('stroke-width', d => d.depth === 1 ? 2 : 1)
        .attr('rx', 4)
        .style('cursor', d => d.data.vmData || d.data.hostData ? 'pointer' : 'default')
        .on('click', function(event, d) {
          if (d.data.vmData) {
            const isMultiSelect = event.ctrlKey || event.metaKey;
            onVMSelect([d.data.vmData.id], isMultiSelect);
          }
        })
        .on('mouseover', function(event, d) {
          if (d.data.vmData) {
            onTooltipUpdate({
              x: event.pageX,
              y: event.pageY,
              content: {
                title: d.data.vmData.name,
                metrics: [
                  { label: 'vCPUs', value: `${d.data.vmData.allocatedVCPUs}` },
                  { label: 'Memory', value: `${d.data.vmData.allocatedRAMGB} GB` },
                  { label: 'Storage', value: `${d.data.vmData.provisonedStorageGB} GB` }
                ]
              }
            });
          } else if (d.data.hostData) {
            onTooltipUpdate({
              x: event.pageX,
              y: event.pageY,
              content: {
                title: d.data.hostData.name,
                metrics: [
                  { label: 'CPU Cores', value: `${d.data.hostData.totalCores}` },
                  { label: 'Memory', value: `${d.data.hostData.totalRAMGB} GB` },
                  { label: 'VMs', value: `${d.data.hostData.vms.length}` }
                ]
              }
            });
          }
        })
        .on('mouseout', () => onTooltipUpdate(null));

      // Add labels (only for larger rectangles)
      cells.append('text')
        .attr('y', d => (d.x0 + d.x1) / 2) // Swapped for rotation
        .attr('x', d => (d.y0 + d.y1) / 2) // Swapped for rotation
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', d => {
          const rectHeight = d.x1 - d.x0; // Swapped
          const rectWidth = d.y1 - d.y0; // Swapped
          if (rectWidth < 40 || rectHeight < 16) return '0px';
          if (rectWidth < 80 || rectHeight < 20) return '9px';
          return d.depth === 1 ? '13px' : '11px';
        })
        .attr('font-weight', d => d.depth === 1 ? '600' : '400')
        .attr('fill', d => d.data.type === 'free' ? '#666' : DesignTokens.colors.textPrimary)
        .text(d => {
          const rectWidth = d.y1 - d.y0; // Swapped for rotation
          const rectHeight = d.x1 - d.x0; // Swapped for rotation
          if (rectWidth < 60 || rectHeight < 16) return '';
          
          if (d.data.type === 'free') return 'Free';
          const name = d.data.name;
          const maxLength = Math.floor(rectWidth / 8);
          return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
        });

      currentY += clusterHeight + spacing;
    });

    // Update SVG dimensions
    const totalHeight = Math.max(dimensions.height, currentY + margin);
    svg.attr('viewBox', `0 0 ${dimensions.width} ${totalHeight}`)
       .attr('height', totalHeight);

  }, [dimensions, state, onVMSelect, onTooltipUpdate]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'auto'
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          display: 'block',
          fontFamily: DesignTokens.typography.fontFamily
        }}
      />
    </div>
  );
};