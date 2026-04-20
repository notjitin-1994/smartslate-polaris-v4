'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BlueprintState, BlueprintData } from './types';
import type { StaticQuestionsFormValues } from '@/types/static-questionnaire';

const initialState = {
  currentBlueprint: null,
  blueprints: [],
  isLoading: false,
  error: null,
  lastSaved: null,
  hasUnsavedChanges: false,
  version: 1,
};

export const useBlueprintStore = create<BlueprintState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentBlueprint: (blueprint: BlueprintData | null) => {
        set({
          currentBlueprint: blueprint,
          hasUnsavedChanges: false,
          error: null,
        });
      },

      setBlueprints: (blueprints: BlueprintData[]) => {
        set({ blueprints, error: null });
      },

      updateBlueprint: (updates: Partial<BlueprintData>) => {
        const state = get();
        if (!state.currentBlueprint) return;

        const updatedBlueprint = {
          ...state.currentBlueprint,
          ...updates,
          updatedAt: new Date(),
          version: state.version + 1,
        };

        set({
          currentBlueprint: updatedBlueprint,
          hasUnsavedChanges: true,
          version: state.version + 1,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLastSaved: (date: Date) => {
        set({
          lastSaved: date,
          hasUnsavedChanges: false,
        });
      },

      setHasUnsavedChanges: (hasChanges: boolean) => {
        set({ hasUnsavedChanges: hasChanges });
      },

      incrementVersion: () => {
        set((state) => ({ version: state.version + 1 }));
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'blueprint-storage',
      partialize: (state) => ({
        currentBlueprint: state.currentBlueprint,
        blueprints: state.blueprints,
        lastSaved: state.lastSaved,
        hasUnsavedChanges: state.hasUnsavedChanges,
        version: state.version,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Blueprint store rehydration error:', error);
          return;
        }

        // Validate blueprint data on rehydration
        if (state?.currentBlueprint) {
          // Check if blueprint is still valid
          const now = new Date();
          const updatedAt = new Date(state.currentBlueprint.updatedAt);
          const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

          // If blueprint is older than 30 days, mark as potentially stale
          if (daysSinceUpdate > 30) {
            state.setError('Blueprint data may be outdated. Please refresh.');
          }
        }
      },
    }
  )
);

// Selectors for better performance
export const blueprintSelectors = {
  currentBlueprint: (state: BlueprintState) => state.currentBlueprint,
  blueprints: (state: BlueprintState) => state.blueprints,
  isLoading: (state: BlueprintState) => state.isLoading,
  error: (state: BlueprintState) => state.error,
  hasUnsavedChanges: (state: BlueprintState) => state.hasUnsavedChanges,
  lastSaved: (state: BlueprintState) => state.lastSaved,
  version: (state: BlueprintState) => state.version,

  // Computed selectors
  progress: (state: BlueprintState) => {
    if (!state.currentBlueprint) return 0;
    return state.currentBlueprint.progress;
  },

  isDraft: (state: BlueprintState) => {
    return state.currentBlueprint?.status === 'draft';
  },

  isInProgress: (state: BlueprintState) => {
    return state.currentBlueprint?.status === 'in_progress';
  },

  isCompleted: (state: BlueprintState) => {
    return state.currentBlueprint?.status === 'completed';
  },

  // Filtered blueprints
  drafts: (state: BlueprintState) => {
    return state.blueprints.filter((bp) => bp.status === 'draft');
  },

  inProgress: (state: BlueprintState) => {
    return state.blueprints.filter((bp) => bp.status === 'in_progress');
  },

  completed: (state: BlueprintState) => {
    return state.blueprints.filter((bp) => bp.status === 'completed');
  },

  // Search blueprints
  searchBlueprints: (query: string) => (state: BlueprintState) => {
    if (!query.trim()) return state.blueprints;

    const lowercaseQuery = query.toLowerCase();
    return state.blueprints.filter(
      (bp) =>
        bp.title.toLowerCase().includes(lowercaseQuery) ||
        bp.description.toLowerCase().includes(lowercaseQuery) ||
        bp.learningObjective.toLowerCase().includes(lowercaseQuery) ||
        bp.targetAudience.toLowerCase().includes(lowercaseQuery)
    );
  },
};
