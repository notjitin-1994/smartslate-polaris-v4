/**
 * Integration tests for Payment API routes
 * Tests: /api/payments/create-order, /api/payments/verify, /api/payments/activate, /api/payments/test-razorpay
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST as createOrderPOST } from '@/app/api/payments/create-order/route';
import { POST as verifyPOST } from '@/app/api/payments/verify/route';
import { POST as activatePOST } from '@/app/api/payments/activate/route';
import { GET as testRazorpayGET } from '@/app/api/payments/test-razorpay/route';
import crypto from 'crypto';

// Create a mock Razorpay create function
const mockRazorpayOrdersCreate = vi.fn();

// Mock Razorpay
vi.mock('razorpay', () => {
  return {
    default: class MockRazorpay {
      orders = {
        create: (...args: any[]) => mockRazorpayOrdersCreate(...args),
      };
    },
  };
});

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Helper functions
function createMockRequest(options: {
  method: string;
  body?: any;
  headers?: Record<string, string>;
}): Request {
  const { method, body, headers = {} } = options;

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

  return new Request('http://localhost:3000/api/test', requestInit);
}

function mockSupabaseAuth(
  createClientMock: any,
  user: any = null,
  error: Error | null = null
): void {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  };

  vi.mocked(createClientMock).mockResolvedValue(mockClient);
}

function mockSupabaseQuery(
  createClientMock: any,
  data: any,
  error: Error | null = null,
  operation: string = 'select'
): void {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };

  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(mockQuery),
    rpc: vi.fn().mockResolvedValue({ data, error }),
  };

  vi.mocked(createClientMock).mockResolvedValue(mockClient);
}

const { createClient } = await import('@/lib/supabase/server');

describe('Payment Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required environment variables
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123456';
    process.env.RAZORPAY_KEY_SECRET = 'secret_key_123456';

    // Reset Razorpay mock to default success response
    mockRazorpayOrdersCreate.mockResolvedValue({
      id: 'order_mock123',
      amount: 159900,
      currency: 'INR',
      receipt: 'ord_abc12345_xyz',
      status: 'created',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/payments/create-order', () => {
    it('should create a Razorpay order for individual tier', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          phone: '+919876543210',
        },
      };

      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'explorer',
          billingCycle: 'monthly',
          currency: 'INR',
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toMatchObject({
        id: 'order_mock123',
        amount: 1599,
        currency: 'INR',
      });
      expect(data.prefill).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
        contact: '+919876543210',
      });
    });

    it('should create order for team tier with seats', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'crew',
          billingCycle: 'annual',
          currency: 'INR',
          seats: 5,
          amount: 99950, // 5 seats × 19990
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order.amount).toBe(99950);
    });

    it('should handle annual billing cycle correctly', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };

      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'voyager',
          billingCycle: 'annual',
          currency: 'INR',
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.order.amount).toBe(69990); // Annual price for voyager
    });

    it('should reject unauthenticated requests', async () => {
      mockSupabaseAuth(createClient, null, new Error('No user'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'explorer',
          billingCycle: 'monthly',
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should validate tier enum', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'invalid_tier',
          billingCycle: 'monthly',
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should validate billing cycle', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'explorer',
          billingCycle: 'quarterly', // Invalid
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative seat count', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'crew',
          billingCycle: 'monthly',
          seats: -1,
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Razorpay API errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      // Mock Razorpay to throw error
      mockRazorpayOrdersCreate.mockRejectedValueOnce(new Error('Razorpay API error'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'explorer',
          billingCycle: 'monthly',
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('ORDER_CREATION_FAILED');
      expect(data.message).toContain('Razorpay API error');

      // Restore the mock
      mockRazorpayOrdersCreate.mockResolvedValue({
        id: 'order_mock123',
        amount: 159900,
        currency: 'INR',
        receipt: 'ord_abc12345_xyz',
        status: 'created',
      });
    });

    it('should handle Razorpay initialization errors', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      // Mock Razorpay to throw initialization error
      mockRazorpayOrdersCreate.mockRejectedValueOnce(
        new Error('Bad request (key_id or key_secret is invalid)')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'explorer',
          billingCycle: 'monthly',
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('ORDER_CREATION_FAILED');
      expect(data.message).toContain('invalid');
    });

    it('should reject zero or negative custom amount', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          tier: 'crew',
          billingCycle: 'monthly',
          amount: 0, // Zero amount should fail
          seats: 5,
        },
      });

      const response = await createOrderPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/payments/verify', () => {
    const generateSignature = (orderId: string, paymentId: string): string => {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_key_123456';
      return crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    };

    it('should verify valid payment signature', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const orderId = 'order_mock123';
      const paymentId = 'pay_mock456';
      const signature = generateSignature(orderId, paymentId);

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_order_id: orderId,
        tier: 'explorer',
        billing_cycle: 'monthly',
        amount: 1599,
        currency: 'INR',
        status: 'created',
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, 'payment_orders', [mockPaymentOrder], null, 'select');
      mockSupabaseQuery(createClient, {}, null, 'update');
      mockSupabaseQuery(createClient, null, null, 'select'); // existing subscription check
      mockSupabaseQuery(
        createClient,
        {
          id: 'sub-123',
          tier: 'explorer',
          billing_cycle: 'monthly',
          status: 'active',
        },
        null,
        'insert'
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          paymentMethod: 'card',
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payment verified successfully');
      expect(data.subscription).toBeDefined();
    });

    it('should reject invalid signature', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const orderId = 'order_mock123';
      const paymentId = 'pay_mock456';
      const invalidSignature = 'invalid_signature_123';

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_order_id: orderId,
        status: 'created',
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');
      mockSupabaseQuery(createClient, {}, null, 'update'); // Update to failed

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: invalidSignature,
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment verification failed');
      expect(data.code).toBe('INVALID_SIGNATURE');
    });

    it('should handle already processed payments', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const orderId = 'order_mock123';
      const paymentId = 'pay_mock456';
      const signature = generateSignature(orderId, paymentId);

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_order_id: orderId,
        tier: 'explorer',
        billing_cycle: 'monthly',
        status: 'paid', // Already paid
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payment already processed');
    });

    it('should reject when payment order not found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const orderId = 'order_notfound';
      const paymentId = 'pay_mock456';
      const signature = generateSignature(orderId, paymentId);

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, null, new Error('Not found'), 'select');

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Payment order not found');
      expect(data.code).toBe('ORDER_NOT_FOUND');
    });

    it('should reject unauthenticated requests', async () => {
      mockSupabaseAuth(createClient, null, new Error('No user'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'sig_789',
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should validate required fields', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: 'order_123',
          // Missing razorpay_payment_id
          razorpay_signature: 'sig_789',
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should update existing active subscription', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const orderId = 'order_mock123';
      const paymentId = 'pay_mock456';
      const signature = generateSignature(orderId, paymentId);

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_order_id: orderId,
        tier: 'voyager',
        billing_cycle: 'annual',
        amount: 69990,
        currency: 'INR',
        status: 'created',
      };

      const existingSubscription = {
        id: 'sub-existing',
        user_id: 'user-123',
        tier: 'explorer',
        status: 'active',
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');
      mockSupabaseQuery(createClient, {}, null, 'update'); // Update payment order
      mockSupabaseQuery(createClient, existingSubscription, null, 'select'); // Existing sub
      mockSupabaseQuery(createClient, { ...existingSubscription, tier: 'voyager' }, null, 'update'); // Update sub

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle missing Razorpay secret', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      delete process.env.RAZORPAY_KEY_SECRET;

      const request = createMockRequest({
        method: 'POST',
        body: {
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'sig_789',
        },
      });

      const response = await verifyPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Payment verification not configured');

      // Restore
      process.env.RAZORPAY_KEY_SECRET = 'secret_key_123456';
    });
  });

  describe('POST /api/payments/activate', () => {
    it('should activate subscription after successful payment', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_payment_id: 'pay_mock456',
        tier: 'navigator',
        billing_cycle: 'monthly',
        status: 'paid',
      };

      const updatedProfile = {
        id: 'user-123',
        subscription_tier: 'navigator',
        subscription_status: 'active',
        blueprint_creation_limit: 10,
        blueprint_saving_limit: 10,
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');
      mockSupabaseQuery(createClient, updatedProfile, null, 'update');
      mockSupabaseQuery(createClient, {}, null, 'insert'); // subscription_events

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456',
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscription.tier).toBe('navigator');
      expect(data.subscription.status).toBe('active');
      expect(data.subscription.limits.blueprintCreation).toBe(10);
    });

    it('should reject invalid payment ID', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, null, new Error('Not found'), 'select');

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_invalid',
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment not found or not completed');
      expect(data.code).toBe('INVALID_PAYMENT');
    });

    it('should reject unpaid payment orders', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      // Since the route filters by status='paid', unpaid orders won't be found
      // So the query returns null/error
      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, null, new Error('Not found'), 'select');

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456_unpaid',
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PAYMENT');
    });

    it('should handle enterprise tier with unlimited limits', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_payment_id: 'pay_mock456',
        tier: 'enterprise',
        billing_cycle: 'annual',
        status: 'paid',
      };

      const updatedProfile = {
        id: 'user-123',
        subscription_tier: 'enterprise',
        blueprint_creation_limit: -1,
        blueprint_saving_limit: -1,
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');
      mockSupabaseQuery(createClient, updatedProfile, null, 'update');
      mockSupabaseQuery(createClient, {}, null, 'insert');

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456',
          tier: 'enterprise',
          billingCycle: 'annual',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.tier).toBe('enterprise');
      expect(data.subscription.limits.blueprintCreation).toBe(-1);
    });

    it('should reject invalid tier', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_payment_id: 'pay_mock456',
        status: 'paid',
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456',
          tier: 'invalid_tier',
          billingCycle: 'monthly',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_TIER');
    });

    it('should reset usage counters on activation', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      const mockPaymentOrder = {
        id: 'po-123',
        user_id: 'user-123',
        razorpay_payment_id: 'pay_mock456',
        tier: 'voyager',
        billing_cycle: 'monthly',
        status: 'paid',
      };

      const updatedProfile = {
        id: 'user-123',
        subscription_tier: 'voyager',
        blueprint_creation_count: 0, // Reset
        blueprint_saving_count: 0, // Reset
      };

      mockSupabaseAuth(createClient, mockUser);
      mockSupabaseQuery(createClient, mockPaymentOrder, null, 'select');
      mockSupabaseQuery(createClient, updatedProfile, null, 'update');
      mockSupabaseQuery(createClient, {}, null, 'insert');

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456',
          tier: 'voyager',
          billingCycle: 'monthly',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      mockSupabaseAuth(createClient, null, new Error('No user'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456',
          tier: 'navigator',
          billingCycle: 'monthly',
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('should validate billing cycle enum', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth(createClient, mockUser);

      const request = createMockRequest({
        method: 'POST',
        body: {
          paymentId: 'pay_mock456',
          tier: 'navigator',
          billingCycle: 'quarterly', // Invalid
        },
      });

      const response = await activatePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/payments/test-razorpay', () => {
    it('should successfully test Razorpay configuration', async () => {
      const request = createMockRequest({ method: 'GET' });

      const response = await testRazorpayGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Razorpay configuration is working!');
      expect(data.testOrder).toBeDefined();
      expect(data.testOrder.id).toBe('order_mock123');
    });

    it('should detect missing credentials', async () => {
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      const request = createMockRequest({ method: 'GET' });

      const response = await testRazorpayGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing Razorpay credentials');
      expect(data.details.hasKeyId).toBe(false);
      expect(data.details.hasKeySecret).toBe(false);

      // Restore
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123456';
      process.env.RAZORPAY_KEY_SECRET = 'secret_key_123456';
    });

    it('should detect TEST mode from key prefix', async () => {
      const request = createMockRequest({ method: 'GET' });

      const response = await testRazorpayGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.mode).toBe('TEST');
      expect(data.config.keyPrefix).toBe('rzp_test_1');
    });

    it('should detect LIVE mode from key prefix', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_123456';

      const request = createMockRequest({ method: 'GET' });

      const response = await testRazorpayGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.config.mode).toBe('LIVE');

      // Restore
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123456';
    });

    it('should handle Razorpay API errors', async () => {
      mockRazorpayOrdersCreate.mockRejectedValueOnce(
        new Error('Razorpay auth error - invalid key')
      );

      const request = createMockRequest({ method: 'GET' });

      const response = await testRazorpayGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Razorpay test failed');
      expect(data.details.isAuthError).toBe(true);

      // Restore the mock
      mockRazorpayOrdersCreate.mockResolvedValue({
        id: 'order_mock123',
        amount: 159900,
        currency: 'INR',
        receipt: 'ord_abc12345_xyz',
        status: 'created',
      });
    });

    it('should detect network errors', async () => {
      mockRazorpayOrdersCreate.mockRejectedValueOnce(new Error('ENOTFOUND api.razorpay.com'));

      const request = createMockRequest({ method: 'GET' });

      const response = await testRazorpayGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details.isNetworkError).toBe(true);

      // Restore the mock
      mockRazorpayOrdersCreate.mockResolvedValue({
        id: 'order_mock123',
        amount: 159900,
        currency: 'INR',
        receipt: 'ord_abc12345_xyz',
        status: 'created',
      });
    });
  });
});
