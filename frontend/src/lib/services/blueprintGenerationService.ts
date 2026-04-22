/**
 * Blueprint Generation Orchestrator Service
 * Implements dual-fallback: Gemini 3.1 Pro → Gemini 3.1 Pro
 */

import { GeminiClient, GeminiApiError } from '@/lib/claude/client';
import { TrackedGeminiClient } from '@/lib/claude/clientWithCostTracking';
import { getGeminiConfig } from '@/lib/claude/config';
import {
  loadBlueprintSystemPrompt,
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
import {
  validateStaticAnswers,
  validateDynamicAnswers,
  validateBlueprintResponse,
  sanitizeForLLM,
} from '@/lib/validation/dataIntegrity';
import {
  WorkflowTracer,
  logDataFlow,
  logLLMRequest,
  logLLMResponse,
  logValidation,
  logTransformation,
  logError as logDetailedError,
} from '@/lib/logging/blueprintLogger';

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
  private claudeClient: TrackedGeminiClient;
  private config: ReturnType<typeof getGeminiConfig>;

  constructor(supabase?: any) {
    this.config = getGeminiConfig();
    this.claudeClient = new TrackedGeminiClient(undefined, supabase);
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

    // Initialize workflow tracer
    const tracer = new WorkflowTracer({
      blueprintId: context.blueprintId,
      userId: context.userId,
      organization: context.organization,
    });

    tracer.addStep('start', { industry: context.industry, role: context.role });

    // Log initial data
    logDataFlow(
      'input',
      {
        staticAnswersSize: JSON.stringify(context.staticAnswers).length,
        dynamicAnswersSize: JSON.stringify(context.dynamicAnswers).length,
        objectivesCount: context.learningObjectives?.length || 0,
      },
      { blueprintId: context.blueprintId }
    );

    // Validate input data before proceeding
    tracer.addStep('validate-static');
    const staticValidation = validateStaticAnswers(context.staticAnswers);
    logValidation(
      'static-answers',
      staticValidation.isValid,
      staticValidation.errors,
      staticValidation.warnings,
      {
        blueprintId: context.blueprintId,
      }
    );
    if (!staticValidation.isValid) {
      logger.error(
        'blueprint.generation.invalid_static_answers',
        'Static answers validation failed',
        {
          blueprintId: context.blueprintId,
          errors: staticValidation.errors,
        }
      );

      return {
        success: false,
        blueprint: null,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: 0,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 0,
        },
        error: `Invalid static answers: ${staticValidation.errors.join('; ')}`,
      };
    }

    tracer.addStep('validate-dynamic');
    const dynamicValidation = validateDynamicAnswers(context.dynamicAnswers);
    logValidation(
      'dynamic-answers',
      dynamicValidation.isValid,
      dynamicValidation.errors,
      dynamicValidation.warnings,
      {
        blueprintId: context.blueprintId,
      }
    );
    if (!dynamicValidation.isValid) {
      logger.error(
        'blueprint.generation.invalid_dynamic_answers',
        'Dynamic answers validation failed',
        {
          blueprintId: context.blueprintId,
          errors: dynamicValidation.errors,
        }
      );

      return {
        success: false,
        blueprint: null,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: 0,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 0,
        },
        error: `Invalid dynamic answers: ${dynamicValidation.errors.join('; ')}`,
      };
    }

    // Sanitize data if needed
    tracer.addStep('sanitize-data');
    const beforeSize = JSON.stringify(context).length;
    const sanitizedContext = {
      ...context,
      staticAnswers: sanitizeForLLM(context.staticAnswers || {}),
      dynamicAnswers: sanitizeForLLM(context.dynamicAnswers || {}),
    };
    const afterSize = JSON.stringify(sanitizedContext).length;
    logTransformation('sanitize', beforeSize, afterSize, { blueprintId: context.blueprintId });

    // Check cache first for exact matches
    const staticAnswers = sanitizedContext.staticAnswers || {};
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
    const systemPrompt = loadBlueprintSystemPrompt();
    const userPrompt = buildBlueprintPrompt(sanitizedContext);

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
          18000 // Increased max_tokens for Sonnet 4.5 to prevent truncation
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
            20000 // Increased max_tokens for Sonnet 4 to prevent truncation
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
      userId: context.userId,
      blueprintId: context.blueprintId,
      endpoint: 'blueprint-generation',
    });

    const text = GeminiClient.extractText(response);
    const validated = validateAndNormalizeBlueprint(text);

    // Additional validation for blueprint completeness
    const blueprintValidation = validateBlueprintResponse(validated);
    if (!blueprintValidation.isValid) {
      logger.error(
        'blueprint.generation.incomplete_response',
        'Generated blueprint failed validation',
        {
          blueprintId: context.blueprintId,
          model,
          errors: blueprintValidation.errors,
          warnings: blueprintValidation.warnings,
        }
      );

      // If critical sections are missing, throw error to trigger retry
      if (blueprintValidation.errors.some((e) => e.includes('Missing required sections'))) {
        throw new Error(`Incomplete blueprint generated: ${blueprintValidation.errors.join('; ')}`);
      }
    }

    // Log warnings if any
    if (blueprintValidation.warnings.length > 0) {
      logger.warn('blueprint.generation.validation_warnings', 'Blueprint has validation warnings', {
        blueprintId: context.blueprintId,
        warnings: blueprintValidation.warnings,
      });
    }

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
// Singleton instance for backward compatibility (no cost tracking)
export const blueprintGenerationService = new BlueprintGenerationService();

// Factory function to create instance with cost tracking
export function createBlueprintGenerationService(supabase?: any): BlueprintGenerationService {
  return new BlueprintGenerationService(supabase);
}
