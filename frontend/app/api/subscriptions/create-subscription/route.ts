/**
 * Create Subscription API Route
 *
 * @description API endpoint for creating Razorpay subscriptions with comprehensive validation,
 * authentication, duplicate prevention, and error handling
 *
 * @version 1.0.0
 * @date 2025-10-29
 *
 * @endpoint POST /api/subscriptions/create-subscription
 * @access authenticated users
 */

import { NextResponse } from 'next/server';
import {
  CreateSubscriptionRequestSchema,
  CreateSubscriptionResponseSchema,
  ErrorResponseSchema,
  validateCreateSubscriptionRequest,
  type CreateSubscriptionRequest,
} from '@/lib/schemas/razorpaySubscription';
import { getSupabaseServerClient, getServerSession } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { getPlanId, getPlanPrice } from '@/lib/config/razorpayPlans';
import { razorpayClient, isTestMode } from '@/lib/razorpay/client';
import { RATE_LIMIT_CONFIGS, rateLimitMiddleware } from '@/lib/middleware/rateLimiting';
import { addApiSecurityHeaders } from '@/lib/security/securityHeaders';

// Set runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Enhanced rate limiting for subscription creation
 */
const subscriptionRateLimit = rateLimitMiddleware(RATE_LIMIT_CONFIGS.SUBSCRIPTION_CREATION);

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
    timestamp: new Date().toISOString(),
  };

  const response = NextResponse.json(errorResponse, { status });
  return addApiSecurityHeaders(response);
}

/**
 * Structured success response utility
 */
function createSuccessResponse(data: any, requestId: string): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  });

  return addApiSecurityHeaders(response);
}

/**
 * Main POST handler for subscription creation
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Apply enhanced rate limiting
    const rateLimitResult = await subscriptionRateLimit(request);
    if (!rateLimitResult.allowed) {
      console.warn(`[Razorpay] Rate limit exceeded for subscription creation`, {
        requestId,
        error: rateLimitResult.error,
      });

      if (rateLimitResult.response) {
        return addApiSecurityHeaders(rateLimitResult.response);
      }

      const response = createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many subscription creation attempts. Please try again later.',
        429,
        requestId,
        {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime.getTime(),
          windowMs: 60 * 1000,
          retryAfter: rateLimitResult.retryAfter,
        }
      );

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set(
        'X-RateLimit-Reset',
        Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString()
      );
      if (rateLimitResult.retryAfter) {
        response.headers.set(
          'Retry-After',
          Math.ceil(rateLimitResult.retryAfter / 1000).toString()
        );
      }

      return response;
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('[Razorpay] Invalid JSON body', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400, requestId);
    }

    // Validate request body using Zod schema
    const validationResult = validateCreateSubscriptionRequest(requestBody);
    if (!validationResult.success) {
      console.error('[Razorpay] Validation failed', {
        requestId,
        errors: validationResult.error.flatten(),
        body: requestBody,
      });

      return createErrorResponse('VALIDATION_ERROR', 'Invalid request parameters', 400, requestId, {
        validationErrors: validationResult.error.flatten(),
      });
    }

    const { tier, billingCycle, seats, customerInfo, metadata } = validationResult.data;

    // Additional validation for seats based on tier
    const isTeamTier = ['crew', 'fleet', 'armada'].includes(tier);
    if (isTeamTier && !seats) {
      console.error('[Razorpay] Validation failed - seats required for team tier', {
        requestId,
        tier,
        isTeamTier,
      });

      return createErrorResponse(
        'VALIDATION_ERROR',
        `Seats are required for ${tier} tier. Please specify the number of seats.`,
        400,
        requestId,
        {
          tier,
          isTeamTier,
          validationRule: 'team_tiers_require_seats',
        }
      );
    }

    if (!isTeamTier && seats) {
      console.error('[Razorpay] Validation failed - seats not allowed for individual tier', {
        requestId,
        tier,
        seats,
        isTeamTier,
      });

      return createErrorResponse(
        'VALIDATION_ERROR',
        `Seats are not allowed for ${tier} tier. Individual tiers do not require seat configuration.`,
        400,
        requestId,
        {
          tier,
          seats,
          isTeamTier,
          validationRule: 'individual_tiers_no_seats',
        }
      );
    }

    // Authentication check
    const sessionResult = await getServerSession();
    if (!sessionResult.session || !sessionResult.session.user) {
      console.error('[Razorpay] Authentication failed', {
        requestId,
        hasSession: !!sessionResult.session,
        hasUser: !!sessionResult.session?.user,
      });

      return createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required. Please sign in to create a subscription.',
        401,
        requestId
      );
    }

    const user = sessionResult.session.user;
    const userId = user.id;

    // Validate user data
    if (!userId) {
      console.error('[Razorpay] Invalid user session', {
        requestId,
        user: user,
        hasId: !!userId,
      });

      return createErrorResponse(
        'INVALID_SESSION',
        'Invalid user session. Please sign in again.',
        401,
        requestId
      );
    }

    console.log('[Razorpay] User session validated', {
      requestId,
      userId,
      email: user.email,
      hasMetadata: !!user.user_metadata,
    });

    // Initialize Supabase client
    const supabase = await getSupabaseServerClient();

    // Get user profile for additional context
    let { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, full_name, email')
      .eq('user_id', userId)
      .single();

    console.log('[Razorpay] Initial profile fetch result', {
      requestId,
      userId,
      userProfile,
      profileError,
      hasProfile: !!userProfile,
      profileErrorCode: profileError?.code,
    });

    // Create user profile if it doesn't exist
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create one
      console.log('[Razorpay] Creating user profile for new user', {
        requestId,
        userId,
        email: user.email,
        userMetadata: user.user_metadata,
      });

      // Safely extract user data
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';

      const profileData = {
        user_id: userId,
        subscription_tier: 'explorer', // Default free tier
        user_role: 'explorer',
        full_name: fullName,
        email: user.email,
        blueprint_creation_count: 0,
        blueprint_saving_count: 0,
        blueprint_creation_limit: 2, // Free tier limits
        blueprint_saving_limit: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[Razorpay] Profile data to insert', {
        requestId,
        profileData,
      });

      const { data: newUserProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select('subscription_tier, full_name, email')
        .single();

      if (createError) {
        console.error('[Razorpay] Failed to create user profile', {
          requestId,
          userId,
          error: createError,
          errorCode: createError.code,
          errorDetails: createError.details,
          errorHint: createError.hint,
        });

        return createErrorResponse(
          'PROFILE_CREATE_ERROR',
          'Failed to create user profile',
          500,
          requestId,
          {
            originalError: createError.message,
            errorCode: createError.code,
            userId: userId,
          }
        );
      }

      console.log('[Razorpay] User profile created successfully', {
        requestId,
        userId,
        profile: newUserProfile,
      });

      userProfile = newUserProfile;
    } else if (profileError) {
      // Try a different approach - maybe the issue is with the .single() method
      console.log('[Razorpay] Trying alternative profile fetch method', {
        requestId,
        userId,
        originalError: profileError,
      });

      const { data: userProfileList, error: listError } = await supabase
        .from('user_profiles')
        .select('subscription_tier, full_name, email')
        .eq('user_id', userId)
        .limit(1);

      console.log('[Razorpay] Alternative profile fetch result', {
        requestId,
        userId,
        userProfileList,
        listError,
        profileListLength: userProfileList?.length,
      });

      if (!listError && userProfileList && userProfileList.length > 0) {
        // We found the profile using the list method
        userProfile = userProfileList[0];
        console.log('[Razorpay] Profile found using alternative method', {
          requestId,
          userId,
          profile: userProfile,
        });
      } else if (listError) {
        // Both methods failed, this is likely a database or permission issue
        console.error('[Razorpay] Both profile fetch methods failed', {
          requestId,
          userId,
          singleError: profileError,
          listError: listError,
        });
      }

      // If we still don't have a profile after trying alternative method, continue with error handling
      if (!userProfile) {
        // Other profile error - provide more detailed error info
        console.error('[Razorpay] Failed to fetch user profile', {
          requestId,
          userId,
          error: profileError,
          errorCode: profileError.code,
          errorDetails: profileError.details,
          errorHint: profileError.hint,
          errorMessage: profileError.message,
        });

        // Try to handle common error cases
        let errorMessage = 'Failed to retrieve user profile';
        let statusCode = 500;

        if (profileError.code === 'PGRST116') {
          // This should have been caught above, but handle it just in case
          errorMessage = 'User profile not found';
          statusCode = 404;
        } else if (profileError.code === 'PGRST301') {
          // Permission denied
          errorMessage = 'Access denied to user profile';
          statusCode = 403;
        } else if (profileError.code === 'PGRST000') {
          // Database error
          errorMessage = 'Database connection error';
          statusCode = 503;
        }

        return createErrorResponse('PROFILE_ERROR', errorMessage, statusCode, requestId, {
          originalError: profileError.message,
          errorCode: profileError.code,
          errorDetails: profileError.details,
          userId: userId,
        });
      }
    }

    // Get plan configuration
    const planId = getPlanId(tier, billingCycle);
    if (!planId) {
      console.error('[Razorpay] Plan not configured', {
        requestId,
        tier,
        billingCycle,
      });

      return createErrorResponse(
        'PLAN_NOT_CONFIGURED',
        `Plan not configured for ${tier} tier with ${billingCycle} billing`,
        400,
        requestId,
        { tier, billingCycle }
      );
    }

    const planPrice = getPlanPrice(tier, billingCycle);
    const planAmount = seats ? planPrice * seats : planPrice; // Multiply for team tiers

    // DEBUG: Log plan details
    console.log('[Razorpay DEBUG] Plan configuration:', {
      requestId,
      tier,
      billingCycle,
      planId,
      planPrice,
      planAmount,
      rupeesAmount: planAmount / 100,
      seats,
      finalAmount: seats ? planPrice * seats : planPrice,
    });

    // Check for existing active subscriptions (duplicate prevention)
    console.log('[Razorpay] Checking for existing subscriptions', {
      requestId,
      userId,
    });

    const { data: existingSubscriptions, error: subscriptionCheckError } = await supabase
      .from('subscriptions')
      .select(
        `
        subscription_id,
        razorpay_subscription_id,
        status,
        subscription_tier,
        plan_name,
        next_billing_date,
        created_at,
        updated_at
      `
      )
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (subscriptionCheckError) {
      console.error('[Razorpay] Failed to check existing subscriptions', {
        requestId,
        userId,
        error: subscriptionCheckError,
      });

      return createErrorResponse(
        'SUBSCRIPTION_CHECK_ERROR',
        'Failed to verify existing subscriptions',
        500,
        requestId,
        { originalError: subscriptionCheckError.message }
      );
    }

    // Handle duplicate subscription prevention
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const activeSubscription = existingSubscriptions[0];

      console.warn('[Razorpay] Duplicate subscription attempt detected', {
        requestId,
        userId,
        existingSubscription: {
          id: activeSubscription.subscription_id,
          status: activeSubscription.status,
          tier: activeSubscription.subscription_tier,
          nextBilling: activeSubscription.next_billing_date,
        },
        newRequest: {
          tier,
          billingCycle,
        },
      });

      // Allow upgrade to higher tier but prevent duplicate same tier
      const tierHierarchy = {
        free: 0,
        explorer: 1,
        navigator: 2,
        voyager: 3,
        crew: 4,
        fleet: 5,
        armada: 6,
      };

      const currentTierLevel =
        tierHierarchy[activeSubscription.subscription_tier as keyof typeof tierHierarchy] || 0;
      const requestedTierLevel = tierHierarchy[tier] || 0;

      if (requestedTierLevel <= currentTierLevel) {
        // Same tier or downgrade - prevent duplicate
        return createErrorResponse(
          'DUPLICATE_SUBSCRIPTION',
          `You already have an active ${activeSubscription.subscription_tier} subscription. ${requestedTierLevel === currentTierLevel ? 'Cannot create duplicate subscription.' : 'Please select a higher tier to upgrade.'}`,
          400,
          requestId,
          {
            currentSubscription: {
              tier: activeSubscription.subscription_tier,
              status: activeSubscription.status,
              planName: activeSubscription.plan_name,
              nextBillingDate: activeSubscription.next_billing_date,
            },
            requestedTier: tier,
            isUpgradeAttempt: requestedTierLevel <= currentTierLevel,
          }
        );
      } else {
        // Higher tier - allow upgrade but log it
        console.log('[Razorpay] Upgrade attempt detected', {
          requestId,
          userId,
          fromTier: activeSubscription.subscription_tier,
          toTier: tier,
          currentStatus: activeSubscription.status,
        });
      }
    }

    console.log('[Razorpay] Subscription creation request validated', {
      requestId,
      userId: user.id,
      email: user.email,
      tier,
      billingCycle,
      seats,
      planId,
      planAmount,
      existingSubscriptionsCount: existingSubscriptions?.length || 0,
      processingTime: Date.now() - startTime,
    });

    // Create or retrieve Razorpay customer
    console.log('[Razorpay] Creating/retrieving Razorpay customer', {
      requestId,
      userId,
      email: user.email,
      customerInfo,
    });

    let razorpayCustomer;
    try {
      // First try to find existing customer by email - ENSURE IT MATCHES CURRENT USER
      if (user.email) {
        const existingCustomers = await razorpayClient.customers.all({
          email: user.email,
          limit: 10, // Increased limit to check multiple customers
        });

        // Find customer that EXACTLY matches the current user's email
        const matchingCustomer = existingCustomers.items.find(
          (customer: any) => customer.email === user.email
        );

        if (matchingCustomer) {
          razorpayCustomer = matchingCustomer;
          console.log('[Razorpay] Found existing customer with exact email match', {
            requestId,
            customerId: razorpayCustomer.id,
            customerEmail: razorpayCustomer.email,
            userEmail: user.email,
            exactMatch: true,
          });
        } else if (existingCustomers.items.length > 0) {
          // Log warning if customers were found but none match
          console.warn('[Razorpay] Found customers but none match current user email', {
            requestId,
            userEmail: user.email,
            foundCustomers: existingCustomers.items.map((c: any) => ({
              id: c.id,
              email: c.email,
            })),
            willCreateNew: true,
          });
        }
      }

      // Create new customer if not found
      if (!razorpayCustomer) {
        const customerData: any = {
          name: customerInfo?.name || userProfile?.full_name || user.email?.split('@')[0] || 'User',
          email: customerInfo?.email || user.email || `${userId}@polaris.app`,
          contact: customerInfo?.contact || undefined,
          notes: {
            user_id: userId,
            source: 'polaris_v3',
            created_at: new Date().toISOString(),
            ...(metadata && { user_metadata: JSON.stringify(metadata) }),
          },
        };

        razorpayCustomer = await razorpayClient.customers.create(customerData);
        console.log('[Razorpay] Created new customer', {
          requestId,
          customerId: razorpayCustomer.id,
          customerName: razorpayCustomer.name,
          customerEmail: razorpayCustomer.email,
        });
      }
    } catch (razorpayError: any) {
      console.error('[Razorpay] Customer creation/retrieval failed', {
        requestId,
        userId,
        email: user.email,
        error: razorpayError,
        errorCode: razorpayError.error?.code,
        errorMessage: razorpayError.error?.description,
      });

      return createErrorResponse(
        'RAZORPAY_CUSTOMER_ERROR',
        'Failed to create or retrieve customer in Razorpay',
        500,
        requestId,
        {
          originalError: razorpayError.error?.description || razorpayError.message,
          errorCode: razorpayError.error?.code,
        }
      );
    }

    // Create Razorpay subscription
    console.log('[Razorpay] Creating Razorpay subscription', {
      requestId,
      customerId: razorpayCustomer.id,
      planId,
      planAmount,
      tier,
      billingCycle,
      seats,
    });

    let razorpaySubscription;
    try {
      // CRITICAL: Omit start_at to create immediate subscription
      // Per Razorpay docs: "For immediate start subscriptions, the charge amount
      // will be the full plan amount" - omitting start_at creates immediate subscription
      const subscriptionData: any = {
        plan_id: planId,
        customer_id: razorpayCustomer.id,
        total_count: billingCycle === 'monthly' ? 12 : 1, // 12 months or 1 year
        quantity: 1, // Number of subscriptions
        customer_notify: 1, // Send email notification to customer
        // DO NOT set start_at - omitting it creates immediate subscription with full charge
        notes: {
          user_id: userId,
          subscription_tier: tier,
          billing_cycle: billingCycle,
          seats: seats?.toString() || '1',
          source: 'polaris_v3_subscription',
          created_at: new Date().toISOString(),
          ...(metadata && { subscription_metadata: JSON.stringify(metadata) }),
        },
      };

      // Add callback URL for production
      if (!isTestMode()) {
        // TODO: Configure webhook URL in production
        // subscriptionData.callback_url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/razorpay`;
      }

      razorpaySubscription = await razorpayClient.subscriptions.create(subscriptionData);

      // Fetch the plan details separately since Razorpay doesn't return full plan info in subscription response
      let planDetails: any = null;
      try {
        planDetails = await razorpayClient.plans.fetch(planId);
        console.log('[Razorpay DEBUG] Fetched plan details:', {
          requestId,
          planId,
          planAmount: planDetails.item.amount,
          planCurrency: planDetails.item.currency,
          planName: planDetails.item.name,
        });
      } catch (planError: any) {
        console.error('[Razorpay] Failed to fetch plan details:', {
          requestId,
          planId,
          error: planError.message,
        });
        // Continue without plan details - use our calculated values
        planDetails = null;
      }

      // DEBUG: Log what Razorpay returned
      console.log('[Razorpay DEBUG] Subscription created successfully', {
        requestId,
        subscriptionId: razorpaySubscription.id,
        customerId: razorpayCustomer.id,
        status: razorpaySubscription.status,
        shortUrl: razorpaySubscription.short_url,
        currentStart: razorpaySubscription.current_start,
        currentEnd: razorpaySubscription.current_end,
        planId: razorpaySubscription.plan_id,
        planAmountFromRazorpay: planDetails?.item?.amount,
        planAmountFromRazorpayRupees: planDetails?.item?.amount
          ? planDetails.item.amount / 100
          : 'N/A',
        planCurrency: planDetails?.item?.currency,
        ourPlanAmount: planAmount,
        ourPlanAmountRupees: planAmount / 100,
      });

      // Store subscription in database
      console.log('[Razorpay] Storing subscription in database', {
        requestId,
        razorpaySubscriptionId: razorpaySubscription.id,
        userId,
        customerId: razorpayCustomer.id,
      });

      // Store subscription in database
      const { data: subscriptionRecord, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: userId,
            razorpay_subscription_id: razorpaySubscription.id,
            razorpay_plan_id: planId,
            razorpay_customer_id: razorpayCustomer.id,
            status: razorpaySubscription.status,
            plan_name:
              planDetails?.item?.name ||
              razorpaySubscription.plan?.name ||
              `${tier} (${billingCycle})`,
            plan_amount:
              planDetails?.item?.amount || razorpaySubscription.plan?.amount || planAmount,
            plan_currency:
              planDetails?.item?.currency || razorpaySubscription.plan?.currency || 'INR',
            plan_period: billingCycle,
            plan_interval: billingCycle === 'monthly' ? 1 : 12, // 1 month or 12 months
            subscription_tier: tier,
            start_date: razorpaySubscription.current_start
              ? new Date(razorpaySubscription.current_start * 1000).toISOString()
              : null,
            end_date: razorpaySubscription.current_end
              ? new Date(razorpaySubscription.current_end * 1000).toISOString()
              : null,
            current_start: razorpaySubscription.current_start
              ? new Date(razorpaySubscription.current_start * 1000).toISOString()
              : null,
            current_end: razorpaySubscription.current_end
              ? new Date(razorpaySubscription.current_end * 1000).toISOString()
              : null,
            next_billing_date: razorpaySubscription.current_end
              ? new Date(razorpaySubscription.current_end * 1000).toISOString()
              : null,
            charge_at: razorpaySubscription.charge_at
              ? new Date(razorpaySubscription.charge_at * 1000).toISOString()
              : null,
            total_count: razorpaySubscription.total_count || (billingCycle === 'monthly' ? 12 : 1),
            paid_count: razorpaySubscription.paid_count || 0,
            remaining_count:
              razorpaySubscription.remaining_count || (billingCycle === 'monthly' ? 12 : 1),
            short_url: razorpaySubscription.short_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: JSON.stringify({
              request_id: requestId,
              billing_cycle: billingCycle,
              created_source: 'polaris_v3_api',
              plan_configuration: {
                plan_id: planId,
                plan_amount: planAmount,
                plan_tier: tier,
                plan_billing_cycle: billingCycle,
              },
              ...(metadata && { subscription_metadata: metadata }),
              ...(seats && { seats: seats }), // Store seats in metadata since column doesn't exist
            }),
          },
        ])
        .select();

      if (subscriptionError) {
        console.error('[Razorpay] Database storage failed', {
          requestId,
          error: subscriptionError.message,
          details: subscriptionError,
        });

        // Clean up the subscription from Razorpay since database storage failed
        try {
          await razorpayClient.subscriptions.cancel(razorpaySubscription.id);
          console.log('[Razorpay] Cleaned up subscription due to database error', {
            requestId,
            subscriptionId: razorpaySubscription.id,
          });
        } catch (cleanupError: any) {
          console.error('[Razorpay] Failed to clean up subscription', {
            requestId,
            subscriptionId: razorpaySubscription.id,
            cleanupError: cleanupError.message,
          });
        }

        return createErrorResponse(
          'DATABASE_ERROR',
          'Failed to store subscription in database',
          500,
          requestId,
          {
            originalError: subscriptionError.message,
            subscriptionId: razorpaySubscription.id,
          }
        );
      }

      console.log('[Razorpay] Subscription stored successfully in database', {
        requestId,
        databaseSubscriptionId: subscriptionRecord?.[0]?.subscription_id,
        razorpaySubscriptionId: razorpaySubscription.id,
        userId,
        status: razorpaySubscription.status,
      });

      const responseData = {
        message: 'Subscription created successfully',
        subscription: {
          subscriptionId: razorpaySubscription.id,
          customerId: razorpayCustomer.id,
          shortUrl: razorpaySubscription.short_url,
          status: razorpaySubscription.status,
          planName: planDetails?.item?.name || `${tier} (${billingCycle})`,
          planAmount: planDetails?.item?.amount || planAmount,
          planCurrency: planDetails?.item?.currency || 'INR',
          billingCycle,
          nextBillingDate: razorpaySubscription.current_end
            ? new Date(razorpaySubscription.current_end * 1000).toISOString()
            : null,
          currentStart: razorpaySubscription.current_start
            ? new Date(razorpaySubscription.current_start * 1000).toISOString()
            : null,
          tier,
          customerName: razorpayCustomer.name,
          customerEmail: razorpayCustomer.email,
        },
      };

      // DEBUG: Log what we're returning to frontend
      console.log('[Razorpay DEBUG] API Response data:', {
        requestId,
        planAmountBeingReturned: responseData.subscription.planAmount,
        planAmountBeingReturnedRupees: responseData.subscription.planAmount / 100,
        planAmountSource: planDetails?.item?.amount
          ? 'from Razorpay plan (fetched separately)'
          : razorpaySubscription.plan?.amount
            ? 'from Razorpay subscription'
            : 'from our calculation',
        sourcePlanId: razorpaySubscription.plan_id,
        ourOriginalPlanId: planId,
        fetchedPlanDetails: {
          amount: planDetails?.item?.amount,
          currency: planDetails?.item?.currency,
          name: planDetails?.item?.name,
        },
      });

      return createSuccessResponse(responseData, requestId);
    } catch (razorpayError: any) {
      console.error('[Razorpay] Subscription creation failed', {
        requestId,
        customerId: razorpayCustomer.id,
        planId,
        error: razorpayError,
        errorCode: razorpayError.error?.code,
        errorMessage: razorpayError.error?.description,
      });

      return createErrorResponse(
        'RAZORPAY_SUBSCRIPTION_ERROR',
        'Failed to create subscription in Razorpay',
        500,
        requestId,
        {
          originalError: razorpayError.error?.description || razorpayError.message,
          errorCode: razorpayError.error?.code,
          planId,
          customerId: razorpayCustomer.id,
        }
      );
    }
  } catch (error: unknown) {
    console.error('[Razorpay] Unexpected error in subscription creation', {
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
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed for this endpoint',
      },
      timestamp: new Date().toISOString(),
    },
    { status: 405 }
  );

  return addApiSecurityHeaders(response);
}
