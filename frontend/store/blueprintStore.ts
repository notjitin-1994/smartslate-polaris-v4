/**
 * Blueprint Viewer State Management
 * Zustand store for complex UI state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ViewMode = 'dashboard' | 'document' | 'presentation' | 'focus';
export type LayoutMode = 'comfortable' | 'compact' | 'spacious';

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  sections: string[];
  layout: 'dashboard' | 'document' | 'presentation';
  theme: ReportTheme;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTheme {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  spacing: 'tight' | 'normal' | 'relaxed';
}

export interface Annotation {
  id: string;
  sectionId: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlueprintState {
  // View settings
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  showSidebar: boolean;
  showMinimap: boolean;
  showAnnotations: boolean;
  showTableOfContents: boolean;

  // Navigation
  searchQuery: string;
  activeSection: string | null;
  readingProgress: number;

  // Content management
  pinnedSections: string[];
  hiddenSections: string[];
  collapsedSections: string[];

  // Reports
  customReports: CustomReport[];
  activeReportId: string | null;

  // Annotations
  annotations: Record<string, Annotation[]>;

  // AI features
  aiRecommendations: string[];
  aiInsights: Record<string, string>;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleSidebar: () => void;
  toggleMinimap: () => void;
  toggleAnnotations: () => void;
  toggleTableOfContents: () => void;

  setSearchQuery: (query: string) => void;
  setActiveSection: (sectionId: string | null) => void;
  setReadingProgress: (progress: number) => void;

  togglePinSection: (sectionId: string) => void;
  toggleHideSection: (sectionId: string) => void;
  toggleCollapseSection: (sectionId: string) => void;

  addCustomReport: (report: Omit<CustomReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomReport: (reportId: string, updates: Partial<CustomReport>) => void;
  deleteCustomReport: (reportId: string) => void;
  setActiveReport: (reportId: string | null) => void;

  addAnnotation: (
    sectionId: string,
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateAnnotation: (sectionId: string, annotationId: string, content: string) => void;
  deleteAnnotation: (sectionId: string, annotationId: string) => void;

  setAiRecommendations: (recommendations: string[]) => void;
  setAiInsight: (sectionId: string, insight: string) => void;

  resetState: () => void;
}

const initialState = {
  viewMode: 'dashboard' as ViewMode,
  layoutMode: 'comfortable' as LayoutMode,
  showSidebar: true,
  showMinimap: false,
  showAnnotations: false,
  showTableOfContents: false,

  searchQuery: '',
  activeSection: null,
  readingProgress: 0,

  pinnedSections: [],
  hiddenSections: [],
  collapsedSections: [],

  customReports: [],
  activeReportId: null,

  annotations: {},

  aiRecommendations: [],
  aiInsights: {},
};

export const useBlueprintStore = create<BlueprintState>()(
  persist(
    (set) => ({
      ...initialState,

      // View actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
      toggleAnnotations: () => set((state) => ({ showAnnotations: !state.showAnnotations })),
      toggleTableOfContents: () =>
        set((state) => ({ showTableOfContents: !state.showTableOfContents })),

      // Navigation actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveSection: (sectionId) => set({ activeSection: sectionId }),
      setReadingProgress: (progress) => set({ readingProgress: progress }),

      // Content management actions
      togglePinSection: (sectionId) =>
        set((state) => {
          const index = state.pinnedSections.indexOf(sectionId);
          const newPinned = [...state.pinnedSections];
          if (index > -1) {
            newPinned.splice(index, 1);
          } else {
            newPinned.push(sectionId);
          }
          return { pinnedSections: newPinned };
        }),

      toggleHideSection: (sectionId) =>
        set((state) => {
          const index = state.hiddenSections.indexOf(sectionId);
          const newHidden = [...state.hiddenSections];
          if (index > -1) {
            newHidden.splice(index, 1);
          } else {
            newHidden.push(sectionId);
          }
          return { hiddenSections: newHidden };
        }),

      toggleCollapseSection: (sectionId) =>
        set((state) => {
          const index = state.collapsedSections.indexOf(sectionId);
          const newCollapsed = [...state.collapsedSections];
          if (index > -1) {
            newCollapsed.splice(index, 1);
          } else {
            newCollapsed.push(sectionId);
          }
          return { collapsedSections: newCollapsed };
        }),

      // Report actions
      addCustomReport: (report) =>
        set((state) => {
          const newReport: CustomReport = {
            ...report,
            id: `report-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return {
            customReports: [...state.customReports, newReport],
            activeReportId: newReport.id,
          };
        }),

      updateCustomReport: (reportId, updates) =>
        set((state) => ({
          customReports: state.customReports.map((r) =>
            r.id === reportId ? { ...r, ...updates, updatedAt: new Date() } : r
          ),
        })),

      deleteCustomReport: (reportId) =>
        set((state) => ({
          customReports: state.customReports.filter((r) => r.id !== reportId),
          activeReportId: state.activeReportId === reportId ? null : state.activeReportId,
        })),

      setActiveReport: (reportId) => set({ activeReportId: reportId }),

      // Annotation actions
      addAnnotation: (sectionId, annotation) =>
        set((state) => {
          const newAnnotation: Annotation = {
            ...annotation,
            id: `annotation-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const currentAnnotations = state.annotations[sectionId] || [];
          return {
            annotations: {
              ...state.annotations,
              [sectionId]: [...currentAnnotations, newAnnotation],
            },
          };
        }),

      updateAnnotation: (sectionId, annotationId, content) =>
        set((state) => {
          const annotations = state.annotations[sectionId];
          if (!annotations) return {};

          return {
            annotations: {
              ...state.annotations,
              [sectionId]: annotations.map((a) =>
                a.id === annotationId ? { ...a, content, updatedAt: new Date() } : a
              ),
            },
          };
        }),

      deleteAnnotation: (sectionId, annotationId) =>
        set((state) => {
          const annotations = state.annotations[sectionId];
          if (!annotations) return {};

          return {
            annotations: {
              ...state.annotations,
              [sectionId]: annotations.filter((a) => a.id !== annotationId),
            },
          };
        }),

      // AI actions
      setAiRecommendations: (recommendations) => set({ aiRecommendations: recommendations }),

      setAiInsight: (sectionId, insight) =>
        set((state) => ({
          aiInsights: {
            ...state.aiInsights,
            [sectionId]: insight,
          },
        })),

      // Reset action
      resetState: () => set(initialState),
    }),
    {
      name: 'blueprint-viewer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewMode: state.viewMode,
        layoutMode: state.layoutMode,
        showSidebar: state.showSidebar,
        showMinimap: state.showMinimap,
        showAnnotations: state.showAnnotations,
        pinnedSections: state.pinnedSections,
        hiddenSections: state.hiddenSections,
        customReports: state.customReports,
        annotations: state.annotations,
      }),
    }
  )
);
