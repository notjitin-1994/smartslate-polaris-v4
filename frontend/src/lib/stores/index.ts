// Store exports
export { useAuthStore } from './authStore';
export { useBlueprintStore } from './blueprintStore';
export { useDashboardStore } from './dashboardStore';
export { useUIStore } from './uiStore';
export { useWizardStore } from './wizardStore';

// Re-export types
export type { AuthStatus } from './authStore';
export type { BlueprintStatus, BlueprintProgress } from './blueprintStore';
export type {
  NotificationType,
  Notification,
  ModalType,
  ModalState,
  SidebarState,
} from './uiStore';

// Store composition utilities
import { useAuthStore } from './authStore';
import { useBlueprintStore } from './blueprintStore';
import { useUIStore } from './uiStore';

/**
 * Custom hook for cross-store operations
 * Provides common patterns for interacting with multiple stores
 */
export function useStoreComposition() {
  const authStore = useAuthStore();
  const blueprintStore = useBlueprintStore();
  const uiStore = useUIStore();

  return {
    // Auth-related operations
    auth: {
      ...authStore,
      // Enhanced auth operations that affect other stores
      logout: () => {
        authStore.clearAuth();
        blueprintStore.resetAll();
        uiStore.reset();
        uiStore.addNotification({
          type: 'info',
          title: 'Logged Out',
          message: 'You have been successfully logged out.',
        });
      },

      // Check if user can access blueprint features
      canAccessBlueprint: (blueprintId: string) => {
        const { user } = authStore;
        const { currentBlueprint } = blueprintStore;
        return (
          user && (currentBlueprint?.id === blueprintId || currentBlueprint?.user_id === user.id)
        );
      },
    },

    // Blueprint-related operations
    blueprint: {
      ...blueprintStore,
      // Enhanced blueprint operations that affect other stores
      selectBlueprint: (blueprintId: string) => {
        const { blueprints } = blueprintStore;
        const blueprint = blueprints.find((bp) => bp.id === blueprintId);
        if (blueprint) {
          blueprintStore.setCurrentBlueprint(blueprint);
          uiStore.setCurrentPage(`/blueprints/${blueprintId}`);
          uiStore.addBreadcrumb({
            label: blueprint.title || 'Blueprint',
            href: `/blueprints/${blueprintId}`,
          });
        }
      },

      // Create new blueprint with UI feedback
      createBlueprint: (_blueprintData: any) => {
        uiStore.setGlobalLoading(true);
        uiStore.addNotification({
          type: 'info',
          title: 'Creating Blueprint',
          message: 'Setting up your new learning blueprint...',
        });

        // This would typically call an API
        // For now, just simulate the operation
        setTimeout(() => {
          uiStore.setGlobalLoading(false);
          uiStore.addNotification({
            type: 'success',
            title: 'Blueprint Created',
            message: 'Your new learning blueprint has been created successfully.',
          });
        }, 1000);
      },
    },

    // UI-related operations
    ui: {
      ...uiStore,
      // Enhanced UI operations that coordinate with other stores
      showBlueprintModal: (blueprintId: string) => {
        const { blueprints } = blueprintStore;
        const blueprint = blueprints.find((bp) => bp.id === blueprintId);
        if (blueprint) {
          uiStore.openModal('blueprint-details', blueprint);
        }
      },

      // Show confirmation modal with blueprint context
      confirmBlueprintAction: (action: string, blueprintId: string, onConfirm: () => void) => {
        const { blueprints } = blueprintStore;
        const blueprint = blueprints.find((bp) => bp.id === blueprintId);
        const blueprintTitle = blueprint?.title || 'Blueprint';

        uiStore.openModal(
          'confirmation',
          {
            title: `Confirm ${action}`,
            message: `Are you sure you want to ${action.toLowerCase()} "${blueprintTitle}"?`,
            blueprintId,
          },
          onConfirm
        );
      },
    },

    // Cross-store utilities
    utils: {
      // Reset all stores (useful for logout or app reset)
      resetAll: () => {
        authStore.reset();
        blueprintStore.resetAll();
        uiStore.reset();
      },

      // Get current user's blueprint count
      getUserBlueprintCount: () => {
        const { user } = authStore;
        const { blueprints } = blueprintStore;
        return user ? blueprints.filter((bp) => bp.user_id === user.id).length : 0;
      },

      // Check if user has any incomplete blueprints
      hasIncompleteBlueprints: () => {
        const { user } = authStore;
        const { blueprints } = blueprintStore;
        if (!user) return false;

        return blueprints.some(
          (bp) => bp.user_id === user.id && bp.status !== 'completed' && bp.status !== 'error'
        );
      },

      // Get user's recent blueprints
      getRecentBlueprints: (limit = 5) => {
        const { user } = authStore;
        const { blueprints } = blueprintStore;
        if (!user) return [];

        return blueprints
          .filter((bp) => bp.user_id === user.id)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, limit);
      },
    },
  };
}

/**
 * Store selectors for common patterns
 * These provide optimized selectors for common use cases
 */
export const storeSelectors = {
  // Auth selectors
  isAuthenticated: () => useAuthStore.getState().status === 'authenticated',
  getCurrentUser: () => useAuthStore.getState().user,
  getCurrentSession: () => useAuthStore.getState().session,

  // Blueprint selectors
  getCurrentBlueprint: () => useBlueprintStore.getState().currentBlueprint,
  getBlueprintProgress: () => useBlueprintStore.getState().progress,
  isBlueprintGenerating: () => useBlueprintStore.getState().isGenerating,

  // UI selectors
  getCurrentPage: () => useUIStore.getState().currentPage,
  getUnreadNotificationCount: () => useUIStore.getState().unreadCount,
  isModalOpen: () => useUIStore.getState().modal.isOpen,
  getCurrentModal: () => useUIStore.getState().modal,

  // Combined selectors
  canCreateBlueprint: () => {
    const auth = useAuthStore.getState();
    const ui = useUIStore.getState();
    return auth.status === 'authenticated' && !ui.globalLoading;
  },

  getBlueprintById: (id: string) => {
    const { blueprints } = useBlueprintStore.getState();
    return blueprints.find((bp) => bp.id === id);
  },
};
