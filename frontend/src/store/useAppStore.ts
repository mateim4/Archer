import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import WebFileProcessor, { UniversalServer, VMwareEnvironment } from '../utils/webFileProcessor';
import ServerFileProcessor from '../utils/serverFileProcessor';

// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && 
  window.__TAURI_IPC__ && 
  typeof window.__TAURI_IPC__ === 'function';

// Initialize web file processor for browser environment
const webFileProcessor = new WebFileProcessor();
const serverFileProcessor = new ServerFileProcessor();

// Mock invoke function for browser environment
const safeInvoke = async <T>(command: string, args?: any): Promise<T> => {
  if (isTauri) {
    return invoke<T>(command, args);
  } else {
    // Return mock data for browser environment
    console.warn(`[Browser Mode] Tauri command '${command}' not available, using mock data`);
    
    switch (command) {
      case 'get_app_settings':
        return JSON.stringify({
          theme: 'light',
          autoSave: true,
          notifications: true
        }) as T;
      case 'get_hardware_basket':
        return JSON.stringify([]) as T;
      case 'list_hardware_assets':
        return [
          {
            id: 'asset-1',
            name: 'Dell PowerEdge R750',
            manufacturer: 'Dell',
            model: 'PowerEdge R750',
            cpu_cores: 64,
            memory_gb: 512,
            storage_capacity_gb: 7680,
            status: 'Available',
            location: 'Rack A-01',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'asset-2',
            name: 'HPE ProLiant DL380',
            manufacturer: 'HPE',
            model: 'ProLiant DL380 Gen10',
            cpu_cores: 48,
            memory_gb: 256,
            storage_capacity_gb: 3840,
            status: 'InUse',
            location: 'Rack B-03',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ] as T;
      case 'create_hardware_asset':
      case 'update_hardware_asset':
      case 'delete_hardware_asset':
      case 'lock_hardware_asset':
        return null as T;
      default:
        throw new Error(`Mock not implemented for command: ${command}`);
    }
  }
};

// Types for our application state
export interface VsphereEnvironment {
  id: string;
  name: string;
  parsed_at: string;
  clusters: Cluster[];
}

export interface NetworkTopology {
  clusters: any[];
  hosts: any[];
  vms: any[];
  networks: any[];
  platform: 'vmware' | 'hyperv';
}

export interface Cluster {
  id: string;
  name: string;
  hosts: Host[];
  vms: VirtualMachine[];
  utilization: number;
  status: 'healthy' | 'warning' | 'critical';
  vcpu_ratio: string;
  memory_overcommit: string;
}

export interface Host {
  id: string;
  name: string;
  cpu_cores: number;
  memory_gb: number;
  status: string;
}

export interface VirtualMachine {
  id: string;
  name: string;
  vcpus: number;
  memory_gb: number;
  storage_gb: number;
  power_state: string;
  guest_os: string;
  vmware_tools_status: string;
}

// Hardware Pool Types
export enum AssetStatus {
  Available = 'Available',
  InUse = 'InUse',
  Locked = 'Locked',
  Maintenance = 'Maintenance',
  Decommissioned = 'Decommissioned',
}

export interface HardwareAsset {
  id: string; // uuid
  name: string;
  manufacturer: string;
  model: string;
  cpu_cores: number;
  memory_gb: number;
  storage_capacity_gb: number;
  status: AssetStatus;
  location: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

export interface AssetLock {
  id: string; // uuid
  asset_id: string; // uuid
  project_id: string;
  start_date: string; // ISO 8601 date string
  end_date: string; // ISO 8601 date string
  created_at: string; // ISO 8601 date string
}

export interface HardwareProfile {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  cpu_cores: number;
  memory_gb: number;
  storage_capacity_gb: number;
  cost: number;
  power_consumption_watts: number;
}

export interface SizingResult {
  target_hardware_profile: HardwareProfile;
  required_servers: number;
  usable_capacity: {
    cpu_cores: number;
    memory_gb: number;
    storage_gb: number;
  };
  efficiency_score: number;
  ha_resilience: boolean;
  growth_accommodation: {
    cpu_percent: number;
    memory_percent: number;
    storage_percent: number;
  };
}

export interface AnalysisReport {
  capacity_analysis: {
    cpu_utilization_avg: number;
    memory_utilization_avg: number;
    storage_utilization_avg: number;
    overcommit_ratios: {
      cpu: number;
      memory: number;
    };
  };
  health_analysis: {
    zombie_vms: number;
    outdated_tools: number;
    performance_issues: number;
  };
  optimization_recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface TcoResult {
  analysis_period_years: number;
  current_environment_total_cost: number;
  target_environment_total_cost: number;
  savings: number;
  roi_percent: number;
  payback_period_years: number;
  currency: string;
}

export interface AppSettings {
  default_sizing_parameters: {
    target_cpu_ratio: number;
    target_memory_overcommit: number;
    ha_enabled: boolean;
    growth_buffer_percent: number;
  };
  ui_preferences: {
    theme: string;
    default_view: string;
    chart_preferences: {
      default_chart_type: string;
      color_scheme: string;
      show_data_labels: boolean;
      animation_enabled: boolean;
    };
  };
  file_locations: {
    default_export_directory: string;
    template_directory: string;
    hardware_basket_file: string;
  };
}

// Zustand store
interface AppState {
  // Environment data
  currentEnvironment: VsphereEnvironment | null;
  environmentSummary: any | null;
  analysisReport: AnalysisReport | null;
  
  // Project management
  currentProject: { id: string; name: string; description: string } | null;
  
  // Network topology
  networkTopology: NetworkTopology | null;
  uploadedFile: string | null; // Store file path for Tauri environment
  
  // Hardware and sizing
  hardwareBasket: HardwareProfile[];
  sizingResults: SizingResult[];
  
  // Hardware Pool
  hardwarePoolAssets: HardwareAsset[];
  
  // Translation and migration
  translationRules: any | null;
  translationResult: any | null;
  
  // TCO and costing
  tcoParameters: any | null;
  tcoResult: TcoResult | null;
  
  // Settings and configuration
  appSettings: AppSettings | null;
  
  // UI state
  activeView: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  setActiveView: (view: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Environment actions
  processRvToolsFile: (filePath: string) => Promise<void>;
  getEnvironmentSummary: () => Promise<void>;
  analyzeEnvironment: () => Promise<void>;
  clearEnvironment: () => Promise<void>;
  
  // Network topology actions
  processNetworkTopology: (filePath: string) => Promise<void>;
  setUploadedFile: (filePath: string | null) => void;
  setNetworkTopology: (topology: NetworkTopology | null) => void;
  setCurrentEnvironment: (environment: VsphereEnvironment | null) => void;
  
  // Project actions
  setCurrentProject: (project: { id: string; name: string; description: string } | null) => void;
  
  // Hardware actions
  getHardwareBasket: () => Promise<void>;
  addHardwareProfile: (profile: HardwareProfile) => Promise<void>;
  removeHardwareProfile: (profileId: string) => Promise<void>;
  parseHardwareFile: (file: File | string) => Promise<UniversalServer>;
  processVMwareFile: (file: File | string) => Promise<VMwareEnvironment>;
  
  // Sizing actions
  calculateSizing: (hardwareProfileId: string, parameters: any) => Promise<void>;
  
  // Hardware Pool Actions
  listHardwareAssets: () => Promise<void>;
  createHardwareAsset: (asset: Omit<HardwareAsset, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateHardwareAsset: (asset: HardwareAsset) => Promise<void>;
  deleteHardwareAsset: (id: string) => Promise<void>;
  lockHardwareAsset: (assetId: string, projectId: string, startDate: string, endDate: string) => Promise<void>;
  
  // Translation actions
  getTranslationRules: () => Promise<void>;
  updateTranslationRules: (rules: any) => Promise<void>;
  translateEnvironment: () => Promise<void>;
  
  // Document generation
  generateHldDocument: (outputPath: string, sizingResult: any, translationResult: any) => Promise<void>;
  generateLldDocument: (outputPath: string, sizingResult: any, translationResult: any) => Promise<void>;
  
  // TCO actions
  calculateTco: (sizingResult: any) => Promise<void>;
  updateTcoParameters: (parameters: any) => Promise<void>;
  
  // Settings actions
  getAppSettings: () => Promise<void>;
  updateAppSettings: (settings: AppSettings) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentEnvironment: null,
  environmentSummary: null,
  analysisReport: null,
  
  // Project state
  currentProject: null,
  
  // Network topology
  networkTopology: null,
  uploadedFile: null,
  
  hardwareBasket: [],
  sizingResults: [],
  hardwarePoolAssets: [],
  translationRules: null,
  translationResult: null,
  tcoParameters: null,
  tcoResult: null,
  appSettings: null,
  activeView: 'dashboard',
  loading: false,
  error: null,

  // UI actions
  setActiveView: (view) => set({ activeView: view }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Project actions
  setCurrentProject: (project) => set({ currentProject: project }),

  // Environment actions
  processRvToolsFile: async (filePath: string) => {
    set({ loading: true, error: null, uploadedFile: filePath });
    try {
      const result = await safeInvoke<string>('process_rvtools_file', { filePath });
      console.log('RVTools processing result:', result);
      
      // After processing, get the environment summary and network topology
      await get().getEnvironmentSummary();
      await get().analyzeEnvironment();
      await get().processNetworkTopology(filePath);
    } catch (error) {
      console.error('Failed to process RVTools file:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  getEnvironmentSummary: async () => {
    try {
      const summary = await safeInvoke<any>('get_environment_summary');
      set({ environmentSummary: summary });
    } catch (error) {
      console.error('Failed to get environment summary:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  analyzeEnvironment: async () => {
    try {
      const report = await safeInvoke<AnalysisReport>('analyze_environment');
      set({ analysisReport: report });
    } catch (error) {
      console.error('Failed to analyze environment:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  clearEnvironment: async () => {
    try {
      await safeInvoke('clear_environment');
      set({ 
        currentEnvironment: null,
        environmentSummary: null,
        analysisReport: null,
        networkTopology: null,
        uploadedFile: null
      });
    } catch (error) {
      console.error('Failed to clear environment:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  // Network topology actions
  processNetworkTopology: async (filePath: string) => {
    try {
      let result: NetworkTopology;
      
      if (filePath.endsWith('.xlsx')) {
        result = await safeInvoke<NetworkTopology>('get_network_topology', { filePath });
        result.platform = 'vmware';
      } else if (filePath.endsWith('.json')) {
        const fileContent = await safeInvoke<string>('read_text_file', { filePath });
        result = await safeInvoke<NetworkTopology>('get_network_topology_from_hyperv', { jsonContent: fileContent });
        result.platform = 'hyperv';
      } else {
        throw new Error('Unsupported file format for network topology');
      }
      
      set({ networkTopology: result, uploadedFile: filePath });
    } catch (error) {
      console.error('Failed to process network topology:', error);
      // Re-throw the error so it can be handled by the UI
      throw error;
    }
  },

  setUploadedFile: (filePath: string | null) => {
    set({ uploadedFile: filePath });
  },

  setNetworkTopology: (topology: NetworkTopology | null) => {
    set({ networkTopology: topology });
  },

  setCurrentEnvironment: (environment: VsphereEnvironment | null) => {
    set({ currentEnvironment: environment });
  },

  // Hardware actions
  getHardwareBasket: async () => {
    try {
      const basketJson = await safeInvoke<string>('get_hardware_basket');
      const hardwareBasket = JSON.parse(basketJson);
      set({ hardwareBasket: hardwareBasket.profiles || [] });
    } catch (error) {
      console.error('Failed to get hardware basket:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  addHardwareProfile: async (profile: HardwareProfile) => {
    try {
      await safeInvoke<string>('add_hardware_profile', { profile });
      await get().getHardwareBasket();
    } catch (error) {
      console.error('Failed to add hardware profile:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  removeHardwareProfile: async (profileId: string) => {
    try {
      await safeInvoke<string>('remove_hardware_profile', { profileId });
      await get().getHardwareBasket();
    } catch (error) {
      console.error('Failed to remove hardware profile:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  parseHardwareFile: async (file: File | string): Promise<UniversalServer> => {
    set({ loading: true, error: null });
    try {
      if (isTauri && typeof file === 'string') {
        // Use Tauri backend for file path
        const result = await safeInvoke<UniversalServer>('parse_hardware_file', { 
          filePath: file 
        });
        return result;
      } else if (!isTauri && file instanceof File) {
        // Use web file processor for browser environment - hardware specific
        const result = await webFileProcessor.parseHardwareFile(file);
        return result;
      } else {
        throw new Error('Invalid file input for current environment');
      }
    } catch (error) {
      console.error('Failed to parse hardware file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  processVMwareFile: async (file: File | string): Promise<VMwareEnvironment> => {
    set({ loading: true, error: null });
    try {
      if (isTauri && typeof file === 'string') {
        // Use Tauri backend for file path
        const result = await safeInvoke<string>('process_rvtools_file', { 
          filePath: file 
        });
        
        // Get the parsed environment from Tauri
        const environment = await safeInvoke<any>('get_environment_summary');
        
        // Convert Tauri format to store format  
        set({ 
          environmentSummary: environment,
          currentEnvironment: environment
        });
        return environment;
      } else if (!isTauri && file instanceof File) {
        // Use server file processor for browser environment with real parsing
        const result = await serverFileProcessor.processVMwareFile(file);
        
        // Check if we got real parsed data (RVTools) or CSV data
        if (typeof result === 'object' && result.clusters) {
          // We got real parsed RVTools data from Rust parser!
          console.log('Processing real RVTools data:', result);
          
          const convertedClusters: Cluster[] = result.clusters.map((cluster: any) => ({
            id: cluster.name.replace(/\s+/g, '-').toLowerCase(),
            name: cluster.name,
            hosts: cluster.hosts.map((host: any) => ({
              id: host.name || host.hostname || `host-${Math.random().toString(36).substr(2, 9)}`,
              name: host.name || host.hostname || 'Unknown Host',
              cpu_cores: host.cpu_cores || host.pcpu_cores || 0,
              memory_gb: host.memory_gb || 0,
              status: host.connection_state || host.status || 'connected'
            })),
            vms: cluster.vms.map((vm: any) => ({
              id: vm.name || `vm-${Math.random().toString(36).substr(2, 9)}`,
              name: vm.name || 'Unknown VM',
              vcpus: vm.vcpus || vm.num_cpu || 0,
              memory_gb: vm.memory_gb || (vm.memory_mb ? Math.round(vm.memory_mb / 1024) : 0),
              storage_gb: vm.storage_gb || (vm.provisioned_space_mb ? Math.round(vm.provisioned_space_mb / 1024) : 0),
              power_state: vm.power_state === 'poweredOn' || vm.power_state === 'PoweredOn' ? 'poweredOn' : 'poweredOff',
              guest_os: vm.guest_os || vm.guest_full_name || 'Unknown',
              vmware_tools_status: vm.vmware_tools_status || vm.tools_version_status || 'unknown'
            })),
            // Calculate real utilization from cluster metrics
            utilization: cluster.metrics?.current_vcpu_pcpu_ratio ? 
              Math.round(Math.min(cluster.metrics.current_vcpu_pcpu_ratio / 4 * 100, 100)) : // 4:1 ratio = 100%
              Math.round(Math.min((cluster.metrics?.total_vcpus || 0) / Math.max(cluster.metrics?.total_pcpu_cores || 1, 1) / 4 * 100, 100)),
            // Determine real status from health data
            status: (cluster.health_status?.warnings?.length > 0 || 
                    cluster.health_status?.zombie_vms?.length > 0 ||
                    cluster.health_status?.outdated_tools?.length > 0) ? 'warning' : 'healthy',
            // Use real vCPU ratio from metrics with proper fallbacks
            vcpu_ratio: cluster.metrics?.current_vcpu_pcpu_ratio ? 
              `${cluster.metrics.current_vcpu_pcpu_ratio.toFixed(1)}:1` : 
              (() => {
                const vcpus = cluster.metrics?.total_vcpus || 0;
                const pcpus = cluster.metrics?.total_pcpu_cores || 0;
                if (vcpus === 0 || pcpus === 0) return 'N/A';
                const ratio = vcpus / pcpus;
                return `${ratio.toFixed(1)}:1`;
              })(),
            // Use real memory overcommit ratio with proper fallbacks
            memory_overcommit: cluster.metrics?.memory_overcommit_ratio ?
              `${cluster.metrics.memory_overcommit_ratio.toFixed(1)}:1` :
              (() => {
                const provisioned = cluster.metrics?.provisioned_memory_gb || 0;
                const total = cluster.metrics?.total_memory_gb || 0;
                if (provisioned === 0 || total === 0) return 'N/A';
                const ratio = provisioned / total;
                return `${ratio.toFixed(1)}:1`;
              })()
          }));

          // Create environment summary from real data
          const environmentSummary = {
            totalClusters: result.clusters.length,
            totalHosts: result.total_hosts || result.clusters.reduce((sum: number, c: any) => sum + (c.metrics?.total_hosts || 0), 0),
            totalVMs: result.total_vms || result.clusters.reduce((sum: number, c: any) => sum + (c.metrics?.total_vms || 0), 0),
            totalCores: result.summary_metrics?.total_pcores || result.clusters.reduce((sum: number, c: any) => sum + (c.metrics?.total_pcpu_cores || 0), 0),
            totalMemoryGB: Math.round(result.summary_metrics?.total_consumed_memory_gb || result.clusters.reduce((sum: number, c: any) => sum + (c.metrics?.total_memory_gb || 0), 0)),
            totalStorageTB: Math.round((result.summary_metrics?.total_consumed_storage_gb || result.clusters.reduce((sum: number, c: any) => sum + (c.metrics?.consumed_storage_gb || 0), 0)) / 1024 * 100) / 100,
            averageUtilization: result.summary_metrics?.overall_vcpu_pcpu_ratio ? 
              Math.round(Math.min(result.summary_metrics.overall_vcpu_pcpu_ratio / 4 * 100, 100)) : // 4:1 ratio = 100%
              Math.round(result.clusters.reduce((sum: number, c: any, index: number, arr: any[]) => {
                const ratio = c.metrics?.current_vcpu_pcpu_ratio || 0;
                return sum + Math.min(ratio / 4 * 100, 100);
              }, 0) / Math.max(result.clusters.length, 1))
          };

          // Update the store with real parsed data
          set({ 
            environmentSummary,
            currentEnvironment: {
              id: result.id || `env-${Date.now()}`,
              name: result.name || file.name.replace(/\.[^/.]+$/, ''),
              parsed_at: result.parsed_at || new Date().toISOString(),
              clusters: convertedClusters
            }
          });
          
          return result;
        } else if (typeof result === 'string') {
          // We got CSV data, fall back to client-side parsing
          console.log('Received CSV data, using client-side parsing');
          const parsedResult = await webFileProcessor.parseVMwareExport(result);
          
          // Convert web processor format to store format (this keeps the old logic)
          const convertedClusters: Cluster[] = parsedResult.clusters.map(cluster => ({
            id: cluster.id,
            name: cluster.name,
            hosts: Array.from({ length: cluster.hosts }, (_, i) => ({
              id: `${cluster.id}-host-${i + 1}`,
              name: `Host-${i + 1}`,
              cpu_cores: Math.floor(cluster.totalCores / cluster.hosts),
              memory_gb: Math.floor(cluster.totalMemoryGB / cluster.hosts),
              status: 'online'
            })),
            vms: Array.from({ length: cluster.vms }, (_, i) => ({
              id: `${cluster.id}-vm-${i + 1}`,
              name: `VM-${i + 1}`,
              vcpus: 2,
              memory_gb: 4,
              storage_gb: 50,
              power_state: cluster.powerState,
              guest_os: Object.keys(cluster.osBreakdown)[0] || 'Unknown',
              vmware_tools_status: 'running'
            })),
            utilization: cluster.utilization,
            status: cluster.utilization > 80 ? 'warning' : 'healthy',
            vcpu_ratio: '4.0:1',
            memory_overcommit: '1.5:1'
          }));

          set({ 
            environmentSummary: parsedResult.summary,
            currentEnvironment: {
              id: `env-${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              parsed_at: new Date().toISOString(),
              clusters: convertedClusters
            }
          });
          return parsedResult;
        } else {
          throw new Error('Invalid data format received from server');
        }
      } else {
        throw new Error('Invalid file input for current environment');
      }
    } catch (error) {
      console.error('Failed to process VMware file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Sizing actions
  calculateSizing: async (hardwareProfileId: string, parameters: any) => {
    set({ loading: true, error: null });
    try {
      const resultJson = await safeInvoke<string>('calculate_sizing', { 
        hardwareProfileId, 
        sizingParameters: parameters 
      });
      const sizingResult = JSON.parse(resultJson);
      
      set(state => ({
        sizingResults: [...state.sizingResults.filter(r => r.target_hardware_profile.id !== hardwareProfileId), sizingResult]
      }));
    } catch (error) {
      console.error('Failed to calculate sizing:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  // Translation actions
  getTranslationRules: async () => {
    try {
      const rulesJson = await safeInvoke<string>('get_translation_rules');
      const translationRules = JSON.parse(rulesJson);
      set({ translationRules });
    } catch (error) {
      console.error('Failed to get translation rules:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  updateTranslationRules: async (rules: any) => {
    try {
      await safeInvoke<string>('update_translation_rules', { rules });
      set({ translationRules: rules });
    } catch (error) {
      console.error('Failed to update translation rules:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  translateEnvironment: async () => {
    set({ loading: true, error: null });
    try {
      const resultJson = await safeInvoke<string>('translate_environment');
      const translationResult = JSON.parse(resultJson);
      set({ translationResult });
    } catch (error) {
      console.error('Failed to translate environment:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  // Document generation
  generateHldDocument: async (outputPath: string, sizingResult: any, translationResult: any) => {
    set({ loading: true, error: null });
    try {
      const result = await safeInvoke<string>('generate_hld_document', { 
        outputPath, 
        sizingResult, 
        translationResult 
      });
      console.log('HLD document generated:', result);
    } catch (error) {
      console.error('Failed to generate HLD document:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  generateLldDocument: async (outputPath: string, sizingResult: any, translationResult: any) => {
    set({ loading: true, error: null });
    try {
      const result = await safeInvoke<string>('generate_lld_document', { 
        outputPath, 
        sizingResult, 
        translationResult 
      });
      console.log('LLD document generated:', result);
    } catch (error) {
      console.error('Failed to generate LLD document:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  // TCO actions
  calculateTco: async (sizingResult: any) => {
    set({ loading: true, error: null });
    try {
      const resultJson = await safeInvoke<string>('calculate_tco', { sizingResult });
      const tcoResult = JSON.parse(resultJson);
      set({ tcoResult });
    } catch (error) {
      console.error('Failed to calculate TCO:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  updateTcoParameters: async (parameters: any) => {
    try {
      await safeInvoke<string>('update_tco_parameters', { parameters });
      set({ tcoParameters: parameters });
    } catch (error) {
      console.error('Failed to update TCO parameters:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  // Settings actions
  getAppSettings: async () => {
    try {
      const settingsJson = await safeInvoke<string>('get_app_settings');
      const appSettings = JSON.parse(settingsJson);
      set({ appSettings });
    } catch (error) {
      console.error('Failed to get app settings:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  updateAppSettings: async (settings: AppSettings) => {
    try {
      await safeInvoke<string>('update_app_settings', { settings });
      set({ appSettings: settings });
    } catch (error) {
      console.error('Failed to update app settings:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  // Hardware Pool Actions
  listHardwareAssets: async () => {
    set({ loading: true, error: null });
    try {
      const assets = await safeInvoke<HardwareAsset[]>('list_hardware_assets');
      set({ hardwarePoolAssets: assets, loading: false });
    } catch (error) {
      console.error('Failed to list hardware assets:', error);
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  createHardwareAsset: async (asset) => {
    set({ loading: true, error: null });
    try {
      await safeInvoke('create_hardware_asset', { asset });
      await get().listHardwareAssets();
    } catch (error) {
      console.error('Failed to create hardware asset:', error);
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  updateHardwareAsset: async (asset) => {
    set({ loading: true, error: null });
    try {
      await safeInvoke('update_hardware_asset', { id: asset.id, asset });
      await get().listHardwareAssets();
    } catch (error) {
      console.error('Failed to update hardware asset:', error);
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  deleteHardwareAsset: async (id) => {
    set({ loading: true, error: null });
    try {
      await safeInvoke('delete_hardware_asset', { id });
      await get().listHardwareAssets();
    } catch (error) {
      console.error('Failed to delete hardware asset:', error);
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },

  lockHardwareAsset: async (assetId, projectId, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      await safeInvoke('lock_hardware_asset', { assetId, projectId, startDate, endDate });
      await get().listHardwareAssets();
    } catch (error) {
      console.error('Failed to lock hardware asset:', error);
      set({ error: error instanceof Error ? error.message : String(error), loading: false });
    }
  },
}));
