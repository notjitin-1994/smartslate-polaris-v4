/**
 * Question Generation Orchestrator
 * Coordinates between Gemini (primary) and Ollama (fallback) for dynamic question generation
 */

import { createServiceLogger } from '@/lib/logging';
import {
  generateWithGemini,
  validateGeminiConfig,
  QuestionGenerationContext,
  GeminiResponse,
} from './claudeQuestionService';

const logger = createServiceLogger('dynamic-questions');

export interface GenerationResult {
  success: boolean;
  sections: GeminiResponse['sections'];
  metadata: GeminiResponse['metadata'] & {
    source: 'claude';
    fallbackUsed: boolean;
    fallbackReason?: string;
  };
  error?: string;
}

/**
 * Generate dynamic questions with Gemini only
 */
export async function generateDynamicQuestions(
  context: QuestionGenerationContext
): Promise<GenerationResult> {
  const overallStartTime = Date.now();

  logger.info('dynamic_questions.generation.start', 'Starting dynamic question generation', {
    blueprintId: context.blueprintId,
    userId: context.userId,
  });

  // Try Gemini first
  const claudeConfig = validateGeminiConfig();

  if (claudeConfig.valid) {
    try {
      const result = await generateWithGemini(context);

      const totalDuration = Date.now() - overallStartTime;

      logger.info(
        'dynamic_questions.generation.complete',
        'Successfully generated questions with Gemini',
        {
          blueprintId: context.blueprintId,
          source: 'claude',
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
          source: 'claude',
          fallbackUsed: false,
          duration: totalDuration,
        },
      };
    } catch (claudeError) {
      const claudeErrorMessage =
        claudeError instanceof Error ? claudeError.message : String(claudeError);

      logger.error('dynamic_questions.generation.error', 'Gemini generation failed', {
        blueprintId: context.blueprintId,
        error: claudeErrorMessage,
      });

      const totalDuration = Date.now() - overallStartTime;

      return {
        success: false,
        sections: [],
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-3.1-pro-preview',
          source: 'claude',
          fallbackUsed: false,
          duration: totalDuration,
        },
        error: `Question generation failed: ${claudeErrorMessage}`,
      };
    }
  } else {
    const totalDuration = Date.now() - overallStartTime;

    logger.error('dynamic_questions.generation.error', 'Gemini not configured', {
      blueprintId: context.blueprintId,
      errors: claudeConfig.errors,
    });

    return {
      success: false,
      sections: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        source: 'claude',
        fallbackUsed: false,
        duration: totalDuration,
      },
      error: `Gemini not configured: ${claudeConfig.errors.join(', ')}`,
    };
  }
}

/**
 * Validate generation configuration
 */
export function validateGenerationConfig(): {
  claude: { valid: boolean; errors: string[] };
} {
  return {
    claude: validateGeminiConfig(),
  };
}
