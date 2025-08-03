import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/tauri'

// Type definitions for the application state
export interface VsphereEnvironment {
  id: string
  name: string
  parsed_at: string
  clusters: Cluster[]
}

export interface Cluster {
  name: string
  hosts: Host[]
  virtual_machines: VirtualMachine[]
}

export interface Host {
  name: string
  cpu_cores: number
  memory_gb: number
  cpu_usage_percent: number
  memory_usage_percent: number
}

export interface VirtualMachine {
  name: string
  cpu_cores: number
  memory_gb: number
  storage_gb: number
  power_state: string
  os_type: string
}

export interface EnvironmentSummary {
  id: string
  name: string
  parsed_at: string
  cluster_count: number
  total_vms: number
  total_hosts: number
  total_cpu_cores: number
  total_memory_gb: number
  total_storage_gb: number
  power_on_vms: number
  power_off_vms: number
}

export interface HardwareProfile {
  id: string
  name: string
  vendor: string
  model: string
  cpu_cores: number
  memory_gb: number
  storage_gb: number
  price: number
  form_factor: string
}

export interface SizingParameters {
  cpu_overcommit_ratio: number
  memory_overcommit_ratio: number
  storage_overcommit_ratio: number
  ha_enabled: boolean
  n_plus_failover: number
  growth_factor_percent: number
  target_utilization_percent: number
}

export interface SizingResult {
  hardware_profile_id: string
  servers_required: number
  efficiency_score: number
  utilization: ResourceUtilization
  placement_details: PlacementDetail[]
  total_cost: number
}

export interface ResourceUtilization {
  cpu_percent: number
  memory_percent: number
  storage_percent: number
}

export interface PlacementDetail {
  server_id: string
  vms: VirtualMachine[]
  resource_usage: ResourceUtilization
}

export interface TcoResult {
  analysis_period_years: number
  current_environment_total_cost: number
  target_environment_total_cost: number
  savings: number
  roi_percent: number
  payback_period_years: number
  currency: string
}

export interface AppSettings {
  default_sizing_parameters: SizingParameters
  ui_preferences: {
    theme: string
    default_view: string
  }
  file_locations: {
    default_export_directory: string
    template_directory: string
  }
}

// Application state interface
interface AppState {
  // Environment state
  currentEnvironment: VsphereEnvironment | null
  environmentSummary: EnvironmentSummary | null
  isEnvironmentLoading: boolean
  environmentError: string | null

  // Hardware state
  hardwareBasket: HardwareProfile[]
  isHardwareLoading: boolean
  hardwareError: string | null

  // Sizing state
  sizingResults: { [key: string]: SizingResult }
  currentSizingParameters: SizingParameters
  isSizingLoading: boolean
  sizingError: string | null

  // Analysis state
  analysisReport: any | null
  isAnalysisLoading: boolean
  analysisError: string | null

  // Translation state
  translationResult: any | null
  isTranslationLoading: boolean
  translationError: string | null

  // TCO state
  tcoResult: TcoResult | null
  isTcoLoading: boolean
  tcoError: string | null

  // Settings state
  appSettings: AppSettings | null
  isSettingsLoading: boolean
  settingsError: string | null

  // UI state
  currentView: string
  isLoading: boolean
  notifications: Notification[]

  // Actions
  setCurrentView: (view: string) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Environment actions
  loadRVToolsFile: (filePath: string) => Promise<void>
  clearEnvironment: () => Promise<void>
  refreshEnvironmentSummary: () => Promise<void>

  // Hardware actions
  loadHardwareBasket: () => Promise<void>
  addHardwareProfile: (profile: HardwareProfile) => Promise<void>
  removeHardwareProfile: (profileId: string) => Promise<void>
  saveHardwareBasket: (filePath: string) => Promise<void>
  loadHardwareBasketFromFile: (filePath: string) => Promise<void>

  // Sizing actions
  calculateSizing: (hardwareProfileId: string, parameters?: SizingParameters) => Promise<void>
  updateSizingParameters: (parameters: SizingParameters) => void

  // Analysis actions
  analyzeEnvironment: () => Promise<void>

  // Translation actions
  translateEnvironment: () => Promise<void>

  // TCO actions
  calculateTco: (sizingResultId: string) => Promise<void>

  // Settings actions
  loadAppSettings: () => Promise<void>
  updateAppSettings: (settings: AppSettings) => Promise<void>

  // Document generation actions
  generateHLD: (outputPath: string, sizingResult: SizingResult, translationResult: any) => Promise<void>
  generateLLD: (outputPath: string, sizingResult: SizingResult, translationResult: any) => Promise<void>
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
}

// Default sizing parameters
const defaultSizingParameters: SizingParameters = {
  cpu_overcommit_ratio: 2.0,
  memory_overcommit_ratio: 1.2,
  storage_overcommit_ratio: 1.5,
  ha_enabled: true,
  n_plus_failover: 1,
  growth_factor_percent: 20.0,
  target_utilization_percent: 80.0,
}

// Zustand store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentEnvironment: null,
  environmentSummary: null,
  isEnvironmentLoading: false,
  environmentError: null,

  hardwareBasket: [],
  isHardwareLoading: false,
  hardwareError: null,

  sizingResults: {},
  currentSizingParameters: defaultSizingParameters,
  isSizingLoading: false,
  sizingError: null,

  analysisReport: null,
  isAnalysisLoading: false,
  analysisError: null,

  translationResult: null,
  isTranslationLoading: false,
  translationError: null,

  tcoResult: null,
  isTcoLoading: false,
  tcoError: null,

  appSettings: null,
  isSettingsLoading: false,
  settingsError: null,

  currentView: 'dashboard',
  isLoading: false,
  notifications: [],

  // UI actions
  setCurrentView: (view: string) => set({ currentView: view }),

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [...state.notifications, notification],
    }))
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clearNotifications: () => set({ notifications: [] }),

  // Environment actions
  loadRVToolsFile: async (filePath: string) => {
    set({ isEnvironmentLoading: true, environmentError: null })
    try {
      const result = await invoke<string>('process_rvtools_file', { filePath })
      await get().refreshEnvironmentSummary()
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'RVTools File Loaded',
        message: result,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      set({ environmentError: errorMessage })
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Load RVTools File',
        message: errorMessage,
        timestamp: new Date(),
      })
    } finally {
      set({ isEnvironmentLoading: false })
    }
  },

  clearEnvironment: async () => {
    try {
      await invoke('clear_environment')
      set({
        currentEnvironment: null,
        environmentSummary: null,
        analysisReport: null,
        sizingResults: {},
        translationResult: null,
        tcoResult: null,
      })
      get().addNotification({
        id: Date.now().toString(),
        type: 'info',
        title: 'Environment Cleared',
        message: 'All environment data has been cleared',
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Clear Environment',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  refreshEnvironmentSummary: async () => {
    try {
      const summary = await invoke<EnvironmentSummary | null>('get_environment_summary')
      set({ environmentSummary: summary })
    } catch (error) {
      console.error('Failed to refresh environment summary:', error)
    }
  },

  // Hardware actions
  loadHardwareBasket: async () => {
    set({ isHardwareLoading: true, hardwareError: null })
    try {
      const basketJson = await invoke<string>('get_hardware_basket')
      const basket = JSON.parse(basketJson)
      set({ hardwareBasket: basket.profiles || [] })
    } catch (error) {
      const errorMessage = error as string
      set({ hardwareError: errorMessage })
    } finally {
      set({ isHardwareLoading: false })
    }
  },

  addHardwareProfile: async (profile: HardwareProfile) => {
    try {
      await invoke('add_hardware_profile', { profile })
      await get().loadHardwareBasket()
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Hardware Profile Added',
        message: `${profile.name} has been added to the hardware basket`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Add Hardware Profile',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  removeHardwareProfile: async (profileId: string) => {
    try {
      await invoke('remove_hardware_profile', { profileId })
      await get().loadHardwareBasket()
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Hardware Profile Removed',
        message: 'Hardware profile has been removed from the basket',
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Remove Hardware Profile',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  saveHardwareBasket: async (filePath: string) => {
    try {
      await invoke('save_hardware_basket', { filePath })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Hardware Basket Saved',
        message: `Hardware basket saved to ${filePath}`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Save Hardware Basket',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  loadHardwareBasketFromFile: async (filePath: string) => {
    try {
      await invoke('load_hardware_basket', { filePath })
      await get().loadHardwareBasket()
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Hardware Basket Loaded',
        message: `Hardware basket loaded from ${filePath}`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Load Hardware Basket',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  // Sizing actions
  calculateSizing: async (hardwareProfileId: string, parameters?: SizingParameters) => {
    set({ isSizingLoading: true, sizingError: null })
    try {
      const sizingParameters = parameters || get().currentSizingParameters
      const resultJson = await invoke<string>('calculate_sizing', {
        hardwareProfileId,
        sizingParameters,
      })
      const result = JSON.parse(resultJson)
      const cacheKey = `${hardwareProfileId}-${JSON.stringify(sizingParameters)}`
      set((state) => ({
        sizingResults: { ...state.sizingResults, [cacheKey]: result },
      }))
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Sizing Calculation Complete',
        message: `Calculated sizing for hardware profile: ${result.servers_required} servers required`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      set({ sizingError: errorMessage })
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Sizing Calculation Failed',
        message: errorMessage,
        timestamp: new Date(),
      })
    } finally {
      set({ isSizingLoading: false })
    }
  },

  updateSizingParameters: (parameters: SizingParameters) => {
    set({ currentSizingParameters: parameters })
  },

  // Analysis actions
  analyzeEnvironment: async () => {
    set({ isAnalysisLoading: true, analysisError: null })
    try {
      const analysisParameters = {
        include_powered_off_vms: false,
        include_templates: false,
        health_check_enabled: true,
        optimization_recommendations_enabled: true,
      }
      const reportJson = await invoke<string>('analyze_environment', { parameters: analysisParameters })
      const report = JSON.parse(reportJson)
      set({ analysisReport: report })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Environment Analysis Complete',
        message: 'Environment analysis has been completed successfully',
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      set({ analysisError: errorMessage })
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Environment Analysis Failed',
        message: errorMessage,
        timestamp: new Date(),
      })
    } finally {
      set({ isAnalysisLoading: false })
    }
  },

  // Translation actions
  translateEnvironment: async () => {
    set({ isTranslationLoading: true, translationError: null })
    try {
      const resultJson = await invoke<string>('translate_environment')
      const result = JSON.parse(resultJson)
      set({ translationResult: result })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Environment Translation Complete',
        message: 'VMware environment has been translated to Microsoft platforms',
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      set({ translationError: errorMessage })
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Environment Translation Failed',
        message: errorMessage,
        timestamp: new Date(),
      })
    } finally {
      set({ isTranslationLoading: false })
    }
  },

  // TCO actions
  calculateTco: async (sizingResultId: string) => {
    set({ isTcoLoading: true, tcoError: null })
    try {
      const sizingResult = get().sizingResults[sizingResultId]
      if (!sizingResult) {
        throw new Error('Sizing result not found')
      }
      const resultJson = await invoke<string>('calculate_tco', { sizingResult })
      const result = JSON.parse(resultJson)
      set({ tcoResult: result })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'TCO Calculation Complete',
        message: `Total savings: ${result.savings.toLocaleString()} ${result.currency}`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      set({ tcoError: errorMessage })
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'TCO Calculation Failed',
        message: errorMessage,
        timestamp: new Date(),
      })
    } finally {
      set({ isTcoLoading: false })
    }
  },

  // Settings actions
  loadAppSettings: async () => {
    set({ isSettingsLoading: true, settingsError: null })
    try {
      const settingsJson = await invoke<string>('get_app_settings')
      const settings = JSON.parse(settingsJson)
      set({ appSettings: settings })
    } catch (error) {
      const errorMessage = error as string
      set({ settingsError: errorMessage })
    } finally {
      set({ isSettingsLoading: false })
    }
  },

  updateAppSettings: async (settings: AppSettings) => {
    try {
      await invoke('update_app_settings', { settings })
      set({ appSettings: settings })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Settings Updated',
        message: 'Application settings have been updated successfully',
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Update Settings',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  // Document generation actions
  generateHLD: async (outputPath: string, sizingResult: SizingResult, translationResult: any) => {
    try {
      await invoke('generate_hld_document', {
        outputPath,
        sizingResult,
        translationResult,
      })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'HLD Document Generated',
        message: `High-Level Design document saved to ${outputPath}`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Generate HLD Document',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },

  generateLLD: async (outputPath: string, sizingResult: SizingResult, translationResult: any) => {
    try {
      await invoke('generate_lld_document', {
        outputPath,
        sizingResult,
        translationResult,
      })
      get().addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'LLD Document Generated',
        message: `Low-Level Design document saved to ${outputPath}`,
        timestamp: new Date(),
      })
    } catch (error) {
      const errorMessage = error as string
      get().addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to Generate LLD Document',
        message: errorMessage,
        timestamp: new Date(),
      })
    }
  },
}))
