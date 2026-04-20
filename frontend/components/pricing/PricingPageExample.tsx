/**
 * Pricing Page Example with Custom Razorpay Modal Integration
 *
 * @description Example implementation showing how to integrate the custom payment modal
 * @version 1.0.0
 * @date 2025-10-30
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/components/providers/UserProvider';
import EnhancedPricingCard from '@/components/pricing/EnhancedPricingCard';
import type { RazorpaySuccessResponse, RazorpayFailureResponse } from '@/types/razorpay';

// Sample plan data
const SAMPLE_PLANS = [
  {
    id: 'explorer',
    name: 'Explorer',
    tagline: 'Perfect for getting started',
    price: 0,
    priceMonthly: 0,
    features: ['2 blueprints per month', 'Basic AI generation', 'PDF export', 'Community support'],
    description: 'Free tier for casual learners',
    limits: {
      blueprints: 2,
      exports: 2,
      support: 'Community',
    },
  },
  {
    id: 'navigator',
    name: 'Navigator',
    tagline: 'For serious learners',
    price: 29,
    priceMonthly: 29,
    features: [
      '25 blueprints per month',
      'Advanced AI generation',
      'PDF & Word export',
      'Priority email support',
      'Custom templates',
      'Progress tracking',
    ],
    badge: 'Most Popular',
    popular: true,
    description: 'Advanced AI-powered learning platform',
    limits: {
      blueprints: 25,
      exports: 25,
      support: 'Email (24h response)',
    },
  },
  {
    id: 'voyager',
    name: 'Voyager',
    tagline: 'Maximum power and flexibility',
    price: 79,
    priceMonthly: 79,
    features: [
      'Unlimited blueprints',
      'Premium AI generation',
      'All export formats',
      'Priority phone support',
      'Advanced analytics',
      'Team collaboration',
      'Custom integrations',
      'API access',
    ],
    description: 'Ultimate learning experience with no limits',
    limits: {
      blueprints: -1, // Unlimited
      exports: -1, // Unlimited
      support: 'Phone (2h response)',
    },
  },
];

interface PricingPageExampleProps {
  billing?: 'monthly' | 'annual';
  onPlanUpgrade?: (planId: string) => void;
}

export function PricingPageExample({
  billing = 'monthly',
  onPlanUpgrade,
}: PricingPageExampleProps): React.JSX.Element {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(billing);
  const { user } = useUser();

  // Calculate annual savings
  const calculateSavings = (monthlyPrice: number): number => {
    const annualPrice = monthlyPrice * 10; // 2 months free
    return monthlyPrice * 12 - annualPrice;
  };

  // Handle successful payment
  const handlePaymentSuccess = (response: RazorpaySuccessResponse) => {
    console.log('Payment successful:', response);

    // Show success notification
    // This could be a toast, notification, or redirect
    if (typeof window !== 'undefined') {
      // Example: Show success message
      const successMessage = document.createElement('div');
      successMessage.className =
        'fixed top-4 right-4 bg-success/20 border-success/30 text-success px-6 py-3 rounded-lg border shadow-lg z-50';
      successMessage.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="font-medium">Payment successful! Your subscription is now active.</span>
        </div>
      `;
      document.body.appendChild(successMessage);

      // Remove after 5 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 5000);
    }

    // Call parent callback
    onPlanUpgrade?.(selectedPlan || '');
  };

  // Handle payment failure
  const handlePaymentFailure = (error: RazorpayFailureResponse | Error) => {
    console.error('Payment failed:', error);

    // Show error notification
    if (typeof window !== 'undefined') {
      const errorMessage = document.createElement('div');
      errorMessage.className =
        'fixed top-4 right-4 bg-error/20 border-error/30 text-error px-6 py-3 rounded-lg border shadow-lg z-50';
      errorMessage.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <span class="font-medium">Payment failed. Please try again.</span>
        </div>
      `;
      document.body.appendChild(errorMessage);

      // Remove after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    }
  };

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="mb-12 flex justify-center">
        <div className="bg-surface/50 inline-flex rounded-2xl border border-neutral-200/20 p-1 backdrop-blur-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-xl px-6 py-2 text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`rounded-xl px-6 py-2 text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'annual'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            Annual
            <span className="bg-success/20 text-success ml-2 rounded-full px-2 py-0.5 text-xs">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
        {SAMPLE_PLANS.map((plan, index) => (
          <EnhancedPricingCard
            key={plan.id}
            plan={plan}
            billing={billingCycle}
            savings={billingCycle === 'annual' ? calculateSavings(plan.price) : undefined}
            isCenter={plan.popular}
            delay={index * 0.1}
            user={{
              name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
              email: user?.email,
              contact: user?.phone,
            }}
            onPlanSelect={handlePlanSelect}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            showTrustIndicators={true}
          />
        ))}
      </div>

      {/* Trust Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-16 text-center"
      >
        <div className="space-y-6">
          <h3 className="text-foreground text-2xl font-bold">
            Trusted by thousands of learners worldwide
          </h3>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-foreground mb-2 text-3xl font-bold">10K+</div>
              <div className="text-text-secondary text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-foreground mb-2 text-3xl font-bold">50K+</div>
              <div className="text-text-secondary text-sm">Blueprints Created</div>
            </div>
            <div className="text-center">
              <div className="text-foreground mb-2 text-3xl font-bold">98%</div>
              <div className="text-text-secondary text-sm">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-foreground mb-2 text-3xl font-bold">24/7</div>
              <div className="text-text-secondary text-sm">Support Available</div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <div className="text-text-secondary flex items-center gap-2 text-sm">
              <svg className="text-success h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              256-bit SSL Encryption
            </div>
            <div className="text-text-secondary flex items-center gap-2 text-sm">
              <svg className="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              PCI DSS Compliant
            </div>
            <div className="text-text-secondary flex items-center gap-2 text-sm">
              <svg className="text-warning h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"
                  clipRule="evenodd"
                />
              </svg>
              GDPR Compliant
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default PricingPageExample;
