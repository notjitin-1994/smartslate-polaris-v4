/**
 * Question Generation Orchestrator
 * Coordinates between Perplexity (primary) and Ollama (fallback) for dynamic question generation
 */

import { createServiceLogger } from '@/lib/logging';
import {
  generateWithPerplexity,
  validatePerplexityConfig,
  QuestionGenerationContext,
  PerplexityResponse,
} from './perplexityQuestionService';
import { generateWithOllama, isOllamaAvailable } from './ollamaQuestionService';

const logger = createServiceLogger('dynamic-questions');

export interface GenerationResult {
  success: boolean;
  sections: PerplexityResponse['sections'];
  metadata: PerplexityResponse['metadata'] & {
    source: 'perplexity' | 'ollama';
    fallbackUsed: boolean;
    fallbackReason?: string;
  };
  error?: string;
}

/**
 * Generate dynamic questions with automatic Perplexity → Ollama fallback
 */
export async function generateDynamicQuestions(
  context: QuestionGenerationContext
): Promise<GenerationResult> {
  const overallStartTime = Date.now();

  logger.info('dynamic_questions.generation.start', 'Starting dynamic question generation', {
    blueprintId: context.blueprintId,
    userId: context.userId,
  });

  // Try Perplexity first
  const perplexityConfig = validatePerplexityConfig();

  if (perplexityConfig.valid) {
    try {
      const result = await generateWithPerplexity(context);

      const totalDuration = Date.now() - overallStartTime;

      logger.info(
        'dynamic_questions.generation.complete',
        'Successfully generated questions with Perplexity',
        {
          blueprintId: context.blueprintId,
          source: 'perplexity',
          sectionCount: result.sections.length,
          questionCount: result.sections.reduce((sum, s) => sum + s.questions.length, 0),
          duration: totalDuration,
          fallbackUsed: false,
        }
      );

      return {
        success: true,
        sections: result.sections,
        metadata: {
          ...result.metadata,
          source: 'perplexity',
          fallbackUsed: false,
          duration: totalDuration,
        },
      };
    } catch (perplexityError) {
      const perplexityErrorMessage =
        perplexityError instanceof Error ? perplexityError.message : String(perplexityError);

      logger.warn(
        'dynamic_questions.generation.error',
        'Perplexity failed, attempting Ollama fallback',
        {
          blueprintId: context.blueprintId,
          error: perplexityErrorMessage,
          fallbackActivated: true,
        }
      );

      // Continue to fallback
      return await runFallback(context, perplexityErrorMessage, overallStartTime);
    }
  } else {
    logger.warn(
      'dynamic_questions.generation.error',
      'Perplexity not configured, using Ollama fallback',
      {
        blueprintId: context.blueprintId,
        errors: perplexityConfig.errors,
        fallbackActivated: true,
      }
    );

    return await runFallback(
      context,
      `Perplexity not configured: ${perplexityConfig.errors.join(', ')}`,
      overallStartTime
    );
  }
}

/**
 * Use Ollama fallback
 */
async function runFallback(
  context: QuestionGenerationContext,
  reason: string,
  overallStartTime: number
): Promise<GenerationResult> {
  // Check Ollama availability
  const ollamaHealthy = await isOllamaAvailable();

  if (!ollamaHealthy) {
    const totalDuration = Date.now() - overallStartTime;

    logger.error('dynamic_questions.generation.error', 'Both Perplexity and Ollama failed', {
      blueprintId: context.blueprintId,
      perplexityReason: reason,
      ollamaAvailable: false,
      duration: totalDuration,
    });

    return {
      success: false,
      sections: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'none',
        source: 'ollama',
        fallbackUsed: true,
        fallbackReason: 'Both services unavailable',
        duration: totalDuration,
      },
      error: `Question generation failed. Perplexity: ${reason}. Ollama: Service unavailable.`,
    };
  }

  try {
    const result = await generateWithOllama(context, reason);
    const totalDuration = Date.now() - overallStartTime;

    logger.info(
      'dynamic_questions.generation.complete',
      'Successfully generated questions with Ollama fallback',
      {
        blueprintId: context.blueprintId,
        source: 'ollama',
        sectionCount: result.sections.length,
        questionCount: result.sections.reduce((sum, s) => sum + s.questions.length, 0),
        duration: totalDuration,
        fallbackUsed: true,
        fallbackReason: reason,
      }
    );

    return {
      success: true,
      sections: result.sections,
      metadata: {
        ...result.metadata,
        source: 'ollama',
        fallbackUsed: true,
        fallbackReason: reason,
        duration: totalDuration,
      },
    };
  } catch (ollamaError) {
    const totalDuration = Date.now() - overallStartTime;
    const ollamaErrorMessage =
      ollamaError instanceof Error ? ollamaError.message : String(ollamaError);

    logger.error('dynamic_questions.generation.error', 'Both Perplexity and Ollama failed', {
      blueprintId: context.blueprintId,
      perplexityError: reason,
      ollamaError: ollamaErrorMessage,
      duration: totalDuration,
    });

    return {
      success: false,
      sections: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'none',
        source: 'ollama',
        fallbackUsed: true,
        fallbackReason: reason,
        duration: totalDuration,
      },
      error: `Question generation failed. Perplexity: ${reason}. Ollama: ${ollamaErrorMessage}`,
    };
  }
}

/**
 * Validate generation configuration
 */
export function validateGenerationConfig(): {
  perplexity: { valid: boolean; errors: string[] };
  ollama: { available: boolean };
} {
  return {
    perplexity: validatePerplexityConfig(),
    ollama: { available: true }, // Always true, checked at runtime
  };
}
