import { useState, useEffect, useMemo } from 'react';
import { useAnalytics } from '@/contexts/AnalyticsProvider';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
  config?: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  enabled: boolean;
}

export interface ABTestConfig {
  tests: ABTest[];
  persistToStorage?: boolean;
  storageKey?: string;
}

interface AssignedVariants {
  [testId: string]: string; // testId -> variantId
}

/**
 * Hook for A/B testing functionality
 * 
 * Assigns users to test variants and tracks experiment participation.
 * Persists variant assignments to localStorage for consistency.
 * 
 * Features:
 * - Weighted variant distribution
 * - Persistent variant assignment
 * - Automatic analytics tracking
 * - Multiple concurrent tests
 * - Test scheduling (start/end dates)
 * 
 * @example
 * ```tsx
 * const { getVariant, isInVariant } = useABTest({
 *   tests: [
 *     {
 *       id: 'new-checkout-flow',
 *       name: 'New Checkout Flow',
 *       description: 'Test new streamlined checkout',
 *       enabled: true,
 *       startDate: new Date('2025-01-01'),
 *       variants: [
 *         { id: 'control', name: 'Current Flow', weight: 50 },
 *         { id: 'variant-a', name: 'New Flow', weight: 50 }
 *       ]
 *     }
 *   ]
 * });
 * 
 * // Get assigned variant
 * const checkoutVariant = getVariant('new-checkout-flow');
 * 
 * // Conditional rendering
 * if (isInVariant('new-checkout-flow', 'variant-a')) {
 *   return <NewCheckoutFlow />;
 * } else {
 *   return <CurrentCheckoutFlow />;
 * }
 * ```
 */
export function useABTest(config: ABTestConfig) {
  const analytics = useAnalytics();
  const [assignedVariants, setAssignedVariants] = useState<AssignedVariants>(() => {
    // Load from localStorage if persistence is enabled
    if (config.persistToStorage) {
      const storageKey = config.storageKey || 'ab_test_variants';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('[ABTest] Failed to parse stored variants:', e);
        }
      }
    }
    return {};
  });

  // Active tests only (enabled and within date range)
  const activeTests = useMemo(() => {
    const now = new Date();
    return config.tests.filter(test => {
      if (!test.enabled) return false;
      if (test.startDate > now) return false;
      if (test.endDate && test.endDate < now) return false;
      return true;
    });
  }, [config.tests]);

  // Assign user to variant if not already assigned
  useEffect(() => {
    let hasChanges = false;
    const newAssignments: AssignedVariants = { ...assignedVariants };

    activeTests.forEach(test => {
      if (!newAssignments[test.id]) {
        // Assign to variant based on weights
        const variantId = assignVariant(test.variants);
        newAssignments[test.id] = variantId;
        hasChanges = true;

        // Track experiment participation
        const variant = test.variants.find(v => v.id === variantId);
        analytics.track('experiment_viewed', {
          experiment_id: test.id,
          experiment_name: test.name,
          variant_id: variantId,
          variant_name: variant?.name
        });
      }
    });

    if (hasChanges) {
      setAssignedVariants(newAssignments);

      // Persist to localStorage
      if (config.persistToStorage) {
        const storageKey = config.storageKey || 'ab_test_variants';
        localStorage.setItem(storageKey, JSON.stringify(newAssignments));
      }
    }
  }, [activeTests, assignedVariants, config.persistToStorage, config.storageKey, analytics]);

  /**
   * Get the assigned variant for a test
   * Returns null if test doesn't exist or user not assigned
   */
  const getVariant = (testId: string): ABTestVariant | null => {
    const test = activeTests.find(t => t.id === testId);
    if (!test) return null;

    const variantId = assignedVariants[testId];
    if (!variantId) return null;

    return test.variants.find(v => v.id === variantId) || null;
  };

  /**
   * Check if user is in a specific variant
   */
  const isInVariant = (testId: string, variantId: string): boolean => {
    return assignedVariants[testId] === variantId;
  };

  /**
   * Get variant config value
   * Useful for feature flags within variants
   */
  const getVariantConfig = <T,>(testId: string, configKey: string, defaultValue: T): T => {
    const variant = getVariant(testId);
    if (!variant?.config) return defaultValue;
    return (variant.config[configKey] as T) ?? defaultValue;
  };

  /**
   * Track a conversion event for the experiment
   */
  const trackConversion = (testId: string, conversionType: string, value?: number) => {
    const variant = getVariant(testId);
    if (!variant) return;

    analytics.track('experiment_conversion', {
      experiment_id: testId,
      variant_id: variant.id,
      variant_name: variant.name,
      conversion_type: conversionType,
      conversion_value: value
    });
  };

  return {
    getVariant,
    isInVariant,
    getVariantConfig,
    trackConversion,
    assignedVariants
  };
}

/**
 * Assign user to a variant based on weights
 * Uses random distribution weighted by variant weights
 */
function assignVariant(variants: ABTestVariant[]): string {
  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  
  // Generate random number 0-totalWeight
  const random = Math.random() * totalWeight;
  
  // Find which variant this falls into
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }
  
  // Fallback to first variant
  return variants[0].id;
}

export default useABTest;
