import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBlueprintStore, blueprintSelectors } from './blueprintStore';
import { useAuthStore } from './authStore';
import type { BlueprintData } from './types';

// Integration hook that syncs Zustand stores with React Query
export const useZustandQueryIntegration = () => {
  const queryClient = useQueryClient();
  const blueprintStore = useBlueprintStore();
  const authStore = useAuthStore();

  // Sync blueprint store with React Query cache
  useEffect(() => {
    const currentBlueprint = blueprintStore.currentBlueprint;
    // When blueprint store changes, update React Query cache
    if (currentBlueprint) {
      queryClient.setQueryData(['blueprints', currentBlueprint.id], currentBlueprint);
    }
  }, [blueprintStore.currentBlueprint, queryClient]);

  // Sync auth changes with query invalidation
  useEffect(() => {
    // When user logs out, clear all queries
    if (!authStore.user && !authStore.session) {
      queryClient.clear();
    }
  }, [authStore.user, authStore.session, queryClient]);

  // Return integration utilities
  return {
    // Sync a blueprint from React Query to Zustand
    syncBlueprintFromQuery: (blueprintId: string) => {
      const cachedBlueprint = queryClient.getQueryData<BlueprintData>(['blueprints', blueprintId]);

      if (cachedBlueprint) {
        blueprintStore.setCurrentBlueprint(cachedBlueprint);
      }
    },

    // Sync all blueprints from React Query to Zustand
    syncBlueprintsFromQuery: () => {
      const cachedBlueprints = queryClient.getQueryData<BlueprintData[]>(['blueprints']);

      if (cachedBlueprints) {
        blueprintStore.setBlueprints(cachedBlueprints);
      }
    },

    // Clear all data when user logs out
    clearAllData: () => {
      queryClient.clear();
      blueprintStore.reset();
    },
  };
};

// Hook for optimistic updates with rollback
export const useOptimisticBlueprintUpdate = () => {
  const queryClient = useQueryClient();
  const blueprintStore = useBlueprintStore();

  const performOptimisticUpdate = (
    blueprintId: string,
    updates: Partial<BlueprintData>,
    rollbackData?: BlueprintData
  ) => {
    // Store current state for potential rollback
    const currentBlueprint = blueprintStore.currentBlueprint;

    // Update Zustand store optimistically
    blueprintStore.updateBlueprint(updates);

    // Update React Query cache optimistically
    queryClient.setQueryData(['blueprints', blueprintId], (old: BlueprintData | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });

    // Return rollback function
    return () => {
      if (rollbackData) {
        blueprintStore.setCurrentBlueprint(rollbackData);
        queryClient.setQueryData(['blueprints', blueprintId], rollbackData);
      } else if (currentBlueprint) {
        blueprintStore.setCurrentBlueprint(currentBlueprint);
        queryClient.setQueryData(['blueprints', blueprintId], currentBlueprint);
      }
    };
  };

  return { performOptimisticUpdate };
};

// Hook for background sync
export const useBackgroundSync = () => {
  const queryClient = useQueryClient();

  const syncAll = () => {
    queryClient.invalidateQueries({ queryKey: ['blueprints'] });
  };

  const syncBlueprint = (blueprintId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['blueprints', blueprintId],
    });
  };

  // Set up periodic background sync
  useEffect(() => {
    const interval = setInterval(
      () => {
        // Only sync if user is authenticated
        if (authStore.user && authStore.session) {
          syncAll();
        }
      },
      5 * 60 * 1000
    ); // Every 5 minutes

    return () => clearInterval(interval);
  }, [authStore.user, authStore.session]);

  return {
    syncAll,
    syncBlueprint,
  };
};

// Hook for query state management
export const useQueryStateManagement = () => {
  const queryClient = useQueryClient();
  const blueprintStore = useBlueprintStore();

  const setLoading = (loading: boolean) => {
    blueprintStore.setLoading(loading);
  };

  const setError = (error: string | null) => {
    blueprintStore.setError(error);
  };

  // Monitor query states and update Zustand accordingly
  useEffect(() => {
    const queries = queryClient.getQueryCache().getAll();

    // Check if any blueprint queries are loading
    const isLoading = queries.some(
      (query) => query.queryKey.includes('blueprints') && query.state.status === 'pending'
    );

    // Check if any blueprint queries have errors
    const hasError = queries.some(
      (query) => query.queryKey.includes('blueprints') && query.state.status === 'error'
    );

    setLoading(isLoading);
    setError(hasError ? 'Failed to load blueprint data' : null);
  }, [queryClient, blueprintStore]);

  return {
    setLoading,
    setError,
  };
};
