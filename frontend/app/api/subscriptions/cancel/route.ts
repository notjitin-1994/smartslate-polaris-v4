/**
 * Cancel Subscription API Route
 *
 * @description API endpoint for cancelling Razorpay subscriptions with support for
 * immediate and end-of-cycle cancellation modes, comprehensive validation,
 * authentication, and error handling
 *
 * @version 1.0.0
 * @date 2025-10-29
 *
 * @endpoint POST /api/subscriptions/cancel
 * @access authenticated users with active subscriptions
 */

import { NextResponse } from 'next/server';
import {
  CancelSubscriptionRequestSchema,
  CancelSubscriptionResponseSchema,
  ErrorResponseSchema,
  validateCancelSubscriptionRequest,
  type CancelSubscriptionRequest,
} from '@/lib/schemas/razorpaySubscription';
import { getSupabaseServerClient, getServerSession } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { razorpayClient, cancelSubscription } from '@/lib/razorpay/client';
import { RATE_LIMIT_CONFIGS, rateLimitMiddleware } from '@/lib/middleware/rateLimiting';
import { executeSubscriptionCancellation } from '@/lib/transactions/subscriptionTransactions';

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Enhanced rate limiting for subscription cancellation (sensitive operation)
 */
const cancellationRateLimit = rateLimitMiddleware(RATE_LIMIT_CONFIGS.SUBSCRIPTION_CANCELLATION);

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Structured error response utility
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
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Structured success response utility
 */
function createSuccessResponse(data: any, requestId: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    requestId,
  });
}

/**
 * Main POST handler for subscription cancellation
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Apply enhanced rate limiting for cancellation (sensitive operation)
    const rateLimitResult = await cancellationRateLimit(request);
    if (!rateLimitResult.allowed) {
      console.warn(`[Subscription Cancel] Rate limit exceeded`, {
        requestId,
        error: rateLimitResult.error,
      });

      if (rateLimitResult.response) {
        return rateLimitResult.response;
      }

      return createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many cancellation attempts. Please contact support.',
        429,
        requestId,
        rateLimitResult.error
      );
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('[Subscription Cancel] Invalid JSON body', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400, requestId);
    }

    // Validate request body using Zod schema
    const validationResult = validateCancelSubscriptionRequest(requestBody);
    if (!validationResult.success) {
      console.error('[Subscription Cancel] Validation failed', {
        requestId,
        errors: validationResult.error.flatten(),
        body: requestBody,
      });

      return createErrorResponse('VALIDATION_ERROR', 'Invalid request parameters', 400, requestId, {
        validationErrors: validationResult.error.flatten(),
      });
    }

    const { cancelAtCycleEnd, reason } = validationResult.data;

    // Authentication check
    const sessionResult = await getServerSession();
    if (!sessionResult.session || !sessionResult.session.user) {
      console.error('[Subscription Cancel] Authentication failed', {
        requestId,
        hasSession: !!sessionResult.session,
        hasUser: !!sessionResult.session?.user,
      });

      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required. Please sign in to cancel a subscription.',
        401,
        requestId
      );
    }

    const user = sessionResult.session.user;
    const userId = user.id;

    // Initialize Supabase client
    const supabase = await getSupabaseServerClient();

    // Get user profile for additional context
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status, full_name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('[Subscription Cancel] Failed to fetch user profile', {
        requestId,
        userId,
        error: profileError,
      });

      return createErrorResponse(
        'PROFILE_ERROR',
        'Failed to retrieve user profile',
        500,
        requestId,
        { originalError: profileError.message }
      );
    }

    // Check for existing active subscriptions
    console.log('[Subscription Cancel] Checking for active subscriptions', {
      requestId,
      userId,
    });

    const { data: activeSubscriptions, error: subscriptionCheckError } = await supabase
      .from('subscriptions')
      .select(
        `
        subscription_id,
        razorpay_subscription_id,
        status,
        subscription_tier,
        plan_name,
        next_billing_date,
        current_end,
        metadata
      `
      )
      .eq('user_id', userId)
      .in('status', ['created', 'authenticated', 'active', 'trialing'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (subscriptionCheckError) {
      console.error('[Subscription Cancel] Failed to check active subscriptions', {
        requestId,
        userId,
        error: subscriptionCheckError,
      });

      return createErrorResponse(
        'SUBSCRIPTION_CHECK_ERROR',
        'Failed to verify active subscriptions',
        500,
        requestId,
        { originalError: subscriptionCheckError.message }
      );
    }

    // Verify user has an active subscription to cancel
    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      console.warn('[Subscription Cancel] No active subscription found', {
        requestId,
        userId,
        currentTier: userProfile?.subscription_tier,
        currentStatus: userProfile?.subscription_status,
      });

      return createErrorResponse(
        'NO_ACTIVE_SUBSCRIPTION',
        'No active subscription found to cancel',
        404,
        requestId,
        {
          currentTier: userProfile?.subscription_tier,
          currentStatus: userProfile?.subscription_status,
        }
      );
    }

    const activeSubscription = activeSubscriptions[0];

    console.log('[Subscription Cancel] Active subscription found', {
      requestId,
      userId,
      subscriptionId: activeSubscription.subscription_id,
      razorpaySubscriptionId: activeSubscription.razorpay_subscription_id,
      status: activeSubscription.status,
      tier: activeSubscription.subscription_tier,
      cancelAtCycleEnd,
      reason,
    });

    // Additional validation for cancellation timing
    if (activeSubscription.status === 'created') {
      // Created subscriptions that haven't been authenticated should be cancelled immediately
      console.log('[Subscription Cancel] Cancelling unauthenticated subscription immediately', {
        requestId,
        subscriptionId: activeSubscription.subscription_id,
        status: activeSubscription.status,
      });
    } else if (
      activeSubscription.status !== 'active' &&
      activeSubscription.status !== 'authenticated'
    ) {
      // Only allow cancellation of active/authenticated subscriptions
      console.warn('[Subscription Cancel] Invalid subscription status for cancellation', {
        requestId,
        subscriptionId: activeSubscription.subscription_id,
        status: activeSubscription.status,
      });

      return createErrorResponse(
        'INVALID_SUBSCRIPTION_STATUS',
        `Cannot cancel subscription with status: ${activeSubscription.status}`,
        400,
        requestId,
        {
          subscriptionId: activeSubscription.subscription_id,
          status: activeSubscription.status,
          allowedStatuses: ['active', 'authenticated', 'created'],
        }
      );
    }

    console.log('[Subscription Cancel] Subscription cancellation request validated', {
      requestId,
      userId: user.id,
      email: user.email,
      subscriptionId: activeSubscription.subscription_id,
      razorpaySubscriptionId: activeSubscription.razorpay_subscription_id,
      cancelAtCycleEnd,
      reason,
      processingTime: Date.now() - startTime,
    });

    // Integrate Razorpay SDK cancellation logic
    console.log('[Subscription Cancel] Initiating Razorpay subscription cancellation', {
      requestId,
      razorpaySubscriptionId: activeSubscription.razorpay_subscription_id,
      cancelAtCycleEnd,
    });

    // Execute subscription cancellation using transaction system
    const transactionResult = await executeSubscriptionCancellation(
      {
        subscriptionId: activeSubscription.razorpay_subscription_id,
        userId,
        tier: activeSubscription.subscription_tier,
        billingCycle: activeSubscription.billing_cycle,
        cancelAtEnd: cancelAtCycleEnd,
        reason: reason || 'User requested cancellation',
      },
      {
        timeout: 30000, // 30 seconds
        enableRollback: true,
        maxRetries: 2,
      }
    );

    if (!transactionResult.success) {
      console.error('[Subscription Cancel] Transaction failed', {
        requestId,
        error: transactionResult.error?.message,
        completedSteps: transactionResult.completedSteps,
        failedStep: transactionResult.failedStep,
      });

      return createErrorResponse(
        'CANCELLATION_TRANSACTION_ERROR',
        'Failed to cancel subscription. Some operations may have completed.',
        500,
        requestId,
        {
          originalError: transactionResult.error?.message,
          completedSteps: transactionResult.completedSteps,
          failedStep: transactionResult.failedStep,
          partialSuccess: transactionResult.completedSteps.length > 0,
        }
      );
    }

    const razorpayCancelledSubscription = transactionResult.results['cancel-razorpay-subscription'];

    console.log('[Subscription Cancel] Transaction completed successfully', {
      requestId,
      razorpaySubscriptionId: activeSubscription.razorpay_subscription_id,
      razorpayStatus: razorpayCancelledSubscription?.status,
      cancelledAtCycleEnd: cancelAtCycleEnd,
      razorpayEndAt: razorpayCancelledSubscription?.end_at,
      completedSteps: transactionResult.completedSteps,
    });

    // Handle immediate vs end-of-cycle cancellation modes
    console.log('[Subscription Cancel] Processing cancellation mode', {
      requestId,
      cancelAtCycleEnd,
      subscriptionTier: activeSubscription.subscription_tier,
      currentEnd: activeSubscription.current_end,
      nextBillingDate: activeSubscription.next_billing_date,
    });

    let cancellationDate: string;
    let accessUntilDate: string | undefined;
    let userTierUpdate: { subscription_tier: string; user_role: string } | null = null;

    if (cancelAtCycleEnd) {
      // End-of-cycle cancellation: User retains access until next billing date
      cancellationDate = new Date().toISOString();
      accessUntilDate = activeSubscription.next_billing_date || activeSubscription.current_end;

      console.log('[Subscription Cancel] End-of-cycle cancellation configured', {
        requestId,
        cancellationDate,
        accessUntilDate,
        userRetainsTier: true,
      });

      // For end-of-cycle cancellation, user keeps current tier until access expires
      // The database trigger will handle tier downgrade when subscription expires
    } else {
      // Immediate cancellation: Downgrade user to free tier immediately
      cancellationDate = new Date().toISOString();
      userTierUpdate = {
        subscription_tier: 'explorer', // Free tier
        user_role: 'explorer',
      };

      console.log('[Subscription Cancel] Immediate cancellation configured', {
        requestId,
        cancellationDate,
        userTierUpdate,
        userDowngradedImmediately: true,
      });

      // Update user profile immediately for immediate cancellation
      try {
        const { error: profileUpdateError } = await supabase
          .from('user_profiles')
          .update({
            subscription_tier: 'explorer',
            user_role: 'explorer',
            blueprint_creation_limit: 2,
            blueprint_saving_limit: 2,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (profileUpdateError) {
          console.error(
            '[Subscription Cancel] Failed to update user profile for immediate cancellation',
            {
              requestId,
              userId,
              error: profileUpdateError,
            }
          );

          // Don't fail the entire operation, but log the error
          // The subscription will still be cancelled in Razorpay
        } else {
          console.log('[Subscription Cancel] User profile updated for immediate cancellation', {
            requestId,
            userId,
            newTier: 'explorer',
          });
        }
      } catch (profileUpdateError: any) {
        console.error('[Subscription Cancel] Unexpected error updating user profile', {
          requestId,
          userId,
          error: profileUpdateError,
        });
      }
    }

    // Update database records and log cancellation events
    console.log('[Subscription Cancel] Updating database records', {
      requestId,
      subscriptionId: activeSubscription.subscription_id,
      razorpayStatus: razorpayCancelledSubscription.status,
      cancelAtCycleEnd,
      cancellationDate,
    });

    // Use database transaction for consistency
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: razorpayCancelledSubscription.status, // Use status from Razorpay
        cancellation_date: cancellationDate,
        metadata: {
          ...activeSubscription.metadata,
          cancellation: {
            cancelled_at: cancellationDate,
            cancelled_by: 'user_api_request',
            cancel_at_cycle_end: cancelAtCycleEnd,
            cancellation_reason: reason || 'User requested cancellation',
            access_until_date: accessUntilDate,
            api_request_id: requestId,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', activeSubscription.subscription_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('[Subscription Cancel] Failed to update subscription in database', {
        requestId,
        subscriptionId: activeSubscription.subscription_id,
        error: updateError,
        errorCode: updateError.code,
        errorMessage: updateError.message,
      });

      return createErrorResponse(
        'DATABASE_UPDATE_ERROR',
        'Failed to update subscription in database. Subscription was cancelled in Razorpay but database update failed.',
        500,
        requestId,
        {
          originalError: updateError.message,
          errorCode: updateError.code,
          razorpaySubscriptionId: activeSubscription.razorpay_subscription_id,
          databaseInconsistency: true,
        }
      );
    }

    // Create a manual cancellation event log for tracking
    try {
      const cancellationEventPayload = {
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            id: activeSubscription.subscription_id,
            razorpay_subscription_id: activeSubscription.razorpay_subscription_id,
            entity: 'subscription',
            status: razorpayCancelledSubscription.status,
            current_start: razorpayCancelledSubscription.current_start,
            current_end: razorpayCancelledSubscription.current_end,
            ended_at: razorpayCancelledSubscription.end_at,
            changed_at: razorpayCancelledSubscription.changed_at,
            notes: {
              cancelled_by: 'user_api_request',
              cancel_at_cycle_end: cancelAtCycleEnd,
              cancellation_reason: reason || 'User requested cancellation',
              access_until_date: accessUntilDate,
              api_request_id: requestId,
              user_id: userId,
              email: user.email,
            },
          },
          created_at: Math.floor(Date.now() / 1000),
        },
      };

      // Insert manual event record for audit trail (using service role if needed)
      const { error: eventLogError } = await supabase.from('webhook_events').insert({
        event_id: `manual_cancel_${activeSubscription.subscription_id}_${Date.now()}`,
        event_type: 'subscription.cancelled',
        account_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.split('_')[1] || 'unknown',
        payload: cancellationEventPayload,
        processing_status: 'processed',
        processing_attempts: 1,
        signature_verified: false, // Manual event, no signature
        related_subscription_id: activeSubscription.subscription_id,
        processed_at: new Date().toISOString(),
        processing_started_at: new Date().toISOString(),
      });

      if (eventLogError) {
        console.warn('[Subscription Cancel] Failed to create cancellation event log', {
          requestId,
          subscriptionId: activeSubscription.subscription_id,
          error: eventLogError,
        });
        // Don't fail the operation for logging failure
      } else {
        console.log('[Subscription Cancel] Cancellation event logged successfully', {
          requestId,
          subscriptionId: activeSubscription.subscription_id,
        });
      }
    } catch (eventLogError: any) {
      console.warn('[Subscription Cancel] Unexpected error creating cancellation event log', {
        requestId,
        subscriptionId: activeSubscription.subscription_id,
        error: eventLogError,
      });
    }

    console.log('[Subscription Cancel] Database update completed successfully', {
      requestId,
      subscriptionId: activeSubscription.subscription_id,
      updatedStatus: updatedSubscription?.status,
      cancellationDate,
    });

    return createSuccessResponse(
      {
        message: `Subscription ${cancelAtCycleEnd ? 'scheduled for cancellation at end of billing cycle' : 'cancelled immediately'}`,
        subscription: {
          subscriptionId: activeSubscription.subscription_id,
          razorpaySubscriptionId: activeSubscription.razorpay_subscription_id,
          status: updatedSubscription?.status || razorpayCancelledSubscription.status,
          tier: activeSubscription.subscription_tier,
          nextBillingDate: activeSubscription.next_billing_date,
          cancelAtCycleEnd,
          cancellationDate,
          accessUntilDate,
          userTierUpdate,
          razorpayEndAt: razorpayCancelledSubscription.end_at
            ? new Date(razorpayCancelledSubscription.end_at * 1000).toISOString()
            : null,
        },
      },
      requestId
    );
  } catch (error: unknown) {
    console.error('[Subscription Cancel] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: Date.now() - startTime,
    });

    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while processing your request',
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
 * GET handler (not supported - only POST allowed)
 */
export async function GET(): Promise<Response> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed for this endpoint',
      },
    },
    { status: 405 }
  );
}
