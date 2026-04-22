import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './types';
import type { BlueprintData } from './types';

// Mock API functions - these would be replaced with actual API calls
const mockApi = {
  fetchBlueprints: async (): Promise<BlueprintData[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock data
    return [
      {
        id: '1',
        title: 'Sample Blueprint 1',
        description: 'A sample learning blueprint',
        learningObjective: 'Learn React fundamentals',
        targetAudience: 'Beginners',
        deliveryMethod: 'online',
        duration: 4,
        assessmentType: 'quiz',
        status: 'draft',
        progress: 25,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        version: 1,
        userId: 'user-1',
        staticAnswers: {
          learningObjective: 'Learn React fundamentals',
          targetAudience: 'Beginners',
          deliveryMethod: 'online',
          duration: 4,
          assessmentType: 'quiz',
        },
      },
    ];
  },

  fetchBlueprintById: async (id: string): Promise<BlueprintData> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id,
      title: `Blueprint ${id}`,
      description: `Description for blueprint ${id}`,
      learningObjective: 'Learn advanced concepts',
      targetAudience: 'Intermediate',
      deliveryMethod: 'hybrid',
      duration: 8,
      assessmentType: 'project',
      status: 'in_progress',
      progress: 60,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
      version: 2,
      userId: 'user-1',
      staticAnswers: {
        learningObjective: 'Learn advanced concepts',
        targetAudience: 'Intermediate',
        deliveryMethod: 'hybrid',
        duration: 8,
        assessmentType: 'project',
      },
    };
  },

  saveBlueprint: async (
    blueprint: Omit<BlueprintData, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<BlueprintData> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date();
    return {
      ...blueprint,
      id: `blueprint-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
  },

  updateBlueprint: async (id: string, updates: Partial<BlueprintData>): Promise<BlueprintData> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existing = await mockApi.fetchBlueprintById(id);
    return {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      version: existing.version + 1,
    };
  },

  deleteBlueprint: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.log(`Deleted blueprint ${id}`);
  },
};

// Query hooks
export const useBlueprintsQuery = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.blueprints.list(filters || {}),
    queryFn: () => mockApi.fetchBlueprints(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBlueprintQuery = (id: string) => {
  return useQuery({
    queryKey: queryKeys.blueprints.detail(id),
    queryFn: () => mockApi.fetchBlueprintById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutation hooks
export const useSaveBlueprintMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockApi.saveBlueprint,
    onSuccess: (newBlueprint) => {
      // Invalidate and refetch blueprints list
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.all });

      // Add the new blueprint to the cache
      queryClient.setQueryData(queryKeys.blueprints.detail(newBlueprint.id), newBlueprint);
    },
    onError: (error) => {
      console.error('Failed to save blueprint:', error);
    },
  });
};

export const useUpdateBlueprintMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BlueprintData> }) =>
      mockApi.updateBlueprint(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.blueprints.detail(id) });

      // Snapshot the previous value
      const previousBlueprint = queryClient.getQueryData(queryKeys.blueprints.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        queryKeys.blueprints.detail(id),
        (old: BlueprintData | undefined) => {
          if (!old) return old;
          return { ...old, ...updates };
        }
      );

      // Return a context object with the snapshotted value
      return { previousBlueprint };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousBlueprint) {
        queryClient.setQueryData(queryKeys.blueprints.detail(id), context.previousBlueprint);
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.detail(id) });
    },
  });
};

export const useDeleteBlueprintMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mockApi.deleteBlueprint,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.blueprints.detail(deletedId) });

      // Invalidate blueprints list
      queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.all });
    },
    onError: (error) => {
      console.error('Failed to delete blueprint:', error);
    },
  });
};

// Prefetch hooks
export const usePrefetchBlueprint = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.blueprints.detail(id),
      queryFn: () => mockApi.fetchBlueprintById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Background sync hook
export const useBackgroundSync = () => {
  const queryClient = useQueryClient();

  const syncBlueprints = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.all });
  };

  const syncBlueprint = (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.detail(id) });
  };

  return {
    syncBlueprints,
    syncBlueprint,
  };
};
