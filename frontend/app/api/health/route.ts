/**
 * Health Check API Route
 *
 * @description Health check endpoint for monitoring system status
 * Used by load balancers, monitoring systems, and DevOps tools
 *
 * @version 1.0.0
 * @date 2025-10-30
 *
 * @endpoint GET /api/health
 * @access public
 */

import { NextResponse } from 'next/server';
import { performHealthCheck, quickHealthCheck } from '@/lib/monitoring/healthChecks';
import { RATE_LIMIT_CONFIGS, rateLimitMiddleware } from '@/lib/middleware/rateLimiting';

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Rate limiting for health check (very generous but protects against abuse)
 */
const healthCheckRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute
  keyGenerator: (request: Request) => {
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    return `health-check:${ip}`;
  },
  message: 'Health check rate limit exceeded. Please try again later.',
});

/**
 * GET handler for health check
 */
export async function GET(request: Request): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Apply rate limiting (very generous for health checks)
    const rateLimitResult = await healthCheckRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Rate limit exceeded',
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
          },
        }
      );
    }

    // Check if this is a quick health check
    const url = new URL(request.url);
    const isQuickCheck = url.searchParams.get('quick') === 'true';

    const processingTime = Date.now() - startTime;

    if (isQuickCheck) {
      // Quick check returns simple status
      const quickCheck = await quickHealthCheck();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'X-Response-Time': processingTime.toString(),
        'X-Health-Status': quickCheck.status,
        'X-Health-Score': quickCheck.status === 'healthy' ? '100' : '0',
      };

      return NextResponse.json(quickCheck, {
        status: quickCheck.status === 'healthy' ? 200 : 503,
        headers,
      });
    }

    // Full health check
    const healthCheck = await performHealthCheck();

    // Determine HTTP status code based on health status
    let statusCode = 200;
    if (healthCheck.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (healthCheck.status === 'degraded') {
      statusCode = 200; // OK but with warnings
    }

    // Prepare response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Response-Time': processingTime.toString(),
      'X-Health-Status': healthCheck.status,
      'X-Health-Score': healthCheck.overallScore.toString(),
    };

    // Full health check response
    return NextResponse.json(
      {
        status: healthCheck.status,
        score: healthCheck.overallScore,
        timestamp: healthCheck.timestamp.toISOString(),
        processingTime: `${processingTime}ms`,
        checks: healthCheck.checks.map((check) => ({
          name: check.name,
          status: check.status,
          message: check.message,
          responseTime: check.responseTime ? `${check.responseTime}ms` : null,
          details: check.details,
          lastChecked: check.timestamp.toISOString(),
        })),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isTestMode: process.env.NODE_ENV === 'development',
          version: process.env.npm_package_version || 'unknown',
          uptime: process.uptime() ? `${Math.floor(process.uptime() / 3600)}h` : 'unknown',
        },
      },
      {
        status: statusCode,
        headers,
      }
    );
  } catch (error) {
    console.error('[Health Check] Health check failed:', error);

    // Return unhealthy status on error
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check system failure',
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
      }
    );
  }
}

/**
 * HEAD handler for health check (ultra-lightweight for connectivity checks)
 * This is called frequently by the offline queue manager, so it should be fast
 */
export async function HEAD(request: Request): Promise<NextResponse> {
  try {
    // Just check if the server is responding - don't run database checks
    // This is for client-side connectivity monitoring, not full health checks
    const headers: Record<string, string> = {
      'X-Health-Status': 'healthy',
      'X-Health-Score': '100',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    };

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  }
}
