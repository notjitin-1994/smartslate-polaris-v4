'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isTextareaQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper } from './BaseInput';
import { cn } from '@/lib/utils';

export const TextareaInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  if (!isTextareaQuestion(question)) {
    console.warn('TextareaInput received non-textarea question:', question);
    return null;
  }

  const inputId = `textarea-${question.id}`;
  const hasError = !!error;

  const textareaClasses = cn(
    'text-foreground placeholder-text-disabled h-auto min-h-[120px] w-full rounded-[0.875rem] border-[1.5px] bg-[rgba(13,27,42,0.4)] px-4 py-3.5 text-base font-normal',
    'resize-none leading-relaxed transition-all duration-300 outline-none',
    'shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)]',
    'hover:border-[var(--border-strong)] hover:bg-[rgba(13,27,42,0.5)]',
    hasError
      ? 'border-error/70 focus:border-error focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]'
      : 'focus:border-primary border-[var(--border-medium)] focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15),inset_0_1px_2px_rgba(0,0,0,0.1),var(--glow-subtle)]',
    disabled && 'cursor-not-allowed bg-[rgba(13,27,42,0.3)] opacity-50'
  );

  const charCount = typeof value === 'string' ? value.length : 0;
  const maxLength = question.maxLength;

  return (
    <InputWrapper
      question={question}
      error={error}
      disabled={disabled}
      value={value}
      onChange={onChange}
      className={className}
      inputId={inputId}
    >
      <textarea
        id={inputId}
        name={question.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={question.required}
        placeholder={question.placeholder}
        rows={question.rows || 4}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        className={textareaClasses}
      />

      {maxLength && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-text-disabled text-[12px]">Character count</span>
          <span
            className={`text-[13px] font-medium ${charCount > maxLength * 0.9 ? 'text-warning' : 'text-text-secondary'}`}
          >
            {charCount} / {maxLength}
          </span>
        </div>
      )}
    </InputWrapper>
  );
};

export default TextareaInput;
