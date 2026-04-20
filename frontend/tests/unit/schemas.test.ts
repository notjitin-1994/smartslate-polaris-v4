/**
 * Centralized Schema Tests
 *
 * Comprehensive test suite for question and blueprint schemas.
 * Validates schema definitions, transformations, and AI SDK compatibility.
 */

import { describe, it, expect } from 'vitest';
import {
  // Question schemas
  questionSchema,
  dynamicQuestionSchema,
  questionGenerationInputSchema,
  questionGenerationOutputSchema,

  // Question utilities
  validateDynamicQuestion,
  requiresOptions,
  supportsScale,
  supportsFileUpload,

  // Blueprint schemas
  blueprintSchema,
  blueprintModuleSchema,
  blueprintResourceSchema,
  blueprintGenerationInputSchema,

  // Blueprint utilities
  validateBlueprint,
  toCanonicalBlueprint,
  calculateTotalDuration,
  getAllTopics,
  validateModuleDependencies,
  normalizeBlueprint,

  // Metadata
  SCHEMA_VERSION,
  SCHEMA_METADATA,
} from '@/lib/schemas';

describe('Question Schemas', () => {
  describe('questionSchema', () => {
    it('should validate a valid question', () => {
      const validQuestion = {
        id: 'q1',
        type: 'text',
        question: 'What is your name?',
        required: true,
      };

      const result = questionSchema.parse(validQuestion);
      expect(result).toEqual(validQuestion);
    });

    it('should validate question with options', () => {
      const questionWithOptions = {
        id: 'q2',
        type: 'single_select',
        question: 'What is your favorite color?',
        options: [
          { value: 'red', label: 'Red' },
          { value: 'blue', label: 'Blue' },
        ],
      };

      const result = questionSchema.parse(questionWithOptions);
      expect(result.options).toHaveLength(2);
    });

    it('should validate question with scale config', () => {
      const scaleQuestion = {
        id: 'q3',
        type: 'scale',
        question: 'Rate your experience',
        scaleConfig: {
          min: 1,
          max: 10,
          step: 1,
          minLabel: 'Poor',
          maxLabel: 'Excellent',
        },
      };

      const result = questionSchema.parse(scaleQuestion);
      expect(result.scaleConfig?.min).toBe(1);
      expect(result.scaleConfig?.max).toBe(10);
    });

    it('should validate question with validation rules', () => {
      const questionWithValidation = {
        id: 'q4',
        type: 'email',
        question: 'Enter your email',
        validation: [
          { type: 'required', message: 'Email is required' },
          { type: 'email', message: 'Must be valid email' },
        ],
      };

      const result = questionSchema.parse(questionWithValidation);
      expect(result.validation).toHaveLength(2);
    });

    it('should validate question with conditional logic', () => {
      const questionWithConditional = {
        id: 'q5',
        type: 'text',
        question: 'Follow-up question',
        conditionalLogic: [
          {
            questionId: 'q1',
            operator: 'equals',
            value: 'yes',
            action: 'show',
          },
        ],
      };

      const result = questionSchema.parse(questionWithConditional);
      expect(result.conditionalLogic).toHaveLength(1);
    });

    it('should reject question without required fields', () => {
      const invalidQuestion = {
        id: 'q6',
        type: 'text',
        // missing question text
      };

      expect(() => questionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should reject question with empty question text', () => {
      const invalidQuestion = {
        id: 'q7',
        type: 'text',
        question: '',
      };

      expect(() => questionSchema.parse(invalidQuestion)).toThrow();
    });
  });

  describe('dynamicQuestionSchema', () => {
    it('should validate dynamic question without ID', () => {
      const dynamicQuestion = {
        type: 'textarea',
        question: 'Describe your experience',
      };

      const result = dynamicQuestionSchema.parse(dynamicQuestion);
      expect(result.question).toBe('Describe your experience');
      expect(result.required).toBe(false); // default value
    });

    it('should accept string options and normalize', () => {
      const questionWithStringOptions = {
        type: 'select',
        question: 'Choose one',
        options: ['Option 1', 'Option 2', 'Option 3'],
      };

      const result = dynamicQuestionSchema.parse(questionWithStringOptions);
      expect(result.options).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });
  });

  describe('questionGenerationInputSchema', () => {
    it('should validate generation input', () => {
      const input = {
        topic: 'JavaScript Fundamentals',
        count: 10,
        difficulty: 'medium' as const,
        includeDescriptions: true,
      };

      const result = questionGenerationInputSchema.parse(input);
      expect(result.topic).toBe('JavaScript Fundamentals');
      expect(result.count).toBe(10);
    });

    it('should apply default count', () => {
      const input = {
        topic: 'React Basics',
      };

      const result = questionGenerationInputSchema.parse(input);
      expect(result.count).toBe(10);
    });

    it('should reject count out of range', () => {
      const input = {
        topic: 'Test',
        count: 100, // max is 50
      };

      expect(() => questionGenerationInputSchema.parse(input)).toThrow();
    });

    it('should reject missing topic', () => {
      const input = {
        count: 5,
      };

      expect(() => questionGenerationInputSchema.parse(input)).toThrow();
    });
  });

  describe('questionGenerationOutputSchema', () => {
    it('should validate generation output', () => {
      const output = {
        questions: [
          {
            type: 'text',
            question: 'What is JavaScript?',
          },
          {
            type: 'single_select',
            question: 'Which is a JS framework?',
            options: ['React', 'Django'],
          },
        ],
        metadata: {
          topic: 'JavaScript',
          count: 2,
          generatedAt: Date.now(),
        },
      };

      const result = questionGenerationOutputSchema.parse(output);
      expect(result.questions).toHaveLength(2);
    });
  });

  describe('Question utilities', () => {
    it('validateDynamicQuestion should auto-generate ID', () => {
      const question = {
        type: 'text',
        question: 'Test question',
      };

      const result = validateDynamicQuestion(question);
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^q_/);
    });

    it('validateDynamicQuestion should normalize string options', () => {
      const question = {
        type: 'select',
        question: 'Choose',
        options: ['A', 'B', 'C'],
      };

      const result = validateDynamicQuestion(question);
      expect(result.options).toEqual([
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
        { value: 'C', label: 'C' },
      ]);
    });

    it('requiresOptions should return true for select types', () => {
      expect(requiresOptions('single_select')).toBe(true);
      expect(requiresOptions('multi_select')).toBe(true);
      expect(requiresOptions('radio_pills')).toBe(true);
      expect(requiresOptions('checkbox_cards')).toBe(true);
    });

    it('requiresOptions should return false for non-select types', () => {
      expect(requiresOptions('text')).toBe(false);
      expect(requiresOptions('number')).toBe(false);
      expect(requiresOptions('email')).toBe(false);
    });

    it('supportsScale should return true for scale types', () => {
      expect(supportsScale('scale')).toBe(true);
      expect(supportsScale('slider')).toBe(true);
      expect(supportsScale('enhanced_scale')).toBe(true);
      expect(supportsScale('rating')).toBe(true);
    });

    it('supportsScale should return false for non-scale types', () => {
      expect(supportsScale('text')).toBe(false);
      expect(supportsScale('select')).toBe(false);
    });

    it('supportsFileUpload should return true for file types', () => {
      expect(supportsFileUpload('file_upload')).toBe(true);
      expect(supportsFileUpload('image_upload')).toBe(true);
      expect(supportsFileUpload('signature')).toBe(true);
    });

    it('supportsFileUpload should return false for non-file types', () => {
      expect(supportsFileUpload('text')).toBe(false);
      expect(supportsFileUpload('number')).toBe(false);
    });
  });
});

describe('Blueprint Schemas', () => {
  describe('blueprintModuleSchema', () => {
    it('should validate a valid module', () => {
      const validModule = {
        title: 'Introduction to React',
        duration: 120,
        topics: ['JSX', 'Components', 'Props'],
        activities: ['Read documentation', 'Build a component'],
        assessments: ['Quiz on JSX', 'Component project'],
      };

      const result = blueprintModuleSchema.parse(validModule);
      expect(result.title).toBe('Introduction to React');
      expect(result.topics).toHaveLength(3);
    });

    it('should reject module with empty topics', () => {
      const invalidModule = {
        title: 'Test Module',
        duration: 60,
        topics: [],
        activities: ['Activity 1'],
        assessments: ['Assessment 1'],
      };

      expect(() => blueprintModuleSchema.parse(invalidModule)).toThrow();
    });

    it('should reject module with negative duration', () => {
      const invalidModule = {
        title: 'Test Module',
        duration: -10,
        topics: ['Topic 1'],
        activities: ['Activity 1'],
        assessments: ['Assessment 1'],
      };

      expect(() => blueprintModuleSchema.parse(invalidModule)).toThrow();
    });
  });

  describe('blueprintResourceSchema', () => {
    it('should validate resource with URL', () => {
      const resource = {
        name: 'React Documentation',
        type: 'documentation' as const,
        url: 'https://react.dev',
        description: 'Official React docs',
      };

      const result = blueprintResourceSchema.parse(resource);
      expect(result.url).toBe('https://react.dev');
    });

    it('should reject resource with invalid URL', () => {
      const resource = {
        name: 'Test Resource',
        type: 'article' as const,
        url: 'not-a-valid-url',
      };

      expect(() => blueprintResourceSchema.parse(resource)).toThrow();
    });
  });

  describe('blueprintSchema', () => {
    it('should validate a complete blueprint', () => {
      const blueprint = {
        title: 'React Learning Path',
        overview: 'Learn React from scratch',
        learningObjectives: ['Understand JSX', 'Build components', 'Manage state'],
        modules: [
          {
            title: 'Module 1',
            duration: 120,
            topics: ['JSX', 'Components'],
            activities: ['Read docs', 'Build app'],
            assessments: ['Quiz', 'Project'],
          },
        ],
        resources: [
          {
            name: 'React Docs',
            type: 'documentation' as const,
            url: 'https://react.dev',
          },
        ],
        difficulty: 'intermediate' as const,
      };

      const result = blueprintSchema.parse(blueprint);
      expect(result.title).toBe('React Learning Path');
      expect(result.modules).toHaveLength(1);
      expect(result.learningObjectives).toHaveLength(3);
    });

    it('should reject blueprint without modules', () => {
      const blueprint = {
        title: 'Test Blueprint',
        overview: 'Test',
        learningObjectives: ['Objective 1'],
        modules: [],
      };

      expect(() => blueprintSchema.parse(blueprint)).toThrow();
    });

    it('should reject blueprint without learning objectives', () => {
      const blueprint = {
        title: 'Test Blueprint',
        overview: 'Test',
        learningObjectives: [],
        modules: [
          {
            title: 'Module 1',
            duration: 60,
            topics: ['Topic 1'],
            activities: ['Activity 1'],
            assessments: ['Assessment 1'],
          },
        ],
      };

      expect(() => blueprintSchema.parse(blueprint)).toThrow();
    });
  });

  describe('blueprintGenerationInputSchema', () => {
    it('should validate generation input', () => {
      const input = {
        topic: 'TypeScript Advanced Patterns',
        targetAudience: 'Intermediate developers',
        difficulty: 'advanced' as const,
        duration: 40,
        moduleCount: 8,
      };

      const result = blueprintGenerationInputSchema.parse(input);
      expect(result.topic).toBe('TypeScript Advanced Patterns');
      expect(result.moduleCount).toBe(8);
    });

    it('should apply default moduleCount', () => {
      const input = {
        topic: 'JavaScript Basics',
      };

      const result = blueprintGenerationInputSchema.parse(input);
      expect(result.moduleCount).toBe(5);
    });

    it('should reject moduleCount out of range', () => {
      const input = {
        topic: 'Test',
        moduleCount: 25, // max is 20
      };

      expect(() => blueprintGenerationInputSchema.parse(input)).toThrow();
    });
  });

  describe('Blueprint utilities', () => {
    const sampleBlueprint = {
      title: 'Test Blueprint',
      overview: 'Test overview',
      learningObjectives: ['Objective 1', 'Objective 2'],
      modules: [
        {
          id: 'mod1',
          title: 'Module 1',
          duration: 60,
          topics: ['Topic A', 'Topic B'],
          activities: ['Activity 1'],
          assessments: ['Assessment 1'],
        },
        {
          id: 'mod2',
          title: 'Module 2',
          duration: 90,
          topics: ['Topic B', 'Topic C'],
          activities: ['Activity 2'],
          assessments: ['Assessment 2'],
          prerequisites: ['mod1'],
        },
      ],
    };

    it('calculateTotalDuration should sum module durations', () => {
      const blueprint = validateBlueprint(sampleBlueprint);
      const total = calculateTotalDuration(blueprint);
      expect(total).toBe(150); // 60 + 90
    });

    it('getAllTopics should return unique topics', () => {
      const blueprint = validateBlueprint(sampleBlueprint);
      const topics = getAllTopics(blueprint);
      expect(topics).toHaveLength(3); // A, B, C (B appears twice but should be unique)
      expect(topics).toContain('Topic A');
      expect(topics).toContain('Topic B');
      expect(topics).toContain('Topic C');
    });

    it('validateModuleDependencies should pass for valid dependencies', () => {
      const blueprint = validateBlueprint(sampleBlueprint);
      const result = validateModuleDependencies(blueprint);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validateModuleDependencies should fail for invalid dependencies', () => {
      const invalidBlueprint = {
        ...sampleBlueprint,
        modules: [
          ...sampleBlueprint.modules,
          {
            title: 'Module 3',
            duration: 30,
            topics: ['Topic D'],
            activities: ['Activity 3'],
            assessments: ['Assessment 3'],
            prerequisites: ['nonexistent_module'],
          },
        ],
      };

      const blueprint = validateBlueprint(invalidBlueprint);
      const result = validateModuleDependencies(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('normalizeBlueprint should add IDs and timestamps', () => {
      const blueprintWithoutIds = {
        title: 'Test',
        overview: 'Test',
        learningObjectives: ['Obj 1'],
        modules: [
          {
            title: 'Module 1',
            duration: 60,
            topics: ['Topic 1'],
            activities: ['Activity 1'],
            assessments: ['Assessment 1'],
          },
        ],
      };

      const normalized = normalizeBlueprint(blueprintWithoutIds);
      expect(normalized.id).toBeDefined();
      expect(normalized.createdAt).toBeDefined();
      expect(normalized.updatedAt).toBeDefined();
      expect(normalized.version).toBe('1.0');
      expect(normalized.modules[0].id).toBe('module_1');
    });

    it('toCanonicalBlueprint should convert full blueprint', () => {
      const fullBlueprint = {
        ...sampleBlueprint,
        modules: [
          {
            ...sampleBlueprint.modules[0],
            content: [
              {
                type: 'text' as const,
                title: 'Introduction',
                content: 'Welcome',
                duration: 10,
                order: 1,
              },
            ],
            quizzes: [
              {
                title: 'Module Quiz',
                questions: ['Q1', 'Q2'],
                passingScore: 80,
              },
            ],
          },
          sampleBlueprint.modules[1],
        ],
        assessmentStrategy: {
          formative: ['Quizzes'],
          summative: ['Final Project'],
        },
      };

      const canonical = toCanonicalBlueprint(fullBlueprint);
      expect(canonical.modules[0].activities.length).toBeGreaterThan(1);
      expect(canonical.modules[0].assessments.length).toBeGreaterThan(1);
      expect(canonical.metadata?.hasAssessmentStrategy).toBe(true);
    });
  });
});

describe('Schema Metadata', () => {
  it('should export schema version', () => {
    expect(SCHEMA_VERSION).toBe('1.0.0');
  });

  it('should export schema metadata', () => {
    expect(SCHEMA_METADATA.version).toBe('1.0.0');
    expect(SCHEMA_METADATA.compatibility.aiSdk).toBe('^5.0.0');
    expect(SCHEMA_METADATA.compatibility.zod).toBe('^3.25.76');
  });
});
