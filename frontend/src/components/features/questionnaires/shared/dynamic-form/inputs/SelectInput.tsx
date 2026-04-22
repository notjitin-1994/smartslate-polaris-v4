'use client';

import React from 'react';
import { BaseInputProps } from '@/lib/dynamic-form';
import { isSelectQuestion } from '@/lib/dynamic-form/schema';
import { InputWrapper } from './BaseInput';
import { cn } from '@/lib/utils';

export const SelectInput: React.FC<BaseInputProps> = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  className,
}) => {
  if (!isSelectQuestion(question)) {
    console.warn('SelectInput received non-select question:', question);
    return null;
  }

  const inputId = `select-${question.id}`;
  const hasError = !!error;

  const selectClasses = cn(
    'text-foreground h-[3.25rem] w-full rounded-[0.875rem] border-[1.5px] bg-[rgba(13,27,42,0.4)] px-4 text-base font-normal',
    'cursor-pointer appearance-none transition-all duration-300 outline-none',
    'shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05)]',
    'hover:border-[var(--border-strong)] hover:bg-[rgba(13,27,42,0.5)]',
    hasError
      ? 'border-error/70 focus:border-error focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]'
      : 'focus:border-primary border-[var(--border-medium)] focus:bg-[rgba(13,27,42,0.6)] focus:shadow-[0_0_0_3px_rgba(167,218,219,0.15),inset_0_1px_2px_rgba(0,0,0,0.1),var(--glow-subtle)]',
    disabled && 'cursor-not-allowed bg-[rgba(13,27,42,0.3)] opacity-50'
  );

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
      <select
        id={inputId}
        name={question.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        required={question.required}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        className={selectClasses}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a7dadb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 1rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.25em 1.25em',
          paddingRight: '3rem',
        }}
      >
        {!question.required && (
          <option value="" disabled className="bg-background-paper text-text-disabled">
            Select an option...
          </option>
        )}
        {question.options?.map((option, index) => (
          <option
            key={`${option.value}-${index}`}
            value={option.value}
            disabled={option.disabled}
            className="bg-background-paper text-foreground"
          >
            {option.label}
          </option>
        ))}
      </select>
    </InputWrapper>
  );
};

export default SelectInput;
