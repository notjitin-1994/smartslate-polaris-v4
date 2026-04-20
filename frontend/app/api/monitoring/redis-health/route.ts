/**
 * Redis Health Check API Route
 *
 * Provides health status and diagnostics for Redis connection
 * Useful for monitoring and debugging Redis setup
 */

import { NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/cache/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/monitoring/redis-health
 *
 * Returns Redis connection status and performance metrics
 */
export async function GET(): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    const health = await checkRedisHealth();
    const responseTime = Date.now() - startTime;

    const status = health.connected ? 200 : 503;

    const response = {
      status: health.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: {
        connected: health.connected,
        latency: health.latency,
        error: health.error || null,
      },
      api: {
        responseTime: `${responseTime}ms`,
        endpoint: '/api/monitoring/redis-health',
      },
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    };

    return NextResponse.json(response, {
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Redis Health] Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        redis: {
          connected: false,
          latency: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
