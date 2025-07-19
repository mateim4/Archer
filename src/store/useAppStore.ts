import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

// Check if we're running in Tauri environment
const isTauri = typeof window !== 'undefined' && 
  window.__TAURI_IPC__ && 
  typeof window.__TAURI_IPC__ === 'function';

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
  
  // Hardware and sizing
  hardwareBasket: HardwareProfile[];
  sizingResults: SizingResult[];
  
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
  
  // Hardware actions
  getHardwareBasket: () => Promise<void>;
  addHardwareProfile: (profile: HardwareProfile) => Promise<void>;
  removeHardwareProfile: (profileId: string) => Promise<void>;
  
  // Sizing actions
  calculateSizing: (hardwareProfileId: string, parameters: any) => Promise<void>;
  
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
  hardwareBasket: [],
  sizingResults: [],
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

  // Environment actions
  processRvToolsFile: async (filePath: string) => {
    set({ loading: true, error: null });
    try {
      const result = await safeInvoke<string>('process_rvtools_file', { filePath });
      console.log('RVTools processing result:', result);
      
      // After processing, get the environment summary
      await get().getEnvironmentSummary();
      await get().analyzeEnvironment();
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
    set({ loading: true, error: null });
    try {
      const parameters = {
        include_powered_off_vms: false,
        include_templates: false,
        health_check_enabled: true,
        optimization_recommendations_enabled: true,
      };
      
      const reportJson = await safeInvoke<string>('analyze_environment', { parameters });
      const analysisReport = JSON.parse(reportJson);
      set({ analysisReport });
    } catch (error) {
      console.error('Failed to analyze environment:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  clearEnvironment: async () => {
    try {
      await safeInvoke<string>('clear_environment');
      set({ 
        currentEnvironment: null, 
        environmentSummary: null, 
        analysisReport: null,
        sizingResults: [],
        translationResult: null,
        tcoResult: null
      });
    } catch (error) {
      console.error('Failed to clear environment:', error);
      set({ error: error instanceof Error ? error.message : String(error) });
    }
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
}));
