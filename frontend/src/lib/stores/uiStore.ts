'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
  read: boolean;
}

export type ModalType =
  | 'confirmation'
  | 'export-preview'
  | 'blueprint-details'
  | 'settings'
  | 'help'
  | 'none';

export interface ModalState {
  type: ModalType;
  isOpen: boolean;
  data?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

export interface UIState {
  // Navigation state
  currentPage: string;
  sidebarState: SidebarState;
  breadcrumbs: Array<{ label: string; href?: string }>;

  // Modal management
  modal: ModalState;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;

  // Theme and preferences
  theme: 'light' | 'dark' | 'system';
  sidebarWidth: number;
  compactMode: boolean;

  // Navigation actions
  setCurrentPage: (page: string) => void;
  setSidebarState: (state: SidebarState) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void;
  addBreadcrumb: (breadcrumb: { label: string; href?: string }) => void;
  removeBreadcrumb: (index: number) => void;

  // Modal actions
  openModal: (type: ModalType, data?: any, onConfirm?: () => void, onCancel?: () => void) => void;
  closeModal: () => void;
  setModalData: (data: any) => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  clearLoadingState: (key: string) => void;
  clearAllLoadingStates: () => void;

  // Theme and preference actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarWidth: (width: number) => void;
  setCompactMode: (compact: boolean) => void;

  // Utility actions
  reset: () => void;
}

const defaultModal: ModalState = {
  type: 'none',
  isOpen: false,
  data: undefined,
  onConfirm: undefined,
  onCancel: undefined,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Navigation state
      currentPage: '/',
      sidebarState: 'expanded',
      breadcrumbs: [],

      // Modal management
      modal: defaultModal,

      // Notifications
      notifications: [],
      unreadCount: 0,

      // Loading states
      globalLoading: false,
      loadingStates: {},

      // Theme and preferences
      theme: 'system',
      sidebarWidth: 280,
      compactMode: false,

      // Navigation actions
      setCurrentPage: (page) => set({ currentPage: page }),

      setSidebarState: (state) => set({ sidebarState: state }),

      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      addBreadcrumb: (breadcrumb) => {
        set((state) => ({
          breadcrumbs: [...state.breadcrumbs, breadcrumb],
        }));
      },

      removeBreadcrumb: (index) => {
        set((state) => ({
          breadcrumbs: state.breadcrumbs.filter((_, i) => i !== index),
        }));
      },

      // Modal actions
      openModal: (type, data, onConfirm, onCancel) => {
        set({
          modal: {
            type,
            isOpen: true,
            data,
            onConfirm,
            onCancel,
          },
        });
      },

      closeModal: () => {
        set({ modal: defaultModal });
      },

      setModalData: (data) => {
        set((state) => ({
          modal: { ...state.modal, data },
        }));
      },

      // Notification actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Auto-remove notification after duration
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          };
        });
      },

      markNotificationRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.read) {
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
              unreadCount: state.unreadCount - 1,
            };
          }
          return state;
        });
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      // Loading actions
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      setLoadingState: (key, loading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        }));
      },

      clearLoadingState: (key) => {
        set((state) => {
          const newStates = { ...state.loadingStates };
          delete newStates[key];
          return { loadingStates: newStates };
        });
      },

      clearAllLoadingStates: () => {
        set({ loadingStates: {} });
      },

      // Theme and preference actions
      setTheme: (theme) => set({ theme }),

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      setCompactMode: (compact) => set({ compactMode: compact }),

      // Utility actions
      reset: () => {
        set({
          currentPage: '/',
          sidebarState: 'expanded',
          breadcrumbs: [],
          modal: defaultModal,
          notifications: [],
          unreadCount: 0,
          globalLoading: false,
          loadingStates: {},
          theme: 'system',
          sidebarWidth: 280,
          compactMode: false,
        });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        compactMode: state.compactMode,
        sidebarState: state.sidebarState,
      }),
    }
  )
);
