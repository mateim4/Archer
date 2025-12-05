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
  Label,
  Caption1,
  Badge
} from '@fluentui/react-components';
import {
  ArrowUndoRegular,
  ArrowRedoRegular,
  LockClosedRegular,
  LockOpenRegular,
  DismissRegular,
  EyeRegular,
  EyeOffRegular,
  AddRegular
} from '@fluentui/react-icons';
import { DesignTokens } from '../styles/designSystem';
import { CapacityCanvas } from '../components/CapacityVisualizer/CapacityCanvas';
// import { CapacityControlPanel } from '../components/CapacityVisualizer/CapacityControlPanel'; // Removed - OC ratios now in search bar
import { CapacityTooltip } from '../components/CapacityVisualizer/CapacityTooltip';
import { MigrationPanel } from '../components/CapacityVisualizer/MigrationPanel';
import {
  VisualizerState,
  CapacityView,
  OvercommitmentRatios,
  VMData,
  HostData,
  ClusterData,
  VisualizerAction,
  TooltipData,
  VMMigration
} from '../types/capacityVisualizer';
import { v4 as uuidv4 } from 'uuid';

/**
 * CapacityVisualizerView - Interactive visualization component for infrastructure capacity planning
 * 
 * A comprehensive visualization tool that displays clusters, hosts, and VMs with multiple 
 * visualization modes and interactive features. This component is central to the capacity
 * planning workflow in LCM Designer.
 * 
 * Features:
 * - Multiple visualization modes (CPU, Memory, Storage)
 * - Interactive VM selection and migration planning
 * - Real-time capacity calculations with overcommit ratios
 * - Drag-and-drop VM migration between hosts
 * - Cluster-level resource aggregation and analysis
 * - Responsive design with glassmorphic UI elements
 * 
 * @example
 * ```tsx
 * <CapacityVisualizerView
 *   clusters={clusterData}
 *   selectedVMs={selectedVMSet}
 *   onVMSelect={(vmId, selected) => handleVMSelection(vmId, selected)}
 *   visualizationMode="cpu"
 *   isMigrationView={false}
 * />
 * ```
 * 
 * @param clusters - Array of cluster data with hosts and VMs
 * @param selectedVMs - Set of currently selected VM IDs
 * @param onVMSelect - Callback for VM selection changes
 * @param visualizationMode - Current visualization mode (cpu/memory/storage)
 * @param isMigrationView - Whether to show migration-specific UI
 */

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
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0
  },
  controlPanelRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  canvasSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
    width: '100%'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    minHeight: '400px',
    maxHeight: 'none',
    overflow: 'auto'
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
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  popupActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px'
  },
  selectionCount: {
    fontSize: '13px',
    fontWeight: 600,
    color: DesignTokens.colors.primary,
    letterSpacing: '0.02em'
  },
  selectionActions: {
    display: 'flex',
    gap: '8px'
  }
});

// Mock data for demonstration - Large Production Cluster (6 hosts, 100 VMs) and Small Dev Cluster (2 hosts, 10 VMs)
const createMockData = (): ClusterData[] => {
  const clusters: ClusterData[] = [];
  
  // Production Cluster - 6 hosts with 100 total vCores allocated across VMs
  const productionHosts = [];
  const vmsPerProductionHost = [17, 17, 17, 17, 16, 16]; // Total = 100 VMs
  const vCoresPerHost = [17, 16, 18, 15, 17, 17]; // Total = 100 vCores
  
  for (let i = 0; i < 6; i++) {
    const hostVms = [];
    const vmCount = vmsPerProductionHost[i];
    const totalHostVCores = vCoresPerHost[i];
    
    // Distribute vCores across VMs for this host
    const vCoreAllocations = [];
    let remainingVCores = totalHostVCores;
    
    for (let j = 0; j < vmCount - 1; j++) {
      const maxCores = Math.min(4, remainingVCores - (vmCount - j - 1)); // Leave at least 1 for each remaining VM
      const cores = Math.max(1, Math.floor(Math.random() * maxCores) + 1);
      vCoreAllocations.push(cores);
      remainingVCores -= cores;
    }
    vCoreAllocations.push(remainingVCores); // Last VM gets remaining cores
    
    for (let j = 0; j < vmCount; j++) {
      hostVms.push({
        id: `vm-prod-${i}-${j}`,
        name: `PROD-VM-${String(i + 1).padStart(2, '0')}-${String(j + 1).padStart(2, '0')}`,
        allocatedVCPUs: vCoreAllocations[j],
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
  
  // Development Cluster - 2 hosts with 24 total vCores allocated across VMs
  const devHosts = [];
  const devVCoresPerHost = [12, 12]; // Total = 24 vCores
  
  for (let i = 0; i < 2; i++) {
    const hostVms = [];
    const vmCount = 5;
    const totalHostVCores = devVCoresPerHost[i];
    
    // Distribute vCores across VMs for this host
    const vCoreAllocations = [];
    let remainingVCores = totalHostVCores;
    
    for (let j = 0; j < vmCount - 1; j++) {
      const maxCores = Math.min(4, remainingVCores - (vmCount - j - 1)); // Leave at least 1 for each remaining VM
      const cores = Math.max(1, Math.floor(Math.random() * maxCores) + 1);
      vCoreAllocations.push(cores);
      remainingVCores -= cores;
    }
    vCoreAllocations.push(remainingVCores); // Last VM gets remaining cores
    
    for (let j = 0; j < 5; j++) {
      // For DEV-VM-01-04, set cores=3 and cpus=3 for total of 9 vCores as mentioned
      const isSpecialVM = i === 0 && j === 3; // Fourth VM of first host
      hostVms.push({
        id: `vm-dev-${i}-${j}`,
        name: `DEV-VM-${String(i + 1).padStart(2, '0')}-${String(j + 1).padStart(2, '0')}`,
        cores: isSpecialVM ? 3 : (j === 4 ? 1 : 2), // DEV-VM-01-04 gets 3 cores, last VM gets 1, others get 2
        cpus: isSpecialVM ? 3 : (j === 4 ? 1 : 2), // DEV-VM-01-04 gets 3 CPUs, last VM gets 1x1, others get 2x2
        allocatedVCPUs: isSpecialVM ? 9 : vCoreAllocations[j], // Override for special VM
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

interface CapacityVisualizerViewProps {
  embedded?: boolean;
}

export const CapacityVisualizerView: React.FC<CapacityVisualizerViewProps> = ({ embedded = false }) => {
  const styles = useStyles();

  // Load persisted state from localStorage or use defaults
  const loadPersistedState = (): VisualizerState => {
    try {
      const saved = localStorage.getItem('capacityVisualizer_migrationState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
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
          redoStack: [],
          migrationState: parsed.migrationState || {
            migrations: [],
            isModified: false,
            lastSaved: Date.now()
          }
        };
      }
    } catch (error) {
      console.error('Failed to load persisted migration state:', error);
    }
    
    return {
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
      redoStack: [],
      migrationState: {
        migrations: [],
        isModified: false,
        lastSaved: Date.now()
      }
    };
  };

  // Main state
  const [state, setState] = useState<VisualizerState>(loadPersistedState());

  // Auto-save migration state to localStorage
  useEffect(() => {
    if (state.migrationState.isModified) {
      try {
        localStorage.setItem('capacityVisualizer_migrationState', JSON.stringify({
          migrationState: {
            ...state.migrationState,
            lastSaved: Date.now(),
            isModified: false
          }
        }));
        setState(prev => ({
          ...prev,
          migrationState: {
            ...prev.migrationState,
            lastSaved: Date.now(),
            isModified: false
          }
        }));
      } catch (error) {
        console.error('Failed to persist migration state:', error);
      }
    }
  }, [state.migrationState]);

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
          
          // Find target host and cluster info
          let targetCluster: ClusterData | null = null;
          let targetHost: HostData | null = null;
          for (const cluster of prevState.clusters) {
            const host = cluster.hosts.find(h => h.id === targetHostId);
            if (host) {
              targetCluster = cluster;
              targetHost = host;
              break;
            }
          }
          
          // Track migrations
          const newMigrations: VMMigration[] = [];
          
          newState.clusters = newState.clusters.map(cluster => ({
            ...cluster,
            hosts: cluster.hosts.map(host => {
              // Remove VMs from source hosts and create migration records
              if (host.vms.some(vm => vmIds.includes(vm.id))) {
                const movingVMs = host.vms.filter(vm => vmIds.includes(vm.id));
                
                // Create migration records for each VM being moved
                movingVMs.forEach(vm => {
                  if (targetHost && targetCluster) {
                    newMigrations.push({
                      id: uuidv4(),
                      vmId: vm.id,
                      vmName: vm.name,
                      sourceClusterId: cluster.id,
                      sourceClusterName: cluster.name,
                      sourceHostId: host.id,
                      sourceHostName: host.name,
                      destinationClusterId: targetCluster.id,
                      destinationClusterName: targetCluster.name,
                      destinationHostId: targetHost.id,
                      destinationHostName: targetHost.name,
                      timestamp: Date.now(),
                      status: 'planned'
                    });
                  }
                });
                
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
          
          // Add new migrations to the state
          if (newMigrations.length > 0) {
            newState.migrationState = {
              migrations: [...prevState.migrationState.migrations, ...newMigrations],
              isModified: true,
              lastSaved: prevState.migrationState.lastSaved
            };
          }
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

  // Migration handlers
  const handleExportMigrationPlan = useCallback(() => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalMigrations: state.migrationState.migrations.length,
      migrations: state.migrationState.migrations.map(m => ({
        vmName: m.vmName,
        sourceCluster: m.sourceClusterName,
        sourceHost: m.sourceHostName,
        destinationCluster: m.destinationClusterName,
        destinationHost: m.destinationHostName,
        status: m.status,
        timestamp: new Date(m.timestamp).toISOString()
      })),
      summary: {
        byCluster: state.migrationState.migrations.reduce((acc, m) => {
          const key = `${m.sourceClusterName} → ${m.destinationClusterName}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `migration-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state.migrationState]);

  const handleResetMigrations = useCallback(() => {
    setState(prev => ({
      ...prev,
      clusters: createMockData(),
      migrationState: {
        migrations: [],
        isModified: true,
        lastSaved: prev.migrationState.lastSaved
      }
    }));
  }, []);

  const handleClearAllMigrations = useCallback(() => {
    setState(prev => ({
      ...prev,
      migrationState: {
        migrations: [],
        isModified: true,
        lastSaved: prev.migrationState.lastSaved
      }
    }));
  }, []);

  return (
    <div 
      className={styles.container} 
      data-testid="capacity-visualizer" 
      aria-label="Capacity Visualizer"
      style={embedded ? { padding: '24px', minHeight: '100%' } : undefined}
    >
      <h1 style={{position:'absolute', width:0, height:0, overflow:'hidden', clip:'rect(0 0 0 0)'}}>Capacity Visualizer</h1>
      {/* Header - hide when embedded since MonitoringView has its own header */}
      {!embedded && (
        <div className={styles.header}>
          <Title2 style={DesignTokens.components.standardTitle}>
            Interactive Capacity Visualizer
          </Title2>
          <Text style={DesignTokens.components.standardSubtitle}>
            Simulate VM workload migrations and visualize capacity utilization in real-time
          </Text>
        </div>
      )}

      {/* Canvas Section - takes full width below controls */}
      <div className={styles.canvasSection}>
        <div className={styles.canvasContainer}>
          <CapacityCanvas
            state={state}
            onVMMove={handleVMMove}
            onVMSelect={handleVMSelect}
            onTooltipUpdate={setTooltip}
            onClusterToggle={handleClusterToggle}
            onAddCluster={() => setIsAddClusterDialogOpen(true)}
          />
        </div>
      </div>

      {/* Migration Panel */}
      <MigrationPanel
        migrations={state.migrationState.migrations}
        onExport={handleExportMigrationPlan}
        onReset={handleResetMigrations}
        onClearAll={handleClearAllMigrations}
      />

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

export default CapacityVisualizerView;