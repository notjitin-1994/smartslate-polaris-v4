/**
 * Gemini API Client
 * Robust client with retry logic, timeout handling, and comprehensive error handling
 */

import { getGeminiConfig, type GeminiConfig } from './config';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('claude-client');

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeminiRequest {
  model?: string;
  system: string;
  messages: GeminiMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    // Cache token support (Anthropic prompt caching)
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface GeminiErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponential backoff: baseDelay * 2^attempt
        const delay = baseDelay * Math.pow(2, attempt);

        logger.warn('claude.client.retry', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: (error as Error).message,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Gemini API Client
 */
export class GeminiClient {
  private config: GeminiConfig;

  constructor(config?: Partial<GeminiConfig>) {
    this.config = config ? { ...getGeminiConfig(), ...config } : getGeminiConfig();
  }

  /**
   * Generate content using Gemini API
   * Implements timeout, retry logic, comprehensive error handling, and automatic token limit adjustment
   */
  async generate(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    let currentMaxTokens = request.max_tokens || this.config.maxTokens;
    const maxAllowedTokens = 64000; // Increased to 64K for Gemini 3.1 Pro

    logger.info('claude.client.request', {
      model: request.model || this.config.primaryModel,
      maxTokens: currentMaxTokens,
      temperature: request.temperature ?? this.config.temperature,
    });

    // Try generation with increasing token limits if truncated
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const adjustedRequest = {
          ...request,
          max_tokens: currentMaxTokens,
        };

        const response = await withRetry(
          () => this.makeRequest(adjustedRequest),
          this.config.retries
        );

        const duration = Date.now() - startTime;

        // CRITICAL: Check if response was truncated at max_tokens
        if (response.stop_reason === 'max_tokens') {
          attempts++;

          // Calculate new token limit (increase by 50%)
          const newMaxTokens = Math.min(Math.ceil(currentMaxTokens * 1.5), maxAllowedTokens);

          if (newMaxTokens > currentMaxTokens && newMaxTokens <= maxAllowedTokens) {
            logger.warn(
              'claude.client.truncation_retry',
              'Response truncated, retrying with higher limit',
              {
                model: response.model,
                currentMaxTokens,
                newMaxTokens,
                outputTokens: response.usage.output_tokens,
                stopReason: response.stop_reason,
                attempt: attempts,
              }
            );

            currentMaxTokens = newMaxTokens;
            continue; // Retry with higher token limit
          } else {
            // Can't increase further, log and throw error
            logger.error(
              'claude.client.truncation_limit_reached',
              'Response truncated at maximum token limit',
              {
                model: response.model,
                maxTokens: currentMaxTokens,
                outputTokens: response.usage.output_tokens,
                stopReason: response.stop_reason,
              }
            );

            throw new GeminiApiError(
              `Response was truncated at max_tokens (${currentMaxTokens}). The response is incomplete. ` +
                `Consider simplifying the prompt or breaking it into smaller requests.`,
              429, // Too Many Tokens (custom code)
              'max_tokens_exceeded'
            );
          }
        }

        logger.info('claude.client.success', {
          model: response.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          stopReason: response.stop_reason,
          duration,
          tokenAdjustmentAttempts: attempts,
        });

        return response;
      } catch (error) {
        // If not a truncation error, throw immediately
        if (!(error instanceof GeminiApiError) || error.errorType !== 'max_tokens_exceeded') {
          const duration = Date.now() - startTime;
          logger.error('claude.client.error', {
            duration,
            error: (error as Error).message,
          });
          throw error;
        }

        // If it's a truncation error and we've exhausted attempts, throw
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
      }
    }

    // Should not reach here, but throw error if it does
    throw new GeminiApiError(
      'Failed to generate response after maximum attempts',
      500,
      'generation_failed'
    );
  }

  /**
   * Make a single request to Gemini API
   * Implements timeout and error handling
   */
  private async makeRequest(request: GeminiRequest): Promise<GeminiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const messages = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push(...request.messages.map(m => ({ role: m.role, content: m.content })));

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || this.config.primaryModel,
          max_tokens: request.max_tokens || this.config.maxTokens,
          temperature: request.temperature ?? this.config.temperature,
          messages: messages,
        }),
        signal: controller.signal,
      });

      console.log(`[Gemini Client] Request to ${this.config.baseUrl}/chat/completions`);
      console.log(`[Gemini Client] Model: ${request.model || this.config.primaryModel}`);
      console.log(`[Gemini Client] Response Status: ${response.status} ${response.statusText}`);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[Gemini Client] API Error:', JSON.stringify(errorData, null, 2));
        throw new GeminiApiError(
          errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.error?.type || 'unknown_error',
          errorData
        );
      }

      const data = await response.json();
      console.log('[Gemini Client] Success response received');
      
      const stopReasonMap: Record<string, string> = {
        'stop': 'end_turn',
        'length': 'max_tokens',
        'content_filter': 'stop_sequence'
      };

      const finishReason = data.choices?.[0]?.finish_reason || 'stop';

      return {
        id: data.id,
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: data.choices?.[0]?.message?.content || ''
        }],
        model: data.model || request.model || 'gemini-3.1-pro-preview',
        stop_reason: stopReasonMap[finishReason] || finishReason,
        stop_sequence: null,
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GeminiApiError(`Request timeout after ${this.config.timeout}ms`, 408, 'timeout');
      }

      // Re-throw GeminiApiError as-is
      if (error instanceof GeminiApiError) {
        throw error;
      }

      // Wrap other errors
      throw new GeminiApiError(
        `Network error: ${(error as Error).message}`,
        undefined,
        'network_error',
        error
      );
    }
  }

  /**
   * Extract text content from Gemini response
   */
  static extractText(response: GeminiResponse): string {
    return response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  }

  /**
   * Parse JSON from Gemini response
   * Throws error if response is not valid JSON
   */
  static parseJSON<T = unknown>(response: GeminiResponse): T {
    const text = this.extractText(response);

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new GeminiApiError(
        'Failed to parse Gemini response as JSON',
        undefined,
        'parse_error',
        { text: text.substring(0, 500), error }
      );
    }
  }
}
