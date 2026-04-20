/**
 * Vercel Production Monitoring Integration
 *
 * Integrates with Vercel's built-in monitoring tools including
 * Analytics, Speed Insights, Logs, and custom metrics.
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { alertingSystem } from './alertingSystem';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';

// ============================================================================
// Vercel Analytics Integration
// ============================================================================

/**
 * Vercel Analytics tracking for payment events
 */
export class VercelAnalyticsIntegration {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && !!process.env.VERCEL_ANALYTICS_ID;
  }

  /**
   * Track payment-related events
   */
  trackPaymentEvent(event: {
    type: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'subscription_created';
    amount?: number;
    currency?: string;
    plan?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    if (!this.isEnabled) return;

    try {
      // Use Vercel Analytics if available
      if (typeof window !== 'undefined' && window.va) {
        window.va('track', event.type, {
          value: event.amount,
          currency: event.currency,
          plan: event.plan,
          user_id: event.userId,
          ...event.metadata,
        });
      }

      console.log('[Vercel Analytics] Tracked payment event:', event.type, {
        amount: event.amount,
        plan: event.plan,
        userId: event.userId ? '****' + event.userId.slice(-4) : undefined,
      });
    } catch (error) {
      console.error('[Vercel Analytics] Failed to track payment event:', error);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetrics(metrics: {
    route: string;
    responseTime: number;
    status: number;
    method: string;
  }): void {
    if (!this.isEnabled) return;

    try {
      if (typeof window !== 'undefined' && window.va) {
        window.va('track', 'api_performance', {
          route: metrics.route,
          response_time: metrics.responseTime,
          status: metrics.status,
          method: metrics.method,
        });
      }

      console.log('[Vercel Analytics] Tracked performance metrics:', {
        route: metrics.route,
        responseTime: metrics.responseTime,
        status: metrics.status,
      });
    } catch (error) {
      console.error('[Vercel Analytics] Failed to track performance metrics:', error);
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(interaction: {
    type: 'button_click' | 'form_submit' | 'page_view' | 'error_occurred';
    element?: string;
    context?: string;
    error?: string;
  }): void {
    if (!this.isEnabled) return;

    try {
      if (typeof window !== 'undefined' && window.va) {
        window.va('track', interaction.type, {
          element: interaction.element,
          context: interaction.context,
          error: interaction.error,
        });
      }
    } catch (error) {
      console.error('[Vercel Analytics] Failed to track user interaction:', error);
    }
  }
}

// ============================================================================
// Vercel Speed Insights Integration
// ============================================================================

/**
 * Vercel Speed Insights monitoring
 */
export class VercelSpeedInsightsIntegration {
  private isEnabled: boolean;
  private thresholds = {
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100, // First Input Delay (ms)
    cls: 0.1, // Cumulative Layout Shift
    ttfb: 600, // Time to First Byte (ms)
  };

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Report Core Web Vitals
   */
  reportWebVitals(metric: {
    id: string;
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }): void {
    if (!this.isEnabled) return;

    const threshold = this.thresholds[metric.name as keyof typeof this.thresholds];
    if (!threshold) return;

    const isDegraded = metric.value > threshold;

    if (isDegraded) {
      console.warn(`[Vercel Speed Insights] Performance degradation detected:`, {
        metric: metric.name,
        value: metric.value,
        threshold,
        rating: metric.rating,
      });

      // Trigger alert for significant performance issues
      if (metric.rating === 'poor') {
        alertingSystem.addRule({
          name: `Performance Degradation - ${metric.name}`,
          description: `${metric.name} metric is in poor performance range`,
          enabled: true,
          severity: 'warning',
          cooldownPeriod: 15 * 60 * 1000, // 15 minutes
          conditions: [
            {
              type: 'response_time',
              operator: '>',
              threshold: metric.value,
              metric: `web_vitals_${metric.name}`,
            },
          ],
          actions: [
            {
              type: 'console',
              enabled: true,
              config: { level: 'warn' },
            },
          ],
        });
      }
    }

    // Track in Vercel Speed Insights
    if (typeof window !== 'undefined' && window.si) {
      window.si(metric);
    }
  }

  /**
   * Monitor route-specific performance
   */
  monitorRoutePerformance(route: string, loadTime: number): void {
    if (!this.isEnabled) return;

    // Alert if route load time exceeds threshold
    if (loadTime > 3000) {
      // 3 seconds
      console.warn(`[Vercel Speed Insights] Slow route detected:`, {
        route,
        loadTime,
        threshold: 3000,
      });

      alertingSystem.addRule({
        name: `Slow Route Load - ${route}`,
        description: `Route ${route} is loading slowly`,
        enabled: true,
        severity: 'warning',
        cooldownPeriod: 10 * 60 * 1000, // 10 minutes
        conditions: [
          {
            type: 'response_time',
            operator: '>',
            threshold: loadTime,
            metric: `route_load_${route.replace(/[^a-zA-Z0-9]/g, '_')}`,
          },
        ],
        actions: [
          {
            type: 'console',
            enabled: true,
            config: { level: 'warn' },
          },
        ],
      });
    }
  }
}

// ============================================================================
// Vercel Logs Integration
// ============================================================================

/**
 * Vercel Logs integration for centralized logging
 */
export class VercelLogsIntegration {
  private isEnabled: boolean;
  private logLevel: 'error' | 'warn' | 'info' | 'debug';

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.logLevel = (process.env.VERCEL_LOG_LEVEL as any) || 'info';
  }

  /**
   * Log structured events to Vercel
   */
  log(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    // Check if we should log this level
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.logLevel);
    const logLevelIndex = levels.indexOf(level);

    if (logLevelIndex < configLevelIndex) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'smartslate-polaris',
      environment: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      ...metadata,
    };

    // Log to console (Vercel will capture this)
    console.log(JSON.stringify(logEntry));

    // For errors, also trigger alerting
    if (level === 'error' || level === 'warn') {
      this.checkForAlertablePatterns(logEntry);
    }
  }

  /**
   * Check log patterns for alerting
   */
  private checkForAlertablePatterns(logEntry: any): void {
    const { message, level } = logEntry;

    // Critical patterns that should trigger immediate alerts
    const criticalPatterns = [
      /database.*connection.*failed/i,
      /razorpay.*api.*error/i,
      /webhook.*signature.*invalid/i,
      /payment.*processing.*failed/i,
      /out of memory/i,
      /timeout.*exceeded/i,
    ];

    const isCritical = criticalPatterns.some((pattern) => pattern.test(message));

    if (isCritical) {
      alertingSystem.addRule({
        name: `Critical Error Pattern - ${message.substring(0, 50)}...`,
        description: `Critical error pattern detected: ${message}`,
        enabled: true,
        severity: 'critical',
        cooldownPeriod: 1 * 60 * 1000, // 1 minute
        conditions: [
          {
            type: 'error_pattern',
            operator: '>=',
            threshold: 1,
            pattern: message.substring(0, 100),
            category: 'critical_error',
          },
        ],
        actions: [
          { type: 'console', enabled: true, config: { level: 'error' } },
          { type: 'log', enabled: true, config: { level: 'error' } },
        ],
      });
    }
  }

  /**
   * Log payment-specific events
   */
  logPaymentEvent(event: {
    type: string;
    status: 'success' | 'failed' | 'pending';
    amount?: number;
    userId?: string;
    error?: string;
    duration?: number;
  }): void {
    const level =
      event.status === 'failed' ? 'error' : event.status === 'pending' ? 'warn' : 'info';

    this.log(level, `Payment event: ${event.type}`, {
      event_type: event.type,
      status: event.status,
      amount: event.amount,
      user_id: event.userId ? '****' + event.userId.slice(-4) : undefined,
      error: event.error,
      duration: event.duration,
      category: 'payment',
    });
  }

  /**
   * Log webhook events
   */
  logWebhookEvent(event: {
    type: string;
    status: 'processed' | 'failed' | 'retry';
    eventId?: string;
    processingTime?: number;
    error?: string;
  }): void {
    const level = event.status === 'failed' ? 'error' : event.status === 'retry' ? 'warn' : 'info';

    this.log(level, `Webhook event: ${event.type}`, {
      event_type: event.type,
      status: event.status,
      event_id: event.eventId,
      processing_time: event.processingTime,
      error: event.error,
      category: 'webhook',
    });
  }
}

// ============================================================================
// Vercel Cron Jobs for Monitoring
// ============================================================================

/**
 * Vercel Cron job configuration for automated monitoring tasks
 */
export const VERCEL_CRON_CONFIG = {
  // Health check every 5 minutes
  health_check: {
    schedule: '*/5 * * * *',
    path: '/api/cron/health-check',
    description: 'Automated health checks',
  },

  // Metrics aggregation every hour
  metrics_aggregation: {
    schedule: '0 * * * *',
    path: '/api/cron/metrics-aggregation',
    description: 'Aggregate and store performance metrics',
  },

  // Alert cleanup every 6 hours
  alert_cleanup: {
    schedule: '0 */6 * * *',
    path: '/api/cron/alert-cleanup',
    description: 'Clean up old alerts and logs',
  },

  // Backup monitoring data daily
  backup_monitoring: {
    schedule: '0 2 * * *',
    path: '/api/cron/backup-monitoring',
    description: 'Backup monitoring data and logs',
  },
};

// ============================================================================
// Custom Metrics for Vercel
// ============================================================================

/**
 * Custom metrics collector for Vercel monitoring
 */
export class VercelCustomMetrics {
  private metrics: Map<string, number[]> = new Map();
  private maxDataPoints = 1000;

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Limit data points
    if (values.length > this.maxDataPoints) {
      values.shift();
    }

    console.log(`[Vercel Custom Metrics] Recorded metric: ${name} = ${value}`, tags);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): Record<string, any> {
    const exported: Record<string, any> = {};

    for (const [name] of this.metrics.entries()) {
      exported[name] = this.getMetricStats(name);
    }

    return {
      timestamp: new Date().toISOString(),
      metrics: exported,
    };
  }
}

// ============================================================================
// Initialize Vercel Integration
// ============================================================================

// Create singleton instances
export const vercelAnalytics = new VercelAnalyticsIntegration();
export const vercelSpeedInsights = new VercelSpeedInsightsIntegration();
export const vercelLogs = new VercelLogsIntegration();
export const vercelCustomMetrics = new VercelCustomMetrics();

/**
 * Initialize Vercel monitoring integrations
 */
export function initializeVercelMonitoring(): void {
  console.log('[Vercel Integration] Initializing Vercel monitoring...');

  // Enable production-specific monitoring
  if (process.env.NODE_ENV === 'production') {
    console.log('[Vercel Integration] Production mode - enabling all integrations');
  }

  // Set up periodic metric reporting
  if (typeof setInterval !== 'undefined') {
    setInterval(
      () => {
        const metrics = vercelCustomMetrics.exportMetrics();
        console.log('[Vercel Integration] Metrics report:', metrics);
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  console.log('[Vercel Integration] Vercel monitoring initialized');
}

// Type declarations for Vercel integrations
declare global {
  interface Window {
    va?: (command: string, eventName?: string, data?: Record<string, any>) => void;
    si?: (metric: any) => void;
  }
}

export default {
  vercelAnalytics,
  vercelSpeedInsights,
  vercelLogs,
  vercelCustomMetrics,
  VERCEL_CRON_CONFIG,
  initializeVercelMonitoring,
};
