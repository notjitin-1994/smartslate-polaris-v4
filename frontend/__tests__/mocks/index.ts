/**
 * Mocks Index
 *
 * Central export point for all test mocks and factories
 */

// Export Razorpay mocks
export {
  default as createMockRazorpayClient,
  mockRazorpayCustomer,
  mockRazorpayPlan,
  mockRazorpaySubscription,
  mockRazorpayPayment,
  mockRazorpayError,
  createSubscriptionMock,
  createCustomerMock,
  createPlanMock,
  createPaymentMock,
  createErrorMocks,
} from './razorpay';

// Export Supabase mocks
export {
  default as createMockSupabaseClient,
  mockUser,
  mockSession,
  mockUserProfile,
  mockSubscription,
  mockPayment,
  mockWebhookEvent,
  mockBlueprintGenerator,
  createMockQueryBuilder,
  createSupabaseError,
  supabaseErrors,
  setupUserNotFound,
  setupDuplicateSubscription,
  setupDatabaseError,
} from './supabase';

// Export factory functions
export {
  default as factories,
  createUser,
  createSession,
  createUserProfile,
  createRazorpayCustomer,
  createRazorpayPlan,
  createRazorpaySubscription,
  createSubscription,
  createPayment,
  createWebhookEvent,
  createBlueprintGenerator,
  createApiRequest,
  createApiResponse,
  createErrorResponse,
  generateId,
  generateDate,
  generateTimestamp,
} from './factories';

// Re-export for convenience
export { faker } from '@faker-js/faker';
