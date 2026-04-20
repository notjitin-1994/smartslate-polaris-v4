/**
 * Razorpay Subscription Event Handlers
 *
 * @description Comprehensive handlers for Razorpay subscription lifecycle events
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This module implements handlers for all subscription-related webhook events,
 * including activation, charges, completions, cancellations, and status changes.
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 * @see https://razorpay.com/docs/webhooks/subscriptions/
 */

import { getSupabaseServerClient } from '../../supabase/server';
import type { Database } from '../../../types/supabase';
import type { ParsedWebhookEvent, WebhookEventRecord } from '../webhookSecurity';
import type { EventHandler, EventHandlerResult } from '../eventRouter';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Subscription entity from Razorpay webhook payload
 */
export interface SubscriptionEntity {
  id: string;
  status: string;
  current_start: number;
  current_end: number;
  start_at: number;
  end_at?: number;
  plan_id: string;
  customer_id: string;
  payment_id?: string;
  invoice_id?: string;
  offer_id?: string;
  has_trial?: boolean;
  trial_end?: number;
  charge_at?: number;
  created_at: number;
  expired_at?: number;
  cancelled_at?: number;
  short_url?: string;
  notes?: Record<string, string>;
  [key: string]: any;
}

/**
 * Subscription update data
 */
interface SubscriptionUpdateData {
  status: string;
  current_start?: string;
  current_end?: string;
  end_at?: string;
  trial_end?: string;
  cancelled_at?: string;
  expired_at?: string;
  razorpay_payment_id?: string;
  invoice_id?: string;
  updated_at: string;
}

/**
 * Handler context
 */
interface HandlerContext {
  supabase: any;
  subscription: Database['public']['Tables']['razorpay_subscriptions']['Row'];
  userId: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract subscription entity from webhook event
 */
function extractSubscriptionEntity(event: ParsedWebhookEvent): SubscriptionEntity {
  return event.payload.entity as SubscriptionEntity;
}

/**
 * Convert Unix timestamp to ISO string
 */
function unixToIso(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Get user by subscription
 */
async function getUserBySubscription(
  supabase: any,
  subscriptionId: string
): Promise<{ userId: string | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('razorpay_subscriptions')
      .select('user_id')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (error) {
      return {
        userId: null,
        error: `Failed to find subscription: ${error.message}`,
      };
    }

    return { userId: data?.user_id || null };
  } catch (error) {
    return {
      userId: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update subscription record
 */
async function updateSubscriptionRecord(
  supabase: any,
  subscriptionId: string,
  updateData: SubscriptionUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('razorpay_subscriptions')
      .update(updateData)
      .eq('razorpay_subscription_id', subscriptionId);

    if (error) {
      return {
        success: false,
        error: `Failed to update subscription: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create payment record for subscription charge
 */
async function createPaymentRecord(
  supabase: any,
  subscriptionId: string,
  paymentId: string,
  amount: number,
  currency: string,
  status: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('razorpay_payments').insert({
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      user_id: userId,
      amount,
      currency,
      status,
      payment_type: 'subscription_charge',
      created_at: new Date().toISOString(),
    });

    if (error) {
      return {
        success: false,
        error: `Failed to create payment record: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update user profile subscription status
 */
async function updateUserProfile(
  supabase: any,
  userId: string,
  updates: {
    subscription_status?: string;
    subscription_ends_at?: string;
    updated_at: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', userId);

    if (error) {
      return {
        success: false,
        error: `Failed to update user profile: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// Subscription Event Handlers
// ============================================================================

/**
 * Handle subscription.activated event
 *
 * Triggered when a subscription is successfully activated after creation or trial.
 */
export const handleSubscriptionActivated: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'active',
      current_start: unixToIso(subscription.current_start),
      current_end: unixToIso(subscription.current_end),
      trial_end: unixToIso(subscription.trial_end),
      updated_at: new Date().toISOString(),
    };

    if (subscription.payment_id) {
      updateData.razorpay_payment_id = subscription.payment_id;
    }

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'active',
      subscription_ends_at: unixToIso(subscription.current_end),
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      // Log error but don't fail the operation
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        paymentId: subscription.payment_id,
        status: 'active',
        action: 'subscription_activated',
        metadata: {
          userId,
          trialEnd: unixToIso(subscription.trial_end),
          currentEnd: unixToIso(subscription.current_end),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription activation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.charged event
 *
 * Triggered when a subscription renewal payment is successful.
 */
export const handleSubscriptionCharged: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record with new billing period
    const updateData: SubscriptionUpdateData = {
      status: 'active',
      current_start: unixToIso(subscription.current_start),
      current_end: unixToIso(subscription.current_end),
      updated_at: new Date().toISOString(),
    };

    if (subscription.payment_id) {
      updateData.razorpay_payment_id = subscription.payment_id;
    }

    if (subscription.invoice_id) {
      updateData.invoice_id = subscription.invoice_id;
    }

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Create payment record if payment ID is available
    if (subscription.payment_id) {
      // Extract payment details from subscription notes or use defaults
      const amount = parseInt(subscription.notes?.amount || '0') || 0;
      const currency = subscription.notes?.currency || 'INR';

      const paymentResult = await createPaymentRecord(
        supabase,
        subscription.id,
        subscription.payment_id,
        amount,
        currency,
        'captured',
        userId
      );

      if (!paymentResult.success) {
        // Log error but don't fail the operation
        console.error('Failed to create payment record:', paymentResult.error);
      }
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'active',
      subscription_ends_at: unixToIso(subscription.current_end),
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        paymentId: subscription.payment_id,
        status: 'active',
        action: 'subscription_charged',
        metadata: {
          userId,
          nextBillingDate: unixToIso(subscription.current_end),
          invoiceId: subscription.invoice_id,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription charge: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.completed event
 *
 * Triggered when a subscription completes its full term.
 */
export const handleSubscriptionCompleted: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'completed',
      end_at: unixToIso(subscription.end_at),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile - user loses subscription access
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'completed',
      subscription_ends_at: unixToIso(subscription.end_at),
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        status: 'completed',
        action: 'subscription_completed',
        metadata: {
          userId,
          completedAt: unixToIso(subscription.end_at),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription completion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.cancelled event
 *
 * Triggered when a subscription is cancelled.
 */
export const handleSubscriptionCancelled: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'cancelled',
      cancelled_at: unixToIso(subscription.cancelled_at),
      end_at: unixToIso(subscription.end_at),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'cancelled',
      subscription_ends_at: unixToIso(subscription.end_at),
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        status: 'cancelled',
        action: 'subscription_cancelled',
        metadata: {
          userId,
          cancelledAt: unixToIso(subscription.cancelled_at),
          accessUntil: unixToIso(subscription.end_at),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.halted event
 *
 * Triggered when a subscription is halted due to payment failures.
 */
export const handleSubscriptionHalted: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'halted',
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'halted',
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        status: 'halted',
        action: 'subscription_halted',
        metadata: {
          userId,
          reason: 'Payment failure or retry exhausted',
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription halt: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.paused event
 *
 * Triggered when a subscription is paused.
 */
export const handleSubscriptionPaused: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'paused',
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'paused',
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        status: 'paused',
        action: 'subscription_paused',
        metadata: {
          userId,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription pause: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.resumed event
 *
 * Triggered when a paused subscription is resumed.
 */
export const handleSubscriptionResumed: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'active',
      current_start: unixToIso(subscription.current_start),
      current_end: unixToIso(subscription.current_end),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'active',
      subscription_ends_at: unixToIso(subscription.current_end),
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        status: 'active',
        action: 'subscription_resumed',
        metadata: {
          userId,
          nextBillingDate: unixToIso(subscription.current_end),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription resume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle subscription.pending event
 *
 * Triggered when a subscription is pending activation.
 */
export const handleSubscriptionPending: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const subscription = extractSubscriptionEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this subscription
    const { userId, error: userError } = await getUserBySubscription(supabase, subscription.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for subscription ${subscription.id}`,
        retryable: false,
      };
    }

    // Update subscription record
    const updateData: SubscriptionUpdateData = {
      status: 'pending',
      start_at: unixToIso(subscription.start_at),
      charge_at: unixToIso(subscription.charge_at),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateSubscriptionRecord(supabase, subscription.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update user profile
    const profileUpdate = await updateUserProfile(supabase, userId, {
      subscription_status: 'pending',
      updated_at: new Date().toISOString(),
    });

    if (!profileUpdate.success) {
      console.error('Failed to update user profile:', profileUpdate.error);
    }

    return {
      success: true,
      processed: true,
      details: {
        subscriptionId: subscription.id,
        status: 'pending',
        action: 'subscription_pending',
        metadata: {
          userId,
          startsAt: unixToIso(subscription.start_at),
          chargeAt: unixToIso(subscription.charge_at),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process subscription pending: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

// ============================================================================
// Export All Handlers
// ============================================================================

export const subscriptionHandlers = {
  'subscription.activated': handleSubscriptionActivated,
  'subscription.charged': handleSubscriptionCharged,
  'subscription.completed': handleSubscriptionCompleted,
  'subscription.cancelled': handleSubscriptionCancelled,
  'subscription.halted': handleSubscriptionHalted,
  'subscription.paused': handleSubscriptionPaused,
  'subscription.resumed': handleSubscriptionResumed,
  'subscription.pending': handleSubscriptionPending,
} as const;
