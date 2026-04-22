'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CustomReport, Annotation } from '@/store/blueprintStore';

interface Section {
  id: string;
  title: string;
  type: string;
  content: unknown;
}

interface BlueprintSidebarData {
  blueprintId: string;
  sections: Section[];
  pinnedSections: string[];
  hiddenSections: string[];
  activeSection: string | null;
  customReports: CustomReport[];
  annotations: Record<string, Annotation[]>;
  isPublicView: boolean;
  onNavigate: (sectionId: string) => void;
  onTogglePin: (sectionId: string) => void;
  onToggleHide: (sectionId: string) => void;
  onCreateReport: (report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateReport: (reportId: string, updates: Partial<CustomReport>) => void;
  onDeleteReport: (reportId: string) => void;
  onAddAnnotation: (sectionId: string, content: string) => void;
  onUpdateAnnotation: (sectionId: string, annotationId: string, content: string) => void;
  onDeleteAnnotation: (sectionId: string, annotationId: string) => void;
}

interface BlueprintSidebarContextType {
  isActiveBlueprintPage: boolean;
  blueprintData: BlueprintSidebarData | null;
  setActiveBlueprintPage: (active: boolean, data?: BlueprintSidebarData) => void;
}

const BlueprintSidebarContext = createContext<BlueprintSidebarContextType | undefined>(undefined);

export function BlueprintSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isActiveBlueprintPage, setIsActiveBlueprintPage] = useState(false);
  const [blueprintData, setBlueprintData] = useState<BlueprintSidebarData | null>(null);

  const setActiveBlueprintPage = useCallback((active: boolean, data?: BlueprintSidebarData) => {
    setIsActiveBlueprintPage(active);
    setBlueprintData(data || null);
  }, []);

  return (
    <BlueprintSidebarContext.Provider
      value={{
        isActiveBlueprintPage,
        blueprintData,
        setActiveBlueprintPage,
      }}
    >
      {children}
    </BlueprintSidebarContext.Provider>
  );
}

export function useBlueprintSidebar() {
  const context = useContext(BlueprintSidebarContext);
  if (context === undefined) {
    throw new Error('useBlueprintSidebar must be used within a BlueprintSidebarProvider');
  }
  return context;
}
