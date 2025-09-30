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
  const [focusedNode, setFocusedNode] = useState<any>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);

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

  // Standard Horizontal Zoomable Icicle (like D3 Observable example)
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const visibleClusters = state.clusters.filter(cluster => cluster.isVisible);
    if (visibleClusters.length === 0) {
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

    // Layout constants for standard horizontal icicle
    const width = dimensions.width;
    const height = 500; // Fixed height per cluster
    const spacing = 60;
    let yOffset = 20;

    // Process each cluster separately
    visibleClusters.forEach((cluster, clusterIndex) => {
      // Create cluster group
      const clusterGroup = svg.append('g')
        .attr('transform', `translate(0, ${yOffset})`);

      // Cluster title
      clusterGroup.append('text')
        .attr('x', 20)
        .attr('y', 15)
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', '16px')
        .attr('font-weight', '600')
        .attr('fill', DesignTokens.colors.primary)
        .attr('pointer-events', 'none')
        .text(cluster.name);
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

      // Standard horizontal partition layout
      const partition = d3.partition()
        .size([width, height])
        .padding(1);

      partition(root);

      //Create SVG group for this cluster's icicle
      const icicleGroup = clusterGroup.append('g')
        .attr('transform', `translate(0, 30)`);

      // Track current zoom focus
      let focus = root;

      // Zoom function
      const zoom = (d: any) => {
        focus = d;
        
        const transition = icicleGroup.transition()
          .duration(750)
          .tween('zoom', () => {
            const xd = d3.interpolate(x.domain(), [d.x0, d.x1]);
            const yd = d3.interpolate(y.domain(), [d.y0, 1]);
            return (t: number) => { x.domain(xd(t)); y.domain(yd(t)); };
          });

        transition.selectAll('rect')
          .attr('x', (d: any) => x(d.x0))
          .attr('y', (d: any) => y(d.y0))
          .attr('width', (d: any) => x(d.x1) - x(d.x0))
          .attr('height', (d: any) => y(d.y1) - y(d.y0));

        transition.selectAll('text')
          .attr('x', (d: any) => x(d.x0) + 3)
          .attr('y', (d: any) => y(d.y0) + 13)
          .style('opacity', (d: any) => x(d.x1) - x(d.x0) > 40 ? 1 : 0);
      };

      // Scales
      const x = d3.scaleLinear().range([0, width]);
      const y = d3.scaleLinear().range([0, height]);

      // Render cells
      const cells = icicleGroup.selectAll('g')
        .data(root.descendants())
        .join('g');

      // Add rectangles
      cells.append('rect')
        .attr('x', (d: any) => x(d.x0))
        .attr('y', (d: any) => y(d.y0))
        .attr('width', (d: any) => x(d.x1) - x(d.x0))
        .attr('height', (d: any) => y(d.y1) - y(d.y0))
        .attr('fill', (d: any) => {
          if (d.data.type === 'free') return 'rgba(200, 200, 200, 0.3)';
          if (d.data.type === 'vm') {
            const isSelected = state.selectedVMs.includes(d.data.vmData?.id);
            return isSelected ? 'rgba(139, 92, 246, 0.8)' : 'rgba(99, 102, 241, 0.6)';
          }
          return d.depth === 0 ? 'rgba(139, 92, 246, 0.1)' : d.depth === 1 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(99, 102, 241, 0.5)';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', (d: any) => d.children ? 'pointer' : 'default')
        .on('click', function(event, d: any) {
          event.stopPropagation();
          if (d.children) {
            zoom(d);
          } else if (d.data.vmData) {
            const isMultiSelect = event.ctrlKey || event.metaKey;
            onVMSelect([d.data.vmData.id], isMultiSelect);
          }
        })
        .on('mouseover', function(event, d: any) {
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

      // Add labels
      cells.append('text')
        .attr('x', (d: any) => x(d.x0) + 3)
        .attr('y', (d: any) => y(d.y0) + 13)
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', '11px')
        .attr('font-weight', (d: any) => d.depth <= 1 ? '600' : '400')
        .attr('fill', (d: any) => d.data.type === 'free' ? '#666' : DesignTokens.colors.textPrimary)
        .attr('pointer-events', 'none')
        .style('opacity', (d: any) => x(d.x1) - x(d.x0) > 40 ? 1 : 0)
        .text((d: any) => {
          const width = x(d.x1) - x(d.x0);
          if (width < 50) return '';
          if (d.data.type === 'free') return 'Free';
          const name = d.data.name || '';
          const maxLength = Math.floor(width / 7);
          return name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name;
        });

      yOffset += height + spacing;
    });

    // Update SVG height
    const totalHeight = yOffset;
    svg.attr('viewBox', `0 0 ${width} ${totalHeight}`)
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