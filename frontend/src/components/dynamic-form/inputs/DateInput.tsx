'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isDateQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper, BaseInputField } from './BaseInput';

export const DateInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  if (!isDateQuestion(question)) {
    console.warn('DateInput received non-date question:', question);
    return null;
  }

  const inputId = `date-${question.id}`;

  return (
    <InputWrapper
      question={question}
      error={error}
      disabled={disabled}
      className={className}
      inputId={inputId}
      value={value}
      onChange={onChange}
    >
      <BaseInputField
        id={inputId}
        name={question.id}
        type="date"
        value={String(value || '')}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={question.required}
        error={error}
        aria-label={question.label}
        aria-describedby={question.helpText ? `${inputId}-help` : undefined}
      />

      {question.helpText && (
        <p id={`${inputId}-help`} className="text-foreground/60 mt-1 text-sm">
          {question.helpText}
        </p>
      )}

      {(question.minDate || question.maxDate) && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {question.minDate && question.maxDate
            ? `Date range: ${question.minDate} - ${question.maxDate}`
            : question.minDate
              ? `Earliest date: ${question.minDate}`
              : `Latest date: ${question.maxDate}`}
        </p>
      )}
    </InputWrapper>
  );
};

export default DateInput;
