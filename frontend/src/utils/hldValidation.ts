/**
 * High-Level Design (HLD) Validation Utilities
 * 
 * Validates wizard state to determine HLD generation readiness.
 * Provides errors (blockers) and warnings (recommendations) for HLD quality.
 * 
 * Used by:
 * - Migration Wizard Step 5 (HLD Preview)
 * - HLD generation button to enable/disable
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface HLDValidationResult {
  canGenerate: boolean;  // False if errors exist (blockers)
  errors: string[];      // Critical issues that prevent HLD generation
  warnings: string[];    // Non-critical issues that affect HLD quality
}

export interface ClusterNode {
  name: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
}

export interface Cluster {
  id: string;
  name: string;
  nodes: ClusterNode[];
  cpuOvercommit?: number;
  memoryOvercommit?: number;
}

export interface NetworkMapping {
  sourceVlan: string;
  destinationVlan: string;
  sourceNetwork?: string;
  destinationNetwork?: string;
}

export interface CapacityAnalysis {
  isSufficient: boolean;
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  bottlenecks: unknown[];
}

export interface WorkloadSummary {
  totalVMs: number;
  filteredVMs: number;
}

export interface HLDValidationInput {
  selectedRVTools: string | null;  // RVTools file ID
  workloadSummary: WorkloadSummary;
  clusters: Cluster[];
  capacityAnalysis: CapacityAnalysis | null;
  networkMappings: NetworkMapping[];
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate HLD readiness based on wizard state
 * 
 * Returns:
 * - canGenerate: true if HLD can be generated (no errors)
 * - errors: critical issues that prevent HLD generation
 * - warnings: non-critical issues that affect HLD quality
 */
export const validateHLDReadiness = (input: HLDValidationInput): HLDValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // ===========================
  // Step 1: RVTools and VMs
  // ===========================
  
  if (!input.selectedRVTools) {
    errors.push('No RVTools data selected. HLD will have no source environment information.');
  }

  if (input.workloadSummary.filteredVMs === 0) {
    warnings.push('No VMs selected for migration. HLD will show an empty VM inventory.');
  } else if (input.workloadSummary.filteredVMs < input.workloadSummary.totalVMs / 2) {
    warnings.push(
      `Only ${input.workloadSummary.filteredVMs} of ${input.workloadSummary.totalVMs} VMs selected. ` +
      'Consider if filters are too restrictive.'
    );
  }

  // ===========================
  // Step 2: Clusters
  // ===========================
  
  if (input.clusters.length === 0) {
    errors.push('No destination clusters configured. HLD will have no target architecture.');
  } else {
    // Validate cluster configurations
    const incompleteClusters = input.clusters.filter(c => 
      !c.name || c.nodes.length === 0
    );
    
    if (incompleteClusters.length > 0) {
      warnings.push(`${incompleteClusters.length} cluster(s) have incomplete configurations.`);
    }
  }

  // ===========================
  // Step 3: Capacity Analysis
  // ===========================
  
  if (!input.capacityAnalysis) {
    warnings.push('Capacity analysis not performed. HLD will lack capacity recommendations.');
  } else if (!input.capacityAnalysis.isSufficient) {
    warnings.push('Current capacity may be insufficient for workload. Review bottleneck warnings.');
  }

  // ===========================
  // Step 4: Network Mappings
  // ===========================
  
  if (input.networkMappings.length === 0) {
    warnings.push('No network mappings configured. HLD network design section will be empty.');
  } else {
    const incompleteMappings = input.networkMappings.filter(m => 
      !m.sourceVlan || !m.destinationVlan
    );
    
    if (incompleteMappings.length > 0) {
      warnings.push(`${incompleteMappings.length} network mapping(s) are incomplete.`);
    }
  }

  return {
    canGenerate: errors.length === 0, // Can generate if no errors (warnings are OK)
    warnings,
    errors,
  };
};

/**
 * Check if specific validation issue is an error (blocker)
 */
export const isBlockingError = (result: HLDValidationResult): boolean => {
  return result.errors.length > 0;
};

/**
 * Check if validation has warnings
 */
export const hasWarnings = (result: HLDValidationResult): boolean => {
  return result.warnings.length > 0;
};

/**
 * Get total issue count (errors + warnings)
 */
export const getTotalIssueCount = (result: HLDValidationResult): number => {
  return result.errors.length + result.warnings.length;
};

/**
 * Format validation result for display
 */
export const formatValidationMessage = (result: HLDValidationResult): string => {
  if (result.canGenerate && result.warnings.length === 0) {
    return 'All validations passed. HLD is ready to generate.';
  }

  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error(s) preventing HLD generation`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }

  return parts.join(', ');
};
