import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardFilters, DashboardSettings, DashboardView } from '@/types/dashboard';

interface DashboardState {
  // Filters
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  // Settings
  settings: DashboardSettings;
  setSettings: (settings: Partial<DashboardSettings>) => void;
  resetSettings: () => void;

  // View state
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  // Data cache
  cachedData: Record<string, any>;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
  clearCache: () => void;

  // Selected items for drill-down
  selectedItems: Record<string, any>;
  setSelectedItem: (key: string, item: any) => void;
  clearSelectedItems: () => void;

  // Refresh control
  lastRefresh: Date | null;
  setLastRefresh: (date: Date) => void;
  needsRefresh: boolean;
  setNeedsRefresh: (needsRefresh: boolean) => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // today
  },
  modules: [],
  categories: [],
  status: [],
};

const defaultSettings: DashboardSettings = {
  theme: 'light',
  chartType: 'area',
  showAnimations: true,
  refreshInterval: 300000, // 5 minutes
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Filters
      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Settings
      settings: defaultSettings,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),

      // View state
      currentView: 'overview',
      setCurrentView: (view) => set({ currentView: view }),

      // UI state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      error: null,
      setError: (error) => set({ error }),

      // Data cache
      cachedData: {},
      setCachedData: (key, data) =>
        set((state) => ({
          cachedData: { ...state.cachedData, [key]: data },
        })),
      getCachedData: (key) => get().cachedData[key],
      clearCache: () => set({ cachedData: {} }),

      // Selected items
      selectedItems: {},
      setSelectedItem: (key, item) =>
        set((state) => ({
          selectedItems: { ...state.selectedItems, [key]: item },
        })),
      clearSelectedItems: () => set({ selectedItems: {} }),

      // Refresh control
      lastRefresh: null,
      setLastRefresh: (date) => set({ lastRefresh: date }),
      needsRefresh: false,
      setNeedsRefresh: (needsRefresh) => set({ needsRefresh }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        filters: state.filters,
        settings: state.settings,
        currentView: state.currentView,
        cachedData: state.cachedData,
      }),
    }
  )
);
