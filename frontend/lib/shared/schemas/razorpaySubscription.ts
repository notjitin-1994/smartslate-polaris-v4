/**
 * Razorpay Subscription Schemas
 *
 * @description Zod validation schemas for Razorpay subscription creation and management
 * @version 1.0.0
 * @date 2025-10-29
 */

import { z } from 'zod';

/**
 * Valid subscription tiers based on pricing.md configuration
 */
export const SubscriptionTierSchema = z.enum([
  'free',
  'explorer',
  'navigator',
  'voyager',
  'crew',
  'fleet',
  'armada',
]);

/**
 * Valid billing cycles
 */
export const BillingCycleSchema = z.enum(['monthly', 'yearly']);

/**
 * Request body schema for creating a subscription
 */
export const CreateSubscriptionRequestSchema = z.object({
  /**
   * Subscription tier (explorer, navigator, voyager, crew, fleet, armada)
   * - explorer: ₹19/month or ₹190/year
   * - navigator: ₹39/month or ₹390/year
   * - voyager: ₹79/month or ₹790/year
   * - crew: ₹24/seat/month or ₹240/seat/year
   * - fleet: ₹64/seat/month or ₹640/seat/year
   * - armada: ₹129/seat/month or ₹1,290/seat/year
   */
  tier: SubscriptionTierSchema.refine((tier) => tier !== 'free', {
    message: 'Cannot create subscription for free tier. Choose a paid tier.',
  }),

  /**
   * Billing cycle (monthly or yearly)
   */
  billingCycle: BillingCycleSchema,

  /**
   * Optional number of seats for team tiers (crew, fleet, armada)
   * Required for team tiers, ignored for individual tiers
   */
  seats: z.number().int().min(1).max(1000).optional(),

  /**
   * Optional customer information for pre-filling Razorpay checkout
   */
  customerInfo: z
    .object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      contact: z
        .string()
        .regex(/^[6-9]\d{9}$/)
        .optional(), // Indian mobile number format
    })
    .optional(),

  /**
   * Optional metadata to store with the subscription
   */
  metadata: z.record(z.string()).optional(),
});

/**
 * Type inference for request schema
 */
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;

/**
 * Response schema for successful subscription creation
 */
export const CreateSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    subscriptionId: z.string().uuid(),
    razorpaySubscriptionId: z.string(),
    shortUrl: z.string().url(),
    planName: z.string(),
    planAmount: z.number(),
    planCurrency: z.string(),
    billingCycle: BillingCycleSchema,
    nextBillingDate: z.string().datetime(),
    status: z.string(),
    customerName: z.string().optional(),
    customerEmail: z.string().optional(),
  }),
});

/**
 * Type inference for response schema
 */
export type CreateSubscriptionResponse = z.infer<typeof CreateSubscriptionResponseSchema>;

/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  requestId: z.string().optional(),
});

/**
 * Type inference for error response
 */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Request body schema for cancelling a subscription
 */
export const CancelSubscriptionRequestSchema = z.object({
  /**
   * Whether to cancel the subscription at the end of the current billing cycle
   * - true: User retains access until next_billing_cycle_date, no immediate downgrade
   * - false: Immediate cancellation, instant downgrade to free tier
   */
  cancelAtCycleEnd: z.boolean().default(false),

  /**
   * Optional reason for cancellation (for analytics and improvement)
   */
  reason: z.string().min(1).max(500).optional(),
});

/**
 * Response schema for successful subscription cancellation
 */
export const CancelSubscriptionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    subscriptionId: z.string().uuid(),
    cancellationDate: z.string().datetime(),
    accessUntilDate: z.string().datetime().optional(), // Only for end-of-cycle cancellations
    cancelledAtCycleEnd: z.boolean(),
    message: z.string(),
  }),
});

/**
 * Type inference for cancellation schemas
 */
export type CancelSubscriptionRequest = z.infer<typeof CancelSubscriptionRequestSchema>;
export type CancelSubscriptionResponse = z.infer<typeof CancelSubscriptionResponseSchema>;

/**
 * Validation utility functions
 */
export const validateCreateSubscriptionRequest = (data: unknown) => {
  return CreateSubscriptionRequestSchema.safeParse(data);
};

export const validateCreateSubscriptionResponse = (data: unknown) => {
  return CreateSubscriptionResponseSchema.safeParse(data);
};

export const validateErrorResponse = (data: unknown) => {
  return ErrorResponseSchema.safeParse(data);
};

export const validateCancelSubscriptionRequest = (data: unknown) => {
  return CancelSubscriptionRequestSchema.safeParse(data);
};

export const validateCancelSubscriptionResponse = (data: unknown) => {
  return CancelSubscriptionResponseSchema.safeParse(data);
};
