import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Text, 
  Title2, 
  makeStyles,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Label
} from '@fluentui/react-components';
import { DesignTokens } from '../styles/designSystem';
import { CapacityCanvas } from '../components/CapacityVisualizer/CapacityCanvas';
import { CapacityControlPanel } from '../components/CapacityVisualizer/CapacityControlPanel';
import { CapacityTooltip } from '../components/CapacityVisualizer/CapacityTooltip';
import {
  VisualizerState,
  CapacityView,
  OvercommitmentRatios,
  VMData,
  HostData,
  ClusterData,
  VisualizerAction,
  TooltipData
} from '../types/capacityVisualizer';
import { v4 as uuidv4 } from 'uuid';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: '600px',
    fontFamily: DesignTokens.typography.fontFamily,
    gap: '24px',
    padding: '24px'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px'
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: '24px',
    minHeight: 0
  },
  controlPanel: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  canvasSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '600px'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    minHeight: '600px'
  },
  clusterPopup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    ...DesignTokens.components.standardContentCard,
    minWidth: '350px',
    maxWidth: '400px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
    backdropFilter: 'blur(4px)'
  },
  popupHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: DesignTokens.colors.textPrimary,
    marginBottom: '8px'
  },
  popupActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px'
  }
});

// Mock data for demonstration - Large Production Cluster (6 hosts, 100 VMs) and Small Dev Cluster (2 hosts, 10 VMs)
const createMockData = (): ClusterData[] => {
  const clusters: ClusterData[] = [];
  
  // Production Cluster - 6 hosts with ~17 VMs each (100 total VMs)
  const productionHosts = [];
  const vmsPerProductionHost = [17, 17, 17, 17, 16, 16]; // Total = 100 VMs
  
  for (let i = 0; i < 6; i++) {
    const hostVms = [];
    const vmCount = vmsPerProductionHost[i];
    
    for (let j = 0; j < vmCount; j++) {
      hostVms.push({
        id: `vm-prod-${i}-${j}`,
        name: `PROD-VM-${String(i + 1).padStart(2, '0')}-${String(j + 1).padStart(2, '0')}`,
        allocatedVCPUs: Math.floor(Math.random() * 8) + 2, // 2-9 vCPUs
        allocatedRAMGB: Math.floor(Math.random() * 32) + 8, // 8-40 GB RAM
        provisonedStorageGB: Math.floor(Math.random() * 500) + 100, // 100-600 GB storage
        hostId: `host-prod-${i + 1}`,
        clusterId: 'cluster-production',
        isLocked: Math.random() < 0.1 // 10% chance of being locked
      });
    }
    
    productionHosts.push({
      id: `host-prod-${i + 1}`,
      name: `ESX-PROD-${String(i + 1).padStart(2, '0')}`,
      clusterId: 'cluster-production',
      totalCores: 48,
      totalRAMGB: 512,
      totalStorageGB: 4000,
      hardwareDetails: {
        cpuModel: 'Intel Xeon Gold 6248R',
        socketCount: 2,
        coresPerSocket: 24,
        ramType: 'DDR4-3200',
        storageType: 'NVMe SSD'
      },
      vms: hostVms
    });
  }
  
  clusters.push({
    id: 'cluster-production',
    name: 'Production Cluster (6 Hosts)',
    isVisible: true,
    hosts: productionHosts
  });
  
  // Development Cluster - 2 hosts with 5 VMs each (10 total VMs)
  const devHosts = [];
  for (let i = 0; i < 2; i++) {
    const hostVms = [];
    
    for (let j = 0; j < 5; j++) {
      hostVms.push({
        id: `vm-dev-${i}-${j}`,
        name: `DEV-VM-${String(i + 1).padStart(2, '0')}-${String(j + 1).padStart(2, '0')}`,
        allocatedVCPUs: Math.floor(Math.random() * 4) + 1, // 1-4 vCPUs
        allocatedRAMGB: Math.floor(Math.random() * 16) + 4, // 4-20 GB RAM
        provisonedStorageGB: Math.floor(Math.random() * 200) + 50, // 50-250 GB storage
        hostId: `host-dev-${i + 1}`,
        clusterId: 'cluster-development',
        isLocked: false
      });
    }
    
    devHosts.push({
      id: `host-dev-${i + 1}`,
      name: `ESX-DEV-${String(i + 1).padStart(2, '0')}`,
      clusterId: 'cluster-development',
      totalCores: 24,
      totalRAMGB: 256,
      totalStorageGB: 2000,
      hardwareDetails: {
        cpuModel: 'Intel Xeon Silver 4314',
        socketCount: 2,
        coresPerSocket: 12,
        ramType: 'DDR4-2933',
        storageType: 'SATA SSD'
      },
      vms: hostVms
    });
  }
  
  clusters.push({
    id: 'cluster-development',
    name: 'Development Cluster (2 Hosts)',
    isVisible: true,
    hosts: devHosts
  });
  
  return clusters;
};

export const CapacityVisualizerView: React.FC = () => {
  const styles = useStyles();

  // Main state
  const [state, setState] = useState<VisualizerState>({
    clusters: createMockData(),
    overcommitmentRatios: { cpu: 3.0, memory: 1.5 },
    activeView: 'cpu',
    selectedVMs: [],
    dragState: {
      isDragging: false,
      draggedVMs: [],
      dragStartPosition: { x: 0, y: 0 }
    },
    undoStack: [],
    redoStack: []
  });

  // UI state
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isAddClusterDialogOpen, setIsAddClusterDialogOpen] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');

  // Calculate total stats
  const totalStats = useMemo(() => {
    const visibleClusters = state.clusters.filter(c => c.isVisible);
    const totalVMs = visibleClusters.reduce((sum, c) => 
      sum + c.hosts.reduce((hostSum, h) => hostSum + h.vms.length, 0), 0);
    const totalHosts = visibleClusters.reduce((sum, c) => sum + c.hosts.length, 0);
    const totalClusters = visibleClusters.length;

    // Calculate average utilization based on current view
    let totalCapacity = 0;
    let totalUsed = 0;

    visibleClusters.forEach(cluster => {
      cluster.hosts.forEach(host => {
        let hostCapacity = 0;
        let hostUsed = 0;

        switch (state.activeView) {
          case 'cpu':
            hostCapacity = host.totalCores * state.overcommitmentRatios.cpu;
            hostUsed = host.vms.reduce((sum, vm) => sum + vm.allocatedVCPUs, 0);
            break;
          case 'memory':
            hostCapacity = host.totalRAMGB * state.overcommitmentRatios.memory;
            hostUsed = host.vms.reduce((sum, vm) => sum + vm.allocatedRAMGB, 0);
            break;
          case 'storage':
            hostCapacity = host.totalStorageGB;
            hostUsed = host.vms.reduce((sum, vm) => sum + vm.provisonedStorageGB, 0);
            break;
        }

        totalCapacity += hostCapacity;
        totalUsed += hostUsed;
      });
    });

    const avgUtilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

    return { totalVMs, totalHosts, totalClusters, avgUtilization };
  }, [state.clusters, state.activeView, state.overcommitmentRatios]);

  // Action creators and state management
  const createAction = useCallback((type: VisualizerAction['type'], payload: any): VisualizerAction => ({
    type,
    payload,
    timestamp: Date.now(),
    id: uuidv4()
  }), []);

  const applyAction = useCallback((action: VisualizerAction) => {
    setState(prevState => {
      let newState = { ...prevState };

      switch (action.type) {
        case 'MOVE_VMS':
          const { vmIds, targetHostId } = action.payload;
          newState.clusters = newState.clusters.map(cluster => ({
            ...cluster,
            hosts: cluster.hosts.map(host => {
              // Remove VMs from source hosts
              if (host.vms.some(vm => vmIds.includes(vm.id))) {
                return {
                  ...host,
                  vms: host.vms.filter(vm => !vmIds.includes(vm.id))
                };
              }
              // Add VMs to target host
              if (host.id === targetHostId) {
                const vmsToMove = prevState.clusters
                  .flatMap(c => c.hosts)
                  .flatMap(h => h.vms)
                  .filter(vm => vmIds.includes(vm.id))
                  .map(vm => ({
                    ...vm,
                    hostId: targetHostId,
                    clusterId: host.clusterId
                  }));
                return {
                  ...host,
                  vms: [...host.vms, ...vmsToMove]
                };
              }
              return host;
            })
          }));
          break;

        case 'UPDATE_OC_RATIOS':
          newState.overcommitmentRatios = action.payload;
          break;

        case 'TOGGLE_CLUSTER_VISIBILITY':
          newState.clusters = newState.clusters.map(cluster =>
            cluster.id === action.payload.clusterId
              ? { ...cluster, isVisible: !cluster.isVisible }
              : cluster
          );
          break;

        case 'ADD_CLUSTER':
          const newCluster: ClusterData = {
            id: `cluster-${Date.now()}`,
            name: action.payload.name,
            isVisible: true,
            hosts: []
          };
          newState.clusters = [...newState.clusters, newCluster];
          break;

        case 'LOCK_VM':
        case 'UNLOCK_VM':
          const isLocking = action.type === 'LOCK_VM';
          newState.clusters = newState.clusters.map(cluster => ({
            ...cluster,
            hosts: cluster.hosts.map(host => ({
              ...host,
              vms: host.vms.map(vm =>
                action.payload.vmIds.includes(vm.id)
                  ? { ...vm, isLocked: isLocking }
                  : vm
              )
            }))
          }));
          break;
      }

      // Add to undo stack
      newState.undoStack = [...prevState.undoStack, action];
      newState.redoStack = []; // Clear redo stack when new action is performed

      return newState;
    });
  }, []);

  // Event handlers
  const handleViewChange = useCallback((view: CapacityView) => {
    setState(prev => ({ ...prev, activeView: view }));
  }, []);

  const handleOCRatioChange = useCallback((ratios: OvercommitmentRatios) => {
    const action = createAction('UPDATE_OC_RATIOS', ratios);
    applyAction(action);
  }, [createAction, applyAction]);

  const handleVMMove = useCallback((vmIds: string[], targetHostId: string) => {
    const action = createAction('MOVE_VMS', { vmIds, targetHostId });
    applyAction(action);
  }, [createAction, applyAction]);

  const handleVMSelect = useCallback((vmIds: string[], isMultiSelect: boolean) => {
    setState(prev => ({
      ...prev,
      selectedVMs: isMultiSelect 
        ? [...new Set([...prev.selectedVMs, ...vmIds])]
        : vmIds
    }));
  }, []);

  const handleClusterToggle = useCallback((clusterId: string) => {
    const action = createAction('TOGGLE_CLUSTER_VISIBILITY', { clusterId });
    applyAction(action);
  }, [createAction, applyAction]);

  const handleUndo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;
      
      const actionToUndo = prev.undoStack[prev.undoStack.length - 1];
      const newUndoStack = prev.undoStack.slice(0, -1);
      const newRedoStack = [...prev.redoStack, actionToUndo];

      // This is a simplified undo - in a real implementation, you'd reverse the action
      // For now, we'll just manage the stacks
      return {
        ...prev,
        undoStack: newUndoStack,
        redoStack: newRedoStack
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev;
      
      const actionToRedo = prev.redoStack[prev.redoStack.length - 1];
      const newRedoStack = prev.redoStack.slice(0, -1);
      
      // Apply the action again
      applyAction(actionToRedo);
      
      return {
        ...prev,
        redoStack: newRedoStack
      };
    });
  }, [applyAction]);

  const handleAddCluster = useCallback(() => {
    if (newClusterName.trim()) {
      const action = createAction('ADD_CLUSTER', { name: newClusterName.trim() });
      applyAction(action);
      setNewClusterName('');
      setIsAddClusterDialogOpen(false);
    }
  }, [newClusterName, createAction, applyAction]);

  const handleVMLock = useCallback((vmIds: string[]) => {
    const action = createAction('LOCK_VM', { vmIds });
    applyAction(action);
  }, [createAction, applyAction]);

  const handleVMUnlock = useCallback((vmIds: string[]) => {
    const action = createAction('UNLOCK_VM', { vmIds });
    applyAction(action);
  }, [createAction, applyAction]);

  const handleClearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedVMs: [] }));
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Title2 style={DesignTokens.components.standardTitle}>
          Interactive Capacity Visualizer
        </Title2>
        <Text style={DesignTokens.components.standardSubtitle}>
          Simulate VM workload migrations and visualize capacity utilization in real-time
        </Text>
      </div>

      {/* Content Area - Canvas on left, Controls on right */}
      <div className={styles.contentArea}>
        {/* Canvas Section - takes most space on the left */}
        <div className={styles.canvasSection}>
          <div className={styles.canvasContainer}>
            <CapacityCanvas
              state={state}
              onVMMove={handleVMMove}
              onVMSelect={handleVMSelect}
              onTooltipUpdate={setTooltip}
            />
          </div>
        </div>

        {/* Control Panel - compact sidebar on the right */}
        <div className={styles.controlPanel}>
          <CapacityControlPanel
            state={state}
            onViewChange={handleViewChange}
            onOCRatioChange={handleOCRatioChange}
            onClusterToggle={handleClusterToggle}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onAddCluster={() => setIsAddClusterDialogOpen(true)}
            onVMLock={handleVMLock}
            onVMUnlock={handleVMUnlock}
            onClearSelection={handleClearSelection}
            totalStats={totalStats}
          />
        </div>
      </div>

      {/* Tooltip */}
      <CapacityTooltip data={tooltip} />

      {/* Add Cluster Popup */}
      {isAddClusterDialogOpen && (
        <>
          <div 
            className={styles.popupOverlay} 
            onClick={() => setIsAddClusterDialogOpen(false)}
          />
          <div className={styles.clusterPopup}>
            <div className={styles.popupHeader}>Add New Cluster</div>
            <Field>
              <Label>Cluster Name</Label>
              <Input
                value={newClusterName}
                onChange={(_, data) => setNewClusterName(data.value)}
                placeholder="Enter cluster name..."
                autoFocus
              />
            </Field>
            <div className={styles.popupActions}>
              <Button 
                style={DesignTokens.components.button.secondary}
                onClick={() => setIsAddClusterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                style={DesignTokens.components.button.primary}
                onClick={handleAddCluster}
                disabled={!newClusterName.trim()}
              >
                Add Cluster
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};