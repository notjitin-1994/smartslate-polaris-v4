/**
 * Monitoring Status API Route
 *
 * Comprehensive monitoring endpoint exposing system health,
 * performance metrics, error tracking, and alerting status.
 */

import { NextResponse } from 'next/server';
import { errorTracker } from '@/lib/monitoring/errorTracking';
import { uptimeMonitor } from '@/lib/monitoring/uptimeMonitor';
import { alertingSystem } from '@/lib/monitoring/alertingSystem';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';
import { addApiSecurityHeaders } from '@/lib/security/securityHeaders';
import { createRateLimiter } from '@/lib/rate-limiting/redisRateLimit';
import { checkRedisHealth } from '@/lib/cache/redis';

// Rate limiting for monitoring endpoint
const monitoringRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyPrefix: 'monitoring_status',
});

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `monitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
 * GET handler - Get comprehensive monitoring status
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Extract client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Rate limiting check
    const rateLimitResult = await monitoringRateLimiter.checkLimit(ip);
    if (!rateLimitResult.success) {
      const response = createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests to monitoring endpoint',
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || [];
    const format = searchParams.get('format') || 'json';
    const timeRange = searchParams.get('timeRange') || '1h';

    console.log(`[Monitoring] Status request`, {
      requestId,
      include,
      format,
      timeRange,
      processingTime: Date.now() - startTime,
    });

    // Gather monitoring data
    const monitoringData = await gatherMonitoringData(include, timeRange);

    // Format response based on format
    let responseData;
    if (format === 'prometheus') {
      responseData = formatPrometheusMetrics(monitoringData);
    } else {
      responseData = monitoringData;
    }

    // Add rate limit headers to successful response
    const response = createSuccessResponse(responseData, requestId);
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString()
    );

    console.log(`[Monitoring] Status response sent`, {
      requestId,
      responseSize: JSON.stringify(responseData).length,
      processingTime: Date.now() - startTime,
    });

    return response;
  } catch (error: unknown) {
    console.error('[Monitoring] Unexpected error in status endpoint', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime,
    });

    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while retrieving monitoring status',
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
 * POST handler - Trigger manual health checks or alert checks
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400, requestId);
    }

    const { action, target } = requestBody as { action?: string; target?: string };

    console.log(`[Monitoring] Action request`, {
      requestId,
      action,
      target,
      processingTime: Date.now() - startTime,
    });

    let result;

    switch (action) {
      case 'health-check':
        result = await triggerHealthCheck(target);
        break;
      case 'alert-check':
        result = await triggerAlertCheck();
        break;
      case 'cleanup':
        result = await triggerCleanup();
        break;
      default:
        return createErrorResponse(
          'INVALID_ACTION',
          `Invalid action: ${action}. Supported actions: health-check, alert-check, cleanup`,
          400,
          requestId,
          { supportedActions: ['health-check', 'alert-check', 'cleanup'] }
        );
    }

    return createSuccessResponse(
      {
        message: `Action ${action} completed successfully`,
        action,
        target,
        result,
        executedAt: new Date().toISOString(),
      },
      requestId
    );
  } catch (error: unknown) {
    console.error('[Monitoring] Error in action endpoint', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime,
    });

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to execute monitoring action',
      500,
      requestId
    );
  }
}

/**
 * Gather comprehensive monitoring data
 */
async function gatherMonitoringData(include: string[], timeRange: string): Promise<any> {
  const startTime = Date.now();

  // Get Redis health status
  const redisHealth = await checkRedisHealth();

  const data: any = {
    timestamp: new Date().toISOString(),
    timeRange,
    uptime: Date.now() - process.uptime() * 1000,
  };

  // Redis status
  data.redis = {
    connected: redisHealth.connected,
    latency: redisHealth.latency,
    error: redisHealth.error,
    status: redisHealth.connected ? 'healthy' : 'unhealthy',
  };

  // System information
  if (include.includes('system') || include.length === 0) {
    data.system = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid,
    };
  }

  // Health status
  if (include.includes('health') || include.length === 0) {
    data.health = await uptimeMonitor.getHealthStatus();
  }

  // Performance metrics
  if (include.includes('performance') || include.length === 0) {
    data.performance = performanceMonitor.getSystemHealth();
  }

  // Error tracking
  if (include.includes('errors') || include.length === 0) {
    data.errors = errorTracker.getMetrics();
    data.recentErrors = errorTracker.getErrorsByCategory(undefined, 20);
  }

  // Alerting status
  if (include.includes('alerts') || include.length === 0) {
    data.alerts = {
      statistics: alertingSystem.getStatistics(),
      recentEvents: alertingSystem.getEvents(20, false),
      rules: Array.from(alertingSystem.getRules?.values() || []),
    };
  }

  // Uptime metrics
  if (include.includes('uptime') || include.length === 0) {
    data.uptimeMetrics = uptimeMonitor.getMetrics();
  }

  return data;
}

/**
 * Format metrics for Prometheus
 */
function formatPrometheusMetrics(data: any): string {
  const lines: string[] = [];

  // Add metadata
  lines.push('# HELP polaris_monitoring_uptime_seconds System uptime in seconds');
  lines.push('# TYPE polaris_monitoring_uptime_seconds gauge');
  lines.push(`polaris_monitoring_uptime_seconds ${data.uptime / 1000}`);

  // Health status
  if (data.health) {
    lines.push(
      '# HELP polaris_health_status Health check status (1=healthy, 0.5=degraded, 0=unhealthy)'
    );
    lines.push('# TYPE polaris_health_status gauge');

    for (const check of data.health.checks) {
      const status = check.status === 'healthy' ? 1 : check.status === 'degraded' ? 0.5 : 0;
      lines.push(`polaris_health_status{name="${check.name}"} ${status}`);
    }

    lines.push(`polaris_health_availability ${data.health.summary.availability}`);
  }

  // Error metrics
  if (data.errors) {
    lines.push('# HELP polaris_errors_total Total number of errors');
    lines.push('# TYPE polaris_errors_total counter');
    lines.push(`polaris_errors_total ${data.errors.totalErrors}`);

    for (const [category, count] of Object.entries(data.errors.errorsByCategory)) {
      lines.push(`polaris_errors_by_category{category="${category}"} ${count}`);
    }

    for (const [severity, count] of Object.entries(data.errors.errorsBySeverity)) {
      lines.push(`polaris_errors_by_severity{severity="${severity}"} ${count}`);
    }
  }

  // Performance metrics
  if (data.performance && data.performance.summary) {
    lines.push('# HELP polaris_performance_requests_total Total requests processed');
    lines.push('# TYPE polaris_performance_requests_total counter');
    lines.push(`polaris_performance_requests_total ${data.performance.summary.totalMetrics}`);

    lines.push('# HELP polaris_performance_availability System availability percentage');
    lines.push('# TYPE polaris_performance_availability gauge');
    lines.push(`polaris_performance_availability ${data.performance.summary.healthyCategories}`);
  }

  // Alert metrics
  if (data.alerts && data.alerts.statistics) {
    const stats = data.alerts.statistics;
    lines.push('# HELP polaris_alerts_total Total number of alerts');
    lines.push('# TYPE polaris_alerts_total counter');
    lines.push(`polaris_alerts_total ${stats.totalEvents}`);

    lines.push('# HELP polaris_alerts_active Number of active alerts');
    lines.push('# TYPE polaris_alerts_active gauge');
    lines.push(`polaris_alerts_active ${stats.activeEvents}`);

    for (const [severity, count] of Object.entries(stats.eventsBySeverity)) {
      lines.push(`polaris_alerts_by_severity{severity="${severity}"} ${count}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Trigger health check
 */
async function triggerHealthCheck(target?: string): Promise<any> {
  if (target) {
    // Check specific health check
    const result = await uptimeMonitor.runHealthCheck(target);
    return { target, result };
  } else {
    // Check all health checks
    const healthStatus = await uptimeMonitor.getHealthStatus();
    return { all: healthStatus };
  }
}

/**
 * Trigger alert check
 */
async function triggerAlertCheck(): Promise<any> {
  const events = await alertingSystem.checkRules();
  return {
    triggeredEvents: events.length,
    events: events.map((event) => ({
      id: event.id,
      ruleName: event.ruleName,
      severity: event.severity,
      message: event.message,
      timestamp: event.timestamp,
    })),
  };
}

/**
 * Trigger cleanup
 */
async function triggerCleanup(): Promise<any> {
  const results = {};

  // Clean up old errors
  errorTracker.clearOldErrors();
  results.errors = 'Old errors cleaned up';

  // Clean up old events
  // Note: This would be implemented in the alerting system

  // Clean up old metrics
  // Note: This would be implemented in the performance monitor

  results.timestamp = new Date().toISOString();
  return results;
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
