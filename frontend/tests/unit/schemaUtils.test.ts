/**
 * Schema Utilities Tests
 *
 * Tests for versioning, normalization, transformation, and validation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  // Versioning
  SchemaVersion,
  detectSchemaVersion,
  addVersionMetadata,

  // Normalization
  normalizeString,
  normalizeArray,
  normalizeQuestion,
  normalizeBlueprintUtil as normalizeBlueprint,

  // Transformation
  transformQuestionV1ToV1_1,
  transformBlueprintV1ToV1_1,
  migrateToLatest,
  batchNormalizeQuestions,

  // Validation
  validateQuestionCompleteness,
  validateBlueprintCompleteness,
  safeValidate,

  // Utilities
  schemasEqual,
  hashSchema,
  mergeQuestions,
  mergeBlueprints,
  getBlueprintStats,

  // Schemas for testing
  questionSchema,
} from '@/lib/schemas';

describe('Versioning Utilities', () => {
  describe('detectSchemaVersion', () => {
    it('should detect v1.0 for data without version', () => {
      const data = { title: 'Test' };
      expect(detectSchemaVersion(data)).toBe(SchemaVersion.V1_0);
    });

    it('should detect v1.1 from version field', () => {
      const data = { version: '1.1.0' };
      expect(detectSchemaVersion(data)).toBe(SchemaVersion.V1_1);
    });

    it('should detect v2.0 from version field', () => {
      const data = { version: '2.0.0' };
      expect(detectSchemaVersion(data)).toBe(SchemaVersion.V2_0);
    });

    it('should detect v2.0 from metadata', () => {
      const data = {
        metadata: {
          schemaVersion: '2.0',
        },
      };
      expect(detectSchemaVersion(data)).toBe(SchemaVersion.V2_0);
    });
  });

  describe('addVersionMetadata', () => {
    it('should add version metadata to data', () => {
      const data = { name: 'Test' };
      const result = addVersionMetadata(data, SchemaVersion.V1_0);

      expect(result.version).toBe(SchemaVersion.V1_0);
      expect(result.versionMetadata).toBeDefined();
      expect(result.versionMetadata.version).toBe(SchemaVersion.V1_0);
      expect(result.versionMetadata.createdAt).toBeGreaterThan(0);
    });
  });
});

describe('Normalization Utilities', () => {
  describe('normalizeString', () => {
    it('should trim and lowercase strings', () => {
      expect(normalizeString('  Hello World  ')).toBe('hello world');
      expect(normalizeString('TEST')).toBe('test');
    });
  });

  describe('normalizeArray', () => {
    it('should remove duplicates', () => {
      const arr = ['a', 'b', 'a', 'c', 'b'];
      const result = normalizeArray(arr);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should remove empty strings', () => {
      const arr = ['a', '', 'b', '  ', 'c'];
      const result = normalizeArray(arr);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should remove null and undefined', () => {
      const arr = ['a', null, 'b', undefined, 'c'];
      const result = normalizeArray(arr);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('normalizeQuestion', () => {
    it('should trim id and question text', () => {
      const question = {
        id: '  q1  ',
        type: 'text' as const,
        question: '  What is your name?  ',
      };

      const normalized = normalizeQuestion(question);
      expect(normalized.id).toBe('q1');
      expect(normalized.question).toBe('What is your name?');
    });

    it('should set required to false if undefined', () => {
      const question = {
        id: 'q1',
        type: 'text' as const,
        question: 'Test',
      };

      const normalized = normalizeQuestion(question);
      expect(normalized.required).toBe(false);
    });

    it('should normalize options array', () => {
      const question = {
        id: 'q1',
        type: 'select' as const,
        question: 'Choose one',
        options: [
          { value: 'a', label: 'A' },
          { value: 'a', label: 'A' }, // duplicate
          { value: 'b', label: 'B' },
        ],
      };

      const normalized = normalizeQuestion(question);
      expect(normalized.options).toHaveLength(2);
    });
  });

  describe('normalizeBlueprint', () => {
    it('should trim title and overview', () => {
      const blueprint = {
        title: '  Test Blueprint  ',
        overview: '  Overview text  ',
        learningObjectives: ['Objective 1'],
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

      const normalized = normalizeBlueprint(blueprint);
      expect(normalized.title).toBe('Test Blueprint');
      expect(normalized.overview).toBe('Overview text');
    });

    it('should normalize learning objectives', () => {
      const blueprint = {
        title: 'Test',
        overview: 'Overview',
        learningObjectives: ['Obj 1', 'Obj 1', 'Obj 2'],
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

      const normalized = normalizeBlueprint(blueprint);
      expect(normalized.learningObjectives).toHaveLength(2);
    });
  });
});

describe('Transformation Utilities', () => {
  describe('transformQuestionV1ToV1_1', () => {
    it('should add migration metadata', () => {
      const question = {
        id: 'q1',
        type: 'text' as const,
        question: 'Test',
      };

      const transformed = transformQuestionV1ToV1_1(question);
      expect(transformed.metadata).toBeDefined();
      expect(transformed.metadata?.migratedFrom).toBe(SchemaVersion.V1_0);
      expect(transformed.metadata?.migrationDate).toBeGreaterThan(0);
    });
  });

  describe('transformBlueprintV1ToV1_1', () => {
    it('should add tags and difficulty', () => {
      const blueprint = {
        title: 'Test',
        overview: 'Overview',
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

      const transformed = transformBlueprintV1ToV1_1(blueprint);
      expect(transformed.tags).toEqual([]);
      expect(transformed.difficulty).toBe('intermediate');
      expect(transformed.metadata?.migratedFrom).toBe(SchemaVersion.V1_0);
    });
  });

  describe('migrateToLatest', () => {
    it('should migrate question to latest version', () => {
      const oldQuestion = {
        id: 'q1',
        type: 'text',
        question: 'Test',
      };

      const migrated = migrateToLatest('question', oldQuestion);
      expect(migrated.id).toBe('q1');
      expect(migrated.required).toBe(false);
    });

    it('should migrate blueprint to latest version', () => {
      const oldBlueprint = {
        title: 'Test',
        overview: 'Overview',
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

      const migrated = migrateToLatest('blueprint', oldBlueprint);
      expect(migrated.title).toBe('Test');
      expect(migrated.tags).toEqual([]);
      expect(migrated.difficulty).toBe('intermediate');
    });
  });

  describe('batchNormalizeQuestions', () => {
    it('should normalize multiple questions', () => {
      const questions = [
        { id: 'q1', type: 'text', question: 'Q1' },
        { id: 'q2', type: 'number', question: 'Q2' },
      ];

      const normalized = batchNormalizeQuestions(questions);
      expect(normalized).toHaveLength(2);
      expect(normalized[0].required).toBe(false);
      expect(normalized[1].required).toBe(false);
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateQuestionCompleteness', () => {
    it('should validate question with required options', () => {
      const question = {
        id: 'q1',
        type: 'select' as const,
        question: 'Choose',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      };

      const result = validateQuestionCompleteness(question);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if select question has no options', () => {
      const question = {
        id: 'q1',
        type: 'select' as const,
        question: 'Choose',
      };

      const result = validateQuestionCompleteness(question);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail if scale question has invalid config', () => {
      const question = {
        id: 'q1',
        type: 'scale' as const,
        question: 'Rate',
        scaleConfig: {
          min: 5,
          max: 1, // invalid: min >= max
        },
      };

      const result = validateQuestionCompleteness(question);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateBlueprintCompleteness', () => {
    it('should validate complete blueprint', () => {
      const blueprint = {
        title: 'Test',
        overview: 'Overview',
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

      const result = validateBlueprintCompleteness(blueprint);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail if blueprint has no modules', () => {
      const blueprint = {
        title: 'Test',
        overview: 'Overview',
        learningObjectives: ['Obj 1'],
        modules: [],
      };

      const result = validateBlueprintCompleteness(blueprint);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn if blueprint has no resources', () => {
      const blueprint = {
        title: 'Test',
        overview: 'Overview',
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

      const result = validateBlueprintCompleteness(blueprint);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('safeValidate', () => {
    it('should return success for valid data', () => {
      const data = {
        id: 'q1',
        type: 'text',
        question: 'Test',
      };

      const result = safeValidate(questionSchema, data);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for invalid data', () => {
      const data = {
        id: 'q1',
        type: 'text',
        // missing question
      };

      const result = safeValidate(questionSchema, data);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.issues).toBeDefined();
    });
  });
});

describe('Utility Functions', () => {
  describe('schemasEqual', () => {
    it('should return true for equal schemas', () => {
      const schema1 = { a: 1, b: 2 };
      const schema2 = { a: 1, b: 2 };
      expect(schemasEqual(schema1, schema2)).toBe(true);
    });

    it('should return false for different schemas', () => {
      const schema1 = { a: 1, b: 2 };
      const schema2 = { a: 1, b: 3 };
      expect(schemasEqual(schema1, schema2)).toBe(false);
    });
  });

  describe('hashSchema', () => {
    it('should generate consistent hash', () => {
      const data = { a: 1, b: 2 };
      const hash1 = hashSchema(data);
      const hash2 = hashSchema(data);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different data', () => {
      const data1 = { a: 1 };
      const data2 = { a: 2 };
      expect(hashSchema(data1)).not.toBe(hashSchema(data2));
    });
  });

  describe('mergeQuestions', () => {
    it('should merge question updates', () => {
      const base = {
        id: 'q1',
        type: 'text' as const,
        question: 'Original',
        required: false,
      };

      const updates = {
        question: 'Updated',
        required: true,
      };

      const merged = mergeQuestions(base, updates);
      expect(merged.question).toBe('Updated');
      expect(merged.required).toBe(true);
      expect(merged.id).toBe('q1');
    });
  });

  describe('mergeBlueprints', () => {
    it('should merge blueprint updates', () => {
      const base = {
        title: 'Original',
        overview: 'Overview',
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

      const updates = {
        title: 'Updated',
      };

      const merged = mergeBlueprints(base, updates);
      expect(merged.title).toBe('Updated');
      expect(merged.overview).toBe('Overview');
    });
  });

  describe('getBlueprintStats', () => {
    it('should calculate blueprint statistics', () => {
      const blueprint = {
        title: 'Test',
        overview: 'Overview',
        learningObjectives: ['Obj 1', 'Obj 2'],
        modules: [
          {
            title: 'Module 1',
            duration: 60,
            topics: ['Topic 1', 'Topic 2'],
            activities: ['Activity 1'],
            assessments: ['Assessment 1'],
          },
          {
            title: 'Module 2',
            duration: 90,
            topics: ['Topic 3'],
            activities: ['Activity 2', 'Activity 3'],
            assessments: ['Assessment 2'],
          },
        ],
        resources: [
          { name: 'Resource 1', type: 'article' as const },
          { name: 'Resource 2', type: 'video' as const },
        ],
      };

      const stats = getBlueprintStats(blueprint);
      expect(stats.totalModules).toBe(2);
      expect(stats.totalTopics).toBe(3);
      expect(stats.totalActivities).toBe(3);
      expect(stats.totalAssessments).toBe(2);
      expect(stats.totalDuration).toBe(150);
      expect(stats.totalResources).toBe(2);
      expect(stats.averageDurationPerModule).toBe(75);
    });
  });
});
