/**
 * Comprehensive Tests for CostTrackingService with Cache Token Support
 *
 * Tests API usage logging, cost calculations, cache token support,
 * and pricing validation for accurate cost tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CostTrackingService } from '@/lib/services/costTrackingService';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockLimit = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockSingle = vi.fn();

  const mockSupabase = {
    rpc: mockRpc,
    from: mockFrom,
  } as unknown as SupabaseClient;

  // Setup chainable mock methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    order: mockOrder,
    single: mockSingle,
    limit: mockLimit,
  });

  mockOrder.mockReturnValue({
    gte: mockGte,
    lte: mockLte,
  });

  mockGte.mockReturnValue({
    lte: mockLte,
  });

  mockLte.mockReturnValue({
    /* terminal */
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockInsert.mockReturnValue({
    /* terminal */
  });

  return {
    supabase: mockSupabase,
    mockRpc,
    mockFrom,
    mockSelect,
    mockEq,
    mockOrder,
    mockGte,
    mockLte,
    mockLimit,
    mockUpdate,
    mockInsert,
    mockSingle,
  };
};

describe('CostTrackingService', () => {
  let mocks: ReturnType<typeof createMockSupabase>;
  let service: CostTrackingService;

  beforeEach(() => {
    mocks = createMockSupabase();
    service = CostTrackingService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logApiUsage - Basic Token Tracking', () => {
    it('should log API usage successfully with standard tokens', async () => {
      const mockLogId = 'log-123';
      mocks.mockRpc.mockResolvedValue({
        data: mockLogId,
        error: null,
      });

      const result = await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          status: 'success',
        },
        mocks.supabase
      );

      expect(result).toBe(mockLogId);
      expect(mocks.mockRpc).toHaveBeenCalledWith('log_api_usage', {
        p_user_id: 'user-123',
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'generate-blueprint',
        p_input_tokens: 5000,
        p_output_tokens: 2000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 0,
      });
    });

    it('should include blueprint ID when provided', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          blueprintId: 'blueprint-456',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_blueprint_id: 'blueprint-456',
        })
      );
    });

    it('should handle metadata correctly', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          requestMetadata: { model: 'claude-sonnet-4-5', temperature: 0.7 },
          responseMetadata: { stopReason: 'end_turn' },
          durationMs: 2500,
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_request_metadata: { model: 'claude-sonnet-4-5', temperature: 0.7 },
          p_response_metadata: { stopReason: 'end_turn' },
          p_duration_ms: 2500,
        })
      );
    });

    it('should handle error status correctly', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 0,
          status: 'error',
          errorMessage: 'Request timeout',
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_status: 'error',
          p_error_message: 'Request timeout',
        })
      );
    });
  });

  describe('logApiUsage - Cache Token Support', () => {
    it('should log cache creation tokens correctly', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          cacheCreationTokens: 3000,
          cacheReadTokens: 0,
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_cache_creation_tokens: 3000,
          p_cache_read_tokens: 0,
        })
      );
    });

    it('should log cache read tokens correctly', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          cacheCreationTokens: 0,
          cacheReadTokens: 4500,
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_cache_creation_tokens: 0,
          p_cache_read_tokens: 4500,
        })
      );
    });

    it('should log both cache creation and read tokens', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 2000,
          outputTokens: 1500,
          cacheCreationTokens: 3000,
          cacheReadTokens: 4500,
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_input_tokens: 2000,
          p_output_tokens: 1500,
          p_cache_creation_tokens: 3000,
          p_cache_read_tokens: 4500,
        })
      );
    });

    it('should default cache tokens to 0 when not provided', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          // No cache tokens provided
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_cache_creation_tokens: 0,
          p_cache_read_tokens: 0,
        })
      );
    });

    it('should handle edge case of zero cache tokens explicitly', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
        },
        mocks.supabase
      );

      expect(mocks.mockRpc).toHaveBeenCalledWith(
        'log_api_usage',
        expect.objectContaining({
          p_cache_creation_tokens: 0,
          p_cache_read_tokens: 0,
        })
      );
    });
  });

  describe('logApiUsage - Error Handling', () => {
    it('should return null on database error', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST503' },
      });

      const result = await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        mocks.supabase
      );

      expect(result).toBeNull();
    });

    it('should return null on exception', async () => {
      mocks.mockRpc.mockRejectedValue(new Error('Network error'));

      const result = await service.logApiUsage(
        {
          userId: 'user-123',
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        mocks.supabase
      );

      expect(result).toBeNull();
    });
  });

  describe('getUserCostSummary', () => {
    it('should fetch cost summary successfully', async () => {
      const mockSummary = {
        total_cost_cents: 1250,
        total_api_calls: 25,
        total_input_tokens: 50000,
        total_output_tokens: 20000,
        costs_by_provider: {
          anthropic: { cents: 1250, calls: 25 },
        },
        costs_by_model: {
          'claude-sonnet-4-5-20250929': { cents: 1250, calls: 25 },
        },
        costs_by_endpoint: {
          'generate-blueprint': { cents: 800, calls: 15 },
          'generate-dynamic-questions': { cents: 450, calls: 10 },
        },
      };

      mocks.mockRpc.mockResolvedValue({
        data: [mockSummary],
        error: null,
      });

      const result = await service.getUserCostSummary(
        'user-123',
        undefined,
        undefined,
        mocks.supabase
      );

      expect(result).toEqual({
        totalCostCents: 1250,
        totalApiCalls: 25,
        totalInputTokens: 50000,
        totalOutputTokens: 20000,
        costsByProvider: {
          anthropic: { cents: 1250, calls: 25 },
        },
        costsByModel: {
          'claude-sonnet-4-5-20250929': { cents: 1250, calls: 25 },
        },
        costsByEndpoint: {
          'generate-blueprint': { cents: 800, calls: 15 },
          'generate-dynamic-questions': { cents: 450, calls: 10 },
        },
      });
    });

    it('should handle date range filters', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [
          {
            total_cost_cents: 500,
            total_api_calls: 10,
            total_input_tokens: 20000,
            total_output_tokens: 8000,
            costs_by_provider: {},
            costs_by_model: {},
            costs_by_endpoint: {},
          },
        ],
        error: null,
      });

      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      await service.getUserCostSummary('user-123', fromDate, toDate, mocks.supabase);

      expect(mocks.mockRpc).toHaveBeenCalledWith('get_user_cost_details', {
        p_user_id: 'user-123',
        p_from_date: '2025-01-01',
        p_to_date: '2025-01-31',
      });
    });

    it('should return zero values when no data exists', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getUserCostSummary(
        'user-123',
        undefined,
        undefined,
        mocks.supabase
      );

      expect(result).toEqual({
        totalCostCents: 0,
        totalApiCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        costsByProvider: {},
        costsByModel: {},
        costsByEndpoint: {},
      });
    });

    it('should return null on database error', async () => {
      mocks.mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await service.getUserCostSummary(
        'user-123',
        undefined,
        undefined,
        mocks.supabase
      );

      expect(result).toBeNull();
    });
  });

  describe('getAllUsersCostOverview', () => {
    it('should fetch all users cost overview successfully', async () => {
      const mockUsers = [
        {
          user_id: 'user-1',
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'navigator',
          today_cost_cents: 100,
          this_month_cost_cents: 1500,
          today_api_calls: 5,
          this_month_api_calls: 75,
          blueprints_this_month: 10,
          questions_this_month: 50,
        },
        {
          user_id: 'user-2',
          email: 'user2@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          subscription_tier: 'explorer',
          today_cost_cents: 50,
          this_month_cost_cents: 300,
          today_api_calls: 2,
          this_month_api_calls: 15,
          blueprints_this_month: 2,
          questions_this_month: 10,
        },
      ];

      mocks.mockOrder.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const result = await service.getAllUsersCostOverview(mocks.supabase);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: 'user-1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        subscriptionTier: 'navigator',
        todayCostCents: 100,
        thisMonthCostCents: 1500,
        todayApiCalls: 5,
        thisMonthApiCalls: 75,
        blueprintsThisMonth: 10,
        questionsThisMonth: 50,
      });
    });

    it('should return empty array when no users', async () => {
      mocks.mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getAllUsersCostOverview(mocks.supabase);

      expect(result).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      mocks.mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await service.getAllUsersCostOverview(mocks.supabase);

      expect(result).toEqual([]);
    });

    it('should handle null values gracefully', async () => {
      const mockUsers = [
        {
          user_id: 'user-1',
          email: 'user1@example.com',
          first_name: null,
          last_name: null,
          subscription_tier: null,
          today_cost_cents: null,
          this_month_cost_cents: null,
          today_api_calls: null,
          this_month_api_calls: null,
          blueprints_this_month: null,
          questions_this_month: null,
        },
      ];

      mocks.mockOrder.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const result = await service.getAllUsersCostOverview(mocks.supabase);

      expect(result[0]).toEqual({
        userId: 'user-1',
        email: 'user1@example.com',
        firstName: null,
        lastName: null,
        subscriptionTier: null,
        todayCostCents: 0,
        thisMonthCostCents: 0,
        todayApiCalls: 0,
        thisMonthApiCalls: 0,
        blueprintsThisMonth: 0,
        questionsThisMonth: 0,
      });
    });
  });

  describe('getModelIdForTracking', () => {
    it('should return Claude Sonnet 4.5 standard for prompts <= 200K tokens', () => {
      const modelId = service.getModelIdForTracking(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        150000
      );

      expect(modelId).toBe('claude-sonnet-4-5-20250929');
    });

    it('should return Claude Sonnet 4.5 large for prompts > 200K tokens', () => {
      const modelId = service.getModelIdForTracking(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        250000
      );

      expect(modelId).toBe('claude-sonnet-4-5-20250929-large');
    });

    it('should handle model without prompt size', () => {
      const modelId = service.getModelIdForTracking('anthropic', 'claude-sonnet-4-5-20250929');

      expect(modelId).toBe('claude-sonnet-4-5-20250929');
    });

    it('should map Claude Sonnet 4 correctly', () => {
      const modelId = service.getModelIdForTracking('anthropic', 'claude-sonnet-4-20250929');

      expect(modelId).toBe('claude-sonnet-4-20250929');
    });

    it('should map Claude Opus 4 correctly', () => {
      const modelId = service.getModelIdForTracking('anthropic', 'claude-opus-4-1-20250805');

      expect(modelId).toBe('claude-opus-4-1-20250805');
    });

    it('should return original model if no mapping found', () => {
      const modelId = service.getModelIdForTracking('openai', 'gpt-4-turbo', 100000);

      expect(modelId).toBe('gpt-4-turbo');
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count correctly', () => {
      const text = 'This is a test string with some words';
      const estimate = service.estimateTokenCount(text);

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBe(Math.ceil(text.length / 4));
    });

    it('should handle empty string', () => {
      const estimate = service.estimateTokenCount('');

      expect(estimate).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'a'.repeat(10000);
      const estimate = service.estimateTokenCount(text);

      expect(estimate).toBe(2500);
    });
  });
});
