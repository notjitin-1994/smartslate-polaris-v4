/**
 * Payment Verification Schema
 *
 * @description Comprehensive Zod validation schema for Razorpay payment verification API endpoints
 * @version 1.0.0
 * @date 2025-10-29
 *
 * @see https://razorpay.com/docs/api/payments/
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Payment verification request from client application
 */
export interface PaymentVerificationRequest {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}

/**
 * Payment verification response from API
 */
export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  subscriptionId?: string;
  paymentId?: string;
  verificationId?: string;
  timestamp: string;
}

/**
 * Payment verification error response
 */
export interface PaymentVerificationError {
  success: false;
  error: string;
  code: string;
  details?: {
    field?: string;
    issue?: string;
    expected?: string;
    received?: string;
  };
  timestamp: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Razorpay Payment ID validation
 * Must start with 'pay_' followed by alphanumeric characters and underscores
 *
 * Examples:
 * - pay_123xyz789abc
 * - pay_LQGVc0hJx5423T
 */
export const RazorpayPaymentIdSchema = z
  .string()
  .min(1, 'Payment ID is required')
  .regex(
    /^pay_[a-zA-Z0-9_]+$/,
    'Invalid payment ID format. Must start with "pay_" followed by alphanumeric characters and underscores'
  )
  .max(50, 'Payment ID is too long');

/**
 * Razorpay Subscription ID validation
 * Must start with 'sub_' followed by alphanumeric characters and underscores
 *
 * Examples:
 * - sub_123xyz789abc
 * - sub_LQGVc0hJx5423T
 */
export const RazorpaySubscriptionIdSchema = z
  .string()
  .min(1, 'Subscription ID is required')
  .regex(
    /^sub_[a-zA-Z0-9_]+$/,
    'Invalid subscription ID format. Must start with "sub_" followed by alphanumeric characters and underscores'
  )
  .max(50, 'Subscription ID is too long');

/**
 * Razorpay Signature validation
 * Must be a 64-character hexadecimal string (SHA256 hash)
 *
 * Examples:
 * - a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
 * - 9f8e7d6c5b4a3210fedcba9876543210abcdef1234567890abcdef1234567890
 */
export const RazorpaySignatureSchema = z
  .string()
  .min(1, 'Signature is required')
  .regex(
    /^[a-fA-F0-9]{64}$/,
    'Invalid signature format. Must be a 64-character hexadecimal string (SHA256 hash)'
  )
  .transform((val) => val.toLowerCase()); // Normalize to lowercase for consistent comparison

/**
 * Payment verification request schema
 * Validates the complete request payload from client application
 */
export const PaymentVerificationRequestSchema = z.object({
  razorpayPaymentId: RazorpayPaymentIdSchema,
  razorpaySubscriptionId: RazorpaySubscriptionIdSchema,
  razorpaySignature: RazorpaySignatureSchema,
});

/**
 * Payment verification success response schema
 * Defines the structure of successful verification responses
 */
export const PaymentVerificationResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1, 'Success message is required'),
  subscriptionId: RazorpaySubscriptionIdSchema.optional(),
  paymentId: RazorpayPaymentIdSchema.optional(),
  verificationId: z.string().uuid().optional(),
  timestamp: z.string().datetime('Invalid timestamp format'),
});

/**
 * Payment verification error response schema
 * Defines the structure of error responses
 */
export const PaymentVerificationErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1, 'Error message is required'),
  code: z.string().min(1, 'Error code is required'),
  details: z
    .object({
      field: z.string().optional(),
      issue: z.string().optional(),
      expected: z.string().optional(),
      received: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().datetime('Invalid timestamp format'),
});

/**
 * Union schema for all possible payment verification responses
 */
export const PaymentVerificationAllResponsesSchema = z.union([
  PaymentVerificationResponseSchema,
  PaymentVerificationErrorResponseSchema,
]);

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate payment verification request
 *
 * @param data - Raw request data to validate
 * @returns Validation result with parsed data or error details
 *
 * @example
 * const result = validatePaymentVerificationRequest(requestData);
 * if (result.success) {
 *   const { paymentId, subscriptionId, signature } = result.data;
 *   // Proceed with verification
 * } else {
 *   console.error('Validation failed:', result.error);
 * }
 */
export function validatePaymentVerificationRequest(data: unknown):
  | {
      success: true;
      data: PaymentVerificationRequest;
    }
  | {
      success: false;
      error: string;
      field?: string;
      issue: string;
      received?: unknown;
    } {
  try {
    const parsed = PaymentVerificationRequestSchema.parse(data) as PaymentVerificationRequest;
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get the first validation error for cleaner error messages
      const firstError = error.errors[0];
      const fieldName = firstError?.path.join('.');
      const issue = firstError?.message || 'Unknown validation error';
      const received = (firstError as any)?.received;

      return {
        success: false,
        error: `Invalid request format: ${issue}`,
        field: fieldName,
        issue,
        received,
      };
    }

    return {
      success: false,
      error: 'Request validation failed',
      issue: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a string is a valid Razorpay payment ID
 *
 * @param paymentId - Payment ID to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * if (isValidPaymentId(paymentId)) {
 *   // Proceed with payment verification
 * }
 */
export function isValidPaymentId(paymentId: unknown): paymentId is string {
  const result = RazorpayPaymentIdSchema.safeParse(paymentId);
  return result.success;
}

/**
 * Check if a string is a valid Razorpay subscription ID
 *
 * @param subscriptionId - Subscription ID to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * if (isValidSubscriptionId(subscriptionId)) {
 *   // Proceed with subscription lookup
 * }
 */
export function isValidSubscriptionId(subscriptionId: unknown): subscriptionId is string {
  const result = RazorpaySubscriptionIdSchema.safeParse(subscriptionId);
  return result.success;
}

/**
 * Check if a string is a valid Razorpay signature
 *
 * @param signature - Signature to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * if (isValidSignature(signature)) {
 *   // Proceed with signature verification
 * }
 */
export function isValidSignature(signature: unknown): signature is string {
  const result = RazorpaySignatureSchema.safeParse(signature);
  return result.success;
}

/**
 * Sanitize and normalize payment verification input
 *
 * This function handles common input issues and normalizes the data
 * before validation.
 *
 * @param rawData - Raw input data
 * @returns Sanitized and normalized data
 *
 * @example
 * const sanitized = sanitizePaymentVerificationInput(rawData);
 * const validation = validatePaymentVerificationRequest(sanitized);
 */
export function sanitizePaymentVerificationInput(rawData: any): any {
  if (!rawData || typeof rawData !== 'object') {
    return {};
  }

  const sanitized: any = {};

  // Sanitize payment ID
  if (rawData.razorpayPaymentId) {
    const paymentId = String(rawData.razorpayPaymentId).trim();
    if (paymentId.startsWith('pay_')) {
      sanitized.razorpayPaymentId = paymentId;
    }
  }

  // Sanitize subscription ID
  if (rawData.razorpaySubscriptionId) {
    const subscriptionId = String(rawData.razorpaySubscriptionId).trim();
    if (subscriptionId.startsWith('sub_')) {
      sanitized.razorpaySubscriptionId = subscriptionId;
    }
  }

  // Sanitize signature
  if (rawData.razorpaySignature) {
    const signature = String(rawData.razorpaySignature).trim().toLowerCase();
    if (/^[a-f0-9]{64}$/.test(signature)) {
      sanitized.razorpaySignature = signature;
    }
  }

  return sanitized;
}

// ============================================================================
// Error Code Definitions
// ============================================================================

/**
 * Standard error codes for payment verification
 */
export const PAYMENT_VERIFICATION_ERROR_CODES = {
  INVALID_REQUEST_FORMAT: 'INVALID_REQUEST_FORMAT',
  INVALID_PAYMENT_ID: 'INVALID_PAYMENT_ID',
  INVALID_SUBSCRIPTION_ID: 'INVALID_SUBSCRIPTION_ID',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Type for error codes
 */
export type PaymentVerificationErrorCode =
  (typeof PAYMENT_VERIFICATION_ERROR_CODES)[keyof typeof PAYMENT_VERIFICATION_ERROR_CODES];

// ============================================================================
// Response Builders
// ============================================================================

/**
 * Create a successful payment verification response
 *
 * @param data - Response data
 * @returns Formatted success response
 *
 * @example
 * const response = createSuccessResponse({
 *   message: 'Payment verified successfully',
 *   subscriptionId: 'sub_123',
 *   paymentId: 'pay_456'
 * });
 */
export function createSuccessResponse(
  data: Omit<PaymentVerificationResponse, 'success' | 'timestamp'>
): PaymentVerificationResponse {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    ...data,
  };
}

/**
 * Create an error response for payment verification
 *
 * @param error - Error details
 * @returns Formatted error response
 *
 * @example
 * const response = createErrorResponse({
 *   error: 'Invalid signature',
 *   code: 'SIGNATURE_MISMATCH',
 *   details: { field: 'razorpaySignature', issue: 'Signature verification failed' }
 * });
 */
export function createErrorResponse(
  error: Omit<PaymentVerificationError, 'success' | 'timestamp'>
): PaymentVerificationError {
  return {
    success: false,
    timestamp: new Date().toISOString(),
    ...error,
  };
}

// ============================================================================
// Type Exports
// ============================================================================

// Export inferred types for TypeScript usage are already available from the interfaces above
