/**
 * Razorpay Webhook Handler
 * Processes payment confirmations and updates user subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

// Webhook signature verification
function verifyWebhookSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;
    const entity = payload.payload?.payment?.entity || payload.payload?.subscription?.entity;

    console.log('Webhook event received:', event);

    // Handle payment captured event
    if (event === 'payment.captured') {
      const supabase = getSupabaseAdminClient();

      const orderId = entity.order_id;
      const paymentId = entity.id;
      const amount = entity.amount / 100; // Convert from paise to rupees
      const status = entity.status;

      // Get the payment order from database
      const { data: paymentOrder, error: orderError } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single();

      if (orderError || !paymentOrder) {
        console.error('Payment order not found:', orderId);
        return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
      }

      // Update payment order with payment details
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({
          razorpay_payment_id: paymentId,
          status: 'paid',
          payment_method: entity.method,
          paid_at: new Date().toISOString(),
          metadata: {
            ...paymentOrder.metadata,
            payment_details: {
              bank: entity.bank,
              wallet: entity.wallet,
              vpa: entity.vpa,
              card_id: entity.card_id,
              international: entity.international,
              fee: entity.fee,
              tax: entity.tax,
            },
          },
        })
        .eq('id', paymentOrder.id);

      if (updateError) {
        console.error('Failed to update payment order:', updateError);
        return NextResponse.json({ error: 'Failed to update payment order' }, { status: 500 });
      }

      // Calculate subscription end date based on billing cycle
      const now = new Date();
      let endsAt = new Date();

      if (paymentOrder.billing_cycle === 'monthly') {
        endsAt.setMonth(endsAt.getMonth() + 1);
      } else if (paymentOrder.billing_cycle === 'annual') {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      }

      // Check if user has an active subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', paymentOrder.user_id)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            payment_order_id: paymentOrder.id,
            tier: paymentOrder.tier,
            billing_cycle: paymentOrder.billing_cycle,
            ends_at: endsAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);

        if (subError) {
          console.error('Failed to update subscription:', subError);
        }
      } else {
        // Create new subscription
        const { error: subError } = await supabase.from('subscriptions').insert({
          user_id: paymentOrder.user_id,
          payment_order_id: paymentOrder.id,
          tier: paymentOrder.tier,
          billing_cycle: paymentOrder.billing_cycle,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
          metadata: {
            razorpay_payment_id: paymentId,
            activated_at: now.toISOString(),
          },
        });

        if (subError) {
          console.error('Failed to create subscription:', subError);
        }
      }

      // Update user profile with new tier (trigger will handle this via subscription update)
      // The database trigger update_user_subscription_tier() will automatically update user_profiles

      // Log webhook event
      await supabase.from('razorpay_webhook_events').insert({
        event_id: `${event}_${paymentId}`,
        event_type: event,
        entity: 'payment',
        payload: JSON.parse(body),
        processed: true,
        processed_at: new Date().toISOString(),
      });

      console.log('Payment processed successfully:', {
        orderId,
        paymentId,
        tier: paymentOrder.tier,
        userId: paymentOrder.user_id,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
      });
    }

    // Handle payment failed event
    if (event === 'payment.failed') {
      const supabase = getSupabaseAdminClient();
      const orderId = entity.order_id;
      const paymentId = entity.id;

      // Update payment order status
      await supabase
        .from('payment_orders')
        .update({
          razorpay_payment_id: paymentId,
          status: 'failed',
          metadata: {
            failure_reason: entity.error_description,
            failure_code: entity.error_code,
            failure_source: entity.error_source,
            failure_step: entity.error_step,
          },
        })
        .eq('razorpay_order_id', orderId);

      console.log('Payment failed:', {
        orderId,
        paymentId,
        reason: entity.error_description,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment failure recorded',
      });
    }

    // For other events, just log them
    const supabase = getSupabaseAdminClient();
    await supabase.from('razorpay_webhook_events').insert({
      event_id: `${event}_${Date.now()}`,
      event_type: event,
      entity: entity?.entity || 'unknown',
      payload: JSON.parse(body),
      processed: false,
    });

    return NextResponse.json({
      success: true,
      message: `Event ${event} logged`,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'razorpay-webhook',
    timestamp: new Date().toISOString(),
  });
}
