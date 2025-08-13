const API_BASE_URL = 'http://localhost:3001';

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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
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

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<{ status: string; message: string; version: string }> {
    return this.request('/health');
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request('/api/projects');
  }

  async createProject(project: CreateProjectRequest): Promise<void> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/projects/${id}`);
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
    return this.request('/api/hardware-baskets');
  }

  async createHardwareBasket(basket: CreateHardwareBasketRequest): Promise<HardwareBasket> {
    return this.request('/api/hardware-baskets', {
      method: 'POST',
      body: JSON.stringify(basket),
    });
  }

  async uploadHardwareBasketFile(basketId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/api/hardware-baskets/${basketId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getHardwareBasketModels(basketId: string): Promise<HardwareModel[]> {
    return this.request(`/api/hardware-baskets/${basketId}/models`);
  }

  async getModelConfigurations(modelId: string): Promise<HardwareConfiguration[]> {
    return this.request(`/api/hardware-models/${modelId}/configurations`);
  }
}

export const apiClient = new ApiClient();
