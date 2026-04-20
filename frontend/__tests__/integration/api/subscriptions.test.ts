/**
 * Integration tests for Subscription API routes
 * Tests: /api/subscriptions/verify-payment, /api/subscriptions/cancel, /api/subscriptions/create-subscription
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  POST as verifyPaymentPOST,
  GET as verifyPaymentGET,
} from '@/app/api/subscriptions/verify-payment/route';
import { POST as cancelPOST, GET as cancelGET } from '@/app/api/subscriptions/cancel/route';
import {
  POST as createSubscriptionPOST,
  GET as createSubscriptionGET,
} from '@/app/api/subscriptions/create-subscription/route';

// Mock Razorpay client
const mockRazorpaySubscriptionsFetch = vi.fn();
const mockRazorpaySubscriptionsCancel = vi.fn();
const mockRazorpaySubscriptionsCreate = vi.fn();
const mockRazorpayPlansFetch = vi.fn();
const mockRazorpayCustomersAll = vi.fn();
const mockRazorpayCustomersCreate = vi.fn();

vi.mock('@/lib/razorpay/client', () => ({
  razorpayClient: {
    subscriptions: {
      fetch: (...args: any[]) => mockRazorpaySubscriptionsFetch(...args),
      cancel: (...args: any[]) => mockRazorpaySubscriptionsCancel(...args),
      create: (...args: any[]) => mockRazorpaySubscriptionsCreate(...args),
    },
    plans: {
      fetch: (...args: any[]) => mockRazorpayPlansFetch(...args),
    },
    customers: {
      all: (...args: any[]) => mockRazorpayCustomersAll(...args),
      create: (...args: any[]) => mockRazorpayCustomersCreate(...args),
    },
  },
  cancelSubscription: vi.fn(),
  isTestMode: vi.fn().mockReturnValue(true),
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  getServerSession: vi.fn(),
}));

// Mock rate limiting
vi.mock('@/lib/middleware/rateLimiting', () => ({
  RATE_LIMIT_CONFIGS: {
    SUBSCRIPTION_CREATION: {},
    SUBSCRIPTION_CANCELLATION: {},
  },
  rateLimitMiddleware: vi.fn(() => async () => ({ allowed: true })),
}));

// Mock security headers
vi.mock('@/lib/security/securityHeaders', () => ({
  addApiSecurityHeaders: vi.fn((response) => response),
}));

// Mock transaction system
vi.mock('@/lib/transactions/subscriptionTransactions', () => ({
  executeSubscriptionCancellation: vi.fn(),
}));

// Mock plan configuration
vi.mock('@/lib/config/razorpayPlans', () => ({
  getPlanId: vi.fn((tier: string, cycle: string) => `plan_${tier}_${cycle}`),
  getPlanPrice: vi.fn((tier: string, cycle: string) => {
    const prices: Record<string, Record<string, number>> = {
      explorer: { monthly: 159900, annual: 1599000 },
      navigator: { monthly: 349900, annual: 3499000 },
      voyager: { monthly: 699900, annual: 6999000 },
    };
    return prices[tier]?.[cycle] || 159900;
  }),
}));

// Helper functions
function createMockRequest(options: {
  method: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
}): Request {
  const { method, body, headers = {}, url = 'http://localhost:3000/api/test' } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

async function mockSupabaseAuth(user: any = null, error: Error | null = null): Promise<void> {
  const supabaseModule = await import('@/lib/supabase/server');
  vi.mocked(supabaseModule.getServerSession).mockResolvedValue({
    session: user ? { user } : null,
    error,
  });
}

async function mockSupabaseClient(mockImplementation: any): Promise<void> {
  const supabaseModule = await import('@/lib/supabase/server');
  vi.mocked(supabaseModule.getSupabaseServerClient).mockResolvedValue(mockImplementation);
}

describe('Subscription Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default Razorpay mocks
    mockRazorpaySubscriptionsFetch.mockResolvedValue({
      id: 'sub_mock123',
      plan_id: 'plan_mock',
      status: 'active',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
      paid_count: 1,
      total_count: 12,
      remaining_count: 11,
    });

    mockRazorpaySubscriptionsCancel.mockResolvedValue({
      id: 'sub_mock123',
      status: 'cancelled',
      end_at: Math.floor(Date.now() / 1000) + 2592000,
      changed_at: Math.floor(Date.now() / 1000),
    });

    mockRazorpaySubscriptionsCreate.mockResolvedValue({
      id: 'sub_mock_new',
      plan_id: 'plan_mock',
      customer_id: 'cust_mock',
      status: 'created',
      short_url: 'https://rzp.io/l/mock',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + 2592000,
      total_count: 12,
      paid_count: 0,
      remaining_count: 12,
    });

    mockRazorpayPlansFetch.mockResolvedValue({
      id: 'plan_mock',
      item: {
        name: 'Explorer Monthly',
        amount: 159900,
        currency: 'INR',
      },
    });

    mockRazorpayCustomersAll.mockResolvedValue({
      items: [],
    });

    mockRazorpayCustomersCreate.mockResolvedValue({
      id: 'cust_mock_new',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/subscriptions/verify-payment', () => {
    it('should verify active payment successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'created',
        user_id: 'user-123',
        current_start: new Date().toISOString(),
        current_end: new Date(Date.now() + 2592000000).toISOString(),
      };

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSubscription,
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: { ...mockSubscription, status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_mock123' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('completed');
      expect(data.data.isActive).toBe(true);
      expect(data.data.subscriptionId).toBe('sub_mock123');
    });

    it('should handle processing payment status', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      mockRazorpaySubscriptionsFetch.mockResolvedValue({
        id: 'sub_mock123',
        status: 'authenticated',
        plan_id: 'plan_mock',
      });

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'authenticated',
        user_id: 'user-123',
      };

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_mock123' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('processing');
      expect(data.data.isActive).toBe(false);
    });

    it('should reject invalid JSON', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('INVALID_JSON');
    });

    it('should reject missing subscription ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {},
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('MISSING_SUBSCRIPTION_ID');
    });

    it('should reject unauthenticated requests', async () => {
      await mockSupabaseAuth(null, new Error('No session'));

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_mock123' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle subscription not found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Not found'),
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_notfound' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('SUBSCRIPTION_NOT_FOUND');
    });

    it('should handle Razorpay fetch errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      mockRazorpaySubscriptionsFetch.mockRejectedValue(new Error('Razorpay API error'));

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'created',
        user_id: 'user-123',
      };

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_mock123' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('RAZORPAY_FETCH_ERROR');
    });

    it('should handle cancelled payment status', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      mockRazorpaySubscriptionsFetch.mockResolvedValue({
        id: 'sub_mock123',
        status: 'cancelled',
        plan_id: 'plan_mock',
      });

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'created',
        user_id: 'user-123',
      };

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_mock123' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('cancelled');
      expect(data.data.isActive).toBe(false);
    });

    it('should handle failed payment status', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      mockRazorpaySubscriptionsFetch.mockResolvedValue({
        id: 'sub_mock123',
        status: 'failed',
        plan_id: 'plan_mock',
      });

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'created',
        user_id: 'user-123',
      };

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: { subscriptionId: 'sub_mock123' },
      });

      const response = await verifyPaymentPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('failed');
      expect(data.data.isActive).toBe(false);
    });
  });

  describe('GET /api/subscriptions/verify-payment', () => {
    it('should get subscription status', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'active',
        user_id: 'user-123',
        next_billing_date: new Date(Date.now() + 2592000000).toISOString(),
      };

      await mockSupabaseClient({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/test?subscriptionId=sub_mock123',
      });

      const response = await verifyPaymentGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('active');
      expect(data.data.subscriptionId).toBe('sub_mock123');
    });

    it('should reject GET without subscription ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/test',
      });

      const response = await verifyPaymentGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('MISSING_SUBSCRIPTION_ID');
    });

    it('should reject unauthenticated GET requests', async () => {
      await mockSupabaseAuth(null, new Error('No session'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/test?subscriptionId=sub_mock123',
      });

      const response = await verifyPaymentGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    it('should cancel subscription immediately', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'navigator',
        subscription_status: 'active',
        full_name: 'Test User',
      };

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'active',
        subscription_tier: 'navigator',
        plan_name: 'Navigator Monthly',
        billing_cycle: 'monthly',
        user_id: 'user-123',
        next_billing_date: new Date(Date.now() + 2592000000).toISOString(),
        current_end: new Date(Date.now() + 2592000000).toISOString(),
        metadata: {},
      };

      const { executeSubscriptionCancellation } = await import(
        '@/lib/transactions/subscriptionTransactions'
      );
      vi.mocked(executeSubscriptionCancellation).mockResolvedValue({
        success: true,
        completedSteps: ['cancel-razorpay-subscription', 'update-database'],
        results: {
          'cancel-razorpay-subscription': {
            id: 'sub_mock123',
            status: 'cancelled',
            end_at: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
      });

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockUserProfile,
                  error: null,
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                          data: [mockSubscription],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: { ...mockSubscription, status: 'cancelled' },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'webhook_events') {
            return {
              insert: vi.fn().mockResolvedValue({
                data: {},
                error: null,
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          cancelAtCycleEnd: false,
          reason: 'User requested cancellation',
        },
      });

      const response = await cancelPOST(request);
      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(
          `Cancel immediate test failed with status ${response.status}: ${JSON.stringify(data, null, 2)}`
        );
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.cancelAtCycleEnd).toBe(false);
    });

    it('should cancel subscription at cycle end', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'navigator',
        subscription_status: 'active',
        full_name: 'Test User',
      };

      const mockSubscription = {
        subscription_id: 'db-sub-123',
        razorpay_subscription_id: 'sub_mock123',
        status: 'active',
        subscription_tier: 'navigator',
        plan_name: 'Navigator Monthly',
        billing_cycle: 'monthly',
        user_id: 'user-123',
        next_billing_date: new Date(Date.now() + 2592000000).toISOString(),
        current_end: new Date(Date.now() + 2592000000).toISOString(),
        metadata: {},
      };

      const { executeSubscriptionCancellation } = await import(
        '@/lib/transactions/subscriptionTransactions'
      );
      vi.mocked(executeSubscriptionCancellation).mockResolvedValue({
        success: true,
        completedSteps: ['cancel-razorpay-subscription', 'update-database'],
        results: {
          'cancel-razorpay-subscription': {
            id: 'sub_mock123',
            status: 'active',
            end_at: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
      });

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                          data: [mockSubscription],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: { ...mockSubscription, status: 'active' },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'webhook_events') {
            return {
              insert: vi.fn().mockResolvedValue({
                data: {},
                error: null,
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          cancelAtCycleEnd: true,
          reason: 'User requested cancellation',
        },
      });

      const response = await cancelPOST(request);
      const data = await response.json();

      if (response.status !== 200) {
        console.error('Cancel at cycle end test failed:', data);
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription.cancelAtCycleEnd).toBe(true);
      expect(data.data.subscription.accessUntilDate).toBeDefined();
    });

    it('should reject when no active subscription exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'explorer',
        subscription_status: 'inactive',
        full_name: 'Test User',
      };

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                          data: [],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          cancelAtCycleEnd: false,
        },
      });

      const response = await cancelPOST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NO_ACTIVE_SUBSCRIPTION');
    });

    it('should reject unauthenticated requests', async () => {
      await mockSupabaseAuth(null, new Error('No session'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          cancelAtCycleEnd: false,
        },
      });

      const response = await cancelPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle validation errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          cancelAtCycleEnd: 'invalid', // Should be boolean
        },
      });

      const response = await cancelPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/subscriptions/cancel', () => {
    it('should return method not allowed', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await cancelGET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('POST /api/subscriptions/create-subscription', () => {
    it('should create subscription successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'explorer',
        full_name: 'Test User',
        email: 'test@example.com',
      };

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ subscription_id: 'db-sub-new' }],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator',
          billingCycle: 'monthly',
          customerInfo: {
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.subscription).toBeDefined();
      expect(data.data.subscription.subscriptionId).toBe('sub_mock_new');
      expect(data.data.subscription.shortUrl).toBe('https://rzp.io/l/mock');
    });

    it('should validate seats requirement for team tiers', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'crew',
          billingCycle: 'monthly',
          // Missing seats for team tier
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Seats are required');
    });

    it('should reject seats for individual tiers', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator',
          billingCycle: 'monthly',
          seats: 5, // Individual tier shouldn't have seats
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('not allowed for');
    });

    it('should prevent duplicate active subscriptions', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'navigator',
        full_name: 'Test User',
        email: 'test@example.com',
      };

      const existingSubscription = {
        subscription_id: 'db-sub-existing',
        razorpay_subscription_id: 'sub_existing',
        status: 'active',
        subscription_tier: 'navigator',
        plan_name: 'Navigator Monthly',
        next_billing_date: new Date(Date.now() + 2592000000).toISOString(),
      };

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: [existingSubscription],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_SUBSCRIPTION');
    });

    it('should allow upgrade to higher tier', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'explorer',
        full_name: 'Test User',
        email: 'test@example.com',
      };

      const existingSubscription = {
        subscription_id: 'db-sub-existing',
        subscription_tier: 'explorer',
        status: 'active',
      };

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: [existingSubscription],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ subscription_id: 'db-sub-new' }],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator', // Higher tier
          billingCycle: 'monthly',
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      await mockSupabaseAuth(null, new Error('No session'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle Razorpay customer creation errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'explorer',
        full_name: 'Test User',
        email: 'test@example.com',
      };

      mockRazorpayCustomersCreate.mockRejectedValue({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Invalid customer data',
        },
      });

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RAZORPAY_CUSTOMER_ERROR');
    });

    it('should handle Razorpay subscription creation errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      await mockSupabaseAuth(mockUser);

      const mockUserProfile = {
        subscription_tier: 'explorer',
        full_name: 'Test User',
        email: 'test@example.com',
      };

      mockRazorpaySubscriptionsCreate.mockRejectedValue({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'Invalid subscription data',
        },
      });

      await mockSupabaseClient({
        from: vi.fn((table: string) => {
          if (table === 'user_profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUserProfile,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await createSubscriptionPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RAZORPAY_SUBSCRIPTION_ERROR');
    });
  });

  describe('GET /api/subscriptions/create-subscription', () => {
    it('should return method not allowed', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await createSubscriptionGET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });
});
