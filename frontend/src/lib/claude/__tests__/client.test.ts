/**
 * Comprehensive Test Suite for Claude API Client
 *
 * CRITICAL: This is the most important dependency in the system
 * Tests cover: retry logic, token management, timeouts, error handling, response parsing
 *
 * @see frontend/lib/claude/client.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeClient, ClaudeApiError, type ClaudeResponse } from '../client';
import type { ClaudeConfig } from '../config';

// Mock the config module
vi.mock('../config', () => ({
  getClaudeConfig: vi.fn(() => ({
    apiKey: 'test-api-key',
    baseUrl: 'https://api.anthropic.com',
    version: '2023-06-01',
    primaryModel: 'claude-sonnet-4-20250514',
    fallbackModel: 'claude-sonnet-4-20240620',
    maxTokens: 8000,
    temperature: 0.7,
    timeout: 30000,
    retries: 3,
  })),
}));

// Mock the logger
vi.mock('@/lib/logging', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('ClaudeClient', () => {
  let client: ClaudeClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Create a fresh client for each test
    client = new ClaudeClient();

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Helper to create a valid Claude response
  const createMockResponse = (overrides?: Partial<ClaudeResponse>): ClaudeResponse => ({
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'This is a test response',
      },
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 50,
    },
    ...overrides,
  });

  describe('Constructor', () => {
    it('should create client with default config', () => {
      const client = new ClaudeClient();
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(ClaudeClient);
    });

    it('should create client with custom config', () => {
      const customConfig: Partial<ClaudeConfig> = {
        apiKey: 'custom-key',
        maxTokens: 4000,
        temperature: 0.5,
      };

      const client = new ClaudeClient(customConfig);
      expect(client).toBeDefined();
    });
  });

  describe('generate() - Success Scenarios', () => {
    it('should successfully generate response with default model', async () => {
      const mockResponse = createMockResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should use custom model when specified', async () => {
      const mockResponse = createMockResponse({ model: 'claude-opus-4-20250514' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        model: 'claude-opus-4-20250514',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('claude-opus-4-20250514');
    });

    it('should use custom temperature when specified', async () => {
      const mockResponse = createMockResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.3,
      });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.temperature).toBe(0.3);
    });

    it('should use custom max_tokens when specified', async () => {
      const mockResponse = createMockResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 4000,
      });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.max_tokens).toBe(4000);
    });

    it('should handle prompt caching tokens', async () => {
      const mockResponse = createMockResponse({
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 20,
          cache_read_input_tokens: 30,
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.usage.cache_creation_input_tokens).toBe(20);
      expect(result.usage.cache_read_input_tokens).toBe(30);
    });
  });

  describe('generate() - Token Truncation Detection & Retry', () => {
    it('should detect max_tokens truncation', async () => {
      const truncatedResponse = createMockResponse({
        stop_reason: 'max_tokens',
        usage: { input_tokens: 100, output_tokens: 8000 },
      });

      const completeResponse = createMockResponse({
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 10000 },
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => truncatedResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => completeResponse });

      const result = await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Generate a long response' }],
        max_tokens: 8000,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.stop_reason).toBe('end_turn');

      // Second call should have 1.5x tokens (8000 * 1.5 = 12000)
      const secondCall = mockFetch.mock.calls[1];
      const secondBody = JSON.parse(secondCall[1].body);
      expect(secondBody.max_tokens).toBe(12000);
    });

    it('should retry up to 3 times with increasing token limits', async () => {
      const truncatedResponse = createMockResponse({
        stop_reason: 'max_tokens',
        usage: { input_tokens: 100, output_tokens: 8000 },
      });

      mockFetch.mockResolvedValue({ ok: true, json: async () => truncatedResponse });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Generate a very long response' }],
          max_tokens: 8000,
        })
      ).rejects.toThrow('Response was truncated at max_tokens');

      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify increasing token limits: 8000 -> 12000 -> 18000
      const calls = mockFetch.mock.calls;
      expect(JSON.parse(calls[0][1].body).max_tokens).toBe(8000);
      expect(JSON.parse(calls[1][1].body).max_tokens).toBe(12000);
      expect(JSON.parse(calls[2][1].body).max_tokens).toBe(18000);
    });

    it('should not exceed 20k token limit', async () => {
      const truncatedResponse = createMockResponse({
        stop_reason: 'max_tokens',
        usage: { input_tokens: 100, output_tokens: 18000 },
      });

      mockFetch.mockResolvedValue({ ok: true, json: async () => truncatedResponse });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Generate a very long response' }],
          max_tokens: 18000,
        })
      ).rejects.toThrow('Response was truncated at max_tokens (20000)');

      // Should only try once more (18000 * 1.5 = 27000 > 20000, capped at 20000)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should succeed if complete response received after truncation retry', async () => {
      const truncatedResponse = createMockResponse({
        stop_reason: 'max_tokens',
        usage: { input_tokens: 100, output_tokens: 8000 },
      });

      const completeResponse = createMockResponse({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Complete long response here' }],
        usage: { input_tokens: 100, output_tokens: 11000 },
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => truncatedResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => completeResponse });

      const result = await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Generate a long response' }],
        max_tokens: 8000,
      });

      expect(result.stop_reason).toBe('end_turn');
      expect(result.content[0].text).toBe('Complete long response here');
    });
  });

  describe('generate() - Retry Logic with Exponential Backoff', () => {
    it('should retry on network failure with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockResponse(),
        });

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Fast-forward through retries
      // First retry: 1000ms delay
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry: 2000ms delay (exponential backoff)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays (1s, 2s, 4s)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Track delay timings
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      vi.spyOn(global, 'setTimeout').mockImplementation(((cb: any, delay: number) => {
        if (delay >= 1000) {
          delays.push(delay);
        }
        return originalSetTimeout(cb, 0) as any;
      }) as any);

      try {
        await promise;
      } catch (error) {
        // Expected to fail after retries
      }

      expect(delays).toHaveLength(3);
      expect(delays[0]).toBe(1000); // 2^0 * 1000
      expect(delays[1]).toBe(2000); // 2^1 * 1000
      expect(delays[2]).toBe(4000); // 2^2 * 1000
    });

    it('should throw error after max retries exceeded', async () => {
      const networkError = new Error('Persistent network failure');
      mockFetch.mockRejectedValue(networkError);

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow(ClaudeApiError);

      // 1 initial attempt + 3 retries = 4 total
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should NOT retry on authentication errors (401)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          type: 'error',
          error: { type: 'authentication_error', message: 'Invalid API key' },
        }),
      });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Invalid API key');

      // Should fail immediately, no retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should NOT retry on bad request errors (400)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          type: 'error',
          error: { type: 'invalid_request_error', message: 'Invalid parameters' },
        }),
      });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('Invalid parameters');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on rate limit errors (429)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({
            type: 'error',
            error: { type: 'rate_limit_error', message: 'Rate limit exceeded' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockResponse(),
        });

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on server errors (500)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({
            type: 'error',
            error: { type: 'api_error', message: 'Internal server error' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockResponse(),
        });

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('generate() - Timeout Handling', () => {
    it('should timeout after configured duration', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            // Never resolve (simulate hanging request)
            setTimeout(() => resolve({ ok: true, json: async () => createMockResponse() }), 60000);
          })
      );

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Fast-forward past timeout (30s)
      await vi.advanceTimersByTimeAsync(30000);

      await expect(promise).rejects.toThrow('Request timeout after 30000ms');
    });

    it('should abort request using AbortController on timeout', async () => {
      let abortSignal: AbortSignal | undefined;

      mockFetch.mockImplementation((url, options: any) => {
        abortSignal = options.signal;
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => createMockResponse() }), 60000);
        });
      });

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      await vi.advanceTimersByTimeAsync(30000);

      try {
        await promise;
      } catch (error) {
        // Expected to timeout
      }

      expect(abortSignal).toBeDefined();
      expect(abortSignal!.aborted).toBe(true);
    });

    it('should throw ClaudeApiError with 408 status on timeout', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            }, 0);
          })
      );

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow(
        expect.objectContaining({
          statusCode: 408,
          errorType: 'timeout',
        })
      );
    });

    it('should clear timeout on successful response', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => createMockResponse(),
      });

      await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear timeout on error response', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          type: 'error',
          error: { type: 'invalid_request_error', message: 'Bad request' },
        }),
      });

      try {
        await client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } catch (error) {
        // Expected to fail
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('generate() - Error Handling', () => {
    it('should wrap network errors in ClaudeApiError', async () => {
      const networkError = new Error('Failed to fetch');
      mockFetch.mockRejectedValue(networkError);

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow(ClaudeApiError);

      try {
        await client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ClaudeApiError);
        expect((error as ClaudeApiError).errorType).toBe('network_error');
        expect((error as ClaudeApiError).originalError).toBe(networkError);
      }
    });

    it('should classify error types correctly', async () => {
      const errorTests = [
        { status: 408, expectedType: 'timeout' },
        { status: 429, expectedType: 'rate_limit_error' },
        { status: 500, expectedType: 'api_error' },
        { status: 503, expectedType: 'service_unavailable' },
      ];

      for (const { status, expectedType } of errorTests) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          statusText: 'Error',
          json: async () => ({
            type: 'error',
            error: { type: expectedType, message: 'Error message' },
          }),
        });

        try {
          await client.generate({
            system: 'You are a helpful assistant',
            messages: [{ role: 'user', content: 'Hello' }],
          });
        } catch (error) {
          expect((error as ClaudeApiError).errorType).toBe(expectedType);
          expect((error as ClaudeApiError).statusCode).toBe(status);
        }
      }
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow();
    });

    it('should handle error responses without JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('No JSON body');
        },
      });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should preserve error messages from Claude API', async () => {
      const errorMessage = 'Custom error from Claude';
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          type: 'error',
          error: { type: 'invalid_request_error', message: errorMessage },
        }),
      });

      await expect(
        client.generate({
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('extractText()', () => {
    it('should extract text from single content block', () => {
      const response = createMockResponse({
        content: [{ type: 'text', text: 'Hello world' }],
      });

      const text = ClaudeClient.extractText(response);
      expect(text).toBe('Hello world');
    });

    it('should extract text from multiple content blocks', () => {
      const response = createMockResponse({
        content: [
          { type: 'text', text: 'First block' },
          { type: 'text', text: 'Second block' },
          { type: 'text', text: 'Third block' },
        ],
      });

      const text = ClaudeClient.extractText(response);
      expect(text).toBe('First block\nSecond block\nThird block');
    });

    it('should filter out non-text content blocks', () => {
      const response = createMockResponse({
        content: [
          { type: 'text', text: 'Text content' },
          { type: 'image' as any, data: 'image data' },
          { type: 'text', text: 'More text' },
        ],
      });

      const text = ClaudeClient.extractText(response);
      expect(text).toBe('Text content\nMore text');
    });

    it('should handle empty content array', () => {
      const response = createMockResponse({
        content: [],
      });

      const text = ClaudeClient.extractText(response);
      expect(text).toBe('');
    });
  });

  describe('parseJSON()', () => {
    it('should parse valid JSON from response', () => {
      const jsonData = { key: 'value', nested: { data: [1, 2, 3] } };
      const response = createMockResponse({
        content: [{ type: 'text', text: JSON.stringify(jsonData) }],
      });

      const parsed = ClaudeClient.parseJSON(response);
      expect(parsed).toEqual(jsonData);
    });

    it('should parse JSON with type safety', () => {
      interface TestData {
        name: string;
        count: number;
      }

      const jsonData: TestData = { name: 'test', count: 42 };
      const response = createMockResponse({
        content: [{ type: 'text', text: JSON.stringify(jsonData) }],
      });

      const parsed = ClaudeClient.parseJSON<TestData>(response);
      expect(parsed.name).toBe('test');
      expect(parsed.count).toBe(42);
    });

    it('should throw ClaudeApiError on invalid JSON', () => {
      const response = createMockResponse({
        content: [{ type: 'text', text: 'This is not JSON' }],
      });

      expect(() => ClaudeClient.parseJSON(response)).toThrow(ClaudeApiError);

      try {
        ClaudeClient.parseJSON(response);
      } catch (error) {
        expect(error).toBeInstanceOf(ClaudeApiError);
        expect((error as ClaudeApiError).errorType).toBe('parse_error');
        expect((error as ClaudeApiError).message).toContain(
          'Failed to parse Claude response as JSON'
        );
      }
    });

    it('should include truncated text in parse error', () => {
      const longText = 'Not JSON '.repeat(100);
      const response = createMockResponse({
        content: [{ type: 'text', text: longText }],
      });

      try {
        ClaudeClient.parseJSON(response);
      } catch (error) {
        const apiError = error as ClaudeApiError;
        expect(apiError.originalError).toHaveProperty('text');
        expect((apiError.originalError as any).text).toHaveLength(500); // Truncated to 500 chars
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete generation workflow', async () => {
      const mockResponse = createMockResponse({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: 'Test Blueprint',
              sections: [{ title: 'Introduction', content: 'Welcome' }],
            }),
          },
        ],
        usage: {
          input_tokens: 250,
          output_tokens: 1500,
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generate({
        model: 'claude-sonnet-4-20250514',
        system: 'Generate a learning blueprint',
        messages: [
          {
            role: 'user',
            content: 'Create a blueprint for learning TypeScript',
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      expect(result).toBeDefined();
      expect(result.usage.input_tokens).toBe(250);
      expect(result.usage.output_tokens).toBe(1500);

      const text = ClaudeClient.extractText(result);
      const data = JSON.parse(text);
      expect(data.title).toBe('Test Blueprint');
      expect(data.sections).toHaveLength(1);
    });

    it('should handle retry and eventual success', async () => {
      const mockResponse = createMockResponse();

      mockFetch.mockRejectedValueOnce(new Error('Network hiccup')).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const promise = client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle truncation and retry with success', async () => {
      const truncatedResponse = createMockResponse({
        stop_reason: 'max_tokens',
        content: [{ type: 'text', text: 'Partial response...' }],
        usage: { input_tokens: 100, output_tokens: 4000 },
      });

      const completeResponse = createMockResponse({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Complete response with all details...' }],
        usage: { input_tokens: 100, output_tokens: 5500 },
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => truncatedResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => completeResponse });

      const result = await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Generate detailed explanation' }],
        max_tokens: 4000,
      });

      expect(result.stop_reason).toBe('end_turn');
      expect(ClaudeClient.extractText(result)).toContain('Complete response');
    });
  });
});
