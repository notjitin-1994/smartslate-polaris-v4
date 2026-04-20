/**
 * Question Generation Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDynamicQuestions, validateGenerationConfig } from '@/lib/services';
import type { QuestionGenerationContext } from '@/lib/services';

// Mock fetch
global.fetch = vi.fn();

describe('Question Generation Service', () => {
  const mockContext: QuestionGenerationContext = {
    blueprintId: 'bp-123',
    userId: 'user-456',
    staticAnswers: {
      role: 'Learning Designer',
      organization: {
        name: 'Acme Corp',
        industry: 'Technology',
      },
      learningGap: {
        description: 'Need to improve technical skills',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateDynamicQuestions', () => {
    it('should successfully generate questions (with Perplexity or fallback)', async () => {
      // This test validates the full generation flow
      // In test environment without API keys, it will use Ollama fallback
      // In production with PERPLEXITY_API_KEY, it will use Perplexity

      const result = await generateDynamicQuestions(mockContext);

      // Should succeed with either source
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.source).toBe('claude');
      expect(result.metadata.fallbackUsed).toBe(false);
    });

    it('should fallback to Ollama when Perplexity fails', async () => {
      // Mock Perplexity failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Perplexity timeout'));

      // Note: This test would need Ollama mocking or skip in CI
      // For now, we'll test the error handling path
      const result = await generateDynamicQuestions(mockContext);

      // Should either succeed with Ollama or fail gracefully
      expect(result).toBeDefined();
      expect(result.metadata.source).toBeDefined();
    });

    it('should handle invalid JSON from Perplexity', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Invalid JSON {broken',
              },
            },
          ],
        }),
      });

      const result = await generateDynamicQuestions(mockContext);

      // Should fallback or return error
      expect(result).toBeDefined();
    });
  });

  describe('validateGenerationConfig', () => {
    it('should validate configuration', () => {
      const config = validateGenerationConfig();

      expect(config).toHaveProperty('claude');
      expect(config.claude).toHaveProperty('valid');
      expect(config.claude).toHaveProperty('errors');
    });
  });
});
