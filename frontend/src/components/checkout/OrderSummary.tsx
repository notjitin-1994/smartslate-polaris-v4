/**
 * Order Summary Component
 * Displays plan details and price breakdown
 */

'use client';

import type { OrderDetails } from '@/types/checkout';

interface OrderSummaryProps {
  orderDetails: OrderDetails;
}

export function OrderSummary({ orderDetails }: OrderSummaryProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="glass-card space-y-4 p-6">
      {/* Plan header */}
      <div className="space-y-1">
        <h3 className="text-heading text-primary-accent font-semibold">
          Polaris {orderDetails.tier}
        </h3>
        <p className="text-caption text-text-secondary">
          {orderDetails.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Plan
        </p>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <div className="text-body flex items-center justify-between">
          <span className="text-text-secondary">Base Price</span>
          <span className="text-text-primary font-medium">
            {formatCurrency(orderDetails.basePrice)}
          </span>
        </div>

        <div className="text-body flex items-center justify-between">
          <span className="text-text-secondary">GST (18%)</span>
          <span className="text-text-primary font-medium">{formatCurrency(orderDetails.gst)}</span>
        </div>

        {/* Total */}
        <div className="text-heading flex items-center justify-between border-t border-white/10 pt-2 font-semibold">
          <span className="text-text-primary">Total Amount</span>
          <span className="text-primary-accent">{formatCurrency(orderDetails.totalAmount)}</span>
        </div>
      </div>

      {/* Billing cycle badge */}
      <div className="pt-2">
        <div className="bg-primary-accent/10 border-primary-accent/20 inline-flex items-center gap-2 rounded-md border px-3 py-1.5">
          <div className="bg-primary-accent h-2 w-2 animate-pulse rounded-full" />
          <span className="text-caption text-primary-accent font-medium">
            {orderDetails.billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
          </span>
        </div>
      </div>
    </div>
  );
}
