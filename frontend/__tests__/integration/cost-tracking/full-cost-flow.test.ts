/**
 * Integration Tests for Full Cost Tracking Flow with Cache Tokens
 *
 * Tests the complete flow: API call → TrackedClaudeClient → costTrackingService → Database
 * Validates that cache tokens are correctly captured, logged, and stored
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TrackedClaudeClient } from '@/lib/claude/clientWithCostTracking';
import { costTrackingService } from '@/lib/services/costTrackingService';
import { pricingValidationService } from '@/lib/services/pricingValidationService';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * NOTE: These tests require a test database with the cache token migration applied.
 *
 * Setup:
 * 1. Create a test Supabase project or use a local instance
 * 2. Run migration: supabase/migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql
 * 3. Set environment variables:
 *    - TEST_SUPABASE_URL
 *    - TEST_SUPABASE_SERVICE_KEY
 * 4. Seed test pricing data
 *
 * To run: npm run test:integration -- cost-tracking
 */

describe('Full Cost Tracking Flow - Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testBlueprintId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    const supabaseUrl = process.env.TEST_SUPABASE_URL;
    const supabaseKey = process.env.TEST_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY must be set for integration tests'
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    });

    if (userError || !userData.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }

    testUserId = userData.user.id;

    // Create test blueprint
    const { data: blueprintData, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .insert({
        user_id: testUserId,
        status: 'draft',
      })
      .select('id')
      .single();

    if (blueprintError || !blueprintData) {
      throw new Error(`Failed to create test blueprint: ${blueprintError?.message}`);
    }

    testBlueprintId = blueprintData.id;

    // Ensure test pricing exists
    await supabase.from('api_model_pricing').upsert({
      provider: 'anthropic',
      model_id: 'claude-sonnet-4-5-20250929',
      input_cost_per_million_tokens: 300,
      output_cost_per_million_tokens: 1500,
      cache_read_cost_per_million_tokens: 30,
      is_active: true,
      effective_from: new Date().toISOString(),
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBlueprintId) {
      await supabase.from('blueprint_generator').delete().eq('id', testBlueprintId);
    }

    if (testUserId) {
      // Delete API usage logs
      await supabase.from('api_usage_logs').delete().eq('user_id', testUserId);

      // Delete user
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up API usage logs before each test
    await supabase.from('api_usage_logs').delete().eq('user_id', testUserId);
  });

  describe('Basic Token Logging', () => {
    it('should log standard input/output tokens to database', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          blueprintId: testBlueprintId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          status: 'success',
        },
        supabase
      );

      expect(logId).toBeTruthy();

      // Verify data was stored correctly
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('id', logId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        user_id: testUserId,
        blueprint_id: testBlueprintId,
        api_provider: 'anthropic',
        model_id: 'claude-sonnet-4-5-20250929',
        endpoint: 'generate-blueprint',
        input_tokens: 5000,
        output_tokens: 2000,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        status: 'success',
        pricing_found: true,
      });

      // Verify costs were calculated
      expect(data?.input_cost_cents).toBeGreaterThan(0);
      expect(data?.output_cost_cents).toBeGreaterThan(0);
      expect(data?.total_cost_cents).toBeGreaterThan(0);
    });

    it('should calculate costs correctly', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'test-endpoint',
          inputTokens: 1000000, // 1M tokens
          outputTokens: 1000000, // 1M tokens
        },
        supabase
      );

      const { data } = await supabase
        .from('api_usage_logs')
        .select('input_cost_cents, output_cost_cents, total_cost_cents')
        .eq('id', logId)
        .single();

      // At $3.00 per million input tokens = 300 cents
      expect(data?.input_cost_cents).toBe(300);
      // At $15.00 per million output tokens = 1500 cents
      expect(data?.output_cost_cents).toBe(1500);
      // Total = 1800 cents
      expect(data?.total_cost_cents).toBe(1800);
    });
  });

  describe('Cache Token Logging', () => {
    it('should log cache creation tokens to database', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          cacheCreationTokens: 3000,
          cacheReadTokens: 0,
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      expect(data).toMatchObject({
        input_tokens: 5000,
        output_tokens: 2000,
        cache_creation_input_tokens: 3000,
        cache_read_input_tokens: 0,
        total_tokens: 10000, // 5000 + 2000 + 3000 + 0
      });

      // Cache creation should be charged at input token rates
      expect(data?.cache_creation_cost_cents).toBeGreaterThan(0);
      expect(data?.cache_read_cost_cents).toBe(0);
    });

    it('should log cache read tokens to database', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 2000,
          outputTokens: 1500,
          cacheCreationTokens: 0,
          cacheReadTokens: 4500,
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      expect(data).toMatchObject({
        input_tokens: 2000,
        output_tokens: 1500,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 4500,
        total_tokens: 8000, // 2000 + 1500 + 0 + 4500
      });

      // Cache reads should be charged at 10% of input token rates
      expect(data?.cache_read_cost_cents).toBeGreaterThan(0);
      expect(data?.cache_creation_cost_cents).toBe(0);
    });

    it('should calculate cache token costs correctly', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'test-endpoint',
          inputTokens: 1000000, // 1M tokens
          outputTokens: 1000000, // 1M tokens
          cacheCreationTokens: 1000000, // 1M tokens
          cacheReadTokens: 1000000, // 1M tokens
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      // Input: $3.00 per million = 300 cents
      expect(data?.input_cost_cents).toBe(300);
      // Output: $15.00 per million = 1500 cents
      expect(data?.output_cost_cents).toBe(1500);
      // Cache creation: Same as input = 300 cents
      expect(data?.cache_creation_cost_cents).toBe(300);
      // Cache read: 10% of input = 30 cents
      expect(data?.cache_read_cost_cents).toBe(30);
      // Total: 300 + 1500 + 300 + 30 = 2130 cents
      expect(data?.total_cost_cents).toBe(2130);
    });

    it('should log both cache creation and read tokens', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 2000,
          outputTokens: 1500,
          cacheCreationTokens: 3000,
          cacheReadTokens: 4500,
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      expect(data).toMatchObject({
        input_tokens: 2000,
        output_tokens: 1500,
        cache_creation_input_tokens: 3000,
        cache_read_input_tokens: 4500,
        total_tokens: 11000,
      });

      expect(data?.cache_creation_cost_cents).toBeGreaterThan(0);
      expect(data?.cache_read_cost_cents).toBeGreaterThan(0);
    });
  });

  describe('Pricing Validation', () => {
    it('should mark pricing_found as true when pricing exists', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'test-endpoint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        supabase
      );

      const { data } = await supabase
        .from('api_usage_logs')
        .select('pricing_found')
        .eq('id', logId)
        .single();

      expect(data?.pricing_found).toBe(true);
    });

    it('should mark pricing_found as false and cost as $0 when pricing missing', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'non-existent-model',
          endpoint: 'test-endpoint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      expect(data?.pricing_found).toBe(false);
      expect(data?.input_cost_cents).toBe(0);
      expect(data?.output_cost_cents).toBe(0);
      expect(data?.total_cost_cents).toBe(0);
    });

    it('should validate pricing before API call', async () => {
      const result = await pricingValidationService.validateModelPricing(
        'anthropic',
        'claude-sonnet-4-5-20250929',
        supabase
      );

      expect(result.isValid).toBe(true);
      expect(result.inputCostPerMillion).toBe(300);
      expect(result.outputCostPerMillion).toBe(1500);
      expect(result.cacheReadCostPerMillion).toBe(30);
    });

    it('should detect models missing pricing', async () => {
      // Create a log with missing pricing
      await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'missing-pricing-model',
          endpoint: 'test-endpoint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        supabase
      );

      const missingModels = await pricingValidationService.getModelsMissingPricing(supabase);

      const foundMissing = missingModels.find(
        (m) => m.provider === 'anthropic' && m.modelId === 'missing-pricing-model'
      );

      expect(foundMissing).toBeTruthy();
      expect(foundMissing?.usageCount).toBeGreaterThan(0);
    });
  });

  describe('Cost Summaries and Aggregation', () => {
    it('should aggregate costs correctly in summary', async () => {
      // Log multiple API calls
      await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        supabase
      );

      await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-dynamic-questions',
          inputTokens: 3000,
          outputTokens: 1500,
        },
        supabase
      );

      const summary = await costTrackingService.getUserCostSummary(
        testUserId,
        undefined,
        undefined,
        supabase
      );

      expect(summary).toBeTruthy();
      expect(summary?.totalApiCalls).toBe(2);
      expect(summary?.totalInputTokens).toBe(8000); // 5000 + 3000
      expect(summary?.totalOutputTokens).toBe(3500); // 2000 + 1500
      expect(summary?.totalCostCents).toBeGreaterThan(0);
    });

    it('should aggregate cache token costs in summary', async () => {
      // Log API call with cache tokens
      await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          cacheCreationTokens: 3000,
          cacheReadTokens: 4500,
        },
        supabase
      );

      const summary = await costTrackingService.getUserCostSummary(
        testUserId,
        undefined,
        undefined,
        supabase
      );

      expect(summary).toBeTruthy();
      expect(summary?.totalApiCalls).toBe(1);
      // Total cost should include cache token costs
      expect(summary?.totalCostCents).toBeGreaterThan(0);
    });

    it('should show costs by endpoint', async () => {
      await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
        },
        supabase
      );

      const summary = await costTrackingService.getUserCostSummary(
        testUserId,
        undefined,
        undefined,
        supabase
      );

      expect(summary?.costsByEndpoint).toBeTruthy();
      expect(summary?.costsByEndpoint['generate-blueprint']).toBeTruthy();
      expect(summary?.costsByEndpoint['generate-blueprint'].calls).toBe(1);
      expect(summary?.costsByEndpoint['generate-blueprint'].cents).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should log failed API calls with error status', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 0,
          status: 'error',
          errorMessage: 'Request timeout',
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      expect(data?.status).toBe('error');
      expect(data?.error_message).toBe('Request timeout');
      // Costs should still be calculated for input tokens
      expect(data?.input_cost_cents).toBeGreaterThan(0);
      expect(data?.output_cost_cents).toBe(0);
    });

    it('should handle rate_limited status', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 0,
          status: 'rate_limited',
          errorMessage: 'Rate limit exceeded',
        },
        supabase
      );

      const { data } = await supabase
        .from('api_usage_logs')
        .select('status')
        .eq('id', logId)
        .single();

      expect(data?.status).toBe('rate_limited');
    });
  });

  describe('Metadata Tracking', () => {
    it('should store request and response metadata', async () => {
      const logId = await costTrackingService.logApiUsage(
        {
          userId: testUserId,
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-5-20250929',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          requestMetadata: {
            model: 'claude-sonnet-4-5',
            temperature: 0.7,
            maxTokens: 8000,
          },
          responseMetadata: {
            stopReason: 'end_turn',
            cacheCreationTokens: 3000,
            cacheReadTokens: 4500,
          },
          durationMs: 2500,
        },
        supabase
      );

      const { data } = await supabase.from('api_usage_logs').select('*').eq('id', logId).single();

      expect(data?.request_metadata).toMatchObject({
        model: 'claude-sonnet-4-5',
        temperature: 0.7,
        maxTokens: 8000,
      });

      expect(data?.response_metadata).toMatchObject({
        stopReason: 'end_turn',
        cacheCreationTokens: 3000,
        cacheReadTokens: 4500,
      });

      expect(data?.request_duration_ms).toBe(2500);
    });
  });
});
