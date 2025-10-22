import { bench, describe } from 'vitest';
import {
  calculateTotalCapacity,
  calculateVMRequirements,
  calculateUtilization,
  type VMResourceRequirements,
  type ClusterCapacity,
} from '../capacityCalculations';

/**
 * Vitest Performance Benchmarks: Capacity Calculations
 * 
 * Run with: vitest bench
 */

// Test data generators
function generateVM(id: number): VMResourceRequirements {
  return {
    id: `vm-${id}`,
    name: `TestVM-${id}`,
    cpus: 2 + Math.floor(Math.random() * 14),
    memoryMB: (4 + Math.floor(Math.random() * 60)) * 1024,
    provisionedMB: (50 + Math.floor(Math.random() * 1950)) * 1024,
    cpuGhz: 2.4 + Math.random() * 1.6,
  };
}

function generateCluster(id: number): ClusterCapacity {
  const cores = 32 + Math.floor(Math.random() * 64);
  return {
    id: `cluster-${id}`,
    name: `TestCluster-${id}`,
    cpuGhz: (2.4 + Math.random() * 1.6) * cores,
    totalCores: cores,
    memoryGB: 256 + Math.floor(Math.random() * 512),
    storageTB: 5 + Math.floor(Math.random() * 10),
    cpuOvercommit: 1.0 + Math.random() * 0.5,
    memoryOvercommit: 1.0 + Math.random() * 0.3,
    storageOvercommit: 1.0,
  };
}

// Pre-generate test topologies
const small = { vms: Array.from({ length: 10 }, (_, i) => generateVM(i)), clusters: [generateCluster(0)] };
const medium = { vms: Array.from({ length: 100 }, (_, i) => generateVM(i)), clusters: Array.from({ length: 3 }, (_, i) => generateCluster(i)) };
const large = { vms: Array.from({ length: 1000 }, (_, i) => generateVM(i)), clusters: Array.from({ length: 10 }, (_, i) => generateCluster(i)) };
const extraLarge = { vms: Array.from({ length: 5000 }, (_, i) => generateVM(i)), clusters: Array.from({ length: 25 }, (_, i) => generateCluster(i)) };

describe('Capacity Calculations', () => {
  bench('calculateTotalCapacity - 1 cluster', () => {
    calculateTotalCapacity(small.clusters);
  });

  bench('calculateTotalCapacity - 3 clusters', () => {
    calculateTotalCapacity(medium.clusters);
  });

  bench('calculateTotalCapacity - 10 clusters', () => {
    calculateTotalCapacity(large.clusters);
  });

  bench('calculateTotalCapacity - 25 clusters', () => {
    calculateTotalCapacity(extraLarge.clusters);
  });

  bench('calculateVMRequirements - 10 VMs', () => {
    calculateVMRequirements(small.vms);
  });

  bench('calculateVMRequirements - 100 VMs', () => {
    calculateVMRequirements(medium.vms);
  });

  bench('calculateVMRequirements - 1000 VMs', () => {
    calculateVMRequirements(large.vms);
  });

  bench('calculateVMRequirements - 5000 VMs', () => {
    calculateVMRequirements(extraLarge.vms);
  });

  bench('calculateUtilization - small (10 VMs, 1 cluster)', () => {
    calculateUtilization(small.vms, small.clusters);
  });

  bench('calculateUtilization - medium (100 VMs, 3 clusters)', () => {
    calculateUtilization(medium.vms, medium.clusters);
  });

  bench('calculateUtilization - large (1000 VMs, 10 clusters)', () => {
    calculateUtilization(large.vms, large.clusters);
  });

  bench('calculateUtilization - extra-large (5000 VMs, 25 clusters)', () => {
    calculateUtilization(extraLarge.vms, extraLarge.clusters);
  });

  bench('full analysis pipeline - small', () => {
    calculateUtilization(small.vms, small.clusters);
  });

  bench('full analysis pipeline - medium', () => {
    calculateUtilization(medium.vms, medium.clusters);
  });

  bench('full analysis pipeline - large', () => {
    calculateUtilization(large.vms, large.clusters);
  });

  bench('full analysis pipeline - extra-large', () => {
    calculateUtilization(extraLarge.vms, extraLarge.clusters);
  });
});
