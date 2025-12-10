// Default API base points to the local legacy backend
// You can override with VITE_API_BASE_URL (e.g., http://localhost:3001)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Mock data for development when backend is unavailable
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Enterprise Infrastructure Upgrade',
    description: 'Complete overhaul of company server infrastructure with new Dell PowerEdge servers and storage solutions.',
    owner_id: 'user:john.doe',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'proj-2', 
    name: 'Cloud Migration Project',
    description: 'Migrating legacy applications to AWS cloud infrastructure with hybrid connectivity solutions.',
    owner_id: 'user:jane.smith',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 'proj-3',
    name: 'Data Center Modernization',
    description: 'Updating data center with energy-efficient hardware and improved cooling systems.',
    owner_id: 'user:mike.wilson',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 'proj-4',
    name: 'Network Security Enhancement',
    description: 'Implementing next-generation firewalls and intrusion detection systems across all branches.',
    owner_id: 'user:sarah.davis',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'proj-5',
    name: 'IoT Infrastructure Deployment',
    description: 'Rolling out IoT sensors and edge computing devices for smart building management.',
    owner_id: 'user:alex.brown',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  }
];

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  owner_id: string;
  project_type?: 'migration' | 'deployment' | 'upgrade' | 'custom';
  project_types?: ('migration' | 'deployment' | 'upgrade' | 'custom')[];
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  start_date?: string;
  target_end_date?: string;
}

export interface HardwareItem {
  id: string;
  project_id: string;
  name: string;
  vendor: string;
  model: string;
  specs: any;
}

export interface CreateHardwareRequest {
  name: string;
  vendor: string;
  model: string;
  specs: any;
}

export interface DesignDocument {
  id: string;
  project_id: string;
  name: string;
  doc_type: string;
  content: string;
}

export interface CreateDesignDocRequest {
  name: string;
  doc_type: string;
  content: string;
}

export interface HardwareBasket {
  id: string;
  name: string;
  vendor: string;
  quarter: string;
  year: number;
  filename: string;
  quotation_date: string;
  created_at: string;
  total_models: number;
  total_configurations: number;
}

export interface HardwareModel {
  id: string;
  basket_id: string;
  lot_description: string;
  model_name: string;
  model_number: string;
  category: string;
  form_factor: string;
  vendor: string;
  processor_info: string;
  ram_info: string;
  network_info: string;
  quotation_date: string;
  created_at?: string;
  updated_at?: string;
  base_specifications?: any;
}

export interface HardwareConfiguration {
  id: string;
  model_id: string;
  part_number: string;
  description: string;
  category: string;
  quantity: number;
  specifications: any;
}

export interface CreateHardwareBasketRequest {
  name: string;
  vendor: string;
  quarter: string;
  year: number;
}

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  type: 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'SERVICE_REQUEST';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  related_asset?: string;
  related_project?: string;
  assignee?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  ticket_type: 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'SERVICE_REQUEST';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignee?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  related_asset?: string;
  related_project?: string;
}

export interface CreateTicketRequest {
  title: string;
  description?: string;
  ticket_type: Ticket['ticket_type'];
  priority: Ticket['priority'];
  assignee?: string;
  related_asset?: string;
  related_project?: string;
  created_by: string;
}

// ===== Ticket Comments =====
export type CommentType = 'NOTE' | 'WORKAROUND' | 'SOLUTION' | 'CUSTOMER_RESPONSE' | 'STATUS_UPDATE';

export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  author_name: string;
  is_internal: boolean;
  comment_type: CommentType;
  attachments: CommentAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CommentAttachment {
  filename: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface CreateCommentRequest {
  content: string;
  is_internal: boolean;
  comment_type?: CommentType;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH';
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  external_id?: string;
  raw_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface AssetMetrics {
  asset_id: string;
  cpu_usage: MetricPoint[];
  memory_usage: MetricPoint[];
  storage_usage: MetricPoint[];
  network_throughput: MetricPoint[];
}

export interface DashboardSummary {
  total_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  avg_cluster_health: number;
  active_incidents: number;
}

// ===== Admin User Management Types =====
export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  status: AdminUserStatus;
  roles: AdminRoleInfo[];
  permissions: string[];
  last_login?: string;
  failed_login_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  tenant_id?: string;
}

export interface AdminRoleInfo {
  id: string;
  name: string;
  display_name: string;
}

export interface AdminRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute';
  is_system: boolean;
  created_at: string;
}

export interface CreateAdminUserRequest {
  email: string;
  username: string;
  password: string;
  display_name: string;
  roles: string[];  // Role IDs
}

export interface UpdateAdminUserRequest {
  display_name?: string;
  status?: AdminUserStatus;
  roles?: string[];  // Role IDs
}

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];  // Permission IDs
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  permissions?: string[];
}

export interface AuditLogEntry {
  id: string;
  event_type: string;
  user_id?: string;
  username?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  tenant_id?: string;
  created_at: string;
}

// ===== Knowledge Base Types =====
export type KBArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type KBArticleVisibility = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  category_id?: string;
  tags: string[];
  status: KBArticleStatus;
  visibility: KBArticleVisibility;
  version: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  related_articles: string[];
  seo_title?: string;
  seo_description?: string;
  author_id: string;
  author_name: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface CreateKBArticleRequest {
  title: string;
  summary?: string;
  content: string;
  category_id?: string;
  tags?: string[];
  visibility?: KBArticleVisibility;
  seo_title?: string;
  seo_description?: string;
  expires_at?: string;
}

export interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  article_count: number;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKBCategoryRequest {
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  display_order?: number;
}

export interface KBArticleVersion {
  id: string;
  article_id: string;
  version: number;
  title: string;
  content: string;
  change_summary?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface KBStatistics {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  total_categories: number;
  total_views: number;
  avg_rating: number;
}

// ============================================================================
// SERVICE CATALOG TYPES
// ============================================================================

export interface CatalogCategory {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CatalogItem {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  icon?: string;
  short_description: string;
  delivery_time_days?: number;
  cost?: number;
  is_active: boolean;
  form_schema: any; // JSON Schema object
  approval_required: boolean;
  approval_group?: string;
  fulfillment_group?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCatalogItemRequest {
  name: string;
  description: string;
  category_id: string;
  icon?: string;
  short_description: string;
  delivery_time_days?: number;
  cost?: number;
  is_active: boolean;
  form_schema: any; // JSON Schema object
  approval_required: boolean;
  approval_group?: string;
  fulfillment_group?: string;
}

export interface UpdateCatalogItemRequest {
  name?: string;
  description?: string;
  category_id?: string;
  icon?: string;
  short_description?: string;
  delivery_time_days?: number;
  cost?: number;
  is_active?: boolean;
  form_schema?: any;
  approval_required?: boolean;
  approval_group?: string;
  fulfillment_group?: string;
}

export interface ServiceRequest {
  id?: string;
  catalog_item_id: string;
  requester_id: string;
  form_data: any; // JSON object matching the form_schema
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  rejection_reason?: string;
}

export interface CreateServiceRequestRequest {
  catalog_item_id: string;
  form_data: any;
}

export class ApiClient {
  private baseUrl: string;
  private usingMockData: boolean = false;
  private getAccessToken: (() => string | null) | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set a function to retrieve the current access token
   * This should be called by AuthContext to provide token access
   */
  public setTokenProvider(provider: () => string | null) {
    this.getAccessToken = provider;
  }

  public isUsingMockData(): boolean {
    return this.usingMockData;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Add Authorization header if token is available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.getAccessToken) {
      const token = this.getAccessToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        ...options,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let data: any = undefined;
        try {
          data = await response.json();
        } catch (_) {}
        const message = data?.message || data?.error || `${response.status} ${response.statusText}`;
        
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Trigger logout by dispatching custom event
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        throw new ApiError(response.status, message, data);
      }

      this.usingMockData = false;
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // If it's a timeout or network error, use mock data for GET requests
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      
      if (isTimeout || isNetworkError) {
        if (options.method === undefined || options.method === 'GET') {
          console.warn('Backend unavailable (timeout or connection error), using mock data for:', endpoint);
          this.usingMockData = true;
          return this.getMockResponse<T>(endpoint);
        }
      }
      throw error;
    }
  }

  private getMockResponse<T>(endpoint: string): T {
    switch (endpoint) {
      case '/projects':
      case '/api/projects':
        // Return raw array to mimic backend shape commonly used by our servers
        return (MOCK_PROJECTS as unknown) as T;
      case '/health':
        return { status: 'ok', message: 'Mock API is running', version: '0.1.0-mock' } as T;
      case '/api/hardware-baskets':
      case '/hardware-baskets':
        return [
          {
            id: 'basket-1',
            name: 'Dell PowerEdge R750 Portfolio',
            vendor: 'Dell',
            quarter: 'Q2',
            year: 2024,
            filename: 'dell-poweredge-r750-pricing.xlsx',
            quotation_date: '2024-04-15',
            created_at: '2024-04-15T10:30:00Z',
            total_models: 15,
            total_configurations: 45
          },
          {
            id: 'basket-2', 
            name: 'HPE ProLiant DL380 Gen11',
            vendor: 'HPE',
            quarter: 'Q1',
            year: 2024,
            filename: 'hpe-proliant-dl380-gen11.xlsx',
            quotation_date: '2024-01-20',
            created_at: '2024-01-20T14:15:00Z',
            total_models: 8,
            total_configurations: 24
          },
          {
            id: 'basket-3',
            name: 'Lenovo ThinkSystem SR650 V3',
            vendor: 'Lenovo',
            quarter: 'Q3',
            year: 2024,
            filename: 'lenovo-thinksystem-sr650-v3.xlsx',
            quotation_date: '2024-07-10',
            created_at: '2024-07-10T09:45:00Z',
            total_models: 12,
            total_configurations: 36
          }
        ] as T;
      default:
        // Basic support for project by id in mock mode
        if (endpoint.startsWith('/projects/') || endpoint.startsWith('/api/projects/')) {
          const id = endpoint.split('/').pop() as string;
          const found = MOCK_PROJECTS.find(p => p.id === id);
          if (found) return (found as unknown) as T;
        }
        throw new Error(`No mock data available for endpoint: ${endpoint}`);
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; message: string; version: string }> {
    // Call health at server root
    const base = this.baseUrl.replace(/\/$/, '');
    const root = base.replace(/\/api$/, '');
    return fetch(`${root}/health`).then(r => r.json());
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    // Prefer /api/projects for local backend
    const response = await this.request<any>('/api/projects');
    const rawProjects: any[] = Array.isArray(response)
      ? response
      : (response?.data ?? []);

    // Transform backend format to frontend format
    return rawProjects.map(project => ({
      id: this.extractId(project.id),
      name: project.name || 'Untitled Project',
      description: project.description || '',
      owner_id: project.owner_id || project.created_by || project.assigned_to || 'user:system',
      created_at: project.created_at || new Date().toISOString(),
      updated_at: project.updated_at || new Date().toISOString(),
    }));
  }

  private extractId(id: any): string {
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.id) {
      return typeof id.id === 'string' ? id.id : id.id.String || String(id.id);
    }
    return String(id);
  }

  async createProject(project: CreateProjectRequest): Promise<void> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getProject(id: string): Promise<Project> {
    const project = await this.request<any>(`/api/projects/${id}`);
    
    // Transform backend format to frontend format
    return {
      id: this.extractId(project.id),
      name: project.name || 'Untitled Project',
      description: project.description || '',
      owner_id: project.owner_id || project.created_by || project.assigned_to || 'user:system',
      created_at: project.created_at || new Date().toISOString(),
      updated_at: project.updated_at || new Date().toISOString(),
    };
  }

  async updateProject(id: string, project: Partial<CreateProjectRequest>): Promise<void> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Hardware
  async getHardware(projectId: string): Promise<HardwareItem[]> {
    return this.request(`/api/projects/${projectId}/hardware`);
  }

  async createHardware(projectId: string, hardware: CreateHardwareRequest): Promise<HardwareItem> {
    return this.request(`/api/projects/${projectId}/hardware`, {
      method: 'POST',
      body: JSON.stringify(hardware),
    });
  }

  async updateHardware(projectId: string, hardwareId: string, hardware: Partial<CreateHardwareRequest>): Promise<HardwareItem> {
    return this.request(`/api/projects/${projectId}/hardware/${hardwareId}`, {
      method: 'PUT',
      body: JSON.stringify(hardware),
    });
  }

  async deleteHardware(projectId: string, hardwareId: string): Promise<void> {
    return this.request(`/api/projects/${projectId}/hardware/${hardwareId}`, {
      method: 'DELETE',
    });
  }

  // Design Document methods
  async getDesignDocs(projectId: string): Promise<DesignDocument[]> {
    return this.request(`/api/projects/${projectId}/design-docs`);
  }

  async createDesignDoc(projectId: string, doc: CreateDesignDocRequest): Promise<DesignDocument> {
    return this.request(`/api/projects/${projectId}/design-docs`, {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  }

  async getDesignDoc(projectId: string, docId: string): Promise<DesignDocument> {
    return this.request(`/api/projects/${projectId}/design-docs/${docId}`);
  }

  async updateDesignDoc(projectId: string, docId: string, doc: Partial<CreateDesignDocRequest>): Promise<DesignDocument> {
    return this.request(`/api/projects/${projectId}/design-docs/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(doc),
    });
  }

  async deleteDesignDoc(projectId: string, docId: string): Promise<void> {
    return this.request(`/api/projects/${projectId}/design-docs/${docId}`, {
      method: 'DELETE',
    });
  }

  // Hardware Basket methods
  async getHardwareBaskets(): Promise<HardwareBasket[]> {
    const rawBaskets = await this.request<any[]>('/hardware-baskets');
    
    // Transform backend format to frontend format
    return rawBaskets.map(basket => ({
      id: this.extractId(basket.id),
      name: basket.name || 'Untitled Basket',
      vendor: basket.vendor || 'Unknown',
      quarter: basket.quarter || 'Q1',
      year: basket.year || new Date().getFullYear(),
      filename: basket.file_path || `${basket.vendor || 'hardware'}-basket.xlsx`,
      quotation_date: basket.import_date || basket.created_at,
      created_at: basket.created_at,
      total_models: basket.total_models || 0,
      total_configurations: basket.total_configurations || 0
    }));
  }

  async createHardwareBasket(basket: CreateHardwareBasketRequest): Promise<HardwareBasket> {
    return this.request('/hardware-baskets', {
      method: 'POST',
      body: JSON.stringify(basket),
    });
  }

  async uploadHardwareBasketFile(basketId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/hardware-baskets/${basketId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getHardwareBasketModels(basketId: string): Promise<HardwareModel[]> {
    return this.request(`/hardware-baskets/${basketId}/models`);
  }

  async getModelConfigurations(modelId: string): Promise<HardwareConfiguration[]> {
    return this.request(`/hardware-models/${modelId}/configurations`);
  }

  // ===== Activities (Stage 1) =====
  async getActivities(projectId: string): Promise<any[]> {
    return this.request(`/api/projects/${projectId}/activities`);
  }

  async createActivity(projectId: string, data: {
    name: string;
    description?: string;
    activity_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    due_date?: string;
    assignee_id?: string;
    dependencies?: string[];
    progress_percentage?: number;
  }): Promise<any> {
    return this.request(`/api/projects/${projectId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivity(activityId: string, updates: Partial<{ [k: string]: any }>): Promise<any> {
    return this.request(`/api/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteActivity(activityId: string): Promise<void> {
    return this.request(`/api/activities/${activityId}`, { method: 'DELETE' });
  }

  // ===== Hardware Allocations (Stage 1) =====
  async getAllocationsByProject(projectId: string): Promise<any[]> {
    return this.request(`/api/projects/${projectId}/allocations`);
  }

  async getAllocationsByActivity(activityId: string): Promise<any[]> {
    return this.request(`/api/activities/${activityId}/allocations`);
  }

  async createAllocation(projectId: string, data: {
    activity_id?: string;
    server_id: string;
    allocation_type?: string;
    allocation_start?: string;
    allocation_end?: string | null;
    purpose?: string;
    configuration_notes?: string;
  }): Promise<any> {
    return this.request(`/api/projects/${projectId}/allocations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAllocation(allocationId: string, updates: Partial<{ [k: string]: any }>): Promise<any> {
    return this.request(`/api/allocations/${allocationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    return this.request(`/api/allocations/${allocationId}`, { method: 'DELETE' });
  }

  // ===== Local Users (Stage 1) =====
  async getUsers(): Promise<any[]> {
    return this.request('/api/users');
  }

  async createUser(data: { email: string; roles?: string[]; active?: boolean }): Promise<any> {
    return this.request('/api/users', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateUser(userId: string, updates: Partial<{ roles: string[]; active: boolean }>): Promise<any> {
    return this.request(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request(`/api/users/${userId}`, { method: 'DELETE' });
  }

  // ===== Tickets (ITIL) =====
  async getTickets(): Promise<Ticket[]> {
    return this.request('/api/v1/tickets');
  }

  async getTicket(id: string): Promise<Ticket> {
    return this.request(`/api/v1/tickets/${id}`);
  }

  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    return this.request('/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    return this.request(`/api/v1/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTicket(id: string): Promise<void> {
    return this.request(`/api/v1/tickets/${id}`, { method: 'DELETE' });
  }

  // ===== Ticket Comments =====
  async getTicketComments(ticketId: string): Promise<{ data: TicketComment[]; count: number }> {
    const cleanId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    return this.request(`/api/v1/tickets/${cleanId}/comments`);
  }

  async addTicketComment(ticketId: string, data: CreateCommentRequest): Promise<TicketComment> {
    const cleanId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    return this.request(`/api/v1/tickets/${cleanId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTicketComment(ticketId: string, commentId: string): Promise<void> {
    const cleanTicketId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    const cleanCommentId = commentId.startsWith('ticket_comments:') ? commentId.split(':')[1] : commentId;
    return this.request(`/api/v1/tickets/${cleanTicketId}/comments/${cleanCommentId}`, {
      method: 'DELETE',
    });
  }

  // ===== Ticket Attachments =====
  async getTicketAttachments(ticketId: string): Promise<{ data: TicketAttachment[]; count: number }> {
    const cleanId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    return this.request(`/api/v1/tickets/${cleanId}/attachments`);
  }

  async uploadTicketAttachment(ticketId: string, file: File): Promise<TicketAttachment> {
    const cleanId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    const formData = new FormData();
    formData.append('file', file);

    const token = this.tokenProvider ? this.tokenProvider() : '';
    const response = await fetch(`${this.baseURL}/api/v1/tickets/${cleanId}/attachments`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async downloadTicketAttachment(ticketId: string, attachmentId: string): Promise<{ blob: Blob; filename: string }> {
    const cleanTicketId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    const cleanAttachmentId = attachmentId.startsWith('ticket_attachments:') ? attachmentId.split(':')[1] : attachmentId;
    
    const token = this.tokenProvider ? this.tokenProvider() : '';
    const response = await fetch(`${this.baseURL}/api/v1/tickets/${cleanTicketId}/attachments/${cleanAttachmentId}`, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'download'
      : 'download';

    return { blob, filename };
  }

  async deleteTicketAttachment(ticketId: string, attachmentId: string): Promise<void> {
    const cleanTicketId = ticketId.startsWith('ticket:') ? ticketId.split(':')[1] : ticketId;
    const cleanAttachmentId = attachmentId.startsWith('ticket_attachments:') ? attachmentId.split(':')[1] : attachmentId;
    return this.request(`/api/v1/tickets/${cleanTicketId}/attachments/${cleanAttachmentId}`, {
      method: 'DELETE',
    });
  }

  // ===== Assets (CMDB) =====
  async getAssets(filter?: { asset_type?: string; status?: string }): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    if (filter?.asset_type) queryParams.append('asset_type', filter.asset_type);
    if (filter?.status) queryParams.append('status', filter.status);
    
    return this.request(`/api/v1/assets?${queryParams.toString()}`);
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request(`/api/v1/assets/${id}`);
  }

  // ===== Monitoring =====
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request('/api/v1/monitoring/dashboard');
  }

  async getAssetMetrics(assetId: string): Promise<AssetMetrics> {
    return this.request(`/api/v1/monitoring/assets/${assetId}`);
  }

  // ===== Knowledge Base =====
  async getKBArticles(params?: {
    query?: string;
    category_id?: string;
    tags?: string[];
    status?: KBArticleStatus;
    page?: number;
    page_size?: number;
  }): Promise<KBArticle[]> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.tags) params.tags.forEach(tag => queryParams.append('tags', tag));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    return this.request(`/api/v1/knowledge-base/articles?${queryParams.toString()}`);
  }

  async getKBArticle(id: string): Promise<KBArticle> {
    return this.request(`/api/v1/knowledge-base/articles/${id}`);
  }

  async getKBArticleBySlug(slug: string): Promise<KBArticle> {
    return this.request(`/api/v1/knowledge-base/articles/by-slug/${slug}`);
  }

  async createKBArticle(data: CreateKBArticleRequest): Promise<KBArticle> {
    return this.request('/api/v1/knowledge-base/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKBArticle(id: string, data: Partial<CreateKBArticleRequest>): Promise<KBArticle> {
    return this.request(`/api/v1/knowledge-base/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKBArticle(id: string): Promise<void> {
    return this.request(`/api/v1/knowledge-base/articles/${id}`, {
      method: 'DELETE',
    });
  }

  async publishKBArticle(id: string): Promise<KBArticle> {
    return this.request(`/api/v1/knowledge-base/articles/${id}/publish`, {
      method: 'POST',
    });
  }

  async rateKBArticle(id: string, data: { is_helpful: boolean; feedback?: string }): Promise<void> {
    return this.request(`/api/v1/knowledge-base/articles/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getKBArticleVersions(id: string): Promise<KBArticleVersion[]> {
    return this.request(`/api/v1/knowledge-base/articles/${id}/versions`);
  }

  async searchKBArticles(query: string, params?: {
    category_id?: string;
    tags?: string[];
  }): Promise<KBArticle[]> {
    return this.request('/api/v1/knowledge-base/articles/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        category_id: params?.category_id,
        tags: params?.tags,
      }),
    });
  }

  async getKBCategories(): Promise<KBCategory[]> {
    return this.request('/api/v1/knowledge-base/categories');
  }

  async createKBCategory(data: CreateKBCategoryRequest): Promise<KBCategory> {
    return this.request('/api/v1/knowledge-base/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKBCategory(id: string, data: Partial<CreateKBCategoryRequest>): Promise<KBCategory> {
    return this.request(`/api/v1/knowledge-base/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKBCategory(id: string): Promise<void> {
    return this.request(`/api/v1/knowledge-base/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async getKBStatistics(): Promise<KBStatistics> {
    return this.request('/api/v1/knowledge-base/statistics');
  }

  // ===== User Management (Admin) =====
  async getAllUsers(): Promise<AdminUser[]> {
    const response = await this.request<any>('/api/v1/auth/users');
    return response.data || response || [];
  }

  async getAdminUser(userId: string): Promise<AdminUser> {
    const response = await this.request<any>(`/api/v1/auth/users/${userId}`);
    return response.data || response;
  }

  async createAdminUser(data: CreateAdminUserRequest): Promise<AdminUser> {
    const response = await this.request<any>('/api/v1/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  }

  async updateAdminUser(userId: string, data: UpdateAdminUserRequest): Promise<AdminUser> {
    const response = await this.request<any>(`/api/v1/auth/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data || response;
  }

  async deleteAdminUser(userId: string): Promise<void> {
    await this.request(`/api/v1/auth/users/${userId}`, { method: 'DELETE' });
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await this.request(`/api/v1/auth/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  // ===== Roles Management (Admin) =====
  async getAllRoles(): Promise<AdminRole[]> {
    const response = await this.request<any>('/api/v1/auth/roles');
    return response.data || response || [];
  }

  async getRole(roleId: string): Promise<AdminRole> {
    const response = await this.request<any>(`/api/v1/auth/roles/${roleId}`);
    return response.data || response;
  }

  async createRole(data: CreateRoleRequest): Promise<AdminRole> {
    const response = await this.request<any>('/api/v1/auth/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  }

  async updateRole(roleId: string, data: UpdateRoleRequest): Promise<AdminRole> {
    const response = await this.request<any>(`/api/v1/auth/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data || response;
  }

  async deleteRole(roleId: string): Promise<void> {
    await this.request(`/api/v1/auth/roles/${roleId}`, { method: 'DELETE' });
  }

  // ===== Permissions (Admin) =====
  async getAllPermissions(): Promise<AdminPermission[]> {
    const response = await this.request<any>('/api/v1/auth/permissions');
    return response.data || response || [];
  }

  // ===== Service Catalog =====
  
  // Categories
  async getCatalogCategories(params?: {
    parent_id?: string;
    is_active?: boolean;
  }): Promise<{ data: CatalogCategory[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.parent_id) queryParams.append('parent_id', params.parent_id);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    return this.request<{ data: CatalogCategory[]; count: number }>(
      `/api/v1/catalog/categories${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  async createCatalogCategory(data: CreateCategoryRequest): Promise<{ data: CatalogCategory; message: string }> {
    return this.request<{ data: CatalogCategory; message: string }>('/api/v1/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCatalogCategory(id: string, data: UpdateCategoryRequest): Promise<{ data: CatalogCategory; message: string }> {
    return this.request<{ data: CatalogCategory; message: string }>(`/api/v1/catalog/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCatalogCategory(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/catalog/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Catalog Items
  async getCatalogItems(params?: {
    category_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<{ data: CatalogItem[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    return this.request<{ data: CatalogItem[]; count: number }>(
      `/api/v1/catalog/items${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  async getCatalogItem(id: string): Promise<{ data: CatalogItem }> {
    return this.request<{ data: CatalogItem }>(`/api/v1/catalog/items/${id}`);
  }

  async createCatalogItem(data: CreateCatalogItemRequest): Promise<{ data: CatalogItem; message: string }> {
    return this.request<{ data: CatalogItem; message: string }>('/api/v1/catalog/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCatalogItem(id: string, data: UpdateCatalogItemRequest): Promise<{ data: CatalogItem; message: string }> {
    return this.request<{ data: CatalogItem; message: string }>(`/api/v1/catalog/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCatalogItem(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/catalog/items/${id}`, {
      method: 'DELETE',
    });
  }

  // Service Requests
  async createServiceRequest(data: CreateServiceRequestRequest): Promise<{ data: ServiceRequest; message: string }> {
    return this.request<{ data: ServiceRequest; message: string }>('/api/v1/catalog/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServiceRequests(params?: {
    status?: string;
    requester_id?: string;
    catalog_item_id?: string;
  }): Promise<{ data: ServiceRequest[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.requester_id) queryParams.append('requester_id', params.requester_id);
    if (params?.catalog_item_id) queryParams.append('catalog_item_id', params.catalog_item_id);
    
    return this.request<{ data: ServiceRequest[]; count: number }>(
      `/api/v1/catalog/requests${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  async getServiceRequest(id: string): Promise<{ data: ServiceRequest }> {
    return this.request<{ data: ServiceRequest }>(`/api/v1/catalog/requests/${id}`);
  }

  async getPendingServiceRequests(): Promise<{ data: ServiceRequest[]; count: number }> {
    return this.request<{ data: ServiceRequest[]; count: number }>('/api/v1/catalog/requests/pending');
  }

  async approveServiceRequest(id: string, reason?: string): Promise<{ data: ServiceRequest; message: string }> {
    return this.request<{ data: ServiceRequest; message: string }>(`/api/v1/catalog/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved: true, reason }),
    });
  }

  async rejectServiceRequest(id: string, reason?: string): Promise<{ data: ServiceRequest; message: string }> {
    return this.request<{ data: ServiceRequest; message: string }>(`/api/v1/catalog/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approved: false, reason }),
    });
  }

  // ===== Audit Logs (Admin) =====
  async getAuditLogs(params?: {
    user_id?: string;
    event_type?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ data: AuditLogEntry[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.event_type) queryParams.append('event_type', params.event_type);
    if (params?.resource_type) queryParams.append('resource_type', params.resource_type);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const response = await this.request<any>(`/api/v1/audit?${queryParams.toString()}`);
    return {
      data: response.data || response || [],
      total: response.total || (response.data?.length ?? 0),
    };
  }
}

export const apiClient = new ApiClient();
