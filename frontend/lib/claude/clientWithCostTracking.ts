/**
 * Enhanced Gemini API Client with Cost Tracking
 * Extends the base Gemini client to automatically log API usage and costs
 */

import { GeminiClient, type GeminiRequest, type GeminiResponse } from './client';
import { costTrackingService, MODEL_IDS, ENDPOINTS } from '@/lib/services/costTrackingService';
import { createServiceLogger } from '@/lib/logging';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createServiceLogger('claude-client-tracked');

export interface TrackedGeminiRequest extends GeminiRequest {
  userId?: string;
  blueprintId?: string;
  endpoint?: string;
}

/**
 * Enhanced Gemini Client with automatic cost tracking
 */
export class TrackedGeminiClient extends GeminiClient {
  private supabase?: SupabaseClient;

  constructor(config?: any, supabase?: SupabaseClient) {
    super(config);
    this.supabase = supabase;
  }

  /**
   * Override generate() to add automatic cost tracking
   * Maintains exact backward compatibility with base GeminiClient
   * If userId is provided in request, tracking is enabled
   */
  async generate(request: TrackedGeminiRequest): Promise<GeminiResponse> {
    // If no userId provided, call base implementation without tracking
    if (!request.userId) {
      return super.generate(request);
    }

    const startTime = Date.now();
    let response: GeminiResponse | null = null;
    let error: Error | null = null;
    let status: 'success' | 'error' | 'timeout' | 'rate_limited' = 'success';

    try {
      // Call the base generate method
      response = await super.generate(request);

      logger.info('claude.tracked.success', 'Gemini API call successful', {
        userId: request.userId,
        blueprintId: request.blueprintId,
        model: response.model,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        cacheCreationTokens: response.usage?.cache_creation_input_tokens,
        cacheReadTokens: response.usage?.cache_read_input_tokens,
      });

      return response;
    } catch (err) {
      error = err as Error;

      // Determine error status
      if (error.message.includes('timeout')) {
        status = 'timeout';
      } else if (error.message.includes('429') || error.message.includes('rate')) {
        status = 'rate_limited';
      } else {
        status = 'error';
      }

      logger.error('claude.tracked.error', 'Gemini API call failed', {
        userId: request.userId,
        blueprintId: request.blueprintId,
        error: error.message,
        status,
      });

      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Log API usage and costs (only if userId is present)
      if ((response?.usage || error) && request.userId) {
        try {
          const modelId = this.getModelIdForTracking(
            response?.model || request.model || '',
            request.system.length + request.messages.reduce((acc, m) => acc + m.content.length, 0)
          );

          await costTrackingService.logApiUsage(
            {
              userId: request.userId,
              blueprintId: request.blueprintId,
              provider: 'anthropic',
              modelId,
              endpoint: request.endpoint || 'unknown',
              inputTokens: response?.usage?.input_tokens || 0,
              outputTokens: response?.usage?.output_tokens || 0,
              // Cache token support
              cacheCreationTokens: response?.usage?.cache_creation_input_tokens || 0,
              cacheReadTokens: response?.usage?.cache_read_input_tokens || 0,
              requestMetadata: {
                model: request.model,
                maxTokens: request.max_tokens,
                temperature: request.temperature,
                messageCount: request.messages.length,
              },
              responseMetadata: response
                ? {
                    model: response.model,
                    stopReason: response.stop_reason,
                    stopSequence: response.stop_sequence,
                    // Include cache token info in response metadata for debugging
                    cacheCreationTokens: response.usage?.cache_creation_input_tokens,
                    cacheReadTokens: response.usage?.cache_read_input_tokens,
                  }
                : {},
              status,
              errorMessage: error?.message,
              durationMs: duration,
            },
            this.supabase
          );

          logger.info('claude.tracked.cost-logged', 'Cost tracking logged', {
            userId: request.userId,
            modelId,
            inputTokens: response?.usage?.input_tokens || 0,
            outputTokens: response?.usage?.output_tokens || 0,
            cacheCreationTokens: response?.usage?.cache_creation_input_tokens || 0,
            cacheReadTokens: response?.usage?.cache_read_input_tokens || 0,
          });
        } catch (trackingError) {
          // Don't fail the request if cost tracking fails
          logger.error('claude.tracked.cost-tracking-failed', 'Failed to log cost tracking', {
            error: (trackingError as Error).message,
            userId: request.userId,
          });
        }
      }
    }
  }

  /**
   * Helper to determine the correct model ID for cost tracking
   */
  private getModelIdForTracking(model: string, promptSize: number): string {
    const estimatedTokens = Math.ceil(promptSize / 4); // Rough estimate

    // Handle Gemini 3.1 Pro (mapped to Gemini pricing for compatibility)
    if (model.includes('gemini-3.1-pro-preview')) {
      if (estimatedTokens > 200000) {
        return MODEL_IDS.CLAUDE_SONNET_4_5_LARGE;
      }
      return MODEL_IDS.CLAUDE_SONNET_4_5;
    }

    // Default to the model as-is
    return model;
  }
}

/**
 * Factory function to create a tracked Gemini client
 */
export function createTrackedGeminiClient(
  userId: string,
  supabase?: SupabaseClient
): TrackedGeminiClient {
  return new TrackedGeminiClient(undefined, supabase);
}
