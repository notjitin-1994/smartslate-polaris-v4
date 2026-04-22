/**
 * Blueprint Generation Orchestrator Service
 * Implements dual-fallback: Gemini 3.1 Pro → Gemini 3.1 Pro
 */

import { GeminiClient } from '@/lib/claude/client';
import { getGeminiConfig } from '@/lib/claude/config';
import {
  BLUEPRINT_SYSTEM_PROMPT,
  buildBlueprintPrompt,
  type BlueprintContext,
} from '@/lib/ai/prompts/blueprint-prompts';
import { validateAndNormalizeBlueprint } from '@/lib/claude/validation';
import { shouldFallbackToSonnet4, logFallbackDecision } from '@/lib/claude/fallback';
import { createServiceLogger } from '@/lib/logging';
import {
  getCachedBlueprint,
  getSimilarBlueprint,
  cacheBlueprint,
} from '@/lib/cache/blueprintCache';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';

const logger = createServiceLogger('blueprint-generation');

export interface GenerationResult {
  success: boolean;
  blueprint: any;
  metadata: {
    model: 'gemini-3.1-pro-preview' | 'gemini-3.1-pro-preview';
    duration: number;
    timestamp: string;
    fallbackUsed: boolean;
    attempts: number;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}

/**
 * Blueprint Generation Service
 * Orchestrates model selection, retries, validation, and normalization
 */
export class BlueprintGenerationService {
  private claudeClient: GeminiClient;
  private config: ReturnType<typeof getGeminiConfig>;

  constructor() {
    this.config = getGeminiConfig();
    this.claudeClient = new GeminiClient();
  }

  /**
   * Generate blueprint with dual-fallback cascade
   * 1. Try Gemini 3.1 Pro (primary) - if API key available
   * 2. On failure or missing key, try Gemini 3.1 Pro (fallback) - if API key available
   */
  async generate(context: BlueprintContext): Promise<GenerationResult> {
    const endTimer = performanceMonitor.startTimer(
      'blueprint_generation',
      {
        blueprintId: context.blueprintId,
        userId: context.userId,
      },
      { type: 'api' }
    );

    // Check cache first for exact matches
    const staticAnswers = context.staticAnswers || {};
    const cachedBlueprint = await getCachedBlueprint(staticAnswers);

    if (cachedBlueprint) {
      const metric = endTimer();
      logger.info('blueprint.generation.cache_hit', 'Blueprint found in cache', {
        blueprintId: context.blueprintId,
        userId: context.userId,
        cacheHit: true,
        duration: metric.duration,
      });

      return {
        success: true,
        blueprint: cachedBlueprint,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: metric.duration,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 0,
        },
      };
    }

    // Check for similar blueprints
    const similarBlueprint = await getSimilarBlueprint(staticAnswers);

    if (similarBlueprint) {
      const metric = endTimer();
      logger.info('blueprint.generation.similar_cache_hit', 'Similar blueprint found in cache', {
        blueprintId: context.blueprintId,
        userId: context.userId,
        cacheHit: true,
        similar: true,
        duration: metric.duration,
      });

      // Cache the similar blueprint for this exact questionnaire too
      await cacheBlueprint(staticAnswers, similarBlueprint);

      return {
        success: true,
        blueprint: similarBlueprint,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: metric.duration,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 0,
        },
      };
    }

    const startTime = Date.now();

    logger.info('blueprint.generation.started', 'Blueprint generation started', {
      blueprintId: context.blueprintId,
      userId: context.userId,
      organization: context.organization,
      industry: context.industry,
      cacheHit: false,
    });

    // Build prompts once, reuse for all models
    const systemPrompt = BLUEPRINT_SYSTEM_PROMPT;
    const userPrompt = buildBlueprintPrompt(context);

    // Check if Gemini API key is available
    const hasGeminiKey = this.config.apiKey && this.config.apiKey.trim().length > 0;

    if (hasGeminiKey) {
      // Try Gemini 3.1 Pro (primary)
      try {
        const blueprint = await this.generateWithGemini(
          context,
          this.config.primaryModel,
          systemPrompt,
          userPrompt,
          20000 // INCREASED: max_tokens for Sonnet 4.5 (supports 24K, using 20K for safety buffer)
        );

        const duration = Date.now() - startTime;

        // Cache the generated blueprint for future use
        try {
          await cacheBlueprint(staticAnswers, blueprint.data);
        } catch (cacheError) {
          logger.warn('blueprint.generation.cache_error', 'Failed to cache generated blueprint', {
            blueprintId: context.blueprintId,
            error: (cacheError as Error).message,
          });
        }

        const metric = endTimer();

        logger.info('blueprint.generation.success', 'Blueprint generation succeeded', {
          blueprintId: context.blueprintId,
          model: 'gemini-3.1-pro-preview',
          duration,
          attempts: 1,
          cached: true,
        });

        return {
          success: true,
          blueprint: blueprint.data,
          metadata: {
            model: 'gemini-3.1-pro-preview',
            duration: metric.duration,
            timestamp: new Date().toISOString(),
            fallbackUsed: false,
            attempts: 1,
          },
          usage: blueprint.usage,
        };
      } catch (sonnetError) {
        logger.warn('blueprint.generation.claude_primary_failed', 'Gemini primary failed', {
          blueprintId: context.blueprintId,
          error: (sonnetError as Error).message,
        });

        // Check if we should fallback to Sonnet 4
        const fallbackDecision = shouldFallbackToSonnet4(sonnetError as Error);

        logFallbackDecision(fallbackDecision, {
          blueprintId: context.blueprintId,
          model: 'gemini-3.1-pro-preview',
          attempt: 1,
        });

        if (!fallbackDecision.shouldFallback) {
          // Don't fallback - return error
          const duration = Date.now() - startTime;

          logger.error(
            'blueprint.generation.failed_no_fallback',
            'Generation failed without fallback',
            {
              blueprintId: context.blueprintId,
              duration,
              error: (sonnetError as Error).message,
            }
          );

          return {
            success: false,
            blueprint: null,
            metadata: {
              model: 'gemini-3.1-pro-preview',
              duration,
              timestamp: new Date().toISOString(),
              fallbackUsed: false,
              attempts: 1,
            },
            error: (sonnetError as Error).message,
          };
        }

        // Try Gemini 3.1 Pro (fallback)
        try {
          const blueprint = await this.generateWithGemini(
            context,
            this.config.fallbackModel,
            systemPrompt,
            userPrompt,
            20000 // INCREASED: max_tokens for Sonnet 4 (increased to match 4.5 for consistency)
          );

          const duration = Date.now() - startTime;

          logger.info('blueprint.generation.fallback_success', 'Gemini fallback succeeded', {
            blueprintId: context.blueprintId,
            model: 'gemini-3.1-pro-preview',
            duration,
            attempts: 2,
            fallbackTrigger: fallbackDecision.trigger,
          });

          return {
            success: true,
            blueprint: blueprint.data,
            metadata: {
              model: 'gemini-3.1-pro-preview',
              duration,
              timestamp: new Date().toISOString(),
              fallbackUsed: true,
              attempts: 2,
            },
            usage: blueprint.usage,
          };
        } catch (sonnet4Error) {
          logger.error(
            'blueprint.generation.claude_fallback_failed',
            'Gemini 3.1 Pro fallback failed',
            {
              blueprintId: context.blueprintId,
              sonnet45Error: (sonnetError as Error).message,
              sonnet4Error: (sonnet4Error as Error).message,
            }
          );
        }
      }
    } else {
      const duration = Date.now() - startTime;

      logger.error('blueprint.generation.claude_unavailable', 'Gemini API key not available', {
        blueprintId: context.blueprintId,
        duration,
      });

      return {
        success: false,
        blueprint: null,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 0,
        },
        error: 'Gemini API key not available. Please configure GOOGLE_GENERATIVE_AI_API_KEY.',
      };
    }

    // If we reach here, all Gemini attempts failed
    const duration = Date.now() - startTime;

    logger.error('blueprint.generation.all_failed', 'All Gemini generation methods failed', {
      blueprintId: context.blueprintId,
      duration,
    });

    return {
      success: false,
      blueprint: null,
      metadata: {
        model: 'gemini-3.1-pro-preview',
        duration,
        timestamp: new Date().toISOString(),
        fallbackUsed: true,
        attempts: hasGeminiKey ? 2 : 0,
      },
      error: 'All Gemini generation methods failed. Please check your API configuration.',
    };
  }

  /**
   * Generate blueprint using Gemini (Sonnet or Opus)
   */
  private async generateWithGemini(
    context: BlueprintContext,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number
  ): Promise<{ data: any; usage: { input_tokens: number; output_tokens: number } }> {
    logger.info('blueprint.generation.claude_attempt', 'Attempting Gemini generation', {
      blueprintId: context.blueprintId,
      model,
      maxTokens,
    });

    const response = await this.claudeClient.generate({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: this.config.temperature,
    });

    const text = GeminiClient.extractText(response);
    const validated = validateAndNormalizeBlueprint(text);

    return {
      data: validated,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  }
}

/**
 * Singleton instance
 */
export const blueprintGenerationService = new BlueprintGenerationService();
