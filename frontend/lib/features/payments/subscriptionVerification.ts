/**
 * Subscription Payment Verification System
 *
 * @description Provides robust payment verification for Razorpay subscriptions
 * @version 1.0.0
 * @date 2025-10-30
 *
 * This system ensures that:
 * 1. Users only get access after successful payment verification
 * 2. Subscription status is properly updated after payment completion
 * 3. Frontend shows accurate payment status
 * 4. Industry-standard payment verification workflow
 */

import { getSupabaseBrowserClient } from '../supabase/client';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Payment verification status
 */
export type PaymentVerificationStatus =
  | 'pending' // Payment not yet verified
  | 'processing' // Payment is being processed
  | 'completed' // Payment successfully verified
  | 'failed' // Payment verification failed
  | 'cancelled'; // Payment was cancelled

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
  status: PaymentVerificationStatus;
  subscriptionId?: string;
  paymentId?: string;
  message: string;
  nextBillingDate?: string;
  planDetails?: {
    name: string;
    amount: number;
    currency: string;
  };
}

/**
 * Verification polling options
 */
export interface VerificationPollingOptions {
  subscriptionId: string;
  maxAttempts?: number; // Maximum number of polling attempts
  interval?: number; // Polling interval in milliseconds
  timeout?: number; // Total timeout in milliseconds
  onProgress?: (attempt: number, result: PaymentVerificationResult) => void;
}

// ============================================================================
// Payment Verification Service
// ============================================================================

/**
 * Subscription Payment Verification Service
 *
 * Provides comprehensive payment verification for Razorpay subscriptions
 * with polling, timeout handling, and status updates.
 */
export class SubscriptionPaymentVerifier {
  private supabase = getSupabaseBrowserClient();

  /**
   * Verify payment status immediately after checkout
   */
  async verifyPaymentImmediately(subscriptionId: string): Promise<PaymentVerificationResult> {
    console.log(`[PaymentVerifier] Verifying payment for subscription: ${subscriptionId}`);

    try {
      // Check subscription status via our API
      const response = await fetch('/api/subscriptions/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Verification API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[PaymentVerifier] Initial verification result:`, result);

      return this.formatVerificationResult(result);
    } catch (error) {
      console.error(`[PaymentVerifier] Initial verification failed:`, error);
      return {
        status: 'pending',
        message: 'Payment verification in progress. Please wait...',
      };
    }
  }

  /**
   * Poll for payment completion with timeout
   */
  async pollForPaymentCompletion(
    options: VerificationPollingOptions
  ): Promise<PaymentVerificationResult> {
    const {
      subscriptionId,
      maxAttempts = 30, // Poll for up to 30 attempts (5 minutes)
      interval = 10000, // Poll every 10 seconds
      timeout = 300000, // 5 minute total timeout
      onProgress,
    } = options;

    console.log(`[PaymentVerifier] Starting payment polling for: ${subscriptionId}`);
    console.log(
      `[PaymentVerifier] Max attempts: ${maxAttempts}, interval: ${interval}ms, timeout: ${timeout}ms`
    );

    const startTime = Date.now();
    let lastResult: PaymentVerificationResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.log(`[PaymentVerifier] Polling timeout reached for: ${subscriptionId}`);
        return {
          status: 'failed',
          message: 'Payment verification timed out. Please contact support.',
          subscriptionId,
        };
      }

      try {
        console.log(
          `[PaymentVerifier] Polling attempt ${attempt}/${maxAttempts} for: ${subscriptionId}`
        );

        const result = await this.verifyPaymentImmediately(subscriptionId);
        lastResult = result;

        // Notify progress
        onProgress?.(attempt, result);

        // Check if we have a definitive result
        if (result.status === 'completed') {
          console.log(`[PaymentVerifier] Payment verification completed for: ${subscriptionId}`);
          return result;
        }

        if (result.status === 'failed' || result.status === 'cancelled') {
          console.log(
            `[PaymentVerifier] Payment verification failed for: ${subscriptionId} - ${result.message}`
          );
          return result;
        }

        // Still pending, wait and continue polling
        if (attempt < maxAttempts) {
          console.log(`[PaymentVerifier] Payment still pending, waiting ${interval}ms...`);
          await this.sleep(interval);
        }
      } catch (error) {
        console.error(`[PaymentVerifier] Polling attempt ${attempt} failed:`, error);

        if (attempt === maxAttempts) {
          return {
            status: 'failed',
            message: 'Unable to verify payment status. Please contact support.',
            subscriptionId,
          };
        }

        // Wait before retrying
        await this.sleep(interval);
      }
    }

    // Max attempts reached
    console.log(`[PaymentVerifier] Max polling attempts reached for: ${subscriptionId}`);
    return (
      lastResult || {
        status: 'failed',
        message: 'Payment verification could not be completed. Please contact support.',
        subscriptionId,
      }
    );
  }

  /**
   * Get real-time subscription status
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch(`/api/subscriptions/status?subscriptionId=${subscriptionId}`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      return this.formatVerificationResult(data);
    } catch (error) {
      console.error(`[PaymentVerifier] Status check failed:`, error);
      return {
        status: 'failed',
        message: 'Unable to check subscription status.',
        subscriptionId,
      };
    }
  }

  /**
   * Format verification result from API response
   */
  private formatVerificationResult(data: any): PaymentVerificationResult {
    const status = this.mapApiStatusToVerificationStatus(data.status);

    return {
      status,
      subscriptionId: data.subscriptionId,
      paymentId: data.paymentId,
      message: data.message || this.getDefaultMessage(status),
      nextBillingDate: data.nextBillingDate,
      planDetails: data.planDetails
        ? {
            name: data.planDetails.name,
            amount: data.planDetails.amount,
            currency: data.planDetails.currency,
          }
        : undefined,
    };
  }

  /**
   * Map API status to verification status
   */
  private mapApiStatusToVerificationStatus(apiStatus: string): PaymentVerificationStatus {
    switch (apiStatus) {
      case 'active':
      case 'completed':
        return 'completed';
      case 'authenticated':
      case 'created':
      case 'pending':
        return 'processing';
      case 'cancelled':
        return 'cancelled';
      case 'failed':
      case 'expired':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Get default message for status
   */
  private getDefaultMessage(status: PaymentVerificationStatus): string {
    switch (status) {
      case 'completed':
        return 'Payment verified successfully! Your subscription is now active.';
      case 'processing':
        return 'Payment is being processed. Please wait...';
      case 'failed':
        return 'Payment verification failed. Please try again.';
      case 'cancelled':
        return 'Payment was cancelled.';
      default:
        return 'Payment verification in progress...';
    }
  }

  /**
   * Sleep helper for polling delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// React Hook for Payment Verification
// ============================================================================

/**
 * Hook for payment verification in React components
 */
export function usePaymentVerification() {
  const verifier = new SubscriptionPaymentVerifier();

  return {
    verifyPaymentImmediately: (subscriptionId: string) =>
      verifier.verifyPaymentImmediately(subscriptionId),
    pollForPaymentCompletion: (options: VerificationPollingOptions) =>
      verifier.pollForPaymentCompletion(options),
    getSubscriptionStatus: (subscriptionId: string) =>
      verifier.getSubscriptionStatus(subscriptionId),
  };
}

// ============================================================================
// Export
// ============================================================================

export const paymentVerifier = new SubscriptionPaymentVerifier();

export default SubscriptionPaymentVerifier;
