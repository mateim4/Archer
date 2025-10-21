/**
 * Migration Planning Wizard API Client
 * 
 * Provides typed API calls for all wizard steps:
 * - VM Placement & Capacity Analysis
 * - Network Template Management
 * - HLD Document Generation
 * 
 * All endpoints follow REST conventions with proper error handling.
 */

import { BackendApiError } from './backendClient';

const API_BASE = '/api/v1';

// ============================================================================
// Type Definitions
// ============================================================================

// VM Placement Types
export interface VMResourceRequirements {
  vm_id: string;
  vm_name: string;
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  network_vlan?: number;
  is_critical: boolean;
  affinity_group?: string;
  anti_affinity_group?: string;
}

export interface ClusterCapacityStatus {
  cluster_id: string;
  cluster_name: string;
  total_cpu: number;
  total_memory_gb: number;
  total_storage_gb: number;
  available_cpu: number;
  available_memory_gb: number;
  available_storage_gb: number;
}

export interface VMPlacement {
  vm_id: string;
  vm_name: string;
  cluster_id: string;
  cluster_name: string;
  placement_reason: string;
  resource_utilization: {
    cpu_cores_used: number;
    memory_gb_used: number;
    storage_gb_used: number;
  };
}

export interface PlacementBottleneck {
  resource_type: 'cpu' | 'memory' | 'storage';
  severity: 'critical' | 'warning';
  message: string;
  recommendation: string;
}

export interface PlacementSummary {
  total_vms: number;
  placed_vms: number;
  unplaced_vms: number;
  clusters_used: number;
  average_cluster_utilization: number;
  placement_strategy_used: string;
}

export interface PlacementResult {
  vm_placements: VMPlacement[];
  unplaced_vms: VMResourceRequirements[];
  cluster_utilization: Record<string, ClusterCapacityStatus>;
  placement_warnings: string[];
  placement_summary: PlacementSummary;
}

export interface CalculatePlacementsRequest {
  project_id: string;
  vms: VMResourceRequirements[];
  clusters: ClusterCapacityStatus[];
  strategy: 'FirstFit' | 'BestFit' | 'Balanced' | 'Performance';
}

export interface ValidatePlacementRequest {
  vms: VMResourceRequirements[];
  clusters: ClusterCapacityStatus[];
}

export interface ValidationResult {
  is_feasible: boolean;
  warnings: string[];
}

// Network Template Types
export interface NetworkTemplate {
  id: string;
  name: string;
  description?: string;
  source_network: string;
  destination_network: string;
  vlan_mapping?: Record<string, string>;
  subnet_mapping?: Record<string, string>;
  gateway?: string;
  dns_servers?: string[];
  is_global: boolean;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateNetworkTemplateRequest {
  name: string;
  description?: string;
  source_network: string;
  destination_network: string;
  vlan_mapping?: Record<string, string>;
  subnet_mapping?: Record<string, string>;
  gateway?: string;
  dns_servers?: string[];
  is_global: boolean;
  tags?: string[];
}

export interface NetworkTemplateFilters {
  is_global?: boolean;
  search?: string;
  tags?: string;
  limit?: number;
  offset?: number;
}

export interface NetworkConfig {
  source_network: string;
  destination_network: string;
  vlan_mapping: Record<string, string>;
  subnet_mapping: Record<string, string>;
  gateway: string;
  dns_servers: string[];
  template_id: string;
  template_name: string;
  applied_at: string;
}

// HLD Generation Types
export interface HLDGenerationRequest {
  project_id: string;
  include_executive_summary: boolean;
  include_inventory: boolean;
  include_architecture: boolean;
  include_capacity_planning: boolean;
  include_network_design: boolean;
  include_migration_runbook: boolean;
  include_appendices: boolean;
}

export interface GeneratedDocument {
  id: string;
  project_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  sections_included: string[];
  metadata: Record<string, unknown>;
  generated_at: string;
  generated_by: string;
}

export interface HLDGenerationResult {
  document: GeneratedDocument;
  file_path: string;
  file_size_bytes: number;
  generation_time_ms: number;
  sections_included: string[];
}

// API Response Wrapper
interface ApiResponse<T> {
  success: boolean;
  result?: T;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new BackendApiError(
      response.status,
      error.error || 'API request failed',
      error
    );
  }

  const data = await response.json();
  
  // Handle wrapped responses
  if ('success' in data && data.success === false) {
    throw new BackendApiError(
      response.status,
      data.error || 'API returned success: false',
      data
    );
  }

  // Unwrap if needed
  if ('success' in data && 'result' in data) {
    return data.result as T;
  }

  return data as T;
}

// ============================================================================
// VM Placement API
// ============================================================================

export const vmPlacementAPI = {
  /**
   * Calculate VM-to-cluster placements using specified strategy
   */
  async calculatePlacements(
    request: CalculatePlacementsRequest
  ): Promise<PlacementResult> {
    const response = await fetch(`${API_BASE}/vm-placement/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return handleResponse<PlacementResult>(response);
  },

  /**
   * Validate placement feasibility before attempting
   */
  async validatePlacement(
    request: ValidatePlacementRequest
  ): Promise<ValidationResult> {
    const response = await fetch(`${API_BASE}/vm-placement/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return handleResponse<ValidationResult>(response);
  },

  /**
   * Re-optimize existing placements using Balanced strategy
   */
  async optimizePlacements(
    projectId: string,
    request: ValidatePlacementRequest
  ): Promise<PlacementResult> {
    const response = await fetch(`${API_BASE}/vm-placement/optimize/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return handleResponse<PlacementResult>(response);
  },
};

// ============================================================================
// Network Templates API
// ============================================================================

export const networkTemplatesAPI = {
  /**
   * List network templates with optional filters
   */
  async listTemplates(
    filters?: NetworkTemplateFilters
  ): Promise<{ templates: NetworkTemplate[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters?.is_global !== undefined) {
      params.append('is_global', String(filters.is_global));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.tags) {
      params.append('tags', filters.tags);
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    if (filters?.offset) {
      params.append('offset', String(filters.offset));
    }

    const url = params.toString() 
      ? `${API_BASE}/network-templates?${params}`
      : `${API_BASE}/network-templates`;

    const response = await fetch(url);
    return handleResponse<{ templates: NetworkTemplate[]; total: number }>(response);
  },

  /**
   * Create new network template
   */
  async createTemplate(
    template: CreateNetworkTemplateRequest
  ): Promise<NetworkTemplate> {
    const response = await fetch(`${API_BASE}/network-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });

    const result = await handleResponse<{ template: NetworkTemplate }>(response);
    return result.template;
  },

  /**
   * Get specific template by ID
   */
  async getTemplate(templateId: string): Promise<NetworkTemplate> {
    const response = await fetch(`${API_BASE}/network-templates/${templateId}`);
    
    const result = await handleResponse<{ template: NetworkTemplate }>(response);
    return result.template;
  },

  /**
   * Update existing template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateNetworkTemplateRequest>
  ): Promise<NetworkTemplate> {
    const response = await fetch(`${API_BASE}/network-templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const result = await handleResponse<{ template: NetworkTemplate }>(response);
    return result.template;
  },

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/network-templates/${templateId}`, {
      method: 'DELETE',
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Clone template to user's collection
   */
  async cloneTemplate(
    templateId: string,
    newName?: string
  ): Promise<NetworkTemplate> {
    const response = await fetch(`${API_BASE}/network-templates/${templateId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: newName }),
    });

    const result = await handleResponse<{ template: NetworkTemplate }>(response);
    return result.template;
  },

  /**
   * Search templates by network query
   */
  async searchTemplates(
    query: string
  ): Promise<{ templates: NetworkTemplate[]; total: number }> {
    const response = await fetch(
      `${API_BASE}/network-templates/search?q=${encodeURIComponent(query)}`
    );

    return handleResponse<{ templates: NetworkTemplate[]; total: number }>(response);
  },

  /**
   * Apply template configuration to project
   */
  async applyTemplate(
    templateId: string,
    projectId: string
  ): Promise<NetworkConfig> {
    const response = await fetch(
      `${API_BASE}/network-templates/${templateId}/apply/${projectId}`,
      { method: 'POST' }
    );

    const result = await handleResponse<{ network_config: NetworkConfig }>(response);
    return result.network_config;
  },
};

// ============================================================================
// HLD Generation API
// ============================================================================

export const hldAPI = {
  /**
   * Generate High-Level Design Word document
   */
  async generateHLD(request: HLDGenerationRequest): Promise<HLDGenerationResult> {
    const response = await fetch(`${API_BASE}/hld/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return handleResponse<HLDGenerationResult>(response);
  },

  /**
   * List all documents for a project
   */
  async listDocuments(
    projectId: string
  ): Promise<{ documents: GeneratedDocument[]; total: number }> {
    const response = await fetch(`${API_BASE}/hld/documents/${projectId}`);
    
    return handleResponse<{ documents: GeneratedDocument[]; total: number }>(response);
  },

  /**
   * Get document metadata
   */
  async getDocument(projectId: string, documentId: string): Promise<GeneratedDocument> {
    const response = await fetch(`${API_BASE}/hld/documents/${projectId}/${documentId}`);
    
    const result = await handleResponse<{ document: GeneratedDocument }>(response);
    return result.document;
  },

  /**
   * Get download URL for generated document
   */
  getDocumentDownloadUrl(projectId: string, documentId: string): string {
    return `${API_BASE}/hld/documents/${projectId}/${documentId}/download`;
  },

  /**
   * Download generated document (triggers browser download)
   */
  async downloadDocument(projectId: string, documentId: string): Promise<void> {
    const url = this.getDocumentDownloadUrl(projectId, documentId);
    
    // Open in new window to trigger download
    window.open(url, '_blank');
  },
};

// ============================================================================
// Combined Wizard API Export
// ============================================================================

export const migrationWizardAPI = {
  vmPlacement: vmPlacementAPI,
  networkTemplates: networkTemplatesAPI,
  hld: hldAPI,
};
