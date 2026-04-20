/**
 * Performance Metrics API Route
 *
 * Exposes performance monitoring data for health checks and monitoring dashboards
 * Includes authentication, rate limiting, and comprehensive metrics reporting.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { addApiSecurityHeaders } from '@/lib/security/securityHeaders';
import { createRateLimiter } from '@/lib/rate-limiting/redisRateLimit';

// Rate limiting for metrics endpoint
const metricsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  keyPrefix: 'performance_metrics',
});

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create error response
 */
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  requestId: string,
  details?: any
): NextResponse {
  const errorResponse = {
    success: false,
    error: { code, message, details },
    requestId,
    timestamp: new Date().toISOString(),
  };

  const response = NextResponse.json(errorResponse, { status });
  return addApiSecurityHeaders(response);
}

/**
 * Create success response
 */
function createSuccessResponse(data: any, requestId: string, status = 200): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      data,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );

  return addApiSecurityHeaders(response);
}

/**
 * GET handler - Retrieve performance metrics
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Extract client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Rate limiting check
    const rateLimitResult = await metricsRateLimiter.checkLimit(ip);
    if (!rateLimitResult.success) {
      console.warn(`[Performance] Rate limit exceeded for IP: ${ip}`, {
        requestId,
        ip,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
      });

      const response = createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests to performance metrics endpoint',
        429,
        requestId,
        {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          retryAfter: rateLimitResult.retryAfter,
        }
      );

      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set(
        'Retry-After',
        Math.ceil((rateLimitResult.retryAfter || 60) / 1000).toString()
      );

      return response;
    }

    // Parse URL for query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const format = searchParams.get('format') || 'json';
    const includeRaw = searchParams.get('includeRaw') === 'true';
    const timeRange = searchParams.get('timeRange');

    // Authentication check (optional for public health endpoints, required for detailed metrics)
    const sessionResult = await getServerSession();
    const isAuthenticated = !!sessionResult.session?.user;

    // Validate format parameter
    if (!['json', 'prometheus'].includes(format)) {
      return createErrorResponse(
        'INVALID_FORMAT',
        'Invalid format parameter. Must be "json" or "prometheus"',
        400,
        requestId,
        { format }
      );
    }

    console.log(`[Performance] Metrics request`, {
      requestId,
      isAuthenticated,
      category,
      format,
      includeRaw,
      timeRange,
      processingTime: Date.now() - startTime,
    });

    // Get performance data
    let responseData: any;

    if (format === 'prometheus') {
      responseData = generatePrometheusMetrics(category, isAuthenticated);
    } else {
      responseData = generateJsonMetrics(category, includeRaw, isAuthenticated, timeRange);
    }

    // Add rate limit headers to successful response
    const response = createSuccessResponse(responseData, requestId);
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString()
    );

    console.log(`[Performance] Metrics response sent`, {
      requestId,
      responseSize: JSON.stringify(responseData).length,
      processingTime: Date.now() - startTime,
    });

    return response;
  } catch (error: unknown) {
    console.error('[Performance] Unexpected error in metrics endpoint', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime,
    });

    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while retrieving performance metrics',
      500,
      requestId,
      {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      }
    );
  }
}

/**
 * Generate JSON format metrics
 */
function generateJsonMetrics(
  category: string | null,
  includeRaw: boolean,
  isAuthenticated: boolean,
  timeRange: string | null
): any {
  if (category) {
    // Specific category metrics
    const report = performanceMonitor.generateReport(category);
    if (!report) {
      return {
        category,
        found: false,
        message: 'No metrics available for this category',
      };
    }

    return {
      category,
      found: true,
      report,
      rawMetrics: includeRaw ? performanceMonitor.getMetrics(category) : undefined,
    };
  } else {
    // System-wide metrics
    const systemHealth = performanceMonitor.getSystemHealth();

    const baseResponse = {
      systemHealth: {
        overall: systemHealth.overall,
        summary: systemHealth.summary,
        generatedAt:
          systemHealth.categories[Object.keys(systemHealth.categories)[0]]?.generatedAt ||
          new Date().toISOString(),
      },
      categories: Object.keys(systemHealth.categories).reduce(
        (acc, name) => {
          const report = systemHealth.categories[name];
          acc[name] = {
            health: report.health,
            stats: {
              count: report.stats.count,
              averageDuration: Math.round(report.stats.averageDuration * 100) / 100,
              p95: Math.round(report.stats.p95 * 100) / 100,
              successRate: Math.round(report.stats.successRate * 100) / 100,
            },
            thresholds: report.thresholds,
            recommendations: report.recommendations,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    };

    // Include detailed reports for authenticated users
    if (isAuthenticated) {
      (baseResponse as any).detailedReports = systemHealth.categories;

      if (includeRaw) {
        (baseResponse as any).rawMetrics = {};
        for (const name of performanceMonitor.getMetricNames()) {
          (baseResponse as any).rawMetrics[name] = performanceMonitor.getMetrics(name, 50);
        }
      }
    }

    return baseResponse;
  }
}

/**
 * Generate Prometheus format metrics
 */
function generatePrometheusMetrics(category: string | null, isAuthenticated: boolean): string {
  const lines: string[] = [];

  // Add metadata
  lines.push('# HELP polaris_performance_duration_ms Performance duration in milliseconds');
  lines.push('# TYPE polaris_performance_duration_ms gauge');
  lines.push('# HELP polaris_performance_success_rate Performance success rate percentage');
  lines.push('# TYPE polaris_performance_success_rate gauge');
  lines.push('# HELP polars_performance_count Total number of performance measurements');
  lines.push('# TYPE polars_performance_count counter');

  const metricNames = category ? [category] : performanceMonitor.getMetricNames();

  for (const name of metricNames) {
    const report = performanceMonitor.generateReport(name);
    if (!report) continue;

    const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');

    // Duration metrics
    lines.push(
      `polaris_performance_duration_ms{name="${sanitizedName}",quantile="avg"} ${report.stats.averageDuration}`
    );
    lines.push(
      `polaris_performance_duration_ms{name="${sanitizedName}",quantile="p50"} ${report.stats.p50}`
    );
    lines.push(
      `polaris_performance_duration_ms{name="${sanitizedName}",quantile="p90"} ${report.stats.p90}`
    );
    lines.push(
      `polaris_performance_duration_ms{name="${sanitizedName}",quantile="p95"} ${report.stats.p95}`
    );
    lines.push(
      `polaris_performance_duration_ms{name="${sanitizedName}",quantile="p99"} ${report.stats.p99}`
    );

    // Success rate
    lines.push(
      `polaris_performance_success_rate{name="${sanitizedName}"} ${report.stats.successRate}`
    );

    // Count
    lines.push(`polars_performance_count{name="${sanitizedName}"} ${report.stats.count}`);

    // Health status as numeric value
    const healthValue = report.health === 'healthy' ? 1 : report.health === 'warning' ? 0.5 : 0;
    lines.push(`polaris_performance_health{name="${sanitizedName}"} ${healthValue}`);

    // Threshold information
    lines.push(
      `polaris_performance_threshold_warning{name="${sanitizedName}"} ${report.thresholds.warning}`
    );
    lines.push(
      `polaris_performance_threshold_critical{name="${sanitizedName}"} ${report.thresholds.critical}`
    );
  }

  return lines.join('\n') + '\n';
}

/**
 * POST handler - Clear metrics (admin only)
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Authentication required for clearing metrics
    const sessionResult = await getServerSession();
    if (!sessionResult.session || !sessionResult.session.user) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required to clear performance metrics',
        401,
        requestId
      );
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400, requestId);
    }

    const { category } = requestBody as { category?: string };

    console.log(`[Performance] Clear metrics request`, {
      requestId,
      userId: sessionResult.session.user.id,
      category,
      processingTime: Date.now() - startTime,
    });

    // Clear metrics
    performanceMonitor.clearMetrics(category);

    return createSuccessResponse(
      {
        message: category
          ? `Cleared metrics for category: ${category}`
          : 'Cleared all performance metrics',
        category,
        clearedAt: new Date().toISOString(),
      },
      requestId
    );
  } catch (error: unknown) {
    console.error('[Performance] Error in clear metrics endpoint', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime,
    });

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to clear performance metrics',
      500,
      requestId
    );
  }
}

/**
 * GET handler for unsupported methods
 */
export async function PUT(): Promise<Response> {
  const requestId = generateRequestId();
  return createErrorResponse(
    'METHOD_NOT_ALLOWED',
    'PUT method is not allowed for this endpoint',
    405,
    requestId
  );
}

export async function DELETE(): Promise<Response> {
  const requestId = generateRequestId();
  return createErrorResponse(
    'METHOD_NOT_ALLOWED',
    'DELETE method is not allowed for this endpoint',
    405,
    requestId
  );
}

export async function PATCH(): Promise<Response> {
  const requestId = generateRequestId();
  return createErrorResponse(
    'METHOD_NOT_ALLOWED',
    'PATCH method is not allowed for this endpoint',
    405,
    requestId
  );
}
