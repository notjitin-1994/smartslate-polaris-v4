import { useQueryClient } from '@tanstack/react-query';
import { useBlueprintStore } from './blueprintStore';
import { useUIStore } from './uiStore';
import { queryKeys } from './types';
import type { BlueprintData } from './types';

// Optimistic update manager
export class OptimisticUpdateManager {
  private static rollbackStack: Array<{
    id: string;
    timestamp: Date;
    rollbackFn: () => void;
  }> = [];

  // Perform optimistic update for blueprint save
  static performBlueprintSave(
    blueprint: BlueprintData,
    queryClient: any,
    blueprintStore: any,
    uiStore: any
  ): () => void {
    // Store current state for rollback
    const currentState = {
      blueprint: blueprintStore.currentBlueprint,
      hasUnsavedChanges: blueprintStore.hasUnsavedChanges,
      lastSaved: blueprintStore.lastSaved,
    };

    // Optimistically update Zustand store
    blueprintStore.setCurrentBlueprint(blueprint);
    blueprintStore.setHasUnsavedChanges(false);
    blueprintStore.setLastSaved(new Date());

    // Optimistically update React Query cache
    queryClient.setQueryData(queryKeys.blueprints.detail(blueprint.id), blueprint);

    // Update blueprints list cache
    queryClient.setQueryData(queryKeys.blueprints.lists(), (old: BlueprintData[] | undefined) => {
      if (!old) return [blueprint];

      const existingIndex = old.findIndex((bp) => bp.id === blueprint.id);
      if (existingIndex >= 0) {
        const updated = [...old];
        updated[existingIndex] = blueprint;
        return updated;
      }

      return [...old, blueprint];
    });

    // Show optimistic UI feedback
    uiStore.setLoadingState('saving', true);
    uiStore.addNotification({
      type: 'info',
      title: 'Saving...',
      message: 'Your changes are being saved',
      duration: 2000,
    });

    // Create rollback function
    const rollback = () => {
      blueprintStore.setCurrentBlueprint(currentState.blueprint);
      blueprintStore.setHasUnsavedChanges(currentState.hasUnsavedChanges);
      blueprintStore.setLastSaved(currentState.lastSaved);

      // Rollback React Query cache
      queryClient.setQueryData(queryKeys.blueprints.detail(blueprint.id), currentState.blueprint);

      uiStore.setLoadingState('saving', false);
      uiStore.addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Your changes could not be saved',
        duration: 5000,
      });
    };

    // Add to rollback stack
    this.rollbackStack.push({
      id: blueprint.id,
      timestamp: new Date(),
      rollbackFn: rollback,
    });

    return rollback;
  }

  // Perform optimistic update for blueprint update
  static performBlueprintUpdate(
    blueprintId: string,
    updates: Partial<BlueprintData>,
    queryClient: any,
    blueprintStore: any,
    uiStore: any
  ): () => void {
    // Store current state for rollback
    const currentBlueprint = blueprintStore.currentBlueprint;
    const currentVersion = blueprintStore.version;

    // Optimistically update Zustand store
    blueprintStore.updateBlueprint(updates);

    // Optimistically update React Query cache
    queryClient.setQueryData(
      queryKeys.blueprints.detail(blueprintId),
      (old: BlueprintData | undefined) => {
        if (!old) return old;
        return { ...old, ...updates, version: old.version + 1 };
      }
    );

    // Show optimistic UI feedback
    uiStore.setLoadingState('saving', true);

    // Create rollback function
    const rollback = () => {
      blueprintStore.setCurrentBlueprint(currentBlueprint);
      blueprintStore.setVersion(currentVersion);

      // Rollback React Query cache
      queryClient.setQueryData(queryKeys.blueprints.detail(blueprintId), currentBlueprint);

      uiStore.setLoadingState('saving', false);
      uiStore.addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Your changes could not be updated',
        duration: 5000,
      });
    };

    return rollback;
  }

  // Perform optimistic update for blueprint delete
  static performBlueprintDelete(
    blueprintId: string,
    queryClient: any,
    blueprintStore: any,
    uiStore: any
  ): () => void {
    // Store current state for rollback
    const currentBlueprints = blueprintStore.blueprints;
    const deletedBlueprint = currentBlueprints.find((bp: BlueprintData) => bp.id === blueprintId);

    // Optimistically update Zustand store
    blueprintStore.setBlueprints(
      currentBlueprints.filter((bp: BlueprintData) => bp.id !== blueprintId)
    );

    // Optimistically update React Query cache
    queryClient.removeQueries({ queryKey: queryKeys.blueprints.detail(blueprintId) });
    queryClient.setQueryData(queryKeys.blueprints.lists(), (old: BlueprintData[] | undefined) => {
      if (!old) return [];
      return old.filter((bp) => bp.id !== blueprintId);
    });

    // Show optimistic UI feedback
    uiStore.addNotification({
      type: 'info',
      title: 'Deleting...',
      message: 'Blueprint is being deleted',
      duration: 2000,
    });

    // Create rollback function
    const rollback = () => {
      blueprintStore.setBlueprints(currentBlueprints);

      // Rollback React Query cache
      if (deletedBlueprint) {
        queryClient.setQueryData(queryKeys.blueprints.detail(blueprintId), deletedBlueprint);
        queryClient.setQueryData(queryKeys.blueprints.lists(), currentBlueprints);
      }

      uiStore.addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Blueprint could not be deleted',
        duration: 5000,
      });
    };

    return rollback;
  }

  // Rollback last optimistic update
  static rollbackLast(): boolean {
    const lastUpdate = this.rollbackStack.pop();
    if (lastUpdate) {
      lastUpdate.rollbackFn();
      return true;
    }
    return false;
  }

  // Rollback all optimistic updates
  static rollbackAll(): void {
    while (this.rollbackStack.length > 0) {
      this.rollbackLast();
    }
  }

  // Clear rollback stack
  static clearRollbackStack(): void {
    this.rollbackStack = [];
  }

  // Get rollback stack info
  static getRollbackInfo(): Array<{
    id: string;
    timestamp: Date;
  }> {
    return this.rollbackStack.map((item) => ({
      id: item.id,
      timestamp: item.timestamp,
    }));
  }
}

// React hooks for optimistic updates
export const useOptimisticBlueprintSave = () => {
  const queryClient = useQueryClient();
  const blueprintStore = useBlueprintStore();
  const uiStore = useUIStore();

  const performOptimisticSave = (blueprint: BlueprintData) => {
    return OptimisticUpdateManager.performBlueprintSave(
      blueprint,
      queryClient,
      blueprintStore,
      uiStore
    );
  };

  return { performOptimisticSave };
};

export const useOptimisticBlueprintUpdate = () => {
  const queryClient = useQueryClient();
  const blueprintStore = useBlueprintStore();
  const uiStore = useUIStore();

  const performOptimisticUpdate = (blueprintId: string, updates: Partial<BlueprintData>) => {
    return OptimisticUpdateManager.performBlueprintUpdate(
      blueprintId,
      updates,
      queryClient,
      blueprintStore,
      uiStore
    );
  };

  return { performOptimisticUpdate };
};

export const useOptimisticBlueprintDelete = () => {
  const queryClient = useQueryClient();
  const blueprintStore = useBlueprintStore();
  const uiStore = useUIStore();

  const performOptimisticDelete = (blueprintId: string) => {
    return OptimisticUpdateManager.performBlueprintDelete(
      blueprintId,
      queryClient,
      blueprintStore,
      uiStore
    );
  };

  return { performOptimisticDelete };
};

// Retry logic with exponential backoff
export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Conflict resolution for optimistic updates
export const resolveOptimisticConflict = (
  localData: BlueprintData,
  remoteData: BlueprintData,
  strategy: 'local' | 'remote' | 'merge' = 'merge'
): BlueprintData => {
  switch (strategy) {
    case 'local':
      return localData;

    case 'remote':
      return remoteData;

    case 'merge':
      // Simple merge strategy - prefer non-null values, local takes precedence
      return {
        ...remoteData,
        ...localData,
        version: Math.max(localData.version, remoteData.version) + 1,
        updatedAt: new Date(),
      };

    default:
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
  }
};
