import { useState, useCallback } from 'react';
import { ToastItem } from '../components/ui/PurpleGlassToast';
import { ERROR_MESSAGES } from '../constants/errorMessages';

let toastIdCounter = 0;

export function useErrorHandler() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`[${context || 'Error'}]:`, error);

    const message = ERROR_MESSAGES[error.message] || error.message || 'An unexpected error occurred';
   
    showToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 5000
    });
  }, [showToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message, duration: 3000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 5000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message, duration: 4000 });
  }, [showToast]);

  return {
    toasts,
    dismissToast,
    handleError,
    showSuccess,
    showWarning,
    showInfo
  };
}
