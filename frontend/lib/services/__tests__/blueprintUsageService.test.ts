/**
 * Unit Tests: BlueprintUsageService
 *
 * Core test coverage for blueprint usage tracking service focusing on:
 * - Usage Information Retrieval
 * - Creation/Saving Limit Checks
 * - Fail-Closed Increment Operations (CVE-001 fix)
 * - Raw Blueprint Counts
 * - Effective Limits with Rollover
 * - Comprehensive User Limits
 * - Admin Functions (Exemptions, Upgrades)
 * - Error Handling & Edge Cases
 *
 * This service is critical for enforcing usage limits and preventing
 * unauthorized blueprint creation/saving. Uses fail-closed semantics
 * for security: any error results in denial.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlueprintUsageService } from '../blueprintUsageService';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('BlueprintUsageService', () => {
  const mockUserId = 'user-123';
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(),
    };
  });

  describe('getBlueprintUsageInfo', () => {
    it('should return usage info with correct structure', async () => {
      // Arrange
      const mockRpcResponse = [
        {
          creation_count: 5,
          saving_count: 3,
          creation_limit: 10,
          saving_limit: 10,
          is_exempt: false,
          exemption_reason: null,
          last_creation: '2025-01-10T12:00:00Z',
          last_saving: '2025-01-09T10:00:00Z',
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getBlueprintUsageInfo(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_blueprint_usage_info', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        creationCount: 5,
        savingCount: 3,
        creationLimit: 10,
        savingLimit: 10,
        isExempt: false,
        exemptionReason: null,
        lastCreation: '2025-01-10T12:00:00Z',
        lastSaving: '2025-01-09T10:00:00Z',
      });
    });

    it('should handle missing optional fields with defaults', async () => {
      // Arrange
      const mockRpcResponse = [
        {
          creation_count: null,
          saving_count: null,
          creation_limit: null,
          saving_limit: null,
          is_exempt: null,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getBlueprintUsageInfo(mockSupabase, mockUserId);

      // Assert
      expect(result.creationCount).toBe(0);
      expect(result.savingCount).toBe(0);
      expect(result.creationLimit).toBe(2); // Default limit
      expect(result.savingLimit).toBe(2); // Default limit
      expect(result.isExempt).toBe(false);
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.getBlueprintUsageInfo(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to fetch blueprint usage information');
    });

    it('should throw error when no data returned', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.getBlueprintUsageInfo(mockSupabase, mockUserId)
      ).rejects.toThrow('No usage data returned from database');
    });

    it('should handle exemption reason when user is exempt', async () => {
      // Arrange
      const mockRpcResponse = [
        {
          creation_count: 50,
          saving_count: 30,
          creation_limit: 100,
          saving_limit: 100,
          is_exempt: true,
          exemption_reason: 'Developer account',
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockRpcResponse,
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getBlueprintUsageInfo(mockSupabase, mockUserId);

      // Assert
      expect(result.isExempt).toBe(true);
      expect(result.exemptionReason).toBe('Developer account');
    });
  });

  describe('getRawBlueprintCounts', () => {
    it('should return blueprint counts by status', async () => {
      // Arrange
      const mockBlueprints = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'draft' },
        { status: 'draft' },
        { status: 'draft' },
        { status: 'generating' },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockBlueprints,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await BlueprintUsageService.getRawBlueprintCounts(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        totalBlueprints: 6,
        completedBlueprints: 2,
        draftBlueprints: 3,
      });
    });

    it('should handle empty blueprint list', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await BlueprintUsageService.getRawBlueprintCounts(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        totalBlueprints: 0,
        completedBlueprints: 0,
        draftBlueprints: 0,
      });
    });

    it('should throw error when query fails', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(
        BlueprintUsageService.getRawBlueprintCounts(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to fetch blueprint counts');
    });
  });

  describe('canCreateBlueprint', () => {
    it('should return true when user can create blueprint', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ can_create: true, reason: null }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.canCreateBlueprint(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_blueprint_creation_limits', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        canCreate: true,
        reason: undefined,
      });
    });

    it('should return false with reason when limit reached', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ can_create: false, reason: 'Monthly limit of 10 blueprints reached' }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.canCreateBlueprint(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        canCreate: false,
        reason: 'Monthly limit of 10 blueprints reached',
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.canCreateBlueprint(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to check blueprint creation limits');
    });

    it('should deny when no data returned (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.canCreateBlueprint(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on missing data
      expect(result).toEqual({
        canCreate: false,
        reason: 'Unable to verify blueprint creation limits',
      });
    });
  });

  describe('canSaveBlueprint', () => {
    it('should return true when user can save blueprint', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ can_save: true, reason: null }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.canSaveBlueprint(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_blueprint_saving_limits', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        canSave: true,
        reason: undefined,
      });
    });

    it('should return false with reason when limit reached', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ can_save: false, reason: 'Monthly saving limit of 10 reached' }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.canSaveBlueprint(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        canSave: false,
        reason: 'Monthly saving limit of 10 reached',
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.canSaveBlueprint(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to check blueprint saving limits');
    });

    it('should deny when no data returned (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.canSaveBlueprint(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on missing data
      expect(result).toEqual({
        canSave: false,
        reason: 'Unable to verify blueprint saving limits',
      });
    });
  });

  describe('incrementCreationCountV2 (Fail-Closed Semantics)', () => {
    it('should increment count successfully', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: true, reason: 'Incremented successfully', new_count: 6 }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementCreationCountV2(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_blueprint_creation_count_v2', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        success: true,
        reason: 'Incremented successfully',
        newCount: 6,
      });
    });

    it('should deny when limit reached', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: false, reason: 'Monthly limit reached', new_count: 10 }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementCreationCountV2(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        success: false,
        reason: 'Monthly limit reached',
        newCount: 10,
      });
    });

    it('should deny on RPC error (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST' },
      });

      // Act
      const result = await BlueprintUsageService.incrementCreationCountV2(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on error
      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should deny when no data returned (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementCreationCountV2(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on missing data
      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should deny on exception (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await BlueprintUsageService.incrementCreationCountV2(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on exception
      expect(result).toEqual({
        success: false,
        reason: 'System error - operation denied for safety',
        newCount: 0,
      });
    });

    it('should handle missing success field (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ reason: 'Some reason', new_count: 5 }], // Missing 'success' field
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementCreationCountV2(mockSupabase, mockUserId);

      // Assert - Should default to false
      expect(result.success).toBe(false);
    });
  });

  describe('incrementSavingCountV2 (Fail-Closed Semantics)', () => {
    it('should increment count successfully', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: true, reason: 'Incremented successfully', new_count: 4 }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementSavingCountV2(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_blueprint_saving_count_v2', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        success: true,
        reason: 'Incremented successfully',
        newCount: 4,
      });
    });

    it('should deny when limit reached', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ success: false, reason: 'Saving limit reached', new_count: 10 }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementSavingCountV2(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        success: false,
        reason: 'Saving limit reached',
        newCount: 10,
      });
    });

    it('should deny on RPC error (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST' },
      });

      // Act
      const result = await BlueprintUsageService.incrementSavingCountV2(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on error
      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should deny when no data returned (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.incrementSavingCountV2(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on missing data
      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should deny on exception (fail-closed)', async () => {
      // Arrange
      mockSupabase.rpc.mockRejectedValue(new Error('Connection timeout'));

      // Act
      const result = await BlueprintUsageService.incrementSavingCountV2(mockSupabase, mockUserId);

      // Assert - Fail-closed: deny on exception
      expect(result).toEqual({
        success: false,
        reason: 'System error - operation denied for safety',
        newCount: 0,
      });
    });
  });

  describe('getEffectiveLimits', () => {
    it('should return effective limits with rollover support', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            creation_limit: 50,
            saving_limit: 50,
            creation_used: 20,
            saving_used: 15,
            creation_available: 30,
            saving_available: 35,
          },
        ],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getEffectiveLimits(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_effective_limits', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        creationLimit: 50,
        savingLimit: 50,
        creationUsed: 20,
        savingUsed: 15,
        creationAvailable: 30,
        savingAvailable: 35,
      });
    });

    it('should handle missing fields with defaults', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{}],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getEffectiveLimits(mockSupabase, mockUserId);

      // Assert
      expect(result).toEqual({
        creationLimit: 0,
        savingLimit: 0,
        creationUsed: 0,
        savingUsed: 0,
        creationAvailable: 0,
        savingAvailable: 0,
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.getEffectiveLimits(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to fetch effective limits');
    });

    it('should throw error when no data returned', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.getEffectiveLimits(mockSupabase, mockUserId)
      ).rejects.toThrow('No limits data returned');
    });
  });

  describe('getComprehensiveUserLimits', () => {
    it('should return comprehensive limits with carryover info', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            role: 'user',
            tier: 'navigator',
            max_generations_monthly: 50,
            max_saved_starmaps: 50,
            current_generations: 20,
            current_saved_starmaps: 15,
            generations_remaining: 30,
            saved_remaining: 35,
            is_exempt: false,
            has_free_tier_carryover: true,
            carryover_expires_at: '2025-02-01T00:00:00Z',
          },
        ],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getComprehensiveUserLimits(
        mockSupabase,
        mockUserId
      );

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_limits', {
        p_user_id: mockUserId,
      });
      expect(result).toEqual({
        role: 'user',
        tier: 'navigator',
        maxGenerationsMonthly: 50,
        maxSavedStarmaps: 50,
        currentGenerations: 20,
        currentSavedStarmaps: 15,
        generationsRemaining: 30,
        savedRemaining: 35,
        isExempt: false,
        hasFreeTierCarryover: true,
        carryoverExpiresAt: '2025-02-01T00:00:00Z',
      });
    });

    it('should handle missing optional fields with defaults', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{}],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.getComprehensiveUserLimits(
        mockSupabase,
        mockUserId
      );

      // Assert
      expect(result).toEqual({
        role: 'user',
        tier: 'free',
        maxGenerationsMonthly: 0,
        maxSavedStarmaps: 0,
        currentGenerations: 0,
        currentSavedStarmaps: 0,
        generationsRemaining: 0,
        savedRemaining: 0,
        isExempt: false,
        hasFreeTierCarryover: false,
        carryoverExpiresAt: null,
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.getComprehensiveUserLimits(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to fetch user limits');
    });

    it('should throw error when no data returned', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.getComprehensiveUserLimits(mockSupabase, mockUserId)
      ).rejects.toThrow('No user limits data returned');
    });
  });

  describe('exemptUserFromLimits (Admin Function)', () => {
    it('should exempt user with default reason', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.exemptUserFromLimits(mockSupabase, mockUserId);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('exempt_user_from_blueprint_limits', {
        p_user_id: mockUserId,
        p_reason: 'Developer exemption',
      });
      expect(result).toBe(true);
    });

    it('should exempt user with custom reason', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: true,
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.exemptUserFromLimits(
        mockSupabase,
        mockUserId,
        'Beta tester'
      );

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('exempt_user_from_blueprint_limits', {
        p_user_id: mockUserId,
        p_reason: 'Beta tester',
      });
      expect(result).toBe(true);
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.exemptUserFromLimits(mockSupabase, mockUserId)
      ).rejects.toThrow('Failed to exempt user from blueprint limits');
    });
  });

  describe('handleTierUpgrade', () => {
    it('should handle tier upgrade successfully', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act & Assert - Should not throw
      await expect(
        BlueprintUsageService.handleTierUpgrade(mockSupabase, mockUserId, 'navigator')
      ).resolves.toBeUndefined();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('handle_tier_upgrade', {
        p_user_id: mockUserId,
        p_new_tier: 'navigator',
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Tier upgrade failed' },
      });

      // Act & Assert
      await expect(
        BlueprintUsageService.handleTierUpgrade(mockSupabase, mockUserId, 'voyager')
      ).rejects.toThrow('Failed to handle tier upgrade');
    });
  });

  describe('resetAllMonthlyLimits (Admin/Cron Function)', () => {
    it('should return reset statistics', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [{ users_processed: 150, users_reset: 120 }],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.resetAllMonthlyLimits(mockSupabase);

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('reset_all_monthly_limits');
      expect(result).toEqual({
        usersProcessed: 150,
        usersReset: 120,
      });
    });

    it('should return zeros when no data returned', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await BlueprintUsageService.resetAllMonthlyLimits(mockSupabase);

      // Assert
      expect(result).toEqual({
        usersProcessed: 0,
        usersReset: 0,
      });
    });

    it('should throw error when RPC call fails', async () => {
      // Arrange
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Reset failed' },
      });

      // Act & Assert
      await expect(BlueprintUsageService.resetAllMonthlyLimits(mockSupabase)).rejects.toThrow(
        'Failed to reset monthly limits'
      );
    });
  });
});
