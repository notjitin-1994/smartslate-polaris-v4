'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isTextQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper, BaseInputField } from './BaseInput';

export const TextInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  if (!isTextQuestion(question)) {
    console.warn('TextInput received non-text question:', question);
    return null;
  }

  const inputId = `text-${question.id}`;

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
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={question.required}
        placeholder={question.placeholder}
        error={error}
        maxLength={question.maxLength}
        aria-label={question.label}
        aria-describedby={question.helpText ? `${inputId}-help` : undefined}
      />

      {question.maxLength && (
        <p className="text-foreground/60 mt-1 text-xs">
          {typeof value === 'string' ? value.length : 0} / {question.maxLength} characters
        </p>
      )}
    </InputWrapper>
  );
};

export default TextInput;
