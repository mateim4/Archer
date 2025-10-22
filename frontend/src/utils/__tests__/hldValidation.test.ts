import { describe, it, expect } from 'vitest';
import {
  validateHLDReadiness,
  isBlockingError,
  hasWarnings,
  getTotalIssueCount,
  formatValidationMessage,
  type HLDValidationInput,
  type HLDValidationResult,
  type Cluster,
  type NetworkMapping,
  type CapacityAnalysis,
} from '../hldValidation';

describe('hldValidation', () => {
  // =============================================================================
  // HELPER FACTORY FUNCTIONS
  // =============================================================================

  const createValidInput = (): HLDValidationInput => ({
    selectedRVTools: 'rv-tools-123',
    workloadSummary: {
      totalVMs: 100,
      filteredVMs: 100,
    },
    clusters: [
      {
        id: 'cluster-1',
        name: 'Production Cluster',
        nodes: [
          { name: 'node-1', cpuCores: 16, memoryGB: 128, storageGB: 2000 },
          { name: 'node-2', cpuCores: 16, memoryGB: 128, storageGB: 2000 },
        ],
      },
    ],
    capacityAnalysis: {
      isSufficient: true,
      cpuUtilization: 60,
      memoryUtilization: 55,
      storageUtilization: 50,
      bottlenecks: [],
    },
    networkMappings: [
      {
        sourceVlan: 'VLAN-100',
        destinationVlan: 'VLAN-200',
        sourceNetwork: '192.168.1.0/24',
        destinationNetwork: '10.0.1.0/24',
      },
    ],
  });

  // =============================================================================
  // validateHLDReadiness - SUCCESS CASES
  // =============================================================================

  describe('validateHLDReadiness - success cases', () => {
    it('should pass validation when all inputs are complete and valid', () => {
      const input = createValidInput();
      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should pass validation with warnings when VMs are filtered but not blocking', () => {
      const input = createValidInput();
      input.workloadSummary.filteredVMs = 40; // Less than 50% but not 0

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Only 40 of 100 VMs selected');
    });

    it('should pass validation when capacity is sufficient', () => {
      const input = createValidInput();
      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.includes('capacity'))).toBe(false);
    });
  });

  // =============================================================================
  // validateHLDReadiness - ERROR CASES (BLOCKERS)
  // =============================================================================

  describe('validateHLDReadiness - error cases (blockers)', () => {
    it('should return error when no RVTools data selected', () => {
      const input = createValidInput();
      input.selectedRVTools = null;

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('No RVTools data selected');
    });

    it('should return error when no clusters configured', () => {
      const input = createValidInput();
      input.clusters = [];

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('No destination clusters configured');
    });

    it('should return multiple errors when multiple blockers exist', () => {
      const input = createValidInput();
      input.selectedRVTools = null;
      input.clusters = [];

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('RVTools');
      expect(result.errors[1]).toContain('clusters');
    });
  });

  // =============================================================================
  // validateHLDReadiness - WARNING CASES (NON-BLOCKERS)
  // =============================================================================

  describe('validateHLDReadiness - warning cases (non-blockers)', () => {
    it('should return warning when no VMs selected', () => {
      const input = createValidInput();
      input.workloadSummary.filteredVMs = 0;

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true); // Not a blocker
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('No VMs selected for migration');
    });

    it('should return warning when less than 50% of VMs selected', () => {
      const input = createValidInput();
      input.workloadSummary.totalVMs = 100;
      input.workloadSummary.filteredVMs = 30; // 30% < 50%

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Only 30 of 100 VMs selected');
    });

    it('should NOT return warning when 50% or more VMs selected', () => {
      const input = createValidInput();
      input.workloadSummary.totalVMs = 100;
      input.workloadSummary.filteredVMs = 50; // Exactly 50%

      const result = validateHLDReadiness(input);

      expect(result.warnings.some(w => w.includes('VMs selected'))).toBe(false);
    });

    it('should return warning when clusters have incomplete configurations', () => {
      const input = createValidInput();
      input.clusters = [
        { id: 'c1', name: 'Complete', nodes: [{ name: 'node-1', cpuCores: 16, memoryGB: 128, storageGB: 2000 }] },
        { id: 'c2', name: '', nodes: [] }, // Incomplete: no name, no nodes
        { id: 'c3', name: 'No Nodes', nodes: [] }, // Incomplete: no nodes
      ];

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true); // Not a blocker
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('2 cluster(s) have incomplete configurations'))).toBe(true);
    });

    it('should return warning when capacity analysis not performed', () => {
      const input = createValidInput();
      input.capacityAnalysis = null;

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.includes('Capacity analysis not performed'))).toBe(true);
    });

    it('should return warning when capacity is insufficient', () => {
      const input = createValidInput();
      input.capacityAnalysis = {
        isSufficient: false,
        cpuUtilization: 95,
        memoryUtilization: 92,
        storageUtilization: 88,
        bottlenecks: [{ resource: 'CPU', severity: 'critical' }],
      };

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true); // Not a blocker
      expect(result.warnings.some(w => w.includes('capacity may be insufficient'))).toBe(true);
    });

    it('should return warning when no network mappings configured', () => {
      const input = createValidInput();
      input.networkMappings = [];

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.includes('No network mappings configured'))).toBe(true);
    });

    it('should return warning when network mappings are incomplete', () => {
      const input = createValidInput();
      input.networkMappings = [
        { sourceVlan: 'VLAN-100', destinationVlan: 'VLAN-200' }, // Complete
        { sourceVlan: '', destinationVlan: 'VLAN-300' }, // Incomplete: no source
        { sourceVlan: 'VLAN-400', destinationVlan: '' }, // Incomplete: no destination
      ];

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true);
      expect(result.warnings.some(w => w.includes('2 network mapping(s) are incomplete'))).toBe(true);
    });

    it('should return multiple warnings when multiple issues exist', () => {
      const input = createValidInput();
      input.workloadSummary.filteredVMs = 0; // Warning 1
      input.capacityAnalysis = null; // Warning 2
      input.networkMappings = []; // Warning 3

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(true); // No errors, only warnings
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =============================================================================
  // validateHLDReadiness - EDGE CASES
  // =============================================================================

  describe('validateHLDReadiness - edge cases', () => {
    it('should handle empty clusters array as error', () => {
      const input = createValidInput();
      input.clusters = [];

      const result = validateHLDReadiness(input);

      expect(result.canGenerate).toBe(false);
      expect(result.errors[0]).toContain('No destination clusters');
    });

    it('should handle exactly 50% VMs selected (boundary)', () => {
      const input = createValidInput();
      input.workloadSummary.totalVMs = 100;
      input.workloadSummary.filteredVMs = 50;

      const result = validateHLDReadiness(input);

      // Exactly 50% should NOT trigger warning (only < 50%)
      expect(result.warnings.some(w => w.includes('VMs selected'))).toBe(false);
    });

    it('should handle 49% VMs selected (just below boundary)', () => {
      const input = createValidInput();
      input.workloadSummary.totalVMs = 100;
      input.workloadSummary.filteredVMs = 49;

      const result = validateHLDReadiness(input);

      // 49% < 50% should trigger warning
      expect(result.warnings.some(w => w.includes('49 of 100 VMs selected'))).toBe(true);
    });

    it('should handle clusters with name but no nodes', () => {
      const input = createValidInput();
      input.clusters = [
        { id: 'c1', name: 'Empty Cluster', nodes: [] }
      ];

      const result = validateHLDReadiness(input);

      expect(result.warnings.some(w => w.includes('1 cluster(s) have incomplete'))).toBe(true);
    });

    it('should handle clusters with nodes but no name', () => {
      const input = createValidInput();
      input.clusters = [
        { id: 'c1', name: '', nodes: [{ name: 'node-1', cpuCores: 16, memoryGB: 128, storageGB: 2000 }] }
      ];

      const result = validateHLDReadiness(input);

      expect(result.warnings.some(w => w.includes('1 cluster(s) have incomplete'))).toBe(true);
    });
  });

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  describe('isBlockingError', () => {
    it('should return true when errors exist', () => {
      const result: HLDValidationResult = {
        canGenerate: false,
        errors: ['Error 1', 'Error 2'],
        warnings: [],
      };

      expect(isBlockingError(result)).toBe(true);
    });

    it('should return false when no errors exist', () => {
      const result: HLDValidationResult = {
        canGenerate: true,
        errors: [],
        warnings: ['Warning 1'],
      };

      expect(isBlockingError(result)).toBe(false);
    });
  });

  describe('hasWarnings', () => {
    it('should return true when warnings exist', () => {
      const result: HLDValidationResult = {
        canGenerate: true,
        errors: [],
        warnings: ['Warning 1'],
      };

      expect(hasWarnings(result)).toBe(true);
    });

    it('should return false when no warnings exist', () => {
      const result: HLDValidationResult = {
        canGenerate: true,
        errors: [],
        warnings: [],
      };

      expect(hasWarnings(result)).toBe(false);
    });
  });

  describe('getTotalIssueCount', () => {
    it('should return sum of errors and warnings', () => {
      const result: HLDValidationResult = {
        canGenerate: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
      };

      expect(getTotalIssueCount(result)).toBe(5); // 2 errors + 3 warnings
    });

    it('should return 0 when no issues', () => {
      const result: HLDValidationResult = {
        canGenerate: true,
        errors: [],
        warnings: [],
      };

      expect(getTotalIssueCount(result)).toBe(0);
    });
  });

  describe('formatValidationMessage', () => {
    it('should return success message when no issues', () => {
      const result: HLDValidationResult = {
        canGenerate: true,
        errors: [],
        warnings: [],
      };

      const message = formatValidationMessage(result);
      expect(message).toBe('All validations passed. HLD is ready to generate.');
    });

    it('should format error count', () => {
      const result: HLDValidationResult = {
        canGenerate: false,
        errors: ['Error 1', 'Error 2'],
        warnings: [],
      };

      const message = formatValidationMessage(result);
      expect(message).toContain('2 error(s) preventing HLD generation');
    });

    it('should format warning count', () => {
      const result: HLDValidationResult = {
        canGenerate: true,
        errors: [],
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
      };

      const message = formatValidationMessage(result);
      expect(message).toContain('3 warning(s)');
    });

    it('should format both errors and warnings', () => {
      const result: HLDValidationResult = {
        canGenerate: false,
        errors: ['Error 1'],
        warnings: ['Warning 1', 'Warning 2'],
      };

      const message = formatValidationMessage(result);
      expect(message).toContain('1 error(s) preventing HLD generation');
      expect(message).toContain('2 warning(s)');
    });
  });
});
