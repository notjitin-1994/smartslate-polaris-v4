import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 *
 * Loading placeholder component that displays an animated shimmer effect
 * to indicate content is being loaded.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-neutral-200', className)} {...props} />;
}

export { Skeleton };
