import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../../src/store/useAppStore';

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().reset?.();
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAppStore());
    
    expect(result.current.environments).toEqual([]);
    expect(result.current.selectedEnvironmentId).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading state correctly', () => {
    const { result } = renderHook(() => useAppStore());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.loading).toBe(true);
  });

  it('sets error state correctly', () => {
    const { result } = renderHook(() => useAppStore());
    const testError = 'Test error message';
    
    act(() => {
      result.current.setError(testError);
    });
    
    expect(result.current.error).toBe(testError);
  });

  it('adds environment correctly', () => {
    const { result } = renderHook(() => useAppStore());
    const mockEnvironment = {
      id: 'env-1',
      name: 'Test Environment',
      parsed_at: '2024-01-01',
      clusters: []
    };
    
    act(() => {
      result.current.addEnvironment(mockEnvironment);
    });
    
    expect(result.current.environments).toHaveLength(1);
    expect(result.current.environments[0]).toEqual(mockEnvironment);
  });

  it('selects environment correctly', () => {
    const { result } = renderHook(() => useAppStore());
    const environmentId = 'env-1';
    
    act(() => {
      result.current.selectEnvironment(environmentId);
    });
    
    expect(result.current.selectedEnvironmentId).toBe(environmentId);
  });

  it('removes environment correctly', () => {
    const { result } = renderHook(() => useAppStore());
    const mockEnvironment = {
      id: 'env-1',
      name: 'Test Environment',
      parsed_at: '2024-01-01',
      clusters: []
    };
    
    act(() => {
      result.current.addEnvironment(mockEnvironment);
      result.current.removeEnvironment('env-1');
    });
    
    expect(result.current.environments).toHaveLength(0);
  });

  it('handles multiple environments', () => {
    const { result } = renderHook(() => useAppStore());
    const env1 = { id: 'env-1', name: 'Env 1', parsed_at: '2024-01-01', clusters: [] };
    const env2 = { id: 'env-2', name: 'Env 2', parsed_at: '2024-01-02', clusters: [] };
    
    act(() => {
      result.current.addEnvironment(env1);
      result.current.addEnvironment(env2);
    });
    
    expect(result.current.environments).toHaveLength(2);
    expect(result.current.environments[0].id).toBe('env-1');
    expect(result.current.environments[1].id).toBe('env-2');
  });

  it('persists state correctly', () => {
    const { result: result1 } = renderHook(() => useAppStore());
    const mockEnvironment = {
      id: 'env-1',
      name: 'Test Environment',
      parsed_at: '2024-01-01',
      clusters: []
    };
    
    act(() => {
      result1.current.addEnvironment(mockEnvironment);
    });
    
    // Create a new hook instance to test persistence
    const { result: result2 } = renderHook(() => useAppStore());
    expect(result2.current.environments).toHaveLength(1);
  });
});