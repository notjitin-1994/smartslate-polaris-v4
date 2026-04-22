/**
 * Cost Tracking Service
 * Handles API usage logging and cost calculations for all AI API calls
 */

import { createServiceLogger } from '@/lib/logging';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createServiceLogger('cost-tracking');

export interface ApiUsageLog {
  userId: string;
  blueprintId?: string;
  provider: 'anthropic' | 'openai' | 'perplexity' | 'ollama';
  modelId: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  // Cache token support (Anthropic prompt caching)
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  requestMetadata?: Record<string, any>;
  responseMetadata?: Record<string, any>;
  status?: 'success' | 'error' | 'timeout' | 'rate_limited';
  errorMessage?: string;
  durationMs?: number;
}

export interface CostSummary {
  totalCostCents: number;
  totalApiCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  costsByProvider: Record<string, { cents: number; calls: number }>;
  costsByModel: Record<string, { cents: number; calls: number }>;
  costsByEndpoint: Record<string, { cents: number; calls: number }>;
}

export interface UserCostDetails {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  todayCostCents: number;
  thisMonthCostCents: number;
  todayApiCalls: number;
  thisMonthApiCalls: number;
  blueprintsThisMonth: number;
  questionsThisMonth: number;
}

/**
 * Model ID mappings for consistent tracking
 */
export const MODEL_IDS = {
  // Anthropic models
  CLAUDE_SONNET_4_5: 'gemini-3.1-pro-preview-20250929',
  CLAUDE_SONNET_4_5_LARGE: 'gemini-3.1-pro-preview-20250929-large', // >200K tokens
  CLAUDE_SONNET_4: 'gemini-3.1-pro-preview-20250929',
  CLAUDE_OPUS_4: 'gemini-3.1-pro-preview',

  // Perplexity models
  PERPLEXITY_SONAR: 'llama-3.1-sonar-huge-128k-online',

  // Local models
  OLLAMA_LLAMA2: 'llama2',
  OLLAMA_MISTRAL: 'mistral',
} as const;

/**
 * Endpoint names for consistent tracking
 */
export const ENDPOINTS = {
  GENERATE_DYNAMIC_QUESTIONS: 'generate-dynamic-questions',
  GENERATE_BLUEPRINT: 'generate-blueprint',
  EXTRACT_OBJECTIVES: 'extract-objectives',
} as const;

/**
 * Cost Tracking Service
 */
export class CostTrackingService {
  private static instance: CostTrackingService;

  private constructor() {}

  static getInstance(): CostTrackingService {
    if (!CostTrackingService.instance) {
      CostTrackingService.instance = new CostTrackingService();
    }
    return CostTrackingService.instance;
  }

  /**
   * Log API usage to the database
   */
  async logApiUsage(usage: ApiUsageLog, supabase?: SupabaseClient): Promise<string | null> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      logger.info('cost-tracking.log-usage', 'Logging API usage', {
        userId: usage.userId,
        provider: usage.provider,
        model: usage.modelId,
        endpoint: usage.endpoint,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheCreationTokens: usage.cacheCreationTokens || 0,
        cacheReadTokens: usage.cacheReadTokens || 0,
        totalTokens:
          usage.inputTokens +
          usage.outputTokens +
          (usage.cacheCreationTokens || 0) +
          (usage.cacheReadTokens || 0),
      });

      // Call the database function to log usage and calculate costs
      const { data, error } = await client.rpc('log_api_usage', {
        p_user_id: usage.userId,
        p_blueprint_id: usage.blueprintId || null,
        p_provider: usage.provider,
        p_model_id: usage.modelId,
        p_endpoint: usage.endpoint,
        p_input_tokens: usage.inputTokens,
        p_output_tokens: usage.outputTokens,
        p_request_metadata: usage.requestMetadata || {},
        p_response_metadata: usage.responseMetadata || {},
        p_status: usage.status || 'success',
        p_error_message: usage.errorMessage || null,
        p_duration_ms: usage.durationMs || null,
        // Cache token support
        p_cache_creation_tokens: usage.cacheCreationTokens || 0,
        p_cache_read_tokens: usage.cacheReadTokens || 0,
      });

      if (error) {
        logger.error('cost-tracking.log-usage.error', 'Failed to log API usage', {
          error: error.message,
          userId: usage.userId,
        });
        return null;
      }

      logger.info('cost-tracking.log-usage.success', 'API usage logged successfully', {
        logId: data,
        userId: usage.userId,
      });

      return data;
    } catch (error) {
      logger.error('cost-tracking.log-usage.exception', 'Exception while logging API usage', {
        error: error instanceof Error ? error.message : String(error),
        userId: usage.userId,
      });
      return null;
    }
  }

  /**
   * Get user cost summary for a specific period
   */
  async getUserCostSummary(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
    supabase?: SupabaseClient
  ): Promise<CostSummary | null> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      const { data, error } = await client.rpc('get_user_cost_details', {
        p_user_id: userId,
        p_from_date: fromDate?.toISOString().split('T')[0] || null,
        p_to_date: toDate?.toISOString().split('T')[0] || null,
      });

      if (error) {
        logger.error('cost-tracking.get-summary.error', 'Failed to get cost summary', {
          error: error.message,
          userId,
        });
        return null;
      }

      const result = data?.[0];
      if (!result) {
        return {
          totalCostCents: 0,
          totalApiCalls: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          costsByProvider: {},
          costsByModel: {},
          costsByEndpoint: {},
        };
      }

      return {
        totalCostCents: result.total_cost_cents || 0,
        totalApiCalls: result.total_api_calls || 0,
        totalInputTokens: result.total_input_tokens || 0,
        totalOutputTokens: result.total_output_tokens || 0,
        costsByProvider: result.costs_by_provider || {},
        costsByModel: result.costs_by_model || {},
        costsByEndpoint: result.costs_by_endpoint || {},
      };
    } catch (error) {
      logger.error('cost-tracking.get-summary.exception', 'Exception while getting cost summary', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return null;
    }
  }

  /**
   * Get all users cost overview (admin only)
   */
  async getAllUsersCostOverview(supabase?: SupabaseClient): Promise<UserCostDetails[]> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      const { data, error } = await client
        .from('user_costs_overview')
        .select('*')
        .order('this_month_cost_cents', { ascending: false });

      if (error) {
        logger.error(
          'cost-tracking.get-all-overview.error',
          'Failed to get all users cost overview',
          {
            error: error.message,
          }
        );
        return [];
      }

      return (data || []).map((user) => ({
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        subscriptionTier: user.subscription_tier,
        todayCostCents: user.today_cost_cents || 0,
        thisMonthCostCents: user.this_month_cost_cents || 0,
        todayApiCalls: user.today_api_calls || 0,
        thisMonthApiCalls: user.this_month_api_calls || 0,
        blueprintsThisMonth: user.blueprints_this_month || 0,
        questionsThisMonth: user.questions_this_month || 0,
      }));
    } catch (error) {
      logger.error(
        'cost-tracking.get-all-overview.exception',
        'Exception while getting all users cost overview',
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return [];
    }
  }

  /**
   * Get detailed API usage logs for a user
   */
  async getUserApiLogs(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
    supabase?: SupabaseClient
  ): Promise<any[]> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      let query = client
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }

      if (toDate) {
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        logger.error('cost-tracking.get-api-logs.error', 'Failed to get API logs', {
          error: error.message,
          userId,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('cost-tracking.get-api-logs.exception', 'Exception while getting API logs', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Update model pricing (admin only)
   */
  async updateModelPricing(
    provider: string,
    modelId: string,
    inputCostPerMillion: number,
    outputCostPerMillion: number,
    description?: string,
    supabase?: SupabaseClient
  ): Promise<boolean> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      // Deactivate existing pricing
      await client
        .from('api_model_pricing')
        .update({ is_active: false })
        .eq('provider', provider)
        .eq('model_id', modelId)
        .eq('is_active', true);

      // Insert new pricing
      const { error } = await client.from('api_model_pricing').insert({
        provider,
        model_id: modelId,
        input_cost_per_million_tokens: Math.round(inputCostPerMillion * 100), // Convert to cents
        output_cost_per_million_tokens: Math.round(outputCostPerMillion * 100), // Convert to cents
        description,
        is_active: true,
      });

      if (error) {
        logger.error('cost-tracking.update-pricing.error', 'Failed to update model pricing', {
          error: error.message,
          provider,
          modelId,
        });
        return false;
      }

      logger.info('cost-tracking.update-pricing.success', 'Model pricing updated', {
        provider,
        modelId,
        inputCost: inputCostPerMillion,
        outputCost: outputCostPerMillion,
      });

      return true;
    } catch (error) {
      logger.error(
        'cost-tracking.update-pricing.exception',
        'Exception while updating model pricing',
        {
          error: error instanceof Error ? error.message : String(error),
          provider,
          modelId,
        }
      );
      return false;
    }
  }

  /**
   * Helper to extract model ID from response
   */
  getModelIdForTracking(provider: string, model: string, promptSize?: number): string {
    // Handle Gemini 3.1 Pro with tiered pricing
    if (provider === 'anthropic' && model.includes('gemini-3.1-pro-preview')) {
      if (promptSize && promptSize > 200000) {
        return MODEL_IDS.CLAUDE_SONNET_4_5_LARGE;
      }
      return MODEL_IDS.CLAUDE_SONNET_4_5;
    }

    // Map other models
    const modelMap: Record<string, string> = {
      'gemini-3.1-pro-preview': MODEL_IDS.CLAUDE_SONNET_4,
      'gemini-3.1-pro-preview': MODEL_IDS.CLAUDE_OPUS_4,
      'llama-3.1-sonar': MODEL_IDS.PERPLEXITY_SONAR,
      llama2: MODEL_IDS.OLLAMA_LLAMA2,
      mistral: MODEL_IDS.OLLAMA_MISTRAL,
    };

    for (const [key, value] of Object.entries(modelMap)) {
      if (model.includes(key)) {
        return value;
      }
    }

    // Return original model if no mapping found
    return model;
  }

  /**
   * Calculate prompt size in tokens (rough estimate)
   */
  estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}

// Export singleton instance
export const costTrackingService = CostTrackingService.getInstance();
