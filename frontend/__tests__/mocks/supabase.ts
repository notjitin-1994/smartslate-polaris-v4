/**
 * Enhanced Supabase Client Mocks
 *
 * Provides comprehensive mocking for Supabase client with realistic data structures
 * and database operations for unit testing
 */

import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 'test-user-id-123456789',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2025-10-29T12:00:00.000Z',
  phone: '+919876543210',
  phone_confirmed_at: null,
  created_at: '2025-10-29T12:00:00.000Z',
  confirmed_at: '2025-10-29T12:00:00.000Z',
  last_sign_in_at: '2025-10-29T12:00:00.000Z',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    full_name: 'Test User',
    avatar_url: null,
  },
  identities: [
    {
      id: 'identity-test-123',
      user_id: 'test-user-id-123456789',
      identity_data: {
        email: 'test@example.com',
        sub: 'test-user-id-123456789',
      },
      provider: 'email',
      created_at: '2025-10-29T12:00:00.000Z',
      last_sign_in_at: '2025-10-29T12:00:00.000Z',
    },
  ],
  factors: null,
};

export const mockSession = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access.token',
  refresh_token: 'test.refresh.token',
  expires_in: 3600,
  expires_at: 1698579600,
  token_type: 'bearer',
  user: mockUser,
};

// Mock user profile data
export const mockUserProfile = {
  user_id: 'test-user-id-123456789',
  subscription_tier: 'navigator',
  user_role: 'explorer',
  full_name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  phone: '+919876543210',
  blueprint_creation_count: 5,
  blueprint_saving_count: 3,
  blueprint_creation_limit: 25,
  blueprint_saving_limit: 25,
  last_login_at: '2025-10-29T12:00:00.000Z',
  created_at: '2025-10-29T12:00:00.000Z',
  updated_at: '2025-10-29T12:00:00.000Z',
  usage_metadata: {
    last_blueprint_date: '2025-10-28T10:30:00.000Z',
    preferred_export_format: 'pdf',
    learning_objectives: ['enhance skills', 'improve performance'],
  },
};

// Mock subscription data
export const mockSubscription = {
  subscription_id: 'sub-db-123456789',
  user_id: 'test-user-id-123456789',
  razorpay_subscription_id: 'sub_test123456789',
  razorpay_plan_id: 'plan_test123456789',
  razorpay_customer_id: 'cust_test123456789',
  status: 'active',
  plan_name: 'Navigator Plan (Monthly)',
  plan_amount: 290000,
  plan_currency: 'INR',
  plan_period: 'monthly',
  plan_interval: 1,
  subscription_tier: 'navigator',
  start_date: '2025-10-29T12:00:00.000Z',
  end_date: '2025-11-29T12:00:00.000Z',
  current_start: '2025-10-29T12:00:00.000Z',
  current_end: '2025-11-29T12:00:00.000Z',
  next_billing_date: '2025-11-29T12:00:00.000Z',
  charge_at: '2025-10-29T13:00:00.000Z',
  total_count: 12,
  paid_count: 1,
  remaining_count: 11,
  short_url: 'https://rzp.io/i/test-subscription',
  metadata: {
    billing_cycle: 'monthly',
    seats: '1',
    plan_price_per_seat: '290000',
    customer_info: {
      name: 'Test User',
      email: 'test@example.com',
      contact: '+919876543210',
    },
    created_via_api: 'create-subscription',
    api_request_id: 'req_123456789',
  },
  created_at: '2025-10-29T12:00:00.000Z',
  updated_at: '2025-10-29T12:00:00.000Z',
  deleted_at: null,
};

// Mock payment data
export const mockPayment = {
  payment_id: 'pay-db-123456789',
  subscription_id: 'sub-db-123456789',
  razorpay_payment_id: 'pay_test123456789',
  razorpay_order_id: 'order_test123456789',
  amount: 290000,
  currency: 'INR',
  status: 'captured',
  payment_method: 'card',
  payment_source: 'razorpay',
  description: 'Navigator Plan (Monthly) - Test User',
  notes: {
    subscription_id: 'sub_test123456789',
    user_id: 'test-user-id-123456789',
    billing_cycle: 'monthly',
  },
  fee: 8700,
  tax: 1305,
  refund_amount: 0,
  refund_status: null,
  failure_reason: null,
  webhook_event_id: 'we_test123456789',
  created_at: '2025-10-29T12:00:00.000Z',
  updated_at: '2025-10-29T12:00:00.000Z',
};

// Mock webhook event data
export const mockWebhookEvent = {
  webhook_event_id: 'we-db-123456789',
  razorpay_webhook_id: 'we_test123456789',
  event_type: 'subscription.activated',
  event_timestamp: 1698576000,
  payload: {
    subscription: {
      id: 'sub_test123456789',
      status: 'active',
      customer_id: 'cust_test123456789',
      plan_id: 'plan_test123456789',
      current_start: 1698576000,
      current_end: 1701254400,
      total_count: 12,
      paid_count: 1,
      remaining_count: 11,
      notes: {
        user_id: 'test-user-id-123456789',
        subscription_tier: 'navigator',
      },
    },
    payment: {
      id: 'pay_test123456789',
      entity: 'payment',
      amount: 290000,
      currency: 'INR',
      status: 'captured',
      order_id: 'order_test123456789',
      invoice_id: null,
      international: false,
      method: 'card',
      amount_refunded: 0,
      refund_status: null,
      captured: true,
      description: 'Navigator Plan (Monthly)',
      card_id: 'card_test123456789',
      bank: null,
      wallet: null,
      vpa: null,
      email: 'test@example.com',
      contact: '+919876543210',
      notes: {
        subscription_id: 'sub_test123456789',
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
    },
  },
  processed: true,
  processing_status: 'success',
  processing_error: null,
  retry_count: 0,
  created_at: '2025-10-29T12:00:00.000Z',
  updated_at: '2025-10-29T12:00:00.000Z',
};

// Mock blueprint generator data
export const mockBlueprintGenerator = {
  blueprint_id: 'blueprint-123456789',
  user_id: 'test-user-id-123456789',
  title: 'Learning Blueprint for Test Organization',
  organization_name: 'Test Organization',
  industry: 'Technology',
  department: 'Engineering',
  team_size: '50-100',
  timeline: '3-6 months',
  budget: '100K-500K',
  static_answers: {
    organization_context: {
      industry: 'Technology',
      department: 'Engineering',
      team_size: '50-100',
      timeline: '3-6 months',
      budget: '100K-500K',
    },
    learning_goals: ['skill enhancement', 'performance improvement'],
    target_audience: ['engineers', 'team leads'],
  },
  dynamic_questions: {
    sections: [
      {
        id: 'section-1',
        title: 'Current State Assessment',
        questions: [
          {
            id: 'q1',
            type: 'radio_pills',
            question: 'What is the current skill level?',
            options: ['Beginner', 'Intermediate', 'Advanced'],
            required: true,
          },
        ],
      },
    ],
  },
  dynamic_answers: {
    'section-1': {
      q1: 'Intermediate',
    },
  },
  blueprint_json: {
    title: 'Learning Blueprint for Test Organization',
    objectives: ['Enhance technical skills', 'Improve team collaboration'],
    modules: [
      {
        id: 'module-1',
        title: 'Technical Skills Development',
        duration: '4 weeks',
        objectives: ['Learn new technologies', 'Improve coding practices'],
      },
    ],
    timeline: '3 months',
    budget: '250000',
    success_metrics: ['Completion rate > 80%', 'Skill improvement assessment'],
  },
  blueprint_markdown:
    '# Learning Blueprint for Test Organization\n\n## Objectives\n\n- Enhance technical skills\n- Improve team collaboration\n\n## Modules\n\n### Module 1: Technical Skills Development\n\n**Duration:** 4 weeks\n\n**Objectives:**\n- Learn new technologies\n- Improve coding practices',
  status: 'completed',
  generated_at: '2025-10-29T12:00:00.000Z',
  created_at: '2025-10-29T10:00:00.000Z',
  updated_at: '2025-10-29T12:00:00.000Z',
};

// Database query builder mock
export const createMockQueryBuilder = (defaultData: any = null) => {
  let queryData = defaultData;
  let error: unknown = null;

  const builder = {
    select: vi.fn().mockImplementation((columns = '*') => {
      return builder;
    }),

    eq: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    in: vi.fn().mockImplementation((column, values) => {
      return builder;
    }),

    neq: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    gt: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    gte: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    lt: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    lte: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    like: vi.fn().mockImplementation((column, pattern) => {
      return builder;
    }),

    ilike: vi.fn().mockImplementation((column, pattern) => {
      return builder;
    }),

    is: vi.fn().mockImplementation((column, value) => {
      return builder;
    }),

    order: vi.fn().mockImplementation((column, options = {}) => {
      return builder;
    }),

    limit: vi.fn().mockImplementation((count) => {
      return builder;
    }),

    offset: vi.fn().mockImplementation((count) => {
      return builder;
    }),

    range: vi.fn().mockImplementation((from, to) => {
      return builder;
    }),

    single: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: queryData, error });
    }),

    maybeSingle: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: queryData, error });
    }),

    then: vi.fn().mockImplementation((callback) => {
      return Promise.resolve(callback({ data: queryData, error }));
    }),
  } as any;

  // Helper to set data and error
  (builder as any).setMockData = (data: any, err: any = null) => {
    queryData = data;
    error = err;
    return builder;
  };

  return builder;
};

// Mock Supabase client
export const createMockSupabaseClient = () => {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const mockData = {
        user_profiles: mockUserProfile,
        subscriptions: mockSubscription,
        payments: mockPayment,
        razorpay_webhook_events: mockWebhookEvent,
        blueprint_generator: mockBlueprintGenerator,
      };

      const tableData = (mockData as any)[table] || null;
      const queryBuilder = createMockQueryBuilder(tableData);

      // Add insert method
      (queryBuilder as any).insert = vi.fn().mockImplementation((data) => {
        const insertedData = Array.isArray(data) ? data[0] : data;
        return createMockQueryBuilder(insertedData);
      });

      // Add update method
      (queryBuilder as any).update = vi.fn().mockImplementation((data) => {
        return createMockQueryBuilder({ ...tableData, ...data });
      });

      // Add delete method
      (queryBuilder as any).delete = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder(null);
      });

      return queryBuilder;
    }),

    rpc: vi.fn().mockImplementation((funcName: string, params?: any) => {
      const rpcMocks = {
        increment_blueprint_creation_count: Promise.resolve(),
        increment_blueprint_saving_count: Promise.resolve(),
        update_user_subscription: Promise.resolve({ data: null, error: null }),
        check_user_limits: Promise.resolve({
          data: {
            can_create: true,
            can_save: true,
            remaining_creations: 20,
            remaining_savings: 22,
          },
          error: null,
        }),
      };

      return (
        rpcMocks[funcName as keyof typeof rpcMocks] || Promise.resolve({ data: null, error: null })
      );
    }),

    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test-file.pdf' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(['test content']),
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'test-file.pdf', id: 'file-123' }],
          error: null,
        }),
      }),
    },

    auth: {
      signIn: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            user_metadata: { ...mockUser.user_metadata, full_name: 'Updated Name' },
          },
        },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
        error: null,
      }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    },
  };
};

// Error simulation helpers
export const createSupabaseError = (code: string, message: string, details?: any) => ({
  message,
  code,
  details: details || null,
  hint: null,
});

// Common error scenarios
export const supabaseErrors = {
  recordNotFound: createSupabaseError('PGRST116', 'No rows found'),
  duplicateKey: createSupabaseError('23505', 'duplicate key value violates unique constraint'),
  foreignKeyViolation: createSupabaseError('23503', 'foreign key violation'),
  checkViolation: createSupabaseError('23514', 'check violation'),
  connectionError: createSupabaseError('08006', 'connection failure'),
  timeoutError: createSupabaseError('57014', 'statement timeout'),
  permissionDenied: createSupabaseError('42501', 'permission denied for table'),
};

// Helper functions for setting up specific mock scenarios
export const setupUserNotFound = (client: any) => {
  client.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: supabaseErrors.recordNotFound,
        }),
      }),
    }),
  });
};

export const setupDuplicateSubscription = (client: any) => {
  client.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockSubscription],
              error: null,
            }),
          }),
        }),
      }),
    }),
  });
};

export const setupDatabaseError = (client: any, error: any = supabaseErrors.connectionError) => {
  client.from.mockReturnValue({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error,
        }),
      }),
    }),
  });
};

// Export default mock
export default createMockSupabaseClient;
