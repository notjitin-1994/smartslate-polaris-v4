'use client';

import { useEffect, useState } from 'react';

// Core Web Vitals types
export interface WebVitalsMetrics {
  // Largest Contentful Paint
  LCP: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // First Input Delay
  FID: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // Cumulative Layout Shift
  CLS: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // First Contentful Paint
  FCP: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // Time to First Byte
  TTFB: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;

  // Interaction to Next Paint (experimental)
  INP?: {
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    timestamp: number;
  } | null;
}

// Rating thresholds (in milliseconds for time-based metrics, score for CLS)
const RATING_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a numeric metric value
 */
function getMetricRating(
  metric: keyof typeof RATING_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = RATING_THRESHOLDS[metric];

  if (metric === 'CLS') {
    // CLS is a score, lower is better
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  } else {
    // Time-based metrics, lower is better
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }
}

/**
 * Hook for tracking Core Web Vitals
 */
export function useWebVitals(): WebVitalsMetrics {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null,
    INP: null,
  });

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals')
      .then(({ getLCP, getFID, getCLS, getFCP, getTTFB, getINP }) => {
        // Largest Contentful Paint
        getLCP((metric) => {
          setMetrics((prev) => ({
            ...prev,
            LCP: {
              value: metric.value,
              rating: getMetricRating('LCP', metric.value),
              timestamp: metric.entries[0]?.startTime || Date.now(),
            },
          }));
        });

        // First Input Delay
        getFID((metric) => {
          setMetrics((prev) => ({
            ...prev,
            FID: {
              value: metric.value,
              rating: getMetricRating('FID', metric.value),
              timestamp: metric.entries[0]?.startTime || Date.now(),
            },
          }));
        });

        // Cumulative Layout Shift
        getCLS((metric) => {
          setMetrics((prev) => ({
            ...prev,
            CLS: {
              value: metric.value,
              rating: getMetricRating('CLS', metric.value),
              timestamp: Date.now(),
            },
          }));
        });

        // First Contentful Paint
        getFCP((metric) => {
          setMetrics((prev) => ({
            ...prev,
            FCP: {
              value: metric.value,
              rating: getMetricRating('FCP', metric.value),
              timestamp: metric.entries[0]?.startTime || Date.now(),
            },
          }));
        });

        // Time to First Byte
        getTTFB((metric) => {
          setMetrics((prev) => ({
            ...prev,
            TTFB: {
              value: metric.value,
              rating: getMetricRating('TTFB', metric.value),
              timestamp: metric.entries[0]?.startTime || Date.now(),
            },
          }));
        });

        // Interaction to Next Paint (experimental)
        getINP((metric) => {
          setMetrics((prev) => ({
            ...prev,
            INP: {
              value: metric.value,
              rating: getMetricRating('INP', metric.value),
              timestamp: Date.now(),
            },
          }));
        });
      })
      .catch((error) => {
        console.warn('Failed to load web-vitals library:', error);
      });
  }, []);

  return metrics;
}

/**
 * Hook for custom performance monitoring
 */
export function usePerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<{
    navigation: PerformanceNavigationTiming | null;
    paint: {
      firstPaint?: number;
      firstContentfulPaint?: number;
    };
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }>({
    navigation: null,
    paint: {},
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !performance.getEntriesByType) return;

    // Navigation timing
    const navigationEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      setPerformanceData((prev) => ({
        ...prev,
        navigation: navigationEntries[0],
      }));
    }

    // Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find((entry) => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(
      (entry) => entry.name === 'first-contentful-paint'
    );

    setPerformanceData((prev) => ({
      ...prev,
      paint: {
        firstPaint: firstPaint?.startTime,
        firstContentfulPaint: firstContentfulPaint?.startTime,
      },
    }));

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setPerformanceData((prev) => ({
        ...prev,
        memory: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        },
      }));
    }
  }, []);

  return performanceData;
}

/**
 * Utility function to log performance metrics
 */
export function logPerformanceMetrics(metrics: WebVitalsMetrics, performanceData: any) {
  if (typeof window === 'undefined') return;

  const logData = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    webVitals: metrics,
    performance: performanceData,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    connection: (navigator as any).connection
      ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        }
      : undefined,
  };

  console.log('Performance Metrics:', logData);

  // Send to analytics service (replace with your analytics endpoint)
  // fetch('/api/analytics/performance', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(logData),
  // })
}
