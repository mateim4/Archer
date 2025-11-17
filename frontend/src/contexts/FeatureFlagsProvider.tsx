import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100, for gradual rollouts
  userSegments?: string[]; // User segments this flag applies to
  startDate?: Date;
  endDate?: Date;
}

export interface FeatureFlagsConfig {
  flags: FeatureFlag[];
  userId?: string;
  userSegments?: string[];
  endpoint?: string; // Remote config endpoint
  refreshInterval?: number; // Auto-refresh interval in ms
}

export interface FeatureFlagsContextValue {
  /** Check if a feature is enabled */
  isEnabled: (flagId: string) => boolean;
  /** Get all enabled flags */
  getEnabledFlags: () => FeatureFlag[];
  /** Get flag details */
  getFlag: (flagId: string) => FeatureFlag | undefined;
  /** Refresh flags from remote endpoint */
  refreshFlags: () => Promise<void>;
  /** All available flags */
  flags: FeatureFlag[];
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export interface FeatureFlagsProviderProps {
  children: ReactNode;
  config: FeatureFlagsConfig;
}

/**
 * FeatureFlagsProvider Component
 * 
 * Manages feature flags for gradual rollouts and A/B testing.
 * Supports remote config, user segmentation, and time-based flags.
 * 
 * Features:
 * - Enable/disable features remotely
 * - Gradual rollout with percentage-based distribution
 * - User segment targeting
 * - Time-based flag activation
 * - Auto-refresh from remote endpoint
 * 
 * @example
 * ```tsx
 * <FeatureFlagsProvider config={{
 *   flags: [
 *     {
 *       id: 'new-dashboard',
 *       name: 'New Dashboard',
 *       description: 'Redesigned dashboard UI',
 *       enabled: true,
 *       rolloutPercentage: 50 // 50% of users
 *     }
 *   ],
 *   userId: currentUser.id,
 *   endpoint: '/api/feature-flags',
 *   refreshInterval: 60000 // Refresh every minute
 * }}>
 *   <App />
 * </FeatureFlagsProvider>
 * ```
 */
export function FeatureFlagsProvider({ children, config }: FeatureFlagsProviderProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(config.flags);

  // Refresh flags from remote endpoint
  const refreshFlags = async () => {
    if (!config.endpoint) return;

    try {
      const response = await fetch(config.endpoint);
      if (response.ok) {
        const remoteFlags = await response.json();
        setFlags(remoteFlags);
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to refresh flags:', error);
    }
  };

  // Auto-refresh if interval is set
  useEffect(() => {
    if (!config.refreshInterval || !config.endpoint) return;

    const interval = setInterval(refreshFlags, config.refreshInterval);
    return () => clearInterval(interval);
  }, [config.refreshInterval, config.endpoint]);

  // Initial fetch from remote
  useEffect(() => {
    if (config.endpoint) {
      refreshFlags();
    }
  }, [config.endpoint]);

  const isEnabled = (flagId: string): boolean => {
    const flag = flags.find(f => f.id === flagId);
    if (!flag) return false;

    // Check if flag is globally enabled
    if (!flag.enabled) return false;

    // Check date range
    const now = new Date();
    if (flag.startDate && flag.startDate > now) return false;
    if (flag.endDate && flag.endDate < now) return false;

    // Check user segments
    if (flag.userSegments && flag.userSegments.length > 0) {
      if (!config.userSegments) return false;
      const hasMatchingSegment = flag.userSegments.some(segment =>
        config.userSegments?.includes(segment)
      );
      if (!hasMatchingSegment) return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      if (!config.userId) return false;
      
      // Deterministic hash-based assignment
      const userHash = hashUserId(config.userId, flagId);
      return userHash < flag.rolloutPercentage;
    }

    return true;
  };

  const getEnabledFlags = (): FeatureFlag[] => {
    return flags.filter(flag => isEnabled(flag.id));
  };

  const getFlag = (flagId: string): FeatureFlag | undefined => {
    return flags.find(f => f.id === flagId);
  };

  const value: FeatureFlagsContextValue = {
    isEnabled,
    getEnabledFlags,
    getFlag,
    refreshFlags,
    flags
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags
 * 
 * @example
 * ```tsx
 * const { isEnabled } = useFeatureFlags();
 * 
 * return (
 *   <div>
 *     {isEnabled('new-dashboard') ? (
 *       <NewDashboard />
 *     ) : (
 *       <OldDashboard />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}

/**
 * Component wrapper for feature-flagged content
 * 
 * @example
 * ```tsx
 * <FeatureFlag flag="new-feature">
 *   <NewFeatureComponent />
 * </FeatureFlag>
 * 
 * <FeatureFlag flag="beta-feature" fallback={<OldComponent />}>
 *   <BetaComponent />
 * </FeatureFlag>
 * ```
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null
}: {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isEnabled } = useFeatureFlags();
  return <>{isEnabled(flag) ? children : fallback}</>;
}

// Utility function to hash user ID for deterministic rollout
function hashUserId(userId: string, flagId: string): number {
  const input = `${userId}-${flagId}`;
  let hash = 0;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to 0-100 range
  return Math.abs(hash) % 100;
}

export default FeatureFlagsProvider;
