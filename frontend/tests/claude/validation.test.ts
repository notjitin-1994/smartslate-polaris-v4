/**
 * Tests for Gemini Response Validation
 */

import { describe, it, expect } from 'vitest';
import {
  stripMarkdownCodeFences,
  parseAndValidateJSON,
  validateBlueprintStructure,
  normalizeBlueprintStructure,
  validateAndNormalizeBlueprint,
  ValidationError,
} from '@/lib/claude/validation';

describe('Gemini Validation', () => {
  describe('stripMarkdownCodeFences', () => {
    it('should remove ```json code fences', () => {
      const text = '```json\n{"key": "value"}\n```';
      const result = stripMarkdownCodeFences(text);
      expect(result).toBe('{"key": "value"}');
    });

    it('should remove ``` code fences without language', () => {
      const text = '```\n{"key": "value"}\n```';
      const result = stripMarkdownCodeFences(text);
      expect(result).toBe('{"key": "value"}');
    });

    it('should handle uppercase JSON tag', () => {
      const text = '```JSON\n{"key": "value"}\n```';
      const result = stripMarkdownCodeFences(text);
      expect(result).toBe('{"key": "value"}');
    });

    it('should not modify text without code fences', () => {
      const text = '{"key": "value"}';
      const result = stripMarkdownCodeFences(text);
      expect(result).toBe('{"key": "value"}');
    });

    it('should trim whitespace', () => {
      const text = '  \n{"key": "value"}\n  ';
      const result = stripMarkdownCodeFences(text);
      expect(result).toBe('{"key": "value"}');
    });
  });

  describe('parseAndValidateJSON', () => {
    it('should parse valid JSON', () => {
      const text = '{"key": "value"}';
      const result = parseAndValidateJSON(text);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse complex JSON structures', () => {
      const text = JSON.stringify({
        nested: {
          array: [1, 2, 3],
          object: { a: 'b' },
        },
      });

      const result = parseAndValidateJSON(text);
      expect(result).toHaveProperty('nested.array');
      expect(result).toHaveProperty('nested.object.a', 'b');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => parseAndValidateJSON('')).toThrow(ValidationError);
      expect(() => parseAndValidateJSON('')).toThrow('Response text is empty');
    });

    it('should throw ValidationError for non-string input', () => {
      expect(() => parseAndValidateJSON(null as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid JSON', () => {
      const text = 'not valid json';

      try {
        parseAndValidateJSON(text);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('INVALID_JSON');
      }
    });

    it('should strip markdown code fences before parsing', () => {
      const text = '```json\n{"key": "value"}\n```';
      const result = parseAndValidateJSON(text);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle JSON with markdown at end', () => {
      const text = '{"key": "value"}\n```';
      const result = parseAndValidateJSON(text);
      expect(result).toEqual({ key: 'value' });
    });
  });

  describe('validateBlueprintStructure', () => {
    const validBlueprint = {
      metadata: {
        title: 'Test Blueprint',
        organization: 'Acme Corp',
        role: 'Manager',
        generated_at: '2025-10-01T12:00:00Z',
      },
      executive_summary: {
        content: 'Summary text',
        displayType: 'markdown',
      },
      learning_objectives: {
        objectives: [],
        displayType: 'infographic',
      },
    };

    it('should validate valid blueprint structure', () => {
      expect(() => validateBlueprintStructure(validBlueprint)).not.toThrow();
    });

    it('should throw for non-object blueprint', () => {
      expect(() => validateBlueprintStructure(null)).toThrow(ValidationError);
      expect(() => validateBlueprintStructure('string')).toThrow(ValidationError);
      expect(() => validateBlueprintStructure([])).toThrow(ValidationError);
    });

    it('should throw for missing metadata', () => {
      const blueprint = {
        executive_summary: { content: 'Text', displayType: 'markdown' },
      };

      try {
        validateBlueprintStructure(blueprint);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('MISSING_METADATA');
      }
    });

    it('should throw for missing metadata fields', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          // Missing organization, role, generated_at
        },
        executive_summary: { content: 'Text', displayType: 'markdown' },
      };

      try {
        validateBlueprintStructure(blueprint);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('MISSING_METADATA_FIELD');
      }
    });

    it('should throw for blueprint with no sections', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Acme',
          role: 'Manager',
          generated_at: '2025-10-01T12:00:00Z',
        },
      };

      try {
        validateBlueprintStructure(blueprint);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('NO_SECTIONS');
      }
    });

    it('should not throw for sections missing displayType', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Acme',
          role: 'Manager',
          generated_at: '2025-10-01T12:00:00Z',
        },
        executive_summary: {
          content: 'Text',
          // Missing displayType
        },
      };

      // Should log warning but not throw
      expect(() => validateBlueprintStructure(blueprint)).not.toThrow();
    });
  });

  describe('normalizeBlueprintStructure', () => {
    it('should add default displayType to sections missing it', () => {
      const blueprint = {
        metadata: { title: 'Test' },
        executive_summary: {
          content: 'Text',
          // Missing displayType
        },
        learning_objectives: {
          objectives: [],
          displayType: 'infographic', // Has displayType
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.executive_summary.displayType).toBe('markdown');
      expect(normalized.learning_objectives.displayType).toBe('infographic');
    });

    it('should not modify existing displayType', () => {
      const blueprint = {
        metadata: { title: 'Test' },
        executive_summary: {
          content: 'Text',
          displayType: 'chart',
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.executive_summary.displayType).toBe('chart');
    });

    it('should not modify non-object sections', () => {
      const blueprint = {
        metadata: { title: 'Test' },
        some_string: 'value',
        some_number: 42,
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.some_string).toBe('value');
      expect(normalized.some_number).toBe(42);
    });

    it('should not modify metadata', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Acme',
        },
        executive_summary: {
          content: 'Text',
        },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized.metadata).not.toHaveProperty('displayType');
    });

    it('should return unchanged for non-object input', () => {
      expect(normalizeBlueprintStructure(null)).toBe(null);
      expect(normalizeBlueprintStructure('string')).toBe('string');
    });

    it('should create a shallow copy', () => {
      const blueprint = {
        metadata: { title: 'Test' },
        section: { content: 'Text' },
      };

      const normalized = normalizeBlueprintStructure(blueprint);

      expect(normalized).not.toBe(blueprint);
      expect(normalized.section).toBe(blueprint.section); // Shallow copy
    });
  });

  describe('validateAndNormalizeBlueprint', () => {
    const validBlueprintJSON = JSON.stringify({
      metadata: {
        title: 'Test',
        organization: 'Acme',
        role: 'Manager',
        generated_at: '2025-10-01T12:00:00Z',
      },
      executive_summary: {
        content: 'Text',
        // Missing displayType
      },
    });

    it('should parse, validate, and normalize valid blueprint', () => {
      const result = validateAndNormalizeBlueprint(validBlueprintJSON);

      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('executive_summary');
      expect(result.executive_summary.displayType).toBe('markdown');
    });

    it('should handle markdown code fences', () => {
      const text = '```json\n' + validBlueprintJSON + '\n```';
      const result = validateAndNormalizeBlueprint(text);

      expect(result).toHaveProperty('metadata');
      expect(result.executive_summary.displayType).toBe('markdown');
    });

    it('should throw for invalid JSON', () => {
      expect(() => validateAndNormalizeBlueprint('not json')).toThrow(ValidationError);
    });

    it('should throw for invalid structure', () => {
      const invalidJSON = JSON.stringify({ no_metadata: true });
      expect(() => validateAndNormalizeBlueprint(invalidJSON)).toThrow(ValidationError);
    });

    it('should handle complex nested structures', () => {
      const complexBlueprint = {
        metadata: {
          title: 'Test',
          organization: 'Acme',
          role: 'Manager',
          generated_at: '2025-10-01T12:00:00Z',
        },
        learning_objectives: {
          objectives: [
            { id: 'obj1', title: 'Objective 1' },
            { id: 'obj2', title: 'Objective 2' },
          ],
          displayType: 'infographic',
        },
        resources: {
          human_resources: [],
          budget: { total: 50000 },
          // Missing displayType - should be inferred as 'table' because it has budget and human_resources
        },
      };

      const result = validateAndNormalizeBlueprint(JSON.stringify(complexBlueprint));

      expect(result.learning_objectives.displayType).toBe('infographic');
      expect(result.resources.displayType).toBe('table'); // Corrected: resources should be 'table'
    });
  });

  describe('ValidationError', () => {
    it('should create error with message and code', () => {
      const error = new ValidationError('Test message', 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ValidationError');
    });

    it('should include details', () => {
      const details = { extra: 'info' };
      const error = new ValidationError('Test', 'CODE', details);

      expect(error.details).toEqual(details);
    });
  });
});
