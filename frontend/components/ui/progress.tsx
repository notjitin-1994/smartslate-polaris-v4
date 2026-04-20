'use client';

import * as React from 'react';
import * as ProgressPrimitives from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

/**
 * Progress Component
 *
 * Accessible progress bar component for displaying task completion
 * or loading states with visual feedback.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitives.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitives.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-neutral-200', className)}
    {...props}
  >
    <ProgressPrimitives.Indicator
      className="bg-primary h-full w-full flex-1 transition-all duration-300 ease-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitives.Root>
));

Progress.displayName = ProgressPrimitives.Root.displayName;

export { Progress };
