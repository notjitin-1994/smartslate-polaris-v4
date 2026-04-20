/**
 * Test Data Factories
 *
 * Provides factory functions for generating consistent test data across different test scenarios
 */

import { faker } from '@faker-js/faker';
import { mockRazorpayCustomer, mockRazorpaySubscription, mockRazorpayPayment } from './razorpay';
import {
  mockUser,
  mockSession,
  mockUserProfile,
  mockSubscription,
  mockPayment,
  mockWebhookEvent,
  mockBlueprintGenerator,
} from './supabase';

// Helper function to generate UUIDs
const generateId = (prefix = '') => `${prefix}${faker.string.uuid()}`;

// Helper function to generate dates
const generateDate = (daysOffset = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

// Helper function to generate timestamps
const generateTimestamp = (daysOffset = 0): number => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return Math.floor(date.getTime() / 1000);
};

// User factory
export const createUser = (overrides = {}) => ({
  id: generateId('user-'),
  aud: 'authenticated',
  role: 'authenticated',
  email: faker.internet.email(),
  email_confirmed_at: generateDate(-30),
  phone: faker.phone.number({ style: 'international' }),
  phone_confirmed_at: null,
  created_at: generateDate(-30),
  confirmed_at: generateDate(-30),
  last_sign_in_at: generateDate(-1),
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    full_name: faker.person.fullName(),
    avatar_url: null,
  },
  identities: [
    {
      id: generateId('identity-'),
      user_id: generateId('user-'),
      identity_data: {
        email: faker.internet.email(),
        sub: generateId('user-'),
      },
      provider: 'email',
      created_at: generateDate(-30),
      last_sign_in_at: generateDate(-1),
    },
  ],
  factors: null,
  ...overrides,
});

// Session factory
export const createSession = (user = createUser(), overrides = {}) => ({
  access_token: faker.string.alphanumeric(64),
  refresh_token: faker.string.alphanumeric(64),
  expires_in: 3600,
  expires_at: generateTimestamp(1),
  token_type: 'bearer',
  user,
  ...overrides,
});

// User profile factory
export const createUserProfile = (userId?: string, overrides = {}) => {
  const subscriptionTiers = ['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];
  const userRoles = ['explorer', 'navigator', 'developer'];

  return {
    user_id: userId || generateId('user-'),
    subscription_tier: faker.helpers.arrayElement(subscriptionTiers),
    user_role: faker.helpers.arrayElement(userRoles),
    full_name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar_url: faker.internet.url(),
    phone: faker.phone.number({ style: 'international' }),
    blueprint_creation_count: faker.number.int({ min: 0, max: 50 }),
    blueprint_saving_count: faker.number.int({ min: 0, max: 50 }),
    blueprint_creation_limit: faker.number.int({ min: 2, max: 100 }),
    blueprint_saving_limit: faker.number.int({ min: 2, max: 100 }),
    last_login_at: generateDate(-1),
    created_at: generateDate(-30),
    updated_at: generateDate(-1),
    usage_metadata: {
      last_blueprint_date: generateDate(-7),
      preferred_export_format: faker.helpers.arrayElement(['pdf', 'word', 'markdown']),
      learning_objectives: faker.helpers.arrayElements(
        ['enhance skills', 'improve performance', 'increase productivity', 'reduce costs'],
        { min: 1, max: 3 }
      ),
    },
    ...overrides,
  };
};

// Razorpay customer factory
export const createRazorpayCustomer = (userId?: string, overrides = {}) => ({
  id: generateId('cust_'),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  contact: faker.phone.number(),
  notes: {
    user_id: userId || generateId('user-'),
    source: 'polaris_v3',
    created_at: new Date().toISOString(),
  },
  created_at: generateTimestamp(-30),
  gstin: null,
  verified: faker.datatype.boolean(),
  active: true,
  ...overrides,
});

// Razorpay plan factory
export const createRazorpayPlan = (
  tier = 'navigator',
  billingCycle = 'monthly',
  overrides = {}
) => {
  const tierPrices = {
    explorer: 0,
    navigator: 2900,
    voyager: 5900,
    crew: 9900,
    fleet: 19900,
    armada: 49900,
  };

  const amount = tierPrices[tier as keyof typeof tierPrices] || 2900;

  return {
    id: generateId('plan_'),
    entity: 'plan',
    interval: billingCycle === 'monthly' ? 1 : 12,
    period: billingCycle,
    item: {
      id: generateId('item_'),
      name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan (${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)})`,
      description: `${billingCycle} subscription for ${tier} tier`,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      type: 'plan',
    },
    notes: {
      tier,
      billing_cycle: billingCycle,
      source: 'polaris_v3',
    },
    created_at: generateTimestamp(-30),
    ...overrides,
  };
};

// Razorpay subscription factory
export const createRazorpaySubscription = (
  customerId?: string,
  planId?: string,
  overrides = {}
) => ({
  id: generateId('sub_'),
  entity: 'subscription',
  plan_id: planId || generateId('plan_'),
  customer_id: customerId || generateId('cust_'),
  status: faker.helpers.arrayElement([
    'created',
    'authenticated',
    'active',
    'trialing',
    'completed',
    'cancelled',
  ]),
  current_start: generateTimestamp(0),
  current_end: generateTimestamp(30),
  start_at: generateTimestamp(1),
  charge_at: generateTimestamp(1),
  auth_attempts: faker.number.int({ min: 0, max: 3 }),
  total_count: faker.datatype.boolean() ? 12 : 1,
  paid_count: faker.number.int({ min: 0, max: 12 }),
  remaining_count: faker.number.int({ min: 0, max: 12 }),
  customer_notify: 1,
  created_at: generateTimestamp(-1),
  started_at: faker.datatype.boolean() ? generateTimestamp(-1) : null,
  ended_at: faker.datatype.boolean() ? generateTimestamp(30) : null,
  short_url: `https://rzp.io/i/${faker.lorem.slug()}`,
  has_charges: faker.datatype.boolean(),
  source: 'api',
  payment_method: 'card',
  coupon: null,
  add_ons: [],
  notes: {
    user_id: generateId('user-'),
    subscription_tier: faker.helpers.arrayElement(['navigator', 'voyager', 'crew']),
    billing_cycle: faker.helpers.arrayElement(['monthly', 'yearly']),
    seats: '1',
    source: 'polaris_v3_subscription',
  },
  expire_by: null,
  offer: null,
  ...overrides,
});

// Database subscription factory
export const createSubscription = (userId?: string, overrides = {}) => {
  const subscriptionTiers = ['navigator', 'voyager', 'crew', 'fleet', 'armada'];
  const billingCycles = ['monthly', 'yearly'];
  const statuses = ['created', 'authenticated', 'active', 'trialing', 'cancelled'];

  const tier = faker.helpers.arrayElement(subscriptionTiers);
  const billingCycle = faker.helpers.arrayElement(billingCycles);
  const status = faker.helpers.arrayElement(statuses);

  return {
    subscription_id: generateId('sub-db-'),
    user_id: userId || generateId('user-'),
    razorpay_subscription_id: generateId('sub_'),
    razorpay_plan_id: generateId('plan_'),
    razorpay_customer_id: generateId('cust_'),
    status,
    plan_name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan (${billingCycle})`,
    plan_amount: faker.number.int({ min: 290000, max: 4990000 }),
    plan_currency: 'INR',
    plan_period: billingCycle,
    plan_interval: billingCycle === 'monthly' ? 1 : 12,
    subscription_tier: tier,
    start_date: generateDate(-30),
    end_date: generateDate(30),
    current_start: generateDate(-1),
    current_end: generateDate(30),
    next_billing_date: generateDate(30),
    charge_at: generateDate(1),
    total_count: billingCycle === 'monthly' ? 12 : 1,
    paid_count: faker.number.int({ min: 0, max: 12 }),
    remaining_count: faker.number.int({ min: 0, max: 12 }),
    short_url: `https://rzp.io/i/${faker.lorem.slug()}`,
    metadata: {
      billing_cycle: billingCycle,
      seats: faker.number.int({ min: 1, max: 100 }).toString(),
      plan_price_per_seat: faker.number.int({ min: 290000, max: 4990000 }).toString(),
      customer_info: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        contact: faker.phone.number(),
      },
      created_via_api: 'create-subscription',
      api_request_id: generateId('req_'),
    },
    created_at: generateDate(-1),
    updated_at: generateDate(-1),
    deleted_at: null,
    ...overrides,
  };
};

// Payment factory
export const createPayment = (subscriptionId?: string, overrides = {}) => ({
  payment_id: generateId('pay-db-'),
  subscription_id: subscriptionId || generateId('sub-db-'),
  razorpay_payment_id: generateId('pay_'),
  razorpay_order_id: generateId('order_'),
  amount: faker.number.int({ min: 290000, max: 4990000 }),
  currency: 'INR',
  status: faker.helpers.arrayElement(['created', 'authorized', 'captured', 'failed', 'refunded']),
  payment_method: faker.helpers.arrayElement(['card', 'netbanking', 'upi', 'wallet']),
  payment_source: 'razorpay',
  description: faker.lorem.sentence(),
  notes: {
    subscription_id: subscriptionId || generateId('sub_'),
    user_id: generateId('user-'),
    billing_cycle: faker.helpers.arrayElement(['monthly', 'yearly']),
  },
  fee: faker.number.int({ min: 1000, max: 10000 }),
  tax: faker.number.int({ min: 100, max: 1000 }),
  refund_amount: 0,
  refund_status: null,
  failure_reason: null,
  webhook_event_id: generateId('we_'),
  created_at: generateDate(-1),
  updated_at: generateDate(-1),
  ...overrides,
});

// Webhook event factory
export const createWebhookEvent = (overrides = {}) => {
  const eventTypes = [
    'subscription.created',
    'subscription.authenticated',
    'subscription.activated',
    'subscription.completed',
    'subscription.cancelled',
    'subscription.halted',
    'subscription.resumed',
    'payment.captured',
    'payment.failed',
    'payment.refunded',
  ];

  return {
    webhook_event_id: generateId('we-db-'),
    razorpay_webhook_id: generateId('we_'),
    event_type: faker.helpers.arrayElement(eventTypes),
    event_timestamp: generateTimestamp(-1),
    payload: {
      subscription: createRazorpaySubscription(),
      payment: faker.datatype.boolean()
        ? {
            id: generateId('pay_'),
            entity: 'payment',
            amount: faker.number.int({ min: 290000, max: 4990000 }),
            currency: 'INR',
            status: 'captured',
            created_at: generateTimestamp(-1),
          }
        : null,
    },
    processed: faker.datatype.boolean(),
    processing_status: faker.helpers.arrayElement(['success', 'failed', 'pending']),
    processing_error: null,
    retry_count: faker.number.int({ min: 0, max: 3 }),
    created_at: generateDate(-1),
    updated_at: generateDate(-1),
    ...overrides,
  };
};

// Blueprint generator factory
export const createBlueprintGenerator = (userId?: string, overrides = {}) => {
  const statuses = ['draft', 'generating', 'completed', 'error'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail'];
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations'];

  return {
    blueprint_id: generateId('blueprint-'),
    user_id: userId || generateId('user-'),
    title: faker.lorem.sentence(),
    organization_name: faker.company.name(),
    industry: faker.helpers.arrayElement(industries),
    department: faker.helpers.arrayElement(departments),
    team_size: faker.helpers.arrayElement(['1-10', '11-50', '51-100', '100+']),
    timeline: faker.helpers.arrayElement(['1-3 months', '3-6 months', '6-12 months', '1+ years']),
    budget: faker.helpers.arrayElement(['<50K', '50K-100K', '100K-500K', '500K+']),
    static_answers: {
      organization_context: {
        industry: faker.helpers.arrayElement(industries),
        department: faker.helpers.arrayElement(departments),
        team_size: faker.helpers.arrayElement(['1-10', '11-50', '51-100', '100+']),
        timeline: faker.helpers.arrayElement([
          '1-3 months',
          '3-6 months',
          '6-12 months',
          '1+ years',
        ]),
        budget: faker.helpers.arrayElement(['<50K', '50K-100K', '100K-500K', '500K+']),
      },
      learning_goals: faker.helpers.arrayElements(
        ['skill enhancement', 'performance improvement', 'team collaboration', 'innovation'],
        { min: 1, max: 3 }
      ),
    },
    dynamic_questions: {
      sections: [
        {
          id: generateId('section-'),
          title: faker.lorem.words(3),
          questions: [
            {
              id: generateId('q-'),
              type: faker.helpers.arrayElement(['radio_pills', 'text', 'scale', 'checkbox_pills']),
              question: faker.lorem.sentence() + '?',
              options: faker.helpers.arrayElements(['Option A', 'Option B', 'Option C'], {
                min: 2,
                max: 4,
              }),
              required: faker.datatype.boolean(),
            },
          ],
        },
      ],
    },
    dynamic_answers: {},
    blueprint_json: {
      title: faker.lorem.sentence(),
      objectives: faker.helpers.arrayElements(
        ['Enhance technical skills', 'Improve team collaboration', 'Increase productivity'],
        { min: 1, max: 3 }
      ),
      modules: [
        {
          id: generateId('module-'),
          title: faker.lorem.words(3),
          duration: faker.helpers.arrayElement(['1 week', '2 weeks', '4 weeks', '8 weeks']),
          objectives: faker.helpers.arrayElements(
            ['Learn new technologies', 'Improve coding practices', 'Team building'],
            { min: 1, max: 2 }
          ),
        },
      ],
      timeline: faker.helpers.arrayElement(['1 month', '3 months', '6 months']),
      budget: faker.number.int({ min: 50000, max: 500000 }),
      success_metrics: faker.helpers.arrayElements(
        ['Completion rate > 80%', 'Skill improvement assessment', 'Team performance metrics'],
        { min: 1, max: 2 }
      ),
    },
    blueprint_markdown: `# ${faker.lorem.sentence()}\n\n## Objectives\n\n${faker.lorem.paragraph()}\n\n## Modules\n\n### ${faker.lorem.words(3)}\n\n${faker.lorem.paragraph()}`,
    status: faker.helpers.arrayElement(statuses),
    generated_at: generateDate(-1),
    created_at: generateDate(-7),
    updated_at: generateDate(-1),
    ...overrides,
  };
};

// API request factory
export const createApiRequest = (overrides: any = {}) => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-forwarded-for': faker.internet.ip(),
    'x-real-ip': faker.internet.ip(),
    'user-agent': faker.internet.userAgent(),
    ...(overrides.headers || {}),
  },
  body: JSON.stringify({
    tier: faker.helpers.arrayElement(['navigator', 'voyager', 'crew']),
    billingCycle: faker.helpers.arrayElement(['monthly', 'yearly']),
    seats: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 100 }) : undefined,
    customerInfo: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      contact: faker.phone.number(),
    },
    metadata: {
      source: 'web',
      campaign: faker.lorem.word(),
    },
    ...(overrides.body || {}),
  }),
  ...overrides,
});

// Response factory
export const createApiResponse = (data: any = {}, overrides = {}) => ({
  success: true,
  data,
  requestId: generateId('req_'),
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Error response factory
export const createErrorResponse = (
  code: string,
  message: string,
  status = 400,
  overrides: any = {}
) => ({
  success: false,
  error: {
    code,
    message,
    details: overrides.details || null,
  },
  requestId: generateId('req_'),
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Export all factories
// Named exports for helper functions
export { generateId, generateDate, generateTimestamp };

export default {
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
};
