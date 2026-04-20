/**
 * Razorpay Error Handling Utilities
 *
 * @description Comprehensive error handling for Razorpay integration with edge cases and recovery mechanisms
 * @version 1.0.0
 @date 2025-10-29
 *
 * This module provides:
 * - Error classification and categorization
 * - User-friendly error messages
 * - Recovery strategies for common failures
 * - Ad blocker detection and handling
 * - Network error handling
 * - Script loading error management
 *
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/
 */

// ============================================================================
// Error Types and Classes
// ============================================================================

/**
 * Base Razorpay error class
 */
export abstract class RazorpayError extends Error {
  abstract readonly code: string;
  abstract readonly category:
    | 'script'
    | 'network'
    | 'validation'
    | 'payment'
    | 'configuration'
    | 'unknown';
  abstract readonly userMessage: string;
  abstract readonly recoverable: boolean;
  abstract readonly suggestedAction: string;

  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      userMessage: this.userMessage,
      recoverable: this.recoverable,
      suggestedAction: this.suggestedAction,
      context: this.context,
    };
  }
}

/**
 * Script loading errors
 */
export class RazorpayScriptError extends RazorpayError {
  readonly code = 'SCRIPT_LOAD_ERROR';
  readonly category = 'script';
  readonly userMessage = 'Unable to load payment system. Please check your internet connection.';
  readonly recoverable = true;
  readonly suggestedAction = 'Try refreshing the page or check your ad blocker settings.';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Network connectivity errors
 */
export class RazorpayNetworkError extends RazorpayError {
  readonly code = 'NETWORK_ERROR';
  readonly category = 'network';
  readonly userMessage =
    'Network connection issue. Please check your internet connection and try again.';
  readonly recoverable = true;
  readonly suggestedAction = 'Check your internet connection and try again.';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Configuration errors
 */
export class RazorpayConfigurationError extends RazorpayError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly category = 'configuration';
  readonly userMessage =
    'Payment system configuration issue. Please contact support if this persists.';
  readonly recoverable = false;
  readonly suggestedAction = 'Contact support or try again later.';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Validation errors
 */
export class RazorpayValidationError extends RazorpayError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'validation';
  readonly userMessage =
    'Invalid payment information provided. Please check your details and try again.';
  readonly recoverable = true;
  readonly suggestedAction = 'Verify all payment details are correct and try again.';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Payment processing errors
 */
export class RazorpayPaymentError extends RazorpayError {
  readonly code = 'PAYMENT_ERROR';
  readonly category = 'payment';
  readonly userMessage =
    'Payment processing failed. Please try again or use a different payment method.';
  readonly recoverable = true;
  readonly suggestedAction = 'Check your payment details or try a different payment method.';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Checkout modal errors
 */
export class RazorpayCheckoutError extends RazorpayError {
  readonly code = 'CHECKOUT_ERROR';
  readonly category = 'unknown';
  readonly userMessage = 'Payment checkout encountered an issue. Please try again.';
  readonly recoverable = true;
  readonly suggestedAction = 'Refresh the page and try the payment again.';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

// ============================================================================
// Error Detection and Classification
// ============================================================================

/**
 * Check if Razorpay script is blocked by ad blocker
 */
export function isAdBlockerDetected(): boolean {
  try {
    // Check if common ad blocker indicators are present
    const adBlockerIndicators = [
      // Check for blocked elements
      () => {
        const testElement = document.createElement('div');
        testElement.innerHTML = '&nbsp;';
        testElement.style.cssText = 'position:absolute;top:-9999px;';
        document.body.appendChild(testElement);
        const isBlocked = testElement.offsetHeight === 0;
        document.body.removeChild(testElement);
        return isBlocked;
      },
      // Check for blocked Razorpay script
      () => {
        return (
          !window.Razorpay &&
          !document.querySelector('script[src*="razorpay"]') &&
          !document.querySelector('script[src*="checkout"]')
        );
      },
      // Check for ad blocker patterns
      () => {
        return (
          !!document.querySelector('[style*="display: none"][style*="important"]') ||
          !!document.querySelector('.adblocker-detected')
        );
      },
    ];

    return adBlockerIndicators.some((check) => {
      try {
        return check();
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Detect if running in a browser environment that doesn't support Razorpay
 */
export function isUnsupportedBrowser(): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side rendering
  }

  try {
    // Check for incompatible browsers
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for very old browsers
    const oldBrowserPatterns = [
      /msie\s*([0-9]+)/.exec(userAgent), // Internet Explorer
      /trident\/.*rv:([0-9]+).*gecko/.exec(userAgent), // Old IE
      /firefox\/([0-9]+).*\s+mobile/.exec(userAgent), // Old Firefox Mobile
      /android\s+([0-9]+).*\s+version\/([0-9]+).*\s+applewebkit/.exec(userAgent), // Old Android
    ];

    // Check for browser versions that might have issues
    const majorVersion = oldBrowserPatterns.find((match) => match && parseInt(match[1]) < 60);

    if (majorVersion) {
      return true;
    }

    // Check for headless browsers or automated tools
    const headlessPatterns = [/headless/i, /bot/i, /crawler/i, /spider/i, /scraper/i];

    return headlessPatterns.some((pattern) => pattern.test(userAgent));
  } catch {
    return false;
  }
}

/**
 * Detect if network connectivity issues exist
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const networkErrorPatterns = [
    /network error/i,
    /fetch error/i,
    /failed to fetch/i,
    /networkaccess denied/i,
    /connection refused/i,
    /timeout/i,
    /offline/i,
    /cors/i,
    /xhr error/i,
  ];

  const errorMessage = error?.message || error?.toString() || '';
  return networkErrorPatterns.some((pattern) => pattern.test(errorMessage));
}

/**
 * Classify Razorpay error from error object
 */
export function classifyRazorpayError(error: any): RazorpayError {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorContext = error?.context || {};

  // Script loading errors
  if (errorMessage.includes('Razorpay') && errorMessage.includes('not defined')) {
    return new RazorpayScriptError('Razorpay script not loaded', errorContext);
  }

  if (errorMessage.includes('script') && errorMessage.includes('load')) {
    return new RazorpayScriptError('Failed to load Razorpay script', errorContext);
  }

  // Network errors
  if (isNetworkError(error)) {
    return new RazorpayNetworkError('Network connectivity issue', errorContext);
  }

  // Configuration errors
  if (errorMessage.includes('key') && errorMessage.includes('invalid')) {
    return new RazorpayConfigurationError('Invalid Razorpay configuration', errorContext);
  }

  // Payment processing errors
  if (errorMessage.includes('payment') || errorMessage.includes('checkout')) {
    return new RazorpayPaymentError('Payment processing failed', errorContext);
  }

  // Validation errors
  if (errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return new RazorpayValidationError('Invalid payment details', errorContext);
  }

  // Default to checkout error
  return new RazorpayCheckoutError(errorMessage, errorContext);
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Attempt to recover from script loading error
 */
export async function attemptScriptRecovery(): Promise<boolean> {
  try {
    // Wait a bit and check if script loads
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (typeof window !== 'undefined' && window.Razorpay) {
      return true;
    }

    // Try to manually load the script
    if (typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(error: Error | RazorpayError): string {
  if (error instanceof RazorpayError) {
    return error.userMessage;
  }

  // Handle common JavaScript errors
  if (error.name === 'TypeError' && error.message.includes('Razorpay')) {
    return 'Payment system is still loading. Please wait a moment and try again.';
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  // Default message
  return 'An error occurred. Please try again or contact support if the issue persists.';
}

/**
 * Get suggested action for error recovery
 */
export function getSuggestedAction(error: Error | RazorpayError): string {
  if (error instanceof RazorpayError) {
    return error.suggestedAction;
  }

  if (isAdBlockerDetected()) {
    return 'Please disable your ad blocker and refresh the page to continue.';
  }

  if (isNetworkError(error)) {
    return 'Check your internet connection and try again.';
  }

  return 'Please refresh the page and try again. If the issue persists, contact support.';
}

/**
 * Check if error is recoverable
 */
export function isRecoverable(error: Error | RazorpayError): boolean {
  if (error instanceof RazorpayError) {
    return error.recoverable;
  }

  // Network errors are generally recoverable
  if (isNetworkError(error)) {
    return true;
  }

  // Ad blocker related errors are recoverable
  if (isAdBlockerDetected()) {
    return true;
  }

  return false;
}

// ============================================================================
// Error Logging and Monitoring
// ============================================================================

/**
 * Log error with context for debugging
 */
export function logError(
  error: Error | RazorpayError,
  additionalContext?: Record<string, any>
): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    error:
      error instanceof RazorpayError
        ? error.toJSON()
        : {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
    context: additionalContext,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    isAdBlockerDetected: isAdBlockerDetected(),
    isUnsupportedBrowser: isUnsupportedBrowser(),
  };

  console.error('[RazorpayError]', errorData);
}

/**
 * Create error report for support
 */
export function createErrorReport(error: Error | RazorpayError): {
  timestamp: string;
  error: any;
  context: Record<string, any>;
  userAgent: string;
  url: string;
  isAdBlockerDetected: boolean;
  isUnsupportedBrowser: boolean;
  systemInfo: {
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
  };
} {
  return {
    timestamp: new Date().toISOString(),
    error:
      error instanceof RazorpayError
        ? error.toJSON()
        : {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
    context: error instanceof Error ? (error as any).context : {},
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    isAdBlockerDetected: isAdBlockerDetected(),
    isUnsupportedBrowser: isUnsupportedBrowser(),
    systemInfo: {
      platform: typeof window !== 'undefined' ? window.navigator.platform : 'N/A',
      language: typeof window !== 'undefined' ? window.navigator.language : 'N/A',
      cookieEnabled: typeof window !== 'undefined' ? window.navigator.cookieEnabled : false,
      onLine: typeof window !== 'undefined' ? window.navigator.onLine : false,
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  classifyRazorpayError,
  isAdBlockerDetected,
  isUnsupportedBrowser,
  isNetworkError,
  isRecoverable,
  getUserFriendlyMessage,
  getSuggestedAction,
  attemptScriptRecovery,
  logError,
  createErrorReport,
};
