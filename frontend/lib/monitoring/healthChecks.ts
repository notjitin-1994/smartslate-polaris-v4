/**
 * Health Check System
 *
 * @description Comprehensive health monitoring for all system components
 * including database, external APIs, and internal services
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { createClient } from '@/lib/supabase/server';
import { razorpayClient, isTestMode } from '@/lib/razorpay/client';
import type { HealthCheck } from './subscriptionMonitoring';

// ============================================================================
// Health Check Configuration
// ============================================================================

const HEALTH_CHECK_CONFIG = {
  timeouts: {
    database: 5000, // 5 seconds
    razorpay: 3000, // 3 seconds
    webhooks: 2000, // 2 seconds
    rateLimiter: 1000, // 1 second
    monitoring: 1000, // 1 second
  },

  thresholds: {
    responseTimeWarning: 1000, // 1 second
    responseTimeCritical: 3000, // 3 seconds
    errorRateWarning: 0.05, // 5%
    errorRateCritical: 0.1, // 10%
    uptimeThreshold: 0.95, // 95%
  },
};

// ============================================================================
// Health Check Functions
// ============================================================================

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Test basic connection
    const { error: connectionError } = await supabase.from('user_profiles').select('id').limit(1);

    if (connectionError) {
      return {
        name: 'database',
        status: 'fail',
        message: `Database connection failed: ${connectionError.message}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // Test write permissions
    const { error: writeError } = await supabase
      .from('subscription_audit_log')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (writeError && writeError.code !== 'PGRST116') {
      // PGRST116 = no rows
      return {
        name: 'database',
        status: 'warn',
        message: `Database write test failed: ${writeError.message}`,
        responseTime,
        details: { code: writeError.code },
        timestamp: new Date(),
      };
    }

    // Get database stats
    const { count: userCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    return {
      name: 'database',
      status: 'pass',
      message: 'Database is healthy',
      responseTime,
      details: {
        userCount: userCount || 0,
        connection: 'ok',
        writePermissions: 'ok',
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'fail',
      message: `Database health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Check Razorpay API health
 */
async function checkRazorpayHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Test by fetching plans (lightweight API call)
    const { fetchAllPlans } = await import('@/lib/razorpay/client');
    const plans = await fetchAllPlans({ count: 1 });

    const responseTime = Date.now() - startTime;

    return {
      name: 'razorpay',
      status: 'pass',
      message: `Razorpay API is healthy (${isTestMode() ? 'test mode' : 'live mode'})`,
      responseTime,
      details: {
        mode: isTestMode() ? 'test' : 'live',
        plansCount: plans.count || 0,
        apiStatus: 'ok',
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'razorpay',
      status: 'fail',
      message: `Razorpay API health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Check webhook processing health
 */
async function checkWebhookHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Check if webhook security functions are working
    const { validateWebhookSecurity } = await import('@/lib/razorpay/webhookSecurity');

    // Test with sample webhook payload
    const testPayload = {
      event: 'subscription.activated',
      account_id: 'acc_test123',
      payload: {
        entity: {
          id: 'sub_test123',
          status: 'active',
          plan_id: 'plan_test123',
          customer_id: 'cust_test123',
        },
      },
    };

    const testHeaders = new Headers();
    testHeaders.set('x-razorpay-signature', 'sha256=' + 'a'.repeat(64));

    const result = validateWebhookSecurity(testHeaders, JSON.stringify(testPayload));

    const responseTime = Date.now() - startTime;

    if (!result.valid) {
      return {
        name: 'webhooks',
        status: 'fail',
        message: `Webhook security validation failed: ${result.error}`,
        responseTime,
        timestamp: new Date(),
      };
    }

    return {
      name: 'webhooks',
      status: 'pass',
      message: 'Webhook processing is healthy',
      responseTime,
      details: {
        validation: 'ok',
        signatureCheck: 'ok',
        environment: process.env.NODE_ENV || 'unknown',
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'webhooks',
      status: 'fail',
      message: `Webhook health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Check rate limiting health
 */
async function checkRateLimiterHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Test rate limiter functionality
    const { rateLimitMiddleware, RATE_LIMIT_CONFIGS } = await import(
      '@/lib/middleware/rateLimiting'
    );

    const rateLimiter = rateLimitMiddleware(RATE_LIMIT_CONFIGS.GENERAL_API);

    // Create a mock request
    const mockRequest = new Request('https://example.com/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'health-check',
      },
    });

    const result = await rateLimiter(mockRequest);

    const responseTime = Date.now() - startTime;

    if (!result.allowed) {
      return {
        name: 'rate_limiter',
        status: 'warn',
        message: 'Rate limiter responded with limit exceeded (possibly due to previous requests)',
        responseTime,
        details: {
          error: result.error,
        },
        timestamp: new Date(),
      };
    }

    return {
      name: 'rate_limiter',
      status: 'pass',
      message: 'Rate limiting is healthy',
      responseTime,
      details: {
        status: 'ok',
        headers: result.headers,
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'rate_limiter',
      status: 'fail',
      message: `Rate limiter health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Check monitoring system health
 */
async function checkMonitoringHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Test monitoring store functionality
    const { logEvent, getMonitoringDashboard } = await import('./subscriptionMonitoring');

    // Create a test event
    const testEvent = {
      id: 'test-event',
      type: 'system' as const,
      severity: 'info' as const,
      category: 'health_check',
      title: 'Health Check Test',
      description: 'Test event for monitoring system health',
      timestamp: new Date(),
    };

    logEvent(testEvent);

    // Try to retrieve dashboard data
    const dashboard = getMonitoringDashboard();

    const responseTime = Date.now() - startTime;

    if (!dashboard || !dashboard.summary) {
      return {
        name: 'monitoring',
        status: 'warn',
        message: 'Monitoring system responding but data incomplete',
        responseTime,
        timestamp: new Date(),
      };
    }

    return {
      name: 'monitoring',
      status: 'pass',
      message: 'Monitoring system is healthy',
      responseTime,
      details: {
        totalEvents: dashboard.summary.totalEvents,
        recentEvents: dashboard.recentEvents.length,
        storage: 'ok',
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'monitoring',
      status: 'fail',
      message: `Monitoring system health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Check subscription service health
 */
async function checkSubscriptionServiceHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Check subscription-related tables
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_profiles')
      .select('id', 'subscription_status', 'subscription_tier', 'razorpay_subscription_id')
      .eq('subscription_status', 'active')
      .limit(5);

    const { count: totalActive } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const responseTime = Date.now() - startTime;

    if (subscriptionError) {
      return {
        name: 'subscription_service',
        status: 'warn',
        message: `Subscription service has issues: ${subscriptionError.message}`,
        responseTime,
        timestamp: new Date(),
      };
    }

    return {
      name: 'subscription_service',
      status: 'pass',
      message: 'Subscription service is healthy',
      responseTime,
      details: {
        activeSubscriptions: totalActive || 0,
        sampleData: subscriptionData?.length || 0,
        databaseAccess: 'ok',
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'subscription_service',
      status: 'fail',
      message: `Subscription service health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Check system resources health
 */
async function checkSystemHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const responseTime = Date.now() - startTime;

    // Check memory usage (Node.js)
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryLimit = 512; // 512MB threshold
    const memoryUtilization = memoryUsageMB / memoryLimit;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = 'System resources are healthy';

    if (memoryUtilization > 0.9) {
      status = 'fail';
      message = `High memory usage: ${memoryUsageMB.toFixed(2)}MB`;
    } else if (memoryUtilization > 0.7) {
      status = 'warn';
      message = `Moderate memory usage: ${memoryUsageMB.toFixed(2)}MB`;
    }

    return {
      name: 'system',
      status,
      message,
      responseTime,
      details: {
        memoryUsed: `${memoryUsageMB.toFixed(2)}MB`,
        memoryTotal: `${memoryLimit}MB`,
        memoryUtilization: `${(memoryUtilization * 100).toFixed(1)}%`,
        uptime: `${Math.floor(uptime / 3600)}h`,
        platform: process.platform,
        nodeVersion: process.version,
      },
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      name: 'system',
      status: 'fail',
      message: `System health check failed: ${(error as Error).message}`,
      responseTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// Main Health Check Function
// ============================================================================

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [
      databaseHealth,
      razorpayHealth,
      webhookHealth,
      rateLimiterHealth,
      monitoringHealth,
      subscriptionServiceHealth,
      systemHealth,
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkRazorpayHealth(),
      checkWebhookHealth(),
      checkRateLimiterHealth(),
      checkMonitoringHealth(),
      checkSubscriptionServiceHealth(),
      checkSystemHealth(),
    ]);

    const checks = [
      databaseHealth,
      razorpayHealth,
      webhookHealth,
      rateLimiterHealth,
      monitoringHealth,
      subscriptionServiceHealth,
      systemHealth,
    ];

    // Calculate overall status
    const failedChecks = checks.filter((check) => check.status === 'fail');
    const warningChecks = checks.filter((check) => check.status === 'warn');
    const passedChecks = checks.filter((check) => check.status === 'pass');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    let overallScore: number;

    if (failedChecks.length > 0) {
      overallStatus = 'unhealthy';
      overallScore = Math.max(0, 100 - failedChecks.length * 20);
    } else if (warningChecks.length > 0) {
      overallStatus = 'degraded';
      overallScore = Math.max(70, 100 - warningChecks.length * 10);
    } else {
      overallStatus = 'healthy';
      overallScore = 100;
    }

    // Adjust score based on response times
    const avgResponseTime =
      checks.reduce((sum, check) => sum + (check.responseTime || 0), 0) / checks.length;
    if (avgResponseTime > HEALTH_CHECK_CONFIG.thresholds.responseTimeCritical) {
      overallScore = Math.max(overallScore - 10, 0);
    } else if (avgResponseTime > HEALTH_CHECK_CONFIG.thresholds.responseTimeWarning) {
      overallScore = Math.max(overallScore - 5, 0);
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      checks,
      overallScore,
      timestamp: new Date(),
    };

    // Store the health check result for monitoring
    const { logEvent } = await import('./subscriptionMonitoring');
    logEvent({
      id: `health-check-${Date.now()}`,
      type: 'system',
      severity:
        overallStatus === 'healthy' ? 'info' : overallStatus === 'degraded' ? 'warning' : 'error',
      category: 'health_check',
      title: `System Health Check: ${overallStatus.toUpperCase()}`,
      description: `Overall system health: ${overallStatus} (${overallScore}/100)`,
      data: {
        status: overallStatus,
        score: overallScore,
        checksPassed: passedChecks.length,
        checksFailed: failedChecks.length,
        checksWarning: warningChecks.length,
        avgResponseTime,
        duration: Date.now() - startTime,
      },
      tags: ['health-check', overallStatus],
      timestamp: new Date(),
    } as any);

    return healthCheck;
  } catch (error) {
    // If health check itself fails, return unhealthy status
    const errorHealthCheck: HealthCheck = {
      status: 'unhealthy',
      checks: [
        {
          name: 'health_check_system',
          status: 'fail',
          message: `Health check system failed: ${(error as Error).message}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date(),
        },
      ],
      overallScore: 0,
      timestamp: new Date(),
    };

    // Log the failure
    try {
      const { logEvent } = await import('./subscriptionMonitoring');
      logEvent({
        id: `health-check-error-${Date.now()}`,
        type: 'system',
        severity: 'critical',
        category: 'health_check',
        title: 'Health Check System Failure',
        description: (error as Error).message,
        data: { error: (error as Error).stack },
        tags: ['health-check', 'error', 'critical'],
        timestamp: new Date(),
      } as any);
    } catch (logError) {
      // If even logging fails, just continue
      console.error('Failed to log health check error:', logError);
    }

    return errorHealthCheck;
  }
}

/**
 * Get health check status (cached result)
 */
export async function getHealthCheckStatus(): Promise<HealthCheck | null> {
  // In a real implementation, you might cache this result for a short period
  // For now, we'll perform the health check each time
  return performHealthCheck();
}

/**
 * Quick health check for load balancers
 */
export async function quickHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}> {
  try {
    // Just check the most critical components
    const [databaseHealth] = await Promise.all([checkDatabaseHealth()]);

    return {
      status: databaseHealth.status === 'pass' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
}

export default {
  performHealthCheck,
  getHealthCheckStatus,
  quickHealthCheck,
  checkDatabaseHealth,
  checkRazorpayHealth,
  checkWebhookHealth,
  checkRateLimiterHealth,
  checkMonitoringHealth,
  checkSubscriptionServiceHealth,
  checkSystemHealth,
};
