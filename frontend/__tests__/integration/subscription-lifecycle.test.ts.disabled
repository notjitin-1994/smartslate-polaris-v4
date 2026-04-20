/**
 * Integration Tests for Subscription Lifecycle
 *
 * @description Integration tests for subscription creation and management
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
  },
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

vi.mock('@/lib/schemas/razorpaySubscription', () => ({
  validateCreateSubscriptionRequest: vi.fn(),
  CreateSubscriptionRequestSchema: {},
  CreateSubscriptionResponseSchema: {},
  ErrorResponseSchema: {},
}));

// Import after mocking
import { POST, GET } from '@/app/api/subscriptions/create-subscription/route';
import { razorpayClient } from '@/lib/razorpay/client';
import { getSupabaseServerClient, getServerSession } from '@/lib/supabase/server';
import { getPlanId, getPlanPrice } from '@/lib/config/razorpayPlans';
import { validateCreateSubscriptionRequest } from '@/lib/schemas/razorpaySubscription';

describe('Subscription Lifecycle Integration Tests', () => {
  let mockSupabase: any;
  let mockUser: any;

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

    (validateCreateSubscriptionRequest as any).mockReturnValue({
      success: true,
      data: {
        tier: 'navigator',
        billingCycle: 'monthly',
        customerInfo: { name: 'Test User', email: 'test@example.com' },
        metadata: {},
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Subscription Creation Flow', () => {
    it('should successfully create a new subscription', async () => {
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

      // 3. Mock Razorpay customer creation (no existing customer)
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({
        id: 'cust_integration',
        name: 'Integration Test User',
        email: mockUser.email,
      });

      // 4. Mock Razorpay subscription creation
      (razorpayClient.subscriptions.create as any).mockResolvedValue({
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
      });

      // 5. Mock database insertion
      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          subscription_id: 'sub-db-integration',
          user_id: mockUser.id,
          razorpay_subscription_id: 'raz_sub_integration',
          razorpay_customer_id: 'cust_integration',
          status: 'created',
          plan_name: 'Navigator Plan (Monthly)',
          plan_amount: 39000,
          plan_currency: 'INR',
          subscription_tier: 'navigator',
          short_url: 'https://rzp.io/i/integration-test',
        },
        error: null,
      });

      // 6. Create subscription request
      const request = createMockRequest(
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

      const response = await POST(request);
      const data = await response.json();

      // 7. Verify successful subscription creation
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.subscriptionId).toBe('raz_sub_integration');
      expect(data.data.subscription.tier).toBe('navigator');
      expect(data.data.subscription.customerId).toBe('cust_integration');
      expect(data.data.subscription.planAmount).toBe(39000);
      expect(data.data.subscription.shortUrl).toBe('https://rzp.io/i/integration-test');

      // 8. Verify all external API calls were made correctly
      expect(razorpayClient.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Integration Test User',
          email: mockUser.email,
          notes: expect.objectContaining({
            user_id: mockUser.id,
            source: 'polaris_v3',
          }),
        })
      );

      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: 'plan_navigator_monthly',
          customer_id: 'cust_integration',
          total_count: 12,
          customer_notify: 1,
          notes: expect.objectContaining({
            user_id: mockUser.id,
            subscription_tier: 'navigator',
            billing_cycle: 'monthly',
          }),
        })
      );

      // 9. Verify database insertion
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          razorpay_subscription_id: 'raz_sub_integration',
          subscription_tier: 'navigator',
          plan_amount: 39000,
        })
      );
    });

    it('should reuse existing customer when available', async () => {
      // 1. Setup existing user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'explorer', full_name: 'Test User' },
        error: null,
      });

      // 2. No existing subscriptions
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // 3. Existing customer found in Razorpay
      (razorpayClient.customers.all as any).mockResolvedValue({
        items: [
          {
            id: 'cust_existing',
            name: 'Test User',
            email: mockUser.email,
          },
        ],
      });

      // 4. Create new subscription for existing customer
      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_existing_customer',
        status: 'created',
        short_url: 'https://rzp.io/i/existing-customer',
      });

      // 5. Database insertion
      mockSupabase.insert.mockResolvedValueOnce({
        data: { subscription_id: 'sub-existing' },
        error: null,
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: { 'x-forwarded-for': '192.168.1.200' },
          body: {
            tier: 'navigator',
            billingCycle: 'monthly',
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Verify success
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.customerId).toBe('cust_existing');

      // Verify existing customer was reused
      expect(razorpayClient.customers.create).not.toHaveBeenCalled();
      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'cust_existing',
        })
      );
    });

    it('should handle team tier subscription with multiple seats', async () => {
      // 1. Setup user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'explorer', full_name: 'Team User' },
        error: null,
      });

      // 2. No existing subscriptions
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // 3. Setup team tier validation
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: true,
        data: {
          tier: 'crew',
          billingCycle: 'monthly',
          seats: 5, // Team tier with multiple seats
        },
      });

      // 4. Mock customer and subscription creation
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({
        id: 'cust_team',
        name: 'Team User',
        email: 'team@example.com',
      });

      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_team',
        status: 'created',
        plan: {
          name: 'Crew Plan (Monthly)',
          amount: 999500, // 199900 * 5 seats
          currency: 'INR',
        },
      });

      // 5. Database insertion
      mockSupabase.insert.mockResolvedValueOnce({
        data: { subscription_id: 'sub-team' },
        error: null,
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: { 'x-forwarded-for': '192.168.1.300' },
          body: {
            tier: 'crew',
            billingCycle: 'monthly',
            seats: 5,
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Verify team tier subscription
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.tier).toBe('crew');
      expect(data.data.subscription.planAmount).toBe(120000); // 5 seats * ₹240

      // Verify seats information was stored
      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.objectContaining({
            seats: '5',
          }),
        })
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication failure', async () => {
      // Mock unauthenticated session
      (getServerSession as any).mockResolvedValue({ session: null });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          body: { tier: 'navigator', billingCycle: 'monthly' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle validation errors', async () => {
      // Mock validation failure
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: false,
        error: {
          flatten: vi.fn(() => ({
            fieldErrors: { tier: ['Invalid tier'] },
            formErrors: [],
          })),
        },
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          body: { tier: 'invalid_tier', billingCycle: 'invalid_cycle' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Razorpay customer creation failure', async () => {
      // Setup user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'explorer', full_name: 'Test User' },
        error: null,
      });

      // No existing subscriptions
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Customer creation fails
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockRejectedValue({
        error: {
          code: 'INVALID_EMAIL',
          description: 'Invalid email format',
        },
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: { 'x-forwarded-for': '192.168.1.400' },
          body: { tier: 'navigator', billingCycle: 'monthly' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RAZORPAY_CUSTOMER_ERROR');
    });

    it('should handle database insertion failure and cleanup', async () => {
      // Setup user profile
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'explorer', full_name: 'Test User' },
        error: null,
      });

      // No existing subscriptions
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Customer and subscription creation succeed
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({
        id: 'cust_cleanup',
        name: 'Test User',
        email: mockUser.email,
      });

      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_cleanup',
        status: 'created',
      });

      // Database insertion fails
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed', code: '23505' },
      });

      // Mock subscription cleanup
      (razorpayClient.subscriptions.cancel as any).mockResolvedValue({});

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: { 'x-forwarded-for': '192.168.1.500' },
          body: { tier: 'navigator', billingCycle: 'monthly' },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.details.subscriptionCancelled).toBe(true);

      // Verify cleanup was performed
      expect(razorpayClient.subscriptions.cancel).toHaveBeenCalledWith('raz_sub_cleanup');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data through the subscription flow', async () => {
      const consistentUserId = 'user-consistency-test';
      const consistentEmail = 'consistency@example.com';
      const consistentTier = 'navigator';

      // Mock user session with consistent data
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

      // No existing subscriptions
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

      // Mock subscription creation
      (razorpayClient.subscriptions.create as any).mockResolvedValue({
        id: 'raz_sub_consistency',
        status: 'created',
        short_url: 'https://rzp.io/i/consistency',
        plan: {
          name: 'Navigator Plan (Monthly)',
          amount: 39000,
          currency: 'INR',
        },
      });

      // Mock database insertion with consistent data
      mockSupabase.insert.mockResolvedValueOnce({
        data: {
          user_id: consistentUserId,
          razorpay_subscription_id: 'raz_sub_consistency',
          razorpay_customer_id: 'cust_consistency',
          subscription_tier: consistentTier,
          plan_name: 'Navigator Plan (Monthly)',
          plan_amount: 39000,
          metadata: {
            customer_info: { email: consistentEmail },
          },
        },
        error: null,
      });

      const request = createMockRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          headers: { 'x-forwarded-for': '192.168.1.600' },
          body: {
            tier: consistentTier,
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Consistency Test User',
              email: consistentEmail,
            },
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Verify data consistency
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.tier).toBe(consistentTier);
      expect(data.data.subscription.customerName).toBe('Consistency Test User');
      expect(data.data.subscription.customerEmail).toBe(consistentEmail);

      // Verify API calls used consistent data
      expect(razorpayClient.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Consistency Test User',
          email: consistentEmail,
          notes: expect.objectContaining({
            user_id: consistentUserId,
          }),
        })
      );

      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'cust_consistency',
          notes: expect.objectContaining({
            user_id: consistentUserId,
            subscription_tier: consistentTier,
          }),
        })
      );
    });
  });
});

describe('GET /api/subscriptions/create-subscription', () => {
  it('should return 405 for GET requests', async () => {
    const _request = createMockRequest(
      'http://localhost:3000/api/subscriptions/create-subscription',
      {
        method: 'GET',
      }
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    expect(data.error.message).toBe('Only POST method is allowed for this endpoint');
  });
});
