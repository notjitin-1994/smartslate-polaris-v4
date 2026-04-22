/**
 * Razorpay SDK Client Initialization
 *
 * @description Server-side Razorpay SDK client for subscription and payment management
 * @version 1.0.0
 * @date 2025-10-29
 *
 * **SECURITY WARNING**:
 * - This file MUST only be imported in server-side code (API routes, server components)
 * - NEVER import this in client components or pages
 * - RAZORPAY_KEY_SECRET must NEVER be exposed to the client
 *
 * @see https://razorpay.com/docs/api/
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

// Import Razorpay using CommonJS require to avoid TypeScript import issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');

// Inline error sanitization to avoid import issues
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

/**
 * Validate required Razorpay environment variables
 * @throws Error if required environment variables are missing
 */
function validateEnvironmentVariables(): void {
  // Skip validation during build time
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.NODE_ENV === 'production' && !process.env.RAZORPAY_KEY_SECRET)
  ) {
    console.warn('[Razorpay] Skipping environment validation during build time');
    return;
  }

  const requiredVars = {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `[Razorpay Client] Missing required environment variables: ${missing.join(', ')}\n` +
        'Please ensure these are set in your .env.local file.\n' +
        'See frontend/.env.example for the template.'
    );
  }

  // Validate key format with strict prefix checking
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) return;

  const isTestKey = keyId.startsWith('rzp_test_');
  const isLiveKey = keyId.startsWith('rzp_live_');

  if (!isTestKey && !isLiveKey) {
    throw new Error(
      `[Razorpay Client] Invalid NEXT_PUBLIC_RAZORPAY_KEY_ID format.\n` +
        'Expected format: rzp_test_XXXXX (test mode) or rzp_live_XXXXX (live mode)'
    );
  }

  // Environment-specific validation
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && isTestKey) {
    console.warn(
      '⚠️  [Razorpay Client] WARNING: Using test mode keys in production environment!\n' +
        'Switch to live mode keys (rzp_live_) for production.'
    );
  }

  if (!isProduction && isLiveKey) {
    console.warn(
      '⚠️  [Razorpay Client] WARNING: Using live mode keys in non-production environment!\n' +
        'Ensure this is intentional for testing/staging.'
    );
  }

  // Validate key length (Razorpay keys are typically 14-16 characters after prefix)
  const keyWithoutPrefix = keyId.split('_').slice(2).join('_');
  if (keyWithoutPrefix.length < 12 || keyWithoutPrefix.length > 20) {
    throw new Error(
      `[Razorpay Client] Invalid NEXT_PUBLIC_RAZORPAY_KEY_ID length. Key appears to be malformed.`
    );
  }

  // Validate key format (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(keyWithoutPrefix)) {
    throw new Error(
      `[Razorpay Client] Invalid NEXT_PUBLIC_RAZORPAY_KEY_ID format. Key must contain only alphanumeric characters.`
    );
  }

  // Log mode in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Razorpay Client] Initialized in ${isTestKey ? 'TEST' : 'LIVE'} mode`);
  }
}

// ============================================================================
// Razorpay SDK Instance
// ============================================================================

/**
 * Razorpay SDK configuration - validated at runtime
 */
function getRazorpayConfig() {
  validateEnvironmentVariables();

  return {
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  };
}

/**
 * Razorpay SDK Client Instance
 *
 * **Usage**: Import this in server-side code only
 *
 * @example Server-side API route
 * ```typescript
 * // ✅ CORRECT: API route (server-side)
 * import { razorpayClient } from '@/lib/razorpay/client';
 *
 * export async function POST(request: Request) {
 *   const subscription = await razorpayClient.subscriptions.create({
 *     plan_id: 'plan_xxxxx',
 *     total_count: 12,
 *     customer_notify: 1,
 *   });
 *   return Response.json({ subscriptionId: subscription.id });
 * }
 * ```
 *
 * @example Server Component
 * ```typescript
 * // ✅ CORRECT: Server component
 * import { razorpayClient } from '@/lib/razorpay/client';
 *
 * export default async function ServerComponent() {
 *   const plans = await razorpayClient.plans.all();
 *   return <div>{plans.items.length} plans found</div>;
 * }
 * ```
 *
 * @example Client Component - WRONG
 * ```typescript
 * // ❌ WRONG: Never import in client components
 * 'use client';
 * import { razorpayClient } from '@/lib/razorpay/client'; // This will expose secrets!
 * ```
 */
/**
 * Get Razorpay SDK Client Instance
 *
 * @description Lazy-loaded server-side Razorpay client instance for subscription and payment operations
 *
 * **SECURITY**: This client can only be used in server-side code (API routes, server components)
 * It must NEVER be imported or used in client-side code to avoid exposing secret keys.
 */
export function getRazorpayClient(): Razorpay {
  const config = getRazorpayConfig();
  return new Razorpay(config);
}

/**
 * @deprecated Use getRazorpayClient() instead for better error handling
 */
export const razorpayClient = (() => {
  try {
    return getRazorpayClient();
  } catch (error) {
    // Return a mock client during build time
    console.warn('[Razorpay] Client not available during build time');
    return null as any;
  }
})();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Razorpay is in test mode
 * @returns true if using test mode keys, false if using live mode keys
 */
export function isTestMode(): boolean {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_') ?? false;
}

/**
 * Check if Razorpay is in live mode
 * @returns true if using live mode keys, false if using test mode keys
 */
export function isLiveMode(): boolean {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_') ?? false;
}

/**
 * Get Razorpay API mode as string
 * @returns 'test' or 'live'
 */
export function getRazorpayMode(): 'test' | 'live' {
  return isTestMode() ? 'test' : 'live';
}

/**
 * Get Razorpay public key ID (safe to expose to client)
 * @returns Razorpay key ID
 */
export function getRazorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
}

// ============================================================================
// Type-Safe API Wrapper Functions
// ============================================================================

/**
 * Create a new Razorpay subscription
 *
 * @param params - Subscription creation parameters
 * @returns Created subscription object
 *
 * @example
 * ```typescript
 * const subscription = await createSubscription({
 *   plan_id: 'plan_xxxxx',
 *   customer_id: 'cust_xxxxx',
 *   total_count: 12,
 *   customer_notify: 1,
 * });
 * ```
 */
export async function createSubscription(params: {
  plan_id: string;
  customer_id?: string;
  total_count: number;
  quantity?: number;
  start_at?: number;
  expire_by?: number;
  customer_notify?: 0 | 1;
  addons?: Array<{
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }>;
  notes?: Record<string, any>;
}) {
  try {
    return await razorpayClient.subscriptions.create(params);
  } catch (error: any) {
    console.error('[Razorpay] Subscription creation failed:', error);
    const sanitized = sanitizeError(error, {
      customMessages: {
        BAD_REQUEST_ERROR: 'Invalid subscription details provided.',
        INVALID_REQUEST: 'Invalid subscription details provided.',
      },
    });
    throw new Error(sanitized.message);
  }
}

/**
 * Fetch subscription details by ID
 *
 * @param subscriptionId - Razorpay subscription ID
 * @returns Subscription object
 */
export async function fetchSubscription(subscriptionId: string) {
  try {
    return await razorpayClient.subscriptions.fetch(subscriptionId);
  } catch (error: any) {
    console.error('[Razorpay] Subscription fetch failed:', error);
    const sanitized = sanitizeError(error, {
      customMessages: {
        INVALID_SUBSCRIPTION_ID: 'Invalid subscription ID provided.',
        SUBSCRIPTION_NOT_FOUND: 'Subscription not found.',
      },
    });
    throw new Error(sanitized.message);
  }
}

/**
 * Cancel a subscription
 *
 * @param subscriptionId - Razorpay subscription ID
 * @param cancelAtCycleEnd - If true, cancel at end of billing cycle
 * @returns Cancelled subscription object
 */
export async function cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
  try {
    return await razorpayClient.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  } catch (error: any) {
    console.error('[Razorpay] Subscription cancellation failed:', error);
    const sanitized = sanitizeError(error, {
      customMessages: {
        INVALID_SUBSCRIPTION_ID: 'Invalid subscription ID provided.',
        SUBSCRIPTION_NOT_FOUND: 'Subscription not found.',
        CANCELLATION_NOT_ALLOWED: 'This subscription cannot be cancelled.',
      },
    });
    throw new Error(sanitized.message);
  }
}

/**
 * Create or fetch a Razorpay customer
 *
 * @param params - Customer creation parameters
 * @returns Customer object
 */
export async function createCustomer(params: {
  name: string;
  email: string;
  contact?: string;
  gstin?: string;
  notes?: Record<string, any>;
}) {
  try {
    return await razorpayClient.customers.create(params);
  } catch (error: any) {
    console.error('[Razorpay] Customer creation failed:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}

/**
 * Fetch customer details by ID
 *
 * @param customerId - Razorpay customer ID
 * @returns Customer object
 */
export async function fetchCustomer(customerId: string) {
  try {
    return await razorpayClient.customers.fetch(customerId);
  } catch (error: any) {
    console.error('[Razorpay] Customer fetch failed:', error);
    throw new Error(`Failed to fetch customer: ${error.message}`);
  }
}

/**
 * Create a new Razorpay plan (admin operation)
 *
 * @param params - Plan creation parameters
 * @returns Created plan object
 *
 * @example
 * ```typescript
 * const plan = await createPlan({
 *   period: 'monthly',
 *   interval: 1,
 *   item: {
 *     name: 'Navigator Plan',
 *     description: '25 blueprints per month',
 *     amount: 3900, // ₹39 in paise
 *     currency: 'INR',
 *   },
 * });
 * ```
 */
export async function createPlan(params: {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  item: {
    name: string;
    description?: string;
    amount: number;
    currency: string;
  };
  notes?: Record<string, any>;
}) {
  try {
    return await razorpayClient.plans.create(params);
  } catch (error: any) {
    console.error('[Razorpay] Plan creation failed:', error);
    throw new Error(`Failed to create plan: ${error.message}`);
  }
}

/**
 * Fetch all plans
 *
 * @param options - Pagination options
 * @returns Plans list
 */
export async function fetchAllPlans(options?: { count?: number; skip?: number }) {
  try {
    return await razorpayClient.plans.all(options);
  } catch (error: any) {
    console.error('[Razorpay] Plans fetch failed:', error);
    throw new Error(`Failed to fetch plans: ${error.message}`);
  }
}

// ============================================================================
// Export
// ============================================================================

export default razorpayClient;
