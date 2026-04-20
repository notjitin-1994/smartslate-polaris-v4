import { describe, it, expect, beforeEach, vi } from 'vitest';
import { blueprintFallbackService } from '@/lib/fallbacks/blueprintFallbacks';
import { AggregatedAnswer } from '@/lib/services/answerAggregation';

describe('BlueprintFallbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a default fallback blueprint', () => {
    const fallback = blueprintFallbackService.getFallbackBlueprint();

    expect(fallback.title).toBe('Default Learning Blueprint');
    expect(fallback.overview).toContain('default learning blueprint generated due to an error');
    expect(fallback.learningObjectives).toHaveLength(2);
    expect(fallback.modules).toHaveLength(1);
    expect(fallback.modules[0].title).toBe('Introduction to Learning Blueprints');
    expect(fallback.timeline).toEqual({
      'Week 1': 'Introduction and foundational concepts',
    });
    expect(fallback.resources).toHaveLength(1);
  });

  it('should handle Ollama connection failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fallback = await blueprintFallbackService.handleOllamaConnectionFailure();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Ollama connection failed. Providing fallback blueprint.'
    );
    expect(fallback.title).toBe('Default Learning Blueprint');

    consoleSpy.mockRestore();
  });

  it('should accept aggregated answers parameter without using it in current implementation', () => {
    const mockAggregatedAnswers: AggregatedAnswer = {
      staticResponses: [{ questionId: 'learningObjective', answer: 'Custom objective' }],
      dynamicResponses: [{ questionId: 'customField', answer: 'Custom value' }],
    };

    const fallback = blueprintFallbackService.getFallbackBlueprint(mockAggregatedAnswers);

    // Current implementation doesn't use aggregatedAnswers, so it should return default
    expect(fallback.title).toBe('Default Learning Blueprint');
    expect(fallback.learningObjectives).toContain(
      'Understand the basic concepts of a learning path'
    );
  });

  it('should return consistent fallback blueprint structure', () => {
    const fallback1 = blueprintFallbackService.getFallbackBlueprint();
    const fallback2 = blueprintFallbackService.getFallbackBlueprint();

    expect(fallback1).toEqual(fallback2);
    expect(fallback1.modules).toHaveLength(1);
    expect(fallback1.modules[0].duration).toBe(2);
    expect(fallback1.modules[0].topics).toContain('What is a blueprint?');
    expect(fallback1.modules[0].activities).toContain('Reading an article');
    expect(fallback1.modules[0].assessments).toContain('Short quiz');
  });

  it('should handle empty aggregated answers', () => {
    const emptyAggregatedAnswers: AggregatedAnswer = {
      staticResponses: [],
      dynamicResponses: [],
    };

    const fallback = blueprintFallbackService.getFallbackBlueprint(emptyAggregatedAnswers);

    expect(fallback.title).toBe('Default Learning Blueprint');
    // Should not crash or throw errors
  });

  it('should handle undefined aggregated answers', () => {
    const fallback = blueprintFallbackService.getFallbackBlueprint(undefined);

    expect(fallback.title).toBe('Default Learning Blueprint');
    // Should not crash or throw errors
  });
});
