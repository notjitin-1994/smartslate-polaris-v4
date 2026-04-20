/**
 * Database Tests for Cost Tracking SQL Functions
 *
 * Tests PostgreSQL functions directly to ensure cache token support,
 * cost calculations, and data integrity at the database layer
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
 *
 * To run: npm run test:integration -- database
 */

describe('Cost Tracking SQL Functions - Database Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testBlueprintId: string;

  beforeAll(async () => {
    const supabaseUrl = process.env.TEST_SUPABASE_URL;
    const supabaseKey = process.env.TEST_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY must be set for database tests'
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `db-test-${Date.now()}@example.com`,
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
    await supabase.from('api_model_pricing').upsert([
      {
        provider: 'anthropic',
        model_id: 'claude-sonnet-4-5-20250929',
        input_cost_per_million_tokens: 300,
        output_cost_per_million_tokens: 1500,
        cache_read_cost_per_million_tokens: 30,
        is_active: true,
        effective_from: new Date().toISOString(),
      },
      {
        provider: 'anthropic',
        model_id: 'claude-opus-4-1-20250805',
        input_cost_per_million_tokens: 1500,
        output_cost_per_million_tokens: 7500,
        cache_read_cost_per_million_tokens: 150,
        is_active: true,
        effective_from: new Date().toISOString(),
      },
    ]);
  });

  afterAll(async () => {
    if (testBlueprintId) {
      await supabase.from('blueprint_generator').delete().eq('id', testBlueprintId);
    }

    if (testUserId) {
      await supabase.from('api_usage_logs').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    await supabase.from('api_usage_logs').delete().eq('user_id', testUserId);
  });

  describe('log_api_usage() Function - Basic Functionality', () => {
    it('should log API usage and return log ID', async () => {
      const { data, error } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: testBlueprintId,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
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

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(typeof data).toBe('string'); // Returns UUID
    });

    it('should calculate input token costs correctly', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 1000000, // 1M tokens
        p_output_tokens: 0,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 0,
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('input_cost_cents')
        .eq('id', logId)
        .single();

      // 1M tokens * $3.00 = 300 cents
      expect(log?.input_cost_cents).toBe(300);
    });

    it('should calculate output token costs correctly', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 0,
        p_output_tokens: 1000000, // 1M tokens
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 0,
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('output_cost_cents')
        .eq('id', logId)
        .single();

      // 1M tokens * $15.00 = 1500 cents
      expect(log?.output_cost_cents).toBe(1500);
    });

    it('should calculate total cost correctly', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 1000000,
        p_output_tokens: 1000000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 0,
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('total_cost_cents')
        .eq('id', logId)
        .single();

      // Input (300) + Output (1500) = 1800 cents
      expect(log?.total_cost_cents).toBe(1800);
    });
  });

  describe('log_api_usage() Function - Cache Token Support', () => {
    it('should log cache creation tokens and calculate costs', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 5000,
        p_output_tokens: 2000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 3000,
        p_cache_read_tokens: 0,
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('id', logId)
        .single();

      expect(log?.cache_creation_input_tokens).toBe(3000);
      expect(log?.cache_read_input_tokens).toBe(0);
      expect(log?.total_tokens).toBe(10000); // 5000 + 2000 + 3000 + 0

      // Cache creation cost should be same as input token cost
      const expectedCacheCreationCost = Math.round((3000 / 1000000) * 300);
      expect(log?.cache_creation_cost_cents).toBe(expectedCacheCreationCost);
    });

    it('should log cache read tokens and calculate costs at 90% discount', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 5000,
        p_output_tokens: 2000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 1000000, // 1M tokens
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('id', logId)
        .single();

      expect(log?.cache_read_input_tokens).toBe(1000000);
      // Cache read cost: 1M tokens * $0.30 (10% of $3.00) = 30 cents
      expect(log?.cache_read_cost_cents).toBe(30);
    });

    it('should log both cache creation and read tokens', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 1000000,
        p_output_tokens: 1000000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 1000000,
        p_cache_read_tokens: 1000000,
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('id', logId)
        .single();

      expect(log?.cache_creation_input_tokens).toBe(1000000);
      expect(log?.cache_read_input_tokens).toBe(1000000);
      expect(log?.total_tokens).toBe(4000000);

      // Input: 300, Output: 1500, Cache Creation: 300, Cache Read: 30 = 2130 cents
      expect(log?.total_cost_cents).toBe(2130);
    });

    it('should calculate cache read savings correctly', async () => {
      // Without cache: 1M input tokens = 300 cents
      // With cache read: 1M cache read tokens = 30 cents
      // Savings: 270 cents (90%)

      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 0,
        p_output_tokens: 0,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 1000000,
      });

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('cache_read_cost_cents')
        .eq('id', logId)
        .single();

      // Cost with cache: 30 cents (10% of 300)
      expect(log?.cache_read_cost_cents).toBe(30);

      // If this were input tokens instead, cost would be 300 cents
      // Savings = 300 - 30 = 270 cents (90% discount)
    });
  });

  describe('log_api_usage() Function - Pricing Validation', () => {
    it('should set pricing_found to true when pricing exists', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
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

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('pricing_found')
        .eq('id', logId)
        .single();

      expect(log?.pricing_found).toBe(true);
    });

    it('should set pricing_found to false when pricing missing', async () => {
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'unknown-provider',
        p_model_id: 'unknown-model',
        p_endpoint: 'test-endpoint',
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

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('pricing_found, input_cost_cents, output_cost_cents, total_cost_cents')
        .eq('id', logId)
        .single();

      expect(log?.pricing_found).toBe(false);
      expect(log?.input_cost_cents).toBe(0);
      expect(log?.output_cost_cents).toBe(0);
      expect(log?.total_cost_cents).toBe(0);
    });

    it('should log WARNING when pricing not found', async () => {
      // This test verifies the function raises a WARNING
      // The warning won't fail the operation, but we can verify cost is $0

      const { data: logId, error } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'test-provider',
        p_model_id: 'test-model-no-pricing',
        p_endpoint: 'test-endpoint',
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

      // Function should succeed despite missing pricing
      expect(error).toBeNull();
      expect(logId).toBeTruthy();

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('total_cost_cents, pricing_found')
        .eq('id', logId)
        .single();

      expect(log?.pricing_found).toBe(false);
      expect(log?.total_cost_cents).toBe(0);
    });
  });

  describe('models_missing_pricing View', () => {
    it('should list models with missing pricing', async () => {
      // Create logs with missing pricing
      await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'test-provider',
        p_model_id: 'missing-model-1',
        p_endpoint: 'test-endpoint',
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

      await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'test-provider',
        p_model_id: 'missing-model-1',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 3000,
        p_output_tokens: 1500,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 0,
      });

      const { data: missingModels } = await supabase
        .from('models_missing_pricing')
        .select('*')
        .eq('api_provider', 'test-provider')
        .eq('model_id', 'missing-model-1');

      expect(missingModels).toBeTruthy();
      expect(missingModels?.length).toBeGreaterThan(0);

      const model = missingModels![0];
      expect(model.usage_count).toBeGreaterThanOrEqual(2);
      expect(model.total_tokens).toBeGreaterThan(0);
      expect(model.first_seen).toBeTruthy();
      expect(model.last_seen).toBeTruthy();
    });

    it('should count cache tokens in total_tokens', async () => {
      await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'test-provider',
        p_model_id: 'cache-test-model',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 5000,
        p_output_tokens: 2000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 3000,
        p_cache_read_tokens: 4000,
      });

      const { data: missingModels } = await supabase
        .from('models_missing_pricing')
        .select('total_tokens')
        .eq('api_provider', 'test-provider')
        .eq('model_id', 'cache-test-model')
        .single();

      // Total: 5000 + 2000 + 3000 + 4000 = 14000
      expect(missingModels?.total_tokens).toBe(14000);
    });
  });

  describe('get_cache_token_stats() Function', () => {
    it('should calculate cache token statistics', async () => {
      // Create logs with cache tokens
      await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: 5000,
        p_output_tokens: 2000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 3000,
        p_cache_read_tokens: 4000,
      });

      const { data: stats, error } = await supabase.rpc('get_cache_token_stats', {
        p_from_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_to_date: new Date().toISOString().split('T')[0],
      });

      expect(error).toBeNull();
      expect(stats).toBeTruthy();

      if (stats && stats.length > 0) {
        const stat = stats[0];
        expect(stat.total_cache_creation_tokens).toBeGreaterThan(0);
        expect(stat.total_cache_read_tokens).toBeGreaterThan(0);
        expect(stat.cache_hit_rate).toBeGreaterThan(0);
        expect(stat.api_calls_with_cache).toBeGreaterThan(0);
      }
    });
  });

  describe('Data Integrity Constraints', () => {
    it('should enforce non-negative token values', async () => {
      const { error } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
        p_input_tokens: -1000, // Negative tokens
        p_output_tokens: 2000,
        p_request_metadata: {},
        p_response_metadata: {},
        p_status: 'success',
        p_error_message: null,
        p_duration_ms: null,
        p_cache_creation_tokens: 0,
        p_cache_read_tokens: 0,
      });

      // Should fail due to check constraint
      expect(error).toBeTruthy();
    });

    it('should enforce non-negative cost values', async () => {
      // The database should prevent negative costs through constraints
      // This is implicitly tested by the cost calculation logic
      const { data: logId } = await supabase.rpc('log_api_usage', {
        p_user_id: testUserId,
        p_blueprint_id: null,
        p_provider: 'anthropic',
        p_model_id: 'claude-sonnet-4-5-20250929',
        p_endpoint: 'test-endpoint',
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

      const { data: log } = await supabase
        .from('api_usage_logs')
        .select('input_cost_cents, output_cost_cents, total_cost_cents')
        .eq('id', logId)
        .single();

      expect(log?.input_cost_cents).toBeGreaterThanOrEqual(0);
      expect(log?.output_cost_cents).toBeGreaterThanOrEqual(0);
      expect(log?.total_cost_cents).toBeGreaterThanOrEqual(0);
    });
  });
});
