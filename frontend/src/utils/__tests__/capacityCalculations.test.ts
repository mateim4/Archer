import { describe, it, expect } from 'vitest';
import {
  calculateUtilization,
  calculateTotalCapacity,
  calculateVMRequirements,
  detectBottlenecks,
  validateCapacity,
  getUtilizationColor,
  getUtilizationLabel,
  formatResourceValue,
  calculateHeadroom,
  determineOverallStatus,
  type VMResourceRequirements,
  type ClusterCapacity,
  type CapacityMetrics,
  type BottleneckWarning,
} from '../capacityCalculations';

describe('capacityCalculations', () => {
  describe('calculateTotalCapacity', () => {
    it('should calculate total capacity across all clusters', () => {
      const clusters: ClusterCapacity[] = [
        { 
          id: 'c1', 
          name: 'Cluster1', 
          cpuGhz: 2.5, 
          totalCores: 16, 
          memoryGB: 128, 
          storageTB: 10 
        },
        { 
          id: 'c2', 
          name: 'Cluster2', 
          cpuGhz: 3.0, 
          totalCores: 24, 
          memoryGB: 256, 
          storageTB: 20 
        }
      ];

      const result = calculateTotalCapacity(clusters);

      // Cluster1: 2.5 * 16 = 40 GHz, Cluster2: 3.0 * 24 = 72 GHz → Total: 112 GHz
      expect(result.cpu.totalCapacity).toBe(112);
      expect(result.memory.totalCapacity).toBe(384); // 128 + 256
      expect(result.storage.totalCapacity).toBe(30); // 10 + 20
    });

    it('should apply overcommit ratios correctly', () => {
      const clusters: ClusterCapacity[] = [
        { 
          id: 'c1', 
          name: 'Overcommitted', 
          cpuGhz: 2.0, 
          totalCores: 8, 
          memoryGB: 64, 
          storageTB: 5,
          cpuOvercommit: 2.0,
          memoryOvercommit: 1.5,
          storageOvercommit: 1.0
        }
      ];

      const result = calculateTotalCapacity(clusters);

      // CPU: 2.0 * 8 = 16 GHz * 2.0 = 32 GHz effective
      expect(result.cpu.effectiveCapacity).toBe(32);
      // Memory: 64 GB * 1.5 = 96 GB effective
      expect(result.memory.effectiveCapacity).toBe(96);
      // Storage: 5 TB * 1.0 = 5 TB effective
      expect(result.storage.effectiveCapacity).toBe(5);
    });

    it('should default overcommit ratio to 1.0 when not specified', () => {
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Default', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const result = calculateTotalCapacity(clusters);

      // No overcommit, so effective = total
      expect(result.cpu.effectiveCapacity).toBe(result.cpu.totalCapacity);
      expect(result.memory.effectiveCapacity).toBe(result.memory.totalCapacity);
      expect(result.storage.effectiveCapacity).toBe(result.storage.totalCapacity);
    });
  });

  describe('calculateVMRequirements', () => {
    it('should calculate total VM resource requirements', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 8192, provisionedMB: 102400, cpuGhz: 2.5 },
        { id: 'vm2', name: 'VM2', cpus: 2, memoryMB: 4096, provisionedMB: 51200, cpuGhz: 2.5 }
      ];

      const result = calculateVMRequirements(vms);

      // CPU: (4 * 2.5) + (2 * 2.5) = 15 GHz
      expect(result.totalCPUGHz).toBe(15);
      // Memory: (8192 + 4096) / 1024 = 12 GB
      expect(result.totalMemoryGB).toBe(12);
      // Storage: (102400 + 51200) / 1024 / 1024 = 0.146484375 TB
      expect(result.totalStorageTB).toBeCloseTo(0.146, 2);
    });

    it('should use default CPU GHz when not specified', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 8192, provisionedMB: 102400 } // No cpuGhz
      ];

      const result = calculateVMRequirements(vms);

      // Should use default 2.5 GHz: 4 * 2.5 = 10 GHz
      expect(result.totalCPUGHz).toBe(10);
    });
  });

  describe('calculateUtilization', () => {
    it('should return error status when no clusters configured', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 8192, provisionedMB: 102400 }
      ];
      const clusters: ClusterCapacity[] = [];

      const result = calculateUtilization(vms, clusters);

      expect(result.overallStatus).toBe('error');
      expect(result.bottlenecks).toHaveLength(1);
      expect(result.bottlenecks[0].message).toContain('No clusters configured');
    });

    it('should return healthy status when no VMs selected', () => {
      const vms: VMResourceRequirements[] = [];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const result = calculateUtilization(vms, clusters);

      expect(result.overallStatus).toBe('healthy');
      expect(result.cpuUtilization).toBe(0);
      expect(result.memoryUtilization).toBe(0);
      expect(result.storageUtilization).toBe(0);
      expect(result.bottlenecks[0].message).toContain('No VMs selected');
    });

    it('should calculate correct utilization percentages', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 32768, provisionedMB: 2097152, cpuGhz: 2.5 } // 4 cores, 32 GB, 2 TB
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const result = calculateUtilization(vms, clusters);

      // CPU: (4 * 2.5) / (2.5 * 16) * 100 = 10 / 40 * 100 = 25%
      expect(result.cpuUtilization).toBe(25);
      // Memory: 32 / 128 * 100 = 25%
      expect(result.memoryUtilization).toBe(25);
      // Storage: 2 / 10 * 100 = 20%
      expect(result.storageUtilization).toBe(20);
    });

    it('should apply overcommit ratios in utilization calculations', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 8, memoryMB: 65536, provisionedMB: 5242880, cpuGhz: 2.5 } // 8 cores, 64 GB, 5 TB
      ];
      const clusters: ClusterCapacity[] = [
        { 
          id: 'c1', 
          name: 'Overcommitted', 
          cpuGhz: 2.5, 
          totalCores: 16, 
          memoryGB: 128, 
          storageTB: 10,
          cpuOvercommit: 2.0 // 2:1 overcommit
        }
      ];

      const result = calculateUtilization(vms, clusters);

      // CPU with 2:1 overcommit: (8 * 2.5) / (2.5 * 16 * 2.0) * 100 = 20 / 80 * 100 = 25%
      expect(result.cpuUtilization).toBe(25);
    });

    it('should handle division by zero gracefully', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 8192, provisionedMB: 102400 }
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Invalid', cpuGhz: 0, totalCores: 0, memoryGB: 0, storageTB: 0 }
      ];

      const result = calculateUtilization(vms, clusters);

      expect(result.cpuUtilization).toBe(0);
      expect(result.memoryUtilization).toBe(0);
      expect(result.storageUtilization).toBe(0);
    });

    it('should populate metrics object correctly', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 32768, provisionedMB: 2097152, cpuGhz: 2.5 }
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const result = calculateUtilization(vms, clusters);

      expect(result.metrics.cpu.allocated).toBe(10); // 4 * 2.5
      expect(result.metrics.cpu.available).toBe(30); // 40 - 10
      expect(result.metrics.memory.allocated).toBe(32);
      expect(result.metrics.memory.available).toBe(96); // 128 - 32
    });
  });


  describe('detectBottlenecks', () => {
    it('should detect critical CPU bottleneck above 95%', () => {
      const bottlenecks = detectBottlenecks(96, 50, 30);

      expect(bottlenecks.length).toBeGreaterThan(0);
      const cpuBottleneck = bottlenecks.find(b => b.resource === 'CPU' && b.severity === 'critical');
      expect(cpuBottleneck).toBeDefined();
      expect(cpuBottleneck?.message).toContain('Critical CPU capacity shortage');
    });

    it('should detect critical bottleneck for high utilization (90-95%)', () => {
      const bottlenecks = detectBottlenecks(92, 50, 30);

      const cpuBottleneck = bottlenecks.find(b => b.resource === 'CPU');
      expect(cpuBottleneck).toBeDefined();
      expect(cpuBottleneck?.severity).toBe('critical');
      expect(cpuBottleneck?.message).toContain('severe CPU constraints');
    });

    it('should detect warning bottleneck for moderate utilization (80-90%)', () => {
      const bottlenecks = detectBottlenecks(85, 50, 30);

      const cpuBottleneck = bottlenecks.find(b => b.resource === 'CPU');
      expect(cpuBottleneck).toBeDefined();
      expect(cpuBottleneck?.severity).toBe('warning');
      expect(cpuBottleneck?.message).toContain('approaching CPU capacity limits');
    });

    it('should detect multiple bottlenecks across resources', () => {
      const bottlenecks = detectBottlenecks(85, 92, 88);

      expect(bottlenecks.length).toBeGreaterThanOrEqual(3); // At least CPU, Memory, Storage
      expect(bottlenecks.some(b => b.resource === 'CPU')).toBe(true);
      expect(bottlenecks.some(b => b.resource === 'Memory')).toBe(true);
      expect(bottlenecks.some(b => b.resource === 'Storage')).toBe(true);
    });

    it('should not detect bottlenecks when utilization is healthy (<80%)', () => {
      const bottlenecks = detectBottlenecks(50, 60, 45);

      expect(bottlenecks).toHaveLength(0);
    });

    it('should include utilization percentage in bottleneck warnings', () => {
      const bottlenecks = detectBottlenecks(96, 50, 30);

      const cpuBottleneck = bottlenecks.find(b => b.resource === 'CPU');
      expect(cpuBottleneck?.utilizationPercentage).toBe(96);
    });

    it('should provide appropriate recommendations for each severity', () => {
      const critical = detectBottlenecks(96, 50, 30);
      const warning = detectBottlenecks(85, 50, 30);

      const criticalBottleneck = critical.find(b => b.resource === 'CPU');
      const warningBottleneck = warning.find(b => b.resource === 'CPU');

      expect(criticalBottleneck?.recommendation).toContain('significantly reduce');
      expect(warningBottleneck?.recommendation).toContain('Consider adding');
    });
  });

  describe('validateCapacity', () => {
    it('should return error when no clusters configured', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 8192, provisionedMB: 102400 }
      ];
      const clusters: ClusterCapacity[] = [];

      const validation = validateCapacity(vms, clusters);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No destination clusters configured');
    });

    it('should return warning when no VMs selected', () => {
      const vms: VMResourceRequirements[] = [];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const validation = validateCapacity(vms, clusters);

      expect(validation.warnings).toContain('No VMs selected for migration');
    });

    it('should return valid when utilization is below 100%', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 32768, provisionedMB: 2097152, cpuGhz: 2.5 }
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const validation = validateCapacity(vms, clusters);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors when CPU capacity exceeded', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 20, memoryMB: 32768, provisionedMB: 2097152, cpuGhz: 2.5 }
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const validation = validateCapacity(vms, clusters);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('CPU capacity insufficient'))).toBe(true);
    });

    it('should return errors when memory capacity exceeded', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 153600, provisionedMB: 2097152, cpuGhz: 2.5 } // 150 GB
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const validation = validateCapacity(vms, clusters);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Memory capacity insufficient'))).toBe(true);
    });

    it('should return errors when storage capacity exceeded', () => {
      const vms: VMResourceRequirements[] = [
        { id: 'vm1', name: 'VM1', cpus: 4, memoryMB: 32768, provisionedMB: 12582912, cpuGhz: 2.5 } // 12 TB
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const validation = validateCapacity(vms, clusters);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Storage capacity insufficient'))).toBe(true);
    });

    it('should return warnings for high utilization even when below 100%', () => {
      const vms: VMResourceRequirements[] = [
        // To get 91% CPU: (cpus * cpuGhz) / (totalCores * cpuGhz) = 0.91
        // (14.56 * 2.5) / (16 * 2.5) = 36.4 / 40 = 91%
        // To get 91% Memory: memoryMB / (memoryGB * 1024) = 0.91
        // 116326.4 / (128 * 1024) = 116326.4 / 131072 = 88.75% (let's use 118374.4 for ~90.3%)
        { id: 'vm1', name: 'VM1', cpus: 14.56, memoryMB: 118374, provisionedMB: 2097152, cpuGhz: 2.5 }
      ];
      const clusters: ClusterCapacity[] = [
        { id: 'c1', name: 'Cluster1', cpuGhz: 2.5, totalCores: 16, memoryGB: 128, storageTB: 10 }
      ];

      const validation = validateCapacity(vms, clusters);

      expect(validation.isValid).toBe(true); // Not over capacity
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('CPU utilization very high'))).toBe(true);
    });
  });


  describe('determineOverallStatus', () => {
    it('should return healthy when all utilization below 70%', () => {
      const status = determineOverallStatus(50, 60, 45);
      expect(status).toBe('healthy');
    });

    it('should return moderate when max utilization 70-80%', () => {
      const status = determineOverallStatus(75, 60, 50);
      expect(status).toBe('moderate');
    });

    it('should return high when max utilization 80-90%', () => {
      const status = determineOverallStatus(50, 85, 60);
      expect(status).toBe('high');
    });

    it('should return critical when max utilization >= 90%', () => {
      const status = determineOverallStatus(60, 70, 92);
      expect(status).toBe('critical');
    });

    it('should use maximum utilization for overall status', () => {
      const status = determineOverallStatus(50, 95, 40);
      expect(status).toBe('critical'); // Memory at 95% determines status
    });
  });

  describe('getUtilizationColor', () => {
    it('should return green for healthy utilization (<70%)', () => {
      expect(getUtilizationColor(30)).toBe('#10b981');
      expect(getUtilizationColor(50)).toBe('#10b981');
      expect(getUtilizationColor(69)).toBe('#10b981');
    });

    it('should return yellow for moderate utilization (70-80%)', () => {
      expect(getUtilizationColor(70)).toBe('#f59e0b');
      expect(getUtilizationColor(75)).toBe('#f59e0b');
      expect(getUtilizationColor(79)).toBe('#f59e0b');
    });

    it('should return orange for high utilization (80-90%)', () => {
      expect(getUtilizationColor(80)).toBe('#f97316');
      expect(getUtilizationColor(85)).toBe('#f97316');
      expect(getUtilizationColor(89)).toBe('#f97316');
    });

    it('should return red for critical utilization (>=90%)', () => {
      expect(getUtilizationColor(90)).toBe('#ef4444');
      expect(getUtilizationColor(95)).toBe('#ef4444');
      expect(getUtilizationColor(110)).toBe('#ef4444'); // Over capacity
    });

    it('should handle boundary values correctly', () => {
      expect(getUtilizationColor(69.9)).toBe('#10b981'); // green
      expect(getUtilizationColor(70)).toBe('#f59e0b'); // yellow
      expect(getUtilizationColor(79.9)).toBe('#f59e0b'); // yellow
      expect(getUtilizationColor(80)).toBe('#f97316'); // orange
      expect(getUtilizationColor(89.9)).toBe('#f97316'); // orange
      expect(getUtilizationColor(90)).toBe('#ef4444'); // red
    });

    it('should handle edge cases', () => {
      expect(getUtilizationColor(0)).toBe('#10b981'); // 0% is healthy/green
      expect(getUtilizationColor(-10)).toBe('#10b981'); // Negative treated as healthy
    });
  });

  describe('getUtilizationLabel', () => {
    it('should return correct labels for thresholds', () => {
      expect(getUtilizationLabel(40)).toBe('Healthy');
      expect(getUtilizationLabel(75)).toBe('Moderate');
      expect(getUtilizationLabel(85)).toBe('High');
      expect(getUtilizationLabel(95)).toBe('Critical');
    });

    it('should handle boundary values', () => {
      expect(getUtilizationLabel(69)).toBe('Healthy');
      expect(getUtilizationLabel(70)).toBe('Moderate');
      expect(getUtilizationLabel(79)).toBe('Moderate');
      expect(getUtilizationLabel(80)).toBe('High');
      expect(getUtilizationLabel(89)).toBe('High');
      expect(getUtilizationLabel(90)).toBe('Critical');
    });

    it('should handle edge cases', () => {
      expect(getUtilizationLabel(0)).toBe('Healthy');
      expect(getUtilizationLabel(-5)).toBe('Healthy'); // Invalid, treat as healthy
      expect(getUtilizationLabel(110)).toBe('Critical'); // Over capacity is critical
    });
  });

  describe('formatResourceValue', () => {
    it('should format CPU in GHz with 1 decimal', () => {
      expect(formatResourceValue(16.5, 'cpu')).toBe('16.5 GHz');
      expect(formatResourceValue(32, 'cpu')).toBe('32.0 GHz');
      expect(formatResourceValue(0, 'cpu')).toBe('0.0 GHz');
    });

    it('should format memory in GB with 1 decimal', () => {
      expect(formatResourceValue(128.5, 'memory')).toBe('128.5 GB');
      expect(formatResourceValue(256, 'memory')).toBe('256.0 GB');
      expect(formatResourceValue(0, 'memory')).toBe('0.0 GB');
    });

    it('should format storage in TB with 2 decimals', () => {
      expect(formatResourceValue(5.75, 'storage')).toBe('5.75 TB');
      expect(formatResourceValue(10, 'storage')).toBe('10.00 TB');
      expect(formatResourceValue(0, 'storage')).toBe('0.00 TB');
    });

    it('should handle decimal values correctly', () => {
      expect(formatResourceValue(16.789, 'cpu')).toBe('16.8 GHz'); // Rounded to 1 decimal
      expect(formatResourceValue(128.456, 'memory')).toBe('128.5 GB'); // Rounded to 1 decimal
      expect(formatResourceValue(5.789, 'storage')).toBe('5.79 TB'); // Rounded to 2 decimals
    });

    it('should handle very small values', () => {
      expect(formatResourceValue(0.1, 'cpu')).toBe('0.1 GHz');
      expect(formatResourceValue(0.01, 'memory')).toBe('0.0 GB');
      expect(formatResourceValue(0.001, 'storage')).toBe('0.00 TB');
    });
  });

  describe('calculateHeadroom', () => {
    it('should calculate correct headroom percentages', () => {
      const metrics: CapacityMetrics = {
        cpu: {
          totalCapacity: 100,
          effectiveCapacity: 100,
          allocated: 60,
          available: 40,
          utilization: 60,
          overcommitRatio: 1.0
        },
        memory: {
          totalCapacity: 200,
          effectiveCapacity: 200,
          allocated: 150,
          available: 50,
          utilization: 75,
          overcommitRatio: 1.0
        },
        storage: {
          totalCapacity: 10,
          effectiveCapacity: 10,
          allocated: 8,
          available: 2,
          utilization: 80,
          overcommitRatio: 1.0
        },
        overallUtilization: 70
      };

      const headroom = calculateHeadroom(metrics);

      expect(headroom.cpu).toBe(40); // 100 - 60
      expect(headroom.memory).toBe(25); // 100 - 75
      expect(headroom.storage).toBe(20); // 100 - 80
    });

    it('should handle zero headroom (100% utilization)', () => {
      const metrics: CapacityMetrics = {
        cpu: {
          totalCapacity: 100,
          effectiveCapacity: 100,
          allocated: 100,
          available: 0,
          utilization: 100,
          overcommitRatio: 1.0
        },
        memory: {
          totalCapacity: 200,
          effectiveCapacity: 200,
          allocated: 200,
          available: 0,
          utilization: 100,
          overcommitRatio: 1.0
        },
        storage: {
          totalCapacity: 10,
          effectiveCapacity: 10,
          allocated: 10,
          available: 0,
          utilization: 100,
          overcommitRatio: 1.0
        },
        overallUtilization: 100
      };

      const headroom = calculateHeadroom(metrics);

      expect(headroom.cpu).toBe(0);
      expect(headroom.memory).toBe(0);
      expect(headroom.storage).toBe(0);
    });

    it('should handle negative headroom (over capacity)', () => {
      const metrics: CapacityMetrics = {
        cpu: {
          totalCapacity: 100,
          effectiveCapacity: 100,
          allocated: 120,
          available: -20,
          utilization: 120,
          overcommitRatio: 1.0
        },
        memory: {
          totalCapacity: 200,
          effectiveCapacity: 200,
          allocated: 250,
          available: -50,
          utilization: 125,
          overcommitRatio: 1.0
        },
        storage: {
          totalCapacity: 10,
          effectiveCapacity: 10,
          allocated: 15,
          available: -5,
          utilization: 150,
          overcommitRatio: 1.0
        },
        overallUtilization: 130
      };

      const headroom = calculateHeadroom(metrics);

      expect(headroom.cpu).toBe(-20); // 100 - 120
      expect(headroom.memory).toBe(-25); // 100 - 125
      expect(headroom.storage).toBe(-50); // 100 - 150
    });
  });
});
