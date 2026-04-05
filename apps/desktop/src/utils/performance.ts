// apps/desktop/src/utils/performance.ts
/**
 * Performance monitoring utilities for desktop app
 *
 * Tracks app startup time, page load times, and other performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's';
  timestamp: number;
  category: 'startup' | 'navigation' | 'interaction' | 'network';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    startupTime: number;
    averagePageLoad: number;
    totalInteractions: number;
  };
}

const STORAGE_KEY = 'performance-metrics';
const MAX_METRICS = 100;

let metrics: PerformanceMetric[] = [];

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  // Load existing metrics from storage
  loadMetrics();

  // Track app startup time
  trackAppStartup();

  // Setup performance observer for long tasks
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            recordMetric({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              category: 'interaction',
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Long task observer not supported
    }
  }
}

/**
 * Track app startup time
 */
function trackAppStartup(): void {
  if (typeof performance !== 'undefined') {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const startupTime = navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart;

      recordMetric({
        name: 'app_startup',
        value: Math.round(startupTime),
        unit: 'ms',
        timestamp: Date.now(),
        category: 'startup',
      });
    }
  }
}

/**
 * Record a performance metric
 */
export function recordMetric(metric: PerformanceMetric): void {
  metrics.push(metric);

  // Keep only the last MAX_METRICS
  if (metrics.length > MAX_METRICS) {
    metrics = metrics.slice(-MAX_METRICS);
  }

  // Save to storage
  saveMetrics();

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`);
  }
}

/**
 * Track page load time
 */
export function trackPageLoad(pageName: string): () => void {
  if (typeof performance !== 'undefined') {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      recordMetric({
        name: `page_load_${pageName}`,
        value: Math.round(loadTime),
        unit: 'ms',
        timestamp: Date.now(),
        category: 'navigation',
      });
    };
  }

  return () => {};
}

/**
 * Track interaction timing
 */
export function trackInteraction(interactionName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    recordMetric({
      name: `interaction_${interactionName}`,
      value: Math.round(duration),
      unit: 'ms',
      timestamp: Date.now(),
      category: 'interaction',
    });
  };
}

/**
 * Track network request
 */
export function trackNetworkRequest(url: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    recordMetric({
      name: `network_${url.substring(0, 50)}`,
      value: Math.round(duration),
      unit: 'ms',
      timestamp: Date.now(),
      category: 'network',
    });
  };
}

/**
 * Get performance report
 */
export function getPerformanceReport(): PerformanceReport {
  const startupMetrics = metrics.filter(m => m.category === 'startup');
  const navigationMetrics = metrics.filter(m => m.category === 'navigation');
  const interactionMetrics = metrics.filter(m => m.category === 'interaction');

  const startupTime = startupMetrics.length > 0
    ? startupMetrics[startupMetrics.length - 1].value
    : 0;

  const averagePageLoad = navigationMetrics.length > 0
    ? Math.round(navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length)
    : 0;

  return {
    metrics,
    summary: {
      startupTime,
      averagePageLoad,
      totalInteractions: interactionMetrics.length,
    },
  };
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics = [];
  saveMetrics();
}

/**
 * Load metrics from storage
 */
function loadMetrics(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      metrics = JSON.parse(stored);
    }
  } catch {
    metrics = [];
  }
}

/**
 * Save metrics to storage
 */
function saveMetrics(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // Storage not available
  }
}

/**
 * Performance measurement hook for React components
 */
import { useEffect } from 'react';

export function usePerformanceTracking(componentName: string): void {
  useEffect(() => {
    const endTracking = trackPageLoad(componentName);
    return () => endTracking();
  }, [componentName]);
}