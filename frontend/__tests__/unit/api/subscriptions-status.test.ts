/**
 * Unit Tests for GET /api/subscriptions/status and POST /api/subscriptions/cancel
 *
 * Tests subscription status retrieval and cancellation endpoints:
 * - Authentication and authorization
 * - Subscription status validation
 * - Cancellation logic and business rules
 * - Database synchronization with Razorpay
 * - Error handling and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/subscriptions/status/route';
import { POST } from '@/app/api/subscriptions/cancel/route';
import {
  createMockSupabaseClient,
  mockUser,
  mockSubscription,
  supabaseErrors,
} from '@/__tests__/mocks/supabase';
import { createMockRazorpayClient, mockRazorpaySubscription } from '@/__tests__/mocks/razorpay';
import { createSubscription } from '@/__tests__/mocks/factories';

// Mock external dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/razorpay/client');

describe('Subscription Status and Cancellation API', () => {
  let mockSupabase: any;
  let mockRazorpay: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = createMockSupabaseClient();
    mockRazorpay = createMockRazorpayClient();

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    const { getRazorpayClient } = require('@/lib/razorpay/client');
    getRazorpayClient.mockReturnValue(mockRazorpay);

    // Setup authenticated user by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/subscriptions/status', () => {
    describe('Authentication', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Subscription Retrieval', () => {
      it('should return user subscription status', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
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

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toMatchObject({
          success: true,
          subscription: expect.objectContaining({
            subscription_id: mockSubscription.subscription_id,
            razorpay_subscription_id: mockSubscription.razorpay_subscription_id,
            status: mockSubscription.status,
            subscription_tier: mockSubscription.subscription_tier,
            plan_period: mockSubscription.plan_period,
            current_start: mockSubscription.current_start,
            current_end: mockSubscription.current_end,
            next_billing_date: mockSubscription.next_billing_date,
          }),
        });
      });

      it('should return null subscription if user has no subscription', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.subscription).toBeNull();
        expect(data.message).toContain('No active subscription found');
      });

      it('should include usage statistics in response', async () => {
        const mockProfile = {
          user_id: mockUser.id,
          subscription_tier: 'navigator',
          blueprint_creation_count: 5,
          blueprint_creation_limit: 25,
          blueprint_saving_count: 3,
          blueprint_saving_limit: 25,
        };

        // Mock subscription query
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
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

        // Mock user profile query
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.subscription).toBeDefined();
        expect(data.usage).toMatchObject({
          blueprint_creation_count: 5,
          blueprint_creation_limit: 25,
          blueprint_saving_count: 3,
          blueprint_saving_limit: 25,
          remaining_creations: 20,
          remaining_savings: 22,
        });
      });

      it('should calculate remaining usage correctly', async () => {
        const mockProfile = {
          user_id: mockUser.id,
          subscription_tier: 'navigator',
          blueprint_creation_count: 23,
          blueprint_creation_limit: 25,
          blueprint_saving_count: 24,
          blueprint_saving_limit: 25,
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
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

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        const data = await response.json();
        expect(data.usage.remaining_creations).toBe(2);
        expect(data.usage.remaining_savings).toBe(1);
        expect(data.usage.creation_usage_percentage).toBe(92);
        expect(data.usage.saving_usage_percentage).toBe(96);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockRejectedValue(supabaseErrors.connectionError),
                }),
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toContain('Failed to fetch subscription status');
      });

      it('should handle user profile fetch errors gracefully', async () => {
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
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

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(supabaseErrors.timeoutError),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/status');

        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.subscription).toBeDefined();
        expect(data.usage).toBeNull();
        expect(data.warning).toContain('Failed to fetch usage statistics');
      });
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    describe('Authentication and Authorization', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 404 if subscription does not exist', async () => {
        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: supabaseErrors.recordNotFound,
                }),
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'nonexistent_sub',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toContain('Subscription not found');
      });

      it('should return 403 if user does not own the subscription', async () => {
        const otherUserSubscription = {
          ...mockSubscription,
          user_id: 'other_user_id',
        };

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: otherUserSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toContain('Access denied');
      });
    });

    describe('Request Validation', () => {
      it('should return 400 if subscriptionId is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            reason: 'No longer needed',
            // Missing subscriptionId
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('subscriptionId is required');
      });

      it('should return 400 if reason is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            // Missing reason
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('reason is required');
      });

      it('should return 400 if reason is too short', async () => {
        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'OK', // Too short
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Reason must be at least');
      });

      it('should return 400 if reason is too long', async () => {
        const longReason = 'A'.repeat(1000); // Too long

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: longReason,
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Reason must be less than');
      });
    });

    describe('Business Logic Validation', () => {
      it('should allow cancellation of active subscriptions', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'Service no longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.subscription.status).toBe('cancelled');
      });

      it('should not allow cancellation of already cancelled subscriptions', async () => {
        const cancelledSubscription = {
          ...mockSubscription,
          status: 'cancelled',
        };

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: cancelledSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Subscription is already cancelled');
      });

      it('should allow cancellation of subscriptions with pending payments', async () => {
        const pendingSubscription = {
          ...mockSubscription,
          status: 'created',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: pendingSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'Changed mind',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });

      it('should handle immediate cancellation (no refund)', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
          refund_amount: 0,
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
            cancelAtCycleEnd: false, // Immediate cancellation
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.subscription.refund_amount).toBe(0);
      });
    });

    describe('Razorpay Integration', () => {
      it('should call Razorpay to cancel subscription', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'Service no longer needed',
          }),
        });

        await POST(request);

        expect(mockRazorpay.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
      });

      it('should update database after successful Razorpay cancellation', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
          ended_at: 1701254400,
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'cancelled',
            ended_at: expect.any(String),
            cancellation_reason: 'No longer needed',
          })
        );
      });

      it('should update user profile subscription tier after cancellation', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        await POST(request);

        // Should update user profile to free tier
        expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            subscription_tier: 'explorer',
          })
        );
      });
    });

    describe('Response Format', () => {
      it('should return cancelled subscription details', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
          ended_at: 1701254400,
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'Service no longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data).toMatchObject({
          success: true,
          message: 'Subscription cancelled successfully',
          subscription: expect.objectContaining({
            subscription_id: mockSubscription.subscription_id,
            status: 'cancelled',
            ended_at: expect.any(String),
            cancellation_reason: 'Service no longer needed',
          }),
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle Razorpay cancellation failure', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockRejectedValue(
          new Error('Cannot cancel active subscription')
        );

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toContain('Failed to cancel subscription');
      });

      it('should handle database update failure after Razorpay cancellation', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
        });

        mockSupabase.update.mockResolvedValue({
          data: null,
          error: supabaseErrors.connectionError,
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toContain('Failed to update subscription');
      });

      it('should handle user profile update failure gracefully', async () => {
        const activeSubscription = {
          ...mockSubscription,
          status: 'active',
          razorpay_subscription_id: 'sub_test123',
        };

        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: activeSubscription,
                  error: null,
                }),
              }),
            }),
          }),
        });

        mockRazorpay.subscriptions.cancel.mockResolvedValue({
          id: 'sub_test123',
          status: 'cancelled',
        });

        // First update (subscription) succeeds
        mockSupabase.update.mockResolvedValueOnce({
          data: { ...activeSubscription, status: 'cancelled' },
          error: null,
        });

        // Second update (user profile) fails
        mockSupabase.update.mockResolvedValueOnce({
          data: null,
          error: supabaseErrors.timeoutError,
        });

        const request = new NextRequest('http://localhost:3000/api/subscriptions/cancel', {
          method: 'POST',
          body: JSON.stringify({
            subscriptionId: 'sub_test123',
            reason: 'No longer needed',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.warning).toContain('Failed to update user profile');
      });
    });
  });
});
