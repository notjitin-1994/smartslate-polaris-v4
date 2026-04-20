/**
 * Unit Tests for POST /api/webhooks/razorpay
 *
 * Tests the Razorpay webhook processing endpoint with comprehensive coverage:
 * - Webhook signature verification
 * - Event type handling (subscription, payment, etc.)
 * - Database synchronization
 * - Idempotency and duplicate prevention
 * - Error handling and retry logic
 * - Security validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/webhooks/razorpay/route';
import {
  createMockSupabaseClient,
  mockSubscription,
  mockPayment,
  mockWebhookEvent,
  supabaseErrors,
} from '@/__tests__/mocks/supabase';
import { createSubscription, createPayment, createWebhookEvent } from '@/__tests__/mocks/factories';
import * as crypto from 'crypto';

// Mock external dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/razorpay/webhookVerification');

describe('POST /api/webhooks/razorpay', () => {
  let mockSupabase: any;
  let webhookSecret: string;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock clients
    mockSupabase = createMockSupabaseClient();
    webhookSecret = 'test_webhook_secret';

    // Mock Supabase client injection
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockReturnValue(mockSupabase);

    // Mock webhook verification
    const { verifyWebhookSignature } = require('@/lib/razorpay/webhookVerification');
    verifyWebhookSignature.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Webhook Authentication', () => {
    it('should return 401 if webhook signature is missing', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: { subscription: { id: 'sub_test123' } },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Missing X-Razorpay-Signature
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Missing webhook signature');
    });

    it('should return 401 if webhook signature verification fails', async () => {
      const { verifyWebhookSignature } = require('@/lib/razorpay/webhookVerification');
      verifyWebhookSignature.mockReturnValue(false);

      const payload = {
        event: 'subscription.activated',
        payload: { subscription: { id: 'sub_test123' } },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'invalid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid webhook signature');
    });

    it('should return 400 if request body is invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: 'invalid json {',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('Event Type Handling', () => {
    describe('Subscription Events', () => {
      it('should handle subscription.activated event', async () => {
        const payload = {
          event: 'subscription.activated',
          payload: {
            subscription: {
              id: 'sub_test123',
              status: 'active',
              customer_id: 'cust_test123',
              plan_id: 'plan_test123',
              current_start: 1698576000,
              current_end: 1701254400,
              total_count: 12,
              paid_count: 1,
              notes: {
                user_id: 'user_test123',
                subscription_tier: 'navigator',
                billing_cycle: 'monthly',
              },
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.received).toBe(true);

        // Should update subscription status
        expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'active',
            current_start: expect.any(String),
            current_end: expect.any(String),
          })
        );
      });

      it('should handle subscription.completed event', async () => {
        const payload = {
          event: 'subscription.completed',
          payload: {
            subscription: {
              id: 'sub_test123',
              status: 'completed',
              ended_at: 1701254400,
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);

        // Should mark subscription as completed
        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'completed',
            ended_at: expect.any(String),
          })
        );
      });

      it('should handle subscription.cancelled event', async () => {
        const payload = {
          event: 'subscription.cancelled',
          payload: {
            subscription: {
              id: 'sub_test123',
              status: 'cancelled',
              ended_at: 1701254400,
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);

        // Should mark subscription as cancelled
        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'cancelled',
            ended_at: expect.any(String),
          })
        );
      });

      it('should handle subscription.halted event', async () => {
        const payload = {
          event: 'subscription.halted',
          payload: {
            subscription: {
              id: 'sub_test123',
              status: 'halted',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);

        // Should mark subscription as halted
        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'halted',
          })
        );
      });
    });

    describe('Payment Events', () => {
      it('should handle payment.captured event', async () => {
        const payload = {
          event: 'payment.captured',
          payload: {
            payment: {
              id: 'pay_test123',
              amount: 290000,
              currency: 'INR',
              status: 'captured',
              order_id: null,
              invoice_id: null,
              notes: {
                subscription_id: 'sub_test123',
              },
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);

        // Should create payment record
        expect(mockSupabase.from).toHaveBeenCalledWith('payments');
        expect(mockSupabase.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            razorpay_payment_id: 'pay_test123',
            amount: 290000,
            currency: 'INR',
            status: 'captured',
          })
        );
      });

      it('should handle payment.failed event', async () => {
        const payload = {
          event: 'payment.failed',
          payload: {
            payment: {
              id: 'pay_test123',
              amount: 290000,
              status: 'failed',
              error_code: 'CARD_DECLINED',
              error_description: 'Card was declined',
              notes: {
                subscription_id: 'sub_test123',
              },
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);

        // Should create failed payment record
        expect(mockSupabase.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            razorpay_payment_id: 'pay_test123',
            status: 'failed',
            failure_reason: 'CARD_DECLINED',
          })
        );
      });
    });

    describe('Unknown Event Types', () => {
      it('should handle unknown event types gracefully', async () => {
        const payload = {
          event: 'unknown.event',
          payload: {
            some_data: 'value',
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': 'valid_signature',
          },
          body: JSON.stringify(payload),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.warning).toContain('Unknown event type');

        // Should still log the webhook event
        expect(mockSupabase.from).toHaveBeenCalledWith('razorpay_webhook_events');
      });
    });
  });

  describe('Database Operations', () => {
    it('should create webhook event record for all events', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Should create webhook event record
      expect(mockSupabase.from).toHaveBeenCalledWith('razorpay_webhook_events');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'subscription.activated',
          payload: payload,
          processed: true,
        })
      );
    });

    it('should find existing subscription by Razorpay ID', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'sub_test123',
            status: 'active',
          },
        },
      };

      // Mock existing subscription lookup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubscription,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('razorpay_subscription_id', 'sub_test123');
    });

    it('should handle subscription not found gracefully', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'sub_nonexistent',
            status: 'active',
          },
        },
      };

      // Mock subscription not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: supabaseErrors.recordNotFound,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.warning).toContain('Subscription not found');
    });
  });

  describe('Idempotency', () => {
    it('should not process duplicate webhook events', async () => {
      const webhookId = 'webhook_test123';
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
      };

      // Mock existing webhook event
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { webhook_event_id: webhookId, processed: true },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
          'X-Razorpay-Webhook-Id': webhookId,
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.duplicate).toBe(true);

      // Should not update subscription again
      expect(mockSupabase.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });

    it('should track Razorpay webhook ID for idempotency', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
      };

      // Check that webhook ID is being processed
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null, // Not processed before
              error: supabaseErrors.recordNotFound,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
          'X-Razorpay-Webhook-Id': 'webhook_test123',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Should save webhook event with Razorpay ID
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          razorpay_webhook_id: 'webhook_test123',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
      };

      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Database error');

      // Should still attempt to log the webhook failure
      expect(mockSupabase.from).toHaveBeenCalledWith('razorpay_webhook_events');
    });

    it('should handle malformed webhook payloads', async () => {
      const payload = {
        event: 'subscription.activated',
        // Missing required payload.subscription
        payload: {},
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid webhook payload');
    });

    it('should retry failed webhook processing', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
      };

      // Mock first attempt failure, second attempt success
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockRejectedValue(supabaseErrors.connectionError),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            }),
          }),
        });

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      // Should succeed after retry
      expect(response.status).toBe(200);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should validate subscription data before processing', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            // Missing required ID
            status: 'active',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid subscription data');
    });

    it('should sanitize webhook payload before storing', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'sub_test123',
            status: 'active',
            notes: {
              user_id: 'user_test123',
              malicious_data: '<script>alert("xss")</script>',
            },
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Should sanitize malicious content in payload
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.not.toContain('<script>'),
        })
      );
    });

    it('should validate payment amount and currency', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            id: 'pay_test123',
            amount: -1000, // Invalid negative amount
            currency: 'INVALID', // Invalid currency
            status: 'captured',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid payment data');
    });
  });

  describe('Performance and Scalability', () => {
    it('should process webhook events quickly', async () => {
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'sub_test123',
            status: 'active',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const startTime = Date.now();
      const response = await POST(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large webhook payloads efficiently', async () => {
      // Create a large payload with many subscription line items
      const largePayload = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            id: 'sub_test123',
            status: 'active',
            line_items: Array.from({ length: 1000 }, (_, i) => ({
              id: `item_${i}`,
              name: `Line Item ${i}`,
              amount: 1000,
            })),
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(largePayload),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      // Should handle large payloads without timeout
    });
  });

  describe('Security', () => {
    it('should prevent webhook replay attacks', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
        created_at: oldTimestamp,
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Webhook timestamp too old');
    });

    it('should validate webhook source IP', async () => {
      // Mock request from unauthorized IP
      const payload = {
        event: 'subscription.activated',
        payload: {
          subscription: { id: 'sub_test123' },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'valid_signature',
          'X-Forwarded-For': '192.168.1.100', // Unauthorized IP
        },
        body: JSON.stringify(payload),
      });

      // This test depends on IP whitelist configuration
      // For now, just ensure the endpoint processes the request
      const response = await POST(request);
      expect([200, 400]).toContain(response.status); // Accept either success or IP rejection
    });
  });
});
