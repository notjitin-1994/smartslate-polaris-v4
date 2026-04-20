/**
 * Enhanced Razorpay SDK Mocks
 *
 * Provides comprehensive mocking for Razorpay SDK with realistic data structures
 * and error scenarios for unit testing
 */

import { vi } from 'vitest';

// Base mock data structures
export const mockRazorpayCustomer = {
  id: 'cust_test123456789',
  name: 'Test User',
  email: 'test@example.com',
  contact: '+919876543210',
  notes: {
    user_id: 'test-user-id',
    source: 'polaris_v3',
    created_at: '2025-10-29T12:00:00.000Z',
  },
  created_at: 1698576000,
  gstin: null,
  verified: false,
  active: true,
};

export const mockRazorpayPlan = {
  id: 'plan_test123456789',
  entity: 'plan',
  interval: 1,
  period: 'monthly',
  item: {
    id: 'item_test123456789',
    name: 'Navigator Plan (Monthly)',
    description: 'Monthly subscription for Navigator tier',
    amount: 290000,
    currency: 'INR',
    type: 'plan',
  },
  notes: {
    tier: 'navigator',
    billing_cycle: 'monthly',
    source: 'polaris_v3',
  },
  created_at: 1698576000,
};

export const mockRazorpaySubscription = {
  id: 'sub_test123456789',
  entity: 'subscription',
  plan_id: 'plan_test123456789',
  customer_id: 'cust_test123456789',
  status: 'created',
  current_start: 1698576000,
  current_end: 1701254400,
  start_at: 1698579600,
  charge_at: 1698579600,
  auth_attempts: 0,
  total_count: 12,
  paid_count: 0,
  remaining_count: 12,
  customer_notify: 1,
  created_at: 1698576000,
  started_at: null,
  ended_at: null,
  short_url: 'https://rzp.io/i/test-subscription',
  has_charges: false,
  source: 'api',
  payment_method: 'card',
  coupon: null,
  add_ons: [],
  notes: {
    user_id: 'test-user-id',
    subscription_tier: 'navigator',
    billing_cycle: 'monthly',
    seats: '1',
    source: 'polaris_v3_subscription',
  },
  expire_by: null,
  offer: null,
  plan: mockRazorpayPlan,
  customer: mockRazorpayCustomer,
};

export const mockRazorpayPayment = {
  id: 'pay_test123456789',
  entity: 'payment',
  amount: 290000,
  currency: 'INR',
  status: 'captured',
  order_id: null,
  invoice_id: null,
  international: false,
  method: 'card',
  amount_refunded: 0,
  refund_status: null,
  captured: true,
  description: 'Navigator Plan (Monthly) - Test User',
  card_id: 'card_test123456789',
  bank: null,
  wallet: null,
  vpa: null,
  email: 'test@example.com',
  contact: '+919876543210',
  notes: {
    subscription_id: 'sub_test123456789',
    user_id: 'test-user-id',
  },
  fee: 8700,
  tax: 1305,
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

// Error response structures
export const mockRazorpayError = {
  error: {
    code: 'BAD_REQUEST_ERROR',
    description: 'The request could not be processed.',
    source: 'business',
    step: 'payment_initiation',
    reason: 'insufficient_balance',
    metadata: {
      payment_id: 'pay_test123456789',
      order_id: 'order_test123456789',
    },
  },
};

// Mock implementations
export const createMockRazorpayClient = () => ({
  subscriptions: {
    create: vi.fn().mockResolvedValue(mockRazorpaySubscription),
    fetch: vi.fn().mockResolvedValue(mockRazorpaySubscription),
    cancel: vi.fn().mockResolvedValue({
      id: 'sub_test123456789',
      status: 'cancelled',
      short_url: 'https://rzp.io/i/test-subscription',
    }),
    pause: vi.fn().mockResolvedValue({
      id: 'sub_test123456789',
      status: 'paused',
      short_url: 'https://rzp.io/i/test-subscription',
    }),
    resume: vi.fn().mockResolvedValue({
      id: 'sub_test123456789',
      status: 'active',
      short_url: 'https://rzp.io/i/test-subscription',
    }),
    all: vi.fn().mockResolvedValue({
      items: [mockRazorpaySubscription],
      count: 1,
      has_more: false,
    }),
  },

  customers: {
    create: vi.fn().mockResolvedValue(mockRazorpayCustomer),
    fetch: vi.fn().mockResolvedValue(mockRazorpayCustomer),
    edit: vi.fn().mockResolvedValue({
      ...mockRazorpayCustomer,
      name: 'Updated Name',
    }),
    all: vi.fn().mockResolvedValue({
      items: [mockRazorpayCustomer],
      count: 1,
      has_more: false,
    }),
  },

  plans: {
    create: vi.fn().mockResolvedValue(mockRazorpayPlan),
    fetch: vi.fn().mockResolvedValue(mockRazorpayPlan),
    all: vi.fn().mockResolvedValue({
      items: [mockRazorpayPlan],
      count: 1,
      has_more: false,
    }),
  },

  payments: {
    fetch: vi.fn().mockResolvedValue(mockRazorpayPayment),
    all: vi.fn().mockResolvedValue({
      items: [mockRazorpayPayment],
      count: 1,
      has_more: false,
    }),
    capture: vi.fn().mockResolvedValue(mockRazorpayPayment),
    refund: vi.fn().mockResolvedValue({
      id: 'refund_test123456789',
      entity: 'refund',
      amount: 290000,
      currency: 'INR',
      payment_id: 'pay_test123456789',
      status: 'processed',
      created_at: 1698576000,
    }),
  },
});

// Error simulation helpers
export const simulateRazorpayError = (errorCode: string, description: string) => {
  const error = new Error(description) as any;
  error.error = {
    code: errorCode,
    description,
    source: 'business',
    step: 'payment_initiation',
    reason: 'validation_failed',
  };
  return error;
};

// Mock factories for different scenarios
export const createSubscriptionMock = (overrides = {}) => ({
  create: vi.fn().mockResolvedValue({
    ...mockRazorpaySubscription,
    ...overrides,
  }),
});

export const createCustomerMock = (overrides = {}) => ({
  create: vi.fn().mockResolvedValue({
    ...mockRazorpayCustomer,
    ...overrides,
  }),
});

export const createPlanMock = (overrides = {}) => ({
  create: vi.fn().mockResolvedValue({
    ...mockRazorpayPlan,
    ...overrides,
  }),
});

export const createPaymentMock = (overrides = {}) => ({
  capture: vi.fn().mockResolvedValue({
    ...mockRazorpayPayment,
    ...overrides,
  }),
});

// Error scenarios
export const createErrorMocks = {
  invalidPlanId: simulateRazorpayError('BAD_REQUEST_ERROR', 'Invalid plan ID'),
  customerNotFound: simulateRazorpayError('CUSTOMER_NOT_FOUND', 'Customer not found'),
  subscriptionNotFound: simulateRazorpayError('SUBSCRIPTION_NOT_FOUND', 'Subscription not found'),
  insufficientBalance: simulateRazorpayError('INSUFFICIENT_BALANCE', 'Insufficient balance'),
  cardDeclined: simulateRazorpayError('CARD_DECLINED', 'Card declined'),
  rateLimit: simulateRazorpayError('RATE_LIMITED', 'Too many requests. Please try again later'),
  serverError: simulateRazorpayError('SERVER_ERROR', 'Internal server error'),
  authenticationError: simulateRazorpayError('AUTHENTICATION_ERROR', 'Authentication failed'),
  invalidRequest: simulateRazorpayError('INVALID_REQUEST', 'Invalid request parameters'),
};

// Export default mock
export default createMockRazorpayClient;
