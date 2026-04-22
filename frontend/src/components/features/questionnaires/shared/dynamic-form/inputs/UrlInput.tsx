'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isUrlQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper, BaseInputField } from './BaseInput';

export const UrlInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  if (!isUrlQuestion(question)) {
    console.warn('UrlInput received non-url question:', question);
    return null;
  }

  const inputId = `url-${question.id}`;

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
        type="url"
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={question.required}
        placeholder={question.placeholder || 'https://example.com'}
        error={error}
        aria-label={question.label}
        aria-describedby={question.helpText ? `${inputId}-help` : undefined}
      />

      {question.helpText && (
        <p id={`${inputId}-help`} className="text-foreground/60 mt-1 text-sm">
          {question.helpText}
        </p>
      )}
    </InputWrapper>
  );
};

export default UrlInput;
