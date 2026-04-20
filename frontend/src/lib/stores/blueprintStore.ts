'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/types/supabase';

type BlueprintRow = Database['public']['Tables']['blueprint_generator']['Row'];
type BlueprintUpdate = Database['public']['Tables']['blueprint_generator']['Update'];
import type { Blueprint } from '@/lib/ollama/schema';

export type BlueprintStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export interface BlueprintProgress {
  staticQuestionsCompleted: boolean;
  dynamicQuestionsCompleted: boolean;
  blueprintGenerated: boolean;
  currentStep: 'static' | 'dynamic' | 'generation' | 'review' | 'complete';
  completionPercentage: number;
}

export interface BlueprintState {
  // Current blueprint data
  currentBlueprint: BlueprintRow | null;
  blueprintData: Blueprint | null;

  // Blueprint list and management
  blueprints: BlueprintRow[];
  selectedBlueprintId: string | null;

  // Progress tracking
  progress: BlueprintProgress;

  // Generation state
  isGenerating: boolean;
  generationError: string | null;
  lastGeneratedAt: Date | null;

  // Auto-save state
  autoSaveEnabled: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;

  // Actions for current blueprint
  setCurrentBlueprint: (blueprint: BlueprintRow | null) => void;
  setBlueprintData: (data: Blueprint | null) => void;
  updateBlueprintData: (updates: Partial<Blueprint>) => void;

  // Actions for blueprint list
  setBlueprints: (blueprints: BlueprintRow[]) => void;
  addBlueprint: (blueprint: BlueprintRow) => void;
  updateBlueprint: (id: string, updates: BlueprintUpdate) => void;
  deleteBlueprint: (id: string) => void;
  setSelectedBlueprintId: (id: string | null) => void;

  // Progress actions
  setProgress: (progress: Partial<BlueprintProgress>) => void;
  updateCurrentStep: (step: BlueprintProgress['currentStep']) => void;
  markStepCompleted: (
    step: keyof Omit<BlueprintProgress, 'currentStep' | 'completionPercentage'>
  ) => void;
  calculateCompletionPercentage: () => void;

  // Generation actions
  setGenerating: (isGenerating: boolean) => void;
  setGenerationError: (error: string | null) => void;
  setLastGeneratedAt: (date: Date) => void;

  // Auto-save actions
  setAutoSaveEnabled: (enabled: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  // Utility actions
  resetCurrentBlueprint: () => void;
  resetProgress: () => void;
  resetAll: () => void;
}

const defaultProgress: BlueprintProgress = {
  staticQuestionsCompleted: false,
  dynamicQuestionsCompleted: false,
  blueprintGenerated: false,
  currentStep: 'static',
  completionPercentage: 0,
};

export const useBlueprintStore = create<BlueprintState>()(
  persist(
    (set, get) => ({
      // Current blueprint data
      currentBlueprint: null,
      blueprintData: null,

      // Blueprint list and management
      blueprints: [],
      selectedBlueprintId: null,

      // Progress tracking
      progress: defaultProgress,

      // Generation state
      isGenerating: false,
      generationError: null,
      lastGeneratedAt: null,

      // Auto-save state
      autoSaveEnabled: true,
      lastSavedAt: null,
      hasUnsavedChanges: false,

      // Actions for current blueprint
      setCurrentBlueprint: (blueprint) => {
        set({ currentBlueprint: blueprint });
        if (blueprint?.blueprint_json) {
          try {
            const blueprintData = JSON.parse(blueprint.blueprint_json as string) as Blueprint;
            set({ blueprintData });
          } catch (error) {
            console.error('Failed to parse blueprint JSON:', error);
            set({ blueprintData: null });
          }
        } else {
          set({ blueprintData: null });
        }
      },

      setBlueprintData: (data) => set({ blueprintData: data }),

      updateBlueprintData: (updates) => {
        const currentData = get().blueprintData;
        if (currentData) {
          const updatedData = { ...currentData, ...updates };
          set({
            blueprintData: updatedData,
            hasUnsavedChanges: true,
          });
        }
      },

      // Actions for blueprint list
      setBlueprints: (blueprints) => set({ blueprints }),

      addBlueprint: (blueprint) => {
        set((state) => ({
          blueprints: [blueprint, ...state.blueprints],
        }));
      },

      updateBlueprint: (id, updates) => {
        set((state) => ({
          blueprints: state.blueprints.map((bp) => (bp.id === id ? { ...bp, ...updates } : bp)),
          currentBlueprint:
            state.currentBlueprint?.id === id
              ? { ...state.currentBlueprint, ...updates }
              : state.currentBlueprint,
        }));
      },

      deleteBlueprint: (id) => {
        set((state) => ({
          blueprints: state.blueprints.filter((bp) => bp.id !== id),
          currentBlueprint: state.currentBlueprint?.id === id ? null : state.currentBlueprint,
          selectedBlueprintId: state.selectedBlueprintId === id ? null : state.selectedBlueprintId,
        }));
      },

      setSelectedBlueprintId: (id) => set({ selectedBlueprintId: id }),

      // Progress actions
      setProgress: (progress) => {
        set((state) => ({
          progress: { ...state.progress, ...progress },
        }));
        get().calculateCompletionPercentage();
      },

      updateCurrentStep: (step) => {
        set((state) => ({
          progress: { ...state.progress, currentStep: step },
        }));
        get().calculateCompletionPercentage();
      },

      markStepCompleted: (step) => {
        set((state) => ({
          progress: { ...state.progress, [step]: true },
        }));
        get().calculateCompletionPercentage();
      },

      calculateCompletionPercentage: () => {
        const { progress } = get();
        let completed = 0;
        const total = 4; // static, dynamic, generation, review

        if (progress.staticQuestionsCompleted) completed++;
        if (progress.dynamicQuestionsCompleted) completed++;
        if (progress.blueprintGenerated) completed++;
        if (progress.currentStep === 'complete') completed++;

        const percentage = Math.round((completed / total) * 100);
        set((state) => ({
          progress: { ...state.progress, completionPercentage: percentage },
        }));
      },

      // Generation actions
      setGenerating: (isGenerating) => set({ isGenerating }),

      setGenerationError: (error) => set({ generationError: error }),

      setLastGeneratedAt: (date) => set({ lastGeneratedAt: date }),

      // Auto-save actions
      setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

      setLastSavedAt: (date) => set({ lastSavedAt: date }),

      setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

      // Utility actions
      resetCurrentBlueprint: () => {
        set({
          currentBlueprint: null,
          blueprintData: null,
          selectedBlueprintId: null,
          hasUnsavedChanges: false,
        });
      },

      resetProgress: () => {
        set({ progress: defaultProgress });
      },

      resetAll: () => {
        set({
          currentBlueprint: null,
          blueprintData: null,
          blueprints: [],
          selectedBlueprintId: null,
          progress: defaultProgress,
          isGenerating: false,
          generationError: null,
          lastGeneratedAt: null,
          autoSaveEnabled: true,
          lastSavedAt: null,
          hasUnsavedChanges: false,
        });
      },
    }),
    {
      name: 'blueprint-storage',
      partialize: (state) => ({
        blueprints: state.blueprints,
        selectedBlueprintId: state.selectedBlueprintId,
        progress: state.progress,
        autoSaveEnabled: state.autoSaveEnabled,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
