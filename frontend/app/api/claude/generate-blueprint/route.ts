/**
 * Gemini Blueprint Generation API Endpoint
 * Secure server-side proxy for Gemini API calls
 * Never exposes API keys to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiConfig } from '@/lib/claude/config';
import { GeminiClient, GeminiApiError } from '@/lib/claude/client';
import { validateAndNormalizeBlueprint } from '@/lib/claude/validation';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

// Allow up to ~13.3 minutes (800 seconds) for Gemini blueprint generation
// Note: On Vercel, this requires Pro or Enterprise plan (max 800s for Pro plan)
export const maxDuration = 800;

export interface GenerateBlueprintRequest {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  blueprintId: string;
}

export interface GenerateBlueprintResponse {
  success: boolean;
  blueprint?: any;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  metadata?: {
    model: string;
    duration: number;
    timestamp: string;
  };
  error?: string;
}

/**
 * POST /api/claude/generate-blueprint
 * Generate a learning blueprint using Gemini API
 */
export async function POST(req: NextRequest): Promise<NextResponse<GenerateBlueprintResponse>> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = (await req.json()) as GenerateBlueprintRequest;
    const { model, systemPrompt, userPrompt, blueprintId } = body;

    // Validate required fields
    if (!systemPrompt || !userPrompt || !blueprintId) {
      logger.warn('claude.api.invalid_request', 'Invalid request body', {
        hasSystemPrompt: !!systemPrompt,
        hasUserPrompt: !!userPrompt,
        hasBlueprintId: !!blueprintId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: systemPrompt, userPrompt, and blueprintId are required',
        },
        { status: 400 }
      );
    }

    logger.info('claude.api.request_received', 'Gemini request received', {
      blueprintId,
      model: model || 'default',
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    });

    // Get configuration and create client
    const config = getGeminiConfig();
    const client = new GeminiClient();

    // Make API call
    const response = await client.generate({
      model: model || config.primaryModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    const text = GeminiClient.extractText(response);

    // Validate and normalize blueprint
    const blueprint = validateAndNormalizeBlueprint(text);

    const duration = Date.now() - startTime;

    logger.info('claude.api.success', 'Gemini blueprint generated', {
      blueprintId,
      model: response.model,
      duration,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return NextResponse.json({
      success: true,
      blueprint,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      metadata: {
        model: response.model,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Handle Gemini API errors
    if (error instanceof GeminiApiError) {
      logger.error('claude.api.claude_error', 'Gemini API error', {
        duration,
        statusCode: error.statusCode,
        errorType: error.errorType,
        message: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Gemini API error: ${error.message}`,
        },
        { status: error.statusCode || 500 }
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      logger.error('claude.api.validation_error', 'Validation error', {
        duration,
        message: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${error.message}`,
        },
        { status: 400 }
      );
    }

    // Handle unknown errors
    logger.error('claude.api.unknown_error', 'Unknown error during Gemini generation', {
      duration,
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
