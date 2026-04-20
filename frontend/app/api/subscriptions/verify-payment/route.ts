/**
 * Verify Payment API Route
 *
 * @description API endpoint for verifying Razorpay subscription payment status
 * @version 1.0.0
 * @date 2025-10-30
 *
 * @endpoint POST /api/subscriptions/verify-payment
 * @access authenticated users
 *
 * This endpoint provides:
 * - Real-time subscription status checking
 * - Payment verification against Razorpay
 * - Database synchronization
 * - Industry-standard payment verification workflow
 */

import { NextResponse } from 'next/server';
import { getServerSession, getSupabaseServerClient } from '@/lib/supabase/server';
import { razorpayClient } from '@/lib/razorpay/client';
import { addApiSecurityHeaders } from '@/lib/security/securityHeaders';

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `verify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create structured response
 */
function createResponse(
  success: boolean,
  data: any,
  status: number = 200,
  requestId: string
): NextResponse {
  const response = NextResponse.json(
    {
      success,
      data,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );

  return addApiSecurityHeaders(response);
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
  return createResponse(
    false,
    {
      error: { code, message, details },
    },
    status,
    requestId
  );
}

/**
 * POST handler for payment verification
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId();

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error('[Payment Verification] Invalid JSON body', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400, requestId);
    }

    const { subscriptionId } = body as { subscriptionId?: string };

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      console.error('[Payment Verification] Missing subscription ID', {
        requestId,
        body,
      });

      return createErrorResponse(
        'MISSING_SUBSCRIPTION_ID',
        'Subscription ID is required',
        400,
        requestId
      );
    }

    // Authentication check
    const sessionResult = await getServerSession();
    if (!sessionResult.session || !sessionResult.session.user) {
      console.error('[Payment Verification] Authentication failed', {
        requestId,
      });

      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    const userId = sessionResult.session.user.id;
    const supabase = await getSupabaseServerClient();

    console.log('[Payment Verification] Processing request', {
      requestId,
      subscriptionId,
      userId,
    });

    // Step 1: Fetch subscription from our database
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('razorpay_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (dbError || !dbSubscription) {
      console.error('[Payment Verification] Subscription not found in database', {
        requestId,
        subscriptionId,
        userId,
        error: dbError,
      });

      return createErrorResponse(
        'SUBSCRIPTION_NOT_FOUND',
        'Subscription not found',
        404,
        requestId
      );
    }

    // Step 2: Fetch current status from Razorpay
    let razorpaySubscription;
    try {
      razorpaySubscription = await razorpayClient.subscriptions.fetch(subscriptionId);
      console.log('[Payment Verification] Fetched Razorpay subscription', {
        requestId,
        status: razorpaySubscription.status,
        paidCount: razorpaySubscription.paid_count,
        totalCount: razorpaySubscription.total_count,
      });
    } catch (razorpayError: any) {
      console.error('[Payment Verification] Failed to fetch Razorpay subscription', {
        requestId,
        subscriptionId,
        error: razorpayError.message,
      });

      return createErrorResponse(
        'RAZORPAY_FETCH_ERROR',
        'Failed to verify subscription with Razorpay',
        500,
        requestId,
        { originalError: razorpayError.message }
      );
    }

    // Step 3: Determine verification status
    let verificationStatus: string;
    let message: string;
    let isActive = false;

    switch (razorpaySubscription.status) {
      case 'active':
        verificationStatus = 'completed';
        message = 'Payment verified successfully! Your subscription is now active.';
        isActive = true;
        break;

      case 'authenticated':
        verificationStatus = 'processing';
        message = 'Payment is being processed. Please wait...';
        break;

      case 'completed':
        verificationStatus = 'completed';
        message = 'Payment completed successfully! Your subscription is active.';
        isActive = true;
        break;

      case 'cancelled':
        verificationStatus = 'cancelled';
        message = 'Payment was cancelled.';
        break;

      case 'failed':
        verificationStatus = 'failed';
        message = 'Payment failed. Please try again.';
        break;

      case 'expired':
        verificationStatus = 'failed';
        message = 'Payment link has expired. Please try again.';
        break;

      case 'created':
      default:
        verificationStatus = 'pending';
        message = 'Payment verification in progress...';
        break;
    }

    // Step 4: Update database with latest status if it's active/completed
    if (isActive && dbSubscription.status !== 'active') {
      console.log('[Payment Verification] Updating subscription status to active', {
        requestId,
        subscriptionId,
        oldStatus: dbSubscription.status,
        newStatus: 'active',
      });

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
          current_start: razorpaySubscription.current_start
            ? new Date(razorpaySubscription.current_start * 1000).toISOString()
            : dbSubscription.current_start,
          current_end: razorpaySubscription.current_end
            ? new Date(razorpaySubscription.current_end * 1000).toISOString()
            : dbSubscription.current_end,
          next_billing_date: razorpaySubscription.current_end
            ? new Date(razorpaySubscription.current_end * 1000).toISOString()
            : dbSubscription.next_billing_date,
          paid_count: razorpaySubscription.paid_count || 0,
          remaining_count: razorpaySubscription.remaining_count || 12,
        })
        .eq('subscription_id', dbSubscription.subscription_id);

      if (updateError) {
        console.error('[Payment Verification] Failed to update subscription status', {
          requestId,
          subscriptionId,
          error: updateError,
        });
        // Don't fail the request, but log the error
      } else {
        console.log('[Payment Verification] Successfully updated subscription status', {
          requestId,
          subscriptionId,
        });
      }
    }

    // Step 5: Fetch plan details
    let planDetails = null;
    try {
      const plan = await razorpayClient.plans.fetch(razorpaySubscription.plan_id);
      planDetails = {
        name: plan.item.name,
        amount: plan.item.amount,
        currency: plan.item.currency,
      };
    } catch (planError) {
      console.warn('[Payment Verification] Could not fetch plan details', {
        requestId,
        planId: razorpaySubscription.plan_id,
        error: planError,
      });
    }

    // Step 6: Return verification result
    const result = {
      status: verificationStatus,
      subscriptionId,
      paymentId: razorpaySubscription.payment_id,
      message,
      nextBillingDate: razorpaySubscription.current_end
        ? new Date(razorpaySubscription.current_end * 1000).toISOString()
        : null,
      planDetails,
      razorpayStatus: razorpaySubscription.status,
      paidCount: razorpaySubscription.paid_count || 0,
      totalCount: razorpaySubscription.total_count || 0,
      isActive,
    };

    console.log('[Payment Verification] Verification completed', {
      requestId,
      verificationStatus,
      isActive,
      paidCount: result.paidCount,
      totalCount: result.totalCount,
    });

    return createResponse(true, result, 200, requestId);
  } catch (error: unknown) {
    console.error('[Payment Verification] Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while verifying payment',
      500,
      requestId,
      {
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * GET handler for subscription status checking
 */
export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return createErrorResponse(
        'MISSING_SUBSCRIPTION_ID',
        'Subscription ID is required as query parameter',
        400,
        requestId
      );
    }

    // Authentication check
    const sessionResult = await getServerSession();
    if (!sessionResult.session || !sessionResult.session.user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
    }

    const userId = sessionResult.session.user.id;
    const supabase = await getSupabaseServerClient();

    // Fetch subscription status
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('razorpay_subscription_id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return createErrorResponse(
        'SUBSCRIPTION_NOT_FOUND',
        'Subscription not found',
        404,
        requestId
      );
    }

    const result = {
      status: subscription.status,
      subscriptionId: subscription.razorpay_subscription_id,
      message:
        subscription.status === 'active' ? 'Subscription is active' : 'Subscription is not active',
      nextBillingDate: subscription.next_billing_date,
    };

    return createResponse(true, result, 200, requestId);
  } catch (error: unknown) {
    console.error('[Payment Verification] GET error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500, requestId);
  }
}
