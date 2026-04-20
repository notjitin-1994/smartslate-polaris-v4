'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DrillDownState {
  path: string[];
  data: unknown;
  filters: Record<string, unknown>;
}

interface DrillDownContextType {
  drillDownState: DrillDownState | null;
  setDrillDownState: (state: DrillDownState | null) => void;
  drillDown: (path: string[], data: unknown, filters?: Record<string, unknown>) => void;
  drillUp: () => void;
  resetDrillDown: () => void;
}

const DrillDownContext = createContext<DrillDownContextType | undefined>(undefined);

interface DrillDownProviderProps {
  children: ReactNode;
}

export function DrillDownProvider({ children }: DrillDownProviderProps): React.JSX.Element {
  const [drillDownState, setDrillDownState] = useState<DrillDownState | null>(null);

  const drillDown = (path: string[], data: unknown, filters: Record<string, unknown> = {}) => {
    setDrillDownState({
      path: [...(drillDownState?.path || []), ...path],
      data,
      filters: { ...(drillDownState?.filters || {}), ...filters },
    });
  };

  const drillUp = () => {
    if (drillDownState && drillDownState.path.length > 0) {
      const newPath = [...drillDownState.path];
      newPath.pop();
      setDrillDownState({
        ...drillDownState,
        path: newPath,
      });
    }
  };

  const resetDrillDown = () => {
    setDrillDownState(null);
  };

  const value: DrillDownContextType = {
    drillDownState,
    setDrillDownState,
    drillDown,
    drillUp,
    resetDrillDown,
  };

  return <DrillDownContext.Provider value={value}>{children}</DrillDownContext.Provider>;
}

export function useDrillDown(): DrillDownContextType {
  const context = useContext(DrillDownContext);
  if (context === undefined) {
    throw new Error('useDrillDown must be used within a DrillDownProvider');
  }
  return context;
}
