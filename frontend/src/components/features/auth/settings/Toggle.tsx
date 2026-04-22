'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Toggle/Switch Component
 * Accessible, touch-optimized toggle switch following WCAG 2.1 AA standards
 * Minimum touch target: 44x44px
 */
export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    { checked = false, onCheckedChange, disabled = false, className, 'aria-label': ariaLabel },
    ref
  ) => {
    const handleToggle = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          // Touch target sizing (44x44px minimum)
          'relative inline-flex h-[44px] w-[44px] items-center justify-center',
          'cursor-pointer',
          'transition-all duration-200',
          'focus-visible:ring-primary focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'rounded-full',
          className
        )}
      >
        {/* Visual Switch Container */}
        <span
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300',
            'shadow-inner',
            checked
              ? 'from-primary to-primary-accent-light bg-gradient-to-r shadow-[0_0_12px_rgba(167,218,219,0.3)]'
              : 'bg-neutral-300',
            disabled && 'opacity-50',
            // Hover states - only on non-touch devices
            !disabled && 'hover:shadow-lg',
            checked && !disabled && 'hover:from-primary-accent-light hover:to-primary',
            !checked && !disabled && 'hover:bg-neutral-400'
          )}
        >
          {/* Switch Thumb */}
          <span
            className={cn(
              'inline-block h-5 w-5 rounded-full transition-all duration-300',
              'bg-white shadow-md',
              'transform',
              checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
              // Enhanced shadow for better depth perception
              checked && 'shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
              !checked && 'shadow-[0_1px_4px_rgba(0,0,0,0.15)]'
            )}
          />

          {/* Subtle glow effect when enabled */}
          {checked && (
            <span className="from-primary to-primary-accent-light absolute inset-0 animate-pulse rounded-full bg-gradient-to-r opacity-30" />
          )}
        </span>
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';

/**
 * ToggleWithLabel - Toggle with integrated label for better UX
 */
interface ToggleWithLabelProps extends ToggleProps {
  label: string;
  description?: string;
}

export const ToggleWithLabel = React.forwardRef<HTMLButtonElement, ToggleWithLabelProps>(
  ({ label, description, className, ...toggleProps }, ref) => {
    const id = React.useId();

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <Toggle ref={ref} {...toggleProps} aria-label={label} />
        <div className="flex-1 pt-2.5">
          <label htmlFor={id} className="text-body text-foreground cursor-pointer font-medium">
            {label}
          </label>
          {description && <p className="text-caption text-text-secondary mt-1">{description}</p>}
        </div>
      </div>
    );
  }
);

ToggleWithLabel.displayName = 'ToggleWithLabel';
