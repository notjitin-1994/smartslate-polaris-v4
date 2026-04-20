/**
 * Tests for Gemini API Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GeminiClient, GeminiApiError, type GeminiResponse } from '@/lib/claude/client';

// Mock fetch globally
global.fetch = vi.fn();

describe('GeminiClient', () => {
  let client: GeminiClient;

  beforeEach(() => {
    // Set up environment
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';

    // Create fresh client
    client = new GeminiClient();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    const mockRequest = {
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user' as const, content: 'Hello!' }],
    };

    const mockResponse: GeminiResponse = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello! How can I help?' }],
      model: 'gemini-3.1-pro-preview',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    };

    it('should successfully generate response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await client.generate(mockRequest);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should include correct headers in request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate(mockRequest);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['x-api-key']).toBe('test-api-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should include correct body in request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate(mockRequest);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('gemini-3.1-pro-preview');
      expect(body.max_tokens).toBe(16000);
      expect(body.temperature).toBe(0.2);
      expect(body.system).toBe(mockRequest.system);
      expect(body.messages).toEqual(mockRequest.messages);
    });

    it('should use custom model if provided', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        ...mockRequest,
        model: 'gemini-3.1-pro-preview-20250514',
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('gemini-3.1-pro-preview-20250514');
    });

    it('should use custom max_tokens if provided', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        ...mockRequest,
        max_tokens: 8000,
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.max_tokens).toBe(8000);
    });

    it('should use custom temperature if provided', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        ...mockRequest,
        temperature: 0.5,
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.temperature).toBe(0.5);
    });

    it('should retry on failure', async () => {
      // Fail first two attempts, succeed on third
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const response = await client.generate(mockRequest);

      expect(response).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      // Fail all attempts
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await expect(client.generate(mockRequest)).rejects.toThrow('Network error');

      // Should try 3 times total (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout', async () => {
      // Create client with very short timeout
      const shortTimeoutClient = new GeminiClient({ timeout: 10 });

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AbortError')), 100);
          })
      );

      await expect(shortTimeoutClient.generate(mockRequest)).rejects.toThrow();
    });

    it('should handle HTTP error responses', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          type: 'error',
          error: {
            type: 'rate_limit_error',
            message: 'Rate limit exceeded',
          },
        }),
      };

      // Mock all retry attempts with same error
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockErrorResponse);

      try {
        await client.generate(mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Rate limit exceeded');
      }
    });

    it('should handle HTTP error without JSON body', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      };

      // Mock all retry attempts with same error
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockErrorResponse);

      try {
        await client.generate(mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('HTTP 500');
      }
    });
  });

  describe('extractText', () => {
    it('should extract text from single content block', () => {
      const response: GeminiResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello world' }],
        model: 'gemini-3.1-pro-preview',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      const text = GeminiClient.extractText(response);
      expect(text).toBe('Hello world');
    });

    it('should extract text from multiple content blocks', () => {
      const response: GeminiResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'text', text: 'First block' },
          { type: 'text', text: 'Second block' },
        ],
        model: 'gemini-3.1-pro-preview',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      const text = GeminiClient.extractText(response);
      expect(text).toBe('First block\nSecond block');
    });

    it('should handle empty content', () => {
      const response: GeminiResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'gemini-3.1-pro-preview',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      };

      const text = GeminiClient.extractText(response);
      expect(text).toBe('');
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON response', () => {
      const response: GeminiResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '{"key": "value"}' }],
        model: 'gemini-3.1-pro-preview',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      const parsed = GeminiClient.parseJSON(response);
      expect(parsed).toEqual({ key: 'value' });
    });

    it('should throw error for invalid JSON', () => {
      const response: GeminiResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Not JSON' }],
        model: 'gemini-3.1-pro-preview',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      expect(() => GeminiClient.parseJSON(response)).toThrow(
        'Failed to parse Gemini response as JSON'
      );
    });

    it('should parse complex JSON structures', () => {
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          object: { a: 'b' },
        },
      };

      const response: GeminiResponse = {
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: JSON.stringify(complexObject) }],
        model: 'gemini-3.1-pro-preview',
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      };

      const parsed = GeminiClient.parseJSON(response);
      expect(parsed).toEqual(complexObject);
    });
  });

  describe('GeminiApiError', () => {
    it('should create error with message', () => {
      const error = new GeminiApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('GeminiApiError');
    });

    it('should include status code', () => {
      const error = new GeminiApiError('Test error', 429);
      expect(error.statusCode).toBe(429);
    });

    it('should include error type', () => {
      const error = new GeminiApiError('Test error', 429, 'rate_limit_error');
      expect(error.errorType).toBe('rate_limit_error');
    });

    it('should include original error', () => {
      const original = new Error('Original');
      const error = new GeminiApiError('Test error', undefined, undefined, original);
      expect(error.originalError).toBe(original);
    });
  });
});
