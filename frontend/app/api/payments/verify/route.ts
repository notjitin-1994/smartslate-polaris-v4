import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for payment verification
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  paymentMethod: z.string().optional(),
  metadata: z
    .object({
      tier: z.string(),
      billingCycle: z.string(),
      amount: z.number(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = verifyPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid verification data',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod, metadata } =
      validation.data;

    // Verify Razorpay signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Signature verification failed', {
        expected: generatedSignature,
        received: razorpay_signature,
      });

      // Update order status to failed
      await supabase
        .from('payment_orders')
        .update({
          status: 'failed',
          failure_reason: 'signature_mismatch',
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_order_id', razorpay_order_id);

      return NextResponse.json(
        {
          error: 'Payment verification failed',
          code: 'INVALID_SIGNATURE',
        },
        { status: 400 }
      );
    }

    // Get the payment order from database
    const { data: paymentOrder, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !paymentOrder) {
      console.error('Payment order not found:', razorpay_order_id);
      return NextResponse.json(
        { error: 'Payment order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (paymentOrder.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        subscription: {
          tier: paymentOrder.tier,
          billingCycle: paymentOrder.billing_cycle,
          status: 'active',
          nextBillingDate: calculateEndDate(paymentOrder.billing_cycle),
        },
      });
    }

    // Update payment order with verification details
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
        payment_method: paymentMethod,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentOrder.id);

    if (updateError) {
      console.error('Failed to update payment order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment order', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    // Calculate subscription end date
    const now = new Date();
    const endsAt = calculateEndDate(paymentOrder.billing_cycle);

    // Check for existing active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    let subscription;

    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSub, error: subError } = await supabase
        .from('subscriptions')
        .update({
          payment_order_id: paymentOrder.id,
          tier: paymentOrder.tier,
          billing_cycle: paymentOrder.billing_cycle,
          ends_at: endsAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (subError) {
        console.error('Failed to update subscription:', subError);
      }
      subscription = updatedSub;
    } else {
      // Create new subscription
      const { data: newSub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          payment_order_id: paymentOrder.id,
          tier: paymentOrder.tier,
          billing_cycle: paymentOrder.billing_cycle,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endsAt,
          metadata: {
            razorpay_payment_id,
            activated_at: now.toISOString(),
          },
        })
        .select()
        .single();

      if (subError) {
        console.error('Failed to create subscription:', subError);
      }
      subscription = newSub;
    }

    // The database trigger will automatically update user_profiles.subscription_tier

    console.log('Payment verified successfully:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      tier: paymentOrder.tier,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: subscription
        ? {
            id: subscription.id,
            tier: subscription.tier,
            billingCycle: subscription.billing_cycle,
            status: subscription.status,
            startsAt: subscription.starts_at,
            endsAt: subscription.ends_at,
          }
        : {
            tier: paymentOrder.tier,
            billingCycle: paymentOrder.billing_cycle,
            status: 'active',
            nextBillingDate: endsAt,
          },
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      {
        error: 'Payment verification failed',
        code: 'VERIFICATION_ERROR',
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate subscription end date
function calculateEndDate(billingCycle: string): string {
  const now = new Date();
  if (billingCycle === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else if (billingCycle === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
}
