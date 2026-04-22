/**
 * Razorpay Cryptographic Utilities
 *
 * @description Secure HMAC SHA256 signature generation and verification for Razorpay webhooks
 * @version 1.0.0
 * @date 2025-10-29
 *
 * **SECURITY WARNING**:
 * - This file contains sensitive cryptographic operations
 * - RAZORPAY_KEY_SECRET must NEVER be exposed to client-side code
 * - Use only in server-side API routes and server components
 *
 * @see https://razorpay.com/docs/webhooks/#verifying-webhook-signatures
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

import { createHash, createHmac } from 'crypto';

// ============================================================================
// Types
// ============================================================================

/**
 * Webhook event payload from Razorpay
 */
export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id?: string;
        invoice_id?: string;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status?: string;
        captured: boolean;
        description: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
        fee: number;
        tax: number;
        error_code?: string;
        error_description?: string;
        created_at: number;
      };
    };
    subscription?: {
      entity: {
        id: string;
        status: string;
        current_start: number;
        current_end: number;
        ended_at?: number;
        start_at: number;
        end_at: number;
        created_at: number;
        customer_id: string;
        plan_id: string;
      };
    };
    [key: string]: any;
  };
}

/**
 * Payment verification request from client
 */
export interface PaymentVerificationRequest {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  valid: boolean;
  error?: string;
  details?: {
    expectedSignature?: string;
    receivedSignature?: string;
    payloadHash?: string;
  };
}

// ============================================================================
// HMAC SHA256 Signature Implementation
// ============================================================================

/**
 * Generate HMAC SHA256 signature for Razorpay webhook or payment verification
 *
 * @param payload - The payload to sign (string or object)
 * @param secret - The Razorpay webhook secret
 * @returns Hex-encoded HMAC SHA256 signature
 *
 * @example
 * const payload = 'razorpay_payment_id|razorpay_subscription_id';
 * const signature = generateSignature(payload, process.env.RAZORPAY_KEY_SECRET!);
 */
export function generateSignature(payload: string | object, secret: string): string {
  if (!payload || !secret) {
    throw new Error('Both payload and secret are required for signature generation');
  }

  try {
    // Convert payload to string if it's an object
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Create HMAC SHA256 hash
    const hmac = createHmac('sha256', secret);
    hmac.update(payloadString, 'utf8');

    // Return hex-encoded signature
    return hmac.digest('hex');
  } catch (error) {
    throw new Error(
      `Failed to generate HMAC signature: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify HMAC SHA256 signature from Razorpay
 *
 * @param payload - The original payload that was signed
 * @param receivedSignature - The signature received from Razorpay
 * @param secret - The Razorpay webhook secret
 * @returns Verification result with detailed information
 *
 * @example
 * const result = verifySignature(payload, signature, process.env.RAZORPAY_KEY_SECRET!);
 * if (result.valid) {
 *   // Signature is valid, process the webhook
 * } else {
 *   // Signature is invalid, reject the webhook
 *   console.error('Invalid signature:', result.error);
 * }
 */
export function verifySignature(
  payload: string | object,
  receivedSignature: string,
  secret: string
): SignatureVerificationResult {
  if (!payload || !receivedSignature || !secret) {
    return {
      valid: false,
      error: 'Missing required parameters: payload, signature, and secret are required',
    };
  }

  try {
    // Convert payload to string if it's an object
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Generate expected signature
    const expectedSignature = generateSignature(payloadString, secret);

    // Perform constant-time comparison to prevent timing attacks
    const isValid = constantTimeCompare(expectedSignature, receivedSignature);

    return {
      valid: isValid,
      details: {
        expectedSignature,
        receivedSignature,
        payloadHash: createHash('sha256').update(payloadString).digest('hex').substring(0, 16),
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generate payment verification signature for client-side verification
 *
 * Razorpay payment verification uses the format:
 * razorpay_payment_id|razorpay_subscription_id
 *
 * @param paymentId - Razorpay payment ID (pay_*)
 * @param subscriptionId - Razorpay subscription ID (sub_*)
 * @param secret - The Razorpay webhook secret
 * @returns Hex-encoded HMAC SHA256 signature
 *
 * @example
 * const signature = generatePaymentSignature('pay_123xyz', 'sub_456abc', secret);
 */
export function generatePaymentSignature(
  paymentId: string,
  subscriptionId: string,
  secret: string
): string {
  if (!paymentId || !subscriptionId || !secret) {
    throw new Error(
      'Payment ID, subscription ID, and secret are required for payment signature generation'
    );
  }

  // Validate Razorpay ID formats
  if (!paymentId.startsWith('pay_')) {
    throw new Error('Invalid payment ID format: must start with "pay_"');
  }

  if (!subscriptionId.startsWith('sub_')) {
    throw new Error('Invalid subscription ID format: must start with "sub_"');
  }

  // Create the payload in the format Razorpay expects
  const payload = `${paymentId}|${subscriptionId}`;

  return generateSignature(payload, secret);
}

/**
 * Verify payment signature from client-side payment verification
 *
 * @param paymentId - Razorpay payment ID
 * @param subscriptionId - Razorpay subscription ID
 * @param receivedSignature - Signature received from client
 * @param secret - The Razorpay webhook secret
 * @returns Verification result with detailed information
 *
 * @example
 * const result = verifyPaymentSignature('pay_123xyz', 'sub_456abc', signature, secret);
 * if (result.valid) {
 *   // Update subscription status to authenticated
 * } else {
 *   // Reject payment verification
 * }
 */
export function verifyPaymentSignature(
  paymentId: string,
  subscriptionId: string,
  receivedSignature: string,
  secret: string
): SignatureVerificationResult {
  if (!paymentId || !subscriptionId || !receivedSignature || !secret) {
    return {
      valid: false,
      error:
        'Missing required parameters: paymentId, subscriptionId, signature, and secret are required',
    };
  }

  try {
    // Generate expected signature
    const expectedSignature = generatePaymentSignature(paymentId, subscriptionId, secret);

    // Perform constant-time comparison
    const isValid = constantTimeCompare(expectedSignature, receivedSignature);

    return {
      valid: isValid,
      details: {
        expectedSignature,
        receivedSignature,
        payloadHash: createHash('sha256')
          .update(`${paymentId}|${subscriptionId}`)
          .digest('hex')
          .substring(0, 16),
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Payment signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify Razorpay webhook signature
 *
 * @param webhookBody - Raw webhook request body as string
 * @param receivedSignature - Signature from X-Razorpay-Signature header
 * @param secret - The Razorpay webhook secret
 * @returns Verification result with detailed information
 *
 * @example
 * const result = verifyWebhookSignature(requestBody, signature, secret);
 * if (result.valid) {
 *   const webhook = JSON.parse(requestBody) as RazorpayWebhookPayload;
 *   // Process webhook event
 * }
 */
export function verifyWebhookSignature(
  webhookBody: string,
  receivedSignature: string,
  secret: string
): SignatureVerificationResult {
  if (!webhookBody || !receivedSignature || !secret) {
    return {
      valid: false,
      error: 'Missing required parameters: webhookBody, signature, and secret are required',
    };
  }

  return verifySignature(webhookBody, receivedSignature, secret);
}

// ============================================================================
// Constant-Time Comparison (Security)
// ============================================================================

/**
 * Perform constant-time string comparison to prevent timing attacks
 *
 * This function compares two strings in constant time regardless of their content,
 * which prevents attackers from using timing attacks to discover valid signatures.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 *
 * @example
 * const isValid = constantTimeCompare(expectedSignature, receivedSignature);
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract signature components from verification request
 *
 * @param request - Payment verification request
 * @returns Extracted components with validation
 *
 * @example
 * const { paymentId, subscriptionId, signature } = extractVerificationComponents(request);
 */
export function extractVerificationComponents(request: PaymentVerificationRequest): {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  errors: string[];
} {
  const errors: string[] = [];
  const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = request;

  // Validate and normalize payment ID
  if (!razorpayPaymentId) {
    errors.push('Payment ID is required');
  } else if (!razorpayPaymentId.startsWith('pay_')) {
    errors.push('Invalid payment ID format: must start with "pay_"');
  }

  // Validate and normalize subscription ID
  if (!razorpaySubscriptionId) {
    errors.push('Subscription ID is required');
  } else if (!razorpaySubscriptionId.startsWith('sub_')) {
    errors.push('Invalid subscription ID format: must start with "sub_"');
  }

  // Validate signature
  if (!razorpaySignature) {
    errors.push('Signature is required');
  } else if (!/^[a-f0-9]{64}$/i.test(razorpaySignature)) {
    errors.push('Invalid signature format: must be 64-character hexadecimal string');
  }

  return {
    paymentId: razorpayPaymentId || '',
    subscriptionId: razorpaySubscriptionId || '',
    signature: razorpaySignature || '',
    errors,
  };
}

/**
 * Create a secure signature payload for logging (without exposing sensitive data)
 *
 * @param data - Object to create secure payload from
 * @returns Sanitized string representation for logging
 *
 * @example
 * const securePayload = createSecurePayload({ paymentId, subscriptionId });
 * console.log('Generated signature for payload:', securePayload);
 */
export function createSecurePayload(data: Record<string, string>): string {
  const { paymentId, subscriptionId, ...rest } = data;

  // Only include the essential data for signature generation
  if (paymentId && subscriptionId) {
    return `${paymentId}|${subscriptionId}`;
  }

  throw new Error('Both paymentId and subscriptionId are required for secure payload creation');
}
