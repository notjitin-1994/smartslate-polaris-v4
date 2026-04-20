/**
 * Admin System Status Detail API
 * GET /api/admin/system-status/[component]
 *
 * Returns detailed status information for a specific system component
 * Includes metrics, recent events, and recommendations
 *
 * Requires admin/developer role
 */

import { NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth/adminAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ComponentType = 'api' | 'database' | 'ai' | 'storage' | 'payment';

interface DetailedStatus {
  name: string;
  status: 'Operational' | 'Degraded Performance' | 'Partial Outage' | 'Major Outage';
  responseTime?: number;
  lastChecked: string;
  details?: string;
  metrics: Array<{
    label: string;
    value: string;
    status?: 'success' | 'warning' | 'error';
  }>;
  recentEvents: Array<{
    timestamp: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  recommendations: string[];
}

/**
 * Get detailed API Services status
 */
async function getAPIDetails(): Promise<DetailedStatus> {
  const startTime = Date.now();
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
  const memoryLimit = process.env.NODE_ENV === 'production' ? 1024 : 1536;
  const memoryUtilization = memoryUsageMB / memoryLimit;
  const responseTime = Date.now() - startTime;

  const status = memoryUtilization > 0.9 ? 'Degraded Performance' : 'Operational';
  const recommendations: string[] = [];

  if (memoryUtilization > 0.8) {
    recommendations.push(
      'High memory usage detected. Consider restarting the service or investigating memory leaks.'
    );
  }
  if (uptime < 3600) {
    recommendations.push('Service was recently restarted. Monitor for stability.');
  }

  return {
    name: 'API Services',
    status,
    responseTime,
    lastChecked: new Date().toISOString(),
    details: `Next.js runtime is ${status.toLowerCase()}. Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    metrics: [
      {
        label: 'Memory Usage',
        value: `${memoryUsageMB.toFixed(2)} MB`,
        status: memoryUtilization > 0.9 ? 'error' : memoryUtilization > 0.7 ? 'warning' : 'success',
      },
      {
        label: 'Memory Utilization',
        value: `${(memoryUtilization * 100).toFixed(1)}%`,
        status: memoryUtilization > 0.9 ? 'error' : memoryUtilization > 0.7 ? 'warning' : 'success',
      },
      {
        label: 'Uptime',
        value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        status: 'success',
      },
      {
        label: 'Response Time',
        value: `${responseTime}ms`,
        status: 'success',
      },
    ],
    recentEvents: [
      {
        timestamp: new Date().toISOString(),
        message: 'Health check completed successfully',
        severity: 'info',
      },
    ],
    recommendations,
  };
}

/**
 * Get detailed Database status
 */
async function getDatabaseDetails(): Promise<DetailedStatus> {
  const startTime = Date.now();
  const recommendations: string[] = [];

  try {
    const supabase = await createClient();

    // Test connection
    const { error: connectionError, count } = await supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true });

    const responseTime = Date.now() - startTime;

    if (connectionError) {
      return {
        name: 'Database',
        status: 'Major Outage',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Database connection failed: ${connectionError.message}`,
        metrics: [
          {
            label: 'Connection Status',
            value: 'Failed',
            status: 'error',
          },
          {
            label: 'Response Time',
            value: `${responseTime}ms`,
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: `Connection error: ${connectionError.message}`,
            severity: 'error',
          },
        ],
        recommendations: [
          'Check database credentials in environment variables',
          'Verify Supabase project is active and not paused',
          'Check network connectivity to Supabase',
        ],
      };
    }

    const status = responseTime > 3000 ? 'Degraded Performance' : 'Operational';

    if (responseTime > 2000) {
      recommendations.push(
        'Database response time is slower than expected. Consider optimizing queries or upgrading plan.'
      );
    }

    return {
      name: 'Database',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `PostgreSQL database is ${status.toLowerCase()}. ${count !== null ? `${count} user profiles found.` : ''}`,
      metrics: [
        {
          label: 'Connection Status',
          value: 'Connected',
          status: 'success',
        },
        {
          label: 'Response Time',
          value: `${responseTime}ms`,
          status: responseTime > 3000 ? 'error' : responseTime > 1000 ? 'warning' : 'success',
        },
        {
          label: 'Query Performance',
          value:
            responseTime < 100
              ? 'Excellent'
              : responseTime < 500
                ? 'Good'
                : responseTime < 1000
                  ? 'Fair'
                  : 'Slow',
          status: responseTime > 1000 ? 'warning' : 'success',
        },
        {
          label: 'User Profiles',
          value: count !== null ? count.toString() : 'N/A',
          status: 'success',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: 'Database health check completed',
          severity: 'info',
        },
      ],
      recommendations,
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'Major Outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `Unexpected error: ${(error as Error).message}`,
      metrics: [
        {
          label: 'Connection Status',
          value: 'Failed',
          status: 'error',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: `Exception: ${(error as Error).message}`,
          severity: 'error',
        },
      ],
      recommendations: [
        'Check server logs for detailed error information',
        'Verify Supabase configuration',
        'Contact support if issue persists',
      ],
    };
  }
}

/**
 * Get detailed AI Services status
 * Uses /v1/models endpoint - no token consumption
 */
async function getAIDetails(): Promise<DetailedStatus> {
  const startTime = Date.now();
  const recommendations: string[] = [];

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return {
        name: 'AI Services',
        status: 'Major Outage',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        details: 'Anthropic API key is not configured',
        metrics: [
          {
            label: 'API Key Status',
            value: 'Not Configured',
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: 'API key validation failed',
            severity: 'error',
          },
        ],
        recommendations: [
          'Add GOOGLE_GENERATIVE_AI_API_KEY to environment variables',
          'Restart the application after adding the key',
        ],
      };
    }

    // Use lightweight /v1/models endpoint - no token consumption, just checks auth/connectivity
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      if (response.status === 429) {
        return {
          name: 'AI Services',
          status: 'Degraded Performance',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: 'API rate limit exceeded',
          metrics: [
            {
              label: 'API Status',
              value: 'Rate Limited',
              status: 'warning',
            },
            {
              label: 'Response Time',
              value: `${responseTime}ms`,
              status: 'warning',
            },
          ],
          recentEvents: [
            {
              timestamp: new Date().toISOString(),
              message: 'Rate limit exceeded (429 error)',
              severity: 'warning',
            },
          ],
          recommendations: [
            'Reduce API request frequency',
            'Consider upgrading Anthropic plan for higher rate limits',
            'Implement request queuing system',
          ],
        };
      }

      const status =
        response.status === 401 || response.status === 403 ? 'Major Outage' : 'Partial Outage';

      return {
        name: 'AI Services',
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `API error: ${response.status} - ${response.statusText}`,
        metrics: [
          {
            label: 'API Status',
            value: `Error ${response.status}`,
            status: 'error',
          },
          {
            label: 'Response Time',
            value: `${responseTime}ms`,
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: `API returned ${response.status}: ${response.statusText}`,
            severity: 'error',
          },
        ],
        recommendations:
          response.status === 401 || response.status === 403
            ? [
                'Verify GOOGLE_GENERATIVE_AI_API_KEY is valid',
                'Check API key permissions',
                'Regenerate API key if necessary',
              ]
            : [
                'Check Anthropic status page for service issues',
                'Retry request after delay',
                'Contact Anthropic support',
              ],
      };
    }

    const status = responseTime > 5000 ? 'Degraded Performance' : 'Operational';

    if (responseTime > 3000) {
      recommendations.push(
        'AI service response time is slower than expected. This may affect user experience.'
      );
    }

    return {
      name: 'AI Services',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Gemini API is ${status.toLowerCase()}. Authentication verified.`,
      metrics: [
        {
          label: 'API Status',
          value: 'Connected',
          status: 'success',
        },
        {
          label: 'Response Time',
          value: `${responseTime}ms`,
          status: responseTime > 5000 ? 'error' : responseTime > 3000 ? 'warning' : 'success',
        },
        {
          label: 'Authentication',
          value: 'Valid',
          status: 'success',
        },
        {
          label: 'Performance',
          value: responseTime < 2000 ? 'Excellent' : responseTime < 4000 ? 'Good' : 'Slow',
          status: responseTime > 4000 ? 'warning' : 'success',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: 'AI service health check completed',
          severity: 'info',
        },
      ],
      recommendations,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        name: 'AI Services',
        status: 'Partial Outage',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: 'Request timeout after 10 seconds',
        metrics: [
          {
            label: 'API Status',
            value: 'Timeout',
            status: 'error',
          },
          {
            label: 'Response Time',
            value: '>10000ms',
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: 'Request timed out after 10 seconds',
            severity: 'error',
          },
        ],
        recommendations: [
          'Check network connectivity',
          'Verify Anthropic API is not experiencing outages',
          'Increase timeout if network latency is high',
        ],
      };
    }

    return {
      name: 'AI Services',
      status: 'Major Outage',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Unexpected error: ${(error as Error).message}`,
      metrics: [
        {
          label: 'API Status',
          value: 'Failed',
          status: 'error',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: `Exception: ${(error as Error).message}`,
          severity: 'error',
        },
      ],
      recommendations: [
        'Check server logs for detailed error information',
        'Verify network connectivity',
        'Contact Anthropic support if issue persists',
      ],
    };
  }
}

/**
 * Get detailed Storage status
 */
async function getStorageDetails(): Promise<DetailedStatus> {
  const startTime = Date.now();
  const recommendations: string[] = [];

  try {
    const supabase = await createClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'Storage',
        status: 'Major Outage',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `Storage error: ${error.message}`,
        metrics: [
          {
            label: 'Storage Status',
            value: 'Failed',
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: `Storage error: ${error.message}`,
            severity: 'error',
          },
        ],
        recommendations: [
          'Check Supabase storage configuration',
          'Verify storage permissions',
          'Contact Supabase support',
        ],
      };
    }

    const status = responseTime > 3000 ? 'Degraded Performance' : 'Operational';

    if (responseTime > 2000) {
      recommendations.push('Storage response time is slower than expected.');
    }

    return {
      name: 'Storage',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Storage is ${status.toLowerCase()}. ${buckets?.length || 0} buckets available.`,
      metrics: [
        {
          label: 'Storage Status',
          value: 'Connected',
          status: 'success',
        },
        {
          label: 'Buckets',
          value: (buckets?.length || 0).toString(),
          status: 'success',
        },
        {
          label: 'Response Time',
          value: `${responseTime}ms`,
          status: responseTime > 3000 ? 'error' : responseTime > 1000 ? 'warning' : 'success',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: 'Storage health check completed',
          severity: 'info',
        },
      ],
      recommendations,
    };
  } catch (error) {
    return {
      name: 'Storage',
      status: 'Major Outage',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: `Unexpected error: ${(error as Error).message}`,
      metrics: [
        {
          label: 'Storage Status',
          value: 'Failed',
          status: 'error',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: `Exception: ${(error as Error).message}`,
          severity: 'error',
        },
      ],
      recommendations: ['Check server logs', 'Verify Supabase configuration'],
    };
  }
}

/**
 * Get detailed Payment Gateway status
 */
async function getPaymentDetails(): Promise<DetailedStatus> {
  const startTime = Date.now();
  const recommendations: string[] = [];

  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return {
        name: 'Payment Gateway',
        status: 'Major Outage',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        details: 'Razorpay credentials not configured',
        metrics: [
          {
            label: 'Credentials Status',
            value: 'Not Configured',
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: 'Razorpay credentials missing',
            severity: 'error',
          },
        ],
        recommendations: [
          'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables',
          'Restart the application after configuration',
        ],
      };
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/plans?count=1', {
      method: 'GET',
      headers: { Authorization: `Basic ${authHeader}` },
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const status =
        response.status === 401 || response.status === 403 ? 'Major Outage' : 'Partial Outage';

      return {
        name: 'Payment Gateway',
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: `API error: ${response.status} - ${response.statusText}`,
        metrics: [
          {
            label: 'API Status',
            value: `Error ${response.status}`,
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: `Razorpay API returned ${response.status}`,
            severity: 'error',
          },
        ],
        recommendations:
          response.status === 401 || response.status === 403
            ? [
                'Verify Razorpay credentials',
                'Check API key permissions',
                'Regenerate keys if necessary',
              ]
            : ['Check Razorpay status page', 'Contact Razorpay support'],
      };
    }

    const status = responseTime > 3000 ? 'Degraded Performance' : 'Operational';

    if (responseTime > 2000) {
      recommendations.push('Payment gateway response time is slower than expected.');
    }

    return {
      name: 'Payment Gateway',
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Razorpay is ${status.toLowerCase()}. Payment processing available.`,
      metrics: [
        {
          label: 'API Status',
          value: 'Connected',
          status: 'success',
        },
        {
          label: 'Response Time',
          value: `${responseTime}ms`,
          status: responseTime > 3000 ? 'error' : responseTime > 1500 ? 'warning' : 'success',
        },
        {
          label: 'Gateway',
          value: 'Razorpay',
          status: 'success',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: 'Payment gateway health check completed',
          severity: 'info',
        },
      ],
      recommendations,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        name: 'Payment Gateway',
        status: 'Partial Outage',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: 'Request timeout after 5 seconds',
        metrics: [
          {
            label: 'API Status',
            value: 'Timeout',
            status: 'error',
          },
        ],
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            message: 'Request timed out',
            severity: 'error',
          },
        ],
        recommendations: ['Check network connectivity', 'Verify Razorpay API status'],
      };
    }

    return {
      name: 'Payment Gateway',
      status: 'Major Outage',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: `Unexpected error: ${(error as Error).message}`,
      metrics: [
        {
          label: 'API Status',
          value: 'Failed',
          status: 'error',
        },
      ],
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          message: `Exception: ${(error as Error).message}`,
          severity: 'error',
        },
      ],
      recommendations: ['Check server logs', 'Verify network connectivity'],
    };
  }
}

/**
 * GET handler for detailed component status
 */
export async function GET(request: Request, context: { params: Promise<{ component: string }> }) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { component } = await context.params;
    const componentType = component.toLowerCase() as ComponentType;

    let details: DetailedStatus;

    switch (componentType) {
      case 'api':
        details = await getAPIDetails();
        break;
      case 'database':
        details = await getDatabaseDetails();
        break;
      case 'ai':
        details = await getAIDetails();
        break;
      case 'storage':
        details = await getStorageDetails();
        break;
      case 'payment':
        details = await getPaymentDetails();
        break;
      default:
        return NextResponse.json({ error: 'Invalid component type' }, { status: 400 });
    }

    return NextResponse.json(details, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching component status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch component status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
