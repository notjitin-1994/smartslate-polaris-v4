'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassCard';
import SubscriptionInfo from '@/components/subscription/SubscriptionInfo';
import PaymentHistory from '@/components/subscription/PaymentHistory';
import CancelSubscriptionButton from '@/components/subscription/CancelSubscriptionButton';
import { cn } from '@/lib/utils';
import type { SubscriptionManagementPageProps } from '@/types/subscription';

/**
 * SubscriptionManagementContent
 *
 * Client component for the subscription management interface that handles
 * user interactions and state management.
 */
function SubscriptionManagementContent({
  userProfile,
  subscription,
  isLoading,
  error,
}: SubscriptionManagementPageProps): React.JSX.Element {
  // Mock payment data for now - this will be replaced with real data fetching
  const [mockPayments] = React.useState([
    {
      payment_id: 'pay_mock_1',
      subscription_id: 'sub_mock_1',
      razorpay_payment_id: 'pay_example1234',
      razorpay_order_id: 'order_example1234',
      amount: 3900, // ₹39 in paise
      currency: 'INR',
      status: 'captured' as const,
      payment_method: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
      description: 'Navigator Plan - Monthly',
      invoice_id: 'inv_example1234',
      invoice_url: '#',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [paymentHistoryLoading, setPaymentHistoryLoading] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/settings"
                className="p-2 text-gray-600 transition-colors hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
                <p className="mt-1 text-gray-600">
                  Manage your subscription, payment history, and billing preferences
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="hidden items-center space-x-3 md:flex">
              <Link
                href="/pricing"
                className="text-primary-600 hover:text-primary-700 flex items-center space-x-2 px-4 py-2 transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span>View Plans</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlassCard className="border-red-200 bg-red-50 p-6">
              <div className="flex items-center space-x-3 text-red-600">
                <Shield className="h-5 w-5" />
                <h3 className="font-semibold">Error Loading Subscription Data</h3>
              </div>
              <p className="mt-2 text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                Try Again
              </button>
            </GlassCard>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <GlassCard className="p-6">
                  <div className="animate-pulse">
                    <div className="mb-4 h-8 rounded bg-gray-200"></div>
                    <div className="space-y-3">
                      <div className="h-4 rounded bg-gray-200"></div>
                      <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                      <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </GlassCard>
              </div>
              <div>
                <GlassCard className="p-6">
                  <div className="animate-pulse">
                    <div className="mb-4 h-6 rounded bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-gray-200"></div>
                      <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Subscription Info & Actions */}
            <div className="space-y-6 lg:col-span-2">
              {/* Subscription Information */}
              <SubscriptionInfo subscription={subscription} userProfile={userProfile} />

              {/* Payment History */}
              <PaymentHistory payments={mockPayments} isLoading={paymentHistoryLoading} />
            </div>

            {/* Right Column - Quick Actions & Info */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>

                <div className="space-y-3">
                  {/* Cancel Subscription Button */}
                  <CancelSubscriptionButton
                    subscription={subscription as any} // Type assertion for now
                  />

                  {/* Other Actions */}
                  <Link
                    href="/pricing"
                    className="bg-primary-600 hover:bg-primary-700 flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Change Plan</span>
                  </Link>

                  <button className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50">
                    <CreditCard className="h-4 w-4" />
                    <span>Update Payment Method</span>
                  </button>
                </div>
              </GlassCard>

              {/* Support Card */}
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center space-x-2">
                  <Shield className="text-primary-600 h-5 w-5" />
                  <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                </div>

                <p className="mb-4 text-sm text-gray-600">
                  Have questions about your subscription or billing? Our support team is here to
                  help.
                </p>

                <div className="space-y-2">
                  <a
                    href="mailto:support@polaris.app"
                    className="text-primary-600 hover:text-primary-700 block px-4 py-2 text-sm font-medium"
                  >
                    Email Support
                  </a>
                  <a
                    href="/docs/billing"
                    className="text-primary-600 hover:text-primary-700 block px-4 py-2 text-sm font-medium"
                  >
                    Billing Documentation
                  </a>
                  <a
                    href="/faq"
                    className="text-primary-600 hover:text-primary-700 block px-4 py-2 text-sm font-medium"
                  >
                    FAQ
                  </a>
                </div>
              </GlassCard>

              {/* Billing Summary */}
              {subscription && (
                <GlassCard className="p-6">
                  <div className="mb-4 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Billing Summary</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Plan</span>
                      <span className="font-medium text-gray-900">{subscription.planName}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Cost</span>
                      <span className="font-medium text-gray-900">
                        ₹{(subscription.planAmount / 100).toFixed(0)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next Payment</span>
                      <span className="font-medium text-gray-900">
                        {subscription.nextBillingDate
                          ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <Link
                        href="/billing"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Detailed Billing →
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {/* Mobile Quick Actions */}
        <div className="mt-8 lg:hidden">
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/pricing"
                className="bg-primary-600 hover:bg-primary-700 rounded-lg px-3 py-2 text-center text-sm text-white transition-colors"
              >
                Change Plan
              </Link>

              <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                Update Payment
              </button>

              <CancelSubscriptionButton subscription={subscription as any} />

              <a
                href="mailto:support@smartslate.io"
                className="rounded-lg border border-gray-300 px-3 py-2 text-center text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Get Support
              </a>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default SubscriptionManagementContent;
