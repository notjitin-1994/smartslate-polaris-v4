/**
 * Comprehensive Tests for PricingValidationService
 *
 * Tests pricing validation, missing pricing detection, and alert mechanisms
 * for ensuring accurate cost tracking and admin notifications
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PricingValidationService } from '@/lib/services/pricingValidationService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockSingle = vi.fn();

  const mockSupabase = {
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
    eq: mockEq,
    order: mockOrder,
  });

  mockOrder.mockReturnValue({
    limit: mockLimit,
  });

  mockLimit.mockReturnValue({
    single: mockSingle,
  });

  return {
    supabase: mockSupabase,
    mockFrom,
    mockSelect,
    mockEq,
    mockOrder,
    mockLimit,
    mockSingle,
  };
};

describe('PricingValidationService', () => {
  let mocks: ReturnType<typeof createMockSupabase>;
  let service: PricingValidationService;

  beforeEach(() => {
    mocks = createMockSupabase();
    service = PricingValidationService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateModelPricing', () => {
    it('should return valid result when pricing exists', async () => {
      const mockPricing = {
        input_cost_per_million_tokens: 300,
        output_cost_per_million_tokens: 1500,
        cache_read_cost_per_million_tokens: 30,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const result = await service.validateModelPricing(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        mocks.supabase
      );

      expect(result).toEqual({
        isValid: true,
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-5-20250929',
        inputCostPerMillion: 300,
        outputCostPerMillion: 1500,
        cacheReadCostPerMillion: 30,
      });
    });

    it('should return invalid result when pricing not found', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });

      const result = await service.validateModelPricing(
        'anthropic',
        'new-model-id',
        mocks.supabase
      );

      expect(result).toEqual({
        isValid: false,
        provider: 'anthropic',
        modelId: 'new-model-id',
        errorMessage:
          'No pricing configured for anthropic/new-model-id. Costs will be reported as $0.',
      });
    });

    it('should query correct table and columns', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: {
          input_cost_per_million_tokens: 300,
          output_cost_per_million_tokens: 1500,
          cache_read_cost_per_million_tokens: 30,
        },
        error: null,
      });

      await service.validateModelPricing('anthropic', 'claude-sonnet-4-5-20250929', mocks.supabase);

      expect(mocks.mockFrom).toHaveBeenCalledWith('api_model_pricing');
      expect(mocks.mockSelect).toHaveBeenCalledWith(
        'input_cost_per_million_tokens, output_cost_per_million_tokens, cache_read_cost_per_million_tokens'
      );
      expect(mocks.mockEq).toHaveBeenCalledWith('provider', 'anthropic');
      expect(mocks.mockEq).toHaveBeenCalledWith('model_id', 'claude-sonnet-4-5-20250929');
      expect(mocks.mockEq).toHaveBeenCalledWith('is_active', true);
      expect(mocks.mockOrder).toHaveBeenCalledWith('effective_from', { ascending: false });
      expect(mocks.mockLimit).toHaveBeenCalledWith(1);
    });

    it('should handle database errors gracefully', async () => {
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout', code: 'PGRST000' },
      });

      const result = await service.validateModelPricing(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        mocks.supabase
      );

      expect(result).toEqual({
        isValid: false,
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-5-20250929',
        errorMessage: 'Error checking pricing configuration',
      });
    });

    it('should handle exceptions gracefully', async () => {
      mocks.mockSingle.mockRejectedValue(new Error('Network error'));

      const result = await service.validateModelPricing(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        mocks.supabase
      );

      expect(result).toEqual({
        isValid: false,
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-5-20250929',
        errorMessage: 'Error checking pricing configuration',
      });
    });

    it('should validate pricing for different providers', async () => {
      const mockPricing = {
        input_cost_per_million_tokens: 50,
        output_cost_per_million_tokens: 150,
        cache_read_cost_per_million_tokens: 5,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const result = await service.validateModelPricing('openai', 'gpt-4-turbo', mocks.supabase);

      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('openai');
      expect(result.modelId).toBe('gpt-4-turbo');
    });

    it('should handle models without cache pricing', async () => {
      const mockPricing = {
        input_cost_per_million_tokens: 300,
        output_cost_per_million_tokens: 1500,
        cache_read_cost_per_million_tokens: null,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const result = await service.validateModelPricing(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        mocks.supabase
      );

      expect(result.isValid).toBe(true);
      expect(result.cacheReadCostPerMillion).toBeNull();
    });
  });

  describe('getModelsMissingPricing', () => {
    it('should return list of models missing pricing', async () => {
      const mockMissingModels = [
        {
          api_provider: 'anthropic',
          model_id: 'claude-opus-4-20250929',
          usage_count: 25,
          first_seen: '2025-01-01T00:00:00Z',
          last_seen: '2025-01-15T00:00:00Z',
          total_tokens: 500000,
        },
        {
          api_provider: 'openai',
          model_id: 'gpt-5-preview',
          usage_count: 10,
          first_seen: '2025-01-10T00:00:00Z',
          last_seen: '2025-01-15T00:00:00Z',
          total_tokens: 200000,
        },
      ];

      mocks.mockSelect.mockResolvedValue({
        data: mockMissingModels,
        error: null,
      });

      const result = await service.getModelsMissingPricing(mocks.supabase);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        provider: 'anthropic',
        modelId: 'claude-opus-4-20250929',
        usageCount: 25,
        firstSeen: '2025-01-01T00:00:00Z',
        lastSeen: '2025-01-15T00:00:00Z',
        totalTokens: 500000,
      });
      expect(result[1]).toEqual({
        provider: 'openai',
        modelId: 'gpt-5-preview',
        usageCount: 10,
        firstSeen: '2025-01-10T00:00:00Z',
        lastSeen: '2025-01-15T00:00:00Z',
        totalTokens: 200000,
      });
    });

    it('should return empty array when no models missing pricing', async () => {
      mocks.mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getModelsMissingPricing(mocks.supabase);

      expect(result).toEqual([]);
    });

    it('should query correct view', async () => {
      mocks.mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.getModelsMissingPricing(mocks.supabase);

      expect(mocks.mockFrom).toHaveBeenCalledWith('models_missing_pricing');
      expect(mocks.mockSelect).toHaveBeenCalledWith('*');
    });

    it('should handle database errors gracefully', async () => {
      mocks.mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST000' },
      });

      const result = await service.getModelsMissingPricing(mocks.supabase);

      expect(result).toEqual([]);
    });

    it('should handle exceptions gracefully', async () => {
      mocks.mockSelect.mockRejectedValue(new Error('Network error'));

      const result = await service.getModelsMissingPricing(mocks.supabase);

      expect(result).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      mocks.mockSelect.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getModelsMissingPricing(mocks.supabase);

      expect(result).toEqual([]);
    });
  });

  describe('checkAndAlertMissingPricing', () => {
    it('should not log errors when no models missing pricing', async () => {
      mocks.mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      // Should not throw or log errors
      await expect(service.checkAndAlertMissingPricing(mocks.supabase)).resolves.not.toThrow();
    });

    it('should call getModelsMissingPricing', async () => {
      const spy = vi.spyOn(service, 'getModelsMissingPricing');
      mocks.mockSelect.mockResolvedValue({
        data: [],
        error: null,
      });

      await service.checkAndAlertMissingPricing(mocks.supabase);

      expect(spy).toHaveBeenCalledWith(mocks.supabase);
    });

    it('should process all missing models', async () => {
      const mockMissingModels = [
        {
          api_provider: 'anthropic',
          model_id: 'model-1',
          usage_count: 10,
          first_seen: '2025-01-01T00:00:00Z',
          last_seen: '2025-01-15T00:00:00Z',
          total_tokens: 100000,
        },
        {
          api_provider: 'openai',
          model_id: 'model-2',
          usage_count: 5,
          first_seen: '2025-01-10T00:00:00Z',
          last_seen: '2025-01-15T00:00:00Z',
          total_tokens: 50000,
        },
      ];

      mocks.mockSelect.mockResolvedValue({
        data: mockMissingModels,
        error: null,
      });

      await service.checkAndAlertMissingPricing(mocks.supabase);

      // Both models should be processed (logs would be emitted but we can't test console.error easily)
      expect(mocks.mockSelect).toHaveBeenCalled();
    });

    it('should handle high usage models', async () => {
      const mockMissingModels = [
        {
          api_provider: 'anthropic',
          model_id: 'high-usage-model',
          usage_count: 1000,
          first_seen: '2025-01-01T00:00:00Z',
          last_seen: '2025-01-15T00:00:00Z',
          total_tokens: 10000000,
        },
      ];

      mocks.mockSelect.mockResolvedValue({
        data: mockMissingModels,
        error: null,
      });

      await expect(service.checkAndAlertMissingPricing(mocks.supabase)).resolves.not.toThrow();
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PricingValidationService.getInstance();
      const instance2 = PricingValidationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should always return the same instance', () => {
      const instances = Array.from({ length: 10 }, () => PricingValidationService.getInstance());

      const firstInstance = instances[0];
      expect(instances.every((instance) => instance === firstInstance)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long model IDs', async () => {
      const longModelId = 'a'.repeat(500);
      mocks.mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'No rows found', code: 'PGRST116' },
      });

      const result = await service.validateModelPricing('anthropic', longModelId, mocks.supabase);

      expect(result.isValid).toBe(false);
      expect(result.modelId).toBe(longModelId);
    });

    it('should handle special characters in model IDs', async () => {
      const specialModelId = 'claude-3.5-sonnet@20250929';
      const mockPricing = {
        input_cost_per_million_tokens: 300,
        output_cost_per_million_tokens: 1500,
        cache_read_cost_per_million_tokens: 30,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const result = await service.validateModelPricing(
        'anthropic',
        specialModelId,
        mocks.supabase
      );

      expect(result.isValid).toBe(true);
      expect(result.modelId).toBe(specialModelId);
    });

    it('should handle zero cost pricing', async () => {
      const mockPricing = {
        input_cost_per_million_tokens: 0,
        output_cost_per_million_tokens: 0,
        cache_read_cost_per_million_tokens: 0,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const result = await service.validateModelPricing('ollama', 'llama2', mocks.supabase);

      expect(result.isValid).toBe(true);
      expect(result.inputCostPerMillion).toBe(0);
      expect(result.outputCostPerMillion).toBe(0);
      expect(result.cacheReadCostPerMillion).toBe(0);
    });

    it('should handle very high cost pricing', async () => {
      const mockPricing = {
        input_cost_per_million_tokens: 999999,
        output_cost_per_million_tokens: 999999,
        cache_read_cost_per_million_tokens: 99999,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const result = await service.validateModelPricing(
        'anthropic',
        'claude-opus-4-1-20250805',
        mocks.supabase
      );

      expect(result.isValid).toBe(true);
      expect(result.inputCostPerMillion).toBe(999999);
      expect(result.outputCostPerMillion).toBe(999999);
    });

    it('should handle concurrent validation requests', async () => {
      const mockPricing = {
        input_cost_per_million_tokens: 300,
        output_cost_per_million_tokens: 1500,
        cache_read_cost_per_million_tokens: 30,
      };

      mocks.mockSingle.mockResolvedValue({
        data: mockPricing,
        error: null,
      });

      const promises = Array.from({ length: 10 }, () =>
        service.validateModelPricing('anthropic', 'claude-sonnet-4-5-20250929', mocks.supabase)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every((result) => result.isValid)).toBe(true);
    });
  });
});
