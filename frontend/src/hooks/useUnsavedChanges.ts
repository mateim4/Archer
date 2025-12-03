/**
 * useUnsavedChanges - Hook for global unsaved changes detection
 * 
 * This hook provides a consistent way to track unsaved changes across the application.
 * It handles:
 * - Browser/tab close warnings (beforeunload event)
 * - Manual blocking state management for custom navigation handling
 * - Custom cleanup callbacks when navigating away
 * 
 * Note: This hook is designed to work with BrowserRouter. For in-app navigation
 * blocking, use the UnsavedChangesGuard component which provides a confirmation
 * dialog before navigation.
 * 
 * Usage:
 * ```tsx
 * const unsavedChanges = useUnsavedChanges({
 *   when: true, // Only activate when this condition is true
 *   message: 'You have unsaved changes. Are you sure you want to leave?',
 * });
 * 
 * // Mark changes as unsaved when form is dirty
 * useEffect(() => {
 *   unsavedChanges.setHasUnsavedChanges(formIsDirty);
 * }, [formIsDirty, unsavedChanges.setHasUnsavedChanges]);
 * 
 * // Use with UnsavedChangesGuard component for in-app navigation blocking
 * return (
 *   <>
 *     <MyForm />
 *     <UnsavedChangesGuard
 *       isBlocking={showConfirmation}
 *       onProceed={handleProceed}
 *       onCancel={handleCancel}
 *     />
 *   </>
 * );
 * ```
 */

import { useCallback, useEffect, useState } from 'react';

export interface UseUnsavedChangesOptions {
  /**
   * Condition to enable/disable the unsaved changes detection.
   * When false, no warnings will be shown.
   * @default true
   */
  when?: boolean;

  /**
   * Custom message to show in the browser's beforeunload dialog.
   * Note: Most modern browsers ignore custom messages for security reasons.
   * @default 'You have unsaved changes. Are you sure you want to leave?'
   */
  message?: string;

  /**
   * Callback to execute before navigation is blocked.
   * Can be used for cleanup or saving drafts.
   */
  onBeforeBlock?: () => void;

  /**
   * Initial value for hasUnsavedChanges state.
   * @default false
   */
  initialValue?: boolean;
}

export interface UseUnsavedChangesReturn {
  /**
   * Current state indicating whether there are unsaved changes.
   */
  hasUnsavedChanges: boolean;

  /**
   * Function to update the unsaved changes state.
   */
  setHasUnsavedChanges: (value: boolean) => void;

  /**
   * Function to mark changes as saved (sets hasUnsavedChanges to false).
   */
  markAsSaved: () => void;

  /**
   * Function to mark changes as unsaved (sets hasUnsavedChanges to true).
   */
  markAsUnsaved: () => void;

  /**
   * Whether navigation blocking is active (shouldBlock is true).
   * Use this to conditionally show confirmation dialogs.
   */
  shouldBlock: boolean;

  /**
   * Function to confirm navigation and clear unsaved changes.
   * Call this when user confirms they want to leave.
   */
  confirmNavigation: () => void;
}

const DEFAULT_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?';

export function useUnsavedChanges(
  options: UseUnsavedChangesOptions = {}
): UseUnsavedChangesReturn {
  const {
    when = true,
    message = DEFAULT_MESSAGE,
    onBeforeBlock,
    initialValue = false,
  } = options;

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(initialValue);

  // Determine if we should block navigation
  const shouldBlock = when && hasUnsavedChanges;

  // Handle browser beforeunload event (tab/window close)
  useEffect(() => {
    if (!shouldBlock) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Call the onBeforeBlock callback if provided
      if (onBeforeBlock) {
        onBeforeBlock();
      }

      // Standard way to trigger the browser's leave confirmation dialog
      event.preventDefault();
      // For older browsers (Chrome < 119)
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message, onBeforeBlock]);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const confirmNavigation = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  return {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    markAsSaved,
    markAsUnsaved,
    shouldBlock,
    confirmNavigation,
  };
}

export default useUnsavedChanges;
