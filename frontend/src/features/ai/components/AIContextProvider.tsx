/**
 * AI Context Provider
 * 
 * Provides AI state to the entire application.
 * Handles health checking, feature flags, and AI availability.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AIState, AIFeatureFlag, AIHealthStatus } from '../types/ai.types';
import { aiClient } from '../services/aiClient';

/** AI Context value interface */
interface AIContextValue extends AIState {
  /** Manually refresh health status */
  refreshHealth: () => Promise<void>;
  /** Check if a specific feature is enabled */
  isFeatureEnabled: (feature: AIFeatureFlag) => boolean;
}

/** Default context value when AI is disabled */
const defaultContextValue: AIContextValue = {
  isEnabled: false,
  isHealthy: false,
  healthStatus: null,
  enabledFeatures: new Set(),
  isLoading: false,
  error: null,
  refreshHealth: async () => {},
  isFeatureEnabled: () => false,
};

/** AI Context */
const AIContext = createContext<AIContextValue>(defaultContextValue);

/** Health check interval (30 seconds) */
const HEALTH_CHECK_INTERVAL = 30000;

/** Props for AIContextProvider */
interface AIContextProviderProps {
  children: ReactNode;
  /** Override AI enabled state (useful for testing) */
  forceEnabled?: boolean;
  /** Override enabled features */
  enabledFeatures?: AIFeatureFlag[];
}

/**
 * AI Context Provider Component
 * 
 * Wrap your app with this to enable AI features.
 * It will automatically check AI Engine health and manage feature state.
 */
export const AIContextProvider: React.FC<AIContextProviderProps> = ({ 
  children, 
  forceEnabled,
  enabledFeatures: overrideFeatures 
}) => {
  // Check if AI is enabled via environment variable
  const isConfigEnabled = forceEnabled ?? import.meta.env.VITE_AI_ENABLED === 'true';
  
  const [state, setState] = useState<AIState>({
    isEnabled: isConfigEnabled,
    isHealthy: false,
    healthStatus: null,
    enabledFeatures: new Set(overrideFeatures || []),
    isLoading: isConfigEnabled, // Only loading if enabled
    error: null,
  });

  /** Perform health check */
  const checkHealth = useCallback(async () => {
    if (!isConfigEnabled) return;
    
    try {
      const status = await aiClient.checkHealth();
      
      setState(prev => ({
        ...prev,
        isHealthy: status.status === 'healthy',
        healthStatus: status,
        isLoading: false,
        error: status.status === 'unavailable' ? 'AI Engine unavailable' : null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isHealthy: false,
        healthStatus: {
          status: 'unavailable',
          version: 'unknown',
          provider: 'unknown',
          lastCheck: new Date(),
        },
        isLoading: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      }));
    }
  }, [isConfigEnabled]);

  /** Fetch enabled features from backend or config */
  const fetchFeatures = useCallback(async () => {
    if (!isConfigEnabled) return;
    
    // If features are overridden via props, use those
    if (overrideFeatures) {
      setState(prev => ({
        ...prev,
        enabledFeatures: new Set(overrideFeatures),
      }));
      return;
    }

    // Get features from environment variable
    const envFeatures = import.meta.env.VITE_AI_FEATURES;
    if (envFeatures) {
      const features = envFeatures.split(',').map((f: string) => f.trim()) as AIFeatureFlag[];
      setState(prev => ({
        ...prev,
        enabledFeatures: new Set(features),
      }));
      return;
    }

    // Default: enable all features if AI is healthy
    const allFeatures: AIFeatureFlag[] = [
      'ticket-suggestions',
      'similar-tickets',
      'smart-search',
      'anomaly-detection',
      'librarian-chat',
      'rca-generation',
      'monitoring-actions',
      'asset-classification',
      'risk-assessment',
    ];
    
    setState(prev => ({
      ...prev,
      enabledFeatures: new Set(allFeatures),
    }));
  }, [isConfigEnabled, overrideFeatures]);

  /** Initial health check and feature fetch */
  useEffect(() => {
    if (isConfigEnabled) {
      checkHealth();
      fetchFeatures();
    }
  }, [isConfigEnabled, checkHealth, fetchFeatures]);

  /** Periodic health check */
  useEffect(() => {
    if (!isConfigEnabled) return;

    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [isConfigEnabled, checkHealth]);

  /** Check if a specific feature is enabled */
  const isFeatureEnabled = useCallback((feature: AIFeatureFlag): boolean => {
    return state.isEnabled && state.isHealthy && state.enabledFeatures.has(feature);
  }, [state.isEnabled, state.isHealthy, state.enabledFeatures]);

  /** Context value */
  const contextValue = useMemo<AIContextValue>(() => ({
    ...state,
    refreshHealth: checkHealth,
    isFeatureEnabled,
  }), [state, checkHealth, isFeatureEnabled]);

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

/**
 * Hook to access AI context
 * 
 * @example
 * const { isAIEnabled, isFeatureEnabled } = useAI();
 * if (isFeatureEnabled('ticket-suggestions')) {
 *   // Render AI suggestion button
 * }
 */
export const useAI = (): AIContextValue => {
  const context = useContext(AIContext);
  if (!context) {
    console.warn('[useAI] Used outside of AIContextProvider, AI features will be disabled');
    return defaultContextValue;
  }
  return context;
};

export default AIContextProvider;
