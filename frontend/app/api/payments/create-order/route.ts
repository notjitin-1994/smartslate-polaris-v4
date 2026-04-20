import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Request validation schema
const createOrderSchema = z.object({
  tier: z.enum(['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
  currency: z.string().default('INR'),
  // Optional: For team plans with multiple seats
  amount: z.number().positive().optional(), // Custom total amount (for team plans)
  seats: z.number().int().min(1).optional(), // Number of seats (for team plans)
});

// Pricing configuration (subscription costs in INR - GST already included)
// These are the final prices displayed on the pricing cards
const PRICING = {
  explorer: { monthly: 1599, annual: 15990 }, // Final price with GST
  navigator: { monthly: 3499, annual: 34990 }, // Final price with GST
  voyager: { monthly: 6999, annual: 69990 }, // Final price with GST
  crew: { monthly: 1999, annual: 19990 }, // Final price with GST per seat
  fleet: { monthly: 5399, annual: 53990 }, // Final price with GST per seat
  armada: { monthly: 10899, annual: 108990 }, // Final price with GST per seat
  enterprise: { monthly: 15000, annual: 150000 }, // Custom pricing
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
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { tier, billingCycle, currency, amount, seats } = validation.data;

    // Get the final amount (GST already included in the price)
    // For team plans, use the custom amount if provided (seats × price per seat)
    // For individual plans, calculate from PRICING
    const totalAmount = amount || PRICING[tier][billingCycle];

    // Razorpay requires a minimum amount of 100 paise (1 INR)
    const razorpayAmount = totalAmount === 0 ? 100 : totalAmount * 100;

    console.log('Creating Razorpay order:', {
      tier,
      billingCycle,
      seats: seats || 1, // 1 for individual plans
      totalAmount,
      razorpayAmount,
    });

    // Create Razorpay order
    // Receipt must be ≤40 characters. Format: ord_[last8OfUserId]_[timestamp]
    const shortUserId = user.id.slice(-8);
    const timestamp = Date.now().toString(36); // Base36 for shorter timestamp
    const orderOptions = {
      amount: razorpayAmount, // Amount in paise
      currency,
      receipt: `ord_${shortUserId}_${timestamp}`, // Max ~25 chars
      notes: {
        user_id: user.id,
        user_email: user.email,
        tier,
        billing_cycle: billingCycle,
        seats: seats ? seats.toString() : '1', // Store seats for team plans
        total_amount: totalAmount.toString(),
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // Note: Order tracking in database is optional
    // Payment processing will continue even if database insert fails

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: totalAmount,
        currency: order.currency,
        receipt: order.receipt,
      },
      breakdown: {
        baseAmount: totalAmount, // For backwards compatibility
        gstAmount: 0, // GST already included in price
        totalAmount,
      },
      prefill: {
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        contact: user.user_metadata?.phone || '',
      },
    });
  } catch (error) {
    console.error('Create order error:', error);

    // More detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      error: 'Failed to create payment order',
      code: 'ORDER_CREATION_FAILED',
      message: errorMessage,
      // Include environment check
      env_check: {
        has_key_id: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        has_secret: !!process.env.RAZORPAY_KEY_SECRET,
      },
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
