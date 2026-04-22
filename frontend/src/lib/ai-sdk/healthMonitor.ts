/**
 * Provider Health Monitoring System
 *
 * Tracks provider performance metrics, response times, and error patterns
 * to enable proactive failure detection and performance optimization.
 *
 * Features:
 * - Real-time metrics collection (success rate, latency percentiles)
 * - Early warning detection for degrading performance
 * - Historical trend analysis
 * - Dashboard data export
 *
 * @module lib/ai-sdk/healthMonitor
 */

import { ProviderType } from './providerConfig';
import { getCircuitBreaker, CircuitState } from './circuitBreaker';

/**
 * Provider health status
 */
export enum HealthStatus {
  /** Provider is healthy and performing well */
  HEALTHY = 'HEALTHY',

  /** Provider is experiencing degraded performance */
  DEGRADED = 'DEGRADED',

  /** Provider is unhealthy and should be avoided */
  UNHEALTHY = 'UNHEALTHY',

  /** Provider status is unknown (insufficient data) */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Latency percentile metrics
 */
export interface LatencyMetrics {
  /** 50th percentile (median) response time in ms */
  p50: number;

  /** 95th percentile response time in ms */
  p95: number;

  /** 99th percentile response time in ms */
  p99: number;

  /** Average response time in ms */
  avg: number;

  /** Minimum response time in ms */
  min: number;

  /** Maximum response time in ms */
  max: number;
}

/**
 * Provider health metrics
 */
export interface ProviderHealthMetrics {
  /** Provider identifier */
  provider: ProviderType;

  /** Overall health status */
  status: HealthStatus;

  /** Total number of requests */
  totalRequests: number;

  /** Number of successful requests */
  successfulRequests: number;

  /** Number of failed requests */
  failedRequests: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Latency metrics */
  latency: LatencyMetrics;

  /** Current circuit breaker state */
  circuitState: CircuitState;

  /** Last request timestamp */
  lastRequestAt: number | null;

  /** Last success timestamp */
  lastSuccessAt: number | null;

  /** Last failure timestamp */
  lastFailureAt: number | null;

  /** Error rate in last 5 minutes (0-1) */
  recentErrorRate: number;

  /** Average response time trend (positive = getting slower) */
  latencyTrend: number;
}

/**
 * Request record for metrics calculation
 */
interface RequestRecord {
  timestamp: number;
  success: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
  /** Maximum number of request records to keep per provider */
  maxRecords: number;

  /** Time window for calculating recent error rate (ms) */
  recentWindow: number;

  /** Success rate threshold for DEGRADED status */
  degradedThreshold: number;

  /** Success rate threshold for UNHEALTHY status */
  unhealthyThreshold: number;

  /** Latency increase threshold for DEGRADED status (multiplier) */
  latencyThresholdMultiplier: number;
}

/**
 * Default health monitoring configuration
 */
export const DEFAULT_HEALTH_CONFIG: HealthMonitorConfig = {
  maxRecords: 1000,
  recentWindow: 300000, // 5 minutes
  degradedThreshold: 0.8, // 80% success rate
  unhealthyThreshold: 0.5, // 50% success rate
  latencyThresholdMultiplier: 1.5, // 50% slower than average
};

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Calculate latency metrics from request records
 */
function calculateLatencyMetrics(records: RequestRecord[]): LatencyMetrics {
  const latencies = records.map((r) => r.latencyMs).sort((a, b) => a - b);

  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  }

  const sum = latencies.reduce((a, b) => a + b, 0);

  return {
    p50: calculatePercentile(latencies, 50),
    p95: calculatePercentile(latencies, 95),
    p99: calculatePercentile(latencies, 99),
    avg: sum / latencies.length,
    min: latencies[0],
    max: latencies[latencies.length - 1],
  };
}

/**
 * Determine health status based on metrics
 */
function determineHealthStatus(
  successRate: number,
  recentErrorRate: number,
  latencyTrend: number,
  circuitState: CircuitState,
  config: HealthMonitorConfig
): HealthStatus {
  // Circuit breaker is open = unhealthy
  if (circuitState === CircuitState.OPEN) {
    return HealthStatus.UNHEALTHY;
  }

  // Very low success rate = unhealthy
  if (successRate < config.unhealthyThreshold) {
    return HealthStatus.UNHEALTHY;
  }

  // High recent error rate = degraded
  if (recentErrorRate > 1 - config.degradedThreshold) {
    return HealthStatus.DEGRADED;
  }

  // Moderate success rate = degraded
  if (successRate < config.degradedThreshold) {
    return HealthStatus.DEGRADED;
  }

  // Significant latency increase = degraded
  if (latencyTrend > config.latencyThresholdMultiplier) {
    return HealthStatus.DEGRADED;
  }

  // All good!
  return HealthStatus.HEALTHY;
}

/**
 * Provider Health Monitor
 */
export class ProviderHealthMonitor {
  private config: HealthMonitorConfig;
  private records: Map<ProviderType, RequestRecord[]>;

  constructor(config: HealthMonitorConfig = DEFAULT_HEALTH_CONFIG) {
    this.config = config;
    this.records = new Map();
  }

  /**
   * Get or initialize records for a provider
   */
  private getRecords(provider: ProviderType): RequestRecord[] {
    if (!this.records.has(provider)) {
      this.records.set(provider, []);
    }
    return this.records.get(provider)!;
  }

  /**
   * Record a request
   */
  recordRequest(provider: ProviderType, success: boolean, latencyMs: number, error?: string): void {
    const records = this.getRecords(provider);

    records.push({
      timestamp: Date.now(),
      success,
      latencyMs,
      error,
    });

    // Trim old records to prevent unbounded growth
    if (records.length > this.config.maxRecords) {
      records.splice(0, records.length - this.config.maxRecords);
    }
  }

  /**
   * Get recent records within time window
   */
  private getRecentRecords(provider: ProviderType): RequestRecord[] {
    const records = this.getRecords(provider);
    const cutoff = Date.now() - this.config.recentWindow;
    return records.filter((r) => r.timestamp > cutoff);
  }

  /**
   * Calculate recent error rate
   */
  private calculateRecentErrorRate(provider: ProviderType): number {
    const recent = this.getRecentRecords(provider);

    if (recent.length === 0) return 0;

    const failures = recent.filter((r) => !r.success).length;
    return failures / recent.length;
  }

  /**
   * Calculate latency trend (current avg vs historical avg)
   */
  private calculateLatencyTrend(provider: ProviderType): number {
    const all = this.getRecords(provider);
    const recent = this.getRecentRecords(provider);

    if (all.length < 10 || recent.length < 5) return 1.0; // Insufficient data

    const allLatencies = all.map((r) => r.latencyMs);
    const recentLatencies = recent.map((r) => r.latencyMs);

    const allAvg = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
    const recentAvg = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;

    return recentAvg / allAvg;
  }

  /**
   * Get health metrics for a provider
   */
  getMetrics(provider: ProviderType): ProviderHealthMetrics {
    const records = this.getRecords(provider);
    const circuitBreaker = getCircuitBreaker();
    const circuitState = circuitBreaker.getState(provider);

    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const latency = calculateLatencyMetrics(records);
    const recentErrorRate = this.calculateRecentErrorRate(provider);
    const latencyTrend = this.calculateLatencyTrend(provider);

    const lastRequest = records[records.length - 1];
    const lastSuccess = [...records].reverse().find((r) => r.success);
    const lastFailure = [...records].reverse().find((r) => !r.success);

    const status =
      totalRequests === 0
        ? HealthStatus.UNKNOWN
        : determineHealthStatus(
            successRate,
            recentErrorRate,
            latencyTrend,
            circuitState,
            this.config
          );

    return {
      provider,
      status,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      latency,
      circuitState,
      lastRequestAt: lastRequest?.timestamp || null,
      lastSuccessAt: lastSuccess?.timestamp || null,
      lastFailureAt: lastFailure?.timestamp || null,
      recentErrorRate,
      latencyTrend,
    };
  }

  /**
   * Get metrics for all providers
   */
  getAllMetrics(): Map<ProviderType, ProviderHealthMetrics> {
    const metrics = new Map<ProviderType, ProviderHealthMetrics>();

    // Get metrics for providers we've tracked
    for (const provider of this.records.keys()) {
      metrics.set(provider, this.getMetrics(provider));
    }

    // Add metrics for providers we haven't tracked yet
    for (const provider of Object.values(ProviderType)) {
      if (!metrics.has(provider)) {
        metrics.set(provider, this.getMetrics(provider));
      }
    }

    return metrics;
  }

  /**
   * Get dashboard data for visualization
   */
  getDashboardData(): {
    providers: ProviderHealthMetrics[];
    summary: {
      healthyCount: number;
      degradedCount: number;
      unhealthyCount: number;
      unknownCount: number;
      overallHealth: HealthStatus;
    };
  } {
    const allMetrics = this.getAllMetrics();
    const providers = Array.from(allMetrics.values());

    const healthyCount = providers.filter((p) => p.status === HealthStatus.HEALTHY).length;
    const degradedCount = providers.filter((p) => p.status === HealthStatus.DEGRADED).length;
    const unhealthyCount = providers.filter((p) => p.status === HealthStatus.UNHEALTHY).length;
    const unknownCount = providers.filter((p) => p.status === HealthStatus.UNKNOWN).length;

    // Determine overall health
    let overallHealth = HealthStatus.HEALTHY;
    if (unhealthyCount > 0) {
      overallHealth = HealthStatus.UNHEALTHY;
    } else if (degradedCount > 0) {
      overallHealth = HealthStatus.DEGRADED;
    } else if (healthyCount === 0) {
      overallHealth = HealthStatus.UNKNOWN;
    }

    return {
      providers,
      summary: {
        healthyCount,
        degradedCount,
        unhealthyCount,
        unknownCount,
        overallHealth,
      },
    };
  }

  /**
   * Reset metrics for a provider (for testing)
   */
  reset(provider: ProviderType): void {
    this.records.set(provider, []);
  }

  /**
   * Reset all metrics (for testing)
   */
  resetAll(): void {
    this.records.clear();
  }

  /**
   * Log health status for all providers
   */
  logHealthStatus(): void {
    if (typeof window !== 'undefined') return; // Only log server-side

    const dashboard = this.getDashboardData();

    console.log('\n💊 Provider Health Status:');
    console.log(`  Overall Health: ${dashboard.summary.overallHealth}`);
    console.log(`  Healthy: ${dashboard.summary.healthyCount}`);
    console.log(`  Degraded: ${dashboard.summary.degradedCount}`);
    console.log(`  Unhealthy: ${dashboard.summary.unhealthyCount}`);
    console.log(`  Unknown: ${dashboard.summary.unknownCount}\n`);

    dashboard.providers.forEach((metrics) => {
      const statusEmoji = {
        [HealthStatus.HEALTHY]: '✅',
        [HealthStatus.DEGRADED]: '⚠️',
        [HealthStatus.UNHEALTHY]: '❌',
        [HealthStatus.UNKNOWN]: '❓',
      }[metrics.status];

      console.log(`  ${statusEmoji} ${metrics.provider}:`);
      console.log(`    Status: ${metrics.status}`);
      console.log(`    Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
      console.log(
        `    Requests: ${metrics.successfulRequests}/${metrics.totalRequests} successful`
      );
      console.log(
        `    Latency (p50/p95/p99): ${metrics.latency.p50.toFixed(0)}ms / ${metrics.latency.p95.toFixed(0)}ms / ${metrics.latency.p99.toFixed(0)}ms`
      );
      console.log(`    Circuit: ${metrics.circuitState}`);
      if (metrics.lastSuccessAt) {
        const lastSuccessAge = Math.floor((Date.now() - metrics.lastSuccessAt) / 1000);
        console.log(`    Last Success: ${lastSuccessAge}s ago`);
      }
      console.log('');
    });
  }
}

/**
 * Singleton health monitor instance
 */
let healthMonitorInstance: ProviderHealthMonitor | null = null;

/**
 * Get the global health monitor instance
 */
export function getHealthMonitor(): ProviderHealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new ProviderHealthMonitor();
  }
  return healthMonitorInstance;
}

/**
 * Reset the global health monitor instance (for testing)
 */
export function resetHealthMonitorInstance(): void {
  healthMonitorInstance = null;
}
