import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow',
        secondary:
          'px-6 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm hover:shadow',
        ghost: 'px-6 py-2.5 text-foreground hover:bg-foreground/5',
        destructive: 'px-6 py-2.5 bg-error text-white hover:bg-error/90 shadow-sm hover:shadow',
        outline: 'px-6 py-2.5 border border-neutral-300 text-foreground hover:bg-foreground/5',
        link: 'text-primary underline-offset-4 hover:underline px-2',
      },
      size: {
        sm: 'text-xs px-4 py-2',
        md: 'text-sm px-6 py-2.5',
        lg: 'text-base px-8 py-3',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
