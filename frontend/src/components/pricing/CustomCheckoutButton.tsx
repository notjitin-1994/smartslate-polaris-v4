'use client';

import React, { useState, useCallback } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { openRazorpayCheckout } from '@/lib/services/razorpayCheckoutService';

interface CustomCheckoutButtonProps {
  planId: string;
  tier: string;
  billingCycle: 'monthly' | 'annual';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  buttonText?: string;
  onCheckoutSuccess?: (data: any) => void;
  onCheckoutError?: (error: Error) => void;
}

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
} as const;

export function CustomCheckoutButton({
  planId,
  tier,
  billingCycle,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  buttonText = 'Upgrade Now',
  onCheckoutSuccess,
  onCheckoutError,
}: CustomCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get pricing details (GST already included in the price)
  const tierKey = tier.toLowerCase() as keyof typeof PRICING;
  const totalAmount = PRICING[tierKey]?.[billingCycle === 'annual' ? 'annual' : 'monthly'] || 0;

  // Format tier name for display
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  const handleCheckout = useCallback(async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await openRazorpayCheckout(
        tierKey,
        billingCycle === 'annual' ? 'annual' : 'monthly',
        totalAmount
      );

      // Success callback
      console.log(`Successfully upgraded to ${tierName} plan!`);
      onCheckoutSuccess?.(result);

      // Redirect to dashboard or provided redirect URL
      setTimeout(() => {
        window.location.href = result.redirectUrl || '/';
      }, 1000);
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Payment failed. Please try again.';

      // Only show error if not cancelled by user
      if (!errorMessage.includes('cancelled')) {
        alert(`Payment failed: ${errorMessage}`);
      }

      onCheckoutError?.(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsProcessing(false);
    }
  }, [
    disabled,
    isProcessing,
    tierKey,
    billingCycle,
    totalAmount,
    tierName,
    onCheckoutSuccess,
    onCheckoutError,
  ]);

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-md active:scale-95';

    const variants = {
      primary: 'bg-[rgb(79,70,229)] text-white hover:bg-[rgb(67,56,202)]',
      secondary:
        'bg-[rgba(167,218,219,0.1)] text-[rgb(167,218,219)] hover:bg-[rgba(167,218,219,0.15)]',
      outline:
        'border border-[rgba(167,218,219,0.3)] text-[rgb(167,218,219)] hover:bg-[rgba(167,218,219,0.05)]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    return `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isProcessing}
      className={getButtonStyles()}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {buttonText}
          <ArrowUpRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
