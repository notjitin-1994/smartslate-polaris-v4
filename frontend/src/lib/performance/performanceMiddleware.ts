/**
 * Performance Monitoring Middleware
 *
 * Automatic performance tracking for Next.js API routes and pages
 * with configurable monitoring, alerting, and data collection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './performanceMonitor';

interface MiddlewareConfig {
  enabled: boolean;
  trackApiRoutes: boolean;
  trackPages: boolean;
  trackDatabaseQueries: boolean;
  sampleRate: number; // 0.0 to 1.0, percentage of requests to sample
  excludePaths: string[];
  includeHeaders: boolean;
  includeQueryParams: boolean;
  maxPayloadSize: number; // bytes
}

interface PerformanceContext {
  requestId: string;
  startTime: number;
  metadata: Record<string, any>;
  tags: Record<string, string>;
}

class PerformanceMiddleware {
  private config: MiddlewareConfig;
  private contexts: Map<string, PerformanceContext> = new Map();

  constructor(config?: Partial<MiddlewareConfig>) {
    this.config = {
      enabled: true,
      trackApiRoutes: true,
      trackPages: false, // Disabled by default to reduce overhead
      trackDatabaseQueries: true,
      sampleRate: 1.0, // Sample all requests in development
      excludePaths: ['/api/health', '/api/performance/metrics', '/_next/static', '/favicon.ico'],
      includeHeaders: false, // Disabled for security/privacy
      includeQueryParams: false, // Disabled for privacy
      maxPayloadSize: 1024 * 1024, // 1MB
      ...config,
    };

    // Adjust sampling rate for production
    if (process.env.NODE_ENV === 'production') {
      this.config.sampleRate = 0.1; // Sample 10% of requests in production
    }
  }

  /**
   * Create middleware wrapper for Next.js API routes
   */
  wrapApiHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    options?: {
      name?: string;
      category?: string;
      metadata?: Record<string, any>;
      customSampling?: number;
    }
  ) {
    return async (...args: T): Promise<R> => {
      if (
        !this.config.enabled ||
        Math.random() > (options?.customSampling || this.config.sampleRate)
      ) {
        // Skip monitoring if disabled or not sampled
        return handler(...args);
      }

      const request = args[0] as NextRequest;
      const apiName = options?.name || this.getApiName(request);
      const category = options?.category || 'api';

      // Check if path should be excluded
      if (this.shouldExcludePath(request.nextUrl.pathname)) {
        return handler(...args);
      }

      const requestId = this.generateRequestId();
      const metadata = {
        method: request.method,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: this.getClientIP(request),
        ...options?.metadata,
      };

      const tags = {
        type: category,
        method: request.method,
        path: this.sanitizePath(request.nextUrl.pathname),
      };

      // Start performance measurement
      const endTimer = performanceMonitor.startTimer(apiName, metadata, tags);

      try {
        // Execute the original handler
        const result = await handler(...args);

        // Record successful metric
        const metric = endTimer();
        metric.success = true;

        // Log slow requests
        const thresholds = performanceMonitor.getThresholds();
        const thresholdKey = this.getThresholdCategory(category);
        if (metric.duration > thresholds[thresholdKey].warning) {
          console.warn(`[Performance] Slow API request detected`, {
            requestId,
            apiName,
            duration: metric.duration,
            threshold: thresholds[thresholdKey].warning,
            method: request.method,
            path: request.nextUrl.pathname,
          });
        }

        return result;
      } catch (error) {
        // Record failed metric
        const metric = endTimer();
        metric.success = false;
        metric.metadata = {
          ...metric.metadata,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error.constructor.name,
        };

        console.error(`[Performance] API request failed`, {
          requestId,
          apiName,
          duration: metric.duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          method: request.method,
          path: request.nextUrl.pathname,
        });

        throw error;
      }
    };
  }

  /**
   * Middleware function for Next.js middleware
   */
  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse> => {
      if (!this.config.enabled || Math.random() > this.config.sampleRate) {
        return NextResponse.next();
      }

      const pathname = request.nextUrl.pathname;

      // Check if path should be excluded
      if (this.shouldExcludePath(pathname)) {
        return NextResponse.next();
      }

      const requestId = this.generateRequestId();
      const startTime = performance.now();

      // Create performance context
      const context: PerformanceContext = {
        requestId,
        startTime,
        metadata: {
          method: request.method,
          path: pathname,
          userAgent: request.headers.get('user-agent') || 'unknown',
          ip: this.getClientIP(request),
        },
        tags: {
          type: 'middleware',
          method: request.method,
          path: this.sanitizePath(pathname),
        },
      };

      this.contexts.set(requestId, context);

      // Add performance headers to request
      request.headers.set('x-performance-request-id', requestId);

      try {
        // Continue with the request
        const response = NextResponse.next();

        // Add performance headers to response
        response.headers.set('x-performance-request-id', requestId);
        response.headers.set('x-performance-start-time', startTime.toString());

        return response;
      } catch (error) {
        this.contexts.delete(requestId);
        throw error;
      }
    };
  }

  /**
   * Database query wrapper
   */
  wrapDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.config.trackDatabaseQueries) {
      return queryFn();
    }

    const endTimer = performanceMonitor.startTimer(
      queryName,
      {
        ...metadata,
        type: 'database',
      },
      {
        type: 'database',
      }
    );

    return endTimer()
      .then((metric) => {
        if (metric.duration > performanceMonitor.getThresholds().databaseQuery.warning) {
          console.warn(`[Performance] Slow database query detected`, {
            queryName,
            duration: metric.duration,
            threshold: performanceMonitor.getThresholds().databaseQuery.warning,
          });
        }

        // Return the original result (endTimer returns the metric, not the result)
        return queryFn();
      })
      .catch((error) => {
        console.error(`[Performance] Database query failed`, {
          queryName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      });
  }

  /**
   * Get API name from request
   */
  private getApiName(request: NextRequest): string {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // Extract meaningful name from path
    if (pathname.startsWith('/api/')) {
      const pathParts = pathname.split('/').filter(Boolean);
      const apiCategory = pathParts[1] || 'unknown';
      const apiAction = pathParts[2] || 'index';
      return `${apiCategory}_${apiAction}_${method.toLowerCase()}`;
    }

    return `${pathname.replace(/\//g, '_')}_${method.toLowerCase()}`;
  }

  /**
   * Get threshold category for monitoring
   */
  private getThresholdCategory(
    category: string
  ): keyof import('./performanceMonitor').PerformanceThresholds {
    if (category.includes('database')) return 'databaseQuery';
    if (category.includes('webhook')) return 'webhookProcessing';
    if (category.includes('blueprint')) return 'blueprintGeneration';
    if (category.includes('upload')) return 'fileUpload';
    return 'apiResponse';
  }

  /**
   * Check if path should be excluded from monitoring
   */
  private shouldExcludePath(pathname: string): boolean {
    return this.config.excludePaths.some((excludePath) => pathname.startsWith(excludePath));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Sanitize path for logging (remove sensitive parameters)
   */
  private sanitizePath(pathname: string): string {
    return pathname
      .replace(/\/[a-f0-9-]{36}/g, '/:id') // Replace UUIDs
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[^\/]*@[^\\/]*/g, '/:email') // Replace emails
      .replace(/\/token[^\/]*/g, '/:token'); // Replace tokens
  }

  /**
   * Get middleware configuration
   */
  getConfig(): MiddlewareConfig {
    return { ...this.config };
  }

  /**
   * Update middleware configuration
   */
  updateConfig(newConfig: Partial<MiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current performance contexts (for debugging)
   */
  getContexts(): Map<string, PerformanceContext> {
    return new Map(this.contexts);
  }

  /**
   * Clean up old contexts
   */
  cleanup(maxAge = 5 * 60 * 1000): void {
    // 5 minutes default
    const now = Date.now();
    for (const [id, context] of this.contexts.entries()) {
      if (now - context.startTime > maxAge) {
        this.contexts.delete(id);
      }
    }
  }
}

// Global performance middleware instance
export const performanceMiddleware = new PerformanceMiddleware({
  enabled: process.env.NODE_ENV !== 'test', // Disable in tests
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

// Utility functions for easy integration
export function withPerformanceTracking<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  options?: {
    name?: string;
    category?: string;
    metadata?: Record<string, any>;
    customSampling?: number;
  }
) {
  return performanceMiddleware.wrapApiHandler(handler, options);
}

export function measureDatabase<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMiddleware.wrapDatabaseQuery(queryName, queryFn, metadata);
}

// Auto-cleanup contexts every 5 minutes
setInterval(
  () => {
    performanceMiddleware.cleanup();
  },
  5 * 60 * 1000
);

export default performanceMiddleware;
