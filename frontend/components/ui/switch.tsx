'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

/**
 * Touch-First Switch Component
 *
 * Accessible toggle switch optimized for touch interfaces with
 * proper touch target sizes and visual feedback.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Base styles with touch-optimized sizing (min 44px height for touch targets)
      'peer inline-flex h-11 w-20 shrink-0 cursor-pointer items-center rounded-full',
      'border-2 border-transparent shadow-sm transition-colors duration-200',
      // Focus states
      'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Colors
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-neutral-200',
      // Hover states
      'hover:data-[state=checked]:bg-primary/90 hover:data-[state=unchecked]:bg-neutral-300',
      // Active states
      'active:scale-[0.98]',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Thumb sizing and positioning
        'pointer-events-none block h-9 w-9 rounded-full bg-white shadow-lg ring-0',
        // Transition
        'transition-transform duration-200',
        // Transform based on state
        'data-[state=checked]:translate-x-9 data-[state=unchecked]:translate-x-1'
      )}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
