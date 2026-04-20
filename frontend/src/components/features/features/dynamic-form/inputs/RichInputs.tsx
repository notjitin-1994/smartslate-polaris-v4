'use client';

/**
 * Rich Input Components for Dynamic Forms
 *
 * These components adapt the static questionnaire's rich inputs
 * to work with the dynamic form system's BaseInputProps interface.
 */

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import {
  isRadioPillsQuestion,
  isRadioCardsQuestion,
  isCheckboxPillsQuestion,
  isCheckboxCardsQuestion,
  isEnhancedScaleQuestion,
  isLabeledSliderQuestion,
  isToggleSwitchQuestion,
  isCurrencyQuestion,
  isNumberSpinnerQuestion,
} from '@/lib/dynamic-form/schema';
import { RadioPillGroup, type RadioPillOption } from '@/components/wizard/inputs/RadioPillGroup';
import { RadioCardGroup, type RadioCardOption } from '@/components/wizard/inputs/RadioCardGroup';
import {
  CheckboxPillGroup,
  type CheckboxPillOption,
} from '@/components/wizard/inputs/CheckboxPillGroup';
import {
  CheckboxCardGroup,
  type CheckboxCardOption,
} from '@/components/wizard/inputs/CheckboxCardGroup';
import { EnhancedScale } from '@/components/wizard/inputs/EnhancedScale';
import { LabeledSlider } from '@/components/wizard/inputs/LabeledSlider';
import { ToggleSwitch } from '@/components/wizard/inputs/ToggleSwitch';
import { CurrencyInput } from '@/components/wizard/inputs/CurrencyInput';
import { NumberSpinner } from '@/components/wizard/inputs/NumberSpinner';

// ==================== Radio Pills ====================
export const RadioPillsInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isRadioPillsQuestion(question)) {
    console.warn('RadioPillsInput received non-radio-pills question:', question);
    return null;
  }

  const options: RadioPillOption[] = (question.options || []).map((opt) => ({
    value: opt.value,
    label: opt.label,
    icon: opt.icon,
    description: undefined,
  }));

  return (
    <RadioPillGroup
      label={question.label}
      value={value || ''}
      onChange={onChange}
      options={options}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Radio Cards ====================
export const RadioCardsInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isRadioCardsQuestion(question)) {
    console.warn('RadioCardsInput received non-radio-cards question:', question);
    return null;
  }

  const options: RadioCardOption[] = (question.options || []).map((opt) => ({
    value: opt.value,
    label: opt.label,
    icon: opt.icon,
    description: opt.description || '',
  }));

  return (
    <RadioCardGroup
      label={question.label}
      value={value || ''}
      onChange={onChange}
      options={options}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Checkbox Pills ====================
export const CheckboxPillsInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isCheckboxPillsQuestion(question)) {
    console.warn('CheckboxPillsInput received non-checkbox-pills question:', question);
    return null;
  }

  const options: CheckboxPillOption[] = (question.options || []).map((opt) => ({
    value: opt.value,
    label: opt.label,
    icon: opt.icon,
    description: undefined,
  }));

  return (
    <CheckboxPillGroup
      label={question.label}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      options={options}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Checkbox Cards ====================
export const CheckboxCardsInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isCheckboxCardsQuestion(question)) {
    console.warn('CheckboxCardsInput received non-checkbox-cards question:', question);
    return null;
  }

  const options: CheckboxCardOption[] = (question.options || []).map((opt) => ({
    value: opt.value,
    label: opt.label,
    icon: opt.icon,
    description: opt.description || '',
  }));

  return (
    <CheckboxCardGroup
      label={question.label}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      options={options}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Enhanced Scale ====================
export const EnhancedScaleInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  // Enhanced validation with better logging
  if (!isEnhancedScaleQuestion(question)) {
    console.error('[EnhancedScaleInput] Type validation failed:', {
      questionId: question.id,
      questionType: question.type,
      expectedType: 'enhanced_scale',
      hasScaleConfig: 'scaleConfig' in question,
      scaleConfig: (question as any).scaleConfig,
    });
    return null;
  }

  // Provide safe defaults for scaleConfig
  const config = question.scaleConfig || {
    min: 1,
    max: 5,
    step: 1,
    minLabel: 'Low',
    maxLabel: 'High',
  };
  const options: any[] = [];

  // Generate options from min to max
  for (let i = config.min; i <= config.max; i += config.step) {
    const index = Math.floor((i - config.min) / config.step);
    options.push({
      value: i,
      label: config.labels?.[index] || String(i),
    });
  }

  // Log for debugging
  console.log('[EnhancedScaleInput] Rendering enhanced scale:', {
    questionId: question.id,
    config,
    options,
    currentValue: value,
  });

  return (
    <EnhancedScale
      label={question.label}
      value={typeof value === 'number' ? value : config.min}
      onChange={onChange}
      min={config.min}
      max={config.max}
      minLabel={config.minLabel}
      maxLabel={config.maxLabel}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Labeled Slider ====================
export const LabeledSliderInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isLabeledSliderQuestion(question)) {
    console.warn('LabeledSliderInput received non-labeled-slider question:', question);
    return null;
  }

  // Provide safe defaults for sliderConfig
  const config = question.sliderConfig || {
    min: 0,
    max: 100,
    step: 1,
  };

  return (
    <LabeledSlider
      label={question.label}
      value={typeof value === 'number' ? value : config.min}
      onChange={onChange}
      min={config.min}
      max={config.max}
      step={config.step}
      unit={config.unit}
      markers={config.markers as any}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Toggle Switch ====================
export const ToggleSwitchInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isToggleSwitchQuestion(question)) {
    console.warn('ToggleSwitchInput received non-toggle-switch question:', question);
    return null;
  }

  // Provide safe defaults for options
  const options = (
    question.options || [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]
  ).map((opt) => ({
    value: opt.value,
    label: opt.label,
    icon: opt.icon,
  }));

  // Convert value to string for toggle
  const stringValue = String(value || options[0].value);

  return (
    <ToggleSwitch
      label={question.label}
      value={stringValue}
      onChange={onChange}
      options={
        options as [
          { value: string; label: string; icon?: string },
          { value: string; label: string; icon?: string },
        ]
      }
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Currency ====================
export const CurrencyInputComponent: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isCurrencyQuestion(question)) {
    console.warn('CurrencyInput received non-currency question:', question);
    return null;
  }

  return (
    <CurrencyInput
      label={question.label}
      value={typeof value === 'number' ? value : 0}
      onChange={onChange}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// ==================== Number Spinner ====================
export const NumberSpinnerInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  error,
  disabled,
  className,
}) => {
  if (!isNumberSpinnerQuestion(question)) {
    console.warn('NumberSpinnerInput received non-number-spinner question:', question);
    return null;
  }

  // Provide safe defaults for numberConfig
  const config = question.numberConfig || {
    min: 0,
    max: 999,
    step: 1,
  };

  return (
    <NumberSpinner
      label={question.label}
      value={typeof value === 'number' ? value : config.min}
      onChange={onChange}
      min={config.min}
      max={config.max}
      step={config.step}
      error={error}
      helpText={question.helpText}
      required={question.required}
      disabled={disabled}
      className={className}
    />
  );
};

// Export all components
export default {
  RadioPillsInput,
  RadioCardsInput,
  CheckboxPillsInput,
  CheckboxCardsInput,
  EnhancedScaleInput,
  LabeledSliderInput,
  ToggleSwitchInput,
  CurrencyInputComponent,
  NumberSpinnerInput,
};
