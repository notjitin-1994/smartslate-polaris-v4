/**
 * Comprehensive Tests for Dynamic Question Validation and Sanitization
 * Tests the complete data flow from question generation to answer submission
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateStandardOptionValue,
  normalizeOptionValue,
  normalizeQuestionOptions,
  normalizeSectionQuestions,
  validatePartialAnswers,
  validateCompleteAnswers,
  type Question,
  type Section,
  type Option,
} from '@/lib/validation/dynamicQuestionSchemas';

describe('Option Value Generation and Normalization', () => {
  describe('generateStandardOptionValue', () => {
    it('should convert labels to lowercase hyphenated values', () => {
      expect(generateStandardOptionValue('Knowledge Transfer')).toBe('knowledge-transfer');
      expect(generateStandardOptionValue('Very Satisfied')).toBe('very-satisfied');
      expect(generateStandardOptionValue('3-5 years')).toBe('3-5-years');
    });

    it('should handle special characters', () => {
      expect(generateStandardOptionValue('Yes!')).toBe('yes');
      expect(generateStandardOptionValue('Option #1')).toBe('option-1');
      expect(generateStandardOptionValue('A & B')).toBe('a-b');
    });

    it('should handle multiple spaces and underscores', () => {
      expect(generateStandardOptionValue('Long   Spacing   Text')).toBe('long-spacing-text');
      expect(generateStandardOptionValue('under_score_text')).toBe('under-score-text');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(generateStandardOptionValue('- Bullet point')).toBe('bullet-point');
      expect(generateStandardOptionValue('Text -')).toBe('text');
    });
  });

  describe('normalizeOptionValue', () => {
    it('should keep well-formatted values as-is', () => {
      expect(normalizeOptionValue('knowledge-transfer', 'Knowledge Transfer')).toBe(
        'knowledge-transfer'
      );
      expect(normalizeOptionValue('yes', 'Yes')).toBe('yes');
    });

    it('should generate from label if value is poorly formatted', () => {
      expect(normalizeOptionValue('Knowledge Transfer', 'Knowledge Transfer')).toBe(
        'knowledge-transfer'
      );
      expect(normalizeOptionValue('YES!', 'Yes')).toBe('yes');
    });

    it('should normalize values with spaces/special chars', () => {
      expect(normalizeOptionValue('Option 1', 'Option 1')).toBe('option-1');
      expect(normalizeOptionValue('Very Satisfied', 'Very Satisfied')).toBe('very-satisfied');
    });
  });

  describe('normalizeQuestionOptions', () => {
    it('should normalize all options in a question', () => {
      const question: Question = {
        id: 'q1',
        label: 'Test Question',
        type: 'radio_pills',
        required: true,
        options: [
          { value: 'Knowledge Transfer', label: 'Knowledge Transfer', disabled: false },
          { value: 'Skills Development', label: 'Skills Development', disabled: false },
          { value: 'Performance Improvement', label: 'Performance Improvement', disabled: false },
        ],
      };

      const normalized = normalizeQuestionOptions(question);

      expect(normalized.options![0].value).toBe('knowledge-transfer');
      expect(normalized.options![1].value).toBe('skills-development');
      expect(normalized.options![2].value).toBe('performance-improvement');
      // Labels should remain unchanged
      expect(normalized.options![0].label).toBe('Knowledge Transfer');
    });

    it('should handle questions without options', () => {
      const question: Question = {
        id: 'q1',
        label: 'Text Question',
        type: 'text',
        required: false,
      };

      const normalized = normalizeQuestionOptions(question);
      expect(normalized).toEqual(question);
    });
  });

  describe('normalizeSectionQuestions', () => {
    it('should normalize all questions in all sections', () => {
      const sections: Section[] = [
        {
          id: 'section1',
          title: 'Section 1',
          order: 0,
          questions: [
            {
              id: 'q1',
              label: 'Question 1',
              type: 'radio_pills',
              required: true,
              options: [
                { value: 'Option One', label: 'Option One', disabled: false },
                { value: 'Option Two', label: 'Option Two', disabled: false },
              ],
            },
          ],
        },
      ];

      const normalized = normalizeSectionQuestions(sections);

      expect(normalized[0].questions[0].options![0].value).toBe('option-one');
      expect(normalized[0].questions[0].options![1].value).toBe('option-two');
    });
  });
});

describe('Answer Validation and Sanitization', () => {
  let sections: Section[];

  beforeEach(() => {
    sections = [
      {
        id: 'section1',
        title: 'Learning Goals',
        order: 0,
        questions: [
          {
            id: 'learning-focus',
            label: 'What is your primary learning focus?',
            type: 'checkbox_pills',
            required: true,
            options: [
              { value: 'knowledge', label: 'Knowledge Transfer', disabled: false },
              { value: 'skills', label: 'Skills Development', disabled: false },
              { value: 'performance', label: 'Performance Improvement', disabled: false },
            ],
            validation: [
              {
                rule: 'minSelections',
                value: 1,
                message: 'Please select at least one option',
              },
            ],
          },
          {
            id: 'experience-level',
            label: 'What is your experience level?',
            type: 'radio_pills',
            required: true,
            options: [
              { value: 'beginner', label: 'Beginner', disabled: false },
              { value: 'intermediate', label: 'Intermediate', disabled: false },
              { value: 'advanced', label: 'Advanced', disabled: false },
            ],
          },
          {
            id: 'has-budget',
            label: 'Do you have a budget allocated?',
            type: 'toggle_switch',
            required: true,
            options: [
              { value: 'no', label: 'No', disabled: false },
              { value: 'yes', label: 'Yes', disabled: false },
            ],
          },
        ],
      },
    ];
  });

  describe('Multi-Select Sanitization', () => {
    it('should accept exact value matches', () => {
      const answers = {
        'learning-focus': ['knowledge', 'skills'],
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should normalize case-insensitive matches', () => {
      const answers = {
        'learning-focus': ['Knowledge', 'SKILLS'],
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should normalize label matches to values', () => {
      const answers = {
        'learning-focus': ['Knowledge Transfer', 'Skills Development'],
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should handle fuzzy matching (spaces/hyphens)', () => {
      const answers = {
        'learning-focus': ['know ledge', 'skill-s'],
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should filter out completely invalid values but keep valid ones', () => {
      const answers = {
        'learning-focus': ['knowledge', 'invalid-option', 'skills'],
        'experience-level': 'intermediate',
        'has-budget': 'yes',
      };

      const result = validateCompleteAnswers(answers, sections, true);
      // Should have sanitized out invalid-option but kept knowledge and skills
      expect(result.sanitizedAnswers?.['learning-focus']).toEqual(['knowledge', 'skills']);
      // Should be valid since we still have required fields filled
      expect(result.valid).toBe(true);
      expect(result.missingRequired).toEqual([]);
    });

    it('should reject empty array for required multi-select', () => {
      const answers = {
        'learning-focus': [],
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain('learning-focus');
    });

    it('should preserve user data even when no exact matches', () => {
      // User submitted values that are very close but not exact
      const answers = {
        'learning-focus': ['Knowledge-Transfer', 'Skills_Development'],
      };

      const result = validatePartialAnswers(answers, sections, true);
      // Fuzzy matching should find these
      expect(result.valid).toBe(true);
    });
  });

  describe('Single-Select Sanitization', () => {
    it('should accept exact value matches', () => {
      const answers = {
        'experience-level': 'intermediate',
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should normalize case-insensitive matches', () => {
      const answers = {
        'experience-level': 'Intermediate',
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should normalize label matches to values', () => {
      const answers = {
        'experience-level': 'Beginner',
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should handle fuzzy matching for single select', () => {
      const answers = {
        'experience-level': 'Inter mediate',
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });
  });

  describe('Toggle Switch Sanitization', () => {
    it('should accept exact value matches', () => {
      const answers = {
        'has-budget': 'yes',
      };

      const result = validatePartialAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
    });

    it('should normalize common yes patterns', () => {
      const testValues = ['YES', 'Yes', 'true', 'True', '1', 'on', 'enabled'];

      testValues.forEach((val) => {
        const answers = {
          'has-budget': val,
        };

        const result = validatePartialAnswers(answers, sections, true);
        expect(result.valid).toBe(true);
      });
    });

    it('should normalize common no patterns', () => {
      const testValues = ['NO', 'No', 'false', 'False', '0', 'off', 'disabled'];

      testValues.forEach((val) => {
        const answers = {
          'has-budget': val,
        };

        const result = validatePartialAnswers(answers, sections, true);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Complete Validation', () => {
    it('should validate all required fields', () => {
      const answers = {
        'learning-focus': ['knowledge'],
        'experience-level': 'intermediate',
        'has-budget': 'yes',
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
      expect(result.missingRequired).toEqual([]);
    });

    it('should catch missing required fields', () => {
      const answers = {
        'learning-focus': ['knowledge'],
        // Missing: experience-level, has-budget
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain('experience-level');
      expect(result.missingRequired).toContain('has-budget');
    });

    it('should provide helpful error messages for invalid options', () => {
      const answers = {
        'learning-focus': ['completely-invalid-option'],
        'experience-level': 'intermediate',
        'has-budget': 'yes',
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(false);
      expect(result.errors['learning-focus']).toBeDefined();
    });

    it('should return sanitized answers', () => {
      const answers = {
        'learning-focus': ['Knowledge Transfer', 'SKILLS'],
        'experience-level': 'Beginner',
        'has-budget': 'YES',
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
      expect(result.sanitizedAnswers).toBeDefined();
      // Sanitized answers should have normalized values
      expect(result.sanitizedAnswers?.['learning-focus']).toEqual(['knowledge', 'skills']);
      expect(result.sanitizedAnswers?.['experience-level']).toBe('beginner');
      expect(result.sanitizedAnswers?.['has-budget']).toBe('yes');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty answer objects', () => {
      const answers = {};

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(false);
      expect(result.missingRequired.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined values', () => {
      const answers = {
        'learning-focus': null,
        'experience-level': undefined,
        'has-budget': '',
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(false);
    });

    it('should handle malformed arrays', () => {
      const answers = {
        'learning-focus': ['', null, undefined, 'knowledge'],
      };

      const result = validateCompleteAnswers(answers, sections, true);
      // Should sanitize out empty/null values
      expect(result.sanitizedAnswers?.['learning-focus']).toContain('knowledge');
    });

    it('should preserve data when question options match exactly', () => {
      // This is the happy path - no sanitization needed
      const answers = {
        'learning-focus': ['knowledge', 'skills', 'performance'],
        'experience-level': 'advanced',
        'has-budget': 'no',
      };

      const result = validateCompleteAnswers(answers, sections, true);
      expect(result.valid).toBe(true);
      // Original answers should be preserved since they were already correct
      expect(result.sanitizedAnswers?.['learning-focus']).toEqual([
        'knowledge',
        'skills',
        'performance',
      ]);
    });
  });
});

describe('Data Loss Prevention', () => {
  it('CRITICAL: should never discard valid user selections', () => {
    const sections: Section[] = [
      {
        id: 'section1',
        title: 'Test',
        order: 0,
        questions: [
          {
            id: 'priorities',
            label: 'Select priorities',
            type: 'checkbox_pills',
            required: true,
            options: [
              { value: 'quality', label: 'Quality', disabled: false },
              { value: 'speed', label: 'Speed', disabled: false },
              { value: 'cost', label: 'Cost', disabled: false },
            ],
          },
        ],
      },
    ];

    // User submits slightly differently formatted values
    const answers = {
      priorities: ['Quality', 'SPEED', 'cost'],
    };

    const result = validateCompleteAnswers(answers, sections, true);

    // ALL values should be preserved (normalized to correct format)
    expect(result.valid).toBe(true);
    expect(result.sanitizedAnswers?.priorities).toHaveLength(3);
    expect(result.sanitizedAnswers?.priorities).toContain('quality');
    expect(result.sanitizedAnswers?.priorities).toContain('speed');
    expect(result.sanitizedAnswers?.priorities).toContain('cost');
  });
});
