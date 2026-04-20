import type { ActionHistory, StateSnapshot } from './types';

// Action history store for undo/redo functionality
export class ActionHistoryManager {
  private history: ActionHistory;
  private maxHistorySize: number;

  constructor(maxHistorySize = 50) {
    this.maxHistorySize = maxHistorySize;
    this.history = {
      past: [],
      present: null,
      future: [],
      maxHistorySize,
    };
  }

  // Add a new action to history
  addAction(action: string, state: any, description?: string): void {
    const snapshot: StateSnapshot = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      state: this.deepClone(state),
      description,
    };

    // Move current present to past
    if (this.history.present) {
      this.history.past.push(this.history.present);
    }

    // Set new present
    this.history.present = snapshot;

    // Clear future (can't redo after new action)
    this.history.future = [];

    // Trim history if it exceeds max size
    this.trimHistory();
  }

  // Undo last action
  undo(): StateSnapshot | null {
    if (this.history.past.length === 0) {
      return null;
    }

    // Move present to future
    if (this.history.present) {
      this.history.future.unshift(this.history.present);
    }

    // Move last past to present
    this.history.present = this.history.past.pop() || null;

    return this.history.present;
  }

  // Redo next action
  redo(): StateSnapshot | null {
    if (this.history.future.length === 0) {
      return null;
    }

    // Move present to past
    if (this.history.present) {
      this.history.past.push(this.history.present);
    }

    // Move first future to present
    this.history.present = this.history.future.shift() || null;

    return this.history.present;
  }

  // Check if undo is possible
  canUndo(): boolean {
    return this.history.past.length > 0 || this.history.present !== null;
  }

  // Check if redo is possible
  canRedo(): boolean {
    return this.history.future.length > 0;
  }

  // Get current state
  getCurrentState(): any {
    return this.history.present?.state || null;
  }

  // Get history information
  getHistoryInfo(): {
    pastCount: number;
    futureCount: number;
    totalCount: number;
    currentAction?: string;
  } {
    return {
      pastCount: this.history.past.length,
      futureCount: this.history.future.length,
      totalCount:
        this.history.past.length + this.history.future.length + (this.history.present ? 1 : 0),
      currentAction: this.history.present?.action,
    };
  }

  // Clear all history
  clear(): void {
    this.history = {
      past: [],
      present: null,
      future: [],
      maxHistorySize: this.maxHistorySize,
    };
  }

  // Get history as array (for debugging)
  getHistoryArray(): StateSnapshot[] {
    return [
      ...this.history.past,
      ...(this.history.present ? [this.history.present] : []),
      ...this.history.future,
    ];
  }

  // Trim history to max size
  private trimHistory(): void {
    while (this.history.past.length > this.maxHistorySize) {
      this.history.past.shift();
    }
  }

  // Deep clone utility
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item));
    }

    if (typeof obj === 'object') {
      const cloned: any = {};
      Object.keys(obj).forEach((key) => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }

    return obj;
  }
}

// Global action history manager instance
export const actionHistory = new ActionHistoryManager();

// Zustand middleware for action history
export const withActionHistory =
  <T extends object>(config: any, historyManager: ActionHistoryManager = actionHistory) =>
  (set: any, get: any, api: any) => {
    const store = config(
      (...args: any[]) => {
        const result = set(...args);

        // Add action to history
        const currentState = get();
        historyManager.addAction('state_update', currentState, 'State updated');

        return result;
      },
      get,
      api
    );

    return {
      ...store,
      // Add history methods to store
      undo: () => {
        const previousState = historyManager.undo();
        if (previousState) {
          set(previousState.state);
        }
      },
      redo: () => {
        const nextState = historyManager.redo();
        if (nextState) {
          set(nextState.state);
        }
      },
      canUndo: () => historyManager.canUndo(),
      canRedo: () => historyManager.canRedo(),
      getHistoryInfo: () => historyManager.getHistoryInfo(),
      clearHistory: () => historyManager.clear(),
    };
  };

// Keyboard shortcuts for undo/redo
export const setupKeyboardShortcuts = (store: any) => {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Check for Ctrl+Z (undo) or Ctrl+Y (redo)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (store.canUndo()) {
          store.undo();
        }
      } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
        event.preventDefault();
        if (store.canRedo()) {
          store.redo();
        }
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};
