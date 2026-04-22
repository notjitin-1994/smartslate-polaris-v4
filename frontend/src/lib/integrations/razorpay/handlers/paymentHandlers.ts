/**
 * Razorpay Payment Event Handlers
 *
 * @description Comprehensive handlers for Razorpay payment webhook events
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This module implements handlers for all payment-related webhook events,
 * including authorizations, captures, failures, and refunds.
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 * @see https://razorpay.com/docs/webhooks/payments/
 */

import { getSupabaseServerClient } from '../../supabase/server';
import type { Database } from '../../../types/supabase';
import type { ParsedWebhookEvent, WebhookEventRecord } from '../webhookSecurity';
import type { EventHandler, EventHandlerResult } from '../eventRouter';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Payment entity from Razorpay webhook payload
 */
export interface PaymentEntity {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: string;
  order_id?: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  customer_id?: string;
  token_id?: string;
  notes?: Record<string, string>;
  fee: number;
  tax: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
  [key: string]: any;
}

/**
 * Payment update data
 */
interface PaymentUpdateData {
  status: string;
  amount_refunded?: number;
  refund_status?: string;
  captured?: boolean;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  captured_at?: string;
  failed_at?: string;
  updated_at: string;
}

/**
 * Payment creation data
 */
interface PaymentCreateData {
  razorpay_payment_id: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description?: string;
  customer_id?: string;
  invoice_id?: string;
  payment_type: 'one_time' | 'subscription_charge';
  fee?: number;
  tax?: number;
  created_at: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract payment entity from webhook event
 */
function extractPaymentEntity(event: ParsedWebhookEvent): PaymentEntity {
  return event.payload.entity as PaymentEntity;
}

/**
 * Get user by payment ID (check if payment exists and belongs to user)
 */
async function getUserByPaymentId(
  supabase: any,
  paymentId: string
): Promise<{ userId: string | null; subscriptionId?: string; error?: string }> {
  try {
    // First check if payment record exists
    const { data: payment, error: paymentError } = await supabase
      .from('razorpay_payments')
      .select('user_id, razorpay_subscription_id')
      .eq('razorpay_payment_id', paymentId)
      .single();

    if (!paymentError && payment) {
      return {
        userId: payment.user_id,
        subscriptionId: payment.razorpay_subscription_id,
      };
    }

    // If no payment record, try to find by subscription ID from webhook payload
    const { data: subscriptions, error: subError } = await supabase
      .from('razorpay_subscriptions')
      .select('user_id, razorpay_subscription_id')
      .eq('razorpay_payment_id', paymentId)
      .limit(1);

    if (subError) {
      return {
        userId: null,
        error: `Failed to find subscription: ${subError.message}`,
      };
    }

    if (subscriptions && subscriptions.length > 0) {
      return {
        userId: subscriptions[0].user_id,
        subscriptionId: subscriptions[0].razorpay_subscription_id,
      };
    }

    return {
      userId: null,
      error: `No user found for payment ${paymentId}`,
    };
  } catch (error) {
    return {
      userId: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create payment record
 */
async function createPaymentRecord(
  supabase: any,
  paymentData: PaymentCreateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('razorpay_payments').insert(paymentData);

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
 * Update payment record
 */
async function updatePaymentRecord(
  supabase: any,
  paymentId: string,
  updateData: PaymentUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('razorpay_payments')
      .update(updateData)
      .eq('razorpay_payment_id', paymentId);

    if (error) {
      return {
        success: false,
        error: `Failed to update payment record: ${error.message}`,
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
 * Update subscription payment information
 */
async function updateSubscriptionPayment(
  supabase: any,
  subscriptionId: string,
  paymentId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('razorpay_subscriptions')
      .update({
        razorpay_payment_id: paymentId,
        payment_verified_at: status === 'captured' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscriptionId);

    if (error) {
      return {
        success: false,
        error: `Failed to update subscription payment: ${error.message}`,
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
 * Convert amount from paise to rupees
 */
function paiseToRupees(amount: number): number {
  return amount / 100;
}

/**
 * Convert Unix timestamp to ISO string
 */
function unixToIso(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  return new Date(timestamp * 1000).toISOString();
}

// ============================================================================
// Payment Event Handlers
// ============================================================================

/**
 * Handle payment.authorized event
 *
 * Triggered when a payment is successfully authorized but not yet captured.
 */
export const handlePaymentAuthorized: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const payment = extractPaymentEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this payment
    const {
      userId,
      subscriptionId,
      error: userError,
    } = await getUserByPaymentId(supabase, payment.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for payment ${payment.id}`,
        retryable: false,
      };
    }

    // Create or update payment record
    const paymentData: PaymentCreateData = {
      razorpay_payment_id: payment.id,
      razorpay_subscription_id: subscriptionId,
      razorpay_order_id: payment.order_id,
      user_id: userId,
      amount: payment.amount,
      currency: payment.currency,
      status: 'authorized',
      method: payment.method,
      description: payment.description,
      customer_id: payment.customer_id,
      invoice_id: payment.invoice_id,
      payment_type: subscriptionId ? 'subscription_charge' : 'one_time',
      fee: payment.fee,
      tax: payment.tax,
      created_at: unixToIso(payment.created_at) || new Date().toISOString(),
    };

    // Try to create payment record
    const createResult = await createPaymentRecord(supabase, paymentData);

    if (!createResult.success) {
      // If creation fails (maybe record exists), try to update
      const updateData: PaymentUpdateData = {
        status: 'authorized',
        updated_at: new Date().toISOString(),
      };

      const updateResult = await updatePaymentRecord(supabase, payment.id, updateData);
      if (!updateResult.success) {
        return {
          success: false,
          processed: false,
          error: `Failed to create or update payment record: ${updateResult.error}`,
          retryable: true,
        };
      }
    }

    // Update subscription if this is a subscription payment
    if (subscriptionId) {
      const subUpdate = await updateSubscriptionPayment(
        supabase,
        subscriptionId,
        payment.id,
        'authorized'
      );

      if (!subUpdate.success) {
        console.error('Failed to update subscription payment:', subUpdate.error);
      }
    }

    return {
      success: true,
      processed: true,
      details: {
        paymentId: payment.id,
        subscriptionId,
        status: 'authorized',
        action: 'payment_authorized',
        metadata: {
          userId,
          amount: paiseToRupees(payment.amount),
          currency: payment.currency,
          method: payment.method,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process payment authorization: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle payment.captured event
 *
 * Triggered when a payment is successfully captured (completed).
 */
export const handlePaymentCaptured: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const payment = extractPaymentEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this payment
    const {
      userId,
      subscriptionId,
      error: userError,
    } = await getUserByPaymentId(supabase, payment.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for payment ${payment.id}`,
        retryable: false,
      };
    }

    // Update payment record
    const updateData: PaymentUpdateData = {
      status: 'captured',
      captured: true,
      captured_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updatePaymentRecord(supabase, payment.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update subscription if this is a subscription payment
    if (subscriptionId) {
      const subUpdate = await updateSubscriptionPayment(
        supabase,
        subscriptionId,
        payment.id,
        'captured'
      );

      if (!subUpdate.success) {
        console.error('Failed to update subscription payment:', subUpdate.error);
      }
    }

    return {
      success: true,
      processed: true,
      details: {
        paymentId: payment.id,
        subscriptionId,
        status: 'captured',
        action: 'payment_captured',
        metadata: {
          userId,
          amount: paiseToRupees(payment.amount),
          currency: payment.currency,
          method: payment.method,
          capturedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process payment capture: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle payment.failed event
 *
 * Triggered when a payment fails.
 */
export const handlePaymentFailed: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const payment = extractPaymentEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this payment
    const {
      userId,
      subscriptionId,
      error: userError,
    } = await getUserByPaymentId(supabase, payment.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for payment ${payment.id}`,
        retryable: false,
      };
    }

    // Update payment record with error details
    const updateData: PaymentUpdateData = {
      status: 'failed',
      error_code: payment.error_code,
      error_description: payment.error_description,
      error_source: payment.error_source,
      error_step: payment.error_step,
      error_reason: payment.error_reason,
      failed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updatePaymentRecord(supabase, payment.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    // Update subscription if this is a subscription payment
    if (subscriptionId) {
      const subUpdate = await updateSubscriptionPayment(
        supabase,
        subscriptionId,
        payment.id,
        'failed'
      );

      if (!subUpdate.success) {
        console.error('Failed to update subscription payment:', subUpdate.error);
      }
    }

    return {
      success: true,
      processed: true,
      details: {
        paymentId: payment.id,
        subscriptionId,
        status: 'failed',
        action: 'payment_failed',
        metadata: {
          userId,
          amount: paiseToRupees(payment.amount),
          currency: payment.currency,
          method: payment.method,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          failedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process payment failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle payment.pending event
 *
 * Triggered when a payment is pending processing.
 */
export const handlePaymentPending: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const payment = extractPaymentEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this payment
    const {
      userId,
      subscriptionId,
      error: userError,
    } = await getUserByPaymentId(supabase, payment.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for payment ${payment.id}`,
        retryable: false,
      };
    }

    // Create or update payment record
    const paymentData: PaymentCreateData = {
      razorpay_payment_id: payment.id,
      razorpay_subscription_id: subscriptionId,
      razorpay_order_id: payment.order_id,
      user_id: userId,
      amount: payment.amount,
      currency: payment.currency,
      status: 'pending',
      method: payment.method,
      description: payment.description,
      customer_id: payment.customer_id,
      invoice_id: payment.invoice_id,
      payment_type: subscriptionId ? 'subscription_charge' : 'one_time',
      fee: payment.fee,
      tax: payment.tax,
      created_at: unixToIso(payment.created_at) || new Date().toISOString(),
    };

    // Try to create payment record
    const createResult = await createPaymentRecord(supabase, paymentData);

    if (!createResult.success) {
      // If creation fails, try to update
      const updateData: PaymentUpdateData = {
        status: 'pending',
        updated_at: new Date().toISOString(),
      };

      const updateResult = await updatePaymentRecord(supabase, payment.id, updateData);
      if (!updateResult.success) {
        return {
          success: false,
          processed: false,
          error: `Failed to create or update payment record: ${updateResult.error}`,
          retryable: true,
        };
      }
    }

    return {
      success: true,
      processed: true,
      details: {
        paymentId: payment.id,
        subscriptionId,
        status: 'pending',
        action: 'payment_pending',
        metadata: {
          userId,
          amount: paiseToRupees(payment.amount),
          currency: payment.currency,
          method: payment.method,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process payment pending: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle refund.processed event (related to payment refunds)
 *
 * Triggered when a refund for a payment is processed.
 */
export const handleRefundProcessed: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const payment = extractPaymentEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this payment
    const {
      userId,
      subscriptionId,
      error: userError,
    } = await getUserByPaymentId(supabase, payment.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for payment ${payment.id}`,
        retryable: false,
      };
    }

    // Update payment record with refund information
    const updateData: PaymentUpdateData = {
      status: payment.status || 'refunded',
      amount_refunded: payment.amount_refunded,
      refund_status: payment.refund_status,
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updatePaymentRecord(supabase, payment.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    return {
      success: true,
      processed: true,
      details: {
        paymentId: payment.id,
        subscriptionId,
        status: 'refunded',
        action: 'refund_processed',
        metadata: {
          userId,
          amountRefunded: paiseToRupees(payment.amount_refunded),
          refundStatus: payment.refund_status,
          originalAmount: paiseToRupees(payment.amount),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

/**
 * Handle refund.created event
 *
 * Triggered when a refund is initiated for a payment.
 */
export const handleRefundCreated: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  const payment = extractPaymentEntity(event);
  const supabase = await getSupabaseServerClient();

  try {
    // Find user for this payment
    const {
      userId,
      subscriptionId,
      error: userError,
    } = await getUserByPaymentId(supabase, payment.id);

    if (userError || !userId) {
      return {
        success: false,
        processed: false,
        error: `User not found for payment ${payment.id}`,
        retryable: false,
      };
    }

    // Update payment record with refund initiated status
    const updateData: PaymentUpdateData = {
      status: 'refund_initiated',
      refund_status: 'processing',
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updatePaymentRecord(supabase, payment.id, updateData);

    if (!updateResult.success) {
      return {
        success: false,
        processed: false,
        error: updateResult.error,
        retryable: true,
      };
    }

    return {
      success: true,
      processed: true,
      details: {
        paymentId: payment.id,
        subscriptionId,
        status: 'refund_initiated',
        action: 'refund_created',
        metadata: {
          userId,
          originalAmount: paiseToRupees(payment.amount),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      processed: false,
      error: `Failed to process refund creation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      retryable: true,
    };
  }
};

// ============================================================================
// Export All Handlers
// ============================================================================

export const paymentHandlers = {
  'payment.authorized': handlePaymentAuthorized,
  'payment.captured': handlePaymentCaptured,
  'payment.failed': handlePaymentFailed,
  'payment.pending': handlePaymentPending,
  'refund.created': handleRefundCreated,
  'refund.processed': handleRefundProcessed,
} as const;
