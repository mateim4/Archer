/**
 * Shared Capacity Calculation Utilities
 * 
 * Single source of truth for capacity and utilization calculations.
 * Used by:
 * - Migration Wizard Step 3 (Capacity Analysis)
 * - Standalone Capacity Visualizer View
 * - Capacity Visualizer Tab in Project Details
 * 
 * This eliminates discrepancies between wizard and visualizer calculations.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface VMResourceRequirements {
  id: string;
  name: string;
  cpus: number;
  memoryMB: number;
  provisionedMB: number;
  cpuGhz?: number; // Optional: if known, otherwise use default
}

export interface ClusterCapacity {
  id: string;
  name: string;
  cpuGhz: number;
  totalCores: number;
  memoryGB: number;
  storageTB: number;
  cpuOvercommit?: number; // Default 1.0
  memoryOvercommit?: number; // Default 1.0
  storageOvercommit?: number; // Default 1.0
}

export interface CapacityMetrics {
  cpu: ResourceMetrics;
  memory: ResourceMetrics;
  storage: ResourceMetrics;
  overallUtilization: number; // Weighted average
}

export interface ResourceMetrics {
  totalCapacity: number;
  effectiveCapacity: number; // With overcommit applied
  allocated: number;
  available: number;
  utilization: number; // Percentage (0-100)
  overcommitRatio: number;
}

export interface BottleneckWarning {
  severity: 'info' | 'warning' | 'critical';
  resource: 'CPU' | 'Memory' | 'Storage' | 'Configuration';
  message: string;
  recommendation: string;
  utilizationPercentage?: number;
}

export interface CapacityAnalysisResult {
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  bottlenecks: BottleneckWarning[];
  overallStatus: 'healthy' | 'moderate' | 'high' | 'critical' | 'error';
  metrics: CapacityMetrics;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CPU_GHZ = 2.5; // Average CPU speed if not specified
const UTILIZATION_THRESHOLDS = {
  healthy: 70,
  moderate: 80,
  high: 90,
  critical: 95,
} as const;

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate total cluster capacity across all resources
 */
export const calculateTotalCapacity = (clusters: ClusterCapacity[]): CapacityMetrics => {
  let totalCPUGHz = 0;
  let totalMemoryGB = 0;
  let totalStorageTB = 0;
  let effectiveCPU = 0;
  let effectiveMemory = 0;
  let effectiveStorage = 0;

  clusters.forEach(cluster => {
    const cpuCapacity = cluster.cpuGhz * cluster.totalCores;
    const memoryCapacity = cluster.memoryGB;
    const storageCapacity = cluster.storageTB;

    totalCPUGHz += cpuCapacity;
    totalMemoryGB += memoryCapacity;
    totalStorageTB += storageCapacity;

    effectiveCPU += cpuCapacity * (cluster.cpuOvercommit || 1.0);
    effectiveMemory += memoryCapacity * (cluster.memoryOvercommit || 1.0);
    effectiveStorage += storageCapacity * (cluster.storageOvercommit || 1.0);
  });

  return {
    cpu: {
      totalCapacity: totalCPUGHz,
      effectiveCapacity: effectiveCPU,
      allocated: 0, // Will be set by calculateUtilization
      available: effectiveCPU,
      utilization: 0,
      overcommitRatio: effectiveCPU / (totalCPUGHz || 1),
    },
    memory: {
      totalCapacity: totalMemoryGB,
      effectiveCapacity: effectiveMemory,
      allocated: 0,
      available: effectiveMemory,
      utilization: 0,
      overcommitRatio: effectiveMemory / (totalMemoryGB || 1),
    },
    storage: {
      totalCapacity: totalStorageTB,
      effectiveCapacity: effectiveStorage,
      allocated: 0,
      available: effectiveStorage,
      utilization: 0,
      overcommitRatio: effectiveStorage / (totalStorageTB || 1),
    },
    overallUtilization: 0,
  };
};

/**
 * Calculate VM resource requirements totals
 */
export const calculateVMRequirements = (vms: VMResourceRequirements[]): {
  totalCPUGHz: number;
  totalMemoryGB: number;
  totalStorageTB: number;
} => {
  let totalCPUGHz = 0;
  let totalMemoryGB = 0;
  let totalStorageTB = 0;

  vms.forEach(vm => {
    const cpuGhz = vm.cpuGhz || DEFAULT_CPU_GHZ;
    totalCPUGHz += vm.cpus * cpuGhz;
    totalMemoryGB += vm.memoryMB / 1024;
    totalStorageTB += vm.provisionedMB / 1024 / 1024;
  });

  return {
    totalCPUGHz,
    totalMemoryGB,
    totalStorageTB,
  };
};

/**
 * Calculate resource utilization across all clusters and VMs
 * 
 * This is the SINGLE SOURCE OF TRUTH for utilization calculations.
 * Must be used by both wizard and visualizer to ensure consistency.
 */
export const calculateUtilization = (
  vms: VMResourceRequirements[],
  clusters: ClusterCapacity[]
): CapacityAnalysisResult => {
  // Handle edge cases
  if (clusters.length === 0) {
    return {
      cpuUtilization: 0,
      memoryUtilization: 0,
      storageUtilization: 0,
      bottlenecks: [{
        severity: 'critical',
        resource: 'Configuration',
        message: 'No clusters configured',
        recommendation: 'Create at least one destination cluster to analyze capacity',
      }],
      overallStatus: 'error',
      metrics: calculateTotalCapacity([]),
    };
  }

  if (vms.length === 0) {
    return {
      cpuUtilization: 0,
      memoryUtilization: 0,
      storageUtilization: 0,
      bottlenecks: [{
        severity: 'info',
        resource: 'Configuration',
        message: 'No VMs selected for migration',
        recommendation: 'Select VMs in Step 1 to see capacity analysis',
      }],
      overallStatus: 'healthy',
      metrics: calculateTotalCapacity(clusters),
    };
  }

  // Calculate total capacity
  const metrics = calculateTotalCapacity(clusters);
  const requirements = calculateVMRequirements(vms);

  // Calculate utilization percentages
  const cpuUtilization = metrics.cpu.effectiveCapacity > 0
    ? (requirements.totalCPUGHz / metrics.cpu.effectiveCapacity) * 100
    : 0;

  const memoryUtilization = metrics.memory.effectiveCapacity > 0
    ? (requirements.totalMemoryGB / metrics.memory.effectiveCapacity) * 100
    : 0;

  const storageUtilization = metrics.storage.effectiveCapacity > 0
    ? (requirements.totalStorageTB / metrics.storage.effectiveCapacity) * 100
    : 0;

  // Update metrics with allocated resources
  metrics.cpu.allocated = requirements.totalCPUGHz;
  metrics.cpu.available = metrics.cpu.effectiveCapacity - requirements.totalCPUGHz;
  metrics.cpu.utilization = cpuUtilization;

  metrics.memory.allocated = requirements.totalMemoryGB;
  metrics.memory.available = metrics.memory.effectiveCapacity - requirements.totalMemoryGB;
  metrics.memory.utilization = memoryUtilization;

  metrics.storage.allocated = requirements.totalStorageTB;
  metrics.storage.available = metrics.storage.effectiveCapacity - requirements.totalStorageTB;
  metrics.storage.utilization = storageUtilization;

  // Calculate weighted overall utilization (CPU weighted more heavily)
  metrics.overallUtilization = 
    (cpuUtilization * 0.4) + 
    (memoryUtilization * 0.4) + 
    (storageUtilization * 0.2);

  // Detect bottlenecks
  const bottlenecks = detectBottlenecks(cpuUtilization, memoryUtilization, storageUtilization);

  // Determine overall status
  const overallStatus = determineOverallStatus(cpuUtilization, memoryUtilization, storageUtilization);

  return {
    cpuUtilization,
    memoryUtilization,
    storageUtilization,
    bottlenecks,
    overallStatus,
    metrics,
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Detect capacity bottlenecks based on utilization thresholds
 */
export const detectBottlenecks = (
  cpuUtil: number,
  memoryUtil: number,
  storageUtil: number
): BottleneckWarning[] => {
  const bottlenecks: BottleneckWarning[] = [];

  // CPU bottleneck detection
  if (cpuUtil >= UTILIZATION_THRESHOLDS.critical) {
    bottlenecks.push({
      severity: 'critical',
      resource: 'CPU',
      message: 'Critical CPU capacity shortage',
      recommendation: 'Add more CPU cores or significantly reduce overcommitment ratio. Current configuration cannot safely handle the workload.',
      utilizationPercentage: cpuUtil,
    });
  } else if (cpuUtil >= UTILIZATION_THRESHOLDS.high) {
    bottlenecks.push({
      severity: 'critical',
      resource: 'CPU',
      message: 'Cluster may experience severe CPU constraints',
      recommendation: 'Add more CPU cores or reduce overcommitment ratio to avoid performance degradation.',
      utilizationPercentage: cpuUtil,
    });
  } else if (cpuUtil >= UTILIZATION_THRESHOLDS.moderate) {
    bottlenecks.push({
      severity: 'warning',
      resource: 'CPU',
      message: 'Cluster approaching CPU capacity limits',
      recommendation: 'Consider adding CPU cores for headroom or reducing overcommitment ratio.',
      utilizationPercentage: cpuUtil,
    });
  }

  // Memory bottleneck detection
  if (memoryUtil >= UTILIZATION_THRESHOLDS.critical) {
    bottlenecks.push({
      severity: 'critical',
      resource: 'Memory',
      message: 'Critical memory capacity shortage',
      recommendation: 'Add more memory or significantly reduce overcommitment ratio. VMs may fail to start.',
      utilizationPercentage: memoryUtil,
    });
  } else if (memoryUtil >= UTILIZATION_THRESHOLDS.high) {
    bottlenecks.push({
      severity: 'critical',
      resource: 'Memory',
      message: 'Cluster may experience severe memory constraints',
      recommendation: 'Add more memory or reduce overcommitment ratio to prevent swapping and performance issues.',
      utilizationPercentage: memoryUtil,
    });
  } else if (memoryUtil >= UTILIZATION_THRESHOLDS.moderate) {
    bottlenecks.push({
      severity: 'warning',
      resource: 'Memory',
      message: 'Cluster approaching memory capacity limits',
      recommendation: 'Consider adding memory for headroom or reducing overcommitment ratio.',
      utilizationPercentage: memoryUtil,
    });
  }

  // Storage bottleneck detection
  if (storageUtil >= UTILIZATION_THRESHOLDS.critical) {
    bottlenecks.push({
      severity: 'critical',
      resource: 'Storage',
      message: 'Critical storage capacity shortage',
      recommendation: 'Add more storage immediately. VMs may not fit or fail to provision.',
      utilizationPercentage: storageUtil,
    });
  } else if (storageUtil >= UTILIZATION_THRESHOLDS.high) {
    bottlenecks.push({
      severity: 'critical',
      resource: 'Storage',
      message: 'Cluster may experience storage constraints',
      recommendation: 'Add more storage capacity or implement thin provisioning to maximize utilization.',
      utilizationPercentage: storageUtil,
    });
  } else if (storageUtil >= UTILIZATION_THRESHOLDS.moderate) {
    bottlenecks.push({
      severity: 'warning',
      resource: 'Storage',
      message: 'Cluster approaching storage capacity limits',
      recommendation: 'Plan for additional storage capacity or implement data deduplication.',
      utilizationPercentage: storageUtil,
    });
  }

  return bottlenecks;
};

/**
 * Determine overall capacity status based on utilization
 */
export const determineOverallStatus = (
  cpuUtil: number,
  memoryUtil: number,
  storageUtil: number
): 'healthy' | 'moderate' | 'high' | 'critical' => {
  const maxUtilization = Math.max(cpuUtil, memoryUtil, storageUtil);

  if (maxUtilization >= UTILIZATION_THRESHOLDS.high) {
    return 'critical';
  } else if (maxUtilization >= UTILIZATION_THRESHOLDS.moderate) {
    return 'high';
  } else if (maxUtilization >= UTILIZATION_THRESHOLDS.healthy) {
    return 'moderate';
  } else {
    return 'healthy';
  }
};

/**
 * Get color for utilization percentage (for UI consistency)
 */
export const getUtilizationColor = (utilization: number): string => {
  if (utilization >= UTILIZATION_THRESHOLDS.high) {
    return '#ef4444'; // Red
  } else if (utilization >= UTILIZATION_THRESHOLDS.moderate) {
    return '#f97316'; // Orange
  } else if (utilization >= UTILIZATION_THRESHOLDS.healthy) {
    return '#f59e0b'; // Yellow
  } else {
    return '#10b981'; // Green
  }
};

/**
 * Get label for utilization status
 */
export const getUtilizationLabel = (utilization: number): string => {
  if (utilization >= UTILIZATION_THRESHOLDS.high) {
    return 'Critical';
  } else if (utilization >= UTILIZATION_THRESHOLDS.moderate) {
    return 'High';
  } else if (utilization >= UTILIZATION_THRESHOLDS.healthy) {
    return 'Moderate';
  } else {
    return 'Healthy';
  }
};

/**
 * Format resource value with appropriate units
 */
export const formatResourceValue = (
  value: number,
  resourceType: 'cpu' | 'memory' | 'storage'
): string => {
  switch (resourceType) {
    case 'cpu':
      return `${value.toFixed(1)} GHz`;
    case 'memory':
      return `${value.toFixed(1)} GB`;
    case 'storage':
      return `${value.toFixed(2)} TB`;
    default:
      return value.toFixed(2);
  }
};

/**
 * Calculate capacity headroom (available capacity percentage)
 */
export const calculateHeadroom = (metrics: CapacityMetrics): {
  cpu: number;
  memory: number;
  storage: number;
} => {
  return {
    cpu: 100 - metrics.cpu.utilization,
    memory: 100 - metrics.memory.utilization,
    storage: 100 - metrics.storage.utilization,
  };
};

/**
 * Validate that clusters can accommodate VMs
 */
export const validateCapacity = (
  vms: VMResourceRequirements[],
  clusters: ClusterCapacity[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (clusters.length === 0) {
    errors.push('No destination clusters configured');
    return { isValid: false, errors, warnings };
  }

  if (vms.length === 0) {
    warnings.push('No VMs selected for migration');
  }

  const analysis = calculateUtilization(vms, clusters);

  if (analysis.cpuUtilization > 100) {
    errors.push(`CPU capacity insufficient: ${analysis.cpuUtilization.toFixed(1)}% utilization (over 100%)`);
  }

  if (analysis.memoryUtilization > 100) {
    errors.push(`Memory capacity insufficient: ${analysis.memoryUtilization.toFixed(1)}% utilization (over 100%)`);
  }

  if (analysis.storageUtilization > 100) {
    errors.push(`Storage capacity insufficient: ${analysis.storageUtilization.toFixed(1)}% utilization (over 100%)`);
  }

  // Add warnings for high utilization (even if < 100%)
  if (analysis.cpuUtilization >= UTILIZATION_THRESHOLDS.high && analysis.cpuUtilization <= 100) {
    warnings.push(`CPU utilization very high: ${analysis.cpuUtilization.toFixed(1)}% (recommended < 90%)`);
  }

  if (analysis.memoryUtilization >= UTILIZATION_THRESHOLDS.high && analysis.memoryUtilization <= 100) {
    warnings.push(`Memory utilization very high: ${analysis.memoryUtilization.toFixed(1)}% (recommended < 90%)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
