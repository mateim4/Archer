/**
 * Integration Tests: Unsaved Changes Detection
 * 
 * Tests the useUnsavedChanges hook for preventing accidental data loss.
 * 
 * Test Coverage:
 * - Hook state management
 * - Browser beforeunload event
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

// =============================================================================
// Tests
// =============================================================================

describe('Integration: useUnsavedChanges Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Test 1: Initial state
  // ===========================================================================

  it('should initialize with no unsaved changes by default', () => {
    const { result } = renderHook(() => useUnsavedChanges());

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.shouldBlock).toBe(false);
  });

  it('should initialize with unsaved changes when initialValue is true', () => {
    const { result } = renderHook(
      () => useUnsavedChanges({ initialValue: true })
    );

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.shouldBlock).toBe(true);
  });

  // ===========================================================================
  // Test 2: State management
  // ===========================================================================

  it('should update hasUnsavedChanges when setHasUnsavedChanges is called', () => {
    const { result } = renderHook(() => useUnsavedChanges());

    act(() => {
      result.current.setHasUnsavedChanges(true);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.shouldBlock).toBe(true);

    act(() => {
      result.current.setHasUnsavedChanges(false);
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.shouldBlock).toBe(false);
  });

  it('should mark as saved when markAsSaved is called', () => {
    const { result } = renderHook(
      () => useUnsavedChanges({ initialValue: true })
    );

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.markAsSaved();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.shouldBlock).toBe(false);
  });

  it('should mark as unsaved when markAsUnsaved is called', () => {
    const { result } = renderHook(() => useUnsavedChanges());

    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => {
      result.current.markAsUnsaved();
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.shouldBlock).toBe(true);
  });

  it('should clear unsaved changes when confirmNavigation is called', () => {
    const { result } = renderHook(
      () => useUnsavedChanges({ initialValue: true })
    );

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      result.current.confirmNavigation();
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.shouldBlock).toBe(false);
  });

  // ===========================================================================
  // Test 3: Conditional blocking
  // ===========================================================================

  it('should not block when "when" option is false', () => {
    const { result } = renderHook(
      () => useUnsavedChanges({ when: false, initialValue: true })
    );

    // Even though hasUnsavedChanges is true, shouldBlock should be false
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.shouldBlock).toBe(false);
  });

  it('should not block when hasUnsavedChanges is false', () => {
    const { result } = renderHook(
      () => useUnsavedChanges({ when: true, initialValue: false })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.shouldBlock).toBe(false);
  });

  // ===========================================================================
  // Test 4: beforeunload event
  // ===========================================================================

  it('should add beforeunload event listener when there are unsaved changes', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { result, unmount } = renderHook(() => useUnsavedChanges());

    // Initially no listener should be added (no unsaved changes)
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Set unsaved changes
    act(() => {
      result.current.setHasUnsavedChanges(true);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Clear unsaved changes
    act(() => {
      result.current.setHasUnsavedChanges(false);
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  // ===========================================================================
  // Test 5: onBeforeBlock callback
  // ===========================================================================

  it('should call onBeforeBlock when beforeunload is triggered', () => {
    const onBeforeBlock = vi.fn();
    
    const { result } = renderHook(
      () => useUnsavedChanges({ onBeforeBlock })
    );

    act(() => {
      result.current.setHasUnsavedChanges(true);
    });

    // Simulate beforeunload event
    const event = new Event('beforeunload', { cancelable: true });
    Object.defineProperty(event, 'returnValue', { writable: true, value: '' });
    window.dispatchEvent(event);

    expect(onBeforeBlock).toHaveBeenCalled();
  });
});
