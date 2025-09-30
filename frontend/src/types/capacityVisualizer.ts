// Types for the Interactive Capacity Visualizer Feature

export interface VMData {
  id: string;
  name: string;
  allocatedVCPUs: number;
  allocatedRAMGB: number;
  provisonedStorageGB: number;
  hostId: string;
  clusterId: string;
  isLocked: boolean;
  groupId?: string;
}

export interface HostData {
  id: string;
  name: string;
  clusterId: string;
  totalCores: number;
  totalRAMGB: number;
  totalStorageGB: number;
  vms: VMData[];
  hardwareDetails: {
    cpuModel: string;
    socketCount: number;
    coresPerSocket: number;
    ramType: string;
    storageType: string;
  };
}

export interface ClusterData {
  id: string;
  name: string;
  hosts: HostData[];
  isVisible: boolean;
}

export interface OvercommitmentRatios {
  cpu: number;
  memory: number;
}

export interface CapacityMetrics {
  cpu: {
    used: number;
    available: number;
    utilization: number;
  };
  memory: {
    used: number;
    available: number;
    utilization: number;
  };
  storage: {
    used: number;
    available: number;
    utilization: number;
  };
}

export type CapacityView = 'cpu' | 'memory' | 'storage' | 'bottleneck';

export interface DragState {
  isDragging: boolean;
  draggedVMs: VMData[];
  dragStartPosition: { x: number; y: number };
}

export interface FitFeedback {
  canFit: boolean;
  constraints: {
    cpu: boolean;
    memory: boolean;
    storage: boolean;
  };
}

export interface VisualizerAction {
  type: 'MOVE_VMS' | 'UPDATE_OC_RATIOS' | 'ADD_CLUSTER' | 'TOGGLE_CLUSTER_VISIBILITY' | 'LOCK_VM' | 'UNLOCK_VM';
  payload: any;
  timestamp: number;
  id: string;
}

export interface VisualizerState {
  clusters: ClusterData[];
  overcommitmentRatios: OvercommitmentRatios;
  activeView: CapacityView;
  selectedVMs: string[];
  dragState: DragState;
  undoStack: VisualizerAction[];
  redoStack: VisualizerAction[];
  migrationState: MigrationState;
}

export interface TreeMapNode {
  id: string;
  name: string;
  value: number;
  utilization: number;
  type: 'cluster' | 'host' | 'vm' | 'free-space';
  children?: TreeMapNode[];
  parent?: TreeMapNode;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  depth?: number;
  data?: VMData | HostData | ClusterData;
}

export interface TooltipData {
  x: number;
  y: number;
  content: {
    title: string;
    metrics: Array<{
      label: string;
      value: string;
      color?: string;
    }>;
  };
}

export interface VMMigration {
  id: string;
  vmId: string;
  vmName: string;
  sourceClusterId: string;
  sourceClusterName: string;
  sourceHostId: string;
  sourceHostName: string;
  destinationClusterId: string;
  destinationClusterName: string;
  destinationHostId: string;
  destinationHostName: string;
  timestamp: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
}

export interface MigrationState {
  migrations: VMMigration[];
  isModified: boolean;
  lastSaved: number;
}