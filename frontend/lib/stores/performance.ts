// Performance optimization utilities for state management
export class PerformanceOptimizer {
  private static updateQueue: Array<() => void> = [];
  private static isProcessing = false;

  // Batch state updates to prevent excessive re-renders
  static batchUpdates(updateFn: () => void): void {
    this.updateQueue.push(updateFn);

    if (!this.isProcessing) {
      this.isProcessing = true;
      requestAnimationFrame(() => {
        this.processUpdateQueue();
      });
    }
  }

  // Process queued updates
  private static processUpdateQueue(): void {
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      if (update) {
        update();
      }
    }
    this.isProcessing = false;
  }

  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Memoize expensive computations
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyFn?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  // Create a selector with memoization
  static createMemoizedSelector<T, R>(
    selector: (state: T) => R,
    equalityFn?: (a: R, b: R) => boolean
  ): (state: T) => R {
    let lastResult: R;
    let lastState: T;

    return (state: T) => {
      if (lastState === state) {
        return lastResult;
      }

      const result = selector(state);

      if (equalityFn ? equalityFn(result, lastResult) : result === lastResult) {
        return lastResult;
      }

      lastResult = result;
      lastState = state;
      return result;
    };
  }

  // Measure performance of a function
  static measurePerformance<T extends (...args: any[]) => any>(func: T, name: string): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();

      console.log(`${name} took ${end - start} milliseconds`);
      return result;
    }) as T;
  }

  // Create a performance monitor
  static createPerformanceMonitor() {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime > 0) {
        fps = 1000 / deltaTime;
      }

      frameCount++;
      lastTime = currentTime;

      if (fps < 30) {
        console.warn(`Low FPS detected: ${fps.toFixed(2)}`);
      }

      requestAnimationFrame(measureFPS);
    };

    return {
      start: () => requestAnimationFrame(measureFPS),
      getFPS: () => fps,
      getFrameCount: () => frameCount,
    };
  }
}

// Store optimization utilities
export const storeOptimizations = {
  // Optimize store subscriptions
  createOptimizedSubscription: <T>(
    store: any,
    selector: (state: T) => any,
    equalityFn?: (a: any, b: any) => boolean
  ) => {
    let lastValue: any;
    const subscribers = new Set<(value: any) => void>();

    const unsubscribe = store.subscribe((state: T) => {
      const newValue = selector(state);

      if (equalityFn ? equalityFn(newValue, lastValue) : newValue === lastValue) {
        return;
      }

      lastValue = newValue;
      subscribers.forEach((callback) => callback(newValue));
    });

    return {
      subscribe: (callback: (value: any) => void) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      },
      unsubscribe,
    };
  },

  // Create a store with performance monitoring
  createMonitoredStore: <T>(store: any, name: string) => {
    const originalSubscribe = store.subscribe;

    store.subscribe = (callback: (state: T) => void) => {
      const wrappedCallback = (state: T) => {
        const start = performance.now();
        callback(state);
        const end = performance.now();

        if (end - start > 16) {
          // More than one frame
          console.warn(`${name} store update took ${end - start}ms`);
        }
      };

      return originalSubscribe.call(store, wrappedCallback);
    };

    return store;
  },
};

// Memory optimization utilities
export const memoryOptimizations = {
  // Clear unused data from stores
  clearUnusedData: (stores: Record<string, any>) => {
    Object.values(stores).forEach((store) => {
      if (store.clearCache) {
        store.clearCache();
      }
    });
  },

  // Limit store history size
  limitHistorySize: (store: any, maxSize: number) => {
    if (store.history && store.history.length > maxSize) {
      store.history = store.history.slice(-maxSize);
    }
  },

  // Garbage collect unused objects
  garbageCollect: () => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  },
};
