/**
 * Razorpay Client Unit Tests
 *
 * @description Unit tests for Razorpay SDK client initialization and API functions
 * @version 1.0.0
 * @date 2025-10-29
 *
 * Tests coverage:
 * - Client initialization and environment validation
 * - Singleton pattern behavior
 * - Error handling for missing credentials
 * - API wrapper functions
 * - Security validations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables before importing client
const originalEnv = process.env;

describe('Razorpay Client', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when NEXT_PUBLIC_RAZORPAY_KEY_ID is missing', async () => {
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      await expect(async () => {
        await import('../../../lib/razorpay/client');
      }).rejects.toThrow(
        '[Razorpay Client] Missing required environment variables: NEXT_PUBLIC_RAZORPAY_KEY_ID'
      );
    });

    it('should throw error when RAZORPAY_KEY_SECRET is missing', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(async () => {
        await import('../../../lib/razorpay/client');
      }).rejects.toThrow(
        '[Razorpay Client] Missing required environment variables: RAZORPAY_KEY_SECRET'
      );
    });

    it('should throw error when both environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(async () => {
        await import('../../../lib/razorpay/client');
      }).rejects.toThrow(
        '[Razorpay Client] Missing required environment variables: NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET'
      );
    });

    it('should throw error for invalid key format', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'invalid_key_format';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      await expect(async () => {
        await import('../../../lib/razorpay/client');
      }).rejects.toThrow('[Razorpay Client] Invalid NEXT_PUBLIC_RAZORPAY_KEY_ID format');
    });

    it('should accept valid test mode key format', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      const client = await import('../../../lib/razorpay/client');
      expect(client.razorpayClient).toBeDefined();
    });

    it('should accept valid live mode key format', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_live_secret_key';

      const client = await import('../../../lib/razorpay/client');
      expect(client.razorpayClient).toBeDefined();
    });

    it('should log warning when using test mode in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      await import('../../../lib/razorpay/client');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Using test mode keys in production environment')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should detect test mode correctly', async () => {
      process.env.NODE_ENV = 'development';
      const client = await import('../../../lib/razorpay/client');

      expect(client.isTestMode()).toBe(true);
      expect(client.isLiveMode()).toBe(false);
      expect(client.getRazorpayMode()).toBe('test');
    });

    it('should detect live mode correctly', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_live_secret_key';

      const client = await import('../../../lib/razorpay/client');

      expect(client.isTestMode()).toBe(false);
      expect(client.isLiveMode()).toBe(true);
      expect(client.getRazorpayMode()).toBe('live');
    });

    it('should return key ID correctly', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';

      const client = await import('../../../lib/razorpay/client');

      expect(client.getRazorpayKeyId()).toBe('rzp_test_1234567890ABCDEF');
    });
  });

  describe('API Wrapper Functions', () => {
    let client: any;

    beforeEach(async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      // Reset all mock functions
      vi.clearAllMocks();

      client = await import('../../../lib/razorpay/client');

      // Mock the Razorpay SDK methods using vi.spyOn
      vi.spyOn(client.razorpayClient.subscriptions, 'create');
      vi.spyOn(client.razorpayClient.subscriptions, 'fetch');
      vi.spyOn(client.razorpayClient.subscriptions, 'cancel');
      vi.spyOn(client.razorpayClient.customers, 'create');
      vi.spyOn(client.razorpayClient.customers, 'fetch');
      vi.spyOn(client.razorpayClient.plans, 'create');
      vi.spyOn(client.razorpayClient.plans, 'all');
    });

    describe('createSubscription', () => {
      it('should create subscription with correct parameters', async () => {
        const mockSubscription = { id: 'sub_test123', status: 'created' };
        client.razorpayClient.subscriptions.create.mockResolvedValue(mockSubscription);

        const params = {
          plan_id: 'plan_test123',
          customer_id: 'cust_test123',
          total_count: 12,
          customer_notify: 1,
        };

        const result = await client.createSubscription(params);

        expect(client.razorpayClient.subscriptions.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockSubscription);
      });

      it('should handle subscription creation errors', async () => {
        const error = new Error('API Error: Invalid plan ID');
        client.razorpayClient.subscriptions.create.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        const params = {
          plan_id: 'invalid_plan',
          total_count: 12,
        };

        await expect(client.createSubscription(params)).rejects.toThrow(
          'Failed to create subscription: API Error: Invalid plan ID'
        );
        expect(consoleSpy).toHaveBeenCalledWith('[Razorpay] Subscription creation failed:', error);

        consoleSpy.mockRestore();
      });
    });

    describe('fetchSubscription', () => {
      it('should fetch subscription by ID', async () => {
        const mockSubscription = { id: 'sub_test123', status: 'active' };
        client.razorpayClient.subscriptions.fetch.mockResolvedValue(mockSubscription);

        const result = await client.fetchSubscription('sub_test123');

        expect(client.razorpayClient.subscriptions.fetch).toHaveBeenCalledWith('sub_test123');
        expect(result).toEqual(mockSubscription);
      });

      it('should handle subscription fetch errors', async () => {
        const error = new Error('Subscription not found');
        client.razorpayClient.subscriptions.fetch.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        await expect(client.fetchSubscription('invalid_sub')).rejects.toThrow(
          'Failed to fetch subscription: Subscription not found'
        );
        expect(consoleSpy).toHaveBeenCalledWith('[Razorpay] Subscription fetch failed:', error);

        consoleSpy.mockRestore();
      });
    });

    describe('cancelSubscription', () => {
      it('should cancel subscription with default parameters', async () => {
        const mockSubscription = { id: 'sub_test123', status: 'cancelled' };
        client.razorpayClient.subscriptions.cancel.mockResolvedValue(mockSubscription);

        const result = await client.cancelSubscription('sub_test123');

        expect(client.razorpayClient.subscriptions.cancel).toHaveBeenCalledWith(
          'sub_test123',
          true
        );
        expect(result).toEqual(mockSubscription);
      });

      it('should cancel subscription with custom parameters', async () => {
        const mockSubscription = { id: 'sub_test123', status: 'cancelled' };
        client.razorpayClient.subscriptions.cancel.mockResolvedValue(mockSubscription);

        const result = await client.cancelSubscription('sub_test123', false);

        expect(client.razorpayClient.subscriptions.cancel).toHaveBeenCalledWith(
          'sub_test123',
          false
        );
        expect(result).toEqual(mockSubscription);
      });

      it('should handle subscription cancellation errors', async () => {
        const error = new Error('Cannot cancel active subscription');
        client.razorpayClient.subscriptions.cancel.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        await expect(client.cancelSubscription('sub_test123')).rejects.toThrow(
          'Failed to cancel subscription: Cannot cancel active subscription'
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Razorpay] Subscription cancellation failed:',
          error
        );

        consoleSpy.mockRestore();
      });
    });

    describe('createCustomer', () => {
      it('should create customer with correct parameters', async () => {
        const mockCustomer = { id: 'cust_test123', email: 'test@example.com' };
        client.razorpayClient.customers.create.mockResolvedValue(mockCustomer);

        const params = {
          name: 'Test User',
          email: 'test@example.com',
          contact: '+919876543210',
        };

        const result = await client.createCustomer(params);

        expect(client.razorpayClient.customers.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockCustomer);
      });

      it('should handle customer creation errors', async () => {
        const error = new Error('Invalid email format');
        client.razorpayClient.customers.create.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        const params = {
          name: 'Test User',
          email: 'invalid-email',
        };

        await expect(client.createCustomer(params)).rejects.toThrow(
          'Failed to create customer: Invalid email format'
        );
        expect(consoleSpy).toHaveBeenCalledWith('[Razorpay] Customer creation failed:', error);

        consoleSpy.mockRestore();
      });
    });

    describe('fetchCustomer', () => {
      it('should fetch customer by ID', async () => {
        const mockCustomer = { id: 'cust_test123', email: 'test@example.com' };
        client.razorpayClient.customers.fetch.mockResolvedValue(mockCustomer);

        const result = await client.fetchCustomer('cust_test123');

        expect(client.razorpayClient.customers.fetch).toHaveBeenCalledWith('cust_test123');
        expect(result).toEqual(mockCustomer);
      });

      it('should handle customer fetch errors', async () => {
        const error = new Error('Customer not found');
        client.razorpayClient.customers.fetch.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        await expect(client.fetchCustomer('invalid_cust')).rejects.toThrow(
          'Failed to fetch customer: Customer not found'
        );
        expect(consoleSpy).toHaveBeenCalledWith('[Razorpay] Customer fetch failed:', error);

        consoleSpy.mockRestore();
      });
    });

    describe('createPlan', () => {
      it('should create plan with correct parameters', async () => {
        const mockPlan = { id: 'plan_test123', period: 'monthly' };
        client.razorpayClient.plans.create.mockResolvedValue(mockPlan);

        const params = {
          period: 'monthly' as const,
          interval: 1,
          item: {
            name: 'Navigator Plan',
            description: '25 blueprints per month',
            amount: 3900,
            currency: 'INR',
          },
        };

        const result = await client.createPlan(params);

        expect(client.razorpayClient.plans.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockPlan);
      });

      it('should handle plan creation errors', async () => {
        const error = new Error('Plan with same name already exists');
        client.razorpayClient.plans.create.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        const params = {
          period: 'monthly' as const,
          interval: 1,
          item: {
            name: 'Duplicate Plan',
            amount: 3900,
            currency: 'INR',
          },
        };

        await expect(client.createPlan(params)).rejects.toThrow(
          'Failed to create plan: Plan with same name already exists'
        );
        expect(consoleSpy).toHaveBeenCalledWith('[Razorpay] Plan creation failed:', error);

        consoleSpy.mockRestore();
      });
    });

    describe('fetchAllPlans', () => {
      it('should fetch all plans with default options', async () => {
        const mockPlans = { items: [{ id: 'plan_test123' }], count: 1 };
        client.razorpayClient.plans.all.mockResolvedValue(mockPlans);

        const result = await client.fetchAllPlans();

        expect(client.razorpayClient.plans.all).toHaveBeenCalledWith(undefined);
        expect(result).toEqual(mockPlans);
      });

      it('should fetch plans with custom options', async () => {
        const mockPlans = { items: [{ id: 'plan_test123' }], count: 1 };
        client.razorpayClient.plans.all.mockResolvedValue(mockPlans);

        const options = { count: 10, skip: 5 };
        const result = await client.fetchAllPlans(options);

        expect(client.razorpayClient.plans.all).toHaveBeenCalledWith(options);
        expect(result).toEqual(mockPlans);
      });

      it('should handle plans fetch errors', async () => {
        const error = new Error('API rate limit exceeded');
        client.razorpayClient.plans.all.mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

        await expect(client.fetchAllPlans()).rejects.toThrow(
          'Failed to fetch plans: API rate limit exceeded'
        );
        expect(consoleSpy).toHaveBeenCalledWith('[Razorpay] Plans fetch failed:', error);

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should export the same client instance across imports', async () => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      const client1 = await import('../../../lib/razorpay/client');
      const client2 = await import('../../../lib/razorpay/client');

      expect(client1.razorpayClient).toBe(client2.razorpayClient);
    });
  });

  describe('Security Validations', () => {
    it('should log development mode message', async () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
      process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_key';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      await import('../../../lib/razorpay/client');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialized in TEST mode'));

      consoleSpy.mockRestore();
    });
  });
});
