/**
 * Custom hook for undo/redo functionality
 */

import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T | null;
  future: T[];
}

interface UseEditorHistoryReturn<T> {
  state: T | null;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushState: (newState: T) => void;
  reset: (initialState: T) => void;
}

const MAX_HISTORY = 50; // Limit history to prevent memory issues

export function useEditorHistory<T>(initialState: T | null = null): UseEditorHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    setHistory((prev) => {
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: prev.present ? [prev.present, ...prev.future] : prev.future,
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setHistory((prev) => {
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: prev.present ? [...prev.past, prev.present] : prev.past,
        present: next,
        future: newFuture,
      };
    });
  }, [canRedo]);

  const pushState = useCallback((newState: T) => {
    setHistory((prev) => {
      // Don't add duplicate states
      if (JSON.stringify(prev.present) === JSON.stringify(newState)) {
        return prev;
      }

      let newPast = prev.present ? [...prev.past, prev.present] : prev.past;

      // Limit history size
      if (newPast.length > MAX_HISTORY) {
        newPast = newPast.slice(-MAX_HISTORY);
      }

      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new state is pushed
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    reset,
  };
}
