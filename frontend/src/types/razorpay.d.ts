/**
 * Razorpay TypeScript Type Definitions
 *
 * @description Complete type definitions for Razorpay Payment Gateway integration
 * @version 1.0.0
 * @date 2025-10-29
 *
 * @see https://razorpay.com/docs/api/
 * @see https://razorpay.com/docs/payments/subscriptions/
 */

// ============================================================================
// Global Window Interface for Razorpay Checkout
// ============================================================================

declare global {
  interface Window {
    /**
     * Razorpay Checkout constructor loaded from CDN
     * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
     */
    Razorpay: RazorpayConstructor;
  }
}

// ============================================================================
// Razorpay Constructor and Core Interfaces
// ============================================================================

/**
 * Razorpay Checkout constructor interface
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */
export interface RazorpayConstructor {
  new (options: RazorpayConfig): RazorpayInstance;
}

/**
 * Razorpay instance interface
 */
export interface RazorpayInstance {
  /**
   * Open Razorpay checkout modal
   */
  open(options: RazorpayCheckoutOptions): void;

  /**
   * Create a new order
   */
  createOrder(options: CreateOrderParams): Promise<RazorpayOrder>;

  /**
   * Create a new plan
   */
  createPlan(options: CreatePlanParams): Promise<RazorpayPlan>;

  /**
   * Create a new subscription
   */
  createSubscription(options: CreateSubscriptionParams): Promise<RazorpaySubscription>;

  /**
   * Create a new customer
   */
  createCustomer(options: CreateCustomerParams): Promise<RazorpayCustomer>;

  /**
   * Fetch an order by ID
   */
  fetchOrder(orderId: string): Promise<RazorpayOrder>;

  /**
   * Fetch a payment by ID
   */
  fetchPayment(paymentId: string): Promise<RazorpayPayment>;

  /**
   * Fetch a subscription by ID
   */
  fetchSubscription(subscriptionId: string): Promise<RazorpaySubscription>;

  /**
   * Fetch a plan by ID
   */
  fetchPlan(planId: string): Promise<RazorpayPlan>;

  /**
   * Fetch a customer by ID
   */
  fetchCustomer(customerId: string): Promise<RazorpayCustomer>;

  /**
   * Fetch all plans
   */
  fetchAllPlans(options?: {
    count?: number;
    skip?: number;
  }): Promise<{ items: RazorpayPlan[]; count: number }>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(
    subscriptionId: string,
    options?: { cancel_at_cycle_end?: 0 | 1 }
  ): Promise<RazorpaySubscription>;

  /**
   * Pause a subscription
   */
  pauseSubscription(subscriptionId: string): Promise<RazorpaySubscription>;

  /**
   * Resume a subscription
   */
  resumeSubscription(subscriptionId: string): Promise<RazorpaySubscription>;

  /**
   * Edit a subscription
   */
  editSubscription(
    subscriptionId: string,
    options: Partial<CreateSubscriptionParams>
  ): Promise<RazorpaySubscription>;

  /**
   * Create a payment link
   */
  createPaymentLink(options: CreatePaymentLinkParams): Promise<PaymentLink>;

  /**
   * Fetch a payment link by ID
   */
  fetchPaymentLink(paymentLinkId: string): Promise<PaymentLink>;
}

/**
 * Order creation parameters
 */
export interface CreateOrderParams {
  /** Amount in smallest currency unit (paise for INR) */
  amount: number;
  /** Currency code */
  currency: string;
  /** Customer receipt number */
  receipt?: string;
  /** Order notes */
  notes?: Record<string, any>;
  /** Partial payment enabled */
  partial_payment?: boolean;
  /** Customer contact details */
  customer?: {
    name: string;
    email: string;
    contact: string;
  };
}

/**
 * Payment link creation parameters
 */
export interface CreatePaymentLinkParams {
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Accept partial payments */
  accept_partial: boolean;
  /** Payment link description */
  description?: string;
  /** Customer contact */
  customer?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  /** Link notes */
  notes?: Record<string, any>;
  /** Link expiry time */
  expire_by?: number;
  /** Link reference */
  reference_id?: string;
}

/**
 * Payment link interface
 */
export interface PaymentLink {
  /** Payment link ID */
  id: string;
  /** Entity type */
  entity: string;
  /** Payment link URL */
  short_url: string;
  /** Payment link amount */
  amount: number;
  /** Currency code */
  currency: string;
  /** Accept partial payments */
  accept_partial: boolean;
  /** Payment link description */
  description?: string;
  /** Payment link status */
  status: 'created' | 'expired' | 'cancelled' | 'paid';
  /** Customer details */
  customer?: {
    id: string;
    name: string;
    email: string;
    contact: string;
  };
  /** Payment link notes */
  notes?: Record<string, any>;
  /** Expiry timestamp */
  expire_by?: number;
  /** Reference ID */
  reference_id?: string;
  /** Creation timestamp */
  created_at: number;
}

/**
 * Razorpay Order interface
 * Used for one-time payments
 */
export interface RazorpayOrder {
  /** Unique identifier for the order (e.g., order_xxxxx) */
  id: string;
  /** Entity type (always 'order') */
  entity: string;
  /** Amount in smallest currency unit (paise for INR: ₹100 = 10000 paise) */
  amount: number;
  /** Currency code (e.g., 'INR', 'USD') */
  currency: string;
  /** Receipt number for reference */
  receipt: string;
  /** Order status: 'created' | 'attempted' | 'paid' */
  status: string;
  /** Number of payment attempts made */
  attempts: number;
  /** Additional notes (JSON object) */
  notes: Record<string, any>;
  /** Unix timestamp of creation */
  created_at: number;
}

/**
 * Razorpay Subscription interface
 * Used for recurring payments
 */
export interface RazorpaySubscription {
  /** Unique subscription ID (e.g., sub_xxxxx) */
  id: string;
  /** Entity type (always 'subscription') */
  entity: string;
  /** Plan ID associated with this subscription */
  plan_id: string;
  /** Customer ID who owns this subscription */
  customer_id: string;
  /** Subscription status */
  status:
    | 'created'
    | 'authenticated'
    | 'active'
    | 'halted'
    | 'cancelled'
    | 'completed'
    | 'expired'
    | 'paused';
  /** Current billing period start (Unix timestamp) */
  current_start: number;
  /** Current billing period end (Unix timestamp) */
  current_end: number;
  /** Next charge date (Unix timestamp) */
  charge_at: number;
  /** Subscription start date (Unix timestamp) */
  start_at: number;
  /** Subscription end date (Unix timestamp) */
  end_at: number;
  /** Number of authentication attempts */
  auth_attempts: number;
  /** Total number of billing cycles */
  total_count: number;
  /** Number of paid billing cycles */
  paid_count: number;
  /** Remaining billing cycles */
  remaining_count: number;
  /** Short URL for checkout */
  short_url: string;
  /** Additional metadata */
  notes?: Record<string, any>;
  /** Unix timestamp of creation */
  created_at: number;
}

/**
 * Razorpay Plan interface
 * Defines subscription pricing structure
 */
export interface RazorpayPlan {
  /** Unique plan ID (e.g., plan_xxxxx) */
  id: string;
  /** Entity type (always 'plan') */
  entity: string;
  /** Billing interval (e.g., 1 for monthly) */
  interval: number;
  /** Billing period */
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Plan item details */
  item: {
    /** Item ID */
    id: string;
    /** Plan name/title */
    name: string;
    /** Plan description */
    description: string;
    /** Amount in smallest currency unit (paise) */
    amount: number;
    /** Currency code */
    currency: string;
  };
  /** Additional notes */
  notes?: Record<string, any>;
  /** Unix timestamp of creation */
  created_at: number;
}

/**
 * Razorpay Customer interface
 */
export interface RazorpayCustomer {
  /** Unique customer ID (e.g., cust_xxxxx) */
  id: string;
  /** Entity type (always 'customer') */
  entity: string;
  /** Customer name */
  name: string;
  /** Customer email */
  email: string;
  /** Customer contact number */
  contact: string;
  /** GST number (optional) */
  gstin?: string;
  /** Additional notes */
  notes?: Record<string, any>;
  /** Unix timestamp of creation */
  created_at: number;
}

/**
 * Razorpay Payment interface
 */
export interface RazorpayPayment {
  /** Unique payment ID (e.g., pay_xxxxx) */
  id: string;
  /** Entity type (always 'payment') */
  entity: string;
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Payment status */
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed' | 'pending';
  /** Order ID (if linked to order) */
  order_id?: string;
  /** Invoice ID (if generated) */
  invoice_id?: string;
  /** Payment method used */
  method: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi' | 'cardless_emi' | 'paylater';
  /** Amount refunded */
  amount_refunded: number;
  /** Refund status */
  refund_status?: 'null' | 'partial' | 'full';
  /** Whether payment is captured */
  captured: boolean;
  /** Customer email */
  email: string;
  /** Customer contact */
  contact: string;
  /** Card details (if payment method is card) */
  card?: {
    /** Masked card number */
    id: string;
    /** Entity type */
    entity: string;
    /** Card network (Visa, Mastercard, etc.) */
    network: string;
    /** Last 4 digits */
    last4: string;
    /** Card type (credit/debit) */
    type: string;
  };
  /** Bank name (if payment method is netbanking/UPI) */
  bank?: string;
  /** Wallet name (if payment method is wallet) */
  wallet?: string;
  /** UPI details */
  vpa?: string;
  /** Error details (if payment failed) */
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  /** Additional notes */
  notes?: Record<string, any>;
  /** Unix timestamp of creation */
  created_at: number;
}

// ============================================================================
// Razorpay Webhook Event Interfaces
// ============================================================================

/**
 * Base webhook event structure
 */
export interface RazorpayWebhookEvent<T = any> {
  /** Event entity type */
  entity: string;
  /** Razorpay account ID */
  account_id: string;
  /** Event type (e.g., 'payment.captured', 'subscription.activated') */
  event: string;
  /** List of entities contained in payload */
  contains: string[];
  /** Event payload */
  payload: T;
  /** Unix timestamp of event creation */
  created_at: number;
}

/**
 * Payment webhook payload
 */
export interface PaymentWebhookPayload {
  payment: {
    entity: RazorpayPayment;
  };
}

/**
 * Subscription webhook payload
 */
export interface SubscriptionWebhookPayload {
  subscription: {
    entity: RazorpaySubscription;
  };
  payment?: {
    entity: RazorpayPayment;
  };
}

/**
 * Union type for all webhook event types
 */
export type RazorpayWebhookEventType =
  // Payment events
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.pending'
  // Subscription events
  | 'subscription.authenticated'
  | 'subscription.activated'
  | 'subscription.charged'
  | 'subscription.completed'
  | 'subscription.cancelled'
  | 'subscription.halted'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.pending'
  // Order events
  | 'order.paid'
  // Refund events
  | 'refund.created'
  | 'refund.processed';

// ============================================================================
// Razorpay Checkout Options Interface
// ============================================================================

/**
 * Razorpay Checkout options for modal
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/
 */
export interface RazorpayCheckoutOptions {
  /** Razorpay API key (starts with rzp_test_ or rzp_live_) */
  key: string;
  /** Order ID OR Subscription ID (one required) */
  order_id?: string;
  subscription_id?: string;
  /** Amount in smallest currency unit (only for non-subscription payments) */
  amount?: number;
  /** Currency code (default: INR) */
  currency?: string;
  /** Business/Brand name displayed in checkout */
  name: string;
  /** Payment description */
  description?: string;
  /** Logo image URL (recommended 256x256px) */
  image?: string;
  /** Pre-filled customer information */
  prefill?: {
    /** Customer name */
    name?: string;
    /** Customer email */
    email?: string;
    /** Customer contact number */
    contact?: string;
  };
  /** Custom notes (max 15 keys, each value max 255 chars) */
  notes?: Record<string, string>;
  /** Theme customization */
  theme?: {
    /** Primary color (hex code) */
    color?: string;
    /** Hide top bar */
    hide_topbar?: boolean;
  };
  /** Payment success callback */
  handler: (response: RazorpaySuccessResponse) => void;
  /** Modal close callback */
  modal?: {
    ondismiss?: () => void;
    /** Escape key closes modal */
    escape?: boolean;
    /** Animation enabled */
    animation?: boolean;
    /** Allow backdrop click to close */
    backdropclose?: boolean;
  };
  /** Retry payment configuration */
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
  /** Callback URL for payment response (optional) */
  callback_url?: string;
  /** Redirect after payment */
  redirect?: boolean;
  /** Read-only fields */
  readonly?: {
    email?: boolean;
    contact?: boolean;
    name?: boolean;
  };
}

/**
 * Response from successful payment
 */
export interface RazorpaySuccessResponse {
  /** Razorpay payment ID */
  razorpay_payment_id: string;
  /** Razorpay order ID (if order-based payment) */
  razorpay_order_id?: string;
  /** Razorpay subscription ID (if subscription payment) */
  razorpay_subscription_id?: string;
  /** Signature for verification (HMAC SHA256) */
  razorpay_signature: string;
}

/**
 * Response from failed payment
 */
export interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

// ============================================================================
// Razorpay SDK Method Interfaces
// ============================================================================

/**
 * Razorpay SDK constructor options
 */
export interface RazorpayConfig {
  /** Razorpay Key ID */
  key_id: string;
  /** Razorpay Key Secret */
  key_secret: string;
}

/**
 * Plan creation parameters
 */
export interface CreatePlanParams {
  /** Billing period */
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Billing interval (e.g., 1 for monthly, 3 for quarterly) */
  interval: number;
  /** Plan item details */
  item: {
    /** Plan name */
    name: string;
    /** Plan description */
    description?: string;
    /** Amount in smallest currency unit */
    amount: number;
    /** Currency code */
    currency: string;
  };
  /** Additional notes */
  notes?: Record<string, any>;
}

/**
 * Subscription creation parameters
 */
export interface CreateSubscriptionParams {
  /** Plan ID to subscribe to */
  plan_id: string;
  /** Customer ID (optional, will create if not provided) */
  customer_id?: string;
  /** Total number of billing cycles */
  total_count: number;
  /** Quantity (for metered subscriptions) */
  quantity?: number;
  /** Start date (Unix timestamp, optional) */
  start_at?: number;
  /** Expiry date (Unix timestamp, optional) */
  expire_by?: number;
  /** Notify customer via email/SMS */
  customer_notify?: 0 | 1;
  /** Addons (additional charges) */
  addons?: Array<{
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }>;
  /** Additional notes */
  notes?: Record<string, any>;
}

/**
 * Customer creation parameters
 */
export interface CreateCustomerParams {
  /** Customer name */
  name: string;
  /** Customer email */
  email: string;
  /** Customer contact number */
  contact?: string;
  /** Customer GST number */
  gstin?: string;
  /** Additional notes */
  notes?: Record<string, any>;
}

// ============================================================================
// Database Schema Interfaces
// ============================================================================

/**
 * Subscriptions table schema
 * Maps to: public.subscriptions
 */
export interface SubscriptionRecord {
  subscription_id: string;
  user_id: string;
  razorpay_subscription_id: string;
  razorpay_plan_id: string;
  razorpay_customer_id: string | null;
  status:
    | 'created'
    | 'authenticated'
    | 'active'
    | 'halted'
    | 'cancelled'
    | 'completed'
    | 'expired'
    | 'paused';
  plan_name: string;
  plan_amount: number; // paise
  plan_currency: string;
  plan_period: 'monthly' | 'yearly';
  plan_interval: number;
  start_date: string | null; // ISO timestamp
  end_date: string | null;
  current_start: string | null;
  current_end: string | null;
  next_billing_date: string | null;
  charge_at: string | null;
  total_count: number;
  paid_count: number;
  remaining_count: number;
  payment_method: Record<string, any> | null;
  metadata: Record<string, any>;
  short_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payments table schema
 * Maps to: public.payments
 */
export interface PaymentRecord {
  payment_id: string;
  subscription_id: string | null;
  user_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string | null;
  razorpay_invoice_id: string | null;
  amount: number; // paise
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed' | 'pending';
  method: string | null;
  card_network: string | null;
  card_last4: string | null;
  bank: string | null;
  wallet: string | null;
  upi_id: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  refund_status: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  metadata: Record<string, any>;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

/**
 * Webhook events table schema
 * Maps to: public.webhook_events
 */
export interface WebhookEventRecord {
  id: string;
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  processed_at: string;
  created_at: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Subscription tier names
 */
export type SubscriptionTier =
  | 'free'
  | 'explorer'
  | 'navigator'
  | 'voyager'
  | 'crew'
  | 'fleet'
  | 'armada';

/**
 * Billing cycle type
 */
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Razorpay plan mapping
 */
export interface RazorpayPlanMapping {
  [tier: string]: {
    monthly: string | null;
    yearly: string | null;
  };
}

// Export everything
export {};
