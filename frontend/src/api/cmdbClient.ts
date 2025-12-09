/**
 * CMDB API Client
 * Handles all API calls to the CMDB backend endpoints
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CIClass =
  | 'HARDWARE'
  | 'SOFTWARE'
  | 'SERVICE'
  | 'DOCUMENT'
  | 'NETWORK'
  | 'CLOUD'
  | 'CONTAINER'
  | 'DATABASE'
  | 'VIRTUAL';

export type CIStatus =
  | 'PLANNED'
  | 'ORDERED'
  | 'RECEIVED'
  | 'IN_STOCK'
  | 'DEPLOYED'
  | 'ACTIVE'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'DECOMMISSIONED'
  | 'RETIRED'
  | 'FAILED';

export type CICriticality =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'NONE';

export type RelationshipType =
  | 'DEPENDS_ON'
  | 'RUNS_ON'
  | 'CONNECTED_TO'
  | 'HOSTED_BY'
  | 'HOSTS'
  | 'PROVIDES_SERVICE_TO'
  | 'CONSUMES_SERVICE_FROM'
  | 'BACKED_UP_BY'
  | 'FAILS_OVER_TO'
  | 'PART_OF'
  | 'RELATED_TO';

export type RelationshipDirection = 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';

export type DiscoverySource = 'MANUAL' | 'DISCOVERY_TOOL' | 'IMPORT' | 'API';

export interface ConfigurationItem {
  id?: string;
  ci_id: string;
  name: string;
  description?: string;
  ci_class: CIClass;
  ci_type: string;
  status: CIStatus;
  criticality: CICriticality;
  environment?: string;
  location?: string;
  owner_id?: string;
  owner_name?: string;
  support_group?: string;
  vendor?: string;
  model?: string;
  serial_number?: string;
  version?: string;
  ip_address?: string;
  fqdn?: string;
  attributes: Record<string, any>;
  discovery_source: DiscoverySource;
  discovery_id?: string;
  last_discovered?: string;
  install_date?: string;
  warranty_expiry?: string;
  end_of_life?: string;
  decommission_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  tenant_id?: string;
}

export interface CIRelationship {
  id?: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  direction: RelationshipDirection;
  description?: string;
  created_at: string;
  created_by: string;
  tenant_id?: string;
}

export interface CIHistory {
  id?: string;
  ci_id: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_reason?: string;
  changed_by: string;
  changed_at: string;
}

export interface CreateCIRequest {
  name: string;
  description?: string;
  ci_class: CIClass;
  ci_type: string;
  status: CIStatus;
  criticality: CICriticality;
  environment?: string;
  location?: string;
  owner_id?: string;
  support_group?: string;
  vendor?: string;
  model?: string;
  serial_number?: string;
  version?: string;
  ip_address?: string;
  fqdn?: string;
  attributes?: Record<string, any>;
  discovery_source?: DiscoverySource;
  tags?: string[];
  install_date?: string;
  warranty_expiry?: string;
  end_of_life?: string;
}

export interface UpdateCIRequest {
  name?: string;
  description?: string;
  ci_type?: string;
  status?: CIStatus;
  criticality?: CICriticality;
  environment?: string;
  location?: string;
  owner_id?: string;
  support_group?: string;
  vendor?: string;
  model?: string;
  serial_number?: string;
  version?: string;
  ip_address?: string;
  fqdn?: string;
  attributes?: Record<string, any>;
  tags?: string[];
  install_date?: string;
  warranty_expiry?: string;
  end_of_life?: string;
  change_reason?: string;
}

export interface CISearchRequest {
  query?: string;
  ci_class?: CIClass;
  ci_type?: string;
  status?: CIStatus[];
  criticality?: CICriticality[];
  environment?: string;
  location?: string;
  owner_id?: string;
  support_group?: string;
  tags?: string[];
  page?: number;
  page_size?: number;
}

export interface CIListResponse {
  items: ConfigurationItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CIRelationshipExpanded {
  relationship: CIRelationship;
  related_ci: ConfigurationItem;
}

export interface CIDetailResponse {
  ci: ConfigurationItem;
  relationships: CIRelationshipExpanded[];
  history: CIHistory[];
  linked_tickets: string[];
}

export interface CreateRelationshipRequest {
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  direction?: RelationshipDirection;
  description?: string;
}

export interface ImpactAnalysisRequest {
  ci_id: string;
  depth?: number;
  relationship_types?: RelationshipType[];
}

export interface ImpactedCI {
  ci: ConfigurationItem;
  distance: number;
  path: string[];
  relationship_type: RelationshipType;
}

export interface ImpactAnalysisResponse {
  source_ci: ConfigurationItem;
  impacted_cis: ImpactedCI[];
  total_impact_count: number;
}

// ============================================================================
// API CLIENT
// ============================================================================

const API_BASE_URL = 'http://localhost:3001/api/v1/cmdb';

class CMDBApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'CMDBApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // TODO: Add JWT token from auth store
  // const token = authStore.getToken();
  // if (token) {
  //   defaultHeaders['Authorization'] = `Bearer ${token}`;
  // }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // Use default error message if parsing fails
    }
    
    throw new CMDBApiError(response.status, errorMessage, errorBody);
  }

  return response.json();
}

// ============================================================================
// CONFIGURATION ITEM OPERATIONS
// ============================================================================

export async function listCIs(params?: CISearchRequest): Promise<CIListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.query) queryParams.append('query', params.query);
  if (params?.ci_class) queryParams.append('ci_class', params.ci_class);
  if (params?.ci_type) queryParams.append('ci_type', params.ci_type);
  if (params?.environment) queryParams.append('environment', params.environment);
  if (params?.location) queryParams.append('location', params.location);
  if (params?.owner_id) queryParams.append('owner_id', params.owner_id);
  if (params?.support_group) queryParams.append('support_group', params.support_group);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

  const query = queryParams.toString();
  const endpoint = query ? `/cis?${query}` : '/cis';
  
  return apiRequest<CIListResponse>(endpoint);
}

export async function getCIById(id: string): Promise<CIDetailResponse> {
  return apiRequest<CIDetailResponse>(`/cis/${id}`);
}

export async function getCIByCIId(ci_id: string): Promise<CIDetailResponse> {
  return apiRequest<CIDetailResponse>(`/cis/by-ci-id/${ci_id}`);
}

export async function createCI(request: CreateCIRequest): Promise<ConfigurationItem> {
  return apiRequest<ConfigurationItem>('/cis', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateCI(
  id: string,
  request: UpdateCIRequest
): Promise<ConfigurationItem> {
  return apiRequest<ConfigurationItem>(`/cis/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export async function deleteCI(id: string): Promise<void> {
  await apiRequest<void>(`/cis/${id}`, {
    method: 'DELETE',
  });
}

export async function searchCIs(request: CISearchRequest): Promise<CIListResponse> {
  return apiRequest<CIListResponse>('/cis/search', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================================================
// RELATIONSHIP OPERATIONS
// ============================================================================

export async function createRelationship(
  request: CreateRelationshipRequest
): Promise<CIRelationship> {
  return apiRequest<CIRelationship>('/relationships', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function deleteRelationship(id: string): Promise<void> {
  await apiRequest<void>(`/relationships/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// IMPACT ANALYSIS
// ============================================================================

export async function analyzeImpact(
  ci_id: string,
  depth?: number,
  relationship_types?: RelationshipType[]
): Promise<ImpactAnalysisResponse> {
  const queryParams = new URLSearchParams();
  if (depth) queryParams.append('depth', depth.toString());
  if (relationship_types?.length) {
    relationship_types.forEach(type => queryParams.append('relationship_types', type));
  }

  const query = queryParams.toString();
  const endpoint = query ? `/cis/${ci_id}/impact?${query}` : `/cis/${ci_id}/impact`;
  
  return apiRequest<ImpactAnalysisResponse>(endpoint);
}

// ============================================================================
// HISTORY
// ============================================================================

export async function getCIHistory(ci_id: string): Promise<CIHistory[]> {
  return apiRequest<CIHistory[]>(`/cis/${ci_id}/history`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCIStatusColor(status: CIStatus): string {
  const statusColors: Record<CIStatus, string> = {
    PLANNED: '#6B7280',
    ORDERED: '#3B82F6',
    RECEIVED: '#8B5CF6',
    IN_STOCK: '#A855F7',
    DEPLOYED: '#10B981',
    ACTIVE: '#059669',
    MAINTENANCE: '#F59E0B',
    OFFLINE: '#EF4444',
    DECOMMISSIONED: '#DC2626',
    RETIRED: '#991B1B',
    FAILED: '#7F1D1D',
  };
  return statusColors[status] || '#6B7280';
}

export function getCICriticalityColor(criticality: CICriticality): string {
  const criticalityColors: Record<CICriticality, string> = {
    CRITICAL: '#DC2626',
    HIGH: '#F59E0B',
    MEDIUM: '#3B82F6',
    LOW: '#10B981',
    NONE: '#6B7280',
  };
  return criticalityColors[criticality] || '#6B7280';
}

export function getCIClassIcon(ciClass: CIClass): string {
  const icons: Record<CIClass, string> = {
    HARDWARE: '🖥️',
    SOFTWARE: '💿',
    SERVICE: '🌐',
    DOCUMENT: '📄',
    NETWORK: '🌐',
    CLOUD: '☁️',
    CONTAINER: '📦',
    DATABASE: '🗄️',
    VIRTUAL: '💻',
  };
  return icons[ciClass] || '📦';
}

export default {
  listCIs,
  getCIById,
  getCIByCIId,
  createCI,
  updateCI,
  deleteCI,
  searchCIs,
  createRelationship,
  deleteRelationship,
  analyzeImpact,
  getCIHistory,
  getCIStatusColor,
  getCICriticalityColor,
  getCIClassIcon,
};
