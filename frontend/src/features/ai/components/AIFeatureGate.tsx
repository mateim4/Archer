/**
 * AI Feature Gate Component
 * 
 * Conditionally renders children only when:
 * 1. AI is enabled in configuration
 * 2. AI Engine is healthy
 * 3. The specific feature flag is enabled
 * 
 * This is the primary mechanism for non-intrusive AI integration.
 * When AI is disabled, the component renders nothing (or fallback),
 * leaving no visual gaps in the UI.
 */

import React, { type ReactNode } from 'react';
import { useAI } from './AIContextProvider';
import type { AIFeatureFlag } from '../types/ai.types';

interface AIFeatureGateProps {
  /** The feature flag to check */
  feature: AIFeatureFlag;
  /** Content to render when AI feature is available */
  children: ReactNode;
  /** Content to render when AI feature is unavailable (default: null) */
  fallback?: ReactNode;
  /** Content to render while checking AI health (default: null) */
  loadingFallback?: ReactNode;
  /** 
   * If true, renders children even if AI is unhealthy (useful for 
   * features that can degrade gracefully)
   */
  allowDegraded?: boolean;
}

/**
 * AI Feature Gate
 * 
 * @example
 * // Simple usage - renders nothing when AI unavailable
 * <AIFeatureGate feature="ticket-suggestions">
 *   <SuggestCategoryButton />
 * </AIFeatureGate>
 * 
 * @example
 * // With fallback
 * <AIFeatureGate 
 *   feature="smart-search" 
 *   fallback={<StandardSearchBar />}
 * >
 *   <AIEnhancedSearchBar />
 * </AIFeatureGate>
 * 
 * @example
 * // With loading state
 * <AIFeatureGate 
 *   feature="librarian-chat"
 *   loadingFallback={<Spinner size="small" />}
 * >
 *   <LibrarianPanel />
 * </AIFeatureGate>
 */
export const AIFeatureGate: React.FC<AIFeatureGateProps> = ({
  feature,
  children,
  fallback = null,
  loadingFallback = null,
  allowDegraded = false,
}) => {
  const { isEnabled, isHealthy, isLoading, isFeatureEnabled, healthStatus } = useAI();

  // Not enabled at all - render nothing or fallback
  if (!isEnabled) {
    return <>{fallback}</>;
  }

  // Still checking health - render loading fallback
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // Check if feature is enabled (includes health check)
  const featureAvailable = isFeatureEnabled(feature);

  // Feature not available
  if (!featureAvailable) {
    // Allow degraded mode for some features
    if (allowDegraded && healthStatus?.status === 'degraded') {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // All checks passed - render children
  return <>{children}</>;
};

/**
 * Higher-order component version of AIFeatureGate
 * 
 * @example
 * const AIEnabledButton = withAIFeature('ticket-suggestions')(SuggestButton);
 */
export function withAIFeature<P extends object>(
  feature: AIFeatureFlag,
  fallback?: ReactNode
) {
  return function WithAIFeature(WrappedComponent: React.ComponentType<P>) {
    const WithAIFeatureComponent: React.FC<P> = (props) => (
      <AIFeatureGate feature={feature} fallback={fallback}>
        <WrappedComponent {...props} />
      </AIFeatureGate>
    );
    
    WithAIFeatureComponent.displayName = `withAIFeature(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    
    return WithAIFeatureComponent;
  };
}

export default AIFeatureGate;
