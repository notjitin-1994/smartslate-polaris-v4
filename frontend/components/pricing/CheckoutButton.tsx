/**
 * Checkout Button Component
 *
 * @description Reusable checkout button component with loading states and error handling for Razorpay integration
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This component provides:
 * - Loading states and button disable during processing
 * - Integration with create-subscription API
 * - Razorpay modal opening and payment handling
 * - Success/failure callback handling
 * - Comprehensive error handling with user-friendly messages
 * - Integration with pricing page components
 *
 * @example
 * <CheckoutButton
 *   planId="navigator"
 *   tier="Navigator"
 *   disabled={false}
 *   billingCycle="monthly"
 * />
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRazorpayCheckout } from '@/lib/hooks/useRazorpayCheckout';
import { classifyRazorpayError, getUserFriendlyMessage } from '@/lib/razorpay/errorHandling';
import { useToast } from '@/src/components/ui/Toast';
import { getPlanPrice } from '@/lib/config/razorpayPlans';
import {
  usePaymentVerification,
  type PaymentVerificationResult,
} from '@/lib/payment/subscriptionVerification';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Checkout button props
 */
interface CheckoutButtonProps {
  /** Plan ID for the subscription (e.g., 'navigator', 'voyager') */
  planId: string;
  /** Plan tier name for display (e.g., 'Navigator', 'Voyager') */
  tier: string;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Billing cycle ('monthly' or 'yearly') */
  billingCycle?: 'monthly' | 'yearly';
  /** Custom button text */
  buttonText?: string;
  /** Custom CSS className */
  className?: string;
  /** Custom styling variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading spinner */
  showSpinner?: boolean;
  /** Callback when checkout starts */
  onCheckoutStart?: () => void;
  /** Callback when checkout succeeds */
  onCheckoutSuccess?: (response: any) => void;
  /** Callback when checkout fails */
  onCheckoutError?: (error: Error) => void;
}

/**
 * Component state interface
 */
interface CheckoutButtonState {
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
  isVerifyingPayment: boolean;
  paymentVerificationResult: PaymentVerificationResult | null;
}

// ============================================================================
// Checkout Button Component
// ============================================================================

/**
 * CheckoutButton component
 *
 * Provides a reusable button for initiating Razorpay checkout process
 * with loading states, error handling, and success/failure callbacks.
 *
 * @param props - CheckoutButton props
 * @returns JSX element
 */
export function CheckoutButton({
  planId,
  tier,
  disabled = false,
  billingCycle = 'monthly',
  buttonText,
  className = '',
  variant = 'primary',
  size = 'md',
  showSpinner = true,
  onCheckoutStart,
  onCheckoutSuccess,
  onCheckoutError,
}: CheckoutButtonProps): React.JSX.Element {
  // State management
  const [state, setState] = React.useState<CheckoutButtonState>({
    isLoading: false,
    error: null,
    isProcessing: false,
    isVerifyingPayment: false,
    paymentVerificationResult: null,
  });

  // Razorpay checkout hooks
  const { openCheckout, isLoading: isRazorpayLoading } = useRazorpayCheckout();

  // Payment verification hook
  const { pollForPaymentCompletion } = usePaymentVerification();

  // Toast notifications
  const { showError, showSuccess } = useToast();

  // Check if payments are enabled
  const paymentsEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true';

  // Router for navigation
  const router = useRouter();

  /**
   * Generate default button text based on state
   */
  const getButtonText = (): string => {
    if (buttonText) return buttonText;

    if (state.isVerifyingPayment) return 'Verifying Payment...';
    if (state.isProcessing) return 'Processing...';
    if (state.isLoading) return 'Loading...';

    return billingCycle === 'yearly' ? 'Upgrade Yearly' : 'Upgrade Monthly';
  };

  /**
   * Handle checkout button click
   */
  const handleCheckout = async (): Promise<void> => {
    // Prevent multiple simultaneous checkouts
    if (state.isLoading || state.isProcessing || disabled) {
      return;
    }

    // Check if payments are enabled
    if (!paymentsEnabled) {
      showError('Payments are currently disabled', 'Contact support for assistance');
      return;
    }

    // Check if user is authenticated (prevent loading state stuck issue)
    // This is a quick client-side check to avoid API call when not authenticated
    if (typeof window !== 'undefined') {
      // Quick check for auth cookies or session
      const hasAuthCookie = document.cookie.includes('sb-');
      if (!hasAuthCookie) {
        showError('Please sign in to upgrade your subscription', 'Authentication required');
        return;
      }
    }

    // Clear previous errors
    setState((prev) => ({ ...prev, error: null, isLoading: true }));

    try {
      // Notify parent component that checkout is starting
      onCheckoutStart?.();

      // Call create-subscription API to get subscription details
      const response = await fetch('/api/subscriptions/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tier, // FIXED: Use the actual tier prop, not planId
          billingCycle: billingCycle,
          metadata: {
            source: 'pricing_page',
            planName: tier,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const subscriptionData = await response.json();

      // DEBUG: Log what we received from API
      console.log('[CheckoutButton DEBUG] API Response (ENHANCED):', {
        success: subscriptionData.success,
        fullResponse: subscriptionData,
        dataObject: subscriptionData.data,
        subscriptionObject: subscriptionData.data?.subscription,
        extractedSubscriptionId:
          subscriptionData.data?.subscription?.subscriptionId ||
          subscriptionData.data?.subscriptionId ||
          subscriptionData.data?.razorpaySubscriptionId,
        extractedPlanAmount:
          subscriptionData.data?.subscription?.planAmount || subscriptionData.data?.planAmount,
        planAmountInRupees: subscriptionData.data?.subscription?.planAmount
          ? subscriptionData.data.subscription.planAmount / 100
          : subscriptionData.data?.planAmount
            ? subscriptionData.data.planAmount / 100
            : 'N/A',
        requestedTier: planId,
        actualTier: tier,
        billingCycle: billingCycle,
        customerEmail: subscriptionData.data?.subscription?.customerEmail,
        customerName: subscriptionData.data?.subscription?.customerName,
      });

      if (!subscriptionData.success) {
        throw new Error(subscriptionData.error?.message || 'Failed to create subscription');
      }

      setState((prev) => ({ ...prev, isLoading: false, isProcessing: true }));

      // Calculate price for checkout
      const checkoutPrice = subscriptionData.data.planAmount
        ? subscriptionData.data.planAmount / 100
        : getPlanPrice(tier as any, billingCycle) / 100; // FIXED: Use tier, not planId

      // DEBUG: Log what we're passing to Razorpay (FIXED)
      const subscriptionIdToUse =
        subscriptionData.data.subscription?.subscriptionId || subscriptionData.data.subscriptionId;
      console.log('[CheckoutButton DEBUG] Passing to Razorpay checkout (FIXED):', {
        subscription_id: subscriptionIdToUse, // Fixed parameter name
        actualSubscriptionId: subscriptionIdToUse,
        planAmountFromAPI:
          subscriptionData.data.subscription?.planAmount || subscriptionData.data.planAmount,
        planAmountFromAPIRupees:
          (subscriptionData.data.subscription?.planAmount || subscriptionData.data.planAmount) /
          100,
        tier: tier,
        billingCycle: billingCycle,
        willShowCorrectAmount: 'YES - subscription already has the price configured',
      });

      // Open Razorpay checkout modal with correct parameters
      await openCheckout({
        subscription_id:
          subscriptionData.data.subscription?.subscriptionId ||
          subscriptionData.data.subscriptionId, // Fixed: Using correct underscore format and field name
        // Removed plan object - not needed for subscription checkout
        tier: tier, // Pass tier for dynamic popup text
        billingCycle: billingCycle, // Pass billing cycle for dynamic popup text
        name:
          subscriptionData.data.subscription?.customerName ||
          subscriptionData.data.customerName ||
          undefined,
        email:
          subscriptionData.data.subscription?.customerEmail ||
          subscriptionData.data.customerEmail ||
          undefined,
        contact: undefined, // Add if you have customer contact
        notes: {
          type: 'subscription_upgrade',
          tier: tier,
          billingCycle: billingCycle,
          planName: tier,
          timestamp: new Date().toISOString(),
        },
        onSuccess: async (response) => {
          console.log(
            '[CheckoutButton] Razorpay checkout completed, starting payment verification:',
            response
          );

          // Start payment verification immediately
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            isVerifyingPayment: true,
            error: null,
          }));

          showSuccess('Payment submitted!', 'Verifying your payment... Please wait.');

          try {
            // Get the subscription ID from the response
            const subscriptionId =
              response.razorpay_subscription_id ||
              subscriptionData.data.subscription?.subscriptionId ||
              subscriptionData.data.subscriptionId;

            if (!subscriptionId) {
              throw new Error('No subscription ID found in payment response');
            }

            console.log(
              '[CheckoutButton] Starting payment verification polling for:',
              subscriptionId
            );

            // Poll for payment completion
            const verificationResult = await pollForPaymentCompletion({
              subscriptionId,
              maxAttempts: 30, // Poll for up to 5 minutes
              interval: 10000, // Check every 10 seconds
              timeout: 300000, // 5 minute total timeout
              onProgress: (attempt, result) => {
                console.log(`[CheckoutButton] Verification attempt ${attempt}:`, result);

                // Update progress message
                if (attempt % 3 === 0) {
                  // Show progress every 3 attempts (30 seconds)
                  showSuccess(
                    'Payment verification in progress...',
                    `Checking payment status... (attempt ${attempt}/30)`
                  );
                }
              },
            });

            console.log('[CheckoutButton] Payment verification result:', verificationResult);

            // Update state with verification result
            setState((prev) => ({
              ...prev,
              isVerifyingPayment: false,
              paymentVerificationResult: verificationResult,
            }));

            // Handle verification result
            if (verificationResult.status === 'completed') {
              showSuccess(
                'Payment verified successfully!',
                `Your ${tier} subscription is now active! Redirecting to dashboard...`
              );

              // Notify parent component of successful payment
              onCheckoutSuccess?.({
                ...response,
                verificationResult,
              });

              // Redirect to dashboard after successful verification
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } else if (
              verificationResult.status === 'failed' ||
              verificationResult.status === 'cancelled'
            ) {
              // Payment failed or was cancelled
              setState((prev) => ({
                ...prev,
                error: verificationResult.message,
              }));

              showError('Payment verification failed', verificationResult.message);

              // Notify parent component of failure
              onCheckoutError?.(new Error(verificationResult.message));
            } else {
              // Still pending (shouldn't happen with polling timeout)
              setState((prev) => ({
                ...prev,
                error: 'Payment verification timed out. Please contact support.',
              }));

              showError(
                'Verification timeout',
                'Payment verification timed out. Please contact support for assistance.'
              );

              onCheckoutError?.(new Error('Payment verification timed out'));
            }
          } catch (verificationError: any) {
            console.error('[CheckoutButton] Payment verification failed:', verificationError);

            setState((prev) => ({
              ...prev,
              isVerifyingPayment: false,
              error: verificationError.message || 'Payment verification failed',
            }));

            showError(
              'Payment verification failed',
              verificationError.message ||
                'Unable to verify payment status. Please contact support.'
            );

            onCheckoutError?.(verificationError);
          }
        },
        onFailure: (error) => {
          console.log('[CheckoutButton] Payment failed:', error);
          // Handle payment failure
          setState((prev) => ({
            ...prev,
            isProcessing: false,
            error: error.message || 'Payment failed',
          }));

          showError('Payment failed', error.message || 'Please try again or contact support');

          // Notify parent component of error
          onCheckoutError?.(
            error instanceof Error ? error : new Error(error.message || 'Payment failed')
          );
        },
      });
    } catch (error) {
      // Handle checkout error
      console.error('[CheckoutButton] Checkout failed:', error);

      // Always ensure loading states are cleared
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isProcessing: false,
        isVerifyingPayment: false,
      }));

      // Handle different error types
      if (error instanceof Error) {
        const classifiedError = classifyRazorpayError(error);
        const userMessage = getUserFriendlyMessage(classifiedError);

        setState((prev) => ({
          ...prev,
          error: userMessage,
        }));

        // Show error toast notification
        showError(userMessage, 'Please try again or contact support if the issue persists');

        // Notify parent component of error
        onCheckoutError?.(classifiedError);
      } else {
        // Handle non-Error objects
        const fallbackMessage = 'Payment failed. Please try again.';
        setState((prev) => ({
          ...prev,
          error: fallbackMessage,
        }));
        showError(fallbackMessage, 'Please try again or contact support.');
        onCheckoutError?.(new Error(fallbackMessage));
      }
    }
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setState((prev) => ({ ...prev, error: null }));
  };

  /**
   * Get button CSS classes based on variant and state
   */
  const getButtonClasses = (): string => {
    const baseClasses =
      'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[40px]',
      md: 'px-6 py-3 text-sm min-h-[48px]',
      lg: 'px-8 py-4 text-base min-h-[56px]',
    };

    const variantClasses = {
      primary:
        'bg-[rgb(79,70,229)] text-white hover:bg-[rgb(67,56,202)] focus-visible:ring-[rgb(79,70,229)]/50 shadow-xl hover:shadow-2xl',
      secondary:
        'from-surface to-surface/90 text-foreground hover:from-surface/90 hover:to-surface/80 border border-neutral-200/40 bg-gradient-to-r shadow-md hover:border-neutral-300/60 hover:shadow-lg focus-visible:ring-neutral-400/50',
      outline:
        'border border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent hover:shadow-lg focus-visible:ring-primary/50',
    };

    const stateClasses =
      state.isLoading || state.isProcessing || state.isVerifyingPayment
        ? 'cursor-wait opacity-90'
        : 'hover:scale-[1.02] active:scale-[0.98]';

    return [baseClasses, sizeClasses[size], variantClasses[variant], stateClasses, className]
      .filter(Boolean)
      .join(' ');
  };

  /**
   * Generate button content with spinner
   */
  const renderButtonContent = (): React.ReactNode => {
    const showLoader =
      showSpinner &&
      (state.isLoading || state.isProcessing || state.isVerifyingPayment || isRazorpayLoading);

    return (
      <>
        <span>{getButtonText()}</span>

        {showLoader && <Loader2 className="h-4 w-4 animate-spin" />}

        {!showLoader && !state.isLoading && !state.isProcessing && !state.isVerifyingPayment && (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </>
    );
  };

  return (
    <>
      <div className="relative">
        {/* Error Display */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          >
            <div className="flex items-center justify-between">
              <span>{state.error}</span>
              <button
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                aria-label="Clear error"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Checkout Button */}
        <motion.button
          onClick={handleCheckout}
          disabled={
            disabled ||
            state.isLoading ||
            state.isProcessing ||
            state.isVerifyingPayment ||
            isRazorpayLoading ||
            !paymentsEnabled
          }
          className={getButtonClasses()}
          whileHover={{
            scale:
              state.isLoading ||
              state.isProcessing ||
              state.isVerifyingPayment ||
              disabled ||
              !paymentsEnabled
                ? 1
                : 1.02,
            transition: { duration: 0.2 },
          }}
          whileTap={{
            scale:
              state.isLoading ||
              state.isProcessing ||
              state.isVerifyingPayment ||
              disabled ||
              !paymentsEnabled
                ? 1
                : 0.98,
            transition: { duration: 0.1 },
          }}
          aria-label={`Upgrade to ${tier} plan (${billingCycle})`}
        >
          {renderButtonContent()}
        </motion.button>
      </div>
    </>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CheckoutButton;
export type { CheckoutButtonProps };
export type { CheckoutButtonState };
