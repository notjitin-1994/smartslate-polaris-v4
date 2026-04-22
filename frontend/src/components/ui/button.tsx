'use client';

// v4-cache-bust-01
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TOUCH_TARGETS, TOUCH_STATES, getRecommendedTouchSize } from '@/lib/utils/touch-targets';

/**
 * Touch-First Button Component
 *
 * Comprehensive button component optimized for touch interfaces with
 * proper touch target sizes, accessibility features, and responsive behavior.
 */
const buttonVariants = cva(
  // Base styles with touch-optimized defaults
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: cn(
          'bg-primary text-primary-foreground shadow-sm',
          'hover:bg-primary/90 hover:shadow-md',
          'active:bg-primary/80 active:scale-[0.98]',
          'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        secondary: cn(
          'bg-secondary text-secondary-foreground shadow-sm',
          'hover:bg-secondary/90 hover:shadow-md',
          'active:bg-secondary/80 active:scale-[0.98]',
          'focus-visible:ring-secondary/50 focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        ghost: cn(
          'text-foreground',
          'hover:bg-foreground/5 hover:shadow-sm',
          'active:bg-foreground/10 active:scale-[0.98]',
          'focus-visible:ring-secondary/50 focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        destructive: cn(
          'bg-error text-white shadow-sm',
          'hover:bg-error/90 hover:shadow-md',
          'active:bg-error/80 active:scale-[0.98]',
          'focus-visible:ring-error/50 focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        outline: cn(
          'text-foreground border border-neutral-300',
          'hover:bg-foreground/5 hover:border-neutral-400 hover:shadow-sm',
          'active:bg-foreground/10 active:scale-[0.98]',
          'focus-visible:ring-secondary/50 focus-visible:ring-2 focus-visible:ring-offset-2'
        ),
        link: cn(
          'text-primary underline-offset-4',
          'hover:text-primary/80 hover:underline',
          'active:text-primary/70',
          'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2',
          'px-2' // Minimal padding for link variant
        ),
      },
      size: {
        // Touch-optimized sizes using the touch target system
        small: cn(
          TOUCH_TARGETS.small, // min-h-[36px] min-w-[36px]
          'px-3 py-2 text-xs',
          TOUCH_STATES.hover,
          TOUCH_STATES.focus,
          TOUCH_STATES.active
        ),
        medium: cn(
          TOUCH_TARGETS.minimum, // min-h-[44px] min-w-[44px]
          'px-4 py-2.5 text-sm',
          TOUCH_STATES.hover,
          TOUCH_STATES.focus,
          TOUCH_STATES.active
        ),
        large: cn(
          TOUCH_TARGETS.large, // min-h-[48px] min-w-[48px]
          'px-6 py-3 text-base',
          TOUCH_STATES.hover,
          TOUCH_STATES.focus,
          TOUCH_STATES.active
        ),
        'extra-large': cn(
          TOUCH_TARGETS['extra-large'], // min-h-[56px] min-w-[56px]
          'px-8 py-4 text-lg',
          TOUCH_STATES.hover,
          TOUCH_STATES.focus,
          TOUCH_STATES.active
        ),
        icon: cn(
          TOUCH_TARGETS.minimum, // min-h-[44px] min-w-[44px] for icon buttons
          'p-0', // Remove padding, rely on touch target sizing
          TOUCH_STATES.focus,
          TOUCH_STATES.active,
          'aspect-square' // Ensure square aspect ratio for icon buttons
        ),
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium', // Default to minimum touch target size
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Touch-First Button Component with Enhanced Accessibility
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Auto-recommend touch target size based on context if not explicitly set
    const recommendedTouchSize = (props as any)['data-touch-context']
      ? getRecommendedTouchSize(
          'button',
          (props as any)['data-touch-context'],
          (props as any)['data-available-space']
        )
      : 'minimum';

    // Map touch target sizes to button size variants
    const sizeMapping: Record<string, 'small' | 'medium' | 'large' | 'extra-large' | 'icon'> = {
      minimum: 'medium',
      small: 'small',
      large: 'large',
      'extra-large': 'extra-large',
    };

    const recommendedSize = size || sizeMapping[recommendedTouchSize] || 'medium';

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size: recommendedSize }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

/**
 * Touch-optimized button variants for different use cases
 */
export const TouchButtonVariants = {
  // Primary action button (most important actions)
  primaryAction: {
    variant: 'primary' as const,
    size: 'large' as const,
    'data-touch-context': 'primary',
  },

  // Secondary action button (alternative actions)
  secondaryAction: {
    variant: 'secondary' as const,
    size: 'medium' as const,
    'data-touch-context': 'secondary',
  },

  // Navigation button (menu items, links)
  navigation: {
    variant: 'ghost' as const,
    size: 'medium' as const,
    'data-touch-context': 'navigation',
  },

  // Form submission button
  formSubmit: {
    variant: 'primary' as const,
    size: 'large' as const,
    'data-touch-context': 'form',
  },

  // Destructive action button (delete, cancel, etc.)
  destructive: {
    variant: 'destructive' as const,
    size: 'medium' as const,
    'data-touch-context': 'primary',
  },

  // Icon-only button (compact UI)
  icon: {
    variant: 'ghost' as const,
    size: 'icon' as const,
    'data-touch-context': 'toolbar',
  },
} as const;

/**
 * Button group component for related actions
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, orientation = 'horizontal', spacing = 'normal', className }, ref) => {
    const orientationClasses = {
      horizontal: 'flex flex-row',
      vertical: 'flex flex-col',
    };

    const spacingClasses = {
      tight: 'gap-1',
      normal: 'gap-2',
      loose: 'gap-3',
    };

    return (
      <div
        ref={ref}
        className={cn(orientationClasses[orientation], spacingClasses[spacing], className)}
        role="group"
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

/**
 * Touch-optimized icon button component
 */
export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Loading button component with touch-optimized spinner
 */
export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        className={cn(loading && 'cursor-wait', className)}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText || 'Loading...'}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { buttonVariants };
