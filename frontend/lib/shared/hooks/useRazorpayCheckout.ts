/**
 * useRazorpayCheckout Hook
 *
 * @description Custom hook for handling Razorpay checkout process with modal management and callbacks
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This hook provides:
 * - Checkout modal opening and closing
 * - Success/failure callback handling
 * - Integration with Razorpay SDK
 * - Error handling and retry logic
 * - Loading state management
 *
 * @example
 * const { openCheckout, isLoading } = useRazorpayCheckout();
 *
 * // Open checkout for subscription
 * openCheckout({
 *   subscription_id: 'sub_xxx',
 *   onSuccess: (response) => console.log('Payment successful:', response),
 *   onFailure: (error) => console.error('Payment failed:', error)
 * });
 */

import { useCallback, useRef, useState } from 'react';
import { getRazorpayConfig } from '@/lib/config/razorpayConfig';
import type {
  RazorpayCheckoutOptions,
  RazorpaySuccessResponse,
  RazorpayFailureResponse,
  RazorpaySubscription,
} from '@/types/razorpay';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Checkout configuration options
 */
export interface CheckoutOptions {
  /** Order ID for one-time payments */
  order_id?: string;
  /** Subscription ID for recurring payments */
  subscription_id?: string;
  /** Amount in paise (required for one-time payments) */
  amount?: number;
  /** Currency code (default: INR) */
  currency?: string;
  /** Customer name (pre-filled in checkout) */
  name?: string;
  /** Customer email (pre-filled in checkout) */
  email?: string;
  /** Customer contact (pre-filled in checkout) */
  contact?: string;
  /** Custom notes for the transaction */
  notes?: Record<string, string>;
  /** Custom theme colors */
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  /** Callback for successful payment */
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  /** Callback for payment failure */
  onFailure?: (error: RazorpayFailureResponse | Error) => void;
  /** Callback when modal is closed without payment */
  onDismiss?: () => void;
  /** Whether to close modal after success (default: true) */
  redirect?: boolean;
}

/**
 * Checkout state
 */
interface CheckoutState {
  /** Whether checkout modal is open */
  isOpen: boolean;
  /** Whether a checkout operation is in progress */
  isLoading: boolean;
  /** Current error state */
  error: string | null;
  /** Last payment response */
  lastResponse: RazorpaySuccessResponse | null;
}

/**
 * Checkout modal options with callbacks
 */
type ModalCheckoutOptions = RazorpayCheckoutOptions & {
  /** Callback when modal is dismissed */
  ondismiss?: () => void;
  /** Whether to handle close on backdrop click */
  backdropclose?: boolean;
  /** Whether to allow escape key to close */
  escape?: boolean;
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useRazorpayCheckout hook
 *
 * Provides functionality to open Razorpay checkout modal
 *
 * @returns Object with checkout methods and state
 *
 * @example
 * const {
 *   openCheckout,
 *   closeCheckout,
 *   isLoading,
 *   error,
 *   lastResponse,
 *   isOpen
 * } = useRazorpayCheckout();
 */
export function useRazorpayCheckout() {
  const [state, setState] = useState<CheckoutState>({
    isOpen: false,
    isLoading: false,
    error: null,
    lastResponse: null,
  });

  const checkoutRef = useRef<Window['Razorpay'] | null>(null);

  /**
   * Generate default checkout options
   */
  const generateCheckoutOptions = useCallback((options: CheckoutOptions): ModalCheckoutOptions => {
    const config = getRazorpayConfig();

    const baseOptions: ModalCheckoutOptions = {
      key: config.keyId,
      name: config.name || 'SmartSlate',
      description: config.description || 'AI-powered learning platform subscription',
      image: config.image,
      prefill: {
        name: options.name,
        email: options.email,
        contact: options.contact,
      },
      notes: {
        ...config.defaultNotes,
        ...options.notes,
      },
      theme: {
        ...config.theme,
        ...options.theme,
      },
      handler: (response: RazorpaySuccessResponse) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastResponse: response,
          error: null,
        }));

        // Call success callback
        options.onSuccess?.(response);

        // Close modal if not redirecting
        if (!options.redirect) {
          setState((prev) => ({ ...prev, isOpen: false }));
        }
      },
      modal: {
        ondismiss: () => {
          setState((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));

          // Call dismiss callback
          options.onDismiss?.();
        },
        escape: true,
        backdropclose: true,
        animate: true,
        ...(options.theme?.hide_topbar ? { backdropclose: false } : {}),
      },
      callback_url: config.callbackUrl,
      redirect: options.redirect ?? false,
      readonly: {
        email: false,
        contact: false,
        name: false,
      },
    };

    // Add payment or subscription specific options
    if (options.order_id) {
      baseOptions.order_id = options.order_id;
    } else if (options.subscription_id) {
      baseOptions.subscription_id = options.subscription_id;
    } else if (options.amount) {
      baseOptions.amount = options.amount;
      baseOptions.currency = options.currency || 'INR';
    }

    return baseOptions;
  }, []);

  /**
   * Open checkout modal with given options
   */
  const openCheckout = useCallback(
    async (options: CheckoutOptions): Promise<RazorpaySuccessResponse | null> => {
      // Check if Razorpay is available
      if (typeof window === 'undefined' || !window.Razorpay) {
        const error = 'Razorpay not available. Please ensure the script is loaded.';
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
        }));
        options.onFailure?.(new Error(error));
        return null;
      }

      // Check if a checkout is already in progress
      if (state.isLoading) {
        console.warn('[useRazorpayCheckout] Checkout already in progress');
        return null;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        isOpen: true,
      }));

      try {
        // Generate checkout options
        const checkoutOptions = generateCheckoutOptions(options);

        if (!checkoutOptions.key) {
          throw new Error(
            'Razorpay key is not configured. Please check NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable.'
          );
        }

        // Create Razorpay instance
        checkoutRef.current = new window.Razorpay({
          key: checkoutOptions.key,
        });

        // Open checkout modal
        checkoutRef.current.open(checkoutOptions);

        // Return promise that resolves when payment is successful
        return new Promise<RazorpaySuccessResponse>((resolve, reject) => {
          // Override success handler to resolve promise
          const originalHandler = checkoutOptions.handler;
          checkoutOptions.handler = (response: RazorpaySuccessResponse) => {
            originalHandler(response);
            resolve(response);
          };

          // Override dismiss handler to reject promise
          const originalOndismiss = checkoutOptions.modal?.ondismiss;
          checkoutOptions.modal!.ondismiss = () => {
            originalOndismiss?.();
            // Reject only if there was no successful response
            if (!state.lastResponse) {
              reject(new Error('Checkout dismissed by user'));
            }
          };

          // Open checkout with modified handlers
          checkoutRef.current!.open(checkoutOptions);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('[useRazorpayCheckout] Failed to open checkout:', error);

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          isOpen: false,
        }));

        options.onFailure?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    },
    [state.isLoading, state.lastResponse, generateCheckoutOptions]
  );

  /**
   * Close checkout modal
   */
  const closeCheckout = useCallback(() => {
    if (checkoutRef.current && state.isOpen) {
      try {
        // Razorpay doesn't provide a direct close method
        // The modal will close automatically on success/failure/dismiss
        setState((prev) => ({
          ...prev,
          isOpen: false,
          isLoading: false,
        }));
      } catch (error) {
        console.error('[useRazorpayCheckout] Failed to close checkout:', error);
      }
    }
  }, [state.isOpen]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset checkout state
   */
  const reset = useCallback(() => {
    setState({
      isOpen: false,
      isLoading: false,
      error: null,
      lastResponse: null,
    });
  }, []);

  return {
    // Methods
    openCheckout,
    closeCheckout,
    clearError,
    reset,

    // State
    isLoading: state.isLoading,
    error: state.error,
    lastResponse: state.lastResponse,
    isOpen: state.isOpen,

    // Computed
    hasError: !!state.error,
    canCheckout: !state.isLoading && typeof window !== 'undefined' && !!window.Razorpay,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create checkout options for subscription upgrade
 *
 * @param subscriptionId - Razorpay subscription ID
 * @param customerInfo - Customer information
 * @returns Checkout options object
 */
export function createSubscriptionCheckoutOptions(
  subscriptionId: string,
  customerInfo?: {
    name?: string;
    email?: string;
    contact?: string;
  }
): CheckoutOptions {
  return {
    subscription_id: subscriptionId,
    ...customerInfo,
    notes: {
      type: 'subscription_upgrade',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create checkout options for one-time payment
 *
 * @param amount - Amount in paise
 * @param orderId - Order ID (optional)
 * @param customerInfo - Customer information
 * @returns Checkout options object
 */
export function createPaymentCheckoutOptions(
  amount: number,
  orderId?: string,
  customerInfo?: {
    name?: string;
    email?: string;
    contact?: string;
  }
): CheckoutOptions {
  return {
    amount,
    order_id: orderId,
    ...customerInfo,
    notes: {
      type: 'one_time_payment',
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export type { CheckoutOptions, CheckoutState, ModalCheckoutOptions };
export default useRazorpayCheckout;
