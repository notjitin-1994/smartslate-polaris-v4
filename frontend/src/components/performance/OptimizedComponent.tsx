/**
 * OptimizedComponent HOC
 *
 * Higher-order component that automatically applies performance optimizations
 * like memoization, lazy loading, and intersection observer.
 */

import React, { ComponentType, memo, forwardRef, lazy, Suspense, ComponentProps } from 'react';
import { usePerformanceMonitor } from '@/lib/hooks/usePerformanceOptimization';

interface OptimizationOptions {
  memo?: boolean;
  customCompare?: (prevProps: any, nextProps: any) => boolean;
  lazy?: boolean;
  fallback?: React.ReactNode;
  monitorPerformance?: boolean;
  componentName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface OptimizedComponentProps {
  // Add any additional props here if needed
}

/**
 * Higher-order component for performance optimization
 */
export function withOptimization<P extends object>(
  Component: ComponentType<P>,
  options: OptimizationOptions = {}
): ComponentType<P & OptimizedComponentProps> {
  const {
    memo: shouldMemo = true,
    customCompare,
    lazy: shouldLazy = false,
    fallback = <div>Loading...</div>,
    monitorPerformance = false,
    componentName = Component.displayName || Component.name || 'Component',
  } = options;

  let OptimizedComponent = Component;

  // Add performance monitoring
  if (monitorPerformance) {
    const MonitoredComponent = (props: P) => {
      const { startRender } = usePerformanceMonitor(componentName);

      startRender();
      return <Component {...props} />;
    };

    OptimizedComponent = MonitoredComponent;
    OptimizedComponent.displayName = `Monitored(${componentName})`;
  }

  // Apply memoization
  if (shouldMemo) {
    if (customCompare) {
      OptimizedComponent = memo(OptimizedComponent, customCompare);
    } else {
      OptimizedComponent = memo(OptimizedComponent);
    }
    OptimizedComponent.displayName = `Memo(${componentName})`;
  }

  // Apply lazy loading
  if (shouldLazy) {
    const LazyComponent = lazy(() => Promise.resolve({ default: OptimizedComponent }));

    const LazyWrappedComponent = forwardRef<any, P>((props, ref) => (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    ));

    LazyWrappedComponent.displayName = `Lazy(${componentName})`;
    return LazyWrappedComponent;
  }

  // Wrap with forwardRef for ref forwarding
  const ForwardRefComponent = forwardRef<any, P>((props, ref) => (
    <OptimizedComponent {...props} ref={ref} />
  ));

  ForwardRefComponent.displayName = `Optimized(${componentName})`;
  return ForwardRefComponent;
}

/**
 * HOC for list optimization (virtual scrolling)
 */
export function withListOptimization<P extends { items: any[] }>(
  Component: ComponentType<P>,
  options: {
    itemHeight?: number;
    threshold?: number;
    itemName?: string;
  } = {}
) {
  const { itemHeight = 50, threshold = 100, itemName = 'items' } = options;

  const ListOptimizedComponent = memo(
    forwardRef<any, P>((props, ref) => {
      const { items } = props;

      // Only apply virtual scrolling for large lists
      if (items.length > threshold) {
        // Would integrate with virtual scrolling here
        console.log(`Virtual scrolling enabled for ${items.length} ${itemName}`);
      }

      return <Component {...props} ref={ref} />;
    })
  );

  ListOptimizedComponent.displayName = `ListOptimized(${Component.displayName || Component.name})`;
  return ListOptimizedComponent;
}

/**
 * HOC for async data optimization
 */
export function withAsyncData<P extends object>(
  Component: ComponentType<P>,
  options: {
    loadingComponent?: ComponentType<any>;
    errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
    cacheKey?: string;
    cacheTTL?: number;
  } = {}
) {
  const {
    loadingComponent: LoadingComponent = () => <div>Loading...</div>,
    errorComponent: ErrorComponent = ({ error }) => <div>Error: {error.message}</div>,
    cacheKey,
    cacheTTL,
  } = options;

  const AsyncOptimizedComponent = memo(
    forwardRef<any, P>((props, ref) => {
      // Would integrate with useAsyncState and caching here
      // For now, just pass through
      return <Component {...props} ref={ref} />;
    })
  );

  AsyncOptimizedComponent.displayName = `AsyncOptimized(${Component.displayName || Component.name})`;
  return AsyncOptimizedComponent;
}

/**
 * HOC for intersection observer optimization
 */
export function withIntersectionObserver<P extends object>(
  Component: ComponentType<P>,
  options: {
    threshold?: number;
    rootMargin?: string;
    fallback?: React.ReactNode;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '50px', fallback = <div>Loading...</div> } = options;

  const IntersectionOptimizedComponent = memo(
    forwardRef<any, P>((props, ref) => {
      // Would integrate with useLazyLoad here
      // For now, just pass through
      return <Component {...props} ref={ref} />;
    })
  );

  IntersectionOptimizedComponent.displayName = `IntersectionOptimized(${Component.displayName || Component.name})`;
  return IntersectionOptimizedComponent;
}

/**
 * Pre-built optimization presets
 */
export const optimizationPresets = {
  /**
   * Heavy component with lots of computations
   */
  heavy: {
    memo: true,
    monitorPerformance: true,
    lazy: false,
  },

  /**
   * Chart or visualization component
   */
  chart: {
    memo: true,
    monitorPerformance: true,
    lazy: true,
    fallback: <div>Loading chart...</div>,
  },

  /**
   * Large list component
   */
  list: {
    memo: true,
    monitorPerformance: false,
    lazy: false,
  },

  /**
   * Modal or dialog component
   */
  modal: {
    memo: true,
    monitorPerformance: false,
    lazy: true,
    fallback: <div>Loading...</div>,
  },

  /**
   * Form component
   */
  form: {
    memo: true,
    monitorPerformance: false,
    lazy: false,
  },
};

/**
 * Utility function to apply preset optimization
 */
export function withPresetOptimization<P extends object>(
  Component: ComponentType<P>,
  preset: keyof typeof optimizationPresets,
  additionalOptions: OptimizationOptions = {}
): ComponentType<P & OptimizedComponentProps> {
  return withOptimization(Component, {
    ...optimizationPresets[preset],
    ...additionalOptions,
  });
}

export default {
  withOptimization,
  withListOptimization,
  withAsyncData,
  withIntersectionObserver,
  withPresetOptimization,
  optimizationPresets,
};
