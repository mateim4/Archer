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

  // Zoomable Icicle Layout with Click-to-Zoom and Breadcrumbs
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
    const clusterWidth = 120; // Width for cluster label on left
    const clusterHeight = 400; // Height per cluster
    const spacing = 50;
    const breadcrumbHeight = 40;
    
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

      // Create partition layout for hosts/VMs (cluster on left side)
      const contentWidth = dimensions.width - clusterWidth - 3 * margin;
      const partition = d3.partition()
        .size([clusterHeight, contentWidth])
        .padding(3);

      partition(root);

      // Create cluster group
      const clusterGroup = svg.append('g')
        .attr('transform', `translate(${margin}, ${currentY})`);

      // Breadcrumb area for this cluster
      const breadcrumbGroup = clusterGroup.append('g')
        .attr('class', 'breadcrumbs')
        .attr('transform', `translate(${clusterWidth + margin}, 0)`);

      // Cluster label rectangle (tall, on the left)
      clusterGroup.append('rect')
        .attr('x', 0)
        .attr('y', breadcrumbHeight)
        .attr('width', clusterWidth)
        .attr('height', clusterHeight)
        .attr('fill', 'rgba(139, 92, 246, 0.15)')
        .attr('stroke', DesignTokens.colors.primary)
        .attr('stroke-width', 3)
        .attr('rx', 8)
        .style('cursor', 'pointer')
        .on('click', function() {
          // Zoom back to cluster level
          setFocusedNode(null);
          setBreadcrumbs([]);
        });

      // Cluster label text (rotated vertically)
      clusterGroup.append('text')
        .attr('x', clusterWidth / 2)
        .attr('y', breadcrumbHeight + clusterHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', `rotate(-90, ${clusterWidth / 2}, ${breadcrumbHeight + clusterHeight / 2})`)
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', '16px')
        .attr('font-weight', '700')
        .attr('fill', DesignTokens.colors.primary)
        .text(`${cluster.name}`);

      // Utilization text
      clusterGroup.append('text')
        .attr('x', clusterWidth / 2)
        .attr('y', breadcrumbHeight + clusterHeight / 2 + 40)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform', `rotate(-90, ${clusterWidth / 2}, ${breadcrumbHeight + clusterHeight / 2 + 40})`)
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', DesignTokens.colors.primary)
        .text(`${utilizationPercent.toFixed(1)}% Used`);

      // Content container (to the right of cluster label)
      const contentGroup = clusterGroup.append('g')
        .attr('class', 'content')
        .attr('transform', `translate(${clusterWidth + margin}, ${breadcrumbHeight})`);

      // Render icicle rectangles in content group
      const cells = contentGroup.selectAll('g.cell')
        .data(root.descendants().filter(d => d.depth > 0))
        .enter()
        .append('g')
        .attr('class', d => `cell level-${d.depth}`);

      // Add rectangles first
      const rects = cells.append('rect')
        .attr('y', d => d.x0)
        .attr('x', d => d.y0)
        .attr('height', d => d.x1 - d.x0)
        .attr('width', d => d.y1 - d.y0)
        .attr('fill', d => {
          if (d.data.type === 'free') return 'rgba(200, 200, 200, 0.2)';
          if (d.data.type === 'vm') {
            const isSelected = state.selectedVMs.includes(d.data.vmData?.id);
            return isSelected ? 'rgba(139, 92, 246, 0.8)' : 'rgba(99, 102, 241, 0.6)';
          }
          return d.depth === 1 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(99, 102, 241, 0.4)';
        })
        .attr('stroke', d => {
          if (d.data.type === 'free') return 'rgba(150, 150, 150, 0.5)';
          return DesignTokens.colors.primary;
        })
        .attr('stroke-width', d => d.depth === 1 ? 2 : 1)
        .attr('rx', 4);

      // Add labels
      const labels = cells.append('text')
        .attr('y', d => (d.x0 + d.x1) / 2)
        .attr('x', d => (d.y0 + d.y1) / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', DesignTokens.typography.fontFamily)
        .attr('font-size', d => {
          const rectHeight = d.x1 - d.x0;
          const rectWidth = d.y1 - d.y0;
          if (rectWidth < 40 || rectHeight < 16) return '0px';
          if (rectWidth < 80 || rectHeight < 20) return '9px';
          return d.depth === 1 ? '13px' : '11px';
        })
        .attr('font-weight', d => d.depth === 1 ? '600' : '400')
        .attr('fill', d => d.data.type === 'free' ? '#666' : DesignTokens.colors.textPrimary)
        .text(d => {
          const rectWidth = d.y1 - d.y0;
          const rectHeight = d.x1 - d.x0;
          if (rectWidth < 60 || rectHeight < 16) return '';
          
          if (d.data.type === 'free') return 'Free';
          const name = d.data.name;
          const maxLength = Math.floor(rectWidth / 8);
          return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
        });

      // Zoom function (defined after labels)
      const zoom = (p: any) => {
        setFocusedNode(p);
        
        // Build breadcrumb trail
        const path: any[] = [];
        let current = p;
        while (current) {
          path.unshift(current);
          current = current.parent;
        }
        setBreadcrumbs(path);

        // Animate zoom transition
        const t = contentGroup.transition().duration(750);
        
        // Rescale focused node to fill space
        cells.transition(t as any)
          .attr('y', d => d.x0 - p.x0)
          .attr('x', d => d.y0 - p.y0)
          .attr('height', d => (d.x1 - d.x0) * (clusterHeight / (p.x1 - p.x0)))
          .attr('width', d => (d.y1 - d.y0) * (contentWidth / (p.y1 - p.y0)));

        labels.transition(t as any)
          .attr('y', d => (d.x0 + d.x1) / 2 - p.x0)
          .attr('x', d => (d.y0 + d.y1) / 2 - p.y0)
          .style('opacity', d => {
            const rectWidth = (d.y1 - d.y0) * (contentWidth / (p.y1 - p.y0));
            const rectHeight = (d.x1 - d.x0) * (clusterHeight / (p.x1 - p.x0));
            return rectWidth > 50 && rectHeight > 20 ? 1 : 0;
          });
      };

      // Add interaction handlers to rectangles
      rects
        .style('cursor', d => {
          if (d.data.vmData) return 'pointer';
          if (d.data.hostData && d.children) return 'zoom-in';
          return 'default';
        })
        .on('click', function(event, d) {
          event.stopPropagation();
          if (d.data.vmData) {
            const isMultiSelect = event.ctrlKey || event.metaKey;
            onVMSelect([d.data.vmData.id], isMultiSelect);
          } else if (d.data.hostData && d.children) {
            // Zoom into host
            zoom(d);
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

      // Render breadcrumbs for this cluster
      if (breadcrumbs.length > 0) {
        breadcrumbGroup.selectAll('text')
          .data(breadcrumbs)
          .enter()
          .append('text')
          .attr('x', (d, i) => i * 120)
          .attr('y', 20)
          .attr('font-family', DesignTokens.typography.fontFamily)
          .attr('font-size', '12px')
          .attr('fill', DesignTokens.colors.primary)
          .style('cursor', 'pointer')
          .text(d => d.data.name)
          .on('click', (event, d) => zoom(d));
      }

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