/**
 * Load Testing Infrastructure
 *
 * Comprehensive load testing framework for stress testing API endpoints
 * and application performance under concurrent load.
 */

import { performanceMonitor } from '@/lib/performance/performanceMonitor';

interface LoadTestConfig {
  concurrency: number;
  duration: number; // seconds
  rampUp: number; // seconds
  requestsPerSecond?: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  thinkTime?: number; // milliseconds between requests
}

interface LoadTestResult {
  config: LoadTestConfig;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    requestsPerSecond: number;
    totalDuration: number;
    errors: Array<{
      type: string;
      count: number;
      message: string;
    }>;
  };
  timeline: Array<{
    timestamp: number;
    activeConnections: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  recommendations: string[];
}

interface WorkerResult {
  workerId: number;
  requests: Array<{
    requestId: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    statusCode?: number;
    error?: string;
  }>;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
}

class LoadTester {
  private defaultConfig: Partial<LoadTestConfig> = {
    timeout: 30000,
    retries: 0,
    thinkTime: 0,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Polaris-LoadTester/1.0',
    },
  };

  /**
   * Run a comprehensive load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const fullConfig = { ...this.defaultConfig, ...config };
    console.log(`[LoadTest] Starting load test`, {
      endpoint: fullConfig.endpoint,
      concurrency: fullConfig.concurrency,
      duration: fullConfig.duration,
      rampUp: fullConfig.rampUp,
    });

    const startTime = Date.now();
    const results: WorkerResult[] = [];
    const timeline: LoadTestResult['timeline'] = [];
    const timelineInterval = setInterval(() => {
      this.recordTimelinePoint(results, timeline);
    }, 1000);

    try {
      // Calculate ramp-up delay between workers
      const rampDelay =
        fullConfig.rampUp > 0 ? (fullConfig.rampUp * 1000) / fullConfig.concurrency : 0;

      // Create and run workers
      const workerPromises: Promise<WorkerResult>[] = [];
      for (let i = 0; i < fullConfig.concurrency; i++) {
        const workerConfig = {
          ...fullConfig,
          workerId: i,
          startDelay: i * rampDelay,
        };

        workerPromises.push(this.runWorker(workerConfig));
      }

      // Wait for all workers to complete
      const workerResults = await Promise.all(workerPromises);
      results.push(...workerResults);

      clearInterval(timeline);
      const endTime = Date.now();

      // Calculate final results
      const result = this.calculateResults(fullConfig, results, startTime, endTime);

      console.log(`[LoadTest] Load test completed`, {
        totalRequests: result.summary.totalRequests,
        successRate: result.summary.successRate,
        averageResponseTime: result.summary.averageResponseTime,
        requestsPerSecond: result.summary.requestsPerSecond,
      });

      return result;
    } catch (error) {
      clearInterval(timeline);
      console.error('[LoadTest] Load test failed:', error);
      throw error;
    }
  }

  /**
   * Run individual worker
   */
  private async runWorker(
    config: LoadTestConfig & { workerId: number; startDelay: number }
  ): Promise<WorkerResult> {
    const { workerId, startDelay, duration, thinkTime } = config;

    // Wait for ramp-up delay
    if (startDelay > 0) {
      await this.sleep(startDelay);
    }

    const workerResult: WorkerResult = {
      workerId,
      requests: [],
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
    };

    const endTime = Date.now() + duration * 1000;
    let requestId = 0;

    try {
      while (Date.now() < endTime) {
        const requestStart = Date.now();
        requestId++;

        try {
          const response = await this.makeRequest(config, `worker-${workerId}-req-${requestId}`);
          const requestEnd = Date.now();

          workerResult.requests.push({
            requestId: `worker-${workerId}-req-${requestId}`,
            startTime: requestStart,
            endTime: requestEnd,
            duration: requestEnd - requestStart,
            success: true,
            statusCode: response.status,
          });

          workerResult.successfulRequests++;
        } catch (error) {
          const requestEnd = Date.now();

          workerResult.requests.push({
            requestId: `worker-${workerId}-req-${requestId}`,
            startTime: requestStart,
            endTime: requestEnd,
            duration: requestEnd - requestStart,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          workerResult.failedRequests++;
        }

        workerResult.totalRequests++;

        // Think time between requests
        if (thinkTime > 0) {
          await this.sleep(thinkTime);
        }
      }

      workerResult.totalDuration = Date.now() - (Date.now() - duration * 1000);

      return workerResult;
    } catch (error) {
      console.error(`[LoadTest] Worker ${workerId} failed:`, error);
      throw error;
    }
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(config: LoadTestConfig, requestId: string): Promise<Response> {
    const { endpoint, method, headers, body, timeout } = config;

    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          ...headers,
          'X-Load-Test-Request-Id': requestId,
          'X-Load-Test-Timestamp': Date.now().toString(),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Record timeline point for monitoring
   */
  private recordTimelinePoint(results: WorkerResult[], timeline: LoadTestResult['timeline']): void {
    const now = Date.now();
    const recentWindow = 5000; // 5 seconds

    // Get recent requests
    const recentRequests = results.flatMap((worker) =>
      worker.requests.filter((req) => now - req.endTime <= recentWindow)
    );

    const activeConnections = results.filter(
      (worker) =>
        worker.requests.length > 0 &&
        worker.requests[worker.requests.length - 1].endTime > now - 1000
    ).length;

    const successfulRequests = recentRequests.filter((req) => req.success).length;
    const totalRequests = recentRequests.length;
    const averageResponseTime =
      totalRequests > 0
        ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / totalRequests
        : 0;

    timeline.push({
      timestamp: now,
      activeConnections,
      requestsPerSecond: totalRequests / 5, // requests per second over 5 second window
      averageResponseTime,
      errorRate:
        totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0,
    });
  }

  /**
   * Calculate comprehensive results
   */
  private calculateResults(
    config: LoadTestConfig,
    results: WorkerResult[],
    startTime: number,
    endTime: number
  ): LoadTestResult {
    const allRequests = results.flatMap((worker) => worker.requests);
    const successfulRequests = allRequests.filter((req) => req.success);
    const failedRequests = allRequests.filter((req) => !req.success);

    const durations = allRequests.map((req) => req.duration).sort((a, b) => a - b);
    const totalDuration = endTime - startTime;

    // Calculate percentiles
    const percentile = (sorted: number[], p: number): number => {
      if (sorted.length === 0) return 0;
      const index = Math.ceil(sorted.length * p) - 1;
      return sorted[Math.max(0, index)];
    };

    // Analyze errors
    const errors = this.analyzeErrors(failedRequests);

    // Generate recommendations
    const recommendations = this.generateRecommendations(config, {
      totalRequests: allRequests.length,
      successRate: (successfulRequests.length / allRequests.length) * 100,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95: percentile(durations, 0.95),
    });

    return {
      config,
      summary: {
        totalRequests: allRequests.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        successRate: (successfulRequests.length / allRequests.length) * 100,
        averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minResponseTime: durations[0] || 0,
        maxResponseTime: durations[durations.length - 1] || 0,
        p50: percentile(durations, 0.5),
        p90: percentile(durations, 0.9),
        p95: percentile(durations, 0.95),
        p99: percentile(durations, 0.99),
        requestsPerSecond: allRequests.length / (totalDuration / 1000),
        totalDuration,
        errors,
      },
      timeline: results[0]?.workerId === 0 ? [] : [], // Timeline handled separately
      recommendations,
    };
  }

  /**
   * Analyze errors from failed requests
   */
  private analyzeErrors(
    failedRequests: WorkerResult['requests']
  ): LoadTestResult['summary']['errors'] {
    const errorMap = new Map<string, { count: number; message: string }>();

    for (const request of failedRequests) {
      const errorKey = request.error || 'Unknown error';
      const existing = errorMap.get(errorKey);

      if (existing) {
        existing.count++;
      } else {
        errorMap.set(errorKey, { count: 1, message: errorKey });
      }
    }

    return Array.from(errorMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      message: data.message,
    }));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    config: LoadTestConfig,
    metrics: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: number;
      p95: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (metrics.successRate < 95) {
      recommendations.push(
        `Success rate (${metrics.successRate.toFixed(1)}%) is below target (95%). Check for errors and resource constraints.`
      );
    }

    if (metrics.successRate < 99) {
      recommendations.push(
        `Success rate (${metrics.successRate.toFixed(1)}%) could be improved. Review error handling and retry logic.`
      );
    }

    // Response time recommendations
    if (metrics.averageResponseTime > 500) {
      recommendations.push(
        `Average response time (${metrics.averageResponseTime.toFixed(2)}ms) exceeds 500ms target. Consider optimization or caching.`
      );
    }

    if (metrics.p95 > 1000) {
      recommendations.push(
        `P95 response time (${metrics.p95.toFixed(2)}ms) exceeds 1s target. Some requests are significantly slower.`
      );
    }

    if (metrics.p95 > 2000) {
      recommendations.push(
        `P95 response time (${metrics.p95.toFixed(2)}ms) exceeds 2s. Critical performance issues detected.`
      );
    }

    // Concurrency recommendations
    if (config.concurrency > 50 && metrics.successRate < 99) {
      recommendations.push(
        `High concurrency (${config.concurrency}) with low success rate. Consider rate limiting or scaling infrastructure.`
      );
    }

    // Error pattern recommendations
    if (metrics.totalRequests > 100 && metrics.successRate < 90) {
      recommendations.push(
        'High error rate under load. Review database connections, memory usage, and external dependencies.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Performance looks good! Monitor for consistency and plan for increased load.'
      );
    }

    return recommendations;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate load test report
   */
  generateReport(result: LoadTestResult): string {
    const { config, summary, recommendations } = result;

    return `
# Load Test Report

## Configuration
- **Endpoint**: ${config.endpoint}
- **Method**: ${config.method}
- **Concurrency**: ${config.concurrency} users
- **Duration**: ${config.duration} seconds
- **Ramp-up**: ${config.rampUp} seconds
- **Think Time**: ${config.thinkTime || 0}ms

## Results
- **Total Requests**: ${summary.totalRequests}
- **Successful Requests**: ${summary.successfulRequests}
- **Failed Requests**: ${summary.failedRequests}
- **Success Rate**: ${summary.successRate.toFixed(2)}%
- **Requests/Second**: ${summary.requestsPerSecond.toFixed(2)}

## Response Times
- **Average**: ${summary.averageResponseTime.toFixed(2)}ms
- **Min**: ${summary.minResponseTime}ms
- **Max**: ${summary.maxResponseTime}ms
- **P50**: ${summary.p50.toFixed(2)}ms
- **P90**: ${summary.p90.toFixed(2)}ms
- **P95**: ${summary.p95.toFixed(2)}ms
- **P99**: ${summary.p99.toFixed(2)}ms

## Errors
${summary.errors.map((error) => `- **${error.type}**: ${error.count} occurrences`).join('\n') || 'No errors detected'}

## Recommendations
${recommendations.map((rec) => `- ${rec}`).join('\n')}

## Performance Assessment
${this.getPerformanceAssessment(summary)}

*Generated at: ${new Date().toISOString()}*
    `.trim();
  }

  /**
   * Get performance assessment
   */
  private getPerformanceAssessment(summary: LoadTestResult['summary']): string {
    if (summary.successRate >= 99.9 && summary.p95 <= 500) {
      return '🟢 **Excellent** - Performance is outstanding and ready for production';
    }

    if (summary.successRate >= 99 && summary.p95 <= 1000) {
      return '🟡 **Good** - Performance is acceptable with minor room for improvement';
    }

    if (summary.successRate >= 95 && summary.p95 <= 2000) {
      return '🟠 **Fair** - Performance needs attention before production deployment';
    }

    return '🔴 **Poor** - Significant performance issues require immediate attention';
  }
}

// Predefined load test configurations
export const loadTestConfigs = {
  // Pricing page load test
  pricingPage: {
    concurrency: 100,
    duration: 120, // 2 minutes
    rampUp: 30, // 30 seconds ramp-up
    endpoint: '/api/pricing',
    method: 'GET' as const,
    thinkTime: 500, // 500ms between requests
  },

  // Subscription creation load test
  subscriptionCreation: {
    concurrency: 50,
    duration: 180, // 3 minutes
    rampUp: 60, // 1 minute ramp-up
    endpoint: '/api/subscriptions/create-subscription',
    method: 'POST' as const,
    body: {
      tier: 'navigator',
      billingCycle: 'monthly',
      customerInfo: {
        name: 'Load Test User',
        email: 'test@loadtest.com',
        contact: '+1234567890',
      },
    },
    thinkTime: 2000, // 2 seconds between requests
  },

  // Blueprint generation load test
  blueprintGeneration: {
    concurrency: 20,
    duration: 300, // 5 minutes
    rampUp: 60, // 1 minute ramp-up
    endpoint: '/api/blueprints/generate',
    method: 'POST' as const,
    body: {
      blueprintId: 'test-blueprint-id',
    },
    thinkTime: 5000, // 5 seconds between requests
  },

  // Health check load test
  healthCheck: {
    concurrency: 200,
    duration: 60, // 1 minute
    rampUp: 10, // 10 seconds ramp-up
    endpoint: '/api/health',
    method: 'GET' as const,
    thinkTime: 100, // 100ms between requests
  },
};

export const loadTester = new LoadTester();
export default loadTester;
