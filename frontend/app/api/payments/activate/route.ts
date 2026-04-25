import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const activateSubscriptionSchema = z.object({
  paymentId: z.string(),
  tier: z.string(),
  billingCycle: z.enum(['monthly', 'annual']),
});

// Tier limits configuration
const TIER_LIMITS = {
  explorer: {
    blueprint_creation_limit: 2,
    blueprint_saving_limit: 2,
    features: ['basic'],
  },
  navigator: {
    blueprint_creation_limit: 10,
    blueprint_saving_limit: 10,
    features: ['basic', 'export_pdf'],
  },
  voyager: {
    blueprint_creation_limit: 25,
    blueprint_saving_limit: 25,
    features: ['basic', 'export_pdf', 'export_word', 'sharing'],
  },
  crew: {
    blueprint_creation_limit: 50,
    blueprint_saving_limit: 50,
    features: ['basic', 'export_pdf', 'export_word', 'sharing', 'collaboration'],
  },
  fleet: {
    blueprint_creation_limit: 100,
    blueprint_saving_limit: 100,
    features: ['basic', 'export_pdf', 'export_word', 'sharing', 'collaboration', 'analytics'],
  },
  armada: {
    blueprint_creation_limit: 500,
    blueprint_saving_limit: 500,
    features: [
      'basic',
      'export_pdf',
      'export_word',
      'sharing',
      'collaboration',
      'analytics',
      'priority_support',
    ],
  },
  enterprise: {
    blueprint_creation_limit: -1, // Unlimited
    blueprint_saving_limit: -1, // Unlimited
    features: ['all'],
  },
};

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
    const validation = activateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid activation data',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { paymentId, tier, billingCycle } = validation.data;

    // Verify payment exists and is successful
    const { data: paymentOrder, error: paymentError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('razorpay_payment_id', paymentId)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .single();

    if (paymentError || !paymentOrder) {
      return NextResponse.json(
        {
          error: 'Payment not found or not completed',
          code: 'INVALID_PAYMENT',
        },
        { status: 400 }
      );
    }

    // Get tier configuration
    const tierConfig = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
    if (!tierConfig) {
      return NextResponse.json(
        {
          error: 'Invalid subscription tier',
          code: 'INVALID_TIER',
        },
        { status: 400 }
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update user profile with new subscription
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_period: billingCycle,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        blueprint_creation_limit: tierConfig.blueprint_creation_limit,
        blueprint_saving_limit: tierConfig.blueprint_saving_limit,
        features: tierConfig.features,
        last_payment_id: paymentId,
        last_payment_date: new Date().toISOString(),
        // Reset monthly counters if upgrading
        blueprint_creation_count: 0,
        blueprint_saving_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to activate subscription:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to activate subscription',
          code: 'ACTIVATION_FAILED',
        },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - implement if you have email service)
    // await sendSubscriptionConfirmationEmail(user.email, tier, billingCycle);

    // Log subscription activation
    await supabase.from('subscription_events').insert({
      user_id: user.id,
      event_type: 'activation',
      tier,
      billing_cycle: billingCycle,
      payment_id: paymentId,
      metadata: {
        previous_tier: paymentOrder.metadata?.previous_tier || 'explorer',
        activation_date: startDate.toISOString(),
        expiry_date: endDate.toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        tier,
        billingCycle,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limits: {
          blueprintCreation: tierConfig.blueprint_creation_limit,
          blueprintSaving: tierConfig.blueprint_saving_limit,
        },
        features: tierConfig.features,
      },
      redirectUrl: '/?subscription=activated',
    });
  } catch (error) {
    console.error('Subscription activation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to activate subscription',
        code: 'ACTIVATION_ERROR',
      },
      { status: 500 }
    );
  }
}
