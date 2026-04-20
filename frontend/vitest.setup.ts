import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

// Provide safe defaults to avoid Supabase client throwing in tests
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';

// Provide Razorpay test keys for tests
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||= 'rzp_test_1234567890123456';
process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET ||= 'test_secret_1234567890123456';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Import comprehensive mocks
import { createMockRazorpayClient } from './__tests__/mocks/razorpay';
import { createMockSupabaseClient } from './__tests__/mocks/supabase';

// Mock Razorpay SDK with comprehensive implementation
const mockRazorpayClient = createMockRazorpayClient();
vi.mock('razorpay', () => ({
  default: vi.fn(() => mockRazorpayClient),
}));

// Mock Supabase client with comprehensive implementation
const mockSupabaseClient = createMockSupabaseClient();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Zustand stores
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const mockStore = {
      user: null,
      session: null,
      status: 'loading',
      isLoading: false,
      error: null,
      lastActivity: null,
      sessionExpiry: null,
      isSessionValid: false,
      rememberMe: false,
      autoLogin: false,
      setAuth: vi.fn(),
      setStatus: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setLastActivity: vi.fn(),
      setSessionExpiry: vi.fn(),
      setRememberMe: vi.fn(),
      setAutoLogin: vi.fn(),
      checkSessionValidity: vi.fn(() => false),
      clearAuth: vi.fn(),
      reset: vi.fn(),
    };

    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock blueprint store
vi.mock('@/lib/stores/blueprintStore', () => ({
  useBlueprintStore: vi.fn((selector) => {
    const mockStore = {
      blueprint: null,
      status: 'draft',
      isLoading: false,
      error: null,
      saveBlueprint: vi.fn(),
      loadBlueprint: vi.fn(),
      updateBlueprint: vi.fn(),
      reset: vi.fn(),
    };

    if (typeof selector === 'function') {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'test-cookie-value' })),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock crypto for webhook signature verification
Object.defineProperty(global, 'crypto', {
  value: {
    ...crypto,
    subtle: {
      digest: vi.fn((algorithm: string, data: Uint8Array) => {
        // Return a mock digest for testing
        return Promise.resolve(new Uint8Array([1, 2, 3, 4, 5]));
      }),
    },
    timingSafeEqual: vi.fn((a: Buffer, b: Buffer) => {
      return a.length === b.length && a.every((byte, i) => byte === b[i]);
    }),
  },
  writable: true,
});

// Mock setTimeout and other timers for testing
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

global.setTimeout = vi.fn((fn: Function, delay?: number) => {
  return originalSetTimeout(fn, delay);
}) as any;

global.clearTimeout = vi.fn((id: number) => {
  return originalClearTimeout(id);
}) as any;

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    app_metadata: { provider: 'email' },
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockSubscription: (overrides = {}) => ({
    id: 'test-subscription-id',
    user_id: 'test-user-id',
    razorpay_subscription_id: 'raz_sub_test123',
    plan_id: 'navigator',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockPayment: (overrides = {}) => ({
    id: 'test-payment-id',
    subscription_id: 'test-subscription-id',
    razorpay_payment_id: 'raz_pay_test123',
    amount: 2900,
    currency: 'INR',
    status: 'captured',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockWebhookEvent: (overrides = {}) => ({
    id: 'webhook-event-id',
    event_type: 'subscription.activated',
    payload: {
      subscription: {
        id: 'raz_sub_test123',
        status: 'active',
        customer_id: 'cust_test123',
      },
    },
    processed: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

declare global {
  var testUtils: {
    createMockUser: (overrides?: any) => any;
    createMockSubscription: (overrides?: any) => any;
    createMockPayment: (overrides?: any) => any;
    createMockWebhookEvent: (overrides?: any) => any;
  };
}
