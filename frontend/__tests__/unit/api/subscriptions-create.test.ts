/**
 * Unit Tests for POST /api/subscriptions/create-subscription
 *
 * Tests the subscription creation endpoint with comprehensive coverage:
 * - Request validation and authentication
 * - Razorpay customer creation
 * - Razorpay subscription creation
 * - Database record keeping
 * - Error handling and edge cases
 * - Business logic validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Set environment variables before importing modules
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890ABCDEF';
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET = 'rzp_test_secret_key_1234567890';
  process.env.NODE_ENV = 'test';
});

// Mock external dependencies before route imports
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/razorpay/client');

// Import route after mocking
import { POST } from '@/app/api/subscriptions/create-subscription/route';
import {
  createMockSupabaseClient,
  mockUser,
  mockUserProfile,
  supabaseErrors,
} from '@/__tests__/mocks/supabase';
import {
  createMockRazorpayClient,
  mockRazorpayCustomer,
  mockRazorpaySubscription,
  createErrorMocks,
} from '@/__tests__/mocks/razorpay';
import {
  createSubscription,
  createRazorpayCustomer as createCustomerFactory,
  createUserProfile,
} from '@/__tests__/mocks/factories';
import * as razorpayClient from '@/lib/razorpay/client';

describe('POST /api/subscriptions/create-subscription', () => {
  let mockSupabase: any;
  let mockRazorpay: any;
  let mockUserSession: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock clients
    mockSupabase = createMockSupabaseClient();
    mockRazorpay = createMockRazorpayClient();

    // Setup authenticated user session
    mockUserSession = {
      user: mockUser,
      session: { access_token: 'test-token', expires_at: Date.now() + 3600 },
    };

    // Mock Supabase client injection
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    // Mock Razorpay client injection
    const { getRazorpayClient } = razorpayClient;
    getRazorpayClient.mockReturnValue(mockRazorpay);

    // Setup successful auth by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated state
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if session is expired', async () => {
      // Mock expired session
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer expired-token',
          },
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Request Validation', () => {
    it('should return 400 if request body is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: null,
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid request');
    });

    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            // Missing tier and billingCycle
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('tier');
      expect(data.error).toContain('billingCycle');
    });

    it('should return 400 if tier is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'invalid_tier',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid tier');
    });

    it('should return 400 if billing cycle is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'invalid_cycle',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid billing cycle');
    });

    it('should return 400 if customer email is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'invalid-email',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid email');
    });

    it('should return 400 if contact phone is invalid', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '123',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid contact');
    });
  });

  describe('Business Logic Validation', () => {
    it('should reject creation if user already has active subscription', async () => {
      // Mock existing active subscription
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ status: 'active' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Active subscription already exists');
      expect(data.upgradeUrl).toBeDefined();
    });

    it('should allow multiple subscriptions for different tiers (upgrade scenario)', async () => {
      // Mock existing subscription but allow upgrades
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [{ status: 'active', subscription_tier: 'explorer' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      // Should proceed with creation for upgrade
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Razorpay Integration', () => {
    it('should create Razorpay customer with correct data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      await POST(request);

      expect(mockRazorpay.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          contact: '+919876543210',
          notes: expect.objectContaining({
            user_id: mockUser.id,
            source: 'polaris_v3_subscription',
            created_at: expect.any(String),
          }),
        })
      );
    });

    it('should create Razorpay subscription with correct parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      await POST(request);

      expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_id: expect.any(String), // Should get plan ID from config
          customer_id: mockRazorpayCustomer.id,
          total_count: 12, // Monthly for 1 year
          notes: expect.objectContaining({
            user_id: mockUser.id,
            subscription_tier: 'navigator',
            billing_cycle: 'monthly',
            seats: '1',
            source: 'polaris_v3_subscription',
          }),
        })
      );
    });

    it('should use correct plan ID based on tier and billing cycle', async () => {
      const testCases = [
        { tier: 'navigator', billingCycle: 'monthly', expectedCount: 12 },
        { tier: 'voyager', billingCycle: 'yearly', expectedCount: 1 },
        { tier: 'crew', billingCycle: 'monthly', expectedCount: 12 },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const request = new NextRequest(
          'http://localhost:3000/api/subscriptions/create-subscription',
          {
            method: 'POST',
            body: JSON.stringify({
              tier: testCase.tier,
              billingCycle: testCase.billingCycle,
              customerInfo: {
                name: 'Test User',
                email: 'test@example.com',
                contact: '+919876543210',
              },
            }),
          }
        );

        await POST(request);

        expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            total_count: testCase.expectedCount,
            notes: expect.objectContaining({
              subscription_tier: testCase.tier,
              billing_cycle: testCase.billingCycle,
            }),
          })
        );
      }
    });
  });

  describe('Database Operations', () => {
    it('should save subscription record to database', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          razorpay_subscription_id: mockRazorpaySubscription.id,
          razorpay_customer_id: mockRazorpayCustomer.id,
          status: 'created',
          subscription_tier: 'navigator',
          plan_period: 'monthly',
        })
      );
    });

    it('should update user profile with subscription tier', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'voyager',
            billingCycle: 'yearly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'voyager',
        })
      );
    });

    it('should include complete metadata in subscription record', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            seats: 5,
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
            metadata: {
              source: 'web',
              campaign: 'summer_promo',
            },
          }),
        }
      );

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            billing_cycle: 'monthly',
            seats: '5',
            customer_info: expect.objectContaining({
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            }),
            source: 'web',
            campaign: 'summer_promo',
            created_via_api: 'create-subscription',
            api_request_id: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Response Format', () => {
    it('should return subscription details on successful creation', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        subscription: expect.objectContaining({
          subscription_id: expect.any(String),
          razorpay_subscription_id: mockRazorpaySubscription.id,
          razorpay_customer_id: mockRazorpayCustomer.id,
          status: 'created',
          subscription_tier: 'navigator',
          plan_period: 'monthly',
          short_url: mockRazorpaySubscription.short_url,
        }),
      });
    });

    it('should include next billing date in response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      const data = await response.json();
      expect(data.subscription).toHaveProperty('next_billing_date');
      expect(data.subscription).toHaveProperty('current_start');
      expect(data.subscription).toHaveProperty('current_end');
    });
  });

  describe('Error Handling', () => {
    it('should handle Razorpay customer creation failure', async () => {
      mockRazorpay.customers.create.mockRejectedValue(createErrorMocks.customerNotFound);

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to create customer');
    });

    it('should handle Razorpay subscription creation failure', async () => {
      mockRazorpay.subscriptions.create.mockRejectedValue(createErrorMocks.invalidPlanId);

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to create subscription');
    });

    it('should handle database save failure', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: supabaseErrors.connectionError,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to save subscription');
    });

    it('should handle user profile update failure gracefully', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockResolvedValue({ data: null, error: supabaseErrors.timeoutError }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      // Should still succeed but include warning
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.warning).toContain('Failed to update user profile');
    });

    it('should handle rate limit errors from Razorpay', async () => {
      mockRazorpay.customers.create.mockRejectedValue(createErrorMocks.rateLimit);

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
      expect(data.retryAfter).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle optional seats parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'crew',
            billingCycle: 'monthly',
            seats: 10,
            customerInfo: {
              name: 'Company User',
              email: 'company@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      await POST(request);

      expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.objectContaining({
            seats: '10',
          }),
        })
      );
    });

    it('should default seats to 1 if not provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
            // No seats parameter
          }),
        }
      );

      await POST(request);

      expect(mockRazorpay.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.objectContaining({
            seats: '1',
          }),
        })
      );
    });

    it('should handle very long customer names', async () => {
      const longName = 'A'.repeat(200); // 200 characters

      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: longName,
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Name too long');
    });

    it('should validate minimum seat requirements for team plans', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'crew', // Team plan
            billingCycle: 'monthly',
            seats: 1, // Too few for team plan
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Team plans require minimum');
    });
  });

  describe('Security & Data Privacy', () => {
    it('should not expose sensitive Razorpay data in response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Should not expose internal Razorpay IDs or sensitive data
      expect(data.subscription).not.toHaveProperty('razorpay_key_id');
      expect(data.subscription).not.toHaveProperty('api_secret');
      expect(data.subscription).not.toHaveProperty('internal_notes');
    });

    it('should sanitize customer notes before storing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/subscriptions/create-subscription',
        {
          method: 'POST',
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            customerInfo: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '+919876543210',
            },
            metadata: {
              malicious_script: '<script>alert("xss")</script>',
              sql_injection: "'; DROP TABLE users; --",
            },
          }),
        }
      );

      await POST(request);

      // Should sanitize malicious content
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.not.toContain('<script>'),
        })
      );
    });
  });
});
