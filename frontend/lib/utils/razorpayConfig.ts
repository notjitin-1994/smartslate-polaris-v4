/**
 * Razorpay Configuration Utility
 * Manages Razorpay configuration and environment validation
 */

interface RazorpayConfig {
  keyId: string;
  isLiveMode: boolean;
  isConfigured: boolean;
  webhookSecret?: string;
}

/**
 * Get Razorpay configuration from environment
 */
export function getRazorpayConfiguration(): RazorpayConfig {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  return {
    keyId,
    isLiveMode: keyId.startsWith('rzp_live_'),
    isConfigured: !!keyId,
    webhookSecret,
  };
}

/**
 * Validate Razorpay configuration for production
 */
export function validateRazorpayConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getRazorpayConfiguration();

  // Check if key is configured
  if (!config.isConfigured) {
    errors.push('Razorpay key ID is not configured');
  }

  // Check if in test mode for production
  if (config.isConfigured && !config.isLiveMode && process.env.NODE_ENV === 'production') {
    warnings.push('Using test mode Razorpay key in production environment');
  }

  // Check webhook secret
  if (!config.webhookSecret && process.env.NODE_ENV === 'production') {
    warnings.push('Webhook secret not configured - webhook verification will fail');
  }

  // Check API secret (server-side only)
  if (typeof window === 'undefined') {
    const apiSecret = process.env.RAZORPAY_KEY_SECRET;
    if (!apiSecret) {
      errors.push('Razorpay API secret is not configured');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get Razorpay script URL
 */
export function getRazorpayScriptUrl(): string {
  return 'https://checkout.razorpay.com/v1/checkout.js';
}

/**
 * Format amount for Razorpay (convert to paise)
 */
export function formatAmountForRazorpay(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Parse amount from Razorpay (convert from paise)
 */
export function parseAmountFromRazorpay(amount: number): number {
  return amount / 100;
}
