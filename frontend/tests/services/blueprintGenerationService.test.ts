/**
 * Tests for Blueprint Generation Orchestrator Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintGenerationService } from '@/lib/services/blueprintGenerationService';
import { GeminiClient, GeminiApiError } from '@/lib/claude/client';
import type { BlueprintContext } from '@/lib/claude/prompts';

// Mock Gemini client
vi.mock('@/lib/claude/client', () => {
  return {
    GeminiClient: vi.fn().mockImplementation(() => ({
      generate: vi.fn(),
    })),
    GeminiApiError: class GeminiApiError extends Error {
      constructor(
        message: string,
        public statusCode?: number,
        public errorType?: string
      ) {
        super(message);
        this.name = 'GeminiApiError';
      }
    },
  };
});

// Mock config
vi.mock('@/lib/claude/config', () => {
  return {
    getGeminiConfig: vi.fn(() => ({
      primaryModel: 'gemini-3.1-pro-preview',
      fallbackModel: 'gemini-3.1-pro-preview',
      apiKey: 'test-key',
      baseUrl: 'https://api.anthropic.com',
      version: '2023-06-01',
      maxTokens: 12000,
      temperature: 0.2,
      timeout: 120000,
      retries: 2,
    })),
  };
});

// Mock validation
vi.mock('@/lib/claude/validation', () => {
  class ValidationError extends Error {
    constructor(
      message: string,
      public code: string
    ) {
      super(message);
      this.name = 'ValidationError';
    }
  }

  return {
    validateAndNormalizeBlueprint: vi.fn((text: string) => {
      const parsed = JSON.parse(text);
      return { ...parsed, normalized: true };
    }),
    ValidationError,
  };
});

// Mock logging
vi.mock('@/lib/logging', () => {
  return {
    createServiceLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  };
});

describe('BlueprintGenerationService', () => {
  let service: BlueprintGenerationService;

  const mockContext: BlueprintContext = {
    blueprintId: 'bp-123',
    userId: 'user-456',
    organization: 'Acme Corp',
    role: 'Training Manager',
    industry: 'Technology',
    staticAnswers: { company_size: '100-500' },
    dynamicAnswers: { budget: '$50k' },
    learningObjectives: ['Improve skills'],
  };

  const mockGeminiResponse = {
    id: 'msg_123',
    type: 'message' as const,
    role: 'assistant' as const,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          metadata: {
            title: 'Test Blueprint',
            organization: 'Acme',
            role: 'Manager',
            generated_at: '2025-10-01T12:00:00Z',
          },
          executive_summary: {
            content: 'Summary',
            displayType: 'markdown',
          },
        }),
      },
    ],
    model: 'gemini-3.1-pro-preview',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 100,
      output_tokens: 500,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BlueprintGenerationService();

    // Setup GeminiClient.extractText mock
    GeminiClient.extractText = vi.fn().mockReturnValue(mockGeminiResponse.content[0].text);
  });

  describe('generate', () => {
    it('should generate blueprint with Gemini 3.1 Pro (primary)', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(mockGeminiResponse);
      (service as any).claudeClient.generate = mockGenerate;

      const result = await service.generate(mockContext);

      expect(result.success).toBe(true);
      expect(result.blueprint.normalized).toBe(true);
      expect(result.metadata.model).toBe('gemini-3.1-pro-preview');
      expect(result.metadata.fallbackUsed).toBe(false);
      expect(result.metadata.attempts).toBe(1);
      expect(result.usage).toEqual({
        input_tokens: 100,
        output_tokens: 500,
      });
    });

    it('should call Gemini 3.1 Pro with correct parameters', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(mockGeminiResponse);
      (service as any).claudeClient.generate = mockGenerate;

      await service.generate(mockContext);

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.1-pro-preview',
          max_tokens: 12000,
          temperature: 0.2,
          system: expect.stringContaining('Learning Experience Designer'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Acme Corp'),
            }),
          ]),
        })
      );
    });

    it('should fallback to Gemini 3.1 Pro on Sonnet 4 failure', async () => {
      const mockGenerate = vi
        .fn()
        .mockRejectedValueOnce(new GeminiApiError('Timeout', 408, 'timeout'))
        .mockResolvedValueOnce({
          ...mockGeminiResponse,
          model: 'gemini-3.1-pro-preview',
        });

      (service as any).claudeClient.generate = mockGenerate;
      GeminiClient.extractText = vi.fn().mockReturnValue(mockGeminiResponse.content[0].text);

      const result = await service.generate(mockContext);

      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('gemini-3.1-pro-preview');
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(result.metadata.attempts).toBe(2);
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });

    it('should call Gemini 3.1 Pro with higher max_tokens', async () => {
      const mockGenerate = vi
        .fn()
        .mockRejectedValueOnce(new GeminiApiError('Error', 500))
        .mockResolvedValueOnce(mockGeminiResponse);

      (service as any).claudeClient.generate = mockGenerate;
      GeminiClient.extractText = vi.fn().mockReturnValue(mockGeminiResponse.content[0].text);

      await service.generate(mockContext);

      // Second call should be Opus 4 with 16000 tokens
      expect(mockGenerate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          model: 'gemini-3.1-pro-preview',
          max_tokens: 16000,
        })
      );
    });

    it('should fallback to Sonnet 4 when Sonnet 4.5 fails', async () => {
      const mockGeminiGenerate = vi
        .fn()
        .mockRejectedValueOnce(new GeminiApiError('Sonnet 4.5 error', 500))
        .mockResolvedValueOnce({
          ...mockGeminiResponse,
          usage: { input_tokens: 1000, output_tokens: 2000 },
        });

      (service as any).claudeClient.generate = mockGeminiGenerate;

      const result = await service.generate(mockContext);

      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('gemini-3.1-pro-preview');
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(result.metadata.attempts).toBe(2);

      expect(mockGeminiGenerate).toHaveBeenCalledTimes(2);
      expect(mockGeminiGenerate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          model: 'gemini-3.1-pro-preview',
        })
      );
      expect(mockGeminiGenerate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          model: 'gemini-3.1-pro-preview',
        })
      );
    });

    it('should return error when all Gemini models fail', async () => {
      const mockGeminiGenerate = vi
        .fn()
        .mockRejectedValueOnce(new GeminiApiError('Sonnet 4.5 error', 500))
        .mockRejectedValueOnce(new GeminiApiError('Sonnet 4 error', 500));

      (service as any).claudeClient.generate = mockGeminiGenerate;

      const result = await service.generate(mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('All Gemini generation methods failed');
      expect(result.metadata.attempts).toBe(2);
    });

    it('should not fallback if error does not warrant it', async () => {
      // Structural validation error - doesn't warrant fallback
      const mockGenerate = vi.fn().mockRejectedValue(new Error('Structural validation error'));

      (service as any).claudeClient.generate = mockGenerate;

      // Mock shouldFallbackToOpus to return false
      vi.doMock('@/lib/claude/fallback', () => ({
        shouldFallbackToOpus: () => ({ shouldFallback: false, originalError: new Error('test') }),
        logFallbackDecision: vi.fn(),
      }));

      const result = await service.generate(mockContext);

      expect(result.success).toBe(false);
      expect(mockGenerate).toHaveBeenCalledTimes(1); // Only called once, no fallback
    });

    it('should reuse same prompts for all models', async () => {
      const mockGeminiGenerate = vi
        .fn()
        .mockRejectedValueOnce(new GeminiApiError('Sonnet error', 500))
        .mockResolvedValueOnce(mockGeminiResponse);

      (service as any).claudeClient.generate = mockGeminiGenerate;
      GeminiClient.extractText = vi.fn().mockReturnValue(mockGeminiResponse.content[0].text);

      await service.generate(mockContext);

      // Both calls should have same system prompt
      const call1 = mockGeminiGenerate.mock.calls[0][0];
      const call2 = mockGeminiGenerate.mock.calls[1][0];

      expect(call1.system).toBe(call2.system);
      expect(call1.messages[0].content).toBe(call2.messages[0].content);
    });

    it('should include duration in metadata', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(mockGeminiResponse);
      (service as any).claudeClient.generate = mockGenerate;
      GeminiClient.extractText = vi.fn().mockReturnValue(mockGeminiResponse.content[0].text);

      const result = await service.generate(mockContext);

      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.duration).toBe('number');
    });

    it('should include timestamp in metadata', async () => {
      const mockGenerate = vi.fn().mockResolvedValue(mockGeminiResponse);
      (service as any).claudeClient.generate = mockGenerate;
      GeminiClient.extractText = vi.fn().mockReturnValue(mockGeminiResponse.content[0].text);

      const beforeTime = new Date().toISOString();
      const result = await service.generate(mockContext);
      const afterTime = new Date().toISOString();

      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.timestamp >= beforeTime).toBe(true);
      expect(result.metadata.timestamp <= afterTime).toBe(true);
    });
  });
});
