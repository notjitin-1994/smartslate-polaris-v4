/**
 * Performance Optimization Hooks
 *
 * React hooks for optimizing component performance with memoization,
 * debouncing, and lazy loading patterns.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce, throttle } from 'lodash-es';

interface UseDebounceOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

interface UseThrottleOptions {
  wait: number;
  leading?: boolean;
  trailing?: boolean;
}

interface UseMemoOptions<T> {
  deps: React.DependencyList;
  isEqual?: (prev: T, next: T) => boolean;
}

interface UseAsyncStateOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
}

/**
 * Hook for debounced values
 */
export function useDebounce<T>(value: T, options: UseDebounceOptions): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const debounced = debounce(
      (newValue: T) => {
        setDebouncedValue(newValue);
      },
      options.delay,
      {
        leading: options.leading,
        trailing: options.trailing,
      }
    );

    debounced(value);

    return () => {
      debounced.cancel();
    };
  }, [value, options.delay, options.leading, options.trailing]);

  return debouncedValue;
}

/**
 * Hook for throttled values
 */
export function useThrottle<T>(value: T, options: UseThrottleOptions): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);

  useEffect(() => {
    const throttled = throttle(
      (newValue: T) => {
        setThrottledValue(newValue);
      },
      options.wait,
      {
        leading: options.leading,
        trailing: options.trailing,
      }
    );

    throttled(value);

    return () => {
      throttled.cancel();
    };
  }, [value, options.wait, options.leading, options.trailing]);

  return throttledValue;
}

/**
 * Hook for deep memoization with custom comparison
 */
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !depsEqual(deps, ref.current.deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

/**
 * Hook for optimized async state management
 */
export function useAsyncState<T>(asyncFn: () => Promise<T>, options: UseAsyncStateOptions<T> = {}) {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
      setLoading(false);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      options.onError?.(error);
      return null;
    }
  }, [asyncFn, options.onSuccess, options.onError]);

  const retry = useCallback(() => {
    const maxRetries = options.retryCount || 3;
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      return execute();
    }
  }, [execute, retryCount, options.retryCount]);

  const reset = useCallback(() => {
    setData(options.initialData);
    setLoading(false);
    setError(null);
    setRetryCount(0);
  }, [options.initialData]);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
    retryCount,
  };
}

/**
 * Hook for intersection observer-based lazy loading
 */
export function useLazyLoad(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
}

/**
 * Hook for virtual scrolling (simplified version)
 */
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
}

/**
 * Hook for window resize optimization
 */
export function useWindowSize(debounceMs = 250) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);

    window.addEventListener('resize', handleResize);
    handleResize(); // Call immediately to set initial size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceMs]);

  return windowSize;
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  const mountTime = useRef<number>();

  useEffect(() => {
    mountTime.current = performance.now();
  }, []);

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;

      // Log slow renders
      if (renderTime > 16) {
        // More than one frame
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const getMetrics = useCallback(
    () => ({
      componentName,
      mountTime: mountTime.current,
      renderCount: 1, // Would need actual counting in production
    }),
    [componentName]
  );

  return {
    startRender,
    getMetrics,
  };
}

/**
 * Hook for optimized event handling
 */
export function useEventCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args) => callbackRef.current(...args)) as T, deps);
}

/**
 * Hook for cached API calls
 */
export function useCachedCall<T extends (...args: any[]) => Promise<any>>(
  key: string,
  asyncFn: T,
  ttl = 5 * 60 * 1000 // 5 minutes
) {
  const cache = useRef(new Map<string, { data: any; timestamp: number }>());

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      const cached = cache.current.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }

      try {
        const result = await asyncFn(...args);
        cache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
        return result;
      } catch (error) {
        // Don't cache errors
        cache.current.delete(cacheKey);
        throw error;
      }
    },
    [key, asyncFn, ttl]
  );

  const invalidate = useCallback(() => {
    // Clear all cache entries for this key
    for (const cacheKey of cache.current.keys()) {
      if (cacheKey.startsWith(key + ':')) {
        cache.current.delete(cacheKey);
      }
    }
  }, [key]);

  return { execute, invalidate };
}

// Utility function for deep equality check
function depsEqual(deps1: React.DependencyList, deps2: React.DependencyList): boolean {
  if (deps1.length !== deps2.length) return false;

  for (let i = 0; i < deps1.length; i++) {
    if (deps1[i] !== deps2[i]) {
      // For objects, do a shallow comparison
      if (
        typeof deps1[i] === 'object' &&
        deps1[i] !== null &&
        typeof deps2[i] === 'object' &&
        deps2[i] !== null
      ) {
        if (!shallowEqual(deps1[i] as Record<string, any>, deps2[i] as Record<string, any>)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  return true;
}

// Utility function for shallow object comparison
function shallowEqual(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}
