/**
 * Subscription Grace Period Lifecycle Integration Tests
 *
 * @description Integration tests for the complete subscription lifecycle
 * including grace periods, automated processing, and monitoring
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import {
  getGracePeriodStatus,
  startGracePeriod,
  sendGracePeriodWarning,
  endGracePeriod,
  processAllGracePeriods,
} from '@/lib/subscription/gracePeriodManager';
import { logEvent } from '@/lib/monitoring/subscriptionMonitoring';

// Mock Supabase
vi.mock('@/lib/supabase/server');
// Mock monitoring
vi.mock('@/lib/monitoring/subscriptionMonitoring');

describe('Subscription Grace Period Lifecycle Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a comprehensive mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase);
    vi.mocked(logEvent).mockResolvedValue(undefined);
  });

  describe('Complete Grace Period Lifecycle', () => {
    it('should handle full lifecycle from payment failure to account downgrade', async () => {
      // Setup: User with active subscription
      const userId = 'user_123';
      const subscriptionId = 'sub_456';
      const now = new Date('2025-01-15T10:00:00Z');

      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Step 1: User has active subscription
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          subscription_status: 'active',
          subscription_ends_at: '2025-02-15T10:00:00Z',
          grace_period_start: null,
          grace_period_end: null,
          grace_period_warnings_sent: [],
        },
        error: null,
      });

      let status = await getGracePeriodStatus(userId);
      expect(status.isInGracePeriod).toBe(false);

      // Step 2: Payment fails, grace period starts
      mockSupabase.update.mockResolvedValueOnce({ error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      await startGracePeriod(userId, subscriptionId, 'payment_failed');

      // Verify grace period started
      expect(mockSupabase.update).toHaveBeenCalledWith({
        grace_period_start: expect.any(String),
        grace_period_end: expect.any(String),
        grace_period_warnings_sent: [],
        grace_period_reason: 'payment_failed',
      });

      // Step 3: Check grace period status
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          subscription_status: 'active',
          subscription_ends_at: '2025-02-15T10:00:00Z',
          grace_period_start: '2025-01-15T10:00:00Z',
          grace_period_end: '2025-01-22T10:00:00Z', // 7 days
          grace_period_warnings_sent: [],
        },
        error: null,
      });

      status = await getGracePeriodStatus(userId);
      expect(status.isInGracePeriod).toBe(true);
      expect(status.daysRemaining).toBe(7);
      expect(status.restrictions.canCreateBlueprints).toBe(true); // Limited access
      expect(status.restrictions.canAccessPremiumFeatures).toBe(false);

      // Step 4: Send 5-day warning
      vi.setSystemTime(new Date('2025-01-17T10:00:00Z')); // 2 days later

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          grace_period_end: '2025-01-22T10:00:00Z',
          grace_period_warnings_sent: [],
          email: 'user@example.com',
        },
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({ error: null });

      await sendGracePeriodWarning(userId, 5);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        grace_period_warnings_sent: [5],
      });

      // Step 5: Send 3-day warning
      vi.setSystemTime(new Date('2025-01-19T10:00:00Z'));

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          grace_period_end: '2025-01-22T10:00:00Z',
          grace_period_warnings_sent: [5],
          email: 'user@example.com',
        },
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({ error: null });

      await sendGracePeriodWarning(userId, 3);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        grace_period_warnings_sent: [5, 3],
      });

      // Step 6: Send 1-day warning
      vi.setSystemTime(new Date('2025-01-21T10:00:00Z'));

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          grace_period_end: '2025-01-22T10:00:00Z',
          grace_period_warnings_sent: [5, 3],
          email: 'user@example.com',
        },
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({ error: null });

      await sendGracePeriodWarning(userId, 1);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        grace_period_warnings_sent: [5, 3, 1],
      });

      // Step 7: Grace period ends, account downgraded
      vi.setSystemTime(new Date('2025-01-23T10:00:00Z')); // After grace period

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          grace_period_reason: 'payment_failed',
        },
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({ error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      await endGracePeriod(userId, subscriptionId);

      // Verify downgrade to explorer tier
      expect(mockSupabase.update).toHaveBeenCalledWith({
        subscription_tier: 'explorer',
        subscription_status: 'active',
        grace_period_start: null,
        grace_period_end: null,
        grace_period_warnings_sent: [],
        grace_period_reason: null,
        blueprint_creation_limit: 2,
        blueprint_saving_limit: 1,
      });

      // Step 8: Verify final status
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'explorer',
          subscription_status: 'active',
          grace_period_start: null,
          grace_period_end: null,
          grace_period_warnings_sent: [],
        },
        error: null,
      });

      status = await getGracePeriodStatus(userId);
      expect(status.isInGracePeriod).toBe(false);

      vi.useRealTimers();
    });

    it('should handle multiple users in different grace period stages', async () => {
      const now = new Date('2025-01-15T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Mock multiple users with different grace period statuses
      const users = [
        {
          id: 'user_1',
          subscription_tier: 'explorer',
          grace_period_end: '2025-01-20T10:00:00Z', // 5 days remaining
          grace_period_warnings_sent: [],
          razorpay_subscription_id: 'sub_1',
        },
        {
          id: 'user_2',
          subscription_tier: 'crew',
          grace_period_end: '2025-01-16T10:00:00Z', // 1 day remaining
          grace_period_warnings_sent: [5, 3],
          razorpay_subscription_id: 'sub_2',
        },
        {
          id: 'user_3',
          subscription_tier: 'voyager',
          grace_period_end: '2025-01-14T10:00:00Z', // Already ended
          grace_period_warnings_sent: [1, 3],
          razorpay_subscription_id: 'sub_3',
        },
      ];

      // Mock the user query
      mockSupabase.not.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: users,
        error: null,
      });

      // Mock individual user profile queries
      users.forEach((user) => {
        mockSupabase.single.mockResolvedValueOnce({
          data: user,
          error: null,
        });
      });

      // Mock update and insert operations
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      // Process all grace periods
      const result = await processAllGracePeriods();

      expect(result.processed).toBe(3);
      expect(result.warningsSent).toBeGreaterThan(0);
      expect(result.gracePeriodsEnded).toBeGreaterThan(0);

      // Verify monitoring events were logged
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          category: 'grace_period',
        })
      );

      vi.useRealTimers();
    });

    it('should handle subscription reactivation during grace period', async () => {
      const userId = 'user_123';
      const now = new Date('2025-01-15T10:00:00Z');

      vi.useFakeTimers();
      vi.setSystemTime(now);

      // User is in grace period
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'navigator',
          subscription_status: 'grace_period',
          grace_period_start: '2025-01-10T10:00:00Z',
          grace_period_end: '2025-01-17T10:00:00Z', // 2 days remaining
          grace_period_warnings_sent: [3],
        },
        error: null,
      });

      let status = await getGracePeriodStatus(userId);
      expect(status.isInGracePeriod).toBe(true);
      expect(status.daysRemaining).toBe(2);

      // Payment succeeds, subscription reactivated
      mockSupabase.update.mockResolvedValueOnce({ error: null });

      // Simulate subscription reactivation (this would be handled by webhook/payment success)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          subscription_tier: 'navigator',
          subscription_status: 'active',
          subscription_ends_at: '2025-02-15T10:00:00Z',
          grace_period_start: null,
          grace_period_end: null,
          grace_period_warnings_sent: [],
        },
        error: null,
      });

      status = await getGracePeriodStatus(userId);
      expect(status.isInGracePeriod).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Automated Processing Integration', () => {
    it('should run scheduled grace period processing', async () => {
      const now = new Date('2025-01-15T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Mock users needing processing
      const usersNeedingProcessing = [
        {
          id: 'user_a',
          subscription_tier: 'explorer',
          grace_period_end: '2025-01-14T10:00:00Z', // Should end
          grace_period_warnings_sent: [1],
          razorpay_subscription_id: 'sub_a',
        },
        {
          id: 'user_b',
          subscription_tier: 'crew',
          grace_period_end: '2025-01-18T10:00:00Z', // Should send 3-day warning
          grace_period_warnings_sent: [5],
          razorpay_subscription_id: 'sub_b',
        },
      ];

      // Setup mock responses
      mockSupabase.not.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: usersNeedingProcessing,
        error: null,
      });

      // Mock individual user queries
      usersNeedingProcessing.forEach((user) => {
        mockSupabase.single.mockResolvedValueOnce({
          data: user,
          error: null,
        });
      });

      // Mock database operations
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      // Run processing
      const result = await processAllGracePeriods();

      expect(result.processed).toBe(2);
      expect(result.warningsSent).toBeGreaterThanOrEqual(1);
      expect(result.gracePeriodsEnded).toBeGreaterThanOrEqual(1);
      expect(result.errors).toHaveLength(0);

      // Verify audit log entries
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: expect.stringMatching(/grace_period_ended|grace_period_warning/),
          }),
        ])
      );

      vi.useRealTimers();
    });

    it('should handle processing errors gracefully', async () => {
      const now = new Date('2025-01-15T10:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Mock user that will cause an error
      mockSupabase.not.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'user_error',
            subscription_tier: 'explorer',
            grace_period_end: '2025-01-14T10:00:00Z',
            grace_period_warnings_sent: [1],
            razorpay_subscription_id: 'sub_error',
          },
        ],
        error: null,
      });

      // Mock database error for this user
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      // Run processing
      const result = await processAllGracePeriods();

      expect(result.processed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to process grace period for user');

      // Should still log the processing attempt
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          severity: 'error',
          category: 'grace_period',
        })
      );

      vi.useRealTimers();
    });
  });

  describe('Different Tier Behaviors', () => {
    it('should handle enterprise tier with extended grace period and full access', async () => {
      const userId = 'enterprise_user';
      const now = new Date('2025-01-15T10:00:00Z');

      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Enterprise user in grace period
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'enterprise',
          subscription_status: 'grace_period',
          grace_period_start: '2025-01-01T10:00:00Z',
          grace_period_end: '2025-01-31T10:00:00Z', // 16 days remaining
          grace_period_warnings_sent: [14],
        },
        error: null,
      });

      const status = await getGracePeriodStatus(userId);

      expect(status.isInGracePeriod).toBe(true);
      expect(status.daysRemaining).toBe(16);
      expect(status.restrictions.canCreateBlueprints).toBe(true); // Full access
      expect(status.restrictions.canSaveBlueprints).toBe(true);
      expect(status.restrictions.canAccessPremiumFeatures).toBe(true); // Full access
      expect(status.restrictions.maxBlueprintsPerMonth).toBe(999);

      vi.useRealTimers();
    });

    it('should handle developer tier with extended grace period', async () => {
      const userId = 'developer_user';
      const now = new Date('2025-01-15T10:00:00Z');

      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Developer user in grace period
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'developer',
          subscription_status: 'grace_period',
          grace_period_start: '2024-12-15T10:00:00Z',
          grace_period_end: '2025-03-15T10:00:00Z', // 60 days remaining
          grace_period_warnings_sent: [30],
        },
        error: null,
      });

      const status = await getGracePeriodStatus(userId);

      expect(status.isInGracePeriod).toBe(true);
      expect(status.daysRemaining).toBe(60);
      expect(status.restrictions.canCreateBlueprints).toBe(true);
      expect(status.restrictions.canSaveBlueprints).toBe(true);
      expect(status.restrictions.canAccessPremiumFeatures).toBe(true);
      expect(status.restrictions.maxBlueprintsPerMonth).toBe(999);

      vi.useRealTimers();
    });

    it('should handle team tier suspension instead of downgrade', async () => {
      const userId = 'team_user';
      const now = new Date('2025-01-15T10:00:00Z');

      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Team user with expired grace period
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'crew',
          grace_period_reason: 'payment_failed',
        },
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({ error: null });
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      await endGracePeriod(userId, 'sub_123');

      // Verify suspension (not downgrade)
      expect(mockSupabase.update).toHaveBeenCalledWith({
        subscription_tier: 'crew', // Same tier
        subscription_status: 'suspended', // Suspended, not active
        grace_period_start: null,
        grace_period_end: null,
        grace_period_warnings_sent: [],
        grace_period_reason: null,
        blueprint_creation_limit: expect.any(Number),
        blueprint_saving_limit: expect.any(Number),
      });

      vi.useRealTimers();
    });
  });

  describe('Monitoring and Alerting Integration', () => {
    it('should log all grace period events to monitoring system', async () => {
      const userId = 'user_123';
      const subscriptionId = 'sub_456';

      // Test grace period start logging
      mockSupabase.single.mockResolvedValue({
        data: { subscription_tier: 'navigator', subscription_ends_at: '2025-02-15T10:00:00Z' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      await startGracePeriod(userId, subscriptionId, 'payment_failed');

      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security',
          severity: 'warning',
          category: 'grace_period',
          title: 'Grace Period Started',
          data: expect.objectContaining({
            userId,
            subscriptionId,
            subscriptionTier: 'navigator',
            reason: 'payment_failed',
          }),
          tags: ['grace-period', 'started', 'navigator', 'payment_failed'],
        })
      );

      // Test warning logging
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'navigator',
          grace_period_end: '2025-01-22T10:00:00Z',
          grace_period_warnings_sent: [],
          email: 'user@example.com',
        },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });

      await sendGracePeriodWarning(userId, 3);

      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'business',
          severity: 'warning',
          category: 'grace_period',
          title: 'Grace Period Warning Sent',
          data: expect.objectContaining({
            userId,
            warningDay: 3,
            daysRemaining: 3,
          }),
          tags: ['grace-period', 'warning', 'day-3', 'navigator'],
        })
      );

      // Test grace period end logging
      mockSupabase.single.mockResolvedValue({
        data: { subscription_tier: 'navigator', grace_period_reason: 'payment_failed' },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      await endGracePeriod(userId, subscriptionId);

      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'business',
          severity: 'warning',
          category: 'grace_period',
          title: 'Grace Period Ended',
          data: expect.objectContaining({
            userId,
            subscriptionId,
            endAction: 'downgrade',
          }),
          tags: ['grace-period', 'ended', 'downgrade', 'navigator'],
        })
      );
    });

    it('should include detailed context in monitoring events', async () => {
      const userId = 'user_123';
      const now = new Date('2025-01-15T10:00:00Z');

      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'explorer',
          grace_period_end: '2025-01-22T10:00:00Z',
          grace_period_warnings_sent: [5],
          email: 'user@example.com',
        },
        error: null,
      });
      mockSupabase.update.mockResolvedValue({ error: null });

      await sendGracePeriodWarning(userId, 3);

      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            email: 'user@example.com',
            subscriptionTier: 'explorer',
            warningDay: 3,
            daysRemaining: 3,
            gracePeriodEnd: '2025-01-22T10:00:00Z',
          }),
        })
      );

      vi.useRealTimers();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent grace period operations safely', async () => {
      const userId = 'user_123';

      // Mock user in grace period
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'explorer',
          grace_period_end: '2025-01-20T10:00:00Z',
          grace_period_warnings_sent: [],
          email: 'user@example.com',
        },
        error: null,
      });

      // Mock update with delay to simulate concurrent operations
      let updateCount = 0;
      mockSupabase.update.mockImplementation(() => {
        updateCount++;
        return new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 10);
        });
      });

      // Send multiple warnings concurrently
      const promises = [
        sendGracePeriodWarning(userId, 5),
        sendGracePeriodWarning(userId, 3),
        sendGracePeriodWarning(userId, 1),
      ];

      await Promise.all(promises);

      // All operations should complete
      expect(updateCount).toBe(3);
      expect(logEvent).toHaveBeenCalledTimes(3);
    });

    it('should handle data corruption gracefully', async () => {
      const userId = 'user_123';

      // Mock corrupted grace period data
      mockSupabase.single.mockResolvedValue({
        data: {
          subscription_tier: 'explorer',
          grace_period_end: 'invalid-date-string',
          grace_period_warnings_sent: 'not-an-array',
        },
        error: null,
      });

      const status = await getGracePeriodStatus(userId);

      // Should not crash and return safe defaults
      expect(status).toBeDefined();
      expect(typeof status.isInGracePeriod).toBe('boolean');
      expect(typeof status.restrictions.canCreateBlueprints).toBe('boolean');
    });

    it('should handle database timeouts and connection issues', async () => {
      const userId = 'user_123';

      // Mock database timeout
      mockSupabase.single.mockRejectedValue(new Error('Database connection timeout'));

      await expect(getGracePeriodStatus(userId)).resolves.toBeDefined();

      // Should log error to monitoring
      expect(logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          severity: 'error',
          category: 'grace_period',
        })
      );
    });
  });
});
