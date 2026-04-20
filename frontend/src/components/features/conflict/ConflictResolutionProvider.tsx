'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/stores/uiStore';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
import { ConflictResolver, ConflictResolutionStrategy } from '@/lib/stores/conflictResolution';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import type { ConflictData } from '@/lib/stores/types';

interface ConflictResolutionProviderProps {
  children: React.ReactNode;
}

/**
* Provides conflict detection and resolution UI for blueprints, monitoring stores and handling resolution actions.
* @example
* ConflictResolutionProvider({ children: <App /> })
* <JSX.Element />
* @param {{React.ReactNode}} {{children}} - The child elements to be rendered inside the provider.
* @returns {{JSX.Element}} The provider component that wraps children and manages conflict detection and resolution UI.
**/
export function ConflictResolutionProvider({ children }: ConflictResolutionProviderProps) {
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const uiStore = useUIStore();
  const blueprintStore = useBlueprintStore();

  // Monitor for conflicts
  useEffect(() => {
    /**
    * Simulates conflict detection for the current blueprint and, if a conflict is found, sets the current conflict and opens the conflict dialog.
    * @example
    * detectConflicts()
    * undefined
    * @param {void} noArgs - No parameters; the function reads blueprintStore and uiStore from closure and mutates state via setCurrentConflict.
    * @returns {void} Does not return a value; may update state and trigger the conflict modal.
    **/
    const checkForConflicts = () => {
      // This would typically be triggered by API responses or real-time updates
      // For now, we'll simulate conflict detection
      const currentBlueprint = blueprintStore.currentBlueprint;
      if (!currentBlueprint) return;

      // Simulate conflict detection (in real app, this would come from API)
      const hasConflict = Math.random() < 0.1; // 10% chance for demo
      if (hasConflict) {
        const conflict: ConflictData = {
          id: `conflict-${Date.now()}`,
          type: 'version',
          localVersion: currentBlueprint.version,
          remoteVersion: currentBlueprint.version + 1,
          localChanges: currentBlueprint,
          remoteChanges: { ...currentBlueprint, version: currentBlueprint.version + 1 },
          resolution: 'manual',
        };

        setCurrentConflict(conflict);
        uiStore.openModal('conflictDialog');
      }
    };

    // Check for conflicts periodically (in real app, this would be event-driven)
    const interval = setInterval(checkForConflicts, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [blueprintStore, uiStore]);

  // Handle conflict resolution
  /**
   * Resolve the currently selected conflict using the provided strategy and apply the resolved blueprint.
   * @example
   * resolveCurrentConflict('manual')
   * undefined
   * @param {ConflictResolutionStrategy} strategy - The strategy to use when resolving the current conflict.
   * @returns {void} Returns nothing; performs side-effects (updates blueprint store, clears conflict, and shows notifications).
   */
  const handleResolveConflict = (strategy: ConflictResolutionStrategy) => {
    if (!currentConflict) return;

    try {
      const resolvedData = ConflictResolver.resolveConflict(currentConflict, strategy);

      // Update blueprint store with resolved data
      blueprintStore.setCurrentBlueprint(resolvedData);

      // Clear conflict
      setCurrentConflict(null);

      // Show success notification
      uiStore.addNotification({
        type: 'success',
        title: 'Conflict Resolved',
        message: 'The conflict has been successfully resolved.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Failed to resolve conflict:', error);

      // Show error notification
      uiStore.addNotification({
        type: 'error',
        title: 'Resolution Failed',
        message: 'Failed to resolve the conflict. Please try again.',
        duration: 5000,
      });
    }
  };

  // Close conflict dialog
  const handleCloseConflictDialog = () => {
    uiStore.closeModal('conflictDialog');
    setCurrentConflict(null);
  };

  return (
    <>
      {children}
      <ConflictResolutionDialog
        isOpen={uiStore.modals.conflictDialog}
        onClose={handleCloseConflictDialog}
        onResolve={handleResolveConflict}
        conflict={currentConflict}
      />
    </>
  );
}
