'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TOUCH_TARGETS, TOUCH_STATES, getRecommendedTouchSize } from '@/lib/touch-targets';

/**
 * Touch-First Input Component
 *
 * Comprehensive input component optimized for touch interfaces with
 * proper touch target sizes, accessibility features, and responsive behavior.
 */
const inputVariants = cva(
  // Base styles with touch-optimized defaults
  'flex w-full rounded-lg border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default: cn(
          'border-input',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        error: cn(
          'border-destructive',
          'focus-visible:ring-destructive focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        success: cn(
          'border-green-500',
          'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2'
        ),
      },
      size: {
        // Touch-optimized sizes using the touch target system
        small: cn(
          TOUCH_TARGETS.small, // min-h-[36px] min-w-[36px]
          'px-3 py-2 text-xs'
        ),
        medium: cn(
          TOUCH_TARGETS.minimum, // min-h-[44px] min-w-[44px]
          'px-4 py-2.5 text-sm'
        ),
        large: cn(
          TOUCH_TARGETS.large, // min-h-[48px] min-w-[48px]
          'px-5 py-3 text-base'
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'medium', // Default to minimum touch target size
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Auto-recommend touch target size based on context if not explicitly set
    const recommendedTouchSize = (props as any)['data-touch-context']
      ? getRecommendedTouchSize(
          'input',
          (props as any)['data-touch-context'],
          (props as any)['data-available-space']
        )
      : 'minimum';

    // Map touch target sizes to input size variants
    const sizeMapping: Record<string, 'small' | 'medium' | 'large'> = {
      minimum: 'medium',
      small: 'small',
      large: 'large',
    };

    const recommendedSize = size || sizeMapping[recommendedTouchSize] || 'medium';

    return (
      <input
        type={props.type || 'text'}
        className={cn(inputVariants({ variant, size: recommendedSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

/**
 * Touch-optimized textarea component
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Auto-recommend touch target size based on context if not explicitly set
    const recommendedSize =
      size ||
      (props['data-touch-context']
        ? getRecommendedTouchSize(
            'input',
            props['data-touch-context'] as any,
            props['data-available-space'] as any
          )
        : 'medium');

    return (
      <textarea
        className={cn(
          inputVariants({ variant, size: recommendedSize }),
          'min-h-[120px] resize-y', // Minimum height for touch usability
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

/**
 * Touch-optimized select component
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof inputVariants> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    // Auto-recommend touch target size based on context if not explicitly set
    const recommendedSize =
      size ||
      (props['data-touch-context']
        ? getRecommendedTouchSize(
            'input',
            props['data-touch-context'] as any,
            props['data-available-space'] as any
          )
        : 'medium');

    return (
      <select
        className={cn(
          inputVariants({ variant, size: recommendedSize }),
          'cursor-pointer', // Better UX for mobile dropdowns
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

/**
 * Touch-optimized form field wrapper
 */
export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, label, error, helperText, required, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && (
          <label className="text-foreground text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        {children}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {helperText && <p className="text-muted-foreground text-sm">{helperText}</p>}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

/**
 * Touch-optimized input group for related fields
 */
export interface InputGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ children, orientation = 'vertical', spacing = 'normal', className }, ref) => {
    const orientationClasses = {
      horizontal: 'flex flex-row gap-3',
      vertical: 'flex flex-col gap-4',
    };

    return (
      <div ref={ref} className={cn(orientationClasses[orientation], className)} role="group">
        {children}
      </div>
    );
  }
);
InputGroup.displayName = 'InputGroup';

export { Input, Textarea, Select };
