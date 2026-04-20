/**
 * Comprehensive Tests for BlueprintUsageService
 *
 * SECURITY-CRITICAL: Tests fail-closed logic for subscription limit enforcement (CVE-001 fix)
 *
 * @description Tests for blueprint usage tracking, limit enforcement, dual counting,
 * monthly rollover, and fail-closed security semantics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockLimit = vi.fn();

  const mockSupabase = {
    rpc: mockRpc,
    from: mockFrom,
  } as unknown as SupabaseClient;

  // Setup chainable mock methods
  mockFrom.mockReturnValue({
    select: mockSelect,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    limit: mockLimit,
  });

  mockLimit.mockReturnValue({
    /* terminal */
  });

  return {
    supabase: mockSupabase,
    mockRpc,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockLimit,
  };
};

describe('BlueprintUsageService', () => {
  let mocks: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mocks = createMockSupabase();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBlueprintUsageInfo', () => {
    it('should fetch and return usage information successfully', async () => {
      const mockUsageData = {
        creation_count: 5,
        saving_count: 3,
        creation_limit: 10,
        saving_limit: 10,
        is_exempt: false,
        exemption_reason: null,
        last_creation: '2025-01-01T00:00:00Z',
        last_saving: '2025-01-02T00:00:00Z',
      };

      mocks.mockRpc.mockResolvedValue({
        data: [mockUsageData],
        error: null,
      });

      const result = await BlueprintUsageService.getBlueprintUsageInfo(
        mocks.supabase,
        'test-user-id'
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith('get_blueprint_usage_info', {
        p_user_id: 'test-user-id',
      });

      expect(result).toEqual({
        creationCount: 5,
        savingCount: 3,
        creationLimit: 10,
        savingLimit: 10,
        isExempt: false,
        exemptionReason: null,
        lastCreation: '2025-01-01T00:00:00Z',
        lastSaving: '2025-01-02T00:00:00Z',
      });
    });

    it('should handle database errors', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST000' },
      });

      await expect(
        BlueprintUsageService.getBlueprintUsageInfo(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('Failed to fetch blueprint usage information');
    });

    it('should handle empty data array', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(
        BlueprintUsageService.getBlueprintUsageInfo(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('No usage data returned from database');
    });

    it('should handle null data', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        BlueprintUsageService.getBlueprintUsageInfo(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('No usage data returned from database');
    });

    it('should use default values for missing fields', async () => {
      const mockUsageData = {
        creation_count: null,
        saving_count: null,
        creation_limit: null,
        saving_limit: null,
        is_exempt: null,
      };

      mocks.mockRpc.mockResolvedValue({
        data: [mockUsageData],
        error: null,
      });

      const result = await BlueprintUsageService.getBlueprintUsageInfo(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        creationCount: 0,
        savingCount: 0,
        creationLimit: 2,
        savingLimit: 2,
        isExempt: false,
        exemptionReason: undefined,
        lastCreation: undefined,
        lastSaving: undefined,
      });
    });
  });

  describe('canCreateBlueprint', () => {
    it('should return true when user can create blueprint', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [{ can_create: true, reason: null }],
        error: null,
      });

      const result = await BlueprintUsageService.canCreateBlueprint(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        canCreate: true,
        reason: undefined,
      });
    });

    it('should return false when limit exceeded', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            can_create: false,
            reason: 'Monthly creation limit of 10 reached',
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.canCreateBlueprint(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        canCreate: false,
        reason: 'Monthly creation limit of 10 reached',
      });
    });

    it('should handle database errors', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        BlueprintUsageService.canCreateBlueprint(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('Failed to check blueprint creation limits');
    });

    it('should deny creation if no data returned (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await BlueprintUsageService.canCreateBlueprint(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        canCreate: false,
        reason: 'Unable to verify blueprint creation limits',
      });
    });
  });

  describe('canSaveBlueprint', () => {
    it('should return true when user can save blueprint', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [{ can_save: true, reason: null }],
        error: null,
      });

      const result = await BlueprintUsageService.canSaveBlueprint(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        canSave: true,
        reason: undefined,
      });
    });

    it('should return false when saving limit exceeded', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            can_save: false,
            reason: 'Monthly saving limit of 10 reached',
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.canSaveBlueprint(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        canSave: false,
        reason: 'Monthly saving limit of 10 reached',
      });
    });

    it('should deny saving if no data returned (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await BlueprintUsageService.canSaveBlueprint(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        canSave: false,
        reason: 'Unable to verify blueprint saving limits',
      });
    });
  });

  describe('incrementCreationCountV2 - SECURITY CRITICAL (CVE-001 fix)', () => {
    it('should successfully increment creation count when allowed', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            success: true,
            reason: 'Creation count incremented successfully',
            new_count: 6,
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: true,
        reason: 'Creation count incremented successfully',
        newCount: 6,
      });

      expect(mocks.mockRpc).toHaveBeenCalledWith('increment_blueprint_creation_count_v2', {
        p_user_id: 'test-user-id',
      });
    });

    it('should DENY when limit exceeded (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            success: false,
            reason: 'Monthly creation limit of 10 reached',
            new_count: 10,
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'Monthly creation limit of 10 reached',
        newCount: 10,
      });
    });

    it('should DENY on database error (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: {
          message: 'Connection timeout',
          code: 'PGRST000',
        },
      });

      const result = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should DENY when no data returned (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should DENY on exception (fail-closed)', async () => {
      mocks.mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'System error - operation denied for safety',
        newCount: 0,
      });
    });

    it('should handle malformed response data (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            success: undefined,
            reason: undefined,
            new_count: undefined,
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'Unknown error',
        newCount: 0,
      });
    });
  });

  describe('incrementSavingCountV2 - SECURITY CRITICAL (CVE-001 fix)', () => {
    it('should successfully increment saving count when allowed', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            success: true,
            reason: 'Saving count incremented successfully',
            new_count: 4,
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: true,
        reason: 'Saving count incremented successfully',
        newCount: 4,
      });
    });

    it('should DENY when saving limit exceeded (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            success: false,
            reason: 'Monthly saving limit of 10 reached',
            new_count: 10,
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'Monthly saving limit of 10 reached',
        newCount: 10,
      });
    });

    it('should DENY on database error (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: {
          message: 'Database unavailable',
          code: 'PGRST503',
        },
      });

      const result = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should DENY when no data returned (fail-closed)', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'System error - unable to verify limits',
        newCount: 0,
      });
    });

    it('should DENY on exception (fail-closed)', async () => {
      mocks.mockRpc.mockRejectedValue(new Error('Timeout'));

      const result = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        success: false,
        reason: 'System error - operation denied for safety',
        newCount: 0,
      });
    });
  });

  describe('DUAL COUNTING scenarios (CVE-001 fix)', () => {
    it('should allow when both creation AND saving limits permit', async () => {
      // First call - creation
      mocks.mockRpc.mockResolvedValueOnce({
        data: [{ success: true, reason: 'OK', new_count: 5 }],
        error: null,
      });

      // Second call - saving
      mocks.mockRpc.mockResolvedValueOnce({
        data: [{ success: true, reason: 'OK', new_count: 3 }],
        error: null,
      });

      const creationResult = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );
      const savingResult = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(creationResult.success).toBe(true);
      expect(savingResult.success).toBe(true);
    });

    it('should DENY when creation limit reached even if saving allowed', async () => {
      // Creation limit exceeded
      mocks.mockRpc.mockResolvedValueOnce({
        data: [
          {
            success: false,
            reason: 'Creation limit reached',
            new_count: 10,
          },
        ],
        error: null,
      });

      const creationResult = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(creationResult.success).toBe(false);
      expect(creationResult.reason).toBe('Creation limit reached');
    });

    it('should DENY when saving limit reached even if creation allowed', async () => {
      // Saving limit exceeded
      mocks.mockRpc.mockResolvedValueOnce({
        data: [
          {
            success: false,
            reason: 'Saving limit reached',
            new_count: 10,
          },
        ],
        error: null,
      });

      const savingResult = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(savingResult.success).toBe(false);
      expect(savingResult.reason).toBe('Saving limit reached');
    });

    it('should DENY when BOTH limits reached', async () => {
      // Both limits exceeded
      mocks.mockRpc
        .mockResolvedValueOnce({
          data: [
            {
              success: false,
              reason: 'Creation limit reached',
              new_count: 10,
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            {
              success: false,
              reason: 'Saving limit reached',
              new_count: 10,
            },
          ],
          error: null,
        });

      const creationResult = await BlueprintUsageService.incrementCreationCountV2(
        mocks.supabase,
        'test-user-id'
      );
      const savingResult = await BlueprintUsageService.incrementSavingCountV2(
        mocks.supabase,
        'test-user-id'
      );

      expect(creationResult.success).toBe(false);
      expect(savingResult.success).toBe(false);
    });
  });

  describe('getEffectiveLimits', () => {
    it('should fetch and return effective limits with rollover', async () => {
      const mockLimitsData = {
        creation_limit: 10,
        saving_limit: 10,
        creation_used: 5,
        saving_used: 3,
        creation_available: 5,
        saving_available: 7,
      };

      mocks.mockRpc.mockResolvedValue({
        data: [mockLimitsData],
        error: null,
      });

      const result = await BlueprintUsageService.getEffectiveLimits(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        creationLimit: 10,
        savingLimit: 10,
        creationUsed: 5,
        savingUsed: 3,
        creationAvailable: 5,
        savingAvailable: 7,
      });
    });

    it('should handle missing data', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(
        BlueprintUsageService.getEffectiveLimits(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('No limits data returned');
    });

    it('should use default values for null fields', async () => {
      const mockLimitsData = {
        creation_limit: null,
        saving_limit: null,
        creation_used: null,
        saving_used: null,
        creation_available: null,
        saving_available: null,
      };

      mocks.mockRpc.mockResolvedValue({
        data: [mockLimitsData],
        error: null,
      });

      const result = await BlueprintUsageService.getEffectiveLimits(mocks.supabase, 'test-user-id');

      expect(result).toEqual({
        creationLimit: 0,
        savingLimit: 0,
        creationUsed: 0,
        savingUsed: 0,
        creationAvailable: 0,
        savingAvailable: 0,
      });
    });
  });

  describe('getRawBlueprintCounts', () => {
    it('should fetch and return raw blueprint counts', async () => {
      mocks.mockSelect.mockReturnValueOnce({
        eq: mocks.mockEq.mockResolvedValue({
          data: [
            { status: 'completed' },
            { status: 'completed' },
            { status: 'draft' },
            { status: 'generating' },
          ],
          error: null,
        }),
      });

      const result = await BlueprintUsageService.getRawBlueprintCounts(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        totalBlueprints: 4,
        completedBlueprints: 2,
        draftBlueprints: 1,
      });
    });

    it('should handle empty blueprint list', async () => {
      mocks.mockSelect.mockReturnValueOnce({
        eq: mocks.mockEq.mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const result = await BlueprintUsageService.getRawBlueprintCounts(
        mocks.supabase,
        'test-user-id'
      );

      expect(result).toEqual({
        totalBlueprints: 0,
        completedBlueprints: 0,
        draftBlueprints: 0,
      });
    });

    it('should handle database errors', async () => {
      mocks.mockSelect.mockReturnValueOnce({
        eq: mocks.mockEq.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      await expect(
        BlueprintUsageService.getRawBlueprintCounts(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('Failed to fetch blueprint counts');
    });
  });

  describe('exemptUserFromLimits', () => {
    it('should exempt user successfully', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await BlueprintUsageService.exemptUserFromLimits(
        mocks.supabase,
        'test-user-id',
        'Developer account'
      );

      expect(result).toBe(true);
      expect(mocks.mockRpc).toHaveBeenCalledWith('exempt_user_from_blueprint_limits', {
        p_user_id: 'test-user-id',
        p_reason: 'Developer account',
      });
    });

    it('should use default exemption reason', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      await BlueprintUsageService.exemptUserFromLimits(mocks.supabase, 'test-user-id');

      expect(mocks.mockRpc).toHaveBeenCalledWith('exempt_user_from_blueprint_limits', {
        p_user_id: 'test-user-id',
        p_reason: 'Developer exemption',
      });
    });

    it('should handle database errors', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      await expect(
        BlueprintUsageService.exemptUserFromLimits(mocks.supabase, 'test-user-id')
      ).rejects.toThrow('Failed to exempt user from blueprint limits');
    });
  });

  describe('handleTierUpgrade', () => {
    it('should handle tier upgrade successfully', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        BlueprintUsageService.handleTierUpgrade(mocks.supabase, 'test-user-id', 'navigator')
      ).resolves.not.toThrow();

      expect(mocks.mockRpc).toHaveBeenCalledWith('handle_tier_upgrade', {
        p_user_id: 'test-user-id',
        p_new_tier: 'navigator',
      });
    });

    it('should handle upgrade errors', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Invalid tier' },
      });

      await expect(
        BlueprintUsageService.handleTierUpgrade(mocks.supabase, 'test-user-id', 'invalid')
      ).rejects.toThrow('Failed to handle tier upgrade');
    });
  });

  describe('resetAllMonthlyLimits', () => {
    it('should reset monthly limits successfully', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            users_processed: 150,
            users_reset: 120,
          },
        ],
        error: null,
      });

      const result = await BlueprintUsageService.resetAllMonthlyLimits(mocks.supabase);

      expect(result).toEqual({
        usersProcessed: 150,
        usersReset: 120,
      });
    });

    it('should handle empty reset result', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await BlueprintUsageService.resetAllMonthlyLimits(mocks.supabase);

      expect(result).toEqual({
        usersProcessed: 0,
        usersReset: 0,
      });
    });

    it('should handle reset errors', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      await expect(BlueprintUsageService.resetAllMonthlyLimits(mocks.supabase)).rejects.toThrow(
        'Failed to reset monthly limits'
      );
    });
  });

  describe('deprecated methods (legacy compatibility)', () => {
    describe('incrementCreationCount (deprecated)', () => {
      it('should increment successfully', async () => {
        mocks.mockRpc.mockResolvedValue({
          data: true,
          error: null,
        });

        const result = await BlueprintUsageService.incrementCreationCount(
          mocks.supabase,
          'test-user-id'
        );

        expect(result).toBe(true);
      });

      it('should handle errors', async () => {
        mocks.mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        });

        await expect(
          BlueprintUsageService.incrementCreationCount(mocks.supabase, 'test-user-id')
        ).rejects.toThrow('Failed to increment blueprint creation count');
      });
    });

    describe('incrementSavingCount (deprecated)', () => {
      it('should increment successfully', async () => {
        mocks.mockRpc.mockResolvedValue({
          data: true,
          error: null,
        });

        const result = await BlueprintUsageService.incrementSavingCount(
          mocks.supabase,
          'test-user-id'
        );

        expect(result).toBe(true);
      });

      it('should handle errors', async () => {
        mocks.mockRpc.mockResolvedValue({
          data: null,
          error: { message: 'Error' },
        });

        await expect(
          BlueprintUsageService.incrementSavingCount(mocks.supabase, 'test-user-id')
        ).rejects.toThrow('Failed to increment blueprint saving count');
      });
    });
  });
});
