'use client';

import { useState, useEffect } from 'react';
import { actionHistory } from '@/lib/stores/actionHistory';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
import { useUIStore } from '@/lib/stores/uiStore';

interface UndoRedoControlsProps {
  className?: string;
}

export function UndoRedoControls({ className = '' }: UndoRedoControlsProps) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyInfo, setHistoryInfo] = useState({
    pastCount: 0,
    futureCount: 0,
    totalCount: 0,
    currentAction: undefined as string | undefined,
  });

  const blueprintStore = useBlueprintStore();
  const uiStore = useUIStore();

  // Update undo/redo state
  useEffect(() => {
    const updateState = () => {
      setCanUndo(actionHistory.canUndo());
      setCanRedo(actionHistory.canRedo());
      setHistoryInfo({
        ...actionHistory.getHistoryInfo(),
        currentAction: actionHistory.getHistoryInfo().currentAction || undefined,
      });
    };

    // Update state initially
    updateState();

    // Update state when blueprint changes
    const unsubscribeBlueprint = (blueprintStore as any).subscribe?.(updateState);
    const unsubscribeUI = (uiStore as any).subscribe?.(updateState);

    return () => {
      unsubscribeBlueprint();
      unsubscribeUI();
    };
  }, [blueprintStore, uiStore]);

  const handleUndo = () => {
    if (canUndo) {
      const previousState = actionHistory.undo();
      if (previousState) {
        // Restore blueprint state
        if (previousState.action === 'blueprint_update') {
          blueprintStore.setCurrentBlueprint(previousState.state);
        }
        // Restore UI state
        else if (previousState.action === 'ui_update') {
          // This would need to be implemented based on UI store structure
          console.log('Restoring UI state:', previousState.state);
        }
      }
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = actionHistory.redo();
      if (nextState) {
        // Restore blueprint state
        if (nextState.action === 'blueprint_update') {
          blueprintStore.setCurrentBlueprint(nextState.state);
        }
        // Restore UI state
        else if (nextState.action === 'ui_update') {
          // This would need to be implemented based on UI store structure
          console.log('Restoring UI state:', nextState.state);
        }
      }
    }
  };

  const handleClearHistory = () => {
    actionHistory.clear();
    setCanUndo(false);
    setCanRedo(false);
    setHistoryInfo({
      pastCount: 0,
      futureCount: 0,
      totalCount: 0,
      currentAction: undefined,
    });
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>

      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>

      {(canUndo || canRedo) && (
        <button
          onClick={handleClearHistory}
          className="rounded-md bg-red-200 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-300"
          title="Clear History"
        >
          Clear
        </button>
      )}

      {/* History info tooltip */}
      {historyInfo.totalCount > 0 && (
        <div className="text-xs text-gray-500">
          {historyInfo.pastCount} undo • {historyInfo.futureCount} redo
        </div>
      )}
    </div>
  );
}
