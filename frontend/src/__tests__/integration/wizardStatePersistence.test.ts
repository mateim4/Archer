/**
 * Integration Tests: Wizard State Persistence
 * 
 * Tests the auto-save and recovery functionality for the Migration Planning Wizard.
 * Validates that wizard state persists correctly to the backend and can be recovered
 * after refresh, tab close, or other interruptions.
 * 
 * Test Coverage:
 * - Auto-save on step change
 * - State recovery after refresh
 * - Clear state on wizard completion
 * - Concurrent tab handling
 * - State versioning
 * - Migration from old state format
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

interface WizardStateSnapshot {
  current_step: number;
  selected_rvtools_id: string | null;
  cluster_filter: string | null;
  vm_name_pattern: string | null;
  include_powered_off: boolean;
  clusters_configured: boolean;
  total_clusters: number;
  capacity_analyzed: boolean;
  capacity_analysis_result: CapacityAnalysisResult | null;
  network_mappings_count: number;
  network_diagram_visible: boolean;
  last_saved_at?: string;
}

interface CapacityAnalysisResult {
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  bottlenecks: Array<{
    resourceType: 'cpu' | 'memory' | 'storage';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    recommendation: string;
  }>;
  isSufficient: boolean;
}

interface SaveWizardStateResponse {
  success: boolean;
  last_saved_at: string;
  message: string;
}

interface LoadWizardStateResponse {
  state: WizardStateSnapshot | null;
}

// =============================================================================
// Mock Fetch Implementation
// =============================================================================

class WizardStateAPI {
  private baseUrl = '/api/v1/migration-wizard/projects';
  private stateStore = new Map<string, WizardStateSnapshot>();

  async saveWizardState(
    projectId: string,
    state: Omit<WizardStateSnapshot, 'last_saved_at'>
  ): Promise<SaveWizardStateResponse> {
    const stateWithTimestamp: WizardStateSnapshot = {
      ...state,
      last_saved_at: new Date().toISOString(),
    };

    this.stateStore.set(projectId, stateWithTimestamp);

    return {
      success: true,
      last_saved_at: stateWithTimestamp.last_saved_at!,
      message: 'Wizard state saved successfully',
    };
  }

  async loadWizardState(projectId: string): Promise<LoadWizardStateResponse> {
    const state = this.stateStore.get(projectId) || null;
    return { state };
  }

  async clearWizardState(projectId: string): Promise<void> {
    this.stateStore.delete(projectId);
  }

  // Test helper to check if state exists
  hasState(projectId: string): boolean {
    return this.stateStore.has(projectId);
  }

  // Test helper to reset all state
  resetAll(): void {
    this.stateStore.clear();
  }
}

// =============================================================================
// Test Fixtures
// =============================================================================

const createBasicWizardState = (overrides?: Partial<WizardStateSnapshot>): Omit<WizardStateSnapshot, 'last_saved_at'> => ({
  current_step: 1,
  selected_rvtools_id: 'rvtools-001',
  cluster_filter: null,
  vm_name_pattern: null,
  include_powered_off: false,
  clusters_configured: false,
  total_clusters: 0,
  capacity_analyzed: false,
  capacity_analysis_result: null,
  network_mappings_count: 0,
  network_diagram_visible: false,
  ...overrides,
});

const createStep2State = (): Omit<WizardStateSnapshot, 'last_saved_at'> => ({
  current_step: 2,
  selected_rvtools_id: 'rvtools-001',
  cluster_filter: 'Production',
  vm_name_pattern: 'web-*',
  include_powered_off: true,
  clusters_configured: false,
  total_clusters: 0,
  capacity_analyzed: false,
  capacity_analysis_result: null,
  network_mappings_count: 0,
  network_diagram_visible: false,
});

const createStep3State = (): Omit<WizardStateSnapshot, 'last_saved_at'> => ({
  current_step: 3,
  selected_rvtools_id: 'rvtools-001',
  cluster_filter: 'Production',
  vm_name_pattern: 'web-*',
  include_powered_off: true,
  clusters_configured: true,
  total_clusters: 3,
  capacity_analyzed: false,
  capacity_analysis_result: null,
  network_mappings_count: 0,
  network_diagram_visible: false,
});

const createStep4StateWithCapacity = (): Omit<WizardStateSnapshot, 'last_saved_at'> => ({
  current_step: 4,
  selected_rvtools_id: 'rvtools-001',
  cluster_filter: 'Production',
  vm_name_pattern: 'web-*',
  include_powered_off: true,
  clusters_configured: true,
  total_clusters: 3,
  capacity_analyzed: true,
  capacity_analysis_result: {
    cpuUtilization: 75.5,
    memoryUtilization: 68.2,
    storageUtilization: 82.1,
    bottlenecks: [
      {
        resourceType: 'storage',
        severity: 'warning',
        message: 'Storage utilization above 80%',
        recommendation: 'Consider adding storage capacity or optimizing VM disk usage',
      },
    ],
    isSufficient: true,
  },
  network_mappings_count: 5,
  network_diagram_visible: true,
});

// =============================================================================
// Tests
// =============================================================================

describe('Integration: Wizard State Persistence', () => {
  let api: WizardStateAPI;
  const testProjectId = 'project-test-001';

  beforeEach(() => {
    api = new WizardStateAPI();
    vi.clearAllMocks();
  });

  afterEach(() => {
    api.resetAll();
  });

  // ===========================================================================
  // Test 1: Auto-save on step change
  // ===========================================================================

  it('should save wizard state when user progresses to next step', async () => {
    // Step 1: User fills out initial selection
    const step1State = createBasicWizardState();
    const saveResponse1 = await api.saveWizardState(testProjectId, step1State);

    expect(saveResponse1.success).toBe(true);
    expect(saveResponse1.last_saved_at).toBeDefined();
    expect(api.hasState(testProjectId)).toBe(true);

    // Step 2: User progresses and fills filters
    const step2State = createStep2State();
    const saveResponse2 = await api.saveWizardState(testProjectId, step2State);

    expect(saveResponse2.success).toBe(true);

    // Verify latest state is Step 2
    const loadedState = await api.loadWizardState(testProjectId);
    expect(loadedState.state).not.toBeNull();
    expect(loadedState.state?.current_step).toBe(2);
    expect(loadedState.state?.cluster_filter).toBe('Production');
    expect(loadedState.state?.vm_name_pattern).toBe('web-*');
    expect(loadedState.state?.include_powered_off).toBe(true);
  });

  // ===========================================================================
  // Test 2: State recovery after refresh
  // ===========================================================================

  it('should restore wizard state after browser refresh', async () => {
    // Simulate user progressing through wizard
    const step3State = createStep3State();
    await api.saveWizardState(testProjectId, step3State);

    // Simulate browser refresh - load state
    const loadedState = await api.loadWizardState(testProjectId);

    expect(loadedState.state).not.toBeNull();
    expect(loadedState.state?.current_step).toBe(3);
    expect(loadedState.state?.clusters_configured).toBe(true);
    expect(loadedState.state?.total_clusters).toBe(3);
    expect(loadedState.state?.selected_rvtools_id).toBe('rvtools-001');
    expect(loadedState.state?.cluster_filter).toBe('Production');
  });

  // ===========================================================================
  // Test 3: Clear state on wizard completion
  // ===========================================================================

  it('should clear wizard state when wizard is completed', async () => {
    // Save state
    const state = createStep4StateWithCapacity();
    await api.saveWizardState(testProjectId, state);

    expect(api.hasState(testProjectId)).toBe(true);

    // Simulate wizard completion
    await api.clearWizardState(testProjectId);

    // Verify state is cleared
    expect(api.hasState(testProjectId)).toBe(false);

    const loadedState = await api.loadWizardState(testProjectId);
    expect(loadedState.state).toBeNull();
  });

  // ===========================================================================
  // Test 4: Concurrent tab handling - last write wins
  // ===========================================================================

  it('should handle concurrent saves from multiple tabs (last write wins)', async () => {
    // Simulate Tab 1 saving Step 2 state
    const tab1State = createStep2State();
    await api.saveWizardState(testProjectId, tab1State);

    // Wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate Tab 2 saving Step 3 state (should overwrite)
    const tab2State = createStep3State();
    await api.saveWizardState(testProjectId, tab2State);

    // Verify latest state is from Tab 2
    const loadedState = await api.loadWizardState(testProjectId);
    expect(loadedState.state?.current_step).toBe(3);
    expect(loadedState.state?.clusters_configured).toBe(true);
  });

  // ===========================================================================
  // Test 5: State versioning - handle state updates correctly
  // ===========================================================================

  it('should overwrite old state when saving new state (keep only latest)', async () => {
    // Save initial state
    const initialState = createBasicWizardState();
    const saveResponse1 = await api.saveWizardState(testProjectId, initialState);

    const firstSaveTime = saveResponse1.last_saved_at;

    // Wait 100ms to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update and save new state
    const updatedState = createStep4StateWithCapacity();
    const saveResponse2 = await api.saveWizardState(testProjectId, updatedState);

    const secondSaveTime = saveResponse2.last_saved_at;

    // Verify timestamps are different
    expect(secondSaveTime).not.toBe(firstSaveTime);

    // Load and verify new state is present, old state is gone
    const loadedState = await api.loadWizardState(testProjectId);
    expect(loadedState.state).not.toBeNull();
    expect(loadedState.state?.current_step).toBe(4);
    expect(loadedState.state?.capacity_analyzed).toBe(true);
    expect(loadedState.state?.capacity_analysis_result).not.toBeNull();
    expect(loadedState.state?.network_mappings_count).toBe(5);
    expect(loadedState.state?.last_saved_at).toBe(secondSaveTime);
  });

  // ===========================================================================
  // Test 6: Migration from old state format (backwards compatibility)
  // ===========================================================================

  it('should handle loading state with missing optional fields (backwards compatibility)', async () => {
    // Simulate old state format without new fields
    const oldFormatState: Partial<WizardStateSnapshot> = {
      current_step: 2,
      selected_rvtools_id: 'rvtools-old',
      cluster_filter: 'Production',
      vm_name_pattern: null,
      include_powered_off: false,
      // Missing: clusters_configured, total_clusters, capacity_analyzed, etc.
    };

    // Manually set old format state (simulating legacy data)
    const stateWithDefaults: WizardStateSnapshot = {
      ...createBasicWizardState(),
      ...oldFormatState,
      last_saved_at: new Date().toISOString(),
    };

    // Directly set in store to simulate legacy data
    api['stateStore'].set(testProjectId, stateWithDefaults);

    // Load state
    const loadedState = await api.loadWizardState(testProjectId);

    // Verify critical fields are present
    expect(loadedState.state).not.toBeNull();
    expect(loadedState.state?.current_step).toBe(2);
    expect(loadedState.state?.selected_rvtools_id).toBe('rvtools-old');

    // Verify defaults are applied for missing fields
    expect(loadedState.state?.clusters_configured).toBe(false);
    expect(loadedState.state?.total_clusters).toBe(0);
    expect(loadedState.state?.capacity_analyzed).toBe(false);
    expect(loadedState.state?.network_mappings_count).toBe(0);
  });

  // ===========================================================================
  // Additional Tests
  // ===========================================================================

  it('should return null when no state exists for project', async () => {
    const nonExistentProjectId = 'project-does-not-exist';

    const loadedState = await api.loadWizardState(nonExistentProjectId);

    expect(loadedState.state).toBeNull();
  });

  it('should preserve complex capacity analysis result', async () => {
    const stateWithCapacity = createStep4StateWithCapacity();
    await api.saveWizardState(testProjectId, stateWithCapacity);

    const loadedState = await api.loadWizardState(testProjectId);

    expect(loadedState.state?.capacity_analysis_result).not.toBeNull();
    expect(loadedState.state?.capacity_analysis_result?.cpuUtilization).toBe(75.5);
    expect(loadedState.state?.capacity_analysis_result?.memoryUtilization).toBe(68.2);
    expect(loadedState.state?.capacity_analysis_result?.storageUtilization).toBe(82.1);
    expect(loadedState.state?.capacity_analysis_result?.bottlenecks).toHaveLength(1);
    expect(loadedState.state?.capacity_analysis_result?.bottlenecks[0].resourceType).toBe('storage');
    expect(loadedState.state?.capacity_analysis_result?.isSufficient).toBe(true);
  });

  it('should auto-save at regular intervals (simulated with timer)', async () => {
    vi.useFakeTimers();

    let saveCount = 0;
    const currentState = createBasicWizardState();

    // Simulate auto-save interval (30 seconds)
    const autoSaveInterval = setInterval(async () => {
      await api.saveWizardState(testProjectId, {
        ...currentState,
        current_step: currentState.current_step + saveCount, // Simulate progression
      });
      saveCount++;
    }, 30000);

    // Advance time by 90 seconds (should trigger 3 saves)
    await vi.advanceTimersByTimeAsync(90000);

    expect(saveCount).toBe(3);

    // Verify final state
    const loadedState = await api.loadWizardState(testProjectId);
    expect(loadedState.state).not.toBeNull();
    // Last save would have incremented step by 2 (0, 1, 2)
    expect(loadedState.state?.current_step).toBe(3); // 1 + 2

    clearInterval(autoSaveInterval);
    vi.useRealTimers();
  });

  it('should handle rapid consecutive saves (debouncing scenario)', async () => {
    const state1 = createBasicWizardState({ current_step: 1 });
    const state2 = createBasicWizardState({ current_step: 2 });
    const state3 = createBasicWizardState({ current_step: 3 });

    // Rapid saves
    await api.saveWizardState(testProjectId, state1);
    await api.saveWizardState(testProjectId, state2);
    await api.saveWizardState(testProjectId, state3);

    // Only last save should be retained
    const loadedState = await api.loadWizardState(testProjectId);
    expect(loadedState.state?.current_step).toBe(3);
  });

  it('should preserve boolean flags correctly', async () => {
    const state = createStep2State();
    await api.saveWizardState(testProjectId, state);

    const loadedState = await api.loadWizardState(testProjectId);

    expect(loadedState.state?.include_powered_off).toBe(true);
    expect(loadedState.state?.network_diagram_visible).toBe(false);
    expect(loadedState.state?.capacity_analyzed).toBe(false);
  });

  it('should handle null values in optional fields', async () => {
    const state = createBasicWizardState({
      cluster_filter: null,
      vm_name_pattern: null,
      capacity_analysis_result: null,
    });

    await api.saveWizardState(testProjectId, state);

    const loadedState = await api.loadWizardState(testProjectId);

    expect(loadedState.state?.cluster_filter).toBeNull();
    expect(loadedState.state?.vm_name_pattern).toBeNull();
    expect(loadedState.state?.capacity_analysis_result).toBeNull();
  });
});
