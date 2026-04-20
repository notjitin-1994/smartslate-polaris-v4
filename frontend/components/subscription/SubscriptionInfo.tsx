'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  ArrowUpCircle,
  Settings,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionInfoProps } from '@/types/subscription';
import {
  formatCurrency,
  formatDate,
  getTierDisplayName,
  getStatusColor,
  getStatusLabel,
} from '@/types/subscription';

/**
 * SubscriptionInfo Component
 *
 * Displays current subscription information including tier, status, billing details,
 * and provides action buttons for managing the subscription.
 */
export function SubscriptionInfo({
  subscription,
  userProfile,
  isLoading = false,
  error = null,
}: SubscriptionInfoProps): React.JSX.Element {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="text-primary-600 h-8 w-8 animate-spin" />
            <p className="text-gray-600">Loading subscription information...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-red-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Error Loading Subscription</h3>
        </div>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  if (!subscription) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <CreditCard className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No Active Subscription</h3>
          <p className="mb-6 text-gray-600">
            You're currently on the free tier. Upgrade to unlock premium features.
          </p>
          <Link
            href="/pricing"
            className="bg-primary-600 hover:bg-primary-700 mx-auto flex items-center space-x-2 rounded-lg px-6 py-3 text-white transition-colors"
          >
            <ArrowUpCircle className="h-4 w-4" />
            <span>Upgrade Now</span>
          </Link>
        </div>
      </motion.div>
    );
  }

  const isCancelled = subscription.isCancelled;
  const statusColor = getStatusColor(subscription.status);
  const statusLabel = getStatusLabel(subscription.status);
  const tierName = getTierDisplayName(subscription.currentTier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="from-primary-600 to-primary-700 bg-gradient-to-r p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-bold">{tierName}</h2>
            <p className="text-primary-100">{subscription.planName}</p>
          </div>
          <div
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium',
              isCancelled
                ? 'border-red-300 bg-red-100 text-red-700'
                : 'border-green-300 bg-green-100 text-green-700'
            )}
          >
            {isCancelled ? 'Cancelled' : statusLabel}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Current Plan Info */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Billing Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <CreditCard className="h-4 w-4" />
              <h3 className="font-semibold">Billing Information</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plan Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(subscription.planAmount, subscription.planCurrency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {subscription.billingCycle}
                </span>
              </div>

              {subscription.remainingCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Remaining Payments</span>
                  <span className="font-semibold text-gray-900">{subscription.remainingCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <h3 className="font-semibold">Status Information</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={cn('rounded border px-2 py-1 text-xs font-medium', statusColor)}>
                  {statusLabel}
                </span>
              </div>

              {subscription.nextBillingDate && !isCancelled && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Billing Date</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(subscription.nextBillingDate)}
                  </span>
                </div>
              )}

              {isCancelled && subscription.accessUntilDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Access Until</span>
                  <span className="font-semibold text-orange-600">
                    {formatDate(subscription.accessUntilDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        {subscription.paymentMethod && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Shield className="h-4 w-4" />
              <h3 className="font-semibold">Payment Method</h3>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {subscription.paymentMethod.brand?.toUpperCase() || 'Card'} ••••
                      {subscription.paymentMethod.last4}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {subscription.paymentMethod.exp_month}/
                      {subscription.paymentMethod.exp_year}
                    </p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning for cancelled subscriptions */}
        {isCancelled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-orange-200 bg-orange-50 p-4"
          >
            <div className="flex items-start space-x-3">
              <Clock className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-900">Subscription Cancelled</h4>
                <p className="mt-1 text-sm text-orange-700">
                  Your subscription has been cancelled.{' '}
                  {subscription.accessUntilDate
                    ? `You will continue to have access until ${formatDate(subscription.accessUntilDate)}.`
                    : 'Your access will end at the next billing cycle.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success for active subscriptions */}
        {!isCancelled && subscription.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-green-200 bg-green-50 p-4"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">Subscription Active</h4>
                <p className="mt-1 text-sm text-green-700">
                  Your subscription is active and all premium features are available.
                  {subscription.nextBillingDate &&
                    ` Next payment will be on ${formatDate(subscription.nextBillingDate)}.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row">
          {!isCancelled && subscription.status === 'active' && (
            <Link
              href="/settings"
              className="flex flex-1 items-center justify-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              <span>Manage Subscription</span>
            </Link>
          )}

          {subscription.currentTier === 'explorer' && (
            <Link
              href="/pricing"
              className="bg-primary-600 hover:bg-primary-700 flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2 text-white transition-colors"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>Upgrade Plan</span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default SubscriptionInfo;
