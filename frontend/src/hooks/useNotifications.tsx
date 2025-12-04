/**
 * useNotifications Hook
 * 
 * Global notification state management with Zustand.
 * Provides notifications list, unread count, and actions for the notifications system.
 * 
 * Part of Phase 2: Core Components - Notifications System
 * Spec Reference: UI UX Specification Sheet - Section 5.3 Notifications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React, { createContext, useContext, useCallback, useEffect } from 'react';

/**
 * Notification type definitions
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  /** Unique identifier */
  id: string;
  /** Notification title */
  title: string;
  /** Notification message/body */
  message: string;
  /** Type determines styling */
  type: NotificationType;
  /** Priority level */
  priority: NotificationPriority;
  /** Whether the notification has been read */
  isRead: boolean;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when read (if applicable) */
  readAt?: string;
  /** Optional link to navigate to */
  link?: string;
  /** Optional action label */
  actionLabel?: string;
  /** Optional action callback id */
  actionId?: string;
  /** Source of notification (e.g., 'ticket', 'alert', 'system') */
  source?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Notification creation input (without generated fields)
 */
export type NotificationInput = Omit<Notification, 'id' | 'isRead' | 'createdAt' | 'readAt'>;

/**
 * Zustand store interface
 */
interface NotificationsStore {
  notifications: Notification[];
  /** Add a new notification */
  addNotification: (input: NotificationInput) => string;
  /** Mark a notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Remove a notification */
  removeNotification: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Get unread count */
  getUnreadCount: () => number;
  /** Get notifications by type */
  getByType: (type: NotificationType) => Notification[];
  /** Get high priority unread notifications */
  getCriticalUnread: () => Notification[];
}

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Zustand store for notifications
 * Persisted to localStorage for cross-session retention
 */
export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (input: NotificationInput) => {
        const id = generateId();
        const notification: Notification = {
          ...input,
          id,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100), // Keep max 100
        }));
        
        return id;
      },
      
      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          ),
        }));
      },
      
      markAllAsRead: () => {
        const now = new Date().toISOString();
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.isRead ? n : { ...n, isRead: true, readAt: now }
          ),
        }));
      },
      
      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
      
      getByType: (type: NotificationType) => {
        return get().notifications.filter((n) => n.type === type);
      },
      
      getCriticalUnread: () => {
        return get().notifications.filter(
          (n) => !n.isRead && (n.priority === 'critical' || n.priority === 'high')
        );
      },
    }),
    {
      name: 'archer-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

/**
 * Context for notification actions (for components that need callbacks)
 */
interface NotificationsContextValue {
  /** Show a toast notification (creates notification and shows toast) */
  notify: (input: NotificationInput) => string;
  /** Show info notification */
  notifyInfo: (title: string, message: string, link?: string) => string;
  /** Show success notification */
  notifySuccess: (title: string, message: string, link?: string) => string;
  /** Show warning notification */
  notifyWarning: (title: string, message: string, link?: string) => string;
  /** Show error notification */
  notifyError: (title: string, message: string, link?: string) => string;
  /** Show alert notification (high priority) */
  notifyAlert: (title: string, message: string, link?: string) => string;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/**
 * Notifications Provider
 * Wraps the app and provides notification helper functions
 */
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addNotification = useNotificationsStore((state) => state.addNotification);

  const notify = useCallback((input: NotificationInput): string => {
    return addNotification(input);
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, link?: string): string => {
    return addNotification({ title, message, type: 'info', priority: 'low', link });
  }, [addNotification]);

  const notifySuccess = useCallback((title: string, message: string, link?: string): string => {
    return addNotification({ title, message, type: 'success', priority: 'low', link });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, link?: string): string => {
    return addNotification({ title, message, type: 'warning', priority: 'medium', link });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, link?: string): string => {
    return addNotification({ title, message, type: 'error', priority: 'high', link });
  }, [addNotification]);

  const notifyAlert = useCallback((title: string, message: string, link?: string): string => {
    return addNotification({ title, message, type: 'alert', priority: 'critical', link, source: 'monitoring' });
  }, [addNotification]);

  return (
    <NotificationsContext.Provider
      value={{ notify, notifyInfo, notifySuccess, notifyWarning, notifyError, notifyAlert }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

/**
 * Hook to access notification helper functions
 */
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

/**
 * Hook to get notification state (readonly)
 * For components that just need to display notifications
 */
export const useNotificationState = () => {
  const notifications = useNotificationsStore((state) => state.notifications);
  const getUnreadCount = useNotificationsStore((state) => state.getUnreadCount);
  const getCriticalUnread = useNotificationsStore((state) => state.getCriticalUnread);
  
  return {
    notifications,
    unreadCount: getUnreadCount(),
    criticalUnread: getCriticalUnread(),
    hasUnread: getUnreadCount() > 0,
    hasCritical: getCriticalUnread().length > 0,
  };
};

/**
 * Hook to get notification actions
 * For components that need to manipulate notifications
 */
export const useNotificationActions = () => {
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const removeNotification = useNotificationsStore((state) => state.removeNotification);
  const clearAll = useNotificationsStore((state) => state.clearAll);
  
  return {
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
};

/**
 * Utility to format notification time
 */
export const formatNotificationTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Get color for notification type
 */
export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'success': return '#10b981'; // Green
    case 'warning': return '#f59e0b'; // Amber
    case 'error': return '#ef4444';   // Red
    case 'alert': return '#dc2626';   // Darker red
    case 'info':
    default: return '#6B4CE6';        // Purple (brand)
  }
};

/**
 * Get icon name for notification type (for Fluent UI icons)
 */
export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'success': return 'CheckmarkCircle';
    case 'warning': return 'Warning';
    case 'error': return 'ErrorCircle';
    case 'alert': return 'Alert';
    case 'info':
    default: return 'Info';
  }
};

export default useNotifications;
