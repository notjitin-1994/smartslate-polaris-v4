import { QueryClient } from '@tanstack/react-query';

// Default query options
const defaultQueryOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors except 408, 429
      if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors except 408, 429
      if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },
};

// Create QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Query invalidation helpers
export const invalidateQueries = {
  blueprints: () => queryClient.invalidateQueries({ queryKey: ['blueprints'] }),
  blueprint: (id: string) =>
    queryClient.invalidateQueries({ queryKey: ['blueprints', 'detail', id] }),
  user: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch helpers
export const prefetchQueries = {
  blueprint: async (_id: string) => {
    // This would be implemented with actual API calls
    // await queryClient.prefetchQuery({
    //   queryKey: ['blueprints', 'detail', id],
    //   queryFn: () => fetchBlueprintById(id),
    // });
  },
};

// Error handling
export const handleQueryError = (error: any) => {
  console.error('Query error:', error);

  // You can add global error handling here
  // e.g., show toast notifications, log to monitoring service, etc.

  return error;
};

// Optimistic update helpers
export const optimisticUpdate = {
  blueprint: (blueprintId: string, updates: any) => {
    queryClient.setQueryData(['blueprints', 'detail', blueprintId], (old: any) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  },

  rollback: (queryKey: any[], previousData: any) => {
    queryClient.setQueryData(queryKey, previousData);
  },
};
