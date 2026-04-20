/**
 * Grace Period Management API Route
 *
 * @description Admin API for manual grace period processing,
 * scheduler control, and status monitoring
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireRole } from '@/lib/auth/middleware';
import { createRateLimitMiddleware } from '@/lib/middleware/rateLimiting';
import { logEvent } from '@/lib/monitoring/subscriptionMonitoring';
// Inline error handling functions to avoid import issues
interface SanitizedError {
  code: string;
  message: string;
}

function sanitizeError(error: unknown): SanitizedError {
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
  }
  if (typeof error === 'string') {
    return {
      code: 'INTERNAL_ERROR',
      message: error,
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };
}

function createErrorResponse(error: unknown): { error: SanitizedError } {
  return {
    error: sanitizeError(error),
  };
}
import {
  handleManualProcessing,
  handleSchedulerStatus,
  updateSchedulerConfig,
} from '@/lib/automation/gracePeriodScheduler';
import {
  getGracePeriodStatus,
  startGracePeriod,
  endGracePeriod,
  sendGracePeriodWarning,
} from '@/lib/subscription/gracePeriodManager';

// ============================================================================
// Rate Limiting
// ============================================================================

const adminRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: (request: Request) => {
    const url = new URL(request.url);
    return `admin-grace-period:${url.pathname}:${request.headers.get('x-forwarded-for') || 'unknown'}`;
  },
  message: 'Too many admin requests. Please try again later.',
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate admin permissions
 */
async function validateAdminPermissions(
  request: NextRequest
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    const roleResult = await requireRole(request, ['developer', 'admin']);
    if (!roleResult.success) {
      return { success: false, error: 'Insufficient permissions. Admin access required.' };
    }

    return { success: true, user: authResult.user };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Log admin action
 */
async function logAdminAction(
  userId: string,
  action: string,
  details: Record<string, any> = {},
  severity: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  await logEvent({
    id: `admin-grace-${action}-${Date.now()}`,
    type: 'security',
    severity,
    category: 'admin_action',
    title: `Admin Grace Period ${action}`,
    description: `Admin performed grace period action: ${action}`,
    data: {
      userId,
      action,
      ...details,
    },
    tags: ['admin', 'grace-period', action],
    timestamp: new Date(),
  });
}

// ============================================================================
// GET Handler - Get Grace Period Status
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Validate admin permissions
    const authResult = await validateAdminPermissions(request);
    if (!authResult.success) {
      return NextResponse.json(createErrorResponse(authResult.error || 'Unauthorized'), {
        status: 401,
      });
    }

    // Apply rate limiting
    const rateLimitResult = await adminRateLimit(request);
    if (!rateLimitResult.allowed) {
      await logAdminAction(
        authResult.user!.id,
        'rate_limited',
        { error: rateLimitResult.error },
        'warning'
      );

      return NextResponse.json(createErrorResponse('Rate limit exceeded'), { status: 429 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const targetUserId = url.searchParams.get('userId');

    switch (action) {
      case 'scheduler-status':
        // Get scheduler status
        const schedulerStatus = handleSchedulerStatus();

        await logAdminAction(authResult.user!.id, 'scheduler_status_check', {
          isRunning: schedulerStatus.isRunning,
          lastRun: schedulerStatus.lastRun,
        });

        return NextResponse.json({
          success: true,
          data: schedulerStatus,
          processingTime: Date.now() - startTime,
        });

      case 'user-status':
        // Get specific user's grace period status
        if (!targetUserId) {
          return NextResponse.json(createErrorResponse('userId parameter is required'), {
            status: 400,
          });
        }

        const userGraceStatus = await getGracePeriodStatus(targetUserId);

        await logAdminAction(authResult.user!.id, 'user_grace_status_check', {
          targetUserId,
          isInGracePeriod: userGraceStatus.isInGracePeriod,
          daysRemaining: userGraceStatus.daysRemaining,
        });

        return NextResponse.json({
          success: true,
          data: userGraceStatus,
          processingTime: Date.now() - startTime,
        });

      default:
        return NextResponse.json(
          createErrorResponse('Invalid action. Use: scheduler-status, user-status'),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Grace period GET error:', error);

    await logAdminAction('unknown', 'get_error', { error: (error as Error).message }, 'error');

    return NextResponse.json(createErrorResponse(error), { status: 500 });
  }
}

// ============================================================================
// POST Handler - Manual Grace Period Actions
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Validate admin permissions
    const authResult = await validateAdminPermissions(request);
    if (!authResult.success) {
      return NextResponse.json(createErrorResponse(authResult.error || 'Unauthorized'), {
        status: 401,
      });
    }

    // Apply rate limiting
    const rateLimitResult = await adminRateLimit(request);
    if (!rateLimitResult.allowed) {
      await logAdminAction(
        authResult.user!.id,
        'rate_limited',
        { error: rateLimitResult.error },
        'warning'
      );

      return NextResponse.json(createErrorResponse('Rate limit exceeded'), { status: 429 });
    }

    const body = await request.json();
    const { action, userId, subscriptionId, data } = body;

    if (!action) {
      return NextResponse.json(createErrorResponse('action field is required'), { status: 400 });
    }

    let result;

    switch (action) {
      case 'process-all':
        // Manual grace period processing
        result = await handleManualProcessing();

        await logAdminAction(
          authResult.user!.id,
          'manual_processing',
          {
            success: result.success,
            results: result.results,
          },
          result.success ? 'info' : 'error'
        );

        break;

      case 'start-grace-period':
        // Start grace period for a user
        if (!userId || !subscriptionId) {
          return NextResponse.json(createErrorResponse('userId and subscriptionId are required'), {
            status: 400,
          });
        }

        const reason = data?.reason || 'admin_action';
        await startGracePeriod(userId, subscriptionId, reason);

        await logAdminAction(authResult.user!.id, 'start_grace_period', {
          targetUserId: userId,
          subscriptionId,
          reason,
        });

        result = { success: true, message: 'Grace period started' };
        break;

      case 'end-grace-period':
        // End grace period for a user
        if (!userId || !subscriptionId) {
          return NextResponse.json(createErrorResponse('userId and subscriptionId are required'), {
            status: 400,
          });
        }

        await endGracePeriod(userId, subscriptionId);

        await logAdminAction(authResult.user!.id, 'end_grace_period', {
          targetUserId: userId,
          subscriptionId,
        });

        result = { success: true, message: 'Grace period ended' };
        break;

      case 'send-warning':
        // Send grace period warning
        if (!userId || !data?.warningDay) {
          return NextResponse.json(createErrorResponse('userId and warningDay are required'), {
            status: 400,
          });
        }

        await sendGracePeriodWarning(userId, data.warningDay);

        await logAdminAction(authResult.user!.id, 'send_warning', {
          targetUserId: userId,
          warningDay: data.warningDay,
        });

        result = { success: true, message: 'Warning sent' };
        break;

      case 'update-scheduler-config':
        // Update scheduler configuration
        if (!data?.config) {
          return NextResponse.json(createErrorResponse('config field is required'), {
            status: 400,
          });
        }

        result = await updateSchedulerConfig(data.config);

        await logAdminAction(
          authResult.user!.id,
          'update_scheduler_config',
          {
            newConfig: data.config,
          },
          result.success ? 'info' : 'error'
        );

        break;

      default:
        return NextResponse.json(
          createErrorResponse(
            'Invalid action. Use: process-all, start-grace-period, end-grace-period, send-warning, update-scheduler-config'
          ),
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Grace period POST error:', error);

    await logAdminAction('unknown', 'post_error', { error: (error as Error).message }, 'error');

    return NextResponse.json(createErrorResponse(error), { status: 500 });
  }
}

// ============================================================================
// PUT Handler - Update Scheduler Configuration
// ============================================================================

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Validate admin permissions
    const authResult = await validateAdminPermissions(request);
    if (!authResult.success) {
      return NextResponse.json(createErrorResponse(authResult.error || 'Unauthorized'), {
        status: 401,
      });
    }

    // Apply rate limiting
    const rateLimitResult = await adminRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(createErrorResponse('Rate limit exceeded'), { status: 429 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(createErrorResponse('config field is required'), { status: 400 });
    }

    // Update scheduler configuration
    const result = await updateSchedulerConfig(config);

    await logAdminAction(
      authResult.user!.id,
      'update_scheduler_config_put',
      {
        newConfig: config,
        success: result.success,
      },
      result.success ? 'info' : 'error'
    );

    return NextResponse.json({
      success: result.success,
      data: result,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Grace period PUT error:', error);

    await logAdminAction('unknown', 'put_error', { error: (error as Error).message }, 'error');

    return NextResponse.json(createErrorResponse(error), { status: 500 });
  }
}
