/**
 * Admin System Status API
 * GET /api/admin/system-status
 *
 * Returns realtime status of all system services:
 * - API Services (Next.js runtime)
 * - Database (Supabase PostgreSQL)
 * - AI Services (Anthropic Gemini API)
 * - Storage (Supabase Storage)
 * - Payment Gateway (Razorpay)
 *
 * Requires admin/developer role
 */

import { NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth/adminAuth';
import { createClient } from '@/lib/supabase/server';

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ServiceStatus {
  name: string;
  status: 'Operational' | 'Degraded Performance' | 'Partial Outage' | 'Major Outage';
  color: 'bg-green-500' | 'bg-yellow-500' | 'bg-orange-500' | 'bg-red-500';
  responseTime?: number;
  lastChecked: string;
  details?: string;
}

/**
 * Check API Services health (Next.js runtime)
 */
async function checkAPIHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    // Check process health
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Realistic memory limits for Next.js
    // Development: 1.5GB, Production: 1GB
    const memoryLimit = process.env.NODE_ENV === 'production' ? 1024 : 1536;
    const memoryUtilization = memoryUsageMB / memoryLimit;

    const responseTime = Date.now() - startTime;

    // Only warn if above 90% of limit
    if (memoryUtilization > 0.9) {
      return {
        name: 'API Services',
        status: 'Degraded Performance',
        color: 'bg-yellow-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `High memory usage: ${memoryUsageMB.toFixed(2)}MB (${(memoryUtilization * 100).toFixed(1)}% of ${memoryLimit}MB limit)`,
      };
    }

    return {
      name: 'API Services',
      status: 'Operational',
      color: 'bg-green-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Uptime: ${Math.floor(uptime / 3600)}h, Memory: ${memoryUsageMB.toFixed(2)}MB`,
    };
  } catch (error) {
    return {
      name: 'API Services',
      status: 'Major Outage',
      color: 'bg-red-500',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: (error as Error).message,
    };
  }
}

/**
 * Check Database health (Supabase PostgreSQL)
 */
async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Test basic connection with a lightweight query
    // Using a simple select that should work regardless of RLS policies
    const { error: connectionError, data } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
      .maybeSingle();

    const responseTime = Date.now() - startTime;

    if (connectionError) {
      // Log the full error for debugging
      console.error('[System Status] Database health check error:', {
        message: connectionError.message,
        details: connectionError.details,
        hint: connectionError.hint,
        code: connectionError.code,
      });

      return {
        name: 'Database',
        status: 'Major Outage',
        color: 'bg-red-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `${connectionError.message} (Code: ${connectionError.code || 'unknown'})`,
      };
    }

    // Check response time
    if (responseTime > 3000) {
      return {
        name: 'Database',
        status: 'Degraded Performance',
        color: 'bg-yellow-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Slow response: ${responseTime}ms`,
      };
    }

    return {
      name: 'Database',
      status: 'Operational',
      color: 'bg-green-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Connected, Response: ${responseTime}ms`,
    };
  } catch (error) {
    // Log the full error for debugging
    console.error('[System Status] Database health check exception:', error);

    return {
      name: 'Database',
      status: 'Major Outage',
      color: 'bg-red-500',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `Connection failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Check AI Services health (Anthropic Gemini API)
 * Uses /v1/models endpoint - no token consumption
 */
async function checkAIHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return {
        name: 'AI Services',
        status: 'Major Outage',
        color: 'bg-red-500',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: 'API key not configured',
      };
    }

    // Use lightweight /v1/models endpoint - no token consumption, just checks auth/connectivity
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      if (response.status === 429) {
        return {
          name: 'AI Services',
          status: 'Degraded Performance',
          color: 'bg-yellow-500',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: 'Rate limited - high API usage',
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          name: 'AI Services',
          status: 'Major Outage',
          color: 'bg-red-500',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: 'Authentication failed - invalid API key',
        };
      }

      return {
        name: 'AI Services',
        status: 'Partial Outage',
        color: 'bg-orange-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `API error: ${response.status}`,
      };
    }

    // Check response time
    if (responseTime > 5000) {
      return {
        name: 'AI Services',
        status: 'Degraded Performance',
        color: 'bg-yellow-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Slow response: ${responseTime}ms`,
      };
    }

    return {
      name: 'AI Services',
      status: 'Operational',
      color: 'bg-green-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `API connected, Response time: ${responseTime}ms`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        name: 'AI Services',
        status: 'Partial Outage',
        color: 'bg-orange-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: 'Request timeout (>10s)',
      };
    }

    return {
      name: 'AI Services',
      status: 'Major Outage',
      color: 'bg-red-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: (error as Error).message,
    };
  }
}

/**
 * Check Storage health (Supabase Storage)
 */
async function checkStorageHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // List buckets (lightweight operation)
    const { data: buckets, error } = await supabase.storage.listBuckets();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'Storage',
        status: 'Major Outage',
        color: 'bg-red-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: error.message,
      };
    }

    // Check response time
    if (responseTime > 3000) {
      return {
        name: 'Storage',
        status: 'Degraded Performance',
        color: 'bg-yellow-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Slow response: ${responseTime}ms`,
      };
    }

    return {
      name: 'Storage',
      status: 'Operational',
      color: 'bg-green-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `${buckets?.length || 0} buckets, Response time: ${responseTime}ms`,
    };
  } catch (error) {
    return {
      name: 'Storage',
      status: 'Major Outage',
      color: 'bg-red-500',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: (error as Error).message,
    };
  }
}

/**
 * Check Payment Gateway health (Razorpay)
 */
async function checkPaymentHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return {
        name: 'Payment Gateway',
        status: 'Major Outage',
        color: 'bg-red-500',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        details: 'Payment credentials not configured',
      };
    }

    // Make a lightweight test request to Razorpay API
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/plans?count=1', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          name: 'Payment Gateway',
          status: 'Major Outage',
          color: 'bg-red-500',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: 'Authentication failed - invalid credentials',
        };
      }

      return {
        name: 'Payment Gateway',
        status: 'Partial Outage',
        color: 'bg-orange-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `API error: ${response.status}`,
      };
    }

    // Check response time
    if (responseTime > 3000) {
      return {
        name: 'Payment Gateway',
        status: 'Degraded Performance',
        color: 'bg-yellow-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Slow response: ${responseTime}ms`,
      };
    }

    return {
      name: 'Payment Gateway',
      status: 'Operational',
      color: 'bg-green-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Response time: ${responseTime}ms`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        name: 'Payment Gateway',
        status: 'Partial Outage',
        color: 'bg-orange-500',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: 'Request timeout (>5s)',
      };
    }

    return {
      name: 'Payment Gateway',
      status: 'Major Outage',
      color: 'bg-red-500',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: (error as Error).message,
    };
  }
}

/**
 * GET handler for system status
 */
export async function GET() {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Run all health checks in parallel for speed
    console.log('[System Status] Running health checks...');
    const [apiHealth, databaseHealth, aiHealth, storageHealth, paymentHealth] = await Promise.all([
      checkAPIHealth(),
      checkDatabaseHealth(),
      checkAIHealth(),
      checkStorageHealth(),
      checkPaymentHealth(),
    ]);
    console.log('[System Status] Health checks completed:', {
      api: apiHealth.status,
      database: databaseHealth.status,
      ai: aiHealth.status,
      storage: storageHealth.status,
      payment: paymentHealth.status,
    });

    const services: ServiceStatus[] = [
      apiHealth,
      databaseHealth,
      aiHealth,
      storageHealth,
      paymentHealth,
    ];

    // Calculate overall system health
    const operationalCount = services.filter((s) => s.status === 'Operational').length;
    const degradedCount = services.filter((s) => s.status === 'Degraded Performance').length;
    const partialOutageCount = services.filter((s) => s.status === 'Partial Outage').length;
    const majorOutageCount = services.filter((s) => s.status === 'Major Outage').length;

    let overallStatus: string;
    if (majorOutageCount > 0) {
      overallStatus = 'Critical Issues Detected';
    } else if (partialOutageCount > 0) {
      overallStatus = 'Some Services Degraded';
    } else if (degradedCount > 0) {
      overallStatus = 'Minor Performance Issues';
    } else {
      overallStatus = 'All Systems Operational';
    }

    return NextResponse.json(
      {
        services,
        summary: {
          overallStatus,
          operational: operationalCount,
          degraded: degradedCount,
          partialOutage: partialOutageCount,
          majorOutage: majorOutageCount,
          total: services.length,
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch system status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
