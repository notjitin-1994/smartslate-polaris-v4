'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isNumberQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper, BaseInputField } from './BaseInput';

export const NumberInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  if (!isNumberQuestion(question)) {
    console.warn('NumberInput received non-number question:', question);
    return null;
  }

  const inputId = `number-${question.id}`;

  const handleChange = (newValue: unknown) => {
    const strValue = String(newValue || '');
    const numValue = strValue === '' ? null : parseFloat(strValue);
    onChange(numValue);
  };

  return (
    <InputWrapper
      question={question}
      error={error}
      disabled={disabled}
      className={className}
      value={value}
      onChange={onChange}
      inputId={inputId}
    >
      <BaseInputField
        id={inputId}
        name={question.id}
        type="number"
        value={String(value || '')}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        required={question.required}
        placeholder={question.placeholder}
        error={error}
        aria-label={question.label}
        aria-describedby={question.helpText ? `${inputId}-help` : undefined}
      />

      {(question.min !== undefined || question.max !== undefined) && (
        <p className="mt-1 text-xs text-white/60">
          {question.min !== undefined && question.max !== undefined
            ? `Range: ${question.min} - ${question.max}`
            : question.min !== undefined
              ? `Minimum: ${question.min}`
              : `Maximum: ${question.max}`}
        </p>
      )}
    </InputWrapper>
  );
};

export default NumberInput;
