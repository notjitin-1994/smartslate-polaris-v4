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
   * Implements timeout, retry logic, and comprehensive error handling
   */
  async generate(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();

    logger.info('claude.client.request', {
      model: request.model || this.config.primaryModel,
      maxTokens: request.max_tokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
    });

    try {
      const response = await withRetry(() => this.makeRequest(request), this.config.retries);

      const duration = Date.now() - startTime;

      logger.info('claude.client.success', {
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('claude.client.error', {
        duration,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  /**
   * Make a single request to Gemini API
   * Implements timeout and error handling
   */
  private async makeRequest(request: GeminiRequest): Promise<GeminiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.config.version,
        },
        body: JSON.stringify({
          model: request.model || this.config.primaryModel,
          max_tokens: request.max_tokens || this.config.maxTokens,
          temperature: request.temperature ?? this.config.temperature,
          system: request.system,
          messages: request.messages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as GeminiErrorResponse | null;

        throw new GeminiApiError(
          errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.error?.type,
          errorData
        );
      }

      const data = (await response.json()) as GeminiResponse;
      return data;
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
