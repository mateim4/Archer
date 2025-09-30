// Enhanced API client for unified backend response format
// Supports multiple backend ports and automatic failover

// Port configuration for different backend services
const API_ENDPOINTS = {
  rust_backend: import.meta.env.VITE_RUST_BACKEND_URL || 'http://localhost:3001',
  legacy_files: import.meta.env.VITE_LEGACY_FILE_URL || 'http://localhost:3002', 
  legacy_projects: import.meta.env.VITE_LEGACY_PROJECT_URL || 'http://localhost:3003',
  primary: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
};

// Unified API response format from Rust backend
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: any;
  timestamp: string;
}

// Legacy response format compatibility
export interface LegacyResponse<T> {
  status?: string;
  message?: string;
  data?: T;
  error?: string;
}

// Enhanced API error with unified response support
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public data?: any;
  public details?: any;

  constructor(status: number, message: string, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }

  static fromApiResponse(response: ApiResponse<any>, status: number = 500): ApiError {
    if (response.error) {
      return new ApiError(
        status,
        response.error.message,
        response.error.code,
        response.error.details
      );
    }
    return new ApiError(status, 'Unknown API error');
  }
}

// Enhanced API client with unified response handling
export class EnhancedApiClient {
  private endpoints: typeof API_ENDPOINTS;
  private usingMockData: boolean = false;
  private preferredBackend: 'rust' | 'legacy' = 'rust';

  constructor(endpoints: typeof API_ENDPOINTS = API_ENDPOINTS) {
    this.endpoints = endpoints;
  }

  public isUsingMockData(): boolean {
    return this.usingMockData;
  }

  public setPreferredBackend(backend: 'rust' | 'legacy'): void {
    this.preferredBackend = backend;
  }

  private getBaseUrl(service: 'primary' | 'files' | 'projects' = 'primary'): string {
    switch (service) {
      case 'files':
        return this.endpoints.legacy_files;
      case 'projects':
        return this.preferredBackend === 'rust' 
          ? this.endpoints.rust_backend 
          : this.endpoints.legacy_projects;
      default:
        return this.endpoints.rust_backend;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    service: 'primary' | 'files' | 'projects' = 'primary'
  ): Promise<T> {
    const baseUrl = this.getBaseUrl(service);
    const url = `${baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let responseData: any = undefined;
        try {
          responseData = await response.json();
        } catch (_) {}
        
        // Handle unified API response format
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
          throw ApiError.fromApiResponse(responseData as ApiResponse<any>, response.status);
        }
        
        // Handle legacy response format
        const message = responseData?.message || responseData?.error || `${response.status} ${response.statusText}`;
        throw new ApiError(response.status, message, undefined, responseData);
      }

      this.usingMockData = false;
      const responseData = await response.json();
      
      // Handle unified API response format - extract data field
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        const apiResponse = responseData as ApiResponse<T>;
        if (apiResponse.success && apiResponse.data !== undefined) {
          return apiResponse.data;
        } else if (!apiResponse.success) {
          throw ApiError.fromApiResponse(apiResponse, response.status);
        }
        // If success but no data field, return the whole response
        return responseData;
      }
      
      // Handle legacy response format
      return responseData;
    } catch (error) {
      // If it's a network error, try fallback or mock data
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn(`Backend unavailable at ${url}, attempting fallback...`);
        
        // Try legacy backend for project endpoints if rust backend failed
        if (service === 'projects' && this.preferredBackend === 'rust') {
          try {
            return await this.request(endpoint, options, 'projects');
          } catch (fallbackError) {
            console.warn('Fallback backend also unavailable, using mock data');
          }
        }
        
        // Use mock data for GET requests
        if (options.method === undefined || options.method === 'GET') {
          this.usingMockData = true;
          return this.getMockResponse<T>(endpoint);
        }
      }
      throw error;
    }
  }

  private getMockResponse<T>(endpoint: string): T {
    // Mock responses for development
    if (endpoint.includes('/health')) {
      return { 
        status: 'OK', 
        message: 'Mock API is running', 
        version: '0.1.0-mock',
        api_version: 'mock'
      } as T;
    }
    
    if (endpoint.includes('/projects')) {
      return [] as T; // Return empty array for projects
    }
    
    if (endpoint.includes('/hardware-baskets')) {
      return [] as T; // Return empty array for hardware baskets
    }
    
    return {} as T;
  }

  // Health check with backend discovery
  async healthCheck(): Promise<{status: string; message: string; version: string; api_version?: string}> {
    try {
      // Try Rust backend first
      const rustHealth = await this.request<{status: string; message: string; version: string; api_version?: string}>('/health', {}, 'primary');
      console.log('✅ Rust backend is available');
      this.preferredBackend = 'rust';
      return rustHealth;
    } catch (rustError) {
      console.warn('⚠️ Rust backend unavailable, trying legacy...');
      
      try {
        // Try legacy project backend
        const legacyHealth = await this.request<{status: string; message: string; version?: string}>('/health', {}, 'projects');
        console.log('✅ Legacy backend is available');
        this.preferredBackend = 'legacy';
        return {
          status: legacyHealth.status,
          message: legacyHealth.message,
          version: legacyHealth.version || '1.0.0',
          api_version: 'legacy'
        };
      } catch (legacyError) {
        console.warn('⚠️ All backends unavailable, using mock data');
        this.usingMockData = true;
        return {
          status: 'OK',
          message: 'Mock API is running - all backends unavailable',
          version: '0.1.0-mock',
          api_version: 'mock'
        };
      }
    }
  }

  // Projects API (with automatic backend selection)
  async getProjects(): Promise<any[]> {
    try {
      return await this.request<any[]>('/api/v1/projects', {}, 'projects');
    } catch (error) {
      // Fallback to legacy endpoint
      console.warn('Trying legacy projects endpoint...');
      return await this.request<any[]>('/api/projects', {}, 'projects');
    }
  }

  async getProject(id: string): Promise<any> {
    try {
      return await this.request<any>(`/api/v1/projects/${id}`, {}, 'projects');
    } catch (error) {
      return await this.request<any>(`/api/projects/${id}`, {}, 'projects');
    }
  }

  async createProject(project: any): Promise<any> {
    try {
      return await this.request<any>('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      }, 'projects');
    } catch (error) {
      return await this.request<any>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      }, 'projects');
    }
  }

  async updateProject(id: string, project: any): Promise<any> {
    try {
      return await this.request<any>(`/api/v1/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
      }, 'projects');
    } catch (error) {
      return await this.request<any>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
      }, 'projects');
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.request<void>(`/api/v1/projects/${id}`, {
        method: 'DELETE',
      }, 'projects');
    } catch (error) {
      await this.request<void>(`/api/projects/${id}`, {
        method: 'DELETE',
      }, 'projects');
    }
  }

  // Hardware Baskets API (Rust backend only)
  async getHardwareBaskets(): Promise<any[]> {
    return await this.request<any[]>('/api/v1/hardware-baskets', {}, 'primary');
  }

  async createHardwareBasket(basket: any): Promise<any> {
    return await this.request<any>('/api/v1/hardware-baskets', {
      method: 'POST',
      body: JSON.stringify(basket),
    }, 'primary');
  }

  async uploadHardwareBasket(formData: FormData): Promise<any> {
    return await this.request<any>('/api/v1/hardware-baskets/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    }, 'primary');
  }

  async deleteHardwareBasket(id: string): Promise<void> {
    await this.request<void>(`/api/v1/hardware-baskets/${id}`, {
      method: 'DELETE',
    }, 'primary');
  }

  // File processing API (Legacy server)
  async processExcelFile(formData: FormData): Promise<any> {
    return await this.request<any>('/api/convert-excel', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    }, 'files');
  }

  async processVMwareFile(formData: FormData): Promise<any> {
    return await this.request<any>('/api/process-vmware', {
      method: 'POST',
      body: formData,
      headers: {}, // Don't set Content-Type for FormData
    }, 'files');
  }
}

// Create and export a default instance
export const apiClient = new EnhancedApiClient();

// Export legacy compatibility
export { apiClient as ApiClient };

// Helper function to determine backend status
export async function getBackendStatus() {
  const client = new EnhancedApiClient();
  return await client.healthCheck();
}

// Helper function to test all backends
export async function testAllBackends() {
  const results = {
    rust: false,
    legacy_projects: false,
    legacy_files: false
  };

  try {
    await fetch(`${API_ENDPOINTS.rust_backend}/health`);
    results.rust = true;
  } catch (_) {}

  try {
    await fetch(`${API_ENDPOINTS.legacy_projects}/health`);
    results.legacy_projects = true;
  } catch (_) {}

  try {
    await fetch(`${API_ENDPOINTS.legacy_files}/health`);
    results.legacy_files = true;
  } catch (_) {}

  return results;
}