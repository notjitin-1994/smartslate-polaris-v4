import { Question, ValidationRule, ValidationResult, FormSchema, Section } from './schema';
import { safeRegExp } from '@/lib/utils/safeRegex';

export class ValidationEngine {
  private formSchema: FormSchema;
  private errors: Record<string, string> = {};
  private warnings: Record<string, string> = {};

  constructor(formSchema: FormSchema) {
    this.formSchema = formSchema;
  }

  /**
   * Validate a single field
   */
  validateField(questionId: string, value: any, formData: Record<string, any> = {}): string | null {
    const question = this.findQuestionById(questionId);
    if (!question) {
      return 'Question not found';
    }

    // Check if field should be visible based on conditional logic
    if (question.conditional && !this.evaluateCondition(question.conditional, formData)) {
      return null; // Field is hidden, no validation needed
    }

    // Check required validation
    if (question.required && this.isEmpty(value)) {
      return (
        question.validation?.find((rule) => rule.type === 'required')?.message ||
        'This field is required'
      );
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !question.required) {
      return null;
    }

    // Run custom validations
    if (question.validation) {
      for (const rule of question.validation) {
        const error = this.validateRule(rule, value, question, formData);
        if (error) {
          return error;
        }
      }
    }

    // Type-specific validations
    return this.validateByType(question, value);
  }

  /**
   * Validate an entire section
   */
  validateSection(sectionId: string, formData: Record<string, any>): ValidationResult {
    const section = this.findSectionById(sectionId);
    if (!section) {
      return {
        isValid: false,
        errors: [{ fieldId: sectionId, message: 'Section not found', type: 'section' }],
      };
    }

    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    for (const question of section.questions) {
      const error = this.validateField(question.id, formData[question.id], formData);
      if (error) {
        errors.push({
          fieldId: question.id,
          message: error,
          type: 'validation',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate the entire form
   */
  validateForm(formData: Record<string, any>): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    for (const section of this.formSchema.sections) {
      const sectionResult = this.validateSection(section.id, formData);
      errors.push(...sectionResult.errors);
      if (sectionResult.warnings) {
        warnings.push(...sectionResult.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate a specific validation rule
   */
  private validateRule(
    rule: ValidationRule,
    value: any,
    question: Question,
    formData: Record<string, any>
  ): string | null {
    switch (rule.type) {
      case 'required':
        if (this.isEmpty(value)) {
          return rule.message || 'This field is required';
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return rule.message || `Minimum length is ${rule.value}`;
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return rule.message || `Maximum length is ${rule.value}`;
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && rule.value) {
          const regex = safeRegExp(rule.value as string);
          if (!regex) {
            console.warn('Invalid regex pattern in validation rule');
            break; // Skip invalid patterns
          }
          if (!regex.test(value)) {
            return rule.message || 'Invalid format';
          }
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message || `Minimum value is ${rule.value}`;
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message || `Maximum value is ${rule.value}`;
        }
        break;

      case 'email':
        if (typeof value === 'string' && value.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return rule.message || 'Invalid email format';
          }
        }
        break;

      case 'url':
        if (typeof value === 'string' && value.length > 0) {
          try {
            new URL(value);
          } catch {
            return rule.message || 'Invalid URL format';
          }
        }
        break;

      case 'minSelections':
        if (Array.isArray(value) && value.length < (rule.value as number)) {
          return (
            rule.message ||
            `Select at least ${rule.value} option${(rule.value as number) > 1 ? 's' : ''}`
          );
        }
        break;

      case 'maxSelections':
        if (Array.isArray(value) && value.length > (rule.value as number)) {
          return (
            rule.message ||
            `Select at most ${rule.value} option${(rule.value as number) > 1 ? 's' : ''}`
          );
        }
        break;

      case 'range':
        if (typeof value === 'number' && Array.isArray(rule.value)) {
          const [min, max] = rule.value;
          if (value < min || value > max) {
            return rule.message || `Value must be between ${min} and ${max}`;
          }
        }
        break;

      case 'custom':
        if (rule.customValidator) {
          // This would be implemented with a custom validator registry
          // For now, we'll skip custom validators
          console.warn('Custom validators not yet implemented');
        }
        break;
    }

    return null;
  }

  /**
   * Validate based on question type
   */
  private validateByType(question: Question, value: any): string | null {
    switch (question.type) {
      case 'text':
      case 'textarea':
        if (typeof value !== 'string') {
          return 'Value must be a string';
        }
        if (
          question.type === 'text' &&
          'maxLength' in question &&
          question.maxLength &&
          value.length > question.maxLength
        ) {
          return `Maximum length is ${question.maxLength}`;
        }
        break;

      case 'select':
        if (value && !question.options?.some((opt) => opt.value === value)) {
          return 'Invalid selection';
        }
        break;

      case 'multiselect':
        if (Array.isArray(value)) {
          const validValues = question.options?.map((opt) => opt.value) || [];
          const invalidValues = value.filter((v) => !validValues.includes(v));
          if (invalidValues.length > 0) {
            return 'Invalid selections';
          }
          if (
            'maxSelections' in question &&
            question.maxSelections &&
            value.length > question.maxSelections
          ) {
            return `Maximum ${question.maxSelections} selections allowed`;
          }
        } else if (value !== null && value !== undefined) {
          return 'Value must be an array';
        }
        break;

      case 'scale':
        if (typeof value === 'number') {
          const config = question.scaleConfig;
          if (config && (value < config.min || value > config.max)) {
            return `Value must be between ${config.min} and ${config.max}`;
          }
        } else if (value !== null && value !== undefined) {
          return 'Value must be a number';
        }
        break;

      case 'number':
      case 'currency':
      case 'number_spinner':
        if (typeof value === 'number') {
          if ('min' in question && question.min !== undefined && value < question.min) {
            return `Minimum value is ${question.min}`;
          }
          if ('max' in question && question.max !== undefined && value > question.max) {
            return `Maximum value is ${question.max}`;
          }
        } else if (value !== null && value !== undefined) {
          return 'Value must be a number';
        }
        break;

      case 'date':
        if (typeof value === 'string' && value.length > 0) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return 'Invalid date format';
          }
          if ('minDate' in question && question.minDate && date < new Date(question.minDate)) {
            return `Date must be after ${question.minDate}`;
          }
          if ('maxDate' in question && question.maxDate && date > new Date(question.maxDate)) {
            return `Date must be before ${question.maxDate}`;
          }
        } else if (value !== null && value !== undefined) {
          return 'Value must be a date string';
        }
        break;

      case 'email':
        if (typeof value === 'string' && value.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'Invalid email format';
          }
        }
        break;

      case 'url':
        if (typeof value === 'string' && value.length > 0) {
          try {
            new URL(value);
          } catch {
            return 'Invalid URL format';
          }
        }
        break;
    }

    return null;
  }

  /**
   * Check if a value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  /**
   * Evaluate conditional logic
   */
  private evaluateCondition(
    conditional: NonNullable<Question['conditional']>,
    formData: Record<string, any>
  ): boolean {
    const fieldValue = formData[conditional.field];
    const conditionValue = conditional.value;

    switch (conditional.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'notEquals':
        return fieldValue !== conditionValue;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(conditionValue as string);
      case 'notContains':
        return typeof fieldValue === 'string' && !fieldValue.includes(conditionValue as string);
      case 'greaterThan':
        return typeof fieldValue === 'number' && fieldValue > (conditionValue as number);
      case 'lessThan':
        return typeof fieldValue === 'number' && fieldValue < (conditionValue as number);
      default:
        return true;
    }
  }

  /**
   * Find question by ID
   */
  private findQuestionById(questionId: string): Question | null {
    for (const section of this.formSchema.sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  /**
   * Find section by ID
   */
  private findSectionById(sectionId: string): Section | null {
    return this.formSchema.sections.find((s) => s.id === sectionId) || null;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = {};
    this.warnings = {};
  }

  /**
   * Clear errors for a specific field
   */
  clearFieldErrors(questionId: string): void {
    delete this.errors[questionId];
    delete this.warnings[questionId];
  }

  /**
   * Get all current errors
   */
  getErrors(): Record<string, string> {
    return { ...this.errors };
  }

  /**
   * Get all current warnings
   */
  getWarnings(): Record<string, string> {
    return { ...this.warnings };
  }
}

/**
 * Create a validation engine instance
 */
export const createValidationEngine = (formSchema: FormSchema): ValidationEngine => {
  return new ValidationEngine(formSchema);
};

/**
 * Validate form data against schema
 */
export const validateFormData = (
  formSchema: FormSchema,
  formData: Record<string, any>
): ValidationResult => {
  const engine = createValidationEngine(formSchema);
  return engine.validateForm(formData);
};

/**
 * Validate a single field
 */
export const validateField = (
  formSchema: FormSchema,
  questionId: string,
  value: any,
  formData: Record<string, any> = {}
): string | null => {
  const engine = createValidationEngine(formSchema);
  return engine.validateField(questionId, value, formData);
};
