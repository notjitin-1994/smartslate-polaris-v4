import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createOrder } from '@/app/api/payments/create-order/route';
import { POST as verifyPayment } from '@/app/api/payments/verify/route';
import { POST as activateSubscription } from '@/app/api/payments/activate/route';
import crypto from 'crypto';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

// Mock Razorpay
vi.mock('razorpay', () => ({
  default: vi.fn(() => ({
    orders: {
      create: vi.fn(),
    },
  })),
}));

describe('Payment API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.RAZORPAY_KEY_ID = 'test_key_id';
    process.env.RAZORPAY_SECRET = 'test_secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/payments/create-order', () => {
    it('should create order successfully for authenticated user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      // Mock authenticated user
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
            user_metadata: { full_name: 'John Doe' },
          },
        },
        error: null,
      });

      // Mock Razorpay order creation
      const Razorpay = (await import('razorpay')).default;
      const mockRazorpay = new Razorpay({ key_id: '', key_secret: '' });
      mockRazorpay.orders.create = vi.fn().mockResolvedValue({
        id: 'order_123',
        currency: 'INR',
        receipt: 'order_user123_1234567890',
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: 'navigator',
          billingCycle: 'monthly',
          currency: 'INR',
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toHaveProperty('id', 'order_123');
      expect(data.breakdown).toHaveProperty('baseAmount', 999);
      expect(data.breakdown).toHaveProperty('gstAmount', 180);
      expect(data.breakdown).toHaveProperty('totalAmount', 1179);
      expect(data.prefill).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: 'navigator',
          billingCycle: 'monthly',
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should return 400 for invalid request data', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: 'invalid_tier',
          billingCycle: 'invalid_cycle',
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should calculate correct pricing for different tiers', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const Razorpay = (await import('razorpay')).default;
      const mockRazorpay = new Razorpay({ key_id: '', key_secret: '' });
      mockRazorpay.orders.create = vi.fn().mockResolvedValue({
        id: 'order_123',
        currency: 'INR',
        receipt: 'order_user123_1234567890',
      });

      // Test different tiers
      const tiers = [
        { tier: 'navigator', billingCycle: 'monthly', expectedBase: 999 },
        { tier: 'navigator', billingCycle: 'annual', expectedBase: 9990 },
        { tier: 'voyager', billingCycle: 'monthly', expectedBase: 1999 },
        { tier: 'voyager', billingCycle: 'annual', expectedBase: 19990 },
        { tier: 'crew', billingCycle: 'monthly', expectedBase: 2999 },
        { tier: 'fleet', billingCycle: 'monthly', expectedBase: 4999 },
      ];

      for (const { tier, billingCycle, expectedBase } of tiers) {
        const request = new NextRequest('http://localhost:3000/api/payments/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tier,
            billingCycle,
            currency: 'INR',
          }),
        });

        const response = await createOrder(request);
        const data = await response.json();

        const expectedGst = Math.round(expectedBase * 0.18);
        const expectedTotal = expectedBase + expectedGst;

        expect(response.status).toBe(200);
        expect(data.breakdown.baseAmount).toBe(expectedBase);
        expect(data.breakdown.gstAmount).toBe(expectedGst);
        expect(data.breakdown.totalAmount).toBe(expectedTotal);
      }
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify payment successfully with valid signature', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock successful database updates
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  tier: 'navigator',
                  billing_cycle: 'monthly',
                  amount: 1179,
                  currency: 'INR',
                },
                error: null,
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          error: null,
        })),
      }));

      const orderId = 'order_123';
      const paymentId = 'pay_456';
      const secret = process.env.RAZORPAY_SECRET!;

      // Generate valid signature
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          paymentMethod: 'card',
          metadata: {
            tier: 'navigator',
            billingCycle: 'monthly',
            amount: 1179,
          },
        }),
      });

      const response = await verifyPayment(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payment verified successfully');
      expect(data.subscription).toHaveProperty('tier', 'navigator');
      expect(data.subscription).toHaveProperty('status', 'active');
    });

    it('should reject payment with invalid signature', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null,
          })),
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'invalid_signature',
          paymentMethod: 'card',
        }),
      });

      const response = await verifyPayment(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment verification failed');
      expect(data.code).toBe('INVALID_SIGNATURE');
    });

    it('should return 401 for unauthenticated request', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'signature',
        }),
      });

      const response = await verifyPayment(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should return 400 for invalid request data', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          razorpay_order_id: 'order_123',
        }),
      });

      const response = await verifyPayment(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid verification data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/payments/activate', () => {
    it('should activate subscription successfully', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock payment order exists
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    razorpay_payment_id: 'pay_456',
                    user_id: 'user123',
                    status: 'paid',
                    metadata: { previous_tier: 'explorer' },
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  subscription_tier: 'navigator',
                  subscription_status: 'active',
                },
                error: null,
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          error: null,
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/payments/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: 'pay_456',
          tier: 'navigator',
          billingCycle: 'monthly',
        }),
      });

      const response = await activateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Subscription activated successfully');
      expect(data.subscription).toHaveProperty('tier', 'navigator');
      expect(data.subscription).toHaveProperty('status', 'active');
      expect(data.subscription.limits).toHaveProperty('blueprintCreation', 10);
      expect(data.subscription.limits).toHaveProperty('blueprintSaving', 10);
      expect(data.redirectUrl).toBe('/dashboard?subscription=activated');
    });

    it('should handle enterprise tier with unlimited limits', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    razorpay_payment_id: 'pay_456',
                    user_id: 'user123',
                    status: 'paid',
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  subscription_tier: 'enterprise',
                  subscription_status: 'active',
                },
                error: null,
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          error: null,
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/payments/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: 'pay_456',
          tier: 'enterprise',
          billingCycle: 'annual',
        }),
      });

      const response = await activateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.tier).toBe('enterprise');
      expect(data.subscription.limits.blueprintCreation).toBe(-1); // Unlimited
      expect(data.subscription.limits.blueprintSaving).toBe(-1); // Unlimited
      expect(data.subscription.features).toContain('all');
    });

    it('should return 400 for invalid payment', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock payment not found
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: new Error('Not found'),
                })),
              })),
            })),
          })),
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/payments/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: 'invalid_payment',
          tier: 'navigator',
          billingCycle: 'monthly',
        }),
      });

      const response = await activateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment not found or not completed');
      expect(data.code).toBe('INVALID_PAYMENT');
    });

    it('should return 400 for invalid tier', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    razorpay_payment_id: 'pay_456',
                    user_id: 'user123',
                    status: 'paid',
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/payments/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: 'pay_456',
          tier: 'invalid_tier',
          billingCycle: 'monthly',
        }),
      });

      const response = await activateSubscription(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid subscription tier');
      expect(data.code).toBe('INVALID_TIER');
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in error responses', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      // Simulate database error
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const Razorpay = (await import('razorpay')).default;
      const mockRazorpay = new Razorpay({ key_id: '', key_secret: '' });
      mockRazorpay.orders.create = vi
        .fn()
        .mockRejectedValue(
          new Error('Database connection failed at host db.example.com with password xyz123')
        );

      const request = new NextRequest('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: 'navigator',
          billingCycle: 'monthly',
        }),
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create payment order');
      expect(data.code).toBe('ORDER_CREATION_FAILED');
      // Should not expose sensitive error details
      expect(JSON.stringify(data)).not.toContain('db.example.com');
      expect(JSON.stringify(data)).not.toContain('xyz123');
    });

    it('should validate CORS headers', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil-site.com',
        },
        body: JSON.stringify({
          tier: 'navigator',
          billingCycle: 'monthly',
        }),
      });

      const response = await createOrder(request);

      // Should not include CORS headers for unauthorized origins
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });
});
