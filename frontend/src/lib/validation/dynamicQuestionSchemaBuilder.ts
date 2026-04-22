/**
 * Dynamic Zod Schema Builder for Dynamic Questionnaire
 * Generates validation schemas from question definitions at runtime
 */

import { z } from 'zod';
import type { Question, Section } from '@/lib/validation/dynamicQuestionSchemas';

/**
 * Create a Zod schema for a single question based on its type and validation rules
 */
export function createQuestionSchema(question: Question): z.ZodSchema {
  const { type, required, validation } = question;

  // Base schema based on input type
  let schema: z.ZodSchema;

  switch (type) {
    // Text-based inputs
    case 'text':
    case 'textarea':
      schema = z.string();
      break;

    case 'email':
      schema = z.string().email('Please enter a valid email address (e.g., name@example.com)');
      break;

    case 'url':
      schema = z.string().url('Please enter a valid URL (e.g., https://example.com)');
      break;

    // Single selection inputs
    case 'radio_pills':
    case 'radio_cards':
    case 'toggle_switch':
      if (question.options && question.options.length > 0) {
        const validValues = question.options.map((opt) => opt.value);
        schema = z.enum(validValues as [string, ...string[]], {
          errorMap: () => ({ message: 'Please select a valid option' }),
        });
      } else {
        schema = z.string();
      }
      break;

    // Multiple selection inputs
    case 'checkbox_pills':
    case 'checkbox_cards':
      if (question.options && question.options.length > 0) {
        const validValues = question.options.map((opt) => opt.value);
        schema = z.array(z.enum(validValues as [string, ...string[]]));
      } else {
        schema = z.array(z.string());
      }
      break;

    // Numeric scale inputs
    case 'scale':
    case 'enhanced_scale':
      if (question.scaleConfig) {
        schema = z
          .number({
            required_error: 'Please select a value on the scale',
            invalid_type_error: 'Please select a valid number',
          })
          .int('Please select a whole number')
          .min(
            question.scaleConfig.min,
            `Please select a value of ${question.scaleConfig.min} or higher`
          )
          .max(
            question.scaleConfig.max,
            `Please select a value of ${question.scaleConfig.max} or lower`
          );
      } else {
        schema = z.number().int();
      }
      break;

    // Slider input
    case 'labeled_slider':
      if (question.sliderConfig) {
        schema = z
          .number({
            required_error: 'Please select a value',
            invalid_type_error: 'Please select a valid number',
          })
          .min(question.sliderConfig.min, `Value must be at least ${question.sliderConfig.min}`)
          .max(question.sliderConfig.max, `Value must be at most ${question.sliderConfig.max}`);

        // Apply step validation if needed
        if (question.sliderConfig.step && question.sliderConfig.step !== 1) {
          schema = schema.refine(
            (val) => {
              const steps = (val - question.sliderConfig!.min) / question.sliderConfig!.step;
              return steps === Math.floor(steps);
            },
            { message: `Value must be in increments of ${question.sliderConfig.step}` }
          );
        }
      } else {
        schema = z.number();
      }
      break;

    // Currency input
    case 'currency':
      schema = z
        .number({
          required_error: 'Please enter an amount',
          invalid_type_error: 'Please enter a valid amount',
        })
        .min(0, 'Amount must be positive');

      if (question.currencyConfig) {
        if (question.currencyConfig.min !== undefined) {
          schema = (schema as z.ZodNumber).min(
            question.currencyConfig.min,
            `Amount must be at least ${question.currencyConfig.symbol || '$'}${question.currencyConfig.min}`
          );
        }
        if (question.currencyConfig.max !== undefined) {
          schema = (schema as z.ZodNumber).max(
            question.currencyConfig.max,
            `Amount must be at most ${question.currencyConfig.symbol || '$'}${question.currencyConfig.max}`
          );
        }
      }
      break;

    // Number spinner
    case 'number':
    case 'number_spinner':
      schema = z.number({
        required_error: 'Please enter a number',
        invalid_type_error: 'Please enter a valid number',
      });

      if (question.numberConfig) {
        if (question.numberConfig.min !== undefined) {
          schema = (schema as z.ZodNumber).min(
            question.numberConfig.min,
            `Value must be at least ${question.numberConfig.min}`
          );
        }
        if (question.numberConfig.max !== undefined) {
          schema = (schema as z.ZodNumber).max(
            question.numberConfig.max,
            `Value must be at most ${question.numberConfig.max}`
          );
        }
        if (question.numberConfig.step && question.numberConfig.step !== 1) {
          schema = schema.refine(
            (val) => {
              const steps =
                (val - (question.numberConfig!.min || 0)) / question.numberConfig!.step!;
              return steps === Math.floor(steps);
            },
            { message: `Value must be in increments of ${question.numberConfig.step}` }
          );
        }
      }
      break;

    // Date input
    case 'date':
      schema = z.string().refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: 'Please enter a valid date' }
      );
      break;

    default:
      schema = z.unknown();
  }

  // Apply custom validation rules
  if (validation && Array.isArray(validation)) {
    for (const rule of validation) {
      switch (rule.rule) {
        case 'minLength':
          if (schema instanceof z.ZodString && typeof rule.value === 'number') {
            schema = schema.min(
              rule.value,
              rule.message || `Must be at least ${rule.value} characters`
            );
          }
          break;

        case 'maxLength':
          if (schema instanceof z.ZodString && typeof rule.value === 'number') {
            schema = schema.max(
              rule.value,
              rule.message || `Must be at most ${rule.value} characters`
            );
          }
          break;

        case 'minSelections':
          if (schema instanceof z.ZodArray && typeof rule.value === 'number') {
            schema = schema.min(
              rule.value,
              rule.message || `Select at least ${rule.value} options`
            );
          }
          break;

        case 'maxSelections':
          if (schema instanceof z.ZodArray && typeof rule.value === 'number') {
            schema = schema.max(rule.value, rule.message || `Select at most ${rule.value} options`);
          }
          break;

        case 'pattern':
          if (schema instanceof z.ZodString && typeof rule.value === 'string') {
            try {
              const regex = new RegExp(rule.value);
              schema = schema.regex(regex, rule.message || 'Invalid format');
            } catch (e) {
              // Invalid regex pattern - skip validation
            }
          }
          break;

        case 'min':
          if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
            schema = schema.min(rule.value, rule.message || `Must be at least ${rule.value}`);
          }
          break;

        case 'max':
          if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
            schema = schema.max(rule.value, rule.message || `Must be at most ${rule.value}`);
          }
          break;
      }
    }
  }

  // Apply required validation
  if (!required) {
    // Make the field optional if not required
    if (schema instanceof z.ZodString) {
      schema = schema.optional().or(z.literal(''));
    } else if (schema instanceof z.ZodArray) {
      schema = schema.optional().or(z.array(z.any()).length(0));
    } else {
      schema = schema.optional();
    }
  } else {
    // Add required validation messages
    if (schema instanceof z.ZodString) {
      schema = schema.min(1, question.helpText || 'This field is required');
    } else if (schema instanceof z.ZodArray) {
      schema = schema.min(1, 'Please select at least one option');
    }
  }

  return schema;
}

/**
 * Create a dynamic Zod schema for all questions in the sections
 */
export function createDynamicSchema(sections: Section[]): z.ZodSchema {
  const shape: Record<string, z.ZodSchema> = {};

  sections.forEach((section) => {
    section.questions.forEach((question) => {
      try {
        shape[question.id] = createQuestionSchema(question);
      } catch (error) {
        // Fallback to a permissive schema if there's an error
        shape[question.id] = z.unknown().optional();
      }
    });
  });

  // Return an object schema with all question schemas
  return z.object(shape).passthrough(); // passthrough allows extra fields
}

/**
 * Validate a single section's answers
 */
export function validateSection(
  section: Section,
  answers: Record<string, unknown>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const question of section.questions) {
    try {
      const schema = createQuestionSchema(question);
      const result = schema.safeParse(answers[question.id]);

      if (!result.success) {
        isValid = false;
        const firstError = result.error?.errors?.[0];
        errors[question.id] = firstError?.message || 'Invalid value';
      }
    } catch (error) {
      // Validation error - skip this question
    }
  }

  return { isValid, errors };
}

/**
 * Get all required question IDs from sections
 */
export function getRequiredQuestionIds(sections: Section[]): string[] {
  const requiredIds: string[] = [];

  sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.required) {
        requiredIds.push(question.id);
      }
    });
  });

  return requiredIds;
}

/**
 * Calculate completion percentage based on required fields
 */
export function calculateCompletionPercentage(
  sections: Section[],
  answers: Record<string, unknown>
): number {
  const requiredIds = getRequiredQuestionIds(sections);

  if (requiredIds.length === 0) {
    return 100; // No required fields means 100% complete
  }

  let completedCount = 0;

  for (const questionId of requiredIds) {
    const answer = answers[questionId];

    // Check if answer exists and is not empty
    if (answer !== undefined && answer !== null && answer !== '') {
      if (Array.isArray(answer) && answer.length === 0) {
        continue; // Empty array doesn't count as completed
      }
      completedCount++;
    }
  }

  return Math.round((completedCount / requiredIds.length) * 100);
}

/**
 * Get validation status for each section
 */
export function getSectionValidationStatus(
  sections: Section[],
  answers: Record<string, unknown>
): Array<{ sectionId: string; isValid: boolean; completionPercentage: number }> {
  return sections.map((section) => {
    const sectionAnswers: Record<string, unknown> = {};
    section.questions.forEach((q) => {
      sectionAnswers[q.id] = answers[q.id];
    });

    const { isValid } = validateSection(section, sectionAnswers);

    // Calculate completion for this section only
    const sectionRequiredIds = section.questions.filter((q) => q.required).map((q) => q.id);

    let completionPercentage = 100;
    if (sectionRequiredIds.length > 0) {
      const completedCount = sectionRequiredIds.filter((id) => {
        const answer = answers[id];
        return (
          answer !== undefined &&
          answer !== null &&
          answer !== '' &&
          !(Array.isArray(answer) && answer.length === 0)
        );
      }).length;

      completionPercentage = Math.round((completedCount / sectionRequiredIds.length) * 100);
    }

    return {
      sectionId: section.id,
      isValid,
      completionPercentage,
    };
  });
}
