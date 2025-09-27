import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { renderToString } from 'react-dom/server';
import { PremiumColor } from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';

interface CapacityCanvasProps {
  state: any; // Simplified for now
  onVMMove?: (vmIds: string[], targetHostId: string) => void;
  onVMSelect?: (vmIds: string[], isMultiSelect: boolean) => void;
  onTooltipUpdate?: (data: any) => void;
}

export const CapacityCanvas: React.FC<CapacityCanvasProps> = ({
  state,
  onVMMove = () => {},
  onVMSelect = () => {},
  onTooltipUpdate = () => {}
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [selectedVMs, setSelectedVMs] = useState<Set<string>>(new Set());
  const [migrationHistory, setMigrationHistory] = useState<Array<{
    id: string;
    vmId: string;
    vmName: string;
    sourceCluster: string;
    targetCluster: string;
    timestamp: Date;
  }>>([]);

  // Simple resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, width),
          height: Math.max(400, height)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Core scaling algorithm: Each vCore gets a fixed height unit
  // With overcommitment ratio, host height = physical cores × overcommitment ratio × unit height
  const VCORE_HEIGHT_UNIT = 15; // Pixels per vCore slot (increased for better visibility)
  const OVERCOMMITMENT_RATIO = 3; // 3:1 overcommitment ratio
  
  const calculateHostCapacity = (physicalCores: number): number => {
    return physicalCores * OVERCOMMITMENT_RATIO; // Total vCore capacity
  };
  
  const calculateHostHeight = (physicalCores: number): number => {
    const totalVCores = calculateHostCapacity(physicalCores);
    return totalVCores * VCORE_HEIGHT_UNIT; // Height based on total vCore slots
  };

  // Azure service icons
  const createVMIcon = (size: number = 18): string => {
    return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vm-grad1-${Math.random()}" x1="8.88" y1="12.21" x2="8.88" y2="0.21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0078d4" />
          <stop offset="0.82" stop-color="#5ea0ef" />
        </linearGradient>
        <linearGradient id="vm-grad2-${Math.random()}" x1="8.88" y1="16.84" x2="8.88" y2="12.21" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stop-color="#ccc" />
          <stop offset="1" stop-color="#707070" />
        </linearGradient>
      </defs>
      <rect x="-0.12" y="0.21" width="18" height="12" rx="0.6" fill="url(#vm-grad1-${Math.random()})" />
      <polygon points="11.88 4.46 11.88 7.95 8.88 9.71 8.88 6.21 11.88 4.46" fill="#50e6ff" />
      <polygon points="11.88 4.46 8.88 6.22 5.88 4.46 8.88 2.71 11.88 4.46" fill="#c3f1ff" />
      <polygon points="8.88 6.22 8.88 9.71 5.88 7.95 5.88 4.46 8.88 6.22" fill="#9cebff" />
      <polygon points="5.88 7.95 8.88 6.21 8.88 9.71 5.88 7.95" fill="#c3f1ff" />
      <polygon points="11.88 7.95 8.88 6.21 8.88 9.71 11.88 7.95" fill="#9cebff" />
      <path d="M12.49,15.84c-1.78-.28-1.85-1.56-1.85-3.63H7.11c0,2.07-.06,3.35-1.84,3.63a1,1,0,0,0-.89,1h9A1,1,0,0,0,12.49,15.84Z" fill="url(#vm-grad2-${Math.random()})" />
    </svg>`;
  };

  const createHostIcon = (size: number = 18): string => {
    return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="host-grad-${Math.random()}" x1="9.23" x2="9.23" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#a67af4" />
          <stop offset="0.999" stop-color="#773adc" />
        </linearGradient>
      </defs>
      <path d="M15.074,17.39A.645.645,0,0,1,14.4,18H4.062a.645.645,0,0,1-.675-.61V.61A.645.645,0,0,1,4.062,0H14.4a.645.645,0,0,1,.675.61Z" fill="url(#host-grad-${Math.random()})" />
      <path d="M13.461,7.7a1.34,1.34,0,0,0-1.27-1.4H6.375a1.34,1.34,0,0,0-1.27,1.4h0a1.34,1.34,0,0,0,1.27,1.4h5.816a1.34,1.34,0,0,0,1.27-1.4Z" fill="#552f99" />
      <path d="M13.461,3.537a1.34,1.34,0,0,0-1.27-1.4H6.375a1.34,1.34,0,0,0-1.27,1.4h0a1.34,1.34,0,0,0,1.27,1.4h5.816a1.34,1.34,0,0,0,1.27-1.4Z" fill="#552f99" />
      <circle cx="11.826" cy="3.537" r="0.939" fill="#50e6ff" />
      <circle cx="11.826" cy="7.695" r="0.939" fill="#50e6ff" />
    </svg>`;
  };

  const createClusterIcon = (size: number = 18): string => {
    return `<svg width="${size}" height="${size}" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,3.213v11.574c0,.852.339,1.67.941,2.272.603.603,1.42.941,2.272.941h11.574c.852,0,1.669-.338,2.272-.941s.941-1.42.941-2.272V3.213c0-.852-.339-1.669-.941-2.272C16.456.339,15.639,0,14.787,0H3.213C2.361,0,1.544.339.941.941c-.603.603-.941,1.42-.941,2.272Z" fill="#1072dd" fill-rule="evenodd" />
      <path d="M1.152,14.787V3.213c0-.547.217-1.071.604-1.457.387-.387.911-.604,1.457-.604h11.574c.547,0,1.071.217,1.457.604.386.387.604.911.604,1.457v11.574c0,.547-.217,1.071-.604,1.458-.386.386-.911.604-1.457.604H3.213c-.547,0-1.071-.217-1.457-.604-.387-.387-.604-.911-.604-1.458Z" fill="#d0f1fd" />
      <rect x="3.669" y="5.123" width="10.661" height="7.754" fill="#1072dd" />
      <path d="M2.7,12.586c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
      <path d="M2.7,8.225c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
      <path d="M2.7,3.863c0-.642.521-1.163,1.163-1.163h10.274c.642,0,1.163.521,1.163,1.163v1.551c0,.642-.521,1.163-1.163,1.163H3.863c-.642,0-1.163-.521-1.163-1.163v-1.551Z" fill="#0094f0" />
    </svg>`;
  };


  // Main visualization effect
  useEffect(() => {
    if (!svgRef.current || !state || !state.clusters) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main group for zoom transforms
    const mainGroup = svg.append('g').attr('class', 'visualization-group');
    
    // Track current focus for click-to-zoom
    let currentFocus = null;
    
    // Variables for drag and drop
    let draggedVMs: any[] = [];
    let dragStartX = 0;
    let dragStartY = 0;
    let dragGroup: any = null;

    const visibleClusters = state.clusters.filter((cluster: any) => cluster.isVisible);
    
    if (visibleClusters.length === 0) {
      mainGroup.append('text')
        .attr('x', dimensions.width / 2)
        .attr('y', dimensions.height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Segoe UI, system-ui, sans-serif')
        .attr('font-size', '18px')
        .attr('fill', '#666')
        .text('No clusters visible. Use the control panel to add clusters.');
      return;
    }

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Calculate layout dimensions for VERTICAL icicle layout
    const clusterWidth = 240; // Tripled width for horizontal text display
    const hostWidth = 150; // Fixed width for host column  
    const vmWidth = Math.min(300, (width - clusterWidth - hostWidth - (margin.left + margin.right) - 20) / 2); // Half width VMs, max 300px
    
    // Global scaling factor - set to 1 since we now use proper vCore-based sizing
    // Each vCore gets VCORE_HEIGHT_UNIT pixels
    let globalScaleFactor = 1;


    let totalHeight = 0;
    const clusterData = visibleClusters.map((cluster: any, clusterIndex: number) => {
      const hosts = cluster.hosts || [];
      
      // Calculate cluster height = sum of scaled host heights with minimum 200px
      const hostHeights = hosts.map((host: any) => {
        const cores = host.totalCores || 32;
        return calculateHostHeight(cores) * globalScaleFactor; // Apply 3x scaling for readability
      });
      
      const calculatedClusterHeight = hostHeights.reduce((sum: number, h: number) => sum + h, 0);
      const clusterHeight = Math.max(200, calculatedClusterHeight); // Use actual sum of host heights, minimum 200px
      
      // Use the original scaled host heights directly - no additional scaling needed
      const scaledHostHeights = hostHeights;
      
      const result = {
        cluster,
        clusterIndex,
        clusterHeight,
        hosts: hosts.map((host: any, hostIndex: number) => ({
          host,
          hostIndex,
          height: scaledHostHeights[hostIndex],
          vms: host.vms || []
        }))
      };
      
      totalHeight += clusterHeight + 20; // Accumulate total height for all clusters
      return result;
    });

    // Set SVG dimensions to fit vertical columns plus space for checkboxes
    const checkboxSpace = 40; // Extra space for checkboxes (24px + 12px gap + margin)
    const totalWidth = clusterWidth + hostWidth + vmWidth + (margin.left + margin.right) + checkboxSpace;
    const totalViewHeight = Math.max(height, totalHeight + margin.top + margin.bottom);
    
    // Set proper SVG dimensions for zoom
    svg
      .attr('viewBox', `0 0 ${totalWidth} ${totalViewHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Proper D3 icicle zoom with uniform scaling to prevent text distortion
    let focus = null; // Root element (null = show all)
    
    const clicked = (event: any, targetData: any) => {
      event.stopPropagation();
      
      // Toggle focus exactly like D3 icicle
      const isSameFocus = focus && 
        focus.type === targetData?.type && 
        focus.clusterIndex === targetData?.clusterIndex &&
        (targetData?.type === 'cluster' || focus.hostIndex === targetData?.hostIndex);
      
      focus = isSameFocus ? null : targetData;
      currentFocus = focus;
      
      if (!focus) {
        // Zoom out to root - show all elements
        mainGroup
          .transition()
          .duration(750)
          .attr('transform', 'translate(0, 0) scale(1)');
        
        // Reset text scaling, position, and font size
        mainGroup.selectAll('.host-text, .vm-text, .free-space-text')
          .transition()
          .duration(750)
          .attr('transform', null) // Clear all transforms
          .attr('font-size', function() {
            const element = d3.select(this);
            return element.classed('host-text') ? '12px' : 
                   element.classed('free-space-text') ? '10px' : '9px'; // VM text
          });
        
        // Reset inline VM checkboxes
        mainGroup.selectAll('.vm-checkbox-inline')
          .transition()
          .duration(750)
          .attr('transform', function() {
            // Restore original positioning without any scaling
            const element = d3.select(this);
            const vmGroup = d3.select(element.node()?.parentNode);
            const vmRect = vmGroup.select('rect');
            const vmRectWidth = parseFloat(vmRect.attr('width'));
            const vmRectHeight = parseFloat(vmRect.attr('height'));
            
            // Recalculate original checkbox positioning
            const minCheckboxSize = 10;
            const maxCheckboxSize = 16;
            const checkboxScale = Math.min(vmRectHeight * 0.5, vmRectWidth * 0.15);
            const checkboxSize = Math.max(minCheckboxSize, Math.min(maxCheckboxSize, checkboxScale));
            const checkboxPadding = 4;
            
            return `translate(${vmRectWidth - checkboxSize - checkboxPadding}, ${(vmRectHeight - checkboxSize) / 2})`;
          });

        // Reset cluster text
        mainGroup.selectAll('.cluster-text-group')
          .transition()
          .duration(750)
          .attr('transform', function() {
            const element = d3.select(this);
            const parentG = element.select(function() { return this.parentNode; });
            const clusterWidth = parseFloat(parentG.select('rect').attr('width'));
            const textCount = element.selectAll('text').size();
            return `translate(${clusterWidth / 2}, ${20 + textCount * 8})`;
          });

        
        // Note: VM checkboxes are now inline and don't need removal
        
        mainGroup.selectAll('.cluster-text-group')
          .transition()
          .duration(750)
          .attr('transform', function() {
            const element = d3.select(this);
            const parentG = element.select(function() { return this.parentNode; });
            const clusterWidth = parseFloat(parentG.select('rect').attr('width'));
            const textCount = element.selectAll('text').size();
            return `translate(${clusterWidth / 2}, ${20 + textCount * 8})`;
          });
        
        // Reset cluster text font size
        mainGroup.selectAll('.cluster-text-group text')
          .transition()
          .duration(750)
          .attr('font-size', '14px');
        
        // Reset cluster percentage
        mainGroup.selectAll('.cluster-percentage')
          .transition()
          .duration(750)
          .attr('transform', null)
          .attr('font-size', '16px');
      } else {
        // Zoom into focused element with UNIFORM scaling
        const containerHeight = dimensions.height;
        const containerWidth = dimensions.width;
        let focusTop, focusHeight, focusLeft, focusWidth;
        
        if (focus.type === 'cluster') {
          // Focus on entire cluster row
          focusTop = focus.clusterY;
          focusHeight = focus.clusterHeight;
          focusLeft = margin.left;
          focusWidth = totalWidth - margin.left - margin.right;
        } else if (focus.type === 'host') {
          // Focus on host - expand to fill full canvas height
          focusTop = focus.hostY;
          focusHeight = focus.height;
          focusLeft = margin.left + clusterWidth;
          focusWidth = hostWidth + vmWidth;
        }
        
        // Calculate scale - for hosts, make them span full height
        let scale;
        let translateX, translateY;
        
        if (focus.type === 'host') {
          // Calculate global minimum height scaling factor ONLY when zoomed into a host
          const minVMHeight = 32; // Minimum height to accommodate 14px text + padding
          let zoomGlobalScaleFactor = 1;
          
          // Find the smallest VM across all clusters to determine if scaling is needed
          visibleClusters.forEach((cluster: any) => {
            cluster.hosts?.forEach((host: any) => {
              const hostHeight = calculateHostHeight(host.totalCores || 32);
              host.vms?.forEach((vm: any) => {
                const vmCores = vm.allocatedVCPUs || 1;
                const calculatedVMHeight = (vmCores / (host.totalCores || 32)) * hostHeight;
                if (calculatedVMHeight < minVMHeight) {
                  const requiredScale = minVMHeight / calculatedVMHeight;
                  zoomGlobalScaleFactor = Math.max(zoomGlobalScaleFactor, requiredScale);
                }
              });
            });
          });
          
          // Apply global scaling to the focus height for proper zoom calculation
          const adjustedFocusHeight = focusHeight * zoomGlobalScaleFactor;
          
          // Limit zoom to 2x maximum for better usability with large hosts
          const desiredScaleY = containerHeight / adjustedFocusHeight;
          const scaleY = Math.min(2, desiredScaleY); // Cap at 2x zoom
          // To keep the focused host's top edge at the same screen position,
          // we need to compensate for the scaling effect on its position
          // When scaling, the top of the focused area would move to focusTop * scaleY
          // We want it to stay at focusTop, so we translate by the difference
          const translateY = focusTop - (focusTop * scaleY); // Compensate for scaling displacement
          const translateX = 0; // Keep horizontal position unchanged
          
          
          mainGroup
            .transition()
            .duration(750)
            .attr('transform', `translate(${translateX}, ${translateY}) scale(1, ${scaleY})`);
          
          // Apply counter-scaling to text immediately to prevent stretching animation
          mainGroup.selectAll('.host-text, .vm-text, .free-space-text')
            .attr('transform', function() {
              // Get the current element to determine its center offset
              const element = d3.select(this);
              const x = parseFloat(element.attr('x') || '0');
              const y = parseFloat(element.attr('y') || '0');
              
              // Apply counter-scaling while maintaining center position
              const offsetY = y * (1 - 1/scaleY); // Compensate for scaling effect on position
              return `translate(0, ${offsetY}) scale(1, ${1/scaleY})`;
            })
            .transition()
            .duration(750)
            .attr('font-size', function() {
              const element = d3.select(this);
              const baseSize = element.classed('host-text') ? 12 : 
                              element.classed('free-space-text') ? 10 : 9; // VM text base size
              // Scale font size up but cap at reasonable maximum
              return `${Math.min(14, baseSize * Math.sqrt(scaleY))}px`;
            });

          // Counter-scale inline VM checkboxes to prevent stretching during host zoom
          mainGroup.selectAll('.vm-checkbox-inline')
            .attr('transform', function() {
              const element = d3.select(this);
              // Get current transform to preserve positioning
              const currentTransform = element.attr('transform');
              const translateMatch = currentTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              
              // Apply counter-scaling to maintain aspect ratio during zoom
              return `translate(${translateX}, ${translateY}) scale(1, ${1/scaleY})`;
            })
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const currentTransform = element.attr('transform');
              const translateMatch = currentTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              return `translate(${translateX}, ${translateY}) scale(1, ${1/scaleY})`;
            });
          
          
          // Adjust cluster text to prevent stretching and center relative to visible canvas height
          mainGroup.selectAll('.cluster-text-group')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const parentG = element.select(function() { return this.parentNode; });
              const clusterRect = parentG.select('rect');
              const clusterWidth = parseFloat(clusterRect.attr('width'));
              
              // Keep the text at the top of the cluster, not centered
              const topY = 20; // Fixed position at top with small padding
              
              // Apply counter-scaling to prevent text stretching
              return `translate(${clusterWidth / 2}, ${topY}) scale(1, ${1/scaleY})`;
            });
          
          // Increase cluster text font size when zoomed
          mainGroup.selectAll('.cluster-text-group text')
            .transition()
            .duration(750)
            .attr('font-size', `${Math.min(18, 14 * Math.sqrt(scaleY))}px`);
          
          
          // Counter-scale stroke-width to keep borders at 2px during zoom
          mainGroup.selectAll('rect')
            .transition()
            .duration(750)
            .attr('stroke-width', 2 / scaleY); // Keep border width constant at 2px
          
          // Counter-scale cluster percentage to prevent stretching
          mainGroup.selectAll('.cluster-percentage')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const y = parseFloat(element.attr('y') || '0');
              const offsetY = y * (1 - 1/scaleY);
              return `translate(0, ${offsetY}) scale(1, ${1/scaleY})`;
            })
            .attr('font-size', `${Math.min(20, 16 * Math.sqrt(scaleY))}px`);
        } else {
          // For clusters, use uniform scale to fit both dimensions
          const scaleX = containerWidth / focusWidth;
          const scaleY = containerHeight / focusHeight;
          scale = Math.min(scaleX, scaleY);
          
          // Center the focused element
          translateX = (containerWidth - focusWidth * scale) / 2 - focusLeft * scale;
          translateY = (containerHeight - focusHeight * scale) / 2 - focusTop * scale;
          
          mainGroup
            .transition()
            .duration(750)
            .attr('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
          
          
          // Counter-scale inline VM checkboxes during cluster zoom
          mainGroup.selectAll('.vm-checkbox-inline')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const currentTransform = element.attr('transform');
              const translateMatch = currentTransform?.match(/translate\(([^,]+),\s*([^)]+)\)/);
              const translateX = translateMatch ? parseFloat(translateMatch[1]) : 0;
              const translateY = translateMatch ? parseFloat(translateMatch[2]) : 0;
              
              // Apply counter-scaling for cluster zoom (uniform scaling)
              const offsetX = translateX * (1 - 1/scale);
              const offsetY = translateY * (1 - 1/scale);
              return `translate(${translateX + offsetX}, ${translateY + offsetY}) scale(${1/scale})`;
            });
          
          // Keep cluster text centered and unstretched during cluster zoom
          mainGroup.selectAll('.cluster-text-group')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const parentG = element.select(function() { return this.parentNode; });
              const clusterRect = parentG.select('rect');
              const clusterWidth = parseFloat(clusterRect.attr('width'));
              const clusterHeight = parseFloat(clusterRect.attr('height'));
              
              // Keep text at top during cluster zoom, apply uniform counter-scaling
              const topY = 20; // Fixed position at top with small padding
              return `translate(${clusterWidth / 2}, ${topY}) scale(${1/scale})`;
            });
          
          // Increase cluster text font size for cluster zoom
          mainGroup.selectAll('.cluster-text-group text')
            .transition()
            .duration(750)
            .attr('font-size', `${Math.min(18, 14 * Math.sqrt(scale))}px`);
          
          // Counter-scale cluster percentage for cluster zoom
          mainGroup.selectAll('.cluster-percentage')
            .transition()
            .duration(750)
            .attr('transform', function() {
              const element = d3.select(this);
              const x = parseFloat(element.attr('x') || '0');
              const y = parseFloat(element.attr('y') || '0');
              const offsetX = x * (1 - 1/scale);
              const offsetY = y * (1 - 1/scale);
              return `translate(${offsetX}, ${offsetY}) scale(${1/scale})`;
            })
            .attr('font-size', `${Math.min(20, 16 * Math.sqrt(scale))}px`);
          
          // Counter-scale stroke-width for cluster zoom to keep borders at 2px
          mainGroup.selectAll('rect')
            .transition()
            .duration(750)
            .attr('stroke-width', 2 / scale);
        }
      }
    };

    // Add background click to zoom out
    svg.on('click', () => {
      if (focus) {
        clicked({ stopPropagation: () => {} }, null);
      }
    });

    // Create drag behavior for VMs
    const dragBehavior = d3.drag()
      .on('start', function(event: any, d: any) {
        event.sourceEvent.stopPropagation();
        
        const vmElement = d3.select(this.parentNode);
        const vmId = d.vmId;
        
        // If the dragged VM is not selected, select it
        if (!selectedVMs.has(vmId)) {
          const newSelected = new Set(selectedVMs);
          newSelected.clear();
          newSelected.add(vmId);
          setSelectedVMs(newSelected);
        }
        
        // Collect all selected VMs to drag together
        draggedVMs = [];
        selectedVMs.forEach(id => {
          const vmEl = mainGroup.select(`[data-vm-id="${id}"]`);
          if (!vmEl.empty()) {
            const transform = vmEl.attr('transform');
            const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
            if (match) {
              draggedVMs.push({
                id,
                element: vmEl,
                originalX: parseFloat(match[1]),
                originalY: parseFloat(match[2])
              });
            }
          }
        });
        
        dragStartX = event.x;
        dragStartY = event.y;
        
        // Create temporary drag group for visual feedback
        dragGroup = mainGroup.append('g')
          .attr('class', 'drag-group')
          .style('opacity', 0.7);
          
        // Clone selected VMs into drag group
        draggedVMs.forEach(vm => {
          const clone = vm.element.node().cloneNode(true);
          dragGroup.node().appendChild(clone);
        });
      })
      .on('drag', function(event: any) {
        if (!dragGroup) return;
        
        const dx = event.x - dragStartX;
        const dy = event.y - dragStartY;
        
        // Move the drag group
        dragGroup.attr('transform', `translate(${dx}, ${dy})`);
        
        // Highlight potential drop zones
        mainGroup.selectAll('.host-rect, .cluster-rect')
          .style('stroke-width', function() {
            const rect = d3.select(this);
            const rectNode = rect.node() as SVGRectElement;
            const bbox = rectNode.getBBox();
            const transform = rectNode.getCTM();
            
            if (transform) {
              const x = bbox.x + transform.e;
              const y = bbox.y + transform.f;
              const width = bbox.width;
              const height = bbox.height;
              
              // Check if cursor is over this rectangle
              if (event.x >= x && event.x <= x + width &&
                  event.y >= y && event.y <= y + height) {
                return 4; // Highlight as drop zone
              }
            }
            return rect.attr('stroke-width');
          })
          .style('stroke', function() {
            const rect = d3.select(this);
            const rectNode = rect.node() as SVGRectElement;
            const bbox = rectNode.getBBox();
            const transform = rectNode.getCTM();
            
            if (transform) {
              const x = bbox.x + transform.e;
              const y = bbox.y + transform.f;
              const width = bbox.width;
              const height = bbox.height;
              
              if (event.x >= x && event.x <= x + width &&
                  event.y >= y && event.y <= y + height) {
                return '#00ff00'; // Green for valid drop zone
              }
            }
            return rect.attr('stroke');
          });
      })
      .on('end', function(event: any) {
        if (!dragGroup) return;
        
        // Find drop target
        let dropTarget = null;
        let dropTargetType = null;
        
        mainGroup.selectAll('.host-rect, .cluster-rect').each(function(d: any) {
          const rect = d3.select(this);
          const rectNode = rect.node() as SVGRectElement;
          const bbox = rectNode.getBBox();
          const transform = rectNode.getCTM();
          
          if (transform) {
            const x = bbox.x + transform.e;
            const y = bbox.y + transform.f;
            const width = bbox.width;
            const height = bbox.height;
            
            if (event.x >= x && event.x <= x + width &&
                event.y >= y && event.y <= y + height) {
              dropTarget = d;
              dropTargetType = rect.classed('host-rect') ? 'host' : 'cluster';
            }
          }
        });
        
        // Handle the drop
        if (dropTarget) {
          // Perform migration
          const targetClusterName = dropTargetType === 'cluster' ? 
            dropTarget.cluster.name : dropTarget.clusterName;
            
          if (targetClusterName) {
            performMigration(targetClusterName);
          }
        }
        
        // Clean up
        dragGroup.remove();
        dragGroup = null;
        draggedVMs = [];
        
        // Reset highlighting
        mainGroup.selectAll('.host-rect, .cluster-rect')
          .style('stroke-width', function() {
            return d3.select(this).classed('cluster-rect') ? 2 : 1;
          })
          .style('stroke', '#fff');
      });

    // Column 1: Clusters (vertical rectangles stacked)
    let clusterY = 0; // Start at 0, not margin.top, to align with hosts/VMs
    clusterData.forEach(({ cluster, clusterIndex, clusterHeight, hosts }) => {
      const clusterGroup = mainGroup.append('g')
        .attr('class', `cluster-${clusterIndex}`)
        .attr('transform', `translate(${margin.left}, ${clusterY})`);

      // Cluster vertical rectangle
      clusterGroup.append('rect')
        .attr('class', 'cluster-rect')
        .datum({ cluster, clusterIndex, clusterHeight, clusterY })
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', clusterWidth)
        .attr('height', clusterHeight)
        .attr('fill', '#8b5cf6')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('click', (event) => clicked(event, { cluster, clusterIndex, clusterHeight, clusterY, type: 'cluster' }))
        .on('mouseenter', function(event) {
          // Create tooltip with cluster information
          const totalHosts = hosts.length;
          const totalVMs = hosts.reduce((sum: any, h: any) => sum + (h.host.vms?.length || 0), 0);
          const totalPhysicalCores = hosts.reduce((sum: any, h: any) => sum + (h.host.totalCores || 32), 0);
          const totalVCoreCapacity = totalPhysicalCores * OVERCOMMITMENT_RATIO;
          const totalAllocatedVCores = hosts.reduce((sum: any, h: any) => {
            return sum + (h.host.vms?.reduce((vmSum: number, vm: any) => {
              return vmSum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
            }, 0) || 0);
          }, 0);
          const clusterUtilization = ((totalAllocatedVCores / totalVCoreCapacity) * 100).toFixed(1);
          
          const tooltipContent = {
            title: cluster.name || 'Unknown Cluster',
            metrics: [
              { label: 'Hosts', value: `${totalHosts}` },
              { label: 'Total VMs', value: `${totalVMs}` },
              { label: 'Physical Cores', value: `${totalPhysicalCores}` },
              { label: 'vCore Capacity', value: `${totalVCoreCapacity} (3:1 overcommit)` },
              { label: 'Allocated vCores', value: `${totalAllocatedVCores}` },
              { label: 'Utilization', value: `${clusterUtilization}%` },
              { label: 'Cluster Type', value: cluster.type || 'Production' },
              { label: 'Status', value: cluster.status || 'Active' }
            ]
          };
          
          onTooltipUpdate({
            x: event.pageX + 10,
            y: event.pageY - 10,
            content: tooltipContent
          });
        })
        .on('mouseleave', function() {
          onTooltipUpdate(null);
        });


      // Cluster name (horizontal text, centered)
      const words = cluster.name.split(' ');
      const maxLineWidth = clusterWidth - 20; // Max width minus padding
      
      // Create text lines by grouping words to fit width
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        // Rough character width estimation (8px per character)
        if (testLine.length * 8 <= maxLineWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Limit to 2 lines maximum
      const displayLines = lines.slice(0, 2);
      
      // Create text group for horizontal multi-line text (top-aligned)
      const textGroup = clusterGroup.append('g')
        .attr('class', 'cluster-text-group')
        .attr('transform', `translate(${clusterWidth / 2}, ${8 + displayLines.length * 8})`) // Top alignment with minimal padding
        .style('pointer-events', 'none'); // Make text non-interactive
      
      // Add each line of text horizontally
      displayLines.forEach((line, index) => {
        const yOffset = index * 16; // 16px line spacing
        textGroup.append('text')
          .attr('x', 0)
          .attr('y', yOffset)
          .attr('font-family', 'Segoe UI, system-ui, sans-serif')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', '#fff')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .style('pointer-events', 'none') // Make text non-interactive
          .text(line);
      });

      // Calculate utilization percentage
      const totalCapacity = hosts.reduce((sum: any, h: any) => sum + (h.host.totalCores || 32), 0);
      const totalAllocated = hosts.reduce((sum: any, h: any) => 
        sum + h.vms.reduce((vmSum: any, vm: any) => vmSum + (vm.allocatedVCPUs || 0), 0), 0);
      const utilizationPercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

      // Cluster utilization percentage (bottom of rectangle)
      clusterGroup.append('text')
        .attr('class', 'cluster-percentage')
        .attr('x', clusterWidth / 2)
        .attr('y', clusterHeight - 20)
        .attr('font-family', 'Segoe UI, system-ui, sans-serif')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .text(`${utilizationPercent.toFixed(1)}%`);

      // Column 2: Hosts (vertical rectangles for this cluster)
      let hostY = clusterY; // Start hosts at same Y as their cluster
      hosts.forEach(({ host, hostIndex, height, vms }) => {
        const currentHostY = hostY; // Capture current hostY for this specific host
        
        // Use the already-scaled height from cluster data calculation
        const scaledHostHeight = height;
        
        const hostGroup = mainGroup.append('g')
          .attr('class', `host-${clusterIndex}-${hostIndex}`)
          .attr('transform', `translate(${margin.left + clusterWidth}, ${currentHostY})`);

        // Host vertical rectangle (proportional height based on cores)
        hostGroup.append('rect')
          .attr('class', 'host-rect')
          .datum({ host, hostIndex, clusterIndex, clusterName: cluster.name })
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', hostWidth)
          .attr('height', scaledHostHeight)
          .attr('fill', 'rgba(139, 92, 246, 0.3)')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            clicked(event, { 
              cluster, 
              clusterIndex, 
              hostIndex, 
              clusterY, 
              hostY: currentHostY, // Use the captured position for this specific host
              height, 
              type: 'host' 
            });
          })
          .on('mouseenter', function(event) {
            // Create tooltip with host information
            const allocatedVCores = vms.reduce((sum: number, vm: any) => {
              return sum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
            }, 0);
            const hostVCoreCapacity = calculateHostCapacity(host.totalCores || 32);
            const utilizationPercent = ((allocatedVCores / hostVCoreCapacity) * 100).toFixed(1);
            
            const tooltipContent = {
              title: host.name || 'Unknown Host',
              metrics: [
                { label: 'Physical Cores', value: `${host.totalCores || 32}` },
                { label: 'vCore Capacity', value: `${hostVCoreCapacity} (3:1 overcommit)` },
                { label: 'Allocated vCores', value: `${allocatedVCores}` },
                { label: 'Utilization', value: `${utilizationPercent}%` },
                { label: 'Total RAM', value: `${host.totalRAMGB || 'N/A'} GB` },
                { label: 'CPU Model', value: host.hardwareDetails?.cpuModel || 'N/A' },
                { label: 'Sockets', value: `${host.hardwareDetails?.socketCount || 'N/A'}` },
                { label: 'VMs Count', value: `${vms.length}` }
              ]
            };
            
            onTooltipUpdate({
              x: event.pageX + 10,
              y: event.pageY - 10,
              content: tooltipContent
            });
          })
          .on('mouseleave', function() {
            onTooltipUpdate(null);
          });


        // Host name (left-aligned)
        hostGroup.append('text')
          .attr('class', 'host-text')
          .attr('x', 8) // Left padding
          .attr('y', 20) // Top alignment with padding
          .attr('font-family', 'Segoe UI, system-ui, sans-serif')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('fill', '#fff')
          .attr('text-anchor', 'start') // Changed from middle to start
          .attr('dominant-baseline', 'hanging')
          .style('pointer-events', 'none')
          .text(host.name);

        // Column 3: VMs (single column, scaled by height based on allocated resources)
        const totalVMCores = vms.reduce((sum: number, vm: any) => sum + (vm.allocatedVCPUs || 1), 0);
        const vmRectWidth = vmWidth; // VMs use full column width
        
        let vmYOffset = 0;
        
        vms.forEach((vm: any, vmIndex: number) => {
          const vmGroup = mainGroup.append('g')
            .attr('class', `vm-${clusterIndex}-${hostIndex}-${vmIndex}`)
            .attr('data-vm-id', vm.id)
            .attr('transform', `translate(${margin.left + clusterWidth + hostWidth}, ${currentHostY + vmYOffset})`);

          // VM rectangle height based on vCores relative to host's total vCore capacity
          // VM can have cores and cpus that multiply, or just allocatedVCPUs
          const vmVCores = vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1;
          const hostVCoreCapacity = calculateHostCapacity(host.totalCores || 32);
          const vmRectHeight = (vmVCores / hostVCoreCapacity) * scaledHostHeight;

          // Check if VM is selected or migrated
          const isSelected = selectedVMs.has(vm.id);
          const isMigrated = migrationHistory.some(m => m.vmId === vm.id);
          
          let fillColor = 'rgba(99, 102, 241, 0.8)'; // Default blue
          let textColor = '#fff'; // Default white text
          if (isMigrated) {
            fillColor = 'rgba(255, 193, 7, 0.9)'; // Yellow for migrated VMs
          } else if (isSelected) {
            fillColor = '#fff9c4'; // Pastel yellow for selected
            textColor = '#000'; // Black text for selected
          }

          // Shared VM selection handler
          const handleVMSelection = (event: any) => {
            console.log('🖱️ VM selection handler called for VM:', vm.id);
            event.stopPropagation();
            
            // Handle VM selection with single-click
            const newSelected = new Set(selectedVMs);
            if (newSelected.has(vm.id)) {
              console.log('📤 Deselecting VM:', vm.id);
              newSelected.delete(vm.id);
            } else {
              console.log('📥 Selecting VM:', vm.id);
              newSelected.add(vm.id);
            }
            
            console.log('✅ Setting new selection:', Array.from(newSelected));
            setSelectedVMs(newSelected);
            // Don't call onVMSelect to prevent zoom reset
          };

          const vmRect = vmGroup.append('rect')
            .datum({ vmId: vm.id, vm, cluster, host, clusterIndex, hostIndex })
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', vmRectWidth)
            .attr('height', vmRectHeight)
            .attr('fill', fillColor)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'move')
            .on('click', handleVMSelection);
          
          console.log('✨ VM rectangle created for:', vm.id, 'with click handler');
          
          vmRect.on('mouseenter', function(event) {
              // Create tooltip with VM information in the expected format
              const tooltipContent = {
                title: vm.name || 'Unknown VM',
                metrics: [
                  { label: 'IP Address', value: vm.ipAddress || 'N/A' },
                  { label: 'Allocated CPUs', value: vm.allocatedVCPUs || 'N/A' },
                  { label: 'vCores', value: vm.vCores || vm.allocatedVCPUs || 'N/A' },
                  { label: 'Memory', value: vm.memory || 'N/A' },
                  { label: 'Storage', value: vm.storage || 'N/A' },
                  { label: 'Port Group', value: vm.portGroup || vm.networkName || 'N/A' }
                ]
              };
              
              onTooltipUpdate({
                x: event.pageX + 10,
                y: event.pageY - 10,
                content: tooltipContent
              });
            })
            .on('mouseleave', function() {
              onTooltipUpdate(null); // Set to null to hide tooltip
            });
            // Removed dragBehavior to fix single-click selection


          // VM name (horizontal text, left-aligned)
          vmGroup.append('text')
            .attr('class', 'vm-text')
            .attr('x', 8) // Left padding
            .attr('y', vmRectHeight / 2)
            .attr('font-family', 'Segoe UI, system-ui, sans-serif')
            .attr('font-size', '9px')
            .attr('fill', textColor)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .style('pointer-events', 'none')
            .text(vm.name);

          // VM selection checkbox (right-aligned inside rectangle)
          const minCheckboxSize = 10;
          const maxCheckboxSize = 16;
          const checkboxScale = Math.min(vmRectHeight * 0.5, vmRectWidth * 0.15); // Scale with both dimensions
          const checkboxSize = Math.max(minCheckboxSize, Math.min(maxCheckboxSize, checkboxScale)); // Maintain aspect ratio
          const checkboxPadding = 4;
          
          const checkboxGroup = vmGroup.append('g')
            .attr('class', 'vm-checkbox-inline')
            .attr('data-vm-id', vm.id)
            .style('cursor', 'pointer')
            .attr('transform', `translate(${vmRectWidth - checkboxSize - checkboxPadding}, ${(vmRectHeight - checkboxSize) / 2})`);

          // Checkbox background with click handling
          checkboxGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', checkboxSize)
            .attr('height', checkboxSize)
            .attr('rx', 2)
            .attr('fill', isSelected ? '#10b981' : '#ffffff')
            .attr('stroke', isSelected ? '#10b981' : '#374151')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('click', handleVMSelection);
          
          console.log('☑️ Checkbox created for VM:', vm.id, 'selected:', isSelected);

          // Checkmark (only when selected)
          if (isSelected) {
            checkboxGroup.append('path')
              .attr('d', `M${checkboxSize * 0.25},${checkboxSize * 0.5} L${checkboxSize * 0.45},${checkboxSize * 0.7} L${checkboxSize * 0.75},${checkboxSize * 0.3}`)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', Math.max(1.5, checkboxSize * 0.15))
              .attr('stroke-linecap', 'round')
              .attr('stroke-linejoin', 'round')
              .attr('fill', 'none')
              .style('pointer-events', 'none'); // Prevent interfering with click
          }

          vmYOffset += vmRectHeight; // Move to next VM position
        });

        // Add free space rectangle if there's remaining capacity
        const allocatedVCores = vms.reduce((sum: number, vm: any) => {
          return sum + (vm.allocatedVCPUs || (vm.cores * vm.cpus) || 1);
        }, 0);
        const hostVCoreCapacity = calculateHostCapacity(host.totalCores || 32);
        const freeVCores = hostVCoreCapacity - allocatedVCores;
        if (freeVCores > 0) {
          const freeSpaceHeight = (freeVCores / hostVCoreCapacity) * scaledHostHeight;
          
          const freeSpaceGroup = mainGroup.append('g')
            .attr('class', `free-space-${clusterIndex}-${hostIndex}`)
            .attr('transform', `translate(${margin.left + clusterWidth + hostWidth}, ${currentHostY + vmYOffset})`);

          freeSpaceGroup.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', vmRectWidth)
            .attr('height', freeSpaceHeight)
            .attr('fill', 'rgba(34, 197, 94, 0.3)') // Light green for free space
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5'); // Dashed border for free space

          // Free space label
          freeSpaceGroup.append('text')
            .attr('class', 'free-space-text')
            .attr('x', vmRectWidth / 2)
            .attr('y', freeSpaceHeight / 2)
            .attr('font-family', 'Segoe UI, system-ui, sans-serif')
            .attr('font-size', '9px')
            .attr('fill', '#16a34a')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('pointer-events', 'none')
            .text(`Free (${freeVCores} vCores)`);
        }

        hostY += scaledHostHeight; // Move to next host position vertically using scaled height
      });

      clusterY += clusterHeight + 20; // Move to next cluster position
    });


    console.log('🎯 NEW SIMPLIFIED ICICLE VISUALIZATION RENDERED');
    console.log('Clusters:', visibleClusters.length);
    console.log('Total height:', totalHeight);

  }, [dimensions, state, onVMSelect, migrationHistory, selectedVMs]);

  // Migration helper functions
  const getSelectedVMDetails = () => {
    const selectedDetails: Array<{vm: any, cluster: any, host: any}> = [];
    
    state?.clusters?.forEach((cluster: any) => {
      cluster.hosts?.forEach((hostData: any) => {
        hostData.vms?.forEach((vm: any) => {
          if (selectedVMs.has(vm.id)) {
            selectedDetails.push({
              vm,
              cluster,
              host: hostData.host
            });
          }
        });
      });
    });
    
    return selectedDetails;
  };

  const getAvailableClusters = () => {
    return state?.clusters?.filter((cluster: any) => cluster.isVisible) || [];
  };

  const performMigration = (targetClusterName: string) => {
    const selectedDetails = getSelectedVMDetails();
    const newMigrations = selectedDetails.map((detail) => ({
      id: `migration_${Date.now()}_${detail.vm.id}`,
      vmId: detail.vm.id,
      vmName: detail.vm.name,
      sourceCluster: detail.cluster.name,
      targetCluster: targetClusterName,
      timestamp: new Date()
    }));

    setMigrationHistory(prev => [...prev, ...newMigrations]);
    setSelectedVMs(new Set());
    
    // Here you would update the actual state to move VMs between clusters
    // For now, we'll just track the migration visually
  };

  const generateMigrationReport = () => {
    if (migrationHistory.length === 0) {
      alert('No migrations to report');
      return;
    }

    const report = migrationHistory.map(migration => 
      `${migration.timestamp.toLocaleString()}: ${migration.vmName} migrated from ${migration.sourceCluster} to ${migration.targetCluster}`
    ).join('\n');

    // Create downloadable report
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vm-migration-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}
    >
      {/* Table Headers - Fixed above the visualization */}
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 100,
        paddingLeft: '20px', // Only left padding to align with margin.left
        paddingRight: '0px'   // No right padding since VM column extends
      }}>
        {/* Cluster Header - matches clusterWidth (240px) */}
        <div style={{
          width: '240px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          margin: '8px 2px',
          boxSizing: 'border-box'
        }}>
          <div 
            style={{ width: '24px', height: '24px', marginRight: '12px' }}
            dangerouslySetInnerHTML={{ __html: createClusterIcon(24) }}
          />
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#8b5cf6',
              fontFamily: 'Segoe UI, system-ui, sans-serif'
            }}>
              Clusters
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'Segoe UI, system-ui, sans-serif'
            }}>
              Storage groups
            </div>
          </div>
        </div>

        {/* Host Header - matches hostWidth (150px) */}
        <div style={{
          width: '150px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          margin: '8px 2px',
          boxSizing: 'border-box'
        }}>
          <div 
            style={{ width: '24px', height: '24px', marginRight: '12px' }}
            dangerouslySetInnerHTML={{ __html: createHostIcon(24) }}
          />
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#8b5cf6',
              fontFamily: 'Segoe UI, system-ui, sans-serif'
            }}>
              Hosts
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'Segoe UI, system-ui, sans-serif'
            }}>
              Physical servers
            </div>
          </div>
        </div>

        {/* VM Header - takes remaining space like vmWidth calculation */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '8px',
          margin: '8px 2px',
          marginRight: '20px', // Right margin to match container padding
          boxSizing: 'border-box'
        }}>
          <div 
            style={{ width: '24px', height: '24px', marginRight: '12px' }}
            dangerouslySetInnerHTML={{ __html: createVMIcon(24) }}
          />
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#8b5cf6',
              fontFamily: 'Segoe UI, system-ui, sans-serif'
            }}>
              Virtual Machines
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'Segoe UI, system-ui, sans-serif'
            }}>
              VM workloads
            </div>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="calc(100% - 60px)"
        style={{
          display: 'block',
          fontFamily: 'Segoe UI, system-ui, sans-serif'
        }}
      />
      
      {/* Migration Controls Panel */}
      {selectedVMs.size > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minWidth: '280px',
          zIndex: 1000
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#374151'
          }}>
            Selected VMs ({selectedVMs.size})
          </div>
          
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            {getSelectedVMDetails().map(detail => detail.vm.name).join(', ')}
          </div>
          
          <div style={{
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#374151'
          }}>
            Migrate to cluster:
          </div>
          
          <select 
            id="target-cluster"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              marginBottom: '12px',
              fontSize: '12px'
            }}
          >
            <option value="">Select target cluster...</option>
            {getAvailableClusters().map((cluster: any) => (
              <option key={cluster.name} value={cluster.name}>
                {cluster.name}
              </option>
            ))}
          </select>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const select = document.getElementById('target-cluster') as HTMLSelectElement;
                if (select?.value) {
                  performMigration(select.value);
                } else {
                  alert('Please select a target cluster');
                }
              }}
              style={{
                flex: 1,
                padding: '9px 18px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                height: '42px',
                minWidth: '80px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Poppins', system-ui, sans-serif"
              }}
            >
              Migrate
            </button>
            
            <button
              onClick={() => setSelectedVMs(new Set())}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Migration Report Button */}
      {migrationHistory.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={generateMigrationReport}
            style={{
              padding: '10px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Download Migration Report ({migrationHistory.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CapacityCanvas;