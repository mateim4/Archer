import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsConfig {
  /** Enable/disable analytics tracking */
  enabled: boolean;
  /** Analytics provider (posthog, mixpanel, custom) */
  provider?: 'posthog' | 'mixpanel' | 'custom';
  /** API key for analytics provider */
  apiKey?: string;
  /** Custom endpoint for analytics data */
  endpoint?: string;
  /** Auto-track page views */
  autoTrackPageViews?: boolean;
  /** Auto-track clicks */
  autoTrackClicks?: boolean;
  /** Debug mode (log to console) */
  debug?: boolean;
  /** Privacy mode (hash user data) */
  privacyMode?: boolean;
}

export interface AnalyticsContextValue {
  /** Track a custom event */
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  /** Track a page view */
  trackPageView: (pageName: string, properties?: Record<string, unknown>) => void;
  /** Identify a user */
  identifyUser: (user: AnalyticsUser) => void;
  /** Reset user identity (logout) */
  resetUser: () => void;
  /** Set user properties */
  setUserProperties: (properties: Record<string, unknown>) => void;
  /** Check if analytics is enabled */
  isEnabled: boolean;
  /** Get current session ID */
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export interface AnalyticsProviderProps {
  children: React.ReactNode;
  config: AnalyticsConfig;
}

/**
 * AnalyticsProvider Component
 * 
 * Provides analytics tracking capabilities throughout the application.
 * Supports PostHog, Mixpanel, and custom analytics backends.
 * 
 * Features:
 * - Event tracking with custom properties
 * - Page view tracking
 * - User identification and properties
 * - Session management
 * - Privacy mode with data hashing
 * - Debug mode for development
 * 
 * @example
 * ```tsx
 * <AnalyticsProvider config={{
 *   enabled: true,
 *   provider: 'posthog',
 *   apiKey: 'phc_...',
 *   autoTrackPageViews: true,
 *   debug: process.env.NODE_ENV === 'development'
 * }}>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({ children, config }: AnalyticsProviderProps) {
  const [sessionId] = useState(() => generateSessionId());
  const [currentUser, setCurrentUser] = useState<AnalyticsUser | null>(null);

  // Initialize analytics provider
  useEffect(() => {
    if (!config.enabled) return;

    if (config.provider === 'posthog' && config.apiKey) {
      // Initialize PostHog (would need posthog-js package)
      if (config.debug) {
        console.log('[Analytics] PostHog initialized:', config.apiKey);
      }
    } else if (config.provider === 'mixpanel' && config.apiKey) {
      // Initialize Mixpanel (would need mixpanel-browser package)
      if (config.debug) {
        console.log('[Analytics] Mixpanel initialized:', config.apiKey);
      }
    } else if (config.provider === 'custom' && config.endpoint) {
      if (config.debug) {
        console.log('[Analytics] Custom endpoint initialized:', config.endpoint);
      }
    }
  }, [config]);

  // Auto-track page views
  useEffect(() => {
    if (!config.enabled || !config.autoTrackPageViews) return;

    const handleLocationChange = () => {
      const pageName = window.location.pathname;
      trackPageView(pageName);
    };

    // Track initial page
    handleLocationChange();

    // Listen for navigation (SPA)
    window.addEventListener('popstate', handleLocationChange);
    
    // Intercept pushState and replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [config.enabled, config.autoTrackPageViews]);

  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (!config.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: config.privacyMode ? hashProperties(properties) : properties,
      timestamp: new Date(),
      userId: currentUser?.id,
      sessionId
    };

    // Send to analytics provider
    sendToProvider(event, config);

    if (config.debug) {
      console.log('[Analytics] Event tracked:', event);
    }
  }, [config, currentUser, sessionId]);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    track('page_view', {
      page_name: pageName,
      page_url: window.location.href,
      referrer: document.referrer,
      ...properties
    });
  }, [track]);

  const identifyUser = useCallback((user: AnalyticsUser) => {
    setCurrentUser(user);

    if (!config.enabled) return;

    const userData = config.privacyMode ? {
      id: hashString(user.id),
      email: user.email ? hashString(user.email) : undefined,
      name: user.name ? hashString(user.name) : undefined,
      properties: hashProperties(user.properties)
    } : user;

    // Send identify event to provider
    if (config.provider === 'posthog') {
      // posthog.identify(userData.id, userData.properties);
    } else if (config.provider === 'mixpanel') {
      // mixpanel.identify(userData.id);
      // mixpanel.people.set(userData.properties);
    } else if (config.endpoint) {
      fetch(`${config.endpoint}/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      }).catch(err => console.error('[Analytics] Failed to identify user:', err));
    }

    if (config.debug) {
      console.log('[Analytics] User identified:', userData);
    }
  }, [config]);

  const resetUser = useCallback(() => {
    setCurrentUser(null);

    if (!config.enabled) return;

    // Reset user in provider
    if (config.provider === 'posthog') {
      // posthog.reset();
    } else if (config.provider === 'mixpanel') {
      // mixpanel.reset();
    }

    if (config.debug) {
      console.log('[Analytics] User reset');
    }
  }, [config]);

  const setUserProperties = useCallback((properties: Record<string, unknown>) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      properties: { ...currentUser.properties, ...properties }
    };
    setCurrentUser(updatedUser);

    if (!config.enabled) return;

    const props = config.privacyMode ? hashProperties(properties) : properties;

    // Update user properties in provider
    if (config.provider === 'posthog') {
      // posthog.people.set(props);
    } else if (config.provider === 'mixpanel') {
      // mixpanel.people.set(props);
    } else if (config.endpoint) {
      fetch(`${config.endpoint}/user-properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, properties: props })
      }).catch(err => console.error('[Analytics] Failed to set user properties:', err));
    }

    if (config.debug) {
      console.log('[Analytics] User properties updated:', props);
    }
  }, [config, currentUser]);

  const value: AnalyticsContextValue = {
    track,
    trackPageView,
    identifyUser,
    resetUser,
    setUserProperties,
    isEnabled: config.enabled,
    sessionId
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to access analytics context
 * 
 * @example
 * ```tsx
 * const { track, trackPageView, identifyUser } = useAnalytics();
 * 
 * // Track button click
 * const handleClick = () => {
 *   track('button_clicked', { button_name: 'Save Project' });
 *   // ... rest of logic
 * };
 * 
 * // Identify user on login
 * const handleLogin = (user) => {
 *   identifyUser({ id: user.id, email: user.email, name: user.name });
 * };
 * ```
 */
export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

// Utility functions

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function hashString(str: string): string {
  // Simple hash function for privacy mode
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hashed_${Math.abs(hash).toString(36)}`;
}

function hashProperties(properties?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!properties) return undefined;
  
  const hashed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string') {
      hashed[key] = hashString(value);
    } else {
      hashed[key] = value;
    }
  }
  return hashed;
}

function sendToProvider(event: AnalyticsEvent, config: AnalyticsConfig): void {
  if (config.provider === 'posthog') {
    // posthog.capture(event.name, event.properties);
  } else if (config.provider === 'mixpanel') {
    // mixpanel.track(event.name, event.properties);
  } else if (config.endpoint) {
    fetch(`${config.endpoint}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(err => {
      if (config.debug) {
        console.error('[Analytics] Failed to send event:', err);
      }
    });
  }
}

export default AnalyticsProvider;
