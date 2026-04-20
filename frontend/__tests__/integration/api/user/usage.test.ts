/**
 * API Integration Tests: GET /api/user/usage
 *
 * Core test coverage for the user usage endpoint focusing on:
 * - Authentication & Authorization
 * - Usage Data Retrieval
 * - Usage Calculations (remaining counts)
 * - Subscription Tier Integration
 * - Exemption Status
 * - Error Handling
 *
 * This endpoint returns the user's current blueprint creation/saving counts,
 * limits, remaining usage, exemption status, and subscription tier.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/user/usage/route';
import { NextRequest } from 'next/server';
import { mockEmailUser, createMockSession } from '@/__tests__/fixtures/auth';

// Mock all dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/blueprintUsageService');
vi.mock('@/lib/logging', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    createServiceLogger: vi.fn(() => mockLogger),
  };
});

describe('GET /api/user/usage', () => {
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };

  function createMockRequest(): NextRequest {
    return {} as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({ session: null });

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: { user: null } as any,
      });

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ success: false, error: 'Unauthorized' });
    });
  });

  describe('Successful Usage Retrieval', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return usage data with correct structure', async () => {
      // Arrange
      const mockUsageInfo = {
        creationCount: 5,
        savingCount: 3,
        creationLimit: 10,
        savingLimit: 10,
        isExempt: false,
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { subscription_tier: 'explorer' },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockResolvedValue(
        mockUsageInfo as any
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        usage: {
          creationCount: 5,
          savingCount: 3,
          creationLimit: 10,
          savingLimit: 10,
          creationRemaining: 5, // 10 - 5
          savingRemaining: 7, // 10 - 3
          isExempt: false,
          exemptionReason: undefined,
          subscriptionTier: 'explorer',
        },
      });
    });

    it('should calculate remaining usage correctly when at limit', async () => {
      // Arrange
      const mockUsageInfo = {
        creationCount: 10,
        savingCount: 10,
        creationLimit: 10,
        savingLimit: 10,
        isExempt: false,
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { subscription_tier: 'explorer' },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockResolvedValue(
        mockUsageInfo as any
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.usage?.creationRemaining).toBe(0);
      expect(data.usage?.savingRemaining).toBe(0);
    });

    it('should calculate remaining usage correctly when over limit', async () => {
      // Arrange - User somehow exceeded limit (edge case)
      const mockUsageInfo = {
        creationCount: 12,
        savingCount: 11,
        creationLimit: 10,
        savingLimit: 10,
        isExempt: false,
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { subscription_tier: 'explorer' },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockResolvedValue(
        mockUsageInfo as any
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert - Should return 0, not negative
      expect(response.status).toBe(200);
      expect(data.usage?.creationRemaining).toBe(0);
      expect(data.usage?.savingRemaining).toBe(0);
    });

    it('should include exemption status and reason when user is exempt', async () => {
      // Arrange
      const mockUsageInfo = {
        creationCount: 50,
        savingCount: 30,
        creationLimit: 100,
        savingLimit: 100,
        isExempt: true,
        exemptionReason: 'Developer account',
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { subscription_tier: 'developer' },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockResolvedValue(
        mockUsageInfo as any
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.usage?.isExempt).toBe(true);
      expect(data.usage?.exemptionReason).toBe('Developer account');
      expect(data.usage?.subscriptionTier).toBe('developer');
    });

    it('should default to "free" tier when profile fetch fails', async () => {
      // Arrange
      const mockUsageInfo = {
        creationCount: 2,
        savingCount: 1,
        creationLimit: 5,
        savingLimit: 5,
        isExempt: false,
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' },
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockResolvedValue(
        mockUsageInfo as any
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert - Should still succeed with default tier
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usage?.subscriptionTier).toBe('free');
    });
  });

  describe('Subscription Tiers', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return correct tier for paid subscription', async () => {
      // Arrange
      const mockUsageInfo = {
        creationCount: 15,
        savingCount: 10,
        creationLimit: 50,
        savingLimit: 50,
        isExempt: false,
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { subscription_tier: 'navigator' },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockResolvedValue(
        mockUsageInfo as any
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.usage?.subscriptionTier).toBe('navigator');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });

    it('should return 500 when usage service throws error', async () => {
      // Arrange
      const mockSupabase = {
        from: vi.fn(),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');
      vi.mocked(BlueprintUsageService.getBlueprintUsageInfo).mockRejectedValue(
        new Error('Usage service error')
      );

      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred');
    });
  });
});
