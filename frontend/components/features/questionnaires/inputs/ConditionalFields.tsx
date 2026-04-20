'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ConditionalFieldsProps {
  showWhen: string | string[] | boolean;
  children: React.ReactNode;
  className?: string;
}

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
