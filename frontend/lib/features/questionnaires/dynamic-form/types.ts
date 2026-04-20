import { z } from 'zod';
import {
  formStateSchema,
  FormSchema,
  Question,
  Section,
  ValidationResult,
  InputType,
} from './schema';

// Re-export FormState from schema
export type FormState = z.infer<typeof formStateSchema>;

// Form renderer props
export interface DynamicFormRendererProps {
  formSchema: FormSchema;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onSave?: (data: Record<string, any>) => void | Promise<void>;
  onValidationChange?: (isValid: boolean, errors: ValidationResult['errors']) => void;
  className?: string;
  disabled?: boolean;
  showProgress?: boolean;
  autoSave?: boolean;
}

// Input component props
export interface BaseInputProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Section navigator props
export interface SectionNavigatorProps {
  sections: Section[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  completedSections: string[];
  className?: string;
  collapsible?: boolean;
}

// Progress tracker props
export interface ProgressTrackerProps {
  totalSections: number;
  completedSections: number;
  currentSection: number;
  className?: string;
  showPercentage?: boolean;
  showSections?: boolean;
}

// Form persistence hook return type
export interface UseFormPersistenceReturn {
  saveForm: () => Promise<void>;
  loadForm: () => Promise<FormState | null>;
  clearForm: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

// Form state management
export interface FormStateStore {
  formState: FormState;
  setAnswer: (questionId: string, value: any) => void;
  setSectionProgress: (sectionId: string, completed: boolean) => void;
  setCurrentSection: (sectionId: string) => void;
  resetForm: () => void;
  getFormData: () => Record<string, any>;
  getSectionData: (sectionId: string) => Record<string, any>;
  validateForm: () => ValidationResult;
  validateSection: (sectionId: string) => ValidationResult;
}

// Validation context
export interface ValidationContext {
  validateField: (questionId: string, value: any) => string | null;
  validateSection: (sectionId: string) => ValidationResult;
  validateForm: () => ValidationResult;
  clearErrors: (questionId?: string) => void;
  errors: Record<string, string>;
}

// Form submission context
export interface FormSubmissionContext {
  isSubmitting: boolean;
  submitForm: () => Promise<void>;
  saveForm: () => Promise<void>;
  canSubmit: boolean;
  canSave: boolean;
}

// Accessibility props
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Theme configuration
export interface FormTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Form configuration
export interface FormConfig {
  theme: FormTheme;
  validation: {
    showInlineErrors: boolean;
    validateOnBlur: boolean;
    validateOnChange: boolean;
  };
  accessibility: {
    announceErrors: boolean;
    skipLinks: boolean;
    keyboardNavigation: boolean;
  };
  persistence: {
    enabled: boolean;
    storageKey: string;
    autoSaveInterval: number;
  };
}

// Event handlers
export interface FormEventHandlers {
  onFieldChange: (questionId: string, value: any) => void;
  onFieldBlur: (questionId: string) => void;
  onFieldFocus: (questionId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onFormSubmit: (data: Record<string, any>) => void;
  onFormSave: (data: Record<string, any>) => void;
  onValidationChange: (isValid: boolean, errors: ValidationResult['errors']) => void;
}

// Utility types
export type FormData = Record<string, any>;
export type SectionData = Record<string, any>;
export type FieldValue = string | number | boolean | string[] | number[] | null | undefined;

// Component ref types
export interface DynamicFormRef {
  submit: () => Promise<void>;
  save: () => Promise<void>;
  reset: () => void;
  validate: () => ValidationResult;
  getData: () => FormData;
  setData: (data: FormData) => void;
  goToSection: (sectionId: string) => void;
  nextSection: () => void;
  previousSection: () => void;
}

// Error types
export interface FormError {
  code: string;
  message: string;
  field?: string;
  section?: string;
}

export interface ValidationError extends FormError {
  type: 'validation';
  rule: string;
}

export interface SubmissionError extends FormError {
  type: 'submission';
  status?: number;
}

export interface PersistenceError extends FormError {
  type: 'persistence';
  operation: 'save' | 'load' | 'clear';
}

// Hook return types
export interface UseDynamicFormReturn {
  formData: FormData;
  currentSection: string;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  actions: {
    setValue: (questionId: string, value: any) => void;
    setSection: (sectionId: string) => void;
    nextSection: () => void;
    previousSection: () => void;
    submit: () => Promise<void>;
    save: () => Promise<void>;
    reset: () => void;
    validate: () => ValidationResult;
  };
}

export interface UseFormValidationReturn {
  isValid: boolean;
  errors: Record<string, string>;
  validateField: (questionId: string, value: any) => string | null;
  validateSection: (sectionId: string) => ValidationResult;
  validateForm: () => ValidationResult;
  clearErrors: (questionId?: string) => void;
}

// Re-export types from schema for convenience
export type { FormSchema, Question, Section, ValidationResult, InputType } from './schema';
