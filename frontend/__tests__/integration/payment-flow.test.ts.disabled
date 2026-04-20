/**
 * Integration Tests for Payment Flow
 *
 * @description Integration tests for complete payment workflow including
 * subscription creation, cancellation, and webhook processing
 * @version 1.0.0
 * @date 2025-10-29
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Setup environment variables before module imports
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET = 'rzp_test_secret_key_1234567890';
  process.env.NODE_ENV = 'test';
});

/**
 * Helper function to create mock NextRequest
 */
function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const { method = 'POST', headers = {}, body } = options;

  const request = new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

// Mock external dependencies with realistic responses
vi.mock('@/lib/razorpay/client', () => ({
  razorpayClient: {
    customers: {
      all: vi.fn(),
      create: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      cancel: vi.fn(),
      fetch: vi.fn(),
    },
    payments: {
      fetch: vi.fn(),
    },
  },
  cancelSubscription: vi.fn(),
  isTestMode: vi.fn(() => true),
}));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/config/razorpayPlans', () => ({
  getPlanId: vi.fn(),
  getPlanPrice: vi.fn(),
}));

// Import after mocking
import { POST as CreateSubscription } from '@/app/api/subscriptions/create-subscription/route';
import { POST as CancelSubscription } from '@/app/api/subscriptions/cancel/route';
import { POST as VerifyPayment } from '@/app/api/subscriptions/verify-payment/route';
import { POST as WebhookHandler } from '@/app/api/webhooks/razorpay/route';
import { razorpayClient } from '@/lib/razorpay/client';
import { getSupabaseServerClient, getServerSession } from '@/lib/supabase/server';
import { getPlanId, getPlanPrice } from '@/lib/config/razorpayPlans';

describe('Payment Flow Integration Tests', () => {
  let mockSupabase: any;
  let mockUser: any;
  let mockSubscription: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock user
    mockUser = {
      id: 'test-user-integration',
      email: 'integration-test@example.com',
      user_metadata: { full_name: 'Integration Test User' },
    };

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      is: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
    };

    (getSupabaseServerClient as any).mockResolvedValue(mockSupabase);
    (getServerSession as any).mockResolvedValue({
      session: { user: mockUser },
    });

    // Setup default successful responses
    (getPlanId as any).mockImplementation((tier: string, billingCycle: string) => {
      return `plan_${tier}_${billingCycle}`;
    });

    (getPlanPrice as any).mockImplementation((tier: string) => {
      const prices = { navigator: 349900, voyager: 699900, crew: 199900 };
      return prices[tier as keyof typeof prices] || 159900;
    });

    // Setup mock subscription
    mockSubscription = {
      subscription_id: 'sub-db-integration',
      user_id: mockUser.id,
      razorpay_subscription_id: 'raz_sub_integration',
      razorpay_plan_id: 'plan_navigator_monthly',
      razorpay_customer_id: 'cust_integration',
      status: 'active',
      plan_name: 'Navigator Plan (Monthly)',
      plan_amount: 39000,
      plan_currency: 'INR',
      plan_period: 'monthly',
      plan_interval: 1,
      subscription_tier: 'navigator',
      start_date: '2025-10-29T12:00:00.000Z',
      end_date: '2025-11-29T12:00:00.000Z',
      current_start: '2025-10-29T12:00:00.000Z',
      current_end: '2025-11-29T12:00:00.000Z',
      next_billing_date: '2025-11-29T12:00:00.000Z',
      short_url: 'https://rzp.io/i/integration-test',
      metadata: {
        billing_cycle: 'monthly',
        seats: '1',
        plan_price_per_seat: '159900',
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Subscription Flow', () => {
    it('should handle full subscription lifecycle: create -> verify -> cancel', async () => {
      // 1. Setup existing user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'explorer',
          full_name: 'Integration Test User',
          user_id: mockUser.id,
        },
        error: null,
      });

      // 2. Check for existing subscriptions (none found)
      mockSupabase.order.mockResolvedValueOnce({
        data: [], // No existing subscriptions
        error: null,
      });

      // 3. Mock Razorpay customer creation
      const mockCustomer = {
        id: 'cust_integration',
        name: 'Integration Test User',
        email: mockUser.email,
      };

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue(mockCustomer);

      // 4. Mock Razorpay subscription creation
      const mockRazorpaySubscription = {
        id: 'raz_sub_integration',
        status: 'created',
        short_url: 'https://rzp.io/i/integration-test',
        plan: {
          name: 'Navigator Plan (Monthly)',
          amount: 39000,
          currency: 'INR',
        },
        current_start: 1698576000,
        current_end: 1701254400,
        total_count: 12,
        paid_count: 0,
        remaining_count: 12,
      };

      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockRazorpaySubscription);

      // 5. Mock database insertion
      mockSupabase.insert.mockResolvedValueOnce({
        data: mockSubscription,
        error: null,
      });

      // 6. Create subscription request
      const createRequest = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: {
            'x-forwarded-for': '192.168.1.100',
          },
          body: {
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Integration Test User',
              email: mockUser.email,
            },
          },
        }
      );

      const createResponse = await CreateSubscription(createRequest);
      const createData = await createResponse.json();

      // 7. Verify subscription creation
      expect(createResponse.status).toBe(200);
      expect(createData.success).toBe(true);
      expect(createData.data.subscription.subscriptionId).toBe('raz_sub_integration');
      expect(createData.data.subscription.tier).toBe('navigator');

      // 8. Mock payment verification setup
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSubscription,
        error: null,
      });

      // Mock Razorpay payment fetch
      const mockPayment = {
        id: 'pay_integration',
        entity: 'payment',
        amount: 39000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_integration',
        invoice_id: null,
        international: false,
        method: 'card',
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: 'Navigator Plan (Monthly) - Integration Test User',
        card_id: 'card_integration',
        bank: null,
        wallet: null,
        vpa: null,
        email: mockUser.email,
        contact: null,
        notes: {
          subscription_id: 'raz_sub_integration',
        },
        fee: 870,
        tax: 130,
        error_code: null,
        error_description: null,
        error_source: null,
        error_step: null,
        error_reason: null,
        acquirer_data: {
          auth_code: '123456',
        },
        created_at: 1698576000,
      };

      (razorpayClient.payments.fetch as any).mockResolvedValue(mockPayment);

      // 9. Create payment verification request
      const verifyRequest = createMockRequest(
        'http://localhost:3000/api/subscriptions/verify-payment',
        {
          body: {
            razorpay_payment_id: 'pay_integration',
            razorpay_subscription_id: 'raz_sub_integration',
            razorpay_signature: 'test_signature',
          },
        }
      );

      const verifyResponse = await VerifyPayment(verifyRequest);
      const verifyData = await verifyResponse.json();

      // 10. Verify payment verification
      expect(verifyResponse.status).toBe(200);
      expect(verifyData.success).toBe(true);
      expect(verifyData.data.paymentVerified).toBe(true);

      // 11. Setup for cancellation
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSubscription,
        error: null,
      });

      // Mock Razorpay subscription fetch and cancellation
      (razorpayClient.subscriptions.fetch as any).mockResolvedValue({
        ...mockRazorpaySubscription,
        status: 'active',
      });

      (razorpayClient.subscriptions.cancel as any).mockResolvedValue({
        id: 'raz_sub_integration',
        status: 'cancelled',
        end_at: 1701254400,
      });

      // Mock database update for cancellation
      mockSupabase.update.mockResolvedValueOnce({
        data: {
          ...mockSubscription,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        },
        error: null,
      });

      // 12. Create cancellation request
      const cancelRequest = createMockRequest('http://localhost:3000/api/subscriptions/cancel', {
        body: {
          cancelAtCycleEnd: false,
          reason: 'Integration test cancellation',
        },
      });

      const cancelResponse = await CancelSubscription(cancelRequest);
      const cancelData = await cancelResponse.json();

      // 13. Verify cancellation
      expect(cancelResponse.status).toBe(200);
      expect(cancelData.success).toBe(true);
      expect(cancelData.data.subscriptionId).toBe('raz_sub_integration');
      expect(cancelData.data.cancelledAtCycleEnd).toBe(false);

      // 14. Verify all API calls were made correctly
      expect(razorpayClient.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Integration Test User',
          email: mockUser.email,
        })
      );

      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: 'plan_navigator_monthly',
          customer_id: 'cust_integration',
          total_count: 12,
        })
      );

      expect(razorpayClient.payments.fetch).toHaveBeenCalledWith('pay_integration');

      expect(razorpayClient.subscriptions.cancel).toHaveBeenCalledWith('raz_sub_integration');
    });
  });

  describe('Webhook Integration', () => {
    it('should process subscription.activated webhook event', async () => {
      // Setup existing subscription in database
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          ...mockSubscription,
          status: 'created', // Initial status before activation
        },
        error: null,
      });

      // Mock database update for activation
      mockSupabase.update.mockResolvedValueOnce({
        data: {
          ...mockSubscription,
          status: 'active',
          activated_at: new Date().toISOString(),
        },
        error: null,
      });

      // Create webhook payload
      const webhookPayload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'raz_sub_integration',
            status: 'active',
            customer_id: 'cust_integration',
            plan_id: 'plan_navigator_monthly',
            current_start: 1698576000,
            current_end: 1701254400,
            total_count: 12,
            paid_count: 1,
            remaining_count: 11,
            notes: {
              user_id: mockUser.id,
              subscription_tier: 'navigator',
            },
          },
          payment: {
            id: 'pay_integration',
            entity: 'payment',
            amount: 39000,
            currency: 'INR',
            status: 'captured',
          },
        },
      };

      // Create webhook request with signature
      const webhookRequest = createMockRequest('http://localhost:3000/api/webhooks/razorpay', {
        headers: {
          'x-razorpay-signature': 'test_webhook_signature',
        },
        body: webhookPayload,
      });

      const webhookResponse = await WebhookHandler(webhookRequest);
      const webhookData = await webhookResponse.json();

      // Verify webhook processing
      expect(webhookResponse.status).toBe(200);
      expect(webhookData.success).toBe(true);
      expect(webhookData.data.eventProcessed).toBe(true);

      // Verify database was updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('should handle payment.failed webhook event', async () => {
      // Setup existing subscription
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSubscription,
        error: null,
      });

      // Mock database update for payment failure
      mockSupabase.update.mockResolvedValueOnce({
        data: {
          ...mockSubscription,
          status: 'payment_failed',
          payment_failed_at: new Date().toISOString(),
        },
        error: null,
      });

      // Create payment failed webhook payload
      const webhookPayload = {
        event: 'payment.failed',
        payload: {
          payment: {
            id: 'pay_failed',
            entity: 'payment',
            amount: 39000,
            currency: 'INR',
            status: 'failed',
            order_id: 'order_integration',
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'The payment could not be processed',
            notes: {
              subscription_id: 'raz_sub_integration',
            },
          },
        },
      };

      const webhookRequest = createMockRequest('http://localhost:3000/api/webhooks/razorpay', {
        headers: {
          'x-razorpay-signature': 'test_webhook_signature',
        },
        body: webhookPayload,
      });

      const webhookResponse = await WebhookHandler(webhookRequest);
      const webhookData = await webhookResponse.json();

      // Verify webhook processing
      expect(webhookResponse.status).toBe(200);
      expect(webhookData.success).toBe(true);

      // Verify database was updated with payment failure
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'payment_failed',
        })
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database failures gracefully across the flow', async () => {
      // 1. Setup user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'explorer', full_name: 'Test User' },
        error: null,
      });

      // 2. No existing subscriptions
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // 3. Customer creation succeeds
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({
        id: 'cust_integration',
        name: 'Test User',
        email: mockUser.email,
      });

      // 4. Razorpay subscription creation succeeds
      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_integration',
        status: 'created',
        short_url: 'https://rzp.io/i/integration-test',
      });

      // 5. Database insertion fails
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: '23505' },
      });

      // 6. Mock subscription cancellation (cleanup)
      (razorpayClient.subscriptions.cancel as any).mockResolvedValue({});

      // 7. Create subscription request
      const createRequest = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: {
            'x-forwarded-for': '192.168.1.200',
          },
          body: {
            tier: 'navigator',
            billingCycle: 'monthly',
          },
        }
      );

      const createResponse = await CreateSubscription(createRequest);
      const createData = await createResponse.json();

      // 8. Verify error handling
      expect(createResponse.status).toBe(500);
      expect(createData.success).toBe(false);
      expect(createData.error.code).toBe('DATABASE_ERROR');
      expect(createData.error.details.subscriptionCancelled).toBe(true);

      // 9. Verify cleanup was performed
      expect(razorpayClient.subscriptions.cancel).toHaveBeenCalledWith('raz_sub_integration');
    });
  });

  describe('Subscription Upgrade Flow', () => {
    it('should allow upgrade from navigator to voyager tier', async () => {
      // 1. Setup user with existing navigator subscription
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'navigator', full_name: 'Test User' },
        error: null,
      });

      // 2. Existing subscription found (lower tier)
      mockSupabase.order.mockResolvedValueOnce({
        data: [
          {
            subscription_id: 'sub-existing',
            razorpay_subscription_id: 'raz_sub_existing',
            status: 'active',
            subscription_tier: 'navigator',
            plan_name: 'Navigator Plan (Monthly)',
            next_billing_date: '2025-11-29T12:00:00.000Z',
          },
        ],
        error: null,
      });

      // 3. Create new customer for upgrade
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({
        id: 'cust_upgrade',
        name: 'Test User',
        email: mockUser.email,
      });

      // 4. Create upgraded subscription
      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_upgrade',
        status: 'created',
        short_url: 'https://rzp.io/i/upgrade-test',
        plan: {
          name: 'Voyager Plan (Monthly)',
          amount: 79000,
          currency: 'INR',
        },
      });

      // 5. Store upgraded subscription
      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          ...mockSubscription,
          subscription_id: 'sub-upgrade',
          razorpay_subscription_id: 'raz_sub_upgrade',
          subscription_tier: 'voyager',
          plan_name: 'Voyager Plan (Monthly)',
          plan_amount: 79000,
        },
        error: null,
      });

      // 6. Create upgrade request
      const upgradeRequest = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: {
            'x-forwarded-for': '192.168.1.300',
          },
          body: {
            tier: 'voyager', // Higher tier
            billingCycle: 'monthly',
          },
        }
      );

      const upgradeResponse = await CreateSubscription(upgradeRequest);
      const upgradeData = await upgradeResponse.json();

      // 7. Verify upgrade was allowed
      expect(upgradeResponse.status).toBe(200);
      expect(upgradeData.success).toBe(true);
      expect(upgradeData.data.subscription.tier).toBe('voyager');
      expect(upgradeData.data.subscription.planAmount).toBe(79000);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency through the subscription lifecycle', async () => {
      // Create a consistent data set that flows through all operations
      const consistentUserId = 'user-consistency-test';
      const consistentEmail = 'consistency@example.com';
      const consistentTier = 'navigator';
      const consistentBillingCycle = 'monthly';

      // Mock user session
      (getServerSession as any).mockResolvedValue({
        session: {
          user: {
            id: consistentUserId,
            email: consistentEmail,
            user_metadata: { full_name: 'Consistency Test User' },
          },
        },
      });

      // Mock user profile lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'explorer',
          full_name: 'Consistency Test User',
          user_id: consistentUserId,
        },
        error: null,
      });

      // Verify no existing subscriptions
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock customer creation with consistent data
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({
        id: 'cust_consistency',
        name: 'Consistency Test User',
        email: consistentEmail,
      });

      // Mock subscription creation with consistent data
      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_consistency',
        status: 'created',
        short_url: 'https://rzp.io/i/consistency-test',
        plan: {
          name: `${consistentTier.charAt(0).toUpperCase() + consistentTier.slice(1)} Plan (${consistentBillingCycle})`,
          amount: 39000,
          currency: 'INR',
        },
        current_start: 1698576000,
        current_end: 1701254400,
      });

      // Mock database storage with consistent data
      const consistentSubscriptionData = {
        user_id: consistentUserId,
        razorpay_subscription_id: 'raz_sub_consistency',
        razorpay_plan_id: `plan_${consistentTier}_${consistentBillingCycle}`,
        razorpay_customer_id: 'cust_consistency',
        status: 'created',
        plan_name: `${consistentTier.charAt(0).toUpperCase() + consistentTier.slice(1)} Plan (${consistentBillingCycle})`,
        plan_amount: 39000,
        plan_currency: 'INR',
        plan_period: consistentBillingCycle,
        plan_interval: 1,
        subscription_tier: consistentTier,
        metadata: {
          billing_cycle: consistentBillingCycle,
          seats: '1',
          plan_price_per_seat: '159900',
          user_metadata: { source: 'consistency_test' },
        },
      };

      mockSupabase.insert.mockResolvedValueOnce({
        data: consistentSubscriptionData,
        error: null,
      });

      // Create subscription
      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: {
            'x-forwarded-for': '192.168.1.400',
          },
          body: {
            tier: consistentTier,
            billingCycle: consistentBillingCycle,
            customerInfo: {
              name: 'Consistency Test User',
              email: consistentEmail,
            },
            metadata: { source: 'consistency_test' },
          },
        }
      );

      const response = await CreateSubscription(request);
      const data = await response.json();

      // Verify data consistency
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.tier).toBe(consistentTier);
      expect(data.data.subscription.billingCycle).toBe(consistentBillingCycle);
      expect(data.data.subscription.customerName).toBe('Consistency Test User');
      expect(data.data.subscription.customerEmail).toBe(consistentEmail);

      // Verify all API calls used consistent data
      expect(razorpayClient.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Consistency Test User',
          email: consistentEmail,
          notes: expect.objectContaining({
            user_id: consistentUserId,
            source: 'polaris_v3',
            subscription_metadata: JSON.stringify({ source: 'consistency_test' }),
          }),
        })
      );

      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: `plan_${consistentTier}_${consistentBillingCycle}`,
          customer_id: 'cust_consistency',
          notes: expect.objectContaining({
            user_id: consistentUserId,
            subscription_tier: consistentTier,
            billing_cycle: consistentBillingCycle,
          }),
        })
      );
    });
  });
});
