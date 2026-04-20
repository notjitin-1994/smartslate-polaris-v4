/**
 * Comprehensive Tests for TrackedClaudeClient with Cache Token Support
 *
 * Tests that TrackedClaudeClient correctly captures and logs cache tokens
 * from Claude API responses for accurate cost tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TrackedClaudeClient } from '@/lib/claude/clientWithCostTracking';
import { ClaudeClient } from '@/lib/claude/client';
import { costTrackingService } from '@/lib/services/costTrackingService';
import type { ClaudeResponse } from '@/lib/claude/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the cost tracking service
vi.mock('@/lib/services/costTrackingService', () => ({
  costTrackingService: {
    logApiUsage: vi.fn(),
  },
}));

// Mock the base ClaudeClient
vi.mock('@/lib/claude/client', () => {
  const actual = vi.importActual('@/lib/claude/client');
  return {
    ...actual,
    ClaudeClient: class MockClaudeClient {
      async generate() {
        throw new Error('Should be mocked');
      }
    },
  };
});

describe('TrackedClaudeClient', () => {
  let client: TrackedClaudeClient;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {} as SupabaseClient;
    client = new TrackedClaudeClient(undefined, mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockResponse = (options: {
    inputTokens?: number;
    outputTokens?: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  }): ClaudeResponse => ({
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Test response',
      },
    ],
    model: 'claude-sonnet-4-5-20250929',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: options.inputTokens ?? 5000,
      output_tokens: options.outputTokens ?? 2000,
      cache_creation_input_tokens: options.cacheCreationTokens,
      cache_read_input_tokens: options.cacheReadTokens,
    },
  });

  describe('generate - Basic Token Tracking', () => {
    it('should call base generate when no userId provided', async () => {
      const mockResponse = createMockResponse({});
      const generateSpy = vi
        .spyOn(ClaudeClient.prototype, 'generate')
        .mockResolvedValue(mockResponse);

      const result = await client.generate({
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(generateSpy).toHaveBeenCalled();
      expect(costTrackingService.logApiUsage).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should track API usage when userId is provided', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 5000,
        outputTokens: 2000,
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          provider: 'anthropic',
          endpoint: 'generate-blueprint',
          inputTokens: 5000,
          outputTokens: 2000,
          status: 'success',
        }),
        mockSupabase
      );
    });

    it('should include blueprintId when provided', async () => {
      const mockResponse = createMockResponse({});

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        blueprintId: 'blueprint-456',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          blueprintId: 'blueprint-456',
        }),
        mockSupabase
      );
    });
  });

  describe('generate - Cache Token Tracking', () => {
    it('should capture cache creation tokens from API response', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 5000,
        outputTokens: 2000,
        cacheCreationTokens: 3000,
        cacheReadTokens: 0,
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          inputTokens: 5000,
          outputTokens: 2000,
          cacheCreationTokens: 3000,
          cacheReadTokens: 0,
        }),
        mockSupabase
      );
    });

    it('should capture cache read tokens from API response', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 2000,
        outputTokens: 1500,
        cacheCreationTokens: 0,
        cacheReadTokens: 4500,
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          inputTokens: 2000,
          outputTokens: 1500,
          cacheCreationTokens: 0,
          cacheReadTokens: 4500,
        }),
        mockSupabase
      );
    });

    it('should capture both cache creation and read tokens', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 2000,
        outputTokens: 1500,
        cacheCreationTokens: 3000,
        cacheReadTokens: 4500,
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          inputTokens: 2000,
          outputTokens: 1500,
          cacheCreationTokens: 3000,
          cacheReadTokens: 4500,
        }),
        mockSupabase
      );
    });

    it('should default cache tokens to 0 when not present in response', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 5000,
        outputTokens: 2000,
        // No cache tokens in response
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
        }),
        mockSupabase
      );
    });

    it('should include cache tokens in response metadata', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 5000,
        outputTokens: 2000,
        cacheCreationTokens: 3000,
        cacheReadTokens: 4500,
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          responseMetadata: expect.objectContaining({
            cacheCreationTokens: 3000,
            cacheReadTokens: 4500,
          }),
        }),
        mockSupabase
      );
    });
  });

  describe('generate - Error Handling', () => {
    it('should track error with cache tokens when request fails', async () => {
      const mockError = new Error('API timeout');

      vi.spyOn(ClaudeClient.prototype, 'generate').mockRejectedValue(mockError);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await expect(
        client.generate({
          userId: 'user-123',
          endpoint: 'generate-blueprint',
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow('API timeout');

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          status: 'error',
          errorMessage: 'API timeout',
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
        }),
        mockSupabase
      );
    });

    it('should classify timeout errors correctly', async () => {
      const mockError = new Error('Request timeout after 30000ms');

      vi.spyOn(ClaudeClient.prototype, 'generate').mockRejectedValue(mockError);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await expect(
        client.generate({
          userId: 'user-123',
          endpoint: 'generate-blueprint',
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow();

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'timeout',
        }),
        mockSupabase
      );
    });

    it('should classify rate limit errors correctly', async () => {
      const mockError = new Error('HTTP 429: Rate limit exceeded');

      vi.spyOn(ClaudeClient.prototype, 'generate').mockRejectedValue(mockError);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await expect(
        client.generate({
          userId: 'user-123',
          endpoint: 'generate-blueprint',
          system: 'You are a helpful assistant',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow();

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rate_limited',
        }),
        mockSupabase
      );
    });

    it('should not fail API call if cost tracking fails', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 5000,
        outputTokens: 2000,
        cacheCreationTokens: 3000,
        cacheReadTokens: 4500,
      });

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockRejectedValue(new Error('Database error'));

      const result = await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result).toEqual(mockResponse);
      expect(costTrackingService.logApiUsage).toHaveBeenCalled();
    });
  });

  describe('generate - Request Metadata', () => {
    it('should include request metadata in cost tracking', async () => {
      const mockResponse = createMockResponse({});

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        temperature: 0.7,
        system: 'You are a helpful assistant',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          requestMetadata: {
            model: 'claude-sonnet-4-5',
            maxTokens: 8000,
            temperature: 0.7,
            messageCount: 3,
          },
        }),
        mockSupabase
      );
    });

    it('should include response metadata in cost tracking', async () => {
      const mockResponse = createMockResponse({
        inputTokens: 5000,
        outputTokens: 2000,
        cacheCreationTokens: 3000,
        cacheReadTokens: 4500,
      });
      mockResponse.stop_reason = 'max_tokens';
      mockResponse.stop_sequence = '\n\n';

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          responseMetadata: {
            model: 'claude-sonnet-4-5-20250929',
            stopReason: 'max_tokens',
            stopSequence: '\n\n',
            cacheCreationTokens: 3000,
            cacheReadTokens: 4500,
          },
        }),
        mockSupabase
      );
    });

    it('should track request duration', async () => {
      const mockResponse = createMockResponse({});

      vi.spyOn(ClaudeClient.prototype, 'generate').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return mockResponse;
      });
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMs: expect.any(Number),
        }),
        mockSupabase
      );

      const call = vi.mocked(costTrackingService.logApiUsage).mock.calls[0][0];
      expect(call.durationMs).toBeGreaterThanOrEqual(100);
    });
  });

  describe('generate - Model ID Tracking', () => {
    it('should use correct model ID for tracking Sonnet 4.5 standard', async () => {
      const mockResponse = createMockResponse({});
      mockResponse.model = 'claude-sonnet-4-5-20250929';

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: 'Short prompt',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'claude-sonnet-4-5-20250929',
        }),
        mockSupabase
      );
    });

    it('should use large model ID for Sonnet 4.5 with large prompts', async () => {
      const mockResponse = createMockResponse({});
      mockResponse.model = 'claude-sonnet-4-5-20250929';

      vi.spyOn(ClaudeClient.prototype, 'generate').mockResolvedValue(mockResponse);
      vi.mocked(costTrackingService.logApiUsage).mockResolvedValue('log-123');

      // Create a very long prompt (> 200K tokens)
      const longContent = 'a'.repeat(1000000);

      await client.generate({
        userId: 'user-123',
        endpoint: 'generate-blueprint',
        system: longContent,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(costTrackingService.logApiUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'claude-sonnet-4-5-20250929-large',
        }),
        mockSupabase
      );
    });
  });
});
