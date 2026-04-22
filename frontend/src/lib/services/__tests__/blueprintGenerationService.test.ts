/**
 * Comprehensive Test Suite: Blueprint Generation Service
 *
 * Tests the orchestration service that manages:
 * - Dual-fallback cascade (Sonnet 4.5 → Sonnet 4)
 * - Cache integration (exact + similar match)
 * - Input validation (static + dynamic answers)
 * - Data sanitization
 * - Blueprint validation
 * - Performance monitoring
 * - Usage tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlueprintGenerationService } from '../blueprintGenerationService';
import type { BlueprintContext } from '@/lib/claude/prompts';

// Mock all dependencies at module level
vi.mock('@/lib/claude/clientWithCostTracking', () => ({
  TrackedClaudeClient: vi.fn(),
}));

vi.mock('@/lib/claude/config', () => ({
  getClaudeConfig: vi.fn(),
}));

vi.mock('@/lib/claude/prompts', () => ({
  BLUEPRINT_SYSTEM_PROMPT: 'You are a learning blueprint generator...',
  buildBlueprintPrompt: vi.fn(() => 'User prompt with context...'),
}));

vi.mock('@/lib/claude/validation', () => {
  class ValidationError extends Error {
    constructor(
      message: string,
      public code?: string
    ) {
      super(message);
      this.name = 'ValidationError';
    }
  }

  return {
    validateAndNormalizeBlueprint: vi.fn(),
    ValidationError,
  };
});

vi.mock('@/lib/claude/fallback', () => ({
  shouldFallbackToSonnet4: vi.fn(),
  logFallbackDecision: vi.fn(),
}));

vi.mock('@/lib/logging', () => {
  // Create a shared mock logger inside the factory to avoid hoisting issues
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

vi.mock('@/lib/cache/blueprintCache', () => ({
  getCachedBlueprint: vi.fn(),
  getSimilarBlueprint: vi.fn(),
  cacheBlueprint: vi.fn(),
}));

vi.mock('@/lib/performance/performanceMonitor', () => ({
  performanceMonitor: {
    startTimer: vi.fn(),
  },
}));

vi.mock('@/lib/validation/dataIntegrity', () => ({
  validateStaticAnswers: vi.fn(),
  validateDynamicAnswers: vi.fn(),
  validateBlueprintResponse: vi.fn(),
  sanitizeForLLM: vi.fn(),
}));

vi.mock('@/lib/logging/blueprintLogger', () => ({
  WorkflowTracer: vi.fn(),
  logDataFlow: vi.fn(),
  logValidation: vi.fn(),
  logTransformation: vi.fn(),
  logLLMRequest: vi.fn(),
  logLLMResponse: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/claude/client', () => {
  class ClaudeApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public errorType?: string
    ) {
      super(message);
      this.name = 'ClaudeApiError';
    }
  }

  return {
    ClaudeClient: {
      extractText: vi.fn((response) => {
        const text = response.content?.[0]?.text;
        return typeof text === 'string' ? text : JSON.stringify(text);
      }),
    },
    ClaudeApiError,
  };
});

// Import mocked error classes for use in tests
const { ClaudeApiError } = await import('@/lib/claude/client');
const { ValidationError } = await import('@/lib/claude/validation');

describe('BlueprintGenerationService', () => {
  let service: BlueprintGenerationService;
  let mockClaudeClient: any;
  let mockConfig: any;
  let mockPerformanceMonitor: any;
  let mockCache: any;
  let mockValidation: any;
  let mockFallback: any;
  let mockLogger: any;

  // Test fixtures
  const mockContext: BlueprintContext = {
    blueprintId: 'test-blueprint-123',
    userId: 'user-456',
    organization: 'Test Org',
    industry: 'Technology',
    role: 'Developer',
    staticAnswers: {
      role: 'Software Developer',
      organization: { name: 'Test Org', industry: 'Technology' },
      learningGap: {
        description: 'Need to learn advanced TypeScript patterns',
        urgency: 4,
        objectives: 'Master TypeScript generics and utility types',
      },
    },
    dynamicAnswers: {
      'learning-style': 'hands-on',
      'preferred-format': 'video',
      'time-availability': '10-hours-week',
    },
    learningObjectives: ['Master TypeScript', 'Build scalable applications'],
  };

  const mockBlueprint = {
    metadata: { version: '1.0', created: new Date().toISOString() },
    executive_summary: {
      displayType: 'text',
      overview: 'Comprehensive TypeScript learning blueprint',
    },
    learning_objectives: {
      displayType: 'list',
      objectives: ['Master TypeScript', 'Learn advanced patterns', 'Build projects'],
    },
    target_audience: {
      displayType: 'text',
      description: 'Software developers',
    },
    instructional_strategy: {
      displayType: 'text',
      approach: 'Hands-on learning',
    },
    content_outline: {
      displayType: 'modules',
      modules: [
        { title: 'Module 1', lessons: ['Lesson 1', 'Lesson 2'] },
        { title: 'Module 2', lessons: ['Lesson 3', 'Lesson 4'] },
      ],
    },
    resources: {
      displayType: 'list',
      items: ['TypeScript Handbook', 'Online courses'],
    },
    assessment_strategy: {
      displayType: 'text',
      description: 'Quizzes and projects',
    },
    implementation_timeline: {
      displayType: 'timeline',
      phases: ['Phase 1', 'Phase 2'],
    },
    success_metrics: {
      displayType: 'metrics',
      kpis: ['Completion rate', 'Assessment scores'],
    },
  };

  const mockClaudeResponse = {
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: JSON.stringify(mockBlueprint) }],
    model: 'claude-sonnet-4-5-20250514',
    stop_reason: 'end_turn',
    usage: { input_tokens: 1000, output_tokens: 2000 },
  };

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock TrackedClaudeClient
    mockClaudeClient = {
      generate: vi.fn(),
    };

    // Setup mock config
    mockConfig = {
      apiKey: 'test-api-key',
      primaryModel: 'claude-sonnet-4-5-20250514',
      fallbackModel: 'claude-sonnet-4-20250514',
      temperature: 0.7,
    };

    // Setup mock performance monitor
    mockPerformanceMonitor = {
      startTimer: vi.fn(() => vi.fn(() => ({ duration: 1500 }))),
    };

    // Setup mock cache
    mockCache = {
      getCachedBlueprint: vi.fn(),
      getSimilarBlueprint: vi.fn(),
      cacheBlueprint: vi.fn(),
    };

    // Setup mock validation
    mockValidation = {
      validateStaticAnswers: vi.fn(() => ({
        isValid: true,
        errors: [],
        warnings: [],
      })),
      validateDynamicAnswers: vi.fn(() => ({
        isValid: true,
        errors: [],
        warnings: [],
      })),
      validateBlueprintResponse: vi.fn(() => ({
        isValid: true,
        errors: [],
        warnings: [],
      })),
      sanitizeForLLM: vi.fn((data) => data),
    };

    // Setup mock fallback
    mockFallback = {
      shouldFallbackToSonnet4: vi.fn(),
      logFallbackDecision: vi.fn(),
    };

    // Setup mock workflow tracer
    const mockWorkflowTracer = {
      addStep: vi.fn(),
    };

    // Apply mocks using dynamic imports
    const { TrackedClaudeClient } = await import('@/lib/claude/clientWithCostTracking');
    const { getClaudeConfig } = await import('@/lib/claude/config');
    const { buildBlueprintPrompt } = await import('@/lib/claude/prompts');
    const { validateAndNormalizeBlueprint } = await import('@/lib/claude/validation');
    const { shouldFallbackToSonnet4, logFallbackDecision } = await import('@/lib/claude/fallback');
    const { createServiceLogger } = await import('@/lib/logging');
    const { getCachedBlueprint, getSimilarBlueprint, cacheBlueprint } = await import(
      '@/lib/cache/blueprintCache'
    );
    const { performanceMonitor } = await import('@/lib/performance/performanceMonitor');
    const {
      validateStaticAnswers,
      validateDynamicAnswers,
      validateBlueprintResponse,
      sanitizeForLLM,
    } = await import('@/lib/validation/dataIntegrity');
    const { WorkflowTracer, logDataFlow, logValidation, logTransformation } = await import(
      '@/lib/logging/blueprintLogger'
    );

    // Configure mocks
    vi.mocked(TrackedClaudeClient).mockImplementation(() => mockClaudeClient as any);
    vi.mocked(getClaudeConfig).mockReturnValue(mockConfig);
    vi.mocked(buildBlueprintPrompt).mockReturnValue('User prompt with context...');
    vi.mocked(validateAndNormalizeBlueprint).mockImplementation((text) => {
      try {
        return JSON.parse(text);
      } catch {
        return mockBlueprint;
      }
    });
    vi.mocked(shouldFallbackToSonnet4).mockImplementation(mockFallback.shouldFallbackToSonnet4);
    vi.mocked(logFallbackDecision).mockImplementation(mockFallback.logFallbackDecision);
    // Get the mock logger from the factory (it returns the same instance every time)
    mockLogger = vi.mocked(createServiceLogger)() as any;
    vi.mocked(createServiceLogger).mockReturnValue(mockLogger);
    vi.mocked(getCachedBlueprint).mockImplementation(mockCache.getCachedBlueprint);
    vi.mocked(getSimilarBlueprint).mockImplementation(mockCache.getSimilarBlueprint);
    vi.mocked(cacheBlueprint).mockImplementation(mockCache.cacheBlueprint);
    vi.mocked(performanceMonitor.startTimer).mockImplementation(mockPerformanceMonitor.startTimer);
    vi.mocked(validateStaticAnswers).mockImplementation(mockValidation.validateStaticAnswers);
    vi.mocked(validateDynamicAnswers).mockImplementation(mockValidation.validateDynamicAnswers);
    vi.mocked(validateBlueprintResponse).mockImplementation(
      mockValidation.validateBlueprintResponse
    );
    vi.mocked(sanitizeForLLM).mockImplementation(mockValidation.sanitizeForLLM);
    vi.mocked(WorkflowTracer).mockImplementation(() => mockWorkflowTracer as any);
    vi.mocked(logDataFlow).mockImplementation(vi.fn());
    vi.mocked(logValidation).mockImplementation(vi.fn());
    vi.mocked(logTransformation).mockImplementation(vi.fn());

    // Create service instance
    service = new BlueprintGenerationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create service with TrackedClaudeClient', async () => {
      expect(service).toBeInstanceOf(BlueprintGenerationService);
      const { TrackedClaudeClient } = await import('@/lib/claude/clientWithCostTracking');
      expect(vi.mocked(TrackedClaudeClient)).toHaveBeenCalled();
    });

    it('should create service with optional Supabase client', async () => {
      const mockSupabase = { from: vi.fn() };
      const serviceWithSupabase = new BlueprintGenerationService(mockSupabase);

      expect(serviceWithSupabase).toBeInstanceOf(BlueprintGenerationService);
      const { TrackedClaudeClient } = await import('@/lib/claude/clientWithCostTracking');
      expect(vi.mocked(TrackedClaudeClient)).toHaveBeenCalledWith(undefined, mockSupabase);
    });

    it('should load Claude config on initialization', async () => {
      const { getClaudeConfig } = await import('@/lib/claude/config');
      expect(vi.mocked(getClaudeConfig)).toHaveBeenCalled();
    });
  });

  describe('Cache Integration', () => {
    describe('Exact Cache Hit', () => {
      it('should return cached blueprint without calling Claude API', async () => {
        // Arrange: Mock exact cache hit
        mockCache.getCachedBlueprint.mockResolvedValue(mockBlueprint);

        // Act
        const result = await service.generate(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.blueprint).toEqual(mockBlueprint);
        expect(result.metadata.fallbackUsed).toBe(false);
        expect(result.metadata.attempts).toBe(0);
        expect(mockCache.getCachedBlueprint).toHaveBeenCalledWith(mockContext.staticAnswers);
        expect(mockClaudeClient.generate).not.toHaveBeenCalled();
      });

      it('should log cache hit event', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(mockBlueprint);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'blueprint.generation.cache_hit',
          'Blueprint found in cache',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            userId: mockContext.userId,
            cacheHit: true,
          })
        );
      });

      it('should track performance for cache hit', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(mockBlueprint);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(
          'blueprint_generation',
          { blueprintId: mockContext.blueprintId, userId: mockContext.userId },
          { type: 'api' }
        );
      });
    });

    describe('Similar Cache Hit', () => {
      it('should return similar blueprint and cache it for exact match', async () => {
        // Arrange: Mock similar cache hit
        mockCache.getCachedBlueprint.mockResolvedValue(null); // No exact match
        mockCache.getSimilarBlueprint.mockResolvedValue(mockBlueprint); // Similar match found

        // Act
        const result = await service.generate(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.blueprint).toEqual(mockBlueprint);
        expect(mockCache.getSimilarBlueprint).toHaveBeenCalledWith(mockContext.staticAnswers);
        expect(mockCache.cacheBlueprint).toHaveBeenCalledWith(
          mockContext.staticAnswers,
          mockBlueprint
        );
        expect(mockClaudeClient.generate).not.toHaveBeenCalled();
      });

      it('should log similar cache hit event', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(mockBlueprint);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'blueprint.generation.similar_cache_hit',
          'Similar blueprint found in cache',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            cacheHit: true,
            similar: true,
          })
        );
      });
    });

    describe('Cache Miss', () => {
      it('should generate blueprint when no cache hit', async () => {
        // Arrange: Mock cache miss
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await service.generate(mockContext);

        // Assert
        expect(result.success).toBe(true);
        expect(mockClaudeClient.generate).toHaveBeenCalled();
      });

      it('should cache newly generated blueprint', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockCache.cacheBlueprint).toHaveBeenCalledWith(
          mockContext.staticAnswers,
          mockBlueprint
        );
      });

      it('should handle cache storage errors gracefully', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);
        mockCache.cacheBlueprint.mockRejectedValue(new Error('Cache storage failed'));

        // Act
        const result = await service.generate(mockContext);

        // Assert: Should succeed despite cache error
        expect(result.success).toBe(true);
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'blueprint.generation.cache_error',
          'Failed to cache generated blueprint',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
          })
        );
      });
    });
  });

  describe('Input Validation', () => {
    describe('Static Answers Validation', () => {
      it('should validate static answers before generation', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockValidation.validateStaticAnswers).toHaveBeenCalledWith(
          mockContext.staticAnswers
        );
      });

      it('should reject generation when static answers validation fails', async () => {
        // Arrange: Mock validation failure
        mockValidation.validateStaticAnswers.mockReturnValue({
          isValid: false,
          errors: ['Role is required', 'Organization name is missing'],
          warnings: [],
        });

        // Act
        const result = await service.generate(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid static answers');
        expect(result.error).toContain('Role is required');
        expect(result.metadata.attempts).toBe(0);
        expect(mockClaudeClient.generate).not.toHaveBeenCalled();
      });

      it('should log static validation errors', async () => {
        // Arrange
        mockValidation.validateStaticAnswers.mockReturnValue({
          isValid: false,
          errors: ['Role is required'],
          warnings: [],
        });

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith(
          'blueprint.generation.invalid_static_answers',
          'Static answers validation failed',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            errors: ['Role is required'],
          })
        );
      });

      it('should accept valid static answers with warnings', async () => {
        // Arrange
        mockValidation.validateStaticAnswers.mockReturnValue({
          isValid: true,
          errors: [],
          warnings: ['Budget information recommended'],
        });
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        // Act
        const result = await service.generate(mockContext);

        // Assert: Should proceed despite warnings
        expect(result.success).toBe(true);
        expect(mockClaudeClient.generate).toHaveBeenCalled();
      });
    });

    describe('Dynamic Answers Validation', () => {
      it('should validate dynamic answers before generation', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockValidation.validateDynamicAnswers).toHaveBeenCalledWith(
          mockContext.dynamicAnswers
        );
      });

      it('should reject generation when dynamic answers validation fails', async () => {
        // Arrange: Mock validation failure
        mockValidation.validateDynamicAnswers.mockReturnValue({
          isValid: false,
          errors: ['Only 40% of questions answered. Need at least 50% completion.'],
          warnings: [],
        });

        // Act
        const result = await service.generate(mockContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid dynamic answers');
        expect(result.error).toContain('40%');
        expect(mockClaudeClient.generate).not.toHaveBeenCalled();
      });

      it('should log dynamic validation errors', async () => {
        // Arrange
        mockValidation.validateDynamicAnswers.mockReturnValue({
          isValid: false,
          errors: ['Insufficient completion rate'],
          warnings: [],
        });

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith(
          'blueprint.generation.invalid_dynamic_answers',
          'Dynamic answers validation failed',
          expect.objectContaining({
            blueprintId: mockContext.blueprintId,
            errors: ['Insufficient completion rate'],
          })
        );
      });
    });

    describe('Data Sanitization', () => {
      it('should sanitize context data before generation', async () => {
        // Arrange
        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        // Act
        await service.generate(mockContext);

        // Assert
        expect(mockValidation.sanitizeForLLM).toHaveBeenCalledWith(mockContext.staticAnswers);
        expect(mockValidation.sanitizeForLLM).toHaveBeenCalledWith(mockContext.dynamicAnswers);
      });

      it('should log transformation when data is sanitized', async () => {
        // Arrange
        const largData = { ...mockContext.staticAnswers, description: 'x'.repeat(10000) };
        const contextWithLargeData = { ...mockContext, staticAnswers: largData };

        mockValidation.sanitizeForLLM.mockImplementation((data) => {
          if (JSON.stringify(data).length > 5000) {
            return { ...data, description: data.description?.substring(0, 5000) };
          }
          return data;
        });

        mockCache.getCachedBlueprint.mockResolvedValue(null);
        mockCache.getSimilarBlueprint.mockResolvedValue(null);
        mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

        const { logTransformation } = await import('@/lib/logging/blueprintLogger');

        // Act
        await service.generate(contextWithLargeData);

        // Assert
        expect(vi.mocked(logTransformation)).toHaveBeenCalledWith(
          'sanitize',
          expect.any(Number),
          expect.any(Number),
          expect.objectContaining({ blueprintId: mockContext.blueprintId })
        );
      });
    });
  });

  describe('Primary Model (Claude Sonnet 4.5)', () => {
    beforeEach(() => {
      // Setup no cache hits
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
    });

    it('should generate blueprint using Claude Sonnet 4.5 (primary model)', async () => {
      // Arrange
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('claude-sonnet-4-5');
      expect(result.metadata.fallbackUsed).toBe(false);
      expect(result.metadata.attempts).toBe(1);
      expect(mockClaudeClient.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 18000, // Increased for Sonnet 4.5
          temperature: 0.7,
          userId: mockContext.userId,
          blueprintId: mockContext.blueprintId,
        })
      );
    });

    it('should use 18,000 max_tokens for Sonnet 4.5', async () => {
      // Arrange
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockClaudeClient.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 18000,
        })
      );
    });

    it('should build system and user prompts', async () => {
      // Arrange
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);
      const { buildBlueprintPrompt } = await import('@/lib/claude/prompts');

      // Act
      await service.generate(mockContext);

      // Assert
      expect(vi.mocked(buildBlueprintPrompt)).toHaveBeenCalledWith(
        expect.objectContaining({
          staticAnswers: mockContext.staticAnswers,
          dynamicAnswers: mockContext.dynamicAnswers,
        })
      );
      expect(mockClaudeClient.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a learning blueprint generator...',
          messages: [
            {
              role: 'user',
              content: 'User prompt with context...',
            },
          ],
        })
      );
    });

    it('should return usage statistics', async () => {
      // Arrange
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.usage).toEqual({
        input_tokens: 1000,
        output_tokens: 2000,
      });
    });

    it('should log successful generation', async () => {
      // Arrange
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'blueprint.generation.success',
        'Blueprint generation succeeded',
        expect.objectContaining({
          blueprintId: mockContext.blueprintId,
          model: 'claude-sonnet-4-5',
          attempts: 1,
        })
      );
    });
  });

  describe('Fallback to Sonnet 4', () => {
    beforeEach(() => {
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
    });

    it('should fallback to Sonnet 4 when primary fails with timeout', async () => {
      // Arrange: Primary model times out
      const timeoutError = new ClaudeApiError('Request timeout', 408, 'timeout');
      mockClaudeClient.generate
        .mockRejectedValueOnce(timeoutError) // Primary fails
        .mockResolvedValueOnce(mockClaudeResponse); // Fallback succeeds

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'timeout',
        reason: 'Request timeout exceeded',
        originalError: timeoutError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('claude-sonnet-4');
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(result.metadata.attempts).toBe(2);
      expect(mockClaudeClient.generate).toHaveBeenCalledTimes(2);
    });

    it('should use 20,000 max_tokens for Sonnet 4 (fallback)', async () => {
      // Arrange
      const rateLimitError = new ClaudeApiError('Rate limit exceeded', 429, 'rate_limit_error');
      mockClaudeClient.generate
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'rate_limit',
        reason: 'Rate limit exceeded',
        originalError: rateLimitError,
      });

      // Act
      await service.generate(mockContext);

      // Assert
      const secondCall = mockClaudeClient.generate.mock.calls[1][0];
      expect(secondCall.max_tokens).toBe(20000); // Higher limit for fallback
      expect(secondCall.model).toBe('claude-sonnet-4-20250514');
    });

    it('should fallback on rate limit errors (429)', async () => {
      // Arrange
      const rateLimitError = new ClaudeApiError('Rate limit exceeded', 429, 'rate_limit_error');
      mockClaudeClient.generate
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'rate_limit',
        reason: 'Rate limit exceeded',
        originalError: rateLimitError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.fallbackUsed).toBe(true);
    });

    it('should fallback on server errors (5xx)', async () => {
      // Arrange
      const serverError = new ClaudeApiError('Internal server error', 500, 'api_error');
      mockClaudeClient.generate
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'api_error_5xx',
        reason: 'Server error: 500',
        originalError: serverError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.fallbackUsed).toBe(true);
    });

    it('should fallback on authentication errors (401)', async () => {
      // Arrange
      const authError = new ClaudeApiError('Invalid API key', 401, 'authentication_error');
      mockClaudeClient.generate
        .mockRejectedValueOnce(authError)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'invalid_api_key',
        reason: 'Authentication failed',
        originalError: authError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.fallbackUsed).toBe(true);
    });

    it('should log fallback decision', async () => {
      // Arrange
      const error = new ClaudeApiError('Request timeout', 408, 'timeout');
      mockClaudeClient.generate
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'timeout',
        reason: 'Request timeout exceeded',
        originalError: error,
      });

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockFallback.logFallbackDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldFallback: true,
          trigger: 'timeout',
        }),
        expect.objectContaining({
          blueprintId: mockContext.blueprintId,
          model: 'claude-sonnet-4-5',
          attempt: 1,
        })
      );
    });

    it('should log fallback success', async () => {
      // Arrange
      const error = new ClaudeApiError('Request timeout', 408, 'timeout');
      mockClaudeClient.generate
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'timeout',
        reason: 'Request timeout exceeded',
        originalError: error,
      });

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'blueprint.generation.fallback_success',
        'Claude fallback succeeded',
        expect.objectContaining({
          blueprintId: mockContext.blueprintId,
          model: 'claude-sonnet-4',
          attempts: 2,
          fallbackTrigger: 'timeout',
        })
      );
    });
  });

  describe('Fallback Decision Logic', () => {
    beforeEach(() => {
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
    });

    it('should NOT fallback on client errors (400 Bad Request)', async () => {
      // Arrange: Client error that should not trigger fallback
      const badRequestError = new ClaudeApiError('Invalid request', 400, 'invalid_request_error');
      mockClaudeClient.generate.mockRejectedValueOnce(badRequestError);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: false,
        originalError: badRequestError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.metadata.fallbackUsed).toBe(false);
      expect(result.metadata.attempts).toBe(1);
      expect(mockClaudeClient.generate).toHaveBeenCalledOnce(); // Only primary attempt
    });

    it('should NOT fallback on structural validation errors', async () => {
      // Arrange: Validation error (wrong schema structure)
      const validationError = new ValidationError(
        'Missing required field: title',
        'VALIDATION_ERROR'
      );
      mockClaudeClient.generate.mockRejectedValueOnce(validationError);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: false,
        originalError: validationError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.metadata.fallbackUsed).toBe(false);
      expect(mockClaudeClient.generate).toHaveBeenCalledOnce();
    });

    it('should fallback on JSON parse errors', async () => {
      // Arrange: Parse error (might be fixed by different model)
      const parseError = new ClaudeApiError('Failed to parse JSON', undefined, 'parse_error');
      mockClaudeClient.generate
        .mockRejectedValueOnce(parseError)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'json_parse_error',
        reason: 'Failed to parse JSON response',
        originalError: parseError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.fallbackUsed).toBe(true);
    });

    it('should call shouldFallbackToSonnet4 for error analysis', async () => {
      // Arrange
      const error = new ClaudeApiError('Some error', 500);
      mockClaudeClient.generate.mockRejectedValueOnce(error);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: false,
        originalError: error,
      });

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockFallback.shouldFallbackToSonnet4).toHaveBeenCalledWith(error);
    });
  });

  describe('Blueprint Validation', () => {
    beforeEach(() => {
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
    });

    it('should validate generated blueprint completeness', async () => {
      // Arrange
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockValidation.validateBlueprintResponse).toHaveBeenCalledWith(mockBlueprint);
    });

    it('should throw error when blueprint has missing required sections', async () => {
      // Arrange: Blueprint missing critical sections
      mockClaudeClient.generate.mockRejectedValue(
        new Error('Incomplete blueprint generated: Missing required sections')
      );
      mockValidation.validateBlueprintResponse.mockReturnValue({
        isValid: false,
        errors: ['Missing required sections: content_outline, assessment_strategy'],
        warnings: [],
      });

      // Mock fallback decision - don't fallback on validation errors
      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: false,
        originalError: new Error('Incomplete blueprint'),
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert: Should return failed result
      expect(result.success).toBe(false);
      expect(result.error).toContain('Incomplete blueprint');
      expect(result.metadata.attempts).toBe(1);
    });

    it('should accept blueprint with validation warnings', async () => {
      // Arrange: Blueprint has warnings but is valid
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);
      mockValidation.validateBlueprintResponse.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Section executive_summary has minimal content'],
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'blueprint.generation.validation_warnings',
        'Blueprint has validation warnings',
        expect.objectContaining({
          warnings: ['Section executive_summary has minimal content'],
        })
      );
    });

    it('should NOT throw on non-critical validation errors', async () => {
      // Arrange: Blueprint has errors but not missing sections
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);
      mockValidation.validateBlueprintResponse.mockReturnValue({
        isValid: false,
        errors: ['Section learning_objectives has only 2 items (expected 3+)'],
        warnings: [],
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert: Should succeed (log error but continue)
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
    });

    it('should return error when Claude API key is not configured', async () => {
      // Arrange: No API key
      mockConfig.apiKey = '';

      const serviceNoKey = new BlueprintGenerationService();

      // Act
      const result = await serviceNoKey.generate(mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Claude API key not available');
      expect(result.metadata.attempts).toBe(0);
      expect(mockClaudeClient.generate).not.toHaveBeenCalled();
    });

    it('should return error when both models fail', async () => {
      // Arrange: Both primary and fallback fail
      const primaryError = new ClaudeApiError('Rate limit', 429, 'rate_limit_error');
      const fallbackError = new ClaudeApiError('Service unavailable', 503, 'api_error');

      mockClaudeClient.generate
        .mockRejectedValueOnce(primaryError)
        .mockRejectedValueOnce(fallbackError);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'rate_limit',
        reason: 'Rate limit exceeded',
        originalError: primaryError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('All Claude generation methods failed');
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(result.metadata.attempts).toBe(2);
    });

    it('should log errors when both models fail', async () => {
      // Arrange
      const primaryError = new ClaudeApiError('Error 1', 500);
      const fallbackError = new ClaudeApiError('Error 2', 500);

      mockClaudeClient.generate
        .mockRejectedValueOnce(primaryError)
        .mockRejectedValueOnce(fallbackError);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'api_error_5xx',
        reason: 'Server error',
        originalError: primaryError,
      });

      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'blueprint.generation.claude_fallback_failed',
        'Claude Sonnet 4 fallback failed',
        expect.objectContaining({
          blueprintId: mockContext.blueprintId,
          sonnet45Error: 'Error 1',
          sonnet4Error: 'Error 2',
        })
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange: Unexpected error type
      const unexpectedError = new Error('Unexpected system error');
      mockClaudeClient.generate.mockRejectedValueOnce(unexpectedError);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: false,
        originalError: unexpectedError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected system error');
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);
    });

    it('should start performance timer on generation', async () => {
      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(
        'blueprint_generation',
        {
          blueprintId: mockContext.blueprintId,
          userId: mockContext.userId,
        },
        { type: 'api' }
      );
    });

    it('should track duration in metadata', async () => {
      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.metadata.duration).toBe(1500);
    });

    it('should include timestamp in metadata', async () => {
      // Arrange
      const beforeTime = Date.now();

      // Act
      const result = await service.generate(mockContext);
      const afterTime = Date.now();

      // Assert
      expect(result.metadata.timestamp).toBeDefined();
      const resultTime = new Date(result.metadata.timestamp).getTime();
      expect(resultTime).toBeGreaterThanOrEqual(beforeTime);
      expect(resultTime).toBeLessThanOrEqual(afterTime);
    });

    it('should log generation start event', async () => {
      // Act
      await service.generate(mockContext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'blueprint.generation.started',
        'Blueprint generation started',
        expect.objectContaining({
          blueprintId: mockContext.blueprintId,
          userId: mockContext.userId,
          organization: mockContext.organization,
          industry: mockContext.industry,
          cacheHit: false,
        })
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete generation workflow: validation → generation → caching', async () => {
      // Arrange: Full workflow
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);
      mockClaudeClient.generate.mockResolvedValue(mockClaudeResponse);

      // Act
      const result = await service.generate(mockContext);

      // Assert: Verify full workflow
      expect(mockValidation.validateStaticAnswers).toHaveBeenCalled(); // 1. Validate
      expect(mockValidation.validateDynamicAnswers).toHaveBeenCalled();
      expect(mockValidation.sanitizeForLLM).toHaveBeenCalled(); // 2. Sanitize
      expect(mockCache.getCachedBlueprint).toHaveBeenCalled(); // 3. Check cache
      expect(mockClaudeClient.generate).toHaveBeenCalled(); // 4. Generate
      expect(mockValidation.validateBlueprintResponse).toHaveBeenCalled(); // 5. Validate output
      expect(mockCache.cacheBlueprint).toHaveBeenCalled(); // 6. Cache result
      expect(result.success).toBe(true);
    });

    it('should handle primary failure with successful fallback', async () => {
      // Arrange
      mockCache.getCachedBlueprint.mockResolvedValue(null);
      mockCache.getSimilarBlueprint.mockResolvedValue(null);

      const primaryError = new ClaudeApiError('Timeout', 408, 'timeout');
      mockClaudeClient.generate
        .mockRejectedValueOnce(primaryError)
        .mockResolvedValueOnce(mockClaudeResponse);

      mockFallback.shouldFallbackToSonnet4.mockReturnValue({
        shouldFallback: true,
        trigger: 'timeout',
        reason: 'Request timeout',
        originalError: primaryError,
      });

      // Act
      const result = await service.generate(mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata.model).toBe('claude-sonnet-4');
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(mockClaudeClient.generate).toHaveBeenCalledTimes(2);
    });

    it('should skip generation when exact cache hit', async () => {
      // Arrange: Exact cache hit
      mockCache.getCachedBlueprint.mockResolvedValue(mockBlueprint);

      // Act
      const result = await service.generate(mockContext);

      // Assert: Should skip validation, generation, and most processing
      expect(mockValidation.validateStaticAnswers).toHaveBeenCalled(); // Still validates input
      expect(mockClaudeClient.generate).not.toHaveBeenCalled(); // Skip generation
      expect(mockCache.cacheBlueprint).not.toHaveBeenCalled(); // Skip caching (already cached)
      expect(result.success).toBe(true);
    });
  });
});
