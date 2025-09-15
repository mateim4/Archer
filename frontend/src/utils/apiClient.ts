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
  project_type: 'migration' | 'deployment' | 'upgrade' | 'custom';
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

export class ApiClient {
  private baseUrl: string;
  private usingMockData: boolean = false;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public isUsingMockData(): boolean {
    return this.usingMockData;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      this.usingMockData = false;
      return response.json();
    } catch (error) {
      // If it's a network error (connection refused, etc.), use mock data for GET requests
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (options.method === undefined || options.method === 'GET') {
          console.warn('Backend unavailable, using mock data for:', endpoint);
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
}

export const apiClient = new ApiClient();
