/**
 * Checkout Demo Page
 * Demonstration of Custom Checkout Modal
 */

'use client';

import { useState } from 'react';
import { CustomCheckoutModal } from '@/components/checkout';
import type {
  OrderDetails,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
} from '@/types/checkout';
import { CreditCard, Sparkles } from 'lucide-react';

const demoPlans: OrderDetails[] = [
  {
    planName: 'Polaris Navigator',
    tier: 'Navigator',
    billingCycle: 'monthly',
    basePrice: 999,
    gst: 180,
    totalAmount: 1179,
    currency: 'INR',
  },
  {
    planName: 'Polaris Navigator',
    tier: 'Navigator',
    billingCycle: 'yearly',
    basePrice: 9990,
    gst: 1798,
    totalAmount: 11788,
    currency: 'INR',
  },
  {
    planName: 'Polaris Voyager',
    tier: 'Voyager',
    billingCycle: 'monthly',
    basePrice: 1999,
    gst: 360,
    totalAmount: 2359,
    currency: 'INR',
  },
  {
    planName: 'Polaris Crew',
    tier: 'Crew',
    billingCycle: 'monthly',
    basePrice: 9999,
    gst: 1800,
    totalAmount: 11799,
    currency: 'INR',
  },
];

export default function CheckoutDemoPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<OrderDetails>(demoPlans[0]);
  const [paymentResult, setPaymentResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleOpenCheckout = (plan: OrderDetails) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
    setPaymentResult({ type: null, message: '' });
  };

  const handlePaymentSuccess = (response: RazorpaySuccessResponse) => {
    console.log('Payment Success:', response);
    setPaymentResult({
      type: 'success',
      message: `Payment successful! Payment ID: ${response.razorpay_payment_id}`,
    });

    // In production:
    // - Update user subscription in database
    // - Send confirmation email
    // - Redirect to success page
  };

  const handlePaymentError = (error: RazorpayErrorResponse) => {
    console.error('Payment Error:', error);
    setPaymentResult({
      type: 'error',
      message: `Payment failed: ${error.description}`,
    });

    // In production:
    // - Log error to monitoring service
    // - Show user-friendly error message
    // - Offer alternative payment methods
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-background-dark min-h-screen px-4 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="text-primary-accent h-8 w-8" />
            <h1 className="text-display text-text-primary font-bold">Custom Checkout Demo</h1>
          </div>
          <p className="text-body text-text-secondary mx-auto max-w-2xl">
            Experience the premium Smartslate Polaris checkout flow. Select a plan below to test the
            custom checkout modal.
          </p>
        </div>

        {/* Payment Result Message */}
        {paymentResult.type && (
          <div
            className={`glass-card mx-auto max-w-2xl border p-6 ${
              paymentResult.type === 'success'
                ? 'border-success/30 bg-success/5'
                : 'border-error/30 bg-error/5'
            } animate-fade-in-up`}
          >
            <p
              className={`text-body font-medium ${
                paymentResult.type === 'success' ? 'text-success' : 'text-error'
              }`}
            >
              {paymentResult.message}
            </p>
          </div>
        )}

        {/* Demo Plans Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {demoPlans.map((plan, index) => (
            <div
              key={`${plan.tier}-${plan.billingCycle}-${index}`}
              className="glass-card hover-lift space-y-4 p-6"
            >
              {/* Plan Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-heading text-primary-accent font-semibold">
                    {plan.planName}
                  </h3>
                  <span
                    className={`text-caption rounded-md px-3 py-1 font-medium ${
                      plan.billingCycle === 'yearly'
                        ? 'bg-success/10 text-success border-success/20 border'
                        : 'bg-primary-accent/10 text-primary-accent border-primary-accent/20 border'
                    } `}
                  >
                    {plan.billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                  </span>
                </div>
                <p className="text-caption text-text-secondary">
                  AI-Assisted Learning Experience Design
                </p>
              </div>

              {/* Price Display */}
              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-display text-text-primary font-bold">
                    {formatCurrency(plan.totalAmount)}
                  </span>
                  <span className="text-caption text-text-disabled">
                    /{plan.billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                <div className="text-small text-text-secondary">
                  Base: {formatCurrency(plan.basePrice)} + GST: {formatCurrency(plan.gst)}
                </div>
              </div>

              {/* Try Checkout Button */}
              <button
                onClick={() => handleOpenCheckout(plan)}
                className="bg-secondary-accent hover:bg-secondary-accent-dark focus-visible:ring-secondary-accent/50 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl focus-visible:ring-2 focus-visible:outline-none"
              >
                <CreditCard className="h-5 w-5" />
                <span>Try Checkout</span>
              </button>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="glass-card mx-auto max-w-4xl space-y-4 p-6">
          <h3 className="text-heading text-text-primary font-semibold">Checkout Features</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ul className="text-body text-text-secondary space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Premium glassmorphism design</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Multiple payment methods (Card, UPI, Netbanking, Wallets)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Real-time form validation with Zod</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Card type detection (Visa, Mastercard, Amex, RuPay)</span>
              </li>
            </ul>
            <ul className="text-body text-text-secondary space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Touch-friendly 44px+ interactive elements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>WCAG AA accessible (keyboard nav, ARIA labels)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Mobile responsive (320px → 2560px+)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-accent mt-1">✓</span>
                <span>Smooth animations with reduced motion support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Integration Note */}
        <div className="glass-card border-primary-accent/20 bg-primary-accent/5 mx-auto max-w-4xl border p-6">
          <h3 className="text-body text-primary-accent mb-2 font-semibold">Development Note</h3>
          <p className="text-caption text-text-secondary">
            This is a demo page with mock payment processing. In production, integrate with Razorpay
            API endpoints to handle real payments. See{' '}
            <code className="text-primary-accent rounded bg-white/10 px-2 py-1">
              /components/checkout/README.md
            </code>{' '}
            for integration instructions.
          </p>
        </div>
      </div>

      {/* Custom Checkout Modal */}
      <CustomCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        orderDetails={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
}
