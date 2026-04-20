'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ConditionalFieldsProps {
  showWhen: string | string[] | boolean;
  children: React.ReactNode;
  className?: string;
}

/**
* Conditionally renders a wrapper div with the provided children when the showWhen condition is truthy.
* @example
* ConditionalFields({ showWhen: true, children: <span>Label</span>, className: 'mt-2' })
* <div class="animate-fade-in-up space-y-4 mt-2"><span>Label</span></div>
* @param {{boolean|function(Object):boolean}} {{showWhen}} - Boolean or predicate function used to determine whether children should be shown.
* @param {{React.ReactNode}} {{children}} - Content to render inside the conditional wrapper.
* @param {{string}} {{className}} - Optional additional CSS class name(s) applied to the wrapper.
* @returns {{React.JSX.Element|null}} Rendered container with children when condition is met, otherwise null.
**/
export function ConditionalFields({
  showWhen,
  children,
  className,
}: ConditionalFieldsProps): React.JSX.Element | null {
  const shouldShow = React.useMemo(() => {
    if (typeof showWhen === 'boolean') {
      return showWhen;
    }
    // Will be used with actual field values in parent components
    return true;
  }, [showWhen]);

  if (!shouldShow) {
    return null;
  }

  return <div className={cn('animate-fade-in-up space-y-4', className)}>{children}</div>;
}
