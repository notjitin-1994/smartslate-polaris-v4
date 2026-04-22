/**
 * Performance Monitoring System
 *
 * Provides comprehensive performance monitoring for API responses, database queries,
 * and application-level metrics with configurable thresholds and alerting.
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

interface PerformanceThresholds {
  apiResponse: { warning: number; critical: number };
  databaseQuery: { warning: number; critical: number };
  webhookProcessing: { warning: number; critical: number };
  blueprintGeneration: { warning: number; critical: number };
  fileUpload: { warning: number; critical: number };
}

interface PerformanceStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  successRate: number;
  errorRate: number;
}

interface PerformanceReport {
  name: string;
  stats: PerformanceStats;
  thresholds: PerformanceThresholds[string];
  health: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
  generatedAt: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private thresholds: PerformanceThresholds;
  private maxMetricsPerCategory: number;

  constructor(thresholds?: Partial<PerformanceThresholds>, maxMetricsPerCategory = 1000) {
    this.thresholds = {
      apiResponse: { warning: 500, critical: 1000 },
      databaseQuery: { warning: 100, critical: 250 },
      webhookProcessing: { warning: 1000, critical: 2000 },
      blueprintGeneration: { warning: 20000, critical: 45000 },
      fileUpload: { warning: 5000, critical: 10000 },
      ...thresholds,
    };
    this.maxMetricsPerCategory = maxMetricsPerCategory;
  }

  /**
   * Start measuring a performance operation
   */
  startTimer(
    name: string,
    metadata?: Record<string, any>,
    tags?: Record<string, string>
  ): () => PerformanceMetric {
    const startTime = performance.now();
    const startTimestamp = Date.now();

    return (): PerformanceMetric => {
      const endTime = performance.now();
      const endTimestamp = Date.now();
      const duration = endTime - startTime;

      const metric: PerformanceMetric = {
        name,
        startTime: startTimestamp,
        endTime: endTimestamp,
        duration,
        success: true,
        metadata,
        tags,
        thresholds: this.thresholds[this.getThresholdCategory(name)],
      };

      this.addMetric(metric);
      return metric;
    };
  }

  /**
   * Manually record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'thresholds'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      thresholds: this.thresholds[this.getThresholdCategory(metric.name)],
    };

    this.addMetric(fullMetric);
  }

  /**
   * Add metric to storage and enforce size limits
   */
  private addMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const categoryMetrics = this.metrics.get(metric.name)!;
    categoryMetrics.push(metric);

    // Keep only the most recent metrics
    if (categoryMetrics.length > this.maxMetricsPerCategory) {
      categoryMetrics.splice(0, categoryMetrics.length - this.maxMetricsPerCategory);
    }
  }

  /**
   * Get threshold category for a metric name
   */
  private getThresholdCategory(name: string): keyof PerformanceThresholds {
    if (name.includes('api') || name.includes('route')) return 'apiResponse';
    if (name.includes('database') || name.includes('query') || name.includes('supabase'))
      return 'databaseQuery';
    if (name.includes('webhook')) return 'webhookProcessing';
    if (name.includes('blueprint') || name.includes('generation')) return 'blueprintGeneration';
    if (name.includes('upload') || name.includes('file')) return 'fileUpload';
    return 'apiResponse'; // Default
  }

  /**
   * Calculate performance statistics for a metric category
   */
  calculateStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const successCount = metrics.filter((m) => m.success).length;

    return {
      count: metrics.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.percentile(durations, 0.5),
      p90: this.percentile(durations, 0.9),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      successRate: (successCount / metrics.length) * 100,
      errorRate: ((metrics.length - successCount) / metrics.length) * 100,
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Generate performance report for a metric category
   */
  generateReport(name: string): PerformanceReport | null {
    const stats = this.calculateStats(name);
    if (!stats) return null;

    const thresholdKey = this.getThresholdCategory(name);
    const thresholds = this.thresholds[thresholdKey];

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    const recommendations: string[] = [];

    // Check P95 against thresholds
    if (stats.p95 > thresholds.critical) {
      health = 'critical';
      recommendations.push(
        `P95 response time (${stats.p95.toFixed(2)}ms) exceeds critical threshold (${thresholds.critical}ms)`
      );
    } else if (stats.p95 > thresholds.warning) {
      health = 'warning';
      recommendations.push(
        `P95 response time (${stats.p95.toFixed(2)}ms) exceeds warning threshold (${thresholds.warning}ms)`
      );
    }

    // Check error rate
    if (stats.errorRate > 10) {
      health = 'critical';
      recommendations.push(`High error rate (${stats.errorRate.toFixed(1)}%) detected`);
    } else if (stats.errorRate > 5) {
      if (health === 'healthy') health = 'warning';
      recommendations.push(`Elevated error rate (${stats.errorRate.toFixed(1)}%) detected`);
    }

    // Check success rate
    if (stats.successRate < 95) {
      if (health === 'healthy') health = 'warning';
      recommendations.push(`Success rate (${stats.successRate.toFixed(1)}%) below target (95%)`);
    }

    // Performance-specific recommendations
    if (thresholdKey === 'apiResponse' && stats.averageDuration > 200) {
      recommendations.push('Consider optimizing API logic or implementing caching');
    }

    if (thresholdKey === 'databaseQuery' && stats.averageDuration > 50) {
      recommendations.push('Review database queries and add proper indexes');
    }

    if (thresholdKey === 'blueprintGeneration' && stats.averageDuration > 15000) {
      recommendations.push('Consider optimizing AI prompts or implementing streaming responses');
    }

    return {
      name,
      stats,
      thresholds,
      health,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all available metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get raw metrics for a category
   */
  getMetrics(name: string, limit = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-limit);
  }

  /**
   * Get metrics for a time range
   */
  getMetricsInTimeRange(name: string, startTime: number, endTime: number): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.filter((m) => m.startTime >= startTime && m.endTime <= endTime);
  }

  /**
   * Clear metrics for a category
   */
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    overall: 'healthy' | 'warning' | 'critical';
    categories: Record<string, PerformanceReport>;
    summary: {
      totalMetrics: number;
      healthyCategories: number;
      warningCategories: number;
      criticalCategories: number;
    };
  } {
    const categories: Record<string, PerformanceReport> = {};
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalMetrics = 0;

    for (const name of this.getMetricNames()) {
      const report = this.generateReport(name);
      if (report) {
        categories[name] = report;
        totalMetrics += report.stats.count;

        switch (report.health) {
          case 'healthy':
            healthyCount++;
            break;
          case 'warning':
            warningCount++;
            break;
          case 'critical':
            criticalCount++;
            break;
        }
      }
    }

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) overall = 'critical';
    else if (warningCount > 0) overall = 'warning';

    return {
      overall,
      categories,
      summary: {
        totalMetrics,
        healthyCategories: healthyCount,
        warningCategories: warningCount,
        criticalCategories: criticalCount,
      },
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    version: string;
    timestamp: string;
    thresholds: PerformanceThresholds;
    systemHealth: ReturnType<PerformanceMonitor['getSystemHealth']>;
    reports: Record<string, PerformanceReport>;
  } {
    const reports: Record<string, PerformanceReport> = {};
    for (const name of this.getMetricNames()) {
      const report = this.generateReport(name);
      if (report) {
        reports[name] = report;
      }
    }

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      thresholds: this.thresholds,
      systemHealth: this.getSystemHealth(),
      reports,
    };
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance scenarios
export function measureApiCall<T>(
  apiName: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<{ result: T; metric: PerformanceMetric }> {
  const endTimer = performanceMonitor.startTimer(apiName, metadata, { type: 'api' });

  return Promise.resolve(fn())
    .then((result) => {
      const metric = endTimer();
      return { result, metric };
    })
    .catch((error) => {
      const metric = endTimer();
      metric.success = false;
      throw error;
    });
}

export function measureDatabaseQuery<T>(
  queryName: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<{ result: T; metric: PerformanceMetric }> {
  const endTimer = performanceMonitor.startTimer(queryName, metadata, { type: 'database' });

  return Promise.resolve(fn())
    .then((result) => {
      const metric = endTimer();
      return { result, metric };
    })
    .catch((error) => {
      const metric = endTimer();
      metric.success = false;
      throw error;
    });
}

export function measureAsyncOperation<T>(
  operationName: string,
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<{ result: T; metric: PerformanceMetric }> {
  const endTimer = performanceMonitor.startTimer(operationName, metadata, { type: 'async' });

  return Promise.resolve(fn())
    .then((result) => {
      const metric = endTimer();
      return { result, metric };
    })
    .catch((error) => {
      const metric = endTimer();
      metric.success = false;
      throw error;
    });
}

export default performanceMonitor;
