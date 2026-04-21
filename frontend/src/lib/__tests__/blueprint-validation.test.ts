import { describe, it, expect } from 'vitest';
import { 
  stripMarkdownCodeFences, 
  normalizeBlueprintStructure,
  parseAndValidateJSON
} from '../claude/validation';

describe('Blueprint AI Data Validation', () => {
  
  describe('stripMarkdownCodeFences', () => {
    it('should remove json code fences', () => {
      const input = '```json\n{"test": true}\n```';
      expect(stripMarkdownCodeFences(input)).toBe('{"test": true}');
    });

    it('should remove plain code fences', () => {
      const input = '```\n{"test": true}\n```';
      expect(stripMarkdownCodeFences(input)).toBe('{"test": true}');
    });
  });

  describe('normalizeBlueprintStructure', () => {
    it('should add default displayType if missing', () => {
      const blueprint = {
        metadata: {
          title: 'Test',
          organization: 'Test Org',
          role: 'Designer',
          generated_at: new Date().toISOString()
        },
        learning_objectives: {
          objectives: []
        }
      };

      const normalized = normalizeBlueprintStructure(blueprint);
      expect(normalized.learning_objectives.displayType).toBe('infographic');
    });

    it('should infer timeline for phase-based data', () => {
      const section = {
        phases: [{ name: 'Phase 1', start_date: '2024-01-01' }]
      };
      const blueprint = { metadata: {}, implementation: section };
      const normalized = normalizeBlueprintStructure(blueprint);
      expect(normalized.implementation.displayType).toBe('timeline');
    });
  });

  describe('JSON Repair (via parseAndValidateJSON)', () => {
    it('should parse valid JSON normally', () => {
      const json = '{"valid": true}';
      expect(parseAndValidateJSON(json)).toEqual({ valid: true });
    });

    it('should repair slightly truncated objects', () => {
      const truncated = '{"incomplete": "value"';
      // The repair logic should add the missing }
      expect(parseAndValidateJSON(truncated)).toEqual({ incomplete: "value" });
    });

    it('should handle preambles from LLMs', () => {
      const withPreamble = 'Here is your blueprint: {"data": 123}';
      expect(parseAndValidateJSON(withPreamble)).toEqual({ data: 123 });
    });
  });
});
