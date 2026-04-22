/**
 * Comprehensive Test Suite: Question Generation Service
 *
 * Tests the orchestration service for dynamic question generation:
 * - Claude API integration
 * - Configuration validation
 * - Error handling and fallback logic
 * - Performance tracking
 * - Logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateDynamicQuestions,
  validateGenerationConfig,
  type GenerationResult,
} from '../questionGenerationService';

// Mock dependencies
vi.mock('@/lib/logging', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  return {
    createServiceLogger: vi.fn(() => mockLogger),
  };
});

// Mock the claudeQuestionService module (which may not exist yet but is imported by questionGenerationService)
vi.mock('../claudeQuestionService', () => ({
  generateWithClaude: vi.fn(),
  validateClaudeConfig: vi.fn(),
  // Export types for TypeScript
}));

// Also mock it as a relative path from services directory
vi.mock('../../lib/services/claudeQuestionService', () => ({
  generateWithClaude: vi.fn(),
  validateClaudeConfig: vi.fn(),
}));

describe('Question Generation Service', () => {
  let mockGenerateWithClaude: any;
  let mockValidateClaudeConfig: any;
  let mockLogger: any;

  const mockContext = {
    blueprintId: 'blueprint-123',
    userId: 'user-456',
    staticAnswers: {
      role: 'Software Developer',
      organization: {
        name: 'Tech Corp',
        industry: 'Technology',
        size: '100-500',
      },
      learningGap: {
        description: 'Need to learn advanced TypeScript patterns',
        urgency: 4,
        objectives: 'Master TypeScript generics',
      },
    },
    role: 'Software Developer',
    industry: 'Technology',
    organization: 'Tech Corp',
  };

  const mockSections = [
    {
      id: 'section-1',
      title: 'Learning Context',
      description: 'Understanding your learning needs',
      questions: [
        {
          id: 'q1',
          text: 'What is your current experience level?',
          type: 'radio',
          options: ['Beginner', 'Intermediate', 'Advanced'],
          required: true,
        },
        {
          id: 'q2',
          text: 'What are your learning goals?',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      id: 'section-2',
      title: 'Technical Background',
      description: 'Assessing your technical knowledge',
      questions: [
        {
          id: 'q3',
          text: 'Which programming languages do you know?',
          type: 'checkbox',
          options: ['JavaScript', 'TypeScript', 'Python', 'Java'],
          required: false,
        },
      ],
    },
  ];

  const mockClaudeResponse = {
    sections: mockSections,
    metadata: {
      generatedAt: '2025-11-12T20:00:00Z',
      model: 'claude-sonnet-4-5',
      duration: 5000,
      sectionCount: 2,
      questionCount: 3,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked imports
    const { generateWithClaude, validateClaudeConfig } = await import('../claudeQuestionService');
    const { createServiceLogger } = await import('@/lib/logging');

    mockGenerateWithClaude = vi.mocked(generateWithClaude);
    mockValidateClaudeConfig = vi.mocked(validateClaudeConfig);
    mockLogger = vi.mocked(createServiceLogger)();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateDynamicQuestions', () => {
    describe('Successful Generation', () => {
      it('should successfully generate questions with Claude', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.sections).toEqual(mockSections);
        expect(result.metadata.source).toBe('claude');
        expect(result.metadata.fallbackUsed).toBe(false);
        expect(result.error).toBeUndefined();
      });

      it('should include all metadata from Claude response', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.metadata).toMatchObject({
          generatedAt: '2025-11-12T20:00:00Z',
          model: 'claude-sonnet-4-5',
          source: 'claude',
          fallbackUsed: false,
        });
        expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
      });

      it('should call generateWithClaude with correct context', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockGenerateWithClaude).toHaveBeenCalledOnce();
        expect(mockGenerateWithClaude).toHaveBeenCalledWith(mockContext);
      });

      it('should log generation start event', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'dynamic_questions.generation.start',
          'Starting dynamic question generation',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            userId: mockContext.userId,
          })
        );
      });

      it('should log generation completion with metrics', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'dynamic_questions.generation.complete',
          'Successfully generated questions with Claude',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            source: 'claude',
            sectionCount: 2,
            questionCount: 3,
            fallbackUsed: false,
          })
        );
      });

      it('should track total generation duration', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        const beforeTime = Date.now();

        // Act
        const result = await generateDynamicQuestions(mockContext);
        const afterTime = Date.now();

        // Assert
        expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
        expect(result.metadata.duration).toBeLessThanOrEqual(afterTime - beforeTime + 100);
      });

      it('should calculate question count correctly from sections', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'dynamic_questions.generation.complete',
          expect.any(String),
          expect.objectContaining({
            questionCount: 3, // 2 + 1 from mockSections
          })
        );
      });
    });

    describe('Configuration Validation', () => {
      it('should validate Claude configuration before generation', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockValidateClaudeConfig).toHaveBeenCalledOnce();
      });

      it('should return error when Claude is not configured', async () => {
        // Arrange: Claude not configured
        mockValidateClaudeConfig.mockReturnValue({
          valid: false,
          errors: ['ANTHROPIC_API_KEY not configured', 'Missing model configuration'],
        });

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.sections).toEqual([]);
        expect(result.error).toContain('Claude not configured');
        expect(result.error).toContain('ANTHROPIC_API_KEY');
        expect(result.metadata.source).toBe('claude');
        expect(result.metadata.fallbackUsed).toBe(false);
      });

      it('should log configuration errors', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({
          valid: false,
          errors: ['API key missing'],
        });

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith(
          'dynamic_questions.generation.error',
          'Claude not configured',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            errors: ['API key missing'],
          })
        );
      });

      it('should not call generateWithClaude when config is invalid', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({
          valid: false,
          errors: ['Configuration invalid'],
        });

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockGenerateWithClaude).not.toHaveBeenCalled();
      });

      it('should include metadata even when config is invalid', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({
          valid: false,
          errors: ['Config error'],
        });

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.metadata).toMatchObject({
          generatedAt: expect.any(String),
          model: 'claude-sonnet-4-5',
          source: 'claude',
          fallbackUsed: false,
        });
        expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error Handling', () => {
      it('should handle Claude generation errors gracefully', async () => {
        // Arrange: Claude throws error
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(new Error('API timeout'));

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.sections).toEqual([]);
        expect(result.error).toBe('Question generation failed: API timeout');
        expect(result.metadata.source).toBe('claude');
        expect(result.metadata.fallbackUsed).toBe(false);
      });

      it('should handle non-Error exceptions', async () => {
        // Arrange: Non-Error exception thrown
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue('String error message');

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Question generation failed: String error message');
      });

      it('should log Claude generation errors', async () => {
        // Arrange
        const error = new Error('Rate limit exceeded');
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(error);

        // Act
        await generateDynamicQuestions(mockContext);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith(
          'dynamic_questions.generation.error',
          'Claude generation failed',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            error: 'Rate limit exceeded',
          })
        );
      });

      it('should handle timeout errors', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(new Error('Request timeout after 30s'));

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('timeout');
      });

      it('should handle validation errors from Claude', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(
          new Error('Invalid response format: missing sections')
        );

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid response format');
      });

      it('should handle network errors', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(new Error('fetch failed: ECONNREFUSED'));

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('ECONNREFUSED');
      });

      it('should track duration even when errors occur', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(new Error('Test error'));

        const beforeTime = Date.now();

        // Act
        const result = await generateDynamicQuestions(mockContext);
        const afterTime = Date.now();

        // Assert
        expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
        expect(result.metadata.duration).toBeLessThanOrEqual(afterTime - beforeTime + 100);
      });
    });

    describe('Response Structure', () => {
      it('should return correct structure on success', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('sections');
        expect(result).toHaveProperty('metadata');
        expect(result).not.toHaveProperty('error');
        expect(result.metadata).toHaveProperty('source');
        expect(result.metadata).toHaveProperty('fallbackUsed');
        expect(result.metadata).toHaveProperty('duration');
      });

      it('should return correct structure on failure', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockRejectedValue(new Error('Test error'));

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('sections');
        expect(result).toHaveProperty('metadata');
        expect(result).toHaveProperty('error');
        expect(result.success).toBe(false);
        expect(result.sections).toEqual([]);
      });

      it('should preserve all section data', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.sections).toHaveLength(2);
        expect(result.sections[0]).toHaveProperty('id');
        expect(result.sections[0]).toHaveProperty('title');
        expect(result.sections[0]).toHaveProperty('description');
        expect(result.sections[0]).toHaveProperty('questions');
        expect(result.sections[0].questions).toHaveLength(2);
      });

      it('should preserve question structures', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        const firstQuestion = result.sections[0].questions[0];
        expect(firstQuestion).toHaveProperty('id');
        expect(firstQuestion).toHaveProperty('text');
        expect(firstQuestion).toHaveProperty('type');
        expect(firstQuestion).toHaveProperty('required');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty sections array', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue({
          sections: [],
          metadata: mockClaudeResponse.metadata,
        });

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.sections).toEqual([]);
      });

      it('should handle sections with no questions', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue({
          sections: [
            {
              id: 'section-1',
              title: 'Empty Section',
              description: 'No questions',
              questions: [],
            },
          ],
          metadata: mockClaudeResponse.metadata,
        });

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.sections[0].questions).toEqual([]);
      });

      it('should handle missing optional context fields', async () => {
        // Arrange
        const minimalContext = {
          blueprintId: 'blueprint-123',
          userId: 'user-456',
          staticAnswers: {},
        };

        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await generateDynamicQuestions(minimalContext);

        // Assert
        expect(result.success).toBe(true);
        expect(mockGenerateWithClaude).toHaveBeenCalledWith(minimalContext);
      });

      it('should handle very long generation times', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(mockClaudeResponse), 100);
            })
        );

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(true);
        // Allow for slight timing variance (95ms instead of exact 100ms)
        expect(result.metadata.duration).toBeGreaterThanOrEqual(95);
      });

      it('should handle malformed metadata', async () => {
        // Arrange
        mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
        mockGenerateWithClaude.mockResolvedValue({
          sections: mockSections,
          metadata: {
            generatedAt: '2025-11-12T20:00:00Z',
            model: 'claude-sonnet-4-5',
            // Missing optional fields
          },
        });

        // Act
        const result = await generateDynamicQuestions(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.metadata).toBeDefined();
      });
    });
  });

  describe('validateGenerationConfig', () => {
    it('should return Claude configuration status', async () => {
      // Arrange
      mockValidateClaudeConfig.mockReturnValue({
        valid: true,
        errors: [],
      });

      // Act
      const config = validateGenerationConfig();

      // Assert
      expect(config).toHaveProperty('claude');
      expect(config.claude).toHaveProperty('valid');
      expect(config.claude).toHaveProperty('errors');
    });

    it('should report valid Claude configuration', async () => {
      // Arrange
      mockValidateClaudeConfig.mockReturnValue({
        valid: true,
        errors: [],
      });

      // Act
      const config = validateGenerationConfig();

      // Assert
      expect(config.claude.valid).toBe(true);
      expect(config.claude.errors).toEqual([]);
    });

    it('should report invalid Claude configuration with errors', async () => {
      // Arrange
      mockValidateClaudeConfig.mockReturnValue({
        valid: false,
        errors: ['API key not configured', 'Model not specified'],
      });

      // Act
      const config = validateGenerationConfig();

      // Assert
      expect(config.claude.valid).toBe(false);
      expect(config.claude.errors).toEqual(['API key not configured', 'Model not specified']);
    });

    it('should call validateClaudeConfig', async () => {
      // Arrange
      mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });

      // Act
      validateGenerationConfig();

      // Assert
      expect(mockValidateClaudeConfig).toHaveBeenCalledOnce();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete successful workflow', async () => {
      // Arrange: Complete happy path
      mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
      mockGenerateWithClaude.mockResolvedValue(mockClaudeResponse);

      // Act
      const result = await generateDynamicQuestions(mockContext);

      // Assert: Verify complete workflow
      expect(mockValidateClaudeConfig).toHaveBeenCalled(); // 1. Validate config
      expect(mockGenerateWithClaude).toHaveBeenCalled(); // 2. Generate questions
      expect(mockLogger.info).toHaveBeenCalledTimes(2); // 3. Log start & complete
      expect(result.success).toBe(true); // 4. Return success
    });

    it('should handle config validation failure without attempting generation', async () => {
      // Arrange
      mockValidateClaudeConfig.mockReturnValue({
        valid: false,
        errors: ['Config error'],
      });

      // Act
      const result = await generateDynamicQuestions(mockContext);

      // Assert
      expect(mockValidateClaudeConfig).toHaveBeenCalled();
      expect(mockGenerateWithClaude).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });

    it('should handle generation failure with proper error reporting', async () => {
      // Arrange
      mockValidateClaudeConfig.mockReturnValue({ valid: true, errors: [] });
      mockGenerateWithClaude.mockRejectedValue(new Error('Generation failed'));

      // Act
      const result = await generateDynamicQuestions(mockContext);

      // Assert
      expect(mockValidateClaudeConfig).toHaveBeenCalled();
      expect(mockGenerateWithClaude).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'dynamic_questions.generation.start',
        expect.any(String),
        expect.any(Object)
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'dynamic_questions.generation.error',
        expect.any(String),
        expect.any(Object)
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Generation failed');
    });
  });
});
