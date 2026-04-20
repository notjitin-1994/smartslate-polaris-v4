/**
 * Razorpay Webhook Security
 *
 * @description Secure webhook signature verification for Razorpay webhook events
 * @version 1.0.0
 * @date 2025-10-29
 *
 * **SECURITY WARNING**:
 * - This file contains sensitive cryptographic operations
 * - RAZORPAY_WEBHOOK_SECRET must NEVER be exposed to client-side code
 * - Use only in server-side API routes and server components
 *
 * @see https://razorpay.com/docs/webhooks/#verifying-webhook-signatures
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

import { createHmac } from 'crypto';
import { verifySignature, type SignatureVerificationResult } from './crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Razorpay webhook event payload structure
 */
export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    entity: {
      // Subscription entity structure
      id?: string;
      status?: string;
      current_start?: number;
      current_end?: number;
      start_at?: number;
      end_at?: number;
      plan_id?: string;
      customer_id?: string;
      payment_id?: string;
      invoice_id?: string;
      offer_id?: string;
      has_trial?: boolean;
      trial_end?: number;
      charge_at?: number;
      created_at?: number;
      expired_at?: number;
      cancelled_at?: number;
      short_url?: string;
      notes?: Record<string, string>;
      [key: string]: any;
    };
  };
  account_id: string;
}

/**
 * Parsed webhook event components
 */
export interface ParsedWebhookEvent {
  eventType: string;
  eventId: string;
  accountId: string;
  payload: RazorpayWebhookPayload['payload'];
}

/**
 * Webhook security validation result
 */
export interface WebhookSecurityResult {
  valid: boolean;
  error?: string;
  details?: {
    webhookId?: string;
    eventType?: string;
    signatureValid?: boolean;
    eventId?: string;
    timestamp?: string;
  };
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

/**
 * Validate Razorpay webhook environment variables
 */
function validateWebhookEnvironment(): { valid: boolean; error?: string } {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      valid: false,
      error: 'RAZORPAY_WEBHOOK_SECRET environment variable is not configured',
    };
  }

  if (webhookSecret.length < 20) {
    return {
      valid: false,
      error: 'Invalid RAZORPAY_WEBHOOK_SECRET format: must be at least 20 characters',
    };
  }

  // Check if it looks like a valid webhook secret (alphanumeric)
  if (!/^[a-zA-Z0-9_]+$/.test(webhookSecret)) {
    return {
      valid: false,
      error:
        'Invalid RAZORPAY_WEBHOOK_SECRET format: must contain only alphanumeric characters and underscores',
    };
  }

  return { valid: true };
}

// ============================================================================
// Webhook Signature Verification
// ============================================================================

/**
 * Extract Razorpay signature from request headers
 *
 * @param headers - HTTP request headers
 * @returns Extracted signature or null if not found
 *
 * @example
 * const signature = extractRazorpaySignature(request.headers);
 */
export function extractRazorpaySignature(headers: Headers): string | null {
  // Razorpay sends signature in 'x-razorpay-signature' header
  const signature = headers.get('x-razorpay-signature');

  if (!signature) {
    return null;
  }

  // Validate signature format (should be sha256=hexstring)
  if (!signature.startsWith('sha256=')) {
    return null;
  }

  return signature.substring(7); // Remove 'sha256=' prefix
}

/**
 * Parse webhook event from Razorpay payload
 *
 * @param payload - Raw webhook payload string from Razorpay
 * @returns Parsed webhook event or error details
 *
 * @example
 * const parsed = parseWebhookEvent(requestBody);
 * if (parsed.valid) {
 *   console.log('Event type:', parsed.eventType);
 * }
 */
export function parseWebhookEvent(payload: string): {
  valid: boolean;
  event?: ParsedWebhookEvent;
  error?: string;
} {
  try {
    if (!payload || payload.trim().length === 0) {
      return {
        valid: false,
        error: 'Empty webhook payload',
      };
    }

    const webhook: RazorpayWebhookPayload = JSON.parse(payload);

    // Validate required fields
    if (!webhook.event) {
      return {
        valid: false,
        error: 'Missing event field in webhook payload',
      };
    }

    if (!webhook.account_id) {
      return {
        valid: false,
        error: 'Missing account_id field in webhook payload',
      };
    }

    if (!webhook.payload?.entity) {
      return {
        valid: false,
        error: 'Missing payload.entity field in webhook payload',
      };
    }

    // Extract event ID from payload entity
    const eventId = webhook.payload.entity.id;
    if (!eventId) {
      return {
        valid: false,
        error: 'Missing entity.id in webhook payload',
      };
    }

    // Validate event type format
    const eventParts = webhook.event.split('.');
    if (eventParts.length !== 2) {
      return {
        valid: false,
        error: `Invalid event format: ${webhook.event}. Expected format: "category.action"`,
      };
    }

    const [category, action] = eventParts;
    const validCategories = ['payment', 'subscription', 'order', 'refund', 'invoice'];

    if (!validCategories.includes(category)) {
      return {
        valid: false,
        error: `Invalid event category: ${category}. Must be one of: ${validCategories.join(', ')}`,
      };
    }

    return {
      valid: true,
      event: {
        eventType: webhook.event,
        eventId,
        accountId: webhook.account_id,
        payload: webhook.payload,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to parse webhook payload: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
    };
  }
}

/**
 * Verify Razorpay webhook signature
 *
 * @param payload - Raw webhook payload string
 * @param signature - Signature from x-razorpay-signature header
 * @param secret - Razorpay webhook secret
 * @returns Verification result with detailed information
 *
 * @example
 * const result = verifyWebhookSignature(requestBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET!);
 * if (result.valid) {
 *   console.log('Webhook signature is valid');
 * } else {
 *   console.error('Invalid webhook signature:', result.error);
 * }
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): SignatureVerificationResult {
  if (!payload || !signature || !secret) {
    return {
      valid: false,
      error: 'Missing required parameters: payload, signature, and secret are required',
    };
  }

  // Validate inputs
  if (typeof payload !== 'string') {
    return {
      valid: false,
      error: 'Payload must be a string',
    };
  }

  if (typeof signature !== 'string') {
    return {
      valid: false,
      error: 'Signature must be a string',
    };
  }

  if (signature.length !== 64) {
    return {
      valid: false,
      error: 'Invalid signature format: must be 64-character hexadecimal string',
    };
  }

  // Check if signature is valid hex
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return {
      valid: false,
      error: 'Invalid signature format: must contain only hexadecimal characters',
    };
  }

  try {
    // Use the existing verifySignature function from crypto.ts
    return verifySignature(payload, signature, secret);
  } catch (error) {
    return {
      valid: false,
      error: `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate webhook request headers and extract required information
 *
 * @param headers - HTTP request headers
 * @returns Validation result with extracted information
 *
 * @example
 * const validation = validateWebhookHeaders(request.headers);
 * if (validation.valid) {
 *   console.log('Signature:', validation.signature);
 * }
 */
export function validateWebhookHeaders(headers: Headers): {
  valid: boolean;
  signature?: string;
  error?: string;
} {
  const signature = extractRazorpaySignature(headers);

  if (!signature) {
    return {
      valid: false,
      error: 'Missing or invalid x-razorpay-signature header',
    };
  }

  // Validate signature format
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return {
      valid: false,
      signature,
      error: 'Invalid signature format: must be 64-character hexadecimal string',
    };
  }

  return {
    valid: true,
    signature,
  };
}

/**
 * Comprehensive webhook security validation
 *
 * This function performs all necessary security checks for incoming webhook requests:
 * 1. Environment validation
 * 2. Header validation
 * 3. Payload parsing
 * 4. Signature verification
 *
 * @param headers - HTTP request headers
 * @param body - Raw webhook body string
 * @param secret - Razorpay webhook secret (optional, will use environment variable if not provided)
 *returns Comprehensive security validation result
 *
 * @example
 * const result = validateWebhookSecurity(request.headers, requestBody);
 * if (result.valid) {
 *   const webhookId = result.details?.webhookId;
 *   // Process the webhook
 * } else {
 *   console.error('Webhook security validation failed:', result.error);
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 */
export function validateWebhookSecurity(
  headers: Headers,
  body: string,
  secret?: string
): WebhookSecurityResult {
  // Step 1: Environment validation
  const envValidation = validateWebhookEnvironment();
  if (!envValidation.valid) {
    return {
      valid: false,
      error: envValidation.error,
    };
  }

  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET!;

  // Step 2: Header validation
  const headerValidation = validateWebhookHeaders(headers);
  if (!headerValidation.valid) {
    return {
      valid: false,
      error: headerValidation.error,
    };
  }

  // Step 3: Payload parsing
  const payloadValidation = parseWebhookEvent(body);
  if (!payloadValidation.valid) {
    return {
      valid: false,
      error: payloadValidation.error,
    };
  }

  // Step 4: Signature verification
  const signatureValidation = verifyWebhookSignature(
    body,
    headerValidation.signature!,
    webhookSecret
  );

  if (!signatureValidation.valid) {
    return {
      valid: false,
      error: signatureValidation.error,
      details: {
        webhookId: payloadValidation.event?.eventId,
        eventType: payloadValidation.event?.eventType,
        signatureValid: false,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // All validations passed
  return {
    valid: true,
    details: {
      webhookId: payloadValidation.event?.eventId,
      eventType: payloadValidation.event?.eventType,
      signatureValid: true,
      eventId: payloadValidation.event?.eventId,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create a secure webhook processor configuration
 *
 * @param options - Configuration options
 * @returns Configuration object with security settings
 *
 * @example
 * const config = createWebhookSecurityConfig({
 *   maxPayloadSize: 10 * 1024 * 1024, // 10MB
 *   allowedEventTypes: ['payment.authorized', 'subscription.activated'],
 *   requireAccountVerification: true
 * });
 */
export function createWebhookSecurityConfig(options?: {
  maxPayloadSize?: number;
  allowedEventTypes?: string[];
  requireAccountVerification?: boolean;
}): {
  maxPayloadSize: number;
  allowedEventTypes: string[];
  requireAccountVerification: boolean;
} {
  return {
    maxPayloadSize: options?.maxPayloadSize || 10 * 1024 * 1024, // 10MB default
    allowedEventTypes: options?.allowedEventTypes || [
      // Payment events
      'payment.authorized',
      'payment.captured',
      'payment.failed',
      'payment.pending',
      // Subscription events
      'subscription.authenticated',
      'subscription.activated',
      'subscription.charged',
      'subscription.completed',
      'subscription.cancelled',
      'subscription.halted',
      'subscription.paused',
      'subscription.resumed',
      'subscription.pending',
      // Order events
      'order.paid',
      // Refund events
      'refund.created',
      'refund.processed',
    ],
    requireAccountVerification: options?.requireAccountVerification ?? true,
  };
}

/**
 * Validate webhook payload against security configuration
 *
 * @param payload - Parsed webhook payload
 * @param config - Security configuration
 * @returns Validation result
 *
 * @example
 * const config = createWebhookSecurityConfig();
 * const validation = validatePayloadAgainstConfig(webhook, config);
 */
export function validatePayloadAgainstConfig(
  payload: ParsedWebhookEvent,
  config: ReturnType<typeof createWebhookSecurityConfig>
): {
  valid: boolean;
  error?: string;
} {
  // Check event type against allowed list
  if (!config.allowedEventTypes.includes(payload.eventType)) {
    return {
      valid: false,
      error: `Event type not allowed: ${payload.eventType}`,
    };
  }

  // Validate event ID format
  if (!payload.eventId || typeof payload.eventId !== 'string') {
    return {
      valid: false,
      error: 'Invalid or missing event ID',
    };
  }

  // Validate account ID if required
  if (
    config.requireAccountVerification &&
    (!payload.accountId || typeof payload.accountId !== 'string')
  ) {
    return {
      valid: false,
      error: 'Invalid or missing account ID',
    };
  }

  return { valid: true };
}

// ============================================================================
// Utility Functions for Testing
// ============================================================================

/**
 * Generate a test webhook signature for development/testing
 *
 * @param payload - Webhook payload string
 * @param secret - Webhook secret
 * @returns HMAC SHA256 signature
 *
 * @example
 * const payload = JSON.stringify(testWebhookPayload);
 * const signature = generateTestSignature(payload, process.env.RAZORPAY_WEBHOOK_SECRET!);
 */
export function generateTestSignature(payload: string, secret: string): string {
  if (!payload || !secret) {
    throw new Error('Both payload and secret are required for signature generation');
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return hmac.digest('hex');
}

/**
 * Create test webhook payload for development
 *
 * @param eventType - Event type (e.g., 'subscription.activated')
 * @param eventId - Unique event ID
 * @param entityId - Entity ID (subscription/payment ID)
 * @returns Test webhook payload object
 *
 * @example
 * const testPayload = createTestWebhookPayload('subscription.activated', 'evt_123', 'sub_456');
 */
export function createTestWebhookPayload(
  eventType: string,
  eventId: string,
  entityId: string,
  accountId?: string
): RazorpayWebhookPayload {
  return {
    event: eventType,
    account_id: accountId || 'acc_test123456789',
    payload: {
      entity: {
        id: entityId,
        status: 'active',
        created_at: Math.floor(Date.now() / 1000),
        // Add common fields based on entity type
        ...(entityId.startsWith('sub_') && {
          current_start: Math.floor(Date.now() / 1000),
          plan_id: 'plan_test123',
          customer_id: 'cust_test456',
        }),
        ...(entityId.startsWith('pay_') && {
          amount: 50000, // ₹500
          currency: 'INR',
          method: 'card',
        }),
      },
    },
  };
}
