'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions {
  /**
   * The element that is used as the viewport for checking visibility
   */
  root?: Element | null;

  /**
   * Margin around the root element
   */
  rootMargin?: string;

  /**
   * Threshold(s) for triggering the callback
   */
  threshold?: number | number[];

  /**
   * Whether the hook is enabled
   */
  enabled?: boolean;
}

export interface UseIntersectionObserverReturn {
  /**
   * Ref to attach to the element you want to observe
   */
  ref: React.RefObject<Element>;

  /**
   * Whether the element is currently intersecting
   */
  inView: boolean;

  /**
   * Intersection observer entry (for advanced use cases)
   */
  entry?: IntersectionObserverEntry;
}

/**
 * Custom hook for Intersection Observer API with React integration
 *
 * @example
 * ```tsx
 * function LazyComponent() {
 *   const { ref, inView } = useIntersectionObserver({
 *     threshold: 0.1,
 *     rootMargin: '50px',
 *   })
 *
 *   return (
 *     <div ref={ref}>
 *       {inView ? <ExpensiveComponent /> : <LoadingPlaceholder />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { root = null, rootMargin = '0px', threshold = 0, enabled = true } = options;

  const ref = useRef<Element>(null);
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setInView(entry.isIntersecting);
          setEntry(entry);
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, enabled]);

  return { ref, inView, entry };
}
