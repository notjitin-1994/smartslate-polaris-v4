'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { safeRegExp } from '@/lib/utils/safeRegex';

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface ScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  labels?: string[];
  step?: number;
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  unit: string;
  markers?: number[];
}

interface ValidationRule {
  rule: string;
  value?: string | number | boolean;
  message: string;
}

interface CurrencyConfig {
  symbol?: string;
  min?: number;
  max?: number;
}

interface Question {
  id: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: QuestionOption[];
  scaleConfig?: ScaleConfig;
  sliderConfig?: SliderConfig;
  validation?: ValidationRule[];
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  currencySymbol?: string;
  currencyConfig?: CurrencyConfig;
  step?: number;
}

interface DynamicQuestionRendererProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  touched?: boolean;
  onBlur?: () => void;
}

/**
 * Validate question structure before rendering
 * Ensures all required fields are present and properly formatted
 */
function validateQuestionStructure(question: Question): void {
  if (!question) {
    throw new Error('Question object is undefined or null');
  }

  if (!question.id) {
    throw new Error('Question is missing required "id" field');
  }

  if (!question.label || typeof question.label !== 'string') {
    throw new Error(`Question ${question.id} is missing or has invalid "label" field`);
  }

  if (!question.type) {
    throw new Error(`Question ${question.id} is missing required "type" field`);
  }

  // Validate selection-type questions have options
  const selectionTypes = [
    'radio_pills',
    'checkbox_pills',
    'radio_cards',
    'checkbox_cards',
    'toggle_switch',
    'select',
    'multiselect',
  ];

  if (selectionTypes.includes(question.type)) {
    if (!question.options || !Array.isArray(question.options)) {
      throw new Error(
        `Question ${question.id} (${question.type}) requires an "options" array but none was provided`
      );
    }

    if (question.options.length === 0) {
      throw new Error(
        `Question ${question.id} (${question.type}) has an empty options array. At least one option is required.`
      );
    }

    // Validate each option has value and label
    question.options.forEach((opt, idx) => {
      if (!opt.value || typeof opt.value !== 'string') {
        throw new Error(`Question ${question.id}, option ${idx}: Missing or invalid "value" field`);
      }
      if (!opt.label || typeof opt.label !== 'string') {
        throw new Error(`Question ${question.id}, option ${idx}: Missing or invalid "label" field`);
      }
    });

    // Special validation for toggle switches
    if (question.type === 'toggle_switch' && question.options.length !== 2) {
      throw new Error(
        `Question ${question.id} is a toggle_switch but has ${question.options.length} options. Toggle switches require exactly 2 options.`
      );
    }
  }

  // Validate scale questions have config
  if (['scale', 'enhanced_scale'].includes(question.type)) {
    if (!question.scaleConfig) {
      throw new Error(
        `Question ${question.id} (${question.type}) requires "scaleConfig" but none was provided`
      );
    }
    if (
      typeof question.scaleConfig.min !== 'number' ||
      typeof question.scaleConfig.max !== 'number'
    ) {
      throw new Error(
        `Question ${question.id} scaleConfig must have numeric "min" and "max" values`
      );
    }
  }

  // Validate slider questions have config
  if (question.type === 'labeled_slider') {
    if (!question.sliderConfig) {
      throw new Error(
        `Question ${question.id} (labeled_slider) requires "sliderConfig" but none was provided`
      );
    }
  }
}

/**
 * Validate answer against question rules
 */
function validateAnswer(value: unknown, question: Question): string | null {
  // Required check
  if (question.required) {
    if (value === undefined || value === null || value === '') {
      return 'This field is required';
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'Please select at least one option';
    }
  }

  // Apply custom validation rules
  if (question.validation && value !== undefined && value !== null && value !== '') {
    for (const rule of question.validation) {
      switch (rule.rule) {
        case 'minLength':
          if (typeof value === 'string' && typeof rule.value === 'number') {
            if (value.length < rule.value) {
              return rule.message;
            }
          }
          break;
        case 'maxLength':
          if (typeof value === 'string' && typeof rule.value === 'number') {
            if (value.length > rule.value) {
              return rule.message;
            }
          }
          break;
        case 'min':
          if (typeof value === 'number' && typeof rule.value === 'number') {
            if (value < rule.value) {
              return rule.message;
            }
          }
          break;
        case 'max':
          if (typeof value === 'number' && typeof rule.value === 'number') {
            if (value > rule.value) {
              return rule.message;
            }
          }
          break;
        case 'minSelections':
          if (Array.isArray(value) && typeof rule.value === 'number') {
            if (value.length < rule.value) {
              return rule.message;
            }
          }
          break;
        case 'maxSelections':
          if (Array.isArray(value) && typeof rule.value === 'number') {
            if (value.length > rule.value) {
              return rule.message;
            }
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && typeof rule.value === 'string') {
            const regex = safeRegExp(rule.value);
            if (!regex) {
              console.warn('Invalid regex pattern in validation rule');
              break; // Skip invalid patterns
            }
            if (!regex.test(value)) {
              return rule.message;
            }
          }
          break;
        case 'email':
          if (typeof value === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return rule.message;
            }
          }
          break;
        case 'url':
          if (typeof value === 'string') {
            try {
              new URL(value);
            } catch {
              return rule.message;
            }
          }
          break;
      }
    }
  }

  return null;
}

export function DynamicQuestionRenderer({
  question,
  value: rawValue,
  onChange,
  error: externalError,
  touched: externalTouched,
  onBlur,
}: DynamicQuestionRendererProps): React.JSX.Element {
  // ✅ FIX: Normalize value to prevent "Objects are not valid as a React child" error
  // If value is an object with {label, value} structure (legacy data), extract the value string
  const value = React.useMemo(() => {
    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      // Check if it's an option object {label, value}
      if ('value' in rawValue && typeof rawValue.value === 'string') {
        console.warn('[DynamicQuestionRenderer] Found object value, extracting string:', rawValue);
        return rawValue.value;
      }
      // Check if it's an option object with label only
      if ('label' in rawValue && typeof rawValue.label === 'string') {
        console.warn('[DynamicQuestionRenderer] Found label-only object, using label:', rawValue);
        return rawValue.label;
      }
    }
    return rawValue;
  }, [rawValue]);

  const [localTouched, setLocalTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const touched = externalTouched ?? localTouched;
  const error = externalError ?? localError;

  // Validate question structure on mount
  useEffect(() => {
    try {
      validateQuestionStructure(question);
      setRenderError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid question structure';
      setRenderError(errorMsg);
      console.error(`Question validation failed for ${question.id}:`, err);
    }
  }, [question]);

  // Real-time validation (only show after touched)
  useEffect(() => {
    if (touched) {
      const validationError = validateAnswer(value, question);
      setLocalError(validationError);
    }
  }, [value, question, touched]);

  // Handle blur event
  const handleBlur = () => {
    setLocalTouched(true);
    if (onBlur) {
      onBlur();
    }
  };

  // Wrapper for onChange to validate immediately for selection types
  const handleChange = (newValue: unknown) => {
    onChange(newValue);
    // For selection types, validate immediately (good UX)
    if (
      ['radio_pills', 'radio_cards', 'checkbox_pills', 'checkbox_cards', 'toggle_switch'].includes(
        question.type
      )
    ) {
      setLocalTouched(true);
    }
  };
  const hasError = Boolean(error && touched);

  // Show render error if question structure is invalid
  if (renderError) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-foreground flex items-center gap-2 text-lg font-medium">
            {question.label || 'Unnamed Question'}
            {question.required && (
              <span className="text-error text-base" aria-label="required">
                *
              </span>
            )}
          </label>
        </div>
        <div className="border-error bg-error/10 rounded-xl border p-4" role="alert">
          <p className="text-error mb-2 text-sm font-semibold">Unable to render this question</p>
          <p className="text-text-secondary text-xs">{renderError}</p>
        </div>
      </div>
    );
  }

  const renderInput = () => {
    switch (question.type) {
      case 'radio_pills':
        return renderRadioPills();
      case 'checkbox_pills':
        return renderCheckboxPills();
      case 'radio_cards':
        return renderRadioCards();
      case 'checkbox_cards':
        return renderCheckboxCards();
      case 'toggle_switch':
        return renderToggleSwitch();
      case 'scale':
        return renderScale();
      case 'enhanced_scale':
        return renderEnhancedScale();
      case 'labeled_slider':
        return renderLabeledSlider();
      case 'textarea':
        return renderTextarea();
      case 'text':
        return renderText();
      case 'email':
        return renderEmail();
      case 'url':
        return renderUrl();
      case 'currency':
        return renderCurrency();
      case 'number_spinner':
        return renderNumberSpinner();
      case 'date':
        return renderDate();
      default:
        return <div className="text-error">Unsupported question type: {question.type}</div>;
    }
  };

  const renderRadioPills = () => {
    const options = question.options || [];

    if (options.length === 0) {
      return (
        <div className="border-warning bg-warning/10 rounded-xl border p-4">
          <p className="text-warning text-sm">
            This question has no options to display. Please contact support if this issue persists.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange(option.value)}
              className={cn(
                'group relative rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300',
                'touch-target inline-flex items-center gap-2 border-2',
                'hover:scale-105 active:scale-95',
                isSelected
                  ? 'from-primary/20 to-secondary/20 border-primary text-primary scale-105 bg-gradient-to-r shadow-[0_0_20px_rgba(167,218,219,0.4)]'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:shadow-lg'
              )}
            >
              {isSelected && (
                <div className="from-primary/10 to-secondary/10 absolute inset-0 animate-pulse rounded-xl bg-gradient-to-r" />
              )}
              <span className="relative flex items-center gap-2 text-left">
                {option.icon && <span className="text-lg">{option.icon}</span>}
                {option.label}
              </span>
              {isSelected && (
                <svg
                  className="text-primary relative h-4 w-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderCheckboxPills = () => {
    // Ensure selectedValues is always an array, never a string
    let selectedValues: string[] = [];
    if (Array.isArray(value)) {
      selectedValues = value as string[];
    } else if (value && typeof value === 'string') {
      // If somehow a string was stored, treat it as single selection
      selectedValues = [value];
    }

    // Get selection constraints from validation rules
    const minSelections = question.validation?.find((v) => v.rule === 'minSelections')?.value as
      | number
      | undefined;
    const maxSelections = question.validation?.find((v) => v.rule === 'maxSelections')?.value as
      | number
      | undefined;
    const canAddMore = !maxSelections || selectedValues.length < maxSelections;
    const canRemove = !minSelections || selectedValues.length > minSelections;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {question.options?.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const isDisabled = !isSelected && !canAddMore;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (isSelected && !canRemove) return;
                  if (!isSelected && !canAddMore) return;

                  const newValues = isSelected
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value];
                  handleChange(newValues);
                }}
                disabled={isDisabled}
                className={cn(
                  'group relative rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300',
                  'touch-target inline-flex items-center gap-2 border-2',
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'from-primary/20 to-secondary/20 border-primary text-primary scale-105 bg-gradient-to-r shadow-[0_0_20px_rgba(167,218,219,0.4)]'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:shadow-lg'
                )}
              >
                {isSelected && (
                  <div className="from-primary/10 to-secondary/10 absolute inset-0 animate-pulse rounded-xl bg-gradient-to-r" />
                )}
                <span className="relative flex items-center gap-2 text-left">
                  {option.label}
                  {isSelected && (
                    <svg
                      className="text-primary h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selection count indicator */}
        {(minSelections || maxSelections) && (
          <div className="text-text-secondary text-sm">
            <span
              className={cn(
                selectedValues.length >= (minSelections || 0) &&
                  selectedValues.length <= (maxSelections || Infinity)
                  ? 'text-success'
                  : 'text-error'
              )}
            >
              {selectedValues.length} selected
            </span>
            <span className="text-text-secondary ml-2">
              {minSelections && maxSelections
                ? `(select ${minSelections}-${maxSelections})`
                : minSelections
                  ? `(select at least ${minSelections})`
                  : `(select up to ${maxSelections})`}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderRadioCards = () => {
    // Determine if options have descriptions - use different layouts
    const hasDescriptions = question.options?.some((opt) => opt.description);

    // Calculate if we should use flex (for variable width) or grid (for uniform cards)
    // Use flex for short labels without descriptions, grid for everything else
    const useFlexLayout = !hasDescriptions && question.options && question.options.length > 2;

    return (
      <div
        className={cn(
          'gap-3',
          useFlexLayout
            ? 'flex flex-wrap'
            : hasDescriptions
              ? 'grid grid-cols-1 md:grid-cols-2'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {question.options?.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange(option.value)}
              className={cn(
                'group touch-target relative rounded-2xl text-left transition-all duration-300',
                'border-2 hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? 'from-primary/10 to-secondary/10 border-primary bg-gradient-to-br shadow-[0_0_24px_rgba(167,218,219,0.3)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl',
                hasDescriptions ? 'p-5' : 'p-4',
                useFlexLayout ? 'flex-shrink-0 flex-grow-0' : ''
              )}
            >
              <div className="flex w-full items-start gap-3">
                <div
                  className={cn(
                    'flex flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                    hasDescriptions ? 'mt-1 h-6 w-6' : 'mt-0.5 h-5 w-5',
                    isSelected
                      ? 'border-primary bg-primary/20'
                      : 'border-white/20 group-hover:border-white/40'
                  )}
                >
                  {isSelected && (
                    <div
                      className={cn(
                        'bg-primary animate-pulse rounded-full',
                        hasDescriptions ? 'h-3 w-3' : 'h-2.5 w-2.5'
                      )}
                    />
                  )}
                </div>
                <div className={cn('min-w-0 text-left', useFlexLayout ? '' : 'flex-1')}>
                  <div
                    className={cn(
                      'text-left font-semibold transition-colors',
                      hasDescriptions ? 'mb-1.5 text-base' : 'text-sm',
                      useFlexLayout ? 'whitespace-nowrap' : '',
                      isSelected ? 'text-primary' : 'text-white group-hover:text-white'
                    )}
                  >
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-left text-sm leading-relaxed whitespace-normal text-white/60">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderCheckboxCards = () => {
    // Ensure selectedValues is always an array, never a string
    let selectedValues: string[] = [];
    if (Array.isArray(value)) {
      selectedValues = value as string[];
    } else if (value && typeof value === 'string') {
      // If somehow a string was stored, treat it as single selection
      selectedValues = [value];
    }

    // Get selection constraints from validation rules
    const minSelections = question.validation?.find((v) => v.rule === 'minSelections')?.value as
      | number
      | undefined;
    const maxSelections = question.validation?.find((v) => v.rule === 'maxSelections')?.value as
      | number
      | undefined;
    const canAddMore = !maxSelections || selectedValues.length < maxSelections;
    const canRemove = !minSelections || selectedValues.length > minSelections;

    // Determine if options have descriptions - use different layouts
    const hasDescriptions = question.options?.some((opt) => opt.description);

    // Calculate if we should use flex (for variable width) or grid (for uniform cards)
    // Use flex for short labels without descriptions, grid for everything else
    const useFlexLayout = !hasDescriptions && question.options && question.options.length > 2;

    return (
      <div className="space-y-4">
        <div
          className={cn(
            'gap-3',
            useFlexLayout
              ? 'flex flex-wrap'
              : hasDescriptions
                ? 'grid grid-cols-1 md:grid-cols-2'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {question.options?.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const isDisabled = !isSelected && !canAddMore;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (isSelected && !canRemove) return;
                  if (!isSelected && !canAddMore) return;

                  const newValues = isSelected
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value];
                  handleChange(newValues);
                }}
                disabled={isDisabled}
                className={cn(
                  'group touch-target relative rounded-2xl text-left transition-all duration-300',
                  isDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'border-2 hover:scale-[1.02] active:scale-[0.98]',
                  isSelected
                    ? 'from-primary/10 to-secondary/10 border-primary bg-gradient-to-br shadow-[0_0_24px_rgba(167,218,219,0.3)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl',
                  // Conditional padding based on whether there's a description
                  hasDescriptions ? 'p-5' : 'p-4',
                  useFlexLayout ? 'flex-shrink-0 flex-grow-0' : ''
                )}
              >
                <div className="flex w-full items-start gap-3">
                  {/* Checkbox indicator */}
                  <div
                    className={cn(
                      'flex flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300',
                      hasDescriptions ? 'mt-1 h-6 w-6' : 'mt-0.5 h-5 w-5',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-white/20 group-hover:border-white/40'
                    )}
                  >
                    {isSelected && (
                      <svg
                        className={cn('text-white', hasDescriptions ? 'h-4 w-4' : 'h-3 w-3')}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn('min-w-0 text-left', useFlexLayout ? '' : 'flex-1')}>
                    <div
                      className={cn(
                        'text-left font-semibold transition-colors',
                        hasDescriptions ? 'mb-1.5 text-base' : 'text-sm',
                        useFlexLayout ? 'whitespace-nowrap' : '',
                        isSelected ? 'text-primary' : 'text-white group-hover:text-white'
                      )}
                    >
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-left text-sm leading-relaxed whitespace-normal text-white/60">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection count indicator */}
        {(minSelections || maxSelections) && (
          <div className="text-text-secondary text-sm">
            <span
              className={cn(
                selectedValues.length >= (minSelections || 0) &&
                  selectedValues.length <= (maxSelections || Infinity)
                  ? 'text-success'
                  : 'text-error'
              )}
            >
              {selectedValues.length} selected
            </span>
            <span className="text-text-secondary ml-2">
              {minSelections && maxSelections
                ? `(select ${minSelections}-${maxSelections})`
                : minSelections
                  ? `(select at least ${minSelections})`
                  : `(select up to ${maxSelections})`}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderToggleSwitch = () => {
    // Toggle switch expects exactly 2 options: [No, Yes] or [Off, On]
    const options = question.options || [];
    if (options.length !== 2) {
      return <div className="text-error">Toggle switch requires exactly 2 options</div>;
    }

    // Determine which option represents "Yes/On" (positive state)
    // Check if either option label matches common positive values
    const positiveLabels = ['yes', 'on', 'true', 'enabled', 'active'];
    const negativeLabels = ['no', 'off', 'false', 'disabled', 'inactive'];

    let positiveOption = options[1]; // Default to second option
    let negativeOption = options[0]; // Default to first option

    // Check if we need to swap based on label content
    const option1Lower = options[0].label.toLowerCase();
    const option2Lower = options[1].label.toLowerCase();

    if (positiveLabels.some((label) => option1Lower.includes(label))) {
      positiveOption = options[0];
      negativeOption = options[1];
    } else if (negativeLabels.some((label) => option2Lower.includes(label))) {
      positiveOption = options[0];
      negativeOption = options[1];
    }

    const isPositiveSelected = value === positiveOption.value;

    return (
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            !isPositiveSelected ? 'text-white' : 'text-white/40'
          )}
        >
          {negativeOption.label}
        </span>
        <button
          type="button"
          onClick={() =>
            handleChange(isPositiveSelected ? negativeOption.value : positiveOption.value)
          }
          className={cn(
            'relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200',
            isPositiveSelected ? 'bg-primary' : 'bg-white/20'
          )}
          aria-label={`Toggle between ${negativeOption.label} and ${positiveOption.label}`}
          aria-checked={isPositiveSelected}
          role="switch"
        >
          <span
            className={cn(
              'inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200',
              isPositiveSelected ? 'translate-x-7' : 'translate-x-1'
            )}
          />
        </button>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            isPositiveSelected ? 'text-white' : 'text-white/40'
          )}
        >
          {positiveOption.label}
        </span>
      </div>
    );
  };

  const renderScale = () => {
    const config = question.scaleConfig || { min: 1, max: 5, step: 1 };
    const currentValue = (value as number) || config.min;

    return (
      <div className="space-y-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
        <div className="flex items-center justify-between">
          {config.minLabel && (
            <span className="text-sm font-medium text-white/60">{config.minLabel}</span>
          )}
          <div className="flex flex-col items-center">
            <span className="text-primary mb-1 text-4xl font-bold">{currentValue}</span>
            <span className="text-xs tracking-wider text-white/40 uppercase">Selected Value</span>
          </div>
          {config.maxLabel && (
            <span className="text-sm font-medium text-white/60">{config.maxLabel}</span>
          )}
        </div>
        <div className="relative">
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step || 1}
            value={currentValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            onBlur={handleBlur}
            className="slider-thumb h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10 transition-all hover:h-4"
            style={{
              background: `linear-gradient(to right, rgba(167, 218, 219, 0.3) 0%, rgba(167, 218, 219, 0.3) ${((currentValue - config.min) / (config.max - config.min)) * 100}%, rgba(255, 255, 255, 0.1) ${((currentValue - config.min) / (config.max - config.min)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
            }}
          />
          {/* Scale markers */}
          <div className="mt-2 flex justify-between px-1">
            {Array.from({ length: config.max - config.min + 1 }, (_, i) => config.min + i).map(
              (mark) => (
                <div key={mark} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-2 w-1 rounded-full transition-all',
                      mark === currentValue ? 'bg-primary h-3' : 'bg-white/20'
                    )}
                  />
                  <span
                    className={cn(
                      'mt-1 text-xs transition-all',
                      mark === currentValue ? 'text-primary font-semibold' : 'text-white/40'
                    )}
                  >
                    {mark}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEnhancedScale = () => {
    const config = question.scaleConfig || { min: 1, max: 5, step: 1, labels: [] };
    const currentValue = (value as number) || config.min;

    // Helper to extract string from potential {label, value} objects
    const extractString = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
      if (typeof val === 'object') {
        if ('value' in val) return String(val.value);
        if ('label' in val) return String(val.label);
      }
      return String(val);
    };

    const labelStr = config.labels?.[currentValue - 1];
    const safeLabelStr = extractString(labelStr);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mb-2 text-3xl">{safeLabelStr ? safeLabelStr.split(' ')[0] : '⚪'}</div>
          <div className="text-primary text-xl font-semibold">
            {safeLabelStr ? safeLabelStr.split(' ').slice(1).join(' ') : currentValue}
          </div>
        </div>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step || 1}
          value={currentValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          onBlur={handleBlur}
          className="slider-thumb h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10"
        />
        <div className="flex justify-between text-xs text-white/40">
          <span>{extractString(config.minLabel)}</span>
          <span>{extractString(config.maxLabel)}</span>
        </div>
      </div>
    );
  };

  const renderLabeledSlider = () => {
    const config = question.sliderConfig || { min: 0, max: 100, step: 1, unit: '%' };
    const currentValue = (value as number) || config.min;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-primary text-3xl font-bold">
            {currentValue}
            {config.unit}
          </span>
        </div>
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={currentValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          onBlur={handleBlur}
          className="slider-thumb h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10"
        />
        {config.markers && (
          <div className="flex justify-between text-xs text-white/40">
            {config.markers.map((marker, idx) => {
              // Handle markers that might be objects with {label, value}
              const displayValue =
                typeof marker === 'object' && marker !== null
                  ? 'value' in marker
                    ? (marker as any).value
                    : 'label' in marker
                      ? (marker as any).label
                      : String(marker)
                  : marker;
              return (
                <span key={idx}>
                  {displayValue}
                  {config.unit}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTextarea = () => {
    const rows = question.rows || 5;
    const maxLength = question.maxLength;
    const currentLength = ((value as string) || '').length;
    const progress = maxLength ? (currentLength / maxLength) * 100 : 0;

    return (
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={question.placeholder}
            rows={rows}
            maxLength={maxLength}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${question.id}-error`
                : question.helpText
                  ? `${question.id}-help`
                  : undefined
            }
            className={cn(
              'text-foreground placeholder-text-disabled w-full rounded-2xl border-2 bg-white/5 px-5 py-4',
              'focus:ring-primary/20 resize-none transition-all focus:bg-white/10 focus:ring-2',
              'hover:border-white/20',
              hasError ? 'border-error focus:border-error' : 'focus:border-primary border-white/10'
            )}
          />
          {currentLength > 0 && (
            <div className="absolute right-3 bottom-3 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span
                className={cn(
                  'text-xs font-medium',
                  maxLength && currentLength > maxLength * 0.9 ? 'text-warning' : 'text-white/60'
                )}
              >
                {currentLength}
                {maxLength && ` / ${maxLength}`}
              </span>
            </div>
          )}
        </div>
        {maxLength && (
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                progress > 90 ? 'bg-warning' : progress > 70 ? 'bg-yellow-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderText = () => {
    const maxLength = question.maxLength;
    const currentLength = ((value as string) || '').length;

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={question.placeholder}
            maxLength={maxLength}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${question.id}-error`
                : question.helpText
                  ? `${question.id}-help`
                  : undefined
            }
            className={cn(
              'text-foreground placeholder-text-disabled w-full rounded-xl border-2 bg-white/5 px-5 py-4',
              'focus:ring-primary/20 transition-all focus:bg-white/10 focus:ring-2',
              'hover:border-white/20',
              hasError
                ? 'border-error focus:border-error shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                : 'focus:border-primary border-white/10 focus:shadow-[0_0_12px_rgba(167,218,219,0.2)]'
            )}
          />
          {maxLength && currentLength > 0 && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <span
                className={cn(
                  'rounded-full px-2 py-1 text-xs font-medium',
                  currentLength > maxLength * 0.9
                    ? 'text-warning bg-warning/10'
                    : 'bg-white/5 text-white/40'
                )}
              >
                {currentLength}/{maxLength}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmail = () => (
    <input
      type="email"
      value={(value as string) || ''}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={question.placeholder || 'email@example.com'}
      aria-invalid={hasError}
      aria-describedby={
        hasError ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined
      }
      className={cn(
        'text-foreground placeholder-text-disabled focus:ring-primary/20 w-full rounded-lg border-2 bg-white/5 px-4 py-3 transition-all focus:bg-white/10 focus:ring-2',
        hasError ? 'border-error focus:border-error' : 'focus:border-primary border-white/10'
      )}
    />
  );

  const renderUrl = () => (
    <input
      type="url"
      value={(value as string) || ''}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={question.placeholder || 'https://example.com'}
      aria-invalid={hasError}
      aria-describedby={
        hasError ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined
      }
      className={cn(
        'text-foreground placeholder-text-disabled focus:ring-primary/20 w-full rounded-lg border-2 bg-white/5 px-4 py-3 transition-all focus:bg-white/10 focus:ring-2',
        hasError ? 'border-error focus:border-error' : 'focus:border-primary border-white/10'
      )}
    />
  );

  const renderCurrency = () => {
    const config = question.currencyConfig || { symbol: '$', min: 0 };
    const currencySymbol = config.symbol || '$';
    const min = config.min ?? 0;
    const max = config.max;
    const step = question.step ?? 0.01;

    return (
      <div className="space-y-2">
        <div className="relative">
          <span className="text-text-secondary absolute top-1/2 left-4 -translate-y-1/2 font-medium">
            {currencySymbol}
          </span>
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) {
                handleChange(val);
              }
            }}
            onBlur={handleBlur}
            placeholder="0"
            min={min}
            max={max}
            step={step}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${question.id}-error`
                : question.helpText
                  ? `${question.id}-help`
                  : undefined
            }
            className={cn(
              'text-foreground placeholder-text-disabled focus:ring-primary/20 w-full rounded-lg border-2 bg-white/5 py-3 pr-4 pl-8 transition-all focus:bg-white/10 focus:ring-2',
              hasError ? 'border-error focus:border-error' : 'focus:border-primary border-white/10'
            )}
          />
        </div>
        {(min !== undefined || max !== undefined) && (
          <div className="text-text-secondary flex justify-between text-xs">
            {min !== undefined && (
              <span>
                Min: {currencySymbol}
                {min.toLocaleString()}
              </span>
            )}
            {max !== undefined && (
              <span>
                Max: {currencySymbol}
                {max.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNumberSpinner = () => {
    const min = question.min ?? 0;
    const max = question.max;
    const step = question.step ?? 1;

    return (
      <div className="space-y-2">
        <input
          type="number"
          value={(value as number) || ''}
          onChange={(e) => handleChange(Number(e.target.value))}
          onBlur={handleBlur}
          placeholder="0"
          min={min}
          max={max}
          step={step}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${question.id}-error`
              : question.helpText
                ? `${question.id}-help`
                : undefined
          }
          className={cn(
            'text-foreground placeholder-text-disabled focus:ring-primary/20 w-full rounded-lg border-2 bg-white/5 px-4 py-3 transition-all focus:bg-white/10 focus:ring-2',
            hasError ? 'border-error focus:border-error' : 'focus:border-primary border-white/10'
          )}
        />
        {(min !== undefined || max !== undefined) && (
          <div className="text-xs text-white/40">
            {min !== undefined && max !== undefined
              ? `Range: ${min} - ${max}`
              : min !== undefined
                ? `Minimum: ${min}`
                : `Maximum: ${max}`}
          </div>
        )}
      </div>
    );
  };

  const renderDate = () => (
    <input
      type="date"
      value={(value as string) || ''}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      aria-invalid={hasError}
      aria-describedby={
        hasError ? `${question.id}-error` : question.helpText ? `${question.id}-help` : undefined
      }
      className={cn(
        'text-foreground focus:ring-primary/20 w-full rounded-lg border-2 bg-white/5 px-4 py-3 transition-all focus:bg-white/10 focus:ring-2',
        hasError ? 'border-error focus:border-error' : 'focus:border-primary border-white/10'
      )}
    />
  );

  return (
    <div className="space-y-4">
      {/* Question Label */}
      <div className="space-y-2">
        <label
          htmlFor={question.id}
          className="text-foreground flex items-center gap-2 text-lg font-medium"
        >
          {question.label}
          {question.required && (
            <span className="text-error text-base" aria-label="required">
              *
            </span>
          )}
        </label>
        {question.helpText && (
          <p id={`${question.id}-help`} className="text-text-secondary text-[15px] leading-relaxed">
            {question.helpText}
          </p>
        )}
      </div>

      {/* Question Input */}
      <div>{renderInput()}</div>

      {/* Validation Error Message - Only shown when touched and has error */}
      {hasError && (
        <div
          id={`${question.id}-error`}
          className="bg-error/10 border-error/30 animate-in fade-in slide-in-from-top-1 flex items-start gap-2 rounded-lg border p-3 duration-200"
          role="alert"
          aria-live="polite"
        >
          <svg
            className="text-error mt-0.5 h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-error text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
