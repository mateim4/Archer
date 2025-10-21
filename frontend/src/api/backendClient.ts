/**
 * Lightweight client for calling the Rust backend APIs. Uses REST endpoints so
 * the frontend can run in both web and Tauri environments without relying on
 * proprietary IPC commands.
 */
export class BackendApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'BackendApiError';
    this.status = status;
    this.details = details;
  }
}

type SurrealThing =
  | string
  | { id?: string | { String?: string }; tb?: string }
  | { value?: string };

type RvToolsStatusApi = 'uploaded' | 'processing' | 'processed' | 'failed';

type RvToolsProcessingErrorApi = {
  line_number: number;
  server_name: string;
  error: string;
};

type RvToolsProcessingSummaryApi = {
  total_cpu_cores: number;
  total_memory_gb: number;
  unique_vendors: string[];
  deployment_recommendations: string[];
};

type RvToolsUploadResponseApi = {
  upload_id: SurrealThing;
  servers_processed: number;
  servers_added_to_pool: number;
  processing_errors: RvToolsProcessingErrorApi[];
  summary: RvToolsProcessingSummaryApi;
  upload_timestamp: string;
};

type RvToolsUploadEntryApi = {
  id?: SurrealThing;
  project_id: SurrealThing;
  workflow_id?: SurrealThing | null;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  file_hash: string;
  upload_status: RvToolsStatusApi;
  processing_results?: Record<string, unknown> | null;
  total_vms?: number | null;
  total_hosts?: number | null;
  total_clusters?: number | null;
  vcenter_version?: string | null;
  environment_name?: string | null;
  metadata: Record<string, unknown>;
  uploaded_at: string;
  processed_at?: string | null;
  uploaded_by: string;
};

type RvToolsUploadsListResponseApi = {
  uploads: RvToolsUploadEntryApi[];
  total: number;
};

export type RvToolsProcessingError = {
  lineNumber: number;
  serverName: string;
  error: string;
};

export type RvToolsProcessingSummary = {
  totalCpuCores: number;
  totalMemoryGb: number;
  uniqueVendors: string[];
  deploymentRecommendations: string[];
};

export type RvToolsUploadSummary = {
  uploadId: string;
  serversProcessed: number;
  serversAddedToPool: number;
  processingErrors: RvToolsProcessingError[];
  summary: RvToolsProcessingSummary;
  uploadTimestamp: string;
};

export type RvToolsUploadRecord = {
  id: string;
  projectId: string;
  workflowId: string | null;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  fileHash: string;
  status: RvToolsStatusApi;
  totalVms: number | null;
  totalHosts: number | null;
  totalClusters: number | null;
  vcenterVersion: string | null;
  environmentName: string | null;
  uploadedAt: string;
  processedAt: string | null;
  uploadedBy: string;
  processingResults: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
};

export type ListRvToolsUploadsFilters = {
  projectId?: string;
  processed?: boolean;
  limit?: number;
};

export type UploadRvToolsOptions = {
  projectId?: string;
};

type AvailabilityStatusApi =
  | 'available'
  | 'allocated'
  | 'maintenance'
  | 'retired'
  | 'failed';

type MaintenanceWindowApi = {
  start_time: string;
  end_time: string;
  maintenance_type: string;
  description: string;
};

type HardwarePoolServerApi = {
  id?: SurrealThing;
  asset_tag: string;
  serial_number?: string | null;
  vendor: string;
  model: string;
  form_factor?: string | null;
  cpu_sockets?: number | null;
  cpu_cores_total?: number | null;
  memory_gb?: number | null;
  storage_type?: string | null;
  storage_capacity_gb?: number | null;
  network_ports?: number | null;
  power_consumption_watts?: number | null;
  rack_units?: number | null;
  availability_status: AvailabilityStatusApi;
  location?: string | null;
  datacenter?: string | null;
  rack_position?: string | null;
  available_from_date: string;
  available_until_date?: string | null;
  maintenance_schedule: MaintenanceWindowApi[];
  acquisition_cost?: number | null;
  monthly_cost?: number | null;
  warranty_expires?: string | null;
  support_level?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ServersListResponse = {
  servers: HardwarePoolServerApi[];
  total: number;
};

type CreateHardwarePoolPayload = {
  asset_tag: string;
  serial_number?: string | null;
  vendor: string;
  model: string;
  form_factor?: string | null;
  cpu_sockets?: number | null;
  cpu_cores_total?: number | null;
  memory_gb?: number | null;
  storage_type?: string | null;
  storage_capacity_gb?: number | null;
  network_ports?: number | null;
  power_consumption_watts?: number | null;
  rack_units?: number | null;
  location?: string | null;
  datacenter?: string | null;
  rack_position?: string | null;
  available_until_date?: string | null;
  acquisition_cost?: number | null;
  monthly_cost?: number | null;
  warranty_expires?: string | null;
  support_level?: string | null;
};

type UpdateHardwarePoolPayload = {
  cpu_cores_total?: number | null;
  memory_gb?: number | null;
  storage_capacity_gb?: number | null;
  location?: string | null;
  rack_position?: string | null;
};

export type NormalizedHardwarePoolServer = {
  id: string;
  assetTag: string;
  vendor: string;
  model: string;
  cpuCoresTotal: number | null;
  memoryGb: number | null;
  storageCapacityGb: number | null;
  availabilityStatus: AvailabilityStatusApi;
  location: string | null;
  datacenter: string | null;
  rackPosition: string | null;
  createdAt: string;
  updatedAt: string;
};

type HardwarePoolServerAggregate = {
  servers: NormalizedHardwarePoolServer[];
  total: number;
};

const DEFAULT_BASE_URL = 'http://localhost:3003';
const rawBaseUrl =
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_RUST_BACKEND_URL) ??
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) ??
  DEFAULT_BASE_URL;
const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

const mapStatusToUi = (status: AvailabilityStatusApi): AssetStatus => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'allocated':
      return 'InUse';
    case 'maintenance':
      return 'Maintenance';
    case 'retired':
      return 'Decommissioned';
    case 'failed':
    default:
      return 'Locked';
  }
};

const toNormalizedServer = (server: HardwarePoolServerApi): NormalizedHardwarePoolServer => ({
  id: extractThingId(server.id),
  assetTag: server.asset_tag,
  vendor: server.vendor,
  model: server.model,
  cpuCoresTotal: server.cpu_cores_total ?? null,
  memoryGb: server.memory_gb ?? null,
  storageCapacityGb: server.storage_capacity_gb ?? null,
  availabilityStatus: server.availability_status,
  location: server.location ?? null,
  datacenter: server.datacenter ?? null,
  rackPosition: server.rack_position ?? null,
  createdAt: server.created_at,
  updatedAt: server.updated_at,
});

const extractThingId = (thing: SurrealThing | undefined): string => {
  if (!thing) {
    throw new BackendApiError(500, 'Missing record identifier in response');
  }

  if (typeof thing === 'string') {
    const separatorIndex = thing.indexOf(':');
    return separatorIndex >= 0 ? thing.slice(separatorIndex + 1) : thing;
  }

  if ('id' in thing && thing.id) {
    const rawId = thing.id;
    if (typeof rawId === 'string') {
      return rawId;
    }

    if (rawId && typeof rawId === 'object' && 'String' in rawId) {
      const potential = (rawId as { String?: string }).String;
      if (typeof potential === 'string') {
        return potential;
      }
    }
  }

  if ('value' in thing && typeof thing.value === 'string') {
    return thing.value;
  }

  throw new BackendApiError(500, 'Unable to determine record identifier');
};

const buildHeaders = (initHeaders: HeadersInit | undefined, body: BodyInit | null | undefined): HeadersInit => {
  const headers = new Headers(initHeaders);

  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  return headers;
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${sanitizedPath}`;
  const headers = buildHeaders(init.headers, init.body ?? null);

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });

  if (!response.ok) {
    let errorDetails: unknown;
    try {
      errorDetails = await response.json();
    } catch (parseError) {
      errorDetails = { message: 'Failed to parse error response', parseError };
    }

    const message =
      (typeof errorDetails === 'object' && errorDetails !== null && 'error' in errorDetails && typeof (errorDetails as { error?: string }).error === 'string'
        ? (errorDetails as { error?: string }).error
        : undefined) ??
      response.statusText ??
      'Unknown backend error';

    throw new BackendApiError(response.status, message, errorDetails);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const hardwareServerAggregate = (servers: HardwarePoolServerApi[], total: number): HardwarePoolServerAggregate => ({
  servers: servers.map(toNormalizedServer),
  total,
});

const toRvToolsProcessingSummary = (summary: RvToolsProcessingSummaryApi): RvToolsProcessingSummary => ({
  totalCpuCores: summary.total_cpu_cores,
  totalMemoryGb: summary.total_memory_gb,
  uniqueVendors: summary.unique_vendors,
  deploymentRecommendations: summary.deployment_recommendations,
});

const toRvToolsProcessingError = (error: RvToolsProcessingErrorApi): RvToolsProcessingError => ({
  lineNumber: error.line_number,
  serverName: error.server_name,
  error: error.error,
});

const normalizeRvToolsUploadResponse = (payload: RvToolsUploadResponseApi): RvToolsUploadSummary => ({
  uploadId: extractThingId(payload.upload_id),
  serversProcessed: payload.servers_processed,
  serversAddedToPool: payload.servers_added_to_pool,
  processingErrors: payload.processing_errors.map(toRvToolsProcessingError),
  summary: toRvToolsProcessingSummary(payload.summary),
  uploadTimestamp: payload.upload_timestamp,
});

const toRvToolsUploadRecord = (entry: RvToolsUploadEntryApi): RvToolsUploadRecord => ({
  id: entry.id ? extractThingId(entry.id) : `${entry.file_name}-${entry.uploaded_at}`,
  projectId: extractThingId(entry.project_id),
  workflowId: entry.workflow_id ? extractThingId(entry.workflow_id) : null,
  fileName: entry.file_name,
  filePath: entry.file_path,
  fileSizeBytes: entry.file_size_bytes,
  fileHash: entry.file_hash,
  status: entry.upload_status,
  totalVms: entry.total_vms ?? null,
  totalHosts: entry.total_hosts ?? null,
  totalClusters: entry.total_clusters ?? null,
  vcenterVersion: entry.vcenter_version ?? null,
  environmentName: entry.environment_name ?? null,
  uploadedAt: entry.uploaded_at,
  processedAt: entry.processed_at ?? null,
  uploadedBy: entry.uploaded_by,
  processingResults: entry.processing_results ?? null,
  metadata: entry.metadata,
});

const buildQueryString = (params: Record<string, string | number | boolean | undefined>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    query.append(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

type AssetStatus =
  | 'Available'
  | 'InUse'
  | 'Locked'
  | 'Maintenance'
  | 'Decommissioned';

export const BackendClient = {
  async listHardwarePoolServers(): Promise<HardwarePoolServerAggregate> {
    const { servers, total } = await request<ServersListResponse>('/api/hardware-pool/servers');
    return hardwareServerAggregate(servers, total);
  },

  async createHardwarePoolServer(payload: CreateHardwarePoolPayload): Promise<NormalizedHardwarePoolServer> {
    const server = await request<HardwarePoolServerApi>('/api/hardware-pool/servers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return toNormalizedServer(server);
  },

  async updateHardwarePoolServer(serverId: string, payload: UpdateHardwarePoolPayload): Promise<NormalizedHardwarePoolServer> {
    const server = await request<HardwarePoolServerApi>(`/api/hardware-pool/servers/${serverId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return toNormalizedServer(server);
  },

  async deleteHardwarePoolServer(serverId: string): Promise<void> {
    await request(`/api/hardware-pool/servers/${serverId}`, {
      method: 'DELETE',
    });
  },

  mapToStoreAsset(server: NormalizedHardwarePoolServer) {
    return {
      id: server.id,
      name: server.assetTag,
      manufacturer: server.vendor,
      model: server.model,
      cpu_cores: server.cpuCoresTotal ?? 0,
      memory_gb: server.memoryGb ?? 0,
      storage_capacity_gb: server.storageCapacityGb ?? 0,
      status: mapStatusToUi(server.availabilityStatus),
      location: server.location ?? 'N/A',
      created_at: server.createdAt,
      updated_at: server.updatedAt,
    } satisfies {
      id: string;
      name: string;
      manufacturer: string;
      model: string;
      cpu_cores: number;
      memory_gb: number;
      storage_capacity_gb: number;
      status: AssetStatus;
      location: string;
      created_at: string;
      updated_at: string;
    };
  },

  async uploadRvToolsReport(file: File, options: UploadRvToolsOptions = {}): Promise<RvToolsUploadSummary> {
    const formData = new FormData();
    formData.append('file', file);

    if (options.projectId) {
      formData.append('project_id', options.projectId);
    }

    const response = await request<RvToolsUploadResponseApi>('/api/rvtools/upload', {
      method: 'POST',
      body: formData,
    });

    return normalizeRvToolsUploadResponse(response);
  },

  async listRvToolsUploads(filters: ListRvToolsUploadsFilters = {}): Promise<RvToolsUploadRecord[]> {
    const query = buildQueryString({
      project_id: filters.projectId,
      processed: filters.processed,
      limit: filters.limit,
    });

    const { uploads } = await request<RvToolsUploadsListResponseApi>(`/api/rvtools/uploads${query}`);
    return uploads.map(toRvToolsUploadRecord);
  },
};

export type CreateHardwareAssetInput = {
  name: string;
  manufacturer: string;
  model: string;
  cpuCores: number;
  memoryGb: number;
  storageCapacityGb: number;
  location: string;
  rackUnits?: number;
  datacenter?: string;
  rackPosition?: string;
};

export const buildCreateHardwarePayload = (asset: CreateHardwareAssetInput): CreateHardwarePoolPayload => ({
  asset_tag: asset.name,
  vendor: asset.manufacturer,
  model: asset.model,
  cpu_cores_total: asset.cpuCores,
  memory_gb: asset.memoryGb,
  storage_capacity_gb: asset.storageCapacityGb,
  rack_units: asset.rackUnits ?? 2,
  location: asset.location,
  datacenter: asset.datacenter ?? null,
  rack_position: asset.rackPosition ?? null,
});

export const buildUpdateHardwarePayload = (asset: CreateHardwareAssetInput): UpdateHardwarePoolPayload => ({
  cpu_cores_total: asset.cpuCores,
  memory_gb: asset.memoryGb,
  storage_capacity_gb: asset.storageCapacityGb,
  location: asset.location,
});
