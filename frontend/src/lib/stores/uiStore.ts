'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState, NotificationData } from './types';

const initialState = {
  currentStep: 0,
  totalSteps: 0,
  canGoNext: false,
  canGoPrevious: false,
  modals: {
    resumeDialog: false,
    conflictDialog: false,
    exportDialog: false,
    settingsDialog: false,
  },
  notifications: [],
  loadingStates: {
    saving: false,
    loading: false,
    exporting: false,
  },
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step: number) => {
        const state = get();
        const maxStep = Math.max(0, state.totalSteps - 1);
        const newStep = Math.max(0, Math.min(step, maxStep));

        set({
          currentStep: newStep,
          canGoNext: newStep < maxStep,
          canGoPrevious: newStep > 0,
        });
      },

      setTotalSteps: (steps: number) => {
        const state = get();
        const newSteps = Math.max(1, steps);

        set({
          totalSteps: newSteps,
          canGoNext: state.currentStep < newSteps - 1,
          canGoPrevious: state.currentStep > 0,
        });
      },

      setCanGoNext: (canGo: boolean) => {
        set({ canGoNext: canGo });
      },

      setCanGoPrevious: (canGo: boolean) => {
        set({ canGoPrevious: canGo });
      },

      openModal: (modal: keyof UIState['modals']) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: true,
          },
        }));
      },

      closeModal: (modal: keyof UIState['modals']) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: false,
          },
        }));
      },

      addNotification: (notification: Omit<NotificationData, 'id'>) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: NotificationData = {
          ...notification,
          id,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      setLoadingState: (key: keyof UIState['loadingStates'], loading: boolean) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        }));
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        totalSteps: state.totalSteps,
        modals: {
          settingsDialog: state.modals.settingsDialog, // Only persist settings modal
        },
      }),
    }
  )
);

// Selectors for better performance
export const uiSelectors = {
  currentStep: (state: UIState) => state.currentStep,
  totalSteps: (state: UIState) => state.totalSteps,
  canGoNext: (state: UIState) => state.canGoNext,
  canGoPrevious: (state: UIState) => state.canGoPrevious,
  modals: (state: UIState) => state.modals,
  notifications: (state: UIState) => state.notifications,
  loadingStates: (state: UIState) => state.loadingStates,

  // Computed selectors
  progress: (state: UIState) => {
    if (state.totalSteps === 0) return 0;
    return ((state.currentStep + 1) / state.totalSteps) * 100;
  },

  isFirstStep: (state: UIState) => state.currentStep === 0,
  isLastStep: (state: UIState) => state.currentStep === state.totalSteps - 1,

  // Modal helpers
  isModalOpen: (modal: keyof UIState['modals']) => (state: UIState) => {
    return state.modals[modal];
  },

  // Notification helpers
  notificationsByType: (type: NotificationData['type']) => (state: UIState) => {
    return state.notifications.filter((n) => n.type === type);
  },

  hasNotifications: (state: UIState) => state.notifications.length > 0,

  // Loading helpers
  isLoading: (state: UIState) => {
    return Object.values(state.loadingStates).some((loading) => loading);
  },

  isSaving: (state: UIState) => state.loadingStates.saving,
  isLoadingData: (state: UIState) => state.loadingStates.loading,
  isExporting: (state: UIState) => state.loadingStates.exporting,
};

// Helper functions for common UI operations
export const uiHelpers = {
  // Navigation helpers
  goToNextStep: () => {
    const state = useUIStore.getState();
    if (state.canGoNext) {
      state.setCurrentStep(state.currentStep + 1);
    }
  },

  goToPreviousStep: () => {
    const state = useUIStore.getState();
    if (state.canGoPrevious) {
      state.setCurrentStep(state.currentStep - 1);
    }
  },

  goToStep: (step: number) => {
    const state = useUIStore.getState();
    state.setCurrentStep(step);
  },

  // Notification helpers
  showSuccess: (title: string, message: string, duration = 5000) => {
    useUIStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  },

  showError: (title: string, message: string, duration = 0) => {
    useUIStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration,
    });
  },

  showWarning: (title: string, message: string, duration = 7000) => {
    useUIStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  },

  showInfo: (title: string, message: string, duration = 5000) => {
    useUIStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  },

  clearAllNotifications: () => {
    const state = useUIStore.getState();
    state.notifications.forEach((notification) => {
      state.removeNotification(notification.id);
    });
  },
};
