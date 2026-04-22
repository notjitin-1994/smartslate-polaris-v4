/**
 * Tests for Dynamic Question Schema Validation
 * Specifically testing the checkbox/multi-select validation fixes
 */

import { describe, it, expect } from 'vitest';
import { validatePartialAnswers, createAnswerSchema } from '../dynamicQuestionSchemas';
import type { Section, Question } from '@/types/dynamicQuestions';

describe('Dynamic Question Schema Validation', () => {
  describe('Checkbox/Multi-select Field Validation', () => {
    const createTestQuestion = (type: string, id: string = 'q1'): Question => ({
      id,
      label: 'Test Question',
      type,
      required: true,
      options: [
        { value: 'option-one', label: 'Option One' },
        { value: 'option-two', label: 'Option Two' },
        { value: 'ai-tool-mastery', label: 'AI Tool Mastery' },
        { value: 'content-creation', label: 'Content Creation' },
      ],
    });

    const testCases = [
      {
        name: 'accepts exact matching values',
        type: 'checkbox_cards',
        answer: ['option-one', 'option-two'],
        shouldBeValid: true,
      },
      {
        name: 'handles underscore to hyphen conversion',
        type: 'checkbox_cards',
        answer: ['option_one', 'option_two'],
        shouldBeValid: true,
        expectedNormalized: ['option-one', 'option-two'],
      },
      {
        name: 'handles hyphen to underscore conversion',
        type: 'checkbox_cards',
        answer: ['ai_tool_mastery', 'content_creation'],
        shouldBeValid: true,
        expectedNormalized: ['ai-tool-mastery', 'content-creation'],
      },
      {
        name: 'handles case-insensitive matching',
        type: 'checkbox_pills',
        answer: ['OPTION-ONE', 'Option-Two'],
        shouldBeValid: true,
        expectedNormalized: ['option-one', 'option-two'],
      },
      {
        name: 'preserves valid-looking values when options might have changed',
        type: 'checkbox_cards',
        answer: ['new-option', 'another-option'],
        shouldBeValid: true,
        expectedPreserved: true,
      },
      {
        name: 'handles label matching',
        type: 'checkbox_cards',
        answer: ['Option One', 'AI Tool Mastery'],
        shouldBeValid: true,
        expectedNormalized: ['option-one', 'ai-tool-mastery'],
      },
      {
        name: 'handles mixed valid and invalid values',
        type: 'checkbox_cards',
        answer: ['option-one', 'invalid_option'],
        shouldBeValid: true,
        expectedNormalized: ['option-one'],
      },
      {
        name: 'handles empty array',
        type: 'checkbox_cards',
        answer: [],
        shouldBeValid: false, // Required field
      },
      {
        name: 'handles single value that should be array',
        type: 'checkbox_cards',
        answer: 'option-one',
        shouldBeValid: false, // Should be array
      },
    ];

    testCases.forEach((testCase) => {
      it(testCase.name, () => {
        const question = createTestQuestion(testCase.type);
        const sections: Section[] = [
          {
            id: 's1',
            title: 'Test Section',
            questions: [question],
          },
        ];

        const result = validatePartialAnswers(
          { [question.id]: testCase.answer },
          sections,
          true // Enable sanitization
        );

        if (testCase.shouldBeValid) {
          expect(result.valid).toBe(true);
          expect(result.errors[question.id]).toBeUndefined();
        } else {
          expect(result.valid).toBe(false);
          expect(result.errors[question.id]).toBeDefined();
        }
      });
    });

    it('should handle the reported bug case', () => {
      // This is the actual failing case from the user's error
      const question: Question = {
        id: 'priorities_challenges',
        label: 'What are your top priorities?',
        type: 'checkbox_cards',
        required: true,
        options: [
          { value: 'ai-tool-mastery', label: 'AI Tool Mastery' },
          { value: 'content-creation', label: 'Content Creation' },
          { value: 'data-analysis', label: 'Data Analysis' },
        ],
      };

      const sections: Section[] = [
        {
          id: 's1',
          title: 'Priorities',
          questions: [question],
        },
      ];

      // User submitted with underscores (old format)
      const answers = {
        priorities_challenges: ['ai_tool_mastery', 'content_creation'],
      };

      const result = validatePartialAnswers(answers, sections, true);

      // Should be valid after our fix
      expect(result.valid).toBe(true);
      expect(result.errors.priorities_challenges).toBeUndefined();
    });

    it('should preserve data when options have clearly changed', () => {
      const question: Question = {
        id: 'q1',
        label: 'Select options',
        type: 'checkbox_cards',
        required: true,
        options: [
          { value: 'new-option-1', label: 'New Option 1' },
          { value: 'new-option-2', label: 'New Option 2' },
        ],
      };

      const sections: Section[] = [
        {
          id: 's1',
          title: 'Test',
          questions: [question],
        },
      ];

      // User had selected old options that no longer exist
      const answers = {
        q1: ['old-option-1', 'old-option-2'],
      };

      const result = validatePartialAnswers(answers, sections, true);

      // Should preserve the data even though it doesn't match current options
      // This prevents data loss when options are regenerated
      expect(result.valid).toBe(true);
    });
  });

  describe('Single-select Field Validation', () => {
    const createSingleSelectQuestion = (type: string): Question => ({
      id: 'q1',
      label: 'Test Single Select',
      type,
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'maybe', label: 'Maybe' },
      ],
    });

    it('should handle radio_pills with fuzzy matching', () => {
      const question = createSingleSelectQuestion('radio_pills');
      const sections: Section[] = [
        {
          id: 's1',
          title: 'Test',
          questions: [question],
        },
      ];

      const testCases = [
        { answer: 'yes', shouldBeValid: true },
        { answer: 'YES', shouldBeValid: true },
        { answer: 'Yes', shouldBeValid: true },
        { answer: 'no', shouldBeValid: true },
        { answer: 'invalid', shouldBeValid: false },
      ];

      testCases.forEach((testCase) => {
        const result = validatePartialAnswers({ q1: testCase.answer }, sections, true);
        expect(result.valid).toBe(testCase.shouldBeValid);
      });
    });

    it('should handle toggle_switch with boolean-like values', () => {
      const question: Question = {
        id: 'q1',
        label: 'Enable feature?',
        type: 'toggle_switch',
        required: true,
        options: [
          { value: 'enabled', label: 'Enabled' },
          { value: 'disabled', label: 'Disabled' },
        ],
      };

      const sections: Section[] = [
        {
          id: 's1',
          title: 'Test',
          questions: [question],
        },
      ];

      const testCases = [
        { answer: 'enabled', shouldBeValid: true },
        { answer: 'disabled', shouldBeValid: true },
        { answer: 'yes', shouldBeValid: true }, // Should map to 'enabled'
        { answer: 'true', shouldBeValid: true }, // Should map to 'enabled'
        { answer: 'on', shouldBeValid: true }, // Should map to 'enabled'
        { answer: 'no', shouldBeValid: true }, // Should map to 'disabled'
        { answer: 'false', shouldBeValid: true }, // Should map to 'disabled'
        { answer: 'off', shouldBeValid: true }, // Should map to 'disabled'
      ];

      testCases.forEach((testCase) => {
        const result = validatePartialAnswers({ q1: testCase.answer }, sections, true);
        expect(result.valid).toBe(testCase.shouldBeValid);
      });
    });
  });

  describe('Non-option Field Validation', () => {
    it('should pass through text fields unchanged', () => {
      const question: Question = {
        id: 'q1',
        label: 'Enter text',
        type: 'text',
        required: true,
      };

      const sections: Section[] = [
        {
          id: 's1',
          title: 'Test',
          questions: [question],
        },
      ];

      const answer = 'This is user text with_underscores-and-hyphens';
      const result = validatePartialAnswers({ q1: answer }, sections, true);

      expect(result.valid).toBe(true);
    });

    it('should validate scale fields', () => {
      const question: Question = {
        id: 'q1',
        label: 'Rate this',
        type: 'scale',
        required: true,
        validation: [
          { rule: 'min', value: 1, message: 'Minimum 1' },
          { rule: 'max', value: 10, message: 'Maximum 10' },
        ],
      };

      const sections: Section[] = [
        {
          id: 's1',
          title: 'Test',
          questions: [question],
        },
      ];

      expect(validatePartialAnswers({ q1: 5 }, sections, true).valid).toBe(true);
      expect(validatePartialAnswers({ q1: 0 }, sections, true).valid).toBe(false);
      expect(validatePartialAnswers({ q1: 11 }, sections, true).valid).toBe(false);
    });
  });
});
