# Custom Checkout Integration Guide
**SmartSlate Polaris - Replacing Razorpay Default Modal**

---

## Overview

This guide shows how to integrate the custom checkout modal into your existing pricing page, replacing the default Razorpay modal while maintaining full payment functionality.

## Quick Start

### 1. Import Custom Checkout

Replace the standard Razorpay modal import with the custom checkout:

```tsx
// Before (OLD)
import { useRazorpayCheckout } from '@/lib/hooks/useRazorpayCheckout';

// After (NEW)
import { useState } from 'react';
import { CustomCheckoutModal } from '@/components/checkout';
import type { OrderDetails, RazorpaySuccessResponse, RazorpayErrorResponse } from '@/types/checkout';
import { loadRazorpayScript, createRazorpayOrder, verifyPaymentSignature } from '@/lib/utils/razorpayIntegration';
```

### 2. Update State Management

Add checkout modal state to your pricing component:

```tsx
export function PricingPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderDetails | null>(null);

  // ... rest of component
}
```

### 3. Modify Subscription Button Handler

Update your "Subscribe" button click handler:

```tsx
// Before (OLD)
const handleSubscribe = async (planId: string, amount: number) => {
  const { openCheckout } = useRazorpayCheckout();
  await openCheckout({
    amount,
    currency: 'INR',
    name: 'SmartSlate Polaris',
    description: planDetails.description,
  });
};

// After (NEW)
const handleSubscribe = async (
  planId: string,
  tier: string,
  amount: number,
  billingCycle: 'monthly' | 'yearly'
) => {
  // Load Razorpay SDK if not already loaded
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    alert('Failed to load payment gateway. Please refresh and try again.');
    return;
  }

  // Calculate GST (18%)
  const basePrice = amount;
  const gst = Math.round(basePrice * 0.18);
  const totalAmount = basePrice + gst;

  // Prepare order details
  const orderDetails: OrderDetails = {
    planName: `Polaris ${tier}`,
    tier,
    billingCycle,
    basePrice,
    gst,
    totalAmount,
    currency: 'INR',
  };

  setCurrentOrder(orderDetails);
  setIsCheckoutOpen(true);
};
```

### 4. Add Payment Success Handler

```tsx
const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
  try {
    // Verify payment signature on server
    const verification = await verifyPaymentSignature(response);

    if (verification.verified) {
      // Update user subscription in database
      await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          planId: currentOrder?.tier,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: currentOrder?.totalAmount,
        }),
      });

      // Show success notification
      toast.success('Subscription activated successfully!');

      // Redirect to dashboard or success page
      router.push('/dashboard?subscription=success');
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment success handler error:', error);
    toast.error('Payment verification failed. Please contact support.');
  }
};
```

### 5. Add Payment Error Handler

```tsx
const handlePaymentError = (error: RazorpayErrorResponse) => {
  console.error('Payment error:', error);

  // Log to error monitoring service
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error);
  }

  // Show user-friendly error message
  const errorMessages: Record<string, string> = {
    PAYMENT_DECLINED: 'Your payment was declined. Please try another card.',
    INSUFFICIENT_FUNDS: 'Insufficient funds. Please use another payment method.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    DEFAULT: 'Payment failed. Please try again or contact support.',
  };

  const message = errorMessages[error.code] || errorMessages.DEFAULT;
  toast.error(message);
};
```

### 6. Render Custom Checkout Modal

Add the modal component at the end of your page component:

```tsx
export function PricingPage() {
  // ... state and handlers

  return (
    <div>
      {/* Your existing pricing UI */}
      <PricingCards onSubscribe={handleSubscribe} />

      {/* Custom Checkout Modal */}
      {currentOrder && (
        <CustomCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderDetails={currentOrder}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
}
```

---

## Complete Example

Here's a complete example integrating with your existing pricing page:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomCheckoutModal } from '@/components/checkout';
import type {
  OrderDetails,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
} from '@/types/checkout';
import {
  loadRazorpayScript,
  verifyPaymentSignature,
} from '@/lib/utils/razorpayIntegration';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

export function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderDetails | null>(null);

  const handleSubscribe = async (
    tier: string,
    amount: number,
    billingCycle: 'monthly' | 'yearly'
  ) => {
    // Check authentication
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    // Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please refresh and try again.');
      return;
    }

    // Calculate pricing
    const basePrice = amount;
    const gst = Math.round(basePrice * 0.18);
    const totalAmount = basePrice + gst;

    // Create order details
    const orderDetails: OrderDetails = {
      planName: `Polaris ${tier}`,
      tier,
      billingCycle,
      basePrice,
      gst,
      totalAmount,
      currency: 'INR',
    };

    setCurrentOrder(orderDetails);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
    try {
      // Verify signature
      const verification = await verifyPaymentSignature(response);

      if (!verification.verified) {
        throw new Error('Payment verification failed');
      }

      // Activate subscription
      const activationResponse = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          tier: currentOrder?.tier,
          billingCycle: currentOrder?.billingCycle,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: currentOrder?.totalAmount,
        }),
      });

      if (!activationResponse.ok) {
        throw new Error('Failed to activate subscription');
      }

      // Success!
      toast.success('Subscription activated successfully!');
      router.push('/dashboard?subscription=success');
    } catch (error) {
      console.error('Payment success handler error:', error);
      toast.error('Payment verification failed. Please contact support with your payment ID.');
    }
  };

  const handlePaymentError = (error: RazorpayErrorResponse) => {
    console.error('Payment error:', error);

    const errorMessages: Record<string, string> = {
      PAYMENT_DECLINED: 'Payment declined by your bank. Please try another card.',
      INSUFFICIENT_FUNDS: 'Insufficient funds. Please try another payment method.',
      NETWORK_ERROR: 'Network error. Please check your connection.',
      BAD_REQUEST_ERROR: 'Invalid payment details. Please check and try again.',
      GATEWAY_ERROR: 'Payment gateway error. Please try again later.',
      DEFAULT: 'Payment failed. Please try again or contact support.',
    };

    const message = errorMessages[error.code] || errorMessages.DEFAULT;
    toast.error(message);
  };

  return (
    <div className="min-h-screen bg-background-dark py-12 px-4">
      {/* Your existing pricing UI */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-display font-bold text-text-primary text-center mb-12">
          Choose Your Plan
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Navigator Plan */}
          <PricingCard
            tier="Navigator"
            price={999}
            billingCycle="monthly"
            onSubscribe={handleSubscribe}
          />

          {/* Voyager Plan */}
          <PricingCard
            tier="Voyager"
            price={1999}
            billingCycle="monthly"
            onSubscribe={handleSubscribe}
          />

          {/* Crew Plan */}
          <PricingCard
            tier="Crew"
            price={9999}
            billingCycle="monthly"
            onSubscribe={handleSubscribe}
          />
        </div>
      </div>

      {/* Custom Checkout Modal */}
      {currentOrder && (
        <CustomCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderDetails={currentOrder}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
}

// Pricing Card Component
interface PricingCardProps {
  tier: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  onSubscribe: (tier: string, price: number, billingCycle: 'monthly' | 'yearly') => void;
}

function PricingCard({ tier, price, billingCycle, onSubscribe }: PricingCardProps) {
  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-heading font-semibold text-primary-accent">{tier}</h3>
      <div className="text-display font-bold text-text-primary">
        ₹{price.toLocaleString('en-IN')}
        <span className="text-caption text-text-secondary">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
      </div>
      <button
        onClick={() => onSubscribe(tier, price, billingCycle)}
        className="
          w-full min-h-[48px] px-6 py-3 rounded-md
          bg-secondary-accent hover:bg-secondary-accent-dark
          text-white font-semibold
          transition-all duration-200
        "
      >
        Subscribe
      </button>
    </div>
  );
}
```

---

## API Endpoints Required

### 1. Create Order Endpoint

```typescript
// /app/api/payment/create-order/route.ts
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount, currency } = await request.json();

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        platform: 'SmartSlate Polaris',
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

### 2. Verify Payment Endpoint

```typescript
// /app/api/payment/verify/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    return NextResponse.json({ verified: isValid });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Verification failed', verified: false },
      { status: 500 }
    );
  }
}
```

### 3. Activate Subscription Endpoint

```typescript
// /app/api/subscription/activate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId, tier, billingCycle, paymentId, orderId, amount } =
      await request.json();

    const supabase = await createClient();

    // Update user profile with subscription
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tier.toLowerCase(),
        subscription_status: 'active',
        subscription_billing_cycle: billingCycle,
        subscription_start_date: new Date().toISOString(),
        subscription_payment_id: paymentId,
        subscription_order_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // TODO: Send confirmation email
    // TODO: Update analytics

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activate subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
```

---

## Environment Variables

Add these to `/frontend/.env.local`:

```bash
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Enable test mode
NEXT_PUBLIC_PAYMENT_TEST_MODE=true
```

---

## Testing Checklist

- [ ] Custom modal opens when clicking subscribe
- [ ] All payment method tabs render correctly
- [ ] Form validation works (try invalid inputs)
- [ ] Card type detection works (Visa, Mastercard, etc.)
- [ ] UPI verification flow works
- [ ] Netbanking bank selection works
- [ ] Wallet selection works
- [ ] Modal closes on backdrop click
- [ ] Modal closes on Escape key
- [ ] Success state displays correctly
- [ ] Error state displays correctly
- [ ] Mobile responsive (test on phone)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (test with NVDA/JAWS)

---

## Migration Checklist

- [ ] Install dependencies (none required - uses existing)
- [ ] Copy all checkout components to `/components/checkout/`
- [ ] Copy types to `/types/checkout.ts`
- [ ] Copy validation schemas to `/lib/validation/checkoutSchemas.ts`
- [ ] Copy integration utils to `/lib/utils/razorpayIntegration.ts`
- [ ] Update pricing page with new handlers
- [ ] Create API endpoints (create-order, verify, activate)
- [ ] Add environment variables
- [ ] Test in development
- [ ] Test in production (staging first)

---

## Support

For integration issues:
1. Check browser console for errors
2. Verify environment variables are set
3. Test with Razorpay test credentials
4. Review `/components/checkout/README.md`
5. Check `/app/(auth)/checkout-demo/page.tsx` for working example

---

**Ready to integrate!** Follow the steps above to replace the default Razorpay modal with the custom SmartSlate Polaris checkout experience.
