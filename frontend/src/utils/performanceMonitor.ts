/**
 * Performance monitoring utilities
 * Tracks component render times, network requests, and user interactions
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Prevent memory leaks
  
  /**
   * Mark the start of a performance measurement
   */
  markStart(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * Mark the end of a performance measurement and record the duration
   */
  markEnd(name: string, metadata?: Record<string, any>) {
    if (typeof performance === 'undefined') return;

    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(endMark);
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (measure) {
        this.recordMetric({
          name,
          value: measure.duration,
          timestamp: Date.now(),
          metadata
        });
      }
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } catch (error) {
      console.warn(`Failed to measure performance for ${name}:`, error);
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Prevent unbounded growth
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    
    return uniqueNames.map(name => {
      const metrics = this.getMetricsByName(name);
      const values = metrics.map(m => m.value);
      
      return {
        name,
        count: metrics.length,
        average: this.getAverageMetric(name),
        min: Math.min(...values),
        max: Math.max(...values),
        latest: metrics[metrics.length - 1]?.value || 0
      };
    });
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    console.table(this.getSummary());
  }

  /**
   * Measure API request performance
   */
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.markStart(`api:${name}`);
    
    try {
      const result = await apiCall();
      this.markEnd(`api:${name}`, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      this.markEnd(`api:${name}`, { ...metadata, status: 'error' });
      throw error;
    }
  }

  /**
   * Measure component render time
   */
  measureRender(componentName: string, callback: () => void) {
    this.markStart(`render:${componentName}`);
    callback();
    this.markEnd(`render:${componentName}`);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    performanceMonitor.markStart(`mount:${componentName}`);
    
    return () => {
      performanceMonitor.markEnd(`mount:${componentName}`);
    };
  }, [componentName]);

  const measureAction = React.useCallback(
    (actionName: string, action: () => void) => {
      performanceMonitor.markStart(`${componentName}:${actionName}`);
      action();
      performanceMonitor.markEnd(`${componentName}:${actionName}`);
    },
    [componentName]
  );

  return { measureAction };
}

/**
 * Get Core Web Vitals
 */
export function getCoreWebVitals() {
  if (typeof performance === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
  const lcp = performance.getEntriesByType('largest-contentful-paint')[0];

  return {
    // Time to First Byte
    ttfb: navigation?.responseStart - navigation?.requestStart || 0,
    
    // First Contentful Paint
    fcp: fcp?.startTime || 0,
    
    // Largest Contentful Paint
    lcp: (lcp as any)?.renderTime || (lcp as any)?.loadTime || 0,
    
    // DOM Content Loaded
    dcl: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
    
    // Load Complete
    load: navigation?.loadEventEnd - navigation?.loadEventStart || 0
  };
}

export default performanceMonitor;

// Type fix
import React from 'react';
