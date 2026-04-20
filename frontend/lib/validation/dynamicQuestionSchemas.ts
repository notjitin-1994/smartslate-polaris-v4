/**
 * Comprehensive Zod validation schemas for dynamic questions
 * Used across API endpoints for request/response validation
 */

import { z } from 'zod';
import { safeRegExp } from '@/lib/utils/safeRegex';

// ============================================================================
// INPUT TYPE DEFINITIONS
// ============================================================================

export const inputTypeSchema = z.enum([
  // Text inputs
  'text',
  'textarea',
  'email',
  'url',

  // Selection inputs (visual)
  'radio_pills',
  'checkbox_pills',
  'radio_cards',
  'checkbox_cards',
  'toggle_switch',

  // Legacy selection (deprecated but supported)
  'select',
  'multiselect',

  // Scale/slider inputs
  'scale',
  'enhanced_scale',
  'labeled_slider',

  // Numeric inputs
  'currency',
  'number_spinner',
  'number',

  // Date/time inputs
  'date',
]);

export type InputType = z.infer<typeof inputTypeSchema>;

// ============================================================================
// VALIDATION RULE SCHEMA
// ============================================================================

export const validationRuleSchema = z.object({
  rule: z.enum([
    'required',
    'minLength',
    'maxLength',
    'min',
    'max',
    'minSelections',
    'maxSelections',
    'pattern',
    'email',
    'url',
    'custom',
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string(),
});

export type ValidationRule = z.infer<typeof validationRuleSchema>;

// ============================================================================
// OPTION SCHEMA (for selection inputs)
// ============================================================================

// Accept any additional fields AI might generate
export const optionSchema = z
  .object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    disabled: z.boolean().default(false),
  })
  .passthrough(); // Industry standard: Accept unknown fields from AI

export type Option = z.infer<typeof optionSchema>;

// ============================================================================
// OPTION VALUE NORMALIZATION & GENERATION (COMMENTED OUT - NO TRANSFORMATION)
// ============================================================================

/**
 * DEPRECATED: Normalization functions are commented out to preserve AI-generated data exactly as intended.
 *
 * Industry standard approach:
 * - Store AI output WITHOUT transformation
 * - Use z.passthrough() for flexible validation
 * - Render exactly what was generated
 * - Let AI control the format via prompt instructions
 *
 * References:
 * - React Hook Form best practices: https://react-hook-form.com/docs/useform
 * - Zod flexible schemas: https://zod.dev/?id=passthrough
 */

// export function generateStandardOptionValue(label: string): string {
//   return (
//     label
//       .toLowerCase()
//       .trim()
//       .replace(/[\s_]+/g, '-')
//       .replace(/[^a-z0-9-]/g, '')
//       .replace(/-+/g, '-')
//       .replace(/^-+|-+$/g, '')
//   );
// }

// export function normalizeOptionValue(value: string, label?: string): string {
//   const trimmedValue = value.trim();
//   const isWellFormatted = /^[a-z0-9-]+$/.test(trimmedValue);
//   if (isWellFormatted && trimmedValue.length > 0) {
//     return trimmedValue;
//   }
//   if (label && label.trim()) {
//     return generateStandardOptionValue(label);
//   }
//   return generateStandardOptionValue(value);
// }

// export function normalizeQuestionOptions(question: Question): Question {
//   if (!question.options || question.options.length === 0) {
//     return question;
//   }
//   return {
//     ...question,
//     options: question.options.map((opt) => ({
//       ...opt,
//       value: normalizeOptionValue(opt.value, opt.label),
//       label: opt.label.trim(),
//       description: opt.description?.trim(),
//       icon: opt.icon?.trim(),
//     })),
//   };
// }

// export function normalizeSectionQuestions(sections: Section[]): Section[] {
//   return sections.map((section) => ({
//     ...section,
//     questions: section.questions.map(normalizeQuestionOptions),
//   }));
// }

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

export const scaleConfigSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().min(1),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  labels: z.array(z.string()).optional(),
  step: z.number().int().min(1).default(1),
});

export const sliderConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  unit: z.string(),
  markers: z.array(z.number()).optional(),
});

export const numberConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().default(1),
});

export const currencyConfigSchema = z.object({
  currencySymbol: z.string().default('$'),
  min: z.number().min(0).optional(),
  max: z.number().positive().optional(),
});

// ============================================================================
// QUESTION SCHEMA
// ============================================================================

// Accept any structure AI generates - industry standard for dynamic forms
export const questionSchema = z
  .object({
    id: z.string().min(1, 'Question ID is required'),
    label: z.string().min(1, 'Question label is required'),
    type: inputTypeSchema,
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    validation: z.array(validationRuleSchema).optional(),

    // Options for selection inputs
    options: z.array(optionSchema).optional(),
    maxSelections: z.number().int().positive().optional(),

    // Configurations for different input types
    scaleConfig: scaleConfigSchema.optional(),
    sliderConfig: sliderConfigSchema.optional(),
    numberConfig: numberConfigSchema.optional(),
    currencyConfig: currencyConfigSchema.optional(),

    // Metadata
    metadata: z.record(z.unknown()).optional(),
  })
  .passthrough(); // Accept unknown fields from AI generation

export type Question = z.infer<typeof questionSchema>;

// ============================================================================
// SECTION SCHEMA
// ============================================================================

export const sectionSchema = z
  .object({
    id: z.string().min(1, 'Section ID is required'),
    title: z.string().min(1, 'Section title is required'),
    description: z.string().optional(),
    order: z.number().int().min(0),
    questions: z.array(questionSchema).min(1, 'Each section must have at least one question'),
  })
  .passthrough(); // Accept unknown fields from AI generation

export type Section = z.infer<typeof sectionSchema>;

// ============================================================================
// DYNAMIC QUESTIONS RESPONSE SCHEMA
// ============================================================================

export const dynamicQuestionsResponseSchema = z.object({
  sections: z.array(sectionSchema).min(1, 'At least one section is required'),
  metadata: z
    .object({
      generatedAt: z.string().optional(),
      provider: z.string().optional(),
      model: z.string().optional(),
      duration: z.number().optional(),
    })
    .optional(),
});

export type DynamicQuestionsResponse = z.infer<typeof dynamicQuestionsResponseSchema>;

// ============================================================================
// ANSWER VALIDATION SCHEMAS
// ============================================================================

/**
 * Validates a single answer against its question definition
 */
export function createAnswerSchema(question: Question): z.ZodSchema {
  const { type, required, validation } = question;

  // Base schema based on input type
  let schema: z.ZodSchema;

  switch (type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
      schema = z.string();
      if (type === 'email') {
        schema = z.string().email('Invalid email address');
      }
      if (type === 'url') {
        schema = z.string().url('Invalid URL');
      }
      break;

    case 'radio_pills':
    case 'radio_cards':
    case 'toggle_switch':
    case 'select':
      // Industry standard: Accept ANY string value from AI-generated options
      // No strict enum validation - let AI control the format
      schema = z.string();
      break;

    case 'checkbox_pills':
    case 'checkbox_cards':
    case 'multiselect':
      // Industry standard: Accept ANY array of strings from AI-generated options
      // No strict validation - preserve user data regardless of option changes
      schema = z.array(z.string());
      break;

    case 'scale':
    case 'enhanced_scale':
      schema = z.number().int();
      if (question.scaleConfig) {
        schema = schema.min(question.scaleConfig.min).max(question.scaleConfig.max);
      }
      // Also check validation rules for min/max
      if (question.validation) {
        question.validation.forEach((rule) => {
          if (rule.rule === 'min' && typeof rule.value === 'number') {
            schema = (schema as z.ZodNumber).min(rule.value, rule.message);
          } else if (rule.rule === 'max' && typeof rule.value === 'number') {
            schema = (schema as z.ZodNumber).max(rule.value, rule.message);
          }
        });
      }
      break;

    case 'labeled_slider':
      if (question.sliderConfig) {
        schema = z.number().min(question.sliderConfig.min).max(question.sliderConfig.max);
      } else {
        schema = z.number();
      }
      break;

    case 'currency':
    case 'number':
    case 'number_spinner':
      schema = z.number();
      if (question.currencyConfig) {
        if (question.currencyConfig.min !== undefined) {
          schema = (schema as z.ZodNumber).min(question.currencyConfig.min);
        }
        if (question.currencyConfig.max !== undefined) {
          schema = (schema as z.ZodNumber).max(question.currencyConfig.max);
        }
      }
      if (question.numberConfig) {
        if (question.numberConfig.min !== undefined) {
          schema = (schema as z.ZodNumber).min(question.numberConfig.min);
        }
        if (question.numberConfig.max !== undefined) {
          schema = (schema as z.ZodNumber).max(question.numberConfig.max);
        }
      }
      break;

    case 'date':
      schema = z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      });
      break;

    default:
      schema = z.unknown();
  }

  // Apply validation rules
  if (validation) {
    validation.forEach((rule) => {
      switch (rule.rule) {
        case 'minLength':
          if (schema instanceof z.ZodString && typeof rule.value === 'number') {
            schema = schema.min(rule.value, rule.message);
          }
          break;
        case 'maxLength':
          if (schema instanceof z.ZodString && typeof rule.value === 'number') {
            schema = schema.max(rule.value, rule.message);
          }
          break;
        case 'min':
          if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
            schema = schema.min(rule.value, rule.message);
          }
          break;
        case 'max':
          if (schema instanceof z.ZodNumber && typeof rule.value === 'number') {
            schema = schema.max(rule.value, rule.message);
          }
          break;
        case 'minSelections':
          if (schema instanceof z.ZodArray && typeof rule.value === 'number') {
            schema = schema.min(rule.value, rule.message);
          }
          break;
        case 'maxSelections':
          if (schema instanceof z.ZodArray && typeof rule.value === 'number') {
            schema = schema.max(rule.value, rule.message);
          }
          break;
        case 'pattern':
          if (schema instanceof z.ZodString && typeof rule.value === 'string') {
            const regex = safeRegExp(rule.value);
            if (regex) {
              schema = schema.regex(regex, rule.message);
            } else {
              console.warn('Invalid regex pattern in validation rule, skipping');
            }
          }
          break;
      }
    });
  }

  // Make optional if not required
  if (!required) {
    schema = schema.optional();
  } else {
    // For required arrays, ensure they're not empty
    if (schema instanceof z.ZodArray) {
      schema = (schema as z.ZodArray<any>).min(1, 'Please select at least one option');
    }
  }

  return schema;
}

/**
 * Creates a complete answer validation schema for all questions in sections
 */
export function createAnswersSchema(sections: Section[]): z.ZodSchema {
  const shape: Record<string, z.ZodSchema> = {};

  sections.forEach((section) => {
    section.questions.forEach((question) => {
      shape[question.id] = createAnswerSchema(question);
    });
  });

  return z.object(shape);
}

/**
 * DEPRECATED: Normalization disabled - accept AI values as-is
 *
 * Normalize a single value to match question option format
 * Returns the matched option value or null if no match
 */
function normalizeAnswerValue_DEPRECATED(
  val: string,
  question: Question,
  context: { type: 'single' | 'multi'; attemptNumber: number }
): { matched: string | null; confidence: 'exact' | 'normalized' | 'fuzzy' | 'none' } {
  const options = question.options || [];
  const validValues = options.map((opt) => opt.value);
  const validLabels = options.map((opt) => opt.label);

  // Strategy 1: Exact value match (highest confidence)
  if (validValues.includes(val)) {
    return { matched: val, confidence: 'exact' };
  }

  // Strategy 2: Case-insensitive value match
  const lowerVal = val.toLowerCase().trim();
  const caseInsensitiveMatch = options.find((opt) => opt.value.toLowerCase().trim() === lowerVal);
  if (caseInsensitiveMatch) {
    return { matched: caseInsensitiveMatch.value, confidence: 'normalized' };
  }

  // Strategy 3: Label match (in case UI sent label instead of value)
  const labelMatch = options.find((opt) => opt.label.toLowerCase().trim() === lowerVal);
  if (labelMatch) {
    return { matched: labelMatch.value, confidence: 'normalized' };
  }

  // Strategy 4: Fuzzy match removing spaces, hyphens, underscores
  const normalizedVal = val.replace(/[\s_-]+/g, '').toLowerCase();
  const fuzzyMatch = options.find((opt) => {
    const normalizedOptValue = opt.value.replace(/[\s_-]+/g, '').toLowerCase();
    const normalizedOptLabel = opt.label.replace(/[\s_-]+/g, '').toLowerCase();
    return normalizedOptValue === normalizedVal || normalizedOptLabel === normalizedVal;
  });
  if (fuzzyMatch) {
    return { matched: fuzzyMatch.value, confidence: 'fuzzy' };
  }

  // Strategy 4b: Try converting underscore to hyphen and vice versa
  const underscoreToHyphen = val.replace(/_/g, '-').toLowerCase();
  const hyphenToUnderscore = val.replace(/-/g, '_').toLowerCase();

  const alternateMatch = options.find((opt) => {
    const optValueLower = opt.value.toLowerCase();
    return optValueLower === underscoreToHyphen || optValueLower === hyphenToUnderscore;
  });
  if (alternateMatch) {
    return { matched: alternateMatch.value, confidence: 'fuzzy' };
  }

  // Strategy 5: Partial substring match (very forgiving - only for single values)
  if (context.type === 'single' && val.length > 3) {
    const substringMatch = options.find((opt) => {
      const optValueLower = opt.value.toLowerCase();
      const optLabelLower = opt.label.toLowerCase();
      return (
        optValueLower.includes(lowerVal) ||
        lowerVal.includes(optValueLower) ||
        optLabelLower.includes(lowerVal) ||
        lowerVal.includes(optLabelLower)
      );
    });
    if (substringMatch) {
      return { matched: substringMatch.value, confidence: 'fuzzy' };
    }
  }

  // Strategy 6: For toggle switches, smart boolean matching
  if (question.type === 'toggle_switch' && options.length === 2) {
    const yesPatterns = ['yes', 'y', 'true', 't', '1', 'on', 'enabled', 'active', 'agree'];
    const noPatterns = ['no', 'n', 'false', 'f', '0', 'off', 'disabled', 'inactive', 'disagree'];

    const valLower = lowerVal;
    const isYesLike = yesPatterns.some(
      (pattern) => valLower === pattern || valLower.includes(pattern)
    );
    const isNoLike = noPatterns.some(
      (pattern) => valLower === pattern || valLower.includes(pattern)
    );

    if (isYesLike) {
      const yesOption = options.find((opt) => {
        const optLower = opt.value.toLowerCase();
        const labelLower = opt.label.toLowerCase();
        return yesPatterns.some(
          (pattern) => optLower.includes(pattern) || labelLower.includes(pattern)
        );
      });
      if (yesOption) return { matched: yesOption.value, confidence: 'fuzzy' };
    }

    if (isNoLike) {
      const noOption = options.find((opt) => {
        const optLower = opt.value.toLowerCase();
        const labelLower = opt.label.toLowerCase();
        return noPatterns.some(
          (pattern) => optLower.includes(pattern) || labelLower.includes(pattern)
        );
      });
      if (noOption) return { matched: noOption.value, confidence: 'fuzzy' };
    }

    // If no specific patterns matched, try to find which option is the "negative" one
    // by looking for the option that comes second (typically "no" or "disabled")
    if (isNoLike && !noOption && options.length === 2) {
      return { matched: options[1].value, confidence: 'fuzzy' };
    }
  }

  return { matched: null, confidence: 'none' };
}

/**
 * DEPRECATED: Sanitization disabled - accept all user data as-is
 * Industry standard: No transformation, preserve data integrity
 *
 * Sanitize answer by filtering out invalid option values
 * This makes validation more forgiving when options change or old data exists
 * CRITICAL: This function must preserve valid user data at all costs
 */
function sanitizeAnswer_DEPRECATED(answer: unknown, question: Question): unknown {
  // For selection types with options, filter to only valid values
  const isMultiSelect = ['checkbox_pills', 'checkbox_cards', 'multiselect'].includes(question.type);
  const isSingleSelect = ['radio_pills', 'radio_cards', 'toggle_switch', 'select'].includes(
    question.type
  );

  if (question.options && question.options.length > 0) {
    const validValues = question.options.map((opt) => opt.value);
    const validLabels = question.options.map((opt) => opt.label);

    if (isMultiSelect && Array.isArray(answer)) {
      // Ensure all array elements are strings
      const stringArray = answer.map((val) => String(val));
      const matched: Array<{ original: string; normalized: string; confidence: string }> = [];
      const unmatched: string[] = [];

      // Try to normalize each value
      const normalized = stringArray
        .map((val, idx) => {
          const result = normalizeAnswerValue(val, question, {
            type: 'multi',
            attemptNumber: idx + 1,
          });

          if (result.matched) {
            matched.push({
              original: val,
              normalized: result.matched,
              confidence: result.confidence,
            });
            return result.matched;
          } else {
            unmatched.push(val);
            return null;
          }
        })
        .filter((val): val is string => val !== null);

      // Enhanced logging with actionable information
      if (unmatched.length > 0) {
        console.warn(
          `[sanitizeAnswer] Some values could not be matched for question ${question.id}`,
          {
            questionId: question.id,
            questionLabel: question.label?.substring(0, 100),
            questionType: question.type,
            totalSubmitted: stringArray.length,
            successfullyMatched: matched.length,
            unmatchedCount: unmatched.length,
            unmatchedValues: unmatched,
            matchedMappings: matched.slice(0, 10),
            availableOptions: question.options
              .map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))
              .slice(0, 10),
            suggestedFix:
              unmatched.length > 0
                ? "Check if question options were regenerated or if there's a mismatch between option values and submitted answers"
                : null,
          }
        );

        // CRITICAL FIX: If all values look like valid option format but couldn't be matched,
        // it's likely the options changed after the user submitted. Keep the original values
        // to preserve user data rather than discarding it.
        if (normalized.length === 0 && unmatched.every((v) => /^[a-z0-9_-]+$/.test(v))) {
          console.warn(
            `[sanitizeAnswer] All values appear valid but don't match current options. Preserving original values for question ${question.id}`,
            {
              questionId: question.id,
              preservedValues: unmatched,
              reason: 'Options likely changed after submission',
            }
          );
          return stringArray; // Return original values to preserve user data
        }
      } else if (matched.some((m) => m.confidence !== 'exact')) {
        console.info(
          `[sanitizeAnswer] Successfully normalized ${matched.length} values with fuzzy matching`,
          {
            questionId: question.id,
            normalizedMappings: matched.filter((m) => m.confidence !== 'exact'),
          }
        );
      }

      // CRITICAL: Always return an array, preserve as much user data as possible
      return normalized;
    } else if (isSingleSelect && answer !== undefined && answer !== null && answer !== '') {
      const answerStr = String(answer).trim();

      // Use the normalized value matcher
      const result = normalizeAnswerValue(answerStr, question, {
        type: 'single',
        attemptNumber: 1,
      });

      if (result.matched) {
        // Log if we did fuzzy matching
        if (result.confidence !== 'exact') {
          console.info(
            `[sanitizeAnswer] Normalized single-select value for question ${question.id}`,
            {
              questionId: question.id,
              questionLabel: question.label?.substring(0, 100),
              original: answerStr,
              normalized: result.matched,
              confidence: result.confidence,
            }
          );
        }
        return result.matched;
      }

      // No match found - log detailed info for debugging
      console.warn(
        `[sanitizeAnswer] Could not match single-select value for question ${question.id}`,
        {
          questionId: question.id,
          questionLabel: question.label?.substring(0, 100),
          questionType: question.type,
          submittedValue: answerStr,
          availableOptions: question.options.map((opt) => ({
            value: opt.value,
            label: opt.label,
          })),
          suggestedFix:
            'Check if question options were regenerated or if submitted value format differs from expected',
        }
      );

      // Return the original answer - validation will provide a clear error
      return answerStr;
    }
  }

  // For non-selection types or when answer is already valid, return as-is
  return answer;
}

/**
 * Validates partial answers (for auto-save)
 * Industry standard: No sanitization - accept data as-is
 */
export function validatePartialAnswers(
  answers: Record<string, unknown>,
  sections: Section[],
  sanitize: boolean = false // Disabled by default - no transformation
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Safety check for sections
  if (!sections || !Array.isArray(sections)) {
    return {
      valid: false,
      errors: { _general: 'Invalid sections structure' },
    };
  }

  Object.entries(answers).forEach(([questionId, answer]) => {
    // Find the question
    let question: Question | undefined;
    for (const section of sections) {
      if (!section || !section.questions || !Array.isArray(section.questions)) {
        continue;
      }
      question = section.questions.find((q) => q.id === questionId);
      if (question) break;
    }

    if (!question) {
      errors[questionId] = 'Question not found';
      return;
    }

    // No sanitization - use answer as-is (industry standard for AI-generated forms)
    const answerToValidate = answer;

    // Validate the answer
    try {
      const schema = createAnswerSchema(question);
      const result = schema.safeParse(answerToValidate);

      if (!result.success) {
        // Extract and format error messages properly - NEVER use JSON.stringify on errors
        const zodErrors = result.error.errors;
        if (zodErrors && zodErrors.length > 0) {
          // For array validation errors, combine messages
          if (zodErrors.length === 1) {
            const err = zodErrors[0];
            // Build a clear error message
            if (err.code === 'invalid_enum_value') {
              const actualValue =
                Array.isArray(answer) && err.path && err.path.length > 0
                  ? answer[err.path[0] as number]
                  : answer;

              // Provide helpful context about valid options
              if (question.options && question.options.length > 0) {
                const validOptions = question.options.map((opt) => opt.label).slice(0, 5);
                const moreOptions =
                  question.options.length > 5 ? ` and ${question.options.length - 5} more` : '';
                errors[questionId] =
                  `"${actualValue}" is not a valid option. Please select from: ${validOptions.join(', ')}${moreOptions}`;
              } else {
                errors[questionId] = `Invalid value "${actualValue}". ${err.message}`;
              }
            } else if (
              err.code === 'too_small' &&
              Array.isArray(answerToValidate) &&
              answerToValidate.length === 0
            ) {
              errors[questionId] = 'Please select at least one option';
            } else if (
              err.code === 'invalid_type' &&
              err.expected === 'string' &&
              err.received === 'undefined'
            ) {
              errors[questionId] = 'Please select an option';
            } else {
              errors[questionId] = err.message;
            }
          } else {
            // Multiple errors - provide detailed feedback with context
            const errorMessages = zodErrors.map((err, index) => {
              // Build clear error messages for each validation failure
              if (err.code === 'invalid_enum_value') {
                const actualValue =
                  Array.isArray(answer) && err.path && err.path.length > 0
                    ? answer[err.path[0] as number]
                    : answer;
                return `"${actualValue}" is not a valid option`;
              } else if (err.code === 'too_small' || err.code === 'too_big') {
                const pathStr = err.path && err.path.length > 0 ? `[${err.path.join('.')}] ` : '';
                return `${pathStr}${err.message}`;
              }
              return err.message;
            });

            // Provide helpful context for multi-select questions
            if (question.type.includes('checkbox') || question.type === 'multiselect') {
              const validOptions = question.options
                ? question.options.map((opt) => opt.label).slice(0, 3)
                : [];
              const moreOptions =
                question.options && question.options.length > 3
                  ? ` and ${question.options.length - 3} more`
                  : '';
              errors[questionId] =
                `Invalid selections. Please choose from: ${validOptions.join(', ')}${moreOptions}`;
            } else {
              errors[questionId] = errorMessages.join('; ');
            }
          }
        } else {
          errors[questionId] = result.error?.message || 'Invalid answer';
        }
      }
    } catch (validationError) {
      const errMsg =
        validationError instanceof Error ? validationError.message : 'Validation error occurred';
      errors[questionId] = `Validation error: ${errMsg}`;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates complete answers (for final submission)
 * Industry standard: No sanitization - accept data as-is
 */
export function validateCompleteAnswers(
  answers: Record<string, unknown>,
  sections: Section[],
  sanitize: boolean = false // Disabled by default - no transformation
): {
  valid: boolean;
  errors: Record<string, string>;
  missingRequired: string[];
  sanitizedAnswers?: Record<string, unknown>;
} {
  const errors: Record<string, string> = {};
  const missingRequired: string[] = [];

  // No sanitization - use answers as-is (industry standard)
  const sanitizedAnswers: Record<string, unknown> = { ...answers };

  // Safety check for sections
  if (!sections || !Array.isArray(sections)) {
    return {
      valid: false,
      errors: { _general: 'Invalid sections structure' },
      missingRequired: [],
    };
  }

  // Check all required questions are answered (using sanitized values)
  sections.forEach((section) => {
    if (!section || !section.questions || !Array.isArray(section.questions)) {
      return;
    }

    section.questions.forEach((question) => {
      if (question && question.required) {
        const answer = sanitizedAnswers[question.id];
        const originalAnswer = answers[question.id];

        // Check for empty arrays in addition to undefined/null/empty string
        const isEmpty =
          answer === undefined ||
          answer === null ||
          answer === '' ||
          (Array.isArray(answer) && answer.length === 0);

        if (isEmpty) {
          // If original answer existed but sanitization cleared it, provide helpful error
          if (originalAnswer !== undefined && originalAnswer !== null && originalAnswer !== '') {
            const answerPreview = Array.isArray(originalAnswer)
              ? `[${(originalAnswer as any[]).slice(0, 3).join(', ')}${(originalAnswer as any[]).length > 3 ? '...' : ''}]`
              : String(originalAnswer).substring(0, 50);

            // Provide specific guidance based on question type
            if (question.options && question.options.length > 0) {
              const validOptions = question.options.map((opt) => opt.label).slice(0, 5);
              const moreOptions =
                question.options.length > 5 ? ` and ${question.options.length - 5} more` : '';

              if (question.type === 'toggle_switch') {
                errors[question.id] =
                  `Your previous answer "${answerPreview}" is no longer valid. This question may have been updated. Please select from the current options.`;
              } else if (question.type.includes('checkbox') || question.type === 'multiselect') {
                // Check if this is likely a question regeneration issue
                const originalArray = Array.isArray(originalAnswer) ? originalAnswer : [];
                if (originalArray.length > 0) {
                  errors[question.id] =
                    `Your previous selections (${originalArray.length} items) are no longer valid. The question options may have changed. Please make new selections from: ${validOptions.join(', ')}${moreOptions}`;
                } else {
                  errors[question.id] =
                    `Your selections "${answerPreview}" don't match available options. Please choose from: ${validOptions.join(', ')}${moreOptions}`;
                }
              } else {
                errors[question.id] =
                  `Your previous answer "${answerPreview}" is no longer valid. Please select from: ${validOptions.join(', ')}${moreOptions}`;
              }
            } else {
              errors[question.id] =
                `Your answer "${answerPreview}" doesn't match the current question format. Please re-enter your answer.`;
            }
          } else {
            errors[question.id] = 'This field is required';
          }
          missingRequired.push(question.id);
        }
      }
    });
  });

  // Validate all provided answers (no sanitization - industry standard)
  const partialValidation = validatePartialAnswers(sanitizedAnswers, sections, false);
  Object.assign(errors, partialValidation.errors);

  return {
    valid: Object.keys(errors).length === 0 && missingRequired.length === 0,
    errors,
    missingRequired,
    sanitizedAnswers,
  };
}
