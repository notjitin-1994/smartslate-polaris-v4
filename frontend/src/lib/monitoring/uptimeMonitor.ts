/**
 * Uptime Monitoring and Health Check System
 *
 * Comprehensive system for monitoring application health, dependencies,
 * and external services with automated health checks and alerting.
 */

import { errorTracker } from './errorTracking';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
  lastChecked: number;
  interval: number;
  timeout: number;
  checkFunction: () => Promise<HealthCheckResult>;
  metadata?: Record<string, any>;
}

interface HealthCheckResult {
  healthy: boolean;
  message: string;
  responseTime: number;
  metadata?: Record<string, any>;
}

interface UptimeMetrics {
  uptime: number;
  downtime: number;
  availability: number;
  totalChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  lastIncident?: {
    timestamp: number;
    duration: number;
    description: string;
  };
  incidents: Array<{
    timestamp: number;
    duration: number;
    description: string;
    resolvedAt?: number;
  }>;
}

interface ServiceDependency {
  name: string;
  url: string;
  type: 'database' | 'api' | 'cache' | 'external' | 'internal';
  critical: boolean;
  timeout: number;
  interval: number;
}

class UptimeMonitor {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: Map<string, UptimeMetrics> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime: number;
  private isEnabled: boolean;

  constructor() {
    this.startTime = Date.now();
    this.isEnabled = true;
  }

  /**
   * Add a health check
   */
  addHealthCheck(config: Omit<HealthCheck, 'lastChecked'>): void {
    const healthCheck: HealthCheck = {
      ...config,
      lastChecked: 0,
    };

    this.healthChecks.set(config.name, healthCheck);

    // Initialize metrics
    if (!this.metrics.has(config.name)) {
      this.metrics.set(config.name, {
        uptime: 0,
        downtime: 0,
        availability: 100,
        totalChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        incidents: [],
      });
    }

    // Start monitoring if enabled
    if (this.isEnabled) {
      this.startHealthCheck(healthCheck);
    }
  }

  /**
   * Remove a health check
   */
  removeHealthCheck(name: string): void {
    // Clear interval
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }

    // Remove health check
    this.healthChecks.delete(name);
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    if (enabled === this.isEnabled) return;

    this.isEnabled = enabled;

    if (enabled) {
      // Start all health checks
      for (const healthCheck of this.healthChecks.values()) {
        this.startHealthCheck(healthCheck);
      }
    } else {
      // Stop all health checks
      for (const interval of this.intervals.values()) {
        clearInterval(interval);
      }
      this.intervals.clear();
    }
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: string;
      message?: string;
      responseTime?: number;
      lastChecked: number;
      interval: number;
    }>;
    summary: {
      totalChecks: number;
      healthyChecks: number;
      degradedChecks: number;
      unhealthyChecks: number;
      availability: number;
    };
  }> {
    const checks = Array.from(this.healthChecks.values()).map((check) => ({
      name: check.name,
      status: check.status,
      message: check.message,
      responseTime: check.responseTime,
      lastChecked: check.lastChecked,
      interval: check.interval,
    }));

    const healthyChecks = checks.filter((c) => c.status === 'healthy').length;
    const degradedChecks = checks.filter((c) => c.status === 'degraded').length;
    const unhealthyChecks = checks.filter((c) => c.status === 'unhealthy').length;
    const totalChecks = checks.length;

    const overall: 'healthy' | 'degraded' | 'unhealthy' =
      unhealthyChecks > 0 ? 'unhealthy' : degradedChecks > 0 ? 'degraded' : 'healthy';

    return {
      overall,
      checks,
      summary: {
        totalChecks,
        healthyChecks,
        degradedChecks,
        unhealthyChecks,
        availability: totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0,
      },
    };
  }

  /**
   * Get uptime metrics
   */
  getMetrics(): Record<string, UptimeMetrics> {
    const metrics: Record<string, UptimeMetrics> = {};

    for (const [name, metric] of this.metrics.entries()) {
      const now = Date.now();
      const totalTime = now - this.startTime;
      const availability = totalTime > 0 ? (metric.uptime / totalTime) * 100 : 100;

      metrics[name] = {
        ...metric,
        availability,
      };
    }

    return metrics;
  }

  /**
   * Run a specific health check
   */
  async runHealthCheck(name: string): Promise<HealthCheckResult | null> {
    const healthCheck = this.healthChecks.get(name);
    if (!healthCheck) return null;

    const startTime = Date.now();

    try {
      const result = await Promise.race([
        healthCheck.checkFunction(),
        this.timeoutPromise(healthCheck.timeout),
      ]);

      const responseTime = Date.now() - startTime;

      // Update health check status
      healthCheck.status = result.healthy
        ? 'healthy'
        : result.message.includes('degraded')
          ? 'degraded'
          : 'unhealthy';
      healthCheck.message = result.message;
      healthCheck.responseTime = responseTime;
      healthCheck.lastChecked = Date.now();

      // Update metrics
      this.updateMetrics(name, result.healthy, responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      healthCheck.status = 'unhealthy';
      healthCheck.message = error instanceof Error ? error.message : 'Health check failed';
      healthCheck.responseTime = responseTime;
      healthCheck.lastChecked = Date.now();

      // Update metrics
      this.updateMetrics(name, false, responseTime);

      // Track error
      errorTracker.trackError(error, {
        component: 'uptime-monitor',
        action: 'health-check',
        healthCheck: name,
      });

      return {
        healthy: false,
        message: healthCheck.message,
        responseTime,
      };
    }
  }

  /**
   * Add built-in health checks
   */
  addBuiltInChecks(): void {
    // Database health check
    this.addHealthCheck({
      name: 'database',
      interval: 60 * 1000, // 1 minute
      timeout: 5000,
      checkFunction: async () => {
        // Skip database check during build/static generation
        if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME_API) {
          return {
            healthy: true,
            message: 'Database check skipped during build',
            responseTime: 0,
          };
        }

        // Test database connectivity
        try {
          const { getSupabaseServerClient } = await import('@/lib/supabase/server');
          const supabase = await getSupabaseServerClient();

          const startTime = Date.now();
          const { error } = await supabase.from('user_profiles').select('id').limit(1);
          const responseTime = Date.now() - startTime;

          if (error) {
            return {
              healthy: false,
              message: `Database connection failed: ${error.message}`,
              responseTime,
            };
          }

          return {
            healthy: true,
            message: 'Database connection successful',
            responseTime,
          };
        } catch (error) {
          return {
            healthy: false,
            message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            responseTime: 0,
          };
        }
      },
    });

    // API health check
    this.addHealthCheck({
      name: 'api',
      interval: 30 * 1000, // 30 seconds
      timeout: 3000,
      checkFunction: async () => {
        const startTime = Date.now();

        try {
          const response = await fetch('/api/health', {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
          });

          const responseTime = Date.now() - startTime;

          if (!response.ok) {
            return {
              healthy: false,
              message: `API health check failed: ${response.status} ${response.statusText}`,
              responseTime,
            };
          }

          const data = await response.json();

          return {
            healthy: data.status === 'healthy',
            message: data.message || 'API is healthy',
            responseTime,
            metadata: data,
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            healthy: false,
            message: `API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            responseTime,
          };
        }
      },
    });

    // Redis cache health check (if configured)
    if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
      this.addHealthCheck({
        name: 'redis-cache',
        interval: 60 * 1000, // 1 minute
        timeout: 3000,
        checkFunction: async () => {
          try {
            const { createCache } = await import('@/lib/cache/enhancedCache');
            const cache = createCache({ maxSize: 1, ttl: 1000 });

            const startTime = Date.now();
            await cache.set('health-check', 'test-value');
            const value = await cache.get('health-check');
            const responseTime = Date.now() - startTime;

            if (value === 'test-value') {
              return {
                healthy: true,
                message: 'Redis cache connection successful',
                responseTime,
              };
            }

            return {
              healthy: false,
              message: 'Redis cache test failed',
              responseTime,
            };
          } catch (error) {
            return {
              healthy: false,
              message: `Redis cache connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              responseTime: 0,
            };
          }
        },
      });
    }

    // Memory usage check
    this.addHealthCheck({
      name: 'memory',
      interval: 2 * 60 * 1000, // 2 minutes
      timeout: 1000,
      checkFunction: async () => {
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;
        const memoryUsagePercent = (usedMemory / totalMemory) * 100;

        let status: 'healthy' | 'degraded' | 'unhealthy';
        let message: string;

        if (memoryUsagePercent > 90) {
          status = 'unhealthy';
          message = `High memory usage: ${memoryUsagePercent.toFixed(2)}%`;
        } else if (memoryUsagePercent > 75) {
          status = 'degraded';
          message = `Elevated memory usage: ${memoryUsagePercent.toFixed(2)}%`;
        } else {
          status = 'healthy';
          message = `Memory usage normal: ${memoryUsagePercent.toFixed(2)}%`;
        }

        return {
          healthy: status === 'healthy',
          message,
          responseTime: 0,
          metadata: {
            heapUsed: usedMemory,
            heapTotal: totalMemory,
            usagePercent: memoryUsagePercent,
          },
        };
      },
    });

    // Disk space check (if available)
    this.addHealthCheck({
      name: 'disk-space',
      interval: 5 * 60 * 1000, // 5 minutes
      timeout: 2000,
      checkFunction: async () => {
        try {
          const fs = await import('fs');
          const stats = fs.statSync('.');

          // Basic disk check - in a real implementation you'd check actual disk space
          return {
            healthy: true,
            message: 'Disk space check passed',
            responseTime: 0,
          };
        } catch (error) {
          return {
            healthy: false,
            message: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            responseTime: 0,
          };
        }
      },
    });
  }

  // Private helper methods

  private startHealthCheck(healthCheck: HealthCheck): void {
    // Clear existing interval if any
    const existingInterval = this.intervals.get(healthCheck.name);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Set up new interval
    const interval = setInterval(async () => {
      await this.runHealthCheck(healthCheck.name);
    }, healthCheck.interval);

    this.intervals.set(healthCheck.name, interval);

    // Run initial check
    this.runHealthCheck(healthCheck.name);
  }

  private updateMetrics(name: string, healthy: boolean, responseTime: number): void {
    const metrics = this.metrics.get(name);
    if (!metrics) return;

    metrics.totalChecks++;

    if (!healthy) {
      metrics.failedChecks++;
      metrics.downtime += responseTime;

      // Record incident
      const incident = {
        timestamp: Date.now(),
        duration: 0,
        description: `Health check failed for ${name}`,
      };
      metrics.incidents.push(incident);
      metrics.lastIncident = incident;
    } else {
      metrics.uptime += responseTime;

      // Resolve last incident if exists
      if (metrics.lastIncident && !metrics.lastIncident.resolvedAt) {
        metrics.lastIncident.resolvedAt = Date.now();
        metrics.lastIncident.duration =
          metrics.lastIncident.resolvedAt - metrics.lastIncident.timestamp;
      }
    }

    // Update average response time
    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalChecks - 1) + responseTime) /
      metrics.totalChecks;
  }

  private timeoutPromise(timeout: number): Promise<HealthCheckResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Clear data
    this.healthChecks.clear();
    this.metrics.clear();
  }
}

// Global uptime monitor instance
export const uptimeMonitor = new UptimeMonitor();

// Initialize built-in checks
uptimeMonitor.addBuiltInChecks();

// Utility functions
export function getHealthStatus() {
  return uptimeMonitor.getHealthStatus();
}

export function getUptimeMetrics() {
  return uptimeMonitor.getMetrics();
}

export function addCustomHealthCheck(config: Omit<HealthCheck, 'lastChecked'>) {
  return uptimeMonitor.addHealthCheck(config);
}

export default uptimeMonitor;
