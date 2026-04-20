/**
 * Pricing Validation Service
 * Validates that models have pricing configured and alerts admins when pricing is missing
 */

import { createServiceLogger } from '@/lib/logging';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createServiceLogger('pricing-validation');

export interface MissingPricingAlert {
  provider: string;
  modelId: string;
  usageCount: number;
  firstSeen: string;
  lastSeen: string;
  totalTokens: number;
}

export interface PricingValidationResult {
  isValid: boolean;
  provider: string;
  modelId: string;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
  cacheReadCostPerMillion?: number;
  errorMessage?: string;
}

/**
 * Pricing Validation Service
 */
export class PricingValidationService {
  private static instance: PricingValidationService;

  private constructor() {}

  static getInstance(): PricingValidationService {
    if (!PricingValidationService.instance) {
      PricingValidationService.instance = new PricingValidationService();
    }
    return PricingValidationService.instance;
  }

  /**
   * Validate that pricing exists for a given model
   */
  async validateModelPricing(
    provider: string,
    modelId: string,
    supabase?: SupabaseClient
  ): Promise<PricingValidationResult> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      const { data, error } = await client
        .from('api_model_pricing')
        .select(
          'input_cost_per_million_tokens, output_cost_per_million_tokens, cache_read_cost_per_million_tokens'
        )
        .eq('provider', provider)
        .eq('model_id', modelId)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        logger.warn('pricing-validation.missing', 'No pricing found for model', {
          provider,
          modelId,
          error: error?.message,
        });

        return {
          isValid: false,
          provider,
          modelId,
          errorMessage: `No pricing configured for ${provider}/${modelId}. Costs will be reported as $0.`,
        };
      }

      logger.debug('pricing-validation.found', 'Pricing found for model', {
        provider,
        modelId,
        inputCost: data.input_cost_per_million_tokens,
        outputCost: data.output_cost_per_million_tokens,
        cacheReadCost: data.cache_read_cost_per_million_tokens,
      });

      return {
        isValid: true,
        provider,
        modelId,
        inputCostPerMillion: data.input_cost_per_million_tokens,
        outputCostPerMillion: data.output_cost_per_million_tokens,
        cacheReadCostPerMillion: data.cache_read_cost_per_million_tokens,
      };
    } catch (error) {
      logger.error('pricing-validation.error', 'Error validating pricing', {
        error: error instanceof Error ? error.message : String(error),
        provider,
        modelId,
      });

      return {
        isValid: false,
        provider,
        modelId,
        errorMessage: 'Error checking pricing configuration',
      };
    }
  }

  /**
   * Get all models that are missing pricing
   */
  async getModelsMissingPricing(supabase?: SupabaseClient): Promise<MissingPricingAlert[]> {
    try {
      const client = supabase || (await getSupabaseServerClient());

      const { data, error } = await client.from('models_missing_pricing').select('*');

      if (error) {
        logger.error('pricing-validation.get-missing.error', 'Failed to get missing pricing', {
          error: error.message,
        });
        return [];
      }

      const alerts: MissingPricingAlert[] = (data || []).map((row) => ({
        provider: row.api_provider,
        modelId: row.model_id,
        usageCount: row.usage_count,
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
        totalTokens: row.total_tokens,
      }));

      if (alerts.length > 0) {
        logger.warn('pricing-validation.missing-models', 'Models missing pricing detected', {
          count: alerts.length,
          models: alerts.map((a) => `${a.provider}/${a.modelId}`),
        });
      }

      return alerts;
    } catch (error) {
      logger.error(
        'pricing-validation.get-missing.exception',
        'Exception getting missing pricing',
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return [];
    }
  }

  /**
   * Check if there are any models with missing pricing and log warnings
   */
  async checkAndAlertMissingPricing(supabase?: SupabaseClient): Promise<void> {
    const missingPricing = await this.getModelsMissingPricing(supabase);

    if (missingPricing.length > 0) {
      logger.error(
        'pricing-validation.alert',
        `${missingPricing.length} models are missing pricing configuration!`,
        {
          models: missingPricing.map((m) => ({
            provider: m.provider,
            modelId: m.modelId,
            usageCount: m.usageCount,
            totalTokens: m.totalTokens,
          })),
        }
      );

      // Log each model individually for easier tracking
      for (const model of missingPricing) {
        logger.error('pricing-validation.missing-model-detail', 'Model missing pricing', {
          provider: model.provider,
          modelId: model.modelId,
          usageCount: model.usageCount,
          firstSeen: model.firstSeen,
          lastSeen: model.lastSeen,
          totalTokens: model.totalTokens,
        });
      }
    }
  }
}

// Export singleton instance
export const pricingValidationService = PricingValidationService.getInstance();
