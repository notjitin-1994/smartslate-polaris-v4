/**
 * Tests for Gemini Prompt Templates
 */

import { describe, it, expect } from 'vitest';
import {
  BLUEPRINT_SYSTEM_PROMPT,
  buildBlueprintPrompt,
  extractLearningObjectives,
  type BlueprintContext,
} from '@/lib/claude/prompts';

describe('Gemini Prompts', () => {
  describe('BLUEPRINT_SYSTEM_PROMPT', () => {
    it('should contain role definition', () => {
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('Learning Experience Designer');
    });

    it('should specify output requirements', () => {
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('OUTPUT REQUIREMENTS');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('Valid JSON only');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('no markdown');
    });

    it('should list visualization types', () => {
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('VISUALIZATION TYPES');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('infographic');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('markdown');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('chart');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('timeline');
      expect(BLUEPRINT_SYSTEM_PROMPT).toContain('table');
    });
  });

  describe('buildBlueprintPrompt', () => {
    const mockContext: BlueprintContext = {
      blueprintId: 'bp-123',
      userId: 'user-456',
      organization: 'Acme Corp',
      role: 'Training Manager',
      industry: 'Technology',
      staticAnswers: {
        company_size: '100-500',
        learning_culture: 'moderate',
      },
      dynamicAnswers: {
        preferred_modality: 'blended',
        budget_range: '$50k-$100k',
      },
      learningObjectives: ['Improve technical skills', 'Enhance collaboration'],
    };

    it('should include organization context', () => {
      const prompt = buildBlueprintPrompt(mockContext);

      expect(prompt).toContain('Acme Corp');
      expect(prompt).toContain('Technology');
      expect(prompt).toContain('Training Manager');
    });

    it('should include static questionnaire answers', () => {
      const prompt = buildBlueprintPrompt(mockContext);

      expect(prompt).toContain('STATIC QUESTIONNAIRE ANSWERS');
      expect(prompt).toContain('company_size');
      expect(prompt).toContain('100-500');
    });

    it('should include dynamic questionnaire answers', () => {
      const prompt = buildBlueprintPrompt(mockContext);

      expect(prompt).toContain('DYNAMIC QUESTIONNAIRE ANSWERS');
      expect(prompt).toContain('preferred_modality');
      expect(prompt).toContain('blended');
    });

    it('should include learning objectives', () => {
      const prompt = buildBlueprintPrompt(mockContext);

      expect(prompt).toContain('PRIMARY LEARNING OBJECTIVES');
      expect(prompt).toContain('1. Improve technical skills');
      expect(prompt).toContain('2. Enhance collaboration');
    });

    it('should include output schema template', () => {
      const prompt = buildBlueprintPrompt(mockContext);

      expect(prompt).toContain('OUTPUT SCHEMA');
      expect(prompt).toContain('metadata');
      expect(prompt).toContain('executive_summary');
      expect(prompt).toContain('learning_objectives');
    });

    it('should include critical requirements', () => {
      const prompt = buildBlueprintPrompt(mockContext);

      expect(prompt).toContain('CRITICAL REQUIREMENTS');
      expect(prompt).toContain('Return ONLY valid JSON');
      expect(prompt).toContain('Include displayType');
    });

    it('should use current timestamp in schema', () => {
      const beforeTime = new Date().toISOString();
      const prompt = buildBlueprintPrompt(mockContext);
      const afterTime = new Date().toISOString();

      // Extract timestamp from prompt
      const timestampMatch = prompt.match(/"generated_at": "([^"]+)"/);
      expect(timestampMatch).toBeTruthy();

      const timestamp = timestampMatch![1];
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });

    it('should handle empty learning objectives', () => {
      const contextWithNoObjectives = {
        ...mockContext,
        learningObjectives: [],
      };

      const prompt = buildBlueprintPrompt(contextWithNoObjectives);

      expect(prompt).toContain('PRIMARY LEARNING OBJECTIVES');
      // Should still have the section even if empty
    });
  });

  describe('extractLearningObjectives', () => {
    it('should extract objectives from learning_objectives key', () => {
      const dynamicAnswers = {
        learning_objectives: ['Objective 1', 'Objective 2'],
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Objective 1', 'Objective 2']);
    });

    it('should extract objectives from objectives key', () => {
      const dynamicAnswers = {
        objectives: ['Goal 1', 'Goal 2'],
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Goal 1', 'Goal 2']);
    });

    it('should extract objectives from goals key', () => {
      const dynamicAnswers = {
        goals: ['Target 1', 'Target 2'],
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Target 1', 'Target 2']);
    });

    it('should handle comma-separated string format', () => {
      const dynamicAnswers = {
        learning_objectives: 'Objective 1, Objective 2, Objective 3',
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Objective 1', 'Objective 2', 'Objective 3']);
    });

    it('should handle newline-separated string format', () => {
      const dynamicAnswers = {
        learning_objectives: 'Objective 1\nObjective 2\nObjective 3',
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Objective 1', 'Objective 2', 'Objective 3']);
    });

    it('should handle mixed comma and newline format', () => {
      const dynamicAnswers = {
        learning_objectives: 'Objective 1,\nObjective 2,\nObjective 3',
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toHaveLength(3);
      expect(objectives[0]).toContain('Objective 1');
    });

    it('should trim whitespace from objectives', () => {
      const dynamicAnswers = {
        learning_objectives: '  Objective 1  ,  Objective 2  ',
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Objective 1', 'Objective 2']);
    });

    it('should filter out empty strings', () => {
      const dynamicAnswers = {
        learning_objectives: 'Objective 1,,Objective 2',
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Objective 1', 'Objective 2']);
    });

    it('should return default objective when none found', () => {
      const dynamicAnswers = {};

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toHaveLength(1);
      expect(objectives[0]).toContain(
        'Enhance organizational learning and development capabilities'
      );
    });

    it('should prioritize learning_objectives over other keys', () => {
      const dynamicAnswers = {
        learning_objectives: ['Priority 1'],
        objectives: ['Fallback 1'],
        goals: ['Fallback 2'],
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['Priority 1']);
    });

    it('should convert non-string array values to strings', () => {
      const dynamicAnswers = {
        learning_objectives: [1, 2, 3],
      };

      const objectives = extractLearningObjectives(dynamicAnswers);

      expect(objectives).toEqual(['1', '2', '3']);
    });
  });
});
