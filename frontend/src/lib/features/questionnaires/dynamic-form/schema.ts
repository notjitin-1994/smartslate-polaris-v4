import { z } from 'zod';

// Enhanced question types for dynamic form system - now with rich input types
export const inputTypeSchema = z.enum([
  // Basic text inputs
  'text',
  'textarea',
  'email',
  'url',
  'number',
  'date',
  // Traditional selection
  'select',
  'multiselect',
  // Visual selection inputs (NEW - Preferred for UX)
  'radio_pills',
  'radio_cards',
  'checkbox_pills',
  'checkbox_cards',
  // Scales & sliders (NEW - Preferred for ratings)
  'scale',
  'enhanced_scale',
  'labeled_slider',
  // Specialized inputs (NEW)
  'toggle_switch',
  'currency',
  'number_spinner',
]);

// Validation rule schema for dynamic validation
// Note: LLM generates "rule" field, but we accept both "rule" and "type" for compatibility
export const validationRuleSchema = z
  .object({
    rule: z
      .enum([
        'required',
        'minLength',
        'maxLength',
        'minSelections', // For checkbox_pills, checkbox_cards
        'maxSelections', // For checkbox_pills, checkbox_cards
        'pattern',
        'min',
        'max',
        'range', // For scale/slider validation
        'email',
        'url',
        'custom',
      ])
      .optional(),
    type: z
      .enum([
        'required',
        'minLength',
        'maxLength',
        'minSelections',
        'maxSelections',
        'pattern',
        'min',
        'max',
        'range',
        'email',
        'url',
        'custom',
      ])
      .optional(),
    value: z.union([z.string(), z.number(), z.array(z.number())]).optional(),
    message: z.string().optional(),
    customValidator: z.string().optional(), // Function name for custom validation
  })
  .transform((data) => ({
    // Normalize: if "rule" is provided but not "type", copy rule to type
    type: data.type || data.rule || 'required',
    rule: data.rule || data.type || 'required',
    value: data.value,
    message: data.message,
    customValidator: data.customValidator,
  }));

// Base question schema with enhanced features
const baseQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  label: z.string().min(1, 'Question label is required'),
  type: inputTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z.array(validationRuleSchema).optional(),
  conditional: z
    .object({
      field: z.string(),
      operator: z.enum([
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'greaterThan',
        'lessThan',
      ]),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
    .optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        disabled: z.boolean().default(false),
      })
    )
    .optional(),
  scaleConfig: z
    .object({
      min: z.number().int().min(0).default(1),
      max: z.number().int().min(1).default(5),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional(),
      step: z.number().int().min(1).default(1),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// Specific question type schemas
export const textQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('text'),
  maxLength: z.number().int().min(1).optional(),
});

export const textareaQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('textarea'),
  rows: z.number().int().min(1).max(20).default(3),
  maxLength: z.number().int().min(1).optional(),
});

export const selectQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('select'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        disabled: z.boolean().default(false),
      })
    )
    .min(1, 'Select questions require options'),
  allowClear: z.boolean().default(false),
});

export const multiselectQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('multiselect'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        disabled: z.boolean().default(false),
      })
    )
    .min(1, 'Multiselect questions require options'),
  maxSelections: z.number().int().min(1).optional(),
});

export const scaleQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('scale'),
  scaleConfig: z
    .object({
      min: z.number().int().min(0).default(1),
      max: z.number().int().min(1).default(5),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional(),
      step: z.number().int().min(1).default(1),
    })
    .refine((config) => config.min < config.max, {
      message: 'Scale minimum must be less than maximum',
    }),
});

export const numberQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  precision: z.number().int().min(0).max(10).optional(),
});

export const dateQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('date'),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
});

export const emailQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('email'),
});

export const urlQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('url'),
});

// Rich input type schemas (NEW)
export const radioPillsQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('radio_pills'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        icon: z.string().optional(),
        disabled: z.boolean().default(false),
      })
    )
    .min(2, 'Radio pills require at least 2 options')
    .max(6, 'Radio pills work best with 2-6 options'),
});

export const radioCardsQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('radio_cards'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        disabled: z.boolean().default(false),
      })
    )
    .min(2, 'Radio cards require at least 2 options')
    .max(4, 'Radio cards work best with 2-4 options'),
});

export const checkboxPillsQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('checkbox_pills'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        icon: z.string().optional(),
        disabled: z.boolean().default(false),
      })
    )
    .min(2, 'Checkbox pills require at least 2 options')
    .max(8, 'Checkbox pills work best with 2-8 options'),
  maxSelections: z.number().int().min(1).optional(),
});

export const checkboxCardsQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('checkbox_cards'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        disabled: z.boolean().default(false),
      })
    )
    .min(2, 'Checkbox cards require at least 2 options')
    .max(6, 'Checkbox cards work best with 2-6 options'),
  maxSelections: z.number().int().min(1).optional(),
});

export const enhancedScaleQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('enhanced_scale'),
  scaleConfig: z
    .object({
      min: z.number().int().min(0).default(1),
      max: z.number().int().min(1).default(5),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional(),
      labels: z.array(z.string()).optional(), // Emojis or icons for each step
      step: z.number().int().min(1).default(1),
    })
    .refine((config) => config.min < config.max, {
      message: 'Scale minimum must be less than maximum',
    }),
});

export const labeledSliderQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('labeled_slider'),
  sliderConfig: z.object({
    min: z.number().default(0),
    max: z.number().default(100),
    step: z.number().default(1),
    unit: z.string().optional(), // e.g., "hours/week", "%", "people"
    markers: z.array(z.number()).optional(), // Show markers at these values
  }),
});

export const toggleSwitchQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('toggle_switch'),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        icon: z.string().optional(),
      })
    )
    .length(2, 'Toggle switch requires exactly 2 options'),
});

export const currencyQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('currency'),
  min: z.number().optional(),
  max: z.number().optional(),
  currencySymbol: z.string().default('$'),
});

export const numberSpinnerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('number_spinner'),
  numberConfig: z.object({
    min: z.number().default(0),
    max: z.number().default(999),
    step: z.number().default(1),
  }),
});

// Union of all question types (including new rich types)
export const questionSchema = z.discriminatedUnion('type', [
  textQuestionSchema,
  textareaQuestionSchema,
  selectQuestionSchema,
  multiselectQuestionSchema,
  scaleQuestionSchema,
  numberQuestionSchema,
  dateQuestionSchema,
  emailQuestionSchema,
  urlQuestionSchema,
  // Rich input types
  radioPillsQuestionSchema,
  radioCardsQuestionSchema,
  checkboxPillsQuestionSchema,
  checkboxCardsQuestionSchema,
  enhancedScaleQuestionSchema,
  labeledSliderQuestionSchema,
  toggleSwitchQuestionSchema,
  currencyQuestionSchema,
  numberSpinnerQuestionSchema,
]);

// Section schema
export const sectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'Each section must have at least one question'),
  order: z.number().int().min(0).optional(),
  isCollapsible: z.boolean().default(true),
  isRequired: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Form schema
export const formSchema = z.object({
  id: z.string().min(1, 'Form ID is required'),
  title: z.string().min(1, 'Form title is required'),
  description: z.string().optional(),
  sections: z.array(sectionSchema).min(1, 'At least one section is required'),
  settings: z
    .object({
      allowSaveProgress: z.boolean().default(true),
      autoSaveInterval: z.number().int().min(1000).default(2000), // milliseconds
      showProgress: z.boolean().default(true),
      allowSectionJump: z.boolean().default(true),
      submitButtonText: z.string().default('Submit'),
      saveButtonText: z.string().default('Save Progress'),
      theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// Form state schema for persistence
export const formStateSchema = z.object({
  formId: z.string(),
  currentSection: z.string().optional(),
  answers: z.record(z.any()),
  progress: z.object({
    completedSections: z.array(z.string()),
    overallProgress: z.number().min(0).max(100),
  }),
  lastSaved: z.string().datetime().optional(),
  version: z.string().default('1.0.0'),
});

// Validation result schema
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(
    z.object({
      fieldId: z.string(),
      message: z.string(),
      type: z.string(),
    })
  ),
  warnings: z
    .array(
      z.object({
        fieldId: z.string(),
        message: z.string(),
        type: z.string(),
      })
    )
    .optional(),
});

// Export types
export type InputType = z.infer<typeof inputTypeSchema>;
export type ValidationRule = z.infer<typeof validationRuleSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type FormSchema = z.infer<typeof formSchema>;
export type FormState = z.infer<typeof formStateSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;

// Specific question types
export type TextQuestion = z.infer<typeof textQuestionSchema>;
export type TextareaQuestion = z.infer<typeof textareaQuestionSchema>;
export type SelectQuestion = z.infer<typeof selectQuestionSchema>;
export type MultiselectQuestion = z.infer<typeof multiselectQuestionSchema>;
export type ScaleQuestion = z.infer<typeof scaleQuestionSchema>;
export type NumberQuestion = z.infer<typeof numberQuestionSchema>;
export type DateQuestion = z.infer<typeof dateQuestionSchema>;
export type EmailQuestion = z.infer<typeof emailQuestionSchema>;
export type UrlQuestion = z.infer<typeof urlQuestionSchema>;
// Rich input types
export type RadioPillsQuestion = z.infer<typeof radioPillsQuestionSchema>;
export type RadioCardsQuestion = z.infer<typeof radioCardsQuestionSchema>;
export type CheckboxPillsQuestion = z.infer<typeof checkboxPillsQuestionSchema>;
export type CheckboxCardsQuestion = z.infer<typeof checkboxCardsQuestionSchema>;
export type EnhancedScaleQuestion = z.infer<typeof enhancedScaleQuestionSchema>;
export type LabeledSliderQuestion = z.infer<typeof labeledSliderQuestionSchema>;
export type ToggleSwitchQuestion = z.infer<typeof toggleSwitchQuestionSchema>;
export type CurrencyQuestion = z.infer<typeof currencyQuestionSchema>;
export type NumberSpinnerQuestion = z.infer<typeof numberSpinnerQuestionSchema>;

// Type guards
export const isTextQuestion = (question: Question): question is TextQuestion =>
  question.type === 'text';
export const isTextareaQuestion = (question: Question): question is TextareaQuestion =>
  question.type === 'textarea';
export const isSelectQuestion = (question: Question): question is SelectQuestion =>
  question.type === 'select';
export const isMultiselectQuestion = (question: Question): question is MultiselectQuestion =>
  question.type === 'multiselect';
export const isScaleQuestion = (question: Question): question is ScaleQuestion =>
  question.type === 'scale';
export const isNumberQuestion = (question: Question): question is NumberQuestion =>
  question.type === 'number';
export const isDateQuestion = (question: Question): question is DateQuestion =>
  question.type === 'date';
export const isEmailQuestion = (question: Question): question is EmailQuestion =>
  question.type === 'email';
export const isUrlQuestion = (question: Question): question is UrlQuestion =>
  question.type === 'url';
// Rich input type guards
export const isRadioPillsQuestion = (question: Question): question is RadioPillsQuestion =>
  question.type === 'radio_pills';
export const isRadioCardsQuestion = (question: Question): question is RadioCardsQuestion =>
  question.type === 'radio_cards';
export const isCheckboxPillsQuestion = (question: Question): question is CheckboxPillsQuestion =>
  question.type === 'checkbox_pills';
export const isCheckboxCardsQuestion = (question: Question): question is CheckboxCardsQuestion =>
  question.type === 'checkbox_cards';
export const isEnhancedScaleQuestion = (question: Question): question is EnhancedScaleQuestion =>
  question.type === 'enhanced_scale';
export const isLabeledSliderQuestion = (question: Question): question is LabeledSliderQuestion =>
  question.type === 'labeled_slider';
export const isToggleSwitchQuestion = (question: Question): question is ToggleSwitchQuestion =>
  question.type === 'toggle_switch';
export const isCurrencyQuestion = (question: Question): question is CurrencyQuestion =>
  question.type === 'currency';
export const isNumberSpinnerQuestion = (question: Question): question is NumberSpinnerQuestion =>
  question.type === 'number_spinner';

// Utility functions
export const createEmptyFormState = (formId: string): FormState => ({
  formId,
  answers: {},
  progress: {
    completedSections: [],
    overallProgress: 0,
  },
  version: '1.0.0',
});

export const validateFormSchema = (
  data: unknown
): { success: boolean; data?: FormSchema; error?: string } => {
  try {
    const result = formSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};
