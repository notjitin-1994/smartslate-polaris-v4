/**
 * Unit Tests for POST /api/subscriptions/create-subscription
 *
 * @description Comprehensive unit tests for subscription creation API route
 * @version 1.0.0
 * @date 2025-10-29
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Setup environment variables before module imports
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET = 'rzp_test_secret_key_1234567890';
  process.env.NODE_ENV = 'test';
});

// Mock external dependencies
vi.mock('@/lib/razorpay/client', () => ({
  razorpayClient: {
    customers: {
      all: vi.fn(),
      create: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      cancel: vi.fn(),
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

describe('POST /api/subscriptions/create-subscription', () => {
  let mockSupabase: any;
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();

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
    };

    (getSupabaseServerClient as any).mockResolvedValue(mockSupabase);

    // Setup mock request with unique IP for each test
    const uniqueIp = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
    mockRequest = {
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return uniqueIp;
          if (header === 'x-real-ip') return undefined;
          return undefined;
        }),
      },
      json: vi.fn(),
    };

    // Setup default successful responses
    (validateCreateSubscriptionRequest as any).mockReturnValue({
      success: true,
      data: {
        tier: 'navigator',
        billingCycle: 'monthly',
        seats: undefined,
        customerInfo: { name: 'Test User', email: 'test@example.com' },
        metadata: { source: 'test' },
      },
    });

    (getServerSession as any).mockResolvedValue({
      session: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        },
      },
    });

    (getPlanId as any).mockReturnValue('plan_navigator_monthly');
    (getPlanPrice as any).mockReturnValue(39000); // ₹390 in paise

    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.in.mockReturnValue(mockSupabase);
    mockSupabase.is.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.single.mockResolvedValue({
      data: { subscription_tier: 'explorer', full_name: 'Test User' },
      error: null,
    });
    mockSupabase.insert.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue({ session: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe(
        'Authentication required. Please sign in to create a subscription.'
      );
    });

    it('should return 401 if session exists but user is missing', async () => {
      (getServerSession as any).mockResolvedValue({
        session: { user: null },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for invalid JSON', async () => {
      mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_JSON');
      expect(data.error.message).toBe('Invalid JSON in request body');
    });

    it('should return 400 for validation errors', async () => {
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: false,
        error: {
          flatten: vi.fn(() => ({
            fieldErrors: { tier: ['Invalid tier'] },
            formErrors: [],
          })),
        },
      });

      mockRequest.json.mockResolvedValue({ tier: 'invalid_tier' });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid request parameters');
      expect(data.error.details.validationErrors).toBeDefined();
    });

    it('should return 400 when team tier missing seats', async () => {
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: true,
        data: {
          tier: 'crew',
          billingCycle: 'monthly',
          seats: undefined, // Missing seats for team tier
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Seats are required for crew tier');
    });

    it('should return 400 when individual tier includes seats', async () => {
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: true,
        data: {
          tier: 'navigator',
          billingCycle: 'monthly',
          seats: 5, // Seats not allowed for individual tier
        },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Seats are not allowed for navigator tier');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);

      // Should not return rate limit error
      expect(response.status).not.toBe(429);
    });

    it('should return 429 when rate limit exceeded', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(15)
        .fill(null)
        .map(() => POST(mockRequest));

      const lastResponse = await requests[requests.length - 1];
      const data = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(data.error.message).toBe('Too many requests. Please try again later.');
      expect(data.error.details.resetTime).toBeDefined();
    });
  });

  describe('Plan Configuration', () => {
    it('should return 400 if plan is not configured', async () => {
      (getPlanId as any).mockReturnValue(null); // Plan not found

      mockRequest.json.mockResolvedValue({
        tier: 'invalid_tier',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('PLAN_NOT_CONFIGURED');
      expect(data.error.message).toContain('Plan not configured for invalid_tier tier');
    });
  });

  describe('Duplicate Subscription Prevention', () => {
    it('should prevent duplicate subscription for same tier', async () => {
      // Mock existing active subscription
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'navigator', full_name: 'Test User' },
        error: null,
      });

      mockSupabase.order.mockResolvedValue({
        data: [
          {
            subscription_id: 'sub-existing',
            razorpay_subscription_id: 'raz_sub_existing',
            status: 'active',
            subscription_tier: 'navigator',
            plan_name: 'Navigator Plan (Monthly)',
            next_billing_date: '2025-11-29T00:00:00.000Z',
          },
        ],
        error: null,
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('DUPLICATE_SUBSCRIPTION');
      expect(data.error.message).toContain('already have an active navigator subscription');
    });

    it('allow upgrade to higher tier', async () => {
      // Mock existing active subscription of lower tier
      mockSupabase.single.mockResolvedValueOnce({
        data: { subscription_tier: 'navigator', full_name: 'Test User' },
        error: null,
      });

      mockSupabase.order.mockResolvedValue({
        data: [
          {
            subscription_id: 'sub-existing',
            razorpay_subscription_id: 'raz_sub_existing',
            status: 'active',
            subscription_tier: 'navigator',
            plan_name: 'Navigator Plan (Monthly)',
            next_billing_date: '2025-11-29T00:00:00.000Z',
          },
        ],
        error: null,
      });

      // Request higher tier
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: true,
        data: {
          tier: 'voyager', // Higher tier than navigator
          billingCycle: 'monthly',
        },
      });

      mockRequest.json.mockResolvedValue({
        tier: 'voyager',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);

      // Should not return duplicate error for upgrade
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
    });
  });

  describe('Razorpay Integration', () => {
    it('should create subscription successfully with valid data', async () => {
      const mockCustomer = {
        id: 'cust_test123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockSubscription = {
        id: 'raz_sub_test123',
        status: 'created',
        short_url: 'https://rzp.io/i/test-subscription',
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

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] }); // No existing customer
      (razorpayClient.customers.create as any).mockResolvedValue(mockCustomer);
      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockSubscription);

      mockSupabase.insert.mockResolvedValue({
        data: { subscription_id: 'sub-db-123' },
        error: null,
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
        customerInfo: { name: 'Test User', email: 'test@example.com' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      // Debug: log the actual response if it fails
      if (response.status !== 200) {
        console.log('Actual response status:', response.status);
        console.log('Actual response data:', data);
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Subscription created successfully');
      expect(data.data.subscription.subscriptionId).toBe('raz_sub_test123');
      expect(data.data.subscription.customerId).toBe('cust_test123');
      expect(data.data.subscription.tier).toBe('navigator');

      // Verify Razorpay API calls
      expect(razorpayClient.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          notes: expect.objectContaining({
            user_id: 'test-user-id',
            source: 'polaris_v3',
          }),
        })
      );

      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: 'plan_navigator_monthly',
          customer_id: 'cust_test123',
          total_count: 12,
          notes: expect.objectContaining({
            user_id: 'test-user-id',
            subscription_tier: 'navigator',
            billing_cycle: 'monthly',
          }),
        })
      );
    });

    it('should use existing customer if found', async () => {
      const mockExistingCustomer = {
        id: 'cust_existing123',
        name: 'Test User',
        email: 'test@example.com',
      };

      (razorpayClient.customers.all as any).mockResolvedValue({
        items: [mockExistingCustomer],
      });

      const mockSubscription = {
        id: 'raz_sub_test123',
        status: 'created',
        short_url: 'https://rzp.io/i/test-subscription',
      };

      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockSubscription);
      mockSupabase.insert.mockResolvedValue({
        data: { subscription_id: 'sub-db-123' },
        error: null,
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);

      // Should not create new customer
      expect(razorpayClient.customers.create).not.toHaveBeenCalled();

      // Should use existing customer for subscription
      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 'cust_existing123',
        })
      );
    });

    it('should return 500 when Razorpay customer creation fails', async () => {
      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockRejectedValue({
        error: {
          code: 'INVALID_EMAIL',
          description: 'Invalid email format',
        },
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('RAZORPAY_CUSTOMER_ERROR');
      expect(data.error.message).toBe('Failed to create or retrieve customer in Razorpay');
      expect(data.error.details.originalError).toBe('Invalid email format');
      expect(data.error.details.errorCode).toBe('INVALID_EMAIL');
    });

    it('should return 500 when Razorpay subscription creation fails', async () => {
      const mockCustomer = { id: 'cust_test123', email: 'test@example.com' };

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue(mockCustomer);
      (razorpayClient.subscriptions.create as any).mockRejectedValue({
        error: {
          code: 'INVALID_PLAN',
          description: 'Plan does not exist',
        },
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('RAZORPAY_SUBSCRIPTION_ERROR');
      expect(data.error.message).toBe('Failed to create subscription in Razorpay');
      expect(data.error.details.originalError).toBe('Plan does not exist');
      expect(data.error.details.errorCode).toBe('INVALID_PLAN');
    });
  });

  describe('Database Operations', () => {
    it('should create user profile if it does not exist', async () => {
      // Profile doesn't exist (PGRST116 error)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock successful profile creation
      mockSupabase.insert.mockResolvedValueOnce({
        data: { subscription_tier: 'explorer', full_name: 'Test User' },
        error: null,
      });

      const mockSubscription = {
        id: 'raz_sub_test123',
        status: 'created',
        short_url: 'https://rzp.io/i/test-subscription',
      };

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({ id: 'cust_test123' });
      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockSubscription);

      mockSupabase.insert.mockResolvedValueOnce({
        data: { subscription_id: 'sub-db-123' },
        error: null,
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);

      expect(response.status).toBe(200);

      // Verify profile creation
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          subscription_tier: 'explorer',
          user_role: 'explorer',
          full_name: 'Test User',
          blueprint_creation_count: 0,
          blueprint_saving_count: 0,
          blueprint_creation_limit: 2,
          blueprint_saving_limit: 2,
        })
      );
    });

    it('should return 500 when database insertion fails and cancel Razorpay subscription', async () => {
      const mockSubscription = {
        id: 'raz_sub_test123',
        status: 'created',
      };

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({ id: 'cust_test123' });
      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockSubscription);

      // Database insertion fails
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: '23505' },
      });

      // Mock subscription cancellation
      (razorpayClient.subscriptions.cancel as any).mockResolvedValue({});

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toContain('Failed to store subscription in database');
      expect(data.error.details.subscriptionCancelled).toBe(true);

      // Verify subscription was cancelled
      expect(razorpayClient.subscriptions.cancel).toHaveBeenCalledWith('raz_sub_test123');
    });
  });

  describe('Response Structure', () => {
    it('should return structured success response with all required fields', async () => {
      const mockCustomer = {
        id: 'cust_test123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockSubscription = {
        id: 'raz_sub_test123',
        status: 'created',
        short_url: 'https://rzp.io/i/test-subscription',
        plan: {
          name: 'Navigator Plan (Monthly)',
          amount: 39000,
          currency: 'INR',
        },
        current_start: 1698576000,
        current_end: 1701254400,
      };

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue(mockCustomer);
      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockSubscription);

      mockSupabase.insert.mockResolvedValue({
        data: { subscription_id: 'sub-db-123' },
        error: null,
      });

      mockRequest.json.mockResolvedValue({
        tier: 'navigator',
        billingCycle: 'monthly',
        customerInfo: { name: 'Test User', email: 'test@example.com' },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        requestId: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
        data: {
          message: 'Subscription created successfully',
          subscription: {
            subscriptionId: 'raz_sub_test123',
            customerId: 'cust_test123',
            shortUrl: 'https://rzp.io/i/test-subscription',
            status: 'created',
            planName: 'Navigator Plan (Monthly)',
            planAmount: 39000,
            planCurrency: 'INR',
            billingCycle: 'monthly',
            tier: 'navigator',
            seats: undefined,
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            nextBillingDate: expect.any(String),
            currentStart: expect.any(String),
          },
        },
      });
    });

    it('should include request ID in error responses', async () => {
      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: false,
        error: { flatten: vi.fn(() => ({ fieldErrors: {}, formErrors: [] })) },
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(data.success).toBe(false);
      expect(data.error.requestId).toBeUndefined(); // requestId should be at top level
    });
  });

  describe('Team Tier Support', () => {
    it('should create subscription for team tier with seats', async () => {
      const mockSubscription = {
        id: 'raz_sub_test123',
        status: 'created',
        short_url: 'https://rzp.io/i/test-subscription',
        plan: {
          name: 'Crew Plan (Monthly)',
          amount: 199900, // Price per seat
          currency: 'INR',
        },
      };

      (validateCreateSubscriptionRequest as any).mockReturnValue({
        success: true,
        data: {
          tier: 'crew',
          billingCycle: 'monthly',
          seats: 5, // 5 seats for team tier
        },
      });

      (getPlanId as any).mockReturnValue('plan_crew_monthly');
      (getPlanPrice as any).mockReturnValue(199900); // ₹1,999 per seat

      (razorpayClient.customers.all as any).mockResolvedValue({ items: [] });
      (razorpayClient.customers.create as any).mockResolvedValue({ id: 'cust_test123' });
      (razorpayClient.subscriptions.create as any).mockResolvedValue(mockSubscription);

      mockSupabase.insert.mockResolvedValue({
        data: { subscription_id: 'sub-db-123' },
        error: null,
      });

      mockRequest.json.mockResolvedValue({
        tier: 'crew',
        billingCycle: 'monthly',
        seats: 5,
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.subscription.tier).toBe('crew');
      expect(data.data.subscription.seats).toBe(5);

      // Verify correct plan amount calculation
      expect(razorpayClient.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.objectContaining({
            seats: '5',
          }),
        })
      );
    });
  });
});

describe('GET /api/subscriptions/create-subscription', () => {
  it('should return 405 for GET requests', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    expect(data.error.message).toBe('Only POST method is allowed for this endpoint');
  });
});
